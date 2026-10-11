// Mini-P.E.K.K.A. – kleiner, eifriger Kessel-Automat aus Zinn mit Zyklopenauge, Dampfpfeife und Riesen-Rohrzange
// (Brief: docs/briefs/mini-pekka.md). o.hero: patinagrüner Automat mit Pfannkuchen-Turm und Serviette (mini-pekka-hero).
import { ellipse, circle, rrect, poly, path, limb, polyline, spline, blob } from '../geo.mjs';
import { rivets, lines, emblem, INK, WHITE } from '../kit.mjs';

export default function miniPekka(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const TIN = P.main;
  const GRIP = H ? '#ff8a3d' : P.acc;
  const BRASS = '#c8a046';
  const JAW = '#b03a2a';
  const EYE = '#ffd8a8';
  const TIN_D = H ? '#4a7a64' : '#4e545e';
  const RIVET = '#c8ccd2';

  F.rig('biped', {
    hip: [0, -22],
    torso: [0, -26],
    head: [2, -70],
    hat: [2, -74],
    back: [-20, -56],
    armB: [-22, -50],
    handB: [-26, -30],
    armF: [26, -50],
    handF: [34, -32],
    prop: [34, -32],
    legB: [-8, -22],
    footB: [-9, -4],
    legF: [9, -22],
    footF: [10, -4],
    cape: [0, -60],
  });

  // ───────── Held: Pfannkuchen-Turm mit Sirupflasche (Rang-Merkmal) ─────────
  if (H) {
    F.part('pancakes', { bone: 'back', z: 3, zb: 46, sig: true }, (g) => {
      g.mat(ellipse(-26, -50, 14, 3), '#e8e4dc', 'gem', { hi: 0.6 });
      for (let i = 0; i < 3; i++) {
        const y = -54 - i * 6;
        g.mat(ellipse(-26, y, 12, 3.6), '#e8b060', 'cloth', { hi: 0.4 });
        g.lod(1, (h) => h.stroke(spline([[-37, y + 1], [-26, y + 2.6], [-15, y + 1]]), '#b8783a', 0.7));
      }
      g.mat(blob([[-34, -72], [-26, -74], [-18, -72], [-20, -68], [-30, -68]], 0.6), '#a8582a', 'gem', { hi: 0.8 });
      // Sirupflasche
      g.mat(path([[-14, -52, 1], [-6, -52, 1], [-6, -64], [-8, -68], [-8, -72], [-12, -72], [-12, -68], [-14, -64]]), '#b8682a', 'glass', { line: '#7a3a14' });
    });
  }

  // ───────── Stummelbeine mit breiten Füßen ─────────
  const leg = (name, foot, x, z) => {
    F.part(name, { bone: name, z }, (g) => g.mat(limb(x, -24, x, -6, 3.6, 3.2), TIN_D, 'metal', { hi: 0.6 }));
    F.part(foot, { bone: foot, z: z + 1 }, (g) => g.mat(path([[x - 7, -6], [x + 6, -6.6], [x + 11, -2], [x + 11, 0, 1], [x - 8, 0, 1]]), TIN_D, 'metal', { hi: 0.6 }));
  };
  leg('legB', 'footB', -8, 6);
  leg('legF', 'footF', 9, 8);

  // ───────── Hinterer Rohrarm ─────────
  F.part('armB', { bone: 'armB', z: 9, zb: 42 }, (g) => {
    g.mat(limb(-22, -50, -26, -32, 3.2, 3), TIN_D, 'metal', { hi: 0.6 });
    g.mat(circle(-24, -41, 4), BRASS, 'metal');
  });
  F.part('handB', { bone: 'handB', z: 10, zb: 43 }, (g) => g.mat(circle(-26, -28, 5), TIN_D, 'metal', { hi: 0.6 }));

  // ───────── Kesselkörper mit Zyklopenauge, Wasserstands-Skala, Manometer ─────────
  const boiler = ellipse(2, -48, 25, 25);
  F.part('boiler', { bone: 'torso', z: 20, zb: 20 }, (g) => {
    g.mat(boiler, TIN, 'metal', { hi: 0.8 });
    g.clipTo(boiler, (h) => {
      h.fill(rrect(-26, -30, 56, 4, 0), TIN_D);
      h.lod(1, (k) => {
        // Kalkflecken, Delle
        k.fill(ellipse(-12, -36, 4, 2.4), '#e8e8dc', { op: 0.5 });
        k.fill(ellipse(16, -34, 3, 2), TIN_D, { op: 0.6 });
      });
    });
    g.lod(1, (h) => rivets(h, [[-20, -60], [-23, -48], [-20, -36], [24, -60], [27, -48], [24, -36]], 0.9, RIVET));
    // Wasserstands-Skala
    g.mat(rrect(-16, -46, 4, 14, 1.6), '#d8f0f8', 'glass');
    g.fill(rrect(-15.4, -40, 2.8, 7.4, 1), H ? '#e8b060' : '#6ab8e0');
    // Manometer
    g.mat(circle(-8, -64, 4), BRASS, 'metal');
    g.fill(circle(-8, -64, 2.8), WHITE);
    g.stroke(polyline([[-8, -64], [-6, -66]]), INK, 0.6);
  });
  // Brustplakette (Teamzone)
  F.part('plaque', { bone: 'torso', z: 21, zb: 21, team: true }, (g) => g.mat(rrect(-2, -36, 12, 8, 2), P.team, 'metal', { line: P.teamDeep, hi: 0.7 }));
  if (H) {
    // Serviette (Teamzone)
    F.part('napkin', { bone: 'torso', z: 22, zb: 22, team: true }, (g) => {
      g.mat(path([[-14, -70], [18, -70], [8, -58], [2, -52, 1], [-4, -58]]), P.team, 'cloth', { line: P.teamDeep, hi: 0.4 });
      g.mat(path([[-14, -70], [-20, -76, 1], [-12, -74]]), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 });
    });
  }
  // Zyklopenauge mit Messingrand und Klappen-Lid
  F.part('eyeRim', { bone: 'torso', z: 23, zb: 23, view: 'front' }, (g) => {
    g.mat(circle(10, -52, 10), BRASS, 'gold', { hi: 0.9 });
    g.fill(circle(10, -52, 7.6), EYE);
  });
  const lidFlap = (g, open) => {
    // Klappe von oben: open = Anteil sichtbaren Auges
    const y = -59.6 + 15.2 * (1 - open);
    g.fill(path([[2.4, -59.6], [17.6, -59.6], [17.6, y], [2.4, y]]), TIN_D);
  };
  F.part('eye.idle', { bone: 'torso', z: 24, view: 'front', expr: 'idle', glow: true }, (g) => {
    g.fill(circle(11, -51, 4), H ? '#ffb070' : '#ff9a5a');
    g.fill(circle(12, -52.6, 1.4), WHITE);
  });
  F.part('eye.attack', { bone: 'torso', z: 24, view: 'front', expr: ['attack', 'ability'], glow: true }, (g) => {
    g.fill(circle(11.4, -49.6, 3.4), '#ff6a3a');
    lidFlap(g, 0.45);
  });
  F.part('eye.hurt', { bone: 'torso', z: 24, view: 'front', expr: ['hurt', 'stun', 'sleep', 'death'] }, (g) => {
    lidFlap(g, 0);
    g.stroke(polyline([[4, -52], [16, -52]]), INK, 1);
  });

  // ───────── Kesseldeckel mit Dampfpfeife (Signature) und Pfeifenband (Teamzone) ─────────
  F.part('lid', { bone: 'head', z: 30, zb: 30 }, (g) => {
    g.mat(ellipse(2, -72, 22, 4.6), TIN_D, 'metal', { hi: 0.7 });
    g.mat(rrect(-4, -78, 12, 5, 2), TIN, 'metal');
  });
  F.part('whistle', { bone: 'hat', z: 31, zb: 31, sig: !H }, (g) => {
    g.mat(path([[0, -78, 1], [4, -78, 1], [5, -96], [-1, -96]]), BRASS, 'gold', { hi: 0.9 });
    g.mat(rrect(-2, -100, 8, 5, 1.6), BRASS, 'gold', { hi: 0.9 });
    g.fill(rrect(4, -92, 2, 4, 0.6), '#5a3a1a');
  });
  F.part('whistleBand', { bone: 'hat', z: 31.5, zb: 31.5, team: true }, (g) => g.mat(rrect(-1.4, -88, 7.4, 4, 1), P.team, 'cloth', { line: P.teamDeep, lw: 0.4 }));
  F.part('steam', { bone: 'hat', z: 32, state: ['steam', 'muzzle', 'spawn'], glow: true }, (g) => {
    for (const [x, y, r] of [[8, -98, 3], [14, -104, 4], [22, -108, 4.6]]) g.fill(circle(x, y, r), '#f0f4f8', { op: 0.8 });
  });

  // ───────── Riesen-Rohrzange und vorderer Rohrarm ─────────
  F.part('wrench', { bone: 'prop', z: 38, zb: 4 }, (g) => {
    g.mat(path([[31, -26, 1], [37, -26, 1], [42, -84, 1], [36, -84, 1]]), GRIP, 'leather', { hi: 0.5 });
    if (H) g.lod(1, (h) => lines(h, [[[36, -60], [37, -70]], [[38, -60], [39, -70]], [[40, -60], [40.6, -70]]], '#8a4a1a', 0.5, 1));
    // gezahnte Backen
    g.mat(path([[34, -84, 1], [46, -86, 1], [52, -96, 1], [48, -100, 1], [40, -92], [34, -92, 1]]), JAW, 'metal', { hi: 0.8 });
    g.mat(path([[34, -94, 1], [42, -96], [46, -104, 1], [40, -108, 1], [32, -102, 1]]), JAW, 'metal', { hi: 0.8 });
    g.lod(1, (h) => {
      for (let i = 0; i < 4; i++) h.stroke(polyline([[40 + i * 2, -93 - i * 1.4], [41 + i * 2, -95 - i * 1.4]]), '#5a1a12', 0.6);
    });
    g.mat(rrect(33, -90, 8, 6, 1.4), '#8a8f99', 'metal');
  });
  F.part('armF', { bone: 'armF', z: 37, zb: 6 }, (g) => {
    g.mat(limb(26, -50, 33, -34, 3.4, 3.2), TIN_D, 'metal', { hi: 0.6 });
    g.mat(circle(30, -42, 4.2), BRASS, 'metal');
  });
  F.part('handF', { bone: 'handF', z: 41, zb: 7 }, (g) => g.mat(circle(34, -32, 5.2), TIN_D, 'metal', { hi: 0.6 }));
  emblem(F, 'emblem', 'torso', 22, 4, -32, 2.2, { zb: 22 });

  F.anim({
    // tippelt auf der Stelle, Dampfwölkchen; das Auge blinzelt mit der Klappe
    idle: H
      ? { p: { breathe: 0.03, bob: 1, sway: 2, tilt: 2 }, keys: { torso: { r: [[0, 0], [0.4, -8], [0.6, -8], [0.8, 0]] }, show: { steam: [[0.5, 0.7]] } } }
      : { p: { breathe: 0.03, bob: 1.4, sway: 3, tilt: 2 }, keys: { legF: { r: [[0, 0], [0.25, -10], [0.5, 0], [1, 0]] }, legB: { r: [[0, 0], [0.5, 0], [0.75, 10], [1, 0]] }, show: { steam: [[0.3, 0.5]] }, expr: [[0.85, 0.92, 'sleep']] } },
    // schneller Tippelgang, der Kessel wackelt
    walk: { prog: 'biped.run', p: { stride: 30, bob: 2.6, armSwing: 14, lean: 4 }, keys: { torso: { r: [[0, -4], [0.5, 4], [1, -4]] } } },
    // Zange über den Kopf, Schlag mit Pfiff und Dampfstrahl
    attack: { prog: 'atk.swing', hit: 0.55, p: { wind: -160, strike: -60, over: 12, cock: 0, snap: 170, lean: 10, lunge: 12 }, keys: { root: { sy: [[0, 1], [0.4, 1.08], [0.55, 0.88], [0.7, 1]] }, show: { muzzle: [[0.55, 0.75]] } }, ev: { strike: 0.55 } },
    // der Deckel springt kurz hoch
    hit: { p: { knock: 1.8, recoil: 4 }, keys: { head: { y: [[0, 0], [0.15, -5], [0.4, 0]] } } },
    // plumpst herunter, die Pfeife pfeift
    spawn: {},
    // Dampf entweicht, er kippt um, der Deckel rollt
    death: { p: { dir: -1, angle: 80 }, keys: { show: { steam: [[0, 0.6]] }, head: { x: [[0, 0], [0.4, 0], [1, -16]], y: [[0, 0], [0.4, 0], [1, 30]], r: [[0, 0], [0.4, 0], [1, -180]] } } },
    ...(H
      ? {
          // Pfannkuchen-Power: reißt den Deckel auf und schaufelt den Stapel hinein
          ability: { keys: { head: { r: [[0, 0], [0.2, -60], [0.8, -60], [1, 0]] }, armB: { r: [[0, 0], [0.3, -160], [0.5, -120], [0.7, -160], [1, 0]] }, show: { steam: [[0.6, 1]] }, expr: [[0, 1, 'attack']] }, ev: { ability: 0.6 } },
        }
      : {}),
  });
}
