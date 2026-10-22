// Continuous aura VFX around the planet. Rolling never touches this; only equipping a
// different aura crossfades from the old layer to the new one.

import type { AuraDef, MoodDef } from '../config';
import { rgba, spectral, visible } from './color';
import { Emitter, REF_R, type View } from './particles';
import { Ring } from './rings';
import { createSpecial, type Special, type SpecialEnv } from './specials';
import { glowSprite } from './sprites';

const FADE_IN = 0.7;
const FADE_OUT = 0.6;

class AuraLayer {
  emitters: Emitter[];
  rings: Ring[];
  specials: Special[];
  alpha = 0;
  dying = false;
  time = 0;

  constructor(
    readonly aura: AuraDef,
    quality: number,
    env: SpecialEnv,
  ) {
    this.emitters = aura.vfx.emitters.map((e) => new Emitter(e, aura, quality));
    this.rings = aura.vfx.rings.slice(0, 3).map((r) => new Ring(r, aura));
    this.specials = (aura.vfx.specials ?? []).map((s) => createSpecial(s, aura, env));
  }

  tempo(): number {
    let t = this.aura.vfx.tempo ?? 1;
    for (const s of this.specials) t *= s.tempo(this.time);
    return t;
  }

  update(dt: number): void {
    const tempo = this.tempo();
    this.time += dt * tempo;
    if (this.dying) this.alpha = Math.max(0, this.alpha - dt / FADE_OUT);
    else this.alpha = Math.min(1, this.alpha + dt / FADE_IN);
    for (const e of this.emitters) e.update(dt, this.time, tempo);
    for (const r of this.rings) r.update(dt, this.time, tempo);
    for (const s of this.specials) s.update(dt * tempo, this.time);
  }

  release(): void {
    for (const e of this.emitters) e.release();
  }
}

export interface MoodState {
  dim: number;
  desaturate: number;
  veil: string | null;
  veilAlpha: number;
  spectrumVeil: number;
  vignette: string | null;
  vignetteAlpha: number;
}

export class AuraRenderer {
  private layers: AuraLayer[] = [];
  private current: string | null = null;
  readonly env: SpecialEnv;

  constructor(
    private qualityFactor: () => number,
    reduced: () => boolean,
  ) {
    const self = this;
    this.env = {
      get quality() {
        return self.qualityFactor();
      },
      get reduced() {
        return reduced();
      },
    };
  }

  get auraId(): string | null {
    return this.current;
  }

  setAura(aura: AuraDef | null): void {
    const id = aura?.id ?? null;
    if (id === this.current) return;
    this.current = id;
    for (const l of this.layers) l.dying = true;
    if (aura) this.layers.push(new AuraLayer(aura, this.qualityFactor(), this.env));
  }

  setQuality(q: number): void {
    for (const l of this.layers) for (const e of l.emitters) e.setQuality(q);
  }

  update(dt: number): void {
    for (const l of this.layers) l.update(dt);
    const dead = this.layers.filter((l) => l.dying && l.alpha <= 0);
    if (dead.length) {
      for (const l of dead) l.release();
      this.layers = this.layers.filter((l) => !dead.includes(l));
    }
  }

  /** Weighted background mood of all visible layers. */
  mood(): MoodState {
    const m: MoodState = { dim: 0, desaturate: 0, veil: null, veilAlpha: 0, spectrumVeil: 0, vignette: null, vignetteAlpha: 0 };
    for (const l of this.layers) {
      const d: MoodDef = l.aura.vfx.mood ?? {};
      const a = l.alpha;
      m.dim = Math.max(m.dim, (d.dim ?? 0) * a);
      m.desaturate = Math.max(m.desaturate, (d.desaturate ?? 0) * a);
      m.spectrumVeil = Math.max(m.spectrumVeil, (d.spectrumVeil ?? 0) * a);
      if (d.veil && (d.veilAlpha ?? 0) * a > m.veilAlpha) {
        m.veil = d.veil;
        m.veilAlpha = (d.veilAlpha ?? 0) * a;
      }
      if (d.vignette && a > m.vignetteAlpha) {
        m.vignette = d.vignette;
        m.vignetteAlpha = a;
      }
    }
    return m;
  }

  /** Core glow, back halves of rings, particles and specials behind the planet. */
  drawBack(ctx: CanvasRenderingContext2D, view: View, glowPasses: number): void {
    for (const l of this.layers) {
      if (l.alpha <= 0) continue;
      const core = l.aura.vfx.core;
      if (core) {
        const pulse = 1 + core.pulse * Math.sin(l.time * core.pulseHz * Math.PI * 2);
        const color = core.spectral ? spectral(l.time * 60) : visible(core.color ?? l.aura.colors.glow, l.aura.colors.glow);
        const size = core.size * REF_R * 2 * pulse;
        ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = l.alpha * 0.85;
        ctx.drawImage(glowSprite(color, 0.25), -size / 2, -size / 2, size, size);
        ctx.globalAlpha = 1;
      }
      for (const s of l.specials) s.back(ctx, view, l.alpha, l.time);
      for (const r of l.rings) r.draw(ctx, view, 'back', l.alpha, l.time, glowPasses);
      for (const e of l.emitters) e.draw(ctx, view, 'back', l.alpha, l.time);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Everything in front of the planet. */
  drawFront(ctx: CanvasRenderingContext2D, view: View, glowPasses: number): void {
    for (const l of this.layers) {
      if (l.alpha <= 0) continue;
      for (const r of l.rings) r.draw(ctx, view, 'front', l.alpha, l.time, glowPasses);
      for (const e of l.emitters) e.draw(ctx, view, 'front', l.alpha, l.time);
      for (const s of l.specials) s.front(ctx, view, l.alpha, l.time);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /** Screen space post effects (inversion). */
  drawPost(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const l of this.layers) for (const s of l.specials) s.post(ctx, w, h, l.alpha, l.time);
  }

  /** Atmosphere tint for the planet rim. */
  atmosphere(): { color: string; alpha: number } | null {
    const l = this.layers.find((x) => !x.dying) ?? this.layers[this.layers.length - 1];
    if (!l) return null;
    return { color: visible(l.aura.colors.glow, '#ffffff'), alpha: l.alpha };
  }
}

/** Draws background mood overlays in screen space. */
export function drawMood(ctx: CanvasRenderingContext2D, m: MoodState, w: number, h: number, cx: number, cy: number, t: number, canDesaturate: boolean): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (m.desaturate > 0.01) {
    if (canDesaturate) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = `rgba(128,128,128,${m.desaturate})`;
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(40,42,48,${m.desaturate * 0.5})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  if (m.dim > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${m.dim * 0.85})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (m.veil && m.veilAlpha > 0.005) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
    g.addColorStop(0, rgba(m.veil, m.veilAlpha * 1.4));
    g.addColorStop(1, rgba(m.veil, m.veilAlpha * 0.5));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (m.spectrumVeil > 0.005) {
    const shift = (t * 30) % 360;
    const g = ctx.createLinearGradient(0, 0, w, h);
    for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, rgba(spectral(shift + i * 60), m.spectrumVeil * 0.55));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (m.vignette && m.vignetteAlpha > 0.01) {
    const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.8);
    g.addColorStop(0, rgba(m.vignette, 0));
    g.addColorStop(1, rgba(m.vignette, 0.75 * m.vignetteAlpha));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}
