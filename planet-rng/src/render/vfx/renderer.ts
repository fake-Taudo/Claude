// Aura VFX renderer: owns the aura instances (crossfade on change), draws the slots,
// the stage treatment (dim, desaturate, tint, vignette, title scrim), the camera zoom
// and the light the aura casts onto the avatar.

import type { AuraDef } from '../../config';
import { VFX, VTIERS } from '../../config/vfx/tiers';
import type { Quality, Slot, VTier } from '../../config/vfx/types';
import { vfxOf } from '../../config/vfx';
import { rgba } from '../color';
import { AuraInstance, type AvatarLight, type FrameEnv, mixLight } from './core';
import './heroes/all';
import { createLayer } from './layers';
import { clamp01, easeOut, smooth } from './math';

export interface VfxStats {
  particles: number;
  layers: number;
  instances: number;
}

function canSaturate(): boolean {
  try {
    const c = document.createElement('canvas').getContext('2d')!;
    c.globalCompositeOperation = 'saturation';
    return c.globalCompositeOperation === 'saturation';
  } catch {
    return false;
  }
}

export class VfxRenderer {
  instances: AuraInstance[] = [];
  private currentId: string | null = null;
  /** Camera zoom transition. */
  private camFrom = 1;
  private camTo = 1;
  private camT = 1;
  private canDesat = canSaturate();
  /** Lab overrides. */
  tierOverride: VTier | undefined;
  disabledLayers = new Set<number>();
  /** Aura whose textures are being baked ahead of time, one slice per frame. */
  private warm: { inst: AuraInstance; next: number } | null = null;

  constructor(
    private quality: () => Quality,
    private reduced: () => boolean,
  ) {}

  get current(): AuraInstance | null {
    return this.instances.find((i) => !i.dying) ?? null;
  }

  get auraId(): string | null {
    return this.currentId;
  }

  setAura(aura: AuraDef | null, opts: { skipIntro?: boolean; force?: boolean } = {}): void {
    const id = aura?.id ?? null;
    if (id === this.currentId && !opts.force) return;
    this.currentId = id;
    for (const i of this.instances) i.kill();
    const from = this.cameraZoom();
    if (aura) {
      const inst = new AuraInstance(aura, vfxOf(aura), createLayer, {
        quality: this.quality,
        reduced: this.reduced,
        skipIntro: opts.skipIntro,
        tier: this.tierOverride,
      });
      inst.layers.forEach((l, i) => (l.enabled = !this.disabledLayers.has(i)));
      this.instances.push(inst);
    }
    this.camFrom = from;
    this.camTo = this.targetZoom();
    this.camT = opts.skipIntro ? 1 : 0;
  }

  private targetZoom(): number {
    const cur = this.current;
    if (!cur || this.reduced()) return 1;
    const z = cur.spec.screen?.cameraZoomOut ?? VTIERS[cur.tier].cameraZoomOut;
    return 1 - z;
  }

  /** Camera scale for planet and aura (zoom-out at V5/V6). */
  cameraZoom(): number {
    const k = easeOut(this.camT);
    return this.camFrom + (this.camTo - this.camFrom) * k;
  }

  /** Highest tier currently visible (DPR cap on phones). */
  maxTier(): VTier {
    let t: VTier = 0;
    for (const i of this.instances) if (i.tier > t) t = i.tier;
    return t;
  }

  replayIntro(): void {
    const cur = this.current;
    if (!cur) return;
    cur.replayIntro();
    this.camFrom = 1;
    this.camTo = this.targetZoom();
    this.camT = 0;
  }

  triggerAccent(clock: number): void {
    this.current?.triggerAccent(clock);
  }

  setLayerEnabled(index: number, on: boolean): void {
    if (on) this.disabledLayers.delete(index);
    else this.disabledLayers.add(index);
    const cur = this.current;
    if (cur && cur.layers[index]) cur.layers[index].enabled = on;
  }

  /**
   * Bakes the textures of an aura that is likely to be equipped soon (a rare roll in
   * progress), spread over the next frames, so the equip itself does not hitch.
   */
  prewarm(aura: AuraDef): void {
    if (aura.id === this.currentId || this.warm?.inst.aura.id === aura.id) return;
    const inst = new AuraInstance(aura, vfxOf(aura), createLayer, { quality: this.quality, reduced: this.reduced, lazy: true });
    this.warm = { inst, next: 0 };
  }

  private warmSlice(): void {
    const w = this.warm;
    if (!w) return;
    const specs = w.inst.spec.layers;
    const t0 = performance.now();
    // Constructing a layer bakes its textures into the shared cache; the layer is dropped.
    // At least one layer per frame (the budget check passes right after t0).
    while (w.next < specs.length && performance.now() - t0 < VFX.prewarmMsPerFrame) {
      const i = w.next++;
      createLayer(specs[i], w.inst, i);
    }
    if (w.next >= specs.length) this.warm = null;
  }

  update(env: FrameEnv): void {
    this.warmSlice();
    for (const i of this.instances) i.update(env);
    const dead = this.instances.filter((i) => i.dead);
    if (dead.length) {
      for (const d of dead) d.dispose();
      this.instances = this.instances.filter((i) => !i.dead);
    }
    this.camTo = this.targetZoom();
    if (this.camT < 1) this.camT = Math.min(1, this.camT + env.dt / VFX.cameraSec);
    else this.camFrom = this.camTo;
  }

  draw(slot: Slot, env: FrameEnv): void {
    for (const i of this.instances) i.draw(slot, env);
    env.ctx.globalAlpha = 1;
    env.ctx.globalCompositeOperation = 'source-over';
  }

  /** Stage treatment behind the aura: dim, desaturate, tint, vignette (device pixels). */
  drawScreenBack(env: FrameEnv, w: number, h: number, extraDim: number): void {
    const ctx = env.ctx;
    let dim = extraDim;
    let desat = 0;
    let vig = 0;
    let vigCol = '#000000';
    let tint: string | null = null;
    let tintA = 0;
    for (const i of this.instances) {
      const t = VTIERS[i.tier];
      const sc = i.spec.screen ?? {};
      const k = i.alpha * smooth(i.introT * 1.4);
      dim = Math.max(dim, (sc.dim ?? t.dim) * k);
      desat = Math.max(desat, (sc.desaturate ?? t.desaturate) * k);
      const v = (sc.vignette ?? t.vignette) * k;
      if (v > vig) {
        vig = v;
        vigCol = i.col(sc.vignetteColor ?? '#000000');
      }
      if (sc.tint && (sc.tintAlpha ?? 0) * k > tintA) {
        tint = i.col(sc.tint, env.clock);
        tintA = (sc.tintAlpha ?? 0) * k;
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (desat > 0.01) {
      if (this.canDesat) {
        ctx.globalCompositeOperation = 'saturation';
        ctx.fillStyle = `rgba(128,128,128,${desat})`;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(30,32,40,${desat * 0.4})`;
      }
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    if (dim > 0.01) {
      ctx.fillStyle = `rgba(0,0,4,${Math.min(0.9, dim)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (tint && tintA > 0.005) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rgba(tint, tintA);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (vig > 0.01) {
      const cx = env.view.tx;
      const cy = env.view.ty;
      const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.hypot(w, h) * 0.62);
      g.addColorStop(0, rgba(vigCol, 0));
      g.addColorStop(1, rgba(vigCol, Math.min(0.92, vig)));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /** Soft dark backdrop behind the title line so it stays readable (device pixels). */
  drawTitleScrim(env: FrameEnv, x: number, y: number, width: number, height: number): void {
    let k = 0;
    for (const i of this.instances) if (i.tier >= 3) k = Math.max(k, i.alpha * smooth(i.introT) * clamp01((i.tier - 2) / 3));
    if (k <= 0.01) return;
    const ctx = env.ctx;
    ctx.setTransform(width / 2, 0, 0, height / 2, x, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(2,3,10,${VFX.titleScrim * k})`);
    g.addColorStop(0.6, `rgba(2,3,10,${VFX.titleScrim * k * 0.6})`);
    g.addColorStop(1, 'rgba(2,3,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  light(): AvatarLight | null {
    const live = this.instances.filter((i) => i.alpha > 0);
    if (!live.length) return null;
    if (live.length === 1) return live[0].light();
    const a = live[0].light();
    const b = live[live.length - 1].light();
    return mixLight(a, b, live[live.length - 1].alpha);
  }

  stats(): VfxStats {
    let particles = 0;
    let layers = 0;
    for (const i of this.instances) {
      particles += i.particleCount();
      layers += i.layers.filter((l) => l.enabled).length;
    }
    return { particles, layers, instances: this.instances.length };
  }
}
