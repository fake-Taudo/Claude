// Golem – uralter, träger Riese aus rosa Granit mit türkisem Schlussstein und einem Bäumchen samt Vogelnest auf der Schulter
// (Brief: docs/briefs/golem.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, emblem, INK, WHITE } from '../kit.mjs';

export default function golem(F) {
  const P = F.pal;
  const GRANITE = P.main;
  const CORE = P.acc;
  const GRANITE_D = '#9a6e66';
  const GRANITE_L = '#d8aca2';
  const LEAF = '#5a8a3a';
  const BARK = '#6b4a32';
  const BIRD = '#f0c040';

  F.rig(
    'biped',
    {
      hip: [0, -36],
      torso: [0, -40],
      head: [6, -118],
      hat: [6, -136],
      back: [-24, -120],
      armB: [-42, -110],
      handB: [-50, -44],
      armF: [44, -110],
      handF: [54, -44],
      prop: [54, -44],
      legB: [-16, -36],
      footB: [-18, -8],
      legF: [16, -36],
      footF: [18, -8],
      cape: [0, -118],
      bird: [-26, -170],
    },
    { bird: 'back' },
  );

  // Granitsprenkel
  const speckle = (h, pts) => {
    for (const [x, y, r] of pts) h.fill(circle(x, y, r), GRANITE_D, { op: 0.6 });
  };

  // ───────── Bäumchen mit Vogelnest auf der Schulter (Signature), Tuch (Teamzone) ─────────
  F.part('tree', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.mat(path([[-28, -120, 1], [-22, -120, 1], [-20, -146], [-14, -160], [-18, -162], [-24, -150], [-30, -160], [-34, -158], [-28, -146]]), BARK, 'wood', { hi: 0.4 });
    for (const [x, y, r] of [[-30, -170, 12], [-12, -168, 10], [-22, -182, 11], [-38, -158, 8]]) g.mat(circle(x, y, r), LEAF, 'fur', { hi: 0.5 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-26, -176], [-16, -172], [-34, -164], [-20, -186]]) h.fill(ellipse(x, y, 2, 1.2, 30), '#7aaa4a');
    });
    // Vogelnest
    g.mat(ellipse(-24, -160, 8, 3.4), '#8a6a3a', 'wood');
  });
  F.part('cloth', { bone: 'back', z: 3.5, zb: 46.5, team: true }, (g) => {
    g.mat(path([[-23, -138], [-12, -136], [-16, -132], [-10, -128], [-22, -130]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });
  F.part('bird', { bone: 'bird', z: 4, zb: 47 }, (g) => {
    g.mat(blob([[-30, -164], [-26, -170], [-20, -169], [-19, -164], [-26, -161]], 0.7), BIRD, 'cloth', { hi: 0.5 });
    g.mat(path([[-19, -167], [-15, -166], [-19, -165]]), '#e8783a', 'bone');
    g.fill(circle(-22, -167, 0.7), INK);
  });

  // ───────── Säulenbeine ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(blob([[x - 15, -40], [x + 14, -42], [x * 1.1 + 13, -12], [x * 1.1 - 14, -10]], 0.5), GRANITE_D, 'stone', { hi: 0.4 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(blob([[fx - 16, -14], [fx + 10, -16], [fx + 22, -6], [fx + 22, 0], [fx - 17, 0]], 0.5), GRANITE, 'stone', { hi: 0.4 });
    });
  };
  leg(-16, 8, 'legB', 'footB');
  leg(16, 12, 'legF', 'footF');

  // ───────── Felsfaust (so groß wie der Rumpf) ─────────
  const fist = (g, x, y, col) => {
    const f = blob([[x - 22, y - 8], [x - 12, y - 22], [x + 10, y - 22], [x + 22, y - 6], [x + 18, y + 16], [x - 18, y + 16]], 0.55);
    g.mat(f, col, 'stone', { hi: 0.5 });
    g.clipTo(f, (h) => h.lod(1, (k) => lines(k, [[[x - 10, y - 2], [x - 8, y + 16]], [[x + 2, y], [x + 4, y + 16]], [[x + 12, y - 2], [x + 14, y + 14]]], GRANITE_D, 1.2, 1)));
  };
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => g.mat(blob([[-56, -112], [-30, -116], [-38, -70], [-56, -60], [-62, -86]], 0.5), GRANITE_D, 'stone', { hi: 0.4 }));
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => fist(g, -50, -40, GRANITE_D));
  F.part('knuckleGlowB', { bone: 'handB', z: 15.5, zb: 45.5, glow: true }, (g) => g.stroke(polyline([[-58, -50], [-52, -46], [-46, -50]]), CORE, 1.4));

  // ───────── Rumpf mit Schlussstein ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const t = blob([[-46, -112], [-16, -128], [20, -128], [50, -112], [52, -76], [40, -42], [-38, -42], [-50, -76]], 0.55);
    g.mat(t, GRANITE, 'stone', { hi: 0.55 });
    g.clipTo(t, (h) => {
      speckle(h, [[-30, -100, 1.6], [24, -96, 1.4], [-20, -60, 1.8], [30, -58, 1.4], [8, -112, 1.2]]);
      h.lod(1, (k) => lines(k, [[[-40, -88], [-24, -80], [-28, -64]], [[34, -84], [22, -76], [28, -60]]], GRANITE_D, 1.2, 1));
      h.fill(rrect(-48, -116, 100, 6, 0), GRANITE_L, { op: 0.5 });
    });
  });
  F.part('keystone', { bone: 'torso', z: 19, zb: 29, glow: true }, (g) => {
    g.fill(poly([[2, -96], [14, -84], [2, -70], [-10, -84]], 1), CORE);
    g.fill(poly([[2, -92], [9, -84], [2, -76], [-5, -84]], 0.6), '#c8fff0');
    g.lod(1, (h) => lines(h, [[[-10, -84], [-24, -78]], [[14, -84], [28, -90]]], CORE, 1, 1));
  });
  F.part('keystoneFrame', { bone: 'torso', z: 18.5, zb: 28.5 }, (g) => g.mat(poly([[2, -100], [18, -84], [2, -66], [-14, -84]], 1), GRANITE_D, 'stone'));

  // ───────── Flacher kleiner Kopf mit glühenden Augenschlitzen ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[-10, -122], [-6, -136], [10, -140], [24, -134], [26, -120], [16, -114], [-4, -114]], 0.55), GRANITE, 'stone', { hi: 0.5 });
    g.mat(path([[-10, -128], [26, -130], [26, -125], [-10, -123]]), GRANITE_D, 'stone');
  });
  F.part('eyes.glow', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'attack', 'ability', 'hurt', 'stun'], glow: true }, (g) => {
    for (const x of [10, 20]) g.fill(rrect(x - 3.4, -123, 6.8, 2.2, 1), CORE);
  });
  F.part('eyes.dim', { bone: 'head', z: 31, view: 'front', expr: ['sleep', 'death'] }, (g) => {
    for (const x of [10, 20]) g.fill(rrect(x - 3.4, -123, 6.8, 2.2, 1), '#5a4a48');
  });
  F.part('mouth', { bone: 'head', z: 31.5, view: 'front' }, (g) => g.stroke(polyline([[10, -117], [22, -117.6]]), GRANITE_D, 1));

  // ───────── Vorderer Arm, Armband (Teamzone), Felsfaust ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => g.mat(blob([[30, -116], [58, -112], [64, -86], [58, -60], [40, -66], [32, -90]], 0.5), GRANITE, 'stone', { hi: 0.5 }));
  F.part('armband', { bone: 'armF', z: 29.5, zb: 10.5, team: true }, (g) => g.mat(rrect(36, -80, 28, 9, 3).rot(8, 50, -76), P.team, 'cloth', { line: P.teamDeep }));
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => fist(g, 56, -40, GRANITE));
  F.part('knuckleGlowF', { bone: 'handF', z: 41.5, zb: 11.5, glow: true }, (g) => g.stroke(polyline([[46, -54], [54, -48], [62, -54], [70, -48]]), CORE, 1.4));
  emblem(F, 'emblem', 'torso', 23, -28, -70, 3.4, { view: 'front' });

  F.anim({
    // ein Vogel hüpft im Bäumchen, der Golem brummt
    idle: { p: { breathe: 0.02, bob: 1, sway: 1, tilt: 1 }, keys: { bird: { x: [[0, 0], [0.3, 0], [0.35, 8], [0.6, 8], [0.65, 0]], y: [[0, 0], [0.3, 0], [0.32, -4], [0.35, 0], [0.6, 0], [0.62, -4], [0.65, 0]] } } },
    // langsamer Stampfgang, Blätter rieseln
    walk: { p: { stride: 10, bob: 5, squash: 0.06, armSwing: 8, lean: 2 }, keys: { back: { r: [[0, -2], [0.5, 2], [1, -2]] } }, ev: { step: [0.25, 0.75] } },
    // beide Fäuste hoch, Doppelhieb
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -170, windB: -160, strike: -30, strikeB: -24, over: 8, lean: 10, lunge: 12 }, ev: { strike: 0.6 } },
    // Steinstaub rieselt
    hit: { p: { knock: 1, recoil: 2 } },
    // landet mit Beben, der Vogel flattert auf
    spawn: { keys: { bird: { y: [[0, -20], [0.7, -20], [1, 0]] } } },
    // bricht auseinander, der Baum fällt
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], torso: { y: [[0, 0], [0.4, 30, 'in']] }, armF: { x: [[0, 0], [0.4, 20]], r: [[0, 0], [0.4, 30]] }, armB: { x: [[0, 0], [0.4, -20]], r: [[0, 0], [0.4, -30]] }, back: { r: [[0, 0], [0.5, -60]] }, root: { sy: [[0, 1], [0.5, 0.6]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
