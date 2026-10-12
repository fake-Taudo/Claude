// Koboldkäfig – vergoldeter Vogelkäfig auf einem Sockel, in dem ein Kobold-Raufbold tobt (Brief: docs/briefs/goblin-cage.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob, arc } from '../geo.mjs';
import { eyeX, lines, rivets, bricks, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinCage(F) {
  const P = F.pal;
  const GOLD = P.main;
  const IRON = P.acc;
  const SKIN = '#6e9c40';
  const SKIN_D = '#4e7a2a';
  const STONE = '#8a8478';
  const VINE = '#4a9a3a';

  F.rig('building', {
    base: [0, -8],
    roof: [0, -78],
    door: [0, -44],
    chimney: [0, -96],
    flag: [-30, -40],
    glow: [0, -50],
    crew: [0, -18],
  });

  // ───────── Runder Sockel ─────────
  F.part('pedestal', { bone: 'base', z: 2 }, (g) => {
    const s = path([[-24, -14, 1], [24, -14, 1], [28, 0, 1], [-28, 0, 1]]);
    g.mat(s, STONE, 'stone', { hi: 0.4 });
    g.lod(1, (h) => bricks(h, s, [-28, -14, 28, 0], 4.6, 10, '#6a6458', { lw: 0.6 }));
    g.mat(ellipse(0, -14, 25, 4.6), '#a8a294', 'stone');
  });
  // ───────── Der Raufbold im Käfig (rüttelt an den Stäben) ─────────
  F.part('brawler', { bone: 'crew', z: 4 }, (g) => {
    // Körper
    g.mat(blob([[-12, -16], [-14, -40], [-6, -48], [8, -48], [14, -40], [12, -16]], 0.7), SKIN, 'skin', { hi: 0.4 });
    g.mat(path([[-12, -24, 1], [12, -24, 1], [13, -14, 1], [-13, -14, 1]]), '#a35d3d', 'cloth');
    // Kopf
    g.mat(blob([[-8, -54], [-6, -62], [4, -64], [10, -60], [11, -52], [6, -47], [-4, -47]], 0.7), SKIN, 'skin', { hi: 0.4 });
    g.mat(path([[-7, -57], [-16, -60, 1], [-8, -53]]), SKIN_D, 'skin');
    g.mat(path([[9, -57], [18, -60, 1], [10, -53]]), SKIN_D, 'skin');
    // Fäuste an den Stäben
    for (const x of [-14, 14]) g.mat(circle(x, -40, 4.4), SKIN, 'skin', { hi: 0.4 });
  });
  F.part('brawlerFace', { bone: 'crew', z: 4.5, expr: ['idle', 'attack', 'hurt', 'stun', 'sleep', 'ability'] }, (g) => {
    for (const x of [-2.6, 4.6]) g.fill(ellipse(x, -56, 1.3, 1.5), '#e83a2a');
    g.stroke(polyline([[-5, -59.6], [0, -58]]), SKIN_D, 1.2);
    g.stroke(polyline([[7, -59.6], [2, -58]]), SKIN_D, 1.2);
    g.fill(path([[-3, -51], [5, -51], [4, -49], [-2, -49]]), '#3a1a1a');
    for (const x of [-1.6, 3.6]) g.mat(path([[x - 0.8, -49.4], [x, -53, 1], [x + 0.8, -49.4]]), WHITE, 'bone');
  });
  F.part('brawlerDeath', { bone: 'crew', z: 4.5, expr: 'death' }, (g) => {
    eyeX(g, -2.6, -56, 1.4, INK, 0.8);
    eyeX(g, 4.6, -56, 1.4, INK, 0.8);
  });
  // ───────── Goldener Vogelkäfig (Signature) mit Kuppel, Ring und Vorhängeschloss ─────────
  F.part('bars', { bone: 'door', z: 6, sig: true }, (g) => {
    // hoher, schmaler Vogelkäfig (deutlich schlanker als Grabmal und Hütten)
    for (let i = 0; i <= 8; i++) {
      const x = -20 + i * 5;
      const top = -76 + Math.pow(x / 20, 2) * 12;
      g.mat(path([[x - 0.9, -14, 1], [x + 0.9, -14, 1], [x + 0.9, top, 1], [x - 0.9, top, 1]]), GOLD, 'gold', { hi: 0.8 });
    }
    // verbogener Stab
    g.lod(1, (h) => h.stroke(spline([[13, -14], [15, -36], [11, -50], [13, -64]]), '#a8862a', 0.6));
    g.mat(rrect(-22, -32, 44, 3, 1.2), GOLD, 'gold', { hi: 0.8 });
    g.mat(rrect(-22, -17, 44, 3, 1.2), GOLD, 'gold');
    // Zierranken
    g.lod(2, (h) => {
      for (const x of [-14, 0, 14]) h.stroke(spline([[x - 4, -30], [x - 2, -27], [x, -30], [x + 2, -27], [x + 4, -30]]), '#f0d070', 0.5);
    });
  });
  F.part('dome', { bone: 'roof', z: 7 }, (g) => {
    const d = arc(0, -64, 22, 26, 180, 360, 14);
    g.mat(path([[-22, -64, 1], ...d.slice(1, -1), [22, -64, 1], [20, -61, 1], [-20, -61, 1]]), GOLD, 'gold', { hi: 0.9 });
    g.clipTo(path([[-22, -64], ...d]), (h) => {
      for (let i = -3; i <= 3; i++) h.stroke(polyline([[i * 6, -64], [i * 2.4, -90]]), '#a8862a', 0.8);
    });
    // Aufhängering mit Haken
    g.stroke(circle(0, -97, 7), GOLD, 2.4);
    g.stroke(spline([[0, -104], [0, -110], [6, -112], [8, -107]]), '#a8862a', 1.6);
  });
  // riesiges Vorhängeschloss: hängt außen an der Tür über den Käfigrand hinaus
  F.part('padlock', { bone: 'door', z: 8 }, (g) => {
    g.stroke(spline([[22, -34], [22, -46], [30, -50], [38, -46], [38, -34]]), IRON, 3);
    g.mat(rrect(16, -36, 28, 22, 4), IRON, 'metal', { hi: 0.7 });
    g.mat(rrect(18, -33, 24, 4, 1.4), '#8a8f99', 'metal', { lod: 1 });
    g.fill(circle(30, -24, 2.4), '#1a1a1e');
    g.fill(path([[29, -24], [31, -24], [31.6, -18], [28.4, -18]]), '#1a1a1e');
  });
  // Käfigschild (Teamzone) und Wimpel (Teamzone)
  F.part('sign', { bone: 'base', z: 9, team: true }, (g) => {
    g.mat(path([[-14, -12, 1], [14, -12, 1], [12, -4, 1], [-12, -4, 1]]), P.team, 'wood', { line: P.teamDeep });
    g.lod(1, (h) => h.stroke(polyline([[-8, -8], [8, -8]]), P.teamLight, 0.8));
  });
  F.part('flag', { bone: 'flag', z: 1, team: true }, (g) => {
    g.stroke(polyline([[-32, -2], [-32, -72]]), '#4a4a50', 1.2);
    g.mat(path([[-32, -72], [-18, -68], [-24, -65], [-18, -62], [-32, -58]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  // ───────── Evo: Rankenstäbe, Dornenkuppel, grünes Leuchten ─────────
  F.part('evoVines', { bone: 'door', z: 6.5, evo: 'evo' }, (g) => {
    for (const x of [-16, -5, 6, 17]) g.stroke(spline([[x, -14], [x + 3, -30], [x - 2, -46], [x + 2, -64]]), VINE, 1.6);
    for (const [x, y] of [[-13, -30], [-3, -46], [8, -30], [19, -54]]) g.mat(ellipse(x, y, 2.4, 1.2, 30), '#6aca4a', 'cloth');
  });
  F.part('evoThorns', { bone: 'roof', z: 7.5, evo: 'evo' }, (g) => {
    for (const a of [200, 225, 250, 275, 300, 325, 350]) {
      const r = (a * Math.PI) / 180;
      const x = Math.cos(r) * 22;
      const y = -64 + Math.sin(r) * 26;
      g.mat(poly([[x - 1.6, y], [x * 1.18, -64 + Math.sin(r) * 32], [x + 1.6, y]], 0.2), VINE, 'wood');
    }
  });
  F.part('evoGlow', { bone: 'glow', z: 3, evo: 'evo', glow: true }, (g) => g.fill(ellipse(0, -40, 24, 26), '#7cff8a', { op: 0.25 }));
  F.part('burst', { bone: 'root', z: 20, state: 'open' }, (g) => {
    for (const [x, y, r] of [[-30, -60, 30], [30, -50, -30], [-20, -20, 60], [26, -20, 10]]) g.mat(rrect(x - 6, y - 1, 12, 2, 0.6).rot(r, x, y), GOLD, 'gold');
  });
  emblem(F, 'emblem', 'base', 9.5, 0, -8, 2.2);

  F.anim({
    // der Raufbold rüttelt an den Stäben, der Käfig wackelt
    idle: { prog: 'building.idle', p: { flag: 8 }, keys: { crew: { x: [[0, 0], [0.1, -2], [0.2, 2], [0.3, -2], [0.4, 0]] }, door: { r: [[0, 0], [0.1, -1.4], [0.2, 1.4], [0.3, -1], [0.4, 0]] }, roof: { r: [[0, 0], [0.1, -1.6], [0.2, 1.6], [0.3, 0]] } } },
    // Evo: Stäbe öffnen sich und ziehen einen Gegner hinein
    attack: { prog: 'building.idle', hit: 0.5, keys: { door: { sx: [[0, 1], [0.3, 1.3], [0.5, 0.9], [0.7, 1]] }, crew: { y: [[0, 0], [0.5, -4], [0.7, 0]] } } },
    // Käfig klingelt, Gold blättert ab
    hit: { prog: 'generic.hit', keys: { roof: { r: [[0, 0], [0.15, -4], [0.3, 3], [0.5, 0]] } } },
    // landet mit Glockenklang
    spawn: { prog: 'building.spawn' },
    // Käfig platzt auf, der Raufbold springt heraus
    death: { prog: 'still', keys: { show: { open: [[0, 0.8]] }, roof: { y: [[0, 0], [0.4, -30]], r: [[0, 0], [0.4, -40]] }, door: { sx: [[0, 1], [0.3, 1.6]], sy: [[0, 1], [0.3, 0.6]] }, crew: { y: [[0, 0], [0.4, -20], [0.7, 0]] }, alpha: [[0, 1], [0.6, 1], [1, 0]], expr: [[0, 1, 'attack']] } },
  });
}
