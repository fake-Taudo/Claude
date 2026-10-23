// Baked textures for the aura VFX. Everything is generated once on an offscreen canvas
// (gradients, noise, shapes) and only transformed at runtime. Cached with a pixel budget.

import { VFX } from '../../config/vfx/tiers';
import type { SpriteKind } from '../../config/vfx/types';
import { mix, parseColor, rgba } from '../color';
import { clamp01, fbm, hash, noise1, Rng, TAU } from './math';

export { sample as sampleNoise, grid as noiseGrid, cached as bakeTex, paint as paintTex, px as pxOut, NONE as PX_NONE, rgb01 };

export type Tex = HTMLCanvasElement;

const cache = new Map<string, Tex>();
let pixels = 0;
/** Bake time per texture kind in ms (lab statistics). */
const bakeMs = new Map<string, number>();
const keyOf = new WeakMap<Tex, string>();

function canvas(w: number, h: number): Tex {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Cached texture factory; evicts the least recently used entries above the budget. */
function cached(key: string, make: () => Tex): Tex {
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const t0 = performance.now();
  const t = make();
  const kind = key.slice(0, key.indexOf('|') >>> 0);
  bakeMs.set(kind, (bakeMs.get(kind) ?? 0) + performance.now() - t0);
  cache.set(key, t);
  keyOf.set(t, key);
  pixels += t.width * t.height;
  const budget = VFX.textureBudgetMp * 1e6;
  for (const [k, v] of cache) {
    if (pixels <= budget || cache.size <= 32) break;
    cache.delete(k);
    pixels -= v.width * v.height;
  }
  return t;
}

export function textureStats(): { count: number; megapixels: number; bakeMs: Record<string, number> } {
  const by: Record<string, number> = {};
  for (const [k, v] of [...bakeMs].sort((p, q) => q[1] - p[1])) by[k] = Math.round(v * 10) / 10;
  return { count: cache.size, megapixels: Math.round(pixels / 1e4) / 100, bakeMs: by };
}

type Px = [number, number, number, number];

/** Writes RGBA pixels computed by fn(u, v) -> [r, g, b, a] in 0..1 (u, v in -1..1). */
function paint(w: number, h: number, fn: (u: number, v: number, x: number, y: number) => Px): Tex {
  const c = canvas(w, h);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = fn(((x + 0.5) / w) * 2 - 1, ((y + 0.5) / h) * 2 - 1, x, y);
      const i = (y * w + x) * 4;
      const a = clamp01(p[3]);
      if (a <= 0) continue;
      d[i] = clamp01(p[0]) * 255;
      d[i + 1] = clamp01(p[1]) * 255;
      d[i + 2] = clamp01(p[2]) * 255;
      d[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const OUT: Px = [0, 0, 0, 0];
const px = (r: number, g: number, b: number, a: number): Px => {
  OUT[0] = r;
  OUT[1] = g;
  OUT[2] = b;
  OUT[3] = a;
  return OUT;
};
const NONE: Px = [0, 0, 0, 0];

// ---------------------------------------------------------------------------
// Noise grids: precomputed tileable fractal noise, sampled bilinearly.
// ---------------------------------------------------------------------------

const GRID = 128;
/** Distinct noise variants per (octaves, base). Building a grid is the expensive part of a
 * bake, so seeds map onto a small set that is shared by all textures and auras. Seeds that
 * differ by less than this within one texture still get different grids. */
const GRID_VARIANTS = 8;
const grids = new Map<string, Float32Array>();

function grid(octaves: number, base: number, seed: number): Float32Array {
  const variant = ((Math.round(seed) % GRID_VARIANTS) + GRID_VARIANTS) % GRID_VARIANTS;
  const key = `${octaves}|${base}|${variant}`;
  let g = grids.get(key);
  if (!g) {
    g = new Float32Array(GRID * GRID);
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) g[y * GRID + x] = fbm(x / GRID, y / GRID, octaves, base, variant * 97 + 11);
    grids.set(key, g);
  }
  return g;
}

/** Bilinear wrap-around sample of a noise grid, u and v in tile units (1 = one tile). */
function sample(g: Float32Array, u: number, v: number): number {
  const x = (u - Math.floor(u)) * GRID;
  const y = (v - Math.floor(v)) * GRID;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const x1 = (x0 + 1) % GRID;
  const y1 = (y0 + 1) % GRID;
  const a = g[y0 * GRID + x0];
  const b = g[y0 * GRID + x1];
  const c = g[y1 * GRID + x0];
  const d = g[y1 * GRID + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

const rgb01 = (hex: string): [number, number, number] => {
  const [r, g, b] = parseColor(hex);
  return [r / 255, g / 255, b / 255];
};

/** Gaussian-like radial falloff written as gradient stops. */
function radialStops(g: CanvasGradient, color: string, stops: [number, number][]): void {
  for (const [t, a] of stops) g.addColorStop(t, rgba(color, a));
}

// ---------------------------------------------------------------------------
// Glows
// ---------------------------------------------------------------------------

/** Soft glow. 'soft' gaussian, 'core' with a white-hot centre, 'ring' hollow halo. */
export function glowTex(color: string, profile: 'soft' | 'core' | 'ring' = 'soft'): Tex {
  return cached(`glow|${color}|${profile}`, () => {
    const S = 128;
    const c = canvas(S, S);
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    if (profile === 'ring') {
      radialStops(g, color, [[0, 0], [0.45, 0.02], [0.62, 0.35], [0.7, 0.55], [0.78, 0.35], [0.9, 0.08], [1, 0]]);
    } else {
      // exp(-4 r^2) sampled, which looks like a real light falloff.
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        let a = Math.exp(-4.2 * t * t) * (1 - t * t);
        if (profile === 'core') a = Math.min(1, a * 1.15);
        g.addColorStop(t, rgba(color, a));
      }
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    if (profile === 'core') {
      const h = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.18);
      h.addColorStop(0, 'rgba(255,255,255,1)');
      h.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      h.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = h;
      ctx.fillRect(0, 0, S, S);
    }
    return c;
  });
}

/** Four-pointed glint: soft core plus long thin rays (horizontal ray longer). */
export function glintTex(color: string): Tex {
  return cached(`glint|${color}`, () => {
    const S = 128;
    const c = canvas(S, S);
    const ctx = c.getContext('2d')!;
    ctx.translate(S / 2, S / 2);
    ctx.globalCompositeOperation = 'lighter';
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, S * 0.22);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.25, rgba(color, 0.8));
    core.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = core;
    ctx.fillRect(-S / 2, -S / 2, S, S);
    const ray = (len: number, w: number, rot: number, a: number) => {
      ctx.save();
      ctx.rotate(rot);
      const g = ctx.createLinearGradient(-len, 0, len, 0);
      g.addColorStop(0, rgba(color, 0));
      g.addColorStop(0.42, rgba(color, a * 0.6));
      g.addColorStop(0.5, `rgba(255,255,255,${a})`);
      g.addColorStop(0.58, rgba(color, a * 0.6));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.quadraticCurveTo(0, -w, len, 0);
      ctx.quadraticCurveTo(0, w, -len, 0);
      ctx.fill();
      ctx.restore();
    };
    ray(S * 0.5, S * 0.05, 0, 1);
    ray(S * 0.38, S * 0.045, Math.PI / 2, 0.9);
    ray(S * 0.16, S * 0.03, Math.PI / 4, 0.45);
    ray(S * 0.16, S * 0.03, -Math.PI / 4, 0.45);
    return c;
  });
}

/** Elongated streak for trails, head on the right, transparent tail on the left. */
export function streakTex(color: string): Tex {
  return cached(`streak|${color}`, () => {
    const W = 128;
    const H = 32;
    const [cr, cg, cb] = rgb01(color);
    return paint(W, H, (u, v) => {
      const along = (u + 1) / 2; // 0 tail .. 1 head
      const width = 0.25 + 0.75 * Math.pow(along, 0.7);
      const across = Math.exp(-((v / width) ** 2) * 4.5);
      const head = Math.exp(-(((u - 0.82) / 0.16) ** 2) - (v / 0.35) ** 2);
      const a = across * Math.pow(along, 1.6) + head * 0.8;
      const w = clamp01(head * 1.2 + across * along * 0.4);
      return px(cr + (1 - cr) * w, cg + (1 - cg) * w, cb + (1 - cb) * w, a);
    });
  });
}

// ---------------------------------------------------------------------------
// Particle sprites
// ---------------------------------------------------------------------------

/** Every sprite: shape in the inner half, own glow halo outside. Drawn centred. */
export function spriteTex(kind: SpriteKind, color: string): Tex {
  if (kind === 'glint') return glintTex(color);
  if (kind === 'puff') return puffTex(color, 0);
  return cached(`sprite|${kind}|${color}`, () => makeSprite(kind, color));
}

function makeSprite(kind: SpriteKind, color: string): Tex {
  const small = kind === 'mote' || kind === 'spark' || kind === 'bokeh' || kind === 'ash';
  const S = small ? 64 : 128;
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const R = S / 2;
  const light = mix(color, '#ffffff', 0.65);
  const dark = mix(color, '#000000', 0.55);
  ctx.translate(R, R);
  const halo = (a: number, size = 1) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * size);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      g.addColorStop(t, rgba(color, a * Math.exp(-5 * t * t) * (1 - t)));
    }
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, S, S);
  };
  const radial = (r: number, stops: [number, string][], ox = 0, oy = 0) => {
    const g = ctx.createRadialGradient(ox, oy, 0, 0, 0, r);
    for (const [t, col] of stops) g.addColorStop(t, col);
    return g;
  };
  const poly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * R, y * R) : ctx.moveTo(x * R, y * R)));
    ctx.closePath();
  };
  switch (kind) {
    case 'mote': {
      halo(0.75);
      ctx.fillStyle = radial(R * 0.32, [[0, 'rgba(255,255,255,1)'], [0.45, rgba(light, 0.9)], [1, rgba(color, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      break;
    }
    case 'bokeh': {
      ctx.fillStyle = radial(R * 0.9, [[0, rgba(color, 0.22)], [0.7, rgba(color, 0.3)], [0.86, rgba(light, 0.45)], [1, rgba(color, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      break;
    }
    case 'spark': {
      halo(0.9, 0.9);
      ctx.fillStyle = radial(R * 0.22, [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,0.7)'], [1, rgba(light, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba('#ffffff', 0.5);
      ctx.fillRect(-R * 0.7, -R * 0.02, R * 1.4, R * 0.04);
      ctx.fillRect(-R * 0.02, -R * 0.55, R * 0.04, R * 1.1);
      break;
    }
    case 'ember': {
      halo(0.85);
      ctx.save();
      ctx.scale(1, 1.35);
      ctx.fillStyle = radial(R * 0.3, [[0, 'rgba(255,255,240,1)'], [0.35, rgba(light, 0.95)], [0.75, rgba(color, 0.7)], [1, rgba(color, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      ctx.restore();
      break;
    }
    case 'feather': {
      halo(0.45, 0.95);
      ctx.save();
      ctx.rotate(-0.25);
      const vane = ctx.createLinearGradient(0, -R * 0.85, 0, R * 0.85);
      vane.addColorStop(0, rgba(light, 0.95));
      vane.addColorStop(0.6, rgba(color, 0.75));
      vane.addColorStop(1, rgba(color, 0.05));
      ctx.fillStyle = vane;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.82);
      ctx.bezierCurveTo(R * 0.38, -R * 0.45, R * 0.3, R * 0.35, R * 0.03, R * 0.8);
      ctx.bezierCurveTo(-R * 0.22, R * 0.3, -R * 0.3, -R * 0.45, 0, -R * 0.82);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffffff', 0.18);
      ctx.lineWidth = R * 0.025;
      for (let i = -6; i <= 6; i++) {
        const y = (i / 7) * R * 0.7;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.quadraticCurveTo(R * 0.12 * Math.sign(i || 1), y - R * 0.08, R * 0.24 * (i % 2 ? 1 : -1), y - R * 0.16);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = R * 0.035;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.82);
      ctx.quadraticCurveTo(R * 0.06, 0, R * 0.03, R * 0.85);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'shard': {
      halo(0.5, 0.9);
      ctx.fillStyle = radial(R * 0.6, [[0, rgba(light, 0.95)], [0.6, rgba(color, 0.8)], [1, rgba(dark, 0.7)]], -R * 0.1, -R * 0.2);
      poly([[0, -0.62], [0.2, -0.05], [0.07, 0.6], [-0.18, 0.1]]);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.62);
      ctx.lineTo(R * 0.2, -R * 0.05);
      ctx.lineTo(R * 0.07, R * 0.6);
      ctx.stroke();
      break;
    }
    case 'crystal': {
      halo(0.45);
      const w = 0.24;
      const h = 0.62;
      const t = 0.2;
      // Hexagonal prism seen from the side: three facets with different shading.
      ctx.fillStyle = rgba(mix(color, '#ffffff', 0.85), 0.95);
      poly([[0, -h], [-w, -h + t], [-w, h - t], [0, h]]);
      ctx.fill();
      ctx.fillStyle = rgba(color, 0.9);
      poly([[0, -h], [w, -h + t], [w, h - t], [0, h]]);
      ctx.fill();
      const inner = ctx.createLinearGradient(-w * R, 0, w * R, 0);
      inner.addColorStop(0, rgba('#ffffff', 0.35));
      inner.addColorStop(0.5, rgba(light, 0.05));
      inner.addColorStop(1, rgba(dark, 0.35));
      ctx.fillStyle = inner;
      poly([[0, -h], [w, -h + t], [w, h - t], [0, h], [-w, h - t], [-w, -h + t]]);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffffff', 0.85);
      ctx.lineWidth = R * 0.025;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -h * R);
      ctx.lineTo(0, h * R);
      ctx.strokeStyle = rgba('#ffffff', 0.5);
      ctx.stroke();
      break;
    }
    case 'droplet': {
      halo(0.4, 0.8);
      ctx.fillStyle = radial(R * 0.42, [[0, rgba(light, 0.95)], [0.6, rgba(color, 0.85)], [1, rgba(dark, 0.9)]], -R * 0.08, R * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.5);
      ctx.bezierCurveTo(R * 0.3, -R * 0.12, R * 0.34, R * 0.32, 0, R * 0.36);
      ctx.bezierCurveTo(-R * 0.34, R * 0.32, -R * 0.3, -R * 0.12, 0, -R * 0.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.09, R * 0.03, R * 0.05, R * 0.09, 0.3, 0, TAU);
      ctx.fill();
      break;
    }
    case 'bubble': {
      ctx.fillStyle = radial(R * 0.5, [[0, rgba(color, 0.05)], [0.75, rgba(color, 0.15)], [0.92, rgba(light, 0.75)], [1, rgba(color, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.18, -R * 0.2, R * 0.1, R * 0.05, -0.7, 0, TAU);
      ctx.fill();
      break;
    }
    case 'flake': {
      halo(0.4, 0.8);
      ctx.strokeStyle = rgba(light, 0.95);
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * TAU) / 6);
        ctx.lineWidth = R * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -R * 0.5);
        ctx.stroke();
        ctx.lineWidth = R * 0.035;
        for (const k of [0.22, 0.36]) {
          ctx.beginPath();
          ctx.moveTo(0, -R * k);
          ctx.lineTo(R * 0.11, -R * (k + 0.1));
          ctx.moveTo(0, -R * k);
          ctx.lineTo(-R * 0.11, -R * (k + 0.1));
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.fillStyle = radial(R * 0.12, [[0, 'rgba(255,255,255,1)'], [1, rgba(light, 0)]]);
      ctx.fillRect(-R, -R, S, S);
      break;
    }
    case 'ash': {
      // Dark flake for normal blending (contrast element), faint ember rim.
      ctx.fillStyle = rgba(color, 0.85);
      poly([[-0.3, -0.18], [0.05, -0.32], [0.34, -0.06], [0.2, 0.26], [-0.16, 0.3], [-0.36, 0.06]]);
      ctx.fill();
      ctx.strokeStyle = rgba(mix(color, '#ff8a3d', 0.6), 0.5);
      ctx.lineWidth = R * 0.05;
      ctx.stroke();
      break;
    }
    case 'petal': {
      halo(0.35, 0.85);
      ctx.fillStyle = radial(R * 0.55, [[0, rgba(light, 0.95)], [0.7, rgba(color, 0.75)], [1, rgba(color, 0.1)]], 0, R * 0.3);
      ctx.beginPath();
      ctx.moveTo(0, R * 0.5);
      ctx.bezierCurveTo(R * 0.42, R * 0.12, R * 0.22, -R * 0.42, 0, -R * 0.52);
      ctx.bezierCurveTo(-R * 0.22, -R * 0.42, -R * 0.42, R * 0.12, 0, R * 0.5);
      ctx.fill();
      break;
    }
    case 'leaf': {
      halo(0.35, 0.8);
      ctx.fillStyle = radial(R * 0.5, [[0, rgba(light, 0.9)], [1, rgba(color, 0.6)]]);
      ctx.beginPath();
      ctx.ellipse(0, 0, R * 0.18, R * 0.42, 0.4, 0, TAU);
      ctx.fill();
      break;
    }
    case 'chunk': {
      // Irregular rock: dark body, glowing hot edge on the lower right, glowing cracks.
      halo(0.55, 0.9);
      const rng = new Rng(hash(parseColor(color)[0] * 31 + 7) * 1e9);
      const pts: [number, number][] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        const r = 0.34 + rng.next() * 0.14;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      ctx.fillStyle = radial(R * 0.5, [[0, '#4a3830'], [0.7, '#2a1d18'], [1, '#140c0a']], -R * 0.12, -R * 0.12);
      poly(pts);
      ctx.fill();
      ctx.save();
      ctx.clip();
      const hot = ctx.createLinearGradient(-R * 0.4, -R * 0.4, R * 0.45, R * 0.45);
      hot.addColorStop(0, rgba(color, 0));
      hot.addColorStop(0.62, rgba(color, 0.15));
      hot.addColorStop(0.9, rgba(light, 0.95));
      hot.addColorStop(1, 'rgba(255,255,230,1)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = hot;
      ctx.fillRect(-R, -R, S, S);
      ctx.strokeStyle = rgba(light, 0.8);
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.moveTo(-R * 0.1, -R * 0.25);
      ctx.lineTo(R * 0.02, R * 0.02);
      ctx.lineTo(R * 0.22, R * 0.12);
      ctx.moveTo(R * 0.02, R * 0.02);
      ctx.lineTo(-R * 0.12, R * 0.22);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'wisp': {
      halo(0.6, 0.95);
      const g = ctx.createRadialGradient(0, R * 0.12, 0, 0, R * 0.05, R * 0.5);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.3, rgba(light, 0.9));
      g.addColorStop(0.75, rgba(color, 0.45));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.62);
      ctx.bezierCurveTo(R * 0.12, -R * 0.3, R * 0.36, -R * 0.05, R * 0.3, R * 0.22);
      ctx.bezierCurveTo(R * 0.22, R * 0.5, -R * 0.22, R * 0.5, -R * 0.3, R * 0.22);
      ctx.bezierCurveTo(-R * 0.36, -R * 0.05, -R * 0.12, -R * 0.3, 0, -R * 0.62);
      ctx.fill();
      break;
    }
    case 'orb': {
      halo(0.6);
      ctx.fillStyle = radial(R * 0.42, [[0, rgba('#ffffff', 0.95)], [0.35, rgba(light, 0.95)], [0.8, rgba(color, 0.95)], [1, rgba(dark, 0.95)]], -R * 0.12, -R * 0.14);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.42, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(light, 0.6);
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.41, Math.PI * 0.1, Math.PI * 0.75);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.ellipse(-R * 0.15, -R * 0.18, R * 0.1, R * 0.06, -0.6, 0, TAU);
      ctx.fill();
      break;
    }
    case 'rune': {
      halo(0.5, 0.8);
      ctx.strokeStyle = rgba(light, 0.95);
      ctx.lineWidth = R * 0.06;
      ctx.lineCap = 'round';
      const rng = new Rng(hash(parseColor(color)[1] * 13 + 3) * 1e9);
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.4);
      ctx.lineTo(0, R * 0.4);
      for (let i = 0; i < 3; i++) {
        const y = (rng.next() - 0.5) * R * 0.6;
        ctx.moveTo(0, y);
        ctx.lineTo(rng.sign() * R * 0.22, y + (rng.next() - 0.5) * R * 0.3);
      }
      ctx.stroke();
      break;
    }
    case 'cell': {
      halo(0.4, 0.9);
      ctx.fillStyle = radial(R * 0.45, [[0, rgba(color, 0.2)], [0.8, rgba(color, 0.35)], [0.93, rgba(light, 0.85)], [1, rgba(color, 0)]]);
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.45, 0, TAU);
      ctx.fill();
      ctx.fillStyle = radial(R * 0.16, [[0, 'rgba(255,255,255,0.95)'], [0.6, rgba(light, 0.8)], [1, rgba(color, 0.2)]]);
      ctx.beginPath();
      ctx.arc(R * 0.08, -R * 0.06, R * 0.15, 0, TAU);
      ctx.fill();
      break;
    }
    case 'moon': {
      // Small moon with its own light: lit limb, terminator, a few craters, coloured halo.
      halo(0.55);
      const body = ctx.createRadialGradient(-R * 0.14, -R * 0.16, R * 0.02, 0, 0, R * 0.4);
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.35, light);
      body.addColorStop(0.8, color);
      body.addColorStop(1, dark);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(dark, 0.35);
      for (const [cx, cy, cr] of [[-0.12, 0.08, 0.07], [0.12, -0.1, 0.05], [0.06, 0.18, 0.045], [-0.05, -0.2, 0.035]]) {
        ctx.beginPath();
        ctx.arc(cx * R, cy * R, cr * R, 0, TAU);
        ctx.fill();
      }
      const shade = ctx.createLinearGradient(-R * 0.4, -R * 0.4, R * 0.4, R * 0.4);
      shade.addColorStop(0, 'rgba(0,0,0,0)');
      shade.addColorStop(0.62, 'rgba(0,0,10,0.05)');
      shade.addColorStop(1, 'rgba(0,0,10,0.6)');
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(light, 0.7);
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.39, Math.PI * 0.95, Math.PI * 1.7);
      ctx.stroke();
      break;
    }
    case 'gear': {
      halo(0.4, 0.9);
      ctx.fillStyle = rgba(light, 0.9);
      ctx.beginPath();
      const teeth = 10;
      for (let i = 0; i < teeth * 2; i++) {
        const a0 = (i / (teeth * 2)) * TAU;
        const a1 = ((i + 1) / (teeth * 2)) * TAU;
        const r = i % 2 ? R * 0.36 : R * 0.44;
        ctx.arc(0, 0, r, a0, a1);
      }
      ctx.closePath();
      ctx.arc(0, 0, R * 0.14, 0, TAU, true);
      ctx.fill('evenodd');
      break;
    }
    default:
      halo(0.8);
  }
  return c;
}

// ---------------------------------------------------------------------------
// Smoke, nebula
// ---------------------------------------------------------------------------

/** Smoke puff: fractal noise density inside a soft round mask. */
export function puffTex(color: string, variant: number): Tex {
  return cached(`puff|${color}|${variant}`, () => {
    const S = 128;
    const [r, g, b] = rgb01(color);
    const n4 = grid(4, 3, 101 + variant * 37);
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d >= 1) return NONE;
      const mask = Math.exp(-3.2 * d * d) * (1 - d);
      const n = sample(n4, (u + 1) / 2, (v + 1) / 2);
      return px(r, g, b, clamp01((n - 0.32) * 1.9) * mask);
    });
  });
}

/** Nebula cloud: domain warped fractal noise in two or three colours. */
export function nebulaTex(colors: string[], seed: number, size = 256): Tex {
  return cached(`nebula|${colors.join(',')}|${seed}|${size}`, () => {
    const S = size;
    const cols = colors.map(rgb01);
    const gw = grid(3, 2, seed);
    const gn = grid(5, 3, seed + 21);
    const gm = grid(4, 2, seed + 33);
    const gr = grid(4, 4, seed + 47);
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d >= 1) return NONE;
      const mask = (1 - d) ** 1.2;
      const x = (u + 1) / 2;
      const y = (v + 1) / 2;
      const wx = sample(gw, x, y) - 0.5;
      const wy = sample(gw, x + 0.31, y + 0.17) - 0.5;
      const n = sample(gn, x + wx * 0.7, y + wy * 0.7);
      const m = sample(gm, x - wy * 0.5, y + wx * 0.5);
      // Ridged noise gives bright filaments, low values carve dark lanes.
      const ridge = Math.pow(1 - Math.abs(sample(gr, x + wy * 0.6, y - wx * 0.6) * 2 - 1), 4);
      const ci = clamp01(m * 1.5 - 0.25) * (cols.length - 1);
      const i0 = Math.floor(ci);
      const i1 = Math.min(cols.length - 1, i0 + 1);
      const f = ci - i0;
      const c0 = cols[i0];
      const c1 = cols[i1];
      const lane = clamp01((n - 0.42) * 3);
      const dens = (clamp01((n - 0.33) * 2.4) * 0.75 + ridge * 0.55 * lane) * mask;
      const hot = clamp01((n - 0.6) * 3) * ridge * mask;
      return px(c0[0] + (c1[0] - c0[0]) * f + hot * 0.6, c0[1] + (c1[1] - c0[1]) * f + hot * 0.6, c0[2] + (c1[2] - c0[2]) * f + hot * 0.6, dens);
    });
  });
}

// ---------------------------------------------------------------------------
// Bands, beams, pillars, rays, vortex
// ---------------------------------------------------------------------------

/** Geometry of a baked band: the band centre sits at `centre` of the half size. */
export const BAND_PAD = 1.6;

/**
 * Soft light band ring. ratio = width / radius. The texture half size equals
 * radius + BAND_PAD * width. Brightness varies around the ring; the inner line is hot.
 */
export function bandTex(color: string, color2: string, ratio: number, variation: number, seed: number): Tex {
  const q = Math.round(ratio * 50) / 50;
  const vq = Math.round(variation * 10) / 10;
  return cached(`band|${color}|${color2}|${q}|${vq}|${seed}`, () => {
    const S = 512;
    const half = 1 + BAND_PAD * q;
    const centre = 1 / half;
    const sigma = (q / 2.3) / half;
    const c1 = rgb01(color);
    const c2 = rgb01(color2);
    const gn = grid(4, 4, seed);
    const gs = grid(3, 16, seed + 5);
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      const x = (d - centre) / sigma;
      if (x * x > 12) return NONE;
      const a = Math.atan2(v, u);
      const around = (a / TAU + 1) % 1;
      const n = sample(gn, around, d * 0.5);
      const streak = 0.55 + 0.45 * sample(gs, around, d * 0.25);
      const vari = 1 - variation + variation * (0.35 + 0.9 * n) * streak;
      const prof = Math.exp(-x * x * 0.5);
      const core = Math.exp(-x * x * 3.5);
      const k = clamp01(0.5 + x * 0.25);
      const r = c1[0] + (c2[0] - c1[0]) * k;
      const g = c1[1] + (c2[1] - c1[1]) * k;
      const b = c1[2] + (c2[2] - c1[2]) * k;
      const hot = core * 0.65;
      return px(r + (1 - r) * hot, g + (1 - g) * hot, b + (1 - b) * hot, prof * vari * (0.75 + core * 0.25));
    });
  });
}

/** Vertical light column: hot core across, faded ends. Base at the bottom. */
export function pillarTex(color: string): Tex {
  return cached(`pillar|${color}`, () => {
    const W = 64;
    const H = 256;
    const [r, g, b] = rgb01(color);
    return paint(W, H, (u, v) => {
      const along = 1 - (v + 1) / 2; // 0 bottom .. 1 top
      const fade = clamp01(along / 0.06) * Math.pow(1 - along, 1.2);
      const halo = Math.exp(-u * u * 5);
      const core = Math.exp(-u * u * 90);
      const hot = core * 0.9;
      return px(r + (1 - r) * hot, g + (1 - g) * hot, b + (1 - b) * hot, (halo * 0.55 + core * 0.8) * fade);
    });
  });
}

/** Tileable vertical streak noise in a colour to scroll over pillars and beams. */
export function flowTex(color: string, seed = 3): Tex {
  return cached(`flow|${color}|${seed}`, () => {
    const W = 64;
    const H = 256;
    const [r, g, b] = rgb01(color);
    const gn = grid(4, 4, seed);
    const gs = grid(3, 2, seed + 4);
    return paint(W, H, (u, _v, x, y) => {
      // Tileable in y; streaks are stretched vertically (x frequency 4x the y frequency).
      const n = sample(gn, x / W, y / H);
      const s = sample(gs, (x / W) * 4, y / H);
      const across = Math.exp(-u * u * 3);
      const a = clamp01((n * 0.6 + s * 0.7 - 0.55) * 2.4) * across;
      const hot = a * 0.6;
      return px(r + (1 - r) * hot, g + (1 - g) * hot, b + (1 - b) * hot, a);
    });
  });
}

/** Light cone from the left centre opening to the right (beam / lighthouse). */
export function coneTex(color: string, dust: boolean): Tex {
  return cached(`cone|${color}|${dust ? 1 : 0}`, () => {
    const W = 256;
    const H = 128;
    const [r, g, b] = rgb01(color);
    const gd = grid(4, 6, 77);
    return paint(W, H, (u, v, x, y) => {
      const along = (u + 1) / 2;
      const width = 0.04 + along * 0.96;
      const across = v / width;
      const edge = Math.exp(-across * across * 3.2);
      const coreLine = Math.exp(-across * across * 40) * Math.exp(-along * 2.5);
      const fall = Math.pow(1 - along, 1.3) * clamp01(along / 0.04);
      const dustA = dust ? 0.7 + 0.6 * clamp01((sample(gd, x / W, y / H) - 0.4) * 2) : 1;
      const hot = clamp01(coreLine * 1.5);
      return px(r + (1 - r) * hot, g + (1 - g) * hot, b + (1 - b) * hot, (edge * fall * 0.85 + coreLine) * dustA);
    });
  });
}

/** Radial god rays around a centre. */
export function raysTex(color: string, n: number, jitter: number, seed: number): Tex {
  return tinted(raysShape(n, jitter, seed), color);
}

/** White ray crown; colour variants come from tinted(). */
function raysShape(n: number, jitter: number, seed: number): Tex {
  return cached(`raysShape|${n}|${jitter}|${seed}`, () => {
    const S = 384;
    const widths: number[] = [];
    const lens: number[] = [];
    for (let i = 0; i < n; i++) {
      widths.push(1 - jitter * 0.7 * hash(i * 13 + seed));
      lens.push(1 - jitter * 0.45 * hash(i * 29 + seed + 1));
    }
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1) return NONE;
      const a = (Math.atan2(v, u) / TAU + 1) % 1;
      const f = a * n;
      const i = Math.floor(f) % n;
      const local = f - Math.floor(f) - 0.5;
      const w = 0.17 * widths[i];
      const ray = Math.exp(-((local / w) ** 2) * 2) * clamp01(1 - d / lens[i]) ** 1.5;
      const inner = clamp01(d / 0.12);
      const glow = Math.exp(-d * d * 6) * 0.25;
      return px(1, 1, 1, (ray * 0.9 + glow) * inner);
    });
  });
}

/** A white texture recoloured on the GPU (keeps its alpha, takes the colour). */
function tinted(white: Tex, color: string): Tex {
  return cached(`tint|${color}|${white.width}x${white.height}|${keyOf.get(white) ?? ''}`, () => {
    const c = canvas(white.width, white.height);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(white, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  });
}

/** Spiral vortex disc with fractal detail; optional dark centre. */
export function spiralTex(color: string, color2: string, arms: number, twist: number, dark: number, seed: number): Tex {
  return cached(`spiral|${color}|${color2}|${arms}|${twist}|${dark}|${seed}`, () => {
    const S = 512;
    const c1 = rgb01(color);
    const c2 = rgb01(color2);
    const gn = grid(4, 4, seed);
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1) return NONE;
      const a = Math.atan2(v, u);
      const phase = (a / TAU) * arms + Math.log(d + 0.05) * twist;
      const arm = 0.5 + 0.5 * Math.cos(phase * TAU);
      const n = sample(gn, ((a / TAU) + 1) % 1 + d * 0.3, d * 1.5);
      const outer = clamp01((1 - d) / 0.35);
      const centre = 1 - dark * Math.exp(-d * d * 30);
      const dens = (Math.pow(arm, 2.2) * 0.85 + 0.15) * (0.55 + n * 0.8) * outer * clamp01(d / 0.06);
      const k = clamp01(1 - d * 1.2);
      const hot = Math.pow(arm, 6) * 0.35 * (1 - d);
      return px(c2[0] + (c1[0] - c2[0]) * k + hot, c2[1] + (c1[1] - c2[1]) * k + hot, c2[2] + (c1[2] - c2[2]) * k + hot, dens * centre);
    });
  });
}

/** Soft ripple ring (thin version of a band, no variation). */
export function ringTex(color: string, sharp: number): Tex {
  return cached(`ring|${color}|${sharp}`, () => {
    // Gaussian band around 0.85 of the half size with a white-hot centre line, drawn as a
    // radial gradient (sampled densely around the band) instead of pixel by pixel.
    const S = sharp > 24 ? 512 : 256;
    const c = canvas(S, S);
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    const span = 3 / sharp;
    g.addColorStop(0, rgba(color, 0));
    for (let i = 0; i <= 24; i++) {
      const t = 0.85 - span + (2 * span * i) / 24;
      if (t <= 0 || t >= 1) continue;
      const x = (t - 0.85) * sharp;
      const hot = Math.exp(-x * x * 6) * 0.5;
      g.addColorStop(t, rgba(mix(color, '#ffffff', hot), Math.exp(-x * x)));
    }
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return c;
  });
}

/** Planet rim light: bright crescent along the +x limb of a unit disc (half size = 1). */
export function rimTex(color: string): Tex {
  return cached(`rim|${color}`, () => {
    const S = 256;
    const [r, g, b] = rgb01(color);
    return paint(S, S, (u, v) => {
      const d = Math.sqrt(u * u + v * v);
      if (d > 1) return NONE;
      const limb = Math.pow(d, 6);
      const side = clamp01(u * 0.8 + 0.35);
      return px(r, g, b, limb * side * side + Math.pow(d, 2) * clamp01(u) * 0.25);
    });
  });
}

/** Soft dark disc used as a cast shadow on the avatar. */
export function shadowTex(): Tex {
  return cached('shadow', () => {
    const S = 64;
    const c = canvas(S, S);
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(0,0,8,0.85)');
    g.addColorStop(0.55, 'rgba(0,0,8,0.5)');
    g.addColorStop(1, 'rgba(0,0,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return c;
  });
}

/** 1D noise helper exposed for layers (continuous, in -1..1). */
export const n1 = noise1;
