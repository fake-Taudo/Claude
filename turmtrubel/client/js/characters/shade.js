// Licht-Regel für Figuren: Formen mit data-mat bekommen beim Rastern Verlauf (Licht oben links → Schatten unten
// rechts), eine Ambient-Occlusion-Sichel, ein Glanzlicht je Material und eine Innenlinie. Werte aus dem Manifest
// (system.materials), sonst die Standardwerte unten (identisch mit tools/characters/system.mjs).

export const MATERIAL_TONES = { lightTint: '#fff3d6', shadeTint: '#1d2450', light: 0.34, gloss: 0.74, shade: 0.32, deep: 0.56, line: 0.6 };
export const MATERIAL_KINDS = {
  cloth: { ao: 0.4, shift: 0.16, hi: 0.3, kind: 'soft' },
  leather: { ao: 0.44, shift: 0.16, hi: 0.26, kind: 'soft' },
  metal: { ao: 0.5, shift: 0.2, hi: 0.85, kind: 'streak', contrast: true },
  gold: { ao: 0.45, shift: 0.2, hi: 0.9, kind: 'streak', contrast: true },
  skin: { ao: 0.3, shift: 0.14, hi: 0.26, kind: 'soft' },
  hair: { ao: 0.45, shift: 0.18, hi: 0.5, kind: 'streak' },
  fur: { ao: 0.45, shift: 0.18, hi: 0.2, kind: 'soft' },
  wood: { ao: 0.45, shift: 0.16, hi: 0.22, kind: 'soft' },
  stone: { ao: 0.5, shift: 0.18, hi: 0.18, kind: 'soft' },
  bone: { ao: 0.42, shift: 0.16, hi: 0.4, kind: 'soft' },
  glass: { ao: 0.25, shift: 0.14, hi: 0.95, kind: 'streak' },
  gem: { ao: 0.4, shift: 0.2, hi: 1, kind: 'spot', contrast: true },
  scale: { ao: 0.45, shift: 0.16, hi: 0.35, kind: 'soft' },
  flat: { ao: 0, shift: 0, hi: 0, kind: null, flat: true },
};

export const PLACEHOLDER = { '#ff00f1': 'main', '#ff00f2': 'light', '#ff00f3': 'shade', '#ff00f4': 'deep', '#ff00f5': 'symbol' };

let TONES = MATERIAL_TONES;
let KINDS = MATERIAL_KINDS;
export function configureMaterials(sys) {
  if (sys?.materialTones) TONES = { ...MATERIAL_TONES, ...sys.materialTones };
  if (sys?.materialKinds) KINDS = { ...MATERIAL_KINDS, ...sys.materialKinds };
  toneCache.clear();
}

function rgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex([r, g, b]) {
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
export function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
/** Farbton um deg Grad drehen (für Schwarm-Varianten). */
export function hueShift(h, deg) {
  if (!deg) return h;
  const [r, g, b] = rgb(h).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return h;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh = (hh * 60 + deg + 360) % 360 / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
  };
  return hex([f(hh + 1 / 3) * 255, f(hh) * 255, f(hh - 1 / 3) * 255]);
}

const toneCache = new Map();
export function tones(h, ink = '#1c1830') {
  let t = toneCache.get(h);
  if (!t) {
    t = { base: h, light: mix(h, TONES.lightTint, TONES.light), gloss: mix(h, '#ffffff', TONES.gloss), shade: mix(h, TONES.shadeTint, TONES.shade), deep: mix(h, TONES.shadeTint, TONES.deep), line: mix(h, ink, TONES.line) };
    toneCache.set(h, t);
    if (toneCache.size > 4000) toneCache.delete(toneCache.keys().next().value);
  }
  return t;
}

/** Farbe auflösen: Team-Platzhalter → Teamton, sonst unverändert. */
export function resolveColor(c, P) {
  if (typeof c !== 'string') return c;
  const k = PLACEHOLDER[c.toLowerCase()];
  if (k) return P.team[k];
  if (P.hue && P.hueSet?.has(c.toLowerCase())) return hueShift(c, P.hue);
  return c;
}

/** Verlauf aus der Quelle für diesen Kontext (gecacht je Kontext, Figur, Team). */
function gradient(ctx, def, P) {
  let cache = P.gradCache.get(ctx);
  if (!cache) P.gradCache.set(ctx, (cache = new Map()));
  const key = def.id + '|' + P.teamKey + '|' + (P.hue || 0);
  let g = cache.get(key);
  if (g) return g;
  const m = def.m;
  const ap = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  if (def.type === 'linear') {
    const [x1, y1] = ap(def.x1, def.y1);
    const [x2, y2] = ap(def.x2, def.y2);
    g = ctx.createLinearGradient(x1, y1, x2, y2);
  } else {
    const [cx, cy] = ap(def.cx, def.cy);
    const [fx, fy] = ap(def.fx, def.fy);
    const s = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
    g = ctx.createRadialGradient(fx, fy, 0, cx, cy, def.r * s);
  }
  for (const [o, c, a] of def.stops) {
    const col = resolveColor(c, P);
    g.addColorStop(Math.min(1, Math.max(0, o)), a < 1 ? withAlpha(col, a) : col);
  }
  cache.set(key, g);
  return g;
}
function withAlpha(h, a) {
  const [r, g, b] = rgb(h);
  return `rgba(${r},${g},${b},${a})`;
}

export function paint(ctx, p, P) {
  if (p == null) return null;
  if (typeof p === 'string') return resolveColor(p, P);
  const def = P.grads.get(p.grad);
  return def ? gradient(ctx, { ...def, id: p.grad }, P) : '#000';
}

/**
 * Zeichnet ein Element mit Material-Schattierung. lod: aktuelle Detailstufe (0 = nur Fläche und Linie).
 * Erwartet die Transformation bereits im Kontext (Modellraum).
 */
export function drawShaded(ctx, it, P, lod) {
  const base = resolveColor(it.fill, P);
  if (typeof base !== 'string' || base[0] !== '#') {
    ctx.fillStyle = paint(ctx, it.fill, P) || '#000';
    ctx.fill(it.path, it.rule);
    return;
  }
  const K = KINDS[it.mat] || KINDS.cloth;
  const T = tones(base);
  const [x, y, w, h] = it.bb || [0, 0, 1, 1];
  // Detailstufe 0 (kleine Darstellung): flache Füllung, Licht kommt aus Kontur, Rim-Light und Lichtverlauf des Frames
  if (K.flat || lod < 1) ctx.fillStyle = base;
  else {
    const g = ctx.createLinearGradient(x + w * 0.2, y, x + w * 0.8, y + h);
    if (K.contrast) {
      g.addColorStop(0, T.light);
      g.addColorStop(0.42, base);
      g.addColorStop(1, mix(T.shade, T.deep, 0.35));
    } else {
      g.addColorStop(0, T.light);
      g.addColorStop(0.5, base);
      g.addColorStop(1, T.shade);
    }
    ctx.fillStyle = g;
  }
  const a0 = ctx.globalAlpha;
  if (it.fop < 1) ctx.globalAlpha = a0 * it.fop;
  ctx.fill(it.path, it.rule);
  if (lod >= 1 && !K.flat && w > 0 && h > 0) {
    const ao = it.ao ?? K.ao;
    const hi = it.hi ?? K.hi;
    ctx.save();
    ctx.clip(it.path, it.rule);
    if (ao > 0) {
      const p2 = new Path2D();
      p2.rect(x - w, y - h, w * 3, h * 3);
      p2.addPath(it.path, new DOMMatrix([1, 0, 0, 1, -w * K.shift * 0.6, -h * K.shift]));
      ctx.globalAlpha = a0 * ao;
      ctx.fillStyle = T.deep;
      ctx.fill(p2, 'evenodd');
    }
    if (hi > 0) {
      ctx.globalAlpha = a0 * hi;
      if (K.kind === 'soft') {
        const rx = w * 0.36;
        const ry = h * 0.24;
        ctx.translate(x + w * 0.34, y + h * 0.27);
        ctx.scale(1, ry / Math.max(rx, 0.01));
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, T.gloss);
        g.addColorStop(1, withAlpha(T.gloss, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      } else if (K.kind === 'streak') {
        ctx.fillStyle = T.gloss;
        ctx.beginPath();
        if (h > w * 1.3) ctx.ellipse(x + w * 0.27, y + h * 0.42, Math.max(0.6, w * 0.08), h * 0.3, 0.08, 0, Math.PI * 2);
        else ctx.ellipse(x + w * 0.38, y + h * 0.26, w * 0.26, Math.max(0.6, h * 0.08), -0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = a0 * hi * 0.8;
        ctx.beginPath();
        ctx.arc(x + w * 0.22, y + h * 0.2, Math.max(0.5, Math.min(w, h) * 0.07), 0, Math.PI * 2);
        ctx.fill();
      } else if (K.kind === 'spot') {
        ctx.fillStyle = T.gloss;
        ctx.beginPath();
        ctx.arc(x + w * 0.32, y + h * 0.3, Math.max(0.5, Math.min(w, h) * 0.14), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  ctx.globalAlpha = a0;
  if (it.line !== '0') {
    ctx.strokeStyle = it.line ? resolveColor(it.line, P) : T.line;
    ctx.lineWidth = it.lw2 ?? P.innerMu;
    ctx.lineJoin = 'round';
    ctx.stroke(it.path);
  }
}
