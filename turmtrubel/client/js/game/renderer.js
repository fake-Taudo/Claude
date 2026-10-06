// Zeichnet Arena, Zauberzonen, Einheiten, Projektile, Effekte und Platzierungsvorschau.
import { ARENA_W, ARENA_H, RIVER_Y0, RIVER_Y1, BRIDGES, TOWER_SLOTS, placementRects } from '/shared/arena.js';
import { EF, EMOTES } from '/shared/protocol.js';
import { drawUnit, drawBuilding, drawTower, drawEmoteFace, drawSpellIcon, TEAM, OUTLINE, shade } from './sprites.js';
import { FONT, text as ctext, tnum, rr as rrect } from './canvastext.js';
import { softShadow } from '../design/light.js';
import { LIGHT } from '../design/tokens.js';

const TAU = Math.PI * 2;
// Rollende Zauber (Baumstamm, Barbarenfass) und im Bogen fliegende Geschosse
const ROLLING = new Set(['roll', 'log', 'barrelRoll']);
const ARC_KINDS = new Set(['boulder', 'bomb', 'dynamite', 'rocket']);

/** Abbildung Welt (kanonisch) ↔ Bildschirm. Spieler 1 sieht gedreht; "rotated" = Querformat-Ansicht. */
export class View {
  constructor() {
    this.mode = 'portrait';
    this.s = 20;
    this.ox = 0;
    this.oy = 0;
    this.flip = false;
  }
  toScreen(x, y) {
    if (this.flip) {
      x = ARENA_W - x;
      y = ARENA_H - y;
    }
    if (this.mode === 'portrait') return [this.ox + x * this.s, this.oy + y * this.s];
    return [this.ox + y * this.s, this.oy + (ARENA_W - x) * this.s];
  }
  toWorld(sx, sy) {
    let x;
    let y;
    if (this.mode === 'portrait') {
      x = (sx - this.ox) / this.s;
      y = (sy - this.oy) / this.s;
    } else {
      y = (sx - this.ox) / this.s;
      x = ARENA_W - (sy - this.oy) / this.s;
    }
    if (this.flip) {
      x = ARENA_W - x;
      y = ARENA_H - y;
    }
    return [x, y];
  }
  /** Weltrechteck → Bildschirmrechteck */
  rect(x0, y0, x1, y1) {
    const [ax, ay] = this.toScreen(x0, y0);
    const [bx, by] = this.toScreen(x1, y1);
    return { x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay) };
  }
  get width() {
    return (this.mode === 'portrait' ? ARENA_W : ARENA_H) * this.s;
  }
  get height() {
    return (this.mode === 'portrait' ? ARENA_H : ARENA_W) * this.s;
  }
}

function hash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export class Renderer {
  constructor(game) {
    this.game = game;
    this.bg = document.createElement('canvas');
    this.overlay = document.createElement('canvas');
    this.overlayKey = '';
    this.bgKey = '';
  }

  // ───────────── Hintergrund ─────────────
  renderBackground(cw, ch, dpr) {
    const view = this.game.view;
    const key = [cw, ch, dpr, view.mode, view.s, view.ox, view.oy].join('|');
    if (key === this.bgKey) return;
    this.bgKey = key;
    const bg = this.bg;
    bg.width = Math.round(cw * dpr);
    bg.height = Math.round(ch * dpr);
    const c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = view.s;

    // Umgebung
    const g = c.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#2f6b3a');
    g.addColorStop(1, '#255a31');
    c.fillStyle = g;
    c.fillRect(0, 0, cw, ch);
    const A = view.rect(0, 0, ARENA_W, ARENA_H);
    // Deko-Bäume & Büsche außerhalb der Arena
    for (let i = 0; i < 90; i++) {
      const x = hash(i) * cw;
      const y = hash(i + 500) * ch;
      if (x > A.x - s * 0.8 && x < A.x + A.w + s * 0.8 && y > A.y - s * 0.8 && y < A.y + A.h + s * 0.8) continue;
      const r = s * (0.5 + hash(i + 900) * 0.7);
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath();
      c.ellipse(x + r * 0.2, y + r * 0.5, r, r * 0.5, 0, 0, TAU);
      c.fill();
      c.fillStyle = hash(i + 77) > 0.5 ? '#3f8f45' : '#4ea552';
      c.strokeStyle = OUTLINE;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.beginPath();
      c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU);
      c.fill();
    }
    // Rahmen
    c.fillStyle = '#6b5a45';
    c.strokeStyle = OUTLINE;
    c.lineWidth = 3;
    c.beginPath();
    c.roundRect(A.x - s * 0.35, A.y - s * 0.35, A.w + s * 0.7, A.h + s * 0.7, s * 0.5);
    c.fill();
    c.stroke();
    // Rasen-Schachbrett
    for (let ty = 0; ty < ARENA_H; ty++) {
      for (let tx = 0; tx < ARENA_W; tx++) {
        const r = view.rect(tx, ty, tx + 1, ty + 1);
        const odd = (tx + ty) % 2;
        const v = hash(tx * 37 + ty * 11) * 0.04 - 0.02;
        c.fillStyle = shade(odd ? '#86d160' : '#7bc656', v);
        c.fillRect(r.x, r.y, r.w + 0.5, r.h + 0.5);
      }
    }
    // Wege von den Brücken zu den Wachtürmen
    c.fillStyle = 'rgba(233, 214, 160, 0.35)';
    for (const b of BRIDGES) {
      for (const [y0, y1] of [[6.5, RIVER_Y0], [RIVER_Y1, 25.5]]) {
        const r = view.rect(b.x0 + 0.3, y0, b.x1 - 0.3, y1);
        c.fillRect(r.x, r.y, r.w, r.h);
      }
    }
    // Turmplätze
    for (const t of TOWER_SLOTS) {
      const half = (t.key === 'king' ? 4 : 3) / 2 + 0.35;
      const r = view.rect(t.x - half, t.y - half, t.x + half, t.y + half);
      c.fillStyle = '#d9ceb6';
      c.strokeStyle = 'rgba(28,24,48,0.5)';
      c.lineWidth = 2;
      c.beginPath();
      c.roundRect(r.x, r.y, r.w, r.h, s * 0.3);
      c.fill();
      c.stroke();
      c.strokeStyle = 'rgba(120,100,80,0.35)';
      c.lineWidth = 1;
      for (let k = 1; k < half * 2; k++) {
        const rr = view.rect(t.x - half + k, t.y - half, t.x - half + k, t.y + half);
        c.beginPath();
        c.moveTo(rr.x, rr.y);
        c.lineTo(rr.x + rr.w, rr.y + rr.h);
        c.stroke();
        const r2 = view.rect(t.x - half, t.y - half + k, t.x + half, t.y - half + k);
        c.beginPath();
        c.moveTo(r2.x, r2.y);
        c.lineTo(r2.x + r2.w, r2.y + r2.h);
        c.stroke();
      }
    }
    // Fluss
    const R = view.rect(0, RIVER_Y0 - 0.1, ARENA_W, RIVER_Y1 + 0.1);
    const rg = view.mode === 'portrait' ? c.createLinearGradient(0, R.y, 0, R.y + R.h) : c.createLinearGradient(R.x, 0, R.x + R.w, 0);
    rg.addColorStop(0, '#2c86d6');
    rg.addColorStop(0.5, '#47b4f5');
    rg.addColorStop(1, '#2c86d6');
    c.fillStyle = rg;
    c.fillRect(R.x, R.y, R.w, R.h);
    c.strokeStyle = '#6b8f3a';
    c.lineWidth = Math.max(2, s * 0.12);
    const e0 = view.rect(0, RIVER_Y0 - 0.1, ARENA_W, RIVER_Y0 - 0.1);
    const e1 = view.rect(0, RIVER_Y1 + 0.1, ARENA_W, RIVER_Y1 + 0.1);
    for (const e of [e0, e1]) {
      c.beginPath();
      c.moveTo(e.x, e.y);
      c.lineTo(e.x + e.w, e.y + e.h);
      c.stroke();
    }
    // Brücken
    for (const b of BRIDGES) {
      const r = view.rect(b.x0, RIVER_Y0 - 0.45, b.x1, RIVER_Y1 + 0.45);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(r.x + 3, r.y + 4, r.w, r.h);
      c.fillStyle = '#b07a45';
      c.strokeStyle = OUTLINE;
      c.lineWidth = 2.5;
      c.beginPath();
      c.roundRect(r.x, r.y, r.w, r.h, s * 0.15);
      c.fill();
      c.stroke();
      c.strokeStyle = 'rgba(60,35,15,0.55)';
      c.lineWidth = 1.5;
      const planks = 8;
      for (let k = 1; k < planks; k++) {
        const y = RIVER_Y0 - 0.45 + ((RIVER_Y1 - RIVER_Y0 + 0.9) * k) / planks;
        const l = view.rect(b.x0, y, b.x1, y);
        c.beginPath();
        c.moveTo(l.x, l.y);
        c.lineTo(l.x + l.w, l.y + l.h);
        c.stroke();
      }
      // Geländer
      c.fillStyle = '#8a5a32';
      c.strokeStyle = OUTLINE;
      c.lineWidth = 2;
      for (const x of [b.x0, b.x1]) {
        const rr = view.rect(x - 0.12, RIVER_Y0 - 0.5, x + 0.12, RIVER_Y1 + 0.5);
        c.beginPath();
        c.roundRect(rr.x, rr.y, rr.w, rr.h, 3);
        c.fill();
        c.stroke();
      }
    }
    // feine Randschatten
    c.strokeStyle = 'rgba(0,0,0,0.18)';
    c.lineWidth = s * 0.25;
    c.strokeRect(A.x + s * 0.12, A.y + s * 0.12, A.w - s * 0.24, A.h - s * 0.24);
  }

  drawRiverAnim(ctx, t) {
    const view = this.game.view;
    const s = view.s;
    ctx.save();
    const R = view.rect(0, RIVER_Y0, ARENA_W, RIVER_Y1);
    ctx.beginPath();
    ctx.rect(R.x, R.y, R.w, R.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    for (let i = 0; i < 7; i++) {
      const wx = ((i * 2.9 + t * 0.8) % (ARENA_W + 4)) - 2;
      const wy = RIVER_Y0 + 0.35 + (i % 3) * 0.6;
      const [x0, y0] = view.toScreen(wx, wy);
      const [x1, y1] = view.toScreen(wx + 1.2, wy);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + (view.mode === 'rotated' ? s * 0.15 : 0), (y0 + y1) / 2 - (view.mode === 'portrait' ? s * 0.15 : 0), x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ───────────── Platzierungs-Overlay ─────────────
  drawPlacementOverlay(ctx, cw, ch, dpr, kind, side, enemyDown, obstacles) {
    if (kind === 'spell') return;
    const view = this.game.view;
    const key = [kind, side, enemyDown.join(), obstacles.map((o) => o.x + ':' + o.y).join(','), this.bgKey].join('|');
    const ov = this.overlay;
    if (key !== this.overlayKey) {
      this.overlayKey = key;
      ov.width = Math.round(cw * dpr);
      ov.height = Math.round(ch * dpr);
      const c = ov.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const A = view.rect(0, 0, ARENA_W, ARENA_H);
      // Ungültige Fläche: rot getönt + schraffiert (nicht nur Farbe)
      c.fillStyle = 'rgba(200, 40, 60, 0.22)';
      c.fillRect(A.x, A.y, A.w, A.h);
      c.fillStyle = hatchRed(c);
      c.fillRect(A.x, A.y, A.w, A.h);
      const valid = kind === 'anywhere' ? [{ x0: 0, x1: ARENA_W, y0: 0, y1: ARENA_H }] : placementRects(side, enemyDown, kind === 'building' ? 'building' : 'troop');
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = '#000';
      for (const r of valid) {
        const rr = view.rect(r.x0 - 0.5, r.y0 - 0.5, r.x1 + 0.5, r.y1 + 0.5);
        c.fillRect(rr.x, rr.y, rr.w, rr.h);
      }
      c.globalCompositeOperation = 'source-over';
      // Gültige Fläche leicht aufhellen
      c.fillStyle = 'rgba(255,255,255,0.08)';
      for (const r of valid) {
        const rr = view.rect(r.x0 - 0.5, r.y0 - 0.5, r.x1 + 0.5, r.y1 + 0.5);
        c.fillRect(rr.x, rr.y, rr.w, rr.h);
      }
      if (kind === 'anywhere') {
        const R = view.rect(0, RIVER_Y0, ARENA_W, RIVER_Y1);
        c.fillStyle = 'rgba(255, 60, 70, 0.28)';
        c.fillRect(R.x, R.y, R.w, R.h);
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = '#000';
        for (const b of BRIDGES) {
          const rb = view.rect(b.x0, RIVER_Y0, b.x1, RIVER_Y1);
          c.fillRect(rb.x, rb.y, rb.w, rb.h);
        }
        c.globalCompositeOperation = 'source-over';
      }
      // Rand der erlaubten Fläche
      c.strokeStyle = 'rgba(255,255,255,0.75)';
      c.lineWidth = 2.5;
      c.setLineDash([10, 7]);
      for (const r of valid) {
        const rr = view.rect(r.x0 - 0.5, r.y0 - 0.5, r.x1 + 0.5, r.y1 + 0.5);
        c.strokeRect(rr.x + 1.5, rr.y + 1.5, rr.w - 3, rr.h - 3);
      }
      c.setLineDash([]);
      c.fillStyle = hatchRed(c);
      for (const o of obstacles) {
        const rr = view.rect(o.x - o.half, o.y - o.half, o.x + o.half, o.y + o.half);
        c.fillRect(rr.x, rr.y, rr.w, rr.h);
      }
      // Rasterlinien im erlaubten Bereich
      c.strokeStyle = 'rgba(255,255,255,0.18)';
      c.lineWidth = 1;
      for (let i = 0; i <= ARENA_W; i++) {
        const l = view.rect(i, 0, i, ARENA_H);
        c.beginPath();
        c.moveTo(l.x, l.y);
        c.lineTo(l.x + l.w, l.y + l.h);
        c.stroke();
      }
      for (let j = 0; j <= ARENA_H; j++) {
        const l = view.rect(0, j, ARENA_W, j);
        c.beginPath();
        c.moveTo(l.x, l.y);
        c.lineTo(l.x + l.w, l.y + l.h);
        c.stroke();
      }
    }
    ctx.drawImage(ov, 0, 0, cw, ch);
  }

  // ───────────── Zonen (Zauber) ─────────────
  drawZonesGround(ctx, zones, t) {
    const view = this.game.view;
    const s = view.s;
    for (const z of zones) {
      if (!z.active || ROLLING.has(z.fx)) continue;
      const [x, y] = view.toScreen(z.x, z.y);
      const r = z.r * s;
      const col = ZONE_COLORS[z.fx] || '#ffffff';
      ctx.save();
      const pulse = 0.85 + Math.sin(t * 4 + z.id) * 0.05;
      ctx.globalAlpha = 0.28 * (z.fade ?? 1);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(x, y, r * pulse, r * pulse, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.8 * (z.fade ?? 1);
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.setLineDash([s * 0.4, s * 0.25]);
      ctx.lineDashOffset = -t * s;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawZonesAir(ctx, zones, t) {
    const view = this.game.view;
    const s = view.s;
    for (const z of zones) {
      if (z.fx === 'barrelRoll') {
        const [x, y] = view.toScreen(z.x, z.y);
        ctx.save();
        ctx.translate(x, y - s * 0.55);
        ctx.rotate(t * 12);
        ctx.fillStyle = '#8b5a2b';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#6b6f7a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-s * 0.6, 0);
        ctx.lineTo(s * 0.6, 0);
        ctx.stroke();
        ctx.restore();
        continue;
      }
      if (z.fx === 'log') {
        const [x, y] = view.toScreen(z.x, z.y);
        const w = 3.5 * s;
        ctx.save();
        ctx.translate(x, y - s * 0.3);
        if (view.mode === 'rotated') ctx.rotate(Math.PI / 2);
        ctx.fillStyle = '#9b6a3a';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -s * 0.4, w, s * 0.8, s * 0.4);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(60,35,15,0.6)';
        const off = (t * 20) % 1;
        for (let k = 0; k < 4; k++) {
          const yy = -s * 0.4 + ((k + off) / 4) * s * 0.8;
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 4, yy);
          ctx.lineTo(w / 2 - 4, yy);
          ctx.stroke();
        }
        ctx.restore();
        continue;
      }
      if (z.active) continue;
      // Anflug (Projektil vom Burgturm zum Ziel)
      const k = z.prog;
      const [fx, fy] = view.toScreen(z.fromX, z.fromY);
      const [tx, ty] = view.toScreen(z.x, z.y);
      const px = fx + (tx - fx) * k;
      const arcH = Math.min(8, Math.hypot(z.x - z.fromX, z.y - z.fromY) * 0.35) * s;
      const py = fy + (ty - fy) * k - Math.sin(k * Math.PI) * arcH;
      // Zielmarkierung
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = z.owner === this.game.side ? TEAM.blue.main : TEAM.red.main;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(s * 0.6, z.r * s), 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (z.fx === 'arrows') {
        for (let i = 0; i < 7; i++) {
          const ox = (hash(i + z.id) - 0.5) * s * 2.5;
          const oy = (hash(i * 3 + z.id) - 0.5) * s * 1.5;
          drawArrow(ctx, px + ox, py + oy, Math.atan2(ty - fy, tx - fx) + (k > 0.5 ? 0.5 : -0.5), s * 0.7);
        }
      } else if (z.fx === 'barrel') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(t * 10);
        ctx.fillStyle = '#8b5a2b';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-s * 0.5, -s * 0.6, s, s * 1.2, s * 0.3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (z.fx === 'comet' || z.fx === 'fire') {
        const R = z.fx === 'comet' ? s * 0.8 : s * 0.55;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffb347';
        ctx.beginPath();
        ctx.arc(px - (tx - fx) * 0.04, py + arcH * 0.05, R * 1.3, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = z.fx === 'comet' ? '#7a6a5a' : '#ff7a2f';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, R, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffd84d';
        ctx.beginPath();
        ctx.arc(px - R * 0.25, py - R * 0.25, R * 0.4, 0, TAU);
        ctx.fill();
      } else if (z.fx === 'snow') {
        ctx.fillStyle = '#f4f8ff';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(px, py, s * 0.55, 0, TAU);
        ctx.fill();
        ctx.stroke();
      } else if (z.fx === 'crate') {
        // Kiste schwebt am Fallschirm herab
        const cy = ty - (1 - k) * s * 6;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2;
        ctx.fillStyle = '#e8eef4';
        ctx.beginPath();
        ctx.arc(tx, cy - s * 1.4, s * 0.9, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx - s * 0.9, cy - s * 1.4);
        ctx.lineTo(tx - s * 0.35, cy - s * 0.4);
        ctx.moveTo(tx + s * 0.9, cy - s * 1.4);
        ctx.lineTo(tx + s * 0.35, cy - s * 0.4);
        ctx.stroke();
        ctx.fillStyle = '#b07a3e';
        ctx.fillRect(tx - s * 0.45, cy - s * 0.45, s * 0.9, s * 0.9);
        ctx.strokeRect(tx - s * 0.45, cy - s * 0.45, s * 0.9, s * 0.9);
      } else if (z.fx === 'storm') {
        ctx.fillStyle = 'rgba(60,60,80,0.55)';
        ctx.beginPath();
        ctx.ellipse(tx, ty - s * 3, z.r * s, s * 0.9, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = ZONE_COLORS[z.fx] || '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(tx, ty, s * 0.3 * (1 + Math.sin(t * 20) * 0.2), 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /** Trümmer für zerstörte Kronentürme (sie fehlen im Snapshot). */
  drawRubble(ctx, list, towerRules) {
    const view = this.game.view;
    for (const slot of TOWER_SLOTS) {
      const alive = list.some((v) => v.kind === 'tower' && v.owner === slot.side && Math.abs(v.x - slot.x) < 0.2 && Math.abs(v.y - slot.y) < 0.2);
      if (alive) continue;
      const size = towerRules?.[slot.key]?.size ?? (slot.key === 'king' ? 4 : 3);
      const [x, y] = view.toScreen(slot.x, slot.y);
      drawTower(ctx, { x, y, U: (size / 2) * view.s, destroyed: true, team: slot.side === this.game.side ? 'blue' : 'red' });
    }
  }

  // ───────────── Einheiten ─────────────
  drawEntities(ctx, list, t, quality) {
    const view = this.game.view;
    const s = view.s;
    const mySide = this.game.side;
    const dpr = this.game.dpr;
    // Weiche Bodenschatten (gecacht je Größe), nach unten rechts versetzt (Licht von oben links);
    // Bodeneinheiten tragen darin einen feinen Fußring in Teamfarbe.
    const [ox, oy] = LIGHT.shadowOffset;
    for (const v of list) {
      if (v.kind === 'tower') continue;
      const [x, y] = view.toScreen(v.x, v.y);
      const r = v.kind === 'building' ? v.half * s * 1.05 : v.radius * s * (v.flying ? 0.8 : 1.1);
      const ring = v.kind === 'unit' && !v.flying && !(v.flags & EF.UNDER) ? (v.owner === mySide ? TEAM.blue.main : TEAM.red.main) : null;
      const img = softShadow(r * dpr, ring);
      const w = img.width / dpr;
      const h = img.height / dpr;
      const fy = v.kind === 'building' ? v.half * s * 0.3 : s * 0.05;
      if (v.flying) ctx.globalAlpha = 0.6;
      ctx.drawImage(img, x - w / 2 + r * ox, y + fy - h / 2 + r * oy, w, h);
      if (v.flying) ctx.globalAlpha = 1;
    }
    const ground = [];
    const air = [];
    for (const v of list) {
      const [x, y] = view.toScreen(v.x, v.y);
      v.sx = x;
      v.sy = y;
      (v.flying ? air : ground).push(v);
    }
    ground.sort((a, b) => a.sy - b.sy);
    air.sort((a, b) => a.sy - b.sy);
    for (const v of ground) this.drawOne(ctx, v, t, quality);
    for (const v of air) this.drawOne(ctx, v, t, quality);
    for (const v of ground) this.drawStatus(ctx, v, t);
    for (const v of air) this.drawStatus(ctx, v, t);
    for (const v of list) this.drawBar(ctx, v);
  }

  drawOne(ctx, v, t, quality) {
    const view = this.game.view;
    const s = view.s;
    const team = v.owner === this.game.side ? 'blue' : 'red';
    const f = v.flags;
    let aim = null;
    if (v.targetV && v.targetV.sx != null) {
      const ty = v.targetV.sy - (v.targetV.flying ? s * 1.1 : 0);
      aim = Math.atan2(ty - v.sy, v.targetV.sx - v.sx);
    }
    if (v.kind === 'tower') {
      drawTower(ctx, { x: v.sx, y: v.sy, U: v.half * s, t, king: v.king, active: !!(f & EF.ACTIVE), team, hurt: v.hurt, atk: v.atk, aim, quality });
      return;
    }
    // Unter der Erde (Mineur, Bohrer, Mächtiger Mineur): nur ein wandernder Erdhügel
    if (f & EF.UNDER) {
      drawMound(ctx, v.sx, v.sy, s * Math.max(0.45, v.radius), t + v.seed, team);
      return;
    }
    let alpha = f & EF.CLOAK ? 0.3 : f & EF.DEPLOY ? 0.65 : 1;
    if (f & EF.GHOST) alpha = Math.min(alpha, 0.55);
    if (f & EF.CLONE) alpha = Math.min(alpha, 0.7);
    const spawnK = Math.min(1, (t - v.born) / 0.28);
    const label = v.info?.label;
    if (v.kind === 'building') {
      const squash = spawnK < 1 ? 1 - spawnK : 0;
      drawBuilding(ctx, v.look, { x: v.sx, y: v.sy + v.half * s * 0.35, U: v.half * s * 0.95, t, atk: v.atk, hurt: v.hurt, team, aim, aux: v.aux, alpha, evo: v.evo, quality, squash, label, dpr: this.game.dpr });
      return;
    }
    // Sprung/Wurf: Bogenflug aus dem lp-/th-Ereignis, sonst kleines Hüpfen
    let hop = 0;
    if (v.arc) {
      const k = (performance.now() / 1000 - v.arc.t0) / v.arc.dur;
      if (k >= 0 && k <= 1) hop = Math.sin(k * Math.PI) * v.arc.h * s;
      else if (k > 1) v.arc = null;
    }
    if (!hop && f & EF.JUMP) hop = s * 0.9 * Math.abs(Math.sin(t * 6));
    const lift = (v.flying ? s * 1.1 : 0) + hop + (spawnK < 1 ? (1 - spawnK) * (1 - spawnK) * s * 3 : 0);
    const landK = t - v.born - 0.28;
    const squash = landK > 0 && landK < 0.2 ? Math.sin((landK / 0.2) * Math.PI) * 0.6 : 0;
    drawUnit(ctx, v.look, {
      x: v.sx,
      y: v.sy,
      U: v.U,
      fx: v.face,
      t: t + v.seed,
      walk: v.moving && !(f & EF.STUN),
      atk: v.atk,
      hurt: v.hurt,
      team,
      evo: v.evo,
      lift,
      alpha,
      mood: f & EF.STUN ? 'stun' : null,
      seed: v.seed,
      quality,
      squash,
      label,
      back: !!v.back,
      dpr: this.game.dpr,
    });
    if (f & EF.CLONE && quality > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#5ecbff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy - lift - v.U * 0.6, v.U * 0.85, v.U * 1.0, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (f & EF.CHARGE && quality > 0 && Math.random() < 0.3) this.game.fx.deployDust(v.x, v.y, 0.2);
    if (v.evo && quality > 1 && Math.random() < 0.06) this.game.fx.sparkle(v.x, v.y, v.flying ? 1.1 : 0.4, v.look.accent || '#d7b5ff');
  }

  drawStatus(ctx, v, t) {
    if (v.kind === 'tower') return;
    const s = this.game.view.s;
    const f = v.flags;
    const top = v.sy - (v.flying ? s * 1.1 : 0) - (v.kind === 'building' ? v.half * s * 1.6 : v.U * 1.75);
    if (f & EF.STUN) {
      if (v.ice) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#bff4ff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const w = (v.kind === 'building' ? v.half * 2 : v.radius * 2.6) * s;
        ctx.beginPath();
        ctx.roundRect(v.sx - w / 2, top + s * 0.1, w, v.sy - top, s * 0.15);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        for (let i = 0; i < 3; i++) {
          const a = t * 5 + (i * TAU) / 3;
          const x = v.sx + Math.cos(a) * s * 0.4;
          const y = top - s * 0.05 + Math.sin(a) * s * 0.12;
          ctx.fillStyle = '#ffe14d';
          ctx.strokeStyle = OUTLINE;
          ctx.lineWidth = 1.2;
          starPath(ctx, x, y, s * 0.13);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (f & EF.RAGE) {
      ctx.save();
      ctx.globalAlpha = 0.25 + Math.sin(t * 10) * 0.1;
      ctx.fillStyle = '#d23cf0';
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy - v.U * 0.6 - (v.flying ? s * 1.1 : 0), v.U * 0.9, v.U * 1.0, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    if (f & EF.SLOW && !(f & EF.STUN)) {
      ctx.fillStyle = '#7fb8ff';
      for (let i = 0; i < 2; i++) {
        const k = (t * 1.5 + i * 0.5) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.arc(v.sx + (i ? 1 : -1) * s * 0.25, top + k * s * 0.6, s * 0.08, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (f & EF.REFLECT) {
      ctx.save();
      ctx.globalAlpha = 0.45 + Math.sin(t * 12) * 0.15;
      ctx.strokeStyle = '#e8fbff';
      ctx.fillStyle = 'rgba(190, 240, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy - v.U * 0.7, v.U * 1.05, v.U * 1.15, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (f & EF.CURSE) {
      // Fluch: grüner Totenkopf-Wirbel über dem Kopf
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + (i * TAU) / 3;
        ctx.fillStyle = '#7cc36b';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(v.sx + Math.cos(a) * s * 0.35, top - s * 0.15 + Math.sin(a) * s * 0.1, s * 0.09, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (f & EF.ROOT) {
      // Ranken um die Füße
      ctx.save();
      ctx.strokeStyle = '#3f7f2e';
      ctx.lineWidth = Math.max(2, s * 0.1);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + t;
        ctx.beginPath();
        ctx.moveTo(v.sx + Math.cos(a) * s * 0.5, v.sy + Math.sin(a) * s * 0.2);
        ctx.quadraticCurveTo(v.sx + Math.cos(a + 0.8) * s * 0.2, v.sy - s * 0.6, v.sx + Math.cos(a + 1.6) * s * 0.35, v.sy - s * 1.0);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (f & EF.ENCHANT) {
      // Runen-Verzauberung: goldener Kreis am Boden
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(t * 6) * 0.15;
      ctx.strokeStyle = '#ffd54a';
      ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.setLineDash([s * 0.15, s * 0.1]);
      ctx.lineDashOffset = -t * s;
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy, s * 0.7, s * 0.3, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    if (f & EF.BUFF) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(t * 8) * 0.1;
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy - v.U * 0.6, v.U * 1.0, v.U * 1.05, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawBar(ctx, v) {
    const s = this.game.view.s;
    const damaged = v.hp < v.maxHp - 0.5;
    const special = v.cls === 'champion' || v.cls === 'hero';
    // Einheiten: nur wenn beschädigt (Champions/Helden/Evos behalten ihren Stern)
    if (v.kind === 'unit' && !damaged && !special && !v.evo) return;
    const mine = v.owner === this.game.side;
    const team = mine ? TEAM.blue : TEAM.red;
    let w;
    let h;
    let y;
    if (v.kind === 'tower') {
      // Turm-LP als kontrastreiche Pill mit tabellarischer Zahl (≥ 12 px)
      h = Math.max(16, s * 0.52);
      w = Math.max(h * 3.4, v.half * s * 1.6);
      y = v.sy + v.half * s * 1.02;
    } else if (v.kind === 'building') {
      w = Math.max(28, v.half * s * 1.4);
      h = Math.max(6, s * 0.24);
      y = v.sy - v.half * s * 1.9 - h;
    } else {
      w = Math.max(28, Math.min(60, v.U * 1.7));
      h = Math.max(6, s * 0.22);
      y = v.sy - (v.flying ? s * 1.1 : 0) - v.U * 1.9 - h;
    }
    const x = v.sx - w / 2;
    const k = Math.max(0, Math.min(1, v.hpDisp / v.maxHp));
    const kt = Math.max(k, Math.min(1, (v.trail ?? v.hp) / v.maxHp));
    const r = h / 2;
    ctx.fillStyle = '#1a1433';
    rrect(ctx, x, y, w, h, r);
    ctx.fill();
    const iw = w - 4;
    const ih = h - 4;
    // Nachlauf-Segment (verlorene LP laufen sanft ab)
    if (kt > k) {
      ctx.fillStyle = '#fff1c2';
      rrect(ctx, x + 2, y + 2, Math.max(ih, iw * kt), ih, ih / 2);
      ctx.fill();
    }
    if (k > 0) {
      ctx.fillStyle = team.main;
      rrect(ctx, x + 2, y + 2, Math.max(ih, iw * k), ih, ih / 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 2 + ih / 2, y + 2.5, Math.max(0, iw * k - ih), Math.max(1, ih * 0.25));
    }
    // Treffer-Flash
    if (v.hurt > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.55 * v.hurt})`;
      rrect(ctx, x, y, w, h, r);
      ctx.fill();
    }
    if (v.shield > 0) {
      ctx.fillStyle = '#e8eef4';
      ctx.fillRect(x + 2, y - 3, iw * Math.min(1, v.shield / (v.maxShield || v.shield)), 3);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    rrect(ctx, x, y, w, h, r);
    ctx.stroke();
    if (v.kind === 'tower') {
      tnum(ctx, String(Math.ceil(v.hp)), v.sx, y + h / 2 + 1, Math.max(12, h * 0.8), '#ffffff', 'center', 3);
    } else if (special || v.evo) {
      const cx = x - h * 0.3;
      const cy = y + h / 2;
      ctx.fillStyle = v.evo ? '#b98cff' : v.cls === 'hero' ? '#ff7a5c' : '#ffd84d';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      starPath(ctx, cx, cy, Math.max(6, h * 1.1));
      ctx.fill();
      ctx.stroke();
    }
  }

  // ───────────── Projektile ─────────────
  drawProjectiles(ctx, list, t) {
    const view = this.game.view;
    const s = view.s;
    for (const p of list) {
      const [x, y0] = view.toScreen(p.x, p.y);
      let z = p.kind === 'roll' ? 0.35 : 0.6;
      if (ARC_KINDS.has(p.kind)) {
        const total = Math.hypot(p.tx - p.sx, p.ty - p.sy) || 1;
        const k = 1 - Math.hypot(p.tx - p.x, p.ty - p.y) / total;
        z = 0.3 + Math.sin(Math.max(0, Math.min(1, k)) * Math.PI) * Math.min(6, total * 0.5);
      } else if (p.fromAir) z = 1.1;
      const y = y0 - z * s;
      const [tx, ty] = view.toScreen(p.tx, p.ty);
      const ang = Math.atan2(ty - y0, tx - x);
      ctx.save();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      switch (p.kind) {
        case 'arrow':
        case 'bolt':
          drawArrow(ctx, x, y, ang, s * (p.kind === 'bolt' ? 0.8 : 0.65), p.kind === 'bolt' ? '#9aa3ad' : '#8a5a32');
          break;
        case 'dart':
          drawArrow(ctx, x, y, ang, s * 0.45, '#6ab04c');
          break;
        case 'spear':
          drawArrow(ctx, x, y, ang, s * 1.0, '#8a5a32');
          break;
        case 'axe': {
          ctx.translate(x, y);
          ctx.rotate(t * 18);
          ctx.fillStyle = '#6b4e36';
          ctx.fillRect(-s * 0.06, -s * 0.4, s * 0.12, s * 0.8);
          ctx.strokeRect(-s * 0.06, -s * 0.4, s * 0.12, s * 0.8);
          ctx.fillStyle = '#c9d2dc';
          ctx.beginPath();
          ctx.moveTo(0, -s * 0.35);
          ctx.quadraticCurveTo(s * 0.45, -s * 0.3, s * 0.35, s * 0.05);
          ctx.lineTo(0, -s * 0.05);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }
        case 'bullet':
        case 'pellet':
        case 'pebble': {
          const r = s * (p.kind === 'pebble' ? 0.13 : p.kind === 'pellet' ? 0.08 : 0.1);
          ctx.fillStyle = p.kind === 'pebble' ? '#8d8f94' : '#3b3b3b';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          if (p.kind !== 'pellet') ctx.stroke();
          if (p.kind === 'bullet') {
            ctx.strokeStyle = 'rgba(255,240,180,0.7)';
            ctx.lineWidth = s * 0.06;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - Math.cos(ang) * s * 0.5, y - Math.sin(ang) * s * 0.5);
            ctx.stroke();
          }
          break;
        }
        case 'snipe': {
          ctx.strokeStyle = 'rgba(255,230,120,0.9)';
          ctx.lineWidth = s * 0.12;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(ang) * s * 1.6, y - Math.sin(ang) * s * 1.6);
          ctx.stroke();
          break;
        }
        case 'bola': {
          const a = t * 16;
          const dx = Math.cos(a) * s * 0.28;
          const dy = Math.sin(a) * s * 0.28;
          ctx.strokeStyle = '#6b4e36';
          ctx.beginPath();
          ctx.moveTo(x - dx, y - dy);
          ctx.lineTo(x + dx, y + dy);
          ctx.stroke();
          ctx.strokeStyle = OUTLINE;
          ctx.fillStyle = '#9aa3ad';
          for (const k of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(x + dx * k, y + dy * k, s * 0.1, 0, TAU);
            ctx.fill();
            ctx.stroke();
          }
          break;
        }
        case 'spark':
          ctx.fillStyle = '#ffe066';
          starPath(ctx, x, y, s * 0.2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'spirit': {
          ctx.fillStyle = 'rgba(215,181,255,0.5)';
          ctx.beginPath();
          ctx.arc(x, y, s * 0.35, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#b98cff';
          ctx.beginPath();
          ctx.arc(x, y, s * 0.2, 0, TAU);
          ctx.fill();
          ctx.stroke();
          break;
        }
        case 'dynamite':
        case 'rocket': {
          ctx.translate(x, y);
          ctx.rotate(p.kind === 'dynamite' ? t * 10 : ang);
          ctx.fillStyle = p.kind === 'dynamite' ? '#d23c3c' : '#c0392b';
          ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.2);
          ctx.strokeRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.2);
          ctx.fillStyle = '#ffcf3d';
          ctx.beginPath();
          ctx.arc(-s * 0.36, 0, s * 0.08 * (1 + Math.sin(t * 30) * 0.3), 0, TAU);
          ctx.fill();
          break;
        }
        case 'roll': {
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(x, y0, s * 0.42, s * 0.17, 0, 0, TAU);
          ctx.fill();
          ctx.translate(x, y);
          ctx.rotate(t * 10);
          ctx.fillStyle = '#7d8aa8';
          ctx.beginPath();
          ctx.arc(0, 0, s * 0.42, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#5d6a88';
          ctx.beginPath();
          ctx.arc(s * 0.15, -s * 0.1, s * 0.09, 0, TAU);
          ctx.fill();
          break;
        }
        case 'fireball':
        case 'fire':
        case 'firework': {
          const col = p.kind === 'firework' ? '#ff5a7a' : '#ff8a3d';
          ctx.fillStyle = 'rgba(255,200,80,0.45)';
          ctx.beginPath();
          ctx.arc(x - Math.cos(ang) * s * 0.3, y - Math.sin(ang) * s * 0.3, s * 0.35, 0, TAU);
          ctx.fill();
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, s * (p.kind === 'fire' ? 0.28 : 0.24), 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffe066';
          ctx.beginPath();
          ctx.arc(x, y, s * 0.1, 0, TAU);
          ctx.fill();
          if (Math.random() < 0.5) this.game.fx.add({ x: p.x, y: p.y, z: z, life: 0.3, size: 0.08, color: '#ffcf3d', g: 0, drag: 1 });
          break;
        }
        case 'magic':
        case 'ice':
        case 'spit': {
          const col = p.kind === 'magic' ? '#c77dff' : p.kind === 'ice' ? '#aee9ff' : '#8be04e';
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x, y, s * 0.2, 0, TAU);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(x - s * 0.06, y - s * 0.06, s * 0.07, 0, TAU);
          ctx.fill();
          break;
        }
        case 'bomb':
        case 'cannonball':
        case 'boulder': {
          const r = s * (p.kind === 'boulder' ? 0.42 : 0.2);
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(x, y0, r, r * 0.4, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = p.kind === 'boulder' ? '#8d8f94' : '#2b2b35';
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fill();
          ctx.stroke();
          if (p.kind === 'bomb') {
            ctx.fillStyle = '#ffcf3d';
            ctx.beginPath();
            ctx.arc(x + r * 0.6, y - r * 0.9, r * 0.35 * (1 + Math.sin(t * 30) * 0.3), 0, TAU);
            ctx.fill();
          }
          break;
        }
        default:
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, s * 0.15, 0, TAU);
          ctx.fill();
      }
      ctx.restore();
    }
  }

  drawBeams(ctx, list, t) {
    const s = this.game.view.s;
    for (const v of list) {
      if (!v.beam || !(v.flags & EF.ATTACK) || !v.targetV) continue;
      const tv = v.targetV;
      const x0 = v.sx;
      const y0 = v.sy - v.half * s * 1.9;
      const x1 = tv.sx;
      const y1 = tv.sy - (tv.flying ? s * 1.1 : 0) - (tv.kind === 'unit' ? tv.U * 0.6 : s * 0.8);
      const stage = v.aux || 0;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = stage >= 2 ? 'rgba(255,240,160,0.5)' : 'rgba(255,120,40,0.45)';
      ctx.lineWidth = s * (0.25 + stage * 0.18) + Math.sin(t * 40) * 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.strokeStyle = stage >= 2 ? '#fffbe0' : '#ffcf6b';
      ctx.lineWidth = s * (0.08 + stage * 0.06);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ───────────── Emotes & Hinweise ─────────────
  /** Emote-Sprechblase NEBEN dem Burgturm (Gegner rechts oben, eigene links unten), nie über den LP (B-09). */
  drawEmotes(ctx, emotes, now) {
    const view = this.game.view;
    const s = view.s;
    for (const e of emotes) {
      const age = now - e.at;
      if (age > 2.6) continue;
      const emo = EMOTES[e.index];
      if (!emo) continue;
      const king = TOWER_SLOTS.find((k) => k.side === e.owner && k.key === 'king');
      const [kx, ky] = view.toScreen(king.x, king.y);
      const mine = e.owner === this.game.side;
      const pop = Math.min(1, age / 0.18);
      const scale = pop < 1 ? 0.5 + pop * 0.6 : 1.1 - Math.min(0.1, (age - 0.18) * 0.5);
      const fade = age > 2.2 ? 1 - (age - 2.2) / 0.4 : 1;
      const R = s * 1.0 * scale;
      const fs = Math.max(12, Math.round(s * 0.55 * scale));
      ctx.font = `${fs}px ${FONT}`;
      const tw = ctx.measureText(emo.text).width;
      const bw = Math.max(R * 2.4, tw + s * 0.6);
      const bh = R * 2 + s * 0.8 * scale;
      const dir = mine ? -1 : 1;
      const A = view.rect(0, 0, ARENA_W, ARENA_H);
      let cx = kx + dir * (s * 2.3 + bw / 2);
      cx = Math.max(A.x + bw / 2 + 4, Math.min(A.x + A.w - bw / 2 - 4, cx));
      const cy = Math.max(A.y + bh / 2 + 2, Math.min(A.y + A.h - bh / 2 - 2, ky - s * 0.9));
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      rrect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, s * 0.4);
      ctx.fill();
      ctx.stroke();
      // Zipfel zeigt zum Turm
      const tx = cx - dir * (bw / 2);
      ctx.beginPath();
      ctx.moveTo(tx, cy - s * 0.3);
      ctx.lineTo(tx - dir * s * 0.45, cy + s * 0.1);
      ctx.lineTo(tx, cy + s * 0.3);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(tx - (dir > 0 ? 0 : 3), cy - s * 0.3 + 2, 3, s * 0.6 - 4);
      drawEmoteFace(ctx, emo.face, cx, cy - bh / 2 + R * 0.95 + s * 0.1, R * 0.85, now);
      ctext(ctx, emo.text, cx, cy + bh / 2 - s * 0.45, fs, mine ? TEAM.blue.dark : TEAM.red.dark, 'center', 0);
      ctx.restore();
    }
  }

  drawPlayedMarkers(ctx, markers, now, artFor) {
    const view = this.game.view;
    const s = view.s;
    for (const m of markers) {
      const age = now - m.at;
      if (age > 1.3) continue;
      const [x, y] = view.toScreen(m.x, m.y);
      const img = artFor(m.cardId, m.evo);
      const w = s * 1.6;
      const h = w * 1.25;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1.3 - age) / 0.4);
      const yy = y - s * 1.2 - h - Math.min(age, 0.3) * s;
      ctx.fillStyle = m.owner === this.game.side ? TEAM.blue.main : TEAM.red.main;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x - w / 2 - 3, yy - 3, w + 6, h + 6, 6);
      ctx.fill();
      ctx.stroke();
      if (img) ctx.drawImage(img, x - w / 2, yy, w, h);
      ctx.restore();
    }
  }

  drawGhost(ctx, g, t) {
    const view = this.game.view;
    const s = view.s;
    const [x, y] = view.toScreen(g.x, g.y);
    if (!g.valid && g.hint) {
      // Klares Feedback direkt am Finger
      ctx.save();
      ctx.font = `14px ${FONT}`;
      const w = ctx.measureText('Hier nicht möglich').width + 20;
      rrect(ctx, x - w / 2, y - s * 2.6 - 26, w, 26, 13);
      ctx.fillStyle = '#c42233';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctext(ctx, 'Hier nicht möglich', x, y - s * 2.6 - 12, 14, '#ffffff', 'center', 3);
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = g.valid ? 0.75 : 0.45;
    if (g.kind === 'spell') {
      ctx.fillStyle = g.valid ? 'rgba(255,255,255,0.18)' : 'rgba(255,60,70,0.2)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -t * 20;
      const r = Math.max(0.8, g.radius) * s;
      if (g.roll) {
        const len = g.roll.length * s;
        const w = g.roll.width * s;
        const dirUp = g.dir === -1 ? !view.flip : view.flip;
        ctx.beginPath();
        if (view.mode === 'portrait') ctx.rect(x - w / 2, dirUp ? y - len : y, w, len);
        else ctx.rect(dirUp ? x - len : x, y - w / 2, len, w);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
      ctx.setLineDash([]);
      drawSpellIcon(ctx, g.look, x, y, s * 0.6, 0, g.label);
    } else if (g.kind === 'building') {
      const h = g.half * s;
      ctx.fillStyle = g.valid ? 'rgba(255,255,255,0.3)' : 'rgba(255,60,70,0.35)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(x - h, y - h, h * 2, h * 2);
      ctx.strokeRect(x - h, y - h, h * 2, h * 2);
      drawBuilding(ctx, g.look, { x, y: y + h * 0.35, U: h * 0.95, t, team: 'blue', quality: 1, label: g.label });
    } else {
      if (g.range) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(x, y, g.range * s, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      for (const [ox, oy] of g.offsets) {
        const [px, py] = view.toScreen(g.x + ox, g.y + oy);
        drawUnit(ctx, g.look, { x: px, y: py, U: g.U, fx: 1, t, team: g.valid ? 'blue' : 'red', lift: g.flying ? s * 1.1 : 0, quality: 1, label: g.label });
      }
    }
    ctx.restore();
  }
}

export const ZONE_COLORS = {
  poison: '#7ccf3a',
  heal: '#ffd966',
  rage: '#c25bd6',
  rageTrail: '#c25bd6',
  grave: '#7d8ca3',
  burn: '#ff8a3d',
  frost: '#aee9ff',
  snow: '#e8f4ff',
  shock: '#7fe9ff',
  sparks: '#ffe066',
  fire: '#ff7a2f',
  firewhirl: '#ff8a3d',
  arrows: '#d4a15a',
  comet: '#ff4f4f',
  storm: '#ffe14d',
  barrel: '#8b5a2b',
  quake: '#a0703a',
  tornado: '#9fb3c8',
  curse: '#7cc36b',
  clone: '#5ecbff',
  crate: '#3a7bd5',
  vines: '#4f9a3a',
  void: '#7a3fc0',
  time: '#d2b4ff',
};

/** Erdhügel einer grabenden Einheit (Teamfarbe am Rand). */
function drawMound(ctx, x, y, r, t, team) {
  ctx.save();
  ctx.fillStyle = '#7a5236';
  ctx.strokeStyle = team === 'blue' ? TEAM.blue.main : TEAM.red.main;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.1, r * 0.55, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a37650';
  for (let i = 0; i < 3; i++) {
    const a = t * 4 + i * 2.1;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.8, y - Math.abs(Math.sin(a)) * r * 0.5, r * 0.14, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawArrow(ctx, x, y, ang, len, col = '#8a5a32') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = Math.max(2.5, len * 0.12);
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2, 0);
  ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(1.2, len * 0.06);
  ctx.stroke();
  ctx.fillStyle = '#e8eef4';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(len / 2 + len * 0.2, 0);
  ctx.lineTo(len / 2 - len * 0.05, -len * 0.12);
  ctx.lineTo(len / 2 - len * 0.05, len * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

let hatchCache = null;
/** Rote Schraffur für ungültige Platzierungsflächen. */
function hatchRed(c) {
  if (hatchCache) return hatchCache;
  const p = document.createElement('canvas');
  p.width = p.height = 12;
  const x = p.getContext('2d');
  x.strokeStyle = 'rgba(255, 70, 85, 0.5)';
  x.lineWidth = 3;
  x.beginPath();
  x.moveTo(-3, 15);
  x.lineTo(15, -3);
  x.moveTo(-3, 3);
  x.lineTo(3, -3);
  x.moveTo(9, 15);
  x.lineTo(15, 9);
  x.stroke();
  hatchCache = c.createPattern(p, 'repeat');
  return hatchCache;
}
