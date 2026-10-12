// Geisterkaiserin auf dem Nebeldrachen – langer, wogender Drache aus perlrosa Dunst, darauf die Kaiserin mit Laternenkrone
// (Brief: docs/briefs/spirit-empress-air.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeX, eyeClosed, lines, emblem, INK, WHITE } from '../kit.mjs';
import { empressUpper, EMPRESS } from './spirit-empress-ground.mjs';

export default function spiritEmpressAir(F) {
  const P = F.pal;
  const MIST = P.main;
  const MANE = '#fff4fb';
  const MIST_D = '#e0b0dc';
  const DY = -18;

  F.rig(
    'serpent',
    {
      seg1: [24, -62],
      seg2: [10, -50],
      seg3: [-6, -44],
      seg4: [-20, -54],
      seg5: [-32, -70],
      seg6: [-46, -76],
      head: [32, -64],
      jaw: [44, -60],
      rTorso: [0, -44 + DY],
      rHead: [3, -63 + DY],
      rHat: [3, -80 + DY],
      rArmB: [-9, -60 + DY],
      rHandB: [-12, -40 + DY],
      rArmF: [9, -60 + DY],
      rHandF: [17, -46 + DY],
      rProp: [17, -46 + DY],
    },
    { rHat: 'rHead', rHandB: 'rArmB', rProp: 'rHandF' },
  );

  // ───────── Nebelleib (Signature): Segmentkette aus Dunstwolken, Schwanz bis Kopf ─────────
  const segs = [
    ['seg6', -46, -76, 8, 3],
    ['seg5', -32, -70, 11, 4],
    ['seg4', -20, -56, 13, 5],
    ['seg3', -6, -46, 15, 6],
    ['seg2', 10, -50, 16, 7],
    ['seg1', 25, -62, 14, 8],
  ];
  for (const [bone, cx, cy, r, z] of segs) {
    F.part('mist_' + bone, { bone, z, zb: z, sig: bone === 'seg3' }, (g) => {
      const pts = [];
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = i % 2 ? 0.88 : 1.06;
        pts.push([cx + Math.cos(a) * r * 1.25 * k, cy + Math.sin(a) * r * 0.82 * k]);
      }
      g.mat(blob(pts, 0.5), MIST, 'cloth', { hi: 0.5, line: MIST_D });
      g.lod(1, (h) => h.stroke(spline([[cx - r * 0.6, cy + r * 0.2], [cx - r * 0.2, cy - r * 0.3], [cx + r * 0.2, cy], [cx, cy + r * 0.3]]), MIST_D, 0.7));
    });
  }
  F.part('tailWisp', { bone: 'seg6', z: 2, zb: 2 }, (g) => {
    g.mat(path([[-52, -80], [-62, -90], [-72, -88, 1], [-64, -82], [-54, -72]]), MANE, 'hair', { hi: 0.4 });
  });
  F.part('mane', { bone: 'seg1', z: 8.5, zb: 8.5 }, (g) => {
    for (const [x, y] of [[16, -72], [22, -75], [28, -76]]) g.mat(path([[x - 4, y + 2], [x - 7, y - 8, 1], [x + 2, y]]), MANE, 'hair');
  });

  // ───────── Kaiserin, über den Leib drapiert ─────────
  F.part('drape', { bone: 'rTorso', z: 9, zb: 9 }, (g) => {
    g.mat(path([[-12, -70], [12, -70], [18, -56], [10, -48], [-4, -46], [-16, -50], [-18, -58]]), EMPRESS.JADE, 'cloth', { hi: 0.35 });
    lines(g, [[[-6, -66], [-10, -50]], [[4, -66], [8, -50]]], EMPRESS.JADE_D, 0.7, 1);
  });
  empressUpper(F, { dy: DY, z: 10, n: { torso: 'rTorso', head: 'rHead', hat: 'rHat', armB: 'rArmB', handB: 'rHandB', armF: 'rArmF', handF: 'rHandF', prop: 'rProp' } });
  // Zügelband aus Seide (Teamzone) zur Drachenmähne
  F.part('rein', { bone: 'rHandF', z: 52, team: true }, (g) => {
    g.stroke(spline([[17, -45 + DY], [28, -70], [38, -74]]), P.team, 2.6);
    g.stroke(spline([[17, -45 + DY], [28, -70], [38, -74]]), P.teamLight, 0.7, { lod: 1 });
  });

  // ───────── Drachenkopf mit Bartfäden ─────────
  F.part('dragonHead', { bone: 'head', z: 54, zb: 54 }, (g) => {
    g.mat(blob([[26.2, -73.8], [41.8, -79.0], [57.4, -71.2], [65.2, -60.8], [54.8, -55.6], [36.6, -55.6], [26.2, -60.8]], 0.5), MIST, 'cloth', { hi: 0.5, line: MIST_D });
    g.mat(path([[36.6, -79.0], [34.0, -89.4, 1], [41.8, -80.3]]), '#f8e8c8', 'bone');
    g.mat(path([[44.4, -79.0], [44.4, -90.7, 1], [49.6, -77.7]]), '#f8e8c8', 'bone');
    g.fill(ellipse(61.3, -64.7, 1.2, 0.6), '#a86a9a', { lod: 1 });
  });
  F.part('barbels', { bone: 'head', z: 55, zb: 55 }, (g) => {
    g.stroke(spline([[60.0, -60.8], [67.8, -55.6], [70.4, -45.2], [65.2, -37.4]]), MANE, 1.2);
    g.stroke(spline([[54.8, -58.2], [57.4, -47.8], [52.2, -40.0]]), MANE, 1);
  });
  F.part('jaw', { bone: 'jaw', z: 53.5, zb: 53.5 }, (g) => {
    g.mat(path([[39.2, -58.2], [60.0, -59.5], [54.8, -51.7], [41.8, -51.7]]), MIST_D, 'cloth');
    g.stroke(spline([[41.8, -58.2], [52.2, -58.7], [60.0, -59.5]]), '#a86a9a', 0.7);
  });
  F.part('dragonEye', { bone: 'head', z: 56, expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    eye(g, 47.0, -68.6, { r: 3.2, ratio: 1, iris: '#8a5ab8', lidColor: MIST, lid: 0.15, look: [-9.6, 19.8], lashW: 0.8 });
  });
  F.part('dragonEye.hurt', { bone: 'head', z: 56, expr: ['hurt', 'stun'] }, (g) => eyeClosed(g, 47, -68.6, 3, { up: true, lw: 0.9 }));
  F.part('dragonEye.death', { bone: 'head', z: 56, expr: 'death' }, (g) => eyeX(g, 47, -68.6, 2.4));
  F.part('spiritWave', { bone: 'head', z: 57, state: 'muzzle', glow: true }, (g) => {
    for (const [r, op] of [[8, 0.5], [13, 0.3]]) g.stroke(spline([[60, -66 - r], [60 + r * 0.6, -62], [60, -58 + r]]), '#ffd8f8', 2, { op });
    g.fill(circle(60, -62, 4), '#fff4fb', { op: 0.8 });
  });
  emblem(F, 'emblem', 'seg4', 9.5, -22, -50, 2.8);

  F.anim({
    // Leib wogt in Wellen
    idle: { prog: 'serpent.wave', p: { amp: 7, float: 3 } },
    // schlängelnder Flug
    walk: { prog: 'serpent.wave', p: { amp: 11, waves: 2, float: 2 } },
    // Kopf zurück, Geisterwelle
    attack: { prog: 'serpent.breath', hit: 0.55, p: { jawOpen: 26 } },
    hit: { prog: 'serpent.wave', keys: { seg3: { sx: [[0, 1], [0.2, 1.1], [1, 1]] } } },
    spawn: { prog: 'serpent.wave', keys: { root: { sx: [[0, 0.3], [0.6, 1]], sy: [[0, 0.3], [0.6, 1]] }, alpha: [[0, 0], [0.5, 1]] } },
    // Nebel löst sich auf, die Kaiserin verblasst
    death: { prog: 'serpent.wave', keys: { expr: [[0, 1, 'death']], root: { sx: [[0, 1], [1, 1.4]], y: [[0, 0], [1, -10]] }, alpha: [[0, 1], [1, 0, 'io']] } },
  });
}
