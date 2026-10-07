// Fischer – knurriger Seebär in gelbem Ölzeug mit Südwester, Pfeife und Angelrute samt Riesen-Blinker
// (Brief: docs/briefs/fisherman.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function fisherman(F) {
  const P = F.pal;
  const OIL = P.main;
  const KNIT = P.acc;
  const OIL_D = '#c89a1e';
  const BEARD = '#e8e2d6';
  const SKIN = '#e8a87e';
  const LURE = '#c8ccd2';
  const PIPE = '#6b4a2a';
  const BAMBOO = '#c9b06a';
  const BOOT = '#3a4a44';

  F.rig('biped', {
    hip: [0, -28],
    torso: [0, -31],
    head: [3, -62],
    hat: [3, -78],
    armB: [-16, -58],
    handB: [-20, -40],
    armF: [16, -58],
    handF: [22, -40],
    prop: [22, -40],
    legB: [-7, -28],
    footB: [-8, -7],
    legF: [7, -28],
    footF: [8, -7],
    jaw: [12, -57],
  });

  // ───────── Gummistiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -29, x * 1.1, -14, 7.4, 6.8), '#6a5a48', 'cloth');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 6.6, -20], [fx + 6, -20], [fx + 6.4, -7], [fx + 11.6, -3.4], [fx + 11.8, 0, 1], [fx - 7, 0, 1], [fx - 7.4, -8]]), BOOT, 'leather', { hi: 0.55 });
      g.mat(rrect(fx - 7.4, -21.6, 14.4, 3.6, 1.4), '#2e3c36', 'leather');
      g.lod(1, (h) => h.fill(ellipse(fx + 2, -12, 1.6, 1), '#e8eef0', { op: 0.35 }));
    });
  };
  leg('legB', 'footB', -7, 6);
  leg('legF', 'footF', 7, 8);

  // ───────── Hinterer Arm ─────────
  const sleeve = (x0, s, color) => {
    const X = (x) => x0 + x * s;
    return limb(X(0), -58, X(4), -42, 7.6, 7);
  };
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(sleeve(-16, -1, OIL_D), OIL_D, 'leather', { hi: 0.5 }));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-20.4, -38.6, 3.8), '#cf9070', 'skin'));

  // ───────── Ölzeugjacke über Strickpullover ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-16, -60], [-5, -63], [8, -63], [17, -60], [21, -42], [21, -20], [11, -18], [0, -19.6], [-11, -18], [-21, -20], [-21, -42]]);
    g.mat(c, OIL, 'leather', { hi: 0.6 });
    g.lod(1, (h) => {
      lines(h, [[[-14, -40], [-12, -24]], [[15, -42], [14, -26]]], OIL_D, 0.8, 1);
      // Salzflecken
      h.fill(ellipse(-12, -32, 2.6, 1.6), '#f8eab0', { op: 0.6 });
      h.fill(ellipse(14, -50, 2, 1.2), '#f8eab0', { op: 0.6 });
    });
  });
  F.part('sweater', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    const s = path([[-3, -62], [10, -62], [8, -36], [4, -19.6], [-1, -36]]);
    g.mat(s, KNIT, 'cloth');
    g.clipTo(s, (h) => {
      for (let y = -60; y < -20; y += 3.4) h.stroke(spline([[-2, y], [1.4, y + 1.6], [4, y], [6.6, y + 1.6], [9.4, y]]), '#22604f', 0.6, { lod: 1 });
    });
    // Jackenknebel
    for (const y of [-52, -42, -32]) g.mat(rrect(-4.6, y, 2, 4.4, 1), PIPE, 'wood', { lod: 1 });
  });
  F.part('neckerchief', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    g.mat(path([[-10, -63], [14, -63], [11, -58], [2, -53, 1], [-6, -58]]), P.team, 'cloth', { line: P.teamDeep });
  });

  // ───────── Kopf: Rauschebart, Pfeife, Südwester ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-7, -74], [4, -77], [14.6, -73], [16.6, -64], [14, -56], [6, -53], [-2, -55], [-7, -61]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[11.6, -66.4, 2.2], [4, -66.4, 2]],
    iris: '#3a5a7a',
    lidColor: SKIN,
    lid: 0.55,
    look: [0.4, 0.1],
    brow: false,
    mouth: [9.4, -58.6, 4.6],
    mood: 'neutral',
    attackMouth: 'clench',
  });
  F.part('brows', { bone: 'head', z: 33.5, view: 'front' }, (g) => {
    g.mat(path([[8, -69.4], [11.6, -71], [15.6, -70], [16.4, -67.6, 1], [12.6, -69], [8.6, -68]]), BEARD, 'hair');
    g.mat(path([[1.4, -69.4], [4, -70.6], [6.6, -69.4], [6, -68], [3, -68.4], [0.6, -67.6, 1]]), BEARD, 'hair');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(9.6, -62.4, 2.8, 2.4), '#e08a6a', 'skin', { line: '#a8584a', lw: 0.6 });
  });
  F.part('beard', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-3, -64], [1, -59], [6, -56.6], [14, -57], [17.4, -62], [18, -55], [14, -48], [7, -45.6], [0, -48], [-4, -55]]), BEARD, 'hair', { hi: 0.4 });
    g.mat(path([[5, -60.6], [9.6, -59.6], [14.6, -61], [15, -58.6], [9.6, -58], [4.6, -58.6]]), BEARD, 'hair');
    lines(g, [[[2, -53], [4, -49]], [[8, -52], [8.6, -47.6]], [[13, -53], [12.6, -49]]], '#c8c0b0', 0.6, 1);
  });
  // Pfeife im Mundwinkel (Kiefer, wippt beim Ziehen)
  F.part('pipe', { bone: 'jaw', z: 35, view: 'front' }, (g) => {
    g.stroke(spline([[13, -58], [17, -57], [20, -56.4]]), PIPE, 1.4);
    g.mat(path([[19, -61], [23.6, -61], [23, -55], [20, -54.6], [19, -57]]), PIPE, 'wood');
    g.fill(ellipse(21.3, -60.8, 2.2, 0.8), '#2a1a10', { lod: 1 });
  });
  F.part('smoke', { bone: 'jaw', z: 35.5, state: 'puff', lod: 1 }, (g) => {
    for (const [x, y, r] of [[22, -65, 1.6], [24, -69, 2.2], [22.6, -74, 2.8]]) g.fill(circle(x, y, r), '#f0f0f0', { op: 0.6 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-7, -74], [16, -74], [15, -60], [8, -55], [-2, -56], [-7, -62]]), '#d8d0c0', 'hair');
  });
  F.part('souwester', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-11, -71], [-9, -79], [-1, -85], [9, -85.6], [16, -81], [18, -73]]), OIL, 'leather', { hi: 0.6 });
    // Krempe: hinten lang heruntergezogen (Nackenschutz), vorn schmal
    g.mat(path([[-14, -63, 1], [-15, -69], [-8, -73], [4, -74.6], [14, -73.6], [21.4, -71.4], [22, -69.4, 1], [12, -70.4], [0, -70.6], [-8, -68], [-11, -62]]), OIL_D, 'leather', { hi: 0.5 });
  });
  F.part('hatband', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-10, -74.4], [17.4, -74.6], [17.6, -77.6], [-9.2, -77.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });

  // ───────── Angelrute mit Kurbel und Blinker (Signature) ─────────
  F.part('rod', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    const tip = [44, -104];
    g.stroke(polyline([[16, -28], [22, -40], tip]), '#8a7440', 2.4);
    g.stroke(polyline([[16, -28], [22, -40], tip]), BAMBOO, 1.5);
    g.lod(1, (h) => {
      for (const t of [0.35, 0.6, 0.82]) h.fill(circle(22 + (tip[0] - 22) * t, -40 + (tip[1] + 40) * t, 1.1), '#8a7440');
    });
    // Kurbel
    g.mat(circle(19.4, -34.6, 2.8), '#9aa3ad', 'metal');
    g.stroke(polyline([[19.4, -34.6], [16, -31]]), '#5d6672', 1);
    // Schnur und Blinker
    g.stroke(spline([tip, [46, -90], [45, -78]]), '#f0ece0', 0.5);
    g.mat(path([[45, -79], [49, -75], [49.6, -68], [46, -63], [44.6, -67.6], [41, -64, 1], [41.6, -70], [43.4, -76]]), LURE, 'metal', { hi: 1 });
    g.fill(circle(46.8, -74.4, 0.9), '#c84a3a', { lod: 1 });
    g.stroke(polyline([[44, -70], [48, -70]]), '#8a929c', 0.5, { lod: 1 });
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(sleeve(16, 1, OIL), OIL, 'leather', { hi: 0.55 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(22.4, -38.6, 3.8), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -11, -48, 2.6, { zb: 24 });

  F.anim({
    // zieht an der Pfeife, prüft die Schnur
    idle: { p: { breathe: 0.025, bob: 0.6, sway: 1.5 }, keys: { jaw: { r: [[0, 0], [0.2, 0], [0.3, -6], [0.45, -6], [0.55, 0]] }, show: { puff: [[0.55, 0.85]] }, prop: { r: [[0, 0], [0.6, 0], [0.7, -4], [0.8, 2], [0.9, 0]] } } },
    // schwerer, wiegender Seemannsgang
    walk: { p: { stride: 18, bob: 2, armSwing: 3, lean: 2 }, keys: { root: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // Rutenstoß
    attack: { prog: 'atk.thrust', hit: 0.55, p: { wind: 20, strike: -40, cock: 10, snap: 30, pull: 5, reach: 9, lunge: 10 } },
    // Auswurf über Kopf, Schnur spannt, Einholen
    ability: { prog: 'atk.throw', hit: 0.6, p: { wind: -150, strike: -40, windB: -20 } },
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 0], [0.2, 14], [1, 0]], y: [[0, 0], [0.2, 2], [1, 0]] } } },
    death: { p: { dir: -1, angle: 70 }, keys: { jaw: { y: [[0, 0], [0.3, 0], [0.7, 30]] } } },
  });
}
