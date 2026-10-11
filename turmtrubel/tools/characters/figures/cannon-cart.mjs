// Kanonenkarre – Hechtkopf-Kanone aus Bronze auf einer Schubkarre, geschoben von einem kleinen Kanonier mit Ohrenschützern
// (Brief: docs/briefs/cannon-cart.md). Form „cannon“: Karre zerbrochen, das Rohr steht auf einem Dreibein aus Karrenstangen.
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function cannonCart(F) {
  const P = F.pal;
  const FISH = P.main;
  const BRASS = P.acc;
  const WOOD = '#8a5a32';
  const SKIN = '#e8b08a';
  const FISH_D = '#2a6a62';

  F.rig('vehicle', {
    body: [0, -14],
    wheelF: [18, -8],
    wheelB: [18, -8],
    barrel: [2, -27],
    flag: [-16, -24],
    c1Torso: [-30, -18],
    c1Head: [-30, -32],
    c1ArmF: [-28, -28],
    c1ArmB: [-30, -28],
    c1Legs: [-31, -16],
  });
  F.defaultForm = ['base', 'cannon'];

  // ───────── Kanonier (beide Formen): Wollmütze, Ohrenschützer (Teamzone), Schürze ─────────
  F.part('c1Legs', { bone: 'c1Legs', z: 4 }, (g) => {
    for (const [x0, x1] of [[-33, -36], [-29, -26]]) {
      g.mat(limb(x0, -16, x1, -4, 2.6, 2.2), '#4a4a5a', 'cloth');
      g.mat(path([[x1 - 3, -5], [x1 + 3, -5.4], [x1 + 6, -2], [x1 + 6, 0, 1], [x1 - 3.6, 0, 1]]), '#3a2a1e', 'leather');
    }
  });
  F.part('c1ArmB', { bone: 'c1ArmB', z: 5 }, (g) => g.mat(limb(-30, -28, -22, -21, 2.2, 2), '#b8885a', 'skin'));
  F.part('c1Torso', { bone: 'c1Torso', z: 6 }, (g) => {
    g.mat(path([[-36, -30], [-26, -31], [-23, -18], [-24, -14], [-36, -14], [-37, -20]]), '#6a7a8a', 'cloth', { hi: 0.4 });
    g.mat(path([[-30, -26], [-23, -26], [-23, -14], [-31, -14]]), '#d8ccb0', 'cloth');
    // Fernrohr in der Schürzentasche
    g.mat(rrect(-27, -24, 2.4, 6, 0.8), BRASS, 'metal', { lod: 1 });
  });
  F.part('c1Head', { bone: 'c1Head', z: 7 }, (g) => {
    g.mat(blob([[-37, -36], [-34, -42], [-27, -43], [-22, -38], [-23, -31], [-28, -28.6], [-34, -30]], 0.7), SKIN, 'skin');
    g.fill(ellipse(-24.6, -32.4, 1.8, 1.2), '#f0907a', { op: 0.6 });
    // Wollmütze mit Bommel
    g.mat(path([[-38, -38], [-36, -45], [-29, -48], [-23, -45], [-22, -39], [-30, -40.6]]), '#c84a3a', 'cloth', { hi: 0.4 });
    g.mat(circle(-30, -49, 2.2), '#f2efe6', 'cloth');
  });
  F.part('c1Face.idle', { bone: 'c1Head', z: 7.5, expr: ['idle', 'sleep', 'hurt', 'stun'] }, (g) => {
    g.fill(ellipse(-25, -36.4, 1, 1.3), INK);
    g.fill(circle(-24.6, -37, 0.35), WHITE);
    // pfeift durch die Zahnlücke
    g.fill(circle(-23.4, -31.6, 0.9), '#5a2a2a');
  });
  F.part('c1Face.attack', { bone: 'c1Head', z: 7.5, expr: ['attack', 'ability', 'death'] }, (g) => {
    eyeClosed(g, -25, -36.4, 1.4, { up: true, lw: 0.7 });
    g.stroke(polyline([[-25, -31], [-22.6, -31.4]]), INK, 0.7);
  });
  F.part('earmuffs', { bone: 'c1Head', z: 7.8, team: true }, (g) => {
    g.stroke(spline([[-32, -38], [-30, -46], [-27, -38]]), P.teamDeep, 0.8);
    g.mat(circle(-30.6, -35.6, 3), P.team, 'cloth', { line: P.teamDeep, hi: 0.5 });
  });
  F.part('c1ArmF', { bone: 'c1ArmF', z: 26 }, (g) => {
    g.mat(limb(-28, -28, -21, -21, 2.4, 2.2), '#6a7a8a', 'cloth');
    g.mat(circle(-20.6, -20.6, 2.2), SKIN, 'skin');
  });

  // ───────── Schubkarre (nur Normalform) ─────────
  F.part('handles', { bone: 'body', z: 8, form: 'base' }, (g) => {
    g.mat(path([[-24, -22, 1], [-8, -18, 1], [-8, -16, 1], [-24, -20.4, 1]]), WOOD, 'wood');
    g.mat(limb(-10, -12, -12, -2, 1.2, 1.2), WOOD, 'wood');
  });
  F.part('tray', { bone: 'body', z: 10, form: 'base' }, (g) => {
    const t = path([[-14, -24, 1], [18, -24, 1], [14, -12, 1], [-10, -12, 1]]);
    g.mat(t, WOOD, 'wood', { hi: 0.4 });
    g.clipTo(t, (h) => h.lod(1, (k) => lines(k, [[[-12, -20], [16, -20]], [[-10, -16], [15, -16]]], '#5a3a1e', 0.6, 1)));
    g.lod(1, (h) => rivets(h, [[-12, -22.6], [16, -22.6], [-9, -13.4], [13, -13.4]], 0.6, '#c8ccd2'));
  });
  F.part('wheelF', { bone: 'wheelF', z: 12, form: 'base' }, (g) => {
    g.mat(circle(18, -8, 8), '#5a3a22', 'wood', { hi: 0.4 });
    g.mat(circle(18, -8, 5.6), '#8a6a44', 'wood');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.mat(limb(18, -8, 18 + Math.cos(a) * 5.6, -8 + Math.sin(a) * 5.6, 0.9, 0.9), '#5a3a22', 'wood');
    }
    g.mat(circle(18, -8, 2), BRASS, 'metal');
  });
  // Karrenwimpel (Teamzone)
  F.part('pennant', { bone: 'flag', z: 9, team: true, form: 'base' }, (g) => {
    g.stroke(polyline([[-16, -22], [-16, -40]]), '#6a4a2e', 1);
    g.mat(path([[-16, -40], [-4, -37], [-9, -35], [-4, -33], [-16, -31]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Feste Kanone: Dreibein aus Karrenstangen, Trümmer (Form „cannon“) ─────────
  F.part('tripod', { bone: 'body', z: 10, form: 'cannon' }, (g) => {
    for (const [x0, x1] of [[2, -10], [4, 16], [3, 4]]) g.mat(path([[x0 - 1.2, -24, 1], [x0 + 1.2, -24, 1], [x1 + 1.4, 0, 1], [x1 - 1.4, 0, 1]]), WOOD, 'wood');
    g.stroke(spline([[-6, -12], [3, -14], [12, -12]]), '#c8a870', 0.9);
  });
  F.part('debris', { bone: 'root', z: 3, form: 'cannon' }, (g) => {
    g.mat(rrect(-20, -3, 12, 3, 0.6).rot(-8, -14, -1), WOOD, 'wood');
    g.mat(circle(26, -4, 4), '#5a3a22', 'wood');
    g.mat(rrect(18, -2.6, 10, 2.6, 0.6).rot(12, 22, -1), '#6a4a2e', 'wood');
  });
  F.part('flagStump', { bone: 'root', z: 3.5, team: true, form: 'cannon' }, (g) => {
    g.stroke(polyline([[-24, 0], [-22, -18]]), '#6a4a2e', 1);
    g.mat(path([[-22, -18], [-12, -15], [-16, -13.6], [-12, -12], [-22, -10]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Hechtkopf-Rohr (Signature, beide Formen) ─────────
  F.part('barrel', { bone: 'barrel', z: 20, zb: 20, sig: true }, (g) => {
    const b = path([[-10, -30], [-6, -34], [8, -36], [22, -36], [32, -34], [36, -30], [34, -24], [26, -21], [10, -20], [-4, -21], [-10, -24]]);
    g.mat(b, FISH, 'metal', { hi: 0.8 });
    g.clipTo(b, (h) => {
      // Schuppenmuster
      h.lod(1, (k) => {
        for (let x = -6; x < 24; x += 4) for (const y of [-31, -27, -23]) k.stroke(spline([[x - 2, y], [x, y + 1.6], [x + 2, y]]), FISH_D, 0.5);
      });
      h.fill(path([[-10, -24], [34, -24], [34, -20], [-10, -20]]), '#8ad0c0', { op: 0.25 });
    });
    // Flossenkamm
    g.mat(path([[0, -34], [4, -42], [8, -38], [12, -44], [16, -38], [20, -42], [22, -36]]), FISH_D, 'metal', { hi: 0.5 });
    // Messingbänder
    for (const x of [-4, 12]) g.mat(rrect(x, -35.4, 3, 15, 1), BRASS, 'gold', { hi: 0.8 });
    // Schwanzflosse hinten
    g.mat(path([[-10, -27], [-18, -34], [-16, -27], [-18, -20]]), FISH_D, 'metal');
  });
  F.part('fishMouth', { bone: 'barrel', z: 20.5, zb: 20.5 }, (g) => {
    g.fill(path([[30, -29], [37, -30.6], [37, -24.4], [30, -26]]), '#1a1a20');
    for (const x of [31, 33, 35]) g.fill(poly([[x - 0.8, -30], [x, -28], [x + 0.8, -30]], 0.1), WHITE);
    g.lod(1, (h) => h.fill(ellipse(34, -27, 2, 1.6), '#3a3030', { op: 0.6 }));
  });
  F.part('fishEye', { bone: 'barrel', z: 21, expr: ['idle', 'attack', 'ability', 'hurt', 'stun', 'death'] }, (g) => {
    eye(g, 24, -31, { r: 3.4, iris: '#e8c040', lidColor: FISH, look: [1, 0], ratio: 1, irisR: 0.55 });
  });
  F.part('fishEye.sleep', { bone: 'barrel', z: 21, expr: 'sleep' }, (g) => eyeClosed(g, 24, -31, 3.4, { lw: 0.8 }));
  F.part('smoke', { bone: 'barrel', z: 22, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[37, -32], [46, -36], [44, -28], [52, -27], [44, -24], [46, -18], [37, -23]]), '#ffd27a', { op: 0.9 });
    for (const [x, y, r] of [[48, -36, 4], [54, -30, 5], [50, -22, 4]]) g.fill(circle(x, y, r), '#d8d4d0', { op: 0.7 });
  });
  emblem(F, 'emblem', 'barrel', 21.5, 6, -28, 2.4, { zb: 21.5 });
  F.defaultForm = undefined;

  F.anim({
    // Kanonier schaut durchs Fernrohr, das Fischauge blinzelt
    idle: { prog: 'vehicle.idle', p: { lean: 4 }, keys: { c1ArmB: { r: [[0, 0], [0.3, 0], [0.4, -100], [0.75, -100], [0.85, 0]] }, expr: [[0.9, 0.97, 'sleep']] } },
    // Karre rollt, Kanonier schiebt
    walk: { prog: 'vehicle.walk', p: { push: 8 }, keys: { c1Legs: { r: [[0, -14], [0.5, 14], [1, -14]] } } },
    // Rohr ruckt zurück, Rauch aus dem Fischmaul, der Kanonier hält sich die Ohren zu
    attack: {
      prog: 'vehicle.idle',
      hit: 0.55,
      keys: { barrel: { x: [[0, 0], [0.55, 0], [0.6, -5, 'snap'], [0.85, 0]], r: [[0, 0], [0.55, 0], [0.6, -4], [0.85, 0]] }, c1ArmF: { r: [[0, 0], [0.3, -120], [0.85, -120], [1, 0]] }, c1ArmB: { r: [[0, 0], [0.3, -120], [0.85, -120], [1, 0]] }, show: { muzzle: [[0.55, 0.72]] } },
      ev: { release: 0.55 },
    },
    // Karre ruckelt
    hit: { prog: 'generic.hit', keys: { body: { r: [[0, 0], [0.2, -4], [0.4, 3], [0.6, 0]] } } },
    // landet auf dem Rad und rollt an
    spawn: { prog: 'generic.spawn', keys: { wheelF: { r: [[0, -200], [1, 0]] } } },
    // Rohr zerspringt, der Kanonier rennt weg
    death: { prog: 'generic.death', keys: { c1Torso: { x: [[0, 0], [1, -24]] }, c1Legs: { x: [[0, 0], [1, -24]] } } },
  });
}
