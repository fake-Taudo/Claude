// Schneemann – frostig-freundlicher Gehilfe des Eismagier-Helden: zwei Schneekugeln, Eiszapfenkrone, Rübennase mit Raureif;
// steht still und friert mit seiner Frostaura alles in der Nähe ein (Brief: docs/briefs/snowman.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { lines, emblem, INK, WHITE } from '../kit.mjs';

export default function snowman(F) {
  const P = F.pal;
  const SNOW = P.main;
  const FROST = P.acc;
  const CARROT = '#ff8a3a';
  const TWIG = '#6b4a32';
  const COAL = '#2a2830';
  const SNOW_D = '#cfdcf0';
  const LIVE = ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability', 'spawnUnit', 'whole'];

  F.rig(
    'biped',
    {
      hip: [0, -4],
      torso: [0, -10],
      head: [2, -46],
      hat: [2, -76],
      back: [-10, -44],
      armB: [-14, -40],
      handB: [-32, -54],
      armF: [16, -40],
      handF: [35, -55],
      prop: [35, -55],
      legB: [-8, -4],
      footB: [-8, -2],
      legF: [8, -4],
      footF: [8, -2],
      cape: [-4, -46],
      aura: [0, -3],
    },
    { aura: 'root' },
  );

  // ───────── Frostaura: Ring aus Schneeflocken am Boden ─────────
  const ring = (g, op) => {
    g.stroke(ellipse(0, -3, 44, 13), '#dff4ff', 1.6, { op: op * 0.7 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fill(star(Math.cos(a) * 44, -3 + Math.sin(a) * 13, 2.8, 0.9, 6), '#ffffff', { op });
    }
  };
  F.part('auraBack', { bone: 'aura', z: 1, zb: 1, state: ['attack', 'auraOn'], outline: false }, (g) => ring(g, 0.9));

  // ───────── Strickschal-Enden (Teamzone) hinten ─────────
  F.part('scarfTail', { bone: 'cape', z: 4, zb: 44, team: true, state: LIVE }, (g) => {
    g.mat(path([[-6, -46], [-16, -44], [-22, -36, 1], [-18, -35], [-22, -28, 1], [-14, -34], [-6, -40]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  // ───────── Astarm hinten ─────────
  const twigArm = (g, ax, ay, bx, by, col) => {
    g.mat(limb(ax, ay, bx, by, 1.6, 1.1), col, 'wood', { hi: 0.4 });
    const mx = ax + (bx - ax) * 0.6;
    const my = ay + (by - ay) * 0.6;
    g.mat(limb(mx, my, mx + 4, my - 7, 1, 0.6), col, 'wood');
    g.mat(limb(bx, by, bx + 4, by - 4, 0.9, 0.5), col, 'wood');
    g.mat(limb(bx, by, bx + 5, by + 1, 0.9, 0.5), col, 'wood');
  };
  F.part('armB', { bone: 'armB', z: 9, zb: 42, state: LIVE }, (g) => twigArm(g, -14, -40, -32, -54, '#5a3e2a'));

  // ───────── Untere Schneekugel mit Kohleknöpfen, schmelzende Kanten ─────────
  F.part('body', { bone: 'torso', z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob([[-26, -4], [-28, -22], [-20, -40], [0, -47], [20, -40], [28, -22], [26, -4], [0, -1]], 0.8);
    g.mat(b, SNOW, 'cloth', { hi: 0.6 });
    g.clipTo(b, (h) => {
      h.fill(ellipse(-10, -10, 24, 10), SNOW_D, { op: 0.6 });
      h.lod(1, (k) => {
        for (const [x, y] of [[-16, -32], [10, -18], [-4, -24], [18, -34]]) k.fill(star(x, y, 1.4, 0.5, 6), '#ffffff');
      });
    });
    // schmelzende Kante am Boden
    g.mat(path([[-26, -3], [-18, -1], [-10, 0.8, 1], [8, 0.8, 1], [22, -1], [27, -3], [24, 0.6, 1], [-24, 0.6, 1]]), SNOW_D, 'cloth', { lod: 1 });
  });
  F.part('buttons', { bone: 'torso', z: 19, zb: 19, view: 'front', state: LIVE }, (g) => {
    for (const [x, y] of [[16, -34], [19, -24], [19, -14]]) g.mat(circle(x, y, 2), COAL, 'stone', { hi: 0.5 });
  });
  emblem(F, 'emblem', 'torso', 20, -12, -24, 2.4, { zb: 20, state: LIVE });

  // ───────── Kopfkugel: Kohleaugen, Rübennase mit Raureif, Kohlelächeln ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30, state: LIVE }, (g) => {
    const h0 = circle(2, -62, 16);
    g.mat(h0, SNOW, 'cloth', { hi: 0.6 });
    g.clipTo(h0, (h) => h.fill(ellipse(-6, -52, 16, 7), SNOW_D, { op: 0.5 }));
  });
  F.part('face.idle', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    for (const [x, r] of [[11, 2.2], [3.6, 2]]) {
      g.mat(circle(x, -66, r), COAL, 'stone', { hi: 0.6 });
      g.fill(circle(x - r * 0.3, -66 - r * 0.35, r * 0.3), '#ffffff', { op: 0.7 });
    }
    for (const [x, y] of [[4, -55.4], [7, -54], [10.4, -53.8], [13.6, -55]]) g.mat(circle(x, y, 1), COAL, 'stone');
  });
  F.part('face.hurt', { bone: 'head', z: 31, view: 'front', state: LIVE, expr: ['hurt', 'stun', 'death'] }, (g) => {
    for (const x of [11, 3.6]) g.stroke(spline([[x - 2, -66.4], [x, -65], [x + 2, -66.4]]), COAL, 1.2);
    g.fill(ellipse(9, -54.4, 2.4, 1.8), COAL);
  });
  F.part('nose', { bone: 'head', z: 32, zb: 32, state: LIVE }, (g) => {
    g.mat(path([[12, -63.6], [27, -61.4, 1], [12, -59.4]]), CARROT, 'skin', { hi: 0.5 });
    g.lod(1, (h) => {
      lines(h, [[[15, -63], [15.4, -61]], [[19, -62.4], [19.2, -60.8]]], '#c8642a', 0.5, 1);
      for (const [x, y] of [[17, -62.6], [22, -61.8], [14, -60.4]]) h.fill(circle(x, y, 0.6), '#ffffff', { op: 0.9 });
    });
  });
  // Strickschal (Teamzone) zwischen den Kugeln
  F.part('scarf', { bone: 'torso', z: 33, zb: 33, team: true, state: LIVE }, (g) => {
    const sc = path([[-14, -50], [4, -48.4], [18, -49], [18, -42.6], [4, -42], [-14, -43.6]]);
    g.mat(sc, P.team, 'cloth', { line: P.teamDeep, lw: 0.5, hi: 0.3 });
    g.clipTo(sc, (h) => h.lod(1, (k) => {
      for (let x = -12; x < 18; x += 3) k.stroke(polyline([[x, -49], [x + 1.4, -46], [x, -43]]), P.teamShade, 0.6);
    }));
    g.mat(path([[12, -44], [16, -30, 1], [11, -30, 1], [9, -43]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.lod(1, (h) => lines(h, [[[11, -32], [11.4, -29.6]], [[13, -32], [13.6, -29.6]], [[15, -32], [15.8, -29.6]]], P.teamDeep, 0.5, 1));
  });
  // Eiszapfenkrone (Signature)
  const crown = (g, cx, cy, s) => {
    for (const [dx, h] of [[-9, 9], [-4.6, 13], [0, 16], [4.6, 13], [9, 9]]) {
      g.mat(path([[cx + (dx - 2.6) * s, cy], [cx + dx * s, cy - h * s, 1], [cx + (dx + 2.6) * s, cy]]), '#e8f8ff', 'glass', { hi: 0.9, line: '#7ab8d8', lw: 0.5 });
    }
    g.mat(path([[cx - 12 * s, cy - 2 * s], [cx + 12 * s, cy - 2 * s], [cx + 11 * s, cy + 2.4 * s], [cx - 11 * s, cy + 2.4 * s]]), FROST, 'glass', { hi: 0.8 });
  };
  F.part('crown', { bone: 'hat', z: 34, zb: 34, sig: true, state: LIVE }, (g) => crown(g, 2, -76, 1));
  F.part('crownGlint', { bone: 'hat', z: 34.5, zb: 34.5, state: LIVE, glow: true, lod: 1 }, (g) => g.fill(star(2, -92, 2.4, 0.6, 4), '#ffffff', { op: 0.9 }));

  // ───────── Astarm vorn ─────────
  F.part('armF', { bone: 'armF', z: 35, zb: 6, state: LIVE }, (g) => twigArm(g, 16, -40, 35, -55, TWIG));
  F.part('auraFront', { bone: 'aura', z: 49, zb: 49, state: ['attack', 'auraOn'], outline: false }, (g) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI;
      pts.push([Math.cos(a) * 44, -3 + Math.sin(a) * 13]);
    }
    g.stroke(spline(pts), '#ffffff', 2, { op: 0.8 });
  });

  // ───────── Schneeflocken, Bröckeln, Frostschlag, Pfütze ─────────
  F.part('flakes', { bone: 'root', z: 50, zb: 50, state: ['idle', 'walk'], outline: false, lod: 1 }, (g) => {
    for (const [x, y, r] of [[-30, -70, 2], [26, -86, 1.6], [-22, -96, 1.4], [34, -40, 1.8], [-36, -30, 1.4]]) g.fill(star(x, y, r, r * 0.35, 6), '#ffffff', { op: 0.9 });
  });
  F.part('crumbs', { bone: 'root', z: 50, zb: 50, state: 'crumbs' }, (g) => {
    for (const [x, y, r] of [[-30, -40, 2.4], [28, -48, 2], [-26, -20, 1.8], [30, -24, 1.6]]) g.mat(circle(x, y, r), SNOW, 'cloth', { hi: 0.5 });
  });
  F.part('blast', { bone: 'root', z: 51, zb: 51, state: 'blast', glow: true }, (g) => {
    g.fill(star(0, -36, 46, 20, 8, -90, 4), '#bfeeff', { op: 0.6 });
    g.fill(circle(0, -36, 16), '#ffffff', { op: 0.7 });
  });
  F.part('puddle', { bone: 'root', z: 16, zb: 16, state: 'puddle' }, (g) => {
    g.mat(blob([[-30, 0], [-22, -4], [0, -5], [24, -4], [32, 0], [20, 3], [-20, 3]], 0.8), '#bfe6f8', 'glass', { hi: 0.9 });
    for (const [x, y] of [[-8, -2], [6, -1.4]]) g.mat(circle(x, y, 1.6), COAL, 'stone');
    g.mat(path([[12, -2.4], [22, -1.6, 1], [12, -0.6]]), CARROT, 'skin');
    crown(g, -14, -3, 0.6);
    g.mat(path([[-26, -1], [-20, -4], [-16, -1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });

  F.anim({
    // Schneeflocken rieseln um ihn
    idle: { prog: 'still', keys: { head: { r: [[0, -3], [0.5, 3], [1, -3]] }, armF: { r: [[0, 0], [0.5, -10], [1, 0]] }, armB: { r: [[0, 0], [0.5, 8], [1, 0]] }, torso: { sy: [[0, 1], [0.5, 1.02], [1, 1]] } } },
    // keine Fortbewegung: steht
    walk: { prog: 'still', keys: { head: { r: [[0, -3], [0.5, 3], [1, -3]] } } },
    // Frostaura pulsiert
    attack: {
      prog: 'still',
      hit: 0.5,
      keys: {
        expr: [[0, 1, 'attack']],
        aura: { sx: [[0, 0.4], [0.5, 1, 'out'], [1, 1.3]], sy: [[0, 0.4], [0.5, 1, 'out'], [1, 1.3]] },
        alpha: [[0, 1], [1, 1]],
        armF: { r: [[0, 0], [0.4, -40], [0.6, -40], [1, 0]] },
        armB: { r: [[0, 0], [0.4, -30], [0.6, -30], [1, 0]] },
        head: { r: [[0, 0], [0.4, -6], [1, 0]] },
      },
      ev: { strike: 0.5 },
    },
    // Schnee bröckelt
    hit: { p: { knock: 0.6, recoil: 2 }, keys: { show: { crumbs: [[0, 0.7]] } } },
    // rollt sich auf mit Frostschlag
    spawn: { prog: 'still', keys: { root: { sx: [[0, 0.3], [0.5, 1.1, 'out'], [0.7, 1]], sy: [[0, 0.2], [0.5, 1.1, 'out'], [0.7, 1]] }, show: { blast: [[0.35, 0.8]], auraOn: [[0.4, 0.9]] } } },
    // schmilzt zu einer Pfütze mit Krone
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        hip: { sx: [[0, 1], [0.45, 1.3]], sy: [[0, 1], [0.45, 0.25]] },
        show: { whole: [[0, 0.45]], puddle: [[0.4, 1.01]] },
        alpha: [[0, 1], [0.8, 1], [1, 0]],
      },
    },
  });
}
