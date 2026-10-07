// Prinz – ungeduldiger Turnierreiter mit Froschmaul-Stechhelm und Krönchen auf einem Apfelschimmel, gestreifte Lanze
// (Brief: docs/briefs/prince.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeX, eyeClosed, lines, stitches, chainmail, emblem, INK, WHITE } from '../kit.mjs';

export default function prince(F) {
  const P = F.pal;
  const FROG = P.main;
  const GOLD = P.acc;
  const GREY = '#d6d8d2';
  const DAPPLE = '#9ea29a';
  const GREY_D = '#b0b4aa';
  const MANE = '#f0f0ea';
  const HOOF = '#5a5048';
  const CREAM = '#f4efe2';
  const LEATHER = '#6b3e22';
  const MAIL = '#8d97a3';

  F.rig(
    'rider',
    {
      body: [0, -50],
      head: [34, -78],
      jaw: [52, -76],
      ear: [44, -96],
      tail: [-34, -60],
      legBf: [-24, -40],
      legFf: [22, -40],
      legBn: [-19, -38],
      legFn: [27, -38],
      rHip: [-4, -70],
      rTorso: [-4, -71],
      rHead: [2, -98],
      rArmB: [-6, -92],
      rHandB: [10, -80],
      rArmF: [4, -92],
      rHandF: [12, -82],
      prop: [12, -82],
      rLeg: [-2, -70],
      cape: [-10, -66],
    },
    { cape: 'body' },
  );

  // ───────── Pferd: hintere Beine, Schweif ─────────
  const leg = (name, x, z, near) => {
    F.part(name, { bone: name, z }, (g) => {
      const c = near ? GREY : GREY_D;
      g.mat(limb(x, -44, x + 1, -20, near ? 8.6 : 7.6, 6), c, 'fur', { hi: 0.2 });
      g.mat(limb(x + 1, -21, x + 1, -6, 5.2, 4.6), c, 'fur', { hi: 0.2 });
      g.mat(rrect(x - 3.6, -7, 9.2, 7, 1.6), HOOF, 'bone');
      if (near) g.lod(1, (h) => h.fill(ellipse(x + 2, -30, 1.6, 1.2), DAPPLE, { op: 0.8 }));
    });
  };
  leg('legBf', -25, 2, false);
  leg('legFf', 21, 3, false);
  F.part('tail', { bone: 'tail', z: 4 }, (g) => {
    g.mat(path([[-32, -64], [-40, -60], [-44, -46], [-44, -30], [-40, -22, 1], [-38, -32], [-36, -46], [-31, -56]]), MANE, 'hair', { hi: 0.4 });
    lines(g, [[[-38, -56], [-41, -38]], [[-35, -52], [-38, -34]]], '#c8c8c0', 0.6, 1);
  });

  // ───────── Pferdekörper mit Schabracke (Teamzone) ─────────
  F.part('horse', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const b = blob([[-36, -54], [-30, -66], [-12, -70], [10, -69], [26, -64], [34, -54], [30, -40], [12, -34], [-12, -34], [-30, -38]], 0.5);
    g.mat(b, GREY, 'fur', { hi: 0.3 });
    g.clipTo(b, (h) => {
      for (const [x, y, r] of [[-22, -50, 3], [-12, -44, 2.4], [14, -48, 2.6], [22, -42, 2], [0, -40, 2.2]]) h.fill(circle(x, y, r), DAPPLE, { op: 0.7, lod: 1 });
    });
  });
  F.part('caparison', { bone: 'body', z: 12, zb: 12, team: true }, (g) => {
    const pts = [[-30, -64], [22, -66], [24, -50]];
    for (let i = 0; i <= 8; i++) pts.push([24 - i * 6.6, -34 + (i % 2 ? 3.4 : 0), 1]);
    pts.push([-32, -48]);
    const c = path(pts);
    g.mat(c, P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
    g.stroke(polyline(pts.slice(2, 12).map(([x, y]) => [x, y - 1.4])), GOLD, 1, { lod: 1 });
    g.lod(1, (h) => {
      for (const [x, y] of [[-16, -52], [4, -54]]) {
        h.fill(circle(x, y, 2.4), P.teamLight, { op: 0.8 });
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          h.fill(ellipse(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 1.4, 0.8, (a * 180) / Math.PI), P.teamLight, { op: 0.6 });
        }
      }
    });
  });
  F.part('saddle', { bone: 'body', z: 13, zb: 13 }, (g) => {
    g.mat(path([[-16, -70, 1], [-10, -66], [6, -66], [12, -72, 1], [14, -66], [8, -62], [-12, -62], [-18, -66]]), LEATHER, 'leather', { hi: 0.4 });
    g.mat(rrect(-4, -66, 4, 4, 1), GOLD, 'gold', { lod: 1 });
  });
  emblem(F, 'emblem', 'body', 12.5, -6, -46, 3);

  // ───────── Hals und Kopf mit Zaumzeug und Glöckchen ─────────
  F.part('neck', { bone: 'body', z: 14, zb: 14 }, (g) => {
    g.mat(path([[16, -66], [26, -84], [36, -98], [46, -96], [42, -84], [36, -64], [30, -52], [18, -54]]), GREY, 'fur', { hi: 0.3 });
  });
  F.part('mane', { bone: 'body', z: 14.5, zb: 14.5 }, (g) => {
    const pts = [[18, -68]];
    for (let i = 0; i <= 6; i++) pts.push([20 + i * 3.6 - 2.6, -70 - i * 4.6], [20 + i * 3.6 + 1.6, -66 - i * 4.6, 1]);
    pts.push([42, -100], [36, -98]);
    g.mat(path(pts), MANE, 'hair', { hi: 0.4 });
  });
  F.part('head', { bone: 'head', z: 20, zb: 20 }, (g) => {
    g.mat(path([[34, -100], [44, -104], [54, -96], [62, -84], [63, -76], [57, -72], [48, -76], [38, -86]]), GREY, 'fur', { hi: 0.35 });
    g.mat(ellipse(59, -77, 4.4, 4), '#c8c4bc', 'skin', { line: '#8a867e', lw: 0.6 });
    g.fill(ellipse(60.6, -77.4, 1, 1.4), '#4a4440', { lod: 1 });
  });
  F.part('bridle', { bone: 'head', z: 21, zb: 21 }, (g) => {
    g.stroke(polyline([[42, -98], [52, -78], [60, -80]]), LEATHER, 1.2);
    g.stroke(polyline([[46, -90], [56, -88]]), LEATHER, 1);
    g.mat(circle(51, -76, 1.8), GOLD, 'gold');
    g.lod(1, (h) => {
      for (const [x, y] of [[44, -84], [47, -82]]) h.mat(circle(x, y, 1.3), GOLD, 'gold');
    });
  });
  F.part('horseEye.idle', { bone: 'head', z: 22, expr: ['idle', 'sleep', 'attack', 'ability'] }, (g) => {
    eye(g, 50, -92, { r: 2.2, ratio: 1.1, iris: '#3a2a22', lidColor: GREY, lid: 0.25, look: [0.6, 0], lashW: 0.8 });
  });
  F.part('horseEye.hurt', { bone: 'head', z: 22, expr: ['hurt', 'stun'] }, (g) => eyeClosed(g, 50, -92, 2.2, { up: true, lw: 0.9 }));
  F.part('horseEye.death', { bone: 'head', z: 22, expr: 'death' }, (g) => eyeX(g, 50, -92, 1.8));
  F.part('ears', { bone: 'ear', z: 19, zb: 22 }, (g) => {
    g.mat(path([[38, -100], [38, -110, 1], [44, -102]]), GREY_D, 'fur');
    g.mat(path([[42, -101], [44, -112, 1], [48, -102]]), GREY, 'fur');
  });

  // ───────── Nahe Beine ─────────
  leg('legBn', -20, 15, true);
  leg('legFn', 26, 16, true);

  // ───────── Reiter ─────────
  F.part('rArmB', { bone: 'rArmB', z: 27 }, (g) => g.mat(limb(-6, -92, 9, -81, 5, 4.4), MAIL, 'metal'));
  F.part('rHandB', { bone: 'rHandB', z: 28 }, (g) => {
    g.stroke(polyline([[10, -80], [30, -84], [44, -88]]), LEATHER, 1);
    g.mat(circle(10, -80, 3), '#9aa3ad', 'metal');
  });
  F.part('rTorso', { bone: 'rTorso', z: 30 }, (g) => {
    const t = path([[-11, -70, 1], [-12, -84], [-7, -95], [3, -98], [10, -94], [12, -84], [8, -70, 1]]);
    g.mat(t, MAIL, 'metal');
    chainmail(g, t, [-12, -99, 13, -69], 1.3, '#6d7682');
    const tab = path([[-10, -94], [9, -94], [11, -72], [-11, -72]]);
    g.mat(tab, FROG, 'cloth', { hi: 0.3 });
    // Seerosen-Stickerei
    g.lod(1, (h) => {
      h.fill(circle(0, -84, 2.4), '#f4c8d8');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        h.fill(ellipse(Math.cos(a) * 3, -84 + Math.sin(a) * 3, 1.6, 0.9, (a * 180) / Math.PI), '#f8e0e8');
      }
    });
    g.mat(rrect(-11, -76, 22, 3, 1), GOLD, 'gold', { lod: 1 });
  });
  F.part('rLeg', { bone: 'rLeg', z: 32 }, (g) => {
    g.mat(limb(-3, -70, 9, -64, 6, 5.4), MAIL, 'metal');
    g.mat(limb(9, -64, 8, -50, 5, 4.4), '#4a3424', 'leather');
    g.mat(path([[5, -51], [12, -51], [15, -48], [15, -46, 1], [5, -46, 1]]), '#4a3424', 'leather');
    g.mat(rrect(6, -46, 8, 2.4, 0.8), GOLD, 'gold');
    g.stroke(polyline([[4.6, -48], [1, -47], [-1, -49]]), GOLD, 0.8, { lod: 1 });
  });
  // Froschmaul-Stechhelm (Signature) mit Krönchen
  F.part('helm', { bone: 'rHead', z: 34, sig: true }, (g) => {
    const h = blob([[-8, -100], [-6, -110], [2, -115], [12, -114], [18, -108], [19, -100], [14, -95], [2, -94], [-6, -95]], 0.55);
    g.mat(h, FROG, 'metal', { hi: 0.8 });
    // Augenbuckel
    g.mat(circle(4, -115, 4), FROG, 'metal', { hi: 0.8 });
    g.mat(circle(13, -114, 4.4), FROG, 'metal', { hi: 0.8 });
    g.lod(1, (k) => {
      k.fill(ellipse(-3, -104, 1.6, 1, 30), '#6a9a2a', { op: 0.8 });
      k.fill(circle(16, -105, 1), '#6a9a2a', { op: 0.7 });
    });
  });
  // Sehschlitz als Maul, Augen dahinter
  F.part('slit', { bone: 'rHead', z: 35 }, (g) => {
    g.fill(path([[-4, -103], [8, -101.6], [19.6, -104], [19, -100.6], [8, -98.6], [-4, -100.6]]), '#16131c');
  });
  F.part('rEyes.idle', { bone: 'rHead', z: 35.5, view: 'front', expr: ['idle', 'sleep'] }, (g) => {
    for (const [x, r] of [[11, 1.3], [16, 1.4]]) g.fill(circle(x, -101.4, r), '#fff4c0');
  });
  F.part('rEyes.attack', { bone: 'rHead', z: 35.5, view: 'front', expr: ['attack', 'ability'] }, (g) => {
    for (const x of [11, 16]) g.fill(rrect(x - 1.6, -102, 3.2, 1.1, 0.4), '#fff4c0');
  });
  F.part('rEyes.hurt', { bone: 'rHead', z: 35.5, view: 'front', expr: ['hurt', 'stun'] }, (g) => {
    for (const [x, r] of [[11, 1.8], [16, 2]]) g.fill(circle(x, -101.4, r), '#fff4c0');
  });
  F.part('frogEyes', { bone: 'rHead', z: 35.4 }, (g) => {
    g.fill(circle(4.6, -115.6, 1.6), '#1a1a10');
    g.fill(circle(13.6, -114.6, 1.8), '#1a1a10');
    g.fill(circle(4, -116.2, 0.6), '#ffffff', { lod: 1 });
    g.fill(circle(13, -115.4, 0.6), '#ffffff', { lod: 1 });
  });
  F.part('crown', { bone: 'rHead', z: 36 }, (g) => {
    g.mat(path([[5, -118], [5, -123, 1], [7.4, -120.4], [9, -124.4, 1], [10.6, -120.4], [13, -123, 1], [13, -118]]), GOLD, 'gold');
    g.mat(circle(9, -120, 0.9), '#e84a5a', 'gem', { lod: 1 });
  });

  // ───────── Turnierlanze mit Spiralstreifen, Brechscheibe, Wimpel (Teamzone) ─────────
  const L0 = [-14, -80];
  const L1 = [92, -100];
  const lx = (t) => [L0[0] + (L1[0] - L0[0]) * t, L0[1] + (L1[1] - L0[1]) * t];
  F.part('lance', { bone: 'prop', z: 38 }, (g) => {
    const ux = (L1[0] - L0[0]) / 107.9;
    const uy = (L1[1] - L0[1]) / 107.9;
    const nx = -uy;
    const ny = ux;
    const w0 = 2.6;
    const w1 = 1.1;
    const shaft = path([[L0[0] + nx * w0, L0[1] + ny * w0], [L1[0] + nx * w1, L1[1] + ny * w1], [L1[0] + ux * 2.4, L1[1] + uy * 2.4], [L1[0] - nx * w1, L1[1] - ny * w1], [L0[0] - nx * w0, L0[1] - ny * w0]]);
    g.mat(shaft, CREAM, 'wood', { hi: 0.5 });
    g.clipTo(shaft, (h) => {
      for (let t = 0.24; t < 1; t += 0.07) {
        const [x, y] = lx(t);
        h.fill(path([[x - nx * 4, y - ny * 4], [x + ux * 2.4 - nx * 4, y + uy * 2.4 - ny * 4], [x + ux * 4.4 + nx * 4, y + uy * 4.4 + ny * 4], [x + ux * 2 + nx * 4, y + uy * 2 + ny * 4]]), FROG);
      }
    });
    // Brechscheibe am Griff
    const [vx, vy] = lx(0.22);
    g.mat(ellipse(vx, vy, 2.4, 7, -11), '#9aa3ad', 'metal', { hi: 0.9 });
    // stumpfe Krönchenspitze
    g.mat(path([[L1[0] - 1, L1[1] - 3], [L1[0] + 1, L1[1] - 5.6, 1], [L1[0] + 2.6, L1[1] - 3], [L1[0] + 4.6, L1[1] - 4.6, 1], [L1[0] + 5, L1[1] + 0.6], [L1[0] + 1, L1[1] + 2.6]]), GOLD, 'gold');
  });
  F.part('pennant', { bone: 'prop', z: 38.5, team: true }, (g) => {
    const [x, y] = lx(0.82);
    g.mat(path([[x, y], [x - 4, y + 9], [x - 12, y + 12, 1], [x - 8, y + 6], [x - 3, y - 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
  });
  F.part('rArmF', { bone: 'rArmF', z: 40 }, (g) => g.mat(limb(4, -92, 11.6, -83, 5, 4.4), MAIL, 'metal'));
  F.part('rHandF', { bone: 'rHandF', z: 41 }, (g) => g.mat(path([[8, -86], [15, -86], [16, -80], [9, -79]]), '#9aa3ad', 'metal', { hi: 0.8 }));

  F.anim({
    // Pferd scharrt und schüttelt die Mähne; Prinz zupft am Krönchen
    idle: { p: { nod: 5, head: -4 }, keys: { legFn: { r: [[0, 0], [0.2, -22], [0.3, 6], [0.4, -18], [0.5, 0]] }, head: { r: [[0, 0], [0.6, 0], [0.68, -8], [0.76, 6], [0.84, -4], [0.92, 0]] }, rArmB: { r: [[0, 0], [0.7, 0], [0.8, -60], [0.9, -60], [1, 0]] } } },
    // Trab mit wippender Lanze
    walk: { p: { stride: 26, bob: 3.6, rock: 4, nod: 6, riderLean: 4, ride: 2.4, gallop: false }, keys: { prop: { r: [[0, -3], [0.5, 3], [1, -3]] } }, ev: { step: [0.25, 0.75] } },
    // Ansturm: Lanze gesenkt, gestreckter Galopp, Schabracke flach im Wind
    charge: { prog: 'quad.walk', p: { stride: 38, bob: 5, rock: 5, nod: 8, riderLean: 14, ride: 3 }, keys: { prop: { r: [[0, 8], [1, 8]] } } },
    // Lanze zurück, Stoß im Vorbeireiten, Pferd bäumt sich leicht auf
    attack: { prog: 'quad.idle', hit: 0.55, keys: { prop: { x: [[0, 0], [0.42, -10, 'out'], [0.55, 12, 'in'], [0.75, 4], [1, 0]], r: [[0, 0], [0.42, -4], [0.55, 6], [1, 0]] }, body: { r: [[0, 0], [0.45, -7], [0.6, 2], [1, 0]] }, legFn: { r: [[0, 0], [0.45, -30], [0.6, 0]] }, legFf: { r: [[0, 0], [0.45, -24], [0.6, 0]] }, rTorso: { r: [[0, 0], [0.42, -6], [0.55, 10], [1, 0]] } }, ev: { strike: 0.55 } },
    hit: { keys: { root: { x: [[0, 0], [0.2, -4], [1, 0]] }, rHead: { r: [[0, 0], [0.15, -8], [0.3, 6], [1, 0]] } } },
    // Pferd knickt ein, der Prinz rollt ab; das Krönchen kullert
    death: { p: { angle: 10 }, keys: { rHip: { x: [[0, 0], [0.6, 26, 'out']], y: [[0, 0], [0.25, -10, 'out'], [0.6, 30, 'in']] }, rTorso: { r: [[0, 0], [0.6, 160]] }, legFn: { r: [[0, 0], [0.4, 60]] }, legFf: { r: [[0, 0], [0.4, 60]] } } },
  });
}
