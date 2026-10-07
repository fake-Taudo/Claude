// Drei Musketierinnen – Schwestern-Trio mit Dreispitz, riesiger Kokarde und kurzem Trompeten-Karabiner
// (Brief: docs/briefs/three-musketeers.md). Varianten: 0 Zopf/gerade Brauen, 1 Locken/gebogen, 2 Kurzhaar/buschig.
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, eyeClosed, eye, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function threeMusketeers(F) {
  const P = F.pal;
  const COAT = P.main;
  const VEST = P.acc;
  const WOOD = '#6b4128';
  const BRASS = '#c9a24a';
  const IRON = '#5f6672';
  const SKIN = '#f2c4a0';
  const HAIRS = ['#6a3a1e', '#2a1c24', '#c8843a'];
  const FELT = '#2a2a30';
  const COAT_D = '#163a44';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -37],
    head: [4, -66],
    hat: [4, -82],
    armB: [-9, -62],
    handB: [9, -49],
    armF: [11, -62],
    handF: [21, -52],
    prop: [21, -52],
    legB: [-5, -34],
    footB: [-6, -7],
    legF: [5, -34],
    footF: [6, -7],
    back: [-6, -66],
  });

  // ───────── Kniebundhose, Gamaschen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -35, x * 1.1, -20, 6, 5.4), VEST, 'cloth');
      g.mat(limb(x * 1.1, -21, x * 1.15, -7, 5, 4.6), '#f4ecd8', 'cloth');
      g.lod(1, (h) => {
        for (const y of [-18, -14, -10]) h.fill(circle(x * 1.12 + 2.6, y, 0.6), BRASS);
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.6, -8.6], [fx + 3.6, -8.6], [fx + 9.6, -3.6], [fx + 9.8, 0, 1], [fx - 5.4, 0, 1], [fx - 5.6, -4.6]]), '#2e2420', 'leather', { hi: 0.5 });
      g.mat(rrect(fx - 0.6, -7.6, 4, 2.6, 0.6), BRASS, 'gold', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => {
    g.mat(limb(-9, -62, 7, -50, 4.6, 4.2), COAT_D, 'cloth');
    g.mat(rrect(3, -54, 5, 4.6, 1.4).rot(36, 5.5, -52), VEST, 'cloth', { lod: 1 });
  });
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => g.mat(circle(9, -48.6, 3), '#e0b08c', 'skin'));

  // ───────── Waffenrock, Weste, Schärpe, Patronentaschen ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-10, -64], [-3, -66.6], [8, -66.6], [12, -64], [13.4, -48], [13, -34], [15, -22], [8, -22], [3, -34], [-1, -34], [-6, -22], [-13, -22], [-12, -34], [-12.4, -48]]);
    g.mat(c, COAT, 'cloth');
    g.stroke(polyline([[15, -22], [8, -22], [3, -34]]), VEST, 0.9, { lod: 1 });
    g.stroke(polyline([[-1, -34], [-6, -22], [-13, -22]]), VEST, 0.9, { lod: 1 });
  });
  F.part('vest', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    g.mat(path([[-2, -64], [9, -64], [10, -40], [3, -35], [-2.6, -40]]), VEST, 'cloth');
    for (const y of [-60, -54, -48, -42]) g.mat(circle(3.6, y, 0.9), BRASS, 'gold', { lod: 1 });
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-12.6, -40, 26, 4.4, 1.6), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-12, -37], [-8, -37], [-9, -28], [-12.6, -29]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });
  F.part('pouch', { bone: 'hip', z: 23, zb: 23 }, (g) => {
    g.mat(rrect(5, -37, 7, 6, 1.4), '#4a3020', 'leather');
    g.mat(rrect(7.6, -35.6, 2, 2, 0.4), BRASS, 'gold', { lod: 1 });
  });

  // ───────── Köpfe: drei Schwestern ─────────
  // Variante 0: Zopf
  F.part('braidA', { bone: 'head', z: 29, zb: 33, variant: 0 }, (g) => {
    for (let i = 0; i < 4; i++) g.mat(ellipse(-6 - i * 0.8, -64 + i * 4, 2.6, 2.4), HAIRS[0], 'hair', { hi: 0.5 });
    g.mat(rrect(-10.6, -50.6, 5, 2.2, 1), VEST, 'cloth', { lod: 1 });
  });
  // Variante 1: Locken
  F.part('curlsB', { bone: 'head', z: 29, zb: 33, variant: 1 }, (g) => {
    for (const [x, y, r] of [[-7, -72, 4], [-9, -66, 4], [-8, -60, 3.6], [-4, -57, 3.2], [-3, -76, 3.6]]) g.mat(circle(x, y, r), HAIRS[1], 'hair', { hi: 0.5 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -77], [4, -80], [13.6, -76.4], [15.4, -67], [13, -59.6], [6.6, -56.6], [-0.6, -58], [-5.6, -64]]), SKIN, 'skin');
  });
  // Variante 2: Kurzhaar (Strähnen unter dem Hut)
  F.part('shortC', { bone: 'head', z: 34.4, zb: 34.4, variant: 2 }, (g) => {
    g.mat(path([[-7, -76], [0, -78], [-1, -73], [-5, -70], [-6.6, -64], [-8.6, -68]]), HAIRS[2], 'hair');
  });
  faceSet(F, {
    eyes: [[11, -68.6, 2.5], [3.4, -68.6, 2.3]],
    iris: '#3a5a6a',
    lidColor: SKIN,
    lid: 0.1,
    look: [0.5, 0],
    brow: false,
    mouth: [9, -61.6, 5],
    mood: 'grin',
    attackMouth: 'clench',
    replace: {
      attack: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.4, { lw: 0.9 });
        eye(g, c.E2[0], c.E2[1], { ...c.EYE, r: 2.3, lid: 0.25, look: [0.9, 0] });
        g.stroke(spline([[6.6, -62], [9, -62.6], [11.4, -61.6]]), INK, 0.9);
      },
    },
  });
  // Brauen je Schwester: gerade, gebogen, buschig
  const browSets = [
    [[[8.4, -72.6], [11, -72.8], [13.8, -72.6]], [[1, -72.6], [3.4, -72.8], [5.8, -72.6]], 1],
    [[[8.2, -72.2], [11, -74], [13.8, -72.6]], [[0.8, -72.4], [3.4, -74], [6, -72.4]], 0.9],
    [[[8, -72.4], [11, -73.6], [14.2, -73]], [[0.6, -72.8], [3.4, -73.8], [6.2, -72.6]], 1.8],
  ];
  browSets.forEach(([b1, b2, w], v) => {
    F.part('brows' + v, { bone: 'head', z: 33.6, view: 'front', variant: v }, (g) => {
      for (const b of [b1, b2]) {
        const [a, m, e] = b;
        g.fill(path([[a[0], a[1] + w * 0.3, 1], [m[0], m[1] - w * 0.4], [e[0], e[1], 1], [m[0], m[1] + w * 0.4]]), HAIRS[v]);
      }
    });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.4, -65, 1.7, 1.5), '#e8a882', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-6, -77], [14, -77], [14, -64], [8, -57], [-1, -58], [-6, -64]]), '#5a3a26', 'hair');
  });
  // Dreispitz mit Litzenrand
  F.part('tricorn', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-1, -77], [1, -85], [7, -88], [12, -85], [13, -77]]), FELT, 'cloth', { hi: 0.3 });
    g.mat(path([[-12, -73, 1], [-4, -80], [6, -81.6], [16, -79.4], [24, -74, 1], [14, -76.4], [6, -77], [-3, -75.6]]), FELT, 'cloth', { hi: 0.3 });
    g.stroke(polyline([[-12, -73], [-4, -80], [6, -81.6], [16, -79.4], [24, -74]]), VEST, 0.9, { lod: 1 });
  });
  // Kokarde (Signature): gefaltete Rosette fast so groß wie der Kopf, Teamfarbe, Metallknopf
  F.part('cockade', { bone: 'hat', z: 37, zb: 37, sig: true, team: true }, (g) => {
    const cx = 2;
    const cy = -82;
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = i % 2 ? 7.4 : 9;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    g.mat(poly(pts, 0.6), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        h.stroke(polyline([[cx + Math.cos(a) * 3.4, cy + Math.sin(a) * 3.4], [cx + Math.cos(a) * 7.6, cy + Math.sin(a) * 7.6]]), P.teamShade, 0.7);
      }
    });
    g.mat(circle(cx, cy, 3), '#c8ccd2', 'metal');
  });

  // ───────── Karabiner mit Trompetenmündung und Klappbajonett ─────────
  const ang = (-40 * Math.PI) / 180;
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const at = (s, t) => [21 + ux * s - uy * t, -52 + uy * s + ux * t];
  F.part('carbine', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([at(-14, -2.4), at(-14, 3.6), at(-4, 2.6), at(2, 1.6), at(2, -1.6), at(-6, -2.4)]), WOOD, 'wood');
    g.mat(path([at(1, -1.2), at(22, -1), at(22, 1.4), at(1, 1.4)]), IRON, 'metal');
    g.mat(path([at(21, -1.2), [...at(28, -4.4), 1], [...at(28, 4.6), 1], at(21, 1.6)]), BRASS, 'gold', { hi: 0.9 });
    g.lod(1, (h) => h.stroke(polyline([at(4, 2.6), at(17, 2.6)]), '#c8ccd2', 0.7));
  });
  F.part('muzzle', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    g.fill(circle(...at(31, 0), 4), '#fff0c0', { op: 0.9 });
    g.fill(path([at(28, -5), at(38, -3), at(34, 0), at(39, 3), at(28, 5)]), '#ffd27a', { op: 0.8 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(11, -62, 19.6, -53, 4.6, 4.2), COAT, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(21, -51.4, 3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -6, -52, 2.4, { zb: 24 });

  F.anim({
    // drehen den Karabiner wie einen Taktstock, eine richtet die Kokarde
    idle: { p: { breathe: 0.025, bob: 0.6, sway: 1.4 }, keys: { prop: { r: [[0, 0], [0.2, 0], [0.35, 180], [0.5, 360], [1, 360]] }, armB: { r: [[0, 0], [0.6, 0], [0.7, -80], [0.85, -80], [0.95, 0]] } } },
    // Gleichschritt mit leichtem Hüpfer
    walk: { p: { stride: 22, bob: 3, armSwing: 2, lean: 2 }, keys: { prop: { r: [[0, -30], [1, -30]] } }, ev: { step: [0.25, 0.75] } },
    // Anlegen an die Wange, kurzer Schuss mit Mündungswolke
    attack: { prog: 'atk.shoot', hit: 0.55, p: { armFAim: -38, armBAim: -46, propAim: 30, handBAim: 0, recoil: 3, kick: 7, kickArm: 6, aimHead: 3 }, ev: { release: 0.55 } },
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 0], [0.2, 14], [1, 0]], y: [[0, 0], [0.2, 2.4], [1, 0]] } } },
    spawn: { keys: { armB: { r: [[0, 0], [0.55, 0], [0.7, -140], [0.9, -140], [1, -60]] } } },
    death: { p: { dir: 1, angle: 76 }, keys: { hat: { x: [[0, 0], [0.4, 0], [1, 10]], r: [[0, 0], [0.4, 0], [1, 60]] } } },
  });
}
