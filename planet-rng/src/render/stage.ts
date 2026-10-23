// Main stage renderer (canvas behind the UI). Owns the frame loop, layout and DPR handling.
// Draw order (back to front):
//   background -> stage treatment -> aura smoke/hero/beams/ground -> planet ->
//   aura front/particles -> roll fx -> aura screen front -> biome tint -> title scrim

import { AURA_BY_ID } from '../config';
import { QUALITY_SHARE, VFX, VTIERS } from '../config/vfx';
import type { Quality } from '../config/vfx/types';
import { activeBiome } from '../core/biomes';
import type { GameStore } from '../store/store';
import type { VfxQuality } from '../store/settings';
import { Background } from './background';
import { Planet } from './planet';
import { RollFx } from './rollfx';
import { REF_R, type View } from './view';
import type { FrameEnv } from './vfx/core';
import { VfxRenderer } from './vfx/renderer';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

/** Particle / layer share per VFX quality (also used by the background and roll fx). */
export const QUALITY_FACTOR: Record<VfxQuality, number> = QUALITY_SHARE;
const DPR_CAP: Record<VfxQuality, number> = { low: 1, medium: 1.5, high: 2 };
const QUALITIES: Quality[] = ['low', 'medium', 'high'];
/** Clock epoch: animations run on wall time so nothing restarts on reload. */
const EPOCH = Date.UTC(2026, 0, 1);

const coarse = (): boolean => {
  try {
    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  } catch {
    return false;
  }
};

export class Stage {
  readonly ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  time = 0;
  planet: PlanetLayout = { x: 0, y: 0, r: 50 };
  readonly vfx: VfxRenderer;
  readonly bg = new Background();
  readonly planetFx = new Planet();
  readonly rollFx: RollFx;
  private raf = 0;
  private last = 0;
  private running = false;
  private unsubs: (() => void)[] = [];
  private quality: VfxQuality;
  /** Frame time average for the adaptive quality guard. */
  private frameAvg = 16;
  private slowFor = 0;
  /** Quality ceiling chosen by the auto quality guard (only ever steps down). */
  autoQuality: Quality = 'high';
  /** Lab: disables the auto quality guard. */
  autoQualityEnabled = true;
  /** Lab: manual stepping with a fixed clock (deterministic screenshots). */
  manual = false;
  manualClock = 0;
  /** Lab: background override ('dark' | 'light'). */
  backdrop: 'normal' | 'dark' | 'light' = 'normal';
  /** Lab: hide the weather biome for comparable screenshots. */
  noBiome = false;
  private dprCap = 2;
  private env: FrameEnv;

  constructor(
    readonly canvas: HTMLCanvasElement,
    private root: HTMLElement,
    private game: GameStore,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.quality = game.settings.vfxQuality;
    const q = () => QUALITY_FACTOR[this.effectiveQuality()];
    const reduced = () => this.game.settings.reducedEffects;
    this.vfx = new VfxRenderer(() => this.effectiveQuality(), reduced);
    this.rollFx = new RollFx(q, reduced);
    this.env = {
      ctx: this.ctx,
      view: { s: 1, tx: 0, ty: 0 },
      clock: 0,
      dt: 0,
      q: 1,
      quality: 'high',
      reduced: false,
      stage: { left: 0, right: 0, top: 0, bottom: 0 },
    };
    this.planetFx.setLevel(game.state.rebirth, false);
    this.syncAura(false);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.unsubs.push(
      game.bus.on('game', (e) => {
        if (e.type === 'equipChanged' || e.type === 'rebirth') this.syncAura(false);
        if (e.type === 'rebirth') this.planetFx.setLevel(e.level, true);
      }),
      game.bus.on('stateReplaced', () => {
        this.planetFx.setLevel(game.state.rebirth, false);
        this.syncAura(false);
      }),
      game.bus.on('rollAnim', ({ duration, aura }) => {
        if (!game.settings.quickRoll) this.rollFx.startCharge(duration, aura);
      }),
      game.bus.on('reveal', ({ aura, quick }) => this.rollFx.reveal(aura, quick)),
      game.bus.on('rebirthFx', () => this.rollFx.rebirth()),
      game.bus.on('settings', (s) => {
        if (s.vfxQuality !== this.quality) {
          this.quality = s.vfxQuality;
          this.autoQuality = 'high';
          this.slowFor = 0;
          this.resize();
        }
      }),
    );
  }

  /** User quality limited by the auto quality guard. */
  effectiveQuality(): Quality {
    const user = this.game.settings.vfxQuality;
    return QUALITIES[Math.min(QUALITIES.indexOf(user), QUALITIES.indexOf(this.autoQuality))];
  }

  /** Lab override: the aura shown regardless of the equipped one. */
  labAura: string | null = null;

  syncAura(skipIntro: boolean): void {
    const id = this.labAura ?? this.game.state.equippedAura;
    this.vfx.setAura(id ? AURA_BY_ID[id] ?? null : null, { skipIntro });
    this.updateDprCap();
  }

  /** Phones get a lower DPR while a V5/V6 aura is shown. */
  private updateDprCap(): void {
    let cap = DPR_CAP[this.effectiveQuality()];
    if (coarse()) cap = Math.min(cap, VTIERS[this.vfx.maxTier()].mobileDpr);
    if (cap !== this.dprCap) {
      this.dprCap = cap;
      this.resize();
    }
  }

  destroy(): void {
    this.stop();
    for (const u of this.unsubs) u();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  start(): void {
    if (this.running || this.manual) return;
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
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
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
    this.root.style.setProperty('--pr', `${this.visualR()}px`);
    this.bg.resize(w, h, this.dpr);
  };

  /** Planet radius on screen (rebirth growth and camera zoom). */
  private visualR(): number {
    return this.planet.r * this.planetFx.scale() * this.vfx.cameraZoom();
  }

  /** Continuous clock in seconds (wall time, or the lab's manual clock). */
  clock(): number {
    return this.manual ? this.manualClock : (Date.now() - EPOCH) / 1000;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    const dtMs = now - this.last;
    const dt = Math.min(0.05, dtMs / 1000);
    this.last = now;
    this.frameAvg = this.frameAvg * 0.95 + dtMs * 0.05;
    this.guardQuality(dt);
    this.time += dt;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  /** Steps down the quality when frames stay slow for a few seconds; never steps up. */
  private guardQuality(dt: number): void {
    if (!this.autoQualityEnabled) return;
    if (this.frameAvg > VFX.autoQualityMs) this.slowFor += dt;
    else this.slowFor = Math.max(0, this.slowFor - dt * 0.5);
    if (this.slowFor > VFX.autoQualitySec) {
      const i = QUALITIES.indexOf(this.effectiveQuality());
      if (i > 0) {
        this.autoQuality = QUALITIES[i - 1];
        this.updateDprCap();
      }
      this.slowFor = 0;
      this.frameAvg = 16;
    }
  }

  /** Lab: advance the simulation manually by dt seconds in steps of 1/60 s. */
  step(seconds: number): void {
    let left = seconds;
    while (left > 1e-6) {
      const dt = Math.min(1 / 60, left);
      left -= dt;
      this.manualClock += dt;
      this.time += dt;
      this.update(dt);
    }
    this.draw();
  }

  private lastPr = 0;

  private makeEnv(dt: number): FrameEnv {
    const env = this.env;
    const q = this.effectiveQuality();
    env.clock = this.clock();
    env.dt = dt;
    env.quality = q;
    env.q = QUALITY_FACTOR[q];
    env.reduced = this.game.settings.reducedEffects;
    return env;
  }

  private update(dt: number): void {
    const pr = this.visualR();
    if (Math.abs(pr - this.lastPr) > 0.5) {
      this.lastPr = pr;
      this.root.style.setProperty('--pr', `${pr}px`);
    }
    const biome = this.noBiome ? null : activeBiome(Date.now());
    this.bg.setBiome(biome, QUALITY_FACTOR[this.effectiveQuality()]);
    this.bg.update(dt, this.time);
    const env = this.makeEnv(dt);
    this.setViews(env);
    this.vfx.update(env);
    this.planetFx.update(dt);
    this.rollFx.update(dt);
  }

  private auraView: View = { s: 1, tx: 0, ty: 0 };

  private setViews(env: FrameEnv): void {
    const { dpr } = this;
    const cam = this.vfx.cameraZoom();
    const s = (this.planet.r / REF_R) * dpr * cam;
    // Aura effects scale with the planet growth from rebirths.
    this.auraView.s = s * this.planetFx.scale();
    this.auraView.tx = this.planet.x * dpr;
    this.auraView.ty = this.planet.y * dpr;
    env.view = this.auraView;
    const k = 1 / this.auraView.s;
    env.stage.left = -this.auraView.tx * k;
    env.stage.right = (this.canvas.width - this.auraView.tx) * k;
    env.stage.top = -this.auraView.ty * k;
    env.stage.bottom = (this.canvas.height - this.auraView.ty) * k;
  }

  private draw(): void {
    const { ctx, dpr } = this;
    const reduced = this.game.settings.reducedEffects;
    const env = this.makeEnv(0);
    env.dt = 0;
    this.setViews(env);
    if (this.backdrop === 'normal') this.bg.draw(ctx, this.time, dpr, reduced);
    else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = this.backdrop === 'dark' ? '#000000' : '#c9ccd6';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const cam = this.vfx.cameraZoom();
    const pscale = this.planetFx.scale() * this.rollFx.planetScale();
    this.vfx.drawScreenBack(env, this.canvas.width, this.canvas.height, this.rollFx.suspenseDim());
    this.vfx.draw('screenBack', env);
    this.vfx.draw('smokeBack', env);
    this.vfx.draw('heroBack', env);
    this.vfx.draw('beams', env);
    this.vfx.draw('ground', env);

    const view: View = this.planetView;
    view.s = (this.planet.r / REF_R) * dpr * cam;
    view.tx = this.planet.x * dpr;
    view.ty = this.planet.y * dpr;
    const light = this.vfx.light();
    if (light) {
      // Shadows come in aura coordinates; convert to the planet's coordinates.
      const k = this.planetFx.scale();
      for (const sh of light.shadows) {
        sh.x *= k;
        sh.y *= k;
        sh.r *= k;
      }
    }
    this.planetFx.drawBack(ctx, view, pscale);
    this.planetFx.drawBody(ctx, view, pscale, light);
    this.planetFx.drawFront(ctx, view, pscale);

    this.vfx.draw('heroFront', env);
    this.vfx.draw('particles', env);
    this.rollFx.draw(ctx, this.auraView);
    this.vfx.draw('screenFront', env);
    this.bg.drawTint(ctx, dpr);
    const pr = this.visualR();
    this.vfx.drawTitleScrim(env, this.planet.x * dpr, (this.planet.y - pr * 2.75 - 24) * dpr, 300 * dpr, 92 * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private planetView: View = { s: 1, tx: 0, ty: 0 };

  /** Average frame time in ms (for diagnostics / adaptive quality). */
  get frameTime(): number {
    return this.frameAvg;
  }
}
