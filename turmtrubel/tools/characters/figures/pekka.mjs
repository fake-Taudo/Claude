// P.E.K.K.A. – stummer Kampfautomat aus Dunkelbronze mit Laternenkopf und Fallbeil-Schwert (Brief: docs/briefs/pekka.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { rivets, lines, emblem, INK } from '../kit.mjs';

export default function pekka(F) {
  const P = F.pal;
  const BRONZE = P.main;
  const FLAME = P.acc;
  const BRONZE_D = '#3a302b';
  const BRASS = '#c8a046';
  const GLASS = '#bfe8e0';
  const STEEL = '#a8b0ba';
  const JOINT = '#2e2622';
  const VERD = '#5f9c84';
  const INSIDE = '#0f1f22';
  const CORE = '#e6fff8';

  F.rig('biped', {
    hip: [0, -46],
    torso: [0, -50],
    head: [5, -104],
    hat: [5, -108],
    armB: [-28, -94],
    handB: [-32, -60],
    armF: [30, -94],
    handF: [35, -60],
    prop: [35, -60],
    legB: [-12, -46],
    footB: [-13, -10],
    legF: [12, -46],
    footF: [14, -10],
    back: [-12, -80],
    cape: [-35, -126],
  });

  // ───────── Beine: Gelenkleder, Kniekachel mit Dorn, Beinschiene, Plattenschuh ─────────
  const leg = (name, foot, x, z) => {
    const far = name === 'legB';
    const B = far ? BRONZE_D : BRONZE;
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -50, x * 1.05, -30, 9.5, 8.5), JOINT, 'leather');
      g.mat(path([[x - 7.5, -27], [x + 8, -27], [x + 9, -12], [x - 7.5, -12]]), B, 'metal');
      rivets(g, [[x - 4.5, -24], [x - 4.5, -15]], 0.9, BRASS);
      g.mat(path([[x - 8.5, -37], [x + 1.5, -41], [x + 10, -35], [x + 15, -31.5, 1], [x + 9, -27.5], [x - 6.5, -25.5]]), B, 'metal');
      g.lod(1, (h) => h.stroke(spline([[x - 6, -28], [x + 1, -30], [x + 8, -28.6]]), VERD, 0.9));
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 9, -13.5], [x + 9, -13.5], [x + 16.5, -6.5], [x + 18, 0, 1], [x - 10.5, 0, 1], [x - 10.5, -8]]), B, 'metal');
      lines(g, [[[x - 9.6, -7.6], [x + 13.4, -7.6]], [[x + 3, -13.2], [x + 6, -7.8]]], '#241c1a', 0.8, 1);
    });
  };
  leg('legB', 'footB', -12, 6);
  leg('legF', 'footF', 13, 10);

  // ───────── Hinterer Arm mit Schulterplatte und Wimpel ─────────
  const pauldron = (s, x0, y0, color) => {
    // gestaffelte Platten mit Dorn nach oben
    const X = (x) => x0 + x * s;
    return [
      path([[X(-12), y0 + 8], [X(-10), y0 - 4], [X(-3), y0 - 10], [X(2), y0 - 22, 1], [X(6), y0 - 10], [X(14), y0 - 6], [X(16), y0 + 4], [X(10), y0 + 10], [X(-6), y0 + 12]]),
      path([[X(-11), y0 + 9], [X(-6), y0 + 2], [X(8), y0 + 2], [X(15), y0 + 8], [X(12), y0 + 16], [X(-8), y0 + 16]]),
      color,
    ];
  };
  F.part('armB', { bone: 'armB', z: 12, zb: 40 }, (g) => {
    g.mat(limb(-28, -94, -31, -76, 9, 8.5), JOINT, 'leather');
    g.mat(limb(-31, -78, -32, -64, 10.5, 10), BRONZE_D, 'metal');
  });
  F.part('handB', { bone: 'handB', z: 13, zb: 41 }, (g) => {
    g.mat(path([[-42, -72], [-22, -72], [-23, -65], [-41, -65]]), BRONZE_D, 'metal');
    g.mat(path([[-39, -66], [-25, -66], [-24, -56], [-29, -50], [-38, -51], [-40, -58]]), BRONZE_D, 'metal');
    lines(g, [[[-37, -56], [-31, -56]], [[-37, -53], [-31, -53]]], '#241c1a', 0.7, 1);
  });
  F.part('pennantPole', { bone: 'torso', z: 14, zb: 46 }, (g) => {
    g.stroke(polyline([[-29, -98], [-35, -128]]), '#5a4a3a', 2);
    g.mat(circle(-35.2, -129, 1.8), BRASS, 'gold');
  });
  F.part('pennant', { bone: 'cape', z: 14.5, zb: 46.5, team: true }, (g) => {
    g.mat(path([[-35, -127, 1], [-55, -122], [-48, -118.6], [-56, -114.4, 1], [-34, -116.6, 1]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(circle(-41.4, -120.6, 1.8), P.symbol, 'cloth', { lod: 1 });
  });
  F.part('pauldronB', { bone: 'armB', z: 15, zb: 43 }, (g) => {
    const [a, b, c] = pauldron(-1, -27, -96, BRONZE_D);
    g.mat(a, c, 'metal');
    g.mat(b, c, 'metal', { line: '#9a7a30', lw: 1.1 });
  });

  // ───────── Rumpf ─────────
  F.part('tassets', { bone: 'hip', z: 18, zb: 18 }, (g) => {
    g.mat(path([[-26, -56], [-2, -56], [-4, -38], [-25, -40]]), BRONZE_D, 'metal');
    g.mat(path([[-1, -56], [25, -56], [27, -39], [2, -36]]), BRONZE, 'metal');
    rivets(g, [[-21, -52], [-8, -52], [5, -52], [21, -52]], 0.9, BRASS);
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-24, -102], [-31, -86], [-25, -60], [-17, -48], [19, -48], [27, -60], [33, -86], [26, -102], [14, -106], [-12, -106]]);
    g.mat(t, BRONZE, 'metal');
    g.clipTo(t, (h) => {
      h.stroke(spline([[-26, -64], [2, -60], [30, -64]]), '#241c1a', 1.2);
      h.stroke(spline([[-22, -55], [2, -51.6], [26, -55]]), '#241c1a', 1.2);
      h.lod(1, (k) => {
        k.stroke(spline([[-25, -63], [2, -59], [29, -63]]), '#6e6052', 0.6);
        k.fill(blob([[-31, -88], [-27, -90], [-26, -84], [-29, -80]], 0.6), VERD, { op: 0.7 });
        k.fill(blob([[24, -102], [29, -98], [27, -95], [22, -99]], 0.6), VERD, { op: 0.7 });
      });
    });
    g.stroke(spline([[-12, -105], [1, -101], [14, -105]]), BRASS, 1.4);
    rivets(g, [[-20, -98], [-24, -88], [-22, -76], [24, -98], [28, -88], [26, -76], [-14, -66], [0, -64], [16, -66]], 1, BRASS);
  });
  F.part('crest', { bone: 'torso', z: 21, view: 'front', team: true }, (g) => {
    const sh = path([[0, -95], [20, -95], [20, -81], [10, -70, 1], [0, -81]]);
    g.mat(sh, P.team, 'metal', { line: P.teamDeep });
    g.stroke(sh, BRASS, 1.2, { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 22, 10, -84, 3.6, { view: 'front' });
  // Rücken: Kessel mit zwei Kolben (zischen leise)
  F.part('boiler', { bone: 'back', z: 21, view: 'back' }, (g) => {
    g.mat(rrect(-20, -98, 30, 38, 6), BRONZE_D, 'metal');
    for (const x of [-15, -3]) {
      g.mat(rrect(x - 3, -112, 6, 18, 1.6), STEEL, 'metal');
      g.mat(rrect(x - 4, -114.5, 8, 3.6, 1.2), BRASS, 'gold');
    }
    rivets(g, [[-16, -92], [6, -92], [-16, -66], [6, -66]], 1, BRASS);
    g.mat(circle(-5, -78, 6), '#5a4a3a', 'metal', { lod: 1 });
    g.stroke(polyline([[-5, -82.5], [-2.4, -78]]), INK, 0.9, { lod: 1 });
  });
  emblem(F, 'emblemBack', 'back', 22, -5, -78, 3.4, { view: 'back' });
  F.part('steam', { bone: 'back', z: 21.5, view: 'back', state: 'hiss', lod: 1 }, (g) => {
    for (const [x, y, r] of [[-15, -117, 3], [-17, -122, 2.4], [-3, -118, 2.6], [-1, -124, 2]]) g.fill(circle(x, y, r), '#e8f0ee', { op: 0.6 });
  });

  // ───────── Laternenkopf (Signature) ─────────
  F.part('neck', { bone: 'head', z: 28 }, (g) => {
    g.mat(rrect(-4, -108, 18, 6, 2), JOINT, 'leather');
  });
  const hex = path([[-9, -107], [-9, -128], [-3, -130.5], [13, -130.5], [19, -128], [19, -107], [13, -104.5], [-3, -104.5]]);
  F.part('lanternBack', { bone: 'head', z: 30, sig: true }, (g) => {
    g.fill(hex, INSIDE);
  });
  // Flamme = Gesicht
  const flame = (name, expr, outer, inner, glow = true) => {
    F.part(name, { bone: 'hat', z: 32.5, expr }, (g) => {
      g.fill(outer, FLAME);
      if (inner) g.fill(inner, CORE, { op: 0.9 });
    });
    if (glow) F.part(name + '.glow', { bone: 'hat', z: 31.5, expr, glow: true }, (g) => {
      g.fill(ellipse(5, -115, 7.5, 9.5), FLAME, { op: 0.22 });
    });
  };
  flame('flame.idle', ['idle', 'sleep'],
    blob([[-1, -110], [0, -115], [3, -121], [5, -126], [7, -120], [10, -115], [11, -110], [8, -107], [2, -107]], 0.45),
    blob([[2, -110], [3.5, -115], [5, -119], [6.5, -115], [8, -110], [5, -108.6]], 0.45));
  flame('flame.attack', ['attack', 'ability'],
    path([[-2, -110], [-2.4, -117], [-0.4, -125, 1], [2.4, -118], [5, -129, 1], [7.8, -118], [10.6, -125, 1], [12.4, -116], [12, -110], [8, -106.5], [2, -106.5]]),
    path([[1.4, -110], [2.6, -116], [5, -122, 1], [7.4, -116], [8.6, -110], [5, -108]]));
  flame('flame.hurt', 'hurt',
    blob([[-0.4, -108.6], [1.4, -112], [4, -114.6], [7, -113.4], [10.4, -110.4], [9, -107.4], [2, -107.2]], 0.45),
    blob([[2.6, -109], [4.6, -111.6], [7, -110.4], [6, -108.4]], 0.45));
  flame('flame.stun', 'stun',
    blob([[1, -109], [2, -113], [5, -116], [8.4, -114], [9, -110], [6, -107.6]], 0.5),
    null);
  F.part('smoke', { bone: 'hat', z: 31, expr: 'death' }, (g) => {
    g.stroke(spline([[5, -108], [3, -114], [7, -119], [4, -125], [6, -129]]), '#c8ccd0', 1.6, { op: 0.75 });
    g.fill(circle(5, -108.4, 1.2), '#3a4a48');
  });
  F.part('glass', { bone: 'head', z: 32 }, (g) => {
    g.mat(path([[-9, -107], [-9, -128], [-3, -130.5], [-3, -104.5]]), GLASS, 'glass', { op: 0.3, line: '0' });
    g.mat(path([[-3, -104.5], [-3, -130.5], [13, -130.5], [13, -104.5]]), GLASS, 'glass', { op: 0.1, line: '0' });
    g.mat(path([[13, -104.5], [13, -130.5], [19, -128], [19, -107]]), GLASS, 'glass', { op: 0.36, line: '0' });
  });
  F.part('grille', { bone: 'head', z: 33 }, (g) => {
    for (const x of [-0.4, 10.4]) g.stroke(polyline([[x, -105], [x, -130]]), '#2a2420', 0.8);
    g.stroke(polyline([[-9, -118], [19, -118]]), '#2a2420', 0.9, { lod: 1 });
    for (const x of [-9, -3, 13, 19]) g.stroke(polyline([[x, x === -9 || x === 19 ? -107 : -104.5], [x, x === -9 || x === 19 ? -128 : -130.5]]), BRASS, 1.6);
    g.mat(path([[-11, -108], [21, -108], [19, -102.5], [-9, -102.5]]), BRASS, 'gold');
  });
  F.part('roof', { bone: 'head', z: 35, sig: true }, (g) => {
    g.mat(path([[-11, -129], [21, -129], [20, -132], [-10, -132]]), BRASS, 'gold');
    g.mat(path([[-12, -131.5], [22, -131.5], [10, -140.5], [0, -140.5]]), BRASS, 'gold');
    g.mat(rrect(-1, -142.5, 12, 3, 1), '#9a7a30', 'gold');
    g.stroke(circle(5, -145.6, 3), '#9a7a30', 1.5);
    g.lod(1, (h) => h.stroke(polyline([[0, -133], [5, -139]]), '#f0d890', 0.6));
  });

  // ───────── Fallbeil-Schwert (ruht mit der Spitze knapp über dem Boden) ─────────
  F.part('blade', { bone: 'prop', z: 42, zb: 8 }, (g) => {
    g.stroke(circle(35, -77.5, 4), BRASS, 2);
    g.mat(rrect(32.6, -74, 4.8, 24, 1.6), JOINT, 'leather');
    lines(g, [[[32.6, -70], [37.4, -68]], [[32.6, -64], [37.4, -62]], [[32.6, -58], [37.4, -56]]], '#4a3a30', 0.7, 1);
    g.mat(rrect(27.5, -51, 15, 4.4, 1.4), BRASS, 'gold');
    const blade = path([[29, -47, 1], [41.5, -47, 1], [44, -36], [42.6, -31], [45.4, -26], [49.5, -4, 1], [29, -14.5, 1]]);
    g.mat(blade, STEEL, 'metal');
    // geschliffene Schrägkante, Rückenlinie, Gravur
    g.clipTo(blade, (h) => {
      h.mat(path([[29, -14.5], [49.5, -4], [49, -9], [29, -19]]), '#d8dee6', 'metal', { line: '0' });
      h.stroke(polyline([[31.5, -46], [31.5, -18]]), '#7c848e', 0.9);
      h.lod(1, (k) => k.stroke(spline([[35, -42], [37, -34], [35, -26]]), '#8a929c', 0.6));
    });
  });
  F.part('sparks', { bone: 'prop', z: 43, state: 'sparks', glow: true }, (g) => {
    for (const [a, l] of [[200, 10], [230, 13], [260, 9], [300, 12], [330, 8]]) {
      const r = (a * Math.PI) / 180;
      g.stroke(polyline([[44 + Math.cos(r) * 3, -6 + Math.sin(r) * 3], [44 + Math.cos(r) * l, -6 + Math.sin(r) * l]]), '#ffd27a', 1.2);
    }
    g.fill(circle(44, -6, 3), '#fff2c0', { op: 0.9 });
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 44, zb: 4 }, (g) => {
    g.mat(limb(30, -94, 33, -76, 9.5, 9), JOINT, 'leather');
    g.mat(limb(33, -78, 35, -64, 11, 10.5), BRONZE, 'metal');
    rivets(g, [[33.6, -72], [34, -67]], 0.9, BRASS);
  });
  F.part('handF', { bone: 'handF', z: 45, zb: 5 }, (g) => {
    g.mat(path([[25, -72], [45, -72], [44, -65], [26, -65]]), BRONZE, 'metal');
    g.mat(path([[27, -66], [43, -66], [44, -56], [39, -50.5], [29, -51.5], [26, -58]]), BRONZE, 'metal');
    lines(g, [[[38, -64], [42, -63]], [[38.6, -59], [42.6, -58]], [[38.4, -54.4], [41.6, -54]]], '#241c1a', 0.8, 1);
  });
  F.part('pauldronF', { bone: 'armF', z: 46, zb: 6 }, (g) => {
    const [a, b, c] = pauldron(1, 29, -96, BRONZE);
    g.mat(a, c, 'metal');
    g.mat(b, c, 'metal', { line: BRASS, lw: 1.1 });
    rivets(g, [[24, -91], [34, -91]], 1, BRASS);
  });

  // ───────── Evolution: Seelenfresser ─────────
  F.part('evoChains', { bone: 'torso', z: 23, evo: 'evo' }, (g) => {
    for (const [x0, y0, x1, y1] of [[-22, -100], [20, -102]].map(([a, b]) => [a, b, a + 26 * Math.sign(-a), b + 34])) {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 4;
        g.stroke(i % 2 ? ellipse(x, y, 1.4, 3, 30) : ellipse(x, y, 3, 1.6, 30), '#7a7680', 1.2);
      }
    }
  });
  F.part('evoSeams', { bone: 'torso', z: 24, evo: 'evo', glow: true }, (g) => {
    g.stroke(spline([[-26, -64], [2, -60], [30, -64]]), FLAME, 1.4);
    g.stroke(spline([[-22, -55], [2, -51.6], [26, -55]]), FLAME, 1.4);
    g.stroke(polyline([[2, -104], [2, -66]]), FLAME, 1);
  });
  F.part('evoBladeSeam', { bone: 'prop', z: 42.5, evo: 'evo', glow: true }, (g) => {
    g.stroke(polyline([[31.5, -46], [31.5, -18]]), FLAME, 1.2);
    g.stroke(polyline([[30, -18], [48, -8.6]]), FLAME, 1);
  });
  F.part('evoInnerFlame', { bone: 'hat', z: 32.7, evo: 'evo', expr: ['idle', 'attack', 'ability', 'hurt', 'stun', 'sleep'] }, (g) => {
    g.fill(blob([[3, -110], [4, -114], [5, -117.5], [6, -114], [7, -110], [5, -109]], 0.5), '#7a5cff');
  });

  F.meta.hit = [44, -6];

  const flick = [[0, 1], [0.12, 1.12], [0.25, 0.94], [0.4, 1.08], [0.55, 0.95], [0.7, 1.1], [0.85, 0.96], [1, 1]];
  F.anim({
    // Flamme flackert, Kolben zischen leise, Klinge ruht
    idle: { p: { breathe: 0.012, bob: 0.5, sway: 1.2, tilt: 1 }, keys: { hat: { sy: flick, sx: flick.map(([u, v]) => [u, 2 - v]) }, show: { hiss: [[0.6, 0.8]] } } },
    // schwerer, ruckhafter Schritt
    walk: { p: { stride: 13, bob: 3.5, squash: 0.04, armSwing: 4, lean: 2 }, keys: { hat: { sy: flick, r: [[0, 0], [0.25, -6], [0.5, 0], [0.75, -6], [1, 0]] } }, ev: { step: [0.25, 0.75] } },
    charge: { prog: 'biped.walk', p: { stride: 16, bob: 4, lean: 6 } },
    // Klinge weit über den Kopf, Fallbeil-Hieb mit Funken, Flamme lodert
    attack: {
      prog: 'atk.swing',
      hit: 0.6,
      p: { wind: -195, strike: -28, over: 6, cock: -24, snap: 14, lean: 8, lunge: 12, step: 4, windO: 12, strikeO: -10 },
      keys: { hat: { sy: [[0, 1], [0.45, 1.25], [0.6, 1.4], [0.8, 1.1], [1, 1]] }, show: { sparks: [[0.6, 0.72]] }, layer: [[0.25, 0.62, 'blade', 47, 47]] },
    },
    // Flamme duckt sich, Glas klirrt
    hit: { keys: { hat: { sy: [[0, 1], [0.15, 0.55], [1, 1]], sx: [[0, 1], [0.15, 1.25], [1, 1]] }, head: { x: [[0, 0], [0.1, -1.5], [0.2, 1], [0.3, 0]] } } },
    // landet, Flamme entzündet sich
    spawn: { keys: { hat: { sx: [[0, 0.05], [0.55, 0.05], [0.7, 1.3], [1, 1]], sy: [[0, 0.05], [0.55, 0.05], [0.7, 1.4], [1, 1]] } } },
    // Flamme erlischt, Panzer fällt in Teile auseinander
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        head: { y: [[0, 0], [0.12, -10, 'out'], [0.5, 90, 'in'], [0.58, 84, 'out'], [0.66, 90, 'in']], x: [[0, 0], [0.5, -34]], r: [[0, 0], [0.5, -95]] },
        armF: { x: [[0, 0], [0.45, 14]], y: [[0, 0], [0.45, 46, 'in']], r: [[0, 0], [0.45, -70]] },
        armB: { x: [[0, 0], [0.45, -12]], y: [[0, 0], [0.45, 50, 'in']], r: [[0, 0], [0.45, 55]] },
        torso: { y: [[0, 0], [0.2, 0], [0.55, 30, 'in']], r: [[0, 0], [0.55, -10]] },
        legF: { r: [[0, 0], [0.55, -22]] },
        legB: { r: [[0, 0], [0.55, 20]] },
        alpha: [[0, 1], [0.7, 1], [1, 0, 'io']],
      },
      ev: { fall: 0.45, vanish: 1 },
    },
  });
}
