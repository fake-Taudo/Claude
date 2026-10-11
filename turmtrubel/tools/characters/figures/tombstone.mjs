// Grabstein – schiefer, bemooster Grabstein mit winkender Skeletthand und flackerndem Grablicht
// (Brief: docs/briefs/tombstone.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, emblem, INK, WHITE } from '../kit.mjs';

export default function tombstone(F) {
  const P = F.pal;
  const STONE = P.main;
  const GHOST = P.acc;
  const MOSS = '#6a8a3a';
  const EARTH = '#6b4a32';
  const BONE = '#efe6d0';

  F.rig('building', {
    base: [0, -4],
    roof: [-4, -30],
    door: [16, -8],
    chimney: [0, -10],
    flag: [-22, -10],
    glow: [-22, -22],
    crew: [18, -10],
  });

  // ───────── Erdhügel ─────────
  F.part('mound', { bone: 'base', z: 2 }, (g) => {
    g.mat(blob([[-36, 0], [-28, -8], [-8, -12], [14, -12], [32, -8], [38, 0]], 0.7), EARTH, 'stone', { hi: 0.3 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-20, -4], [10, -6], [26, -3]]) h.fill(ellipse(x, y, 2.4, 1.4), '#4a3220');
      h.fill(poly([[-30, -6], [-28, -12], [-26, -6]], 0.2), '#7a9a44');
      h.fill(poly([[28, -6], [30, -11], [32, -6]], 0.2), '#7a9a44');
    });
  });
  // ───────── Grabstein (schief, bemoost) mit Riss-Grinsen ─────────
  F.part('stone', { bone: 'roof', z: 4 }, (g) => {
    const s = path([[-22, -8, 1], [-22, -52], [-16, -66], [-4, -71], [8, -68], [14, -56], [14, -8, 1]]).rot(-8, -4, -8);
    g.mat(s, STONE, 'stone', { hi: 0.5 });
    g.clipTo(s, (h) => {
      // Moos
      h.fill(blob([[-24, -48], [-18, -66], [-6, -72], [-10, -60], [-20, -44]], 0.6).rot(-8, -4, -8), MOSS, { op: 0.9 });
      h.fill(blob([[4, -12], [14, -14], [16, -8], [2, -8]], 0.6).rot(-8, -4, -8), MOSS, { op: 0.8 });
      // Inschrift-Linien und Riss als Grinsen
      h.lod(1, (k) => lines(k, [[[-14, -50], [6, -50]].map((p) => p), [[-12, -44], [4, -44]]], '#5a5868', 0.8, 1));
      h.stroke(polyline([[-14, -32], [-10, -28], [-6, -31], [-2, -27], [2, -30], [6, -27]]), '#3a3848', 1.2);
      h.lod(1, (k) => k.stroke(polyline([[4, -66], [1, -58], [4, -54]]), '#5a5868', 0.7));
    });
  });
  // Kranz mit Schleife (Teamzone)
  F.part('wreath', { bone: 'roof', z: 5, team: true }, (g) => {
    g.stroke(circle(-4, -20, 6), '#4a7a2a', 2.4);
    g.mat(path([[-4, -14], [-8, -6, 1], [-5, -9], [-4, -14], [-3, -9], [0, -6, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  // ───────── Winkende Skeletthand (Signature) ─────────
  F.part('hand', { bone: 'crew', z: 6, sig: true }, (g) => {
    g.mat(limb(18, -8, 20, -20, 1.6, 1.4), BONE, 'bone');
    g.mat(circle(20.4, -22, 2.6), BONE, 'bone');
    for (const [dx, dy] of [[-2.4, -6], [-0.6, -7], [1.2, -6.6], [3, -5], [3.6, -2]]) g.mat(limb(20.4, -23, 20.4 + dx, -22 + dy, 0.7, 0.6), BONE, 'bone');
  });
  F.part('earthBurst', { bone: 'base', z: 8, state: ['open', 'spawnUnit'] }, (g) => {
    for (const [x, y, r] of [[-6, -14, 3], [8, -16, 2.6], [0, -20, 2]]) g.fill(circle(x, y, r), EARTH);
    g.mat(blob([[2, -4], [6, -12], [12, -12], [14, -6]], 0.6), BONE, 'bone');
  });
  // ───────── Grablicht mit Schirm (Teamzone) ─────────
  F.part('lantern', { bone: 'flag', z: 7 }, (g) => {
    g.mat(rrect(-26, -16, 8, 10, 1.4), '#4a4a50', 'metal');
    g.mat(rrect(-25, -15, 6, 8, 1), '#2a2a30', 'glass');
  });
  F.part('lanternHood', { bone: 'flag', z: 7.5, team: true }, (g) => g.mat(path([[-28, -16, 1], [-16, -16, 1], [-19, -21], [-25, -21]]), P.team, 'metal', { line: P.teamDeep, lw: 0.5 }));
  F.part('candle', { bone: 'glow', z: 7.2, glow: true }, (g) => {
    g.fill(ellipse(-22, -11, 1.4, 2.4), GHOST);
    g.fill(circle(-22, -11, 4), GHOST, { op: 0.25 });
  });
  emblem(F, 'emblem', 'roof', 5.5, -4, -38, 2.8);

  F.anim({
    // die Hand winkt, das Grablicht flackert
    idle: { prog: 'building.idle', keys: { crew: { r: [[0, -10], [0.25, 12], [0.5, -10], [0.75, 12], [1, -10]] }, glow: { sy: [[0, 1], [0.3, 1.2], [0.5, 0.9], [0.8, 1.1], [1, 1]] } } },
    // Erde bricht auf, Skelette klettern heraus
    spawnUnit: { prog: 'building.spawnUnit', p: { open: 0 }, ev: { spawnUnit: 0.2 } },
    attack: { prog: 'building.spawnUnit', p: { open: 0 }, hit: 0.3 },
    hit: { prog: 'generic.hit' },
    // fällt herab und bohrt sich in die Erde
    spawn: { prog: 'still', keys: { roof: { y: [[0, -60], [0.6, 4, 'in'], [0.75, 0]] }, base: { sx: [[0, 1], [0.6, 1], [0.7, 1.1], [0.85, 1]] } } },
    // Stein zerbricht, Skelette springen heraus
    death: { prog: 'building.death', keys: { show: { open: [[0, 1.01]] }, roof: { r: [[0, 0], [0.5, -20]] } } },
  });
}
