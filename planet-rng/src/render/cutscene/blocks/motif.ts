// 3 CoreMotif: the central object. It grows (size curve), spins ever faster (spin), and
// can cover the screen at the end (progress for circleStar). Positions in u from the centre.

import type { CoreMotifParams, MotifKind } from '../../../config/cutscenes';
import { glowTex } from '../../vfx/tex';
import { color, curve, DEG, spinAngle, type Block, type Env } from '../core';
import { drawSymbol } from '../symbol';

/** Default symbol: the prototype's soft glow with a four-pointed star. */
const CLASSIC = [
  { kind: 'glow', r: 46, color: 0, alpha: 0.35 },
  { kind: 'glow', r: 24, color: 0, alpha: 0.5 },
  { kind: 'star', points: 4, r: 21, inner: 0.32, color: 0, fill: true },
] as CoreMotifParams['layers'];

/** Kind specific painters, drawn around the origin in symbol units (60 = base size). */
type Painter = (ctx: CanvasRenderingContext2D, prm: CoreMotifParams, env: Env, pal: string[], prog: number, aux: number) => void;

export const PAINTERS: Partial<Record<MotifKind, Painter>> = {
  circleStar(ctx, prm, env, pal) {
    drawSymbol(ctx, prm.layers ?? CLASSIC!, pal, env.time);
  },
};

export const CoreMotif: Block<'CoreMotif'> = {
  space: 'world',
  draw(ctx, _p, prm, theme, env) {
    const L = env.local;
    const unit = Math.min(env.W, env.H) / 60;
    let scale = curve(prm.size, L, 0.5) * unit;
    const prog = curve(prm.progress, L, 0);
    const aux = curve(prm.aux, L, 0);
    if (prm.kind === 'circleStar' && prog > 0) {
      // The symbol fills the screen while the white-out rises (prototype behaviour).
      const cover = (Math.hypot(env.W, env.H) / 2 / 30) * 1.5;
      scale += (cover - scale) * Math.pow(prog, 2.2);
    }
    const alpha = curve(prm.alpha, L, 1) * env.alpha;
    if (alpha <= 0.001 || scale <= 0) return;
    const angle = ((prm.spin ? spinAngle(prm.spin, L) : 0) + (prm.angle ?? 0)) * DEG;
    const x = env.cx + curve(prm.x, L, 0) * env.u;
    const y = env.cy + curve(prm.y, L, 0) * env.u;
    const pal = (prm.palette ?? ['primary', 'secondary', 'white']).map((c, i) => color(theme, c, env.time, i * 60));

    const glow = curve(prm.glow, L, 0);
    if (glow > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * Math.min(1, glow);
      const s = scale * 60 * 1.6;
      ctx.drawImage(glowTex(pal[0], 'soft'), x - s / 2, y - s / 2, s, s);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = alpha;
    const cos = Math.cos(angle) * scale;
    const sin = Math.sin(angle) * scale;
    ctx.transform(cos, sin, -sin, cos, x, y);
    const paint = PAINTERS[prm.kind] ?? PAINTERS.circleStar!;
    paint(ctx, prm, env, pal, prog, aux);
  },
};
