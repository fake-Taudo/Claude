// General Gerry – kommandierender Skelett-General mit Zweispitz, Epauletten, Monokel und Säbel
// (Brief: docs/briefs/general-gerry.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { lines, rivets, emblem, INK, WHITE } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function generalGerry(F) {
  const P = F.pal;
  const COAT = P.main;
  const GOLD = P.acc;
  const BONE = '#efe6d0';
  const SABER = '#c8ccd2';
  const s = 1.12;
  const X = (v) => v * s;
  const pts = (list) => list.map(([x, y, c]) => (c ? [X(x), X(y), 1] : [X(x), X(y)]));

  F.rig('biped', skeletonPivots(s, { handB: [7, -24] }), { jaw: 'head' });
  skeleton(F, { s, bone: BONE, eye: '#ffd27a', skipArms: true });

  // ───────── Uniformrock mit Schößen, Epauletten, Schärpe (Teamzone) ─────────
  F.part('coatTails', { bone: 'hip', z: 5, zb: 40 }, (g) => {
    g.mat(path(pts([[-6, -24], [4, -24], [2, -12], [-2, -9, 1], [-8, -12, 1]])), COAT, 'cloth', { hi: 0.3 });
    g.stroke(polyline(pts([[2, -12], [-2, -9], [-8, -12]])), GOLD, X(0.6), { lod: 1 });
  });
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(X(-4), X(-30), X(6), X(-24), X(2.2), X(1.8)), '#1e2030', 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(X(7), X(-24), X(2)), BONE, 'bone'));
  F.part('coat', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    const c = path(pts([[-6, -33], [7, -33], [8.6, -26], [7, -20], [-6, -20], [-7, -27]]));
    g.mat(c, COAT, 'cloth', { hi: 0.4 });
    g.clipTo(c, (h) => {
      h.fill(path(pts([[1, -33], [5, -33], [4, -20], [2, -20]])), '#e8e0d0');
      for (const y of [-30, -26.6, -23.4]) h.fill(circle(X(5.6), X(y), X(0.7)), GOLD, { lod: 1 });
    });
  });
  F.part('sash', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(path(pts([[-6, -33], [-3, -33.6], [8, -21], [5, -20]])), P.team, 'cloth', { line: P.teamDeep, lw: X(0.4) });
    g.mat(path(pts([[5, -21], [8, -21], [9.6, -16, 1], [7, -17], [5, -15.4, 1]])), P.teamShade, 'cloth', { line: P.teamDeep, lw: X(0.4), lod: 1 });
  });
  F.part('medal', { bone: 'torso', z: 22.5, view: 'front', lod: 1 }, (g) => {
    g.mat(circle(X(-2.6), X(-27), X(1.3)), GOLD, 'gold');
    g.mat(rrect(X(-3.4), X(-30), X(1.6), X(2.4), 0), '#a83a3a', 'cloth');
  });

  // ───────── Monokel, Zweispitz mit Federbusch (Signature, Teamzone) ─────────
  F.part('monocle', { bone: 'head', z: 32.5, view: 'front' }, (g) => {
    g.stroke(circle(X(10.2), X(-42.4), X(3.6)), GOLD, X(0.8));
    g.fill(circle(X(10.2), X(-42.4), X(3.2)), '#e8f4ff', { op: 0.25 });
    g.stroke(spline(pts([[13.4, -41], [14.6, -36], [12, -30]])), GOLD, X(0.4), { lod: 1 });
  });
  F.part('bicorne', { bone: 'hat', z: 34, zb: 34, sig: true }, (g) => {
    g.mat(path(pts([[-14, -48, 1], [-8, -55], [0, -60.6], [8, -60], [16, -55], [21, -48, 1], [12, -51.6], [3, -52.4], [-6, -51.6]])), '#1a1a22', 'cloth', { hi: 0.4 });
    g.stroke(spline(pts([[-13, -48.4], [-6, -51.6], [3, -52.4], [12, -51.6], [20, -48.4]])), GOLD, X(0.8));
    g.mat(circle(X(3.6), X(-55), X(2)), GOLD, 'gold', { lod: 1 });
  });
  F.part('plume', { bone: 'hat', z: 33.6, zb: 34.6, team: true }, (g) => {
    g.mat(path(pts([[2, -58], [-2, -66], [2, -72, 1], [5, -66], [8, -70, 1], [8, -62], [6, -58]])), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
  });

  // ───────── Säbel, Epaulette, vorderer Arm; kleiner Rundschild ─────────
  F.part('saber', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path(pts([[10, -21.6], [22, -27], [32, -34], [34, -36.6, 1], [30, -32], [21, -25], [10, -19.4]])), SABER, 'metal', { hi: 0.9 });
    g.mat(path(pts([[6.6, -24], [10.6, -24.6], [12, -18.6], [8, -17]])), GOLD, 'gold');
    g.stroke(spline(pts([[7, -18], [5.6, -21], [7.6, -24]])), GOLD, X(0.6));
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(X(5), X(-30), X(9), X(-21.6), X(2.2), X(1.8)), COAT, 'cloth'));
  F.part('epaulette', { bone: 'armF', z: 29.5, zb: 6.5 }, (g) => {
    g.mat(ellipse(X(5), X(-31.6), X(3.6), X(1.8), 20), GOLD, 'gold', { hi: 0.8 });
    g.lod(1, (h) => {
      for (const dx of [-2, 0, 2]) h.stroke(polyline(pts([[5 + dx, -30.6], [5.4 + dx, -28]])), GOLD, X(0.5));
    });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(X(9), X(-20), X(2.2)), BONE, 'bone'));
  F.part('buckler', { bone: 'handB', z: 60, zb: 8 }, (g) => {
    g.mat(circle(X(9), X(-24), X(5.6)), '#6a5a4a', 'metal', { hi: 0.7 });
    g.mat(circle(X(9), X(-24), X(2)), GOLD, 'gold');
    g.lod(1, (h) => h.stroke(circle(X(9), X(-24), X(4.4)), GOLD, X(0.5)));
  });
  emblem(F, 'emblem', 'torso', 25, X(-2.6), X(-23), X(1.6), { zb: 25 });

  F.anim({
    // kommandierend offener Kiefer
    rest: { jaw: { r: 8 } },
    // zeigt mit dem Säbel nach vorn
    idle: { p: { breathe: 0.02, bob: 0.4, sway: 1, tilt: 2 }, keys: { armF: { r: [[0, 0], [0.3, 0], [0.42, -70], [0.75, -70], [0.9, 0]] }, prop: { r: [[0, 0], [0.3, 0], [0.42, 40], [0.75, 40], [0.9, 0]] }, jaw: { r: [[0, 0], [0.45, 0], [0.5, 10], [0.55, 0], [0.6, 10], [0.65, 0]] } } },
    // Stechschritt
    walk: { p: { stride: 40, bob: 1.6, armSwing: 6, lean: -2 } },
    // Säbelhieb mit Schildstoß
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -170, strike: -40, over: 14, cock: -20, snap: 20, pushO: 3, pushO2: 3 }, ev: { strike: 0.55 } },
    // Zweispitz verrutscht
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { r: [[0, 0], [0.2, -16], [1, -6]], x: [[0, 0], [0.2, -2], [1, -1]] } } },
    // landet und salutiert
    spawn: { keys: { armF: { r: [[0, 0], [0.5, 0], [0.75, -120], [1, -120]] }, prop: { r: [[0, 0], [0.5, 0], [0.75, 75], [1, 75]] } } },
    // fällt, der Zweispitz bleibt liegen
    death: { p: { dir: -1, angle: 80 }, keys: { hat: { x: [[0, 0], [0.3, 0], [1, 10]], y: [[0, 0], [0.3, 0], [1, 20]] } } },
  });
}
