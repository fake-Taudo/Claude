// Generic, data-driven layers. Every number comes from the spec; the code only defines
// how a kind of element is drawn and animated.

import type {
  BandLayer as BandSpec,
  BeamLayer as BeamSpec,
  ConstellationLayer as ConstSpec,
  FlareLayer as FlareSpec,
  GlowLayer as GlowSpec,
  LayerSpec,
  LightningLayer as LightningSpec,
  NebulaLayer as NebulaSpec,
  OrbiterLayer as OrbiterSpec,
  PillarLayer as PillarSpec,
  RaysLayer as RaysSpec,
  RippleLayer as RippleSpec,
  ShockwaveLayer as ShockSpec,
  SigilLayer as SigilSpec,
  Slot,
  SmokeLayer as SmokeSpec,
  VortexLayer as VortexSpec,
} from '../../config/vfx/types';
import { mix, rgba } from '../color';
import { blit, clipHalf, D, type AuraInstance, type FrameEnv, Layer, type LayerFactory, projectOrbit, type Shadow, xform, xPlane, xScreen } from './core';
import { createHero } from './heroes';
import { clamp01, DEG, easeOut, hash, Rng, schedule, smooth, TAU } from './math';
import { ParticleLayer } from './particles';
import { bloomOf, SIGIL_PAD, sigilTex } from './sigil';
import { BAND_PAD, bandTex, coneTex, flowTex, glintTex, glowTex, nebulaTex, pillarTex, puffTex, raysTex, ringTex, spiralTex, spriteTex, streakTex, type Tex } from './tex';

const tmp = { x: 0, y: 0, z: 0 };

const anchor = (spec: LayerSpec): [number, number] => [(spec.at?.[0] ?? 0) * D, (spec.at?.[1] ?? 0) * D];

function setBlend(ctx: CanvasRenderingContext2D, blend: 'add' | 'normal' | undefined, def: 'add' | 'normal' = 'add'): void {
  ctx.globalCompositeOperation = (blend ?? def) === 'add' ? 'lighter' : 'source-over';
}

function reset(ctx: CanvasRenderingContext2D): void {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/** Length that reaches the stage edge from a point (for 'stage' lengths). */
function stageReach(env: FrameEnv, inst: AuraInstance, x: number, y: number, dir: 'up' | 'down' | 'any'): number {
  const s = env.stage;
  const k = 1 / inst.scale;
  if (dir === 'up') return (y - s.top * k) * 1.02;
  if (dir === 'down') return (s.bottom * k - y) * 1.02;
  return Math.hypot(Math.max(x - s.left * k, s.right * k - x), Math.max(y - s.top * k, s.bottom * k - y));
}

// ---------------------------------------------------------------------------

export class GlowLayer extends Layer<GlowSpec> {
  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [x, y] = anchor(s);
    const br = 1 + (s.breathe ?? 0) * this.inst.breathe(env.clock, this.index * 0.17) * this.inst.motion;
    const k = (s.role === 'hero' ? this.introScale() : 1) * br;
    const size = s.size * D * k;
    const [sx, sy] = s.stretch ?? [1, 1];
    const tex = glowTex(this.inst.col(s.color, env.clock), s.profile ?? 'soft');
    setBlend(ctx, s.blend);
    ctx.globalAlpha = Math.min(1, a);
    xform(env, this.inst, x, y, sx, 0, 0, sy);
    blit(ctx, tex, 0, 0, size);
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

interface Puff {
  ang: number;
  r: number;
  size: number;
  rot: number;
  spin: number;
  variant: number;
  phase: number;
  a: number;
}

export class SmokeLayer extends Layer<SmokeSpec> {
  private puffs: Puff[] = [];
  private texs: Tex[];

  constructor(spec: SmokeSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const rng = new Rng(inst.seed + index * 101);
    for (let i = 0; i < spec.count; i++) {
      this.puffs.push({
        ang: (i / spec.count) * TAU + rng.range(-0.3, 0.3),
        r: rng.range(spec.radius[0], spec.radius[1]) * D,
        size: rng.range(spec.size[0], spec.size[1]) * D,
        rot: rng.next() * TAU,
        spin: rng.range(-6, 6) * DEG,
        variant: i % 4,
        phase: rng.next(),
        a: rng.range(0.55, 1),
      });
    }
    const col = inst.colStatic(spec.color);
    this.texs = [0, 1, 2, 3].map((v) => puffTex(col, v));
  }

  protected override defaultSlot(): Slot {
    return this.spec.plane === 'ground' ? 'ground' : 'smokeBack';
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const n = Math.max(1, Math.round(this.puffs.length * (0.5 + 0.5 * env.q)));
    const t = env.clock * this.inst.motion;
    const ground = s.plane === 'ground';
    const gy = ground ? this.inst.groundY : 0;
    const sq = ground ? this.inst.groundSquash : s.squash ?? 1;
    const S = env.view.s * this.inst.scale;
    setBlend(ctx, s.blend, 'normal');
    for (let i = 0; i < n; i++) {
      const p = this.puffs[i];
      const ang = p.ang + s.drift * DEG * t;
      let x = ax + Math.cos(ang) * p.r;
      let y = ay + gy + Math.sin(ang) * p.r * sq;
      let fade = 1;
      if (s.rise) {
        const range = D * 1.2;
        const off = ((t * s.rise * D + p.phase * range) % range + range) % range;
        y -= off;
        fade = Math.sin((off / range) * Math.PI);
      }
      x += Math.sin(t * 0.13 + p.phase * 9) * D * 0.04;
      const rot = p.rot + p.spin * t;
      const size = p.size * (1 + 0.06 * Math.sin(t * 0.21 + p.phase * 7));
      ctx.globalAlpha = Math.min(1, a * p.a * fade);
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      const ky = ground ? 0.6 : 1;
      ctx.setTransform(S * c, S * sn * ky, -S * sn, S * c * ky, env.view.tx + S * x, env.view.ty + S * y);
      ctx.drawImage(this.texs[p.variant], -size / 2, -size / 2, size, size);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class SigilLayer extends Layer<SigilSpec> {
  private tex: Tex;
  private glint: Tex;

  constructor(spec: SigilSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    // Texture at screen resolution (breathing and the intro overshoot add up to ~5 %).
    const size = inst.texPx(spec.radius * 2 * SIGIL_PAD * 1.05);
    this.tex = sigilTex(`${inst.spec.id}|${index}`, spec.pattern, inst.colStatic(spec.color), spec.glow ?? 1, (c) => inst.colStatic(c), size);
    this.glint = glintTex(mix(inst.colStatic(spec.color), '#ffffff', 0.5));
  }

  protected override defaultSlot(): Slot {
    const pl = this.spec.plane ?? 'ground';
    return pl === 'ground' ? 'ground' : 'heroBack';
  }

  draw(slot: Slot, env: FrameEnv): void {
    const s = this.spec;
    const plane = s.plane ?? 'ground';
    const orbit = plane === 'orbit';
    if (orbit ? slot !== 'heroBack' && slot !== 'heroFront' : slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const spin = s.spin * DEG * env.clock * this.inst.motion;
    const br = 1 + (s.breathe ?? 0) * this.inst.breathe(env.clock, this.index * 0.23) * this.inst.motion;
    const k = (s.role === 'hero' ? this.introScale() : 1) * br;
    const R = s.radius * D * k;
    const half = R * SIGIL_PAD;
    const drawOn = s.drawOn !== false && this.introK() < 1 ? this.introK() : 1;
    setBlend(ctx, s.blend);
    ctx.globalAlpha = Math.min(1, a);
    const place = () => {
      if (plane === 'ground') xPlane(env, this.inst, ax, ay + this.inst.groundY, spin, this.inst.groundSquash);
      else if (plane === 'screen') xScreen(env, this.inst, ax, ay, spin);
      else xPlane(env, this.inst, ax, ay, spin, s.tilt ?? 0.35, (s.roll ?? 0) * DEG);
    };
    ctx.save();
    if (orbit) clipHalf(env, this.inst, ax, ay, (s.roll ?? 0) * DEG, slot === 'heroBack' ? 'back' : 'front');
    place();
    if (drawOn < 1) {
      const start = -Math.PI / 2 - spin;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, half * 1.05, start, start + TAU * easeOut(drawOn));
      ctx.closePath();
      ctx.clip();
    }
    const bloom = s.bloom ?? 0.5;
    if (bloom > 0 && env.q > 0.4) {
      ctx.globalAlpha = Math.min(1, a * bloom);
      ctx.drawImage(bloomOf(this.tex), -half * 1.04, -half * 1.04, half * 2.08, half * 2.08);
      ctx.globalAlpha = Math.min(1, a);
    }
    ctx.drawImage(this.tex, -half, -half, half * 2, half * 2);
    ctx.restore();
    if (drawOn < 1 && drawOn > 0 && slot !== 'heroFront') {
      // Pen tip: a glint travelling along the outer edge while the sigil draws itself.
      const ang = -Math.PI / 2 + TAU * easeOut(drawOn);
      let gx = ax + Math.cos(ang) * R * 0.98;
      let gy = ay + Math.sin(ang) * R * 0.98;
      if (plane === 'ground') gy = ay + this.inst.groundY + Math.sin(ang) * R * 0.98 * this.inst.groundSquash;
      else if (plane === 'orbit') {
        projectOrbit(R * 0.98, ang, s.tilt ?? 0.35, (s.roll ?? 0) * DEG, tmp);
        gx = ax + tmp.x;
        gy = ay + tmp.y;
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, a * 1.5) * (1 - drawOn * 0.5);
      xform(env, this.inst, gx, gy);
      blit(ctx, this.glint, 0, 0, D * 0.9 * (s.radius > 1 ? 1.3 : 1));
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class RippleLayer extends Layer<RippleSpec> {
  private tex: Tex | null = null;
  private fired: number[] = [];

  protected override defaultSlot(): Slot {
    return (this.spec.plane ?? 'ground') === 'ground' ? 'ground' : 'heroBack';
  }

  override update(env: FrameEnv): void {
    if (this.spec.count === 0 && this.inst.accent.fired) this.fired.push(env.clock);
    while (this.fired.length && env.clock - this.fired[0] > this.spec.period) this.fired.shift();
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    this.tex ??= ringTex(this.inst.colStatic(s.color), 12, this.inst.texPx((2 * s.radius) / 0.85, 256, 512));
    const [ax, ay] = anchor(s);
    const ground = (s.plane ?? 'ground') === 'ground';
    setBlend(ctx, 'add');
    const ring = (age: number) => {
      const k = clamp01(age / s.period);
      const r = (s.width * 1.2 + (s.radius - s.width) * easeOut(k)) * D;
      const half = r / 0.85;
      ctx.globalAlpha = Math.min(1, a * smooth(k / 0.08) * Math.pow(1 - k, 1.4));
      if (ground) xPlane(env, this.inst, ax, ay + this.inst.groundY, 0, this.inst.groundSquash);
      else xScreen(env, this.inst, ax, ay, 0);
      ctx.drawImage(this.tex!, -half, -half, half * 2, half * 2);
    };
    const count = s.count ?? 2;
    if (count > 0) {
      const step = s.period / count;
      const t = env.clock * this.inst.motion;
      const base = Math.floor(t / step);
      for (let i = 0; i < count; i++) ring(t - (base - i) * step);
    }
    for (const t0 of this.fired) ring(env.clock - t0);
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class VortexLayer extends Layer<VortexSpec> {
  private tex: Tex;
  private dark: Tex | null;

  constructor(spec: VortexSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c1 = inst.colStatic(spec.color);
    const c2 = inst.colStatic(spec.color2 ?? spec.color);
    this.tex = spiralTex(c1, c2, spec.arms, spec.twist ?? 1.4, spec.dark ?? 0, (inst.seed + index) % 997);
    this.dark = spec.dark ? glowTex(inst.palette.smoke, 'soft') : null;
  }

  protected override defaultSlot(): Slot {
    const pl = this.spec.plane ?? 'ground';
    return pl === 'ground' ? 'ground' : 'heroBack';
  }

  draw(slot: Slot, env: FrameEnv): void {
    const s = this.spec;
    const orbit = (s.plane ?? 'ground') === 'orbit';
    if (orbit ? slot !== 'heroBack' && slot !== 'heroFront' : slot !== this.slot) return;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const k = s.role === 'hero' ? this.introScale() : 1;
    const R = s.radius * D * k;
    const spin = s.spin * DEG * env.clock * this.inst.motion;
    const plane = s.plane ?? 'ground';
    const place = (rot: number, scale: number) => {
      if (plane === 'ground') xPlane(env, this.inst, ax, ay + this.inst.groundY, rot, this.inst.groundSquash, 0, scale);
      else if (plane === 'screen') xScreen(env, this.inst, ax, ay, rot, scale);
      else xPlane(env, this.inst, ax, ay, rot, s.tilt ?? 0.35, (s.roll ?? 0) * DEG, scale);
    };
    ctx.save();
    if (orbit) clipHalf(env, this.inst, ax, ay, (s.roll ?? 0) * DEG, slot === 'heroBack' ? 'back' : 'front');
    if (this.dark && slot !== 'heroFront') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = Math.min(1, a * (s.dark ?? 0));
      place(0, 1);
      blit(ctx, this.dark, 0, 0, R * 1.2);
    }
    setBlend(ctx, s.blend);
    ctx.globalAlpha = Math.min(1, a);
    place(spin, 1);
    blit(ctx, this.tex, 0, 0, R * 2);
    if (env.q > 0.5) {
      ctx.globalAlpha = Math.min(1, a * 0.45);
      place(spin * 1.55 + 1.3, 0.78);
      blit(ctx, this.tex, 0, 0, R * 2);
    }
    ctx.restore();
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class BandLayer extends Layer<BandSpec> {
  private tex: Tex;
  private glint: Tex;
  private glints: { phase: number; speed: number; size: number }[] = [];

  constructor(spec: BandSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c1 = inst.colStatic(spec.color);
    const c2 = inst.colStatic(spec.color2 ?? spec.color);
    const size = inst.texPx(2 * (spec.radius + BAND_PAD * spec.width));
    this.tex = bandTex(c1, c2, spec.width / spec.radius, spec.variation ?? 0.6, (inst.seed + index * 13) % 991, size);
    this.glint = glintTex(mix(c1, '#ffffff', 0.4));
    const rng = new Rng(inst.seed + index * 31);
    for (let i = 0; i < (spec.glints ?? 0); i++) this.glints.push({ phase: (i / (spec.glints ?? 1)) * TAU + rng.range(-0.4, 0.4), speed: rng.range(0.85, 1.25), size: rng.range(0.7, 1.2) });
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const s = this.spec;
    const half = slot === 'heroBack' ? 'back' : 'front';
    if (s.half && s.half !== half) return;
    const a = this.alpha() * (half === 'back' ? 0.78 : 1);
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const k = s.role === 'hero' ? this.introScale() : 1;
    const R = s.radius * D * k;
    const H = R + BAND_PAD * s.width * D * k;
    const roll = (s.roll ?? 0) * DEG;
    const spin = s.spin * DEG * env.clock * this.inst.motion;
    ctx.save();
    clipHalf(env, this.inst, ax, ay, roll, half);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    xPlane(env, this.inst, ax, ay, spin, s.tilt, roll);
    ctx.drawImage(this.tex, -H, -H, H * 2, H * 2);
    ctx.restore();
    // Glints riding on the ring.
    if (this.glints.length) {
      ctx.globalCompositeOperation = 'lighter';
      xform(env, this.inst, ax, ay);
      const gs = (s.glintSize ?? 0.22) * D;
      for (const g of this.glints) {
        const phi = g.phase + spin * g.speed * 1.6;
        projectOrbit(R, phi, s.tilt, roll, tmp);
        if ((tmp.z >= 0) !== (half === 'front')) continue;
        const tw = 0.65 + 0.35 * Math.sin(env.clock * 1.7 + g.phase * 3);
        ctx.globalAlpha = Math.min(1, a * tw * (0.6 + 0.4 * (tmp.z + 1) * 0.5));
        blit(ctx, this.glint, tmp.x, tmp.y, gs * g.size * (1 + 0.2 * tmp.z) * 2);
      }
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class PillarLayer extends Layer<PillarSpec> {
  private tex: Tex;
  private flow: Tex;
  private glow: Tex;
  private glint: Tex;
  /** Offscreen buffer: scrolled flow texture masked with the column fade. */
  private buf: HTMLCanvasElement;
  private bctx: CanvasRenderingContext2D;
  private mask: CanvasGradient;

  constructor(spec: PillarSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = inst.colStatic(spec.color);
    this.tex = pillarTex(c);
    this.flow = flowTex(c, 3 + index);
    this.glow = glowTex(c, 'core');
    this.glint = glintTex(mix(c, '#ffffff', 0.5));
    this.buf = document.createElement('canvas');
    this.buf.width = 64;
    this.buf.height = 256;
    this.bctx = this.buf.getContext('2d')!;
    const g = this.bctx.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.08, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,0.75)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    this.mask = g;
  }

  protected override defaultSlot(): Slot {
    return 'beams';
  }

  /** Renders the flowing streaks for a column of the given length into the buffer. */
  private renderFlow(len: number, scroll: number): void {
    const b = this.bctx;
    const W = this.buf.width;
    const H = this.buf.height;
    b.globalCompositeOperation = 'copy';
    b.globalAlpha = 1;
    // Tile height in buffer pixels for a texture tile of 4 D.
    const tile = Math.max(8, (H * D * 4) / Math.max(1, len));
    let off = (scroll / (D * 4)) * tile;
    off = ((off % tile) + tile) % tile;
    b.clearRect(0, 0, W, H);
    b.globalCompositeOperation = 'source-over';
    for (let y = -tile + off; y < H; y += tile) b.drawImage(this.flow, 0, y, W, tile);
    b.globalCompositeOperation = 'destination-in';
    b.fillStyle = this.mask;
    b.fillRect(0, 0, W, H);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const grow = easeOut(this.introK());
    const br = 1 + (s.breathe ?? 0) * this.inst.breathe(env.clock, 0.4) * this.inst.motion;
    const W = s.width * D * 2.2 * br;
    const up = (s.up === 'stage' ? stageReach(env, this.inst, ax, ay, 'up') : s.up * D) * grow;
    const down = (s.down === undefined ? 0 : s.down === 'stage' ? stageReach(env, this.inst, ax, ay, 'down') : s.down * D) * grow;
    ctx.globalCompositeOperation = 'lighter';
    const scroll = env.clock * s.flow * D * this.inst.motion;
    const segment = (len: number, dir: 1 | -1) => {
      if (len <= 1) return;
      xform(env, this.inst, ax, ay, 1, 0, 0, dir);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(this.tex, -W / 2, -len, W, len);
      if (env.q > 0.25) {
        this.renderFlow(len, scroll * dir);
        ctx.globalAlpha = Math.min(1, a * 0.65);
        ctx.drawImage(this.buf, -W * 0.32, -len, W * 0.64, len);
      }
      // Bright head while the column shoots out during the intro.
      if (grow < 1) {
        ctx.globalAlpha = Math.min(1, a * (1 - grow) * 1.5);
        blit(ctx, this.glow, 0, -len, W * 1.4);
      }
    };
    segment(up, 1);
    segment(down, -1);
    if (s.flare) {
      xform(env, this.inst, ax, ay);
      ctx.globalAlpha = Math.min(1, a * s.flare);
      blit(ctx, this.glow, 0, 0, W * 1.1 * br);
      ctx.globalAlpha = Math.min(1, a * s.flare * 0.8);
      blit(ctx, this.glint, 0, 0, W * 2.2);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class BeamLayer extends Layer<BeamSpec> {
  private tex: Tex;
  private glint: Tex;

  constructor(spec: BeamSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = inst.colStatic(spec.color);
    this.tex = coneTex(c, spec.dust ?? false);
    this.glint = glintTex(mix(c, '#ffffff', 0.5));
  }

  protected override defaultSlot(): Slot {
    return 'beams';
  }

  /** Current beam angle (radians) of beam 0. */
  angle(clock: number): number {
    const s = this.spec;
    const base = (s.angle ?? 0) * DEG;
    const t = clock * this.inst.motion;
    if (s.swing) return base + Math.sin(t * s.spin * DEG) * s.swing * DEG;
    return base + t * s.spin * DEG;
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const grow = easeOut(this.introK());
    const L = (s.length === 'stage' ? stageReach(env, this.inst, ax, ay, 'any') : s.length * D) * grow;
    const W = 2 * L * Math.tan((s.spread * DEG) / 2) * 1.6;
    const base = this.angle(env.clock);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < s.count; i++) {
      const ang = base + (i / s.count) * TAU;
      const face = s.facing ? 0.55 + 0.45 * Math.abs(Math.sin(ang)) : 1;
      ctx.globalAlpha = Math.min(1, a * face);
      xScreen(env, this.inst, ax, ay, ang);
      ctx.drawImage(this.tex, 0, -W / 2, L, W);
    }
    xform(env, this.inst, ax, ay);
    ctx.globalAlpha = Math.min(1, a);
    blit(ctx, this.glint, 0, 0, D * 1.2);
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class RaysLayer extends Layer<RaysSpec> {
  private tex: Tex;

  constructor(spec: RaysSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.tex = raysTex(inst.colStatic(spec.color), spec.n, spec.jitter ?? 0.5, (inst.seed + index) % 89);
  }

  protected override defaultSlot(): Slot {
    return (this.spec.plane ?? 'screen') === 'ground' ? 'ground' : 'smokeBack';
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const k = s.role === 'hero' ? this.introScale() : easeOut(this.introK()) * 0.4 + 0.6;
    const R = s.radius * D * k;
    const spin = s.spin * DEG * env.clock * this.inst.motion;
    const ground = s.plane === 'ground';
    const place = () => (ground ? xPlane(env, this.inst, ax, ay + this.inst.groundY, spin, this.inst.groundSquash) : xScreen(env, this.inst, ax, ay, spin));
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    place();
    ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
    const acc = this.inst.accent;
    if (s.sweep && acc.env > 0 && !this.inst.reduced) {
      // A bright wedge travels once around during the accent.
      const dur = this.inst.spec.motion.accent.duration ?? 1.6;
      const p = clamp01(acc.since / dur);
      const ang = -Math.PI / 2 + p * TAU - spin;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, ang - 0.5, ang);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = Math.min(1, acc.env * 1.4 * this.inst.alpha);
      ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
      ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
      ctx.restore();
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class OrbiterLayer extends Layer<OrbiterSpec> {
  private texs: Tex[];
  private halo: Tex[];
  private trail: Tex[];
  private items: { phase: number; r: number; size: number; ci: number; spin: number; bob: number }[] = [];
  private pos: { x: number; y: number; z: number; size: number }[] = [];

  constructor(spec: OrbiterSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const cols = (Array.isArray(spec.color) ? spec.color : [spec.color]).map((c) => inst.colStatic(c));
    this.texs = cols.map((c) => spriteTex(spec.sprite === 'moon' ? 'moon' : spec.sprite, c));
    this.halo = cols.map((c) => glowTex(c, 'soft'));
    this.trail = cols.map((c) => streakTex(c));
    const rng = new Rng(inst.seed + index * 53);
    const [r0, r1] = Array.isArray(spec.radius) ? spec.radius : [spec.radius, spec.radius];
    const [s0, s1] = Array.isArray(spec.size) ? spec.size : [spec.size, spec.size];
    for (let i = 0; i < spec.count; i++) {
      const f = spec.count > 1 ? i / (spec.count - 1) : 0;
      this.items.push({
        phase: (i / spec.count) * TAU + rng.range(-0.2, 0.2),
        r: (r0 + (r1 - r0) * (spec.count > 1 ? hash(i * 17 + index) : f)) * D,
        size: rng.range(s0, s1) * D,
        ci: i % cols.length,
        spin: (spec.spin ?? 0) * DEG * rng.sign(),
        bob: rng.next() * TAU,
      });
      this.pos.push({ x: 0, y: 0, z: 0, size: 0 });
    }
  }

  override update(env: FrameEnv): void {
    const s = this.spec;
    const [ax, ay] = anchor(s);
    const t = env.clock * this.inst.motion;
    const roll = (s.roll ?? 0) * DEG;
    const k = s.role === 'hero' ? this.introScale() : 1;
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      projectOrbit(it.r * k, it.phase + t * s.speed * DEG, s.tilt, roll, tmp);
      const p = this.pos[i];
      p.x = ax + tmp.x;
      p.y = ay + tmp.y + (s.bob ? Math.sin(t * 0.8 + it.bob) * s.bob * D : 0);
      p.z = tmp.z;
      p.size = it.size * (1 + 0.18 * tmp.z) * k;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== 'heroBack' && slot !== 'heroFront') return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const front = slot === 'heroFront';
    const ctx = env.ctx;
    const S = env.view.s * this.inst.scale;
    const t = env.clock * this.inst.motion;
    for (let i = 0; i < this.items.length; i++) {
      const p = this.pos[i];
      if ((p.z >= 0) !== front) continue;
      const it = this.items[i];
      const depthA = 0.65 + 0.35 * (p.z + 1) * 0.5;
      ctx.globalCompositeOperation = 'lighter';
      if (s.trail) {
        // Tangent of the orbit at this point.
        const dir = s.speed >= 0 ? 1 : -1;
        projectOrbit(it.r, it.phase + t * s.speed * DEG + 0.05 * dir, s.tilt, (s.roll ?? 0) * DEG, tmp);
        const [ax, ay] = anchor(s);
        const dx = ax + tmp.x - p.x;
        const dy = ay + tmp.y - p.y;
        const l = Math.hypot(dx, dy) || 1;
        const len = Math.abs(s.speed) * DEG * it.r * s.trail;
        const c = -dx / l;
        const sn = -dy / l;
        ctx.globalAlpha = Math.min(1, a * depthA * 0.8);
        ctx.setTransform(S * -c, S * -sn, S * sn, S * -c, env.view.tx + S * p.x, env.view.ty + S * p.y);
        ctx.drawImage(this.trail[it.ci], -len, -p.size * 0.35, len, p.size * 0.7);
      }
      if (s.halo) {
        xform(env, this.inst, 0, 0);
        ctx.globalAlpha = Math.min(1, a * depthA * 0.55);
        blit(ctx, this.halo[it.ci], p.x, p.y, p.size * s.halo);
      }
      ctx.globalCompositeOperation = s.sprite === 'moon' || s.sprite === 'chunk' ? 'source-over' : 'lighter';
      ctx.globalAlpha = Math.min(1, a * depthA);
      const rot = it.spin * t;
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      ctx.setTransform(S * c, S * sn, -S * sn, S * c, env.view.tx + S * p.x, env.view.ty + S * p.y);
      ctx.drawImage(this.texs[it.ci], -p.size, -p.size, p.size * 2, p.size * 2);
    }
    reset(ctx);
  }

  override shadows(out: Shadow[]): void {
    if (!this.spec.shadow) return;
    for (const p of this.pos) {
      if (p.z < 0.15) continue;
      out.push({ x: p.x + p.size * 0.25, y: p.y + p.size * 0.35, r: p.size * 0.9, a: 0.45 * p.z * this.alpha() });
    }
  }
}

// ---------------------------------------------------------------------------

interface Bolt {
  pts: Float32Array;
  n: number;
  born: number;
  branches: { start: number; pts: Float32Array; n: number }[];
  x1: number;
  y1: number;
}

/** Midpoint displacement between two points; writes into pts and returns the count. */
function bolt(rng: Rng, x0: number, y0: number, x1: number, y1: number, rough: number, depth: number, out: Float32Array): number {
  const n = (1 << depth) + 1;
  out[0] = x0;
  out[1] = y0;
  out[(n - 1) * 2] = x1;
  out[(n - 1) * 2 + 1] = y1;
  let step = n - 1;
  let disp = Math.hypot(x1 - x0, y1 - y0) * rough;
  while (step > 1) {
    const h = step >> 1;
    for (let i = h; i < n; i += step) {
      const ax = out[(i - h) * 2];
      const ay = out[(i - h) * 2 + 1];
      const bx = out[(i + h) * 2];
      const by = out[(i + h) * 2 + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const l = Math.hypot(dx, dy) || 1;
      const off = (rng.next() * 2 - 1) * disp;
      out[i * 2] = (ax + bx) / 2 + (-dy / l) * off;
      out[i * 2 + 1] = (ay + by) / 2 + (dx / l) * off;
    }
    step = h;
    disp *= 0.55;
  }
  return n;
}

export class LightningLayer extends Layer<LightningSpec> {
  private bolts: Bolt[] = [];
  private rng: Rng;
  private glow: Tex;
  private prevClock = -1;

  constructor(spec: LightningSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    this.rng = new Rng(inst.seed + index * 211);
    this.glow = glowTex(inst.colStatic(spec.color), 'core');
  }

  protected override defaultSlot(): Slot {
    return 'beams';
  }

  private strike(clock: number): void {
    const s = this.spec;
    const r = this.rng;
    const sp = (s.spread ?? 0.3) * D;
    const x0 = s.from[0] * D + r.range(-sp, sp) * 0.5;
    const y0 = s.from[1] * D + r.range(-sp, sp) * 0.3;
    const x1 = s.to[0] * D + r.range(-sp, sp);
    const y1 = s.to[1] * D + r.range(-sp, sp) * 0.3;
    const pts = new Float32Array(66);
    const n = bolt(r, x0, y0, x1, y1, 0.22, 5, pts);
    const branches: Bolt['branches'] = [];
    for (let b = 0; b < (s.branches ?? 2); b++) {
      const start = 6 + Math.floor(r.next() * (n - 12));
      const bx = pts[start * 2];
      const by = pts[start * 2 + 1];
      const ang = Math.atan2(y1 - y0, x1 - x0) + r.sign() * r.range(0.4, 0.9);
      const len = Math.hypot(x1 - x0, y1 - y0) * r.range(0.2, 0.4);
      const bp = new Float32Array(34);
      const bn = bolt(r, bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, 0.3, 4, bp);
      branches.push({ start, pts: bp, n: bn });
    }
    this.bolts.push({ pts, n, born: clock, branches, x1, y1 });
    if (this.bolts.length > 4) this.bolts.shift();
  }

  override update(env: FrameEnv): void {
    const s = this.spec;
    if (this.introK() >= 1) {
      if (this.inst.accent.fired) this.strike(env.clock);
      if (s.every && this.prevClock >= 0) {
        const sc = schedule(env.clock, this.prevClock, s.every, this.inst.seed + this.index * 3);
        if (sc.fired) this.strike(env.clock);
      }
    }
    this.prevClock = env.clock;
    const dur = s.duration ?? 0.5;
    this.bolts = this.bolts.filter((b) => env.clock - b.born < dur + 1.2);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot || !this.bolts.length) return;
    const s = this.spec;
    const ctx = env.ctx;
    const base = (s.alpha ?? 1) * this.inst.alpha * (this.inst.reduced ? 0.35 : 1);
    const col = this.inst.col(s.color, env.clock);
    const dur = s.duration ?? 0.5;
    const w = (s.width ?? 0.025) * D;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    xform(env, this.inst, 0, 0);
    for (const b of this.bolts) {
      const age = env.clock - b.born;
      // One main flash with a fast decay (no strobing), then an afterglow at the impact.
      const k = age / dur;
      const flash = k < 1 ? (k < 0.08 ? k / 0.08 : Math.pow(1 - (k - 0.08) / 0.92, 1.8)) : 0;
      if (flash > 0.01) {
        const path = (pts: Float32Array, n: number) => {
          ctx.beginPath();
          ctx.moveTo(pts[0], pts[1]);
          for (let i = 1; i < n; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
        };
        for (const [lw, al, c] of [[w * 9, 0.08, col], [w * 3.5, 0.35, col], [w, 0.95, '#ffffff']] as [number, number, string][]) {
          ctx.strokeStyle = rgba(c, Math.min(1, al * flash * base));
          ctx.lineWidth = lw;
          path(b.pts, b.n);
          ctx.stroke();
          ctx.lineWidth = lw * 0.6;
          for (const br of b.branches) {
            path(br.pts, br.n);
            ctx.stroke();
          }
        }
      }
      const after = Math.max(0, 1 - Math.max(0, age - dur * 0.3) / 1.2) * (age < dur * 0.3 ? age / (dur * 0.3) : 1);
      if (after > 0.01) {
        ctx.globalAlpha = Math.min(1, after * base * 0.9);
        blit(ctx, this.glow, b.x1, b.y1, D * 0.9);
        ctx.globalAlpha = 1;
      }
    }
    reset(ctx);
  }

  override light(): { boost?: number } | null {
    let best = 0;
    const dur = this.spec.duration ?? 0.5;
    for (const b of this.bolts) {
      const age = this.prevClock - b.born;
      if (age >= 0 && age < dur) best = Math.max(best, 1 - age / dur);
    }
    return best > 0 ? { boost: best * 0.5 } : null;
  }
}

// ---------------------------------------------------------------------------

export class ConstellationLayer extends Layer<ConstSpec> {
  private star: Tex;
  private mote: Tex;
  private drawStart = 0;
  private lastIndex = -999;

  constructor(spec: ConstSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = inst.colStatic(spec.color);
    this.star = glintTex(mix(c, '#ffffff', 0.4));
    this.mote = spriteTex('mote', c);
  }

  override update(env: FrameEnv): void {
    if (this.spec.redraw && this.inst.accent.fired && this.inst.accent.index !== this.lastIndex) {
      this.lastIndex = this.inst.accent.index;
      this.drawStart = env.clock;
    }
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const R = s.radius * D * (s.role === 'hero' ? this.introScale() : 1);
    const spin = (s.spin ?? 0) * DEG * env.clock * this.inst.motion;
    const plane = s.plane ?? 'screen';
    const place = () => {
      if (plane === 'ground') xPlane(env, this.inst, ax, ay + this.inst.groundY, spin, this.inst.groundSquash);
      else if (plane === 'orbit') xPlane(env, this.inst, ax, ay, spin, s.tilt ?? 0.4, (s.roll ?? 0) * DEG);
      else xScreen(env, this.inst, ax, ay, spin);
    };
    // Draw-on progress: intro, then again after each accent (if redraw).
    let prog = this.introK();
    if (s.redraw && this.drawStart > 0) prog = Math.min(prog, clamp01((env.clock - this.drawStart) / 1.6));
    const col = this.inst.col(s.color, env.clock);
    ctx.globalCompositeOperation = 'lighter';
    place();
    ctx.lineCap = 'round';
    const total = s.lines.length;
    for (const [lw, al, c] of [[s.lineWidth * D * 5, 0.07, col], [s.lineWidth * D * 2.2, 0.22, col], [s.lineWidth * D, 0.85, mix(col, '#ffffff', 0.5)]] as [number, number, string][]) {
      ctx.strokeStyle = rgba(c, Math.min(1, al * a));
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let i = 0; i < total; i++) {
        const lp = clamp01(prog * total - i);
        if (lp <= 0) break;
        const [i0, i1] = s.lines[i];
        const p0 = s.stars[i0];
        const p1 = s.stars[i1];
        ctx.moveTo(p0[0] * R, p0[1] * R);
        ctx.lineTo((p0[0] + (p1[0] - p0[0]) * lp) * R, (p0[1] + (p1[1] - p0[1]) * lp) * R);
      }
      ctx.stroke();
    }
    // Stars: soft mote plus a slowly twinkling glint (max ~1 Hz).
    for (let i = 0; i < s.stars.length; i++) {
      const [x, y] = s.stars[i];
      const tw = 0.7 + 0.3 * Math.sin(env.clock * 1.1 + i * 2.3);
      const sz = s.starSize * D * (i % 3 === 0 ? 1.3 : 1);
      ctx.globalAlpha = Math.min(1, a);
      blit(ctx, this.mote, x * R, y * R, sz * 1.6);
      ctx.globalAlpha = Math.min(1, a * tw);
      blit(ctx, this.star, x * R, y * R, sz * 3.2);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class ShockwaveLayer extends Layer<ShockSpec> {
  private tex: Tex;
  private waves: number[] = [];

  constructor(spec: ShockSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    // Ring sharpness from the band width at the final radius (quantised for the cache).
    const sharp = Math.min(48, Math.max(12, Math.round((2 * spec.radius) / spec.width / 4) * 4));
    // Thin rings need texels at screen resolution (cheap: the ring is a radial gradient).
    this.tex = ringTex(inst.colStatic(spec.color), sharp, inst.texPx((2 * spec.radius) / 0.85, 256, sharp > 24 ? 1536 : 512));
  }

  protected override defaultSlot(): Slot {
    return (this.spec.plane ?? 'ground') === 'ground' ? 'ground' : 'screenFront';
  }

  /** Starts a wave now (used by heroes too). */
  fire(clock: number): void {
    const n = this.spec.waves ?? 1;
    for (let i = 0; i < n; i++) this.waves.push(clock + i * 0.16);
  }

  override update(env: FrameEnv): void {
    if (this.inst.accent.fired && !(this.inst.reduced && this.spec.plane === 'screen')) this.fire(env.clock);
    this.waves = this.waves.filter((t0) => env.clock - t0 < this.spec.duration);
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot || !this.waves.length) return;
    const s = this.spec;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const base = (s.alpha ?? 1) * this.inst.alpha;
    ctx.globalCompositeOperation = 'lighter';
    for (const t0 of this.waves) {
      const age = env.clock - t0;
      if (age < 0) continue;
      const k = clamp01(age / s.duration);
      const e = easeOut(k);
      const r = (s.inward ? s.radius * (1 - e) + 0.3 * e : 0.3 + (s.radius - 0.3) * e) * D;
      const half = r / 0.85;
      ctx.globalAlpha = Math.min(1, base * smooth(k / 0.06) * Math.pow(1 - k, 1.3));
      if ((s.plane ?? 'ground') === 'ground') xPlane(env, this.inst, ax, ay + this.inst.groundY, 0, this.inst.groundSquash);
      else xScreen(env, this.inst, ax, ay, 0);
      ctx.drawImage(this.tex, -half, -half, half * 2, half * 2);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class FlareLayer extends Layer<FlareSpec> {
  private glint: Tex;
  private glow: Tex;

  constructor(spec: FlareSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const c = inst.colStatic(spec.color);
    this.glint = glintTex(mix(c, '#ffffff', 0.35));
    this.glow = glowTex(c, 'core');
  }

  protected override defaultSlot(): Slot {
    return 'particles';
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const acc = this.inst.reduced ? 0 : this.inst.accent.env;
    const tw = s.twinkle ? 0.75 + 0.25 * Math.sin(env.clock * Math.min(3, s.twinkle) * TAU) : 1;
    const vis = ((s.base ?? 0) * tw + acc) * (s.alpha ?? 1) * smooth(this.introK()) * this.inst.alpha;
    if (vis <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const size = s.size * D * (0.85 + 0.3 * acc);
    const rot = ((s.rot ?? 0) + (s.spin ?? 0) * env.clock * this.inst.motion) * DEG;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, vis * 0.7);
    xform(env, this.inst, ax, ay);
    blit(ctx, this.glow, 0, 0, size * 0.9);
    ctx.globalAlpha = Math.min(1, vis);
    xScreen(env, this.inst, ax, ay, rot);
    blit(ctx, this.glint, 0, 0, size * 1.6);
    if (s.streak) {
      ctx.globalAlpha = Math.min(1, vis * 0.6);
      xform(env, this.inst, ax, ay, s.streak, 0, 0, 0.12);
      blit(ctx, this.glow, 0, 0, size * 1.4);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export class NebulaLayer extends Layer<NebulaSpec> {
  private tex: Tex;
  private tex2: Tex;

  constructor(spec: NebulaSpec, inst: AuraInstance, index: number) {
    super(spec, inst, index);
    const cols = spec.colors.map((c) => inst.colStatic(c));
    const seed = spec.seed ?? (inst.seed % 500) + index;
    this.tex = nebulaTex(cols, seed);
    // The second, counter-moving layer is drawn fainter and smaller: a lower resolution suffices.
    this.tex2 = nebulaTex([...cols].reverse(), seed + 7, 160);
  }

  protected override defaultSlot(): Slot {
    return 'smokeBack';
  }

  draw(slot: Slot, env: FrameEnv): void {
    if (slot !== this.slot) return;
    const s = this.spec;
    const a = this.alpha();
    if (a <= 0.003) return;
    const ctx = env.ctx;
    const [ax, ay] = anchor(s);
    const k = s.role === 'hero' ? this.introScale() : 1;
    const R = s.radius * D * k;
    const t = env.clock * this.inst.motion;
    const sq = s.squash ?? 1;
    setBlend(ctx, s.blend);
    ctx.globalAlpha = Math.min(1, a);
    xScreen(env, this.inst, ax, ay, t * s.spin * DEG, 1, sq);
    ctx.drawImage(this.tex, -R, -R, R * 2, R * 2);
    if (env.q > 0.4) {
      ctx.globalAlpha = Math.min(1, a * 0.7);
      xScreen(env, this.inst, ax, ay, -t * s.spin * 0.7 * DEG + 2, 0.86, 0.86 * sq);
      ctx.drawImage(this.tex2, -R, -R, R * 2, R * 2);
    }
    reset(ctx);
  }
}

// ---------------------------------------------------------------------------

export const createLayer: LayerFactory = (spec, inst, index) => {
  switch (spec.type) {
    case 'glow':
      return new GlowLayer(spec, inst, index);
    case 'smoke':
      return new SmokeLayer(spec, inst, index);
    case 'sigil':
      return new SigilLayer(spec, inst, index);
    case 'ripple':
      return new RippleLayer(spec, inst, index);
    case 'vortex':
      return new VortexLayer(spec, inst, index);
    case 'band':
      return new BandLayer(spec, inst, index);
    case 'pillar':
      return new PillarLayer(spec, inst, index);
    case 'beam':
      return new BeamLayer(spec, inst, index);
    case 'rays':
      return new RaysLayer(spec, inst, index);
    case 'orbiters':
      return new OrbiterLayer(spec, inst, index);
    case 'particles':
      return new ParticleLayer(spec, inst, index);
    case 'lightning':
      return new LightningLayer(spec, inst, index);
    case 'constellation':
      return new ConstellationLayer(spec, inst, index);
    case 'shockwave':
      return new ShockwaveLayer(spec, inst, index);
    case 'flare':
      return new FlareLayer(spec, inst, index);
    case 'nebula':
      return new NebulaLayer(spec, inst, index);
    case 'hero':
      return createHero(spec, inst, index);
  }
};
