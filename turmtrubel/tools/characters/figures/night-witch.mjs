// Nachthexe – träge, spöttische Hexe im Mitternachtsmantel; ihr Hut ist ein Glockenturm, in dem Fledermäuse schlafen
// (Brief: docs/briefs/night-witch.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { faceSet, eyeClosed, bricks, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function nightWitch(F) {
  const P = F.pal;
  const COAT = P.main;
  const SILVER = P.acc;
  const WALL = '#4a4060';
  const BELL = '#c8ccd8';
  const SKIN = '#d0c8e0';
  const HAIR = '#1a1426';
  const COAT_D = '#1c1630';
  const SLATE = '#2a2440';
  const BAT = '#3a2e4a';

  F.rig(
    'robe',
    {
      hip: [0, -36],
      skirt: [0, -36],
      torso: [0, -39],
      head: [4, -63],
      hat: [3, -80],
      armB: [-8, -62],
      handB: [-11, -44],
      armF: [10, -62],
      handF: [18, -46],
      prop: [18, -46],
      cape: [-3, -62],
      bell: [3, -105],
      batFly: [3, -102],
    },
    { bell: 'hat', batFly: 'hat' },
  );

  // kleine Fledermaus (kopfüber hängend oder fliegend)
  const bat = (g, x, y, s, hang) => {
    if (hang) {
      g.mat(ellipse(x, y + 2.4 * s, 1.8 * s, 2.6 * s), BAT, 'cloth');
      g.mat(path([[x - 1.8 * s, y + 1 * s], [x - 2.6 * s, y + 4 * s], [x - 1.4 * s, y + 4.6 * s, 1]]), BAT, 'cloth');
      g.mat(path([[x + 1.8 * s, y + 1 * s], [x + 2.6 * s, y + 4 * s], [x + 1.4 * s, y + 4.6 * s, 1]]), BAT, 'cloth');
      g.stroke(polyline([[x, y], [x, y + 0.6 * s]]), INK, 0.5);
    } else {
      g.mat(path([[x - 6 * s, y - 1 * s], [x - 3 * s, y - 2.6 * s], [x - 1.4 * s, y - 0.6 * s], [x, y - 1.6 * s], [x + 1.4 * s, y - 0.6 * s], [x + 3 * s, y - 2.6 * s], [x + 6 * s, y - 1 * s], [x + 4 * s, y + 0.4 * s, 1], [x + 2.4 * s, y + 1.6 * s], [x, y + 1.4 * s, 1], [x - 2.4 * s, y + 1.6 * s], [x - 4 * s, y + 0.4 * s, 1]]), BAT, 'cloth');
      g.fill(circle(x - 0.6 * s, y - 0.4 * s, 0.4 * s), '#ffd27a');
      g.fill(circle(x + 0.6 * s, y - 0.4 * s, 0.4 * s), '#ffd27a');
    }
  };

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-8, -62, -11, -47, 4.4, 3.8), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-11, -43.6, 2.8), SKIN, 'skin'));

  // ───────── Mantel mit Mondsicheln am Saum, Futter (Teamzone), spitze Stiefel ─────────
  F.part('boots', { bone: 'skirt', z: 4 }, (g) => {
    for (const x of [-5, 6]) g.mat(path([[x - 3.6, -6], [x + 3.4, -6.4], [x + 4, -2], [x + 11, -0.6, 1], [x + 9, 0, 1], [x - 4, 0, 1]]), '#1a1424', 'leather', { hi: 0.6 });
  });
  F.part('lining', { bone: 'skirt', z: 16, zb: 16, team: true }, (g) => {
    g.mat(path([[-12, -32], [-16, -16], [-22, -1], [-6, -2], [-3, -30]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
  });
  F.part('coat', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    // schleppender Saum
    const c = path([[-10, -40], [10, -40], [14, -22], [20, -2], [6, -1.4], [-6, -1.6], [-10, -6], [-6, -26], [-11, -32]]);
    g.mat(c, COAT, 'cloth', { hi: 0.3 });
    g.clipTo(c, (h) => {
      lines(h, [[[3, -38], [6, -6]], [[-4, -36], [-6, -10]]], COAT_D, 0.8, 1);
      for (const [x, y] of [[14, -5], [6, -4.6], [-2, -4.6]]) {
        h.fill(circle(x, y, 1.8), SILVER, { lod: 1 });
        h.fill(circle(x + 0.9, y - 0.5, 1.6), COAT, { lod: 1 });
      }
    });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-9, -60], [-2, -62.6], [7, -62.6], [10, -60], [10.6, -46], [9, -38], [-9, -38], [-10, -46]]), COAT, 'cloth', { hi: 0.4 });
    g.mat(rrect(-10, -42, 21, 3, 1), SLATE, 'leather');
  });
  // Sichelbrosche
  F.part('brooch', { bone: 'torso', z: 24.5, view: 'front' }, (g) => {
    const o = arc(6, -55, 2.8, 2.8, 60, 300, 8);
    const i = arc(7.2, -55.4, 2.2, 2.2, 290, 70, 8);
    g.mat(path([...o.map((p, k) => (k === 0 || k === o.length - 1 ? [...p, 1] : p)), ...i]), SILVER, 'metal', { hi: 0.9 });
  });
  // Fledermaus-Zackenkragen
  F.part('batCollar', { bone: 'torso', z: 26, zb: 38 }, (g) => {
    g.mat(path([[-11, -60], [-16, -66], [-13, -68], [-15, -74, 1], [-10, -70], [-8, -78, 1], [-4, -68], [6, -64], [12, -70, 1], [12, -64], [16, -66, 1], [12, -58], [2, -59]]), COAT_D, 'cloth', { hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-12, -62], [-14, -70]], [[-8, -63], [-8, -74]]], '#0c0a18', 0.5, 1));
  });

  // ───────── Kopf: blass, gelangweilt, dunkle Lippen ─────────
  F.part('hairBack', { bone: 'head', z: 28, zb: 34 }, (g) => {
    g.mat(path([[-5, -78], [-9, -64], [-10, -48], [-4, -52], [-2, -66], [3, -76]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-4, -77], [4, -79.6], [12, -76], [13.6, -69], [12, -62], [7, -58], [1, -60], [-4, -66]]), SKIN, 'skin');
    g.fill(ellipse(10, -64.6, 1.6, 1), '#b8a8d0', { op: 0.6, lod: 1 });
  });
  faceSet(F, {
    eyes: [[10, -70.6, 2], [4.2, -70.6, 1.8]],
    iris: '#8a5ab8',
    lidColor: '#b0a4c8',
    lid: 0.62,
    look: [0.5, 0.2],
    brow: { color: HAIR, w: 0.9, lift: 0.5 },
    mouth: [8.2, -62.6, 3.8],
    mood: 'smirk',
    attackMouth: 'grin',
  });
  F.part('lips', { bone: 'head', z: 32.6, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    g.stroke(spline([[6.4, -62.8], [8.4, -62.4], [10.2, -63.4]]), '#4a2a4a', 1.1);
  });
  // Gähnen (eigener Ausdruck in der Ruhe)
  F.part('face.yawn', { bone: 'head', z: 32, view: 'front', expr: 'yawn' }, (g) => {
    eyeClosed(g, 10, -70.6, 2, { lw: 0.8 });
    eyeClosed(g, 4.2, -70.6, 1.8, { lw: 0.8 });
    g.fill(ellipse(8.4, -62.2, 2, 2.6), '#3a1a2e', { stroke: '#4a2a4a', lw: 0.8 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[9, -70], [12.4, -66, 1], [9.4, -65.6]]), '#c0b4d4', 'skin', { line: '#8a7aa8', lw: 0.5 }));
  F.part('hairFront', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[-5, -68], [-4.6, -77], [2, -80.6], [10, -80], [13.6, -75], [8, -76.4], [4, -74], [0, -76], [-2, -70]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.mat(path([[-5, -78], [13, -78], [13.6, -66], [8, -54], [0, -54], [-5, -64]]), HAIR, 'hair'));

  // ───────── Glockenturm-Hut (Signature): Mauer, offene Glockenstube, Spitzdach ─────────
  F.part('tower', { bone: 'hat', z: 36, zb: 36, sig: true }, (g) => {
    g.mat(path([[-12, -76, 1], [-4, -79.6], [4, -80.6], [14, -79.6], [20, -76, 1], [12, -77], [4, -77.4], [-4, -77]]), SLATE, 'cloth', { hi: 0.3 });
    g.stroke(spline([[-12, -76], [-4, -77], [4, -77.4], [12, -77], [20, -76]]), SILVER, 0.7, { lod: 1 });
    const wall = path([[-5, -78], [11, -78], [10.4, -96], [-4.4, -96]]);
    g.mat(wall, WALL, 'stone', { hi: 0.3 });
    g.lod(1, (h) => bricks(h, wall, [-6, -97, 12, -77], 3.4, 5, '#2e2840', { lw: 0.5 }));
    // Glockenstube: dunkler Raum, zwei Pfeiler mit Bogen
    g.fill(rrect(-4, -106, 14, 10.4, 0), '#2a1f45');
    g.fill(ellipse(3, -100, 5, 4), '#4a3a70', { op: 0.6 });
    g.mat(path([[-5, -96], [-5, -106], [-2, -106], [-2, -96]]), WALL, 'stone');
    g.mat(path([[8, -96], [8, -106], [11, -106], [11, -96]]), WALL, 'stone');
    g.mat(path([[-6, -97.4], [12, -97.4], [12, -95.6], [-6, -95.6]]), '#5a5070', 'stone');
    // Spitzdach mit Mond-Wetterfahne
    g.mat(path([[-8, -105], [14, -105], [3, -120, 1]]), SLATE, 'stone', { hi: 0.5 });
    g.lod(1, (h) => lines(h, [[[-4, -107], [10, -107]], [[-1, -111], [7, -111]]], '#1a1630', 0.5, 1));
    g.stroke(polyline([[3, -120], [3, -124]]), SILVER, 0.8);
    const o = arc(3, -126.6, 2.6, 2.6, 60, 300, 8);
    const i = arc(4.2, -127, 2, 2, 290, 70, 8);
    g.mat(path([...o.map((p, k) => (k === 0 || k === o.length - 1 ? [...p, 1] : p)), ...i]), SILVER, 'metal', { hi: 0.9 });
    // Spinnweben in der Ecke
    g.lod(2, (h) => {
      h.stroke(polyline([[-4, -106], [-1, -103]]), '#9a94b0', 0.3);
      h.stroke(spline([[-4, -103.6], [-2.4, -103.8], [-1.6, -105.6]]), '#9a94b0', 0.3);
    });
  });
  // kopfüber hängende Fledermäuse unter dem Dachrand
  F.part('hangingBats', { bone: 'hat', z: 36.2, zb: 36.2 }, (g) => {
    bat(g, -7, -105, 1, true);
    bat(g, 13, -105, 0.9, true);
  });
  F.part('bell', { bone: 'bell', z: 36.3, zb: 36.3 }, (g) => {
    g.mat(path([[1, -104.6], [5, -104.6], [6, -101], [8, -98, 1], [-2, -98, 1], [0, -101]]), BELL, 'metal', { hi: 0.9 });
    g.mat(circle(3, -97.4, 1), '#8a8ea0', 'metal');
  });
  F.part('peekBat', { bone: 'hat', z: 36.25, state: 'peek' }, (g) => {
    g.mat(path([[6, -100], [8, -103], [9.6, -100.6], [9, -98]]), BAT, 'cloth');
    g.fill(circle(8, -100.4, 0.5), '#ffd27a');
  });
  // Glockenseil (Teamzone) außen am Turm
  F.part('bellRope', { bone: 'hat', z: 36.4, zb: 36.4, team: true }, (g) => {
    g.stroke(spline([[11, -100], [13, -94], [12.6, -86], [13.4, -80]]), P.team, 1.2);
    g.mat(path([[12, -81], [15, -81], [15.8, -75, 1], [11.4, -75, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('flyBats', { bone: 'batFly', z: 46, zb: 46, state: ['spawnUnit', 'escape'] }, (g) => {
    bat(g, -6, -106, 1.1, false);
    bat(g, 12, -110, 1, false);
  });
  F.part('ring', { bone: 'hat', z: 46.5, zb: 46.5, state: ['ring', 'spawnUnit'], glow: true }, (g) => {
    for (const r of [8, 12]) g.stroke(spline(arc(3, -100, r, r * 0.8, -40, 40, 6)), SILVER, 0.8, { op: 0.8 });
    for (const r of [8, 12]) g.stroke(spline(arc(3, -100, r, r * 0.8, 140, 220, 6)), SILVER, 0.8, { op: 0.8 });
  });

  // ───────── Sichelstab mit Mondsichel-Klinge ─────────
  F.part('staff', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[16.6, -2], [18.6, -2], [21, -92], [19, -92]]), '#2a2236', 'wood', { hi: 0.5 });
    g.lod(1, (h) => {
      for (const y of [-40, -60]) h.mat(rrect(16.6 + (-y / 92) * 2.4, y - 1, 3.4, 2, 0.6), SILVER, 'metal');
    });
    // Mondsichel-Klinge, öffnet nach vorn unten
    const o = arc(26, -92, 12, 10, 200, 360, 12);
    const i = arc(27, -89, 9, 6, 345, 205, 12);
    g.mat(path([...o.map((p, k) => (k === 0 || k === o.length - 1 ? [...p, 1] : p)), ...i]), SILVER, 'metal', { hi: 0.95 });
    g.stroke(spline(arc(26, -92, 11, 9, 210, 350, 8)), '#ffffff', 0.6, { lod: 1 });
  });
  F.part('slash', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    g.stroke(spline(arc(20, -60, 30, 34, -70, 40, 10)), '#e0d8ff', 2.4, { op: 0.6 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(10, -62, 17, -48, 4.4, 3.8), COAT, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(path([[15, -49], [21, -49.6], [22, -45], [18, -42.6], [15, -44.4]]), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -5, -50, 2.2, { zb: 24 });

  F.anim({
    // die Glocke schwingt, eine Fledermaus guckt heraus; gähnt
    idle: {
      p: { breathe: 0.02, bob: 0.5, sway: 1, tilt: 1.5 },
      keys: { bell: { r: [[0, 0], [0.12, 14], [0.25, -12], [0.38, 8], [0.5, 0]] }, show: { peek: [[0.3, 0.55]] }, expr: [[0.65, 0.85, 'yawn']], head: { r: [[0, 0], [0.62, 0], [0.7, -10], [0.85, -10], [0.92, 0]] } },
    },
    // schwebender Gang, der Mantel schleift
    walk: { p: { stride: 4, bob: 1, armSwing: 3, skirt: 3 }, keys: { root: { y: [[0, -1], [0.5, -2], [1, -1]] }, bell: { r: [[0, -6], [0.5, 6], [1, -6]] } } },
    // Sichelstab-Hieb mit Drehung
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -120, strike: -20, over: 10, cock: -30, snap: 50, lean: 10, lunge: 14 }, keys: { root: { sx: [[0, 1], [0.22, 1], [0.32, -1], [0.44, 1]] }, show: { muzzle: [[0.55, 0.7]] } }, ev: { release: 0.55 } },
    // Glocke bimmelt, Fledermäuse flattern
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { bell: { r: [[0, 0], [0.2, 26], [0.5, -20], [1, 0]] }, show: { ring: [[0, 0.6]] } } },
    // landet, die Glocke läutet einmal
    spawn: { keys: { bell: { r: [[0, 0], [0.6, 0], [0.75, 24], [0.9, -16], [1, 0]] }, show: { ring: [[0.6, 1]] } } },
    // Fledermäuse rufen: Glocke schwingt stark, zwei Fledermäuse fliegen aus dem Hut
    spawnUnit: {
      keys: {
        bell: { r: [[0, 0], [0.15, 34], [0.3, -30], [0.45, 26], [0.6, -18], [0.8, 8], [1, 0]] },
        batFly: { y: [[0, 6], [0.3, 0], [1, -30, 'out']], x: [[0, 0], [0.3, 0], [1, 14]], sx: [[0, 0.4], [0.3, 1]], sy: [[0, 0.4], [0.3, 1]] },
        head: { r: [[0, 0], [0.2, -6], [0.6, -6], [1, 0]] },
        alpha: [[0, 1], [1, 1]],
      },
      ev: { spawnUnit: 0.3 },
    },
    // Glocke läutet ein letztes Mal, eine Fledermaus fliegt heraus, sie verblasst
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], bell: { r: [[0, 0], [0.2, 26], [0.4, -20], [0.6, 10], [0.8, 0]] }, show: { ring: [[0, 0.5]], escape: [[0.2, 1.01]] }, batFly: { y: [[0, 0], [0.2, 0], [1, -40]], x: [[0, 0], [0.2, 0], [1, -16]] }, root: { y: [[0, 0], [1, -8]] }, alpha: [[0, 1], [0.4, 1], [1, 0]] } },
  });
}
