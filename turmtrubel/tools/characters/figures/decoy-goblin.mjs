// Lockvogel-Kobold – Kobold in einem albernen Lockenten-Kostüm aus bemaltem Holz mit gelbem Holzschnabel
// (Brief: docs/briefs/decoy-goblin.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeX, eyeSpiral, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function decoyGoblin(F) {
  const P = F.pal;
  const WOODPAINT = P.main;
  const RING = P.acc;
  const BEAK = '#f0c030';
  const SKIN = '#97c25a';
  const SKIN_D = '#6e9a3a';
  const PAINT_D = '#8a8274';
  const WEB = '#e88a3a';

  F.rig('biped', {
    hip: [0, -16],
    torso: [0, -18],
    head: [4, -38],
    hat: [4, -60],
    back: [-8, -28],
    armB: [-9, -28],
    handB: [-12, -20],
    armF: [9, -28],
    handF: [15, -21],
    prop: [15, -21],
    legB: [-3, -12],
    footB: [-3, -3],
    legF: [4, -12],
    footF: [5, -3],
    cape: [0, -30],
  });

  // ───────── Koboldbeine mit Schwimmhaut-Schuhen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -14, x, -4, 2.2, 2), SKIN, 'skin'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 2, -4], [x + 2, -4.4], [x + 9, -1, 1], [x + 8, 0.4], [x + 5.6, -0.6], [x + 4, 0.4], [x - 2.6, 0, 1]]), WEB, 'leather', { hi: 0.4 });
    });
  };
  leg('legB', 'footB', -3, 6);
  leg('legF', 'footF', 4, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-9, -28, -12, -21, 2.2, 1.9), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-12, -20, 2.4), SKIN_D, 'skin'));

  // ───────── Holzenten-Kostüm (Signature): runder Rumpf, Bürzel, aufgemalte Federn ─────────
  F.part('tail', { bone: 'torso', z: 14, zb: 14 }, (g) => {
    g.mat(path([[-13, -26], [-22, -36], [-20, -30, 1], [-24, -32], [-18, -22], [-12, -18]]), WOODPAINT, 'wood', { hi: 0.4 });
  });
  F.part('duckBody', { bone: 'torso', z: 20, zb: 20, sig: true }, (g) => {
    const b = blob([[-15, -24], [-10, -34], [2, -36], [12, -32], [16, -22], [12, -12], [0, -9], [-12, -12]], 0.8);
    g.mat(b, WOODPAINT, 'wood', { hi: 0.5 });
    g.clipTo(b, (h) => {
      h.fill(blob([[-14, -22], [-6, -30], [6, -28], [2, -18], [-10, -16]], 0.7), PAINT_D, { op: 0.6 });
      h.lod(1, (k) => {
        for (const [x, y] of [[-8, -26], [-4, -22], [0, -26], [-10, -19]]) k.stroke(spline([[x - 3, y + 1], [x, y - 1], [x + 3, y + 1]]), '#6a6258', 0.6);
      });
      // abgeplatzte Farbe
      h.fill(ellipse(9, -16, 2, 1.2), '#c8a878', { lod: 1 });
      h.fill(rrect(-16, -21, 34, 2.2, 0), '#5a3a22');
    });
  });

  // ───────── Kopf: Koboldgesicht unter der Entenkopf-Kapuze ─────────
  F.part('face', { bone: 'head', z: 28, zb: 28 }, (g) => {
    g.mat(blob([[0, -44], [4, -50], [12, -50], [17, -44], [16, -37], [10, -33], [2, -34], [-1, -38]], 0.7), SKIN, 'skin', { hi: 0.3 });
  });
  F.part('face.idle', { bone: 'head', z: 29, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 13, -42.6, { r: 2.4, iris: '#c8a020', lidColor: SKIN, look: [0.4, 0], ratio: 1 });
    eye(g, 7, -42.6, { r: 2.2, iris: '#c8a020', lidColor: SKIN, look: [0.4, 0], ratio: 1 });
    g.stroke(spline([[7, -37.4], [10.6, -35.4], [14.4, -37.6]]), INK, 0.8);
    g.fill(rrect(10, -37, 1.4, 1.4, 0.3), WHITE, { stroke: INK, lw: 0.3 });
  });
  F.part('face.attack', { bone: 'head', z: 29, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 13, -42.6, { r: 2.4, iris: '#c8a020', lidColor: SKIN, lid: 0.45, look: [0.8, 0.1], ratio: 1 });
    eye(g, 7, -42.6, { r: 2.2, iris: '#c8a020', lidColor: SKIN, lid: 0.45, look: [0.8, 0.1], ratio: 1 });
    mouthOpen(g, 11, -36.4, 6, 2.6, { teeth: 'clench', tongue: false, lw: 0.6 });
  });
  F.part('face.hurt', { bone: 'head', z: 29, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eyeSpiral(g, 13, -42.6, 2.2, INK, 0.6);
    eyeSpiral(g, 7, -42.6, 2, INK, 0.6);
    g.fill(ellipse(11, -36.4, 1.4, 1.6), '#4a1c24');
  });
  F.part('face.death', { bone: 'head', z: 29, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 13, -42.6, 1.8, INK, 0.8);
    eyeX(g, 7, -42.6, 1.6, INK, 0.8);
  });
  F.part('hood', { bone: 'hat', z: 32, zb: 32 }, (g) => {
    // Entenkopf als Kapuze, offen zum Gesicht
    g.mat(path([[-6, -36], [-8, -48], [-2, -58], [8, -61], [16, -57], [19, -50], [16, -48], [12, -51], [4, -51], [0, -46], [0, -38]]), WOODPAINT, 'wood', { hi: 0.5 });
    g.fill(ellipse(12, -56, 1.8, 2), INK);
    g.fill(circle(12.6, -56.8, 0.6), WHITE);
  });
  F.part('neckRing', { bone: 'hat', z: 32.5, zb: 32.5 }, (g) => g.mat(path([[-7, -40], [1, -40], [1, -36.6], [-6.6, -36.6]]), RING, 'cloth'));
  F.part('beak', { bone: 'hat', z: 33, zb: 33, state: ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'death'] }, (g) => {
    g.mat(path([[15, -55], [26, -52.6], [29, -50, 1], [24, -48.6], [15, -48.6]]), BEAK, 'wood', { hi: 0.7 });
    g.stroke(polyline([[16, -51], [27, -50.6]]), '#b8862a', 0.6, { lod: 1 });
  });
  F.part('beakQuack', { bone: 'hat', z: 33, zb: 33, state: 'quack' }, (g) => {
    g.mat(path([[15, -55], [26, -56.6], [29, -55, 1], [24, -52.6], [15, -51.6]]), BEAK, 'wood', { hi: 0.7 });
    g.mat(path([[15, -50.6], [25, -47.4], [27, -46, 1], [15, -48]]), BEAK, 'wood');
    g.fill(path([[15, -51.6], [24, -51.6], [24, -48.6], [15, -50.6]]), '#5a2a1a');
  });
  // Schnabelband (Teamzone)
  F.part('beakBand', { bone: 'hat', z: 33.5, zb: 33.5, team: true }, (g) => g.mat(path([[17, -55.6], [20, -55], [20, -48.4], [17, -48.4]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('quackFx', { bone: 'hat', z: 34, state: 'quack', glow: true }, (g) => {
    for (const r of [4, 7]) g.stroke(spline([[30 + r * 0.4, -56 - r * 0.4], [31 + r * 0.7, -51], [30 + r * 0.4, -46 + r * 0.4]]), '#fff4c8', 0.8);
  });
  // Halstuch (Teamzone)
  F.part('scarf', { bone: 'torso', z: 24, zb: 24, team: true }, (g) => {
    g.mat(path([[-2, -37], [12, -36], [9, -32], [5, -29, 1], [2, -33], [-2, -34]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Kurzer Dolch und vorderer Arm ─────────
  F.part('dagger', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[16, -23], [24, -24.6], [27, -24, 1], [24, -22], [16, -20]]), '#c8ccd2', 'metal', { hi: 0.9 });
    g.mat(rrect(13, -23, 4, 3.6, 1), '#7a5232', 'wood');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(9, -28, 14, -22, 2.2, 1.9), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(15, -21, 2.6), SKIN, 'skin'));
  F.part('feathers', { bone: 'root', z: 50, state: 'scatter' }, (g) => {
    for (const [x, y, r] of [[-16, -30, 30], [12, -40, -40], [-4, -48, 70], [20, -20, 10], [-20, -14, -60]]) g.mat(ellipse(x, y, 3.4, 1.2, r), '#d8d0c0', 'cloth');
  });
  emblem(F, 'emblem', 'torso', 25, -6, -16, 1.8, { zb: 25 });

  F.anim({
    // watschelt auf der Stelle, quakt
    idle: { p: { breathe: 0.03, bob: 1, sway: 3, tilt: 2 }, keys: { root: { r: [[0, -4], [0.25, 4], [0.5, -4], [0.75, 4], [1, -4]] }, show: { quack: [[0.55, 0.75]] } } },
    // Watschelgang
    walk: { p: { stride: 20, bob: 2, armSwing: 20, lean: 2 }, keys: { root: { r: [[0, -6], [0.5, 6], [1, -6]] } } },
    // Schnabel-Kopfstoß, dann Stich
    attack: { prog: 'atk.thrust', hit: 0.55, p: { wind: 20, strike: -70, lean: 6, lunge: 10 }, keys: { head: { r: [[0, 0], [0.3, -10], [0.45, 24], [0.6, 0]] }, hat: { r: [[0, 0], [0.3, -6], [0.45, 14], [0.6, 0]] } }, ev: { strike: 0.55 } },
    // Kostüm splittert ein wenig
    hit: { p: { knock: 2, recoil: 5 }, keys: { show: { scatter: [[0, 0.5]] } } },
    // landet mit Flatterbewegung
    spawn: { keys: { armF: { r: [[0, -120], [0.2, -60], [0.4, -120], [0.6, 0]] }, armB: { r: [[0, -120], [0.2, -60], [0.4, -120], [0.6, 0]] } } },
    // Kostüm fällt auseinander, Federn wirbeln
    death: { p: { dir: -1, angle: 75 }, keys: { show: { scatter: [[0.3, 1.01]] }, hat: { x: [[0, 0], [0.3, 0], [1, 12]], y: [[0, 0], [0.3, 0], [1, 30]], r: [[0, 0], [1, 120]] } } },
  });
}
