// Grabstein als Held – kleines Mausoleum mit Säulen, Krone über dem Portal und zweiflügeligem Eisentor
// (Brief: docs/briefs/tombstone-hero.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob } from '../geo.mjs';
import { lines, bricks, emblem, INK, WHITE } from '../kit.mjs';

export default function tombstoneHero(F) {
  const P = F.pal;
  const STONE = P.main;
  const GOLD = P.acc;
  const MOSS = '#6a8a3a';
  const GATE = '#3a3540';
  const STONE_L = '#8a96a6';

  F.rig('building', {
    base: [0, -6],
    roof: [0, -58],
    door: [0, -30],
    chimney: [0, -80],
    flag: [30, -50],
    glow: [0, -30],
    crew: [0, -10],
  });

  // ───────── Sockel und Stufen ─────────
  F.part('steps', { bone: 'base', z: 2 }, (g) => {
    g.mat(path([[-38, -8, 1], [38, -8, 1], [40, 0, 1], [-40, 0, 1]]), STONE_L, 'stone', { hi: 0.4 });
    g.mat(path([[-34, -12, 1], [34, -12, 1], [36, -8, 1], [-36, -8, 1]]), STONE, 'stone');
  });
  F.part('walls', { bone: 'base', z: 4 }, (g) => {
    const w = path([[-32, -58, 1], [32, -58, 1], [32, -12, 1], [-32, -12, 1]]);
    g.mat(w, STONE, 'stone', { hi: 0.4 });
    g.lod(1, (h) => bricks(h, w, [-32, -58, 32, -12], 6, 12, '#5a6474', { lw: 0.6 }));
    g.clipTo(w, (h) => h.fill(blob([[-34, -30], [-26, -40], [-20, -24], [-28, -12], [-34, -14]], 0.6), MOSS, { op: 0.8 }));
  });
  // ───────── Portal mit zweiflügeligem Eisentor und leuchtenden Augen ─────────
  F.part('portal', { bone: 'base', z: 5 }, (g) => {
    g.mat(path([[-14, -12, 1], [-14, -40], [0, -50], [14, -40], [14, -12, 1]]), '#4a5262', 'stone', { hi: 0.3 });
    g.fill(path([[-11, -12, 1], [-11, -38], [0, -46], [11, -38], [11, -12, 1]]), '#0e0c14');
  });
  F.part('eyes', { bone: 'glow', z: 5.5, glow: true }, (g) => {
    for (const x of [-4, 4]) g.fill(ellipse(x, -30, 1.6, 1.1), '#9affb0');
  });
  F.part('gateL', { bone: 'door', z: 6, state: ['idle', 'attack', 'hit', 'spawn', 'death', 'stun', 'sleep'] }, (g) => {
    g.mat(path([[-11, -12, 1], [-11, -38], [0, -46], [0, -12, 1]]), GATE, 'metal', { hi: 0.4 });
    g.mat(path([[0, -12, 1], [0, -46], [11, -38], [11, -12, 1]]), GATE, 'metal', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[-6, -14], [-6, -40]], [[6, -14], [6, -40]], [[-11, -26], [11, -26]]], '#5a5468', 0.8, 1));
    g.mat(circle(-2, -26, 1.2), GOLD, 'gold');
    g.mat(circle(2, -26, 1.2), GOLD, 'gold');
  });
  F.part('gateOpen', { bone: 'door', z: 6, state: ['spawnUnit', 'ability', 'open'] }, (g) => {
    g.mat(path([[-11, -12, 1], [-11, -38], [-16, -36], [-16, -14, 1]]), GATE, 'metal');
    g.mat(path([[11, -12, 1], [11, -38], [16, -36], [16, -14, 1]]), GATE, 'metal');
    g.fill(blob([[-12, -14], [-6, -30], [6, -32], [14, -16], [20, -6], [-20, -6]], 0.7), '#c8d4e0', { op: 0.6 });
  });
  // ───────── Säulen, Giebel, Krone (Signature) ─────────
  F.part('columns', { bone: 'base', z: 7 }, (g) => {
    for (const x of [-24, 24]) {
      g.mat(path([[x - 4, -12, 1], [x + 4, -12, 1], [x + 3.4, -54, 1], [x - 3.4, -54, 1]]), STONE_L, 'stone', { hi: 0.6 });
      g.lod(1, (h) => lines(h, [[[x - 1.6, -14], [x - 1.4, -52]], [[x + 1.6, -14], [x + 1.4, -52]]], '#5a6474', 0.5, 1));
      g.mat(rrect(x - 5.6, -58, 11.2, 4, 1), STONE_L, 'stone');
      g.mat(rrect(x - 5.6, -14, 11.2, 3, 1), STONE_L, 'stone');
    }
  });
  F.part('pediment', { bone: 'roof', z: 8 }, (g) => {
    g.mat(path([[-38, -58, 1], [38, -58, 1], [0, -80, 1]]), STONE_L, 'stone', { hi: 0.5 });
    g.mat(path([[-30, -61, 1], [30, -61, 1], [0, -76, 1]]), STONE, 'stone');
    g.lod(1, (h) => h.stroke(polyline([[-12, -66], [12, -66]]), '#4a5262', 0.8));
  });
  F.part('crown', { bone: 'chimney', z: 9, sig: true }, (g) => {
    g.mat(path([[-8, -80, 1], [8, -80, 1], [9, -88, 1], [5, -84], [2.6, -90, 1], [0, -84], [-2.6, -90, 1], [-5, -84], [-9, -88, 1]]), GOLD, 'gold', { hi: 0.9 });
    g.fill(circle(0, -82.6, 1), '#9affb0');
  });
  // Torbanner (Teamzone) und Kranzschleife (Teamzone)
  F.part('banner', { bone: 'flag', z: 10, team: true }, (g) => {
    g.mat(path([[24, -52], [36, -52], [36, -26], [30, -30], [24, -26]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
    g.lod(1, (h) => h.fill(circle(30, -42, 2.4), GOLD));
  });
  F.part('wreath', { bone: 'base', z: 10.5, team: true }, (g) => {
    g.stroke(circle(-24, -36, 4.6), '#4a7a2a', 2);
    g.mat(path([[-24, -31.4], [-27, -24, 1], [-24, -27], [-21, -24, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  emblem(F, 'emblem', 'roof', 8.5, 0, -66, 2.6);

  F.anim({
    // Tor knarrt, Licht flackert
    idle: { prog: 'building.idle', p: { flag: 6 }, keys: { glow: { sx: [[0, 1], [0.4, 1], [0.45, 0.2], [0.5, 1], [1, 1]] }, door: { x: [[0, 0], [0.7, 0], [0.75, 0.6], [0.8, 0]] } } },
    // Skelette schlurfen heraus
    spawnUnit: { prog: 'building.spawnUnit', p: { open: 0 }, ev: { spawnUnit: 0.25 } },
    attack: { prog: 'building.spawnUnit', p: { open: 0 }, hit: 0.3 },
    hit: { prog: 'generic.hit' },
    // steigt aus dem Boden
    spawn: { prog: 'building.spawn' },
    // Königliche Wiederkehr: das Tor öffnet sich weit, Nebel quillt heraus
    ability: { prog: 'building.idle', keys: { base: { sy: [[0, 1], [0.2, 0.97], [0.4, 1]] } }, ev: { ability: 0.3 } },
    // stürzt ein
    death: { prog: 'building.death' },
  });
}
