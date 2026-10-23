// Cutscene toolkit. Timeline (from the prototype), with the dramaturgy in five acts on top
// (src/render/cutscene-acts.ts, DECISIONS.md "Cutscene-Dramaturgie"):
//   1. 3 s black, a short jingle (top stage: first text card, letterbox bars)
//   2. 10 s: coloured fog and theme particles; a symbol in the aura colours grows linearly
//      and spins ever faster (110°/s -> 260°/s, about 5.5 turns); its star is always in
//      front; text cards and a ramp (flashes, ticks, counter) build tension
//   3. double pulse of the symbol, then the signature break in the climax window
//      (shatter, split, freeze, stall, rewind, converge, pulse, invert, supernova)
//   4. the edges glow, the symbol fills the screen while a white flash rises -> reveal
//   5. top stage: after-echo on the stage (monochrome, beam of light, thunder)
// Each aura composes its symbol from reusable layers (config: aura.cutscene).

import { AURA_BY_ID, GAME, tierOf, type AuraDef, type CsBackdrop, type CsLayer, type CutsceneDef } from '../config';
import type { CutscenePlayer } from '../game/controller';
import type { GameStore } from '../store/store';
import { hash01, mix, noise1, rgba, spectral } from './color';
import {
  breakTime,
  counterValue,
  type CsCue,
  type CsLine,
  type CsStage,
  cutsceneCues,
  cutsceneLines,
  cutsceneStage,
  drawCounter,
  drawCracks,
  drawEdgeGlow,
  drawFog,
  drawLetterbox,
  drawRampFlash,
  drawTextCard,
  drawTick,
  FREEZE_SHATTER_AT,
  formatCounter,
  particleColor,
  pulseTimes,
  rampTimes,
  Shatter,
  SHATTER_AT,
  SPLIT_AT,
  ThemeParticles,
} from './cutscene-acts';
import { glowSprite, sprite } from './sprites';
import { nebulaTex } from './vfx/tex';

const TAU = Math.PI * 2;

interface Mote {
  x: number;
  y: number;
  z: number;
  v: number;
  a: number;
  s: number;
}

function smooth(x: number): number {
  const k = Math.max(0, Math.min(1, x));
  return k * k * (3 - 2 * k);
}

/** 'saturation' blending (freeze) is missing in a few browsers; they get a grey veil. */
const CAN_SATURATE = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d')!;
    c.globalCompositeOperation = 'saturation';
    return c.globalCompositeOperation === 'saturation';
  } catch {
    return false;
  }
})();

/** Total rotation (degrees) after fraction tau of the grow phase. */
export function cutsceneAngle(tau: number): number {
  const c = GAME.cutscene;
  const seconds = c.growMs / 1000;
  const w0 = c.rotStartDegPerSec;
  const w1 = c.rotEndDegPerSec;
  const p = c.rotCurve;
  return seconds * (w0 * tau + ((w1 - w0) * Math.pow(tau, p + 1)) / (p + 1));
}

export class CutsceneRunner implements CutscenePlayer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private last = 0;
  private t = 0;
  private aura: AuraDef | null = null;
  private def: CutsceneDef | null = null;
  private extraMs = 0;
  private resolveReveal: (() => void) | null = null;
  private revealed = false;
  private motes: Mote[] = [];
  private onSkip: (() => void) | null = null;
  private replay = false;
  // Dramaturgy (src/render/cutscene-acts.ts).
  private stage: CsStage = 'high';
  private lines: CsLine[] = [];
  private cues: CsCue[] = [];
  private nextCue = 0;
  private ramp: number[] = [];
  private pulses: number[] = [];
  private fog: HTMLCanvasElement[] = [];
  private particles: ThemeParticles | null = null;
  private shatter: Shatter | null = null;
  private shatterAt = 0;
  private seed = 1;

  constructor(
    private game: GameStore,
    private host: HTMLElement,
  ) {}

  /** Optional hook (audio fades the Deep Boom when skipping). */
  setSkipHandler(fn: () => void): void {
    this.onSkip = fn;
  }

  play(auraId: string, opts: { replay?: boolean } = {}): Promise<void> {
    const aura = AURA_BY_ID[auraId];
    if (!aura?.cutscene) return Promise.resolve();
    this.cleanup();
    this.replay = !!opts.replay;
    this.aura = aura;
    this.def = aura.cutscene;
    const tier = tierOf(aura);
    this.extraMs = tier.staging.cutsceneExtraMs;
    this.t = 0;
    this.revealed = false;
    this.motes = [];
    const def = aura.cutscene;
    this.seed = Math.floor(hash01(auraId.length * 131 + auraId.charCodeAt(0)) * 1e6);
    this.stage = cutsceneStage(tier.rank);
    this.lines = cutsceneLines(def, tier.rank, this.extraMs);
    this.cues = cutsceneCues(def, this.extraMs);
    this.nextCue = 0;
    this.ramp = def.ramp?.kind === 'flashes' || def.ramp?.kind === 'ticks' ? rampTimes() : [];
    this.pulses = pulseTimes();
    const fogCols = def.fog === false ? [] : (def.fog ?? [0, 1]).map((i) => def.palette[i % def.palette.length]);
    const low = this.game.settings.vfxQuality === 'low';
    this.fog = fogCols.length ? [0, 1, 2].slice(0, low ? 2 : 3).map((i) => nebulaTex(i % 2 ? [...fogCols].reverse() : fogCols, (this.seed + i * 17) % 500, 192)) : [];
    this.particles = def.particles ? new ThemeParticles(def.particles, Math.round((def.particles.count ?? 56) * (low ? 0.5 : 1))) : null;
    this.shatter = null;
    const c = document.createElement('canvas');
    c.className = 'cutscene-layer';
    c.setAttribute('aria-label', 'Cutscene');
    c.addEventListener('pointerdown', this.skip);
    this.host.appendChild(c);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
    return new Promise((resolve) => {
      this.resolveReveal = resolve;
    });
  }

  private get b(): number {
    return GAME.cutscene.blackMs;
  }
  private get g(): number {
    return GAME.cutscene.growMs;
  }
  private get fillStart(): number {
    return this.b + this.g + this.extraMs;
  }
  private get revealAt(): number {
    return this.fillStart + GAME.cutscene.fillMs;
  }
  private get endAt(): number {
    return this.revealAt + GAME.cutscene.revealMs;
  }

  private skip = (): void => {
    if ((!this.game.settings.cutsceneSkip && !this.replay) || this.t >= this.fillStart) return;
    this.t = this.fillStart;
    // Skipped moments stay silent.
    while (this.nextCue < this.cues.length && this.cues[this.nextCue].t <= this.t) this.nextCue++;
    if (this.aura) this.game.bus.emit('cutsceneCue', { aura: this.aura.id, cue: 'skip' });
    this.onSkip?.();
  };

  private onVisibility = (): void => {
    if (document.hidden) cancelAnimationFrame(this.raf);
    else {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  };

  private resize = (): void => {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
  };

  private frame = (now: number): void => {
    const dt = Math.min(50, now - this.last);
    this.last = now;
    this.t += dt;
    while (this.aura && this.nextCue < this.cues.length && this.cues[this.nextCue].t <= this.t) {
      const c = this.cues[this.nextCue++];
      this.game.bus.emit('cutsceneCue', { aura: this.aura.id, cue: c.cue, kind: c.kind });
    }
    if (!this.revealed && this.t >= this.revealAt) {
      this.revealed = true;
      const r = this.resolveReveal;
      this.resolveReveal = null;
      r?.();
    }
    if (this.t >= this.endAt) {
      this.cleanup();
      if (this.aura) this.game.bus.emit('cutscene', { aura: this.aura.id, phase: 'end' });
      return;
    }
    this.draw(dt / 1000);
    this.raf = requestAnimationFrame(this.frame);
  };

  private cleanup(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    this.shatter = null;
  }

  // -------------------------------------------------------------------------

  private draw(dt: number): void {
    const ctx = this.ctx!;
    const c = this.canvas!;
    const def = this.def!;
    const W = c.width;
    const H = c.height;
    const dpr = W / window.innerWidth;
    const t = this.t;
    const reduced = this.game.settings.reducedEffects;
    // With reduced effects the flash is a softer, tinted light instead of pure white.
    const flash = reduced ? mix(def.palette[0], '#ffffff', 0.55) : '#ffffff';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // Fade-out of the flash after the reveal.
    if (t >= this.revealAt) {
      ctx.clearRect(0, 0, W, H);
      const k = (t - this.revealAt) / GAME.cutscene.revealMs;
      ctx.fillStyle = rgba(flash, 1 - smooth(k));
      ctx.fillRect(0, 0, W, H);
      return;
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const fillT = t >= this.fillStart ? (t - this.fillStart) / GAME.cutscene.fillMs : 0;
    const bars = this.stage === 'top' ? Math.min(1, t / 600) * (1 - smooth(fillT)) : 0;
    const glowCol = def.palette[0];

    // Act 1: withdrawal (black; the top stage opens with its first text card).
    if (t < this.b) {
      this.drawLines(ctx, t, W, H, glowCol);
      drawLetterbox(ctx, W, H, bars);
      return;
    }

    const cx = W / 2;
    const cy = H / 2;
    const unit = (Math.min(W, H) / 60) * 1;
    const growEnd = this.b + this.g;
    const growT = Math.min(1, (t - this.b) / this.g);
    const climaxT = this.extraMs > 0 ? Math.max(0, Math.min(1, (t - growEnd) / this.extraMs)) : 0;
    const inClimax = t >= growEnd && t < this.fillStart;
    const frozen = def.climax === 'freeze' && t >= growEnd;

    // Rotation (a freeze stops it dead).
    let angle = cutsceneAngle(growT);
    if (t > growEnd && !frozen) {
      const extra = (Math.min(t, this.fillStart) - growEnd) / 1000;
      const w1 = GAME.cutscene.rotEndDegPerSec;
      switch (def.climax) {
        case 'stall':
          angle += w1 * extra * (1 - climaxT * 0.5) * (1 - climaxT);
          break;
        case 'rewind':
          angle += w1 * extra - 1.6 * w1 * extra * climaxT;
          break;
        default:
          angle += w1 * extra;
      }
      if (fillT > 0) angle += (w1 * (t - this.fillStart)) / 1000;
    }

    // Scale (linear growth, "deliberately not huge").
    const cs = GAME.cutscene;
    let scale = (cs.scaleFrom + (cs.scaleTo - cs.scaleFrom) * growT) * unit;
    if (inClimax) {
      if (def.climax === 'pulse') scale *= 1 + 0.12 * Math.pow(Math.max(0, Math.sin(climaxT * Math.PI * (4 + climaxT * 10))), 4);
      if (def.climax === 'converge') scale *= 1 + 0.05 * Math.sin(t / 90);
      if (def.climax === 'supernova') scale *= climaxT < 0.7 ? 1 - 0.8 * smooth(climaxT / 0.7) : 0.2 + 3 * smooth((climaxT - 0.7) / 0.3);
    }
    if (fillT > 0) {
      const cover = (Math.hypot(W, H) / 2 / 30) * 1.5;
      scale = scale + (cover - scale) * Math.pow(fillT, 2.2);
    }

    if (this.shatter) {
      // Act 4: the frame has broken, only its shards remain.
      this.shatter.draw(ctx, (t - this.shatterAt) / 1000, W, H);
    } else {
      // Act 2: atmosphere - backdrop, coloured fog, theme particles.
      const backdropAlpha = smooth((growT - 0.12) / 0.88) * 0.85 + (inClimax ? 0.15 : 0);
      this.drawBackdrop(ctx, def.backdrop, W, H, dt, backdropAlpha, growT + climaxT, reduced);
      const atmo = smooth(growT / 0.2) * (frozen ? 1 - 0.5 * climaxT : 1);
      drawFog(ctx, this.fog, W, H, frozen ? this.b + this.g : t, atmo);
      if (this.particles) {
        if (!frozen) this.particles.update(dt, t);
        this.particles.draw(ctx, W, H, atmo, (i) => particleColor(def.palette, def.particles!.color, i));
      }

      // Act 3: the symbol (with the double pulse and, for 'split', cut in two halves).
      let jx = 0;
      let jy = 0;
      if (inClimax && (def.climax === 'stall' || def.climax === 'shatter') && !reduced) {
        const amp = (def.climax === 'shatter' ? 6 : 3) * climaxT * dpr;
        jx = (Math.random() - 0.5) * amp;
        jy = (Math.random() - 0.5) * amp;
      }
      const symbolAlpha = Math.min(1, (t - this.b) / 600);
      this.drawSymbol(ctx, def, cx + jx, cy + jy, (angle * Math.PI) / 180, scale, symbolAlpha, t, W, H);

      // Ramp: flashes / ticks / counter.
      const ramp = def.ramp;
      if (ramp && !frozen) {
        for (let i = this.ramp.length - 1; i >= 0; i--) {
          const age = t - this.ramp[i];
          if (age < 0) continue;
          if (age > 300) break;
          if (ramp.kind === 'flashes') drawRampFlash(ctx, W, H, age, i, glowCol, reduced);
          else drawTick(ctx, W, H, age, glowCol, reduced);
        }
        if (ramp.kind === 'counter') {
          const a = smooth((t - (this.b + this.g * 0.3)) / 500) * (1 - smooth(fillT * 3));
          drawCounter(ctx, formatCounter(ramp, counterValue(ramp, t)), W, H, a, glowCol);
        }
      }

      // Act 4: the signature break.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (inClimax || (fillT > 0 && def.climax === 'split')) this.drawClimax(ctx, def, inClimax ? climaxT : 1, W, H, cx, cy, scale, reduced);
      if ((def.climax === 'shatter' || def.climax === 'freeze') && t >= breakTime(def, this.extraMs)) {
        this.shatter = new Shatter(c, this.seed);
        this.shatterAt = t;
      }
    }

    // Act 5: the edges glow up before the flash.
    const edge = def.edge ?? [0];
    drawEdgeGlow(ctx, W, H, smooth((t - (this.fillStart - GAME.cutscene.edgeMs)) / GAME.cutscene.edgeMs), edge.map((i) => def.palette[i % def.palette.length]), t);

    this.drawLines(ctx, t, W, H, glowCol);
    drawLetterbox(ctx, W, H, bars);

    // Skip hint.
    if ((this.game.settings.cutsceneSkip || this.replay) && t < this.fillStart) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `500 ${Math.round(13 * dpr)}px Fredoka, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Tippen zum Überspringen', W / 2, H - 28 * dpr);
    }

    // Flash while the symbol fills the screen.
    if (fillT > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = rgba(flash, Math.pow(fillT, 1.6));
      ctx.fillRect(0, 0, W, H);
    }
  }

  private drawLines(ctx: CanvasRenderingContext2D, t: number, W: number, H: number, glow: string): void {
    for (const line of this.lines) drawTextCard(ctx, line, t, W, H, glow);
  }

  /**
   * The symbol: ghost copies of the motif swell out behind the star on the double pulse;
   * the star always sits in front. For the 'split' break the symbol is cut along a diagonal
   * and its halves drift apart.
   */
  private drawSymbol(ctx: CanvasRenderingContext2D, def: CutsceneDef, cx: number, cy: number, rad: number, scale: number, alpha: number, t: number, W: number, H: number): void {
    const time = t / 1000;
    const set = (s: number, dx = 0, dy = 0, rot = 0) => {
      const r = rad + rot;
      ctx.setTransform(s * Math.cos(r), s * Math.sin(r), -s * Math.sin(r), s * Math.cos(r), cx + dx, cy + dy);
    };
    const motif = def.layers.filter((l) => l.kind !== 'star');
    const stars = def.layers.filter((l) => l.kind === 'star');
    const echo = motif.length ? motif : stars;
    let flare = 0;
    for (const tp of this.pulses) {
      const e = (t - tp) / 700;
      if (e < 0 || e > 1) continue;
      flare = Math.max(flare, 1 - e);
      set(scale * (1 + 0.5 * smooth(e)));
      ctx.globalAlpha = alpha * 0.7 * Math.pow(1 - e, 1.5);
      for (const l of echo) this.drawLayer(ctx, l, def.palette, time);
    }
    const draw = (dx = 0, dy = 0, rot = 0) => {
      set(scale, dx, dy, rot);
      ctx.globalAlpha = alpha;
      for (const l of motif) this.drawLayer(ctx, l, def.palette, time);
      set(scale * (1 + 0.18 * flare), dx, dy, rot);
      ctx.globalAlpha = alpha;
      for (const l of stars) this.drawLayer(ctx, l, def.palette, time);
    };
    const cutAt = this.b + this.g + this.extraMs * SPLIT_AT;
    if (def.climax !== 'split' || t < cutAt) {
      draw();
    } else {
      const k = Math.min(1.4, (t - cutAt) / Math.max(1, this.fillStart + GAME.cutscene.fillMs - cutAt));
      const d = Math.pow(k, 1.4) * Math.min(W, H) * 0.22;
      const a = (-35 * Math.PI) / 180;
      const dir = [Math.cos(a), Math.sin(a)];
      const n = [-dir[1], dir[0]];
      const L = Math.hypot(W, H);
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath();
        ctx.moveTo(cx - dir[0] * L, cy - dir[1] * L);
        ctx.lineTo(cx + dir[0] * L, cy + dir[1] * L);
        ctx.lineTo(cx + dir[0] * L + side * n[0] * L, cy + dir[1] * L + side * n[1] * L);
        ctx.lineTo(cx - dir[0] * L + side * n[0] * L, cy - dir[1] * L + side * n[1] * L);
        ctx.closePath();
        ctx.clip();
        draw(side * n[0] * d, side * n[1] * d, side * 0.08 * k);
        ctx.restore();
      }
      // Light in the gap.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, 1 - k) * 0.9;
      ctx.strokeStyle = mix(def.palette[0], '#ffffff', 0.6);
      ctx.lineWidth = Math.max(2, d * 0.35);
      ctx.beginPath();
      ctx.moveTo(cx - dir[0] * L, cy - dir[1] * L);
      ctx.lineTo(cx + dir[0] * L, cy + dir[1] * L);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  private color(palette: string[], idx: number | 'spectrum' | undefined, time: number, i = 0): string {
    if (idx === 'spectrum') return spectral(time * 120 + i * 50);
    return palette[(idx ?? 0) % palette.length];
  }

  private drawLayer(ctx: CanvasRenderingContext2D, l: CsLayer, pal: string[], time: number): void {
    const col = this.color(pal, l.color, time);
    const col2 = this.color(pal, l.color2 ?? 1, time, 1);
    const r = l.r ?? 30;
    const [ox, oy] = l.offset ?? [0, 0];
    const a = l.alpha ?? 1;
    ctx.save();
    ctx.translate(ox, oy);
    if (l.spin) ctx.rotate(time * l.spin);
    switch (l.kind) {
      case 'glow': {
        ctx.globalCompositeOperation = 'lighter';
        const prev = ctx.globalAlpha;
        ctx.globalAlpha = prev * a;
        ctx.drawImage(glowSprite(col, 0.25), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
        ctx.globalAlpha = prev;
        break;
      }
      case 'circle': {
        if (l.fill) {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          g.addColorStop(0, rgba(col, 0.25 * a));
          g.addColorStop(0.7, rgba(col, 0.13 * a));
          g.addColorStop(1, rgba(col, l.width === 0 ? 0.9 * a : 0));
          ctx.fillStyle = l.width === 0 ? col : g;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, TAU);
          ctx.fill();
        }
        if ((l.width ?? 3) > 0) {
          if (l.dash) ctx.setLineDash(l.dash);
          ctx.globalCompositeOperation = 'lighter';
          for (const [w, al] of [[(l.width ?? 3) * 5, 0.12], [(l.width ?? 3) * 2.2, 0.3], [l.width ?? 3, 1]] as [number, number][]) {
            ctx.strokeStyle = rgba(col, al * a);
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }
        break;
      }
      case 'star': {
        const n = l.points ?? 4;
        const inner = l.inner ?? 0.3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(glowSprite(col, 0.3), -r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
        ctx.globalCompositeOperation = 'source-over';
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.55, col);
        g.addColorStop(1, col2);
        ctx.fillStyle = g;
        ctx.globalAlpha *= a;
        ctx.beginPath();
        for (let i = 0; i < n * 2; i++) {
          const rr = i % 2 === 0 ? r : r * inner;
          const ang = -Math.PI / 2 + (i * Math.PI) / n;
          if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
          else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha /= a;
        break;
      }
      case 'shards': {
        const n = l.count ?? 7;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU;
          const d = r * (0.75 + 0.25 * (i % 2));
          ctx.save();
          ctx.rotate(ang);
          ctx.translate(d, 0);
          ctx.rotate(ang * 0.6 + time);
          const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 9);
          g.addColorStop(0, '#ffffff');
          g.addColorStop(0.5, col);
          g.addColorStop(1, col2);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(8, -3);
          ctx.lineTo(5, 8);
          ctx.lineTo(-6, 6);
          ctx.lineTo(-8, -3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'cracks': {
        const n = l.count ?? 5;
        ctx.strokeStyle = rgba(col, 0.6 * a);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU + 0.26;
          const len = r * (0.55 + (i % 3) * 0.18);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          let x = 0;
          let y = 0;
          for (let k = 1; k <= 4; k++) {
            x = Math.cos(ang + (hash01(i * 7 + k) - 0.5) * 0.5) * (len * k) / 4;
            y = Math.sin(ang + (hash01(i * 7 + k) - 0.5) * 0.5) * (len * k) / 4;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'prismRings': {
        const n = l.count ?? 3;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const rr = r * (1 - i * 0.28);
          const c = spectral(time * 140 + i * 70);
          for (const [w, al] of [[10, 0.12], [4.5, 0.3], [2.4, 1]] as [number, number][]) {
            ctx.strokeStyle = rgba(c, al * a);
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, TAU);
            ctx.stroke();
          }
        }
        break;
      }
      case 'orbiters': {
        const n = l.count ?? 8;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU + time * (l.param ?? 1) * (i % 2 ? 1 : 1.4);
          const rr = r * (0.75 + 0.25 * hash01(i + 3));
          const c = l.color === 'spectrum' ? spectral(i * 40 + time * 90) : col;
          ctx.drawImage(sprite('dot', c), Math.cos(ang) * rr - 4, Math.sin(ang) * rr - 4, 8, 8);
        }
        break;
      }
      case 'wings': {
        const n = l.count ?? 6;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const side = i % 2 ? 1 : -1;
          const k = Math.floor(i / 2);
          const ang = (side < 0 ? Math.PI : 0) + side * (k - 1) * 0.55 * (1 + 0.1 * Math.sin(time * 3));
          const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * r, Math.sin(ang) * r);
          g.addColorStop(0, rgba('#ffffff', a));
          g.addColorStop(0.6, rgba(col, 0.7 * a));
          g.addColorStop(1, rgba(col2, 0));
          ctx.fillStyle = g;
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          ctx.beginPath();
          ctx.moveTo(nx * 3, ny * 3);
          ctx.quadraticCurveTo(Math.cos(ang) * r * 0.5 + nx * 9, Math.sin(ang) * r * 0.5 + ny * 9, Math.cos(ang) * r, Math.sin(ang) * r);
          ctx.quadraticCurveTo(Math.cos(ang) * r * 0.5 - nx * 5, Math.sin(ang) * r * 0.5 - ny * 5, -nx * 3, -ny * 3);
          ctx.fill();
        }
        break;
      }
      case 'clock': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * TAU;
          const len = i % 3 === 0 ? 7 : 4;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * (r - len), Math.sin(ang) * (r - len));
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          ctx.stroke();
        }
        ctx.strokeStyle = col2;
        for (const [sp, len, w] of [[0.6, 0.55, 3], [3.2, 0.8, 2]] as [number, number, number][]) {
          const ang = -time * sp;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * r * len, Math.sin(ang) * r * len);
          ctx.stroke();
        }
        break;
      }
      case 'spiral': {
        const arms = l.count ?? 2;
        ctx.globalCompositeOperation = 'lighter';
        for (let arm = 0; arm < arms; arm++) {
          for (let i = 0; i < 40; i++) {
            const f = i / 40;
            const rr = 6 + f * r;
            const ang = (arm / arms) * TAU + Math.log(rr / 6) * 1.5;
            const c = i % 3 === 0 ? col2 : col;
            const s = 6 * (1 - f * 0.5);
            ctx.drawImage(sprite('dot', c), Math.cos(ang) * rr - s / 2, Math.sin(ang) * rr - s / 2, s, s);
          }
        }
        break;
      }
      case 'fieldLines': {
        const n = l.count ?? 6;
        ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < n; k++) {
          const side = k % 2 ? 1 : -1;
          const L = r * (0.45 + 0.55 * ((Math.floor(k / 2) + 1) / Math.ceil(n / 2)));
          ctx.strokeStyle = rgba(k % 2 ? col : col2, 0.8 * a);
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i <= 30; i++) {
            const th = 0.3 + ((Math.PI - 0.6) * i) / 30;
            const s = Math.sin(th);
            const x = side * L * s * s * s;
            const y = -L * s * s * Math.cos(th);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'web': {
        const n = l.count ?? 12;
        const pts = Array.from({ length: n }, (_, i) => {
          const ang = (i / n) * TAU + hash01(i) * 0.4;
          const rr = r * (0.45 + 0.55 * hash01(i + 11));
          return [Math.cos(ang) * rr, Math.sin(ang) * rr];
        });
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(col, 0.6 * a);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          for (const j of [i + 1, i + 3]) {
            const p = pts[j % n];
            ctx.moveTo(pts[i][0], pts[i][1]);
            ctx.lineTo(p[0], p[1]);
          }
        }
        ctx.stroke();
        for (const [x, y] of pts) ctx.drawImage(sprite('dot', col2), x - 4, y - 4, 8, 8);
        break;
      }
      case 'cells': {
        const n = l.count ?? 6;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU + time * 0.4;
          const rr = r * 0.6;
          const x = Math.cos(ang) * rr;
          const y = Math.sin(ang) * rr;
          const s = r * (0.28 + 0.05 * Math.sin(time * 3 + i));
          ctx.drawImage(glowSprite(i % 2 ? col : col2, 0.4), x - s * 1.6, y - s * 1.6, s * 3.2, s * 3.2);
          ctx.strokeStyle = rgba(col, 0.8 * a);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, TAU);
          ctx.stroke();
        }
        break;
      }
      case 'mobius': {
        ctx.globalCompositeOperation = 'lighter';
        const N = 60;
        const W2 = r * 0.3;
        for (let i = 0; i < N; i++) {
          const u0 = (i / N) * TAU;
          const u1 = ((i + 1) / N) * TAU;
          const pt = (u: number, s: number): [number, number] => {
            const o = s * W2 * Math.cos(u / 2);
            return [Math.cos(u) * (r + o), Math.sin(u) * (r + o) * 0.55 - s * W2 * Math.sin(u / 2) * 0.8];
          };
          const facing = Math.cos(u0 / 2);
          ctx.fillStyle = rgba(facing >= 0 ? col : col2, (0.35 + 0.4 * Math.abs(facing)) * a);
          const [ax, ay] = pt(u0, 1);
          const [bx, by] = pt(u1, 1);
          const [cx2, cy2] = pt(u1, -1);
          const [dx, dy] = pt(u0, -1);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.lineTo(cx2, cy2);
          ctx.lineTo(dx, dy);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'rays': {
        const n = l.count ?? 12;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU;
          const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * r, Math.sin(ang) * r);
          g.addColorStop(0, rgba(col, a));
          g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang - 0.06) * r, Math.sin(ang - 0.06) * r);
          ctx.lineTo(Math.cos(ang + 0.06) * r, Math.sin(ang + 0.06) * r);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'polygon': {
        const n = l.points ?? 3;
        ctx.globalCompositeOperation = 'lighter';
        for (const [w, al] of [[(l.width ?? 2) * 4, 0.15], [l.width ?? 2, 1]] as [number, number][]) {
          ctx.strokeStyle = rgba(col, al * a);
          ctx.lineWidth = w;
          ctx.beginPath();
          for (let i = 0; i <= n; i++) {
            const ang = -Math.PI / 2 + (i / n) * TAU;
            if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
            else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
          }
          ctx.stroke();
        }
        break;
      }
      case 'lemniscate': {
        ctx.globalCompositeOperation = 'lighter';
        for (const [w, al, c] of [[8, 0.15, col], [3, 0.6, col], [1.5, 1, col2]] as [number, number, string][]) {
          ctx.strokeStyle = rgba(c, al * a);
          ctx.lineWidth = w;
          ctx.beginPath();
          for (let i = 0; i <= 80; i++) {
            const s = (i / 80) * TAU;
            const sn = Math.sin(s);
            const den = 1 + sn * sn;
            const x = (r * Math.cos(s)) / den;
            const y = (r * sn * Math.cos(s)) / den;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'jets': {
        ctx.globalCompositeOperation = 'lighter';
        for (const dir of [1, -1]) {
          const g = ctx.createLinearGradient(0, 0, 0, dir * r);
          g.addColorStop(0, rgba('#ffffff', a));
          g.addColorStop(0.4, rgba(col, 0.8 * a));
          g.addColorStop(1, rgba(col2, 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(0, dir * r);
          ctx.lineTo(4, 0);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 'moon': {
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        g.addColorStop(0, '#ffd0c8');
        g.addColorStop(0.5, col);
        g.addColorStop(1, col2);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(30,0,6,0.45)';
        ctx.beginPath();
        ctx.arc(r * 0.35, r * 0.2, r * 0.9, 0, TAU);
        ctx.fill();
        break;
      }
      case 'rift': {
        const n = l.count ?? 3;
        ctx.globalCompositeOperation = 'lighter';
        const seed = Math.floor(time * 8);
        for (let i = 0; i < n; i++) {
          ctx.strokeStyle = rgba(i % 2 ? col : '#ffffff', 0.9 * a);
          ctx.lineWidth = 2;
          ctx.beginPath();
          const ang = (i / n) * TAU;
          for (let k = 0; k <= 6; k++) {
            const f = k / 6;
            const x = Math.cos(ang) * r * (f * 2 - 1) + (hash01(seed * 31 + i * 7 + k) - 0.5) * 10;
            const y = Math.sin(ang) * r * (f * 2 - 1) + (hash01(seed * 17 + i * 5 + k) - 0.5) * 10;
            if (k === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        break;
      }
      case 'pixels': {
        const n = l.count ?? 16;
        const seed = Math.floor(time * 6);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const x = (hash01(seed * 13 + i) - 0.5) * r * 2;
          const y = (hash01(seed * 29 + i) - 0.5) * r * 2;
          ctx.fillStyle = rgba(i % 2 ? col : col2, a);
          ctx.fillRect(x, y, 4, 4);
        }
        break;
      }
      case 'sparkles': {
        const n = l.count ?? 20;
        const dir = l.param ?? -1;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) {
          const ph = (time * 0.6 + hash01(i)) % 1;
          const f = dir < 0 ? 1 - ph : ph;
          const ang = hash01(i + 50) * TAU;
          const rr = r * (0.2 + 0.8 * f);
          const s = 7 * (dir < 0 ? f : 1 - f) + 2;
          ctx.globalAlpha *= 1;
          ctx.drawImage(sprite('star4', col), Math.cos(ang) * rr - s / 2, Math.sin(ang) * rr - s / 2, s, s);
        }
        break;
      }
    }
    ctx.restore();
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, kind: CsBackdrop, W: number, H: number, dt: number, alpha: number, progress: number, reduced: boolean): void {
    if (kind === 'none' || alpha <= 0.01) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cx = W / 2;
    const cy = H / 2;
    const max = Math.hypot(W, H) / 2;
    if (kind === 'void') {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, max);
      const col = this.def!.palette[0];
      g.addColorStop(0, rgba(col, 0.12 * alpha));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (kind === 'spectrum') {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const ang = this.t / 4000 + (i * TAU) / 5;
        const x = cx + Math.cos(ang) * max * 0.5;
        const y = cy + Math.sin(ang) * max * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, max * 0.7);
        g.addColorStop(0, rgba(spectral(i * 72 + this.t / 30), 0.16 * alpha));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    if (kind === 'blood') {
      const g = ctx.createRadialGradient(cx, cy, max * 0.2, cx, cy, max);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(120,0,16,${0.55 * alpha})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (kind === 'static') {
      if (reduced) return;
      ctx.fillStyle = `rgba(200,205,220,${0.05 * alpha})`;
      for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      return;
    }
    // Particle based backdrops: stars (warp outward), streaks (inward), embers, snow.
    const target = 140;
    while (this.motes.length < target) {
      this.motes.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random(), v: 0.3 + Math.random() * 0.7, a: Math.random() * TAU, s: 0.5 + Math.random() * 1.5 });
    }
    ctx.globalCompositeOperation = 'lighter';
    const speed = 0.08 + progress * 0.9;
    for (const m of this.motes) {
      if (kind === 'stars' || kind === 'spectrum' || kind === 'blood') {
        m.z -= dt * speed * m.v;
        if (m.z <= 0.02) {
          m.z = 1;
          m.x = (Math.random() - 0.5) * 2;
          m.y = (Math.random() - 0.5) * 2;
        }
        const px = cx + (m.x / m.z) * W * 0.25;
        const py = cy + (m.y / m.z) * H * 0.25;
        const s = m.s * (1.5 - m.z) * (W / 600);
        ctx.fillStyle = kind === 'blood' ? rgba('#ff6a6a', alpha * (1 - m.z)) : rgba('#e6ecff', alpha * (1 - m.z));
        ctx.fillRect(px, py, s, s);
      } else if (kind === 'streaks') {
        m.z += dt * speed * m.v;
        if (m.z >= 1) m.z = 0;
        const r = max * (1 - m.z);
        ctx.strokeStyle = rgba('#dfe6ff', alpha * m.z);
        ctx.lineWidth = m.s;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(m.a) * r, cy + Math.sin(m.a) * r);
        ctx.lineTo(cx + Math.cos(m.a) * (r + 40), cy + Math.sin(m.a) * (r + 40));
        ctx.stroke();
      } else if (kind === 'embers' || kind === 'snow') {
        const up = kind === 'embers' ? -1 : 1;
        m.y += up * dt * m.v * 0.25;
        m.x += noise1(this.t / 1000 + m.a, 3) * dt * 0.05;
        if (m.y < -1.1) m.y = 1.1;
        if (m.y > 1.1) m.y = -1.1;
        const px = cx + m.x * W * 0.5;
        const py = cy + m.y * H * 0.5;
        const c = kind === 'embers' ? '#ff8a3d' : '#cfe6ff';
        const s = m.s * 3 * (W / 900);
        ctx.globalAlpha = alpha * (0.4 + 0.6 * m.z);
        ctx.drawImage(sprite('dot', c), px - s, py - s, s * 2, s * 2);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawClimax(ctx: CanvasRenderingContext2D, def: CutsceneDef, k: number, W: number, H: number, cx: number, cy: number, scale: number, reduced: boolean): void {
    const col = def.palette[0];
    ctx.globalCompositeOperation = 'lighter';
    switch (def.climax) {
      case 'converge': {
        for (let i = 0; i < 60; i++) {
          const ang = hash01(i) * TAU;
          const f = (hash01(i + 9) + k * 2.5) % 1;
          const r = Math.hypot(W, H) * 0.6 * (1 - f);
          const s = 3 + 6 * f;
          ctx.globalAlpha = f;
          ctx.drawImage(sprite('dot', i % 2 ? col : def.palette[1 % def.palette.length]), cx + Math.cos(ang) * r - s, cy + Math.sin(ang) * r - s, s * 2, s * 2);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'shatter': {
        // Cracks run out from the centre until the frame breaks (see Shatter in draw()).
        drawCracks(ctx, W, H, k / SHATTER_AT, this.seed);
        break;
      }
      case 'freeze': {
        // Time stops: colour drains from the frame, then it cracks and breaks.
        const grey = smooth(k / 0.35);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (CAN_SATURATE) {
          ctx.globalCompositeOperation = 'saturation';
          ctx.fillStyle = `rgba(128,128,128,${grey})`;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(40,42,50,${grey * 0.45})`;
        }
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        drawCracks(ctx, W, H, (k - 0.3) / (FREEZE_SHATTER_AT - 0.3), this.seed);
        break;
      }
      case 'split': {
        // The cut: a blade of light sweeps along the diagonal (the halves are drawn by drawSymbol).
        const e = (k - SPLIT_AT * 0.4) / (SPLIT_AT * 0.9);
        if (e > 0 && e < 1.4) {
          const a = (-35 * Math.PI) / 180;
          const L = Math.hypot(W, H);
          const head = -L / 2 + L * Math.min(1, e);
          ctx.translate(cx, cy);
          ctx.rotate(a);
          const g = ctx.createLinearGradient(head - L * 0.4, 0, head, 0);
          g.addColorStop(0, rgba(col, 0));
          g.addColorStop(1, rgba('#ffffff', Math.max(0, 1.2 - e) * (reduced ? 0.4 : 0.9)));
          ctx.fillStyle = g;
          ctx.fillRect(head - L * 0.4, -Math.min(W, H) * 0.006, L * 0.4, Math.min(W, H) * 0.012);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        break;
      }
      case 'pulse': {
        // Heartbeat: soft swells of light (no rings).
        const beats = 4 + Math.floor(k * 8);
        const ph = (k * beats) % 1;
        const s = scale * 34 * (1 + ph * 1.6);
        ctx.globalAlpha = (1 - ph) * 0.45;
        ctx.drawImage(glowSprite(col, 0.3), cx - s, cy - s, s * 2, s * 2);
        ctx.globalAlpha = 1;
        break;
      }
      case 'invert': {
        if (reduced) break;
        const ph = (k * 6) % 1;
        if (ph < 0.12) {
          ctx.globalCompositeOperation = 'difference';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, W, H);
        }
        break;
      }
      case 'supernova': {
        if (k > 0.7) {
          // The explosion: a burst of light floods outward (no ring).
          const e = (k - 0.7) / 0.3;
          const R = Math.hypot(W, H) * 0.6 * (0.2 + e);
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
          g.addColorStop(0, rgba('#ffffff', (1 - e) * 0.8));
          g.addColorStop(0.5, rgba(col, (1 - e) * 0.45));
          g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        } else {
          const s = scale * 40 * (1 + k);
          ctx.globalAlpha = k;
          ctx.drawImage(glowSprite(col, 0.4), cx - s, cy - s, s * 2, s * 2);
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'stall':
      case 'rewind': {
        const s = scale * 60;
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(k * 30);
        ctx.drawImage(glowSprite(col, 0.4), cx - s, cy - s, s * 2, s * 2);
        ctx.globalAlpha = 1;
        break;
      }
      default:
        break;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
