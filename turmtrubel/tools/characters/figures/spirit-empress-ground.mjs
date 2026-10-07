// Geisterkaiserin zu Fuß – würdevolle Kaiserin in jadegrüner Seidenrobe mit Laternenkrone und Seidenfächer
// (Brief: docs/briefs/spirit-empress-ground.md). empressUpper() zeichnet Oberkörper, Kopf und Fächer auch für die
// Kaiserin auf dem Nebeldrachen (spirit-empress-air.mjs).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { faceSet, lines, emblem, INK, WHITE } from '../kit.mjs';

export const EMPRESS = { JADE: '#3fb07c', LANTERN: '#ffb45a', SKIN: '#f0dcd0', HAIR: '#1e1a2a', FAN: '#f6efe0', JADE_D: '#2a8a5c' };

/**
 * Oberkörper mit Laternenkrone und Fächer. o: dx, dy (Verschiebung gegenüber der stehenden Figur), n (Knochennamen:
 * torso, head, hat, armB, handB, armF, handF, prop), z (Basis), skipFace
 */
export function empressUpper(F, o = {}) {
  const P = F.pal;
  const { JADE, LANTERN, SKIN, HAIR, FAN, JADE_D } = EMPRESS;
  const ROBE = o.robe || JADE;
  const dx = o.dx || 0;
  const dy = o.dy || 0;
  const X = (x) => x + dx;
  const Y = (y) => y + dy;
  const n = { torso: 'torso', head: 'head', hat: 'hat', armB: 'armB', handB: 'handB', armF: 'armF', handF: 'handF', prop: 'prop', ...(o.n || {}) };
  const z = o.z || 0;

  // bodenlanger hinterer Ärmel
  F.part('armB', { bone: n.armB, z: z + 9, zb: z + 42 }, (g) => {
    g.mat(path([[X(-12), Y(-60)], [X(-6), Y(-60)], [X(-6), Y(-46)], [X(-4), Y(-26)], [X(-12), Y(-22), 1], [X(-16), Y(-30)], [X(-15), Y(-46)]]), JADE_D, 'cloth', { hi: 0.3 });
  });
  F.part('torso', { bone: n.torso, z: z + 20, zb: z + 20 }, (g) => {
    g.mat(path([[X(-9), Y(-61)], [X(-2), Y(-63.6)], [X(8), Y(-63.6)], [X(11), Y(-61)], [X(11), Y(-44)], [X(-11), Y(-44)]]), ROBE, 'cloth', { hi: 0.4 });
    g.stroke(polyline([[X(-2), Y(-63)], [X(6), Y(-50)]]), FAN, 1.2, { lod: 1 });
    g.mat(rrect(X(-11), Y(-50), 22, 6, 1.6), '#f4d8a0', 'cloth');
    g.mat(circle(X(1), Y(-47), 2.4), '#5ad8a0', 'gem');
  });
  // Kopf: ovales Gesicht, geheimnisvolles Lächeln, Haarknoten mit Nadeln
  F.part('hairBun', { bone: n.head, z: z + 29, zb: z + 35 }, (g) => {
    g.mat(circle(X(-3), Y(-82), 5.6), HAIR, 'hair', { hi: 0.5 });
    g.stroke(polyline([[X(-10), Y(-86)], [X(4), Y(-80)]]), LANTERN, 0.9);
    g.stroke(polyline([[X(-8), Y(-78)], [X(2), Y(-88)]]), '#e8e0d0', 0.8);
  });
  F.part('head', { bone: n.head, z: z + 30, zb: z + 30 }, (g) => {
    g.mat(path([[X(-5), Y(-76)], [X(3), Y(-79)], [X(11), Y(-75.6)], [X(12.6), Y(-68)], [X(10.6), Y(-61.6)], [X(5), Y(-58.6)], [X(-0.6), Y(-60)], [X(-5), Y(-65)]]), SKIN, 'skin');
  });
  if (!o.skipFace) {
    faceSet(F, {
      bone: n.head,
      z: z + 32,
      eyes: [[X(8.6), Y(-69), 1.9], [X(2.6), Y(-69), 1.7]],
      iris: '#2a5a4a',
      lidColor: SKIN,
      lid: 0.5,
      brow: { color: HAIR, w: 0.8, lift: 0.6 },
      mouth: [X(7), Y(-62.6), 3.2],
      mood: 'smirk',
      attackMouth: 'oh',
    });
  }
  F.part('hair', { bone: n.head, z: z + 34, zb: z + 34 }, (g) => {
    g.mat(path([[X(-6), Y(-68)], [X(-5.6), Y(-76)], [X(1), Y(-80.6)], [X(9), Y(-80)], [X(12.6), Y(-74)], [X(8), Y(-75)], [X(2), Y(-73.6)], [X(-2), Y(-70)]]), HAIR, 'hair', { hi: 0.5 });
  });
  F.part('hairBack', { bone: n.head, z: z + 33, view: 'back' }, (g) => g.mat(path([[X(-6), Y(-76)], [X(12.6), Y(-76)], [X(12), Y(-66)], [X(6), Y(-59)], [X(-1), Y(-60)], [X(-6), Y(-66)]]), HAIR, 'hair'));
  // Laternenkrone (Signature): drei Papierlaternen, umkreist von Lichtern
  F.part('lanternCrown', { bone: n.hat, z: z + 36, zb: z + 36, sig: true }, (g) => {
    g.mat(rrect(X(-4), Y(-82), 16, 2.6, 1), '#c8a046', 'gold');
    for (const [x, h] of [[-1, 7], [4, 9.4], [9, 7]]) {
      g.mat(ellipse(X(x), Y(-82 - h / 2 - 0.6), 2.6, h / 2), LANTERN, 'cloth', { hi: 0.5 });
      g.lod(1, (k) => {
        k.stroke(polyline([[X(x - 2.4), Y(-82 - h / 2 - 0.6)], [X(x + 2.4), Y(-82 - h / 2 - 0.6)]]), '#c8702a', 0.5);
        k.stroke(polyline([[X(x), Y(-82 - h - 0.6)], [X(x), Y(-82.6)]]), '#c8702a', 0.4);
      });
      g.mat(rrect(X(x - 1.6), Y(-82 - h - 1.6), 3.2, 1.2, 0.4), '#2a2a2a', 'wood');
    }
  });
  F.part('crownLights', { bone: n.hat, z: z + 36.5, glow: true }, (g) => {
    for (const [x, y] of [[-8, -92], [16, -90], [4, -100], [-4, -100], [12, -98]]) g.fill(circle(X(x), Y(y), 1.4), '#fff0b0', { op: 0.9 });
    for (const x of [-1, 4, 9]) g.fill(circle(X(x), Y(-87), 3), LANTERN, { op: 0.35 });
  });
  // Seidenfächer mit Laternenmotiv (Quaste = Teamzone)
  F.part('fan', { bone: n.prop, z: z + 38, zb: z + 4 }, (g) => {
    const pts = arc(X(18), Y(-46), 14, 14, -150, -40, 10);
    g.mat(path([[X(18), Y(-46), 1], ...pts]), FAN, 'cloth', { hi: 0.4 });
    g.lod(1, (k) => {
      for (let a = -145; a <= -45; a += 14) {
        const r = (a * Math.PI) / 180;
        k.stroke(polyline([[X(18), Y(-46)], [X(18 + Math.cos(r) * 14), Y(-46 + Math.sin(r) * 14)]]), '#c8b890', 0.4);
      }
      k.fill(ellipse(X(17), Y(-55), 2.2, 3), LANTERN);
    });
  });
  F.part('fanTassel', { bone: n.prop, z: z + 38.5, zb: z + 4.5, team: true }, (g) => {
    g.stroke(polyline([[X(18), Y(-46)], [X(18), Y(-40)]]), P.teamDeep, 0.6);
    g.mat(path([[X(16.6), Y(-40)], [X(19.4), Y(-40)], [X(20.4), Y(-34), 1], [X(15.6), Y(-34), 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  // vorderer Ärmel mit Saum (Teamzone)
  F.part('armF', { bone: n.armF, z: z + 40, zb: z + 6 }, (g) => {
    g.mat(path([[X(6), Y(-60)], [X(12), Y(-60)], [X(16), Y(-46)], [X(18), Y(-30)], [X(10), Y(-26), 1], [X(6), Y(-34)], [X(6), Y(-48)]]), ROBE, 'cloth', { hi: 0.35 });
  });
  F.part('sleeveHem', { bone: n.armF, z: z + 40.5, zb: z + 6.5, team: true }, (g) => {
    g.mat(path([[X(6), Y(-34)], [X(18), Y(-30)], [X(18.4), Y(-27)], [X(10), Y(-23), 1], [X(5.6), Y(-31)]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('handF', { bone: n.handF, z: z + 41, zb: z + 7 }, (g) => g.mat(circle(X(17), Y(-45), 2.4), SKIN, 'skin'));
}

export default function spiritEmpressGround(F) {
  const P = F.pal;
  const { JADE, JADE_D } = EMPRESS;
  F.rig('robe', {
    hip: [0, -38],
    skirt: [0, -38],
    torso: [0, -41],
    head: [3, -63],
    hat: [3, -80],
    armB: [-9, -60],
    handB: [-12, -40],
    armF: [9, -60],
    handF: [17, -46],
    prop: [17, -46],
    cape: [-2, -60],
  });
  F.part('shoes', { bone: 'skirt', z: 6 }, (g) => {
    for (const x of [-5, 7]) g.mat(path([[x - 3.6, -3], [x + 3.6, -3], [x + 7, -1, 1], [x + 6, 0, 1], [x - 4, 0, 1]]), '#c84a5a', 'cloth');
  });
  F.part('robe', { bone: 'skirt', z: 18, zb: 18 }, (g) => {
    const r = path([[-10, -46], [10, -46], [14, -24], [20, -3], [6, -2], [-6, -2], [-20, -3], [-14, -24]]);
    g.mat(r, JADE, 'cloth', { hi: 0.35 });
    g.clipTo(r, (h) => {
      // Wolken- und Wellensaum
      for (let x = -18; x < 20; x += 6) h.stroke(spline([[x - 3, -6], [x - 1.6, -9], [x, -7], [x + 1.6, -10], [x + 3, -7]]), '#f4d8a0', 0.8, { lod: 1 });
      lines(h, [[[-4, -44], [-10, -6]], [[4, -44], [10, -6]]], JADE_D, 0.8, 1);
    });
  });
  empressUpper(F);
  emblem(F, 'emblem', 'torso', 23, -6, -55, 2.2, { zb: 23 });
  F.anim({
    // fächelt, die Lichter kreisen
    idle: { p: { breathe: 0.02, bob: 0.5, sway: 1, tilt: 2 }, keys: { prop: { r: [[0, 0], [0.25, -14], [0.5, 0], [0.75, -14], [1, 0]] }, hat: { r: [[0, 0], [0.5, 2], [1, 0]] } } },
    // gleitender Schritt, die Ärmel schleifen
    walk: { p: { stride: 6, bob: 0.8, armSwing: 2, skirt: 3 } },
    // Fächer schließen, Fächerschlag mit Geisterwelle
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -60, strike: 20, over: 10, cock: -40, snap: 30, lean: 4, lunge: 6 }, ev: { release: 0.55 } },
    hit: { p: { knock: 1.2, recoil: 3 } },
    // löst sich in aufsteigende Laternen auf
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { y: [[0, 0], [1, -14]] }, alpha: [[0, 1], [0.4, 1], [1, 0]] } },
  });
}
