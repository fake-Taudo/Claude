// Holzfäller – schlaksiger, hektischer Waldarbeiter mit Zweigen im Bart und Holzkraxe samt Wutflasche
// (Brief: docs/briefs/lumberjack.md). Form „ghost“: violett leuchtender Geist ohne Beine, der in der Wutpfütze weiterhackt.
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function lumberjack(F) {
  const P = F.pal;
  const BASE = {
    shirt: P.main,
    shirtD: '#1f4a28',
    check: '#c25b2c',
    skin: '#e8b48c',
    skinD: '#c88a68',
    beard: '#8a5a2a',
    beardD: '#5e3a1a',
    cap: P.acc,
    capD: '#8a3a1a',
    brace: '#6a3a1e',
    handle: '#a8763e',
    blade: '#9aa3ad',
    edge: '#e8eef4',
    twig: '#4a8a3a',
  };
  const GHOST = {
    shirt: '#9a6ad8',
    shirtD: '#6a3aa8',
    check: '#c8a2ff',
    skin: '#d8c0ff',
    skinD: '#a888e0',
    beard: '#8a5ac8',
    beardD: '#5a3a98',
    cap: '#b88aff',
    capD: '#7a4ac8',
    brace: '#6a3aa8',
    handle: '#b89aff',
    blade: '#e0d0ff',
    edge: '#ffffff',
    twig: '#c8a2ff',
  };
  const WOOD = '#a8763e';
  const RAGE = '#c45cff';
  const PANTS = '#4a5266';
  const BOOT = '#5a3a22';

  F.rig('biped', {
    hip: [0, -41],
    torso: [0, -44],
    head: [4, -69],
    hat: [4, -88],
    back: [-11, -60],
    armB: [-8, -67],
    handB: [-10, -45],
    armF: [11, -67],
    handF: [19, -47],
    prop: [19, -47],
    legB: [-4, -41],
    footB: [-5, -6],
    legF: [5, -41],
    footF: [6, -6],
    cape: [0, -66],
  });
  F.meta.formLook = { ghost: { alpha: 0.72 } };

  // Teil in Normal- und Geistform anlegen (Geist: violette Töne, eigener Name)
  const two = (name, o, fn) => {
    F.part(name, { ...o, form: 'base' }, (g) => fn(g, BASE));
    F.part(name + 'G', { ...o, form: 'ghost' }, (g) => fn(g, GHOST));
  };

  // ───────── Holzkraxe (Signature): Lattengestell, drei Scheite, Wutflasche mit Korken ─────────
  F.part('kraxe', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    for (const [x0, x1] of [[-25, -24], [-11, -10]]) g.mat(path([[x0 - 1.4, -32], [x0 + 1.4, -32], [x1 + 1.4, -98], [x1 - 1.4, -98]]), WOOD, 'wood');
    for (const y of [-38, -62, -92]) g.mat(rrect(-27, y - 1.4, 19, 2.8, 0.8), '#8a5a2e', 'wood');
    g.lod(1, (h) => lines(h, [[[-24, -40], [-23, -90]], [[-11, -40], [-10, -90]]], '#6a4220', 0.4, 1));
    // drei Scheite, stehend, mit Jahresringen oben
    for (const [x, top, w] of [[-21.4, -104, 5], [-16, -100, 5.6], [-12.6, -95, 4.4]]) {
      g.mat(rrect(x - w / 2, top, w, -62 - top, 1), '#8a5a2e', 'wood', { hi: 0.4 });
      g.mat(ellipse(x, top, w / 2, 1.4), '#e8c890', 'wood');
      g.lod(1, (h) => h.stroke(ellipse(x, top, w / 4, 0.7), '#b88a50', 0.4));
    }
    g.lod(1, (h) => lines(h, [[[-20, -96], [-20, -70]], [[-15, -92], [-15, -68]]], '#6a4220', 0.5, 1));
  });
  F.part('rageBottle', { bone: 'back', z: 3.5, zb: 46.5, state: ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'intact'] }, (g) => {
    g.mat(path([[-30, -60], [-28.6, -66], [-28.6, -70], [-25.4, -70], [-25.4, -66], [-24, -60], [-24, -50, 1], [-30, -50, 1]]), RAGE, 'glass', { line: '#7a2aa8' });
    g.mat(rrect(-28.6, -73, 3.2, 3.4, 1), '#c8a070', 'wood');
    g.fill(ellipse(-28, -57, 1, 3), '#f0d0ff', { op: 0.7, lod: 1 });
  });
  F.part('rageGlow', { bone: 'back', z: 3.6, zb: 46.6, glow: true, state: ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'intact'] }, (g) => g.fill(circle(-27, -56, 4.6), RAGE, { op: 0.35 }));
  F.part('rageSplash', { bone: 'back', z: 47, zb: 47, state: 'smash', glow: true }, (g) => {
    g.fill(blob([[-36, -60], [-30, -70], [-22, -66], [-18, -58], [-24, -50], [-34, -50]], 0.6), RAGE, { op: 0.75 });
    for (const [x, y, r] of [[-40, -68, 2], [-16, -70, 1.6], [-38, -48, 1.4], [-14, -52, 1.8]]) g.fill(circle(x, y, r), '#e0a0ff');
    g.mat(path([[-30, -62], [-28, -66], [-26, -62]]), '#f0d0ff', 'glass');
  });
  F.part('evoBottle', { bone: 'back', z: 3.7, zb: 46.7, evo: 'evo', glow: true }, (g) => {
    g.mat(path([[-9, -86], [-8, -90], [-6, -90], [-5, -86], [-4.6, -78, 1], [-9.4, -78, 1]]), '#e0b0ff', 'glass', { line: '#9a4ad8' });
    g.fill(circle(-7, -82, 3.4), RAGE, { op: 0.45 });
  });

  // ───────── Beine (nur Normalform): Arbeitshose mit Knieflicken, Schnürstiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z, form: 'base' }, (g) => {
      g.mat(limb(x, -41, x * 1.1, -9, 5.2, 4.4), PANTS, 'cloth');
      g.mat(rrect(x * 1.05 - 3.4, -26, 6.8, 6.4, 1.4), '#7a6a4a', 'cloth', { lod: 1 });
      g.lod(2, (h) => stitches(h, [[x * 1.05 - 3, -26.4], [x * 1.05 + 3, -26.4]], '#c8b890'));
    });
    F.part(foot, { bone: foot, z: z + 1, form: 'base' }, (g) => {
      const fx = x * 1.2;
      g.mat(path([[fx - 4.8, -13], [fx + 4.4, -13.6], [fx + 4.6, -5], [fx + 10, -3], [fx + 10, 0, 1], [fx - 5.4, 0, 1]]), BOOT, 'leather', { hi: 0.5 });
      g.lod(1, (h) => lines(h, [[[fx - 2, -11], [fx + 2.6, -9.6]], [[fx - 2, -8], [fx + 2.6, -6.6]]], '#e8d8b8', 0.5, 1));
      g.mat(rrect(fx - 5.6, -1.6, 16, 1.6, 0.6), '#2e2014', 'leather');
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 5, 8);
  // Geisterschweif statt Beinen
  F.part('wisp', { bone: 'hip', z: 8, form: 'ghost' }, (g) => {
    g.mat(path([[-11, -44], [11, -44], [9, -30], [4, -20], [-2, -12], [-10, -4, 1], [-6, -14], [-12, -20, 1], [-8, -26], [-13, -32]]), GHOST.shirtD, 'cloth', { hi: 0.6 });
  });
  F.part('wispGlow', { bone: 'hip', z: 8.5, form: 'ghost', glow: true }, (g) => {
    for (const [x, y, r] of [[-8, -10, 2], [-12, -20, 1.4], [2, -16, 1.6]]) g.fill(circle(x, y, r), '#e0c0ff', { op: 0.7 });
  });

  // ───────── Hinterer Arm ─────────
  two('armB', { bone: 'armB', z: 10, zb: 42 }, (g, C) => {
    g.mat(limb(-8, -67, -9, -58, 4.8, 4.6), C.shirt, 'cloth');
    g.mat(limb(-9, -57, -10, -46, 3.8, 3.4), C.skin, 'skin');
    g.mat(rrect(-14, -60, 9.6, 4, 1.6), C.shirtD, 'cloth');
  });
  two('handB', { bone: 'handB', z: 11, zb: 43 }, (g, C) => g.mat(circle(-10, -44, 3.4), C.skin, 'skin'));

  // ───────── Rumpf: Karohemd, Hosenträger, Kraxengurt ─────────
  two('torso', { bone: 'torso', z: 20, zb: 20 }, (g, C) => {
    const t = path([[-10, -67], [-2, -69.6], [7, -69.6], [11, -67], [12, -52], [11, -40], [-10, -40], [-11, -52]]);
    g.mat(t, C.shirt, 'cloth');
    g.clipTo(t, (h) => {
      for (let x = -10; x < 13; x += 5) h.fill(rrect(x, -70, 2, 32, 0), C.shirtD, { op: 0.6, lod: 1 });
      for (let y = -68; y < -40; y += 5) h.fill(rrect(-12, y, 26, 2, 0), C.shirtD, { op: 0.45, lod: 1 });
      for (let x = -9; x < 13; x += 5) h.stroke(polyline([[x, -70], [x, -40]]), C.check, 0.4, { lod: 2 });
      for (let y = -66.4; y < -40; y += 5) h.stroke(polyline([[-12, y], [14, y]]), C.check, 0.4, { lod: 2 });
    });
  });
  two('braces', { bone: 'torso', z: 22, zb: 22 }, (g, C) => {
    g.mat(path([[1, -69], [4, -69], [6, -40], [3, -40]]), C.brace, 'leather');
    g.mat(path([[8, -68], [10.4, -67.6], [11.4, -40], [9, -40]]), C.brace, 'leather');
    g.mat(circle(4.6, -43, 1.1), '#c8a046', 'gold', { lod: 1 });
  });
  F.part('belt', { bone: 'hip', z: 21, form: 'base' }, (g) => {
    g.mat(rrect(-11, -43, 23, 4.4, 1), '#3a2a1c', 'leather');
    g.mat(rrect(4, -43.6, 5, 5.6, 1), '#c8a046', 'gold', { lod: 1 });
  });
  F.part('strapF', { bone: 'torso', z: 23, view: 'front' }, (g) => g.mat(path([[-8, -69], [-4, -69.6], [-6, -52], [-10, -48]]), '#6a4a2a', 'leather'));
  // Halstuch (Teamzone)
  F.part('neckerchief', { bone: 'torso', z: 24, zb: 24, team: true, form: ['base', 'ghost'] }, (g) => {
    g.mat(path([[-6, -70.4], [11, -70.4], [9, -66], [5, -60, 1], [1, -66], [-5, -67]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(circle(5, -66.6, 1.8), P.teamShade, 'cloth', { lod: 1 });
  });

  // ───────── Kopf: langes Gesicht, große Nase, Zweigbart, Strickmütze ─────────
  two('head', { bone: 'head', z: 30, zb: 30 }, (g, C) => {
    g.mat(path([[-5, -86], [4, -88.6], [12.6, -85], [14.4, -76], [13, -68], [-4, -68], [-5.6, -76]]), C.skin, 'skin');
    g.mat(ellipse(-4.6, -76, 2, 3), C.skinD, 'skin');
  });
  F.defaultForm = ['base', 'ghost'];
  const face = faceSet(F, {
    eyes: [[10.6, -79, 2.4], [4.4, -79, 2.2]],
    iris: '#3a5a2a',
    lidColor: BASE.skin,
    lid: 0,
    look: [0.7, -0.1],
    brow: { color: BASE.beardD, w: 1.3, lift: 1.4 },
    mouth: [8.6, -70.6, 6],
    mood: 'grin',
    attackMouth: 'grit',
    idleTilt: -0.5,
  });
  F.defaultForm = undefined;
  two('beard', { bone: 'head', z: 33, zb: 31 }, (g, C) => {
    // Vollbart unter dem Mund, Koteletten an der Wange
    const b = path([[-4.6, -76], [-1, -74], [1, -68.6], [5, -68.4, 1], [8.6, -66.6], [12, -68.4, 1], [15, -70], [16, -64], [13, -57], [8, -52, 1], [4, -56], [-1, -54, 1], [-2, -61], [-5, -67]]);
    g.mat(b, C.beard, 'hair', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[2, -64], [3, -57]], [[8, -64], [8, -55]], [[12, -65], [13, -60]]], C.beardD, 0.6, 1));
  });
  two('mustache', { bone: 'head', z: 33.2, view: 'front' }, (g, C) => {
    g.mat(path([[5, -71.6], [8.6, -73.4], [12.6, -72.4], [15.4, -70.4, 1], [12, -71], [8.6, -71.6], [6, -70.4, 1]]), C.beard, 'hair', { hi: 0.4 });
  });
  two('twigs', { bone: 'head', z: 33.5, zb: 31.5 }, (g, C) => {
    for (const [x, y, a] of [[2, -60, -30], [12, -62, 30], [6, -56, 0]]) {
      const r = (a * Math.PI) / 180;
      const dx = Math.sin(r) * 6;
      const dy = -Math.cos(r) * 6;
      g.stroke(polyline([[x, y], [x + dx, y + dy]]), '#6a4a22', 0.8);
      for (let k = 0.3; k < 1; k += 0.25) {
        const px = x + dx * k;
        const py = y + dy * k;
        g.stroke(polyline([[px, py], [px - 1.6, py - 1.4]]), C.twig, 0.6, { lod: 1 });
        g.stroke(polyline([[px, py], [px + 1.6, py - 1.4]]), C.twig, 0.6, { lod: 1 });
      }
    }
  });
  F.part('fireflies', { bone: 'head', z: 34, evo: 'evo', glow: true }, (g) => {
    for (const [x, y] of [[0, -58], [15, -60], [8, -52], [18, -68]]) g.fill(circle(x, y, 1.1), '#e8b8ff');
  });
  two('nose', { bone: 'head', z: 34.5, view: 'front' }, (g, C) => {
    g.mat(path([[9, -80], [15.6, -74, 1], [13, -71.6], [9.6, -73]]), C.skinD, 'skin', { line: '#9a5a44', lw: 0.5 });
    g.fill(ellipse(14, -73.6, 1.4, 1), '#d87a6a', { op: 0.6, lod: 1 });
  });
  two('headBack', { bone: 'head', z: 34, view: 'back' }, (g, C) => {
    g.mat(path([[-5, -84], [14, -84], [15, -70], [10, -60], [0, -60], [-5, -70]]), C.beard, 'hair');
  });
  F.part('pencil', { bone: 'head', z: 34.6, view: 'front', form: 'base' }, (g) => {
    g.mat(rrect(-9, -85, 10, 1.8, 0.6).rot(-14, -4, -84), '#e8c040', 'wood');
    g.fill(path([[0.6, -86.6], [3, -87.4], [1, -85.2]]), '#3a3a3a');
  });
  two('beanie', { bone: 'hat', z: 36, zb: 36 }, (g, C) => {
    g.mat(path([[-6, -84], [-5, -94], [2, -99], [10, -97], [14, -90], [14, -84]]), C.cap, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-2, -86], [0, -96]], [[3, -86], [4, -98]], [[8, -86], [8, -97]]], C.capD, 0.6, 1));
    g.mat(circle(-6, -96, 3), C.cap, 'cloth');
  });
  // Mützenband (Teamzone)
  F.part('capBand', { bone: 'hat', z: 36.5, zb: 36.5, team: true, form: ['base', 'ghost'] }, (g) => {
    g.mat(rrect(-7, -88.6, 22, 5, 2), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let x = -5; x < 14; x += 2.6) h.stroke(polyline([[x, -88], [x, -84.2]]), P.teamShade, 0.5);
    });
  });

  // ───────── Fällaxt mit langem gebogenem Stiel und schmalem Keilblatt ─────────
  two('axe', { bone: 'prop', z: 38, zb: 4 }, (g, C) => {
    g.mat(path([[17, -42], [20.4, -42.6], [23, -60], [25.4, -80], [26, -88], [23, -88.4], [22, -80], [19.6, -62]]), C.handle, 'wood', { hi: 0.5 });
    g.lod(1, (h) => h.stroke(spline([[18.6, -46], [21.4, -62], [24, -84]]), '#7a4a22', 0.4));
    const blade = path([[23, -90], [33, -94], [37, -96, 1], [37.6, -84, 1], [33, -84], [31, -86.4], [29, -84], [23, -82]]);
    g.mat(blade, C.blade, 'metal', { hi: 0.9 });
    g.stroke(polyline([[37, -95.6], [37.6, -84.4]]), C.edge, 1.1);
    g.mat(rrect(16, -40, 5, 4, 1.4), '#5a3a1e', 'wood');
  });
  F.part('evoEdge', { bone: 'prop', z: 38.5, zb: 4.5, evo: 'evo', glow: true }, (g) => g.stroke(polyline([[36.6, -96], [37.6, -84]]), RAGE, 2));
  F.part('axeGlow', { bone: 'prop', z: 38.6, zb: 4.6, form: 'ghost', glow: true }, (g) => {
    g.fill(ellipse(31, -89, 9, 7), '#d8a8ff', { op: 0.45 });
    g.stroke(spline([[22, -46], [24, -70], [26, -86]]), '#f0e0ff', 1, { op: 0.8 });
  });

  // ───────── Vorderer Arm mit hochgekrempeltem Ärmel ─────────
  two('armF', { bone: 'armF', z: 29, zb: 6 }, (g, C) => {
    g.mat(limb(11, -67, 14, -58, 4.8, 4.6), C.shirt, 'cloth');
    g.mat(limb(14, -57, 18, -48, 3.8, 3.4), C.skin, 'skin');
    g.mat(rrect(9.6, -61, 9.6, 4, 1.6).rot(18, 14, -59), C.shirtD, 'cloth');
    g.lod(2, (h) => lines(h, [[[15, -54], [16.4, -53]], [[16, -51], [17.4, -50]]], C.skinD, 0.4, 2));
  });
  two('handF', { bone: 'handF', z: 41, zb: 7 }, (g, C) => g.mat(path([[16, -50], [21.4, -50.4], [22.6, -45.6], [19, -42.6], [15.6, -44.6]]), C.skin, 'skin'));
  emblem(F, 'emblem', 'torso', 25, -5, -46, 2.2, { zb: 25, form: ['base', 'ghost'] });

  F.anim({
    // wirft die Axt hoch, fängt sie, zupft einen Zweig aus dem Bart
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 1.5, tilt: 3 },
      keys: {
        prop: { y: [[0, 0], [0.15, 0], [0.3, -26, 'out'], [0.45, 0, 'in'], [1, 0]], r: [[0, 0], [0.15, 0], [0.45, 360], [1, 360]] },
        armF: { r: [[0, 0], [0.12, 10], [0.18, -30], [0.3, -10], [0.45, -20], [0.55, 0]] },
        armB: { r: [[0, 0], [0.6, 0], [0.7, -150], [0.85, -150], [0.95, 0]] },
        head: { r: [[0, 0], [0.7, 0], [0.78, 8], [0.85, 8], [0.95, 0]] },
      },
    },
    // schnelle lange Schritte, die Kraxe hüpft
    walk: { prog: 'biped.run', p: { stride: 30, bob: 3.4, armSwing: 18, lean: 6 }, keys: { back: { y: [[0, 0], [0.25, -2], [0.5, 0], [0.75, -2], [1, 0]] } }, ev: { step: [0.25, 0.75] } },
    // Holzhacker-Hieb mit kurzer Anticipation
    attack: { prog: 'atk.swing', hit: 0.45, p: { wind: -190, strike: -75, over: 14, cock: 0, snap: 180, lean: 12, lunge: 16 }, keys: { armB: { r: [[0, 0], [0.36, -160], [0.45, -70], [1, 0]] } }, ev: { release: 0.45 } },
    // Scheite klappern in der Kraxe
    hit: { p: { knock: 2.2, recoil: 5 }, keys: { back: { r: [[0, 0], [0.15, -6], [0.3, 4], [0.5, 0]] } } },
    spawn: { keys: { back: { y: [[0, -6], [0.5, -6], [0.7, 2], [0.85, 0]] } } },
    // fällt um, die Wutflasche zerbricht
    death: { p: { dir: 1, angle: 80 }, keys: { show: { intact: [[0, 0.45]], smash: [[0.45, 1.01]] } } },
  });
}
