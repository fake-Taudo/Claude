// Main stage renderer (canvas behind the UI). Owns the frame loop, layout and DPR handling.
// Layers: background (stars, biome) -> aura back layer -> planet -> aura front layer -> roll fx.

import { AURA_BY_ID } from '../config';
import { activeBiome } from '../core/biomes';
import type { GameStore } from '../store/store';

export interface PlanetLayout {
  x: number;
  y: number;
  r: number;
}

export class Stage {
  readonly ctx: CanvasRenderingContext2D;
  w = 0;
  h = 0;
  dpr = 1;
  time = 0;
  planet: PlanetLayout = { x: 0, y: 0, r: 50 };
  private raf = 0;
  private last = 0;
  private running = false;
  private stars: { x: number; y: number; r: number; tw: number }[] = [];

  constructor(
    readonly canvas: HTMLCanvasElement,
    private root: HTMLElement,
    private game: GameStore,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.resize);
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
    const cap = this.game.settings.vfxQuality === 'low' ? 1 : this.game.settings.vfxQuality === 'medium' ? 1.5 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const portrait = h >= w;
    const r = Math.max(34, Math.min(96, Math.min(w, h) * (portrait ? 0.11 : 0.1)));
    this.planet = { x: w / 2, y: h * (portrait ? 0.43 : 0.47), r };
    this.root.style.setProperty('--px', `${this.planet.x}px`);
    this.root.style.setProperty('--py', `${this.planet.y}px`);
    this.root.style.setProperty('--pr', `${this.planet.r}px`);
    this.stars = Array.from({ length: Math.round((w * h) / 5000) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + 0.2, tw: Math.random() * 6 }));
  };

  private frame = (t: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    this.time += dt;
    this.draw(dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(_dt: number): void {
    const { ctx, w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    const biome = activeBiome(Date.now());
    bg.addColorStop(0, biome ? biome.colors.sky : '#070a1a');
    bg.addColorStop(1, '#02030a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (const s of this.stars) {
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(this.time * 1.3 + s.tw);
      ctx.fillStyle = '#cfd8ff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.globalAlpha = 1;
    const { x, y, r } = this.planet;
    const aura = this.game.state.equippedAura ? AURA_BY_ID[this.game.state.equippedAura] : null;
    if (aura) {
      ctx.strokeStyle = aura.colors.glow;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = this.time * 0.6 + (i / 12) * Math.PI * 2;
        ctx.fillStyle = aura.colors.glow;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#9fb4ff');
    g.addColorStop(1, '#24306a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
