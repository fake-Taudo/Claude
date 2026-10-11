// Elitebarbaren – angeberische Champions des Nordvolks mit Bernstein-Kriegsbemalung, Bärenschädel als Schulterpanzer
// und Flamberge (Brief: docs/briefs/elite-barbarians.md). Varianten: 0 = Zopfbart, 1 = Irokese
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, furEdge, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function eliteBarbarians(F) {
  const P = F.pal;
  const AMBER = P.main;
  const LEATHER = P.acc;
  const BONE = '#e8dcc0';
  const SKIN = '#d99a6a';
  const SKIN_D = '#b8784c';
  const BLADE = '#b8c0c8';
  const HAIR = '#5a3420';
  const RAGE = '#b05cff';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -43],
    head: [5, -71],
    hat: [5, -90],
    back: [-8, -64],
    armB: [-13, -67],
    handB: [13, -50],
    armF: [15, -67],
    handF: [21, -50],
    prop: [21, -50],
    legB: [-5, -40],
    footB: [-6, -6],
    legF: [6, -40],
    footF: [7, -6],
    cape: [-10, -68],
  });

  // ───────── Evo: Knochenspeer mit Wut-Wimpel auf dem Rücken ─────────
  F.part('evoSpear', { bone: 'back', z: 2, zb: 47, evo: 'evo' }, (g) => {
    g.mat(path([[-22, -30, 1], [-20, -31, 1], [8, -104, 1], [6, -104.6, 1]]), BONE, 'bone', { hi: 0.5 });
    g.mat(path([[6, -104], [9, -114, 1], [10, -103]]), BONE, 'bone');
    g.mat(path([[4, -98], [-6, -100], [-3, -95], [-8, -90], [2, -92]]), RAGE, 'cloth', { hi: 0.4 });
  });
  // Bernsteinfell-Umhang auf einer Schulter
  F.part('cape', { bone: 'cape', z: 3, zb: 44 }, (g) => {
    const c = path([[-14, -72], [0, -74], [-2, -60], [-6, -42], [-12, -30], [-20, -32], [-20, -50], [-18, -64]]);
    g.mat(c, AMBER, 'fur', { hi: 0.4 });
    g.lod(1, (h) => furEdge(h, [[-12, -30], [-20, -32]], 2.4, '#b87a10'));
    g.lod(1, (h) => lines(h, [[[-10, -66], [-15, -36]], [[-5, -66], [-8, -40]]], '#b87a10', 0.6, 1));
  });

  // ───────── Beine: Wickelhose, Fellstiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -40, x * 1.1, -12, 5, 4.2), '#6a5a48', 'cloth');
      g.lod(1, (h) => lines(h, [[[x * 1.05 - 4, -34], [x * 1.05 + 4, -31]], [[x * 1.05 - 4, -27], [x * 1.05 + 4, -24]], [[x * 1.05 - 4, -20], [x * 1.05 + 4, -17]]], '#4a3e30', 0.7, 1));
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 6, -18], [fx + 5.6, -18.6], [fx + 5, -6], [fx + 11, -3], [fx + 11, 0, 1], [fx - 6.4, 0, 1]]), '#8a6a44', 'fur', { hi: 0.4 });
      g.lod(1, (h) => furEdge(h, [[fx - 6, -18], [fx + 5.6, -18.6]], 2, '#5a4430'));
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 6, 8);

  // ───────── Hinterer Arm (zweite Hand am Griff) ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-13, -67, 12, -51, 5, 4.2), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(13, -50, 3.6), SKIN_D, 'skin'));

  // ───────── Rumpf (Keil): nackte Brust, Lederharnisch, Gürtelschärpe (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-16, -70], [-5, -74], [11, -74], [19, -70], [15, -56], [10, -42], [-9, -42], [-13, -56]]), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[2, -66], [4, -60], [9, -58]], [[2, -52], [6, -50]]], SKIN_D, 0.7, 1));
  });
  F.part('harness', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    g.mat(path([[-14, -70], [-9, -72], [14, -48], [9, -45]]), LEATHER, 'leather', { hi: 0.5 });
    g.mat(circle(1.6, -59.6, 2.4), BONE, 'bone');
  });
  F.part('belt', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-10, -45], [11, -45], [11, -39], [-10, -39]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[6, -40], [10, -32, 1], [7, -32], [4.4, -38]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('loin', { bone: 'hip', z: 18, zb: 18 }, (g) => g.mat(path([[-9, -40], [10, -40], [12, -28], [1, -26], [-10, -28]]), LEATHER, 'leather', { hi: 0.3 }));

  // ───────── Kopf: kantig, schmale Augen, Kriegsbemalung ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-4, -84], [4, -88], [13, -85], [15.4, -76], [15, -70, 1], [10, -66], [2, -66.6], [-4, -72]]), SKIN, 'skin');
    g.mat(ellipse(-3.4, -77, 2, 3), SKIN_D, 'skin');
    // Ohrring aus Zähnen
    g.mat(path([[-3.6, -73], [-2.6, -69, 1], [-4.4, -73]]), BONE, 'bone', { lod: 1 });
  });
  F.part('paint', { bone: 'head', z: 31, view: 'front' }, (g) => {
    // drei Streifen schräg über die Wange
    for (const x of [7, 10, 13]) g.fill(path([[x - 1, -78.4, 1], [x + 0.4, -78.6, 1], [x - 0.6, -72.6, 1], [x - 2, -72.6, 1]]), AMBER, { op: 0.95 });
  });
  F.part('evoPaint', { bone: 'head', z: 31.2, view: 'front', evo: 'evo', glow: true }, (g) => {
    for (const x of [7, 10, 13]) g.fill(path([[x - 1, -78.4, 1], [x + 0.4, -78.6, 1], [x - 0.6, -72.6, 1], [x - 2, -72.6, 1]]), RAGE);
  });
  faceSet(F, {
    eyes: [[11.4, -80.6, 2], [5, -80.6, 1.8]],
    iris: '#6a4a2a',
    lidColor: SKIN,
    lid: 0.5,
    look: [0.8, 0],
    brow: { color: HAIR, w: 1.5, lift: 0.2 },
    idleTilt: 1,
    mouth: [10, -71, 5],
    mood: 'smirk',
    attackMouth: 'shout',
    idle: (g) => {
      // hochgezogene Oberlippe zeigt die Zähne
      g.fill(rrect(9.6, -72.4, 3.6, 1.4, 0.4), WHITE, { stroke: INK, lw: 0.4 });
    },
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[11.4, -80], [15.6, -75, 1], [11.6, -74.4]]), SKIN_D, 'skin', { line: '#8a5a3a', lw: 0.5 }));
  F.part('braidBeard', { bone: 'head', z: 33.5, zb: 31, variant: 0 }, (g) => {
    g.mat(path([[2, -70], [15, -71], [14, -66], [10, -64], [3, -65]]), HAIR, 'hair', { hi: 0.4 });
    for (let i = 0; i < 3; i++) g.mat(ellipse(9, -62 + i * 3.4, 2.2, 2), HAIR, 'hair', { hi: 0.4 });
    g.mat(rrect(7.4, -53.6, 3.2, 2.2, 0.6), BONE, 'bone');
  });
  F.part('hairTop', { bone: 'head', z: 34, zb: 34, variant: 0 }, (g) => {
    g.mat(path([[-5, -80], [-4, -87], [4, -90], [12, -89], [15, -85], [8, -86], [2, -85], [-2, -82]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('mohawk', { bone: 'head', z: 34, zb: 34, variant: 1 }, (g) => {
    g.mat(path([[-3, -84], [-2, -94, 1], [2, -90], [4, -98, 1], [7, -92], [10, -97, 1], [11, -89], [13, -86], [4, -87], [-2, -83]]), HAIR, 'hair', { hi: 0.4 });
    g.lod(1, (h) => h.fill(path([[3, -72], [14, -72.6], [13, -68], [4, -68]]), SKIN_D, { op: 0.6 }));
  });
  F.part('headBack', { bone: 'head', z: 34.5, view: 'back' }, (g) => g.mat(path([[-4, -86], [14, -86], [15, -74], [8, -66], [0, -67], [-4, -74]]), HAIR, 'hair'));

  // ───────── Flamberge (liegt auf der Schulter) und vorderer Arm ─────────
  F.part('flamberge', { bone: 'prop', z: 27, zb: 4 }, (g) => {
    // Klinge vom Griff schräg nach hinten oben, gewellt
    const n = 9;
    const A = [24, -54];
    const B = [-14, -104];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / L;
    const uy = (B[1] - A[1]) / L;
    const nx = -uy;
    const ny = ux;
    const side = (sgn) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = 0.18 + (i / n) * 0.82;
        const w = (2.6 + (i % 2 ? 1 : 0)) * (1 - t * 0.35);
        pts.push([A[0] + ux * L * t + nx * w * sgn, A[1] + uy * L * t + ny * w * sgn]);
      }
      return pts;
    };
    g.mat(path([...side(1), [B[0] + ux * 3, B[1] + uy * 3, 1], ...side(-1).reverse()]), BLADE, 'metal', { hi: 0.95 });
    g.lod(1, (h) => h.stroke(polyline([[A[0] + ux * L * 0.2, A[1] + uy * L * 0.2], [B[0], B[1]]]), '#e8eef4', 0.6));
    // Parierhaken, Griff
    g.mat(path([[A[0] + ux * L * 0.16 + nx * 7, A[1] + uy * L * 0.16 + ny * 7, 1], [A[0] + ux * L * 0.18 + nx * 2, A[1] + uy * L * 0.18 + ny * 2], [A[0] + ux * L * 0.18 - nx * 2, A[1] + uy * L * 0.18 - ny * 2], [A[0] + ux * L * 0.16 - nx * 7, A[1] + uy * L * 0.16 - ny * 7, 1], [A[0] + ux * L * 0.13, A[1] + uy * L * 0.13]]), '#8a7a5a', 'metal');
    g.mat(path([[A[0] + nx * 1.8 + ux * 3, A[1] + ny * 1.8 + uy * 3], [A[0] + ux * L * 0.13 + nx * 1.8, A[1] + uy * L * 0.13 + ny * 1.8], [A[0] + ux * L * 0.13 - nx * 1.8, A[1] + uy * L * 0.13 - ny * 1.8], [A[0] - nx * 1.8 + ux * 3, A[1] - ny * 1.8 + uy * 3]]), LEATHER, 'leather');
    g.mat(circle(A[0] + ux * 2, A[1] + uy * 2, 2.2), '#8a7a5a', 'metal');
  });
  // Griffwicklung (Teamzone)
  F.part('gripWrap', { bone: 'prop', z: 27.5, zb: 4.5, team: true }, (g) => {
    const A = [24, -54];
    const d = [(-14 - 24) / 63, (-104 + 54) / 63];
    for (const t of [5, 8]) g.stroke(polyline([[A[0] + d[0] * t - 1.6, A[1] + d[1] * t - 1.2], [A[0] + d[0] * t + 1.6, A[1] + d[1] * t + 1.2]]), P.team, 1.3);
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(15, -67, 21, -51, 5.2, 4.4), SKIN, 'skin'));
  // Bärenschädel als Schulterpanzer (Signature)
  F.part('bearSkull', { bone: 'armF', z: 29.6, zb: 6.6, sig: true }, (g) => {
    g.mat(blob([[6, -72], [14, -79], [24, -78], [28, -72], [26, -66], [16, -63], [8, -65]], 0.6), BONE, 'bone', { hi: 0.6 });
    g.fill(ellipse(20, -73, 2, 1.6), '#3a2a1e');
    g.fill(ellipse(26.4, -70.6, 1.2, 0.8), '#3a2a1e');
    // Unterkiefer und Eckzähne nach vorn
    g.mat(path([[14, -66], [26, -66], [24, -63], [15, -62.4]]), '#d8ccb0', 'bone');
    g.mat(path([[24.6, -66.4], [27.6, -62, 1], [26, -66]]), WHITE, 'bone');
    g.mat(path([[20, -66.2], [22, -62.4, 1], [21.4, -66]]), WHITE, 'bone', { lod: 1 });
    g.lod(1, (h) => h.stroke(polyline([[12, -76], [15, -72], [13, -68]]), '#a89c80', 0.6));
  });
  F.part('evoSkullEyes', { bone: 'armF', z: 29.8, zb: 6.8, evo: 'evo', glow: true }, (g) => g.fill(ellipse(20, -73, 1.6, 1.2), RAGE));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(21.6, -50.6, 3.8), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 25, -6, -54, 2.3, { zb: 25 });

  F.anim({
    // Schwert lässig auf der Schulter, dehnt den Nacken
    idle: { p: { breathe: 0.03, bob: 0.6, sway: 1, tilt: 2 }, keys: { head: { r: [[0, 0], [0.4, 0], [0.5, -12], [0.6, 10], [0.7, 0]] } } },
    // schneller, kraftvoller Schritt
    walk: { prog: 'biped.run', p: { stride: 28, bob: 2.6, armSwing: 6, lean: 6 }, ev: { step: [0.25, 0.75] } },
    // Drehung nach hinten, zweihändiger Diagonalhieb
    attack: {
      prog: 'atk.swing',
      hit: 0.5,
      p: { wind: -150, strike: -45, over: 14, cock: 0, snap: 175, lean: 14, lunge: 16 },
      keys: { armB: { r: [[0, 0], [0.4, -140], [0.5, -50], [0.64, -40], [1, 0]] }, root: { sx: [[0, 1], [0.3, 0.9], [0.5, 1.04], [0.7, 1]] } },
      ev: { strike: 0.5 },
    },
    // schüttelt den Kopf, der Schädelkiefer klappert
    hit: { p: { knock: 2, recoil: 5 }, keys: { head: { r: [[0, 0], [0.15, -10], [0.3, 10], [0.45, -6], [0.6, 0]] } } },
    // landen und posieren
    spawn: { keys: { armF: { r: [[0, 0], [0.6, 0], [0.8, -20], [1, 0]] } } },
    // fallen auf die Knie, der Bärenschädel rollt herunter
    death: { p: { dir: 1, angle: 60 }, keys: { alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
