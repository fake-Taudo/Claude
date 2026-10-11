// Funki – käferförmiger Lade-Panzer auf sechs Beinen mit großer Kondensator-Schüssel und Ladebalken
// (Brief: docs/briefs/sparky.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function sparky(F) {
  const P = F.pal;
  const SHELL = P.main;
  const VOLT = P.acc;
  const COPPER = '#c87a40';
  const LEG = '#2c3a2c';
  const GLASS = '#d8fbff';
  const SHELL_D = '#26402a';

  F.rig(
    'quadruped',
    {
      body: [0, -30],
      head: [32, -30],
      jaw: [36, -24],
      ear: [0, -44],
      tail: [-34, -30],
      legFn: [22, -20],
      legFf: [24, -22],
      legBn: [-22, -20],
      legBf: [-20, -22],
      legMn: [0, -18],
      legMf: [2, -20],
      dish: [-4, -48],
    },
    { legMn: 'body', legMf: 'body', dish: 'body' },
  );

  // dünnes, geknicktes Insektenbein
  const leg = (name, x, z, dark, dir) => {
    F.part(name, { bone: name, z }, (g) => {
      const c = dark ? '#1e2a1e' : LEG;
      g.mat(limb(x, -20, x + dir * 8, -28, 2.2, 2), c, 'metal', { hi: 0.5 });
      g.mat(limb(x + dir * 8, -28, x + dir * 12, 0, 2, 1.6), c, 'metal', { hi: 0.5 });
      g.mat(circle(x + dir * 8, -28, 2.6), COPPER, 'metal');
      g.mat(ellipse(x + dir * 12.6, -1, 3, 1.4), c, 'metal');
    });
  };
  leg('legFf', 24, 2, true, 1);
  leg('legMf', 2, 2.2, true, 0.4);
  leg('legBf', -20, 2.4, true, -1);

  // ───────── Kondensator-Schüssel (Signature) mit Spule und Ladebalken ─────────
  F.part('dish', { bone: 'dish', z: 4, zb: 4, sig: true }, (g) => {
    g.mat(limb(-4, -36, -6, -56, 3, 3), '#4a4e58', 'metal');
    // Parabolschüssel, schräg nach vorn oben geneigt: Rückseite, Innenwölbung, Rand
    g.mat(ellipse(-4, -70, 28, 12, -38), '#a85a24', 'metal', { hi: 0.6 });
    g.mat(ellipse(-1, -73, 25, 9.6, -38), COPPER, 'metal', { hi: 0.95 });
    g.fill(ellipse(2, -76, 17, 6, -38), '#e8a060', { op: 0.6 });
    g.lod(1, (h) => {
      for (const k of [0.45, 0.75]) h.stroke(ellipse(-1, -73, 25 * k, 9.6 * k, -38), '#a85a24', 0.6);
      h.fill(ellipse(-12, -66, 4, 2, -38), '#5a3418', { op: 0.5 });
    });
    // Spule im Brennpunkt auf drei Streben
    for (const [x, y] of [[-16, -62], [12, -86], [-8, -84]]) g.stroke(polyline([[x, y], [10, -92]]), '#4a4e58', 0.9);
    g.mat(rrect(6, -100, 8, 12, 2).rot(-38, 10, -94), GLASS, 'glass', { line: '#6a9ab0' });
    g.lod(1, (h) => {
      for (let i = 0; i < 3; i++) h.stroke(polyline([[6 + i * 2, -92 - i * 2.6], [12 + i * 2, -96 - i * 2.6]]), COPPER, 0.8);
    });
    // fünf Ladebalken-Fassungen am Rand
    for (let i = 0; i < 5; i++) {
      const a = ((150 + i * 18) * Math.PI) / 180;
      const x = -1 + Math.cos(a) * 25 * Math.cos(-0.663) - Math.sin(a) * 9.6 * Math.sin(-0.663);
      const y = -73 + Math.cos(a) * 25 * Math.sin(-0.663) + Math.sin(a) * 9.6 * Math.cos(-0.663);
      g.mat(rrect(x - 3, y - 1.6, 6, 3.2, 1), '#3a3e46', 'metal');
    }
  });
  for (let i = 0; i < 5; i++) {
    const a = ((150 + i * 18) * Math.PI) / 180;
    const x = -1 + Math.cos(a) * 25 * Math.cos(-0.663) - Math.sin(a) * 9.6 * Math.sin(-0.663);
    const y = -73 + Math.cos(a) * 25 * Math.sin(-0.663) + Math.sin(a) * 9.6 * Math.cos(-0.663);
    F.part('bar' + i, { bone: 'dish', z: 4.5, zb: 4.5, glow: true, state: ['bar' + i, 'full', 'attack'] }, (g) => g.fill(rrect(x - 2.4, y - 1, 4.8, 2, 0.8), VOLT));
  }
  // Antenne mit Wimpel (Teamzone)
  F.part('antenna', { bone: 'dish', z: 3.5, zb: 3.5, team: true }, (g) => {
    g.stroke(polyline([[-28, -56], [-34, -84]]), '#9aa3ad', 1.2);
    g.mat(circle(-34, -85, 1.6), '#c8ccd2', 'metal');
    g.mat(path([[-33, -82], [-22, -80], [-26, -77], [-22, -74], [-32, -74]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Käferpanzer mit Flügeldecken-Naht und Panzerstreifen (Teamzone) ─────────
  F.part('shell', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const s = blob([[-36, -24], [-30, -40], [-8, -48], [18, -46], [34, -36], [36, -20], [10, -14], [-24, -14]], 0.7);
    g.mat(s, SHELL, 'metal', { hi: 0.8 });
    g.clipTo(s, (h) => {
      h.fill(path([[-40, -22], [40, -22], [40, -10], [-40, -10]]), SHELL_D);
      h.lod(1, (k) => rivets(k, [[-26, -24], [-10, -22], [6, -22], [22, -24]], 1, '#9aa3ad'));
      // Brandflecken
      h.fill(ellipse(-20, -36, 4, 2), '#1a1a14', { op: 0.5, lod: 1 });
    });
    g.lod(1, (h) => h.stroke(spline([[-34, -30], [-6, -40], [26, -38]]), SHELL_D, 1));
  });
  F.part('stripe', { bone: 'body', z: 11, zb: 11, team: true }, (g) => g.mat(path([[-30, -34], [-6, -42], [24, -40], [26, -36], [-6, -38], [-30, -30]]), P.team, 'metal', { line: P.teamDeep, lw: 0.5 }));
  F.part('cables', { bone: 'body', z: 11.5, zb: 3 }, (g) => g.stroke(spline([[-6, -42], [-14, -50], [-8, -56]]), '#1a1a1e', 1.6));

  // ───────── Kopf mit zwei Frontlampen als Augen ─────────
  F.part('head', { bone: 'head', z: 12, zb: 12 }, (g) => {
    g.mat(blob([[26, -38], [38, -40], [46, -32], [44, -20], [30, -18], [24, -26]], 0.6), SHELL_D, 'metal', { hi: 0.7 });
    for (const [x, y] of [[40, -32], [33, -32]]) g.mat(circle(x, y, 4.2), '#3a3e46', 'metal');
  });
  F.part('lamps.idle', { bone: 'head', z: 13, view: 'front', expr: ['idle', 'sleep'], glow: true }, (g) => {
    for (const [x, y] of [[40, -32], [33, -32]]) {
      g.fill(circle(x, y, 3), '#f0fff8');
      g.fill(path([[x - 3.2, y - 3.2], [x + 3.2, y - 3.2], [x + 3.2, y - 0.6], [x - 3.2, y - 1.2]]), SHELL_D);
    }
  });
  F.part('lamps.attack', { bone: 'head', z: 13, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    for (const [x, y] of [[40, -32], [33, -32]]) {
      g.fill(circle(x, y, 5), VOLT, { op: 0.4 });
      g.fill(circle(x, y, 3.2), '#ffffff');
    }
  });
  F.part('lamps.off', { bone: 'head', z: 13, view: 'front', expr: ['hurt', 'stun', 'death'] }, (g) => {
    for (const [x, y] of [[40, -32], [33, -32]]) g.fill(circle(x, y, 3), '#4a5058');
  });
  F.part('blast', { bone: 'dish', z: 46, state: 'muzzle', glow: true }, (g) => {
    g.fill(ellipse(22, -110, 16, 9, -38), '#ffffff', { op: 0.9 });
    g.fill(ellipse(36, -124, 22, 12, -38), VOLT, { op: 0.5 });
  });
  F.part('smoke', { bone: 'dish', z: 46, state: 'death' }, (g) => {
    for (const [x, y, r] of [[-6, -70, 6], [4, -82, 7], [-12, -86, 5]]) g.fill(circle(x, y, r), '#8a8a90', { op: 0.6 });
  });

  leg('legFn', 22, 20, false, 1);
  leg('legMn', 0, 20.2, false, 0.4);
  leg('legBn', -22, 20.4, false, -1);
  emblem(F, 'emblem', 'body', 21, 6, -28, 2.6);

  // Laufzyklus: wellenförmiger Beintakt
  const wave = (ph) => [[0, ph], [0.25, -ph], [0.5, ph], [0.75, -ph], [1, ph]];
  F.anim({
    // Ladebalken füllen sich nacheinander, Beine trippeln
    idle: { prog: 'still', keys: { show: { bar0: [[0.1, 1]], bar1: [[0.3, 1]], bar2: [[0.5, 1]], bar3: [[0.7, 1]], bar4: [[0.9, 1]] }, body: { y: [[0, 0], [0.5, -0.8], [1, 0]] }, legFn: { r: [[0, 0], [0.2, 6], [0.3, 0]] }, legBn: { r: [[0, 0], [0.6, 0], [0.7, -6], [0.8, 0]] } } },
    // Krabbeln mit wellenförmigem Beintakt
    walk: { prog: 'still', keys: { legFn: { r: wave(14) }, legBf: { r: wave(14) }, legMf: { r: wave(-14) }, legFf: { r: wave(-14) }, legBn: { r: wave(-14) }, legMn: { r: wave(14) }, body: { y: [[0, 0], [0.25, -1.2], [0.5, 0], [0.75, -1.2], [1, 0]] }, show: { bar0: [[0, 1]], bar1: [[0, 1]] } }, ev: { step: [0.25, 0.75] } },
    // Schüssel richtet sich aus und glüht, gewaltiger Schuss mit Rückstoß
    attack: { prog: 'still', hit: 0.6, keys: { dish: { r: [[0, 0], [0.4, 8], [0.6, 8], [0.8, 0]] }, root: { x: [[0, 0], [0.6, 0], [0.66, -10, 'snap'], [0.9, -4], [1, 0]] }, show: { full: [[0.2, 0.6]], muzzle: [[0.6, 0.78]] }, expr: [[0, 0.7, 'attack']] }, ev: { release: 0.6 } },
    // Balken flackern
    hit: { prog: 'generic.hit', keys: { show: { bar0: [[0, 0.1], [0.3, 0.4]], bar1: [[0.5, 0.6]] } } },
    // landet auf dem Rücken und dreht sich auf die Beine
    spawn: { prog: 'still', keys: { body: { r: [[0, 180], [0.5, 180], [0.85, 0, 'out']], y: [[0, -6], [0.85, 0]] } } },
    // Kurzschluss, die Schüssel klappt zusammen, Rauch
    death: { prog: 'generic.death', keys: { dish: { r: [[0, 0], [0.4, 50]], sy: [[0, 1], [0.4, 0.5]] } } },
  });
}
