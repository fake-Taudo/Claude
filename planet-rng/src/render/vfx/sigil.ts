// Bakes sigil / mandala patterns into a texture. Strokes get a soft glow by layered
// passes (wide and faint -> thin and hot), so the runtime only draws one image.

import type { SigilElement } from '../../config/vfx/types';
import { mix, rgba } from '../color';
import { Rng, TAU } from './math';
import { bakeTex } from './tex';

/** Texture half size relative to the sigil radius (room for the glow). */
export const SIGIL_PAD = 1.12;

type Stroke = (ctx: CanvasRenderingContext2D) => void;

/** Draws a path with a glow: four passes from wide/faint to thin/hot. */
function glowStroke(ctx: CanvasRenderingContext2D, path: Stroke, width: number, color: string, alpha: number, glow: number): void {
  const passes: [number, number, string][] = [
    [width * (3 + 5 * glow), 0.06 * glow, color],
    [width * (1.8 + 2 * glow), 0.14 * glow, color],
    [width, 0.7, color],
    [width * 0.4, 0.55, mix(color, '#ffffff', 0.6)],
  ];
  for (const [w, a, c] of passes) {
    ctx.lineWidth = Math.max(0.6, w);
    ctx.strokeStyle = rgba(c, a * alpha);
    ctx.beginPath();
    path(ctx);
    ctx.stroke();
  }
}

const NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

/** Simple invented glyph strokes (letters of a star alphabet). */
function glyph(ctx: CanvasRenderingContext2D, seed: number, s: number): void {
  const rng = new Rng(seed * 2654435761);
  const kind = Math.floor(rng.next() * 5);
  if (kind === 0) {
    ctx.moveTo(-s, s);
    ctx.lineTo(0, -s);
    ctx.lineTo(s, s);
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(s * 0.5, 0);
  } else if (kind === 1) {
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s);
    ctx.moveTo(-s * 0.7, -s * 0.3);
    ctx.lineTo(s * 0.7, -s * 0.7);
    ctx.moveTo(-s * 0.7, s * 0.4);
    ctx.lineTo(s * 0.5, s * 0.1);
  } else if (kind === 2) {
    ctx.moveTo(s * 0.8, -s * 0.6);
    ctx.arc(0, 0, s * 0.8, -0.6, Math.PI + 0.6);
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s * 0.3);
  } else if (kind === 3) {
    ctx.moveTo(-s, -s);
    ctx.lineTo(s, s);
    ctx.moveTo(s, -s);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.moveTo(-s * 0.6, s);
    ctx.lineTo(s * 0.6, s);
  } else {
    ctx.moveTo(-s * 0.8, 0);
    ctx.arc(-s * 0.2, 0, s * 0.6, Math.PI, 0);
    ctx.lineTo(s * 0.4, s);
    ctx.moveTo(-s * 0.8, s * 0.6);
    ctx.lineTo(s * 0.2, s * 0.6);
  }
}

/** Zodiac-like symbols of our own design (no real-world sign shapes copied). */
function zodiac(ctx: CanvasRenderingContext2D, i: number, s: number): void {
  switch (i % 6) {
    case 0:
      ctx.arc(-s * 0.45, 0, s * 0.45, 0, TAU);
      ctx.moveTo(s * 0.9, 0);
      ctx.arc(s * 0.45, 0, s * 0.45, 0, TAU);
      break;
    case 1:
      ctx.moveTo(-s, s * 0.5);
      ctx.quadraticCurveTo(0, -s * 1.2, s, s * 0.5);
      ctx.moveTo(0, -s * 0.3);
      ctx.lineTo(0, s);
      break;
    case 2:
      ctx.moveTo(-s, -s * 0.4);
      ctx.lineTo(s, -s * 0.4);
      ctx.moveTo(-s, s * 0.4);
      ctx.lineTo(s, s * 0.4);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      break;
    case 3:
      ctx.moveTo(s * 0.6, -s * 0.8);
      ctx.arc(0, 0, s * 0.8, -1, Math.PI * 1.1);
      ctx.moveTo(-s * 0.2, 0);
      ctx.arc(0, 0, s * 0.2, 0, TAU);
      break;
    case 4:
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * TAU - Math.PI / 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.moveTo(s * 0.35, 0);
      ctx.arc(0, 0, s * 0.35, 0, TAU);
      break;
    default:
      ctx.moveTo(-s, s);
      ctx.lineTo(-s * 0.3, -s);
      ctx.lineTo(s * 0.3, s);
      ctx.lineTo(s, -s);
  }
}

/**
 * Bakes a sigil. Element radii and widths are fractions of the sigil radius.
 * resolve maps colour references to hex.
 */
/**
 * Bakes a sigil pattern into a square texture of `size` pixels (line widths scale with it,
 * so a larger texture only adds sharpness). Cached in the shared texture cache.
 */
export function sigilTex(key: string, pattern: SigilElement[], color: string, glow: number, resolve: (c: string) => string, size = 512): HTMLCanvasElement {
  return bakeTex(`sigil|${key}|${color}|${glow}|${size}`, () => bakeSigil(pattern, color, glow, resolve, size));
}

function bakeSigil(pattern: SigilElement[], color: string, glow: number, resolve: (c: string) => string, SIZE: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d')!;
  const R = SIZE / 2 / SIGIL_PAD;
  ctx.translate(SIZE / 2, SIZE / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  let seed = 1;
  for (const el of pattern) {
    seed++;
    const col = el.c ? resolve(el.c) : color;
    const a = el.a ?? 1;
    switch (el.e) {
      case 'ring':
        glowStroke(ctx, (x) => x.arc(0, 0, el.r * R, 0, TAU), el.w * R, col, a, glow);
        break;
      case 'band': {
        // Gaussian annulus of light written as gradient stops.
        const r0 = Math.max(0, el.r - el.w * 1.6);
        const r1 = el.r + el.w * 1.6;
        const g = ctx.createRadialGradient(0, 0, r0 * R, 0, 0, r1 * R);
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          const x = ((r0 + (r1 - r0) * t - el.r) / el.w) * 1.3;
          g.addColorStop(t, rgba(i === 5 ? mix(col, '#ffffff', 0.25) : col, a * Math.exp(-x * x)));
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r1 * R, 0, TAU);
        ctx.arc(0, 0, r0 * R, 0, TAU, true);
        ctx.fill();
        break;
      }
      case 'ticks':
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i < el.n; i++) {
              const ang = (i / el.n) * TAU;
              const long = i % 4 === 0 ? 1.6 : 1;
              x.moveTo(Math.cos(ang) * el.r * R, Math.sin(ang) * el.r * R);
              x.lineTo(Math.cos(ang) * (el.r - el.len * long) * R, Math.sin(ang) * (el.r - el.len * long) * R);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      case 'poly': {
        const step = el.step ?? 1;
        const rot = ((el.rot ?? -90) * Math.PI) / 180;
        glowStroke(
          ctx,
          (x) => {
            const visited = new Set<number>();
            for (let s0 = 0; s0 < el.n; s0++) {
              if (visited.has(s0)) continue;
              let i = s0;
              x.moveTo(Math.cos(rot + (i / el.n) * TAU) * el.r * R, Math.sin(rot + (i / el.n) * TAU) * el.r * R);
              do {
                visited.add(i);
                i = (i + step) % el.n;
                x.lineTo(Math.cos(rot + (i / el.n) * TAU) * el.r * R, Math.sin(rot + (i / el.n) * TAU) * el.r * R);
              } while (i !== s0);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      }
      case 'runes':
        for (let i = 0; i < el.n; i++) {
          const ang = (i / el.n) * TAU;
          ctx.save();
          ctx.rotate(ang + Math.PI / 2);
          ctx.translate(0, -el.r * R);
          glowStroke(ctx, (x) => glyph(x, i * 31 + seed * 7, el.size * R), el.w * R, col, a, glow);
          ctx.restore();
        }
        break;
      case 'numerals':
        ctx.font = `600 ${Math.round(el.size * R)}px Georgia, 'Times New Roman', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < el.n; i++) {
          const ang = (i / el.n) * TAU - Math.PI / 2;
          ctx.save();
          ctx.translate(Math.cos(ang) * el.r * R, Math.sin(ang) * el.r * R);
          ctx.rotate(ang + Math.PI / 2);
          const text = NUMERALS[i % 12];
          for (const [w, al] of [[el.w * R * 5, 0.12], [el.w * R * 2.2, 0.3]] as [number, number][]) {
            ctx.lineWidth = w;
            ctx.strokeStyle = rgba(col, al * a * glow);
            ctx.strokeText(text, 0, 0);
          }
          ctx.fillStyle = rgba(mix(col, '#ffffff', 0.5), a);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
        break;
      case 'zodiac':
        for (let i = 0; i < el.n; i++) {
          const ang = (i / el.n) * TAU - Math.PI / 2;
          ctx.save();
          ctx.translate(Math.cos(ang) * el.r * R, Math.sin(ang) * el.r * R);
          ctx.rotate(ang + Math.PI / 2);
          glowStroke(ctx, (x) => zodiac(x, i, el.size * R), el.w * R, col, a, glow);
          ctx.restore();
        }
        break;
      case 'dots':
        for (let i = 0; i < el.n; i++) {
          const ang = (i / el.n) * TAU;
          const x0 = Math.cos(ang) * el.r * R;
          const y0 = Math.sin(ang) * el.r * R;
          const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, el.size * R * 2.4);
          g.addColorStop(0, rgba('#ffffff', a));
          g.addColorStop(0.25, rgba(col, a * 0.9));
          g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g;
          ctx.fillRect(x0 - el.size * R * 2.4, y0 - el.size * R * 2.4, el.size * R * 4.8, el.size * R * 4.8);
        }
        break;
      case 'spiral': {
        const r0 = el.r0 ?? 0.1;
        glowStroke(
          ctx,
          (x) => {
            for (let k = 0; k < el.arms; k++) {
              const off = (k / el.arms) * TAU;
              for (let i = 0; i <= 120; i++) {
                const t = i / 120;
                const r = (r0 + (1 - r0) * t) * R;
                const ang = off + t * el.turns * TAU;
                if (i === 0) x.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                else x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
              }
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      }
      case 'cracks': {
        const rng = new Rng(seed * 977 + el.n);
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i < el.n; i++) {
              let ang = (i / el.n) * TAU + rng.range(-0.2, 0.2);
              let r = el.r0 * R;
              x.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
              const steps = 6;
              for (let s = 1; s <= steps; s++) {
                r = (el.r0 + ((el.r1 - el.r0) * s) / steps) * R;
                ang += rng.range(-0.12, 0.12);
                x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                if (s === 3 && rng.next() < 0.7) {
                  const b = ang + rng.sign() * 0.25;
                  x.lineTo(Math.cos(b) * r * 1.15, Math.sin(b) * r * 1.15);
                  x.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                }
              }
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      }
      case 'petals': {
        const rot = ((el.rot ?? 0) * Math.PI) / 180;
        const path = (x: CanvasRenderingContext2D) => {
          for (let i = 0; i < el.n; i++) {
            const ang = rot + (i / el.n) * TAU;
            const ca = Math.cos(ang);
            const sa = Math.sin(ang);
            const r0 = el.r * R;
            const r1 = (el.r + el.len) * R;
            const w = ((TAU / el.n) * 0.42 * (el.r + el.len * 0.5) * R);
            const mx = (r0 + r1) / 2;
            const p = (u: number, v: number) => [ca * u - sa * v, sa * u + ca * v] as const;
            const [ax, ay] = p(r0, 0);
            const [bx, by] = p(mx, w);
            const [cx, cy] = p(r1, 0);
            const [dx, dy] = p(mx, -w);
            x.moveTo(ax, ay);
            x.quadraticCurveTo(bx, by, cx, cy);
            x.quadraticCurveTo(dx, dy, ax, ay);
          }
        };
        if (el.fill) {
          // Light leaves: bright at the base, fading toward the tip.
          const g = ctx.createRadialGradient(0, 0, el.r * R, 0, 0, (el.r + el.len) * R);
          g.addColorStop(0, rgba(mix(col, '#ffffff', 0.5), el.fill * a));
          g.addColorStop(0.6, rgba(col, el.fill * a * 0.55));
          g.addColorStop(1, rgba(col, el.fill * a * 0.1));
          ctx.fillStyle = g;
          ctx.beginPath();
          path(ctx);
          ctx.fill();
        }
        if (el.w > 0) glowStroke(ctx, path, el.w * R, col, a, glow);
        break;
      }
      case 'rays':
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i < el.n; i++) {
              const ang = (i / el.n) * TAU;
              const long = i % 2 === 0 ? 1 : 0.8;
              x.moveTo(Math.cos(ang) * el.r0 * R, Math.sin(ang) * el.r0 * R);
              x.lineTo(Math.cos(ang) * (el.r0 + (el.r1 - el.r0) * long) * R, Math.sin(ang) * (el.r0 + (el.r1 - el.r0) * long) * R);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      case 'disc': {
        const soft = el.soft ?? 0.3;
        ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, el.r * R);
        g.addColorStop(0, rgba(col, el.a));
        g.addColorStop(Math.max(0, 1 - soft), rgba(col, el.a));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
        ctx.globalCompositeOperation = 'lighter';
        break;
      }
      case 'circles':
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i < el.n; i++) {
              const ang = (i / el.n) * TAU - Math.PI / 2;
              const cx = Math.cos(ang) * el.r * R;
              const cy = Math.sin(ang) * el.r * R;
              x.moveTo(cx + el.cr * R, cy);
              x.arc(cx, cy, el.cr * R, 0, TAU);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      case 'grid':
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i < el.n; i++) {
              const ang = (i / el.n) * TAU;
              x.moveTo(0, 0);
              x.lineTo(Math.cos(ang) * el.r * R, Math.sin(ang) * el.r * R);
            }
            for (let k = 1; k <= 4; k++) {
              x.moveTo((k / 4) * el.r * R, 0);
              x.arc(0, 0, (k / 4) * el.r * R, 0, TAU);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
      case 'lattice':
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, el.r * R, 0, TAU);
        ctx.clip();
        glowStroke(
          ctx,
          (x) => {
            for (let i = -el.n; i <= el.n; i++) {
              const v = (i / el.n) * el.r * R;
              x.moveTo(v, -el.r * R);
              x.lineTo(v, el.r * R);
              x.moveTo(-el.r * R, v);
              x.lineTo(el.r * R, v);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        ctx.restore();
        break;
      case 'waves':
        glowStroke(
          ctx,
          (x) => {
            for (let i = 0; i <= 240; i++) {
              const ang = (i / 240) * TAU;
              const r = (el.r + el.amp * Math.sin(ang * el.n)) * R;
              if (i === 0) x.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
              else x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            }
          },
          el.w * R,
          col,
          a,
          glow,
        );
        break;
    }
  }
  return c;
}

const blooms = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

/**
 * Blurred copy of a texture (downsample to 1/16, upsample to 1/4): drawn additively
 * underneath the sharp texture it gives a cheap bloom.
 */
export function bloomOf(tex: HTMLCanvasElement): HTMLCanvasElement {
  let b = blooms.get(tex);
  if (b) return b;
  const small = document.createElement('canvas');
  small.width = Math.max(4, Math.round(tex.width / 16));
  small.height = Math.max(4, Math.round(tex.height / 16));
  const sctx = small.getContext('2d')!;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(tex, 0, 0, small.width, small.height);
  const mid = document.createElement('canvas');
  mid.width = Math.max(8, Math.round(tex.width / 4));
  mid.height = Math.max(8, Math.round(tex.height / 4));
  const mctx = mid.getContext('2d')!;
  mctx.imageSmoothingQuality = 'high';
  mctx.globalCompositeOperation = 'lighter';
  // Slightly offset copies widen the blur without a filter.
  const o = mid.width / small.width;
  for (const [dx, dy] of [[0, 0], [o, 0], [-o, 0], [0, o], [0, -o]]) {
    mctx.globalAlpha = dx === 0 && dy === 0 ? 0.4 : 0.15;
    mctx.drawImage(small, dx, dy, mid.width, mid.height);
  }
  blooms.set(tex, mid);
  b = mid;
  return b;
}
