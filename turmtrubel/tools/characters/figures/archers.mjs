// Bogenschützen – zwei sportliche Schwestern mit Fächerköcher (Brief: docs/briefs/archers.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { eye, eyeClosed, eyeSpiral, eyeX, brow, mouthLine, mouthOpen, rivets, stitches, emblem, lines, INK } from '../kit.mjs';

export default function archers(F) {
  const P = F.pal;
  const OCHRE = P.main;
  const TEAL = P.acc;
  const SHIRT = '#f1e3c4';
  const PANTS = '#5a4632';
  const LEATHER = '#7a4a2a';
  const WOOD = '#9a6a3a';
  const FEATHER = '#f4ead2';
  const SKIN = '#f3c6a2';
  const HAIR_A = '#5a3424';
  const HAIR_B = '#2e2230';
  const BRASS = '#c8a046';

  F.rig('biped', {
    hip: [0, -23],
    torso: [0, -25],
    head: [1, -47],
    hat: [-6, -66],
    armB: [-7, -44],
    handB: [-9, -31],
    armF: [7, -44],
    handF: [10, -31],
    prop: [11, -30],
    legB: [-4, -23],
    footB: [-5, -5],
    legF: [4, -23],
    footF: [5, -5],
    back: [-3, -37],
    cape: [2, -46],
  });

  // ───────── Fächerköcher: Pfeilrad auf Hüfthöhe, fächert nach hinten auf (Pfauenrad) ─────────
  const C = [-8, -27];
  F.part('fan', { bone: 'back', z: 3, zb: 3, sig: true }, (g) => {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = 128 + (i * 104) / (n - 1);
      const r = (a * Math.PI) / 180;
      const ux = Math.cos(r);
      const uy = Math.sin(r);
      const x0 = C[0] + ux * 5;
      const y0 = C[1] + uy * 5;
      const x1 = C[0] + ux * 21;
      const y1 = C[1] + uy * 21;
      g.stroke(polyline([[x0, y0], [x1, y1]]), '#8a6238', 1.5);
      g.stroke(polyline([[x0, y0], [x1, y1]]), '#b48a58', 0.5, { lod: 2 });
      // Befiederung: zwei schmale Fahnen nahe dem Ende, bunte Nocke
      const nx = -uy;
      const ny = ux;
      const fx = C[0] + ux * 16.5;
      const fy = C[1] + uy * 16.5;
      const col = [FEATHER, '#e9c36a', FEATHER, TEAL, FEATHER, '#e9c36a', FEATHER][i];
      g.mat(path([[fx, fy, 1], [fx + ux * 4.2 + nx * 2.2, fy + uy * 4.2 + ny * 2.2], [x1 - ux * 0.2, y1 - uy * 0.2, 1], [fx + ux * 4.2 - nx * 2.2, fy + uy * 4.2 - ny * 2.2]]), col, 'cloth', { lw: 0.8 });
      g.fill(circle(x1 + ux * 0.6, y1 + uy * 0.6, 0.9), '#6b3a20');
    }
    // Holzkranz als halbes Rad mit Messingnabe
    g.mat(circle(C[0], C[1], 6.5), WOOD, 'wood');
    g.stroke(circle(C[0], C[1], 4.3), '#6e4724', 0.6, { lod: 1 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.stroke(polyline([[C[0] + Math.cos(a) * 1.6, C[1] + Math.sin(a) * 1.6], [C[0] + Math.cos(a) * 5.6, C[1] + Math.sin(a) * 5.6]]), '#6e4724', 0.55, { lod: 1 });
    }
    g.mat(circle(C[0], C[1], 1.8), BRASS, 'gold');
  });
  F.part('quiverBand', { bone: 'hip', z: 24, zb: 33, team: true }, (g) => {
    g.mat(path([[-10, -29.5], [9.6, -29.2], [9.6, -26.6], [-10, -26.2]]), P.team, 'cloth', { line: P.teamDeep });
  });

  // ───────── Beine ─────────
  F.part('legB', { bone: 'legB', z: 6 }, (g) => g.mat(limb(-4, -24, -5, -6, 3.9, 3.1), PANTS, 'cloth'));
  F.part('footB', { bone: 'footB', z: 7 }, (g) => {
    g.mat(path([[-8.5, -13], [-2, -13], [-1.5, -5], [3, -2.5], [3.5, 0, 1], [-9, 0, 1], [-9, -6]]), TEAL, 'leather');
    g.mat(rrect(-9.2, -14.5, 8, 3.6, 1.6), '#23867a', 'leather', { lod: 1 });
  });
  F.part('legF', { bone: 'legF', z: 10 }, (g) => g.mat(limb(4, -24, 5, -6, 3.9, 3.1), PANTS, 'cloth'));
  F.part('footF', { bone: 'footF', z: 11 }, (g) => {
    g.mat(path([[1.5, -13], [8, -13], [8.5, -5], [13, -2.5], [13.5, 0, 1], [1, 0, 1], [1, -6]]), TEAL, 'leather');
    g.mat(rrect(0.8, -14.5, 8, 3.6, 1.6), '#23867a', 'leather', { lod: 1 });
  });

  // ───────── Hinterer Arm (zieht die Sehne) ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 40 }, (g) => {
    g.mat(limb(-7, -44, -9, -32, 3.6, 3), SHIRT, 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 41 }, (g) => {
    g.mat(circle(-9.3, -30, 3.1), SKIN, 'skin');
    g.mat(path([[-12, -33], [-6.6, -33.4], [-6.8, -30.5], [-11.8, -30.2]]), LEATHER, 'leather', { lod: 1 });
  });
  // Pfeil in der Zughand (nur bis zum Abschuss im Angriff)
  F.part('nockArrow', { bone: 'handB', z: 16, zb: 42, state: 'loaded' }, (g) => {
    g.stroke(polyline([[-9, -30], [12, -30]]), '#7a5532', 1.3);
    g.fill(poly([[12, -31.8], [16, -30], [12, -28.2]]), '#9aa3ad', { stroke: INK, lw: 0.5 });
    g.fill(poly([[-9, -30], [-12.5, -32.4], [-11, -30], [-12.5, -27.6]]), FEATHER, { stroke: '#b49a6a', lw: 0.4 });
  });

  // ───────── Rumpf ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 30 }, (g) => {
    g.mat(path([[-7.5, -47.5], [7.5, -47.5], [9.5, -36], [8.6, -25, 1], [-8.6, -25, 1], [-9.5, -36]]), SHIRT, 'cloth');
    const jerkin = path([[-8, -46], [-3, -47.5], [3, -47.5], [8, -46], [10, -35], [9.4, -23, 1], [-9.4, -23, 1], [-10, -35]]);
    g.mat(jerkin, OCHRE, 'leather');
    stitches(g, [[-8.6, -36], [0, -34.6], [9, -36]], '#9a7212', { step: 1.8, len: 1 });
    // Rautenstich am Saum
    g.lod(2, (h) => {
      for (let i = -3; i <= 3; i++) h.stroke(poly([[i * 2.6, -25.5], [i * 2.6 + 1.1, -24.2], [i * 2.6, -22.9], [i * 2.6 - 1.1, -24.2]]), '#a57a14', 0.45);
    });
  });
  F.part('belt', { bone: 'hip', z: 22, zb: 32 }, (g) => {
    g.mat(rrect(-9.4, -26.8, 19, 3, 1.4), LEATHER, 'leather');
  });
  F.part('buckle', { bone: 'hip', z: 23, view: 'front' }, (g) => {
    g.mat(circle(2.5, -27.9, 2.2), BRASS, 'gold');
    g.fill(circle(2.5, -27.9, 0.9), '#5a3412', { lod: 1 });
  });

  // ───────── Kopf ─────────
  F.part('hairBack', { bone: 'head', z: 24, zb: 36, variant: 0 }, (g) => {
    g.mat(path([[-11, -58], [-8, -70], [2, -75], [11, -71], [14, -60], [12, -52], [-9, -50]]), HAIR_A, 'hair');
  });
  F.part('braid', { bone: 'hat', z: 23, zb: 37, variant: 0 }, (g) => {
    for (let i = 0; i < 5; i++) {
      const y = -63 + i * 4.6;
      const x = -11 - i * 0.6;
      g.mat(ellipse(x, y, 3.2 - i * 0.18, 2.8), HAIR_A, 'hair');
    }
    g.mat(rrect(-15.4, -40.6, 4.6, 2.4, 1), P.acc, 'cloth');
    g.mat(path([[-15, -38.5], [-11.5, -38.5], [-12.4, -34.5], [-14.4, -34.5]]), HAIR_A, 'hair');
  });
  F.part('bun', { bone: 'hat', z: 38, zb: 38, variant: 1 }, (g) => {
    g.mat(circle(-2, -75.5, 6.2), HAIR_B, 'hair');
    g.stroke(spline([[-6.5, -77], [-2, -79.4], [3, -77]]), '#4a3a50', 0.6, { lod: 2 });
    g.mat(rrect(-10, -77.4, 17, 1.8, 0.9).rot(-18, -2, -76), BRASS, 'gold', { lod: 1 });
  });
  F.part('hairBackB', { bone: 'head', z: 24, zb: 36, variant: 1 }, (g) => {
    g.mat(path([[-11, -58], [-8, -70], [2, -75], [11, -71], [14, -60], [12, -52], [-9, -50]]), HAIR_B, 'hair');
  });
  F.part('face', { bone: 'head', z: 30, view: 'front' }, (g) => {
    g.mat(path([[-9.5, -66], [0, -71], [10.5, -68], [13.5, -59], [10.5, -50.5], [3, -47.5], [-5, -49.5], [-9.5, -56]]), SKIN, 'skin');
    g.mat(ellipse(-8, -58.5, 2.2, 3), SKIN, 'skin', { lod: 1 });
    g.fill(ellipse(10.5, -53.5, 2.4, 1.4), '#f08a7a', { op: 0.5, lod: 1 });
    g.fill(ellipse(-1.5, -53.5, 2, 1.2), '#f08a7a', { op: 0.4, lod: 1 });
    g.lod(2, (h) => {
      for (const [x, y] of [[9, -55.2], [10.6, -54.4], [11.8, -55.6], [-0.5, -55], [-2, -54.2]]) h.fill(circle(x, y, 0.38), '#c27a5a');
    });
    g.mat(path([[6.4, -57], [8.6, -56.2], [8.9, -54.1], [6.6, -53.8]]), '#eab08c', 'skin', { line: '#b07a5c', lw: 0.6 });
  });
  const EYE = { r: 2.7, ratio: 1.3, iris: '#5a3a24', lidColor: SKIN, look: [0.5, 0.05] };
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', expr: 'idle' }, (g) => {
    eye(g, 9.6, -59, EYE);
    eye(g, 0.8, -59, { ...EYE, r: 2.4 });
    brow(g, [[6.8, -63.6], [9.6, -64.8], [12.6, -63.8]], 0.9, '#4a2a1a');
    brow(g, [[-1.6, -63.4], [0.8, -64.6], [3.4, -63.8]], 0.85, '#4a2a1a');
    mouthLine(g, 7.6, -51.6, 5.2, 1.4, { lw: 0.9 });
  });
  F.part('face.attack', { bone: 'head', z: 31, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 9.6, -59, { ...EYE, lid: 0.25 });
    eyeClosed(g, 0.8, -59, 2.2, { up: true, lw: 0.9 });
    brow(g, [[6.8, -63], [9.6, -64.2], [12.6, -63.6]], 0.9, '#4a2a1a');
    brow(g, [[-1.6, -62.6], [0.8, -62.2], [3.4, -63.2]], 0.85, '#4a2a1a');
    g.mat(ellipse(5.6, -51.8, 1.7, 1.3), '#e0656e', 'flat', { line: INK, lw: 0.6 });
    mouthLine(g, 7.6, -51.6, 4.6, 0.3);
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', expr: 'hurt' }, (g) => {
    eyeClosed(g, 9.6, -59, 2.5, { up: true, lw: 1 });
    eyeClosed(g, 0.8, -59, 2.2, { up: true, lw: 1 });
    brow(g, [[6.8, -64.6], [9.6, -63.6], [12.6, -64.2]], 0.9, '#4a2a1a');
    mouthOpen(g, 7.4, -51.6, 4, 2.4, { teeth: null });
  });
  F.part('face.stun', { bone: 'head', z: 31, view: 'front', expr: 'stun' }, (g) => {
    eyeSpiral(g, 9.6, -59, 2.6);
    eyeSpiral(g, 0.8, -59, 2.3);
    mouthLine(g, 7.4, -51.4, 4, 0.8);
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 9.6, -59, 2);
    eyeX(g, 0.8, -59, 1.8);
    mouthLine(g, 7.4, -51.4, 4, -1);
  });
  F.part('bangs', { bone: 'head', z: 33, zb: 37, variant: 0, view: 'front' }, (g) => {
    g.mat(path([[-10.6, -58], [-9, -69], [0, -74.5], [11, -71.5], [14.6, -63], [12.8, -60.5], [9.6, -66], [4, -64], [-1, -66.5], [-5, -63], [-8, -61]]), HAIR_A, 'hair');
  });
  F.part('bangsB', { bone: 'head', z: 34, variant: 1, view: 'front' }, (g) => {
    g.mat(path([[-10.6, -58], [-9, -69], [0, -74.5], [11, -71.5], [14.6, -63], [12.8, -60.5], [9.6, -66], [4, -64], [-1, -66.5], [-5, -63], [-8, -61]]), HAIR_B, 'hair');
  });
  F.part('headBack', { bone: 'head', z: 35, zb: 38, view: 'back', variant: 0 }, (g) => {
    g.mat(path([[-10.6, -56], [-9, -69], [0, -74.5], [11, -71.5], [14.6, -61], [11, -51], [0, -48], [-9, -51]]), HAIR_A, 'hair');
  });
  F.part('headBackB', { bone: 'head', z: 36, zb: 39, view: 'back', variant: 1 }, (g) => {
    g.mat(path([[-10.6, -56], [-9, -69], [0, -74.5], [11, -71.5], [14.6, -61], [11, -51], [0, -48], [-9, -51]]), HAIR_B, 'hair');
  });
  F.part('headband', { bone: 'head', z: 37, zb: 40 }, (g) => {
    g.mat(path([[-9.6, -66.5], [0, -71.6], [11.4, -69], [12, -66.8], [0.6, -69.4], [-9.2, -64.4]]), TEAL, 'cloth', { lw: 0.9 });
  });

  // ───────── Schal (Teamzone) ─────────
  F.part('scarf', { bone: 'torso', z: 28, zb: 34, team: true }, (g) => {
    g.mat(path([[-8, -49], [0, -50.5], [9, -48.6], [8.6, -44.6], [0, -46], [-8.4, -45]]), P.team, 'cloth', { line: P.teamDeep });
  });
  F.part('scarfTail', { bone: 'cape', z: 8, zb: 35, team: true }, (g) => {
    g.mat(path([[-6, -48.5], [-14, -47], [-21, -44.5], [-26, -46, 1], [-22, -41.5], [-14, -42.6], [-6.5, -44.4]]), P.team, 'cloth', { line: P.teamDeep });
    lines(g, [[[-9, -46.4], [-20, -44.4]]], P.teamShade, 0.5, 1);
    g.lod(1, (h) => {
      h.stroke(polyline([[-25.8, -46], [-27.6, -46.6]]), P.teamShade, 0.6);
      h.stroke(polyline([[-24.6, -44.2], [-26.8, -43.4]]), P.teamShade, 0.6);
    });
  });

  // ───────── Vorderer Arm mit Bogen ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 12 }, (g) => {
    g.mat(limb(7, -44, 10, -32, 3.6, 3), SHIRT, 'cloth');
    g.mat(rrect(8.2, -37.5, 5.4, 6, 2).rot(-12, 10.8, -34.5), LEATHER, 'leather', { lod: 1 });
  });
  F.part('bow', { bone: 'prop', z: 41, zb: 13 }, (g) => {
    const bow = path([[11.5, -50], [14.6, -50.6, 1], [13, -48], [16.4, -40], [16.8, -30], [16.4, -20], [13, -12], [14.6, -9.4, 1], [11.5, -10], [14, -14], [15, -22], [15, -30], [15, -38], [14, -46]]);
    g.mat(bow, TEAL, 'wood');
    g.mat(rrect(14.4, -33.2, 3.6, 6.4, 1.4), LEATHER, 'leather', { lod: 1 });
    g.stroke(polyline([[13, -49.2], [12.6, -10.8]]), '#f4efe6', 0.55);
  });
  F.part('handF', { bone: 'handF', z: 42, zb: 14 }, (g) => g.mat(circle(15.6, -30, 3.1), SKIN, 'skin'));
  emblem(F, 'emblem', 'hip', 25, -4.4, -27.9, 1.9, { zb: 34 });

  F.anim({
    idle: { p: { bob: 1.1, breathe: 0.035, tilt: 3, armF: -6, sway: 3 }, keys: { root: { y: [[0, 0], [0.25, -1.4], [0.5, 0], [0.75, -1.4], [1, 0]] } } },
    walk: { p: { stride: 26, bob: 3, armSwing: 18, lean: 5, capeAmp: 8 } },
    attack: {
      prog: 'atk.shoot',
      hit: 0.62,
      p: { armFAim: -78, armBAim: -82, propAim: 78, handBAim: 82, draw: 7, recoil: 2.5, kick: 6, lean: 2, aimHead: 3 },
      keys: { armB: { r: [[0, 0], [0.18, 70], [0.3, 30], [0.45, 0], [1, 0]] }, layer: [[0, 0.7, 'armB', 43, 43], [0, 0.7, 'handB', 44, 44], [0, 0.7, 'nockArrow', 45, 45]] },
    },
  });
}
