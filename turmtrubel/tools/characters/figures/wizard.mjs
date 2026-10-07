// Magier – theatralischer Feuermagier in weinroter Robe mit Ballonärmeln, dirigiert ein fliegendes Zauberbuch
// (Brief: docs/briefs/wizard.md). o.hero: großspuriger Held mit Flammenumhang, der sich zu Feuerflügeln öffnet (wizard-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function wizard(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const ROBE = P.main;
  const FIRE = P.acc;
  const LEATHER = '#5a3a28';
  const BEARD = '#d8d0c4';
  const SKIN = '#e8b894';
  const ROBE_D = H ? '#8a1e5a' : '#6a1e40';
  const PAGE = '#f4ead2';

  F.rig('robe', {
    hip: [0, -36],
    skirt: [0, -36],
    torso: [0, -39],
    head: [3, -64],
    hat: [3, -78],
    armB: [-11, -60],
    handB: [-15, -44],
    armF: [11, -60],
    handF: [17, -46],
    prop: [17, -46],
    cape: [-4, -62],
    buddy: [30, -62],
  });

  if (H) {
    // Flammenumhang (Rang-Merkmal): breiter Umhang mit Flammenrand, öffnet sich im Flug zu Flügeln
    F.part('flameCape', { bone: 'cape', z: 2, zb: 46, sig: true }, (g) => {
      const c = path([[-10, -62], [8, -62], [14, -40], [18, -6], [8, -10], [2, -4], [-6, -10], [-14, -4], [-22, -10], [-20, -40]]);
      g.mat(c, '#5a1a3a', 'cloth', { hi: 0.3 });
      for (const [x, y] of [[-20, -10], [-12, -6], [-4, -10], [4, -6], [12, -10]]) g.fill(path([[x - 3, y], [x, y - 7, 1], [x + 3, y]]), FIRE);
    });
    F.part('flameCapeGlow', { bone: 'cape', z: 2.5, zb: 46.5, glow: true }, (g) => {
      for (const [x, y] of [[-20, -10], [-12, -6], [-4, -10], [4, -6], [12, -10]]) g.fill(circle(x, y - 3, 3.4), '#ffb050', { op: 0.5 });
    });
  }

  // ───────── Hinterer Ballonärmel mit Taktstock-Hand ─────────
  const sleeve = (x0, s, color) => {
    const X = (x) => x0 + x * s;
    return blob([[X(-2), -62], [X(6), -60], [X(10), -52], [X(8), -44], [X(2), -42], [X(-4), -48], [X(-5), -56]], 0.55);
  };
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(sleeve(-12, -1, ROBE_D), ROBE_D, 'cloth', { hi: 0.4 }));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-15, -42, 3), '#d8a47c', 'skin'));

  // ───────── Robe mit Flammenstickerei, Schnabelschuhe ─────────
  F.part('shoes', { bone: 'skirt', z: 6 }, (g) => {
    for (const x of [-6, 7]) g.mat(path([[x - 4, -3], [x + 3, -3], [x + 9, -4, 1], [x + 6, 0, 1], [x - 4.6, 0, 1]]), '#3a2a2a', 'leather');
  });
  F.part('robe', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    const r = path([[-9, -42], [9, -42], [14, -24], [20, -4], [8, -2], [-4, -3], [-20, -3], [-15, -24]]);
    g.mat(r, ROBE, 'cloth', { hi: 0.35 });
    g.clipTo(r, (h) => {
      for (let x = -18; x < 20; x += 6) h.fill(path([[x - 3, -3], [x - 1, -10, 1], [x + 0.6, -6], [x + 2, -12, 1], [x + 3.4, -3]]), FIRE, { op: 0.9, lod: 1 });
      lines(h, [[[-6, -40], [-12, -6]], [[5, -40], [11, -6]]], ROBE_D, 0.8, 1);
      if (!H) h.fill(ellipse(15, -8, 3, 1.6), '#2a1a1a', { op: 0.4, lod: 1 });
    });
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-9, -63], [-2, -65], [8, -65], [11, -62], [11, -44], [9, -38], [-9, -38], [-11, -44]]), ROBE, 'cloth');
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-10.4, -44, 21.6, 4.4, 1.6), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[6, -40], [10, -40], [11, -30], [7, -31]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });
  F.part('buckle', { bone: 'torso', z: 22.5, view: 'front' }, (g) => {
    g.mat(path([[-2, -44.6], [0, -48, 1], [2, -44.6], [1, -40.6], [-1, -40.6]]), FIRE, 'gold', { lod: 1 });
  });

  // ───────── Kopf: langes Gesicht, Spitzbart, Hut mit Knick ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -76], [3, -79], [12.6, -75.6], [14, -66], [12, -58], [6, -54], [0, -55.6], [-5.6, -62]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10.4, -68, 2.2], [3.4, -68, 2]],
    iris: '#3a2a22',
    lidColor: SKIN,
    lid: 0.3,
    brow: { color: BEARD, w: 1.4, lift: 1 },
    idleTilt: -0.9,
    mouth: [8.4, -60.4, 4.4],
    mood: 'smirk',
    attackMouth: 'shout',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[7, -67], [11.6, -62, 1], [7.6, -61.6]]), '#e0a882', 'skin', { line: '#b07a5c', lw: 0.5 }));
  F.part('beard', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(path([[3, -60], [7, -57.4], [12, -58.6], [13, -56], [10, -48], H ? [12, -43, 1] : [8, -42, 1], [5, -50]]), BEARD, 'hair', { hi: 0.4 });
    g.mat(path([[4.6, -62.6], [8.4, -61.6], [12, -62.6], [12.4, -60.4], [8.4, -60], [4.4, -60.6]]), BEARD, 'hair');
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.mat(path([[-6, -74], [14, -74], [14, -64], [8, -56], [-1, -57], [-6, -63]]), '#b8b0a4', 'hair'));
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-12, -72, 1], [-4, -76], [8, -77], [20, -75.4], [24, -72, 1], [12, -73.4], [4, -73.6], [-4, -73]]), ROBE_D, 'cloth');
    // spitzer Hut mit Knick
    g.mat(path([[-3, -75], [0, -86], [4, -96], [-4, -102], [-10, -100, 1], [-4, -98], [-0.4, -95], [12, -76]]), ROBE, 'cloth', { hi: 0.35 });
    g.lod(1, (h) => {
      for (const [x, y] of [[2, -84], [5, -80], [-2, -92]]) h.fill(poly([[x, y - 1.6], [x + 0.6, y - 0.4], [x + 1.6, y - 0.4], [x + 0.8, y + 0.4], [x + 1.2, y + 1.6], [x, y + 0.8], [x - 1.2, y + 1.6], [x - 0.8, y + 0.4], [x - 1.6, y - 0.4], [x - 0.6, y - 0.4]]), '#ffe080');
    });
    if (H) g.fill(path([[-10, -100], [-14, -106, 1], [-11, -104], [-12, -110, 1], [-8, -103]]), FIRE);
  });
  F.part('hatband', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => g.mat(path([[-3, -75.4], [12, -76], [10.6, -79], [-2.4, -78.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 }));

  // ───────── Fliegendes Zauberbuch (Signature) ─────────
  F.part('book', { bone: 'buddy', z: 44, zb: 2, sig: true, state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'charge', 'sleep', 'ability'] }, (g) => {
    g.mat(path([[22, -66], [38, -68], [40, -58], [24, -55]]), LEATHER, 'leather', { hi: 0.4 });
    g.mat(path([[24, -56], [40, -58.6], [40, -56], [24, -53.4]]), PAGE, 'cloth');
    g.mat(rrect(37, -64, 4, 4, 1), '#c8a046', 'gold');
    g.stroke(polyline([[30, -55], [30, -48], [28, -46]]), '#c84a3a', 0.8, { lod: 1 });
    g.stroke(polyline([[32, -55], [33, -49]]), '#3a8ad8', 0.8, { lod: 1 });
  });
  F.part('bookOpen', { bone: 'buddy', z: 44, zb: 2, sig: true, state: ['attack', 'death'] }, (g) => {
    // aufgeschnappt: Deckel oben/unten, Zahnseiten
    g.mat(path([[22, -66], [36, -74], [40, -70], [26, -62]]), LEATHER, 'leather', { hi: 0.4 });
    g.mat(path([[22, -56], [38, -50], [40, -54], [26, -60]]), LEATHER, 'leather', { hi: 0.4 });
    g.fill(path([[26, -62], [40, -70], [40, -54], [26, -60]]), '#3a1418');
    for (let i = 0; i < 4; i++) {
      g.fill(path([[28 + i * 3, -63 + i * -1.6], [29.4 + i * 3, -60 - i * 1.4, 1], [30.8 + i * 3, -63.6 - i * 1.6]]), PAGE);
      g.fill(path([[28 + i * 3, -59.4 + i * 1], [29.4 + i * 3, -62 + i * 0.8, 1], [30.8 + i * 3, -58.8 + i * 1.1]]), PAGE);
    }
  });
  F.part('fireball', { bone: 'buddy', z: 45, state: 'cast', glow: true }, (g) => {
    g.fill(circle(46, -62, 6), FIRE, { op: 0.9 });
    g.fill(circle(45, -62, 3.4), '#fff0a0');
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(sleeve(12, 1, ROBE), ROBE, 'cloth', { hi: 0.4 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(circle(18, -43.6, 3), SKIN, 'skin');
    // Taktstock
    g.stroke(polyline([[19, -44], [28, -52]]), '#2a2420', 1);
    g.fill(circle(28.4, -52.4, 0.9), '#f0f0f0');
  });
  emblem(F, 'emblem', 'torso', 23, -5, -52, 2.4, { zb: 23 });

  // ───────── Evolution (Feuerschild): Kranz aus Flammenblättern, goldener Feuer-Einband ─────────
  if (!H) {
    F.part('evoWreath', { bone: 'root', z: 46, zb: 46, evo: 'evo', glow: true }, (g) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 22;
        const y = -40 + Math.sin(a) * 8;
        g.fill(path([[x - 2.6, y + 2], [x, y - 5, 1], [x + 2.6, y + 2]]), '#ff8a3a', { op: 0.9 });
      }
    });
    F.part('evoBinding', { bone: 'buddy', z: 44.5, evo: 'evo' }, (g) => {
      g.stroke(polyline([[22, -66], [38, -68], [40, -58]]), '#f0c040', 1.4);
    });
    F.part('evoHem', { bone: 'skirt', z: 18.5, evo: 'evo', glow: true }, (g) => {
      g.stroke(polyline([[-20, -3], [-4, -3], [8, -2], [20, -4]]), '#ff9a3a', 1.2);
    });
  }

  F.anim({
    // blättert im schwebenden Buch, das gähnt; Ärmel blähen sich
    idle: H
      ? { p: { breathe: 0.03, bob: 1, sway: 2 }, keys: { root: { y: [[0, -2], [0.5, -4], [1, -2]] }, cape: { r: [[0, 6], [0.5, 12], [1, 6]] }, buddy: { y: [[0, 0], [0.5, -3], [1, 0]] } } }
      : { p: { breathe: 0.03, bob: 0.8, sway: 2 }, keys: { buddy: { y: [[0, 0], [0.25, -3], [0.5, 0], [0.75, -3], [1, 0]], r: [[0, 0], [0.5, -6], [1, 0]] }, armF: { r: [[0, 0], [0.4, -30], [0.6, -30], [0.8, 0]] } } },
    // wehender Schritt, das Buch folgt
    walk: { p: { stride: 10, bob: 1.8, armSwing: 3, skirt: 4 }, keys: { buddy: { y: [[0, -2], [0.5, 2], [1, -2]], x: [[0, -2], [0.5, 0], [1, -2]] } } },
    // hebt den Taktstock, das Buch schnappt auf und spuckt einen Feuerball
    attack: { prog: 'atk.cast', hit: 0.55, p: { wind: -140, strike: -70, windB: -10, strikeB: 0, lean: 6, lunge: 6 }, keys: { buddy: { x: [[0, 0], [0.5, -2], [0.6, 3], [1, 0]] } }, ev: { release: 0.55 } },
    // Hut verrutscht, das Buch klappt zu
    hit: { p: { knock: 1.6, recoil: 4 }, keys: { hat: { r: [[0, 0], [0.2, 12], [1, 0]] } } },
    spawn: { keys: { buddy: { y: [[0, -10], [0.6, 0, 'out']] } } },
    death: { p: { dir: -1, angle: 60 }, keys: { buddy: { y: [[0, 0], [0.5, 40, 'in']], r: [[0, 0], [0.5, 60]] } } },
    ...(H
      ? {
          // Feuriger Flug: Umhang zu Flügeln, Füße hoch
          ability: { prog: 'biped.idle', keys: { root: { y: [[0, 0], [0.3, -18, 'out'], [0.8, -18], [1, 0, 'in']] }, cape: { sx: [[0, 1], [0.3, 1.6], [0.8, 1.6], [1, 1]], r: [[0, 0], [0.3, 30], [0.8, 30], [1, 0]] }, skirt: { r: [[0, 0], [0.3, 14], [0.8, 14], [1, 0]] } }, ev: { ability: 0.3 } },
        }
      : {}),
  });
}
