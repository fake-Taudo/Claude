// Heilungsgeist – sanftes, kicherndes Pusteblumen-Wesen mit einem Kopf aus Samenschirmchen auf einem Stängelkörper
// (Brief: docs/briefs/heal-spirit.md)
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
  eyeClosed,
  eyeX,
  mouthOpen,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export default function healSpirit(F) {
  const P = F.pal;
  const FLUFF = P.main;
  const CHEEK = P.acc;
  const STEM = "#7ab040";
  const SEED = "#f8fbe8";
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
    head: [0, -28],
    hat: [0, -40],
    armB: [-3, -16],
    handB: [-8, -14],
    armF: [3, -16],
    handF: [9, -14],
    prop: [9, -14],
    trail: [0, -4],
  });

  // Samenschirmchen: Stiel vom Zentrum nach außen, Schirm aus feinen Strahlen
  const umbrella = (g, cx, cy, a, len, col = SEED) => {
    const r = (a * Math.PI) / 180;
    const ex = cx + Math.cos(r) * len;
    const ey = cy + Math.sin(r) * len;
    g.stroke(
      polyline([
        [cx, cy],
        [ex, ey],
      ]),
      "#d8dcc0",
      0.4,
    );
    for (let i = -2; i <= 2; i++) {
      const b = r + i * 0.35;
      g.stroke(
        polyline([
          [ex, ey],
          [ex + Math.cos(b) * 2.4, ey + Math.sin(b) * 2.4],
        ]),
        col,
        0.45,
      );
    }
  };

  // ───────── Stängelkörper mit Blattärmchen ─────────
  F.part("armB", { bone: "armB", z: 8, zb: 36, state: LIVE }, (g) =>
    g.mat(
      path([
        [-2, -16],
        [-8, -18],
        [-10, -14, 1],
        [-5, -14],
      ]),
      "#5a9030",
      "cloth",
      { hi: 0.3 },
    ),
  );
  F.part("stem", { bone: "body", z: 16, zb: 16, state: LIVE }, (g) => {
    g.mat(
      path([
        [-3, -22],
        [3, -22],
        [4, -8],
        [6, -3, 1],
        [-6, -3, 1],
        [-4, -8],
      ]),
      STEM,
      "cloth",
      { hi: 0.4 },
    );
    g.lod(1, (h) =>
      lines(
        h,
        [
          [
            [0, -20],
            [0.6, -6],
          ],
        ],
        "#5a9030",
        0.6,
        1,
      ),
    );
  });
  // Blattschleife (Teamzone) am Stängel
  F.part(
    "bow",
    { bone: "body", z: 17, zb: 17, team: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [0, -14],
          [-7, -18, 1],
          [-6, -11, 1],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(
        path([
          [0, -14],
          [7, -18, 1],
          [6, -11, 1],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(circle(0, -14, 1.4), P.teamShade, "cloth", {
        line: P.teamDeep,
        lw: 0.3,
      });
    },
  );
  emblem(F, "emblem", "body", 17.5, 0, -7, 1.2, { zb: 17.5, state: LIVE });

  // ───────── Pusteblumen-Kopf (Signature) ─────────
  F.part(
    "puff",
    { bone: "head", z: 30, zb: 30, sig: true, state: LIVE },
    (g) => {
      g.mat(circle(0, -32, 13), FLUFF, "fur", { hi: 0.5 });
      g.mat(circle(0, -32, 10.6), SEED, "fur", { hi: 0.4 });
      g.lod(1, (h) => {
        for (let i = 0; i < 16; i++) umbrella(h, 0, -32, i * 22.5, 11.6);
      });
    },
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
      eyeClosed(g, 4.6, -33, 1.8, { up: true, lw: 0.9, color: "#4a6a20" });
      eyeClosed(g, -1.6, -33, 1.6, { up: true, lw: 0.8, color: "#4a6a20" });
      for (const x of [7, -3.6])
        g.fill(ellipse(x, -29.4, 1.8, 1.1), CHEEK, { op: 0.8 });
      g.stroke(
        spline([
          [0.4, -28.4],
          [2, -27],
          [3.6, -28.4],
        ]),
        "#4a6a20",
        0.8,
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      for (const x of [4.6, -1.6]) g.fill(circle(x, -33, 1), "#4a6a20");
      g.fill(ellipse(2, -28, 1.2, 1.2), "#4a6a20");
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 4.6, -33, 1.2, "#4a6a20", 0.7);
      eyeX(g, -1.6, -33, 1.1, "#4a6a20", 0.6);
    },
  );
  F.part("armF", { bone: "armF", z: 28, zb: 6, state: LIVE }, (g) =>
    g.mat(
      path([
        [2, -16],
        [8, -18],
        [10, -14, 1],
        [5, -14],
      ]),
      STEM,
      "cloth",
      { hi: 0.3 },
    ),
  );

  // ───────── Fortfliegende Samen, Heilwolke, Erblühen ─────────
  const seeds = (g, pts) => {
    for (const [x, y, a] of pts) {
      g.stroke(
        polyline([
          [x, y],
          [x, y + 3],
        ]),
        "#d8dcc0",
        0.4,
      );
      umbrella(g, x, y + 3, a - 90, 0.01);
      g.fill(circle(x, y + 3.4, 0.6), "#8a7a50");
    }
  };
  F.part(
    "drift",
    { bone: "root", z: 50, zb: 50, state: ["idle", "walk", "drift"], lod: 1 },
    (g) =>
      seeds(g, [
        [-14, -48, 0],
        [12, -52, 10],
        [18, -40, -10],
      ]),
  );
  F.part(
    "cloud",
    { bone: "root", z: 52, zb: 52, state: ["muzzle", "cloud"], glow: true },
    (g) => {
      g.fill(circle(0, -24, 22), "#e8ffb0", { op: 0.35 });
      seeds(g, [
        [-16, -40, 0],
        [-6, -48, 10],
        [8, -46, -10],
        [18, -34, 20],
        [-20, -24, -20],
        [14, -18, 0],
      ]);
    },
  );
  F.part("bloom", { bone: "head", z: 32, state: "bloom", glow: true }, (g) => {
    for (let i = 0; i < 8; i++)
      g.fill(
        ellipse(
          Math.cos((i * Math.PI) / 4) * 14,
          -32 + Math.sin((i * Math.PI) / 4) * 14,
          3,
          1.6,
          i * 45,
        ),
        "#ffe060",
        { op: 0.8 },
      );
  });

  F.anim({
    // Samen lösen sich und schweben
    idle: { prog: "hover.idle", p: { float: 2.4, sway: 4, tilt: 5 } },
    // schwebt
    walk: {
      prog: "hover.idle",
      p: { float: 3, sway: 6, tilt: 6 },
      keys: {
        body: {
          r: [
            [0, 6],
            [1, 6],
          ],
        },
      },
    },
    // Sprung, Samenwolke heilt
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
    // Samen wirbeln
    hit: {
      prog: "generic.hit",
      keys: {
        head: {
          r: [
            [0, 0],
            [0.15, 20],
            [0.4, -10],
            [1, 0],
          ],
        },
        show: { drift: [[0, 1]] },
      },
    },
    // erblüht
    spawn: {
      prog: "still",
      keys: {
        head: {
          sx: [
            [0, 0.2],
            [0.5, 1.15, "out"],
            [0.7, 1],
          ],
          sy: [
            [0, 0.2],
            [0.5, 1.15, "out"],
            [0.7, 1],
          ],
        },
        show: { bloom: [[0.3, 0.7]] },
      },
    },
    // zerstäubt in Samen
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.2]], cloud: [[0.1, 1.01]] },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
  });
}
