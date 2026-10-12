// Golemit – trotziges Bruchstück des Golems: halbe Säule als Rumpf, abgebrochenes Kapitell mit Voluten als Kopf
// (Brief: docs/briefs/golemite.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, brow, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function golemite(F) {
  const P = F.pal;
  const GRANITE = P.main;
  const CORE = P.acc;
  const GRANITE_D = '#8a645c';
  const GRANITE_L = '#d0a49a';
  const BREAK = '#e2c0b6';
  const MOSS = '#6a8a3a';
  const LIVE = ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability', 'spawnUnit', 'whole'];

  F.rig('biped', {
    hip: [0, -16],
    torso: [0, -18],
    head: [2, -64],
    hat: [2, -86],
    back: [-16, -50],
    armB: [-19, -52],
    handB: [-24, -32],
    armF: [21, -52],
    handF: [28, -32],
    prop: [28, -32],
    legB: [-9, -16],
    footB: [-10, -4],
    legF: [9, -16],
    footF: [10, -4],
    cape: [0, -60],
  });

  const speckle = (h, pts) => {
    for (const [x, y, r] of pts) h.fill(circle(x, y, r), GRANITE_D, { op: 0.55 });
  };
  // Spirale der Volute
  const volute = (g, cx, cy, r, dir) => {
    g.mat(circle(cx, cy, r), GRANITE_L, 'stone', { hi: 0.5 });
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = dir * i * 0.62;
      const rr = r * 0.85 * (1 - i / 24);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    g.stroke(spline(pts), GRANITE_D, 1);
  };

  // ───────── Steinstumpen als Beine ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z, state: LIVE }, (g) => g.mat(rrect(x - 5.6, -18, 11.2, 13, 3), col, 'stone', { hi: 0.4 }));
    F.part(foot, { bone: foot, z: z + 1, state: LIVE }, (g) => g.mat(path([[x - 7, -6, 1], [x + 7, -6, 1], [x + 10, -2], [x + 10, 0, 1], [x - 7.6, 0, 1]]), col, 'stone', { hi: 0.5 }));
  };
  leg('legB', 'footB', -9, 6, GRANITE_D);
  leg('legF', 'footF', 9, 8, GRANITE);

  // ───────── Hinterer Steinarm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42, state: LIVE }, (g) => g.mat(limb(-19, -52, -24, -36, 5.4, 5), GRANITE_D, 'stone'));
  // Armband auch am hinteren Arm (dieselbe Teamzone)
  F.part('armbandB', { bone: 'armB', z: 9.5, zb: 42.5, team: true, state: LIVE }, (g) => g.mat(path([[-27, -47], [-16.6, -48.6], [-15.8, -41.4], [-26.4, -39.6]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 }));
  F.part('handB', { bone: 'handB', z: 10, zb: 43, state: LIVE }, (g) => g.mat(blob([[-30, -36], [-20, -37], [-18, -28], [-24, -24], [-31, -28]], 0.5), GRANITE_D, 'stone', { hi: 0.4 }));

  // ───────── Säulenschaft mit Kannelur und Bruchkante unten ─────────
  F.part('shaft', { bone: 'torso', z: 18, zb: 18, state: LIVE }, (g) => {
    const s = path([[-20, -60, 1], [20, -60, 1], [22, -44], [21, -24], [17, -16, 1], [10, -19, 1], [4, -15, 1], [-3, -19, 1], [-9, -15, 1], [-16, -18, 1], [-21, -24], [-22, -44]]);
    g.mat(s, GRANITE, 'stone', { hi: 0.45 });
    g.clipTo(s, (h) => {
      for (const x of [-14, -6, 2, 10, 17]) h.fill(rrect(x - 1.6, -60, 3.2, 46, 1.6), GRANITE_D, { op: 0.5 });
      h.lod(1, (k) => speckle(k, [[-10, -50, 0.9], [6, -36, 0.8], [-4, -28, 1], [14, -46, 0.7]]));
      h.fill(path([[-22, -22], [-8, -20], [0, -16], [-22, -12]]), BREAK, { op: 0.8 });
    });
    // türkiser Kristallsplitter im Bruch
    g.mat(poly([[-6, -42], [-3, -48], [1, -42], [-2, -37]], 0.3), CORE, 'gem', { hi: 0.8 });
  });
  F.part('crystalGlow', { bone: 'torso', z: 18.5, zb: 18.5, state: LIVE, glow: true, lod: 1 }, (g) => g.fill(circle(-2.4, -42.6, 3.6), CORE, { op: 0.35 }));
  F.part('moss', { bone: 'torso', z: 19, zb: 19, state: LIVE }, (g) => {
    g.mat(blob([[-20, -46], [-14, -50], [-10, -46], [-14, -40], [-20, -38]], 0.7), MOSS, 'fur', { hi: 0.3 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-18, -42], [-13, -46]]) h.fill(circle(x, y, 0.8), '#8aaa4a');
    });
  });
  emblem(F, 'emblem', 'torso', 20, 8, -30, 2.2, { zb: 20, state: LIVE });

  // ───────── Kapitell-Kopf mit Voluten (Signature), abgebrochene Ecke ─────────
  F.part('capital', { bone: 'head', z: 30, zb: 30, sig: true, state: LIVE }, (g) => {
    // Echinus (Wulst) zwischen den Voluten
    g.mat(path([[-20, -62, 1], [24, -62, 1], [28, -70], [24, -76], [-18, -76], [-24, -70]]), GRANITE, 'stone', { hi: 0.4 });
    // Abakus-Platte, hinten abgebrochen: breiter als der Säulenrumpf (T-Silhouette)
    const ab = path([[-18, -77, 1], [-13, -85, 1], [-8, -80, 1], [-3, -87, 1], [37, -87, 1], [37, -77, 1]]);
    g.mat(ab, GRANITE_L, 'stone', { hi: 0.5 });
    g.clipTo(ab, (h) => h.fill(path([[-18, -77], [-13, -85], [-8, -80], [-3, -87], [-5, -77]]), BREAK));
    volute(g, -23, -69, 10, -1);
    volute(g, 31, -69, 10, 1);
    g.lod(1, (h) => lines(h, [[[-12, -64], [18, -64]], [[0, -80], [26, -80]]], GRANITE_D, 0.6, 1));
  });
  F.part('mossTop', { bone: 'head', z: 30.5, zb: 30.5, state: LIVE }, (g) => {
    g.mat(blob([[8, -86], [16, -89], [26, -88], [29, -85], [18, -84.6], [10, -84.6]], 0.6), MOSS, 'fur', { hi: 0.4 });
  });
  F.part('face.idle', { bone: 'head', z: 32, view: 'front', state: LIVE, expr: ['idle', 'attack', 'ability'] }, (g) => {
    for (const [x, r] of [[13, 2.6], [5, 2.3]]) {
      g.fill(ellipse(x, -70, r, r * 0.8), '#2a1e20');
      g.fill(circle(x + 0.6, -70, r * 0.55), CORE);
    }
    brow(g, [[1.6, -74.6], [5, -73.6], [8, -72.6]], 1.2, GRANITE_D);
    brow(g, [[10, -72.6], [13, -73.8], [16.6, -74.8]], 1.2, GRANITE_D);
    g.stroke(spline([[5, -65.2], [9, -66], [13, -65]]), '#2a1e20', 1.1);
  });
  F.part('face.attack', { bone: 'head', z: 32.2, view: 'front', state: LIVE, expr: 'attack' }, (g) => {
    g.fill(path([[5, -66.4], [13, -66.4], [11.6, -64], [6.4, -64]]), '#2a1e20');
    g.fill(rrect(6, -66.4, 6.4, 1, 0.2), WHITE);
  });
  F.part('face.hurt', { bone: 'head', z: 32, view: 'front', state: LIVE, expr: ['hurt', 'stun', 'sleep'] }, (g) => {
    for (const x of [13, 5]) g.stroke(spline([[x - 2, -70.6], [x, -69.4], [x + 2, -70.6]]), '#2a1e20', 1);
    g.fill(ellipse(9, -65.6, 2, 1.4), '#2a1e20');
  });
  F.part('face.death', { bone: 'head', z: 32, view: 'front', state: LIVE, expr: 'death' }, (g) => {
    for (const x of [13, 5]) {
      g.stroke(polyline([[x - 1.6, -71.6], [x + 1.6, -68.4]]), '#2a1e20', 1);
      g.stroke(polyline([[x + 1.6, -71.6], [x - 1.6, -68.4]]), '#2a1e20', 1);
    }
  });

  // ───────── Vorderer Steinarm mit Armband (Teamzone) ─────────
  F.part('armF', { bone: 'armF', z: 33, zb: 6, state: LIVE }, (g) => g.mat(limb(21, -52, 27, -36, 5.8, 5.2), GRANITE, 'stone', { hi: 0.4 }));
  F.part('armband', { bone: 'armF', z: 33.5, zb: 6.5, team: true, state: LIVE }, (g) => g.mat(path([[19, -46.6], [30, -48.6], [30.8, -41.4], [20, -39.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 8, state: LIVE }, (g) => {
    g.mat(blob([[22, -36], [33, -37], [35, -28], [29, -23], [22, -27]], 0.5), GRANITE, 'stone', { hi: 0.5 });
    g.lod(1, (h) => lines(h, [[[30, -33], [34, -32]], [[29, -29], [33, -28]]], GRANITE_D, 0.6, 1));
  });

  // ───────── Brocken (Treffer, Bröseln) und Kiesel (Tod) ─────────
  const chunks = (g, pts) => {
    for (const [x, y, r] of pts) g.mat(poly([[x - r, y], [x - r * 0.3, y - r], [x + r, y - r * 0.5], [x + r * 0.7, y + r * 0.8], [x - r * 0.5, y + r * 0.9]], r * 0.2), GRANITE_L, 'stone', { hi: 0.4 });
  };
  F.part('crumbs', { bone: 'root', z: 50, zb: 50, state: 'crumbs' }, (g) => chunks(g, [[-24, -30, 1.4], [-20, -14, 1.2], [26, -20, 1.2]]));
  F.part('chunks', { bone: 'root', z: 50, zb: 50, state: 'chunks' }, (g) => chunks(g, [[-30, -60, 3], [-26, -80, 2.4], [-36, -40, 2.6], [24, -78, 2]]));
  F.part('rubble', { bone: 'root', z: 16, zb: 16, state: 'rubble' }, (g) => {
    chunks(g, [[-18, -3, 4], [-8, -5, 5], [4, -4, 4.4], [14, -3, 3.6], [22, -2, 2.4], [-2, -10, 3.4], [10, -9, 3]]);
    g.mat(path([[-12, -14, 1], [8, -14, 1], [12, -10], [-14, -10]]), GRANITE_L, 'stone', { hi: 0.5 });
    volute(g, -14, -12, 3.6, -1);
    g.fill(poly([[0, -15], [2, -19], [4, -15], [2, -12]], 0.2), CORE);
  });
  F.part('dust', { bone: 'root', z: 51, zb: 51, state: 'rubble', glow: true }, (g) => {
    for (const [x, y, r] of [[-14, -20, 8], [10, -24, 9], [-2, -36, 7]]) g.fill(circle(x, y, r), '#9af0e0', { op: 0.25 });
  });

  F.anim({
    // bröselt vor sich hin
    idle: { p: { breathe: 0.02, bob: 0.6, sway: 1, tilt: 2 }, keys: { show: { crumbs: [[0.4, 0.7]] }, head: { r: [[0, 0], [0.5, 3], [1, 0]] } } },
    // watschelnd
    walk: { p: { stride: 12, bob: 3, armSwing: 12, lean: 3 }, keys: { torso: { r: [[0, -5], [0.5, 5], [1, -5]] } }, ev: { step: [0.25, 0.75] } },
    // Kopfstoß mit dem Kapitell
    attack: {
      prog: 'still',
      hit: 0.55,
      keys: {
        expr: [[0, 1, 'attack']],
        torso: { r: [[0, 0], [0.4, -12, 'out'], [0.55, 22, 'in'], [0.72, 22], [1, 0, 'io']] },
        head: { r: [[0, 0], [0.4, -8], [0.55, 10], [0.72, 10], [1, 0]] },
        root: { x: [[0, 0], [0.4, -3], [0.55, 6, 'in'], [0.75, 6], [1, 0]] },
        armF: { r: [[0, 0], [0.4, 20], [0.55, -10], [1, 0]] },
        armB: { r: [[0, 0], [0.4, 20], [0.55, -10], [1, 0]] },
      },
      ev: { strike: 0.55 },
    },
    // Brocken springen ab
    hit: { p: { knock: 1.2, recoil: 2 }, keys: { show: { chunks: [[0, 0.7]] } } },
    // rollt aus dem zerfallenden Golem
    spawn: {
      prog: 'still',
      // Rollen um die Körpermitte (0, −40): Versatz = Mitte − Drehung der Mitte
      keys: {
        root: {
          r: [[0, -300], [0.12, -240], [0.24, -180], [0.36, -120], [0.48, -60], [0.6, 0]],
          x: [[0, -60.6], [0.12, -55.4], [0.24, -15.6], [0.36, 24.2], [0.48, 29.4], [0.6, 0]],
          y: [[0, -22], [0.12, -66], [0.24, -88], [0.36, -66], [0.48, -22], [0.6, 0], [0.7, -4], [0.8, 0]],
        },
      },
    },
    // zerfällt in Kiesel (Todesschaden)
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], show: { whole: [[0, 0.25]], rubble: [[0.25, 1.01]], chunks: [[0.2, 0.5]] }, torso: { r: [[0, 0], [0.12, -6], [0.25, 6]] }, alpha: [[0, 1], [0.75, 1], [1, 0]] } },
  });
}
