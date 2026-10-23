// 4 ThemeParticles: an emitter whose particles are computed in closed form from a particle
// clock (no simulation): any time can be drawn, time can even run backwards.

import type { Curve, Glyph, ParticleParams } from '../../../config/cutscenes';
import type { SpriteKind } from '../../../config/vfx/types';
import { rgba } from '../../color';
import { hash } from '../../vfx/math';
import { glowTex, spriteTex, streakTex } from '../../vfx/tex';
import { color, curve, ease, TAU, type Block } from '../core';
import { glyphTex } from '../glyphs';

const SPRITES = new Set<string>(['mote', 'spark', 'ember', 'glint', 'feather', 'shard', 'crystal', 'droplet', 'bubble', 'flake', 'ash', 'puff', 'petal', 'chunk', 'wisp', 'orb', 'rune', 'leaf', 'cell', 'gear', 'moon', 'bokeh']);

/** Integral of a keyframed curve from 0 to t (the particle clock). */
export function integral(c: Curve | undefined, t: number, fallback = 1): number {
  if (c === undefined || typeof c === 'number') return (c ?? fallback) * t;
  if (t <= 0) return 0;
  let sum = 0;
  // Before the first key the first value holds.
  const first = c[0];
  if (t <= first[0]) return first[1] * t;
  sum += first[1] * Math.max(0, first[0]);
  for (let i = 1; i < c.length; i++) {
    const a = c[i - 1];
    const b = c[i];
    const t1 = Math.min(t, b[0]);
    if (t1 <= a[0]) break;
    if (!b[2] || b[2] === 'linear') {
      const v1 = a[1] + ((b[1] - a[1]) * (t1 - a[0])) / Math.max(1e-6, b[0] - a[0]);
      sum += ((a[1] + v1) / 2) * (t1 - a[0]);
    } else {
      // Eased segment: Simpson's rule.
      const n = 8;
      const h = (t1 - a[0]) / n;
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const x = a[0] + k * h;
        const v = a[1] + (b[1] - a[1]) * ease(b[2], (x - a[0]) / Math.max(1e-6, b[0] - a[0]));
        s += v * (k === 0 || k === n ? 1 : k % 2 ? 4 : 2);
      }
      sum += (s * h) / 3;
    }
    if (t <= b[0]) return sum;
  }
  const last = c[c.length - 1];
  return sum + last[1] * (t - last[0]);
}

function spriteOf(kind: ParticleParams['sprite'], col: string): HTMLCanvasElement | null {
  if (kind === 'dot') return glowTex(col, 'core');
  if (kind === 'streak') return streakTex(col);
  if (kind === 'pixel') return null;
  if (SPRITES.has(kind)) return spriteTex(kind as SpriteKind, col);
  return glyphTex(kind as Glyph, col);
}

export const ThemeParticles: Block<'ThemeParticles'> = {
  space: 'world',
  draw(ctx, _p, prm, theme, env) {
    const n = Math.max(1, Math.round(prm.count * env.q));
    const clock = integral(prm.speed, env.local, 1);
    const [l0, l1] = prm.life ?? [2, 4];
    const [s0, s1] = prm.size ?? [0.6, 1.6];
    const cols = (prm.colors ?? ['primary']).map((c, i) => color(theme, c, env.time, i * 70));
    const seed = (prm.seed ?? 1) * 7919;
    const u = env.u;
    const { W, H, cx, cy, diag } = env;
    const [r0, r1] = prm.radius ?? [0, diag / u];
    const twist = prm.twist ?? (prm.dir === 'spiral' ? 1.4 : 0);
    const sway = (prm.sway ?? (prm.dir === 'up' || prm.dir === 'down' ? 2 : 0)) * u;
    const trail = (prm.trail ?? 0) * u;
    const alphaK = curve(prm.alpha, env.local, 1) * env.alpha;
    if (alphaK <= 0.002) return;
    ctx.globalCompositeOperation = prm.blend === 'over' ? 'source-over' : 'lighter';
    const sprites = cols.map((c) => spriteOf(prm.sprite, c));
    const dir = prm.dir;
    for (let i = 0; i < n; i++) {
      const h1 = hash(seed + i * 13);
      const h2 = hash(seed + i * 29 + 1);
      const life = l0 + (l1 - l0) * h1;
      const c = prm.burst ? clock : clock + h2 * life;
      const k = Math.floor(c / life);
      if (prm.burst && (k !== 0 || c < 0)) continue;
      const f = c / life - k;
      const hk = (j: number) => hash(seed + i * 131 + k * 977 + j * 7);
      const size = (s0 + (s1 - s0) * hk(1)) * u;
      let x = cx;
      let y = cy;
      let px = x;
      let py = y;
      let a = 1;
      let sz = size;
      const pos = (g: number): void => {
        switch (dir) {
          case 'up':
          case 'down': {
            const yy = dir === 'up' ? 1.06 - 1.12 * g : -0.06 + 1.12 * g;
            x = W * hk(2) + sway * Math.sin(g * TAU * 1.3 + hk(3) * TAU);
            y = H * yy;
            return;
          }
          case 'warp': {
            const z = Math.max(0.03, 1 - g);
            const dx = hk(2) * 2 - 1;
            const dy = hk(3) * 2 - 1;
            x = cx + (dx / z) * W * 0.22;
            y = cy + (dy / z) * H * 0.22;
            return;
          }
          case 'in':
          case 'spiral': {
            const r = (r1 + (r0 - r1) * Math.pow(g, 1.6)) * u;
            const th = hk(2) * TAU + twist * TAU * g * g;
            x = cx + Math.cos(th) * r;
            y = cy + Math.sin(th) * r;
            return;
          }
          case 'out': {
            const r = (r0 + (r1 - r0) * (1 - (1 - g) * (1 - g))) * u;
            const th = hk(2) * TAU + twist * TAU * g;
            x = cx + Math.cos(th) * r;
            y = cy + Math.sin(th) * r;
            return;
          }
          case 'orbit': {
            // One lifetime = one turn; twist flattens the orbit into a tilted disc.
            const r = (r0 + (r1 - r0) * h1) * u;
            const ang = h2 * TAU + g * TAU;
            x = cx + Math.cos(ang) * r;
            y = cy + Math.sin(ang) * r * (1 - Math.min(0.85, twist));
            return;
          }
          case 'float':
          default: {
            x = W * hk(2) + Math.sin(g * TAU + hk(4) * TAU) * sway * 2 + (hk(5) - 0.5) * g * 8 * u;
            y = H * hk(3) + Math.cos(g * TAU * 0.7 + hk(6) * TAU) * sway * 2 - g * 4 * u;
          }
        }
      };
      pos(f);
      if (trail > 0 || dir === 'warp') {
        // Short streak against the direction of motion, at most `trail` u long.
        const save = [x, y];
        pos(Math.max(0, f - 0.012));
        const vx = save[0] - x;
        const vy = save[1] - y;
        const len = Math.hypot(vx, vy);
        const want = dir === 'warp' ? Math.min(len * 4, 10 * u) : Math.min(len * 6, trail);
        x = save[0];
        y = save[1];
        px = len > 1e-3 ? x - (vx / len) * want : x;
        py = len > 1e-3 ? y - (vy / len) * want : y;
      }
      // Alpha envelope over the lifetime.
      switch (dir) {
        case 'warp':
          a = Math.min(1, f * 1.4);
          sz = size * (0.3 + 1.4 * f * f);
          break;
        case 'in':
        case 'spiral':
          a = Math.min(1, f * 4) * (1 - Math.max(0, (f - 0.9) / 0.1));
          sz = size * (1 - 0.5 * f);
          break;
        case 'out':
          a = Math.min(1, f * 8) * (1 - f);
          break;
        case 'orbit':
          a = 1;
          break;
        default:
          a = Math.min(1, f / 0.15) * Math.min(1, (1 - f) / 0.25);
      }
      a *= alphaK * (0.55 + 0.45 * hk(8));
      if (a <= 0.01) continue;
      if (x < -sz * 2 || y < -sz * 2 || x > W + sz * 2 || y > H + sz * 2) continue;
      const ci = i % cols.length;
      const col = cols[ci];
      if (dir === 'warp' || trail > 0) {
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = rgba(col, 1);
        ctx.lineWidth = Math.max(1, sz * 0.35);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.globalAlpha = a;
      const img = sprites[ci];
      if (img) {
        const rot = (prm.roll ?? 0) * f * TAU + hk(9) * TAU * (prm.roll ? 1 : 0);
        if (rot) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.drawImage(img, -sz, -sz, sz * 2, sz * 2);
          ctx.restore();
        } else {
          ctx.drawImage(img, x - sz, y - sz, sz * 2, sz * 2);
        }
      } else {
        ctx.fillStyle = col;
        const ps = Math.max(1, Math.round(sz));
        ctx.fillRect(Math.round(x), Math.round(y), ps, ps);
      }
      env.stats.particles++;
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  },
};
