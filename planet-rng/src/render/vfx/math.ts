// Small math helpers for the aura VFX: easing, seeded random, 2D value noise.

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smooth = (x: number): number => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};
export const easeOut = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number): number => Math.pow(clamp01(x), 2);
export const easeInOut = (x: number): number => {
  const k = clamp01(x);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
/** Overshoot ease: 0 -> ~1.05 -> 1. */
export const easeOutBack = (x: number, s = 1.4): number => {
  const k = clamp01(x) - 1;
  return 1 + (s + 1) * k * k * k + s * k * k;
};

/** Maps x from window [a, b] to 0..1 (clamped). */
export const win = (x: number, a: number, b: number): number => (b <= a ? (x >= b ? 1 : 0) : clamp01((x - a) / (b - a)));

/** Bell curve 0 -> 1 -> 0 over 0..1 with a fast attack. */
export const envelope = (x: number, attack = 0.15): number => {
  if (x <= 0 || x >= 1) return 0;
  return x < attack ? easeOut(x / attack) : Math.pow(1 - (x - attack) / (1 - attack), 1.6);
};

export function hash(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small fast seeded PRNG (mulberry32). */
export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number): number {
    return a + (b - a) * this.next();
  }
  pick<T>(list: T[]): T {
    return list[Math.floor(this.next() * list.length) % list.length];
  }
  sign(): number {
    return this.next() < 0.5 ? -1 : 1;
  }
}

/** Smooth 1D noise in [-1, 1]. */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i * 374761393 + seed * 668265263) * 2 - 1;
  const b = hash((i + 1) * 374761393 + seed * 668265263) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/** Tileable 2D value noise in [0, 1] with period (px, py). */
export function noise2(x: number, y: number, px: number, py: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const h = (i: number, j: number) => {
    const ii = ((i % px) + px) % px;
    const jj = ((j % py) + py) % py;
    return hash(ii * 73856093 + jj * 19349663 + seed * 83492791);
  };
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Tileable fractal noise in [0, 1]. Coordinates in 0..1 (one tile). */
export function fbm(u: number, v: number, octaves: number, base: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = base;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise2(u * f, v * f, f, f, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** Deterministic event schedule on a continuous clock: event k happens at start(k). */
export interface Schedule {
  index: number;
  /** Seconds since the current (most recent) event started, may be large. */
  since: number;
  /** True when an event started between the previous and this clock value. */
  fired: boolean;
}

export function schedule(clock: number, prevClock: number, every: [number, number], seed: number): Schedule {
  const period = (every[0] + every[1]) / 2;
  const jitter = (every[1] - every[0]) / 2;
  const start = (k: number) => k * period + (hash(k * 7919 + seed) * 2 - 1) * jitter;
  let k = Math.floor(clock / period) + 1;
  while (start(k) > clock) k--;
  const s = start(k);
  return { index: k, since: clock - s, fired: s > prevClock && s <= clock };
}
