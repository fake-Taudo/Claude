// Eisgeist – kichernder Kristall-Igel mit Kranz aus Eisstacheln, der sich zur Kugel rollt und Gegner einfriert
// (Brief: docs/briefs/ice-spirit.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeX, eyeSpiral, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function iceSpirit(F) {
  const P = F.pal;
  const ICE = P.main;
  const FACET = P.acc;
  const DEEP = '#2e7aa8';
  const C = [2, -19];

  F.rig('blob', { body: C, eyes: [8, -21], hat: [-2, -32], feet: [1, -3] });

  // Stachelkranz: Kristallspitzen strahlen vom Rücken aus
  const spikes = (g, r0, r1, a0, a1, n, col, line) => {
    for (let i = 0; i < n; i++) {
      const a = ((a0 + ((a1 - a0) * i) / (n - 1)) * Math.PI) / 180;
      const w = 0.32;
      const p = (rr, da) => [C[0] + Math.cos(a + da) * rr, C[1] + Math.sin(a + da) * rr];
      g.mat(poly([p(r0, -w), p(r1, 0), p(r0, w)], 0.4), col, 'glass', { line, hi: 0.8 });
    }
  };
  F.part('feet', { bone: 'feet', z: 4, state: ['idle', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'death', 'ability'] }, (g) => {
    for (const x of [-4, 6]) g.mat(ellipse(x, -2, 3.6, 2.2), '#c8eefa', 'glass', { line: DEEP });
  });
  F.part('spikesBack', { bone: 'body', z: 6, zb: 6, sig: true }, (g) => spikes(g, 12, 23, 110, 300, 9, '#d8f4ff', DEEP));
  F.part('evoSpikes', { bone: 'body', z: 5.5, zb: 5.5, evo: 'evo' }, (g) => spikes(g, 12, 27, 125, 285, 8, '#a8e0f8', DEEP));
  F.part('evoTips', { bone: 'body', z: 6.5, zb: 6.5, evo: 'evo', glow: true }, (g) => {
    for (let i = 0; i < 9; i++) {
      const a = ((110 + (190 * i) / 8) * Math.PI) / 180;
      g.fill(circle(C[0] + Math.cos(a) * 22, C[1] + Math.sin(a) * 22, 1.3), '#7ad8ff');
    }
  });
  F.part('body', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const b = circle(C[0], C[1], 14.6);
    g.mat(b, ICE, 'glass', { line: DEEP, hi: 0.9 });
    g.clipTo(b, (h) => {
      // Facetten
      h.fill(poly([[-12, -24], [-4, -32], [-2, -22]], 0), '#ffffff', { op: 0.5, lod: 1 });
      h.fill(poly([[-10, -12], [-2, -20], [2, -8]], 0), FACET, { op: 0.25, lod: 1 });
      h.fill(poly([[6, -6], [14, -14], [16, -4]], 0), FACET, { op: 0.3, lod: 1 });
      h.lod(2, (k) => lines(k, [[[-12, -24], [-2, -22], [2, -8]], [[-4, -32], [-2, -22]]], '#a8daf0', 0.4, 2));
    });
  });
  F.part('spikesFront', { bone: 'body', z: 12, zb: 4 }, (g) => spikes(g, 13, 20, 200, 250, 3, '#e8fbff', DEEP));
  // Schleife (Teamzone)
  F.part('bow', { bone: 'hat', z: 14, zb: 14, team: true }, (g) => {
    g.mat(path([[-2, -32], [-8, -36, 1], [-7, -28, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[-2, -32], [4, -37, 1], [4, -29, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(circle(-2, -32, 1.6), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('evoCrown', { bone: 'hat', z: 14.5, zb: 14.5, evo: 'evo' }, (g) => {
    for (const [x, h] of [[4, 7], [8, 9], [12, 6]]) g.mat(poly([[x - 1.6, -31 + (x - 8) * 0.3], [x, -31 - h], [x + 1.6, -31 + (x - 8) * 0.3]], 0.3), '#c8f0ff', 'glass', { line: DEEP });
  });
  // Gesicht: Knopfaugen, Stupsnase, kicherndes Mündchen
  F.part('face.idle', { bone: 'eyes', z: 20, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    for (const x of [13, 6.6]) g.fill(ellipse(x, -21.6, 1.5, 2), INK);
    for (const x of [13.4, 7]) g.fill(circle(x, -22.4, 0.5), WHITE);
    g.fill(ellipse(10.6, -18.6, 1.4, 1), '#7ab8d8');
    g.fill(path([[8, -15.6], [12.6, -15.4], [10.4, -13.4, 1]]), '#2a4a6a');
    g.fill(ellipse(15, -17, 1.6, 1), '#a8d8f8', { op: 0.8 });
  });
  F.part('face.attack', { bone: 'eyes', z: 20, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eyeClosed(g, 13, -21.6, 1.8, { up: true, lw: 0.9 });
    eyeClosed(g, 6.6, -21.6, 1.6, { up: true, lw: 0.9 });
    mouthOpen(g, 10.4, -15.4, 5, 3, { teeth: false, tongue: false, lw: 0.6 });
  });
  F.part('face.hurt', { bone: 'eyes', z: 20, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eyeSpiral(g, 13, -21.6, 1.8, INK, 0.6);
    eyeSpiral(g, 6.6, -21.6, 1.6, INK, 0.6);
    g.fill(ellipse(10.4, -15, 1.2, 1.4), '#2a4a6a');
  });
  F.part('face.death', { bone: 'eyes', z: 20, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 13, -21.6, 1.4, INK, 0.7);
    eyeX(g, 6.6, -21.6, 1.3, INK, 0.7);
  });
  F.part('burst', { bone: 'root', z: 30, state: 'muzzle', glow: true }, (g) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fill(poly([[C[0] + Math.cos(a) * 16, C[1] + Math.sin(a) * 16], [C[0] + Math.cos(a + 0.12) * 28, C[1] + Math.sin(a + 0.12) * 28], [C[0] + Math.cos(a + 0.24) * 16, C[1] + Math.sin(a + 0.24) * 16]], 0.3), '#d8f6ff', { op: 0.9 });
    }
    g.fill(circle(C[0], C[1], 14), '#ffffff', { op: 0.5 });
  });
  F.part('shards', { bone: 'root', z: 30, state: 'shatter' }, (g) => {
    for (const [x, y, r] of [[-14, -10, 20], [14, -14, -30], [-6, -30, 60], [10, -2, 10], [20, -26, -50]]) g.mat(poly([[x - 3, y + 2], [x, y - 4], [x + 3, y + 2]], 0.3).rot(r, x, y), '#d8f6ff', 'glass', { line: DEEP });
  });
  emblem(F, 'emblem', 'body', 21, -6, -14, 2, { zb: 21 });

  F.anim({
    // rollt sich ein und wieder auf
    idle: { prog: 'blob.idle', p: { wobble: 0.04 }, keys: { body: { r: [[0, 0], [0.4, 0], [0.55, -24], [0.7, 0]], sy: [[0, 1], [0.4, 1], [0.55, 0.9], [0.7, 1]] }, eyes: { y: [[0, 0], [0.45, 0], [0.55, 2], [0.65, 0]] } } },
    // rollt
    walk: { prog: 'still', keys: { root: { y: [[0, 0], [0.5, -2], [1, 0]] }, body: { r: [[0, 0], [1, 360]] }, expr: [[0, 1, 'attack']] } },
    // Kugelsprung und Frostplatzer
    attack: { prog: 'still', hit: 0.6, keys: { root: { y: [[0, 0], [0.2, 2], [0.45, -18, 'out'], [0.6, -6, 'in']], x: [[0, 0], [0.6, 10]] }, body: { r: [[0, 0], [0.6, 300]], sx: [[0, 1], [0.2, 1.15], [0.3, 0.9], [0.6, 1]], sy: [[0, 1], [0.2, 0.8], [0.3, 1.1], [0.6, 1]] }, show: { muzzle: [[0.6, 1.01]] }, expr: [[0, 1, 'attack']] }, ev: { release: 0.6 } },
    // Stacheln klirren
    hit: { prog: 'generic.hit', keys: { body: { r: [[0, 0], [0.15, -10], [0.3, 8], [0.5, 0]] } } },
    // rollt aus dem Schnee
    spawn: { prog: 'still', keys: { root: { x: [[0, -14], [0.6, 0, 'out']] }, body: { r: [[0, -360], [0.6, 0, 'out']], sy: [[0, 0.5], [0.4, 1]] }, alpha: [[0, 0], [0.2, 1]] } },
    // zerspringt in Eissplitter
    death: { prog: 'generic.death', keys: { show: { shatter: [[0.2, 1.01]] } } },
  });
}
