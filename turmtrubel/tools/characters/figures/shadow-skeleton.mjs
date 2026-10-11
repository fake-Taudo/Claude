// Schattenskelett – flüsternder Schatten eines gefallenen Skeletts mit Rauchschweif statt Beinen
// (Brief: docs/briefs/shadow-skeleton.md)
import { ellipse, circle, rrect, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, emblem } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function shadowSkeleton(F) {
  const P = F.pal;
  const SHADOW = P.main;
  const GLOW = P.acc;
  F.rig('biped', skeletonPivots(1, { hip: [0, -18], torso: [0, -20] }), { jaw: 'head' });
  F.meta.hover = 0.15;

  // ───────── Rauchschweif (Signature) ─────────
  F.part('smoke', { bone: 'hip', z: 8, zb: 8, sig: true }, (g) => {
    g.mat(path([[-6, -22], [6, -22], [7, -16], [4, -10], [-1, -6], [-6, -2, 1], [-4, -7], [-9, -10, 1], [-6, -13], [-8, -18]]), SHADOW, 'cloth', { hi: 0.6 });
    g.lod(1, (h) => lines(h, [[[2, -18], [0, -12], [-3, -8]], [[-4, -16], [-6, -12]]], '#6a5aa0', 0.6, 1));
  });
  F.part('smokeWisps', { bone: 'hip', z: 8.5, glow: true }, (g) => {
    for (const [x, y, r] of [[-6, -2, 1.4], [-9, -10, 1], [3, -9, 1.2]]) g.fill(circle(x, y, r), GLOW, { op: 0.6 });
  });
  skeleton(F, { bone: '#6a5aa0', shadow: '#4a3a7a', eye: GLOW, socket: '#120c22', legs: false });
  // Augenglut-Ring (Teamzone)
  F.part('eyeRing', { bone: 'head', z: 32.5, view: 'front', team: true }, (g) => {
    g.stroke(ellipse(10, -42.4, 3.6, 4), P.team, 0.9);
    g.stroke(ellipse(3.6, -42.4, 3.2, 3.8), P.team, 0.9);
  });
  F.part('eyeRingBack', { bone: 'head', z: 33.5, view: 'back', team: true }, (g) => g.stroke(spline([[-6, -44], [3, -50], [12, -46]]), P.team, 1.2));
  // Schattendolch: nimmt nur beim Stich Form an
  F.part('shadowDagger', { bone: 'prop', z: 38, zb: 4, state: 'attack', glow: true }, (g) => {
    g.fill(path([[8, -21.6], [18, -24.6], [24, -24, 1], [18, -22.4], [9, -19]]), GLOW, { op: 0.85 });
    g.fill(ellipse(16, -23, 7, 2.4), '#8a6ae0', { op: 0.4 });
  });
  F.part('handWisp', { bone: 'prop', z: 38, zb: 4, state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'death', 'sleep', 'charge'] }, (g) => {
    g.stroke(spline([[9, -20], [12, -22], [14, -20.6], [16, -22.6]]), '#8a6ae0', 1.4, { op: 0.6 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(5, -30, 9, -21, 1.3, 1.2), '#6a5aa0', 'bone'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(9, -20, 2.2), '#6a5aa0', 'bone'));
  emblem(F, 'emblem', 'torso', 25, -3, -25, 1.8, { zb: 25 });

  F.anim({
    // flackert und wabert
    idle: { prog: 'still', keys: { root: { y: [[0, 0], [0.5, -2], [1, 0]], sx: [[0, 1], [0.25, 1.04], [0.5, 1], [0.75, 0.97], [1, 1]] }, hip: { r: [[0, -4], [0.5, 4], [1, -4]] }, head: { r: [[0, 2], [0.5, -3], [1, 2]] }, alpha: [[0, 1], [0.3, 0.85], [0.35, 1], [0.7, 0.9], [1, 1]] } },
    // gleitet
    walk: { prog: 'still', keys: { root: { y: [[0, -1], [0.5, -2.4], [1, -1]], r: [[0, 6], [1, 6]] }, hip: { r: [[0, 10], [0.5, 4], [1, 10]] }, armF: { r: [[0, -10], [0.5, 10], [1, -10]] }, armB: { r: [[0, 10], [0.5, -10], [1, 10]] } } },
    // Schattenstich
    attack: { prog: 'atk.thrust', hit: 0.5, p: { wind: 30, strike: -80, pull: 3, reach: 4, lean: 8, lunge: 12 }, ev: { strike: 0.5 } },
    // unverwundbar: nur Wabern
    hit: { prog: 'still', keys: { root: { sx: [[0, 1], [0.3, 1.1], [0.6, 0.95], [1, 1]] }, alpha: [[0, 0.7], [1, 1]] } },
    // steigt aus einem gefallenen Skelett
    spawn: { prog: 'still', keys: { root: { sy: [[0, 0.2], [0.7, 1, 'out']], y: [[0, 6], [0.7, 0]] }, alpha: [[0, 0], [0.5, 1]] } },
    // löst sich auf
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { sx: [[0, 1], [1, 1.5]], sy: [[0, 1], [1, 0.6]], y: [[0, 0], [1, -6]] }, alpha: [[0, 1], [1, 0, 'io']] } },
  });
}
