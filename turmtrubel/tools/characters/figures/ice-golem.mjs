// Eisgolem – verschlafen-friedlicher Riese aus einem Eisblock mit eingefrorenem Fisch im Bauch und Strickschal
// (Brief: docs/briefs/ice-golem.md)
// o.hero: Eiskrone mit Schneeflocken-Zacken, Frostschärpe, Schneesturm-Ring und Fähigkeit „Schneesturm“ (ice-golem-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { eye, eyeClosed, eyeX, brow, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function iceGolem(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const ICE = P.main;
  const ICE_L = '#e8fbff';
  const ICE_D = H ? '#7ab8d8' : '#68b4d4';
  const FISH = H ? '#ff9a62' : P.acc;
  const GOLD = '#ffcf6b';
  const SCARF_D = '#c8487a';
  const LIVE = ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability', 'spawnUnit', 'whole'];

  F.rig(
    'biped',
    {
      hip: [0, -14],
      torso: [0, -16],
      head: [6, -64],
      hat: [6, -84],
      back: [-20, -52],
      armB: [-22, -52],
      handB: [-28, -34],
      armF: [24, -52],
      handF: [31, -34],
      prop: [31, -34],
      legB: [-10, -14],
      footB: [-11, -3],
      legF: [10, -14],
      footF: [11, -3],
      cape: [-6, -62],
      fish: [2, -6],
      swirl: [0, -36],
    },
    { fish: 'root', swirl: 'hip' },
  );

  const iceBelly = poly([[-26, -58], [-6, -66], [18, -64], [30, -48], [30, -26], [22, -12], [-20, -12], [-30, -28], [-30, -48]], 6);

  // ───────── Schneesturm-Ring (Held): hintere Hälfte hinter dem Bauch ─────────
  const swirlHalf = (g, front) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = (front ? 0 : Math.PI) + (i / 14) * Math.PI;
      pts.push([Math.cos(a) * 40, -36 + Math.sin(a) * 8]);
    }
    g.stroke(spline(pts), '#ffffff', 2.4, { op: front ? 0.75 : 0.45 });
    g.stroke(spline(pts.map(([x, y]) => [x * 0.9, y - 3])), '#d8f4ff', 1.2, { op: 0.6, lod: 1 });
    for (let i = 1; i < 14; i += 3) g.fill(star(pts[i][0], pts[i][1], 2.4, 0.8, 6), '#ffffff', { op: front ? 0.9 : 0.5 });
  };
  if (H) {
    F.part('swirlBack', { bone: 'swirl', z: 2, zb: 2, state: LIVE, outline: false }, (g) => swirlHalf(g, false));
    F.part('swirlFront', { bone: 'swirl', z: 45, zb: 45, state: LIVE, outline: false }, (g) => swirlHalf(g, true));
  }

  // ───────── Strickschal-Enden (Teamzone) wehen hinter ihm ─────────
  F.part('scarfTail', { bone: 'cape', z: 4, zb: 44, team: true, state: LIVE }, (g) => {
    g.mat(path([[-6, -61], [-18, -60], [-28, -54, 1], [-24, -52], [-30, -46, 1], [-20, -50], [-6, -55]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.lod(1, (h) => lines(h, [[[-16, -61], [-16, -55]], [[-22, -59], [-22, -53]]], P.teamDeep, 0.5, 1));
  });

  // ───────── Eisstumpen als Beine ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z, state: LIVE }, (g) => g.mat(poly([[x - 6, -16], [x + 6, -16], [x + 6, -5], [x - 6, -5]], 2), col, 'glass', { hi: 0.6 }));
    F.part(foot, { bone: foot, z: z + 1, state: LIVE }, (g) => g.mat(poly([[x - 7.4, -6.4], [x + 6, -6.4], [x + 10, -2.4], [x + 10, 0], [x - 7.6, 0]], 1.6), col, 'glass', { hi: 0.7 }));
  };
  leg('legB', 'footB', -10, 6, ICE_D);
  leg('legF', 'footF', 10, 8, ICE);

  // ───────── Hinterer Eisarm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42, state: LIVE }, (g) => g.mat(limb(-22, -52, -27, -38, 6, 5.4), ICE_D, 'glass', { hi: 0.5 }));
  F.part('handB', { bone: 'handB', z: 10, zb: 43, state: LIVE }, (g) => g.mat(poly([[-34, -38], [-22, -39], [-21, -29], [-27, -26], [-34, -30]], 2.4), ICE_D, 'glass', { hi: 0.6 }));

  // ───────── Eisbauch mit eingefrorenem Fisch (Signature) ─────────
  F.part('belly', { bone: 'torso', z: 18, zb: 18, state: LIVE }, (g) => {
    g.mat(iceBelly, ICE, 'glass', { hi: 0.8 });
    g.clipTo(iceBelly, (h) => {
      h.fill(poly([[-30, -40], [-12, -50], [6, -44], [-6, -30], [-30, -20]], 2), ICE_D, { op: 0.35 });
      h.fill(poly([[10, -64], [30, -50], [30, -36], [18, -44]], 2), ICE_L, { op: 0.6 });
    });
  });
  F.part('fish', { bone: 'torso', z: 19, zb: 19, sig: true, view: 'front', state: LIVE }, (g) => {
    const body = blob([[-8, -36], [-2, -41], [8, -40], [13, -36], [8, -32], [-2, -31]], 0.8);
    g.mat(body, FISH, 'scale', { hi: 0.5 });
    g.mat(path([[-7, -36], [-14, -41, 1], [-12, -36], [-14, -31, 1]]), FISH, 'scale', { hi: 0.4 });
    g.mat(path([[0, -40], [4, -44, 1], [6, -40]]), '#e87a42', 'scale');
    g.lod(1, (h) => lines(h, [[[2, -39], [1, -33]], [[5, -39], [4, -33]]], '#d86a32', 0.5, 1));
    // überraschtes Auge, „o“-Mund
    eye(g, 8, -37.6, { r: 1.9, iris: '#1a1a24', irisR: 0.4, look: [0.3, 0], lash: false });
    g.fill(ellipse(12.6, -34.4, 0.9, 1.1), '#7a2a1a', { stroke: INK, lw: 0.3 });
  });
  F.part('frost', { bone: 'torso', z: 20, zb: 20, state: LIVE }, (g) => {
    g.clipTo(iceBelly, (h) => {
      h.fill(poly([[-30, -30], [-10, -42], [14, -40], [30, -26], [30, -12], [-30, -12]], 2), ICE_L, { op: 0.25 });
      h.lod(1, (k) => lines(k, [[[-20, -52], [-14, -46], [-16, -40]], [[18, -22], [22, -28], [26, -26]], [[-8, -18], [-4, -24]]], ICE_L, 0.7, 1));
    });
    g.fill(ellipse(-16, -52, 4, 2, -30), '#ffffff', { op: 0.75 });
    g.fill(ellipse(-22, -44, 1.4, 0.8, -30), '#ffffff', { op: 0.6, lod: 1 });
    // Schmelztropfen
    g.mat(path([[18, -13], [20, -9, 1], [16.6, -9.6]]), ICE_L, 'glass', { lod: 1 });
  });
  if (H) {
    // Frostschärpe (Teamzone) quer über den Bauch
    F.part('sash', { bone: 'torso', z: 21, zb: 21, team: true, state: LIVE }, (g) => {
      // als Hüftschärpe unter dem Fisch, Knoten mit Schneeflockenspange und Enden vorn
      g.clipTo(iceBelly, (h) => h.mat(path([[-32, -28], [32, -24], [32, -17], [-32, -21]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5, hi: 0.4 }));
      g.mat(path([[18, -22], [24, -10, 1], [20, -9], [16, -20]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
      g.mat(path([[20, -22], [30, -12, 1], [27, -10], [18, -19]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
      g.fill(star(18, -22, 3.6, 1.4, 6), '#ffffff', { stroke: '#7ab8d8', lw: 0.4 });
    });
  }
  emblem(F, 'emblem', 'torso', 22, -18, -24, 2.4, { zb: 22, state: LIVE });

  // ───────── Kleiner Eiskopf, verschlafen gähnend ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30, state: LIVE }, (g) => {
    const hd = poly([[-7, -66], [-4, -79], [8, -84], [19, -80], [21, -68], [15, -61], [-3, -61]], 4);
    g.mat(hd, ICE, 'glass', { hi: 0.8 });
    g.clipTo(hd, (h) => h.fill(poly([[8, -84], [21, -75], [21, -68], [12, -75]], 1), ICE_L, { op: 0.6 }));
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 14, -73.4, { r: 2, iris: '#2a5a7a', lid: 0.6, lidColor: ICE, look: [0.4, 0.2] });
    eye(g, 7.6, -73.6, { r: 1.8, iris: '#2a5a7a', lid: 0.6, lidColor: ICE, look: [0.4, 0.2] });
    if (H) {
      brow(g, [[12, -78], [14, -79], [16.6, -78.4]], 0.8, ICE_D);
      brow(g, [[5.6, -77.8], [7.6, -78.8], [9.6, -78.2]], 0.8, ICE_D);
    }
    // gähnender Mund aus Eis
    g.fill(ellipse(12, -67, 2.4, 2.2), '#2a6a8a', { stroke: INK, lw: 0.5 });
    g.fill(ellipse(12, -66.2, 1.4, 1), '#8ad0ea');
  });
  F.part('face.attack', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['attack', 'ability'] }, (g) => {
    eye(g, 14, -73.4, { r: 2, iris: '#2a5a7a', lid: 0.35, lidColor: ICE, look: [0.8, 0] });
    eye(g, 7.6, -73.6, { r: 1.8, iris: '#2a5a7a', lid: 0.35, lidColor: ICE, look: [0.8, 0] });
    brow(g, [[11.6, -76.8], [14, -76.6], [16.6, -78]], 0.9, ICE_D);
    g.stroke(spline([[9.6, -67.4], [12, -66.8], [14.6, -67.6]]), '#2a6a8a', 0.9);
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['hurt', 'stun'] }, (g) => {
    eyeClosed(g, 14, -73.4, 1.8, { up: true, lw: 0.8 });
    eyeClosed(g, 7.6, -73.6, 1.6, { up: true, lw: 0.7 });
    g.fill(ellipse(12, -67.0, 1.6, 1.2), '#2a6a8a', { stroke: INK, lw: 0.4 });
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: 'death' }, (g) => {
    eyeX(g, 14, -73.4, 1.4, '#2a5a7a', 0.7);
    eyeX(g, 7.6, -73.6, 1.2, '#2a5a7a', 0.6);
  });
  // Strickschal (Teamzone) um den Hals
  F.part('scarf', { bone: 'torso', z: 32, zb: 32, team: true, state: LIVE }, (g) => {
    const sc = path([[-10, -62], [8, -60.4], [22, -60], [22, -54.4], [8, -54.6], [-10, -56]]);
    g.mat(sc, P.team, 'cloth', { line: P.teamDeep, lw: 0.5, hi: 0.3 });
    g.clipTo(sc, (h) => h.lod(1, (k) => {
      for (let x = -8; x < 22; x += 3) k.stroke(polyline([[x, -61], [x + 1.4, -58], [x, -55]]), P.teamShade, 0.6);
    }));
    if (!H) g.mat(rrect(-2, -62.6, 3, 7.6, 1), SCARF_D, 'cloth', { lod: 1, op: 0.6 });
  });
  if (H) {
    // Eiskrone mit Schneeflocken-Zacken und Goldrand (Signature)
    F.part('crown', { bone: 'hat', z: 34, zb: 34, sig: true, state: LIVE }, (g) => {
      for (const [x, h] of [[-2, 9], [5, 12], [12, 13], [18, 9]]) {
        g.mat(path([[x - 3, -82], [x, -82 - h, 1], [x + 3, -82]]), '#f4fcff', 'flat', { line: '#7ab8d8', lw: 0.5 });
        g.fill(star(x, -82 - h, 3, 0.9, 6), '#ffffff', { stroke: '#7ab8d8', lw: 0.3 });
      }
      g.mat(path([[-5, -84], [21, -84], [20.4, -80.6], [-4.6, -80.6]]), GOLD, 'gold', { hi: 0.8 });
      for (const x of [2, 9, 15]) g.mat(circle(x, -82.3, 0.9), '#7fd8ff', 'gem', { lod: 1 });
    });
  }

  // ───────── Vorderer Eisarm ─────────
  F.part('armF', { bone: 'armF', z: 33, zb: 6, state: LIVE }, (g) => g.mat(limb(24, -52, 30, -38, 6.4, 5.8), ICE, 'glass', { hi: 0.7 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 8, state: LIVE }, (g) => g.mat(poly([[24, -40], [37, -40], [38, -29], [31, -25], [24, -30]], 2.6), ICE, 'glass', { hi: 0.8 }));

  // ───────── Eiskristalle, Frostklirren, Schneestaub ─────────
  F.part('flakes', { bone: 'root', z: 50, zb: 50, state: 'flakes', outline: false }, (g) => {
    for (const [x, y] of [[-24, -74], [26, -70], [-30, -56], [34, -54]]) g.fill(star(x, y, 2, 0.7, 6), '#ffffff', { op: 0.9 });
  });
  F.part('clink', { bone: 'handF', z: 42, state: 'muzzle', glow: true }, (g) => {
    g.fill(star(44, -70, 7, 2, 6), '#d8f8ff', { op: 0.9 });
    g.fill(circle(44, -70, 2), '#ffffff');
  });
  F.part('snowdust', { bone: 'root', z: 50, zb: 50, state: 'snowdust', outline: false }, (g) => {
    for (const [x, y, r] of [[-28, -4, 6], [-14, -2, 5], [16, -3, 6], [30, -4, 5]]) g.fill(circle(x, y, r), '#f4fbff', { op: 0.8 });
  });

  // ───────── Tod: zerspringt, der Fisch fällt heraus und zappelt ─────────
  F.part('shards', { bone: 'root', z: 16, zb: 16, state: 'shattered' }, (g) => {
    for (const [x, y, r, a] of [[-22, -3, 5, 10], [-10, -4, 6, -20], [8, -3, 5.4, 30], [20, -3, 4.6, -10], [28, -2, 3, 40], [-28, -2, 3, 0]]) g.mat(poly([[x - r, y + 2], [x - r * 0.4, y - r], [x + r, y - r * 0.4], [x + r * 0.6, y + 2]], 1).rot(a, x, y), ICE, 'glass', { hi: 0.8 });
  });
  F.part('flopFish', { bone: 'fish', z: 17, zb: 17, state: 'shattered' }, (g) => {
    g.mat(blob([[-8, -6], [-2, -11], [8, -10], [13, -6], [8, -2], [-2, -1]], 0.8), FISH, 'scale', { hi: 0.5 });
    g.mat(path([[-7, -6], [-14, -11, 1], [-12, -6], [-14, -1, 1]]), FISH, 'scale', { hi: 0.4 });
    eye(g, 8, -7.4, { r: 1.7, iris: '#1a1a24', irisR: 0.4, look: [0.3, 0], lash: false });
  });
  if (H) {
    F.part('crownDrop', { bone: 'root', z: 17.5, zb: 17.5, state: 'shattered' }, (g) => {
      for (const [x, h] of [[-26, 5], [-21, 7], [-16, 5]]) g.mat(path([[x - 2, -3], [x, -3 - h, 1], [x + 2, -3]]), ICE_L, 'glass', { hi: 0.8 });
      g.mat(path([[-30, -4], [-12, -4], [-12.4, -1], [-29.6, -1]]), GOLD, 'gold', { hi: 0.8 });
    });
  }
  F.part('frostCloud', { bone: 'root', z: 51, zb: 51, state: 'frostCloud', glow: true }, (g) => {
    for (const [x, y, r] of [[-20, -30, 14], [16, -36, 16], [0, -56, 12], [-6, -18, 12], [24, -16, 10]]) g.fill(circle(x, y, r), '#bfeeff', { op: 0.45 });
  });

  F.anim({
    // gähnt, Eiskristalle rieseln (Held: Schneesturm-Pose, der Wirbel kreist)
    idle: H
      ? { p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 }, keys: { swirl: { r: [[0, -4], [0.5, 4], [1, -4]], y: [[0, 0], [0.5, -3], [1, 0]] }, armF: { r: [[0, 0], [0.35, -120], [0.7, -120], [0.9, 0]] }, armB: { r: [[0, 0], [0.35, -120], [0.7, -120], [0.9, 0]] }, show: { flakes: [[0.3, 0.8]] } } }
      : { p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 }, keys: { head: { r: [[0, 0], [0.3, -10], [0.55, -10], [0.7, 0]] }, show: { flakes: [[0.3, 0.8]] } } },
    // rutschender Watschelgang
    walk: { p: { stride: 10, bob: 2.4, armSwing: 10, lean: 2 }, keys: { torso: { r: [[0, -5], [0.5, 5], [1, -5]] }, root: { x: [[0, -1], [0.5, 1], [1, -1]] }, ...(H ? { swirl: { r: [[0, -6], [0.5, 6], [1, -6]] } } : {}) }, ev: { step: [0.25, 0.75] } },
    // Kopfstoß mit Frostklirren
    attack: {
      prog: 'still',
      hit: 0.55,
      keys: {
        expr: [[0, 1, 'attack']],
        torso: { r: [[0, 0], [0.4, -10, 'out'], [0.55, 18, 'in'], [0.72, 18], [1, 0, 'io']] },
        head: { r: [[0, 0], [0.4, -8], [0.55, 14], [0.72, 14], [1, 0]] },
        root: { x: [[0, 0], [0.4, -3], [0.55, 6, 'in'], [0.75, 6], [1, 0]] },
        armF: { r: [[0, 0], [0.4, 24], [0.55, -14], [1, 0]] },
        armB: { r: [[0, 0], [0.4, 24], [0.55, -14], [1, 0]] },
        show: { muzzle: [[0.55, 0.75]] },
      },
      ev: { strike: 0.55 },
    },
    // Eis splittert
    hit: { p: { knock: 1.2, recoil: 2 }, keys: { show: { flakes: [[0, 0.6]] } } },
    // landet, Schneestaub
    spawn: { keys: { show: { snowdust: [[0.5, 0.95]] } } },
    // zerspringt in einer Frostwolke, der Fisch fällt heraus und zappelt
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        show: { whole: [[0, 0.2]], shattered: [[0.2, 1.01]], frostCloud: [[0.15, 0.6]] },
        fish: { r: [[0.2, 0], [0.35, -18], [0.5, 14], [0.65, -16], [0.8, 10], [1, 0]], y: [[0.2, 0], [0.35, -5], [0.5, 0], [0.65, -4], [0.8, 0]] },
        alpha: [[0, 1], [0.8, 1], [1, 0]],
      },
    },
    ...(H
      ? {
          // Schneesturm: drei Stampfer mit Armen hoch
          ability: {
            prog: 'still',
            hit: 0.3,
            keys: {
              expr: [[0, 1, 'ability']],
              armF: { r: [[0, 0], [0.12, -150], [0.9, -150], [1, 0]] },
              armB: { r: [[0, 0], [0.12, -150], [0.9, -150], [1, 0]] },
              root: { y: [[0, 0], [0.2, -8], [0.3, 0, 'in'], [0.45, -8], [0.55, 0, 'in'], [0.7, -8], [0.8, 0, 'in']], sy: [[0, 1], [0.28, 1], [0.3, 0.9], [0.36, 1], [0.53, 1], [0.55, 0.9], [0.61, 1], [0.78, 1], [0.8, 0.9], [0.86, 1]] },
              swirl: { r: [[0, 0], [1, 30]], sx: [[0, 1], [0.3, 1.2], [0.55, 1], [0.8, 1.25], [1, 1]] },
              show: { snowdust: [[0.3, 0.4], [0.55, 0.65], [0.8, 0.95]], flakes: [[0.1, 1]] },
            },
            ev: { ability: [0.3, 0.55, 0.8] },
          },
        }
      : {}),
  });
}
