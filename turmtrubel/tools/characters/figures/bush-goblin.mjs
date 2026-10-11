// Busch-Kobold – verschwörerischer Späher im Tarnanzug aus Blättern und Zweigen mit Dornendolch (Brief: docs/briefs/bush-goblin.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eyeX, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function bushGoblin(F) {
  const P = F.pal;
  const LEAF = P.main;
  const BERRY = P.acc;
  const SKIN = '#86b84f';
  const TWIG = '#6b4a2a';
  const LEAF_L = '#5a9a4a';
  const LEAF_D = '#2a5a28';

  F.rig('biped', {
    hip: [0, -18],
    torso: [0, -20],
    head: [6, -32],
    hat: [6, -48],
    back: [-6, -28],
    armB: [-4, -30],
    handB: [-8, -20],
    armF: [8, -30],
    handF: [16, -22],
    prop: [16, -22],
    legB: [-4, -16],
    footB: [-6, -3],
    legF: [4, -16],
    footF: [7, -3],
    cape: [0, -30],
  });

  // überlappende Blattschuppen
  const leaves = (g, pts, col, s = 1) => {
    for (const [x, y, a] of pts) g.mat(path([[x, y + 3 * s], [x - 3 * s, y - 1 * s], [x, y - 5 * s, 1], [x + 3 * s, y - 1 * s]]).rot(a, x, y), col, 'fur', { hi: 0.4 });
  };

  // ───────── Kurze Beine mit Fußwickeln ─────────
  const leg = (name, foot, x, fx, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -16, fx, -4, 2.4, 2.2), '#8a6a44', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(path([[fx - 3, -4], [fx + 3, -4.4], [fx + 7, -1.4], [fx + 7.4, 0, 1], [fx - 3.6, 0, 1]]), SKIN, 'skin', { hi: 0.4 }));
  };
  leg('legB', 'footB', -4, -6, 6);
  leg('legF', 'footF', 4, 7, 8);
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-4, -30, -8, -21, 2, 1.8), '#6a9a3e', 'skin'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-8, -20, 2.4), '#6a9a3e', 'skin'));

  // ───────── Blätteranzug (Signature): Rumpf und Kopf als Laubhaufen ─────────
  F.part('suit', { bone: 'torso', z: 20, zb: 20, sig: true }, (g) => {
    g.mat(blob([[-14, -14], [-14, -28], [-6, -36], [8, -36], [16, -26], [14, -14]], 0.7), LEAF_D, 'fur');
    leaves(g, [[-10, -16, -20], [-4, -14, 0], [4, -14, 10], [10, -16, 20], [-12, -24, -30], [-2, -22, 0], [8, -22, 20], [-6, -30, -10], [4, -30, 10], [12, -26, 30]], LEAF, 1.2);
    g.lod(1, (h) => leaves(h, [[-8, -26, -20], [0, -18, 0], [10, -30, 10]], LEAF_L, 0.9));
  });
  // Gürtel (Teamzone) aus Rindenband
  F.part('belt', { bone: 'hip', z: 21, zb: 21, team: true }, (g) => g.mat(path([[-14, -19], [14, -19], [14, -15.6], [-14, -15.6]]), P.team, 'leather', { line: P.teamDeep, lw: 0.4 }));
  F.part('berries', { bone: 'hip', z: 21.5, zb: 21.5, lod: 1 }, (g) => {
    for (const [x, y] of [[-10, -14], [-8, -12], [-11, -11]]) g.fill(circle(x, y, 1.2), BERRY);
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-8, -34], [-6, -44], [6, -48], [16, -44], [18, -34], [12, -28], [-2, -28]], 0.7), LEAF_D, 'fur');
    leaves(g, [[-6, -36, -30], [0, -44, -10], [10, -44, 10], [16, -36, 30], [6, -30, 0]], LEAF, 1.1);
    // Gesichtsöffnung
    g.fill(ellipse(10, -37, 6, 4.4), '#1a2a14');
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'sleep', 'attack', 'ability'], glow: true }, (g) => {
    for (const x of [8, 13]) g.fill(ellipse(x, -38.6, 1.2, 1.4), '#ffe08a');
  });
  F.part('grin', { bone: 'head', z: 31.2, view: 'front', expr: ['idle', 'attack', 'ability'] }, (g) => {
    g.fill(path([[7, -35], [14, -35.6], [12, -33.4], [9, -33.4]]), WHITE, { stroke: INK, lw: 0.4 });
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    for (const x of [8, 13]) g.fill(circle(x, -38.6, 0.7), '#ffe08a');
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 8, -38.6, 1.2, '#c8c8a0', 0.6);
    eyeX(g, 13, -38.6, 1.2, '#c8c8a0', 0.6);
  });
  // Stirnband (Teamzone) und Zweigkrone
  F.part('headband', { bone: 'head', z: 32, zb: 32, team: true }, (g) => g.mat(path([[-7, -41], [17, -42], [17.4, -39.6], [-6.6, -38.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('twigs', { bone: 'hat', z: 33, zb: 33 }, (g) => {
    for (const [x0, x1, y1] of [[0, -4, -56], [6, 8, -60], [12, 16, -55]]) {
      g.stroke(polyline([[x0, -46], [x1, y1]]), TWIG, 1.2);
      g.stroke(polyline([[(x0 + x1) / 2, (-46 + y1) / 2], [(x0 + x1) / 2 + 3, (-46 + y1) / 2 - 3]]), TWIG, 0.8, { lod: 1 });
    }
    leaves(g, [[-4, -56, -30], [8, -60, 0], [16, -55, 30]], LEAF_L, 0.8);
  });
  // ───────── Dornendolch und vorderer Arm ─────────
  F.part('dagger', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[14, -24, 1], [26, -27, 1], [16, -21, 1]]), '#7a9a3a', 'wood', { hi: 0.4 });
    g.lod(1, (h) => {
      for (const [x, y] of [[18, -25], [22, -26]]) h.fill(poly([[x, y], [x + 1, y - 2.4], [x + 1.6, y]], 0.1), '#c8a070');
    });
    g.mat(rrect(12, -25, 4, 3.4, 1), TWIG, 'wood');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(8, -30, 15, -23, 2, 1.8), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(16, -22, 2.4), SKIN, 'skin'));
  F.part('leafBurst', { bone: 'root', z: 50, state: ['scatter', 'spawn'] }, (g) => leaves(g, [[-16, -40, 40], [20, -44, -30], [-20, -20, 70], [24, -18, 10], [0, -54, -60]], LEAF, 1));
  emblem(F, 'emblem', 'torso', 24, -6, -20, 1.6, { zb: 24 });

  F.anim({
    // schaut sich verstohlen um, Blätter rascheln
    idle: { p: { breathe: 0.03, bob: 0.6, sway: 1, tilt: 2 }, keys: { head: { r: [[0, 0], [0.3, -12], [0.45, -12], [0.6, 10], [0.75, 10], [0.9, 0]] } } },
    // schleicht in Hockstellung
    walk: { p: { stride: 18, bob: 1.2, armSwing: 6, lean: 6 }, keys: { root: { y: [[0, 1], [1, 1]] } } },
    // Sprung aus der Hocke, Stich
    attack: { prog: 'atk.thrust', hit: 0.55, p: { wind: 30, strike: -80, pull: 3, reach: 6, lean: 12, lunge: 14 }, keys: { root: { y: [[0, 0], [0.35, 2], [0.5, -8, 'out'], [0.7, 0, 'in']] } }, ev: { strike: 0.55 } },
    // Blätter fliegen weg
    hit: { p: { knock: 1.8, recoil: 4 }, keys: { show: { scatter: [[0, 0.6]] } } },
    // springt aus dem Busch, Blätterregen
    spawn: { keys: { root: { y: [[0, 0], [0.3, -14, 'out'], [0.6, 0, 'in']] } } },
    // zerfällt in einen Laubhaufen
    death: { prog: 'generic.death', keys: { show: { scatter: [[0.2, 1.01]] } } },
  });
}
