// Overlay canvas for UI feedback particles (coins flying to the gold counter, sparkles on
// brewing / crafting / buying). Only runs a frame loop while particles are alive.

import type { GameStore } from '../store/store';
import { spectral } from './color';
import { sprite } from './sprites';

interface UiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  kind: 'coin' | 'sparkle';
  color: string;
  tx?: number;
  ty?: number;
  delay: number;
}

export class UiFx {
  private ctx: CanvasRenderingContext2D;
  private parts: UiParticle[] = [];
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private coin: HTMLCanvasElement | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private game: GameStore,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize);
    game.bus.on('fx', (e) => this.burst(e.kind, e.x, e.y, e.color, e.amount));
  }

  resize = (): void => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
  };

  private coinSprite(): HTMLCanvasElement {
    if (this.coin) return this.coin;
    const c = document.createElement('canvas');
    c.width = c.height = 40;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(15, 13, 2, 20, 20, 18);
    g.addColorStop(0, '#fff6c4');
    g.addColorStop(0.35, '#ffd84a');
    g.addColorStop(0.85, '#f0a400');
    g.addColorStop(1, '#a06000');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,80,0,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(20, 20, 12, 0, Math.PI * 2);
    ctx.stroke();
    this.coin = c;
    return c;
  }

  burst(kind: string, x: number, y: number, color?: string, amount = 12): void {
    if (this.game.settings.vfxQuality === 'low') amount = Math.ceil(amount / 2);
    const target = document.querySelector('[data-testid=hud-gold]')?.getBoundingClientRect();
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 120 + Math.random() * 260;
      if (kind === 'coins' && target) {
        this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0, max: 1.1 + Math.random() * 0.3, size: 14 + Math.random() * 6, kind: 'coin', color: '#ffd84a', tx: target.left + 18, ty: target.top + target.height / 2, delay: i * 0.025 });
      } else {
        this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.6 + Math.random() * 0.5, size: 10 + Math.random() * 10, kind: 'sparkle', color: color ?? spectral(Math.random() * 360), delay: 0 });
      }
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of this.parts) {
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      p.life += dt;
      const k = p.life / p.max;
      if (p.kind === 'coin' && p.tx !== undefined && p.ty !== undefined) {
        // Burst out, then home in on the gold counter.
        const home = Math.max(0, (k - 0.25) / 0.75);
        p.vx *= 1 - 3 * dt;
        p.vy = p.vy * (1 - 3 * dt) + 300 * dt * (1 - home);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const e = home * home;
        const x = p.x + (p.tx - p.x) * e;
        const y = p.y + (p.ty - p.y) * e;
        ctx.globalAlpha = Math.min(1, (1 - k) * 4);
        const s = p.size * (1 - home * 0.4);
        ctx.drawImage(this.coinSprite(), x - s / 2, y - s / 2, s, s);
      } else {
        p.vx *= 1 - 2.5 * dt;
        p.vy *= 1 - 2.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.pow(1 - k, 1.3);
        const s = p.size * (1 + k * 0.5);
        ctx.drawImage(sprite('star4', p.color), p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
    this.parts = this.parts.filter((p) => p.life < p.max);
    if (this.parts.length) this.raf = requestAnimationFrame(this.frame);
    else {
      this.raf = 0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };
}
