// Blasrohrkobold – hibbeliger, hagerer Dschungel-Kobold mit einem Blasrohr, doppelt so lang wie er selbst
// (Brief: docs/briefs/dart-goblin.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeX, eyeSpiral, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function dartGoblin(F) {
  const P = F.pal;
  const CLOTH = P.main;
  const YELLOW = P.acc;
  const SKIN = '#6fb08a';
  const SKIN_D = '#4e8a68';
  const BAMBOO = '#c8b06a';
  const GOURD = '#e08a3a';
  const POISON = '#7cff5a';

  F.rig('biped', {
    hip: [-2, -20],
    torso: [-2, -22],
    head: [8, -36],
    hat: [8, -52],
    back: [-8, -30],
    armB: [0, -36],
    handB: [14, -40],
    armF: [8, -36],
    handF: [22, -42],
    prop: [22, -42],
    legB: [-5, -20],
    footB: [-8, -3],
    legF: [2, -20],
    footF: [6, -3],
    cape: [-4, -34],
  });

  // ───────── Federschmuck (Teamzone) und Kürbis-Pfeilbeutel ─────────
  F.part('plume', { bone: 'head', z: 27, zb: 37, team: true }, (g) => {
    for (const [x, y, a] of [[-6, -50, -40], [-4, -54, -20], [0, -56, 0]]) {
      const r = (a * Math.PI) / 180;
      g.mat(ellipse(x + Math.sin(r) * 6, y - Math.cos(r) * 6, 2.4, 7, a), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    }
  });
  F.part('evoFeatherEdge', { bone: 'head', z: 27.5, zb: 37.5, evo: 'evo' }, (g) => {
    for (const [x, y] of [[-10, -54], [-6, -60], [0, -62]]) g.fill(circle(x, y, 1.4), POISON);
  });
  F.part('gourd', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(blob([[-16, -32], [-12, -38], [-8, -34], [-6, -24], [-12, -18], [-18, -22]], 0.7), GOURD, 'wood', { hi: 0.5 });
    for (const x of [-14, -11, -8]) g.stroke(polyline([[x, -36], [x - 1, -44]]), '#d8c8a0', 0.7);
  });
  F.part('evoFlask', { bone: 'back', z: 3.5, zb: 46.5, evo: 'evo' }, (g) => {
    g.mat(blob([[-20, -20], [-16, -26], [-12, -22], [-12, -14], [-18, -12]], 0.6), '#4a8a3a', 'glass', { line: '#2a5a1a' });
    g.fill(circle(-16, -18, 2), POISON, { op: 0.8 });
  });

  // ───────── Dünne Beine, geduckt ─────────
  const leg = (name, foot, x, fx, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -20, x + 4, -10, 2, 1.8), SKIN_D, 'skin');
      g.mat(limb(x + 4, -10, fx, -3, 1.8, 1.6), SKIN_D, 'skin');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(path([[fx - 2.6, -4], [fx + 2, -4.4], [fx + 7, -1.4], [fx + 7.4, 0, 1], [fx - 3, 0, 1]]), SKIN, 'skin', { hi: 0.4 }));
  };
  leg('legB', 'footB', -5, -8, 6);
  leg('legF', 'footF', 2, 6, 8);
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(0, -36, 14, -40, 1.8, 1.6), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(14, -40, 2.2), SKIN_D, 'skin'));

  // ───────── Hagerer, vorgebeugter Rumpf, Lendentuch, Federkragen ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-8, -22], [-6, -34], [2, -40], [8, -36], [4, -24], [-2, -20]]), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-4, -30], [0, -28]], [[-3, -26], [1, -24]]], SKIN_D, 0.6, 1));
  });
  F.part('loin', { bone: 'hip', z: 21, zb: 21 }, (g) => g.mat(path([[-10, -25], [6, -25], [7.6, -11], [0, -13.4], [-5, -9], [-10.6, -13]]), CLOTH, 'cloth', { hi: 0.4 }));
  F.part('collar', { bone: 'torso', z: 22, zb: 22 }, (g) => {
    for (let i = 0; i < 5; i++) g.mat(ellipse(-4 + i * 2.6, -38 + i * 0.6, 1.4, 3.4, -20 + i * 10), i % 2 ? YELLOW : CLOTH, 'cloth');
  });
  F.part('beads', { bone: 'torso', z: 22.5, zb: 22.5, lod: 1 }, (g) => {
    for (let i = 0; i < 4; i++) g.fill(circle(-6 + i * 2.6, -26 + i * 0.4, 0.9), '#e8d8a8');
  });

  // ───────── Kopf: hager, Schielaugen, spitze Ohren mit Federn, Stirnband (Teamzone) ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 36 }, (g) => g.mat(path([[6, -46], [14, -56, 1], [12, -44]]), SKIN_D, 'skin'));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[0, -40], [2, -48], [10, -51], [17, -47], [18, -40], [14, -34], [6, -33], [1, -36]], 0.7), SKIN, 'skin', { hi: 0.4 });
  });
  F.part('cheeks', { bone: 'head', z: 30.5, view: 'front', state: ['loaded'] }, (g) => {
    g.mat(circle(15, -36, 4.6), SKIN, 'skin', { hi: 0.6 });
    g.mat(circle(8, -35, 3.6), SKIN, 'skin', { hi: 0.5 });
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 14, -43, { r: 2.6, iris: '#3a2a1a', lidColor: SKIN, look: [-0.4, 0.2], ratio: 1, irisR: 0.4 });
    eye(g, 7.4, -43, { r: 2.4, iris: '#3a2a1a', lidColor: SKIN, look: [0.6, 0.2], ratio: 1, irisR: 0.4 });
    g.stroke(spline([[9, -36], [12, -35.4], [15, -36.4]]), INK, 0.7);
  });
  F.part('face.attack', { bone: 'head', z: 31, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 14, -43, { r: 2.6, iris: '#3a2a1a', lidColor: SKIN, lid: 0.3, look: [-0.5, 0], ratio: 1, irisR: 0.45 });
    eye(g, 7.4, -43, { r: 2.4, iris: '#3a2a1a', lidColor: SKIN, lid: 0.3, look: [0.6, 0], ratio: 1, irisR: 0.45 });
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eyeClosed(g, 14, -43, 2.4, { up: true, lw: 0.7 });
    eyeSpiral(g, 7.4, -43, 2.2, INK, 0.6);
    g.fill(ellipse(12, -35.6, 1.6, 1.4), '#4a1c24');
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 14, -43, 2, INK, 0.8);
    eyeX(g, 7.4, -43, 1.8, INK, 0.8);
  });
  F.part('nose', { bone: 'head', z: 31.5, view: 'front' }, (g) => g.mat(path([[14, -42], [21, -39.4, 1], [15, -38.6]]), SKIN, 'skin', { line: SKIN_D, lw: 0.5 }));
  F.part('earF', { bone: 'head', z: 32, zb: 29 }, (g) => {
    g.mat(path([[2, -42], [-8, -48, 1], [1, -38]]), SKIN, 'skin', { hi: 0.3 });
    g.mat(ellipse(-7, -50, 1.4, 4, -50), YELLOW, 'cloth');
  });
  F.part('headband', { bone: 'head', z: 32.5, zb: 32.5, team: true }, (g) => g.mat(path([[0, -46], [17, -48], [17.4, -45], [0.4, -43]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));

  // ───────── Bambus-Blasrohr (Signature), waagerecht vor dem Gesicht ─────────
  F.part('pipe', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.mat(path([[12, -40, 1], [58, -42, 1], [58, -39.4, 1], [12, -37.6, 1]]), BAMBOO, 'wood', { hi: 0.6 });
    g.lod(1, (h) => {
      for (const x of [24, 36, 48]) h.stroke(polyline([[x, -42.4], [x, -38.6]]), '#8a7a3a', 0.8);
      for (const x of [28, 30]) h.stroke(polyline([[x, -42.6], [x + 1, -38]]), '#6a4a2a', 0.6);
    });
    g.mat(rrect(10, -41.6, 4, 5, 1.2), '#8a6a3a', 'wood');
  });
  F.part('dart', { bone: 'prop', z: 39, state: 'muzzle' }, (g) => {
    g.mat(path([[62, -41], [72, -40.6, 1], [62, -40]]), '#c8ccd2', 'metal');
    g.fill(circle(61, -40.6, 1.8), '#f0ece0', { op: 0.9 });
  });
  F.part('evoDrip', { bone: 'prop', z: 39.5, evo: 'evo', glow: true }, (g) => {
    g.fill(circle(58.6, -38, 1.4), POISON);
    g.fill(path([[58, -37], [59.2, -37], [58.6, -34, 1]]), POISON);
  });
  F.part('armF', { bone: 'armF', z: 37, zb: 6 }, (g) => g.mat(limb(8, -36, 22, -42, 1.8, 1.6), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(22, -41, 2.4), SKIN, 'skin'));
  // Evo: Giftfrosch auf der Schulter
  F.part('evoFrog', { bone: 'torso', z: 33, zb: 33, evo: 'evo' }, (g) => {
    g.mat(blob([[-6, -40], [-4, -45], [2, -46], [4, -41], [0, -38]], 0.7), '#3ad04a', 'skin', { hi: 0.6 });
    g.fill(circle(1, -44, 1), '#1a1a1a');
    g.fill(circle(-3, -42, 0.8), '#1a4aff', { lod: 1 });
  });
  emblem(F, 'emblem', 'hip', 22, -2, -18.6, 2.3, { zb: 22 });

  F.anim({
    // pustet Staub aus dem Rohr, schielt
    idle: { p: { breathe: 0.03, bob: 1.2, sway: 2, tilt: 3 }, keys: { show: { loaded: [[0.3, 0.45]], muzzle: [[0.45, 0.55]] } } },
    // schnelles Huschen in geduckter Haltung
    walk: { prog: 'biped.run', p: { stride: 26, bob: 2, armSwing: 4, lean: 8 } },
    // Backen aufblasen, Pfeil, Backen fallen zusammen
    attack: { prog: 'atk.shoot', hit: 0.6, p: { armFAim: 0, armBAim: 0, propAim: 0, recoil: 1.4, kick: 2, aimHead: 0, flash: 0.15 }, keys: { head: { sx: [[0, 1], [0.4, 1.1], [0.6, 1.12], [0.65, 0.94], [0.8, 1]], sy: [[0, 1], [0.4, 0.95], [0.6, 0.94], [0.65, 1.04], [0.8, 1]] } }, ev: { release: 0.6 } },
    // verschluckt sich und hustet
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { torso: { r: [[0, 0], [0.2, 10], [0.4, 0], [0.6, 10], [0.8, 0]] } } },
    // landet in der Hocke, Rohr im Anschlag
    spawn: {},
    // kippt um, das Rohr rollt weg
    death: { p: { dir: -1, angle: 80 }, keys: { prop: { x: [[0, 0], [0.4, 0], [1, 14]], y: [[0, 0], [0.4, 0], [1, 30]] } } },
  });
}
