// Barbaren – brüllende Meute mit Wolfskopf-Kapuzen, Hackschwertern und lederumwickelten Keulenarmen
// (Brief: docs/briefs/barbarians.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, furEdge, rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function barbarians(F) {
  const P = F.pal;
  const FUR = P.main;
  const LEATHER = P.acc;
  const SKIN = '#e2a878';
  const BEARD = '#b5632a';
  const STEEL = '#9aa3ad';
  const WOOL = '#5a4a3e';
  const FUR_D = '#6a5c4e';
  const BONE = '#efe4cc';

  F.rig('biped', {
    hip: [0, -26],
    torso: [0, -29],
    head: [3, -55],
    hat: [3, -84],
    armB: [-15, -51],
    handB: [-19, -33],
    armF: [15, -51],
    handF: [21, -34],
    prop: [21, -34],
    legB: [-7, -26],
    footB: [-8, -7],
    legF: [7, -26],
    footF: [8, -7],
    cape: [-2, -56],
  });

  // ───────── Beine: Wollhose, Fellstiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -28, x * 1.15, -9, 7.4, 6.4), WOOL, 'cloth');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 6.5, -13], [fx + 5.5, -13], [fx + 7, -6], [fx + 11.5, -3.4], [fx + 11.6, 0, 1], [fx - 7.4, 0, 1], [fx - 7.6, -6]]), '#7a5a3e', 'leather');
      const cuff = [[fx - 7.6, -10.5], [fx - 2, -12], [fx + 6.4, -10.5]];
      g.mat(path([[fx - 8.2, -15.6], [fx + 7, -15.6], [fx + 7.6, -10], [fx - 8.4, -10]]), '#9a8a78', 'fur');
      furEdge(g, cuff, 2.4, '#9a8a78', { side: -1, step: 2.2, seed: x > 0 ? 3 : 5, lod: 1 });
    });
  };
  leg('legB', 'footB', -7, 6);
  leg('legF', 'footF', 7, 8);

  // ───────── Arme: dicke, lederumwickelte Unterarme (Keulen) ─────────
  const arm = (name, hand, s, x0, z, zb, back) => {
    const sk = back ? '#cf966a' : SKIN;
    const lt = back ? '#9a6430' : LEATHER;
    const X = (x) => x0 + x * s;
    F.part(name, { bone: name, z, zb }, (g) => {
      g.mat(limb(X(0), -52, X(3.6), -42, 7.2, 6.6), sk, 'skin');
      const fore = limb(X(3.6), -43.5, X(5.4), -36, 8.4, 10.4);
      g.mat(fore, lt, 'leather');
      g.clipTo(fore, (h) => {
        for (let y = -44; y < -34; y += 2.6) {
          h.stroke(polyline([[X(-2), y], [X(12), y + 3.4]]), '#7a4a1e', 0.7, { lod: 1 });
          h.stroke(polyline([[X(-2), y + 3.4], [X(12), y]]), '#7a4a1e', 0.5, { lod: 2 });
        }
      });
    });
    F.part(name + 'Wrap', { bone: name, z: z + 0.3, zb: zb + 0.3, team: true }, (g) => {
      g.mat(rrect(X(5.4) - 6, -42.6, 12, 3.4, 1.2).rot(s * 10, X(5.4), -41), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
    });
    F.part(hand, { bone: hand, z: z + 1, zb: zb + 1 }, (g) => {
      g.mat(path([[X(-0.5), -37], [X(6), -37.5], [X(10), -33], [X(8.6), -27.4], [X(1.4), -27], [X(-1.6), -31.4]]), sk, 'skin');
      lines(g, [[[X(4.4), -32], [X(8), -32]], [[X(4.4), -29.6], [X(7.6), -29.6]]], '#a86a48', 0.6, 1);
    });
  };
  arm('armB', 'handB', -1, -15, 10, 44, true);

  // ───────── Rumpf: nackte Brust, offene Fellweste, Schärpe, Lendenschurz ─────────
  F.part('loin', { bone: 'hip', z: 17, zb: 17 }, (g) => {
    g.mat(path([[-13, -30], [13, -30], [10.5, -16], [3, -13.5], [-5, -16.6], [-11, -18]]), LEATHER, 'leather');
    lines(g, [[[-6, -28], [-5, -18]], [[4, -28], [4, -16]]], '#7a4a1e', 0.6, 1);
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const chest = path([[-15, -57], [15, -57], [17.5, -41], [14, -28.5], [-14, -28.5], [-17.5, -41]]);
    g.mat(chest, SKIN, 'skin');
    lines(g, [[[-8, -48], [-2, -45.6], [2, -48]], [[4, -48], [9, -45.4], [13, -48]], [[2, -42], [2.4, -32]]], '#b8784e', 0.7, 1);
  });
  F.part('vest', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    const L = path([[-17, -57], [-6, -57], [-8, -44], [-6.6, -29], [-15, -29], [-18.6, -42]]);
    const R = path([[9, -57], [17, -57], [18.6, -42], [15, -29], [10, -29], [11, -44]]);
    for (const sh of [L, R]) g.mat(sh, FUR, 'fur', { hi: 0.2 });
    g.lod(1, (h) => {
      lines(h, [[[-15, -52], [-13, -47]], [[-12, -40], [-10, -35]], [[13, -52], [15, -46]], [[12, -38], [14, -33]]], FUR_D, 0.7, 1);
    });
  });
  F.part('vestBack', { bone: 'torso', z: 22, zb: 22, view: 'back' }, (g) => {
    g.mat(path([[-17, -57], [17, -57], [18.6, -42], [15, -29], [-15, -29], [-18.6, -42]]), FUR, 'fur', { hi: 0.2 });
    lines(g, [[[-9, -50], [-7, -44]], [[0, -48], [1, -41]], [[8, -51], [10, -44]], [[-4, -38], [-2, -32]]], FUR_D, 0.7, 1);
  });
  F.part('teeth', { bone: 'torso', z: 22.5, view: 'front', lod: 1 }, (g) => {
    g.stroke(spline([[-6, -56], [1, -49], [9, -56]]), '#5a3a20', 0.7);
    for (const [x, y] of [[-3.4, -52.4], [1, -49.6], [5.4, -52]]) g.fill(path([[x - 1, y], [x + 1, y], [x, y + 3.4, 1]]), BONE, { stroke: INK, lw: 0.4 });
  });
  F.part('sash', { bone: 'hip', z: 23, zb: 23, team: true }, (g) => {
    g.mat(rrect(-15.4, -33, 30.8, 5.4, 2), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-12, -28.6], [-8, -28.6], [-9, -20], [-12.6, -21]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.6 });
    g.stroke(circle(3, -30.4, 2.4), '#5d6672', 1.3);
  });
  F.part('collar', { bone: 'cape', z: 26, zb: 26 }, (g) => {
    const c = path([[-19, -57], [-11, -61], [0, -62.6], [12, -61], [19, -57], [19, -51], [15, -49], [11, -52], [7, -48.6], [3, -51.6], [-2, -48], [-6, -51.4], [-11, -48.4], [-15, -51], [-19.6, -50]]);
    g.mat(c, FUR, 'fur', { hi: 0.25 });
    lines(g, [[[-14, -56], [-12, -52]], [[-6, -58], [-5, -53]], [[5, -58], [6, -53]], [[13, -56], [14, -52]]], FUR_D, 0.6, 1);
  });

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -70], [6, -72], [16, -69], [18, -60], [15.4, -51], [8, -47.4], [0, -48.6], [-5.6, -54]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[12, -62.6, 2.6], [3.6, -62.6, 2.3]],
    iris: '#5a3a1e',
    lidColor: SKIN,
    look: [0.6, 0.1],
    lid: 0.1,
    brow: { color: '#6a3a1a', w: 1.9, lift: 0.6 },
    mouth: [9, -52.2, 6.4],
    mood: 'grin',
    attackMouth: 'shout',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[7, -61], [10.6, -61.6], [12.8, -57], [11.6, -55], [7.4, -55], [6, -57]]), '#e09a6a', 'skin', { line: '#a8684a', lw: 0.7 });
  });
  // Bärte und Gesichtszüge der Meute (Varianten)
  F.part('beard.full', { bone: 'head', z: 33.5, variant: 0, view: 'front' }, (g) => {
    g.mat(path([[-4, -58], [0, -53.6], [4.4, -50], [13.6, -50], [17, -55], [17.6, -49], [13, -42], [6, -39.6], [0, -42.6], [-4.6, -50]]), BEARD, 'hair', { hi: 0.4 });
    g.mat(path([[4.6, -55.6], [9, -54.4], [13.6, -55.6], [14.6, -53], [9, -52.8], [3.6, -53]]), BEARD, 'hair');
    lines(g, [[[2, -48], [4, -43]], [[8, -46], [8.6, -41]], [[13, -47], [12.4, -43]]], '#8a4418', 0.6, 1);
  });
  F.part('beard.scar', { bone: 'head', z: 33.5, variant: 1, view: 'front' }, (g) => {
    g.stroke(polyline([[9, -68], [15.6, -56]]), '#a8584a', 1.1);
    lines(g, [[[10.4, -65.4], [12.4, -65.8]], [[12.2, -62], [14.2, -62.6]], [[13.8, -58.8], [15.8, -59.4]]], '#a8584a', 0.6, 1);
    for (const [x, y] of [[3, -50], [5, -49], [7, -48.6], [10, -48.4], [13, -49], [15, -50.4], [1, -52]]) g.fill(circle(x, y, 0.5), '#8a5a3a', { lod: 1 });
  });
  F.part('beard.braids', { bone: 'head', z: 33.5, variant: 2, view: 'front' }, (g) => {
    g.mat(path([[-3, -55], [3, -50], [15, -50], [17, -55], [16, -47], [11, -44], [4, -44], [-1, -47]]), '#c8843a', 'hair');
    for (const x of [5, 12]) {
      g.mat(rrect(x - 1.8, -45, 3.6, 10, 1.6), '#c8843a', 'hair');
      g.mat(rrect(x - 2.2, -37, 4.4, 2.4, 0.8), '#8d97a3', 'metal', { lod: 1 });
    }
  });
  F.part('beard.mustache', { bone: 'head', z: 33.5, variant: 3, view: 'front' }, (g) => {
    g.mat(path([[9, -55.4, 1], [4, -56], [0, -53], [-1.6, -56.6, 1], [1, -58], [6, -57.8], [9, -56.6], [12, -57.8], [17, -58], [19.6, -56.6, 1], [18, -53], [14, -56]]), '#7a4a26', 'hair');
  });

  // ───────── Wolfskopf-Kapuze (Signature) ─────────
  F.part('hood', { bone: 'head', z: 34, zb: 34, sig: true }, (g) => {
    const hood = path([[-10, -51], [-14, -62], [-13, -74], [-7, -83], [2, -87], [11, -85], [18, -80], [23, -76], [27.6, -72, 1], [21, -69.6], [13, -70.2], [4, -70.6], [-3, -69], [-5.6, -60], [-7, -52]]);
    g.mat(hood, FUR, 'fur', { hi: 0.3 });
    g.lod(1, (h) => {
      lines(h, [[[-9, -76], [-6, -71]], [[-3, -82], [0, -77]], [[6, -84], [8, -79]], [[-11, -64], [-8, -60]]], FUR_D, 0.7, 1);
      h.fill(path([[21, -76.4], [27.4, -72.6], [24, -71.6]]), '#3a3230');
    });
    // Wolfsauge
    g.fill(path([[12.4, -79.4, 1], [15.4, -81.2], [17.6, -79.6, 1], [15, -78.4]]), '#2a2220');
    g.fill(circle(15.2, -79.8, 0.6), '#d8a040', { lod: 1 });
  });
  // Rückansicht: die Kapuze bedeckt den ganzen Hinterkopf, das Fell fällt in den Nacken
  F.part('hoodBack', { bone: 'head', z: 34.2, zb: 34.2, view: 'back' }, (g) => {
    g.mat(path([[-11, -50], [-14, -62], [-12, -76], [-4, -85], [8, -86], [17, -80], [21, -70], [19, -58], [15, -50], [9, -47], [2, -49], [-4, -46]]), FUR, 'fur', { hi: 0.3 });
    lines(g, [[[-6, -74], [-3, -66]], [[3, -80], [5, -71]], [[11, -76], [12, -67]], [[-2, -60], [0, -53]], [[9, -60], [10, -53]]], FUR_D, 0.7, 1);
  });
  F.part('hoodFangs', { bone: 'head', z: 35, zb: 35, view: 'front' }, (g) => {
    for (const [x, l] of [[13.4, 3], [17.4, 4.6], [21.6, 3.2], [7.6, 2.6]]) g.fill(path([[x - 1.3, -70.4, 1], [x + 1.3, -70.4, 1], [x + 0.2, -70.4 + l, 1]]), BONE, { stroke: INK, lw: 0.45 });
  });
  F.part('ears', { bone: 'hat', z: 33.6, zb: 36 }, (g) => {
    g.mat(path([[-8, -82, 1], [-9.6, -96, 1], [1, -86.6, 1]]), FUR_D, 'fur');
    g.mat(path([[4, -86, 1], [6.6, -100, 1], [14.4, -84, 1]]), FUR, 'fur');
    g.fill(path([[6, -87], [7, -96.4], [11.6, -86]]), '#4a3a34', { lod: 1 });
  });

  // ───────── Hackschwert und vorderer Arm ─────────
  // Klinge zeigt in der Zeichnung nach vorn unten (20°); die Ruhepose dreht sie schräg nach oben (rest)
  const ang = (20 * Math.PI) / 180;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const at = (s, t) => [21 + ux * s - uy * t, -34 + uy * s + ux * t];
  const bladeBase = [at(7, -4.4), at(7, 6), at(29, 6.4), at(35, 1), at(34, -4.4)].map((p, i) => [...p, i === 1 || i === 2 || i === 3 ? 1 : 0]);
  F.part('sword', { bone: 'prop', z: 38, zb: 4, evo: 'base' }, (g) => {
    g.mat(path(bladeBase.map(([x, y, s]) => (s ? [x, y, 1] : [x, y]))), STEEL, 'metal');
    g.lod(1, (h) => {
      h.stroke(polyline([at(9, -2), at(31, -2)]), '#6d7682', 0.7);
      for (const s of [14, 22]) h.fill(poly([at(s - 1.2, 6.4), at(s, 4.6), at(s + 1.2, 6.4)]), '#5f8f45');
    });
    sword(g);
  });
  // Evo: doppelt gezackte Klinge
  F.part('swordEvo', { bone: 'prop', z: 38, zb: 4, evo: 'evo' }, (g) => {
    const pts = [at(7, -4.4)];
    for (let s = 7; s <= 31; s += 4) pts.push([...at(s, 6), 1], [...at(s + 2, 8.4), 1]);
    pts.push([...at(36, 1), 1]);
    for (let s = 31; s >= 9; s -= 4) pts.push([...at(s + 2, -6.6), 1], [...at(s, -4.4), 1]);
    g.mat(path(pts), '#b8c2cc', 'metal');
    g.stroke(polyline([at(9, 0.6), at(32, 0.6)]), '#ffb84a', 0.8, { lod: 1 });
    sword(g);
  });
  function sword(g) {
    g.mat(path([at(5.4, -6.6), at(5.4, 8.2), at(7.4, 8.2), at(7.4, -6.6)]), '#5d6672', 'metal');
    g.mat(path([at(-6, -2.2), at(-6, 2.2), at(5.6, 2.2), at(5.6, -2.2)]), '#6b4a2a', 'leather');
    g.mat(circle(...at(-7.4, 0), 2.6), BONE, 'bone');
  }
  arm('armF', 'handF', 1, 15, 40, 6, false);

  emblem(F, 'emblem', 'hip', 24, 3, -30.4, 1.6, { lod: 1, zb: 24 });

  // ───────── Evolution (Rasend): glühende Wolfsaugen, Kriegsbemalung ─────────
  F.part('evoEyes', { bone: 'head', z: 35.5, evo: 'evo', glow: true }, (g) => {
    g.fill(circle(15.2, -79.8, 2.6), '#ffb84a', { op: 0.75 });
  });
  F.part('evoPaint', { bone: 'head', z: 33.2, evo: 'evo', view: 'front' }, (g) => {
    g.fill(path([[14.6, -62, 1], [17.6, -59, 1], [15.6, -58.6, 1], [17.4, -55.6, 1], [14, -58, 1], [15.6, -58.4, 1]]), '#3a7ad8');
    g.fill(path([[1, -60, 1], [3.6, -57.6, 1], [2, -57.4, 1], [3.4, -55, 1], [0.4, -57, 1], [1.8, -57.2, 1]]), '#3a7ad8');
  });
  F.part('evoPaintArm', { bone: 'armF', z: 40.5, evo: 'evo' }, (g) => {
    g.fill(path([[15, -51, 1], [19, -47, 1], [16.6, -46.6, 1], [19, -43, 1], [14.6, -46, 1], [16.8, -46.4, 1]]), '#3a7ad8');
  });

  F.anim({
    // rollen die Schultern und klopfen sich auf die Brust; Wolfsohren wackeln mit
    idle: {
      p: { breathe: 0.035, bob: 1, sway: 2, armF: -8, armB: 4 },
      keys: { armB: { r: [[0, 0], [0.15, -55], [0.22, -40], [0.3, -58], [0.38, -40], [0.5, 0], [1, 0]] }, hat: { r: [[0, 0], [0.2, -6], [0.3, 4], [0.4, -4], [0.5, 0]] }, torso: { y: [[0, 0], [0.6, -1], [0.75, 0.6], [0.9, 0]] } },
    },
    rest: { handF: { r: -88 } },
    // breitbeiniger, federnder Stampfschritt; Fellkragen schwingt nach
    walk: { p: { stride: 26, bob: 3.4, squash: 0.05, armSwing: 8, lean: 4, armF: -8 }, keys: { cape: { r: [[0, -4], [0.5, 4], [1, -4]] }, hat: { r: [[0, 4], [0.5, -4], [1, 4]] } }, ev: { step: [0.25, 0.75] } },
    // Körper weit zurück, Schwert über den Kopf, Hieb bis zum Boden mit Squash, Klinge federt hoch
    attack: {
      prog: 'atk.swing',
      hit: 0.55,
      p: { wind: -190, strike: -40, over: 12, cock: 28, snap: 148, snapOver: 4, lean: 14, lunge: 16, step: 4, windO: 20, strikeO: -14 },
      keys: { root: { sy: [[0, 1], [0.45, 1.06], [0.55, 0.88], [0.7, 1.02], [1, 1]] }, hat: { r: [[0, 0], [0.5, 8], [0.6, -14], [0.8, 4], [1, 0]] } },
    },
    // Kopf ruckt zurück, Kapuze rutscht ins Gesicht
    hit: { p: { knock: 3, recoil: 8, jolt: 10 }, keys: { hat: { r: [[0, 0], [0.2, 12], [1, 0]] } } },
    death: { p: { dir: -1, angle: 84 } },
  });
}
