// Mönch – heiterer alter Kämpfer mit Bronzegong auf dem Rücken, Gebetskette und riesigen Handflächen
// (Brief: docs/briefs/monk.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function monk(F) {
  const P = F.pal;
  const ROBE = P.main;
  const BRONZE = P.acc;
  const BEARD = '#f2efe6';
  const SKIN = '#e0b08a';
  const BEAD = '#8a5a32';
  const WOOD = '#7a5434';
  const ROBE_D = '#7a3a62';
  const STRAW = '#d8b870';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -44],
    head: [3, -76],
    hat: [3, -96],
    back: [-14, -82],
    armB: [-17, -71],
    handB: [-22, -48],
    armF: [17, -71],
    handF: [24, -49],
    legB: [-7, -40],
    footB: [-9, -6],
    legF: [7, -40],
    footF: [9, -6],
    cape: [6, -60],
  });

  // ───────── Bronzegong im Holzgestell auf dem Rücken (Signature) ─────────
  F.part('gong', { bone: 'back', z: 2, zb: 46, sig: true }, (g) => {
    g.mat(path([[-30, -104], [-27, -106], [-3, -106], [0, -104], [-1, -100], [-29, -100]]), WOOD, 'wood');
    g.mat(rrect(-30, -104, 3, 46, 1.2), WOOD, 'wood');
    g.mat(rrect(-3, -104, 3, 40, 1.2), WOOD, 'wood');
    g.stroke(polyline([[-15, -100], [-15, -96]]), '#5a3a20', 1);
    g.mat(circle(-15, -80, 15.5), BRONZE, 'gold', { hi: 0.7 });
    g.stroke(circle(-15, -80, 12), '#a8742a', 1.1, { lod: 1 });
    g.stroke(circle(-15, -80, 7.4), '#a8742a', 0.9, { lod: 1 });
    g.mat(circle(-15, -80, 3.6), '#e8b860', 'gold');
    // Wolkenrelief
    g.lod(2, (h) => h.stroke(spline([[-24, -86], [-21, -89], [-18, -87], [-15, -90], [-12, -88]]), '#b8843a', 0.6));
  });
  F.part('gongFront', { bone: 'back', z: 3, view: 'front', lod: 1 }, (g) => {
    g.stroke(spline([[-28, -66], [-15, -63], [-2, -66]]), '#a8742a', 0.8);
  });

  // ───────── Sandalen ─────────
  const foot = (name, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(path([[x - 5, -8], [x + 5, -8], [x + 9.6, -3], [x + 10, 0, 1], [x - 6, 0, 1], [x - 6.4, -4]]), SKIN, 'skin');
      g.mat(rrect(x - 6.6, -1.6, 17.4, 2.4, 1), STRAW, 'cloth');
      g.stroke(polyline([[x - 3, -6], [x + 5, -2]]), '#8a6a3a', 0.8, { lod: 1 });
    });
  };
  F.part('legB', { bone: 'legB', z: 4 }, (g) => g.mat(limb(-7, -40, -9, -8, 6, 5), '#c8986a', 'skin'));
  F.part('legF', { bone: 'legF', z: 5 }, (g) => g.mat(limb(7, -40, 9, -8, 6, 5), SKIN, 'skin'));
  foot('footB', -9, 6);
  foot('footF', 9, 7);

  // ───────── Hinterer Arm: weiter Ärmel, riesige Handfläche ─────────
  const sleeve = (s, x0, color) => {
    const X = (x) => x0 + x * s;
    return path([[X(-4), -75], [X(5), -76], [X(9), -62], [X(12), -50], [X(4), -47], [X(-4), -50], [X(-6), -62]]);
  };
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(sleeve(-1, -17, ROBE_D), ROBE_D, 'cloth');
  });
  const palm = (g, x, y, s, color) => {
    const X = (dx) => x + dx * s;
    g.mat(path([[X(-5), y - 6], [X(4), y - 7], [X(7), y - 2], [X(12), y - 4], [X(13.4), y - 1], [X(8), y + 5], [X(1), y + 7], [X(-5), y + 4], [X(-7), y - 1]]), color, 'skin');
    lines(g, [[[X(0), y + 1], [X(6), y + 2]], [[X(-1), y + 3.6], [X(5), y + 4.4]]], '#b07a58', 0.6, 1);
  };
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => palm(g, -22, -46, -1, '#cf9c78'));

  // ───────── Kutte mit Schärpe ─────────
  F.part('robe', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const r = path([[-14, -76], [-4, -79], [8, -79], [16, -76], [20, -50], [24, -12], [16, -6.6], [0, -8], [-16, -6.6], [-24, -12], [-20, -50]]);
    g.mat(r, ROBE, 'cloth');
    g.clipTo(r, (h) => {
      h.mat(path([[-26, -16], [26, -16], [26, -4], [-26, -4]]), ROBE_D, 'cloth', { line: '0' });
      // Wolkenmuster am Saum
      for (const x of [-16, -4, 8, 18]) h.stroke(spline([[x - 4, -10], [x - 2, -13], [x, -11], [x + 2, -14], [x + 4, -11]]), '#e8b860', 0.7, { lod: 1 });
      lines(h, [[[-10, -44], [-14, -18]], [[2, -44], [2, -18]], [[12, -44], [16, -18]]], ROBE_D, 0.8, 1);
    });
    // geflickter Ärmelansatz
    g.mat(rrect(-17, -66, 6, 5, 1), '#b8708e', 'cloth', { lod: 1 });
    stitches(g, [[-17, -66], [-11, -66], [-11, -61], [-17, -61], [-17, -66]], '#f0d8a0', { step: 1.8, len: 0.7, lod: 2 });
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-20, -52], [20, -52], [21, -46], [-21, -46]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-7, -48], [-3, -48], [-1, -34], [-5, -32], [-8, -34]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
    g.mat(path([[-4, -48], [0, -48], [3, -36], [0, -35]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.6 });
    g.mat(circle(-3.6, -49, 2.6), P.teamShade, 'cloth');
  });
  // Gebetskette mit großen Holzperlen
  F.part('beads', { bone: 'torso', z: 25, view: 'front' }, (g) => {
    const pts = [];
    for (let i = 0; i <= 9; i++) {
      const t = i / 9;
      pts.push([-11 + t * 25, -76 + Math.sin(t * Math.PI) * 16]);
    }
    for (const [x, y] of pts) g.mat(circle(x, y, 2.1), BEAD, 'wood', { hi: 0.5 });
  });
  F.part('tassel', { bone: 'torso', z: 25.5, view: 'front', team: true }, (g) => {
    g.mat(circle(1.6, -58, 2.6), BEAD, 'wood');
    g.mat(path([[0, -56], [3.2, -56], [4.6, -46, 1], [-1.4, -46, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Kopf: kahl, große Ohren, langer Zopfbart ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-8, -88], [3, -95], [14, -91], [17, -82], [15, -73], [8, -69.6], [-1, -71], [-7, -77]]), SKIN, 'skin', { hi: 0.5 });
    g.mat(ellipse(-7.4, -81, 3, 4.6), SKIN, 'skin');
    g.fill(ellipse(-7.2, -81, 1.4, 2.6), '#c08a64', { lod: 1 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back', lod: 1 }, (g) => {
    g.stroke(spline([[-4, -76], [3, -73], [10, -76]]), '#b8845e', 0.7);
  });
  faceSet(F, {
    eyes: [[11.6, -82.6, 2.4], [3.6, -82.6, 2.2]],
    iris: '#3a2a22',
    lidColor: SKIN,
    lid: 0.35,
    brow: { color: BEARD, w: 2.2, lift: 0.5 },
    mouth: [9, -75.6, 5],
    mood: 'smile',
    attackMouth: 'oh',
    replace: {
      // geschlossene, lächelnde Augen
      idle: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.4, { up: true, lw: 1 });
        eyeClosed(g, c.E2[0], c.E2[1], 2.2, { up: true, lw: 1 });
        g.stroke(spline([[13.4, -80], [14.8, -78.6], [14.6, -77]]), '#b07a58', 0.6, { lod: 1 });
      },
    },
  });
  // buschige, hängende Brauen (über allen Ausdrücken)
  F.part('brows', { bone: 'head', z: 33.5, view: 'front' }, (g) => {
    g.mat(path([[7.6, -86.6], [12, -88.4], [16.6, -87], [18, -83.4, 1], [14.6, -85.4], [9, -85]]), BEARD, 'hair');
    g.mat(path([[0, -86], [3.6, -87.6], [7, -86.4], [6, -85], [2.4, -85.4], [-0.6, -83.6, 1]]), BEARD, 'hair');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.4, -79, 2.4, 2.1), '#d89a74', 'skin', { line: '#a8684a', lw: 0.6 });
  });
  F.part('beard', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[1, -76], [5, -73], [13, -73], [15.6, -77], [16, -72], [12, -66], [10, -56], [11, -46, 1], [7, -48], [5.6, -58], [2, -66], [-1, -72]]), BEARD, 'hair', { hi: 0.5 });
    g.mat(path([[5, -78], [9, -76.6], [13, -78], [14.6, -76.4], [9, -75], [3.6, -76.4]]), BEARD, 'hair');
    g.mat(rrect(6.4, -52, 5, 2.6, 1), BRONZE, 'gold', { lod: 1 });
    lines(g, [[[6, -70], [7.6, -64]], [[10, -70], [9.6, -62]], [[7, -58], [9, -54]]], '#c8c0b0', 0.6, 1);
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 8 }, (g) => {
    g.mat(sleeve(1, 17, ROBE), ROBE, 'cloth');
    g.stroke(spline([[17, -60], [23, -56], [27, -50]]), ROBE_D, 0.8, { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 9 }, (g) => palm(g, 24, -46, 1, SKIN));
  emblem(F, 'emblem', 'torso', 23, 12, -49, 2, { zb: 23 });

  F.anim({
    // streicht sich den Bart, die Gebetskette klackert
    idle: { p: { breathe: 0.02, bob: 0.6, sway: 1.5, tilt: 1.5 }, keys: { armF: { r: [[0, 0], [0.2, -48], [0.35, -40], [0.5, -50], [0.65, -40], [0.8, 0], [1, 0]] }, handF: { r: [[0, 0], [0.2, -40], [0.8, -40], [1, 0]] } } },
    // ruhiger, gleitender Schritt
    walk: { p: { stride: 14, bob: 1, armSwing: 2, lean: 2 }, keys: { cape: { r: [[0, -2], [0.5, 2], [1, -2]] } } },
    // Handflächenstoß
    attack: { prog: 'atk.punch', hit: 0.5, p: { wind: 25, strike: -80, reach: 12, lunge: 12 }, keys: { handF: { r: [[0, 0], [0.4, 0], [0.5, -70], [0.8, -60], [1, 0]] }, back: { r: [[0, 0], [0.5, -3], [0.6, 3], [1, 0]] } } },
    // Nachdenklicher Schutz: dreht den Gong vor sich und schlägt ihn an
    ability: {
      prog: 'biped.idle',
      keys: {
        back: { x: [[0, 0], [0.35, 40, 'io'], [1, 40]], y: [[0, 0], [0.35, 12, 'io'], [1, 12]] },
        armF: { r: [[0, 0], [0.5, -40], [0.6, -95, 'in'], [0.75, -80], [1, -80]] },
        handF: { r: [[0, 0], [0.6, -70], [1, -70]] },
        layer: [[0.3, 1, 'gong', 46, 46]],
      },
      ev: { ability: 0.6 },
    },
    hit: { p: { knock: 1, recoil: 3 } },
    spawn: { keys: { legF: { r: [[0, -30], [0.5, -30], [0.8, 0]] }, legB: { r: [[0, 30], [0.5, 30], [0.8, 0]] } } },
    // setzt sich im Lotussitz und verblasst lächelnd
    death: { prog: 'still', keys: { expr: [[0, 1, 'sleep']], root: { y: [[0, 0], [0.4, 14, 'out'], [1, 14]] }, legF: { r: [[0, 0], [0.4, -80]] }, legB: { r: [[0, 0], [0.4, 80]] }, armF: { r: [[0, 0], [0.4, -30]] }, alpha: [[0, 1], [0.5, 1], [1, 0, 'io']] } },
  });
}
