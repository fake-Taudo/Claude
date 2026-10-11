// Boss Bandit – selbstsichere Anführerin der Fuchsbande im altrosa Samtmantel mit Silberfuchs-Kragen, Beutesack und
// zwei Brecheisen (Brief: docs/briefs/boss-bandit.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, brow, furEdge, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function bossBandit(F) {
  const P = F.pal;
  const VELVET = P.main;
  const GOLD = P.acc;
  const FOX = '#e8e8ec';
  const SACK = '#b89a6a';
  const BAR = '#5a5f6b';
  const SKIN = '#f0c8a8';
  const HAIR = '#2a1a22';
  const VELVET_D = '#74465a';

  F.rig('biped', {
    hip: [0, -40],
    torso: [0, -43],
    head: [4, -70],
    hat: [4, -88],
    back: [-8, -64],
    armB: [-12, -66],
    handB: [-12, -46],
    propB: [-12, -46],
    armF: [13, -66],
    handF: [20, -48],
    prop: [20, -48],
    legB: [-5, -40],
    footB: [-6, -6],
    legF: [5, -40],
    footF: [6, -6],
    cape: [-4, -66],
    coin: [-14, -60],
  }, { coin: 'back' });

  // Brecheisen mit gespaltenem Ende und Lederwicklung; (x, y) = Griff, nach oben vorn
  const crowbar = (g, x, y, dx, dy) => {
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const nx = -uy;
    const ny = ux;
    const at = (s, t) => [x + ux * s + nx * t, y + uy * s + ny * t];
    g.mat(path([[...at(-4, -1.4), 1], [...at(L, -1.4), 1], [...at(L + 2, -4), 1], [...at(L + 5, -3.4), 1], [...at(L + 2.4, -1), 1], [...at(L + 2.4, 1), 1], [...at(L + 5, 3.4), 1], [...at(L + 2, 4), 1], [...at(L, 1.4), 1], [...at(-4, 1.4), 1]]), BAR, 'metal', { hi: 0.8 });
    g.mat(path([[...at(-3, -1.8), 1], [...at(4, -1.8), 1], [...at(4, 1.8), 1], [...at(-3, 1.8), 1]]), '#6a4a2e', 'leather');
  };

  // ───────── Beutesack über der Schulter (Signature) ─────────
  F.part('sack', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
    g.mat(blob([[-26, -66], [-20, -78], [-8, -80], [-2, -72], [-6, -60], [-16, -54], [-24, -56]], 0.7), SACK, 'cloth', { hi: 0.4 });
    g.mat(path([[-4, -76], [2, -80, 1], [4, -74], [-2, -71]]), '#8a6a3a', 'cloth');
    g.lod(1, (h) => {
      lines(h, [[[-20, -74], [-14, -66]], [[-12, -76], [-10, -64]]], '#8a7048', 0.6, 1);
      // Loch mit Münzen
      h.fill(ellipse(-18, -58, 2.4, 1.6), '#4a3418');
      h.fill(circle(-18, -58.4, 1.1), GOLD);
    });
  });
  F.part('coins', { bone: 'coin', z: 46.5, zb: 46.5, state: ['walk', 'hit', 'idle'] }, (g) => {
    for (const [x, y] of [[-17, -54], [-15.6, -50]]) g.mat(ellipse(x, y, 1.4, 1), GOLD, 'gold', { hi: 0.9 });
  });
  F.part('coinRain', { bone: 'root', z: 50, state: 'burst' }, (g) => {
    for (const [x, y] of [[-20, -30], [-8, -12], [6, -24], [14, -8], [-26, -6], [0, -40], [20, -30]]) g.mat(ellipse(x, y, 2, 1.4), GOLD, 'gold', { hi: 0.9 });
  });
  // Mantel mit Futter (Teamzone)
  F.part('coatBack', { bone: 'cape', z: 4, zb: 40 }, (g) => g.mat(path([[-12, -66], [4, -66], [6, -40], [8, -18], [-6, -20], [-16, -18], [-14, -40]]), VELVET_D, 'cloth', { hi: 0.3 }));
  F.part('lining', { bone: 'cape', z: 4.5, zb: 40.5, team: true }, (g) => g.mat(path([[-14, -40], [-8, -42], [-6, -20], [-16, -18]]), P.team, 'cloth', { line: P.teamDeep }));

  // ───────── Beine: Reiterhose, hohe Stiefel ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -40, x * 1.1, -14, 4.6, 4), '#e8d8c0', 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.15;
      g.mat(path([[fx - 5, -26], [fx + 5.6, -27.6], [fx + 4.6, -6], [fx + 10.6, -3], [fx + 10.6, 0, 1], [fx - 5.6, 0, 1]]), '#3a2228', 'leather', { hi: 0.6 });
      g.mat(rrect(fx - 5.4, -28, 11.4, 3, 1), '#5a3a3a', 'leather', { lod: 1 });
    });
  };
  leg('legB', 'footB', -5, 6);
  leg('legF', 'footF', 5, 8);

  // ───────── Hinterer Arm mit Brecheisen ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => g.mat(limb(-12, -66, -12, -48, 4.6, 4), VELVET_D, 'cloth'));
  F.part('barB', { bone: 'propB', z: 8.5, zb: 43 }, (g) => crowbar(g, -12, -46, 8, -20));
  F.part('handB', { bone: 'handB', z: 10, zb: 43.5 }, (g) => g.mat(circle(-12, -46, 3), '#3a2228', 'leather'));

  // ───────── Samtmantel, Brokatweste, Rauchgranaten am Gürtel ─────────
  F.part('coat', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const c = path([[-14, -68], [-4, -71], [10, -71], [16, -68], [13, -54], [11, -40], [14, -24], [6, -22], [3, -40], [-3, -40], [-6, -22], [-15, -24], [-11, -40], [-12, -54]]);
    g.mat(c, VELVET, 'cloth', { hi: 0.4 });
  });
  F.part('vest', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    const v = path([[-3, -66], [8, -66], [9, -50], [6, -42], [0, -42], [-3, -50]]);
    g.mat(v, '#4a2a3a', 'cloth', { hi: 0.4 });
    g.clipTo(v, (h) => {
      for (const [x, y] of [[0, -60], [5, -56], [1, -50], [6, -46]]) h.stroke(spline([[x - 1.6, y], [x, y - 1.6], [x + 1.6, y], [x, y + 1.6], [x - 1.6, y]]), GOLD, 0.4, { lod: 2 });
    });
    for (const y of [-62, -56, -50]) g.mat(circle(5, y, 0.9), GOLD, 'gold', { lod: 1 });
  });
  F.part('belt', { bone: 'hip', z: 22, zb: 22 }, (g) => {
    g.mat(rrect(-12, -45, 25, 4, 1.2), '#3a2228', 'leather');
    g.mat(rrect(1, -46, 5.6, 5.6, 1), GOLD, 'gold');
    // Rauchgranaten
    for (const x of [-9, -4]) {
      g.mat(circle(x, -38.6, 3), '#4a4a52', 'metal', { hi: 0.7 });
      g.stroke(spline([[x, -41.6], [x + 1, -43.6], [x + 2.4, -43]]), '#c8b890', 0.6);
    }
  });
  // Halstuch (Teamzone)
  F.part('scarf', { bone: 'torso', z: 23, zb: 23, team: true }, (g) => {
    g.mat(path([[-4, -70], [11, -70], [9, -64], [4, -60, 1], [1, -65], [-4, -66]]), P.team, 'cloth', { line: P.teamDeep });
  });
  // riesiger Silberfuchs-Kragen
  F.part('foxCollar', { bone: 'torso', z: 26, zb: 38 }, (g) => {
    const c = blob([[-18, -64], [-14, -74], [-2, -76], [10, -76], [20, -72], [18, -64], [8, -66], [-4, -66], [-14, -60]], 0.7);
    g.mat(c, FOX, 'fur', { hi: 0.5 });
    g.lod(1, (h) => furEdge(h, [[-14, -60], [-18, -64], [-14, -74]], 2.2, '#c8c8d0'));
    g.mat(path([[16, -74], [22, -73, 1], [18, -70]]), '#2a2a32', 'fur', { lod: 1 });
  });

  // ───────── Kopf: selbstsicheres Lächeln, hochgezogene Braue, Schönheitsfleck, Federhut ─────────
  F.part('hairBack', { bone: 'head', z: 28, zb: 34 }, (g) => g.mat(path([[-6, -80], [-10, -68], [-8, -60], [-2, -64], [0, -76]]), HAIR, 'hair', { hi: 0.4 }));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => g.mat(path([[-4, -82], [4, -85], [12.6, -82], [14.4, -74], [13, -68], [8, -64.6], [1, -65.4], [-4, -70]]), SKIN, 'skin'));
  faceSet(F, {
    eyes: [[10.6, -76.4, 2], [4.4, -76.4, 1.8]],
    iris: '#6a3a4a',
    lidColor: SKIN,
    lid: 0.45,
    look: [0.7, 0.1],
    brow: false,
    mouth: [9, -69, 4],
    mood: 'smirk',
    attackMouth: 'grin',
    idle: (g) => {
      brow(g, [[8.6, -80.6], [10.6, -82.4], [12.8, -81.6]], 0.9, HAIR);
      brow(g, [[2.4, -79.6], [4.4, -80], [6, -79.6]], 0.8, HAIR);
    },
  });
  F.part('beautyMark', { bone: 'head', z: 32.8, view: 'front' }, (g) => g.fill(circle(12.6, -71, 0.6), '#3a2a2a'));
  F.part('lips', { bone: 'head', z: 32.6, view: 'front', expr: ['idle', 'sleep'] }, (g) => g.stroke(spline([[7, -69.2], [9, -68.8], [11.2, -70]]), '#b83a5a', 1));
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(path([[10.4, -76], [13.4, -72, 1], [10.6, -71.6]]), '#e0b090', 'skin', { line: '#a87860', lw: 0.5 }));
  F.part('hairFront', { bone: 'head', z: 34, view: 'front' }, (g) => g.mat(path([[-5, -76], [-4, -83], [3, -86], [11, -85.4], [14, -80], [8, -82], [3, -80], [-2, -78]]), HAIR, 'hair', { hi: 0.4 }));
  F.part('headBack', { bone: 'head', z: 33.5, view: 'back' }, (g) => g.mat(path([[-5, -84], [13, -84], [14, -72], [8, -64], [0, -65], [-5, -72]]), HAIR, 'hair'));
  F.part('hat', { bone: 'hat', z: 36, zb: 36 }, (g) => {
    g.mat(path([[-12, -80, 1], [-6, -84], [4, -85], [16, -84], [22, -80, 1], [12, -81.4], [4, -81.6], [-4, -81.4]]), '#3a2228', 'cloth', { hi: 0.3 });
    g.mat(path([[-3, -83], [-1, -91], [6, -94], [12, -91], [13, -83]]), '#3a2228', 'cloth', { hi: 0.4 });
    g.mat(rrect(-3, -85.6, 16, 2.4, 0.8), GOLD, 'gold', { lod: 1 });
  });
  F.part('feather', { bone: 'hat', z: 35.6, zb: 36.6 }, (g) => {
    g.mat(path([[0, -88], [-8, -98], [-16, -100, 1], [-8, -94], [-2, -86]]), '#e8d8e0', 'cloth', { hi: 0.5 });
    g.lod(1, (h) => lines(h, [[[-4, -92], [-7, -91]], [[-8, -95], [-11, -95]]], '#b8a8b0', 0.5, 1));
  });

  // ───────── Vorderes Brecheisen und Arm ─────────
  F.part('barF', { bone: 'prop', z: 38, zb: 4 }, (g) => crowbar(g, 20, -48, 10, -18));
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.mat(limb(13, -66, 19, -50, 4.6, 4), VELVET, 'cloth'));
  F.part('cuffF', { bone: 'armF', z: 29.5, zb: 6.5 }, (g) => g.mat(ellipse(18.4, -52, 4, 3.2, 20), FOX, 'fur'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(20, -48, 3), '#3a2228', 'leather'));
  F.part('grenade', { bone: 'handF', z: 42, state: 'ability' }, (g) => {
    g.mat(circle(24, -46, 3), '#4a4a52', 'metal', { hi: 0.7 });
    g.fill(circle(26, -49, 1), '#ffb03a');
  });
  F.part('smoke', { bone: 'root', z: 52, state: 'smoke' }, (g) => {
    g.fill(blob([[-20, -10], [-14, -30], [0, -40], [16, -32], [24, -12], [10, 0], [-12, 0]], 0.8), '#c8c4d0', { op: 0.8 });
    for (const [x, y, r] of [[-10, -36, 8], [8, -40, 9], [20, -24, 7]]) g.fill(circle(x, y, r), '#d8d4e0', { op: 0.7 });
  });
  emblem(F, 'emblem', 'torso', 25, -8, -54, 2.3, { zb: 25 });

  F.anim({
    // wirft eine Münze hoch
    idle: { p: { breathe: 0.02, bob: 0.5, sway: 1, tilt: 2 }, keys: { armF: { r: [[0, 0], [0.3, 0], [0.4, -40], [0.75, -40], [0.85, 0]] }, prop: { r: [[0, 0], [0.3, 0], [0.4, 30], [0.75, 30], [0.85, 0]] }, coin: { y: [[0, 0], [0.4, 0], [0.55, -30, 'out'], [0.7, 0, 'in']], x: [[0, 0], [0.4, 30], [0.7, 32], [0.71, 0]] } } },
    // stolzierender Gang, der Sack klimpert
    walk: { p: { stride: 22, bob: 1.6, armSwing: 10, lean: -1 }, keys: { back: { r: [[0, -3], [0.5, 3], [1, -3]] } } },
    // Doppelschlag mit beiden Brecheisen
    attack: { prog: 'atk.swing', hit: 0.45, p: { wind: -150, strike: -30, over: 12, cock: -20, snap: 30, lean: 8, lunge: 12 }, keys: { armB: { r: [[0, 0], [0.45, 0], [0.6, -130], [0.75, -20], [1, 0]] }, layer: [[0.08, 0.42, 'barF', 27, 4], [0.08, 0.42, 'armF', 26.5, 6], [0.08, 0.42, 'cuffF', 26.8, 6.5], [0.08, 0.42, 'handF', 27.5, 7]] }, ev: { strike: [0.45, 0.75] } },
    // Münzen fallen aus dem Sack
    hit: { p: { knock: 1.8, recoil: 4 }, keys: { coin: { y: [[0, 0], [1, 20]] } } },
    // landet und schultert den Sack
    spawn: { keys: { back: { y: [[0, 8], [0.6, 8], [0.85, -2], [1, 0]] } } },
    // Sack platzt, Münzen regnen
    death: { p: { dir: -1, angle: 75 }, keys: { show: { burst: [[0.35, 1.01]] } } },
    // Fluchtgranate: Rauchgranate vor die Füße, Sprung zurück
    ability: { prog: 'atk.throw', hit: 0.4, p: { wind: -120, strike: 20, lean: 6 }, keys: { show: { smoke: [[0.45, 1.01]] }, root: { x: [[0, 0], [0.45, 0], [0.8, -18, 'out']], y: [[0, 0], [0.5, 0], [0.62, -10], [0.8, 0]] } }, ev: { ability: 0.45 } },
  });
}
