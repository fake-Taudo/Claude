// Lavawelpe – tapsiger fliegender Welpe aus rötlichem Basalt mit riesigen Welpenaugen und kringeligem Glutschwanz
// (Brief: docs/briefs/lava-pup.md)
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
import { eye, eyeClosed, eyeX, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function lavaPup(F) {
  const P = F.pal;
  const BASALT = P.main;
  const EMBER = P.acc;
  const BASALT_D = "#523232";
  const BASALT_L = "#9a6a64";
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

  F.rig("flyer", {
    body: [0, -22],
    head: [8, -30],
    crest: [6, -42],
    jaw: [16, -28],
    wingB: [-4, -30],
    wingF: [-1, -29],
    tail: [-10, -22],
    legB: [-6, -14],
    legF: [6, -14],
  });

  // ───────── Flügelstummel ─────────
  const wing = (name, z, col, s) =>
    F.part(name, { bone: name, z, zb: z, state: LIVE }, (g) => {
      const X = (x) => x * s;
      g.mat(
        path([
          [-2, -30, 1],
          [X(-8), -38],
          [X(-14), -40, 1],
          [X(-16), -34],
          [X(-12), -32],
          [X(-14), -27, 1],
          [X(-7), -26],
        ]),
        col,
        "leather",
        { hi: 0.25 },
      );
      g.stroke(
        polyline([
          [-2, -30],
          [X(-14), -40],
        ]),
        BASALT_D,
        1,
      );
    });
  wing("wingB", 2, BASALT_D, 0.9);

  // ───────── Kringeliger Glutschwanz (Signature) ─────────
  F.part(
    "tail",
    { bone: "tail", z: 3, zb: 40, sig: true, state: LIVE },
    (g) => {
      const pts = [];
      for (let i = 0; i <= 18; i++) {
        const a = Math.PI * 0.9 + i * 0.42;
        const r = 7 - i * 0.28;
        pts.push([-18 + Math.cos(a) * r, -26 + Math.sin(a) * r]);
      }
      g.stroke(spline([[-8, -20], [-14, -20], ...pts]), BASALT, 3.4);
    },
  );
  F.part(
    "tailGlow",
    { bone: "tail", z: 3.5, zb: 40.5, state: LIVE, glow: true },
    (g) => {
      const pts = [];
      for (let i = 0; i <= 18; i++) {
        const a = Math.PI * 0.9 + i * 0.42;
        const r = 7 - i * 0.28;
        pts.push([-18 + Math.cos(a) * r, -26 + Math.sin(a) * r]);
      }
      g.stroke(spline(pts), EMBER, 1.6);
      g.fill(
        circle(pts[pts.length - 1][0], pts[pts.length - 1][1], 1.6),
        "#fff0b0",
      );
    },
  );

  // ───────── Pfoten ─────────
  for (const [name, x, z, col] of [
    ["legB", -6, 5, BASALT_D],
    ["legF", 6, 7, BASALT],
  ]) {
    F.part(name, { bone: name, z, state: LIVE }, (g) => {
      g.mat(limb(x, -14, x + 1, -6, 2.6, 2.4), col, "stone");
      g.mat(ellipse(x + 2, -5, 3.4, 2.2), col, "stone", { hi: 0.4 });
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [x + 1.6, -6.6],
              [x + 1.6, -4],
            ],
            [
              [x + 3.2, -6.6],
              [x + 3.2, -4],
            ],
          ],
          BASALT_D,
          0.5,
          1,
        ),
      );
    });
  }

  // ───────── Runder Basaltkörper mit Glutpunkten ─────────
  F.part("body", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = ellipse(0, -21, 11, 9);
    g.mat(b, BASALT, "stone", { hi: 0.4 });
    g.clipTo(b, (h) => h.mat(ellipse(5, -17, 7, 5), BASALT_L, "stone"));
  });
  F.part(
    "dots",
    { bone: "body", z: 18.5, zb: 18.5, state: LIVE, glow: true },
    (g) => {
      for (const [x, y, r] of [
        [-6, -25, 1.2],
        [-2, -28, 0.9],
        [-8, -19, 1],
        [2, -24, 0.8],
      ])
        g.fill(circle(x, y, r), EMBER);
    },
  );
  emblem(F, "emblem", "body", 19, -4, -18, 2.2, { zb: 19, state: LIVE });

  // ───────── Kopf: riesige Welpenaugen, Stupsnase, Zünglein; Halsband (Teamzone) ─────────
  F.part("ears", { bone: "crest", z: 29, zb: 33, state: LIVE }, (g) => {
    g.mat(
      path([
        [0, -40],
        [-6, -42, 1],
        [-4, -33],
      ]),
      BASALT_D,
      "stone",
      { hi: 0.3 },
    );
    g.mat(
      path([
        [6, -42],
        [3, -48, 1],
        [10, -42],
      ]),
      BASALT,
      "stone",
      { hi: 0.3 },
    );
  });
  F.part("head", { bone: "head", z: 30, zb: 30, state: LIVE }, (g) => {
    g.mat(
      blob(
        [
          [-2, -34],
          [0, -42],
          [10, -45],
          [19, -40],
          [22, -32],
          [18, -26],
          [8, -25],
          [0, -28],
        ],
        0.8,
      ),
      BASALT,
      "stone",
      { hi: 0.4 },
    );
    g.mat(ellipse(17, -30, 5.4, 3.6), BASALT_L, "stone");
  });
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
      eye(g, 14.6, -36.6, {
        r: 3.6,
        iris: "#2a1414",
        irisR: 0.72,
        look: [0.4, 0.1],
        lid: 0,
        lidColor: BASALT,
      });
      eye(g, 7, -36.8, {
        r: 3.3,
        iris: "#2a1414",
        irisR: 0.72,
        look: [0.4, 0.1],
        lid: 0,
        lidColor: BASALT,
      });
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 14.6, -36.6, 3, { up: true, lw: 1 });
      eyeClosed(g, 7, -36.8, 2.8, { up: true, lw: 0.9 });
      g.fill(ellipse(17.4, -27.6, 1.8, 2), "#3a1414", { stroke: INK, lw: 0.4 });
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 14.6, -36.6, 2.4, INK, 1);
      eyeX(g, 7, -36.8, 2.2, INK, 0.9);
    },
  );
  F.part("nose", { bone: "head", z: 32, view: "front", state: LIVE }, (g) =>
    g.mat(ellipse(21, -31.4, 2, 1.4), "#2a1414", "skin", { hi: 0.6 }),
  );
  F.part(
    "mouth",
    {
      bone: "jaw",
      z: 32,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      g.stroke(
        spline([
          [15, -28.6],
          [17.4, -27.6],
          [20, -28.6],
        ]),
        INK,
        0.8,
      );
      g.mat(ellipse(18, -26.8, 1.4, 1.6), "#ff7a5a", "skin", {
        line: INK,
        lw: 0.4,
      });
    },
  );
  F.part(
    "collar",
    { bone: "body", z: 33, zb: 33, team: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [2, -30],
          [14, -26.6],
          [13, -24],
          [2, -27.4],
        ]),
        P.team,
        "leather",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(circle(11, -23.6, 1.4), "#f0d060", "gold", { hi: 0.8 });
    },
  );
  wing("wingF", 26, BASALT_L, 1);

  // ───────── Glutbiss, Jaulen, Funkenzerfall ─────────
  F.part(
    "biteSpark",
    { bone: "jaw", z: 40, state: "muzzle", glow: true },
    (g) => {
      for (const [x, y, r] of [
        [24, -30, 3],
        [27, -26, 2],
        [26, -34, 1.6],
      ])
        g.fill(star(x, y, r, r * 0.4, 6), EMBER);
    },
  );
  F.part(
    "tumble",
    { bone: "root", z: 51, zb: 51, state: "lavaSplash", glow: true },
    (g) => {
      for (const [x, y, r] of [
        [-8, -30, 6],
        [8, -40, 5],
        [0, -18, 5],
      ])
        g.fill(circle(x, y, r), EMBER, { op: 0.5 });
    },
  );
  F.part(
    "cinders",
    { bone: "root", z: 50, zb: 50, state: "cinders", glow: true },
    (g) => {
      for (const [x, y, r] of [
        [-10, -24, 2.4],
        [-2, -34, 2],
        [8, -28, 2.6],
        [14, -40, 1.6],
        [-14, -36, 1.4],
        [4, -18, 1.8],
      ])
        g.fill(star(x, y, r, r * 0.45, 5), EMBER);
    },
  );

  F.anim({
    // jagt den eigenen Schwanz
    idle: {
      prog: "flyer.idle",
      p: { flaps: 3, flap: 30, lift: 2, tail: 20 },
      keys: {
        head: {
          r: [
            [0, 0],
            [0.3, 0],
            [0.45, -30],
            [0.6, -30],
            [0.75, 0],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.3, 0],
            [0.45, -14],
            [0.6, -14],
            [0.75, 0],
          ],
        },
      },
    },
    // flattert
    walk: { prog: "flyer.walk", p: { flap: 36, lean: 10, tail: 22 } },
    // Glutbiss
    attack: {
      prog: "flyer.bite",
      hit: 0.55,
      p: { wind: -16, strike: 18, reach: 5, jawOpen: 30 },
      keys: { show: { muzzle: [[0.55, 0.8]] } },
      ev: { strike: 0.55 },
    },
    // jault
    hit: {
      prog: "flyer.hit",
      keys: {
        crest: {
          r: [
            [0, 0],
            [0.15, -30],
            [0.8, -20],
            [1, 0],
          ],
        },
      },
    },
    // purzelt aus dem Lavahund
    spawn: {
      prog: "flyer.spawn",
      keys: {
        body: {
          r: [
            [0, -360],
            [0.6, 0, "out"],
          ],
        },
        show: { lavaSplash: [[0, 0.35]] },
      },
    },
    // zerfällt in Glutfunken
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.25]], cinders: [[0.2, 1.01]] },
        body: {
          sx: [
            [0, 1],
            [0.25, 0.8],
          ],
          sy: [
            [0, 1],
            [0.25, 0.8],
          ],
        },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
  });
}
