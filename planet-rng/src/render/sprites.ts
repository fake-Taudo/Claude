// Pre-rendered glowing particle sprites (one canvas per shape + color), so particles are
// drawn with a single drawImage instead of paths and shadows.

import { parseColor, rgba } from './color';

/** Shapes used by the roll effects, cutscenes, UI effects and background. */
export type ParticleShape =
  | 'dot'
  | 'orb'
  | 'drop'
  | 'spark'
  | 'shard'
  | 'bolt'
  | 'flare'
  | 'cloud'
  | 'star4'
  | 'star5'
  | 'hex'
  | 'fragment'
  | 'lens'
  | 'feather'
  | 'crystal'
  | 'ember'
  | 'petal'
  | 'ring'
  | 'diamond'
  | 'streak'
  | 'bubble'
  | 'square';

export const SPRITE_SIZE = 64;
/** Fraction of the sprite occupied by the solid core (rest is glow). */
export const CORE = 0.5;

type Ctx2D = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function star(ctx: Ctx2D, points: number, outer: number, inner: number, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function polygon(ctx: Ctx2D, pts: [number, number][]): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

/** Draws a shape centred at 0,0 with core radius r. */
export function drawShape(ctx: Ctx2D, shape: ParticleShape, r: number, color: string): void {
  const light = '#ffffff';
  const grad = (inner: string, outer: string, rr = r) => {
    const g = ctx.createRadialGradient(-rr * 0.25, -rr * 0.3, 0, 0, 0, rr);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    return g;
  };
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  switch (shape) {
    case 'dot':
    case 'ember':
      ctx.fillStyle = grad(light, color);
      ctx.beginPath();
      ctx.arc(0, 0, r * (shape === 'ember' ? 0.75 : 0.85), 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'orb':
      ctx.fillStyle = grad(rgba('#ffffff', 0.95), color);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bubble':
      ctx.lineWidth = r * 0.18;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba(color, 0.18);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.38, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ring':
      ctx.lineWidth = r * 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'drop':
      ctx.fillStyle = grad(light, color);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.1);
      ctx.bezierCurveTo(r * 0.75, -r * 0.2, r * 0.85, r * 0.9, 0, r * 0.95);
      ctx.bezierCurveTo(-r * 0.85, r * 0.9, -r * 0.75, -r * 0.2, 0, -r * 1.1);
      ctx.fill();
      break;
    case 'spark':
      ctx.fillStyle = light;
      star(ctx, 4, r * 1.1, r * 0.16);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'star4':
      ctx.fillStyle = grad(light, color);
      star(ctx, 4, r * 1.05, r * 0.3);
      ctx.fill();
      break;
    case 'star5':
      ctx.fillStyle = grad(light, color);
      star(ctx, 5, r, r * 0.45);
      ctx.fill();
      break;
    case 'flare':
      ctx.fillStyle = grad(light, color, r * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(light, 0.85);
      star(ctx, 4, r * 1.2, r * 0.08, 0);
      ctx.fill();
      ctx.fillStyle = rgba(color, 0.6);
      star(ctx, 4, r * 0.8, r * 0.06, Math.PI / 4);
      ctx.fill();
      break;
    case 'cloud': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.9);
      g.addColorStop(0, rgba(color, 0.9));
      g.addColorStop(0.5, rgba(color, 0.35));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'hex':
      ctx.fillStyle = rgba(color, 0.45);
      polygon(ctx, Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r] as [number, number]));
      ctx.fill();
      ctx.lineWidth = r * 0.22;
      ctx.strokeStyle = light;
      ctx.stroke();
      break;
    case 'shard':
      ctx.fillStyle = grad(light, color);
      polygon(ctx, [
        [0, -r * 1.1],
        [r * 0.55, r * 0.2],
        [r * 0.1, r * 1.0],
        [-r * 0.6, r * 0.3],
      ]);
      ctx.fill();
      break;
    case 'fragment':
      ctx.fillStyle = grad(light, color);
      polygon(ctx, [
        [-r * 0.2, -r * 0.95],
        [r * 0.75, -r * 0.55],
        [r * 0.95, r * 0.25],
        [r * 0.3, r * 0.9],
        [-r * 0.7, r * 0.7],
        [-r * 0.95, -r * 0.1],
      ]);
      ctx.fill();
      break;
    case 'crystal':
      ctx.fillStyle = grad(light, color);
      polygon(ctx, [
        [0, -r * 1.15],
        [r * 0.45, -r * 0.45],
        [r * 0.45, r * 0.45],
        [0, r * 1.15],
        [-r * 0.45, r * 0.45],
        [-r * 0.45, -r * 0.45],
      ]);
      ctx.fill();
      ctx.strokeStyle = rgba(light, 0.8);
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.15);
      ctx.lineTo(0, r * 1.15);
      ctx.stroke();
      break;
    case 'diamond':
      ctx.fillStyle = grad(light, color);
      polygon(ctx, [
        [0, -r * 1.1],
        [r * 0.75, 0],
        [0, r * 1.1],
        [-r * 0.75, 0],
      ]);
      ctx.fill();
      ctx.fillStyle = rgba(light, 0.6);
      polygon(ctx, [
        [0, -r * 1.1],
        [r * 0.3, 0],
        [0, r * 0.2],
        [-r * 0.3, 0],
      ]);
      ctx.fill();
      break;
    case 'bolt':
      ctx.fillStyle = light;
      polygon(ctx, [
        [r * 0.25, -r * 1.15],
        [-r * 0.45, r * 0.1],
        [-r * 0.02, r * 0.1],
        [-r * 0.3, r * 1.15],
        [r * 0.5, -r * 0.2],
        [r * 0.05, -r * 0.2],
      ]);
      ctx.fill();
      ctx.lineWidth = r * 0.12;
      ctx.strokeStyle = color;
      ctx.stroke();
      break;
    case 'lens': {
      ctx.fillStyle = grad(light, color);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.05, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba(light, 0.9);
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'feather':
      ctx.fillStyle = grad(light, color);
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.2);
      ctx.quadraticCurveTo(r * 0.7, -r * 0.2, 0, r * 1.2);
      ctx.quadraticCurveTo(-r * 0.7, -r * 0.2, 0, -r * 1.2);
      ctx.fill();
      ctx.strokeStyle = rgba(light, 0.7);
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.1);
      ctx.lineTo(0, r * 1.2);
      ctx.stroke();
      break;
    case 'petal':
      ctx.fillStyle = grad(light, color);
      ctx.beginPath();
      ctx.moveTo(0, r * 1.1);
      ctx.bezierCurveTo(r * 1.0, r * 0.2, r * 0.5, -r * 1.0, 0, -r * 1.1);
      ctx.bezierCurveTo(-r * 0.5, -r * 1.0, -r * 1.0, r * 0.2, 0, r * 1.1);
      ctx.fill();
      break;
    case 'square':
      ctx.fillStyle = grad(light, color);
      ctx.fillRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5);
      break;
    case 'streak':
      // Handled by makeStreak (elongated sprite).
      break;
  }
}

const cache = new Map<string, HTMLCanvasElement>();

/** Glowing sprite for a shape. The core fills the inner half, the glow the rest. */
export function sprite(shape: ParticleShape, color: string, glow = true): HTMLCanvasElement {
  const key = `${shape}|${color}|${glow ? 1 : 0}`;
  let c = cache.get(key);
  if (c) return c;
  if (shape === 'streak') {
    c = makeStreak(color);
    cache.set(key, c);
    return c;
  }
  const S = SPRITE_SIZE;
  c = makeCanvas(S, S);
  const ctx = c.getContext('2d')!;
  ctx.translate(S / 2, S / 2);
  if (glow && shape !== 'cloud') {
    const [r, g, b] = parseColor(color);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, S / 2);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
    gr.addColorStop(0.35, `rgba(${r},${g},${b},0.22)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(-S / 2, -S / 2, S, S);
  }
  drawShape(ctx, shape, (S / 2) * CORE * (shape === 'cloud' ? 0.95 : 1), color);
  cache.set(key, c);
  return c;
}

/** Elongated streak sprite pointing along +x (head on the right). */
function makeStreak(color: string): HTMLCanvasElement {
  const W = 128;
  const H = 24;
  const c = makeCanvas(W, H);
  const ctx = c.getContext('2d')!;
  const [r, g, b] = parseColor(color);
  const lg = ctx.createLinearGradient(0, 0, W, 0);
  lg.addColorStop(0, `rgba(${r},${g},${b},0)`);
  lg.addColorStop(0.7, `rgba(${r},${g},${b},0.5)`);
  lg.addColorStop(1, `rgba(255,255,255,1)`);
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W - H / 2, H * 0.22);
  ctx.arc(W - H / 2, H / 2, H * 0.28, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(W - H / 2, H * 0.78);
  ctx.closePath();
  ctx.fill();
  const gl = ctx.createRadialGradient(W - H / 2, H / 2, 0, W - H / 2, H / 2, H / 2);
  gl.addColorStop(0, `rgba(${r},${g},${b},0.7)`);
  gl.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gl;
  ctx.fillRect(W - H, 0, H, H);
  return c;
}

/** Soft radial glow sprite (for cores, flashes, atmospheres). */
export function glowSprite(color: string, hardness = 0.2): HTMLCanvasElement {
  const key = `glow|${color}|${hardness}`;
  let c = cache.get(key);
  if (c) return c;
  const S = 128;
  c = makeCanvas(S, S);
  const ctx = c.getContext('2d')!;
  const [r, g, b] = parseColor(color);
  const gr = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(hardness, `rgba(${r},${g},${b},0.6)`);
  gr.addColorStop(0.6, `rgba(${r},${g},${b},0.15)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, S, S);
  cache.set(key, c);
  return c;
}

export function clearSpriteCache(): void {
  cache.clear();
}
