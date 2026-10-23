// Heroes of the V6 auras (Universell and above). They reach past the stage edges and each
// builds up in its own way during the intro.

import type { HeroLayer as HeroSpec, Slot } from '../../../config/vfx/types';
import { mix, rgba, spectral } from '../../color';
import { blit, clipHalf, D, type AuraInstance, type FrameEnv, projectOrbit, type Shadow, xform, xPlane, xScreen } from '../core';
import { clamp01, DEG, easeIn, easeInOut, easeOut, hash, noise1, Rng, smooth, TAU } from '../math';
import { bakeTex, bandTex, BAND_PAD, glintTex, glowTex, nebulaTex, noiseGrid, paintTex, PX_NONE, pxOut, raysTex, rgb01, sampleNoise, spiralTex, spriteTex, streakTex, type Tex } from '../tex';
import { glowStroke, Hero } from './base';

const tmp = { x: 0, y: 0, z: 0 };

/** Small cluster of stars inside a disc (interior of a bubble universe). */
function clusterTex(color: string, seed: number): Tex {
  return bakeTex(`cluster|${color}|${seed}`, () => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, rgba(color, 0.35));
    g.addColorStop(1, rgba(color, 0.05));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const rng = new Rng(seed);
    for (let i = 0; i < 140; i++) {
      const r = Math.pow(rng.next(), 1.6) * 120;
      const a = rng.next() * TAU;
      const x = 128 + Math.cos(a) * r;
      const y = 128 + Math.sin(a) * r;
      const s = 0.8 + Math.pow(rng.next(), 4) * 4;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, s * 3);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)');
      gr.addColorStop(0.35, rgba(color, 0.6));
      gr.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
    }
    return c;
  });
}

// ---------------------------------------------------------------------------
// Multiversum: three bubble universes with different insides circle the planet, linked
// by bridges of light. p: radius, size (D), tilt, roll, speed (deg/s), colors [3].
// Accent: they swap places along the orbit.
// ---------------------------------------------------------------------------

export class BubbleUniverses extends Hero {
  private inside: Tex[];
  private halo: Tex[];
  private cols: string[];
  private pos = [0, 1, 2].map(() => ({ x: 0, y: 0, z: 0, r: 0 }));

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const raw = this.spec.p?.colors;
    const list = Array.isArray(raw) ? (raw as string[]) : ['p0', 'p1', 'p2'];
    this.cols = list.map((c) => inst.colStatic(c));
    const s = inst.seed % 200;
    this.inside = [spiralTex('#ffffff', this.cols[0], 2, 2, 0, s + 1), nebulaTex([this.cols[1], '#ffffff'], s + 5), clusterTex(this.cols[2], s + 9)];
    this.halo = this.cols.map((c) => glowTex(c, 'soft'));
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const acc = this.inst.accent;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const swaps = (acc.index > 0 ? acc.index : 0) - 1 + (acc.since < dur ? easeInOut(acc.since / dur) : 1);
    const base = env.clock * this.num('speed', 9) * DEG * this.inst.motion + swaps * (TAU / 3);
    for (let i = 0; i < 3; i++) {
      projectOrbit(this.num('radius', 1.95) * D * k, base + (i * TAU) / 3, this.num('tilt', 0.32), this.num('roll', -8) * DEG, tmp);
      const p = this.pos[i];
      p.x = this.ax + tmp.x;
      p.y = this.ay + tmp.y;
      p.z = tmp.z;
      p.r = this.num('size', 0.72) * D * k * (1 + 0.16 * tmp.z) * (1 - i * 0.08);
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const t = env.clock * this.inst.motion;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      // Bridges of light between the universes.
      for (let i = 0; i < 3; i++) {
        const p = this.pos[i];
        const q = this.pos[(i + 1) % 3];
        glowStroke(
          ctx,
          () => {
            ctx.moveTo(p.x, p.y);
            ctx.quadraticCurveTo((p.x + q.x) / 2, (p.y + q.y) / 2 - D * 0.4, q.x, q.y);
          },
          D * 0.016,
          mix(this.cols[i], this.cols[(i + 1) % 3], 0.5),
          a * (0.25 + acc * 0.7),
          0.3,
        );
      }
    }
    for (let i = 0; i < 3; i++) {
      const p = this.pos[i];
      if ((p.z >= 0) !== front) continue;
      const depthA = 0.75 + 0.25 * (p.z + 1) * 0.5;
      xform(env, this.inst, p.x, p.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a * 0.55 * depthA);
      blit(ctx, this.halo[i], 0, 0, p.r * 3.4);
      // Inside: its own little universe, turning slowly.
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, TAU);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgba('#05040c', (front ? 0.5 : 0.85) * a);
      ctx.fill();
      ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a * depthA);
      ctx.rotate(t * (0.15 + i * 0.07) * (i % 2 ? -1 : 1));
      ctx.drawImage(this.inside[i], -p.r * 1.15, -p.r * 1.15, p.r * 2.3, p.r * 2.3);
      ctx.restore();
      // Glass rim and highlight.
      xform(env, this.inst, p.x, p.y);
      ctx.globalCompositeOperation = 'lighter';
      glowStroke(ctx, () => ctx.arc(0, 0, p.r, 0, TAU), D * 0.016, this.cols[i], a * depthA * (0.9 + acc * 0.4), 0.5);
      ctx.strokeStyle = rgba('#ffffff', 0.5 * a * depthA);
      ctx.lineWidth = D * 0.018;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.84, Math.PI * 1.1, Math.PI * 1.38);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override shadows(out: Shadow[]): void {
    for (const p of this.pos) if (p.z > 0.2 && Math.hypot(p.x - this.ax, p.y - this.ay) < D * 0.5 + p.r) out.push({ x: p.x - this.ax, y: p.y - this.ay, r: p.r * 0.9, a: 0.35 * this.alpha() });
  }
}

// ---------------------------------------------------------------------------
// Kosmisches Netz: a 3D web of galaxy clusters joined by filaments turns slowly; pulses
// of light travel along the filaments. p: nodes, radius (D), links, spin (deg/s), color,
// accent, core. Accent: a pulse wave spreads through the web.
// ---------------------------------------------------------------------------

export class CosmicWeb extends Hero {
  private nodes: { x: number; y: number; z: number; s: number }[] = [];
  private proj: { x: number; y: number; z: number }[] = [];
  private edges: [number, number][] = [];
  private node: Tex;
  private pulse: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const rng = new Rng(inst.seed + 501);
    const n = this.num('nodes', 30);
    const R = this.num('radius', 3) * D;
    for (let i = 0; i < n; i++) {
      // Rejection sample in a flattened sphere, keep the very centre (the planet) free.
      let x = 0;
      let y = 0;
      let z = 0;
      for (let k = 0; k < 20; k++) {
        x = rng.range(-1, 1);
        y = rng.range(-1, 1);
        z = rng.range(-1, 1);
        const d = x * x + y * y + z * z;
        if (d <= 1 && d > 0.12) break;
      }
      this.nodes.push({ x: x * R, y: y * R * 0.75, z: z * R, s: 0.6 + rng.next() * 0.9 });
      this.proj.push({ x: 0, y: 0, z: 0 });
    }
    const links = this.num('links', 2);
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) {
      const order = this.nodes
        .map((q, j) => ({ j, d: (q.x - this.nodes[i].x) ** 2 + (q.y - this.nodes[i].y) ** 2 + (q.z - this.nodes[i].z) ** 2 }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d);
      for (let k = 0; k < links; k++) {
        const j = order[k].j;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.edges.push([i, j]);
      }
    }
    this.node = glowTex(this.colorStatic('color', 'hue'), 'core');
    this.pulse = spriteTex('mote', this.colorStatic('core', 'core'));
  }

  override update(env: FrameEnv): void {
    const ang = env.clock * this.num('spin', 4) * DEG * this.inst.motion;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const k = easeOut(this.introK());
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      const p = this.proj[i];
      p.x = this.ax + (n.x * c - n.z * s) * (0.3 + 0.7 * k);
      p.z = (n.x * s + n.z * c) / (this.num('radius', 3) * D);
      p.y = this.ay + n.y * (0.3 + 0.7 * k) + p.z * D * 0.25;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const waveR = clamp01(this.inst.accent.since / dur) * this.num('radius', 3) * D * 1.2;
    const hue = this.color('color', 'hue');
    const accent = this.color('accent', 'accent');
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(
      ctx,
      () => {
        for (const [i, j] of this.edges) {
          const p = this.proj[i];
          const q = this.proj[j];
          if ((p.z + q.z >= 0) !== front) continue;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        }
      },
      D * 0.012,
      mix(hue, accent, 0.35),
      a * (front ? 0.55 : 0.32),
      0.25,
    );
    // Pulses along the filaments.
    const t = env.clock * this.inst.motion;
    for (let e = 0; e < this.edges.length; e++) {
      const [i, j] = this.edges[e];
      const p = this.proj[i];
      const q = this.proj[j];
      if ((p.z + q.z >= 0) !== front) continue;
      const s = ((t * 0.25 + hash(e * 11)) % 1 + 1) % 1;
      ctx.globalAlpha = Math.min(1, a * Math.sin(s * Math.PI) * 0.8);
      blit(ctx, this.pulse, p.x + (q.x - p.x) * s, p.y + (q.y - p.y) * s, D * 0.07);
    }
    // Clusters.
    for (let i = 0; i < this.nodes.length; i++) {
      const p = this.proj[i];
      if ((p.z >= 0) !== front) continue;
      const d = Math.hypot(this.nodes[i].x, this.nodes[i].y, this.nodes[i].z);
      const wave = acc > 0 ? Math.exp(-(((d - waveR) / (D * 0.5)) ** 2)) * acc : 0;
      ctx.globalAlpha = Math.min(1, a * (0.55 + 0.25 * p.z + wave));
      blit(ctx, this.node, p.x, p.y, D * 0.32 * this.nodes[i].s * (1 + 0.25 * p.z) * (1 + wave));
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Urknall: a white-hot core collapses before every accent and bursts on it: flash,
// fireball shell, fragments flung out in jerky steps, then a long afterglow.
// p: core (D), fireball (D), shards, color, deep, dark.
// ---------------------------------------------------------------------------

export class BigBang extends Hero {
  private core: Tex;
  private glow: Tex;
  private ring: Tex;
  private streak: Tex;
  private shard: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.core = glowTex(mix(this.colorStatic('color', 'hue'), '#ffffff', 0.6), 'core');
    this.glow = glowTex(this.colorStatic('deep', 'accent'), 'soft');
    this.ring = glowTex(this.colorStatic('color', 'hue'), 'ring');
    this.streak = streakTex(this.colorStatic('color', 'hue'));
    this.shard = spriteTex('chunk', this.colorStatic('deep', 'accent'));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const since = this.inst.accent.since;
    const tt = this.inst.timeToNextAccent(env.clock);
    const reduced = this.inst.reduced;
    const C = this.num('core', 0.55) * D * k;
    // Collapse: the core shrinks and brightens during the last 2.4 s.
    const collapse = tt < 2.4 ? easeIn(1 - tt / 2.4) : 0;
    const after = since < 6 ? Math.max(0, 1 - since / 6) : 0;
    const S = env.view.s * this.inst.scale;
    ctx.globalCompositeOperation = 'lighter';
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalAlpha = Math.min(1, a * (0.45 + after * 0.5));
    blit(ctx, this.glow, 0, 0, C * 6 * (1 + after * 0.6));
    ctx.globalAlpha = Math.min(1, a * (0.8 + collapse * 0.6));
    blit(ctx, this.core, 0, 0, C * 2.4 * (1 - collapse * 0.55) * (1 + 0.05 * this.inst.breathe(env.clock)));
    if (collapse > 0 && !reduced) {
      // Matter rushing in.
      for (let i = 0; i < 18; i++) {
        const ang = hash(i * 7 + 3) * TAU;
        const r = D * (2.6 - 2.2 * ((collapse * 1.4 + hash(i * 13)) % 1));
        const x = this.ax + Math.cos(ang) * r;
        const y = this.ay + Math.sin(ang) * r;
        const c = Math.cos(ang + Math.PI);
        const s = Math.sin(ang + Math.PI);
        ctx.globalAlpha = Math.min(1, a * collapse * 0.8);
        ctx.setTransform(S * c, S * s, -S * s, S * c, env.view.tx + S * x, env.view.ty + S * y);
        ctx.drawImage(this.streak, -D * 0.5, -D * 0.04, D * 0.5, D * 0.08);
      }
    }
    if (since < 3.2) {
      // Fireball shell.
      const f = since / 3.2;
      const R = this.num('fireball', 3.2) * D * easeOut(f);
      xform(env, this.inst, this.ax, this.ay);
      ctx.globalAlpha = Math.min(1, a * Math.pow(1 - f, 1.3));
      blit(ctx, this.ring, 0, 0, (R * 2) / 0.7);
      blit(ctx, this.glow, 0, 0, R * 1.8);
      // Fragments flung outward in three jerky steps.
      const n = this.num('shards', 14);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + hash(i * 5) * 0.4;
        const steps = Math.min(3, Math.floor(f * 6));
        const local = clamp01(f * 6 - steps);
        const dist = (steps + easeOut(Math.min(1, local * 2.5))) / 3;
        const r = D * (0.6 + 2.6 * Math.min(1, dist) * (0.7 + 0.3 * hash(i)));
        const x = this.ax + Math.cos(ang) * r;
        const y = this.ay + Math.sin(ang) * r;
        const size = D * (0.08 + 0.06 * hash(i * 3));
        ctx.globalAlpha = Math.min(1, a * Math.pow(1 - f, 0.8));
        ctx.setTransform(S, 0, 0, S, env.view.tx + S * x, env.view.ty + S * y);
        ctx.rotate(f * 6 + i);
        ctx.drawImage(this.shard, -size, -size, size * 2, size * 2);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    const since = this.inst.accent.since;
    return { angle: -Math.PI / 2, boost: 0.25 + (since < 2 ? (1 - since / 2) * 0.8 : 0) };
  }
}

// ---------------------------------------------------------------------------
// Ursuppe: a bioluminescent cell membrane wraps the planet, organelles drift inside and a
// DNA helix turns behind it. p: radius, wobble (D), organelles, helix (D height), color,
// glow, accent. Accent: the spark of life - the organelles bloom.
// ---------------------------------------------------------------------------

export class PrimordialCell extends Hero {
  private n = 90;
  private xs = new Float32Array(this.n);
  private ys = new Float32Array(this.n);
  private cell: Tex[];
  private orgs: { ang: number; r: number; sp: number; size: number; ci: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.cell = [spriteTex('cell', this.colorStatic('color', 'hue')), spriteTex('cell', this.colorStatic('accent', 'accent')), spriteTex('cell', this.colorStatic('glow', 'core'))];
    const rng = new Rng(inst.seed + 77);
    for (let i = 0; i < this.num('organelles', 9); i++) this.orgs.push({ ang: rng.next() * TAU, r: rng.range(0.7, 1.35), sp: rng.range(4, 9) * rng.sign(), size: rng.range(0.12, 0.24), ci: i % 3 });
  }

  override update(env: FrameEnv): void {
    const R = this.num('radius', 1.55) * D * this.introScale();
    const w = this.num('wobble', 0.06) * D;
    const t = env.clock * this.inst.motion;
    for (let i = 0; i < this.n; i++) {
      const th = (i / this.n) * TAU;
      const r = R + w * noise1(th * 2.5 + t * 0.35, 5) + w * 0.6 * Math.sin(th * 3 - t * 0.5);
      this.xs[i] = this.ax + Math.cos(th) * r;
      this.ys[i] = this.ay + Math.sin(th) * r;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const t = env.clock * this.inst.motion;
    const hue = this.color('color', 'hue');
    const glow = this.color('glow', 'core');
    const accent = this.color('accent', 'accent');
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      // DNA helix behind the cell.
      const H = this.num('helix', 3.2) * D * easeOut(this.introK());
      const amp = D * 0.28;
      for (const strand of [0, 1]) {
        glowStroke(
          ctx,
          () => {
            for (let i = 0; i <= 60; i++) {
              const f = i / 60;
              const y = this.ay - H / 2 + H * f;
              const x = this.ax + Math.sin(f * 4 * TAU + t * 0.8 + strand * Math.PI) * amp;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          },
          D * 0.02,
          strand ? accent : hue,
          a * 0.7,
          0.4,
        );
      }
      ctx.strokeStyle = rgba(glow, 0.3 * a);
      ctx.lineWidth = D * 0.012;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        const y = this.ay - H / 2 + H * f;
        const x0 = this.ax + Math.sin(f * 4 * TAU + t * 0.8) * amp;
        const x1 = this.ax + Math.sin(f * 4 * TAU + t * 0.8 + Math.PI) * amp;
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
      }
      ctx.stroke();
      // Membrane: soft fill and glowing wall.
      const R = this.num('radius', 1.55) * D;
      const g = ctx.createRadialGradient(this.ax, this.ay, R * 0.4, this.ax, this.ay, R * 1.05);
      g.addColorStop(0, rgba(hue, 0));
      g.addColorStop(0.75, rgba(hue, 0.1 * a));
      g.addColorStop(1, rgba(glow, 0.22 * a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(this.xs[0], this.ys[0]);
      for (let i = 1; i < this.n; i++) ctx.lineTo(this.xs[i], this.ys[i]);
      ctx.closePath();
      ctx.fill();
      glowStroke(
        ctx,
        () => {
          ctx.moveTo(this.xs[0], this.ys[0]);
          for (let i = 1; i < this.n; i++) ctx.lineTo(this.xs[i], this.ys[i]);
          ctx.closePath();
        },
        D * 0.03,
        glow,
        a * (0.75 + acc * 0.5),
        0.4,
      );
    }
    // Organelles drifting inside.
    for (let i = 0; i < this.orgs.length; i++) {
      const o = this.orgs[i];
      const ang = o.ang + t * o.sp * DEG;
      const z = Math.sin(ang * 1.3 + i);
      if ((z >= 0) !== front) continue;
      const x = this.ax + Math.cos(ang) * o.r * D;
      const y = this.ay + Math.sin(ang) * o.r * D * 0.8;
      const bloom = 1 + acc * 0.6 * (0.5 + 0.5 * Math.sin(i * 2));
      const size = o.size * D * bloom * (1 + 0.1 * Math.sin(t * 0.6 + i));
      ctx.globalAlpha = Math.min(1, a * (0.7 + 0.3 * z));
      blit(ctx, this.cell[o.ci], x, y, size * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Entropie: a crystalline lattice around the planet falls apart into drifting, fading
// pieces on every accent, hangs dissolved for a moment and reassembles within 2.4 s.
// p: radius (D), rings, spokes, color.
// ---------------------------------------------------------------------------

export class DecayLattice extends Hero {
  private segs: { x0: number; y0: number; x1: number; y1: number; dx: number; dy: number; rot: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const rng = new Rng(inst.seed + 13);
    const R = this.num('radius', 1.7);
    const rings = this.num('rings', 3);
    const spokes = this.num('spokes', 12);
    const add = (x0: number, y0: number, x1: number, y1: number) => {
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const l = Math.hypot(mx, my) || 1;
      this.segs.push({ x0, y0, x1, y1, dx: (mx / l) * rng.range(0.4, 1.1) + rng.range(-0.3, 0.3), dy: (my / l) * rng.range(0.2, 0.8) + rng.range(0.2, 0.9), rot: rng.range(-2, 2) });
    };
    for (let r = 0; r < rings; r++) {
      const rr = R * (0.55 + (0.45 * (r + 1)) / rings);
      const n = spokes;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * TAU + r * 0.13;
        const a1 = ((i + 1) / n) * TAU + r * 0.13;
        add(Math.cos(a0) * rr, Math.sin(a0) * rr, Math.cos(a1) * rr, Math.sin(a1) * rr);
      }
    }
    for (let i = 0; i < spokes; i++) {
      const ang = (i / spokes) * TAU;
      add(Math.cos(ang) * R * 0.55, Math.sin(ang) * R * 0.55, Math.cos(ang) * R, Math.sin(ang) * R);
      if (i % 2 === 0) {
        const b = ang + TAU / spokes;
        add(Math.cos(ang) * R, Math.sin(ang) * R, Math.cos(b) * R * 0.78, Math.sin(b) * R * 0.78);
      }
    }
  }

  /** 0 = intact, 1 = fully dissolved: falls apart on the accent, holds, reassembles. */
  private decay(): number {
    const since = this.inst.accent.since;
    if (since < 2.2) return easeIn(since / 2.2);
    if (since < 2.8) return 1;
    return Math.max(0, 1 - easeInOut((since - 2.8) / 2.4));
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const c = this.inst.reduced ? this.decay() * 0.4 : this.decay();
    const k = this.introScale();
    const hue = this.color('color', 'hue');
    const spin = env.clock * 2 * DEG * this.inst.motion;
    xScreen(env, this.inst, this.ax, this.ay, spin, k);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 3; pass++) {
      const w = [D * 0.06, D * 0.025, D * 0.009][pass];
      const al = [0.08, 0.25, 0.85][pass];
      ctx.lineWidth = w;
      ctx.strokeStyle = rgba(pass === 2 ? mix(hue, '#ffffff', 0.5) : hue, Math.min(1, al * a * (1 - c * 0.8)));
      ctx.beginPath();
      for (const s of this.segs) {
        const ox = s.dx * D * 1.1 * c;
        const oy = s.dy * D * 0.9 * c + c * c * D * 0.6;
        const mx = (s.x0 + s.x1) / 2;
        const my = (s.y0 + s.y1) / 2;
        const r = s.rot * c;
        const cr = Math.cos(r);
        const sr = Math.sin(r);
        const hx = ((s.x1 - s.x0) / 2) * (1 - c * 0.5);
        const hy = ((s.y1 - s.y0) / 2) * (1 - c * 0.5);
        const ex = hx * cr - hy * sr;
        const ey = hx * sr + hy * cr;
        ctx.moveTo((mx - ex) * D + ox, (my - ey) * D + oy);
        ctx.lineTo((mx + ex) * D + ox, (my + ey) * D + oy);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Wärmetod: the last dying ember of a star hangs in an empty sky; its cracks glow and
// cool very slowly. p: radius (D), color (ember), body, cold. Accent: a last flicker that
// flares up and then sighs out.
// ---------------------------------------------------------------------------

function emberSphereTex(ember: string, body: string, seed: number): Tex {
  return bakeTex(`embersphere|${ember}|${body}|${seed}`, () => {
    const ce = rgb01(ember);
    const cb = rgb01(body);
    const g = noiseGrid(4, 5, seed);
    const g2 = noiseGrid(3, 10, seed + 3);
    return paintTex(256, 256, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d >= 1) return PX_NONE;
      const mu = Math.sqrt(1 - d * d);
      const n = sampleNoise(g, (u + 1) / 2, (v + 1) / 2);
      const ridge = Math.pow(1 - Math.abs(n * 2 - 1), 10) + 0.5 * Math.pow(1 - Math.abs(sampleNoise(g2, (u + 1) / 2, (v + 1) / 2) * 2 - 1), 14);
      const crack = clamp01(ridge * 1.4) * mu;
      const shade = 0.35 + 0.65 * Math.pow(mu, 0.8);
      return pxOut(cb[0] * shade + ce[0] * crack, cb[1] * shade + ce[1] * crack * 0.85, cb[2] * shade + ce[2] * crack * 0.7, smooth((1 - d) / 0.015));
    });
  });
}

export class DyingEmber extends Hero {
  private sphere: Tex;
  private cracks: Tex;
  private glow: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const ember = this.colorStatic('color', 'hue');
    this.sphere = emberSphereTex(ember, this.colorStatic('body', '#2b2f3a'), inst.seed % 61);
    this.cracks = emberSphereTex(ember, '#000000', inst.seed % 61);
    this.glow = glowTex(ember, 'soft');
  }

  private flicker(): number {
    const since = this.inst.accent.since;
    if (this.inst.reduced || since > 6) return 0;
    return since < 0.4 ? since / 0.4 : Math.exp(-(since - 0.4) / 1.6);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.1) * D * k;
    const breath = 0.55 + 0.15 * Math.sin(env.clock * 0.1 * TAU);
    const heat = breath + this.flicker() * 1.1;
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * 0.35 * heat);
    blit(ctx, this.glow, 0, 0, R * 4);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    xScreen(env, this.inst, this.ax, this.ay, env.clock * 0.6 * DEG * this.inst.motion);
    blit(ctx, this.sphere, 0, 0, R * 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a * Math.max(0, heat - 0.45));
    blit(ctx, this.cracks, 0, 0, R * 2);
    xform(env, this.inst, this.ax, this.ay);
    glowStroke(ctx, () => ctx.arc(0, 0, R * 0.99, Math.PI * 0.75, Math.PI * 1.55), D * 0.015, this.color('color', 'hue'), a * 0.4 * heat, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: Math.atan2(this.ay, this.ax), boost: this.flicker() * 0.6 - 0.1 };
  }
}

// ---------------------------------------------------------------------------
// Paradoxon: two interlocked rings in mirrored colours (left orange, right cyan) that pass
// through each other impossibly; motes drift forward on one side and backward on the
// other. p: radius (D), width (D), tilt, roll, spin, left, right.
// Accent: the halves swap their colours.
// ---------------------------------------------------------------------------

export class MirrorRings extends Hero {
  private bands: [Tex, Tex];
  private mote: [Tex, Tex];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const l = this.colorStatic('left', 'p0');
    const r = this.colorStatic('right', 'p1');
    const ratio = this.num('width', 0.09) / this.num('radius', 1.5);
    this.bands = [bandTex(l, mix(l, '#ffffff', 0.3), ratio, 0.5, inst.seed % 31), bandTex(r, mix(r, '#ffffff', 0.3), ratio, 0.5, inst.seed % 37)];
    this.mote = [spriteTex('mote', l), spriteTex('mote', r)];
  }

  /** 0 = left orange/right cyan, 1 = swapped. */
  private swap(): number {
    const acc = this.inst.accent;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const idx = acc.index > 0 ? acc.index : 0;
    const base = idx % 2;
    const p = acc.since < dur ? easeInOut(acc.since / dur) : 1;
    return base ? 1 - p : p;
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const half = slot === 'heroBack' ? 'back' : 'front';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const R = this.num('radius', 1.5) * D * k;
    const H = R + BAND_PAD * this.num('width', 0.09) * D * k;
    const tilt = this.num('tilt', 0.32);
    const spin = env.clock * this.num('spin', 16) * DEG * this.inst.motion;
    const sw = this.inst.reduced ? 0 : this.swap();
    const S = env.view.s * this.inst.scale;
    const L = 1e4;
    // Two rings in mirrored planes. Their halves swap depth order: impossible weave.
    for (let ring = 0; ring < 2; ring++) {
      const roll = (ring ? 1 : -1) * this.num('roll', 28) * DEG;
      const myHalf = ring === 0 ? half : half === 'back' ? 'front' : 'back';
      for (let side = 0; side < 2; side++) {
        // side 0 = left of the mirror, side 1 = right.
        const tex = this.bands[(side + (sw > 0.5 ? 1 : 0)) % 2];
        ctx.save();
        clipHalf(env, this.inst, this.ax, this.ay, roll, myHalf);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        const mx = env.view.tx + S * this.ax;
        if (side === 0) ctx.rect(mx - L, -L, L, 2 * L);
        else ctx.rect(mx, -L, L, 2 * L);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, a * (myHalf === 'front' ? 1 : 0.8) * (1 - 0.6 * Math.sin(sw * Math.PI)));
        xPlane(env, this.inst, this.ax, this.ay, spin * (ring ? -1 : 1), tilt, roll);
        ctx.drawImage(tex, -H, -H, H * 2, H * 2);
        ctx.restore();
      }
    }
    // Motes: forward on the left, backward on the right (time runs both ways).
    const t = env.clock * this.inst.motion;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const side = i % 2;
      const zFront = hash(i * 3) > 0.5;
      if (zFront !== (half === 'front')) continue;
      const ph = hash(i * 17);
      const tri = Math.abs((((t * 0.12 + ph) % 2) + 2) % 2 - 1);
      const y = this.ay + (side === 0 ? 1 - 2 * tri : 2 * tri - 1) * D * 1.6;
      const x = this.ax + (side === 0 ? -1 : 1) * D * (0.4 + 1.3 * hash(i * 5));
      ctx.globalAlpha = Math.min(1, a * 0.75);
      blit(ctx, this.mote[(side + (sw > 0.5 ? 1 : 0)) % 2], x, y, D * 0.07);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Möbius: a large Möbius band turns around the planet; its single surface shows pink on
// one face and cyan on the other, a light runs along it. p: radius (D), width (D), tilt,
// roll, spin (deg/s), color, color2. Accent: the band flips half a turn.
// ---------------------------------------------------------------------------

export class MobiusBand extends Hero {
  private n = 120;
  private px = new Float32Array((this.n + 1) * 2);
  private py = new Float32Array((this.n + 1) * 2);
  private pz = new Float32Array(this.n + 1);
  private face = new Float32Array(this.n + 1);
  private order: number[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    for (let i = 0; i < this.n; i++) this.order.push(i);
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const R = this.num('radius', 1.5) * D * k;
    const w = this.num('width', 0.42) * D * k;
    const tilt = this.num('tilt', 0.42);
    const ct = Math.sqrt(1 - tilt * tilt);
    const roll = this.num('roll', -12) * DEG;
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const acc = this.inst.accent;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const flips = (acc.index > 0 ? acc.index : 0) + (acc.since < dur ? easeInOut(acc.since / dur) : 1);
    const rho = env.clock * this.num('spin', 14) * DEG * this.inst.motion + (this.inst.reduced ? 0 : flips * Math.PI);
    const point = (u: number, v: number, out: { x: number; y: number; z: number }) => {
      const X = (R + v * Math.cos(u / 2 + rho)) * Math.cos(u);
      const Y = (R + v * Math.cos(u / 2 + rho)) * Math.sin(u);
      const Z = v * Math.sin(u / 2 + rho);
      const x = X;
      const y = Y * tilt - Z * ct;
      out.x = this.ax + x * cr - y * sr;
      out.y = this.ay + x * sr + y * cr;
      out.z = Y * ct + Z * tilt;
    };
    const p0 = { x: 0, y: 0, z: 0 };
    const p1 = { x: 0, y: 0, z: 0 };
    for (let i = 0; i <= this.n; i++) {
      const u = (i / this.n) * TAU;
      point(u, -w, p0);
      point(u, w, p1);
      this.px[i * 2] = p0.x;
      this.py[i * 2] = p0.y;
      this.px[i * 2 + 1] = p1.x;
      this.py[i * 2 + 1] = p1.y;
      this.pz[i] = (p0.z + p1.z) / 2 / R;
    }
    for (let i = 0; i < this.n; i++) {
      // Screen-space orientation of the quad decides which face we see.
      const ax = this.px[i * 2 + 1] - this.px[i * 2];
      const ay = this.py[i * 2 + 1] - this.py[i * 2];
      const bx = this.px[(i + 1) * 2] - this.px[i * 2];
      const by = this.py[(i + 1) * 2] - this.py[i * 2];
      this.face[i] = ax * by - ay * bx;
    }
    this.order.sort((p, q) => this.pz[p] - this.pz[q]);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const c1 = this.color('color', 'hue');
    const c2 = this.color('color2', 'accent');
    const t = env.clock * this.inst.motion;
    const light = ((t * 0.12) % 2) * this.n;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const i of this.order) {
      if ((this.pz[i] >= 0) !== front) continue;
      const fc = this.face[i];
      const shade = 0.35 + 0.65 * clamp01(Math.abs(fc) / (D * D * 0.02));
      let d = Math.abs(i - (light % this.n));
      d = Math.min(d, this.n - d);
      const glow = Math.exp(-(d * d) / 18);
      const col = fc >= 0 ? c1 : c2;
      ctx.fillStyle = rgba(mix(col, '#ffffff', glow * 0.6), Math.min(1, (0.32 * shade + glow * 0.4) * a));
      ctx.beginPath();
      ctx.moveTo(this.px[i * 2], this.py[i * 2]);
      ctx.lineTo(this.px[i * 2 + 1], this.py[i * 2 + 1]);
      ctx.lineTo(this.px[(i + 1) * 2 + 1], this.py[(i + 1) * 2 + 1]);
      ctx.lineTo(this.px[(i + 1) * 2], this.py[(i + 1) * 2]);
      ctx.closePath();
      ctx.fill();
    }
    // Edges.
    for (const e of [0, 1]) {
      glowStroke(
        ctx,
        () => {
          let open = false;
          for (let i = 0; i <= this.n; i++) {
            const on = (this.pz[Math.min(i, this.n - 1)] >= 0) === front;
            const x = this.px[i * 2 + e];
            const y = this.py[i * 2 + e];
            if (on) {
              if (!open) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              open = true;
            } else open = false;
          }
        },
        D * 0.008,
        '#ffffff',
        a * 0.6,
        0.4,
      );
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Schöpfung: a cosmic lotus of light holds the planet; its petals unfold slowly and seeds
// of light rise from its heart. p: petals, length (D), open (deg), color, hue, pink.
// Accent: full bloom.
// ---------------------------------------------------------------------------

export class CosmicLotus extends Hero {
  private heart: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.heart = glowTex(this.colorStatic('hue', 'hue'), 'core');
  }

  private petal(ctx: CanvasRenderingContext2D, bx: number, by: number, tx: number, ty: number, wx: number, wy: number, a: number): void {
    const grad = ctx.createLinearGradient(bx, by, tx, ty);
    grad.addColorStop(0, rgba(this.colorStatic('color', 'core'), 0.75 * a));
    grad.addColorStop(0.55, rgba(this.colorStatic('hue', 'hue'), 0.5 * a));
    grad.addColorStop(1, rgba(this.colorStatic('pink', 'accent'), 0.4 * a));
    const mx = (bx + tx) / 2;
    const my = (by + ty) / 2;
    const shape = () => {
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(mx + wx, my + wy, tx, ty);
      ctx.quadraticCurveTo(mx - wx, my - wy, bx, by);
    };
    ctx.fillStyle = grad;
    ctx.beginPath();
    shape();
    ctx.fill();
    glowStroke(ctx, shape, D * 0.008, this.colorStatic('hue', 'hue'), a * 0.7, 0.5);
    // Midrib.
    ctx.strokeStyle = rgba('#ffffff', 0.3 * a);
    ctx.lineWidth = D * 0.005;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(mx + wx * 0.1, my + wy * 0.1, tx, ty);
    ctx.stroke();
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const t = env.clock * this.inst.motion;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const grow = easeOut(this.introK());
    const L0 = this.num('length', 1.6) * D;
    const bx = this.ax;
    const by = this.ay + D * 0.4;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      ctx.globalAlpha = Math.min(1, a * (0.45 + acc * 0.5));
      blit(ctx, this.heart, bx, by, D * 1.1 * (1 + acc * 0.5));
      ctx.globalAlpha = 1;
    }
    for (let row = 0; row < 2; row++) {
      const n = row === 0 ? this.num('petals', 9) : this.num('petals', 9) - 2;
      const L = L0 * (row === 0 ? 1 : 0.72) * grow;
      const open = (this.num('open', 58) - row * 18 + 4 * Math.sin(t * 0.2 * TAU) + acc * 22) * DEG * grow;
      const rot = t * (row ? -3 : 2) * DEG + row * 0.3;
      for (let j = 0; j < n; j++) {
        const phi = (j / n) * TAU + rot;
        const sp = Math.sin(phi);
        if ((sp >= 0) !== front) continue;
        const dirX = Math.sin(open) * Math.cos(phi);
        const dirY = -Math.cos(open);
        const dirZ = Math.sin(open) * sp;
        const tx = bx + dirX * L;
        const ty = by + dirY * L + dirZ * L * 0.3;
        // Width points along the tangent of the cup.
        const W = L * 0.3;
        const wx = -Math.sin(phi) * W;
        const wy = Math.cos(phi) * W * 0.3;
        this.petal(ctx, bx, by, tx, ty, wx, wy, a * (0.7 + 0.3 * (sp + 1) * 0.5));
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Nullpunkt: a perfect white zero around a black void behind the planet; everything is
// monochrome and nearly still. p: rx, ry, width, void (D). Accent: the inside of the zero
// inverts and turns back (not with reduced effects).
// ---------------------------------------------------------------------------

export class NullRing extends Hero {
  private voidTex: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.voidTex = bakeTex('void', () =>
      paintTex(128, 128, (u, v) => {
        const d = Math.sqrt(u * u + v * v);
        if (d >= 1) return PX_NONE;
        return pxOut(0, 0, 0, smooth((1 - d) / 0.18));
      }),
    );
  }

  draw(slot: Slot, env: FrameEnv): void {
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    if (slot === 'screenFront') {
      // Accent: the inside of the zero inverts - a crisp ellipse of inverted colour grows out
      // of the void and shrinks back. Full strength inside (no grey crossfade) and kept
      // within the zero (no full-screen flash, the title stays readable).
      const acc = this.inst.reduced ? 0 : this.inst.accent.env;
      if (acc <= 0.01) return;
      const g = Math.sqrt(acc) * this.introScale();
      xform(env, this.inst, this.ax, this.ay);
      ctx.globalCompositeOperation = 'difference';
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.num('rx', 1.25) * D * g, this.num('ry', 1.65) * D * g, 0, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (slot !== this.slot) return;
    const k = this.introScale();
    const rx = this.num('rx', 1.25) * D * k;
    const ry = this.num('ry', 1.65) * D * k;
    const W = this.num('width', 0.09) * D;
    xform(env, this.inst, this.ax, this.ay);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.voidTex, 0, 0, this.num('void', 1.15) * D * 2 * k);
    ctx.globalCompositeOperation = 'lighter';
    const zero = () => ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    glowStroke(ctx, zero, W, '#ffffff', a, 0.8);
    // A thin black seam inside the white band: the "inverted" ring.
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = rgba('#000000', 0.85 * a);
    ctx.lineWidth = W * 0.18;
    ctx.beginPath();
    zero();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------------
// Archetyp: nested Platonic solids turn slowly in 3D around the planet; the inner one
// morphs into the next form on every accent. p: radius, inner (D), spin (deg/s), color,
// accent, core.
// ---------------------------------------------------------------------------

type Solid = { v: [number, number, number][]; e: [number, number][] };

function edgesOf(v: [number, number, number][]): [number, number][] {
  let min = Infinity;
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]));
  const e: [number, number][] = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]) < min * 1.01) e.push([i, j]);
  return e;
}

function normalise(v: [number, number, number][]): [number, number, number][] {
  return v.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return [x / l, y / l, z / l];
  });
}

const PHI = (1 + Math.sqrt(5)) / 2;
const SOLIDS: Solid[] = (() => {
  const tetra = normalise([
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ]);
  const cube: [number, number, number][] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) cube.push([x, y, z]);
  const octa: [number, number, number][] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  const ico: [number, number, number][] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) ico.push([0, a, b * PHI], [a, b * PHI, 0], [b * PHI, 0, a]);
  const dode: [number, number, number][] = [...cube];
  for (const a of [-1, 1]) for (const b of [-1, 1]) dode.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [b * PHI, 0, a / PHI]);
  return [tetra, normalise(cube), octa, normalise(ico), normalise(dode)].map((v) => ({ v, e: edgesOf(v) }));
})();

export class Platonic extends Hero {
  private glint: Tex;
  private projO: { x: number; y: number; z: number }[] = [];
  private projA: { x: number; y: number; z: number }[] = [];
  private projB: { x: number; y: number; z: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.glint = glintTex(this.colorStatic('core', 'core'));
    for (let i = 0; i < 20; i++) {
      this.projO.push({ x: 0, y: 0, z: 0 });
      this.projA.push({ x: 0, y: 0, z: 0 });
      this.projB.push({ x: 0, y: 0, z: 0 });
    }
  }

  private project(s: Solid, R: number, ry: number, rx: number, out: { x: number; y: number; z: number }[]): void {
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    s.v.forEach(([x, y, z], i) => {
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      out[i].x = this.ax + x1 * R;
      out[i].y = this.ay + y1 * R;
      out[i].z = z2;
    });
  }

  private edges(ctx: CanvasRenderingContext2D, s: Solid, p: { x: number; y: number; z: number }[], front: boolean, w: number, col: string, a: number): void {
    glowStroke(
      ctx,
      () => {
        for (const [i, j] of s.e) {
          if ((p[i].z + p[j].z >= 0) !== front) continue;
          ctx.moveTo(p[i].x, p[i].y);
          ctx.lineTo(p[j].x, p[j].y);
        }
      },
      w,
      col,
      a,
      0.6,
    );
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const t = env.clock * this.num('spin', 8) * DEG * this.inst.motion;
    const acc = this.inst.accent;
    const dur = this.inst.spec.motion.accent.duration ?? 2;
    const idx = Math.max(0, acc.index);
    const morph = acc.since < dur ? easeInOut(acc.since / dur) : 1;
    const outer = SOLIDS[3];
    const prev = SOLIDS[(idx + 4) % 5 === 3 ? 1 : (idx + 4) % 5];
    const next = SOLIDS[idx % 5 === 3 ? 1 : idx % 5];
    const R = this.num('radius', 1.9) * D * k;
    const Ri = this.num('inner', 1.05) * D * k;
    this.project(outer, R, t, t * 0.6 + 0.4, this.projO);
    this.project(prev, Ri, -t * 1.3, t * 0.8, this.projA);
    this.project(next, Ri, -t * 1.3, t * 0.8, this.projB);
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const gold = this.color('color', 'hue');
    const violet = this.color('accent', 'accent');
    const fa = front ? 1 : 0.6;
    this.edges(ctx, outer, this.projO, front, D * 0.016, gold, a * 0.85 * fa);
    if (morph < 1) this.edges(ctx, prev, this.projA, front, D * 0.014, violet, a * (1 - morph) * fa);
    this.edges(ctx, next, this.projB, front, D * 0.014, violet, a * morph * fa);
    const flash = this.inst.reduced ? 0 : this.inst.accent.env;
    for (let i = 0; i < outer.v.length; i++) {
      const p = this.projO[i];
      if ((p.z >= 0) !== front) continue;
      const tw = 0.5 + 0.5 * Math.sin(env.clock * 0.8 + i * 1.7);
      ctx.globalAlpha = Math.min(1, a * (0.35 + 0.35 * tw + flash * 0.6));
      blit(ctx, this.glint, p.x, p.y, D * (0.35 + flash * 0.4));
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Äon: an ouroboros of light - a serpent eating its own tail circles the planet; light
// scales ripple along its body. p: radius, tilt, roll, width (D), speed (deg/s), color,
// scale, core. Accent: the eye flashes and a ripple of time spreads.
// ---------------------------------------------------------------------------

export class Ouroboros extends Hero {
  private n = 110;
  private xs = new Float32Array(this.n + 1);
  private ys = new Float32Array(this.n + 1);
  private zs = new Float32Array(this.n + 1);
  private glint: Tex;
  private head: Tex;

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.glint = glintTex(this.colorStatic('scale', 'accent'));
    this.head = glowTex(this.colorStatic('color', 'hue'), 'core');
  }

  override update(env: FrameEnv): void {
    const R = this.num('radius', 1.55) * D * this.introScale();
    const tail = env.clock * this.num('speed', 12) * DEG * this.inst.motion;
    const len = TAU * 0.93 * easeOut(this.introK());
    const tilt = this.num('tilt', 0.36);
    const roll = this.num('roll', -10) * DEG;
    const t = env.clock * this.inst.motion;
    for (let i = 0; i <= this.n; i++) {
      const s = i / this.n;
      const ang = tail + s * len;
      // Serpentine: the body undulates in and out of its orbit.
      const wave = Math.sin(s * TAU * 5 - t * 1.4) * D * 0.08 * (0.3 + 0.7 * s);
      projectOrbit(R + wave, ang, tilt, roll, tmp);
      this.xs[i] = this.ax + tmp.x;
      this.ys[i] = this.ay + tmp.y;
      this.zs[i] = tmp.z;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const W = this.num('width', 0.2) * D;
    const hue = this.color('color', 'hue');
    const scale = this.color('scale', 'accent');
    const t = env.clock * this.inst.motion;
    xform(env, this.inst, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const widthAt = (s: number) => W * (0.12 + 0.88 * Math.pow(Math.sin(Math.min(1, s * 1.1) * Math.PI * 0.5), 0.9));
    for (let i = 0; i < this.n; i++) {
      if ((this.zs[i] >= 0) !== front) continue;
      const s = i / this.n;
      const w = widthAt(s);
      const depthA = 0.7 + 0.3 * (this.zs[i] + 1) * 0.5;
      for (const [lw, al, c] of [[w * 2.2, 0.1, hue], [w, 0.32, hue], [w * 0.3, 0.3, scale]] as [number, number, string][]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = rgba(c, Math.min(1, al * a * depthA));
        ctx.beginPath();
        ctx.moveTo(this.xs[i], this.ys[i]);
        ctx.lineTo(this.xs[i + 1], this.ys[i + 1]);
        ctx.stroke();
      }
    }
    // Gold scales: two rows of glints that ripple along the body.
    for (let i = 3; i < this.n - 4; i += 3) {
      if ((this.zs[i] >= 0) !== front) continue;
      const s = i / this.n;
      const dx = this.xs[i + 1] - this.xs[i];
      const dy = this.ys[i + 1] - this.ys[i];
      const l = Math.hypot(dx, dy) || 1;
      const side = ((i / 3) % 2 ? 1 : -1) * widthAt(s) * 0.28;
      const ripple = 0.5 + 0.5 * Math.sin(s * 40 - t * 2.5);
      ctx.globalAlpha = Math.min(1, a * (0.25 + 0.6 * ripple));
      blit(ctx, this.glint, this.xs[i] - (dy / l) * side, this.ys[i] + (dx / l) * side, widthAt(s) * 0.9);
    }
    // Head biting the tail: a pointed glow with two eyes that flash on the accent.
    const h = this.n;
    if ((this.zs[h] >= 0) === front) {
      const acc = this.inst.reduced ? 0 : this.inst.accent.env;
      const dx = this.xs[h] - this.xs[h - 3];
      const dy = this.ys[h] - this.ys[h - 3];
      const l = Math.hypot(dx, dy) || 1;
      const ux = dx / l;
      const uy = dy / l;
      ctx.globalAlpha = Math.min(1, a * 0.9);
      ctx.fillStyle = rgba(hue, 0.55 * a);
      ctx.beginPath();
      ctx.ellipse(this.xs[h] - ux * W * 0.2, this.ys[h] - uy * W * 0.2, W * 0.95, W * 0.62, Math.atan2(uy, ux), 0, TAU);
      ctx.fill();
      blit(ctx, this.head, this.xs[h], this.ys[h], W * 2.6);
      for (const side of [-1, 1]) {
        ctx.globalAlpha = Math.min(1, a * (0.85 + acc));
        blit(ctx, this.glint, this.xs[h] - ux * W * 0.15 - uy * side * W * 0.3, this.ys[h] - uy * W * 0.15 + ux * side * W * 0.3, W * (0.9 + acc * 3));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Weltenkern: a colossal radiant core with a prismatic corona and a slow heartbeat;
// small worlds orbit it like electrons. p: core (D), worlds, color, accent.
// Accent: a strong heartbeat.
// ---------------------------------------------------------------------------

export class WorldHeart extends Hero {
  private core: Tex;
  private glow: Tex;
  private rays: Tex[];
  private worlds: { orbit: number; ph: number; sp: number; r: number; size: number; tex: Tex; halo: Tex; x: number; y: number; z: number }[] = [];

  constructor(spec: HeroSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.core = glowTex(mix(this.colorStatic('color', 'hue'), '#ffffff', 0.5), 'core');
    this.glow = glowTex(this.colorStatic('color', 'hue'), 'soft');
    // One ray shape in three spectral tints; the three crowns turn at different speeds.
    this.rays = [0, 120, 240].map((h) => raysTex(spectral(h), 18, 0.7, inst.seed % 50));
    const n = this.num('worlds', 7);
    for (let i = 0; i < n; i++) {
      const col = spectral((i / n) * 360);
      this.worlds.push({ orbit: i % 3, ph: hash(i * 7) * TAU, sp: 10 + hash(i * 3) * 12, r: 1.55 + (i % 3) * 0.32 + hash(i) * 0.2, size: 0.1 + hash(i * 11) * 0.07, tex: spriteTex('moon', col), halo: glowTex(col, 'soft'), x: 0, y: 0, z: 0 });
    }
  }

  private beat(clock: number): number {
    const c = (clock * 0.25) % 1;
    const p = (x: number) => (x >= 0 && x < 0.2 ? Math.sin((x / 0.2) * Math.PI) : 0);
    return p(c) + 0.6 * p(c - 0.18);
  }

  override update(env: FrameEnv): void {
    const k = this.introScale();
    const rolls = [-40, 12, 62];
    for (const w of this.worlds) {
      projectOrbit(w.r * D * k, w.ph + env.clock * w.sp * DEG * this.inst.motion, 0.3, rolls[w.orbit] * DEG, tmp);
      w.x = this.ax + tmp.x;
      w.y = this.ay + tmp.y;
      w.z = tmp.z;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const front = slot === 'heroFront';
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const k = this.introScale();
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const hb = (this.inst.reduced ? 0.3 : 1) * this.beat(env.clock) + acc;
    const C = this.num('core', 1.35) * D * k * (1 + 0.05 * hb);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      xform(env, this.inst, this.ax, this.ay);
      ctx.globalAlpha = Math.min(1, a * (0.45 + 0.2 * hb));
      blit(ctx, this.glow, 0, 0, C * 3.6);
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = Math.min(1, a * (0.3 + 0.15 * hb));
        xScreen(env, this.inst, this.ax, this.ay, env.clock * (2 + i) * DEG * (i % 2 ? -1 : 1) * this.inst.motion + i);
        blit(ctx, this.rays[i], 0, 0, C * 3.4);
      }
      xform(env, this.inst, this.ax, this.ay);
      ctx.globalAlpha = Math.min(1, a * (0.85 + 0.15 * hb));
      blit(ctx, this.core, 0, 0, C * 2);
    }
    for (const w of this.worlds) {
      if ((w.z >= 0) !== front) continue;
      const s = w.size * D * (1 + 0.2 * w.z) * k;
      xform(env, this.inst, w.x, w.y);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a * (0.55 + 0.4 * hb));
      blit(ctx, w.halo, 0, 0, s * 4.5);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, a);
      blit(ctx, w.tex, 0, 0, s * 2.2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  override light(): { angle?: number; boost?: number } | null {
    return { angle: -Math.PI / 2, boost: 0.3 + this.beat(Date.now() / 1000) * 0.1 + this.inst.accent.env * 0.5 };
  }
}

export const HEROES_V6 = {
  bubbleUniverses: BubbleUniverses,
  cosmicWeb: CosmicWeb,
  bigBang: BigBang,
  primordialCell: PrimordialCell,
  decayLattice: DecayLattice,
  dyingEmber: DyingEmber,
  mirrorRings: MirrorRings,
  mobiusBand: MobiusBand,
  cosmicLotus: CosmicLotus,
  nullRing: NullRing,
  platonic: Platonic,
  ouroboros: Ouroboros,
  worldHeart: WorldHeart,
};

