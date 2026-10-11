// Banditin – verschlagene Fuchs-Diebin mit Fuchsohr-Kapuze, buschigem Schwanzschal und lederumwickeltem Knüppel
// (Brief: docs/briefs/bandit.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function bandit(F) {
  const P = F.pal;
  const FOX = P.main;
  const DARK = P.acc;
  const TIP = '#f6efe2';
  const SKIN = '#f0c4a0';
  const CLUB = '#7a4a2a';
  const FOX_D = '#a8501e';
  const PANTS = '#5a5468';
  const BOOT = '#7a5a3e';
  const MASK = '#2a2433';

  F.rig(
    'biped',
    {
      hip: [0, -26],
      torso: [0, -28],
      head: [12, -48],
      hat: [14, -66],
      back: [-4, -40],
      armB: [3, -44],
      handB: [-1, -30],
      armF: [9, -44],
      handF: [17, -30],
      prop: [17, -30],
      legB: [-4, -26],
      footB: [-6, -4],
      legF: [4, -26],
      footF: [8, -4],
      cape: [6, -46],
      earB: [7, -65],
      earF: [17, -66],
    },
    { earB: 'head', earF: 'head' },
  );

  // Sprint (DASH): die Laufzeit zeichnet drei Nachbilder hinter die Figur
  F.meta.afterimages = { n: 3, states: ['charge'] };
  F.part('speedLines', { bone: 'root', z: 1, zb: 1, state: 'charge', lod: 1, outline: false }, (g) => {
    for (const [y, x0, x1] of [[-60, -44, -18], [-36, -52, -24], [-16, -40, -14]]) g.stroke(polyline([[x0, y], [x1, y]]), WHITE, 0.8, { op: 0.6 });
  });

  // ───────── Fuchsschwanz-Schal (Signature) weht hinter ihr ─────────
  F.part('tailScarf', { bone: 'cape', z: 4, zb: 44, sig: true }, (g) => {
    const t = blob([[4, -50], [-8, -51], [-22, -48], [-32, -40], [-36, -29], [-31, -22], [-24, -27], [-17, -35], [-6, -42], [4, -44]], 0.75);
    g.mat(t, FOX, 'fur', { hi: 0.45 });
    g.clipTo(t, (h) => {
      h.mat(ellipse(-33, -28, 7.4, 8.4, 20), TIP, 'fur');
      h.lod(1, (k) => lines(k, [[[-6, -47], [-14, -45]], [[-16, -44], [-24, -40]], [[-24, -38], [-29, -32]], [[-10, -43], [-18, -40]]], FOX_D, 0.6, 1));
    });
  });

  // ───────── Wickelhose, weiche Stiefel, geduckte Knie ─────────
  const leg = (name, foot, x, kx, fx, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -26, kx, -15, 3.6, 3), PANTS, 'cloth', { hi: 0.3 });
      g.mat(limb(kx, -15, fx, -6, 3, 2.6), PANTS, 'cloth');
      g.lod(1, (h) => lines(h, [[[kx - 3, -12], [kx + 1.6, -13.6]], [[kx - 3.4, -9], [kx + 0.6, -10.6]]], '#3c3848', 0.6, 1));
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[fx - 3.6, -8], [fx + 2.6, -8.4], [fx + 3.4, -3.4], [fx + 8, -1.6], [fx + 8.2, 0, 1], [fx - 4, 0, 1]]), BOOT, 'leather', { hi: 0.4 });
      g.mat(rrect(fx - 4, -8.6, 7, 2, 0.8), '#9a7a58', 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -4, 1, -6, 6);
  leg('legF', 'footF', 4, 10, 8, 8);

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(3, -44, 1, -37, 2.8, 2.5), DARK, 'cloth');
    g.mat(limb(1, -37, -1, -31, 2.2, 2), '#d8a888', 'skin');
  });
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-1, -30, 2.4), '#5a4030', 'leather'));

  // ───────── Kurze Jacke mit Flicken, Gürtel mit Dietrich-Bund (Teamzone) ─────────
  F.part('jacket', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const j = path([[-7, -26], [-8.6, -35], [-3, -45], [8, -49], [15, -45], [14, -34], [10, -26]]);
    g.mat(j, DARK, 'cloth', { hi: 0.35 });
    g.clipTo(j, (h) => {
      h.mat(rrect(-6, -37, 6, 5, 0.6), '#5a5468', 'cloth');
      h.lod(1, (k) => stitches(k, [[-6, -37], [0, -37], [0, -32], [-6, -32], [-6, -37]], '#c8b8a0', { step: 1.8, len: 0.9 }));
      // Fellkragen
      h.mat(path([[-4, -44], [4, -50], [15, -46], [13, -42], [4, -44]]), FOX_D, 'fur');
    });
  });
  F.part('belt', { bone: 'hip', z: 21, zb: 21, team: true }, (g) => {
    g.mat(path([[-8.4, -30.6], [10.6, -29.4], [10.4, -26.2], [-8.2, -27.2]]), P.team, 'leather', { line: P.teamDeep, lw: 0.4 });
    g.mat(rrect(2.4, -30.6, 3.4, 3.6, 0.6), '#c8a046', 'gold', { lod: 1 });
  });
  F.part('lockpicks', { bone: 'hip', z: 21.5, zb: 21.5 }, (g) => {
    g.stroke(circle(-5, -25, 1.8), '#9aa0a8', 0.6);
    for (const [x1, y1] of [[-7, -19], [-5, -18.4], [-3, -19.4]]) g.stroke(polyline([[-5, -23.4], [x1, y1]]), '#c8ccd2', 0.5, { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 25, 4, -38, 1.8, { zb: 25 });

  // ───────── Kopf mit Fuchsohr-Kapuze, Augenmaske, listigem Grinsen ─────────
  F.part('hood', { bone: 'head', z: 28, zb: 34 }, (g) => {
    g.mat(blob([[2, -50], [0, -60], [5, -68], [15, -70], [24, -65], [27, -56], [24, -48], [12, -46]], 0.7), FOX, 'fur', { hi: 0.4 });
  });
  F.part('face', { bone: 'head', z: 30, view: 'front' }, (g) => {
    g.mat(blob([[9, -55], [12, -63], [21, -64], [26, -58], [25.6, -51], [20, -48], [12, -49]], 0.75), SKIN, 'skin', { hi: 0.3 });
  });
  F.part('mask', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.mat(path([[9.4, -61.4], [26.6, -62], [26.8, -56.6], [17, -55.6], [16.4, -57], [15.6, -55.6], [9.4, -56.4]]), MASK, 'cloth', { hi: 0.3 });
  });
  faceSet(F, {
    z: 32,
    eyes: [[20.6, -58.8, 2], [13.4, -58.8, 1.8]],
    iris: '#e8a030',
    lidColor: MASK,
    lid: 0.45,
    ratio: 0.9,
    look: [0.7, 0],
    brow: false,
    mouth: [20.4, -52, 4.4],
    mood: 'smirk',
    attackMouth: 'grin',
  });
  F.part('fang', { bone: 'head', z: 33, view: 'front', expr: ['idle', 'attack', 'ability'] }, (g) => g.fill(poly([[21.6, -52.6], [22.8, -52.8], [22.2, -50.8]], 0.1), WHITE, { stroke: INK, lw: 0.3 }));
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(25.4, -55.2, 1.3, 1.1), '#e8a888', 'skin', { line: '#b07a5a', lw: 0.4 }));
  F.part('hoodRim', { bone: 'head', z: 34, zb: 34.5 }, (g) => {
    g.mat(path([[7, -51], [8, -61], [14, -66], [22, -66], [27.6, -61], [25.4, -62.8], [20, -63.6], [13, -62.6], [10, -58], [9.6, -51]]), FOX, 'fur', { hi: 0.5 });
    g.lod(1, (h) => lines(h, [[[12, -64], [14, -66]], [[18, -65.4], [19, -67.4]]], FOX_D, 0.6, 1));
  });
  F.part('hoodBack', { bone: 'head', z: 34.5, view: 'back' }, (g) => g.mat(blob([[4, -50], [2, -62], [12, -69], [24, -64], [26, -52], [16, -46]], 0.7), FOX, 'fur'));
  const ear = (name, x, col, z) =>
    F.part(name, { bone: name, z, zb: z }, (g) => {
      g.mat(path([[x - 5, -64], [x + 0.6, -79, 1], [x + 5, -64.6]]), col, 'fur', { hi: 0.5 });
      g.mat(path([[x - 2.2, -65.8], [x + 0.4, -73], [x + 2.2, -66]]), TIP, 'fur');
      g.fill(path([[x - 1.8, -74.6], [x + 0.6, -79, 1], [x + 2.6, -74.8]]), '#3a2a28');
    });
  ear('earB', 7, FOX_D, 27);
  ear('earF', 17, FOX, 34.8);

  // ───────── Schalknoten (Teamzone) unter dem Kinn ─────────
  F.part('scarfKnot', { bone: 'torso', z: 35, zb: 35, team: true }, (g) => {
    g.mat(path([[6, -49], [18, -48], [18.6, -45], [6, -46]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(blob([[15, -48], [19, -48], [19.6, -45], [16, -44.6]], 0.6), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(path([[16.4, -45], [19.6, -40], [17.6, -39.6], [15.6, -44]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Knüppel (lederumwickelt, Eisenkappe) und vorderer Arm mit zerrissenem Ärmel ─────────
  F.part('club', { bone: 'prop', z: 27, zb: 4 }, (g) => {
    const c = limb(16.6, -28, 22, -44, 1.5, 2.6);
    g.mat(c, CLUB, 'wood', { hi: 0.5 });
    g.clipTo(c, (h) => {
      for (const t of [0.1, 0.2, 0.3, 0.4]) h.fill(rrect(10, -28 - 16 * t - 0.6, 20, 1.2, 0).rot(-18, 19, -28 - 16 * t), '#4a2c18', { lod: 1 });
    });
    g.mat(ellipse(22.2, -44.4, 3.2, 2.6, -18), '#6a6f7a', 'metal', { hi: 0.8 });
    g.lod(1, (h) => {
      for (const [x, y] of [[20.4, -45], [23.4, -46], [23.8, -43]]) h.fill(circle(x, y, 0.55), '#c8ccd2');
    });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(path([[6.4, -45], [11.4, -45], [14, -38.6], [12.6, -37], [13, -35.4], [11, -36], [9.6, -34.6], [8.6, -36.4], [6, -41]]), DARK, 'cloth', { hi: 0.3 });
    g.mat(limb(11.6, -36, 16.6, -30.6, 2.1, 1.9), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(17, -30, 2.6), '#5a4030', 'leather', { hi: 0.4 }));

  // ───────── Rauchwolke und liegen gebliebener Schal beim Tod ─────────
  F.part('poof', { bone: 'root', z: 50, zb: 50, state: 'poof' }, (g) => {
    for (const [x, y, r] of [[-6, -18, 9], [8, -24, 10], [0, -36, 9], [-10, -32, 7], [12, -10, 7]]) g.fill(circle(x, y, r), '#c8c0cc', { op: 0.75 });
  });
  F.part('scarfDrop', { bone: 'root', z: 2, zb: 2, state: 'dropped' }, (g) => {
    const t = blob([[-16, -1], [-6, -5], [8, -4.6], [18, -2], [10, 1.2], [-6, 1], [-16, 1.4]], 0.7);
    g.mat(t, FOX, 'fur', { hi: 0.4 });
    g.clipTo(t, (h) => h.mat(ellipse(-15, -1, 4.6, 3.6), TIP, 'fur'));
    g.mat(blob([[14, -3], [19, -3.4], [19.4, 0.4], [14.4, 0.6]], 0.6), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  F.anim({
    // wirft den Knüppel hoch und fängt ihn
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 },
      keys: {
        prop: { y: [[0, 0], [0.35, 0], [0.5, -16, 'out'], [0.65, 0, 'in'], [1, 0]], r: [[0, 0], [0.35, 0], [0.65, -360], [1, -360]] },
        armF: { r: [[0, 0], [0.3, 10], [0.38, -24], [0.62, -10], [0.7, 4], [1, 0]] },
        head: { r: [[0, 0], [0.38, -8], [0.6, -6], [0.72, 0]] },
        cape: { r: [[0, 0], [0.5, 6], [1, 0]] },
      },
    },
    // schleichender, geduckter Lauf
    walk: { p: { stride: 22, bob: 1.6, armSwing: 14, lean: 10 }, keys: { cape: { r: [[0, -4], [0.5, 6], [1, -4]] } } },
    // Uppercut mit dem Knüppel: tief abtauchen, nach oben schnellen
    attack: {
      prog: 'atk.swing',
      hit: 0.55,
      p: { wind: 42, strike: -96, over: -14, cock: 30, snap: 78, lean: -12, lunge: -8, step: 6, stepLeg: 10 },
      keys: { root: { y: [[0, 0], [0.42, 3], [0.55, -4, 'out'], [0.8, 0]] }, earB: { r: [[0, 0], [0.55, -14], [1, 0]] }, earF: { r: [[0, 0], [0.55, -14], [1, 0]] } },
      ev: { strike: 0.55 },
    },
    // Sprint als Schemen: drei Nachbilder, Schwanzschal liegt flach
    charge: { prog: 'biped.run', p: { stride: 44, bob: 2.4, armSwing: 38, lean: 20 }, keys: { cape: { r: [[0, 2], [0.5, 7], [1, 2]] }, earB: { r: [[0, -28], [1, -28]] }, earF: { r: [[0, -28], [1, -28]] } } },
    // Ohren klappen an
    hit: { p: { knock: 2, recoil: 5 }, keys: { earB: { r: [[0, 0], [0.15, -52], [0.7, -40], [1, 0]] }, earF: { r: [[0, 0], [0.15, -52], [0.7, -40], [1, 0]] } } },
    // landet in der Hocke
    spawn: { keys: { cape: { r: [[0, -30], [0.6, 12], [1, 0]] } } },
    // löst sich in Rauch auf, der Schal bleibt kurz liegen
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'hurt']],
        hip: { sx: [[0, 1], [0.2, 1.15], [0.4, 0.05]], sy: [[0, 1], [0.2, 0.85], [0.4, 0.05]] },
        show: { poof: [[0.12, 0.6]], dropped: [[0.3, 1.01]] },
        alpha: [[0, 1], [0.75, 1], [1, 0]],
      },
    },
  });
}
