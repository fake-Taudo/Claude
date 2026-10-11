// Kobold-Raufbold – wütender, muskulöser Kobold mit gesprengten Handschellen an den Fäusten (Brief: docs/briefs/goblin-brawler.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinBrawler(F) {
  const P = F.pal;
  const SHORTS = P.main;
  const IRON = P.acc;
  const SKIN = '#6e9c40';
  const SKIN_D = '#4e7a2a';
  const SCAR = '#a8c87a';
  const WRAP = '#e8dcc0';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -37],
    head: [9, -62],
    hat: [9, -80],
    back: [-6, -56],
    armB: [-9, -62],
    handB: [13, -52],
    armF: [15, -62],
    handF: [27, -52],
    prop: [27, -52],
    legB: [-6, -34],
    footB: [-9, -5],
    legF: [6, -34],
    footF: [9, -5],
    cape: [0, -60],
  });

  // Faust mit Wickel (Teamzone) und gesprengter Schelle samt Kettenresten
  const fist = (name, bone, x, y, r, z, zb, dark) => {
    F.part(name, { bone, z, zb }, (g) => {
      g.mat(blob([[x - r, y - r * 0.4], [x - r * 0.4, y - r], [x + r * 0.7, y - r * 0.9], [x + r * 1.05, y], [x + r * 0.6, y + r * 0.9], [x - r * 0.6, y + r * 0.8]], 0.7), dark ? SKIN_D : SKIN, 'skin', { hi: 0.4 });
      g.lod(1, (h) => lines(h, [[[x + r * 0.2, y - r * 0.8], [x + r * 0.3, y - r * 0.2]], [[x + r * 0.5, y - r * 0.6], [x + r * 0.6, y]]], SKIN_D, 0.6, 1));
    });
    F.part(name + 'Wrap', { bone, z: z + 0.2, zb: zb + 0.2, team: true }, (g) => {
      g.mat(path([[x - r * 0.95, y - r * 0.15], [x + r * 0.1, y - r * 0.4], [x + r * 0.15, y + r * 0.12], [x - r * 0.85, y + r * 0.42]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    });
    F.part(name + 'Cuff', { bone, z: z + 0.4, zb: zb + 0.4, sig: name === 'fistF' }, (g) => {
      g.mat(rrect(x - r * 1.5, y - r * 0.5, r * 0.7, r * 1.3, 1), IRON, 'metal', { hi: 0.8 });
      // offenes Scharnier und drei Kettenglieder
      g.mat(path([[x - r * 1.5, y - r * 0.5, 1], [x - r * 1.9, y - r * 1.1, 1], [x - r * 1.6, y - r * 1.2, 1], [x - r * 1.2, y - r * 0.5, 1]]), IRON, 'metal');
      for (let i = 0; i < 3; i++) g.stroke(ellipse(x - r * 1.2 - i * 0.6, y + r * 1 + i * 2.6, 1.2, 1.6, i % 2 ? 0 : 90), IRON, 0.9);
    });
  };

  // ───────── Beine: Boxerhose, nackte Koboldfüße, breiter Stand ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -32, x * 1.45, -6, 4.6, 3.8), SKIN_D, 'skin'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.5;
      g.mat(path([[fx - 4, -6], [fx + 4, -6.4], [fx + 10, -2.4], [fx + 10.6, 0, 1], [fx - 4.6, 0, 1]]), SKIN, 'skin', { hi: 0.4 });
    });
  };
  leg('legB', 'footB', -6, 6);
  leg('legF', 'footF', 6, 8);
  F.part('shorts', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    g.mat(path([[-11, -38], [12, -38], [15, -22], [3, -21], [0, -26], [-3, -21], [-14, -22]]), SHORTS, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => h.stroke(polyline([[0, -36], [0, -26]]), '#7a3a22', 0.6));
  });
  F.part('waistband', { bone: 'hip', z: 17, zb: 17, team: true }, (g) => g.mat(rrect(-11.6, -40, 24, 4, 1.4), P.team, 'cloth', { line: P.teamDeep }));

  // ───────── Hintere Deckungsfaust ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-9, -62, 11, -52, 5.6, 4.6), SKIN_D, 'skin'));
  fist('fistB', 'handB', 15, -52, 8.4, 36, 43, true);

  // ───────── Muskulöser Oberkörper mit Narben (Keil) ─────────
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-15, -63], [-4, -67], [12, -66], [20, -62], [16, -50], [10, -38], [-9, -38], [-13, -50]]);
    g.mat(t, SKIN, 'skin', { hi: 0.45 });
    g.lod(1, (h) => {
      lines(h, [[[4, -60], [6, -54], [12, -52]], [[2, -48], [6, -44]], [[2, -44], [2, -40]]], SKIN_D, 0.8, 1);
      // Narben
      lines(h, [[[-8, -60], [-2, -52]], [[10, -46], [14, -50]]], SCAR, 0.9, 1);
      h.stroke(polyline([[-6, -58], [-4, -59], [-4.6, -55], [-2.6, -56]]), SKIN_D, 0.4);
    });
  });

  // ───────── Kopf: wütend, dicke Brauen, Unterbiss mit Hauern, eingerissenes Ohr ─────────
  F.part('earB', { bone: 'head', z: 28, zb: 36 }, (g) => g.mat(path([[12, -76], [22, -82], [28, -80, 1], [18, -72], [14, -70]]), SKIN_D, 'skin'));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-1, -70], [1, -78], [10, -81], [18, -78], [21, -70], [21, -62], [16, -57], [6, -57], [0, -62]], 0.7), SKIN, 'skin', { hi: 0.4 });
  });
  F.part('earF', { bone: 'head', z: 34, zb: 29 }, (g) => {
    // eingerissenes Ohr mit Kerbe
    g.mat(path([[1, -72], [-10, -76], [-14, -74, 1], [-9, -72], [-12, -70, 1], [-6, -68], [1, -66]]), SKIN, 'skin', { hi: 0.3 });
  });
  faceSet(F, {
    eyes: [[17, -71, 2.2], [10.6, -71, 2]],
    iris: '#e83a2a',
    irisR: 0.45,
    lidColor: SKIN,
    lid: 0.35,
    look: [0.7, 0],
    brow: { color: SKIN_D, w: 2, lift: 0.1 },
    idleTilt: 1.4,
    mouth: [15, -61, 6.4],
    mood: 'frown',
    attackMouth: 'grit',
  });
  // Hauer aus dem Unterkiefer
  F.part('tusks', { bone: 'head', z: 33.5, view: 'front' }, (g) => {
    for (const x of [12.6, 17.4]) g.mat(path([[x - 1, -60], [x, -64.6, 1], [x + 1, -60]]), WHITE, 'bone');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(blob([[16, -70], [22, -68], [23, -65], [19, -64], [16, -65.6]], 0.6), SKIN_D, 'skin');
    g.fill(ellipse(21, -65.4, 0.9, 0.6), '#2a3a1a');
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => g.lod(1, (h) => lines(h, [[[2, -64], [10, -60], [18, -63]]], SKIN_D, 0.8, 1)));

  // ───────── Vordere Schlagfaust ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(15, -62, 25, -52, 5.8, 4.8), SKIN, 'skin'));
  fist('fistF', 'handF', 31, -52, 9.6, 41, 7, false);
  emblem(F, 'emblem', 'hip', 18, -6, -30, 2.2, { zb: 18 });

  F.anim({
    // schattenboxt, Ketten klirren
    idle: { p: { breathe: 0.04, bob: 1.6, sway: 4, tilt: 3 }, keys: { armF: { r: [[0, 0], [0.2, -30], [0.3, 0], [0.6, 0], [0.7, -24], [0.8, 0]] }, armB: { r: [[0, 0], [0.4, -20], [0.5, 0]] }, root: { x: [[0, 0], [0.25, 1.4], [0.5, 0], [0.75, -1.4], [1, 0]] } } },
    // tänzelnder Boxerschritt
    walk: { p: { stride: 18, bob: 3, armSwing: 6, lean: 8 }, keys: { root: { y: [[0, 0], [0.25, -3], [0.5, 0], [0.75, -3], [1, 0]] } } },
    // Haken-Kombination: links, rechts
    attack: { prog: 'atk.punch', hit: 0.4, p: { wind: 30, strike: -70, reach: 12, lunge: 14 }, keys: { armB: { r: [[0, 0], [0.45, 10], [0.65, -60], [0.8, -10], [1, 0]] }, handB: { x: [[0, 0], [0.65, 10], [0.85, 0]] } }, ev: { strike: [0.4, 0.65] } },
    // schüttelt den Kopf und grinst
    hit: { p: { knock: 2.2, recoil: 5 }, keys: { head: { r: [[0, 0], [0.15, -12], [0.3, 10], [0.45, -6], [0.6, 0]] } } },
    // bricht mit gestreckten Armen heraus
    spawn: { keys: { armF: { r: [[0, -150], [0.6, -150], [0.85, 0]] }, armB: { r: [[0, -150], [0.6, -150], [0.85, 0]] } } },
    // fällt vornüber, Ketten rasseln
    death: { p: { dir: 1, angle: 82 } },
  });
}
