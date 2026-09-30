// Canvas-Text im Stil der Anzeige-Schrift: dunkle Kontur, tabellarische Ziffern, Kürzen mit Ellipsis.
import { T } from '../ui/tokens.js';

export const FONT = T.fontHead;
export const OUTLINE = T.ink;

export function setFont(ctx, size) {
  ctx.font = `${Math.round(size)}px ${FONT}`;
}

/** Text mit Kontur (paint-order: erst Kontur, dann Füllung) – über den Sprite-Cache. */
export function text(ctx, str, x, y, size, color = '#ffffff', align = 'center', stroke = 3) {
  return cached(ctx, str, x, y, size, color, align, stroke, false);
}

// ───── Sprite-Cache für Texte ─────
// Kontur + Füllung von Canvas-Text sind teuer (v. a. ohne GPU). Einmal gerenderte Beschriftungen
// werden als kleines Bild gemerkt und nur noch kopiert. Schlüssel enthält die Pixeldichte.
const sprites = new Map();
const MAX_SPRITES = 500;
function pixelScale(ctx) {
  const a = ctx.getTransform?.().a || 1;
  return Math.max(1, Math.round(a * 2) / 2);
}
function cached(ctx, str, x, y, size, color, align, stroke, tab) {
  size = Math.round(size);
  const ps = pixelScale(ctx);
  const key = `${tab ? 1 : 0}|${str}|${size}|${color}|${stroke}|${ps}`;
  let sp = sprites.get(key);
  if (!sp) {
    const w = tab ? tnumWidth(ctx, str, size) : (setFont(ctx, size), ctx.measureText(str).width);
    const pad = Math.ceil(stroke / 2) + 2;
    const cw = Math.ceil(w + pad * 2);
    const ch = Math.ceil(size * 1.5 + pad * 2);
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(cw * ps));
    cv.height = Math.max(1, Math.ceil(ch * ps));
    const c = cv.getContext('2d');
    c.scale(ps, ps);
    if (tab) drawTabular(c, str, pad, ch / 2, size, color, stroke);
    else {
      setFont(c, size);
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.lineJoin = 'round';
      if (stroke) {
        c.lineWidth = stroke;
        c.strokeStyle = OUTLINE;
        c.strokeText(str, pad, ch / 2);
      }
      c.fillStyle = color;
      c.fillText(str, pad, ch / 2);
    }
    sp = { cv, w, cw, ch, pad };
    if (sprites.size >= MAX_SPRITES) sprites.delete(sprites.keys().next().value);
    sprites.set(key, sp);
  }
  const left = align === 'center' ? x - sp.w / 2 : align === 'right' ? x - sp.w : x;
  ctx.drawImage(sp.cv, left - sp.pad, y - sp.ch / 2, sp.cw, sp.ch);
  return sp.w;
}

// Breite der breitesten Ziffer je Schriftgröße (Lilita One hat keine tabellarischen Ziffern)
const advCache = new Map();
function digitAdvance(ctx, size) {
  let a = advCache.get(size);
  if (a == null) {
    a = 0;
    for (let d = 0; d <= 9; d++) a = Math.max(a, ctx.measureText(String(d)).width);
    advCache.set(size, a);
  }
  return a;
}
/** Nach dem Laden der Schrift aufrufen, falls vorher mit Ersatzschrift gemessen wurde. */
export function resetTextCache() {
  advCache.clear();
  sprites.clear();
}
// Nachgeladene Schrift → mit Ersatzschrift gerenderte Sprites verwerfen
if (typeof document !== 'undefined') document.fonts?.addEventListener?.('loadingdone', resetTextCache);

/** Breite eines Strings mit tabellarischen Ziffern. */
export function tnumWidth(ctx, str, size) {
  size = Math.round(size);
  setFont(ctx, size);
  const adv = digitAdvance(ctx, size);
  let w = 0;
  for (const c of str) w += c >= '0' && c <= '9' ? adv : ctx.measureText(c).width;
  return w;
}

/** Zahlen mit fester Ziffernbreite – springen nicht beim Hoch-/Runterzählen (B-18). */
export function tnum(ctx, str, x, y, size, color = '#ffffff', align = 'center', stroke = 3) {
  return cached(ctx, str, x, y, size, color, align, stroke, true);
}

function drawTabular(ctx, str, x, y, size, color, stroke) {
  const total = tnumWidth(ctx, str, size);
  const adv = digitAdvance(ctx, size);
  let cx = x;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const c of str) {
    const cw = c >= '0' && c <= '9' ? adv : ctx.measureText(c).width;
    const px = cx + cw / 2;
    if (stroke) {
      ctx.lineWidth = stroke;
      ctx.strokeStyle = OUTLINE;
      ctx.strokeText(c, px, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(c, px, y);
    cx += cw;
  }
  ctx.textBaseline = 'alphabetic';
  return total;
}

/** Kürzt str mit „…“, bis er in maxW passt. Gibt { str, cut } zurück. */
export function ellipsize(ctx, str, size, maxW) {
  setFont(ctx, size);
  if (ctx.measureText(str).width <= maxW) return { str, cut: false };
  let s = str;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return { str: s.trimEnd() + '…', cut: true };
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
}
