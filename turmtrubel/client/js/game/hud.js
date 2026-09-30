// Match-HUD: Layout (Hoch-/Querformat), Handkarten, Elixierleiste, Timer, Kronen, Buttons.
import { EMOTES } from '/shared/protocol.js';
import { cardArt } from '../ui/art.js';
import { drawEmoteFace, OUTLINE, TEAM } from './sprites.js';
import { starPath } from './renderer.js';

const TAU = Math.PI * 2;
const FONT = '"Lilita One", "Arial Black", sans-serif';
export const RARITY_COLORS = { common: '#9fb3c8', rare: '#f39c3d', epic: '#b55cf0', legendary: '#2fd3c6' };
export const CLASS_COLORS = { champion: '#ffd84d', hero: '#ff7a5c' };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function inRect(r, x, y) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function text(ctx, str, x, y, size, color = '#ffffff', align = 'center', stroke = 3) {
  ctx.font = `${Math.round(size)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (stroke) {
    ctx.lineWidth = stroke;
    ctx.strokeStyle = OUTLINE;
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textBaseline = 'alphabetic';
}

export function drawCrown(ctx, x, y, size, filled, color = '#ffd84d') {
  const w = size;
  const h = size * 0.75;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.lineTo(x - w / 2, y - h / 4);
  ctx.lineTo(x - w / 4, y + h / 8);
  ctx.lineTo(x, y - h / 2);
  ctx.lineTo(x + w / 4, y + h / 8);
  ctx.lineTo(x + w / 2, y - h / 4);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = filled ? color : 'rgba(40,36,56,0.8)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(x - w * 0.35, y + h * 0.12, w * 0.7, h * 0.12);
  }
}

export function drawElixirDrop(ctx, x, y, r, label) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.25);
  ctx.bezierCurveTo(x + r * 1.1, y - r * 0.1, x + r * 0.9, y + r, x, y + r);
  ctx.bezierCurveTo(x - r * 0.9, y + r, x - r * 1.1, y - r * 0.1, x, y - r * 1.25);
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, '#ff9af0');
  g.addColorStop(1, '#b02ee0');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (label != null) text(ctx, String(label), x, y + r * 0.15, r * 1.25, '#ffffff', 'center', Math.max(2, r * 0.3));
}

export class Hud {
  constructor(game) {
    this.game = game;
    this.L = null;
    this.emoteOpen = false;
    this.elixirFlash = 0;
    this.banners = [];
    this.crownFlights = [];
    this.pressed = null;
  }

  layout(w, h, pref = 'auto') {
    const view = this.game.view;
    const hudH = Math.round(Math.min(215, Math.max(118, h * 0.2)));
    const topH = Math.round(Math.min(46, Math.max(34, h * 0.05)));
    const sP = Math.min((w - 8) / 18, (h - hudH - topH - 6) / 33.2);
    const panelW = Math.round(Math.min(300, Math.max(168, w * 0.25)));
    const sR = Math.min((w - panelW - 16) / 32, (h - 8) / 18.8);
    const mode = pref === 'portrait' ? 'portrait' : pref === 'rotated' ? 'rotated' : sP >= 15 || sP >= sR * 0.85 ? 'portrait' : 'rotated';
    const L = { mode, w, h };
    const gap = 6;
    if (mode === 'portrait') {
      const s = Math.max(4, sP);
      view.mode = 'portrait';
      view.s = s;
      const aw = 18 * s;
      const ah = 32 * s;
      view.ox = Math.round((w - aw) / 2);
      view.oy = Math.round(topH + s * 1.2 + Math.max(0, (h - hudH - topH - ah - s * 1.2) / 2));
      L.topbar = { x: 0, y: 0, w, h: topH };
      const barL = Math.max(50, Math.min(view.ox, w / 2 - 230));
      const barR = Math.min(w - 6, Math.max(view.ox + aw, w / 2 + 230));
      L.oppName = { x: barL, y: topH / 2, maxW: Math.max(90, (barR - barL) - 190) };
      const sw = w < 460 ? 132 : 176;
      L.score = { x: barR - sw, y: 4, w: sw, h: topH - 8, bar: true };
      const top = view.oy + ah + 2;
      const ph = h - top;
      const pw = Math.min(w, Math.max(aw + 40, 360), 620);
      const px = (w - pw) / 2;
      L.panel = { x: 0, y: top, w, h: ph };
      const elixH = Math.max(18, Math.min(28, ph * 0.15));
      const availH = ph - elixH - 22;
      const cw = Math.max(30, Math.min((pw - 16 - gap * 4) / 4.62, availH / 1.26));
      const ch = cw * 1.26;
      const nw = cw * 0.62;
      const nh = ch * 0.62;
      const totalW = nw + gap * 2 + 4 * cw + 3 * gap;
      const x0 = px + (pw - totalW) / 2;
      const cy = top + 8;
      L.next = { x: x0, y: cy + ch - nh, w: nw, h: nh };
      L.cards = [0, 1, 2, 3].map((i) => ({ x: x0 + nw + gap * 2 + i * (cw + gap), y: cy, w: cw, h: ch }));
      L.elixir = { x: L.cards[0].x, y: cy + ch + 8, w: 4 * cw + 3 * gap, h: elixH };
      L.emoteBtn = { x: view.ox + 30, y: view.oy + ah - 30, r: Math.max(20, Math.min(28, s * 1.1)) };
      L.abilityBtn = { x: view.ox + aw - 40, y: view.oy + ah - 42, r: Math.max(26, Math.min(36, s * 1.5)) };
    } else {
      const s = Math.max(4, sR);
      view.mode = 'rotated';
      view.s = s;
      const aw = 32 * s;
      const ah = 18 * s;
      view.ox = Math.round(Math.max(4, (w - panelW - 8 - aw) / 2));
      view.oy = Math.round(s * 0.8 + (h - ah - s * 0.8) / 2);
      const px = w - panelW - 4;
      L.panel = { x: px - 4, y: 0, w: panelW + 8, h };
      L.oppName = { x: px + 6, y: 16, maxW: panelW - 12 };
      L.score = { x: px + 4, y: 32, w: panelW - 8, h: 36, bar: true };
      const elixH = 22;
      const cwW = (panelW - 3 * gap) / 2;
      const cwH = (h - 76 - 40 - gap) / (2 * 1.26 + 0.55 * 1.26);
      const cw = Math.max(30, Math.min(cwW, cwH));
      const ch = cw * 1.26;
      const gx = px + (panelW - (2 * cw + gap)) / 2;
      const gy = 78;
      L.cards = [0, 1, 2, 3].map((i) => ({ x: gx + (i % 2) * (cw + gap), y: gy + Math.floor(i / 2) * (ch + gap), w: cw, h: ch }));
      const ny = gy + 2 * ch + gap + 18;
      L.next = { x: px + 4, y: ny, w: cw * 0.55, h: ch * 0.55 };
      const ex = L.next.x + L.next.w + 10;
      L.elixir = { x: ex, y: ny + L.next.h / 2 - elixH / 2, w: px + panelW - 4 - ex, h: elixH };
      L.emoteBtn = { x: view.ox + aw - 30, y: view.oy + 30, r: Math.max(20, Math.min(28, s * 1.1)) };
      L.abilityBtn = { x: view.ox + aw - 42, y: view.oy + ah - 42, r: Math.max(26, Math.min(36, s * 1.5)) };
    }
    L.arena = view.rect(0, 0, 18, 32);
    const eb = L.emoteBtn;
    const er = eb.r * 0.95;
    const up = mode === 'portrait' ? -1 : 1;
    L.emoteItems = EMOTES.map((_, i) => ({
      x: eb.x + (i % 3) * er * 2.3 + (mode === 'portrait' ? er * 0.3 : -er * 4.9),
      y: eb.y + up * (er * 2.4 + Math.floor(i / 3) * er * 2.3),
      r: er,
    }));
    this.L = L;
    return L;
  }

  inArena(x, y) {
    return inRect(this.L.arena, x, y);
  }

  hit(x, y) {
    const L = this.L;
    const g = this.game;
    if (this.emoteOpen) {
      for (let i = 0; i < L.emoteItems.length; i++) {
        const b = L.emoteItems[i];
        if (Math.hypot(x - b.x, y - b.y) <= b.r) return { type: 'emoteItem', index: i };
      }
    }
    if (Math.hypot(x - L.emoteBtn.x, y - L.emoteBtn.y) <= L.emoteBtn.r) return { type: 'emote' };
    if (g.me?.ab && Math.hypot(x - L.abilityBtn.x, y - L.abilityBtn.y) <= L.abilityBtn.r) return { type: 'ability' };
    for (let i = 0; i < 4; i++) {
      const r = L.cards[i];
      const lift = g.sel === i ? 10 : 0;
      if (inRect({ x: r.x - 3, y: r.y - lift - 3, w: r.w + 6, h: r.h + lift + 6 }, x, y)) return { type: 'card', index: i };
    }
    if (inRect(L.panel, x, y)) return { type: 'panel' };
    if (this.inArena(x, y)) return { type: 'arena' };
    return { type: 'none' };
  }

  flashElixir() {
    this.elixirFlash = 0.6;
  }

  banner(textStr, color = '#ffffff', sub = '') {
    this.banners.push({ text: textStr, color, sub, at: this.game.clock });
  }

  flyCrown(fromX, fromY, mine) {
    this.crownFlights.push({ x: fromX, y: fromY, mine, at: this.game.clock });
  }

  // ───────────── Zeichnen ─────────────
  draw(ctx, now, dt) {
    const g = this.game;
    const L = this.L;
    if (!L) return;
    this.elixirFlash = Math.max(0, this.elixirFlash - dt);
    // Panel-Hintergrund
    const P = L.panel;
    const grad = ctx.createLinearGradient(P.x, P.y, P.x, P.y + P.h);
    grad.addColorStop(0, '#3b2f7a');
    grad.addColorStop(1, '#231b4f');
    ctx.fillStyle = grad;
    ctx.fillRect(P.x, P.y, P.w, P.h);
    ctx.fillStyle = '#5a47b3';
    if (L.mode === 'portrait') ctx.fillRect(P.x, P.y, P.w, 3);
    else ctx.fillRect(P.x, P.y, 3, P.h);
    if (L.topbar) {
      const T = L.topbar;
      const tg = ctx.createLinearGradient(0, T.y, 0, T.y + T.h);
      tg.addColorStop(0, '#2a2160');
      tg.addColorStop(1, '#3b2f7a');
      ctx.fillStyle = tg;
      ctx.fillRect(T.x, T.y, T.w, T.h);
      ctx.fillStyle = '#5a47b3';
      ctx.fillRect(T.x, T.y + T.h - 3, T.w, 3);
    }

    const me = g.me;
    if (me) {
      const elixir = g.elixirNow();
      for (let i = 0; i < 4; i++) this.drawHandCard(ctx, i, L.cards[i], me, elixir, now);
      this.drawNext(ctx, L.next, me);
      this.drawElixirBar(ctx, L.elixir, elixir, now);
    }
    this.drawScore(ctx, L.score, now);
    this.drawNames(ctx, now);
    this.drawEmoteButton(ctx, now);
    if (me && me.ab) this.drawAbility(ctx, me.ab, now);
    this.drawBanners(ctx, now);
    this.drawCrownFlights(ctx, now);
  }

  drawHandCard(ctx, i, r, me, elixir, now) {
    const g = this.game;
    const id = me.h[i];
    const card = g.db.card(id);
    if (!card) return;
    const selected = g.sel === i;
    const ready = !(me.hr[i] > 0.01) && !g.pendingSlot.has(i);
    const evoInfo = me.ev?.[i];
    const evoReady = Array.isArray(evoInfo) && evoInfo[0] >= evoInfo[1];
    const lift = selected ? 10 : 0;
    const x = r.x;
    const y = r.y - lift;
    const drag = g.drag?.active && selected;
    ctx.save();
    if (drag) ctx.globalAlpha = 0.45;
    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, x + 2, y + 4, r.w, r.h, 9);
    ctx.fill();
    // Rahmen
    const frame = CLASS_COLORS[card.class] || RARITY_COLORS[card.rarity] || '#9fb3c8';
    rr(ctx, x, y, r.w, r.h, 9);
    ctx.fillStyle = evoReady ? '#c77dff' : frame;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    const inset = Math.max(3, r.w * 0.05);
    const art = cardArt(g.db, id, evoReady);
    ctx.save();
    rr(ctx, x + inset, y + inset, r.w - inset * 2, r.h - inset * 2, 6);
    ctx.clip();
    ctx.drawImage(art, x + inset, y + inset, r.w - inset * 2, r.h - inset * 2);
    // Nicht bezahlbar → abdunkeln, Fortschritt von unten
    const k = Math.min(1, elixir / card.elixir);
    if (k < 1 || !ready) {
      ctx.fillStyle = 'rgba(20,16,40,0.62)';
      const hh = (r.h - inset * 2) * (ready ? 1 - k : 1);
      ctx.fillRect(x + inset, y + inset, r.w - inset * 2, hh);
    }
    ctx.restore();
    if (evoReady) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(now * 6) * 0.3;
      ctx.strokeStyle = '#f2d4ff';
      ctx.lineWidth = 3;
      rr(ctx, x - 2, y - 2, r.w + 4, r.h + 4, 11);
      ctx.stroke();
      ctx.restore();
      text(ctx, 'EVO', x + r.w / 2, y + r.h - Math.max(8, r.w * 0.13), Math.max(10, r.w * 0.2), '#f2d4ff');
    } else if (Array.isArray(evoInfo)) {
      const n = evoInfo[1];
      for (let p = 0; p < n; p++) {
        const px = x + r.w / 2 + (p - (n - 1) / 2) * r.w * 0.2;
        ctx.beginPath();
        ctx.arc(px, y + r.h - 7, Math.max(3, r.w * 0.06), 0, TAU);
        ctx.fillStyle = p < evoInfo[0] ? '#c77dff' : 'rgba(30,24,50,0.8)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
    }
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      rr(ctx, x - 1.5, y - 1.5, r.w + 3, r.h + 3, 10);
      ctx.stroke();
    }
    const dr = Math.max(8, r.w * 0.17);
    drawElixirDrop(ctx, x + dr * 0.95, y + dr * 1.2, dr, card.elixir);
    if (card.class !== 'normal') {
      ctx.fillStyle = CLASS_COLORS[card.class];
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      starPath(ctx, x + r.w - dr * 0.9, y + dr * 1.1, dr * 0.8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawNext(ctx, r, me) {
    const g = this.game;
    if (!me.n) return;
    text(ctx, 'Nächste', r.x + r.w / 2, r.y - 9, Math.max(10, r.w * 0.22), '#d9d2ff', 'center', 2.5);
    const nev = me.nev;
    const evoReady = Array.isArray(nev) && nev[0] >= nev[1];
    const card = g.db.card(me.n);
    rr(ctx, r.x, r.y, r.w, r.h, 7);
    ctx.fillStyle = card ? CLASS_COLORS[card.class] || RARITY_COLORS[card.rarity] : '#999';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    ctx.save();
    rr(ctx, r.x + 3, r.y + 3, r.w - 6, r.h - 6, 5);
    ctx.clip();
    ctx.drawImage(cardArt(g.db, me.n, evoReady), r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    ctx.restore();
    if (card) drawElixirDrop(ctx, r.x + r.w * 0.2, r.y + r.w * 0.24, Math.max(6, r.w * 0.15), card.elixir);
  }

  drawElixirBar(ctx, r, elixir, now) {
    const flash = this.elixirFlash > 0 ? Math.abs(Math.sin(this.elixirFlash * 20)) : 0;
    rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.fillStyle = flash ? `rgba(255,70,80,${0.5 + flash * 0.5})` : '#1a1433';
    ctx.fill();
    const k = Math.min(1, elixir / 10);
    if (k > 0) {
      const gr = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      gr.addColorStop(0, '#ff8af0');
      gr.addColorStop(1, '#b02ee0');
      ctx.save();
      rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
      ctx.clip();
      ctx.fillStyle = gr;
      ctx.fillRect(r.x, r.y, r.w * k, r.h);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(r.x, r.y + 2, r.w * k, r.h * 0.25);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(28,24,48,0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 10; i++) {
      const x = r.x + (r.w * i) / 10;
      ctx.beginPath();
      ctx.moveTo(x, r.y + 3);
      ctx.lineTo(x, r.y + r.h - 3);
      ctx.stroke();
    }
    rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    const dr = r.h * 0.62;
    drawElixirDrop(ctx, r.x - dr * 0.3, r.y + r.h / 2, dr, Math.floor(elixir));
    const mult = this.game.snapMult;
    if (mult > 1) text(ctx, '×' + mult, r.x + r.w - 6, r.y + r.h / 2 + 1, r.h * 0.8, '#ffe066', 'right', 3);
  }

  /** Kopf: [Kronen blau] [Timer] – kompakt als Leiste */
  drawScore(ctx, r, now) {
    const g = this.game;
    const tl = g.timeLeftNow();
    const m = Math.floor(tl / 60);
    const sec = Math.floor(tl % 60);
    const timeStr = `${m}:${String(sec).padStart(2, '0')}`;
    const ot = g.phase === 'o';
    const myC = g.crowns[g.side] || 0;
    ctx.save();
    const tw = r.w < 170 ? 68 : 86;
    const tx = r.x + r.w - tw;
    ctx.fillStyle = ot ? 'rgba(120, 40, 10, 0.9)' : 'rgba(28, 22, 60, 0.9)';
    rr(ctx, tx, r.y, tw, r.h, 10);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    const low = tl <= 10 && !g.ended;
    const tColor = ot ? '#ffcf6b' : low ? (Math.floor(now * 4) % 2 ? '#ff5d5d' : '#ffffff') : '#ffffff';
    text(ctx, ot ? 'Verlängerung' : 'Restzeit', tx + tw / 2, r.y + r.h * 0.27, Math.max(8, r.h * 0.26), '#c9c0f0', 'center', 0);
    text(ctx, timeStr, tx + tw / 2, r.y + r.h * 0.66, Math.max(14, r.h * 0.52), tColor, 'center', 3);
    // eigene Kronen (blau) links neben dem Timer
    const cs = Math.min(r.w < 170 ? 15 : 22, r.h * 0.62);
    const cx0 = tx - 8 - cs * 0.5;
    for (let i = 0; i < 3; i++) drawCrown(ctx, cx0 - (2 - i) * cs * 1.18, r.y + r.h / 2 + 1, cs, i < myC, TEAM.blue.main);
    this.crownTargets = this.crownTargets || {};
    this.crownTargets.mine = [cx0 - (2 - Math.max(0, myC - 1)) * cs * 1.18, r.y + r.h / 2];
    ctx.restore();
  }

  /** Gegnername + rote Kronen (+ Ping) */
  drawNames(ctx, now) {
    const g = this.game;
    const L = this.L;
    const r = L.oppName;
    let name = g.names[1 - g.side] || 'Gegner';
    const narrow = L.w < 460;
    const size = L.mode === 'portrait' ? Math.max(12, Math.min(17, (L.topbar?.h || 40) * (narrow ? 0.34 : 0.4))) : 14;
    ctx.font = `${size}px ${FONT}`;
    const avail = L.mode === 'portrait' ? L.score.x - 8 - r.x : r.maxW || 200;
    const csPre = Math.min(narrow ? 15 : 20, (size + 10) * 0.8);
    const nameMax = avail - csPre * 3.6 - 30;
    if (ctx.measureText(name).width > nameMax) {
      while (name.length > 3 && ctx.measureText(name + '…').width > nameMax) name = name.slice(0, -1);
      name += '…';
    }
    const w = ctx.measureText(name).width + 18;
    const x = r.x;
    const y = r.y;
    const hh = size + 10;
    ctx.fillStyle = 'rgba(196, 34, 51, 0.92)';
    rr(ctx, x, y - hh / 2, w, hh, hh / 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    text(ctx, name, x + 9, y + 1, size, '#ffffff', 'left', 2.5);
    const opC = g.crowns[1 - g.side] || 0;
    const cs = csPre;
    for (let i = 0; i < 3; i++) drawCrown(ctx, x + w + 6 + cs * 0.6 + i * cs * 1.18, y + 1, cs, i < opC, TEAM.red.main);
    this.crownTargets = this.crownTargets || {};
    this.crownTargets.opp = [x + w + 6 + cs * 0.6 + Math.max(0, opC - 1) * cs * 1.18, y];
    // Verbindungsstatus & Ping unauffällig im Kartenpanel
    const P = L.panel;
    const px = L.mode === 'portrait' ? P.x + P.w - 8 : P.x + P.w - 10;
    const py = L.mode === 'portrait' ? P.y + 13 : y + 1;
    if (g.oppDisconnected) text(ctx, '⚠ Gegner getrennt', L.mode === 'portrait' ? P.x + 8 : px - 50, py, 12, '#ffd84d', L.mode === 'portrait' ? 'left' : 'right', 2.5);
    if (g.app.settings.showPing && g.ping != null) {
      const p = Math.round(g.ping);
      const col = p < 80 ? '#7dff8a' : p < 180 ? '#ffe066' : '#ff6b6b';
      text(ctx, `${p} ms`, px, py, 11, col, 'right', 2.5);
    }
  }

  drawEmoteButton(ctx, now) {
    const b = this.L.emoteBtn;
    const g = this.game;
    const cd = g.me?.emo || 0;
    ctx.save();
    ctx.globalAlpha = cd > 0 ? 0.55 : 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    drawEmoteFace(ctx, 'thumbs', b.x - b.r * 0.08, b.y, b.r * 0.62, now * 0.3);
    ctx.restore();
    if (!this.emoteOpen) return;
    this.L.emoteItems.forEach((it, i) => {
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      drawEmoteFace(ctx, EMOTES[i].face, it.x, it.y, it.r * 0.72, now);
    });
  }

  drawAbility(ctx, ab, now) {
    const g = this.game;
    const b = this.L.abilityBtn;
    const card = g.db.card(ab.card);
    const champ = ab.cls === 'champion';
    const cdK = champ && ab.max ? ab.cd / ab.max : 0;
    const afford = !champ || g.elixirNow() >= ab.cost;
    const ready = cdK <= 0 && afford && !ab.dep;
    ctx.save();
    if (ready) {
      ctx.globalAlpha = 0.45 + Math.sin(now * 6) * 0.25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 6, 0, TAU);
      ctx.fillStyle = champ ? '#ffd84d' : '#ff9a7a';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.save();
    ctx.clip();
    ctx.drawImage(cardArt(g.db, ab.card, false), b.x - b.r, b.y - b.r * 1.35, b.r * 2, b.r * 2.5);
    if (!ready) {
      ctx.fillStyle = 'rgba(20,16,40,0.55)';
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    if (cdK > 0) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * cdK);
      ctx.closePath();
      ctx.fillStyle = 'rgba(10,8,25,0.6)';
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = champ ? '#ffd84d' : '#ff7a5c';
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 1.5, 0, TAU);
    ctx.stroke();
    if (champ) drawElixirDrop(ctx, b.x - b.r * 0.72, b.y - b.r * 0.62, b.r * 0.28, ab.cost);
    if (cdK > 0) text(ctx, String(Math.ceil(ab.cd)), b.x, b.y + 2, b.r * 0.7, '#ffffff');
    const label = card?.ability?.name || 'Fähigkeit';
    text(ctx, label, b.x, b.y + b.r + 11, 11, champ ? '#ffe066' : '#ffb3a3', 'center', 2.5);
    ctx.restore();
  }

  drawBanners(ctx, now) {
    const A = this.L.arena;
    this.banners = this.banners.filter((b) => now - b.at < 2.2);
    let yOff = 0;
    for (const b of this.banners) {
      const age = now - b.at;
      const pop = Math.min(1, age / 0.2);
      const fade = age > 1.8 ? 1 - (age - 1.8) / 0.4 : 1;
      const cx = A.x + A.w / 2;
      const cy = A.y + A.h * 0.42 + yOff;
      const size = Math.min(34, A.w * 0.075) * (0.6 + pop * 0.4);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(28,22,60,0.75)';
      ctx.font = `${Math.round(size)}px ${FONT}`;
      const w = Math.max(ctx.measureText(b.text).width + 40, 160);
      rr(ctx, cx - w / 2, cy - size, w, size * (b.sub ? 2.4 : 1.8), 14);
      ctx.fill();
      text(ctx, b.text, cx, cy - size * 0.1, size, b.color, 'center', 4);
      if (b.sub) text(ctx, b.sub, cx, cy + size * 0.9, size * 0.5, '#ffffff', 'center', 3);
      ctx.restore();
      yOff += size * 2.6;
    }
  }

  drawCrownFlights(ctx, now) {
    if (!this.crownTargets) return;
    this.crownFlights = this.crownFlights.filter((f) => now - f.at < 1.1);
    for (const f of this.crownFlights) {
      const k = Math.min(1, (now - f.at) / 1.0);
      const e = 1 - Math.pow(1 - k, 3);
      const [tx, ty] = f.mine ? this.crownTargets.mine : this.crownTargets.opp;
      const x = f.x + (tx - f.x) * e;
      const y = f.y + (ty - f.y) * e - Math.sin(k * Math.PI) * 80;
      const size = 44 - 26 * e;
      ctx.save();
      ctx.shadowColor = '#fff3a0';
      ctx.shadowBlur = 16;
      drawCrown(ctx, x, y, size, true, f.mine ? '#ffd84d' : '#ff8a8a');
      ctx.restore();
    }
  }
}
