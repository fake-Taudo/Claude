// Ronin – ruhiger Wanderschwertkämpfer mit tiefem Strohhut und herabhängendem Papiersiegel (Brief: docs/briefs/ronin.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eye, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function ronin(F) {
  const P = F.pal;
  const ROBE = P.main;
  const PAPER = P.acc;
  const HAKAMA = '#4a4038';
  const STRAW = '#d8b870';
  const SKIN = '#e8b48c';
  const STEEL = '#d8dee6';
  const LACQUER = '#2a2420';
  const ROBE_D = '#46553c';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -43],
    head: [3, -73],
    hat: [3, -82],
    armB: [-10, -69],
    handB: [-13, -50],
    armF: [11, -69],
    handF: [12, -46],
    prop: [12, -46],
    legB: [-6, -36],
    footB: [-7, -6],
    legF: [6, -36],
    footF: [7, -6],
    back: [-6, -44],
  });

  // ───────── Scheide an der Hüfte, Bambusflasche ─────────
  F.part('flask', { bone: 'back', z: 4, zb: 46 }, (g) => {
    g.mat(rrect(-16, -50, 6, 14, 2), '#a8a050', 'wood');
    lines(g, [[[-16, -45], [-10, -45]], [[-16, -40], [-10, -40]]], '#7a7430', 0.7, 1);
    g.mat(rrect(-15, -52.4, 4, 3, 1), '#6b4a2a', 'wood');
  });
  F.part('scabbard', { bone: 'hip', z: 24, zb: 24 }, (g) => {
    g.mat(path([[9, -45.6], [11, -42.4], [-21, -28.4], [-23, -31.4]]), LACQUER, 'metal', { hi: 0.7 });
    g.mat(rrect(-23.6, -32, 3.6, 3.6, 0.8), '#c8a046', 'gold', { lod: 1 });
  });
  F.part('hilt', { bone: 'hip', z: 24.5, zb: 24.5, state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'death', 'charge', 'sleep'] }, (g) => {
    g.mat(rrect(8, -47.4, 4, 3.6, 1).rot(-24, 10, -45.6), '#c8a046', 'gold');
    g.mat(path([[11, -47], [20, -51.6], [21, -49.4], [12, -44.6]]), '#3a2a20', 'leather');
    g.lod(1, (h) => {
      for (const t of [0.3, 0.55, 0.8]) h.stroke(polyline([[11 + t * 9, -46.6 - t * 4.4], [12 + t * 9, -44.6 - t * 4.4]]), PAPER, 0.5);
    });
  });

  // ───────── Hosenrock, Strohsandalen ─────────
  F.part('hakama', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    const h = path([[-12, -44], [12, -44], [16, -8], [6, -6], [0, -12], [-6, -6], [-16, -8]]);
    g.mat(h, HAKAMA, 'cloth');
    lines(g, [[[-8, -40], [-11, -9]], [[-2, -40], [-3, -12]], [[4, -40], [5, -10]], [[9, -40], [12, -9]]], '#2e2824', 0.7, 1);
    // Staub am Saum
    g.lod(1, (k) => k.fill(path([[-16, -8], [16, -8], [15, -12], [-15, -12]]), '#a89a7a', { op: 0.35 }));
  });
  const foot = (name, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(path([[x - 4, -6], [x + 4, -6], [x + 8, -2.4], [x + 8, 0, 1], [x - 5, 0, 1]]), SKIN, 'skin');
      g.mat(rrect(x - 5.4, -1.6, 14, 2, 0.8), STRAW, 'cloth');
      g.stroke(polyline([[x - 1, -5], [x + 3, -2]]), '#6b4a2a', 0.7, { lod: 1 });
    });
  };
  F.part('legB', { bone: 'legB', z: 5 }, (g) => g.mat(limb(-6, -10, -7, -5, 4, 3.6), '#c8986a', 'skin'));
  F.part('legF', { bone: 'legF', z: 6 }, (g) => g.mat(limb(6, -10, 7, -5, 4, 3.6), SKIN, 'skin'));
  foot('footB', -7, 7);
  foot('footF', 7, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-10, -69, -13, -52, 5.6, 5), ROBE_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-13.4, -49, 3), '#d8a47c', 'skin'));

  // ───────── Reisegewand mit Hüftschärpe ─────────
  F.part('robe', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const r = path([[-10, -70], [-2, -72.6], [8, -72.6], [12, -70], [13, -54], [12, -42], [-12, -42], [-12.6, -54]]);
    g.mat(r, ROBE, 'cloth');
    // gekreuzter Kragen
    g.stroke(polyline([[-2, -72], [8, -54]]), PAPER, 1.4, { lod: 0 });
    g.stroke(polyline([[8, -72], [3, -62]]), ROBE_D, 1.2, { lod: 1 });
  });
  F.part('sash', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-12.6, -47, 25.6, 5.6, 1.6), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-11, -42], [-7, -42], [-8, -34], [-11.6, -35]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });

  // ───────── Kopf, halb vom Hut verdeckt ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -82], [4, -84], [13.4, -80], [14.6, -72], [12.6, -65], [6.6, -62], [0, -63.4], [-5, -69]]), SKIN, 'skin');
  });
  F.part('topknot', { bone: 'head', z: 29, view: 'back' }, (g) => {
    g.mat(path([[-6, -80], [14, -80], [14, -70], [8, -64], [-1, -64], [-6, -70]]), '#1a1418', 'hair');
  });
  faceSet(F, {
    eyes: [[11, -73, 2.2], [4, -73, 2]],
    iris: '#2a1a14',
    lidColor: SKIN,
    lid: 0.5,
    brow: { color: '#1a1418', w: 1.3, lift: 0.3 },
    mouth: [8.8, -66.4, 3.8],
    mood: 'neutral',
    attackMouth: 'clench',
  });
  F.part('stubble', { bone: 'head', z: 33.2, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[5, -64], [7, -63.2], [9.6, -63], [12, -64]]) g.fill(circle(x, y, 0.45), '#6a5040');
  });
  // tiefer Strohhut (Signature): Krempe breiter als die Schultern, Flechtmuster
  F.part('hat', { bone: 'hat', z: 36, zb: 36, sig: true }, (g) => {
    const brim = path([[-24, -71, 1], [-8, -84], [3, -94, 1], [14, -84], [30, -71, 1], [14, -74.6], [3, -76], [-8, -74.6]]);
    g.mat(brim, STRAW, 'wood', { hi: 0.35 });
    g.clipTo(brim, (h) => {
      for (let i = -6; i <= 6; i++) h.stroke(polyline([[3, -94], [3 + i * 5, -70]]), '#b8964e', 0.6, { lod: 1 });
      for (const k of [0.35, 0.65]) h.stroke(spline([[-24 + 27 * k, -71 - 23 * k], [3, -94 + 18 * (1 - k)], [30 - 27 * k, -71 - 23 * k]]), '#b8964e', 0.5, { lod: 2 });
    });
  });
  // Papiersiegel an einem Band (Band = Teamzone)
  F.part('seal', { bone: 'hat', z: 37, zb: 37 }, (g) => {
    g.mat(path([[24, -72], [29, -72], [29.6, -56], [27, -54, 1], [24.4, -56]]), PAPER, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => {
      h.stroke(polyline([[25.4, -68], [28, -68]]), '#c83a2a', 0.8);
      h.stroke(polyline([[26.6, -66], [26.8, -59]]), '#3a2a20', 0.7);
      h.stroke(polyline([[25.4, -62.6], [28.2, -63]]), '#3a2a20', 0.6);
    });
  });
  F.part('sealBand', { bone: 'hat', z: 36.8, zb: 36.8, team: true }, (g) => {
    g.mat(path([[24.6, -73.6], [28.6, -73.6], [28, -70.6], [25, -70.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.stroke(polyline([[26.6, -76], [26.6, -73]]), P.teamShade, 0.8);
  });

  // ───────── Langschwert (gezogen im Angriff) und vorderer Arm ─────────
  const ang = (156 * Math.PI) / 180;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const at = (s, t) => [12 + ux * s - uy * t, -46 + uy * s + ux * t];
  F.part('sword', { bone: 'prop', z: 38, zb: 4, state: ['attack', 'ability'] }, (g) => {
    g.mat(path([at(-9, -1.2), at(-9, 1.2), at(1, 1.2), at(1, -1.2)]), '#3a2a20', 'leather');
    g.mat(rrect(...at(1.6, 0).map((v, i) => v - [2, 2][i]), 4, 4, 1), '#c8a046', 'gold');
    g.mat(path([at(3, -1.2), at(36, -0.6), [...at(39, 0.8), 1], at(3, 1.6)]), STEEL, 'metal', { hi: 1 });
    g.stroke(polyline([at(4, 0.6), at(35, 0.6)]), '#a8b0ba', 0.4, { lod: 1 });
  });
  F.part('parry', { bone: 'prop', z: 39, state: 'hit', glow: true }, (g) => {
    for (const [dx, dy] of [[8, -10], [12, -4], [6, -14], [14, -10]]) g.stroke(polyline([[20, -56], [20 + dx, -56 + dy]]), '#ffe08a', 1);
    g.fill(circle(20, -56, 2.4), '#fff4c8');
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(11, -69, 12, -49, 5.6, 5), ROBE, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(12.6, -46, 3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 23, -5, -58, 2.2, { zb: 23 });

  F.anim({
    // steht still, die Hand am Griff
    idle: { p: { breathe: 0.015, bob: 0.3, sway: 0.4, tilt: 0.5 }, keys: { hat: { r: [[0, 0], [0.5, 1.5], [1, 0]] } } },
    walk: { p: { stride: 20, bob: 1.2, armSwing: 2, lean: 2 }, ev: { step: [0.25, 0.75] } },
    // Ziehen und Schlag in einer Bewegung
    attack: { prog: 'atk.swing', hit: 0.5, p: { wind: 10, strike: -125, over: -15, cock: 10, snap: 70, lean: -4, lunge: 14, step: 6, windO: 10, strikeO: 20 } },
    // Parade mit Funken
    hit: { p: { knock: 1, recoil: 3 }, keys: { armF: { r: [[0, 0], [0.2, -80], [1, 0]] } } },
    spawn: { ev: { land: 0.55 } },
    // sinkt auf ein Knie, der Hut fällt
    death: { p: { dir: -1, angle: 60 }, keys: { hat: { y: [[0, 0], [0.4, 0], [1, 30, 'in']], r: [[0, 0], [1, -40]] } } },
  });
}
