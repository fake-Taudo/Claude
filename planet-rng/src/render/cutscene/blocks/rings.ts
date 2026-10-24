// 11 GravityRings: rings that shrink towards the centre (implosion, gravity pull) or run out
// as a shockwave.

import { rgba } from '../../color';
import { color, TAU, type Block } from '../core';

export const GravityRings: Block<'GravityRings'> = {
  space: 'world',
  draw(ctx, _p, prm, theme, env) {
    const n = prm.count ?? 3;
    const stagger = prm.stagger ?? 0.18;
    const span = Math.max(0.1, env.dur - stagger * (n - 1));
    const out = prm.direction === 'out';
    const from = prm.from ?? (out ? 0.02 : 1.15);
    const to = prm.to ?? (out ? 1.25 : 0.02);
    const w0 = (prm.width ?? 1.6) * env.u;
    const cols = (prm.colors ?? ['primary']).map((c, i) => color(theme, c, env.time, i * 50));
    const x = env.cx + (prm.x ?? 0) * env.u;
    const y = env.cy + (prm.y ?? 0) * env.u;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const k = (env.local - i * stagger) / span;
      if (k <= 0 || k >= 1) continue;
      const e = out ? 1 - Math.pow(1 - k, 2.2) : Math.pow(k, 2.4);
      const r = (from + (to - from) * e) * env.diag;
      const a = env.alpha * (out ? Math.pow(1 - k, 1.3) : Math.min(1, k * 3) * (1 - Math.pow(k, 6)));
      const w = w0 * (out ? 1 - 0.6 * k : 0.6 + 0.8 * k);
      const col = cols[i % cols.length];
      for (const [mul, al] of [
        [5, 0.1],
        [2.2, 0.3],
        [1, 0.9],
      ] as [number, number][]) {
        ctx.strokeStyle = rgba(al === 0.9 ? '#ffffff' : col, al * a);
        ctx.lineWidth = Math.max(1, w * mul * (al === 0.9 ? 0.45 : 1));
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, r), 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};
