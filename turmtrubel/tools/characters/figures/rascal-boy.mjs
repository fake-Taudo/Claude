// Rabauke – großspuriger Junge in Kartonrüstung mit Klebeband, Topfdeckel-Schild und Holzschwert
// (Brief: docs/briefs/rascal-boy.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function rascalBoy(F) {
  const P = F.pal;
  const CARD = P.main;
  const SHORTS = P.acc;
  const TAPE = '#c8ccd2';
  const LID = '#9aa3ad';
  const SKIN = '#f0c090';
  const HAIR = '#c87a2a';
  const WOOD = '#c89a5a';
  const CARD_D = '#a8844a';
  const SHOE = '#e8e4dc';

  F.rig('biped', {
    hip: [0, -28],
    torso: [0, -31],
    head: [3, -62],
    hat: [3, -78],
    armB: [-17, -58],
    handB: [-21, -40],
    propB: [-21, -40],
    armF: [17, -58],
    handF: [22, -42],
    legB: [-7, -24],
    footB: [-8, -7],
    legF: [7, -24],
    footF: [8, -7],
  });

  // ───────── Beine: kurze Hose, Turnschuhe ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -26, x * 1.1, -8, 5.2, 4.6), x < 0 ? '#d8a878' : SKIN, 'skin');
      g.lod(1, (h) => h.fill(circle(x * 1.06 + 1, -15, 1.4), '#e88a7a', { op: 0.6 }));
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 5, -9], [fx + 4, -9], [fx + 10.4, -4], [fx + 10.6, 0, 1], [fx - 6, 0, 1], [fx - 6.2, -5]]), SHOE, 'cloth');
      g.mat(rrect(fx - 6.4, -1.8, 17.2, 1.8, 0.8), '#c84a3a', 'cloth', { lod: 1 });
      g.stroke(polyline([[fx - 1, -7.6], [fx + 3, -5.4]]), '#c84a3a', 0.8, { lod: 1 });
    });
  };
  leg('legB', 'footB', -7, 6);
  leg('legF', 'footF', 7, 8);
  F.part('shorts', { bone: 'hip', z: 15, zb: 15 }, (g) => {
    g.mat(path([[-13, -32], [13, -32], [14, -20], [3, -19], [0, -23], [-3, -19], [-14, -20]]), SHORTS, 'cloth');
  });

  // ───────── Holzschwert im hinteren Arm ─────────
  F.part('sword', { bone: 'propB', z: 9, zb: 44 }, (g) => {
    g.mat(path([[-23, -42], [-19, -42.6], [-23.6, -74, 1], [-26, -77, 1], [-27.6, -73]]), WOOD, 'wood');
    g.stroke(polyline([[-21.6, -44], [-25, -72]]), '#a87a3a', 0.6, { lod: 1 });
    g.mat(rrect(-28, -45, 13, 3.2, 1), '#8a5a2a', 'wood');
    g.mat(rrect(-23, -42, 4, 7, 1), '#5a3a20', 'leather');
    g.lod(1, (h) => h.stroke(polyline([[-24, -60], [-21, -58]]), '#8a6a3a', 0.5));
  });
  F.part('armB', { bone: 'armB', z: 10, zb: 45 }, (g) => g.mat(limb(-17, -58, -20.6, -43, 5, 4.4), '#d8a878', 'skin'));
  F.part('handB', { bone: 'handB', z: 11, zb: 46 }, (g) => g.mat(circle(-21, -40, 3.2), '#d8a878', 'skin'));

  // ───────── Kartonrüstung mit Klebeband (Signature) ─────────
  const box = path([[-18, -62], [17, -63], [19, -30], [-18, -29]]);
  F.part('armor', { bone: 'torso', z: 20, zb: 20, sig: true }, (g) => {
    g.mat(box, CARD, 'cloth', { hi: 0.25 });
    // eingedrückte Ecke, Wellpappen-Kante, Aufdruck (Pfeile „oben“)
    g.fill(poly([[17, -63], [19, -55], [12.6, -60]]), CARD_D, { lod: 1 });
    g.lod(1, (h) => {
      h.stroke(polyline([[-18, -46], [19, -46.4]]), CARD_D, 0.7);
      for (const x of [-12, -7]) {
        h.stroke(polyline([[x, -36], [x, -42]]), '#5a4a3a', 0.8);
        h.stroke(polyline([[x - 2, -40], [x, -42.4], [x + 2, -40]]), '#5a4a3a', 0.8);
      }
      h.stroke(rrect(4, -40, 9, 6, 0.6), '#5a4a3a', 0.6);
    });
  });
  F.part('tape', { bone: 'torso', z: 21, zb: 21, team: true }, (g) => {
    g.mat(path([[-18, -55], [17.4, -57], [17.6, -53], [-18, -51]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6, hi: 0.5 });
    g.mat(path([[-3, -63], [1, -63], [2, -29], [-2, -29]]), TAPE, 'cloth', { hi: 0.6 });
    g.mat(path([[8, -46], [16, -38], [14, -36], [6, -44]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5, hi: 0.5 });
  });
  F.part('shoulderBoxB', { bone: 'armB', z: 12, zb: 47 }, (g) => g.mat(rrect(-25, -64, 13, 10, 1), CARD_D, 'cloth'));

  // ───────── Kopf mit Kappe ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-8, -74], [4, -77.6], [15, -73.6], [17, -64], [14.4, -56], [6, -52.6], [-2, -54.6], [-7.6, -61]]), SKIN, 'skin');
    g.mat(ellipse(-7.4, -64, 2.6, 3.4), SKIN, 'skin', { lod: 1 });
  });
  faceSet(F, {
    eyes: [[11.6, -65.4, 2.5], [3.6, -65.4, 2.3]],
    iris: '#3a6a3a',
    lidColor: SKIN,
    lid: 0.3,
    brow: { color: HAIR, w: 1.6, lift: 0.4 },
    idleTilt: 0.3,
    mouth: [9.4, -57.8, 6],
    mood: 'grin',
    attackMouth: 'shout',
    idle: (g) => {
      // Zahnlücke
      g.fill(rrect(8.6, -58.8, 1.6, 1.6, 0.2), '#4a1c24', { lod: 1 });
    },
  });
  F.part('freckles', { bone: 'head', z: 33.2, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[13, -61], [14.4, -60.4], [2.4, -61], [4, -60.4]]) g.fill(circle(x, y, 0.5), '#c8784a');
    g.mat(rrect(12, -63, 4, 1.8, 0.6).rot(-20, 14, -62), '#efdcb6', 'cloth');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.6, -61.6, 1.8, 1.5), '#e8a882', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  F.part('hair', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-9, -66], [-10, -72], [-6, -76], [-12, -70.6], [-8, -64]]), HAIR, 'hair');
  });
  F.part('cap', { bone: 'hat', z: 35, zb: 35, team: true }, (g) => {
    g.mat(path([[-9.6, -70, 1], [-8, -78], [0, -83.6], [10, -83], [17, -77], [17.6, -70, 1]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[13, -72], [27, -71], [27.6, -68.6], [14, -68.6]]), P.teamDeep, 'cloth');
    g.mat(circle(4, -83.4, 1.4), P.symbol, 'cloth', { lod: 1 });
    // Haarbüschel unter der Kappe
    g.mat(path([[-12, -70], [-15, -66, 1], [-11, -67], [-13, -62, 1], [-8.6, -66]]), HAIR, 'hair');
  });

  // ───────── Topfdeckel als Schild ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(17, -58, 21, -44, 5, 4.4), SKIN, 'skin'));
  F.part('shoulderBoxF', { bone: 'armF', z: 39, zb: 7 }, (g) => g.mat(rrect(11, -64, 13, 10, 1), CARD, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 5 }, (g) => g.mat(circle(22, -41.6, 3.2), SKIN, 'skin'));
  F.part('lid', { bone: 'handF', z: 42, zb: 4 }, (g) => {
    g.mat(ellipse(26, -41, 10.6, 12), LID, 'metal', { hi: 0.95 });
    g.stroke(ellipse(26, -41, 8.4, 9.6), '#6d7682', 0.7, { lod: 1 });
    g.mat(rrect(23, -43.4, 6.4, 4.8, 1.6), '#2e2a2a', 'leather');
    g.lod(1, (h) => h.fill(ellipse(22.4, -47, 2.4, 1.4, -30), '#ffffff', { op: 0.7 }));
  });
  emblem(F, 'emblem', 'handF', 43, 26, -33.6, 2.2, { zb: 3 });

  F.anim({
    // wedelt mit dem Holzschwert
    idle: { p: { breathe: 0.03, bob: 1, sway: 3 }, keys: { armB: { r: [[0, 0], [0.2, -40], [0.3, -20], [0.4, -45], [0.5, -20], [0.6, 0]] } } },
    // großspuriger Gang
    walk: { p: { stride: 26, bob: 3.6, armSwing: 10, lean: -2 }, ev: { step: [0.25, 0.75] } },
    // Holzschwert-Kloppe von oben
    attack: { prog: 'atk.swing', hit: 0.55, p: { arm: 'B', wind: 160, strike: 290, over: 8, end: 360, cock: 90, snap: 200, handEnd: 360, lean: 6, lunge: 12 }, keys: { layer: [[0.3, 0.95, 'sword', 44, 44], [0.3, 0.95, 'armB', 45, 45], [0.3, 0.95, 'handB', 46, 46]] } },
    // Karton beult ein
    hit: { p: { knock: 3, recoil: 7 }, keys: { torso: { sx: [[0, 1], [0.2, 0.9], [1, 1]] } } },
    spawn: { keys: { armB: { r: [[0, 0], [0.6, 0], [0.8, -140], [1, -120]] } } },
    // Karton fällt auseinander
    death: { p: { dir: 1, angle: 70 } },
  });
}
