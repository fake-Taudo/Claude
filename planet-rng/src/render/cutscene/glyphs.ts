// Small vector symbols (pulse symbols, particles, decorations), drawn around the origin with
// radius r. glyphTex() bakes one into a cached sprite with a soft halo.

import type { Glyph } from '../../config/cutscenes';
import { mix, rgba } from '../color';
import { bakeTex } from '../vfx/tex';

const TAU = Math.PI * 2;

function star(ctx: CanvasRenderingContext2D, n: number, r: number, inner: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}

function poly(ctx: CanvasRenderingContext2D, n: number, r: number, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

/** Draws a glyph with the current fill/stroke styles (fills solid shapes, strokes line shapes). */
export function drawGlyph(ctx: CanvasRenderingContext2D, g: Glyph, r: number): void {
  const w = Math.max(1, r * 0.12);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  switch (g) {
    case 'star4':
      star(ctx, 4, r, 0.3);
      ctx.fill();
      return;
    case 'star6':
      star(ctx, 6, r, 0.45);
      ctx.fill();
      return;
    case 'star8':
      star(ctx, 8, r, 0.42);
      ctx.fill();
      return;
    case 'ring':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, TAU);
      ctx.stroke();
      return;
    case 'zero':
      ctx.save();
      ctx.scale(0.72, 1);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.82, 0, TAU);
      ctx.lineWidth = w * 1.6;
      ctx.stroke();
      ctx.restore();
      return;
    case 'crescent':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, TAU);
      ctx.arc(r * 0.38, -r * 0.18, r * 0.72, 0, TAU, true);
      ctx.fill('evenodd');
      return;
    case 'snowflake':
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * TAU);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);
        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(-r * 0.22, -r * 0.75);
        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(r * 0.22, -r * 0.75);
        ctx.stroke();
        ctx.restore();
      }
      return;
    case 'hourglass':
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r);
      ctx.lineTo(r * 0.6, -r);
      ctx.lineTo(-r * 0.6, r);
      ctx.lineTo(r * 0.6, r);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.85);
      ctx.lineTo(r * 0.35, r * 0.85);
      ctx.lineTo(0, r * 0.35);
      ctx.closePath();
      ctx.fill();
      return;
    case 'infinity':
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) {
        const s = (i / 64) * TAU;
        const d = 1 + Math.sin(s) ** 2;
        const x = (r * Math.cos(s)) / d;
        const y = (r * Math.sin(s) * Math.cos(s)) / d;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = w * 1.3;
      ctx.stroke();
      return;
    case 'atom':
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i / 3) * Math.PI);
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.32, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.14, 0, TAU);
      ctx.fill();
      return;
    case 'hexagon':
      poly(ctx, 6, r * 0.9);
      ctx.stroke();
      return;
    case 'triangle':
      poly(ctx, 3, r);
      ctx.stroke();
      return;
    case 'square':
      poly(ctx, 4, r * 0.95, Math.PI / 4);
      ctx.stroke();
      return;
    case 'diamond':
      poly(ctx, 4, r);
      ctx.fill();
      return;
    case 'spiral':
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const f = i / 80;
        const a = f * TAU * 2.5;
        const rr = r * f;
        if (i === 0) ctx.moveTo(0, 0);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.stroke();
      return;
    case 'orbit':
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.4, -0.4, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, TAU);
      ctx.fill();
      return;
    case 'sun':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      return;
    case 'eye':
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, -r * 0.8, r, 0);
      ctx.quadraticCurveTo(0, r * 0.8, -r, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, TAU);
      ctx.fill();
      return;
    case 'feather':
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.quadraticCurveTo(r * 0.55, 0, 0, -r);
      ctx.quadraticCurveTo(-r * 0.55, 0, 0, r);
      ctx.fill();
      return;
    case 'drop':
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.2, -r * 0.5, r * 0.7, 0, r * 0.7, r * 0.3);
      ctx.arc(0, r * 0.3, r * 0.7, 0, Math.PI);
      ctx.bezierCurveTo(-r * 0.7, 0, -r * 0.2, -r * 0.5, 0, -r);
      ctx.fill();
      return;
    case 'bolt':
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r);
      ctx.lineTo(-r * 0.45, r * 0.1);
      ctx.lineTo(0, r * 0.1);
      ctx.lineTo(-r * 0.2, r);
      ctx.lineTo(r * 0.45, -r * 0.1);
      ctx.lineTo(0, -r * 0.1);
      ctx.closePath();
      ctx.fill();
      return;
    case 'cell':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.85, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.15, -r * 0.1, r * 0.3, 0, TAU);
      ctx.fill();
      return;
    case 'node':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      return;
    case 'gear': {
      const teeth = 8;
      ctx.beginPath();
      for (let i = 0; i < teeth * 2; i++) {
        const a0 = (i / (teeth * 2)) * TAU;
        const a1 = ((i + 1) / (teeth * 2)) * TAU;
        ctx.arc(0, 0, i % 2 ? r * 0.72 : r * 0.92, a0, a1);
      }
      ctx.closePath();
      ctx.arc(0, 0, r * 0.3, 0, TAU, true);
      ctx.fill('evenodd');
      return;
    }
    case 'heart':
      ctx.beginPath();
      ctx.moveTo(0, r * 0.9);
      ctx.bezierCurveTo(-r * 1.2, 0, -r * 0.6, -r * 0.95, 0, -r * 0.35);
      ctx.bezierCurveTo(r * 0.6, -r * 0.95, r * 1.2, 0, 0, r * 0.9);
      ctx.fill();
      return;
    case 'flower':
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i / 6) * TAU);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.5, r * 0.22, r * 0.5, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return;
  }
}

/** Baked glyph sprite: white-hot core in the colour, soft halo. Half size = 2 r. */
export function glyphTex(g: Glyph, color: string): HTMLCanvasElement {
  return bakeTex(`glyph|${g}|${color}`, () => {
    const S = 192;
    const c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    const ctx = c.getContext('2d')!;
    ctx.translate(S / 2, S / 2);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, S / 2);
    halo.addColorStop(0, rgba(color, 0.35));
    halo.addColorStop(0.45, rgba(color, 0.12));
    halo.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(-S / 2, -S / 2, S, S);
    const r = S / 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = S / 12;
    ctx.fillStyle = mix(color, '#ffffff', 0.55);
    ctx.strokeStyle = mix(color, '#ffffff', 0.55);
    drawGlyph(ctx, g, r);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.scale(0.9, 0.9);
    drawGlyph(ctx, g, r);
    return c;
  });
}
