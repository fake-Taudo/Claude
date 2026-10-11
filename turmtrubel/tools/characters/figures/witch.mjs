// Hexe – gackernde, verschlagene Zauberin mit doppelt geknicktem Hut, Krähe auf der Spitze und Knochen-Windspiel-Stab
// (Brief: docs/briefs/witch.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { faceSet, eye, eyeClosed, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function witch(F) {
  const P = F.pal;
  const COAT = P.main;
  const LILAC = P.acc;
  const CROW = '#2a2632';
  const BONE = '#e8dfc8';
  const SKIN = '#d8c8a8';
  const COAT_D = '#34552a';
  const FELT = '#2e2a36';
  const HAIR = '#5a5a6a';
  const BRANCH = '#6a4a2e';

  F.rig(
    'robe',
    {
      hip: [0, -36],
      skirt: [0, -36],
      torso: [0, -39],
      head: [4, -64],
      hat: [4, -82],
      armB: [-8, -62],
      handB: [-11, -44],
      armF: [10, -62],
      handF: [18, -46],
      prop: [18, -46],
      cape: [-3, -62],
      crow: [-6, -122],
      crowWing: [-8, -128],
    },
    { crow: 'hat', crowWing: 'crow' },
  );

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-8, -62, -11, -47, 4.6, 4), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => {
    g.mat(path([[-14, -46], [-9, -46.6], [-8, -42], [-11, -39], [-14, -41]]), SKIN, 'skin');
    g.lod(1, (h) => h.stroke(polyline([[-13, -40], [-15, -36.6]]), SKIN, 1.2));
  });

  // ───────── Mantel mit Zackensaum, Futter (Teamzone), Schnabelschuhe ─────────
  F.part('shoes', { bone: 'skirt', z: 4 }, (g) => {
    for (const x of [-6, 6]) g.mat(path([[x - 4, -4], [x + 4, -4.6], [x + 9, -2], [x + 12, -6, 1], [x + 12.6, -3], [x + 9, 0, 1], [x - 4.6, 0, 1]]), '#3a2a3a', 'leather', { hi: 0.5 });
  });
  F.part('lining', { bone: 'skirt', z: 16, zb: 16, team: true }, (g) => {
    g.mat(path([[-12, -30], [-15, -16], [-20, -4], [-14, -6], [-10, -2], [-6, -6], [-2, -2], [2, -8], [-4, -30]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
  });
  F.part('coat', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    // Zackensaum vorn, hinten öffnet sich der Mantel und zeigt das Futter
    const c = path([[-10, -40], [10, -40], [14, -22], [19, -5], [15, -8], [12, -2], [8, -7], [4, -1], [1, -8], [-4, -24], [-10, -30]]);
    g.mat(c, COAT, 'cloth', { hi: 0.35 });
    g.clipTo(c, (h) => {
      lines(h, [[[4, -38], [8, -10]], [[-3, -38], [-4, -24]]], COAT_D, 0.8, 1);
      // Flicken mit Stern
      h.fill(rrect(7, -26, 7, 7, 0.6), '#7a6a3a', { lod: 1 });
      h.fill(star(10.5, -22.5, 2.2, 0.9, 5), '#f0d060', { lod: 1 });
      h.lod(2, (k) => stitches(k, [[7, -26], [14, -26], [14, -19], [7, -19], [7, -26]], '#c8b890'));
    });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-9, -60], [-2, -62.6], [7, -62.6], [10, -60], [10.6, -46], [9, -38], [-9, -38], [-10, -46]]);
    g.mat(t, COAT, 'cloth', { hi: 0.4 });
    for (const y of [-56, -50, -44]) g.mat(rrect(4.6, y - 0.8, 3.6, 1.6, 0.8), BONE, 'bone', { lod: 1 });
    g.mat(rrect(-10, -42, 21, 3.6, 1), '#3a2a1e', 'leather');
  });
  F.part('collar', { bone: 'torso', z: 23, zb: 23 }, (g) => {
    g.mat(path([[-10, -62], [-2, -60], [6, -63], [12, -61], [9, -56, 1], [5, -59], [0, -55, 1], [-4, -59], [-9, -55, 1]]), COAT_D, 'cloth');
  });

  // ───────── Kopf: spitze Nase, spitzes Kinn, schiefes Grinsen ─────────
  F.part('hairBack', { bone: 'head', z: 28, zb: 34 }, (g) => {
    g.mat(path([[-6, -78], [-10, -66], [-12, -52], [-7, -56], [-4, -50], [-2, -62], [2, -74]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    // langes Gesicht mit Spitzkinn
    g.mat(path([[-4, -78], [4, -80.6], [12.6, -77], [14.4, -70], [13, -63], [12, -57, 1], [6, -59], [0, -62], [-4.6, -68]]), SKIN, 'skin');
    g.lod(1, (h) => h.fill(circle(1, -66, 1), '#8a7a5a'));
  });
  faceSet(F, {
    eyes: [[10.4, -71.6, 2], [4.4, -71.6, 1.8]],
    iris: '#c8a020',
    lidColor: SKIN,
    lid: 0.5,
    look: [0.7, 0],
    brow: { color: '#4a4a5a', w: 1.1, lift: 0.3 },
    idleTilt: 1,
    mouth: [8.6, -63, 4.6],
    mood: 'smirk',
    attackMouth: 'grin',
    idle: (g) => {
      // ein einzelner Zahn im schiefen Grinsen
      g.fill(rrect(10, -63.2, 1.4, 1.8, 0.4), WHITE, { stroke: INK, lw: 0.35 });
    },
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    // lange Hakennase
    g.mat(path([[9, -72], [14, -68], [18.6, -65.6, 1], [14, -66], [10, -66.6]]), '#cdb894', 'skin', { line: '#9a8664', lw: 0.5 });
    g.fill(circle(15.6, -68.4, 0.7), '#8a7a5a', { lod: 1 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.mat(path([[-5, -78], [14, -78], [14, -66], [10, -58], [0, -60], [-5, -68]]), HAIR, 'hair'));

  // ───────── Doppelt geknickter Hut mit Löchern, Hutband (Teamzone) ─────────
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-14, -76, 1], [-6, -80.6], [4, -82], [16, -80.6], [22, -76.6, 1], [12, -78], [4, -78.4], [-6, -78]]), FELT, 'cloth', { hi: 0.3 });
    // Kegel, erster Knick nach hinten, zweiter nach vorn
    g.mat(path([[-4, -80], [-2, -94], [-6, -104], [-10, -110], [-6, -116], [-2, -118, 1], [-4, -112], [0, -106], [4, -96], [12, -80]]), FELT, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => {
      lines(h, [[[2, -82], [0, -96]], [[-4, -102], [-6, -110]]], '#4a4656', 0.6, 1);
      // Loch mit Flicken-Rand
      h.fill(ellipse(5, -90, 1.4, 1), '#121018');
      h.fill(ellipse(-5, -104, 1, 0.8), '#121018');
    });
  });
  F.part('hatBand', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-3.6, -80], [11.6, -80], [10.8, -84.6], [-3, -84]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(rrect(3, -85, 4, 5.6, 0.6), BONE, 'bone', { lod: 1 });
  });
  F.part('evoBrim', { bone: 'hat', z: 36.6, zb: 36.6, evo: 'evo', glow: true }, (g) => {
    g.stroke(spline([[-14, -76], [-6, -80.4], [4, -81.6], [16, -80.4], [22, -76.6]]), LILAC, 1.6);
  });

  // ───────── Krähe auf der Hutspitze (Signature) ─────────
  F.part('crow', { bone: 'crow', z: 37, zb: 37, sig: true }, (g) => {
    g.mat(blob([[-12, -122], [-6, -127], [1, -125], [3, -120], [-2, -117], [-10, -118]], 0.6), CROW, 'cloth', { hi: 0.5 });
    // Schwanz
    g.mat(path([[-11, -120], [-18, -116, 1], [-17, -120], [-12, -122]]), CROW, 'cloth');
    g.mat(circle(2, -127.6, 3.4), CROW, 'cloth', { hi: 0.5 });
    g.stroke(polyline([[-5, -117], [-4, -114]]), '#c8a020', 0.6);
    g.stroke(polyline([[-1, -117.6], [0, -114]]), '#c8a020', 0.6);
  });
  F.part('crowBeak', { bone: 'crow', z: 37.5, zb: 37.5, expr: ['idle', 'hurt', 'stun', 'death', 'sleep'] }, (g) => {
    g.mat(path([[4.6, -129], [10, -127], [4.6, -126]]), '#f0c030', 'bone');
    g.fill(circle(2.6, -128.4, 0.9), WHITE);
    g.fill(circle(2.9, -128.4, 0.5), INK);
  });
  F.part('crowBeakOpen', { bone: 'crow', z: 37.5, zb: 37.5, expr: ['attack', 'ability'] }, (g) => {
    g.mat(path([[4.6, -129], [10, -131], [5, -127.6]]), '#f0c030', 'bone');
    g.mat(path([[4.6, -126.6], [9.6, -124.6], [4.6, -125.6]]), '#f0c030', 'bone');
    g.fill(circle(2.6, -128.4, 0.9), WHITE);
    g.fill(circle(2.9, -128.4, 0.5), INK);
  });
  F.part('crowWing', { bone: 'crowWing', z: 37.6, zb: 36.9 }, (g) => {
    g.mat(path([[-8, -126], [-2, -125], [-4, -120], [-10, -118, 1], [-14, -117]]), '#3a3644', 'cloth', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-6, -123], [-11, -118]], [[-3, -122], [-7, -119]]], '#14121a', 0.5, 1));
  });
  // Evo: geisterhafte zweite Krähe
  F.part('evoCrow', { bone: 'hat', z: 37.8, zb: 37.8, evo: 'evo', glow: true }, (g) => {
    g.fill(blob([[14, -108], [20, -112], [26, -110], [24, -106], [18, -104]], 0.6), '#e8d0ff', { op: 0.55 });
    g.fill(path([[18, -110], [24, -120, 1], [22, -110]]), '#e8d0ff', { op: 0.45 });
    g.fill(circle(25, -109.6, 0.8), '#ffffff');
  });

  // ───────── Knochen-Windspiel-Stab ─────────
  const CHIMES = [[24, -88, 9], [27, -88.6, 12], [30, -89, 8], [33, -88.6, 11], [36, -87.6, 7]];
  F.part('staff', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    // krummer Ast mit Haken nach vorn
    g.mat(path([[16, -4], [18.6, -4], [20, -30], [19, -52], [22, -76], [24, -86], [30, -92], [38, -90], [40, -86, 1], [37, -88], [30, -89.4], [25, -84], [21, -74], [17, -52], [17.6, -30]]), BRANCH, 'wood', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[18, -20], [18.6, -36]], [[20, -60], [21, -70]]], '#4a3018', 0.5, 1));
    for (const [x, y, len] of CHIMES) {
      g.stroke(polyline([[x, y], [x, y + 4]]), '#c8b890', 0.4);
      g.mat(rrect(x - 1.1, y + 4, 2.2, len, 1), BONE, 'bone', { hi: 0.5 });
      g.lod(1, (h) => h.fill(circle(x, y + 4 + len * 0.3, 0.5), '#8a7a5a'));
    }
  });
  F.part('soulLights', { bone: 'prop', z: 38.5, zb: 4.5, evo: 'evo', glow: true }, (g) => {
    for (const [x, y, len] of CHIMES) g.fill(circle(x, y + 5 + len, 1.4), LILAC, { op: 0.8 });
  });
  F.part('ghostBall', { bone: 'prop', z: 39, zb: 5, state: 'cast', glow: true }, (g) => {
    g.fill(circle(44, -96, 6), '#c8a2e8', { op: 0.5 });
    g.fill(circle(44, -96, 3.6), '#f0e4ff');
    g.fill(circle(42.6, -97, 0.8), '#5a3a8a');
    g.fill(circle(45.4, -97, 0.8), '#5a3a8a');
  });
  F.part('summonRing', { bone: 'skirt', z: 2, zb: 2, state: 'spawnUnit', glow: true }, (g) => {
    g.stroke(ellipse(4, -1, 22, 5), LILAC, 1.6, { op: 0.8 });
    for (const a of [0, 72, 144, 216, 288]) {
      const r = (a * Math.PI) / 180;
      g.fill(circle(4 + Math.cos(r) * 22, -1 + Math.sin(r) * 5, 1.2), '#f0e4ff');
    }
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(10, -62, 17, -48, 4.6, 4), COAT, 'cloth'));
  F.part('cuff', { bone: 'armF', z: 29.5, zb: 6.5 }, (g) => g.mat(path([[12, -52], [21, -49], [20, -45], [13, -47]]), COAT_D, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(path([[15, -49], [21, -49.6], [22, -45], [18, -42.6], [15, -44.4]]), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -5, -50, 2.2, { zb: 24 });

  F.anim({
    // die Krähe putzt sich, das Windspiel klimpert
    idle: {
      p: { breathe: 0.03, bob: 0.6, sway: 1.5, tilt: 2 },
      keys: { crow: { r: [[0, 0], [0.3, 0], [0.4, 18], [0.5, 4], [0.6, 18], [0.7, 0]] }, crowWing: { r: [[0, 0], [0.35, -20], [0.65, -20], [0.75, 0]] }, prop: { r: [[0, 0], [0.5, 3], [1, 0]] } },
    },
    // schleichender Schritt, der Hut wippt
    walk: { p: { stride: 6, bob: 1.6, armSwing: 4, skirt: 4, lean: 4 }, keys: { hat: { r: [[0, -3], [0.5, 4], [1, -3]] } } },
    // Stab vor, Windspiel klingt, Geisterkugel; die Krähe krächzt und schlägt mit den Flügeln
    attack: {
      prog: 'atk.cast',
      hit: 0.6,
      p: { wind: 20, strike: -30, windB: -20, strikeB: 10, lean: 6, lunge: 8 },
      keys: { prop: { r: [[0, 0], [0.45, -12], [0.6, 62, 'out'], [0.78, 56], [1, 0, 'io']] }, crowWing: { r: [[0, 0], [0.4, -50], [0.5, 10], [0.6, -50], [0.7, 10], [1, 0]] }, crow: { r: [[0, 0], [0.5, -10], [1, 0]] } },
      ev: { release: 0.6 },
    },
    // die Krähe flattert auf
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { crow: { y: [[0, 0], [0.3, -8], [1, 0]] }, crowWing: { r: [[0, 0], [0.2, -60], [0.4, 0], [0.6, -60], [1, 0]] } } },
    // landet in Rauch, die Krähe landet nach ihr
    spawn: { keys: { crow: { y: [[0, -24], [0.5, -24], [0.9, 0, 'out']], x: [[0, -10], [0.9, 0]] }, crowWing: { r: [[0, -60], [0.3, 0], [0.5, -60], [0.8, 0]] } } },
    // ruft Skelette: Stab hoch, Ring am Boden
    spawnUnit: { prog: 'atk.cast', hit: 0.4, p: { wind: 10, strike: -95, windB: -30, strikeB: -60, lean: -4, lunge: 2 }, keys: { prop: { r: [[0, 0], [0.32, 8], [0.4, 92], [0.6, 92], [1, 0]] }, crowWing: { r: [[0, 0], [0.3, -50], [0.5, 0], [0.7, -50], [1, 0]] } }, ev: { spawnUnit: 0.35 } },
    // löst sich in Federn auf, die Krähe fliegt davon
    death: { p: { dir: -1, angle: 50 }, keys: { crow: { y: [[0, 0], [0.2, 0], [1, -40]], x: [[0, 0], [0.2, 0], [1, -30]], r: [[0, 0], [1, 20]] }, crowWing: { r: [[0, 0], [0.3, -60], [0.45, 10], [0.6, -60], [0.75, 10], [0.9, -60]] } } },
  });
}
