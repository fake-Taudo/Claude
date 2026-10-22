// Color helpers with caching (hot paths call these every frame).

export type RGB = [number, number, number];

const rgbCache = new Map<string, RGB>();

export function parseColor(hex: string): RGB {
  let c = rgbCache.get(hex);
  if (c) return c;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h, 16);
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  rgbCache.set(hex, c);
  return c;
}

export function toHex([r, g, b]: RGB): string {
  const f = (x: number) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

const rgbaCache = new Map<string, string>();

export function rgba(hex: string, a: number): string {
  const q = Math.round(Math.max(0, Math.min(1, a)) * 100);
  const key = `${hex}|${q}`;
  let s = rgbaCache.get(key);
  if (!s) {
    const [r, g, b] = parseColor(hex);
    s = `rgba(${r},${g},${b},${q / 100})`;
    rgbaCache.set(key, s);
  }
  return s;
}

export function mix(a: string, b: string, t: number): string {
  const ca = parseColor(a);
  const cb = parseColor(b);
  return toHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

export function luminance(hex: string): number {
  const [r, g, b] = parseColor(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Lifts very dark colors so they stay visible as glowing particles on a dark background. */
export function visible(hex: string, fallback: string): string {
  return luminance(hex) < 0.12 ? fallback : hex;
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const hueCache = new Map<string, string>();

/** Rotates the hue of a color; quantised to 10° steps so results can be cached. */
export function hueShift(hex: string, deg: number): string {
  const q = Math.round((((deg % 360) + 360) % 360) / 10) * 10;
  if (q === 0 || q === 360) return hex;
  const key = `${hex}|${q}`;
  let out = hueCache.get(key);
  if (!out) {
    const [h, s, l] = rgbToHsl(parseColor(hex));
    // Greys have no hue: give them a gentle saturation so a hue cycle is visible.
    out = toHex(hslToRgb(h + q, Math.max(s, 0.65), Math.min(Math.max(l, 0.45), 0.75)));
    hueCache.set(key, out);
  }
  return out;
}

/** Bright spectral color for a hue in degrees (quantised for caching). */
export function spectral(deg: number): string {
  const q = Math.round((((deg % 360) + 360) % 360) / 15) * 15;
  const key = `spec|${q}`;
  let out = hueCache.get(key);
  if (!out) {
    out = toHex(hslToRgb(q, 1, 0.66));
    hueCache.set(key, out);
  }
  return out;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Deterministic pseudo random in [0,1) from an integer. */
export function hash01(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** Cheap smooth 1D noise in [-1, 1]. */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i * 374761393 + seed * 668265263) * 2 - 1;
  const b = hash01((i + 1) * 374761393 + seed * 668265263) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}
