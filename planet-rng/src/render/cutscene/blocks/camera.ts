// 16 ScreenShake / Zoom: moves the camera of all world-space blocks (shake with decaying
// amplitude, zoom curve, roll, horizontal flip). Reduced motion: no shake, gentle zoom.

import { noise1 } from '../../vfx/math';
import { curve, type Block } from '../core';

export const ScreenShake: Block<'ScreenShake'> = {
  space: 'screen',
  draw(_ctx, p, prm, _theme, env) {
    const cam = env.cam;
    const reduced = env.reduceMotion;
    const amp = reduced ? 0 : (prm.amp ?? 0) * env.u * Math.pow(Math.max(0, 1 - p), prm.decay ?? 1.5) * env.alpha;
    const f = prm.freq ?? 18;
    if (amp > 0) {
      cam.x += noise1(env.time * f, 11) * amp;
      cam.y += noise1(env.time * f, 23) * amp;
    }
    const z = curve(prm.zoom, env.local, 1);
    cam.zoom *= reduced ? 1 + (z - 1) * 0.3 : z;
    cam.roll += reduced ? 0 : curve(prm.roll, env.local, 0);
    cam.flip *= curve(prm.flip, env.local, 1);
  },
};
