// Koboldhütte – schiefe Flickwerk-Hütte aus Brettern und Tüchern mit krummem Kürbis-Schornstein (Brief: docs/briefs/goblin-hut.md)
import { ellipse, circle, rrect, poly, path, polyline, spline, blob } from '../geo.mjs';
import { furEdge, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinHut(F) {
  const P = F.pal;
  const PLANK = P.main;
  const PUMPKIN = P.acc;
  const CLOTH = '#c8b07a';
  const STRAW = '#d8c070';
  const PLANK_D = '#7a5a34';

  F.rig('building', {
    base: [0, -6],
    roof: [0, -56],
    door: [-2, -46],
    chimney: [16, -86],
    flag: [-30, -84],
    glow: [16, -96],
    crew: [30, -20],
  });

  // ───────── Bretterwände, schief, mit Stoffflicken ─────────
  F.part('walls', { bone: 'base', z: 5 }, (g) => {
    const w = path([[-38, -2, 1], [-36, -58, 1], [34, -62, 1], [38, -2, 1]]);
    g.mat(w, PLANK, 'wood', { hi: 0.3 });
    g.clipTo(w, (h) => {
      h.lod(1, (k) => {
        for (let x = -36; x < 40; x += 7) k.stroke(polyline([[x, -64], [x + 2, 0]]), PLANK_D, 0.7);
      });
      // Flicken
      h.fill(path([[18, -46], [30, -48], [31, -36], [19, -34]]), CLOTH);
      h.lod(2, (k) => stitches(k, [[18, -46], [30, -48], [31, -36], [19, -34], [18, -46]], '#6a5030'));
      h.fill(path([[-32, -26], [-22, -27], [-21, -16], [-31, -15]]), '#8a6aa8', { lod: 1 });
    });
    g.lod(1, (h) => {
      for (const [x, y] of [[-34, -50], [32, -54], [-34, -10], [34, -10]]) h.fill(circle(x, y, 0.8), '#3a3a40');
    });
  });
  // Speere an der Wand
  F.part('spears', { bone: 'crew', z: 6 }, (g) => {
    for (const x of [40, 45]) {
      g.mat(path([[x - 0.8, 0, 1], [x + 0.8, 0, 1], [x - 5, -50, 1], [x - 6.6, -50, 1]]), '#8a6a44', 'wood');
      g.mat(path([[x - 7, -50], [x - 6.4, -58, 1], [x - 4.6, -50]]), '#c8ccd2', 'metal');
    }
  });
  // ───────── Tür mit Vorhang (Teamzone) ─────────
  F.part('doorway', { bone: 'base', z: 7 }, (g) => g.fill(path([[-12, -2, 1], [-11, -40], [-2, -46], [8, -40], [9, -2, 1]]), '#140e08'));
  F.part('curtain', { bone: 'door', z: 8, team: true }, (g) => {
    const c = path([[-11, -40], [-2, -46], [8, -40], [8, -6], [4, -2], [0, -6], [-4, -2], [-8, -6], [-11, -4]]);
    g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-6, -40], [-5, -6]], [[3, -42], [2, -6]]], P.teamShade, 0.7, 1));
  });
  // ───────── Strohdach, hängend, mit Löchern ─────────
  F.part('roof', { bone: 'roof', z: 10 }, (g) => {
    const r = path([[-46, -50], [-30, -74], [-4, -86], [26, -82], [46, -58], [40, -54], [20, -60], [-10, -58], [-38, -46]]);
    g.mat(r, STRAW, 'fur', { hi: 0.4 });
    g.lod(1, (h) => furEdge(h, [[-38, -46], [-10, -58], [20, -60], [40, -54], [46, -58]], 3.2, '#b8a050', { side: 1 }));
    g.clipTo(r, (h) => {
      h.lod(1, (k) => lines(k, [[[-30, -66], [-4, -76], [24, -72]], [[-20, -58], [0, -66], [30, -64]]], '#b8a050', 0.7, 1));
      h.fill(ellipse(-16, -70, 3, 2), '#4a3a1a', { lod: 1 });
    });
  });
  // Dachfahne (Teamzone)
  F.part('flag', { bone: 'flag', z: 11, team: true }, (g) => {
    g.stroke(polyline([[-30, -66], [-30, -96]]), '#6a4a2e', 1.4);
    g.mat(path([[-30, -96], [-14, -92], [-20, -88], [-14, -84], [-30, -82]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  // ───────── Kürbis-Schornstein (Signature) mit geschnitztem Grinsen ─────────
  F.part('pumpkin', { bone: 'chimney', z: 12, sig: true }, (g) => {
    g.mat(blob([[4, -82], [8, -90], [16, -92], [24, -90], [28, -82], [24, -76], [16, -74], [8, -76]], 0.7), PUMPKIN, 'cloth', { hi: 0.6 });
    g.lod(1, (h) => lines(h, [[[12, -91], [11, -83], [12, -75]], [[20, -91], [21, -83], [20, -75]]], '#b8581a', 0.7, 1));
    g.mat(path([[15, -92], [14, -97, 1], [18, -96], [17, -92]]), '#5a7a2a', 'wood');
    // Gesicht
    g.fill(poly([[10, -85], [13, -88], [14, -84]], 0.2), '#3a1a08');
    g.fill(poly([[18, -84], [19, -88], [22, -85]], 0.2), '#3a1a08');
    g.fill(path([[9, -81], [12, -79], [14, -81], [16, -79], [18, -81], [20, -79], [23, -81], [20, -77], [12, -77]]), '#3a1a08');
  });
  F.part('pumpkinGlow', { bone: 'glow', z: 12.5, glow: true, state: ['open', 'spawnUnit', 'idle'] }, (g) => {
    g.fill(poly([[10.6, -85.4], [12.8, -87.4], [13.4, -84.6]], 0.2), '#ffb03a');
    g.fill(poly([[18.6, -84.6], [19.2, -87.4], [21.4, -85.4]], 0.2), '#ffb03a');
  });
  F.part('smoke', { bone: 'chimney', z: 9 }, (g) => {
    for (const [x, y, r] of [[16, -98, 3.4], [20, -105, 4.4], [15, -112, 3.6]]) g.fill(circle(x, y, r), '#c8c4bc', { op: 0.6 });
  });
  emblem(F, 'emblem', 'base', 16, 26, -16, 2.8);

  F.anim({
    idle: { prog: 'building.idle', p: { flag: 10, door: 2 }, keys: { chimney: { r: [[0, -3], [0.5, 3], [1, -3]] } } },
    // Vorhang fliegt auf, ein Speerkobold springt heraus
    spawnUnit: { prog: 'building.spawnUnit', p: { open: 0 }, keys: { door: { sy: [[0, 1], [0.12, 0.2, 'out'], [0.6, 0.2], [0.9, 1]] } }, ev: { spawnUnit: 0.2 } },
    attack: { prog: 'building.spawnUnit', p: { open: 0 }, hit: 0.3, keys: { door: { sy: [[0, 1], [0.12, 0.2, 'out'], [0.6, 0.2], [0.9, 1]] } } },
    // Bretter klappern
    hit: { prog: 'generic.hit', keys: { roof: { r: [[0, 0], [0.2, -3], [0.4, 2], [0.6, 0]] } } },
    // fällt zusammengeklappt herunter und richtet sich auf
    spawn: { prog: 'building.spawn', keys: { roof: { r: [[0, -12], [0.6, 4], [0.8, 0]] } } },
    // bricht zusammen, der Kürbis rollt
    death: { prog: 'building.death', keys: { chimney: { x: [[0, 0], [1, 22]], y: [[0, 0], [1, 60]], r: [[0, 0], [1, 180]] } } },
  });
}
