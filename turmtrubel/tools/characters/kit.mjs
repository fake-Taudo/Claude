// Bausteine für den Figuren-Design-Code: Augen, Brauen, Münder, Nähte, Nieten, Mauerwerk, Kettenringe, Fell.
// Alle Funktionen zeichnen in einen Teil-Builder g (siehe dsl.mjs) und arbeiten in mu.
import { ellipse, circle, rrect, poly, spline, polyline, along, rng, path, blob } from './geo.mjs';

export const INK = '#1c1830';
export const WHITE = '#fffaf0';

/**
 * Cartoon-Auge. o: r (Radius), look ([dx, dy] Blickrichtung −1…1), iris (Farbe), lid (0 offen … 1 zu, von oben),
 * lidLow (unteres Lid), white (Augapfel), ratio (Höhe/Breite), tilt (Grad), glint
 */
export function eye(g, x, y, o = {}) {
  const r = o.r ?? 3;
  const ry = r * (o.ratio ?? 1.15);
  const [lx, ly] = o.look ?? [0.25, 0];
  const white = ellipse(x, y, r, ry, o.tilt || 0);
  g.fill(white, o.white ?? WHITE, { stroke: o.line ?? INK, lw: o.lw ?? Math.max(0.6, r * 0.24) });
  const ir = r * (o.irisR ?? 0.74);
  const ix = x + lx * (r - ir) * 0.9;
  const iy = y + ly * (ry - ir) * 0.9 + (o.irisDy ?? 0.12) * r;
  g.clipTo(white, (h) => {
    h.fill(circle(ix, iy, ir), o.iris ?? '#3a2a22');
    h.fill(circle(ix, iy, ir * (o.pupil ?? 0.55)), o.pupilColor ?? '#14101c');
    if (o.lid) h.fill(ellipse(x, y - ry * 2 + ry * 2 * o.lid, r * 1.6, ry * 1.25), o.lidColor ?? '#c99a7a', { stroke: o.line ?? INK, lw: (o.lw ?? Math.max(0.7, r * 0.28)) * 0.8 });
    if (o.lidLow) h.fill(ellipse(x, y + ry * 2 - ry * 2 * o.lidLow, r * 1.6, ry * 1.2), o.lidColor ?? '#c99a7a');
  });
  if (o.glint !== false) {
    g.fill(circle(ix - ir * 0.32, iy - ir * 0.38, Math.max(0.45, ir * 0.38)), '#ffffff', { lod: o.glintLod ?? 0 });
    g.fill(circle(ix + ir * 0.38, iy + ir * 0.36, Math.max(0.3, ir * 0.16)), '#ffffff', { lod: 1, op: 0.85 });
  }
  // Lidstrich oben (Ausdruck, liest sich auch klein)
  if (o.lash !== false) {
    const t = ((o.tilt || 0) * Math.PI) / 180;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const ex = Math.cos(a) * r * 1.04;
      const ey = Math.sin(a) * ry * 1.04 + (o.lid ? ry * 2 * o.lid * Math.sin((i / 8) * Math.PI) * 0.9 : 0);
      pts.push([x + ex * Math.cos(t) - ey * Math.sin(t), y + ex * Math.sin(t) + ey * Math.cos(t)]);
    }
    g.stroke(spline(pts), o.line ?? INK, o.lashW ?? Math.max(0.8, r * 0.42));
  }
}
/** Geschlossenes Auge als Bogen (schlafend, zufrieden, zugekniffen). up: Bogen nach oben (^) oder unten (◡). */
export function eyeClosed(g, x, y, w, o = {}) {
  const h = o.h ?? w * 0.45;
  const pts = o.up ? [[x - w, y + h * 0.4], [x, y - h * 0.6], [x + w, y + h * 0.4]] : [[x - w, y - h * 0.3], [x, y + h * 0.5], [x + w, y - h * 0.3]];
  g.stroke(spline(pts), o.color ?? INK, o.lw ?? Math.max(0.9, w * 0.35));
}
/** Spiral-Auge (betäubt). */
export function eyeSpiral(g, x, y, r, color = INK, lw = 0.9) {
  const pts = [];
  for (let i = 0; i <= 26; i++) {
    const a = i * 0.55;
    const rr = (r * i) / 26;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  g.fill(circle(x, y, r * 1.05), WHITE, { stroke: INK, lw: lw * 0.8 });
  g.stroke(spline(pts), color, lw);
}
/** X-Auge (Tod). */
export function eyeX(g, x, y, r, color = INK, lw = 1.1) {
  g.stroke(polyline([[x - r, y - r], [x + r, y + r]]), color, lw);
  g.stroke(polyline([[x + r, y - r], [x - r, y + r]]), color, lw);
}
/** Braue als dicker, spitz zulaufender Strich durch 2–3 Punkte. */
export function brow(g, pts, w, color = '#3a2418') {
  const [a, b] = [pts[0], pts[pts.length - 1]];
  const mid = pts.length > 2 ? pts[1] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * w;
  const ny = (dx / L) * w;
  g.fill(path([[a[0], a[1], 1], [mid[0] - nx * 0.5, mid[1] - ny * 0.5], [b[0] - nx * 0.25, b[1] - ny * 0.25], [b[0] + nx * 0.2, b[1] + ny * 0.2, 1], [mid[0] + nx * 0.5, mid[1] + ny * 0.5]]), color);
}
/** Mund als Linie (Lächeln > 0, Grimm < 0). */
export function mouthLine(g, x, y, w, curve = 0, o = {}) {
  g.stroke(spline([[x - w / 2, y - curve * 0.3], [x, y + curve], [x + w / 2, y - curve * 0.3]]), o.color ?? INK, o.lw ?? Math.max(0.8, w * 0.16));
}
/** Offener Mund mit Zähnen/Zunge. o: teeth ('top' | 'both' | 'clench' | null), tongue */
export function mouthOpen(g, x, y, w, h, o = {}) {
  const m = o.shape ?? path([[x - w / 2, y - h * 0.3], [x, y - h * 0.45], [x + w / 2, y - h * 0.3], [x + w * 0.3, y + h * 0.5], [x - w * 0.3, y + h * 0.5]]);
  g.fill(m, o.inside ?? '#4a1c24', { stroke: INK, lw: o.lw ?? 0.8 });
  g.clipTo(m, (h2) => {
    if (o.tongue !== false) h2.fill(ellipse(x + w * 0.05, y + h * 0.55, w * 0.32, h * 0.38), '#e0656e');
    if (o.teeth === 'top' || o.teeth === 'both') h2.fill(rrect(x - w * 0.42, y - h * 0.6, w * 0.84, h * 0.32, 0.4), WHITE);
    if (o.teeth === 'both') h2.fill(rrect(x - w * 0.3, y + h * 0.28, w * 0.6, h * 0.3, 0.4), WHITE);
    if (o.teeth === 'clench') {
      h2.fill(rrect(x - w / 2, y - h, w, h * 2, 0), WHITE);
      h2.stroke(polyline([[x - w / 2, y], [x + w / 2, y]]), '#8a8090', 0.5);
      for (let i = 1; i < 4; i++) h2.stroke(polyline([[x - w / 2 + (w * i) / 4, y - h], [x - w / 2 + (w * i) / 4, y + h]]), '#8a8090', 0.4);
    }
  });
}
/** Nahtstiche entlang einer Linie. */
export function stitches(g, pts, color, o = {}) {
  const step = o.step ?? 2.4;
  const len = o.len ?? 1.2;
  for (const [x, y, a] of along(pts, step, step / 2)) {
    const c = Math.cos(a + (o.cross ? Math.PI / 2 : 0)) * len * 0.5;
    const s = Math.sin(a + (o.cross ? Math.PI / 2 : 0)) * len * 0.5;
    g.stroke(polyline([[x - c, y - s], [x + c, y + s]]), color, o.lw ?? 0.55, { lod: o.lod ?? 2 });
  }
}
/** Nieten (Punkt mit Glanz) an Positionen. */
export function rivets(g, pts, r, color, o = {}) {
  for (const [x, y] of pts) {
    g.fill(circle(x, y, r), color, { stroke: o.line ?? INK, lw: r * 0.35, lod: o.lod ?? 1 });
    g.fill(circle(x - r * 0.3, y - r * 0.3, r * 0.35), '#ffffff', { lod: 2, op: 0.8 });
  }
}
/** Mauerwerk in einer Fläche: Fugen in Reihen mit versetzten Stoßfugen. */
export function bricks(g, clip, bb, rowH, brickW, color, o = {}) {
  g.clipTo(clip, (h) => {
    let row = 0;
    for (let y = bb[1] + rowH; y < bb[3]; y += rowH, row++) {
      h.stroke(polyline([[bb[0] - 2, y], [bb[2] + 2, y]]), color, o.lw ?? 0.7, { lod: o.lod ?? 1 });
    }
    row = 0;
    for (let y = bb[1]; y < bb[3]; y += rowH, row++) {
      for (let x = bb[0] + ((row % 2) * brickW) / 2; x < bb[2]; x += brickW) {
        if (x <= bb[0] + 0.5) continue;
        h.stroke(polyline([[x, y], [x, Math.min(bb[3], y + rowH)]]), color, (o.lw ?? 0.7) * 0.9, { lod: o.lod ?? 1 });
      }
    }
  });
}
/** Kettenringe (kleine Bögen in versetzten Reihen) innerhalb einer Form. */
export function chainmail(g, clip, bb, r, color, o = {}) {
  g.clipTo(clip, (h) => {
    let row = 0;
    for (let y = bb[1]; y < bb[3] + r; y += r * 1.3, row++) {
      for (let x = bb[0] + (row % 2) * r; x < bb[2] + r; x += r * 2) {
        h.stroke(spline([[x - r * 0.9, y - r * 0.2], [x, y + r * 0.7], [x + r * 0.9, y - r * 0.2]]), color, o.lw ?? 0.5, { lod: o.lod ?? 2 });
      }
    }
  });
}
/** Fellsträhnen entlang einer Kante (Keile nach außen). */
export function furEdge(g, pts, len, color, o = {}) {
  const R = rng(o.seed ?? 7);
  for (const [x, y, a] of along(pts, o.step ?? 2.6, 1)) {
    const n = a - Math.PI / 2 * (o.side ?? 1);
    const L = len * (0.7 + R() * 0.6);
    const w = o.w ?? 1.4;
    g.fill(poly([[x + Math.cos(a) * w, y + Math.sin(a) * w], [x + Math.cos(n) * L, y + Math.sin(n) * L], [x - Math.cos(a) * w, y - Math.sin(a) * w]]), color, { lod: o.lod ?? 1 });
  }
}
/** Feine Falten- oder Maserungslinien (Strich-Liste). */
export function lines(g, list, color, lw = 0.6, lod = 1) {
  for (const pts of list) g.stroke(pts.length > 2 ? spline(pts) : polyline(pts), color, lw, { lod });
}
/** Teamsymbol: Kreis (Blau) bzw. Dreieck (Rot), zwei Teile mit data-team-only. */
export function emblem(F, name, bone, z, x, y, r, o = {}) {
  F.part(name + '.blue', { bone, z, zb: o.zb, teamOnly: 'blue', team: true, lod: o.lod ?? 1, view: o.view }, (g) => {
    g.fill(circle(x, y, r), F.pal.symbol, { stroke: F.pal.teamDeep, lw: r * 0.28 });
  });
  F.part(name + '.red', { bone, z, zb: o.zb, teamOnly: 'red', team: true, lod: o.lod ?? 1, view: o.view }, (g) => {
    const h = r * 1.15;
    g.fill(poly([[x, y - h], [x + h * 0.95, y + h * 0.65], [x - h * 0.95, y + h * 0.65]], r * 0.18), F.pal.symbol, { stroke: F.pal.teamDeep, lw: r * 0.28 });
  });
}
export { ellipse, circle, rrect, poly, spline, polyline, path, blob };

/**
 * Standard-Ausdrücke für ein Gesicht mit zwei Augen (vorderes zuerst). Erzeugt die Teile face.idle, face.attack,
 * face.hurt, face.stun, face.death und face.sleep. Jede Stimmung lässt sich über o.<expr>(g, ctx) ergänzen oder mit
 * o.replace.<expr> komplett ersetzen.
 *
 * o: bone, z, view ('front'), eyes [[x, y, r], [x, y, r]], iris, lidColor, look, lid (Ruhe-Lid), ratio, irisR,
 *    brow { color, w, lift } | false, mouth [x, y, w], mood ('smile' | 'grin' | 'neutral' | 'frown' | 'smirk'),
 *    attackMouth ('shout' | 'clench' | 'grit' | 'oh' | 'grin'), lash, skip [expr…]
 */
export function faceSet(F, o) {
  const [E1, E2] = o.eyes;
  const bc = o.brow === false ? null : o.brow?.color ?? '#3a2418';
  const bw = o.brow?.w ?? Math.max(1, E1[2] * 0.62);
  const bl = o.brow?.lift ?? 1;
  const EYE = { iris: o.iris ?? '#3a2a22', lidColor: o.lidColor ?? '#e8b48c', look: o.look ?? [0.5, 0], ratio: o.ratio ?? 1.15, irisR: o.irisR, lash: o.lash, glint: o.glint };
  const [mx, my, mw] = o.mouth || [E1[0] - (E1[0] - E2[0]) * 0.35, E1[1] + E1[2] * 3.6, E1[2] * 2.4];
  const ctx = { E1, E2, mx, my, mw, EYE };
  // Brauen: inner = Ende zur Nase hin; tilt > 0 senkt das innere Ende (wütend), < 0 hebt es (besorgt)
  const browFor = (g, [x, y, r], front, tilt = 0, raise = 0, w = bw) => {
    if (!bc) return;
    const dir = front ? -1 : 1; // inneres Ende: vorderes Auge links, hinteres Auge rechts
    const yb = y - r * (1.75 + 0.3 * bl) - raise * r;
    const inner = [x + dir * r * 1.2, yb + tilt * r * 0.7];
    const outer = [x - dir * r * 1.25, yb - tilt * r * 0.35 + r * 0.15];
    const mid = [x, yb - r * 0.28 + tilt * r * 0.15];
    brow(g, front ? [inner, mid, outer].reverse() : [outer, mid, inner], w);
  };
  const brow = (g, pts, w) => {
    const a = pts[0];
    const b = pts[2];
    const m = pts[1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * w;
    const ny = (dx / L) * w;
    g.fill(path([[a[0], a[1], 1], [m[0] - nx * 0.5, m[1] - ny * 0.5], [b[0] - nx * 0.25, b[1] - ny * 0.25], [b[0] + nx * 0.2, b[1] + ny * 0.2, 1], [m[0] + nx * 0.5, m[1] + ny * 0.5]]), bc);
  };
  const mouthMood = (g, mood) => {
    if (mood === 'grin') {
      const m = path([[mx - mw / 2, my - mw * 0.12, 1], [mx + mw / 2, my - mw * 0.2, 1], [mx + mw * 0.22, my + mw * 0.28], [mx - mw * 0.24, my + mw * 0.24]]);
      g.fill(m, '#4a1c24', { stroke: INK, lw: Math.max(0.6, mw * 0.11) });
      g.clipTo(m, (h) => h.fill(rrect(mx - mw / 2, my - mw * 0.3, mw, mw * 0.2, 0.3), WHITE));
    } else if (mood === 'smirk') g.stroke(spline([[mx - mw / 2, my], [mx + mw * 0.1, my + mw * 0.06], [mx + mw / 2, my - mw * 0.18]]), INK, Math.max(0.8, mw * 0.15));
    else mouthLine(g, mx, my, mw, mood === 'smile' ? mw * 0.18 : mood === 'frown' ? -mw * 0.14 : mw * 0.03, { lw: Math.max(0.8, mw * 0.15) });
  };
  const exprs = {
    idle: (g) => {
      eye(g, E1[0], E1[1], { ...EYE, r: E1[2], lid: o.lid ?? 0.2 });
      eye(g, E2[0], E2[1], { ...EYE, r: E2[2], lid: o.lid ?? 0.2 });
      browFor(g, E1, true, o.idleTilt ?? 0);
      browFor(g, E2, false, o.idleTilt ?? 0);
      mouthMood(g, o.mood || 'neutral');
    },
    attack: (g) => {
      eye(g, E1[0], E1[1], { ...EYE, r: E1[2], lid: 0.38, look: [0.75, 0.1] });
      eye(g, E2[0], E2[1], { ...EYE, r: E2[2], lid: 0.38, look: [0.75, 0.1] });
      browFor(g, E1, true, 1.1, 0, bw * 1.15);
      browFor(g, E2, false, 1.1, 0, bw * 1.15);
      const am = o.attackMouth || 'shout';
      if (am === 'grin') mouthMood(g, 'grin');
      else if (am === 'oh') g.fill(ellipse(mx, my + mw * 0.08, mw * 0.24, mw * 0.3), '#4a1c24', { stroke: INK, lw: 0.7 });
      else mouthOpen(g, mx, my + mw * 0.05, mw * 1.05, mw * (am === 'shout' ? 0.55 : 0.4), { teeth: am === 'shout' ? 'top' : 'clench', tongue: am === 'shout', lw: Math.max(0.6, mw * 0.11) });
    },
    hurt: (g) => {
      eyeClosed(g, E1[0], E1[1], E1[2], { up: true, lw: Math.max(0.9, E1[2] * 0.42) });
      eye(g, E2[0], E2[1] - E2[2] * 0.1, { ...EYE, r: E2[2] * 1.05, look: [0.1, -0.2] });
      browFor(g, E1, true, -0.8, 0.25);
      browFor(g, E2, false, -0.8, 0.35);
      mouthOpen(g, mx, my + mw * 0.05, mw * 0.75, mw * 0.4, { teeth: 'top', tongue: false, lw: Math.max(0.6, mw * 0.11) });
    },
    stun: (g) => {
      eyeSpiral(g, E1[0], E1[1], E1[2] * 1.05, INK, Math.max(0.6, E1[2] * 0.3));
      eyeSpiral(g, E2[0], E2[1], E2[2] * 1.05, INK, Math.max(0.6, E2[2] * 0.3));
      g.stroke(spline([[mx - mw / 2, my], [mx - mw / 6, my + mw * 0.12], [mx + mw / 6, my - mw * 0.08], [mx + mw / 2, my + mw * 0.06]]), INK, Math.max(0.7, mw * 0.13));
    },
    death: (g) => {
      eyeX(g, E1[0], E1[1], E1[2] * 0.8, INK, Math.max(0.8, E1[2] * 0.4));
      eyeX(g, E2[0], E2[1], E2[2] * 0.8, INK, Math.max(0.8, E2[2] * 0.4));
      mouthLine(g, mx, my, mw * 0.85, -mw * 0.16, { lw: Math.max(0.8, mw * 0.14) });
    },
    sleep: (g) => {
      eyeClosed(g, E1[0], E1[1], E1[2], { lw: Math.max(0.8, E1[2] * 0.38) });
      eyeClosed(g, E2[0], E2[1], E2[2], { lw: Math.max(0.8, E2[2] * 0.38) });
      browFor(g, E1, true, -0.2);
      browFor(g, E2, false, -0.2);
      mouthLine(g, mx, my, mw * 0.6, mw * 0.06, { lw: Math.max(0.7, mw * 0.12) });
    },
  };
  const exprOf = { idle: 'idle', attack: ['attack', 'ability'], hurt: 'hurt', stun: 'stun', death: 'death', sleep: 'sleep' };
  for (const [name, fn] of Object.entries(exprs)) {
    if (o.skip?.includes(name)) continue;
    F.part('face.' + name, { bone: o.bone || 'head', z: o.z ?? 32, view: o.view === undefined ? 'front' : o.view, expr: exprOf[name] }, (g) => {
      const rep = o.replace?.[name];
      if (rep) rep(g, ctx);
      else fn(g);
      o[name]?.(g, ctx);
    });
  }
  return ctx;
}
