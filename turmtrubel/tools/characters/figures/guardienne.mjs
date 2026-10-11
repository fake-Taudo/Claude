// Guardienne – wortkarge Leibwächterin des Little Prince mit einer echten Eichentür als Schild und einer Hellebarde
// (Brief: docs/briefs/guardienne.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { faceSet, lines, rivets, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function guardienne(F) {
  const P = F.pal;
  const COAT = P.main;
  const CREAM = P.acc;
  const OAK = '#8a5a32';
  const IRON = '#4a4f58';
  const SKIN = '#e8c0a0';
  const HAIR = '#4a3020';
  const COAT_D = '#5a4472';
  const STEEL = '#a8b0ba';

  F.rig('biped', {
    hip: [0, -44],
    torso: [0, -47],
    head: [4, -74],
    hat: [4, -94],
    back: [-10, -66],
    armB: [-12, -70],
    handB: [12, -50],
    armF: [13, -70],
    handF: [24, -56],
    prop: [24, -56],
    legB: [-5, -44],
    footB: [-6, -6],
    legF: [6, -44],
    footF: [7, -6],
    cape: [-4, -70],
  });

  // ───────── Beine, schwere Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -44, x * 1.1, -12, 5, 4.4), '#3a3048', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 5.4, -20], [fx + 5, -20.6], [fx + 4.6, -6], [fx + 11, -3], [fx + 11, 0, 1], [fx - 6, 0, 1]]), '#3a2a1e', 'leather', { hi: 0.5 });
      g.mat(rrect(fx - 6, -22, 11.6, 3.4, 1.2), '#5a4030', 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 6, 8);

  // ───────── Hinterer Arm (hält die Tür) ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-12, -70, 10, -52, 5, 4.4), COAT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(12, -50, 3.4), '#5a4030', 'leather'));

  // ───────── Gepolsterter Waffenrock (Keil: breite Schultern, schmale Hüfte) ─────────
  F.part('skirt', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    g.mat(path([[-9, -48], [10, -48], [13, -30], [6, -28], [0, -32], [-6, -28], [-12, -30]]), COAT, 'cloth', { hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-4, -46], [-6, -30]], [[4, -46], [6, -30]]], COAT_D, 0.7, 1));
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-15, -72], [-4, -75], [10, -75], [17, -72], [14, -58], [10, -46], [-9, -46], [-13, -58]]);
    g.mat(t, COAT, 'cloth', { hi: 0.45 });
    g.clipTo(t, (h) => {
      // Steppmuster
      h.lod(1, (k) => {
        for (let x = -16; x < 20; x += 5) k.stroke(polyline([[x, -76], [x + 10, -44]]), COAT_D, 0.5);
        for (let x = -6; x < 30; x += 5) k.stroke(polyline([[x, -76], [x - 10, -44]]), COAT_D, 0.5);
      });
    });
    g.mat(rrect(-10, -50, 21, 4, 1.2), '#3a2a1e', 'leather');
    g.mat(rrect(-1, -50.6, 5, 5, 1), '#b8a060', 'gold', { lod: 1 });
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path([[-13, -70], [-8, -72], [12, -48], [7, -46]]), P.team, 'cloth', { line: P.teamDeep });
  });
  // Halsberge
  F.part('gorget', { bone: 'torso', z: 24, zb: 24 }, (g) => {
    g.mat(path([[-6, -76], [12, -76], [13, -71], [3, -68, 1], [-7, -71]]), STEEL, 'metal', { hi: 0.8 });
  });

  // ───────── Kopf: ernst, schmale Augen, fester Kinn; Federhelm mit Nackenschutz ─────────
  F.part('braid', { bone: 'head', z: 28, zb: 34 }, (g) => {
    for (let i = 0; i < 3; i++) g.mat(ellipse(-7 - i * 1.2, -80 + i * 3.6, 2.4, 2.2), HAIR, 'hair', { hi: 0.4 });
  });
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-4, -88], [4, -91], [12.6, -88], [14.4, -80], [13.4, -73], [9, -69.4], [2, -70], [-4, -76]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10.6, -82.4, 2.1], [4.4, -82.4, 1.9]],
    iris: '#4a3a5a',
    lidColor: SKIN,
    lid: 0.45,
    look: [0.7, 0],
    brow: { color: HAIR, w: 1.2, lift: 0.3 },
    idleTilt: 0.5,
    mouth: [9.4, -74.6, 4],
    mood: 'neutral',
    attackMouth: 'grit',
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[10.4, -82], [13.6, -77, 1], [10.6, -76.6]]), '#d8a888', 'skin', { line: '#a87860', lw: 0.5 }));
  F.part('helm', { bone: 'hat', z: 35, zb: 35 }, (g) => {
    // Kappe mit Nackenschutz
    g.mat(path([[-6, -84], [-5, -92], [2, -97], [10, -96.4], [15, -90], [15.6, -86], [-1, -86.6], [-2, -80], [-8, -76, 1]]), STEEL, 'metal', { hi: 0.8 });
    g.lod(1, (h) => {
      h.stroke(polyline([[-5, -86.6], [15.4, -86.6]]), IRON, 0.7);
      rivets(h, [[0, -88.6], [6, -88.6], [12, -88.6]], 0.6, '#d8dce2');
    });
  });
  F.part('plume', { bone: 'hat', z: 34.5, zb: 35.5 }, (g) => {
    g.mat(path([[3, -96], [-2, -104], [-10, -108], [-6, -104, 1], [-12, -102, 1], [-4, -100], [4, -97]]), CREAM, 'cloth', { hi: 0.5 });
  });

  // ───────── Hellebarde ─────────
  F.part('halberd', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[19, -38], [21, -38.6], [33, -100], [31, -100.6]]), '#6a4a2e', 'wood');
    g.lod(1, (h) => {
      for (const t of [0.15, 0.3, 0.45]) h.stroke(polyline([[19 + t * 12 - 1.4, -38 - t * 62], [21 + t * 12 + 1.4, -39 - t * 62]]), '#3a2a1e', 0.9);
    });
    // halbmondförmiges Beil, Haken, Spitze
    const o = arc(33, -92, 9, 9, -80, 80, 10).map(([x, y]) => [x + 2, y]);
    g.mat(path([[32, -98, 1], ...o.map((q, i) => (i === 0 || i === o.length - 1 ? [...q, 1] : q)), [32.6, -86, 1]]), STEEL, 'metal', { hi: 0.95 });
    g.mat(path([[30, -94, 1], [24, -98, 1], [26, -94.6], [30.4, -91, 1]]), STEEL, 'metal');
    g.mat(path([[31.6, -100, 1], [34.6, -112, 1], [34, -100, 1]]), STEEL, 'metal');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(13, -70, 22, -58, 5, 4.4), COAT, 'cloth');
  });
  F.part('pauldronF', { bone: 'armF', z: 29.5, zb: 6.5 }, (g) => {
    g.mat(ellipse(13, -72, 7, 5, 15), COAT_D, 'cloth', { hi: 0.5 });
    g.lod(1, (h) => rivets(h, [[9, -74], [13, -76], [17, -73]], 0.7, '#c8ccd2'));
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(23, -56, 3.4), '#5a4030', 'leather'));

  // ───────── Eichentür (Signature): Bretter, Bänder, Klinke, Briefschlitz, Klopfer, Fenster mit Vorhang ─────────
  const door = rrect(7, -69, 24, 63, 1.6);
  F.part('door', { bone: 'handB', z: 60, zb: 8, sig: true }, (g) => {
    g.mat(door, OAK, 'wood', { hi: 0.4 });
    g.clipTo(door, (h) => {
      h.lod(1, (k) => lines(k, [[[13, -69], [13, -5]], [[19, -69], [19, -5]], [[25, -69], [25, -5]]], '#5a3a1e', 0.6, 1));
      // Kratzer und Stiefelabdruck
      h.lod(2, (k) => {
        lines(k, [[[22, -33], [27, -29]], [[21, -31], [25, -28]]], '#c89a6a', 0.4, 2);
        k.fill(ellipse(15, -21, 2.6, 4, 15), '#5a3a1e', { op: 0.4 });
      });
    });
    // Türbänder
    for (const y of [-61, -15]) g.mat(path([[6, y - 1.6, 1], [20, y - 1.6], [22, y, 1], [20, y + 1.6], [6, y + 1.6, 1]]), IRON, 'metal', { hi: 0.6 });
    // Fensterchen
    g.mat(rrect(15, -63, 10, 10, 2), '#2a2a3a', 'wood');
    g.stroke(polyline([[20, -63], [20, -53]]), OAK, 0.8);
    // Briefschlitz, Klinke, Klopfer
    g.mat(rrect(14, -35, 10, 2, 0.6), IRON, 'metal');
    g.mat(path([[27, -29], [30.4, -29], [30.4, -27.4], [27, -27.4]]), '#c8a046', 'gold');
    g.mat(circle(27.6, -28.2, 1.2), '#c8a046', 'gold');
    g.stroke(circle(20, -43, 2.4), IRON, 0.9);
    g.mat(circle(20, -45.6, 0.9), IRON, 'metal');
    // Hausnummer 3
    g.lod(1, (h) => h.stroke(spline([[10, -53], [11.6, -54], [12.4, -52.6], [11, -51.4], [12.6, -50], [11.6, -48.6], [10, -49.4]]), '#e8d9b0', 0.7));
  });
  F.part('curtain', { bone: 'handB', z: 60.5, zb: 8.5, team: true }, (g) => {
    g.mat(path([[15.6, -62.4], [24.4, -62.4], [24.4, -59], [22, -56.6], [20, -59], [18, -56.6], [15.6, -59]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  emblem(F, 'emblem', 'handB', 61, 20, -23, 2.4, { zb: 9 });

  F.anim({
    // lehnt sich an die Tür, späht durch das Türfenster
    idle: { p: { breathe: 0.02, bob: 0.4, sway: 1, tilt: 1 }, keys: { torso: { r: [[0, 0], [0.4, 6], [0.8, 6], [1, 0]] }, head: { r: [[0, 0], [0.45, 6], [0.75, 6], [0.9, 0]], x: [[0, 0], [0.45, 2], [0.75, 2], [0.9, 0]] } } },
    // schwerer Schritt, die Tür wird getragen
    walk: { p: { stride: 18, bob: 2, armSwing: 4, lean: 3 }, keys: { handB: { y: [[0, 0], [0.25, -2], [0.5, 0], [0.75, -2], [1, 0]] } }, ev: { step: [0.25, 0.75] } },
    // Tür vor, Hellebarde zurück, Stoß über die Tür
    attack: { prog: 'atk.thrust', hit: 0.55, p: { wind: 20, strike: -40, pull: 8, reach: 10, lean: 8, lunge: 10, pushO: 4, pushO2: 6 }, keys: { prop: { r: [[0, 0], [0.45, -10], [0.55, 30], [1, 0]] } }, ev: { strike: 0.55 } },
    // Tür vibriert
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { handB: { x: [[0, 0], [0.1, -2], [0.2, 1.4], [0.3, -1], [0.45, 0]] } } },
    // stürmt mit der Tür voran herein und bremst schlitternd
    spawn: { keys: { root: { x: [[0, -24], [0.6, 0, 'out']], r: [[0, 12], [0.6, -6], [0.85, 0]] } } },
    // Ansturm: Tür vor dem Körper, Kopf eingezogen
    charge: { prog: 'biped.run', p: { stride: 30, bob: 3, armSwing: 0, lean: 14 }, keys: { handB: { x: [[0, 6], [1, 6]] }, head: { y: [[0, 3], [1, 3]] } }, ev: { step: [0.25, 0.75] } },
    // die Tür fällt auf sie wie ein Deckel
    death: { p: { dir: -1, angle: 82 }, keys: { handB: { r: [[0, 0], [0.45, 10]] } } },
  });
}
