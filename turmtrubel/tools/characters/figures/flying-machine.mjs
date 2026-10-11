// Flugmaschine – Ornithopter aus Segeltuch-Schlagflügeln mit Holzrippen, Teekessel-Antrieb, Pilotin und Bugkanone
// (Brief: docs/briefs/flying-machine.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eye, eyeClosed, lines, stitches, emblem, INK, WHITE } from '../kit.mjs';

export default function flyingMachine(F) {
  const P = F.pal;
  const CANVAS = P.main;
  const GREEN = P.acc;
  const RIB = '#8a5a32';
  const BRASS = '#c8a046';
  const CAP = '#5a3a28';
  const SKIN = '#f0c8a0';
  const CANVAS_D = '#c8b488';

  F.rig('flyer', {
    body: [0, -30],
    head: [4, -44],
    crest: [4, -54],
    jaw: [26, -32],
    wingB: [-4, -42],
    wingF: [2, -42],
    legB: [-2, -38],
    legF: [8, -38],
    tail: [-24, -32],
  });

  // Schlagflügel: Tuch zwischen fünf Holzrippen, Flügelstreifen (Teamzone) an der Spitze
  const wing = (name, s, z, dark) => {
    const root = s > 0 ? [2, -42] : [-4, -42];
    const tips = [[s * 46, -78], [s * 50, -66], [s * 50, -54], [s * 44, -44], [s * 32, -38]].map(([x, y]) => [root[0] + x, y]);
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const pts = [root];
      tips.forEach((t, i) => {
        pts.push(t);
        if (i < tips.length - 1) pts.push([(t[0] + tips[i + 1][0]) / 2 - s * 4, (t[1] + tips[i + 1][1]) / 2]);
      });
      const cloth = path(pts.map((p, i) => (i % 2 === 1 || i === 0 ? [...p, 1] : p)));
      g.mat(cloth, dark ? CANVAS_D : CANVAS, 'cloth', { hi: 0.4 });
      g.clipTo(cloth, (h) => h.lod(2, (k) => stitches(k, [[root[0] + s * 20, -60], [root[0] + s * 28, -48]], '#a89870')));
      for (const t of tips) g.mat(limb(root[0], root[1], t[0], t[1], 1.4, 1), RIB, 'wood');
      // Flicken
      g.lod(1, (h) => h.fill(rrect(root[0] + s * 18 - 3, -58, 6, 6, 0.6), '#d8c8a0'));
    });
    F.part(name + 'Stripe', { bone: name, z: z + 0.2, zb: z + 0.2, team: true }, (g) => {
      g.mat(path([[root[0] + s * 40, -72], [root[0] + s * 46, -78], [root[0] + s * 50, -66], [root[0] + s * 44, -62]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    });
  };
  wing('wingB', -1, 2, true);

  // ───────── Holzrumpf mit Ruderflosse ─────────
  F.part('rudder', { bone: 'tail', z: 4 }, (g) => g.mat(path([[-20, -34, 1], [-34, -46, 1], [-36, -30, 1], [-22, -28, 1]]), CANVAS, 'cloth', { hi: 0.3 }));
  F.part('hull', { bone: 'body', z: 10, zb: 10 }, (g) => {
    const h0 = path([[-26, -34], [24, -36], [30, -30], [22, -22], [-18, -22], [-28, -28]]);
    g.mat(h0, RIB, 'wood', { hi: 0.4 });
    g.clipTo(h0, (h) => h.lod(1, (k) => lines(k, [[[-24, -30], [26, -31]], [[-20, -26], [22, -26]]], '#5a3a1e', 0.6, 1)));
    // Spannschnüre, Messingösen
    g.lod(1, (h) => {
      for (const x of [-16, -4, 10]) h.fill(circle(x, -33, 0.9), BRASS);
    });
  });
  // Teekessel-Antrieb mit Dampf und Rußfahne
  F.part('kettle', { bone: 'body', z: 11, zb: 11 }, (g) => {
    g.mat(blob([[-22, -36], [-20, -46], [-12, -50], [-4, -46], [-4, -36]], 0.7), BRASS, 'gold', { hi: 0.9 });
    g.mat(path([[-6, -44], [2, -48, 1], [0, -44]]), BRASS, 'gold');
    g.mat(rrect(-15, -54, 6, 4, 1.4), '#5a3a1e', 'wood');
  });
  F.part('steam', { bone: 'body', z: 11.5, zb: 11.5 }, (g) => {
    for (const [x, y, r] of [[-12, -58, 3], [-16, -64, 3.6], [-22, -68, 3]]) g.fill(circle(x, y, r), '#e8eef4', { op: 0.7 });
  });
  // ───────── Pilotin: Lederkappe, Schutzbrille, Schal (Teamzone) ─────────
  F.part('pilotBody', { bone: 'body', z: 12, zb: 12 }, (g) => g.mat(path([[-2, -50], [10, -50], [12, -36], [-4, -36]]), '#6a4a3a', 'leather', { hi: 0.4 }));
  F.part('scarf', { bone: 'body', z: 12.5, zb: 12.5, team: true }, (g) => {
    g.mat(path([[-2, -52], [12, -52], [10, -48], [-2, -48]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
    g.mat(path([[-2, -51], [-14, -48], [-18, -52, 1], [-12, -53], [-2, -54]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('crankArm', { bone: 'legF', z: 12.8, zb: 12.8 }, (g) => {
    g.mat(limb(8, -48, 14, -40, 2, 1.8), '#6a4a3a', 'leather');
    g.mat(circle(14, -40, 2), SKIN, 'skin');
    g.stroke(polyline([[14, -40], [16, -36]]), '#9aa3ad', 1);
  });
  F.part('pilotHead', { bone: 'head', z: 13, zb: 13 }, (g) => {
    g.mat(blob([[-2, -56], [0, -62], [6, -64], [12, -61], [13, -55], [9, -51], [2, -51]], 0.7), SKIN, 'skin');
    g.mat(path([[-3, -56], [-2, -63], [5, -66], [12, -63], [13, -58], [6, -60], [0, -58]]), CAP, 'leather', { hi: 0.5 });
    g.mat(path([[-3, -56], [-4, -50, 1], [0, -52]]), CAP, 'leather');
  });
  F.part('pilotFace.idle', { bone: 'head', z: 14, view: 'front', expr: ['idle', 'sleep', 'hurt', 'stun'] }, (g) => {
    for (const x of [6, 11]) {
      g.mat(circle(x, -58, 2.4), BRASS, 'metal');
      g.fill(circle(x, -58, 1.7), '#9ad8f0');
      g.fill(circle(x + 0.4, -58, 0.7), INK);
    }
    // Zunge im Mundwinkel
    g.stroke(polyline([[8, -53], [11, -53.4]]), INK, 0.6);
    g.fill(ellipse(11.4, -52.6, 0.9, 0.7), '#e86a7a');
  });
  F.part('pilotFace.attack', { bone: 'head', z: 14, view: 'front', expr: ['attack', 'ability', 'death'] }, (g) => {
    for (const x of [6, 11]) {
      g.mat(circle(x, -58, 2.4), BRASS, 'metal');
      eyeClosed(g, x, -58, 1.5, { up: true, lw: 0.6 });
    }
    g.stroke(polyline([[8, -53], [11, -53.4]]), INK, 0.7);
  });
  // ───────── Bugkanone auf Drehzapfen ─────────
  F.part('cannon', { bone: 'jaw', z: 15, zb: 15 }, (g) => {
    g.mat(circle(26, -32, 3.6), '#5a3a1e', 'wood');
    g.mat(path([[24, -36, 1], [40, -37, 1], [40, -31, 1], [24, -30, 1]]), BRASS, 'gold', { hi: 0.9 });
    g.mat(rrect(38, -38, 4, 8, 1.4), '#8a6a2a', 'gold');
  });
  F.part('muzzle', { bone: 'jaw', z: 16, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[42, -38], [52, -40], [48, -34], [54, -30], [42, -30]]), '#ffd27a', { op: 0.9 });
    g.fill(circle(54, -36, 3), '#e8e4e0', { op: 0.7 });
  });
  F.part('tear', { bone: 'wingF', z: 31, state: 'hit' }, (g) => g.stroke(polyline([[24, -62], [28, -58], [26, -54], [30, -50]]), '#5a4a30', 1.2));
  wing('wingF', 1, 30, false);
  emblem(F, 'emblem', 'body', 17, -12, -27, 2.4);

  F.anim({
    // Flügel schlagen gleichmäßig, der Kessel dampft; die Pilotin kurbelt
    idle: { prog: 'flyer.idle', p: { flaps: 2, flap: 24, lift: 2, roll: 1.5, tilt: 3, dangle: 0, wingB: 4 }, keys: { legF: { r: [[0, 0], [0.5, 360]] } }, ev: { flap: [0, 0.5] } },
    // schnellerer Flügelschlag, leicht nach vorn geneigt
    walk: { prog: 'flyer.walk', p: { flaps: 3, flap: 30, lean: 6, dangle: 0 }, keys: { legF: { r: [[0, 0], [1, 720]] } }, ev: { flap: [0, 0.333, 0.667] } },
    // Kanone zielt, Schuss mit Rückstoß, das Gestell ruckt
    attack: { prog: 'flyer.idle', hit: 0.55, p: { flaps: 2, flap: 20, dangle: 0 }, keys: { jaw: { r: [[0, 0], [0.4, 6], [0.55, 6], [0.6, -4], [0.9, 0]] }, root: { x: [[0, 0], [0.55, 0], [0.6, -5, 'snap'], [0.9, 0]] }, show: { muzzle: [[0.55, 0.72]] }, expr: [[0.4, 0.8, 'attack']] }, ev: { release: 0.55 } },
    // Tuch reißt kurz auf, die Pilotin duckt sich
    hit: { prog: 'flyer.hit', keys: { head: { y: [[0, 0], [0.2, 4], [1, 0]] } } },
    // fliegt mit kräftigem Schlag ein
    spawn: { prog: 'flyer.spawn', p: { flaps: 2 } },
    // Flügel klappen zusammen, sie trudelt mit Rauch herab
    death: { prog: 'flyer.death' },
  });
}
