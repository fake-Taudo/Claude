// Barbarenhütte – gedrungenes Langhaus mit tief heruntergezogenem Grassodendach, Wolfsschädel über dem Tor und Rauch
// aus dem Dachloch (Brief: docs/briefs/barbarian-hut.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob } from '../geo.mjs';
import { furEdge, lines, rivets, bricks, emblem, INK, WHITE } from '../kit.mjs';

export default function barbarianHut(F) {
  const P = F.pal;
  const SOD = P.main;
  const TAR = P.acc;
  const STONE = '#8a8478';
  const SKULL = '#e6dcc8';
  const SOD_D = '#3e5a22';

  F.rig('building', {
    base: [0, -6],
    roof: [0, -40],
    door: [6, -43],
    chimney: [-8, -92],
    flag: [-44, -100],
    glow: [6, -50],
    crew: [36, -20],
  });

  // ───────── Fahnenstange mit Dachfahne (Teamzone) ─────────
  F.part('pole', { bone: 'base', z: 2 }, (g) => g.mat(path([[-45.6, 0, 1], [-43, 0, 1], [-43.4, -100, 1], [-45, -100, 1]]), '#5a3a22', 'wood'));
  F.part('flag', { bone: 'flag', z: 2.5, team: true }, (g) => {
    g.mat(path([[-44, -100], [-20, -96], [-26, -90], [-20, -84], [-44, -84]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.lod(1, (h) => h.mat(circle(-34, -91.6, 2.6), '#e6dcc8', 'bone'));
  });

  // ───────── Steinsockel und Teerbalken ─────────
  F.part('plinth', { bone: 'base', z: 4 }, (g) => {
    const s = path([[-46, -14, 1], [46, -14, 1], [48, 0, 1], [-48, 0, 1]]);
    g.mat(s, STONE, 'stone', { hi: 0.4 });
    g.lod(1, (h) => bricks(h, s, [-48, -14, 48, 0], 4.6, 9, '#6a6458', { lw: 0.6 }));
  });
  F.part('walls', { bone: 'base', z: 5 }, (g) => {
    const w = path([[-40, -40, 1], [40, -40, 1], [42, -14, 1], [-42, -14, 1]]);
    g.mat(w, TAR, 'wood', { hi: 0.3 });
    g.clipTo(w, (h) => h.lod(1, (k) => {
      for (let x = -36; x < 40; x += 8) k.stroke(polyline([[x, -40], [x, -14]]), '#1e1a18', 0.7);
    }));
  });

  // ───────── Grassodendach (tief heruntergezogen) mit Dachloch ─────────
  F.part('roof', { bone: 'roof', z: 10 }, (g) => {
    const r = blob([[-56, -20], [-50, -50], [-30, -80], [-8, -92], [14, -90], [36, -76], [52, -48], [56, -20], [36, -28], [10, -32], [-20, -30], [-44, -24]], 0.7);
    g.mat(r, SOD, 'fur', { hi: 0.4 });
    g.clipTo(r, (h) => {
      h.lod(1, (k) => lines(k, [[[-44, -40], [-10, -46], [30, -44]], [[-34, -60], [0, -66], [32, -60]], [[-20, -78], [4, -82], [24, -76]]], SOD_D, 0.8, 1));
      // eingestürzte Ecke beim Schaden zeigt sich als dunkle Stelle
      h.fill(ellipse(-4, -91, 8, 3), '#2a2a1e');
    });
    // Grasbüschel an der Traufe
    g.lod(1, (h) => furEdge(h, [[-56, -20], [-44, -24], [-20, -30], [10, -32], [36, -28], [56, -20]], 3.4, '#7a9a44', { side: -1 }));
    g.lod(1, (h) => {
      for (const [x, y] of [[-30, -70], [20, -66], [-6, -54], [36, -48]]) h.fill(poly([[x - 2, y], [x, y - 4], [x + 2, y]], 0.2), '#7a9a44');
    });
  });
  F.part('smoke', { bone: 'chimney', z: 9 }, (g) => {
    for (const [x, y, r] of [[-6, -98, 4], [-2, -106, 5], [-8, -114, 4]]) g.fill(circle(x, y, r), '#c8c4bc', { op: 0.6 });
  });

  // ───────── Tor mit Fellbehang (Teamzone) und Wolfsschädel (Signature) ─────────
  F.part('doorway', { bone: 'base', z: 12 }, (g) => {
    g.mat(path([[-10, -12, 1], [-10, -36], [6, -48], [22, -36], [22, -12, 1]]), '#4a3a2a', 'wood', { hi: 0.3 });
    g.fill(path([[-6, -12, 1], [-6, -34], [6, -43], [18, -34], [18, -12, 1]]), '#120e0a');
  });
  F.part('curtain', { bone: 'door', z: 13, team: true }, (g) => {
    const c = path([[-6, -34], [6, -43], [18, -34], [18, -16], [14, -13], [10, -16], [6, -13], [2, -16], [-2, -13], [-6, -16]]);
    g.mat(c, P.team, 'fur', { line: P.teamDeep, hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[0, -36], [0, -16]], [[6, -40], [6, -15]], [[12, -36], [12, -16]]], P.teamShade, 0.7, 1));
  });
  F.part('curtainOpen', { bone: 'base', z: 13.2, state: ['open', 'spawnUnit'] }, (g) => {
    // aufgerissenes Tor: Staub und Lärm
    for (const [x, y, r] of [[-12, -6, 4], [24, -6, 5], [6, -4, 4]]) g.fill(circle(x, y, r), '#c8b898', { op: 0.6 });
  });
  F.part('skull', { bone: 'base', z: 14, sig: true }, (g) => {
    g.mat(blob([[-4, -54], [0, -60], [8, -61], [14, -57], [14, -50], [10, -46], [2, -46], [-2, -49]], 0.7), SKULL, 'bone', { hi: 0.6 });
    // Schnauze und Unterkiefer
    g.mat(path([[1, -50], [11, -50], [10, -44], [6, -42], [2, -44]]), '#d8ccb0', 'bone');
    for (const x of [3, 9]) g.mat(path([[x - 0.8, -46], [x, -42.6, 1], [x + 0.8, -46]]), WHITE, 'bone');
    g.fill(ellipse(2.6, -55, 1.6, 1.2), '#2a2420');
    g.fill(ellipse(9.4, -55, 1.6, 1.2), '#2a2420');
    // Ohren
    g.mat(path([[-3, -57], [-6, -64, 1], [1, -60]]), SKULL, 'bone');
    g.mat(path([[11, -60], [16, -64, 1], [14, -56]]), SKULL, 'bone');
  });
  F.part('skullGlow', { bone: 'glow', z: 14.5, state: ['open', 'spawnUnit'], glow: true }, (g) => {
    g.fill(circle(2.6, -55, 1.4), '#ffb03a');
    g.fill(circle(9.4, -55, 1.4), '#ffb03a');
  });
  // Holzstapel und Schild am Tor
  F.part('woodpile', { bone: 'crew', z: 15 }, (g) => {
    for (const [x, y] of [[30, -4], [38, -4], [46, -4], [34, -11], [42, -11], [38, -18]]) {
      g.mat(circle(x, y, 3.8), '#8a5a32', 'wood');
      g.lod(1, (h) => h.stroke(circle(x, y, 1.8), '#c89a60', 0.5));
    }
  });
  F.part('shield', { bone: 'base', z: 15.5 }, (g) => {
    g.mat(circle(-22, -26, 6), '#a83a2a', 'wood', { hi: 0.5 });
    g.mat(circle(-22, -26, 2), '#9aa3ad', 'metal');
    g.lod(1, (h) => h.stroke(polyline([[-28, -26], [-16, -26]]), '#6a2018', 0.6));
  });
  emblem(F, 'emblem', 'base', 16, -36, -7, 3);

  F.anim({
    // Rauch steigt, Behang weht, Fahne flattert
    idle: { prog: 'building.idle', p: { flag: 10, door: 3 }, keys: { chimney: { y: [[0, 0], [0.5, -6], [1, 0]], sy: [[0, 1], [0.5, 1.1], [1, 1]] } } },
    // Tor fliegt auf, Staub, Barbaren rennen heraus
    spawnUnit: { prog: 'building.spawnUnit', p: { open: 0 }, keys: { door: { sy: [[0, 1], [0.15, 0.2, 'out'], [0.7, 0.2], [1, 1]] } }, ev: { spawnUnit: 0.25 } },
    attack: { prog: 'building.spawnUnit', p: { open: 0 }, hit: 0.3, keys: { door: { sy: [[0, 1], [0.15, 0.2, 'out'], [0.7, 0.2], [1, 1]] } } },
    // Grasbüschel wackeln, Staub rieselt
    hit: { prog: 'generic.hit', keys: { roof: { sy: [[0, 1], [0.2, 0.96], [0.5, 1]] } } },
    // wächst aus dem Boden: Sockel, Balken, dann plumpst das Dach drauf
    spawn: { prog: 'building.spawn', keys: { roof: { y: [[0, -40], [0.6, -40], [0.85, 0, 'in']] } } },
    // Dach sackt ein, Balken stürzen, Wolfsschädel rollt
    death: { prog: 'building.death' },
  });
}
