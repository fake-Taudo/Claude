// Kampfheilerin – resolute Kräuterfrau mit Mörser-Rucksack und Riesenstößel (Brief: docs/briefs/battle-healer.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { faceSet, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function battleHealer(F) {
  const P = F.pal;
  const DRESS = P.main;
  const APRON = P.acc;
  const STONE = '#9a948a';
  const HERB = '#5a9a3a';
  const WOOD = '#a8763e';
  const SKIN = '#f0bc94';
  const HAIR = '#8a4a2a';
  const DRESS_D = '#6a8f52';
  const BOOT = '#5a3e26';

  F.rig('biped', {
    hip: [0, -30],
    torso: [0, -33],
    head: [3, -62],
    hat: [3, -76],
    back: [-14, -50],
    armB: [-14, -58],
    handB: [-18, -40],
    armF: [14, -58],
    handF: [20, -41],
    prop: [20, -41],
    legB: [-6, -26],
    footB: [-7, -7],
    legF: [6, -26],
    footF: [7, -7],
    cape: [-4, -70],
  });

  // ───────── Mörser auf dem Rücken (Signature), Kräuter ragen heraus ─────────
  F.part('mortar', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    // Kräuterbüschel
    for (const [x, y, a, l] of [[-24, -66, -110, 14], [-19, -67, -80, 16], [-14, -66, -60, 12], [-21, -66, -95, 18], [-16, -66, -70, 15]]) {
      const r = (a * Math.PI) / 180;
      const ex = x + Math.cos(r) * l;
      const ey = y + Math.sin(r) * l;
      g.stroke(polyline([[x, y], [ex, ey]]), '#3e7a2a', 1);
      g.mat(ellipse(ex, ey, 3, 1.6, a), HERB, 'cloth', { hi: 0.3 });
      g.mat(ellipse(x + (ex - x) * 0.6, y + (ey - y) * 0.6, 2.4, 1.3, a + 40), '#6aaa4a', 'cloth', { lod: 1 });
    }
    g.mat(path([[-31, -68], [-8, -68], [-9, -56], [-13, -46], [-26, -46], [-30, -56]]), STONE, 'stone');
    g.mat(ellipse(-19.5, -68, 11.6, 2.8), '#7a746a', 'stone');
    g.lod(1, (h) => {
      h.stroke(spline([[-29, -60], [-19.5, -58], [-10, -60]]), '#7a746a', 0.7);
      h.fill(circle(-24, -52, 1), '#7a746a');
      h.fill(circle(-15, -55, 0.8), '#7a746a');
    });
    g.stroke(polyline([[-9, -66], [6, -58]]), '#6b4424', 1.4, { lod: 1 });
  });

  // ───────── Stiefel unter dem Kleid ─────────
  const foot = (name, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(path([[x - 5, -12], [x + 4.6, -12], [x + 5, -6], [x + 10, -3], [x + 10.2, 0, 1], [x - 6, 0, 1], [x - 6.2, -6]]), BOOT, 'leather');
      g.mat(rrect(x - 6, -12.6, 11.6, 2.6, 1), '#3e2a18', 'leather', { lod: 1 });
    });
  };
  F.part('legB', { bone: 'legB', z: 4 }, (g) => g.mat(limb(-6, -28, -7, -10, 5.4, 5), '#d8a880', 'skin'));
  F.part('legF', { bone: 'legF', z: 5 }, (g) => g.mat(limb(6, -28, 7, -10, 5.4, 5), SKIN, 'skin'));
  foot('footB', -7, 6);
  foot('footF', 7, 7);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 10, zb: 42 }, (g) => {
    g.mat(limb(-14, -58, -17, -48, 6.6, 6), DRESS_D, 'cloth');
    g.mat(limb(-17, -49, -18.4, -41, 5.2, 4.8), '#d8a880', 'skin');
  });
  F.part('handB', { bone: 'handB', z: 11, zb: 43 }, (g) => g.mat(circle(-18.6, -39.4, 3.6), '#d8a880', 'skin'));

  // ───────── Kleid mit Schürze ─────────
  F.part('dress', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const d = path([[-13, -60], [-4, -63], [8, -63], [14, -60], [16, -42], [22, -12], [12, -9], [0, -10.4], [-12, -9], [-22, -12], [-16, -42]]);
    g.mat(d, DRESS, 'cloth');
    lines(g, [[[-12, -38], [-16, -14]], [[12, -38], [16, -14]]], DRESS_D, 0.8, 1);
    // Kräuter-Stickerei am Saum
    g.lod(2, (h) => {
      for (const x of [-16, -8, 8, 16]) {
        h.stroke(polyline([[x, -12], [x, -17]]), '#3e7a2a', 0.6);
        h.fill(ellipse(x - 1.2, -15.6, 1.2, 0.6, -30), '#e8d8a0');
        h.fill(ellipse(x + 1.2, -16.4, 1.2, 0.6, 30), '#e8d8a0');
      }
    });
  });
  F.part('apron', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    const a = path([[-8, -56], [10, -56], [12, -40], [15, -16], [3, -13.6], [-10, -16], [-10, -40]]);
    g.mat(a, APRON, 'cloth');
    g.lod(1, (h) => {
      h.fill(ellipse(4, -28, 2.6, 1.6), '#8ab070', { op: 0.5 });
      h.fill(ellipse(-4, -22, 1.8, 1.2), '#8ab070', { op: 0.5 });
    });
    g.mat(rrect(-3, -36, 9, 7, 1.6), '#e8dcc0', 'cloth', { lod: 1 });
  });
  F.part('apronBand', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
    g.mat(rrect(-15, -45, 31, 4.4, 1.6), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[-14, -42], [-11, -42], [-12, -32], [-15, -33]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
  });

  // ───────── Kopf mit Kopftuch ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-7, -74], [4, -77], [14.6, -73], [16.6, -64], [14, -55.6], [6, -52.4], [-2, -54.4], [-7, -61]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[11.4, -65, 2.3], [3.6, -65, 2.1]],
    iris: '#4a6a3a',
    lidColor: SKIN,
    lid: 0.18,
    brow: { color: HAIR, w: 1.6, lift: 0.4 },
    idleTilt: 0.35,
    mouth: [9, -57.6, 4.8],
    mood: 'smile',
    attackMouth: 'shout',
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(13.6, -60, 2.8, 2), '#f08a7a', { op: 0.55 });
    g.fill(ellipse(1.6, -60, 2.2, 1.6), '#f08a7a', { op: 0.45 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(8.4, -61, 1.9, 1.7), '#e8a07e', 'skin', { line: '#b07a5c', lw: 0.5 });
  });
  F.part('hair', { bone: 'head', z: 29, zb: 33 }, (g) => {
    g.mat(path([[-8, -66], [-11, -58], [-9, -52], [-4, -54], [-5, -62]]), HAIR, 'hair');
  });
  F.part('scarf', { bone: 'head', z: 35, zb: 35, team: true }, (g) => {
    const s = path([[-10, -64], [-9, -72], [-3, -79], [6, -81], [14, -78], [18, -71], [17.6, -66], [13, -69.6], [4, -71], [-4, -69]]);
    g.mat(s, P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (const [x, y] of [[0, -74], [7, -77], [13, -73], [-5, -70]]) h.fill(circle(x, y, 1), P.symbol, { op: 0.8 });
    });
  });
  F.part('scarfKnot', { bone: 'cape', z: 34, zb: 37, team: true }, (g) => {
    g.mat(path([[-9, -68], [-16, -66], [-19, -60, 1], [-13, -62], [-10, -64]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.6 });
    g.mat(path([[-9, -67], [-14, -62], [-14, -55, 1], [-10, -60]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });

  // ───────── Riesenstößel und vorderer Arm ─────────
  F.part('pestle', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[18.4, -24], [21.6, -24], [24.6, -66], [21.4, -66]]), WOOD, 'wood');
    g.mat(path([[16.4, -66], [28.6, -66], [30, -78], [26.4, -84], [18.6, -84], [15, -78]]), STONE, 'stone');
    g.lod(1, (h) => {
      h.fill(ellipse(22.6, -80, 3.6, 1.6), '#b8b2a6', { op: 0.6 });
      h.fill(ellipse(24, -70, 2.4, 1.2), HERB, { op: 0.7 });
    });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(limb(14, -58, 18, -48, 6.6, 6), DRESS, 'cloth');
    g.mat(limb(18, -49, 20, -42, 5.2, 4.8), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(20.4, -40.6, 3.6), SKIN, 'skin'));
  F.part('herbCloud', { bone: 'prop', z: 39, state: 'muzzle', glow: true }, (g) => {
    for (const [x, y, r] of [[22, -88, 5], [30, -84, 4], [16, -84, 4], [24, -94, 3.6]]) g.fill(circle(x, y, r), '#9ae870', { op: 0.5 });
  });
  emblem(F, 'emblem', 'torso', 24, 12, -43, 2, { zb: 24 });

  F.anim({
    // zerstößt Kräuter in der Luft und schnuppert
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 1.5 }, keys: { prop: { y: [[0, 0], [0.2, -3], [0.3, 1], [0.4, -3], [0.5, 1], [0.6, 0]] }, head: { r: [[0, 0], [0.65, 0], [0.75, -6], [0.85, -6], [0.95, 0]] } } },
    walk: { p: { stride: 20, bob: 2, armSwing: 4, lean: 4 }, keys: { cape: { r: [[0, -6], [0.5, 6], [1, -6]] } } },
    // Stößel von oben wie beim Zerstoßen, Kräuterwolke
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -170, strike: -40, over: 10, cock: 140, snap: 175, lean: 10, lunge: 12 }, keys: { show: { muzzle: [[0.55, 0.8]] } } },
    hit: { p: { knock: 2, recoil: 5 }, keys: { cape: { r: [[0, 0], [0.2, 20], [1, 0]] } } },
    death: { p: { dir: -1, angle: 70 } },
  });
}
