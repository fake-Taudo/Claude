// Geometrie- und Hilfsfunktionen der Simulation (ohne Zustand).
import { ARENA_W, ARENA_H } from '../../shared/arena.js';

export const TAU = Math.PI * 2;
export const r2 = (v) => Math.round(v * 100) / 100;
export const r1 = (v) => Math.round(v * 10) / 10;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function isStruct(e) {
  return e.kind !== 'unit';
}

/** Abstand eines Punktes zur "Oberfläche" einer Entität (Gebäude = Quadrat, Einheit = Kreis). */
export function surfaceDist(px, py, e) {
  if (e.kind !== 'unit') {
    const dx = Math.max(Math.abs(px - e.x) - e.half, 0);
    const dy = Math.max(Math.abs(py - e.y) - e.half, 0);
    return Math.hypot(dx, dy);
  }
  return Math.hypot(px - e.x, py - e.y) - e.radius;
}

/** Reichweiten-Abstand (Oberfläche zu Oberfläche). */
export function rangeDist(a, t) {
  return surfaceDist(a.x, a.y, t) - (a.kind === 'unit' ? a.radius : 0);
}

/** Trifft ein Effekt mit Ziel-Angabe dieses Objekt? (ground | air | both | buildings) */
export function affects(targets, o) {
  if (targets === 'both' || !targets) return true;
  if (targets === 'air') return !!o.flying;
  return !o.flying; // ground, buildings
}

/** Abstand eines Punktes zu einer Strecke (für Linienangriffe). */
export function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
}

/** Aufstellung mehrerer Einheiten einer Karte (relativ zum Ablagepunkt). */
export function formation(n, r, kind = null) {
  if (n <= 1) return [[0, 0]];
  const s = Math.max(0.65, r * 2 + 0.15);
  if (kind === 'line') {
    const out = [];
    for (let i = 0; i < n; i++) out.push([(i - (n - 1) / 2) * s * 1.1, 0]);
    return out;
  }
  if (kind === 'split') {
    // über die ganze Breite verteilt (Königsrekruten): je Hälfte n/2 Einheiten
    const half = Math.ceil(n / 2);
    const out = [];
    for (let i = 0; i < half; i++) out.push([-(1.25 + i * 2.5), 0], [1.25 + i * 2.5, 0]);
    return out.slice(0, n);
  }
  if (n === 2) return [[-s / 2, 0], [s / 2, 0]];
  if (n === 3) return [[0, -s * 0.55], [-s * 0.6, s * 0.45], [s * 0.6, s * 0.45]];
  const out = [];
  if (n <= 6) {
    const R = s * (n <= 4 ? 0.75 : 0.95);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (TAU * i) / n + (n === 4 ? Math.PI / 4 : 0);
      out.push([Math.cos(a) * R, Math.sin(a) * R]);
    }
    return out;
  }
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const rr = Math.floor(i / cols);
    out.push([(c - (cols - 1) / 2) * s, (rr - (rows - 1) / 2) * s]);
  }
  return out;
}

export function clampArena(e, x, y) {
  return [clamp(x, e.radius, ARENA_W - e.radius), clamp(y, e.radius, ARENA_H - e.radius)];
}

/** Einheiten derselben Ebene auseinanderschieben (schwere Einheiten schieben leichte). */
export function separate(list) {
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      const min = a.radius + b.radius;
      const dx = b.x - a.x;
      if (dx >= min || dx <= -min) continue;
      const dy = b.y - a.y;
      if (dy >= min || dy <= -min) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      let d = Math.sqrt(d2);
      let nx;
      let ny;
      if (d < 1e-4) {
        const ang = (((a.id * 7 + b.id * 13) % 360) * Math.PI) / 180;
        nx = Math.cos(ang);
        ny = Math.sin(ang);
        d = 0;
      } else {
        nx = dx / d;
        ny = dy / d;
      }
      const overlap = (min - d) * 0.5;
      const ma = a.deployT > 0 || a.rooted ? a.mass * 3 : a.mass;
      const mb = b.deployT > 0 || b.rooted ? b.mass * 3 : b.mass;
      const wa = mb / (ma + mb);
      const wb = ma / (ma + mb);
      a.x -= nx * overlap * wa;
      a.y -= ny * overlap * wa;
      b.x += nx * overlap * wb;
      b.y += ny * overlap * wb;
    }
  }
}

export function pushOutOfRect(u, s) {
  const h = s.half;
  const r = u.radius;
  const dx = u.x - s.x;
  const dy = u.y - s.y;
  const ox = h + r - Math.abs(dx);
  const oy = h + r - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return;
  const cx = clamp(u.x, s.x - h, s.x + h);
  const cy = clamp(u.y, s.y - h, s.y + h);
  const ddx = u.x - cx;
  const ddy = u.y - cy;
  const d2 = ddx * ddx + ddy * ddy;
  if (d2 > 1e-12) {
    if (d2 >= r * r) return;
    const d = Math.sqrt(d2);
    u.x = cx + (ddx / d) * r;
    u.y = cy + (ddy / d) * r;
    return;
  }
  if (ox < oy) u.x += (dx >= 0 ? 1 : -1) * ox;
  else u.y += (dy >= 0 ? 1 : -1) * oy;
}
