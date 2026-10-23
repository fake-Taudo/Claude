// Dramaturgy of the cutscenes in five acts (DECISIONS.md, "Cutscene-Dramaturgie"):
//   1. Withdrawal: black, a short jingle (top stage: first text card, letterbox bars).
//   2. Atmosphere: coloured fog in drifting layers, theme particles.
//   3. Build-up: the symbol grows and spins; a text card; a ramp (flashes, ticks, counter).
//   4. Double pulse of the symbol, then the signature break (the climax).
//   5. Reveal: the screen edges glow, white flash; top stage: an after-echo on the stage.
// The schedule functions are pure (unit tested); the draw helpers paint into the cutscene
// canvas in device pixels.

import { GAME, type CsParticles, type CsRamp, type CutsceneDef } from '../config';
import { hash01, mix, noise1, rgba, spectral } from './color';
import { sprite } from './sprites';

const TAU = Math.PI * 2;

function smooth(x: number): number {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

/** Template stage of a cutscene: 'high' (base), 'plus' (text, ramp), 'top' (all of it). */
export type CsStage = 'high' | 'plus' | 'top';

export function cutsceneStage(rank: number): CsStage {
  const c = GAME.cutscene;
  return rank >= c.topFromRank ? 'top' : rank >= c.plusFromRank ? 'plus' : 'high';
}

export interface CsTimeline {
  /** End of the black phase (ms). */
  black: number;
  /** End of the grow phase, start of the climax (break window). */
  growEnd: number;
  /** Start of the white flash. */
  fillStart: number;
  revealAt: number;
}

export function cutsceneTimeline(extraMs: number): CsTimeline {
  const c = GAME.cutscene;
  const black = c.blackMs;
  const growEnd = black + c.growMs;
  const fillStart = growEnd + extraMs;
  return { black, growEnd, fillStart, revealAt: fillStart + c.fillMs };
}

export interface CsLine {
  text: string;
  from: number;
  to: number;
  /** Centre of the screen (black phase) or below the symbol. */
  place: 'center' | 'low';
}

/** Text cards: the 'plus' stage shows the first line during the build-up, 'top' shows all. */
export function cutsceneLines(def: CutsceneDef, rank: number, extraMs: number): CsLine[] {
  const lines = def.lines ?? [];
  const stage = cutsceneStage(rank);
  if (!lines.length || stage === 'high') return [];
  const tl = cutsceneTimeline(extraMs);
  const g = GAME.cutscene.growMs;
  if (stage === 'plus') return [{ text: lines[0], from: tl.black + g * 0.22, to: tl.black + g * 0.58, place: 'low' }];
  const out: CsLine[] = [{ text: lines[0], from: 300, to: tl.black - 150, place: 'center' }];
  const rest = lines.slice(1);
  const span = 0.6 / Math.max(1, rest.length);
  rest.forEach((text, i) => {
    const a = 0.12 + i * span;
    out.push({ text, from: tl.black + g * a, to: tl.black + g * (a + span * 0.85), place: 'low' });
  });
  return out;
}

/** Moments of the flash / tick ramp: ever shorter intervals (1.1 s down to flashMinMs). */
export function rampTimes(): number[] {
  const c = GAME.cutscene;
  const start = c.blackMs + c.growMs * 0.42;
  const end = c.blackMs + c.growMs * 0.84;
  const out: number[] = [];
  let t = start;
  while (t < end) {
    out.push(t);
    const k = (t - start) / (end - start);
    t += 1100 + (c.flashMinMs - 1100) * Math.pow(k, 0.7);
  }
  return out;
}

/** Times of the double pulse (ms). */
export function pulseTimes(): number[] {
  const c = GAME.cutscene;
  return c.pulseAt.map((f) => c.blackMs + c.growMs * f);
}

/** The moment the signature break hits (ms), by climax kind. */
export function breakTime(def: CutsceneDef, extraMs: number): number {
  const tl = cutsceneTimeline(extraMs);
  switch (def.climax) {
    case 'shatter':
      return tl.growEnd + extraMs * SHATTER_AT;
    case 'freeze':
      return tl.growEnd + extraMs * FREEZE_SHATTER_AT;
    case 'split':
      return tl.growEnd + extraMs * SPLIT_AT;
    case 'supernova':
      return tl.growEnd + extraMs * 0.7;
    default:
      return tl.growEnd;
  }
}

/** Fraction of the climax at which the frame breaks (shatter) or the cut falls (split). */
export const SHATTER_AT = 0.6;
export const FREEZE_SHATTER_AT = 0.65;
export const SPLIT_AT = 0.12;

export type CsCueName = 'jingle' | 'pulse' | 'tick' | 'flash' | 'break';

export interface CsCue {
  t: number;
  cue: CsCueName;
  kind?: string;
}

/** Everything that happens at a moment (audio follows these, the picture draws them). */
export function cutsceneCues(def: CutsceneDef, extraMs: number): CsCue[] {
  const cues: CsCue[] = [{ t: 0, cue: 'jingle' }];
  const ramp = def.ramp?.kind;
  if (ramp === 'flashes' || ramp === 'ticks') for (const t of rampTimes()) cues.push({ t, cue: ramp === 'flashes' ? 'flash' : 'tick' });
  for (const t of pulseTimes()) cues.push({ t, cue: 'pulse' });
  const tl = cutsceneTimeline(extraMs);
  if (def.climax === 'freeze') cues.push({ t: tl.growEnd, cue: 'break', kind: 'freeze' });
  if (def.climax !== 'none') cues.push({ t: breakTime(def, extraMs), cue: 'break', kind: def.climax === 'freeze' ? 'shatter' : def.climax });
  return cues.sort((a, b) => a.t - b.t);
}

/** Value of a counter ramp at time t (ms): accelerates over the build-up, holds at the end. */
export function counterValue(r: Extract<CsRamp, { kind: 'counter' }>, t: number): number {
  const c = GAME.cutscene;
  const start = c.blackMs + c.growMs * 0.35;
  const end = c.blackMs + c.growMs;
  const k = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return r.from + (r.to - r.from) * k * k;
}

export function formatCounter(r: Extract<CsRamp, { kind: 'counter' }>, v: number): string {
  const d = r.decimals ?? 0;
  const n = v.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
  return `${r.label ? `${r.label} ` : ''}${n}${r.unit ? ` ${r.unit}` : ''}`;
}

// ---------------------------------------------------------------------------
// Atmosphere
// ---------------------------------------------------------------------------

/** Coloured fog: soft cloud textures in two or three layers drifting with parallax. */
export function drawFog(ctx: CanvasRenderingContext2D, tex: HTMLCanvasElement[], W: number, H: number, t: number, alpha: number): void {
  if (alpha <= 0.01 || !tex.length) return;
  const size = Math.max(W, H) * 1.6;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  tex.forEach((tx, i) => {
    const s = t / 1000;
    const x = W / 2 + Math.cos(s * (0.05 + i * 0.03) + i * 2) * W * 0.14;
    const y = H / 2 + Math.sin(s * (0.04 + i * 0.025) + i) * H * 0.1;
    ctx.globalAlpha = alpha * (0.26 - i * 0.06);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s * 0.03 * (i % 2 ? -1 : 1) + i);
    ctx.drawImage(tx, -size / 2, -size / 2, size, size);
    ctx.restore();
  });
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

interface Mote {
  x: number;
  y: number;
  v: number;
  s: number;
  rot: number;
  vr: number;
  ph: number;
}

/** Theme particles (feathers, embers, bubbles, ...) in normalised screen space (-1..1). */
export class ThemeParticles {
  private pool: Mote[] = [];

  constructor(
    private spec: CsParticles,
    count: number,
  ) {
    for (let i = 0; i < count; i++) this.pool.push(this.spawn(true, i));
  }

  private spawn(initial: boolean, i = Math.floor(Math.random() * 1e6)): Mote {
    const m: Mote = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, v: 0.5 + Math.random(), s: 0.6 + Math.random() * 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2, ph: hash01(i) * TAU };
    const dir = this.spec.dir;
    if (!initial) {
      if (dir === 'fall') m.y = -1.1;
      if (dir === 'rise') m.y = 1.1;
      if (dir === 'in') {
        const a = Math.random() * TAU;
        m.x = Math.cos(a) * 1.3;
        m.y = Math.sin(a) * 1.3;
      }
      if (dir === 'out') {
        const a = Math.random() * TAU;
        m.x = Math.cos(a) * 0.05;
        m.y = Math.sin(a) * 0.05;
      }
    }
    return m;
  }

  update(dt: number, t: number): void {
    const dir = this.spec.dir;
    for (let i = 0; i < this.pool.length; i++) {
      const m = this.pool[i];
      m.rot += m.vr * dt;
      const sway = noise1(t / 1000 * 0.4 + m.ph, 3) * 0.08 * dt;
      if (dir === 'fall' || dir === 'rise') {
        m.y += (dir === 'fall' ? 1 : -1) * m.v * 0.22 * dt;
        m.x += sway;
        if (m.y > 1.15 || m.y < -1.15) this.pool[i] = this.spawn(false, i);
      } else if (dir === 'in' || dir === 'out') {
        const r = Math.hypot(m.x, m.y) || 0.001;
        const sp = m.v * 0.25 * dt * (dir === 'in' ? -1 : 1) * (0.4 + r);
        const tang = 0.35 * dt * (dir === 'in' ? 1 : 0.4);
        const nx = m.x / r;
        const ny = m.y / r;
        m.x += nx * sp - ny * tang * r;
        m.y += ny * sp + nx * tang * r;
        if ((dir === 'in' && r < 0.04) || (dir === 'out' && r > 1.4)) this.pool[i] = this.spawn(false, i);
      } else {
        m.x += noise1(t / 1000 * 0.2 + m.ph, 7) * 0.06 * dt;
        m.y += noise1(t / 1000 * 0.2 + m.ph + 9, 7) * 0.06 * dt;
        if (Math.abs(m.x) > 1.2) m.x = -m.x * 0.98;
        if (Math.abs(m.y) > 1.2) m.y = -m.y * 0.98;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number, alpha: number, color: (i: number) => string): void {
    if (alpha <= 0.01) return;
    const base = Math.min(W, H) / 60;
    const kind = this.spec.sprite;
    const big = kind === 'feather' || kind === 'petal' || kind === 'bubble';
    ctx.globalCompositeOperation = kind === 'bubble' ? 'source-over' : 'lighter';
    for (let i = 0; i < this.pool.length; i++) {
      const m = this.pool[i];
      const r = Math.hypot(m.x, m.y);
      // Fade near the centre so the particles never cover the symbol's star.
      const centre = this.spec.dir === 'in' || this.spec.dir === 'out' ? smooth((r - 0.06) / 0.25) : 1;
      const s = base * m.s * (kind === 'bubble' ? 1.5 : big ? 2.4 : 1.2);
      const x = W / 2 + m.x * W * 0.55;
      const y = H / 2 + m.y * H * 0.55;
      ctx.globalAlpha = alpha * (kind === 'bubble' ? 0.45 : 0.75) * centre;
      ctx.setTransform(1, 0, 0, 1, x, y);
      if (kind === 'feather' || kind === 'petal' || kind === 'shard' || kind === 'crystal') ctx.rotate(m.rot);
      ctx.drawImage(sprite(kind, color(i)), -s, -s, s * 2, s * 2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------------------
// Build-up
// ---------------------------------------------------------------------------

/** Text card: uppercase, letter-spaced, words appear one after another, then it fades. */
export function drawTextCard(ctx: CanvasRenderingContext2D, line: CsLine, t: number, W: number, H: number, glow: string): void {
  if (t < line.from || t > line.to) return;
  const words = line.text.split(' ');
  const len = line.to - line.from;
  const age = t - line.from;
  const out = 1 - smooth((t - (line.to - 350)) / 350);
  const size = Math.round(Math.max(14, Math.min(W, H) * 0.045));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.font = `600 ${size}px Fredoka, system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const spacing = size * 0.18;
  const widthOf = (w: string) => ctx.measureText(w).width + spacing * Math.max(0, w.length - 1);
  const space = size * 0.45;
  const total = words.reduce((s, w) => s + widthOf(w), 0) + space * (words.length - 1);
  // Long lines wrap onto a second row.
  const rows: string[][] = total > W * 0.86 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)), words.slice(Math.ceil(words.length / 2))] : [words];
  const y0 = line.place === 'center' ? H * 0.5 : H * 0.8;
  let wi = 0;
  rows.forEach((row, ri) => {
    const rowW = row.reduce((s, w) => s + widthOf(w), 0) + space * (row.length - 1);
    let x = (W - rowW) / 2;
    const y = y0 + (ri - (rows.length - 1) / 2) * size * 1.45;
    for (const word of row) {
      // Word i appears at i / n of the first 45 % of the card.
      const at = (wi / words.length) * len * 0.45;
      const a = smooth((age - at) / 180) * out;
      if (a > 0.01) {
        ctx.globalAlpha = a;
        ctx.shadowColor = glow;
        ctx.shadowBlur = size * 0.6;
        ctx.fillStyle = '#ffffff';
        let cx = x;
        for (const ch of word) {
          ctx.fillText(ch, cx, y);
          cx += ctx.measureText(ch).width + spacing;
        }
      }
      x += widthOf(word) + space;
      wi++;
    }
  });
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

/** Ramp flash: a beam of light crosses the screen through the centre and fades. */
export function drawRampFlash(ctx: CanvasRenderingContext2D, W: number, H: number, age: number, index: number, color: string, reduced: boolean): void {
  const life = 280;
  if (age < 0 || age > life) return;
  const e = age / life;
  const a = Math.pow(1 - e, 2) * (reduced ? 0.18 : 0.5);
  const cx = W / 2;
  const cy = H / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  if (reduced) {
    // A soft glow instead of a sharp beam.
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.5);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const ang = hash01(index * 13 + 5) * Math.PI;
    const len = Math.hypot(W, H);
    const w = Math.min(W, H) * (0.025 + 0.04 * hash01(index * 7));
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    const g = ctx.createLinearGradient(0, -w, 0, w);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.5, rgba(mix(color, '#ffffff', 0.6), a));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-len / 2, -w, len, w * 2);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

/** Tick: a brief glint in the centre (the sound carries most of it). */
export function drawTick(ctx: CanvasRenderingContext2D, W: number, H: number, age: number, color: string, reduced: boolean): void {
  const life = 220;
  if (age < 0 || age > life) return;
  const e = age / life;
  const s = Math.min(W, H) * (0.05 + 0.05 * e);
  ctx.setTransform(1, 0, 0, 1, W / 2, H / 2);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = (1 - e) * (reduced ? 0.3 : 0.7);
  ctx.drawImage(sprite('star4', mix(color, '#ffffff', 0.5)), -s, -s, s * 2, s * 2);
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

export function drawCounter(ctx: CanvasRenderingContext2D, text: string, W: number, H: number, alpha: number, glow: string): void {
  if (alpha <= 0.01) return;
  const size = Math.round(Math.max(13, Math.min(W, H) * 0.038));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `600 ${size}px Fredoka, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = alpha;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, W / 2, H * 0.2);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Break and reveal
// ---------------------------------------------------------------------------

/** Crack lines running out from the centre (k = 0..1 grows them). */
export function drawCracks(ctx: CanvasRenderingContext2D, W: number, H: number, k: number, seed: number): void {
  if (k <= 0) return;
  const cx = W / 2;
  const cy = H / 2;
  const maxR = Math.hypot(W, H) * 0.55;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  for (let c = 0; c < 9; c++) {
    const a0 = (c / 9) * TAU + hash01(seed + c) * 0.5;
    const reach = maxR * k * (0.55 + 0.45 * hash01(seed + c * 3));
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    let r = 0;
    let a = a0;
    let i = 0;
    while (r < reach) {
      r = Math.min(reach, r + maxR * 0.07);
      a += (hash01(seed + c * 31 + i) - 0.5) * 0.35;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      i++;
    }
    for (const [w, al] of [[Math.min(W, H) * 0.012, 0.15], [Math.min(W, H) * 0.003, 0.9]] as [number, number][]) {
      ctx.lineWidth = w;
      ctx.strokeStyle = `rgba(255,255,255,${al})`;
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

interface Shard {
  pts: [number, number][];
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  vr: number;
}

/** The frame breaks into shards that fly apart and fall (cut from a snapshot of the frame). */
export class Shatter {
  private snap: HTMLCanvasElement;
  private shards: Shard[] = [];

  constructor(source: HTMLCanvasElement, seed: number) {
    const W = source.width;
    const H = source.height;
    this.snap = document.createElement('canvas');
    this.snap.width = W;
    this.snap.height = H;
    this.snap.getContext('2d')!.drawImage(source, 0, 0);
    const cx = W / 2;
    const cy = H / 2;
    const maxR = Math.hypot(W, H) * 0.75;
    const rings = [0, 0.12, 0.3, 0.55, 1];
    const per = [5, 9, 13, 17];
    for (let ri = 0; ri < per.length; ri++) {
      const n = per[ri];
      const off = hash01(seed + ri) * TAU;
      for (let i = 0; i < n; i++) {
        const j = (k: number) => (hash01(seed + ri * 97 + i * 7 + k) - 0.5) * (TAU / n) * 0.35;
        const a0 = off + (i / n) * TAU + j(1);
        const a1 = off + ((i + 1) / n) * TAU + j(2);
        const r0 = rings[ri] * maxR;
        const r1 = rings[ri + 1] * maxR;
        const pts: [number, number][] =
          r0 === 0
            ? [[cx, cy], [cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1]]
            : [[cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0], [cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1], [cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0]];
        const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        const d = Math.hypot(mx - cx, my - cy) / maxR;
        const sp = Math.min(W, H) * (0.25 + 0.6 * d + 0.3 * hash01(seed + ri * 13 + i));
        const ang = Math.atan2(my - cy, mx - cx);
        this.shards.push({ pts, cx: mx, cy: my, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - Math.min(W, H) * 0.15, vr: (hash01(seed + i * 5 + ri) - 0.5) * 3 });
      }
    }
  }

  /** age in seconds since the break. */
  draw(ctx: CanvasRenderingContext2D, age: number, W: number, H: number): void {
    const g = Math.min(W, H) * 1.6;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (const s of this.shards) {
      const dx = s.vx * age;
      const dy = s.vy * age + 0.5 * g * age * age;
      ctx.save();
      ctx.translate(s.cx + dx, s.cy + dy);
      ctx.rotate(s.vr * age);
      ctx.translate(-s.cx, -s.cy);
      ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(this.snap, 0, 0);
      ctx.restore();
      // Bright cut edge.
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 - age)})`;
      ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.003);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/** Screen edges glow inward (one colour, or left / right in two colours). */
export function drawEdgeGlow(ctx: CanvasRenderingContext2D, W: number, H: number, k: number, colors: string[], t: number): void {
  if (k <= 0.01) return;
  const d = Math.min(W, H) * 0.3;
  const a = k * (0.5 + 0.08 * Math.sin(t / 1000 * TAU * 0.8));
  const c0 = colors[0];
  const c1 = colors[1] ?? colors[0];
  const mid = mix(c0, c1, 0.5);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  const edge = (x0: number, y0: number, x1: number, y1: number, col: string, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, rgba(mix(col, '#ffffff', 0.25), a));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  edge(0, 0, d, 0, c0, 0, 0, d, H);
  edge(W, 0, W - d, 0, c1, W - d, 0, d, H);
  edge(0, 0, 0, d * 0.8, mid, 0, 0, W, d * 0.8);
  edge(0, H, 0, H - d * 0.8, mid, 0, H - d * 0.8, W, d * 0.8);
  ctx.globalCompositeOperation = 'source-over';
}

/** Cinematic bars (top stage); k = 0..1 slides them in. */
export function drawLetterbox(ctx: CanvasRenderingContext2D, W: number, H: number, k: number): void {
  if (k <= 0.01) return;
  const h = H * 0.085 * smooth(k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, h);
  ctx.fillRect(0, H - h, W, h);
}

/** Colour of a particle: palette index, 'spectrum' (each particle its own hue) or hex. */
export function particleColor(palette: string[], c: CsParticles['color'], i: number): string {
  if (c === 'spectrum') return spectral(i * 47);
  if (typeof c === 'string') return c;
  return palette[(c ?? 0) % palette.length];
}
