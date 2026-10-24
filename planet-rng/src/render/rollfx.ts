// Roll charge animation and reveal bursts. Intensity scales with the rarity tier.

import { AURA_BY_ID, tierOf, type AuraDef } from '../config';
import { vfxOf } from '../config/vfx';
import { glowSprite, sprite } from './sprites';
import { rgba, spectral, visible } from './color';
import { REF_R, type View } from './view';

const TAU = Math.PI * 2;
const R = REF_R;

interface FxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  shape: 'dot' | 'star4' | 'streak' | 'fragment' | 'spark' | 'orb';
  rot: number;
  drag: number;
  inward?: boolean;
}

interface Shockwave {
  age: number;
  delay: number;
  max: number;
  color: string;
  width: number;
  /** Negative = collapses inward. */
  dir: 1 | -1;
}

export class RollFx {
  private parts: FxParticle[] = [];
  private waves: Shockwave[] = [];
  private charge: { t: number; dur: number; color: string; rank: number; tint: string } | null = null;
  private bump = 0;
  private spawnAcc = 0;

  constructor(
    private quality: () => number,
    private reduced: () => boolean,
  ) {}

  startCharge(duration: number, auraId: string): void {
    const aura = AURA_BY_ID[auraId];
    const tier = tierOf(aura);
    this.charge = { t: 0, dur: duration / 1000, color: '#ffffff', rank: tier.rank, tint: tier.color };
  }

  get charging(): number {
    return this.charge ? Math.min(1, this.charge.t / this.charge.dur) : 0;
  }

  /** Background dim while a rare roll builds suspense. */
  suspenseDim(): number {
    if (!this.charge || this.charge.rank < 4) return 0;
    const k = this.charging;
    return Math.max(0, k - 0.35) * Math.min(0.55, 0.12 * this.charge.rank);
  }

  /** Planet scale pulse (charge swell, reveal bump). */
  planetScale(): number {
    const k = this.charging;
    return 1 + 0.05 * k * k + 0.1 * this.bump;
  }

  reveal(auraId: string, quick: boolean): void {
    this.charge = null;
    const aura = AURA_BY_ID[auraId];
    const tier = tierOf(aura);
    const st = tier.staging;
    const q = this.quality();
    const reduced = this.reduced();
    const palette = colorsOf(aura);
    const n = Math.round(st.burst * q * (quick ? 0.5 : 1));
    const shape = burstShape(aura);
    const spectralBurst = !!aura.colors.palette && aura.colors.palette.length >= 4;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const speed = (120 + Math.random() * 320) * (1 + tier.rank * 0.08);
      this.parts.push({
        x: Math.cos(a) * R * 1.05,
        y: Math.sin(a) * R * 1.05,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0,
        max: 0.7 + Math.random() * 0.7 + tier.rank * 0.05,
        size: 4 + Math.random() * 6 + tier.rank * 0.4,
        color: spectralBurst ? spectral(Math.random() * 360) : palette[i % palette.length],
        shape,
        rot: a,
        drag: 2.2,
      });
    }
    const waves = quick ? Math.min(1, st.shockwaves) : st.shockwaves;
    const style = revealStyle(aura);
    for (let i = 0; i < waves; i++) {
      const color = style === 'prism' ? spectral(i * 36) : style === 'triple' ? palette[i % palette.length] : palette[i % palette.length];
      this.waves.push({
        age: 0,
        delay: style === 'triple' ? Math.floor(i / 3) * 0.12 : i * 0.11,
        max: R * (3.5 + i * 0.6 + tier.rank * 0.15),
        color,
        width: 3 + tier.rank * 0.3,
        dir: style === 'collapse' && i === 0 ? -1 : 1,
      });
    }
    this.bump = reduced ? 0.3 : 1;
  }

  /** Rebirth: implosion, then a huge spectral burst. */
  rebirth(): void {
    this.charge = null;
    const q = this.quality();
    for (let w = 0; w < 6; w++) {
      this.waves.push({ age: 0, delay: w * 0.08, max: R * 6, color: spectral(w * 60), width: 5, dir: -1 });
      this.waves.push({ age: 0, delay: 0.9 + w * 0.12, max: R * (5 + w), color: spectral(w * 60 + 30), width: 6, dir: 1 });
    }
    const n = Math.round(160 * q);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const speed = 200 + Math.random() * 500;
      this.parts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: -0.9, max: 1.6, size: 5 + Math.random() * 8, color: spectral(Math.random() * 360), shape: 'star4', rot: a, drag: 1.8 });
    }
    this.bump = this.reduced() ? 0.5 : 2.2;
  }

  update(dt: number): void {
    if (this.charge) {
      this.charge.t += dt;
      const k = this.charging;
      // Converging streaks.
      const rate = (40 + this.charge.rank * 12) * this.quality() * (0.4 + k);
      this.spawnAcc += rate * dt;
      while (this.spawnAcc >= 1) {
        this.spawnAcc -= 1;
        const a = Math.random() * TAU;
        const r = R * (3.4 + Math.random() * 2);
        const late = k > 0.6 && this.charge.rank >= 3;
        this.parts.push({
          x: Math.cos(a) * r,
          y: Math.sin(a) * r,
          vx: -Math.cos(a) * 60,
          vy: -Math.sin(a) * 60,
          life: 0,
          max: 0.9,
          size: 14 + Math.random() * 10,
          color: late ? this.charge.tint : '#cfd8ff',
          shape: 'streak',
          rot: a + Math.PI,
          drag: -3.2,
          inward: true,
        });
      }
    }
    this.bump = Math.max(0, this.bump - dt * (this.bump > 1 ? 1.2 : 3));
    for (const p of this.parts) {
      p.life += dt;
      if (p.life < 0) continue;
      if (p.inward) {
        p.vx *= 1 + 3.2 * dt;
        p.vy *= 1 + 3.2 * dt;
        if (Math.hypot(p.x, p.y) < R * 1.05) p.life = p.max;
      } else {
        p.vx *= 1 - p.drag * dt;
        p.vy *= 1 - p.drag * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    for (const w of this.waves) w.age += dt;
    this.waves = this.waves.filter((w) => w.age - w.delay < 1.1);
  }

  draw(ctx: CanvasRenderingContext2D, view: View): void {
    ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
    ctx.globalCompositeOperation = 'lighter';
    if (this.charge) {
      const k = this.charging;
      const r = R * (3.2 - 2.05 * k * k);
      const color = k > 0.65 && this.charge.rank >= 3 ? this.charge.tint : '#dfe6ff';
      for (const [wd, a] of [[10, 0.08], [4, 0.25], [1.6, 0.9]] as [number, number][]) {
        ctx.strokeStyle = rgba(color, a * (0.3 + 0.7 * k));
        ctx.lineWidth = wd;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.25 + 0.6 * k;
      const gs = R * (2.2 + k);
      ctx.drawImage(glowSprite(color, 0.3), -gs, -gs, gs * 2, gs * 2);
      ctx.globalAlpha = 1;
    }
    for (const p of this.parts) {
      if (p.life < 0) continue;
      const k = p.life / p.max;
      const a = p.inward ? Math.min(1, k * 4) : Math.pow(1 - k, 1.2);
      ctx.globalAlpha = a;
      const img = sprite(p.shape, p.color);
      if (p.shape === 'streak') {
        const len = p.size * 2;
        const c = Math.cos(p.rot) * view.s;
        const s = Math.sin(p.rot) * view.s;
        ctx.setTransform(c, s, -s, c, view.tx + p.x * view.s, view.ty + p.y * view.s);
        ctx.drawImage(img, -len, -len * 0.1, len, len * 0.2);
        ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
      } else {
        const sz = p.size * 2 * (1 - k * 0.4);
        ctx.drawImage(img, p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
    for (const w of this.waves) {
      const age = w.age - w.delay;
      if (age < 0) continue;
      const k = Math.min(1, age / 1.1);
      const e = 1 - Math.pow(1 - k, 3);
      const r = w.dir > 0 ? R * 1.05 + (w.max - R * 1.05) * e : w.max - (w.max - R) * e;
      const a = Math.pow(1 - k, 1.4);
      for (const [wd, aa] of [[w.width * 4, 0.12], [w.width * 1.6, 0.35], [w.width * 0.6, 1]] as [number, number][]) {
        ctx.strokeStyle = rgba(w.color, aa * a);
        ctx.lineWidth = wd * (1 - k * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
    }
    if (this.bump > 0) {
      ctx.globalAlpha = this.bump * 0.8;
      const gs = R * 5 * this.bump;
      ctx.drawImage(glowSprite('#ffffff', 0.2), -gs / 2, -gs / 2, gs, gs);
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

function colorsOf(aura: AuraDef): string[] {
  const c = aura.colors;
  const base = c.palette ?? [c.glow, c.main, c.accent ?? c.glow, '#ffffff'];
  return base.map((x) => visible(x, c.glow));
}

function burstShape(aura: AuraDef): FxParticle['shape'] {
  return vfxOf(aura).burst ?? 'dot';
}

/** Special reveal choreography from the prototype (collapse, 3 rings, 10 prism rings). */
function revealStyle(aura: AuraDef): 'normal' | 'collapse' | 'triple' | 'prism' {
  if (aura.id === 'singularitaet' || aura.id === 'akkretion' || aura.id === 'ereignishorizont') return 'collapse';
  if (aura.id === 'multiversum') return 'triple';
  if (aura.colors.palette && aura.colors.palette.length >= 5) return 'prism';
  return 'normal';
}
