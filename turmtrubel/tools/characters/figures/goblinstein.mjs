// Goblinstein – größenwahnsinniger Kobold-Doktor im Laborkittel mit Schweißerbrille und Fernsteuerkasten mit Blitzantenne
// (Brief: docs/briefs/goblinstein.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinstein(F) {
  const P = F.pal;
  const COAT = P.main;
  const VOLT = P.acc;
  const SKIN = '#8fbf6a';
  const SKIN_D = '#6a9a4a';
  const BOX = '#5a5f6b';
  const LENS = '#9ff0ff';
  const HAIR = '#d8d8e0';
  const GLOVE = '#e8c040';
  const COAT_D = '#c8ccd2';

  F.rig('biped', {
    hip: [0, -36],
    torso: [0, -39],
    head: [4, -69],
    hat: [4, -84],
    armB: [-9, -64],
    handB: [8, -50],
    armF: [12, -64],
    handF: [20, -50],
    prop: [14, -52],
    legB: [-5, -36],
    footB: [-6, -8],
    legF: [5, -36],
    footF: [6, -8],
    cape: [-2, -64],
  });

  // ───────── Kittel hinten (Schöße) ─────────
  F.part('coatTail', { bone: 'cape', z: 3, zb: 46 }, (g) => {
    g.mat(path([[-11, -62], [6, -62], [10, -36], [12, -12], [4, -10], [0, -14], [-6, -9], [-16, -11], [-14, -36]]), COAT_D, 'cloth');
    g.lod(1, (h) => {
      h.fill(circle(-10, -20, 1.6), '#3a3a40', { op: 0.6 });
      h.stroke(polyline([[-16, -11], [-13, -14], [-11, -10]]), '#9aa0a8', 0.6);
    });
  });

  // ───────── Beine, Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -38, x * 1.1, -14, 4.4, 4), SKIN_D, 'skin'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.6, -16], [fx + 4.4, -16], [fx + 4.6, -7], [fx + 10, -3.6], [fx + 10.4, 0, 1], [fx - 5.4, 0, 1], [fx - 5.6, -7]]), '#3a3440', 'leather', { hi: 0.5 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm (hält den Kasten von unten) ─────────
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => g.mat(limb(-9, -64, 6, -51, 4.6, 4.2), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(8, -49, 3.2), GLOVE, 'leather'));

  // ───────── Laborkittel mit Brandlöchern, Schürze ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-10, -66], [-2, -68.6], [8, -68.6], [12, -66], [13, -48], [13, -30], [16, -10], [8, -9], [3, -24], [-2, -24], [-6, -9], [-15, -10], [-12.6, -30], [-12, -48]]);
    g.mat(c, COAT, 'cloth');
    g.stroke(polyline([[2, -68], [2, -26]]), COAT_D, 0.8, { lod: 1 });
    g.lod(1, (h) => {
      h.fill(circle(-7, -44, 1.4), '#4a4440');
      h.fill(circle(10, -20, 1.2), '#4a4440');
      h.stroke(polyline([[-12, -30], [-9, -28], [-11, -24]]), '#9aa0a8', 0.6);
      // Kugelschreiber in der Brusttasche
      h.mat(rrect(-7, -62, 7, 6, 1), COAT_D, 'cloth');
      h.mat(rrect(-4.6, -66, 1.4, 5, 0.6), '#3a6ad8', 'cloth');
    });
  });

  // ───────── Kopf: Koboldgesicht, Ohren, Haarbüschel, Schweißerbrille ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 34 }, (g) => {
    g.mat(path([[-4, -74], [-20, -82, 1], [-17, -76], [-5, -69]]), SKIN_D, 'skin');
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -80], [4, -84], [14, -81], [17, -72], [15.6, -64], [9, -60], [1, -61], [-5, -67]]), SKIN, 'skin');
  });
  F.part('hairTufts', { bone: 'head', z: 29, zb: 35 }, (g) => {
    for (const [x, y, a] of [[-4, -80, -150], [0, -84, -120], [6, -85, -90], [11, -84, -60], [-7, -76, -170]]) {
      const r = (a * Math.PI) / 180;
      g.mat(path([[x - 2, y + 1], [x + Math.cos(r) * 8, y + Math.sin(r) * 8, 1], [x + 2, y + 1]]), HAIR, 'hair');
    }
  });
  faceSet(F, {
    eyes: [[12, -73, 3.2], [3.8, -73, 3]],
    iris: '#c83a2a',
    lidColor: SKIN,
    lid: 0,
    irisR: 0.5,
    look: [0.5, 0],
    brow: false,
    mouth: [9, -64, 7],
    mood: 'grin',
    attackMouth: 'grin',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[7.4, -70], [19, -66.6, 1], [9.6, -65.6]]), SKIN, 'skin', { line: SKIN_D, lw: 0.7 });
  });
  F.part('teeth', { bone: 'head', z: 33.5, view: 'front', expr: ['idle', 'attack', 'ability'] }, (g) => {
    for (const x of [6.6, 9, 11.4]) g.fill(path([[x - 1, -65.2], [x + 1, -65.2], [x, -62.8, 1]]), WHITE, { lod: 1 });
  });
  F.part('goggles', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(rrect(-6, -76, 23, 4.2, 1.6), P.team, 'leather', { line: P.teamDeep });
  });
  F.part('lenses', { bone: 'head', z: 34.5, view: 'front' }, (g) => {
    for (const [x, r] of [[12, 4.8], [3.8, 4.4]]) {
      g.mat(circle(x, -73, r), '#5a5f6b', 'metal');
      g.mat(circle(x, -73, r - 1.4), LENS, 'glass', { op: 0.4, line: '0' });
    }
    g.fill(ellipse(10.6, -74.8, 1.4, 0.7, -30), '#ffffff', { op: 0.8, lod: 1 });
  });
  F.part('earF', { bone: 'head', z: 35, zb: 29 }, (g) => {
    g.mat(path([[13, -76], [27, -84, 1], [24, -77], [15, -71]]), SKIN, 'skin');
    g.fill(path([[16, -75], [23, -80], [21, -76]]), SKIN_D, { lod: 1 });
  });
  F.part('armband', { bone: 'armF', z: 40.5, zb: 6.5, team: true }, (g) => {
    g.mat(rrect(11.6, -61, 8, 3.4, 1).rot(50, 15.6, -59.4), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Fernsteuerkasten mit Blitzantenne (Signature) ─────────
  F.part('box', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.mat(rrect(3, -58, 22, 14, 2), BOX, 'metal');
    rivets(g, [[5, -56], [23, -56], [5, -46], [23, -46]], 0.7, '#9aa0a8');
    // Hebel und Knöpfe
    g.stroke(polyline([[9, -58], [7, -64]]), '#2a2a30', 1.2);
    g.mat(circle(7, -64.6, 1.6), '#c83a2a', 'gem');
    g.stroke(polyline([[15, -58], [17, -64]]), '#2a2a30', 1.2);
    g.mat(circle(17, -64.6, 1.6), '#3ac83a', 'gem');
    for (const [x, c] of [[8, '#e8c040'], [12, '#3a8ad8'], [16, '#e8e8e8']]) g.mat(circle(x, -50, 1.4), c, 'gem', { lod: 1 });
    // Teleskopantenne
    g.stroke(polyline([[21, -58], [23, -80]]), '#9aa0a8', 1.6);
    g.stroke(polyline([[23, -80], [24.6, -100]]), '#b8c0c8', 1.1);
    g.mat(circle(24.8, -102, 2.4), VOLT, 'gem');
  });
  F.part('spark', { bone: 'prop', z: 39, state: ['cast', 'ability'], glow: true }, (g) => {
    g.fill(circle(24.8, -102, 7), VOLT, { op: 0.5 });
    g.stroke(polyline([[24.8, -102], [30, -108], [27, -110], [34, -116]]), '#e0d0ff', 1.2);
    g.stroke(polyline([[24.8, -102], [18, -108], [21, -111], [16, -116]]), '#e0d0ff', 1);
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(limb(12, -64, 18.6, -51, 4.6, 4.2), COAT, 'cloth');
    g.fill(path([[16, -55], [20.6, -54], [19.6, -50], [16, -51]]), '#4a4440', { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(20, -49, 3.2), GLOVE, 'leather'));
  emblem(F, 'emblem', 'torso', 24, -6, -42, 2.2, { zb: 24 });

  F.anim({
    // drückt Knöpfe am Kasten, die Antenne funkt
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 3 }, keys: { handF: { y: [[0, 0], [0.2, 1.4], [0.3, 0], [0.5, 1.4], [0.6, 0]] }, show: { cast: [[0.7, 0.78]] } } },
    // eiliger, gebückter Gang
    walk: { p: { stride: 22, bob: 2.4, armSwing: 2, lean: 8 }, keys: { cape: { r: [[0, 6], [0.5, 12], [1, 6]] } }, ev: { step: [0.25, 0.75] } },
    // reckt die Antenne, Blitz auf das Ziel
    attack: { prog: 'atk.cast', hit: 0.55, p: { wind: -40, strike: -60, windB: -40, strikeB: -60, lean: 4, lunge: 6 }, keys: { prop: { r: [[0, 0], [0.4, -10], [0.55, 6], [1, 0]] } }, ev: { release: 0.55 } },
    // Blitzverbindung: stemmt den Kasten hoch und dreht beide Hebel
    ability: { prog: 'atk.cast', hit: 0.6, p: { wind: -90, strike: -110, windB: -90, strikeB: -110 }, ev: { ability: 0.6 } },
    hit: { p: { knock: 2, recoil: 6 } },
    // Kasten explodiert in seinen Händen
    death: { p: { dir: -1, angle: 76 }, keys: { show: { cast: [[0, 0.3]] } } },
  });
}
