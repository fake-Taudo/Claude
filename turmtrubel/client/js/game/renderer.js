// Zeichnet Arena, Zauberzonen, Einheiten, Projektile, Effekte und Platzierungsvorschau.
import { ARENA_W, ARENA_H, RIVER_Y0, RIVER_Y1, BRIDGES, TOWER_SLOTS, placementRects } from '/shared/arena.js';
import { EF, EMOTES } from '/shared/protocol.js';
import { drawUnit, drawBuilding, drawTower, drawEmoteFace, drawSpellIcon, TEAM, OUTLINE, shade } from './sprites.js';
import { FONT, text as ctext, tnum, rr as rrect } from './canvastext.js';
import { softShadow, softGlow } from '../design/light.js';
import { LIGHT } from '../design/tokens.js';

const TAU = Math.PI * 2;
// Rollende Zauber (Baumstamm, Barbarenfass) und im Bogen fliegende Geschosse
const ROLLING = new Set(['roll', 'log', 'barrelRoll']);
const ARC_KINDS = new Set(['boulder', 'bomb', 'dynamite', 'rocket']);
const EVO_SPARK = { count: 1, scaleCount: false, shape: 'star', colors: ['team', '#ffffff'], spread: 0.35, up: [0.6, 1.3], drag: 0.3, life: [0.5, 0.8], size: [0.18, 0.26], sizeEnd: 0.03, alpha: [1, 0], blend: 'add', prio: 0 };
const FUSE_SPARK = { count: 1, scaleCount: false, shape: 'dot', colors: ['#ffcf3d', '#fff3b0'], speed: [0.3, 1], up: [0.3, 1], life: [0.15, 0.3], size: [0.12, 0.18], sizeEnd: 0.02, alpha: [1, 0], blend: 'add', prio: 0 };

/** Hex-Farbe mit Deckkraft als rgba(). */
function hexA(hex, a) {
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Flughöhe eines Projektils in Feldern (Bogenflug für Mörser, Bomben, Raketen …). */
export function projZ(p) {
  if (ARC_KINDS.has(p.kind)) {
    const total = Math.hypot(p.tx - p.sx, p.ty - p.sy) || 1;
    const k = 1 - Math.hypot(p.tx - p.x, p.ty - p.y) / total;
    return 0.3 + Math.sin(Math.max(0, Math.min(1, k)) * Math.PI) * Math.min(6, total * 0.5);
  }
  if (p.kind === 'roll') return 0.35;
  return p.fromAir ? 1.1 : 0.6;
}

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
    // Sichtbare Hintergrund-Ebene (#bg-canvas) unter dem Spiel-Canvas; Fallback: Offscreen-Canvas
    this.bgLayer = typeof document !== 'undefined' ? document.getElementById('bg-canvas') : null;
    this.bg = this.bgLayer || document.createElement('canvas');
    this.overlay = document.createElement('canvas');
    this.overlayKey = '';
    this.bgKey = '';
  }

  // ───────────── Hintergrund ─────────────
  renderBackground(cw, ch, dpr) {
    const view = this.game.view;
    const key = [cw, ch, dpr, view.mode, view.s, view.ox, view.oy, this.game.hud?.version || 0, this.bgLayer ? 1 : 0].join('|');
    if (key === this.bgKey) return;
    this.bgKey = key;
    const bg = this.bg;
    bg.width = Math.round(cw * dpr);
    bg.height = Math.round(ch * dpr);
    if (this.bgLayer) {
      bg.style.width = cw + 'px';
      bg.style.height = ch + 'px';
    }
    const c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = view.s;
    const A = view.rect(0, 0, ARENA_W, ARENA_H);
    const mySide = this.game.side;
    paintSurroundings(c, cw, ch, A, s);
    // Ab hier in Weltkoordinaten (1 = ein Feld): gleiche Zeichnung für hochkant und quer
    const [x0, y0] = view.toScreen(0, 0);
    const [x1, y1] = view.toScreen(1, 0);
    const [x2, y2] = view.toScreen(0, 1);
    c.setTransform(dpr * (x1 - x0), dpr * (y1 - y0), dpr * (x2 - x0), dpr * (y2 - y0), dpr * x0, dpr * y0);
    const px = 1 / s; // ein CSS-Pixel in Feldern
    paintArena(c, px, mySide);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Licht von oben links über die ganze Arena + Vignette
    const lg = c.createLinearGradient(A.x, A.y, A.x + A.w, A.y + A.h);
    lg.addColorStop(0, 'rgba(255,248,220,0.10)');
    lg.addColorStop(0.5, 'rgba(255,248,220,0)');
    lg.addColorStop(1, 'rgba(10,20,40,0.12)');
    c.fillStyle = lg;
    c.fillRect(A.x, A.y, A.w, A.h);
    const vg = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.hypot(cw, ch) * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(6,10,24,0.38)');
    c.fillStyle = vg;
    c.fillRect(0, 0, cw, ch);
    // Statische HUD-Teile (Panels, Mulden) nur in die sichtbare Hintergrund-Ebene
    if (this.bgLayer) this.game.hud?.paintStatic(c);
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
  /** Kleines gecachtes Sprite (Gerätepixel w×h), gezeichnet über draw(ctx, w, h). */
  cached(key, w, h, draw) {
    this.spriteMap ||= new Map();
    let cv = this.spriteMap.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(w));
    cv.height = Math.max(1, Math.ceil(h));
    draw(cv.getContext('2d'), cv.width, cv.height);
    this.spriteMap.set(key, cv);
    if (this.spriteMap.size > 400) this.spriteMap.delete(this.spriteMap.keys().next().value);
    return cv;
  }

  /** Zonen-Scheibe: weiche Fläche mit leuchtendem Rand in der Effektfarbe (gecacht je Farbe). */
  zoneDisc(col) {
    return this.cached('zd|' + col, 256, 256, (c, W) => {
      const r = W / 2;
      const g = c.createRadialGradient(r, r, 0, r, r, r);
      g.addColorStop(0, hexA(col, 0.16));
      g.addColorStop(0.72, hexA(col, 0.24));
      g.addColorStop(0.93, hexA(col, 0.55));
      g.addColorStop(1, hexA(col, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, W);
    });
  }

  drawZonesGround(ctx, zones, t) {
    const view = this.game.view;
    const s = view.s;
    for (const z of zones) {
      if (!z.active || ROLLING.has(z.fx)) continue;
      const [x, y] = view.toScreen(z.x, z.y);
      const r = z.r * s;
      const col = ZONE_COLORS[z.fx] || '#ffffff';
      const fade = z.fade ?? 1;
      const pulse = 1 + Math.sin(t * 4 + z.id) * 0.02;
      ctx.globalAlpha = fade;
      const disc = this.zoneDisc(col);
      ctx.drawImage(disc, x - r * pulse, y - r * pulse, r * 2 * pulse, r * 2 * pulse);
      // Teamfarbener Rand (Radius lesbar) + drehender Runenring in Effektfarbe
      ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.strokeStyle = z.owner === this.game.side ? TEAM.blue.main : TEAM.red.main;
      ctx.globalAlpha = 0.75 * fade;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.55 * fade;
      ctx.lineWidth = Math.max(1.2, s * 0.05);
      ctx.setLineDash([s * 0.18, s * 0.32]);
      ctx.lineDashOffset = -t * s * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.86, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
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
      drawTower(ctx, { x, y, U: (size / 2) * view.s, destroyed: true, team: slot.side === this.game.side ? 'blue' : 'red', dpr: this.game.spriteDpr });
    }
  }

  // ───────────── Einheiten ─────────────
  drawEntities(ctx, list, t, quality) {
    const view = this.game.view;
    const s = view.s;
    const mySide = this.game.side;
    const dpr = this.game.spriteDpr;
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
      // Champions und Helden: pulsierender Goldring am Boden
      if (v.cls === 'champion' || v.cls === 'hero') {
        const g = softGlow(v.cls === 'hero' ? '#ff9a7a' : '#ffd84d', r * 1.3 * dpr, 0.55);
        ctx.globalAlpha = 0.45 + Math.sin(t * 4 + v.seed) * 0.15;
        ctx.drawImage(g, x - r * 1.3, y - r * 0.6, r * 2.6, r * 1.2);
        ctx.globalAlpha = 1;
      }
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
  }

  /** LP-Balken und Abzeichen – nach den Effekten gezeichnet, damit sie lesbar bleiben. */
  drawBars(ctx, list) {
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
      // Schadenstufe aus den LP (≤ 66 % / ≤ 33 %), eigene Turmfiguren von hinten (nur hochkant)
      const stage = Math.max(v.stage || 0, v.hp <= v.maxHp * 0.33 ? 2 : v.hp <= v.maxHp * 0.66 ? 1 : 0);
      const back = v.owner === this.game.side && view.mode !== 'rotated';
      const active = !!(f & EF.ACTIVE);
      const top = drawTower(ctx, { x: v.sx, y: v.sy, U: v.half * s, t, king: v.king, active, team, hurt: v.hurt, atk: v.atk, aim, quality, dpr: this.game.spriteDpr, stage, back });
      // Schlafender König: schwebende „z“
      if (v.king && !active && top) {
        for (let i = 0; i < 2; i++) {
          const k = (t * 0.6 + i * 0.5) % 1;
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
          ctext(ctx, 'z', top[0] + s * (0.3 + k * 0.5), top[1] - k * s * 0.9, Math.round(s * (0.42 + i * 0.12)), '#ffffff', 'center', 2.5);
        }
        ctx.globalAlpha = 1;
      }
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
      drawBuilding(ctx, v.look, { x: v.sx, y: v.sy + v.half * s * 0.35, U: v.half * s * 0.95, t, atk: v.atk, hurt: v.hurt, team, aim, aux: v.aux, alpha, evo: v.evo, quality, squash, label, dpr: this.game.spriteDpr });
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
      dpr: this.game.spriteDpr,
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
    if (f & EF.CHARGE && quality > 0 && Math.random() < 0.3) this.game.fx.emit('unit.dash', { x: v.x, y: v.y });
    // Evo-Partikelhülle: einzelne Funken in der Akzentfarbe steigen auf
    if (v.evo && quality > 0 && Math.random() < 0.12) this.game.fx.burst(EVO_SPARK, { x: v.x, y: v.y, z: v.flying ? 1.1 : 0.2, k: 1, teamColor: v.look.accent || '#d7b5ff' });
  }

  /** Eisblock (facettierter Kristall), gecacht je Größe. */
  iceBlock(w, h, dpr) {
    const W = Math.round(w * dpr);
    const H = Math.round(h * dpr);
    return this.cached('ice|' + W + '|' + H, W + 4, H + 4, (c) => {
      c.translate(2, 2);
      const pts = [[0.12, 0.18], [0.45, 0.02], [0.86, 0.12], [0.98, 0.5], [0.9, 0.94], [0.5, 1], [0.08, 0.9], [0.02, 0.5]].map(([x, y]) => [x * W, y * H]);
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      const g = c.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(240,252,255,0.85)');
      g.addColorStop(0.5, 'rgba(160,226,255,0.6)');
      g.addColorStop(1, 'rgba(90,170,230,0.75)');
      c.fillStyle = g;
      c.fill();
      c.lineWidth = Math.max(1.5, W * 0.035);
      c.strokeStyle = '#2a6f9e';
      c.lineJoin = 'round';
      c.stroke();
      // Facetten und Glanz
      c.strokeStyle = 'rgba(255,255,255,0.75)';
      c.lineWidth = Math.max(1, W * 0.02);
      c.beginPath();
      c.moveTo(W * 0.45, H * 0.02);
      c.lineTo(W * 0.5, H * 0.45);
      c.lineTo(W * 0.98, H * 0.5);
      c.moveTo(W * 0.5, H * 0.45);
      c.lineTo(W * 0.08, H * 0.9);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.beginPath();
      c.moveTo(W * 0.18, H * 0.2);
      c.lineTo(W * 0.4, H * 0.1);
      c.lineTo(W * 0.3, H * 0.42);
      c.closePath();
      c.fill();
    });
  }

  /** Gelber Betäubungs-Stern mit Kontur, gecacht. */
  stunStar(px, dpr) {
    const R = Math.round(px * dpr);
    return this.cached('st|' + R, R * 2 + 4, R * 2 + 4, (c) => {
      c.fillStyle = '#ffe14d';
      c.strokeStyle = OUTLINE;
      c.lineWidth = Math.max(1, R * 0.18);
      c.lineJoin = 'round';
      starPath(c, R + 2, R + 2, R);
      c.fill();
      c.stroke();
    });
  }

  drawStatus(ctx, v, t) {
    if (v.kind === 'tower') return;
    const s = this.game.view.s;
    const dpr = this.game.spriteDpr;
    const f = v.flags;
    const lift = v.flying ? s * 1.1 : 0;
    const top = v.sy - lift - (v.kind === 'building' ? v.half * s * 1.6 : v.U * 1.75);
    const glow = (col, rx, ry, a) => {
      const g = softGlow(col, Math.max(rx, ry) * dpr, 0.3);
      ctx.globalAlpha = a;
      ctx.drawImage(g, v.sx - rx, v.sy - lift - v.U * 0.65 - ry, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
    };
    if (f & EF.RAGE) glow('#e07bff', v.U * 1.0, v.U * 1.15, 0.45 + Math.sin(t * 10) * 0.12);
    if (f & EF.BUFF) glow('#ffd84d', v.U * 1.0, v.U * 1.1, 0.35 + Math.sin(t * 8) * 0.1);
    if (f & EF.REFLECT) {
      glow('#bff4ff', v.U * 1.1, v.U * 1.2, 0.5 + Math.sin(t * 12) * 0.12);
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#e8fbff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(v.sx, v.sy - lift - v.U * 0.7, v.U * 1.05, v.U * 1.15, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (f & EF.STUN) {
      if (v.ice) {
        const w = (v.kind === 'building' ? v.half * 2.1 : v.radius * 2.8) * s;
        const h = v.sy - lift - top + s * 0.2;
        const img = this.iceBlock(w, h, dpr);
        ctx.globalAlpha = 0.92;
        ctx.drawImage(img, v.sx - w / 2 - 2 / dpr, top - s * 0.1 - 2 / dpr, img.width / dpr, img.height / dpr);
        ctx.globalAlpha = 1;
      } else {
        const star = this.stunStar(s * 0.14, dpr);
        const sw = star.width / dpr;
        for (let i = 0; i < 3; i++) {
          const a = t * 5 + (i * TAU) / 3;
          ctx.drawImage(star, v.sx + Math.cos(a) * s * 0.4 - sw / 2, top - s * 0.05 + Math.sin(a) * s * 0.12 - sw / 2, sw, sw);
        }
      }
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
    if (f & EF.CURSE) {
      // Fluch: grüner Wirbel über dem Kopf
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + (i * TAU) / 3;
        const g = softGlow('#7cc36b', s * 0.16 * dpr, 0.5);
        ctx.globalAlpha = 0.9;
        ctx.drawImage(g, v.sx + Math.cos(a) * s * 0.35 - s * 0.16, top - s * 0.15 + Math.sin(a) * s * 0.1 - s * 0.16, s * 0.32, s * 0.32);
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
  }

  /** Goldenes Kronen-Schild (Turm-Abzeichen), gecacht je Pixelhöhe. */
  crownBadge(h, dpr) {
    const key = Math.round(h * dpr);
    this.badges ||= new Map();
    let cv = this.badges.get('c' + key);
    if (cv) return cv;
    const H = key;
    const W = Math.round(H * 0.92);
    cv = document.createElement('canvas');
    cv.width = W + 4;
    cv.height = H + 4;
    const c = cv.getContext('2d');
    c.translate(2, 2);
    const path = () => {
      c.beginPath();
      c.moveTo(W * 0.06, H * 0.22);
      c.lineTo(W * 0.27, H * 0.04);
      c.lineTo(W * 0.4, H * 0.2);
      c.lineTo(W * 0.5, H * 0.02);
      c.lineTo(W * 0.6, H * 0.2);
      c.lineTo(W * 0.73, H * 0.04);
      c.lineTo(W * 0.94, H * 0.22);
      c.lineTo(W * 0.94, H * 0.64);
      c.quadraticCurveTo(W * 0.9, H * 0.9, W * 0.5, H * 0.98);
      c.quadraticCurveTo(W * 0.1, H * 0.9, W * 0.06, H * 0.64);
      c.closePath();
    };
    path();
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(0.45, '#ffcf33');
    g.addColorStop(1, '#c8860e');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = Math.max(1.5, H * 0.08);
    c.strokeStyle = OUTLINE;
    c.lineJoin = 'round';
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath();
    c.ellipse(W * 0.36, H * 0.42, W * 0.14, H * 0.1, -0.5, 0, TAU);
    c.fill();
    this.badges.set('c' + key, cv);
    return cv;
  }

  /** Level-Abzeichen einer Einheit: abgerundetes Quadrat in Teamfarbe (Farbenblind: Gegner als Schild). */
  unitBadge(team, label, h, dpr, ring, shield) {
    const key = [team, label, Math.round(h * dpr), ring || '', shield ? 1 : 0].join('|');
    this.badges ||= new Map();
    let cv = this.badges.get(key);
    if (cv) return cv;
    const H = Math.round(h * dpr);
    cv = document.createElement('canvas');
    cv.width = H + 4;
    cv.height = H + 4;
    const c = cv.getContext('2d');
    c.translate(2, 2);
    const T = team === 'red' ? TEAM.red : TEAM.blue;
    c.beginPath();
    if (shield) {
      c.moveTo(H * 0.08, H * 0.08);
      c.lineTo(H * 0.92, H * 0.08);
      c.lineTo(H * 0.92, H * 0.55);
      c.quadraticCurveTo(H * 0.88, H * 0.85, H * 0.5, H * 0.98);
      c.quadraticCurveTo(H * 0.12, H * 0.85, H * 0.08, H * 0.55);
      c.closePath();
    } else c.roundRect ? c.roundRect(H * 0.06, H * 0.06, H * 0.88, H * 0.88, H * 0.22) : c.rect(H * 0.06, H * 0.06, H * 0.88, H * 0.88);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, T.light);
    g.addColorStop(0.5, T.main);
    g.addColorStop(1, T.dark);
    c.fillStyle = g;
    c.fill();
    c.lineWidth = Math.max(1.5, H * 0.12);
    c.strokeStyle = ring || '#ffffff';
    c.stroke();
    c.lineWidth = Math.max(1, H * 0.05);
    c.strokeStyle = OUTLINE;
    c.stroke();
    const fs = Math.round(H * 0.62);
    c.font = `${fs}px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = Math.max(2, fs * 0.22);
    c.strokeStyle = OUTLINE;
    c.strokeText(label, H / 2, H * 0.53);
    c.fillStyle = '#ffffff';
    c.fillText(label, H / 2, H * 0.53);
    this.badges.set(key, cv);
    return cv;
  }

  drawBar(ctx, v) {
    const s = this.game.view.s;
    const dpr = this.game.spriteDpr;
    const damaged = v.hp < v.maxHp - 0.5;
    const special = v.cls === 'champion' || v.cls === 'hero';
    const mine = v.owner === this.game.side;
    const team = mine ? TEAM.blue : TEAM.red;
    const k = Math.max(0, Math.min(1, v.hpDisp / v.maxHp));
    const kt = Math.max(k, Math.min(1, (v.trail ?? v.hp) / v.maxHp));
    if (v.kind === 'tower') {
      // Turm: Kronen-Schild + Balken mit Glanzband, Zahl im Balken (immer sichtbar)
      const h = Math.max(15, s * 0.5);
      const w = Math.max(h * 4.2, v.half * s * 1.75);
      const x = v.sx - w / 2 + h * 0.35;
      const y = v.sy + v.half * s * 1.0;
      this.barBody(ctx, x, y, w, h, k, kt, team, v.hurt, !mine && this.game.app.settings.colorblind);
      tnum(ctx, String(Math.ceil(v.hp)), x + w / 2 + h * 0.1, y + h / 2 + 1, Math.max(12, h * 0.82), mine ? '#e3f0ff' : '#ffe3e5', 'center', 3);
      const cb = this.crownBadge(h * 1.5, dpr);
      ctx.drawImage(cb, x - h * 0.95, y + h / 2 - (h * 1.5) / 2 - 2 / dpr, cb.width / dpr, cb.height / dpr);
      return;
    }
    // Einheiten und Gebäude: Abzeichen + Balken nur bei Schaden (Champion/Held/Evo behalten ihr Abzeichen)
    if (!damaged && !special && !v.evo) return;
    const h = Math.max(5, s * 0.2);
    const bh = Math.max(13, s * 0.46);
    const w = Math.max(24, Math.min(54, (v.kind === 'building' ? v.half * s * 1.3 : v.U * 1.6)));
    const top = v.kind === 'building' ? v.sy - v.half * s * 1.9 : v.sy - (v.flying ? s * 1.1 : 0) - v.U * 1.95;
    const x = v.sx - w / 2 + bh * 0.3;
    const y = top - h;
    if (damaged) this.barBody(ctx, x, y, w, h, k, kt, team, v.hurt, !mine && this.game.app.settings.colorblind);
    // Schwärme (kleine Einheiten) nur mit Balken – Abzeichen nur für größere Einheiten und Sonderkarten
    if (v.kind === 'unit' && v.radius < 0.42 && !special && !v.evo) return;
    const ring = v.evo ? '#e8b8ff' : v.cls === 'hero' ? '#ffc2b0' : v.cls === 'champion' ? '#fff3a0' : null;
    const label = String(this.game.rules.cardLevel || 11);
    const cb = this.unitBadge(mine ? 'blue' : 'red', label, bh, dpr, ring, !mine && this.game.app.settings.colorblind);
    ctx.drawImage(cb, x - bh * 0.7, y + h / 2 - bh / 2 - 2 / dpr, cb.width / dpr, cb.height / dpr);
    if (v.shield > 0) {
      ctx.fillStyle = '#e8eef4';
      ctx.fillRect(x + 2, y - 3, (w - 4) * Math.min(1, v.shield / (v.maxShield || v.shield)), 3);
    }
  }

  /** Balkenkörper: dunkler Track, weißer Nachzieher, Teamfarbe mit Glanzband, Kontur, Treffer-Aufhellung. */
  barBody(ctx, x, y, w, h, k, kt, team, hurt, hatch) {
    const r = Math.min(h / 2, 6);
    ctx.fillStyle = '#111842';
    rrect(ctx, x, y, w, h, r);
    ctx.fill();
    const ih = h - 3;
    const iw = w - 3;
    if (kt > k) {
      ctx.fillStyle = '#ffffff';
      rrect(ctx, x + 1.5, y + 1.5, Math.max(ih * 0.6, iw * kt), ih, Math.min(ih / 2, 5));
      ctx.fill();
    }
    if (k > 0) {
      ctx.fillStyle = team.main;
      rrect(ctx, x + 1.5, y + 1.5, Math.max(ih * 0.6, iw * k), ih, Math.min(ih / 2, 5));
      ctx.fill();
      if (hatch) {
        // Farbenblind-Modus: Gegner-Füllung zusätzlich schräg gestreift
        ctx.fillStyle = this.hatchPattern(ctx);
        rrect(ctx, x + 1.5, y + 1.5, Math.max(ih * 0.6, iw * k), ih, Math.min(ih / 2, 5));
        ctx.fill();
      }
      ctx.fillStyle = team.light;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x + 1.5 + r * 0.5, y + 1.5, Math.max(0, iw * k - r), Math.max(1, ih * 0.32));
      ctx.globalAlpha = 1;
    }
    if (hurt > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 * hurt})`;
      rrect(ctx, x, y, w, h, r);
      ctx.fill();
    }
    ctx.lineWidth = Math.max(1.5, h * 0.12);
    ctx.strokeStyle = OUTLINE;
    rrect(ctx, x, y, w, h, r);
    ctx.stroke();
  }

  hatchPattern(ctx) {
    if (!this._hatch) {
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const g = c.getContext('2d');
      g.strokeStyle = 'rgba(20,10,30,0.42)';
      g.lineWidth = 2.2;
      g.beginPath();
      for (const o of [-8, 0, 8]) {
        g.moveTo(o, 8);
        g.lineTo(o + 8, 0);
      }
      g.stroke();
      this._hatch = ctx.createPattern(c, 'repeat');
    }
    return this._hatch;
  }

  // ───────────── Projektile ─────────────
  drawProjectiles(ctx, list, t) {
    const view = this.game.view;
    const s = view.s;
    for (const p of list) {
      const [x, y0] = view.toScreen(p.x, p.y);
      const z = projZ(p);
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
          if (Math.random() < 0.5) this.game.fx.burst(FUSE_SPARK, { x: p.x, y: p.y, z, k: 1 });
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

// ───────────── Arena-Hintergrund (einmal gezeichnet, gecacht) ─────────────
const GRASS = ['#7fbe55', '#76b44d'];
const BRICK = { fill: '#e2b360', joint: 'rgba(150,95,35,0.5)', edge: '#b37a33' };
const STONE_BANK = '#9d9485';
const WATER = ['#2a78bf', '#3f9ee0', '#5cbcf2'];

/** Umgebung außerhalb der Arena (Bildschirmraum): dunkles Gras, Bäume, Büsche, Felsen mit Licht von oben links. */
function paintSurroundings(c, cw, ch, A, s) {
  const g = c.createLinearGradient(0, 0, cw, ch);
  g.addColorStop(0, '#3a7a40');
  g.addColorStop(1, '#24562e');
  c.fillStyle = g;
  c.fillRect(0, 0, cw, ch);
  // Gras-Tupfer
  for (let i = 0; i < 260; i++) {
    const x = hash(i + 3000) * cw;
    const y = hash(i + 4000) * ch;
    c.fillStyle = hash(i + 5000) > 0.5 ? 'rgba(120,190,90,0.18)' : 'rgba(10,40,20,0.18)';
    c.fillRect(x, y, s * 0.12, s * 0.12);
  }
  const inArena = (x, y, m) => x > A.x - m && x < A.x + A.w + m && y > A.y - m && y < A.y + A.h + m;
  const items = [];
  for (let i = 0; i < 120; i++) {
    const x = hash(i) * cw;
    const y = hash(i + 500) * ch;
    const r = s * (0.55 + hash(i + 900) * 0.75);
    if (inArena(x, y, r + s * 0.9)) continue;
    items.push({ x, y, r, kind: hash(i + 77) > 0.78 ? 'rock' : hash(i + 78) > 0.45 ? 'tree' : 'bush', i });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    const { x, y, r } = it;
    // weicher Schatten nach unten rechts
    const sg = c.createRadialGradient(x + r * 0.35, y + r * 0.55, 0, x + r * 0.35, y + r * 0.55, r * 1.1);
    sg.addColorStop(0, 'rgba(5,15,10,0.35)');
    sg.addColorStop(1, 'rgba(5,15,10,0)');
    c.fillStyle = sg;
    c.fillRect(x - r, y - r, r * 2.6, r * 2.6);
    c.lineWidth = Math.max(1.5, s * 0.07);
    c.strokeStyle = '#1c1830';
    if (it.kind === 'rock') {
      c.beginPath();
      c.moveTo(x - r * 0.8, y + r * 0.3);
      c.lineTo(x - r * 0.5, y - r * 0.5);
      c.lineTo(x + r * 0.3, y - r * 0.7);
      c.lineTo(x + r * 0.85, y - r * 0.1);
      c.lineTo(x + r * 0.6, y + r * 0.45);
      c.closePath();
      const rg = c.createLinearGradient(x - r, y - r, x + r, y + r);
      rg.addColorStop(0, '#c9c3b8');
      rg.addColorStop(1, '#7d766b');
      c.fillStyle = rg;
      c.fill();
      c.stroke();
      continue;
    }
    const blobs = it.kind === 'tree' ? [[0, -0.15, 1], [-0.55, 0.2, 0.7], [0.55, 0.2, 0.72], [0, 0.35, 0.65]] : [[-0.35, 0.1, 0.6], [0.35, 0.1, 0.62], [0, -0.15, 0.6]];
    const base = it.kind === 'tree' ? (hash(it.i + 33) > 0.5 ? '#3f8f45' : '#4a9c4a') : '#5aa84f';
    c.beginPath();
    for (const [bx, by, br] of blobs) {
      c.moveTo(x + bx * r + br * r * 0.62, y + by * r);
      c.arc(x + bx * r, y + by * r, br * r * 0.62, 0, TAU);
    }
    const tg = c.createLinearGradient(x - r, y - r, x + r * 0.6, y + r);
    tg.addColorStop(0, shade(base, 0.25));
    tg.addColorStop(0.55, base);
    tg.addColorStop(1, shade(base, -0.3));
    c.fillStyle = tg;
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(255,255,230,0.22)';
    c.beginPath();
    c.ellipse(x - r * 0.25, y - r * 0.35, r * 0.28, r * 0.16, -0.5, 0, TAU);
    c.fill();
  }
}

/** Arena in Weltkoordinaten: Mauerrand, Gras, Wege, Turmplätze, Fluss mit Ufern, Brücken, Banner. px = 1 CSS-Pixel in Feldern. */
function paintArena(c, px, mySide) {
  const W = ARENA_W;
  const H = ARENA_H;
  const ink = '#1c1830';
  // Mauer rundum (Steinblöcke mit Licht oben)
  c.fillStyle = '#857c6e';
  c.strokeStyle = ink;
  c.lineWidth = 3 * px;
  c.beginPath();
  c.roundRect(-0.7, -0.7, W + 1.4, H + 1.4, 0.6);
  c.fill();
  c.stroke();
  c.strokeStyle = 'rgba(40,32,26,0.35)';
  c.lineWidth = 1.2 * px;
  for (let i = 0; i < (W + H) * 2; i++) {
    // Fugen entlang des Rands
    const t = i * 0.9;
    let x;
    let y;
    if (t < W) [x, y] = [t, -0.35];
    else if (t < W + H) [x, y] = [W + 0.35, t - W];
    else if (t < 2 * W + H) [x, y] = [W - (t - W - H), H + 0.35];
    else [x, y] = [-0.35, H - (t - 2 * W - H)];
    c.beginPath();
    c.arc(x, y, 0.16, 0, TAU);
    c.stroke();
  }
  c.fillStyle = 'rgba(255,245,220,0.22)';
  c.fillRect(-0.6, -0.6, W + 1.2, 0.18);
  // Gras: Schachbrett in zwei gedämpften Tönen mit leichter Variation
  for (let ty = 0; ty < H; ty++) {
    for (let tx = 0; tx < W; tx++) {
      const v = hash(tx * 37 + ty * 11) * 0.05 - 0.025;
      c.fillStyle = shade(GRASS[(tx + ty) % 2], v);
      c.fillRect(tx, ty, 1 + px, 1 + px);
    }
  }
  // Grasbüschel und helle Tupfer
  c.lineWidth = 1.3 * px;
  c.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = hash(i + 11000) * W;
    const y = hash(i + 12000) * H;
    if (y > RIVER_Y0 - 0.2 && y < RIVER_Y1 + 0.2) continue;
    if (hash(i + 13000) > 0.35) {
      c.strokeStyle = 'rgba(40,95,30,0.45)';
      c.beginPath();
      c.moveTo(x - 0.08, y - 0.1);
      c.lineTo(x, y + 0.06);
      c.lineTo(x + 0.09, y - 0.12);
      c.stroke();
    } else {
      c.fillStyle = 'rgba(220,255,170,0.35)';
      c.fillRect(x, y, 0.07, 0.07);
    }
  }
  // Wege aus Ziegeln: Querweg an den Burgtürmen, Längswege über die Wachtürme bis zur Brücke
  const paths = [];
  for (const b of BRIDGES) {
    paths.push([b.cx - 0.95, 3 - 0.95, 1.9, RIVER_Y0 - 2.05]);
    paths.push([b.cx - 0.95, RIVER_Y1, 1.9, 29 + 0.95 - RIVER_Y1]);
  }
  paths.push([BRIDGES[0].cx, 3 - 0.8, BRIDGES[1].cx - BRIDGES[0].cx, 1.6]);
  paths.push([BRIDGES[0].cx, 29 - 0.8, BRIDGES[1].cx - BRIDGES[0].cx, 1.6]);
  for (const [x, y, w, h] of paths) {
    c.fillStyle = 'rgba(60,40,20,0.22)';
    c.fillRect(x + 0.08, y + 0.1, w, h);
    c.fillStyle = BRICK.fill;
    c.fillRect(x, y, w, h);
  }
  // Ziegelfugen (nur auf den Wegen)
  c.save();
  c.beginPath();
  for (const [x, y, w, h] of paths) c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = BRICK.joint;
  c.lineWidth = 1 * px;
  for (let y = 0; y < H; y += 0.5) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
    const off = (y * 2) % 2 ? 0.5 : 0;
    for (let x = off; x < W; x += 1) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + 0.5);
      c.stroke();
    }
  }
  c.fillStyle = 'rgba(255,240,200,0.12)';
  for (let i = 0; i < 160; i++) c.fillRect(hash(i + 20000) * W, hash(i + 21000) * H, 0.45, 0.2);
  c.restore();
  c.strokeStyle = BRICK.edge;
  c.lineWidth = 1.5 * px;
  for (const [x, y, w, h] of paths) c.strokeRect(x, y, w, h);
  // Turmplätze: Steinplatten mit Fugen
  for (const t of TOWER_SLOTS) {
    const half = (t.key === 'king' ? 4 : 3) / 2 + 0.3;
    c.fillStyle = 'rgba(40,30,20,0.25)';
    c.fillRect(t.x - half + 0.1, t.y - half + 0.12, half * 2, half * 2);
    c.fillStyle = '#d6cab0';
    c.strokeStyle = 'rgba(28,24,48,0.55)';
    c.lineWidth = 1.5 * px;
    c.beginPath();
    c.roundRect(t.x - half, t.y - half, half * 2, half * 2, 0.25);
    c.fill();
    c.stroke();
    c.strokeStyle = 'rgba(120,100,80,0.35)';
    c.lineWidth = 1 * px;
    for (let k = 1; k < half * 2; k++) {
      c.beginPath();
      c.moveTo(t.x - half + k, t.y - half);
      c.lineTo(t.x - half + k, t.y + half);
      c.moveTo(t.x - half, t.y - half + k);
      c.lineTo(t.x + half, t.y - half + k);
      c.stroke();
    }
  }
  // Fluss: Wasser mit Tiefenverlauf, Steinufer mit Licht von oben
  const wg = c.createLinearGradient(0, RIVER_Y0, 0, RIVER_Y1);
  wg.addColorStop(0, WATER[0]);
  wg.addColorStop(0.35, WATER[1]);
  wg.addColorStop(0.7, WATER[2]);
  wg.addColorStop(1, WATER[1]);
  c.fillStyle = wg;
  c.fillRect(-0.7, RIVER_Y0, W + 1.4, RIVER_Y1 - RIVER_Y0);
  c.fillStyle = 'rgba(10,40,80,0.35)';
  c.fillRect(-0.7, RIVER_Y0, W + 1.4, 0.28);
  for (const [y, top] of [[RIVER_Y0 - 0.22, true], [RIVER_Y1 - 0.06, false]]) {
    for (let x = -0.7; x < W + 0.7; x += 0.62) {
      const w = 0.58 + hash(Math.round(x * 10) + (top ? 0 : 99)) * 0.1;
      c.fillStyle = shade(STONE_BANK, hash(Math.round(x * 7) + (top ? 5 : 55)) * 0.12 - 0.06);
      c.strokeStyle = ink;
      c.lineWidth = 1.2 * px;
      c.beginPath();
      c.roundRect(x, y, w, 0.28, 0.08);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(255,250,235,0.35)';
      c.fillRect(x + 0.06, y + 0.03, w - 0.12, 0.06);
    }
  }
  // Brücken: Planken, Seitenbalken, Pfosten mit Metallbändern, Schatten aufs Wasser
  for (const b of BRIDGES) {
    const by0 = RIVER_Y0 - 0.5;
    const by1 = RIVER_Y1 + 0.5;
    c.fillStyle = 'rgba(5,25,50,0.35)';
    c.fillRect(b.x0 + 0.15, by0 + 0.2, b.x1 - b.x0, by1 - by0);
    c.fillStyle = '#b98250';
    c.strokeStyle = ink;
    c.lineWidth = 2.2 * px;
    c.beginPath();
    c.roundRect(b.x0, by0, b.x1 - b.x0, by1 - by0, 0.12);
    c.fill();
    c.stroke();
    for (let k = 0; k < 9; k++) {
      const y = by0 + ((by1 - by0) * k) / 9;
      const pg = c.createLinearGradient(0, y, 0, y + (by1 - by0) / 9);
      pg.addColorStop(0, shade('#c99560', hash(k + b.x0 * 10) * 0.12 - 0.04));
      pg.addColorStop(1, shade('#a8713e', hash(k + 40) * 0.1 - 0.05));
      c.fillStyle = pg;
      c.fillRect(b.x0 + 0.22, y + 0.03, b.x1 - b.x0 - 0.44, (by1 - by0) / 9 - 0.06);
    }
    for (const x of [b.x0, b.x1 - 0.24]) {
      c.fillStyle = '#7a4b2a';
      c.strokeStyle = ink;
      c.lineWidth = 1.6 * px;
      c.beginPath();
      c.roundRect(x, by0 - 0.1, 0.24, by1 - by0 + 0.2, 0.06);
      c.fill();
      c.stroke();
    }
    for (const [x, y] of [[b.x0 + 0.12, by0 - 0.1], [b.x1 - 0.12, by0 - 0.1], [b.x0 + 0.12, by1 + 0.1], [b.x1 - 0.12, by1 + 0.1]]) {
      const pg = c.createRadialGradient(x - 0.08, y - 0.08, 0.02, x, y, 0.26);
      pg.addColorStop(0, '#d39a62');
      pg.addColorStop(1, '#6b4226');
      c.fillStyle = pg;
      c.strokeStyle = ink;
      c.lineWidth = 1.6 * px;
      c.beginPath();
      c.arc(x, y, 0.24, 0, TAU);
      c.fill();
      c.stroke();
      c.strokeStyle = '#4a6fa5';
      c.lineWidth = 2.2 * px;
      c.beginPath();
      c.arc(x, y, 0.16, 0, TAU);
      c.stroke();
    }
  }
  // Teamfarbene Banner an den Seitenmauern (eigene Hälfte blau, gegnerische rot)
  for (let y = 2; y < H - 1; y += 3.4) {
    if (y > RIVER_Y0 - 1 && y < RIVER_Y1 + 1) continue;
    const mine = mySide === 0 ? y > MID_Y_WORLD : y < MID_Y_WORLD;
    const col = mine ? TEAM.blue.main : TEAM.red.main;
    for (const x of [-0.62, W + 0.18]) {
      c.fillStyle = col;
      c.strokeStyle = ink;
      c.lineWidth = 1.4 * px;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 0.44, y);
      c.lineTo(x + 0.44, y + 0.9);
      c.lineTo(x + 0.22, y + 0.72);
      c.lineTo(x, y + 0.9);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(x + 0.04, y + 0.04, 0.12, 0.6);
    }
  }
  // Feiner Innenschatten der Mauer
  c.strokeStyle = 'rgba(0,0,0,0.16)';
  c.lineWidth = 0.22;
  c.strokeRect(0.11, 0.11, W - 0.22, H - 0.22);
}
const MID_Y_WORLD = ARENA_H / 2;
