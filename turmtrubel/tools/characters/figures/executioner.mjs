// Scharfrichter – hagerer, stiller Riese mit runder Eisenmaske, Lederschürze und Sichelaxt an langer Kette
// (Brief: docs/briefs/executioner.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { eyeX, lines, rivets, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function executioner(F) {
  const P = F.pal;
  const LEATHER = P.main;
  const BRONZE = P.acc;
  const MASK = '#5a5f6b';
  const CHAIN = '#7a828e';
  const SHIRT = '#d8ccb4';
  const SKIN = '#d9a37a';
  const LEATHER_D = '#33241a';
  const STEEL = '#a8b0ba';
  const GLOW = '#ffb03a';

  F.rig('biped', {
    hip: [0, -50],
    torso: [0, -53],
    head: [5, -80],
    hat: [5, -104],
    back: [-10, -70],
    armB: [-9, -77],
    handB: [-11, -53],
    armF: [12, -77],
    handF: [22, -57],
    prop: [22, -57],
    legB: [-5, -50],
    footB: [-6, -7],
    legF: [6, -50],
    footF: [7, -7],
    cape: [0, -76],
  });

  // Kettenglieder entlang einer Linie
  const chain = (g, pts, lw = 1) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.round(L / 2.6));
      const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const x = ax + (bx - ax) * t;
        const y = ay + (by - ay) * t;
        if (k % 2) g.stroke(ellipse(x, y, 1.6, 0.9, ang), CHAIN, lw * 0.8);
        else g.fill(ellipse(x, y, 1.5, 0.45, ang), '#5a626e');
      }
    }
  };
  // Sichelaxt: Halbmondklinge an kurzem Stiel mit Bronzetülle; (x, y) = Kettenöse
  const axe = (g, x, y) => {
    g.mat(rrect(x - 1.4, y, 2.8, 16, 1), '#5a3a22', 'wood');
    g.mat(rrect(x - 2.2, y + 1, 4.4, 5, 1.2), BRONZE, 'gold');
    const o = arc(x + 1, y + 9, 13, 13, -75, 75, 12);
    const i = arc(x + 1, y + 9, 6, 9, 70, -70, 10);
    g.mat(path([...o.map((p, k) => (k === 0 || k === o.length - 1 ? [...p, 1] : p)), ...i]), STEEL, 'metal', { hi: 0.95 });
    g.stroke(spline(arc(x + 1, y + 9, 12.2, 12.2, -66, 66, 10)), '#eef2f6', 0.8, { lod: 1 });
    g.mat(circle(x, y, 1.8), CHAIN, 'metal');
  };

  // ───────── Evo: zweite Kette mit Gegengewicht ─────────
  F.part('evoWeight', { bone: 'handB', z: 9.5, zb: 41.5, evo: 'evo' }, (g) => {
    chain(g, [[-11, -51], [-12, -40], [-12.6, -32]]);
    g.mat(circle(-12.6, -28, 4.4), '#4a4e58', 'metal', { hi: 0.8 });
    for (const [dx, dy] of [[-5.4, 0], [5.4, 0], [0, 5.4], [0, -5.4]]) g.mat(path([[-12.6 + dx * 0.7, -28 + dy * 0.7 - 1], [-12.6 + dx * 1.2, -28 + dy * 1.2], [-12.6 + dx * 0.7 + (dy ? 1 : 0), -28 + dy * 0.7 + (dx ? 1 : 0)]]), STEEL, 'metal');
  });

  // ───────── Lange Beine, Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -50, x * 1.1, -12, 5.6, 4.6), '#3a3030', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.8, -18], [fx + 4.8, -18.6], [fx + 4.6, -6], [fx + 11, -3], [fx + 11, 0, 1], [fx - 5.6, 0, 1]]), '#2a1e16', 'leather', { hi: 0.5 });
      g.mat(rrect(fx - 5.4, -20, 10.8, 3, 1), LEATHER_D, 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 6, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => {
    g.mat(limb(-9, -77, -10, -66, 4.8, 4.4), SHIRT, 'cloth');
    g.mat(limb(-10, -65, -11, -55, 3.8, 3.4), SKIN, 'skin');
    g.mat(rrect(-15, -69, 10, 4, 1.6), '#b8ac94', 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-11, -52.6, 3.4), SKIN, 'skin'));

  // ───────── Rumpf: Leinenhemd, Lederlatz, Schulterband (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-10, -78], [-2, -80.6], [8, -80.6], [12, -78], [12, -62], [10, -50], [-10, -50], [-11, -62]]), SHIRT, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[2, -78], [3, -66]], [[-6, -70], [-7, -58]]], '#b8ac94', 0.6, 1));
  });
  F.part('bib', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    g.mat(path([[-6, -72], [10, -72], [11, -50], [-7, -50]]), LEATHER, 'leather', { hi: 0.4 });
    g.stroke(polyline([[-6, -72], [-3, -80]]), LEATHER_D, 1.2);
    g.stroke(polyline([[10, -72], [8, -80]]), LEATHER_D, 1.2);
    g.lod(2, (h) => stitches(h, [[-5, -70.6], [9, -70.6]], '#c8a878'));
    g.lod(1, (h) => rivets(h, [[-5, -71], [9, -71]], 0.7, BRONZE));
  });
  F.part('shoulderBand', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    g.mat(path([[-11, -79], [-6, -80.4], [12, -55], [8, -52]]), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => lines(h, [[[-8, -78], [10, -54]]], P.teamShade, 0.5, 1));
  });
  // Schürze bis zu den Knien
  F.part('apron', { bone: 'hip', z: 24, zb: 5 }, (g) => {
    const a = path([[-12, -54], [14, -54], [16, -40], [17, -30], [4, -28.6], [-11, -30], [-13, -40]]);
    g.mat(a, LEATHER, 'leather', { hi: 0.35 });
    g.clipTo(a, (h) => {
      lines(h, [[[2, -52], [3, -31]], [[-6, -52], [-7, -31]], [[10, -52], [12, -31]]], LEATHER_D, 0.7, 1);
      h.fill(ellipse(8, -38, 2.6, 1.6), '#2a1a12', { op: 0.5, lod: 1 });
    });
    g.mat(rrect(-13, -56, 28, 3.6, 1), LEATHER_D, 'leather');
    g.mat(rrect(0, -56.6, 5, 4.8, 1), BRONZE, 'gold', { lod: 1 });
  });
  F.part('evoPlates', { bone: 'hip', z: 24.5, zb: 5.5, evo: 'evo' }, (g) => {
    for (const [x, y] of [[-9, -50], [3, -50], [-8, -40], [5, -40]]) {
      g.mat(rrect(x, y, 10, 8.6, 1.4), '#6a707c', 'metal', { hi: 0.8 });
      g.lod(1, (h) => rivets(h, [[x + 1.6, y + 1.6], [x + 8.4, y + 1.6], [x + 1.6, y + 7.4], [x + 8.4, y + 7.4]], 0.6, '#c8ccd4'));
    }
  });

  // ───────── Runde Eisenmaske mit zwei Gucklöchern (statt Gesicht) ─────────
  F.part('neck', { bone: 'head', z: 28, zb: 28 }, (g) => g.mat(rrect(0, -84, 9, 7, 2), SKIN, 'skin'));
  F.part('mask', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(circle(6, -94, 12.6), MASK, 'metal', { hi: 0.7 });
    g.lod(1, (h) => {
      h.stroke(spline(arc(6, -94, 12.6, 12.6, 200, 340, 10)), '#7a808c', 0.8);
      rivets(h, [[-4, -97], [-2, -86], [16, -97], [14, -86], [6, -106]], 0.7, '#8a909c');
      // Rost
      h.fill(ellipse(-2, -90, 2, 1.4), '#8a5a3a', { op: 0.6 });
      h.fill(ellipse(13, -101, 1.6, 1), '#8a5a3a', { op: 0.5 });
    });
    g.mat(path([[-6, -100], [-8, -88, 1], [-4, -86], [-4, -100]]), LEATHER_D, 'leather');
  });
  F.part('maskFace', { bone: 'head', z: 31, view: 'front' }, (g) => {
    for (const x of [11.4, 4.6]) g.fill(circle(x, -95, 2.6), '#14101a', { stroke: '#3a3e48', lw: 0.6 });
    g.fill(rrect(5, -87.6, 9, 1.4, 0.6), '#14101a');
    g.mat(path([[8, -100], [8.6, -104], [9.2, -100], [9.2, -89], [8, -89]]), '#6a707c', 'metal', { lod: 1 });
  });
  F.part('eyes.idle', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'sleep'], glow: true }, (g) => {
    for (const x of [11.6, 4.8]) g.fill(circle(x, -94.6, 1.1), GLOW);
  });
  F.part('eyes.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    for (const x of [11.6, 4.8]) g.fill(ellipse(x, -94.8, 1.8, 0.7), '#ffd060');
  });
  F.part('eyes.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    g.fill(circle(11.6, -94, 0.7), GLOW);
    g.fill(circle(4.4, -95.4, 1.3), GLOW);
  });
  F.part('eyes.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 11.4, -95, 1.6, '#5a5f6b', 1);
    eyeX(g, 4.6, -95, 1.6, '#5a5f6b', 1);
  });
  F.part('maskBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(rrect(-6, -97, 24, 4, 1.4), LEATHER_D, 'leather');
    g.mat(rrect(4, -98, 4, 6, 1), BRONZE, 'gold', { lod: 1 });
  });

  // ───────── Sichelaxt an der Kette (Signature) und vorderer Arm ─────────
  const AXE_STATES = ['loaded', 'back', 'idle', 'walk', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'death'];
  F.part('chain', { bone: 'prop', z: 38, zb: 4, state: AXE_STATES, sig: true }, (g) => {
    chain(g, [[22, -55], [23, -46], [24.6, -38], [26, -32]]);
  });
  F.part('chainEnd', { bone: 'prop', z: 38, zb: 4, state: 'flying' }, (g) => chain(g, [[22, -55], [26, -50], [32, -48]]));
  F.part('chainBow', { bone: 'prop', z: 38.5, zb: 4.5, team: true, state: AXE_STATES }, (g) => {
    g.mat(path([[23.6, -45], [19, -48, 1], [19.4, -42, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[23.6, -45], [28, -48, 1], [27.6, -42, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[23, -45], [21.4, -38, 1], [23.6, -39.6], [25.6, -38, 1], [24.4, -45]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('axe', { bone: 'prop', z: 38.6, zb: 4.6, state: AXE_STATES, sig: true }, (g) => axe(g, 26, -32));
  F.part('evoEdge', { bone: 'prop', z: 38.8, zb: 4.8, state: AXE_STATES, evo: 'evo', glow: true }, (g) => g.stroke(spline(arc(27, -23, 12.6, 12.6, -66, 66, 10)), '#ff8a3a', 1.6));
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(12, -77, 16, -66, 4.8, 4.4), SHIRT, 'cloth');
    g.mat(limb(16, -65, 21, -57, 3.8, 3.4), SKIN, 'skin');
    g.mat(rrect(10.6, -69, 10, 4, 1.6).rot(25, 15.6, -67), '#b8ac94', 'cloth');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(path([[18.6, -60], [24.6, -60.4], [25.6, -55.6], [22, -52.6], [18.4, -54.6]]), SKIN, 'skin');
    g.mat(rrect(17.6, -62, 6, 3, 1).rot(25, 20.6, -60.5), LEATHER_D, 'leather', { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 25, -4, -60, 2.3, { zb: 25 });

  F.anim({
    // lässt die Axt an der Kette pendeln, summt mit geneigtem Kopf
    idle: { p: { breathe: 0.02, bob: 0.5, sway: 1, tilt: 4 }, keys: { prop: { r: [[0, -16, 'io'], [0.5, 16, 'io'], [1, -16]] } } },
    // lange, langsame Schritte
    walk: { p: { stride: 18, bob: 1.6, armSwing: 6, lean: 2 }, keys: { prop: { r: [[0, -10], [0.5, 10], [1, -10]] } }, ev: { step: [0.25, 0.75] } },
    // Drehung als Anlauf, die Axt fliegt im Bogen hinaus und kommt in die Hand zurück
    attack: {
      prog: 'atk.throw',
      hit: 0.55,
      p: { wind: -150, strike: -60, over: 10, lean: 10, lunge: 12, windB: -20 },
      keys: { root: { sx: [[0, 1], [0.12, 1], [0.24, -1], [0.36, 1]] }, prop: { r: [[0, 0], [0.4, 60], [0.55, -30], [1, 0]] }, show: { flying: [[0.55, 0.9]], back: [[0.9, 1.01]] } },
      ev: { release: 0.55 },
    },
    // Maske scheppert
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { head: { r: [[0, 0], [0.15, -10], [0.3, 6], [0.5, 0]] } } },
    spawn: { keys: { prop: { r: [[0, 30], [0.6, -20], [1, 0]] } } },
    // fällt nach vorn, die Kette rasselt
    death: { p: { dir: 1, angle: 82 } },
  });
}
