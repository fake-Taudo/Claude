// Painters of the CoreMotif kinds. Each draws around the origin in symbol units (60 units =
// the base size) after the motif transform (position, size, spin) is applied.
// `prog` and `aux` are the motif's kind specific progress values (see CoreMotifParams).

import type { CoreMotifParams, MotifKind, SymbolLayer } from '../../config/cutscenes';
import { hash01, mix, rgba, spectral } from '../color';
import { noise1 } from '../vfx/math';
import { glowTex, spiralTex } from '../vfx/tex';
import { TAU, type Env } from './core';
import { drawSymbol } from './symbol';

export type Painter = (ctx: CanvasRenderingContext2D, prm: CoreMotifParams, env: Env, pal: string[], prog: number, aux: number, scale: number) => void;

/** Default symbol: the prototype's soft glow with a four-pointed star. */
const CLASSIC: SymbolLayer[] = [
  { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
  { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
  { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
];

function glow(ctx: CanvasRenderingContext2D, col: string, r: number, a: number, profile: 'soft' | 'core' = 'soft'): void {
  const prev = ctx.globalAlpha;
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = prev * a;
  ctx.drawImage(glowTex(col, profile), -r, -r, r * 2, r * 2);
  ctx.globalAlpha = prev;
  ctx.globalCompositeOperation = op;
}

/** Stroke with a soft glow: wide faint, medium, thin bright. */
function glowStroke(ctx: CanvasRenderingContext2D, col: string, w: number, a: number, path: () => void): void {
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
function disc(ctx: CanvasRenderingContext2D, env: Env, pal: string[], r0: number, r1: number, tilt: number, half: 'back' | 'front', bright: number): void {
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

export const PAINTERS: Record<MotifKind, Painter> = {
  circleStar(ctx, prm, env, pal) {
    drawSymbol(ctx, prm.layers ?? CLASSIC, pal, env.time);
  },

  // Dark centre, photon ring, tilted accretion disc in front of and behind it.
  blackHole(ctx, prm, env, pal, _prog, aux) {
    const tilt = prm.tilt ?? 0.3;
    glow(ctx, pal[0], 46, 0.35);
    disc(ctx, env, pal, 17, 36, tilt, 'back', 1);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.fill();
    glowStroke(ctx, pal[2] ?? '#ffffff', 0.9 + aux, 1, () => {
      ctx.beginPath();
      ctx.arc(0, 0, 14.6, 0, TAU);
    });
    disc(ctx, env, pal, 17, 36, tilt, 'front', 1);
  },

  // Infinity band of light that draws itself (prog = drawn part), spectrum running along it.
  lemniscate(ctx, prm, env, pal, prog) {
    const r = 30;
    const n = 120;
    const end = Math.max(1, Math.round(n * Math.min(1, prog)));
    const pt = (s: number): [number, number] => {
      const d = 1 + Math.sin(s) ** 2;
      return [(r * Math.cos(s)) / d, (r * Math.sin(s) * Math.cos(s)) / d];
    };
    const spectrumOn = prm.palette?.includes('spectrum');
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const step = 4;
    for (let i = 0; i < end; i += step) {
      const s0 = (i / n) * TAU;
      const s1 = (Math.min(end, i + step) / n) * TAU;
      const col = spectrumOn ? spectral(env.time * 70 + (i / n) * 360) : mix(pal[0], pal[1], 0.5 + 0.5 * Math.sin(i * 0.1 + env.time));
      for (const [w, a, c] of [
        [7, 0.12, col],
        [3, 0.45, col],
        [1.2, 0.95, '#ffffff'],
      ] as [number, number, string][]) {
        ctx.strokeStyle = rgba(c, a);
        ctx.lineWidth = w;
        ctx.beginPath();
        let [x, y] = pt(s0);
        ctx.moveTo(x, y);
        for (let k = 1; k <= 4; k++) {
          [x, y] = pt(s0 + ((s1 - s0) * k) / 4);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    if (prog < 1) {
      const [hx, hy] = pt((end / n) * TAU);
      ctx.save();
      ctx.translate(hx, hy);
      glow(ctx, '#ffffff', 9, 0.9, 'core');
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  // Quasar: white core, flat ring, two vertical jets (prog = jet length up to the screen edge).
  jets(ctx, prm, env, pal, prog, aux, scale) {
    const tilt = prm.tilt ?? 0.22;
    const reach = (env.H * 0.62) / Math.max(1e-3, scale);
    const L = 10 + Math.max(0, prog) * reach;
    const flick = 0.85 + 0.15 * noise1(env.time * 18, 3);
    glow(ctx, pal[0], 40 + aux * 30, 0.5 + aux * 0.4);
    disc(ctx, env, pal, 9, 26, tilt, 'back', 0.9);
    ctx.globalCompositeOperation = 'lighter';
    for (const dir of [-1, 1]) {
      const w = (3.2 + aux * 4) * flick;
      const g = ctx.createLinearGradient(0, 0, 0, dir * L);
      g.addColorStop(0, rgba('#ffffff', 0.95));
      g.addColorStop(0.25, rgba(pal[0], 0.8));
      g.addColorStop(0.75, rgba(pal[1], 0.35));
      g.addColorStop(1, rgba(pal[1], 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-w, 0);
      ctx.quadraticCurveTo(-w * 0.4, (dir * L) / 2, 0, dir * L);
      ctx.quadraticCurveTo(w * 0.4, (dir * L) / 2, w, 0);
      ctx.closePath();
      ctx.fill();
      // Knots travelling outwards along the jet.
      for (let k = 0; k < 5; k++) {
        const f = (env.time * 0.6 + k / 5) % 1;
        ctx.save();
        ctx.translate(0, dir * f * L);
        glow(ctx, pal[0], 4 + 3 * (1 - f), (1 - f) * 0.8, 'core');
        ctx.restore();
      }
    }
    glow(ctx, '#ffffff', 10, 1, 'core');
    disc(ctx, env, pal, 9, 26, tilt, 'front', 0.9);
  },

  // Moon: shaded sphere with craters; aux = eclipse shadow, prog = a glowing crack.
  moon(ctx, prm, _env, pal, prog, aux) {
    const r = 26;
    glow(ctx, pal[0], 48, 0.35);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    g.addColorStop(0, mix(pal[0], '#ffffff', 0.55));
    g.addColorStop(0.55, pal[0]);
    g.addColorStop(1, mix(pal[1], '#000000', 0.3));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    // Many small, faint craters (few big dark ones read as a face).
    for (let i = 0; i < 16; i++) {
      const a = hash01(i * 11 + (prm.seed ?? 0)) * TAU;
      const d = r * 0.85 * Math.sqrt(hash01(i * 7 + 3));
      const cr = r * (0.04 + 0.09 * hash01(i * 5 + 1) ** 2);
      ctx.fillStyle = rgba(mix(pal[1], '#000000', 0.3), 0.28);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, cr, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(mix(pal[0], '#ffffff', 0.4), 0.35);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d - 0.4, Math.sin(a) * d - 0.4, cr, Math.PI, Math.PI * 1.6);
      ctx.stroke();
    }
    if (aux > 0) {
      // The shadow slides in from the right; a thin rim of light remains.
      ctx.fillStyle = 'rgba(6,0,4,0.92)';
      ctx.beginPath();
      ctx.arc(r * 2.1 * (1 - aux), 0, r * 1.02, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    if (aux > 0.6) {
      glowStroke(ctx, pal[0], 0.8, (aux - 0.6) / 0.4, () => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
      });
    }
    if (prog > 0) {
      const pts: [number, number][] = [];
      for (let k = 0; k <= 8; k++) pts.push([(hash01(k * 3 + 1) - 0.5) * r * 0.5, -r + (2 * r * k) / 8]);
      const n = Math.max(1, Math.floor(prog * 8));
      glowStroke(ctx, pal[2] ?? '#ffffff', 0.7, 1, () => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k <= n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      });
    }
  },

  // Spiral galaxy seen at an angle; aux brings in a second galaxy that merges with it.
  galaxy(ctx, prm, env, pal, _prog, aux) {
    const tilt = prm.tilt ?? 0.55;
    const drawOne = (col: string, col2: string, R: number, dir: number, seed: number) => {
      ctx.save();
      ctx.scale(1, tilt);
      ctx.rotate(env.time * 0.35 * dir);
      ctx.globalCompositeOperation = 'lighter';
      const tex = spiralTex(col, col2, 2, 1.7, 0, seed);
      ctx.drawImage(tex, -R, -R, R * 2, R * 2);
      ctx.restore();
      glow(ctx, mix(col, '#ffffff', 0.6), R * 0.45, 0.9, 'core');
    };
    glow(ctx, pal[1], 60, 0.25);
    drawOne(pal[0], pal[1], 36, 1, prm.seed ?? 7);
    if (aux > 0) {
      const k = Math.min(1, aux);
      ctx.save();
      ctx.translate(70 * (1 - k), -38 * (1 - k));
      ctx.globalAlpha *= Math.min(1, k * 3);
      drawOne(pal[2] ?? pal[1], pal[0], 22, -1, (prm.seed ?? 7) + 3);
      ctx.restore();
    }
  },

  // Clock: dial, ticks and two hands (prog = minute hand turns, aux = hour hand turns).
  clock(ctx, _prm, _env, pal, prog, aux) {
    const r = 30;
    glow(ctx, pal[0], 52, 0.3);
    glowStroke(ctx, pal[0], 1.2, 1, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
    });
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      const big = i % 5 === 0;
      ctx.strokeStyle = rgba(pal[0], big ? 0.95 : 0.4);
      ctx.lineWidth = big ? 1.6 : 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - (big ? 5 : 2.5)), Math.sin(a) * (r - (big ? 5 : 2.5)));
      ctx.lineTo(Math.cos(a) * (r - 0.8), Math.sin(a) * (r - 0.8));
      ctx.stroke();
    }
    for (const [turns, len, w] of [
      [aux, 0.55, 2.6],
      [prog, 0.85, 1.6],
    ] as [number, number, number][]) {
      const a = turns * TAU - Math.PI / 2;
      glowStroke(ctx, pal[1], w * 0.6, 1, () => {
        ctx.beginPath();
        ctx.moveTo(-Math.cos(a) * r * 0.12, -Math.sin(a) * r * 0.12);
        ctx.lineTo(Math.cos(a) * r * len, Math.sin(a) * r * len);
      });
    }
    glow(ctx, '#ffffff', 5, 1, 'core');
  },

  // Fallbacks until the remaining kinds are drawn individually.
  planet: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  comet: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  crystal: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  ring: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  bubbles: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  mandala: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  core: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  web: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  polygons: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  timeRings: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  mobius: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  cells: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  structure: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  halves: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
  heart: (c, p, e, pal) => PAINTERS.circleStar(c, p, e, pal, 0, 0, 1),
};
