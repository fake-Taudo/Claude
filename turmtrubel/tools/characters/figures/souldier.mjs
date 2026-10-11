// Seelensoldat – eifriger, durchscheinender Geisterpikenier mit Wimpelfetzen an der Pike; erscheint mit dem Evo-Königsgeist
// (Brief: docs/briefs/souldier.md)
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
} from "../geo.mjs";
import { eyeClosed, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function souldier(F) {
  const P = F.pal;
  const MIST = P.main;
  const PALE = P.acc;
  const MIST_D = "#4aa898";
  const MIST_L = "#c8f4ec";
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
    body: [0, -30],
    head: [2, -44],
    hat: [2, -56],
    armB: [-8, -38],
    handB: [-12, -30],
    armF: [8, -38],
    handF: [14, -32],
    prop: [14, -32],
    trail: [0, -18],
  });

  // ───────── Geisterschweif und Körper mit Nebelschlieren ─────────
  F.part("tail", { bone: "trail", z: 4, zb: 40, state: LIVE }, (g) => {
    g.mat(
      path([
        [-10, -26],
        [-8, -16],
        [-12, -8],
        [-6, -10],
        [-4, -2, 1],
        [0, -8],
        [4, -4, 1],
        [5, -12],
        [10, -18],
        [10, -26],
      ]),
      MIST_D,
      "glass",
      { hi: 0.4, line: false },
    );
  });
  F.part("armB", { bone: "armB", z: 8, zb: 36, state: LIVE }, (g) => {
    g.mat(limb(-8, -38, -12, -31, 2.4, 2), MIST_D, "glass", { line: false });
    g.mat(circle(-12.4, -30, 2.4), MIST_D, "glass", { line: false });
  });
  F.part("body", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob(
      [
        [-11, -22],
        [-12, -34],
        [-6, -44],
        [8, -44],
        [13, -34],
        [11, -22],
        [0, -18],
      ],
      0.8,
    );
    g.mat(b, MIST, "glass", { hi: 0.7 });
    g.clipTo(b, (h) => {
      h.fill(ellipse(-4, -38, 5, 3, -20), MIST_L, { op: 0.8 });
      h.lod(1, (k) =>
        lines(
          k,
          [
            [
              [-8, -28],
              [-2, -26],
              [4, -29],
            ],
            [
              [0, -22],
              [6, -21],
              [10, -24],
            ],
          ],
          MIST_L,
          0.7,
          1,
        ),
      );
    });
  });
  emblem(F, "emblem", "body", 19, -6, -28, 1.6, { zb: 19, state: LIVE });

  // ───────── Geisterhelm, runde Lichtaugen, O-Mund ─────────
  F.part("head", { bone: "head", z: 30, zb: 30, state: LIVE }, (g) =>
    g.mat(circle(4, -50, 9), MIST, "glass", { hi: 0.7 }),
  );
  F.part(
    "face.idle",
    {
      bone: "head",
      z: 31,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      for (const [x, r] of [
        [9, 2],
        [3.4, 1.8],
      ])
        g.fill(circle(x, -50, r), "#ffffff", { stroke: MIST_D, lw: 0.5 });
      g.fill(ellipse(7, -45, 1.4, 1.8), "#2a5a52");
    },
  );
  F.part(
    "face.hurt",
    {
      bone: "head",
      z: 31,
      view: "front",
      state: LIVE,
      expr: ["hurt", "stun", "death"],
    },
    (g) => {
      eyeClosed(g, 9, -50, 1.8, { up: true, lw: 0.8, color: "#2a5a52" });
      eyeClosed(g, 3.4, -50, 1.6, { up: true, lw: 0.7, color: "#2a5a52" });
      g.fill(ellipse(7, -45, 1, 1.2), "#2a5a52");
    },
  );
  F.part("helmet", { bone: "hat", z: 32, zb: 32, state: LIVE }, (g) => {
    g.mat(
      path([
        [-6, -52],
        [-4, -60],
        [4, -63],
        [12, -60],
        [14, -53],
        [10, -55],
        [-2, -55],
      ]),
      PALE,
      "metal",
      { hi: 0.7 },
    );
    g.mat(
      path([
        [3, -62],
        [4, -68, 1],
        [5.4, -62],
      ]),
      PALE,
      "metal",
      { hi: 0.6 },
    );
  });

  // ───────── Geisterpike (doppelt so lang wie der Geist) mit Wimpelfetzen (Signature, Teamzone) ─────────
  F.part(
    "pike",
    { bone: "prop", z: 27, zb: 4, sig: true, state: LIVE },
    (g) => {
      g.mat(limb(4, -24, 60, -76, 1.1, 1), PALE, "wood", { hi: 0.5 });
      g.mat(
        path([
          [58, -74],
          [70, -86, 1],
          [62, -72],
        ]),
        MIST_L,
        "metal",
        { hi: 0.9 },
      );
    },
  );
  F.part(
    "pennant",
    { bone: "prop", z: 27.5, zb: 4.5, team: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [54, -70],
          [58, -66],
          [52, -56, 1],
          [50, -60],
          [46, -54, 1],
          [46, -60],
          [42, -58, 1],
          [48, -66],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
    },
  );
  F.part("armF", { bone: "armF", z: 28, zb: 6, state: LIVE }, (g) =>
    g.mat(limb(8, -38, 13, -33, 2.4, 2), MIST, "glass", {
      hi: 0.5,
      line: false,
    }),
  );
  F.part("handF", { bone: "handF", z: 41, zb: 7, state: LIVE }, (g) =>
    g.mat(circle(14, -32, 2.6), MIST, "glass", { hi: 0.6 }),
  );

  // ───────── Aufsteigen aus dem Boden, Verwehen ─────────
  F.part(
    "rise",
    { bone: "root", z: 50, zb: 50, state: "rise", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-12, -2, 6],
        [0, -1, 7],
        [12, -2, 6],
      ])
        g.fill(circle(x, y, r), MIST_L, { op: 0.7 });
    },
  );
  F.part(
    "wisps",
    { bone: "root", z: 50, zb: 50, state: "wisps", outline: false },
    (g) => {
      for (const pts of [
        [
          [-6, -40],
          [-14, -50],
          [-10, -60],
        ],
        [
          [4, -36],
          [10, -50],
          [6, -62],
        ],
        [
          [0, -24],
          [-8, -30],
          [-16, -32],
        ],
      ])
        g.stroke(spline(pts), MIST_L, 1.6, { op: 0.7 });
    },
  );

  F.anim({
    // schwebt im Kreis
    idle: {
      prog: "hover.idle",
      p: { float: 2.4, sway: 4, trail: 14 },
      keys: {
        root: {
          x: [
            [0, 0],
            [0.25, 3],
            [0.5, 0],
            [0.75, -3],
            [1, 0],
          ],
        },
      },
    },
    // schwebt
    walk: {
      prog: "hover.idle",
      p: { float: 2, sway: 6, trail: 18 },
      keys: {
        body: {
          r: [
            [0, 8],
            [1, 8],
          ],
        },
      },
    },
    // Pikenstoß
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        prop: {
          x: [
            [0, 0],
            [0.4, -8, "out"],
            [0.55, 10, "in"],
            [0.75, 8],
            [1, 0],
          ],
          y: [
            [0, 0],
            [0.4, 6],
            [0.55, -6],
            [1, 0],
          ],
        },
        armF: {
          r: [
            [0, 0],
            [0.4, 20],
            [0.55, -30],
            [1, 0],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.4, -8],
            [0.55, 10],
            [1, 0],
          ],
        },
      },
      ev: { strike: 0.55 },
    },
    // verwischt
    hit: {
      prog: "generic.hit",
      keys: {
        root: {
          x: [
            [0, 0],
            [0.1, -3],
            [0.2, 3],
            [0.3, -2],
            [0.4, 0],
          ],
        },
        alpha: [
          [0, 1],
          [0.15, 0.5],
          [0.5, 1],
        ],
      },
    },
    // steigt mit Landeschaden aus dem Boden
    spawn: {
      prog: "still",
      keys: {
        root: {
          y: [
            [0, 14],
            [0.5, -4, "out"],
            [0.7, 0],
          ],
        },
        alpha: [
          [0, 0],
          [0.35, 1],
        ],
        show: { rise: [[0, 0.6]] },
      },
    },
    // verweht
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.3]], wisps: [[0.2, 1.01]] },
        root: {
          y: [
            [0, 0],
            [0.5, -10],
          ],
        },
        alpha: [
          [0, 1],
          [0.4, 0.8],
          [1, 0],
        ],
      },
    },
  });
}
