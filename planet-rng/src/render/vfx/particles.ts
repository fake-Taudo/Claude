// Pooled particle layer. Particles live in local reference pixels around the layer anchor,
// carry a depth z (-1 far .. 1 near) for back/front splitting and depth staging, and
// follow one movement law from the spec.

import type { Col, EmitShape, MoveSpec, ParticleLayer as Spec, Slot, SpriteKind } from '../../config/vfx/types';
import { mix, spectral } from '../color';
import { blit, D, type AuraInstance, type FrameEnv, Layer, projectOrbit, xform } from './core';
import { clamp01, DEG, noise1, Rng, smooth, TAU } from './math';
import { glintTex, spriteTex, streakTex, type Tex } from './tex';

class P {
  x = 0;
  y = 0;
  z = 0;
  px = 0;
  py = 0;
  vx = 0;
  vy = 0;
  age = 0;
  life = 1;
  size = 1;
  ci = 0;
  rot = 0;
  vrot = 0;
  seed = 0;
  ang = 0;
  rad = 0;
  r0 = 1;
  spd = 0;
  ox = 0;
  oy = 0;
  alive = false;
  glint = false;
  burst = false;
}

/** Sprites that are drawn rotated (asymmetric shapes). */
const ROTATED = new Set<SpriteKind>(['feather', 'shard', 'crystal', 'flake', 'ash', 'petal', 'chunk', 'leaf', 'rune', 'gear', 'droplet', 'ember', 'wisp']);
/** Sprites oriented along the velocity instead of spinning. */
const ALONG = new Set<SpriteKind>(['droplet', 'ember', 'wisp']);

const tmp = { x: 0, y: 0, z: 0 };
const SPECTRUM_STEPS = 24;

export class ParticleLayer extends Layer<Spec> {
  private pool: P[] = [];
  private bursts: P[] = [];
  private rng: Rng;
  private colors: Col[];
  private texs: Tex[][] = [];
  private spectrum: Tex[] | null = null;
  private trail: Tex[] = [];
  private glint: Tex;
  private active = 0;
  private ax: number;
  private ay: number;

  constructor(spec: Spec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.rng = new Rng(inst.seed + index * 7919);
    this.colors = Array.isArray(spec.color) ? spec.color : [spec.color];
    this.ax = (spec.at?.[0] ?? 0) * D;
    this.ay = (spec.at?.[1] ?? 0) * D;
    const fadeSteps = spec.fadeTo ? 4 : 1;
    this.texs = this.colors.map((c) => {
      const base = inst.colStatic(c);
      const out: Tex[] = [];
      for (let k = 0; k < fadeSteps; k++) {
        const col = spec.fadeTo ? mix(base, inst.colStatic(spec.fadeTo), k / (fadeSteps - 1)) : base;
        out.push(spriteTex(spec.sprite, col));
      }
      return out;
    });
    if (this.colors.includes('spectrum')) {
      this.spectrum = [];
      for (let i = 0; i < SPECTRUM_STEPS; i++) this.spectrum.push(spriteTex(spec.sprite, spectral((i * 360) / SPECTRUM_STEPS)));
    }
    if (spec.trail) this.trail = this.colors.map((c) => streakTex(inst.colStatic(c)));
    this.glint = glintTex(inst.colStatic(this.colors[0]));
    for (let i = 0; i < spec.count; i++) this.pool.push(new P());
    for (let i = 0; i < (spec.burst ?? 0); i++) this.bursts.push(new P());
    // Pre-warm: start with a steady population at random ages.
    for (const p of this.pool) {
      this.spawn(p, false);
      p.age = this.rng.next() * p.life;
      this.advance(p, 0, 0);
    }
  }

  protected override defaultSlot(): Slot {
    return 'particles';
  }

  override particles(): number {
    let n = 0;
    for (let i = 0; i < this.active; i++) if (this.pool[i].alive) n++;
    for (const b of this.bursts) if (b.alive) n++;
    return n;
  }

  private spawn(p: P, burst: boolean): void {
    const s = this.spec;
    const r = this.rng;
    p.alive = true;
    p.burst = burst;
    p.age = 0;
    p.life = r.range(s.life[0], s.life[1]) * (burst ? 0.8 : 1);
    p.size = r.range(s.size[0], s.size[1]) * D;
    p.ci = Math.floor(r.next() * this.colors.length);
    p.seed = r.next() * 1000;
    p.rot = r.next() * TAU;
    p.vrot = (s.spin ?? 0) * DEG * r.sign() * r.range(0.6, 1.2);
    p.glint = r.next() < (s.glint ?? 0);
    p.vx = 0;
    p.vy = 0;
    this.emit(p, s.emit);
    this.startMove(p, s.move, burst);
    p.px = p.x;
    p.py = p.y;
  }

  private emit(p: P, e: EmitShape): void {
    const r = this.rng;
    const split = this.spec.split !== false && !this.spec.depth;
    p.z = split ? r.range(-1, 1) : 0;
    switch (e.shape) {
      case 'ring':
      case 'disc': {
        const rr = (e.shape === 'disc' ? Math.sqrt(r.next()) : r.next()) * (e.radius[1] - e.radius[0]) + e.radius[0];
        const rad = rr * D;
        const phi = r.next() * TAU;
        p.ang = phi;
        p.rad = rad;
        p.r0 = rad;
        const plane = e.plane ?? 'screen';
        if (plane === 'screen') {
          p.x = Math.cos(phi) * rad;
          p.y = Math.sin(phi) * rad;
        } else if (plane === 'ground') {
          p.x = Math.cos(phi) * rad;
          p.y = this.inst.groundY - this.ay + Math.sin(phi) * rad * this.inst.groundSquash;
          if (split) p.z = Math.sin(phi);
        } else {
          const roll = (e.shape === 'ring' ? e.roll ?? 0 : 0) * DEG;
          const tilt = e.shape === 'ring' ? e.tilt ?? 0.35 : 0.35;
          projectOrbit(rad, phi, tilt, roll, tmp);
          p.x = tmp.x;
          p.y = tmp.y;
          if (split) p.z = tmp.z;
        }
        break;
      }
      case 'sphere': {
        const rad = r.range(e.radius[0], e.radius[1]) * D;
        const phi = r.next() * TAU;
        const el = Math.asin(r.range(-1, 1));
        p.x = Math.cos(phi) * Math.cos(el) * rad;
        p.y = Math.sin(el) * rad;
        if (split) p.z = Math.sin(phi) * Math.cos(el);
        p.ang = phi;
        p.rad = rad;
        p.r0 = rad;
        break;
      }
      case 'point': {
        const sp = (e.spread ?? 0) * D;
        const a = r.next() * TAU;
        const d = Math.sqrt(r.next()) * sp;
        p.x = e.at[0] * D + Math.cos(a) * d;
        p.y = e.at[1] * D + Math.sin(a) * d;
        break;
      }
      case 'box':
        p.x = r.range(e.x[0], e.x[1]) * D;
        p.y = r.range(e.y[0], e.y[1]) * D;
        break;
      case 'arc': {
        const a = r.range(e.from, e.to) * DEG;
        const rad = r.range(e.radius[0], e.radius[1]) * D;
        p.x = Math.cos(a) * rad;
        p.y = Math.sin(a) * rad;
        p.ang = a;
        p.rad = rad;
        break;
      }
    }
    p.ox = p.x;
    p.oy = p.y;
  }

  private startMove(p: P, m: MoveSpec, burst: boolean): void {
    const r = this.rng;
    const boost = burst ? this.spec.burstSpeed ?? 2.5 : 1;
    switch (m.kind) {
      case 'drift': {
        const a = (m.dir + r.range(-1, 1) * (m.spread ?? 0)) * DEG;
        const sp = r.range(m.speed[0], m.speed[1]) * D * boost;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp;
        break;
      }
      case 'orbit':
      case 'spiral':
        p.spd = r.range(m.speed[0], m.speed[1]) * DEG * (burst ? 1.6 : 1);
        if (p.rad === 0) {
          p.rad = Math.hypot(p.x, p.y);
          p.ang = Math.atan2(p.y, p.x);
          p.r0 = p.rad;
        }
        break;
      case 'radial': {
        const a = Math.atan2(p.y, p.x) + r.range(-0.15, 0.15);
        const sp = r.range(m.speed[0], m.speed[1]) * D * boost;
        p.vx = Math.cos(a) * sp;
        p.vy = Math.sin(a) * sp;
        break;
      }
      case 'flow':
        p.spd = r.range(m.speed[0], m.speed[1]) * D;
        break;
      case 'path':
        p.spd = r.range(m.speed[0], m.speed[1]);
        p.ang = r.next();
        p.rad = r.range(0.6, 1);
        p.r0 = r.next() * TAU;
        break;
      case 'still':
        break;
    }
  }

  /** Moves a particle by dt (motion already includes the reduced multiplier). */
  private advance(p: P, dt: number, clock: number): void {
    const m = this.spec.move;
    p.px = p.x;
    p.py = p.y;
    switch (m.kind) {
      case 'drift': {
        if (m.gravity) p.vy += m.gravity * D * dt;
        if (m.drag) {
          const k = Math.max(0, 1 - m.drag * dt);
          p.vx *= k;
          p.vy *= k;
        }
        p.ox += p.vx * dt;
        p.oy += p.vy * dt;
        const sway = m.sway ? Math.sin(p.age * (m.swayHz ?? 0.4) * TAU + p.seed) * m.sway * D : 0;
        p.x = p.ox + sway;
        p.y = p.oy;
        break;
      }
      case 'orbit': {
        p.ang += p.spd * dt;
        const wob = m.wobble ? Math.sin(p.age * 0.7 + p.seed) * m.wobble * D : 0;
        projectOrbit(p.rad + wob, p.ang, m.tilt, (m.roll ?? 0) * DEG, tmp);
        p.x = tmp.x;
        p.y = tmp.y - (m.rise ?? 0) * D * p.age;
        if (this.spec.split !== false && !this.spec.depth) p.z = tmp.z;
        break;
      }
      case 'spiral': {
        const k = 1 - p.rad / Math.max(1, p.r0);
        const acc = 1 + (m.accel ?? 0) * k * k;
        p.ang += p.spd * acc * dt;
        p.rad = Math.max(0, p.rad - m.inward * D * acc * dt);
        projectOrbit(p.rad, p.ang, m.tilt ?? 1, (m.roll ?? 0) * DEG, tmp);
        p.x = tmp.x;
        p.y = tmp.y;
        if (this.spec.split !== false && !this.spec.depth) p.z = tmp.z;
        if (p.rad < D * 0.06 && m.inward > 0) p.age = p.life;
        break;
      }
      case 'radial':
        if (m.drag) {
          const k = Math.max(0, 1 - m.drag * dt);
          p.vx *= k;
          p.vy *= k;
        }
        if (m.gravity) p.vy += m.gravity * D * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      case 'flow': {
        const a = noise1(p.x * 0.004 * m.scale + clock * 0.05, 3) * TAU + noise1(p.y * 0.004 * m.scale - clock * 0.04, 7) * TAU;
        p.vx += (Math.cos(a) * p.spd - p.vx) * Math.min(1, dt * 1.5);
        p.vy += (Math.sin(a) * p.spd - p.vy) * Math.min(1, dt * 1.5);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        break;
      }
      case 'path': {
        p.ang = (p.ang + p.spd * dt) % 1;
        this.pathPoint(p, m);
        break;
      }
      case 'still':
        break;
    }
    if (p.vrot && !ALONG.has(this.spec.sprite)) p.rot += p.vrot * dt;
  }

  private pathPoint(p: P, m: Extract<MoveSpec, { kind: 'path' }>): void {
    const size = m.size * D;
    const t = p.ang * TAU;
    const spread = (m.spreadD ?? 0.04) * D * (p.rad - 0.8) * 5;
    switch (m.path) {
      case 'lemniscate': {
        const den = 1 + Math.sin(t) ** 2;
        const x = (size * Math.cos(t)) / den;
        const y = (size * Math.sin(t) * Math.cos(t)) / den;
        p.x = x + spread * Math.cos(t * 3 + p.seed);
        p.y = y * (m.tilt ?? 1) + spread * Math.sin(t * 2 + p.seed);
        p.z = Math.cos(t);
        break;
      }
      case 'field': {
        // Dipole field line r = L sin^2(theta), azimuth phi stored in r0.
        const th = 0.25 + t * 0.5 * (Math.PI - 0.5) / Math.PI;
        const L = size * p.rad;
        const r = L * Math.sin(th) ** 2;
        const xr = r * Math.sin(th);
        const yr = -r * Math.cos(th);
        const phi = p.r0;
        const x3 = xr * Math.cos(phi);
        const z3 = xr * Math.sin(phi);
        const roll = (m.roll ?? 0) * DEG;
        p.x = x3 * Math.cos(roll) - yr * Math.sin(roll);
        p.y = x3 * Math.sin(roll) + yr * Math.cos(roll);
        p.z = z3 / Math.max(1, size);
        break;
      }
      case 'mobius': {
        const R = size;
        const v = (p.rad - 0.8) * 5 * size * 0.25;
        const x = (R + v * Math.cos(t / 2)) * Math.cos(t);
        const y = (R + v * Math.cos(t / 2)) * Math.sin(t);
        const z = v * Math.sin(t / 2);
        const squash = m.tilt ?? 0.4;
        const roll = (m.roll ?? 0) * DEG;
        const x2 = x;
        const y2 = y * squash - z * Math.sqrt(1 - squash * squash);
        p.x = x2 * Math.cos(roll) - y2 * Math.sin(roll);
        p.y = x2 * Math.sin(roll) + y2 * Math.cos(roll);
        p.z = Math.sin(t);
        break;
      }
      case 'stream': {
        // Spiral stream from outside in (one arm).
        const r = size * (1 - p.ang * 0.85);
        const a = p.r0 * 0.1 + p.ang * TAU * 1.6;
        projectOrbit(r, a, m.tilt ?? 0.4, (m.roll ?? 0) * DEG, tmp);
        p.x = tmp.x + spread;
        p.y = tmp.y;
        p.z = tmp.z;
        break;
      }
    }
  }

  override update(env: FrameEnv): void {
    const dt = env.dt * this.inst.motion;
    const want = Math.round(this.spec.count * env.q);
    this.active = Math.min(this.pool.length, want);
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.alive) {
        if (i < this.active) this.spawn(p, false);
        continue;
      }
      p.age += dt;
      if (p.age >= p.life) {
        if (i < this.active) this.spawn(p, false);
        else p.alive = false;
        continue;
      }
      this.advance(p, dt, env.clock);
    }
    if (this.inst.accent.fired && this.bursts.length && !env.reduced) {
      const n = Math.round(this.bursts.length * env.q);
      for (let i = 0; i < n; i++) this.spawn(this.bursts[i], true);
    }
    for (const p of this.bursts) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) p.alive = false;
      else this.advance(p, dt, env.clock);
    }
  }

  // Per-draw state (kept in fields so drawing allocates nothing).
  private fAlpha = 0;
  private fSplit = false;
  private fFront = false;
  private fFade: [number, number] = [0.15, 0.35];
  private fGrow: [number, number] = [1, 1];
  private fRotated = false;
  private fAlong = false;
  private fS = 1;

  draw(slot: Slot, env: FrameEnv): void {
    const s = this.spec;
    const split = s.split !== false && !s.depth;
    const own = this.slot;
    if (split ? slot !== own && slot !== 'heroBack' : slot !== own) return;
    const ctx = env.ctx;
    this.fAlpha = this.alpha();
    if (this.fAlpha <= 0.002) return;
    this.fSplit = split;
    this.fFront = slot === own;
    this.fFade = s.fade ?? [0.15, 0.35];
    this.fGrow = s.grow ?? [1, 1];
    this.fRotated = ROTATED.has(s.sprite);
    this.fAlong = ALONG.has(s.sprite);
    this.fS = env.view.s * this.inst.scale;
    ctx.globalCompositeOperation = s.blend === 'normal' ? 'source-over' : 'lighter';
    for (let i = 0; i < this.pool.length; i++) this.drawOne(this.pool[i], env);
    for (let i = 0; i < this.bursts.length; i++) this.drawOne(this.bursts[i], env);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawOne(p: P, env: FrameEnv): void {
    if (!p.alive) return;
    if (this.fSplit && (p.z >= 0) !== this.fFront) return;
    const s = this.spec;
    const ctx = env.ctx;
    const S = this.fS;
    const [fi, fo] = this.fFade;
    const [g0, g1] = this.fGrow;
    const k = p.age / p.life;
    let a = this.fAlpha * (fi > 0 ? smooth(k / fi) : 1) * (fo > 0 ? smooth((1 - k) / fo) : 1);
    if (s.twinkle) a *= 0.6 + 0.4 * Math.sin(p.age * Math.min(3, s.twinkle) * TAU + p.seed);
    const depth = this.fSplit ? 1 + p.z * 0.22 : 1;
    if (this.fSplit) a *= 0.7 + 0.3 * (p.z + 1) * 0.5;
    if (a <= 0.004) return;
    const size = p.size * (g0 + (g1 - g0) * k) * depth;
    const tex = this.texFor(p, k, env.clock);
    const x = p.x + this.ax;
    const y = p.y + this.ay;
    ctx.globalAlpha = Math.min(1, a);
    if (s.trail) {
      const step = Math.max(1e-4, env.dt * this.inst.motion);
      const vx = (p.x - p.px) / step;
      const vy = (p.y - p.py) / step;
      const sp = Math.hypot(vx, vy);
      const len = Math.min(D * 1.6, sp * s.trail);
      if (len > size * 0.3) {
        const c = vx / sp;
        const sn = vy / sp;
        const L = len + size;
        ctx.setTransform(S * c, S * sn, -S * sn, S * c, env.view.tx + S * x, env.view.ty + S * y);
        ctx.drawImage(this.trail[p.ci % this.trail.length], -L + size * 0.5, -size * 0.45, L, size * 0.9);
      }
    }
    if (this.fRotated) {
      let rot = p.rot;
      if (this.fAlong) {
        const vx = p.x - p.px;
        const vy = p.y - p.py;
        if (vx * vx + vy * vy > 1e-6) rot = Math.atan2(vy, vx) + Math.PI / 2;
      }
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      ctx.setTransform(S * c, S * sn, -S * sn, S * c, env.view.tx + S * x, env.view.ty + S * y);
      ctx.drawImage(tex, -size, -size, size * 2, size * 2);
    } else {
      xform(env, this.inst, 0, 0);
      blit(ctx, tex, x, y, size * 2);
    }
    if (p.glint) {
      const g = Math.pow(Math.max(0, Math.sin(p.age * 1.3 + p.seed)), 24);
      if (g > 0.02) {
        xform(env, this.inst, 0, 0);
        ctx.globalAlpha = Math.min(1, a * g * 1.4);
        blit(ctx, this.glint, x, y, size * 5);
      }
    }
  }

  private texFor(p: P, k: number, clock: number): Tex {
    const c = this.colors[p.ci];
    if (c === 'spectrum' && this.spectrum) {
      const i = Math.floor((((clock * 40 + p.seed * 0.36) % 360) + 360) % 360 / (360 / SPECTRUM_STEPS)) % SPECTRUM_STEPS;
      return this.spectrum[i];
    }
    const list = this.texs[p.ci];
    return list[Math.min(list.length - 1, Math.floor(clamp01(k) * list.length))];
  }
}
