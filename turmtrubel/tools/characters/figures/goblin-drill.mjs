// Koboldbohrer – Bohrturm aus Kupfer mit Riesenschraube und Kobold-Fahrer; aus der Luke hüpfen Kobolde
// (Brief: docs/briefs/goblin-drill.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob } from '../geo.mjs';
import { eye, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinDrill(F) {
  const P = F.pal;
  const COPPER = P.main;
  const BRASS = P.acc;
  const STEEL = '#a8b0ba';
  const EARTH = '#6b4a32';
  const GOB = '#7fae4a';

  F.rig('building', {
    base: [0, -14],
    roof: [0, -60],
    door: [-14, -40],
    chimney: [0, -10],
    flag: [10, -92],
    glow: [16, -52],
    crew: [-2, -74],
  });

  // ───────── Erdhügel und Riesenschraube (Signature, dreht sich) ─────────
  F.part('mound', { bone: 'base', z: 4 }, (g) => {
    g.mat(blob([[-40, 0], [-30, -4], [-10, -6], [12, -6], [32, -4], [42, 0]], 0.7), EARTH, 'stone', { hi: 0.3 });
    g.lod(1, (h) => {
      for (const [x, y, r] of [[-28, -2, 1.6], [24, -3, 2], [34, -1, 1.4]]) h.fill(circle(x, y, r), '#4a3220');
    });
  });
  F.part('screw', { bone: 'chimney', z: 3, sig: true }, (g) => {
    g.mat(path([[-16, -22, 1], [16, -22, 1], [0, 2, 1]]), STEEL, 'metal', { hi: 0.9 });
    g.lod(1, (h) => {
      for (let i = 0; i < 4; i++) {
        const y = -18 + i * 6;
        const w = 14 - i * 3.4;
        h.stroke(polyline([[-w, y], [w, y + 3]]), '#6a727c', 1);
      }
    });
  });
  F.part('evoScrew', { bone: 'chimney', z: 3.5, evo: 'evo', glow: true }, (g) => {
    for (let i = 0; i < 4; i++) {
      const y = -18 + i * 6;
      const w = 14 - i * 3.4;
      g.stroke(polyline([[-w, y], [w, y + 3]]), '#7cffb0', 1.2);
    }
  });
  // ───────── Kupferturm mit Kabine, Luke, Lampen ─────────
  F.part('tower', { bone: 'base', z: 6 }, (g) => {
    const t = path([[-18, -20, 1], [18, -20, 1], [14, -62, 1], [-14, -62, 1]]);
    g.mat(t, COPPER, 'metal', { hi: 0.8 });
    g.clipTo(t, (h) => {
      h.fill(rrect(-20, -36, 40, 3, 0), '#7a3a1e');
      h.lod(1, (k) => lines(k, [[[-8, -60], [-10, -22]], [[8, -60], [10, -22]]], '#7a3a1e', 0.6, 1));
    });
    g.lod(1, (h) => rivets(h, [[-15, -24], [15, -24], [-12, -58], [12, -58], [-14, -40], [14, -40]], 0.8, '#f0b080'));
    // Kurbel
    g.mat(circle(16, -46, 3), BRASS, 'gold');
    g.stroke(polyline([[16, -46], [22, -50]]), STEEL, 1.2);
  });
  F.part('lamp', { bone: 'glow', z: 7, glow: true }, (g) => {
    g.mat(circle(12, -54, 2.6), '#fff4c8', 'glass');
    g.fill(circle(12, -54, 5), '#ffe08a', { op: 0.3 });
  });
  F.part('hatch', { bone: 'door', z: 8 }, (g) => {
    g.mat(rrect(-12, -50, 12, 14, 2), '#8a4a2a', 'metal', { hi: 0.6 });
    g.mat(rrect(-2.6, -45, 2, 5, 0.8), BRASS, 'gold');
  });
  F.part('hatchOpen', { bone: 'base', z: 7.5, state: ['open', 'spawnUnit'] }, (g) => {
    g.fill(rrect(-12, -50, 12, 14, 2), '#1a120a');
    // hüpfender Kobold
    g.mat(blob([[-11, -42], [-8, -48], [-2, -48], [0, -42], [-4, -38], [-9, -38]], 0.6), GOB, 'skin');
    g.fill(circle(-3.6, -44, 0.9), INK);
    g.mat(path([[-11, -45], [-17, -47, 1], [-11, -42]]), GOB, 'skin');
  });
  // Kabine mit Fahrer (Helm = Teamzone)
  F.part('cabin', { bone: 'roof', z: 10 }, (g) => {
    g.mat(path([[-16, -60, 1], [16, -60, 1], [14, -66, 1], [-14, -66, 1]]), '#8a4a2a', 'metal', { hi: 0.5 });
    g.mat(path([[-14, -66, 1], [14, -66, 1], [10, -78, 1], [-10, -78, 1]]), '#d8f0f8', 'glass', { line: '#6a8a9a' });
  });
  F.part('driver', { bone: 'crew', z: 11 }, (g) => {
    g.mat(blob([[-8, -72], [-6, -80], [2, -82], [7, -78], [7, -71], [-1, -68], [-6, -69]], 0.7), GOB, 'skin', { hi: 0.4 });
    // Brille, Freudenschrei
    for (const x of [0, 5]) {
      g.mat(circle(x, -76, 2), '#c8a046', 'metal');
      g.fill(circle(x, -76, 1.3), '#9ad8f0');
    }
    g.fill(ellipse(3, -71, 2, 1.6), '#5a1c24', { stroke: INK, lw: 0.5 });
    g.mat(path([[-8, -76], [-15, -80, 1], [-8, -73]]), GOB, 'skin');
  });
  F.part('driverHelm', { bone: 'crew', z: 11.5, team: true }, (g) => {
    g.mat(path([[-8, -79, 1], [-6, -85], [2, -87], [8, -83], [8, -79, 1]]), P.team, 'metal', { line: P.teamDeep, hi: 0.6 });
  });
  F.part('evoLamp', { bone: 'crew', z: 12, evo: 'evo', glow: true }, (g) => {
    g.mat(circle(2, -86, 1.6), '#fff4c8', 'glass');
    g.fill(circle(2, -86, 3.6), '#ffe08a', { op: 0.4 });
    g.mat(rrect(8, -74, 7, 5, 0.6).rot(-14, 11, -71), '#f0e6c8', 'cloth');
  });
  // Turmfahne (Teamzone)
  F.part('flag', { bone: 'flag', z: 9, team: true }, (g) => {
    g.stroke(polyline([[10, -78], [10, -100]]), '#4a4a50', 1.2);
    g.mat(path([[10, -100], [24, -96], [18, -93], [24, -90], [10, -88]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('dirt', { bone: 'base', z: 14, state: ['idle', 'spawn'] }, (g) => {
    for (const [x, y, r] of [[-24, -16, 2], [26, -20, 2.4], [-18, -26, 1.4]]) g.fill(circle(x, y, r), '#5a3a22');
  });
  emblem(F, 'emblem', 'base', 15, 0, -30, 2.8);

  F.anim({
    // Schraube dreht, Erdbrocken fliegen
    idle: { prog: 'building.idle', p: { flag: 8, crew: 4 }, keys: { chimney: { sx: [[0, 1], [0.25, -1], [0.5, 1], [0.75, -1], [1, 1]] }, root: { x: [[0, 0], [0.1, 0.6], [0.2, 0], [0.3, -0.6], [0.4, 0]] } } },
    // Luke springt auf, ein Kobold hüpft heraus
    spawnUnit: { prog: 'building.spawnUnit', p: { open: 0 }, keys: { door: { x: [[0, 0], [0.12, -10], [0.7, -10], [1, 0]] } }, ev: { spawnUnit: 0.2 } },
    attack: { prog: 'building.spawnUnit', p: { open: 0 }, hit: 0.3, keys: { door: { x: [[0, 0], [0.12, -10], [0.7, -10], [1, 0]] } } },
    // rattert, Funken
    hit: { prog: 'generic.hit', keys: { root: { x: [[0, 0], [0.1, 1.4], [0.2, -1.4], [0.3, 1], [0.4, 0]] } } },
    // bohrt sich mit Erdfontäne aus dem Boden
    spawn: { prog: 'still', keys: { root: { y: [[0, 40], [0.7, 0, 'out']] }, chimney: { sx: [[0, 1], [0.2, -1], [0.4, 1], [0.6, -1], [0.8, 1]] } } },
    // Schraube bricht, der Turm kippt
    death: { prog: 'building.death', keys: { base: { r: [[0, 0], [0.6, 20]] } } },
  });
}
