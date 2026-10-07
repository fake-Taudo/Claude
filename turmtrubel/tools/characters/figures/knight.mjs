// Ritter – sturer Schildträger mit Zinnenschild (Brief: docs/briefs/knight.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { eye, eyeClosed, eyeSpiral, eyeX, brow, mouthLine, mouthOpen, rivets, bricks, chainmail, stitches, emblem, lines, INK } from '../kit.mjs';

/** o.hero: Held mit roségoldener Rüstung, Löwenmähnen-Kragen, Heldenumhang, Goldkamm und Kronen-Schild (knight-hero). */
export default function knight(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const PEWTER = P.main;
  const LEATHER = H ? '#6b3a1e' : P.acc;
  const GOLD = H ? P.acc : '#c8a046';
  const MANE = '#d8902a';
  const LINEN = '#d9cdb4';
  const MAIL = '#7d8796';
  const STONE = '#b9b2a4';
  const SKIN = '#f2c39c';
  const BRASS = '#c8a046';
  const BROW = '#4a3020';

  F.rig('biped', {
    hip: [0, -25],
    torso: [0, -28],
    head: [2, -57],
    hat: [4, -93],
    armB: [-14, -53],
    handB: [-18, -37],
    propB: [-18.5, -35],
    armF: [14, -53],
    handF: [19, -38],
    legB: [-7, -25],
    footB: [-9, -7],
    legF: [7, -25],
    footF: [8, -7],
    ...(H ? { cape: [-2, -56] } : {}),
  });

  // ───────── Beine ─────────
  F.part('legB', { bone: 'legB', z: 8, zb: 8 }, (g) => {
    g.mat(limb(-7, -27, -9, -8, 6.6, 5.4), MAIL, 'metal');
    g.mat(ellipse(-8.6, -15, 4.4, 3.4), PEWTER, 'metal', { lod: 1 });
  });
  F.part('footB', { bone: 'footB', z: 9, zb: 9 }, (g) => {
    g.mat(path([[-15, -10], [-4, -10.5], [0.5, -5.5], [2, 0, 1], [-16, 0, 1], [-16.5, -6]]), LEATHER, 'leather');
    g.mat(rrect(-16, -11.5, 13, 3.5, 1.5), '#7a4520', 'leather', { lod: 1 });
  });
  F.part('legF', { bone: 'legF', z: 12, zb: 12 }, (g) => {
    g.mat(limb(7, -27, 8, -8, 6.6, 5.4), MAIL, 'metal');
    g.mat(ellipse(8.2, -15, 4.4, 3.4), PEWTER, 'metal', { lod: 1 });
  });
  F.part('footF', { bone: 'footF', z: 13, zb: 13 }, (g) => {
    g.mat(path([[2, -10.5], [13, -10.5], [18, -5.5], [19.5, 0, 1], [1, 0, 1], [0.5, -6]]), LEATHER, 'leather');
    g.mat(rrect(1, -11.8, 13, 3.6, 1.5), '#7a4520', 'leather', { lod: 1 });
  });

  // ───────── Hinterer Arm mit Schwert ─────────
  F.part('sword', { bone: 'propB', z: 14, zb: 44 }, (g) => {
    const blade = path([[-21.6, -42], [-17.4, -42.5], [-22.5, -72, 1], [-26.4, -78, 1], [-27.4, -70]]);
    g.mat(blade, '#c9d1da', 'metal', { hi: 0.95 });
    g.stroke(polyline([[-19.6, -43], [-24.6, -73]]), '#8d98a6', 0.7, { lod: 1 });
    g.mat(rrect(-27, -45.5, 15, 3.4, 1), '#59606b', 'metal');
    g.mat(rrect(-21.4, -42.5, 4.2, 9.5, 1.4), LEATHER, 'leather');
    g.mat(rrect(-21.8, -33.6, 5.2, 4.4, 1), '#59606b', 'metal');
  });
  F.part('armB', { bone: 'armB', z: 15, zb: 45 }, (g) => {
    g.mat(limb(-15, -52, -18, -38, 5.2, 4.6), MAIL, 'metal');
    chainmail(g, limb(-15, -52, -18, -38, 5.2, 4.6), [-21, -56, -12, -34], 1.3, '#5d6675');
  });
  F.part('handB', { bone: 'handB', z: 16, zb: 46 }, (g) => {
    g.mat(path([[-23, -38], [-15, -39], [-14, -32], [-17, -30], [-22.5, -31]]), LEATHER, 'leather');
    g.stroke(polyline([[-21.5, -35.5], [-15.5, -35.8]]), '#6b3a18', 0.6, { lod: 2 });
  });
  F.part('pauldronB', { bone: 'armB', z: 17, zb: 47 }, (g) => {
    g.mat(path([[-23, -51], [-20, -59], [-12, -60], [-7, -55], [-9, -48], [-17, -46]]), PEWTER, 'metal');
    g.stroke(spline([[-21, -51], [-15, -49], [-9, -51]]), '#5b6372', 0.7, { lod: 1 });
    rivets(g, [[-19.5, -55], [-13, -56.5]], 0.9, '#d8dde4');
  });

  // ───────── Rumpf ─────────
  F.part('tunic', { bone: 'hip', z: 18, zb: 18 }, (g) => {
    const sk = path([[-16, -35], [16, -35], [18, -20], [9, -16.5], [0, -18.5], [-9, -16.5], [-18, -20]]);
    g.mat(sk, LINEN, 'cloth');
    lines(g, [[[-9, -31], [-10, -19]], [[0, -31], [0, -20]], [[9, -31], [10, -19]]], '#a89c84', 0.6, 1);
    stitches(g, [[-17, -20.5], [-9, -17], [0, -19], [9, -17], [17, -20.5]], '#8a7e66', { step: 2.2, len: 1.1 });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 30 }, (g) => {
    const chest = path([[-16, -56], [-6, -59], [7, -59], [16, -56], [19, -44], [15, -31, 1], [-14, -31, 1], [-18.5, -44]]);
    g.mat(chest, PEWTER, 'metal');
    g.stroke(spline([[-17, -44], [0, -42.2], [18.4, -44]]), '#5b6372', 0.8, { lod: 1 });
    g.stroke(spline([[-15.5, -37.5], [0, -36], [16.5, -37.5]]), '#5b6372', 0.8, { lod: 1 });
    g.stroke(polyline([[4, -58], [4.4, -31.5]]), '#c4ccd6', 0.9, { lod: 1 });
    g.stroke(spline([[-12, -57], [0, -55], [12, -57]]), '#c8d0da', 0.6, { lod: 2 });
    // Kratzer
    lines(g, [[[-10, -50], [-6, -47]], [[9, -40], [12, -41.5]]], '#6a7282', 0.45, 2);
  });
  F.part('torsoBack', { bone: 'torso', z: 21, zb: 31, view: 'back' }, (g) => {
    g.mat(rrect(-14, -56, 5, 24, 2), LEATHER, 'leather');
    g.mat(rrect(9, -56, 5, 24, 2), LEATHER, 'leather');
    rivets(g, [[-11.5, -52], [11.5, -52]], 0.9, BRASS);
  });
  F.part('belt', { bone: 'hip', z: 22, zb: 32 }, (g) => {
    g.mat(rrect(-17, -34, 35, 6, 2.4), LEATHER, 'leather');
    stitches(g, [[-16, -32.6], [17, -32.6]], '#5a2e12', { step: 2, len: 0.9 });
    // Schlüsselbund
    g.lod(2, (h) => {
      h.stroke(circle(-12, -26.5, 1.6), BRASS, 0.7);
      h.fill(rrect(-13.2, -26, 1.4, 5, 0.5), BRASS);
      h.fill(rrect(-11, -25.5, 1.3, 4, 0.5), '#a7aeb8');
    });
  });
  F.part('buckle', { bone: 'hip', z: 23, view: 'front' }, (g) => {
    g.mat(rrect(1.5, -35.5, 8, 9, 1.4), BRASS, 'gold');
    g.fill(rrect(3.6, -33.2, 3.8, 4.4, 0.6), '#5a3412');
    g.fill(rrect(5, -33.8, 1, 5.6, 0.4), '#e8d08a');
  });

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    const face = path([[-9.5, -80], [4, -83], [15, -78], [16.5, -68], [14, -60.5], [6, -57], [-3, -58], [-9, -63], [-10.5, -71]]);
    g.mat(face, SKIN, 'skin');
    // Ohr hinten
    g.mat(ellipse(-9, -69, 2.6, 3.6), SKIN, 'skin', { lod: 1 });
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front', lod: 1 }, (g) => {
    g.fill(ellipse(14, -64.5, 2.6, 1.6), '#f08a7a', { op: 0.45 });
    g.fill(ellipse(-1.5, -64.5, 2.2, 1.4), '#f08a7a', { op: 0.35 });
  });
  // Gesicht je Ausdruck
  const EYE = { r: 2.5, iris: '#4a3626', lidColor: SKIN, look: [0.55, 0] };
  F.part('face.idle', { bone: 'head', z: 32, view: 'front', expr: 'idle' }, (g) => {
    eye(g, 11.5, -69.5, { ...EYE, lid: 0.32 });
    eye(g, 1.5, -69.5, { ...EYE, r: 2.2, lid: 0.32 });
    brow(g, [[8, -73.5], [11.5, -74], [15, -73.2]], 1.7, BROW);
    brow(g, [[-1.2, -73.2], [1.6, -74], [4.6, -73.6]], 1.6, BROW);
    if (H) {
      const m = path([[6.4, -61.6, 1], [13, -62.2, 1], [11.4, -59], [7.6, -59]]);
      g.fill(m, '#4a1c24', { stroke: INK, lw: 0.7 });
      g.clipTo(m, (h) => h.fill(rrect(6, -62.6, 7.6, 1.6, 0.3), '#fffaf0'));
    } else mouthLine(g, 9.5, -60.5, 5.2, -0.5);
  });
  F.part('face.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 11.5, -69.5, { ...EYE, lid: 0.45 });
    eye(g, 1.5, -69.5, { ...EYE, r: 2.2, lid: 0.45 });
    brow(g, [[7.6, -72.4], [11.5, -74.2], [15.4, -75]], 1.9, BROW);
    brow(g, [[-1.4, -74.6], [1.6, -74.2], [4.8, -72.4]], 1.8, BROW);
    mouthOpen(g, 9.5, -60.6, 6, 2.6, { teeth: 'clench', tongue: false });
  });
  F.part('face.hurt', { bone: 'head', z: 32, view: 'front', expr: 'hurt' }, (g) => {
    eyeClosed(g, 11.5, -69.5, 2.4, { up: true, lw: 1.1 });
    eye(g, 1.5, -69.8, { ...EYE, r: 2.4, look: [0.2, -0.2] });
    brow(g, [[8, -74.5], [11.5, -73.2], [15, -74]], 1.6, BROW);
    brow(g, [[-1.2, -74.2], [1.6, -75.2], [4.6, -74]], 1.5, BROW);
    mouthOpen(g, 9.2, -60.6, 4.6, 2.4, { teeth: 'top' });
  });
  F.part('face.stun', { bone: 'head', z: 32, view: 'front', expr: 'stun' }, (g) => {
    eyeSpiral(g, 11.5, -69.5, 2.5);
    eyeSpiral(g, 1.5, -69.5, 2.2);
    mouthLine(g, 9.5, -60.5, 4.6, 0.8);
  });
  F.part('face.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 11.5, -69.5, 2);
    eyeX(g, 1.5, -69.5, 1.8);
    mouthLine(g, 9.5, -60.5, 4.6, -1.2);
  });
  F.part('face.sleep', { bone: 'head', z: 32, view: 'front', expr: 'sleep' }, (g) => {
    eyeClosed(g, 11.5, -69, 2.4);
    eyeClosed(g, 1.5, -69, 2.1);
    mouthLine(g, 9.5, -60.5, 3.6, 0.4);
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.4, -64.6, 2.6, 2.2), '#eab08c', 'skin', { line: '#b07a5c' });
    // Pflaster quer über der Nase
    g.mat(rrect(4.8, -66.4, 7.6, 2.6, 1).rot(-14, 8.6, -65), '#efdcb6', 'cloth', { line: '#b49a6a', lw: 0.6 });
    g.fill(rrect(7.6, -66.8, 1.8, 3.2, 0.4).rot(-14, 8.6, -65), '#d8bf8c', { lod: 2 });
  });
  F.part('helmet', { bone: 'head', z: 34, zb: 38 }, (g) => {
    const dome = path([[-12.5, -74, 1], [-12.5, -84], [-6, -92.5], [5, -95], [14, -91], [18.5, -82], [18.5, -74, 1]]);
    g.mat(dome, PEWTER, 'metal');
    g.stroke(spline([[2.5, -94.5], [3.6, -85], [3.4, -76]]), '#c8d0da', 1.1, { lod: 1 });
    g.mat(rrect(-14, -78.5, 34, 5.6, 2.6), '#7c8696', 'metal');
    rivets(g, [[-10, -75.6], [-3.5, -75.6], [12.5, -75.6], [17, -75.6]], 0.85, '#d6dce4');
    // eingeritzter Turm (Gravur)
    g.lod(2, (h) => {
      h.stroke(polyline([[8.5, -88], [8.5, -82], [12.5, -82], [12.5, -88], [11.5, -88], [11.5, -86.5], [10.5, -86.5], [10.5, -88], [9.5, -88], [9.5, -86.5], [8.5, -86.5]]), '#5b6372', 0.5);
    });
  });
  F.part('nasal', { bone: 'head', z: 35, view: 'front' }, (g) => {
    g.mat(path([[5.6, -76, 1], [9.6, -76, 1], [9, -67.5], [7.6, -66.4], [6.2, -67.5]]), PEWTER, 'metal', { hi: 0.95 });
  });
  F.part('helmetBack', { bone: 'head', z: 36, zb: 39, view: 'back' }, (g) => {
    g.mat(path([[-13, -76, 1], [19, -76, 1], [18, -64], [3, -58], [-12, -63]]), MAIL, 'metal');
    chainmail(g, path([[-13, -76, 1], [19, -76, 1], [18, -64], [3, -58], [-12, -63]]), [-13, -77, 19, -57], 1.3, '#5d6675');
  });
  if (!H) F.part('pennant', { bone: 'hat', z: 37, zb: 40, team: true }, (g) => {
    g.mat(rrect(3.2, -103, 1.8, 10, 0.8), '#6b4524', 'wood');
    g.mat(circle(4.1, -103.6, 1.6), BRASS, 'gold');
    const flag = path([[3.6, -102], [-6, -101.5], [-13.5, -99.6, 1], [-6.5, -98], [3.6, -96.4]]);
    g.mat(flag, P.team, 'cloth');
    g.stroke(spline([[3, -99.2], [-5, -99.6], [-11, -99.6]]), P.teamShade, 0.6, { lod: 1 });
  });

  // ───────── Vorderer Arm mit Zinnenschild ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(limb(15, -52, 19, -38, 5.2, 4.6), MAIL, 'metal');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 5 }, (g) => {
    g.mat(path([[16, -40], [23.5, -39.5], [24.5, -32.5], [21, -30], [16, -31.5]]), LEATHER, 'leather');
  });
  F.part('pauldronF', { bone: 'armF', z: 39, zb: 7 }, (g) => {
    g.mat(path([[7, -55], [12, -60.5], [20, -59.5], [23.5, -52], [20.5, -46], [12, -47]]), PEWTER, 'metal');
    g.stroke(spline([[9, -51], [16, -48.6], [22, -51]]), '#5b6372', 0.7, { lod: 1 });
    rivets(g, [[13, -56.5], [19.5, -55.2]], 0.9, '#d8dde4');
  });
  const shieldPts = [[10, -61, 1], [15.2, -61, 1], [15.2, -57.2, 1], [20.4, -57.2, 1], [20.4, -61, 1], [25.6, -61, 1], [25.6, -57.2, 1], [30.8, -57.2, 1], [30.8, -61, 1], [36, -61, 1], [36, -20], [23, -12.5], [10, -20]];
  const shield = path(shieldPts);
  F.part('shield', { bone: 'handF', z: 42, zb: 4, sig: true, team: true }, (g) => {
    g.mat(shield, STONE, 'stone');
    bricks(g, shield, [10, -61, 36, -12.5], 5.4, 8, '#8e877a', { lw: 0.65, lod: 1 });
    // abgeschlagene Zinne
    g.fill(poly([[36, -61], [33.9, -61], [36, -58.4]]), '#9a9384', { lod: 1 });
    // Schießscharte
    g.fill(rrect(21.4, -54.5, 3.2, 10, 1.6), INK);
    g.fill(rrect(22.1, -53.6, 0.9, 8, 0.45), '#3b3550', { lod: 1 });
    // Teamfeld
    const field = path([[14, -42], [32, -42], [32, -22.4], [23, -17.2], [14, -22.4]]);
    g.mat(field, P.team, 'cloth', { line: P.teamDeep });
    g.stroke(path([[15.5, -40.6], [30.5, -40.6], [30.5, -23.2], [23, -18.8], [15.5, -23.2]]), P.teamLight, 0.6, { lod: 1 });
    // Kerben
    lines(g, [[[35.8, -40], [34.1, -39]], [[10.2, -30], [12.1, -31.4]]], '#6f6a60', 0.6, 2);
  });
  emblem(F, 'emblem', 'handF', 43, 23, -31, 4, { zb: 3 });

  if (H) hero(F, { P, GOLD, MANE, shieldTop: -61 });

  // ───────── Animation ─────────
  F.anim({
    idle: { p: { breathe: 0.03, armF: -4, armB: 6, sway: 2, tilt: 1.5 } },
    walk: { p: { stride: 22, bob: 2.2, armSwing: 5, lean: 3, armB: 6 }, keys: { armB: { r: [[0, -12], [0.5, 12], [1, -12]] } } },
    charge: { p: { armSwing: 10 } },
    attack: {
      prog: 'atk.swing',
      hit: 0.55,
      p: { arm: 'B', wind: 160, strike: 290, over: 10, end: 360, cock: 100, snap: 210, snapOver: 6, handEnd: 360, lean: 6, lunge: 10, step: 3, windO: -14, strikeO: -26, pushO2: 3 },
      keys: { handF: { x: [[0, 0], [0.45, -1], [0.55, 3], [1, 0]] }, layer: [[0.3, 0.95, 'sword', 44, 44], [0.3, 0.95, 'armB', 45, 45], [0.3, 0.95, 'handB', 46, 46], [0.3, 0.95, 'pauldronB', 47, 47]] },
    },
    hit: { p: { knock: 3, recoil: 8 } },
    death: { p: { dir: -1, angle: 82 } },
    ...(H
      ? {
          // Triumphaler Spott: Schwert hoch, Schild gegen die Brust, Brüll-Mund
          ability: {
            prog: 'biped.idle',
            keys: {
              expr: [[0.2, 1, 'attack']],
              armB: { r: [[0, 0], [0.35, 150, 'out'], [1, 150]] },
              handB: { r: [[0, 0], [0.35, 30], [1, 30]] },
              armF: { r: [[0, 0], [0.45, -20], [0.55, -10, 'in'], [1, -10]] },
              head: { r: [[0, 0], [0.4, -8], [1, -8]] },
              cape: { r: [[0, 0], [0.5, 14], [0.8, 6], [1, 8]] },
              layer: [[0.2, 1, 'sword', 44, 44], [0.2, 1, 'armB', 45, 45], [0.2, 1, 'handB', 46, 46]],
            },
            ev: { ability: 0.55 },
          },
        }
      : {}),
  });
}

/** Rang-Merkmale des Helden: Löwenmähnen-Kragen mit Heldenumhang (Teamzone), Goldkamm, Krone auf dem Schild. */
function hero(F, { P, GOLD, MANE }) {
  F.part('heroCape', { bone: 'cape', z: 2, zb: 48, team: true }, (g) => {
    const c = path([[-12, -56], [10, -57], [14, -40], [16, -14], [6, -6], [-6, -9], [-18, -5], [-24, -16], [-20, -38]]);
    g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.35 });
    lines(g, [[[-10, -50], [-14, -12]], [[-2, -50], [-4, -10]], [[6, -50], [8, -12]]], P.teamShade, 0.8, 1);
    g.stroke(polyline([[-24, -16], [-18, -5], [-6, -9], [6, -6], [16, -14]]), GOLD, 1, { lod: 1 });
  });
  // Löwenmähnen-Kragen: zottiger Goldkranz rund um den Hals, fällt über beide Schultern
  F.part('mane', { bone: 'torso', z: 39.5, zb: 29, sig: true }, (g) => {
    const pts = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * (0.92 + (i / n) * 1.16);
      const r = i % 2 ? 16 : 22.5;
      pts.push([2 + Math.cos(a) * r * 1.2, -52 + Math.sin(a) * r * 0.62, 1]);
    }
    g.mat(path([...pts, [26, -48, 1], [20, -44], [12, -47], [2, -45.6], [-8, -47], [-16, -44], [-23, -48, 1]]), MANE, 'hair', { hi: 0.55 });
    g.mat(path([[-12, -52], [-6, -57], [2, -58.6], [10, -57], [16, -52], [10, -50], [2, -51], [-6, -50]]), '#e8a83a', 'hair', { line: '0' });
    lines(g, [[[-18, -56], [-13, -52]], [[-10, -62], [-7, -57]], [[2, -64], [2, -59]], [[13, -62], [11, -57]], [[21, -56], [17, -52]]], '#a86a1a', 0.8, 1);
  });
  F.part('clasp', { bone: 'torso', z: 29.5, view: 'front' }, (g) => {
    g.mat(circle(9, -51.6, 3.2), GOLD, 'gold');
    g.fill(circle(8.2, -52.4, 0.6), '#6a4a14', { lod: 1 });
    g.fill(circle(10, -52.4, 0.6), '#6a4a14', { lod: 1 });
    g.stroke(spline([[7.6, -50.4], [9, -49.6], [10.4, -50.4]]), '#6a4a14', 0.5, { lod: 1 });
  });
  F.part('comb', { bone: 'hat', z: 35.5, zb: 38.5 }, (g) => {
    g.mat(path([[-8, -90], [-4, -98], [4, -102, 1], [12, -99], [16, -91], [10, -93.4], [2, -95], [-4, -93.4]]), GOLD, 'gold');
    lines(g, [[[-2, -95], [0, -98.6]], [[4, -96], [5, -100]], [[10, -94.6], [11, -97.6]]], '#9a6a1a', 0.6, 1);
  });
  F.part('crown', { bone: 'handF', z: 42.5, zb: 4.5 }, (g) => {
    g.mat(path([[13, -60.6], [13, -67, 1], [17.6, -63.6], [23, -70, 1], [28.4, -63.6], [33, -67, 1], [33, -60.6]]), GOLD, 'gold');
    for (const x of [13, 23, 33]) g.mat(circle(x, x === 23 ? -70.6 : -67.6, 1.3), '#e84a5a', 'gem', { lod: 1 });
  });
  F.part('lionPommel', { bone: 'propB', z: 14.5, zb: 44.5 }, (g) => {
    g.mat(circle(-19.3, -28.4, 2.8), GOLD, 'gold');
    g.fill(circle(-19.3, -28.4, 1.2), '#9a6a1a', { lod: 1 });
  });
}
