// Shared pieces of the cutscene renderer: easing, keyframe curves, colours, the frame
// environment handed to every block, and the block interface.

import { GAME } from '../../config';
import type { BlockParams, Color, Cue, Curve, CutsceneDef, Ease, Spin, Theme, Track } from '../../config/cutscenes';
import { mix, spectral } from '../color';
import { clamp01 } from '../vfx/math';

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const EASE: Record<Ease, (x: number) => number> = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outBack: (x) => {
    const s = 1.70158;
    const k = x - 1;
    return 1 + (s + 1) * k * k * k + s * k * k;
  },
};

export function ease(e: Ease | undefined, x: number): number {
  return e ? EASE[e](clamp01(x)) : clamp01(x);
}

/** Value of a keyframed curve at local time t (seconds). */
export function curve(c: Curve | undefined, t: number, fallback = 0): number {
  if (c === undefined) return fallback;
  if (typeof c === 'number') return c;
  if (c.length === 0) return fallback;
  if (t <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) {
    const k = c[i];
    if (t <= k[0]) {
      const a = c[i - 1];
      const span = k[0] - a[0];
      const x = span <= 0 ? 1 : (t - a[0]) / span;
      return a[1] + (k[1] - a[1]) * ease(k[2] as Ease | undefined, x);
    }
  }
  return c[c.length - 1][1];
}

/** Integral of a keyframed curve from 0 to t (the particle clock). */
export function integral(c: Curve | undefined, t: number, fallback = 1): number {
  if (c === undefined || typeof c === 'number') return (c ?? fallback) * t;
  if (t <= 0) return 0;
  let sum = 0;
  // Before the first key the first value holds.
  const first = c[0];
  if (t <= first[0]) return first[1] * t;
  sum += first[1] * Math.max(0, first[0]);
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1];
    const b = c[i];
    const t1 = Math.min(t, b[0]);
    if (t1 <= a[0]) break;
    if (!b[2] || b[2] === 'linear') {
      const v1 = a[1] + ((b[1] - a[1]) * (t1 - a[0])) / Math.max(1e-6, b[0] - a[0]);
      sum += ((a[1] + v1) / 2) * (t1 - a[0]);
    } else {
      // Eased segment: Simpson's rule.
      const n = 8;
      const h = (t1 - a[0]) / n;
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const x = a[0] + k * h;
        const v = a[1] + (b[1] - a[1]) * ease(b[2], (x - a[0]) / Math.max(1e-6, b[0] - a[0]));
        s += v * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2);
      }
      sum += (s * h) / 3;
    }
    if (t <= b[0]) return sum;
  }
  const last = c[c.length - 1];
  return sum + last[1] * (t - last[0]);
}

/**
 * Total rotation in degrees after `t` seconds of an accelerating spin: the speed goes from
 * `from` to `to` over `over` seconds (shape `curve`), then stays at `to`.
 */
export function spinAngle(s: Spin, t: number): number {
  const over = Math.max(1e-6, s.over);
  const p = s.curve ?? 1;
  const tau = Math.min(1, Math.max(0, t / over));
  const a = over * (s.from * tau + ((s.to - s.from) * Math.pow(tau, p + 1)) / (p + 1));
  return t > over ? a + s.to * (t - over) : a;
}

/** Rotation of the prototype's Kreis-Stern after fraction tau of the grow phase. */
export function cutsceneAngle(tau: number): number {
  const c = GAME.cutscene;
  const over = c.growMs / 1000;
  return spinAngle({ from: c.rotStartDegPerSec, to: c.rotEndDegPerSec, over, curve: c.rotCurve }, tau * over);
}

/** Resolves a colour reference against the theme. 'spectrum' cycles with time. */
export function color(theme: Theme, c: Color | undefined, time = 0, offset = 0): string {
  switch (c) {
    case undefined:
    case 'primary':
      return theme.primary;
    case 'secondary':
      return theme.secondary;
    case 'fog':
      return theme.fog;
    case 'dark':
      return theme.dark;
    case 'white':
      return '#ffffff';
    case 'black':
      return '#000000';
    case 'spectrum':
      return spectral(time * 90 + offset);
    default:
      return c;
  }
}

/** Light tint of a colour for hot centres. */
export const hot = (c: string, k = 0.6): string => mix(c, '#ffffff', k);

export type Quality = 'low' | 'medium' | 'high';

/** Everything a block needs to draw one frame. Sizes in device pixels. */
export interface Env {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  cx: number;
  cy: number;
  /** 1 u = 1 % of the short side in device pixels. */
  u: number;
  /** Half diagonal. */
  diag: number;
  /** Cutscene time in seconds. */
  time: number;
  /** Seconds since the start of the current track. */
  local: number;
  /** Track duration. */
  dur: number;
  /** Track alpha envelope (fade in/out). */
  alpha: number;
  theme: Theme;
  def: CutsceneDef;
  quality: Quality;
  /** Particle multiplier for the quality. */
  q: number;
  reduceFlashes: boolean;
  reduceMotion: boolean;
  /** Camera (shake, zoom, roll, flip) applied to world-space blocks. */
  cam: { x: number; y: number; zoom: number; roll: number; flip: number };
  /** Copies the current frame into an offscreen canvas (frame snapshot). */
  grab(into?: HTMLCanvasElement): HTMLCanvasElement;
  /** Per-frame statistics (lab). */
  stats: { particles: number; flashes: number };
  /** Random variant seed of this play (texts pick from variants with it). */
  seed: number;
}

/** A building block of the timeline. */
export interface Block<B extends keyof BlockParams, S = unknown> {
  /** 'world' blocks follow the camera, 'screen' blocks (veils, text, bars) do not. */
  space: 'world' | 'screen';
  /** 'once': the frame below is grabbed when the track starts; 'live': every frame. */
  snapshot?: 'once' | 'live' | ((params: BlockParams[B]) => 'once' | 'live');
  /** For 'live' snapshots: whether the grab is needed this frame (skips the copy otherwise). */
  liveIf?(env: Env): boolean;
  /** Per-track state created when the cutscene starts (baking, geometry). */
  init?(params: BlockParams[B], track: Track & { block: B }, env: Env): S;
  draw(ctx: CanvasRenderingContext2D, p: number, params: BlockParams[B], theme: Theme, env: Env, state: S, snap: HTMLCanvasElement | null): void;
  /** Sounds this track produces (absolute times). */
  cues?(params: BlockParams[B], track: Track & { block: B }, def: CutsceneDef): Cue[];
}

export type AnyBlock = Block<keyof BlockParams, unknown>;

/**
 * Event times (local seconds) of a rate that ramps linearly from r0 to r1 events/s over dur:
 * the k-th event happens when the integrated rate reaches k.
 */
export function rampTimes(r0: number, r1: number, dur: number, max = 400): number[] {
  const out: number[] = [];
  const a = (r1 - r0) / (2 * Math.max(1e-6, dur));
  const b = r0;
  for (let k = 0; k < max; k++) {
    let t: number;
    if (Math.abs(a) < 1e-9) t = b > 0 ? k / b : Infinity;
    else {
      const disc = b * b + 4 * a * k;
      if (disc < 0) break;
      t = (-b + Math.sqrt(disc)) / (2 * a);
    }
    if (!(t < dur)) break;
    out.push(t);
  }
  return out;
}
