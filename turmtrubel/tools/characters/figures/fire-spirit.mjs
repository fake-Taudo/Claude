// Feuergeist – übermütiges Kerzenwesen aus Wachs mit einer Flammenfrisur, die höher ist als der Körper; springt und explodiert
// (Brief: docs/briefs/fire-spirit.md)
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
import {
  eye,
  eyeClosed,
  eyeX,
  mouthOpen,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export default function fireSpirit(F) {
  const P = F.pal;
  const FLAME = P.main;
  const CORE = P.acc;
  const WAX = "#f8e6c8";
  const WAX_D = "#e0c8a0";
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

  F.rig("hover", {
    body: [0, -12],
    head: [0, -20],
    hat: [0, -25],
    armB: [-7, -16],
    handB: [-11, -12],
    armF: [7, -16],
    handF: [12, -12],
    prop: [12, -12],
    trail: [0, -4],
  });

  // ───────── Wachsärmchen hinten ─────────
  F.part("armB", { bone: "armB", z: 8, zb: 36, state: LIVE }, (g) =>
    g.mat(limb(-7, -16, -11, -12, 1.8, 1.6), WAX_D, "skin", {
      line: "#c8a878",
      lw: 0.5,
    }),
  );

  // ───────── Kerzenkörper mit herablaufenden Tropfen (Signature) ─────────
  F.part(
    "candle",
    { bone: "body", z: 18, zb: 18, sig: true, state: LIVE },
    (g) => {
      const c = path([
        [-8, -24],
        [-4, -26],
        [4, -26],
        [8, -24],
        [8.4, -6, 1],
        [-8.4, -6, 1],
      ]);
      g.mat(c, WAX, "skin", { hi: 0.5, line: "#c8a878", lw: 0.6 });
      g.clipTo(c, (h) =>
        h.mat(rrect(2, -26, 7, 20, 0), WAX_D, "skin", { line: false }),
      );
      for (const [x, y0, y1] of [
        [-6, -24, -16],
        [-1, -25, -19],
        [6, -24, -12],
      ]) {
        g.mat(
          path([
            [x - 1.4, y0],
            [x + 1.4, y0],
            [x + 1.4, y1],
            [x, y1 + 2, 1],
            [x - 1.4, y1],
          ]),
          "#fff4e0",
          "skin",
          { hi: 0.6, line: false },
        );
      }
    },
  );
  // Wachsmanschette (Teamzone)
  F.part(
    "collar",
    { bone: "body", z: 19, zb: 19, team: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [-12, -8],
          [12, -8],
          [10, -4, 1],
          [-10, -4, 1],
        ]),
        P.team,
        "skin",
        { line: P.teamDeep, lw: 0.5, hi: 0.5 },
      );
      g.mat(rrect(-12.4, -9.4, 24.8, 2, 1), P.teamShade, "skin", {
        line: P.teamDeep,
        lw: 0.4,
      });
    },
  );
  emblem(F, "emblem", "body", 19.5, -4, -6, 1.2, { zb: 19.5, state: LIVE });
  F.part(
    "face.idle",
    {
      bone: "body",
      z: 20,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      eye(g, 5, -19, {
        r: 2,
        iris: "#5a2a0a",
        lid: 0.25,
        lidColor: WAX,
        look: [0.7, 0],
      });
      eye(g, -0.6, -19.2, {
        r: 1.8,
        iris: "#5a2a0a",
        lid: 0.25,
        lidColor: WAX,
        look: [0.7, 0],
      });
      mouthOpen(g, 3, -13.6, 6, 3.4, { teeth: "top", tongue: true, lw: 0.6 });
    },
  );
  F.part(
    "face.hurt",
    { bone: "body", z: 20, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 5, -19, 1.8, { up: true, lw: 0.8 });
      eyeClosed(g, -0.6, -19.2, 1.6, { up: true, lw: 0.7 });
      g.fill(ellipse(3, -13.6, 1.6, 1.4), "#4a1c24", { stroke: INK, lw: 0.5 });
    },
  );
  F.part(
    "face.death",
    { bone: "body", z: 20, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 5, -19, 1.4, INK, 0.8);
      eyeX(g, -0.6, -19.2, 1.2, INK, 0.7);
    },
  );

  // ───────── Flammenfrisur (höher als der Körper) ─────────
  const flame = (g, s, col) =>
    g.fill(
      path([
        [-7 * s, -25],
        [-9 * s, -34],
        [-5 * s, -38],
        [-6 * s, -46],
        [-1 * s, -42],
        [0, -54 * (0.6 + s * 0.4), 1],
        [3 * s, -42],
        [7 * s, -48],
        [7 * s, -38],
        [9 * s, -33],
        [7 * s, -25],
      ]),
      col,
    );
  F.part("flame", { bone: "hat", z: 30, zb: 30, state: LIVE }, (g) => {
    flame(g, 1, FLAME);
    g.lod(1, (h) =>
      h.stroke(
        path([
          [-7, -25],
          [-9, -34],
          [-5, -38],
          [-6, -46],
          [-1, -42],
          [0, -54, 1],
          [3, -42],
          [7, -48],
          [7, -38],
          [9, -33],
          [7, -25],
        ]),
        "#c84a0a",
        0.8,
      ),
    );
  });
  F.part(
    "flameCore",
    { bone: "hat", z: 30.5, zb: 30.5, glow: true, state: LIVE },
    (g) => {
      flame(g, 0.6, CORE);
      g.fill(ellipse(0, -30, 3, 4), "#fff4d0");
    },
  );
  F.part("wick", { bone: "hat", z: 29, zb: 29, state: LIVE }, (g) =>
    g.stroke(
      polyline([
        [0, -26],
        [0.6, -29],
      ]),
      "#3a2a20",
      1,
    ),
  );

  // ───────── Wachsärmchen vorn ─────────
  F.part("armF", { bone: "armF", z: 28, zb: 6, state: LIVE }, (g) =>
    g.mat(limb(7, -16, 11, -12, 1.8, 1.6), WAX, "skin", {
      hi: 0.4,
      line: "#c8a878",
      lw: 0.5,
    }),
  );
  F.part("handF", { bone: "handF", z: 28.5, zb: 6.5, state: LIVE }, (g) =>
    g.mat(circle(12, -11.6, 2), WAX, "skin", {
      hi: 0.5,
      line: "#c8a878",
      lw: 0.5,
    }),
  );
  F.part("drip", { bone: "trail", z: 17, zb: 17, state: LIVE, lod: 1 }, (g) =>
    g.mat(
      path([
        [6, -4],
        [7.4, 0, 1],
        [5.4, -1],
      ]),
      WAX,
      "skin",
      { hi: 0.6, line: false },
    ),
  );

  // ───────── Explosion mit Wachsspritzern, Entzünden ─────────
  F.part(
    "boom",
    { bone: "root", z: 52, zb: 52, state: ["boom", "muzzle"], glow: true },
    (g) => {
      g.fill(star(0, -20, 30, 16, 9, -90, 5), FLAME, { op: 0.85 });
      g.fill(circle(0, -20, 12), "#fff0b0", { op: 0.9 });
    },
  );
  F.part(
    "splatter",
    { bone: "root", z: 16, zb: 16, state: "splatter" },
    (g) => {
      for (const [x, y, r] of [
        [-14, -2, 3],
        [-4, -1, 2.4],
        [8, -2, 3.4],
        [18, -1, 2],
        [-20, -1, 1.6],
      ])
        g.mat(ellipse(x, y, r * 1.4, r * 0.6), WAX, "skin", { hi: 0.5 });
    },
  );
  F.part("ignite", { bone: "hat", z: 31, state: "ignite", glow: true }, (g) =>
    g.fill(star(0, -30, 10, 3, 8), "#fff0b0"),
  );

  F.anim({
    // tropft, die Flamme züngelt
    idle: {
      prog: "hover.idle",
      p: { float: 2, sway: 3, hat: 6 },
      keys: {
        hat: {
          sx: [
            [0, 1],
            [0.25, 0.92],
            [0.5, 1.06],
            [0.75, 0.94],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.25, 1.1],
            [0.5, 0.94],
            [0.75, 1.08],
            [1, 1],
          ],
        },
      },
    },
    // hüpft
    walk: {
      prog: "still",
      keys: {
        root: {
          y: [
            [0, 0],
            [0.25, -8, "out"],
            [0.5, 0, "in"],
            [0.75, -8, "out"],
            [1, 0, "in"],
          ],
        },
        body: {
          sy: [
            [0, 0.9],
            [0.1, 1.08],
            [0.4, 1],
            [0.5, 0.9],
            [0.6, 1.08],
            [0.9, 1],
            [1, 0.9],
          ],
        },
        hat: {
          r: [
            [0, 0],
            [0.25, -12],
            [0.5, 0],
            [0.75, -12],
            [1, 0],
          ],
        },
      },
    },
    // Hechtsprung und Explosion
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        root: {
          x: [
            [0, 0],
            [0.3, -3],
            [0.55, 14, "out"],
          ],
          y: [
            [0, 0],
            [0.3, 2],
            [0.45, -14],
            [0.55, -6],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.55, 30],
          ],
        },
        show: { muzzle: [[0.55, 1.01]] },
      },
      ev: { strike: 0.55 },
    },
    // Flamme flackert
    hit: {
      prog: "generic.hit",
      keys: {
        hat: {
          sx: [
            [0, 1],
            [0.2, 0.6],
            [0.5, 1.2],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.2, 0.5],
            [0.5, 1.1],
            [1, 1],
          ],
        },
      },
    },
    // entzündet sich
    spawn: {
      prog: "still",
      keys: {
        hat: {
          sx: [
            [0, 0],
            [0.5, 1.2, "out"],
            [0.7, 1],
          ],
          sy: [
            [0, 0],
            [0.5, 1.3, "out"],
            [0.7, 1],
          ],
        },
        show: { ignite: [[0.3, 0.6]] },
      },
    },
    // Explosion mit Wachsspritzern
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: {
          whole: [[0, 0.15]],
          boom: [[0.05, 0.5]],
          splatter: [[0.15, 1.01]],
        },
        alpha: [
          [0, 1],
          [0.7, 1],
          [1, 0],
        ],
      },
    },
  });
}
