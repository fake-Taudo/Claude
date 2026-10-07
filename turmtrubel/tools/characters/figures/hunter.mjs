// Jäger – brummiger Trapper mit Biberfellmütze samt Schwanz und Donnerbüchse mit Trichtermündung
// (Brief: docs/briefs/hunter.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, stitches, rivets, lines, emblem, furEdge, INK, WHITE } from '../kit.mjs';

export default function hunter(F) {
  const P = F.pal;
  const LEATHER = P.main;
  const BEADS = P.acc;
  const BEAVER = '#6b4a32';
  const BRASS = '#c8a046';
  const SKIN = '#e0a47a';
  const WOOD = '#7a4e2a';
  const LEATHER_L = '#7a6238';
  const SOOT = '#3a3230';

  F.rig('biped', {
    hip: [0, -28],
    torso: [0, -31],
    head: [3, -62],
    hat: [-6, -76],
    armB: [-15, -58],
    handB: [-12, -40],
    armF: [15, -58],
    handF: [22, -42],
    prop: [22, -42],
    legB: [-7, -28],
    footB: [-8, -7],
    legF: [7, -28],
    footF: [8, -7],
    back: [-12, -46],
  });

  // ───────── Beine mit Fransen, Mokassins ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -30, x * 1.12, -8, 7.2, 6.2), LEATHER, 'leather');
      g.lod(1, (h) => {
        for (let y = -26; y < -10; y += 2.4) h.stroke(polyline([[x * 1.1 + 3.4, y], [x * 1.1 + 5.6, y + 1.4]]), BEADS, 0.6);
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(path([[fx - 5.6, -9], [fx + 4.4, -9.6], [fx + 10.4, -3.6], [fx + 10.8, 0, 1], [fx - 6.4, 0, 1], [fx - 6.8, -4]]), LEATHER_L, 'leather');
      g.lod(1, (h) => {
        for (const d of [0, 2, 4]) h.fill(circle(fx + d, -6, 0.6), BEADS);
      });
    });
  };
  leg('legB', 'footB', -7, 6);
  leg('legF', 'footF', 7, 8);

  // ───────── Pulverhorn hinten, hinterer Arm (stützt die Büchse) ─────────
  F.part('horn', { bone: 'back', z: 4, zb: 40 }, (g) => {
    g.mat(path([[-20, -46], [-12, -50], [-6, -46], [-10, -40], [-19, -38, 1], [-22, -36, 1], [-20.6, -40]]), '#efe0bc', 'bone');
    g.mat(rrect(-8, -49.6, 3, 6, 0.8), BRASS, 'gold');
    g.stroke(polyline([[-6, -50], [6, -60]]), '#5a3a20', 0.8, { lod: 1 });
  });
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-15, -58, -12, -42, 7, 6.2), '#4e3c1e', 'leather'));
  F.part('handB', { bone: 'handB', z: 34.5, zb: 43 }, (g) => g.mat(circle(-11.6, -40, 3.5), '#c8906a', 'skin'));

  // ───────── Ledermantel mit Fransen und Perlenstickerei ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-15, -60], [-4, -63], [8, -63], [16, -60], [20, -42], [21, -18], [12, -16], [3, -18], [-6, -16], [-15, -17], [-21, -18], [-20, -42]]);
    g.mat(c, LEATHER, 'leather');
    // Fransen am Saum
    for (let x = -20; x <= 20; x += 2.6) g.stroke(polyline([[x, -18], [x + 0.4, -13.4]]), LEATHER_L, 1.1, { lod: 1 });
    g.lod(1, (h) => {
      // Perlenstickerei an der Brust
      for (let i = 0; i < 6; i++) h.fill(circle(-10 + i * 1.8, -54 + (i % 2) * 1.4, 0.7), i % 2 ? BEADS : '#f0e0c0');
      h.stroke(polyline([[2, -63], [3, -18]]), '#4e3c1e', 0.8);
    });
  });
  F.part('bandolier', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    const b = path([[-14, -61], [-8, -62], [17, -26], [11, -24]]);
    g.mat(b, P.team, 'leather', { line: P.teamDeep });
    for (let i = 0; i < 6; i++) {
      const t = 0.12 + i * 0.14;
      g.mat(rrect(-11 + t * 25 - 1.2, -61.6 + t * 36.6 - 2.4, 2.4, 4, 0.8), BRASS, 'gold', { lod: 1 });
    }
  });
  F.part('belt', { bone: 'hip', z: 22, zb: 22 }, (g) => {
    g.mat(rrect(-17, -32, 34, 4.6, 1.6), '#3e2c14', 'leather');
    g.mat(rrect(-2, -32.6, 5.4, 5.6, 1), BRASS, 'gold', { lod: 1 });
  });

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-7, -73], [4, -76], [14.6, -72], [16.4, -63], [14, -55.6], [6, -52.6], [-2, -54.6], [-7, -61]]), SKIN, 'skin');
    g.mat(ellipse(-6.6, -64, 2.4, 3.4), SKIN, 'skin', { lod: 1 });
  });
  faceSet(F, {
    eyes: [[11.6, -65.4, 2.3], [3.8, -65.4, 2.1]],
    iris: '#4a3a22',
    lidColor: SKIN,
    lid: 0.4,
    brow: { color: '#3a2618', w: 1.8, lift: 0.4 },
    idleTilt: 0.5,
    mouth: [9.2, -57.6, 5],
    mood: 'frown',
    attackMouth: 'grit',
    replace: {
      // ein Auge zugekniffen (zielt immer ein bisschen)
      idle: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.3, { lw: 1 });
        g.fill(circle(c.E2[0], c.E2[1], 2.1), WHITE, { stroke: INK, lw: 0.6 });
        g.fill(circle(c.E2[0] + 0.6, c.E2[1] + 0.2, 1.2), '#4a3a22');
        g.fill(circle(c.E2[0] + 0.3, c.E2[1] - 0.3, 0.45), '#ffffff', { lod: 0 });
      },
    },
    idle: (g) => {
      g.mat(path([[7.4, -68.6], [11.6, -70.2], [15.4, -69.4], [15, -67.8], [11, -68.4]]), '#3a2618', 'hair');
      g.mat(path([[1.4, -69.2], [4, -70.6], [6.6, -69.4], [6.2, -67.6], [2, -67.6]]), '#3a2618', 'hair');
      g.stroke(spline([[6.6, -57.4], [9.2, -58.2], [11.6, -57.2]]), INK, 0.9);
    },
  });
  F.part('stubble', { bone: 'head', z: 33.2, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[4, -55.4], [6, -54.4], [8.4, -54], [11, -54.2], [13.4, -55.4], [15, -57.4], [2.6, -57], [12, -56]]) g.fill(circle(x, y, 0.5), '#6a4a32');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[7.4, -64.4], [10.4, -64], [12, -60.4], [10.6, -59], [7.4, -59.6]]), '#d8946a', 'skin', { line: '#a8684a', lw: 0.6 });
  });
  // Biberfellmütze mit Schwanz (Band = Teamzone)
  F.part('cap', { bone: 'head', z: 35, zb: 35 }, (g) => {
    const c = path([[-9.4, -68], [-8.6, -76], [-3, -82], [6, -83.6], [14, -80.6], [17.6, -73], [17.4, -68]]);
    g.mat(c, BEAVER, 'fur', { hi: 0.3 });
    furEdge(g, [[-9.6, -68], [4, -66.8], [17.6, -68]], 2, BEAVER, { side: 1, step: 2, seed: 4, lod: 1 });
    lines(g, [[[-4, -78], [-2, -73]], [[4, -81], [5, -76]], [[11, -79], [12, -74]]], '#4a3220', 0.6, 1);
  });
  F.part('tail', { bone: 'hat', z: 34, zb: 37 }, (g) => {
    g.mat(path([[-7, -77], [-13, -74], [-19, -66], [-21, -58], [-19, -54, 1], [-15, -58], [-11, -66], [-5, -72]]), '#5a3a26', 'leather', { hi: 0.3 });
    g.lod(1, (h) => {
      for (let i = 0; i < 4; i++) h.stroke(polyline([[-17 + i * 1.6, -66 + i * 2], [-12 + i * 1.6, -68 + i * 2]]), '#3e2818', 0.5);
    });
  });
  F.part('tailBand', { bone: 'hat', z: 34.5, zb: 37.5, team: true }, (g) => {
    g.mat(path([[-8.4, -77.6], [-5.4, -73], [-8.6, -71], [-11.4, -75.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });

  // ───────── Donnerbüchse mit Trichtermündung (Signature) ─────────
  F.part('gun', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    // Kolben
    g.mat(path([[2, -38], [12, -44], [18, -44], [20, -40], [10, -34], [3, -32]]), WOOD, 'wood');
    // Lauf
    g.mat(path([[16, -45], [38, -51], [39, -47.6], [17, -41]]), '#5d6672', 'metal');
    g.mat(rrect(18, -44.6, 6, 4, 1).rot(-15, 21, -42.6), BRASS, 'gold', { lod: 1 });
    // Trichter
    g.mat(path([[37, -51.6], [44, -57.6, 1], [47, -47, 1], [39.4, -47]]), BRASS, 'gold', { hi: 0.9 });
    g.fill(ellipse(45.6, -52.4, 1.6, 5.2, -15), SOOT);
    g.lod(1, (h) => {
      h.stroke(polyline([[38.6, -50.4], [39.6, -47.4]]), '#9a7a2a', 0.8);
      h.fill(ellipse(43.6, -55, 1.2, 1.8, -15), '#4a4040', { op: 0.6 });
    });
  });
  F.part('muzzle', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[46, -60, 1], [58, -56], [52, -52], [62, -48], [52, -46], [57, -38], [46, -44, 1]]), '#ffd27a', { op: 0.9 });
    g.fill(circle(48, -51, 4.6), '#fff4c8', { op: 0.9 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(15, -58, 20, -44, 7, 6.2), LEATHER, 'leather'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(21.6, -41.6, 3.5), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, 2, -45, 2.4, { zb: 24 });

  // ───────── Evolution (Netz): Netzrolle auf dem Rücken, Netzwerfer am Gürtel, Messingbeschläge ─────────
  F.part('evoNet', { bone: 'back', z: 3.5, zb: 41, evo: 'evo' }, (g) => {
    g.mat(rrect(-24, -64, 20, 9, 4.4), '#c8b890', 'cloth');
    g.clipTo(rrect(-24, -64, 20, 9, 4.4), (h) => {
      for (let x = -24; x < -2; x += 3) {
        h.stroke(polyline([[x, -64], [x + 4, -55]]), '#8a7a5a', 0.5);
        h.stroke(polyline([[x + 4, -64], [x, -55]]), '#8a7a5a', 0.5);
      }
    });
  });
  F.part('evoLauncher', { bone: 'hip', z: 24.5, evo: 'evo' }, (g) => {
    g.mat(rrect(-19, -34, 8, 8, 2), '#5d6672', 'metal');
    g.mat(circle(-15, -30, 2.4), BRASS, 'gold');
  });
  F.part('evoFittings', { bone: 'prop', z: 38.5, zb: 4.5, evo: 'evo' }, (g) => {
    for (const x of [24, 31]) g.mat(rrect(x - 1.2, -49.4 + (x - 24) * -0.27, 2.4, 5.2, 0.6).rot(-15, x, -47), BRASS, 'gold');
  });

  F.anim({
    // stopft Pulver nach
    idle: { p: { breathe: 0.025, bob: 0.6, sway: 1.5, prop: -6 }, keys: { armB: { r: [[0, 0], [0.4, 0], [0.5, -40], [0.6, -30], [0.7, -42], [0.8, 0]] } } },
    // schwerer Pirschgang
    walk: { p: { stride: 18, bob: 1.6, armSwing: 2, lean: 6 }, keys: { hat: { r: [[0, -6], [0.5, 6], [1, -6]] } }, ev: { step: [0.25, 0.75] } },
    // Anlegen, Bumm mit starkem Rückstoß
    attack: { prog: 'atk.shoot', hit: 0.55, p: { armFAim: -50, armBAim: -60, propAim: 8, recoil: 6, kick: 12, kickArm: 14 }, ev: { release: 0.55 } },
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 0], [0.2, -20], [0.5, 10], [1, 0]] } } },
    spawn: { keys: { legF: { r: [[0, -20], [0.6, -20], [0.9, 0]] }, legB: { r: [[0, 24], [0.6, 24], [0.9, 0]] }, root: { y: [[0, 6], [0.6, 6], [0.9, 0]] } } },
    death: { p: { dir: -1, angle: 82 } },
  });
}
