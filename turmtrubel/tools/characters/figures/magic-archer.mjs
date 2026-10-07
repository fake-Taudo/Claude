// Magieschütze – verträumter Sterngucker mit Astrolabium-Hut und Fernrohr-Bogen, schießt Lichtpfeile
// (Brief: docs/briefs/magic-archer.md). o.hero: Sternbild-Mantel mit drei Pfeilsternen und Lockvogel-Form (magic-archer-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { faceSet, eye, eyeClosed, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function magicArcher(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const COAT = P.main;
  const LIGHT = P.acc;
  const BRASS = '#c8a046';
  const SKIN = '#e8c4a0';
  const HAIR = '#5a4a6a';
  const COAT_D = H ? '#4a3a90' : '#2a1d50';
  const BOW = '#6a4a2a';
  if (H) {
    // Lockvogel: dieselbe Figur, halb durchsichtig mit Mintschimmer
    F.defaultForm = ['base', 'decoy'];
    F.meta.formLook = { decoy: { alpha: 0.55 } };
  }

  F.rig('biped', {
    hip: [0, -38],
    torso: [0, -41],
    head: [3, -72],
    hat: [3, -88],
    armB: [-9, -68],
    handB: [-12, -50],
    armF: [10, -68],
    handF: [15, -50],
    prop: [15, -50],
    legB: [-5, -38],
    footB: [-6, -8],
    legF: [5, -38],
    footF: [6, -8],
    cape: [-3, -70],
  });

  // ───────── Mantel hinten (Futter mit Sternkarte = Teamzone) ─────────
  F.part('coatBack', { bone: 'cape', z: 3, zb: 46 }, (g) => {
    const c = path([[-10, -70], [6, -70], [10, -40], [14, -10], [2, -6], [-10, -8], [-20, -6], [-18, -40]]);
    g.mat(c, COAT_D, 'cloth');
  });
  F.part('lining', { bone: 'cape', z: 3.5, zb: 46.5, team: true }, (g) => {
    const l = path([[-17, -40], [-12, -40], [-12, -10], [-20, -6]]);
    g.mat(l, P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (const [x, y] of [[-15.6, -32], [-14, -24], [-16.4, -16], [-13.4, -12]]) h.fill(circle(x, y, 0.7), P.symbol);
      h.stroke(polyline([[-15.6, -32], [-14, -24], [-16.4, -16]]), P.teamLight, 0.4);
    });
  });

  // ───────── Lange Beine, Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -40, x * 1.1, -14, 5, 4.6), '#3a3048', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 4.4, -18], [fx + 4.6, -19], [fx + 4.4, -7], [fx + 9.4, -3.4], [fx + 9.6, 0, 1], [fx - 5.2, 0, 1], [fx - 5.4, -7]]), '#4a3424', 'leather');
      g.mat(rrect(fx - 1, -12, 3, 2.4, 0.6), BRASS, 'gold', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm mit Lichtpfeil ─────────
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => g.mat(limb(-9, -68, -12, -52, 4.6, 4.2), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 13, zb: 43 }, (g) => g.mat(circle(-12, -49.4, 3), SKIN, 'skin'));
  F.part('nockArrow', { bone: 'handB', z: 16, zb: 44, state: 'loaded', glow: true }, (g) => {
    g.stroke(polyline([[-12, -49.4], [16, -49.4]]), LIGHT, 1.6);
    g.fill(poly([[16, -51.6], [21, -49.4], [16, -47.2]]), '#fffbe0');
    g.fill(circle(2, -49.4, 3.4), LIGHT, { op: 0.3 });
  });

  // ───────── Mantel vorn ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-9, -70], [-2, -72.6], [7, -72.6], [11, -70], [12, -52], [12, -36], [14, -14], [6, -12], [2, -36], [-2, -36], [-6, -12], [-14, -14], [-11.6, -36], [-12, -52]]);
    g.mat(c, COAT, 'cloth');
    g.stroke(polyline([[2, -72], [2, -36]]), BRASS, 0.8, { lod: 1 });
    for (const y of [-64, -56, -48]) g.mat(circle(2, y, 1), BRASS, 'gold', { lod: 1 });
    // Sternbilder auf dem Mantel
    g.lod(1, (h) => {
      const st = H ? [[-8, -60], [-6, -52], [-9, -45], [8, -58], [9, -48], [6, -40]] : [[-7, -58], [-5, -50], [8, -52]];
      for (const [x, y] of st) h.fill(circle(x, y, 0.7), '#e8e0ff');
      h.stroke(polyline(st.slice(0, 3)), '#a898e0', 0.4);
    });
  });
  if (H) {
    // drei leuchtende Pfeil-Sternbilder (Rang-Merkmal)
    F.part('arrowStars', { bone: 'torso', z: 21, zb: 21, glow: true, sig: true }, (g) => {
      for (const [x, y, a] of [[-6, -54, -30], [7, -60, 20], [6, -44, -10]]) {
        const r = (a * Math.PI) / 180;
        const ux = Math.cos(r);
        const uy = Math.sin(r);
        g.stroke(polyline([[x - ux * 5, y - uy * 5], [x + ux * 5, y + uy * 5]]), LIGHT, 1);
        g.fill(poly([[x + ux * 5 - uy * 1.6, y + uy * 5 + ux * 1.6], [x + ux * 7.6, y + uy * 7.6], [x + ux * 5 + uy * 1.6, y + uy * 5 - ux * 1.6]]), '#fffbe0');
        for (const k of [-5, 0, 5]) g.fill(circle(x + ux * k, y + uy * k, 0.9), '#fffbe0');
      }
    });
    F.part('decoyShimmer', { bone: 'torso', z: 48, form: ['decoy'], glow: true }, (g) => {
      g.fill(ellipse(2, -50, 18, 40), '#7af0d0', { op: 0.35 });
      for (const [x, y] of [[-10, -80], [12, -66], [-6, -30], [14, -24], [0, -96]]) g.fill(circle(x, y, 1.2), '#c8fff0');
    });
  }
  F.part('belt', { bone: 'hip', z: 22, zb: 22 }, (g) => {
    g.mat(rrect(-12, -42, 24, 3.6, 1.2), '#4a3424', 'leather');
    g.mat(rrect(0, -42.6, 4.4, 4.8, 1), BRASS, 'gold', { lod: 1 });
  });

  // ───────── Kopf: verträumt, Astrolabium-Hut ─────────
  F.part('hair', { bone: 'head', z: 29, zb: 33 }, (g) => {
    g.mat(path([[-7, -80], [-9, -70], [-7, -62], [-3, -66], [-4, -76]]), HAIR, 'hair');
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-6, -82], [4, -85], [13, -81.6], [14.6, -73], [12.6, -66], [6.6, -62.6], [0, -64], [-5, -70]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10.8, -74.4, 2.3], [3.6, -74.4, 2.1]],
    iris: '#6a5ab8',
    lidColor: SKIN,
    lid: 0.42,
    look: [0.3, -0.5],
    brow: { color: HAIR, w: 1.1, lift: 0.6 },
    idleTilt: -0.5,
    mouth: [8.6, -67.4, 4.4],
    mood: H ? 'smirk' : 'smile',
    attackMouth: 'clench',
    replace: {
      // ein Auge hinter dem Fernrohr
      attack: (g, c) => {
        eyeClosed(g, c.E2[0], c.E2[1], 2, { lw: 0.8 });
        eye(g, c.E1[0], c.E1[1], { ...c.EYE, r: 3.4, lid: 0.1, look: [0.9, 0] });
        g.stroke(spline([[6.6, -67.6], [8.6, -68], [10.6, -67.4]]), INK, 0.8);
      },
    },
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.2, -70.8, 1.7, 1.5), '#dca882', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(path([[-6, -82], [14, -82], [14, -70], [8, -63], [-1, -64], [-6, -70]]), HAIR, 'hair');
  });
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-14, -79, 1], [-6, -84], [4, -85.4], [16, -83.6], [22, -79, 1], [12, -80.4], [4, -81], [-6, -80.4]]), COAT_D, 'cloth');
    g.mat(path([[-3, -83], [-2, -94], [4, -100], [11, -95.6], [12, -83]]), COAT, 'cloth');
  });
  F.part('hatband', { bone: 'hat', z: 36.5, zb: 36.5, team: true }, (g) => {
    g.mat(path([[-3, -83], [12, -83], [12, -86.6], [-2.8, -86.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });
  // Astrolabium-Ringe um die Hutkrone, mit Gradeinteilung
  F.part('rings', { bone: 'hat', z: 37, zb: 37 }, (g) => {
    g.stroke(ellipse(4.6, -91, 13, 4, -14), BRASS, 1.4);
    g.stroke(ellipse(4.6, -91, 5, 12.4, 24), BRASS, 1.2);
    g.mat(circle(4.6, -103.4, 1.8), '#f8e38a', 'gem');
    g.lod(2, (h) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        h.fill(circle(4.6 + Math.cos(a) * 13 * Math.cos(-0.24) - Math.sin(a) * 4 * Math.sin(-0.24), -91 + Math.cos(a) * 13 * Math.sin(-0.24) + Math.sin(a) * 4 * Math.cos(-0.24), 0.45), '#8a6a1a');
      }
    });
  });

  // ───────── Fernrohr-Bogen (Signature) ─────────
  F.part('bow', { bone: 'prop', z: 41, zb: 13, sig: true }, (g) => {
    const bow = path([[11, -72], [14, -72.6, 1], [13, -69], [17, -60], [18, -50], [17, -40], [13, -31], [14, -27.6, 1], [11, -28], [14, -33], [15.6, -42], [16, -50], [15.6, -58], [14, -67]]);
    g.mat(bow, BOW, 'wood');
    g.stroke(polyline([[12.4, -71], [12.2, -29]]), '#f8f0d8', 0.55);
    g.mat(rrect(15, -53, 3.6, 6.4, 1.4), '#3a2a1a', 'leather', { lod: 1 });
    if (H) {
      g.stroke(polyline([[11.4, -70], [11.2, -30]]), LIGHT, 0.5);
      g.stroke(polyline([[13.6, -70], [13.4, -30]]), LIGHT, 0.5);
    }
  });
  F.part('scope', { bone: 'prop', z: 41.5, zb: 13.5, state: ['idle', 'walk', 'hit', 'spawn', 'death', 'stun', 'charge'] }, (g) => {
    g.mat(rrect(17, -55, 9, 3.6, 1.2), BRASS, 'gold');
    g.mat(circle(26.4, -53.2, 2), '#9ad8f0', 'glass', { line: '#6a5a20' });
  });
  F.part('scopeOut', { bone: 'prop', z: 41.5, zb: 13.5, state: ['attack', 'ability'] }, (g) => {
    g.mat(rrect(17, -55.6, 8, 4.6, 1.4), BRASS, 'gold');
    g.mat(rrect(24, -55, 7, 3.6, 1.2), '#d8b860', 'gold');
    g.mat(rrect(30, -54.4, 5, 2.6, 1), BRASS, 'gold');
    g.mat(circle(35.4, -53.1, 1.8), '#9ad8f0', 'glass', { line: '#6a5a20' });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 12 }, (g) => g.mat(limb(10, -68, 14.6, -52, 4.6, 4.2), COAT, 'cloth'));
  F.part('handF', { bone: 'handF', z: 42, zb: 14 }, (g) => g.mat(circle(15.6, -50, 3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 24, -6, -64, 2.2, { zb: 24 });

  F.anim({
    // schaut durch das Fernrohr in den Himmel
    idle: { p: { breathe: 0.025, bob: 0.6, sway: 1.5, tilt: 2 }, keys: { armF: { r: [[0, 0], [0.4, 0], [0.55, -70], [0.8, -70], [0.95, 0]] }, prop: { r: [[0, 0], [0.4, 0], [0.55, 40], [0.8, 40], [0.95, 0]] }, head: { r: [[0, 0], [0.45, 0], [0.55, -14], [0.8, -14], [0.95, 0]] }, hat: { r: [[0, 0], [0.5, 4], [1, 0]] } } },
    // schlendernder Schritt, die Ringe klappern
    walk: { p: { stride: 22, bob: 2, armSwing: 8, lean: 2 }, keys: { hat: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // Fernrohr ausfahren und zielen, Lichtpfeil in gerader Linie
    attack: {
      prog: 'atk.shoot',
      hit: 0.62,
      p: { armFAim: -82, armBAim: -84, propAim: 82, handBAim: 84, draw: 7, recoil: 2, kick: 5, aimHead: 2 },
      keys: { layer: [[0, 0.7, 'armB', 43, 43], [0, 0.7, 'handB', 44, 44], [0, 0.7, 'nockArrow', 45, 45]] },
      ev: { release: 0.62 },
    },
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 0], [0.2, -14], [0.4, 10], [1, 0]] } } },
    // löst sich in Sternenstaub auf
    death: { p: { dir: -1, angle: 50 }, keys: { alpha: [[0, 1], [0.3, 1], [1, 0]] } },
    ...(H
      ? {
          // Dreifachgefahr: Rückwärtssprung, dann drei Pfeile
          ability: { prog: 'atk.shoot', hit: 0.7, p: { armFAim: -82, armBAim: -84, propAim: 82, handBAim: 84, draw: 7 }, keys: { root: { x: [[0, 0], [0.3, -14, 'out'], [1, -14]], y: [[0, 0], [0.15, -10], [0.3, 0]] } }, ev: { ability: 0.7 } },
        }
      : {}),
  });
}
