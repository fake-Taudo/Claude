// Tunnelgräber – kurzsichtiger, fleißiger Maulwurfmann mit riesigen Schaufelkrallen, runder dunkler Brille und
// Rüsselnase (Brief: docs/briefs/miner.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eyeClosed, eyeX, mouthOpen, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function miner(F) {
  const P = F.pal;
  const FUR = P.main;
  const BRASS = P.acc;
  const NOSE = '#e8a0a0';
  const VEST = '#6b5040';
  const FUR_D = '#5a4b46';
  const FUR_L = '#857570';
  const CLAW = '#f0e0c8';
  const DIRT = '#8a6440';
  const LENS = '#1e2230';

  F.rig(
    'biped',
    {
      hip: [0, -18],
      torso: [0, -20],
      head: [14, -46],
      hat: [14, -64],
      back: [-8, -36],
      armB: [-2, -38],
      handB: [-6, -23],
      armF: [12, -38],
      handF: [21, -25],
      prop: [21, -25],
      legB: [-6, -16],
      footB: [-7, -4],
      legF: [5, -16],
      footF: [6, -4],
      cape: [0, -40],
      nose: [25, -51],
      specs: [17, -55],
      mound: [0, 0],
    },
    { nose: 'head', specs: 'head', mound: 'root' },
  );

  // Schaufelpfote: rosa Ballen, fünf breite Krallen fächern nach vorn-unten
  const paw = (g, cx, cy, s, palm, claw) => {
    for (let i = 0; i < 5; i++) {
      const a = ((-10 + i * 26) * Math.PI) / 180;
      const [dx, dy] = [Math.cos(a), Math.sin(a)];
      const [nx, ny] = [-dy, dx];
      const bx = cx + dx * 5.2 * s;
      const by = cy + dy * 4.6 * s;
      const L = (i === 2 ? 8 : 7) * s;
      const w = 1.6 * s;
      g.mat(path([[bx - nx * w, by - ny * w], [bx + dx * L * 0.6 - nx * w * 0.8, by + dy * L * 0.6 - ny * w * 0.8], [bx + dx * L + nx * 0.6, by + dy * L + ny * 0.6, 1], [bx + nx * w, by + ny * w]]), claw, 'bone', { hi: 0.6 });
    }
    g.mat(ellipse(cx, cy, 6.8 * s, 6 * s, -10), palm, 'skin', { hi: 0.4 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-2, -1.6], [1.6, -2.4], [3, 1]]) h.fill(circle(cx + x * s, cy + y * s, 1 * s), '#c87a80', { op: 0.6 });
    });
  };

  // ───────── Stummelbeine mit rosa Grabfüßen ─────────
  const leg = (name, foot, x, fx, z, col) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -17, fx, -5, 3.8, 3.2), col, 'fur'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[fx - 3.4, -6], [fx + 3, -6.4], [fx + 6.4, -2.4], [fx + 6.6, 0, 1], [fx - 4, 0, 1]]), NOSE, 'skin', { hi: 0.4 });
      for (const dx of [5.4, 7, 8.4]) g.mat(path([[fx + dx - 2.2, -2.4], [fx + dx + 1.2, -1], [fx + dx - 1.4, -0.4]]), CLAW, 'bone', { lod: 1 });
    });
  };
  leg('legB', 'footB', -6, -7, 6, FUR_D);
  leg('legF', 'footF', 5, 6, 8, FUR);

  // ───────── Hinterer Arm mit Schaufelpfote ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-2, -38, -6, -25, 3.8, 3.4), FUR_D, 'fur'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => paw(g, -6, -22, 0.85, '#d08a8e', '#d8c8b0'));

  // ───────── Birnenförmiger Pelzkörper, Erde im Fell ─────────
  F.part('body', { bone: 'torso', z: 18, zb: 18 }, (g) => {
    const b = blob([[-13, -8], [-17, -24], [-15, -38], [-5, -47], [9, -46], [16, -36], [16, -20], [10, -8]], 0.75);
    g.mat(b, FUR, 'fur', { hi: 0.35 });
    g.clipTo(b, (h) => {
      h.fill(ellipse(10, -22, 7, 12), FUR_L, { op: 0.6 });
      h.lod(1, (k) => {
        lines(k, [[[-12, -30], [-9, -28]], [[-14, -20], [-11, -19]], [[-10, -12], [-7, -11]]], FUR_D, 0.6, 1);
        for (const [x, y, r] of [[-11, -14, 2.6], [12, -12, 2], [-8, -38, 1.8]]) k.fill(ellipse(x, y, r * 1.4, r), '#5a4430', { op: 0.55 });
      });
    });
  });
  // ───────── Weste mit Werkzeugtasche und Messingknöpfen ─────────
  F.part('vest', { bone: 'torso', z: 21, zb: 21 }, (g) => {
    const v = path([[-14, -38], [-4, -46.6], [6, -46], [9.4, -37], [8.6, -19], [-13.6, -19], [-16, -28]]);
    g.mat(v, VEST, 'leather', { hi: 0.4 });
    g.clipTo(v, (h) => h.lod(1, (k) => stitches(k, [[-13, -21], [8, -21]], '#c8a878', { step: 2, len: 1 })));
    for (const y of [-40, -33, -26]) g.mat(circle(8.2, y, 1.1), BRASS, 'gold', { hi: 0.8 });
  });
  F.part('pocket', { bone: 'torso', z: 22, zb: 22 }, (g) => {
    // Hammerstiel und Schraubenschlüssel stecken in der Tasche
    g.mat(rrect(-6.6, -38, 1.6, 8, 0.6), '#8a5a32', 'wood');
    g.mat(rrect(-9, -39.4, 6.4, 2.6, 0.6), '#7a7f8a', 'metal', { hi: 0.7 });
    g.mat(path([[-2, -36], [-1, -37.4], [0.4, -36.6], [0, -35.4], [-0.6, -30], [-1.6, -30]]), '#9aa0a8', 'metal', { hi: 0.7, lod: 1 });
    g.mat(rrect(-10, -32, 11, 8, 1.4), '#5a4030', 'leather', { hi: 0.3 });
    g.lod(1, (h) => stitches(h, [[-9.2, -31], [0.2, -31]], '#c8a878', { step: 1.8, len: 0.8 }));
  });
  emblem(F, 'emblem', 'torso', 25, -4.6, -27.6, 1.7, { zb: 25 });

  // ───────── Kopf: Pelzkugel, Rüsselnase, Schnurrhaare, Hasenzähne ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[4, -46], [3, -56], [11, -63.6], [21, -63], [28, -55], [27, -46], [19, -42], [8, -42]], 0.75), FUR, 'fur', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[8, -61], [10, -63]], [[14, -63], [15, -65]], [[20, -62.6], [22, -64.6]]], FUR_D, 0.6, 1));
    g.fill(ellipse(9, -50, 3, 2), '#5a4430', { op: 0.45, lod: 1 });
  });
  F.part('mouth', { bone: 'head', z: 31, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    g.stroke(spline([[21, -46.4], [23.6, -45], [26.4, -46.6]]), INK, 0.8);
    g.fill(rrect(22.6, -46, 2.6, 2.6, 0.4), WHITE, { stroke: INK, lw: 0.4 });
  });
  F.part('mouth.attack', { bone: 'head', z: 31, view: 'front', expr: ['attack', 'ability', 'hurt', 'stun'] }, (g) => mouthOpen(g, 23.6, -45.4, 5.4, 3.2, { teeth: 'top', tongue: true, lw: 0.6 }));
  F.part('nose', { bone: 'nose', z: 33, zb: 33 }, (g) => {
    g.mat(limb(23, -51.6, 32.6, -49, 3.2, 2.2), NOSE, 'skin', { hi: 0.4 });
    g.mat(ellipse(33.4, -48.8, 2.4, 2.9, -10), '#e08890', 'skin', { hi: 0.5 });
    g.fill(circle(33.8, -49.8, 0.6), '#7a3a40');
    g.fill(circle(33.6, -47.8, 0.6), '#7a3a40');
    g.lod(1, (h) => lines(h, [[[26, -53.6], [26.6, -50.2]], [[28.6, -52.6], [29, -49.4]]], '#c87a80', 0.5, 1));
  });
  F.part('whiskers', { bone: 'nose', z: 33.5, zb: 33.5 }, (g) => {
    for (const [x1, y1] of [[36, -56], [37.4, -51], [35.6, -45]]) g.stroke(spline([[26.4, -50.4], [(26.4 + x1) / 2, (y1 - 50.4) / 2 - 0.6], [x1, y1]]), '#2a2220', 0.45);
    for (const [x1, y1] of [[17, -51], [17.6, -47]]) g.stroke(polyline([[22, -49.6], [x1, y1]]), '#2a2220', 0.4, { lod: 1 });
  });
  // ───────── Runde, dunkle Brille (kleine Augen dahinter) ─────────
  F.part('specs', { bone: 'specs', z: 34, zb: 34 }, (g) => {
    g.stroke(polyline([[11, -55.6], [5, -54]]), BRASS, 0.8);
    g.mat(circle(13.2, -55.4, 2.8), LENS, 'glass', { line: BRASS, lw: 0.8 });
    g.mat(circle(20.4, -55, 3.6), LENS, 'glass', { line: BRASS, lw: 0.9 });
    g.stroke(spline([[16, -55.4], [16.8, -56.4], [17.4, -55.6]]), BRASS, 0.8);
    g.fill(ellipse(19.2, -56.6, 1.2, 0.8, -30), '#ffffff', { op: 0.8 });
    g.fill(ellipse(12.4, -56.6, 0.8, 0.6, -30), '#ffffff', { op: 0.6, lod: 1 });
  });
  F.part('eyes.idle', { bone: 'specs', z: 34.5, view: 'front', expr: ['idle', 'attack', 'ability'] }, (g) => {
    g.fill(circle(21, -54.6, 0.8), '#8a90a8', { op: 0.85 });
    g.fill(circle(13.8, -55, 0.6), '#8a90a8', { op: 0.7 });
  });
  F.part('brows.attack', { bone: 'head', z: 34.6, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    g.stroke(polyline([[17.6, -61], [22.6, -59.6]]), FUR_D, 1.2);
    g.stroke(polyline([[11, -60.4], [15, -59.6]]), FUR_D, 1);
  });
  // Brille verrutscht: kleine, blinzelnde Augen darüber
  F.part('eyes.hurt', { bone: 'head', z: 33.2, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    eyeClosed(g, 20.4, -57.6, 1.4, { up: true, lw: 0.7 });
    eyeClosed(g, 13.4, -57.8, 1.2, { up: true, lw: 0.6 });
  });
  F.part('eyes.death', { bone: 'specs', z: 34.5, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 20.4, -55, 1.4, '#c8ccd2', 0.6);
    eyeX(g, 13.2, -55.4, 1.1, '#c8ccd2', 0.5);
  });
  F.part('eyes.sleep', { bone: 'specs', z: 34.5, view: 'front', expr: 'sleep' }, (g) => {
    g.stroke(polyline([[19.4, -54.6], [21.6, -54.6]]), '#8a90a8', 0.5);
    g.stroke(polyline([[12.4, -55], [14.2, -55]]), '#8a90a8', 0.5);
  });
  F.part('headBack', { bone: 'head', z: 35, view: 'back' }, (g) => g.mat(blob([[4, -46], [4, -58], [12, -64], [22, -62], [27, -52], [20, -42], [8, -42]], 0.75), FUR, 'fur'));

  // ───────── Halstuch (Teamzone) ─────────
  F.part('neckerchief', { bone: 'torso', z: 31.5, zb: 31.5, team: true }, (g) => {
    g.mat(path([[4, -45], [19, -43], [17.6, -40], [13, -33.6, 1], [9.4, -40], [4, -42]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    g.mat(blob([[15, -43.6], [18.6, -43.2], [18.4, -40.4], [15.4, -40.6]], 0.6), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  // ───────── Vorderer Arm mit riesiger Schaufelpfote (Signature) ─────────
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(12, -38, 20, -27, 4.2, 3.8), FUR, 'fur', { hi: 0.35 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7, sig: true }, (g) => paw(g, 22, -22, 1.05, NOSE, CLAW));

  // ───────── Erdhügel und Erdklumpen (Auftauchen, Eingraben) ─────────
  F.part('mound', { bone: 'mound', z: 50, zb: 50, state: 'mound' }, (g) => {
    const m = blob([[-24, 0.6], [-18, -7], [-8, -13], [6, -14.6], [17, -9], [25, 0.6]], 0.7);
    g.mat(m, DIRT, 'stone', { hi: 0.3 });
    g.clipTo(m, (h) => {
      for (const [x, y, r] of [[-12, -6, 2.4], [-2, -10, 2], [8, -7, 2.6], [16, -3, 1.8], [-18, -1, 1.6]]) h.fill(ellipse(x, y, r * 1.3, r), '#6a4a2c');
      h.lod(1, (k) => {
        for (const [x, y] of [[-6, -4], [4, -2], [12, -10]]) k.mat(ellipse(x, y, 1.6, 1.1), '#a8a098', 'stone');
      });
    });
  });
  F.part('clods', { bone: 'mound', z: 51, zb: 51, state: 'clods' }, (g) => {
    for (const [x, y, r] of [[-16, -22, 2.4], [-6, -30, 1.8], [12, -28, 2.2], [20, -18, 1.6], [2, -36, 1.4]]) g.mat(blob([[x - r, y], [x, y - r], [x + r, y - r * 0.4], [x + r * 0.6, y + r], [x - r * 0.6, y + r * 0.8]], 0.7), DIRT, 'stone');
  });

  F.anim({
    // schnuppert mit der Rüsselnase
    idle: {
      p: { breathe: 0.03, bob: 0.8, sway: 1, tilt: 2 },
      keys: { nose: { r: [[0, 0], [0.1, -10], [0.18, 4], [0.26, -10], [0.34, 4], [0.42, 0], [1, 0]] }, head: { r: [[0, 0], [0.1, -5], [0.42, -5], [0.52, 0]] } },
    },
    // tapsiger Gang
    walk: { p: { stride: 12, bob: 2.4, armSwing: 12, lean: 6 }, keys: { torso: { r: [[0, -5], [0.5, 5], [1, -5]] }, nose: { r: [[0, -4], [0.5, 4], [1, -4]] } } },
    // Krallenhieb von oben
    attack: {
      prog: 'atk.swing',
      hit: 0.55,
      p: { wind: -115, strike: -8, over: 16, cock: -10, snap: 22, lean: 6, lunge: 14, step: 5 },
      keys: { layer: [[0.1, 0.48, 'armF', 27, 6], [0.1, 0.48, 'handF', 28, 7]] },
      ev: { strike: 0.55 },
    },
    // Brille rutscht
    hit: { p: { knock: 1.8, recoil: 4 }, keys: { specs: { y: [[0, 0], [0.15, 3.6], [0.85, 3.6], [1, 0]], r: [[0, 0], [0.15, -10], [0.85, -10], [1, 0]] } } },
    // bricht aus dem Boden
    spawn: {
      prog: 'still',
      keys: {
        hip: { sy: [[0, 0.12], [0.35, 1.08, 'out'], [0.5, 1]], y: [[0, 14], [0.35, -3, 'out'], [0.5, 0]] },
        show: { mound: [[0, 0.85]], clods: [[0.2, 0.6]] },
      },
    },
    // gräbt sich ein
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'hurt']],
        torso: { r: [[0, 0], [0.1, -10], [0.2, 10], [0.3, -10], [0.4, 10], [0.5, 0]] },
        hip: { sy: [[0, 1], [0.15, 1.05], [0.6, 0.12]], y: [[0, 0], [0.15, -2], [0.6, 14]] },
        show: { mound: [[0.08, 1.01]], clods: [[0.12, 0.55]] },
        alpha: [[0, 1], [0.75, 1], [1, 0]],
      },
    },
  });
}
