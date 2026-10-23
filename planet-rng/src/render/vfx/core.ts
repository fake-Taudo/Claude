// Core of the aura VFX engine: frame environment, plane transforms, layer base class and
// the aura instance (intro, idle, accent schedule, fade out, avatar light).

import type { AuraDef } from '../../config';
import { VFX, VTIERS } from '../../config/vfx/tiers';
import type { AuraVfxSpec, Col, LayerSpec, Quality, Slot, VTier } from '../../config/vfx/types';
import { mix, spectral } from '../color';
import { glowTex, ringTex } from './tex';
import { REF_R, type View } from '../view';
import { clamp01, easeOutBack, envelope, hashString, Rng, schedule, scheduleStart, smooth, TAU, win } from './math';

/** Reference pixels per D (avatar diameter). */
export const D = REF_R * 2;

export interface StageBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Per-frame environment shared by all layers. Lengths in reference pixels. */
export interface FrameEnv {
  ctx: CanvasRenderingContext2D;
  view: View;
  /** Continuous clock in seconds (wall based, never resets). */
  clock: number;
  dt: number;
  /** Particle / layer share of the current VFX quality (0.3, 0.6, 1). */
  q: number;
  quality: Quality;
  reduced: boolean;
  /** Visible stage in reference pixels relative to the planet centre. */
  stage: StageBox;
}

export interface Shadow {
  x: number;
  y: number;
  r: number;
  a: number;
}

export interface AvatarLight {
  rim: string;
  rimAlpha: number;
  /** Radians, direction toward the light source. */
  angle: number;
  tint: string;
  tintAlpha: number;
  flash: number;
  shadows: Shadow[];
}

export interface AccentState {
  /** 0..1 envelope of the current accent. */
  env: number;
  /** Seconds since the current accent started. */
  since: number;
  /** True in the frame the accent fired. */
  fired: boolean;
  index: number;
}

const QRANK: Record<Quality, number> = { low: 0, medium: 1, high: 2 };

/** Default intro windows per layer type (fractions of the intro duration). */
const INTRO_DEFAULT: Record<string, [number, number]> = {
  smoke: [0, 0.5],
  sigil: [0, 0.6],
  ripple: [0, 0.4],
  vortex: [0.05, 0.6],
  pillar: [0.12, 0.5],
  beam: [0.2, 0.7],
  rays: [0.25, 0.75],
  band: [0.3, 0.8],
  orbiters: [0.3, 0.85],
  hero: [0.2, 0.85],
  glow: [0.1, 0.6],
  nebula: [0.1, 0.7],
  particles: [0.35, 1],
  constellation: [0.3, 1],
  lightning: [0.6, 1],
  shockwave: [0, 0.1],
  flare: [0.5, 1],
};

/**
 * Base class of all layers. Subclasses draw in one or more slots; the renderer calls
 * draw() for every slot and the layer decides what belongs there.
 */
export abstract class Layer<S extends LayerSpec = LayerSpec> {
  enabled = true;
  readonly name: string;

  constructor(
    readonly spec: S,
    readonly inst: AuraInstance,
    readonly index: number,
  ) {
    this.name = spec.name ?? `${spec.type} ${index + 1}`;
  }

  /** Slot the layer draws into by default. */
  get slot(): Slot {
    return this.spec.depth ?? this.defaultSlot();
  }

  protected defaultSlot(): Slot {
    return 'heroBack';
  }

  visible(env: FrameEnv): boolean {
    if (!this.enabled) return false;
    const mq = this.spec.minQuality;
    return !mq || QRANK[env.quality] >= QRANK[mq];
  }

  /** Intro progress of this layer (0..1, linear). */
  introK(): number {
    const [a, b] = this.spec.intro ?? INTRO_DEFAULT[this.spec.type] ?? [0, 1];
    return win(this.inst.introT, a, b);
  }

  /** Combined alpha: spec alpha * intro fade * instance fade * accent boost. */
  alpha(extraGain = 0): number {
    const base = this.spec.alpha ?? 1;
    const gain = (this.spec.accentGain ?? 0) + extraGain;
    const accent = 1 + gain * this.inst.accent.env * (this.inst.reduced ? 0.4 : 1);
    return base * smooth(this.introK()) * this.inst.alpha * accent;
  }

  /** Hero style scale-in with overshoot (0.6 -> 1.05 -> 1). */
  introScale(): number {
    const k = this.introK();
    return k >= 1 ? 1 : 0.6 + 0.4 * easeOutBack(k);
  }

  update(_env: FrameEnv): void {}

  abstract draw(slot: Slot, env: FrameEnv): void;

  /** Number of live particles (stats). */
  particles(): number {
    return 0;
  }

  /** Contribute shadows on the avatar. */
  shadows(_out: Shadow[]): void {}

  /** Optional override of the light direction (radians) and rim boost. */
  light(): { angle?: number; boost?: number } | null {
    return null;
  }

  dispose(): void {}
}

export type LayerFactory = (spec: LayerSpec, inst: AuraInstance, index: number) => Layer;

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

/**
 * Sets a transform that maps local reference coordinates through the 2x2 matrix
 * [a c; b d], offset (ox, oy) relative to the planet, the instance scale and the view.
 */
export function xform(env: FrameEnv, inst: AuraInstance, ox: number, oy: number, a = 1, b = 0, c = 0, d = 1): void {
  const S = env.view.s * inst.scale;
  env.ctx.setTransform(S * a, S * b, S * c, S * d, env.view.tx + S * ox, env.view.ty + S * oy);
}

/** Screen plane: rotation (rad) and uniform scale. */
export function xScreen(env: FrameEnv, inst: AuraInstance, ox: number, oy: number, rot: number, k = 1, ky = k): void {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  xform(env, inst, ox, oy, k * c, ky * s, -k * s, ky * c);
}

/** Orbit / ground plane: in-plane rotation, squash, roll (rad). */
export function xPlane(env: FrameEnv, inst: AuraInstance, ox: number, oy: number, spin: number, squash: number, roll = 0, k = 1): void {
  const ct = Math.cos(spin);
  const st = Math.sin(spin);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const a = cr * ct - sr * squash * st;
  const b = sr * ct + cr * squash * st;
  const c = -cr * st - sr * squash * ct;
  const d = -sr * st + cr * squash * ct;
  xform(env, inst, ox, oy, a * k, b * k, c * k, d * k);
}

/** Projects a point on a tilted circle (angle phi, radius r) to local 2D + depth (sin phi > 0 = front). */
export function projectOrbit(r: number, phi: number, squash: number, roll: number, out: { x: number; y: number; z: number }): void {
  const x0 = Math.cos(phi) * r;
  const y0 = Math.sin(phi) * r * squash;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  out.x = x0 * cr - y0 * sr;
  out.y = x0 * sr + y0 * cr;
  out.z = Math.sin(phi);
}

/** Clips to the back (far, upper) or front half of a rolled plane through (ox, oy). */
export function clipHalf(env: FrameEnv, inst: AuraInstance, ox: number, oy: number, roll: number, half: 'back' | 'front'): void {
  const ctx = env.ctx;
  xScreen(env, inst, ox, oy, roll);
  const L = 1e4;
  ctx.beginPath();
  if (half === 'back') ctx.rect(-L, -L, 2 * L, L);
  else ctx.rect(-L, 0, 2 * L, L);
  ctx.clip();
}

/** Draws an image centred at (x, y) with size (w, h) in the current transform. */
export function blit(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h = w): void {
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

// ---------------------------------------------------------------------------
// Aura instance
// ---------------------------------------------------------------------------

const PALETTE_KEYS = ['hue', 'accent', 'core', 'smoke'] as const;

function resolvePaletteValue(v: string, aura: AuraDef): string {
  if (v.startsWith('#')) return v;
  const c = aura.colors;
  if (v === 'main') return c.main;
  if (v === 'glow') return c.glow;
  if (v === 'accent') return c.accent ?? c.glow;
  const m = /^p(\d)$/.exec(v);
  if (m && c.palette) return c.palette[Number(m[1]) % c.palette.length];
  return c.glow;
}

export interface InstanceOptions {
  quality: () => Quality;
  reduced: () => boolean;
  /** Skip the intro (preview, restored state). */
  skipIntro?: boolean;
  /** VFX tier override (lab). */
  tier?: VTier;
  /** Build no layers in the constructor (texture pre-baking creates them one by one). */
  lazy?: boolean;
}

export class AuraInstance {
  readonly palette: Record<(typeof PALETTE_KEYS)[number], string>;
  readonly tier: VTier;
  readonly seed: number;
  readonly rng: Rng;
  layers: Layer[] = [];
  /** Seconds since creation (for intro). */
  age = 0;
  introDur: number;
  /** 0..1+ over the intro. */
  introT = 0;
  alpha = 1;
  scale = 1;
  dying = false;
  private dieT = 0;
  accent: AccentState = { env: 0, since: 1e9, fired: false, index: 0 };
  private prevClock = -1;
  reducedNow = false;

  constructor(
    readonly aura: AuraDef,
    readonly spec: AuraVfxSpec,
    factory: LayerFactory,
    readonly opts: InstanceOptions,
  ) {
    const p = spec.palette;
    this.palette = {
      hue: resolvePaletteValue(p.hue, aura),
      accent: resolvePaletteValue(p.accent, aura),
      core: resolvePaletteValue(p.core, aura),
      smoke: resolvePaletteValue(p.smoke, aura),
    };
    this.tier = opts.tier ?? spec.tier;
    this.seed = hashString(spec.id);
    this.rng = new Rng(this.seed);
    this.introDur = spec.intro?.duration ?? VTIERS[this.tier].introSec;
    if (opts.skipIntro) {
      this.age = this.introDur;
      this.introT = 1;
    }
    if (!opts.lazy) this.layers = spec.layers.map((l, i) => factory(l, this, i));
  }

  get reduced(): boolean {
    return this.reducedNow;
  }

  /** Overall size multiplier from the spec size override. */
  get sizeScale(): number {
    return (this.spec.size ?? VTIERS[this.spec.tier].extent) / VTIERS[this.spec.tier].extent;
  }

  /** Resolves a colour reference to hex. 'spectrum' cycles with the clock. */
  col(c: Col, clock = 0, offset = 0): string {
    if (c === 'hue' || c === 'accent' || c === 'core' || c === 'smoke') return this.palette[c];
    if (c === 'spectrum') return spectral(clock * 40 + offset);
    if (c.startsWith('#')) return c;
    return resolvePaletteValue(c, this.aura);
  }

  /** Static resolution (for baked textures): 'spectrum' becomes white. */
  colStatic(c: Col): string {
    return c === 'spectrum' ? '#ffffff' : this.col(c);
  }

  /** Ground plane in reference pixels. */
  get groundY(): number {
    return (this.spec.ground?.y ?? VFX.groundY) * D;
  }

  get groundSquash(): number {
    return this.spec.ground?.squash ?? VFX.groundSquash;
  }

  /** Motion multiplier (reduced effects slow everything down). */
  get motion(): number {
    return this.reducedNow ? VFX.reducedMotion : 1;
  }

  /** Breathing value -1..1 at the spec frequency. */
  breathe(clock: number, phase = 0): number {
    return Math.sin((clock * this.spec.motion.breatheHz + phase) * TAU);
  }

  kill(): void {
    if (!this.dying) {
      this.dying = true;
      this.dieT = 0;
    }
  }

  get dead(): boolean {
    return this.dying && this.alpha <= 0;
  }

  replayIntro(): void {
    this.age = 0;
    this.introT = 0;
  }

  update(env: FrameEnv): void {
    this.reducedNow = env.reduced;
    this.age += env.dt;
    this.introT = this.age / Math.max(0.05, this.introDur);
    if (this.dying) {
      this.dieT += env.dt;
      const k = clamp01(this.dieT / VFX.outroSec);
      this.alpha = 1 - k;
      this.scale = this.sizeScale * (1 - (1 - VFX.outroScale) * k);
    } else {
      this.alpha = 1;
      this.scale = this.sizeScale;
    }
    const acc = this.spec.motion.accent;
    if (acc.every && this.introT >= 1) {
      const prev = this.prevClock < 0 ? env.clock : this.prevClock;
      const s = schedule(env.clock, prev, acc.every, this.seed);
      const dur = acc.duration ?? 1.6;
      let { since, fired, index } = s;
      if (this.forcedAccentAt >= 0) {
        const fs = env.clock - this.forcedAccentAt;
        if (fs >= 0 && fs < since) {
          since = fs;
          fired = this.forcedPending;
          index = -1;
          this.forcedPending = false;
        }
        if (fs > dur) this.forcedAccentAt = -1;
      }
      this.accent.index = index;
      this.accent.since = since;
      this.accent.fired = fired;
      this.accent.env = envelope(since / dur);
    } else {
      this.accent.env = 0;
      this.accent.fired = false;
      this.accent.since = 1e9;
    }
    this.prevClock = env.clock;
    for (const l of this.layers) l.update(env);
  }

  /** Seconds until the next scheduled accent (Infinity without accents). */
  timeToNextAccent(clock: number): number {
    const every = this.spec.motion.accent.every;
    if (!every) return Infinity;
    if (this.forcedAccentAt >= 0 && this.forcedAccentAt > clock) return this.forcedAccentAt - clock;
    const s = schedule(clock, clock, every, this.seed);
    return scheduleStart(s.index + 1, every, this.seed) - clock;
  }

  /** Forces an accent at the given clock (lab). */
  triggerAccent(clock: number): void {
    this.forcedAccentAt = clock;
    this.forcedPending = true;
  }

  private forcedAccentAt = -1;
  private forcedPending = false;

  draw(slot: Slot, env: FrameEnv): void {
    if (this.alpha <= 0) return;
    if (slot === 'ground') this.drawIntroWave(env);
    for (const l of this.layers) if (l.visible(env)) l.draw(slot, env);
    if (slot === 'screenFront') this.drawIntroFlash(env);
  }

  /** Intro: a ring of light runs outward over the ground plane (V1 and up). */
  private drawIntroWave(env: FrameEnv): void {
    if (this.tier < 1 || this.introT >= 0.7 || this.spec.intro?.shockwave === false) return;
    const k = this.introT / 0.7;
    const ctx = env.ctx;
    const r = (0.4 + (VTIERS[this.tier].extent * 0.55 - 0.4) * (1 - Math.pow(1 - k, 3))) * D;
    const half = r / 0.85;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, (1 - k) * 0.9 * this.alpha);
    xPlane(env, this, 0, this.groundY, 0, this.groundSquash);
    ctx.drawImage(ringTex(this.palette.hue, 18), -half, -half, half * 2, half * 2);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Intro: a soft white flash at the end of the build-up (V5 and up, not reduced). */
  private drawIntroFlash(env: FrameEnv): void {
    const strength = this.spec.intro?.flash ?? (this.tier >= 5 ? 0.35 : 0);
    if (strength <= 0 || this.reducedNow || this.introT > 1.1 || this.introT < 0.6) return;
    const k = (this.introT - 0.6) / 0.5;
    const a = strength * (k < 0.3 ? k / 0.3 : Math.pow(1 - (k - 0.3) / 0.7, 2)) * this.alpha;
    if (a <= 0.005) return;
    const ctx = env.ctx;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, a);
    const size = VTIERS[this.tier].extent * D * 2.4;
    xform(env, this, 0, 0);
    ctx.drawImage(glowTex(mix(this.palette.hue, '#ffffff', 0.6), 'core'), -size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  particleCount(): number {
    let n = 0;
    for (const l of this.layers) n += l.particles();
    return n;
  }

  light(): AvatarLight {
    const ls = this.spec.light ?? {};
    const rim = this.col(ls.rim ?? 'hue');
    let angle = ((ls.angle ?? -90) * Math.PI) / 180;
    let boost = 0;
    for (const l of this.layers) {
      const o = l.enabled ? l.light() : null;
      if (o?.angle !== undefined) angle = o.angle;
      if (o?.boost) boost = Math.max(boost, o.boost);
    }
    const shadows: Shadow[] = [];
    for (const l of this.layers) if (l.enabled) l.shadows(shadows);
    const introK = smooth(this.introT);
    const flash = (this.spec.motion.accent.flash ?? 0) * this.accent.env * (this.reducedNow ? 0.3 : 1);
    return {
      rim,
      rimAlpha: ((ls.rimAlpha ?? 0.25 + this.tier * 0.07) + boost) * introK * this.alpha,
      angle,
      tint: this.col(ls.tint ?? 'hue'),
      tintAlpha: (ls.tintAlpha ?? 0.04 + this.tier * 0.018) * introK * this.alpha,
      flash: flash * this.alpha,
      shadows,
    };
  }

  dispose(): void {
    for (const l of this.layers) l.dispose();
  }
}

/** Mixes two lights (crossfade). */
export function mixLight(a: AvatarLight, b: AvatarLight, t: number): AvatarLight {
  return {
    rim: mix(a.rim, b.rim, t),
    rimAlpha: a.rimAlpha + (b.rimAlpha - a.rimAlpha) * t,
    angle: a.angle + (b.angle - a.angle) * t,
    tint: mix(a.tint, b.tint, t),
    tintAlpha: a.tintAlpha + (b.tintAlpha - a.tintAlpha) * t,
    flash: Math.max(a.flash, b.flash),
    shadows: t < 0.5 ? a.shadows : b.shadows,
  };
}
