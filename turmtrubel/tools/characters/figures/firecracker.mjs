// Feuerwerkerin – aufgekratzte Pyrotechnikerin mit Papierschirm, dessen Speichen Raketen sind, und Wunderkerzen im Haar
// (Brief: docs/briefs/firecracker.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { faceSet, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function firecracker(F) {
  const P = F.pal;
  const DRESS = P.main;
  const PINK = P.acc;
  const PAPER = '#fff2d8';
  const HAIR = '#2a1e2e';
  const SKIN = '#f2c4a0';
  const ROCKET = '#e84a3a';
  const BAMBOO = '#c9b06a';

  F.rig('biped', {
    hip: [0, -27],
    torso: [0, -30],
    head: [3, -54],
    hat: [-2, -66],
    armB: [-8, -50],
    handB: [-11, -36],
    armF: [9, -50],
    handF: [12, -40],
    prop: [12, -40],
    legB: [-4, -26],
    footB: [-5, -6],
    legF: [4, -26],
    footF: [5, -6],
  });

  // ───────── Leggings, Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -27, x * 1.1, -9, 4.2, 3.8), '#2e2a40', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4, -12], [fx + 4, -12], [fx + 4.2, -6], [fx + 8.6, -3], [fx + 8.8, 0, 1], [fx - 4.8, 0, 1], [fx - 5, -6]]), PINK, 'leather', { hi: 0.5 });
      g.mat(rrect(fx - 5, -13, 9.4, 2.2, 1), '#c83a80', 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 4, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-8, -50, -11, -38, 3.8, 3.4), '#d8a880', 'skin'));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-11.4, -35.6, 2.6), '#d8a880', 'skin'));

  // ───────── Kurzkleid mit Funkenmuster, Gürtelschleife ─────────
  F.part('dress', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const d = path([[-8, -51], [-2, -53], [6, -53], [9, -51], [10, -38], [15, -20], [6, -18], [0, -19.4], [-7, -18], [-15, -20], [-10, -38]]);
    g.mat(d, DRESS, 'cloth');
    g.lod(1, (h) => {
      for (const [x, y] of [[-8, -26], [3, -24], [10, -28], [-3, -32], [6, -42]]) {
        h.stroke(polyline([[x - 1.6, y], [x + 1.6, y]]), '#fff2a0', 0.6);
        h.stroke(polyline([[x, y - 1.6], [x, y + 1.6]]), '#fff2a0', 0.6);
      }
    });
    g.stroke(polyline([[15, -20], [6, -18], [0, -19.4], [-7, -18], [-15, -20]]), PINK, 1, { lod: 1 });
  });
  F.part('bow', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-10, -36, 20, 3.6, 1.4), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-11, -34], [-17, -38], [-17, -30], [-11, -33]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[-11, -34], [-15, -26, 1], [-12.6, -26.4], [-10, -33]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });

  // ───────── Kopf: Haarknoten mit Wunderkerzen, lachender Mund ─────────
  F.part('bun', { bone: 'hat', z: 29, zb: 35 }, (g) => {
    g.mat(circle(-3, -66, 6.4), HAIR, 'hair', { hi: 0.5 });
    for (const [x, y, a] of [[-6, -70, -120], [-1, -71, -70]]) {
      const r = (a * Math.PI) / 180;
      g.stroke(polyline([[x, y], [x + Math.cos(r) * 9, y + Math.sin(r) * 9]]), '#8a8a90', 0.9);
    }
  });
  F.part('sparkle', { bone: 'hat', z: 29.5, zb: 35.5, glow: true }, (g) => {
    for (const [x, y] of [[-10.5, -77.8], [2.1, -79.5]]) {
      g.fill(circle(x, y, 2.4), '#ffe48a', { op: 0.9 });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.stroke(polyline([[x, y], [x + Math.cos(a) * 4.4, y + Math.sin(a) * 4.4]]), '#fff4c0', 0.6);
      }
    }
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -63], [3, -66], [12.6, -62.6], [14, -55], [12, -48], [6, -45], [-1, -46.4], [-5.6, -52]]), SKIN, 'skin');
  });
  F.part('hairFront', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-7, -56], [-6.6, -63], [1, -67], [10, -66], [14, -61], [9, -62], [3, -60.6], [-2, -58]]), HAIR, 'hair', { hi: 0.5 });
  });
  faceSet(F, {
    eyes: [[10.4, -56, 2.4], [3.4, -56, 2.2]],
    iris: '#c84a8a',
    lidColor: SKIN,
    lid: 0.1,
    brow: { color: HAIR, w: 1, lift: 0.5 },
    mouth: [8, -49.6, 5],
    mood: 'grin',
    attackMouth: 'grin',
    idle: (g) => {
      // Funken in den Augen
      g.fill(circle(9.6, -56.8, 0.6), '#fff2a0', { lod: 1 });
      g.fill(circle(2.8, -56.8, 0.55), '#fff2a0', { lod: 1 });
    },
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front', lod: 1 }, (g) => g.fill(ellipse(12.6, -51.6, 2.2, 1.3), '#f08aa0', { op: 0.5 }));
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(7.6, -52.8, 1.5, 1.3), '#e8a882', 'skin', { line: '#b07a5c', lw: 0.5 }));

  // ───────── Raketen-Schirm (Signature) ─────────
  const CX = 12;
  const CY = -84;
  const rocketsAt = [-170, -145, -120, -95, -70, -45, -20, 5];
  F.part('umbrella', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.stroke(polyline([[12, -38], [12, -84]]), BAMBOO, 1.6);
    g.stroke(spline([[12, -38], [12, -34], [9, -33], [8.6, -36]]), BAMBOO, 1.6);
    const canopy = path([...arc(CX, CY + 6, 24, 16, -180, 0, 16), [CX + 24, CY + 6], [CX + 16, CY + 9], [CX + 8, CY + 7], [CX, CY + 9], [CX - 8, CY + 7], [CX - 16, CY + 9]]);
    g.mat(canopy, PAPER, 'cloth', { hi: 0.4 });
    g.clipTo(canopy, (h) => {
      for (const a of [-150, -120, -90, -60, -30]) {
        const r = (a * Math.PI) / 180;
        h.stroke(polyline([[CX, CY - 8], [CX + Math.cos(r) * 26, CY + 6 + Math.sin(r) * 18]]), '#e8d0a8', 0.6, { lod: 1 });
      }
      h.fill(ellipse(CX + 14, CY + 2, 4, 2), '#8a6a4a', { op: 0.35, lod: 1 });
    });
    g.mat(circle(CX, CY - 10, 2), PINK, 'gem');
  });
  F.part('umbrellaRim', { bone: 'prop', z: 38.5, zb: 4.5, team: true }, (g) => {
    g.stroke(polyline([[CX + 24, CY + 6], [CX + 16, CY + 9], [CX + 8, CY + 7], [CX, CY + 9], [CX - 8, CY + 7], [CX - 16, CY + 9], [CX - 24, CY + 6]]), P.team, 2);
  });
  F.part('rockets', { bone: 'prop', z: 39, zb: 5 }, (g) => {
    for (const a of rocketsAt) {
      const r = (a * Math.PI) / 180;
      const ux = Math.cos(r);
      const uy = Math.sin(r) * 0.7;
      const L = Math.hypot(ux, uy);
      const x0 = CX + Math.cos(r) * 21;
      const y0 = CY + 6 + Math.sin(r) * 14;
      const dx = ux / L;
      const dy = uy / L;
      const nx = -dy;
      const ny = dx;
      // Rakete: Hülse mit weißem Ring und Spitze, ragt deutlich aus dem Rand
      g.mat(path([[x0 - nx * 1.8, y0 - ny * 1.8], [x0 + dx * 9 - nx * 1.8, y0 + dy * 9 - ny * 1.8], [x0 + dx * 13, y0 + dy * 13, 1], [x0 + dx * 9 + nx * 1.8, y0 + dy * 9 + ny * 1.8], [x0 + nx * 1.8, y0 + ny * 1.8]]), a === 5 ? PINK : ROCKET, 'cloth', { lw: 0.6 });
      g.stroke(polyline([[x0 + dx * 6 - nx * 1.8, y0 + dy * 6 - ny * 1.8], [x0 + dx * 6 + nx * 1.8, y0 + dy * 6 + ny * 1.8]]), '#fff8e8', 1, { lod: 1 });
    }
  });
  F.part('launch', { bone: 'prop', z: 40, state: 'muzzle', glow: true }, (g) => {
    g.fill(circle(CX + 37, CY + 7, 4.4), '#ffe48a', { op: 0.9 });
    g.fill(path([[CX + 24, CY + 4], [CX + 30, CY + 1], [CX + 33, CY + 7], [CX + 30, CY + 12]]), '#ff9a4a', { op: 0.8 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(9, -50, 11.6, -42, 3.8, 3.4), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(12, -39.6, 2.7), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -3, -42, 2, { zb: 24 });

  // ───────── Evolution (Glut): Doppelschirm mit Glutrand, glühende Haarstäbe ─────────
  F.part('evoCanopy', { bone: 'prop', z: 37.5, zb: 3.5, evo: 'evo' }, (g) => {
    g.mat(path([...arc(CX, CY - 4, 14, 10, -180, 0, 12), [CX + 14, CY - 4], [CX - 14, CY - 4]]), '#ffe0b0', 'cloth');
  });
  F.part('evoEmber', { bone: 'prop', z: 39.5, evo: 'evo', glow: true }, (g) => {
    g.stroke(polyline([[CX + 24, CY + 6], [CX + 16, CY + 9], [CX + 8, CY + 7], [CX, CY + 9], [CX - 8, CY + 7], [CX - 16, CY + 9], [CX - 24, CY + 6]]), '#ff7a2a', 1.4, { op: 0.9 });
    g.stroke(polyline([[CX - 14, CY - 4], [CX + 14, CY - 4]]), '#ff7a2a', 1, { op: 0.8 });
  });
  F.part('evoSticks', { bone: 'hat', z: 30, evo: 'evo', glow: true }, (g) => {
    g.stroke(polyline([[-8, -64], [-14, -74]]), '#ff8a3a', 1.4);
    g.stroke(polyline([[2, -64], [8, -74]]), '#ff8a3a', 1.4);
  });

  F.anim({
    // dreht den Schirm, Funken sprühen
    idle: { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 3 }, keys: { prop: { r: [[0, -4], [0.25, 4], [0.5, -4], [0.75, 4], [1, -4]] }, hat: { r: [[0, 0], [0.5, 6], [1, 0]] } } },
    // hüpfender Gang
    walk: { p: { stride: 24, bob: 4, armSwing: 6, lean: 3 }, keys: { prop: { r: [[0, -6], [0.5, 6], [1, -6]] } }, ev: { step: [0.25, 0.75] } },
    // Schirm nach vorn, Rakete zischt, Rückstoß-Hüpfer nach hinten
    attack: {
      prog: 'atk.shoot',
      hit: 0.5,
      p: { armFAim: -50, armBAim: -20, propAim: 60, recoil: 8, kick: 8, kickArm: 0, aimHead: 2 },
      keys: { root: { y: [[0, 0], [0.5, 0], [0.62, -6, 'out'], [0.8, 0]], x: [[0, 0], [0.5, 0], [0.7, -6], [1, 0]] } },
      ev: { release: 0.5 },
    },
    // Schirm klappt zu
    hit: { p: { knock: 2, recoil: 5 }, keys: { prop: { sx: [[0, 1], [0.2, 0.6], [1, 1]] } } },
    // schwebt am Schirm herab
    spawn: { keys: { root: { y: [[0, -30], [0.55, 0, 'out'], [1, 0]] }, armF: { r: [[0, -60], [0.6, -60], [1, 0]] } } },
    // Schirm fliegt davon
    death: { p: { dir: -1, angle: 70 }, keys: { prop: { y: [[0, 0], [0.2, 0], [1, -40, 'out']], x: [[0, 0], [1, 18]], r: [[0, 0], [1, 40]] } } },
  });
}
