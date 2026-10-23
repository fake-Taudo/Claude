// Heroes of the V1-V2 auras (Flut, Sternschnuppe, Raureif, Sonnenwind, Sturm).

import type { HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { mix, rgba } from '../../color';
import { blit, D, type AuraInstance, type FrameEnv, projectOrbit, xform, xScreen } from '../core';
import { clamp01, DEG, easeOut, hash, Rng, schedule, smooth, TAU } from '../math';
import { glintTex, glowTex, puffTex, spriteTex, streakTex, type Tex } from '../tex';
import { glowStroke, Hero } from './base';

const tmp = { x: 0, y: 0, z: 0 };

// ---------------------------------------------------------------------------
// Flut: a liquid wave band around the planet. p: radius, amp, waves, tilt, roll, width,
// speed (deg/s of the travelling wave), color, deep, slosh (accent amplitude gain).
// ---------------------------------------------------------------------------

export class WaveRing extends Hero {
  private n = 132;
  private xs = new Float32Array(this.n + 1);
  private ys = new Float32Array(this.n + 1);
  private zs = new Float32Array(this.n + 1);
  private hs = new Float32Array(this.n + 1);
  private foam: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.foam = glintTex('#e8f6ff');
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const R = this.num('radius', 0.82) * D * k;
    const amp = this.num('amp', 0.07) * D * (1 + this.num('slosh', 1.4) * this.inst.accent.env * (this.inst.reduced ? 0.3 : 1));
    const waves = this.num('waves', 5);
    const tilt = this.num('tilt', 0.3);
    const roll = this.num('roll', -8) * DEG;
    const t = env.clock * this.num('speed', 40) * DEG * this.inst.motion;
    for (let i = 0; i <= this.n; i++) {
      const phi = (i / this.n) * TAU;
      const h = amp * (Math.sin(waves * phi - t) + 0.35 * Math.sin(2 * waves * phi + t * 1.3 + 1));
      projectOrbit(R, phi, tilt, roll, tmp);
      this.xs[i] = this.ax + tmp.x;
      this.ys[i] = this.ay + tmp.y - h;
      this.zs[i] = tmp.z;
      this.hs[i] = h / Math.max(1, amp);
    }
  }

  private path(ctx: CanvasRenderingContext2D, front: boolean, dy: number): void {
    let open = false;
    for (let i = 0; i <= this.n; i++) {
      const on = (this.zs[i] >= 0) === front;
      if (on) {
        if (!open) {
          const j = Math.max(0, i - 1);
          ctx.moveTo(this.xs[j], this.ys[j] + dy);
          open = true;
        }
        ctx.lineTo(this.xs[i], this.ys[i] + dy);
      } else if (open) {
        ctx.lineTo(this.xs[i], this.ys[i] + dy);
        open = false;
      }
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha() * (front ? 1 : 0.7);
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const W = this.num('width', 0.09) * D;
    const hue = this.color('color', 'hue');
    const deep = this.color('deep', 'accent');
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pass = (w: number, c: string, al: number, dy: number) => {
      ctx.lineWidth = w;
      ctx.strokeStyle = rgba(c, Math.min(1, al * a));
      ctx.beginPath();
      this.path(ctx, front, dy);
      ctx.stroke();
    };
    pass(W * 3.2, deep, 0.24, W * 0.3);
    pass(W * 1.7, hue, 0.42, W * 0.1);
    pass(W * 0.75, mix(hue, '#ffffff', 0.35), 0.45, -W * 0.18);
    pass(W * 0.22, '#ffffff', 0.5, -W * 0.38);
    // Foam glints on the crests.
    for (let i = 0; i < this.n; i += 6) {
      if ((this.zs[i] >= 0) !== front || this.hs[i] < 0.95) continue;
      ctx.globalAlpha = Math.min(1, a * (this.hs[i] - 0.95) * 4);
      blit(ctx, this.foam, this.xs[i], this.ys[i] - W * 0.4, W * 2.6);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Sternschnuppe: shooting stars cross behind and in front of the planet and leave
// glittering dust that drifts down. p: every, life, speed, length, angle, size, spread,
// color, tail, sparkles. Accent: a shower of three parallel stars.
// ---------------------------------------------------------------------------

export class ShootingStars extends Hero {
  private head: Tex;
  private tail: Tex;
  private dust: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.head = glintTex(this.colorStatic('color', 'hue'));
    this.tail = streakTex(this.colorStatic('tail', 'accent'));
    this.dust = spriteTex('mote', this.colorStatic('color', 'hue'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const every = this.num('every', 2.6);
    const life = this.num('life', 1.2);
    const t = env.clock;
    const k0 = Math.floor(t / every);
    for (let k = k0 - 3; k <= k0; k++) {
      const t0 = k * every + hash(k * 13 + 1) * every * 0.5;
      this.star(slot, env, t - t0, k * 7 + 3, a, 0, 0);
    }
    const acc = this.inst.accent;
    if (acc.since < life + 2.2 && !this.inst.reduced) {
      for (let i = 0; i < 3; i++) this.star(slot, env, acc.since - i * 0.22, acc.index * 17 + 5, a, (i - 1) * 0.28, i * 0.22);
    }
  }

  private star(slot: Slot, env: FrameEnv, age: number, seed: number, a: number, offX: number, offY: number): void {
    const life = this.num('life', 1.2);
    const linger = 2;
    if (age < 0 || age > life + linger) return;
    const front = hash(seed) > 0.55;
    if (front !== (slot === 'heroFront')) return;
    const ctx = env.ctx;
    const ang = (this.num('angle', 152) + (hash(seed + 1) - 0.5) * 14) * DEG;
    const speed = this.num('speed', 2.6) * D;
    const spread = this.num('spread', 1.3) * D;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    // Start so the path crosses the planet region.
    const cx = (hash(seed + 2) - 0.5) * spread + offX * D;
    const cy = (hash(seed + 3) - 0.6) * spread * 0.8 + offY * D;
    const sx = this.ax + cx - dx * speed * life * 0.5;
    const sy = this.ay + cy - dy * speed * life * 0.5;
    const tt = Math.min(age, life);
    const hx = sx + dx * speed * tt;
    const hy = sy + dy * speed * tt;
    const size = this.num('size', 0.12) * D * (front ? 1.1 : 0.85);
    const depthA = front ? 1 : 0.75;
    ctx.globalCompositeOperation = 'lighter';
    if (age < life) {
      const fade = smooth(age / 0.15) * smooth((life - age) / 0.25);
      const len = Math.min(speed * age, this.num('length', 1.4) * D);
      const S = env.view.s * this.inst.scale;
      ctx.globalAlpha = Math.min(1, a * fade * depthA);
      ctx.setTransform(S * dx, S * dy, -S * dy, S * dx, env.view.tx + S * hx, env.view.ty + S * hy);
      ctx.drawImage(this.tail, -len, -size * 0.35, len + size * 0.3, size * 0.7);
      xform(env, this.inst, 0, 0);
      blit(ctx, this.head, hx, hy, size * 3.2);
    }
    // Glitter left behind: appears when the head passes, sinks slowly and fades.
    const n = this.num('sparkles', 9);
    xform(env, this.inst, 0, 0);
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const ts = f * life;
      const since = age - ts;
      if (since < 0) continue;
      const k = since / linger;
      if (k >= 1) continue;
      const jitter = (hash(seed * 31 + i) - 0.5) * size * 1.2;
      const px = sx + dx * speed * ts - dy * jitter;
      const py = sy + dy * speed * ts + dx * jitter + since * D * 0.12;
      ctx.globalAlpha = Math.min(1, a * depthA * Math.pow(1 - k, 1.5) * (0.6 + 0.4 * Math.sin(since * 6 + i)));
      blit(ctx, this.dust, px, py, size * 0.9 * (1 - k * 0.4));
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Raureif: a crown of frost ferns grows on an arc above the planet. p: radius (arc, D),
// from/to (arc angles in degrees, 180 = left, 270 = top), ferns, length (D), color, tips.
// Accent: a shimmer runs along the crown.
// ---------------------------------------------------------------------------

export class FrostCrown extends Hero {
  private tex: HTMLCanvasElement;
  private tips: [number, number][] = [];
  private glint: Tex;
  private half: number;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const R = this.num('radius', 0.9);
    const len = this.num('length', 0.5);
    this.half = (R + len) * 1.15;
    this.tex = this.bake(R, len);
    this.glint = glintTex('#ffffff');
  }

  /** Bakes the ferns into a texture. Units: D, centre = planet centre. */
  private bake(R: number, len: number): HTMLCanvasElement {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d')!;
    const k = S / 2 / this.half;
    ctx.translate(S / 2, S / 2);
    ctx.scale(k, k);
    ctx.lineCap = 'round';
    ctx.globalCompositeOperation = 'lighter';
    const col = this.colorStatic('color', 'hue');
    const rng = new Rng(this.inst.seed + 77);
    const from = this.num('from', 196) * DEG;
    const to = this.num('to', 344) * DEG;
    const ferns = this.num('ferns', 15);
    const branch = (x: number, y: number, ang: number, l: number, w: number, depth: number) => {
      const x1 = x + Math.cos(ang) * l;
      const y1 = y + Math.sin(ang) * l;
      for (const [lw, al, cc] of [[w * 5, 0.06, col], [w * 2.2, 0.2, col], [w, 0.8, mix(col, '#ffffff', 0.4)]] as [number, number, string][]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = rgba(cc, al);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      if (depth <= 0 || l < 0.03) {
        this.tips.push([x1, y1]);
        return;
      }
      const steps = 4;
      for (let s = 1; s <= steps; s++) {
        const f = s / (steps + 1);
        const bx = x + Math.cos(ang) * l * f;
        const by = y + Math.sin(ang) * l * f;
        const bl = l * 0.42 * (1 - f * 0.5);
        branch(bx, by, ang - 1.0 + rng.range(-0.1, 0.1), bl, w * 0.7, depth - 1);
        branch(bx, by, ang + 1.0 + rng.range(-0.1, 0.1), bl, w * 0.7, depth - 1);
      }
      branch(x1, y1, ang + rng.range(-0.15, 0.15), l * 0.5, w * 0.75, depth - 1);
    };
    for (let i = 0; i < ferns; i++) {
      const f = ferns > 1 ? i / (ferns - 1) : 0.5;
      const ang = from + (to - from) * f + rng.range(-0.04, 0.04);
      const centre = 1 - Math.abs(f - 0.5) * 1.2;
      const l = len * (0.55 + 0.45 * centre) * rng.range(0.85, 1.1);
      branch(Math.cos(ang) * R, Math.sin(ang) * R, ang, l, 0.012, 2);
    }
    // A soft frost band along the arc.
    ctx.lineWidth = 0.09;
    ctx.strokeStyle = rgba(col, 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, R, from, to);
    ctx.stroke();
    // Keep only some tips for twinkling glints.
    this.tips = this.tips.filter((_, i) => i % 7 === 0);
    return c;
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introK();
    const H = this.half * D;
    const br = 1 + 0.015 * this.inst.breathe(env.clock) * this.inst.motion;
    ctx.globalCompositeOperation = 'lighter';
    xScreen(env, this.inst, this.ax, this.ay, 0, br);
    ctx.save();
    if (k < 1) {
      // Grow outward from the planet.
      ctx.beginPath();
      ctx.arc(0, 0, D * (0.55 + (this.half - 0.55) * easeOut(k)), 0, TAU);
      ctx.clip();
    }
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(this.tex, -H, -H, H * 2, H * 2);
    const acc = this.inst.accent;
    if (acc.env > 0 && !this.inst.reduced) {
      const dur = this.inst.spec.motion.accent.duration ?? 1.6;
      const p = clamp01(acc.since / dur);
      const from = this.num('from', 196) * DEG;
      const to = this.num('to', 344) * DEG;
      const ang = from + (to - from) * p;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, H * 1.5, ang - 0.35, ang + 0.05);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = Math.min(1, acc.env * 1.2 * this.inst.alpha);
      ctx.drawImage(this.tex, -H, -H, H * 2, H * 2);
    }
    ctx.restore();
    // Twinkling tips (slow, max ~1 Hz).
    xScreen(env, this.inst, this.ax, this.ay, 0, br);
    for (let i = 0; i < this.tips.length; i++) {
      const tw = Math.pow(Math.max(0, Math.sin(env.clock * 0.9 + i * 2.1)), 6);
      if (tw < 0.05) continue;
      ctx.globalAlpha = Math.min(1, a * tw);
      blit(ctx, this.glint, this.tips[i][0] * D, this.tips[i][1] * D, D * 0.32);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Sonnenwind: bow shock on the sun side and charged particles streaming around the
// planet into a tail. p: standoff (D), height (D), width (D), color, color2, count,
// speed (D/s), from (spawn x in D), to (despawn x in D), gust (accent speed gain).
// ---------------------------------------------------------------------------

interface Ion {
  x: number;
  y: number;
  z: number;
  px: number;
  py: number;
  seed: number;
}

export class BowShock extends Hero {
  private ions: Ion[] = [];
  private rng: Rng;
  private streak: Tex[];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.rng = new Rng(inst.seed + 991);
    const n = this.num('count', 46);
    for (let i = 0; i < n; i++) {
      const ion = { x: 0, y: 0, z: 0, px: 0, py: 0, seed: this.rng.next() };
      this.respawn(ion, true);
      this.ions.push(ion);
    }
    this.streak = [streakTex(this.colorStatic('color', 'hue')), streakTex(this.colorStatic('color2', 'accent'))];
  }

  private respawn(ion: Ion, anywhere: boolean): void {
    const from = this.num('from', -2.6) * D;
    const to = this.num('to', 2.8) * D;
    ion.x = anywhere ? from + this.rng.next() * (to - from) : from - this.rng.next() * D * 0.4;
    ion.y = (this.rng.next() * 2 - 1) * this.num('height', 1.7) * D;
    ion.z = this.rng.next() < 0.5 ? -1 : 1;
    ion.px = ion.x;
    ion.py = ion.y;
  }

  override update(env: FrameEnv): void {
    const dt = env.dt * this.inst.motion;
    const a = this.num('standoff', 0.95) * D * 0.92;
    const U = this.num('speed', 1.1) * D * (1 + this.num('gust', 1.4) * this.inst.accent.env);
    const to = this.num('to', 2.8) * D;
    const want = Math.round(this.ions.length * env.q);
    for (let i = 0; i < this.ions.length; i++) {
      const ion = this.ions[i];
      if (i >= want) continue;
      ion.px = ion.x;
      ion.py = ion.y;
      // Potential flow around a cylinder of radius a: streamlines bend around the planet.
      const r2 = ion.x * ion.x + ion.y * ion.y;
      const r4 = r2 * r2 || 1;
      const u = U * (1 - (a * a * (ion.x * ion.x - ion.y * ion.y)) / r4);
      const v = (-U * 2 * a * a * ion.x * ion.y) / r4;
      ion.x += u * dt;
      ion.y += v * dt;
      if (ion.x > to || r2 < a * a * 0.8) this.respawn(ion, false);
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const front = slot === 'heroFront';
    const k = this.introScale();
    if (!front) this.drawBow(env, a * k);
    const S = env.view.s * this.inst.scale;
    const want = Math.round(this.ions.length * env.q);
    ctx.globalCompositeOperation = 'lighter';
    const from = this.num('from', -2.6) * D;
    const to = this.num('to', 2.8) * D;
    for (let i = 0; i < want; i++) {
      const ion = this.ions[i];
      if ((ion.z >= 0) !== front) continue;
      const vx = ion.x - ion.px;
      const vy = ion.y - ion.py;
      const sp = Math.hypot(vx, vy);
      if (sp < 1e-4) continue;
      const len = Math.min(D * 0.7, (sp / Math.max(1e-4, env.dt)) * 0.22) + D * 0.05;
      const edge = smooth((ion.x - from) / (D * 0.6)) * smooth((to - ion.x) / (D * 1.2));
      ctx.globalAlpha = Math.min(1, a * edge * (front ? 0.9 : 0.6) * (0.5 + ion.seed * 0.5));
      const c = vx / sp;
      const s = vy / sp;
      ctx.setTransform(S * c, S * s, -S * s, S * c, env.view.tx + S * (this.ax + ion.x), env.view.ty + S * (this.ay + ion.y));
      ctx.drawImage(this.streak[i % 2], -len, -D * 0.02, len, D * 0.04);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawBow(env: FrameEnv, a: number): void {
    const ctx = env.ctx;
    const so = this.num('standoff', 0.95) * D;
    const h = this.num('height', 1.7) * D;
    const curv = so * 1.15;
    const hue = this.color('color', 'hue');
    const acc = 1 + 0.8 * this.inst.accent.env;
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalCompositeOperation = 'lighter';
    const path = (off: number) => () => {
      for (let i = 0; i <= 40; i++) {
        const y = -h + (2 * h * i) / 40;
        const x = -so - off + (y * y) / (2 * curv);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };
    const shimmer = 0.85 + 0.15 * this.inst.breathe(env.clock);
    glowStroke(ctx, path(0), this.num('width', 0.05) * D, hue, a * shimmer * acc, 0.5);
    glowStroke(ctx, path(D * 0.12), this.num('width', 0.05) * D * 0.5, this.color('color2', 'accent'), a * 0.45 * acc, 0);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Sturm: a thunder cloud circles above the planet, lit from inside by heat flashes and
// the lightning of the accent. p: y (D), rx, ry (D), count, color (cloud), lit (glow),
// spin (deg/s), flashes [min,max] s.
// ---------------------------------------------------------------------------

export class StormCloud extends Hero {
  private puffs: { ang: number; rho: number; size: number; v: number; up: number }[] = [];
  private dark: Tex[];
  private lit: Tex[];
  private glow: Tex;
  private prevClock = -1;
  private heat = 0;
  private heatX = 0;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const rng = new Rng(inst.seed + 313);
    const n = this.num('count', 16);
    for (let i = 0; i < n; i++) {
      const rho = Math.sqrt(rng.next());
      this.puffs.push({ ang: rng.next() * TAU, rho, size: rng.range(0.55, 0.95) * (1.1 - rho * 0.35), v: i % 4, up: rng.next() });
    }
    const cloud = this.colorStatic('color', 'smoke');
    this.dark = [0, 1, 2, 3].map((v) => puffTex(cloud, v));
    this.lit = [0, 1, 2, 3].map((v) => puffTex(this.colorStatic('lit', 'hue'), v));
    this.glow = glowTex(this.colorStatic('lit', 'hue'), 'soft');
  }

  override update(env: FrameEnv): void {
    const fl = this.list('flashes');
    if (this.prevClock >= 0 && fl.length === 2) {
      const sc = schedule(env.clock, this.prevClock, [fl[0], fl[1]], this.inst.seed + 5);
      if (sc.fired) {
        this.heat = 1;
        this.heatX = (hash(sc.index) - 0.5) * 1.4;
      }
    }
    this.heat = Math.max(0, this.heat - env.dt / 0.45);
    this.prevClock = env.clock;
  }

  /** Inner light 0..1 (heat flashes and accent strikes). */
  private flash(): number {
    const reduced = this.inst.reduced ? 0.35 : 1;
    return Math.max(this.heat * 0.55, this.inst.accent.env) * reduced;
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const cy = this.num('y', -1.05) * D;
    const rx = this.num('rx', 1.15) * D * k;
    const ry = this.num('ry', 0.38) * D * k;
    const spin = this.num('spin', 6) * DEG * env.clock * this.inst.motion;
    const fl = this.flash();
    const n = Math.max(6, Math.round(this.puffs.length * (0.5 + 0.5 * env.q)));
    // Inner glow behind the puffs.
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay + cy);
    ctx.globalAlpha = Math.min(1, a * (0.55 + fl * 0.9));
    blit(ctx, this.glow, this.heatX * rx * 0.5 * (this.heat > 0 ? 1 : 0), 0, rx * 2.8, ry * 4.6);
    // Puffs: back half first, then front half (no sorting needed). Each puff has a lit
    // underside (additive) and a dark body on top, so the cloud reads against the sky.
    const litA = this.num('litAlpha', 0.3) * (1 + fl * 1.5);
    for (const pass of [0, 1]) {
      for (let i = 0; i < n; i++) {
        const p = this.puffs[i];
        const ang = p.ang + spin * (0.6 + p.rho * 0.4);
        const z = Math.sin(ang);
        if ((z >= 0) !== (pass === 1)) continue;
        const x = Math.cos(ang) * p.rho * rx;
        const y = z * p.rho * ry * 0.55 - (1 - p.rho) * ry * 0.9 + (p.up - 0.5) * ry * 0.4;
        const size = p.size * D * k * (1 + 0.12 * z);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, a * litA);
        xform(env, this.inst, this.ax + x, this.ay + cy + y + size * 0.16);
        blit(ctx, this.lit[p.v], 0, 0, size * 1.45);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.min(1, a * (pass ? 0.9 : 0.78));
        xform(env, this.inst, this.ax + x, this.ay + cy + y - size * 0.06);
        blit(ctx, this.dark[p.v], 0, 0, size * 1.4);
      }
    }
    // Lit edges: additive glow peeking through when it flashes.
    if (fl > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      xform(env, this.inst, this.ax, this.ay + cy);
      ctx.globalAlpha = Math.min(1, a * fl * 0.7);
      blit(ctx, this.glow, this.heatX * rx * 0.4, ry * 0.2, rx * 2.2, ry * 3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    const f = this.flash();
    return f > 0.02 ? { angle: -Math.PI / 2, boost: f * 0.6 } : null;
  }
}

export const HEROES_V0_V2 = {
  waveRing: WaveRing,
  shootingStars: ShootingStars,
  frostCrown: FrostCrown,
  bowShock: BowShock,
  stormCloud: StormCloud,
};

