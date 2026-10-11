// Rabaukin – freches Mädchen mit Sommersprossen, Zöpfen, Latzhose und Astgabel-Schleuder (Brief: docs/briefs/rascal-girl.md)
// Varianten: 0 = zwei Zöpfe, 1 = Pferdeschwanz
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, eyeClosed, eye, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function rascalGirl(F) {
  const P = F.pal;
  const DENIM = P.main;
  const STRIPE = P.acc;
  const HAIR = '#e8743b';
  const SKIN = '#f6c8a0';
  const WOOD = '#8a5a32';
  const DENIM_D = '#c8687a';
  const SHOE = '#f2eee6';

  F.rig(
    'biped',
    {
      hip: [0, -24],
      torso: [0, -26],
      head: [3, -45],
      hat: [3, -66],
      back: [-4, -38],
      armB: [-5, -42],
      handB: [-7, -31],
      armF: [6, -42],
      handF: [13, -28],
      prop: [13, -28],
      legB: [-3, -24],
      footB: [-3, -4],
      legF: [3, -24],
      footF: [4, -4],
      cape: [0, -42],
      braidB: [-6, -58],
      braidF: [12, -60],
    },
    { braidB: 'head', braidF: 'head' },
  );

  // ───────── Zöpfe mit Schleifen (Teamzone) bzw. Pferdeschwanz ─────────
  const braid = (g, pts) => {
    for (const [x, y, r] of pts) g.mat(ellipse(x, y, r, r * 0.9), HAIR, 'hair', { hi: 0.4 });
  };
  F.part('braidB', { bone: 'braidB', z: 27, zb: 37, variant: 0 }, (g) => braid(g, [[-9, -56, 3], [-12, -53, 2.8], [-15, -50, 2.6], [-17, -46.6, 2.2]]));
  F.part('bowB', { bone: 'braidB', z: 27.5, zb: 37.5, team: true, variant: 0 }, (g) => {
    g.mat(path([[-8, -58], [-12, -62, 1], [-11, -56, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[-8, -58], [-5, -62, 1], [-4.4, -57, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('braidF', { bone: 'braidF', z: 28, zb: 36.5, variant: 0 }, (g) => braid(g, [[15, -58, 3], [18, -55.6, 2.8], [20.4, -52.4, 2.6], [22, -49, 2.2]]));
  F.part('bowF', { bone: 'braidF', z: 28.5, zb: 37, team: true, variant: 0 }, (g) => {
    g.mat(path([[13, -60], [11, -64.6, 1], [16, -63, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[13, -60], [18, -62, 1], [17, -58, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('ponytail', { bone: 'braidB', z: 27, zb: 37, variant: 1 }, (g) => {
    g.mat(path([[-6, -62], [-12, -64, 1], [-18, -58], [-20, -48, 1], [-14, -52], [-8, -56]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('ponyBow', { bone: 'braidB', z: 27.5, zb: 37.5, team: true, variant: 1 }, (g) => {
    g.mat(path([[-7, -61], [-10, -66, 1], [-12, -60, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[-7, -61], [-3, -65, 1], [-3, -59, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Beine mit Turnschuhen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -22, x * 1.05, -6, 2.4, 2.1), SKIN, 'skin');
      g.mat(path([[x - 3.6, -25], [x + 3.6, -25], [x + 3.8, -14], [x - 3.8, -14]]), DENIM, 'cloth', { hi: 0.3 });
      g.mat(rrect(x - 3.8, -15.6, 7.6, 2, 0.6), DENIM_D, 'cloth', { lod: 1 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 3, -6], [x + 3, -6.4], [x + 7.6, -2.4], [x + 7.6, 0, 1], [x - 3.6, 0, 1]]), SHOE, 'cloth', { hi: 0.5 });
      g.mat(rrect(x - 3.6, -1.2, 11.2, 1.2, 0.4), '#c84a3a', 'leather');
    });
  };
  leg('legB', 'footB', -3, 6);
  leg('legF', 'footF', 3, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(-5, -42, -6, -36, 2.6, 2.4), '#e8e4f0', 'cloth');
    g.mat(limb(-6, -36, -7, -32, 2, 1.8), '#e0b08a', 'skin');
  });
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(-7, -31, 2.2), '#e0b08a', 'skin'));

  // ───────── Ringelshirt, Latzhose mit Trägern (Teamzone), Kieseltasche ─────────
  F.part('shirt', { bone: 'torso', z: 19, zb: 19 }, (g) => {
    const s = path([[-6, -43], [7, -43], [8, -34], [7, -26], [-6, -26], [-7, -34]]);
    g.mat(s, '#f2eee6', 'cloth');
    g.clipTo(s, (h) => {
      for (let y = -42; y < -26; y += 3) h.fill(rrect(-8, y, 18, 1.4, 0), STRIPE);
    });
  });
  F.part('bib', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    g.mat(path([[-5, -37], [7, -37], [7.4, -26], [-6, -26]]), DENIM, 'cloth', { hi: 0.4 });
    g.mat(rrect(-1, -35, 5, 3.6, 0.6), DENIM_D, 'cloth', { lod: 1 });
  });
  F.part('straps', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-5, -43], [-2.6, -43], [-2.6, -36], [-5, -36]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[4.6, -43], [7, -43], [7, -36], [4.6, -36]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    for (const x of [-3.8, 5.8]) g.mat(circle(x, -36.4, 0.9), '#c8c8d0', 'metal', { lod: 1 });
  });
  F.part('shorts', { bone: 'hip', z: 18, zb: 18 }, (g) => g.mat(path([[-6.6, -27], [7.4, -27], [7.6, -20], [-6.6, -20]]), DENIM, 'cloth'));
  F.part('pebbleBag', { bone: 'hip', z: 23, zb: 23 }, (g) => {
    g.mat(blob([[-9, -26], [-4, -26], [-3.4, -21], [-6, -19.4], [-9, -21]], 0.6), '#b8925a', 'leather');
    g.lod(1, (h) => {
      for (const [x, y] of [[-7.4, -26.6], [-5.4, -26.8]]) h.fill(circle(x, y, 0.9), '#9aa0a8');
    });
  });

  // ───────── Kopf: Sommersprossen, freches Grinsen ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-5, -54], [0, -63], [9, -65], [16, -60], [17, -52], [15, -46], [9, -43], [2, -44], [-4, -48]], 0.75), SKIN, 'skin', { hi: 0.3 });
    g.fill(ellipse(13.6, -48.6, 2, 1.2), '#f0a0a0', { op: 0.6, lod: 1 });
  });
  faceSet(F, {
    eyes: [[12.4, -53, 2.5], [5.6, -53, 2.3]],
    iris: '#4a7a3a',
    lidColor: SKIN,
    lid: 0.1,
    look: [0.5, 0],
    brow: { color: '#c85a2a', w: 1, lift: 0.8 },
    idleTilt: -0.4,
    mouth: [10.6, -47.4, 4.6],
    mood: 'grin',
    attackMouth: 'grin',
    replace: {
      // beim Zielen ein Auge zugekniffen
      attack: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.5, { lw: 0.9 });
        eye(g, c.E2[0], c.E2[1], { ...c.EYE, r: 2.4, lid: 0.25, look: [0.9, 0] });
        g.stroke(spline([[8.4, -47.6], [10.6, -46.8], [13, -47.8]]), INK, 0.9);
      },
    },
  });
  F.part('freckles', { bone: 'head', z: 32.5, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[11, -50.4], [12.6, -50], [14.2, -50.6], [6.6, -50.2], [5.2, -50.6]]) g.fill(circle(x, y, 0.45), '#c8784a');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(14.6, -50, 1.6, 1.3), '#f0b890', 'skin', { line: '#c88a64', lw: 0.4 }));
  F.part('hair', { bone: 'head', z: 34, zb: 34 }, (g) => {
    g.mat(path([[-5, -52], [-4, -60], [3, -65.6], [11, -65.6], [17, -61], [16, -56], [12, -59], [9, -56, 1], [6, -59], [2, -56, 1], [-1, -58], [-3, -52]]), HAIR, 'hair', { hi: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 34.5, view: 'back' }, (g) => g.mat(blob([[-5, -60], [16, -60], [17, -50], [9, -43], [0, -44], [-5, -50]], 0.6), HAIR, 'hair'));

  // ───────── Astgabel-Schleuder (Signature) und vorderer Arm ─────────
  F.part('slingshot', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.mat(path([[12.4, -28], [14.2, -28], [14, -35], [17, -41], [15.6, -42], [13.2, -37], [10.6, -42], [9.2, -41], [12.4, -35]]), WOOD, 'wood', { hi: 0.5 });
    g.mat(rrect(12, -31, 2.6, 3, 0.6), '#c84a3a', 'leather', { lod: 1 });
  });
  F.part('bandLoose', { bone: 'prop', z: 37.5, zb: 3.5, state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'death', 'sleep', 'charge', 'attack'] }, (g) => {
    g.stroke(spline([[9.8, -41.4], [11, -37], [13.2, -36], [15.6, -37], [16.4, -41.4]]), '#c8a070', 0.6);
    g.mat(ellipse(13.2, -36, 1.8, 1.1), '#7a4a2a', 'leather');
  });
  F.part('bandDrawn', { bone: 'prop', z: 39, zb: 5, state: 'loaded' }, (g) => {
    g.stroke(polyline([[9.8, -41.4], [13.4, -31], [16.4, -41.4]]), '#c8a070', 0.7);
    g.mat(ellipse(13.4, -30.4, 1.8, 1.4), '#7a4a2a', 'leather');
    g.fill(circle(13.4, -30.8, 1), '#9aa0a8');
  });
  F.part('muzzle', { bone: 'prop', z: 39.5, state: 'muzzle', glow: true }, (g) => {
    g.fill(circle(13, -49, 1.4), '#9aa0a8', { stroke: INK, lw: 0.4 });
    g.stroke(polyline([[13, -45], [13, -42.6]]), '#fff4c8', 0.8);
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(6, -42, 9, -35, 2.6, 2.4), '#e8e4f0', 'cloth');
    g.mat(limb(9, -35, 13, -29, 2, 1.8), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(13, -28, 2.3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 25, 1.4, -31, 1.7, { zb: 25 });

  F.anim({
    // sucht Steinchen am Boden
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 2, tilt: 3 },
      keys: { torso: { r: [[0, 0], [0.4, 0], [0.55, 28], [0.75, 28], [0.9, 0]] }, armB: { r: [[0, 0], [0.45, 0], [0.55, -40], [0.75, -40], [0.9, 0]] }, head: { r: [[0, 0], [0.5, 10], [0.75, 10], [0.9, 0]] }, braidB: { r: [[0, 0], [0.6, 14], [0.9, 0]] }, braidF: { r: [[0, 0], [0.6, 14], [0.9, 0]] } },
    },
    // hüpfender Gang
    walk: { prog: 'biped.run', p: { stride: 26, bob: 3.4, armSwing: 18, lean: 4 }, keys: { braidB: { r: [[0, -10], [0.5, 10], [1, -10]] }, braidF: { r: [[0, -10], [0.5, 10], [1, -10]] } } },
    // Schleuder spannen, Schuss
    attack: {
      prog: 'atk.shoot',
      hit: 0.6,
      p: { armFAim: -75, armBAim: -70, propAim: 75, handBAim: 70, draw: 5, recoil: 1.6, kick: 4, aimHead: 2, flash: 0.15 },
      keys: { layer: [[0, 0.7, 'armB', 43, 43], [0, 0.7, 'handB', 44, 44]] },
      ev: { release: 0.6 },
    },
    // Zöpfe fliegen
    hit: { p: { knock: 2, recoil: 5 }, keys: { braidB: { r: [[0, 0], [0.2, -40], [1, 0]] }, braidF: { r: [[0, 0], [0.2, -40], [1, 0]] } } },
    // landet mit Hüpfer
    spawn: { keys: { braidB: { r: [[0, -30], [0.6, 10], [1, 0]] }, braidF: { r: [[0, -30], [0.6, 10], [1, 0]] } } },
    // setzt sich hin und schmollt
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'hurt']],
        root: { y: [[0, 0], [0.35, 10, 'in']] },
        legF: { r: [[0, 0], [0.35, -80]] },
        legB: { r: [[0, 0], [0.35, -72]] },
        armF: { r: [[0, 0], [0.4, -30]] },
        armB: { r: [[0, 0], [0.4, -40]] },
        head: { r: [[0, 0], [0.4, 12]] },
        alpha: [[0, 1], [0.7, 1], [1, 0]],
      },
    },
  });
}
