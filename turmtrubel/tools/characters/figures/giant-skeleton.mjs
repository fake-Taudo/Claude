// Riesenskelett – dröhnend lachender Knochenriese mit tickender Uhrwerk-Bombe im Brustkorb (Brief: docs/briefs/giant-skeleton.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eyeX, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function giantSkeleton(F) {
  const P = F.pal;
  const BONE = P.main;
  const PANTS = P.acc;
  const BONE_D = '#b0a07c';
  const IRON = '#3a3d44';
  const BRASS = '#c8a046';
  const FUSE = '#ff7a2a';
  const GLOW = '#9affb0';

  F.rig(
    'biped',
    {
      hip: [0, -40],
      torso: [0, -44],
      head: [8, -100],
      jaw: [8, -104],
      hat: [8, -130],
      back: [-18, -90],
      armB: [-32, -96],
      handB: [-38, -46],
      armF: [34, -96],
      handF: [42, -46],
      prop: [42, -46],
      legB: [-12, -40],
      footB: [-14, -8],
      legF: [12, -40],
      footF: [14, -8],
      cape: [0, -98],
    },
    { jaw: 'head' },
  );

  // Knochen mit Gelenkknubbeln
  const bone = (g, ax, ay, bx, by, r, col) => {
    g.mat(limb(ax, ay, bx, by, r, r * 0.9), col, 'bone', { hi: 0.4 });
    g.mat(circle(ax, ay, r * 1.25), col, 'bone');
    g.mat(circle(bx, by, r * 1.15), col, 'bone');
  };
  // Knochenhand (riesig)
  const hand = (g, x, y, col) => {
    g.mat(blob([[x - 12, y - 4], [x - 4, y - 10], [x + 10, y - 8], [x + 14, y + 2], [x + 8, y + 10], [x - 8, y + 8]], 0.6), col, 'bone', { hi: 0.4 });
    for (const dx of [-8, -2, 4, 10]) g.mat(limb(x + dx, y + 6, x + dx + 1, y + 18, 2.4, 2), col, 'bone');
  };

  // ───────── Beine: Knochen, zerrissene Hose ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      bone(g, x, -40, x * 1.1, -10, 5, BONE);
      g.mat(path([[x - 12, -46], [x + 12, -46], [x * 1.05 + 11, -26], [x * 1.05 + 6, -30], [x * 1.05 + 2, -24], [x * 1.05 - 4, -29], [x * 1.05 - 11, -24]]), PANTS, 'cloth', { hi: 0.3 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(blob([[fx - 8, -10], [fx + 4, -12], [fx + 16, -4], [fx + 16, 0], [fx - 9, 0]], 0.6), BONE, 'bone', { hi: 0.4 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    bone(g, -32, -96, -34, -70, 4.4, BONE_D);
    bone(g, -34, -70, -38, -50, 3.8, BONE_D);
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => hand(g, -38, -40, BONE_D));

  // ───────── Brustkorb mit Uhrwerk-Bombe (Signature) ─────────
  F.part('spine', { bone: 'torso', z: 16, zb: 26 }, (g) => {
    g.mat(limb(0, -100, 0, -44, 4, 4), BONE_D, 'bone');
    g.mat(blob([[-18, -50], [18, -50], [22, -40], [0, -36], [-22, -40]], 0.6), BONE, 'bone', { hi: 0.4 });
  });
  F.part('bomb', { bone: 'torso', z: 19.5, zb: 27, sig: true }, (g) => {
    g.mat(circle(2, -70, 16), IRON, 'metal', { hi: 0.7 });
    g.mat(circle(4, -72, 8.6), '#f0e6c8', 'glass');
    g.stroke(circle(4, -72, 8.6), BRASS, 1.4);
    g.lod(1, (h) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        h.stroke(polyline([[4 + Math.cos(a) * 7, -72 + Math.sin(a) * 7], [4 + Math.cos(a) * 8, -72 + Math.sin(a) * 8]]), INK, 0.6);
      }
      // Zahnrad
      h.fill(circle(-8, -62, 4), BRASS);
      h.fill(circle(-8, -62, 1.4), IRON);
    });
    g.mat(rrect(-2, -88, 8, 4, 1), BRASS, 'metal');
    g.stroke(spline([[2, -88], [0, -94], [4, -98]]), '#6a4a2a', 1);
  });
  F.part('hand.idle', { bone: 'torso', z: 19.6, zb: 27.5, state: ['tickA', 'idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability'] }, (g) => {
    g.stroke(polyline([[4, -72], [4, -78]]), INK, 1);
    g.stroke(polyline([[4, -72], [8, -72]]), INK, 0.8);
  });
  F.part('fuse', { bone: 'torso', z: 19.7, zb: 27.6, glow: true }, (g) => g.fill(circle(4, -99, 1.8), FUSE));
  F.part('ribs', { bone: 'torso', z: 19, zb: 29 }, (g) => {
    for (const [y, w] of [[-94, 30], [-84, 33], [-74, 34], [-64, 32], [-56, 26]]) {
      g.mat(path([[-1, y - 2], [w * 0.7, y - 3], [w, y + 1], [w * 0.75, y + 2.6], [-1, y + 1.6]]), BONE, 'bone', { hi: 0.4 });
      g.mat(path([[-1, y - 2], [-w * 0.6, y - 3], [-w * 0.9, y + 1], [-w * 0.6, y + 2.4], [-1, y + 1.6]]), BONE_D, 'bone');
    }
    // Moos
    g.fill(ellipse(-20, -84, 4, 2), '#6a8a3a', { lod: 1 });
  });
  // vordere Rippenstäbe vor der Bombe: sie hängt im Brustkorb
  F.part('ribsFront', { bone: 'torso', z: 20, zb: 26 }, (g) => {
    for (const y of [-78, -64]) g.mat(path([[-14, y - 1.2], [18, y - 2], [20, y + 0.4], [-14, y + 1.2]]), BONE, 'bone', { hi: 0.4 });
  });
  F.part('scarf', { bone: 'torso', z: 22, zb: 32, team: true }, (g) => {
    g.mat(path([[-14, -104], [20, -104], [16, -96], [6, -90, 1], [0, -96], [-14, -98]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-12, -100], [-22, -90, 1], [-14, -96]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Schädel mit glühenden Augenhöhlen und schiefem Zahn ─────────
  F.part('skull', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[-10, -112], [-6, -128], [8, -136], [24, -132], [30, -118], [28, -106], [20, -102], [0, -102], [-8, -106]], 0.75), BONE, 'bone', { hi: 0.6 });
    g.lod(1, (h) => h.stroke(polyline([[-2, -132], [2, -124], [-1, -118]]), '#8a8070', 0.8));
  });
  F.part('sockets', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(22, -117, 4, 4.6), '#1a1a20');
    g.fill(ellipse(11, -117, 3.6, 4.2), '#1a1a20');
    g.fill(path([[17, -110], [19, -107], [21, -110]]), '#1a1a20');
  });
  F.part('eyes.idle', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'attack', 'ability', 'sleep'], glow: true }, (g) => {
    g.fill(circle(22, -116.4, 2), GLOW);
    g.fill(circle(11, -116.4, 1.8), GLOW);
  });
  F.part('eyes.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    g.fill(circle(22, -116.4, 1), GLOW);
    g.fill(circle(11, -116.4, 2.4), GLOW);
  });
  F.part('eyes.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 22, -117, 2.4, '#5a5a60', 1);
    eyeX(g, 11, -117, 2.2, '#5a5a60', 1);
  });
  F.part('jawBone', { bone: 'jaw', z: 30.5, zb: 30.5 }, (g) => {
    g.mat(path([[4, -104], [28, -106], [28, -98], [20, -92], [8, -92], [3, -98]]), BONE, 'bone', { hi: 0.4 });
  });
  F.part('teeth', { bone: 'jaw', z: 31.5, view: 'front' }, (g) => {
    g.stroke(polyline([[8, -102], [27, -103.4]]), '#1a1a20', 0.8);
    for (let x = 10; x < 27; x += 3) g.stroke(polyline([[x, -104.6], [x, -99]]), '#a89c84', 0.6);
    g.mat(path([[19, -104], [21, -98, 1], [22.6, -104]]), WHITE, 'bone');
  });

  // ───────── Vorderer Arm, Armband (Teamzone), Knochenfaust ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    bone(g, 34, -96, 38, -70, 4.6, BONE);
    bone(g, 38, -70, 42, -50, 4, BONE);
  });
  F.part('armband', { bone: 'armF', z: 29.5, zb: 10.5, team: true }, (g) => g.mat(rrect(32, -66, 16, 7, 2).rot(10, 40, -62), P.team, 'cloth', { line: P.teamDeep }));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => hand(g, 44, -40, BONE));
  F.part('bombOut', { bone: 'root', z: 50, state: 'drop' }, (g) => {
    g.mat(circle(30, -16, 16), IRON, 'metal', { hi: 0.7 });
    g.mat(circle(32, -18, 8.6), '#f0e6c8', 'glass');
    g.fill(circle(28, -34, 3), FUSE);
  });
  emblem(F, 'emblem', 'torso', 23, -16, -46, 2.6);

  F.anim({
    // Kiefer klappert, die Bombe tickt
    idle: { p: { breathe: 0.02, bob: 1.2, sway: 2, tilt: 2 }, keys: { jaw: { r: [[0, 0], [0.1, 10], [0.2, 0], [0.3, 10], [0.4, 0]] } } },
    // schwerer Gang, Knochen klappern
    walk: { p: { stride: 16, bob: 4, squash: 0.05, armSwing: 12, lean: 3 }, keys: { jaw: { r: [[0, 0], [0.25, 6], [0.5, 0], [0.75, 6], [1, 0]] } }, ev: { step: [0.25, 0.75] } },
    // Faust weit nach hinten, Rundumschlag
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -200, strike: -40, over: 16, lean: 14, lunge: 14 }, keys: { jaw: { r: [[0, 0], [0.4, 16], [0.7, 0]] } }, ev: { strike: 0.55 } },
    // Rippen klappern, das Zifferblatt springt
    hit: { p: { knock: 1.6, recoil: 3 }, keys: { torso: { x: [[0, 0], [0.1, -1.6], [0.2, 1.6], [0.3, 0]] } } },
    spawn: { keys: { jaw: { r: [[0, 0], [0.6, 0], [0.7, 14], [0.8, 0]] } } },
    // zerfällt, die Bombe rollt heraus
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], show: { drop: [[0.35, 1.01]] }, head: { y: [[0, 0], [0.4, 70, 'in']], r: [[0, 0], [0.4, -40]] }, torso: { y: [[0, 0], [0.4, 30, 'in']], r: [[0, 0], [0.4, 20]] }, legF: { r: [[0, 0], [0.4, -60]] }, legB: { r: [[0, 0], [0.4, 60]] }, alpha: [[0, 1], [0.7, 1], [1, 0]] } },
  });
}
