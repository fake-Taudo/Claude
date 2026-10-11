// Elektromagier – exzentrischer Erfinder-Magier mit drei Leidener Flaschen im Kupfergestell und Spulen-Handschuhen
// (Brief: docs/briefs/electro-wizard.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, eyeSpiral, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function electroWizard(F) {
  const P = F.pal;
  const COAT = P.main;
  const VOLT = P.acc;
  const COPPER = '#c87a3a';
  const GLASS = '#d8f6ff';
  const SKIN = '#e8c0a0';
  const HAIR = '#eef0f6';
  const COAT_D = '#0c4a58';
  const VEST = '#3a3046';
  const GAITER = '#d8ccb0';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -43],
    head: [4, -66],
    hat: [4, -88],
    back: [-10, -60],
    armB: [-8, -65],
    handB: [-6, -45],
    armF: [11, -65],
    handF: [19, -46],
    prop: [19, -46],
    legB: [-4, -40],
    footB: [-5, -6],
    legF: [5, -40],
    footF: [6, -6],
    cape: [-6, -62],
  });

  // ───────── Kupfergestell mit drei Leidener Flaschen (Signature) ─────────
  const JARS = [[-25, -66, 5.4, 22], [-16.6, -68, 5.8, 26], [-8.4, -66, 5, 20]];
  F.part('rack', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.mat(rrect(-30, -66, 27, 4, 1.4), COPPER, 'metal', { hi: 0.8 });
    g.mat(rrect(-30, -50, 27, 3, 1.2), COPPER, 'metal');
    for (const x of [-29, -5]) g.mat(rrect(x - 1.2, -66, 2.4, 20, 1), COPPER, 'metal');
    g.lod(1, (h) => rivets(h, [[-28, -64], [-6, -64], [-28, -48.6], [-6, -48.6]], 0.7, '#f0b070'));
    for (const [x, y, r, hgt] of JARS) {
      const jar = path([[x - r, y], [x - r, y - hgt + 6, 1], [x - r * 0.6, y - hgt + 3], [x - r * 0.6, y - hgt], [x + r * 0.6, y - hgt], [x + r * 0.6, y - hgt + 3], [x + r, y - hgt + 6, 1], [x + r, y]]);
      g.mat(jar, GLASS, 'glass', { line: '#6aa8c0' });
      g.mat(rrect(x - r, y - hgt * 0.45, r * 2, hgt * 0.45, 1), COPPER, 'metal', { hi: 0.7 });
      g.mat(rrect(x - r * 0.7, y - hgt - 2, r * 1.4, 2.4, 0.8), '#5a3a2a', 'wood');
      g.stroke(polyline([[x, y - hgt - 2], [x, y - hgt - 6]]), COPPER, 0.9);
      g.mat(circle(x, y - hgt - 7, 1.6), COPPER, 'metal', { hi: 0.9 });
    }
  });
  F.part('jarCharge', { bone: 'back', z: 3.5, zb: 46.5, glow: true, state: ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'intact'] }, (g) => {
    for (const [x, y, r, hgt] of JARS) {
      g.fill(ellipse(x, y - hgt * 0.62, r * 0.6, hgt * 0.16), VOLT, { op: 0.75 });
      g.stroke(polyline([[x - 1.6, y - hgt * 0.75], [x + 0.6, y - hgt * 0.62], [x - 0.6, y - hgt * 0.56], [x + 1.6, y - hgt * 0.45]]), '#ffffff', 0.6);
    }
  });
  F.part('arc', { bone: 'back', z: 3.6, zb: 46.6, glow: true, state: ['spark', 'cast'] }, (g) => {
    g.stroke(polyline([[-25, -95], [-22, -98], [-19.6, -94], [-16.6, -101]]), VOLT, 1);
    g.stroke(polyline([[-16.6, -101], [-13, -97], [-11, -100], [-8.4, -93]]), VOLT, 1);
  });
  F.part('burst', { bone: 'back', z: 47, zb: 47, glow: true, state: 'smash' }, (g) => {
    for (const [x, y, r] of [[-22, -84, 5], [-12, -90, 4], [-28, -76, 3.4]]) g.fill(circle(x, y, r), '#9a9aa8', { op: 0.6 });
    for (const [x, y] of [[-30, -92], [-6, -96], [-20, -100]]) g.mat(path([[x, y], [x + 2, y - 3], [x + 3, y + 1]]), GLASS, 'glass');
  });

  // ───────── Beine mit Gamaschen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -40, x * 1.1, -10, 4.4, 3.8), '#2a2a3a', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.2;
      g.mat(path([[fx - 4, -15], [fx + 4, -15.4], [fx + 4.2, -5], [fx - 4, -4.6]]), GAITER, 'cloth', { hi: 0.4 });
      g.lod(1, (h) => {
        for (const y of [-13, -10, -7]) h.fill(circle(fx + 3, y, 0.6), '#5a4a3a');
      });
      g.mat(path([[fx - 4.4, -5], [fx + 4.6, -5.4], [fx + 10, -2.6, 1], [fx + 10, 0, 1], [fx - 5, 0, 1]]), '#2a2024', 'leather', { hi: 0.6 });
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm mit Spulen-Handschuh ─────────
  const glove = (g, x, y) => {
    g.mat(path([[x - 3.4, y - 3], [x + 3, y - 3.4], [x + 6.6, y - 2, 1], [x + 7, y + 1.6, 1], [x + 3.6, y + 3.6], [x - 3, y + 3]]), '#3a3a46', 'leather', { hi: 0.4 });
    // gespreizte Finger
    for (const [dx, dy] of [[7.6, -3.4], [8.4, 0], [7, 3]]) g.mat(rrect(x + 5, y + dy - 0.9, dx - 4, 1.8, 0.9), '#3a3a46', 'leather');
  };
  const coil = (g, x0, y0, x1, y1) => {
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      g.mat(ellipse(x, y, 3.8, 1.2, -60), COPPER, 'metal', { hi: 0.8 });
    }
  };
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => g.mat(limb(-8, -65, -6, -50, 4.4, 3.8), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => {
    coil(g, -7, -51, -6, -47);
    glove(g, -6, -44);
  });
  F.part('sparkB', { bone: 'handB', z: 11.5, zb: 43.5, glow: true, state: 'spark' }, (g) => {
    g.stroke(polyline([[2, -48], [4, -45], [2.4, -43], [4.6, -40]]), VOLT, 0.8);
  });

  // ───────── Langer Mantel, Weste mit Taschenuhr, Kragen (Teamzone) ─────────
  F.part('coatBack', { bone: 'cape', z: 7, zb: 40 }, (g) => {
    g.mat(path([[-11, -64], [6, -64], [10, -40], [14, -20], [6, -16], [-4, -18], [-14, -16], [-12, -40]]), COAT_D, 'cloth', { hi: 0.3 });
  });
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-10, -65], [-2, -67.6], [7, -67.6], [11, -65], [12, -50], [11, -40], [15, -18], [8, -16], [4, -40], [-1, -40], [-4, -18], [-13, -19], [-11, -40], [-11.6, -52]]);
    g.mat(c, COAT, 'cloth', { hi: 0.4 });
    g.clipTo(c, (h) => {
      // Blitz-Paspel an den Kanten
      h.stroke(polyline([[11, -40], [13, -32], [11.6, -28], [14.6, -18]]), VOLT, 0.9, { lod: 1 });
      lines(h, [[[-6, -40], [-9, -20]], [[9, -40], [11, -22]]], COAT_D, 0.7, 1);
    });
  });
  F.part('vest', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    const v = path([[0, -66], [8, -66], [9.6, -52], [8, -42], [3, -40], [-1, -42], [-1, -54]]);
    g.mat(v, VEST, 'cloth', { hi: 0.4 });
    for (const y of [-62, -57, -52, -47]) g.mat(circle(6.6, y, 0.8), COPPER, 'metal', { lod: 1 });
    g.stroke(spline([[6.6, -52], [3, -49], [0, -51]]), '#e8c050', 0.6, { lod: 1 });
    g.mat(circle(0, -51, 1.8), '#e8c050', 'gold', { lod: 1 });
  });
  F.part('collar', { bone: 'torso', z: 26, zb: 38, team: true }, (g) => {
    // hoher Stehkragen
    g.mat(path([[-11, -64], [-12, -78], [-6, -74], [0, -68], [8, -67], [12, -72], [13, -64], [6, -62], [-4, -62]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-9, -66], [-10, -75]], [[11, -64], [12, -70]]], P.teamShade, 0.6, 1));
  });
  // Kabel vom Gestell über die Schulter
  F.part('cableBack', { bone: 'back', z: 4, zb: 45 }, (g) => {
    g.stroke(spline([[-8, -84], [-2, -82], [4, -74], [8, -66]]), '#2a2a2a', 1.4);
    g.stroke(spline([[-25, -88], [-30, -76], [-24, -62]]), '#2a2a2a', 1.2, { lod: 1 });
  });

  // ───────── Kopf: schmales Gesicht, manisches Grinsen, abstehende Haare ─────────
  F.part('hair', { bone: 'head', z: 29, zb: 35 }, (g) => {
    const tips = [[-10, -82], [-12, -90], [-6, -94], [-4, -102], [2, -97], [6, -104], [9, -96], [15, -100], [14, -90], [18, -88]];
    const pts = [[-6, -74]];
    for (let i = 0; i < tips.length; i++) {
      pts.push([tips[i][0], tips[i][1], 1]);
      if (i < tips.length - 1) pts.push([(tips[i][0] + tips[i + 1][0]) / 2 + 1, (tips[i][1] + tips[i + 1][1]) / 2 + 5]);
    }
    pts.push([14, -82]);
    g.mat(path(pts), HAIR, 'hair', { hi: 0.4 });
    // angesengte Spitzen
    g.lod(1, (h) => {
      for (const [x, y] of [[-4, -102], [6, -104], [15, -100]]) h.fill(circle(x, y + 1.4, 1.2), '#5a5a66');
    });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-4, -84], [4, -87], [12.6, -84], [14.4, -76], [13, -68], [7, -63.6], [1, -65], [-4, -71]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10.6, -77.4, 2.6], [4.2, -77.4, 2.4]],
    iris: '#2a7a9a',
    lidColor: SKIN,
    lid: 0,
    look: [0.4, -0.1],
    irisR: 0.4,
    brow: { color: '#c8c8d4', w: 1.1, lift: 1.6 },
    mouth: [8.6, -67.6, 5.6],
    mood: 'grin',
    attackMouth: 'grin',
    replace: {
      // Kurzschluss: Spiralaugen, Haare stehen ab
      hurt: (g, c) => {
        eyeSpiral(g, c.E1[0], c.E1[1], 2.6, INK, 0.8);
        eyeSpiral(g, c.E2[0], c.E2[1], 2.4, INK, 0.8);
        g.stroke(polyline([[5.6, -67.6], [7, -66.6], [8.4, -68.4], [9.8, -66.6], [11.4, -67.8]]), INK, 0.9);
      },
    },
  });
  // statisch abstehender Schnurrbart
  F.part('mustache', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[8.6, -70.6], [4, -70], [-0.6, -73.6, 1], [3.6, -71.4], [8.6, -72.4], [13.6, -71.4], [17.6, -73.6, 1], [13, -70]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('nose', { bone: 'head', z: 32.5, view: 'front' }, (g) => {
    g.mat(path([[9.4, -78], [12.6, -72.6, 1], [9.6, -72]]), '#d8a888', 'skin', { line: '#a87860', lw: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-4, -86], [14, -86], [14.6, -74], [8, -65], [0, -66], [-4.6, -72]]), HAIR, 'hair');
  });
  // Schutzbrille auf der Stirn, Brillenband (Teamzone)
  F.part('gogglesBand', { bone: 'hat', z: 35.5, zb: 36, team: true }, (g) => {
    g.mat(path([[-5.6, -86], [14.6, -88], [14.8, -84.6], [-5.4, -82.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('goggles', { bone: 'hat', z: 36, view: 'front' }, (g) => {
    for (const x of [4.6, 11]) {
      g.mat(circle(x, -86.6, 3.4), COPPER, 'metal', { hi: 0.8 });
      g.mat(circle(x, -86.6, 2.4), '#9ae8f8', 'glass');
      g.fill(ellipse(x - 0.8, -87.4, 0.8, 0.5), WHITE, { lod: 1 });
    }
  });

  // ───────── Vorderer Arm mit Spulen-Handschuh und Kabel ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(11, -65, 18, -50, 4.6, 4), COAT, 'cloth');
    g.stroke(spline([[9, -66], [13, -60], [16, -54], [17, -50]]), '#2a2a2a', 1, { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    coil(g, 17, -51, 19, -47);
    glove(g, 19, -44);
  });
  F.part('sparkF', { bone: 'handF', z: 42, zb: 8, glow: true, state: 'spark' }, (g) => {
    g.stroke(polyline([[27, -48], [29, -45], [27.4, -43], [30, -40]]), VOLT, 0.9);
    g.fill(circle(28.6, -44.6, 1.6), '#ffffc0', { op: 0.7 });
  });
  // Doppelblitz aus beiden Händen
  // Richtung ang (Grad) in Ruhelage: der gehobene Arm dreht den Blitz nach vorn
  const bolt = (g, x, y, len, ang) => {
    const c = Math.cos((ang * Math.PI) / 180);
    const sn = Math.sin((ang * Math.PI) / 180);
    const at = (s, t) => [x + c * s - sn * t, y + sn * s + c * t];
    const pts = [at(0, 0), at(len * 0.2, -4), at(len * 0.35, 2), at(len * 0.55, -3), at(len * 0.72, 3), at(len, 0)];
    g.stroke(polyline(pts), VOLT, 3, { op: 0.6 });
    g.stroke(polyline(pts), '#ffffff', 1.1);
  };
  F.part('boltF', { bone: 'handF', z: 43, zb: 9, glow: true, state: 'cast' }, (g) => bolt(g, 26, -44, 30, 70));
  F.part('boltB', { bone: 'handB', z: 12, zb: 44, glow: true, state: 'cast' }, (g) => bolt(g, 1, -44, 34, 75));
  emblem(F, 'emblem', 'torso', 25, -6, -54, 2.3, { zb: 25 });

  F.anim({
    // Funken knistern zwischen den Fingern
    idle: { p: { breathe: 0.03, bob: 0.6, sway: 1, tilt: 2 }, keys: { show: { spark: [[0.1, 0.18], [0.42, 0.5], [0.7, 0.76]] }, handF: { r: [[0, 0], [0.4, -10], [0.5, 6], [1, 0]] } } },
    // eiliger Schritt, die Flaschen schwappen leuchtend
    walk: { prog: 'biped.run', p: { stride: 24, bob: 2.4, armSwing: 14, lean: 7 }, keys: { back: { r: [[0, -2], [0.5, 2], [1, -2]] } }, ev: { step: [0.25, 0.75] } },
    // beide Hände vor, Flaschen laden, zwei Blitze
    attack: { prog: 'atk.cast', hit: 0.6, p: { wind: 20, strike: -70, windB: 20, strikeB: -75, lean: 8, lunge: 8 }, keys: { show: { spark: [[0.2, 0.5]] } }, ev: { release: 0.6 } },
    // Kurzschluss-Zucken
    hit: { p: { knock: 2.4, recoil: 5 }, keys: { show: { spark: [[0, 0.4]] }, hat: { y: [[0, 0], [0.15, -3], [0.5, 0]] } } },
    // landet mit Elektroschlag
    spawn: { keys: { show: { cast: [[0.55, 0.75]] } }, ev: { land: 0.6 } },
    // Flaschen platzen, er sinkt mit Rauchschwaden zusammen
    death: { p: { dir: -1, angle: 75 }, keys: { show: { intact: [[0, 0.3]], smash: [[0.3, 1.01]] } } },
  });
}
