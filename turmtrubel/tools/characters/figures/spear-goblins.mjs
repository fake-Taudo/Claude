// Speerkobolde – eifrige Fischer-Kobolde mit Anglerhut und einem Bündel Bambusspeere auf dem Rücken
// (Brief: docs/briefs/spear-goblins.md). Varianten: 0 Haken am Hut, 1 Feder, 2 Flicken.
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, eye, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function spearGoblins(F) {
  const P = F.pal;
  const VEST = P.main;
  const HAT = P.acc;
  const SKIN = F.pal.skin || '#93b844';
  const SKIN_D = '#6e9030';
  const BAMBOO = '#c9b06a';
  const TIP = '#a8b0ba';
  const HOOK = '#c8ccd2';

  F.rig('biped', {
    hip: [0, -19],
    torso: [0, -21],
    head: [3, -38],
    hat: [3, -52],
    back: [-6, -30],
    armB: [-8, -34],
    handB: [-10, -23],
    armF: [8, -34],
    handF: [11, -24],
    prop: [11, -24],
    legB: [-4, -18],
    footB: [-4, -5],
    legF: [4, -18],
    footF: [5, -5],
  });

  // ───────── Speerbündel auf dem Rücken (Signature): fünf Bambusspeere mit Federn, Schnur ─────────
  F.part('bundle', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    for (let i = 0; i < 5; i++) {
      // schräg nach hinten oben, die Spitzen ragen hinter dem Hut heraus
      const x0 = -6 + i * 1.8;
      const y0 = -12 + i * 0.4;
      const x1 = x0 - 14 - i * 1.6;
      const y1 = y0 - 50 + i * 1.4;
      g.stroke(polyline([[x0, y0], [x1, y1]]), '#8a7440', 2);
      g.stroke(polyline([[x0, y0], [x1, y1]]), BAMBOO, 1.2);
      const Ls = Math.hypot(x1 - x0, y1 - y0);
      const ux = (x1 - x0) / Ls;
      const uy = (y1 - y0) / Ls;
      g.mat(path([[x1 - uy * 1.6, y1 + ux * 1.6], [x1 + ux * 5, y1 + uy * 5, 1], [x1 + uy * 1.6, y1 - ux * 1.6]]), TIP, 'metal');
      g.fill(path([[x0, y0], [x0 - 2.6, y0 + 4, 1], [x0 + ux * 4, y0 + uy * 4]]), i % 2 ? '#f0e8d8' : '#c84a3a', { lod: 1 });
    }
    g.stroke(spline([[-12, -32], [-6, -30], [0, -33]]), '#6b4a2a', 1.2);
  });
  F.part('pennant', { bone: 'back', z: 3.5, zb: 46.5, team: true }, (g) => {
    g.mat(path([[-18, -52], [-27, -54], [-24, -50, 1], [-28, -47], [-17.4, -48]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Beine: kurze Hose, Gummisandalen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -18, x * 1.1, -5, 3.6, 3.4), x < 0 ? SKIN_D : SKIN, 'skin'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 3.6, -5], [fx + 3, -5], [fx + 7.6, -2.4], [fx + 7.6, 0, 1], [fx - 4.4, 0, 1]]), x < 0 ? SKIN_D : SKIN, 'skin');
      g.mat(rrect(fx - 4.6, -1.4, 12.6, 1.6, 0.6), '#3a6ad8', 'leather');
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 4, 8);
  F.part('shorts', { bone: 'hip', z: 15, zb: 15 }, (g) => {
    g.mat(path([[-9, -22], [9, -22], [10, -13], [2, -12.4], [0, -15], [-2, -12.4], [-10, -13]]), '#7a6a4a', 'cloth');
  });

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-8, -34, -10, -24, 3.6, 3.2), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-10.4, -22.6, 2.6), SKIN_D, 'skin'));

  // ───────── Weste mit vielen Taschen ─────────
  F.part('vest', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-8, -35], [8, -35], [10, -26], [9.6, -19], [-9.6, -19], [-10, -26]]), VEST, 'cloth');
    g.lod(1, (h) => {
      for (const [x, y] of [[-7, -30], [3, -30], [-7, -24.6], [3, -24.6]]) {
        h.mat(rrect(x, y, 4.6, 4, 0.8), '#c86a1a', 'cloth');
        h.stroke(polyline([[x, y + 1.2], [x + 4.6, y + 1.2]]), '#9a4a10', 0.4);
      }
    });
  });

  // ───────── Kopf: breites Gesicht, Ohren unter der Krempe, herausgestreckte Zunge ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 34 }, (g) => g.mat(path([[-6, -44], [-18, -48, 1], [-15, -43], [-6, -40]]), SKIN_D, 'skin'));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-7, -49], [3, -52.6], [13.6, -49], [16, -41], [13.6, -33.6], [6, -30.6], [-2, -31.6], [-7, -37]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[11.6, -43, 2.6], [4, -43, 2.4]],
    iris: '#8a4a1a',
    lidColor: SKIN,
    lid: 0.15,
    look: [0.6, 0],
    brow: { color: SKIN_D, w: 1.3, lift: 0.2 },
    mouth: [8.6, -35.6, 6],
    mood: 'grin',
    attackMouth: 'grin',
    replace: {
      attack: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.5, { lw: 0.9 });
        eye(g, c.E2[0], c.E2[1], { ...c.EYE, r: 2.4, lid: 0.2, look: [0.9, 0] });
        g.stroke(spline([[5.6, -36], [8.6, -35], [11.6, -36.4]]), INK, 0.9);
        g.mat(ellipse(10, -34, 1.8, 2.2, 20), '#e0656e', 'skin', { line: '#a84a50', lw: 0.4 });
      },
    },
  });
  F.part('tongue', { bone: 'head', z: 33.4, view: 'front', expr: 'idle' }, (g) => {
    g.mat(ellipse(10.6, -33.6, 1.8, 2.2, 20), '#e0656e', 'skin', { line: '#a84a50', lw: 0.4 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[7.6, -41], [15.6, -38, 1], [9, -37.4]]), SKIN, 'skin', { line: SKIN_D, lw: 0.6 }));
  F.part('earF', { bone: 'head', z: 34.5, zb: 29 }, (g) => g.mat(path([[13, -44], [24, -50, 1], [21, -44], [14, -40]]), SKIN, 'skin'));
  // Anglerhut mit Krempe und Haken
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-4, -49], [-3, -56], [3, -59], [10, -58], [13, -50]]), HAT, 'cloth', { hi: 0.3 });
    g.mat(path([[-13, -46, 1], [-6, -50.6], [4, -51.6], [14, -50.6], [21, -46.6, 1], [12, -47.6], [4, -48], [-5, -47.4]]), HAT, 'cloth');
    stitches(g, [[-10, -47.6], [-2, -49.4], [8, -49.6], [17, -47.8]], '#8a8640', { step: 1.8, len: 0.7, lod: 2 });
  });
  F.part('hatBand', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-3.6, -50], [13, -50.4], [12.6, -52.6], [-3.2, -52.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('hooks', { bone: 'hat', z: 37, zb: 37, variant: 0 }, (g) => {
    for (const x of [-9, 17]) {
      g.stroke(polyline([[x, -47.6], [x, -43.6]]), '#e8e8e0', 0.4);
      g.stroke(spline([[x, -43.6], [x, -41], [x + 1.6, -41.4], [x + 1.6, -42.6]]), HOOK, 0.7);
    }
  });
  F.part('feather', { bone: 'hat', z: 35.5, zb: 37, variant: 1 }, (g) => {
    g.mat(path([[-2, -52], [-9, -62], [-12, -66, 1], [-7, -60], [0, -54]]), '#f0e8d8', 'cloth');
  });
  F.part('patch', { bone: 'hat', z: 37, zb: 37, variant: 2 }, (g) => {
    g.mat(rrect(2, -57, 6, 5, 0.6), '#7a6a8a', 'cloth');
    stitches(g, [[2, -57], [8, -57], [8, -52], [2, -52], [2, -57]], '#d8d0b0', { step: 1.4, len: 0.6, lod: 1 });
  });

  // ───────── Wurfspeer in der Hand (bis zum Abwurf) und vorderer Arm ─────────
  F.part('spear', { bone: 'prop', z: 38, zb: 4, state: 'loaded' }, (g) => {
    g.stroke(polyline([[2, -18], [26, -40]]), '#8a7440', 2);
    g.stroke(polyline([[2, -18], [26, -40]]), BAMBOO, 1.2);
    g.mat(path([[24.6, -41.6], [30.6, -45, 1], [27.4, -38.6]]), TIP, 'metal');
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(8, -34, 10.6, -25, 3.6, 3.2), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(11, -23.4, 2.6), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, 0, -27, 1.8, { zb: 24, lod: 1 });

  F.anim({
    // zählen die Speere im Bündel
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 2, tilt: 3 }, keys: { armB: { r: [[0, 0], [0.3, 0], [0.4, 140], [0.5, 120], [0.6, 140], [0.7, 0]] }, head: { r: [[0, 0], [0.35, -6], [0.65, -6], [0.75, 0]] } } },
    // schnelles Tippeln, Speere klappern
    walk: { p: { stride: 28, bob: 2.2, armSwing: 14, lean: 4 }, keys: { back: { r: [[0, -3], [0.25, 3], [0.5, -3], [0.75, 3], [1, -3]] } } },
    // greift über die Schulter, weit ausholender Wurf mit Hüpfer
    attack: { prog: 'atk.throw', hit: 0.55, p: { wind: -170, strike: -40, over: 20, windB: -30 }, keys: { root: { y: [[0, 0], [0.5, 0], [0.6, -4, 'out'], [0.75, 0]] } }, ev: { release: 0.55 } },
    // Hut fliegt kurz hoch
    hit: { p: { knock: 2, recoil: 6 }, keys: { hat: { y: [[0, 0], [0.2, -5], [0.6, 0]] } } },
    spawn: { keys: { armF: { r: [[0, 0], [0.6, 0], [0.75, -150], [0.9, -150], [1, 0]] } } },
    // Speere fallen aus dem Bündel, er sinkt zusammen
    death: { p: { dir: -1, angle: 76 }, keys: { back: { x: [[0, 0], [0.3, 0], [0.7, -6]], r: [[0, 0], [0.3, 0], [0.7, -40]] } } },
  });
}
