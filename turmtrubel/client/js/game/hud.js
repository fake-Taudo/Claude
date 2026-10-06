// Match-HUD: Layout-Engine (hochkant · Seitenpanel · gedreht), Top-Bar bzw. Panel mit Timer, Kronen und Ping,
// Handkarten, Elixierleiste, Emote- und Fähigkeitsknopf, Banner und Kronenflug.
//
// Grundregel (B-01): Kein HUD-Element liegt über der Arena (L.arena). Zeichnen und Hit-Test lesen dieselben
// Rechtecke aus this.L – wer das Layout ändert, ändert automatisch beides.
import { EMOTES } from '/shared/protocol.js';
import { costLabel } from '/shared/cards.js';
import { cardArt, cardArtGray } from '../ui/art.js';
import { drawEmoteFace } from './sprites.js';
import { starPath } from './renderer.js';
import { T, reducedMotion } from '../ui/tokens.js';
import { OUTLINE, text, tnum, ellipsize, setFont, rr } from './canvastext.js';
import { paintPanel, paintWell, cardSprite, selectGlow, elixirOverlay, timerBox, crownSprite, emoteButton, teamPill } from './hudart.js';
import { softGlow } from '../design/light.js';

const TAU = Math.PI * 2;
const GAP = 6;
const PAD = 8;
const TAP = 44; // Mindest-Touchziel
export const RARITY_COLORS = { common: '#9fb3c8', rare: '#f39c3d', epic: '#b55cf0', legendary: '#2fd3c6', champion: '#ffd84d' };
export const CLASS_COLORS = { champion: '#ffd84d', hero: '#ff7a5c' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = (k) => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const easeBack = (k) => {
  k = clamp(k, 0, 1);
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
const inRect = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const inCircle = (c, x, y) => !!c && Math.hypot(x - c.x, y - c.y) <= c.r;
const circleRect = (c) => c && { x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2 };
const fmtTime = (tl) => `${Math.floor(tl / 60)}:${String(Math.floor(tl % 60)).padStart(2, '0')}`;

export function drawCrown(ctx, x, y, size, filled, color = T.gold.main) {
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
  ctx.fillStyle = filled ? color : 'rgba(20,14,40,0.55)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, size * 0.1);
  ctx.strokeStyle = OUTLINE;
  ctx.lineJoin = 'round';
  ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x - w * 0.35, y + h * 0.12, w * 0.7, h * 0.12);
  }
}

/** Elixier-Tropfen (eine Komponente für Karte, Leiste, Fähigkeit). tint 'red' = nicht bezahlbar.
 *  Wird als kleines Bild zwischengespeichert – Verlauf, Kontur und Zahl kosten sonst jeden Frame. */
const dropCache = new Map();
export function drawElixirDrop(ctx, x, y, r, label, tint = null) {
  const ps = Math.max(1, Math.round((ctx.getTransform?.().a || 1) * 2) / 2);
  const rq = Math.round(r * 2) / 2;
  const key = `${rq}|${label ?? ''}|${tint || ''}|${ps}`;
  let sp = dropCache.get(key);
  if (!sp) {
    const pad = Math.ceil(rq * 0.3) + 3;
    const w = Math.ceil(rq * 2.4 + pad * 2);
    const h = Math.ceil(rq * 2.3 + pad * 2);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(w * ps);
    cv.height = Math.ceil(h * ps);
    const c = cv.getContext('2d');
    c.scale(ps, ps);
    paintDrop(c, w / 2, pad + rq * 1.25, rq, label, tint);
    sp = { cv, w, h, ax: w / 2, ay: pad + rq * 1.25 };
    if (dropCache.size >= 300) dropCache.delete(dropCache.keys().next().value);
    dropCache.set(key, sp);
  }
  ctx.drawImage(sp.cv, x - sp.ax, y - sp.ay, sp.w, sp.h);
}

function paintDrop(ctx, x, y, r, label, tint) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.25);
  ctx.bezierCurveTo(x + r * 1.1, y - r * 0.1, x + r * 0.9, y + r, x, y + r);
  ctx.bezierCurveTo(x - r * 0.9, y + r, x - r * 1.1, y - r * 0.1, x, y - r * 1.25);
  const g = ctx.createLinearGradient(x, y - r, x, y + r);
  g.addColorStop(0, tint === 'red' ? '#ffb0bd' : T.elixir.light);
  g.addColorStop(1, tint === 'red' ? '#c2334f' : '#b02ee0');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  if (label != null) tnum(ctx, String(label), x, y + r * 0.15, Math.max(12, r * 1.25), '#ffffff', 'center', Math.max(2.5, r * 0.3));
}

/** Kleine Tastenkappe (nur bei Maus + Tastatur). */
function keycap(ctx, x, y, label) {
  setFont(ctx, 12);
  const w = Math.max(18, ctx.measureText(label).width + 10);
  rr(ctx, x - w / 2, y - 9, w, 18, 5);
  ctx.fillStyle = 'rgba(253,246,227,0.95)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  text(ctx, label, x, y + 1, 12, T.ink, 'center', 0);
}

let hatch = null;
function hatchPattern(ctx) {
  if (hatch) return hatch;
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const x = c.getContext('2d');
  x.strokeStyle = 'rgba(255,255,255,0.28)';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(-2, 10);
  x.lineTo(10, -2);
  x.stroke();
  hatch = ctx.createPattern(c, 'repeat');
  return hatch;
}

export class Hud {
  constructor(game) {
    this.game = game;
    this.L = null;
    this.emoteOpen = false;
    this.flash = { at: -9, slot: -1 };
    this.banners = [];
    this.crownFlights = [];
    this.crownTargets = { mine: [], opp: [] };
    this.crownSeen = [null, null];
    this.crownPop = [[], []];
    this.slotCards = [null, null, null, null];
    this.cycle = [null, null, null, null];
    this.affordPrev = [true, true, true, true];
    this.affordAt = [-9, -9, -9, -9];
    this.nextSeen = null;
    this.nextAt = -9;
    this.selAt = -9;
    this.lastSel = -1;
    this.oppFull = '';
    this.oppCut = false;
    this.deckHasAbility = (game.deck || []).some((id) => game.db.card(id)?.ability);
    this.fineInput = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  // ───────────── Layout ─────────────
  /**
   * Wählt den Modus mit der größten lesbaren Arena und legt alle HUD-Rechtecke fest.
   * pref: 'auto' | 'portrait' (hochkant, auf Querformat mit Seitenpanel) | 'rotated'
   */
  layout(w, h, pref = 'auto', safe = { t: 0, r: 0, b: 0, l: 0 }) {
    const P = this.planPortrait(w, h, safe);
    const S = w > h ? this.planPanel(w, h, safe, 'side') : null;
    const R = this.planPanel(w, h, safe, 'rotated');
    const vert = S && S.view.s > P.view.s ? S : P;
    let L;
    if (pref === 'rotated') L = R;
    else if (pref === 'portrait') L = vert;
    // Breite Fenster (Desktop, Handy quer): gedrehte Arena, sobald sie spürbar größer wird
    else L = R.view.s >= vert.view.s * (w / h >= 1.3 ? 1.1 : 1.35) ? R : vert;
    const view = this.game.view;
    Object.assign(view, L.view);
    L.arena = view.rect(0, 0, 18, 32);
    this.placeEmoteMenu(L);
    this.L = L;
    this.gradKey = '';
    // Version nur bei echter Layout-Änderung erhöhen (sonst würde die Hintergrund-Ebene unnötig neu gezeichnet)
    const sig = JSON.stringify([L.panel, L.topbar, L.cards, L.next, L.elixir, L.view]);
    if (sig !== this.layoutSig) {
      this.layoutSig = sig;
      this.version = (this.version || 0) + 1;
    }
    return L;
  }

  /** Hochkant: Top-Bar oben, Hand + Elixier unten. */
  planPortrait(w, h, safe) {
    const L = { mode: 'portrait', side: false, w, h };
    const showPing = this.game.app.settings.showPing;
    const topH = clamp(Math.round(h * 0.055), 46, 56);
    const availW = w - safe.l - safe.r - PAD * 2;
    const cw = Math.max(40, Math.min((availW - 4 * GAP) / 4.62, 112, (h * 0.14) / 1.26));
    const ch = cw * 1.26;
    const lift = 10;
    const plan = (btnRow) => {
      const rowB = btnRow ? TAP : clamp(Math.round(ch * 0.3), 26, 34);
      const handH = lift + ch + GAP + rowB + PAD + safe.b;
      const top = safe.t + topH;
      const availH = h - top - handH - 4;
      const s = Math.max(4, Math.min((w - safe.l - safe.r - 8) / 18, availH / 33.5));
      return { rowB, handH, top, availH, s };
    };
    let p = plan(false);
    // Passen Emote/Fähigkeit in die freien Streifen neben der Arena? Sonst in die Elixier-Zeile.
    const strip = (w - 18 * p.s) / 2 - Math.max(safe.l, safe.r);
    const inStrip = strip >= TAP + 8;
    if (!inStrip) p = plan(true);
    const s = p.s;
    const aw = 18 * s;
    const ah = 32 * s;
    const slack = Math.max(0, p.availH - 33.5 * s);
    const ox = Math.round(safe.l + (w - safe.l - safe.r - aw) / 2);
    const oy = Math.round(p.top + 2 + s * 1.5 + slack / 2);
    L.view = { mode: 'portrait', s, ox, oy };
    const arenaBottom = oy + ah;

    // Top-Bar: [≡] [Gegner: Name ♛♛♛] [Timer] [♛♛♛ Du] [Ping]
    L.topbar = { x: 0, y: 0, w, h: p.top };
    const cy = safe.t + topH / 2;
    L.menuBtn = { x: safe.l + 6, y: Math.round(cy - TAP / 2), w: TAP, h: TAP };
    const narrow = w < 480;
    const tw = narrow ? 64 : 86;
    const th = topH - 8;
    const gh = th - 2;
    let right = w - safe.r - 6;
    if (showPing) {
      const pw = narrow ? 22 : 64;
      L.ping = { x: right - pw, y: Math.round(cy - 12), w: pw, h: 24 };
      right = L.ping.x - GAP;
    }
    const meLabel = w >= 400 ? 'Du' : '';
    const meW = Math.round(this.groupWidth(gh, meLabel));
    let tx = Math.round(w / 2 - tw / 2);
    // Schmal: Timer nicht zentrieren, sondern rechts packen → mehr Platz für den Gegnernamen
    if (narrow) tx = right - meW - GAP - tw;
    L.timer = { x: tx, y: Math.round(cy - th / 2), w: tw, h: th };
    L.meGroup = { x: tx + tw + GAP, y: Math.round(cy - gh / 2), w: Math.max(40, Math.min(meW, right - (tx + tw + GAP))), h: gh, crowns: 'start', label: meLabel };
    const ogx = L.menuBtn.x + TAP + GAP;
    L.oppGroup = { x: ogx, y: Math.round(cy - gh / 2), w: tx - GAP - ogx, h: gh, crowns: 'end' };

    // Hand-Panel: Zeile A = Nächste + 4 Karten, Zeile B = Elixier (+ Knöpfe)
    L.panel = { x: 0, y: arenaBottom + 2, w, h: h - arenaBottom - 2 };
    const nw = cw * 0.62;
    const nh = ch * 0.62;
    const totalW = nw + GAP + 4 * cw + 3 * GAP;
    const x0 = Math.round((w - totalW) / 2);
    const rowBy = h - safe.b - PAD - p.rowB;
    const cardsY = rowBy - GAP - ch;
    L.cards = [0, 1, 2, 3].map((i) => ({ x: x0 + nw + GAP + i * (cw + GAP), y: cardsY, w: cw, h: ch }));
    L.next = { x: x0, y: cardsY + ch - nh, w: nw, h: nh };
    L.nextLabel = { x: x0 + nw / 2, y: L.next.y - 9 };
    let barR = L.cards[3].x + cw;
    const by = rowBy + p.rowB / 2;
    if (inStrip) {
      L.emoteBtn = { x: Math.round(safe.l + (ox - safe.l) / 2), y: Math.round(arenaBottom - TAP / 2 - 4), r: TAP / 2 };
      if (this.deckHasAbility) L.abilityBtn = { x: Math.round(ox + aw + (w - safe.r - ox - aw) / 2), y: Math.round(arenaBottom - TAP / 2 - 6), r: TAP / 2 + 2 };
    } else {
      L.emoteBtn = { x: barR - TAP / 2, y: by, r: TAP / 2 };
      barR -= TAP + GAP;
      if (this.deckHasAbility) {
        L.abilityBtn = { x: barR - TAP / 2, y: by, r: TAP / 2 };
        barR -= TAP + GAP;
      }
    }
    const barH = clamp(Math.round(p.rowB * 0.72), 18, 26);
    L.elixir = { x: L.cards[0].x, y: Math.round(by - barH / 2), w: barR - L.cards[0].x, h: barH };
    const dr = Math.min(p.rowB * 0.42, nw * 0.45, 16);
    L.drop = { x: L.cards[0].x - GAP - dr * 0.95, y: by + 1, r: dr };
    // Toast direkt über der Hand (unterer Arenarand), nie über Gegnerturm oder Kampfgeschehen
    L.toast = { x: w / 2, y: cardsY - lift - 2, w: Math.min(aw - 16, 420) };
    return L;
  }

  /** Arena links (hochkant = 'side' oder gedreht = 'rotated'), Panel rechts. */
  planPanel(w, h, safe, kind) {
    const L = { mode: kind === 'rotated' ? 'rotated' : 'portrait', side: kind === 'side', w, h };
    const ph = h - safe.t - safe.b;
    const hdrH = TAP;
    const oppH = 36;
    const botH = TAP;
    const labelH = 14;
    // Genug Höhe → beide Kronengruppen als Punktestand direkt unter dem Timer
    const stack = ph >= 560;
    const fixed = PAD + hdrH + GAP + oppH + GAP + (stack ? oppH + GAP : 0) + GAP + labelH + GAP + botH + PAD;
    // Kartenhöhe aus der Panelhöhe: 2 Kartenreihen + Nächste-Zeile (mind. 44 px)
    const room = ph - fixed - GAP;
    const chMax = room / 2.5 >= 88 ? room / 2.5 : (room - 44) / 2;
    const cwCap = clamp(h * 0.155, 100, 150);
    let cw = Math.max(40, Math.min(chMax / 1.26, cwCap));
    let pw = Math.max(212, Math.round(2 * cw + GAP + 2 * PAD));
    pw = Math.min(pw, Math.round(w * 0.38));
    cw = Math.min(cw, (pw - GAP - 2 * PAD) / 2);
    const aTiles = kind === 'rotated' ? [32, 18.8] : [18, 33.5];
    const areaW = () => w - safe.l - safe.r - pw - 3 * GAP;
    let s = Math.max(4, Math.min(areaW() / aTiles[0], (ph - 4) / aTiles[1]));
    if (kind === 'side') {
      // Hochkant-Arena lässt seitlich Platz → Panel und Karten dürfen wachsen
      const spare = areaW() - 18 * s;
      if (spare > 0) {
        pw = Math.min(pw + spare, Math.round(2 * 150 + GAP + 2 * PAD), Math.round(w * 0.38));
        cw = Math.max(40, Math.min((pw - GAP - 2 * PAD) / 2, chMax / 1.26));
        s = Math.max(4, Math.min(areaW() / 18, (ph - 4) / 33.5));
      }
    }
    const ch = cw * 1.26;
    const aw = aTiles[0] * s;
    const ah = (kind === 'rotated' ? 18 : 32) * s;
    const over = (kind === 'rotated' ? 0.8 : 1.5) * s;
    const ox = Math.round(safe.l + GAP + (areaW() + GAP - aw) / 2);
    const oy = Math.round(safe.t + over + Math.max(0, (ph - ah - over) / 2));
    L.view = { mode: kind === 'rotated' ? 'rotated' : 'portrait', s, ox, oy };

    const px0 = w - safe.r - pw;
    L.panel = { x: px0, y: 0, w: pw + safe.r, h };
    const px = px0 + PAD;
    const iw = pw - 2 * PAD;
    const top = safe.t + PAD;
    // Kopf: [≡] [Timer] [Ping]
    L.menuBtn = { x: px, y: top, w: TAP, h: TAP };
    const showPing = this.game.app.settings.showPing;
    let hr = px + iw;
    if (showPing) {
      const pw2 = iw >= 200 ? 64 : 24;
      L.ping = { x: hr - pw2, y: top + hdrH / 2 - 12, w: pw2, h: 24 };
      hr = L.ping.x - GAP;
    }
    const tx0 = px + TAP + GAP;
    const tw = Math.min(110, hr - tx0);
    L.timer = { x: Math.round(tx0 + (hr - tx0 - tw) / 2), y: top + 2, w: tw, h: hdrH - 4 };
    // Gegner-Zeile
    L.oppGroup = { x: px, y: top + hdrH + GAP, w: iw, h: oppH, crowns: 'end' };
    // Fußzeile: [♛♛♛ Du] [Fähigkeit] [Emote]
    const botY = h - safe.b - PAD - botH;
    L.emoteBtn = { x: px + iw - TAP / 2, y: botY + botH / 2, r: TAP / 2 };
    let fr = px + iw - TAP - GAP;
    if (this.deckHasAbility) {
      L.abilityBtn = { x: fr - TAP / 2, y: botY + botH / 2, r: TAP / 2 };
      fr -= TAP + GAP;
    }
    L.meGroup = stack ? { x: px, y: L.oppGroup.y + oppH + GAP, w: iw, h: oppH, crowns: 'end', label: 'Du' } : { x: px, y: botY + (botH - oppH) / 2, w: fr - px, h: oppH, crowns: 'end', label: 'Du' };
    // Karten (unten verankert, Daumen-nah) + Nächste-Zeile
    const nh = Math.max(44, ch * 0.5);
    const nw = nh / 1.26;
    const nextY = botY - GAP - nh;
    const gridW = 2 * cw + GAP;
    const gx = Math.round(px + (iw - gridW) / 2);
    const gy = Math.round(nextY - labelH - GAP - (2 * ch + GAP));
    L.cards = [0, 1, 2, 3].map((i) => ({ x: gx + (i % 2) * (cw + GAP), y: gy + Math.floor(i / 2) * (ch + GAP), w: cw, h: ch }));
    L.next = { x: gx, y: nextY, w: nw, h: nh };
    L.nextLabel = { x: gx + nw / 2, y: nextY - 8 };
    const barH = clamp(Math.round(nh * 0.5), 18, 26);
    const dr = Math.min(barH * 0.7, 16);
    L.drop = { x: gx + nw + GAP + dr * 1.05, y: nextY + nh / 2 + 1, r: dr };
    const bx = L.drop.x + dr + 4;
    L.elixir = { x: bx, y: Math.round(nextY + nh / 2 - barH / 2), w: gx + gridW - bx, h: barH };
    // Toast über den Karten, innerhalb des Panels
    L.toast = { x: px + iw / 2, y: gy - 10, w: iw };
    return L;
  }

  /** Natürliche Breite einer Kronengruppe (3 Kronen + optionales Label). */
  groupWidth(h, label) {
    const cs = clamp(h * 0.58, 12, 22);
    const padX = Math.max(8, h * 0.28);
    return padX * 2 + cs * 3.3 + (label ? 30 : 0);
  }

  /** Emote-Auswahl (3×2) oberhalb des Emote-Knopfs, im Bildschirm gehalten. */
  placeEmoteMenu(L) {
    const b = L.emoteBtn;
    const r = TAP / 2;
    const gap = 8;
    const mw = 3 * TAP + 2 * gap + 20;
    const mh = 2 * TAP + gap + 20;
    const mx = clamp(b.x - mw + r + 10, 6, L.w - mw - 6);
    let my = b.y - b.r - 10 - mh;
    if (my < 6) my = b.y + b.r + 10;
    L.emoteMenu = { x: mx, y: my, w: mw, h: mh };
    L.emoteItems = EMOTES.map((_, i) => ({ x: mx + 10 + r + (i % 3) * (TAP + gap), y: my + 10 + r + Math.floor(i / 3) * (TAP + gap), r }));
  }

  /** Benannte HUD-Rechtecke (für tools/ui-shots.mjs: nichts davon darf die Arena überdecken). */
  blocks() {
    const L = this.L;
    const o = { topbar: L.topbar, panel: L.panel, menu: L.menuBtn, timer: L.timer, oppGroup: L.oppGroup, meGroup: L.meGroup, ping: L.ping, next: L.next, elixir: L.elixir, emote: circleRect(L.emoteBtn), ability: circleRect(L.abilityBtn) };
    L.cards.forEach((r, i) => (o['card' + i] = r));
    return o;
  }

  toastAnchor() {
    return this.L?.toast;
  }

  inArena(x, y) {
    return inRect(this.L.arena, x, y);
  }

  hit(x, y) {
    const L = this.L;
    const g = this.game;
    if (this.emoteOpen) {
      for (let i = 0; i < L.emoteItems.length; i++) if (inCircle(L.emoteItems[i], x, y)) return { type: 'emoteItem', index: i };
      if (inRect(L.emoteMenu, x, y)) return { type: 'panel' };
    }
    if (inCircle(L.emoteBtn, x, y)) return { type: 'emote' };
    if (g.me?.ab && inCircle(L.abilityBtn, x, y)) return { type: 'ability' };
    for (let i = 0; i < 4; i++) {
      const r = L.cards[i];
      const lift = g.sel === i ? 10 : 0;
      if (inRect({ x: r.x - 3, y: r.y - lift - 3, w: r.w + 6, h: r.h + lift + 6 }, x, y)) return { type: 'card', index: i };
    }
    if (inRect(L.oppGroup, x, y)) return { type: 'oppName' };
    if (inRect(L.panel, x, y) || inRect(L.topbar, x, y)) return { type: 'panel' };
    if (this.inArena(x, y)) return { type: 'arena' };
    return { type: 'none' };
  }

  /** Zu wenig Elixier: Leiste 250 ms rot + Wackeln, Karte wackelt mit. */
  flashElixir(slot = -1) {
    this.flash = { at: this.game.clock, slot };
  }

  /** opts: { kind: 'card' | 'phase' | 'end', team: 'blue' | 'red', cardId } */
  banner(textStr, color = '#ffffff', sub = '', opts = {}) {
    const kind = opts.kind || 'phase';
    const dur = kind === 'card' ? 1.2 : kind === 'end' ? 2.6 : 2.2;
    this.banners = this.banners.filter((b) => !(b.kind === kind && b.text === textStr));
    this.banners.push({ text: textStr, color, sub, at: this.game.clock, kind, team: opts.team, cardId: opts.cardId, dur });
  }

  flyCrown(fromX, fromY, mine) {
    this.crownFlights.push({ x: fromX, y: fromY, mine, at: this.game.clock });
  }

  // ───────────── Zeichnen ─────────────
  draw(ctx, now, dt) {
    const g = this.game;
    const L = this.L;
    if (!L) return;
    this.rm = reducedMotion();
    this.hi = g.app.settings.quality !== 'low';
    this.drawPanels(ctx);
    const me = g.me;
    if (g.sel !== this.lastSel) {
      this.lastSel = g.sel;
      this.selAt = now;
    }
    if (me) {
      const elixir = g.elixirNow();
      this.trackHand(me, elixir, now);
      this.drawNext(ctx, L.next, me, now);
      for (let i = 0; i < 4; i++) if (g.sel !== i) this.drawHandCard(ctx, i, L.cards[i], me, elixir, now);
      if (g.sel >= 0) this.drawHandCard(ctx, g.sel, L.cards[g.sel], me, elixir, now);
      this.drawElixirBar(ctx, L.elixir, elixir, now);
    }
    this.drawTimer(ctx, now);
    this.drawGroups(ctx, now);
    this.drawPing(ctx);
    this.drawEmoteButton(ctx, now);
    if (L.abilityBtn) me?.ab ? this.drawAbility(ctx, me.ab, now) : this.drawAbilitySlot(ctx);
    this.drawBanners(ctx, now);
    this.drawCrownFlights(ctx, now);
    this.drawEmoteMenu(ctx, now);
  }

  /**
   * Statische HUD-Teile (Panels, Kartenmulden, Elixier-Rinne) in die Hintergrund-Ebene zeichnen –
   * einmal je Layout statt jeden Frame (siehe Renderer.renderBackground).
   */
  paintStatic(c) {
    const L = this.L;
    if (!L) return;
    const P = L.panel;
    paintPanel(c, P.x, P.y, P.w, P.h, L.topbar ? 'top' : 'left');
    if (L.topbar) paintPanel(c, 0, 0, L.topbar.w, L.topbar.h, 'bottom');
    for (const r of L.cards) paintWell(c, r.x - 3, r.y - 3, r.w + 6, r.h + 6, Math.max(8, r.w * 0.14));
    paintWell(c, L.next.x - 2, L.next.y - 2, L.next.w + 4, L.next.h + 4, 8);
    const e = L.elixir;
    paintWell(c, e.x - 2, e.y - 2, e.w + 4, e.h + 4, (e.h + 4) / 2);
    this.staticPainted = this.version;
  }

  drawPanels(ctx) {
    const L = this.L;
    // Panels liegen bereits in der Hintergrund-Ebene
    if (this.staticPainted === this.version) return;
    const P = L.panel;
    if (this.gradKey !== `${L.w}x${L.h}${L.mode}${L.side}`) {
      this.gradKey = `${L.w}x${L.h}${L.mode}${L.side}`;
      const g1 = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
      g1.addColorStop(0, '#3b2f7a');
      g1.addColorStop(1, T.bg800);
      this.gPanel = g1;
      if (L.topbar) {
        const g2 = ctx.createLinearGradient(0, 0, 0, L.topbar.h);
        g2.addColorStop(0, T.bg800);
        g2.addColorStop(1, '#3b2f7a');
        this.gTop = g2;
      }
      this.gFill = null;
    }
    ctx.fillStyle = this.gPanel;
    ctx.fillRect(P.x, P.y, P.w, P.h);
    ctx.fillStyle = OUTLINE;
    if (L.topbar) {
      ctx.fillRect(P.x, P.y, P.w, 3);
      ctx.fillStyle = this.gTop;
      ctx.fillRect(0, 0, L.topbar.w, L.topbar.h);
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(0, L.topbar.h - 3, L.topbar.w, 3);
    } else ctx.fillRect(P.x, P.y, 3, P.h);
  }

  trackHand(me, elixir, now) {
    const g = this.game;
    for (let i = 0; i < 4; i++) {
      const id = me.h[i];
      const card = g.db.card(id);
      const cost = card ? g.handCost(i, card) : null;
      const ok = cost != null && elixir + 1e-6 >= cost && !(me.hr[i] > 0.01) && !g.pendingSlot.has(i);
      if (this.slotCards[i] !== id) {
        if (this.slotCards[i] != null) this.cycle[i] = { at: now };
        this.slotCards[i] = id;
        this.affordPrev[i] = ok;
        continue;
      }
      if (ok && !this.affordPrev[i]) this.affordAt[i] = now;
      this.affordPrev[i] = ok;
    }
    if (me.n !== this.nextSeen) {
      if (this.nextSeen != null) this.nextAt = now;
      this.nextSeen = me.n;
    }
  }

  drawCardFace(ctx, id, x, y, w, h, { evo = false, dim = 0, gray = 0, radius = 9 } = {}) {
    const g = this.game;
    const card = g.db.card(id);
    rr(ctx, x, y, w, h, radius);
    ctx.fillStyle = evo ? '#c77dff' : CLASS_COLORS[card?.class] || RARITY_COLORS[card?.rarity] || '#9fb3c8';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    const inset = Math.max(3, w * 0.05);
    ctx.save();
    rr(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, radius - 3);
    ctx.clip();
    ctx.drawImage(cardArt(g.db, id, evo), x + inset, y + inset, w - inset * 2, h - inset * 2);
    if (gray > 0) {
      ctx.globalAlpha *= gray;
      ctx.drawImage(cardArtGray(g.db, id, evo), x + inset, y + inset, w - inset * 2, h - inset * 2);
      ctx.globalAlpha /= gray;
    }
    if (dim > 0) {
      ctx.fillStyle = `rgba(20,16,40,${dim})`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  drawHandCard(ctx, i, r, me, elixir, now) {
    const g = this.game;
    const id = me.h[i];
    const card = g.db.card(id);
    if (!card) return;
    const selected = g.sel === i && !g.ended;
    const dragging = g.drag?.active && selected;
    const ready = !(me.hr[i] > 0.01) && !g.pendingSlot.has(i);
    // Kosten laut Server (Spiegel: letzte Karte + 1, Spirit Empress: je nach Elixier)
    const cost = g.handCost(i, card);
    const afford = cost != null && elixir + 1e-6 >= cost;
    const evoInfo = me.ev?.[i];
    const evoReady = Array.isArray(evoInfo) && evoInfo[0] >= evoInfo[1];
    if (dragging) {
      // Platzhalter bleibt als leerer Slot
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2.5;
      rr(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 9);
      ctx.stroke();
      ctx.restore();
      return;
    }
    let x = r.x;
    let y = r.y;
    let w = r.w;
    let h = r.h;
    let alpha = 1;
    // Zyklus: neue Karte gleitet aus „Nächste“ in den Slot (250 ms)
    const cyc = this.cycle[i];
    if (cyc) {
      const k = (now - cyc.at) / 0.25;
      if (k >= 1) this.cycle[i] = null;
      else if (this.rm) alpha = Math.max(0.2, k);
      else {
        const e = easeOut(k);
        const n = this.L.next;
        x = n.x + (r.x - n.x) * e;
        y = n.y + (r.y - n.y) * e;
        w = n.w + (r.w - n.w) * e;
        h = n.h + (r.h - n.h) * e;
      }
    }
    // Fehlversuch: Karte wackelt mit der Leiste
    if (this.flash.slot === i && !this.rm) {
      const k = (now - this.flash.at) / 0.25;
      if (k >= 0 && k < 1) x += Math.sin(k * Math.PI * 6) * 4 * (1 - k);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    // Sprite immer in Slot-Größe; Zwischengrößen (Zyklus) per Transformation
    if (w !== r.w || h !== r.h) {
      ctx.translate(x, y);
      ctx.scale(w / r.w, h / r.h);
      x = 0;
      y = 0;
      w = r.w;
      h = r.h;
    }
    if (selected) {
      // Ausgewählt: 10 px Lift, Skalierung 1.06, Teamfarben-Glow
      const k = this.rm ? 1 : easeOut((now - this.selAt) / 0.12);
      const sc = 1 + 0.06 * k;
      const cx = x + w / 2;
      const cy = y + h / 2 - 10 * k;
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-w / 2, -h / 2);
      x = 0;
      y = 0;
    }
    const dpr = g.spriteDpr;
    const pips = !evoReady && Array.isArray(evoInfo) ? [evoInfo[0], evoInfo[1]] : null;
    const cls = card.class;
    const colorSp = cardSprite(g.db, id, w, h, { evo: evoReady, cost, pips, dpr });
    if (selected && this.hi) {
      const gl = selectGlow(w, h, dpr);
      ctx.drawImage(gl.cv, x - 14, y - 14, gl.w, gl.h);
    }
    if (ready && afford) ctx.drawImage(colorSp.cv, x - colorSp.ox, y - colorSp.oy, colorSp.w, colorSp.h);
    else {
      // Zu wenig Elixier: Graustufen; die Farbe füllt sich von unten mit dem Elixier-Fortschritt
      const graySp = cardSprite(g.db, id, w, h, { evo: evoReady, cost, pips, dpr, gray: true, tint: ready ? 'red' : 'gray' });
      ctx.drawImage(graySp.cv, x - graySp.ox, y - graySp.oy, graySp.w, graySp.h);
      const frac = ready && cost > 0 ? clamp(elixir / cost, 0, 1) : 0;
      if (frac > 0.02) {
        const fh = h * frac;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 2, y + h - fh, w + 4, fh + 4);
        ctx.clip();
        ctx.globalAlpha *= 0.85;
        ctx.drawImage(colorSp.cv, x - colorSp.ox, y - colorSp.oy, colorSp.w, colorSp.h);
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(x + 3, y + h - fh - 1, w - 6, 2);
      }
      if (!ready) {
        ctx.fillStyle = 'rgba(10,8,30,0.45)';
        rr(ctx, x, y, w, h, Math.max(6, w * 0.12));
        ctx.fill();
      }
    }
    // Bezahlbar geworden: Glanzstreifen läuft über die Karte, kurzer Pop
    const ga = now - this.affordAt[i];
    if (ga >= 0 && ga < 0.45) {
      ctx.save();
      rr(ctx, x, y, w, h, 9);
      ctx.clip();
      if (this.rm) {
        ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ga / 0.45)})`;
        ctx.fillRect(x, y, w, h);
      } else {
        const gx = x - w + (ga / 0.45) * w * 2.4;
        const gr = ctx.createLinearGradient(gx, y, gx + w * 0.5, y + h * 0.4);
        gr.addColorStop(0, 'rgba(255,255,255,0)');
        gr.addColorStop(0.5, 'rgba(255,255,255,0.75)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gr;
        ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
    }
    if (evoReady) {
      ctx.save();
      ctx.globalAlpha = this.rm ? 0.8 : 0.6 + Math.sin(now * 6) * 0.3;
      ctx.strokeStyle = '#ffb8ff';
      ctx.lineWidth = 3;
      rr(ctx, x - 2.5, y - 2.5, w + 5, h + 5, Math.max(8, w * 0.14));
      ctx.stroke();
      ctx.restore();
      text(ctx, 'EVO', x + w / 2, y + h - Math.max(9, w * 0.13), Math.max(12, w * 0.2), '#ffd6ff');
    }
    if (selected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      rr(ctx, x - 1.5, y - 1.5, w + 3, h + 3, Math.max(8, w * 0.13));
      ctx.stroke();
    }
    void cls;
    if (this.fineInput && w >= 56) keycap(ctx, x + w - 13, y + h - 13, String(i + 1));
    ctx.restore();
  }

  drawNext(ctx, r, me, now) {
    const g = this.game;
    if (!me.n) return;
    const L = this.L;
    text(ctx, 'Nächste', L.nextLabel.x, L.nextLabel.y, 12, '#ddd6ff', 'center', 3);
    const nev = me.nev;
    const evoReady = Array.isArray(nev) && nev[0] >= nev[1];
    const card = g.db.card(me.n);
    const k = this.rm ? 1 : clamp((now - this.nextAt) / 0.25, 0, 1);
    ctx.save();
    ctx.globalAlpha = k;
    if (card) {
      const sp = cardSprite(g.db, me.n, r.w, r.h, { evo: evoReady, cost: costLabel(card), dpr: g.spriteDpr, radius: 7 });
      ctx.drawImage(sp.cv, r.x - sp.ox, r.y - sp.oy, sp.w, sp.h);
    }
    ctx.restore();
  }

  drawElixirBar(ctx, r, elixir, now) {
    const g = this.game;
    const L = this.L;
    const fk = (now - this.flash.at) / 0.25;
    const flashing = fk >= 0 && fk < 1;
    const sx = flashing && !this.rm ? Math.sin(fk * Math.PI * 6) * 5 * (1 - fk) : 0;
    const dbl = g.snapMult > 1;
    ctx.save();
    ctx.translate(sx, 0);
    if (this.staticPainted !== this.version) {
      rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
      ctx.fillStyle = T.bg900;
      ctx.fill();
    }
    const k = clamp(elixir / 10, 0, 1);
    const xAt = (v) => r.x + (r.w * clamp(v, 0, 10)) / 10;
    ctx.save();
    rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.clip();
    if (k > 0) {
      // Flüssigkeit: Verlauf (bei Doppel-Elixier heller), Oberflächenwelle, Glanzlinie, aufsteigende Blasen
      const key = dbl ? 'd' : 'n';
      if (!this.gFill || this.gFillKey !== key) {
        const gr = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
        gr.addColorStop(0, dbl ? '#ffd0ff' : '#ff9af0');
        gr.addColorStop(0.45, dbl ? '#f05cff' : '#d13cf0');
        gr.addColorStop(1, dbl ? '#a02ee0' : '#7a1fb5');
        this.gFill = gr;
        this.gFillKey = key;
      }
      const fw = r.w * k;
      ctx.fillStyle = this.gFill;
      ctx.fillRect(r.x, r.y, fw, r.h);
      // Welle an der Vorderkante
      if (k < 1 && !this.rm) {
        const wx = r.x + fw;
        ctx.beginPath();
        ctx.moveTo(wx - 2, r.y);
        ctx.quadraticCurveTo(wx + 4 + Math.sin(now * 7) * 2.5, r.y + r.h * 0.5, wx - 2, r.y + r.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(r.x + 4, r.y + r.h * 0.2, Math.max(0, fw - 8), Math.max(1.5, r.h * 0.12));
      if (this.hi && !this.rm) {
        const n = dbl ? 9 : 6;
        ctx.fillStyle = 'rgba(255,240,255,0.55)';
        for (let i = 0; i < n; i++) {
          const ph = (now * (dbl ? 0.9 : 0.55) + i * 0.37) % 1;
          const bx = r.x + ((i * 0.618 + Math.floor(now * 0.2 + i) * 0.27) % 1) * fw;
          const by = r.y + r.h * (1 - ph);
          ctx.beginPath();
          ctx.arc(bx, by, Math.max(1, r.h * (0.06 + (i % 3) * 0.025)), 0, TAU);
          ctx.fill();
        }
      }
    }
    // Kostenmarker der gewählten Karte: fehlender Bereich schraffiert
    const selCard = g.sel >= 0 && g.me && !g.ended ? g.db.card(g.me.h[g.sel]) : null;
    const selCost = selCard ? g.handCost(g.sel, selCard) : null;
    if (selCost != null && selCost > elixir) {
      const x0 = xAt(elixir);
      const x1 = xAt(selCost);
      ctx.fillStyle = 'rgba(10,6,30,0.45)';
      ctx.fillRect(x0, r.y, x1 - x0, r.h);
      ctx.fillStyle = hatchPattern(ctx);
      ctx.fillRect(x0, r.y, x1 - x0, r.h);
    }
    if (flashing) {
      ctx.fillStyle = `rgba(229,72,77,${0.75 * (1 - fk)})`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.restore();
    // Glas-Fugen der 10 Segmente + Glanz (gecacht)
    const ov = elixirOverlay(r.w, r.h, g.spriteDpr);
    ctx.drawImage(ov.cv, r.x, r.y, ov.w, ov.h);
    rr(ctx, r.x, r.y, r.w, r.h, r.h / 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    // Voll: weicher Puls
    if (k >= 1) {
      const gl = softGlow(dbl ? '#ffb8ff' : '#ff9af0', r.h * 1.6 * g.spriteDpr, 0.4);
      ctx.globalAlpha = this.rm ? 0.5 : 0.35 + Math.sin(now * 4) * 0.25;
      ctx.drawImage(gl, r.x - r.h * 0.6, r.y - r.h * 0.8, r.w + r.h * 1.2, r.h * 2.6);
      ctx.globalAlpha = 1;
    }
    if (selCost != null) {
      const mx = xAt(selCost);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      rr(ctx, mx - 2, r.y - 5, 4, r.h + 10, 2);
      ctx.fill();
      ctx.stroke();
    }
    if (dbl) tnum(ctx, '×' + g.snapMult, r.x + r.w - 6, r.y + r.h / 2 + 1, Math.max(12, r.h * 0.72), T.gold.light, 'right', 3);
    ctx.restore();
    const d = L.drop;
    // Elixierzahl im großen Tropfen (Pop, wenn sich die ganze Zahl ändert)
    const whole = Math.floor(elixir);
    if (whole !== this.elxWhole) {
      if (this.elxWhole != null && whole > this.elxWhole) this.elxPopAt = now;
      this.elxWhole = whole;
    }
    const pk = this.rm ? 1 : clamp((now - (this.elxPopAt ?? -9)) / 0.22, 0, 1);
    const ps = 1 + 0.18 * Math.sin(pk * Math.PI);
    ctx.save();
    ctx.translate(d.x + sx, d.y);
    ctx.scale(ps, ps);
    drawElixirDrop(ctx, 0, 0, d.r * 1.08, whole);
    ctx.restore();
  }

  drawTimer(ctx, now) {
    const g = this.game;
    const r = this.L.timer;
    const tl = g.timeLeftNow();
    const ot = g.phase === 'o';
    const low = tl <= 10 && !g.ended;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.save();
    // Letzte 10 s: rot + Puls je Sekunde (nur Transform)
    if (low && !this.rm) {
      const frac = tl % 1;
      const p = frac > 0.7 ? (frac - 0.7) / 0.3 : 0;
      const sc = 1 + 0.1 * Math.sin(p * Math.PI);
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-cx, -cy);
    }
    const box = timerBox(r.w, r.h, low ? 'low' : ot ? 'ot' : 'normal', g.spriteDpr);
    ctx.drawImage(box.cv, r.x - 2, r.y - 2, box.w, box.h);
    const color = low ? '#ff4d57' : ot ? '#ffcf6b' : '#ffffff';
    const withLabel = r.h >= 38;
    if (withLabel) {
      text(ctx, ot ? 'Verlängerung' : 'Restzeit', cx, r.y + r.h * 0.26, clamp(r.h * 0.24, 10, 13), '#fff3c4', 'center', 2.5);
      tnum(ctx, fmtTime(tl), cx, r.y + r.h * 0.64, clamp(r.h * 0.5, 18, 28), color, 'center', 3.5);
    } else tnum(ctx, fmtTime(tl), cx, cy + 1, clamp(r.h * 0.62, 18, 30), color, 'center', 3.5);
    ctx.restore();
    // Doppel-/Dreifach-Elixier: Tropfen-Abzeichen unter der Box
    if (g.snapMult > 1) {
      const bx = r.x + r.w - 2;
      const by = r.y + r.h + 2;
      drawElixirDrop(ctx, bx, by, 10, '×' + g.snapMult);
    }
  }

  drawGroups(ctx, now) {
    const g = this.game;
    const opp = 1 - g.side;
    const flightDelay = (mine) => (this.crownFlights.some((f) => f.mine === mine && now - f.at < 1) ? 0.95 : 0);
    for (const [k, side] of [[0, g.side], [1, opp]]) {
      const c = g.crowns[side] || 0;
      if (this.crownSeen[k] == null) this.crownSeen[k] = c;
      while (this.crownSeen[k] < c) this.crownPop[k][this.crownSeen[k]++] = now + flightDelay(k === 0);
      this.crownSeen[k] = Math.min(this.crownSeen[k], c);
    }
    const full = g.names[opp] || 'Gegner';
    this.drawGroup(ctx, this.L.oppGroup, 'red', full, g.crowns[opp] || 0, 1, now, true);
    this.drawGroup(ctx, this.L.meGroup, 'blue', this.L.meGroup.label || '', g.crowns[g.side] || 0, 0, now, false);
  }

  drawGroup(ctx, r, team, label, count, k, now, isOpp) {
    const tc = team === 'red' ? T.red : T.blue;
    const g = this.game;
    ctx.save();
    void tc;
    const pill = teamPill(r.w, r.h, team, g.spriteDpr);
    ctx.drawImage(pill.cv, r.x - 2, r.y - 2, pill.w, pill.h);
    let cs = clamp(r.h * 0.58, 12, 22);
    let padX = Math.max(8, r.h * 0.28);
    const atEnd = r.crowns === 'end';
    // Wenig Breite (schmale Handys): Name oben, Kronen darunter – Name bleibt lesbar
    const two = !!label && isOpp && r.w - padX * 2 - cs * 3.3 - 6 < 70 && r.h >= 32;
    if (two) {
      cs = clamp(r.h * 0.36, 11, 15);
      padX = 10;
    }
    const step = cs * 1.15;
    const crownsW = step * 3 - (step - cs);
    const cx0 = atEnd ? r.x + r.w - padX - crownsW + cs / 2 : r.x + padX + cs / 2;
    const crownY = two ? r.y + r.h * 0.7 : r.y + r.h / 2 + 1;
    const targets = [];
    for (let i = 0; i < 3; i++) {
      const x = cx0 + i * step;
      const y = crownY;
      targets.push([x, y]);
      const filled = i < count;
      const pt = this.crownPop[k][i];
      const crown = (f) => {
        const sp = crownSprite(cs, f, g.spriteDpr);
        ctx.drawImage(sp.cv, -cs / 2 - 2, -cs * 0.39 - 2, sp.w, sp.h);
      };
      if (filled && pt != null && now < pt) {
        // Krone ist noch unterwegs → Slot leer zeigen
        ctx.save();
        ctx.translate(x, y);
        crown(false);
        ctx.restore();
        continue;
      }
      const sc = filled && pt != null && now - pt < 0.45 && !this.rm ? 0.6 + 0.4 * easeBack((now - pt) / 0.45) : 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sc, sc);
      crown(filled);
      // Glanz nach dem Gewinn
      if (filled && pt != null && now - pt < 0.7 && now >= pt) {
        ctx.globalAlpha = 1 - (now - pt) / 0.7;
        ctx.fillStyle = '#ffffff';
        starPath(ctx, cs * 0.3, -cs * 0.35, cs * 0.3);
        ctx.fill();
      }
      ctx.restore();
    }
    this.crownTargets[isOpp ? 'opp' : 'mine'] = targets;
    // Name / Label
    const size = two ? 12 : clamp(r.h * 0.46, 12, 18);
    const tx = two || atEnd ? r.x + padX : r.x + padX + crownsW + 6;
    const tMax = two ? r.w - padX * 2 : atEnd ? r.w - padX * 2 - crownsW - 6 : r.x + r.w - padX - tx;
    const ty = two ? r.y + r.h * 0.32 : r.y + r.h / 2 + 1;
    if (label && tMax > 14) {
      let dx = 0;
      if (isOpp && g.oppDisconnected) {
        text(ctx, '⚠', tx + 7, ty, size, T.gold.main, 'center', 2.5);
        dx = 16;
      }
      const e = ellipsize(ctx, label, size, tMax - dx);
      if (isOpp) {
        this.oppFull = label;
        this.oppCut = e.cut;
      }
      ctx.globalAlpha = isOpp && g.oppDisconnected ? 0.65 : 1;
      text(ctx, e.str, tx + dx, ty, size, '#ffffff', 'left', 3);
    }
    ctx.restore();
  }

  drawPing(ctx) {
    const g = this.game;
    const r = this.L.ping;
    if (!r || !g.app.settings.showPing) return;
    const p = g.ping == null ? null : Math.round(g.ping);
    const bad = g.netUnstable;
    const color = p == null ? '#9a93b8' : bad || p >= 120 ? T.danger : p >= 60 ? T.warn : T.ok;
    const bars = p == null ? 0 : bad || p >= 120 ? 1 : p >= 60 ? 2 : 3;
    const compact = r.w < 40;
    const ih = 14;
    const ix = r.x + (compact ? (r.w - 16) / 2 : 4);
    const iy = r.y + r.h / 2 + ih / 2;
    for (let i = 0; i < 3; i++) {
      const bh = ih * (0.4 + 0.3 * i);
      rr(ctx, ix + i * 6, iy - bh, 4.5, bh, 1.5);
      ctx.fillStyle = i < bars ? color : 'rgba(255,255,255,0.22)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
    }
    if (!compact) tnum(ctx, p == null ? '–' : `${p} ms`, r.x + r.w, r.y + r.h / 2 + 1, 13, color, 'right', 3);
    if (bad) text(ctx, '!', ix + 20, r.y + 4, 13, T.danger, 'center', 3);
  }

  drawEmoteButton(ctx, now) {
    const b = this.L.emoteBtn;
    const g = this.game;
    const cd = g.me?.emo || 0;
    const max = g.rules.emoteCooldown ?? 3;
    ctx.save();
    ctx.globalAlpha = cd > 0 ? 0.6 : 1;
    const sp = emoteButton(b.r - 2, this.emoteOpen, g.spriteDpr);
    ctx.drawImage(sp.cv, b.x - (b.r - 2) - 2, b.y - (b.r - 2) - 2, sp.w, sp.h);
    ctx.restore();
    if (cd > 0) {
      // Abklingzeit als Ring um den Knopf
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 2, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - clamp(cd / max, 0, 1)));
      ctx.lineWidth = 4;
      ctx.strokeStyle = T.blue.main;
      ctx.stroke();
    }
    if (this.fineInput) keycap(ctx, b.x + b.r * 0.72, b.y + b.r * 0.72, 'E');
  }

  drawEmoteMenu(ctx, now) {
    if (!this.emoteOpen) return;
    const L = this.L;
    const m = L.emoteMenu;
    ctx.save();
    ctx.shadowColor = 'rgba(10,6,30,0.4)';
    ctx.shadowBlur = this.hi ? 14 : 0;
    rr(ctx, m.x, m.y, m.w, m.h, 16);
    ctx.fillStyle = T.cream;
    ctx.fill();
    ctx.restore();
    rr(ctx, m.x, m.y, m.w, m.h, 16);
    ctx.lineWidth = 3;
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
    L.emoteItems.forEach((it, i) => {
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r - 2, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      drawEmoteFace(ctx, EMOTES[i].face, it.x, it.y, it.r * 0.66, now);
    });
  }

  /** Platz für die Fähigkeit, solange kein Champion/Held auf dem Feld steht. */
  drawAbilitySlot(ctx) {
    const b = this.L.abilityBtn;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r - 2, 0, TAU);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    starPath(ctx, b.x, b.y, b.r * 0.42);
    ctx.fill();
    ctx.restore();
  }

  drawAbility(ctx, ab, now) {
    const g = this.game;
    const b = this.L.abilityBtn;
    const champ = ab.cls === 'champion';
    // Seit 08/2026: Fähigkeiten pro Einsatz einmalig (Boss-Banditin zweimal mit Abklingzeit)
    const cdK = ab.max ? ab.cd / ab.max : 0;
    const afford = g.elixirNow() >= ab.cost;
    const ready = cdK <= 0 && afford && !ab.dep && ab.u > 0;
    ctx.save();
    if (ready) {
      ctx.globalAlpha = this.rm ? 0.6 : 0.45 + Math.sin(now * 6) * 0.25;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 5, 0, TAU);
      ctx.fillStyle = champ ? T.gold.main : '#ff9a7a';
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
    ctx.strokeStyle = champ ? T.gold.main : '#ff7a5c';
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 1.5, 0, TAU);
    ctx.stroke();
    if (ab.cost > 0) drawElixirDrop(ctx, b.x - b.r * 0.72, b.y - b.r * 0.62, Math.max(8, b.r * 0.3), ab.cost, afford ? null : 'red');
    if (cdK > 0) tnum(ctx, String(Math.ceil(ab.cd)), b.x, b.y + 2, Math.max(14, b.r * 0.7), '#ffffff');
    // Verbleibende Einsätze als Punkte unter dem Knopf (nur bei mehr als einem)
    if (ab.u > 1) {
      for (let i = 0; i < ab.u; i++) {
        ctx.beginPath();
        ctx.arc(b.x + (i - (ab.u - 1) / 2) * b.r * 0.32, b.y + b.r * 1.12, Math.max(3, b.r * 0.1), 0, TAU);
        ctx.fillStyle = champ ? T.gold.main : '#ff9a7a';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
      }
    }
    if (this.fineInput) keycap(ctx, b.x + b.r * 0.55, b.y + b.r * 0.8, '␣');
    ctx.restore();
  }

  /** Ankündigungen: Karten/Phasen als Banner am oberen Arenarand, Kampfende in der Mitte (B-03). */
  drawBanners(ctx, now) {
    const A = this.L.arena;
    const g = this.game;
    this.banners = this.banners.filter((b) => now - b.at < b.dur);
    let yTop = A.y + 8;
    for (const b of this.banners) {
      const age = now - b.at;
      const kIn = this.rm ? 1 : easeOut(age / 0.18);
      const fade = age > b.dur - 0.25 ? (b.dur - age) / 0.25 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(this.rm ? Math.min(1, age / 0.15) : 1, fade));
      if (b.kind === 'end') {
        const size = clamp(A.w * 0.09, 26, 54);
        const cx = A.x + A.w / 2;
        const cy = A.y + A.h * 0.45;
        const sc = this.rm ? 1 : 0.7 + 0.3 * easeBack(age / 0.35);
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        setFont(ctx, size);
        const w = Math.max(ctx.measureText(b.text).width + size * 1.4, size * 5);
        const hgt = size * (b.sub ? 2.3 : 1.6);
        rr(ctx, -w / 2, -size * 0.85, w, hgt, 18);
        ctx.fillStyle = 'rgba(26,20,51,0.94)';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        text(ctx, b.text, 0, 0, size, b.color, 'center', Math.max(4, size * 0.14));
        if (b.sub) text(ctx, b.sub, 0, size * 0.95, Math.max(13, size * 0.38), '#ffffff', 'center', 3);
        ctx.restore();
        continue;
      }
      const card = b.kind === 'card';
      const size = card ? clamp(A.w * 0.04, 14, 22) : clamp(A.w * 0.05, 16, 28);
      const subSize = Math.max(12, size * 0.55);
      setFont(ctx, size);
      const icon = card && b.cardId ? size * 1.6 : 0;
      let tw = ctx.measureText(b.text).width;
      if (b.sub) {
        setFont(ctx, subSize);
        tw = Math.max(tw, ctx.measureText(b.sub).width);
      }
      const hgt = card ? Math.max(icon * 1.25 + 8, size * 1.7) : size * (b.sub ? 2.4 : 1.7);
      const w = Math.min(A.w - 12, tw + size * 1.4 + (icon ? icon + 8 : 0));
      const x = A.x + A.w / 2 - w / 2;
      const y = yTop - (1 - kIn) * 10;
      const fill = card ? (b.team === 'red' ? T.red.dark : T.blue.dark) : b.color === '#ff9a3d' ? '#b4521a' : '#8a1fb5';
      rr(ctx, x, y, w, hgt, Math.min(hgt / 2, 18));
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      let tx = A.x + A.w / 2;
      if (icon) {
        const ix = x + 6;
        const iy = y + (hgt - icon * 1.25) / 2;
        ctx.save();
        rr(ctx, ix, iy, icon, icon * 1.25, 5);
        ctx.clip();
        ctx.drawImage(cardArt(g.db, b.cardId, false), ix, iy, icon, icon * 1.25);
        ctx.restore();
        tx += (icon + 8) / 2;
      }
      if (b.sub) {
        text(ctx, b.text, tx, y + hgt * 0.36, size, b.color, 'center', Math.max(3, size * 0.16));
        text(ctx, b.sub, tx, y + hgt * 0.74, subSize, '#ffffff', 'center', 3);
      } else text(ctx, b.text, tx, y + hgt / 2 + 1, size, card ? '#ffffff' : b.color, 'center', Math.max(3, size * 0.16));
      ctx.restore();
      yTop += hgt + 6;
    }
  }

  drawCrownFlights(ctx, now) {
    this.crownFlights = this.crownFlights.filter((f) => now - f.at < 1.0);
    const g = this.game;
    for (const f of this.crownFlights) {
      const list = f.mine ? this.crownTargets.mine : this.crownTargets.opp;
      const idx = clamp((g.crowns[f.mine ? g.side : 1 - g.side] || 1) - 1, 0, 2);
      const tgt = list?.[idx];
      if (!tgt) continue;
      const k = clamp((now - f.at) / 0.95, 0, 1);
      const e = easeOut(k);
      const x = f.x + (tgt[0] - f.x) * e;
      const y = f.y + (tgt[1] - f.y) * e - Math.sin(k * Math.PI) * 80;
      const size = 44 - 26 * e;
      ctx.save();
      if (this.hi) {
        ctx.shadowColor = '#fff3a0';
        ctx.shadowBlur = 16;
      }
      drawCrown(ctx, x, y, size, true);
      ctx.restore();
    }
  }

  /** Gezogene Karte: Kartenbild ÜBER dem Finger (Skalierung 1.1), damit der Daumen sie nicht verdeckt. */
  drawDrag(ctx) {
    const g = this.game;
    const p = g.pointer;
    if (!(g.drag?.active && g.sel >= 0 && p && g.me && !g.ended)) return;
    const r = this.L.cards[g.sel];
    const id = g.me.h[g.sel];
    const card = g.db.card(id);
    const inA = this.inArena(p.x, p.y);
    const sc = inA ? 0.55 : 1.1;
    const w = r.w * sc;
    const h = r.h * sc;
    const x = clamp(p.x - w / 2, 2, this.L.w - w - 2);
    const y = clamp(p.y - h - (inA ? g.view.s * 1.6 : 16), 2, this.L.h - h - 2);
    // Neigung nach Ziehrichtung, Schatten wächst mit dem Abheben
    const vx = p.x - (this.dragPrevX ?? p.x);
    this.dragPrevX = p.x;
    this.dragTilt = (this.dragTilt || 0) * 0.8 + clamp(vx * 0.012, -0.14, 0.14) * 0.2;
    const sp = cardSprite(g.db, id, r.w, r.h, { cost: card ? g.handCost(g.sel, card) ?? '?' : '?', dpr: g.spriteDpr });
    ctx.save();
    ctx.globalAlpha = inA ? 0.82 : 0.96;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(this.rm ? 0 : this.dragTilt);
    ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(5,8,25,0.35)';
    rr(ctx, -r.w / 2 + 6, -r.h / 2 + 12, r.w, r.h, 10);
    ctx.fill();
    ctx.drawImage(sp.cv, -r.w / 2 - sp.ox, -r.h / 2 - sp.oy, sp.w, sp.h);
    ctx.restore();
  }
}
