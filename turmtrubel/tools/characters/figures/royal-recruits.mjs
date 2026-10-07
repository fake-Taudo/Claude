// Königsrekruten – junge Freiwillige mit viel zu großen Schüsselhelmen, Rundschild und Pike (Brief: docs/briefs/royal-recruits.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, ring } from '../geo.mjs';
import { faceSet, rivets, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function royalRecruits(F) {
  const P = F.pal;
  const SAGE = P.main;
  const WOOD = P.acc;
  const BRASS = '#c8a046';
  const LINEN = '#e6dcc4';
  const SKIN = '#f3c29c';
  const CLOG = '#a8784a';
  const IRON = '#8d97a3';
  const PAD = '#efe2c0';

  F.rig('biped', {
    hip: [0, -24],
    torso: [0, -26],
    head: [2, -45],
    hat: [3, -62],
    armB: [-11, -41],
    handB: [-14, -29],
    propB: [-14, -29],
    armF: [11, -41],
    handF: [15, -30],
    legB: [-5, -24],
    footB: [-6, -6],
    legF: [5, -24],
    footF: [6, -6],
    back: [-12, -32],
  });

  // ───────── Pike (hinter dem Körper, steht senkrecht hoch über den Kopf) ─────────
  F.part('pike', { bone: 'propB', z: 3, zb: 46 }, (g) => {
    g.mat(rrect(-15.4, -104, 2.8, 100, 1.2), '#9a6a3a', 'wood');
    g.stroke(polyline([[-14.6, -100], [-14.6, -8]]), '#c09060', 0.5, { lod: 2 });
    // blattförmige Eisenspitze
    g.mat(path([[-14, -117, 1], [-10.6, -109], [-12.4, -103.5], [-15.6, -103.5], [-17.4, -109]]), IRON, 'metal');
    g.stroke(polyline([[-14, -115.4], [-14, -104.5]]), '#5d6672', 0.6, { lod: 1 });
    g.mat(rrect(-16.2, -104.6, 4.4, 2.6, 0.8), '#5d6672', 'metal');
    // Wimpelknoten
    g.mat(path([[-14, -101], [-21, -99], [-23, -95.6, 1], [-19, -96.6], [-14, -97.6]]), LINEN, 'cloth', { lod: 1 });
    g.mat(circle(-14, -99.6, 1.6), '#c84a3a', 'cloth');
  });
  F.part('bag', { bone: 'back', z: 4, zb: 40 }, (g) => {
    g.mat(rrect(-19, -33, 9, 10, 3), '#c8b48a', 'cloth');
    g.mat(path([[-19, -33], [-10, -33], [-10.6, -29], [-18.4, -29]]), '#b09a6e', 'cloth', { lod: 1 });
  });

  // ───────── Beine: Wickelgamaschen und Holzschuhe ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      const L = limb(x, -25, x * 1.1, -7, 5.6, 5);
      g.mat(L, LINEN, 'cloth');
      g.clipTo(L, (h) => {
        for (let y = -22; y < -6; y += 3.2) h.stroke(polyline([[x - 4, y + 1.6], [x + 4, y - 0.4]]), '#b9ad92', 0.6, { lod: 1 });
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 4.8, -8.5], [fx + 4, -8.5], [fx + 9.5, -4.2], [fx + 10, -0.6, 1], [fx - 5.6, 0, 1], [fx - 6, -4]]), CLOG, 'wood', { hi: 0.4 });
      g.stroke(spline([[fx - 4.6, -4.6], [fx + 2, -5.2], [fx + 8.4, -3.4]]), '#7a5432', 0.6, { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm (hält die Pike) ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 44 }, (g) => {
    g.mat(limb(-11, -41, -14, -31, 4.8, 4.2), SAGE, 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 11, zb: 47 }, (g) => {
    g.mat(circle(-14, -29.6, 3.1), SKIN, 'skin');
  });

  // ───────── Rumpf: Gambeson mit Rautensteppung ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 22 }, (g) => {
    const t = path([[-11, -45], [-4, -46.5], [6, -46.5], [11.5, -45], [13.5, -34], [13, -21, 1], [-12.5, -21, 1], [-13.5, -34]]);
    g.mat(t, SAGE, 'cloth');
    g.clipTo(t, (h) => {
      for (let k = -30; k < 30; k += 5) {
        h.stroke(polyline([[k, -47], [k + 26, -19]]), '#7f9378', 0.55, { lod: 1 });
        h.stroke(polyline([[k, -47], [k - 26, -19]]), '#7f9378', 0.55, { lod: 1 });
      }
    });
    g.mat(rrect(-13.4, -28.8, 26.8, 3.8, 1.4), '#6b4a2a', 'leather');
    g.mat(rrect(2, -29.4, 4.4, 5, 0.8), BRASS, 'gold', { lod: 1 });
    g.stroke(polyline([[-9, -45], [8, -27]]), '#8a6a42', 1.2, { lod: 1 });
  });
  F.part('neckerchief', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    g.mat(path([[-8, -47], [12, -47], [9, -43], [3.6, -38.4, 1], [-1.4, -43.4]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(circle(3.4, -45, 1.8), P.teamShade, 'cloth', { lod: 1 });
  });

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 30, zb: 32 }, (g) => {
    g.mat(path([[-8, -60], [2, -66], [12.5, -63], [15, -54], [12, -46], [4, -43], [-4.5, -45], [-9, -51]]), SKIN, 'skin');
    g.mat(ellipse(-7.6, -53.6, 2.4, 3.2), SKIN, 'skin', { lod: 1 });
  });
  const face = faceSet(F, {
    eyes: [[9.2, -55.2, 2.7], [0.6, -55.2, 2.4]],
    iris: '#4a6a8a',
    lidColor: SKIN,
    look: [0.4, 0.1],
    lid: 0,
    mouth: [6.4, -48.6, 4.2],
    brow: false,
    replace: {
      idle: (g, c) => {
        // großäugig, Mund leicht offen
        for (const [x, y, r] of [c.E1, c.E2]) g.fill(circle(x, y, r), WHITE, { stroke: INK, lw: r * 0.26 });
        g.fill(circle(9.9, -54.8, 1.6), '#4a6a8a');
        g.fill(circle(1.3, -54.8, 1.4), '#4a6a8a');
        g.fill(circle(9.9, -54.8, 0.9), '#14101c');
        g.fill(circle(1.3, -54.8, 0.8), '#14101c');
        g.fill(circle(9.3, -55.6, 0.55), '#ffffff', { lod: 0 });
        g.fill(circle(0.8, -55.6, 0.5), '#ffffff', { lod: 0 });
        g.fill(ellipse(6.4, -48.4, 1.6, 1.4), '#4a1c24', { stroke: INK, lw: 0.6 });
      },
    },
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front', lod: 1 }, (g) => {
    g.fill(ellipse(12.4, -50.6, 2.2, 1.3), '#f08a7a', { op: 0.45 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(6, -51.8, 1.7, 1.5), '#eaa886', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  // Schwarm-Varianten: Sommersprossen, Zahnlücke, Brille
  F.part('freckles', { bone: 'head', z: 33.5, view: 'front', variant: 0, lod: 1 }, (g) => {
    for (const [x, y] of [[10.6, -51], [12, -52], [13, -50.6], [2, -51], [0.8, -50.4], [3, -50]]) g.fill(circle(x, y, 0.45), '#c8784a');
  });
  F.part('toothGap', { bone: 'head', z: 33.5, view: 'front', variant: 1, expr: ['idle', 'sleep'] }, (g) => {
    g.fill(rrect(4.6, -48.4, 3.6, 2.4, 0.6), '#4a1c24', { stroke: INK, lw: 0.5 });
    g.fill(rrect(4.9, -48.4, 1.2, 1.2, 0.2), WHITE);
    g.fill(rrect(7, -48.4, 1, 1.2, 0.2), WHITE);
  });
  F.part('glasses', { bone: 'head', z: 34, view: 'front', variant: 2 }, (g) => {
    g.stroke(circle(9.2, -55.2, 3.6), '#5a4a3a', 0.9);
    g.stroke(circle(0.6, -55.2, 3.2), '#5a4a3a', 0.9);
    g.stroke(polyline([[3.8, -55.6], [5.6, -55.6]]), '#5a4a3a', 0.8);
    g.fill(ellipse(8.2, -56.4, 1.2, 0.6, -30), '#ffffff', { op: 0.6, lod: 1 });
  });
  F.part('headBack', { bone: 'head', z: 33, zb: 33, view: 'back' }, (g) => {
    g.mat(path([[-9.4, -60], [14.6, -60], [14, -52.4], [8, -50.6], [3, -52], [-2, -50.4], [-8.6, -52.6]]), '#8a5a32', 'hair');
    g.stroke(spline([[-1, -46], [3, -45], [7, -46]]), '#c8906a', 0.6, { lod: 1 });
  });

  // ───────── Schüsselhelm (Signature): doppelt so breit wie der Kopf, innen gepolstert ─────────
  F.part('helmet', { bone: 'hat', z: 36, zb: 36, sig: true }, (g) => {
    g.mat(path([[-19, -60.6, 1], [-16, -69], [-7, -76.5], [5, -78.5], [16, -75], [24, -68], [26, -60.6, 1]]), BRASS, 'gold');
    g.mat(ellipse(3.5, -60.6, 23.4, 3.6), '#b08a34', 'gold');
    g.lod(1, (h) => {
      h.stroke(spline([[-12, -64], [-6, -71], [3, -74]]), '#f0d890', 0.9);
      // Dellen
      h.fill(ellipse(15, -67, 2.2, 1.4, -20), '#9a7a2a', { op: 0.6 });
      h.fill(ellipse(-9, -64.6, 1.6, 1, 20), '#9a7a2a', { op: 0.6 });
    });
  });
  F.part('padding', { bone: 'hat', z: 35.5, view: 'front' }, (g) => {
    g.mat(path([[-14, -60], [21, -60], [17, -57.4], [3.5, -56.6], [-10, -57.4]]), PAD, 'cloth', { line: '#b8a47a', lw: 0.5 });
    stitches(g, [[-11, -58.4], [18, -58.4]], '#b8a47a', { step: 2.4, len: 0.8, lod: 2 });
  });
  F.part('strap', { bone: 'head', z: 34.5, view: 'front', lod: 1 }, (g) => {
    g.stroke(spline([[-7, -58], [-6.6, -50], [-2, -44.6], [5, -43.6]]), '#6b4a2a', 0.8);
  });

  // ───────── Vorderer Arm mit Rundschild ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 8 }, (g) => {
    g.mat(limb(11, -41, 15, -32, 4.8, 4.2), SAGE, 'cloth');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(circle(15.6, -30.4, 3.1), SKIN, 'skin');
  });
  F.part('shield', { bone: 'handF', z: 42, zb: 5, team: true }, (g) => {
    g.mat(circle(20, -30, 12), WOOD, 'wood');
    g.mat(circle(20, -30, 9.6), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        h.fill(circle(20 + Math.cos(a) * 10.8, -30 + Math.sin(a) * 10.8, 0.6), '#c8a046');
      }
      h.stroke(polyline([[11.6, -34], [13.6, -32.6]]), '#4a3018', 0.6);
      h.stroke(polyline([[27, -23], [28.6, -24.6]]), '#4a3018', 0.6);
    });
    g.mat(circle(20, -27.4, 3.6), BRASS, 'gold');
  });
  emblem(F, 'emblem', 'handF', 43, 20, -35.4, 2.4, { zb: 4 });

  // ───────── Evolution (Sturm): Helmkamm, Wangenklappen, Eisenring am Schild, Sturmstreifen ─────────
  F.part('evoCrest', { bone: 'hat', z: 37, zb: 37, evo: 'evo' }, (g) => {
    g.mat(path([[-6, -74], [0, -84, 1], [8, -86, 1], [16, -80, 1], [14, -74]]), '#9aa3ad', 'metal');
    lines(g, [[[0, -78], [3, -82]], [[6, -78], [9, -83]], [[11, -77], [14, -80]]], '#5d6672', 0.6, 1);
  });
  F.part('evoCheek', { bone: 'head', z: 36.5, evo: 'evo', view: 'front' }, (g) => {
    g.mat(path([[-6, -59], [-2, -59], [-1, -50], [-4.6, -47.4]]), '#9aa3ad', 'metal');
    g.mat(path([[13.6, -59], [17, -59], [15.6, -50], [12.6, -49]]), '#9aa3ad', 'metal');
  });
  F.part('evoRing', { bone: 'handF', z: 42.5, zb: 5.5, evo: 'evo' }, (g) => {
    g.stroke(circle(20, -30, 11.6), '#6a7480', 1.6);
    rivets(g, [[20, -41.4], [31.4, -30], [20, -18.6], [8.6, -30]], 0.9, '#c8ccd2');
  });
  F.part('evoStorm', { bone: 'torso', z: 24, evo: 'evo', glow: true }, (g) => {
    g.stroke(polyline([[-10, -40], [-6, -36], [-9, -33], [-5, -29]]), '#7ad8ff', 0.9, { op: 0.8 });
    g.stroke(polyline([[10, -42], [7, -38], [10, -35]]), '#7ad8ff', 0.9, { op: 0.8 });
  });

  F.anim({
    // schieben den Helm hoch, er rutscht wieder herunter; treten von einem Fuß auf den anderen
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 2, armF: -6 },
      keys: { hat: { y: [[0, 0], [0.3, 1.8], [0.45, 2.6], [0.55, -1.6], [0.65, -1], [1, 0]] }, legF: { r: [[0, 0], [0.2, -6], [0.3, 0], [0.7, 0], [0.8, 5], [0.9, 0]] }, root: { r: [[0, 0], [0.25, 1.5], [0.5, 0], [0.75, -1.5], [1, 0]] } },
    },
    // ungelenker Marsch, Helm wackelt, Pike schwankt
    walk: { p: { stride: 22, bob: 2.6, armSwing: 4, lean: 2, armF: -6 }, keys: { hat: { r: [[0, -5], [0.25, 4], [0.5, -5], [0.75, 4], [1, -5]], y: [[0, 0], [0.25, -1.2], [0.5, 0], [0.75, -1.2], [1, 0]] }, propB: { r: [[0, -4], [0.5, 4], [1, -4]] } }, ev: { step: [0.25, 0.75] } },
    // Pike zurück, Stoß über den Schildrand, Helm klappert nach
    attack: {
      prog: 'atk.thrust',
      hit: 0.55,
      p: { arm: 'B', wind: 10, strike: -45, over: -4, cock: 80, snap: 135, pull: 6, reach: 11, lean: 6, lunge: 10, step: 4, windO: -10, strikeO: -18 },
      keys: { hat: { r: [[0, 0], [0.6, -8], [0.7, 6], [0.8, -3], [1, 0]] }, layer: [[0.08, 0.95, 'pike', 44, 44], [0.08, 0.95, 'armB', 45, 45], [0.08, 0.95, 'handB', 46, 46]] },
    },
    // Helm rutscht ganz über die Augen
    hit: { p: { knock: 2, recoil: 6 }, keys: { hat: { y: [[0, 0], [0.2, 5], [1, 0]] } } },
    spawn: { keys: { hat: { y: [[0, 0], [0.5, 0], [0.62, -8, 'out'], [0.8, 1], [1, 0]] } } },
    // fallen um, der Helm dreht sich wie ein Kreisel und verblasst
    death: { p: { dir: -1, angle: 80 }, keys: { hat: { x: [[0, 0], [0.4, 0], [1, 14, 'out']], r: [[0, 0], [0.4, 0], [1, 540, 'out']] } } },
  });
}
