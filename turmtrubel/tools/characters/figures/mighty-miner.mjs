// Großer Gräber – polternder Zwergen-Bohrmeister mit Bohrarm, Bauhelm und Stirnlampe (Brief: docs/briefs/mighty-miner.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, stitches, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function mightyMiner(F) {
  const P = F.pal;
  const OVERALL = P.main;
  const STEEL = P.acc;
  const BEARD = '#6b4f36';
  const HELMET = '#f0c020';
  const LAMP = '#fff6c8';
  const SKIN = '#e8a87c';
  const APRON = '#8a5a32';
  const BOOT = '#4a3424';
  const DUST = '#c8b8a0';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -44],
    head: [5, -84],
    hat: [5, -100],
    back: [-18, -70],
    armB: [-21, -79],
    handB: [-26, -52],
    armF: [20, -79],
    handF: [32, -58],
    prop: [44, -55],
    legB: [-10, -40],
    footB: [-11, -9],
    legF: [10, -40],
    footF: [12, -9],
  });

  // ───────── Sprengstoffkiste auf dem Rücken ─────────
  F.part('crate', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(rrect(-34, -86, 22, 26, 2), '#9a6a3a', 'wood');
    lines(g, [[[-34, -78], [-12, -78]], [[-34, -70], [-12, -70]]], '#6b4424', 0.8, 1);
    g.mat(rrect(-30, -84, 14, 5, 1), '#c84a3a', 'cloth', { lod: 1 });
    g.stroke(spline([[-16, -86], [-14, -92], [-18, -95]]), '#c8b890', 1, { lod: 1 });
  });

  // ───────── Kurze, stämmige Beine mit Stiefeln ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -42, x * 1.1, -14, 10, 9), OVERALL, 'cloth');
      g.lod(1, (h) => h.fill(ellipse(x * 1.05, -26, 3.4, 2.2), '#5a4a3a', { op: 0.35 }));
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 8.6, -18], [fx + 7.6, -18], [fx + 8.6, -8], [fx + 15.6, -4], [fx + 16, 0, 1], [fx - 9.6, 0, 1], [fx - 10, -9]]), BOOT, 'leather');
      g.mat(rrect(fx - 10.4, -2.8, 26.6, 2.8, 1), '#2e2018', 'leather', { lod: 1 });
      g.lod(1, (h) => h.fill(ellipse(fx + 4, -10, 3, 1.6), DUST, { op: 0.6 }));
    });
  };
  leg('legB', 'footB', -10, 6);
  leg('legF', 'footF', 10, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => {
    g.mat(limb(-21, -79, -25, -56, 9.6, 8.4), '#c8902a', 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => {
    g.mat(path([[-32, -58], [-20, -58], [-18, -50], [-22, -44], [-31, -45], [-33.6, -51]]), '#7a5a3a', 'leather');
  });

  // ───────── Overall mit Lederschürze ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-20, -80], [-8, -85], [10, -85], [21, -80], [25, -60], [23, -38], [-22, -38], [-25, -60]]);
    g.mat(t, OVERALL, 'cloth');
    lines(g, [[[-12, -76], [-14, -42]], [[14, -76], [16, -42]]], '#b88020', 0.8, 1);
    g.lod(1, (h) => {
      h.fill(ellipse(-14, -56, 3.4, 2.4), '#5a4a3a', { op: 0.35 });
      h.fill(ellipse(16, -66, 2.6, 1.6), '#3a3230', { op: 0.4 });
    });
  });
  F.part('apron', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    g.mat(path([[-9, -74], [13, -74], [17, -42], [12, -26], [-8, -26], [-13, -42]]), APRON, 'leather');
    stitches(g, [[-8, -72.6], [12, -72.6]], '#d8b080', { step: 2.2, len: 1 });
    g.mat(rrect(-2, -66, 10, 8, 1.4), '#7a4a26', 'leather', { lod: 1 });
  });
  F.part('belt', { bone: 'hip', z: 23, zb: 23, team: true }, (g) => {
    g.mat(rrect(-24, -46, 48, 6, 2), P.team, 'leather', { line: P.teamDeep });
    g.mat(rrect(-2, -47, 8, 8, 1.4), '#c8a046', 'gold');
    g.fill(rrect(0, -45, 4, 4, 0.6), '#5a3a1a', { lod: 1 });
  });

  // ───────── Kopf: breiter Bart, Knollennase, Bauhelm mit Stirnlampe ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-8, -96], [5, -100], [17, -96], [19.6, -86], [17, -76], [8, -72], [-2, -74], [-8, -82]]), SKIN, 'skin');
    g.mat(ellipse(-7.4, -87, 2.8, 3.8), SKIN, 'skin', { lod: 1 });
  });
  faceSet(F, {
    eyes: [[13.4, -89.4, 2.5], [5, -89.4, 2.3]],
    iris: '#3a2a1a',
    lidColor: SKIN,
    lid: 0.3,
    brow: { color: '#5a3e26', w: 2, lift: 0.5 },
    mouth: [10.6, -78.6, 6],
    mood: 'grin',
    attackMouth: 'grin',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(circle(10.6, -83.4, 3.8), '#e08a6a', 'skin', { line: '#a8584a', lw: 0.7 });
  });
  F.part('beard', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[-3, -84], [2, -79], [6, -76.4], [16, -76.6], [20, -82], [21, -74], [17, -64], [9, -60], [1, -64], [-4, -74]]), BEARD, 'hair', { hi: 0.4 });
    g.mat(path([[5, -81], [10.6, -79.6], [16.4, -81], [17, -78.6], [10.6, -77.6], [4.6, -78.6]]), BEARD, 'hair');
    lines(g, [[[3, -72], [5, -66]], [[10, -73], [10, -64]], [[16, -72], [14, -66]]], '#4e3826', 0.6, 1);
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-8, -93], [19, -93], [19, -80], [10, -73], [-1, -74], [-8, -82]]), BEARD, 'hair');
  });
  F.part('helmet', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-11, -92, 1], [-9, -102], [-1, -108.6], [10, -109.6], [19, -104], [21.6, -92, 1]]), HELMET, 'cloth', { hi: 0.7 });
    g.mat(ellipse(5.4, -92, 18.4, 3), '#d8a818', 'cloth');
    g.stroke(spline([[5, -109], [5.4, -100], [5.4, -94]]), '#d8a818', 1.6, { lod: 1 });
  });
  F.part('helmetBand', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-10.4, -95.6], [21.2, -95.6], [21, -98.6], [-10, -98.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });
  F.part('lamp', { bone: 'hat', z: 37, zb: 37, view: 'front' }, (g) => {
    g.mat(rrect(15, -104, 8, 8, 2.4), '#5d6672', 'metal');
    g.mat(circle(21, -100, 3.4), LAMP, 'glass', { line: '#8a7a40' });
  });
  F.part('lampGlow', { bone: 'hat', z: 37.5, view: 'front', glow: true }, (g) => {
    g.fill(path([[22, -103], [40, -110], [42, -92], [22, -97]]), LAMP, { op: 0.28 });
    g.fill(circle(21, -100, 4.6), LAMP, { op: 0.5 });
  });

  // ───────── Bohrarm (Signature): Kolbengehäuse, Drehzahlanzeige, Spiralbohrer ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(limb(20, -79, 26, -64, 10, 9), OVERALL, 'cloth');
  });
  F.part('drillBody', { bone: 'handF', z: 41, zb: 7, sig: true }, (g) => {
    g.mat(path([[20, -70], [40, -64], [43, -52], [24, -50], [19, -58]]), STEEL, 'metal');
    rivets(g, [[23, -66], [36, -62.4], [24, -53], [38, -53]], 1, '#c8ccd2');
    // Kolben oben
    g.mat(rrect(24, -73, 12, 4, 1.4).rot(15, 30, -71), '#9aa3ad', 'metal');
    g.mat(rrect(25, -76, 4, 5, 1).rot(15, 27, -74), '#5d6672', 'metal', { lod: 1 });
    // Drehzahlanzeige
    g.mat(circle(30, -59, 4.2), '#f4f0e6', 'glass', { line: '#3a3a40' });
    g.stroke(polyline([[30, -59], [32.6, -61.6]]), '#c83a2a', 0.9);
    g.lod(1, (h) => {
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.8 + i * 0.35);
        h.stroke(polyline([[30 + Math.cos(a) * 3, -59 + Math.sin(a) * 3], [30 + Math.cos(a) * 3.8, -59 + Math.sin(a) * 3.8]]), '#3a3a40', 0.5);
      }
    });
  });
  // Bohrer: Spiralrillen in drei Phasen (Drehung = Rillen wandern)
  const bit = path([[42, -63.6], [64, -57.2, 1], [43, -50.6]]);
  F.part('drillBit', { bone: 'prop', z: 42, zb: 8 }, (g) => {
    g.mat(bit, '#b8c0c8', 'metal', { hi: 0.9 });
  });
  for (let k = 0; k < 3; k++) {
    F.part('grooves' + k, { bone: 'prop', z: 42.5, zb: 8.5, state: 'g' + k }, (g) => {
      g.clipTo(bit, (h) => {
        for (let s = -8 + k * 2.4; s < 26; s += 7.2) h.stroke(polyline([[42 + s, -66], [45 + s, -48]]), '#6d7682', 1.2);
      });
    });
  }
  F.part('bitCollar', { bone: 'prop', z: 42.6, lod: 1 }, (g) => g.mat(rrect(40, -63, 4, 13, 1.4), '#5d6672', 'metal'));
  emblem(F, 'emblem', 'torso', 24, 2, -58, 2.8, { zb: 24 });

  // Drehung: Rillenphasen im Wechsel (Ruhe langsam, Angriff schnell)
  const spin = (n) => {
    const r = { g0: [], g1: [], g2: [] };
    for (let i = 0; i < n; i++) r['g' + (i % 3)].push([i / n, (i + 1) / n]);
    return r;
  };
  F.anim({
    // lässt den Bohrer kurz aufheulen
    idle: { p: { breathe: 0.025, bob: 1, sway: 1.5 }, keys: { show: spin(6), prop: { r: [[0, 0], [0.5, 0], [0.6, -6], [0.7, 0]] } } },
    // polternder Gang
    walk: { p: { stride: 16, bob: 3, squash: 0.05, armSwing: 4, lean: 3 }, keys: { show: spin(4) }, ev: { step: [0.25, 0.75] } },
    // Bohrer setzt an und bohrt mit steigender Drehzahl
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 18, strike: -30, pull: 4, reach: 10, lunge: 10 }, keys: { show: spin(18), prop: { x: [[0, 0], [0.5, 2], [0.55, 0], [0.6, 2], [0.65, 0], [0.7, 2], [0.8, 0]] } } },
    // Explosive Flucht: bohrt sich ein (Bohrer nach unten)
    ability: { prog: 'biped.idle', keys: { show: spin(18), armF: { r: [[0, 0], [0.3, 70, 'out'], [1, 70]] }, root: { y: [[0, 0], [0.4, 0], [1, 40, 'in']] }, alpha: [[0, 1], [0.7, 1], [1, 0]] }, ev: { ability: 0.6 } },
    hit: { p: { knock: 2, recoil: 4 }, keys: { hat: { r: [[0, 0], [0.15, -10], [0.4, 6], [1, 0]] } } },
    spawn: { ev: { land: 0.55 } },
    // Bohrer stoppt, er kippt um
    death: { p: { dir: -1, angle: 78 } },
  });
}
