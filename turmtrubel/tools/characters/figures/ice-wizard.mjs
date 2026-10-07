// Eismagier – gelassener alter Magier im frostweißen Pelzmantel mit Eiszapfen-Bart und Schneekugel-Stab
// (Brief: docs/briefs/ice-wizard.md). o.hero: großväterlicher Held mit Schneemann-Gehilfen auf der Schulter (ice-wizard-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, furEdge, emblem, INK, WHITE } from '../kit.mjs';

export default function iceWizard(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const COAT = P.main;
  const ACC = P.acc;
  const ICE = '#bfeaff';
  const SKIN = '#f0e4dc';
  const BIRCH = '#e8dcc8';
  const FUR = '#f4f8fc';
  const COAT_D = '#b8d4e8';
  const MITTEN = H ? ACC : ACC;

  F.rig('robe', {
    hip: [0, -34],
    skirt: [0, -34],
    torso: [0, -37],
    head: [3, -62],
    hat: [3, -76],
    armB: [-12, -58],
    handB: [-15, -42],
    armF: [12, -58],
    handF: [18, -44],
    prop: [18, -44],
    cape: [-4, -60],
    buddy: [-10, -62],
  });

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-12, -58, -15, -44, 6, 5.4), COAT_D, 'fur'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-15, -41, 3.6), MITTEN, 'cloth'));

  // ───────── Pelzmantel, Eiszapfen-Knöpfe, Raureif ─────────
  F.part('boots', { bone: 'skirt', z: 6 }, (g) => {
    for (const x of [-6, 7]) g.mat(path([[x - 4.6, -5], [x + 4, -5], [x + 8, -2], [x + 8, 0, 1], [x - 5, 0, 1]]), '#9aa8b8', 'fur');
  });
  F.part('coat', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    const c = path([[-10, -40], [10, -40], [15, -22], [21, -4], [8, -2], [-6, -3], [-21, -4], [-15, -22]]);
    g.mat(c, COAT, 'fur', { hi: 0.4 });
    g.clipTo(c, (h) => {
      for (const [x, y] of [[-10, -26], [6, -30], [-4, -14], [12, -12], [-14, -10]]) {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI;
          h.stroke(polyline([[x - Math.cos(a) * 2, y - Math.sin(a) * 2], [x + Math.cos(a) * 2, y + Math.sin(a) * 2]]), '#9ac8e8', 0.5, { lod: 1 });
        }
      }
      h.fill(path([[-21, -4], [21, -4], [21, -8], [-21, -8]]), '#ffffff', { op: 0.5, lod: 1 });
    });
  });
  F.part('coatHem', { bone: 'skirt', z: 19, zb: 19, team: true }, (g) => {
    g.mat(path([[-21, -6], [-6, -5], [8, -4], [21, -6], [21, -2], [8, 0], [-6, -0.6], [-21, -2]]), P.team, 'fur', { line: P.teamDeep });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-10, -60], [-2, -63], [8, -63], [12, -60], [12, -44], [10, -37], [-10, -37], [-12, -44]]), COAT, 'fur', { hi: 0.4 });
    for (const y of [-54, -46]) g.mat(path([[1, y], [3, y], [2, y + 4, 1]]), ICE, 'glass', { lod: 1 });
  });
  F.part('scarf', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    g.mat(path([[-10, -62], [12, -62], [12, -57], [-10, -57]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-8, -58], [-4, -58], [-6, -46], [-10, -47]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.lod(1, (h) => h.stroke(polyline([[-9.6, -49], [-6, -49]]), P.teamLight, 0.6));
  });

  // ───────── Kopf: rosiges Gesicht, Brille auf der Nasenspitze, Eiszapfen-Bart, Pelzmütze ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-6, -74], [3, -77], [12, -73.6], [14, -66], [12, -58], [5, -55], [-2, -57], [-6, -64]], 0.5), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10, -67, 1.9], [3.4, -67, 1.8]],
    iris: '#5a7ab8',
    lidColor: SKIN,
    lid: 0.3,
    brow: { color: '#e8f0f8', w: 1.4, lift: 0.4 },
    mouth: [8.4, -59.6, 4],
    mood: 'smile',
    attackMouth: 'oh',
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(12, -62, 2.4, 1.6), '#f4a0a8', { op: 0.6 });
    g.fill(ellipse(1, -62, 2, 1.4), '#f4a0a8', { op: 0.5 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(circle(8, -62.6, 1.9), '#f0b0a8', 'skin', { line: '#c08a84', lw: 0.5 }));
  F.part('glasses', { bone: 'head', z: 34.5, view: 'front' }, (g) => {
    g.stroke(circle(5.6, -62.4, 1.8), '#8a7a6a', 0.6);
    g.stroke(circle(10, -62.4, 1.8), '#8a7a6a', 0.6);
    g.stroke(polyline([[7.4, -62.6], [8.2, -62.6]]), '#8a7a6a', 0.5);
  });
  // Bart aus Eiszapfen bis zum Gürtel
  F.part('beard', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[1, -60], [5, -57], [12, -58], [13.6, -60], [13, -55], [9, -52], [3, -53]]), '#f4f8fc', 'hair');
    for (const [x, L] of [[2, 10], [4.6, 14], [7.2, 20], [9.8, 15], [12.2, 9]]) {
      g.mat(path([[x - 1.6, -55], [x + 1.6, -55], [x + 0.2, -55 + L, 1]]), ICE, 'glass', { hi: 1, lw: 0.6 });
    }
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.mat(blob([[-6, -72], [14, -72], [14, -62], [7, -56], [-1, -57], [-6, -63]], 0.5), '#e8f0f8', 'hair'));
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    const h = blob([[-8, -70], [-7, -78], [0, -83], [9, -83], [15, -78], [15, -70]], 0.5);
    g.mat(h, FUR, 'fur', { hi: 0.4 });
    furEdge(g, [[-8, -70], [3.6, -68.6], [15, -70]], 1.8, FUR, { side: 1, step: 1.8, seed: 6, lod: 1 });
    lines(g, [[[-3, -79], [-1, -74]], [[4, -81], [5, -76]], [[10, -80], [11, -75]]], '#c8d8e8', 0.6, 1);
  });

  // ───────── Birkenstab mit Schneekugel (Signature) ─────────
  F.part('staff', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.mat(rrect(17, -84, 3, 82, 1.2), BIRCH, 'wood');
    g.lod(1, (h) => {
      for (const y of [-70, -50, -30, -14]) h.stroke(polyline([[17, y], [19, y + 0.6]]), '#3a3a3a', 0.8);
      h.stroke(polyline([[17.4, -84], [17.8, -40]]), ICE, 0.8);
    });
    g.mat(rrect(14.6, -88, 7.8, 4, 1.4), '#9a7a5a', 'wood');
    const R = H ? 9.4 : 8;
    const cy = -88 - R + 1;
    g.mat(circle(18.5, cy, R), '#e8f6ff', 'glass', { op: 0.55, hi: 1 });
    g.clipTo(circle(18.5, cy, R), (h) => {
      h.fill(ellipse(18.5, cy + R * 0.7, R, R * 0.4), '#ffffff');
      if (H) {
        // ein winziger Schneemann tanzt in der Kugel
        h.fill(circle(18.5, cy + 2, 2.6), '#ffffff', { stroke: '#8ab0c8', lw: 0.4 });
        h.fill(circle(18.5, cy - 1.6, 1.8), '#ffffff', { stroke: '#8ab0c8', lw: 0.4 });
        h.fill(path([[18.5, cy - 1.6], [21, cy - 1.2, 1], [18.5, cy - 0.8]]), '#ff8a3a');
      } else {
        h.fill(path([[14, cy + 4], [16, cy - 2, 1], [18, cy + 4]]), '#2a7a4a');
        h.fill(rrect(19.4, cy + 0.6, 4, 3.4, 0.4), '#c84a3a');
        h.fill(path([[19, cy + 0.6], [21.4, cy - 2, 1], [23.8, cy + 0.6]]), '#ffffff');
      }
      for (const [dx, dy] of [[-4, -3], [3, -5], [-1, -1], [5, 0], [-5, 2]]) h.fill(circle(18.5 + dx, cy + dy, 0.6), '#ffffff', { lod: 1 });
    });
    g.stroke(circle(18.5, cy, R), '#8ab0c8', 0.6);
    if (H) for (const x of [15, 18.5, 22]) g.mat(path([[x - 1, -86], [x + 1, -86], [x, -80, 1]]), ICE, 'glass', { lod: 1 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(12, -58, 17, -46, 6, 5.4), COAT, 'fur'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(18.6, -43, 3.6), MITTEN, 'cloth'));
  emblem(F, 'emblem', 'torso', 23, -5, -48, 2.4, { zb: 23 });

  if (H) {
    // Schneemann-Gehilfe auf der Schulter (Rang-Merkmal)
    F.part('helper', { bone: 'buddy', z: 35, zb: 45, sig: true }, (g) => {
      // sitzt auf der hinteren Schulter, deutlich vom Mantel abgesetzt: Zylinder, Kohleaugen, Rübennase, Teamschal
      g.mat(circle(-17, -64, 5.4), '#ffffff', 'fur', { hi: 0.4, line: '#7aa0c0' });
      g.mat(circle(-17, -72.6, 4), '#ffffff', 'fur', { hi: 0.4, line: '#7aa0c0' });
      g.mat(rrect(-21.6, -77.4, 9.2, 1.6, 0.6), '#2a2a34', 'cloth');
      g.mat(rrect(-19.6, -84, 5.2, 6.8, 0.8), '#2a2a34', 'cloth');
      g.fill(circle(-16, -73.4, 0.7), INK);
      g.fill(circle(-13.8, -73.4, 0.7), INK);
      g.fill(path([[-14.6, -71.8], [-9, -71, 1], [-14.6, -70.6]]), '#ff8a3a');
      for (const y of [-66, -62]) g.fill(circle(-15, y, 0.7), INK);
      g.mat(path([[-21, -69.6], [-13, -69.6], [-13.4, -67.4], [-20.6, -67.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
      g.stroke(polyline([[-21.4, -65], [-26, -69]]), '#7a5a3a', 0.9);
    });
  }

  F.anim({
    // schüttelt die Schneekugel und staunt
    idle: { p: { breathe: 0.03, bob: 0.6, sway: 1.5 }, keys: { prop: { r: [[0, 0], [0.4, 0], [0.45, -8], [0.5, 8], [0.55, -8], [0.6, 0]] }, buddy: { r: [[0, 0], [0.5, 8], [1, 0]] } } },
    walk: { p: { stride: 8, bob: 1.6, armSwing: 2, skirt: 3 }, keys: { buddy: { y: [[0, 0], [0.25, -1.4], [0.5, 0], [0.75, -1.4], [1, 0]] } } },
    // schwenkt die Kugel, Eissplitter-Fächer
    attack: { prog: 'atk.cast', hit: 0.55, p: { wind: -60, strike: -100, windB: -10, strikeB: 10, lean: 4, lunge: 6 } },
    // Bart klirrt, der Gehilfe wackelt
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { buddy: { r: [[0, 0], [0.15, -20], [0.3, 14], [1, 0]] } } },
    // friert zu einer Eisstatue ein und zerbröselt
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { sy: [[0, 1], [0.5, 1], [1, 0.4, 'in']], sx: [[0, 1], [0.5, 1], [1, 1.3]] }, buddy: { x: [[0, 0], [0.3, 0], [1, -20]], y: [[0, 0], [0.3, 0], [1, 60, 'in']] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
    ...(H
      ? {
          // Frostkerl: wirft den Schneeball nach vorn
          ability: { prog: 'atk.throw', hit: 0.6, p: { wind: -150, strike: -40 }, ev: { ability: 0.6 } },
        }
      : {}),
  });
}
