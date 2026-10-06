// Vorgerenderte Partikel- und Decal-Texturen (Vektorformen mit Licht von oben links), gecacht je Form + Farbe.
// Partikel werden nur noch per drawImage skaliert kopiert – kein Pfad pro Partikel und Frame.
import { mixHex } from '../design/light.js';

const TAU = Math.PI * 2;
const INK = '#1c1830';
const cache = new Map();

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w);
  cv.height = Math.ceil(h);
  return cv;
}
const isHex = (s) => typeof s === 'string' && s[0] === '#';
const lighten = (c, t) => (isHex(c) ? mixHex(c, '#ffffff', t) : c);
const darken = (c, t) => (isHex(c) ? mixHex(c, '#10142e', t) : c);
function rgba(hex, a) {
  if (!isHex(hex)) return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Jede Form zeichnet in ein Quadrat der Kantenlänge S (Mitte = S/2). Rückgabe: Canvas.
const SHAPES = {
  // Weicher Leuchtpunkt: heller Kern → Farbe → transparent (für additive Glows, Feuerkerne, Funkenköpfe)
  dot(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, rgba(lighten(color, 0.55), 1));
    g.addColorStop(0.28, rgba(color, 0.9));
    g.addColorStop(0.62, rgba(color, 0.32));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, S, S);
    return cv;
  },
  // Harter Punkt mit Kontur (Konfetti-Kugeln, Tropfen-Ersatz)
  ball(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S * 0.4;
    const g = c.createLinearGradient(S * 0.25, S * 0.2, S * 0.8, S * 0.85);
    g.addColorStop(0, lighten(color, 0.35));
    g.addColorStop(0.5, color);
    g.addColorStop(1, darken(color, 0.3));
    c.fillStyle = g;
    c.beginPath();
    c.arc(S / 2, S / 2, r, 0, TAU);
    c.fill();
    c.lineWidth = S * 0.07;
    c.strokeStyle = INK;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.beginPath();
    c.ellipse(S * 0.4, S * 0.36, r * 0.32, r * 0.2, -0.6, 0, TAU);
    c.fill();
    return cv;
  },
  // Längliche Funke (wird entlang der Bewegung gedreht und gestreckt): breite Achse = x
  spark(color, S) {
    const cv = canvas(S, S / 4);
    const c = cv.getContext('2d');
    const h = S / 4;
    const g = c.createLinearGradient(0, 0, S, 0);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.6, rgba(color, 0.85));
    g.addColorStop(0.92, rgba(lighten(color, 0.7), 1));
    g.addColorStop(1, rgba(lighten(color, 0.7), 0.6));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(0, h / 2);
    c.quadraticCurveTo(S * 0.7, h * 0.08, S, h / 2);
    c.quadraticCurveTo(S * 0.7, h * 0.92, 0, h / 2);
    c.fill();
    return cv;
  },
  // Rauchballen: mehrere weiche Kreise, oben links heller (Licht-Regel)
  smoke(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const blobs = [
      [0.5, 0.55, 0.34],
      [0.36, 0.48, 0.24],
      [0.64, 0.46, 0.26],
      [0.5, 0.36, 0.24],
      [0.42, 0.64, 0.22],
      [0.62, 0.64, 0.22],
    ];
    for (const [bx, by, br] of blobs) {
      const x = bx * S;
      const y = by * S;
      const r = br * S;
      const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, rgba(lighten(color, 0.22), 0.95));
      g.addColorStop(0.65, rgba(color, 0.8));
      g.addColorStop(1, rgba(darken(color, 0.15), 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
    return cv;
  },
  // Flamme (Tropfen nach oben), Verlauf hell unten innen → Farbe → Rand transparent
  flame(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const g = c.createRadialGradient(S / 2, S * 0.66, 0, S / 2, S * 0.58, S * 0.45);
    g.addColorStop(0, rgba(lighten(color, 0.75), 1));
    g.addColorStop(0.4, rgba(color, 0.95));
    g.addColorStop(1, rgba(darken(color, 0.2), 0));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(S / 2, S * 0.06);
    c.bezierCurveTo(S * 0.62, S * 0.3, S * 0.88, S * 0.48, S * 0.82, S * 0.68);
    c.bezierCurveTo(S * 0.76, S * 0.9, S * 0.24, S * 0.9, S * 0.18, S * 0.68);
    c.bezierCurveTo(S * 0.12, S * 0.48, S * 0.38, S * 0.3, S / 2, S * 0.06);
    c.fill();
    return cv;
  },
  // Splitter (Eis, Glas, Stein): kantiges Polygon mit heller Facette und Kontur
  shard(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const pts = [
      [0.5, 0.08],
      [0.78, 0.42],
      [0.6, 0.92],
      [0.28, 0.7],
      [0.22, 0.34],
    ];
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x * S, y * S) : c.moveTo(x * S, y * S)));
    c.closePath();
    const g = c.createLinearGradient(S * 0.2, S * 0.1, S * 0.8, S * 0.9);
    g.addColorStop(0, lighten(color, 0.45));
    g.addColorStop(0.5, color);
    g.addColorStop(1, darken(color, 0.3));
    c.fillStyle = g;
    c.fill();
    c.lineWidth = S * 0.06;
    c.strokeStyle = darken(color, 0.55);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.moveTo(S * 0.5, S * 0.14);
    c.lineTo(S * 0.66, S * 0.42);
    c.lineTo(S * 0.42, S * 0.4);
    c.closePath();
    c.fill();
    return cv;
  },
  // Brocken (Stein, Holz): abgerundetes Viereck mit Licht oben links und dunkler Kontur
  chunk(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const m = S * 0.16;
    c.beginPath();
    c.moveTo(m * 1.4, m);
    c.lineTo(S - m, m * 1.6);
    c.lineTo(S - m * 1.3, S - m);
    c.lineTo(m, S - m * 1.5);
    c.closePath();
    const g = c.createLinearGradient(m, m, S - m, S - m);
    g.addColorStop(0, lighten(color, 0.3));
    g.addColorStop(0.55, color);
    g.addColorStop(1, darken(color, 0.35));
    c.fillStyle = g;
    c.fill();
    c.lineJoin = 'round';
    c.lineWidth = S * 0.08;
    c.strokeStyle = INK;
    c.stroke();
    return cv;
  },
  // Vierzackiger Glitzerstern (additiv)
  star(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, rgba('#ffffff', 1));
    g.addColorStop(0.3, rgba(color, 0.9));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.18 : r;
      c.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
    return cv;
  },
  // Blase mit Glanz und Kontur (Gift, Elixier)
  bubble(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S * 0.4;
    const g = c.createRadialGradient(S * 0.42, S * 0.4, r * 0.1, S / 2, S / 2, r);
    g.addColorStop(0, rgba(lighten(color, 0.5), 0.95));
    g.addColorStop(0.7, rgba(color, 0.85));
    g.addColorStop(1, rgba(darken(color, 0.25), 0.95));
    c.fillStyle = g;
    c.beginPath();
    c.arc(S / 2, S / 2, r, 0, TAU);
    c.fill();
    c.lineWidth = S * 0.06;
    c.strokeStyle = darken(color, 0.55);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.ellipse(S * 0.38, S * 0.34, r * 0.28, r * 0.18, -0.6, 0, TAU);
    c.fill();
    return cv;
  },
  // Tropfen (Elixier, Wasser)
  drop(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    c.beginPath();
    c.moveTo(S / 2, S * 0.08);
    c.quadraticCurveTo(S * 0.86, S * 0.58, S / 2, S * 0.9);
    c.quadraticCurveTo(S * 0.14, S * 0.58, S / 2, S * 0.08);
    const g = c.createLinearGradient(S * 0.3, S * 0.2, S * 0.7, S * 0.9);
    g.addColorStop(0, lighten(color, 0.4));
    g.addColorStop(0.5, color);
    g.addColorStop(1, darken(color, 0.3));
    c.fillStyle = g;
    c.fill();
    c.lineWidth = S * 0.07;
    c.strokeStyle = INK;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.65)';
    c.beginPath();
    c.ellipse(S * 0.42, S * 0.52, S * 0.07, S * 0.12, 0.3, 0, TAU);
    c.fill();
    return cv;
  },
  // Plus (Heilung) mit Kontur
  plus(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const w = S * 0.26;
    const L = S * 0.78;
    const o = (S - L) / 2;
    c.beginPath();
    c.roundRect ? c.roundRect(o, (S - w) / 2, L, w, w * 0.3) : c.rect(o, (S - w) / 2, L, w);
    c.roundRect ? c.roundRect((S - w) / 2, o, w, L, w * 0.3) : c.rect((S - w) / 2, o, w, L);
    c.fillStyle = color;
    c.fill();
    c.lineWidth = S * 0.06;
    c.strokeStyle = darken(color, 0.5);
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect((S - w) / 2 + w * 0.15, o + w * 0.2, w * 0.3, L * 0.35);
    return cv;
  },
  // Blatt (Ranken, Natur)
  leaf(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    c.beginPath();
    c.moveTo(S * 0.15, S * 0.85);
    c.quadraticCurveTo(S * 0.1, S * 0.2, S * 0.85, S * 0.15);
    c.quadraticCurveTo(S * 0.8, S * 0.8, S * 0.15, S * 0.85);
    const g = c.createLinearGradient(S * 0.1, S * 0.1, S * 0.9, S * 0.9);
    g.addColorStop(0, lighten(color, 0.3));
    g.addColorStop(1, darken(color, 0.3));
    c.fillStyle = g;
    c.fill();
    c.lineWidth = S * 0.06;
    c.strokeStyle = darken(color, 0.6);
    c.stroke();
    c.beginPath();
    c.moveTo(S * 0.2, S * 0.8);
    c.lineTo(S * 0.72, S * 0.28);
    c.stroke();
    return cv;
  },
  // Schneeflocke / Eiskristall
  flake(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    c.translate(S / 2, S / 2);
    c.lineCap = 'round';
    for (const [lw, col] of [
      [S * 0.16, darken(color, 0.45)],
      [S * 0.08, color],
    ]) {
      c.lineWidth = lw;
      c.strokeStyle = col;
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i / 6) * TAU);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -S * 0.4);
        c.moveTo(0, -S * 0.24);
        c.lineTo(-S * 0.1, -S * 0.32);
        c.moveTo(0, -S * 0.24);
        c.lineTo(S * 0.1, -S * 0.32);
        c.stroke();
        c.restore();
      }
    }
    return cv;
  },
  // Konfetti-Streifen
  confetti(color, S) {
    const cv = canvas(S, S / 2);
    const c = cv.getContext('2d');
    c.fillStyle = color;
    c.fillRect(S * 0.1, S * 0.08, S * 0.8, S * 0.34);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(S * 0.1, S * 0.08, S * 0.8, S * 0.1);
    return cv;
  },
  // Pfeil (Pfeilregen), Spitze zeigt nach +x
  arrow(color, S) {
    const cv = canvas(S, S / 3);
    const c = cv.getContext('2d');
    const h = S / 3;
    c.lineCap = 'round';
    c.lineWidth = h * 0.22;
    c.strokeStyle = INK;
    c.beginPath();
    c.moveTo(S * 0.06, h / 2);
    c.lineTo(S * 0.8, h / 2);
    c.stroke();
    c.lineWidth = h * 0.12;
    c.strokeStyle = color;
    c.stroke();
    c.fillStyle = '#e8eef4';
    c.strokeStyle = INK;
    c.lineWidth = h * 0.08;
    c.beginPath();
    c.moveTo(S * 0.98, h / 2);
    c.lineTo(S * 0.76, h * 0.16);
    c.lineTo(S * 0.8, h / 2);
    c.lineTo(S * 0.76, h * 0.84);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#ff6b6b';
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.moveTo(S * 0.06, h / 2);
      c.lineTo(S * 0.2, h / 2 + sgn * h * 0.36);
      c.lineTo(S * 0.26, h / 2);
      c.closePath();
      c.fill();
      c.stroke();
    }
    return cv;
  },
  // Wirbel (Fluch, Leere, Tornado-Staub): halbtransparente Sichel
  wisp(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    c.lineCap = 'round';
    const r = S * 0.34;
    for (const [lw, a] of [
      [S * 0.18, 0.35],
      [S * 0.08, 0.9],
    ]) {
      c.lineWidth = lw;
      c.strokeStyle = rgba(color, a);
      c.beginPath();
      c.arc(S / 2, S / 2, r, -0.3, Math.PI * 1.1);
      c.stroke();
    }
    return cv;
  },
  // Ring (Blasenrand, Funkenkreis)
  ring(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    c.lineWidth = S * 0.08;
    c.strokeStyle = color;
    c.beginPath();
    c.arc(S / 2, S / 2, S * 0.4, 0, TAU);
    c.stroke();
    return cv;
  },
};

/** Partikel-Textur (Form + Farbe), Kantenlänge S Gerätepixel (Standard 48). */
export function tex(shape, color, S = 48) {
  const key = shape + '|' + color + '|' + S;
  let cv = cache.get(key);
  if (!cv) {
    const f = SHAPES[shape] || SHAPES.dot;
    cv = f(color, S);
    cache.set(key, cv);
  }
  return cv;
}
export const SHAPE_NAMES = Object.keys(SHAPES);

// ───────────── Boden-Decals (Kantenlänge S, Mitte = Zentrum) ─────────────
function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const DECALS = {
  // Brandfleck: dunkler, ausfransender Fleck mit Strahlen
  scorch(color, S, seed) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const rnd = rngFrom(seed);
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, rgba(color, 0.75));
    g.addColorStop(0.55, rgba(color, 0.5));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * TAU;
      const rr = r * (0.7 + rnd() * 0.3);
      c.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
    }
    c.fill();
    c.strokeStyle = rgba(color, 0.22);
    c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = rnd() * TAU;
      c.lineWidth = S * (0.012 + rnd() * 0.012);
      c.beginPath();
      c.moveTo(r + Math.cos(a) * r * 0.3, r + Math.sin(a) * r * 0.3);
      c.lineTo(r + Math.cos(a) * r * (0.75 + rnd() * 0.2), r + Math.sin(a) * r * (0.75 + rnd() * 0.2));
      c.stroke();
    }
    return cv;
  },
  // Risse (Erdbeben, schwere Landung)
  crack(color, S, seed) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const rnd = rngFrom(seed);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (let i = 0; i < 8; i++) {
      let a = (i / 8) * TAU + rnd() * 0.5;
      let x = r;
      let y = r;
      c.beginPath();
      c.moveTo(x, y);
      const n = 4;
      for (let k = 0; k < n; k++) {
        a += (rnd() - 0.5) * 0.9;
        const len = (r * (0.75 + rnd() * 0.2)) / n;
        x += Math.cos(a) * len;
        y += Math.sin(a) * len;
        c.lineTo(x, y);
      }
      c.lineWidth = S * 0.016;
      c.strokeStyle = rgba(color, 0.7);
      c.stroke();
      c.lineWidth = S * 0.006;
      c.strokeStyle = 'rgba(255,240,210,0.35)';
      c.stroke();
    }
    return cv;
  },
  // Weicher Farbfleck (Gift-Pfütze, Frost-Reif, Heil-Schein)
  pool(color, S, seed) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const rnd = rngFrom(seed);
    c.fillStyle = rgba(color, 0.55);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * TAU;
      const d = r * (0.15 + rnd() * 0.4);
      const rr = r * (0.3 + rnd() * 0.22);
      const g = c.createRadialGradient(r + Math.cos(a) * d, r + Math.sin(a) * d, 0, r + Math.cos(a) * d, r + Math.sin(a) * d, rr);
      g.addColorStop(0, rgba(color, 0.55));
      g.addColorStop(1, rgba(color, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, rr, 0, TAU);
      c.fill();
    }
    return cv;
  },
  // Spritzer (Elixier) mit Tropfen
  splat(color, S, seed) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    const rnd = rngFrom(seed);
    c.fillStyle = rgba(color, 0.8);
    c.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * TAU;
      const rr = r * (0.28 + rnd() * 0.16);
      c.lineTo(r + Math.cos(a) * rr, r + Math.sin(a) * rr);
    }
    c.fill();
    for (let i = 0; i < 8; i++) {
      const a = rnd() * TAU;
      const d = r * (0.5 + rnd() * 0.4);
      c.beginPath();
      c.arc(r + Math.cos(a) * d, r + Math.sin(a) * d, S * (0.02 + rnd() * 0.04), 0, TAU);
      c.fill();
    }
    return cv;
  },
  // Frost-Reif: heller Kreis mit Kristall-Linien
  frost(color, S, seed) {
    const cv = DECALS.pool(color, S, seed);
    const c = cv.getContext('2d');
    const r = S / 2;
    const rnd = rngFrom(seed + 7);
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const a = rnd() * TAU;
      const d0 = r * rnd() * 0.3;
      const d1 = r * (0.5 + rnd() * 0.35);
      c.lineWidth = S * 0.006;
      c.beginPath();
      c.moveTo(r + Math.cos(a) * d0, r + Math.sin(a) * d0);
      c.lineTo(r + Math.cos(a) * d1, r + Math.sin(a) * d1);
      c.stroke();
    }
    return cv;
  },
  // Rune / Zielkreis (Vorlauf, Klon, Spiegel): Ring mit Strichen
  rune(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    c.strokeStyle = rgba(color, 0.9);
    c.lineWidth = S * 0.012;
    c.beginPath();
    c.arc(r, r, r * 0.92, 0, TAU);
    c.stroke();
    c.lineWidth = S * 0.007;
    c.beginPath();
    c.arc(r, r, r * 0.76, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(color, 0.12);
    c.beginPath();
    c.arc(r, r, r * 0.92, 0, TAU);
    c.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.lineWidth = S * (i % 3 ? 0.006 : 0.014);
      c.beginPath();
      c.moveTo(r + Math.cos(a) * r * 0.78, r + Math.sin(a) * r * 0.78);
      c.lineTo(r + Math.cos(a) * r * 0.9, r + Math.sin(a) * r * 0.9);
      c.stroke();
    }
    return cv;
  },
  // Zielmarker (Vorlauf von Feuerball/Rakete): gestrichelter Kreis mit Fadenkreuz
  target(color, S) {
    const cv = canvas(S, S);
    const c = cv.getContext('2d');
    const r = S / 2;
    c.strokeStyle = rgba(color, 0.95);
    c.lineWidth = S * 0.014;
    c.setLineDash([S * 0.05, S * 0.035]);
    c.beginPath();
    c.arc(r, r, r * 0.88, 0, TAU);
    c.stroke();
    c.setLineDash([]);
    c.lineWidth = S * 0.01;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU;
      c.beginPath();
      c.moveTo(r + Math.cos(a) * r * 0.25, r + Math.sin(a) * r * 0.25);
      c.lineTo(r + Math.cos(a) * r * 0.55, r + Math.sin(a) * r * 0.55);
      c.stroke();
    }
    c.fillStyle = rgba(color, 0.18);
    c.beginPath();
    c.arc(r, r, r * 0.88, 0, TAU);
    c.fill();
    return cv;
  },
};

/** Decal-Textur (Form + Farbe + Variante), Kantenlänge S Gerätepixel. */
export function decalTex(shape, color, S = 128, variant = 0) {
  const key = 'd|' + shape + '|' + color + '|' + S + '|' + variant;
  let cv = cache.get(key);
  if (!cv) {
    const f = DECALS[shape] || DECALS.scorch;
    cv = f(color, S, 1 + variant * 7919);
    cache.set(key, cv);
  }
  return cv;
}
export const DECAL_NAMES = Object.keys(DECALS);

/** Größe des Textur-Caches (Debug). */
export function textureCount() {
  return cache.size;
}
