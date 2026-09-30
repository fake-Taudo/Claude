// Partikel und kurzlebige Effekte in Weltkoordinaten (Felder), gezeichnet über die View.
import { FONT } from './canvastext.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

export class Particles {
  constructor() {
    this.list = [];
    this.rings = [];
    this.bolts = [];
    this.texts = [];
    this.q = 1;
    this.max = 700;
  }

  setQuality(q) {
    this.q = q === 'low' ? 0.35 : q === 'medium' ? 0.7 : 1;
    this.max = q === 'low' ? 200 : q === 'medium' ? 450 : 700;
  }

  clear() {
    this.list.length = 0;
    this.rings.length = 0;
    this.bolts.length = 0;
    this.texts.length = 0;
  }

  add(p) {
    if (this.list.length >= this.max) return;
    p.life = p.max = p.life ?? 0.6;
    p.z = p.z ?? 0;
    p.vz = p.vz ?? 0;
    p.vx = p.vx ?? 0;
    p.vy = p.vy ?? 0;
    p.g = p.g ?? 0;
    p.drag = p.drag ?? 0.9;
    p.rot = p.rot ?? Math.random() * TAU;
    p.spin = p.spin ?? 0;
    p.grow = p.grow ?? 0;
    this.list.push(p);
  }

  burst(x, y, n, o = {}) {
    const count = Math.max(1, Math.round(n * this.q));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = rnd(o.speed?.[0] ?? 1, o.speed?.[1] ?? 3);
      this.add({
        x: x + Math.cos(a) * (o.spread || 0) * Math.random(),
        y: y + Math.sin(a) * (o.spread || 0) * Math.random(),
        z: o.z ?? rnd(0, 0.3),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.8,
        vz: rnd(o.vz?.[0] ?? 0, o.vz?.[1] ?? 2),
        g: o.g ?? 6,
        drag: o.drag ?? 0.88,
        life: rnd(o.life?.[0] ?? 0.3, o.life?.[1] ?? 0.7),
        size: rnd(o.size?.[0] ?? 0.08, o.size?.[1] ?? 0.18),
        color: pick(o.colors || ['#ffffff']),
        shape: o.shape || 'circle',
        spin: o.spin ? rnd(-o.spin, o.spin) : 0,
        grow: o.grow || 0,
        glow: o.glow || false,
      });
    }
  }

  ring(x, y, r, color, life = 0.45, width = 0.25, fillAlpha = 0) {
    this.rings.push({ x, y, r, color, life, max: life, width, fillAlpha });
  }

  bolt(points, color = '#bff4ff', life = 0.2, width = 0.12) {
    // gezackte Linie erzeugen
    const pts = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0, z0 = 0] = points[i];
      const [x1, y1, z1 = 0] = points[i + 1];
      const segs = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.6));
      for (let k = 0; k < segs; k++) {
        const t = k / segs;
        const j = k === 0 ? 0 : 0.25;
        pts.push([x0 + (x1 - x0) * t + rnd(-j, j), y0 + (y1 - y0) * t + rnd(-j, j), z0 + (z1 - z0) * t]);
      }
    }
    const last = points[points.length - 1];
    pts.push([last[0], last[1], last[2] || 0]);
    this.bolts.push({ pts, color, life, max: life, width });
  }

  text(x, y, str, color = '#ffffff', size = 0.55, life = 0.9, z = 1.2) {
    if (this.texts.length > 60) this.texts.shift();
    this.texts.push({ x, y, str, color, size, life, max: life, z });
  }

  /** Schadenszahl: Pop + Aufsteigen (~550 ms). Treffer aufs selbe Ziel binnen 0,25 s werden addiert, max. 8 gleichzeitig. */
  damage(key, x, y, amount, color, z) {
    const same = this.texts.find((t) => t.key === key && t.max - t.life < 0.25);
    if (same) {
      same.val += amount;
      same.str = String(same.val);
      same.life = same.max;
      return;
    }
    const dmg = this.texts.filter((t) => t.key != null);
    if (dmg.length >= 8) this.texts.splice(this.texts.indexOf(dmg[0]), 1);
    this.texts.push({ key, x, y, val: amount, str: String(amount), color, size: 0.44, life: 0.55, max: 0.55, z, rise: 1.3 });
  }

  // ───────── Voreinstellungen ─────────
  hit(x, y, z = 0.5, color = '#fff6c8') {
    this.burst(x, y, 5, { z, colors: [color, '#ffffff'], speed: [1.5, 3.5], vz: [0.5, 2], life: [0.15, 0.3], size: [0.05, 0.1], shape: 'spark', g: 2 });
  }
  poof(x, y, big = 1) {
    this.burst(x, y, 10 * big, { colors: ['#ffffff', '#e8e4f0', '#cfc8dc'], speed: [0.5, 1.8], vz: [0.3, 1.2], life: [0.4, 0.8], size: [0.15 * big, 0.3 * big], shape: 'smoke', g: -0.5, grow: 0.6 });
  }
  explosion(x, y, r = 2, palette = ['#ffd84d', '#ff9a3d', '#ff5a3d']) {
    this.ring(x, y, r, palette[0], 0.4, 0.3, 0.25);
    this.burst(x, y, 18 + r * 6, { spread: r * 0.4, colors: palette, speed: [1, r * 2.2], vz: [1, 4], life: [0.3, 0.7], size: [0.12, 0.3], g: 8, glow: true });
    this.burst(x, y, 8 + r * 3, { spread: r * 0.5, colors: ['#6b6470', '#8e8795', '#4f4a55'], speed: [0.3, 1.2], vz: [0.5, 1.5], life: [0.6, 1.1], size: [0.25, 0.5], shape: 'smoke', g: -0.6, grow: 0.8 });
  }
  frost(x, y, r = 2.5) {
    this.ring(x, y, r, '#bff4ff', 0.6, 0.35, 0.3);
    this.burst(x, y, 20 + r * 4, { spread: r * 0.8, colors: ['#ffffff', '#bff4ff', '#7fd6ff'], speed: [0.5, 2], vz: [0.5, 2.5], life: [0.4, 0.9], size: [0.08, 0.2], shape: 'shard', spin: 8, g: 3 });
  }
  shock(x, y, r = 2.5) {
    this.ring(x, y, r, '#7fe9ff', 0.3, 0.25, 0.2);
    for (let i = 0; i < Math.round(4 * this.q) + 1; i++) {
      const a = Math.random() * TAU;
      this.bolt([[x, y, 0.2], [x + Math.cos(a) * r, y + Math.sin(a) * r, 0]], '#bff4ff', 0.18, 0.08);
    }
    this.burst(x, y, 10, { spread: r * 0.6, colors: ['#ffffff', '#7fe9ff'], speed: [1, 3], life: [0.15, 0.35], size: [0.05, 0.1], shape: 'spark', g: 0 });
  }
  heal(x, y, r = 1) {
    this.burst(x, y, 6 + r * 4, { spread: r, colors: ['#9dff8a', '#ffe66b', '#ffffff'], speed: [0.1, 0.4], vz: [1, 2], life: [0.6, 1.1], size: [0.12, 0.2], shape: 'plus', g: -0.5 });
  }
  poison(x, y, r) {
    this.burst(x, y, 3, { spread: r, colors: ['#8be04e', '#5fb82e', '#c7ff8a'], speed: [0, 0.3], vz: [0.2, 0.8], life: [0.6, 1.2], size: [0.12, 0.28], shape: 'bubble', g: -0.3 });
  }
  debris(x, y, r = 1.5) {
    this.burst(x, y, 26, { spread: r * 0.6, colors: ['#a79f94', '#8a8277', '#c8c0b4', '#6b4226'], speed: [1.5, 5], vz: [2, 6], life: [0.7, 1.4], size: [0.14, 0.32], shape: 'square', spin: 10, g: 12 });
    this.burst(x, y, 16, { spread: r, colors: ['#8e8795', '#b0a9b8', '#6b6470'], speed: [0.3, 1.5], vz: [0.5, 2], life: [0.9, 1.6], size: [0.4, 0.8], shape: 'smoke', g: -0.4, grow: 0.8 });
  }
  elixir(x, y) {
    this.burst(x, y, 8, { colors: ['#f06bd6', '#c43cf0', '#ffb3f0'], speed: [0.2, 0.8], vz: [2, 3.5], life: [0.6, 0.9], size: [0.12, 0.2], shape: 'drop', g: 3 });
  }
  deployDust(x, y, r = 0.5) {
    this.burst(x, y, 6 + r * 6, { spread: r * 0.6, colors: ['#e9dcc0', '#d6c7a3', '#ffffff'], speed: [0.8, 2], vz: [0.2, 0.8], life: [0.3, 0.55], size: [0.1, 0.22], shape: 'smoke', g: 0, grow: 0.5 });
  }
  confetti(x, y) {
    this.burst(x, y, 40, { spread: 1, colors: ['#ff4d57', '#3d8bff', '#ffd84d', '#5ad16a', '#c25bd6'], speed: [1, 4], vz: [3, 7], life: [1, 2], size: [0.1, 0.18], shape: 'square', spin: 12, g: 5, drag: 0.94 });
  }
  sparkle(x, y, z, color) {
    this.add({ x: x + rnd(-0.3, 0.3), y: y + rnd(-0.2, 0.2), z: z + rnd(0, 0.8), vz: 0.6, life: rnd(0.4, 0.7), size: rnd(0.08, 0.14), color, shape: 'star', g: 0, drag: 1 });
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.vx *= Math.pow(p.drag, dt * 30);
      p.vy *= Math.pow(p.drag, dt * 30);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vz -= p.g * dt;
      p.z += p.vz * dt;
      if (p.z < 0 && p.g > 0) {
        p.z = 0;
        p.vz *= -0.35;
        p.vx *= 0.6;
        p.vy *= 0.6;
      }
      p.rot += p.spin * dt;
      p.size += p.grow * dt * p.size;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
    for (const t of this.texts) {
      t.life -= dt;
      if (!t.rise) t.z += dt * 1.2;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  drawRings(ctx, view) {
    const s = view.s;
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      const [x, y] = view.toScreen(r.x, r.y);
      const rad = r.r * s * (0.35 + 0.65 * Math.sqrt(k));
      ctx.save();
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.beginPath();
      ctx.ellipse(x, y, rad, rad * 0.8, 0, 0, TAU);
      if (r.fillAlpha) {
        ctx.fillStyle = r.color;
        ctx.globalAlpha = (1 - k) * r.fillAlpha;
        ctx.fill();
        ctx.globalAlpha = (1 - k) * 0.9;
      }
      ctx.lineWidth = Math.max(2, r.width * s * (1 - k));
      ctx.strokeStyle = r.color;
      ctx.stroke();
      ctx.restore();
    }
  }

  draw(ctx, view) {
    const s = view.s;
    for (const p of this.list) {
      const [x, y0] = view.toScreen(p.x, p.y);
      const y = y0 - p.z * s;
      const a = Math.min(1, p.life / (p.max * 0.5));
      const r = Math.max(0.5, p.size * s);
      ctx.globalAlpha = p.shape === 'smoke' ? a * 0.55 : a;
      ctx.fillStyle = p.color;
      switch (p.shape) {
        case 'spark': {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, r * 0.6);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - p.vx * s * 0.04, y - (p.vy - p.vz) * s * 0.04);
          ctx.stroke();
          break;
        }
        case 'square':
        case 'shard': {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rot);
          if (p.shape === 'shard') {
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.5, 0);
            ctx.lineTo(0, r);
            ctx.lineTo(-r * 0.5, 0);
            ctx.closePath();
            ctx.fill();
          } else ctx.fillRect(-r / 2, -r / 2, r, r);
          ctx.restore();
          break;
        }
        case 'plus': {
          const w = r * 0.35;
          ctx.fillRect(x - r / 2, y - w / 2, r, w);
          ctx.fillRect(x - w / 2, y - r / 2, w, r);
          break;
        }
        case 'star': {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(p.rot);
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const rr = i % 2 ? r * 0.35 : r;
            const ang = (i / 8) * TAU;
            ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'bubble': {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = a * 0.7;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU);
          ctx.fill();
          break;
        }
        case 'drop': {
          ctx.beginPath();
          ctx.moveTo(x, y - r * 1.4);
          ctx.quadraticCurveTo(x + r, y, x, y + r);
          ctx.quadraticCurveTo(x - r, y, x, y - r * 1.4);
          ctx.fill();
          break;
        }
        default: {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    // Blitze
    for (const b of this.bolts) {
      const a = b.life / b.max;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      b.pts.forEach(([px, py, pz], i) => {
        const [sx, sy] = view.toScreen(px, py);
        if (i) ctx.lineTo(sx, sy - pz * s);
        else ctx.moveTo(sx, sy - pz * s);
      });
      ctx.strokeStyle = b.color;
      ctx.lineWidth = Math.max(3, b.width * s * 2.2);
      ctx.globalAlpha *= 0.35;
      ctx.stroke();
      ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, b.width * s * 0.8);
      ctx.stroke();
      ctx.restore();
    }
    // Schwebende Texte
    for (const t of this.texts) {
      const [x, y0] = view.toScreen(t.x, t.y);
      const age = t.max - t.life;
      const y = y0 - (t.z + (t.rise ? t.rise * Math.min(1, age / t.max) : 0)) * s;
      const a = Math.min(1, t.life / (t.max * 0.4));
      const pop = t.rise ? (age < 0.12 ? 0.7 + (age / 0.12) * 0.5 : age < 0.2 ? 1.2 - ((age - 0.12) / 0.08) * 0.2 : 1) : 1;
      ctx.save();
      ctx.globalAlpha = a;
      const px = Math.max(12, Math.round(t.size * s * pop));
      ctx.font = `${px}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, px * 0.2);
      ctx.strokeStyle = '#1c1830';
      ctx.strokeText(t.str, x, y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, x, y);
      ctx.restore();
    }
  }
}
