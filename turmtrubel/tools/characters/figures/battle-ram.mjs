// Rammbock – Baumstamm mit geschnitztem Widderkopf und eisernen Spiralhörnern auf zwei Rädern, geschoben von zwei
// Barbaren in Wolfskapuzen (Brief: docs/briefs/battle-ram.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { eyeClosed, mouthOpen, furEdge, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function battleRam(F) {
  const P = F.pal;
  const WOOD = P.main;
  const IRON = P.acc;
  const BARK = '#4f3220';
  const CARVE = '#b07a48';
  const HOOD = '#857565';
  const SKIN = '#e0a878';
  const VEST = '#6a4a2e';

  F.rig(
    'vehicle',
    {
      body: [10, -22],
      wheelB: [-10, -9],
      wheelF: [26, -9],
      flag: [6, -30],
      c1Torso: [-40, -32],
      c1Head: [-32, -46],
      c1ArmF: [-34, -42],
      c1ArmB: [-36, -42],
      c1Legs: [-42, -30],
      c2Torso: [-46, -30],
      c2Head: [-38, -44],
      c2ArmF: [-40, -40],
      c2ArmB: [-42, -40],
      c2Legs: [-48, -28],
      c1LegB: [-42, -30],
      c2LegB: [-48, -28],
    },
    { c1LegB: 'root', c2LegB: 'root' },
  );

  // ───────── Schieber in Wolfskapuze (c1 hinten, c2 vorn) ─────────
  const pusher = (c, dx, dy, zBase, dark) => {
    const S = dark ? '#c08860' : SKIN;
    const Hd = dark ? '#6e6052' : HOOD;
    const X = (x) => x + dx;
    const Y = (y) => y + dy;
    const legShape = (g, x0, x1) => {
      g.mat(limb(X(x0), Y(-30), X(x1), Y(-4), 3.8, 3.2), dark ? '#5a4a38' : '#6a5a48', 'cloth');
      g.mat(path([[X(x1 - 3.6), Y(-6)], [X(x1 + 3.6), Y(-6.4)], [X(x1 + 7), Y(-2.4) - dy * 0], [X(x1 + 7), 0, 1], [X(x1 - 4.4), 0, 1]]), '#7a5a3a', 'fur');
    };
    F.part(c + 'LegB', { bone: c + 'LegB', z: zBase }, (g) => legShape(g, -36, -42));
    F.part(c + 'Legs', { bone: c + 'Legs', z: zBase + 1 }, (g) => legShape(g, -34, -28));
    F.part(c + 'ArmB', { bone: c + 'ArmB', z: zBase + 2 }, (g) => {
      g.mat(limb(X(-30), Y(-42), X(-20), Y(-28), 3.2, 2.8), dark ? '#a87050' : '#c88a60', 'skin');
      g.mat(circle(X(-19), Y(-27), 2.8), dark ? '#a87050' : '#c88a60', 'skin');
    });
    F.part(c + 'Torso', { bone: c + 'Torso', z: zBase + 3 }, (g) => {
      // vorgebeugter Rumpf mit Fellweste
      g.mat(path([[X(-38), Y(-30)], [X(-34), Y(-42)], [X(-26), Y(-48)], [X(-20), Y(-44)], [X(-24), Y(-34)], [X(-30), Y(-28)]]), S, 'skin', { hi: 0.4 });
      g.mat(path([[X(-38), Y(-30)], [X(-35), Y(-40)], [X(-28), Y(-46)], [X(-26), Y(-38)], [X(-30), Y(-28)]]), VEST, 'fur');
      g.lod(1, (h) => furEdge(h, [[X(-28), Y(-46)], [X(-26), Y(-38)], [X(-30), Y(-28)]], 1.6, '#4a3020'));
    });
    F.part(c + 'Sash', { bone: c + 'Torso', z: zBase + 3.2, team: true }, (g) => g.mat(path([[X(-37), Y(-32)], [X(-34), Y(-35)], [X(-24), Y(-36)], [X(-25), Y(-33)]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
    F.part(c + 'Head', { bone: c + 'Head', z: zBase + 4 }, (g) => {
      // Gesicht mit roten Wangen, zusammengebissene Zähne
      g.mat(blob([[X(-28), Y(-52)], [X(-24), Y(-56)], [X(-17), Y(-54)], [X(-15), Y(-48)], [X(-19), Y(-44)], [X(-26), Y(-45)]], 0.7), S, 'skin');
      g.fill(ellipse(X(-17.6), Y(-47.6), 1.6, 1), '#e86a5a', { op: 0.7 });
      g.fill(rrect(X(-20.6), Y(-46.6), 3.6, 1.6, 0.4), WHITE, { stroke: INK, lw: 0.4 });
      g.stroke(polyline([[X(-19), Y(-46.6)], [X(-19), Y(-45)]]), INK, 0.3);
      g.fill(ellipse(X(-18.4), Y(-51), 0.9, 1.1), INK);
      g.stroke(polyline([[X(-20.6), Y(-53.6)], [X(-16.6), Y(-52.6)]]), '#4a2a1a', 0.9);
      // Wolfskapuze mit Ohren und Schnauze
      g.mat(path([[X(-32), Y(-44)], [X(-31), Y(-54)], [X(-26), Y(-60)], [X(-22), Y(-66), 1], [X(-21), Y(-59)], [X(-15), Y(-58)], [X(-12), Y(-55)], [X(-9), Y(-55), 1], [X(-14), Y(-53)], [X(-20), Y(-54)], [X(-26), Y(-50)], [X(-28), Y(-44)]]), Hd, 'fur', { hi: 0.4 });
      g.mat(path([[X(-28), Y(-58)], [X(-30), Y(-65), 1], [X(-25), Y(-60)]]), Hd, 'fur');
      g.fill(circle(X(-16.6), Y(-57.4), 0.7), '#ffd27a');
    });
    F.part(c + 'ArmF', { bone: c + 'ArmF', z: zBase + 5 }, (g) => {
      g.mat(limb(X(-28), Y(-42), X(-18), Y(-30), 3.4, 3), S, 'skin');
      g.mat(circle(X(-17), Y(-29), 3), S, 'skin');
    });
  };
  pusher('c1', 1, -2, 2, true);
  pusher('c2', -6, 0, 30, false);

  // ───────── Stamm mit Rinde, Eisenbändern, Seilgriffen ─────────
  F.part('log', { bone: 'body', z: 20, zb: 20 }, (g) => {
    const L = path([[-22, -30, 1], [40, -30, 1], [40, -14, 1], [-22, -14, 1]]);
    g.mat(L, BARK, 'wood', { hi: 0.4 });
    g.clipTo(L, (h) => {
      h.lod(1, (k) => lines(k, [[[-18, -27], [10, -26.4], [36, -27]], [[-14, -20], [20, -19.4]], [[0, -16.4], [34, -17]]], '#2e1c10', 0.6, 1));
      for (const x of [-4, 24]) h.fill(rrect(x, -31, 4, 18, 0), IRON);
    });
    // Stirnseite hinten mit Jahresringen
    g.mat(ellipse(-22, -22, 4, 8), '#c89a60', 'wood');
    g.lod(1, (h) => {
      h.stroke(ellipse(-22, -22, 2.6, 5.4), '#8a6a3a', 0.5);
      h.stroke(ellipse(-22, -22, 1.2, 2.6), '#8a6a3a', 0.5);
    });
    g.lod(1, (h) => rivets(h, [[-2, -28], [-2, -16], [26, -28], [26, -16]], 0.7, '#c8ccd2'));
    // Seilgriff
    g.stroke(spline([[6, -30], [10, -34], [14, -30]]), '#c8a870', 1.2);
  });
  // Wimpel am Stamm (Teamzone)
  F.part('pennant', { bone: 'flag', z: 19, zb: 21, team: true }, (g) => {
    g.stroke(polyline([[6, -30], [6, -50]]), '#6a4a2e', 1.2);
    g.mat(path([[6, -50], [20, -46], [14, -44], [20, -42], [6, -40]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });

  // ───────── Widderkopf (Signature) mit Schlitzaugen und eisernen Spiralhörnern ─────────
  F.part('ramHead', { bone: 'body', z: 21, zb: 21, sig: true }, (g) => {
    g.mat(path([[38, -32], [48, -34], [56, -30], [62, -22], [60, -14], [52, -10], [42, -12], [38, -14]]), CARVE, 'wood', { hi: 0.5 });
    g.mat(path([[56, -20], [63, -18], [62, -13], [55, -12]]), '#9a6438', 'wood');
    g.fill(ellipse(60.6, -16.6, 1, 1.4), '#3a2414');
    // grimmige Schlitzaugen
    g.fill(path([[48, -27], [55, -26], [48.6, -24.4]]), '#2a1a10');
    g.lod(1, (h) => lines(h, [[[44, -30], [52, -31]], [[46, -14], [52, -13]]], '#7a4a28', 0.6, 1));
    // Splitter und Riss
    g.lod(2, (h) => h.stroke(polyline([[42, -22], [45, -19], [44, -16]]), '#5a3418', 0.5));
  });
  F.part('horn', { bone: 'body', z: 22, zb: 22 }, (g) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2.2 - 1.4;
      const r = 9 - i * 0.42;
      pts.push([46 + Math.cos(a) * r, -26 + Math.sin(a) * r]);
    }
    for (let i = 0; i < pts.length - 1; i++) g.mat(limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3 - i * 0.12, 3 - (i + 1) * 0.12), IRON, 'metal', { hi: 0.8 });
  });
  F.part('evoArmor', { bone: 'body', z: 21.5, zb: 21.5, evo: 'evo' }, (g) => {
    g.mat(path([[40, -33], [50, -35], [57, -31], [55, -24], [42, -24]].map((p) => [...p, 1])), '#6a707c', 'metal', { hi: 0.8 });
    g.lod(1, (h) => rivets(h, [[44, -30], [50, -31], [54, -28]], 0.7, '#d8dce2'));
  });
  F.part('evoHornGlow', { bone: 'body', z: 22.5, zb: 22.5, evo: 'evo', glow: true }, (g) => g.stroke(circle(46, -26, 7), '#ff9a3a', 1.4, { op: 0.8 }));

  // ───────── Speichenräder ─────────
  const wheel = (name, cx, z) => {
    F.part(name, { bone: name, z, zb: z }, (g) => {
      g.mat(circle(cx, -9, 9), '#6a4a2e', 'wood', { hi: 0.4 });
      g.mat(circle(cx, -9, 6.6), '#8a6a44', 'wood');
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.mat(limb(cx, -9, cx + Math.cos(a) * 6.6, -9 + Math.sin(a) * 6.6, 1, 1), '#5a3a22', 'wood');
      }
      g.mat(circle(cx, -9, 2.2), IRON, 'metal');
      g.stroke(circle(cx, -9, 9), IRON, 1);
    });
    F.part(name + 'Spikes', { bone: name, z: z + 0.5, zb: z + 0.5, evo: 'evo' }, (g) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.mat(poly([[cx + Math.cos(a - 0.15) * 9, -9 + Math.sin(a - 0.15) * 9], [cx + Math.cos(a) * 12.6, -9 + Math.sin(a) * 12.6], [cx + Math.cos(a + 0.15) * 9, -9 + Math.sin(a + 0.15) * 9]], 0.2), '#c8ccd2', 'metal');
      }
    });
  };
  wheel('wheelB', -10, 24);
  wheel('wheelF', 26, 24);
  F.part('splinters', { bone: 'body', z: 40, state: 'muzzle' }, (g) => {
    for (const [x, y, r] of [[66, -30, 20], [68, -14, -30], [64, -6, 60], [70, -22, 0]]) g.mat(rrect(x - 3, y - 0.8, 6, 1.6, 0.4).rot(r, x, y), CARVE, 'wood');
  });
  F.part('crack', { bone: 'body', z: 25, state: 'broken' }, (g) => {
    g.fill(path([[8, -31], [12, -26], [9, -22], [13, -18], [10, -13], [14, -13], [17, -18], [14, -22], [17, -26], [13, -31]]), '#1a120a');
  });
  emblem(F, 'emblem', 'body', 26, 14, -22, 2.6, { zb: 26 });

  F.anim({
    // Schieber stampfen auf der Stelle, der Stamm wippt
    idle: { prog: 'vehicle.idle', p: { lean: 14 }, keys: { c2Legs: { r: [[0, 0], [0.25, -8], [0.5, 0], [1, 0]] }, c1Legs: { r: [[0, 0], [0.5, 0], [0.75, -8], [1, 0]] } } },
    // Räder drehen, Schieber laufen gebeugt
    walk: { prog: 'vehicle.walk', p: { push: 4 }, keys: { c2Legs: { r: [[0, -20], [0.5, 20], [1, -20]] }, c2LegB: { r: [[0, 20], [0.5, -20], [1, 20]] }, c1Legs: { r: [[0, 20], [0.5, -20], [1, 20]] }, c1LegB: { r: [[0, -20], [0.5, 20], [1, -20]] } }, ev: { step: [0.25, 0.75] } },
    // Ansturm: Schieber rennen, der Stamm leicht angehoben
    charge: { prog: 'vehicle.walk', p: { spins: 2, push: 10 }, keys: { body: { r: [[0, -4], [1, -4]] }, c2Legs: { r: [[0, -30], [0.5, 30], [1, -30]] }, c2LegB: { r: [[0, 30], [0.5, -30], [1, 30]] }, c1Legs: { r: [[0, 30], [0.5, -30], [1, 30]] }, c1LegB: { r: [[0, -30], [0.5, 30], [1, -30]] } }, ev: { step: [0.25, 0.75] } },
    // Anlauf (alle lehnen sich zurück), Rammstoß mit Squash und Splitterwolke
    attack: {
      prog: 'vehicle.idle',
      hit: 0.55,
      keys: { root: { x: [[0, 0], [0.4, -6, 'out'], [0.55, 6, 'in'], [0.8, 0]] }, body: { sx: [[0, 1], [0.55, 1], [0.6, 0.9], [0.75, 1]], sy: [[0, 1], [0.55, 1], [0.6, 1.1], [0.75, 1]] }, c1Torso: { r: [[0, 0], [0.4, -12], [0.55, 10], [0.8, 0]] }, c2Torso: { r: [[0, 0], [0.4, -12], [0.55, 10], [0.8, 0]] }, show: { muzzle: [[0.55, 0.75]] } },
      ev: { strike: 0.55 },
    },
    // Stamm ruckt, Wimpel zuckt
    hit: { prog: 'generic.hit', keys: { flag: { r: [[0, 0], [0.2, -20], [1, 0]] } } },
    // rollt aus dem Fall an
    spawn: { prog: 'generic.spawn', keys: { wheelF: { r: [[0, -180], [1, 0]] }, wheelB: { r: [[0, -180], [1, 0]] } } },
    // Stamm zerbricht in der Mitte, die Schieber springen ab
    death: {
      prog: 'still',
      keys: {
        show: { broken: [[0, 1.01]] },
        body: { r: [[0, 0], [0.4, 8]], y: [[0, 0], [0.4, 4]] },
        c1Torso: { y: [[0, 0], [0.5, -14]], x: [[0, 0], [0.5, -10]] },
        c2Torso: { y: [[0, 0], [0.5, -10]], x: [[0, 0], [0.5, -14]] },
        c1Legs: { y: [[0, 0], [0.5, -14]], x: [[0, 0], [0.5, -10]] },
        c1LegB: { y: [[0, 0], [0.5, -14]], x: [[0, 0], [0.5, -10]] },
        c2Legs: { y: [[0, 0], [0.5, -10]], x: [[0, 0], [0.5, -14]] },
        c2LegB: { y: [[0, 0], [0.5, -10]], x: [[0, 0], [0.5, -14]] },
        alpha: [[0, 1], [0.6, 1], [1, 0]],
      },
    },
  });
}
