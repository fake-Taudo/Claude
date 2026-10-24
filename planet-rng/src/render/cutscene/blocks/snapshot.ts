// Blocks that work on a snapshot of the frame below them (render/cutscene/timeline grabs it):
// 8 Shatter (the image breaks into flying shards), 9 SplitSlash (the image is cut in two),
// 10 TimeFreeze (the image freezes and turns grey).

import { CUTSCENE } from '../../../config/cutscenes';
import { rgba } from '../../color';
import { Rng } from '../../vfx/math';
import { color, curve, DEG, TAU, type Block } from '../core';

interface Shard {
  /** Polygon in screen fractions (0..1). */
  pts: [number, number][];
  cx: number;
  cy: number;
  /** Velocity (fractions of the short side per second), spin (turns/s). */
  vx: number;
  vy: number;
  spin: number;
  /** Distance of the centroid from the break point (0..1), for crack timing. */
  dist: number;
}

/** Radial glass pattern: rays out of the break point crossed by jittered rings. */
function shards(prm: { pieces?: number; origin?: [number, number]; style?: string; seed?: number; force?: number; spin?: number }, quality: number): Shard[] {
  const rng = new Rng((prm.seed ?? 9) * 7919 + 1);
  const total = Math.max(12, Math.round((prm.pieces ?? 48) * quality));
  const style = prm.style ?? 'glass';
  const rings = style === 'ice' ? 3 : style === 'crystal' ? 3 : 4;
  const rays = Math.max(6, Math.round(total / rings));
  const [ox, oy] = prm.origin ?? [0.5, 0.5];
  const angles: number[] = [];
  for (let i = 0; i < rays; i++) angles.push(((i + 0.2 + rng.next() * 0.6) / rays) * TAU);
  // Radii in screen fractions; the last ring lies outside the screen.
  const radii = [0];
  for (let k = 1; k <= rings; k++) radii.push(Math.pow(k / rings, 1.35) * 1.6);
  const grid: [number, number][][] = radii.map((r, k) =>
    angles.map((a) => {
      const jr = k === 0 ? 0 : r * (1 + (rng.next() - 0.5) * 0.35);
      const ja = a + (rng.next() - 0.5) * (0.5 / rays) * TAU * 0.4;
      return [ox + Math.cos(ja) * jr, oy + Math.sin(ja) * jr];
    }),
  );
  const out: Shard[] = [];
  const force = prm.force ?? 0.9;
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < rays; i++) {
      const j = (i + 1) % rays;
      const pts: [number, number][] = k === 0 ? [[ox, oy], grid[1][i], grid[1][j]] : [grid[k][i], grid[k + 1][i], grid[k + 1][j], grid[k][j]];
      let cx = 0;
      let cy = 0;
      for (const [x, y] of pts) {
        cx += x;
        cy += y;
      }
      cx /= pts.length;
      cy /= pts.length;
      const dx = cx - ox;
      const dy = cy - oy;
      const d = Math.hypot(dx, dy) || 1e-3;
      const sp = force * (0.55 + rng.next() * 0.9) * (1.2 - Math.min(1, d) * 0.5);
      out.push({ pts, cx, cy, vx: (dx / d) * sp, vy: (dy / d) * sp - 0.15 * rng.next(), spin: (rng.next() - 0.5) * (prm.spin ?? 1.2), dist: Math.min(1, d / 0.8) });
    }
  }
  return out;
}

export const Shatter: Block<'Shatter', { list: Shard[]; q: number }> = {
  space: 'screen',
  snapshot: 'once',
  init() {
    return { list: [], q: -1 };
  },
  draw(ctx, _p, prm, theme, env, st, snap) {
    if (!snap) return;
    const q = CUTSCENE.quality[env.quality].pieces;
    if (st.q !== q) {
      st.list = shards(prm, q);
      st.q = q;
    }
    const { W, H } = env;
    const S = Math.min(W, H);
    const crack = prm.crack ?? 0.25;
    const t = env.local;
    const edge = color(theme, prm.edge ?? 'white', env.time);
    // What remains behind the flying shards.
    ctx.globalAlpha = env.alpha;
    ctx.fillStyle = color(theme, prm.behind ?? 'black', env.time);
    ctx.fillRect(0, 0, W, H);
    if (t < crack) {
      // Cracks run out of the break point over the intact image.
      ctx.drawImage(snap, 0, 0, W, H);
      const k = t / crack;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(edge, 0.85);
      ctx.lineWidth = Math.max(1, env.u * 0.25);
      ctx.beginPath();
      for (const s of st.list) {
        if (s.dist > k * 1.3) continue;
        const p = s.pts;
        ctx.moveTo(p[0][0] * W, p[0][1] * H);
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0] * W, p[i][1] * H);
        ctx.closePath();
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    const ft = t - crack;
    const g = (prm.gravity ?? 60) / 100;
    const fade = Math.max(0, 1 - Math.max(0, ft - (env.dur - crack) * 0.6) / Math.max(0.1, (env.dur - crack) * 0.4));
    for (const s of st.list) {
      const dx = s.vx * ft * S;
      const dy = (s.vy * ft + 0.5 * g * ft * ft) * S;
      const rot = s.spin * ft * TAU;
      const cxp = s.cx * W;
      const cyp = s.cy * H;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const [x, y] of s.pts) {
        x0 = Math.min(x0, x * W);
        y0 = Math.min(y0, y * H);
        x1 = Math.max(x1, x * W);
        y1 = Math.max(y1, y * H);
      }
      ctx.save();
      ctx.translate(cxp + dx, cyp + dy);
      ctx.rotate(rot);
      ctx.translate(-cxp, -cyp);
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0] * W, s.pts[0][1] * H);
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0] * W, s.pts[i][1] * H);
      ctx.closePath();
      ctx.globalAlpha = env.alpha * fade;
      ctx.save();
      ctx.clip();
      const bx = Math.max(0, Math.floor(x0));
      const by = Math.max(0, Math.floor(y0));
      const bw = Math.min(W, Math.ceil(x1)) - bx;
      const bh = Math.min(H, Math.ceil(y1)) - by;
      if (bw > 0 && bh > 0) ctx.drawImage(snap, bx, by, bw, bh, bx, by, bw, bh);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(edge, 0.7 * Math.max(0, 1 - ft * 1.2));
      ctx.lineWidth = Math.max(1, env.u * 0.3);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
};

let filterOk: boolean | null = null;
/** Whether canvas filters work here (they draw a hue swap in one GPU pass). */
function canvasFilter(): boolean {
  if (filterOk !== null) return filterOk;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 2, 2);
    const d = document.createElement('canvas');
    d.width = d.height = 2;
    const h = d.getContext('2d')!;
    if (!('filter' in h)) return (filterOk = false);
    h.filter = 'invert(1)';
    h.drawImage(c, 0, 0);
    filterOk = h.getImageData(0, 0, 1, 1).data[0] < 30;
  } catch {
    filterOk = false;
  }
  return filterOk;
}

/**
 * Hue-swapped copy of a frame with its brightness kept: the inverted frame lends its hue
 * (rotated by 180°) to the original via the 'hue' blend mode (fallback without canvas filters).
 */
function hueSwapped(snap: HTMLCanvasElement, st: { inv: HTMLCanvasElement | null; out: HTMLCanvasElement | null }): HTMLCanvasElement {
  const make = (c: HTMLCanvasElement | null) => {
    if (c && c.width === snap.width && c.height === snap.height) return c;
    const n = document.createElement('canvas');
    n.width = snap.width;
    n.height = snap.height;
    return n;
  };
  st.inv = make(st.inv);
  st.out = make(st.out);
  const gi = st.inv.getContext('2d')!;
  gi.globalCompositeOperation = 'copy';
  gi.drawImage(snap, 0, 0);
  gi.globalCompositeOperation = 'difference';
  gi.fillStyle = '#ffffff';
  gi.fillRect(0, 0, snap.width, snap.height);
  const go = st.out.getContext('2d')!;
  go.globalCompositeOperation = 'copy';
  go.drawImage(snap, 0, 0);
  go.globalCompositeOperation = 'hue';
  go.drawImage(st.inv, 0, 0);
  go.globalCompositeOperation = 'source-over';
  return st.out;
}

export const SplitSlash: Block<'SplitSlash', { inv: HTMLCanvasElement | null; out: HTMLCanvasElement | null }> = {
  space: 'screen',
  snapshot: (p) => (p.live ? 'live' : 'once'),
  init() {
    return { inv: null, out: null };
  },
  draw(ctx, p, prm, theme, env, st, snap) {
    if (!snap) return;
    const swap = prm.swap ?? 'none';
    const swapOn = swap !== 'none' && env.local >= (prm.swapAt ?? env.dur / 2);
    const gpu = swapOn && canvasFilter();
    const swapped = swapOn && !gpu ? hueSwapped(snap, st) : null;
    const { W, H, cx, cy, diag, u } = env;
    const ang = (prm.angle ?? 0) * DEG;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const nx = -dy;
    const ny = dx;
    const gap = curve(prm.gap ?? [[0, 0], [env.dur * 0.25, 2.5, 'outCubic'], [env.dur, 6]], env.local, 0) * u;
    const shift = curve(prm.shift ?? [[0, 0], [env.dur, 5, 'outCubic']], env.local, 0) * u;
    const R = diag * 2;
    ctx.globalAlpha = env.alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (const side of [1, -1]) {
      ctx.save();
      ctx.translate(nx * side * gap * 0.5 + dx * side * shift, ny * side * gap * 0.5 + dy * side * shift);
      ctx.beginPath();
      ctx.moveTo(cx - dx * R, cy - dy * R);
      ctx.lineTo(cx + dx * R, cy + dy * R);
      ctx.lineTo(cx + dx * R + nx * side * R, cy + dy * R + ny * side * R);
      ctx.lineTo(cx - dx * R + nx * side * R, cy - dy * R + ny * side * R);
      ctx.closePath();
      ctx.clip();
      const mine = swapOn && (swap === 'both' || (swap === 'a' && side === 1) || (swap === 'b' && side === -1));
      if (mine && gpu) ctx.filter = 'hue-rotate(180deg)';
      ctx.drawImage(mine && swapped ? swapped : snap, 0, 0, W, H);
      ctx.filter = 'none';
      ctx.restore();
    }
    // Light in the gap.
    const glow = color(theme, prm.glow ?? 'white', env.time);
    const a = env.alpha * (1 - p * 0.6);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'butt';
    for (const [m, al, c] of [
      [6, 0.12, glow],
      [2.2, 0.4, glow],
      [0.7, 1, '#ffffff'],
    ] as [number, number, string][]) {
      ctx.strokeStyle = rgba(c, al * a);
      ctx.lineWidth = Math.max(1, (gap + u * 0.6) * m * 0.5);
      ctx.beginPath();
      ctx.moveTo(cx - dx * R, cy - dy * R);
      ctx.lineTo(cx + dx * R, cy + dy * R);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  },
};

export const TimeFreeze: Block<'TimeFreeze'> = {
  space: 'screen',
  snapshot: (p) => (p.live ? 'live' : 'once'),
  draw(ctx, _p, prm, theme, env, _st, snap) {
    if (!snap) return;
    const { W, H } = env;
    const k = Math.min(1, env.local / 0.12);
    ctx.globalAlpha = env.alpha;
    ctx.drawImage(snap, 0, 0, W, H);
    // Grey: keep the luminosity, drop the saturation (outside the colour circle, if any).
    const grey = (prm.desaturate ?? 1) * k;
    const hole = curve(prm.hole, env.local, 0) * env.u;
    if (grey > 0 && hole < env.diag) {
      ctx.save();
      if (hole > 0) {
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.arc(env.cx, env.cy, hole, 0, TAU);
        ctx.clip('evenodd');
      }
      ctx.globalCompositeOperation = 'saturation';
      ctx.globalAlpha = env.alpha * grey;
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (prm.tint) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = env.alpha * 0.5 * k;
      ctx.fillStyle = color(theme, prm.tint, env.time);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
    const dim = (prm.dim ?? 0.25) * k;
    if (dim > 0) {
      ctx.globalAlpha = env.alpha * dim;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
    }
    // Hairline cracks grow over the frozen frame.
    const cracks = prm.cracks ?? 0;
    if (cracks > 0) {
      const g = Math.min(1, env.local / Math.max(0.1, env.dur * cracks));
      const rng = new Rng(77);
      ctx.globalAlpha = env.alpha * 0.8;
      ctx.strokeStyle = 'rgba(235,240,255,0.85)';
      ctx.lineWidth = Math.max(1, env.u * 0.18);
      ctx.beginPath();
      for (let i = 0; i < 7; i++) {
        let x = env.cx + (rng.next() - 0.5) * env.u * 10;
        let y = env.cy + (rng.next() - 0.5) * env.u * 10;
        let a = rng.next() * TAU;
        ctx.moveTo(x, y);
        const steps = Math.floor(8 * g);
        for (let s = 0; s < steps; s++) {
          a += (rng.next() - 0.5) * 0.9;
          x += Math.cos(a) * env.u * 6;
          y += Math.sin(a) * env.u * 6;
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
};
