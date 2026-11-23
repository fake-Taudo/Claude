// Shared drawing helpers for motifs: additive glow sprites, glowing strokes, accretion discs.

import { mix, rgba } from '../color';
import { glowTex } from '../vfx/tex';
import type { Env } from './core';

export function glow(ctx: CanvasRenderingContext2D, col: string, r: number, a: number, profile: 'soft' | 'core' = 'soft'): void {
  const prev = ctx.globalAlpha;
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = prev * a;
  ctx.drawImage(glowTex(col, profile), -r, -r, r * 2, r * 2);
  ctx.globalAlpha = prev;
  ctx.globalCompositeOperation = op;
}

/** Stroke with a soft glow: wide faint, medium, thin bright. */
export function glowStroke(ctx: CanvasRenderingContext2D, col: string, w: number, a: number, path: () => void): void {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  for (const [k, al, c] of [
    [4, 0.12, col],
    [2, 0.35, col],
    [0.8, 0.95, mix(col, '#ffffff', 0.6)],
  ] as [number, number, string][]) {
    ctx.strokeStyle = rgba(c, al * a);
    ctx.lineWidth = w * k;
    path();
    ctx.stroke();
  }
  ctx.globalCompositeOperation = op;
}

/** Flowing accretion disc: thin elliptic streams, back or front half. */
export function disc(ctx: CanvasRenderingContext2D, env: Env, pal: string[], r0: number, r1: number, tilt: number, half: 'back' | 'front', bright: number): void {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  const n = 14;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1);
    const r = r0 + (r1 - r0) * f;
    const col = mix(pal[0], pal[1], f);
    const flow = env.time * (2.2 - f * 1.4);
    const a = bright * (0.55 - 0.4 * f) * (0.7 + 0.3 * Math.sin(flow * 3 + i));
    ctx.strokeStyle = rgba(i < 3 ? mix(col, '#ffffff', 0.5) : col, a);
    ctx.lineWidth = 1.6 + (1 - f) * 1.4;
    ctx.beginPath();
    const a0 = half === 'front' ? 0 : Math.PI;
    ctx.ellipse(0, 0, r, r * tilt, 0, a0, a0 + Math.PI);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = op;
}
