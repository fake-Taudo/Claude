// Elektroriese – grimmiger Elektriker im ziegelorangen Overall mit Schweißervisier, zwei Teslaspulen auf den Schultern
// und riesigen Gummihandschuhen (Brief: docs/briefs/electro-giant.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, rivets, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function electroGiant(F) {
  const P = F.pal;
  const SUIT = P.main;
  const VOLT = P.acc;
  const RUBBER = '#3a3a40';
  const COPPER = '#c87a3a';
  const VISOR = '#5a6070';
  const SKIN = '#e0a07a';
  const SUIT_D = '#a85e26';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -38],
    head: [6, -98],
    hat: [6, -118],
    back: [-18, -90],
    armB: [-30, -94],
    handB: [-36, -50],
    armF: [31, -94],
    handF: [38, -50],
    prop: [38, -50],
    legB: [-12, -34],
    footB: [-14, -9],
    legF: [12, -34],
    footF: [14, -9],
    cape: [0, -100],
  });

  // Teslaspule mit Kugelkappe (Signature)
  const coil = (g, x, y) => {
    g.mat(rrect(x - 6, y - 26, 12, 26, 3), '#5a4a3a', 'wood');
    g.clipTo(rrect(x - 6, y - 26, 12, 26, 3), (h) => {
      for (let yy = y - 24; yy < y; yy += 2.6) h.stroke(polyline([[x - 7, yy], [x + 7, yy + 1]]), COPPER, 1.6);
    });
    g.mat(rrect(x - 8, y - 3, 16, 5, 2), '#8a8f99', 'metal');
    g.mat(circle(x, y - 31, 6.4), '#c8ccd4', 'metal', { hi: 0.95 });
  };
  F.part('coilB', { bone: 'torso', z: 4, zb: 44, sig: true }, (g) => coil(g, -24, -104));
  F.part('spark', { bone: 'torso', z: 4.5, zb: 44.5, glow: true, state: ['spark', 'attack', 'hit'] }, (g) => {
    g.stroke(polyline([[-18, -136], [-8, -142], [0, -134], [10, -144], [20, -136], [30, -140]]), VOLT, 1.6);
    g.stroke(polyline([[-18, -136], [-8, -142], [0, -134], [10, -144], [20, -136], [30, -140]]), '#ffffff', 0.6);
  });

  // ───────── Beine: Overall, Sicherheitsstiefel ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -36, x * 1.12, -12, 11, 9.5), SUIT, 'cloth', { hi: 0.3 }));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(path([[fx - 11, -18], [fx + 9, -18.6], [fx + 10, -8], [fx + 19, -5], [fx + 19, 0, 1], [fx - 12, 0, 1]]), '#2a2a2e', 'leather', { hi: 0.5 });
      g.mat(rrect(fx + 8, -9, 11, 6, 2), '#e8c040', 'metal', { lod: 1 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Gummihandschuh (riesig) ─────────
  const glove = (g, x, y, k) => {
    g.mat(blob([[x - 15 * k, y - 4], [x - 8 * k, y - 12], [x + 8 * k, y - 12], [x + 15 * k, y - 2], [x + 12 * k, y + 14], [x - 12 * k, y + 14]], 0.7), RUBBER, 'leather', { hi: 0.5 });
    g.mat(rrect(x - 14 * k, y - 16, 28 * k, 7, 3), '#4a4a52', 'leather');
    g.lod(1, (h) => lines(h, [[[x - 6 * k, y + 4], [x - 6 * k, y + 13]], [[x + 1, y + 4], [x + 1, y + 13]], [[x + 7 * k, y + 4], [x + 7 * k, y + 12]]], '#22222a', 0.8, 1));
  };
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => g.mat(limb(-30, -96, -35, -62, 11, 10), SUIT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => glove(g, -36, -48, 0.9));

  // ───────── Overall mit Brusttasche, Warnstreifen, Werkzeuggürtel (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const t = path([[-34, -98], [-12, -106], [14, -106], [36, -98], [40, -78], [34, -46], [-32, -46], [-38, -78]]);
    g.mat(t, SUIT, 'cloth', { hi: 0.4 });
    g.clipTo(t, (h) => {
      h.lod(1, (k) => lines(k, [[[2, -104], [2, -48]], [[-20, -90], [-22, -60]]], SUIT_D, 0.8, 1));
      // Brandflecken
      h.fill(ellipse(-14, -66, 4, 2.6), '#5a3418', { op: 0.6, lod: 1 });
    });
    g.mat(rrect(8, -88, 16, 14, 2), SUIT_D, 'cloth');
    g.lod(2, (h) => stitches(h, [[9, -76], [9, -87], [23, -87], [23, -76]], '#f0d0a0'));
    // Prüfschraubenzieher
    g.mat(path([[18, -88, 1], [20, -88, 1], [20, -96, 1], [18, -96, 1]]), '#e8c040', 'wood');
  });
  F.part('belt', { bone: 'hip', z: 21, zb: 31, team: true }, (g) => {
    g.mat(rrect(-33, -54, 67, 8, 2), P.team, 'leather', { line: P.teamDeep });
    // Kabeltrommel
    g.mat(circle(-22, -44, 7), '#3a3a40', 'metal', { hi: 0.5 });
    g.stroke(circle(-22, -44, 4.6), '#e84a3a', 1.6);
  });

  // ───────── Kopf: grimmig, Stoppelbart, Visier (hochgeklappt bzw. unten) ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(path([[-8, -112], [6, -118], [20, -114], [23, -104], [20, -94], [10, -90], [-2, -92], [-9, -100]]), SKIN, 'skin');
    g.lod(1, (h) => {
      for (const [x, y] of [[4, -94], [8, -92.6], [12, -92.6], [16, -94], [19, -96.4], [2, -96]]) h.fill(circle(x, y, 0.5), '#8a5a3a');
    });
  });
  faceSet(F, {
    eyes: [[15.5, -106, 2.2], [6.5, -106, 2]],
    iris: '#3a4a5a',
    lidColor: SKIN,
    lid: 0.4,
    look: [0.7, 0],
    brow: { color: '#3a2a1a', w: 2, lift: 0.1 },
    idleTilt: 1.4,
    mouth: [13, -97, 5],
    mood: 'frown',
    attackMouth: 'grit',
    skip: ['hurt'],
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(13.4, -101.6, 3, 2.4), '#d08a64', 'skin', { line: '#a8684a', lw: 0.6 }));
  F.part('visorUp', { bone: 'hat', z: 35, zb: 36, state: ['idle', 'walk', 'attack', 'spawn', 'stun', 'ability', 'sleep', 'charge', 'death'] }, (g) => {
    g.mat(path([[-10, -110], [-8, -122], [6, -126], [20, -122], [24, -112]]), '#d8d4cc', 'metal', { hi: 0.7 });
    g.mat(rrect(-4, -132, 24, 9, 3), VISOR, 'metal', { hi: 0.8 });
    g.mat(rrect(0, -130.6, 16, 5, 1.6), '#2a3240', 'glass');
  });
  F.part('visorDown', { bone: 'hat', z: 35, zb: 36, state: 'hit' }, (g) => {
    g.mat(path([[-10, -110], [-8, -122], [6, -126], [20, -122], [24, -112]]), '#d8d4cc', 'metal', { hi: 0.7 });
    g.mat(rrect(-2, -114, 28, 20, 3), VISOR, 'metal', { hi: 0.8 });
    g.mat(rrect(4, -110, 18, 6, 1.6), '#2a3240', 'glass');
    g.fill(rrect(6, -109, 14, 2, 0.6), VOLT, { op: 0.9 });
  });
  F.part('helmStripe', { bone: 'hat', z: 35.5, zb: 36.5, team: true }, (g) => g.mat(path([[4, -126], [10, -126.4], [12, -112], [6, -112]]), P.team, 'metal', { line: P.teamDeep, lw: 0.5 }));

  // ───────── Vordere Spule, Arm und Handschuh ─────────
  F.part('coilF', { bone: 'torso', z: 26, zb: 3 }, (g) => coil(g, 28, -100));
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    g.mat(limb(31, -96, 37, -62, 11, 10), SUIT, 'cloth', { hi: 0.3 });
    // Warnstreifen und verkohlte Ärmelenden
    g.clipTo(limb(31, -96, 37, -62, 11, 10), (h) => {
      for (let y = -80; y < -68; y += 5) h.fill(path([[20, y], [50, y - 4], [50, y - 1.6], [20, y + 2.4]]), '#e8c040');
    });
    g.mat(ellipse(37, -63, 10, 3), '#3a2a1e', 'cloth', { lod: 1 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => glove(g, 39, -48, 1));
  F.part('fistGlow', { bone: 'handF', z: 42, glow: true, state: ['muzzle', 'hit'] }, (g) => {
    g.fill(circle(39, -44, 18), VOLT, { op: 0.35 });
    for (const a of [0, 60, 120, 180, 240, 300]) {
      const r = (a * Math.PI) / 180;
      g.stroke(polyline([[39 + Math.cos(r) * 14, -44 + Math.sin(r) * 14], [39 + Math.cos(r + 0.2) * 20, -44 + Math.sin(r + 0.2) * 20], [39 + Math.cos(r) * 26, -44 + Math.sin(r) * 26]]), VOLT, 1.4);
    }
  });
  emblem(F, 'emblem', 'torso', 23, -16, -80, 2.8, { view: 'front' });

  F.anim({
    // Funken springen zwischen den Spulen, er reibt die Handschuhe
    idle: { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 1.5 }, keys: { show: { spark: [[0.1, 0.18], [0.5, 0.56], [0.8, 0.86]] }, armF: { r: [[0, 0], [0.3, -20], [0.4, -14], [0.5, -20], [0.6, 0]] } } },
    // schwerer Stampfgang, Funken
    walk: { p: { stride: 14, bob: 4, squash: 0.05, armSwing: 10, lean: 3 }, keys: { show: { spark: [[0.2, 0.3], [0.7, 0.8]] } }, ev: { step: [0.25, 0.75] } },
    // Faust hoch, Spulen laden, Schlag nach unten mit Entladung
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -190, windB: 0, strike: -30, strikeB: 0, over: 10, lean: 12, lunge: 14 }, keys: { show: { muzzle: [[0.6, 0.78]] } }, ev: { strike: 0.6 } },
    // Gegenschlag: das Visier fällt herunter, die Spulen blitzen
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { expr: [[0, 1, 'attack']] } },
    // landet, Visier klappt mit Funkenregen herunter
    spawn: { keys: { show: { spark: [[0.5, 1]] } } },
    // Kurzschluss: Rauch aus den Spulen, er kippt um
    death: { p: { dir: -1, angle: 80 }, keys: { show: { spark: [[0, 0.4]] } } },
  });
}
