// 14 BeatInvert (inversion / colour swap on the beat, flash-limited), 15 Letterbox (cinema bars)
// and SceneCut (hard cuts between backgrounds: star fields, skies, planet surfaces, bubbles).

import type { Scene } from '../../../config/cutscenes';
import { beatsIn } from '../../../config/cutscenes/flash';
import { mix, rgba } from '../../color';
import { hash } from '../../vfx/math';
import { glowTex, nebulaTex } from '../../vfx/tex';
import { color, TAU, type Block, type Env } from '../core';
import type { Theme } from '../../../config/cutscenes';

export const BeatInvert: Block<'BeatInvert'> = {
  space: 'screen',
  draw(ctx, _p, prm, theme, env) {
    const start = env.time - env.local;
    const times = (prm.beats ?? beatsIn(env.def, start, start + env.dur).map((b) => b - start)).filter((_, i) => i % (prm.every ?? 1) === 0);
    const hold = prm.hold ?? 0.12;
    let on = false;
    for (const b of times) {
      if (env.local >= b && env.local < b + hold) {
        on = true;
        if (env.local - b < 0.05) env.stats.flashes++;
        break;
      }
    }
    if (!on) return;
    if (env.reduceFlashes) {
      // No inversion: a gentle tint pulse instead.
      ctx.globalAlpha = env.alpha * 0.18;
      ctx.fillStyle = theme.secondary;
      ctx.fillRect(0, 0, env.W, env.H);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = env.alpha;
    ctx.fillStyle = prm.mode === 'swap' ? mix(theme.primary, theme.secondary, 0.5) : '#ffffff';
    ctx.fillRect(0, 0, env.W, env.H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};

export const Letterbox: Block<'Letterbox'> = {
  space: 'screen',
  draw(ctx, _p, prm, _theme, env) {
    const slide = prm.slide ?? 0.45;
    const k = Math.min(1, env.local / slide, Math.max(0, (env.dur - env.local) / slide));
    const e = k * k * (3 - 2 * k);
    const h = env.H * (prm.height ?? 0.11) * e;
    if (h <= 0.5) return;
    ctx.globalAlpha = env.alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, env.W, h);
    ctx.fillRect(0, env.H - h, env.W, h);
    ctx.globalAlpha = 1;
  },
};

function stars(ctx: CanvasRenderingContext2D, env: Env, seed: number, n: number, tint: string, alpha: number): void {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = hash(seed * 31 + i * 3) * env.W;
    const y = hash(seed * 17 + i * 5 + 1) * env.H;
    const s = (0.15 + 0.45 * hash(seed + i * 7) ** 3) * env.u;
    const tw = 0.6 + 0.4 * Math.sin(env.time * (1 + hash(i) * 3) + i);
    ctx.globalAlpha = alpha * tw;
    ctx.fillStyle = i % 5 ? '#ffffff' : tint;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function drawScene(ctx: CanvasRenderingContext2D, sc: Scene, theme: Theme, env: Env, k: number): void {
  const { W, H, cx, cy, u } = env;
  const cols = (sc.colors ?? ['primary', 'secondary']).map((c, i) => color(theme, c, env.time, i * 90));
  const c0 = cols[0];
  const c1 = cols[1] ?? theme.secondary;
  const seed = sc.seed ?? 1;
  const z = sc.zoom ? sc.zoom[0] + (sc.zoom[1] - sc.zoom[0]) * k : 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  switch (sc.kind) {
    case 'void':
      ctx.fillStyle = sc.colors ? c0 : theme.dark;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      break;
    case 'paper':
      ctx.fillStyle = sc.colors ? c0 : '#f1eee6';
      ctx.fillRect(-W, -H, W * 3, H * 3);
      break;
    case 'starfield':
      ctx.fillStyle = theme.dark;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      stars(ctx, env, seed, 160, c0, 0.9);
      break;
    case 'nebula': {
      ctx.fillStyle = theme.dark;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      ctx.globalCompositeOperation = 'lighter';
      const s = env.diag * 2.2;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(nebulaTex([c0, c1], seed, 256), cx - s / 2, cy - s / 2, s, s);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      stars(ctx, env, seed, 90, c0, 0.7);
      break;
    }
    case 'sky': {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, mix(c0, '#000000', 0.55));
      g.addColorStop(0.65, c0);
      g.addColorStop(1, mix(c1, '#ffffff', 0.2));
      ctx.fillStyle = g;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      stars(ctx, env, seed, 40, '#ffffff', 0.4);
      break;
    }
    case 'surface': {
      ctx.fillStyle = theme.dark;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      stars(ctx, env, seed, 110, c0, 0.8);
      const R = Math.max(W, H) * 1.4;
      const py = H * 0.78 + R;
      const atm = ctx.createRadialGradient(cx, py, R * 0.98, cx, py, R * 1.08);
      atm.addColorStop(0, rgba(c0, 0.9));
      atm.addColorStop(1, rgba(c0, 0));
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = atm;
      ctx.beginPath();
      ctx.arc(cx, py, R * 1.08, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(cx - R * 0.2, py - R * 0.6, R * 0.2, cx, py, R);
      g.addColorStop(0, mix(c1, '#ffffff', 0.15));
      g.addColorStop(0.8, mix(c1, '#000000', 0.45));
      g.addColorStop(1, mix(c1, '#000000', 0.75));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, py, R, 0, TAU);
      ctx.fill();
      break;
    }
    case 'bubble': {
      ctx.fillStyle = mix(theme.dark, c0, 0.08);
      ctx.fillRect(-W, -H, W * 3, H * 3);
      stars(ctx, env, seed + 5, 70, c0, 0.5);
      const R = Math.min(W, H) * 0.36;
      const wob = 1 + 0.015 * Math.sin(env.time * 3 + seed);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(wob, 1 / wob);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(glowTex(c0, 'soft'), -R * 1.8, -R * 1.8, R * 3.6, R * 3.6);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, TAU);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = mix(c0, '#000000', 0.7);
      ctx.fillRect(-R, -R, R * 2, R * 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.rotate(env.time * 0.2 + seed);
      ctx.drawImage(nebulaTex([c0, c1], seed + 2, 256), -R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      for (const [w, a] of [
        [u * 2.2, 0.15],
        [u * 0.8, 0.5],
        [u * 0.3, 0.9],
      ] as [number, number][]) {
        ctx.strokeStyle = rgba(mix(c0, '#ffffff', 0.5), a);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, TAU);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      break;
    }
    case 'core': {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, env.diag);
      g.addColorStop(0, mix(c0, '#ffffff', 0.6));
      g.addColorStop(0.35, c0);
      g.addColorStop(1, mix(c1, '#000000', 0.6));
      ctx.fillStyle = g;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      break;
    }
    case 'grid': {
      ctx.fillStyle = theme.dark;
      ctx.fillRect(-W, -H, W * 3, H * 3);
      ctx.strokeStyle = rgba(c0, 0.35);
      ctx.lineWidth = Math.max(1, u * 0.15);
      const hz = H * 0.55;
      ctx.beginPath();
      for (let i = -12; i <= 12; i++) {
        ctx.moveTo(cx + i * u * 1.5, hz);
        ctx.lineTo(cx + i * u * 30, H * 1.2);
      }
      for (let j = 0; j < 12; j++) {
        const y = hz + Math.pow(j / 12, 2) * (H - hz) * 1.2 + ((env.time * 0.15) % 1) * u;
        ctx.moveTo(-W, y);
        ctx.lineTo(W * 2, y);
      }
      ctx.stroke();
      stars(ctx, env, seed, 60, c0, 0.6);
      break;
    }
  }
  ctx.restore();
}

export const SceneCut: Block<'SceneCut'> = {
  space: 'world',
  draw(ctx, _p, prm, theme, env) {
    const scenes = prm.scenes;
    let i = -1;
    for (let k = 0; k < scenes.length; k++) if (scenes[k].at <= env.local) i = k;
    if (i < 0) return;
    const sc = scenes[i];
    const end = i + 1 < scenes.length ? scenes[i + 1].at : env.dur;
    const k = Math.min(1, (env.local - sc.at) / Math.max(0.01, end - sc.at));
    ctx.globalAlpha = env.alpha;
    drawScene(ctx, sc, theme, env, k);
    ctx.globalAlpha = 1;
  },
};
