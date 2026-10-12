// Bowler – gemütlicher Steintroll mit moosbewachsenem Buckel, Hosenträgern und winzigem Melonenhut; rollt Runenkugeln
// (Brief: docs/briefs/bowler.md). o.hero: Kegelkönig aus weißem Marmor mit Kegelkrone und Mörserwurf (bowler-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, furEdge, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function bowler(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const STONE = H ? '#e6e2d8' : '#9aa48a';
  const STONE_D = H ? '#b8b4aa' : '#748064';
  const MOSS = H ? '#c8c4b8' : P.main;
  const PANTS = H ? '#3a3a48' : P.acc;
  const SHIRT = '#e8dfc8';
  const BALL = '#6a7a8a';
  const RUNE = H ? P.acc : '#7af0ff';

  F.rig('biped', {
    hip: [0, -32],
    torso: [0, -36],
    head: [16, -88],
    hat: [16, -110],
    back: [-14, -84],
    armB: [-24, -86],
    handB: [-26, -40],
    armF: [32, -86],
    handF: [40, -40],
    prop: [40, -40],
    legB: [-12, -32],
    footB: [-14, -8],
    legF: [12, -32],
    footF: [14, -8],
    cape: [0, -90],
  });

  // ───────── Moosbuckel ─────────
  F.part('hump', { bone: 'back', z: 3, zb: 44 }, (g) => {
    // Steintroll-Buckel: ragt hinten über den Kopf hinaus, mit Moosbüscheln als Zacken
    g.mat(blob([[-48, -60], [-48, -98], [-26, -126], [2, -128], [14, -110], [10, -84], [-16, -56]], 0.7), MOSS, 'fur', { hi: 0.4 });
    for (const [x, y, a] of [[-46, -96, -50], [-34, -116, -25], [-14, -127, 0], [6, -124, 25]]) g.mat(path([[x - 4, y + 3], [x + Math.sin((a * Math.PI) / 180) * 9, y - Math.cos((a * Math.PI) / 180) * 9], [x + 4, y + 3]]), MOSS, 'fur', { hi: 0.3 });
    g.lod(1, (h) => furEdge(h, [[-48, -60], [-48, -98], [-26, -126], [2, -128]], 2.6, H ? '#a8a49a' : '#5a7a44', { side: -1 }));
    if (!H) g.lod(1, (h) => {
      for (const [x, y] of [[-24, -96], [-8, -104], [-30, -80]]) h.fill(circle(x, y, 1.6), '#c8e070');
    });
  });
  // ───────── Kurze Beine, Kniebundhose mit Nadelstreifen ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => {
      const l = limb(x, -34, x * 1.1, -12, 11, 10);
      g.mat(l, PANTS, 'cloth');
      g.clipTo(l, (h) => {
        for (let k = -16; k < 16; k += 4) h.stroke(polyline([[x + k, -36], [x * 1.1 + k, -10]]), '#5a5464', 0.5, { lod: 2 });
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(blob([[fx - 12, -12], [fx + 6, -14], [fx + 18, -6], [fx + 18, 0], [fx - 12, 0]], 0.6), STONE, 'stone', { hi: 0.4 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Hinterer Arm ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => g.mat(limb(-24, -88, -26, -44, 11, 10), STONE_D, 'stone'));
  F.part('handB', { bone: 'handB', z: 15, zb: 45 }, (g) => g.mat(blob([[-36, -42], [-26, -48], [-16, -42], [-18, -30], [-32, -28]], 0.7), STONE_D, 'stone'));

  // ───────── Rumpf: kurzärmeliges Hemd, Hosenträger (Teamzone) ─────────
  F.part('torso', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const t = path([[-28, -88], [0, -96], [30, -92], [40, -70], [34, -40], [-28, -40], [-34, -64]]);
    g.mat(t, SHIRT, 'cloth', { hi: 0.4 });
    g.lod(1, (h) => lines(h, [[[10, -90], [12, -44]], [[-14, -80], [-16, -48]]], '#cdbd9a', 0.7, 1));
    for (const y of [-80, -68, -56]) g.mat(circle(16, y, 1.6), '#8a7a5a', 'wood', { lod: 1 });
  });
  F.part('pants', { bone: 'hip', z: 19, zb: 29 }, (g) => g.mat(path([[-30, -44], [34, -44], [36, -26], [-32, -26]]), PANTS, 'cloth'));
  F.part('suspenders', { bone: 'torso', z: 20, zb: 30, team: true }, (g) => {
    g.mat(path([[-14, -92], [-8, -94], [-4, -42], [-10, -42]]), P.team, 'cloth', { line: P.teamDeep });
    g.mat(path([[24, -92], [30, -90], [26, -42], [20, -42]]), P.team, 'cloth', { line: P.teamDeep });
    for (const x of [-7, 23]) g.mat(rrect(x - 3, -46, 6, 5, 1), '#c8ccd2', 'metal', { lod: 1 });
  });

  // ───────── Kopf: breit, Unterbiss mit Hauern, kleine Augen ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[0, -96], [4, -110], [16, -116], [30, -112], [36, -100], [36, -86], [28, -78], [12, -78], [2, -84]], 0.7), STONE, 'stone', { hi: 0.5 });
    g.lod(1, (h) => h.stroke(polyline([[6, -106], [10, -100], [8, -94]]), STONE_D, 0.8));
  });
  faceSet(F, {
    eyes: [[28, -100, 1.8], [21, -100, 1.6]],
    iris: '#3a3a2a',
    lidColor: STONE,
    lid: 0.3,
    look: [0.6, 0],
    brow: { color: STONE_D, w: 2, lift: 0.4 },
    mouth: [27, -86, 7],
    mood: H ? 'grin' : 'neutral',
    attackMouth: 'oh',
  });
  F.part('tusks', { bone: 'head', z: 33.5, view: 'front' }, (g) => {
    for (const x of [23, 32]) g.mat(path([[x - 1.4, -84], [x, -90, 1], [x + 1.4, -84]]), '#f0ece0', 'bone');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(blob([[26, -98], [34, -96], [35, -91], [28, -90]], 0.7), STONE_D, 'stone'));
  if (!H) {
    // winziger Melonenhut (Signature) mit Hutband (Teamzone)
    F.part('bowlerHat', { bone: 'hat', z: 35, zb: 36, sig: true }, (g) => {
      g.mat(path([[8, -112, 1], [26, -116, 1], [24, -114], [10, -110]]), '#1e1c22', 'cloth');
      g.mat(blob([[11, -112], [12, -122], [18, -125], [24, -122], [24, -114]], 0.7), '#1e1c22', 'cloth', { hi: 0.5 });
    });
    F.part('hatBand', { bone: 'hat', z: 35.5, zb: 36.5, team: true }, (g) => g.mat(path([[11, -116], [24, -118], [24, -115], [11, -113]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  } else {
    // Krone aus neun Kegeln (Rang-Merkmal), Kegelband (Teamzone)
    F.part('pinCrown', { bone: 'hat', z: 35, zb: 36, sig: true }, (g) => {
      for (let i = 0; i < 9; i++) {
        const x = 2 + i * 3.6;
        const y = -112 - Math.sin((i / 8) * Math.PI) * 6;
        g.mat(blob([[x - 1.4, y], [x - 1, y - 4], [x - 1.4, y - 7], [x, y - 9], [x + 1.4, y - 7], [x + 1, y - 4], [x + 1.4, y]], 0.6), '#f6f2ea', 'wood', { hi: 0.6 });
      }
    });
    F.part('pinBand', { bone: 'hat', z: 35.5, zb: 36.5, team: true }, (g) => g.mat(path([[0, -110], [34, -112], [34, -107], [0, -105]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 }));
  }

  // ───────── Runenkugel und vorderer Arm ─────────
  F.part('ball', { bone: 'prop', z: 40, zb: 4, state: ['loaded', 'walk', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'death', ...(H ? [] : ['idle'])] }, (g) => {
    g.mat(circle(50, -30, 18), BALL, 'stone', { hi: 0.8 });
    for (const [x, y] of [[45, -38], [52, -39], [48, -32]]) g.fill(circle(x, y, 2.2), '#2a3038');
    g.lod(1, (h) => h.stroke(polyline([[40, -22], [46, -17], [53, -24], [60, -19]]), RUNE, 1.4));
  });
  if (H) {
    F.part('boulder', { bone: 'prop', z: 40.5, zb: 4.5, state: 'ability' }, (g) => g.mat(blob([[28, -50], [36, -66], [52, -70], [62, -56], [56, -42], [38, -40]], 0.7), '#8a8478', 'stone', { hi: 0.6 }));
  }
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    g.mat(limb(32, -88, 38, -66, 11, 10), STONE, 'stone', { hi: 0.4 });
    g.mat(rrect(26, -84, 22, 8, 3).rot(16, 37, -80), SHIRT, 'cloth');
    g.mat(limb(38, -66, 40, -44, 9.5, 9), STONE, 'stone', { hi: 0.4 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 11 }, (g) => g.mat(blob([[30, -42], [40, -48], [52, -42], [50, -30], [36, -28]], 0.7), STONE, 'stone', { hi: 0.4 }));
  emblem(F, 'emblem', 'torso', 23, 4, -64, 2.8, { view: 'front' });

  F.anim({
    // poliert die Kugel am Bauch, rückt den Hut zurecht
    idle: H
      ? { prog: 'still', keys: { armF: { r: [[0, -150], [1, -150]] }, prop: { r: [[0, 150], [1, 150]] }, root: { y: [[0, 0], [0.5, -1], [1, 0]] }, show: { ability: [[0, 1]] } } }
      : { p: { breathe: 0.03, bob: 1, sway: 1, tilt: 2 }, keys: { prop: { x: [[0, 0], [0.2, -10], [0.3, -6], [0.4, -10], [0.5, -6], [0.6, 0]] }, armB: { r: [[0, 0], [0.7, 0], [0.8, -150], [0.9, -150], [1, 0]] } } },
    // schlurfender Gang
    walk: { p: { stride: 12, bob: 3, squash: 0.05, armSwing: 8, lean: 4 }, ev: { step: [0.25, 0.75] } },
    // weit ausholen, tief in die Knie, Kugel rollen lassen, Bein hoch
    attack: { prog: 'atk.throw', hit: 0.55, p: { wind: 60, strike: -40, lean: -6, lunge: 20 }, keys: { root: { sy: [[0, 1], [0.4, 0.9], [0.55, 1]] }, legB: { r: [[0, 0], [0.55, 0], [0.7, 50], [1, 0]] } }, ev: { release: 0.55 } },
    // Hut hüpft hoch
    hit: { p: { knock: 1.4, recoil: 3 }, keys: { hat: { y: [[0, 0], [0.2, -8, 'out'], [0.5, 0, 'in']] } } },
    // landet, die Kugel rollt kurz nach
    spawn: { keys: { prop: { x: [[0, -10], [0.6, -10], [1, 0]] } } },
    // setzt sich schwer hin, der Hut fällt herunter; zerbröselt
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { y: [[0, 0], [0.35, 10, 'in']], sy: [[0, 1], [0.6, 1], [1, 0.4]] }, legF: { r: [[0, 0], [0.35, -70]] }, legB: { r: [[0, 0], [0.35, -60]] }, hat: { x: [[0, 0], [0.3, 0], [0.8, 20]], y: [[0, 0], [0.3, 0], [0.8, 60]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
    ...(H
      ? {
          // Steinwurf: breitbeinig, Felsen über dem Kopf, Wurf im hohen Bogen
          ability: { prog: 'atk.throw', hit: 0.6, p: { wind: -170, strike: -60, lean: 10, lunge: 10 }, keys: { prop: { r: [[0, 150], [0.6, 150], [0.7, 0]] }, show: { ability: [[0, 0.6]] } }, ev: { ability: 0.6 } },
        }
      : {}),
  });
}
