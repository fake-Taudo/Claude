// Geometrie für den Figuren-Design-Code: Pfade als Segmentlisten mit absoluten Koordinaten (mu, y nach unten).
// Segmente: ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y] ['Q',x1,y1,x,y] ['Z'].
// Alle geschlossenen Formen laufen im Uhrzeigersinn (Bildschirm), damit Vereinigungen mit nonzero gefüllt werden.

const R = Math.PI / 180;
const fmt = (v) => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
};

// ───────────── Matrizen [a, b, c, d, e, f] ─────────────
export const Mx = {
  id: () => [1, 0, 0, 1, 0, 0],
  mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
  tr: (x, y) => [1, 0, 0, 1, x, y],
  sc: (sx, sy = sx, cx = 0, cy = 0) => [sx, 0, 0, sy, cx - sx * cx, cy - sy * cy],
  rot: (deg, cx = 0, cy = 0) => {
    const c = Math.cos(deg * R);
    const s = Math.sin(deg * R);
    return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
  },
  ap: (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]],
};

export class Shape {
  constructor(segs = []) {
    this.segs = segs;
  }
  get d() {
    let s = '';
    for (const g of this.segs) s += g[0] + g.slice(1).map(fmt).join(' ');
    return s;
  }
  /** Begrenzung inkl. Kontrollpunkten (konservativ): [x0, y0, x1, y1]. */
  get bb() {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const g of this.segs) {
      for (let i = 1; i < g.length; i += 2) {
        if (g[i] < x0) x0 = g[i];
        if (g[i] > x1) x1 = g[i];
        if (g[i + 1] < y0) y0 = g[i + 1];
        if (g[i + 1] > y1) y1 = g[i + 1];
      }
    }
    return [x0, y0, x1, y1];
  }
  get w() {
    const b = this.bb;
    return b[2] - b[0];
  }
  get h() {
    const b = this.bb;
    return b[3] - b[1];
  }
  get cx() {
    const b = this.bb;
    return (b[0] + b[2]) / 2;
  }
  get cy() {
    const b = this.bb;
    return (b[1] + b[3]) / 2;
  }
  t(m) {
    const det = m[0] * m[3] - m[1] * m[2];
    const segs = this.segs.map((g) => {
      const out = [g[0]];
      for (let i = 1; i < g.length; i += 2) out.push(...Mx.ap(m, g[i], g[i + 1]));
      return out;
    });
    const s = new Shape(segs);
    return det < 0 ? s.reverse() : s;
  }
  move(dx, dy) {
    return this.t(Mx.tr(dx, dy));
  }
  scale(sx, sy = sx, cx = 0, cy = 0) {
    return this.t(Mx.sc(sx, sy, cx, cy));
  }
  rot(deg, cx = 0, cy = 0) {
    return this.t(Mx.rot(deg, cx, cy));
  }
  /** Spiegeln an der senkrechten Achse x = cx (Richtung bleibt im Uhrzeigersinn). */
  flipX(cx = 0) {
    return this.t([-1, 0, 0, 1, 2 * cx, 0]);
  }
  add(...others) {
    return new Shape(this.segs.concat(...others.map((o) => o.segs)));
  }
  /** Kehrt die Laufrichtung jedes Teilpfads um (für Löcher bzw. Richtungsausgleich). */
  reverse() {
    const out = [];
    let sub = [];
    const flush = () => {
      if (!sub.length) return;
      const closed = sub[sub.length - 1][0] === 'Z';
      const segs = closed ? sub.slice(0, -1) : sub;
      // Punkte sammeln: Start + Endpunkte der Segmente
      const pts = [[segs[0][1], segs[0][2]]];
      for (let i = 1; i < segs.length; i++) pts.push([segs[i][segs[i].length - 2], segs[i][segs[i].length - 1]]);
      const rev = [['M', ...pts[pts.length - 1]]];
      for (let i = segs.length - 1; i >= 1; i--) {
        const g = segs[i];
        const p = pts[i - 1];
        if (g[0] === 'L') rev.push(['L', ...p]);
        else if (g[0] === 'C') rev.push(['C', g[3], g[4], g[1], g[2], ...p]);
        else if (g[0] === 'Q') rev.push(['Q', g[1], g[2], ...p]);
      }
      if (closed) rev.push(['Z']);
      out.push(...rev);
      sub = [];
    };
    for (const g of this.segs) {
      if (g[0] === 'M') flush();
      sub.push(g);
    }
    flush();
    return new Shape(out);
  }
}

/** Vorzeichenbehaftete Fläche eines Polygons (Bildschirm: positiv = Uhrzeigersinn). */
export function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
const cw = (pts) => (area(pts) < 0 ? pts.slice().reverse() : pts);

// ───────────── Grundformen ─────────────
const K = 0.5522847498;
export function ellipse(cx, cy, rx, ry = rx, rotDeg = 0) {
  const s = new Shape([
    ['M', cx + rx, cy],
    ['C', cx + rx, cy + ry * K, cx + rx * K, cy + ry, cx, cy + ry],
    ['C', cx - rx * K, cy + ry, cx - rx, cy + ry * K, cx - rx, cy],
    ['C', cx - rx, cy - ry * K, cx - rx * K, cy - ry, cx, cy - ry],
    ['C', cx + rx * K, cy - ry, cx + rx, cy - ry * K, cx + rx, cy],
    ['Z'],
  ]);
  return rotDeg ? s.rot(rotDeg, cx, cy) : s;
}
export const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

/** Rechteck mit runden Ecken; r als Zahl oder [oben links, oben rechts, unten rechts, unten links]. */
export function rrect(x, y, w, h, r = 0) {
  const [a, b, c, d] = (Array.isArray(r) ? r : [r, r, r, r]).map((v) => Math.min(v, w / 2, h / 2));
  return new Shape([
    ['M', x + a, y],
    ['L', x + w - b, y],
    ['Q', x + w, y, x + w, y + b],
    ['L', x + w, y + h - c],
    ['Q', x + w, y + h, x + w - c, y + h],
    ['L', x + d, y + h],
    ['Q', x, y + h, x, y + h - d],
    ['L', x, y + a],
    ['Q', x, y, x + a, y],
    ['Z'],
  ]);
}

/** Polygon; round > 0 rundet jede Ecke (Abstand in mu, höchstens halbe Kantenlänge). round als Zahl oder Liste je Ecke. */
export function poly(points, round = 0) {
  const flip = area(points) < 0;
  const pts = flip ? points.slice().reverse() : points;
  const rounds = Array.isArray(round) ? (flip ? round.slice().reverse() : round) : null;
  const n = pts.length;
  if (!round) return new Shape([['M', ...pts[0]], ...pts.slice(1).map((p) => ['L', ...p]), ['Z']]);
  const segs = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1;
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const r = Math.min(rounds ? rounds[i] ?? 0 : round, la / 2, lb / 2);
    const p1 = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r];
    const p2 = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
    segs.push(i === 0 ? ['M', ...p1] : ['L', ...p1]);
    if (r > 0) segs.push(['Q', p[0], p[1], ...p2]);
  }
  segs.push(['Z']);
  return new Shape(segs);
}

/** Geschlossene, weiche Form durch alle Punkte (Catmull-Rom → kubische Bézier). */
export function blob(points, tension = 1) {
  const pts = cw(points);
  const n = pts.length;
  const t = tension / 6;
  const segs = [['M', ...pts[0]]];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    segs.push(['C', p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]]);
  }
  segs.push(['Z']);
  return new Shape(segs);
}

/**
 * Gemischte Kontur: Punkte mit Flag. [x, y] = weicher Punkt (Catmull-Rom), [x, y, 1] = Ecke.
 * Erlaubt Formen mit runden Bäuchen und spitzen Ecken (Helmkanten, Zinnen, Krallen).
 */
export function path(points, tension = 1) {
  const pts0 = points.map((p) => ({ x: p[0], y: p[1], sharp: !!p[2] }));
  const a = area(pts0.map((p) => [p.x, p.y]));
  const pts = a < 0 ? pts0.reverse() : pts0;
  const n = pts.length;
  const t = tension / 6;
  const segs = [['M', pts[0].x, pts[0].y]];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = p1.sharp ? [p1.x, p1.y] : [p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t];
    const c2 = p2.sharp ? [p2.x, p2.y] : [p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t];
    if (p1.sharp && p2.sharp) segs.push(['L', p2.x, p2.y]);
    else segs.push(['C', ...c1, ...c2, p2.x, p2.y]);
  }
  segs.push(['Z']);
  return new Shape(segs);
}

/** Offene, weiche Linie durch die Punkte (für Striche: Nähte, Strähnen, Schnüre). */
export function spline(points, tension = 1) {
  const n = points.length;
  const t = tension / 6;
  const segs = [['M', ...points[0]]];
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    segs.push(['C', p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t, p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t, p2[0], p2[1]]);
  }
  return new Shape(segs);
}
export const polyline = (points) => new Shape([['M', ...points[0]], ...points.slice(1).map((p) => ['L', ...p])]);

/** Gliedmaße: Kapsel von (ax, ay) mit Radius ra nach (bx, by) mit Radius rb, außen weich. */
export function limb(ax, ay, bx, by, ra, rb = ra) {
  const th = Math.atan2(by - ay, bx - ax);
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const a = th + Math.PI / 2 + (i / 4) * Math.PI;
    pts.push([ax + Math.cos(a) * ra, ay + Math.sin(a) * ra]);
  }
  for (let i = 0; i <= 4; i++) {
    const a = th - Math.PI / 2 + (i / 4) * Math.PI;
    pts.push([bx + Math.cos(a) * rb, by + Math.sin(a) * rb]);
  }
  return blob(pts, 0.9);
}

/** Stern bzw. Zackenkranz. */
export function star(cx, cy, r1, r2, n, rotDeg = -90, round = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rotDeg + (i * 180) / n) * R;
    const r = i % 2 ? r2 : r1;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return poly(pts, round);
}

/** Punkte auf einer Ellipse (Grad, im Uhrzeigersinn von a0 nach a1). */
export function arc(cx, cy, rx, ry, a0, a1, n = 8) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * R;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

/** Kreisring (Loch läuft gegen den Uhrzeigersinn, füllt mit nonzero korrekt). */
export const ring = (cx, cy, r1, r2) => circle(cx, cy, r1).add(circle(cx, cy, r2).reverse());

/** Punkte entlang einer Polylinie in gleichen Abständen (für Nähte, Nieten, Kettenglieder): [x, y, Winkel]. */
export function along(points, step, offset = 0) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const total = cum[cum.length - 1];
  const out = [];
  let j = 1;
  for (let s = offset; s <= total + 1e-6; s += step) {
    while (j < points.length - 1 && cum[j] < s) j++;
    const L = cum[j] - cum[j - 1] || 1;
    const t = (s - cum[j - 1]) / L;
    const [x1, y1] = points[j - 1];
    const [x2, y2] = points[j];
    out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, Math.atan2(y2 - y1, x2 - x1)]);
  }
  return out;
}

/** Deterministischer Zufall (für Fellsträhnen, Flecken, Kratzer): gleiche Saat → gleiche Figur. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const lerpP = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
