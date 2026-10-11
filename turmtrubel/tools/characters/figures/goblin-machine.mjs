// Goblin Machine – stampfender Kampfanzug aus Schrott und Kesselblech mit Kobold in der Glaskanzel, Kolbenfaust und
// Schulter-Raketenwerfer (Brief: docs/briefs/goblin-machine.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { mouthOpen, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinMachine(F) {
  const P = F.pal;
  const PLATE = P.main;
  const GLASS = P.acc;
  const GOB = '#7fae4a';
  const RIVET = '#c8ccd2';
  const ROCKET = '#e8b030';
  const PLATE_D = '#5a3a2c';
  const PIPE = '#3a3d44';

  F.rig('biped', {
    hip: [0, -36],
    torso: [0, -40],
    head: [4, -96],
    hat: [4, -110],
    back: [-24, -96],
    armB: [-32, -84],
    handB: [-38, -50],
    armF: [34, -84],
    handF: [46, -50],
    prop: [46, -50],
    legB: [-14, -36],
    footB: [-16, -8],
    legF: [14, -36],
    footF: [16, -8],
    cape: [0, -96],
  });

  // ───────── Schulter-Raketenwerfer mit Wimpel (Teamzone) ─────────
  F.part('launcher', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(rrect(-42, -112, 34, 14, 3).rot(-14, -25, -105), PLATE_D, 'metal', { hi: 0.6 });
    for (const dy of [-4, 4]) g.fill(circle(-6, -110 + dy, 3.4), '#1a1a1e');
    g.lod(1, (h) => rivets(h, [[-36, -110], [-20, -114]], 0.9, RIVET));
  });
  F.part('rockets', { bone: 'back', z: 3.5, zb: 46.5, state: ['idle', 'walk', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'death'] }, (g) => {
    for (const dy of [-4, 4]) g.mat(path([[-8, -112 + dy], [-2, -114 + dy], [1, -110 + dy, 1], [-2, -106 + dy], [-8, -108 + dy]]), ROCKET, 'metal', { hi: 0.7 });
  });
  F.part('rocketFlag', { bone: 'back', z: 2.5, zb: 45.5, team: true }, (g) => {
    g.stroke(polyline([[-38, -112], [-42, -136]]), PIPE, 1.4);
    g.mat(path([[-42, -136], [-28, -132], [-34, -129], [-28, -126], [-41, -124]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('exhaust', { bone: 'back', z: 2, zb: 45 }, (g) => {
    g.mat(rrect(-36, -96, 8, 20, 2), PIPE, 'metal', { hi: 0.5 });
  });
  F.part('puff', { bone: 'back', z: 2.2, zb: 45.2, state: ['puff', 'spawn', 'muzzle'] }, (g) => {
    for (const [x, y, r] of [[-32, -102, 4], [-36, -110, 5], [-30, -118, 4]]) g.fill(circle(x, y, r), '#a8a4a0', { op: 0.7 });
  });

  // ───────── Stampfbeine ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -38, x * 1.1, -12, 9, 8), PLATE_D, 'metal', { hi: 0.6 });
      g.mat(circle(x * 1.05, -24, 7), PIPE, 'metal', { hi: 0.6 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 14, -12, 1], [fx + 10, -12, 1], [fx + 20, -4], [fx + 20, 0, 1], [fx - 15, 0, 1]]), PLATE, 'metal', { hi: 0.6 });
      g.lod(1, (h) => rivets(h, [[fx - 8, -8], [fx + 2, -8], [fx + 12, -6]], 0.9, RIVET));
    });
  };
  leg('legB', 'footB', -14, 6);
  leg('legF', 'footF', 14, 8);

  // ───────── Kleiner Greifarm hinten ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(-32, -84, -36, -56, 5, 4.4), PIPE, 'metal', { hi: 0.5 });
    g.mat(circle(-34, -70, 4.6), PLATE_D, 'metal');
  });
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => {
    g.mat(path([[-40, -52, 1], [-32, -52, 1], [-30, -40, 1], [-34, -44], [-38, -38, 1], [-42, -44]]), PLATE_D, 'metal', { hi: 0.5 });
  });

  // ───────── Kesselrumpf mit Nieten, Schweißnähten, Scheinwerferaugen ─────────
  F.part('hull', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const h0 = blob([[-34, -96], [0, -102], [34, -96], [40, -70], [32, -40], [-30, -40], [-38, -70]], 0.65);
    g.mat(h0, PLATE, 'metal', { hi: 0.7 });
    g.clipTo(h0, (h) => {
      h.fill(rrect(-42, -60, 84, 4, 0), PLATE_D);
      h.lod(1, (k) => {
        lines(k, [[[-20, -94], [-24, -44]], [[22, -94], [24, -44]]], PLATE_D, 1, 1);
        k.fill(ellipse(-14, -50, 5, 3), '#8a4a2a', { op: 0.6 });
        k.fill(ellipse(20, -74, 4, 2.6), PLATE_D, { op: 0.6 });
      });
    });
    g.lod(1, (h) => rivets(h, [[-26, -90], [-10, -96], [10, -96], [26, -90], [-28, -48], [28, -48]], 1, RIVET));
    // Scheinwerfer
    for (const x of [16, 28]) g.mat(circle(x, -66, 5), '#3a3d44', 'metal');
  });
  F.part('lamps', { bone: 'torso', z: 19, zb: 29, view: 'front', glow: true }, (g) => {
    for (const x of [16, 28]) g.fill(circle(x, -66, 3.4), '#fff4c8');
  });
  // ───────── Glaskanzel mit jauchzendem Kobold-Piloten, Helm (Teamzone) ─────────
  F.part('pilot', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-8, -100], [-6, -110], [4, -114], [14, -110], [16, -100], [10, -94], [-2, -94]], 0.7), GOB, 'skin', { hi: 0.4 });
    g.mat(path([[-8, -104], [-18, -108, 1], [-8, -100]]), '#5e8a34', 'skin');
    g.mat(path([[14, -104], [22, -108, 1], [15, -100]]), '#5e8a34', 'skin');
  });
  F.part('pilotFace', { bone: 'head', z: 31, view: 'front' }, (g) => {
    for (const x of [4, 11]) {
      g.mat(circle(x, -105, 2.2), '#c8a046', 'metal');
      g.fill(circle(x, -105, 1.5), '#9ad8f0');
    }
    mouthOpen(g, 8, -98, 6, 3.4, { teeth: 'top', tongue: true });
  });
  F.part('helmet', { bone: 'head', z: 31.5, zb: 31.5, team: true }, (g) => g.mat(path([[-8, -108, 1], [-6, -116], [4, -119], [14, -115], [16, -108, 1]]), P.team, 'leather', { line: P.teamDeep, hi: 0.5 }));
  F.part('canopy', { bone: 'head', z: 32, zb: 32 }, (g) => {
    const c = blob([[-14, -94], [-12, -112], [4, -124], [20, -112], [22, -94]], 0.8);
    g.fill(c, GLASS, { op: 0.28 });
    g.stroke(c, '#2a8a80', 1.2);
    g.fill(ellipse(-4, -112, 3, 6, 30), '#ffffff', { op: 0.6 });
  });
  F.part('canopyRim', { bone: 'torso', z: 32.5, zb: 32.5 }, (g) => g.mat(rrect(-16, -98, 40, 6, 2), PLATE_D, 'metal', { hi: 0.6 }));

  // ───────── Kolbenfaust (Signature) mit Dampfzylinder ─────────
  F.part('armF', { bone: 'armF', z: 34, zb: 6 }, (g) => {
    g.mat(limb(34, -84, 42, -60, 8, 7), PIPE, 'metal', { hi: 0.5 });
    g.mat(circle(34, -84, 9), PLATE_D, 'metal', { hi: 0.6 });
  });
  F.part('piston', { bone: 'prop', z: 40, zb: 7, sig: true }, (g) => {
    g.mat(rrect(34, -66, 18, 16, 3), '#8a8f99', 'metal', { hi: 0.9 });
    g.lod(1, (h) => lines(h, [[[36, -62], [50, -62]], [[36, -58], [50, -58]]], '#5a5f6b', 0.8, 1));
    g.mat(rrect(40, -52, 6, 8, 1.4), '#c8ccd2', 'metal', { hi: 0.9 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 8 }, (g) => {
    g.mat(blob([[34, -48], [46, -50], [58, -44], [58, -30], [46, -24], [34, -30]], 0.6), PLATE, 'metal', { hi: 0.7 });
    g.lod(1, (h) => rivets(h, [[40, -44], [52, -44], [40, -30], [52, -30]], 1, RIVET));
  });
  F.part('steamJet', { bone: 'handF', z: 42, state: ['muzzle'] }, (g) => {
    for (const [x, y, r] of [[30, -60, 4], [24, -66, 5], [20, -74, 4]]) g.fill(circle(x, y, r), '#f0f4f8', { op: 0.8 });
  });
  F.part('parachute', { bone: 'root', z: 50, state: 'death' }, (g) => {
    g.mat(path([[-10, -150, 1], [-6, -164], [8, -170], [22, -164], [26, -150, 1], [18, -152], [8, -150], [-2, -152]]), '#f0e6d0', 'cloth', { hi: 0.5 });
    for (const x of [-8, 8, 24]) g.stroke(polyline([[x, -151], [8, -126]]), '#8a8070', 0.5);
    g.mat(circle(8, -122, 4), GOB, 'skin');
  });
  emblem(F, 'emblem', 'torso', 23, -14, -76, 3, { view: 'front' });

  F.anim({
    // Auspuff pufft, der Pilot kurbelt an Hebeln
    idle: { p: { breathe: 0.02, bob: 1.2, sway: 1, tilt: 3 }, keys: { show: { puff: [[0.2, 0.45], [0.7, 0.9]] } } },
    // stampfender Gang, Rumpf schaukelt
    walk: { p: { stride: 14, bob: 4, squash: 0.05, armSwing: 8, lean: 3 }, keys: { torso: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // Kolben zieht zurück, Faust schnellt vor mit Dampfstoß
    attack: { prog: 'atk.punch', hit: 0.55, p: { wind: 30, strike: -80, reach: 14, lunge: 12 }, keys: { show: { muzzle: [[0.55, 0.75]] } }, ev: { strike: 0.55 } },
    // Funken, der Pilot duckt sich
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { head: { y: [[0, 0], [0.2, 4], [1, 0]] } } },
    // landet mit Dampfwolke
    spawn: {},
    // fällt auseinander, der Pilot springt mit Schirm heraus
    death: { p: { dir: -1, angle: 70 } },
  });
}
