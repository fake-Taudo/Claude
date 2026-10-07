// Goldener Ritter – eitler Sonnenritter in polierter Goldrüstung mit Strahlenkranz und schlankem Rapier
// (Brief: docs/briefs/golden-knight.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eye, eyeClosed, chainmail, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function goldenKnight(F) {
  const P = F.pal;
  const GOLD = P.main;
  const IVORY = P.acc;
  const HAIR = '#f3df90';
  const STEEL = '#dfe6ee';
  const SKIN = '#f2c8a4';
  const GOLD_D = '#c8922a';
  const MAIL = '#b8a878';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -43],
    head: [3, -76],
    hat: [-2, -88],
    armB: [-11, -71],
    handB: [-16, -52],
    armF: [12, -71],
    handF: [22, -52],
    prop: [22, -52],
    legB: [-5, -40],
    footB: [-6, -8],
    legF: [6, -40],
    footF: [7, -8],
    cape: [-4, -72],
  });

  // ───────── Strahlenkranz hinter dem Helm (Signature): 12 Strahlen, lang/kurz im Wechsel ─────────
  F.part('halo', { bone: 'hat', z: 2, zb: 40, sig: true }, (g) => {
    const cx = -2;
    const cy = -88;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const L = i % 2 ? 15 : 22;
      const w = i % 2 ? 2 : 2.8;
      const nx = -Math.sin(a);
      const ny = Math.cos(a);
      g.mat(path([[cx + Math.cos(a) * 9 + nx * w, cy + Math.sin(a) * 9 + ny * w], [cx + Math.cos(a) * L, cy + Math.sin(a) * L, 1], [cx + Math.cos(a) * 9 - nx * w, cy + Math.sin(a) * 9 - ny * w]]), i % 2 ? '#ffd860' : GOLD, 'gold', { hi: 0.9 });
    }
    g.stroke(circle(cx, cy, 10), GOLD_D, 1.6);
  });
  F.part('haloGlow', { bone: 'hat', z: 2.5, zb: 40.5, state: ['ability', 'spawn'], glow: true }, (g) => g.fill(circle(-2, -88, 22), '#fff0a0', { op: 0.4 }));

  // ───────── Umhang (Teamzone) ─────────
  F.part('cape', { bone: 'cape', z: 3, zb: 46, team: true }, (g) => {
    const c = path([[-10, -72], [6, -72], [9, -50], [12, -18], [3, -12], [-6, -14], [-16, -10], [-20, -24], [-16, -50]]);
    g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    lines(g, [[[-8, -64], [-12, -16]], [[0, -64], [-1, -14]]], P.teamShade, 0.8, 1);
    // Strahlen-Ornament am Saum
    g.lod(1, (h) => {
      for (const x of [-14, -6, 2, 9]) h.stroke(polyline([[x, -14], [x + 1, -19]]), '#ffd860', 0.8);
    });
  });

  // ───────── Beine: Stiefel mit Goldkappen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -42, x * 1.1, -14, 5.6, 5), '#f4ecd8', 'cloth');
      g.mat(ellipse(x * 1.06, -27, 4.2, 3.2), GOLD, 'gold', { lod: 1 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.6, -18], [fx + 4.6, -18], [fx + 4.6, -8], [fx + 9.6, -3.4], [fx + 9.8, 0, 1], [fx - 5.4, 0, 1], [fx - 5.6, -8]]), '#6a4a2a', 'leather');
      g.mat(path([[fx + 3, -8], [fx + 9.6, -3.4], [fx + 9.8, 0, 1], [fx + 2.6, 0, 1]]), GOLD, 'gold');
      g.mat(rrect(fx - 5.6, -19.4, 10.6, 3, 1), GOLD, 'gold', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 6, 8);

  // ───────── Hinterer Arm: hält den Polierlappen ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => {
    g.mat(limb(-11, -71, -15, -55, 5, 4.4), GOLD_D, 'gold');
  });
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => {
    g.mat(circle(-16, -51, 3.2), '#e8dcc0', 'leather');
    g.mat(path([[-18, -48], [-14, -48], [-12, -40], [-15, -38], [-19, -41]]), IVORY, 'cloth', { lod: 1 });
  });

  // ───────── Rumpf: Goldbrustpanzer mit Sonnengravur, Kettenrock ─────────
  F.part('skirt', { bone: 'hip', z: 17, zb: 17 }, (g) => {
    const sk = path([[-11, -46], [12, -46], [14, -30], [-13, -30]]);
    g.mat(sk, MAIL, 'metal');
    chainmail(g, sk, [-14, -47, 15, -29], 1.3, '#8a7a50');
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-11, -72], [-3, -74.6], [8, -74.6], [13, -72], [14, -56], [11, -44], [-10, -44], [-12.6, -56]]);
    g.mat(t, GOLD, 'gold', { hi: 0.95 });
    g.stroke(spline([[-11, -56], [1, -53.6], [13.6, -56]]), GOLD_D, 0.8, { lod: 1 });
    // leichtes Hohlkreuz: Bauchplatte
    g.mat(path([[-10, -48], [11, -48], [11, -43], [-10, -43]]), GOLD_D, 'gold', { lod: 1 });
  });
  F.part('chestSun', { bone: 'torso', z: 21, view: 'front', team: true }, (g) => {
    g.mat(circle(2, -62, 5), P.team, 'metal', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        h.stroke(polyline([[2 + Math.cos(a) * 5.4, -62 + Math.sin(a) * 5.4], [2 + Math.cos(a) * 7.4, -62 + Math.sin(a) * 7.4]]), GOLD_D, 0.8);
      }
    });
  });
  emblem(F, 'emblem', 'torso', 22, 2, -62, 2.6, { view: 'front' });
  F.part('rag', { bone: 'hip', z: 22, zb: 22 }, (g) => {
    g.mat(path([[-12, -44], [-8, -44], [-9, -34], [-12.4, -35]]), IVORY, 'cloth', { lod: 1 });
  });

  // ───────── Kopf: Kinn mit Grübchen, wellige Strähne, offener Helm ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-5, -86], [4, -89], [13, -85.6], [14.6, -77], [13.6, -70], [9, -66], [3, -66.4], [-2, -69], [-5, -76]]), SKIN, 'skin');
    g.stroke(polyline([[8.6, -67.4], [8.8, -68.6]]), '#c08a6a', 0.6, { lod: 1 });
  });
  faceSet(F, {
    eyes: [[10.6, -78.4, 2.2], [3.6, -78.4, 2]],
    iris: '#3a6a9a',
    lidColor: SKIN,
    lid: 0.5,
    brow: { color: '#c8a050', w: 1.2, lift: 0.4 },
    idleTilt: -0.3,
    mouth: [8.4, -71.4, 4.8],
    mood: 'grin',
    attackMouth: 'clench',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[8, -77.6], [10.4, -73.6], [8.2, -73.2]]), '#e8b08c', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  F.part('helm', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-6.6, -80, 1], [-6, -88], [0, -93], [8, -93.6], [14, -89], [15.4, -82.6], [10, -84.6], [2, -84.8], [-1.4, -80]]), GOLD, 'gold', { hi: 0.95 });
    g.mat(path([[-7, -80], [-1.6, -80], [-2, -70], [-6.4, -72]]), GOLD, 'gold');
    rivets(g, [[-4, -86], [3, -89.6], [10, -88.4]], 0.7, '#fff0b0');
  });
  F.part('lock', { bone: 'head', z: 35, zb: 35 }, (g) => {
    g.mat(path([[6, -85], [10, -84], [12.6, -81], [11, -78.4, 1], [10, -81], [7, -82.6]]), HAIR, 'hair', { hi: 0.6 });
  });

  // ───────── Rapier mit Sonnenkorb ─────────
  F.part('rapier', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[22, -53.4], [58, -71], [59, -70], [23, -51.4]]), STEEL, 'metal', { hi: 1 });
    g.mat(circle(22.6, -52.4, 5), GOLD, 'gold', { hi: 0.9 });
    g.lod(1, (h) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        h.stroke(polyline([[22.6 + Math.cos(a) * 3, -52.4 + Math.sin(a) * 3], [22.6 + Math.cos(a) * 5, -52.4 + Math.sin(a) * 5]]), GOLD_D, 0.6);
      }
    });
    g.mat(rrect(18, -54, 3.6, 3.6, 1), GOLD_D, 'gold');
  });
  F.part('tipFlash', { bone: 'prop', z: 39, state: ['ability'], glow: true }, (g) => g.fill(circle(58, -70.6, 3.4), '#fff4b0', { op: 0.9 }));
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(12, -71, 20.6, -54, 5, 4.4), GOLD, 'gold', { hi: 0.9 }));
  F.part('pauldrons', { bone: 'armF', z: 40.5, zb: 6.5 }, (g) => {
    g.mat(path([[6, -73], [12, -78], [19, -75], [21, -68], [16, -64], [8, -66]]), GOLD, 'gold', { hi: 0.95 });
    g.mat(path([[19, -75], [26, -80, 1], [22, -70]]), '#ffe080', 'gold', { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(22, -51, 3.2), '#e8dcc0', 'leather'));

  F.anim({
    // poliert die Klinge mit dem Lappen, pustet sich die Strähne aus dem Gesicht
    idle: { p: { breathe: 0.02, bob: 0.5, sway: 1, tilt: 2 }, keys: { armB: { r: [[0, 0], [0.2, -70], [0.3, -60], [0.4, -74], [0.5, -60], [0.6, 0]] }, hat: { r: [[0, 0], [0.7, 0], [0.75, 6], [0.8, -4], [0.85, 0]] } } },
    // stolzer Schritt, gerader Rücken
    walk: { p: { stride: 22, bob: 1.6, armSwing: 4, lean: -2 }, keys: { cape: { r: [[0, 6], [0.5, 12], [1, 6]] } }, ev: { step: [0.25, 0.75] } },
    // Fechtstellung, schneller Ausfall mit Stich, Klinge zittert nach
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 30, strike: -50, over: -4, pull: 6, reach: 14, lunge: 12, step: 8, stepLeg: 28 }, keys: { prop: { r: [[0, 0], [0.5, 0], [0.58, 3], [0.66, -2], [0.74, 1], [0.8, 0]] } } },
    // Schnellsprung: duckt sich in Fechtstellung, Strahlen glühen
    ability: { prog: 'atk.thrust', hit: 0.6, p: { wind: 40, strike: -60, reach: 16, lunge: 16, step: 10 }, keys: { root: { y: [[0, 0], [0.4, 4], [0.6, -2], [1, 0]] } }, ev: { ability: 0.6 } },
    hit: { p: { knock: 2.4, recoil: 6 } },
    spawn: { ev: { land: 0.55 } },
    // fällt theatralisch auf ein Knie und dann um
    death: { p: { dir: -1, angle: 82 } },
  });
}
