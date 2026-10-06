// Prozedural gezeichnete Cartoon-Figuren: Einheiten, Gebäude, Türme, Zauber-Symbole.
// Konvention: Ursprung = Fußpunkt (Boden), y nach oben negativ. Einheit "U" = Pixelgröße.
import { T } from '../ui/tokens.js';

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
  c.fillStyle = P.hurt > 0 ? mix(color, '#ffffff', P.hurt * 0.8) : color;
  c.fill();
  if (stroke) c.stroke();
}

function swingAngle(a) {
  if (a <= 0) return 0;
  if (a > 0.6) return (-1.3 * (1 - a)) / 0.4;
  if (a > 0.2) return -1.3 + (2.1 * (0.6 - a)) / 0.4;
  return (0.8 * a) / 0.2;
}

// ───────────── Augen & Gesichter ─────────────
function eyes(P, x, y, s = 1, mood = null) {
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

// ───────────── Waffen (lokal: Griff im Ursprung, zeigt nach oben) ─────────────
const WEAPONS = {
  sword(P) {
    const c = P.ctx;
    poly(c, [-0.05, -0.1, 0.05, -0.1, 0.05, -0.78, 0, -0.9, -0.05, -0.78]);
    fill(P, '#dfe6ee');
    rrect(c, -0.15, -0.14, 0.3, 0.07, 0.03);
    fill(P, '#c9a13b');
    rrect(c, -0.035, -0.1, 0.07, 0.16, 0.02);
    fill(P, '#6b4226');
  },
  dagger(P) {
    const c = P.ctx;
    poly(c, [-0.045, -0.08, 0.045, -0.08, 0.03, -0.42, 0, -0.5, -0.03, -0.42]);
    fill(P, '#e8eef4');
    rrect(c, -0.1, -0.1, 0.2, 0.05, 0.02);
    fill(P, '#7d5a3a');
  },
  blades(P) {
    const c = P.ctx;
    for (const off of [-0.07, 0.07]) {
      c.save();
      c.rotate(off * 3);
      poly(c, [-0.035, -0.05, 0.035, -0.05, 0.02, -0.55, 0, -0.62, -0.02, -0.55]);
      fill(P, '#bff5ec');
      c.restore();
    }
  },
  axe(P) {
    const c = P.ctx;
    rrect(c, -0.04, -0.8, 0.08, 0.9, 0.03);
    fill(P, '#7a4b2a');
    c.beginPath();
    c.moveTo(0.02, -0.78);
    c.quadraticCurveTo(0.42, -0.72, 0.36, -0.42);
    c.quadraticCurveTo(0.2, -0.5, 0.02, -0.5);
    c.closePath();
    fill(P, '#cfd6de');
  },
  club(P) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(-0.05, 0.05);
    c.lineTo(-0.13, -0.6);
    c.quadraticCurveTo(0, -0.85, 0.13, -0.6);
    c.lineTo(0.05, 0.05);
    c.closePath();
    fill(P, '#9a6536');
  },
  hammer(P) {
    const c = P.ctx;
    rrect(c, -0.04, -0.75, 0.08, 0.85, 0.03);
    fill(P, '#7a4b2a');
    rrect(c, -0.24, -0.92, 0.48, 0.26, 0.05);
    fill(P, '#8d97a3');
  },
  mace(P) {
    const c = P.ctx;
    rrect(c, -0.04, -0.6, 0.08, 0.7, 0.03);
    fill(P, '#6b4226');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      poly(c, [Math.cos(a) * 0.14, -0.75 + Math.sin(a) * 0.14, Math.cos(a + 0.3) * 0.26, -0.75 + Math.sin(a + 0.3) * 0.26, Math.cos(a + 0.6) * 0.14, -0.75 + Math.sin(a + 0.6) * 0.14]);
      fill(P, '#b8c0c9');
    }
    circ(P.ctx, 0, -0.75, 0.17);
    fill(P, '#9aa3ad');
  },
  spear(P) {
    const c = P.ctx;
    rrect(c, -0.035, -1.1, 0.07, 1.25, 0.03);
    fill(P, '#8a5a32');
    poly(c, [-0.09, -1.05, 0.09, -1.05, 0, -1.35]);
    fill(P, '#dfe6ee');
  },
  lance(P) {
    const c = P.ctx;
    poly(c, [-0.1, -0.1, 0.1, -0.1, 0.02, -1.4, -0.02, -1.4]);
    fill(P, P.accent || '#e7c64b');
    ell(c, 0, -0.1, 0.16, 0.06);
    fill(P, '#8d97a3');
  },
  bow(P) {
    const c = P.ctx;
    const pull = P.atk > 0.4 ? (P.atk - 0.4) * 0.35 : 0;
    c.beginPath();
    c.moveTo(0, -0.62);
    c.quadraticCurveTo(0.34, -0.2, 0, 0.22);
    c.lineWidth *= 1.4;
    c.strokeStyle = '#8a5a32';
    c.stroke();
    c.lineWidth /= 1.4;
    c.strokeStyle = OUTLINE;
    c.beginPath();
    c.moveTo(0, -0.62);
    c.lineTo(-pull, -0.2);
    c.lineTo(0, 0.22);
    c.save();
    c.lineWidth *= 0.5;
    c.strokeStyle = '#f5f0e0';
    c.stroke();
    c.restore();
  },
  crossbow(P) {
    const c = P.ctx;
    rrect(c, -0.06, -0.45, 0.12, 0.55, 0.03);
    fill(P, '#7a4b2a');
    c.beginPath();
    c.moveTo(-0.32, -0.28);
    c.quadraticCurveTo(0, -0.52, 0.32, -0.28);
    c.lineWidth *= 1.6;
    c.stroke();
    c.lineWidth /= 1.6;
  },
  staff(P) {
    const c = P.ctx;
    rrect(c, -0.04, -1.0, 0.08, 1.15, 0.03);
    fill(P, '#6b4226');
    c.save();
    c.shadowColor = P.accent || '#ffd84d';
    c.shadowBlur = P.quality > 1 ? 8 : 0;
    circ(c, 0, -1.08, 0.13);
    fill(P, P.accent || '#ffd84d');
    c.restore();
  },
  orb(P) {
    const c = P.ctx;
    c.save();
    c.shadowColor = P.accent || '#7fe9ff';
    c.shadowBlur = P.quality > 1 ? 10 : 0;
    circ(c, 0, -0.12, 0.17 + Math.sin(P.t * 8) * 0.015);
    fill(P, P.accent || '#7fe9ff');
    c.restore();
  },
  bomb(P) {
    const c = P.ctx;
    circ(c, 0, -0.18, 0.2);
    fill(P, '#2b2b35');
    c.beginPath();
    c.moveTo(0.1, -0.35);
    c.quadraticCurveTo(0.2, -0.48, 0.14, -0.55);
    c.stroke();
    circ(c, 0.14, -0.57, 0.05 + Math.abs(Math.sin(P.t * 15)) * 0.03);
    c.fillStyle = '#ffcf3d';
    c.fill();
  },
  sling(P) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(0, 0.05);
    c.lineTo(0, -0.25);
    c.moveTo(0, -0.25);
    c.lineTo(-0.12, -0.45);
    c.moveTo(0, -0.25);
    c.lineTo(0.12, -0.45);
    c.lineWidth *= 1.8;
    c.strokeStyle = '#7a4b2a';
    c.stroke();
    c.lineWidth /= 1.8;
    c.strokeStyle = OUTLINE;
  },
  lantern(P) {
    const c = P.ctx;
    rrect(c, -0.03, -0.9, 0.06, 1.0, 0.03);
    fill(P, '#6b4226');
    c.save();
    c.shadowColor = '#b8ff6a';
    c.shadowBlur = P.quality > 1 ? 10 : 0;
    rrect(c, -0.12, -1.12, 0.24, 0.26, 0.06);
    fill(P, '#d9ff8a');
    c.restore();
  },
  wrench(P) {
    const c = P.ctx;
    rrect(c, -0.04, -0.55, 0.08, 0.65, 0.03);
    fill(P, '#aab3bd');
    c.beginPath();
    c.arc(0, -0.62, 0.13, 0.9, TAU - 0.9 + Math.PI * 2, false);
    fill(P, '#aab3bd');
  },
  pick(P) {
    const c = P.ctx;
    rrect(c, -0.04, -0.7, 0.08, 0.8, 0.03);
    fill(P, '#7a4b2a');
    c.beginPath();
    c.moveTo(-0.35, -0.55);
    c.quadraticCurveTo(0, -0.85, 0.35, -0.55);
    c.quadraticCurveTo(0, -0.72, -0.35, -0.55);
    fill(P, '#aab3bd');
  },
  launcher(P) {
    const c = P.ctx;
    c.save();
    c.rotate(0.5);
    rrect(c, -0.09, -0.75, 0.18, 0.8, 0.05);
    fill(P, '#d8425a');
    rrect(c, -0.11, -0.8, 0.22, 0.1, 0.03);
    fill(P, '#ffd84d');
    c.restore();
  },
  fists() {},
};

// ───────────── Hüte & Frisuren (Kopfmittelpunkt hx,hy, Radius r) ─────────────
const HATS = {
  helmet(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy - r * 0.05, r * 1.05, Math.PI * 1.02, Math.PI * 1.98);
    c.lineTo(hx + r * 1.05, hy + r * 0.1);
    c.lineTo(hx - r * 1.05, hy + r * 0.1);
    c.closePath();
    fill(P, P.metal || '#b9c3cf');
    rrect(c, hx - r * 0.1, hy - r * 1.3, r * 0.2, r * 0.3, r * 0.08);
    fill(P, P.team);
  },
  hood(P, hx, hy, r, back) {
    const c = P.ctx;
    if (back) {
      ell(c, hx - r * 0.1, hy + r * 0.05, r * 1.18, r * 1.15);
      fill(P, shade(P.cloth, -0.15));
      return;
    }
    c.beginPath();
    c.arc(hx - r * 0.05, hy, r * 1.12, Math.PI * 1.05, Math.PI * 1.95);
    c.quadraticCurveTo(hx + r * 0.6, hy - r * 0.55, hx - r * 0.05, hy - r * 0.62);
    c.quadraticCurveTo(hx - r * 0.7, hy - r * 0.55, hx - r * 1.1, hy - r * 0.2);
    c.closePath();
    fill(P, shade(P.cloth, -0.05));
  },
  wizard(P, hx, hy, r) {
    const c = P.ctx;
    ell(c, hx, hy - r * 0.62, r * 1.35, r * 0.28);
    fill(P, shade(P.cloth, -0.15));
    c.beginPath();
    c.moveTo(hx - r * 0.8, hy - r * 0.7);
    c.quadraticCurveTo(hx - r * 0.2, hy - r * 2.6, hx + r * 0.9, hy - r * 2.3 + Math.sin(P.t * 3) * r * 0.1);
    c.quadraticCurveTo(hx + r * 0.1, hy - r * 1.8, hx + r * 0.8, hy - r * 0.7);
    c.closePath();
    fill(P, P.cloth);
    star(P, hx, hy - r * 1.3, r * 0.22, '#ffd84d');
  },
  witch(P, hx, hy, r) {
    const c = P.ctx;
    ell(c, hx, hy - r * 0.6, r * 1.4, r * 0.25);
    fill(P, '#2b1f3d');
    c.beginPath();
    c.moveTo(hx - r * 0.7, hy - r * 0.68);
    c.lineTo(hx - r * 0.3, hy - r * 2.2);
    c.lineTo(hx - r * 0.9, hy - r * 2.5);
    c.lineTo(hx + r * 0.75, hy - r * 0.68);
    c.closePath();
    fill(P, '#3a2952');
    rrect(c, hx - r * 0.68, hy - r * 0.95, r * 1.36, r * 0.22, r * 0.05);
    fill(P, P.accent || '#9b59ff');
  },
  crown(P, hx, hy, r) {
    const c = P.ctx;
    poly(c, [hx - r * 0.7, hy - r * 0.55, hx - r * 0.75, hy - r * 1.25, hx - r * 0.35, hy - r * 0.9, hx, hy - r * 1.4, hx + r * 0.35, hy - r * 0.9, hx + r * 0.75, hy - r * 1.25, hx + r * 0.7, hy - r * 0.55]);
    fill(P, '#ffcf3d');
    circ(c, hx, hy - r * 0.8, r * 0.1);
    fill(P, '#ff4d57');
  },
  horns(P, hx, hy, r) {
    const c = P.ctx;
    for (const sgn of [-1, 1]) {
      c.beginPath();
      c.moveTo(hx + sgn * r * 0.75, hy - r * 0.45);
      c.quadraticCurveTo(hx + sgn * r * 1.55, hy - r * 0.7, hx + sgn * r * 1.35, hy - r * 1.5);
      c.quadraticCurveTo(hx + sgn * r * 1.2, hy - r * 0.95, hx + sgn * r * 0.55, hy - r * 0.85);
      c.closePath();
      fill(P, '#f3ead3');
    }
    c.beginPath();
    c.arc(hx, hy - r * 0.1, r * 1.02, Math.PI * 1.05, Math.PI * 1.95);
    c.closePath();
    fill(P, '#9aa3ad');
  },
  bandana(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy, r * 1.02, Math.PI * 1.08, Math.PI * 1.92);
    c.closePath();
    fill(P, P.team);
    poly(c, [hx - r * 0.95, hy - r * 0.35, hx - r * 1.45, hy - r * 0.1, hx - r * 1.3, hy - r * 0.55]);
    fill(P, P.team);
  },
  tiara(P, hx, hy, r) {
    HATS.hair(P, hx, hy, r);
    const c = P.ctx;
    poly(c, [hx - r * 0.5, hy - r * 0.78, hx, hy - r * 1.25, hx + r * 0.5, hy - r * 0.78]);
    fill(P, '#ffd84d');
    circ(c, hx, hy - r * 0.92, r * 0.1);
    fill(P, '#ff6fb5');
  },
  hair(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy, r * 1.05, Math.PI * 0.95, Math.PI * 2.05);
    c.quadraticCurveTo(hx + r * 0.4, hy - r * 0.3, hx - r * 0.2, hy - r * 0.45);
    c.quadraticCurveTo(hx - r * 0.7, hy - r * 0.1, hx - r * 1.0, hy + r * 0.6);
    c.closePath();
    fill(P, P.hairColor || '#f2d16b');
  },
  plume(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(hx - r * 0.2, hy - r * 1.0);
    c.quadraticCurveTo(hx - r * 1.4, hy - r * 1.9 + Math.sin(P.t * 5) * r * 0.1, hx - r * 1.2, hy - r * 0.6);
    c.quadraticCurveTo(hx - r * 0.9, hy - r * 1.1, hx - r * 0.2, hy - r * 1.0);
    fill(P, P.team);
    ell(c, hx, hy - r * 0.68, r * 1.25, r * 0.25);
    fill(P, shade(P.cloth, -0.25));
    c.beginPath();
    c.arc(hx, hy - r * 0.7, r * 0.75, Math.PI, TAU);
    c.closePath();
    fill(P, shade(P.cloth, -0.1));
  },
  spiky(P, hx, hy, r) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const rr = i % 2 ? r * 1.55 : r * 0.95;
      pts.push(hx + Math.cos(a) * rr, hy - r * 0.1 + Math.sin(a) * rr);
    }
    poly(P.ctx, pts);
    fill(P, P.hairColor || '#ffe066');
  },
  braid(P, hx, hy, r) {
    const c = P.ctx;
    for (let i = 0; i < 3; i++) {
      ell(c, hx - r * 1.0 - i * r * 0.15, hy + r * (0.4 + i * 0.35), r * 0.22, r * 0.2);
      fill(P, P.hairColor || '#e8883a');
    }
    HATS.hair({ ...P, hairColor: P.hairColor || '#e8883a' }, hx, hy, r);
  },
  ponytail(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.moveTo(hx - r * 0.8, hy - r * 0.6);
    c.quadraticCurveTo(hx - r * 1.9, hy - r * 0.5 + Math.sin(P.t * 6) * r * 0.15, hx - r * 1.5, hy + r * 0.6);
    c.quadraticCurveTo(hx - r * 1.2, hy - r * 0.1, hx - r * 0.7, hy - r * 0.2);
    fill(P, P.hairColor || '#8a3b2a');
    HATS.hair({ ...P, hairColor: P.hairColor || '#8a3b2a' }, hx, hy, r);
  },
  miner(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy - r * 0.05, r * 1.05, Math.PI * 1.02, Math.PI * 1.98);
    c.closePath();
    fill(P, '#e6b83a');
    c.save();
    c.shadowColor = '#fff6a8';
    c.shadowBlur = P.quality > 1 ? 8 : 0;
    circ(c, hx + r * 0.35, hy - r * 0.75, r * 0.2);
    fill(P, '#fff6a8');
    c.restore();
  },
  monk(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy + r * 0.05, r * 1.02, Math.PI * 0.9, Math.PI * 1.2);
    c.arc(hx, hy + r * 0.05, r * 1.02, Math.PI * 1.8, Math.PI * 2.1);
    c.lineWidth *= 2.2;
    c.strokeStyle = '#8a6a4a';
    c.stroke();
    c.lineWidth /= 2.2;
    c.strokeStyle = OUTLINE;
  },
  bald(P, hx, hy, r) {
    const c = P.ctx;
    ell(c, hx - r * 0.3, hy - r * 0.6, r * 0.2, r * 0.1, -0.5);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fill();
  },
  cap(P, hx, hy, r) {
    const c = P.ctx;
    c.beginPath();
    c.arc(hx, hy - r * 0.1, r * 1.0, Math.PI * 1.05, Math.PI * 1.95);
    c.closePath();
    fill(P, P.team);
    ell(c, hx + r * 0.7, hy - r * 0.35, r * 0.55, r * 0.14);
    fill(P, P.teamDark);
  },
  mask(P, hx, hy, r) {
    HATS.hood({ ...P, cloth: '#2b2140' }, hx, hy, r, false);
    const c = P.ctx;
    rrect(c, hx - r * 0.55, hy - r * 0.35, r * 1.3, r * 0.4, r * 0.15);
    fill(P, '#15101f');
    glowEyes(P, hx + r * 0.2, hy - r * 0.15, r * 1.6, P.accent || '#b58cff');
  },
  circlet(P, hx, hy, r) {
    HATS.hair({ ...P, hairColor: '#5b3a1e' }, hx, hy, r);
    const c = P.ctx;
    for (let i = -2; i <= 2; i++) {
      ell(c, hx + i * r * 0.35, hy - r * 0.85 + Math.abs(i) * r * 0.08, r * 0.2, r * 0.12, i * 0.4);
      fill(P, P.accent || '#a6e05a');
    }
  },
};

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

// ───────────── Körper ─────────────
function humanoid(P, L, variant = 'hum') {
  const c = P.ctx;
  const cloth = L.cloth || '#8899aa';
  const skin = variant === 'skel' ? '#f4f1e6' : L.skin || '#f2c7a5';
  P.cloth = cloth;
  P.accent = L.accent;
  const imp = variant === 'imp';
  const headR = imp ? 0.4 : 0.35;
  const headY = imp ? -1.02 : -1.1;
  const lp = P.walk ? Math.sin(P.phase) * 0.13 : 0;

  // Umhang
  if (L.cape) {
    const w = Math.sin(P.t * 4 + P.seed) * 0.06;
    c.beginPath();
    c.moveTo(-0.22, -0.85);
    c.quadraticCurveTo(-0.72, -0.4 + w, -0.6 + w, -0.02);
    c.lineTo(0.0, -0.1);
    c.lineTo(0.12, -0.8);
    c.closePath();
    fill(P, P.team);
  }
  // Beine
  ell(c, -0.16 + lp, -0.1, 0.13, 0.11);
  fill(P, variant === 'skel' ? '#e6e1d0' : shade(cloth, -0.45));
  ell(c, 0.16 - lp, -0.1, 0.13, 0.11);
  fill(P, variant === 'skel' ? '#e6e1d0' : shade(cloth, -0.45));

  // Körper
  if (variant === 'skel') {
    ell(c, 0, -0.5, 0.26, 0.32);
    fill(P, '#f4f1e6');
    c.save();
    c.lineWidth *= 0.7;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(-0.17, -0.62 + i * 0.12);
      c.quadraticCurveTo(0, -0.56 + i * 0.12, 0.17, -0.62 + i * 0.12);
      c.stroke();
    }
    c.restore();
    rrect(c, -0.2, -0.3, 0.4, 0.08, 0.04);
    fill(P, P.team);
  } else {
    ell(c, 0, -0.52, 0.37, 0.4);
    fill(P, cloth);
    c.save();
    ell(c, 0, -0.52, 0.37, 0.4);
    c.clip();
    c.fillStyle = P.hurt > 0 ? mix(P.team, '#ffffff', P.hurt * 0.8) : P.team;
    c.fillRect(-0.5, -0.47, 1, 0.13);
    c.restore();
    ell(c, 0, -0.52, 0.37, 0.4);
    c.stroke();
  }

  // Kapuze hinten
  if (L.hat === 'hood') HATS.hood(P, 0.03, headY, headR, true);

  // Kopf
  if (imp) {
    for (const sgn of [-1, 1]) {
      poly(c, [sgn * headR * 0.7, headY - headR * 0.1, sgn * headR * 1.7, headY - headR * 0.55, sgn * headR * 0.85, headY + headR * 0.35]);
      fill(P, skin);
    }
  }
  circ(c, 0.03, headY, headR);
  fill(P, skin);
  if (variant === 'skel') {
    for (const ex of [-0.05, 0.14]) {
      ell(c, ex, headY - 0.02, 0.075, 0.09);
      c.fillStyle = OUTLINE;
      c.fill();
    }
    if (P.evo) {
      glowEyes(P, 0.05, headY - 0.02, 0.9, L.accent || '#7df0ff');
    }
    c.beginPath();
    c.moveTo(0.0, headY + 0.17);
    c.lineTo(0.16, headY + 0.17);
    c.stroke();
  } else {
    eyes(P, 0.08, headY - 0.02, imp ? 1.1 : 1);
    if (L.beard) {
      c.beginPath();
      c.moveTo(-0.22, headY + 0.08);
      c.quadraticCurveTo(0.05, headY + 0.62, 0.32, headY + 0.08);
      c.quadraticCurveTo(0.08, headY + 0.25, -0.22, headY + 0.08);
      fill(P, L.beard);
    } else if (P.mood !== 'stun') {
      c.beginPath();
      c.arc(0.1, headY + 0.13, 0.08, 0.2, Math.PI - 0.2);
      c.stroke();
    }
  }
  if (L.hat && HATS[L.hat]) {
    P.hairColor = L.hairColor;
    HATS[L.hat](P, 0.03, headY, headR, false);
  }

  // Schild (hinterer Arm)
  if (L.shield) {
    ell(c, -0.3, -0.52, 0.24, 0.3);
    fill(P, P.metal || '#b9c3cf');
    ell(c, -0.3, -0.52, 0.11, 0.15);
    fill(P, P.team);
  }

  // Waffe + vordere Hand
  const weapon = WEAPONS[L.weapon || 'fists'] || WEAPONS.fists;
  const ranged = L.weapon === 'bow' || L.weapon === 'crossbow' || L.weapon === 'sling' || L.weapon === 'launcher' || L.weapon === 'orb' || L.weapon === 'staff' || L.weapon === 'lantern';
  c.save();
  c.translate(0.36, -0.52);
  c.rotate(swingAngle(P.atk) * (ranged ? 0.25 : 1) + (L.weapon === 'crossbow' ? Math.PI / 2 : 0));
  weapon(P);
  c.restore();
  circ(c, 0.36, -0.52, 0.1);
  fill(P, variant === 'skel' ? '#f4f1e6' : skin);
}

function brute(P, L) {
  const c = P.ctx;
  const cloth = L.cloth || '#6b4f36';
  const skin = L.skin || '#d99a6c';
  const lp = P.walk ? Math.sin(P.phase) * 0.1 : 0;
  ell(c, -0.25 + lp, -0.12, 0.2, 0.14);
  fill(P, shade(cloth, -0.4));
  ell(c, 0.25 - lp, -0.12, 0.2, 0.14);
  fill(P, shade(cloth, -0.4));
  ell(c, 0, -0.62, 0.62, 0.55);
  fill(P, skin);
  rrect(c, -0.55, -0.45, 1.1, 0.34, 0.12);
  fill(P, cloth);
  rrect(c, -0.55, -0.47, 1.1, 0.1, 0.05);
  fill(P, P.team);
  circ(c, 0.05, -1.2, 0.3);
  fill(P, skin);
  eyes(P, 0.1, -1.22, 0.85);
  HATS.bald(P, 0.05, -1.2, 0.3);
  const a = swingAngle(P.atk);
  c.save();
  c.translate(0.5, -0.7);
  c.rotate(a);
  ell(c, 0.05, 0.2, 0.2, 0.26);
  fill(P, skin);
  c.restore();
  ell(c, -0.5, -0.5, 0.18, 0.24);
  fill(P, skin);
}

function golem(P, L) {
  const c = P.ctx;
  const stone = L.cloth || '#8d8f94';
  const lp = P.walk ? Math.sin(P.phase) * 0.1 : 0;
  ell(c, -0.3 + lp, -0.12, 0.22, 0.15);
  fill(P, shade(stone, -0.25));
  ell(c, 0.3 - lp, -0.12, 0.22, 0.15);
  fill(P, shade(stone, -0.25));
  poly(c, [-0.6, -0.25, -0.7, -0.9, -0.3, -1.35, 0.35, -1.3, 0.7, -0.85, 0.6, -0.25]);
  fill(P, stone);
  c.save();
  c.lineWidth *= 0.7;
  c.beginPath();
  c.moveTo(-0.2, -1.2);
  c.lineTo(-0.05, -0.9);
  c.lineTo(-0.25, -0.65);
  c.moveTo(0.3, -0.55);
  c.lineTo(0.45, -0.4);
  c.stroke();
  c.restore();
  // Moos / Akzente
  ell(c, 0.1, -1.3, 0.3, 0.1);
  fill(P, L.accent || '#6fd36b');
  rrect(c, -0.6, -0.5, 1.2, 0.1, 0.04);
  fill(P, P.team);
  glowEyes(P, 0.12, -0.98, 1.3, L.accent === '#e8fbff' ? '#5ecbff' : '#ffe66b');
  const a = swingAngle(P.atk);
  c.save();
  c.translate(0.62, -0.75);
  c.rotate(a);
  ell(c, 0.05, 0.25, 0.24, 0.3);
  fill(P, shade(stone, 0.1));
  c.restore();
}

function bot(P, L) {
  const c = P.ctx;
  const metal = L.cloth || '#9aa3ad';
  const lp = P.walk ? Math.sin(P.phase) * 0.1 : 0;
  rrect(c, -0.35 + lp, -0.25, 0.22, 0.25, 0.05);
  fill(P, shade(metal, -0.35));
  rrect(c, 0.13 - lp, -0.25, 0.22, 0.25, 0.05);
  fill(P, shade(metal, -0.35));
  rrect(c, -0.5, -1.05, 1.0, 0.85, 0.2);
  fill(P, metal);
  rrect(c, -0.5, -0.5, 1.0, 0.1, 0.03);
  fill(P, P.team);
  rrect(c, -0.3, -0.95, 0.72, 0.3, 0.12);
  fill(P, '#1d2530');
  c.save();
  c.shadowColor = L.accent || '#ff5e3a';
  c.shadowBlur = P.quality > 1 ? 8 : 0;
  rrect(c, -0.15 + Math.sin(P.t * 3) * 0.08, -0.86, 0.45, 0.1, 0.05);
  c.fillStyle = L.accent || '#ff5e3a';
  c.fill();
  c.restore();
  // Klingenarm
  c.save();
  c.translate(0.52, -0.6);
  c.rotate(swingAngle(P.atk) + P.t * (P.atk > 0 ? 18 : 0));
  poly(c, [-0.06, 0, 0.06, 0, 0.04, -0.55, 0, -0.62, -0.04, -0.55]);
  fill(P, '#e5ecf2');
  poly(c, [-0.06, 0, 0.06, 0, 0.04, 0.45, 0, 0.52, -0.04, 0.45]);
  fill(P, '#e5ecf2');
  circ(c, 0, 0, 0.1);
  fill(P, shade(metal, -0.2));
  c.restore();
  circ(c, 0, -1.15, 0.06);
  fill(P, L.accent || '#ff5e3a');
}

function wings(P, x, y, w, h, color, flap) {
  const c = P.ctx;
  for (const sgn of [-1, 1]) {
    c.save();
    c.translate(x, y);
    c.rotate(sgn * (0.3 + flap * 0.5));
    ell(c, sgn * w * 0.6, -h * 0.4, w * 0.7, h * 0.5, sgn * 0.3);
    fill(P, color);
    c.restore();
  }
}

function moth(P, L) {
  const c = P.ctx;
  const flap = Math.sin(P.t * 28 + P.seed);
  wings(P, 0, -0.55, 0.45, 0.55, L.accent || '#f1e08a', flap);
  ell(c, 0, -0.5, 0.2, 0.3);
  fill(P, L.cloth || '#8e6cc4');
  rrect(c, -0.2, -0.45, 0.4, 0.07, 0.03);
  fill(P, P.team);
  circ(c, 0.08, -0.82, 0.2);
  fill(P, L.cloth || '#8e6cc4');
  eyes(P, 0.1, -0.84, 0.75);
  c.beginPath();
  c.moveTo(0.05, -1.0);
  c.quadraticCurveTo(0.05, -1.2, -0.08, -1.25);
  c.moveTo(0.15, -1.0);
  c.quadraticCurveTo(0.2, -1.2, 0.32, -1.22);
  c.stroke();
}

function bug(P, L) {
  const c = P.ctx;
  const flap = Math.sin(P.t * 30 + P.seed);
  wings(P, 0, -0.7, 0.4, 0.5, 'rgba(220,255,240,0.7)', flap);
  ell(c, 0, -0.55, 0.45, 0.4);
  fill(P, L.cloth || '#3d8b5f');
  c.beginPath();
  c.moveTo(0, -0.95);
  c.lineTo(0, -0.18);
  c.stroke();
  rrect(c, -0.44, -0.5, 0.88, 0.08, 0.04);
  fill(P, P.team);
  circ(c, 0.38, -0.7, 0.24);
  fill(P, shade(L.cloth || '#3d8b5f', -0.3));
  eyes(P, 0.42, -0.74, 0.8);
  const a = P.atk > 0 ? Math.sin(P.atk * Math.PI) * 0.4 : 0;
  poly(c, [0.55, -0.6, 0.8, -0.55 - a * 0.3, 0.6, -0.5]);
  fill(P, L.accent || '#b9f28a');
  poly(c, [0.55, -0.75, 0.8, -0.85 + a * 0.3, 0.6, -0.8]);
  fill(P, L.accent || '#b9f28a');
}

function winged(P, L) {
  const c = P.ctx;
  const flap = Math.sin(P.t * 18 + P.seed);
  const skin = L.skin || '#5d7fd6';
  for (const sgn of [-1, 1]) {
    c.save();
    c.translate(sgn * 0.2, -0.65);
    c.rotate(sgn * (0.2 + flap * 0.4));
    poly(c, [0, 0, sgn * 0.75, -0.35, sgn * 0.65, -0.05, sgn * 0.8, 0.15, sgn * 0.45, 0.1, sgn * 0.35, 0.3]);
    fill(P, L.accent || '#c9d6ff');
    c.restore();
  }
  ell(c, 0, -0.5, 0.26, 0.3);
  fill(P, skin);
  rrect(c, -0.25, -0.46, 0.5, 0.08, 0.04);
  fill(P, P.team);
  for (const sgn of [-1, 1]) {
    poly(c, [sgn * 0.15, -0.95, sgn * 0.42, -1.2, sgn * 0.28, -0.82]);
    fill(P, skin);
  }
  circ(c, 0.03, -0.9, 0.3);
  fill(P, skin);
  eyes(P, 0.08, -0.92, 0.9, 'angry');
}

function dragon(P, L) {
  const c = P.ctx;
  const flap = Math.sin(P.t * 12 + P.seed);
  const body = L.cloth || '#5bbf6a';
  for (const sgn of [-1, 1]) {
    c.save();
    c.translate(-0.05, -0.75);
    c.rotate(sgn * (0.25 + flap * 0.45));
    poly(c, [0, 0, sgn * 0.9, -0.45, sgn * 0.7, -0.1, sgn * 0.85, 0.15, sgn * 0.45, 0.12, sgn * 0.3, 0.3]);
    fill(P, L.accent || '#ffcc4d');
    c.restore();
  }
  c.beginPath();
  c.moveTo(-0.35, -0.5);
  c.quadraticCurveTo(-0.85, -0.45, -0.8, -0.15);
  c.quadraticCurveTo(-0.6, -0.35, -0.3, -0.35);
  fill(P, body);
  ell(c, 0, -0.55, 0.42, 0.33);
  fill(P, body);
  ell(c, 0.05, -0.45, 0.25, 0.18);
  fill(P, shade(L.accent || '#ffcc4d', 0.3));
  rrect(c, -0.3, -0.64, 0.5, 0.08, 0.04);
  fill(P, P.team);
  ell(c, 0.42, -0.9, 0.3, 0.25);
  fill(P, body);
  for (const hx of [0.3, 0.45]) {
    poly(c, [hx, -1.1, hx - 0.05, -1.3, hx + 0.08, -1.12]);
    fill(P, '#fff5d6');
  }
  eyes(P, 0.44, -0.95, 0.8);
  if (P.atk > 0.2) {
    c.save();
    c.globalAlpha = P.atk;
    circ(c, 0.8, -0.85, 0.12 + P.atk * 0.1);
    c.fillStyle = '#ffae3d';
    c.fill();
    c.restore();
  }
}

function balloon(P, L) {
  const c = P.ctx;
  const sway = Math.sin(P.t * 2 + P.seed) * 0.05;
  c.beginPath();
  c.moveTo(-0.3, -0.35);
  c.lineTo(-0.45, -0.95);
  c.moveTo(0.3, -0.35);
  c.lineTo(0.45, -0.95);
  c.stroke();
  rrect(c, -0.35 + sway, -0.42, 0.7, 0.35, 0.08);
  fill(P, '#8b5a2b');
  circ(c, 0 + sway, -0.05, 0.16);
  fill(P, '#2b2b35');
  ell(c, 0, -1.4, 0.72, 0.62);
  fill(P, L.cloth || '#c0392b');
  c.save();
  ell(c, 0, -1.4, 0.72, 0.62);
  c.clip();
  c.fillStyle = P.team;
  c.fillRect(-0.12, -2.1, 0.24, 1.4);
  c.fillStyle = L.accent || '#f4d03f';
  c.fillRect(-0.8, -1.5, 1.6, 0.1);
  c.restore();
  ell(c, 0, -1.4, 0.72, 0.62);
  c.stroke();
  eyes(P, 0.1, -1.35, 1.1, 'angry');
}

function whale(P, L) {
  const c = P.ctx;
  const body = L.cloth || '#c9452c';
  const bob = Math.sin(P.t * 2.5 + P.seed) * 0.05;
  c.beginPath();
  c.moveTo(-0.6, -0.65 + bob);
  c.quadraticCurveTo(-1.05, -1.0, -1.1, -0.7);
  c.quadraticCurveTo(-1.0, -0.45, -0.6, -0.5 + bob);
  fill(P, body);
  ell(c, 0, -0.65 + bob, 0.75, 0.45);
  fill(P, body);
  c.save();
  ell(c, 0, -0.65 + bob, 0.75, 0.45);
  c.clip();
  ell(c, 0.1, -0.35 + bob, 0.6, 0.2);
  c.fillStyle = L.accent || '#ffb347';
  c.fill();
  c.fillStyle = P.team;
  c.fillRect(-0.3, -1.2, 0.12, 1.2);
  c.restore();
  ell(c, 0, -0.65 + bob, 0.75, 0.45);
  c.stroke();
  // Glut-Risse
  c.save();
  c.strokeStyle = '#ffd36b';
  c.lineWidth *= 0.8;
  c.beginPath();
  c.moveTo(-0.2, -0.95 + bob);
  c.lineTo(-0.05, -0.8 + bob);
  c.lineTo(0.05, -0.95 + bob);
  c.stroke();
  c.restore();
  eyes(P, 0.42, -0.72 + bob, 0.9, 'angry');
  ell(c, -0.3, -0.35 + bob, 0.2, 0.08, 0.4);
  fill(P, shade(body, -0.2));
}

function spirit(P, L) {
  const c = P.ctx;
  const col = L.cloth || '#9fe3ff';
  const bounce = Math.abs(Math.sin(P.t * 9 + P.seed)) * 0.15;
  c.save();
  c.shadowColor = col;
  c.shadowBlur = P.quality > 1 ? 10 : 0;
  c.beginPath();
  c.moveTo(0, -1.1 - bounce);
  c.quadraticCurveTo(0.45, -0.7, 0.35, -0.35);
  c.quadraticCurveTo(0, -0.05, -0.35, -0.35);
  c.quadraticCurveTo(-0.45, -0.7, 0, -1.1 - bounce);
  fill(P, col);
  c.restore();
  ell(c, 0, -0.45, 0.18, 0.12);
  c.fillStyle = L.accent || '#ffffff';
  c.fill();
  circ(c, 0.2, -0.28, 0.08);
  fill(P, P.team);
  eyes(P, 0.02, -0.62, 0.8, 'angry');
}

function blob(P, L) {
  const c = P.ctx;
  const sq = P.walk ? Math.abs(Math.sin(P.phase)) * 0.08 : 0;
  ell(c, 0, -0.35, 0.35 + sq, 0.35 - sq);
  fill(P, L.cloth || '#6ab04c');
  rrect(c, -0.3, -0.32, 0.6, 0.07, 0.03);
  fill(P, P.team);
  c.beginPath();
  c.moveTo(0, -0.68);
  c.quadraticCurveTo(-0.05, -0.95, -0.25, -1.0);
  c.moveTo(0, -0.7);
  c.quadraticCurveTo(0.1, -0.9, 0.25, -0.95);
  c.stroke();
  ell(c, -0.25, -1.0, 0.12, 0.07, -0.5);
  fill(P, L.accent || '#a6e05a');
  ell(c, 0.25, -0.95, 0.12, 0.07, 0.5);
  fill(P, L.accent || '#a6e05a');
  eyes(P, 0.02, -0.42, 0.85, 'angry');
}

function barrel(P, L) {
  const c = P.ctx;
  c.save();
  c.translate(0, -0.35);
  c.rotate(P.walk ? P.t * 8 : 0);
  ell(c, 0, 0, 0.35, 0.35);
  fill(P, L.cloth || '#8b5a2b');
  c.beginPath();
  c.moveTo(-0.35, 0);
  c.lineTo(0.35, 0);
  c.moveTo(0, -0.35);
  c.lineTo(0, 0.35);
  c.stroke();
  circ(c, 0, 0, 0.12);
  fill(P, P.team);
  c.restore();
  circ(c, 0.25, -0.75, 0.05 + Math.abs(Math.sin(P.t * 20)) * 0.04);
  c.fillStyle = '#ffcf3d';
  c.fill();
}

function cart(P, L) {
  const c = P.ctx;
  const wob = P.walk ? Math.sin(P.phase * 2) * 0.03 : 0;
  // zwei Rabauken tragen einen Stamm
  for (const px of [-0.35, 0.3]) {
    ell(c, px, -0.45 + wob, 0.22, 0.28);
    fill(P, '#b5552f');
    circ(c, px + 0.03, -0.85 + wob, 0.2);
    fill(P, '#e8b48c');
    eyes(P, px + 0.07, -0.87 + wob, 0.65, 'angry');
    HATS.horns(P, px + 0.03, -0.85 + wob, 0.2);
  }
  rrect(c, -0.8, -0.72, 1.6, 0.26, 0.12);
  fill(P, L.cloth || '#8b5a2b');
  ell(c, 0.8, -0.59, 0.1, 0.13);
  fill(P, '#c79a64');
  rrect(c, -0.2, -0.72, 0.12, 0.26, 0.03);
  fill(P, P.team);
}

// Reittiere
function mount(P, L) {
  const c = P.ctx;
  const kind = L.mount || 'horse';
  const lp = P.walk ? Math.sin(P.phase * 1.3) * 0.15 : 0;
  const bodyCol = kind === 'boar' ? '#7a5236' : kind === 'ram' ? '#e8e1d0' : '#b77b4a';
  for (const lx of [-0.45, -0.25, 0.3, 0.5]) {
    const off = (lx < 0 ? lp : -lp) * (lx === -0.25 || lx === 0.5 ? -1 : 1);
    rrect(c, lx - 0.06 + off * 0.3, -0.35, 0.12, 0.35, 0.05);
    fill(P, shade(bodyCol, -0.3));
  }
  ell(c, 0, -0.5, 0.72, 0.3);
  fill(P, bodyCol);
  if (kind === 'ram') {
    for (let i = 0; i < 5; i++) {
      circ(c, -0.5 + i * 0.25, -0.72, 0.13);
      fill(P, '#f6f1e4');
    }
  }
  // Schabracke in Teamfarbe
  rrect(c, -0.3, -0.72, 0.5, 0.3, 0.06);
  fill(P, P.team);
  // Kopf
  if (kind === 'boar') {
    ell(c, 0.72, -0.55, 0.3, 0.24);
    fill(P, bodyCol);
    ell(c, 0.98, -0.5, 0.1, 0.09);
    fill(P, '#e8a0a0');
    poly(c, [0.82, -0.42, 0.95, -0.25, 0.88, -0.44]);
    fill(P, '#fff5d6');
    eyes(P, 0.72, -0.62, 0.6, 'angry');
  } else if (kind === 'ram') {
    ell(c, 0.72, -0.62, 0.24, 0.2);
    fill(P, '#9a8f7a');
    c.beginPath();
    c.arc(0.62, -0.72, 0.16, Math.PI * 0.3, Math.PI * 2.1);
    c.lineWidth *= 2.2;
    c.strokeStyle = '#c9b48a';
    c.stroke();
    c.lineWidth /= 2.2;
    c.strokeStyle = OUTLINE;
    eyes(P, 0.76, -0.66, 0.55, 'angry');
  } else {
    poly(c, [0.45, -0.65, 0.7, -1.05, 1.0, -0.95, 0.95, -0.8, 0.65, -0.55]);
    fill(P, bodyCol);
    poly(c, [0.52, -0.75, 0.62, -1.1, 0.5, -0.95]);
    fill(P, '#3a2616');
    eyes(P, 0.8, -0.93, 0.5);
  }
}

function rider(P, L) {
  const c = P.ctx;
  mount(P, L);
  c.save();
  c.translate(-0.05, -0.62);
  c.scale(0.8, 0.8);
  const saved = P.walk;
  P.walk = false;
  humanoid(P, { ...L, cape: L.cape }, 'hum');
  P.walk = saved;
  c.restore();
}

// Schwebender Geist mit Krone/Schwert (Königsgeist, Seelensoldat, Holzfäller-Geist)
function ghost(P, L) {
  const c = P.ctx;
  const col = L.cloth || '#e8f0ff';
  const bob = Math.sin(P.t * 3 + P.seed) * 0.06;
  c.save();
  c.globalAlpha *= 0.88;
  c.beginPath();
  c.moveTo(-0.4, -0.15 + bob);
  c.quadraticCurveTo(-0.5, -1.0 + bob, 0, -1.25 + bob);
  c.quadraticCurveTo(0.5, -1.0 + bob, 0.4, -0.15 + bob);
  for (let i = 0; i < 4; i++) {
    const x0 = 0.4 - i * 0.2;
    c.quadraticCurveTo(x0 - 0.05, -0.02 + bob + (i % 2 ? 0.06 : -0.04), x0 - 0.2, -0.15 + bob);
  }
  c.closePath();
  fill(P, col);
  c.restore();
  rrect(c, -0.32, -0.62 + bob, 0.64, 0.1, 0.04);
  fill(P, P.team);
  eyes(P, 0.06, -0.88 + bob, 0.85, 'angry');
  if (L.accent) {
    poly(c, [-0.2, -1.18 + bob, -0.22, -1.42 + bob, -0.1, -1.3 + bob, 0, -1.46 + bob, 0.1, -1.3 + bob, 0.22, -1.42 + bob, 0.2, -1.18 + bob]);
    fill(P, L.accent);
  }
  c.save();
  c.translate(0.42, -0.6 + bob);
  c.rotate(swingAngle(P.atk));
  WEAPONS.sword(P);
  c.restore();
}

// Reittier ohne Reiter (Königliche Schweine, Fluch-Schwein, Nashorn)
function hog(P, L) {
  const c = P.ctx;
  const col = L.cloth || '#f0a0a8';
  const lp = P.walk ? Math.sin(P.phase * 1.3) * 0.12 : 0;
  for (const lx of [-0.35, -0.15, 0.2, 0.38]) {
    rrect(c, lx - 0.06 + (lx < 0 ? lp : -lp) * 0.3, -0.3, 0.12, 0.3, 0.05);
    fill(P, shade(col, -0.3));
  }
  ell(c, 0, -0.48, 0.55, 0.3);
  fill(P, col);
  rrect(c, -0.25, -0.72, 0.4, 0.22, 0.06);
  fill(P, P.team);
  ell(c, 0.55, -0.55, 0.26, 0.22);
  fill(P, col);
  ell(c, 0.78, -0.5, 0.09, 0.08);
  fill(P, shade(col, -0.15));
  if (L.scale > 1.1) {
    // Horn (Nashorn)
    poly(c, [0.7, -0.62, 0.9, -0.95, 0.8, -0.58]);
    fill(P, L.accent || '#d9d9d9');
  } else if (L.accent) {
    // Krönchen
    poly(c, [0.42, -0.74, 0.44, -0.9, 0.52, -0.8, 0.58, -0.93, 0.64, -0.8, 0.72, -0.9, 0.7, -0.74]);
    fill(P, L.accent);
  }
  eyes(P, 0.58, -0.62, 0.55, 'angry');
}

// Busch mit Augen, in dem sich ein Kobold versteckt
function bush(P, L) {
  const c = P.ctx;
  const col = L.cloth || '#4f9a3a';
  const sq = P.walk ? Math.abs(Math.sin(P.phase)) * 0.05 : 0;
  for (const [x, y, r] of [[-0.35, -0.35, 0.32], [0.35, -0.35, 0.32], [0, -0.6, 0.42], [-0.2, -0.82, 0.25], [0.22, -0.8, 0.25]]) {
    ell(c, x, y - sq, r + sq, r - sq * 0.5);
    fill(P, x === 0 ? col : shade(col, -0.12));
  }
  for (const [x, y] of [[-0.3, -0.7], [0.32, -0.45], [0.05, -0.95]]) {
    circ(c, x, y, 0.06);
    fill(P, L.accent || '#7fcf5a');
  }
  rrect(c, -0.4, -0.18, 0.8, 0.08, 0.04);
  fill(P, P.team);
  eyes(P, 0.05, -0.55, 0.75, 'angry');
}

// Fliegende Maschine: Holzgestell mit Propeller und Kanone
function machine(P, L) {
  const c = P.ctx;
  const wood = L.cloth || '#a0703a';
  rrect(c, -0.6, -0.75, 1.2, 0.35, 0.1);
  fill(P, wood);
  rrect(c, -0.6, -0.62, 1.2, 0.08, 0.03);
  fill(P, P.team);
  // Kanone nach vorne
  rrect(c, 0.35, -0.68, 0.55, 0.2, 0.06);
  fill(P, '#4b4f58');
  // Propeller oben
  rrect(c, -0.04, -1.15, 0.08, 0.4, 0.03);
  fill(P, shade(wood, -0.3));
  const w = Math.cos(P.t * 30) * 0.55;
  ell(c, 0, -1.15, Math.abs(w) + 0.05, 0.06);
  fill(P, L.accent || '#d9d9d9');
  // Pilot
  circ(c, -0.2, -0.88, 0.17);
  fill(P, '#7cc36b');
  eyes(P, -0.16, -0.9, 0.55);
}

// Fahrzeug auf Rädern (Kanonenkarre, Sparky)
function wagon(P, L) {
  const c = P.ctx;
  const body = L.cloth || '#6b6f7a';
  const spin = P.walk ? P.t * 8 : 0;
  rrect(c, -0.6, -0.65, 1.2, 0.4, 0.1);
  fill(P, shade(body, 0.1));
  rrect(c, -0.6, -0.4, 1.2, 0.08, 0.03);
  fill(P, P.team);
  for (const wx of [-0.38, 0.38]) {
    circ(c, wx, -0.18, 0.2);
    fill(P, '#6b4e36');
    c.beginPath();
    c.moveTo(wx + Math.cos(spin) * 0.18, -0.18 + Math.sin(spin) * 0.18);
    c.lineTo(wx - Math.cos(spin) * 0.18, -0.18 - Math.sin(spin) * 0.18);
    c.stroke();
  }
  if (L.accent === '#7fe9ff') {
    // Sparky: Spule mit Ladeleuchten
    rrect(c, -0.25, -1.25, 0.5, 0.65, 0.1);
    fill(P, body);
    for (let i = 0; i < 3; i++) {
      ell(c, 0, -0.75 - i * 0.18, 0.32, 0.06);
      fill(P, '#c98a3a');
    }
    c.save();
    c.shadowColor = L.accent;
    c.shadowBlur = P.quality > 1 ? 12 : 0;
    circ(c, 0, -1.35, 0.16 + (P.atk > 0 ? 0.08 : Math.sin(P.t * 8) * 0.02));
    fill(P, L.accent);
    c.restore();
  } else {
    // Kanonenrohr nach vorne
    c.save();
    c.translate(0.05, -0.8);
    const rec = P.atk > 0.5 ? (P.atk - 0.5) * 0.3 : 0;
    rrect(c, -0.2 - rec, -0.15, 0.85, 0.3, 0.12);
    fill(P, L.accent || '#3b3b3b');
    c.restore();
    circ(c, -0.1, -0.8, 0.18);
    fill(P, P.team);
  }
}

const BODIES = {
  hum: (P, L) => humanoid(P, L, 'hum'),
  imp: (P, L) => humanoid(P, L, 'imp'),
  skel: (P, L) => humanoid(P, L, 'skel'),
  brute,
  golem,
  bot,
  moth,
  bug,
  winged,
  dragon,
  balloon,
  whale,
  spirit,
  rider,
  blob,
  barrel,
  cart,
  ghost,
  hog,
  bush,
  machine,
  wagon,
};

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

/**
 * Einheit zeichnen.
 * o = { x, y, U, fx, t, walk, atk, hurt, team:'blue'|'red', evo, lift, alpha, mood, seed, quality }
 */
export function drawUnit(ctx, look, o) {
  const L = look || {};
  if (!L.body) {
    drawPlaceholder(ctx, o.label, o.x, o.y - (o.lift || 0), o.U * 0.6, o.team);
    return;
  }
  const T = TEAM[o.team] || TEAM.blue;
  ctx.save();
  ctx.translate(o.x, o.y - (o.lift || 0));
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= o.alpha;
  let sx = 1;
  let sy = 1;
  const seed = o.seed || 0;
  if (o.walk) {
    const b = Math.abs(Math.sin(o.t * 11 + seed));
    sy += b * 0.06;
    sx -= b * 0.04;
  }
  if (o.atk > 0) {
    const a = o.atk;
    if (a > 0.6) {
      const k = (a - 0.6) / 0.4;
      sy -= 0.14 * k;
      sx += 0.12 * k;
    } else {
      const k = a / 0.6;
      sy += 0.08 * k;
      sx -= 0.05 * k;
    }
  }
  if (o.squash) {
    sy *= 1 - o.squash * 0.3;
    sx *= 1 + o.squash * 0.25;
  }
  ctx.scale(o.U * sx * (o.fx || 1), o.U * sy);
  ctx.lineWidth = Math.max(1.3 / o.U, 0.075);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = {
    ctx,
    t: o.t || 0,
    walk: !!o.walk,
    phase: (o.t || 0) * 11 + seed,
    atk: o.atk || 0,
    hurt: o.hurt || 0,
    team: T.main,
    teamDark: T.dark,
    evo: !!o.evo,
    mood: o.mood || (o.atk > 0 ? 'angry' : null),
    seed,
    quality: o.quality ?? 2,
    metal: o.evo ? '#c9b8ff' : null,
  };
  if (o.evo && P.quality > 0) {
    ctx.save();
    ctx.globalAlpha *= 0.35 + Math.sin(P.t * 5) * 0.15;
    ell(ctx, 0, -0.6, 0.85, 0.95);
    ctx.fillStyle = L.accent || '#b98cff';
    ctx.fill();
    ctx.restore();
  }
  (BODIES[L.body] || BODIES.hum)(P, L);
  // Helden tragen einen kleinen goldenen Stern über dem Kopf
  if (L.hero && P.quality > 0) star(P, 0, -1.75, 0.16, '#ffd54a');
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

/** Gebäude zeichnen. o = { x, y, U (halbe Kante px), t, atk, hurt, team, aim, aux, alpha, evo, quality } */
export function drawBuilding(ctx, look, o) {
  const L = look || {};
  if (!L.body) {
    drawPlaceholder(ctx, o.label, o.x, o.y, o.U * 0.8, o.team);
    return;
  }
  const T = TEAM[o.team] || TEAM.blue;
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.alpha != null && o.alpha < 1) ctx.globalAlpha *= o.alpha;
  const sq = o.squash || 0;
  ctx.scale(o.U * (1 + sq * 0.2), o.U * (1 - sq * 0.25));
  ctx.lineWidth = Math.max(1.4 / o.U, 0.05);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = { ctx, t: o.t || 0, atk: o.atk || 0, hurt: o.hurt || 0, team: T.main, teamDark: T.dark, quality: o.quality ?? 2, evo: !!o.evo };
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
/** o = { x, y, U (halbe Kante px), t, king, active, team, hurt, atk, destroyed, aim, quality, mood } */
export function drawTower(ctx, o) {
  const T = TEAM[o.team] || TEAM.blue;
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(o.U, o.U);
  ctx.lineWidth = Math.max(1.6 / o.U, 0.035);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = OUTLINE;
  const P = { ctx, t: o.t || 0, atk: o.atk || 0, hurt: o.hurt || 0, team: T.main, teamDark: T.dark, quality: o.quality ?? 2, mood: o.mood };
  const c = ctx;
  if (o.destroyed) {
    for (const [rx, ry, rr, col] of [
      [-0.5, 0.2, 0.35, '#8f877c'],
      [0.35, 0.3, 0.4, '#a79f94'],
      [0, -0.1, 0.45, '#9a9286'],
      [0.55, -0.25, 0.25, '#b5aea3'],
      [-0.4, -0.35, 0.28, '#8a8277'],
    ]) {
      ell(c, rx, ry, rr, rr * 0.75);
      fill(P, col);
    }
    rrect(c, -0.2, -0.1, 0.15, 0.5, 0.03);
    fill(P, '#6b4226');
    poly(c, [-0.05, -0.1, 0.35, 0.0, -0.05, 0.12]);
    fill(P, P.teamDark);
    ctx.restore();
    return;
  }
  const W = o.king ? 0.92 : 0.85;
  const topY = o.king ? -1.35 : -1.75;
  // Sockel / Turmkörper
  rrect(c, -W, topY, W * 2, W + 0.8 - topY, 0.14);
  fill(P, '#b8b0a4');
  c.save();
  rrect(c, -W, topY, W * 2, W + 0.8 - topY, 0.14);
  c.clip();
  c.lineWidth *= 0.6;
  c.strokeStyle = 'rgba(50,40,60,0.28)';
  const rows = 6;
  const h = (W + 0.8 - topY) / rows;
  for (let i = 1; i < rows; i++) {
    const y = topY + i * h;
    c.beginPath();
    c.moveTo(-W, y);
    c.lineTo(W, y);
    c.stroke();
    for (let k = -2; k <= 2; k++) {
      const x = k * 0.4 + (i % 2 ? 0.2 : 0);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, y - h);
      c.stroke();
    }
  }
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fillRect(-W, topY, W * 0.5, 3);
  c.restore();
  // Zinnen
  const n = o.king ? 5 : 4;
  for (let i = 0; i < n; i++) {
    const bw = (W * 2) / (n * 2 - 1);
    rrect(c, -W + i * bw * 2, topY - 0.22, bw, 0.26, 0.04);
    fill(P, '#c8c0b4');
  }
  // Teamfarbene Banner
  for (const bx of o.king ? [-0.55, 0.55] : [0]) {
    const sway = Math.sin(P.t * 2 + bx) * 0.03;
    poly(c, [bx - 0.2, topY + 0.15, bx + 0.2, topY + 0.15, bx + 0.2 + sway, topY + 0.85, bx, topY + 0.7, bx - 0.2 + sway, topY + 0.85]);
    fill(P, P.team);
    if (o.king) star(P, bx, topY + 0.42, 0.1, '#ffd84d');
  }
  // Tor
  c.beginPath();
  c.moveTo(-0.28, W + 0.8);
  c.lineTo(-0.28, W + 0.8 - 0.45);
  c.arc(0, W + 0.8 - 0.45, 0.28, Math.PI, 0);
  c.lineTo(0.28, W + 0.8);
  c.closePath();
  fill(P, '#4a3322');

  // Figur auf dem Turm
  c.save();
  c.translate(0, topY - 0.05);
  const fu = o.king ? 0.62 : 0.5;
  c.scale(fu, fu);
  c.lineWidth /= fu;
  if (o.king) {
    // Kanone
    c.save();
    c.translate(0.1, -0.35);
    c.rotate(o.aim ?? -Math.PI / 2);
    const rec = P.atk > 0.5 ? (P.atk - 0.5) * 0.4 : 0;
    rrect(c, -0.1 - rec, -0.2, 1.0, 0.4, 0.15);
    fill(P, '#3b3f48');
    c.restore();
    const kingP = { ...P, walk: false, atk: 0, mood: o.active ? (P.atk > 0 ? 'angry' : null) : 'sleep', phase: 0, seed: 0 };
    c.save();
    c.translate(-0.45, 0);
    humanoid(kingP, { skin: '#f2c7a5', cloth: '#7a3fb5', hat: 'crown', beard: '#f3f0e8', weapon: 'fists', cape: true }, 'hum');
    c.restore();
    if (!o.active) {
      c.save();
      c.fillStyle = '#ffffff';
      c.font = 'bold 0.5px sans-serif';
      c.globalAlpha = 0.6 + Math.sin(P.t * 3) * 0.3;
      c.fillText('z', 0.1, -1.7 - (P.t % 1) * 0.3);
      c.font = 'bold 0.35px sans-serif';
      c.fillText('z', 0.4, -2.1 - (P.t % 1) * 0.3);
      c.restore();
    }
  } else {
    const aimRight = o.aim == null ? true : Math.cos(o.aim) >= 0;
    c.scale(aimRight ? 1 : -1, 1);
    humanoid({ ...P, walk: false, phase: 0, seed: 0, mood: P.atk > 0 ? 'angry' : null }, { skin: '#f5d0b0', cloth: '#c9a13b', hat: 'ponytail', weapon: 'bow', hairColor: '#e8883a' }, 'hum');
  }
  c.restore();
  ctx.restore();
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

/** Zeichnet das Motiv einer Karte (ohne Rahmen) in ein Rechteck. */
const BIG_BODIES = new Set(['golem', 'brute', 'whale', 'balloon', 'rider', 'cart', 'bot', 'dragon', 'hog', 'machine', 'wagon']);

export function drawCardArt(ctx, db, card, x, y, w, h, opts = {}) {
  const evo = !!opts.evo && !!card.evo;
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
      const def = g.unit === own || g.unit === card.id ? db.unit(card.id, evo) : db.unit(g.unit);
      defs.push({ def, n: g.count || 1 });
    }
    const picks = [];
    if (defs.length > 1) {
      for (const d of defs) picks.push(d.def);
      if (picks.length < 3 && defs[0].n > 1) picks.push(defs[0].def);
    } else {
      for (let i = 0; i < Math.min(defs[0].n, 3); i++) picks.push(defs[0].def);
    }
    const n = Math.min(picks.length, 3);
    const look = picks[0].look || {};
    if (card.type === 'building') {
      drawBuilding(ctx, look, { ...base, x: cx, y: y + h * 0.78, U: Math.min(w, h) * 0.3, aim: -0.4 });
    } else {
      const offs = n === 1 ? [0] : n === 2 ? [-0.2, 0.2] : [-0.26, 0, 0.26];
      const order = n === 3 ? [0, 2, 1] : offs.map((_, i) => i);
      for (const i of order) {
        const L = picks[i].look || {};
        const big = BIG_BODIES.has(L.body);
        // Kartenbild füllt den Rahmen unabhängig von der Größe im Spiel; nur sehr kleine Einheiten etwas kleiner
        const U = Math.min(w, h) * (big ? 0.36 : 0.4) * Math.min(1, Math.max(0.85, L.scale || 1));
        const groundY = y + h * (L.body === 'balloon' ? 0.98 : 0.88);
        const k = n === 3 && i === 1 ? 1 : n > 1 ? 0.8 : 1;
        drawUnit(ctx, L, { ...base, x: cx + offs[i] * w, y: groundY - (n === 3 && i !== 1 ? h * 0.06 : 0), U: U * k, seed: i });
      }
    }
  }
  ctx.restore();
}
