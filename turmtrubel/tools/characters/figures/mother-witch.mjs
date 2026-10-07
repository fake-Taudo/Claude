// Hexenmutter – resolute Hexen-Oma mit Lockenwicklern unter dem Hut und Kessel-Rucksack voller Fluchsud
// (Brief: docs/briefs/mother-witch.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function motherWitch(F) {
  const P = F.pal;
  const DRESS = P.main;
  const CURSE = P.acc;
  const IRON = '#3a3640';
  const SKIN = '#d8c4b8';
  const COPPER = '#c87a3a';
  const APRON = '#f0e8d0';
  const HAT = '#2e2a3a';
  const DRESS_D = '#4e4e1e';

  F.rig('robe', {
    hip: [0, -32],
    skirt: [0, -32],
    torso: [0, -35],
    head: [3, -60],
    hat: [3, -72],
    back: [-12, -52],
    armB: [-11, -56],
    handB: [-14, -40],
    armF: [11, -56],
    handF: [17, -44],
    prop: [17, -44],
    cape: [-2, -58],
  });

  // ───────── Kessel-Rucksack (Signature) mit blubberndem Fluchsud ─────────
  F.part('cauldron', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.mat(blob([[-30, -60], [-6, -60], [-4, -50], [-8, -40], [-18, -36], [-28, -40], [-32, -50]], 0.5), IRON, 'metal', { hi: 0.6 });
    g.mat(ellipse(-18, -60, 13, 3.4), '#2a2630', 'metal');
    g.mat(ellipse(-18, -61, 11, 2.4), CURSE, 'flat');
    for (const [x, y, r] of [[-22, -64, 2.4], [-15, -66, 1.8], [-18, -70, 1.4]]) g.fill(circle(x, y, r), '#ff9ad0', { stroke: '#c84a8a', lw: 0.4 });
    g.stroke(polyline([[-30, -56], [-2, -54]]), '#6b4a2a', 1.2, { lod: 1 });
    g.lod(1, (h) => h.fill(ellipse(-28, -46, 2, 3), CURSE, { op: 0.6 }));
  });
  F.part('steam', { bone: 'back', z: 3.5, zb: 46.5, glow: true }, (g) => {
    for (const [x, y, r] of [[-20, -74, 3], [-14, -80, 2.4], [-22, -84, 2]]) g.fill(circle(x, y, r), '#ffb8e0', { op: 0.35 });
  });

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-11, -56, -14, -42, 5, 4.4), DRESS_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-14, -39.6, 3), '#c8b0a4', 'skin'));

  // ───────── Kittelkleid mit Blümchenschürze, Pantoffeln ─────────
  F.part('slippers', { bone: 'skirt', z: 6 }, (g) => {
    for (const x of [-6, 7]) g.mat(path([[x - 4, -3.4], [x + 4, -3.4], [x + 7.6, -1], [x + 7.6, 0, 1], [x - 4.6, 0, 1]]), '#b85a8a', 'cloth');
  });
  F.part('dress', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    g.mat(path([[-10, -38], [10, -38], [16, -20], [21, -3], [6, -2], [-6, -2], [-21, -3], [-16, -20]]), DRESS, 'cloth', { hi: 0.3 });
  });
  F.part('apron', { bone: 'skirt', z: 19, view: 'front' }, (g) => {
    const a = path([[-6, -38], [12, -38], [15, -20], [16, -5], [2, -4], [-9, -5], [-9, -20]]);
    g.mat(a, APRON, 'cloth');
    g.clipTo(a, (h) => {
      for (const [x, y] of [[-4, -30], [6, -32], [10, -20], [-2, -16], [8, -10], [-6, -8]]) {
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2;
          h.fill(circle(x + Math.cos(ang) * 1.2, y + Math.sin(ang) * 1.2, 0.8), '#e88ab8', { lod: 1 });
        }
        h.fill(circle(x, y, 0.6), '#f0d060', { lod: 1 });
      }
      h.fill(ellipse(4, -14, 2.4, 1.6), '#c84a8a', { op: 0.4, lod: 1 });
    });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-10, -57], [-2, -59.6], [8, -59.6], [11, -57], [11, -42], [9, -35], [-9, -35], [-11, -42]]), DRESS, 'cloth');
  });
  F.part('shawl', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    const s = path([[-12, -58], [12, -58], [12, -52], [4, -44], [0, -42, 1], [-4, -44], [-12, -52]]);
    g.mat(s, P.team, 'cloth', { line: P.teamDeep });
    g.clipTo(s, (h) => {
      for (let y = -56; y < -42; y += 2.6) h.stroke(spline([[-12, y], [-8, y + 1.2], [-4, y], [0, y + 1.2], [4, y], [8, y + 1.2], [12, y]]), P.teamShade, 0.5, { lod: 2 });
    });
  });

  // ───────── Kopf: runzlig, Brille, gespitzte Lippen, Lockenwickler ─────────
  F.part('curlers', { bone: 'head', z: 29, zb: 35 }, (g) => {
    for (const [x, y] of [[-7, -66], [-8, -60], [14, -68]]) {
      g.mat(rrect(x - 2.6, y - 1.6, 5.2, 3.2, 1.4), '#f08ab8', 'cloth');
      g.stroke(polyline([[x - 2.6, y], [x + 2.6, y]]), '#c84a8a', 0.4, { lod: 1 });
    }
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-6, -70], [3, -73], [12, -70], [14, -62], [12, -54], [5, -51], [-2, -53], [-6, -60]], 0.5), SKIN, 'skin');
    g.lod(1, (h) => lines(h, [[[1, -67], [4, -67.6], [7, -67]], [[12, -59], [13, -57]]], '#b0988c', 0.5, 1));
  });
  faceSet(F, {
    eyes: [[10, -62.6, 1.9], [3.4, -62.6, 1.8]],
    iris: '#4a6a2a',
    lidColor: SKIN,
    lid: 0.3,
    brow: { color: '#8a8a8a', w: 1.2, lift: 0.3 },
    idleTilt: 0.8,
    mouth: [8.4, -55.6, 3.6],
    mood: 'frown',
    attackMouth: 'oh',
    replace: {
      idle: (g, c) => {
        // drohend gespitzte Lippen
        for (const [x, y, r] of [c.E1, c.E2]) g.fill(circle(x, y, r), WHITE, { stroke: INK, lw: 0.5 });
        g.fill(circle(10.4, -62.4, 1), '#4a6a2a');
        g.fill(circle(3.8, -62.4, 0.9), '#4a6a2a');
        g.fill(ellipse(8.6, -55.4, 1.6, 1.2), '#b85a6a', { stroke: INK, lw: 0.5 });
        g.stroke(polyline([[7.6, -55.4], [9.6, -55.4]]), INK, 0.4, { lod: 1 });
      },
    },
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[7, -62], [11.6, -58, 1], [7.4, -57.6]]), '#c8a89a', 'skin', { line: '#9a7a6c', lw: 0.5 }));
  F.part('glasses', { bone: 'head', z: 34.5, view: 'front' }, (g) => {
    g.stroke(circle(10, -62.6, 2.8), '#c87a3a', 0.7);
    g.stroke(circle(3.4, -62.6, 2.6), '#c87a3a', 0.7);
    g.stroke(polyline([[6, -62.8], [7.2, -62.8]]), '#c87a3a', 0.6);
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.mat(blob([[-6, -68], [14, -68], [14, -60], [7, -53], [-1, -54], [-6, -60]], 0.5), '#a8a8a8', 'hair'));
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-14, -67, 1], [-6, -71], [4, -72], [16, -71], [22, -67, 1], [12, -68.4], [4, -68.6], [-6, -68]]), HAT, 'cloth');
    g.mat(path([[-4, -70], [-2, -80], [3, -88], [9, -84], [12, -70]]), HAT, 'cloth', { hi: 0.3 });
  });
  F.part('hatBow', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-3.6, -71], [11.6, -71.2], [11, -74], [-3, -73.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[11, -73], [16, -77, 1], [16, -70, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Schöpfkelle aus Kupfer ─────────
  F.part('ladle', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[16, -44], [18, -44.6], [24, -72], [22, -72.6]]), COPPER, 'metal');
    g.mat(blob([[18, -74], [28, -74], [28, -70], [23, -67], [18, -70]], 0.5), COPPER, 'metal', { hi: 0.9 });
    g.fill(ellipse(23, -73.6, 4.6, 1.2), CURSE, { lod: 1 });
  });
  F.part('splash', { bone: 'prop', z: 39, state: 'cast', glow: true }, (g) => {
    for (const [x, y, r] of [[30, -78, 3], [36, -80, 2.4], [34, -74, 2]]) g.fill(circle(x, y, r), CURSE, { op: 0.8 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(11, -56, 16, -46, 5, 4.4), DRESS, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(17, -43, 3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -6, -46, 2.2, { zb: 24 });

  F.anim({
    // rührt im Rückenkessel und schnuppert
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 1.5 }, keys: { armB: { r: [[0, 0], [0.3, 130], [0.4, 120], [0.5, 135], [0.6, 120], [0.7, 0]] }, head: { r: [[0, 0], [0.7, 0], [0.8, -6], [0.9, 0]] } } },
    // watschelnd, der Kessel schwappt
    walk: { p: { stride: 8, bob: 2, armSwing: 3, skirt: 4 }, keys: { root: { r: [[0, -3], [0.5, 3], [1, -3]] }, back: { r: [[0, 4], [0.5, -4], [1, 4]] } } },
    // Kelle in den Kessel, Fluchsud schleudern
    attack: { prog: 'atk.cast', hit: 0.55, p: { wind: 60, strike: -110, windB: 0, strikeB: 0, lean: 6, lunge: 8 }, ev: { release: 0.55 } },
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { head: { r: [[0, 0], [0.2, 10], [1, 0]] } } },
    // Kessel kippt, rosa Dampf hüllt sie ein
    death: { p: { dir: -1, angle: 60 }, keys: { back: { r: [[0, 0], [0.5, -50]] } } },
  });
}
