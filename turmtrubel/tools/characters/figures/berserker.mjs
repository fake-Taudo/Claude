// Berserkerin – wilde Kampfköchin mit Kupfertopf als Helm (Henkel wie Hörner) und zwei Gusseisen-Bratpfannen
// (Brief: docs/briefs/berserker.md). o.hero: Bärenfell-Umhang mit Bärenkopf-Kapuze, Bärengeist (berserker-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { faceSet, furEdge, lines, rivets, emblem, INK, WHITE } from '../kit.mjs';

export default function berserker(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const COPPER = H ? '#c96f3b' : P.main;
  const DRESS = P.acc;
  const FUR = H ? P.main : null;
  const IRON = '#3e3c42';
  const BRAID = '#e3c06b';
  const SKIN = '#f0c09a';
  const APRON_EDGE = '#f4efe2';
  const DRESS_D = '#26402c';

  F.rig('biped', {
    hip: [0, -32],
    torso: [0, -35],
    head: [3, -56],
    hat: [3, -72],
    back: [-6, -50],
    armB: [-11, -54],
    handB: [-15, -40],
    propB: [-15, -40],
    armF: [11, -54],
    handF: [17, -41],
    prop: [17, -41],
    legB: [-4, -30],
    footB: [-5, -5],
    legF: [4, -30],
    footF: [5, -5],
    cape: [-3, -55],
  });

  // ───────── Held: Bärenfell-Umhang (Rang-Merkmal) ─────────
  if (H) {
    F.part('fur', { bone: 'cape', z: 3, zb: 44, sig: true }, (g) => {
      const c = path([[-12, -58], [6, -60], [4, -46], [-2, -30], [-10, -16], [-20, -18], [-22, -34], [-18, -50]]);
      g.mat(c, FUR, 'fur', { hi: 0.4 });
      g.lod(1, (h) => furEdge(h, [[-10, -16], [-20, -18], [-22, -34]], 2.6, '#4a3020'));
      g.lod(1, (h) => lines(h, [[[-12, -54], [-16, -24]], [[-6, -54], [-8, -30]]], '#4a3020', 0.6, 1));
    });
  }

  // ───────── Beine: Ringelstrümpfe, Holzclogs ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      const l = limb(x, -30, x * 1.05, -7, 3.2, 2.8);
      g.mat(l, '#f4efe2', 'cloth');
      g.clipTo(l, (h) => {
        for (let y = -28; y < -6; y += 4) h.fill(rrect(x - 5, y, 10, 2, 0), '#c84a3a');
      });
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      g.mat(path([[x - 3.6, -7], [x + 3.4, -7.4], [x + 8.6, -3, 1], [x + 9, 0, 1], [x - 4.4, 0, 1]]), '#b8864a', 'wood', { hi: 0.5 });
    });
  };
  leg('legB', 'footB', -4, 6);
  leg('legF', 'footF', 4, 8);

  // ───────── Kleine Pfanne in der hinteren Hand ─────────
  const pan = (g, hx, hy, cx, cy, r) => {
    g.mat(path([[hx - 1.4, hy, 1], [hx + 1.4, hy, 1], [cx + r * 0.25, cy + r * 0.85], [cx - r * 0.25, cy + r * 0.9]]), '#5a3a22', 'wood');
    g.mat(circle(cx, cy, r), IRON, 'metal', { hi: 0.7 });
    g.mat(circle(cx, cy, r * 0.72), '#2a282e', 'metal');
    g.lod(1, (h) => h.fill(ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.24, r * 0.14, -40), '#8a8890', { op: 0.6 }));
    g.lod(2, (h) => h.fill(ellipse(cx + r * 0.2, cy + r * 0.3, r * 0.3, r * 0.2), '#1a181e', { op: 0.6 }));
  };
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(-11, -54, -13, -46, 3.8, 3.4), DRESS_D, 'cloth');
    g.mat(limb(-13, -46, -15, -41, 3, 2.8), '#d8a884', 'skin');
  });
  F.part('panB', { bone: 'propB', z: 8, zb: 43.5 }, (g) => pan(g, -15, -40, -21, -56, 6.6));
  F.part('handB', { bone: 'handB', z: 10, zb: 44 }, (g) => g.mat(circle(-15, -40, 3), '#d8a884', 'skin'));
  if (H) F.part('clawsB', { bone: 'propB', z: 8.5, zb: 43.7, glow: true, state: ['attack', 'ability'] }, (g) => lines(g, [[[-26, -60], [-24, -62]], [[-27, -56], [-25, -57]]], '#ff7a3a', 1, 0));

  // ───────── Wollkleid, Schürze (Teamzone) mit weißer Rüsche, Kochlöffel ─────────
  F.part('skirt', { bone: 'hip', z: 16, zb: 16 }, (g) => g.mat(path([[-9, -36], [10, -36], [14, -20], [15, -14], [-14, -14], [-13, -20]]), DRESS, 'cloth', { hi: 0.35 }));
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(path([[-13, -54], [-3, -57], [9, -57], [14, -54], [12, -44], [9, -34], [-9, -34], [-11, -44]]), DRESS, 'cloth', { hi: 0.4 });
  });
  F.part('apron', { bone: 'hip', z: 22, zb: 22, team: true }, (g) => {
    const a = path([[-6, -48], [10, -48], [11, -36], [13, -16], [-8, -16], [-7, -36]]);
    g.mat(a, P.team, 'cloth', { line: P.teamDeep, hi: 0.3 });
    g.clipTo(a, (h) => {
      h.fill(rrect(-1, -32, 8, 6, 1), P.teamShade, { lod: 1 });
      h.lod(1, (k) => k.stroke(polyline([[-1, -32], [7, -32]]), P.teamDeep, 0.5));
    });
  });
  F.part('apronFrill', { bone: 'hip', z: 22.5, zb: 22.5 }, (g) => {
    const pts = [];
    for (let i = 0; i <= 7; i++) pts.push([-8 + i * 3, -16 + (i % 2 ? 2 : 0), i % 2 ? 1 : 0]);
    g.mat(path([[-8, -18], [13, -18], ...pts.reverse()]), APRON_EDGE, 'cloth');
  });
  F.part('spoon', { bone: 'hip', z: 23, zb: 23 }, (g) => {
    g.mat(path([[-10, -44, 1], [-8.6, -44, 1], [-9.4, -30, 1], [-10.6, -30, 1]]), '#a8763e', 'wood');
    g.mat(ellipse(-9.6, -46.6, 2, 3), '#a8763e', 'wood');
  });

  // ───────── Kopf: runde Wangen, lachender Mund mit Zahnlücke, Zöpfe unter dem Topf ─────────
  F.part('braidB', { bone: 'head', z: 28, zb: 36 }, (g) => {
    for (let i = 0; i < 4; i++) g.mat(ellipse(-7 - i * 0.6, -60 + i * 4, 2.6, 2.4), BRAID, 'hair', { hi: 0.4 });
  });
  F.part('ribbonB', { bone: 'head', z: 28.5, zb: 36.5, team: true }, (g) => g.mat(path([[-9.6, -46], [-13, -44, 1], [-12, -48, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(blob([[-6, -62], [-4, -70], [4, -73], [12, -70], [15, -62], [14, -55], [8, -51], [0, -52], [-5, -56]], 0.75), SKIN, 'skin', { hi: 0.3 });
    g.fill(ellipse(12, -56.6, 2.4, 1.6), '#f08a7a', { op: 0.6, lod: 1 });
  });
  faceSet(F, {
    eyes: [[10.6, -61.6, 2.3], [4.4, -61.6, 2.1]],
    iris: '#3a6a3a',
    lidColor: SKIN,
    lid: 0,
    look: [0.3, -0.2],
    irisR: 0.4,
    brow: { color: '#c89a3a', w: 1.2, lift: 1.2 },
    idleTilt: -0.6,
    mouth: [9, -55.6, 5.4],
    mood: 'grin',
    attackMouth: 'shout',
    idle: (g) => g.fill(rrect(8.4, -57.4, 1.4, 1.4, 0), '#4a1c24'),
    replace: {
      // getroffen: Topf rutscht über die Augen, sie schreit empört
      hurt: (g) => g.fill(ellipse(9, -55, 2.6, 2.4), '#5a1c24', { stroke: INK, lw: 0.6 }),
    },
  });
  F.part('braidF', { bone: 'head', z: 33.6, zb: 29 }, (g) => {
    for (let i = 0; i < 4; i++) g.mat(ellipse(15 + i * 0.4, -59 + i * 4, 2.4, 2.2), BRAID, 'hair', { hi: 0.4 });
  });
  F.part('ribbonF', { bone: 'head', z: 33.8, zb: 29.2, team: true }, (g) => g.mat(path([[16, -45.6], [19.6, -43.4, 1], [19, -47.6, 1]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => g.mat(ellipse(14, -59, 2, 1.6), '#f0a888', 'skin', { line: '#c87a5a', lw: 0.4 }));
  // Kupferkochtopf (Signature beim Grundtyp) mit Henkeln wie Hörner und Deckelknauf
  F.part('pot', { bone: 'hat', z: 35, zb: 35, sig: !H }, (g) => {
    g.mat(path([[-8, -64], [-8, -76], [15, -76], [15, -64]].map((p) => [...p, 1])), COPPER, 'metal', { hi: 0.9 });
    g.mat(rrect(-10, -66, 27, 3.6, 1.4), '#a8582a', 'metal');
    g.mat(rrect(-9, -78, 25, 3, 1.4), '#a8582a', 'metal');
    g.mat(circle(3.6, -80.6, 2.2), '#a8582a', 'metal', { hi: 0.8 });
    // Henkel
    g.mat(path([[-8, -73], [-14, -78, 1], [-15, -75], [-8, -70]]), '#a8582a', 'metal');
    g.mat(path([[15, -73], [21, -78, 1], [22, -75], [15, -70]]), '#a8582a', 'metal');
    g.lod(1, (h) => {
      rivets(h, [[-6, -70], [13, -70]], 0.6, '#f0b080');
      h.fill(ellipse(9, -71, 1.6, 1), '#8a4a20', { op: 0.6 });
    });
  });
  if (H) {
    // Bärenkopf-Kapuze über dem Topf
    F.part('bearHood', { bone: 'hat', z: 36, zb: 36 }, (g) => {
      g.mat(blob([[-12, -70], [-8, -82], [4, -88], [16, -84], [20, -76], [16, -72], [-6, -70]], 0.7), FUR, 'fur', { hi: 0.5 });
      g.mat(circle(-6, -84, 3), FUR, 'fur');
      g.mat(circle(12, -87, 3), FUR, 'fur');
      g.mat(path([[16, -80], [24, -78, 1], [24, -74], [16, -73]]), '#8a6a4a', 'fur');
      g.fill(circle(23.6, -77.6, 1.2), INK);
      g.fill(ellipse(12, -80, 1.4, 1), '#ffd27a');
      g.lod(1, (h) => furEdge(h, [[-12, -70], [16, -72]], 2, '#4a3020', { side: -1 }));
    });
    F.part('bearSpirit', { bone: 'root', z: 1, zb: 1, state: 'ability', glow: true }, (g) => {
      g.fill(blob([[-30, -40], [-26, -76], [-8, -100], [16, -100], [34, -80], [36, -40], [20, -10], [-20, -10]], 0.8), '#ff9a4a', { op: 0.35 });
      g.fill(circle(-6, -96, 6), '#ff9a4a', { op: 0.35 });
      g.fill(circle(18, -96, 6), '#ff9a4a', { op: 0.35 });
    });
  }

  // ───────── Große Pfanne und vorderer Arm ─────────
  F.part('panF', { bone: 'prop', z: 38, zb: 4 }, (g) => pan(g, 17, -41, 25, -58, 8.4));
  if (H) F.part('clawsF', { bone: 'prop', z: 38.5, zb: 4.5, glow: true, state: ['attack', 'ability'] }, (g) => lines(g, [[[32, -64], [34, -66]], [[33, -59], [35.4, -60]], [[32, -54], [34, -54]]], '#ff7a3a', 1.2, 0));
  F.part('sparks', { bone: 'prop', z: 39, state: 'clang', glow: true }, (g) => {
    for (const [x, y] of [[18, -66], [14, -62], [20, -70]]) g.fill(poly([[x, y - 2], [x + 0.6, y], [x, y + 2], [x - 0.6, y]], 0.2), '#ffe08a');
  });
  F.part('armF', { bone: 'armF', z: 29, zb: 6 }, (g) => {
    g.mat(limb(11, -54, 14, -46, 3.8, 3.4), DRESS, 'cloth');
    g.mat(limb(14, -46, 17, -42, 3, 2.8), SKIN, 'skin');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(17, -41, 3.2), SKIN, 'skin'));
  emblem(F, 'emblem', 'torso', 25, -6, -46, 2.1, { zb: 25 });

  F.anim({
    // schlägt die Pfannen gegeneinander, Funken springen; der Topf wackelt
    idle: H
      ? { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 3 }, keys: { armF: { r: [[0, 0], [0.3, -40], [0.7, -40], [1, 0]] }, armB: { r: [[0, 0], [0.3, -40], [0.7, -40], [1, 0]] }, hat: { r: [[0, 0], [0.5, 4], [1, 0]] } } }
      : { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 3 }, keys: { armB: { r: [[0, 0], [0.3, -60], [0.4, -40], [0.5, -60], [0.6, 0]] }, prop: { r: [[0, 0], [0.3, -30], [0.4, -20], [0.5, -30], [0.6, 0]] }, hat: { r: [[0, 0], [0.4, 6], [0.5, -6], [0.6, 0]] }, show: { clang: [[0.38, 0.45], [0.48, 0.55]] } } },
    // hüpfender Laufschritt, Pfannen schwingen
    walk: { prog: 'biped.run', p: { stride: 28, bob: 3, armSwing: 26, lean: 6 } },
    // abwechselnde Pfannenschläge links und rechts
    attack: {
      prog: 'atk.swing',
      hit: 0.5,
      p: { wind: -120, strike: -30, over: 10, cock: -20, snap: 30, lean: 8, lunge: 10 },
      keys: { armB: { r: [[0, 0], [0.5, 0], [0.65, -110], [0.85, -20], [1, 0]] }, propB: { r: [[0, 0], [0.65, -20], [0.85, 30], [1, 0]] }, hat: { r: [[0, 0], [0.5, -8], [0.6, 6], [0.85, -6], [1, 0]] }, layer: [[0.1, 0.46, 'panF', 27, 4], [0.1, 0.46, 'armF', 26.5, 6], [0.1, 0.46, 'handF', 27.5, 7]] },
      ev: { strike: [0.5] },
    },
    // Topf rutscht über die Augen
    hit: { p: { knock: 2, recoil: 5 }, keys: { hat: { y: [[0, 0], [0.2, 6, 'in'], [1, 3]] } } },
    // landet, schlägt die Pfannen zusammen
    spawn: { keys: { armB: { r: [[0, 0], [0.6, 0], [0.8, -60], [1, 0]] }, show: { clang: [[0.75, 0.9]] } } },
    // setzt sich hin, der Topf fällt herunter und dreht sich aus
    death: {
      prog: 'still',
      keys: {
        expr: [[0, 1, 'death']],
        root: { y: [[0, 0], [0.35, 9, 'in']] },
        legF: { r: [[0, 0], [0.35, -78]] },
        legB: { r: [[0, 0], [0.35, -70]] },
        armF: { r: [[0, 0], [0.4, 20]] },
        hat: { x: [[0, 0], [0.3, 0], [0.8, 16, 'out']], y: [[0, 0], [0.3, 0], [0.6, 40], [0.8, 42]], r: [[0, 0], [0.3, 0], [0.8, -200]] },
        alpha: [[0, 1], [0.7, 1], [1, 0]],
      },
    },
    ...(H
      ? {
          // Wilde Wut: Bärengeist umhüllt sie
          ability: { keys: { armF: { r: [[0, 0], [0.3, -150], [1, -150]] }, armB: { r: [[0, 0], [0.3, -150], [1, -150]] }, expr: [[0, 1, 'attack']] }, ev: { ability: 0.4 } },
        }
      : {}),
  });
}
