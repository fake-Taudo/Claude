// Skelettkönig – majestätischer König der Toten mit Geweihkrone, Gruftsamt-Robe und Grabstein-Keule
// (Brief: docs/briefs/skeleton-king.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { eyeX, furEdge, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function skeletonKing(F) {
  const P = F.pal;
  const ROBE = P.main;
  const BONE = P.acc;
  const ANTLER = '#e8dcc0';
  const GRAVE = '#8a8a96';
  const SOUL = '#9ff0ff';
  const ROBE_D = '#2e2d40';
  const FUR = '#8a8478';

  F.rig(
    'robe',
    {
      hip: [0, -60],
      skirt: [0, -60],
      torso: [0, -66],
      head: [8, -118],
      jaw: [8, -122],
      hat: [8, -150],
      armB: [-32, -110],
      handB: [-38, -66],
      armF: [34, -110],
      handF: [44, -66],
      prop: [44, -66],
      cape: [-6, -114],
      buddy: [0, -60],
    },
    { jaw: 'head' },
  );

  // ───────── Schulterumhang (Teamzone) ─────────
  F.part('cape', { bone: 'cape', z: 3, zb: 44, team: true }, (g) => {
    g.mat(path([[-34, -114], [20, -116], [14, -80], [-6, -50], [-34, -46], [-46, -76]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
    g.lod(1, (h) => lines(h, [[[-26, -108], [-36, -54]], [[-12, -110], [-20, -54]]], P.teamShade, 0.8, 1));
  });
  // Seelenlichter
  F.part('souls', { bone: 'buddy', z: 2, zb: 48, glow: true }, (g) => {
    for (const [x, y, r] of [[-46, -90, 3], [50, -110, 2.6], [-40, -40, 2.4], [56, -60, 2.8]]) {
      g.fill(circle(x, y, r * 2), SOUL, { op: 0.3 });
      g.fill(circle(x, y, r), '#e8ffff');
    }
  });

  // ───────── Hinterer Arm (Knochen im Ärmel) ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(path([[-40, -114], [-24, -116], [-28, -84], [-32, -72], [-46, -74], [-44, -92]]), ROBE_D, 'cloth', { hi: 0.3 });
  });
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => {
    for (const dx of [-6, -2, 2, 6]) g.mat(limb(-38 + dx * 0.6, -70, -38 + dx, -58, 1.8, 1.6), BONE, 'bone');
    g.mat(ellipse(-38, -70, 7, 4), BONE, 'bone');
  });

  // ───────── Robe aus Gruftsamt mit Saum (Teamzone), Fellkragen, Knochenpanzer ─────────
  F.part('robe', { bone: 'skirt', z: 16, zb: 16 }, (g) => {
    g.mat(path([[-30, -70], [32, -70], [40, -40], [48, -4], [-46, -4], [-38, -40]]), ROBE, 'cloth', { hi: 0.35 });
    g.lod(1, (h) => lines(h, [[[-12, -66], [-20, -8]], [[10, -66], [16, -8]], [[24, -60], [34, -8]]], ROBE_D, 0.9, 1));
  });
  F.part('hem', { bone: 'skirt', z: 17, zb: 17, team: true }, (g) => g.mat(path([[-46, -12], [48, -12], [50, 0, 1], [-48, 0, 1]]), P.team, 'cloth', { line: P.teamDeep }));
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(blob([[-34, -112], [0, -120], [36, -114], [40, -90], [32, -64], [-30, -64], [-38, -90]], 0.6), ROBE, 'cloth', { hi: 0.4 });
    // Knochenpanzer
    g.mat(blob([[-18, -110], [22, -110], [26, -90], [20, -74], [-14, -74], [-22, -90]], 0.6), BONE, 'bone', { hi: 0.5 });
    g.lod(1, (h) => {
      for (const y of [-100, -90, -80]) h.stroke(spline([[-16, y], [2, y + 3], [22, y]]), '#a89c84', 1);
      h.stroke(polyline([[2, -110], [2, -74]]), '#a89c84', 1.2);
    });
  });
  F.part('collar', { bone: 'torso', z: 24, zb: 38 }, (g) => {
    g.mat(blob([[-38, -114], [-20, -126], [8, -128], [32, -124], [42, -112], [20, -112], [-14, -110]], 0.6), FUR, 'fur', { hi: 0.4 });
    g.lod(1, (h) => furEdge(h, [[-38, -114], [-14, -110], [20, -112], [42, -112]], 2.6, '#6a645a'));
  });

  // ───────── Schädel mit Spinnweben-Kinnbart und hohl lachendem Kiefer ─────────
  F.part('skull', { bone: 'head', z: 30, zb: 34 }, (g) => {
    g.mat(blob([[-10, -132], [-6, -148], [8, -156], [24, -152], [30, -138], [28, -126], [20, -122], [0, -122], [-8, -126]], 0.75), BONE, 'bone', { hi: 0.6 });
  });
  F.part('sockets', { bone: 'head', z: 31, view: 'front' }, (g) => {
    g.fill(ellipse(22, -137, 4, 4.6), '#120e18');
    g.fill(ellipse(11, -137, 3.6, 4.2), '#120e18');
    g.fill(path([[17, -130], [19, -127], [21, -130]]), '#120e18');
  });
  F.part('eyes.glow', { bone: 'head', z: 32, view: 'front', expr: ['idle', 'attack', 'ability', 'hurt', 'stun', 'sleep'], glow: true }, (g) => {
    g.fill(circle(22, -136.4, 2), SOUL);
    g.fill(circle(11, -136.4, 1.8), SOUL);
  });
  F.part('eyes.death', { bone: 'head', z: 32, view: 'front', expr: 'death' }, (g) => {
    eyeX(g, 22, -137, 2.4, '#5a5a60', 1);
    eyeX(g, 11, -137, 2.2, '#5a5a60', 1);
  });
  F.part('jawBone', { bone: 'jaw', z: 30.5, zb: 30.5 }, (g) => {
    g.mat(path([[4, -124], [28, -126], [28, -118], [20, -112], [8, -112], [3, -118]]), BONE, 'bone', { hi: 0.4 });
    g.stroke(polyline([[8, -122], [27, -123.4]]), '#120e18', 0.8);
    for (let x = 10; x < 27; x += 3) g.stroke(polyline([[x, -124.6], [x, -119]]), '#a89c84', 0.6);
  });
  F.part('cobwebBeard', { bone: 'jaw', z: 31, zb: 31 }, (g) => {
    g.lod(1, (h) => {
      for (const x of [8, 14, 20, 26]) h.stroke(spline([[x, -112], [x - 1, -104], [x + 1, -96]]), '#e8e8f0', 0.5, { op: 0.8 });
      h.stroke(spline([[8, -106], [17, -104], [26, -106]]), '#e8e8f0', 0.4, { op: 0.8 });
      h.stroke(spline([[9, -100], [17, -98], [25, -100]]), '#e8e8f0', 0.4, { op: 0.8 });
    });
  });
  // Geweihkrone (Signature): zwei Stangen mit Eisenreif
  F.part('antlers', { bone: 'hat', z: 35, zb: 36, sig: true }, (g) => {
    const antler = (sx, ox) => {
      const pts = [[ox, -150], [ox + sx * 10, -164], [ox + sx * 18, -178], [ox + sx * 24, -186]];
      for (let i = 0; i < pts.length - 1; i++) g.mat(limb(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 3.6 - i * 0.7, 3 - i * 0.7), ANTLER, 'bone', { hi: 0.5 });
      g.mat(limb(ox + sx * 8, -161, ox + sx * 2, -174, 2.4, 1.6), ANTLER, 'bone');
      g.mat(limb(ox + sx * 16, -175, ox + sx * 10, -188, 2, 1.4), ANTLER, 'bone');
      g.mat(limb(ox + sx * 20, -180, ox + sx * 30, -182, 2, 1.4), ANTLER, 'bone');
    };
    antler(-1, 0);
    antler(1, 16);
    g.mat(rrect(-6, -154, 28, 6, 2), '#4a4e58', 'metal', { hi: 0.7 });
    g.lod(1, (h) => rivets(h, [[0, -151], [8, -151], [16, -151]], 0.9, '#9aa3ad'));
  });
  F.part('antlerGlow', { bone: 'hat', z: 35.5, state: 'ability', glow: true }, (g) => {
    g.fill(ellipse(8, -172, 34, 20), SOUL, { op: 0.35 });
  });

  // ───────── Grabstein-Keule an einem Schenkelknochen ─────────
  F.part('club', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(limb(44, -62, 50, -110, 3.4, 3), BONE, 'bone', { hi: 0.4 });
    g.mat(circle(44, -60, 4.6), BONE, 'bone');
    const gs = path([[36, -108, 1], [36, -132], [42, -142], [52, -144], [62, -136], [64, -108, 1]]);
    g.mat(gs, GRAVE, 'stone', { hi: 0.5 });
    g.clipTo(gs, (h) => {
      h.lod(1, (k) => lines(k, [[[42, -128], [58, -128]], [[42, -122], [56, -122]], [[44, -116], [54, -116]]], '#5a5a66', 0.9, 1));
      h.fill(blob([[34, -112], [44, -116], [50, -108], [36, -106]], 0.6), '#6a8a3a', { op: 0.9 });
    });
    g.stroke(spline([[46, -108], [50, -104], [54, -108]]), '#6a4a2e', 1.6);
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(path([[24, -116], [42, -114], [46, -90], [50, -72], [36, -70], [32, -90]]), ROBE, 'cloth', { hi: 0.35 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(ellipse(44, -66, 7, 5), BONE, 'bone');
    for (const dx of [-5, -1, 3]) g.mat(limb(44 + dx, -64, 46 + dx, -58, 1.8, 1.6), BONE, 'bone');
  });
  emblem(F, 'emblem', 'torso', 25, -28, -86, 3, { zb: 25 });

  F.anim({
    // stützt sich auf die Keule, Seelenlichter kreisen
    idle: { p: { breathe: 0.02, bob: 1, sway: 1, tilt: 2 }, keys: { buddy: { r: [[0, 0], [1, 360]] }, jaw: { r: [[0, 0], [0.6, 0], [0.65, 10], [0.7, 0], [0.75, 10], [0.8, 0]] } } },
    // schwerer Schritt, die Robe schleift
    walk: { p: { stride: 6, bob: 3, armSwing: 4, skirt: 4 }, keys: { buddy: { r: [[0, 0], [1, 180]] } }, ev: { step: [0.25, 0.75] } },
    // Keule über den Kopf, Flächenschlag
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -170, strike: -40, over: 10, lean: 10, lunge: 12 }, keys: { jaw: { r: [[0, 0], [0.5, 14], [0.8, 0]] } }, ev: { strike: 0.55 } },
    // Geweih wackelt
    hit: { p: { knock: 1.2, recoil: 3 }, keys: { hat: { r: [[0, 0], [0.15, -6], [0.3, 5], [0.5, 0]] } } },
    // steigt aus dem Boden
    spawn: { prog: 'still', keys: { root: { sy: [[0, 0.2], [0.7, 1, 'out']] }, alpha: [[0, 0], [0.4, 1]] } },
    // Seelenruf: hebt die Keule, das Geweih leuchtet
    ability: { keys: { armF: { r: [[0, 0], [0.3, -150], [1, -150]] }, jaw: { r: [[0, 0], [0.3, 14], [1, 14]] }, buddy: { r: [[0, 0], [1, 540]] } }, ev: { ability: 0.4 } },
    // zerfällt, die Krone fällt
    death: { prog: 'still', keys: { expr: [[0, 1, 'death']], root: { sy: [[0, 1], [0.5, 0.4, 'in']] }, hat: { x: [[0, 0], [0.3, 0], [0.8, 20]], y: [[0, 0], [0.3, 0], [0.8, 100]], r: [[0, 0], [0.3, 0], [0.8, 90]] }, alpha: [[0, 1], [0.6, 1], [1, 0]] } },
  });
}
