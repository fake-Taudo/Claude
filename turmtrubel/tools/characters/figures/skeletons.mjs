// Skelette – klapprig-fröhliche Winzlinge mit riesigem, rissigem Schädel und cyan leuchtenden Augenhöhlen
// (Brief: docs/briefs/skeletons.md). skeleton() zeichnet Schädel und Knochenkörper auch für Wächter, General Gerry,
// Schattenskelett und Skelett-Fallschirmjäger.
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { eyeX, eyeSpiral, lines, emblem, INK, WHITE } from '../kit.mjs';

const BASE = {
  hip: [0, -20],
  torso: [0, -22],
  head: [3, -32],
  jaw: [1, -33],
  hat: [3, -52],
  back: [-3, -28],
  armB: [-4, -30],
  handB: [-6, -20],
  armF: [5, -30],
  handF: [9, -20],
  prop: [9, -20],
  legB: [-3, -20],
  footB: [-3, -3],
  legF: [3, -20],
  footF: [4, -3],
  cape: [0, -30],
};

/** Knochenpunkte des Skeletts, skaliert um s (Fußpunkt bleibt) und um (dx, dy) verschoben. */
export function skeletonPivots(s = 1, extra = {}) {
  const out = {};
  for (const [k, [x, y]] of Object.entries({ ...BASE, ...extra })) out[k] = [x * s, y * s];
  return out;
}

/**
 * Schädel mit Ausdrücken und Knochenkörper. o: s (Maßstab), bone ('#efe6d0'), shadow (Knochenschatten), eye (Glutfarbe),
 * legs (false: kein Unterkörper, z. B. Rauchschweif), crack ('variant' | 'left' | 'right' | false), chipped (Variante
 * mit abgebrochenem Zahn oder true), form, skipArms, socket (Farbe der Augenhöhlen)
 */
export function skeleton(F, o = {}) {
  const s = o.s || 1;
  const B = o.bone || '#efe6d0';
  const SH = o.shadow || '#c8bca0';
  const EYE = o.eye || '#5ee6ff';
  const SOCK = o.socket || '#2a2430';
  const X = (v) => v * s;
  const pt = (p) => [X(p[0]), X(p[1]), ...(p[2] ? [1] : [])];
  const P = (pts) => pts.map(pt);
  const form = o.form;
  const part = (name, opt, fn) => F.part(name, form ? { ...opt, form } : opt, fn);

  // ───────── Knochenkörper ─────────
  if (o.legs !== false) {
    const leg = (name, foot, x, z) => {
      part(name, { bone: name, z }, (g) => {
        g.mat(limb(X(x), X(-20), X(x * 1.05), X(-5), X(1.5), X(1.3)), B, 'bone');
        g.mat(circle(X(x * 1.02), X(-12.6), X(2)), B, 'bone');
      });
      part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(path(P([[x - 2, -5], [x + 2, -5.4], [x + 6, -1.6], [x + 6, 0, 1], [x - 2.6, 0, 1]])), B, 'bone', { hi: 0.5 }));
    };
    leg('legB', 'footB', -3, 6);
    leg('legF', 'footF', 3, 8);
    part('pelvis', { bone: 'hip', z: 12, zb: 12 }, (g) => g.mat(path(P([[-5, -22], [5, -22], [6, -18], [2, -16, 1], [-2, -16, 1], [-6, -18]])), B, 'bone', { hi: 0.4 }));
  }
  if (!o.skipArms) {
    part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(X(-4), X(-30), X(-6), X(-21), X(1.3), X(1.2)), SH, 'bone'));
    part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(X(-6), X(-19.6), X(2)), SH, 'bone'));
  }
  part('ribs', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(limb(X(0), X(-33), X(0), X(-18), X(1.5), X(1.5)), SH, 'bone');
    for (const [y, w] of [[-30, 6.6], [-26.6, 6], [-23.4, 5]]) {
      g.mat(path(P([[-1, y - 1], [w * 0.6, y - 1.6], [w, y + 0.6], [w * 0.6, y + 1.2], [-1, y + 0.8]])), B, 'bone');
      g.mat(path(P([[-1, y - 1], [-w * 0.55, y - 1.2], [-w * 0.8, y + 0.6], [-w * 0.5, y + 1], [-1, y + 0.8]])), SH, 'bone');
    }
  });

  // ───────── Schädel ─────────
  part('skull', { bone: 'head', z: 30, zb: 30, sig: true }, (g) => {
    g.mat(blob(P([[-8, -43], [-6, -51], [2, -54.6], [10, -52.6], [14.4, -46], [14, -39], [11, -35], [2, -34], [-6, -36]]), 0.7), B, 'bone', { hi: 0.6 });
    g.fill(blob(P([[-7, -42], [-5, -49], [-1, -51], [-3, -44], [-2, -38], [-6, -38]]), 0.6), SH, { op: 0.7 });
  });
  part('sockets', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(X(10), X(-42.4), X(3), X(3.4), -8), SOCK);
    g.fill(ellipse(X(3.6), X(-42.4), X(2.6), X(3.2), 8), SOCK);
    g.fill(path(P([[7.6, -38.6], [9, -36.6], [10.2, -38.6], [8.9, -37.8]])), SOCK);
  });
  const crack = (side) => (g) => {
    const pts = side === 'left' ? [[-2, -53.6], [-1, -49], [-3.6, -46], [-2, -42]] : [[11, -52.6], [9.6, -49], [12, -47], [10.6, -45]];
    g.stroke(polyline(P(pts)), '#8a8070', X(0.7));
  };
  if (o.crack === 'variant') {
    part('crack.left', { bone: 'head', z: 31.2, variant: 0 }, crack('left'));
    part('crack.right', { bone: 'head', z: 31.2, variant: 1, view: 'front' }, crack('right'));
  } else if (o.crack) part('crack', { bone: 'head', z: 31.2 }, crack(o.crack));
  part('skullBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.lod(1, (h) => h.stroke(spline(P([[-2, -36], [3, -38], [8, -36]])), SH, X(0.6)));
  });
  // Kiefer mit Zahnreihe (eigener Knochen zum Klappern)
  part('jaw', { bone: 'jaw', z: 30.5, zb: 30.5 }, (g) => {
    g.mat(path(P([[0, -35.6], [13.4, -36.6], [13, -31.6], [10, -29.4], [3, -29.4], [-0.6, -32]])), B, 'bone', { hi: 0.4 });
  });
  part('teeth', { bone: 'jaw', z: 31.5, view: 'front' }, (g) => {
    g.stroke(polyline(P([[4, -34], [13, -34.6]])), SOCK, X(0.6));
    for (let x = 5; x < 13; x += 2) g.stroke(polyline(P([[x, -35.6], [x, -32.6]])), '#a89c84', X(0.45));
  });
  if (o.chipped) {
    const opt = o.chipped === 'variant' ? { variant: 2 } : {};
    part('chip', { bone: 'jaw', z: 31.6, view: 'front', ...opt }, (g) => g.fill(rrect(X(8.8), X(-35.4), X(1.8), X(1.8), 0), SOCK));
  }
  // Augenglut je Ausdruck
  const glow = (g, x, y, r, k = 1) => {
    g.fill(ellipse(X(x), X(y + 0.4), X(r), X(r * 1.3 * k)), EYE, { op: 0.5 });
    g.fill(ellipse(X(x), X(y + 0.4), X(r * 0.55), X(r * 0.75 * k)), '#f4ffff');
  };
  part('eyes.idle', { bone: 'head', z: 32, view: 'front', expr: 'idle', glow: true }, (g) => {
    glow(g, 10.2, -42.4, 1.9);
    glow(g, 3.8, -42.4, 1.6);
  });
  part('eyes.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    g.fill(path(P([[7.6, -44.4], [12.4, -42], [8, -41]])), EYE);
    g.fill(path(P([[1.8, -42], [5.6, -44.2], [5.4, -41.2]])), EYE);
  });
  part('eyes.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    glow(g, 10.2, -42.4, 0.9, 0.7);
    glow(g, 3.8, -42.4, 2, 1.1);
  });
  part('eyes.sleep', { bone: 'head', z: 32, view: 'front', expr: 'sleep' }, (g) => {
    g.stroke(polyline(P([[8.4, -42], [12, -42]])), EYE, X(0.8));
    g.stroke(polyline(P([[2.2, -42], [5.4, -42]])), EYE, X(0.8));
  });
  part('eyes.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, X(10), X(-42.4), X(1.8), '#6a6070', X(0.8));
    eyeX(g, X(3.6), X(-42.4), X(1.6), '#6a6070', X(0.8));
  });
  return { X, P, s, B, SH, EYE };
}

export default function skeletons(F) {
  const P = F.pal;
  const BONE = P.main;
  const CYAN = P.acc;
  F.rig('biped', skeletonPivots(1), { jaw: 'head' });
  const k = skeleton(F, { bone: BONE, eye: CYAN, crack: 'variant', chipped: 'variant' });

  // Halstuch (Teamzone)
  F.part('scarf', { bone: 'torso', z: 24, zb: 24, team: true }, (g) => {
    g.mat(path([[-4, -33.6], [10, -33], [7, -29], [3, -26, 1], [0, -30], [-4, -31]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[-3, -32], [-7, -28, 1], [-5, -31.6]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  // Knochendolch aus einer Rippe
  F.part('dagger', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[8, -21.6], [18, -24.6], [23, -24, 1], [18, -22.4], [9, -19]]), '#d8cfb8', 'bone', { hi: 0.5 });
    g.mat(rrect(6.6, -22.6, 3, 4, 1), '#8a7a5a', 'leather');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(5, -30, 9, -21, 1.3, 1.2), BONE, 'bone'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(9, -20, 2.2), BONE, 'bone'));
  emblem(F, 'emblem', 'torso', 25, -3, -24, 1.8, { zb: 25 });

  // ───────── Evolution (Klon-Evo): Leuchtnähte, Knochenkrönchen, Schulterpanzer ─────────
  F.part('evoSeams', { bone: 'torso', z: 25.5, evo: 'evo', glow: true }, (g) => {
    for (const [x, y] of [[0, -32], [0, -19], [5, -30], [-4, -30]]) g.fill(circle(x, y, 1.3), CYAN, { op: 0.85 });
  });
  F.part('evoCrown', { bone: 'head', z: 33.5, zb: 33.5, evo: 'evo' }, (g) => {
    g.mat(path([[-2, -52], [-1, -57, 1], [1.6, -54], [4, -59, 1], [6.4, -54], [9, -57.6, 1], [10, -51.6]]), '#e8dfc8', 'bone', { hi: 0.6 });
    g.fill(circle(4, -55, 1), CYAN);
  });
  F.part('evoPauldron', { bone: 'armF', z: 34.5, zb: 6.5, evo: 'evo' }, (g) => {
    g.mat(blob([[1, -33], [7, -34], [10, -30], [6, -27.4], [1, -29]], 0.6), '#e8dfc8', 'bone', { hi: 0.6 });
    g.lod(1, (h) => h.stroke(spline([[2, -31], [6, -32], [8.6, -30]]), CYAN, 0.5));
  });

  F.anim({
    // Kiefer klappert, Kopf wackelt
    idle: { p: { breathe: 0.02, bob: 0.8, sway: 4, tilt: 5 }, keys: { jaw: { r: [[0, 0], [0.1, 10], [0.2, 0], [0.3, 10], [0.4, 0], [1, 0]] } } },
    // schnelles Klappern, Kopf wippt
    walk: { prog: 'biped.run', p: { stride: 34, bob: 2.4, armSwing: 26, lean: 6 }, keys: { jaw: { r: [[0, 0], [0.25, 8], [0.5, 0], [0.75, 8], [1, 0]] } } },
    // Stich mit dem Knochendolch
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 30, strike: -80, pull: 3, reach: 4, lean: 8, lunge: 12 }, keys: { jaw: { r: [[0, 0], [0.45, 14], [0.6, 0]] } }, ev: { release: 0.5 } },
    // Kopf dreht sich einmal herum
    hit: { p: { knock: 2.4, recoil: 6 }, keys: { head: { sx: [[0, 1], [0.3, -1], [0.6, 1]] } } },
    // klettern aus dem Boden
    spawn: { prog: 'still', keys: { root: { sy: [[0, 0.15], [0.7, 1, 'back']], sx: [[0, 1.3], [0.7, 1]] }, armF: { r: [[0, -150], [0.6, -150], [0.9, 0]] }, armB: { r: [[0, -150], [0.6, -150], [0.9, 0]] }, alpha: [[0, 0], [0.3, 1]] } },
    // fallen in einen Knochenhaufen
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        head: { y: [[0, 0], [0.45, 14, 'in']], x: [[0, 0], [0.45, -4]], r: [[0, 0], [0.45, -30]] },
        jaw: { y: [[0, 0], [0.45, 16, 'in']], r: [[0, 0], [0.45, 40]] },
        torso: { y: [[0, 0], [0.4, 10, 'in']], r: [[0, 0], [0.4, 20]] },
        armF: { r: [[0, 0], [0.4, 70]], y: [[0, 0], [0.4, 10]] },
        armB: { r: [[0, 0], [0.4, -70]], y: [[0, 0], [0.4, 10]] },
        legF: { r: [[0, 0], [0.4, -60]] },
        legB: { r: [[0, 0], [0.4, 60]] },
        prop: { r: [[0, 0], [0.4, 90]] },
        alpha: [[0, 1], [0.7, 1], [1, 0]],
      },
    },
  });
}
