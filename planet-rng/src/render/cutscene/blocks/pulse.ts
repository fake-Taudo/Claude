// 5 DoublePulse: a symbol behind the motif pulses (scale 1 -> grow, fading), usually twice.

import type { Cue, PulseParams } from '../../../config/cutscenes';
import { glowTex } from '../../vfx/tex';
import { color, type Block } from '../core';
import { glyphTex } from '../glyphs';

function times(p: PulseParams): number[] {
  if (p.at) return p.at;
  const n = p.count ?? 2;
  const step = p.interval ?? 0.75;
  return Array.from({ length: n }, (_, i) => i * step);
}

export const DoublePulse: Block<'DoublePulse'> = {
  space: 'world',
  draw(ctx, _p, prm, theme, env) {
    const col = color(theme, prm.color ?? 'primary', env.time);
    const life = prm.life ?? Math.max(0.5, (prm.interval ?? 0.75) * 1.15);
    const grow = prm.grow ?? 1.4;
    const base = (prm.size ?? 30) * env.u;
    const x = env.cx + (prm.x ?? 0) * env.u;
    const y = env.cy + (prm.y ?? 0) * env.u;
    const tex = glyphTex(prm.symbol, col);
    ctx.globalCompositeOperation = 'lighter';
    for (const at of times(prm)) {
      const k = (env.local - at) / life;
      if (k < 0 || k > 1) continue;
      const e = 1 - Math.pow(1 - k, 3);
      const s = base * (1 + (grow - 1) * e);
      const a = env.alpha * (k < 0.08 ? k / 0.08 : Math.pow(1 - (k - 0.08) / 0.92, 2));
      ctx.globalAlpha = a;
      // Half size of the glyph texture = 2 r: draw it twice as big as the symbol.
      ctx.drawImage(tex, x - s, y - s, s * 2, s * 2);
      ctx.globalAlpha = a * 0.45;
      const g = s * 1.6;
      ctx.drawImage(glowTex(col, 'soft'), x - g, y - g, g * 2, g * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
  cues(prm, tr) {
    if (prm.sound === false) return [];
    return times(prm).map((at, i): Cue => ({ t: tr.t + at, sfx: prm.sound || 'pulse', note: 84 + i * 3 }));
  },
};
