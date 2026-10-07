// Turmkönig – rundlicher, gemütlicher Monarch mit Turmkrone, Hermelinmantel und Zepter; schläft mit Zipfelmütze
// (Brief: docs/briefs/tower-king.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, eyeClosed, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function towerKing(F) {
  const P = F.pal;
  const VELVET = P.main;
  const GOLD = P.acc;
  const ERMINE = '#f5f1e8';
  const BEARD = '#e8e2d6';
  const SKIN = '#f2c4a0';
  const VELVET_D = '#5e2c6a';

  F.rig('robe', {
    hip: [0, -26],
    skirt: [0, -26],
    torso: [0, -28],
    head: [3, -50],
    hat: [3, -66],
    armB: [-12, -44],
    handB: [-12, -32],
    armF: [13, -44],
    handF: [16, -33],
    prop: [16, -33],
    cape: [-2, -48],
  });

  // ───────── Hermelinmantel (Saum = Teamzone) ─────────
  F.part('mantle', { bone: 'cape', z: 3, zb: 46 }, (g) => {
    const m = path([[-12, -48], [10, -48], [18, -30], [24, -6], [12, -2], [-6, -2], [-24, -4], [-22, -26]]);
    g.mat(m, VELVET_D, 'cloth', { hi: 0.4 });
  });
  F.part('mantleHem', { bone: 'cape', z: 3.5, zb: 46.5, team: true }, (g) => {
    g.mat(path([[-24, -8], [-6, -6], [12, -6], [24, -10], [24, -4], [12, -1], [-6, -1], [-24, -2]]), P.team, 'fur', { line: P.teamDeep });
  });

  // ───────── Pantoffeln, Brokatwams über dem Bauch, Goldgürtel ─────────
  F.part('slippers', { bone: 'skirt', z: 8 }, (g) => {
    for (const x of [-7, 7]) g.mat(path([[x - 4, -4], [x + 4, -4], [x + 8, -1], [x + 9, -3, 1], [x + 8.6, 0, 1], [x - 4.6, 0, 1]]), '#c84a5a', 'cloth');
  });
  F.part('body', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const b = blob([[-12, -44], [0, -47], [13, -44], [17, -30], [14, -12], [0, -6], [-14, -12], [-17, -30]], 0.5);
    g.mat(b, VELVET, 'cloth', { hi: 0.4 });
    g.clipTo(b, (h) => {
      for (const [x, y] of [[-8, -36], [6, -38], [-4, -22], [9, -20], [0, -12]]) h.stroke(spline([[x - 3, y], [x - 1, y - 2.4], [x + 1, y], [x + 3, y - 2.4]]), '#b06ab8', 0.6, { lod: 1 });
    });
    g.mat(rrect(-16, -27, 32, 4.4, 1.6), GOLD, 'gold');
  });
  F.part('buckle', { bone: 'torso', z: 21, view: 'front' }, (g) => {
    g.mat(rrect(-1, -29, 9, 8, 1.4), GOLD, 'gold', { hi: 0.9 });
    g.fill(path([[1, -23], [1, -27], [2.4, -27], [2.4, -26], [3.6, -26], [3.6, -27], [5, -27], [5, -26], [6, -26], [6, -23]]), '#8a6a14', { lod: 1 });
  });
  F.part('collar', { bone: 'torso', z: 24, zb: 24 }, (g) => {
    g.mat(path([[-14, -48], [-6, -44], [2, -43], [10, -44], [16, -48], [14, -42], [2, -39], [-12, -42]]), ERMINE, 'fur', { hi: 0.3 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-8, -44], [0, -42], [8, -43]]) h.fill(path([[x, y - 1.2], [x + 1, y + 1.4], [x - 1, y + 1.4]]), '#1a1a1a');
    });
  });

  // ───────── Arme ─────────
  F.part('armB', { bone: 'armB', z: 22, zb: 42 }, (g) => {
    g.mat(limb(-12, -44, -13, -33, 5.4, 5), VELVET_D, 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 23, zb: 43 }, (g) => g.mat(circle(-11, -31, 3), '#e0b08c', 'skin'));

  // ───────── Kopf: rote Bäckchen, Rauschebart, buschige Brauen ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-6, -62], [3, -66], [12, -62], [14, -54], [12, -47], [4, -44], [-4, -46], [-7, -54]], 0.5), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[10, -56.4, 2.1], [3.2, -56.4, 1.9]],
    iris: '#4a3a6a',
    lidColor: SKIN,
    lid: 0.25,
    brow: false,
    mouth: [7.6, -49.6, 4],
    mood: 'smile',
    attackMouth: 'shout',
    replace: {
      // im Schlaf: offener Mund mit Blubberblase
      sleep: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.1, { lw: 0.8 });
        eyeClosed(g, c.E2[0], c.E2[1], 1.9, { lw: 0.8 });
        g.fill(ellipse(7.6, -49.4, 1.6, 1.3), '#4a1c24', { stroke: INK, lw: 0.5 });
        g.stroke(circle(10.6, -48, 2.6), '#c8e8ff', 0.6, { op: 0.8 });
      },
      // getroffen bläst er die Backen auf
      hurt: (g, c) => {
        eyeClosed(g, c.E1[0], c.E1[1], 2.1, { up: true, lw: 0.9 });
        eyeClosed(g, c.E2[0], c.E2[1], 1.9, { up: true, lw: 0.9 });
        g.fill(ellipse(12.6, -51, 3, 2.6), '#f4a080', { op: 0.8 });
        g.fill(ellipse(1, -51, 2.6, 2.2), '#f4a080', { op: 0.7 });
        g.fill(ellipse(7.6, -49.4, 1, 0.8), '#4a1c24');
      },
    },
  });
  F.part('cheeks', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(12, -52, 2.4, 1.6), '#f08a7a', { op: 0.6 });
    g.fill(ellipse(1.2, -52, 2, 1.4), '#f08a7a', { op: 0.5 });
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(circle(7.4, -53, 2.2), '#e89a7a', 'skin', { line: '#b07a5c', lw: 0.5 }));
  F.part('brows', { bone: 'head', z: 33.5, view: 'front' }, (g) => {
    g.mat(path([[7, -59.6], [10, -61.6], [14, -60], [14.6, -57.6, 1], [11, -59], [7.6, -58.4]]), BEARD, 'hair');
    g.mat(path([[0.4, -59.6], [3, -60.8], [5.6, -59.6], [5, -58.4], [2, -58.6], [-0.4, -57.6, 1]]), BEARD, 'hair');
  });
  F.part('beard', { bone: 'head', z: 34, view: 'front' }, (g) => {
    g.mat(blob([[-2, -52], [3, -49], [8, -48.4], [13, -50], [15, -46], [12, -38], [6, -34], [0, -37], [-3, -44]], 0.5), BEARD, 'hair', { hi: 0.4 });
    g.mat(path([[3.6, -51.6], [7.6, -50.2], [11.6, -51.6], [12, -49.6], [7.6, -48.6], [3.2, -49.6]]), BEARD, 'hair');
    lines(g, [[[4, -44], [5, -39]], [[9, -45], [9, -39]]], '#c8c0b0', 0.6, 1);
  });
  F.part('headBack', { bone: 'head', z: 33, view: 'back' }, (g) => {
    g.mat(blob([[-6, -60], [13, -60], [14, -50], [6, -44], [-3, -45], [-7, -52]], 0.5), BEARD, 'hair');
  });
  // Turmkrone (Signature): Mini-Turm mit vier Zinnen und Juwelenfenster
  F.part('crown', { bone: 'hat', z: 36, zb: 36, sig: true, state: ['idle', 'attack', 'hit', 'spawn', 'death', 'stun', 'walk', 'ability', 'charge'] }, (g) => {
    const c = path([[-4, -62, 1], [-4, -72, 1], [-1.6, -72, 1], [-1.6, -70, 1], [1, -70, 1], [1, -72, 1], [5, -72, 1], [5, -70, 1], [7.6, -70, 1], [7.6, -72, 1], [10, -72, 1], [10, -62, 1]]);
    g.mat(c, GOLD, 'gold', { hi: 0.9 });
    g.fill(rrect(1.6, -68, 2.8, 4, 1.2), '#5a3a14');
    g.mat(circle(3, -66.4, 1.1), '#e84a5a', 'gem');
    g.lod(1, (h) => h.stroke(polyline([[-4, -64], [10, -64]]), '#a8842a', 0.5));
  });
  // Zipfelmütze nur im Schlaf
  F.part('nightcap', { bone: 'hat', z: 36.5, zb: 36.5, state: 'sleep' }, (g) => {
    g.mat(path([[-6, -61], [-4, -68], [2, -73], [10, -74], [18, -70], [22, -64, 1], [14, -66], [10, -62]]), '#6a7ac8', 'cloth');
    g.mat(circle(22.6, -63, 2.6), ERMINE, 'fur');
    g.lod(1, (h) => {
      for (const [x, y] of [[2, -68], [9, -70], [14, -67]]) h.fill(circle(x, y, 0.8), '#f0e8a0');
    });
  });
  F.part('zzz', { bone: 'hat', z: 37, state: 'sleep', lod: 1 }, (g) => {
    g.stroke(polyline([[16, -78], [20, -78], [16, -74], [20, -74]]), '#ffffff', 0.9);
    g.stroke(polyline([[22, -86], [27, -86], [22, -81], [27, -81]]), '#ffffff', 1.1);
  });

  // ───────── Zepter mit Turmspitze (Stein = Teamzone) ─────────
  F.part('scepter', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(rrect(15, -50, 2.6, 26, 1), GOLD, 'gold');
    g.mat(path([[13, -50, 1], [13, -56, 1], [14.4, -56, 1], [14.4, -54.4, 1], [15.6, -54.4, 1], [15.6, -56, 1], [17, -56, 1], [17, -54.4, 1], [18.2, -54.4, 1], [18.2, -56, 1], [19.6, -56, 1], [19.6, -50, 1]]), GOLD, 'gold');
  });
  F.part('scepterStone', { bone: 'prop', z: 38.5, zb: 4.5, team: true }, (g) => {
    g.mat(circle(16.3, -52.6, 1.6), P.team, 'gem', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => g.mat(limb(13, -44, 16, -35, 5.4, 5), VELVET, 'cloth'));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(16.4, -32.6, 3), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 22, -8, -34, 2.4, { zb: 22 });

  F.anim({
    // wach: Hände auf dem Bauch, wippt auf den Fersen
    idle: { p: { breathe: 0.03, bob: 1, sway: 1.5 }, keys: { root: { y: [[0, 0], [0.25, -1.4], [0.5, 0], [0.75, -1.4], [1, 0]] } } },
    walk: { prog: 'biped.idle' },
    // schläft: Kopf sinkt, Zipfelmütze nickt
    sleep: { prog: 'biped.idle', p: { breathe: 0.04 }, keys: { expr: [[0, 1, 'sleep']], head: { r: [[0, 6], [0.5, 12], [1, 6]] }, hat: { r: [[0, 0], [0.5, 8], [1, 0]] } } },
    // reißt das Zepter hoch, zeigt auf das Ziel
    attack: { prog: 'atk.cast', hit: 0.55, p: { wind: -150, strike: -80, windB: 0, strikeB: 0, lean: 4, lunge: 6 } },
    // hält sich die Krone fest
    hit: { p: { knock: 1, recoil: 3 }, keys: { armB: { r: [[0, 0], [0.2, -170], [1, 0]] } } },
    // erwacht: streckt sich
    spawn: { keys: { armF: { r: [[0, 0], [0.4, -160], [0.8, -160], [1, 0]] }, armB: { r: [[0, 0], [0.4, 160], [0.8, 160], [1, 0]] } } },
    // Turm stürzt; er purzelt rückwärts hinunter
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { r: [[0, 0], [1, -120, 'in']], y: [[0, 0], [0.3, -6, 'out'], [1, 40, 'in']] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
