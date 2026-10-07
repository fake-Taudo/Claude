// Fledermäuse – hibbelige Fellkugeln mit Lindenblatt-Ohren und einem einzelnen Zahn (Brief: docs/briefs/bats.md)
import { ellipse, circle, rrect, poly, path, polyline, spline } from '../geo.mjs';
import { eye, eyeClosed, eyeSpiral, eyeX, brow, mouthLine, mouthOpen, lines, emblem, INK, WHITE } from '../kit.mjs';

/** Lindenblatt: herzförmiger Grund, gesägter Rand, Spitze. B Stielpunkt, T Spitze, w halbe Breite. */
function leafPts(B, T, w, o = {}) {
  const dx = T[0] - B[0];
  const dy = T[1] - B[1];
  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const at = (u, v) => [B[0] + ux * u * L + nx * v * w, B[1] + uy * u * L + ny * v * w];
  // Umriss (u entlang der Achse, v quer): Herzbucht am Stiel, breiteste Stelle bei 30 %, Spitze bei 1
  const side = [[0.02, 0.62], [0.12, 0.95], [0.3, 1], [0.48, 0.88], [0.64, 0.66], [0.8, 0.38], [0.92, 0.14]];
  const pts = [[...at(0.1, 0), 1]];
  const teeth = o.teeth ?? 0.05;
  side.forEach(([u, v], i) => {
    if (o.notch && i === o.notch) {
      pts.push([...at(u - 0.04, v), 1], [...at(u, v * 0.7), 1], [...at(u + 0.04, v * 0.95), 1]);
      return;
    }
    pts.push(at(u, v));
    if (i < side.length - 1) pts.push([...at(u + 0.08, v - 0.03 + teeth * 1.6), 1]);
  });
  pts.push([...at(1, 0), 1]);
  for (let i = side.length - 1; i >= 0; i--) {
    const [u, v] = side[i];
    if (i < side.length - 1) pts.push([...at(u + 0.08, -(v - 0.03 + teeth * 1.6)), 1]);
    pts.push(at(u, -v));
  }
  return { pts, at };
}

export default function bats(F) {
  const P = F.pal;
  const FUR = P.main;
  const PINK = P.acc;
  const SKINW = '#3a4560';
  const BELLY = '#6f7c9a';
  const BONE = '#7b88a6';
  const CLAW = '#e8dcc8';
  const FEET = '#2c3346';

  F.rig('flyer', {
    body: [0, -16],
    head: [1, -17],
    crest: [1, -25],
    jaw: [5, -11],
    wingB: [-8, -18],
    wingF: [8, -18],
    legB: [-3, -7],
    legF: [3, -7],
    tail: [-6, -10],
  });

  // ───────── Flügel: gezackte Haut zwischen drei Fingerknochen, Teamband an der Spitze ─────────
  const wing = (s, name, z, scale, dark) => {
    const X = (x) => x * s;
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const sh = [X(7), -18];
      const wr = [X(16), -26.5];
      const tip = [X(34 * scale), -23];
      const f1 = [X(32 * scale), -13];
      const f2 = [X(25 * scale), -5.5];
      const f3 = [X(12), -8];
      const memb = path([
        [...sh, 1],
        [X(11), -23.5],
        [...wr, 1],
        [X(26 * scale), -26.5],
        [...tip, 1],
        [X(30 * scale), -17.5],
        [...f1, 1],
        [X(26 * scale), -10.5],
        [...f2, 1],
        [X(18), -9.5],
        [...f3, 1],
        [X(10), -13],
      ]);
      g.mat(memb, dark ? '#323c55' : SKINW, 'leather', { hi: 0.15 });
      // Fingerknochen
      for (const t of [tip, f1, f2]) g.stroke(polyline([wr, t]), BONE, 1.15);
      g.stroke(polyline([sh, wr]), BONE, 1.6);
      g.lod(1, (h) => {
        for (const t of [f1, f2]) h.stroke(spline([[wr[0] + (t[0] - wr[0]) * 0.3, wr[1] + (t[1] - wr[1]) * 0.3 + 2], [wr[0] + (t[0] - wr[0]) * 0.55 - X(1.5), wr[1] + (t[1] - wr[1]) * 0.55 + 1]]), '#2a3248', 0.5);
      });
      // Daumenkralle am Handgelenk
      g.fill(path([[wr[0] - X(1.2), wr[1] + 0.4, 1], [wr[0] + X(0.4), wr[1] - 3.2], [wr[0] + X(2.2), wr[1] - 3.6, 1], [wr[0] + X(1.2), wr[1] - 1.8], [wr[0] + X(1.2), wr[1] + 0.6, 1]]), CLAW, { stroke: INK, lw: 0.5 });
    });
    // Teamband um den Fingerknochen kurz vor der Spitze, mit zwei flatternden Enden
    F.part(name + 'Band', { bone: name, z: z + 0.5, zb: z + 0.5, team: true }, (g) => {
      const bx = X(28 * scale);
      const by = -25.4;
      g.mat(rrect(bx - 1.6, by - 2.6, 3.2, 5.2, 0.9).rot(s * 14, bx, by), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
      g.mat(path([[bx - X(0.5), by + 1.5, 1], [bx - X(3.5), by + 5.5], [bx - X(2), by + 7.8, 1], [bx - X(1.5), by + 5.6], [bx + X(0.9), by + 2, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
      g.mat(path([[bx + X(0.5), by + 2, 1], [bx + X(1.5), by + 6.5], [bx + X(3.4), by + 8.2, 1], [bx + X(2.6), by + 5.6], [bx + X(1.7), by + 1.6, 1]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5, lod: 1 });
    });
  };
  wing(-1, 'wingB', 2, 0.92, true);
  wing(1, 'wingF', 4, 1, false);

  // ───────── Füßchen ─────────
  const foot = (x, name, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(rrect(x - 1.3, -8, 2.6, 5, 1.2), FEET, 'leather');
      for (const d of [-1.3, 0, 1.3]) g.fill(path([[x + d - 0.6, -3.4, 1], [x + d + 0.2, 0, 1], [x + d + 0.7, -3.4, 1]]), CLAW, { stroke: INK, lw: 0.4 });
    });
  };
  foot(-3, 'legB', 5);
  foot(3.2, 'legF', 6);

  // ───────── Ohren (Signature): Lindenblätter mit Adern, hinteres Ohr mit Kerbe ─────────
  const ear = (B, T, w, z, zb, name, o = {}) => {
    const { pts, at } = leafPts(B, T, w, o);
    const leaf = path(pts);
    F.part(name, { bone: 'crest', z, zb, sig: true, variant: o.variant }, (g) => {
      g.mat(leaf, FUR, 'fur', { hi: 0.2 });
    });
    F.part(name + 'In', { bone: 'crest', z: z + 0.2, view: 'front', variant: o.variant }, (g) => {
      const inner = path(leafPts(B, T, w * 0.7, { teeth: 0 }).pts.map(([x, y, s]) => {
        // zur Blattmitte hin einziehen
        const cx = B[0] + (T[0] - B[0]) * 0.42;
        const cy = B[1] + (T[1] - B[1]) * 0.42;
        return [cx + (x - cx) * 0.78, cy + (y - cy) * 0.78, s];
      }));
      g.mat(inner, PINK, 'skin', { line: '#c4557e', lw: 0.6 });
      g.lod(1, (h) => {
        h.stroke(spline([at(0.16, 0), at(0.5, 0.04), at(0.86, 0)]), '#d0517f', 0.7);
        for (const [u, v] of [[0.3, 0.5], [0.48, 0.48], [0.64, 0.36]]) {
          h.stroke(spline([at(u - 0.06, 0.02), at(u + 0.04, v * 0.55), at(u + 0.1, v)]), '#d8648c', 0.5);
          h.stroke(spline([at(u - 0.06, -0.02), at(u + 0.04, -v * 0.55), at(u + 0.1, -v)]), '#d8648c', 0.5);
        }
      });
    });
    F.part(name + 'Back', { bone: 'crest', z: z + 0.2, view: 'back', variant: o.variant, lod: 1 }, (g) => {
      g.stroke(spline([at(0.16, 0), at(0.5, 0.04), at(0.86, 0)]), '#3e4a66', 0.8);
    });
  };
  ear([-3, -24], [-17, -48], 9, 1, 1, 'earB', { notch: 2 });
  ear([4.5, -25], [12.5, -50.5], 9.6, 22, 22, 'earF', { variant: [0, 2, 3] });
  // Variante 1: Ohr geknickt – die obere Hälfte klappt nach vorn
  ear([4.5, -25], [13, -39.5], 9.6, 22, 22, 'earFold', { variant: 1, teeth: 0.02 });
  F.part('earFoldTip', { bone: 'crest', z: 22.6, zb: 22.6, variant: 1 }, (g) => {
    g.mat(path([[8.6, -38.5, 1], [17.5, -40], [21, -35, 1], [16.2, -34.6], [11.6, -35.2]]), '#5b6987', 'fur', { hi: 0.2 });
    g.stroke(polyline([[9.8, -37.4], [19, -36.2]]), '#3e4a66', 0.6, { lod: 1 });
  });

  // ───────── Körper: Fellkugel ─────────
  F.part('body', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const ball = path([[-11, -17], [-8.5, -24.5], [-2, -27.6], [5.5, -27], [10.6, -21.6], [11.4, -14], [8, -7], [0.5, -4.8], [-7, -7], [-10.8, -12]]);
    g.mat(ball, FUR, 'fur', { hi: 0.32 });
    // Fellspitzen am Scheitel zwischen den Ohren
    g.mat(path([[-3.4, -26.6, 1], [-1.6, -30.4, 1], [0.2, -27.4], [1.8, -30.8, 1], [3.6, -27.2, 1]]), FUR, 'fur', { lod: 0 });
    g.lod(1, (h) => {
      lines(h, [[[-8.6, -10.8], [-6.8, -9.2]], [[-9.4, -14.6], [-7.6, -13.4]], [[8.2, -9.4], [6.6, -8.4]]], '#3e4a66', 0.6, 1);
    });
  });
  F.part('belly', { bone: 'body', z: 11, view: 'front' }, (g) => {
    g.mat(ellipse(2, -10.4, 6.6, 4.8), BELLY, 'fur', { line: '0' });
    g.lod(1, (h) => lines(h, [[[-1, -9.6], [0, -8.2]], [[2.4, -9.2], [3, -7.6]], [[5.4, -9.6], [6, -8.2]]], '#5a6684', 0.55, 1));
  });
  F.part('bellySpot', { bone: 'body', z: 11.5, view: 'front', variant: 3 }, (g) => {
    g.mat(path([[-3.6, -11.6], [-1, -12.8], [0.8, -10.6], [-0.8, -8], [-3.4, -8.6]]), '#d6dbe8', 'fur', { line: '0' });
  });
  F.part('bodyBack', { bone: 'body', z: 12, view: 'back', lod: 1 }, (g) => {
    g.stroke(spline([[-6, -24], [-1, -19], [-2, -12]]), '#3e4a66', 0.7);
    g.stroke(spline([[4, -24], [2, -17], [3, -11]]), '#3e4a66', 0.7);
  });

  // ───────── Gesicht ─────────
  const EYE = { iris: '#2b2238', irisR: 0.66, pupil: 0.62, lidColor: FUR, line: INK };
  const EF = [5.6, -18.6];
  const EB = [-1.8, -19];
  F.part('face.idle', { bone: 'head', z: 20, view: 'front', expr: 'idle' }, (g) => {
    eye(g, ...EB, { ...EYE, r: 3.1, look: [0.5, 0], lashW: 0.8 });
    eye(g, ...EF, { ...EYE, r: 3.6, look: [0.5, 0], lashW: 0.9 });
    mouthLine(g, 5.4, -11.6, 4.6, 0.9, { lw: 0.7 });
  });
  F.part('face.attack', { bone: 'head', z: 20, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    eye(g, ...EB, { ...EYE, r: 3.1, look: [0.7, 0.3], lid: 0.32, lashW: 0.8 });
    eye(g, ...EF, { ...EYE, r: 3.6, look: [0.7, 0.3], lid: 0.32, lashW: 0.9 });
    brow(g, [[-4.4, -23.4], [-1.6, -22.6], [0.8, -21.4]], 0.9, '#2a3046');
    brow(g, [[2.8, -21.8], [5.6, -23.2], [8.8, -23.6]], 1, '#2a3046');
  });
  F.part('face.hurt', { bone: 'head', z: 20, view: 'front', expr: 'hurt' }, (g) => {
    // quietscht: zugekniffene Augen
    g.stroke(polyline([[-4, -21], [-1, -19], [-4, -17]]), INK, 1);
    g.stroke(polyline([[8.4, -21.2], [4.6, -18.8], [8.4, -16.6]]), INK, 1.1);
  });
  F.part('face.stun', { bone: 'head', z: 20, view: 'front', expr: 'stun' }, (g) => {
    eyeSpiral(g, ...EB, 2.8, INK, 0.7);
    eyeSpiral(g, ...EF, 3.2, INK, 0.7);
  });
  F.part('face.death', { bone: 'head', z: 20, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, ...EB, 2, INK, 0.9);
    eyeX(g, ...EF, 2.3, INK, 1);
  });
  F.part('face.sleep', { bone: 'head', z: 20, view: 'front', expr: 'sleep' }, (g) => {
    eyeClosed(g, ...EB, 2.2, { lw: 0.8 });
    eyeClosed(g, ...EF, 2.6, { lw: 0.9 });
  });
  F.part('nose', { bone: 'head', z: 21, view: 'front' }, (g) => {
    g.mat(path([[6.6, -15.6], [9.4, -16.4], [11.6, -14.8], [10.8, -12.8], [7.6, -12.8]]), '#5e6c8c', 'skin', { line: '#2e3650', lw: 0.6 });
    g.fill(ellipse(8.4, -14.2, 0.55, 0.8), '#20263a', { lod: 1 });
    g.fill(ellipse(10.4, -14.4, 0.5, 0.75), '#20263a', { lod: 1 });
    g.fill(ellipse(0.4, -14.4, 1.8, 1.1), PINK, { op: 0.5, lod: 1 });
  });
  // Mund und Einzelzahn am Kiefer (öffnet beim Biss)
  const tooth = (x, name, variant) => {
    F.part(name, { bone: 'jaw', z: 23, view: 'front', variant, expr: ['idle', 'sleep', 'stun', 'death'] }, (g) => {
      g.fill(path([[x - 1, -11.2, 1], [x + 1, -11.2, 1], [x + 0.6, -7.8], [x, -6.6, 1], [x - 0.5, -7.8]]), WHITE, { stroke: INK, lw: 0.55 });
    });
    F.part(name + 'Open', { bone: 'jaw', z: 23, view: 'front', variant, expr: ['attack', 'ability', 'hurt'] }, (g) => {
      mouthOpen(g, 5.2, -10.6, 6.4, 3.6, { teeth: null, lw: 0.6 });
      g.fill(path([[x - 1, -12.6, 1], [x + 1, -12.6, 1], [x + 0.6, -8.4], [x, -6.8, 1], [x - 0.5, -8.4]]), WHITE, { stroke: INK, lw: 0.55 });
    });
  };
  tooth(6.2, 'tooth', [0, 1, 3]);
  tooth(3.2, 'toothL', 2);

  // ───────── Teamsymbol auf der Brust ─────────
  emblem(F, 'emblem', 'body', 12, -6.4, -13.6, 1.7, { lod: 1, view: 'front' });
  emblem(F, 'emblemBack', 'body', 13, 0, -14, 1.9, { lod: 1, view: 'back' });

  // ───────── Evolution: Vampir mit Mini-Umhang, leuchtendem Zahn und Herzpunkten ─────────
  F.part('evoCape', { bone: 'body', z: 7, zb: 14, evo: 'evo' }, (g) => {
    g.mat(path([[-9, -22], [9, -22], [13, -6, 1], [8, -8.6], [4, -4.6, 1], [0, -8], [-4, -4.6, 1], [-8, -8.6], [-13, -6, 1]]), '#5a1830', 'cloth', { hi: 0.4 });
    g.mat(path([[-9, -22], [9, -22], [7, -19.6], [-7, -19.6]]), '#c0284e', 'cloth', { lod: 1 });
  });
  F.part('evoCollar', { bone: 'body', z: 12.5, evo: 'evo', view: 'front' }, (g) => {
    g.mat(path([[-10, -21, 1], [-12.6, -27, 1], [-6.4, -23.8], [-3, -21.4, 1]]), '#5a1830', 'cloth', { line: '#2a0a16' });
    g.mat(path([[8, -21, 1], [12.4, -26.4, 1], [9.4, -21.4], [11, -19.6, 1]]), '#5a1830', 'cloth', { line: '#2a0a16' });
    g.mat(circle(1.8, -21.6, 1.2), '#ff4d8a', 'gem');
  });
  F.part('evoHearts', { bone: 'crest', z: 22.8, evo: 'evo', view: 'front', lod: 1 }, (g) => {
    const heart = (x, y, r) => path([[x, y + r * 0.9, 1], [x - r, y - r * 0.1], [x - r * 0.55, y - r * 0.85], [x, y - r * 0.35, 1], [x + r * 0.55, y - r * 0.85], [x + r, y - r * 0.1]]);
    for (const [x, y, r] of [[7.6, -33, 1.3], [8.8, -38.8, 1], [-8.4, -33.6, 1.1]]) g.fill(heart(x, y, r), '#ff4d8a', { stroke: '#8a1a46', lw: 0.4 });
  });
  for (const [x, variant] of [[6.2, [0, 1, 3]], [3.2, 2]]) {
    F.part('evoToothGlow' + variant, { bone: 'jaw', z: 24, evo: 'evo', glow: true, view: 'front', variant }, (g) => {
      g.fill(circle(x, -8.4, 2.1), '#ff7ab4', { op: 0.35 });
    });
  }

  F.anim({
    // flattern schnell im Kreis
    idle: { p: { flaps: 6, flap: 36, lift: 1.8, roll: 4, tilt: 6, dangle: 10 }, keys: { root: { x: [[0, 0], [0.25, 2.4], [0.5, 0], [0.75, -2.4], [1, 0]], y: [[0, -1.2], [0.25, 0], [0.5, 1.2], [0.75, 0], [1, -1.2]] }, crest: { r: [[0, 0], [0.25, 5], [0.5, -2], [0.75, 4], [1, 0]] } }, ev: { flap: [0, 0.167, 0.333, 0.5, 0.667, 0.833] } },
    // Zickzack-Flug
    walk: { p: { flaps: 4, flap: 40, lean: 10 }, keys: { root: { y: [[0, 0], [0.25, -3.5], [0.5, 0], [0.75, 3.5], [1, 0]], r: [[0, 0], [0.25, -6], [0.5, 0], [0.75, 6], [1, 0]] }, crest: { r: [[0, -8], [0.5, -4], [1, -8]] } }, ev: { flap: [0, 0.25, 0.5, 0.75] } },
    // Sturzflug-Biss
    attack: { prog: 'flyer.bite', hit: 0.55, p: { flaps: 3, flap: 30, wind: -14, strike: 18, jawOpen: 26, jawAfter: 6, reach: 4 }, keys: { root: { y: [[0, 0], [0.4, -6, 'out'], [0.55, 5, 'in'], [0.75, 1], [1, 0]], r: [[0, 0], [0.4, -10], [0.55, 16], [1, 0]] }, wingF: { r: [[0, 0], [0.4, -30], [0.55, 24], [0.8, 0]] }, wingB: { r: [[0, 0], [0.4, 30], [0.55, -24], [0.8, 0]] }, crest: { r: [[0, 0], [0.4, -14], [0.55, 10], [1, 0]] } } },
    hit: { keys: { crest: { r: [[0, 0], [0.2, -18], [1, 0]] } } },
    // trudeln ab
    death: { keys: { root: { r: [[0, 0], [1, -200, 'in']] }, crest: { r: [[0, 0], [0.3, 20], [0.6, -15], [1, 10]] } } },
  });
}
