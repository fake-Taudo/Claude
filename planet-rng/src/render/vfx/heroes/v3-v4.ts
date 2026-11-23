// Heroes of the V3-V4 auras. Each class documents its parameters (spec p.*).

import type { HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { mix, rgba, spectral } from '../../color';
import { blit, clipHalf, D, type AuraInstance, type FrameEnv, projectOrbit, type Shadow, xform, xPlane, xScreen } from '../core';
import { clamp01, DEG, easeIn, easeOut, envelope, hash, noise1, Rng, smooth, TAU } from '../math';
import {
  bakeTex,
  coneTex,
  glintTex,
  glowTex,
  noiseGrid,
  paintTex,
  pillarTex,
  puffTex,
  PX_NONE,
  pxOut,
  rgb01,
  rimTex,
  sampleNoise,
  spriteTex,
  streakTex,
  type Tex,
} from '../tex';
import { glowStroke, Hero } from './base';

const tmp = { x: 0, y: 0, z: 0 };

/** Sun disc with limb darkening and granulation. */
export function sunTex(hot: string, mid: string, deep: string, seed: number): Tex {
  return bakeTex(`sun|${hot}|${mid}|${deep}|${seed}`, () => {
    const g = noiseGrid(4, 12, seed);
    const g2 = noiseGrid(3, 3, seed + 5);
    const ch = rgb01(hot);
    const cm = rgb01(mid);
    const cd = rgb01(deep);
    return paintTex(256, 256, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d >= 1) return PX_NONE;
      const mu = Math.sqrt(1 - d * d);
      const gran = 0.62 + 0.62 * sampleNoise(g, (u + 1) / 2, (v + 1) / 2) + 0.2 * (sampleNoise(g2, (u + 1) / 2, (v + 1) / 2) - 0.5);
      const k = Math.pow(mu, 1.1);
      const a = k < 0.5 ? cd : cm;
      const b = k < 0.5 ? cm : ch;
      const f = k < 0.5 ? k * 2 : (k - 0.5) * 2;
      return pxOut((a[0] + (b[0] - a[0]) * f) * gran, (a[1] + (b[1] - a[1]) * f) * gran, (a[2] + (b[2] - a[2]) * f) * gran, smooth((1 - d) / 0.02));
    });
  });
}

// ---------------------------------------------------------------------------
// Sonnenkern: a small sun right behind the planet, breathing corona, prominence arcs
// rising and falling at its limb. p: radius (D), corona (D), arcs, arcHeight (D), spin
// (deg/s), color, hot, deep. Accent: one arc erupts into a flare.
// ---------------------------------------------------------------------------

export class SunCore extends Hero {
  private sun: Tex;
  private corona: Tex;
  private blob: Tex;
  private flare: Tex;
  private arcs: { ang: number; span: number; h: number; ph: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.sun = sunTex(this.colorStatic('hot', 'core'), this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), (inst.seed % 300) + 3);
    this.corona = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.blob = glowTex(this.colorStatic('hot', 'core'), 'core');
    this.flare = glintTex(this.colorStatic('hot', 'core'));
    const rng = new Rng(inst.seed + 17);
    const n = this.num('arcs', 4);
    for (let i = 0; i < n; i++) this.arcs.push({ ang: ((i + rng.range(-0.2, 0.2)) / n) * TAU + 0.4, span: rng.range(0.22, 0.34), h: rng.range(0.7, 1.15), ph: rng.next() * TAU });
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 0.92) * D * k;
    const t = env.clock * this.inst.motion;
    const br = this.inst.breathe(env.clock) * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.85 + 0.1 * br + acc * 0.3));
    blit(ctx, this.corona, 0, 0, this.num('corona', 3.2) * D * k * (1 + 0.05 * br));
    ctx.globalAlpha = Math.min(1, a * 0.45);
    blit(ctx, this.corona, 0, 0, this.num('corona', 3.2) * D * k * 1.6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    xScreen(env, this.inst, this.ax, this.ay, t * this.num('spin', 3) * DEG);
    blit(ctx, this.sun, 0, 0, R * 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * 0.35);
    xScreen(env, this.inst, this.ax, this.ay, -t * this.num('spin', 3) * 1.7 * DEG + 1);
    blit(ctx, this.sun, 0, 0, R * 2);
    // Prominence arcs at the limb.
    xform(env, this.inst, this.ax, this.ay);
    const deep = this.color('deep', 'accent');
    const hue = this.color('color', 'hue');
    const H = this.num('arcHeight', 0.45) * D * k;
    for (let i = 0; i < this.arcs.length; i++) {
      const arc = this.arcs[i];
      const flare = i === 0 ? acc : 0;
      const h = H * arc.h * (0.65 + 0.35 * Math.sin(t * 0.35 + arc.ph)) * (1 + flare * 0.9);
      const a0 = arc.ang - arc.span + t * 0.02;
      const a1 = arc.ang + arc.span + t * 0.02;
      const x0 = Math.cos(a0) * R * 0.97;
      const y0 = Math.sin(a0) * R * 0.97;
      const x1 = Math.cos(a1) * R * 0.97;
      const y1 = Math.sin(a1) * R * 0.97;
      const am = arc.ang + t * 0.02;
      const cx = Math.cos(am) * (R + h * 1.6);
      const cy = Math.sin(am) * (R + h * 1.6);
      const path = () => {
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cx, cy, x1, y1);
      };
      glowStroke(ctx, path, D * 0.035 * (1 + flare), deep, a * (0.75 + flare), 0);
      glowStroke(ctx, path, D * 0.014, hue, a * (0.8 + flare), 0.4);
      // Plasma blobs flowing along the arc.
      for (let b = 0; b < 3; b++) {
        const s = ((t * 0.25 + b / 3 + arc.ph) % 1 + 1) % 1;
        const u = 1 - s;
        const bx = u * u * x0 + 2 * u * s * cx + s * s * x1;
        const by = u * u * y0 + 2 * u * s * cy + s * s * y1;
        ctx.globalAlpha = Math.min(1, a * Math.sin(s * Math.PI) * 0.8);
        blit(ctx, this.blob, bx, by, D * 0.14);
      }
      if (flare > 0.05) {
        ctx.globalAlpha = Math.min(1, a * flare);
        blit(ctx, this.flare, cx * 0.62, cy * 0.62, D * 1.1 * flare);
        ctx.globalAlpha = Math.min(1, a * flare * 0.6);
        blit(ctx, this.corona, cx * 0.62, cy * 0.62, D * 1.6 * flare);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: this.inst.accent.env * 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Prisma: a floating glass prism splits a white beam into a rainbow fan.
// p: size (D side), swing (deg), beamAngle (deg, direction the white beam travels),
// fanSpread (deg), fanLength (D), fanAngle (deg, centre of the fan).
// ---------------------------------------------------------------------------

export class Prism extends Hero {
  private beam: Tex;
  private cones: Tex[] = [];
  private glint: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.beam = pillarTex('#ffffff');
    for (let i = 0; i < 7; i++) this.cones.push(coneTex(spectral(i * 46), false));
    this.glint = glintTex('#ffffff');
    this.glow = glowTex('#ffffff', 'soft');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const side = this.num('size', 0.95) * D * k;
    const rot = Math.sin(t * 0.25) * this.num('swing', 8) * DEG;
    const px = this.ax;
    const py = this.ay;
    // Incoming white beam from the stage edge.
    const bAng = this.num('beamAngle', 35) * DEG;
    const len = D * 4;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * 0.7);
    xScreen(env, this.inst, px, py, bAng + Math.PI / 2, 1, -1);
    ctx.drawImage(this.beam, -D * 0.12, -len, D * 0.24, len);
    // Rainbow fan.
    const fanA = this.num('fanAngle', 60) * DEG + rot * 1.5;
    const spread = this.num('fanSpread', 42) * DEG * (1 + acc * 0.3);
    const fl = this.num('fanLength', 2.6) * D * easeOut(this.introK());
    for (let i = 0; i < 7; i++) {
      const ang = fanA - spread / 2 + (spread * i) / 6;
      const w = 2 * fl * Math.tan(6 * DEG);
      ctx.globalAlpha = Math.min(1, a * (0.42 + acc * 0.4));
      xScreen(env, this.inst, px, py, ang);
      ctx.drawImage(this.cones[i], 0, -w / 2, fl, w);
    }
    // Prism body: glass triangle with bright edges.
    xScreen(env, this.inst, px, py, rot);
    const h = (side * Math.sqrt(3)) / 2;
    const p0: [number, number] = [0, -h * 0.66];
    const p1: [number, number] = [side / 2, h * 0.34];
    const p2: [number, number] = [-side / 2, h * 0.34];
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(p2[0], p0[1], p1[0], p1[1]);
    g.addColorStop(0, `rgba(220,235,255,${0.28 * a})`);
    g.addColorStop(0.5, `rgba(160,190,255,${0.12 * a})`);
    g.addColorStop(1, `rgba(255,220,255,${0.22 * a})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    ctx.lineTo(...p2);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(
      ctx,
      () => {
        ctx.moveTo(...p0);
        ctx.lineTo(...p1);
        ctx.lineTo(...p2);
        ctx.closePath();
      },
      D * 0.012,
      '#e8f0ff',
      a,
      0.7,
    );
    // Inner refraction lines.
    ctx.strokeStyle = rgba('#ffffff', 0.25 * a);
    ctx.lineWidth = D * 0.006;
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1] + h * 0.3);
    ctx.lineTo(p1[0] * 0.5, p1[1] * 0.6);
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, a * (0.5 + 0.5 * acc));
    blit(ctx, this.glow, 0, 0, side * 1.6);
    for (const [vx, vy] of [p0, p1, p2]) {
      ctx.globalAlpha = Math.min(1, a * (0.6 + 0.3 * Math.sin(t * 0.9 + vx)));
      blit(ctx, this.glint, vx, vy, D * 0.45);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Komet: a big comet on a wide tilted orbit with a straight ion tail and a curved dust
// tail, both pointing away from the planet. p: radius, tilt, roll, speed (deg/s), size,
// ionLen, dustLen (D), ion, dust, color. Accent: perihelion flare.
// ---------------------------------------------------------------------------

export class Comet extends Hero {
  private ion: Tex;
  private dust: Tex;
  private coma: Tex;
  private nucleus: Tex;
  private spark: Tex;
  private pos = { x: 0, y: 0, z: 0 };
  private trail: { x: number; y: number; z: number; t: number }[] = [];
  private lastDrop = 0;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.ion = streakTex(this.colorStatic('ion', 'hue'));
    this.dust = streakTex(this.colorStatic('dust', 'core'));
    this.coma = glowTex(this.colorStatic('color', 'hue'), 'core');
    this.nucleus = glintTex(this.colorStatic('dust', 'core'));
    this.spark = spriteTex('mote', this.colorStatic('dust', 'core'));
    for (let i = 0; i < 24; i++) this.trail.push({ x: 0, y: 0, z: 0, t: -99 });
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const phi = env.clock * this.num('speed', 14) * DEG * this.inst.motion;
    projectOrbit(this.num('radius', 1.35) * D * k, phi, this.num('tilt', 0.32), this.num('roll', -12) * DEG, this.pos);
    this.pos.x += this.ax;
    this.pos.y += this.ay;
    // Drop sparkles along the path.
    const rate = this.inst.accent.env > 0.2 ? 0.05 : 0.14;
    if (env.clock - this.lastDrop > rate || env.clock < this.lastDrop) {
      this.lastDrop = env.clock;
      const s = this.trail.shift()!;
      s.x = this.pos.x;
      s.y = this.pos.y;
      s.z = this.pos.z;
      s.t = env.clock;
      this.trail.push(s);
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    // Sparkles left behind.
    xform(env, this.inst, 0, 0);
    for (const s of this.trail) {
      const age = env.clock - s.t;
      if (age > 1.8 || (s.z >= 0) !== front) continue;
      ctx.globalAlpha = Math.min(1, a * Math.pow(1 - age / 1.8, 2) * 0.7);
      blit(ctx, this.spark, s.x, s.y + age * D * 0.05, D * 0.05);
    }
    const p = this.pos;
    if ((p.z >= 0) !== front) {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    const depth = 1 + 0.2 * p.z;
    const size = this.num('size', 0.16) * D * depth * (1 + acc * 0.35);
    const dx = p.x - this.ax;
    const dy = p.y - this.ay;
    const l = Math.hypot(dx, dy) || 1;
    const ox = dx / l;
    const oy = dy / l;
    const S = env.view.s * this.inst.scale;
    const da = (front ? 1 : 0.75) * a;
    // Ion tail: straight away from the planet.
    const ionLen = this.num('ionLen', 1.6) * D * depth * (1 + acc * 0.4);
    ctx.globalAlpha = Math.min(1, da * 0.85);
    ctx.setTransform(S * -ox, S * -oy, S * oy, S * -ox, env.view.tx + S * p.x, env.view.ty + S * p.y);
    ctx.drawImage(this.ion, -ionLen, -size * 0.32, ionLen, size * 0.64);
    // Dust tail: wider, bent against the direction of motion.
    const bend = this.num('speed', 14) >= 0 ? 0.42 : -0.42;
    const c = Math.cos(bend);
    const s = Math.sin(bend);
    const bx = ox * c - oy * s;
    const by = ox * s + oy * c;
    const dustLen = this.num('dustLen', 1.15) * D * depth;
    ctx.globalAlpha = Math.min(1, da * 0.6);
    ctx.setTransform(S * -bx, S * -by, S * by, S * -bx, env.view.tx + S * p.x, env.view.ty + S * p.y);
    ctx.drawImage(this.dust, -dustLen, -size * 0.7, dustLen, size * 1.4);
    xform(env, this.inst, 0, 0);
    ctx.globalAlpha = Math.min(1, da * 0.8);
    blit(ctx, this.coma, p.x, p.y, size * 4.5);
    ctx.globalAlpha = Math.min(1, da);
    blit(ctx, this.nucleus, p.x, p.y, size * 3);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override shadows(out: Shadow[]): void {
    const p = this.pos;
    if (p.z > 0.2 && Math.hypot(p.x, p.y) < D * 0.7) out.push({ x: p.x, y: p.y + D * 0.05, r: D * 0.18, a: 0.3 * this.alpha() });
  }
}

// ---------------------------------------------------------------------------
// Irrlicht: will-o'-wisps wander lazily around the planet and leave fading trails; the
// first is a larger lantern. p: count, radius (D), size (D), speed, color, core.
// Accent: they gather near the planet and flare up.
// ---------------------------------------------------------------------------

export class Wisps extends Hero {
  private flame: Tex;
  private halo: Tex;
  private mote: Tex;
  private glint: Tex;
  private pos: { x: number; y: number; z: number }[] = [];
  private trails: { x: number; y: number; z: number }[][] = [];
  private head = 0;
  private lastDrop = 0;
  private seeds: number[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const col = this.colorStatic('color', 'hue');
    this.flame = spriteTex('wisp', col);
    this.halo = glowTex(col, 'soft');
    this.mote = spriteTex('mote', col);
    this.glint = glintTex(this.colorStatic('core', 'core'));
    const n = this.num('count', 3);
    for (let i = 0; i < n; i++) {
      this.pos.push({ x: 0, y: 0, z: 0 });
      this.trails.push(Array.from({ length: 16 }, () => ({ x: 0, y: 0, z: -2 })));
      this.seeds.push(hash(inst.seed + i * 97) * 100);
    }
  }

  override update(env: FrameEnv): void {
    const R = this.num('radius', 1.0) * D * this.introScale();
    const t = env.clock * this.num('speed', 0.16) * this.inst.motion;
    const gather = this.inst.reduced ? 0 : this.inst.accent.env;
    for (let i = 0; i < this.pos.length; i++) {
      const sd = this.seeds[i];
      const a1 = t * (0.9 + i * 0.23) + sd;
      const x = R * (0.78 * Math.sin(a1) + 0.22 * noise1(t * 0.7 + sd, 3));
      const y = R * (0.42 * Math.sin(a1 * 1.37 + sd * 0.5) + 0.12 * noise1(t * 0.9 + sd, 7)) - R * 0.05;
      const z = Math.cos(a1);
      const g = 1 - gather * 0.45;
      this.pos[i].x = this.ax + x * g;
      this.pos[i].y = this.ay + y * g;
      this.pos[i].z = z;
    }
    if (env.clock - this.lastDrop > 0.07 || env.clock < this.lastDrop) {
      this.lastDrop = env.clock;
      this.head = (this.head + 1) % 16;
      for (let i = 0; i < this.pos.length; i++) {
        const s = this.trails[i][this.head];
        s.x = this.pos[i].x;
        s.y = this.pos[i].y;
        s.z = this.pos[i].z;
      }
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, 0, 0);
    for (let i = 0; i < this.pos.length; i++) {
      const p = this.pos[i];
      const big = i === 0 ? 1.45 : 1;
      const size = this.num('size', 0.2) * D * big * (1 + 0.18 * p.z) * (1 + acc * 0.4);
      // Trail.
      for (let j = 1; j < 16; j++) {
        const s = this.trails[i][(this.head - j + 16) % 16];
        if (s.z < -1.5 || (s.z >= 0) !== front) continue;
        const f = 1 - j / 16;
        ctx.globalAlpha = Math.min(1, a * f * f * 0.55);
        blit(ctx, this.mote, s.x, s.y, size * 0.55 * f + D * 0.02);
      }
      if ((p.z >= 0) !== front) continue;
      const depthA = 0.7 + 0.3 * (p.z + 1) * 0.5;
      const flick = 0.9 + 0.1 * Math.sin(env.clock * 2.3 + i * 1.7);
      ctx.globalAlpha = Math.min(1, a * depthA * (0.8 + acc * 0.4));
      blit(ctx, this.halo, p.x, p.y, size * 4.2);
      ctx.globalAlpha = Math.min(1, a * depthA);
      blit(ctx, this.flame, p.x, p.y - size * 0.3, size * 2.4 * flick, size * 3.2 * flick);
      ctx.globalAlpha = Math.min(1, a * depthA * 0.8);
      blit(ctx, this.glint, p.x, p.y, size * 1.4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    const p = this.pos[0];
    if (!p) return null;
    return { angle: Math.atan2(p.y - this.ay, p.x - this.ax), boost: 0.15 + this.inst.accent.env * 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Eklipse: a black disc behind the planet with a glowing corona and long streamers.
// p: radius (D), offset [x, y] (D), corona (D), color, rim. Accent: diamond-ring flash.
// ---------------------------------------------------------------------------

export class Eclipse extends Hero {
  private rays: Tex;
  private ring: Tex;
  private glow: Tex;
  private flare: Tex;
  private glowCore: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = this.colorStatic('color', 'hue');
    this.rays = raysTexLocal(c, inst.seed);
    this.ring = glowTex(c, 'ring');
    this.glow = glowTex(c, 'soft');
    this.flare = glintTex(this.colorStatic('rim', 'core'));
    this.glowCore = glowTex(this.colorStatic('rim', 'core'), 'core');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 0.78) * D * k;
    const off = this.list('offset');
    const cx = this.ax + (off[0] ?? 0.08) * D;
    const cy = this.ay + (off[1] ?? -0.06) * D;
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const br = this.inst.breathe(env.clock) * this.inst.motion;
    ctx.globalCompositeOperation = 'lighter';
    const C = this.num('corona', 2.8) * D * k;
    ctx.globalAlpha = Math.min(1, a * 0.45);
    xform(env, this.inst, cx, cy);
    blit(ctx, this.glow, 0, 0, C * 1.1);
    ctx.globalAlpha = Math.min(1, a * (0.75 + 0.1 * br));
    xScreen(env, this.inst, cx, cy, t * 1.5 * DEG);
    blit(ctx, this.rays, 0, 0, C);
    ctx.globalAlpha = Math.min(1, a * 0.5);
    xScreen(env, this.inst, cx, cy, -t * 2.3 * DEG + 0.5, 0.86);
    blit(ctx, this.rays, 0, 0, C);
    xform(env, this.inst, cx, cy);
    ctx.globalAlpha = Math.min(1, a * 0.9);
    blit(ctx, this.ring, 0, 0, R * 2.9);
    // The black moon.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = this.color('body', '#020104');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => ctx.arc(0, 0, R * 1.005, 0, TAU), D * 0.012, this.color('rim', 'core'), a * 0.8, 0.5);
    if (acc > 0.02) {
      // Diamond ring: one brilliant point on the rim.
      const ang = -2.2;
      const fx = Math.cos(ang) * R;
      const fy = Math.sin(ang) * R;
      ctx.globalAlpha = Math.min(1, a * acc);
      blit(ctx, this.glowCore, fx, fy, D * 0.9 * acc);
      blit(ctx, this.flare, fx, fy, D * 2.4 * acc);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

/** Thin, long corona streamers (eclipse). */
function raysTexLocal(color: string, seed: number): Tex {
  return bakeTex(`corona|${color}|${seed % 97}`, () => {
    const [r, g, b] = rgb01(color);
    const n = 26;
    const lens: number[] = [];
    const ws: number[] = [];
    for (let i = 0; i < n; i++) {
      lens.push(0.45 + 0.55 * hash(i * 31 + seed));
      ws.push(0.25 + 0.75 * hash(i * 17 + seed + 3));
    }
    return paintTex(512, 512, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1 || d < 0.2) return PX_NONE;
      const ang = (Math.atan2(v, u) / TAU + 1) % 1;
      const f = ang * n;
      const i = Math.floor(f) % n;
      const local = f - Math.floor(f) - 0.5;
      const w = 0.12 * ws[i] * (1 - d * 0.5);
      const ray = Math.exp(-((local / w) ** 2)) * clamp01(1 - (d - 0.28) / (lens[i] * 0.72)) ** 1.4;
      const inner = smooth((d - 0.27) / 0.06);
      return pxOut(r, g, b, (ray * 0.85 + Math.exp(-(((d - 0.3) / 0.08) ** 2)) * 0.35) * inner);
    });
  });
}

// ---------------------------------------------------------------------------
// Saturnring: a broad banded ring system with a Cassini gap, back and front halves, ring
// glints and a light sweep on the accent. p: inner, outer (D), tilt, roll, spin (deg/s),
// color, color2, deep.
// ---------------------------------------------------------------------------

function ringSystemTex(c1: string, c2: string, c3: string, inner: number, seed: number): Tex {
  return bakeTex(`rings|${c1}|${c2}|${c3}|${inner}|${seed}`, () => {
    const cols = [rgb01(c1), rgb01(c2), rgb01(c3)];
    const g = noiseGrid(3, 8, seed);
    return paintTex(512, 512, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1 || d < inner) return PX_NONE;
      const f = (d - inner) / (1 - inner);
      const ringlets = 0.55 + 0.45 * Math.sin(f * 70 + Math.sin(f * 13) * 3) * Math.sin(f * 23 + 1);
      const band = f < 0.18 ? 0.35 : f < 0.62 ? 1 : f < 0.68 ? 0.04 : f < 0.92 ? 0.75 : 0.3;
      const edge = smooth(f / 0.04) * smooth((1 - f) / 0.05);
      const ci = f < 0.4 ? 0 : f < 0.75 ? 1 : 2;
      const c = cols[ci];
      const n = 0.85 + 0.3 * sampleNoise(g, (Math.atan2(v, u) / TAU + 1) % 1, f);
      return pxOut(c[0], c[1], c[2], band * (0.55 + 0.45 * ringlets) * edge * n * 0.95);
    });
  });
}

export class SaturnRings extends Hero {
  private tex: Tex;
  private glint: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const inner = this.num('inner', 0.72) / this.num('outer', 1.5);
    this.tex = ringSystemTex(this.colorStatic('color', 'hue'), this.colorStatic('color2', 'accent'), this.colorStatic('deep', 'accent'), Math.round(inner * 100) / 100, inst.seed % 211);
    this.glint = glintTex(this.colorStatic('color', 'hue'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const half = slot === 'heroBack' ? 'back' : 'front';
    const a = this.alpha() * (half === 'back' ? 0.85 : 1);
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('outer', 1.5) * D * k;
    const tilt = this.num('tilt', 0.26);
    const roll = this.num('roll', -16) * DEG;
    const spin = env.clock * this.num('spin', 6) * DEG * this.inst.motion;
    ctx.save();
    clipHalf(env, this.inst, this.ax, this.ay, roll, half);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, roll);
    ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    if (acc > 0.02) {
      // Spokes: a bright wedge sweeps once around the rings.
      const dur = this.inst.spec.motion.accent.duration ?? 1.6;
      const p = clamp01(this.inst.accent.since / dur);
      const ang = p * TAU - spin;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, ang - 0.45, ang);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = Math.min(1, acc * this.inst.alpha);
      ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
    }
    ctx.restore();
    // Glints riding on the bright band.
    xform(env, this.inst, this.ax, this.ay);
    const inner = this.num('inner', 0.72) * D * k;
    for (let i = 0; i < 5; i++) {
      const phi = i * 1.31 + spin * (1 + i * 0.05);
      projectOrbit(inner + (R - inner) * (0.3 + 0.13 * i), phi, tilt, roll, tmp);
      if ((tmp.z >= 0) !== (half === 'front')) continue;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a * (0.5 + 0.5 * Math.sin(env.clock * 0.8 + i * 2)));
      blit(ctx, this.glint, tmp.x, tmp.y, D * 0.3);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override shadows(out: Shadow[]): void {
    // The front rings throw a soft band of shade over the lower half of the planet.
    const a = this.alpha() * 0.35;
    for (let i = -2; i <= 2; i++) out.push({ x: this.ax + i * D * 0.22, y: this.ay + D * 0.2 + i * D * 0.06, r: D * 0.16, a });
  }
}

// ---------------------------------------------------------------------------
// Finsternis: a huge dark moon rises behind the planet, only its crescent rim burns red.
// p: radius (D), at (anchor), lightAngle (deg, side of the lit crescent), color, body.
// Accent: the rim flares up.
// ---------------------------------------------------------------------------

export class ShadowMoon extends Hero {
  private rim: Tex;
  private halo: Tex;
  private body: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = this.colorStatic('color', 'hue');
    this.rim = rimTex(c);
    this.halo = glowTex(c, 'soft');
    const bodyCol = this.colorStatic('body', '#140a12');
    this.body = bakeTex(`darkmoon|${bodyCol}|${c}`, () => {
      const [r, g, b] = rgb01(bodyCol);
      const [cr, cg, cb] = rgb01(c);
      const gn = noiseGrid(4, 6, 41);
      return paintTex(256, 256, (u, v) => {
        const d = Math.sqrt(u * u + v * v);
        if (d >= 1) return PX_NONE;
        const n = sampleNoise(gn, (u + 1) / 2, (v + 1) / 2);
        const crater = n > 0.62 ? 0.75 : 1;
        const rimGlow = Math.pow(d, 8) * 0.25;
        return pxOut((r * crater + cr * rimGlow) * (0.9 + n * 0.2), (g * crater + cg * rimGlow) * (0.9 + n * 0.2), (b * crater + cb * rimGlow) * (0.9 + n * 0.2), smooth((1 - d) / 0.015));
      });
    });
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.0) * D * k;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const br = this.inst.breathe(env.clock) * this.inst.motion;
    // Rise during the intro.
    const rise = (1 - easeOut(this.introK())) * D * 0.6;
    const cx = this.ax;
    const cy = this.ay + rise;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, cx, cy);
    ctx.globalAlpha = Math.min(1, a * (0.28 + 0.04 * br + acc * 0.35));
    blit(ctx, this.halo, 0, 0, R * 2.9);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.body, 0, 0, R * 2);
    ctx.globalCompositeOperation = 'lighter';
    const ang = this.num('lightAngle', 200) * DEG;
    xScreen(env, this.inst, cx, cy, ang);
    ctx.globalAlpha = Math.min(1, a * (0.12 + acc * 0.35));
    ctx.drawImage(this.rim, -R, -R, R * 2, R * 2);
    // The burning crescent: a sharp glowing edge on the lit side, tapering at the horns.
    const hue = this.color('color', 'hue');
    xform(env, this.inst, cx, cy);
    for (let i = 0; i < 3; i++) {
      const span = (0.95 - i * 0.28) * (1 + acc * 0.15);
      glowStroke(ctx, () => ctx.arc(0, 0, R * 0.995, ang - span, ang + span), D * (0.022 - i * 0.005), hue, a * (0.55 + i * 0.2) * (1 + acc * 0.8), i === 2 ? 0.7 : 0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: this.num('lightAngle', 200) * DEG, boost: this.inst.accent.env * 0.5 };
  }
}

// ---------------------------------------------------------------------------
// Meteorit: a burning meteor flies in and hits the ground exactly when the accent fires;
// afterwards the impact glows. Between impacts the next meteor hangs high in the sky and
// creeps closer. p: flight (s), from [x, y], impact [x, y] (D, impact y on the ground plane
// is added), approach (path fraction before `from` while waiting), size (D), color, fire, smoke.
// ---------------------------------------------------------------------------

export class Meteor extends Hero {
  private rock: Tex;
  private fire: Tex;
  private tail: Tex;
  private glow: Tex;
  private glint: Tex;
  private puff: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.rock = spriteTex('chunk', this.colorStatic('fire', 'accent'));
    this.fire = glowTex(this.colorStatic('fire', 'accent'), 'core');
    this.tail = streakTex(this.colorStatic('color', 'hue'));
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.glint = glintTex(this.colorStatic('color', 'hue'));
    this.puff = puffTex(this.colorStatic('smoke', 'smoke'), 1);
  }

  protected override defaultSlot(): Slot {
    return 'heroFront';
  }

  private path(k: number): [number, number] {
    const from = this.list('from');
    const to = this.list('impact');
    const fx = (from[0] ?? 2.2) * D;
    const fy = (from[1] ?? -2.6) * D;
    const ix = (to[0] ?? 0.75) * D;
    const iy = (to[1] ?? 0) * D + this.inst.groundY;
    return [fx + (ix - fx) * k, fy + (iy - fy) * k];
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot && slot !== 'ground') return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const flight = this.num('flight', 1.5);
    const tt = this.inst.timeToNextAccent(env.clock);
    const since = this.inst.accent.since;
    const [ix, iy] = this.path(1);
    ctx.globalCompositeOperation = 'lighter';
    if (slot === 'ground') {
      // Impact glow: builds up while the meteor approaches, then cools down.
      const pre = tt < flight ? easeIn(1 - tt / flight) * 0.5 : 0;
      const post = since < 4 ? Math.max(0, 1 - since / 4) : 0;
      // The crater keeps smouldering between impacts.
      const g = Math.max(pre, post, 0.22);
      if (g > 0.01) {
        xform(env, this.inst, ix, iy, 1, 0, 0, this.inst.groundSquash * 1.3);
        ctx.globalAlpha = Math.min(1, a * g);
        blit(ctx, this.glow, 0, 0, D * 1.6 * (0.6 + g * 0.6));
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    // Between impacts the next meteor hangs high in the sky as a small burning point and
    // creeps closer (path before its start, k < 0); then it flies in (k 0 -> 1).
    const flying = tt <= flight && !this.inst.reduced;
    const k = flying ? easeIn(1 - tt / flight) : -this.num('approach', 0.25) * clamp01((tt - flight) / 6);
    const vis = flying ? 1 : smooth(clamp01((since - 1.2) / 1.2)) * 0.85;
    if (vis <= 0.01) {
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    const [x, y] = this.path(k);
    const [px, py] = this.path(Math.max(0, k - 0.06));
    const dx = x - px;
    const dy = y - py;
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const size = this.num('size', 0.22) * D * (flying ? 0.45 + 0.55 * k : 0.6);
    // Smoke trail behind (normal blend).
    ctx.globalCompositeOperation = 'source-over';
    for (let j = 1; j <= (flying ? 7 : 3); j++) {
      const [sx, sy] = this.path(k - j * 0.05);
      ctx.globalAlpha = Math.min(1, a * vis * 0.5 * (1 - j / 8));
      xform(env, this.inst, sx, sy);
      blit(ctx, this.puff, 0, 0, size * (2.2 + j * 0.5));
    }
    ctx.globalCompositeOperation = 'lighter';
    const S = env.view.s * this.inst.scale;
    const len = Math.min(D * 2.2, D * 3 * Math.max(0, k) + size * 2.5);
    ctx.globalAlpha = Math.min(1, a * vis);
    ctx.setTransform(S * ux, S * uy, -S * uy, S * ux, env.view.tx + S * x, env.view.ty + S * y);
    ctx.drawImage(this.tail, -len, -size * 0.6, len + size * 0.4, size * 1.2);
    xform(env, this.inst, x, y);
    ctx.globalAlpha = Math.min(1, a * vis * 0.9);
    blit(ctx, this.fire, 0, 0, size * (flying ? 3.4 : 4.6));
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a * vis);
    xScreen(env, this.inst, x, y, env.clock * 4);
    blit(ctx, this.rock, 0, 0, size * 2.2);
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, x, y);
    // The distant meteor flickers gently like a star (0.7 Hz).
    const tw = flying ? 1 : 0.75 + 0.25 * Math.sin(env.clock * 0.7 * Math.PI * 2);
    ctx.globalAlpha = Math.min(1, a * vis * 0.8 * tw);
    blit(ctx, this.glint, 0, 0, size * (flying ? 2.6 : 3.2));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    const since = this.inst.accent.since;
    if (since > 2) return { angle: Math.atan2(this.path(1)[1], this.path(1)[0]), boost: 0.1 };
    return { angle: Math.atan2(this.path(1)[1], this.path(1)[0]), boost: 0.7 * (1 - since / 2) };
  }
}

// ---------------------------------------------------------------------------
// Gezeitenmond: a glossy water shell around the planet bulges toward its glowing moons
// (and away from them, like real tides). p: shell (D radius), bulge (D), moons, orbit
// [min, max] (D), moonSize (D), tilt, roll, speed (deg/s), color, water, deep.
// Accent: spring tide - a wave rolls around the shell.
// ---------------------------------------------------------------------------

export class TideShell extends Hero {
  private moonTex: Tex;
  private halo: Tex;
  private n = 96;
  private xs = new Float32Array(this.n);
  private ys = new Float32Array(this.n);
  private moons: { x: number; y: number; z: number; r: number; ph: number; sp: number; size: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const col = this.colorStatic('color', 'hue');
    this.moonTex = spriteTex('moon', col);
    this.halo = glowTex(col, 'soft');
    const orbit = this.list('orbit');
    const n = this.num('moons', 3);
    for (let i = 0; i < n; i++) {
      this.moons.push({
        x: 0,
        y: 0,
        z: 0,
        r: ((orbit[0] ?? 1.15) + ((orbit[1] ?? 1.45) - (orbit[0] ?? 1.15)) * (n > 1 ? i / (n - 1) : 0)) * D,
        ph: (i / n) * TAU + 0.6,
        sp: 1 - i * 0.18,
        size: this.num('moonSize', 0.2) * D * (1 - i * 0.15),
      });
    }
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const t = env.clock * this.num('speed', 10) * DEG * this.inst.motion;
    for (const m of this.moons) {
      projectOrbit(m.r * k, m.ph + t * m.sp, this.num('tilt', 0.3), this.num('roll', -10) * DEG, tmp);
      m.x = this.ax + tmp.x;
      m.y = this.ay + tmp.y;
      m.z = tmp.z;
    }
    const R0 = this.num('shell', 0.6) * D * k;
    const bulge = this.num('bulge', 0.1) * D;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const waveAng = clamp01(this.inst.accent.since / dur) * TAU - Math.PI / 2;
    for (let i = 0; i < this.n; i++) {
      const th = (i / this.n) * TAU;
      let r = R0;
      for (const m of this.moons) {
        const tm = Math.atan2(m.y - this.ay, m.x - this.ax);
        const c = Math.cos(th - tm);
        r += bulge * (0.55 + 0.45 * (m.z + 1) * 0.5) * Math.pow(c * c, 3) * (1 + acc * 0.6);
      }
      if (acc > 0) {
        let d = th - waveAng;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        r += acc * bulge * 1.3 * Math.exp(-(d * d) / 0.12);
      }
      r += Math.sin(th * 5 + env.clock * 0.8) * D * 0.006;
      this.xs[i] = this.ax + Math.cos(th) * r;
      this.ys[i] = this.ay + Math.sin(th) * r;
    }
  }

  private shellPath(ctx: CanvasRenderingContext2D): void {
    ctx.moveTo(this.xs[0], this.ys[0]);
    for (let i = 1; i < this.n; i++) ctx.lineTo(this.xs[i], this.ys[i]);
    ctx.closePath();
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const water = this.color('water', 'accent');
    const hue = this.color('color', 'hue');
    // Moons (with their own light).
    ctx.globalCompositeOperation = 'lighter';
    for (const m of this.moons) {
      if ((m.z >= 0) !== front) continue;
      const s = m.size * (1 + 0.15 * m.z);
      xform(env, this.inst, m.x, m.y);
      ctx.globalAlpha = Math.min(1, a * 0.6);
      blit(ctx, this.halo, 0, 0, s * 4);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, a);
      blit(ctx, this.moonTex, 0, 0, s * 2.2);
      ctx.globalCompositeOperation = 'lighter';
    }
    xform(env, this.inst, 0, 0);
    if (!front) {
      // Soft water glow behind the planet.
      ctx.globalAlpha = Math.min(1, a * 0.5);
      blit(ctx, this.halo, this.ax, this.ay, this.num('shell', 0.6) * D * 3.2);
    } else {
      // Translucent shell over the planet: fresnel rim, glossy highlight.
      const R0 = this.num('shell', 0.6) * D;
      const g = ctx.createRadialGradient(this.ax, this.ay, R0 * 0.55, this.ax, this.ay, R0 * 1.25);
      g.addColorStop(0, rgba(water, 0));
      g.addColorStop(0.62, rgba(water, 0.12 * a));
      g.addColorStop(0.82, rgba(hue, 0.3 * a));
      g.addColorStop(1, rgba(hue, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      this.shellPath(ctx);
      ctx.fill();
      glowStroke(ctx, () => this.shellPath(ctx), D * 0.016, hue, a * 0.75, 0.55);
      ctx.strokeStyle = rgba('#ffffff', 0.55 * a);
      ctx.lineWidth = D * 0.02;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(this.ax, this.ay, R0 * 0.86, Math.PI * 1.08, Math.PI * 1.38);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override shadows(out: Shadow[]): void {
    for (const m of this.moons) if (m.z > 0.2 && Math.hypot(m.x - this.ax, m.y - this.ay) < D * 0.75) out.push({ x: m.x - this.ax, y: m.y - this.ay + m.size * 0.3, r: m.size, a: 0.35 * this.alpha() });
  }
}

// ---------------------------------------------------------------------------
// Diamantherz: a heart-cut diamond hovers behind the planet; light sweeps across its
// facets. p: size (D half width), spin (deg/s of the facet light), color, deep, edge.
// Accent: a brilliant eight-pointed flash.
// ---------------------------------------------------------------------------

export class HeartGem extends Hero {
  private outer: [number, number][] = [];
  private inner: [number, number][] = [];
  private glint: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const n = 28;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      this.outer.push([x / 17, (y + 2) / 17]);
    }
    for (const [x, y] of this.outer) this.inner.push([x * 0.46, y * 0.46 - 0.08]);
    this.glint = glintTex(this.colorStatic('edge', 'core'));
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const S = this.num('size', 1.25) * D * k * (1 + 0.012 * this.inst.breathe(env.clock) * this.inst.motion);
    const t = env.clock * this.num('spin', 25) * DEG * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const hue = this.color('color', 'hue');
    const deep = this.color('deep', 'accent');
    const edge = this.color('edge', 'core');
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * (0.4 + acc * 0.3));
    blit(ctx, this.glow, 0, 0, S * 3.4);
    ctx.globalAlpha = 1;
    const n = this.outer.length;
    // Facets: two triangles between the outline and the table, shaded by a sweeping light.
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ang = (i / n) * TAU;
      const b1 = 0.5 + 0.5 * Math.cos(ang * 2 - t);
      const b2 = 0.5 + 0.5 * Math.cos(ang * 2 - t + 1.4);
      const [ox, oy] = this.outer[i];
      const [px, py] = this.outer[j];
      const [ix, iy] = this.inner[i];
      const [jx, jy] = this.inner[j];
      ctx.fillStyle = rgba(mix(deep, hue, b1), (0.14 + 0.38 * b1 * b1) * a);
      ctx.beginPath();
      ctx.moveTo(ox * S, oy * S);
      ctx.lineTo(px * S, py * S);
      ctx.lineTo(ix * S, iy * S);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(mix(deep, '#ffffff', b2 * 0.7), (0.1 + 0.32 * b2 * b2) * a);
      ctx.beginPath();
      ctx.moveTo(px * S, py * S);
      ctx.lineTo(jx * S, jy * S);
      ctx.lineTo(ix * S, iy * S);
      ctx.closePath();
      ctx.fill();
    }
    // Table: brighter centre.
    ctx.fillStyle = rgba(mix(hue, '#ffffff', 0.4), 0.16 * a);
    ctx.beginPath();
    this.inner.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)));
    ctx.closePath();
    ctx.fill();
    // Edges.
    glowStroke(
      ctx,
      () => {
        this.outer.forEach(([x, y], i) => (i ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S)));
        ctx.closePath();
      },
      D * 0.012,
      edge,
      a * 0.9,
      0.6,
    );
    ctx.strokeStyle = rgba(edge, 0.35 * a);
    ctx.lineWidth = D * 0.005;
    ctx.beginPath();
    for (let i = 0; i < n; i += 2) {
      ctx.moveTo(this.outer[i][0] * S, this.outer[i][1] * S);
      ctx.lineTo(this.inner[i][0] * S, this.inner[i][1] * S);
    }
    ctx.stroke();
    // Twinkling vertices (slow).
    for (let i = 0; i < n; i += 4) {
      const tw = Math.pow(Math.max(0, Math.sin(env.clock * 0.8 + i * 1.3)), 8);
      if (tw < 0.05) continue;
      ctx.globalAlpha = Math.min(1, a * tw);
      blit(ctx, this.glint, this.outer[i][0] * S, this.outer[i][1] * S, D * 0.5);
    }
    if (acc > 0.02) {
      // Brilliant: an eight-pointed star.
      const fx = -S * 0.35;
      const fy = -S * 0.45;
      ctx.globalAlpha = Math.min(1, a * acc);
      blit(ctx, this.glint, fx, fy, D * 3 * acc);
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.PI / 4);
      blit(ctx, this.glint, 0, 0, D * 2 * acc);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Polarlicht: aurora curtains arch over the planet, rays drift sideways, the folds wave.
// p: curtains, width (D), height (D), y (D base), bow (D), speed, color (bottom), top.
// Accent: a bright surge runs along the curtains.
// ---------------------------------------------------------------------------

function auroraSlice(bottom: string, top: string): Tex {
  return bakeTex(`aurora|${bottom}|${top}`, () => {
    const cb = rgb01(bottom);
    const ct = rgb01(top);
    return paintTex(16, 256, (u, v) => {
      const along = 1 - (v + 1) / 2; // 0 bottom .. 1 top
      const across = Math.exp(-u * u * 2.2);
      const edge = smooth(along / 0.05);
      const fade = Math.pow(1 - along, 1.15);
      const k = clamp01(along * 1.5 - 0.15);
      const hot = Math.exp(-(((along - 0.04) / 0.05) ** 2)) * 0.6;
      const r = cb[0] + (ct[0] - cb[0]) * k + hot;
      const g = cb[1] + (ct[1] - cb[1]) * k + hot;
      const b = cb[2] + (ct[2] - cb[2]) * k + hot;
      return pxOut(r, g, b, across * edge * fade * (0.55 + hot));
    });
  });
}

export class AuroraCurtains extends Hero {
  private slice: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.slice = auroraSlice(this.colorStatic('color', 'hue'), this.colorStatic('top', 'accent'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const n = this.num('curtains', 3);
    const W = this.num('width', 3.6) * D;
    const H = this.num('height', 1.7) * D;
    const y0 = this.num('y', -0.15) * D;
    const bow = this.num('bow', 0.9) * D;
    const t = env.clock * this.num('speed', 0.12) * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const surge = clamp01(this.inst.accent.since / dur);
    const grow = easeOut(this.introK());
    const slices = env.q > 0.5 ? 54 : 32;
    const sw = (W / slices) * 1.9;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    for (let c = 0; c < n; c++) {
      const isFront = c === n - 1;
      if (isFront !== (slot === 'heroFront')) continue;
      const ca = (isFront ? 0.55 : 1 - c * 0.2) * a;
      const cy = y0 + c * D * 0.18 + (isFront ? D * 0.75 : 0);
      for (let i = 0; i < slices; i++) {
        const f = i / (slices - 1);
        const x = (f - 0.5) * W + noise1(f * 3 + t * 0.6, c * 5) * D * 0.18;
        const fold = noise1(f * 4 - t * 0.8, c * 9 + 2);
        const y = cy - bow * (1 - (2 * f - 1) ** 2) + fold * D * 0.12;
        const ray = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * noise1(f * 22 - t * 2.2, c * 13), 1.6);
        const env2 = smooth(f / 0.12) * smooth((1 - f) / 0.12);
        const boost = 1 + acc * 1.6 * Math.exp(-(((f - surge) / 0.12) ** 2));
        const h = H * (0.6 + 0.4 * (0.5 + 0.5 * noise1(f * 6 + t, c * 3 + 1))) * grow * (isFront ? 0.6 : 1);
        ctx.globalAlpha = Math.min(1, ca * ray * env2 * boost * 0.75);
        ctx.drawImage(this.slice, x - sw / 2, y - h, sw, h);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.1 + this.inst.accent.env * 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Sternenfeuer: a hoop of stellar fire stands behind the planet; flame tongues lick
// outward and inward. p: radius (D), width (D), flames, flameLen (D), spin (deg/s), color,
// hot, pink. Accent: the hoop flares.
// ---------------------------------------------------------------------------

export class FireRing extends Hero {
  private flames: Tex[];
  private ring: Tex;
  private glow: Tex;
  private seeds: number[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.flames = [spriteTex('wisp', this.colorStatic('color', 'hue')), spriteTex('wisp', this.colorStatic('pink', 'accent')), spriteTex('wisp', this.colorStatic('hot', 'core'))];
    this.ring = glowTex(this.colorStatic('color', 'hue'), 'ring');
    this.glow = glowTex(this.colorStatic('pink', 'accent'), 'soft');
    for (let i = 0; i < this.num('flames', 30); i++) this.seeds.push(hash(inst.seed + i * 13) * 50);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.15) * D * k;
    const L = this.num('flameLen', 0.34) * D;
    const t = env.clock * this.inst.motion;
    const spin = t * this.num('spin', 8) * DEG;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * 0.45);
    blit(ctx, this.glow, 0, 0, R * 3.2);
    ctx.globalAlpha = Math.min(1, a * (0.95 + acc * 0.5));
    blit(ctx, this.ring, 0, 0, R * 2 / 0.7);
    blit(ctx, this.ring, 0, 0, R * 2 / 0.7);
    const S = env.view.s * this.inst.scale;
    const n = Math.round(this.seeds.length * (0.6 + 0.4 * env.q));
    for (let i = 0; i < n; i++) {
      const sd = this.seeds[i];
      const ang = (i / n) * TAU + spin;
      const outward = i % 3 !== 2;
      const flick = 0.55 + 0.45 * (0.5 + 0.5 * noise1(t * 1.1 + sd, 4));
      const len = L * flick * (outward ? 1 : 0.6) * (1 + acc * 0.9) * k;
      const w = len * 0.55;
      const r = R + (outward ? len * 0.45 : -len * 0.45);
      const x = this.ax + Math.cos(ang) * r;
      const y = this.ay + Math.sin(ang) * r;
      const rot = ang + (outward ? Math.PI / 2 : -Math.PI / 2);
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      ctx.globalAlpha = Math.min(1, a * (0.75 + 0.25 * flick));
      ctx.setTransform(S * c, S * s, -S * s, S * c, env.view.tx + S * x, env.view.ty + S * y);
      ctx.drawImage(this.flames[i % 3], -w, -len, w * 2, len * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.15 + this.inst.accent.env * 0.5 };
  }
}

// ---------------------------------------------------------------------------
// Phönix: a firebird behind the planet - wings of flame feathers that beat slowly, a crest
// above, long tail plumes below. p: span (D), feathers, beat (deg), beatHz, tail (D),
// color, glow, deep. Accent: rebirth - the wings flare wide.
// ---------------------------------------------------------------------------

export class Phoenix extends Hero {
  private grad = new Map<string, CanvasGradient>();
  private glow: Tex;
  private crest: Tex;
  private glint: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.crest = spriteTex('wisp', this.colorStatic('glow', 'core'));
    this.glint = glintTex(this.colorStatic('glow', 'core'));
  }

  /** One flame feather along +x from the origin, length L, max half width w. */
  private feather(ctx: CanvasRenderingContext2D, L: number, w: number, a: number): void {
    const key = `${Math.round(L)}`;
    let g = this.grad.get(key);
    if (!g) {
      g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, rgba(this.colorStatic('glow', 'core'), 0.95));
      g.addColorStop(0.35, rgba(this.colorStatic('color', 'hue'), 0.85));
      g.addColorStop(0.75, rgba(this.colorStatic('deep', 'accent'), 0.5));
      g.addColorStop(1, rgba(this.colorStatic('deep', 'accent'), 0));
      this.grad.set(key, g);
    }
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.3, -w, L * 0.75, -w * 0.9, L, -w * 0.15);
    ctx.bezierCurveTo(L * 0.8, w * 0.5, L * 0.35, w * 0.8, 0, 0);
    ctx.fill();
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const span = this.num('span', 1.9) * D * k * (1 + acc * 0.15);
    const nf = this.num('feathers', 8);
    const beat = this.num('beat', 9) * DEG * Math.sin(t * this.num('beatHz', 0.2) * TAU) - acc * 14 * DEG;
    const S = env.view.s * this.inst.scale;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.5 + acc * 0.3));
    blit(ctx, this.glow, 0, -D * 0.2, span * 2.4, span * 1.6);
    for (const side of [-1, 1]) {
      for (let j = 0; j < nf; j++) {
        const f = j / (nf - 1);
        // From swept up (primaries) to down (secondaries).
        const ang = (-38 + f * 95) * DEG + beat * (1 - f * 0.6);
        const L = span * (1 - Math.abs(f - 0.15) * 0.55);
        const w = L * 0.09;
        const bx = side * D * 0.18;
        const by = -D * 0.12 + f * D * 0.12;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        // Mirror for the left wing.
        ctx.setTransform(S * c * side, S * s, -S * s * side, S * c, env.view.tx + S * (this.ax + bx), env.view.ty + S * (this.ay + by));
        this.feather(ctx, L, w, a * (0.75 + 0.25 * (1 - f)));
      }
    }
    // Tail plumes.
    const tail = this.num('tail', 1.4) * D * k;
    for (let j = 0; j < 3; j++) {
      const sway = Math.sin(t * 0.3 + j * 1.3) * 0.12;
      const ang = Math.PI / 2 + (j - 1) * 0.22 + sway;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      ctx.setTransform(S * c, S * s, -S * s, S * c, env.view.tx + S * this.ax, env.view.ty + S * (this.ay + D * 0.3));
      this.feather(ctx, tail * (j === 1 ? 1 : 0.8), tail * 0.07, a * 0.8);
    }
    // Crest above the planet.
    xform(env, this.inst, this.ax, this.ay - D * 0.62);
    for (let j = -1; j <= 1; j++) {
      ctx.save();
      ctx.rotate(j * 0.35);
      ctx.globalAlpha = Math.min(1, a * 0.9);
      blit(ctx, this.crest, 0, -D * 0.1, D * 0.18, D * (j === 0 ? 0.42 : 0.32));
      ctx.restore();
    }
    ctx.globalAlpha = Math.min(1, a * (0.6 + acc * 0.4));
    blit(ctx, this.glint, 0, 0, D * 0.5);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.2 + this.inst.accent.env * 0.5 };
  }
}

// ---------------------------------------------------------------------------
// Koronaauswurf: a twisted plasma loop arches from the planet's limb; bright blobs flow
// along it. On the accent it erupts: a glowing bubble is ejected outward.
// p: footA, footB (deg on the limb), height (D), strands, twist (turns), width (D), flow,
// color, hot, deep, bubble (D final radius).
// ---------------------------------------------------------------------------

export class PlasmaLoop extends Hero {
  private blob: Tex;
  private bubble: Tex;
  private n = 64;
  private cx = new Float32Array(this.n + 1);
  private cy = new Float32Array(this.n + 1);
  private nx = new Float32Array(this.n + 1);
  private ny = new Float32Array(this.n + 1);

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.blob = glowTex(this.colorStatic('hot', 'core'), 'core');
    this.bubble = glowTex(this.colorStatic('color', 'hue'), 'ring');
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const R = D * 0.5;
    const fa = this.num('footA', 200) * DEG;
    const fb = this.num('footB', 318) * DEG;
    const h = this.num('height', 1.6) * D * k * (1 + 0.05 * this.inst.breathe(env.clock) * this.inst.motion + acc * 0.35);
    const ax = Math.cos(fa) * R;
    const ay = Math.sin(fa) * R;
    const bx = Math.cos(fb) * R;
    const by = Math.sin(fb) * R;
    const c1x = ax + Math.cos(fa) * h * 1.25;
    const c1y = ay + Math.sin(fa) * h * 1.25;
    const c2x = bx + Math.cos(fb) * h * 1.25;
    const c2y = by + Math.sin(fb) * h * 1.25;
    for (let i = 0; i <= this.n; i++) {
      const s = i / this.n;
      const u = 1 - s;
      this.cx[i] = this.ax + u * u * u * ax + 3 * u * u * s * c1x + 3 * u * s * s * c2x + s * s * s * bx;
      this.cy[i] = this.ay + u * u * u * ay + 3 * u * u * s * c1y + 3 * u * s * s * c2y + s * s * s * by;
    }
    for (let i = 0; i <= this.n; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(this.n, i + 1);
      const dx = this.cx[i1] - this.cx[i0];
      const dy = this.cy[i1] - this.cy[i0];
      const l = Math.hypot(dx, dy) || 1;
      this.nx[i] = -dy / l;
      this.ny[i] = dx / l;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const strands = this.num('strands', 3);
    const twist = this.num('twist', 4);
    const w = this.num('width', 0.05) * D;
    const cols = [this.color('color', 'hue'), this.color('deep', 'accent'), this.color('hot', 'core')];
    const grow = easeOut(this.introK());
    const last = Math.max(2, Math.round(this.n * grow));
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    // Soft core of the loop.
    glowStroke(
      ctx,
      () => {
        ctx.moveTo(this.cx[0], this.cy[0]);
        for (let i = 1; i <= last; i++) ctx.lineTo(this.cx[i], this.cy[i]);
      },
      w * 1.6,
      cols[1],
      a * 0.55,
      0,
    );
    for (let j = 0; j < strands; j++) {
      const ph = (j / strands) * TAU + t * 1.2;
      glowStroke(
        ctx,
        () => {
          for (let i = 0; i <= last; i++) {
            const s = i / this.n;
            const off = Math.sin(s * twist * TAU + ph) * w * 1.4 * Math.sin(s * Math.PI);
            const x = this.cx[i] + this.nx[i] * off;
            const y = this.cy[i] + this.ny[i] * off;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        },
        w * 0.32,
        cols[j % 3],
        a * (0.85 + acc * 0.3),
        0.45,
      );
    }
    // Plasma blobs flowing along.
    for (let b = 0; b < 7; b++) {
      const s = ((t * this.num('flow', 0.22) + b / 7) % 1 + 1) % 1;
      const i = Math.min(last, Math.round(s * this.n));
      ctx.globalAlpha = Math.min(1, a * Math.sin(s * Math.PI) * 0.9);
      blit(ctx, this.blob, this.cx[i], this.cy[i], D * 0.16);
    }
    // Eruption: a bubble is ejected from the apex.
    const since = this.inst.accent.since;
    if (since < 2.4 && !this.inst.reduced) {
      const k = since / 2.4;
      const mid = this.n >> 1;
      const ox = this.cx[mid];
      const oy = this.cy[mid];
      const dx = ox - this.ax;
      const dy = oy - this.ay;
      const l = Math.hypot(dx, dy) || 1;
      // The ejected cloud flies outward from the apex and expands.
      const dist = this.num('bubble', 2.2) * D * easeOut(k);
      const r = D * (0.25 + 0.65 * easeOut(k));
      const px = ox + (dx / l) * dist;
      const py = oy + (dy / l) * dist;
      ctx.globalAlpha = Math.min(1, a * envelope(k, 0.1) * 0.9);
      blit(ctx, this.bubble, px, py, r * 2.2);
      ctx.globalAlpha = Math.min(1, a * envelope(k, 0.1) * 0.7);
      blit(ctx, this.blob, px, py, r * 1.1);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: (((this.num('footA', 200) + this.num('footB', 318)) / 2) * Math.PI) / 180, boost: 0.25 + this.inst.accent.env * 0.5 };
  }
}

export const HEROES_V3_V4 = {
  sunCore: SunCore,
  prism: Prism,
  comet: Comet,
  wisps: Wisps,
  eclipse: Eclipse,
  saturnRings: SaturnRings,
  shadowMoon: ShadowMoon,
  meteor: Meteor,
  tideShell: TideShell,
  heartGem: HeartGem,
  auroraCurtains: AuroraCurtains,
  fireRing: FireRing,
  phoenix: Phoenix,
  plasmaLoop: PlasmaLoop,
};
