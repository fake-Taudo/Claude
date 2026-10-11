// Elixiergolemit – aufgeregter Erlenmeyerkolben auf Stummelbeinen, Gummistopfen als Kopf, Messskala am Bauch
// (Brief: docs/briefs/elixir-golemite.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeX, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function elixirGolemite(F) {
  const P = F.pal;
  const ELIXIR = P.main;
  const GLASS = P.acc;
  const RUBBER = '#4a3a40';
  const ELIXIR_D = '#8a2aa8';
  const ELIXIR_L = '#e08af0';
  const LIVE = ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability', 'spawnUnit', 'whole'];

  F.rig(
    'biped',
    {
      hip: [0, -14],
      torso: [0, -16],
      head: [0, -60],
      hat: [0, -80],
      back: [-14, -40],
      armB: [-16, -34],
      handB: [-24, -26],
      armF: [17, -34],
      handF: [25, -26],
      prop: [25, -26],
      legB: [-8, -14],
      footB: [-9, -3],
      legF: [8, -14],
      footF: [9, -3],
      cape: [0, -56],
      slosh: [0, -30],
    },
    { slosh: 'torso' },
  );

  const flask = path([[-7, -60, 1], [7, -60, 1], [7, -50], [24, -20], [26, -15], [22, -12, 1], [-22, -12, 1], [-26, -15], [-24, -20], [-7, -50]]);

  // ───────── Stummelbeine aus Elixier ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z, state: LIVE }, (g) => g.mat(limb(x, -14, x * 1.1, -5, 3.6, 3.2), col, 'glass', { hi: 0.6 }));
    F.part(foot, { bone: foot, z: z + 1, state: LIVE }, (g) => g.mat(ellipse(x * 1.1 + 2, -2.4, 5.4, 2.8), col, 'glass', { hi: 0.7 }));
  };
  leg('legB', 'footB', -8, 6, ELIXIR_D);
  leg('legF', 'footF', 8, 8, ELIXIR);
  F.part('armB', { bone: 'armB', z: 9, zb: 42, state: LIVE }, (g) => {
    g.mat(limb(-16, -34, -23, -27, 2.8, 2.4), ELIXIR_D, 'glass', { hi: 0.6 });
    g.mat(circle(-24, -26, 3), ELIXIR_D, 'glass', { hi: 0.7 });
  });

  // ───────── Kolben (Signature): Elixier schwappt, Skala, Blasen, Sprung im Glas ─────────
  F.part('glassBody', { bone: 'torso', z: 17.5, zb: 17.5, state: LIVE }, (g) => g.mat(flask, '#cdeee8', 'glass', { hi: 0.8 }));
  F.part('elixir', { bone: 'slosh', z: 18, zb: 18, state: LIVE }, (g) => {
    g.clipTo(flask, (h) => {
      h.mat(path([[-30, -40], [-14, -42], [0, -40], [14, -42], [30, -40], [30, -8], [-30, -8]]), ELIXIR, 'glass', { hi: 0.5 });
      h.fill(path([[-30, -40], [-14, -42], [0, -40], [14, -42], [30, -40], [30, -38], [-30, -38]]), ELIXIR_L, { op: 0.8 });
      h.lod(1, (k) => {
        for (const [x, y, r] of [[-12, -22, 1.6], [-6, -30, 1.1], [10, -18, 1.3], [14, -30, 0.9], [-16, -16, 0.9]]) k.stroke(circle(x, y, r), ELIXIR_L, 0.5);
      });
    });
  });
  F.part('flask', { bone: 'torso', z: 19, zb: 19, sig: true, state: LIVE }, (g) => {
    g.fill(flask, GLASS, { op: 0.12 });
    g.stroke(flask, '#8ac8c0', 1.2);
    // Skala
    for (const [y, w] of [[-44, 4], [-38, 6], [-32, 4], [-26, 6], [-20, 4]]) g.stroke(polyline([[-14 + (y + 44) * -0.32, y], [-14 + (y + 44) * -0.32 + w, y]]), WHITE, 0.7, { op: 0.9 });
    g.lod(1, (h) => {
      h.fill(rrect(-10.4, -37, 1, 0.6, 0), WHITE);
      // Sprung im Glas
      h.stroke(polyline([[12, -48], [14, -44], [12.4, -41], [15, -37]]), WHITE, 0.5, { op: 0.8 });
    });
    // Glanz
    g.fill(path([[-5, -56], [-3.6, -56], [-3.6, -50], [-16, -24], [-18, -24]]), '#ffffff', { op: 0.5 });
    g.fill(ellipse(16, -18, 2, 1, -50), '#ffffff', { op: 0.5, lod: 1 });
  });
  // aufgeregte Augen im Glas
  F.part('face.idle', { bone: 'slosh', z: 20, view: 'front', state: LIVE, expr: ['idle', 'attack', 'ability'] }, (g) => {
    eye(g, 10, -32, { r: 3.6, iris: '#3a1a4a', look: [0.6, -0.1], lid: 0, irisR: 0.55 });
    eye(g, 1.4, -32.4, { r: 3.2, iris: '#3a1a4a', look: [0.6, -0.1], lid: 0, irisR: 0.55 });
  });
  F.part('face.hurt', { bone: 'slosh', z: 20, view: 'front', state: LIVE, expr: ['hurt', 'stun', 'sleep'] }, (g) => {
    eyeClosed(g, 10, -32, 3, { up: true, lw: 1.1 });
    eyeClosed(g, 1.4, -32.4, 2.6, { up: true, lw: 1 });
  });
  F.part('face.death', { bone: 'slosh', z: 20, view: 'front', state: LIVE, expr: 'death' }, (g) => {
    eyeX(g, 10, -32, 2.2, INK, 1);
    eyeX(g, 1.4, -32.4, 2, INK, 0.9);
  });
  F.part('flaskBack', { bone: 'torso', z: 20.5, view: 'back', state: LIVE }, (g) => g.fill(flask, '#ffffff', { op: 0.18 }));
  emblem(F, 'emblem', 'torso', 21, -12, -20, 2, { zb: 21, state: LIVE });

  // ───────── Halsband (Teamzone) und Gummistopfen-Kopf mit Mund ─────────
  F.part('collar', { bone: 'torso', z: 22, zb: 22, team: true, state: LIVE }, (g) => {
    g.mat(rrect(-8.6, -56, 17.2, 4, 1.2), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[6, -55], [12, -50], [9, -48.4], [5, -53]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('stopper', { bone: 'head', z: 30, zb: 30, state: LIVE }, (g) => {
    g.mat(path([[-6.4, -58, 1], [6.4, -58, 1], [9, -74, 1], [-9, -74, 1]]), RUBBER, 'leather', { hi: 0.5 });
    g.mat(ellipse(0, -74, 9, 2.4), '#5a4a50', 'leather', { hi: 0.6 });
    g.lod(1, (h) => lines(h, [[[-7, -62], [7, -62]]], '#3a2a30', 0.6, 1));
  });
  F.part('mouth.idle', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['idle', 'sleep'] }, (g) => mouthOpen(g, 2.6, -66.2, 8, 4, { teeth: 'top', tongue: true, lw: 0.6 }));
  F.part('mouth.attack', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['attack', 'ability'] }, (g) => mouthOpen(g, 3, -66.6, 7.4, 4.4, { teeth: 'both', tongue: false, lw: 0.6 }));
  F.part('mouth.hurt', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['hurt', 'stun', 'death'] }, (g) => g.stroke(spline([[-0.6, -66.4], [1.6, -67.6], [3.6, -66], [5.6, -67.4], [7, -66.2]]), INK, 0.8));
  F.part('armF', { bone: 'armF', z: 29, zb: 6, state: LIVE }, (g) => g.mat(limb(17, -34, 24, -27, 2.8, 2.4), ELIXIR, 'glass', { hi: 0.6 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7, state: LIVE }, (g) => g.mat(circle(25, -26, 3.2), ELIXIR, 'glass', { hi: 0.7 }));

  // ───────── Klirren (Treffer), Scherben und zwei Kleckse (Tod) ─────────
  F.part('clink', { bone: 'root', z: 50, zb: 50, state: 'clink', glow: true }, (g) => {
    for (const [x, y, a] of [[-28, -44, -30], [28, -48, 30], [-24, -26, -60]]) g.fill(poly([[x, y - 3], [x + 1, y], [x, y + 3], [x - 1, y]]).rot(a, x, y), '#ffffff', { op: 0.9 });
  });
  F.part('shards', { bone: 'root', z: 16, zb: 16, state: 'burst' }, (g) => {
    for (const [x, y, a] of [[-18, -3, 10], [16, -4, -20], [-4, -2, 40], [24, -2, 70]]) {
      const s = poly([[x - 3, y], [x, y - 4], [x + 3, y - 1]]).rot(a, x, y);
      g.fill(s, GLASS, { op: 0.5 });
      g.stroke(s, '#a8d8d0', 0.6);
    }
    g.mat(path([[-6, -2, 1], [6, -2, 1], [8, -10, 1], [-8, -10, 1]]).rot(80, 0, -6), RUBBER, 'leather', { hi: 0.4 });
  });
  F.part('splash', { bone: 'root', z: 50, zb: 50, state: 'splash', glow: true }, (g) => {
    for (const [x, y, r] of [[-16, -30, 4], [14, -36, 3.4], [0, -44, 3], [-24, -16, 2.6], [24, -18, 2.6]]) g.fill(circle(x, y, r), ELIXIR_L, { op: 0.8 });
  });

  F.anim({
    // schwappt
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 }, keys: { slosh: { r: [[0, -5], [0.5, 5], [1, -5]] }, head: { r: [[0, -3], [0.5, 3], [1, -3]] } } },
    // tippelt
    walk: { p: { stride: 14, bob: 2.6, armSwing: 20, lean: 3 }, keys: { slosh: { r: [[0, -8], [0.25, 8], [0.5, -8], [0.75, 8], [1, -8]] } }, ev: { step: [0.25, 0.75] } },
    // Kopfnuss mit dem Stopfen
    attack: {
      prog: 'still',
      hit: 0.55,
      keys: {
        expr: [[0, 1, 'attack']],
        torso: { r: [[0, 0], [0.4, -12, 'out'], [0.55, 24, 'in'], [0.72, 24], [1, 0, 'io']] },
        slosh: { r: [[0, 0], [0.4, 10], [0.6, -14], [0.8, 6], [1, 0]] },
        root: { x: [[0, 0], [0.4, -3], [0.55, 6, 'in'], [0.75, 6], [1, 0]] },
        armF: { r: [[0, 0], [0.4, 30], [0.55, -20], [1, 0]] },
        armB: { r: [[0, 0], [0.4, 30], [0.55, -20], [1, 0]] },
      },
      ev: { strike: 0.55 },
    },
    // Glas klirrt
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { show: { clink: [[0, 0.6]] }, slosh: { r: [[0, 0], [0.2, 14], [0.5, -8], [1, 0]] } } },
    // rollt aus den Scherben
    spawn: {
      prog: 'still',
      keys: {
        root: {
          r: [[0, -240], [0.15, -180], [0.3, -120], [0.45, -60], [0.6, 0]],
          x: [[0, -53.4], [0.15, -18], [0.3, 17.4], [0.45, 23.4], [0.6, 0]],
          y: [[0, -57], [0.15, -78], [0.3, -57], [0.45, -19], [0.6, 0], [0.7, -4], [0.8, 0]],
        },
      },
    },
    // zerplatzt in zwei Kleckse
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], show: { whole: [[0, 0.2]], burst: [[0.2, 1.01]], splash: [[0.2, 0.55]] }, torso: { sx: [[0, 1], [0.2, 1.15]], sy: [[0, 1], [0.2, 0.9]] }, alpha: [[0, 1], [0.75, 1], [1, 0]] } },
  });
}
