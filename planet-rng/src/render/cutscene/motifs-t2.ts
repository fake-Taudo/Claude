// Core motifs of the T2 cutscenes. Same conventions as motifs.ts: symbol units around the
// origin (60 = base size), `prog`/`aux` are the kind specific progress values, `rate` drives
// the motif's own animation speed.

import { hash01, mix, rgba } from '../color';
import { glowTex, nebulaTex } from '../vfx/tex';
import type { Curve } from '../../config/cutscenes';
import { integral, TAU } from './core';
import type { Painter } from './motifs';
import { glow, glowStroke } from './paint';

const GREY = '#8d93a3';

/** Phase of the motif's own animation (integrated rate). */
const phase = (prm: { rate?: Curve }, local: number, base = 1): number => integral(prm.rate, local, base);

/** Three (or more) bubble universes circling; prog merges them, aux lights the bridges. */
const bubbles: Painter = (ctx, prm, env, pal, prog, aux) => {
  const n = prm.count ?? 3;
  const rot = phase(prm, env.local, 0.5);
  const spread = 34 * (1 - Math.min(1, prog));
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    pts.push([Math.cos(a) * spread, Math.sin(a) * spread * 0.8]);
  }
  if (aux > 0) {
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % n];
      glowStroke(ctx, mix(pal[i % pal.length], '#ffffff', 0.4), 1.2, Math.min(1, aux), () => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
      });
    }
  }
  const r = 13 + prog * 9;
  for (let i = 0; i < n; i++) {
    const col = pal[i % pal.length];
    const [x, y] = pts[i];
    ctx.save();
    ctx.translate(x, y);
    glow(ctx, col, r * 2.2, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = mix(col, '#000000', 0.72);
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.rotate(env.time * 0.3 + i);
    ctx.drawImage(nebulaTex([col, mix(col, '#ffffff', 0.3)], 11 + i, 256), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
    ctx.restore();
    glowStroke(ctx, col, 0.7, 1, () => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
    });
    ctx.restore();
  }
};

interface WebGeo {
  nodes: [number, number][];
  edges: [number, number][];
}
const webCache = new Map<number, WebGeo>();
function webGeo(seed: number): WebGeo {
  let g = webCache.get(seed);
  if (g) return g;
  const nodes: [number, number][] = [];
  const N = 26;
  for (let i = 0; i < N; i++) {
    const r = 34 * Math.sqrt((i + 0.5) / N);
    const a = i * 2.39996 + hash01(seed + i) * 0.5;
    nodes.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const near = nodes
      .map((p, j) => [j, Math.hypot(p[0] - nodes[i][0], p[1] - nodes[i][1])] as [number, number])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    for (const [j] of near) if (!edges.some(([a, b]) => (a === j && b === i) || (a === i && b === j))) edges.push([i, j]);
  }
  g = { nodes, edges };
  webCache.set(seed, g);
  return g;
}

/**
 * Cosmic web: nodes and filaments build up (prog), light impulses run along them (rate).
 * aux 0..1 pulls every node onto one horizontal thread, 1..2 snaps the thread in the middle.
 */
const web: Painter = (ctx, prm, env, pal, prog, aux) => {
  const g = webGeo(prm.seed ?? 4);
  const N = g.nodes.length;
  const tension = Math.min(1, aux);
  const snap = Math.max(0, aux - 1);
  const pos = (i: number): [number, number] => {
    const [x, y] = g.nodes[i];
    const lx = x * 2.4;
    let px = x + (lx - x) * tension;
    const py = y * (1 - tension) + Math.sin(env.time * 40) * 1.2 * tension * (1 - snap) * (Math.abs(lx) < 70 ? 1 - Math.abs(lx) / 70 : 0);
    if (snap > 0) px += Math.sign(lx || 1) * snap * 60;
    return [px, py];
  };
  const visible = (i: number) => i / N < prog * 1.15;
  const ph = phase(prm, env.local, 0.6);
  ctx.globalCompositeOperation = 'lighter';
  for (let e = 0; e < g.edges.length; e++) {
    const [a, b] = g.edges[e];
    if (!visible(a) || !visible(b)) continue;
    const grow = Math.min(1, (prog * 1.15 - Math.max(a, b) / N) * 6);
    const [x0, y0] = pos(a);
    const [x1, y1] = pos(b);
    const xe = x0 + (x1 - x0) * grow;
    const ye = y0 + (y1 - y0) * grow;
    const alpha = snap > 0 ? Math.max(0, 1 - snap * 1.5) : 1;
    ctx.strokeStyle = rgba(pal[e % 2 ? 1 : 0], 0.55 * alpha);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(xe, ye);
    ctx.stroke();
    // Light impulse travelling along the filament.
    if (grow >= 1 && alpha > 0) {
      const f = (ph * (0.6 + hash01(e) * 0.8) + hash01(e + 9)) % 1;
      ctx.save();
      ctx.translate(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
      ctx.globalAlpha *= alpha;
      ctx.drawImage(glowTex(mix(pal[0], '#ffffff', 0.5), 'core'), -2.4, -2.4, 4.8, 4.8);
      ctx.restore();
    }
  }
  for (let i = 0; i < N; i++) {
    if (!visible(i)) continue;
    const [x, y] = pos(i);
    const s = 3.2 + 1.2 * Math.sin(env.time * 3 + i);
    ctx.drawImage(glowTex(pal[i % 2 ? 0 : 2] ?? pal[0], 'core'), x - s, y - s, s * 2, s * 2);
  }
  if (tension > 0.5 && snap < 1) {
    // The tight thread itself glows.
    glowStroke(ctx, pal[0], 0.6, (tension - 0.5) * 2 * (1 - snap), () => {
      ctx.beginPath();
      ctx.moveTo(-90 - snap * 60, 0);
      ctx.lineTo(-snap * 60, 0);
      ctx.moveTo(snap * 60, 0);
      ctx.lineTo(90 + snap * 60, 0);
    });
  }
  ctx.globalCompositeOperation = 'source-over';
};

/** White-hot core that beats ever faster (rate in Hz), embers circling it. */
const core: Painter = (ctx, prm, env, pal, prog) => {
  const ph = phase(prm, env.local, 0.8);
  // Peaks at whole phases, so a Ticker with the same rate ramp beats in sync.
  const beat = Math.pow(Math.max(0, Math.cos(ph * TAU)), 10);
  const r = 9 * (1 + 0.22 * beat + prog * 0.4);
  glow(ctx, pal[0], r * 5, 0.5 + beat * 0.4);
  glow(ctx, pal[1], r * 3, 0.6);
  for (let i = 0; i < 14; i++) {
    const a = env.time * (0.7 + hash01(i) * 0.8) + hash01(i + 4) * TAU;
    const d = r * (1.6 + hash01(i + 8) * 1.6);
    ctx.save();
    ctx.translate(Math.cos(a) * d, Math.sin(a) * d * 0.7);
    glow(ctx, pal[1], 2.2, 0.8, 'core');
    ctx.restore();
  }
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.6, mix(pal[0], '#ffffff', 0.7));
  g.addColorStop(1, rgba(pal[0], 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
};

/** Cells divide generation by generation (prog 0..1 = 1 -> 32 cells); aux fuses them. */
const cells: Painter = (ctx, _prm, env, pal, prog, aux) => {
  const gens = Math.min(5, prog * 5);
  const g = Math.floor(gens);
  const f = gens - g;
  const n = 1 << g;
  const fuse = Math.min(1, aux);
  const r = (16 / Math.sqrt(n)) * (1 + fuse * Math.sqrt(n) * 0.9);
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const d = (n === 1 ? 0 : 30 * Math.sqrt((i + 0.5) / n)) * (1 - fuse);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const split = g < 5 && f > 0.45 ? (f - 0.45) / 0.55 : 0;
    const dirA = hash01(i * 7 + g) * TAU;
    for (const side of split > 0 ? [-1, 1] : [0]) {
      const ox = Math.cos(dirA) * r * 0.55 * split * side;
      const oy = Math.sin(dirA) * r * 0.55 * split * side;
      const rr = split > 0 ? r * (1 - 0.22 * split) : r;
      const wob = 1 + 0.05 * Math.sin(env.time * 4 + i);
      ctx.save();
      ctx.translate(x + ox, y + oy);
      ctx.scale(wob, 1 / wob);
      glow(ctx, pal[1], rr * 1.8, 0.35);
      const grd = ctx.createRadialGradient(-rr * 0.3, -rr * 0.3, 0, 0, 0, rr);
      grd.addColorStop(0, rgba(mix(pal[0], '#ffffff', 0.4), 0.55));
      grd.addColorStop(1, rgba(pal[1], 0.25));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, TAU);
      ctx.fill();
      glowStroke(ctx, pal[0], Math.max(0.3, rr * 0.06), 0.9, () => {
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, TAU);
      });
      ctx.fillStyle = rgba(pal[2] ?? pal[0], 0.8);
      ctx.beginPath();
      ctx.arc(rr * 0.15, -rr * 0.1, rr * 0.28, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
};

/**
 * Ordered crystal lattice (rings of hexagons and spokes). prog 0..1 decays it: segment by
 * segment drifts away and fades to dust; lowering prog again reassembles it. aux greys it.
 */
const structure: Painter = (ctx, prm, _env, pal, prog, aux) => {
  const col = mix(pal[0], GREY, Math.min(1, aux));
  const col2 = mix(pal[1] ?? pal[0], GREY, Math.min(1, aux));
  const segs: [number, number, number, number][] = [];
  for (let ring = 1; ring <= 3; ring++) {
    const R = ring * 11;
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * TAU + ring * 0.2;
      const a1 = ((k + 1) / 6) * TAU + ring * 0.2;
      segs.push([Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R]);
      if (ring < 3) {
        const R2 = (ring + 1) * 11;
        segs.push([Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a0 + 0.2) * R2, Math.sin(a0 + 0.2) * R2]);
      }
    }
  }
  ctx.globalCompositeOperation = 'lighter';
  segs.forEach(([x0, y0, x1, y1], i) => {
    const th = hash01(i * 13 + (prm.seed ?? 1)) * 0.85;
    const d = Math.max(0, prog - th) / (1 - th + 1e-6);
    if (d >= 1) return;
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    const len = Math.hypot(mx, my) || 1;
    const drift = d * 18;
    const ox = (mx / len) * drift + (hash01(i) - 0.5) * d * 10;
    const oy = (my / len) * drift + d * d * 14;
    const a = 1 - d;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate((hash01(i + 3) - 0.5) * d * 2);
    ctx.strokeStyle = rgba(i % 3 ? col : col2, 0.9 * a);
    ctx.lineWidth = 1.2 * (1 - d * 0.6);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  });
  // Nodes at the corners.
  for (let ring = 1; ring <= 3; ring++) {
    for (let k = 0; k < 6; k++) {
      const i = ring * 6 + k;
      const th = hash01(i * 29 + 5) * 0.85;
      const d = Math.max(0, prog - th) / (1 - th + 1e-6);
      if (d >= 1) continue;
      const a0 = (k / 6) * TAU + ring * 0.2;
      ctx.save();
      ctx.translate(Math.cos(a0) * ring * 11, Math.sin(a0) * ring * 11 + d * d * 14);
      glow(ctx, col, 3, 1 - d, 'core');
      ctx.restore();
    }
  }
  glow(ctx, col, 14, (1 - prog) * 0.9, 'core');
  ctx.globalCompositeOperation = 'source-over';
};

/** Two mirrored halves (left pal[0], right pal[1]) with stars turning in opposite directions. */
const halves: Painter = (ctx, prm, env, pal, _prog, aux) => {
  const r = 26;
  const swap = Math.min(1, aux);
  const left = mix(pal[0], pal[1], swap);
  const right = mix(pal[1], pal[0], swap);
  const turn = phase(prm, env.local, 0.6);
  for (const [side, col] of [
    [-1, left],
    [1, right],
  ] as [number, string][]) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(side < 0 ? -r * 2 : 0, -r * 2, r * 2, r * 4);
    ctx.clip();
    glow(ctx, col, r * 2, 0.45);
    const g = ctx.createRadialGradient(side * r * 0.4, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba(mix(col, '#ffffff', 0.3), 0.5));
    g.addColorStop(1, rgba(col, 0.08));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.translate(side * r * 0.5, 0);
    ctx.rotate(turn * TAU * side);
    ctx.fillStyle = mix(col, '#ffffff', 0.35);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 === 0 ? r * 0.42 : r * 0.13;
      const a = -Math.PI / 2 + (i * Math.PI) / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  glowStroke(ctx, '#ffffff', 0.5, 0.9, () => {
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15);
    ctx.lineTo(0, r * 1.15);
  });
};

/** A real Möbius strip turning in 3D; light runners travel along it (rate) and flip sides. */
const mobius: Painter = (ctx, prm, env, pal, _prog, aux) => {
  const R = 26;
  const w = 8;
  const yaw = env.time * 0.55;
  const pitch = 1.05;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const proj = (u: number, v: number): [number, number, number] => {
    const k = R + v * w * Math.cos(u / 2);
    let x = k * Math.cos(u);
    let y = k * Math.sin(u);
    let z = v * w * Math.sin(u / 2);
    const x1 = x * cy + z * sy;
    z = -x * sy + z * cy;
    x = x1;
    const y1 = y * cp - z * sp;
    z = y * sp + z * cp;
    y = y1;
    return [x, y, z];
  };
  const N = 72;
  const quads: { z: number; pts: [number, number][]; face: number }[] = [];
  for (let i = 0; i < N; i++) {
    const u0 = (i / N) * TAU;
    const u1 = ((i + 1) / N) * TAU;
    const a = proj(u0, -1);
    const b = proj(u1, -1);
    const c = proj(u1, 1);
    const d = proj(u0, 1);
    // Facing from the screen-space winding: which side of the band we see.
    const cross = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    quads.push({ z: (a[2] + b[2] + c[2] + d[2]) / 4, pts: [a, b, c, d].map((p) => [p[0], p[1]] as [number, number]), face: cross });
  }
  quads.sort((p, q) => p.z - q.z);
  const swap = Math.min(1, aux);
  for (const q of quads) {
    const col = q.face >= 0 ? mix(pal[0], pal[1], swap) : mix(pal[1], pal[0], swap);
    const light = 0.45 + 0.4 * Math.max(0, Math.min(1, (q.z + R) / (2 * R)));
    ctx.fillStyle = rgba(mix(col, '#000000', 1 - light), 0.92);
    ctx.strokeStyle = rgba(mix(col, '#ffffff', 0.3), 0.5);
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(q.pts[0][0], q.pts[0][1]);
    for (let k = 1; k < 4; k++) ctx.lineTo(q.pts[k][0], q.pts[k][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Runners: two laps of u bring a runner back to its own side.
  const ph = phase(prm, env.local, 0.15);
  const runners = 6;
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < runners; k++) {
    const u = ((ph + k / runners) % 1) * 2 * TAU;
    const [x, y] = proj(u, 0.45);
    const s = 3.2;
    ctx.drawImage(glowTex(mix(k % 2 ? pal[0] : pal[1], '#ffffff', 0.5), 'core'), x - s, y - s, s * 2, s * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
};

export const T2_PAINTERS = { bubbles, web, core, cells, structure, halves, mobius };
