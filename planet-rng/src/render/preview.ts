// Small standalone scene for the collection detail view: one planet with one aura.

import type { AuraDef } from '../config';
import { QUALITY_SHARE, VTIERS, vfxOf } from '../config/vfx';
import type { Quality } from '../config/vfx/types';
import { Planet } from './planet';
import { REF_R, type View } from './view';
import type { FrameEnv } from './vfx/core';
import { VfxRenderer } from './vfx/renderer';

const EPOCH = Date.UTC(2026, 0, 1);

export class AuraPreviewScene {
  private ctx: CanvasRenderingContext2D;
  private vfx: VfxRenderer;
  private planet = new Planet();
  private raf = 0;
  private last = 0;
  private env: FrameEnv;
  private view: View = { s: 1, tx: 0, ty: 0 };
  private extent: number;

  constructor(
    private canvas: HTMLCanvasElement,
    aura: AuraDef,
    quality: Quality,
    reduced: boolean,
    planetLevel: number,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.vfx = new VfxRenderer(() => quality, () => reduced);
    this.vfx.setAura(aura, { skipIntro: true });
    const spec = vfxOf(aura);
    this.extent = spec.size ?? VTIERS[spec.tier].extent;
    this.planet.setLevel(planetLevel, false);
    this.env = {
      ctx: this.ctx,
      view: this.view,
      clock: 0,
      dt: 0,
      q: QUALITY_SHARE[quality],
      quality,
      reduced,
      stage: { left: 0, right: 0, top: 0, bottom: 0 },
    };
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 260;
    const h = c.clientHeight || 260;
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = this.ctx;
    // Fit the aura's extent into the preview, within sensible planet sizes.
    const r = Math.max(Math.min(w, h) * 0.075, Math.min(Math.min(w, h) * 0.16, (Math.min(w, h) * 0.5) / this.extent));
    const s = (r / REF_R) * dpr * this.vfx.cameraZoom();
    this.view.s = s;
    this.view.tx = (w / 2) * dpr;
    this.view.ty = (h * 0.47) * dpr;
    const env = this.env;
    env.clock = (Date.now() - EPOCH) / 1000;
    env.dt = dt;
    env.stage.left = -this.view.tx / s;
    env.stage.right = (c.width - this.view.tx) / s;
    env.stage.top = -this.view.ty / s;
    env.stage.bottom = (c.height - this.view.ty) / s;
    this.vfx.update(env);
    this.planet.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width * 0.7);
    g.addColorStop(0, '#0d1230');
    g.addColorStop(1, '#03040c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    this.vfx.drawScreenBack(env, c.width, c.height, 0);
    for (const slot of ['screenBack', 'smokeBack', 'heroBack', 'beams', 'ground'] as const) this.vfx.draw(slot, env);
    this.planet.drawBack(ctx, this.view, 1);
    this.planet.drawBody(ctx, this.view, 1, this.vfx.light());
    this.planet.drawFront(ctx, this.view, 1);
    for (const slot of ['heroFront', 'particles', 'screenFront'] as const) this.vfx.draw(slot, env);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this.raf = requestAnimationFrame(this.frame);
  };
}
