// Schweinereiter – übermütiger Jockey mit Rennbrille und Polo-Schläger auf einem Borstenschwein mit Karottenangel
// (Brief: docs/briefs/hog-rider.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, eyeSpiral, eyeX, brow, mouthLine, mouthOpen, stitches, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function hogRider(F) {
  const P = F.pal;
  const HOG = P.main;
  const CARROT = P.acc;
  const HOG_FAR = '#94604c';
  const BELLY = '#d39a82';
  const SNOUT = '#e9a28c';
  const BRISTLE = '#6e4234';
  const HOOF = '#4a3430';
  const MUD = '#6b5040';
  const SILK = '#f4f0e6';
  const SADDLE = '#6b3e22';
  const STRAP = '#5a3420';
  const BRASS = '#c8a046';
  const BAMBOO = '#c9b06a';
  const WOOD = '#9a6a3a';
  const SKIN = '#f0c09a';
  const BREECH = '#ece2cc';
  const BOOT = '#4a2e1e';
  const GLOVE = '#e8dcc0';
  const LEAF = '#5aa040';

  F.rig(
    'rider',
    {
      body: [0, -34],
      head: [34, -44],
      jaw: [44, -30],
      ear: [36, -56],
      tail: [-39, -42],
      legBf: [-26, -24],
      legFf: [20, -24],
      legBn: [-20, -22],
      legFn: [26, -22],
      rod: [12, -60],
      carrot: [70, -78],
      rHip: [-4, -62],
      rTorso: [-4, -63],
      rHead: [8, -86],
      rArmB: [-1, -82],
      rHandB: [14, -68],
      rArmF: [6, -82],
      rHandF: [15, -71],
      prop: [15, -71],
      rLeg: [-2, -62],
      cape: [4, -99],
    },
    { rod: 'body', carrot: 'rod', cape: 'rHead' },
  );

  // ───────── Hintere (ferne) Beine, Ohr und Schwanz ─────────
  const leg = (name, x, z, near) => {
    F.part(name, { bone: name, z }, (g) => {
      const c = near ? HOG : HOG_FAR;
      g.mat(limb(x, -28, x + 1, -6, near ? 10.5 : 9, near ? 7.6 : 6.8), c, 'skin', { hi: 0.2 });
      g.mat(path([[x - 4.2, -7.5], [x + 5.6, -7.5], [x + 6.2, 0, 1], [x + 1.4, 0, 1], [x + 1, -2.6], [x + 0.4, 0, 1], [x - 4.6, 0, 1]]), HOOF, 'leather', { hi: 0.4 });
      if (near) g.lod(1, (h) => {
        h.fill(blob([[x - 3.6, -14], [x + 1, -15.6], [x + 4.6, -12.4], [x + 2, -10], [x - 2.4, -10.6]], 0.6), MUD, { op: 0.75 });
        h.fill(circle(x - 2.2, -18.6, 1.1), MUD, { op: 0.7 });
      });
    });
  };
  leg('legBf', -27, 2, false);
  leg('legFf', 19, 3, false);
  F.part('earFar', { bone: 'head', z: 4 }, (g) => {
    g.mat(path([[24, -54], [25, -66, 1], [33, -58]]), HOG_FAR, 'skin');
  });
  F.part('tail', { bone: 'tail', z: 5 }, (g) => {
    // Ringelschwanz: kleine Spirale, die sich nach oben eindreht
    const pts = [[-39, -42]];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI * 0.5 + (i / 16) * Math.PI * 2.4;
      const r = 4.2 - i * 0.16;
      pts.push([-44.6 + Math.cos(a) * r, -45.6 - Math.sin(a) * r * 0.9]);
    }
    g.stroke(spline(pts), HOG, 1.9);
  });

  // ───────── Schweinekörper ─────────
  F.part('hog', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const body = blob([[-41, -38], [-37, -52], [-23, -62], [0, -65], [20, -61], [34, -52], [41, -38], [36, -22], [20, -14], [-4, -13], [-26, -16], [-38, -26]], 0.5);
    // Borstenkamm entlang des Rückens (Silhouette)
    for (let i = 0; i < 9; i++) {
      const x = -30 + i * 6.2;
      const y = -59.5 - Math.sin(((i + 0.5) / 9) * Math.PI) * 5;
      g.fill(path([[x - 2.6, y + 2.4, 1], [x - 1.2, y - 3.6, 1], [x + 2.8, y + 2.2, 1]]), BRISTLE);
    }
    g.mat(body, HOG, 'skin', { hi: 0.28 });
    g.clipTo(body, (h) => {
      h.mat(ellipse(2, -14, 31, 10), BELLY, 'skin', { line: '0' });
    });
    g.lod(1, (h) => {
      lines(h, [
        [[-34, -46], [-30, -42]], [[-30, -52], [-26, -48]], [[-36, -34], [-32, -31]],
        [[22, -52], [26, -48]], [[28, -44], [31, -40]], [[18, -42], [21, -39]],
      ], BRISTLE, 0.7, 1);
      h.fill(blob([[-36, -24], [-30, -27], [-26, -22], [-31, -19]], 0.6), MUD, { op: 0.6 });
    });
  });
  F.part('hogBack', { bone: 'body', z: 10.5, view: 'back', lod: 1 }, (g) => {
    g.stroke(spline([[-34, -50], [-12, -60], [14, -58]]), BRISTLE, 0.8);
  });

  // ───────── Satteldecke (Teamzone), Sattel, Gurt ─────────
  F.part('blanket', { bone: 'body', z: 12, team: true }, (g) => {
    const zig = [];
    for (let i = 0; i <= 8; i++) zig.push([14 - i * 4.5, -34 + (i % 2 ? 3 : 0), 1]);
    const bl = path([[-19, -64], [12, -64], [16, -50], ...zig, [-24, -50]]);
    g.mat(bl, P.team, 'cloth', { line: P.teamDeep });
    g.clipTo(bl, (h) => {
      h.fill(path([[-26, -40], [18, -40], [18, -36], [-26, -36]]), P.symbol, { op: 0.9 });
      for (let i = 0; i < 9; i++) h.fill(poly([[-23 + i * 5, -38], [-21 + i * 5, -40.6], [-19 + i * 5, -38], [-21 + i * 5, -35.4]]), P.teamDeep, { lod: 1 });
    });
  });
  F.part('saddle', { bone: 'body', z: 13 }, (g) => {
    g.mat(path([[-17, -66, 1], [-12, -61], [6, -61], [12, -67, 1], [14.5, -62], [9, -56], [-13, -56], [-19, -60]]), SADDLE, 'leather', { hi: 0.45 });
    g.mat(rrect(-6.5, -56, 5, 42, 1.2), STRAP, 'leather', { lod: 0 });
    g.mat(rrect(-7.2, -27, 6.4, 5, 1), BRASS, 'gold', { line: '#7a5a20' });
    stitches(g, [[-14, -58.4], [8, -58.4]], '#c99a6a', { step: 2.2, len: 1 });
  });
  emblem(F, 'emblem', 'body', 12.5, -13, -47, 3.2);

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 20 }, (g) => {
    const hd = blob([[25, -57], [37, -62], [49, -57], [57, -47], [60, -37], [54, -27], [40, -24], [28, -30], [23, -44]], 0.5);
    g.mat(hd, HOG, 'skin', { hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[30, -32], [34, -29]], [[27, -40], [30, -37]]], BRISTLE, 0.6, 1));
  });
  F.part('mouthOpen', { bone: 'head', z: 20.5, expr: ['attack', 'hurt', 'ability'] }, (g) => {
    g.fill(path([[40, -30.5, 1], [57, -32], [54, -24], [44, -24.6]]), '#4a1c24', { stroke: INK, lw: 0.7 });
    g.fill(ellipse(49, -25.6, 4, 1.6), '#e0656e', { lod: 1 });
  });
  F.part('jaw', { bone: 'jaw', z: 21 }, (g) => {
    g.mat(path([[40, -30], [55, -30.5], [53, -26], [44, -24.4], [39, -26.4]]), HOG, 'skin', { line: '0' });
    g.stroke(spline([[41, -29.6], [48, -28.8], [55, -30.4]]), '#6b3a30', 0.8);
    // kleiner Hauer
    g.fill(path([[50.4, -29.4, 1], [52.2, -34.6, 1], [53.2, -29.6, 1]]), '#f4ead6', { stroke: INK, lw: 0.55 });
  });
  F.part('snout', { bone: 'head', z: 22 }, (g) => {
    g.mat(ellipse(59.5, -38.5, 6.4, 8.6, -6), SNOUT, 'skin', { line: '#a8604a', lw: 0.9, hi: 0.45 });
    g.fill(ellipse(58, -41.2, 1.2, 2), '#5a2f2a');
    g.fill(ellipse(61.4, -36.4, 1.2, 2), '#5a2f2a');
  });
  const HEYE = { r: 3.1, ratio: 1.1, iris: '#3a2418', lidColor: HOG, irisR: 0.66 };
  F.part('hogFace.idle', { bone: 'head', z: 23, expr: ['idle', 'sleep'] }, (g) => {
    eye(g, 46.5, -47, { ...HEYE, look: [0.8, -0.6], lid: 0.2 });
    brow(g, [[43, -52], [46.6, -53.6], [50, -52.6]], 1, BRISTLE);
    g.fill(ellipse(51, -40, 3, 1.8), '#f08a7a', { op: 0.4, lod: 1 });
  });
  F.part('hogFace.attack', { bone: 'head', z: 23, expr: ['attack', 'ability'] }, (g) => {
    eye(g, 46.5, -47, { ...HEYE, look: [0.9, -0.2], lid: 0.35 });
    brow(g, [[43, -51], [46.6, -51.4], [50.4, -49.6]], 1.2, BRISTLE);
  });
  F.part('hogFace.hurt', { bone: 'head', z: 23, expr: ['hurt', 'stun'] }, (g) => {
    g.stroke(polyline([[44, -50], [48.6, -47], [44, -44.4]]), INK, 1.1);
  });
  F.part('hogFace.death', { bone: 'head', z: 23, expr: 'death' }, (g) => eyeX(g, 46.5, -47, 2.1));
  // Schlappohr (fliegt beim Treffer hoch)
  F.part('ear', { bone: 'ear', z: 24 }, (g) => {
    const e = path([[31, -55.5, 1], [37, -63.5], [46, -61], [53.5, -51.8, 1], [45, -52.6], [37, -51.4]]);
    g.mat(e, HOG, 'skin', { hi: 0.35 });
    g.fill(path([[36, -58], [44, -59], [50, -53.2], [43, -54.4]]), '#e39a86', { lod: 1, op: 0.85 });
  });

  // ───────── Nahe Beine (vor dem Körper) ─────────
  leg('legBn', -21, 14, true);
  leg('legFn', 25, 15, true);

  // ───────── Karottenangel (Signature) ─────────
  F.part('rod', { bone: 'rod', z: 26, zb: 26, sig: true }, (g) => {
    const rod = [[12, -60], [22, -74], [40, -84.5], [58, -85], [70, -78.4]];
    g.stroke(spline(rod), '#8a7440', 2.4);
    g.stroke(spline(rod), BAMBOO, 1.5);
    g.lod(1, (h) => {
      for (const [x, y] of [[19, -70.4], [31, -80.4], [45, -85], [59, -84.4]]) h.fill(circle(x, y, 1.15), '#8a7440');
    });
    g.mat(rrect(9.6, -63, 5, 6, 1.2), STRAP, 'leather', { lod: 1 });
  });
  F.part('carrot', { bone: 'carrot', z: 27, zb: 27, sig: true }, (g) => {
    g.stroke(polyline([[70, -78.4], [70, -54]]), '#efe6d4', 0.6);
    // Grün
    g.mat(path([[69.6, -53, 1], [66, -60.4], [68, -61, 1], [70, -55], [71, -62.6, 1], [72.6, -61.6], [71.4, -54.6], [75, -59.4, 1], [75.6, -57.6], [71.2, -52.6, 1]]), LEAF, 'cloth', { hi: 0.2 });
    // Rübe
    const c = path([[65.6, -53.4], [70, -54.8], [74.4, -53.2], [72.6, -44], [70.8, -36, 1], [69.6, -36.4], [67.4, -44]]);
    g.mat(c, CARROT, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[67.4, -49], [69.6, -48.4]], [[71.4, -45.6], [73.2, -46.2]], [[68.4, -42], [70, -41.6]]], '#b8641a', 0.6, 1));
  });

  // ───────── Jockey ─────────
  // Mützenbänder flattern hinter dem Kopf
  F.part('ribbons', { bone: 'cape', z: 29, team: true }, (g) => {
    g.mat(path([[5, -100], [-4, -104], [-13, -101.6], [-19, -104.6, 1], [-16, -98.4], [-7, -97.4], [3, -97]]), P.teamLight, 'cloth', { line: P.teamShade, lw: 0.6 });
    g.mat(path([[4, -97], [-5, -96], [-12, -92.4], [-17, -94, 1], [-13, -89.6], [-5, -92.6], [3, -94.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });
  F.part('rArmB', { bone: 'rArmB', z: 28 }, (g) => {
    g.mat(limb(-1, -82, 13, -69, 4.6, 4), SILK, 'cloth');
  });
  F.part('rHandB', { bone: 'rHandB', z: 29 }, (g) => {
    g.stroke(polyline([[15, -68], [27, -61], [37, -53]]), STRAP, 1);
    g.mat(circle(14.6, -68.4, 2.8), GLOVE, 'leather');
  });
  F.part('rTorso', { bone: 'rTorso', z: 30, team: true }, (g) => {
    const silk = path([[-11, -60, 1], [-12.4, -72], [-8.4, -83], [0, -88.4], [10, -87.4], [14, -80], [11, -68], [6, -60, 1]]);
    g.mat(silk, SILK, 'cloth', { hi: 0.4 });
    // Rautenmuster (Teamzone)
    g.clipTo(silk, (h) => {
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
          if ((row + col) % 2) continue;
          const cx = -14 + col * 5.4 + (row % 2) * 2.7;
          const cy = -90 + row * 5.6;
          h.fill(poly([[cx, cy - 2.8], [cx + 2.7, cy], [cx, cy + 2.8], [cx - 2.7, cy]]), P.team);
        }
      }
    });
    g.mat(rrect(-11.6, -63.6, 18, 4, 1.4), BREECH, 'cloth', { lod: 1 });
    g.mat(path([[1, -88.6], [9, -88], [7, -85.4], [2, -85.6]]), SILK, 'cloth', { lod: 1 });
  });
  F.part('number', { bone: 'rTorso', z: 30.5, view: 'back' }, (g) => {
    g.mat(rrect(-10.6, -81, 10, 11, 1.2), WHITE, 'cloth', { line: '#b8b0a0' });
    // Startnummer 4
    g.fill(path([[-4, -79, 1], [-2.6, -79, 1], [-2.6, -75, 1], [-1.6, -75, 1], [-1.6, -73.6, 1], [-2.6, -73.6, 1], [-2.6, -71.6, 1], [-4, -71.6, 1], [-4, -73.6, 1], [-8.4, -73.6, 1], [-8.4, -74.8, 1]]), INK);
    g.fill(path([[-4, -77, 1], [-4, -75, 1], [-6.6, -75, 1]]), WHITE);
  });
  F.part('rLeg', { bone: 'rLeg', z: 32 }, (g) => {
    g.stroke(polyline([[-1, -59], [7.4, -43]]), STRAP, 0.9);
    g.mat(limb(-3, -62, 9, -56.4, 6.2, 5.4), BREECH, 'cloth');
    g.mat(limb(9, -57, 7.6, -46, 5, 4.2), BOOT, 'leather', { hi: 0.4 });
    g.mat(path([[4.6, -47.6], [10.4, -47.6], [13.8, -44.6], [13.6, -42.4, 1], [4.4, -42.4, 1]]), BOOT, 'leather', { hi: 0.4 });
    g.mat(path([[5, -42.6], [13, -42.6], [12.4, -40], [5.6, -40]]), BRASS, 'gold', { line: '#7a5a20', lw: 0.6 });
    g.lod(1, (h) => {
      h.fill(circle(8.4, -51, 1), MUD, { op: 0.8 });
      h.fill(circle(10.6, -45.6, 0.8), MUD, { op: 0.8 });
    });
  });
  F.part('rHead', { bone: 'rHead', z: 34 }, (g) => {
    g.mat(circle(12, -92.6, 7.6), SKIN, 'skin', { hi: 0.3 });
    g.mat(ellipse(5.6, -91.6, 1.8, 2.4), SKIN, 'skin', { lod: 1 });
  });
  F.part('rHeadBack', { bone: 'rHead', z: 34.5, view: 'back' }, (g) => {
    g.clipTo(circle(12, -92.6, 7.6), (h) => h.mat(rrect(3, -98, 18, 9, 2), '#7a4a2a', 'hair'));
    g.mat(rrect(4, -96.6, 16, 2.4, 1), STRAP, 'leather');
  });
  F.part('rFace.idle', { bone: 'rHead', z: 35, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    // breites Grinsen mit Zahnlücke
    g.fill(path([[11, -88.2, 1], [19.6, -88.6, 1], [17.6, -85.2], [13, -85]]), '#4a1c24', { stroke: INK, lw: 0.6 });
    g.fill(rrect(11.8, -88.4, 3, 1.5, 0.3), WHITE);
    g.fill(rrect(16, -88.6, 3, 1.5, 0.3), WHITE);
  });
  F.part('rFace.attack', { bone: 'rHead', z: 35, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    // jauchzt
    mouthOpen(g, 15.6, -86.4, 6.4, 3.8, { teeth: 'top', lw: 0.6 });
  });
  F.part('rFace.hurt', { bone: 'rHead', z: 35, view: 'front', expr: ['hurt', 'stun', 'death'] }, (g) => {
    g.stroke(spline([[11.6, -86], [14, -87.2], [16, -86], [18.4, -87.2]]), INK, 0.8);
  });
  F.part('nose', { bone: 'rHead', z: 35.5, view: 'front' }, (g) => {
    g.mat(ellipse(20, -90.6, 1.8, 1.5), '#e8a47e', 'skin', { line: '#a8684a', lw: 0.5 });
  });
  // Rennbrille (übertrieben groß)
  F.part('goggles', { bone: 'rHead', z: 36, view: 'front' }, (g) => {
    g.mat(rrect(3.6, -96.6, 17, 2.6, 1), STRAP, 'leather');
    g.mat(circle(10.4, -94.2, 3.4), BRASS, 'gold', { line: '#6a4a14' });
    g.mat(circle(17.2, -94, 4.2), BRASS, 'gold', { line: '#6a4a14' });
    g.mat(circle(10.4, -94.2, 2.3), '#a8d8e8', 'glass');
    g.mat(circle(17.2, -94, 3), '#a8d8e8', 'glass');
  });
  F.part('rEyes', { bone: 'rHead', z: 36.5, view: 'front', expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    g.fill(ellipse(11, -94, 0.9, 1.2), '#1c2430');
    g.fill(ellipse(18.2, -93.8, 1.1, 1.4), '#1c2430');
  });
  F.part('rEyes.hurt', { bone: 'rHead', z: 36.5, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    g.stroke(polyline([[16.2, -95.4], [18.6, -94], [16.2, -92.6]]), INK, 0.7);
    g.stroke(polyline([[9.4, -95.4], [11.6, -94.2], [9.4, -93]]), INK, 0.6);
  });
  F.part('rEyes.death', { bone: 'rHead', z: 36.5, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 17.2, -94, 1.4, INK, 0.7);
    eyeX(g, 10.4, -94.2, 1.1, INK, 0.6);
  });
  F.part('goggleGlint', { bone: 'rHead', z: 37, view: 'front', lod: 1 }, (g) => {
    g.fill(ellipse(15.8, -95.6, 1, 0.6, -30), '#ffffff', { op: 0.9 });
  });
  // Jockeymütze mit Teamviertel und Schirm
  F.part('cap', { bone: 'rHead', z: 38, team: true }, (g) => {
    const dome = path([[3, -95, 1], [3.6, -100.4], [9.4, -104.6], [16.4, -104], [21, -98.6], [21.4, -95.6, 1]]);
    g.mat(dome, P.team, 'cloth', { line: P.teamDeep, hi: 0.45 });
    g.clipTo(dome, (h) => {
      h.fill(path([[9, -106], [14, -106], [14, -94], [9, -94]]), P.symbol);
    });
    g.mat(path([[16.8, -96.6], [27.4, -96.4], [28.4, -94.6], [17.6, -94.2]]), P.teamDeep, 'cloth');
    g.mat(circle(12, -104.4, 1.3), P.symbol, 'cloth', { lod: 1 });
  });
  // Polo-Schläger: Bambusstiel mit zylindrischem Holzkopf, ruht über der Schulter
  const ang = (-146 * Math.PI) / 180;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const H0 = [15 - ux * 4, -71 - uy * 4];
  const H1 = [15 + ux * 40, -71 + uy * 40];
  F.part('mallet', { bone: 'prop', z: 33, zb: 33 }, (g) => {
    g.stroke(polyline([H0, H1]), '#8a7440', 2.3);
    g.stroke(polyline([H0, H1]), BAMBOO, 1.4);
    g.lod(1, (h) => {
      for (const t of [12, 22, 32]) h.fill(circle(15 + ux * t, -71 + uy * t, 1.05), '#8a7440');
    });
    g.stroke(polyline([H0, [15 + ux * 3, -71 + uy * 3]]), STRAP, 2.6);
    const cx = H1[0] + ux * 1.6;
    const cy = H1[1] + uy * 1.6;
    const deg = (Math.atan2(-ux, uy) * 180) / Math.PI;
    g.mat(rrect(cx - 6, cy - 2.4, 12, 4.8, 1.6).rot(deg, cx, cy), WOOD, 'wood', { hi: 0.4 });
    g.mat(rrect(cx - 1.4, cy - 2.6, 2.8, 5.2, 0.6).rot(deg, cx, cy), BRASS, 'gold', { lod: 1 });
  });
  F.part('rArmF', { bone: 'rArmF', z: 40 }, (g) => {
    g.mat(limb(6, -82, 14.6, -71.6, 4.8, 4.2), SILK, 'cloth');
    g.clipTo(limb(6, -82, 14.6, -71.6, 4.8, 4.2), (h) => {
      h.fill(poly([[9.6, -79.6], [12, -77], [9.6, -74.4], [7.2, -77]]), P.team, { lod: 1 });
    });
  });
  F.part('rHandF', { bone: 'rHandF', z: 41 }, (g) => {
    g.mat(circle(15.4, -70.8, 3), GLOVE, 'leather');
    g.stroke(polyline([[13.2, -72], [17.4, -69.8]]), '#b8a888', 0.6, { lod: 1 });
  });

  F.meta.hit = [62, -30];

  F.anim({
    // Schwein scharrt und schnüffelt nach der Karotte, Jockey wippt im Sattel
    idle: {
      p: { nod: 4, riderLean: 4 },
      keys: {
        legFn: { r: [[0, 0], [0.18, -20], [0.28, 6], [0.38, -16], [0.48, 4], [0.58, 0], [1, 0]] },
        head: { r: [[0, 0], [0.5, -5], [0.62, -3], [0.7, -6], [1, 0]] },
        jaw: { r: [[0, 0], [0.55, 0], [0.6, 6], [0.65, 0], [0.7, 6], [0.75, 0]] },
        carrot: { r: [[0, -5], [0.5, 5, 'io'], [1, -5, 'io']] },
        rHip: { y: [[0, 0], [0.25, -1.4], [0.5, 0], [0.75, -1.4], [1, 0]] },
      },
    },
    // Galopp, Karotte schaukelt vor der Schnauze
    walk: {
      p: { stride: 30, bob: 4, rock: 5, nod: 6, riderLean: 10, ride: 2.4 },
      keys: { carrot: { r: [[0, -14], [0.5, 12, 'io'], [1, -14, 'io']] }, ear: { r: [[0, 0], [0.5, -16], [1, 0]] }, rod: { r: [[0, 0], [0.5, -3], [1, 0]] } },
      ev: { step: [0.1, 0.35, 0.6, 0.85] },
    },
    // Flusssprung (Flag JUMP → Zustand charge): Beine gestreckt, Ohren flattern, Karotte schwingt nach oben
    charge: { prog: 'quad.jump', p: { reach: 50, kick: 48, riderLean: 18 }, keys: { carrot: { r: [[0, -40], [0.5, -55], [1, -40]] } } },
    // Schläger weit nach hinten, seitlicher Polo-Schlag, Follow-through über den Kopf
    attack: {
      prog: 'rider.swing',
      hit: 0.55,
      p: { riderLean: 4, wind: 169, strike: 24, over: -125, end: 0, cock: -173, snap: -168, snapOver: -25, handEnd: -360, lean: 10, lunge: 16, step: 4 },
      keys: { carrot: { r: [[0, 0], [0.55, -10], [0.8, 8], [1, 0]] } },
    },
    hit: { keys: { ear: { r: [[0, 0], [0.15, -55, 'out'], [1, 0]] }, jaw: { r: [[0, 0], [0.12, 14], [0.6, 0]] } } },
    // Schwein setzt sich auf den Hintern, Jockey purzelt ab, Karotte bleibt kurz liegen
    death: {
      p: { angle: 18 },
      keys: {
        rHip: { x: [[0, 0], [0.2, -4], [0.6, -30, 'out']], y: [[0, 0], [0.2, -12, 'out'], [0.6, 22, 'in']] },
        rTorso: { r: [[0, 0], [0.6, -150]] },
        carrot: { y: [[0, 0], [0.4, 0], [0.62, 22, 'in']], r: [[0, 0], [0.62, 70]] },
        ear: { r: [[0, 0], [0.3, -30], [0.6, 10]] },
      },
    },
  });
}
