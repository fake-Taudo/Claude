// Mauerbrecher – zwei begeisterte Skelette, die ein Pulverfass mit glimmender Lunte über dem Kopf tragen
// (Brief: docs/briefs/wall-breakers.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, rivets, emblem, INK, WHITE } from '../kit.mjs';
import { skeleton, skeletonPivots } from './skeletons.mjs';

export default function wallBreakers(F) {
  const P = F.pal;
  const WOOD = P.main;
  const IRON = P.acc;
  const BONE = '#e8dfc8';
  const FUSE = '#ff7a2a';
  const s = 1.15;
  const X = (v) => v * s;

  F.rig('biped', skeletonPivots(s, { keg: [2, -66], armB: [-4, -30], handB: [-6, -60], armF: [5, -30], handF: [10, -60] }), { jaw: 'head', keg: 'torso' });
  skeleton(F, { s, bone: BONE, eye: '#ffb03a', skipArms: true });

  // ───────── Erhobene Arme halten das Fass ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(X(-4), X(-30), X(-8), X(-58), X(1.3), X(1.2)), '#c8bca0', 'bone'));
  F.part('handB', { bone: 'handB', z: 47, zb: 43 }, (g) => g.mat(circle(X(-8), X(-60), X(2.2)), '#c8bca0', 'bone'));
  // Stirnband (Teamzone)
  F.part('headband', { bone: 'head', z: 33, zb: 33, team: true }, (g) => {
    g.mat(path([[X(-8), X(-49)], [X(14), X(-50)], [X(14.4), X(-46.6)], [X(-7.6), X(-45.6)]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[X(-8), X(-48)], [X(-16), X(-50)], [X(-14), X(-46)], [X(-8), X(-46)]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('evoHeadband', { bone: 'head', z: 33.2, zb: 33.2, evo: 'evo', team: true }, (g) => g.mat(path([[X(-14), X(-49)], [X(-26), X(-52)], [X(-22), X(-47)], [X(-14), X(-46)]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));

  // ───────── Pulverfass (Signature) mit glimmender Lunte, Fassband (Teamzone) ─────────
  F.part('keg', { bone: 'keg', z: 46, zb: 46, sig: true }, (g) => {
    const k = path([[X(-12), X(-60)], [X(16), X(-60)], [X(18), X(-70)], [X(16), X(-80)], [X(-12), X(-80)], [X(-14), X(-70)]]);
    g.mat(k, WOOD, 'wood', { hi: 0.4 });
    g.clipTo(k, (h) => {
      h.lod(1, (q) => lines(q, [[[X(-6), X(-80)], [X(-7), X(-60)]], [[X(2), X(-80)], [X(2), X(-60)]], [[X(10), X(-80)], [X(11), X(-60)]]], '#5a3a1e', 0.6, 1));
      for (const y of [-77, -63]) h.fill(rrect(X(-16), X(y), X(36), X(2.4), 0), IRON);
      h.fill(ellipse(X(-4), X(-66), X(3), X(1.6)), '#2a1a10', { op: 0.6, lod: 1 });
    });
    g.mat(circle(X(2), X(-80), X(2)), '#3a2414', 'wood');
  });
  F.part('kegBand', { bone: 'keg', z: 46.5, zb: 46.5, team: true }, (g) => g.mat(rrect(X(-14), X(-71.4), X(32), X(3), X(0.6)), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 }));
  F.part('evoIron', { bone: 'keg', z: 46.6, zb: 46.6, evo: 'evo' }, (g) => {
    for (const [x, y] of [[-12, -78], [16, -78], [-12, -62], [16, -62]]) g.mat(rrect(X(x - 2), X(y - 2), X(4), X(4), 0.6), '#5a5f6b', 'metal', { hi: 0.7 });
    g.stroke(spline([[X(6), X(-80)], [X(8), X(-86)], [X(12), X(-88)]]), '#6a4a2a', X(0.8));
    g.fill(circle(X(12.4), X(-88.4), X(1.4)), FUSE);
  });
  F.part('fuse', { bone: 'keg', z: 47, zb: 47 }, (g) => g.stroke(spline([[X(2), X(-80)], [X(0), X(-86)], [X(4), X(-90)]]), '#6a4a2a', X(0.9)));
  F.part('spark', { bone: 'keg', z: 47.5, zb: 47.5, glow: true }, (g) => {
    g.fill(circle(X(4.4), X(-90.6), X(2.4)), FUSE, { op: 0.5 });
    g.fill(circle(X(4.4), X(-90.6), X(1.2)), '#fff4c8');
  });
  F.part('boom', { bone: 'keg', z: 48, state: ['muzzle', 'death'], glow: true }, (g) => {
    g.fill(blob([[X(-24), X(-70)], [X(-12), X(-96)], [X(12), X(-102)], [X(30), X(-84)], [X(26), X(-56)], [X(-14), X(-52)]], 0.8), '#ffb03a', { op: 0.85 });
    g.fill(circle(X(2), X(-76), X(12)), '#fff4c8', { op: 0.9 });
  });
  F.part('armF', { bone: 'armF', z: 28, zb: 6 }, (g) => g.mat(limb(X(5), X(-30), X(12), X(-58), X(1.3), X(1.2)), BONE, 'bone'));
  F.part('handF', { bone: 'handF', z: 47.2, zb: 7 }, (g) => g.mat(circle(X(12), X(-60), X(2.2)), BONE, 'bone'));
  emblem(F, 'emblem', 'torso', 25, X(-3), X(-24), X(1.6), { zb: 25 });

  F.anim({
    // balancieren das Fass
    idle: { p: { breathe: 0.02, bob: 1, sway: 0, tilt: 3 }, keys: { keg: { r: [[0, -4], [0.5, 4], [1, -4]], x: [[0, -1], [0.5, 1], [1, -1]] }, jaw: { r: [[0, 6], [0.5, 12], [1, 6]] } } },
    // rennen kichernd, das Fass wippt
    walk: { prog: 'biped.run', p: { stride: 36, bob: 3, armSwing: 0, lean: 12 }, keys: { keg: { y: [[0, 0], [0.25, -3], [0.5, 0], [0.75, -3], [1, 0]] }, jaw: { r: [[0, 4], [0.25, 14], [0.5, 4], [0.75, 14], [1, 4]] } } },
    // Sprung gegen das Gebäude, das Fass zündet
    attack: { prog: 'still', hit: 0.55, keys: { root: { x: [[0, 0], [0.3, -4], [0.55, 14, 'out']], y: [[0, 0], [0.3, 2], [0.45, -14], [0.55, -6]] }, torso: { r: [[0, 0], [0.55, 30]] }, show: { muzzle: [[0.55, 1.01]] }, expr: [[0, 1, 'attack']] }, ev: { strike: 0.55 } },
    // Fass wackelt gefährlich
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { keg: { r: [[0, 0], [0.15, -14], [0.3, 12], [0.5, -6], [0.7, 0]] } } },
    // landen, das Fass hüpft
    spawn: { keys: { keg: { y: [[0, 0], [0.6, 0], [0.75, -8], [0.9, 0]] } } },
    // Explosion
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], show: { muzzle: [[0, 0.5]] }, root: { sy: [[0, 1], [0.3, 0.4]] }, alpha: [[0, 1], [0.3, 1], [0.6, 0]] } },
  });
}
