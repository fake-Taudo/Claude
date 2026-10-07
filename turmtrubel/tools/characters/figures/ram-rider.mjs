// Widderreiterin – abenteuerlustige Hirtin auf einem Widder mit riesigen Doppelspiral-Hörnern und Kristallglöckchen,
// fesselt Gegner mit ihrer Bola (Brief: docs/briefs/ram-rider.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, eye, eyeX, eyeClosed, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function ramRider(F) {
  const P = F.pal;
  const WOOL = P.main;
  const COAT = P.acc;
  const HORN = '#b08a5a';
  const HAIR = '#e8743b';
  const STONE = '#7a7a80';
  const SKIN = '#f2c4a0';
  const WOOL_D = '#d8c8a8';
  const LEG = '#5a4a40';
  const CRYSTAL = '#a8e0f0';
  const FUR = '#8a6a4a';

  F.rig('rider', {
    body: [0, -42],
    head: [32, -52],
    jaw: [46, -38],
    ear: [38, -62],
    tail: [-34, -50],
    legBf: [-22, -30],
    legFf: [20, -30],
    legBn: [-18, -28],
    legFn: [24, -28],
    rHip: [-4, -66],
    rTorso: [-4, -67],
    rHead: [2, -92],
    rArmB: [-6, -88],
    rHandB: [10, -76],
    rArmF: [5, -88],
    rHandF: [16, -110],
    prop: [16, -112],
    rLeg: [-2, -66],
    cape: [-6, -96],
  }, { cape: 'rHead' });

  // ───────── Widder: ferne Beine, Schwanz ─────────
  const leg = (name, x, z, near) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -34, x + 1, -6, near ? 6.6 : 6, 5), near ? LEG : '#4a3c34', 'fur');
      g.mat(path([[x - 3.6, -6], [x + 4.6, -6], [x + 5, 0, 1], [x + 1, 0, 1], [x + 0.6, -2], [x, 0, 1], [x - 4, 0, 1]]), '#2e2620', 'bone');
    });
  };
  leg('legBf', -23, 2, false);
  leg('legFf', 19, 3, false);
  F.part('tail', { bone: 'tail', z: 4 }, (g) => g.mat(circle(-38, -50, 4.6), WOOL, 'fur'));

  // ───────── Wolliger Körper mit Locken, Satteldecke (Teamzone) ─────────
  F.part('ram', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const pts = [];
    const n = 20;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = i % 2 ? 1 : 1.08;
      pts.push([Math.cos(a) * 38 * r, -42 + Math.sin(a) * 22 * r]);
    }
    const b = blob(pts, 0.45);
    g.mat(b, WOOL, 'fur', { hi: 0.25 });
    g.clipTo(b, (h) => {
      for (let y = -60; y < -20; y += 7) for (let x = -36 + ((y / 7) % 2) * 3.5; x < 40; x += 7) h.stroke(spline([[x - 2.4, y + 1], [x, y - 1.6], [x + 2.4, y + 1]]), WOOL_D, 0.8, { lod: 1 });
    });
  });
  F.part('blanket', { bone: 'body', z: 12, zb: 12, team: true }, (g) => {
    const pts = [[-16, -64], [12, -64], [15, -50]];
    for (let i = 0; i <= 5; i++) pts.push([15 - i * 6.4, -44 + (i % 2 ? 3 : 0), 1]);
    pts.push([-18, -50]);
    g.mat(path(pts), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => {
      for (let i = 0; i < 5; i++) h.fill(poly([[-12 + i * 6, -56], [-9 + i * 6, -59], [-6 + i * 6, -56], [-9 + i * 6, -53]]), P.teamLight, { op: 0.8 });
    });
  });
  F.part('saddle', { bone: 'body', z: 13, zb: 13 }, (g) => {
    g.mat(path([[-14, -68, 1], [-8, -64], [6, -64], [12, -70, 1], [14, -64], [8, -60], [-10, -60], [-16, -64]]), '#6b3e22', 'leather', { hi: 0.4 });
  });
  emblem(F, 'emblem', 'body', 12.5, 6, -52, 2.8);

  // ───────── Kopf mit Doppelspiral-Hörnern und Kristallglöckchen ─────────
  const spiral = (cx, cy, R, turns, s) => {
    const pts = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = -Math.PI / 2 + s * t * turns * Math.PI * 2;
      const r = R * (1 - t * 0.78);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  };
  F.part('hornFar', { bone: 'head', z: 18, zb: 22 }, (g) => {
    g.stroke(spline(spiral(30, -60, 11, 1.4, -1)), '#8a6a42', 5);
  });
  F.part('head', { bone: 'head', z: 20, zb: 20 }, (g) => {
    g.mat(path([[28, -62], [40, -66], [50, -58], [56, -46], [54, -36], [46, -32], [36, -36], [28, -46]]), '#e8dcc4', 'skin', { hi: 0.3 });
    // Woll-Schopf
    g.mat(blob([[28, -62], [34, -68], [42, -68], [46, -62], [38, -58], [30, -58]], 0.5), WOOL, 'fur');
    g.fill(ellipse(53, -40, 1.2, 1.6), '#5a4a40', { lod: 1 });
    // vorgeschobenes Kinn
    g.mat(path([[44, -34], [54, -36], [52, -30], [46, -29]]), '#e8dcc4', 'skin');
  });
  F.part('ramEye', { bone: 'head', z: 21, expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    eye(g, 45, -50, { r: 2.2, iris: '#5a4020', lidColor: '#e8dcc4', lid: 0.55, look: [0.7, 0], lashW: 0.8 });
  });
  F.part('ramEye.hurt', { bone: 'head', z: 21, expr: ['hurt', 'stun'] }, (g) => eyeClosed(g, 45, -50, 2.2, { up: true, lw: 0.9 }));
  F.part('ramEye.death', { bone: 'head', z: 21, expr: 'death' }, (g) => eyeX(g, 45, -50, 1.8));
  F.part('hornNear', { bone: 'head', z: 22, zb: 18, sig: true }, (g) => {
    const pts = spiral(36, -54, 13, 1.5, 1);
    g.stroke(spline(pts), '#6a4a2a', 7.2);
    g.stroke(spline(pts), HORN, 5.4);
    g.lod(1, (h) => {
      for (let i = 2; i < pts.length - 2; i += 3) {
        const [x, y] = pts[i];
        const [x2, y2] = pts[i + 1];
        const nx = -(y2 - y);
        const ny = x2 - x;
        const L = Math.hypot(nx, ny) || 1;
        h.stroke(polyline([[x - (nx / L) * 2.4, y - (ny / L) * 2.4], [x + (nx / L) * 2.4, y + (ny / L) * 2.4]]), '#8a6a42', 0.6);
      }
    });
  });
  F.part('bells', { bone: 'head', z: 23, zb: 23 }, (g) => {
    g.stroke(spline([[32, -40], [40, -33], [48, -32]]), '#6b3e22', 1.4);
    for (const [x, y] of [[35, -36], [40, -32], [45, -31]]) {
      g.mat(path([[x - 2, y], [x - 1.6, y + 4], [x + 1.6, y + 4], [x + 2, y], [x, y - 1.6]]), CRYSTAL, 'glass', { hi: 1 });
    }
  });
  leg('legBn', -19, 15, true);
  leg('legFn', 23, 16, true);

  // ───────── Reiterin ─────────
  F.part('braidsBack', { bone: 'cape', z: 26 }, (g) => {
    for (let i = 0; i < 4; i++) g.mat(ellipse(-8 - i * 2, -92 + i * 4.2, 2.6, 2.4), HAIR, 'hair', { hi: 0.4 });
    g.mat(rrect(-16.6, -79, 5, 2.4, 1), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  F.part('rArmB', { bone: 'rArmB', z: 27 }, (g) => g.mat(limb(-6, -88, 9, -77, 4.6, 4), '#1e6a5a', 'cloth'));
  F.part('rHandB', { bone: 'rHandB', z: 28 }, (g) => {
    g.stroke(polyline([[10, -76], [28, -62], [40, -58]]), '#6b3e22', 1);
    g.mat(circle(10, -76, 2.8), SKIN, 'skin');
  });
  F.part('rTorso', { bone: 'rTorso', z: 30 }, (g) => {
    const c = path([[-10, -66, 1], [-11, -80], [-6, -91], [3, -94], [10, -90], [12, -80], [9, -66, 1]]);
    g.mat(c, COAT, 'cloth');
    g.clipTo(c, (h) => {
      for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) if ((row + col) % 2 === 0) h.fill(poly([[-8 + col * 5, -90 + row * 5], [-5.6 + col * 5, -87.6 + row * 5], [-8 + col * 5, -85.2 + row * 5], [-10.4 + col * 5, -87.6 + row * 5]]), '#3aa08c', { lod: 1 });
    });
    for (const y of [-86, -80, -74]) g.mat(rrect(1, y, 2, 3.4, 0.8), HORN, 'bone', { lod: 1 });
  });
  F.part('rLeg', { bone: 'rLeg', z: 32 }, (g) => {
    g.mat(limb(-3, -66, 9, -61, 5.6, 5), '#5a4a32', 'cloth');
    g.mat(limb(9, -61, 8, -48, 6, 5.4), FUR, 'fur');
    g.mat(path([[4, -49], [12, -49], [15, -45], [15, -43, 1], [4, -43, 1]]), FUR, 'fur');
  });
  F.part('rHead', { bone: 'rHead', z: 34 }, (g) => {
    g.mat(path([[-4, -102], [5, -105], [13, -101], [14, -94], [12, -88], [6, -85.6], [0, -87], [-4, -92]]), SKIN, 'skin');
  });
  faceSet(F, {
    bone: 'rHead',
    z: 35,
    eyes: [[10, -96, 1.9], [3.6, -96, 1.7]],
    iris: '#3a6a5a',
    lidColor: SKIN,
    lid: 0.1,
    brow: { color: '#c85a2a', w: 0.9, lift: 0.4 },
    mouth: [8.4, -90, 3.8],
    mood: 'grin',
    attackMouth: 'shout',
  });
  F.part('freckles', { bone: 'rHead', z: 35.6, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[11.6, -92.4], [12.8, -91.6], [2.6, -92.4], [4, -91.6]]) g.fill(circle(x, y, 0.45), '#c8784a');
  });
  F.part('furhat', { bone: 'rHead', z: 37 }, (g) => {
    g.mat(blob([[-6, -98], [-5, -106], [3, -110], [12, -108], [16, -101], [12, -99], [2, -100]], 0.5), FUR, 'fur', { hi: 0.3 });
    lines(g, [[[0, -106], [2, -101]], [[7, -108], [8, -102]]], '#6a4a2a', 0.6, 1);
  });
  F.part('braidFront', { bone: 'rHead', z: 37.5 }, (g) => {
    for (let i = 0; i < 3; i++) g.mat(ellipse(13 + i * 0.6, -94 + i * 4, 2.2, 2.1), HAIR, 'hair', { hi: 0.4 });
    g.mat(rrect(11.6, -83.4, 4.6, 2.2, 0.8), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
  });
  // Bola mit drei Steinkugeln an Lederschnüren, kreist über dem Kopf
  F.part('bola', { bone: 'prop', z: 38 }, (g) => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const ex = 16 + Math.cos(a) * 13;
      const ey = -112 + Math.sin(a) * 5;
      g.stroke(polyline([[16, -112], [ex, ey]]), '#6b3e22', 0.8);
      g.mat(circle(ex, ey, 2.8), STONE, 'stone');
    }
  });
  // Wurfarm hinter dem Kopf hochgereckt, damit das Gesicht frei bleibt
  F.part('rArmF', { bone: 'rArmF', z: 33 }, (g) => g.mat(limb(5, -88, 15, -108, 4.6, 4), COAT, 'cloth'));
  F.part('rHandF', { bone: 'rHandF', z: 41 }, (g) => g.mat(circle(16, -110, 2.8), SKIN, 'skin'));

  const spin = (n) => {
    const k = [];
    for (let i = 0; i <= n; i++) k.push([i / n, i * 120]);
    return k;
  };
  F.anim({
    // Widder schüttelt die Glöckchen, Reiterin lässt die Bola kreisen
    idle: { p: { nod: 4 }, keys: { prop: { r: spin(3) }, head: { r: [[0, 0], [0.4, 0], [0.48, -6], [0.56, 6], [0.64, -4], [0.72, 0]] } } },
    // Widder trabt mit wippender Wolle
    walk: { p: { stride: 26, bob: 3.6, rock: 4, nod: 6, gallop: false }, keys: { prop: { r: spin(3) } }, ev: { step: [0.25, 0.75] } },
    // Ansturm: gesenkte Hörner im Galopp
    charge: { prog: 'quad.walk', p: { stride: 34, bob: 4, riderLean: 12, head: 16 }, keys: { prop: { r: spin(6) } } },
    // Widder senkt den Kopf und rammt; Reiterin wirbelt die Bola
    attack: { prog: 'quad.idle', hit: 0.55, keys: { head: { r: [[0, 0], [0.45, 18, 'out'], [0.55, -12, 'in'], [0.8, 0]] }, root: { x: [[0, 0], [0.45, -4], [0.55, 6], [1, 0]] }, prop: { r: spin(6) }, rArmF: { r: [[0, 0], [0.5, 10], [0.6, 60], [1, 0]] } } },
    // Glöckchen bimmeln, die Wolle bauscht sich
    hit: { keys: { body: { sx: [[0, 1], [0.2, 1.06], [1, 1]] }, head: { r: [[0, 0], [0.15, -8], [0.3, 6], [1, 0]] } } },
    // Widder legt sich hin, die Reiterin gleitet herunter
    death: { p: { angle: 6 }, keys: { root: { y: [[0, 0], [0.5, 10]] }, rHip: { x: [[0, 0], [0.6, 24]], y: [[0, 0], [0.6, 30, 'in']] }, rTorso: { r: [[0, 0], [0.6, 60]] } } },
  });
}
