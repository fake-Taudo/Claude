// Main stage renderer (canvas behind the UI). Owns the frame loop, layout and DPR handling.
// Draw order: background -> mood -> aura back -> planet -> aura front -> roll fx -> tint -> post.

import { AURA_BY_ID } from '../config';
import { activeBiome } from '../core/biomes';
import type { GameStore } from '../store/store';
import type { VfxQuality } from '../store/settings';
import { AuraRenderer, drawMood } from './aura';
import { Background } from './background';
import { REF_R, type View } from './particles';
import { Planet } from './planet';
import { RollFx } from './rollfx';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

export const QUALITY_FACTOR: Record<VfxQuality, number> = { low: 0.35, medium: 0.65, high: 1 };
const DPR_CAP: Record<VfxQuality, number> = { low: 1, medium: 1.5, high: 2 };

function supportsSaturation(): boolean {
  try {
    const c = document.createElement('canvas').getContext('2d')!;
    c.globalCompositeOperation = 'saturation';
    return c.globalCompositeOperation === 'saturation';
  } catch {
    return false;
  }
}

export class Stage {
  readonly ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  time = 0;
  planet: PlanetLayout = { x: 0, y: 0, r: 50 };
  readonly aura: AuraRenderer;
  readonly bg = new Background();
  readonly planetFx = new Planet();
  readonly rollFx: RollFx;
  private raf = 0;
  private last = 0;
  private running = false;
  private canDesaturate = supportsSaturation();
  private unsubs: (() => void)[] = [];
  private quality: VfxQuality;
  /** Frame time average for the adaptive quality guard. */
  private frameAvg = 16;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private root: HTMLElement,
    private game: GameStore,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.quality = game.settings.vfxQuality;
    const q = () => QUALITY_FACTOR[this.game.settings.vfxQuality];
    const reduced = () => this.game.settings.reducedEffects;
    this.aura = new AuraRenderer(q, reduced);
    this.rollFx = new RollFx(q, reduced);
    this.planetFx.setLevel(game.state.rebirth, false);
    this.syncAura();
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.unsubs.push(
      game.bus.on('game', (e) => {
        if (e.type === 'equipChanged' || e.type === 'rebirth') this.syncAura();
        if (e.type === 'rebirth') this.planetFx.setLevel(e.level, true);
      }),
      game.bus.on('stateReplaced', () => {
        this.planetFx.setLevel(game.state.rebirth, false);
        this.syncAura();
      }),
      game.bus.on('rollAnim', ({ duration, aura }) => {
        if (!game.settings.quickRoll) this.rollFx.startCharge(duration, aura);
      }),
      game.bus.on('reveal', ({ aura, quick }) => this.rollFx.reveal(aura, quick)),
      game.bus.on('settings', (s) => {
        if (s.vfxQuality !== this.quality) {
          this.quality = s.vfxQuality;
          this.aura.setQuality(QUALITY_FACTOR[s.vfxQuality]);
          this.resize();
        }
      }),
    );
  }

  syncAura(): void {
    const id = this.game.state.equippedAura;
    this.aura.setAura(id ? AURA_BY_ID[id] ?? null : null);
  }

  destroy(): void {
    this.stop();
    for (const u of this.unsubs) u();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private onVisibility = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP[this.game.settings.vfxQuality]);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const portrait = h >= w;
    const short = h < 560;
    const r = Math.max(30, Math.min(92, Math.min(w, h) * (portrait ? 0.105 : short ? 0.13 : 0.1)));
    this.planet = { x: short ? w * 0.5 : w / 2, y: h * (portrait ? 0.43 : short ? 0.52 : 0.47), r };
    this.root.style.setProperty('--px', `${this.planet.x}px`);
    this.root.style.setProperty('--py', `${this.planet.y}px`);
    this.root.style.setProperty('--pr', `${this.planet.r * this.planetFx.scale()}px`);
    this.bg.resize(w, h, this.dpr);
  };

  private frame = (now: number): void => {
    if (!this.running) return;
    const dtMs = now - this.last;
    const dt = Math.min(0.05, dtMs / 1000);
    this.last = now;
    this.frameAvg = this.frameAvg * 0.95 + dtMs * 0.05;
    this.time += dt;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private lastPr = 0;

  private update(dt: number): void {
    const pr = this.planet.r * this.planetFx.scale();
    if (Math.abs(pr - this.lastPr) > 0.5) {
      this.lastPr = pr;
      this.root.style.setProperty('--pr', `${pr}px`);
    }
    const biome = activeBiome(Date.now());
    this.bg.setBiome(biome, QUALITY_FACTOR[this.game.settings.vfxQuality]);
    this.bg.update(dt, this.time);
    this.aura.update(dt);
    this.planetFx.update(dt);
    this.rollFx.update(dt);
  }

  private draw(): void {
    const { ctx, dpr } = this;
    const reduced = this.game.settings.reducedEffects;
    const glowPasses = this.game.settings.vfxQuality === 'high' ? 3 : this.game.settings.vfxQuality === 'medium' ? 2 : 1;
    this.bg.draw(ctx, this.time, dpr, reduced);

    const pscale = this.planetFx.scale() * this.rollFx.planetScale();
    const mood = this.aura.mood();
    mood.dim = Math.max(mood.dim, this.rollFx.suspenseDim());
    drawMood(ctx, mood, this.canvas.width, this.canvas.height, this.planet.x * dpr, this.planet.y * dpr, this.time, this.canDesaturate);

    const s = (this.planet.r / REF_R) * dpr;
    const view: View = { s, tx: this.planet.x * dpr, ty: this.planet.y * dpr };
    // Aura effects scale with the planet growth from rebirths.
    const auraView: View = { ...view, s: s * this.planetFx.scale() };

    this.aura.drawBack(ctx, auraView, glowPasses);
    this.planetFx.drawBack(ctx, view, pscale);
    this.planetFx.drawBody(ctx, view, pscale, this.aura.atmosphere());
    this.planetFx.drawFront(ctx, view, pscale);
    this.aura.drawFront(ctx, auraView, glowPasses);
    this.rollFx.draw(ctx, auraView);
    this.bg.drawTint(ctx, dpr);
    this.aura.drawPost(ctx, this.canvas.width, this.canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Average frame time in ms (for diagnostics / adaptive quality). */
  get frameTime(): number {
    return this.frameAvg;
  }
}
