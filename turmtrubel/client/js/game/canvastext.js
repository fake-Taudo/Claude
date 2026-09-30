// Canvas-Text im Stil der Anzeige-Schrift: dunkle Kontur, tabellarische Ziffern, Kürzen mit Ellipsis.
import { T } from '../ui/tokens.js';

export const FONT = T.fontHead;
export const OUTLINE = T.ink;

export function setFont(ctx, size) {
  ctx.font = `${Math.round(size)}px ${FONT}`;
}

/** Text mit Kontur (paint-order: erst Kontur, dann Füllung). */
export function text(ctx, str, x, y, size, color = '#ffffff', align = 'center', stroke = 3) {
  setFont(ctx, size);
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
}

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
  size = Math.round(size);
  const total = tnumWidth(ctx, str, size);
  const adv = digitAdvance(ctx, size);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
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
