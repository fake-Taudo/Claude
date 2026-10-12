// Runenriese – feierlicher Steinmetz-Riese mit leuchtenden Runentätowierungen, Steintafel als Schild und Hammer-Meißel
// (Brief: docs/briefs/rune-giant.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, furEdge, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function runeGiant(F) {
  const P = F.pal;
  const SKIN = P.main;
  const RUNE = P.acc;
  const SKIN_D = '#76746c';
  const BEARD = '#c8c2b8';
  const CLOTH = '#6b5a48';
  const SLAB = '#7e8088';
  const BRONZE = '#b8863a';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -38],
    head: [7, -100],
    hat: [7, -124],
    back: [-18, -90],
    armB: [-30, -96],
    handB: [20, -56],
    armF: [31, -96],
    handF: [44, -58],
    prop: [44, -58],
    legB: [-12, -34],
    footB: [-14, -9],
    legF: [12, -34],
    footF: [14, -9],
    cape: [0, -100],
  });

  // Runenzeichen (eckige Glyphen)
  const glyph = (g, x, y, s, col, lw = 1) => {
    g.stroke(polyline([[x, y - s], [x, y + s]]), col, lw);
    g.stroke(polyline([[x, y - s * 0.4], [x + s * 0.7, y - s]]), col, lw);
    g.stroke(polyline([[x, y + s * 0.2], [x - s * 0.6, y - s * 0.3]]), col, lw);
  };

  // ───────── Beine mit Fußwickeln ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -36, x * 1.12, -12, 11, 9.5), SKIN, 'stone', { hi: 0.4 }));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(path([[fx - 11, -18], [fx + 9, -18.6], [fx + 10, -7], [fx + 19, -4], [fx + 19, 0, 1], [fx - 12, 0, 1]]), '#a8987a', 'cloth', { hi: 0.4 });
      g.lod(1, (h) => lines(h, [[[fx - 10, -15], [fx + 9, -12]], [[fx - 10, -10], [fx + 9, -7]]], '#7a6a50', 0.8, 1));
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Hinterer Arm (hält die Tafel) ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    g.mat(limb(-30, -98, -28, -70, 11, 10), SKIN_D, 'stone');
    g.mat(limb(-28, -70, 18, -58, 9.5, 8.5), SKIN_D, 'stone');
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => g.mat(circle(20, -56, 8.4), SKIN_D, 'stone'));

  // ───────── Rumpf mit Runentätowierungen, Lendentuch (Teamzone), Lederschürze ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const t = path([[-34, -100], [-12, -108], [14, -108], [36, -100], [40, -78], [34, -48], [-32, -48], [-38, -78]]);
    g.mat(t, SKIN, 'stone', { hi: 0.45 });
    g.clipTo(t, (h) => {
      h.lod(1, (k) => lines(k, [[[-6, -100], [-2, -84], [8, -80]], [[-20, -72], [-8, -64]], [[20, -70], [10, -62]]], SKIN_D, 0.9, 1));
      glyph(h, -16, -88, 5, RUNE, 1.2);
      glyph(h, 22, -86, 5, RUNE, 1.2);
    });
  });
  F.part('loin', { bone: 'hip', z: 20, zb: 30, team: true }, (g) => {
    g.mat(path([[-30, -52], [32, -52], [30, -40], [16, -16], [4, -14], [-4, -38], [-28, -40]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
  });
  F.part('apron', { bone: 'hip', z: 21, zb: 31 }, (g) => {
    g.mat(rrect(-32, -56, 66, 7, 2), CLOTH, 'leather');
    // Steinstaub-Beutel
    g.mat(blob([[-30, -50], [-22, -50], [-20, -40], [-26, -36], [-32, -40]], 0.6), '#a89a80', 'cloth');
  });

  // ───────── Kopf: kahl, langer Bart, halb geschlossene weise Augen ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[-9, -110], [-6, -122], [6, -128], [18, -124], [23, -112], [21, -100], [10, -94], [-2, -96], [-9, -102]], 0.75), SKIN, 'stone', { hi: 0.5 });
    g.mat(ellipse(-8.5, -108, 3.4, 4.6), SKIN_D, 'stone');
  });
  faceSet(F, {
    eyes: [[15.5, -110.5, 2.3], [6.5, -110.5, 2.1]],
    iris: '#4a5a6a',
    lidColor: SKIN,
    lid: 0.6,
    look: [0.6, 0.2],
    brow: { color: BEARD, w: 2.4, lift: 0.1 },
    mouth: [13, -100.6, 4],
    mood: 'neutral',
    attackMouth: 'grit',
    replace: {
      // beim Verzaubern leuchten die Augen cyan
      attack: (g, c) => {
        for (const [x, y, r] of [c.E1, c.E2]) g.fill(ellipse(x, y, r * 1.1, r * 0.6), RUNE);
      },
    },
  });
  F.part('beard', { bone: 'head', z: 33, zb: 31 }, (g) => {
    g.mat(path([[0, -100], [6, -98], [12, -96], [20, -98], [24, -102], [24, -90], [18, -72], [10, -64, 1], [4, -74], [-2, -88]]), BEARD, 'hair', { hi: 0.5 });
    g.lod(1, (h) => lines(h, [[[8, -94], [10, -72]], [[16, -94], [16, -76]], [[4, -92], [4, -80]]], '#9a948a', 0.7, 1));
    g.mat(rrect(7, -80, 7, 4, 1), BRONZE, 'gold', { lod: 1 });
  });
  F.part('mouthMurmur', { bone: 'head', z: 33.5, view: 'front', expr: ['idle', 'sleep'] }, (g) => g.fill(ellipse(13, -99.6, 1.6, 1), '#4a3a3a'));
  F.part('nose', { bone: 'head', z: 33.6, view: 'front' }, (g) => g.mat(path([[14, -110], [20, -103, 1], [15, -101.6]]), SKIN_D, 'stone', { line: '#5a584e', lw: 0.6 }));
  F.part('headBack', { bone: 'head', z: 34, view: 'back' }, (g) => g.lod(1, (h) => glyph(h, 6, -112, 5, RUNE, 1.2)));

  // ───────── Hammer-Meißel und vorderer Arm ─────────
  F.part('chisel', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[40, -56, 1], [44, -56, 1], [47, -82, 1], [43, -82, 1]]), '#8a6a4a', 'wood');
    g.mat(rrect(38, -90, 16, 9, 2), '#6a6e78', 'metal', { hi: 0.8 });
    g.mat(path([[54, -88, 1], [60, -86, 1], [54, -83, 1]]), '#c8ccd2', 'metal');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    g.mat(limb(31, -98, 36, -72, 11, 10), SKIN, 'stone', { hi: 0.4 });
    g.mat(limb(36, -72, 43, -60, 9.5, 8.5), SKIN, 'stone', { hi: 0.4 });
    g.lod(1, (h) => glyph(h, 34, -84, 4, RUNE, 1));
  });
  F.part('bracer', { bone: 'armF', z: 29.5, zb: 10.5, team: true }, (g) => g.mat(rrect(32, -72, 14, 6, 2).rot(30, 39, -69), P.team, 'metal', { line: P.teamDeep, hi: 0.6 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => g.mat(circle(44, -57, 8), SKIN, 'stone', { hi: 0.4 }));

  // ───────── Runentafel (Signature) – drei Zeilen leuchten einzeln ─────────
  // hohe Stele mit Rundbogen: ragt über den Kopf hinaus
  const slab = path([[8, -106, 1], [16, -124, 1], [30, -130], [44, -124, 1], [50, -108, 1], [51, -18, 1], [10, -16, 1]]);
  F.part('tablet', { bone: 'handB', z: 60, zb: 8, sig: true, state: ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge'] }, (g) => {
    g.mat(slab, SLAB, 'stone', { hi: 0.5 });
    g.clipTo(slab, (h) => {
      h.fill(path([[40, -128], [52, -116], [52, -100]]), '#5a5c64');
      h.lod(1, (k) => lines(k, [[[12, -96], [47, -97]], [[12, -70], [46, -71]], [[12, -46], [46, -47]]], '#5a5c64', 0.8, 1));
    });
    glyph(g, 30, -110, 6, '#4a4c54', 1.6);
    for (const [row, y] of [[0, -82], [1, -58], [2, -34]]) for (let i = 0; i < 4; i++) glyph(g, 16 + i * 8.6, y, 4.4, '#4a4c54', 1.4);
  });
  for (const [i, y] of [[0, -82], [1, -58], [2, -34]]) {
    F.part('runeRow' + i, { bone: 'handB', z: 60.5, zb: 8.5, glow: true, state: 'row' + i }, (g) => {
      for (let k = 0; k < 4; k++) glyph(g, 16 + k * 8.6, y, 4.4, RUNE, 1.6);
    });
  }
  F.part('tabletBroken', { bone: 'handB', z: 60, zb: 8, state: 'death' }, (g) => {
    g.mat(path([[8, -94, 1], [48, -96, 1], [44, -70], [30, -74], [12, -66]]), SLAB, 'stone', { hi: 0.4 });
    g.mat(path([[12, -62], [30, -70], [44, -66], [48, -44], [10, -40]]).rot(8, 30, -54), SLAB, 'stone');
    g.mat(path([[10, -36], [48, -40], [50, -18, 1], [10, -16, 1]]).rot(-6, 30, -28), SLAB, 'stone');
  });
  F.part('dust', { bone: 'handB', z: 61, state: 'dust' }, (g) => {
    for (const [x, y, r] of [[52, -88, 2], [56, -80, 1.6], [50, -72, 1.2]]) g.fill(circle(x, y, r), '#c8c4bc', { op: 0.8 });
  });
  emblem(F, 'emblem', 'handB', 61, 29, -24, 3, { zb: 9 });

  F.anim({
    // meißelt eine Rune, Steinstaub fällt
    idle: { p: { breathe: 0.03, bob: 1, sway: 0.6, tilt: 1.5 }, keys: { armF: { r: [[0, 0], [0.2, -30], [0.3, -20], [0.4, -30], [0.5, -20], [0.6, 0]] }, show: { dust: [[0.25, 0.6]], row0: [[0.3, 0.6]] } } },
    // würdevoller Schritt, Tafel vor dem Körper
    walk: { p: { stride: 14, bob: 3.6, squash: 0.04, armSwing: 6, lean: 2 }, ev: { step: [0.25, 0.75] } },
    // Tafel hoch, Tafelstoß nach unten; eine Rune leuchtet auf
    attack: { prog: 'still', hit: 0.55, keys: { armB: { r: [[0, 0], [0.4, -50, 'out'], [0.55, 10, 'in'], [0.75, 0]] }, handB: { y: [[0, 0], [0.4, -30], [0.55, 6], [0.75, 0]] }, torso: { r: [[0, 0], [0.4, -4], [0.55, 6], [0.8, 0]] }, root: { sy: [[0, 1], [0.55, 1], [0.6, 0.93], [0.75, 1]] }, show: { row1: [[0.5, 0.9]] }, expr: [[0, 1, 'attack']] }, ev: { strike: 0.55 } },
    // Tafel vibriert, Staub rieselt
    hit: { p: { knock: 1.2, recoil: 2 }, keys: { handB: { x: [[0, 0], [0.1, -2], [0.2, 2], [0.3, -1], [0.45, 0]] }, show: { dust: [[0, 0.6]] } } },
    // stellt die Tafel mit dumpfem Schlag ab
    spawn: { keys: { handB: { y: [[0, -20], [0.6, -20], [0.8, 2], [1, 0]] } } },
    // Verzaubern: alle Runenzeilen leuchten nacheinander
    ability: { keys: { show: { row0: [[0, 1]], row1: [[0.3, 1]], row2: [[0.6, 1]] }, expr: [[0, 1, 'attack']] } },
    // Tafel zerbricht in drei Stücke, er sinkt zusammen
    death: { p: { dir: -1, angle: 70 } },
  });
}
