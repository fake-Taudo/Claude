// Mauerbrecher-Läufer – ein Mauerbrecher, dessen Fass geplatzt ist, rennt gehetzt auf extrem langen Knochenbeinen weiter
// (Brief: docs/briefs/wall-breaker-runner.md)
import { ellipse, circle, rrect, path, limb, polyline, spline } from '../geo.mjs';
import { emblem } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function wallBreakerRunner(F) {
  const P = F.pal;
  const BONE = P.main;
  const SH = '#c8bca0';
  const s = 1.05;
  const LIFT = 18;
  const X = (v) => v * s;
  // Oberkörper um LIFT angehoben, Beine entsprechend länger
  const piv = skeletonPivots(s);
  for (const k of Object.keys(piv)) if (!['footB', 'footF'].includes(k)) piv[k] = [piv[k][0], piv[k][1] - LIFT];
  F.rig('biped', piv, { jaw: 'head' });
  skeleton(F, { s, bone: BONE, shadow: SH, eye: '#ffb03a', legs: false, lift: LIFT });

  // ───────── Extrem lange Knochenbeine ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z }, (g) => {
      const top = X(-20) - LIFT;
      g.mat(limb(X(x), top, X(x * 1.05), X(-5), X(1.5), X(1.3)), col, 'bone');
      g.mat(circle(X(x * 1.02), (top + X(-5)) / 2, X(2)), col, 'bone');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(path([[X(x - 2), X(-5)], [X(x + 2), X(-5.4)], [X(x + 6), X(-1.6)], [X(x + 6), 0, 1], [X(x - 2.6), 0, 1]]), col, 'bone', { hi: 0.5 }));
  };
  leg('legB', 'footB', -3, 6, SH);
  leg('legF', 'footF', 3, 8, BONE);
  F.part('pelvis', { bone: 'hip', z: 12, zb: 12 }, (g) => g.mat(path([[X(-5), X(-22) - LIFT], [X(5), X(-22) - LIFT], [X(6), X(-18) - LIFT], [X(2), X(-16) - LIFT, 1], [X(-2), X(-16) - LIFT, 1], [X(-6), X(-18) - LIFT]]), BONE, 'bone', { hi: 0.4 }));
  // Sprinter-Stirnband (Signature, Teamzone), flattert waagerecht nach hinten
  F.part('headband', { bone: 'head', z: 33, zb: 33, team: true, sig: true }, (g) => {
    const y = X(-48) - LIFT;
    g.mat(path([[X(-8), y - 1.6], [X(14), y - 2.4], [X(14.4), y + 1.4], [X(-7.6), y + 2.2]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[X(-8), y - 1], [X(-20), y - 2], [X(-30), y - 4, 1], [X(-24), y], [X(-32), y + 2, 1], [X(-20), y + 2], [X(-8), y + 2]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('soot', { bone: 'head', z: 33.5, view: 'front' }, (g) => g.fill(ellipse(X(4), X(-38) - LIFT, X(3), X(1.6)), '#3a3a3a', { op: 0.4 }));
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(X(5), X(-30) - LIFT, X(9), X(-21) - LIFT, X(1.3), X(1.2)), BONE, 'bone'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(X(9), X(-20) - LIFT, X(2.4)), BONE, 'bone'));
  emblem(F, 'emblem', 'torso', 25, X(-3), X(-24) - LIFT, X(1.6), { zb: 25 });

  F.anim({
    // trippelt auf der Stelle
    idle: { prog: 'biped.run', p: { stride: 10, bob: 1.6, armSwing: 20, lean: 6 }, keys: { jaw: { r: [[0, 8], [1, 8]] } } },
    // rennt mit rudernden Armen
    walk: { prog: 'biped.run', p: { stride: 44, bob: 3, armSwing: 50, lean: 14 }, keys: { jaw: { r: [[0, 12], [1, 12]] }, expr: [[0, 1, 'hurt']] } },
    // Hechtsprung mit Faustschlag
    attack: { prog: 'atk.punch', hit: 0.55, p: { wind: 30, strike: -90, reach: 10, lunge: 30 }, keys: { root: { y: [[0, 0], [0.4, -8], [0.55, -4], [0.8, 0]] } }, ev: { strike: 0.55 } },
    // stolpert
    hit: { p: { knock: 3, recoil: 6 } },
    // springt aus der Explosion
    spawn: { keys: { root: { y: [[0, -10], [0.5, 0, 'in']] } } },
    // zerfällt im Laufen
    death: { prog: 'generic.death' },
  });
}
