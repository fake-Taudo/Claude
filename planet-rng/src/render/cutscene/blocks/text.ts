// 12 TextCard (short German lines in capitals, word by word, typewriter or glitch) and
// 13 Counter (an accelerating number with a label).

import { beatsIn } from '../../../config/cutscenes/flash';
import type { Cue, TextParams } from '../../../config/cutscenes';
import { luminance, mix, rgba } from '../../color';
import { hash } from '../../vfx/math';
import { color, ease, type Block, type Env } from '../core';

const FONT = 'Fredoka, system-ui, sans-serif';

/** Picks the lines of a text card (one variant per play). */
export function textLines(prm: TextParams, seed: number): string[] {
  if (prm.variants?.length) return prm.variants[Math.floor(hash(seed) * prm.variants.length) % prm.variants.length];
  return prm.lines ?? [];
}

/** Draws text with manual letter spacing, centred on x. Returns the drawn width. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, measureOnly = false): number {
  let w = 0;
  const widths: number[] = [];
  for (const ch of text) {
    const cw = ctx.measureText(ch).width;
    widths.push(cw);
    w += cw + spacing;
  }
  w -= spacing;
  if (measureOnly) return w;
  let cx = x - w / 2;
  let i = 0;
  for (const ch of text) {
    ctx.fillText(ch, cx + widths[i] / 2, y);
    cx += widths[i] + spacing;
    i++;
  }
  return w;
}

/** Times of the words (local seconds). */
function wordTimes(prm: TextParams, words: number, env: Pick<Env, 'def' | 'time' | 'local' | 'dur'>, start: number): number[] {
  if (prm.wordTimes === 'beats') {
    const b = beatsIn(env.def, start, start + env.dur).map((x) => x - start);
    return Array.from({ length: words }, (_, i) => b[i] ?? b[b.length - 1] ?? 0);
  }
  if (prm.wordTimes) return Array.from({ length: words }, (_, i) => prm.wordTimes![Math.min(i, prm.wordTimes!.length - 1)] as number);
  const span = env.dur * 0.55;
  return Array.from({ length: words }, (_, i) => (words <= 1 ? 0 : (i / (words - 1)) * span));
}

export const TextCard: Block<'TextCard'> = {
  space: 'screen',
  draw(ctx, _p, prm, theme, env) {
    if (prm.cycle?.length) {
      drawCycle(ctx, prm, theme.primary, env, color(theme, prm.color ?? 'white', env.time));
      return;
    }
    const lines = textLines(prm, env.seed).map((l) => l.toUpperCase());
    if (!lines.length) return;
    const size = (prm.size ?? 5) * env.u;
    const spacing = (prm.spacing ?? 0.22) * size;
    const col = color(theme, prm.color ?? 'white', env.time);
    const out = prm.out ?? 0.4;
    const fadeOut = Math.min(1, Math.max(0, (env.dur - env.local) / Math.max(0.01, out)));
    const mode = prm.mode ?? 'line';
    const lh = size * 1.45;
    const y0 = env.H * (prm.y ?? 0.72) - ((lines.length - 1) * lh) / 2;
    ctx.font = `600 ${Math.round(size)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = lines.map((l) => l.split(' '));
    const all = words.flat().length;
    const times = mode === 'words' ? wordTimes(prm, all, env, env.time - env.local) : [];
    const chars = lines.join('').length;
    let wi = 0;
    let ci = 0;
    for (let li = 0; li < lines.length; li++) {
      const y = y0 + li * lh;
      const line = lines[li];
      let base = env.alpha * fadeOut;
      if (mode === 'line') base *= Math.min(1, Math.max(0, (env.local - li * 0.35) / 0.45));
      if (mode === 'glitch') base *= Math.min(1, env.local / 0.15);
      if (base <= 0.005 && mode !== 'words' && mode !== 'type') continue;
      if (mode === 'words') {
        // Lay out the line word by word; each word pops in at its time.
        const ws = words[li];
        const widths = ws.map((w) => spaced(ctx, w, 0, 0, spacing, true));
        const space = size * 0.6;
        const total = widths.reduce((a, b) => a + b, 0) + space * (ws.length - 1);
        let x = env.W / 2 - total / 2;
        for (let k = 0; k < ws.length; k++) {
          const t = env.local - times[wi++];
          if (t >= 0) {
            const a = base * Math.min(1, t / 0.12);
            const pop = 1 + 0.25 * Math.max(0, 1 - t / 0.18);
            ctx.save();
            ctx.translate(x + widths[k] / 2, y);
            ctx.scale(pop, pop);
            ink(ctx, ws[k], 0, 0, spacing, col, a, size);
            ctx.restore();
          }
          x += widths[k] + space;
        }
        continue;
      }
      if (mode === 'type') {
        const span = env.dur * 0.5;
        const shown = Math.floor((env.local / span) * chars) - ci;
        ci += line.length;
        if (shown <= 0) continue;
        ink(ctx, line.slice(0, Math.min(line.length, shown)), env.W / 2, y, spacing, col, base, size);
        continue;
      }
      if (mode === 'glitch' && env.local < 0.45) {
        // Colour-split jitter while the line appears.
        const j = (1 - env.local / 0.45) * size * 0.25;
        const off = (hash(Math.floor(env.local * 30) + li) - 0.5) * j * 2;
        ctx.globalCompositeOperation = 'lighter';
        ink(ctx, line, env.W / 2 + off, y, spacing, '#ff3d6a', base * 0.7, size, true);
        ink(ctx, line, env.W / 2 - off, y, spacing, '#3dffe0', base * 0.7, size, true);
        ctx.globalCompositeOperation = 'source-over';
      }
      ink(ctx, line, env.W / 2, y, spacing, col, base, size);
    }
  },
  cues(prm, tr) {
    if (prm.mode !== 'type') return [];
    const lines = textLines(prm, 0);
    const chars = lines.join('').length;
    const out: Cue[] = [];
    for (let i = 0; i < chars; i += 2) out.push({ t: tr.t + (i / chars) * tr.dur * 0.5, sfx: 'type' });
    return out;
  },
};

/** Text swap: the shown word changes at every word time (e.g. on the beat). */
function drawCycle(ctx: CanvasRenderingContext2D, prm: TextParams, _accent: string, env: Env, col: string): void {
  const list = prm.cycle!;
  const times = wordTimes(prm, Math.max(list.length, 64), env, env.time - env.local);
  let i = -1;
  for (let k = 0; k < times.length; k++) if (times[k] <= env.local) i = k;
  if (i < 0) return;
  const word = list[i % list.length].toUpperCase();
  const size = (prm.size ?? 7) * env.u;
  const t = env.local - times[i];
  const out = prm.out ?? 0.3;
  const a = env.alpha * Math.min(1, t / 0.06) * Math.min(1, Math.max(0, (env.dur - env.local) / out));
  const pop = 1 + 0.18 * Math.max(0, 1 - t / 0.15);
  ctx.font = `600 ${Math.round(size)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.translate(env.W / 2, env.H * (prm.y ?? 0.72));
  ctx.scale(pop, pop);
  ink(ctx, word, 0, 0, (prm.spacing ?? 0.22) * size, col, a, size);
  ctx.restore();
}

/** Text "ink": soft glow under crisp letters. */
function ink(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, sp: number, col: string, a: number, size: number, flat = false): void {
  if (a <= 0.005) return;
  // Dark ink on bright scenes stays crisp: no glow, no lightening.
  if (luminance(col) < 0.3) flat = true;
  ctx.globalAlpha = a;
  if (!flat) {
    ctx.shadowColor = rgba(mix(col, '#ffffff', 0.2), 0.9);
    ctx.shadowBlur = size * 0.6;
  }
  ctx.fillStyle = flat ? col : mix(col, '#ffffff', 0.35);
  spaced(ctx, s, x, y, sp);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function formatNumber(v: number, format: string | undefined): string {
  const de = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  switch (format) {
    case 'percent':
      return `${Math.round(v)} %`;
    case 'km':
      return `${de(v)} KM`;
    case 'kelvin':
      return `${de(v)} K`;
    case 'years':
      return `${de(v)}`;
    case 'int':
      return `${Math.round(v)}`;
    default:
      return de(v);
  }
}

export const Counter: Block<'Counter'> = {
  space: 'screen',
  draw(ctx, p, prm, theme, env) {
    const v = prm.from + (prm.to - prm.from) * ease(prm.ease ?? 'inQuad', p);
    const size = (prm.size ?? 9) * env.u;
    const col = color(theme, prm.color ?? 'white', env.time);
    const y = env.H * (prm.y ?? 0.2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = env.alpha;
    if (prm.label) {
      ctx.font = `500 ${Math.round(size * 0.32)}px ${FONT}`;
      ctx.fillStyle = rgba(col, 0.75);
      spaced(ctx, prm.label.toUpperCase(), env.W / 2, y - size * 0.75, size * 0.32 * 0.35);
    }
    ctx.font = `600 ${Math.round(size)}px ${FONT}`;
    const dark = luminance(col) < 0.3;
    ctx.shadowColor = rgba(col, 0.8);
    ctx.shadowBlur = dark ? 0 : size * 0.35;
    ctx.fillStyle = dark ? col : mix(col, '#ffffff', 0.3);
    spaced(ctx, formatNumber(v, prm.format), env.W / 2, y, size * 0.06);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  },
  cues(prm, tr) {
    if (prm.ticks === false) return [];
    const max = prm.maxTickRate ?? 12;
    const out: Cue[] = [];
    let last = -Infinity;
    let prev = formatNumber(prm.from, prm.format);
    const steps = Math.ceil(tr.dur * 120);
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const s = formatNumber(prm.from + (prm.to - prm.from) * ease(prm.ease ?? 'inQuad', p), prm.format);
      const t = p * tr.dur;
      if (s !== prev && t - last >= 1 / max) {
        out.push({ t: tr.t + t, sfx: prm.ticks || 'tick', gain: 0.8 });
        last = t;
      }
      prev = s;
    }
    return out;
  },
};
