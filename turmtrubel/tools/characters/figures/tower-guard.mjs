// Turmwache – strenge Späherin auf den Prinzessinnentürmen mit Eiben-Langbogen und Messing-Signalhorn
// (Brief: docs/briefs/tower-guard.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function towerGuard(F) {
  const P = F.pal;
  const LODEN = P.main;
  const LINEN = P.acc;
  const BRASS = '#d0a040';
  const YEW = '#7a4a2a';
  const SKIN = '#f0c09a';
  const HAIR = '#6a3a22';
  const LODEN_D = '#5e6c4e';

  F.rig('biped', {
    hip: [0, -24],
    torso: [0, -26],
    head: [3, -46],
    hat: [3, -60],
    back: [-6, -40],
    armB: [-8, -42],
    handB: [-10, -28],
    armF: [8, -42],
    handF: [11, -30],
    prop: [11, -30],
    legB: [-4, -23],
    footB: [-4, -5],
    legF: [4, -23],
    footF: [5, -5],
  });

  // ───────── Signalhorn am Schulterriemen (Signature), Wimpel = Teamzone ─────────
  F.part('horn', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.stroke(spline([[-4, -44], [-14, -46], [-20, -40], [-18, -32]]), BRASS, 2.4);
    g.mat(path([[-21, -34], [-15, -34], [-13, -28, 1], [-23, -28, 1]]), BRASS, 'gold', { hi: 0.8 });
    g.fill(ellipse(-18, -28.4, 4.6, 1), '#6a4a14', { lod: 1 });
    g.mat(rrect(-6, -45.6, 3, 3, 1), '#9a7a2a', 'gold');
    g.lod(1, (h) => h.fill(ellipse(-15, -45, 1.6, 0.8), '#8a6a1a', { op: 0.6 }));
  });
  F.part('hornPennant', { bone: 'back', z: 3.5, zb: 46.5, team: true }, (g) => {
    g.mat(path([[-16, -45], [-22, -50], [-19, -46, 1], [-25, -45], [-17, -42.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('strap', { bone: 'torso', z: 22, view: 'front', lod: 1 }, (g) => g.stroke(polyline([[-8, -42], [8, -26]]), '#5a3a20', 1.2));

  // ───────── Beine: Wickelgamaschen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      const L = limb(x, -24, x * 1.1, -6, 4.4, 4);
      g.mat(L, LINEN, 'cloth');
      g.clipTo(L, (h) => {
        for (let y = -20; y < -6; y += 2.6) h.stroke(polyline([[x - 4, y + 1.4], [x + 4, y - 0.4]]), '#b8a880', 0.5, { lod: 1 });
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4, -6], [fx + 3.4, -6], [fx + 8, -2.6], [fx + 8.2, 0, 1], [fx - 4.6, 0, 1]]), '#4a3424', 'leather');
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 4, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-8, -42, -10, -30, 4, 3.6), LODEN_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-10.4, -27.4, 2.6), '#d8a47c', 'skin'));
  F.part('nockArrow', { bone: 'handB', z: 12, zb: 44, state: 'loaded' }, (g) => {
    g.stroke(polyline([[-10, -27.4], [10, -27.4]]), '#7a5532', 1.1);
    g.fill(poly([[10, -29], [13.4, -27.4], [10, -25.8]]), '#9aa3ad', { stroke: INK, lw: 0.4 });
    g.fill(poly([[-10, -27.4], [-12.6, -29.2], [-11.4, -27.4], [-12.6, -25.6]]), '#f0e8d8');
  });

  // ───────── Lodenwams mit Kapuzenkragen ─────────
  F.part('doublet', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const d = path([[-8, -43], [-2, -45], [6, -45], [9, -43], [10, -30], [11, -18], [-11, -18], [-10, -30]]);
    g.mat(d, LODEN, 'cloth');
    g.clipTo(d, (h) => {
      for (const [x, y] of [[-6, -38], [4, -36], [-3, -28], [6, -24], [-7, -22], [1, -40]]) h.fill(circle(x, y, 0.5), LODEN_D, { lod: 2 });
    });
    stitches(g, [[-11, -19.6], [11, -19.6]], LODEN_D, { step: 2, len: 0.9 });
    g.mat(rrect(-10.6, -27, 21.4, 3.2, 1), '#5a3a20', 'leather');
    g.mat(rrect(-1, -27.6, 3.6, 4.4, 0.8), BRASS, 'gold', { lod: 1 });
  });
  F.part('hood', { bone: 'torso', z: 24, zb: 24 }, (g) => {
    g.mat(path([[-10, -42], [-6, -47], [4, -48.4], [11, -46], [10, -41], [3, -42.6], [-4, -41]]), LODEN_D, 'cloth');
  });

  // ───────── Kopf mit Schirmkappe (Teamzone) ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -58], [3, -61], [12, -57.6], [13.6, -50], [11.6, -43.6], [6, -40.6], [-1, -42], [-5.6, -47]]), SKIN, 'skin');
  });
  F.part('hair', { bone: 'head', z: 29, zb: 33 }, (g) => g.mat(path([[-7, -54], [-8, -46], [-5, -42], [-3, -48]]), HAIR, 'hair'));
  faceSet(F, {
    eyes: [[10, -51, 2], [3.6, -51, 1.8]],
    iris: '#4a5a3a',
    lidColor: SKIN,
    lid: 0.45,
    brow: { color: HAIR, w: 1.2, lift: 0.3 },
    idleTilt: 0.7,
    mouth: [8, -45, 3],
    mood: 'neutral',
    attackMouth: 'clench',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(7.8, -48, 1.4, 1.3), '#e0a882', 'skin', { line: '#b07a5c', lw: 0.5 }));
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-6, -58], [13.6, -58], [13.6, -50], [8, -43], [-1, -43.6], [-6, -49]]), HAIR, 'hair');
    g.mat(path([[-3, -48], [3, -47], [1, -40], [-2, -40]]), HAIR, 'hair', { lod: 1 });
  });
  F.part('cap', { bone: 'hat', z: 36, zb: 36, team: true }, (g) => {
    g.mat(path([[-6.6, -54, 1], [-5, -61], [2, -64.4], [9, -63], [13.4, -57], [13.6, -54, 1]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[10, -56], [21, -55], [21.4, -53], [10.6, -52.6]]), P.teamDeep, 'cloth');
    g.mat(circle(3.6, -64.4, 1.2), P.symbol, 'cloth', { lod: 1 });
  });

  // ───────── Eiben-Langbogen (höher als sie selbst) ─────────
  F.part('bow', { bone: 'prop', z: 41, zb: 13 }, (g) => {
    const bow = path([[8, -66], [11, -66.6, 1], [10, -63], [15, -48], [16, -30], [15, -12], [10, 4], [11, 6.6, 1], [8, 6], [12, 4], [13.4, -12], [14.4, -30], [13.4, -48], [10, -63]]);
    g.mat(bow, YEW, 'wood');
    g.mat(rrect(13.6, -33.4, 3.6, 6.4, 1.4), '#3a2a1a', 'leather', { lod: 1 });
    g.stroke(polyline([[9.4, -64.6], [9.4, 4.6]]), '#f4efe6', 0.5);
    g.fill(path([[8, -66], [9.6, -69, 1], [11, -66.6]]), '#efe0bc', { lod: 1 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 12 }, (g) => g.mat(limb(8, -42, 10.6, -32, 4, 3.6), LODEN, 'cloth'));
  F.part('handF', { bone: 'handF', z: 42, zb: 14 }, (g) => g.mat(circle(14.6, -30, 2.6), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 25, -4, -34, 2, { zb: 25 });

  F.anim({
    // späht mit der Hand über den Augen; bläst kurz ins Horn
    idle: { p: { breathe: 0.025, bob: 0.4, sway: 1 }, keys: { armB: { r: [[0, 0], [0.15, -128], [0.45, -128], [0.6, 0]] }, handB: { r: [[0, 0], [0.15, -60], [0.45, -60], [0.6, 0]] }, head: { r: [[0, 0], [0.2, -4], [0.45, 4], [0.6, 0]] }, layer: [[0.12, 0.5, 'handB', 37, 37]] } },
    walk: { prog: 'biped.idle' },
    // Pfeil auflegen, schneller Schuss, nachfedern
    attack: {
      prog: 'atk.shoot',
      hit: 0.6,
      p: { armFAim: -80, armBAim: -82, propAim: 80, handBAim: 82, draw: 6, recoil: 1.5, kick: 4, aimHead: 2 },
      keys: { layer: [[0, 0.7, 'armB', 43, 43], [0, 0.7, 'handB', 44, 44], [0, 0.7, 'nockArrow', 45, 45]] },
      ev: { release: 0.6 },
    },
    // duckt sich hinter die Zinne
    hit: { keys: { root: { y: [[0, 0], [0.2, 6], [1, 0]] } } },
    spawn: { keys: { armF: { r: [[0, 0], [0.6, 0], [0.75, -150], [0.9, -150], [1, 0]] } } },
    // springt mit einem Hornstoß hinab
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { y: [[0, 0], [0.2, -8, 'out'], [1, 30, 'in']], r: [[0, 0], [1, 30]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
