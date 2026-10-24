// 2 FogLayers: coloured noise clouds in 2-4 layers with parallax (baked nebula textures).

import { CUTSCENE } from '../../../config/cutscenes';
import { mix } from '../../color';
import { nebulaTex } from '../../vfx/tex';
import { color, curve, TAU, type Block } from '../core';

/** Fog is soft: it is drawn at a quarter of the resolution and scaled up in one pass. */
const SCALE = 0.25;

export const FogLayers: Block<'FogLayers', { buf: HTMLCanvasElement | null }> = {
  space: 'world',
  init() {
    return { buf: null };
  },
  draw(target, _p, prm, theme, env, st) {
    const density = curve(prm.density, env.local, 0.6) * env.alpha;
    if (density <= 0.005) return;
    const bw = Math.max(16, Math.round(env.W * SCALE));
    const bh = Math.max(16, Math.round(env.H * SCALE));
    if (!st.buf || st.buf.width !== bw || st.buf.height !== bh) {
      st.buf = document.createElement('canvas');
      st.buf.width = bw;
      st.buf.height = bh;
    }
    const ctx = st.buf.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, bw, bh);
    ctx.scale(bw / env.W, bh / env.H);
    const n = Math.max(1, (prm.layers ?? 3) + CUTSCENE.quality[env.quality].fog);
    // Greying in 5 steps keeps the number of baked textures small.
    const grey = Math.round(curve(prm.grey, env.local, 0) * 4) / 4;
    const cols = (prm.colors ?? ['fog', 'dark']).map((c, i) => {
      const hex = color(theme, c, 0, i * 120);
      return grey > 0 ? mix(hex, '#6a6e78', grey) : hex;
    });
    const speed = (prm.speed ?? 1) * env.u;
    const [dx, dy] = prm.drift ?? [1, -0.25];
    const band = prm.band ?? 'full';
    const seed = prm.seed ?? 5;
    const size = env.diag * 2 * (prm.scale ?? 1.1);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const depth = 1 / (1 + i * 0.7);
      const tex = nebulaTex(i % 2 ? [cols[1 % cols.length], cols[0]] : cols, seed + i * 3, 256);
      const s = size * (1 + i * 0.22);
      const ph = seed * 1.7 + i * 2.1;
      // Slow orbit plus drift (wraps around), nearer layers move faster.
      const drift = (env.local * speed * depth) % (s * 0.5);
      const x = env.cx + Math.cos(ph + env.local * 0.05 * depth) * env.diag * 0.18 + dx * drift - dx * s * 0.12;
      let y = env.cy + Math.sin(ph * 1.3 + env.local * 0.04 * depth) * env.diag * 0.14 + dy * drift - dy * s * 0.12;
      let sy = 1;
      if (band === 'bottom') {
        y = env.H * 0.98;
        sy = 0.45;
      } else if (band === 'top') {
        y = env.H * 0.02;
        sy = 0.45;
      }
      const a = density * (0.85 - i * 0.18);
      if (a <= 0) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ph + env.local * 0.02 * (i % 2 ? -1 : 1));
      ctx.scale(1, sy);
      if (band === 'ring') {
        for (let k = 0; k < 4; k++) {
          const ang = (k / 4) * TAU + 0.6;
          ctx.drawImage(tex, Math.cos(ang) * env.diag * 0.9 - s / 3, Math.sin(ang) * env.diag * 0.9 - s / 3, (s * 2) / 3, (s * 2) / 3);
        }
      } else {
        ctx.drawImage(tex, -s / 2, -s / 2, s, s);
      }
      ctx.restore();
    }
    target.globalCompositeOperation = 'lighter';
    target.globalAlpha = 1;
    target.drawImage(st.buf, 0, 0, env.W, env.H);
    target.globalCompositeOperation = 'source-over';
  },
};
