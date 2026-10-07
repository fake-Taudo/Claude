// Prinzessin – verträumte Musikerin im Glockenkleid mit Harfenbogen, dessen mittlere Saite zum brennenden Pfeil wird
// (Brief: docs/briefs/princess.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { faceSet, eye, eyeClosed, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function princess(F) {
  const P = F.pal;
  const DRESS = P.main;
  const MINT = P.acc;
  const GOLD = '#e2b84a';
  const HAIR = '#f2d27a';
  const SKIN = '#f6d0b4';
  const DRESS_D = '#e0907a';
  const PEARL = '#f0ece8';

  F.rig('robe', {
    hip: [0, -31],
    skirt: [0, -31],
    torso: [0, -33],
    head: [3, -51],
    hat: [3, -64],
    armB: [-7, -47],
    handB: [-10, -36],
    armF: [8, -47],
    handF: [14, -38],
    prop: [14, -38],
    cape: [-3, -55],
  });

  // ───────── Haarschnecken hinten ─────────
  F.part('bunB', { bone: 'head', z: 6, zb: 34 }, (g) => {
    g.mat(circle(-8, -62, 5.4), HAIR, 'hair', { hi: 0.5 });
    g.stroke(spline(arc(-8, -62, 3.4, 3.4, 0, 300, 10)), '#d8b450', 0.7, { lod: 1 });
  });

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(circle(-7, -47, 4.4), DRESS, 'cloth');
    g.mat(limb(-7.6, -45, -10, -37, 2.6, 2.4), '#e8b898', 'skin');
  });
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-10, -35.6, 2.4), '#e8b898', 'skin'));
  F.part('fireArrow', { bone: 'handB', z: 11, zb: 44, state: 'loaded', glow: true }, (g) => {
    g.stroke(polyline([[-10, -35.6], [12, -35.6]]), '#ffb347', 1.4);
    g.fill(path([[12, -38], [18, -35.6, 1], [12, -33.2]]), '#fff0a0');
    g.fill(circle(-6, -35.6, 2.6), '#ff7a2a', { op: 0.6 });
  });

  // ───────── Glockenkleid mit Schuppenrüschen, Mieder mit Schnürung ─────────
  F.part('dress', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    const hem = [];
    for (let i = 0; i <= 10; i++) hem.push([22 - i * 4.4, -2 + (i % 2 ? 0 : 1.6)]);
    const d = path([[-7, -36], [7, -36], [12, -24], [20, -10], ...hem, [-20, -10], [-12, -24]]);
    g.mat(d, DRESS, 'cloth', { hi: 0.4 });
    g.clipTo(d, (h) => {
      for (const y of [-12, -7]) for (let x = -22; x < 23; x += 4.4) h.stroke(spline([[x - 2.2, y], [x, y + 2.2], [x + 2.2, y]]), DRESS_D, 0.7, { lod: 1 });
      lines(h, [[[-4, -34], [-10, -12]], [[4, -34], [10, -12]]], DRESS_D, 0.7, 1);
      h.fill(ellipse(-12, -4, 3, 1.4), '#8ab060', { op: 0.4, lod: 1 });
    });
  });
  F.part('shoes', { bone: 'skirt', z: 17, zb: 17 }, (g) => {
    for (const x of [-6, 8]) {
      g.mat(path([[x - 3, -2], [x + 4, -2], [x + 6, 0, 1], [x - 3.6, 0, 1]]), '#c8786a', 'leather');
      g.mat(rrect(x - 0.6, -2.6, 2.4, 1.6, 0.4), GOLD, 'gold', { lod: 1 });
    }
  });
  F.part('bodice', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-7, -47], [7, -47], [8, -40], [6, -33], [-6, -33], [-8, -40]]), DRESS_D, 'cloth');
    g.lod(1, (h) => {
      for (let y = -45; y < -35; y += 2.4) h.stroke(polyline([[-1.4, y], [1.4, y + 1.2]]), '#fff4e0', 0.5);
      h.fill(circle(-4, -42, 1.2), '#f8e8f0');
      h.fill(circle(4, -40, 1), '#f8e8f0');
    });
  });
  F.part('bow', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-1, -33], [-7, -36.6], [-7, -29.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[1, -33], [7, -36.6], [7, -29.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(circle(0, -33, 1.6), P.teamShade, 'cloth');
    g.mat(path([[-1, -32], [-3, -24, 1], [-1, -25], [1, -32]]), P.teamShade, 'cloth', { lod: 1 });
  });
  F.part('bag', { bone: 'hip', z: 21, zb: 21 }, (g) => {
    g.mat(rrect(-12, -30, 6, 5, 1.4), '#f4ecd8', 'cloth', { lod: 1 });
    g.stroke(polyline([[-11, -28], [-7, -28]]), '#3a3a3a', 0.4, { lod: 2 });
  });

  // ───────── Kopf: Wimpern, runder Mund, Diadem ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -62], [3, -65], [12, -61.6], [13.4, -54], [11.4, -47.6], [5.6, -45], [-0.6, -46.4], [-5.6, -51]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[9.6, -55.4, 2.2], [3, -55.4, 2]],
    iris: '#3a8a6a',
    lidColor: SKIN,
    lid: 0.2,
    brow: { color: '#c8a050', w: 0.8, lift: 0.6 },
    mouth: [7.6, -49.4, 3.4],
    mood: 'smile',
    attackMouth: 'oh',
    replace: {
      // summt mit geschlossenen Lidern und rundem Mund
      idle: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.2, { lw: 0.8 });
        eyeClosed(g, c.E2[0], c.E2[1], 2, { lw: 0.8 });
        for (const [x, y] of [[11.8, -55.6], [5, -55.6]]) g.stroke(polyline([[x, y], [x + 1, y + 0.8]]), INK, 0.5, { lod: 1 });
        g.fill(ellipse(7.6, -49.2, 1.1, 1.3), '#a84a5a', { stroke: INK, lw: 0.5 });
      },
      // ein Auge weit offen beim Zielen
      attack: (g, c) => {
        eyeClosed(g, c.E2[0], c.E2[1], 2, { lw: 0.8 });
        eye(g, c.E1[0], c.E1[1], { ...c.EYE, r: 2.6, look: [0.9, 0] });
        g.fill(ellipse(7.6, -49.2, 1, 1.1), '#a84a5a', { stroke: INK, lw: 0.5 });
      },
    },
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front', lod: 1 }, (g) => g.fill(ellipse(11.6, -51, 2, 1.2), '#f8a0a0', { op: 0.5 }));
  F.part('hair', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-7, -54], [-6.4, -61], [0, -66], [8, -66], [13.4, -61], [9, -61], [3, -59.6], [-2, -57]]), HAIR, 'hair', { hi: 0.5 });
  });
  F.part('hairBack', { bone: 'head', z: 33.6, view: 'back' }, (g) => {
    g.mat(path([[-6, -62], [13.4, -62], [13, -52], [6, -46], [-1, -47], [-6, -52]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('bunF', { bone: 'head', z: 35, zb: 6 }, (g) => {
    g.mat(circle(12, -62.6, 4.6), HAIR, 'hair', { hi: 0.5 });
    g.stroke(spline(arc(12, -62.6, 2.8, 2.8, 0, 300, 10)), '#d8b450', 0.6, { lod: 1 });
  });
  F.part('diadem', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-3, -64], [3, -68, 1], [9, -64], [8, -62.6], [3, -64.6], [-2, -62.6]]), GOLD, 'gold');
  });
  F.part('diademStone', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(poly([[3, -69.6], [4.6, -67.6], [3, -65.6], [1.4, -67.6]]), P.team, 'gem', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Harfenbogen (Signature): Goldrahmen in Lyraform, fünf Saiten, Griff aus Perlmutt ─────────
  F.part('harp', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    const L = [[13, -38], [10, -46], [10.6, -56], [14, -64]];
    const R = [[15, -38], [20, -46], [21, -56], [18, -64]];
    g.stroke(spline(L), GOLD, 2.2);
    g.stroke(spline(R), GOLD, 2.2);
    g.stroke(spline([[12, -38], [10, -30], [11, -22], [14, -16]]), GOLD, 2.2);
    g.stroke(spline([[16, -38], [20, -30], [21, -22], [18, -16]]), GOLD, 2.2);
    g.stroke(polyline([[12.6, -65], [19.4, -65]]), GOLD, 2);
    g.stroke(polyline([[13, -15.4], [19, -15.4]]), GOLD, 2);
    for (let i = 0; i < 5; i++) {
      const x = 13.4 + i * 1.3;
      if (i !== 2) g.stroke(polyline([[x, -64], [x, -16.4]]), MINT, 0.45);
    }
    g.mat(rrect(12.4, -40.6, 5, 5.2, 1.6), PEARL, 'gem', { hi: 0.8 });
    g.mat(circle(16, -66, 1.6), GOLD, 'gold');
  });
  F.part('midString', { bone: 'prop', z: 38.5, zb: 4.5, state: ['idle', 'walk', 'hit', 'spawn', 'death', 'stun', 'charge', 'sleep'] }, (g) => g.stroke(polyline([[16, -64], [16, -16.4]]), MINT, 0.6));
  F.part('drawnString', { bone: 'prop', z: 38.5, zb: 4.5, state: ['attack'], glow: true }, (g) => g.stroke(polyline([[16, -64], [8, -40], [16, -16.4]]), '#ffb347', 0.9));
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(circle(8, -47, 4.4), DRESS, 'cloth');
    g.mat(limb(9, -45, 13.4, -39, 2.6, 2.4), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(14, -37.6, 2.4), SKIN, 'skin'));
  emblem(F, 'emblem', 'skirt', 19, -8, -18, 2.6, { zb: 19 });

  // ───────── Evolution (Frost): eisblaue Saiten, Kristall-Diadem, Pelzbesatz ─────────
  F.part('evoFur', { bone: 'skirt', z: 18.5, evo: 'evo' }, (g) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([-22 + i * 3.7, -2 - (i % 2 ? 3.4 : 1.6)]);
    g.mat(path([[-22, -2], ...pts, [22, -2], [22, 0], [-22, 0]]), '#f4f8fc', 'fur');
  });
  F.part('evoCrystal', { bone: 'hat', z: 37, evo: 'evo' }, (g) => {
    for (const [x, h] of [[0, 5], [3, 8], [6, 5]]) g.mat(poly([[x - 1.4, -65], [x, -65 - h], [x + 1.4, -65]]), '#bfeaff', 'glass', { hi: 1 });
  });
  F.part('evoStrings', { bone: 'prop', z: 38.6, zb: 4.6, evo: 'evo', glow: true }, (g) => {
    for (let i = 0; i < 5; i++) g.stroke(polyline([[13.4 + i * 1.3, -64], [13.4 + i * 1.3, -16.4]]), '#9ad8ff', 0.5);
  });

  F.anim({
    // zupft eine Saite und lauscht; Kleid schwingt
    idle: { p: { breathe: 0.025, bob: 0.6, sway: 1.5, tilt: 4, skirt: 3 }, keys: { armB: { r: [[0, 0], [0.4, 0], [0.5, -60], [0.6, -50], [0.7, 0]] } } },
    // trippelt, das Kleid wogt
    walk: { p: { stride: 8, bob: 2, armSwing: 3, skirt: 5 } },
    // zieht die mittlere Saite weit nach hinten, lässt los
    attack: {
      prog: 'atk.shoot',
      hit: 0.62,
      p: { armFAim: -70, armBAim: -74, propAim: 70, handBAim: 74, draw: 6, recoil: 2, kick: 4, aimHead: 2 },
      keys: { layer: [[0, 0.7, 'armB', 43, 43], [0, 0.7, 'handB', 44, 44], [0, 0.7, 'fireArrow', 45, 45]] },
      ev: { release: 0.62 },
    },
    // hält das Diadem fest
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { skirt: { sx: [[0, 1], [0.2, 1.08], [1, 1]] }, armB: { r: [[0, 0], [0.2, -150], [1, 0]] } } },
    // landet wie ein Fallschirm mit gebauschtem Kleid
    spawn: { keys: { skirt: { sx: [[0, 1.25], [0.5, 1.2], [0.7, 1]] } } },
    // sinkt elegant zusammen
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], torso: { y: [[0, 0], [0.6, 18, 'in']], r: [[0, 0], [0.6, -20]] }, skirt: { sy: [[0, 1], [0.6, 0.55]], sx: [[0, 1], [0.6, 1.2]] }, alpha: [[0, 1], [0.7, 1], [1, 0]] } },
  });
}
