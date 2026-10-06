// Gecachte HUD-Grafiken im Vektor-Look (docs/STYLE_GUIDE.md §7): Panels, Kartenmulden, Karten mit
// Seltenheitsrahmen, Elixier-Rinne, Timer-Box, Kronen, Emote-Knopf. Alles wird einmal je Größe/Zustand
// als Canvas gerendert und danach nur kopiert – das HUD kostet pro Frame kaum Rasterzeit.
import { cardArt, cardArtGray } from '../ui/art.js';
import { RARITY, C } from '../design/tokens.js';
import { mixHex } from '../design/light.js';
import { tnum } from './canvastext.js';

const TAU = Math.PI * 2;
const INK = '#1c1830';
const cache = new Map();
function cached(key, w, h, dpr, draw) {
  let e = cache.get(key);
  if (e) {
    cache.delete(key);
    cache.set(key, e);
    return e;
  }
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * dpr));
  cv.height = Math.max(1, Math.ceil(h * dpr));
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  draw(c);
  e = { cv, w, h };
  cache.set(key, e);
  if (cache.size > 260) cache.delete(cache.keys().next().value);
  return e;
}
export function clearHudArt() {
  cache.clear();
}
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect ? c.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))) : c.rect(x, y, w, h);
}

// ───────────── Statische Ebene: Panels und Mulden ─────────────
/** Panel in Nachtblau: Verlauf, Rautenmuster, Lichtkante oben, Kontur. edge: 'top' | 'bottom' | 'left'. */
export function paintPanel(c, x, y, w, h, edge) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, C.night[600]);
  g.addColorStop(0.5, C.night[700]);
  g.addColorStop(1, C.night[800]);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // dezentes Rautenmuster
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.045)';
  c.lineWidth = 1;
  const step = 22;
  for (let d = -h; d < w + h; d += step) {
    c.beginPath();
    c.moveTo(x + d, y);
    c.lineTo(x + d + h, y + h);
    c.moveTo(x + d + h, y);
    c.lineTo(x + d, y + h);
    c.stroke();
  }
  c.restore();
  c.fillStyle = INK;
  if (edge === 'top') {
    c.fillRect(x, y, w, 3);
    c.fillStyle = 'rgba(147,169,242,0.55)';
    c.fillRect(x, y + 3, w, 2);
  } else if (edge === 'bottom') {
    c.fillRect(x, y + h - 3, w, 3);
    c.fillStyle = 'rgba(147,169,242,0.35)';
    c.fillRect(x, y + h - 5, w, 2);
  } else {
    c.fillRect(x, y, 3, h);
    c.fillStyle = 'rgba(147,169,242,0.45)';
    c.fillRect(x + 3, y, 2, h);
  }
}

/** Vertiefte Mulde (Kartenplatz, Elixier-Rinne): dunkel mit Innenschatten oben und Lichtkante unten. */
export function paintWell(c, x, y, w, h, r) {
  rr(c, x, y, w, h, r);
  c.fillStyle = C.night[900];
  c.fill();
  c.save();
  rr(c, x, y, w, h, r);
  c.clip();
  const g = c.createLinearGradient(0, y, 0, y + Math.min(h, 14));
  g.addColorStop(0, 'rgba(0,0,0,0.45)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x, y, w, Math.min(h, 14));
  c.restore();
  rr(c, x + 0.5, y + 0.5, w - 1, h - 1, r);
  c.lineWidth = 1.5;
  c.strokeStyle = 'rgba(147,169,242,0.28)';
  c.stroke();
  rr(c, x, y, w, h, r);
  c.lineWidth = 2;
  c.strokeStyle = INK;
  c.stroke();
}

// ───────────── Karten ─────────────
const CLASS_RARITY = { champion: 'champion', hero: 'hero' };
function frameColors(card, evo) {
  if (evo) return RARITY.evo;
  return RARITY[CLASS_RARITY[card?.class]] || RARITY[card?.rarity] || RARITY.common;
}

/** Elixier-Tropfen mit Verlauf, Glanz und Zahl (Vektor). */
export function paintDrop(c, x, y, r, label, tint = null) {
  c.beginPath();
  c.moveTo(x, y - r * 1.25);
  c.bezierCurveTo(x + r * 1.1, y - r * 0.1, x + r * 0.9, y + r, x, y + r);
  c.bezierCurveTo(x - r * 0.9, y + r, x - r * 1.1, y - r * 0.1, x, y - r * 1.25);
  const g = c.createLinearGradient(x - r, y - r, x + r * 0.6, y + r);
  g.addColorStop(0, tint === 'red' ? '#ffc0cb' : tint === 'gray' ? '#d6d2e0' : '#ffb3f6');
  g.addColorStop(0.5, tint === 'red' ? '#e24a68' : tint === 'gray' ? '#8a86a0' : C.elixir.main);
  g.addColorStop(1, tint === 'red' ? '#8e1f37' : tint === 'gray' ? '#56526a' : C.elixir.dark);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = Math.max(1.5, r * 0.17);
  c.strokeStyle = INK;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.6)';
  c.beginPath();
  c.ellipse(x - r * 0.38, y - r * 0.32, r * 0.18, r * 0.3, 0.5, 0, TAU);
  c.fill();
  if (label != null) tnum(c, String(label), x, y + r * 0.15, Math.max(11, r * 1.2), '#ffffff', 'center', Math.max(2.5, r * 0.3));
}

/**
 * Fertige Handkarte (Rahmen, Bild, Innenschatten, Glanz, Kosten, Evo-Kappe, Klassen-Marke) als Sprite.
 * opts: { evo, gray, cost, tint, pips: [haben, nötig] | null, cls, dpr, drop }
 * Rückgabe: { cv, w, h, ox, oy } – (ox, oy) = Versatz der Kartenecke im Sprite (Überstände).
 */
export function cardSprite(db, id, w, h, opts) {
  const { evo = false, gray = false, cost = null, tint = null, pips = null, dpr = 1, drop = true, radius = null } = opts;
  const card = db.card(id);
  const dr = drop ? Math.max(8, w * 0.18) : 0;
  const capH = pips ? Math.max(9, w * 0.17) : 0;
  const ox = dr ? dr * 0.55 : 2;
  const oy = Math.max(dr ? dr * 0.75 : 2, capH * 0.75);
  const key = ['card', id, Math.round(w), Math.round(h), evo ? 1 : 0, gray ? 1 : 0, cost ?? '', tint || '', pips ? pips.join('/') : '', dpr, drop ? 1 : 0].join('|');
  const e = cached(key, w + ox + 4, h + oy + 4, dpr, (c) => {
    c.translate(ox, oy);
    const R = radius ?? Math.max(6, w * 0.12);
    const col = frameColors(card, evo);
    // Schlagschatten
    rr(c, 1.5, 3, w, h, R);
    c.fillStyle = 'rgba(5,8,25,0.45)';
    c.fill();
    // Rahmen in Seltenheitsfarbe (legendär schillernd)
    rr(c, 0, 0, w, h, R);
    const g = c.createLinearGradient(0, 0, w, h);
    if (col.shimmer && !gray) {
      col.shimmer.forEach((s, i) => g.addColorStop(i / (col.shimmer.length - 1), s));
    } else {
      g.addColorStop(0, gray ? '#c9cbd6' : col.light);
      g.addColorStop(0.5, gray ? '#8f93a6' : col.main);
      g.addColorStop(1, gray ? '#5d6175' : col.dark);
    }
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = INK;
    c.stroke();
    // Bild
    const k = Math.max(3, w * 0.065);
    c.save();
    rr(c, k, k, w - k * 2, h - k * 2, R - k * 0.6);
    c.clip();
    c.drawImage(gray ? cardArtGray(db, id, evo) : cardArt(db, id, evo), k, k, w - k * 2, h - k * 2);
    // Innenschatten oben + Glanz diagonal
    const sh = c.createLinearGradient(0, k, 0, k + h * 0.16);
    sh.addColorStop(0, 'rgba(0,0,0,0.38)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sh;
    c.fillRect(k, k, w, h * 0.16);
    const gl = c.createLinearGradient(0, 0, w * 0.7, h * 0.55);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)');
    gl.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    gl.addColorStop(0.46, 'rgba(255,255,255,0)');
    c.fillStyle = gl;
    c.fillRect(k, k, w, h);
    if (gray) {
      c.fillStyle = 'rgba(15,18,40,0.22)';
      c.fillRect(0, 0, w, h);
    }
    c.restore();
    rr(c, k, k, w - k * 2, h - k * 2, R - k * 0.6);
    c.lineWidth = 1.5;
    c.strokeStyle = gray ? 'rgba(255,255,255,0.35)' : mixHex(col.light, '#ffffff', 0.4);
    c.stroke();
    // Evo-Kappe mit Kristall-Pips (Zyklus-Fortschritt)
    if (pips) {
      const cw = Math.max(w * 0.46, pips[1] * capH * 0.9 + capH * 0.6);
      const cx = w / 2;
      c.beginPath();
      c.moveTo(cx - cw / 2, 2);
      c.lineTo(cx - cw / 2 + capH * 0.35, -capH * 0.75);
      c.lineTo(cx + cw / 2 - capH * 0.35, -capH * 0.75);
      c.lineTo(cx + cw / 2, 2);
      c.closePath();
      const cg = c.createLinearGradient(0, -capH, 0, 2);
      cg.addColorStop(0, gray ? '#7d7a90' : '#9b5ce0');
      cg.addColorStop(1, gray ? '#4c4a5e' : '#5a2a9c');
      c.fillStyle = cg;
      c.fill();
      c.lineWidth = 1.8;
      c.strokeStyle = INK;
      c.stroke();
      const n = pips[1];
      for (let i = 0; i < n; i++) {
        const px = cx + (i - (n - 1) / 2) * capH * 0.9;
        const py = -capH * 0.3;
        const s = capH * 0.32;
        c.beginPath();
        c.moveTo(px, py - s);
        c.lineTo(px + s * 0.8, py);
        c.lineTo(px, py + s);
        c.lineTo(px - s * 0.8, py);
        c.closePath();
        c.fillStyle = i < pips[0] ? '#f08cff' : '#2a1f45';
        c.fill();
        c.lineWidth = 1.2;
        c.strokeStyle = i < pips[0] ? '#fff0ff' : INK;
        c.stroke();
      }
    }
    // Champion/Held: Marke oben rechts
    if (card?.class === 'champion' || card?.class === 'hero') {
      const mx = w - Math.max(7, w * 0.15);
      const my = Math.max(7, w * 0.15);
      const mr = Math.max(6, w * 0.12);
      c.beginPath();
      c.arc(mx, my, mr, 0, TAU);
      c.fillStyle = INK;
      c.fill();
      c.fillStyle = card.class === 'hero' ? '#ff9a7a' : '#ffd84d';
      c.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * TAU;
        const rr2 = i % 2 ? mr * 0.38 : mr * 0.8;
        c.lineTo(mx + Math.cos(a) * rr2, my + Math.sin(a) * rr2);
      }
      c.closePath();
      c.fill();
    }
    // Kosten-Tropfen (ragt über die Ecke)
    if (dr) paintDrop(c, dr * 0.45, dr * 0.5, dr, cost ?? '?', tint);
  });
  return { cv: e.cv, w: e.w, h: e.h, ox, oy };
}

/** Weicher Auswahl-Schein (Teamblau) um eine Karte, gecacht. */
export function selectGlow(w, h, dpr) {
  const m = 14;
  return cached('selglow|' + Math.round(w) + '|' + Math.round(h) + '|' + dpr, w + m * 2, h + m * 2, dpr, (c) => {
    for (let i = 6; i >= 1; i--) {
      rr(c, m - i * 2, m - i * 2, w + i * 4, h + i * 4, 12 + i * 2);
      c.fillStyle = `rgba(110,170,255,${0.07 * (7 - i) * 0.6})`;
      c.fill();
    }
  });
}

// ───────────── Elixier ─────────────
/** Segment-Fugen + Glanz der Elixierleiste als Overlay (Glas-Optik). */
export function elixirOverlay(w, h, dpr) {
  return cached('elxo|' + Math.round(w) + '|' + Math.round(h) + '|' + dpr, w, h, dpr, (c) => {
    for (let i = 1; i < 10; i++) {
      const x = Math.round((w * i) / 10);
      c.fillStyle = 'rgba(12,10,40,0.55)';
      c.fillRect(x - 1, 3, 2, h - 6);
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.fillRect(x + 1, 3, 1, h - 6);
    }
    rr(c, 3, 2, w - 6, h * 0.3, h * 0.15);
    c.fillStyle = 'rgba(255,255,255,0.16)';
    c.fill();
  });
}

// ───────────── Timer ─────────────
/** Timer-Box: dunkle Box mit Kontur und Lichtkante; Zustand 'normal' | 'low' | 'ot'. */
export function timerBox(w, h, state, dpr) {
  return cached('tbox|' + Math.round(w) + '|' + Math.round(h) + '|' + state + '|' + dpr, w + 4, h + 6, dpr, (c) => {
    c.translate(2, 2);
    rr(c, 0, 2, w, h, Math.min(12, h * 0.3));
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fill();
    rr(c, 0, 0, w, h, Math.min(12, h * 0.3));
    const g = c.createLinearGradient(0, 0, 0, h);
    const [a, b] = state === 'low' ? ['#5a1222', '#2a0810'] : state === 'ot' ? ['#6b2c0c', '#2e1205'] : ['#1f2350', '#0b0f2a'];
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = INK;
    c.stroke();
    rr(c, 3, 2.5, w - 6, h * 0.32, Math.min(9, h * 0.2));
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fill();
  });
}

// ───────────── Kronen ─────────────
/** Krone als Sprite: gewonnen (Gold mit Glanz) oder leerer Slot (dunkle Mulde). */
export function crownSprite(size, filled, dpr) {
  return cached('crown|' + Math.round(size * 2) + '|' + (filled ? 1 : 0) + '|' + dpr, size + 4, size * 0.85 + 4, dpr, (c) => {
    c.translate(2, 2);
    const w = size;
    const h = size * 0.78;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, h * 0.25);
    c.lineTo(w * 0.25, h * 0.55);
    c.lineTo(w * 0.5, 0);
    c.lineTo(w * 0.75, h * 0.55);
    c.lineTo(w, h * 0.25);
    c.lineTo(w, h);
    c.closePath();
    if (filled) {
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, C.crown.light);
      g.addColorStop(0.5, C.crown.main);
      g.addColorStop(1, C.crown.dark);
      c.fillStyle = g;
    } else c.fillStyle = 'rgba(8,10,30,0.6)';
    c.fill();
    c.lineWidth = Math.max(1.5, size * 0.09);
    c.lineJoin = 'round';
    c.strokeStyle = INK;
    c.stroke();
    if (filled) {
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.fillRect(w * 0.14, h * 0.62, w * 0.72, h * 0.12);
      c.fillStyle = '#ff5d6c';
      c.beginPath();
      c.arc(w * 0.5, h * 0.75, Math.max(1.5, w * 0.07), 0, TAU);
      c.fill();
    }
  });
}

// ───────────── Emote-Knopf ─────────────
/** Dunkles, abgerundetes Quadrat mit weißer Sprechblase „…“ (offen: goldener Rand). */
export function emoteButton(r, open, dpr) {
  const S = r * 2;
  return cached('emob|' + Math.round(S) + '|' + (open ? 1 : 0) + '|' + dpr, S + 4, S + 6, dpr, (c) => {
    c.translate(2, 2);
    rr(c, 0, 3, S, S, S * 0.26);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fill();
    rr(c, 0, 0, S, S, S * 0.26);
    const g = c.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, open ? '#5a6dc8' : '#3a467e');
    g.addColorStop(1, open ? '#2b3a8f' : '#1b2350');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = open ? '#ffd84d' : INK;
    c.stroke();
    // Sprechblase
    const bx = S * 0.18;
    const by = S * 0.2;
    const bw = S * 0.64;
    const bh = S * 0.46;
    rr(c, bx, by, bw, bh, bh * 0.4);
    c.moveTo(bx + bw * 0.25, by + bh);
    c.lineTo(bx + bw * 0.18, by + bh + S * 0.16);
    c.lineTo(bx + bw * 0.45, by + bh);
    c.fillStyle = '#ffffff';
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = INK;
    c.stroke();
    c.fillStyle = INK;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc(bx + bw * (0.28 + i * 0.22), by + bh * 0.52, Math.max(1.5, S * 0.045), 0, TAU);
      c.fill();
    }
  });
}

/** Team-Plakette (Pill) für Name + Kronen: Teamfarbe mit Glanzband und Kontur. */
export function teamPill(w, h, team, dpr) {
  return cached('pill|' + Math.round(w) + '|' + Math.round(h) + '|' + team + '|' + dpr, w + 4, h + 6, dpr, (c) => {
    c.translate(2, 2);
    const T = team === 'red' ? C.red : C.blue;
    rr(c, 0, 2.5, w, h, h / 2);
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fill();
    rr(c, 0, 0, w, h, h / 2);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, T.light);
    g.addColorStop(0.45, T.main);
    g.addColorStop(1, T.dark);
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2.5;
    c.strokeStyle = INK;
    c.stroke();
    rr(c, h * 0.3, 2.5, w - h * 0.6, h * 0.28, h * 0.14);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fill();
  });
}
