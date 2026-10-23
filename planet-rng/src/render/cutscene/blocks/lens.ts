// Lens: light bends around a dark point (gravitational lens). Draws the frame below magnified
// in rings around the centre; only at high quality, otherwise a dark disc with a light rim.

import { CUTSCENE } from '../../../config/cutscenes';
import { rgba } from '../../color';
import { color, curve, TAU, type Block } from '../core';

export const Lens: Block<'Lens'> = {
  space: 'world',
  snapshot: 'live',
  draw(ctx, _p, prm, theme, env, _st, snap) {
    const R = curve(prm.radius, env.local, 20) * env.u;
    const s = curve(prm.strength, env.local, 0.6);
    const d = curve(prm.dark, env.local, 3) * env.u;
    const x = env.cx + (prm.x ?? 0) * env.u;
    const y = env.cy + (prm.y ?? 0) * env.u;
    if (R <= 1) return;
    ctx.globalAlpha = env.alpha;
    if (snap && CUTSCENE.quality[env.quality].lens && s > 0.01) {
      const N = 10;
      for (let i = 0; i < N; i++) {
        const k = i / N;
        const r = R - (R - d) * k;
        const m = 1 + s * k * k * 1.2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.clip();
        ctx.translate(x, y);
        ctx.scale(m, m);
        ctx.translate(-x, -y);
        ctx.drawImage(snap, 0, 0, env.W, env.H);
        ctx.restore();
      }
    }
    if (d > 0.5) {
      const rim = color(theme, 'primary', env.time);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, d * 0.9, x, y, d * 2.4);
      g.addColorStop(0, rgba(rim, 0.9 * env.alpha));
      g.addColorStop(1, rgba(rim, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, d * 2.4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x, y, d, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};
