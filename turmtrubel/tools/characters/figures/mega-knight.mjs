// Megaritter – wuchtiger Koloss in Plattenrüstung mit einem Helm in Form einer Kirchenglocke und gusseisernen Kugelfäusten
// (Brief: docs/briefs/mega-knight.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { lines, rivets, chainmail, emblem, INK, WHITE } from '../kit.mjs';

export default function megaKnight(F) {
  const P = F.pal;
  const PLATE = P.main;
  const BRONZE = P.acc;
  const IRON = '#3a3d44';
  const CHAIN = '#7a828e';
  const PLATE_D = '#3e4652';
  const PLATE_L = '#8a94a4';
  const GLOW = '#ffb03a';

  F.rig('biped', {
    hip: [0, -30],
    torso: [0, -34],
    head: [4, -96],
    hat: [4, -124],
    back: [-18, -84],
    armB: [-34, -88],
    handB: [-40, -44],
    armF: [36, -88],
    handF: [44, -44],
    prop: [44, -44],
    legB: [-13, -30],
    footB: [-15, -8],
    legF: [13, -30],
    footF: [15, -8],
    cape: [-6, -96],
  });

  // ───────── Schulterumhang (Teamzone) ─────────
  F.part('cape', { bone: 'cape', z: 3, zb: 44, team: true }, (g) => {
    g.mat(path([[-30, -96], [16, -98], [10, -70], [-6, -40], [-30, -36], [-40, -60]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-24, -90], [-32, -44]], [[-10, -92], [-16, -44]]], P.teamShade, 0.8, 1));
  });
  // ───────── Säulenbeine in Plattenstiefeln, Kettenrock ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -32, x * 1.1, -12, 12, 11), PLATE, 'metal', { hi: 0.6 });
      g.mat(ellipse(x * 1.05, -20, 9, 5), PLATE_L, 'metal', { hi: 0.8 });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 13, -14], [fx + 9, -14], [fx + 20, -6], [fx + 21, 0, 1], [fx - 14, 0, 1]]), PLATE_D, 'metal', { hi: 0.6 });
      g.lod(1, (h) => rivets(h, [[fx - 8, -10], [fx, -10], [fx + 8, -8]], 0.9, '#a8b0ba'));
    });
  };
  leg(-13, 8, 'legB', 'footB');
  leg(13, 12, 'legF', 'footF');
  F.part('chainSkirt', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    const c = path([[-30, -40], [32, -40], [36, -18], [-34, -18]]);
    g.mat(c, CHAIN, 'metal', { hi: 0.5 });
    g.lod(1, (h) => chainmail(h, c, [-36, -42, 38, -16], 2.2, '#5a626e'));
  });

  // ───────── Kugelfaust (gusseisern, Fingerrillen, Bronzering) ─────────
  const fist = (g, x, y, r) => {
    g.mat(circle(x, y, r), IRON, 'metal', { hi: 0.7 });
    g.lod(1, (h) => lines(h, [[[x - r * 0.4, y - r * 0.9], [x - r * 0.2, y + r * 0.2]], [[x + r * 0.1, y - r * 0.95], [x + r * 0.25, y + r * 0.2]], [[x + r * 0.55, y - r * 0.8], [x + r * 0.6, y + r * 0.1]]], '#22242a', 1, 1));
    g.mat(rrect(x - r * 0.9, y - r - 4, r * 1.8, 6, 2.4), BRONZE, 'gold', { hi: 0.8 });
  };
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    g.mat(limb(-34, -90, -42, -56, 12, 10), PLATE_D, 'metal', { hi: 0.5 });
  });
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => fist(g, -47, -36, 21));

  // ───────── Fassbrust mit Doppelschnallen ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const b = blob([[-36, -90], [0, -100], [38, -90], [44, -64], [36, -36], [-34, -36], [-42, -64]], 0.7);
    g.mat(b, PLATE, 'metal', { hi: 0.7 });
    g.clipTo(b, (h) => {
      for (const y of [-82, -58]) h.fill(rrect(-46, y, 92, 5, 0), PLATE_D);
      h.lod(1, (k) => rivets(k, [[-30, -80], [-10, -80], [10, -80], [30, -80], [-30, -56], [-10, -56], [10, -56], [30, -56]], 1, PLATE_L));
      // Delle
      h.fill(ellipse(16, -70, 5, 3), PLATE_D, { op: 0.6, lod: 1 });
    });
    g.mat(path([[-24, -98], [-16, -98], [24, -38], [16, -38]]), '#4a3a2a', 'leather');
    for (const [x, y] of [[-4, -70], [8, -52]]) g.mat(rrect(x - 4, y - 3, 8, 6, 1.4), BRONZE, 'gold');
  });

  // ───────── Glockenhelm (Signature) mit Sehschlitz, Klöppel und Helmband (Teamzone) ─────────
  const bell = path([[-22, -98, 1], [-18, -104], [-14, -124], [-6, -136], [4, -139], [14, -136], [22, -124], [26, -104], [30, -98, 1]]);
  F.part('bell', { bone: 'head', z: 30, zb: 34, sig: true }, (g) => {
    g.mat(bell, BRONZE, 'gold', { hi: 0.9 });
    g.clipTo(bell, (h) => {
      h.fill(rrect(-24, -104, 56, 4, 0), '#8a5a28');
      // Glockeninschrift
      h.lod(2, (k) => {
        for (let x = -12; x < 22; x += 4) k.stroke(polyline([[x, -124], [x + 1.4, -127], [x + 2.8, -124]]), '#8a5a28', 0.6);
      });
    });
    g.mat(rrect(-1, -144, 10, 6, 2), '#8a5a28', 'gold');
    g.stroke(circle(4, -147, 3), '#8a5a28', 1.4);
  });
  F.part('slit', { bone: 'head', z: 31, view: 'front' }, (g) => g.fill(rrect(2, -120, 24, 6, 3), '#120e0a'));
  F.part('eyes.idle', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'sleep'], glow: true }, (g) => {
    for (const x of [10, 20]) g.stroke(spline([[x - 2.6, -116.6], [x, -118.4], [x + 2.6, -116.6]]), GLOW, 1.4);
  });
  F.part('eyes.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    for (const x of [10, 20]) g.fill(rrect(x - 3, -118, 6, 1.6, 0.6), GLOW);
  });
  F.part('eyes.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'], glow: true }, (g) => {
    for (const x of [10, 20]) g.stroke(circle(x, -117, 2), GLOW, 1.2);
  });
  F.part('eyes.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    for (const x of [10, 20]) g.stroke(polyline([[x - 2, -117], [x + 2, -117]]), '#5a3a20', 1.2);
  });
  F.part('clapper', { bone: 'head', z: 29.5, zb: 33 }, (g) => {
    g.stroke(polyline([[4, -100], [4, -94]]), IRON, 1.6);
    g.mat(circle(4, -92, 3.6), IRON, 'metal');
  });
  F.part('helmBand', { bone: 'head', z: 30.5, zb: 34.5, team: true }, (g) => {
    g.mat(path([[-17, -112], [25, -112], [26, -103], [-19, -103]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
    // Helmbusch-Bänder hinten am Glockenrand
    g.mat(path([[-17, -110], [-30, -104], [-34, -94], [-26, -97], [-22, -90], [-18, -104]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('evoBell', { bone: 'hat', z: 33, zb: 35, evo: 'evo' }, (g) => {
    g.mat(path([[-26, -128, 1], [-24, -136], [-18, -142], [-12, -136], [-10, -128, 1]]), BRONZE, 'gold', { hi: 0.9 });
    g.stroke(circle(-18, -144, 2), '#8a5a28', 1);
  });
  F.part('rings', { bone: 'head', z: 46, state: ['ring', 'spawn'], glow: true }, (g) => {
    for (const r of [34, 44]) g.stroke(ellipse(4, -118, r, r * 0.7), '#fff4c8', 1.4, { op: 0.6 });
  });

  // ───────── Schulterplatten, vorderer Arm, Kugelfaust bzw. Evo-Fausthammer ─────────
  F.part('pauldronB', { bone: 'armB', z: 19, zb: 43 }, (g) => {
    for (const [x, y, tx, ty] of [[-46, -98, -56, -108], [-35, -104, -36, -118]]) g.mat(poly([[x - 4, y + 1], [tx, ty], [x + 4, y + 2]], 0.6), PLATE_D, 'metal', { hi: 0.7 });
    g.mat(blob([[-52, -92], [-40, -104], [-22, -100], [-20, -86], [-36, -80], [-52, -82]], 0.6), PLATE_L, 'metal', { hi: 0.8 });
  });
  F.part('armF', { bone: 'armF', z: 36, zb: 10 }, (g) => g.mat(limb(36, -90, 47, -56, 12, 10), PLATE, 'metal', { hi: 0.6 }));
  F.part('pauldronF', { bone: 'armF', z: 36.5, zb: 10.5 }, (g) => {
    // drei Dornen auf der Schulterplatte
    for (const [x, y, tx, ty] of [[30, -104, 27, -117], [41, -105, 44, -120], [51, -99, 60, -110]]) g.mat(poly([[x - 4, y + 2], [tx, ty], [x + 4, y + 1]], 0.6), PLATE_D, 'metal', { hi: 0.7 });
    g.mat(blob([[20, -96], [34, -106], [52, -100], [56, -86], [42, -78], [24, -84]], 0.6), PLATE_L, 'metal', { hi: 0.8 });
    g.lod(1, (h) => rivets(h, [[30, -96], [40, -98], [48, -92]], 1, '#c8ccd4'));
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => fist(g, 53, -36, 22));
  F.part('evoHammer', { bone: 'handF', z: 41.5, zb: 11.5, evo: 'evo' }, (g) => {
    g.mat(rrect(30, -58, 34, 30, 6), BRONZE, 'gold', { hi: 0.9 });
    g.mat(rrect(28, -50, 38, 6, 2), '#8a5a28', 'gold');
    g.fill(rrect(36, -30, 22, 4, 2), '#ff8a3a', { op: 0.9 });
  });
  emblem(F, 'emblem', 'torso', 23, -20, -68, 3.2, { view: 'front' });

  F.anim({
    // Ruhepose: Arme abgespreizt, die Kugelfäuste hängen weit neben dem Körper (breiter Glocken-Umriss)
    rest: { armF: { r: -12 }, armB: { r: 12 } },
    // lässt die Kugelfäuste aneinanderklacken; die Glocke summt beim Atmen
    idle: { p: { breathe: 0.03, bob: 1.2, sway: 1, tilt: 1 }, keys: { armF: { r: [[0, 0], [0.4, 0], [0.5, 22], [0.6, 0]] }, armB: { r: [[0, 0], [0.4, 0], [0.5, -16], [0.6, 0]] } } },
    // stampfender Gang, der Boden bebt
    walk: { p: { stride: 14, bob: 5, squash: 0.06, armSwing: 10, lean: 3 }, ev: { step: [0.25, 0.75] } },
    // Sprung: Knie tief, Sprung mit Stretch, Landung mit Glockenläuten
    charge: { prog: 'still', keys: { root: { sy: [[0, 0.8], [0.3, 1.2], [0.7, 1.1], [1, 0.8]], sx: [[0, 1.12], [0.3, 0.9], [1, 1.12]] }, armF: { r: [[0, 20], [0.3, -150], [0.75, -40], [1, 20]] }, armB: { r: [[0, 20], [0.3, -150], [0.75, -40], [1, 20]] }, show: { ring: [[0.9, 1]] } } },
    // beide Fäuste hoch, Doppelhammer nach unten
    attack: { prog: 'atk.slam', hit: 0.6, p: { wind: -170, windB: -160, strike: -40, strikeB: -30, over: 10, lean: 12, lunge: 14 }, ev: { strike: 0.6 } },
    // Glocke dröhnt kurz, Körper schwankt
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { show: { ring: [[0, 0.4]] }, head: { r: [[0, 0], [0.15, -5], [0.3, 4], [0.5, 0]] } } },
    // Landung: Glocke läutet, Klangring breitet sich aus
    spawn: { prog: 'still', keys: { root: { y: [[0, -60], [0.5, 0, 'in']], sy: [[0, 1.2], [0.5, 1], [0.6, 0.8], [0.8, 1]] } }, ev: { land: 0.5 } },
    // kippt vornüber, die Glocke rollt davon
    death: { p: { dir: 1, angle: 82 }, keys: { head: { x: [[0, 0], [0.4, 0], [1, 30]], r: [[0, 0], [0.4, 0], [1, 160]] } } },
  });
}
