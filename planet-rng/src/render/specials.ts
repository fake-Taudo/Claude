// Procedural signature effects ("specials") that give each aura a unique look beyond
// particles and rings. All drawing happens in reference pixels around the planet centre.

import type { AuraDef, SpecialDef } from '../config';
import { noise1, rgba, spectral, visible } from './color';
import { REF_R, TILT_ANGLE, type View } from './particles';
import { glowSprite, sprite } from './sprites';

const TAU = Math.PI * 2;
const R = REF_R;
const COS_T = Math.cos(TILT_ANGLE);
const SIN_T = Math.sin(TILT_ANGLE);

export interface SpecialEnv {
  quality: number;
  reduced: boolean;
}

type Pass = 'back' | 'front';

function setView(ctx: CanvasRenderingContext2D, v: View): void {
  ctx.setTransform(v.s, 0, 0, v.s, v.tx, v.ty);
}

/** Stroke the current path builder with a cheap layered glow. */
function glowStroke(ctx: CanvasRenderingContext2D, build: () => void, color: string, width: number, alpha: number, passes = 3): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (passes >= 3) {
    ctx.strokeStyle = rgba(color, alpha * 0.1);
    ctx.lineWidth = width * 5;
    build();
    ctx.stroke();
  }
  if (passes >= 2) {
    ctx.strokeStyle = rgba(color, alpha * 0.28);
    ctx.lineWidth = width * 2.4;
    build();
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  build();
  ctx.stroke();
}

function tiltPoint(x: number, y: number, tilt: number): [number, number] {
  const yy = y * (1 - tilt);
  return [x * COS_T - yy * SIN_T, x * SIN_T + yy * COS_T];
}

function drawSprite(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, size: number, alpha: number): void {
  if (alpha <= 0.01 || size <= 0.1) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

export abstract class Special {
  constructor(
    readonly def: SpecialDef,
    readonly aura: AuraDef,
    readonly env: SpecialEnv,
  ) {}

  protected color(i: number): string {
    const a = this.aura.colors;
    const list = this.def.colors ?? [a.glow, visible(a.main, a.glow), a.accent ?? a.glow];
    return visible(list[i % list.length], a.glow);
  }

  protected get passes(): number {
    return this.env.quality >= 0.9 ? 3 : this.env.quality >= 0.6 ? 2 : 1;
  }

  update(_dt: number, _t: number): void {}
  back(_ctx: CanvasRenderingContext2D, _v: View, _alpha: number, _t: number): void {}
  front(_ctx: CanvasRenderingContext2D, _v: View, _alpha: number, _t: number): void {}
  post(_ctx: CanvasRenderingContext2D, _w: number, _h: number, _alpha: number, _t: number): void {}
  tempo(_t: number): number {
    return 1;
  }
}

// ---------------------------------------------------------------------------

class Arcs extends Special {
  private bolts: { pts: [number, number][]; life: number; a1: number; a2: number }[] = [];
  private timer = 0;
  private jitter = 0;

  override update(dt: number): void {
    this.timer -= dt;
    this.jitter -= dt;
    const rr = (this.def.radius ?? 1.7) * R;
    if (this.timer <= 0) {
      this.timer = (this.def.interval ?? 0.7) * (0.6 + Math.random() * 0.8);
      for (let i = 0; i < (this.def.count ?? 2); i++) {
        const a1 = Math.random() * TAU;
        this.bolts.push({ pts: [], life: 0.2, a1, a2: a1 + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 1.1) });
      }
    }
    for (const b of this.bolts) {
      b.life -= dt;
      if (this.jitter <= 0 || !b.pts.length) {
        const x1 = Math.cos(b.a1) * R * 1.02;
        const y1 = Math.sin(b.a1) * R * 1.02;
        const x2 = Math.cos(b.a2) * rr;
        const y2 = Math.sin(b.a2) * rr;
        b.pts = [];
        const n = 9;
        for (let k = 0; k <= n; k++) {
          const f = k / n;
          const off = k === 0 || k === n ? 0 : (Math.random() - 0.5) * 16;
          const nx = -(y2 - y1);
          const ny = x2 - x1;
          const len = Math.hypot(nx, ny) || 1;
          b.pts.push([x1 + (x2 - x1) * f + (nx / len) * off, y1 + (y2 - y1) * f + (ny / len) * off]);
        }
      }
    }
    if (this.jitter <= 0) this.jitter = 0.05;
    this.bolts = this.bolts.filter((b) => b.life > 0);
  }

  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.bolts) {
      const a = alpha * Math.min(1, b.life / 0.08) * (this.env.reduced ? 0.5 : 1);
      const build = () => {
        ctx.beginPath();
        b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      };
      glowStroke(ctx, build, this.color(0), 1.6, a, this.passes);
      ctx.strokeStyle = rgba('#ffffff', a);
      ctx.lineWidth = 0.8;
      build();
      ctx.stroke();
    }
  }
}

class Corona extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 16;
    const base = (this.def.radius ?? 1.1) * R;
    drawSprite(ctx, glowSprite(this.color(0), 0.35), 0, 0, R * 3.2, alpha * 0.55);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + t * 0.05;
      const len = R * (0.15 + 0.35 * (0.5 + 0.5 * noise1(t * 1.4 + i * 3.1, i)));
      const w = 0.06 + 0.03 * Math.sin(i * 7.3);
      const g = ctx.createLinearGradient(Math.cos(a) * base * 0.92, Math.sin(a) * base * 0.92, Math.cos(a) * (base + len), Math.sin(a) * (base + len));
      g.addColorStop(0, rgba('#ffffff', alpha * (this.def.alpha ?? 0.8)));
      g.addColorStop(0.4, rgba(this.color(0), alpha * 0.6));
      g.addColorStop(1, rgba(this.color(0), 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - w) * base * 0.92, Math.sin(a - w) * base * 0.92);
      ctx.lineTo(Math.cos(a) * (base + len), Math.sin(a) * (base + len));
      ctx.lineTo(Math.cos(a + w) * base * 0.92, Math.sin(a + w) * base * 0.92);
      ctx.closePath();
      ctx.fill();
    }
  }
}

class Comets extends Special {
  private phases = Array.from({ length: 6 }, () => Math.random() * TAU);
  private pos(i: number, t: number, lag: number): [number, number, number] {
    const r = (this.def.radius ?? 1.8) * R * (0.92 + 0.14 * i);
    const a = this.phases[i] + (t - lag) * (this.def.speed ?? 0.9) * (1 + 0.18 * i);
    const [x, y] = tiltPoint(Math.cos(a) * r, Math.sin(a) * r, this.def.tilt ?? 0.5);
    return [x, y, Math.sin(a)];
  }
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number, pass: Pass): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 3;
    for (let i = 0; i < n; i++) {
      const c = this.color(i);
      const head = sprite('dot', c);
      for (let k = 14; k >= 0; k--) {
        const [x, y, z] = this.pos(i, t, k * 0.045);
        if ((pass === 'back') !== z < 0) continue;
        const f = 1 - k / 15;
        drawSprite(ctx, head, x, y, (k === 0 ? 16 : 11 * f + 2) * (1 + 0.15 * z), alpha * f * (k === 0 ? 1 : 0.7));
      }
    }
    ctx.globalAlpha = 1;
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'front');
  }
}

class Beams extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 2;
    const len = (this.def.radius ?? 4) * R;
    for (let i = 0; i < n; i++) {
      const a = t * (this.def.speed ?? 1.5) + (i * TAU) / n;
      const w = 0.11;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, rgba('#ffffff', alpha * (this.def.alpha ?? 0.35)));
      g.addColorStop(0.3, rgba(this.color(0), alpha * (this.def.alpha ?? 0.35) * 0.7));
      g.addColorStop(1, rgba(this.color(0), 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len);
      ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len);
      ctx.closePath();
      ctx.fill();
    }
  }
}

class PulseRings extends Special {
  private rings: number[] = [];
  private timer = 0;
  protected life = 1.4;
  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.def.interval ?? 1;
      this.rings.push(0);
    }
    this.rings = this.rings.map((a) => a + dt).filter((a) => a < this.life);
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, _t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    for (const age of this.rings) {
      const k = age / this.life;
      const r = R * 1.05 + ((this.def.radius ?? 2.5) * R - R * 1.05) * (1 - Math.pow(1 - k, 2));
      const a = alpha * (this.def.alpha ?? 0.5) * Math.pow(1 - k, 1.4);
      const c = this.def.colors ? this.color(Math.floor(age * 10)) : this.color(0);
      glowStroke(ctx, () => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
      }, c, 2.5 * (1 - k) + 0.6, a, this.passes);
    }
  }
}

class TrailRings extends PulseRings {
  protected override life = 1.8;
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    super.front(ctx, v, alpha, t);
    setView(ctx, v);
    // Echo rings in the accent colors.
    ctx.globalCompositeOperation = 'lighter';
    const ph = (t % 1.8) / 1.8;
    for (let k = 1; k <= 2; k++) {
      const f = (ph + k * 0.18) % 1;
      const r = R * 1.1 + ((this.def.radius ?? 2.8) * R - R * 1.1) * f;
      ctx.strokeStyle = rgba(this.color(k), alpha * 0.25 * (1 - f));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
    }
  }
}

class Moons extends Special {
  private phases = Array.from({ length: 4 }, () => Math.random() * TAU);
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number, pass: Pass): void {
    setView(ctx, v);
    const n = this.def.count ?? 2;
    for (let i = 0; i < n; i++) {
      const r = (this.def.radius ?? 2) * R * (1 + 0.2 * i);
      const a = this.phases[i] + t * (this.def.speed ?? 0.5) * (i % 2 ? -0.7 : 1);
      const [x, y] = tiltPoint(Math.cos(a) * r, Math.sin(a) * r, this.def.tilt ?? 0.4);
      const z = Math.sin(a);
      if ((pass === 'back') !== z < 0) continue;
      const size = (this.def.size ?? 0.22) * R * (1 + 0.12 * z) * (i ? 0.8 : 1);
      const c0 = this.color(0);
      const c1 = this.color(1);
      ctx.globalCompositeOperation = 'lighter';
      drawSprite(ctx, glowSprite(c0), x, y, size * 5, alpha * 0.45);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha;
      const g = ctx.createRadialGradient(x - size * 0.4, y - size * 0.4, size * 0.1, x, y, size);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, c0);
      g.addColorStop(1, c1);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
      // Night side.
      ctx.fillStyle = 'rgba(5,6,20,0.55)';
      ctx.beginPath();
      ctx.arc(x + size * 0.35, y + size * 0.3, size * 0.95, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'front');
  }
}

class Constellation extends Special {
  private nodes: [number, number][] = [];
  constructor(def: SpecialDef, aura: AuraDef, env: SpecialEnv) {
    super(def, aura, env);
    const n = def.count ?? 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.4;
      const r = R * (1.4 + Math.random() * ((def.radius ?? 2) - 1.4));
      this.nodes.push([a, r]);
    }
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const rot = t * (this.def.speed ?? 0.08);
    const pts = this.nodes.map(([a, r]) => [Math.cos(a + rot) * r, Math.sin(a + rot) * r] as [number, number]);
    const cycle = 8;
    const figures = [
      [0, 1, 2, 3],
      [3, 4, 5],
      [5, 6, 7, 8],
      [8, 9, 0],
    ];
    figures.forEach((fig, fi) => {
      const local = ((t + fi * 2) % cycle) / cycle;
      const grow = Math.min(1, local * 3.5);
      const fade = local > 0.75 ? 1 - (local - 0.75) / 0.25 : 1;
      const segs = fig.length - 1;
      const shown = grow * segs;
      for (let s = 0; s < segs; s++) {
        const k = Math.min(1, Math.max(0, shown - s));
        if (k <= 0) continue;
        const a = pts[fig[s] % pts.length];
        const b = pts[fig[s + 1] % pts.length];
        glowStroke(ctx, () => {
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k);
        }, this.color(0), 1, alpha * 0.7 * fade, this.passes);
      }
    });
    const star = sprite('star4', '#ffffff');
    pts.forEach(([x, y], i) => drawSprite(ctx, star, x, y, 9 + 3 * Math.sin(t * 2 + i), alpha * (0.7 + 0.3 * Math.sin(t * 3 + i * 1.7))));
    ctx.globalAlpha = 1;
  }
}

class Wings extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const len = (this.def.radius ?? 2.4) * R;
    const speed = this.def.speed ?? 1;
    const a0 = alpha * (this.def.alpha ?? 0.6);
    if (this.def.variant === 'flame') {
      for (const side of [-1, 1]) {
        const flap = Math.sin(t * speed * 2.2) * 0.2;
        for (let f = 0; f < 8; f++) {
          const spread = -0.95 + f * 0.17 + flap;
          const ang = -Math.PI / 2 + side * (Math.PI / 2 + spread);
          const l = len * (0.55 + 0.45 * Math.sin((f / 7) * Math.PI)) * (0.9 + 0.1 * noise1(t * 3 + f, side + 3));
          const rx = side * R * 0.45;
          const ry = -R * 0.15;
          const tipX = rx + Math.cos(ang) * l;
          const tipY = ry + Math.sin(ang) * l;
          const g = ctx.createLinearGradient(rx, ry, tipX, tipY);
          g.addColorStop(0, rgba(this.color(1), a0));
          g.addColorStop(0.6, rgba(this.color(0), a0 * 0.7));
          g.addColorStop(1, rgba(this.color(2), 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = 7 - f * 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.quadraticCurveTo(rx + Math.cos(ang - side * 0.4) * l * 0.55, ry + Math.sin(ang - side * 0.4) * l * 0.55, tipX, tipY);
          ctx.stroke();
        }
      }
    } else {
      const beat = 1 + 0.08 * Math.sin(t * speed * 2);
      const angles = [-0.55, 0, 0.55];
      for (const side of [-1, 1]) {
        angles.forEach((da, i) => {
          const ang = (side < 0 ? Math.PI : 0) + side * da * (1 + 0.1 * Math.sin(t * speed * 2 + i));
          const l = len * (i === 1 ? 1 : 0.82) * beat;
          const r0 = R * 0.9;
          const x0 = Math.cos(ang) * r0;
          const y0 = Math.sin(ang) * r0;
          const x1 = Math.cos(ang) * l;
          const y1 = Math.sin(ang) * l;
          const nx = -Math.sin(ang);
          const ny = Math.cos(ang);
          const w = 9;
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, rgba('#ffffff', a0));
          g.addColorStop(0.5, rgba(this.color(0), a0 * 0.6));
          g.addColorStop(1, rgba(this.color(2), 0));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x0 + nx * w * 0.4, y0 + ny * w * 0.4);
          ctx.quadraticCurveTo((x0 + x1) / 2 + nx * w, (y0 + y1) / 2 + ny * w, x1, y1);
          ctx.quadraticCurveTo((x0 + x1) / 2 - nx * w * 0.6, (y0 + y1) / 2 - ny * w * 0.6, x0 - nx * w * 0.4, y0 - ny * w * 0.4);
          ctx.closePath();
          ctx.fill();
        });
      }
    }
  }
}

class Lensing extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'source-over';
    const r = (this.def.radius ?? 1.3) * R;
    const g = ctx.createRadialGradient(0, 0, R * 0.95, 0, 0, r * 1.7);
    g.addColorStop(0, `rgba(0,0,0,${0.9 * alpha * (this.def.alpha ?? 0.8)})`);
    g.addColorStop(0.5, `rgba(0,0,0,${0.5 * alpha * (this.def.alpha ?? 0.8)})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.7, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
    }, this.color(0), 1.2, alpha * 0.6, this.passes);
  }
}

class Halo extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const rx = (this.def.radius ?? 0.75) * R;
    const ry = rx * (1 - (this.def.tilt ?? 0.7));
    const y = -R * 1.42 + Math.sin(t * 1.4) * 3;
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(0, y, rx, ry, 0, 0, TAU);
    }, this.color(0), 3, alpha * (this.def.alpha ?? 0.9), this.passes);
  }
}

class Rift extends Special {
  private cracks: { pts: [number, number][]; life: number }[] = [];
  private timer = 0;
  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = (this.def.interval ?? 1.6) * (0.6 + Math.random() * 0.6);
      const n = this.def.count ?? 3;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const r = (this.def.radius ?? 2) * R;
        const pts: [number, number][] = [];
        const steps = 10;
        const bx = Math.cos(a) * r;
        const by = Math.sin(a) * r;
        const ex = Math.cos(a + Math.PI * (0.6 + Math.random() * 0.4)) * r;
        const ey = Math.sin(a + Math.PI * (0.6 + Math.random() * 0.4)) * r;
        for (let k = 0; k <= steps; k++) {
          const f = k / steps;
          pts.push([bx + (ex - bx) * f + (Math.random() - 0.5) * 22, by + (ey - by) * f + (Math.random() - 0.5) * 22]);
        }
        this.cracks.push({ pts, life: 0.9 });
      }
    }
    this.cracks.forEach((c) => (c.life -= dt));
    this.cracks = this.cracks.filter((c) => c.life > 0);
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    for (const c of this.cracks) {
      const flick = this.env.reduced ? 1 : 0.6 + 0.4 * Math.sin(t * 40 + c.pts.length);
      const a = alpha * Math.min(1, c.life / 0.3) * flick * (this.def.alpha ?? 0.9);
      const build = (ox: number) => () => {
        ctx.beginPath();
        c.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y) : ctx.moveTo(x + ox, y)));
      };
      glowStroke(ctx, build(-2), this.color(1), 1.2, a * 0.6, 1);
      glowStroke(ctx, build(2), this.color(0), 1.2, a * 0.6, 1);
      glowStroke(ctx, build(0), '#ffffff', 1, a, this.passes);
    }
  }
}

class Clock extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const Rd = (this.def.radius ?? 2.1) * R;
    const c0 = this.color(0);
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, Rd * 1.04, 0, TAU);
    }, c0, 1.4, alpha * 0.7, this.passes);
    const sec = Math.floor(t) + Math.min(1, (t % 1) * 6);
    const hands: [number, number, number][] = [
      [t * 0.04, 0.55, 3.2],
      [t * 0.5, 0.82, 2.2],
      [(sec / 60) * TAU, 0.97, 1.2],
    ];
    for (const [ang, len, w] of hands) {
      const a = ang - Math.PI / 2;
      glowStroke(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * R * 1.06, Math.sin(a) * R * 1.06);
        ctx.lineTo(Math.cos(a) * Rd * len + (len > 0.9 ? 0 : 0), Math.sin(a) * Rd * len);
      }, c0, w, alpha * 0.85, this.passes);
      drawSprite(ctx, sprite('dot', '#ffffff'), Math.cos(a) * Rd * len, Math.sin(a) * Rd * len, 8, alpha);
    }
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = c0;
    ctx.font = `600 ${Math.round(R * 0.2)}px Fredoka, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const nums = ['XII', 'III', 'VI', 'IX'];
    nums.forEach((n, i) => {
      const a = (i * TAU) / 4 - Math.PI / 2;
      ctx.fillText(n, Math.cos(a) * Rd * 1.2, Math.sin(a) * Rd * 1.2);
    });
    ctx.globalAlpha = 1;
  }
}

class FieldLines extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 6;
    const rmax = (this.def.radius ?? 3) * R;
    const rot = t * 0.15;
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    for (let k = 0; k < n; k++) {
      const side = k % 2 ? 1 : -1;
      const tier = Math.floor(k / 2) + 1;
      const L = R * 1.1 + ((rmax - R * 1.1) * tier) / Math.ceil(n / 2);
      glowStroke(ctx, () => {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const th = 0.3 + ((Math.PI - 0.6) * i) / 40;
          const s = Math.sin(th);
          const x = side * L * s * s * s;
          const y = -L * s * s * Math.cos(th);
          const X = x * cr - y * sr;
          const Y = x * sr + y * cr;
          if (i === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
      }, this.color(k % 2), 1, alpha * (this.def.alpha ?? 0.35), this.passes);
    }
  }
}

class Web extends Special {
  private nodes: [number, number, number][] = [];
  private edges: [number, number][] = [];
  private pulses: { e: number; u: number }[] = [];
  constructor(def: SpecialDef, aura: AuraDef, env: SpecialEnv) {
    super(def, aura, env);
    const n = def.count ?? 16;
    for (let i = 0; i < n; i++) {
      // Fibonacci sphere.
      const y = 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      this.nodes.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const [a, b, c] = this.nodes[i];
        const [d, e, f] = this.nodes[j];
        if (Math.hypot(a - d, b - e, c - f) < 0.95) this.edges.push([i, j]);
      }
    for (let p = 0; p < 6; p++) this.pulses.push({ e: Math.floor(Math.random() * this.edges.length), u: Math.random() });
  }
  private project(t: number): [number, number, number][] {
    const rad = (this.def.radius ?? 2.4) * R;
    const a = t * (this.def.speed ?? 0.15);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const cb = Math.cos(0.35);
    const sb = Math.sin(0.35);
    return this.nodes.map(([x, y, z]) => {
      const x1 = x * ca + z * sa;
      const z1 = -x * sa + z * ca;
      const y2 = y * cb - z1 * sb;
      const z2 = y * sb + z1 * cb;
      return [x1 * rad, y2 * rad, z2];
    });
  }
  override update(dt: number): void {
    for (const p of this.pulses) {
      p.u += dt * 0.8;
      if (p.u >= 1) {
        p.u = 0;
        p.e = Math.floor(Math.random() * this.edges.length);
      }
    }
  }
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number, pass: Pass): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const pts = this.project(t);
    for (const [i, j] of this.edges) {
      const z = (pts[i][2] + pts[j][2]) / 2;
      if ((pass === 'back') !== z < 0) continue;
      ctx.strokeStyle = rgba(this.color(0), alpha * (this.def.alpha ?? 0.6) * (0.35 + 0.3 * (z + 1)));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.stroke();
    }
    const dot = sprite('dot', this.color(0));
    for (const [x, y, z] of pts) if ((pass === 'back') === z < 0) drawSprite(ctx, dot, x, y, 7 + 3 * z, alpha * (0.6 + 0.4 * z));
    const pulse = sprite('dot', '#ffffff');
    for (const p of this.pulses) {
      const [i, j] = this.edges[p.e] ?? [0, 0];
      const z = pts[i][2] + (pts[j][2] - pts[i][2]) * p.u;
      if ((pass === 'back') !== z < 0) continue;
      drawSprite(ctx, pulse, pts[i][0] + (pts[j][0] - pts[i][0]) * p.u, pts[i][1] + (pts[j][1] - pts[i][1]) * p.u, 10, alpha);
    }
    ctx.globalAlpha = 1;
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'front');
  }
}

class ShockPulse extends Special {
  private shocks: number[] = [];
  private timer = 0.3;
  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.def.interval ?? 2;
      this.shocks.push(0);
    }
    this.shocks = this.shocks.map((s) => s + dt).filter((s) => s < 1);
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const red = this.env.reduced ? 0.5 : 1;
    for (const age of this.shocks) {
      const k = age;
      const r = R + ((this.def.radius ?? 4) * R - R) * (1 - Math.pow(1 - k, 3));
      const a = alpha * (this.def.alpha ?? 0.7) * Math.pow(1 - k, 1.5) * red;
      glowStroke(ctx, () => {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
      }, this.color(0), 6 * (1 - k) + 1, a, this.passes);
      if (age < 0.25) drawSprite(ctx, glowSprite(this.color(0)), 0, 0, R * 4, alpha * (1 - age / 0.25) * 0.6 * red);
    }
    ctx.globalAlpha = 1;
  }
}

class Cells extends Special {
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number, pass: Pass): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 6;
    for (let i = 0; i < n; i++) {
      const r = (this.def.radius ?? 2) * R * (0.85 + 0.3 * Math.sin(i * 1.7 + t * 0.4));
      const a = (i / n) * TAU + t * (this.def.speed ?? 0.3) * (i % 2 ? 1 : -0.6);
      const [x, y] = tiltPoint(Math.cos(a) * r, Math.sin(a) * r, 0.35);
      const z = Math.sin(a);
      if ((pass === 'back') !== z < 0) continue;
      const size = (this.def.size ?? 0.3) * R * (1 + 0.12 * Math.sin(t * 2 + i));
      const c = this.color(i);
      drawSprite(ctx, glowSprite(c, 0.4), x, y, size * 3.2, alpha * (this.def.alpha ?? 0.55));
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.stroke();
      drawSprite(ctx, sprite('dot', '#ffffff'), x + size * 0.2, y - size * 0.15, size * 0.5, alpha * 0.8);
    }
    ctx.globalAlpha = 1;
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'front');
  }
}

class Mobius extends Special {
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number, pass: Pass): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const Rb = (this.def.radius ?? 2) * R;
    const W = (this.def.size ?? 0.35) * R;
    const tilt = this.def.tilt ?? 0.5;
    const off = t * (this.def.speed ?? 0.25);
    const N = 72;
    const point = (u: number, side: number): [number, number] => {
      const o = side * W * Math.cos((u + off) / 2);
      const x = Math.cos(u) * (Rb + o);
      const y = Math.sin(u) * (Rb + o) * (1 - tilt) - side * W * Math.sin((u + off) / 2) * 0.9;
      return [x * COS_T - y * SIN_T, x * SIN_T + y * COS_T];
    };
    for (let i = 0; i < N; i++) {
      const u0 = (i / N) * TAU;
      const u1 = ((i + 1) / N) * TAU;
      const z = Math.sin((u0 + u1) / 2);
      if ((pass === 'back') !== z < 0) continue;
      const facing = Math.cos((u0 + off) / 2);
      const c = facing >= 0 ? this.color(0) : this.color(1);
      const [ax, ay] = point(u0, 1);
      const [bx, by] = point(u1, 1);
      const [cx, cy] = point(u1, -1);
      const [dx, dy] = point(u0, -1);
      ctx.fillStyle = rgba(c, alpha * (this.def.alpha ?? 0.5) * (0.4 + 0.35 * Math.abs(facing)) * (0.75 + 0.25 * z));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', alpha * 0.5);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.moveTo(cx, cy);
      ctx.lineTo(dx, dy);
      ctx.stroke();
    }
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number, t: number): void {
    this.draw(ctx, v, a, t, 'front');
  }
}

class Ignite extends Special {
  private stars: { x: number; y: number; age: number; hue: number }[] = [];
  private timer = 0;
  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0 && this.stars.length < (this.def.count ?? 4) * 2) {
      this.timer = (this.def.interval ?? 0.7) * (0.5 + Math.random());
      const a = Math.random() * TAU;
      const r = R * (1.5 + Math.random() * ((this.def.radius ?? 3) - 1.5));
      this.stars.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, age: 0, hue: Math.random() * 360 });
    }
    this.stars.forEach((s) => (s.age += dt));
    this.stars = this.stars.filter((s) => s.age < 1.4);
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const k = s.age / 1.4;
      const c = spectral(s.hue);
      drawSprite(ctx, sprite('star4', c), s.x, s.y, 30 * Math.sin(Math.min(1, k * 1.4) * Math.PI), alpha);
      ctx.strokeStyle = rgba(c, alpha * (1 - k) * 0.7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4 + k * 26, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

class Rays extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 10;
    const len = (this.def.radius ?? 5) * R;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + t * (this.def.speed ?? 0.1);
      const w = 0.05 + 0.03 * Math.sin(i * 3.3 + t);
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, rgba(this.color(0), alpha * (this.def.alpha ?? 0.2)));
      g.addColorStop(1, rgba(this.color(0), 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - w) * len, Math.sin(a - w) * len);
      ctx.lineTo(Math.cos(a + w) * len, Math.sin(a + w) * len);
      ctx.closePath();
      ctx.fill();
    }
  }
}

class Inversion extends Special {
  override post(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, t: number): void {
    if (this.env.reduced) return;
    const period = this.def.interval ?? 6;
    const local = t % period;
    if (local > 0.5) return;
    const env = Math.sin((local / 0.5) * Math.PI);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'difference';
    ctx.globalAlpha = env * alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}

class Geometry extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const outer = (this.def.radius ?? 2.3) * R;
    const shapes = [3, 4, 6, 0];
    const cycle = 7;
    shapes.forEach((n, i) => {
      const r = outer * (1 - i * 0.16);
      const rot = t * (this.def.speed ?? 0.2) * (i % 2 ? -1 : 1) * (1 + i * 0.3);
      const local = (t % cycle) / cycle;
      const draw = Math.min(1, Math.max(0, (local - i * 0.08) * 2.4));
      const fade = local > 0.85 ? 1 - (local - 0.85) / 0.15 : 1;
      const per = n === 0 ? TAU * r : n * 2 * r * Math.sin(Math.PI / n);
      ctx.setLineDash([per * draw, per]);
      const c = this.color(i);
      glowStroke(ctx, () => {
        ctx.beginPath();
        if (n === 0) ctx.arc(0, 0, r, rot, rot + TAU);
        else
          for (let k = 0; k <= n; k++) {
            const a = rot + (k / n) * TAU - Math.PI / 2;
            if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
      }, c, 1.3, alpha * (this.def.alpha ?? 0.8) * Math.max(0.25, fade), this.passes);
      ctx.setLineDash([]);
      if (n > 0)
        for (let k = 0; k < n; k++) {
          const a = rot + (k / n) * TAU - Math.PI / 2;
          drawSprite(ctx, sprite('dot', c), Math.cos(a) * r, Math.sin(a) * r, 8, alpha * draw);
        }
    });
    ctx.globalAlpha = 1;
  }
}

class Lemniscate extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const a = (this.def.radius ?? 2.6) * R;
    glowStroke(ctx, () => {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const s = (i / 120) * TAU;
        const sn = Math.sin(s);
        const den = 1 + sn * sn;
        const x = (a * Math.cos(s)) / den;
        const y = (a * sn * Math.cos(s)) / den;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }, this.color(0), 1.6, alpha * (this.def.alpha ?? 0.4) * (0.75 + 0.25 * Math.sin(t * 1.5)), this.passes);
  }
}

class StarCore extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    drawSprite(ctx, glowSprite('#fff6cf', 0.3), 0, 0, R * 5.2, alpha * (0.6 + 0.15 * Math.sin(t * 2)));
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU + t * 0.08;
      const len = R * (0.3 + 0.5 * (0.5 + 0.5 * noise1(t * 2 + i, 9)));
      ctx.strokeStyle = rgba(spectral(i * 18 + t * 40), alpha * 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      ctx.lineTo(Math.cos(a) * (R + len), Math.sin(a) * (R + len));
      ctx.stroke();
    }
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.005, 0, TAU);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, rgba('#ffffff', alpha * 0.95));
    g.addColorStop(0.6, rgba('#fff1b0', alpha * 0.7));
    g.addColorStop(1, rgba('#ff9a3d', alpha * 0.55));
    ctx.fillStyle = g;
    ctx.fillRect(-R, -R, R * 2, R * 2);
    for (let i = 0; i < 9; i++) {
      const x = noise1(t * 0.3 + i * 5, 4) * R * 0.75;
      const y = noise1(t * 0.3 + i * 5, 7) * R * 0.75;
      drawSprite(ctx, glowSprite('#ffffff', 0.5), x, y, R * 0.7, alpha * 0.35);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Meteors extends Special {
  private list: { a: number; age: number; dur: number; impact: number }[] = [];
  private timer = 0.5;
  override update(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0 && this.list.length < (this.def.count ?? 3)) {
      this.timer = (this.def.interval ?? 2.4) * (0.5 + Math.random());
      this.list.push({ a: Math.random() * TAU, age: 0, dur: 1.1 + Math.random() * 0.5, impact: -1 });
    }
    for (const m of this.list) {
      m.age += dt;
      if (m.age >= m.dur && m.impact < 0) m.impact = 0;
      if (m.impact >= 0) m.impact += dt;
    }
    this.list = this.list.filter((m) => m.impact < 0.6);
  }
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const start = (this.def.radius ?? 2.3) * R;
    for (const m of this.list) {
      const sx = Math.cos(m.a) * start;
      const sy = Math.sin(m.a) * start;
      const ta = m.a + 0.9;
      const ex = Math.cos(ta) * R * 0.98;
      const ey = Math.sin(ta) * R * 0.98;
      if (m.impact < 0) {
        const k = m.age / m.dur;
        const head = sprite('dot', this.color(0));
        for (let j = 10; j >= 0; j--) {
          const kk = Math.max(0, k - j * 0.025);
          const e = kk * kk;
          drawSprite(ctx, head, sx + (ex - sx) * e, sy + (ey - sy) * e, (j === 0 ? 14 : 10 - j * 0.6), alpha * (1 - j / 11));
        }
      } else {
        const k = m.impact / 0.6;
        drawSprite(ctx, glowSprite(this.color(0), 0.4), ex, ey, 40 + k * 30, alpha * (1 - k));
        const frag = sprite('fragment', this.color(1));
        for (let j = 0; j < 6; j++) {
          const da = ta + (j - 2.5) * 0.35;
          drawSprite(ctx, frag, ex + Math.cos(da) * k * 30, ey + Math.sin(da) * k * 30, 7, alpha * (1 - k));
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

class Flares extends Special {
  private flares: { a: number; age: number; life: number; h: number }[] = [];
  override update(dt: number): void {
    const n = this.def.count ?? 4;
    while (this.flares.length < n) this.flares.push({ a: Math.random() * TAU, age: 0, life: 2.5 + Math.random() * 2, h: 0.25 + Math.random() * 0.4 });
    for (const f of this.flares) f.age += dt * (this.def.speed ?? 0.6);
    this.flares = this.flares.filter((f) => f.age < f.life);
  }
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.flares) {
      const k = f.age / f.life;
      const h = R * f.h * Math.sin(Math.min(1, k * 1.3) * Math.PI * 0.5) * (1 + k * 0.4);
      const w = 0.32;
      const ax = Math.cos(f.a - w) * R * 0.95;
      const ay = Math.sin(f.a - w) * R * 0.95;
      const bx = Math.cos(f.a + w) * R * 0.95;
      const by = Math.sin(f.a + w) * R * 0.95;
      const cx = Math.cos(f.a) * (R + h * 2.2);
      const cy = Math.sin(f.a) * (R + h * 2.2);
      const a = alpha * (this.def.alpha ?? 0.8) * Math.min(1, (1 - k) * 3);
      glowStroke(ctx, () => {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);
      }, k > 0.7 ? this.color(2) : this.color(1), 4 * (1 - k * 0.5), a, this.passes);
    }
  }
}

class Aurora extends Special {
  override back(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 3;
    const span = (this.def.radius ?? 1.9) * R * 1.3;
    for (let i = 0; i < n; i++) {
      const base = -R * (0.9 + i * 0.28);
      const height = R * (0.55 + 0.15 * i);
      const c = this.color(i % 2 === 0 ? 0 : 2);
      const g = ctx.createLinearGradient(0, base, 0, base - height);
      g.addColorStop(0, rgba(c, alpha * (this.def.alpha ?? 0.5)));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      const steps = 32;
      // Curtains taper toward both ends so they fade into the sky.
      const taper = (k: number) => Math.sin((k / steps) * Math.PI);
      for (let k = 0; k <= steps; k++) {
        const x = -span + (2 * span * k) / steps;
        const y = base + Math.sin(x * 0.035 + t * (this.def.speed ?? 0.7) + i * 1.3) * 10 + noise1(x * 0.02 + t * 0.4, i) * 6 - (1 - taper(k)) * 18;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = steps; k >= 0; k--) {
        const x = -span + (2 * span * k) / steps;
        const y = base - height * taper(k) * (0.7 + 0.3 * noise1(x * 0.03 + t * 0.6, i + 5)) + Math.sin(x * 0.035 + t * (this.def.speed ?? 0.7) + i * 1.3) * 10 - (1 - taper(k)) * 18;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      // Curtain folds: thin vertical light rays along the ribbon.
      const rays = Math.round(14 * this.env.quality) + 4;
      for (let k = 1; k < rays; k++) {
        const f = k / rays;
        const x = -span + 2 * span * f;
        const tp = Math.sin(f * Math.PI);
        const y0 = base + Math.sin(x * 0.035 + t * (this.def.speed ?? 0.7) + i * 1.3) * 10 - (1 - tp) * 18;
        const hh = height * tp * (0.6 + 0.4 * noise1(k * 1.3 + t * 0.8, i + 9));
        const lg = ctx.createLinearGradient(0, y0, 0, y0 - hh);
        lg.addColorStop(0, rgba('#ffffff', alpha * 0.25 * tp));
        lg.addColorStop(1, rgba(c, 0));
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y0);
        ctx.lineTo(x, y0 - hh);
        ctx.stroke();
      }
    }
  }
}

class Facets extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const n = this.def.count ?? 8;
    const r = (this.def.radius ?? 1.35) * R;
    const rot = t * (this.def.speed ?? 0.3);
    const pts = Array.from({ length: n }, (_, i) => {
      const a = rot + (i / n) * TAU;
      return [Math.cos(a) * r, Math.sin(a) * r * 0.92] as [number, number];
    });
    const a = alpha * (this.def.alpha ?? 0.6) * (0.75 + 0.25 * Math.sin(t * 2.3));
    glowStroke(ctx, () => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const [x2, y2] = pts[(i + 3) % n];
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
      });
    }, this.color(0), 0.8, a * 0.6, this.passes);
    glowStroke(ctx, () => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    }, this.color(0), 1.1, a, this.passes);
    const sp = sprite('star4', '#ffffff');
    pts.forEach(([x, y], i) => drawSprite(ctx, sp, x, y, 10 + 6 * Math.max(0, Math.sin(t * 4 + i * 1.9)), alpha));
    ctx.globalAlpha = 1;
  }
}

class EclipseDisc extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R * 1.01, 0, TAU);
    ctx.clip();
    const dx = Math.cos(t * (this.def.speed ?? 0.25)) * R * 1.15;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(4,2,8,${0.85 * alpha * (this.def.alpha ?? 0.85)})`;
    ctx.beginPath();
    ctx.arc(dx, -R * 0.08, R, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.02, 0, TAU);
    }, this.color(0), 1.4, alpha * 0.55, this.passes);
  }
}

class TimeDilation extends Special {
  override tempo(t: number): number {
    const period = this.def.interval ?? 12;
    return 0.18 + 0.82 * (0.5 + 0.5 * Math.cos((TAU * t) / period));
  }
}

class PhotonRing extends Special {
  override front(ctx: CanvasRenderingContext2D, v: View, alpha: number, t: number): void {
    setView(ctx, v);
    ctx.globalCompositeOperation = 'lighter';
    const flick = this.env.reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 23);
    glowStroke(ctx, () => {
      ctx.beginPath();
      ctx.arc(0, 0, (this.def.radius ?? 1.2) * R, 0, TAU);
    }, this.color(0), 1.6, alpha * (this.def.alpha ?? 1) * flick, this.passes);
  }
}

class AccretionGlow extends Special {
  private draw(ctx: CanvasRenderingContext2D, v: View, alpha: number, pass: Pass): void {
    setView(ctx, v);
    ctx.save();
    ctx.rotate(TILT_ANGLE);
    ctx.scale(1, 1 - (this.def.tilt ?? 0.8));
    ctx.beginPath();
    const r = (this.def.radius ?? 2.4) * R;
    if (pass === 'back') ctx.rect(-r, -r, r * 2, r);
    else ctx.rect(-r, 0, r * 2, r);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, r);
    g.addColorStop(0, rgba(this.color(0), alpha * (this.def.alpha ?? 0.5)));
    g.addColorStop(0.5, rgba(this.color(2), alpha * (this.def.alpha ?? 0.5) * 0.5));
    g.addColorStop(1, rgba(this.color(2), 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  override back(ctx: CanvasRenderingContext2D, v: View, a: number): void {
    this.draw(ctx, v, a, 'back');
  }
  override front(ctx: CanvasRenderingContext2D, v: View, a: number): void {
    this.draw(ctx, v, a, 'front');
  }
}

export function createSpecial(def: SpecialDef, aura: AuraDef, env: SpecialEnv): Special {
  switch (def.kind) {
    case 'arcs': return new Arcs(def, aura, env);
    case 'corona': return new Corona(def, aura, env);
    case 'comets': return new Comets(def, aura, env);
    case 'beams': return new Beams(def, aura, env);
    case 'pulseRings': return new PulseRings(def, aura, env);
    case 'trailRings': return new TrailRings(def, aura, env);
    case 'moons': return new Moons(def, aura, env);
    case 'constellation': return new Constellation(def, aura, env);
    case 'wings': return new Wings(def, aura, env);
    case 'lensing': return new Lensing(def, aura, env);
    case 'halo': return new Halo(def, aura, env);
    case 'rift': return new Rift(def, aura, env);
    case 'clock': return new Clock(def, aura, env);
    case 'fieldLines': return new FieldLines(def, aura, env);
    case 'web': return new Web(def, aura, env);
    case 'shockPulse': return new ShockPulse(def, aura, env);
    case 'cells': return new Cells(def, aura, env);
    case 'mobius': return new Mobius(def, aura, env);
    case 'ignite': return new Ignite(def, aura, env);
    case 'rays': return new Rays(def, aura, env);
    case 'inversion': return new Inversion(def, aura, env);
    case 'geometry': return new Geometry(def, aura, env);
    case 'lemniscate': return new Lemniscate(def, aura, env);
    case 'starCore': return new StarCore(def, aura, env);
    case 'meteors': return new Meteors(def, aura, env);
    case 'flares': return new Flares(def, aura, env);
    case 'aurora': return new Aurora(def, aura, env);
    case 'facets': return new Facets(def, aura, env);
    case 'eclipseDisc': return new EclipseDisc(def, aura, env);
    case 'timeDilation': return new TimeDilation(def, aura, env);
    case 'photonRing': return new PhotonRing(def, aura, env);
    case 'accretionGlow': return new AccretionGlow(def, aura, env);
  }
}
