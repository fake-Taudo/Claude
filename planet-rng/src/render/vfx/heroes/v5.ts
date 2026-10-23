// Heroes of the V5 auras (Göttlich, Transzendent, Galaktisch).

import type { HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { mix, rgba, spectral } from '../../color';
import { blit, clipHalf, D, type AuraInstance, type FrameEnv, projectOrbit, xform, xPlane, xScreen } from '../core';
import { clamp01, DEG, easeInOut, easeOut, hash, noise1, Rng, smooth, TAU } from '../math';
import { bloomOf, sigilTex } from '../sigil';
import { bakeTex, coneTex, glintTex, glowTex, noiseGrid, paintTex, pillarTex, PX_NONE, pxOut, rgb01, sampleNoise, spiralTex, spriteTex, type Tex } from '../tex';
import { glowStroke, Hero } from './base';
import { sunTex } from './v3-v4';

const tmp = { x: 0, y: 0, z: 0 };

/** Accretion disc: hot inner edge, swirling streaks, cooling outward. inner = inner/outer radius. */
export function accretionTex(hot: string, mid: string, deep: string, inner: number, seed: number): Tex {
  return bakeTex(`accretion|${hot}|${mid}|${deep}|${inner}|${seed}`, () => {
    const ch = rgb01(hot);
    const cm = rgb01(mid);
    const cd = rgb01(deep);
    const g = noiseGrid(4, 6, seed);
    return paintTex(512, 512, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1 || d < inner * 0.92) return PX_NONE;
      const f = (d - inner) / (1 - inner);
      const ang = (Math.atan2(v, u) / TAU + 1) % 1;
      const streak = 0.55 + 0.45 * sampleNoise(g, ang + f * 0.6, f * 0.8);
      const fine = 0.75 + 0.25 * Math.sin(f * 60 + streak * 6);
      const a = f < 0.5 ? ch : cm;
      const b = f < 0.5 ? cm : cd;
      const k = f < 0.5 ? f * 2 : (f - 0.5) * 2;
      const edge = smooth((d - inner * 0.92) / (inner * 0.12)) * Math.pow(1 - clamp01(f), 1.2);
      return pxOut(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, edge * streak * fine * 0.95);
    });
  });
}

// ---------------------------------------------------------------------------
// Singularität: a black hole above-behind the planet with an oblique accretion disc and
// gravitational lensing of the stage behind it. p: horizon, disc, inner (D), tilt, roll,
// spin (deg/s), lens (0..1), color, hot, deep.
// ---------------------------------------------------------------------------

export class BlackHole extends Hero {
  private disc: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const inner = Math.round((this.num('inner', 0.55) / this.num('disc', 1.6)) * 100) / 100;
    this.disc = accretionTex(this.colorStatic('hot', 'core'), this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), inner, inst.seed % 97);
    this.glow = glowTex(this.colorStatic('deep', 'accent'), 'soft');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const H = this.num('horizon', 0.42) * D * k;
    const R = this.num('disc', 1.6) * D * k;
    const tilt = this.num('tilt', 0.28);
    const roll = this.num('roll', -22) * DEG;
    const spin = env.clock * this.num('spin', 22) * DEG * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    // Gravitational lensing: magnify what is already drawn around the hole.
    const lens = this.num('lens', 0.3);
    if (lens > 0 && env.q >= 1) {
      const S = env.view.s * this.inst.scale;
      const cx = env.view.tx + S * this.ax;
      const cy = env.view.ty + S * this.ay;
      const rl = S * H * 2.6;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.arc(cx, cy, rl, 0, TAU);
      ctx.clip();
      const src = rl * (1 - lens);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(ctx.canvas, cx - src, cy - src, src * 2, src * 2, cx - rl, cy - rl, rl * 2, rl * 2);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * 0.7);
    blit(ctx, this.glow, 0, 0, R * 2.6);
    // Far half of the disc.
    ctx.save();
    clipHalf(env, this.inst, this.ax, this.ay, roll, 'back');
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, roll);
    ctx.globalAlpha = Math.min(1, a * (0.85 + acc * 0.3));
    ctx.drawImage(this.disc, -R, -R, R * 2, R * 2);
    ctx.restore();
    // Lensed image of the far side bending over the top of the horizon.
    xform(env, this.inst, this.ax, this.ay);
    const hot = this.color('hot', 'core');
    const hue = this.color('color', 'hue');
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.32, Math.PI * 1.08, Math.PI * 1.92), D * 0.05, hue, a * 0.6, 0.4);
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.25, Math.PI * 0.2, Math.PI * 0.8), D * 0.025, hue, a * 0.35, 0);
    // The horizon.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, H, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.04, 0, TAU), D * 0.012, hot, a * (0.85 + acc), 0.6);
    // Near half of the disc in front of the horizon.
    ctx.save();
    clipHalf(env, this.inst, this.ax, this.ay, roll, 'front');
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, roll);
    ctx.globalAlpha = Math.min(1, a * (0.95 + acc * 0.3));
    ctx.drawImage(this.disc, -R, -R, R * 2, R * 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: Math.atan2(this.ay, this.ax), boost: 0.1 + this.inst.accent.env * 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Akkretion: a star is torn into a glowing stream that spirals into a small black hole.
// p: hole [x, y], star [x, y], starSize, disc (D), tilt, roll, flow, color, hot, deep.
// Accent: tidal flare - jets burst from the hole.
// ---------------------------------------------------------------------------

export class TidalStream extends Hero {
  private star: Tex;
  private starGlow: Tex;
  private disc: Tex;
  private blob: Tex;
  private jet: Tex;
  private n = 60;
  private xs = new Float32Array(this.n + 1);
  private ys = new Float32Array(this.n + 1);

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.star = sunTex(this.colorStatic('hot', 'core'), this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), (inst.seed % 200) + 9);
    this.starGlow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.disc = accretionTex(this.colorStatic('hot', 'core'), this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), 0.3, inst.seed % 89);
    this.blob = glowTex(this.colorStatic('hot', 'core'), 'core');
    this.jet = coneTex(this.colorStatic('hot', 'core'), false);
  }

  private pt(name: string, def: [number, number]): [number, number] {
    const l = this.list(name);
    return [(l[0] ?? def[0]) * D, (l[1] ?? def[1]) * D];
  }

  override update(env: FrameEnv): void {
    const [hx, hy] = this.pt('hole', [0.55, -1.0]);
    const [sx, sy] = this.pt('star', [-1.5, -1.25]);
    const d0 = Math.hypot(sx - hx, sy - hy);
    const t0 = Math.atan2(sy - hy, sx - hx);
    const discR = this.num('disc', 0.55) * D;
    const wob = Math.sin(env.clock * 0.3) * 0.08;
    for (let i = 0; i <= this.n; i++) {
      const s = i / this.n;
      const r = d0 * (1 - s) + discR * 0.85 * s;
      const th = t0 + s * Math.PI * (1.25 + wob);
      // Squash toward the disc plane as the stream approaches the hole.
      const squash = 1 - s * (1 - this.num('tilt', 0.3));
      this.xs[i] = hx + Math.cos(th) * r;
      this.ys[i] = hy + Math.sin(th) * r * squash;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [hx, hy] = this.pt('hole', [0.55, -1.0]);
    const [sx, sy] = this.pt('star', [-1.5, -1.25]);
    const k = this.introScale();
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const t = env.clock * this.inst.motion;
    const ss = this.num('starSize', 0.5) * D * k;
    // The star, stretched toward the hole.
    const ang = Math.atan2(hy - sy, hx - sx);
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, sx, sy);
    ctx.globalAlpha = Math.min(1, a * 0.8);
    blit(ctx, this.starGlow, 0, 0, ss * 3.4);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    xScreen(env, this.inst, sx, sy, ang, 1.18, 0.92);
    blit(ctx, this.star, 0, 0, ss);
    ctx.globalCompositeOperation = 'lighter';
    // The stream.
    const hue = this.color('color', 'hue');
    const hot = this.color('hot', 'core');
    xform(env, this.inst, 0, 0);
    const grow = Math.max(2, Math.round(this.n * easeOut(this.introK())));
    for (let seg = 0; seg < 3; seg++) {
      const i0 = Math.floor((seg * grow) / 3);
      const i1 = Math.floor(((seg + 1) * grow) / 3);
      const w = D * (0.07 - seg * 0.018);
      glowStroke(
        ctx,
        () => {
          ctx.moveTo(this.xs[i0], this.ys[i0]);
          for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(this.xs[i], this.ys[i]);
        },
        w,
        seg === 2 ? hot : hue,
        a * (0.75 + acc * 0.3),
        0.4,
      );
    }
    for (let b = 0; b < 8; b++) {
      const s = ((t * this.num('flow', 0.25) + b / 8) % 1 + 1) % 1;
      const i = Math.min(grow, Math.round(s * this.n));
      ctx.globalAlpha = Math.min(1, a * 0.85 * smooth(s / 0.1));
      blit(ctx, this.blob, this.xs[i], this.ys[i], D * 0.12 * (1 - s * 0.5));
    }
    // Disc and hole.
    const discR = this.num('disc', 0.55) * D * k;
    const tilt = this.num('tilt', 0.3);
    const roll = this.num('roll', 15) * DEG;
    ctx.globalAlpha = Math.min(1, a * (0.95 + acc * 0.5));
    xPlane(env, this.inst, hx, hy, t * 40 * DEG, tilt, roll);
    ctx.drawImage(this.disc, -discR, -discR, discR * 2, discR * 2);
    xform(env, this.inst, hx, hy);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, discR * 0.26, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => ctx.arc(0, 0, discR * 0.28, 0, TAU), D * 0.01, hot, a, 0.5);
    // Tidal flare: two jets.
    const jet = Math.max(acc, 0.12);
    const L = D * 2.4 * (0.4 + jet);
    const W = L * 0.16;
    ctx.globalAlpha = Math.min(1, a * jet);
    for (const dir of [-1, 1]) {
      xScreen(env, this.inst, hx, hy, (dir * Math.PI) / 2);
      ctx.drawImage(this.jet, 0, -W / 2, L, W);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    const [sx, sy] = this.pt('star', [-1.5, -1.25]);
    return { angle: Math.atan2(sy, sx), boost: 0.2 + this.inst.accent.env * 0.4 };
  }
}

// ---------------------------------------------------------------------------
// Blutmond: a giant red full moon rises behind the planet inside a moon halo.
// p: radius, halo (D ring radius), color, main, deep. Accent: a shadow wanders across.
// ---------------------------------------------------------------------------

function redMoonTex(light: string, main: string, deep: string, seed: number): Tex {
  return bakeTex(`redmoon|${light}|${main}|${deep}|${seed}`, () => {
    const cl = rgb01(light);
    const cm = rgb01(main);
    const cd = rgb01(deep);
    const maria = noiseGrid(4, 3, seed);
    const crat = noiseGrid(3, 14, seed + 3);
    return paintTex(256, 256, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d >= 1) return PX_NONE;
      const mu = Math.sqrt(1 - d * d);
      const m = sampleNoise(maria, (u + 1) / 2, (v + 1) / 2);
      const c = sampleNoise(crat, (u + 1) / 2, (v + 1) / 2);
      const dark = clamp01((m - 0.48) * 3) * 0.55 + (c > 0.7 ? 0.25 : 0);
      const lit = Math.pow(mu, 0.6) * (1 - dark);
      const a = lit < 0.5 ? cd : cm;
      const b = lit < 0.5 ? cm : cl;
      const f = lit < 0.5 ? lit * 2 : (lit - 0.5) * 2;
      return pxOut(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, smooth((1 - d) / 0.012));
    });
  });
}

export class BloodMoon extends Hero {
  private moon: Tex;
  private glow: Tex;
  private ring: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.moon = redMoonTex(this.colorStatic('color', 'hue'), this.colorStatic('main', 'main'), this.colorStatic('deep', 'accent'), inst.seed % 77);
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.ring = glowTex(this.colorStatic('color', 'hue'), 'ring');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.35) * D * k;
    const rise = (1 - easeOut(this.introK())) * D * 0.8;
    const cy = this.ay + rise;
    const br = this.inst.breathe(env.clock) * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, cy);
    ctx.globalAlpha = Math.min(1, a * (0.55 + 0.05 * br));
    blit(ctx, this.glow, 0, 0, R * 3.4);
    const halo = this.num('halo', 2.3) * D * k;
    ctx.globalAlpha = Math.min(1, a * 0.4);
    blit(ctx, this.ring, 0, 0, (halo * 2) / 0.7);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.moon, 0, 0, R * 2);
    if (acc > 0.01) {
      // The shadow wanders across the disc.
      const dur = this.inst.spec.motion.accent.duration ?? 2;
      const p = clamp01(this.inst.accent.since / dur);
      const x = -R * 1.6 + R * 3.2 * easeInOut(p);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.clip();
      const g = ctx.createRadialGradient(x, 0, R * 0.2, x, 0, R * 1.1);
      g.addColorStop(0, `rgba(10,0,4,${0.75 * acc * a})`);
      g.addColorStop(1, 'rgba(10,0,4,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => ctx.arc(0, 0, R * 0.995, Math.PI * 0.95, Math.PI * 1.65), D * 0.02, this.color('color', 'hue'), a * 0.7, 0.4);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: Math.atan2(this.ay, this.ax || 0.001), boost: 0.25 - this.inst.accent.env * 0.15 };
  }
}

// ---------------------------------------------------------------------------
// Seraph: three pairs of luminous wings behind the planet and a golden halo above.
// p: span (D), feathers, fold (deg), foldHz, color (gold), light, sky.
// Accent: the wings spread and the halo flares.
// ---------------------------------------------------------------------------

export class SeraphWings extends Hero {
  private grads = new Map<number, CanvasGradient>();
  private glow: Tex;
  private glint: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.glow = glowTex(this.colorStatic('light', 'core'), 'soft');
    this.glint = glintTex(this.colorStatic('light', 'core'));
  }

  private feather(ctx: CanvasRenderingContext2D, L: number, w: number, a: number): void {
    const key = Math.round(L);
    let g = this.grads.get(key);
    if (!g) {
      g = ctx.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, rgba(this.colorStatic('light', 'core'), 0.95));
      g.addColorStop(0.45, rgba(this.colorStatic('color', 'hue'), 0.6));
      g.addColorStop(0.85, rgba(this.colorStatic('sky', 'accent'), 0.25));
      g.addColorStop(1, rgba(this.colorStatic('sky', 'accent'), 0));
      this.grads.set(key, g);
    }
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(L * 0.35, -w, L * 0.8, -w * 0.7, L, 0);
    ctx.bezierCurveTo(L * 0.8, w * 0.35, L * 0.35, w * 0.55, 0, 0);
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
    const span = this.num('span', 1.9) * D * k;
    const fold = this.num('fold', 6) * DEG * Math.sin(t * this.num('foldHz', 0.15) * TAU) - acc * 10 * DEG;
    const nf = this.num('feathers', 7);
    const S = env.view.s * this.inst.scale;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.22 + acc * 0.25));
    blit(ctx, this.glow, 0, -D * 0.15, span * 2.2, span * 1.4);
    // Pairs: upper, middle, lower - each a wing of overlapping feathers with short coverts
    // near the body, so the silhouette reads as a wing and not as rays.
    const pairs: [number, number, number][] = [
      [-34, 1.0, 40],
      [6, 0.8, 30],
      [40, 0.6, 24],
    ];
    for (const side of [-1, 1]) {
      pairs.forEach(([base, len, fan], p) => {
        const bx = side * D * 0.14;
        const by = -D * 0.08 + p * D * 0.1;
        for (let row = 0; row < 2; row++) {
          const rowLen = row === 0 ? 1 : 0.45;
          for (let j = 0; j < nf; j++) {
            const f = j / (nf - 1);
            // Leading feathers on top are the longest; the wing tapers toward the trailing edge.
            const ang = (base + (f - 0.5) * fan) * DEG + fold * (1 - p * 0.3);
            const L = span * len * rowLen * (1 - f * 0.35);
            const c = Math.cos(ang);
            const s = Math.sin(ang);
            ctx.setTransform(S * c * side, S * s, -S * s * side, S * c, env.view.tx + S * (this.ax + bx), env.view.ty + S * (this.ay + by));
            this.feather(ctx, L, L * (row === 0 ? 0.13 : 0.22), a * (row === 0 ? 0.42 : 0.5) * (1 - p * 0.15));
          }
        }
      });
    }
    // Golden halo above the planet.
    const hy = this.ay - D * 0.82;
    xform(env, this.inst, this.ax, hy);
    const gold = this.color('color', 'hue');
    glowStroke(ctx, () => ctx.ellipse(0, 0, D * 0.42, D * 0.11, 0, 0, TAU), D * 0.03, gold, a * (0.85 + acc * 0.5), 0.6);
    ctx.globalAlpha = Math.min(1, a * (0.5 + acc));
    blit(ctx, this.glint, D * 0.3, -D * 0.06, D * 0.5 * (1 + acc));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.25 + this.inst.accent.env * 0.5 };
  }
}

// ---------------------------------------------------------------------------
// Zeitriss: a jagged vertical tear in space behind the planet; another sky shows through;
// clock shards drift out and back again (time running backwards).
// p: height, width (D), jag, color, pink, void, shards. Accent: the rift tears wide open.
// ---------------------------------------------------------------------------

function riftStarsTex(c1: string, c2: string, seed: number): Tex {
  return bakeTex(`riftstars|${c1}|${c2}|${seed}`, () => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, rgba(c2, 0.25));
    g.addColorStop(0.5, rgba(c1, 0.18));
    g.addColorStop(1, rgba(c2, 0.25));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 512);
    const rng = new Rng(seed);
    for (let i = 0; i < 160; i++) {
      const x = rng.next() * 128;
      const y = rng.next() * 512;
      const r = 0.6 + Math.pow(rng.next(), 3) * 3;
      const col = rng.next() < 0.5 ? c1 : c2;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)');
      gr.addColorStop(0.3, rgba(col, 0.7));
      gr.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
    return c;
  });
}

export class TimeRift extends Hero {
  private stars: Tex;
  private glow: Tex;
  private shard: Tex[];
  private n = 26;
  private lx = new Float32Array(this.n + 1);
  private rx = new Float32Array(this.n + 1);
  private ys = new Float32Array(this.n + 1);

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.stars = riftStarsTex(this.colorStatic('color', 'hue'), this.colorStatic('pink', 'accent'), inst.seed % 101);
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    this.shard = [spriteTex('shard', this.colorStatic('color', 'hue')), spriteTex('gear', this.colorStatic('pink', 'accent'))];
  }

  override update(env: FrameEnv): void {
    const H = this.num('height', 3.6) * D * easeOut(this.introK());
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const W = this.num('width', 0.55) * D * (1 + 0.06 * this.inst.breathe(env.clock) * this.inst.motion + acc * 0.9);
    const top = this.ay - H * 0.62;
    const t = env.clock * this.inst.motion;
    for (let i = 0; i <= this.n; i++) {
      const f = i / this.n;
      const y = top + H * f;
      const lens = Math.pow(Math.max(0, 1 - (2 * f - 1) ** 2), 0.7);
      const jag = (hash(i * 31 + this.inst.seed) - 0.5) * W * 0.5 * lens + noise1(f * 6 + t * 0.4, 3) * W * 0.12;
      const jag2 = (hash(i * 17 + this.inst.seed + 5) - 0.5) * W * 0.5 * lens + noise1(f * 6 - t * 0.35, 9) * W * 0.12;
      this.lx[i] = this.ax - (W / 2) * lens + jag;
      this.rx[i] = this.ax + (W / 2) * lens + jag2;
      this.ys[i] = y;
    }
  }

  private outline(ctx: CanvasRenderingContext2D): void {
    ctx.moveTo(this.lx[0], this.ys[0]);
    for (let i = 1; i <= this.n; i++) ctx.lineTo(this.lx[i], this.ys[i]);
    for (let i = this.n; i >= 0; i--) ctx.lineTo(this.rx[i], this.ys[i]);
    ctx.closePath();
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const H = this.num('height', 3.6) * D;
    const W = this.num('width', 0.55) * D;
    const t = env.clock * this.inst.motion;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * (0.45 + acc * 0.4));
    blit(ctx, this.glow, this.ax, this.ay - H * 0.12, W * 5, H * 1.15);
    // The void with another sky inside.
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.beginPath();
    this.outline(ctx);
    ctx.fillStyle = rgba(this.color('void', '#03020a'), 0.96 * a);
    ctx.fill();
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    const th = H * 1.2;
    const off = ((t * D * 0.12) % th + th) % th;
    for (const dy of [-th, 0]) ctx.drawImage(this.stars, this.ax - W, this.ay - H * 0.62 + off + dy, W * 2, th);
    ctx.restore();
    // Edges with a chromatic offset.
    ctx.globalCompositeOperation = 'lighter';
    const edge = (xs: Float32Array, dx: number, col: string, al: number) =>
      glowStroke(
        ctx,
        () => {
          ctx.moveTo(xs[0] + dx, this.ys[0]);
          for (let i = 1; i <= this.n; i++) ctx.lineTo(xs[i] + dx, this.ys[i]);
        },
        D * 0.014,
        col,
        al,
        0.5,
      );
    const hue = this.color('color', 'hue');
    const pink = this.color('pink', 'accent');
    edge(this.lx, 0, hue, a * (0.9 + acc));
    edge(this.rx, 0, hue, a * (0.9 + acc));
    edge(this.lx, -D * 0.02, pink, a * 0.5);
    edge(this.rx, D * 0.02, pink, a * 0.5);
    // Shards drift out and fly back (time runs backwards).
    const n = this.num('shards', 10);
    const S = env.view.s * this.inst.scale;
    for (let i = 0; i < n; i++) {
      const ph = hash(i * 13 + 7);
      const period = 5 + ph * 3;
      const c = ((t / period + ph) % 1 + 1) % 1;
      const out = c < 0.5 ? easeInOut(c * 2) : easeInOut((1 - c) * 2);
      const dir = (hash(i * 29 + 3) < 0.5 ? -1 : 1) * (0.4 + hash(i * 3) * 0.9);
      const y0 = this.ay - H * 0.5 + H * 0.85 * hash(i * 41 + 1);
      const x = this.ax + Math.cos(dir) * D * 1.3 * out * Math.sign(dir);
      const y = y0 + Math.sin(dir) * D * 0.5 * out;
      const rot = t * (c < 0.5 ? 1.5 : -1.5) + i;
      const size = D * (0.08 + 0.05 * hash(i * 7));
      ctx.globalAlpha = Math.min(1, a * smooth(out / 0.15) * 0.9);
      ctx.setTransform(S * Math.cos(rot), S * Math.sin(rot), -S * Math.sin(rot), S * Math.cos(rot), env.view.tx + S * x, env.view.ty + S * y);
      ctx.drawImage(this.shard[i % 2], -size, -size, size * 2, size * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Ewigkeit: a lemniscate (infinity sign) of spectral light keeps drawing itself; one
// branch passes in front of the planet. p: size (D half width), width (D), speed
// (cycles/s of the pen), tail (fraction of the curve lit brightly). Accent: a spectrum
// wave runs through.
// ---------------------------------------------------------------------------

export class Lemniscate extends Hero {
  private n = 96;
  private xs = new Float32Array(this.n + 1);
  private ys = new Float32Array(this.n + 1);
  private front = new Uint8Array(this.n + 1);
  private glint: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.glint = glintTex('#ffffff');
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
  }

  override update(_env: FrameEnv): void {
    const A = this.num('size', 1.55) * D * this.introScale();
    for (let i = 0; i <= this.n; i++) {
      const t = (i / this.n) * TAU;
      const den = 1 + Math.sin(t) ** 2;
      this.xs[i] = this.ax + (A * Math.cos(t)) / den;
      this.ys[i] = this.ay + (A * Math.sin(t) * Math.cos(t)) / den;
      const dt = Math.abs(t - Math.PI / 2);
      this.front[i] = dt < 0.5 ? 1 : 0;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront' ? 1 : 0;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const head = ((env.clock * this.num('speed', 0.08) * this.inst.motion) % 1 + 1) % 1;
    const tail = this.num('tail', 0.55);
    const W = this.num('width', 0.07) * D * (1 + acc * 0.4);
    const hueShift = env.clock * 20 + acc * 360 * clamp01(this.inst.accent.since / 2);
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (!front) {
      ctx.globalAlpha = Math.min(1, a * 0.3);
      blit(ctx, this.glow, this.ax, this.ay, D * 4.4, D * 2.4);
    }
    // Visible part grows during the intro.
    const shown = easeOut(this.introK());
    for (let i = 0; i < this.n; i++) {
      if (this.front[i] !== front) continue;
      const s = i / this.n;
      if (s > shown) continue;
      const behind = (head - s + 1) % 1;
      const b = 0.3 + 0.7 * Math.exp(-behind / tail);
      const col = spectral(s * 360 + hueShift);
      const x0 = this.xs[i];
      const y0 = this.ys[i];
      const x1 = this.xs[i + 1];
      const y1 = this.ys[i + 1];
      for (const [w, al, c] of [[W * 4, 0.1, col], [W * 1.8, 0.35, col], [W * 0.6, 0.8, mix(col, '#ffffff', 0.6)]] as [number, number, string][]) {
        ctx.lineWidth = w;
        ctx.strokeStyle = rgba(c, Math.min(1, al * b * a));
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    // The pen.
    const hi = Math.floor(head * this.n);
    if (this.front[hi] === front && head <= shown) {
      ctx.globalAlpha = Math.min(1, a);
      blit(ctx, this.glint, this.xs[hi], this.ys[hi], D * 0.7);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Chronosphäre: a golden clock-face portal with real moving hands and turning gears.
// p: radius (D), color, light, deep, gears. Accent: all hands sweep to twelve, a chime.
// ---------------------------------------------------------------------------

export class ClockPortal extends Hero {
  private dial: Tex;
  private bloom: Tex;
  private gear: Tex[];
  private glow: Tex;
  private glint: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const gold = this.colorStatic('color', 'hue');
    this.dial = sigilTex(
      `${inst.spec.id}|dial`,
      [
        { e: 'band', r: 0.93, w: 0.07, a: 0.38 },
        { e: 'ring', r: 1, w: 0.008, a: 0.9 },
        { e: 'ring', r: 0.86, w: 0.005, a: 0.6 },
        { e: 'numerals', r: 0.78, n: 12, size: 0.1, w: 0.006, a: 0.95 },
        { e: 'ticks', r: 0.97, n: 60, len: 0.04, w: 0.004, a: 0.75 },
        { e: 'dots', r: 0.9, n: 12, size: 0.016 },
        { e: 'band', r: 0.48, w: 0.06, a: 0.25 },
        { e: 'ring', r: 0.62, w: 0.004, a: 0.4 },
      ],
      gold,
      1,
      (c) => inst.colStatic(c),
    );
    this.bloom = bloomOf(this.dial);
    this.gear = [spriteTex('gear', gold), spriteTex('gear', this.colorStatic('light', 'core'))];
    this.glow = glowTex(gold, 'soft');
    this.glint = glintTex(this.colorStatic('light', 'core'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.65) * D * k;
    const t = env.clock;
    const m = this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.35 + acc * 0.3));
    blit(ctx, this.glow, 0, 0, R * 2.8);
    // Gears behind the rim.
    const gears = this.num('gears', 3);
    for (let i = 0; i < gears; i++) {
      const ang = (-150 + i * 120) * DEG;
      const gr = R * (0.32 + 0.1 * (i % 2));
      const gx = Math.cos(ang) * R * 1.02;
      const gy = Math.sin(ang) * R * 1.02;
      const rot = t * m * (i % 2 ? -12 : 9) * DEG;
      ctx.globalAlpha = Math.min(1, a * 0.7);
      xScreen(env, this.inst, this.ax + gx, this.ay + gy, rot);
      ctx.drawImage(this.gear[i % 2], -gr * 2, -gr * 2, gr * 4, gr * 4);
    }
    // Dial.
    xform(env, this.inst, this.ax, this.ay);
    const H = R * 1.12;
    ctx.globalAlpha = Math.min(1, a * 0.6);
    ctx.drawImage(this.bloom, -H * 1.04, -H * 1.04, H * 2.08, H * 2.08);
    ctx.globalAlpha = Math.min(1, a * (1 + acc * 0.5));
    ctx.drawImage(this.dial, -H, -H, H * 2, H * 2);
    // Hands (real time of the clock); the second hand ticks with a soft ease.
    const sec = Math.floor(t);
    const frac = t - sec;
    const tick = sec + easeOut(Math.min(1, frac / 0.18));
    let sAng = ((tick % 60) / 60) * TAU - Math.PI / 2;
    let mAng = (((t / 60) % 60) / 60) * TAU - Math.PI / 2;
    let hAng = (((t / 3600) % 12) / 12) * TAU - Math.PI / 2;
    if (acc > 0) {
      const pull = (ang: number) => ang + (((-Math.PI / 2 - ang) % TAU) + TAU * 1.5) % TAU - Math.PI;
      sAng += (pull(sAng) - sAng) * acc;
      mAng += (pull(mAng) - mAng) * acc;
      hAng += (pull(hAng) - hAng) * acc;
    }
    const gold = this.color('color', 'hue');
    const light = this.color('light', 'core');
    const hand = (ang: number, len: number, w: number, col: string) =>
      glowStroke(
        ctx,
        () => {
          ctx.moveTo(-Math.cos(ang) * len * 0.12, -Math.sin(ang) * len * 0.12);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
        },
        w,
        col,
        a,
        0.6,
      );
    hand(hAng, R * 0.5, D * 0.045, gold);
    hand(mAng, R * 0.74, D * 0.03, gold);
    hand(sAng, R * 0.86, D * 0.012, light);
    ctx.globalAlpha = Math.min(1, a * (0.6 + acc));
    blit(ctx, this.glint, Math.cos(sAng) * R * 0.86, Math.sin(sAng) * R * 0.86, D * 0.35);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Ereignishorizont: a huge black sphere with a thin photon ring; the edge-on accretion
// disc crosses it and its far side is lensed into a ring around the top and bottom.
// p: horizon, disc (D half width), tilt, spin, color, hot, deep. Accent: the disc flares.
// ---------------------------------------------------------------------------

export class Gargantua extends Hero {
  private disc: Tex;
  private ring: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.disc = accretionTex(this.colorStatic('hot', 'core'), this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), 0.34, inst.seed % 71);
    this.ring = glowTex(this.colorStatic('color', 'hue'), 'ring');
    this.glow = glowTex(this.colorStatic('deep', 'accent'), 'soft');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const H = this.num('horizon', 0.95) * D * k;
    const R = this.num('disc', 2.7) * D * k;
    const tilt = this.num('tilt', 0.07);
    const spin = env.clock * this.num('spin', 18) * DEG * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const hot = this.color('hot', 'core');
    const hue = this.color('color', 'hue');
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * 0.55);
    blit(ctx, this.glow, 0, 0, H * 4.4);
    // Lensed far side: a ring hugging the sphere, brighter at the top.
    ctx.globalAlpha = Math.min(1, a * (0.8 + acc * 0.4));
    blit(ctx, this.ring, 0, 0, (H * 1.32 * 2) / 0.7);
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.3, Math.PI * 1.03, Math.PI * 1.97), D * 0.07, hue, a * (0.7 + acc * 0.4), 0.5);
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.18, Math.PI * 0.15, Math.PI * 0.85), D * 0.03, hue, a * 0.45, 0);
    // Black sphere and photon ring.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, H, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => ctx.arc(0, 0, H * 1.02, 0, TAU), D * 0.01, hot, a, 0.8);
    // Edge-on disc crossing in front of the sphere, brighter on the approaching side.
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, 0);
    ctx.globalAlpha = Math.min(1, a * (0.95 + acc * 0.4));
    ctx.drawImage(this.disc, -R, -R, R * 2, R * 2);
    ctx.save();
    clipHalf(env, this.inst, this.ax - R, this.ay, Math.PI / 2, 'front');
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, 0);
    ctx.globalAlpha = Math.min(1, a * 0.45);
    ctx.drawImage(this.disc, -R, -R, R * 2, R * 2);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Quasar: a radiant core with two jets shooting up and down to the stage edges; bright
// knots travel outward. p: core (D), width (D), knots, color, hot, coreColor.
// Accent: the jets flare to double brightness and length.
// ---------------------------------------------------------------------------

export class QuasarJets extends Hero {
  private cone: Tex;
  private beam: Tex;
  private coreGlow: Tex;
  private coreHot: Tex;
  private knot: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.cone = coneTex(this.colorStatic('color', 'hue'), true);
    this.beam = pillarTex(this.colorStatic('hot', 'core'));
    this.coreGlow = glowTex(this.colorStatic('coreColor', 'accent'), 'soft');
    this.coreHot = glowTex(this.colorStatic('hot', 'core'), 'core');
    this.knot = glowTex(this.colorStatic('hot', 'core'), 'core');
  }

  protected override defaultSlot(): Slot {
    return 'beams';
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const grow = easeOut(this.introK());
    const pulse = 1 + 0.08 * this.inst.breathe(env.clock) * this.inst.motion;
    const reachUp = (this.ay - env.stage.top / this.inst.scale) * 1.02;
    const reachDown = (env.stage.bottom / this.inst.scale - this.ay) * 1.02;
    const t = env.clock * this.inst.motion;
    const W = this.num('width', 0.35) * D * pulse * (1 + acc * 0.4);
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.8 + acc * 0.5));
    blit(ctx, this.coreGlow, 0, 0, this.num('core', 0.7) * D * 3.2);
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.coreHot, 0, 0, this.num('core', 0.7) * D * 1.6);
    for (const [dir, reach] of [[-1, reachUp], [1, reachDown]] as [number, number][]) {
      const L = Math.min(reach, reach * (0.55 + 0.45 * grow) * (0.9 + acc * 0.3));
      xScreen(env, this.inst, this.ax, this.ay, (dir * Math.PI) / 2);
      ctx.globalAlpha = Math.min(1, a * (0.85 + acc * 0.6));
      ctx.drawImage(this.cone, 0, -W * 1.4, L, W * 2.8);
      ctx.globalAlpha = Math.min(1, a * (0.7 + acc * 0.5));
      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(this.beam, -W * 0.25, 0, W * 0.5, L * 0.9);
      ctx.restore();
      // Knots travelling outward.
      const knots = this.num('knots', 5);
      for (let i = 0; i < knots; i++) {
        const s = ((t * 0.18 + i / knots + (dir > 0 ? 0.1 : 0)) % 1 + 1) % 1;
        ctx.globalAlpha = Math.min(1, a * (1 - s) * (0.9 + acc));
        blit(ctx, this.knot, L * s, 0, W * (0.8 + s * 1.4));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: Math.PI / 2, boost: 0.3 + this.inst.accent.env * 0.5 };
  }
}

// ---------------------------------------------------------------------------
// Supernova: an expanding filament shell around a bright core; on every accent the star
// detonates again and a new shell starts. p: maxRadius (D), color, deep, core.
// ---------------------------------------------------------------------------

function remnantTex(c1: string, c2: string, seed: number): Tex {
  return bakeTex(`remnant|${c1}|${c2}|${seed}`, () => {
    const a = rgb01(c1);
    const b = rgb01(c2);
    const g = noiseGrid(4, 5, seed);
    const r = noiseGrid(4, 8, seed + 11);
    return paintTex(512, 512, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1 || d < 0.45) return PX_NONE;
      const ang = (Math.atan2(v, u) / TAU + 1) % 1;
      const n = sampleNoise(g, ang, d);
      const ridge = Math.pow(1 - Math.abs(sampleNoise(r, ang * 2, d * 1.5) * 2 - 1), 3);
      const shell = Math.exp(-(((d - 0.8) / 0.12) ** 2));
      const k = clamp01((d - 0.6) / 0.4);
      const dens = shell * (0.4 + 0.6 * n) + ridge * shell * 0.8;
      return pxOut(a[0] + (b[0] - a[0]) * k + ridge * 0.3, a[1] + (b[1] - a[1]) * k + ridge * 0.3, a[2] + (b[2] - a[2]) * k + ridge * 0.3, clamp01(dens) * smooth((d - 0.45) / 0.1));
    });
  });
}

export class SupernovaRemnant extends Hero {
  private shell: Tex;
  private core: Tex;
  private glint: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.shell = remnantTex(this.colorStatic('color', 'hue'), this.colorStatic('deep', 'accent'), inst.seed % 113);
    this.core = glowTex(this.colorStatic('core', 'core'), 'core');
    this.glint = glintTex(this.colorStatic('core', 'core'));
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const every = this.inst.spec.motion.accent.every ?? [7, 9];
    const period = (every[0] + every[1]) / 2;
    const since = Math.min(this.inst.accent.since, period * 2);
    const maxR = this.num('maxRadius', 2.8) * D;
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    // Two shells: the young one and the fading previous one.
    for (const [age, fade] of [[since, 1], [since + period, 0.5]] as [number, number][]) {
      const k = clamp01(age / (period * 1.6));
      const R = maxR * (0.3 + 0.7 * easeOut(k));
      const al = a * fade * Math.pow(1 - k, 0.8) * (age < 0.3 ? age / 0.3 : 1);
      if (al <= 0.01) continue;
      ctx.globalAlpha = Math.min(1, al);
      xScreen(env, this.inst, this.ax, this.ay, t * 2 * DEG + age * 0.05);
      ctx.drawImage(this.shell, -R, -R, R * 2, R * 2);
    }
    // Core: a pulsing neutron star; the detonation flash on the accent.
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.45 + acc * 0.5));
    blit(ctx, this.glow, 0, 0, D * 3 * (1 + acc));
    ctx.globalAlpha = Math.min(1, a * (0.9 + acc));
    blit(ctx, this.core, 0, 0, D * 1.4 * (1 + acc * 1.5));
    const tw = 0.7 + 0.3 * Math.sin(env.clock * 2.4);
    ctx.globalAlpha = Math.min(1, a * tw);
    blit(ctx, this.glint, D * 0.45, -D * 0.4, D * 0.6);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.25 + this.inst.accent.env * 0.7 };
  }
}

// ---------------------------------------------------------------------------
// Andromeda: a big tilted spiral galaxy behind the planet with bulge, dust lanes and stars
// following the arms. p: radius, tilt, roll, spin, arms, twist, color, arm2, bulge.
// Accent: a starburst in one arm.
// ---------------------------------------------------------------------------

export class Galaxy extends Hero {
  private arms: Tex;
  private arms2: Tex;
  private dust: Tex;
  private bulge: Tex;
  private star: Tex;
  private glint: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const arms = this.num('arms', 2);
    const twist = this.num('twist', 2.2);
    this.arms = spiralTex(this.colorStatic('arm2', 'core'), this.colorStatic('color', 'hue'), arms, twist, 0, (inst.seed % 300) + 1);
    this.arms2 = spiralTex(this.colorStatic('color', 'hue'), this.colorStatic('color', 'hue'), arms, twist, 0, (inst.seed % 300) + 17);
    this.dust = spiralTex('#05030a', '#05030a', arms, twist, 0, (inst.seed % 300) + 33);
    this.bulge = glowTex(this.colorStatic('bulge', 'accent'), 'core');
    this.star = spriteTex('mote', this.colorStatic('arm2', 'core'));
    this.glint = glintTex(this.colorStatic('arm2', 'core'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 2.4) * D * k;
    const tilt = this.num('tilt', 0.42);
    const roll = this.num('roll', -28) * DEG;
    const spin = env.clock * this.num('spin', 4) * DEG * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * 0.95);
    xPlane(env, this.inst, this.ax, this.ay, spin, tilt, roll);
    ctx.drawImage(this.arms, -R, -R, R * 2, R * 2);
    ctx.globalAlpha = Math.min(1, a * 0.45);
    xPlane(env, this.inst, this.ax, this.ay, spin + 0.5, tilt, roll, 0.82);
    ctx.drawImage(this.arms2, -R, -R, R * 2, R * 2);
    // Dust lanes slightly behind the arms.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a * 0.55);
    xPlane(env, this.inst, this.ax, this.ay, spin - 0.22, tilt, roll, 0.95);
    ctx.drawImage(this.dust, -R, -R, R * 2, R * 2);
    ctx.globalCompositeOperation = 'lighter';
    // Bulge.
    xScreen(env, this.inst, this.ax, this.ay, roll, 1, tilt * 1.5);
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.bulge, 0, 0, D * 1.9);
    // Stars along the arms.
    const arms = this.num('arms', 2);
    const twist = this.num('twist', 2.2);
    const n = Math.round(this.num('stars', 60) * (0.5 + 0.5 * env.q));
    xform(env, this.inst, 0, 0);
    for (let i = 0; i < n; i++) {
      const d = 0.2 + 0.78 * hash(i * 13 + 1);
      // Same log spiral as the arm texture: phase = angle / TAU * arms + log(d) * twist.
      const arm = i % arms;
      const ang = ((arm - Math.log(d + 0.05) * twist) * TAU) / arms + spin + (hash(i * 7) - 0.5) * 0.35;
      projectOrbit(R * d, ang, tilt, roll, tmp);
      const tw = 0.6 + 0.4 * Math.sin(env.clock * 0.9 + i);
      ctx.globalAlpha = Math.min(1, a * tw * 0.9);
      blit(ctx, this.star, this.ax + tmp.x, this.ay + tmp.y, D * (0.04 + 0.04 * hash(i * 3)));
    }
    if (acc > 0.02) {
      projectOrbit(R * 0.62, spin + 2.1, tilt, roll, tmp);
      ctx.globalAlpha = Math.min(1, a * acc);
      blit(ctx, this.glint, this.ax + tmp.x, this.ay + tmp.y, D * 1.6 * acc);
      blit(ctx, this.bulge, this.ax + tmp.x, this.ay + tmp.y, D * 0.9 * acc);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Magnetar: glowing dipole field lines loop from pole to pole around the planet and turn
// slowly; the parts behind the planet are hidden. p: lines, size (D), spin (deg/s), axis
// (deg tilt), color, hot, flash. Accent: starquake - the lines flare.
// ---------------------------------------------------------------------------

export class FieldLines extends Hero {
  private n = 36;
  private xs: Float32Array[] = [];
  private ys: Float32Array[] = [];
  private zs: Float32Array[] = [];
  private hide: Uint8Array[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    for (let i = 0; i < this.num('lines', 12); i++) {
      this.xs.push(new Float32Array(this.n + 1));
      this.ys.push(new Float32Array(this.n + 1));
      this.zs.push(new Float32Array(this.n + 1));
      this.hide.push(new Uint8Array(this.n + 1));
    }
  }

  override update(env: FrameEnv): void {
    const lines = this.xs.length;
    const size = this.num('size', 1.9) * D * this.introScale();
    const spin = env.clock * this.num('spin', 10) * DEG * this.inst.motion;
    const axis = this.num('axis', 12) * DEG;
    const ca = Math.cos(axis);
    const sa = Math.sin(axis);
    const pr = D * 0.5;
    for (let l = 0; l < lines; l++) {
      const phi = (l / lines) * TAU + spin;
      const L = size * (0.55 + 0.45 * hash(l * 19 + 3));
      for (let i = 0; i <= this.n; i++) {
        const th = 0.25 + (i / this.n) * (Math.PI - 0.5);
        const r = L * Math.sin(th) ** 2;
        const xr = r * Math.sin(th);
        const y3 = -r * Math.cos(th);
        const x3 = xr * Math.cos(phi);
        const z3 = xr * Math.sin(phi);
        const x = x3 * ca - y3 * sa;
        const y = x3 * sa + y3 * ca;
        this.xs[l][i] = this.ax + x;
        this.ys[l][i] = this.ay + y;
        this.zs[l][i] = z3;
        // Points inside the planet are not drawn.
        this.hide[l][i] = r < pr ? 1 : 0;
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
    const col = mix(this.color('color', 'hue'), this.color('flash', 'accent'), acc * 0.8);
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let l = 0; l < this.xs.length; l++) {
      const xs = this.xs[l];
      const ys = this.ys[l];
      const zs = this.zs[l];
      const hide = this.hide[l];
      glowStroke(
        ctx,
        () => {
          let open = false;
          for (let i = 0; i <= this.n; i++) {
            const on = !hide[i] && (zs[i] >= 0) === front;
            if (on) {
              if (!open) ctx.moveTo(xs[i], ys[i]);
              else ctx.lineTo(xs[i], ys[i]);
              open = true;
            } else open = false;
          }
        },
        D * 0.016 * (1 + acc * 0.6),
        col,
        a * (front ? 0.85 : 0.55) * (1 + acc * 0.5),
        0.45,
      );
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.2 + this.inst.accent.env * 0.6 };
  }
}

export const HEROES_V5 = {
  blackHole: BlackHole,
  tidalStream: TidalStream,
  bloodMoon: BloodMoon,
  seraphWings: SeraphWings,
  timeRift: TimeRift,
  lemniscate: Lemniscate,
  clockPortal: ClockPortal,
  gargantua: Gargantua,
  quasarJets: QuasarJets,
  supernovaRemnant: SupernovaRemnant,
  galaxy: Galaxy,
  fieldLines: FieldLines,
};

