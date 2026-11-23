// Rays: light rays that flash across the screen ever more often (a frequency ramp), and
// Ticker: tick sounds with an accelerating rate (counters, clock hands).

import type { Cue } from '../../../config/cutscenes';
import { rgba } from '../../color';
import { hash } from '../../vfx/math';
import { color, rampTimes, type Block } from '../core';

export const Rays: Block<'Rays', number[]> = {
  space: 'world',
  init(prm, tr) {
    const [r0, r1] = prm.rate ?? [1, 8];
    return rampTimes(r0, r1, tr.dur);
  },
  draw(ctx, _p, prm, theme, env, times) {
    const life = prm.life ?? 0.35;
    const w = (prm.width ?? 0.8) * env.u;
    const seed = (prm.seed ?? 3) * 1013;
    const through = prm.through ?? 'random';
    const L = env.diag * 2.2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let k = 0; k < times.length; k++) {
      const age = (env.local - times[k]) / life;
      if (age < 0 || age > 1) continue;
      const h1 = hash(seed + k * 17);
      const h2 = hash(seed + k * 31 + 5);
      let x = env.cx;
      let y = env.cy;
      let ang = h1 * Math.PI;
      if (through === 'random') {
        x = env.W * (0.15 + 0.7 * h2);
        y = env.H * (0.15 + 0.7 * hash(seed + k * 7 + 9));
      } else if (through === 'vertical') {
        x = env.cx + (h2 - 0.5) * env.W * 0.22;
        ang = Math.PI / 2 + (h1 - 0.5) * 0.06;
      }
      const a = env.alpha * (age < 0.15 ? age / 0.15 : Math.pow(1 - (age - 0.15) / 0.85, 1.5));
      const col = color(theme, prm.color ?? 'primary', env.time, k * 40);
      const dx = Math.cos(ang) * L;
      const dy = Math.sin(ang) * L;
      for (const [m, al, c] of [
        [7, 0.08, col],
        [2.6, 0.3, col],
        [0.9, 0.9, '#ffffff'],
      ] as [number, number, string][]) {
        ctx.strokeStyle = rgba(c, al * a);
        ctx.lineWidth = Math.max(1, w * m * (1 - 0.5 * age));
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  },
  cues(prm, tr) {
    if (!prm.sound) return [];
    const [r0, r1] = prm.rate ?? [1, 8];
    let last = -1;
    return rampTimes(r0, r1, tr.dur)
      .filter((t) => (t - last >= 0.12 ? ((last = t), true) : false))
      .map((t): Cue => ({ t: tr.t + t, sfx: prm.sound as Cue['sfx'], gain: 0.6 }));
  },
};

export const Ticker: Block<'Ticker'> = {
  space: 'screen',
  draw() {
    /* audio only */
  },
  cues(prm, tr) {
    const [r0, r1] = prm.rate;
    return rampTimes(r0, r1, tr.dur).map((t, i): Cue => ({ t: tr.t + t, sfx: prm.sound ?? (i % 2 ? 'tock' : 'tick') }));
  },
};
