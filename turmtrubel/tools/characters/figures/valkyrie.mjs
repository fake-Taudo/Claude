// Walküre – lachende Kriegerin mit Flügelhelm, abstehenden Zöpfen und Rad-Doppelaxt (Brief: docs/briefs/valkyrie.md)
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, arc } from '../geo.mjs';
import { faceSet, furEdge, rivets, stitches, lines, emblem, INK, WHITE } from '../kit.mjs';

/** o.hero: Heldin mit großen goldenen Sturmschwingen am Helm und Windbändern (valkyrie-hero). */
export default function valkyrie(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const SCALE = P.main;
  const COPPER = P.acc;
  const BRAID = '#f2e6c4';
  const STEEL = '#b8c2cc';
  const WING = '#f6f2ea';
  const SKIN = '#f1bf96';
  const LEATHER = '#7a4e2c';
  const WOOD = '#9a6a3a';

  F.rig(
    'biped',
    {
      hip: [0, -31],
      torso: [0, -34],
      head: [2, -64],
      hat: [2, -82],
      braidB: [-9, -70],
      braidF: [13, -70],
      armB: [-15, -61],
      handB: [-19, -42],
      armF: [15, -61],
      handF: [21, -43],
      prop: [21, -43],
      legB: [-7, -31],
      footB: [-8, -8],
      legF: [7, -31],
      footF: [8, -8],
    },
    { braidB: 'head', braidF: 'head' },
  );

  // ───────── Beine: Fellstiefel unter dem Faltenrock ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -32, x * 1.1, -10, 6.6, 5.8), SKIN, 'skin');
    });
    F.part(foot, { bone: foot, z: z + 1 }, (g) => {
      const fx = x * 1.1;
      g.mat(path([[fx - 6, -17], [fx + 5.4, -17], [fx + 6, -7], [fx + 10.6, -3.6], [fx + 10.8, 0, 1], [fx - 7, 0, 1], [fx - 7.2, -8]]), '#8a6a4e', 'fur', { hi: 0.25 });
      furEdge(g, [[fx - 7, -16.4], [fx - 1, -17.6], [fx + 6, -16.4]], 2.4, '#a8886a', { side: -1, step: 2.1, seed: x > 0 ? 9 : 4, lod: 1 });
      g.mat(rrect(fx - 6.6, -12, 12.4, 2.4, 1), COPPER, 'gold', { lod: 1 });
    });
  };
  leg('legB', 'footB', -7, 6);
  leg('legF', 'footF', 7, 8);

  // ───────── Hinterer Zopf und hinterer Arm ─────────
  const braid = (name, x0, y0, s, z, zb, len) => {
    F.part(name, { bone: name, z, zb }, (g) => {
      // dicker, geflochtener Zopf, steht seitlich ab und hängt dann
      for (let i = 0; i < len; i++) {
        const x = x0 + s * (3 + i * 4.6);
        const y = y0 + i * i * 0.45 + i * 0.6;
        g.mat(ellipse(x, y, 3.9, 3.2, s * (14 + i * 9)), BRAID, 'hair', { hi: 0.4 });
        g.stroke(polyline([[x - s * 1.4, y - 2.4], [x + s * 0.6, y + 2.4]]), '#c8b890', 0.5, { lod: 2 });
      }
      const ex = x0 + s * (3 + len * 4.6);
      const ey = y0 + len * len * 0.45 + len * 0.6;
      g.mat(path([[ex - 2.4, ey - 2], [ex + 2.6, ey - 1.6], [ex + s * 3.4, ey + 4.6, 1], [ex - s * 0.6, ey + 3.6]]), BRAID, 'hair');
      g.mat(rrect(x0 + s * 3 - 3, y0 - 2.6, 6, 5.2, 1.6), COPPER, 'gold');
      g.mat(rrect(ex - 2.8, ey - 3, 5.6, 2.6, 1), COPPER, 'gold', { lod: 1 });
    });
  };
  braid('braidB', -9, -70, -1, 9, 38, 4);
  F.part('armB', { bone: 'armB', z: 12, zb: 42 }, (g) => {
    g.mat(limb(-15, -61, -18.6, -44, 5.8, 5), '#d9a882', 'skin');
    g.mat(limb(-17.6, -50, -18.8, -43, 6.6, 6.4), LEATHER, 'leather');
  });
  F.part('handB', { bone: 'handB', z: 13, zb: 43 }, (g) => {
    g.mat(circle(-19.2, -40.6, 3.6), '#d9a882', 'skin');
  });

  // ───────── Rumpf: Schuppenpanzer, Faltenrock, Gürtel ─────────
  F.part('skirt', { bone: 'hip', z: 17, zb: 17 }, (g) => {
    const sk = path([[-14, -36], [14, -36], [18, -19], [9, -16.6], [0, -18], [-9, -16.6], [-18, -19]]);
    g.mat(sk, LEATHER, 'leather');
    lines(g, [[[-10, -34], [-12.6, -18]], [[-4, -34], [-4.6, -17.6]], [[3, -34], [3.4, -17.6]], [[10, -34], [12.6, -18]]], '#5a361a', 0.7, 1);
  });
  F.part('torso', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    const t = path([[-14, -62], [-4, -64], [8, -64], [15, -62], [17, -48], [14, -35, 1], [-13, -35, 1], [-16.6, -48]]);
    g.mat(t, SCALE, 'metal', { hi: 0.6 });
    g.clipTo(t, (h) => {
      for (let row = 0; row < 8; row++) {
        const y = -62 + row * 3.6;
        for (let x = -18 + (row % 2) * 2.4; x < 19; x += 4.8) h.stroke(spline([[x - 2.4, y], [x, y + 2.6], [x + 2.4, y]]), '#3e5866', 0.6, { lod: 1 });
      }
    });
  });
  F.part('belt', { bone: 'hip', z: 23, zb: 23, team: true }, (g) => {
    g.mat(rrect(-15, -39, 30, 5.4, 2), P.team, 'leather', { line: P.teamDeep });
  });
  F.part('buckle', { bone: 'hip', z: 24, view: 'front' }, (g) => {
    g.mat(circle(4, -36.3, 3.6), COPPER, 'gold');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.stroke(polyline([[4, -36.3], [4 + Math.cos(a) * 3, -36.3 + Math.sin(a) * 3]]), '#8a5420', 0.5, { lod: 1 });
    }
  });

  // ───────── Kopf ─────────
  F.part('head', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(path([[-8, -76], [4, -79], [14.6, -75], [16.6, -66], [14, -58], [6, -55], [-2, -56.6], [-7.6, -62]]), SKIN, 'skin');
  });
  faceSet(F, {
    eyes: [[11.2, -68, 2.4], [3, -68, 2.2]],
    iris: '#3a6a8a',
    lidColor: SKIN,
    look: [0.5, 0],
    lid: 0.12,
    brow: { color: '#c8a060', w: 1.7, lift: 0.4 },
    mouth: [8.6, -59.6, 6],
    mood: 'grin',
    attackMouth: 'grin',
    idle: (g) => {
      // Lachfalten
      g.stroke(spline([[14.4, -67], [15.8, -65.6], [15.4, -64]]), '#c8845a', 0.6, { lod: 1 });
    },
  });
  F.part('freckles', { bone: 'head', z: 33.2, view: 'front', lod: 1 }, (g) => {
    for (const [x, y] of [[12.6, -63.4], [14, -62.6], [13.4, -61.4], [2.6, -63.6], [4, -62.8], [1.6, -62.4]]) g.fill(circle(x, y, 0.5), '#c8784a');
  });
  F.part('nose', { bone: 'head', z: 33, view: 'front' }, (g) => {
    g.mat(ellipse(7.8, -63.6, 2, 1.8), '#e8a882', 'skin', { line: '#b07a5c', lw: 0.6 });
  });
  F.part('hairBack', { bone: 'head', z: 33, zb: 33, view: 'back' }, (g) => {
    g.mat(path([[-9, -76], [16, -76], [16, -62], [8, -57], [-1, -58], [-8.6, -63]]), BRAID, 'hair');
    g.stroke(polyline([[3.6, -76], [3.6, -58]]), '#c8b890', 0.7, { lod: 1 });
  });
  F.part('helmet', { bone: 'head', z: 34, zb: 34 }, (g) => {
    const dome = path([[-10.6, -71.6, 1], [-10, -79], [-4, -85.6], [5, -87.6], [13.6, -84.6], [18, -78], [18.4, -71.6, 1]]);
    g.mat(dome, STEEL, 'metal');
    g.mat(rrect(-11.6, -74.4, 31, 4.4, 1.8), COPPER, 'gold');
    rivets(g, [[-7, -72.2], [1, -72.2], [9, -72.2], [16, -72.2]], 0.75, '#f0c890');
    g.stroke(spline([[4, -87], [4.6, -80], [4.4, -74.6]]), '#e6eef4', 0.8, { lod: 1 });
  });
  // Helmflügel (Spitzen = Teamzone), hinterer Flügel mit abgebrochener Feder
  const wing = (name, x, s, z, zb) => {
    F.part(name, { bone: 'hat', z, zb, team: true }, (g) => {
      const X = (dx) => x + dx * s;
      const w = path([[X(0), -80], [X(5), -88], [X(9), -95], [X(11.6), -99.6, 1], [X(9.6), -92], [X(8), -88.4], [X(6.6), -84], [X(3), -78.4]]);
      g.mat(w, WING, 'cloth', { hi: 0.4 });
      g.mat(path([[X(9), -95], [X(11.6), -99.6, 1], [X(9.6), -92], [X(8.8), -91.6]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.5 });
      lines(g, [[[X(3), -82], [X(7.6), -86]], [[X(5), -86.6], [X(9), -91]]], '#c8c0b0', 0.55, 1);
    });
  };
  if (!H) {
    wing('wingB', -6, -1, 33.5, 36);
    wing('wingF', 12, 1, 35, 35.5);
  } else {
    // Sturmschwingen: große goldene Flügel aus drei Federlagen
    const storm = (name, x, s, z, zb, k) => {
      F.part(name, { bone: 'hat', z, zb, sig: true }, (g) => {
        const X = (dx) => x + dx * s;
        // breite Federfächer: vier gestaffelte Federn, die längste zuerst
        for (let i = 0; i < 4; i++) {
          const L = (25 - i * 4) * k;
          const ang = ((-62 - i * 16) * Math.PI) / 180;
          const ux = Math.cos(ang) * s;
          const uy = Math.sin(ang);
          const nx = -uy * s;
          const ny = Math.cos(ang);
          const bx = X(1);
          const by = -78;
          const w = 4.6 * k;
          g.mat(path([[bx, by], [bx + ux * L * 0.5 + nx * w, by + uy * L * 0.5 + ny * w * s], [bx + ux * L, by + uy * L, 1], [bx + ux * L * 0.55 - nx * w * 0.6, by + uy * L * 0.55 - ny * w * 0.6 * s]]), ['#f8e090', '#f0c050', COPPER, '#d8962a'][i], 'gold', { hi: 0.6 });
          g.stroke(polyline([[bx, by], [bx + ux * L * 0.85, by + uy * L * 0.85]]), '#b8842a', 0.5, { lod: 1 });
        }
      });
    };
    storm('stormB', -6, -1, 33.5, 36, 0.85);
    storm('stormF', 12, 1, 35, 35.5, 1);
    // Windbänder (Teamzone) am Helm und an der Axt
    F.part('bandsHelm', { bone: 'hat', z: 34.6, zb: 36.6, team: true }, (g) => {
      g.mat(path([[-10, -74], [-18, -76], [-26, -71], [-32, -74, 1], [-26, -67], [-18, -71], [-10, -71]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
    });
  }
  braid('braidF', 13, -70, 1, 36, 8, 4);

  // ───────── Rad-Doppelaxt (Signature) ─────────
  // Axt ruht mit dem Rad neben den Beinen am Boden: großer Kreis neben dem Körper
  const HUB = [32, -15];
  F.part('axe', { bone: 'prop', z: 38, zb: 4, sig: true }, (g) => {
    g.mat(path([[18.6, -53], [21.6, -54], [31.6, -18], [28.6, -17]]), WOOD, 'wood');
    g.lod(1, (h) => h.stroke(polyline([[20.6, -51], [29.6, -21]]), '#c09060', 0.5));
    g.mat(circle(19.6, -54.6, 2.2), COPPER, 'gold');
    axeHead(g, HUB, 12.4, false);
  });
  function axeHead(g, [cx, cy], R, evo) {
    // zwei Mondklingen außen am Kranz
    for (const a of [-35, 145]) {
      // arc() rechnet in Grad
      const outer = arc(cx, cy, R + 7.6, R + 7.6, a - 54, a + 54, 10);
      const inner = arc(cx, cy, R + 0.6, R + 0.6, a + 40, a - 40, 8);
      g.mat(path([...outer.map((p, i) => (i === 0 || i === outer.length - 1 ? [...p, 1] : p)), ...inner]), evo ? '#a8d8f0' : STEEL, 'metal', { hi: 0.9 });
      g.stroke(spline(arc(cx, cy, R + 6, R + 6, a - 40, a + 40, 8)), evo ? '#e8f8ff' : '#e2e8ee', 0.6, { lod: 1 });
    }
    g.stroke(circle(cx, cy, R), evo ? '#7ac8f0' : '#8a929c', 3);
    g.stroke(circle(cx, cy, R), evo ? '#c8f0ff' : '#c8d0d8', 1, { lod: 1 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      g.stroke(polyline([[cx + Math.cos(a) * 3, cy + Math.sin(a) * 3], [cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1)]]), WOOD, 1.7);
    }
    g.mat(circle(cx, cy, 3.6), COPPER, 'gold');
    g.fill(circle(cx, cy, 1.2), '#8a5420', { lod: 1 });
  }

  // ───────── Vorderer Arm ─────────
  if (H) {
    F.part('bandsAxe', { bone: 'prop', z: 38.6, zb: 4.6, team: true }, (g) => {
      g.mat(path([[20, -52], [12, -50], [6, -54], [0, -51, 1], [6, -48], [13, -47], [20.6, -49]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.6 });
      g.mat(path([[20.4, -50], [14, -44], [10, -45], [5, -40, 1], [11, -41], [15, -40.6], [21, -47]]), P.teamShade, 'cloth', { line: P.teamDeep, lw: 0.6 });
    });
  }
  F.part('armF', { bone: 'armF', z: 40, zb: 6 }, (g) => {
    g.mat(limb(15, -61, 19.6, -45, 5.8, 5), SKIN, 'skin');
    g.mat(limb(18.4, -51, 20, -44, 6.6, 6.4), LEATHER, 'leather');
    stitches(g, [[15.6, -49.6], [22.6, -48]], '#d9a860', { step: 1.8, len: 0.8 });
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => {
    g.mat(circle(21.4, -42.4, 3.7), SKIN, 'skin');
  });
  F.part('pauldron', { bone: 'armF', z: 39.5, zb: 7.5 }, (g) => {
    g.mat(path([[8, -63], [14, -67], [21, -64], [22.6, -57], [17.6, -54], [10, -56]]), SCALE, 'metal');
    g.mat(rrect(9.6, -58.4, 13, 2.6, 1), COPPER, 'gold', { lod: 1 });
  });
  emblem(F, 'emblem', 'torso', 22, 5, -52, 3, { zb: 22 });

  // ───────── Evolution (Wirbelsturm): sturmblaue Klingen, Windbänder, Wolkenschnalle ─────────
  if (!H) evolution();
  function evolution() {
  F.part('evoAxe', { bone: 'prop', z: 38.5, zb: 4.5, evo: 'evo', glow: true }, (g) => {
    g.stroke(circle(...HUB, 12.4), '#7ad8ff', 1.6, { op: 0.8 });
    for (const a of [-35, 145]) {
      g.stroke(spline(arc(...HUB, 19.6, 19.6, a - 52, a + 52, 10)), '#9ae8ff', 1.4, { op: 0.9 });
    }
  });
  F.part('evoBands', { bone: 'hat', z: 36.5, evo: 'evo' }, (g) => {
    g.stroke(spline([[-10, -76], [-16, -78], [-22, -74], [-26, -77]]), '#9ad8f0', 1.4);
    g.stroke(spline([[-9, -73], [-15, -72], [-20, -69]]), '#c8eeff', 1);
  });
  F.part('evoBuckle', { bone: 'hip', z: 24.5, evo: 'evo', view: 'front' }, (g) => {
    g.mat(path([[0, -35], [1, -38.4], [4, -39.6], [7, -38.4], [8.6, -35.6], [6, -33.6], [2, -33.6]]), '#e8f4fa', 'cloth', { line: '#6a9ab8' });
  });

  }

  F.anim({
    // stützt die Axt auf und wirft einen Zopf zurück; das Rad dreht sich langsam nach
    idle: { p: { breathe: 0.03, bob: 0.8, sway: 2, armF: -6 }, keys: { braidF: { r: [[0, 0], [0.5, 0], [0.6, -24, 'out'], [0.8, 4], [1, 0]] }, braidB: { r: [[0, 0], [0.6, 0], [0.7, 10], [1, 0]] } } },
    // kraftvoller Schritt, Zöpfe schwingen
    walk: { p: { stride: 24, bob: 2.6, armSwing: 5, lean: 3, armF: -6 }, keys: { braidF: { r: [[0, -10], [0.5, 10], [1, -10]] }, braidB: { r: [[0, 10], [0.5, -10], [1, 10]] } }, ev: { step: [0.25, 0.75] } },
    // Ausholen mit Hüftdrehung, ganzer Körper dreht sich einmal mit der Axt, Zöpfe fliegen waagerecht
    attack: {
      prog: 'atk.swing',
      hit: 0.55,
      p: { wind: 25, strike: -85, over: -6, cock: 10, snap: -10, lean: -6, lunge: 8, step: 2, windO: 30, strikeO: -40 },
      keys: {
        root: { sx: [[0, 1], [0.3, 1], [0.42, 0.2], [0.43, -0.2], [0.55, -1], [0.67, -0.2], [0.68, 0.2], [0.8, 1], [1, 1]], r: [[0, 0], [0.3, -4], [0.55, 4], [0.85, -3], [1, 0]] },
        view: [[0.43, 0.68, 'flip']],
        braidF: { r: [[0, 0], [0.3, 20], [0.55, -60], [0.8, -20], [1, 0]] },
        braidB: { r: [[0, 0], [0.3, -20], [0.55, 60], [0.8, 20], [1, 0]] },
      },
    },
    ...(H
      ? {
          // Wilder Wirbelwind: Dauerdrehung mit ausgestreckter Axt
          ability: {
            prog: 'biped.idle',
            keys: {
              expr: [[0, 1, 'attack']],
              armF: { r: [[0, -85], [1, -85]] },
              root: { sx: [[0, 1], [0.12, 0.2], [0.13, -0.2], [0.25, -1], [0.37, -0.2], [0.38, 0.2], [0.5, 1], [0.62, 0.2], [0.63, -0.2], [0.75, -1], [0.87, -0.2], [0.88, 0.2], [1, 1]] },
              view: [[0.13, 0.38, 'flip'], [0.63, 0.88, 'flip']],
              braidF: { r: [[0, -50], [1, -50]] },
              braidB: { r: [[0, 50], [1, 50]] },
            },
            ev: { ability: 0.1 },
          },
        }
      : {}),
    hit: { p: { knock: 2.4, recoil: 6 }, keys: { braidF: { r: [[0, 0], [0.2, -30], [1, 0]] }, braidB: { r: [[0, 0], [0.2, 25], [1, 0]] } } },
    // halbe Drehung bei der Landung
    spawn: { keys: { root: { sx: [[0, -1], [0.3, -0.2], [0.31, 0.2], [0.6, 1], [1, 1]] }, view: [[0, 0.3, 'flip']] } },
    // dreht sich aus und fällt, die Axt rollt wie ein Rad davon
    death: { p: { dir: -1, angle: 80 }, keys: { prop: { y: [[0, 0], [0.3, 0], [1, 24, 'out']], r: [[0, 0], [0.3, 0], [1, 220, 'out']] } } },
  });
}
