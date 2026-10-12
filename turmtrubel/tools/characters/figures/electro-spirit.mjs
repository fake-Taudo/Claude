// Elektrogeist – aufgekratzter Funke mit zwei Messing-Steckerzinken als Ohren und Zickzack-Schwanz; sein Blitz springt weiter
// (Brief: docs/briefs/electro-spirit.md)
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
import { eyeX, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function electroSpirit(F) {
  const P = F.pal;
  const SPARK = P.main;
  const VIOLET = P.acc;
  const PLUG = "#c8ccd2";
  const BRASS = "#d8b04a";
  const SPARK_D = "#e0b020";
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
    body: [0, -18],
    head: [0, -26],
    hat: [0, -30],
    armB: [-8, -20],
    handB: [-12, -16],
    armF: [8, -20],
    handF: [13, -16],
    prop: [13, -16],
    trail: [0, -10],
  });

  const zig = (pts) => polyline(pts);

  // ───────── Zickzack-Schwanz mit Schwanzband (Teamzone) ─────────
  F.part("tail", { bone: "trail", z: 4, zb: 40, state: LIVE }, (g) => {
    g.mat(
      path([
        [-5, -12],
        [5, -12],
        [2, -8],
        [5, -5],
        [0, -1, 1],
        [1, -5],
        [-3, -7],
        [-1, -10],
      ]),
      SPARK,
      "flat",
      { hi: 0.3 },
    );
  });
  F.part(
    "tailBand",
    { bone: "trail", z: 4.5, zb: 40.5, team: true, state: LIVE },
    (g) => {
      // Schwanzband mit Schleife
      g.mat(rrect(-5.6, -12.6, 11.2, 3.8, 1.2), P.team, "cloth", {
        line: P.teamDeep,
        lw: 0.4,
      });
      g.mat(
        path([
          [4.6, -11.4],
          [11, -16, 1],
          [11.4, -8.6, 1],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(
        path([
          [4.4, -10.4],
          [8.6, -4.6],
          [5.6, -4],
          [3.4, -9.4],
        ]),
        P.teamShade,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
    },
  );
  F.part("armB", { bone: "armB", z: 8, zb: 36, state: LIVE }, (g) =>
    g.stroke(
      zig([
        [-8, -20],
        [-10, -17],
        [-9, -16],
        [-12, -14],
      ]),
      SPARK_D,
      1.6,
    ),
  );

  // ───────── Funkenkörper (Tropfen), Steckerzinken-Ohren (Signature) ─────────
  F.part(
    "prongs",
    { bone: "hat", z: 17, zb: 17, sig: true, state: LIVE },
    (g) => {
      for (const x of [-5, 5]) {
        g.mat(rrect(x - 1.6, -40, 3.2, 12, 0.6), BRASS, "gold", { hi: 0.9 });
        g.fill(circle(x, -37, 0.8), "#5a4a20", { lod: 1 });
      }
      g.mat(rrect(-8, -30, 16, 3, 1), PLUG, "metal", { hi: 0.8 });
    },
  );
  // isolierende Steckerkappe (zweite Teamzone)
  F.part(
    "plugCap",
    { bone: "hat", z: 18.4, zb: 18.4, team: true, state: LIVE },
    (g) =>
      g.mat(rrect(-9, -31.4, 18, 5, 1.6), P.team, "cloth", {
        line: P.teamDeep,
        lw: 0.4,
        hi: 0.5,
      }),
  );
  F.part("body", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob(
      [
        [0, -32],
        [9, -27],
        [11, -19],
        [7, -12],
        [0, -10],
        [-7, -12],
        [-11, -19],
        [-9, -27],
      ],
      0.85,
    );
    g.mat(b, SPARK, "flat", { line: SPARK_D, lw: 0.6 });
    g.clipTo(b, (h) => {
      h.fill(ellipse(-3, -26, 5, 3.4, -20), "#fffbe0", { op: 0.8 });
      h.lod(1, (k) => {
        k.stroke(
          zig([
            [-9, -16],
            [-6, -18],
            [-4, -15],
            [-1, -17],
          ]),
          VIOLET,
          0.7,
        );
        k.stroke(
          zig([
            [4, -12],
            [6, -14],
            [8, -12],
          ]),
          VIOLET,
          0.6,
        );
      });
    });
  });
  F.part(
    "aura",
    { bone: "body", z: 18.5, zb: 18.5, glow: true, state: LIVE },
    (g) => g.fill(circle(0, -21, 14), SPARK, { op: 0.18 }),
  );
  emblem(F, "emblem", "hat", 18.6, 0, -28.9, 2.2, { zb: 18.6, state: LIVE });
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
      for (const x of [1.6, 7])
        g.stroke(
          zig([
            [x - 2, -23],
            [x - 0.6, -25],
            [x + 0.6, -22.6],
            [x + 2, -24.6],
          ]),
          "#3a2a6a",
          1.1,
        );
      const m = path([
        [-1, -18.6, 1],
        [10, -19, 1],
        [8, -15],
        [1, -15],
      ]);
      g.fill(m, "#3a2a6a", { stroke: INK, lw: 0.5 });
      g.clipTo(m, (h) =>
        h.stroke(
          zig([
            [0, -17.4],
            [2, -18.4],
            [4, -16.6],
            [6, -18.4],
            [8, -16.8],
          ]),
          "#fff0a0",
          0.7,
        ),
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "body", z: 20, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      for (const x of [1.6, 7])
        g.stroke(
          polyline([
            [x - 1.6, -24],
            [x + 1.6, -23.4],
          ]),
          "#3a2a6a",
          1,
        );
      g.fill(ellipse(4.4, -16.6, 1.6, 1.4), "#3a2a6a");
    },
  );
  F.part(
    "face.death",
    { bone: "body", z: 20, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 1.6, -23.6, 1.4, "#3a2a6a", 0.8);
      eyeX(g, 7, -23.6, 1.4, "#3a2a6a", 0.8);
    },
  );
  F.part("armF", { bone: "armF", z: 28, zb: 6, state: LIVE }, (g) =>
    g.stroke(
      zig([
        [8, -20],
        [10, -17],
        [9.4, -16],
        [13, -14],
      ]),
      SPARK_D,
      1.8,
    ),
  );
  F.part(
    "sparks",
    {
      bone: "root",
      z: 50,
      zb: 50,
      state: ["idle", "walk", "flicker"],
      glow: true,
      lod: 1,
    },
    (g) => {
      for (const [x, y] of [
        [-12, -34],
        [12, -32],
        [-14, -12],
      ])
        g.fill(star(x, y, 2, 0.6, 4), SPARK);
      g.fill(star(0, -42, 1.6, 0.5, 4), VIOLET);
    },
  );

  // ───────── Kettenblitz, Zünden, Blitzfäden ─────────
  F.part(
    "zap",
    { bone: "root", z: 52, zb: 52, state: ["muzzle", "zap"], glow: true },
    (g) => {
      g.fill(circle(0, -20, 16), SPARK, { op: 0.5 });
      for (const pts of [
        [
          [0, -20],
          [10, -30],
          [8, -34],
          [20, -42],
        ],
        [
          [0, -20],
          [-10, -26],
          [-8, -30],
          [-22, -36],
        ],
        [
          [0, -20],
          [12, -12],
          [10, -8],
          [24, -4],
        ],
      ])
        g.stroke(zig(pts), "#ffffff", 1.4);
    },
  );
  F.part(
    "threads",
    { bone: "root", z: 52, zb: 52, state: "threads", glow: true },
    (g) => {
      for (const pts of [
        [
          [-2, -22],
          [-10, -30],
          [-6, -34],
          [-16, -44],
        ],
        [
          [2, -22],
          [10, -26],
          [8, -32],
          [18, -38],
        ],
        [
          [0, -16],
          [-8, -10],
          [-4, -6],
          [-14, -2],
        ],
        [
          [2, -16],
          [10, -10],
          [14, -2],
        ],
      ])
        g.stroke(zig(pts), SPARK, 1.2);
    },
  );

  F.anim({
    // zappelt, Funken
    idle: {
      prog: "hover.idle",
      p: { float: 1.6, sway: 6 },
      keys: {
        body: {
          x: [
            [0, 0],
            [0.1, 1],
            [0.2, -1],
            [0.3, 0],
            [0.6, 0],
            [0.7, 1],
            [0.8, -1],
            [0.9, 0],
          ],
        },
        hat: {
          r: [
            [0, 0],
            [0.15, 8],
            [0.3, -6],
            [0.45, 0],
          ],
        },
      },
    },
    // zuckt vorwärts
    walk: {
      prog: "still",
      keys: {
        root: {
          x: [
            [0, -2],
            [0.2, -2],
            [0.25, 2],
            [0.7, 2],
            [0.75, -2],
            [1, -2],
          ],
          y: [
            [0, 0],
            [0.25, -5],
            [0.5, 0],
            [0.75, -5],
            [1, 0],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.25, 10],
            [0.5, 0],
            [0.75, 10],
            [1, 0],
          ],
        },
      },
    },
    // Sprung, Blitz springt weiter
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
        show: { muzzle: [[0.55, 1.01]] },
      },
      ev: { strike: 0.55 },
    },
    // flackert
    hit: {
      prog: "generic.hit",
      keys: {
        alpha: [
          [0, 1],
          [0.1, 0.4],
          [0.2, 1],
          [0.3, 0.5],
          [0.4, 1],
        ],
      },
    },
    // zündet mit Funken
    spawn: { prog: "generic.spawn", keys: { show: { zap: [[0, 0.35]] } } },
    // zerplatzt in Blitzfäden
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.15]], threads: [[0.1, 0.7]] },
        alpha: [
          [0, 1],
          [0.5, 1],
          [0.8, 0],
        ],
      },
    },
  });
}
