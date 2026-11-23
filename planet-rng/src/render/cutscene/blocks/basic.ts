// Full-screen blocks: veil, white-out, flashes.

import { CUTSCENE } from '../../../config/cutscenes';
import { beatsIn } from '../../../config/cutscenes/flash';
import { mix, rgba } from '../../color';
import { color, type Block } from '../core';

/** 1 FadeVeil: fades the screen to a colour (the world disappears). */
export const FadeVeil: Block<'FadeVeil'> = {
  space: 'screen',
  draw(ctx, p, prm, theme, env) {
    const a = (prm.from ?? 0) + ((prm.to ?? 1) - (prm.from ?? 0)) * p;
    if (a <= 0) return;
    ctx.globalAlpha = env.alpha * Math.min(1, a);
    ctx.fillStyle = color(theme, prm.color ?? 'black', env.time);
    ctx.fillRect(0, 0, env.W, env.H);
  },
};

/** 7a WhiteOut: the screen fills with light (the reveal). Reduced flashes: a softer tint. */
export const WhiteOut: Block<'WhiteOut'> = {
  space: 'screen',
  draw(ctx, p, prm, theme, env) {
    let c = color(theme, prm.color ?? 'white', env.time);
    let a = (prm.peak ?? 1) * p;
    if (env.reduceFlashes) {
      c = mix(c, theme.primary, 0.35);
      a *= 0.85;
    }
    if (a <= 0) return;
    ctx.globalAlpha = env.alpha * Math.min(1, a);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, env.W, env.H);
  },
};

/** 7b Flash: short additive flashes at given times or on the beat. */
export const Flash: Block<'Flash'> = {
  space: 'screen',
  draw(ctx, _p, prm, theme, env) {
    const times = prm.at === 'beats' ? beatsIn(env.def, env.time - env.local, env.time - env.local + env.dur).map((b) => b - (env.time - env.local)).filter((_, i) => i % (prm.every ?? 1) === 0) : (prm.at ?? [0]);
    const decay = (prm.decay ?? 0.25) * (env.reduceFlashes ? 2 : 1);
    let a = 0;
    for (const at of times) {
      const k = env.local - at;
      if (k < -0.03 || k > decay) continue;
      const v = k < 0 ? 1 + k / 0.03 : 1 - k / decay;
      a = Math.max(a, v);
      if (k >= 0 && k < 0.05) env.stats.flashes++;
    }
    if (a <= 0) return;
    const peak = (prm.peak ?? 0.8) * (env.reduceFlashes ? CUTSCENE.reducedFlashPeak : 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = env.alpha * Math.min(1, a * a * peak);
    ctx.fillStyle = rgba(color(theme, prm.color ?? 'white', env.time), 1);
    ctx.fillRect(0, 0, env.W, env.H);
  },
};
