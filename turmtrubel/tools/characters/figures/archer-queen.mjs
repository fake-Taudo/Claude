// Bogenschützen-Königin – kühle Herrscherin in Smaragd und Gold mit Spitzenkrause, hoher Frisur und Mondsichel-Armbrust
// (Brief: docs/briefs/archer-queen.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { faceSet, eye, eyeClosed, brow, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function archerQueen(F) {
  const P = F.pal;
  const VELVET = P.main;
  const GOLD = P.acc;
  const LACE = '#f6f0e4';
  const HAIR = '#3a2236';
  const MOON = '#dfe6f2';
  const SKIN = '#f2d4bc';
  const VELVET_D = '#154c3a';
  const STOCK = '#5a3424';
  const HOSE = '#1d3a2e';

  F.rig('biped', {
    hip: [0, -42],
    torso: [0, -45],
    head: [4, -70],
    hat: [3, -95],
    back: [-8, -66],
    armB: [-8, -67],
    handB: [9, -55],
    armF: [11, -67],
    handF: [21, -53],
    prop: [21, -53],
    legB: [-4, -42],
    footB: [-5, -6],
    legF: [5, -42],
    footF: [6, -6],
    cape: [-3, -69],
  });

  // ───────── Umhang mit langer Schleppe (Schleppe = Teamzone) ─────────
  const capeOuter = path([[-11, -74], [3, -74], [0, -60], [-6, -40], [-10, -22], [-15, -9], [-26, -3], [-36, -6], [-28, -16], [-22, -34], [-18, -52], [-15, -66]]);
  F.part('cape', { bone: 'cape', z: 3, zb: 44 }, (g) => {
    g.mat(capeOuter, VELVET_D, 'cloth', { hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-8, -66], [-16, -24]], [[-3, -62], [-9, -26]]], '#0e3428', 0.7, 1));
  });
  F.part('train', { bone: 'cape', z: 3.5, zb: 44.5, team: true }, (g) => {
    const t = path([[-15, -9], [-10, -3], [-16, 0, 1], [-34, 0], [-50, -1, 1], [-46, -5], [-36, -6], [-26, -3]]);
    g.mat(t, P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.stroke(spline([[-14, -2], [-30, -1.6], [-48, -2]]), GOLD, 0.8, { lod: 1 });
    // Mondphasen-Stickerei
    g.lod(1, (h) => {
      for (const [x, k] of [[-22, 0.2], [-30, 0.5], [-38, 0.8]]) {
        h.fill(circle(x, -2.6, 1.2), P.teamLight);
        h.fill(circle(x + 0.6 * k + 0.3, -2.8, 1.1), P.team);
      }
    });
  });
  F.part('broochBack', { bone: 'cape', z: 3.6, view: 'back', zb: 45 }, (g) => {
    g.stroke(spline([[-10, -70], [-4, -60], [2, -70]]), GOLD, 1);
  });

  // ───────── Lange Beine in dunklen Strümpfen, spitze Stiefeletten ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -42, x * 1.15, -9, 4.4, 3.4), HOSE, 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.2;
      g.mat(path([[fx - 3.6, -11], [fx + 3.6, -11.6], [fx + 4, -4], [fx + 11, -1.6, 1], [fx + 9, 0, 1], [fx - 4.4, 0, 1]]), '#2a2030', 'leather', { hi: 0.6 });
      g.mat(rrect(fx - 4, -13, 8.2, 2.6, 1), GOLD, 'gold', { lod: 1 });
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm (Abzugshand) ─────────
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => g.mat(limb(-8, -67, 8, -56, 4.2, 3.6), VELVET_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 36, zb: 43 }, (g) => {
    g.mat(path([[6, -58], [12, -58.4], [13, -54], [10, -51.6], [6, -53]]), SKIN, 'skin');
    g.mat(path([[5, -58.6], [9.6, -59], [9.8, -52], [5.4, -52.6]]), '#1a1a22', 'leather', { lod: 1 });
  });

  // ───────── Kleid: vorn kurz, hinten lang (Schleppen-Schnitt), Mieder mit Goldknöpfen ─────────
  F.part('skirt', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    const s = path([[-11, -48], [11, -48], [15, -36], [18, -24], [11, -20.6], [3, -18], [-6, -12], [-14, -5], [-19, -3.4, 1], [-17, -14], [-14, -32]]);
    g.mat(s, VELVET, 'cloth', { hi: 0.35 });
    g.clipTo(s, (h) => {
      lines(h, [[[2, -46], [-4, -14]], [[8, -46], [10, -22]], [[-6, -46], [-13, -10]]], VELVET_D, 0.8, 1);
      // Goldborte und Mondsicheln am Saum
      h.stroke(spline([[19, -23.4], [11, -19.6], [3, -17], [-6, -11], [-14, -4], [-20, -2.6]]), GOLD, 1.4);
      for (const [x, y] of [[12, -22], [2, -19.6], [-8, -12]]) {
        h.fill(circle(x, y - 2.6, 1.4), GOLD, { lod: 1 });
        h.fill(circle(x + 0.8, y - 3, 1.2), VELVET, { lod: 1 });
      }
    });
  });
  F.part('bodice', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const b = path([[-9.6, -69], [-2, -71], [7, -71], [11, -69], [11.6, -60], [9, -50], [3, -45, 1], [-3, -50], [-10, -50], [-11, -62]]);
    g.mat(b, VELVET, 'cloth', { hi: 0.45 });
    g.clipTo(b, (h) => {
      h.stroke(polyline([[4, -70], [4, -47]]), VELVET_D, 0.7, { lod: 1 });
      // Schnürung
      for (let y = -67; y < -52; y += 4) h.stroke(polyline([[2, y], [6, y + 2]]), GOLD, 0.5, { lod: 2 });
    });
    for (const y of [-65, -60, -55]) g.mat(circle(7.6, y, 1), GOLD, 'gold', { lod: 1 });
  });
  // Spitzenkrause wie ein Fächer hinter dem Kopf (Medici-Kragen)
  F.part('ruff', { bone: 'torso', z: 27, zb: 38 }, (g) => {
    const pts = arc(4, -71, 17, 15, 180, 360, 12);
    const r = path([[-13, -71], ...pts.map((p) => [p[0], p[1], 1]), [21, -71], [12, -68], [-4, -68]]);
    g.mat(r, LACE, 'cloth', { hi: 0.5 });
    g.lod(1, (h) => {
      for (let a = 195; a <= 345; a += 15) {
        const k = (a * Math.PI) / 180;
        h.stroke(polyline([[4 + Math.cos(k) * 5, -71 + Math.sin(k) * 4], [4 + Math.cos(k) * 16, -71 + Math.sin(k) * 14]]), '#cfc4ae', 0.5);
      }
    });
    g.lod(2, (h) => {
      for (let a = 190; a <= 350; a += 10) {
        const k = (a * Math.PI) / 180;
        h.fill(circle(4 + Math.cos(k) * 16.4, -71 + Math.sin(k) * 14.4, 0.7), '#fffdf6');
      }
    });
  });
  F.part('ruffFront', { bone: 'torso', z: 32, zb: 24 }, (g) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([-5 + i * 2.2, -66.6 + (i % 2 ? 2.4 : 0), i % 2 ? 1 : 0]);
    g.mat(path([[-6, -69], [13, -69], ...pts.reverse()]), LACE, 'cloth', { hi: 0.4 });
  });

  // ───────── Kopf: schmales Gesicht, hohe Wangen, eine Braue hochgezogen ─────────
  F.part('hairdo', { bone: 'head', z: 29, zb: 35 }, (g) => {
    // hochgetürmte Frisur
    g.mat(path([[-6, -86], [-8, -96], [-4, -106], [4, -110], [11, -104], [12, -94], [10, -86]]), HAIR, 'hair', { hi: 0.6 });
    g.lod(1, (h) => lines(h, [[[-4, -94], [2, -106]], [[2, -92], [8, -104]]], '#5a3a52', 0.6, 1));
  });
  F.part('moonPin', { bone: 'head', z: 29.5, zb: 35.5, sig: true }, (g) => {
    const o = arc(-6, -104, 5.4, 5.4, 60, 300, 10);
    const i = arc(-4, -104.6, 4.2, 4.2, 290, 70, 10);
    g.mat(path([...o.map((p, k) => (k === 0 || k === o.length - 1 ? [...p, 1] : p)), ...i]), MOON, 'metal', { hi: 0.9 });
    g.stroke(polyline([[-3, -100], [4, -94]]), MOON, 0.8, { lod: 1 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-5, -86], [4, -88.6], [12.6, -85], [14, -77], [12.4, -71], [7, -67], [1, -68], [-4, -74]]), SKIN, 'skin');
    g.fill(ellipse(10.4, -74.6, 2, 1.2), '#e8a8a0', { op: 0.5, lod: 1 });
  });
  faceSet(F, {
    eyes: [[10.4, -79.2, 2], [4, -79.2, 1.8]],
    iris: '#2a6a50',
    lidColor: SKIN,
    lid: 0.5,
    look: [0.6, 0.4],
    brow: false,
    mouth: [8.4, -71.4, 3.4],
    mood: 'smirk',
    attackMouth: 'clench',
    idle: (g) => {
      // eine Braue spöttisch hoch
      brow(g, [[8.4, -83], [10.4, -84.6], [12.6, -84]], 0.9, HAIR);
      brow(g, [[2.4, -82], [4.4, -82.4], [6, -82]], 0.8, HAIR);
    },
    attack: (g) => {
      brow(g, [[8.4, -82], [10.4, -82.4], [12.6, -82.6]], 1, HAIR);
      brow(g, [[2.4, -82], [4.4, -81.6], [6, -81.2]], 0.9, HAIR);
    },
    replace: {
      // getroffen: empört offener Mund
      hurt: (g, c) => {
        for (const [x, y, r] of [c.E1, c.E2]) {
          g.fill(circle(x, y, r * 1.1), WHITE, { stroke: INK, lw: 0.5 });
          g.fill(circle(x + 0.3, y, r * 0.5), '#2a6a50');
        }
        brow(g, [[8.4, -84.6], [10.4, -85.6], [12.6, -85]], 1, HAIR);
        brow(g, [[2.4, -84], [4.4, -84.6], [6, -84]], 0.9, HAIR);
        g.fill(ellipse(8.6, -71, 1.8, 2), '#7a2a3a', { stroke: INK, lw: 0.5 });
      },
    },
  });
  F.part('lips', { bone: 'head', z: 32.5, view: 'front', expr: ['idle', 'attack', 'sleep'] }, (g) => {
    g.stroke(spline([[6.6, -71.4], [8.6, -71.8], [10.6, -71.2]]), '#a83a4a', 0.9);
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[9.6, -79], [12.2, -75.2], [9.8, -74.6]]), '#e4b8a0', 'skin', { line: '#b8866a', lw: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-5, -88], [13, -88], [13.6, -76], [8, -68], [0, -69], [-5, -75]]), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('hairFront', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[-5.6, -78], [-5, -86], [2, -90], [10, -89], [14, -84], [8, -85.6], [2, -84.6], [-2, -80]]), HAIR, 'hair', { hi: 0.5 });
  });
  // Krone mit Juwel (Kronenjuwel = Teamzone)
  F.part('crown', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-3, -89], [-4, -96, 1], [-0.6, -93], [2.4, -98.6, 1], [5.4, -93], [8.6, -97.6, 1], [11, -92.6], [11.6, -88.6]]), GOLD, 'gold', { hi: 0.9 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-4, -96.4], [2.4, -99], [8.6, -98]]) h.fill(circle(x, y, 0.9), '#fff4c0');
    });
  });
  F.part('crownJewel', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(poly([[3.6, -93.6], [5.6, -91.2], [3.6, -88.8], [1.6, -91.2]], 0.3), P.team, 'gem', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Mondsichel-Armbrust (Signature) und vorderer Arm ─────────
  F.part('crossbow', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    // Schaft mit Kronen-Knauf und Kurbel
    g.mat(path([[0, -55], [32, -55.6], [33, -51.6], [14, -50.6], [8, -46.6], [2, -47.4], [0, -50]]), STOCK, 'wood', { hi: 0.5 });
    g.mat(path([[-4, -56], [-3, -60, 1], [-1.4, -57.6], [0.4, -60.6, 1], [2, -57.6], [3.6, -60, 1], [3, -55], [2, -48], [-2, -48]]), GOLD, 'gold');
    g.lod(1, (h) => {
      h.stroke(polyline([[4, -53.4], [30, -54]]), '#7a4a32', 0.5);
      h.stroke(circle(12, -50.6, 1.6), GOLD, 0.6);
      h.stroke(polyline([[12, -50.6], [11, -46]]), GOLD, 0.6);
      h.fill(circle(11, -45.6, 0.9), GOLD);
    });
  });
  F.part('sickle', { bone: 'prop', z: 38.5, zb: 3.5, sig: true }, (g) => {
    // Bogenarme als Mondsichel: außen Gold, innen Silberkante
    const outer = arc(29, -53.6, 11, 19, -90, 90, 14);
    const inner = arc(29, -53.6, 5, 19, 84, -84, 12);
    g.mat(path([...outer.map((p, i) => (i === 0 || i === outer.length - 1 ? [...p, 1] : p)), ...inner]), GOLD, 'gold', { hi: 0.9 });
    g.stroke(spline(arc(29, -53.6, 5.6, 17, -70, 70, 10)), MOON, 1.3);
  });
  F.part('string', { bone: 'prop', z: 37.5, zb: 3.4 }, (g) => {
    g.stroke(polyline([[29, -72.4], [20, -54.6], [29, -34.8]]), '#e8e0d0', 0.6);
  });
  F.part('bolt', { bone: 'prop', z: 38.6, zb: 4.6, state: ['loaded', 'idle', 'walk', 'hit', 'spawn', 'ability', 'stun', 'sleep', 'charge'] }, (g) => {
    g.mat(rrect(18, -57, 26, 1.6, 0.6), '#d8c8a8', 'wood');
    g.mat(path([[43, -58.4], [48, -56.2], [43, -54]]), MOON, 'metal');
    // Mond-Federn
    g.mat(path([[18, -57], [22, -60, 1], [24, -57]]), MOON, 'cloth', { lod: 1 });
    g.mat(path([[18, -55.4], [22, -52.6, 1], [24, -55.4]]), '#b8c4d8', 'cloth', { lod: 1 });
  });
  F.part('muzzle', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    for (const [x, y, r] of [[40, -62, 1.6], [44, -50, 1.2], [36, -48, 1], [42, -58, 1]]) g.fill(circle(x, y, r), '#ffe08a');
    g.stroke(spline(arc(29, -53.6, 13, 19, -70, 70, 8)), '#fff4c8', 1.4, { op: 0.8 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(11, -67, 20, -55, 4.4, 3.8), VELVET, 'cloth');
    g.mat(path([[7.6, -70], [14, -70.6], [15.4, -63], [9, -61.6]]), VELVET_D, 'cloth', { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(path([[18, -56.6], [24, -56.6], [25, -52], [21, -50], [17.6, -52]]), SKIN, 'skin');
    g.mat(path([[17, -57.4], [21.6, -57.6], [21.6, -50.6], [17, -51.6]]), '#1a1a22', 'leather', { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 25, -4, -60, 2.3, { zb: 25 });

  // ───────── Tarnumhang (Fähigkeit): Schleppe über dem Kopf, leuchtende Augen ─────────
  F.part('veil', { bone: 'head', z: 37, zb: 46, state: 'ability' }, (g) => {
    g.mat(path([[-14, -66], [-12, -88], [-2, -102], [10, -100], [18, -90], [16, -74], [10, -80], [2, -82], [-6, -76]]), VELVET_D, 'cloth', { hi: 0.4 });
    g.stroke(spline([[-12, -86], [0, -101], [16, -90]]), GOLD, 0.9);
  });
  F.part('veilEyes', { bone: 'head', z: 37.5, state: 'ability', glow: true }, (g) => {
    for (const x of [4, 10.4]) g.fill(ellipse(x, -79.4, 1.8, 1), '#b8fff0');
  });

  F.anim({
    // zupft mit spitzen Fingern an der Sehne, streicht die Krause glatt
    idle: {
      p: { breathe: 0.02, bob: 0.4, sway: 0.8, tilt: 1.5 },
      keys: { armB: { r: [[0, 0], [0.2, 0], [0.3, -18], [0.4, -12], [0.5, -18], [0.6, 0], [1, 0]] }, handB: { r: [[0, 0], [0.3, -20], [0.5, -20], [0.6, 0]] }, cape: { r: [[0, 0], [0.5, -3], [1, 0]] } },
    },
    // gemessener Schritt, die Schleppe zieht nach
    walk: { p: { stride: 16, bob: 1.2, armSwing: 4, lean: 0, capeAmp: 6 }, ev: { step: [0.25, 0.75] } },
    // anlegen, Kopf neigen, Schuss – die Sichel federt
    attack: {
      prog: 'atk.shoot',
      hit: 0.6,
      p: { armFAim: -48, armBAim: -38, propAim: 48, handBAim: 30, recoil: 3, kick: 5, kickArm: 4, lean: 1, aimHead: 6, flash: 0.15 },
      keys: { layer: [[0, 0.75, 'armB', 37, 37], [0, 0.75, 'handB', 42, 42]] },
      ev: { release: 0.6 },
    },
    // Kopf zur Seite, die Krause wackelt
    hit: { p: { knock: 2, recoil: 5 }, keys: { head: { r: [[0, 0], [0.2, -14], [1, 0]] } } },
    // schwebt mit gebauschter Schleppe herab
    spawn: { keys: { root: { y: [[0, -20], [0.6, 0, 'out']] }, cape: { r: [[0, -20], [0.7, 0]] } } },
    // Schleppe über den Kopf werfen, verschwinden
    ability: { prog: 'still', keys: { armB: { r: [[0, 0], [0.3, -150], [1, -150]] }, cape: { r: [[0, 0], [0.3, -20], [1, -20]] }, alpha: [[0, 1], [0.5, 1], [1, 0.4]] }, ev: { ability: 0.3 } },
    // sinkt auf die Knie, die Krone rutscht, die Schleppe deckt sie zu
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        root: { sy: [[0, 1], [0.4, 0.8, 'in'], [0.5, 0.84], [1, 0.82]], sx: [[0, 1], [0.4, 1.06], [1, 1.06]] },
        torso: { r: [[0, 0], [0.45, 8]] },
        head: { r: [[0, 0], [0.5, 18]] },
        armF: { r: [[0, 0], [0.45, 30]] },
        prop: { r: [[0, 0], [0.45, 30]] },
        hat: { r: [[0, 0], [0.4, 0], [0.75, 38, 'out']], x: [[0, 0], [0.4, 0], [0.75, 8]], y: [[0, 0], [0.4, 0], [0.75, 6]] },
        alpha: [[0, 1], [0.65, 1], [1, 0]],
      },
    },
  });
}
