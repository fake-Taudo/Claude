// Space background: sky gradient, nebula, parallax starfield and biome weather.

import type { BiomeDef } from '../config';
import { mix, noise1, rgba } from './color';
import { glowSprite, sprite } from './sprites';

const TAU = Math.PI * 2;

function makeLayer(w: number, h: number, count: number, minR: number, maxR: number, brightness: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d')!;
  for (let i = 0; i < count; i++) {
    const r = minR + Math.pow(Math.random(), 3) * (maxR - minR);
    const tint = Math.random();
    ctx.fillStyle = tint < 0.15 ? `rgba(255,220,190,${brightness})` : tint < 0.35 ? `rgba(190,210,255,${brightness})` : `rgba(235,240,255,${brightness})`;
    ctx.globalAlpha = 0.35 + Math.random() * 0.65;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, TAU);
    ctx.fill();
  }
  return c;
}

function makeNebula(w: number, h: number): HTMLCanvasElement {
  const scale = 0.25;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * scale));
  c.height = Math.max(1, Math.round(h * scale));
  const ctx = c.getContext('2d')!;
  const colors = ['#3a1a7a', '#1a2a7a', '#0a3a5a', '#5a1a5a', '#1a1a4a'];
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = (0.25 + Math.random() * 0.45) * Math.max(c.width, c.height);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = colors[i % colors.length];
    g.addColorStop(0, rgba(col, 0.35));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  return c;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
  life: number;
}

abstract class BiomeFx {
  protected motes: Mote[] = [];
  dpr = 1;
  constructor(
    readonly biome: BiomeDef,
    protected quality: number,
  ) {}
  abstract update(dt: number, t: number, w: number, h: number): void;
  abstract draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void;
  /** Overall tint over the scene. */
  tint(): { color: string; alpha: number } | null {
    return null;
  }
}

class MeteorFx extends BiomeFx {
  private timer = 0;
  update(dt: number, _t: number, w: number, h: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.35 + Math.random() * 0.6;
      const speed = 600 + Math.random() * 500;
      this.motes.push({ x: w * (0.3 + Math.random() * 0.9), y: -20 - Math.random() * h * 0.2, vx: -speed * 0.7, vy: speed * 0.55, s: 70 + Math.random() * 90, a: 1, life: 2 });
    }
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;
    }
    this.motes = this.motes.filter((m) => m.life > 0 && m.y < h + 50 && m.x > -200);
  }
  draw(ctx: CanvasRenderingContext2D, _w: number, _h: number, _t: number, alpha: number): void {
    ctx.globalCompositeOperation = 'lighter';
    const img = sprite('streak', this.biome.colors.accent);
    for (const m of this.motes) {
      const ang = Math.atan2(m.vy, m.vx);
      const d = this.dpr;
      ctx.setTransform(Math.cos(ang) * d, Math.sin(ang) * d, -Math.sin(ang) * d, Math.cos(ang) * d, m.x * d, m.y * d);
      ctx.globalAlpha = alpha * 0.9;
      ctx.drawImage(img, -m.s, -m.s * 0.1, m.s, m.s * 0.2);
    }
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
  }
}

class SolarFx extends BiomeFx {
  update(dt: number, _t: number, w: number, h: number): void {
    const target = Math.round(70 * this.quality);
    while (this.motes.length < target) this.motes.push({ x: Math.random() * w, y: Math.random() * h, vx: 260 + Math.random() * 300, vy: 20 + Math.random() * 30, s: 14 + Math.random() * 26, a: 0.3 + Math.random() * 0.5, life: 1 });
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.x > w + 40) {
        m.x = -40;
        m.y = Math.random() * h;
      }
      if (m.y > h + 20) m.y = -20;
    }
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const size = Math.max(w, h) * (0.75 + 0.04 * Math.sin(t * 2));
    ctx.globalAlpha = alpha * 0.8;
    ctx.drawImage(glowSprite(this.biome.colors.glow, 0.25), w * 1.02 - size / 2, -h * 0.08 - size / 2, size, size);
    const img = sprite('streak', this.biome.colors.accent);
    for (const m of this.motes) {
      ctx.globalAlpha = alpha * m.a;
      ctx.drawImage(img, m.x - m.s, m.y - m.s * 0.1, m.s, m.s * 0.2);
    }
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#ff9a3d', alpha: 0.06 };
  }
}

class FogFx extends BiomeFx {
  private tex: HTMLCanvasElement | null = null;
  update(): void {}
  private texture(): HTMLCanvasElement {
    if (this.tex) return this.tex;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext('2d')!;
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 512;
      const y = 40 + Math.random() * 80;
      const r = 30 + Math.random() * 60;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(210,220,235,0.35)');
      g.addColorStop(1, 'rgba(210,220,235,0)');
      ctx.fillStyle = g;
      for (const dx of [0, -512, 512]) ctx.fillRect(x - r + dx, y - r, r * 2, r * 2);
    }
    this.tex = c;
    return c;
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const tex = this.texture();
    for (let i = 0; i < 3; i++) {
      const bandH = h * 0.42;
      const y = h * (0.12 + i * 0.28);
      const tw = (bandH / tex.height) * tex.width * 1.6;
      const off = ((t * (14 + i * 9)) % tw + tw) % tw;
      ctx.globalAlpha = alpha * (0.55 - i * 0.1);
      for (let x = -off; x < w; x += tw) ctx.drawImage(tex, x, y, tw, bandH);
    }
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#8a96a8', alpha: 0.12 };
  }
}

class PolarFx extends BiomeFx {
  update(dt: number, _t: number, w: number, h: number): void {
    const target = Math.round(90 * this.quality);
    while (this.motes.length < target) this.motes.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 18 + Math.random() * 30, s: 1 + Math.random() * 2.5, a: 0.4 + Math.random() * 0.6, life: Math.random() * 10 });
    for (const m of this.motes) {
      m.life += dt;
      m.y += m.vy * dt;
      m.x += Math.sin(m.life * 1.3) * 12 * dt;
      if (m.y > h + 5) {
        m.y = -5;
        m.x = Math.random() * w;
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const colors = [this.biome.colors.glow, '#b05cff', '#3dffd0'];
    for (let i = 0; i < 3; i++) {
      const base = h * (0.28 + i * 0.06);
      const height = h * (0.22 - i * 0.04);
      const g = ctx.createLinearGradient(0, base, 0, base - height);
      g.addColorStop(0, rgba(colors[i], 0.32 * alpha));
      g.addColorStop(1, rgba(colors[i], 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      const steps = 24;
      for (let k = 0; k <= steps; k++) {
        const x = (w * k) / steps;
        const y = base + Math.sin(x * 0.006 + t * 0.4 + i) * 18 + noise1(x * 0.004 + t * 0.2, i) * 14;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = steps; k >= 0; k--) {
        const x = (w * k) / steps;
        ctx.lineTo(x, base - height * (0.7 + 0.3 * noise1(x * 0.005 + t * 0.3, i + 4)));
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(240,248,255,0.85)';
    for (const m of this.motes) {
      ctx.globalAlpha = alpha * m.a;
      ctx.fillRect(m.x, m.y, m.s, m.s);
    }
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#1a5a6a', alpha: 0.12 };
  }
}

class CrystalFx extends BiomeFx {
  update(dt: number, _t: number, w: number, h: number): void {
    const target = Math.round(60 * this.quality);
    while (this.motes.length < target) this.motes.push({ x: Math.random() * w, y: Math.random() * h, vx: -8 + Math.random() * 16, vy: 40 + Math.random() * 60, s: 4 + Math.random() * 8, a: Math.random() * TAU, life: 0 });
    for (const m of this.motes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.a += dt * 2;
      if (m.y > h + 10) {
        m.y = -10;
        m.x = Math.random() * w;
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D, _w: number, _h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const imgs = [sprite('diamond', this.biome.colors.accent), sprite('diamond', this.biome.colors.glow), sprite('star4', '#ffffff')];
    this.motes.forEach((m, i) => {
      const img = imgs[i % 3];
      ctx.globalAlpha = alpha * (0.4 + 0.6 * Math.max(0, Math.sin(m.a + t)));
      ctx.drawImage(img, m.x - m.s, m.y - m.s, m.s * 2, m.s * 2);
    });
    ctx.globalAlpha = 1;
  }
}

class BloodMoonFx extends BiomeFx {
  update(): void {}
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const r = Math.min(w, h) * 0.13;
    const x = w * 0.2;
    const y = h * 0.2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * (0.7 + 0.1 * Math.sin(t));
    ctx.drawImage(glowSprite('#ff2a2a', 0.3), x - r * 3, y - r * 3, r * 6, r * 6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#ff7a6a');
    g.addColorStop(0.6, '#a01020');
    g.addColorStop(1, '#3a0008');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,0,10,0.35)';
    for (const [dx, dy, cr] of [[-0.3, -0.1, 0.2], [0.25, 0.3, 0.14], [0.1, -0.4, 0.1], [-0.1, 0.45, 0.09]]) {
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, cr * r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#8a0a1a', alpha: 0.18 };
  }
}

class SupernovaFx extends BiomeFx {
  update(): void {}
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const x = w * 0.78;
    const y = h * 0.2;
    const cycle = 6;
    const k = (t % cycle) / cycle;
    const charge = k < 0.7 ? k / 0.7 : 1;
    const base = Math.min(w, h) * (0.08 + 0.06 * charge);
    ctx.globalAlpha = alpha;
    ctx.drawImage(glowSprite(this.biome.colors.glow, 0.3), x - base * 2, y - base * 2, base * 4, base * 4);
    ctx.drawImage(sprite('flare', '#ffffff'), x - base * 0.6, y - base * 0.6, base * 1.2, base * 1.2);
    if (k >= 0.7) {
      const e = (k - 0.7) / 0.3;
      const rr = e * Math.max(w, h) * 0.6;
      ctx.strokeStyle = rgba(this.biome.colors.accent, alpha * (1 - e) * 0.8);
      ctx.lineWidth = 6 * (1 - e) + 1;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = alpha * (1 - e) * 0.5;
      ctx.fillStyle = rgba('#fff1c4', 0.3);
      if (e < 0.15) ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#ff9a3d', alpha: 0.08 };
  }
}

class BlackHoleFx extends BiomeFx {
  update(dt: number, _t: number, w: number, h: number): void {
    const cx = w * 0.8;
    const cy = h * 0.22;
    const target = Math.round(80 * this.quality);
    while (this.motes.length < target) {
      const a = Math.random() * TAU;
      const r = Math.max(w, h) * (0.3 + Math.random() * 0.5);
      this.motes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: 0, vy: 0, s: 1 + Math.random() * 1.5, a: Math.random(), life: 0 });
    }
    for (const m of this.motes) {
      const dx = cx - m.x;
      const dy = cy - m.y;
      const d = Math.hypot(dx, dy) || 1;
      const speed = 40 + 9000 / d;
      m.x += (dx / d) * speed * dt + (-dy / d) * speed * 0.6 * dt;
      m.y += (dy / d) * speed * dt + (dx / d) * speed * 0.6 * dt;
      if (d < 20) {
        const a = Math.random() * TAU;
        const r = Math.max(w, h) * (0.4 + Math.random() * 0.4);
        m.x = cx + Math.cos(a) * r;
        m.y = cy + Math.sin(a) * r;
      }
    }
  }
  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const cx = w * 0.8;
    const cy = h * 0.22;
    const r = Math.min(w, h) * 0.06;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#cfd8ff';
    for (const m of this.motes) {
      ctx.globalAlpha = alpha * (0.4 + m.a * 0.6);
      ctx.fillRect(m.x, m.y, m.s, m.s);
    }
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.3);
    ctx.scale(1, 0.28);
    const g = ctx.createRadialGradient(0, 0, r * 1.1, 0, 0, r * 3.4);
    g.addColorStop(0, rgba('#ffd09a', 0.9));
    g.addColorStop(0.4, rgba('#ff6a1a', 0.5));
    g.addColorStop(1, rgba('#7a5cff', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#e8d8ff', alpha * (0.8 + 0.2 * Math.sin(t * 5)));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.08, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  override tint() {
    return { color: '#000000', alpha: 0.25 };
  }
}

function createBiomeFx(b: BiomeDef, q: number): BiomeFx {
  switch (b.fx) {
    case 'meteors': return new MeteorFx(b, q);
    case 'solarStorm': return new SolarFx(b, q);
    case 'fog': return new FogFx(b, q);
    case 'polar': return new PolarFx(b, q);
    case 'crystals': return new CrystalFx(b, q);
    case 'bloodMoon': return new BloodMoonFx(b, q);
    case 'supernova': return new SupernovaFx(b, q);
    case 'blackHole': return new BlackHoleFx(b, q);
  }
}

export class Background {
  private far: HTMLCanvasElement | null = null;
  private near: HTMLCanvasElement | null = null;
  private nebula: HTMLCanvasElement | null = null;
  private twinkles: { x: number; y: number; s: number; p: number }[] = [];
  private w = 0;
  private h = 0;
  private fx: { fx: BiomeFx; alpha: number; dying: boolean }[] = [];
  private biomeId: string | null = null;

  resize(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    const area = w * h;
    this.far = makeLayer(w * dpr, h * dpr, Math.round(area / 2200), 0.4 * dpr, 1.1 * dpr, 0.8);
    this.near = makeLayer(w * dpr, h * dpr, Math.round(area / 9000), 0.7 * dpr, 1.8 * dpr, 1);
    this.nebula = makeNebula(w, h);
    this.twinkles = Array.from({ length: Math.round(area / 18000) + 10 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: 3 + Math.random() * 6, p: Math.random() * TAU }));
  }

  setBiome(b: BiomeDef | null, quality: number): void {
    const id = b?.id ?? null;
    if (id === this.biomeId) return;
    this.biomeId = id;
    for (const f of this.fx) f.dying = true;
    if (b) this.fx.push({ fx: createBiomeFx(b, quality), alpha: 0, dying: false });
  }

  update(dt: number, t: number): void {
    for (const f of this.fx) {
      f.alpha = f.dying ? Math.max(0, f.alpha - dt / 1.5) : Math.min(1, f.alpha + dt / 1.5);
      f.fx.update(dt, t, this.w, this.h);
    }
    this.fx = this.fx.filter((f) => !(f.dying && f.alpha <= 0));
  }

  draw(ctx: CanvasRenderingContext2D, t: number, dpr: number, reduced: boolean): void {
    const { w, h } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    let top = '#0a0f2a';
    let bottom = '#02030a';
    for (const f of this.fx) {
      top = mix(top, f.fx.biome.colors.sky, f.alpha * 0.85);
      bottom = mix(bottom, '#000000', f.alpha * 0.3);
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (this.nebula) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.nebula, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    // Parallax stars (device pixel layers, drawn untransformed).
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const drift = reduced ? 0 : t;
    for (const [layer, speed] of [[this.far, 2], [this.near, 6]] as [HTMLCanvasElement | null, number][]) {
      if (!layer) continue;
      const lw = layer.width;
      const lh = layer.height;
      const ox = ((drift * speed * dpr) % lw + lw) % lw;
      const oy = ((drift * speed * 0.4 * dpr) % lh + lh) % lh;
      ctx.drawImage(layer, -ox, -oy);
      ctx.drawImage(layer, lw - ox, -oy);
      ctx.drawImage(layer, -ox, lh - oy);
      ctx.drawImage(layer, lw - ox, lh - oy);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    const star = sprite('star4', '#dfe6ff');
    for (const s of this.twinkles) {
      const a = 0.25 + 0.75 * Math.max(0, Math.sin(t * 1.2 + s.p));
      ctx.globalAlpha = a * 0.8;
      ctx.drawImage(star, s.x - s.s, s.y - s.s, s.s * 2, s.s * 2);
    }
    ctx.globalAlpha = 1;
    for (const f of this.fx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      f.fx.dpr = dpr;
      f.fx.draw(ctx, w, h, t, f.alpha);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Scene tint of the active biome (drawn after everything else). */
  drawTint(ctx: CanvasRenderingContext2D, dpr: number): void {
    for (const f of this.fx) {
      const tint = f.fx.tint();
      if (!tint) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = rgba(tint.color, tint.alpha * f.alpha);
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }
}
