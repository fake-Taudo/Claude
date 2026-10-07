// Riese – gutmütiger Bauernriese mit Bommelmütze und Arbeitshandschuhen (Brief: docs/briefs/giant.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline } from '../geo.mjs';
import { eye, eyeClosed, eyeSpiral, eyeX, brow, mouthLine, mouthOpen, rivets, stitches, lines, emblem, INK } from '../kit.mjs';

export default function giant(F) {
  const P = F.pal;
  const DENIM = P.main;
  const GLOVE = P.acc;
  const SHIRT = '#efe4cc';
  const SKIN = '#e9a97a';
  const KNIT = '#7a8a6a';
  const BOOT = '#4a5a48';
  const BRASS = '#c8a046';
  const HAIR = '#8a5a2e';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -38],
    head: [7, -104],
    hat: [9, -128],
    armB: [-30, -96],
    handB: [-35, -50],
    armF: [31, -96],
    handF: [37, -50],
    legB: [-12, -34],
    footB: [-14, -9],
    legF: [12, -34],
    footF: [14, -9],
  });

  // ───────── Beine und Stiefel ─────────
  const leg = (x, z, name, footName) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -36, x * 1.12, -10, 11, 9.5), DENIM, 'cloth');
      g.lod(1, (h) => h.stroke(polyline([[x * 1.05 + 3, -32], [x * 1.12 + 3, -12]]), '#6b4626', 0.8));
    });
    F.part(footName, { bone: footName, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(path([[fx - 11, -16], [fx + 8, -16], [fx + 11, -8], [fx + 18, -5], [fx + 18.5, 0, 1], [fx - 12, 0, 1], [fx - 12.5, -8]]), BOOT, 'leather', { hi: 0.4 });
      g.mat(rrect(fx - 12.5, -18.5, 21, 5, 2.4), '#3c4a3a', 'leather', { lod: 1 });
      g.mat(rrect(fx - 12.5, -2.6, 31, 2.8, 1.2), '#2f3a2e', 'leather', { lod: 1 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');
  F.part('kneePatch', { bone: 'legF', z: 12.5, team: true, lod: 1 }, (g) => {
    g.mat(rrect(10, -27, 10, 9, 2).rot(-6, 15, -22), P.team, 'cloth', { line: P.teamDeep, lw: 0.9 });
    stitches(g, [[10.6, -26.6], [19.6, -27.4], [19.4, -18.4], [10.6, -17.8], [10.6, -26.6]], P.symbol, { step: 2.4, len: 1.2, cross: true, lod: 1 });
  });

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    g.mat(limb(-30, -98, -33, -72, 11, 10), SHIRT, 'cloth');
    g.mat(rrect(-43, -76, 20, 8, 3.6).rot(4, -33, -72), '#e2d4b6', 'cloth', { lod: 1 });
    g.mat(limb(-33, -72, -35, -52, 9, 8.5), SKIN, 'skin');
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => {
    g.mat(path([[-49, -50], [-35, -55], [-23, -50], [-21, -36], [-28, -26], [-42, -26], [-50, -34]]), GLOVE, 'leather');
    g.mat(rrect(-47, -57, 24, 8, 3.6), '#c9a344', 'leather', { lod: 1 });
    lines(g, [[[-42, -33], [-39, -27]], [[-35.5, -34], [-34, -27]], [[-29, -33], [-29, -27]]], '#a8862e', 0.8, 1);
  });

  // ───────── Rumpf ─────────
  F.part('shirt', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    g.mat(path([[-34, -102], [-12, -110], [14, -110], [36, -101], [40, -80], [33, -48], [-31, -48], [-38, -80]]), SHIRT, 'cloth');
    lines(g, [[[-20, -96], [-16, -84]], [[22, -97], [19, -86]]], '#cdbd9a', 0.7, 1);
  });
  F.part('belly', { bone: 'torso', z: 19, zb: 29 }, (g) => {
    const bib = path([[-24, -88], [26, -88], [30, -60], [33, -40], [26, -30, 1], [-25, -30, 1], [-32, -40], [-28, -60]]);
    g.mat(bib, DENIM, 'cloth');
    stitches(g, [[-22, -85.5], [24, -85.5]], '#e8c35a', { step: 2.6, len: 1.3 });
    lines(g, [[[-14, -50], [-6, -46]], [[12, -48], [20, -44]]], '#6b4626', 0.8, 1);
  });
  // Brusttasche (nur von vorn)
  F.part('pocket', { bone: 'torso', z: 19.5, view: 'front', lod: 1 }, (g) => {
    g.mat(rrect(-4, -82, 16, 13, 2.4), '#8d6134', 'cloth');
    stitches(g, [[-3, -71], [-3, -81], [11, -81], [11, -71]], '#e8c35a', { step: 2.2, len: 1.1 });
  });
  F.part('straps', { bone: 'torso', z: 20, zb: 30 }, (g) => {
    g.mat(path([[-23, -88], [-17, -88], [-12, -109], [-18, -109]]), DENIM, 'cloth');
    g.mat(path([[19, -88], [25, -88], [21, -110], [15, -110]]), DENIM, 'cloth');
    g.mat(circle(-20, -86, 3.2), BRASS, 'gold');
    g.mat(circle(22, -86, 3.2), BRASS, 'gold');
  });
  F.part('backPatch', { bone: 'hip', z: 21, zb: 31, view: 'back', team: true }, (g) => {
    g.mat(rrect(-12, -50, 18, 14, 3), P.team, 'cloth', { line: P.teamDeep });
    stitches(g, [[-11, -49], [5, -49], [5, -37], [-11, -37], [-11, -49]], P.symbol, { step: 2.6, len: 1.3, cross: true, lod: 1 });
  });
  F.part('backStraps', { bone: 'torso', z: 22, zb: 32, view: 'back' }, (g) => {
    g.mat(path([[-18, -110], [-12, -110], [20, -86], [14, -86]]), DENIM, 'cloth');
    g.mat(path([[15, -110], [21, -110], [-13, -86], [-19, -86]]), DENIM, 'cloth');
  });

  // ───────── Kopf mit Bommelmütze ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(path([[-8, -118], [6, -124], [20, -119], [23, -108], [20, -98], [10, -94], [-2, -96], [-9, -104]]), SKIN, 'skin');
    g.mat(ellipse(-8.5, -110, 3.4, 4.6), SKIN, 'skin');
    g.fill(ellipse(-8.2, -110, 1.5, 2.5), '#c98a62', { lod: 1 });
  });
  F.part('stubble', { bone: 'head', z: 31, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[4, -98.5], [7, -97.4], [10, -97.6], [13, -98.6], [16, -100.4], [18.6, -102.4], [2, -100.6], [12, -96.6]]) g.fill(circle(x, y, 0.5), '#9a6a4a');
  });
  const EYE = { r: 2.3, ratio: 1.15, iris: '#4a3626', lidColor: SKIN, look: [0.5, 0.1] };
  F.part('face.idle', { bone: 'head', z: 32, view: 'front', expr: 'idle' }, (g) => {
    eye(g, 15.5, -110.5, { ...EYE, lid: 0.42 });
    eye(g, 6.5, -110.5, { ...EYE, r: 2.1, lid: 0.42 });
    brow(g, [[12.5, -115.2], [15.5, -116.4], [18.8, -115.6]], 1.2, HAIR);
    brow(g, [[3.8, -115.4], [6.5, -116.2], [9.2, -115.2]], 1.1, HAIR);
    mouthLine(g, 12.5, -100.6, 6, 1.2, { lw: 1 });
    g.stroke(polyline([[15, -100.8], [24, -103.5]]), '#e3c35a', 0.9);
    g.stroke(polyline([[24, -103.5], [27, -105.6]]), '#c9a43c', 0.7, { lod: 1 });
  });
  F.part('face.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, 15.5, -110.5, { ...EYE, lid: 0.3 });
    eye(g, 6.5, -110.5, { ...EYE, r: 2.1, lid: 0.3 });
    brow(g, [[12.2, -113.8], [15.5, -115.6], [19, -116.8]], 1.4, HAIR);
    brow(g, [[3.6, -116.6], [6.5, -115.6], [9.6, -113.8]], 1.3, HAIR);
    g.mat(ellipse(12.5, -100.8, 4.2, 2.4), '#e7a07a', 'skin', { line: '#a8684a', lw: 0.7 });
    mouthLine(g, 12.5, -100.8, 3.4, 0, { lw: 0.9 });
  });
  F.part('face.hurt', { bone: 'head', z: 32, view: 'front', expr: 'hurt' }, (g) => {
    // brummt und kneift ein Auge zu
    eyeClosed(g, 15.5, -110.5, 2.3, { up: true, lw: 1.1 });
    eye(g, 6.5, -110.5, { ...EYE, r: 2.1, lid: 0.55, look: [0.2, 0.3] });
    brow(g, [[12.5, -115.8], [15.5, -114.6], [18.8, -115.4]], 1.2, HAIR);
    mouthOpen(g, 12.5, -100.8, 5, 2.4, { teeth: 'top' });
  });
  F.part('face.stun', { bone: 'head', z: 32, view: 'front', expr: 'stun' }, (g) => {
    eyeSpiral(g, 15.5, -110.5, 2.4);
    eyeSpiral(g, 6.5, -110.5, 2.2);
    mouthLine(g, 12.5, -100.6, 5, 0.8);
  });
  F.part('face.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 15.5, -110.5, 1.9);
    eyeX(g, 6.5, -110.5, 1.8);
    mouthLine(g, 12.5, -100.6, 5, -1.2);
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(12.4, -105.2, 3.6, 3.1), '#e39a70', 'skin', { line: '#a8684a', lw: 0.8 });
    g.fill(ellipse(16.6, -104, 2.4, 1.5), '#f08a7a', { op: 0.45, lod: 1 });
    g.fill(ellipse(4.2, -104, 2, 1.3), '#f08a7a', { op: 0.35, lod: 1 });
  });
  F.part('beanie', { bone: 'head', z: 35, zb: 38, sig: true }, (g) => {
    const cap = path([[-10, -114, 1], [-9, -124], [-2, -133], [9, -136], [19, -132], [24, -123], [24, -114, 1]]);
    g.mat(cap, KNIT, 'cloth');
    g.clipTo(cap, (h) => {
      for (let x = -10; x < 26; x += 4.2) h.stroke(spline([[x, -116], [x + 1.6, -126], [x + 0.4, -138]]), '#66765a', 0.7, { lod: 1 });
    });
    const cuff = path([[-11, -119], [7, -121.4], [25, -118.6], [25, -112.2], [7, -114.6], [-11, -112.4]]);
    g.mat(cuff, '#6c7c5e', 'cloth');
    g.clipTo(cuff, (h) => {
      for (let x = -11; x < 26; x += 2.4) h.stroke(polyline([[x, -122], [x, -111]]), '#56664a', 0.55, { lod: 1 });
    });
  });
  F.part('bobble', { bone: 'hat', z: 36, zb: 39, team: true }, (g) => {
    g.mat(circle(8, -143, 13), P.team, 'fur', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        h.stroke(polyline([[8 + Math.cos(a) * 8.6, -143 + Math.sin(a) * 8.6], [8 + Math.cos(a) * 13.8, -143 + Math.sin(a) * 13.8]]), P.teamShade, 1);
      }
      h.fill(ellipse(3.6, -148, 4.2, 3), P.teamLight, { op: 0.7 });
    });
  });
  F.part('headBack', { bone: 'head', z: 34, zb: 37, view: 'back' }, (g) => {
    g.mat(path([[-9, -114], [24, -114], [22, -102], [8, -96], [-6, -100]]), SKIN, 'skin');
    g.fill(path([[-8, -113], [23, -113], [21, -109], [-6, -109]]), HAIR, { lod: 1 });
  });

  // ───────── Vorderer Arm ─────────
  F.part('armF', { bone: 'armF', z: 40, zb: 10 }, (g) => {
    g.mat(limb(31, -98, 34, -72, 11, 10), SHIRT, 'cloth');
    g.mat(rrect(24, -76, 20, 8, 3.6).rot(-4, 34, -72), '#e2d4b6', 'cloth', { lod: 1 });
    g.mat(limb(34, -72, 37, -52, 9, 8.5), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => {
    g.mat(path([[23, -50], [37, -55], [51, -50], [53, -36], [46, -25], [31, -25], [24, -33]]), GLOVE, 'leather');
    g.mat(rrect(25, -57, 24, 8, 3.6), '#c9a344', 'leather', { lod: 1 });
    lines(g, [[[31, -33], [32, -26]], [[38, -34], [39, -26]], [[45, -33], [45.5, -27]]], '#a8862e', 0.8, 1);
    g.mat(path([[23, -45], [19, -40], [21, -33], [26, -35]]), GLOVE, 'leather', { lod: 0 });
  });
  emblem(F, 'emblem', 'torso', 23, 18.5, -78, 2.6, { view: 'front' });
  emblem(F, 'emblemBack', 'hip', 23, -3, -43, 3.2, { zb: 33, view: 'back' });

  F.anim({
    idle: { p: { breathe: 0.035, bob: 1.2, armF: -4, armB: 4, sway: 2.5, hat: 6 } },
    walk: { p: { stride: 15, bob: 4, squash: 0.05, armSwing: 10, lean: 3, hatBob: 6 }, ev: { step: [0.25, 0.75] } },
    charge: { prog: 'biped.walk', p: { stride: 20, bob: 5, lean: 8, armSwing: 14 } },
    // Fäuste über dem Kopf gefaltet (A-Form), dann Hammerschlag nach vorn unten
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -212, windB: -146, strike: -38, strikeB: -30, over: 10, lean: 12, lunge: 16 }, keys: { handF: { r: [[0, 0], [0.48, -30], [0.6, 8], [1, 0]] }, handB: { r: [[0, 0], [0.48, 30], [0.6, 4], [1, 0]] }, hat: { r: [[0, 0], [0.48, -14], [0.62, 18], [0.8, -6], [1, 0]] } } },
    hit: { p: { knock: 2, recoil: 5, jolt: 8 } },
    // setzt sich, kippt nach hinten, der Bommel rollt davon
    death: { p: { dir: -1, angle: 80 }, keys: { hat: { r: [[0, 0], [0.45, 0], [1, -160, 'out']], x: [[0, 0], [0.45, 0], [1, -22, 'out']] } } },
  });
}
