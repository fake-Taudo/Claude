// Ofen – brummiger, laufender Kanonenofen aus Eisen mit Ofenrohr als Hut und glühender Klappe als Bauch
// (Brief: docs/briefs/furnace.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function furnace(F) {
  const P = F.pal;
  const IRON = P.main;
  const EMBER = P.acc;
  const GLOW = '#ffd27a';
  const BRASS = '#c8a046';
  const IRON_D = '#262b34';
  const COAL = '#2a2228';

  F.rig('biped', {
    hip: [0, -22],
    torso: [0, -26],
    head: [2, -80],
    hat: [2, -86],
    back: [-24, -54],
    armB: [-26, -60],
    handB: [-30, -40],
    armF: [28, -60],
    handF: [32, -40],
    prop: [32, -40],
    legB: [-10, -22],
    footB: [-11, -4],
    legF: [10, -22],
    footF: [11, -4],
    cape: [0, -70],
    door: [2, -46],
  }, { door: 'torso' });

  // ───────── Kohlenschaufel am Rücken ─────────
  F.part('shovel', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(path([[-34, -30, 1], [-32, -30, 1], [-20, -80, 1], [-22, -80, 1]]), '#7a5232', 'wood');
    g.mat(path([[-38, -30], [-28, -30], [-30, -16, 1], [-36, -16, 1]]), '#4a4e58', 'metal');
  });
  // ───────── Eisenbeine mit Klauenfüßen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -24, x, -6, 4.6, 4), IRON_D, 'metal', { hi: 0.5 }));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 7, -7], [x + 6, -7.4], [x + 11, -2], [x + 12, 0, 1], [x + 8, -1.4], [x + 6, 0, 1], [x + 2, -1.4], [x, 0, 1], [x - 8, 0, 1]]), IRON_D, 'metal', { hi: 0.5 });
      g.fill(ellipse(x - 4, -2, 2.4, 1.4), '#8a4a2a', { op: 0.6, lod: 1 });
    });
  };
  leg('legB', 'footB', -10, 6);
  leg('legF', 'footF', 10, 8);
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(-26, -60, -30, -42, 3.6, 3.2), IRON_D, 'metal');
    g.mat(circle(-30, -38, 4.4), IRON_D, 'metal', { hi: 0.5 });
  });

  // ───────── Rundbauchiger Ofenkörper mit Ornament-Relief ─────────
  const belly = blob([[-26, -70], [0, -76], [28, -70], [32, -46], [26, -24], [-24, -24], [-30, -46]], 0.7);
  F.part('body', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(belly, IRON, 'metal', { hi: 0.7 });
    g.clipTo(belly, (h) => {
      h.fill(rrect(-34, -30, 70, 4, 0), IRON_D);
      h.fill(rrect(-34, -70, 70, 4, 0), IRON_D);
      h.lod(1, (k) => {
        for (const x of [-20, 22]) k.stroke(spline([[x, -62], [x - 3, -56], [x, -50], [x + 3, -44], [x, -38]]), '#5a6272', 0.9);
      });
    });
    g.lod(1, (h) => rivets(h, [[-22, -68], [-8, -72], [8, -72], [22, -68], [-20, -28], [24, -28]], 0.9, '#7a828e'));
    // Rußfahne
    g.fill(ellipse(-14, -66, 6, 3), '#1a1a1e', { op: 0.4, lod: 1 });
  });
  // ───────── Ofenklappe mit Gitter (Signature): Glut, Augen, Mund ─────────
  F.part('doorFrame', { bone: 'torso', z: 21, zb: 21, view: 'front' }, (g) => {
    g.mat(circle(4, -46, 14), BRASS, 'gold', { hi: 0.8 });
    g.fill(circle(4, -46, 11), COAL);
  });
  F.part('embers', { bone: 'torso', z: 21.5, view: 'front', glow: true }, (g) => {
    g.fill(circle(4, -42, 9), EMBER, { op: 0.8 });
    g.fill(ellipse(4, -40, 6, 4), GLOW);
  });
  F.part('eyes.idle', { bone: 'torso', z: 22, view: 'front', expr: ['idle', 'sleep'], glow: true }, (g) => {
    for (const x of [-1, 9]) g.fill(path([[x - 2.6, -51], [x + 2.6, -51], [x + 2, -49], [x - 2, -49]]), '#fff4c8');
  });
  F.part('eyes.attack', { bone: 'torso', z: 22, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    for (const x of [-1, 9]) g.fill(circle(x, -50, 2), '#ffffff');
  });
  F.part('eyes.hurt', { bone: 'torso', z: 22, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    for (const x of [-1, 9]) g.stroke(polyline([[x - 2, -52], [x + 2, -48]]), '#fff4c8', 1);
  });
  F.part('eyes.death', { bone: 'torso', z: 22, view: 'front', expr: 'death' }, (g) => {
    for (const x of [-1, 9]) g.fill(circle(x, -50, 1.4), '#5a4a48');
  });
  F.part('grate', { bone: 'door', z: 23, zb: 23, view: 'front', state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'death'] }, (g) => {
    for (const x of [-4, 0, 4, 8, 12]) g.mat(rrect(x - 0.8, -56, 1.6, 20, 0.6), IRON_D, 'metal');
    g.mat(rrect(16, -48, 6, 3, 1), BRASS, 'gold');
  });
  F.part('doorOpen', { bone: 'door', z: 23, zb: 23, view: 'front', state: ['attack', 'spawnUnit', 'ability'] }, (g) => {
    g.mat(ellipse(-12, -46, 4, 13), IRON_D, 'metal', { hi: 0.5 });
    g.fill(circle(4, -42, 10), '#ff6a2a', { op: 0.6 });
  });
  F.part('spit', { bone: 'torso', z: 24, state: ['muzzle'], glow: true }, (g) => {
    for (const [x, y, r] of [[22, -46, 4], [32, -50, 3.4], [40, -44, 2.6]]) {
      g.fill(circle(x, y, r), EMBER);
      g.fill(circle(x, y, r * 0.5), GLOW);
    }
  });
  F.part('fireSpirit', { bone: 'torso', z: 24, state: 'spawnUnit', glow: true }, (g) => {
    g.fill(blob([[12, -40], [16, -52], [24, -58], [30, -48], [28, -38], [18, -34]], 0.7), EMBER);
    g.fill(circle(22, -46, 4), GLOW);
    for (const x of [20, 25]) g.fill(circle(x, -47, 0.9), '#3a1a0a');
  });
  // Henkeltuch (Teamzone) am Seitengriff
  F.part('handleCloth', { bone: 'torso', z: 24.5, zb: 24.5, team: true }, (g) => {
    g.mat(rrect(-34, -58, 6, 10, 2), BRASS, 'gold');
    g.mat(path([[-36, -56], [-28, -56], [-26, -44, 1], [-31, -46], [-36, -42, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  // ───────── Evo: Seitenklappen, glühende Nähte ─────────
  F.part('evoSeams', { bone: 'torso', z: 24.8, evo: 'evo', glow: true }, (g) => {
    g.stroke(spline([[-24, -64], [-28, -46], [-22, -28]]), EMBER, 1.2);
    g.stroke(spline([[26, -64], [30, -46], [24, -28]]), EMBER, 1.2);
    g.fill(ellipse(-16, -36, 4, 2.6), '#c83a1a', { op: 0.7 });
  });

  // ───────── Ofenrohr als hoher, geknickter Hut mit Band (Teamzone) ─────────
  F.part('pipe', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(rrect(-6, -84, 16, 10, 2), IRON_D, 'metal', { hi: 0.6 });
    g.mat(path([[-4, -84, 1], [8, -84, 1], [8, -110], [14, -118, 1], [6, -122, 1], [-2, -112], [-4, -100]]), IRON_D, 'metal', { hi: 0.7 });
    g.lod(1, (h) => h.stroke(polyline([[-4, -100], [8, -100]]), '#4a5262', 0.8));
  });
  F.part('pipeBand', { bone: 'head', z: 30.5, zb: 30.5, team: true }, (g) => g.mat(path([[-5, -94], [8, -94], [8, -89], [-5, -89]]), P.team, 'metal', { line: P.teamDeep, lw: 0.5 }));
  F.part('evoPipe', { bone: 'head', z: 29.5, zb: 29.5, evo: 'evo' }, (g) => g.mat(path([[-12, -82, 1], [-6, -82, 1], [-6, -108], [-10, -112, 1], [-14, -106]]), IRON_D, 'metal', { hi: 0.7 }));
  F.part('smokeRing', { bone: 'hat', z: 31, state: ['ring', 'hit'] }, (g) => {
    g.stroke(ellipse(14, -128, 6, 3), '#a8a4a0', 2, { op: 0.7 });
    g.stroke(ellipse(20, -140, 8, 4), '#a8a4a0', 2, { op: 0.5 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(28, -60, 32, -42, 3.6, 3.2), IRON_D, 'metal'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(32, -38, 4.4), IRON_D, 'metal', { hi: 0.5 }));
  emblem(F, 'emblem', 'torso', 25, -16, -40, 2.6, { zb: 25 });

  F.anim({
    // pafft Rauchringe aus dem Rohr
    idle: { p: { breathe: 0.02, bob: 0.8, sway: 1, tilt: 2 }, keys: { show: { ring: [[0.3, 0.7]] } } },
    // watschelnder Gang auf Eisenbeinen
    walk: { p: { stride: 18, bob: 2.6, armSwing: 10, lean: 2 }, keys: { root: { r: [[0, -4], [0.5, 4], [1, -4]] } } },
    // Klappe öffnet sich, Glutbrocken fliegen
    attack: { prog: 'still', hit: 0.55, keys: { root: { sy: [[0, 1], [0.4, 1.05], [0.55, 0.92], [0.8, 1]] }, show: { muzzle: [[0.55, 0.8]] }, expr: [[0, 1, 'attack']] }, ev: { release: 0.55 } },
    // Funken stieben aus dem Rohr
    hit: { p: { knock: 1.4, recoil: 3 } },
    // Feuergeist hüpft aus der Klappe
    spawnUnit: { prog: 'still', keys: { root: { sy: [[0, 1], [0.2, 0.92], [0.4, 1.04], [0.6, 1]] }, expr: [[0, 1, 'attack']] }, ev: { spawnUnit: 0.3 } },
    // landet mit Aschewolke
    spawn: {},
    // kühlt aus: Glut erlischt, er fällt scheppernd auseinander
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], head: { x: [[0, 0], [0.3, 0], [0.8, -20]], y: [[0, 0], [0.3, 0], [0.8, 74]], r: [[0, 0], [0.3, 0], [0.8, -90]] }, root: { sy: [[0, 1], [0.5, 0.7]], sx: [[0, 1], [0.5, 1.15]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
