// Little Prince – verwöhnter Kinderprinz im Samtmantel, dem die riesige Krone über die Augen rutscht; Repetier-Armbrust
// mit Trommel und Kurbel (Brief: docs/briefs/little-prince.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { faceSet, eye, eyeClosed, brow, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function littlePrince(F) {
  const P = F.pal;
  const VELVET = P.main;
  const ERMINE = P.acc;
  const GOLD = '#f0c040';
  const HAIR = '#e6b84a';
  const SKIN = '#f6d2b4';
  const VELVET_D = '#1e6a66';
  const WOOD = '#8a5a32';

  F.rig(
    'biped',
    {
      hip: [0, -18],
      torso: [0, -20],
      head: [4, -33],
      hat: [4, -56],
      back: [-4, -28],
      armB: [-5, -31],
      handB: [7, -24],
      armF: [6, -31],
      handF: [15, -25],
      prop: [15, -25],
      legB: [-3, -18],
      footB: [-3, -3],
      legF: [3, -18],
      footF: [4, -3],
      cape: [-2, -32],
      crank: [18, -20],
      drum: [17, -31],
    },
    { crank: 'prop', drum: 'prop' },
  );

  // ───────── Umhang (Teamzone) ─────────
  F.part('cape', { bone: 'cape', z: 3, zb: 44, team: true }, (g) => {
    const c = path([[-7, -33], [4, -33], [2, -22], [-2, -10], [-10, -3], [-16, -5], [-12, -18], [-10, -28]]);
    g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-6, -30], [-11, -8]], [[-2, -30], [-4, -12]]], P.teamShade, 0.6, 1));
  });

  // ───────── Beine: Pluderhose, weiße Strümpfe, Schnallenschuhe ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -16, x * 1.05, -5, 2, 1.8), '#fbf7ef', 'cloth');
      // Pluderhose aus demselben Samt wie der Mantel
      g.mat(blob([[x - 4.6, -19], [x + 4.6, -19], [x + 5.2, -12.6], [x, -10.6], [x - 5.2, -12.6]], 0.6), VELVET, 'cloth', { hi: 0.45 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 2.6, -4], [x + 2.6, -4.4], [x + 6.4, -1.6], [x + 6.4, 0, 1], [x - 3, 0, 1]]), '#2a2030', 'leather', { hi: 0.6 });
      g.mat(rrect(x - 0.4, -4.4, 3.6, 2.6, 0.6), GOLD, 'gold');
    });
  };
  leg('legB', 'footB', -3, 6);
  leg('legF', 'footF', 3, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-5, -31, 6, -24.6, 2.4, 2), VELVET_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(7, -24, 2.2), SKIN, 'skin'));

  // ───────── Samtmantel mit Hermelinkragen ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    // Samtrock bis über die Pluderhose, Hermelinsaum unten
    const c = path([[-7, -32], [8, -32], [10, -22], [11.4, -11.6], [-9.6, -11.6], [-9, -22]]);
    g.mat(c, VELVET, 'cloth', { hi: 0.45 });
    g.clipTo(c, (h) => {
      h.fill(rrect(-10, -13.8, 22, 2.4, 0), ERMINE);
      for (const x of [-6, -2, 2, 6]) h.fill(ellipse(x, -12.6, 0.5, 0.9), '#1a1a22', { lod: 1 });
      h.stroke(polyline([[4, -32], [4, -16]]), GOLD, 0.6, { lod: 1 });
    });
  });
  F.part('collar', { bone: 'torso', z: 24, zb: 24 }, (g) => {
    g.mat(blob([[-7, -34], [9, -34], [10, -30], [2, -28.6], [-7, -30]], 0.7), ERMINE, 'cloth', { hi: 0.5 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-4, -31.6], [0, -30.6], [5, -31], [8, -32]]) h.fill(ellipse(x, y, 0.5, 0.9), '#1a1a22');
    });
  });
  // Trillerpfeife an der Kordel
  F.part('whistle', { bone: 'torso', z: 24.5, view: 'front' }, (g) => {
    g.stroke(spline([[-2, -32], [1, -27], [5, -28]]), '#c84a3a', 0.4);
    g.mat(rrect(4, -29.4, 3.6, 1.8, 0.8), GOLD, 'gold');
  });

  // ───────── Kopf: kugelrundes Kindergesicht, Schmollmund ─────────
  F.part('hairBack', { bone: 'head', z: 28, zb: 34 }, (g) => g.mat(blob([[-8, -50], [-9, -40], [-6, -34], [-2, -38], [0, -52]], 0.6), HAIR, 'hair'));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-7, -44], [-5, -54], [4, -58], [13, -55], [17, -46], [15, -37], [8, -33], [0, -33.6], [-6, -38]], 0.75), SKIN, 'skin', { hi: 0.3 });
    g.fill(ellipse(13, -40.6, 2.2, 1.4), '#f0a0a0', { op: 0.6, lod: 1 });
  });
  faceSet(F, {
    eyes: [[12, -45, 3.1], [5, -45, 2.8]],
    iris: '#3a6aa8',
    irisR: 0.55,
    lidColor: SKIN,
    lid: 0.1,
    look: [0.4, 0],
    brow: { color: '#c89a3a', w: 1, lift: 0.8 },
    mouth: [10, -37.6, 4],
    mood: 'frown',
    attackMouth: 'grit',
    idle: (g) => {
      // vorgeschobene Unterlippe
      g.fill(ellipse(10.4, -36.6, 1.8, 1), '#e88a8a', { stroke: INK, lw: 0.4 });
    },
    replace: {
      // getroffen: die Krone fällt über die Augen – nur der Mund bleibt sichtbar, empört offen
      hurt: (g) => g.fill(ellipse(10, -37, 1.8, 1.6), '#7a2a3a', { stroke: INK, lw: 0.6 }),
      // Tod: sitzt und weint
      death: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 3, { up: true, lw: 1 });
        eyeClosed(g, c.E2[0], c.E2[1], 2.6, { up: true, lw: 1 });
        for (const x of [12, 5]) g.fill(path([[x - 0.8, -42], [x + 0.8, -42], [x + 1, -38, 1], [x - 1, -38, 1]]), '#8ad0ff');
        g.fill(ellipse(10, -37, 2.4, 1.6), '#7a2a3a', { stroke: INK, lw: 0.6 });
      },
    },
  });
  F.part('bangs', { bone: 'head', z: 33, zb: 31 }, (g) => {
    g.mat(path([[-7, -46], [-6, -54], [4, -58.6], [14, -55], [16, -50], [12, -51], [9, -49, 1], [6, -51], [2, -49, 1], [-2, -51], [-4, -46]]), HAIR, 'hair', { hi: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 33.5, view: 'back' }, (g) => g.mat(blob([[-7, -52], [15, -52], [16, -42], [9, -34], [-1, -35], [-7, -42]], 0.6), HAIR, 'hair'));

  // ───────── Riesige Krone mit Samtkissen (Signature, Kissen = Teamzone), leicht nach vorn gekippt ─────────
  F.part('cushion', { bone: 'hat', z: 34.5, zb: 34.5, team: true }, (g) => {
    g.mat(blob([[-9, -60], [-4, -70], [5, -73], [15, -69], [20, -60]], 0.7).rot(8, 5, -56), P.team, 'cloth', { line: P.teamDeep, hi: 0.5 });
    g.mat(circle(5, -73, 1.8).rot(8, 5, -56), GOLD, 'gold');
  });
  F.part('crown', { bone: 'hat', z: 35, zb: 35, sig: true }, (g) => {
    const pts = [[-11, -52], [21, -52], [21, -58]];
    // fünf Zacken
    const tips = [[20, -70], [14, -62], [10, -72], [5, -62], [0, -72], [-4, -62], [-9, -70]];
    const c = path([...pts, ...tips.map((p, i) => (i % 2 ? p : [...p, 1])), [-11, -58]]).rot(8, 5, -56);
    g.mat(c, GOLD, 'gold', { hi: 0.9 });
    g.clipTo(c, (h) => {
      h.fill(rrect(-12, -56, 34, 3, 0).rot(8, 5, -56), '#c8962a');
      // Delle vom Herunterfallen
      h.fill(ellipse(15, -60, 2, 1.2, 30).rot(8, 5, -56), '#b8862a', { lod: 1 });
    });
    g.lod(1, (h) => {
      for (const [x, y, c2] of [[0, -54.4, '#c83a4a'], [8, -54.4, '#3a8ac8'], [16, -54.4, '#c83a4a']]) h.fill(circle(x, y, 1.2).rot(8, 5, -56), c2);
      for (const [x, y] of [[20, -70], [10, -72], [0, -72], [-9, -70]]) h.fill(circle(x, y - 1, 1.1).rot(8, 5, -56), '#fff4c0');
    });
  });

  // ───────── Repetier-Armbrust mit Trommelmagazin und Handkurbel ─────────
  F.part('crossbow', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[4, -27], [28, -28], [28, -25], [12, -24.4], [8, -21], [4, -22]]), WOOD, 'wood', { hi: 0.5 });
    g.mat(path([[27, -38], [29, -38], [31, -27], [29, -16], [27, -16], [28.6, -27]]), '#5a3a22', 'wood');
    g.stroke(polyline([[28, -37], [21, -27], [28, -17]]), '#e8e0d0', 0.4);
    g.mat(rrect(18, -28.6, 12, 1.4, 0.6), '#d8c8a8', 'wood', { lod: 1 });
  });
  F.part('drum', { bone: 'drum', z: 38.5, zb: 4.5 }, (g) => {
    g.mat(circle(17, -31, 4.4), GOLD, 'gold', { hi: 0.8 });
    g.mat(circle(17, -31, 1.4), '#8a5a2a', 'wood');
    g.lod(1, (h) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        h.fill(circle(17 + Math.cos(a) * 3, -31 + Math.sin(a) * 3, 0.6), '#8a5a2a');
      }
    });
  });
  F.part('crank', { bone: 'crank', z: 39, zb: 5 }, (g) => {
    g.mat(rrect(17.4, -21, 1.6, 6, 0.6), '#9aa3ad', 'metal');
    g.mat(rrect(16, -15.6, 4.4, 1.8, 0.8), '#c84a3a', 'wood');
  });
  F.part('muzzle', { bone: 'prop', z: 39.5, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[31, -30], [38, -27.4], [31, -25]]), '#fff4c8', { op: 0.9 });
    for (const [x, y] of [[34, -31], [36, -24]]) g.fill(circle(x, y, 0.8), '#ffe08a');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(6, -31, 14, -25.6, 2.4, 2), VELVET, 'cloth'));
  F.part('cuff', { bone: 'armF', z: 29.5, zb: 6.5 }, (g) => g.mat(ellipse(13, -26, 2.2, 2.8, 30), ERMINE, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(15, -25, 2.2), SKIN, 'skin'));
  F.part('whistleRings', { bone: 'head', z: 42, state: 'ability', glow: true }, (g) => {
    for (const r of [4, 7, 10]) g.stroke(spline(arc(16, -38, r, r, -50, 50, 6)), '#fff4c8', 0.9, { op: 0.9 });
  });
  emblem(F, 'emblem', 'torso', 25, -3, -22, 1.7, { zb: 25 });

  F.anim({
    // schiebt die Krone hoch, stampft; die Krone rutscht wieder herunter
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 2, tilt: 3 },
      keys: {
        hat: { y: [[0, 0], [0.2, -3, 'out'], [0.6, -3], [0.85, 1.6, 'in'], [1, 0]], r: [[0, 0], [0.6, 0], [0.85, 6], [1, 0]] },
        armB: { r: [[0, 0], [0.1, -140], [0.25, -140], [0.35, 0]] },
        legF: { r: [[0, 0], [0.5, 0], [0.58, -20], [0.66, 0], [0.74, -20], [0.82, 0]] },
      },
    },
    // wichtiger Watschelgang mit erhobener Nase
    walk: { p: { stride: 18, bob: 1.6, armSwing: 4, lean: -4 }, keys: { root: { r: [[0, -5], [0.5, 5], [1, -5]] }, head: { r: [[0, -8], [1, -8]] } } },
    // kurbelt, Bolzen fliegt
    attack: { prog: 'atk.shoot', hit: 0.6, p: { armFAim: -10, armBAim: -10, propAim: 10, recoil: 1.6, kick: 3, aimHead: 2, flash: 0.15 }, keys: { crank: { r: [[0, 0], [0.6, 720]] }, drum: { r: [[0, 0], [0.6, 120]] } }, ev: { release: 0.6 } },
    // die Krone fällt über die Augen
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { hat: { y: [[0, 0], [0.2, 9, 'in'], [1, 9]] } } },
    // plumpst herunter, die Krone springt hoch und landet schief
    spawn: { keys: { hat: { y: [[0, 0], [0.4, -16, 'out'], [0.75, 0, 'in']], r: [[0, 0], [0.75, 14], [1, 10]] } } },
    // setzt sich hin und weint, die Krone rollt davon
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        root: { y: [[0, 0], [0.35, 8, 'in']] },
        legF: { r: [[0, 0], [0.35, -80]] },
        legB: { r: [[0, 0], [0.35, -70]] },
        armF: { r: [[0, 0], [0.4, 30]] },
        head: { r: [[0, 0], [0.4, 10], [0.5, 4], [0.6, 10], [0.7, 4]] },
        hat: { x: [[0, 0], [0.3, 0], [1, 22, 'out']], y: [[0, 0], [0.3, 0], [0.6, 30], [1, 34]], r: [[0, 0], [0.3, 0], [1, 260]] },
        alpha: [[0, 1], [0.7, 1], [1, 0]],
      },
    },
    // Königliche Rettung: pfeift mit der Trillerpfeife und zeigt nach vorn
    ability: { prog: 'still', keys: { armB: { r: [[0, 0], [0.2, -60], [1, -60]] }, armF: { r: [[0, 0], [0.3, -45], [1, -45]] }, prop: { r: [[0, 0], [0.3, 45], [1, 45]] }, head: { r: [[0, 0], [0.3, -8], [1, -8]] }, expr: [[0, 1, 'attack']] }, ev: { ability: 0.6 } },
  });
}
