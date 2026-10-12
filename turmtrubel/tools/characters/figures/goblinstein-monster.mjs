// Goblinsteins Monster – sanfter, genähter Riesenkobold aus Flicken mit ungleich großen Armen und Akku auf dem Rücken
// (Brief: docs/briefs/goblinstein-monster.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, eye, stitches, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinsteinMonster(F) {
  const P = F.pal;
  const SKIN = P.main;
  const COPPER = P.acc;
  const SKIN_D = '#5a6e54';
  const PATCH = '#94a888';
  const SEAM = '#2a2a30';
  const BATT = '#3a3d44';
  const PANTS = '#3a3a4a';

  F.rig('biped', {
    hip: [0, -32],
    torso: [0, -36],
    head: [10, -98],
    hat: [10, -116],
    back: [-20, -84],
    armB: [-28, -90],
    handB: [-32, -46],
    armF: [32, -92],
    handF: [42, -34],
    prop: [42, -34],
    legB: [-12, -32],
    footB: [-14, -8],
    legF: [12, -32],
    footF: [14, -8],
    cape: [0, -94],
  });

  // ───────── Akku mit Kurbel (Signature) und Kabel zu den Halsklemmen ─────────
  F.part('battery', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    // breiter Rücken-Akku auf dem Kreuz, oben zwei Polköpfe
    g.mat(rrect(-58, -108, 38, 50, 4), BATT, 'metal', { hi: 0.6 });
    g.mat(rrect(-54, -116, 10, 8, 2), '#c84a3a', 'metal');
    g.mat(rrect(-34, -116, 10, 8, 2), '#4a4a52', 'metal');
    g.lod(1, (h) => {
      rivets(h, [[-55, -104], [-23, -104], [-55, -62], [-23, -62]], 1, '#8a909c');
      for (const y of [-96, -86]) h.fill(rrect(-50, y, 22, 4, 1), '#7cff8a', { op: 0.9 });
    });
    // Kurbel
    g.stroke(polyline([[-46, -84], [-54, -84], [-54, -76]]), '#9aa3ad', 1.8);
    g.mat(rrect(-57, -78, 6, 4, 1.4), '#c84a3a', 'wood');
  });
  F.part('cables', { bone: 'back', z: 3.5, zb: 45 }, (g) => {
    g.stroke(spline([[-49, -116], [-36, -126], [-10, -112], [-8, -97]]), '#1e1e22', 2.2);
    g.stroke(spline([[-29, -116], [-12, -122], [30, -112], [34, -97]]), '#1e1e22', 2.2);
  });
  F.part('sparks', { bone: 'back', z: 46, state: ['spark', 'hit', 'spawn'], glow: true }, (g) => {
    for (const [x, y] of [[0, -102], [18, -102], [-6, -110]]) g.stroke(polyline([[x - 3, y - 2], [x, y + 1], [x + 3, y - 3], [x + 5, y]]), '#7cff8a', 1.2);
  });

  // ───────── Beine: zerrissene Hose mit Kabel-Hosenträgern ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -34, x * 1.12, -12, 11, 9.5), PANTS, 'cloth');
      g.mat(path([[x * 1.12 - 9, -18], [x * 1.12 + 9, -18], [x * 1.12 + 6, -14], [x * 1.12 + 2, -17], [x * 1.12 - 3, -13], [x * 1.12 - 9, -15]]), PANTS, 'cloth');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(blob([[fx - 11, -14], [fx + 6, -16], [fx + 18, -6], [fx + 18, 0], [fx - 12, 0]], 0.6), SKIN_D, 'skin', { hi: 0.3 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Kleiner linker Arm mit Flickenfaust ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    g.mat(limb(-28, -92, -32, -50, 9, 8), SKIN_D, 'skin');
    g.lod(1, (h) => stitches(h, [[-34, -70], [-24, -72]], SEAM, { cross: true }));
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => {
    g.mat(circle(-32, -42, 9), PATCH, 'skin');
    g.lod(1, (h) => stitches(h, [[-38, -48], [-26, -36]], SEAM, { cross: true }));
  });

  // ───────── Flicken-Rumpf mit Kreuznähten, Hosenbund (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const t = blob([[-30, -94], [0, -102], [32, -96], [40, -72], [34, -40], [-30, -40], [-36, -68]], 0.6);
    g.mat(t, SKIN, 'skin', { hi: 0.4 });
    g.clipTo(t, (h) => {
      h.fill(path([[-30, -90], [-4, -94], [-6, -66], [-34, -62]]), PATCH);
      h.fill(path([[10, -68], [36, -70], [34, -44], [8, -44]]), '#6a8064');
      h.lod(1, (k) => {
        stitches(k, [[-30, -90], [-4, -94], [-6, -66], [-34, -62]], SEAM, { cross: true });
        stitches(k, [[10, -68], [36, -70], [34, -44]], SEAM, { cross: true });
      });
      h.fill(ellipse(-12, -50, 4, 2.6), '#3a3020', { op: 0.5, lod: 1 });
    });
  });
  F.part('waist', { bone: 'hip', z: 21, zb: 31, team: true }, (g) => g.mat(rrect(-32, -46, 66, 8, 2), P.team, 'cloth', { line: P.teamDeep }));
  F.part('cableBraces', { bone: 'torso', z: 22, zb: 32 }, (g) => {
    g.stroke(spline([[-16, -42], [-12, -70], [-6, -98]]), '#c84a3a', 2.4);
    g.stroke(spline([[22, -42], [20, -70], [16, -98]]), '#1e1e22', 2.4);
  });

  // ───────── Kleiner Kopf: Stirnnaht, sanfte ungleiche Augen, schüchternes Lächeln ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[-4, -108], [0, -118], [12, -122], [24, -116], [26, -104], [22, -96], [12, -92], [2, -96]], 0.7), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => stitches(h, [[0, -114], [12, -118], [24, -113]], SEAM, { cross: true }));
    // Ohren klein und geflickt
    g.mat(path([[-3, -108], [-12, -112, 1], [-3, -102]]), SKIN_D, 'skin');
  });
  faceSet(F, {
    eyes: [[20, -106, 2.6], [12, -106, 1.9]],
    iris: '#8a6a3a',
    lidColor: SKIN,
    lid: 0.35,
    look: [0.3, 0.2],
    brow: { color: SKIN_D, w: 1, lift: 0.6 },
    idleTilt: -0.8,
    mouth: [17, -97, 5],
    mood: 'smile',
    attackMouth: 'grit',
  });
  // Kupferklemmen am Hals
  F.part('clamps', { bone: 'head', z: 34.5, zb: 33 }, (g) => {
    // Halsbolzen stehen weit zur Seite ab
    for (const [x, dir] of [[2, -1], [24, 1]]) {
      g.mat(rrect(dir < 0 ? x - 14 : x, -99, 14, 5, 1.6), '#9aa3ad', 'metal', { hi: 0.8 });
      g.mat(rrect(dir < 0 ? x - 18 : x + 12, -102, 6, 11, 1.6), COPPER, 'metal', { hi: 0.8 });
    }
  });

  // ───────── Riesige rechte Pranke mit Kupferring, Armbinde (Teamzone) ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    g.mat(limb(32, -94, 40, -50, 14, 12), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => stitches(h, [[30, -64], [48, -66]], SEAM, { cross: true }));
  });
  F.part('armband', { bone: 'armF', z: 29.5, zb: 10.5, team: true }, (g) => g.mat(rrect(26, -86, 26, 8, 3).rot(10, 39, -82), P.team, 'cloth', { line: P.teamDeep }));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => {
    // Riesenhand hängt bis auf den Boden
    g.mat(blob([[22, -40], [36, -54], [60, -50], [70, -28], [64, -4], [30, -4], [20, -22]], 0.7), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[34, -18], [36, -4]], [[44, -18], [46, -4]], [[54, -18], [56, -5]]], SKIN_D, 1, 1));
    g.mat(rrect(26, -48, 30, 6, 2).rot(-10, 41, -45), COPPER, 'metal', { hi: 0.8 });
  });
  emblem(F, 'emblem', 'torso', 23, 18, -80, 2.8, { view: 'front' });

  F.anim({
    // Funken an den Klemmen, wiegt den Kopf (summt ein Wiegenlied)
    idle: { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 6 }, keys: { show: { spark: [[0.2, 0.3], [0.7, 0.78]] } } },
    // schwankender Gang
    walk: { p: { stride: 14, bob: 4, squash: 0.05, armSwing: 8, lean: 4 }, keys: { root: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // beide Arme hoch, schwerfälliger Doppelschlag
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -170, windB: -150, strike: -30, strikeB: -20, over: 8, lean: 10, lunge: 12 }, ev: { strike: 0.6 } },
    // zuckt, Funken
    hit: { p: { knock: 1.6, recoil: 3, jolt: 6 }, keys: { show: { spark: [[0, 0.5]] } } },
    // erwacht: Funken, er öffnet die Augen
    spawn: { keys: { expr: [[0, 0.5, 'sleep']] } },
    // Akku geht aus, er sackt zusammen
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { sy: [[0, 1], [0.5, 0.75, 'in']], y: [[0, 0], [0.5, 4]] }, head: { r: [[0, 0], [0.5, 24]] }, armF: { r: [[0, 0], [0.5, 14]] }, alpha: [[0, 1], [0.7, 1], [1, 0]] } },
  });
}
