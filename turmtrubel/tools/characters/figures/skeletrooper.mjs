// Skelett-Fallschirmjäger – tollkühner Kadett mit Fliegerbrille, Schal, Packsack und Landungsspeer
// (Brief: docs/briefs/skeletrooper.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { lines, stitches, emblem, INK } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function skeletrooper(F) {
  const P = F.pal;
  const SUIT = P.main;
  const CANVAS = P.acc;
  const BRASS = '#c8a046';
  const CHUTE = '#f0e6d0';
  const BONE = '#efe6d0';
  const SUIT_D = '#4a5628';
  const s = 1.15;
  const X = (v) => v * s;
  const pts = (list) => list.map(([x, y, c]) => (c ? [X(x), X(y), 1] : [X(x), X(y)]));

  F.rig('biped', skeletonPivots(s, { chute: [0, -40] }), { jaw: 'head', chute: 'root' });
  skeleton(F, { s, bone: BONE, eye: '#ffd27a' });

  // ───────── Fallschirm-Packsack (Signature) mit Streifen (Teamzone) und Reißleine ─────────
  F.part('pack', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.mat(rrect(X(-13), X(-38), X(10), X(16), X(3)), CANVAS, 'cloth', { hi: 0.4 });
    g.lod(2, (h) => stitches(h, pts([[-12, -35], [-4, -35]]), '#8a8060'));
    g.mat(rrect(X(-12.6), X(-24.4), X(9), X(3), X(1)), '#a89c78', 'cloth');
  });
  F.part('packStripe', { bone: 'back', z: 3.5, zb: 46.5, team: true }, (g) => g.mat(rrect(X(-9.6), X(-38), X(3), X(16), X(0.6)), P.team, 'cloth', { line: P.teamDeep, lw: X(0.4) }));
  // Overall über den Knochen
  F.part('suit', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    const c = path(pts([[-6, -33], [7, -33], [8, -26], [7, -20], [-6, -20], [-7, -27]]));
    g.mat(c, SUIT, 'cloth', { hi: 0.4 });
    g.clipTo(c, (h) => {
      h.stroke(polyline(pts([[2, -33], [2, -20]])), SUIT_D, X(0.6), { lod: 1 });
      h.fill(rrect(X(3), X(-29), X(4), X(3.6), X(0.6)), SUIT_D, { lod: 1 });
    });
    // Gurte mit Schnellverschluss
    g.stroke(polyline(pts([[-5, -33], [6, -21]])), '#3a2a1c', X(1));
    g.mat(circle(X(1.6), X(-26.4), X(1.4)), BRASS, 'metal');
  });
  F.part('shorts', { bone: 'hip', z: 13, zb: 13 }, (g) => g.mat(path(pts([[-6, -23], [6, -23], [7, -14], [1, -14], [0, -18], [-1, -14], [-7, -14]])), SUIT, 'cloth', { hi: 0.3 }));
  F.part('ripcord', { bone: 'torso', z: 22, view: 'front' }, (g) => {
    g.stroke(spline(pts([[-4, -31], [-1, -29], [3, -30]])), '#c84a3a', X(0.6));
    g.stroke(circle(X(3.4), X(-30), X(1)), BRASS, X(0.6));
  });
  // Fliegerschal (Teamzone)
  F.part('scarf', { bone: 'torso', z: 24, zb: 24, team: true }, (g) => {
    g.mat(path(pts([[-5, -34], [9, -33.6], [8, -31], [-5, -31.6]])), P.team, 'cloth', { line: P.teamDeep, lw: X(0.4) });
    g.mat(path(pts([[-5, -33.6], [-12, -31], [-16, -33, 1], [-11, -29], [-5, -31]])), P.teamShade, 'cloth', { line: P.teamDeep, lw: X(0.4) });
  });
  // Fliegerbrille auf dem Schädel
  F.part('goggles', { bone: 'head', z: 33.4, zb: 33.4 }, (g) => {
    g.mat(rrect(X(-8), X(-50), X(22), X(2.6), X(1)), '#5a3a22', 'leather');
    for (const x of [4, 10]) {
      g.mat(circle(X(x), X(-50), X(3)), BRASS, 'metal', { hi: 0.8 });
      g.mat(circle(X(x), X(-50), X(2)), '#9ad8f0', 'glass');
    }
  });

  // ───────── Landungsspeer mit gerolltem Wimpel ─────────
  F.part('spear', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path(pts([[8, -6], [10, -6], [12.6, -46], [10.6, -46]])), '#8a6a44', 'wood');
    g.mat(path(pts([[10.2, -46], [11.8, -56, 1], [13.4, -46]])), BONE, 'bone', { hi: 0.6 });
    g.mat(rrect(X(10.4), X(-44), X(2.8), X(8), X(1.2)), '#c84a3a', 'cloth', { lod: 1 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(X(5), X(-30), X(9), X(-21.6), X(2), X(1.6)), SUIT, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(X(9), X(-20), X(2.2)), BONE, 'bone'));
  emblem(F, 'emblem', 'torso', 25, X(-2.6), X(-24), X(1.6), { zb: 25 });

  // ───────── Fallschirm: offen beim Herabschweben, beim Tod deckt er ihn zu ─────────
  F.part('chute', { bone: 'chute', z: 2, zb: 50, state: ['spawn'] }, (g) => {
    const top = arc(X(0), X(-74), X(22), X(14), 180, 360, 12);
    g.mat(path([...top, [X(16), X(-72)], [X(8), X(-75), 1], [X(0), X(-72)], [X(-8), X(-75), 1], [X(-16), X(-72)]]), CHUTE, 'cloth', { hi: 0.5 });
    g.fill(path([[X(-6), X(-87)], [X(6), X(-87)], [X(4), X(-73)], [X(-4), X(-73)]]), P.team, { op: 0.9 });
    for (const x of [-20, -8, 8, 20]) g.stroke(polyline(pts([[x, -73], [x > 0 ? 3 : -3, -34]])), '#8a8070', X(0.4));
  });
  // liegt über dem nach hinten gekippten Körper (Gegendrehung zum Sturz um -70°)
  F.part('chuteDrape', { bone: 'root', z: 50, zb: 50, state: 'drape' }, (g) => {
    const d = path(pts([[-54, 0], [-50, -10], [-34, -16], [-14, -15], [2, -9], [8, 0]])).rot(70, 0, 0);
    g.mat(d, CHUTE, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => h.stroke(polyline(pts([[-30, -14], [-28, -1]])).rot(70, 0, 0), '#c8bca0', X(0.5)));
    g.fill(path(pts([[-26, -15.6], [-16, -15.2], [-16, -1], [-26, -1]])).rot(70, 0, 0), P.team, { op: 0.85 });
  });

  F.anim({
    // zieht an den Gurten
    idle: { p: { breathe: 0.02, bob: 0.6, sway: 2, tilt: 3 }, keys: { armB: { r: [[0, 0], [0.4, 0], [0.5, -40], [0.6, -30], [0.7, -40], [0.8, 0]] } } },
    // zackiger Schritt
    walk: { prog: 'biped.run', p: { stride: 30, bob: 2, armSwing: 18, lean: 5 } },
    // Speerstöße
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 20, strike: -70, pull: 4, reach: 6, lean: 8, lunge: 12 }, keys: { prop: { r: [[0, 0], [0.35, 50], [0.5, 70], [1, 0]] } }, ev: { strike: 0.5 } },
    // Brille rutscht
    hit: { p: { knock: 2, recoil: 5 }, keys: { head: { r: [[0, 0], [0.2, -12], [1, 0]] } } },
    // schwebt am Schirm herab, landet mit dem Speer voran
    spawn: { prog: 'still', keys: { root: { y: [[0, -40], [0.75, 0, 'in']] }, chute: { y: [[0, 0], [0.75, 0], [1, 10]], sy: [[0, 1], [0.75, 1], [1, 0.3]] }, armF: { r: [[0, -60], [0.7, -60], [1, 0]] }, prop: { r: [[0, 80], [0.7, 80], [1, 0]] } } },
    // der Schirm deckt ihn zu
    death: { p: { dir: -1, angle: 70 }, keys: { show: { drape: [[0.5, 1.01]] } } },
  });
}
