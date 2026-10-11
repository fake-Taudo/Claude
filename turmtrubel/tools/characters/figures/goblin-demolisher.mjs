// Goblin Demolisher – fröhlich-leichtsinniger Sprengmeister im kugelrunden Bombenanzug mit Bullaugen-Helm, wirft Dynamit.
// Form „kamikaze“: Lunte am Helm brennt, Arme nach hinten, Glas beschlägt rot (Brief: docs/briefs/goblin-demolisher.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, star } from '../geo.mjs';
import { eye, mouthOpen, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function goblinDemolisher(F) {
  const P = F.pal;
  const SUIT = P.main;
  const WARN = P.acc;
  const GOB = '#7fae4a';
  const BRASS = '#c8a046';
  const TNT = '#d4442a';
  const SUIT_D = '#8a7a4a';
  const GLOVE = '#7a5a3e';
  // Teile, die beim Tod gegen den zusammengefallenen Anzug getauscht werden
  const ALL = '*';
  const LIVE = ['idle', 'walk', 'attack', 'hit', 'spawn', 'stun', 'sleep', 'charge', 'ability', 'spawnUnit', 'suitOn'];

  F.rig(
    'biped',
    {
      hip: [0, -16],
      torso: [0, -18],
      head: [3, -56],
      hat: [3, -80],
      back: [-14, -44],
      armB: [-16, -42],
      handB: [-22, -30],
      armF: [15, -42],
      handF: [23, -31],
      prop: [23, -31],
      legB: [-8, -14],
      footB: [-9, -3],
      legF: [7, -14],
      footF: [8, -3],
      cape: [0, -50],
      fuse: [-6, -77],
    },
    { fuse: 'head' },
  );

  // ───────── Stummelbeine mit Stiefeln ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z, state: LIVE, form: ALL }, (g) => g.mat(limb(x, -16, x * 1.1, -5, 5, 4.4), col, 'cloth', { hi: 0.3 }));
    F.part(foot, { bone: foot, z: z + 1, state: LIVE, form: ALL }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 5, -7], [fx + 4, -7.4], [fx + 9, -2.6], [fx + 9.2, 0, 1], [fx - 5.6, 0, 1]]), '#4a3a2e', 'leather', { hi: 0.5 });
    });
  };
  leg('legB', 'footB', -8, 6, SUIT_D);
  leg('legF', 'footF', 7, 8, SUIT);

  // ───────── Hinterer Arm: vorn greifend (Grundform), nach hinten gestreckt (Kamikaze) ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42, state: LIVE, form: 'base' }, (g) => g.mat(limb(-16, -42, -22, -32, 5, 4.4), SUIT_D, 'cloth'));
  F.part('handB', { bone: 'handB', z: 10, zb: 43, state: LIVE, form: 'base' }, (g) => g.mat(circle(-22, -30, 4.2), GLOVE, 'leather', { hi: 0.4 }));
  F.part('armB.k', { bone: 'armB', z: 9, zb: 42, state: LIVE, form: 'kamikaze' }, (g) => {
    g.mat(limb(-16, -42, -34, -38, 5, 4.4), SUIT_D, 'cloth');
    g.mat(circle(-36, -37.6, 4.2), GLOVE, 'leather', { hi: 0.4 });
  });

  // ───────── Kugelrunder Bombenanzug mit Steppkaros, Brandlöchern, Warnstreifen (Teamzone) ─────────
  F.part('suit', { bone: 'torso', z: 18, zb: 18, state: LIVE, form: ALL }, (g) => {
    const s = ellipse(0, -34, 24, 22.6);
    g.mat(s, SUIT, 'cloth', { hi: 0.45 });
    g.clipTo(s, (h) => {
      h.lod(1, (k) => {
        for (let i = -3; i <= 3; i++) {
          k.stroke(polyline([[-30 + i * 10, -60], [10 + i * 10, -10]]), SUIT_D, 0.6);
          k.stroke(polyline([[30 + i * 10, -60], [-10 + i * 10, -10]]), SUIT_D, 0.6);
        }
      });
      for (const [x, y, r] of [[-12, -46, 2.2], [14, -20, 1.8]]) h.fill(blob([[x - r, y], [x - r * 0.4, y - r], [x + r, y - r * 0.6], [x + r * 0.8, y + r * 0.6], [x - r * 0.2, y + r]], 0.8), '#3a2a20', { lod: 1 });
    });
  });
  F.part('stripes', { bone: 'torso', z: 19, zb: 19, state: LIVE, team: true, form: ALL }, (g) => {
    const band = path([[-24, -39], [24, -39], [24, -32], [-24, -32]]);
    g.clipTo(ellipse(0, -34, 24, 22.6), (h) => {
      h.mat(band, P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
      h.clipTo(band, (k) => {
        for (let x = -30; x < 30; x += 6) k.fill(poly([[x, -39], [x + 3, -39], [x - 4, -32], [x - 7, -32]]), INK);
      });
    });
  });
  F.part('tntBelt', { bone: 'hip', z: 20, zb: 20, state: LIVE, form: ALL }, (g) => {
    g.mat(path([[-21, -24], [21, -24], [19, -19.6], [-19, -19.6]]), '#5a4030', 'leather', { hi: 0.3 });
    for (const x of [-12, -6, 0, 6]) {
      g.mat(rrect(x - 1.8, -29, 3.6, 9, 1), TNT, 'cloth', { hi: 0.5 });
      g.stroke(spline([[x, -29], [x + 0.6, -31], [x + 1.6, -31.6]]), '#3a2a20', 0.5, { lod: 1 });
    }
    g.mat(rrect(10, -24.4, 4.4, 5, 0.8), BRASS, 'gold', { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 21, -15, -26, 2.2, { zb: 21, form: ALL, state: LIVE });

  // ───────── Messinghelm mit Bullauge und acht Schrauben (Signature), Helmlampe (Teamzone) ─────────
  F.part('collar', { bone: 'torso', z: 29, zb: 29, state: LIVE, form: ALL }, (g) => g.mat(ellipse(2, -53, 12.6, 3.6), BRASS, 'gold', { hi: 0.7 }));
  F.part('helmet', { bone: 'head', z: 30, zb: 30, sig: true, form: ALL }, (g) => {
    g.mat(circle(3, -66, 14.4), BRASS, 'gold', { hi: 0.7 });
    g.lod(1, (h) => lines(h, [[[-8, -74], [-10, -66]], [[-6, -58], [0, -54]]], '#9a7a2e', 0.6, 1));
  });
  F.part('porthole', { bone: 'head', z: 31, view: 'front', form: ALL }, (g) => {
    g.mat(circle(8.4, -66, 10), '#a07a2a', 'gold', { hi: 0.6 });
    g.fill(circle(8.4, -66, 8), GOB);
    g.fill(ellipse(10, -69, 6, 3.6), '#9ac860', { op: 0.6 });
  });
  // Koboldgesicht, ans Glas gedrückt
  F.part('face.idle', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'attack', 'ability', 'sleep'], form: 'base' }, (g) => {
    g.clipTo(circle(8.4, -66, 8), (h) => {
      eye(h, 11.6, -68.4, { r: 3, iris: '#c8a020', look: [0.6, 0.1], lid: 0.05 });
      eye(h, 5, -68.6, { r: 2.6, iris: '#c8a020', look: [0.6, 0.1], lid: 0.05 });
      h.fill(ellipse(14.4, -65.2, 2.6, 1.8), '#a8d878', { stroke: '#5a8a34', lw: 0.4 });
      mouthOpen(h, 9.6, -61.8, 6.4, 2.6, { teeth: 'top', tongue: false, lw: 0.5 });
    });
  });
  F.part('face.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'], form: ALL }, (g) => {
    g.clipTo(circle(8.4, -66, 8), (h) => {
      h.stroke(spline([[9.6, -69.4], [11.4, -68.4], [13.2, -69.4]]), INK, 0.8);
      h.stroke(spline([[3.6, -69.4], [5.2, -68.4], [6.8, -69.4]]), INK, 0.7);
      mouthOpen(h, 9.4, -62.4, 4.4, 2.6, { teeth: null, tongue: false, lw: 0.5 });
    });
  });
  F.part('face.death', { bone: 'head', z: 32, view: 'front', expr: 'death', form: ALL }, (g) => {
    g.clipTo(circle(8.4, -66, 8), (h) => {
      for (const [x, y] of [[11.4, -68.4], [5.2, -68.6]]) {
        h.stroke(polyline([[x - 1.6, y - 1.6], [x + 1.6, y + 1.6]]), INK, 0.8);
        h.stroke(polyline([[x + 1.6, y - 1.6], [x - 1.6, y + 1.6]]), INK, 0.8);
      }
    });
  });
  // Kamikaze: Augen aufgerissen, Glas beschlägt rot
  F.part('face.kamikaze', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'attack', 'ability', 'sleep'], form: 'kamikaze' }, (g) => {
    g.clipTo(circle(8.4, -66, 8), (h) => {
      eye(h, 11.6, -68.6, { r: 3.2, iris: '#c8a020', irisR: 0.4, look: [0.8, 0], lash: false });
      eye(h, 5, -68.8, { r: 2.8, iris: '#c8a020', irisR: 0.4, look: [0.8, 0], lash: false });
      h.fill(ellipse(14.4, -65.2, 2.6, 1.8), '#a8d878', { stroke: '#5a8a34', lw: 0.4 });
      mouthOpen(h, 9.6, -61.6, 6.8, 3.6, { teeth: 'both', tongue: true, lw: 0.5 });
    });
  });
  F.part('fog', { bone: 'head', z: 33, view: 'front', form: 'kamikaze', outline: false }, (g) => g.fill(circle(8.4, -66, 8), '#ff3a2a', { op: 0.38 }));
  F.part('glass', { bone: 'head', z: 33.5, view: 'front', form: ALL }, (g) => {
    g.fill(circle(8.4, -66, 8), '#d8f0ff', { op: 0.18 });
    g.fill(ellipse(5.4, -70, 3, 1.6, -35), '#ffffff', { op: 0.7 });
    g.fill(ellipse(12.4, -61.6, 1.2, 0.7, -35), '#ffffff', { op: 0.5, lod: 1 });
  });
  F.part('bolts', { bone: 'head', z: 34, view: 'front', form: ALL }, (g) => {
    const pts = [];
    for (let i = 0; i < 8; i++) pts.push([8.4 + Math.cos((i * Math.PI) / 4) * 9, -66 + Math.sin((i * Math.PI) / 4) * 9]);
    rivets(g, pts, 0.9, '#f0d890');
  });
  F.part('helmetBack', { bone: 'head', z: 34, view: 'back', form: ALL }, (g) => {
    g.mat(circle(3, -66, 14.4), BRASS, 'gold', { hi: 0.6 });
    rivets(g, [[-6, -70], [0, -74], [6, -74], [12, -70]], 0.9, '#f0d890');
  });
  F.part('lamp', { bone: 'head', z: 35, zb: 35, team: true, form: ALL }, (g) => {
    g.mat(rrect(-1.4, -84, 8.4, 5.4, 1.6), P.team, 'metal', { line: P.teamDeep, lw: 0.5, hi: 0.6 });
    g.mat(rrect(0.4, -80.4, 5, 1.6, 0.4), BRASS, 'gold');
  });
  F.part('lampGlow', { bone: 'head', z: 35.5, view: 'front', glow: true, form: ALL }, (g) => g.fill(ellipse(7.6, -81.4, 1.6, 2), '#fff4c8'));

  // ───────── Lunte am Helm (nur Kamikaze) ─────────
  F.part('fuse', { bone: 'fuse', z: 29.5, zb: 36, form: 'kamikaze' }, (g) => {
    g.stroke(spline([[-6, -77], [-9, -82], [-8, -87], [-11, -90]]), '#3a2a20', 1.2);
  });
  F.part('sparks', { bone: 'fuse', z: 36.5, zb: 36.5, form: 'kamikaze', glow: true }, (g) => {
    g.fill(star(-11, -90.4, 5, 2, 8), '#ffd060', { op: 0.9 });
    g.fill(circle(-11, -90.4, 1.6), '#fff4c8');
    for (const [x, y] of [[-15, -94], [-7, -95], [-16, -87]]) g.fill(circle(x, y, 0.8), '#ffb03a', { lod: 1 });
  });

  // ───────── Vorderer Arm: Dynamit (Grundform) bzw. nach hinten gestreckt (Kamikaze) ─────────
  F.part('dynamite', { bone: 'prop', z: 38, zb: 4, state: LIVE, form: 'base' }, (g) => {
    g.mat(rrect(21, -45, 4, 13, 1.2), TNT, 'cloth', { hi: 0.5 });
    g.mat(rrect(20.6, -42, 4.8, 1.4, 0.3), '#f0e6d0', 'cloth', { lod: 1 });
    g.stroke(spline([[23, -45], [23.6, -48], [25.4, -49.4]]), '#3a2a20', 0.7);
  });
  F.part('dynSpark', { bone: 'prop', z: 38.5, zb: 4.5, state: ['attack'], form: 'base', glow: true }, (g) => g.fill(star(25.6, -49.6, 2.6, 1, 6), '#ffd060'));
  F.part('armF', { bone: 'armF', z: 29, zb: 6, state: LIVE, form: 'base' }, (g) => g.mat(limb(15, -42, 22, -33, 5.2, 4.6), SUIT, 'cloth', { hi: 0.35 }));
  F.part('handF', { bone: 'handF', z: 41, zb: 7, state: LIVE, form: 'base' }, (g) => g.mat(circle(23, -31, 4.4), GLOVE, 'leather', { hi: 0.4 }));
  F.part('armF.k', { bone: 'armF', z: 29, zb: 6, state: LIVE, form: 'kamikaze' }, (g) => {
    g.mat(limb(13, -42, -8, -34, 5.2, 4.6), SUIT, 'cloth', { hi: 0.35 });
    g.mat(circle(-10, -33.4, 4.4), GLOVE, 'leather', { hi: 0.4 });
  });

  // ───────── Tod: Anzug fällt zusammen (Grundform) bzw. Explosion (Kamikaze), der Helm rollt ─────────
  F.part('suitFlat', { bone: 'root', z: 18, zb: 18, state: 'flat', form: 'base' }, (g) => {
    const s = blob([[-26, 0], [-22, -8], [-8, -12], [10, -11], [22, -6], [26, 0]], 0.7);
    g.mat(s, SUIT, 'cloth', { hi: 0.3 });
    g.clipTo(s, (h) => h.mat(path([[-26, -8], [26, -8], [26, -4], [-26, -4]]), P.team, 'cloth'));
    for (const x of [-10, -2, 6]) g.mat(rrect(x, -3, 9, 3, 1).rot(-10, x, -2), TNT, 'cloth', { hi: 0.4 });
  });
  F.part('blast', { bone: 'root', z: 50, zb: 50, state: 'blast', form: 'kamikaze', glow: true }, (g) => {
    g.fill(blob([[-34, -30], [-20, -64], [6, -76], [32, -60], [38, -26], [14, -4], [-24, -6]], 0.8), '#ffb03a', { op: 0.85 });
    g.fill(circle(2, -36, 18), '#fff4c8', { op: 0.9 });
  });

  F.anim({
    // klopft an die Helmscheibe
    idle: {
      p: { breathe: 0.04, bob: 1, sway: 1, tilt: 2 },
      keys: { armF: { r: [[0, 0], [0.25, -118], [0.32, -110], [0.39, -118], [0.46, -110], [0.53, -118], [0.7, 0]] }, handF: { r: [[0, 0], [0.25, 30], [0.53, 30], [0.7, 0]] }, head: { r: [[0, 0], [0.3, 6], [0.55, 6], [0.7, 0]] } },
    },
    // watschelnd, der Anzug wippt
    walk: { p: { stride: 12, bob: 3, squash: 0.05, armSwing: 14, lean: 2 }, keys: { torso: { r: [[0, -6], [0.5, 6], [1, -6]] } } },
    // Dynamit über Kopf (Anticipation), Wurf
    attack: { prog: 'atk.throw', hit: 0.6, p: { wind: -170, strike: -40, over: 20, lean: 8, lunge: 12 }, keys: { layer: [[0.15, 0.55, 'armF', 28.5, 6], [0.15, 0.55, 'handF', 28.6, 7], [0.15, 0.55, 'dynamite', 28.4, 4]] }, ev: { release: 0.6 } },
    // Kamikaze-Ansturm
    charge: { prog: 'biped.run', p: { stride: 30, bob: 3.6, armSwing: 6, lean: 14 } },
    // Polster beult ein
    hit: { p: { knock: 1.6, recoil: 3 }, keys: { torso: { sx: [[0, 1], [0.15, 1.12], [0.6, 0.97], [1, 1]], sy: [[0, 1], [0.15, 0.88], [0.6, 1.03], [1, 1]] } } },
    // plumpst, federt im Polster nach
    spawn: { keys: { torso: { sy: [[0, 1], [0.55, 1], [0.65, 0.8], [0.78, 1.1], [0.9, 0.96], [1, 1]] } } },
    // Anzug fällt in sich zusammen, der Helm rollt davon
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        show: { suitOn: [[0, 0.22]], flat: [[0.22, 1.01]], blast: [[0, 0.35]] },
        head: { x: [[0, 0], [0.22, 0], [0.9, 30, 'out']], y: [[0, 0], [0.22, 0], [0.4, 30, 'in'], [0.9, 32]], r: [[0, 0], [0.22, 0], [0.9, 160, 'out']] },
        alpha: [[0, 1], [0.75, 1], [1, 0]],
      },
    },
  });
}
