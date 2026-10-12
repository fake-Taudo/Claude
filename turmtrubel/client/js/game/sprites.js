// Prozedural gezeichnete Gebäude (ohne Spawn-Funktion), Kronentürme, Zauber-Symbole, Emotes und Kartenbilder.
// Alle Figuren (Truppen, Champions, Helden, Token, Spawner-Gebäude, Turmfiguren) zeichnet die Figuren-Laufzeit
// (client/js/characters). Konvention: Ursprung = Fußpunkt (Boden), y nach oben negativ. Einheit "U" = Pixelgröße.
// Gebäude und Türme werden je Zustand/Größe einmal mit dem Licht-Modell (design/light.js) in den Sprite-Cache
// gerendert und danach nur noch kopiert (siehe drawBuilding/drawTower).
import { T } from '../ui/tokens.js';
import { LitCtx, finishSprite, silhouette, scratchCanvas, softGlow } from '../design/light.js';
import { sprites } from '../design/spritecache.js';
import { drawCharacter, figureForType, figureEntry } from '../characters/index.js';

const TAU = Math.PI * 2;
export const OUTLINE = T.ink;
// Teamfarben kommen aus den Design-Tokens (--team-blue-*, --team-red-*)
export const TEAM = { blue: T.blue, red: T.red };

// ───────────── Farbhilfen ─────────────
const colorCache = new Map();
function parseHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, amt) {
  const key = hex + '|' + amt;
  let v = colorCache.get(key);
  if (v) return v;
  let [r, g, b] = parseHex(hex);
  if (amt >= 0) {
    r += (255 - r) * amt;
    g += (255 - g) * amt;
    b += (255 - b) * amt;
  } else {
    r *= 1 + amt;
    g *= 1 + amt;
    b *= 1 + amt;
  }
  v = '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
  colorCache.set(key, v);
  return v;
}
export function mix(a, b, t) {
  if (t <= 0) return a;
  const key = a + b + (t * 20 | 0);
  let v = colorCache.get(key);
  if (v) return v;
  const A = parseHex(a);
  const B = parseHex(b);
  const q = (t * 20 | 0) / 20;
  v = '#' + A.map((c, i) => Math.round(c + (B[i] - c) * q).toString(16).padStart(2, '0')).join('');
  colorCache.set(key, v);
  return v;
}

// ───────────── Eigene Bilder aus skin.json (look.image) ─────────────
// Werden einmal geladen; bis sie da sind, zeichnet der Baukasten-Look bzw. der Platzhalter.
const skinImages = new Map();
const imageListeners = new Set();
/** Rückruf, sobald ein Skin-Bild geladen ist (z. B. um zwischengespeicherte Kartenbilder neu zu zeichnen). */
export function onSkinImageLoaded(fn) {
  imageListeners.add(fn);
}
function skinImage(src) {
  if (!src || typeof Image === 'undefined') return null;
  let im = skinImages.get(src);
  if (!im) {
    im = new Image();
    im.onload = () => {
      for (const fn of imageListeners) fn(src);
    };
    im.src = src;
    skinImages.set(src, im);
  }
  return im.complete && im.naturalWidth > 0 ? im : null;
}
/** Bild mit Fußpunkt (x, y) und Höhe h zeichnen; true, wenn gezeichnet. */
function drawSkinImage(ctx, src, x, y, h, alpha = 1) {
  const im = skinImage(src);
  if (!im) return false;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(im, x - w / 2, y - h, w, h);
  ctx.restore();
  return true;
}

/** Eigenes Bild aus skin.json (look.image), Fußpunkt (x, y), Höhe h. false, solange es lädt oder keins gesetzt ist. */
export function drawLookImage(ctx, look, x, y, h, alpha = 1) {
  return !!look?.image && drawSkinImage(ctx, look.image, x, y, h, alpha);
}

// ───────────── Zeichen-Grundlagen ─────────────
function ell(c, x, y, rx, ry, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
}
function circ(c, x, y, r) {
  c.beginPath();
  c.arc(x, y, Math.abs(r), 0, TAU);
}
function rrect(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
}
function poly(c, pts) {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
}
function fill(P, color, stroke = true) {
  const c = P.ctx;
  const col = P.hurt > 0 && typeof color === 'string' && color[0] === '#' ? mix(color, '#ffffff', P.hurt * 0.8) : color;
  // Licht-Modell (Verlauf + Glanz), wenn über einen LitCtx gezeichnet wird
  if (c.lit) return c.litFill(col, stroke);
  c.fillStyle = col;
  c.fill();
  if (stroke) c.stroke();
}

// ───────────── Augen & Gesichter ─────────────
function eyes(P, x, y, s = 1, mood = null) {
  // Rückansicht (Figur läuft vom Betrachter weg): kein Gesicht
  if (P.back) return;
  const c = P.ctx;
  mood = mood || P.mood;
  if (mood === 'stun') {
    c.save();
    c.lineWidth *= 0.8;
    for (const ex of [x - 0.08 * s, x + 0.13 * s]) {
      c.beginPath();
      c.moveTo(ex - 0.05 * s, y - 0.05 * s);
      c.lineTo(ex + 0.05 * s, y + 0.05 * s);
      c.moveTo(ex + 0.05 * s, y - 0.05 * s);
      c.lineTo(ex - 0.05 * s, y + 0.05 * s);
      c.stroke();
    }
    c.restore();
    return;
  }
  if (mood === 'sleep') {
    c.beginPath();
    c.arc(x - 0.08 * s, y, 0.05 * s, 0, Math.PI);
    c.moveTo(x + 0.18 * s, y);
    c.arc(x + 0.13 * s, y, 0.05 * s, 0, Math.PI);
    c.stroke();
    return;
  }
  for (const ex of [x - 0.08 * s, x + 0.13 * s]) {
    ell(c, ex, y, 0.075 * s, 0.1 * s);
    c.fillStyle = '#ffffff';
    c.fill();
    c.stroke();
    circ(c, ex + 0.025 * s, y + 0.01 * s, 0.04 * s);
    c.fillStyle = OUTLINE;
    c.fill();
  }
  if (mood === 'angry') {
    c.beginPath();
    c.moveTo(x - 0.16 * s, y - 0.15 * s);
    c.lineTo(x - 0.01 * s, y - 0.1 * s);
    c.moveTo(x + 0.05 * s, y - 0.1 * s);
    c.lineTo(x + 0.21 * s, y - 0.16 * s);
    c.stroke();
  }
}

function glowEyes(P, x, y, s, color) {
  if (P.back) return;
  const c = P.ctx;
  c.save();
  c.shadowColor = color;
  c.shadowBlur = P.quality > 1 ? 6 : 0;
  c.fillStyle = color;
  ell(c, x - 0.1 * s, y, 0.07 * s, 0.05 * s);
  c.fill();
  ell(c, x + 0.12 * s, y, 0.07 * s, 0.05 * s);
  c.fill();
  c.restore();
}

function star(P, x, y, r, color) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  poly(P.ctx, pts);
  fill(P, color);
}

/**
 * Platzhalter, solange eine Karte noch keine eigene Grafik hat: gestrichelter Kreis mit „?“ und dem Kartennamen.
 * Ursprung = Fußpunkt, R = Radius in px.
 */
export function drawPlaceholder(ctx, label, x, y, R, team = 'blue') {
  const T = TEAM[team] || TEAM.blue;
  ctx.save();
  ctx.translate(x, y - R);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = T.main;
  ctx.lineWidth = Math.max(1.5, R * 0.12);
  ctx.setLineDash([R * 0.35, R * 0.22]);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = T.main;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.max(8, R * 1.1)}px system-ui, sans-serif`;
  ctx.fillText('?', 0, -R * 0.05);
  if (label) {
    ctx.font = `700 ${Math.max(7, R * 0.42)}px system-ui, sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(label, 0, R * 1.45);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, R * 1.45);
  }
  ctx.restore();
}

// ───────────── Sprite-Cache (Gebäude, Türme) ─────────────
const lookIds = new WeakMap();
let lookSeq = 0;
/** Stabiler Schlüssel je Look-Objekt (Looks sind pro Kartentyp dieselben Objekte). */
function lookKey(L) {
  let k = lookIds.get(L);
  if (!k) {
    k = 'L' + ++lookSeq;
    lookIds.set(L, k);
  }
  return k;
}
function ctxScale(ctx) {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b) || 1;
}

/**
 * Gecachtes Sprite an (x, y) kopieren. sx/sy: Squash/Stretch, dpr: Gerätepixel je CSS-Pixel des Ziels.
 * hurt > 0 legt die weiße Silhouette darüber (Treffer-Flash).
 */
export function blitSprite(ctx, e, x, y, sx, sy, alpha, hurt, dpr) {
  const k = 1 / dpr;
  const w = e.canvas.width * k;
  const h = e.canvas.height * k;
  ctx.save();
  ctx.translate(x, y);
  if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
  if (alpha < 1) ctx.globalAlpha *= alpha;
  ctx.drawImage(e.canvas, -e.ox * k, -e.oy * k, w, h);
  if (hurt > 0.02) {
    if (!e.white) {
      e.white = silhouette(e.canvas);
      sprites.grow(e, e.canvas.width * e.canvas.height * 4);
    }
    ctx.globalAlpha *= Math.min(1, hurt) * 0.85;
    ctx.drawImage(e.white, -e.ox * k, -e.oy * k, w, h);
  }
  ctx.restore();
}


// ───────────── Gebäude (Ursprung = Mitte der Grundfläche, U = halbe Kantenlänge in px) ─────────────
function stoneBase(P, w = 0.9) {
  const c = P.ctx;
  rrect(c, -w, -w * 0.55, w * 2, w * 1.45, 0.18);
  fill(P, '#a79f94');
  c.save();
  c.lineWidth *= 0.6;
  c.strokeStyle = 'rgba(40,30,50,0.35)';
  for (let i = 1; i < 3; i++) {
    c.beginPath();
    c.moveTo(-w, -w * 0.55 + (i * w * 1.45) / 3);
    c.lineTo(w, -w * 0.55 + (i * w * 1.45) / 3);
    c.stroke();
  }
  c.restore();
}

const BUILDINGS = {
  cannon(P, L, o) {
    const c = P.ctx;
    stoneBase(P, 0.8);
    rrect(c, -0.6, -0.5, 1.2, 0.55, 0.15);
    fill(P, L.accent || '#b07a3e');
    c.save();
    c.translate(0, -0.45);
    c.rotate(o.aim ?? -Math.PI / 2);
    const rec = P.atk > 0.5 ? (P.atk - 0.5) * 0.4 : 0;
    rrect(c, -0.1 - rec, -0.22, 0.95, 0.44, 0.18);
    fill(P, L.cloth || '#4b4f58');
    rrect(c, 0.72 - rec, -0.26, 0.16, 0.52, 0.06);
    fill(P, shade(L.cloth || '#4b4f58', -0.3));
    c.restore();
    circ(c, 0, -0.45, 0.22);
    fill(P, P.team);
  },
  turret(P, L, o) {
    const c = P.ctx;
    for (const lx of [-0.5, 0, 0.5]) {
      c.beginPath();
      c.moveTo(0, -0.5);
      c.lineTo(lx, 0.4);
      c.lineWidth *= 2;
      c.stroke();
      c.lineWidth /= 2;
    }
    c.save();
    c.translate(0, -0.6);
    c.rotate(o.aim ?? -Math.PI / 2);
    rrect(c, -0.1, -0.12, 0.8, 0.24, 0.08);
    fill(P, L.accent || '#f5b041');
    c.restore();
    circ(c, 0, -0.6, 0.3);
    fill(P, L.cloth || '#2e86c1');
    circ(c, 0, -0.6, 0.12);
    fill(P, P.team);
  },
  tesla(P, L) {
    const c = P.ctx;
    stoneBase(P, 0.7);
    rrect(c, -0.18, -1.9, 0.36, 1.9, 0.08);
    fill(P, L.cloth || '#5f6b7a');
    for (let i = 0; i < 4; i++) {
      ell(c, 0, -0.5 - i * 0.35, 0.34 - i * 0.04, 0.09);
      fill(P, '#c98a3a');
    }
    rrect(c, -0.35, -0.3, 0.7, 0.2, 0.06);
    fill(P, P.team);
    c.save();
    c.shadowColor = L.accent || '#7fe9ff';
    c.shadowBlur = P.quality > 1 ? 14 : 0;
    circ(c, 0, -2.05, 0.24 + Math.sin(P.t * 12) * 0.03);
    fill(P, L.accent || '#7fe9ff');
    c.restore();
  },
  hut(P, L) {
    const c = P.ctx;
    rrect(c, -0.8, -0.8, 1.6, 1.3, 0.1);
    fill(P, L.cloth || '#8a5a32');
    poly(c, [-1.0, -0.7, 0, -1.8, 1.0, -0.7]);
    fill(P, '#d9b25a');
    rrect(c, -0.25, -0.35, 0.5, 0.85, 0.2);
    fill(P, '#3a2616');
    circ(c, 0.45, -0.4, 0.18);
    fill(P, '#ffe89a');
    rrect(c, -0.95, -0.82, 1.9, 0.14, 0.05);
    fill(P, P.team);
    ell(c, -0.5, -1.2, 0.25, 0.12);
    fill(P, L.accent || '#5aa04e');
  },
  grave(P, L) {
    const c = P.ctx;
    ell(c, 0, 0.2, 0.95, 0.5);
    fill(P, '#6b4e36');
    c.beginPath();
    c.moveTo(-0.55, 0.1);
    c.lineTo(-0.55, -1.0);
    c.arc(0, -1.0, 0.55, Math.PI, 0);
    c.lineTo(0.55, 0.1);
    c.closePath();
    fill(P, L.cloth || '#8e9aa6');
    rrect(c, -0.08, -1.2, 0.16, 0.6, 0.03);
    fill(P, shade(L.cloth || '#8e9aa6', -0.3));
    rrect(c, -0.25, -1.05, 0.5, 0.14, 0.03);
    fill(P, shade(L.cloth || '#8e9aa6', -0.3));
    rrect(c, -0.55, -0.2, 1.1, 0.15, 0.04);
    fill(P, P.team);
    glowEyes(P, 0, -0.5, 1.2, L.accent || '#6fd36b');
  },
  pump(P, L) {
    const c = P.ctx;
    stoneBase(P, 0.85);
    rrect(c, -0.7, -0.5, 1.4, 0.45, 0.1);
    fill(P, '#8d6a4a');
    c.save();
    ell(c, 0, -1.2, 0.62, 0.72);
    c.clip();
    c.fillStyle = '#e8e0ff';
    c.fillRect(-1, -2, 2, 2);
    const lvl = -1.2 + 0.3 * Math.sin(P.t * 2);
    c.fillStyle = L.accent || '#f06bd6';
    c.fillRect(-1, lvl, 2, 2);
    c.restore();
    ell(c, 0, -1.2, 0.62, 0.72);
    c.stroke();
    ell(c, -0.2, -1.5, 0.12, 0.2, 0.3);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fill();
    rrect(c, -0.3, -2.0, 0.6, 0.18, 0.06);
    fill(P, P.team);
  },
  inferno(P, L, o) {
    const c = P.ctx;
    stoneBase(P, 0.75);
    poly(c, [-0.55, 0, -0.4, -1.8, 0.4, -1.8, 0.55, 0]);
    fill(P, L.cloth || '#5b3a3a');
    rrect(c, -0.5, -2.0, 1.0, 0.25, 0.08);
    fill(P, '#3a2626');
    rrect(c, -0.45, -0.5, 0.9, 0.16, 0.05);
    fill(P, P.team);
    const heat = (o.aux || 0) / 2;
    c.save();
    c.shadowColor = '#ff6a1a';
    c.shadowBlur = P.quality > 1 ? 10 + heat * 10 : 0;
    ell(c, 0, -2.0, 0.35 + heat * 0.1, 0.12);
    fill(P, heat > 0.6 ? '#fff0a0' : L.accent || '#ff6a1a');
    c.restore();
  },
  mortar(P, L, o) {
    const c = P.ctx;
    stoneBase(P, 0.8);
    c.save();
    c.translate(0, -0.55);
    const a = o.aim ?? -Math.PI / 2;
    c.rotate(-Math.PI / 2 + Math.cos(a) * 0.35);
    const rec = P.atk > 0.5 ? (P.atk - 0.5) * 0.3 : 0;
    rrect(c, -0.05 - rec, -0.38, 0.9, 0.76, 0.2);
    fill(P, L.cloth || '#7d6e5d');
    ell(c, 0.85 - rec, 0, 0.14, 0.4);
    fill(P, '#2b2320');
    c.restore();
    rrect(c, -0.6, -0.35, 1.2, 0.3, 0.1);
    fill(P, L.accent || '#caa472');
    rrect(c, -0.6, -0.3, 1.2, 0.1, 0.04);
    fill(P, P.team);
  },
  ballista(P, L, o) {
    const c = P.ctx;
    stoneBase(P, 0.85);
    c.save();
    c.translate(0, -0.6);
    c.rotate(o.aim ?? -Math.PI / 2);
    rrect(c, -0.4, -0.12, 1.3, 0.24, 0.06);
    fill(P, L.cloth || '#7a5634');
    c.beginPath();
    c.moveTo(0.6, -0.8);
    c.quadraticCurveTo(0.95, 0, 0.6, 0.8);
    c.lineWidth *= 2.4;
    c.strokeStyle = '#5a3a22';
    c.stroke();
    c.lineWidth /= 2.4;
    c.strokeStyle = OUTLINE;
    c.beginPath();
    c.moveTo(0.6, -0.8);
    c.lineTo(-0.3 + (P.atk > 0.5 ? 0.3 : 0), 0);
    c.lineTo(0.6, 0.8);
    c.stroke();
    c.restore();
    circ(c, 0, -0.6, 0.2);
    fill(P, P.team);
  },
  // Koboldkäfig: Holzkäfig mit Gitterstäben, darin ein Raufbold
  cage(P, L) {
    const c = P.ctx;
    stoneBase(P, 0.8);
    rrect(c, -0.7, -1.5, 1.4, 1.35, 0.12);
    fill(P, 'rgba(40,30,30,0.55)');
    circ(c, 0.05, -0.85, 0.32);
    fill(P, L.accent || '#7cc36b');
    eyes(P, 0.1, -0.9, 0.7, 'angry');
    for (let i = -2; i <= 2; i++) {
      rrect(c, i * 0.3 - 0.05, -1.5, 0.1, 1.35, 0.04);
      fill(P, L.cloth || '#8b5a2b');
    }
    rrect(c, -0.8, -1.6, 1.6, 0.2, 0.06);
    fill(P, L.cloth || '#8b5a2b');
    rrect(c, -0.8, -0.3, 1.6, 0.15, 0.05);
    fill(P, P.team);
  },
  // Koboldbohrer: Bohrkopf, der aus einem Erdhügel ragt
  drill(P, L) {
    const c = P.ctx;
    ell(c, 0, 0.1, 0.95, 0.45);
    fill(P, '#7a5236');
    const metal = L.cloth || '#8a8f99';
    poly(c, [-0.5, -0.1, 0, -1.6, 0.5, -0.1]);
    fill(P, metal);
    c.save();
    c.lineWidth *= 0.8;
    const off = (P.t * 2) % 0.3;
    for (let i = 0; i < 4; i++) {
      const y = -0.25 - i * 0.3 - off;
      const w = 0.45 * (1 + (y + 0.1) / 1.5);
      if (w <= 0.05) continue;
      c.beginPath();
      c.moveTo(-w, y);
      c.lineTo(w, y - 0.12);
      c.stroke();
    }
    c.restore();
    rrect(c, -0.55, -0.2, 1.1, 0.16, 0.05);
    fill(P, P.team);
    circ(c, 0.55, -0.35, 0.16);
    fill(P, L.accent || '#7cc36b');
  },
  // Bombenturm: runder Steinturm, auf dem ein Bomber Bomben wirft
  bombtower(P, L) {
    const c = P.ctx;
    rrect(c, -0.75, -1.2, 1.5, 1.6, 0.2);
    fill(P, L.cloth || '#7d6e5d');
    c.save();
    c.lineWidth *= 0.6;
    c.strokeStyle = 'rgba(40,30,50,0.35)';
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(-0.75, -1.2 + i * 0.4);
      c.lineTo(0.75, -1.2 + i * 0.4);
      c.stroke();
    }
    c.restore();
    rrect(c, -0.85, -1.35, 1.7, 0.25, 0.08);
    fill(P, shade(L.cloth || '#7d6e5d', -0.25));
    rrect(c, -0.85, -0.2, 1.7, 0.16, 0.05);
    fill(P, P.team);
    const lift = P.atk > 0.5 ? (P.atk - 0.5) * 0.6 : 0;
    circ(c, 0.1, -1.55 - lift, 0.28);
    fill(P, L.accent || '#3b3b3b');
    circ(c, 0.28, -1.82 - lift, 0.06 + Math.abs(Math.sin(P.t * 20)) * 0.04);
    c.fillStyle = '#ffcf3d';
    c.fill();
  },
};

const AIM_BUILDINGS = new Set(['cannon', 'turret', 'mortar', 'ballista']);
const AIM_STEPS = 32;

function buildBuildingSprite(L, team, evo, frame, aim, heat, tt, Ud, quality) {
  const W = Math.ceil(Ud * 5.2 + 24);
  const H = Math.ceil(Ud * 5.2 + 24);
  const cx = Math.round(W / 2);
  const cy = Math.ceil(Ud * 3.4 + 12);
  const cv = scratchCanvas(0, W, H);
  const raw = cv.getContext('2d');
  raw.setTransform(Ud, 0, 0, Ud, cx, cy);
  const lc = new LitCtx(raw, { gloss: quality > 0 });
  lc.lineWidth = Math.max(0.9, Ud * 0.04) / Ud;
  lc.lineJoin = 'round';
  lc.lineCap = 'round';
  lc.strokeStyle = OUTLINE;
  const T = TEAM[team] || TEAM.blue;
  const P = { ctx: lc, t: tt, atk: frame === 'r' ? 0.85 : 0, hurt: 0, team: T.main, teamDark: T.dark, quality, evo };
  (BUILDINGS[L.body] || BUILDINGS.cannon)(P, L, { aim, aux: heat * 2 });
  const x0 = Math.max(0, Math.floor(lc.ux0) - 2);
  const y0 = Math.max(0, Math.floor(lc.uy0) - 2);
  const x1 = Math.min(W, Math.ceil(lc.ux1) + 2);
  const y1 = Math.min(H, Math.ceil(lc.uy1) + 2);
  if (!(x1 > x0 && y1 > y0)) return null;
  const out = finishSprite(cv, x0, y0, x1 - x0, y1 - y0, { outline: Math.max(1.4, Math.min(3.6, Ud * 0.06)), rim: Math.max(1, Ud * 0.04) });
  return { canvas: out, ox: cx - x0 + out.pad, oy: cy - y0 + out.pad };
}

/** Gebäude zeichnen. o = { x, y, U (halbe Kante px), t, atk, hurt, team, aim, aux, alpha, evo, quality, squash, dpr, cache } */
export function drawBuilding(ctx, look, o) {
  const L = look || {};
  if (L.image && drawSkinImage(ctx, L.image, o.x, o.y + o.U * 0.4, o.U * 2.4, o.alpha ?? 1)) return;
  if (!L.body) {
    drawPlaceholder(ctx, o.label, o.x, o.y, o.U * 0.8, o.team);
    return;
  }
  const q = o.quality ?? 2;
  const sq = o.squash || 0;
  if (o.cache !== false && typeof document !== 'undefined') {
    const dpr = o.dpr || ctxScale(ctx);
    const Ud = Math.max(4, Math.round(o.U * dpr * 2) / 2);
    const team = o.team === 'red' ? 'red' : 'blue';
    const frame = (o.atk || 0) > 0.5 ? 'r' : 'i';
    let aimB = 0;
    let aim = -Math.PI / 2;
    if (AIM_BUILDINGS.has(L.body) && o.aim != null) {
      aimB = ((Math.round((o.aim / TAU) * AIM_STEPS) % AIM_STEPS) + AIM_STEPS) % AIM_STEPS;
      aim = (aimB / AIM_STEPS) * TAU;
    }
    const heat = L.body === 'inferno' ? Math.min(3, Math.floor((o.aux || 0) * 1.5)) / 3 : 0;
    const tt = L.body === 'drill' ? (Math.floor((o.t || 0) * 8) % 3) * 0.05 : 0;
    const key = 'b|' + lookKey(L) + '|' + team + (o.evo ? 'E' : '') + '|' + frame + aimB + '|' + heat + '|' + tt + '|' + Ud + '|' + q;
    const e = sprites.obtain(key, () => buildBuildingSprite(L, team, !!o.evo, frame, aim, heat, tt, Ud, q), !!o.force);
    if (e) {
      if (o.evo && q > 0) {
        const R = o.U * 1.25;
        const g = softGlow(L.accent || '#b98cff', R * dpr, 0.25);
        ctx.save();
        ctx.globalAlpha *= 0.34 + Math.sin((o.t || 0) * 5) * 0.12;
        ctx.drawImage(g, o.x - R, o.y - o.U * 0.5 - R, R * 2, R * 2);
        ctx.restore();
      }
      const corr = (o.U * dpr) / Ud;
      blitSprite(ctx, e, o.x, o.y, (1 + sq * 0.2) * corr, (1 - sq * 0.25) * corr, o.alpha ?? 1, o.hurt || 0, dpr);
      return;
    }
  }
  const T = TEAM[o.team] || TEAM.blue;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= o.alpha;
  ctx.scale(o.U * (1 + sq * 0.2), o.U * (1 - sq * 0.25));
  ctx.lineWidth = Math.max(1.4 / o.U, 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = { ctx, t: o.t || 0, atk: o.atk || 0, hurt: o.hurt || 0, team: T.main, teamDark: T.dark, quality: q, evo: !!o.evo };
  if (o.evo && P.quality > 0) {
    ctx.save();
    ctx.globalAlpha *= 0.3 + Math.sin(P.t * 5) * 0.12;
    ell(ctx, 0, -0.5, 1.2, 1.1);
    ctx.fillStyle = L.accent || '#b98cff';
    ctx.fill();
    ctx.restore();
  }
  (BUILDINGS[L.body] || BUILDINGS.cannon)(P, L, o);
  ctx.restore();
}

// ───────────── Kronentürme ─────────────
// Ursprung = Mitte der Grundfläche am Boden, U = halbe Kantenlänge in px. Schräge Draufsicht: oben die
// Plattform mit Zinnen, darunter die Frontseite. Der Unterbau wird je Team/Typ/Schadenstufe/Größe gecacht,
// Figur und Kanone kommen getrennt darüber (Figuren-Cache bzw. gedrehtes Sprite).
const STONE = { top: '#d9d2c5', face: '#b4ab9d', dark: '#8c8376', mortar: 'rgba(60,48,40,0.32)', merlon: '#f1ece2', plinth: '#9a9184' };
export const TOWER_GEO = {
  king: { W: 0.94, H: 1.02, D: 1.42, fig: 0.86, crew: 1.25 },
  princess: { W: 0.9, H: 0.98, D: 1.3, fig: 0.72, crew: 1.25 },
};

function towerBody(P, king, stage) {
  const c = P.ctx;
  const G = king ? TOWER_GEO.king : TOWER_GEO.princess;
  const W = G.W;
  const H = G.H;
  const top1 = W - H; // Kante Plattform/Front
  const top0 = top1 - G.D; // Plattform oben (perspektivisch verkürzt)
  const bot = W; // Boden vorne
  // Sockel mit Stacheln
  rrect(c, -W - 0.08, bot - 0.22, (W + 0.08) * 2, 0.34, 0.08);
  fill(P, STONE.plinth);
  for (let i = 0; i < 6; i++) {
    const x = -W + 0.12 + (i * (W * 2 - 0.24)) / 5;
    poly(c, [x - 0.07, bot - 0.2, x + 0.07, bot - 0.2, x, bot - 0.06]);
    fill(P, '#6f675d');
  }
  // Frontseite (Ziegel)
  rrect(c, -W, top1 - 0.04, W * 2, bot - top1 - 0.12, 0.06);
  fill(P, STONE.face);
  c.save();
  rrect(c, -W, top1 - 0.04, W * 2, bot - top1 - 0.12, 0.06);
  c.clip();
  c.lineWidth *= 0.55;
  c.strokeStyle = STONE.mortar;
  const rows = 4;
  const rh = (bot - top1 - 0.12) / rows;
  for (let i = 0; i < rows; i++) {
    const y = top1 - 0.04 + i * rh;
    if (i) {
      c.beginPath();
      c.moveTo(-W, y);
      c.lineTo(W, y);
      c.stroke();
    }
    for (let k = -3; k <= 3; k++) {
      const x = k * 0.36 + (i % 2 ? 0.18 : 0);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y + rh);
      c.stroke();
    }
  }
  c.restore();
  // Plattform (Draufsicht) mit Innenboden
  rrect(c, -W, top0, W * 2, top1 - top0, 0.08);
  fill(P, STONE.top);
  const inset = 0.2;
  rrect(c, -W + inset, top0 + inset, (W - inset) * 2, top1 - top0 - inset * 2, 0.05);
  fill(P, king ? '#9b6a3e' : '#b9b0a2');
  c.save();
  rrect(c, -W + inset, top0 + inset, (W - inset) * 2, top1 - top0 - inset * 2, 0.05);
  c.clip();
  c.lineWidth *= 0.5;
  c.strokeStyle = king ? 'rgba(60,35,15,0.45)' : STONE.mortar;
  for (let i = 1; i < 6; i++) {
    const x = -W + inset + (i * (W - inset) * 2) / 6;
    c.beginPath();
    c.moveTo(x, top0);
    c.lineTo(x, top1);
    c.stroke();
  }
  c.restore();
  // Zinnen auf allen vier Seiten; Ecken in Teamfarbe (fehlende Zinnen je Schadenstufe)
  const missing = stage >= 2 ? [2, 7, 9] : stage >= 1 ? [7] : [];
  const n = king ? 5 : 4;
  const mw = (W * 2) / (n * 2 - 1);
  let idx = 0;
  const merlon = (x, y, w, h, corner) => {
    const id = idx++;
    if (missing.includes(id)) return;
    rrect(c, x, y, w, h, 0.04);
    fill(P, corner ? P.team : STONE.merlon);
    if (corner) {
      rrect(c, x, y, w, h * 0.38, 0.03);
      fill(P, shade(P.team, 0.35), false);
    }
  };
  for (let i = 0; i < n; i++) merlon(-W + i * mw * 2, top0 - 0.08, mw, 0.24, i === 0 || i === n - 1);
  for (let i = 1; i < n - 1; i++) merlon(-W - 0.02, top0 + i * mw * 2 * ((top1 - top0) / (W * 2)), 0.2, mw * 0.8, false);
  for (let i = 1; i < n - 1; i++) merlon(W - 0.18, top0 + i * mw * 2 * ((top1 - top0) / (W * 2)), 0.2, mw * 0.8, false);
  for (let i = 0; i < n; i++) merlon(-W + i * mw * 2, top1 - 0.2, mw, 0.3, i === 0 || i === n - 1);
  // Goldene Kronen-Plakette (Schild) auf der Front
  const py = top1 + (bot - top1) * (king ? 0.3 : 0.45);
  c.beginPath();
  c.moveTo(-0.28, py - 0.2);
  c.lineTo(0.28, py - 0.2);
  c.lineTo(0.28, py + 0.06);
  c.quadraticCurveTo(0.26, py + 0.22, 0, py + 0.3);
  c.quadraticCurveTo(-0.26, py + 0.22, -0.28, py + 0.06);
  c.closePath();
  fill(P, '#e7b432');
  poly(c, [-0.17, py + 0.1, -0.19, py - 0.1, -0.08, py - 0.01, 0, py - 0.13, 0.08, py - 0.01, 0.19, py - 0.1, 0.17, py + 0.1]);
  fill(P, '#fff0a0');
  if (king) {
    // Tor mit Stufen in Teamfarbe
    c.beginPath();
    c.moveTo(-0.2, bot - 0.14);
    c.lineTo(-0.2, bot - 0.26);
    c.arc(0, bot - 0.26, 0.2, Math.PI, 0);
    c.lineTo(0.2, bot - 0.14);
    c.closePath();
    fill(P, '#3d2a1c');
    rrect(c, -0.28, bot - 0.17, 0.56, 0.12, 0.03);
    fill(P, P.team);
  } else {
    // Leiter an der Front
    c.save();
    c.lineWidth *= 1.6;
    c.strokeStyle = '#7a4b2a';
    for (const lx of [0.42, 0.62]) {
      c.beginPath();
      c.moveTo(lx, top1 + 0.04);
      c.lineTo(lx, bot - 0.18);
      c.stroke();
    }
    c.lineWidth /= 1.6;
    for (let i = 0; i < 4; i++) {
      const y = top1 + 0.14 + i * 0.17;
      c.beginPath();
      c.moveTo(0.42, y);
      c.lineTo(0.62, y);
      c.stroke();
    }
    c.restore();
  }
  // Schaden: Risse, Ruß, abgebrochene Ecke
  if (stage >= 1) {
    c.save();
    c.strokeStyle = 'rgba(40,28,22,0.8)';
    c.lineWidth *= 0.9;
    const cracks = stage >= 2 ? [[-0.6, top1 + 0.05, -0.42, py, -0.55, bot - 0.3], [0.7, top1 + 0.1, 0.5, py + 0.1, 0.62, bot - 0.25], [-0.1, top0 + 0.3, 0.15, top0 + 0.6, 0.05, top1 - 0.2]] : [[0.55, top1 + 0.05, 0.4, py, 0.5, bot - 0.35]];
    for (const [x0, y0, x1, y1, x2, y2] of cracks) {
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
    }
    c.restore();
  }
  if (stage >= 2) {
    poly(c, [-W - 0.02, top1 - 0.25, -W + 0.42, top1 - 0.22, -W + 0.3, top1 + 0.2, -W - 0.02, top1 + 0.32]);
    fill(P, '#5e564c');
    for (const [sx, sy, sr] of [[-0.45, top0 + 0.5, 0.32], [0.35, top1 + 0.25, 0.26]]) {
      ell(c, sx, sy, sr, sr * 0.7);
      c.fillStyle = 'rgba(30,24,20,0.28)';
      c.fill();
    }
  }
}

function buildTowerSprite(king, team, stage, Ud, quality) {
  const W = Math.ceil(Ud * 2.6 + 24);
  const H = Math.ceil(Ud * 3.4 + 24);
  const cx = Math.round(W / 2);
  const cy = Math.ceil(Ud * 2.1 + 12);
  const cv = scratchCanvas(0, W, H);
  const raw = cv.getContext('2d');
  raw.setTransform(Ud, 0, 0, Ud, cx, cy);
  const lc = new LitCtx(raw, { gloss: quality > 0, minGlossPx: 14 });
  lc.lineWidth = Math.max(1, Ud * 0.022) / Ud;
  lc.lineJoin = 'round';
  lc.lineCap = 'round';
  lc.strokeStyle = OUTLINE;
  const T = TEAM[team] || TEAM.blue;
  towerBody({ ctx: lc, t: 0, atk: 0, hurt: 0, team: T.main, teamDark: T.dark, quality }, king, stage);
  const x0 = Math.max(0, Math.floor(lc.ux0) - 2);
  const y0 = Math.max(0, Math.floor(lc.uy0) - 2);
  const x1 = Math.min(W, Math.ceil(lc.ux1) + 2);
  const y1 = Math.min(H, Math.ceil(lc.uy1) + 2);
  const out = finishSprite(cv, x0, y0, x1 - x0, y1 - y0, { outline: Math.max(1.5, Math.min(3.5, Ud * 0.04)), rim: Math.max(1, Ud * 0.025) });
  return { canvas: out, ox: cx - x0 + out.pad, oy: cy - y0 + out.pad };
}

function buildRubbleSprite(team, Ud, quality) {
  const W = Math.ceil(Ud * 2.6 + 24);
  const cx = Math.round(W / 2);
  const cy = Math.round(W / 2);
  const cv = scratchCanvas(0, W, W);
  const raw = cv.getContext('2d');
  raw.setTransform(Ud, 0, 0, Ud, cx, cy);
  const lc = new LitCtx(raw, { gloss: quality > 0, minGlossPx: 10 });
  lc.lineWidth = Math.max(1, Ud * 0.022) / Ud;
  lc.lineJoin = 'round';
  lc.strokeStyle = OUTLINE;
  const T = TEAM[team] || TEAM.blue;
  const P = { ctx: lc, t: 0, hurt: 0, team: T.main, teamDark: T.dark, quality };
  const c = lc;
  // Brandfleck + Bretter + Steinblöcke + Stofffetzen in Teamfarbe
  ell(c, 0, 0.1, 0.95, 0.8);
  c.fillStyle = 'rgba(40,30,24,0.35)';
  c.fill();
  rrect(c, -0.55, -0.15, 0.95, 0.14, 0.03);
  fill(P, '#8a5a32');
  rrect(c, -0.2, 0.15, 0.8, 0.13, 0.03);
  fill(P, '#7a4b2a');
  for (const [x, y, w, h, col] of [
    [-0.75, -0.55, 0.5, 0.36, '#c9c1b4'],
    [0.2, -0.6, 0.55, 0.4, '#b8b0a4'],
    [-0.35, -0.2, 0.6, 0.42, '#d6cfc3'],
    [0.35, 0.05, 0.45, 0.34, '#a79f94'],
    [-0.8, 0.15, 0.42, 0.3, '#b8b0a4'],
    [-0.15, 0.35, 0.4, 0.28, '#c9c1b4'],
  ]) {
    rrect(c, x, y, w, h, 0.06);
    fill(P, col);
  }
  poly(c, [0.45, -0.25, 0.85, -0.12, 0.62, 0.05]);
  fill(P, P.team);
  const x0 = Math.max(0, Math.floor(lc.ux0) - 2);
  const y0 = Math.max(0, Math.floor(lc.uy0) - 2);
  const x1 = Math.min(W, Math.ceil(lc.ux1) + 2);
  const y1 = Math.min(W, Math.ceil(lc.uy1) + 2);
  const out = finishSprite(cv, x0, y0, x1 - x0, y1 - y0, { outline: Math.max(1.2, Ud * 0.03), rim: 1 });
  return { canvas: out, ox: cx - x0 + out.pad, oy: cy - y0 + out.pad };
}

function buildCannonSprite(Ud) {
  const W = Math.ceil(Ud * 1.4 + 16);
  const H = Math.ceil(Ud * 0.7 + 16);
  const cx = Math.round(Ud * 0.3 + 8);
  const cy = Math.round(H / 2);
  const cv = scratchCanvas(0, W, H);
  const raw = cv.getContext('2d');
  raw.setTransform(Ud, 0, 0, Ud, cx, cy);
  const lc = new LitCtx(raw, { gloss: true, minGlossPx: 6 });
  lc.lineWidth = Math.max(1, Ud * 0.03) / Ud;
  lc.lineJoin = 'round';
  lc.strokeStyle = OUTLINE;
  const P = { ctx: lc, hurt: 0 };
  rrect(lc, -0.2, -0.2, 1.05, 0.4, 0.16);
  fill(P, '#3b3f48');
  rrect(lc, 0.72, -0.25, 0.16, 0.5, 0.06);
  fill(P, '#2b2e35');
  circ(lc, -0.12, 0, 0.24);
  fill(P, '#4b4f58');
  const out = finishSprite(cv, 0, 0, W, H, { outline: Math.max(1.2, Ud * 0.04), rim: 1 });
  return { canvas: out, ox: cx + out.pad, oy: cy + out.pad };
}

/**
 * Kronenturm zeichnen. o = { x, y, U, t, king, active, team, hurt, atk, destroyed, aim, quality, mood, dpr, stage (0–2), back }
 * Gibt die Position über der Figur zurück (für Schlaf-„z“ u. Ä.).
 */
export function drawTower(ctx, o) {
  const dpr = o.dpr || ctxScale(ctx);
  const q = o.quality ?? 2;
  const Ud = Math.max(6, Math.round(o.U * dpr * 2) / 2);
  const team = o.team === 'red' ? 'red' : 'blue';
  const corr = (o.U * dpr) / Ud;
  if (o.destroyed) {
    const e = sprites.obtain('tr|' + team + '|' + Ud + '|' + q, () => buildRubbleSprite(team, Ud, q), true);
    if (e) blitSprite(ctx, e, o.x, o.y, corr, corr, 1, 0, dpr);
    return null;
  }
  const king = !!o.king;
  const stage = o.stage || 0;
  const e = sprites.obtain('tw|' + (king ? 'K' : 'P') + team + '|' + stage + '|' + Ud + '|' + q, () => buildTowerSprite(king, team, stage, Ud, q), true);
  if (e) blitSprite(ctx, e, o.x, o.y, corr, corr, 1, o.hurt || 0, dpr);
  const G = king ? TOWER_GEO.king : TOWER_GEO.princess;
  const fx = o.x;
  const fy = o.y + (G.W - G.H - G.D * 0.38) * o.U;
  const back = !!o.back;
  const facing = o.aim == null ? 1 : Math.cos(o.aim) >= 0 ? 1 : -1;
  if (king) {
    if (o.active) {
      const ce = sprites.obtain('tc|' + Math.round(Ud * 0.62 * 2) / 2, () => buildCannonSprite(Math.round(Ud * 0.62 * 2) / 2), true);
      if (ce) {
        const k = 1 / dpr;
        const rec = (o.atk || 0) > 0.5 ? ((o.atk - 0.5) / 0.5) * o.U * 0.12 : 0;
        ctx.save();
        ctx.translate(fx + o.U * 0.32, fy - o.U * 0.18);
        ctx.rotate(o.aim ?? -Math.PI / 2);
        ctx.translate(-rec, 0);
        ctx.drawImage(ce.canvas, -ce.ox * k, -ce.oy * k, ce.canvas.width * k, ce.canvas.height * k);
        ctx.restore();
      }
    }
  }
  // Turmfigur (König bzw. Turmwache) aus der Figuren-Laufzeit; o.tile = Feldgröße in px (sonst aus der Turmgröße)
  const tile = o.tile || o.U / (king ? 2 : 1.5);
  const atk = o.active || !king ? o.atk || 0 : 0;
  const state = king && !o.active ? 'sleep' : atk > 0 ? 'attack' : 'idle';
  const r = drawCharacter(ctx, {
    figure: king ? 'tower-king' : 'tower-guard',
    team,
    x: king ? fx - (o.active ? o.U * 0.22 : 0) : fx,
    y: fy,
    scale: tile * G.crew,
    dpr,
    face: king ? (back ? 1 : -facing) : facing,
    view: back ? 'back' : 'front',
    state,
    // Angriff: atk fällt nach dem Schuss von 1 auf 0 – das Trefferbild liegt auf dem Ereignis
    u: state === 'attack' ? Math.min(0.999, 0.55 + (1 - atk) * 0.45) : null,
    time: o.t || 0,
    flash: (o.hurt || 0) * 0.6,
  });
  return [fx, r ? r.top : fy - tile * G.crew * 1.5];
}

// ───────────── Zauber-Symbole (Ursprung Mitte, Radius 1) ─────────────
const ICONS = {
  arrows(P, col) {
    const c = P.ctx;
    for (const [x, y] of [[-0.45, -0.1], [0.05, -0.35], [0.45, 0.05]]) {
      c.save();
      c.translate(x, y);
      c.rotate(0.6);
      rrect(c, -0.05, -0.5, 0.1, 0.9, 0.04);
      fill(P, '#8a5a32');
      poly(c, [-0.14, 0.35, 0.14, 0.35, 0, 0.6]);
      fill(P, '#dfe6ee');
      poly(c, [-0.14, -0.55, 0, -0.4, 0.14, -0.55, 0, -0.3]);
      fill(P, col);
      c.restore();
    }
  },
  fireball(P, col) {
    const c = P.ctx;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-0.9 + i * 0.1, -0.7 + i * 0.35);
      c.quadraticCurveTo(-0.2, -0.3 + i * 0.1, 0.1, 0.0);
      c.lineTo(-0.1, 0.25);
      c.closePath();
      fill(P, i === 1 ? '#ffd84d' : col);
    }
    circ(c, 0.25, 0.2, 0.5);
    fill(P, col);
    circ(c, 0.3, 0.15, 0.28);
    fill(P, '#ffd84d');
  },
  zap(P, col) {
    poly(P.ctx, [0.2, -0.9, -0.45, 0.1, -0.05, 0.1, -0.3, 0.9, 0.45, -0.15, 0.05, -0.15, 0.3, -0.9]);
    fill(P, col);
  },
  log(P) {
    const c = P.ctx;
    rrect(c, -0.9, -0.3, 1.6, 0.6, 0.3);
    fill(P, '#9b6a3a');
    ell(c, 0.7, 0, 0.22, 0.3);
    fill(P, '#e3b77a');
    ell(c, 0.7, 0, 0.1, 0.14);
    c.stroke();
  },
  freeze(P, col) {
    const c = P.ctx;
    for (let i = 0; i < 6; i++) {
      c.save();
      c.rotate((i / 6) * TAU);
      rrect(c, -0.07, -0.85, 0.14, 0.85, 0.05);
      fill(P, col);
      poly(c, [-0.25, -0.65, 0, -0.5, 0.25, -0.65, 0, -0.42]);
      fill(P, '#ffffff');
      c.restore();
    }
    circ(c, 0, 0, 0.2);
    fill(P, '#ffffff');
  },
  poison(P, col) {
    const c = P.ctx;
    for (const [x, y, r] of [[-0.45, 0.15, 0.4], [0.35, 0.2, 0.45], [0, -0.25, 0.5]]) {
      circ(c, x, y, r);
      fill(P, col);
    }
    circ(c, -0.1, -0.2, 0.08);
    c.fillStyle = OUTLINE;
    c.fill();
    circ(c, 0.15, -0.2, 0.08);
    c.fill();
  },
  comet(P, col) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(-0.9, -0.9);
    c.lineTo(0.05, -0.2);
    c.lineTo(-0.25, 0.05);
    c.closePath();
    fill(P, '#ffb347');
    circ(c, 0.2, 0.2, 0.5);
    fill(P, '#7a6a5a');
    circ(c, 0.05, 0.1, 0.12);
    fill(P, '#5a4a3a');
    circ(c, 0.35, 0.35, 0.09);
    fill(P, '#5a4a3a');
    c.save();
    c.globalAlpha = 0.6;
    circ(c, 0.2, 0.2, 0.62);
    c.strokeStyle = col;
    c.stroke();
    c.restore();
  },
  storm(P, col) {
    const c = P.ctx;
    for (const [x, y, r] of [[-0.45, -0.3, 0.35], [0.05, -0.5, 0.45], [0.45, -0.25, 0.35]]) {
      circ(c, x, y, r);
      fill(P, '#8d97a8');
    }
    poly(c, [0.1, -0.1, -0.3, 0.45, -0.05, 0.45, -0.25, 0.95, 0.35, 0.3, 0.1, 0.3, 0.3, -0.1]);
    fill(P, col);
  },
  barrel(P, col) {
    const c = P.ctx;
    for (const sgn of [-1, 1]) {
      poly(c, [sgn * 0.2, -0.6, sgn * 0.55, -0.95, sgn * 0.4, -0.5]);
      fill(P, '#7cc36b');
    }
    rrect(c, -0.5, -0.65, 1.0, 1.3, 0.3);
    fill(P, col);
    rrect(c, -0.5, -0.35, 1.0, 0.1, 0.03);
    fill(P, '#6b6f7a');
    rrect(c, -0.5, 0.25, 1.0, 0.1, 0.03);
    fill(P, '#6b6f7a');
  },
  grave(P, col) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(-0.45, 0.6);
    c.lineTo(-0.45, -0.3);
    c.arc(0, -0.3, 0.45, Math.PI, 0);
    c.lineTo(0.45, 0.6);
    c.closePath();
    fill(P, col);
    rrect(c, -0.06, -0.5, 0.12, 0.55, 0.03);
    fill(P, shade(col, -0.3));
    rrect(c, -0.22, -0.35, 0.44, 0.12, 0.03);
    fill(P, shade(col, -0.3));
    rrect(c, -0.8, 0.5, 1.6, 0.3, 0.12);
    fill(P, '#6b4e36');
  },
  tornado(P, col) {
    const c = P.ctx;
    for (let i = 0; i < 5; i++) {
      const w = 0.85 - i * 0.15;
      ell(c, (i % 2 ? 0.08 : -0.08), -0.6 + i * 0.32, w, 0.13);
      fill(P, i % 2 ? shade(col, -0.15) : col);
    }
  },
  quake(P, col) {
    const c = P.ctx;
    rrect(c, -0.9, 0.05, 1.8, 0.55, 0.15);
    fill(P, col);
    poly(c, [-0.5, 0.05, -0.2, 0.35, 0.05, 0.1, 0.3, 0.45, 0.55, 0.05]);
    c.fillStyle = OUTLINE;
    c.fill();
    for (const [x, y] of [[-0.5, -0.35], [0.1, -0.55], [0.55, -0.3]]) {
      rrect(c, x - 0.14, y - 0.14, 0.28, 0.28, 0.06);
      fill(P, shade(col, 0.2));
    }
  },
  clone(P, col) {
    const c = P.ctx;
    for (const [x, a] of [[-0.25, 0.55], [0.2, 1]]) {
      c.save();
      c.globalAlpha *= a;
      circ(c, x, -0.35, 0.3);
      fill(P, col);
      ell(c, x, 0.3, 0.42, 0.42);
      fill(P, col);
      c.restore();
    }
    star(P, 0.6, -0.65, 0.16, '#ffffff');
  },
  mirror(P, col) {
    const c = P.ctx;
    rrect(c, -0.1, 0.45, 0.2, 0.45, 0.06);
    fill(P, '#c9a227');
    ell(c, 0, -0.15, 0.55, 0.7);
    fill(P, '#c9a227');
    ell(c, 0, -0.15, 0.42, 0.56);
    fill(P, col);
    c.save();
    c.globalAlpha *= 0.8;
    c.beginPath();
    c.moveTo(-0.2, -0.5);
    c.lineTo(0.05, -0.55);
    c.lineTo(-0.25, 0.15);
    c.closePath();
    c.fillStyle = '#ffffff';
    c.fill();
    c.restore();
  },
  snowball(P, col) {
    const c = P.ctx;
    circ(c, 0.05, 0.05, 0.62);
    fill(P, col);
    for (const [x, y, r] of [[-0.2, -0.2, 0.1], [0.25, 0.15, 0.08], [0.0, 0.35, 0.07]]) {
      circ(c, x, y, r);
      fill(P, '#cfe3f5', false);
    }
    for (const sx of [-0.85, -0.7]) {
      c.beginPath();
      c.moveTo(sx, -0.4);
      c.lineTo(sx + 0.25, -0.2);
      c.stroke();
    }
  },
  curse(P, col) {
    const c = P.ctx;
    circ(c, 0, -0.1, 0.55);
    fill(P, col);
    for (const ex of [-0.2, 0.2]) {
      ell(c, ex, -0.2, 0.12, 0.15);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    rrect(c, -0.25, 0.15, 0.5, 0.18, 0.05);
    c.fillStyle = OUTLINE;
    c.fill();
    for (const [x, y] of [[-0.75, -0.6], [0.75, -0.5], [0.65, 0.55]]) {
      circ(c, x, y, 0.1);
      fill(P, '#b98cff');
    }
  },
  rage(P, col) {
    const c = P.ctx;
    rrect(c, -0.18, -0.8, 0.36, 0.35, 0.06);
    fill(P, '#8a5a32');
    c.beginPath();
    c.moveTo(-0.18, -0.48);
    c.lineTo(-0.6, 0.45);
    c.quadraticCurveTo(0, 0.85, 0.6, 0.45);
    c.lineTo(0.18, -0.48);
    c.closePath();
    fill(P, col);
    for (const [x, y, r] of [[-0.15, 0.2, 0.09], [0.15, -0.05, 0.07], [0.05, 0.4, 0.06]]) {
      circ(c, x, y, r);
      fill(P, '#f3c6ff', false);
    }
  },
  crate(P, col) {
    const c = P.ctx;
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.moveTo(sgn * 0.4, -0.45);
      c.quadraticCurveTo(sgn * 0.6, -0.9, 0, -1.0);
      c.stroke();
    }
    rrect(c, -0.6, -0.45, 1.2, 1.05, 0.08);
    fill(P, '#b07a3e');
    c.beginPath();
    c.moveTo(-0.6, -0.45);
    c.lineTo(0.6, 0.6);
    c.moveTo(0.6, -0.45);
    c.lineTo(-0.6, 0.6);
    c.stroke();
    rrect(c, -0.6, -0.05, 1.2, 0.2, 0.04);
    fill(P, col);
  },
  vines(P, col) {
    const c = P.ctx;
    for (const [x0, bend] of [[-0.45, 0.4], [0.0, -0.35], [0.45, 0.3]]) {
      c.beginPath();
      c.moveTo(x0, 0.75);
      c.quadraticCurveTo(x0 + bend, 0, x0 - bend * 0.5, -0.75);
      c.lineWidth *= 3.2;
      c.stroke();
      c.lineWidth /= 3.2;
      c.save();
      c.lineWidth *= 2;
      c.strokeStyle = col;
      c.stroke();
      c.restore();
      ell(c, x0 + bend * 0.45, -0.1, 0.14, 0.08, 0.6);
      fill(P, shade(col, 0.25));
    }
  },
  void(P, col) {
    const c = P.ctx;
    circ(c, 0, 0, 0.7);
    fill(P, col);
    circ(c, 0, 0, 0.45);
    fill(P, shade(col, -0.45));
    circ(c, 0, 0, 0.18);
    fill(P, '#000000');
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1;
      circ(c, Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0.09);
      fill(P, '#d7b5ff');
    }
  },
};

export function drawSpellIcon(ctx, look, x, y, R, hurt = 0, label = '') {
  const L = look || {};
  if (L.image && drawSkinImage(ctx, L.image, x, y + R, R * 2)) return;
  if (!L.icon) {
    drawPlaceholder(ctx, label, x, y + R * 0.7, R * 0.7);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(R, R);
  ctx.lineWidth = Math.max(1.5 / R, 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = { ctx, t: 0, hurt, quality: 2 };
  (ICONS[L.icon] || ICONS.zap)(P, L.color || '#ffd84d');
  ctx.restore();
}

// ───────────── Emote-Gesichter ─────────────
export function drawEmoteFace(ctx, face, x, y, R, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(R, R);
  ctx.lineWidth = Math.max(1.6 / R, 0.06);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = { ctx, t, hurt: 0, quality: 2 };
  const c = ctx;
  const faceCol = face === 'angry' ? '#ff7a5c' : face === 'cry' ? '#9fd3ff' : '#ffd84d';
  circ(c, 0, 0, 0.9);
  fill(P, faceCol);
  const blink = Math.sin(t * 3) > 0.97;
  if (face === 'laugh') {
    for (const ex of [-0.32, 0.32]) {
      c.beginPath();
      c.arc(ex, -0.15, 0.15, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    }
    c.beginPath();
    c.arc(0, 0.12, 0.45, 0.1, Math.PI - 0.1);
    c.closePath();
    fill(P, '#7a2222');
    ell(c, 0, 0.45, 0.2, 0.1);
    fill(P, '#ff8a8a', false);
    for (const ex of [-0.6, 0.6]) {
      ell(c, ex, -0.05, 0.1, 0.16);
      c.fillStyle = '#6fc8ff';
      c.fill();
    }
  } else if (face === 'angry') {
    for (const ex of [-0.32, 0.32]) {
      circ(c, ex, -0.05, 0.13);
      fill(P, '#ffffff');
      circ(c, ex, -0.02, 0.06);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    c.beginPath();
    c.moveTo(-0.55, -0.4);
    c.lineTo(-0.15, -0.22);
    c.moveTo(0.15, -0.22);
    c.lineTo(0.55, -0.4);
    c.lineWidth *= 1.6;
    c.stroke();
    c.lineWidth /= 1.6;
    c.beginPath();
    c.arc(0, 0.55, 0.3, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
    const puff = (t * 2) % 1;
    c.save();
    c.globalAlpha = 1 - puff;
    circ(c, 0.85 + puff * 0.3, -0.85 - puff * 0.3, 0.15 + puff * 0.1);
    c.fillStyle = '#ffffff';
    c.fill();
    c.restore();
  } else if (face === 'cry') {
    for (const ex of [-0.32, 0.32]) {
      c.beginPath();
      c.arc(ex, -0.1, 0.14, Math.PI * 0.1, Math.PI * 0.9);
      c.stroke();
      const d = (t * 1.5 + (ex > 0 ? 0.5 : 0)) % 1;
      ell(c, ex, 0.1 + d * 0.6, 0.08, 0.12);
      c.fillStyle = '#3aa0ff';
      c.fill();
    }
    c.beginPath();
    c.arc(0, 0.55, 0.25, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
  } else if (face === 'wow') {
    for (const ex of [-0.32, 0.32]) {
      circ(c, ex, -0.15, 0.17);
      fill(P, '#ffffff');
      circ(c, ex, -0.15, 0.08);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    ell(c, 0, 0.35, 0.18, 0.24);
    fill(P, '#7a2222');
    star(P, 0.75, -0.7, 0.18 + Math.sin(t * 8) * 0.04, '#ffffff');
  } else if (face === 'thumbs') {
    for (const ex of [-0.32, 0.32]) {
      if (blink) {
        c.beginPath();
        c.moveTo(ex - 0.12, -0.15);
        c.lineTo(ex + 0.12, -0.15);
        c.stroke();
      } else {
        ell(c, ex, -0.15, 0.1, 0.14);
        c.fillStyle = OUTLINE;
        c.fill();
      }
    }
    c.beginPath();
    c.arc(0, 0.1, 0.4, 0.2, Math.PI - 0.2);
    c.stroke();
    c.save();
    c.translate(0.72, 0.45);
    c.rotate(Math.sin(t * 6) * 0.15);
    rrect(c, -0.2, -0.1, 0.4, 0.4, 0.1);
    fill(P, '#ffd84d');
    rrect(c, -0.12, -0.45, 0.16, 0.4, 0.08);
    fill(P, '#ffd84d');
    c.restore();
  } else {
    // wave
    for (const ex of [-0.32, 0.32]) {
      ell(c, ex, -0.15, 0.1, 0.14);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    c.beginPath();
    c.arc(0, 0.05, 0.42, 0.25, Math.PI - 0.25);
    c.stroke();
    c.save();
    c.translate(-0.85, -0.3);
    c.rotate(Math.sin(t * 10) * 0.4);
    ell(c, 0, -0.1, 0.22, 0.28);
    fill(P, '#ffd84d');
    c.restore();
  }
  ctx.restore();
}

// ───────────── Kartenbilder ─────────────
const TYPE_BG = {
  troop: ['#6fb7ff', '#3564c9'],
  building: ['#e0b27a', '#9a5f2e'],
  spell: ['#c79bff', '#6b3fc4'],
  champion: ['#ffe07a', '#d18a1c'],
  hero: ['#ff9d8a', '#c0394b'],
};

/** Zeichnet das Motiv einer Karte (ohne Rahmen) in ein Rechteck. Gibt false zurück, solange eine Figur noch lädt. */
export function drawCardArt(ctx, db, card, x, y, w, h, opts = {}) {
  const evo = !!opts.evo && !!card.evo;
  let missing = false;
  const kind = card.class === 'champion' ? 'champion' : card.class === 'hero' ? 'hero' : card.type;
  const [c1, c2] = evo ? ['#e4b5ff', '#5b2bb3'] : TYPE_BG[kind] || TYPE_BG.troop;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // Sonnenstrahlen
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ffffff';
  const cx = x + w / 2;
  const cy = y + h * 0.55;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Math.max(w, h), a, a + 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const base = { t: 0.3, team: 'blue', fx: 1, quality: 2, evo, label: card.name };
  if (card.type === 'spell') {
    drawSpellIcon(ctx, card.look, cx, cy - h * 0.04, Math.min(w, h) * 0.34, 0, card.name);
  } else {
    // Eigene Einheit der Karte (mit Evo) bzw. gemischte Gruppen (Koboldbande, Rabauken, Goblinstein)
    const own = db.unitRefOf(card);
    const groups = db.groupsOf(card, evo);
    const defs = [];
    for (const g of groups) {
      const mine = g.unit === own || g.unit === card.id;
      defs.push({ type: mine ? own || card.id : g.unit, def: mine ? db.unit(card.id, evo) : db.unit(g.unit), n: g.count || 1, mine });
    }
    const picks = [];
    if (defs.length > 1) {
      for (const d of defs) picks.push(d);
      if (picks.length < 3 && defs[0].n > 1) picks.push(defs[0]);
    } else {
      for (let i = 0; i < Math.min(defs[0].n, 3); i++) picks.push(defs[0]);
    }
    // Figur je Pick: skin.json „character“ ersetzt die Figur der eigenen Einheit
    const figOf = (p) => (p.mine && card.character && figureEntry(card.character) ? { figure: card.character } : figureForType(p.type));
    const first = figOf(picks[0]);
    const ownLook = picks[0].mine ? picks[0].def.look : null;
    if (ownLook?.image && drawLookImage(ctx, ownLook, cx, y + h * 0.9, h * 0.72)) {
      // eigenes Bild aus skin.json ersetzt die Figur
    } else if (card.type === 'building' && !first) {
      // Gebäude ohne Figur (Kanone, Tesla, …) bleiben beim Gebäude-Baukasten
      drawBuilding(ctx, picks[0].def.look || {}, { ...base, x: cx, y: y + h * 0.78, U: Math.min(w, h) * 0.3, aim: -0.4 });
    } else {
      const n = Math.min(picks.length, 3);
      const offs = n === 1 ? [0] : n === 2 ? [-0.2, 0.2] : [-0.26, 0, 0.26];
      const order = n === 3 ? [0, 2, 1] : offs.map((_, i) => i);
      for (const i of order) {
        const f = figOf(picks[i]);
        const ent = f && figureEntry(f.figure);
        if (!ent) {
          missing = true;
          continue;
        }
        // Kartenbild füllt den Rahmen unabhängig von der Größe im Spiel: Figur auf Höhe und Breite einpassen
        const [bx0, by0, bx1] = ent.box;
        const k = n === 3 && i === 1 ? 1 : n > 1 ? 0.8 : 1;
        const ppmu = Math.min((h * 0.7) / Math.max(20, -by0), (w * (n > 1 ? 0.5 : 0.86)) / Math.max(20, bx1 - bx0)) * k;
        const groundY = y + h * 0.9 - (n === 3 && i !== 1 ? h * 0.06 : 0);
        const r = drawCharacter(ctx, { figure: f.figure, form: f.form, evo, team: 'blue', x: cx + offs[i] * w - ((bx0 + bx1) / 2) * ppmu, y: groundY, scale: ppmu * 50, dpr: 1, face: 1, view: 'front', state: 'idle', u: 0.25, variant: i, big: true });
        if (!r) missing = true;
      }
    }
  }
  ctx.restore();
  // false: eine Figur lädt noch – das Bild nicht zwischenspeichern
  return !missing;
}

/** Baukasten-Katalog für das Asset-Manifest (design/manifest.js): Namen der prozeduralen Zeichenfunktionen. */
export function assetCatalog() {
  return {
    buildings: Object.keys(BUILDINGS),
    spellIcons: Object.keys(ICONS),
    towers: ['king', 'princess', 'rubble', 'cannon'],
  };
}
