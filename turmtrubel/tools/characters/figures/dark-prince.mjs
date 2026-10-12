// Dunkler Prinz – arroganter Ritter in dunkelvioletter Rüstung auf einem gepanzerten Waran, Morgenstern und Sichelmond-Schild
// (Brief: docs/briefs/dark-prince.md). darkRider() zeichnet den Reiter auch für den Helden (dark-prince-hero.mjs).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { eye, eyeX, eyeClosed, lines, chainmail, rivets, emblem, INK, WHITE } from '../kit.mjs';

/** Knochen des Reiters, Hüfte bei (x0, y0). n: Namen (Standard: Reiter-Rig). */
export function darkRiderPivots(x0, y0, n = {}) {
  const N = { hip: 'rHip', torso: 'rTorso', head: 'rHead', armB: 'rArmB', handB: 'rHandB', armF: 'rArmF', handF: 'rHandF', prop: 'prop', leg: 'rLeg', ...n };
  return {
    [N.hip]: [x0, y0],
    [N.torso]: [x0, y0 - 1],
    [N.head]: [x0 + 5, y0 - 28],
    [N.armB]: [x0 - 6, y0 - 24],
    [N.handB]: [x0 - 8, y0 - 10],
    [N.armF]: [x0 + 9, y0 - 24],
    [N.handF]: [x0 + 17, y0 - 14],
    [N.prop]: [x0 + 17, y0 - 14],
    [N.leg]: [x0 + 1, y0],
  };
}

/**
 * Der gerüstete Reiter: Visierhelm mit Hörnerkamm, Stachelschulter, Kettenrock, Sichelmond-Schild (Mitte = Teamzone),
 * Morgenstern. o: x0, y0 (Hüfte), names (Knochen), form, hero (Sichelmond-Krone), standing (Beine bis zum Boden), legs
 */
export function darkRider(F, o) {
  const P = F.pal;
  const ARMOR = P.main;
  const EYES = P.acc;
  const STEEL = '#5a5f6b';
  const DARK = '#1e1a2a';
  const N = { hip: 'rHip', torso: 'rTorso', head: 'rHead', armB: 'rArmB', handB: 'rHandB', armF: 'rArmF', handF: 'rHandF', prop: 'prop', leg: 'rLeg', ...(o.names || {}) };
  const x0 = o.x0;
  const y0 = o.y0;
  const X = (x) => x0 + x;
  const Y = (y) => y0 + y;
  const sfx = o.suffix || '';
  const form = o.form;
  const part = (name, opt, fn) => F.part(name + sfx, { ...opt, ...(form ? { form } : {}) }, fn);
  const zb = o.zBase || 0;

  // Sichelmond-Schild am hinteren Arm
  part('rArmB', { bone: N.armB, z: zb + 27 }, (g) => g.mat(limb(X(-6), Y(-24), X(-8), Y(-11), 5, 4.6), ARMOR, 'metal'));
  part('shield', { bone: N.handB, z: zb + 28, team: true }, (g) => {
    const outer = arc(X(-10), Y(-12), 13, 15, 100, 260, 14);
    const inner = arc(X(-5), Y(-12), 9, 11, 250, 110, 12);
    g.mat(path([...outer, ...inner]), '#a8aec0', 'metal', { hi: 0.9 });
    g.mat(circle(X(-17), Y(-12), 3.6), P.team, 'metal', { line: P.teamDeep });
    g.lod(1, (h) => h.stroke(spline(arc(X(-10), Y(-12), 11, 13, 120, 240, 8)), '#6a7080', 0.6));
  });
  if (o.standing) {
    for (const [nm, x, near] of [['legB', -4, false], ['legF', 6, true]]) {
      part('foot' + nm, { bone: o.legs[nm], z: zb + (near ? 31 : 26) }, (g) => {
        g.mat(limb(X(x), Y(0), X(x * 1.2), Y(32), 6, 5.4), near ? ARMOR : '#2a2438', 'metal');
        g.mat(path([[X(x * 1.2 - 5), Y(28)], [X(x * 1.2 + 5), Y(28)], [X(x * 1.2 + 10), Y(34)], [X(x * 1.2 + 10), Y(37), 1], [X(x * 1.2 - 6), Y(37), 1]]), STEEL, 'metal');
      });
    }
  }
  part('rTorso', { bone: N.torso, z: zb + 30 }, (g) => {
    const t = path([[X(-9), Y(0), 1], [X(-10), Y(-14)], [X(-6), Y(-25)], [X(4), Y(-28)], [X(12), Y(-24)], [X(13), Y(-13)], [X(9), Y(0), 1]]);
    g.mat(t, ARMOR, 'metal', { hi: 0.7 });
    g.stroke(spline([[X(-9), Y(-12)], [X(2), Y(-10)], [X(12), Y(-12)]]), DARK, 0.8, { lod: 1 });
    g.lod(1, (h) => h.stroke(spline(arc(X(3), Y(-18), 4, 4, 200, 340, 8)), EYES, 0.7));
    const skirt = path([[X(-10), Y(-2)], [X(10), Y(-2)], [X(12), Y(6)], [X(-12), Y(6)]]);
    g.mat(skirt, '#6a6a78', 'metal');
    chainmail(g, skirt, [X(-12), Y(-3), X(13), Y(7)], 1.2, '#4a4a58');
  });
  if (!o.standing) {
    part('rLeg', { bone: N.leg, z: zb + 32 }, (g) => {
      g.mat(limb(X(-1), Y(0), X(11), Y(6), 6, 5.4), ARMOR, 'metal');
      g.mat(limb(X(11), Y(6), X(10), Y(20), 5.2, 4.6), '#2a2438', 'metal');
      g.mat(path([[X(6), Y(18)], [X(14), Y(18)], [X(17), Y(22)], [X(17), Y(24), 1], [X(6), Y(24), 1]]), STEEL, 'metal');
    });
  }
  // Visierhelm mit Hörnerkamm, limettengrüne Augenschlitze
  part('helm', { bone: N.head, z: zb + 34 }, (g) => {
    g.mat(path([[X(-4), Y(-30)], [X(-5), Y(-40)], [X(1), Y(-48)], [X(10), Y(-49)], [X(17), Y(-43)], [X(18), Y(-32)], [X(13), Y(-26)], [X(1), Y(-26)]]), ARMOR, 'metal', { hi: 0.8 });
    g.mat(path([[X(2), Y(-36)], [X(18), Y(-37)], [X(19), Y(-31)], [X(3), Y(-30)]]), DARK, 'metal');
    for (const [hx, h] of [[-2, 14], [4, 18], [10, 15]]) g.mat(path([[X(hx - 2.4), Y(-46)], [X(hx - 3), Y(-46 - h), 1], [X(hx + 2.6), Y(-47)]]), '#2a2438', 'metal');
  });
  part('eyes', { bone: N.head, z: zb + 35, glow: true }, (g) => {
    for (const x of [9, 15]) g.fill(rrect(X(x - 2), Y(-35), 4, 1.6, 0.6), EYES);
  });
  part('brow', { bone: N.head, z: zb + 35.5, view: 'front', lod: 1 }, (g) => {
    g.stroke(spline([[X(6), Y(-39)], [X(12), Y(-41.6)], [X(18), Y(-39)]]), DARK, 1.4);
  });
  if (o.hero) {
    part('sickleCrown', { bone: N.head, z: zb + 36, sig: true }, (g) => {
      const outer = arc(X(7), Y(-52), 12, 10, 200, 340, 12);
      const inner = arc(X(7), Y(-48), 9, 6, 330, 210, 10);
      g.mat(path([...outer, ...inner]), '#e8e8f0', 'metal', { hi: 1 });
      g.mat(circle(X(7), Y(-56), 1.6), EYES, 'gem');
    });
  }
  // Morgenstern
  part('flail', { bone: N.prop, z: zb + 38 }, (g) => {
    g.mat(path([[X(15), Y(-12)], [X(19), Y(-12)], [X(21), Y(-34)], [X(18), Y(-35)]]), '#4a3424', 'wood');
    g.mat(rrect(X(16.4), Y(-38), 6, 4, 1), STEEL, 'metal');
    for (let i = 0; i < 4; i++) g.stroke(ellipse(X(20 + i * 2.4), Y(-40 - i * 3), 1, 1.8, 30), '#8a8f9a', 0.9);
    const bx = X(31);
    const by = Y(-54);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.fill(path([[bx + Math.cos(a - 0.3) * 5, by + Math.sin(a - 0.3) * 5], [bx + Math.cos(a) * 9, by + Math.sin(a) * 9, 1], [bx + Math.cos(a + 0.3) * 5, by + Math.sin(a + 0.3) * 5]]), '#9aa0aa');
    }
    g.mat(circle(bx, by, 5.6), STEEL, 'metal', { hi: 0.9 });
  });
  part('rArmF', { bone: N.armF, z: zb + 40 }, (g) => g.mat(limb(X(9), Y(-24), X(16.6), Y(-15), 5.2, 4.6), ARMOR, 'metal'));
  part('pauldron', { bone: N.armF, z: zb + 40.5 }, (g) => {
    g.mat(path([[X(3), Y(-26)], [X(8), Y(-31)], [X(15), Y(-29)], [X(23), Y(-38), 1], [X(19), Y(-25)], [X(14), Y(-20)], [X(5), Y(-21)]]), ARMOR, 'metal', { hi: 0.8 });
    rivets(g, [[X(8), Y(-27)], [X(13), Y(-26)]], 0.8, EYES);
  });
  part('rHandF', { bone: N.handF, z: zb + 41 }, (g) => g.mat(path([[X(13), Y(-17)], [X(21), Y(-17)], [X(22), Y(-11)], [X(14), Y(-10)]]), STEEL, 'metal', { hi: 0.8 }));
}

export default function darkPrince(F) {
  const P = F.pal;
  const SCALE = '#5a6a4a';
  const BELLY = '#a39a7a';
  const PLATE = '#4a4a58';
  const CLAW = '#e8dcc8';

  F.rig('rider', {
    body: [0, -24],
    head: [40, -28],
    jaw: [52, -24],
    ear: [44, -34],
    tail: [-34, -28],
    legBf: [-24, -20],
    legFf: [22, -20],
    legBn: [-20, -18],
    legFn: [26, -18],
    ...darkRiderPivots(-2, -40),
    cape: [-10, -36],
  });

  // ───────── Waran: ferne Beine, Schwanz ─────────
  const leg = (name, x, z, near) => {
    F.part(name, { bone: name, z }, (g) => {
      const c = near ? SCALE : '#4a5a3c';
      // gespreizt: Oberschenkel nach außen, Unterschenkel nach unten
      g.mat(limb(x, -22, x + 8, -14, 7, 6), c, 'scale');
      g.mat(limb(x + 8, -15, x + 7, -3, 5.4, 4.6), c, 'scale');
      for (const d of [0, 3, 6]) g.fill(path([[x + 3 + d, -2], [x + 5 + d, 0, 1], [x + 1.6 + d, 0]]), CLAW);
    });
  };
  leg('legBf', -26, 2, false);
  leg('legFf', 20, 3, false);
  // Signature: gepanzerter Waran (Schwanz, Leib, Kopf)
  F.part('tail', { bone: 'tail', z: 4, sig: true }, (g) => {
    g.mat(path([[-32, -34], [-50, -30], [-66, -22], [-78, -14, 1], [-64, -16], [-48, -18], [-32, -20]]), SCALE, 'scale', { hi: 0.3 });
    lines(g, [[[-44, -29], [-44, -20]], [[-54, -26], [-54, -18]], [[-64, -22], [-64, -16]]], '#3e4a32', 0.6, 1);
  });

  // ───────── Waran-Körper mit Panzerplatten, Schabracke (Teamzone) ─────────
  F.part('lizard', { bone: 'body', z: 10, zb: 10, sig: true }, (g) => {
    const b = blob([[-36, -28], [-28, -38], [-6, -42], [18, -40], [36, -34], [40, -24], [30, -16], [0, -14], [-28, -16], [-38, -22]], 0.5);
    g.mat(b, SCALE, 'scale', { hi: 0.3 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(0, -14, 36, 6), BELLY, 'scale', { line: '0' });
      for (let x = -32; x < 38; x += 6) h.stroke(spline([[x, -40], [x + 2, -30], [x, -18]]), '#3e4a32', 0.5, { lod: 2 });
    });
    for (let i = 0; i < 8; i++) {
      const x = -30 + i * 8.4;
      const y = -40.6 - Math.sin(((i + 0.5) / 8) * Math.PI) * 2.4;
      g.mat(path([[x - 3.6, y + 2], [x - 1, y - 4, 1], [x + 3.6, y + 2]]), PLATE, 'metal');
    }
  });
  F.part('caparison', { bone: 'body', z: 12, zb: 12, team: true }, (g) => {
    const pts = [[-16, -42], [12, -42], [14, -30]];
    for (let i = 0; i <= 5; i++) pts.push([14 - i * 6.4, -24 + (i % 2 ? 3 : 0), 1]);
    pts.push([-18, -32]);
    g.mat(path(pts), P.team, 'cloth', { line: P.teamDeep });
    g.stroke(polyline(pts.slice(3, 9).map(([x, y]) => [x, y - 1.4])), '#c8c8d8', 0.8, { lod: 1 });
  });
  F.part('saddle', { bone: 'body', z: 13, zb: 13 }, (g) => {
    g.mat(path([[-14, -44, 1], [-8, -40], [6, -40], [12, -46, 1], [14, -40], [8, -36], [-10, -36], [-16, -40]]), '#3a2a24', 'leather', { hi: 0.4 });
    rivets(g, [[-10, -38], [10, -38]], 0.9, '#9aa0aa');
  });
  emblem(F, 'emblem', 'body', 12.5, -2, -32, 2.8);
  F.part('head', { bone: 'head', z: 20, zb: 20, sig: true }, (g) => {
    g.mat(path([[32, -36], [44, -38], [58, -34], [66, -28], [64, -24], [52, -22], [38, -22], [32, -26]]), SCALE, 'scale', { hi: 0.35 });
    g.fill(ellipse(62, -29, 0.8, 0.6), '#1a1a10', { lod: 1 });
  });
  F.part('jaw', { bone: 'jaw', z: 21, zb: 21 }, (g) => {
    g.mat(path([[40, -24], [64, -24.6], [60, -20], [44, -19]]), BELLY, 'scale');
    // spöttisches Schlitzlächeln
    g.stroke(spline([[42, -24.6], [52, -23.6], [62, -25.6]]), '#2a2a1a', 0.8);
  });
  F.part('tongue', { bone: 'jaw', z: 19.5, state: ['idle', 'attack'] }, (g) => {
    g.stroke(polyline([[64, -24.6], [71, -24], [74, -26]]), '#c83a4a', 1);
    g.stroke(polyline([[71, -24], [74, -22]]), '#c83a4a', 1);
  });
  F.part('lizardEye', { bone: 'head', z: 22, expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    g.mat(ellipse(48, -32, 3, 2.4), '#e8c83a', 'gem', { line: INK, lw: 0.7 });
    g.fill(ellipse(48.4, -32, 0.6, 2), '#1a1a10');
  });
  F.part('lizardEye.hurt', { bone: 'head', z: 22, expr: ['hurt', 'stun'] }, (g) => eyeClosed(g, 48, -32, 2.6, { up: true, lw: 0.9 }));
  F.part('lizardEye.death', { bone: 'head', z: 22, expr: 'death' }, (g) => eyeX(g, 48, -32, 2));
  F.part('crest', { bone: 'ear', z: 19, zb: 21 }, (g) => {
    for (const [x, h] of [[36, 6], [41, 7], [46, 5]]) g.mat(path([[x - 2.6, -36], [x, -36 - h, 1], [x + 2.6, -36.4]]), PLATE, 'metal');
  });
  leg('legBn', -21, 15, true);
  leg('legFn', 25, 16, true);

  darkRider(F, { x0: -2, y0: -40 });

  F.anim({
    // Waran züngelt und hebt den Kopf, Morgenstern pendelt locker
    idle: { p: { nod: 4 }, keys: { head: { r: [[0, 0], [0.4, -8], [0.6, -8], [0.8, 0]] }, jaw: { r: [[0, 0], [0.5, 4], [0.55, 0], [0.6, 4], [0.65, 0]] }, prop: { r: [[0, -6], [0.5, 6], [1, -6]] } } },
    // Schlängelgang, der Schwanz schwingt gegenläufig
    walk: { p: { stride: 22, bob: 1.6, rock: 3, nod: 3, gallop: false }, keys: { tail: { r: [[0, -10], [0.5, 10], [1, -10]] }, body: { r: [[0, 2], [0.5, -2], [1, 2]] } }, ev: { step: [0.25, 0.75] } },
    // Ansturm: hochbeinig, Morgenstern gestreckt nach vorn
    charge: { prog: 'quad.walk', p: { stride: 30, bob: 3, riderLean: 12 }, keys: { rArmF: { r: [[0, -70], [1, -70]] }, tail: { r: [[0, -14], [0.5, 14], [1, -14]] } } },
    // Morgenstern über dem Kopf kreisen lassen, Rundumschlag
    attack: { prog: 'rider.swing', hit: 0.6, p: { wind: -200, strike: -40, over: -30, cock: -40, snap: 20, lean: 6, lunge: 10 }, keys: { prop: { r: [[0, 0], [0.2, -120], [0.4, -240], [0.6, -400], [0.8, -460], [1, -360]] } } },
    hit: { keys: { jaw: { r: [[0, 0], [0.15, 18], [0.6, 0]] }, rArmB: { r: [[0, 0], [0.2, -50], [1, 0]] } } },
    // Waran rollt sich zur Seite, der Prinz fällt, Rüstung zerfällt in Staub
    death: { p: { angle: 12 }, keys: { rHip: { x: [[0, 0], [0.6, -20]], y: [[0, 0], [0.6, 24, 'in']] }, rTorso: { r: [[0, 0], [0.6, -90]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
