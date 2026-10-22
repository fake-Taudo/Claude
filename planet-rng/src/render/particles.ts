// Pooled particle system with per-emitter behaviors. Coordinates are "reference pixels"
// relative to the planet centre, where the planet radius is REF_R. The view transform
// scales them to the real planet size, so effects scale with the layout.

import type { AuraDef, EmitterDef } from '../config';
import { clamp01, hueShift, mix, noise1, spectral, visible } from './color';
import { sprite } from './sprites';

export const REF_R = 60;
/** Global particle size multiplier (config sizes are core sizes at reference scale). */
export const PARTICLE_SCALE = 1.8;
/** Global rotation of tilted orbits (perspective look). */
export const TILT_ANGLE = -0.28;
const COS_T = Math.cos(TILT_ANGLE);
const SIN_T = Math.sin(TILT_ANGLE);

export interface View {
  /** Scale from reference pixels to device pixels. */
  s: number;
  /** Planet centre in device pixels. */
  tx: number;
  ty: number;
}

export class Particle {
  x = 0;
  y = 0;
  z = 0;
  vx = 0;
  vy = 0;
  size = 1;
  base = 1;
  rot = 0;
  vrot = 0;
  age = 0;
  life = Infinity;
  a = 0;
  r = 0;
  w = 0;
  phase = 0;
  seed = 0;
  alpha = 1;
  color = '#ffffff';
  hue = 0;
  k = 0;
  u = 0;
  cycle = -1;
  gx = 0;
  gy = 0;
  gt = 0;
}

export class ParticlePool {
  private free: Particle[] = [];
  get(): Particle {
    const p = this.free.pop() ?? new Particle();
    p.age = 0;
    p.life = Infinity;
    p.rot = 0;
    p.vrot = 0;
    p.vx = 0;
    p.vy = 0;
    p.z = 0;
    p.alpha = 1;
    p.cycle = -1;
    p.gt = 0;
    return p;
  }
  release(p: Particle): void {
    if (this.free.length < 4000) this.free.push(p);
  }
}

export const sharedPool = new ParticlePool();

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const TAU = Math.PI * 2;

function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

/** Applies orbit tilt (ellipse + global rotation) and depth. */
function place(p: Particle, a: number, r: number, tilt: number): void {
  const x = Math.cos(a) * r;
  const y = Math.sin(a) * r * (1 - tilt);
  if (tilt > 0) {
    p.x = x * COS_T - y * SIN_T;
    p.y = x * SIN_T + y * COS_T;
    p.z = Math.sin(a);
  } else {
    p.x = x;
    p.y = y;
    p.z = 0;
  }
}

export class Emitter {
  particles: Particle[] = [];
  private spawnAcc = 0;
  private target: number;
  private colors: string[];
  private persistent: boolean;
  private fadeCache = new Map<string, string>();

  constructor(
    readonly def: EmitterDef,
    readonly aura: AuraDef,
    quality: number,
    private pool: ParticlePool = sharedPool,
  ) {
    const fallback = aura.colors.glow;
    this.colors = (def.colors ?? [aura.colors.main, aura.colors.glow]).map((c) => visible(c, fallback));
    this.persistent = !def.life;
    this.target = Math.max(1, Math.round(def.count * quality));
    if (this.persistent) for (let i = 0; i < this.target; i++) this.spawn(i, true);
    else {
      // Pre-warm so a freshly equipped aura looks complete immediately.
      const avg = (def.life![0] + def.life![1]) / 2;
      for (let i = 0; i < this.target; i++) {
        const p = this.spawn(i, true);
        if (p) this.step(p, Math.random() * avg, 0, 1);
      }
    }
  }

  setQuality(q: number): void {
    const target = Math.max(1, Math.round(this.def.count * q));
    if (target === this.target) return;
    this.target = target;
    if (this.persistent) {
      while (this.particles.length > target) this.pool.release(this.particles.pop()!);
      for (let i = this.particles.length; i < target; i++) this.spawn(i, true);
    }
  }

  private spawn(index: number, init: boolean): Particle | null {
    const d = this.def;
    const p = this.pool.get();
    const R = REF_R;
    const [rmin, rmax] = d.radius;
    p.seed = Math.random() * 1000;
    p.phase = Math.random() * TAU;
    p.base = rand(d.size[0], d.size[1]);
    p.size = p.base;
    p.w = rand(d.speed[0], d.speed[1]);
    p.color = this.colors[index % this.colors.length];
    p.hue = Math.random() * 360;
    p.k = index;
    p.vrot = (d.spin ?? 0) * (Math.random() < 0.5 ? -1 : 1) * rand(0.6, 1.4);
    p.rot = Math.random() * TAU;
    if (d.life) p.life = rand(d.life[0], d.life[1]);
    p.a = Math.random() * TAU;
    p.r = rand(rmin, rmax) * R;
    const tilt = d.tilt ?? 0;

    switch (d.behavior) {
      case 'rise': {
        const a = rand(0.12 * Math.PI, 0.88 * Math.PI);
        p.x = Math.cos(a) * p.r;
        p.y = Math.sin(a) * p.r * 0.6;
        p.vy = -p.w;
        p.z = Math.random() < 0.5 ? -0.5 : 0.5;
        break;
      }
      case 'fall': {
        p.x = rand(-rmax, rmax) * R;
        p.y = -rmax * R - 10;
        if (init) p.y = rand(-rmax, rmax) * R;
        p.vy = p.w;
        p.vx = d.shape === 'streak' ? p.w * 0.35 : rand(-6, 6);
        p.z = Math.random() < 0.5 ? -0.5 : 0.5;
        if (d.shape === 'streak') p.rot = Math.atan2(p.vy, p.vx);
        break;
      }
      case 'wind': {
        p.x = -rmax * R * 1.15;
        if (init) p.x = rand(-rmax, rmax) * R;
        p.y = rand(-rmax, rmax) * R * 0.85;
        p.vx = p.w;
        p.z = Math.random() < 0.5 ? -0.5 : 0.5;
        break;
      }
      case 'outward':
      case 'bloom':
      case 'decay': {
        place(p, p.a, p.r, tilt);
        const dir = d.behavior === 'decay' ? Math.random() * TAU : p.a;
        p.vx = Math.cos(dir) * p.w;
        p.vy = Math.sin(dir) * p.w;
        if (d.behavior !== 'decay') p.rot = p.a + Math.PI / 2;
        break;
      }
      case 'swirlUp':
        p.u = rmax * R * 0.55;
        break;
      case 'jets': {
        p.k = Math.random() < 0.5 ? 0 : 1;
        p.u = rand(-0.07, 0.07);
        p.r = rmin * R;
        break;
      }
      case 'galaxy': {
        const arms = d.param ?? 2;
        p.k = index % arms;
        const rr = rmin + (rmax - rmin) * Math.pow(Math.random(), 0.8);
        p.r = rr * R;
        p.u = (Math.random() - 0.5) * 0.7 * (1 - (rr - rmin) / (rmax - rmin) * 0.4);
        break;
      }
      case 'fieldline': {
        const lines = d.param ?? 6;
        p.k = index % lines;
        p.u = rand(0.35, Math.PI - 0.35);
        break;
      }
      case 'mobius':
        p.u = Math.random() * TAU * 2;
        p.k = Math.random() < 0.5 ? -1 : 1;
        p.phase = rand(0.6, 1);
        break;
      case 'lemniscate':
        p.u = Math.random() * TAU;
        break;
      case 'grid': {
        const rings = d.param ?? 3;
        const perRing = Math.ceil(this.target / rings);
        p.k = Math.floor(index / perRing);
        p.u = (index % perRing) / perRing;
        p.r = (rings > 1 ? rmin + ((rmax - rmin) * p.k) / (rings - 1) : rmin) * R;
        break;
      }
      case 'teleport':
        p.u = rand(0.2, (d.param ?? 1) * 1.5);
        break;
      case 'burst':
        p.u = rand(0, 0.14);
        break;
      default:
        break;
    }
    this.particles.push(p);
    return p;
  }

  update(dt: number, t: number, tempo: number): void {
    const d = this.def;
    if (!this.persistent) {
      const avg = (d.life![0] + d.life![1]) / 2;
      this.spawnAcc += (this.target / avg) * dt * tempo;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        if (this.particles.length < this.target * 1.3) this.spawn(this.particles.length, false);
      }
    }
    const list = this.particles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      const alive = this.step(p, dt, t, tempo);
      if (!alive) {
        list[i] = list[list.length - 1];
        list.pop();
        this.pool.release(p);
      }
    }
  }

  /** Advances one particle. Returns false when it died. */
  private step(p: Particle, dt: number, t: number, tempo: number): boolean {
    const d = this.def;
    const R = REF_R;
    const tilt = d.tilt ?? 0;
    const sdt = dt * tempo;
    p.age += sdt;
    p.rot += p.vrot * sdt;
    p.alpha = 1;
    p.size = p.base;
    const [rmin, rmax] = d.radius;
    const lifeK = p.life === Infinity ? 0 : p.age / p.life;
    if (lifeK >= 1) return false;

    switch (d.behavior) {
      case 'orbit':
      case 'flicker':
      case 'jitter':
      case 'pulse':
      case 'wave':
      case 'tumble': {
        p.a += p.w * sdt;
        let r = p.r;
        if (d.behavior === 'wave') r += Math.sin(p.a * 5 + t * 2.2 + p.phase) * (d.param ?? 0.1) * R;
        if (d.behavior === 'tumble') r += Math.sin(t * 0.7 + p.phase) * 6;
        place(p, p.a, r, tilt);
        if (d.behavior === 'jitter') {
          const j = d.param ?? 3;
          p.x += (Math.random() - 0.5) * j * 2;
          p.y += (Math.random() - 0.5) * j * 2;
          p.rot = p.a + (Math.random() - 0.5) * 0.8;
        }
        if (d.behavior === 'flicker') {
          const n = noise1(t * (d.param ? 6 : 2.5) + p.seed, p.k);
          p.alpha = d.param ? Math.max(0, n) * 1.4 : 0.45 + 0.55 * (0.5 + 0.5 * n);
        }
        if (d.behavior === 'pulse') p.size = p.base * (1 + 0.4 * Math.sin(t * 3.2 + p.phase));
        if (d.behavior === 'orbit' && d.param === 1) p.alpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(p.a));
        break;
      }
      case 'reverse': {
        const period = d.param ?? 2.5;
        p.a += p.w * Math.cos((Math.PI * t) / period) * sdt;
        place(p, p.a, p.r, tilt);
        break;
      }
      case 'tick': {
        const tt = t * tempo;
        const a = p.phase + p.w * (Math.floor(tt) + easeOutBack(Math.min(1, (tt % 1) * 4)));
        place(p, a, p.r, tilt);
        p.alpha = 0.6 + 0.4 * Math.max(0, 1 - (tt % 1) * 3);
        break;
      }
      case 'teleport': {
        p.a += p.w * sdt;
        p.u -= sdt;
        if (p.u <= 0) {
          p.gx = p.x;
          p.gy = p.y;
          p.gt = 0.35;
          p.a = Math.random() * TAU;
          p.r = rand(rmin, rmax) * R;
          p.u = rand(0.3, (d.param ?? 1) * 1.6);
        }
        if (p.gt > 0) p.gt -= dt;
        place(p, p.a, p.r, tilt);
        break;
      }
      case 'grid': {
        const dir = p.k % 2 ? -1 : 1;
        const a = p.u * TAU + t * p.w * dir * tempo;
        place(p, a, p.r, tilt);
        p.alpha = 0.8 + 0.2 * Math.sin(t * 2 + p.k);
        break;
      }
      case 'drift': {
        const ang = p.a + (t * p.w * tempo) / Math.max(20, p.r);
        const r = p.r + Math.sin(t * 0.5 + p.phase) * 10;
        place(p, ang + Math.sin(t * 0.3 + p.seed) * 0.2, r, tilt);
        p.alpha = 0.55 + 0.45 * Math.sin(t * 1.7 + p.phase);
        p.rot = p.phase + t * 0.2;
        break;
      }
      case 'rise': {
        p.x += Math.sin(p.age * 3 + p.phase) * 12 * sdt;
        p.y += p.vy * sdt;
        p.alpha = Math.min(1, lifeK * 6) * Math.pow(1 - lifeK, 0.8);
        if (d.shape === 'feather' || d.shape === 'petal') p.rot += Math.sin(p.age * 2) * 0.02;
        break;
      }
      case 'fall': {
        p.x += p.vx * sdt;
        p.y += p.vy * sdt;
        p.alpha = Math.min(1, lifeK * 5) * Math.min(1, (1 - lifeK) * 4);
        if (p.y > rmax * R + 20) return false;
        break;
      }
      case 'wind': {
        p.x += p.vx * sdt;
        p.y += Math.sin(p.age * 2 + p.phase) * 14 * sdt;
        p.alpha = Math.min(1, lifeK * 5) * Math.min(1, (1 - lifeK) * 3);
        p.rot = 0;
        if (p.x > rmax * R * 1.2) return false;
        break;
      }
      case 'inward': {
        const rminR = rmin * R;
        const rmaxR = rmax * R;
        const k = 1 - (p.r - rminR) / (rmaxR - rminR);
        p.r -= p.w * sdt * (0.35 + 2.2 * k * k);
        p.a += sdt * 0.9 * Math.sqrt(rmaxR / Math.max(p.r, 1));
        if (p.r <= rminR) {
          p.r = rmaxR * rand(0.85, 1);
          p.a = Math.random() * TAU;
        }
        place(p, p.a, p.r, tilt);
        p.rot = p.a + Math.PI - 0.25;
        p.alpha = Math.min(1, (1 - (p.r - rminR) / (rmaxR - rminR)) * 2.2);
        p.size = p.base * (0.6 + 0.8 * k);
        break;
      }
      case 'outward':
      case 'bloom': {
        p.x += p.vx * sdt;
        p.y += p.vy * sdt;
        p.vx *= 1 - 0.6 * sdt;
        p.vy *= 1 - 0.6 * sdt;
        if (d.behavior === 'bloom') p.size = p.base * Math.sin(Math.min(1, lifeK) * Math.PI) * 1.2;
        p.alpha = Math.min(1, lifeK * 8) * Math.pow(1 - lifeK, 1.3);
        if (d.shape === 'streak') p.rot = Math.atan2(p.vy, p.vx);
        break;
      }
      case 'decay': {
        p.x += p.vx * sdt;
        p.y += p.vy * sdt + 3 * sdt;
        p.size = p.base * (1 - lifeK * 0.75);
        p.alpha = Math.min(1, lifeK * 5) * Math.pow(1 - lifeK, 1.2);
        break;
      }
      case 'burst': {
        const period = d.param ?? 1.2;
        const local = t * tempo / period - p.u;
        const cycle = Math.floor(local);
        if (cycle !== p.cycle) {
          p.cycle = cycle;
          p.a = Math.random() * TAU;
          p.base = rand(d.size[0], d.size[1]);
          p.vrot = (d.spin ?? 2) * rand(-1.5, 1.5);
        }
        const tau = local - cycle;
        const r = (rmin + (rmax - rmin) * easeOutExpo(Math.min(1, tau * 1.5))) * R;
        place(p, p.a, r, tilt);
        p.alpha = tau < 0.04 ? tau / 0.04 : Math.pow(1 - tau, 1.6);
        p.size = p.base * (1.3 - tau * 0.5);
        break;
      }
      case 'swirlUp': {
        p.a += p.w * sdt;
        const rr = p.r * (1 - lifeK * 0.35);
        p.x = Math.cos(p.a) * rr;
        p.y = p.u - p.age * 34 + Math.sin(p.a) * rr * 0.28;
        p.z = Math.sin(p.a);
        p.rot = p.a + Math.PI / 2;
        p.alpha = Math.min(1, lifeK * 6) * Math.pow(1 - lifeK, 1.1);
        break;
      }
      case 'jets': {
        const axis = t * (d.param ?? 0.35);
        p.r += p.w * sdt;
        const dir = axis + p.k * Math.PI + p.u;
        p.x = Math.cos(dir) * p.r;
        p.y = Math.sin(dir) * p.r * 0.8;
        p.z = (p.k ? 1 : -1) * Math.cos(axis) * 0.6;
        p.rot = dir;
        const k = (p.r - rmin * R) / ((rmax - rmin) * R);
        p.alpha = Math.min(1, k * 8) * (1 - k);
        p.size = p.base * (0.7 + k * 0.8);
        if (k >= 1) {
          p.r = rmin * R;
          p.u = rand(-0.07, 0.07);
          p.k = Math.random() < 0.5 ? 0 : 1;
        }
        break;
      }
      case 'galaxy': {
        const arms = d.param ?? 2;
        const tight = d.param2 ?? 1.5;
        const rr = p.r / R;
        const a = (p.k * TAU) / arms + Math.log(rr / rmin) * tight + p.u + t * p.w * tempo * (1.6 - rr / rmax);
        place(p, a, p.r, tilt);
        p.alpha = 0.5 + 0.5 * (1 - (rr - rmin) / (rmax - rmin)) + 0.15 * Math.sin(t * 2 + p.seed);
        break;
      }
      case 'fieldline': {
        const lines = d.param ?? 6;
        const side = p.k % 2 ? 1 : -1;
        const tier = Math.floor(p.k / 2) + 1;
        const L = (rmin + ((rmax - rmin) * tier) / Math.ceil(lines / 2)) * R;
        p.u += p.w * sdt;
        if (p.u > Math.PI - 0.3) p.u = 0.3;
        const s = Math.sin(p.u);
        const lx = side * L * s * s * s;
        const ly = -L * s * s * Math.cos(p.u);
        const rot = t * 0.15;
        p.x = lx * Math.cos(rot) - ly * Math.sin(rot);
        p.y = lx * Math.sin(rot) + ly * Math.cos(rot);
        p.z = 0;
        p.alpha = Math.sin(p.u) * 1.1;
        break;
      }
      case 'mobius': {
        p.u += p.w * sdt;
        const u = p.u;
        const Rb = rmin * R;
        const W = 0.35 * R * p.phase;
        const off = p.k * W * Math.cos(u / 2);
        const cx = Math.cos(u) * (Rb + off);
        const cy = Math.sin(u) * (Rb + off) * (1 - tilt) - p.k * W * Math.sin(u / 2) * 0.9;
        p.x = cx * COS_T - cy * SIN_T;
        p.y = cx * SIN_T + cy * COS_T;
        p.z = Math.sin(u);
        p.color = this.colors[(p.k * Math.cos(u / 2) >= 0 ? 0 : 1) % this.colors.length];
        break;
      }
      case 'lemniscate': {
        p.u += p.w * sdt;
        const a = rmin * R;
        const s = Math.sin(p.u);
        const den = 1 + s * s;
        p.x = (a * Math.cos(p.u)) / den;
        p.y = (a * s * Math.cos(p.u)) / den;
        p.z = 0;
        break;
      }
      case 'wander': {
        const ang = p.a + t * 0.15 * (p.k % 2 ? 1 : -1);
        p.x = Math.cos(ang) * p.r + noise1(t * 0.5 + p.seed, 1) * 36;
        p.y = Math.sin(ang) * p.r * 0.8 + noise1(t * 0.45 + p.seed, 2) * 36;
        p.alpha = 0.7 + 0.3 * Math.sin(t * 3 + p.phase);
        break;
      }
    }
    return true;
  }

  private colorOf(p: Particle, t: number): string {
    const d = this.def;
    if (d.spectral) return spectral(p.hue + t * (d.hueCycle ?? 0));
    let c = p.color;
    if (d.hueCycle) c = hueShift(c, t * d.hueCycle);
    if (d.fadeTo && p.life !== Infinity) {
      const step = Math.min(5, Math.floor((p.age / p.life) * 6));
      const key = `${c}|${step}`;
      let m = this.fadeCache.get(key);
      if (!m) {
        m = mix(c, d.fadeTo, step / 5);
        this.fadeCache.set(key, m);
      }
      c = m;
    }
    return c;
  }

  /** Draws particles of one depth pass. */
  draw(ctx: CanvasRenderingContext2D, view: View, pass: 'back' | 'front', layerAlpha: number, t: number): void {
    const d = this.def;
    const baseAlpha = (d.alpha ?? 1) * layerAlpha;
    if (baseAlpha <= 0.005) return;
    ctx.globalCompositeOperation = d.additive === false ? 'source-over' : 'lighter';
    const isStreak = d.shape === 'streak';
    const rotates = isStreak || !!d.spin || d.shape === 'feather' || d.shape === 'petal' || d.shape === 'bolt' || d.behavior === 'jets' || d.behavior === 'swirlUp';
    const { s, tx, ty } = view;
    for (const p of this.particles) {
      const back = p.z < 0;
      if ((pass === 'back') !== back) continue;
      const depth = (1 + 0.18 * p.z) * PARTICLE_SCALE;
      const a = clamp01(p.alpha) * baseAlpha * (0.7 + 0.3 * (p.z + 1) * 0.5);
      if (a <= 0.01) continue;
      const img = sprite(d.shape, this.colorOf(p, t));
      ctx.globalAlpha = a;
      if (isStreak) {
        const len = p.size * 1.6 * depth;
        const h = len * 0.19;
        const c = Math.cos(p.rot) * s;
        const sn = Math.sin(p.rot) * s;
        ctx.setTransform(c, sn, -sn, c, tx + p.x * s, ty + p.y * s);
        ctx.drawImage(img, -len, -h / 2, len, h);
      } else if (rotates) {
        const sz = p.size * 2 * depth;
        const c = Math.cos(p.rot) * s;
        const sn = Math.sin(p.rot) * s;
        ctx.setTransform(c, sn, -sn, c, tx + p.x * s, ty + p.y * s);
        ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
      } else {
        const sz = p.size * 2 * depth * s;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, tx + p.x * s - sz / 2, ty + p.y * s - sz / 2, sz, sz);
      }
      // Afterimage of teleporting particles.
      if (p.gt > 0) {
        ctx.globalAlpha = a * (p.gt / 0.35) * 0.6;
        const sz = p.size * 2 * s * PARTICLE_SCALE;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, tx + p.gx * s - sz / 2, ty + p.gy * s - sz / 2, sz, sz);
      }
      // Analytic trails for flowing behaviors.
      if (d.trail && (d.behavior === 'lemniscate' || d.behavior === 'wander')) {
        for (let k = 1; k <= 4; k++) {
          const dt = k * 0.05;
          let x = 0;
          let y = 0;
          if (d.behavior === 'lemniscate') {
            const u = p.u - p.w * dt * 1.5;
            const sn2 = Math.sin(u);
            const den = 1 + sn2 * sn2;
            x = (d.radius[0] * REF_R * Math.cos(u)) / den;
            y = (d.radius[0] * REF_R * sn2 * Math.cos(u)) / den;
          } else {
            const tt = t - dt * 2;
            const ang = p.a + tt * 0.15 * (p.k % 2 ? 1 : -1);
            x = Math.cos(ang) * p.r + noise1(tt * 0.5 + p.seed, 1) * 36;
            y = Math.sin(ang) * p.r * 0.8 + noise1(tt * 0.45 + p.seed, 2) * 36;
          }
          const sz = p.size * 2 * s * PARTICLE_SCALE * (1 - k * 0.17);
          ctx.globalAlpha = a * (1 - k * 0.22);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.drawImage(img, tx + x * s - sz / 2, ty + y * s - sz / 2, sz, sz);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  release(): void {
    for (const p of this.particles) this.pool.release(p);
    this.particles = [];
  }
}
