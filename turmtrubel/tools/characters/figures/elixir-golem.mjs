// Elixiergolem – tumb-fröhlicher Riese aus einem großen Glaskolben voller blubberndem Elixier, mit Korken als Kopf
// (Brief: docs/briefs/elixir-golem.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeX, eyeSpiral, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function elixirGolem(F) {
  const P = F.pal;
  const ELIXIR = P.main;
  const GLASS = P.acc;
  const CORK = '#b8864a';
  const BRASS = '#c8a046';
  const ELIXIR_D = '#9a1cb8';

  F.rig('biped', {
    hip: [0, -26],
    torso: [0, -30],
    head: [0, -96],
    hat: [0, -116],
    back: [-14, -70],
    armB: [-34, -78],
    handB: [-42, -36],
    armF: [36, -78],
    handF: [46, -36],
    prop: [46, -36],
    legB: [-12, -26],
    footB: [-14, -6],
    legF: [12, -26],
    footF: [14, -6],
    cape: [0, -80],
  });

  // ───────── Stummelbeine aus Glas ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -28, x * 1.1, -8, 9, 8), GLASS, 'glass', { line: '#9ab8c8', hi: 0.9 });
      g.fill(ellipse(x * 1.05, -14, 6, 5), ELIXIR, { op: 0.8 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(rrect(x * 1.1 - 11, -6, 24, 6, 3), BRASS, 'metal', { hi: 0.8 }));
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Glasröhren-Arme mit Messingmanschetten ─────────
  const arm = (g, ax, ay, bx, by) => {
    g.mat(limb(ax, ay, bx, by, 8, 7), GLASS, 'glass', { line: '#9ab8c8', hi: 0.9 });
    g.fill(limb(ax + (bx - ax) * 0.3, ay + (by - ay) * 0.3, bx, by, 5, 4.6), ELIXIR, { op: 0.75 });
    g.mat(rrect(bx - 9, by - 4, 18, 6, 2), BRASS, 'metal', { hi: 0.8 });
  };
  const fist = (g, x, y) => {
    g.mat(blob([[x - 12, y - 4], [x - 6, y - 12], [x + 8, y - 10], [x + 12, y + 2], [x + 6, y + 12], [x - 8, y + 10]], 0.7), GLASS, 'glass', { line: '#9ab8c8', hi: 0.9 });
    g.fill(circle(x, y + 2, 7), ELIXIR, { op: 0.8 });
  };
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => arm(g, -34, -78, -40, -42));
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => fist(g, -42, -30));

  // ───────── Glasbauch mit blubberndem Elixier (Signature), Messskala ─────────
  const belly = circle(0, -60, 36);
  F.part('belly', { bone: 'torso', z: 18, zb: 28, sig: true }, (g) => {
    g.mat(belly, GLASS, 'glass', { line: '#9ab8c8', hi: 0.95 });
    g.clipTo(belly, (h) => {
      h.fill(path([[-40, -66], [-20, -70], [0, -64], [20, -70], [40, -66], [40, -20], [-40, -20]]), ELIXIR, { op: 0.9 });
      h.fill(path([[-40, -40], [40, -40], [40, -20], [-40, -20]]), ELIXIR_D, { op: 0.6 });
      h.lod(1, (k) => {
        for (const y of [-84, -74, -64, -54, -44]) k.stroke(polyline([[22, y], [28, y]]), '#6a8a9a', 0.8);
      });
      // Spiegelung
      h.fill(ellipse(-16, -78, 6, 12, 30), '#ffffff', { op: 0.5 });
      // Kratzer
      h.lod(2, (k) => k.stroke(polyline([[10, -88], [16, -82]]), '#ffffff', 0.5));
    });
  });
  F.part('bubbles', { bone: 'torso', z: 18.5, zb: 28.5, glow: true }, (g) => {
    for (const [x, y, r] of [[-8, -50, 3], [8, -42, 2.4], [0, -60, 2], [14, -56, 1.6], [-18, -40, 2]]) g.fill(circle(x, y, r), '#ff9af8', { op: 0.9 });
  });
  // Flaschenhals mit Halsband (Teamzone)
  F.part('neck', { bone: 'torso', z: 19, zb: 29 }, (g) => g.mat(path([[-12, -94, 1], [12, -94, 1], [12, -84], [-12, -84]]), GLASS, 'glass', { line: '#9ab8c8', hi: 0.9 }));
  F.part('neckBand', { bone: 'torso', z: 19.5, zb: 29.5, team: true }, (g) => g.mat(rrect(-14, -92, 28, 6, 2), P.team, 'cloth', { line: P.teamDeep }));

  // ───────── Korkenkopf mit Gesicht und Siegel (Teamzone) ─────────
  F.part('cork', { bone: 'head', z: 30, zb: 34 }, (g) => {
    const c = path([[-14, -94, 1], [14, -94, 1], [17, -122, 1], [-17, -122, 1]]);
    g.mat(c, CORK, 'wood', { hi: 0.5 });
    g.clipTo(c, (h) => h.lod(1, (k) => {
      for (const [x, y] of [[-10, -100], [8, -114], [-4, -118], [12, -102]]) k.fill(circle(x, y, 1), '#8a5a2a');
    }));
  });
  F.part('seal', { bone: 'head', z: 30.5, zb: 34.5, team: true }, (g) => {
    g.mat(ellipse(0, -122, 18, 4), P.team, 'leather', { line: P.teamDeep, hi: 0.6 });
    g.mat(path([[-6, -122], [-8, -128, 1], [-4, -124]]), P.team, 'leather', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 8, -110, { r: 3.6, iris: '#4a2a5a', lidColor: CORK, look: [0.3, 0.2], ratio: 1.1, irisR: 0.45 });
    eye(g, -2, -110, { r: 3.4, iris: '#4a2a5a', lidColor: CORK, look: [0.3, 0.2], ratio: 1.1, irisR: 0.45 });
    g.fill(ellipse(4, -100, 3.6, 2.4), '#5a1c3a', { stroke: INK, lw: 0.6 });
    g.fill(circle(9, -99, 1.4), '#ff9af8', { op: 0.9 });
  });
  F.part('face.attack', { bone: 'head', z: 31, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 8, -110, { r: 3.6, iris: '#4a2a5a', lidColor: CORK, lid: 0.35, look: [0.8, 0], ratio: 1.1 });
    eye(g, -2, -110, { r: 3.4, iris: '#4a2a5a', lidColor: CORK, lid: 0.35, look: [0.8, 0], ratio: 1.1 });
    mouthOpen(g, 4, -100, 8, 3.6, { teeth: 'top', tongue: false });
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eyeSpiral(g, 8, -110, 3.4);
    eyeSpiral(g, -2, -110, 3.2);
    g.fill(ellipse(4, -100, 2.6, 3), '#5a1c3a', { stroke: INK, lw: 0.6 });
  });
  F.part('face.death', { bone: 'head', z: 31, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 8, -110, 2.6);
    eyeX(g, -2, -110, 2.4);
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => arm(g, 36, -78, 44, -42));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => fist(g, 46, -30));
  F.part('splash', { bone: 'root', z: 50, state: ['splash', 'hit'] }, (g) => {
    for (const [x, y, r] of [[-30, -70, 4], [34, -84, 3.4], [-40, -40, 3], [44, -60, 3.6]]) g.fill(circle(x, y, r), ELIXIR);
  });
  emblem(F, 'emblem', 'torso', 23, -20, -46, 3.2);

  F.anim({
    // Blasen steigen, die Flüssigkeit schwappt
    idle: { p: { breathe: 0.04, bob: 1.4, sway: 2, tilt: 3 } },
    // schwappender Gang
    walk: { p: { stride: 14, bob: 4, squash: 0.08, armSwing: 12, lean: 2 }, keys: { root: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // schwappende Doppelfaust
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -160, windB: -150, strike: -30, strikeB: -24, over: 8, lean: 10, lunge: 12 }, ev: { strike: 0.6 } },
    hit: { p: { knock: 1.4, recoil: 3 } },
    // plumpst, die Flüssigkeit schwappt hoch
    spawn: { keys: { root: { sy: [[0, 1], [0.5, 0.8], [0.7, 1.1], [1, 1]] } } },
    // zerplatzt, Elixiertropfen
    death: { prog: 'generic.death', keys: { show: { splash: [[0.2, 1.01]] } } },
  });
}
