// Small standalone scene for the collection detail view: one planet with one aura.

import type { AuraDef } from '../config';
import { AuraRenderer, drawMood } from './aura';
import { REF_R, type View } from './particles';
import { Planet } from './planet';

export class AuraPreviewScene {
  private ctx: CanvasRenderingContext2D;
  private aura: AuraRenderer;
  private planet = new Planet();
  private raf = 0;
  private last = 0;
  private t = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    aura: AuraDef,
    quality: number,
    reduced: boolean,
    planetLevel: number,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.aura = new AuraRenderer(() => quality, () => reduced);
    this.aura.setAura(aura);
    this.planet.setLevel(planetLevel, false);
    // Pre-warm so the preview opens fully formed.
    for (let i = 0; i < 20; i++) this.aura.update(0.05);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 260;
    const h = c.clientHeight || 260;
    if (c.width !== Math.round(w * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = this.ctx;
    this.aura.update(dt);
    this.planet.update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(c.width / 2, c.height / 2, 0, c.width / 2, c.height / 2, c.width * 0.7);
    g.addColorStop(0, '#0d1230');
    g.addColorStop(1, '#03040c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    drawMood(ctx, this.aura.mood(), c.width, c.height, c.width / 2, c.height / 2, this.t, true);
    const r = Math.min(w, h) * 0.13;
    const s = (r / REF_R) * dpr;
    const view: View = { s, tx: (w / 2) * dpr, ty: (h / 2) * dpr };
    this.aura.drawBack(ctx, view, 2);
    this.planet.drawBack(ctx, view, 1);
    this.planet.drawBody(ctx, view, 1, this.aura.atmosphere());
    this.planet.drawFront(ctx, view, 1);
    this.aura.drawFront(ctx, view, 2);
    this.aura.drawPost(ctx, c.width, c.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this.raf = requestAnimationFrame(this.frame);
  };
}
