// 6 EdgeGlow: the screen edges glow in the aura colour (one colour, or split left/right or
// top/bottom).

import { rgba } from '../../color';
import { color, curve, TAU, type Block } from '../core';

export const EdgeGlow: Block<'EdgeGlow'> = {
  space: 'screen',
  draw(ctx, _p, prm, theme, env) {
    let k = curve(prm.intensity, env.local, 0.8) * env.alpha;
    if (prm.pulse) k *= 0.8 + 0.2 * Math.sin(env.local * TAU * prm.pulse);
    if (k <= 0.005) return;
    const cols = (prm.colors ?? ['primary']).map((c, i) => color(theme, c, env.time, i * 120));
    const inset = prm.inset ?? 0.45;
    const { W, H, cx, cy, diag } = env;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, k);
    const split = prm.split ?? (cols.length > 1 ? 'lr' : 'none');
    if (split === 'none') {
      const g = ctx.createRadialGradient(cx, cy, diag * (1 - inset), cx, cy, diag);
      g.addColorStop(0, rgba(cols[0], 0));
      g.addColorStop(0.55, rgba(cols[0], 0.35));
      g.addColorStop(1, rgba(cols[0], 1));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else {
      const horizontal = split === 'lr';
      const L = (horizontal ? W : H) / 2;
      for (let s = 0; s < 2; s++) {
        const c = cols[s % cols.length];
        const g = horizontal
          ? ctx.createLinearGradient(s ? W : 0, 0, s ? W - L * inset * 2 : L * inset * 2, 0)
          : ctx.createLinearGradient(0, s ? H : 0, 0, s ? H - L * inset * 2 : L * inset * 2);
        g.addColorStop(0, rgba(c, 1));
        g.addColorStop(0.35, rgba(c, 0.35));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      // A soft vignette in the colours on the other axis keeps the corners from looking cut.
      const v = ctx.createRadialGradient(cx, cy, diag * 0.7, cx, cy, diag);
      v.addColorStop(0, rgba(cols[0], 0));
      v.addColorStop(1, rgba(cols[cols.length - 1], 0.35));
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};
