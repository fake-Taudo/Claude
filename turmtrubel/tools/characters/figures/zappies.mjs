// Zappys – drei kleine, aufgekratzte Zap-Roboter mit Glühbirnen-Köpfen, Batterie-Rucksäcken und Federbeinen
// (Brief: docs/briefs/zappies.md). Varianten: 0 = Birne rund, 1 = Birne spitz, 2 = Birne gedreht
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function zappies(F) {
  const P = F.pal;
  const TIN = P.main;
  const VOLT = P.acc;
  const BATT = '#2f3640';
  const SPRING = '#9aa3ad';
  const BRASS = '#c8a046';
  const GLASS = '#e8f8ff';

  F.rig('biped', {
    hip: [0, -22],
    torso: [0, -24],
    head: [2, -40],
    hat: [2, -62],
    back: [-10, -34],
    armB: [-8, -36],
    handB: [-10, -26],
    armF: [9, -36],
    handF: [14, -28],
    prop: [14, -28],
    legB: [-4, -20],
    footB: [-4, -2],
    legF: [4, -20],
    footF: [5, -2],
    cape: [0, -38],
  });

  // ───────── Batterie-Rucksack mit Pol-Kappen und Streifen (Teamzone) ─────────
  F.part('battery', { bone: 'back', z: 3, zb: 46 }, (g) => {
    g.mat(rrect(-20, -46, 12, 24, 3), BATT, 'metal', { hi: 0.6 });
    g.mat(rrect(-17, -49, 6, 3, 1), BRASS, 'metal');
  });
  F.part('battStripe', { bone: 'back', z: 3.5, zb: 46.5, team: true }, (g) => g.mat(rrect(-20, -38, 12, 5, 0.6), P.team, 'metal', { line: P.teamDeep, lw: 0.4 }));
  // ───────── Federbeine mit Fußkappen (Teamzone) ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([x + (i % 2 ? 2.6 : -2.6), -20 + i * 2]);
      g.stroke(polyline(pts), SPRING, 1.4);
    });
    F.part(foot, { bone: foot, z: z + 1, team: true }, (g) => g.mat(path([[x - 4, -4], [x + 4, -4.4], [x + 7, -1, 1], [x + 7, 0, 1], [x - 4.6, 0, 1]]), P.team, 'leather', { line: P.teamDeep, hi: 0.5 }));
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 4, 8);
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.stroke(polyline([[-8, -36], [-10, -28]]), SPRING, 1.4);
    g.mat(circle(-10, -26, 2.2), TIN, 'metal');
  });

  // ───────── Blechgehäuse mit Delle ─────────
  F.part('body', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const b = rrect(-9, -40, 19, 22, 4);
    g.mat(b, TIN, 'metal', { hi: 0.8 });
    g.clipTo(b, (h) => {
      for (const y of [-34, -26]) h.fill(rrect(-10, y, 22, 1.6, 0), '#8a929c');
      h.fill(ellipse(6, -22, 2.4, 1.6), '#8a929c', { op: 0.7, lod: 1 });
    });
    g.lod(1, (h) => rivets(h, [[-6, -38], [7, -38], [-6, -20], [7, -20]], 0.6, '#e8ecf0'));
  });
  // ───────── Glühbirnen-Kopf (Signature) mit Messingfassung, drei Formen ─────────
  F.part('socket', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(rrect(-4, -46, 12, 6, 1.6), BRASS, 'gold', { hi: 0.8 });
    g.lod(1, (h) => lines(h, [[[-4, -44], [8, -44.6]], [[-4, -42], [8, -42.6]]], '#8a6a2a', 0.5, 1));
  });
  const bulbs = [
    (cx) => blob([[cx - 7, -50], [cx - 9, -58], [cx - 5, -66], [cx + 2, -68], [cx + 9, -66], [cx + 12, -58], [cx + 10, -50]], 0.8),
    (cx) => blob([[cx - 6, -50], [cx - 8, -58], [cx - 3, -66], [cx + 2, -74], [cx + 7, -66], [cx + 11, -58], [cx + 9, -50]], 0.7),
    (cx) => blob([[cx - 6, -50], [cx - 9, -57], [cx - 7, -65], [cx, -70], [cx + 8, -68], [cx + 12, -60], [cx + 9, -50]], 0.75),
  ];
  bulbs.forEach((mk, v) => {
    F.part('bulb' + v, { bone: 'head', z: 31, zb: 31, sig: true, variant: v }, (g) => {
      g.mat(mk(2), GLASS, 'glass', { line: '#7aa8c0', hi: 0.95 });
      g.fill(ellipse(-2, -62, 2, 4, 20), '#ffffff', { op: 0.7 });
    });
  });
  // Gesicht als Glühfaden
  F.part('face.idle', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    for (const x of [1, 8]) g.fill(circle(x, -58, 1.2), '#6a6a6a');
    g.stroke(spline([[0, -53.6], [4.6, -52.6], [9, -54]]), '#6a6a6a', 0.8);
  });
  F.part('face.attack', { bone: 'head', z: 32, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    g.fill(circle(4.6, -58, 9), VOLT, { op: 0.4 });
    for (const x of [1, 8]) g.fill(circle(x, -58, 1.4), '#fff8c0');
    g.stroke(spline([[-1, -54], [4.6, -51.6], [10, -54]]), '#fff8c0', 1);
  });
  F.part('face.hurt', { bone: 'head', z: 32, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    for (const x of [1, 8]) g.stroke(circle(x, -58, 1.6), '#4a4a4a', 0.6);
    g.fill(ellipse(4.6, -53, 1.4, 1.6), '#4a4a4a');
  });
  F.part('face.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    g.stroke(polyline([[-4, -62], [2, -56], [6, -60], [12, -54]]), '#3a3a3a', 0.8);
  });
  // Antenne mit Kugelende
  F.part('antenna', { bone: 'hat', z: 33, zb: 33 }, (g) => {
    g.stroke(polyline([[4, -66], [8, -78]]), SPRING, 1);
    g.mat(circle(8.6, -80, 2.4), '#c8ccd2', 'metal', { hi: 0.9 });
  });
  F.part('zap', { bone: 'hat', z: 34, state: 'muzzle', glow: true }, (g) => {
    g.stroke(polyline([[10, -80], [16, -76], [14, -72], [22, -70], [20, -66], [30, -62]]), VOLT, 1.8);
    g.stroke(polyline([[10, -80], [16, -76], [14, -72], [22, -70], [20, -66], [30, -62]]), '#ffffff', 0.6);
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => g.stroke(polyline([[9, -36], [14, -30]]), SPRING, 1.4));
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(14, -28, 2.2), TIN, 'metal'));
  emblem(F, 'emblem', 'torso', 21, 1, -30, 1.8, { zb: 21 });

  F.anim({
    // Birne flackert, Federbeine wippen
    idle: { prog: 'still', keys: { root: { sy: [[0, 1], [0.25, 0.92], [0.5, 1.04], [0.75, 0.94], [1, 1]] }, expr: [[0.4, 0.46, 'attack'], [0.52, 0.56, 'attack']] } },
    // hüpfen auf Federn
    walk: { prog: 'still', keys: { root: { y: [[0, 0], [0.25, -6, 'out'], [0.5, 0, 'in'], [0.75, -6, 'out'], [1, 0, 'in']], sy: [[0, 0.88], [0.1, 1.06], [0.4, 1], [0.5, 0.88], [0.6, 1.06], [0.9, 1], [1, 0.88]] } } },
    // Birne leuchtet auf, Blitz aus der Antenne
    attack: { prog: 'still', hit: 0.55, keys: { root: { sy: [[0, 1], [0.4, 0.88], [0.55, 1.08], [0.8, 1]] }, show: { muzzle: [[0.55, 0.75]] }, expr: [[0.3, 0.8, 'attack']] }, ev: { release: 0.55 } },
    // Birne flackert aus und wieder an
    hit: { prog: 'generic.hit' },
    // federn beim Landen nach
    spawn: { prog: 'still', keys: { root: { sy: [[0, 1.3], [0.3, 0.7], [0.5, 1.15], [0.7, 0.92], [1, 1]] } } },
    // Birne zerplatzt mit Funken
    death: { prog: 'generic.death' },
  });
}
