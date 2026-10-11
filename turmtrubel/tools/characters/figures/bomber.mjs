// Bomber – kichernder, rußiger Schornsteinfeger-Wicht mit Zylinder voller Bomben und Besen auf dem Rücken
// Evo: Springbomben – Sprungfedern an Schuhen und Hut, Bomben mit Federn (Brief: docs/briefs/bomber.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { eye, eyeClosed, eyeX, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function bomber(F) {
  const P = F.pal;
  const SOOT = P.main;
  const EYE_W = P.acc;
  const BOMB = '#2a2830';
  const FUSE = '#ff9a2e';
  const BROOM = '#a8763e';
  const FACE = '#7e716a';
  const HAT = '#34302e';
  const GOLD = '#d8a838';
  const SPRING = '#c8ccd2';

  F.rig(
    'biped',
    {
      hip: [0, -12],
      torso: [0, -14],
      head: [4, -36],
      hat: [4, -55],
      back: [-10, -30],
      armB: [-10, -32],
      handB: [-15, -22],
      armF: [11, -32],
      handF: [17, -23],
      prop: [17, -23],
      legB: [-5, -12],
      footB: [-6, -3],
      legF: [5, -12],
      footF: [6, -3],
      cape: [0, -36],
      drop: [0, 0],
    },
    { drop: 'root' },
  );

  const bomb = (g, x, y, r, spring) => {
    g.mat(circle(x, y, r), BOMB, 'metal', { hi: 0.8, line: '#7a7680', lw: 0.5 });
    g.mat(rrect(x - r * 0.35, y - r * 1.2, r * 0.7, r * 0.4, r * 0.1), '#5a5658', 'metal');
    g.stroke(spline([[x, y - r * 1.2], [x + r * 0.3, y - r * 1.6], [x + r * 0.7, y - r * 1.7]]), '#6a4a2a', Math.max(0.5, r * 0.18));
    if (spring) {
      for (let i = 0; i < 3; i++) g.stroke(ellipse(x, y + r + 0.8 + i * 1.2, r * 0.5, 0.5), SPRING, 0.5);
    }
  };
  const spark = (g, x, y, s = 1) => {
    g.fill(star(x, y, 2.2 * s, 0.8 * s, 6), FUSE);
    g.fill(circle(x, y, 0.8 * s), '#fff4c8');
  };

  // ───────── Besen auf dem Rücken ─────────
  F.part('broom', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(limb(-16, -4, -9, -52, 1.1, 1), '#7a5232', 'wood', { hi: 0.4 });
    const b = path([[-11, -50], [-6, -51], [-3, -64, 1], [-8, -66], [-13, -65, 1], [-14, -52]]);
    g.mat(b, BROOM, 'wood', { hi: 0.5 });
    g.clipTo(b, (h) => h.lod(1, (k) => lines(k, [[[-11, -52], [-12, -64]], [[-8.6, -52], [-8.4, -65]], [[-6.4, -52], [-5, -64]]], '#7a5232', 0.5, 1)));
    g.mat(rrect(-13.4, -52.6, 8, 2.2, 0.6), '#5a4030', 'leather');
  });

  // ───────── Kurze Beine mit Stiefeln (Evo: Sprungfedern) ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -13, x * 1.1, -5, 2.6, 2.3), col, 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 3, -6], [fx + 3, -6.4], [fx + 7, -2.4], [fx + 7, 0, 1], [fx - 3.6, 0, 1]]), '#1e1a1a', 'leather', { hi: 0.5 });
    });
    F.part(foot + '.spring', { bone: foot, z: z + 0.5, evo: 'evo' }, (g) => {
      const fx = x * 1.1 + 1.6;
      for (let i = 0; i < 3; i++) g.stroke(ellipse(fx, 1 + i * 1.4, 3.2, 0.7), SPRING, 0.7);
    });
  };
  leg('legB', 'footB', -5, 6, '#2a2624');
  leg('legF', 'footF', 5, 8, '#3a3532');
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-10, -32, -14, -24, 2.4, 2.1), '#2e2a28', 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-15, -22, 2.3), FACE, 'skin'));

  // ───────── Runder Körper: rußige Jacke mit Goldknöpfen ─────────
  F.part('body', { bone: 'torso', z: 18, zb: 18 }, (g) => {
    const b = ellipse(0, -23, 14, 13.4);
    g.mat(b, SOOT, 'cloth', { hi: 0.35 });
    g.clipTo(b, (h) => {
      h.mat(path([[3, -38], [8, -38], [7, -10], [2, -10]]), '#2a2624', 'cloth');
      h.lod(1, (k) => {
        for (const [x, y, r] of [[-8, -28, 2.6], [-4, -16, 2], [10, -16, 1.8]]) k.fill(ellipse(x, y, r * 1.4, r), '#1e1a1a', { op: 0.5 });
      });
    });
    for (const y of [-31, -24, -17]) g.mat(circle(9.2, y, 1.1), GOLD, 'gold', { hi: 0.8 });
  });
  emblem(F, 'emblem', 'torso', 19, -6, -22, 1.8, { zb: 19 });

  // ───────── Rußgesicht mit weißen Augen und breitem Kichern ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(circle(4, -45, 11), FACE, 'skin', { hi: 0.3 });
    g.mat(path([[-6, -48], [-11, -52, 1], [-6, -44]]), FACE, 'skin');
    g.lod(1, (h) => {
      for (const [x, y, r] of [[10, -40, 2], [-2, -48, 2.4]]) h.fill(ellipse(x, y, r * 1.3, r), '#3a3432', { op: 0.6 });
    });
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 10.6, -47, { r: 2.8, white: EYE_W, iris: '#1a1614', irisR: 0.45, look: [0.5, 0], lid: 0.15, lidColor: FACE, line: '#1a1614' });
    eye(g, 4, -47.2, { r: 2.5, white: EYE_W, iris: '#1a1614', irisR: 0.45, look: [0.5, 0], lid: 0.15, lidColor: FACE, line: '#1a1614' });
    const m = path([[4, -41.4, 1], [14, -42, 1], [12, -38], [6, -38]]);
    g.fill(m, '#4a1c24', { stroke: '#1a1614', lw: 0.6 });
    g.clipTo(m, (h) => h.fill(rrect(3, -42.6, 12, 1.6, 0.3), WHITE));
  });
  F.part('face.attack', { bone: 'head', z: 31, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eyeClosed(g, 10.6, -47, 2.4, { up: true, lw: 1, color: EYE_W });
    eyeClosed(g, 4, -47.2, 2.2, { up: true, lw: 0.9, color: EYE_W });
    mouthOpen(g, 9, -40.4, 9, 4.6, { teeth: 'top', tongue: true, lw: 0.6 });
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eye(g, 10.6, -47.4, { r: 3, white: EYE_W, iris: '#1a1614', irisR: 0.3, look: [0, 0], line: '#1a1614' });
    eye(g, 4, -47.4, { r: 2.7, white: EYE_W, iris: '#1a1614', irisR: 0.3, look: [0, 0], line: '#1a1614' });
    g.fill(ellipse(9, -40, 2, 2.2), '#4a1c24', { stroke: '#1a1614', lw: 0.5 });
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 10.6, -47, 2, EYE_W, 0.9);
    eyeX(g, 4, -47.2, 1.8, EYE_W, 0.8);
  });
  // Halstuch (Teamzone)
  F.part('kerchief', { bone: 'torso', z: 32, zb: 32, team: true }, (g) => {
    g.mat(path([[-4, -36.4], [12, -35.6], [10, -32], [5, -27.6, 1], [2, -32], [-4, -33]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Zylinder mit Hutband (Teamzone), Bomben ragen heraus (Signature) ─────────
  F.part('hatBombs', { bone: 'hat', z: 33, zb: 33, sig: true }, (g) => {
    bomb(g, 0, -77, 4, false);
    bomb(g, 8.6, -78, 3.6, false);
  });
  F.part('hatSparks', { bone: 'hat', z: 33.1, zb: 33.1, glow: true }, (g) => {
    spark(g, 2.8, -84.4, 0.8);
    spark(g, 11.2, -84.8, 0.7);
  });
  F.part('hatSprings', { bone: 'hat', z: 33.2, zb: 33.2, evo: 'evo' }, (g) => {
    for (const [x, y, r] of [[0, -77, 4], [8.6, -78, 3.6]]) for (let i = 0; i < 3; i++) g.stroke(ellipse(x, y + r + 0.4 + i * 1, r * 0.55, 0.45), SPRING, 0.5);
  });
  F.part('hat', { bone: 'hat', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-5, -56], [-6, -76, 1], [14, -76, 1], [13, -56]]), HAT, 'cloth', { hi: 0.45 });
    g.mat(ellipse(4.4, -56, 14, 3), HAT, 'cloth', { hi: 0.5 });
    g.lod(1, (h) => h.fill(ellipse(-3, -66, 1.6, 5), '#3a3432', { op: 0.6 }));
  });
  F.part('hatBand', { bone: 'hat', z: 34.5, zb: 34.5, team: true }, (g) => g.mat(path([[-5.4, -62.6], [13.4, -62.6], [13.2, -58.6], [-5.2, -58.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('hatTopSpring', { bone: 'hat', z: 34.6, zb: 34.6, evo: 'evo' }, (g) => {
    // Sprungfeder seitlich am Hut mit Federkappe
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([14 + (i % 2 ? 3 : 0), -60 - i * 2]);
    g.stroke(polyline(pts), SPRING, 0.9);
    g.mat(ellipse(15.6, -77.6, 3, 1.4), '#5a5f6b', 'metal', { hi: 0.8 });
  });

  // ───────── Bombe in der Hand (mit glimmender Lunte) und vorderer Arm ─────────
  const HELD = ['idle', 'walk', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'held'];
  F.part('handBomb', { bone: 'prop', z: 38, zb: 4, state: HELD }, (g) => bomb(g, 19, -25, 4.4, false));
  F.part('handBombSpring', { bone: 'prop', z: 38.2, zb: 4.2, state: HELD, evo: 'evo' }, (g) => {
    for (let i = 0; i < 3; i++) g.stroke(ellipse(19, -20 + i * 1.2, 2.4, 0.5), SPRING, 0.5);
  });
  F.part('handSpark', { bone: 'prop', z: 38.5, zb: 4.5, state: HELD, glow: true }, (g) => spark(g, 22, -30.6, 0.9));
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(11, -32, 16, -25, 2.5, 2.2), SOOT, 'cloth', { hi: 0.3 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(17, -23, 2.4), FACE, 'skin'));

  // ───────── Rußwolken, herausrollende Bomben ─────────
  F.part('soot', { bone: 'root', z: 50, zb: 50, state: 'soot' }, (g) => {
    for (const [x, y, r] of [[-12, -30, 7], [10, -40, 8], [0, -54, 6], [-16, -14, 5], [16, -18, 5]]) g.fill(circle(x, y, r), '#4a4644', { op: 0.6 });
  });
  F.part('crumbs', { bone: 'root', z: 50, zb: 50, state: 'crumbs', lod: 1 }, (g) => {
    for (const [x, y] of [[-14, -20], [-18, -10], [16, -12]]) g.fill(circle(x, y, 0.9), '#1e1a1a');
  });
  F.part('rolled', { bone: 'drop', z: 52, zb: 52, state: 'rolled' }, (g) => {
    bomb(g, 22, -4, 3.6, false);
    bomb(g, 32, -3.6, 3.2, false);
    bomb(g, -24, -3.6, 3.2, false);
  });

  F.anim({
    // jongliert eine Bombe, Ruß bröselt
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 },
      keys: {
        prop: { y: [[0, 0], [0.25, -14, 'out'], [0.5, 0, 'in'], [0.75, -12, 'out'], [1, 0, 'in']], r: [[0, 0], [0.5, 180], [1, 360]] },
        armF: { r: [[0, 0], [0.12, -20], [0.25, 0], [0.5, 0], [0.62, -18], [0.75, 0]] },
        head: { r: [[0, 0], [0.25, -8], [0.5, 0], [0.75, -6], [1, 0]] },
        show: { crumbs: [[0.6, 0.9]] },
      },
    },
    // watschelnd
    walk: { p: { stride: 14, bob: 2.4, armSwing: 16, lean: 3 }, keys: { torso: { r: [[0, -5], [0.5, 5], [1, -5]] } } },
    // lüpft den Hut, zieht eine Bombe, Wurf im hohen Bogen
    attack: {
      prog: 'atk.throw',
      hit: 0.62,
      p: { wind: -200, strike: -70, over: 16, lean: 10, lunge: 10, windB: -150 },
      keys: {
        hat: { y: [[0, 0], [0.2, -9, 'out'], [0.4, -9], [0.5, 0, 'in']], r: [[0, 0], [0.2, -14], [0.4, -14], [0.5, 0]] },
        armB: { r: [[0, 0], [0.2, -170], [0.4, -170], [0.55, 0]] },
        show: { held: [[0.35, 0.62]] },
      },
      ev: { release: 0.62 },
    },
    // Rußwolke
    hit: { p: { knock: 2, recoil: 5 }, keys: { show: { soot: [[0, 0.7]] } } },
    // plumpst mit Rußwolke
    spawn: { keys: { show: { soot: [[0.5, 0.95]] } } },
    // Hut fällt, Bomben rollen heraus
    death: {
      p: { dir: -1, angle: 80 },
      // drop hebt die Drehung des Wurzelknochens auf: die Bomben liegen am Boden
      keys: { hat: { x: [[0, 0], [0.5, 10]], y: [[0, 0], [0.5, 14]], r: [[0, 0], [0.5, 70]] }, drop: { r: [[0, 80], [1, 80]] }, show: { rolled: [[0.46, 1.01]] } },
    },
  });
}
