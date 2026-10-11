// Kobolde – flinke, gierige Racker mit riesigen Ohren voller Goldringe und geschliffenem Löffeldolch
// (Brief: docs/briefs/goblins.md). o.hero: Bannerbrigade mit Kriegsbemalung und Brigade-Banner (goblins-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function goblins(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const VEST = P.main;
  const SKIN = '#7fae4a';
  const SKIN_D = '#5e8a34';
  const GOLD = H ? P.acc : '#f2c14e';
  const PANTS = '#5a4a3a';
  const TIN = '#b8bec6';
  const PAINT = '#f2efe6';

  F.rig(
    'biped',
    {
      hip: [0, -20],
      torso: [0, -22],
      head: [3, -32],
      hat: [3, -54],
      back: [-4, -28],
      armB: [-4, -31],
      handB: [-7, -21],
      armF: [5, -31],
      handF: [10, -21],
      prop: [10, -21],
      legB: [-3, -20],
      footB: [-3, -3],
      legF: [3, -20],
      footF: [4, -3],
      cape: [0, -31],
      ...(H ? { banner: [-6, -26], flag: [-8, -76] } : {}),
    },
    H ? { banner: 'back', flag: 'banner' } : {},
  );

  // ───────── Held: Brigade-Banner auf dem Rücken (Rang-Merkmal), Tuch = Teamzone ─────────
  if (H) {
    F.part('bannerPole', { bone: 'banner', z: 2, zb: 47, sig: true }, (g) => {
      g.mat(path([[-7.4, -22], [-5.6, -22], [-7, -78], [-8.8, -78]]), '#7a5232', 'wood');
      // Löffel als Spitze
      g.mat(ellipse(-8, -83, 2.6, 4), TIN, 'metal', { hi: 0.9 });
      g.mat(rrect(-8.8, -79.6, 1.6, 3, 0.6), TIN, 'metal');
    });
    F.part('bannerCloth', { bone: 'flag', z: 2.5, zb: 47.5, team: true }, (g) => {
      const c = path([[-8, -76], [-30, -74], [-27, -66], [-31, -58], [-8, -60]]);
      g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
      g.clipTo(c, (h) => {
        h.fill(ellipse(-18, -67, 3.4, 4), GOLD, { lod: 1 });
        h.stroke(polyline([[-18, -71], [-18, -63]]), P.teamDeep, 0.8, { lod: 1 });
      });
      // Riss im Banner
      g.lod(1, (h) => h.stroke(polyline([[-26, -60], [-23, -63], [-25, -65]]), P.teamDeep, 0.5));
    });
  }

  // ───────── Beine (kurze Hose, nackte Füße) ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -20, x * 1.05, -5, 2.4, 2), SKIN, 'skin');
      g.mat(path([[x - 3.4, -21], [x + 3.4, -21], [x + 3.6, -13], [x - 3.6, -13]]), PANTS, 'cloth');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 2.6, -5], [x + 2.4, -5.4], [x + 7, -2.4], [x + 7.6, 0, 1], [x - 3, 0, 1]]), SKIN, 'skin', { hi: 0.4 });
      g.lod(1, (h) => lines(h, [[[x + 4, -1.6], [x + 4.6, 0]], [[x + 6, -1.6], [x + 6.4, 0]]], SKIN_D, 0.4, 1));
    });
  };
  leg('legB', 'footB', -3, 6);
  leg('legF', 'footF', 3, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-4, -31, -7, -22, 2.2, 1.9), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-7, -21, 2.4), SKIN_D, 'skin'));

  // ───────── Rumpf: Lumpenweste bzw. Lederweste ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-5, -32], [6, -32], [7, -24], [6, -19], [-6, -19], [-7, -25]]), SKIN, 'skin');
    const v = path([[-6, -32], [-1, -32.6], [1, -24], [3, -32.6], [7, -32], [8, -24], [7, -18.6], [-7, -18.6], [-8, -25]]);
    g.mat(v, VEST, H ? 'leather' : 'cloth', { hi: 0.35 });
    g.clipTo(v, (h) => {
      if (H) {
        for (const y of [-29, -25]) h.fill(circle(5.4, y, 0.7), GOLD, { lod: 1 });
      } else {
        // Flicken mit groben Kreuzstichen, Loch
        h.fill(rrect(-6, -27, 4.6, 4.6, 0.4), '#a8784a', { lod: 1 });
        h.lod(2, (k) => {
          for (const [x, y] of [[-6, -27], [-1.4, -27], [-6, -22.4], [-1.4, -22.4]]) k.stroke(polyline([[x - 0.6, y - 0.6], [x + 0.6, y + 0.6]]), '#e8d8b0', 0.3);
        });
        h.fill(ellipse(5, -22, 1, 0.8), '#3a2418', { lod: 1 });
      }
    });
  });
  // Gürtelknoten (Teamzone) und Beutel mit Glitzerkram
  F.part('belt', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-7, -21, 15, 2.6, 1), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[3, -20], [6, -16, 1], [4.4, -15.4], [2.6, -18]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('pouch', { bone: 'hip', z: 21, zb: 21 }, (g) => {
    g.mat(blob([[-8, -20], [-4, -20], [-3.6, -16], [-6, -14.6], [-8.4, -16]], 0.6), '#a8784a', 'leather');
    g.fill(circle(-5.4, -20.6, 0.9), GOLD, { lod: 1 });
  });
  // Halstuch (Teamzone)
  F.part('scarf', { bone: 'torso', z: 24, zb: 24, team: true }, (g) => {
    g.mat(path([[-5, -33], [8, -33], [6, -30], [2, -27, 1], [-1, -30], [-5, -31]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Kopf: riesige Ohren mit Goldringen, Spitznase, gieriges Grinsen ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 36 }, (g) => {
    g.mat(path([[8, -48], [20, -52], [30, -50, 1], [18, -44], [10, -42]]), SKIN_D, 'skin', { hi: 0.3 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-6, -42], [-4, -52], [4, -56], [12, -53], [15, -45], [14, -37], [8, -33], [0, -33], [-5, -36]], 0.7), SKIN, 'skin', { hi: 0.4 });
  });
  F.part('earF', { bone: 'head', z: 34, zb: 29 }, (g) => {
    const e = path([[-3, -46], [-14, -50], [-24, -50, 1], [-14, -42], [-4, -40]]);
    g.mat(e, SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => h.stroke(spline([[-5, -44.6], [-13, -47], [-20, -48.6]]), SKIN_D, 0.6));
    // zwei feste Goldringe am Ohr
    for (const x of [-12, -17]) g.stroke(circle(x, -43.6 - (x + 12) * 0.25, 1.4), GOLD, 0.7);
  });
  F.part('earringL', { bone: 'head', z: 34.5, zb: 29.5, variant: 0 }, (g) => g.stroke(circle(-22, -47.6, 1.8), GOLD, 0.8));
  F.part('earringR', { bone: 'head', z: 28.5, zb: 36.5, variant: 1 }, (g) => g.stroke(circle(27, -48, 1.8), GOLD, 0.8));
  const face = faceSet(F, {
    eyes: [[10.6, -45, 3], [3.4, -45, 2.7]],
    iris: '#f0c020',
    irisR: 0.5,
    lidColor: SKIN,
    lid: 0.15,
    look: [0.6, 0.1],
    brow: { color: SKIN_D, w: 1, lift: 0.6 },
    idleTilt: 0.6,
    mouth: [8, -37, 7],
    mood: 'grin',
    attackMouth: 'grit',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[11, -43], [19, -40.6, 1], [12, -39]]), SKIN, 'skin', { line: SKIN_D, lw: 0.6 });
  });
  F.part('noseRing', { bone: 'head', z: 33.2, view: 'front', variant: 3 }, (g) => g.stroke(circle(16.6, -38.6, 1.3), GOLD, 0.7));
  F.part('toothGap', { bone: 'head', z: 32.6, view: 'front', variant: 2, expr: 'idle' }, (g) => g.fill(rrect(7.4, -38.4, 1.2, 1.4, 0), '#4a1c24'));
  if (H) {
    // Kriegsbemalung
    F.part('warpaint', { bone: 'head', z: 31.5, view: 'front' }, (g) => {
      g.fill(path([[1, -48.6], [14, -49.4], [14, -48], [1, -47.4]]), PAINT);
      g.fill(path([[2, -41], [6, -41.6], [5.4, -40.4], [2, -40]]), PAINT, { lod: 1 });
    });
  }
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.lod(1, (h) => h.stroke(spline([[-3, -38], [3, -36], [10, -38]]), SKIN_D, 0.6));
    g.mat(circle(3, -52, 2), SKIN_D, 'skin');
  });

  // ───────── Löffeldolch (Signature) und vorderer Arm ─────────
  F.part('spoon', { bone: 'prop', z: 38, zb: 4, sig: !H }, (g) => {
    g.mat(path([[8, -22], [14, -24], [16, -24.6], [16.4, -23.2], [9, -19.6]]), TIN, 'metal');
    g.mat(ellipse(20, -25.4, 4.6, 2.2, -10), TIN, 'metal', { hi: 0.95 });
    g.stroke(spline([[16.4, -26.4], [20, -27.4], [24, -26]]), '#eef2f6', 0.6, { lod: 1 });
    g.mat(rrect(7, -23, 4, 3.6, 1), '#a8784a', 'cloth');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(5, -31, 10, -22, 2.2, 1.9), SKIN, 'skin'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(10, -21, 2.6), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 25, -3, -28, 1.7, { zb: 25 });

  F.anim({
    // hüpfen von Fuß zu Fuß, lecken am Löffel
    idle: {
      p: { breathe: 0.03, bob: 1.6, sway: 4, tilt: 5 },
      keys: { legF: { r: [[0, 0], [0.25, -10], [0.5, 0], [1, 0]] }, legB: { r: [[0, 0], [0.5, 0], [0.75, 10], [1, 0]] }, armF: { r: [[0, 0], [0.6, 0], [0.7, -80], [0.85, -80], [0.95, 0]] }, ...(H ? { flag: { r: [[0, -4], [0.5, 4], [1, -4]] } } : {}) },
    },
    // schnelles Trippeln, Ohren schlackern
    walk: { prog: 'biped.run', p: { stride: 34, bob: 2.6, armSwing: 24, lean: 8 }, keys: { head: { r: [[0, -3], [0.5, 3], [1, -3]] }, ...(H ? { flag: { r: [[0, -8], [0.5, 6], [1, -8]] } } : {}) } },
    // kurzer Ausfallschritt, schneller Stich
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 30, strike: -80, pull: 3, reach: 5, lean: 10, lunge: 16, step: 5 }, ev: { strike: 0.5 } },
    // Ohren klappen nach hinten
    hit: { p: { knock: 2.4, recoil: 6 }, keys: { head: { r: [[0, 0], [0.2, -14], [1, 0]] } } },
    // purzeln aus dem Fall und springen auf
    spawn: { keys: { hip: { r: [[0, -300], [0.6, 0, 'out']] }, root: { y: [[0, -12], [0.45, 0, 'in']] } } },
    // fallen um, der Löffel klappert weg
    death: { p: { dir: -1, angle: 85 }, keys: { prop: { x: [[0, 0], [0.4, 0], [1, 12]], r: [[0, 0], [1, 200]] }, ...(H ? { banner: { r: [[0, 0], [0.6, -40]] } } : {}) } },
    ...(H
      ? {
          // Bannerbrigade: rammt das Banner in den Boden
          ability: { prog: 'still', keys: { banner: { x: [[0, 0], [0.3, 16]], y: [[0, 0], [0.3, -10], [0.55, 14, 'in']], r: [[0, 0], [0.3, 10]] }, armF: { r: [[0, 0], [0.3, -150], [0.55, -60]] }, armB: { r: [[0, 0], [0.3, -150], [0.55, -60]] }, root: { sy: [[0, 1], [0.55, 1], [0.6, 0.9], [0.7, 1]] } }, ev: { ability: 0.55 } },
        }
      : {}),
  });
}
