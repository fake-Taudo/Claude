// Koboldriese – tumber, gutmütiger Riesenkobold mit Fass-Krähennest auf dem Rücken, in dem zwei Speerkobolde sitzen
// (Brief: docs/briefs/goblin-giant.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, rivets, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinGiant(F) {
  const P = F.pal;
  const SKIN = P.main;
  const LEATHER = P.acc;
  const SKIN_D = '#4e6e2a';
  const HOOP = '#7a7a80';
  const STAVE = '#8a5a32';
  const PANTS = '#5a4a3a';

  F.rig(
    'biped',
    {
      hip: [0, -32],
      torso: [0, -36],
      head: [10, -94],
      hat: [10, -116],
      back: [-22, -86],
      armB: [-28, -88],
      handB: [-34, -44],
      armF: [32, -88],
      handF: [40, -44],
      prop: [40, -44],
      legB: [-12, -32],
      footB: [-14, -8],
      legF: [12, -32],
      footF: [14, -8],
      cape: [0, -94],
      riderA: [-34, -130],
      riderB: [-16, -130],
    },
    { riderA: 'back', riderB: 'back' },
  );

  // ───────── Fass-Krähennest (Signature) mit zwei Speerkobolden ─────────
  const rider = (name, x, z) => {
    F.part(name, { bone: name, z, zb: z + 40 }, (g) => {
      g.mat(blob([[x - 6, -130], [x - 5, -138], [x, -141], [x + 6, -138], [x + 6, -130]], 0.7), '#7fae4a', 'skin', { hi: 0.4 });
      g.mat(path([[x - 5, -136], [x - 12, -138, 1], [x - 5, -132]]), '#5e8a34', 'skin');
      g.mat(path([[x + 5, -136], [x + 12, -138, 1], [x + 5, -132]]), '#5e8a34', 'skin');
      g.fill(circle(x + 2.4, -135, 0.9), INK);
      g.fill(circle(x - 1.6, -135, 0.8), INK);
      g.stroke(polyline([[x - 1, -132], [x + 3, -132.6]]), INK, 0.6);
      // Speer
      g.mat(path([[x + 6, -122, 1], [x + 7.4, -122, 1], [x + 12, -156, 1], [x + 10.6, -156, 1]]), '#8a6a44', 'wood');
      g.mat(path([[x + 10, -156], [x + 12.6, -164, 1], [x + 13, -155]]), '#c8ccd2', 'metal');
    });
  };
  rider('riderA', -34, 2);
  rider('riderB', -16, 2.2);
  F.part('barrel', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    const b = path([[-46, -126, 1], [-6, -126, 1], [-2, -100], [-6, -70, 1], [-46, -70, 1], [-50, -100]]);
    g.mat(b, STAVE, 'wood', { hi: 0.4 });
    g.clipTo(b, (h) => {
      h.lod(1, (k) => lines(k, [[[-38, -126], [-39, -70]], [[-30, -126], [-30, -70]], [[-22, -126], [-21, -70]], [[-14, -126], [-13, -70]]], '#5a3a1e', 0.7, 1));
      for (const y of [-120, -98, -76]) h.fill(rrect(-52, y, 54, 4, 0), HOOP);
      h.fill(rrect(-30, -92, 10, 8, 1), '#a8784a', { lod: 1 });
    });
    // Ausguck-Rand
    g.mat(ellipse(-26, -126, 21, 4), '#6a4222', 'wood');
  });
  F.part('evoIron', { bone: 'back', z: 3.5, zb: 46.5, evo: 'evo' }, (g) => {
    for (const [x, y] of [[-46, -122], [-6, -122], [-46, -74], [-6, -74]]) g.mat(rrect(x - 3, y - 3, 6, 6, 1), '#5a5f6b', 'metal', { hi: 0.7 });
  });
  // Krähennest-Fähnchen (Teamzone)
  F.part('nestFlag', { bone: 'back', z: 1.5, zb: 45.5, team: true }, (g) => {
    g.stroke(polyline([[-8, -126], [-8, -152]]), '#6a4a2e', 1.4);
    g.mat(path([[-8, -152], [6, -148], [0, -145], [6, -142], [-8, -140]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Beine: Lederhose ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -34, x * 1.12, -12, 11, 9.5), PANTS, 'leather', { hi: 0.3 }));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(blob([[fx - 11, -14], [fx + 6, -16], [fx + 18, -6], [fx + 18, 0], [fx - 12, 0]], 0.6), SKIN, 'skin', { hi: 0.3 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => g.mat(limb(-28, -90, -34, -50, 11, 10), SKIN_D, 'skin'));
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => g.mat(blob([[-46, -44], [-34, -52], [-22, -46], [-22, -32], [-36, -28], [-46, -34]], 0.7), SKIN_D, 'skin'));

  // ───────── Nackter Bauch, Tragegurte, Gürtel (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    g.mat(blob([[-30, -92], [0, -100], [30, -94], [40, -70], [36, -40], [-30, -40], [-36, -66]], 0.65), SKIN, 'skin', { hi: 0.45 });
    g.lod(1, (h) => {
      lines(h, [[[-10, -60], [0, -56], [12, -58]]], SKIN_D, 1, 1);
      h.fill(circle(4, -52, 1.6), SKIN_D);
    });
  });
  F.part('straps', { bone: 'torso', z: 20, zb: 30 }, (g) => {
    g.mat(path([[-22, -96], [-14, -98], [-4, -42], [-12, -42]]), LEATHER, 'leather');
    g.mat(path([[16, -98], [24, -96], [18, -42], [10, -42]]), LEATHER, 'leather');
    g.mat(rrect(-12, -78, 8, 8, 2), '#9aa3ad', 'metal', { lod: 1 });
  });
  F.part('belt', { bone: 'hip', z: 21, zb: 31, team: true }, (g) => {
    g.mat(rrect(-32, -46, 68, 8, 2), P.team, 'leather', { line: P.teamDeep });
    g.mat(rrect(0, -47, 10, 10, 2), '#9aa3ad', 'metal');
  });
  F.part('evoSack', { bone: 'hip', z: 22, zb: 32, evo: 'evo' }, (g) => {
    g.mat(blob([[-40, -44], [-22, -46], [-16, -28], [-24, -14], [-40, -16], [-46, -30]], 0.7), '#c8a870', 'cloth', { hi: 0.4 });
    for (const [x, y] of [[-34, -34], [-26, -24]]) g.mat(circle(x, y, 3.4), '#7fae4a', 'skin');
    g.lod(1, (h) => lines(h, [[[-38, -22], [-42, -14]], [[-20, -30], [-14, -26]]], '#d8c070', 0.6, 1));
  });

  // ───────── Kopf: groß, freundlich-dumm, riesige Ohren mit Fassreifen-Ohrringen ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 36 }, (g) => g.mat(path([[16, -114], [36, -124], [48, -122, 1], [30, -108], [20, -104]]), SKIN_D, 'skin'));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-2, -102], [2, -116], [14, -122], [28, -118], [32, -104], [30, -92], [20, -86], [6, -88]], 0.7), SKIN, 'skin', { hi: 0.4 });
  });
  faceSet(F, {
    eyes: [[26, -106, 2.6], [17, -106, 2.4]],
    iris: '#5a4a2a',
    lidColor: SKIN,
    lid: 0.55,
    look: [0.5, 0.1],
    brow: { color: SKIN_D, w: 1.4, lift: 0.8 },
    mouth: [23, -93, 8],
    mood: 'grin',
    attackMouth: 'grit',
    idle: (g) => g.fill(rrect(20, -95, 2, 2, 0), '#4a1c24'),
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[24, -104], [36, -100, 1], [26, -98]]), SKIN, 'skin', { line: SKIN_D, lw: 0.7 }));
  F.part('earF', { bone: 'head', z: 34, zb: 29 }, (g) => {
    g.mat(path([[0, -108], [-20, -116], [-34, -116, 1], [-20, -102], [0, -98]]), SKIN, 'skin', { hi: 0.3 });
    // Ohrringe so groß wie Fassreifen
    g.stroke(circle(-18, -98, 6), HOOP, 2);
  });
  F.part('evoPaint', { bone: 'head', z: 32.5, view: 'front', evo: 'evo' }, (g) => g.fill(path([[12, -114], [30, -116], [30, -112], [12, -110]]), '#e84a3a'));

  // ───────── Vorderer Arm, schwere Faust ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => g.mat(limb(32, -90, 38, -50, 11.5, 10), SKIN, 'skin', { hi: 0.4 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => {
    g.mat(blob([[28, -44], [40, -52], [54, -46], [54, -32], [40, -28], [28, -34]], 0.7), SKIN, 'skin', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[38, -36], [39, -29]], [[46, -36], [47, -30]]], SKIN_D, 0.9, 1));
  });
  emblem(F, 'emblem', 'torso', 23, 20, -64, 2.8, { view: 'front' });

  F.anim({
    // die Speerkobolde zanken sich, er schaut nach oben
    idle: { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 2 }, keys: { riderA: { x: [[0, 0], [0.3, 2], [0.4, 0], [0.5, 2], [0.6, 0]] }, riderB: { x: [[0, 0], [0.3, -2], [0.4, 0], [0.5, -2], [0.6, 0]] }, head: { r: [[0, 0], [0.5, 0], [0.6, -14], [0.85, -14], [0.95, 0]] } } },
    // schwerer Gang, das Fass schaukelt
    walk: { p: { stride: 14, bob: 4, squash: 0.05, armSwing: 10, lean: 4 }, keys: { back: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // schwerer Schwinger mit der Faust
    attack: { prog: 'atk.punch', hit: 0.6, p: { wind: 50, strike: -80, reach: 10, lunge: 14 }, ev: { strike: 0.6 } },
    // das Fass wackelt, die Kobolde klammern sich fest
    hit: { p: { knock: 1.6, recoil: 3 }, keys: { back: { r: [[0, 0], [0.15, -6], [0.3, 5], [0.5, 0]] } } },
    // landet, die Kobolde ploppen hoch
    spawn: { keys: { riderA: { y: [[0, 0], [0.6, 0], [0.75, -10], [0.9, 0]] }, riderB: { y: [[0, 0], [0.65, 0], [0.8, -10], [0.95, 0]] } } },
    // fällt vornüber, die Kobolde springen ab
    death: { p: { dir: 1, angle: 80 }, keys: { riderA: { y: [[0, 0], [0.2, -30]], x: [[0, 0], [0.2, -20]] }, riderB: { y: [[0, 0], [0.2, -34]], x: [[0, 0], [0.2, 10]] } } },
  });
}
