// Aura ring layers (max three per aura). Tilted rings are split into a back half (drawn
// before the planet) and a front half (drawn after), so the planet occludes them.

import type { AuraDef, RingDef } from '../config';
import { hueShift, rgba, visible } from './color';
import { REF_R, TILT_ANGLE, type View } from './particles';
import { sprite } from './sprites';

const TAU = Math.PI * 2;
const CRACK = [18, 4, 7, 6, 25, 5, 10, 8, 14, 3];

export class Ring {
  private angle = Math.random() * TAU;
  private color: string;
  private crackSeed = 0;
  private crackTimer = 0;

  constructor(
    readonly def: RingDef,
    aura: AuraDef,
  ) {
    this.color = visible(def.color ?? aura.colors.glow, aura.colors.glow);
  }

  update(dt: number, t: number, tempo: number): void {
    const d = this.def;
    if (d.reverseEvery) this.angle += d.speed * Math.cos((Math.PI * t) / d.reverseEvery) * dt * tempo;
    else this.angle += d.speed * dt * tempo;
    this.crackTimer -= dt;
    if (this.crackTimer <= 0) {
      this.crackTimer = 0.35 + Math.random() * 0.3;
      this.crackSeed = Math.floor(Math.random() * CRACK.length);
    }
  }

  draw(ctx: CanvasRenderingContext2D, view: View, pass: 'back' | 'front', alpha: number, t: number, glowPasses: number): void {
    const d = this.def;
    const tilt = d.tilt ?? 0;
    if (tilt === 0 && pass === 'back') return;
    let r = d.radius * REF_R;
    let a = (d.alpha ?? 0.6) * alpha;
    if (d.pulse) r *= 1 + d.pulse * Math.sin(t * 2.2);
    if (d.collapse) {
      const f = (t * d.collapse) % 1;
      r = r + (REF_R * 1.04 - r) * f * f;
      a *= f < 0.12 ? f / 0.12 : Math.pow(1 - f, 0.35);
    }
    if (a <= 0.01) return;
    const color = d.hueCycle ? hueShift(this.color, t * d.hueCycle) : this.color;
    const ry = r * (1 - tilt);
    const rot = tilt > 0 ? TILT_ANGLE : 0;
    const { s, tx, ty } = view;
    let ox = 0;
    let oy = 0;
    if (d.glitch && Math.random() < 0.08) {
      ox = (Math.random() - 0.5) * d.glitch * 2;
      oy = (Math.random() - 0.5) * d.glitch;
    }
    ctx.setTransform(s, 0, 0, s, tx + ox * s, ty + oy * s);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // Visible parameter range for this pass.
    const ranges: [number, number][] = tilt === 0 ? [[0, TAU]] : pass === 'back' ? [[Math.PI, TAU]] : [[0, Math.PI]];

    const strokePath = (build: () => void, width: number) => {
      const passes = Math.max(1, glowPasses);
      if (passes >= 3) {
        ctx.strokeStyle = rgba(color, a * 0.08);
        ctx.lineWidth = width * 6;
        build();
        ctx.stroke();
      }
      if (passes >= 2) {
        ctx.strokeStyle = rgba(color, a * 0.22);
        ctx.lineWidth = width * 2.6;
        build();
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(color, a);
      ctx.lineWidth = width;
      build();
      ctx.stroke();
    };

    const ellipseArc = (rr: number, ry2: number, from: number, to: number) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, ry2, rot, from, to);
    };

    switch (d.style) {
      case 'solid':
        for (const [f, e] of ranges) strokePath(() => ellipseArc(r, ry, f, e), d.width);
        break;
      case 'double':
        for (const [f, e] of ranges) {
          strokePath(() => ellipseArc(r - d.width * 1.6, ry - d.width * 1.6 * (1 - tilt), f, e), d.width * 0.7);
          strokePath(() => ellipseArc(r + d.width * 1.6, ry + d.width * 1.6 * (1 - tilt), f, e), d.width * 0.7);
        }
        break;
      case 'dashed':
      case 'cracked': {
        const pattern = d.style === 'dashed' ? [12, 9] : [...CRACK.slice(this.crackSeed), ...CRACK.slice(0, this.crackSeed)];
        ctx.setLineDash(pattern);
        ctx.lineDashOffset = -this.angle * r;
        for (const [f, e] of ranges) strokePath(() => ellipseArc(r, ry, f, e), d.width);
        ctx.setLineDash([]);
        break;
      }
      case 'wave': {
        const k = d.segments ?? 6;
        for (const [f, e] of ranges) {
          strokePath(() => {
            ctx.beginPath();
            const steps = 64;
            for (let i = 0; i <= steps; i++) {
              const p = f + ((e - f) * i) / steps;
              const rr = r + Math.sin(p * k + t * 2.4 + this.angle) * 4;
              const x = Math.cos(p) * rr;
              const y = Math.sin(p) * rr * (1 - tilt);
              const X = x * Math.cos(rot) - y * Math.sin(rot);
              const Y = x * Math.sin(rot) + y * Math.cos(rot);
              if (i === 0) ctx.moveTo(X, Y);
              else ctx.lineTo(X, Y);
            }
          }, d.width);
        }
        break;
      }
      case 'segments':
      case 'arc': {
        const n = d.style === 'arc' ? 1 : d.segments ?? 6;
        const span = d.style === 'arc' ? 1.7 : (TAU / n) * 0.6;
        for (let i = 0; i < n; i++) {
          const start = this.angle + (i * TAU) / n;
          const chunks = d.style === 'arc' ? 10 : 4;
          for (let c = 0; c < chunks; c++) {
            const f = start + (span * c) / chunks;
            const e = start + (span * (c + 1)) / chunks;
            const mid = (f + e) / 2;
            const z = Math.sin(mid);
            if (tilt > 0 && (pass === 'back') !== z < 0) continue;
            const fade = d.style === 'arc' ? (c + 1) / chunks : 1;
            const save = a;
            a = save * fade;
            strokePath(() => ellipseArc(r, ry, f, e + 0.01), d.width * (d.style === 'arc' ? 0.6 + fade : 1));
            a = save;
          }
        }
        break;
      }
      case 'dotted': {
        const n = Math.max(12, Math.round((TAU * r) / 13));
        const img = sprite('dot', color);
        const sz = d.width * 4.5;
        ctx.globalAlpha = a;
        for (let i = 0; i < n; i++) {
          const p = this.angle + (i * TAU) / n;
          const z = Math.sin(p);
          if (tilt > 0 && (pass === 'back') !== z < 0) continue;
          const x = Math.cos(p) * r;
          const y = Math.sin(p) * ry;
          const X = x * Math.cos(rot) - y * Math.sin(rot);
          const Y = x * Math.sin(rot) + y * Math.cos(rot);
          ctx.drawImage(img, X - sz / 2, Y - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'ticks': {
        const n = d.segments ?? 24;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const p = this.angle + (i * TAU) / n;
          const z = Math.sin(p);
          if (tilt > 0 && (pass === 'back') !== z < 0) continue;
          const len = i % 5 === 0 ? 9 : 5;
          const x0 = Math.cos(p) * (r - len / 2);
          const y0 = Math.sin(p) * (r - len / 2) * (1 - tilt);
          const x1 = Math.cos(p) * (r + len / 2);
          const y1 = Math.sin(p) * (r + len / 2) * (1 - tilt);
          ctx.moveTo(x0 * Math.cos(rot) - y0 * Math.sin(rot), x0 * Math.sin(rot) + y0 * Math.cos(rot));
          ctx.lineTo(x1 * Math.cos(rot) - y1 * Math.sin(rot), x1 * Math.sin(rot) + y1 * Math.cos(rot));
        }
        ctx.strokeStyle = rgba(color, a * 0.25);
        ctx.lineWidth = d.width * 3;
        ctx.stroke();
        ctx.strokeStyle = rgba(color, a);
        ctx.lineWidth = d.width;
        ctx.stroke();
        break;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
