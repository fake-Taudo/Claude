// Königsriese – strenger Leibgardist von riesiger Gestalt mit hoher Bärenfellmütze und Schulterkanone mit Löwenmaul
// (Brief: docs/briefs/royal-giant.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, furEdge, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function royalGiant(F) {
  const P = F.pal;
  const COAT = P.main;
  const GOLD = P.acc;
  const FUR = '#25222a';
  const SKIN = '#e2a078';
  const BRONZE = '#b8863a';
  const TROUSER = '#ece6da';
  const COAT_D = '#34331a';

  F.rig('biped', {
    hip: [0, -34],
    torso: [0, -38],
    head: [7, -100],
    hat: [7, -120],
    back: [-20, -90],
    armB: [-30, -96],
    handB: [-12, -104],
    armF: [31, -96],
    handF: [44, -100],
    prop: [44, -100],
    legB: [-12, -34],
    footB: [-14, -9],
    legF: [12, -34],
    footF: [14, -9],
    cape: [0, -100],
  });

  // ───────── Ladestock am Rücken ─────────
  F.part('ramrod', { bone: 'back', z: 2, zb: 46 }, (g) => {
    g.mat(path([[-40, -46, 1], [-37, -45, 1], [-6, -146, 1], [-9, -147, 1]]), '#7a5232', 'wood');
    g.mat(rrect(-11, -152, 6, 7, 2).rot(17, -8, -148), BRONZE, 'metal');
  });
  // ───────── Beine: weiße Hose, hohe Stiefel ─────────
  const leg = (x, z, name, foot) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -36, x * 1.12, -12, 11, 9.5), TROUSER, 'cloth'));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.12;
      g.mat(path([[fx - 11, -30], [fx + 9, -31], [fx + 10, -8], [fx + 19, -5], [fx + 19, 0, 1], [fx - 12, 0, 1]]), '#1e1c22', 'leather', { hi: 0.6 });
      g.mat(rrect(fx - 12, -33, 22, 5, 2), '#2e2c34', 'leather', { lod: 1 });
    });
  };
  leg(-12, 8, 'legB', 'footB');
  leg(12, 12, 'legF', 'footF');

  // ───────── Hinterer Arm (hält das Kanonenende) ─────────
  F.part('armB', { bone: 'armB', z: 14, zb: 44 }, (g) => {
    g.mat(limb(-30, -98, -32, -76, 11, 9.5), COAT_D, 'cloth');
    g.mat(limb(-32, -76, -14, -100, 9, 8), COAT_D, 'cloth');
  });
  F.part('handB', { bone: 'handB', z: 26, zb: 45 }, (g) => g.mat(blob([[-20, -104], [-12, -110], [-4, -106], [-6, -96], [-16, -94]], 0.7), '#f2eee6', 'cloth', { hi: 0.4 }));

  // ───────── Uniformrock mit zwei Knopfreihen, Schärpe (Teamzone) ─────────
  F.part('coatSkirt', { bone: 'hip', z: 16, zb: 16 }, (g) => {
    g.mat(path([[-34, -50], [34, -50], [38, -26], [24, -24], [12, -34], [0, -26], [-12, -34], [-24, -24], [-38, -26]]), COAT, 'cloth', { hi: 0.3 });
    g.stroke(polyline([[38, -26], [24, -24], [12, -34], [0, -26], [-12, -34], [-24, -24], [-38, -26]]), GOLD, 1, { lod: 1 });
  });
  F.part('coat', { bone: 'torso', z: 18, zb: 28 }, (g) => {
    const c = path([[-34, -100], [-12, -108], [14, -108], [36, -100], [40, -78], [34, -46], [-32, -46], [-38, -78]]);
    g.mat(c, COAT, 'cloth', { hi: 0.4 });
    g.clipTo(c, (h) => {
      h.fill(path([[-4, -108], [22, -108], [20, -46], [-2, -46]]), '#5a5828');
      h.lod(1, (k) => lines(k, [[[-22, -94], [-18, -60]], [[30, -94], [28, -60]]], COAT_D, 0.8, 1));
    });
    for (const x of [2, 16]) for (let y = -98; y < -50; y += 9) g.mat(circle(x, y, 2), GOLD, 'gold', { lod: 1 });
  });
  F.part('sash', { bone: 'torso', z: 20, zb: 30, team: true }, (g) => {
    g.mat(path([[-32, -100], [-22, -104], [36, -54], [26, -48]]), P.team, 'cloth', { line: P.teamDeep });
    g.lod(1, (h) => h.stroke(polyline([[-27, -100], [31, -51]]), P.teamShade, 1));
  });
  F.part('belt', { bone: 'hip', z: 21, zb: 31 }, (g) => {
    g.mat(rrect(-33, -52, 67, 7, 2), '#f2eee6', 'leather');
    g.mat(circle(6, -48.6, 5), GOLD, 'gold', { hi: 0.9 });
    g.lod(1, (h) => h.fill(ellipse(6, -48, 2.4, 2.2), '#8a6a2a'));
  });
  F.part('evoCuirass', { bone: 'torso', z: 21.5, zb: 31.5, evo: 'evo' }, (g) => {
    g.mat(blob([[-24, -100], [26, -100], [30, -76], [22, -58], [-20, -58], [-28, -76]], 0.6), '#c8ccd2', 'metal', { hi: 0.9 });
    g.mat(circle(2, -80, 8), GOLD, 'gold', { hi: 0.8 });
    g.lod(1, (h) => h.fill(ellipse(2, -79, 3, 3.4), '#8a6a2a'));
  });

  // ───────── Kopf: breit, gezwirbelter Schnurrbart, strenger Blick ─────────
  F.part('head', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(path([[-8, -116], [6, -121], [20, -117], [23, -106], [20, -96], [10, -92], [-2, -94], [-9, -102]]), SKIN, 'skin');
    g.mat(ellipse(-8.5, -108, 3.4, 4.6), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[15.5, -108.5, 2.3], [6.5, -108.5, 2.1]],
    iris: '#3a3a4a',
    lidColor: SKIN,
    lid: 0.45,
    look: [0.7, 0],
    brow: { color: '#5a3a22', w: 1.6, lift: 0.2 },
    idleTilt: 1,
    mouth: [13, -96.4, 5],
    mood: 'neutral',
    attackMouth: 'clench',
    replace: {
      // beim Schuss pustet er die Backen auf
      attack: (g, c) => {
        for (const [x, y, r] of [c.E1, c.E2]) g.stroke(spline([[x - r, y], [x, y - r * 0.6], [x + r, y]]), INK, 1);
        g.fill(ellipse(20, -100, 4, 3.4), '#f0a88a', { op: 0.8 });
        g.fill(ellipse(5, -100, 3, 2.6), '#f0a88a', { op: 0.6 });
      },
    },
  });
  F.part('nose', { bone: 'head', z: 32.6, view: 'front' }, (g) => g.mat(ellipse(13, -103.4, 3.2, 2.8), '#d88e68', 'skin', { line: '#a8684a', lw: 0.7 }));
  F.part('mustache', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(path([[13, -101], [8, -101.6], [2, -100], [-3, -101.6, 1], [-1, -104], [3, -98], [8, -97.6], [13, -98.4], [18, -97.6], [24, -98], [29, -104], [31, -101.6, 1], [24, -100], [18, -101.6]]), '#5a3a22', 'hair', { hi: 0.5 });
  });
  F.part('headBack', { bone: 'head', z: 34, zb: 37, view: 'back' }, (g) => g.mat(path([[-9, -112], [24, -112], [22, -100], [8, -94], [-6, -98]]), SKIN, 'skin'));
  // Bärenfellmütze (Signature) mit Kinnkette und Kordel (Teamzone)
  F.part('bearskin', { bone: 'hat', z: 35, zb: 38, sig: true }, (g) => {
    const b = blob([[-12, -110], [-15, -130], [-9, -152], [6, -163], [21, -157], [27, -136], [25, -110]], 0.8);
    g.mat(b, FUR, 'fur', { hi: 0.35 });
    g.lod(1, (h) => furEdge(h, [[-12, -110], [-15, -130], [-9, -152], [6, -163], [21, -157], [27, -136], [25, -110]], 2.4, '#3a3640', { side: -1 }));
    g.clipTo(b, (h) => h.lod(1, (k) => lines(k, [[[-6, -114], [-8, -150]], [[6, -112], [6, -158]], [[18, -114], [20, -150]]], '#16141a', 0.8, 1)));
    g.stroke(spline([[-8, -110], [-2, -98], [8, -92], [20, -96], [24, -110]]), GOLD, 1.2);
  });
  F.part('cord', { bone: 'hat', z: 35.5, zb: 38.5, team: true }, (g) => {
    g.stroke(spline([[-12, -126], [2, -122], [14, -128], [26, -132]]), P.team, 2);
    g.stroke(spline([[-12, -132], [4, -128], [26, -138]]), P.team, 1.6);
    g.mat(path([[-12, -126], [-16, -118, 1], [-11, -118, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
  });
  F.part('evoBadge', { bone: 'hat', z: 35.8, zb: 38.8, evo: 'evo' }, (g) => {
    g.mat(poly([[6, -150], [10, -142], [6, -134], [2, -142]], 0.6), GOLD, 'gold', { hi: 0.9 });
  });

  // ───────── Schulterkanone mit Löwenmaul-Mündung ─────────
  const cannon = (g, dy, k) => {
    g.mat(path([[-20, -116 + dy], [-18, -122 + dy], [62, -120 + dy], [62, -110 + dy], [-18, -106 + dy], [-20, -110 + dy]]), BRONZE, 'metal', { hi: 0.9 * k });
    g.mat(circle(-22, -114 + dy, 4), BRONZE, 'metal');
    for (const x of [10, 36]) g.mat(rrect(x, -121 + dy, 4, 15, 1.4), '#8a6228', 'metal');
    // Löwenmaul
    g.mat(circle(66, -115 + dy, 9), '#c89a48', 'metal', { hi: 0.9 });
    g.lod(1, (h) => {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        h.fill(circle(66 + Math.cos(a) * 8.6, -115 + dy + Math.sin(a) * 8.6, 2), '#a87a30');
      }
    });
    g.fill(ellipse(68, -112 + dy, 3.6, 3), '#1a1410');
    g.fill(circle(64.4, -118.4 + dy, 1), '#1a1410');
    g.fill(circle(69, -118.4 + dy, 1), '#1a1410');
  };
  F.part('cannon', { bone: 'cape', z: 27, zb: 3 }, (g) => {
    cannon(g, 0, 1);
    // Riemen mit Löwenschnalle
    g.stroke(spline([[18, -108], [24, -90], [20, -70]]), '#5a3a22', 2);
    g.mat(circle(23, -88, 2.4), GOLD, 'gold', { lod: 1 });
  });
  F.part('evoBarrel', { bone: 'cape', z: 26.5, zb: 2.5, evo: 'evo' }, (g) => cannon(g, -12, 0.8));
  F.part('fuse', { bone: 'cape', z: 27.5, state: 'loaded', glow: true }, (g) => {
    g.fill(circle(-18, -124, 1.6), '#ffd27a');
    g.fill(circle(-18, -124, 3.6), '#ffb03a', { op: 0.4 });
  });
  F.part('muzzle', { bone: 'cape', z: 38, state: 'muzzle', glow: true }, (g) => {
    g.fill(path([[74, -122], [86, -126], [82, -116], [94, -114], [82, -110], [86, -102], [74, -108]]), '#ffd27a', { op: 0.9 });
    for (const [x, y, r] of [[90, -126, 6], [98, -114, 7], [90, -102, 5]]) g.fill(circle(x, y, r), '#d8d4d0', { op: 0.7 });
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 10 }, (g) => {
    g.mat(limb(31, -98, 38, -76, 11, 9.5), COAT, 'cloth');
    g.mat(limb(38, -76, 44, -100, 9, 8), COAT, 'cloth');
    g.mat(ellipse(30, -100, 11, 6, -10), GOLD, 'gold', { hi: 0.7 });
  });
  F.part('handF', { bone: 'handF', z: 38.5, zb: 11 }, (g) => g.mat(blob([[38, -104], [46, -110], [54, -106], [52, -96], [42, -94]], 0.7), '#f2eee6', 'cloth', { hi: 0.4 }));
  emblem(F, 'emblem', 'torso', 23, 26, -64, 2.8, { view: 'front' });

  F.anim({
    // salutiert kurz, putzt einen Knopf; der Schnurrbart zuckt
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 0.4, tilt: 1.5 }, keys: { head: { r: [[0, 0], [0.5, 0], [0.55, -3], [0.6, 2], [0.65, 0]] } } },
    // Paradeschritt
    walk: { p: { stride: 16, bob: 4, squash: 0.05, armSwing: 0, lean: 1 }, ev: { step: [0.25, 0.75] } },
    // Zielen, Lunte, Schuss mit Rückstoß bis in die Knie
    attack: {
      prog: 'still',
      hit: 0.55,
      keys: {
        show: { loaded: [[0.2, 0.55]], muzzle: [[0.55, 0.7]] },
        cape: { x: [[0, 0], [0.55, 0], [0.6, -8, 'snap'], [0.9, 0]] },
        root: { sy: [[0, 1], [0.55, 1], [0.62, 0.86], [0.9, 1]], sx: [[0, 1], [0.55, 1], [0.62, 1.08], [0.9, 1]] },
        torso: { r: [[0, 0], [0.4, 3], [0.55, 3], [0.62, -6], [0.9, 0]] },
        expr: [[0.5, 0.8, 'attack']],
      },
      ev: { release: 0.55 },
    },
    // Mütze wackelt, er blinzelt
    hit: { p: { knock: 1.6, recoil: 3 }, keys: { hat: { r: [[0, 0], [0.15, -6], [0.3, 5], [0.5, 0]] } } },
    // fällt steif wie ein Brett um, die Mütze rollt
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { r: [[0, 0], [0.45, -85, 'in']] }, hat: { x: [[0, 0], [0.45, 0], [1, -18]], y: [[0, 0], [0.45, 0], [1, 10]], r: [[0, 0], [0.45, 0], [1, -120]] }, alpha: [[0, 1], [0.7, 1], [1, 0]] } },
  });
}
