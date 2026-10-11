// Wächter – steife Skelett-Wachen mit Sargdeckel-Schild, rostigem Helm und Knochenspeer (Brief: docs/briefs/guards.md)
// Form „broken“: Schildbruch – der Deckel ist weg, am Arm bleibt ein Holzsplitter (F.meta.shieldBreak).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { lines, rivets, emblem, INK } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function guards(F) {
  const P = F.pal;
  const BONE = P.acc;
  const HELM = '#7a828e';
  const IRON = '#5a5f6b';
  const WOOD = '#7a5232';
  const s = 1.15;
  const X = (v) => v * s;
  const pts = (list) => list.map(([x, y, c]) => (c ? [X(x), X(y), 1] : [X(x), X(y)]));

  F.rig('biped', skeletonPivots(s, { handB: [8, -23] }), { jaw: 'head' });
  F.meta.shieldBreak = 'broken';
  F.defaultForm = ['base', 'broken'];

  skeleton(F, { s, bone: BONE, shadow: '#c8bca0', eye: '#9af07a', skipArms: true });
  // hinterer Arm zum Schildgriff
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(X(-4), X(-30), X(7), X(-23), X(1.3), X(1.2)), '#c8bca0', 'bone'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(X(8), X(-23), X(2)), '#c8bca0', 'bone'));

  // ───────── Rostiger Kesselhelm mit Helmfeder (Teamzone) ─────────
  F.part('helm', { bone: 'hat', z: 34, zb: 34 }, (g) => {
    g.mat(path(pts([[-10, -46], [-8, -54], [0, -58.6], [9, -58], [15, -52], [16, -46], [18, -45.4, 1], [-12, -45, 1]])), HELM, 'metal', { hi: 0.7 });
    g.lod(1, (h) => {
      h.stroke(polyline(pts([[-11, -46.6], [17, -46.6]])), IRON, X(0.6));
      rivets(h, pts([[-6, -48.6], [2, -48.6], [10, -48.6]]), X(0.6), '#a8b0ba');
    });
  });
  F.part('helmRust', { bone: 'hat', z: 34.2, variant: 1 }, (g) => {
    g.fill(ellipse(X(4), X(-53), X(3), X(2)), '#9a5a32', { op: 0.75 });
    g.fill(ellipse(X(11), X(-50), X(1.4), X(1)), '#9a5a32', { op: 0.6 });
  });
  F.part('plume', { bone: 'hat', z: 33.5, zb: 34.5, team: true }, (g) => {
    g.mat(path(pts([[1, -58], [-2, -64], [-8, -68], [-4, -66.6, 1], [2, -63], [4, -58.4]])), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.mat(rrect(X(0.6), X(-59.6), X(3.6), X(2.4), X(0.6)), IRON, 'metal');
  });

  // ───────── Knochenspeer ─────────
  F.part('spear', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path(pts([[-4, -22], [34, -24.6], [34, -23], [-4, -20.4]])), '#8a6a44', 'wood');
    g.mat(path(pts([[33, -26.6], [43, -23.8, 1], [33, -21.2], [35, -23.8]])), '#efe6d0', 'bone', { hi: 0.6 });
    g.stroke(polyline(pts([[31, -25.2], [31, -22.4]])), IRON, X(0.8));
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(X(5), X(-30), X(9), X(-21), X(1.3), X(1.2)), BONE, 'bone'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(X(9), X(-20), X(2.2)), BONE, 'bone'));

  // ───────── Sargdeckel-Schild (Signature) mit Eisenbeschlägen und Emblem (Teamzone) ─────────
  const lid = pts([[12.6, -42], [20.6, -38.6], [22.4, -28], [19, -4], [8, -4], [5, -28], [6, -38.6]]);
  F.part('shield', { bone: 'handB', z: 60, zb: 8, sig: true, form: 'base' }, (g) => {
    const L = path(lid);
    g.mat(L, WOOD, 'wood', { hi: 0.4 });
    g.clipTo(L, (h) => {
      h.lod(1, (k) => lines(k, [pts([[9, -40], [8, -6]]), pts([[14, -42], [13.6, -6]]), pts([[18, -40], [17.6, -6]])], '#5a3a22', X(0.5), 1));
      h.fill(path(pts([[4, -32], [24, -32], [24, -29], [4, -29]])), IRON);
      h.fill(path(pts([[4, -12], [24, -12], [24, -9], [4, -9]])), IRON);
    });
    g.lod(1, (h) => rivets(h, pts([[6.6, -30.6], [21.6, -30.6], [7.6, -10.6], [19.6, -10.6], [12.6, -39.6]]), X(0.7), '#a8b0ba'));
  });
  F.part('shieldNotch', { bone: 'handB', z: 60.2, zb: 8.2, variant: 2, form: 'base' }, (g) => g.fill(path(pts([[21.6, -24], [18.6, -22], [21.2, -20]])), '#3a2414'));
  F.part('shieldEmblem', { bone: 'handB', z: 60.5, zb: 8.5, team: true, form: 'base' }, (g) => {
    g.mat(poly(pts([[13.6, -26], [17.6, -20.6], [13.6, -14], [9.6, -20.6]]), X(0.6)), P.team, 'metal', { line: P.teamDeep, hi: 0.6 });
  });
  emblem(F, 'emblem', 'handB', 61, X(13.6), X(-20.4), X(1.7), { zb: 9, form: 'base' });
  F.part('splinter', { bone: 'handB', z: 42, zb: 8, form: 'broken' }, (g) => {
    g.mat(path(pts([[6, -27], [11, -28], [13, -32, 1], [12, -24], [6, -22]])), WOOD, 'wood');
    g.stroke(polyline(pts([[7, -25], [11, -27]])), IRON, X(0.7));
  });
  // ohne Schild: Teamfarbe am Helm reicht, das Emblem wandert auf die Brust
  emblem(F, 'emblemBody', 'torso', 25, X(-3), X(-25), X(1.8), { zb: 25, form: 'broken' });
  F.defaultForm = undefined;

  F.anim({
    // stehen stramm, ein Knochen wackelt
    idle: { p: { breathe: 0.01, bob: 0.2, sway: 0.5, tilt: 1 }, keys: { jaw: { r: [[0, 0], [0.6, 0], [0.65, 8], [0.7, 0], [0.75, 8], [0.8, 0]] }, armF: { r: [[0, 0], [0.4, 0], [0.45, 5], [0.5, 0]] } } },
    // Gleichschritt
    walk: { p: { stride: 22, bob: 1.6, armSwing: 0, lean: 0 } },
    // Speerstoß hinter dem Deckel hervor
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 15, strike: -15, pull: 6, reach: 9, lean: 4, lunge: 6 }, ev: { strike: 0.5 } },
    // Deckel ächzt
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { handB: { x: [[0, 0], [0.2, -2], [0.6, 0]], r: [[0, 0], [0.2, -6], [0.6, 0]] } } },
    // landen mit dem Deckel voran
    spawn: { keys: { handB: { y: [[0, 6], [0.5, 0]] } } },
    // Knochen fallen hinter den Deckel
    death: { p: { dir: -1, angle: 70 }, keys: { handB: { r: [[0, 0], [0.4, 40]] } } },
  });
}
