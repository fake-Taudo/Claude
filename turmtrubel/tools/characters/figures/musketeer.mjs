// Musketierin – ruhige Präzisionsschützin mit langer Muskete und Stützgabel, Kavaliershut mit hoher Feder
// (Brief: docs/briefs/musketeer.md). o.hero: Ingenieurin mit Werkzeuggürtel und Bauplan-Rolle (musketeer-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, eye, stitches, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function musketeer(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const COAT = P.main;
  const LACE = H ? '#f4efe6' : P.acc;
  const GOLD = H ? P.acc : '#c8a046';
  const WOOD = '#7a4a2a';
  const IRON = '#5f6672';
  const HAIR = '#2a1c1c';
  const SKIN = '#f0c4a0';
  const FELT = '#3a3228';
  const BOOT = '#3e2a1c';
  const COAT_D = H ? '#2e6a4a' : '#6e5c18';

  F.rig('biped', {
    hip: [0, -37],
    torso: [0, -40],
    head: [4, -70],
    hat: [4, -86],
    back: [-9, -60],
    armB: [-8, -66],
    handB: [13, -52],
    armF: [12, -66],
    handF: [31, -55],
    prop: [31, -55],
    legB: [-5, -37],
    footB: [-6, -8],
    legF: [5, -37],
    footF: [7, -8],
    cape: [0, -42],
  });

  // ───────── Gabel: aufgestellt (Ruhe, Angriff) oder am Rücken (Laufen) ─────────
  // Gabel von (x0, y0) unten bis (x1, y1) oben: Stange, zwei Zinken, Messingkappe am Fuß
  const forkShape = (g, x0, y0, x1, y1) => {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const ux = (x1 - x0) / L;
    const uy = (y1 - y0) / L;
    const nx = -uy;
    const ny = ux;
    const at = (s, t) => [x0 + ux * s + nx * t, y0 + uy * s + ny * t];
    g.mat(path([at(0, -1.3), at(L, -1.3), at(L, 1.3), at(0, 1.3)]), '#8a5a32', 'wood');
    g.mat(path([[...at(L - 1, -1.3), 1], [...at(L + 5, -5), 1], at(L + 6, -3.6), [...at(L + 1.6, 0), 1], at(L + 6, 3.6), [...at(L + 5, 5), 1], [...at(L - 1, 1.3), 1]]), '#8a5a32', 'wood');
    g.mat(path([at(0, -1.8), at(3, -1.8), at(3, 1.8), at(0, 1.8)]), GOLD, 'gold');
  };
  F.part('forkStand', { bone: 'root', z: 44, zb: 2, sig: true, state: ['idle', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep'] }, (g) => forkShape(g, 41, 0, 41, -53.6));
  F.part('forkBack', { bone: 'back', z: 3, zb: 46, sig: true, state: ['walk', 'charge', 'death'] }, (g) => forkShape(g, -17, -26, -1, -80));
  if (H) {
    F.part('planRoll', { bone: 'back', z: 3.5, zb: 46.5, sig: true }, (g) => {
      g.mat(rrect(-24, -74, 30, 6, 3).rot(-28, -9, -71), '#f0e6d0', 'cloth', { hi: 0.5 });
      g.lod(1, (h) => h.stroke(polyline([[-20, -66], [6, -80]]), '#6a8ab8', 0.6));
      g.mat(rrect(-12, -75, 3, 8, 0.8).rot(-28, -10.5, -71), '#c84a3a', 'cloth');
      g.mat(rrect(-25, -66, 4, 7, 1.4).rot(-28, -23, -63), WOOD, 'wood');
    });
  }

  // ───────── Lange Beine in hohen Reitstiefeln ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -38, x * 1.1, -14, 5.6, 5), '#5a4a32', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.8, -24], [fx + 5.4, -25.6], [fx + 4.6, -8], [fx + 9.6, -3.6], [fx + 9.8, 0, 1], [fx - 5.6, 0, 1], [fx - 5.8, -8]]), BOOT, 'leather', { hi: 0.5 });
      g.mat(path([[fx - 5.6, -27], [fx + 6.4, -29], [fx + 6.4, -24.6], [fx - 5.6, -23.4]]), '#5a3e28', 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm (Abzugshand) ─────────
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => g.mat(limb(-8, -66, 12, -53, 4.6, 4.2), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => {
    g.mat(path([[9, -55], [15, -55.6], [17, -51], [14, -48], [9, -49]]), '#8a6a4a', 'leather');
  });

  // ───────── Reitrock mit langen Schößen, Spitzenkragen ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-10, -68], [-3, -70.6], [7, -70.6], [12, -68], [13.6, -52], [12, -40], [15, -24], [8, -21], [2, -30], [-4, -21], [-13, -23], [-11, -40], [-12.6, -52]]);
    g.mat(c, COAT, 'cloth');
    lines(g, [[[2, -68], [2, -38]], [[-8, -38], [-11, -25]], [[11, -38], [13, -25]]], COAT_D, 0.7, 1);
    // Paspel an den Schößen
    g.stroke(polyline([[15, -24], [8, -21], [2, -30], [-4, -21], [-13, -23]]), GOLD, 0.8, { lod: 1 });
    for (const y of [-64, -58, -52, -46]) {
      g.mat(circle(-0.6, y, 0.9), GOLD, 'gold', { lod: 1 });
      g.mat(circle(4.6, y, 0.9), GOLD, 'gold', { lod: 1 });
    }
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-11, -68], [-6, -70], [13, -42], [8, -40]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[8, -42], [13, -42], [14, -33], [10, -34]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });
  F.part('flasks', { bone: 'torso', z: 22.5, view: 'front', lod: 1 }, (g) => {
    for (const t of [0.3, 0.5, 0.7]) g.mat(rrect(-8.5 + t * 21 - 1.4, -69 + t * 28, 2.8, 4, 1), '#c8b890', 'wood');
  });
  if (H) {
    // Werkzeuggürtel (Rang-Merkmal): Kurbel, Schraubenschlüssel, Zahnradschnalle
    F.part('toolbelt', { bone: 'hip', z: 23, zb: 23, sig: true }, (g) => {
      g.mat(rrect(-13, -42, 27, 5, 1.6), '#5a3a20', 'leather');
      g.mat(circle(3, -39.4, 3), GOLD, 'gold');
      g.lod(1, (h) => {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          h.fill(circle(3 + Math.cos(a) * 3.2, -39.4 + Math.sin(a) * 3.2, 0.7), GOLD);
        }
      });
      g.mat(path([[-11, -37], [-9, -37], [-9, -29], [-7, -27], [-11, -27]]), '#9aa3ad', 'metal');
      g.mat(rrect(8, -37, 2.4, 9, 1), '#9aa3ad', 'metal');
      g.mat(circle(9.2, -27, 2.2), '#9aa3ad', 'metal');
    });
  }
  F.part('collar', { bone: 'torso', z: 24, zb: 24 }, (g) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = -9 + i * 2.6;
      pts.push([x, -69 + Math.abs(i - 4) * 0.4], [x + 1.3, -64 + Math.abs(i - 4) * 0.5, 1]);
    }
    g.mat(path([[-10, -71], [12, -71], ...pts.reverse()]), LACE, 'cloth', { hi: 0.5 });
  });

  // ───────── Kopf: schmales Gesicht, dunkler Zopf ─────────
  F.part('braid', { bone: 'head', z: 29, zb: 33 }, (g) => {
    for (let i = 0; i < 4; i++) g.mat(ellipse(-5 - i * 0.6, -66 + i * 4.2, 2.6, 2.4), HAIR, 'hair', { hi: 0.5 });
    g.mat(rrect(-8.6, -51, 5, 2.4, 1), P.team, 'cloth', { lod: 1 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -80], [4, -83], [13.6, -79], [15, -70], [13, -63], [7, -59.6], [0, -61], [-5, -67]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[11, -71.4, 2.2], [3.6, -71.4, 2]],
    iris: '#3a2a22',
    lidColor: SKIN,
    lid: 0.45,
    brow: { color: HAIR, w: 1.2, lift: 0.4 },
    mouth: [8.8, -64, 4.2],
    mood: 'smirk',
    attackMouth: 'clench',
    idleTilt: -0.4,
    replace: {
      // beim Schuss ein Auge zu
      attack: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.2, { lw: 0.9 });
        eye(g, c.E2[0], c.E2[1], { ...c.EYE, r: 2.1, lid: 0.3, look: [0.9, 0] });
        g.stroke(spline([[6.8, -64.4], [9, -64.8], [11, -64]]), INK, 0.9);
      },
    },
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[8.4, -70], [10.4, -66.6], [8.6, -66]]), '#e0a882', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  if (H) {
    F.part('pencil', { bone: 'head', z: 34.5, view: 'front' }, (g) => {
      g.mat(rrect(-8, -76, 9, 1.8, 0.6).rot(-20, -3.5, -75), '#e8c040', 'wood');
      g.fill(path([[0.6, -77.6], [3, -78.6], [1.2, -76.2]]), '#3a3a3a');
    });
  }
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-6, -80], [14, -80], [14, -66], [8, -60], [-1, -61], [-6, -67]]), HAIR, 'hair');
  });
  // Kavaliershut mit breiter Krempe und hoch aufragender Feder (Teamzone)
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-3, -79], [-1, -88], [6, -91.6], [13, -89], [14, -79]]), FELT, 'cloth', { hi: 0.3 });
    g.mat(path([[-14, -77, 1], [-8, -81], [4, -82], [18, -80.4], [24, -77.4, 1], [14, -77.6], [4, -78.4], [-6, -77.6]]), FELT, 'cloth', { hi: 0.3 });
    g.mat(rrect(-2, -82, 16.4, 2.6, 0.8), GOLD, 'gold', { lod: 1 });
    if (H) g.mat(circle(12, -84.6, 2.2), GOLD, 'gold');
  });
  F.part('plume', { bone: 'hat', z: 35.5, zb: 37, team: true }, (g) => {
    const f = path([[0, -84], [-4, -94], [-6, -104], [-3, -112, 1], [0, -104], [1.4, -94], [3, -86]]);
    g.mat(f, P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    lines(g, [[[-1, -90], [-4, -88]], [[-2, -96], [-5, -95]], [[-2, -102], [-5, -101]]], P.teamShade, 0.6, 1);
    g.stroke(spline([[1, -86], [-1.6, -98], [-3, -110]]), P.teamLight, 0.5, { lod: 1 });
  });

  // ───────── Muskete (liegt auf der Gabel) und vorderer Arm ─────────
  F.part('musket', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[2, -59.0], [16, -59.0], [22, -57.0], [22, -53.4], [14, -53.6], [6, -50.0], [1.6, -50.6]]), WOOD, 'wood');
    g.mat(rrect(0.6, -59.6, 2.6, 9.6, 0.8), GOLD, 'gold', { lod: 1 });
    g.mat(path([[20, -58.6], [62, -58.2], [62, -55.6], [20, -55.0]]), IRON, 'metal', { hi: 0.8 });
    g.stroke(polyline([[22, -57.4], [61, -57.0]]), '#8a929c', 0.5, { lod: 1 });
    g.stroke(spline([[14, -53.0], [15, -50.0], [18, -50.6], [18.4, -53.0]]), GOLD, 0.8);
    g.mat(rrect(60, -59.4, 3, 4.6, 0.8), '#3a3e46', 'metal');
    if (H) g.mat(rrect(30, -61.0, 8, 3, 1), '#9aa3ad', 'metal', { lod: 1 });
  });
  F.part('muzzle', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[63, -61.0, 1], [72, -64.0], [69, -58.0], [76, -56.6], [69, -55.0], [72, -49.0], [63, -54.0, 1]]), '#ffd27a', { op: 0.9 });
    g.fill(circle(65, -57.0, 3.4), '#fff4c8');
    g.stroke(circle(78, -57.0, 3.6), '#e8e8e8', 1.4, { op: 0.6 });
  });
  // Oberarm hinter dem Kinn: der Kopf bleibt beim Anlegen frei
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(12, -66, 30, -56, 4.8, 4.2), COAT, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(path([[27, -59.0], [34, -59.0], [35, -54.0], [31, -51.6], [27, -53.0]]), '#8a6a4a', 'leather');
    g.mat(path([[23, -61.0], [29, -61.0], [29.6, -53.0], [24, -54.0]]), '#a8865e', 'leather', { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 25, -6, -48, 2.4, { zb: 25 });

  // ───────── Evolution (Scharfschützin): Zielfernrohr, Goldlitzen, Patronen am Hutband ─────────
  if (!H) {
    F.part('evoScope', { bone: 'prop', z: 38.5, zb: 4.5, evo: 'evo' }, (g) => {
      g.mat(rrect(26, -64.6, 16, 4, 1.6), '#c8a046', 'gold');
      g.mat(circle(42, -62.6, 2.4), '#9ad8f0', 'glass', { line: '#6a5a20' });
      g.mat(rrect(30, -61.0, 2, 3, 0.4), '#9a7a2a', 'gold');
    });
    F.part('evoTrim', { bone: 'torso', z: 21, evo: 'evo' }, (g) => {
      g.stroke(polyline([[-10, -68], [-12.6, -52], [-11, -40], [-13, -23]]), '#f0c850', 1.2);
      g.stroke(polyline([[12, -68], [13.6, -52], [12, -40], [15, -24]]), '#f0c850', 1.2);
    });
    F.part('evoRounds', { bone: 'hat', z: 36.5, evo: 'evo', glow: true }, (g) => {
      for (const x of [1, 5, 9]) g.fill(rrect(x - 0.9, -84.6, 1.8, 3.6, 0.8), '#9ae8ff');
    });
    F.part('evoMuzzle', { bone: 'prop', z: 39.5, evo: 'evo', glow: true }, (g) => g.fill(circle(62, -57.0, 2.6), '#9ae8ff', { op: 0.7 }));
  }

  F.anim({
    // steht an der Gabel, pustet über die Mündung, Feder wippt
    idle: { p: { breathe: 0.02, bob: 0.4, sway: 0.6, tilt: 1 }, keys: { hat: { r: [[0, 7.0], [0.5, 4.0], [1, 7.0]] }, head: { r: [[0, 7.0], [0.55, 7.0], [0.65, 15.0], [0.85, 15.0], [0.95, 7.0]] } } },
    // aufrechter Schritt, Muskete geschultert, Gabel am Rücken
    walk: { p: { stride: 22, bob: 1.6, armSwing: 0, lean: 1 }, keys: { armF: { r: [[0, 57.0], [1, 57.0]] }, prop: { r: [[0, -63.0], [1, -63.0]] }, armB: { r: [[0, 37.0], [1, 37.0]] }, hat: { r: [[0, 5.0], [0.5, 9.0], [1, 5.0]] } }, ev: { step: [0.25, 7.75] } },
    // Zielen mit geschlossenem Auge, Schuss mit Rauchring, Rückstoß
    attack: { prog: 'atk.shoot', hit: 0.6, p: { armFAim: 0, armBAim: 0, propAim: 0, handBAim: 0, recoil: 4, kick: 6, kickArm: 4, lean: 0, aimHead: 3, flash: 0.15 }, keys: { hat: { r: [[0, 7.0], [0.6, 7.0], [0.66, -3.0], [0.8, 11.0], [1, 7.0]] } }, ev: { release: 0.6 } },
    // Hut verrutscht, sie hält ihn fest
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 7.0], [0.2, 19.0], [1, 7.0]] } } },
    spawn: { keys: { root: { y: [[0, 15.0], [0.6, 15.0], [0.9, 7.0]] } } },
    // sinkt auf ein Knie, Muskete kippt weg, Hut rollt davon
    death: { p: { dir: -1, angle: 70 }, keys: { hat: { x: [[0, 7.0], [0.4, 7.0], [1, -11.0, 'out']], r: [[0, 7.0], [0.4, 7.0], [1, -193.0]] } } },
    ...(H
      ? {
          // Treuer Geschützturm: wirft den Bausatz in hohem Bogen
          ability: { prog: 'atk.throw', hit: 0.6, p: { wind: -160, strike: -50 }, ev: { ability: 0.6 } },
        }
      : {}),
  });
}
