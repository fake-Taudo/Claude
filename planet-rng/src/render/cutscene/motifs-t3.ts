// Core motifs of the T3 films and the remaining basic kinds (planet, comet, crystal, ring).
// Same conventions as motifs.ts: symbol units around the origin (60 = base size).

import type { Curve } from '../../config/cutscenes';
import { hash01, luminance, mix, rgba, spectral } from '../color';
import { integral, TAU } from './core';
import type { Painter } from './motifs';
import { glow, glowStroke } from './paint';

const phase = (prm: { rate?: Curve }, local: number, base = 1): number => integral(prm.rate, local, base);

/** Colour as light (additive) or ink (dark colours on bright scenes). */
function inkStroke(ctx: CanvasRenderingContext2D, col: string, w: number, a: number, path: () => void): void {
  if (luminance(col) > 0.35) {
    glowStroke(ctx, col, w, a, path);
    return;
  }
  ctx.strokeStyle = rgba(col, a);
  ctx.lineWidth = w;
  path();
  ctx.stroke();
}

/** Spectral mandala: rings of petals build up (prog) and turn against each other (rate). */
const mandala: Painter = (ctx, prm, env, pal, prog) => {
  const rings = 6;
  const turn = phase(prm, env.local, 0.15);
  const spectrum = prm.palette?.includes('spectrum') ?? true;
  glow(ctx, '#ffffff', 46 * Math.min(1, prog + 0.2), 0.35);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < rings; i++) {
    const k = Math.min(1, Math.max(0, prog * rings - i));
    if (k <= 0) continue;
    const n = 6 + i * 2;
    const r = 7 + i * 5.2;
    const dir = i % 2 ? -1 : 1;
    const col = spectrum ? spectral(i * 55 + env.time * 40) : pal[i % pal.length];
    ctx.save();
    ctx.rotate(turn * TAU * dir * (1 + i * 0.15));
    ctx.scale(k, k);
    for (let p = 0; p < n; p++) {
      ctx.save();
      ctx.rotate((p / n) * TAU);
      ctx.translate(0, -r);
      const g = ctx.createLinearGradient(0, 3, 0, -4.5);
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.6, rgba(col, 0.75));
      g.addColorStop(1, rgba(mix(col, '#ffffff', 0.6), 0.95));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.quadraticCurveTo(2.4, -1, 0, -4.5);
      ctx.quadraticCurveTo(-2.4, -1, 0, 3);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = rgba(col, 0.35);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 3, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  glow(ctx, '#ffffff', 8, 1, 'core');
};

/** A zero: an upright ellipse ring of light (or ink on bright scenes). prog thickens it. */
const ring: Painter = (ctx, prm, _env, pal, prog) => {
  const col = pal[0];
  ctx.save();
  ctx.scale(prm.tilt ?? 0.72, 1);
  if (luminance(col) > 0.35) glow(ctx, col, 44, 0.3);
  inkStroke(ctx, col, 2.2 + prog * 3, 1, () => {
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, TAU);
  });
  ctx.restore();
};

/**
 * Nested polygons whose corner count grows (prog = corners, 3 .. 64 reads as a circle);
 * aux 0..1 locks them into one: rotations and radii converge.
 */
const polygons: Painter = (ctx, prm, env, pal, prog, aux) => {
  const corners = Math.max(3, prog);
  const lock = Math.min(1, aux);
  const turn = phase(prm, env.local, 0.2);
  for (let k = 0; k < 4; k++) {
    const n = Math.max(3, Math.round(corners - k));
    const r = 30 - k * 6 * (1 - lock);
    const rot = turn * TAU * (k % 2 ? -1 : 1) * (1 - lock) * (0.6 + k * 0.25);
    const col = pal[k % pal.length];
    ctx.save();
    ctx.rotate(rot);
    inkStroke(ctx, col, 1.1 - k * 0.15 + lock * 0.6, 1 - k * 0.12, () => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
    });
    if (n <= 12 && luminance(col) > 0.35) {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        ctx.save();
        ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
        glow(ctx, col, 2.6, 0.9, 'core');
        ctx.restore();
      }
    }
    ctx.restore();
  }
  if (lock > 0) glow(ctx, pal[0], 40, lock * 0.6);
};

/**
 * Rings of time: orbits with marker lights, each slower than the one inside (rate = flow of
 * time, negative runs it back). prog = how many rings exist (epochs).
 */
const timeRings: Painter = (ctx, prm, env, pal, prog) => {
  const n = 7;
  const ph = phase(prm, env.local, 0.4);
  const shown = Math.max(1, prog * n);
  for (let i = 0; i < n; i++) {
    const k = Math.min(1, Math.max(0, shown - i));
    if (k <= 0) continue;
    const r = 6 + i * 4.6;
    glowStroke(ctx, pal[i % 2 ? 1 : 0], 0.35, 0.55 * k, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
    });
    const a = (ph / Math.pow(1.55, i)) * TAU + hash01(i) * TAU;
    ctx.save();
    ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
    glow(ctx, pal[1] ?? pal[0], 3.4, k, 'core');
    ctx.restore();
  }
  // Tick marks of the outer dial.
  const R = 6 + n * 4.6;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(pal[0], 0.6);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const l = i % 4 ? 1.2 : 2.6;
    ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    ctx.lineTo(Math.cos(a) * (R + l), Math.sin(a) * (R + l));
  }
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  glow(ctx, '#ffffff', 5, 1, 'core');
};

/** Heart of the worlds: a beating core (rate in Hz); aux 0..1 unfolds petals of light. */
const heart: Painter = (ctx, prm, env, pal, _prog, aux) => {
  const ph = phase(prm, env.local, 1);
  const beat = Math.pow(Math.max(0, Math.cos(ph * TAU)), 12);
  const r = 10 * (1 + 0.2 * beat);
  const open = Math.min(1, aux);
  glow(ctx, pal[0], r * 5, 0.4 + 0.4 * beat);
  if (open > 0) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) {
      const col = spectral(i * 36 + env.time * 30);
      ctx.save();
      ctx.rotate((i / 10) * TAU + env.time * 0.2);
      const L = r * (1 + open * 3.2);
      const g = ctx.createLinearGradient(0, 0, 0, -L);
      g.addColorStop(0, rgba('#ffffff', 0.9 * open));
      g.addColorStop(0.5, rgba(col, 0.7 * open));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(r * 0.9 * open + 2, -L * 0.55, 0, -L);
      ctx.quadraticCurveTo(-r * 0.9 * open - 2, -L * 0.55, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, mix(pal[0], '#ffffff', 0.5));
  g.addColorStop(1, rgba(pal[1] ?? pal[0], 0.2));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  glowStroke(ctx, pal[1] ?? pal[0], 0.6, 0.6 + 0.4 * beat, () => {
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, TAU);
  });
};

/** Shaded planet with bands and a tilted ring (back half behind, front half in front). */
const planet: Painter = (ctx, prm, env, pal) => {
  const r = 20;
  const tilt = prm.tilt ?? 0.32;
  const ringPath = (front: boolean) => {
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.75, r * 1.75 * tilt, -0.25, front ? 0 : Math.PI, front ? Math.PI : TAU);
  };
  glowStroke(ctx, pal[1] ?? pal[0], 1.4, 0.8, () => ringPath(false));
  glow(ctx, pal[0], r * 2.2, 0.4);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.clip();
  const g = ctx.createRadialGradient(-r * 0.4, -r * 0.4, r * 0.1, 0, 0, r * 1.05);
  g.addColorStop(0, mix(pal[0], '#ffffff', 0.45));
  g.addColorStop(0.6, pal[0]);
  g.addColorStop(1, mix(pal[0], '#000000', 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  for (let i = 0; i < 6; i++) {
    const y = -r + (i + 0.5) * ((2 * r) / 6) + Math.sin(env.time + i) * 0.6;
    ctx.fillStyle = rgba(i % 2 ? (pal[1] ?? pal[0]) : '#000000', 0.18);
    ctx.fillRect(-r, y - 1.4, r * 2, 2.2 + hash01(i) * 1.5);
  }
  ctx.restore();
  glowStroke(ctx, pal[1] ?? pal[0], 1.4, 1, () => ringPath(true));
};

/** Comet: icy nucleus with a long tail pointing away from the centre of the screen. */
const comet: Painter = (ctx, _prm, env, pal) => {
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const L = 50 + k * 14;
    const w = 6 - k * 1.6;
    const g = ctx.createLinearGradient(0, 0, -L, -L * 0.35);
    g.addColorStop(0, rgba(mix(pal[k % pal.length], '#ffffff', 0.4), 0.8 - k * 0.2));
    g.addColorStop(1, rgba(pal[k % pal.length], 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -w);
    ctx.quadraticCurveTo(-L * 0.5, -L * 0.17 - w * 1.5, -L, -L * 0.35);
    ctx.quadraticCurveTo(-L * 0.5, -L * 0.17 + w * 1.5, 0, w);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 10; i++) {
    const f = (env.time * 0.8 + hash01(i)) % 1;
    ctx.save();
    ctx.translate(-f * 60, -f * 21 + (hash01(i + 3) - 0.5) * 8 * f);
    glow(ctx, pal[0], 2.4 * (1 - f), 1 - f, 'core');
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  glow(ctx, '#ffffff', 9, 1, 'core');
};

/** Faceted crystal: a hexagonal gem with light and dark facets and travelling glints. */
const crystal: Painter = (ctx, _prm, env, pal) => {
  const r = 24;
  glow(ctx, pal[0], r * 2.2, 0.45);
  const top: [number, number] = [0, -r * 1.25];
  const bottom: [number, number] = [0, r * 1.25];
  const ring: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + env.time * 0.4;
    ring.push([Math.cos(a) * r, Math.sin(a) * r * 0.32]);
  }
  for (let i = 0; i < 6; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 6];
    const facing = Math.cos((i / 6) * TAU + env.time * 0.4 + 0.5);
    for (const tip of [top, bottom]) {
      const shade = 0.5 + 0.4 * facing * (tip === top ? 1 : -0.6);
      ctx.fillStyle = rgba(mix(pal[i % 2 ? 1 : 0] ?? pal[0], shade > 0.6 ? '#ffffff' : '#000000', Math.abs(shade - 0.6)), 0.85);
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.closePath();
      ctx.fill();
    }
  }
  glowStroke(ctx, mix(pal[0], '#ffffff', 0.6), 0.4, 0.8, () => {
    ctx.beginPath();
    for (const p of ring) {
      ctx.moveTo(top[0], top[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.lineTo(bottom[0], bottom[1]);
    }
  });
};

export const T3_PAINTERS = { mandala, ring, polygons, timeRings, heart, planet, comet, crystal };
