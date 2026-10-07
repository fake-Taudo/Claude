// Nashorn – stures, schnaubendes Reittier des Dunklen Prinzen (Held), Doppelhorn mit Sichelmond-Stirnplatte
// (Brief: docs/briefs/rhino.md). rhinoBody() zeichnet das Tier auch unter dem Helden (dark-prince-hero.mjs).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob, arc } from '../geo.mjs';
import { eye, eyeX, eyeClosed, lines, rivets, emblem, INK } from '../kit.mjs';

export const RHINO_PIVOTS = {
  body: [0, -36],
  head: [36, -44],
  jaw: [54, -30],
  ear: [40, -60],
  tail: [-38, -50],
  legBf: [-24, -26],
  legFf: [22, -26],
  legBn: [-20, -24],
  legFn: [26, -24],
};

/** Nashornkörper auf den Vierbeiner-Knochen. o: form (Teile nur in dieser Form), saddle (Sattel für den Reiter) */
export function rhinoBody(F, o = {}) {
  const P = F.pal;
  const HIDE = o.hide || '#8a8f80';
  const BRASS = o.brass || '#c9b13f';
  const HIDE_D = '#6e7366';
  const part = (name, opt, fn) => F.part(name, { ...opt, ...(o.form ? { form: o.form } : {}) }, fn);

  const leg = (name, x, z, near) => {
    part(name, { bone: name, z }, (g) => {
      const c = near ? HIDE : HIDE_D;
      g.mat(limb(x, -30, x + 1, -6, near ? 12 : 10.6, 10), c, 'skin', { hi: 0.25 });
      g.mat(path([[x - 6, -7], [x + 7, -7], [x + 7.6, 0, 1], [x - 6.6, 0, 1]]), '#4a4a42', 'bone');
      g.lod(1, (h) => h.stroke(spline([[x - 4, -16], [x + 1, -14], [x + 6, -16]]), '#5a5e52', 0.7));
    });
  };
  leg('legBf', -25, 2, false);
  leg('legFf', 21, 3, false);
  part('tail', { bone: 'tail', z: 4 }, (g) => {
    g.stroke(spline([[-38, -52], [-44, -44], [-44, -36]]), HIDE_D, 2.4);
    g.mat(ellipse(-44, -34, 2, 3), '#3a3a34', 'hair');
  });
  part('rhino', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const b = blob([[-40, -46], [-30, -62], [-6, -66], [20, -64], [36, -56], [40, -40], [32, -24], [10, -18], [-16, -18], [-34, -24]], 0.5);
    g.mat(b, HIDE, 'skin', { hi: 0.28 });
    // Panzerfalten wie Plattenrüstung
    g.clipTo(b, (h) => {
      for (const x of [-22, 4, 24]) h.stroke(spline([[x, -66], [x - 3, -42], [x + 1, -18]]), HIDE_D, 1.4);
      h.fill(ellipse(0, -18, 34, 6), '#a0a496', { op: 0.6 });
    });
    lines(g, [[[-30, -40], [-26, -36]], [[14, -36], [18, -32]], [[-6, -50], [-2, -46]]], HIDE_D, 0.6, 1);
  });
  if (o.saddle !== false) {
    part('blanket', { bone: 'body', z: 12, zb: 12, team: true }, (g) => {
      const pts = [[-18, -66], [12, -66], [14, -50]];
      for (let i = 0; i <= 5; i++) pts.push([14 - i * 6.6, -42 + (i % 2 ? 3 : 0), 1]);
      pts.push([-20, -50]);
      g.mat(path(pts), P.team, 'cloth', { line: P.teamDeep });
      g.mat(rrect(-20, -50, 34, 3, 1), BRASS, 'gold', { lod: 1 });
    });
  }
  part('head', { bone: 'head', z: 20, zb: 20 }, (g) => {
    g.mat(path([[28, -60], [42, -62], [54, -54], [62, -42], [64, -30], [56, -24], [40, -26], [30, -36]]), HIDE, 'skin', { hi: 0.32 });
    g.lod(1, (h) => h.stroke(spline([[40, -30], [48, -34], [56, -32]]), HIDE_D, 0.8));
    // schnaubende Nüstern
    g.fill(ellipse(60, -33, 1.4, 2), '#3a3a34');
  });
  // Doppelhorn mit Sichelmond-Stirnplatte (Signature)
  part('horns', { bone: 'head', z: 21, zb: 21, sig: true }, (g) => {
    g.mat(path([[54, -40], [62, -44], [72, -66, 1], [64, -52], [58, -42]]), '#e8dcc0', 'bone', { hi: 0.6 });
    g.mat(path([[46, -52], [50, -54], [54, -66, 1], [52, -54]]), '#d8ccb0', 'bone');
    const outer = arc(42, -52, 9, 7, 200, 340, 10);
    const inner = arc(42, -49, 6, 4, 330, 210, 8);
    g.mat(path([...outer, ...inner]), BRASS, 'gold', { hi: 0.9 });
    rivets(g, [[36, -54], [48, -54]], 0.8, '#f0e0a0');
  });
  part('rhinoEye', { bone: 'head', z: 22, expr: ['idle', 'attack', 'ability', 'sleep'] }, (g) => {
    eye(g, 46, -44, { r: 1.8, ratio: 1, iris: '#3a2a1a', lidColor: HIDE, lid: 0.45, look: [0.5, 0], lashW: 0.8 });
  });
  part('rhinoEye.hurt', { bone: 'head', z: 22, expr: ['hurt', 'stun'] }, (g) => eyeClosed(g, 46, -44, 1.9, { up: true, lw: 0.8 }));
  part('rhinoEye.death', { bone: 'head', z: 22, expr: 'death' }, (g) => eyeX(g, 46, -44, 1.6));
  part('ears', { bone: 'ear', z: 19, zb: 22 }, (g) => {
    g.mat(path([[34, -60], [32, -70, 1], [40, -62]]), HIDE_D, 'skin');
    g.mat(path([[38, -61], [38, -72, 1], [44, -62]]), HIDE, 'skin');
  });
  leg('legBn', -21, 15, true);
  leg('legFn', 25, 16, true);
}

export default function rhino(F) {
  F.rig('quadruped', RHINO_PIVOTS);
  rhinoBody(F, { hide: F.pal.main, brass: F.pal.acc });
  emblem(F, 'emblem', 'body', 12.5, -2, -56, 3);
  F.anim({
    // scharrt mit dem Huf
    idle: { p: { nod: 3 }, keys: { legFn: { r: [[0, 0], [0.2, -18], [0.3, 6], [0.4, -14], [0.5, 0]] } } },
    // schwerer Trab
    walk: { p: { stride: 22, bob: 3.6, rock: 3, nod: 5, gallop: false }, ev: { step: [0.25, 0.75] } },
    charge: { prog: 'quad.walk', p: { stride: 32, bob: 4, head: 14 } },
    // Kopf senken, Hornstoß
    attack: { prog: 'quad.idle', hit: 0.55, keys: { head: { r: [[0, 0], [0.45, 16, 'out'], [0.55, -14, 'in'], [0.8, 0]] }, root: { x: [[0, 0], [0.45, -4], [0.55, 6], [1, 0]] } } },
    hit: { keys: { jaw: { r: [[0, 0], [0.2, 10], [1, 0]] }, head: { r: [[0, 0], [0.2, -8], [1, 0]] } } },
    death: { p: { angle: 70 } },
  });
}
