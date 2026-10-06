// Licht-Modell für prozedurale Vektorformen (docs/STYLE_GUIDE.md §2):
// Licht von oben links → Flächenverlauf hell (oben links) → Grundton → dunkel (unten rechts), Glanzlicht oben,
// dunkle dicke Außenkontur, Rim-Light auf der Schattenseite, weicher Bodenschatten.
//
// LitCtx umhüllt einen CanvasRenderingContext2D, verfolgt Transformation und Pfad-Grenzen im Gerätekoordinaten-
// system und bietet litFill(): Die Zeichenfunktionen in sprites.js rufen weiterhin fill(P, farbe) auf; ist P.ctx
// ein LitCtx, entsteht automatisch Volumen. Gedacht für das einmalige Rendern in den Sprite-Cache (kein Per-Frame-Pfad).
import { C, LIGHT } from './tokens.js';

const TAU = Math.PI * 2;

// ───────────── Farbtöne ─────────────
const toneCache = new Map();
function hexRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbHex(r, g, b) {
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
/** Mischung zweier Hex-Farben (t = Anteil b). */
export function mixHex(a, b, t) {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
/** Licht- und Schattenton zu einer Grundfarbe (gecacht). */
export function tones(hex) {
  let t = toneCache.get(hex);
  if (!t) {
    t = { light: mixHex(hex, C.lightTint, LIGHT.lightMix), base: hex, dark: mixHex(hex, C.shadeTint, LIGHT.shadeMix) };
    toneCache.set(hex, t);
  }
  return t;
}
const isHex = (s) => typeof s === 'string' && s.charCodeAt(0) === 35 && (s.length === 7 || s.length === 4);

// ───────────── LitCtx ─────────────
const PROPS = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineJoin', 'lineCap', 'miterLimit', 'globalAlpha', 'globalCompositeOperation', 'shadowColor', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'font', 'textAlign', 'textBaseline', 'lineDashOffset', 'imageSmoothingEnabled'];
const PASS = ['fill', 'stroke', 'clip', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'setLineDash', 'getLineDash', 'createLinearGradient', 'createRadialGradient', 'createPattern', 'measureText', 'closePath', 'getTransform'];

export class LitCtx {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{gloss?: boolean, minGlossPx?: number}} opts
   */
  constructor(ctx, opts = {}) {
    this.c = ctx;
    this.canvas = ctx.canvas;
    this.lit = true;
    this.gloss = opts.gloss !== false;
    this.minGlossPx = opts.minGlossPx ?? 7;
    const m = ctx.getTransform();
    this.m = [m.a, m.b, m.c, m.d, m.e, m.f];
    this.stack = [];
    this.inv = null;
    this.resetBounds();
    // Vereinigung aller gezeichneten Formen (für das Zuschneiden des Sprites)
    this.ux0 = Infinity;
    this.uy0 = Infinity;
    this.ux1 = -Infinity;
    this.uy1 = -Infinity;
    this.glowPad = 0;
  }

  resetBounds() {
    this.bx0 = Infinity;
    this.by0 = Infinity;
    this.bx1 = -Infinity;
    this.by1 = -Infinity;
  }

  _pt(x, y) {
    const m = this.m;
    const X = m[0] * x + m[2] * y + m[4];
    const Y = m[1] * x + m[3] * y + m[5];
    if (X < this.bx0) this.bx0 = X;
    if (X > this.bx1) this.bx1 = X;
    if (Y < this.by0) this.by0 = Y;
    if (Y > this.by1) this.by1 = Y;
  }
  _circle(x, y, r) {
    const m = this.m;
    const X = m[0] * x + m[2] * y + m[4];
    const Y = m[1] * x + m[3] * y + m[5];
    const R = Math.abs(r) * Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]));
    if (X - R < this.bx0) this.bx0 = X - R;
    if (X + R > this.bx1) this.bx1 = X + R;
    if (Y - R < this.by0) this.by0 = Y - R;
    if (Y + R > this.by1) this.by1 = Y + R;
  }
  _union(pad = 0) {
    if (!(this.bx1 >= this.bx0)) return;
    const p = pad + (this.c.lineWidth || 0) * Math.hypot(this.m[0], this.m[1]) * 0.5 + (this.c.shadowBlur || 0);
    if (this.bx0 - p < this.ux0) this.ux0 = this.bx0 - p;
    if (this.by0 - p < this.uy0) this.uy0 = this.by0 - p;
    if (this.bx1 + p > this.ux1) this.ux1 = this.bx1 + p;
    if (this.by1 + p > this.uy1) this.uy1 = this.by1 + p;
  }
  _toLocal(X, Y) {
    if (!this.inv) {
      const [a, b, c, d, e, f] = this.m;
      const det = a * d - b * c || 1e-9;
      this.inv = [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
    }
    const i = this.inv;
    return [i[0] * X + i[2] * Y + i[4], i[1] * X + i[3] * Y + i[5]];
  }

  // ── Zustand / Transformation (eigener Stack, damit keine getTransform()-Allokation pro Punkt nötig ist)
  save() {
    this.stack.push(this.m.slice());
    this.c.save();
  }
  restore() {
    const m = this.stack.pop();
    if (m) this.m = m;
    this.inv = null;
    this.c.restore();
  }
  translate(x, y) {
    const m = this.m;
    m[4] += m[0] * x + m[2] * y;
    m[5] += m[1] * x + m[3] * y;
    this.inv = null;
    this.c.translate(x, y);
  }
  rotate(a) {
    const cs = Math.cos(a);
    const sn = Math.sin(a);
    const m = this.m;
    const a0 = m[0];
    const b0 = m[1];
    const c0 = m[2];
    const d0 = m[3];
    m[0] = a0 * cs + c0 * sn;
    m[1] = b0 * cs + d0 * sn;
    m[2] = -a0 * sn + c0 * cs;
    m[3] = -b0 * sn + d0 * cs;
    this.inv = null;
    this.c.rotate(a);
  }
  scale(x, y) {
    const m = this.m;
    m[0] *= x;
    m[1] *= x;
    m[2] *= y;
    m[3] *= y;
    this.inv = null;
    this.c.scale(x, y);
  }
  setTransform(a, b, c, d, e, f) {
    if (typeof a === 'object' && a) ({ a, b, c, d, e, f } = a);
    this.m = [a, b, c, d, e, f];
    this.inv = null;
    this.c.setTransform(a, b, c, d, e, f);
  }
  transform(a, b, c, d, e, f) {
    const m = this.m;
    this.m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]];
    this.inv = null;
    this.c.transform(a, b, c, d, e, f);
  }
  resetTransform() {
    this.setTransform(1, 0, 0, 1, 0, 0);
  }

  // ── Pfade (Grenzen mitführen)
  beginPath() {
    this.resetBounds();
    this.c.beginPath();
  }
  moveTo(x, y) {
    this._pt(x, y);
    this.c.moveTo(x, y);
  }
  lineTo(x, y) {
    this._pt(x, y);
    this.c.lineTo(x, y);
  }
  quadraticCurveTo(cx, cy, x, y) {
    this._pt(cx, cy);
    this._pt(x, y);
    this.c.quadraticCurveTo(cx, cy, x, y);
  }
  bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
    this._pt(c1x, c1y);
    this._pt(c2x, c2y);
    this._pt(x, y);
    this.c.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
  }
  arc(x, y, r, a0, a1, ccw) {
    this._circle(x, y, r);
    this.c.arc(x, y, Math.abs(r), a0, a1, ccw);
  }
  arcTo(x1, y1, x2, y2, r) {
    this._pt(x1, y1);
    this._pt(x2, y2);
    this.c.arcTo(x1, y1, x2, y2, r);
  }
  ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
    this._circle(x, y, Math.max(Math.abs(rx), Math.abs(ry)));
    this.c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, a0, a1, ccw);
  }
  rect(x, y, w, h) {
    this._pt(x, y);
    this._pt(x + w, y + h);
    this._pt(x + w, y);
    this._pt(x, y + h);
    this.c.rect(x, y, w, h);
  }
  roundRect(x, y, w, h, r) {
    this._pt(x, y);
    this._pt(x + w, y + h);
    this._pt(x + w, y);
    this._pt(x, y + h);
    if (this.c.roundRect) this.c.roundRect(x, y, w, h, r);
    else this.c.rect(x, y, w, h);
  }

  /**
   * Fläche mit Licht füllen: Verlauf von oben links (Lichtton) nach unten rechts (Schattenton),
   * Kontur, und bei ausreichend großen Formen ein weiches Glanzlicht oben links (auf die Form geclippt).
   */
  litFill(color, stroke = true) {
    const c = this.c;
    const w = this.bx1 - this.bx0;
    const h = this.by1 - this.by0;
    this._union();
    if (!(w > 0.5 && h > 0.5) || !isHex(color)) {
      c.fillStyle = color;
      c.fill();
      if (stroke) c.stroke();
      return;
    }
    const t = tones(color);
    const [x0, y0] = this._toLocal(this.bx0 + w * 0.12, this.by0 + h * 0.04);
    const [x1, y1] = this._toLocal(this.bx0 + w * 0.92, this.by0 + h * 1.02);
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, t.light);
    g.addColorStop(0.48, color);
    g.addColorStop(1, t.dark);
    c.fillStyle = g;
    c.fill();
    if (stroke) c.stroke();
    if (this.gloss && w >= this.minGlossPx && h >= this.minGlossPx) {
      c.save();
      c.clip();
      c.setTransform(1, 0, 0, 1, 0, 0);
      const gx = this.bx0 + w * 0.34;
      const gy = this.by0 + h * 0.27;
      const rx = w * 0.27;
      const ry = h * 0.17;
      const rg = c.createRadialGradient(gx, gy, 0, gx, gy, Math.max(rx, ry));
      rg.addColorStop(0, `rgba(255,255,255,${LIGHT.glossAlpha})`);
      rg.addColorStop(0.55, `rgba(255,255,255,${LIGHT.glossAlpha * 0.45})`);
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = rg;
      c.beginPath();
      c.ellipse(gx, gy, rx, ry, -0.4, 0, TAU);
      c.fill();
      c.restore();
    }
  }
}
// Durchreichen: Eigenschaften und übrige Methoden
for (const p of PROPS) {
  Object.defineProperty(LitCtx.prototype, p, {
    get() {
      return this.c[p];
    },
    set(v) {
      this.c[p] = v;
    },
  });
}
for (const f of PASS) {
  if (LitCtx.prototype[f]) continue;
  LitCtx.prototype[f] = function (...a) {
    if (f === 'fill' || f === 'stroke') this._union();
    else if (f === 'fillRect' || f === 'strokeRect') {
      this._pt(a[0], a[1]);
      this._pt(a[0] + a[2], a[1] + a[3]);
      this._union();
    }
    return this.c[f](...a);
  };
}

// ───────────── Sprite-Nachbearbeitung ─────────────
const scratch = [];
/** Wiederverwendbare Hilfs-Canvas (Index i), mindestens w×h groß. */
export function scratchCanvas(i, w, h) {
  let cv = scratch[i];
  if (!cv) {
    cv = document.createElement('canvas');
    scratch[i] = cv;
  }
  if (cv.width < w || cv.height < h) {
    cv.width = Math.max(cv.width, Math.ceil(w));
    cv.height = Math.max(cv.height, Math.ceil(h));
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, cv.width, cv.height);
  return cv;
}

/**
 * Fertigt aus einer gerenderten Figur (src, Ausschnitt sx,sy,w,h in Gerätepixeln) das Sprite:
 * dicke Außenkontur (Silhouette, rundum versetzt), Rim-Light unten rechts, Gesamtlicht oben links.
 * @returns {HTMLCanvasElement}
 */
export function finishSprite(src, sx, sy, w, h, { outline = 2, rim = 1.5, light = true, ink = C.ink } = {}) {
  const pad = Math.ceil(outline) + 1;
  const W = Math.ceil(w) + pad * 2;
  const H = Math.ceil(h) + pad * 2;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const o = out.getContext('2d');
  // Silhouette in Konturfarbe
  const sil = scratchCanvas(1, W, H);
  const s = sil.getContext('2d');
  s.drawImage(src, sx, sy, w, h, pad, pad, w, h);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = ink;
  s.fillRect(0, 0, W, H);
  if (outline > 0) {
    const n = outline > 2.5 ? 12 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      o.drawImage(sil, 0, 0, W, H, Math.cos(a) * outline, Math.sin(a) * outline, W, H);
    }
  }
  o.drawImage(src, sx, sy, w, h, pad, pad, w, h);
  if (rim > 0) {
    // Rim-Light: Silhouette minus um (-rim,-rim) verschobene Silhouette = Saum unten rechts
    const r = scratchCanvas(2, W, H);
    const rc = r.getContext('2d');
    rc.drawImage(src, sx, sy, w, h, pad, pad, w, h);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = `rgba(255,248,226,${LIGHT.rimAlpha})`;
    rc.fillRect(0, 0, W, H);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(src, sx, sy, w, h, pad - rim, pad - rim, w, h);
    o.globalCompositeOperation = 'source-atop';
    o.drawImage(r, 0, 0, W, H, 0, 0, W, H);
  }
  if (light) {
    o.globalCompositeOperation = 'source-atop';
    const g = o.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,250,235,0.16)');
    g.addColorStop(0.45, 'rgba(255,250,235,0)');
    g.addColorStop(0.6, 'rgba(20,24,60,0)');
    g.addColorStop(1, 'rgba(20,24,60,0.2)');
    o.fillStyle = g;
    o.fillRect(0, 0, W, H);
  }
  o.globalCompositeOperation = 'source-over';
  out.pad = pad;
  return out;
}

/** Einfarbige Silhouette eines Sprites (für Treffer-Flash, Geister, Tarnung). */
export function silhouette(src, color = '#ffffff') {
  const cv = document.createElement('canvas');
  cv.width = src.width;
  cv.height = src.height;
  const c = cv.getContext('2d');
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = color;
  c.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

// ───────────── Weiches Leuchten (Aura, Glow) ─────────────
const glowCache = new Map();
/** Radialer Leucht-Fleck (Farbe → transparent), gecacht je Farbe und Radius (Gerätepixel). */
export function softGlow(color, r, core = 0.35) {
  const R = Math.max(2, Math.round(r));
  const key = color + '|' + R + '|' + core;
  let cv = glowCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = cv.height = R * 2 + 2;
  const c = cv.getContext('2d');
  // Volle Farbe, dann Alpha über einen eigenen Verlauf (ein Verlauf zu transparentem Schwarz würde abdunkeln)
  c.fillStyle = color;
  c.fillRect(0, 0, cv.width, cv.height);
  c.globalCompositeOperation = 'destination-in';
  const a = c.createRadialGradient(R + 1, R + 1, 0, R + 1, R + 1, R);
  a.addColorStop(0, 'rgba(0,0,0,1)');
  a.addColorStop(core, 'rgba(0,0,0,0.85)');
  a.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = a;
  c.fillRect(0, 0, cv.width, cv.height);
  glowCache.set(key, cv);
  if (glowCache.size > 300) glowCache.delete(glowCache.keys().next().value);
  return cv;
}

// ───────────── Weicher Bodenschatten ─────────────
const shadowCache = new Map();
/**
 * Weicher, radialer Ellipsen-Schatten (gecacht je Größe). rx in Gerätepixeln.
 * Optional ein feiner Teamfarben-Saum (Fußring) für die Teamzuordnung.
 */
export function softShadow(rx, ring = null) {
  const R = Math.max(4, Math.round(rx));
  const key = R + '|' + (ring || '');
  let cv = shadowCache.get(key);
  if (cv) return cv;
  const ry = Math.max(2, Math.round(R * LIGHT.shadowSquash));
  cv = document.createElement('canvas');
  cv.width = R * 2 + 4;
  cv.height = ry * 2 + 4;
  const c = cv.getContext('2d');
  c.translate(R + 2, ry + 2);
  c.scale(1, ry / R);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  const a = LIGHT.shadowAlpha;
  g.addColorStop(0, `rgba(10,14,28,${a})`);
  g.addColorStop(0.55, `rgba(10,14,28,${a * 0.75})`);
  g.addColorStop(1, 'rgba(10,14,28,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, R, 0, TAU);
  c.fill();
  if (ring) {
    // Fußring in Teamfarbe: um den Schattenversatz zurückgesetzt, damit er mittig unter der Figur liegt
    c.lineWidth = Math.max(1.2, R * 0.08);
    c.strokeStyle = ring;
    c.globalAlpha = 0.6;
    c.beginPath();
    c.arc(-LIGHT.shadowOffset[0] * R, -LIGHT.shadowOffset[1] * R * (R / ry), R * 0.8, 0, TAU);
    c.stroke();
  }
  shadowCache.set(key, cv);
  if (shadowCache.size > 200) shadowCache.delete(shadowCache.keys().next().value);
  return cv;
}
