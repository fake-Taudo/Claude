// The stylised planet avatar. A pre-rendered surface texture is mapped onto the disc in
// vertical slices (arcsin longitude), which makes the rotation look spherical.

import { PLANETS, type PlanetStyle } from '../config/planet';
import { hash01, mix, rgba } from './color';
import { REF_R, TILT_ANGLE, type View } from './particles';
import { glowSprite } from './sprites';

const TAU = Math.PI * 2;
const TEX_W = 512;
const TEX_H = 256;

function makeTexture(style: PlanetStyle, seed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const ctx = c.getContext('2d')!;
  let n = seed;
  const rnd = () => hash01(n++);
  const lg = ctx.createLinearGradient(0, 0, 0, TEX_H);
  lg.addColorStop(0, style.colors[2]);
  lg.addColorStop(0.3, style.colors[1]);
  lg.addColorStop(0.5, style.colors[0]);
  lg.addColorStop(0.7, style.colors[1]);
  lg.addColorStop(1, style.colors[2]);
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Wrapped drawing helper (features crossing the seam appear on both sides).
  const wrap = (fn: (dx: number) => void) => {
    fn(0);
    fn(-TEX_W);
    fn(TEX_W);
  };

  if (style.bands.length) {
    const bandH = TEX_H / (style.bands.length * 2);
    for (let i = 0; i < style.bands.length * 2; i++) {
      const color = style.bands[i % style.bands.length];
      ctx.fillStyle = rgba(color, 0.75);
      ctx.beginPath();
      const y0 = i * bandH;
      ctx.moveTo(0, y0);
      for (let x = 0; x <= TEX_W; x += 16) ctx.lineTo(x, y0 + Math.sin((x / TEX_W) * TAU * 3 + i) * 3 + (rnd() - 0.5) * 2);
      for (let x = TEX_W; x >= 0; x -= 16) ctx.lineTo(x, y0 + bandH + Math.sin((x / TEX_W) * TAU * 2 + i * 1.7) * 4);
      ctx.closePath();
      ctx.fill();
    }
    // Swirls between bands.
    for (let i = 0; i < 40; i++) {
      const x = rnd() * TEX_W;
      const y = rnd() * TEX_H;
      ctx.fillStyle = rgba('#ffffff', 0.08);
      wrap((dx) => {
        ctx.beginPath();
        ctx.ellipse(x + dx, y, 18 + rnd() * 30, 3 + rnd() * 4, 0, 0, TAU);
        ctx.fill();
      });
    }
  }

  if (style.continents) {
    for (let k = 0; k < 7; k++) {
      const cx = rnd() * TEX_W;
      const cy = TEX_H * (0.2 + rnd() * 0.6);
      const color = style.continents[k % style.continents.length];
      for (let i = 0; i < 26; i++) {
        const x = cx + (rnd() - 0.5) * 90;
        const y = cy + (rnd() - 0.5) * 50;
        const r = 6 + rnd() * 18;
        ctx.fillStyle = rgba(color, 0.9);
        wrap((dx) => {
          ctx.beginPath();
          ctx.arc(x + dx, y, r, 0, TAU);
          ctx.fill();
        });
      }
    }
    // Polar caps.
    ctx.fillStyle = 'rgba(240,248,255,0.85)';
    ctx.fillRect(0, 0, TEX_W, 10);
    ctx.fillRect(0, TEX_H - 10, TEX_W, 10);
  }

  if (style.craters) {
    for (let i = 0; i < 46; i++) {
      const x = rnd() * TEX_W;
      const y = TEX_H * (0.1 + rnd() * 0.8);
      const r = 3 + Math.pow(rnd(), 2) * 22;
      wrap((dx) => {
        ctx.fillStyle = rgba(mix(style.colors[2], '#000000', 0.3), 0.55);
        ctx.beginPath();
        ctx.arc(x + dx, y, r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba('#ffffff', 0.22);
        ctx.lineWidth = Math.max(1, r * 0.18);
        ctx.beginPath();
        ctx.arc(x + dx - r * 0.12, y - r * 0.12, r, Math.PI * 0.9, Math.PI * 1.9);
        ctx.stroke();
      });
    }
    // Mottled surface.
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = rgba(rnd() < 0.5 ? '#ffffff' : '#000000', 0.05);
      ctx.beginPath();
      ctx.arc(rnd() * TEX_W, rnd() * TEX_H, 2 + rnd() * 8, 0, TAU);
      ctx.fill();
    }
  }

  if (style.storm) {
    const x = TEX_W * 0.3;
    const y = TEX_H * 0.62;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
    g.addColorStop(0, rgba('#ffffff', 0.7));
    g.addColorStop(0.4, rgba(style.storm, 0.9));
    g.addColorStop(1, rgba(style.storm, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 34, 16, 0, 0, TAU);
    ctx.fill();
  }

  if (style.clouds) {
    for (let i = 0; i < 70; i++) {
      const x = rnd() * TEX_W;
      const y = TEX_H * (0.08 + rnd() * 0.84);
      ctx.fillStyle = rgba('#ffffff', 0.18 + rnd() * 0.25);
      wrap((dx) => {
        ctx.beginPath();
        ctx.ellipse(x + dx, y, 14 + rnd() * 30, 4 + rnd() * 6, 0, 0, TAU);
        ctx.fill();
      });
    }
  }
  return c;
}

export class Planet {
  private textures = new Map<number, HTMLCanvasElement>();
  level = 0;
  /** Crossfade from the previous style after a rebirth. */
  private prevLevel = 0;
  private morph = 1;
  private rot = 0;
  private moonPhase = [Math.random() * TAU, Math.random() * TAU];

  style(level = this.level): PlanetStyle {
    return PLANETS[Math.max(0, Math.min(PLANETS.length - 1, level))];
  }

  setLevel(level: number, animate: boolean): void {
    if (level === this.level) return;
    this.prevLevel = this.level;
    this.level = level;
    this.morph = animate ? 0 : 1;
  }

  /** Visual radius multiplier including the morph. */
  scale(): number {
    const a = this.style(this.prevLevel).scale;
    const b = this.style().scale;
    const k = this.morph;
    return a + (b - a) * (k * k * (3 - 2 * k));
  }

  private texture(level: number): HTMLCanvasElement {
    let t = this.textures.get(level);
    if (!t) {
      t = makeTexture(this.style(level), 1000 + level * 977);
      this.textures.set(level, t);
    }
    return t;
  }

  update(dt: number): void {
    this.rot = (this.rot + dt * this.style().spin) % 1;
    if (this.morph < 1) this.morph = Math.min(1, this.morph + dt / 1.6);
    this.moonPhase[0] += dt * 0.35;
    this.moonPhase[1] -= dt * 0.22;
  }

  private drawSurface(ctx: CanvasRenderingContext2D, r: number, level: number, alpha: number): void {
    const tex = this.texture(level);
    const slices = 28;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < slices; i++) {
      const x0 = -r + (2 * r * i) / slices;
      const x1 = -r + (2 * r * (i + 1)) / slices;
      const lon0 = Math.asin(Math.max(-1, Math.min(1, x0 / r)));
      const lon1 = Math.asin(Math.max(-1, Math.min(1, x1 / r)));
      let u = (this.rot + (lon0 + Math.PI / 2) / TAU) * TEX_W;
      u = ((u % TEX_W) + TEX_W) % TEX_W;
      const sw = ((lon1 - lon0) / TAU) * TEX_W;
      const dw = x1 - x0 + 0.6;
      if (u + sw <= TEX_W) ctx.drawImage(tex, u, 0, sw, TEX_H, x0, -r, dw, 2 * r);
      else {
        const first = TEX_W - u;
        const k = first / sw;
        ctx.drawImage(tex, u, 0, first, TEX_H, x0, -r, dw * k, 2 * r);
        ctx.drawImage(tex, 0, 0, sw - first, TEX_H, x0 + (x1 - x0) * k, -r, dw * (1 - k) + 0.6, 2 * r);
      }
    }
    ctx.globalAlpha = 1;
  }

  private ringPath(ctx: CanvasRenderingContext2D, rr: number, from: number, to: number): void {
    ctx.beginPath();
    ctx.ellipse(0, 0, rr, rr * 0.24, TILT_ANGLE, from, to);
  }

  /** Planetary ring + moons behind the planet. */
  drawBack(ctx: CanvasRenderingContext2D, view: View, scale: number): void {
    ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
    this.drawRing(ctx, scale, Math.PI, TAU);
    this.drawMoons(ctx, scale, 'back');
  }

  drawFront(ctx: CanvasRenderingContext2D, view: View, scale: number): void {
    ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
    this.drawRing(ctx, scale, 0, Math.PI);
    this.drawMoons(ctx, scale, 'front');
  }

  private drawRing(ctx: CanvasRenderingContext2D, scale: number, from: number, to: number): void {
    const ring = this.style().ring;
    if (!ring) return;
    const base = REF_R * scale * ring.radius;
    const width = REF_R * scale * ring.width;
    const a = Math.min(1, this.morph * 1.5);
    for (let i = 0; i < 7; i++) {
      const rr = base - width / 2 + (width * i) / 6;
      ctx.strokeStyle = rgba(ring.color, (0.18 + 0.22 * Math.abs(Math.sin(i * 1.9))) * a);
      ctx.lineWidth = width / 6;
      this.ringPath(ctx, rr, from, to);
      ctx.stroke();
    }
  }

  private drawMoons(ctx: CanvasRenderingContext2D, scale: number, pass: 'back' | 'front'): void {
    const n = this.style().moons;
    for (let i = 0; i < n; i++) {
      const a = this.moonPhase[i];
      const r = REF_R * scale * (2.6 + i * 0.5);
      const x0 = Math.cos(a) * r;
      const y0 = Math.sin(a) * r * 0.3;
      const z = Math.sin(a);
      if ((pass === 'back') !== z < 0) continue;
      const x = x0 * Math.cos(TILT_ANGLE) - y0 * Math.sin(TILT_ANGLE);
      const y = x0 * Math.sin(TILT_ANGLE) + y0 * Math.cos(TILT_ANGLE);
      const size = REF_R * (0.16 - i * 0.03) * (1 + 0.15 * z);
      const g = ctx.createRadialGradient(x - size * 0.4, y - size * 0.4, size * 0.1, x, y, size);
      g.addColorStop(0, '#f2f2ff');
      g.addColorStop(1, '#5a5f80');
      ctx.globalAlpha = Math.min(1, this.morph * 1.5);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /** The planet body with shading and atmosphere rim. */
  drawBody(ctx: CanvasRenderingContext2D, view: View, scale: number, atmosphere: { color: string; alpha: number } | null): void {
    const r = REF_R * scale;
    const style = this.style();
    const atmoColor = atmosphere ? mix(style.atmosphere, atmosphere.color, 0.55 * atmosphere.alpha) : style.atmosphere;
    ctx.setTransform(view.s, 0, 0, view.s, view.tx, view.ty);
    // Outer atmosphere glow.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    const gs = r * 2.9;
    ctx.drawImage(glowSprite(atmoColor, 0.42), -gs / 2, -gs / 2, gs, gs);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.clip();
    ctx.fillStyle = style.colors[2];
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    if (this.morph < 1) this.drawSurface(ctx, r, this.prevLevel, 1);
    this.drawSurface(ctx, r, this.level, this.morph < 1 ? this.morph : 1);
    // Day/night shading.
    const shade = ctx.createRadialGradient(-r * 0.45, -r * 0.5, r * 0.1, -r * 0.1, -r * 0.1, r * 1.45);
    shade.addColorStop(0, 'rgba(255,255,255,0.18)');
    shade.addColorStop(0.45, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(2,3,15,0.82)');
    ctx.fillStyle = shade;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    // Atmosphere scattering at the limb.
    const limb = ctx.createRadialGradient(0, 0, r * 0.72, 0, 0, r);
    limb.addColorStop(0, rgba(atmoColor, 0));
    limb.addColorStop(1, rgba(atmoColor, 0.45));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = limb;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
    // Thin rim highlight on the lit side.
    ctx.strokeStyle = rgba(atmoColor, 0.75);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.5, Math.PI * 0.95, Math.PI * 1.75);
    ctx.stroke();
  }
}
