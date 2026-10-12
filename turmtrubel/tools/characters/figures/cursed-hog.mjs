// Fluch-Schwein – verwirrtes, grantiges Ferkel in Fluchlila mit Mini-Hexenhut und kreisenden Fluchsternchen
// (Brief: docs/briefs/cursed-hog.md)
import {
  ellipse,
  circle,
  rrect,
  poly,
  path,
  limb,
  polyline,
  spline,
  blob,
  star,
} from "../geo.mjs";
import { eyeSpiral, eyeX, emblem, INK, WHITE } from "../kit.mjs";
import { piglet, PIGLET_PIVOTS } from "./royal-hogs.mjs";

export default function cursedHog(F) {
  const P = F.pal;
  const SKIN = P.main;
  const CURSE = P.acc;
  const HAT = "#3a2a4a";
  const DARK = "#a878bc";
  const LIVE = [
    "idle",
    "walk",
    "attack",
    "hit",
    "spawn",
    "stun",
    "sleep",
    "charge",
    "ability",
    "spawnUnit",
    "whole",
  ];

  F.rig(
    "quadruped",
    { ...PIGLET_PIVOTS, hat: [14, -40], stars: [16, -42] },
    { hat: "head", stars: "head" },
  );
  piglet(F, { skin: SKIN, dark: DARK, snout: "#e0a8c8", hoof: "#4a3a50" });
  emblem(F, "emblem", "body", 19, -6, -18, 1.8, { zb: 19 });

  // ───────── Spiralaugen, grantiger Mund ─────────
  F.part(
    "face.idle",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability", "hurt", "stun"],
    },
    (g) => {
      eyeSpiral(g, 20, -30, 2.4, "#4a2a5a", 0.6);
      eyeSpiral(g, 13.6, -30.2, 2.2, "#4a2a5a", 0.6);
      g.stroke(
        spline([
          [17.6, -19.4],
          [20.6, -20.6],
          [23.6, -19.4],
        ]),
        INK,
        0.9,
      );
      g.stroke(
        polyline([
          [17, -34.6],
          [21.4, -33.4],
        ]),
        "#6a4a7a",
        1,
      );
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => {
      eyeX(g, 20, -30, 1.6, INK, 0.9);
      eyeX(g, 13.6, -30.2, 1.4, INK, 0.8);
    },
  );

  // ───────── Mini-Hexenhut mit Knick (Signature) und Hutband (Teamzone) ─────────
  F.part("hat", { bone: "hat", z: 34, zb: 34, sig: true }, (g) => {
    // hoher, geknickter Hexenhut mit breiter Krempe: die Silhouette ragt weit über die Ohren
    g.mat(ellipse(13, -38, 14, 3, -6), HAT, "cloth", { hi: 0.4 });
    g.mat(
      path([
        [6, -39],
        [9, -52],
        [11, -64],
        [24, -72, 1],
        [17, -61],
        [16, -50],
        [19, -39],
      ]),
      HAT,
      "cloth",
      { hi: 0.5 },
    );
  });
  F.part("hatBand", { bone: "hat", z: 34.5, zb: 34.5, team: true }, (g) => {
    // breites Hutband mit flatterndem Bandende
    g.mat(
      path([
        [-1, -47],
        [7, -45.4],
        [6.4, -42],
        [1.6, -42.6],
        [-3, -39.4],
      ]),
      P.teamShade,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
    g.mat(
      path([
        [6.8, -45.6],
        [18.6, -46.4],
        [19, -40.4],
        [6.2, -40],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
  });
  F.part("buckle", { bone: "hat", z: 34.8, zb: 34.8, lod: 1 }, (g) =>
    g.mat(rrect(11.4, -44.6, 3.4, 3.4, 0.5), "#d8c060", "gold", { hi: 0.8 }),
  );

  // ───────── Kreisende Fluchsternchen ─────────
  F.part("stars", { bone: "stars", z: 35, zb: 35, glow: true }, (g) => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      g.fill(
        star(16 + Math.cos(a) * 11, -42 + Math.sin(a) * 3, 2.4, 1, 5),
        CURSE,
      );
    }
  });

  // ───────── Fluchrauch (Verwandlung, Verpuffen) ─────────
  F.part(
    "smoke",
    { bone: "root", z: 50, zb: 50, state: ["smoke"], outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-8, -20, 9],
        [8, -28, 10],
        [20, -18, 8],
        [0, -38, 7],
      ])
        g.fill(circle(x, y, r), "#8a5aa8", { op: 0.65 });
      for (const [x, y] of [
        [-14, -36],
        [24, -36],
        [6, -46],
      ])
        g.fill(star(x, y, 2.4, 1, 5), CURSE, { op: 0.9 });
    },
  );

  F.anim({
    // grunzt, Sternchen kreisen
    idle: {
      prog: "quad.idle",
      p: { nod: 3 },
      keys: {
        stars: {
          sx: [
            [0, 1],
            [0.25, -1],
            [0.5, 1],
            [0.75, -1],
            [1, 1],
          ],
        },
        jaw: {
          r: [
            [0, 0],
            [0.5, 0],
            [0.6, 6],
            [0.7, 0],
          ],
        },
      },
    },
    // trippeln
    walk: {
      prog: "quad.walk",
      p: { stride: 28, bob: 2.4, rock: 6, nod: 6, gallop: false },
      keys: {
        stars: {
          sx: [
            [0, 1],
            [0.5, -1],
            [1, 1],
          ],
        },
      },
      ev: { step: [0.25, 0.75] },
    },
    // Flusssprung (JUMP): den Hut hält es mit den Ohren fest
    charge: {
      prog: "quad.jump",
      p: { reach: 40, lift: 6 },
      keys: {
        ear: {
          r: [
            [0, -30],
            [1, -30],
          ],
        },
        hat: {
          r: [
            [0, -8],
            [1, -8],
          ],
        },
      },
    },
    // Rammstoß, der Hut kippt nach hinten
    attack: {
      prog: "quad.idle",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        head: {
          r: [
            [0, 0],
            [0.45, 12, "out"],
            [0.55, -18, "in"],
            [0.8, 0],
          ],
        },
        hat: {
          r: [
            [0, 0],
            [0.5, 0],
            [0.6, -30],
            [0.9, 0],
          ],
        },
        root: {
          x: [
            [0, 0],
            [0.45, -4],
            [0.55, 7],
            [1, 0],
          ],
        },
      },
      ev: { strike: 0.55 },
    },
    // Hut fliegt hoch
    hit: {
      prog: "quad.hit",
      keys: {
        hat: {
          y: [
            [0, 0],
            [0.2, -8],
            [0.6, 0],
          ],
          r: [
            [0, 0],
            [0.2, -20],
            [0.6, 0],
          ],
        },
      },
    },
    // verwandelt sich aus Fluchrauch
    spawn: {
      prog: "quad.idle",
      keys: {
        show: { smoke: [[0, 0.6]] },
        alpha: [
          [0, 0],
          [0.4, 1],
        ],
      },
    },
    // verpufft in Fluchrauch
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { smoke: [[0.1, 0.8]] },
        body: {
          sx: [
            [0, 1],
            [0.3, 0.6],
          ],
          sy: [
            [0, 1],
            [0.3, 0.6],
          ],
        },
        alpha: [
          [0, 1],
          [0.3, 1],
          [0.5, 0],
        ],
      },
    },
  });
}
