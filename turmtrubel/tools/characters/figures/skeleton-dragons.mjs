// Skelettdrachen – gierige Knochendrachen mit zerfetzten Flügelhäuten und grünem Geisterfeuer im offenen Brustkorb
// Varianten: 0 = heil, 1 = abgebrochene Hornspitze, 2 = Kerbe im Kiefer (Brief: docs/briefs/skeleton-dragons.md)
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
import { eyeX, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function skeletonDragons(F) {
  const P = F.pal;
  const BONE = P.main;
  const FIRE = P.acc;
  const MEMB = "#8a8478";
  const BONE_D = "#a89c80";
  const SOCK = "#1e2a22";
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
    "flyer",
    {
      body: [0, -42],
      neck: [10, -48],
      head: [24, -64],
      crest: [22, -72],
      jaw: [28, -61],
      wingB: [-4, -50],
      wingF: [0, -49],
      tail: [-12, -40],
      legB: [-4, -34],
      legF: [4, -34],
      fire: [2, -40],
      drop: [0, 0],
    },
    {
      neck: "body",
      head: "neck",
      crest: "head",
      jaw: "head",
      fire: "body",
      drop: "root",
    },
  );

  const vertebrae = (g, pts, r0, r1, col) => {
    const n = pts.length;
    pts.forEach(([x, y], i) =>
      g.mat(
        circle(x, y, r0 + (r1 - r0) * (i / Math.max(1, n - 1))),
        col,
        "bone",
        { hi: 0.5 },
      ),
    );
  };

  // ───────── Zerfetzte Flügel auf Fingerknochen ─────────
  const wing = (name, z, col, s) => {
    const X = (x) => x * s;
    const sh = [0, -50];
    const wr = [X(-20), -72];
    const tips = [
      [X(-52), -74],
      [X(-50), -54],
      [X(-36), -42],
    ];
    F.part(name, { bone: name, z, zb: z, state: LIVE }, (g) => {
      const m = path([
        [...sh, 1],
        [X(-10), -66],
        [...wr, 1],
        [X(-36), -80],
        [...tips[0], 1],
        [X(-46), -68],
        [X(-50), -62],
        [X(-44), -60, 1],
        [...tips[1], 1],
        [X(-44), -50],
        [X(-40), -52, 1],
        [...tips[2], 1],
        [X(-24), -46],
        [X(-14), -40, 1],
        [X(-8), -46],
      ]);
      g.mat(m, col, "leather", { hi: 0.15 });
      g.clipTo(m, (h) => {
        for (const [x, y, r] of [
          [X(-34), -64, 3],
          [X(-24), -54, 2.2],
          [X(-42), -70, 1.8],
        ])
          h.fill(
            blob(
              [
                [x - r, y],
                [x, y - r],
                [x + r, y - r * 0.2],
                [x + r * 0.4, y + r],
              ],
              0.7,
            ),
            "#2c3a2c",
            { op: 0.85 },
          );
      });
      for (const t of tips) g.stroke(polyline([wr, t]), BONE, 1.6);
      g.stroke(polyline([sh, wr]), BONE, 2.2);
      for (const t of tips) g.mat(circle(t[0], t[1], 1.2), BONE, "bone");
      g.mat(circle(wr[0], wr[1], 1.8), BONE, "bone", { hi: 0.5 });
    });
  };
  wing("wingB", 2, "#6a6458", 0.9);

  // ───────── Langer Knochenschwanz mit Wirbelreihe ─────────
  F.part("tail", { bone: "tail", z: 3, zb: 40, state: LIVE }, (g) => {
    const pts = [
      [-12, -40],
      [-20, -38],
      [-28, -34],
      [-36, -32],
      [-44, -32],
      [-51, -34],
    ];
    vertebrae(g, pts, 3, 1.8, BONE);
    g.mat(
      path([
        [-51, -34],
        [-60, -38, 1],
        [-56, -33],
        [-60, -28, 1],
      ]),
      BONE_D,
      "bone",
      { hi: 0.5 },
    );
  });

  // ───────── Brustkorb mit grünem Geisterfeuer (Signature) ─────────
  F.part("spine", { bone: "body", z: 16, zb: 16, state: LIVE }, (g) => {
    vertebrae(
      g,
      [
        [-10, -44],
        [-5, -47],
        [0, -49],
        [5, -50],
        [10, -50],
      ],
      2.4,
      2.8,
      BONE_D,
    );
    g.mat(
      path([
        [-12, -42],
        [-6, -38, 1],
        [-14, -34],
        [-18, -38],
      ]),
      BONE_D,
      "bone",
      { hi: 0.4 },
    );
  });
  F.part(
    "flames",
    { bone: "fire", z: 17, zb: 17, state: LIVE, sig: true },
    (g) => {
      g.mat(
        path([
          [-8, -32],
          [-6, -44],
          [-2, -40],
          [0, -52, 1],
          [4, -42],
          [8, -48, 1],
          [10, -38],
          [12, -32],
          [2, -28],
        ]),
        FIRE,
        "flat",
      );
      g.fill(
        path([
          [-3, -32],
          [-1, -40],
          [2, -37],
          [4, -44, 1],
          [6, -36],
          [7, -32],
        ]),
        "#e8ffe0",
      );
    },
  );
  F.part(
    "fireHalo",
    { bone: "fire", z: 17.2, zb: 17.2, state: LIVE, glow: true, lod: 1 },
    (g) => g.fill(ellipse(2, -40, 14, 13), FIRE, { op: 0.18 }),
  );
  F.part("ribs", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    for (const [x, h] of [
      [-6, 14],
      [-1, 16],
      [4, 17],
      [9, 15],
    ])
      g.stroke(
        spline([
          [x, -49],
          [x + 5, -46],
          [x + 6, -49 + h * 0.6],
          [x + 2, -49 + h],
        ]),
        BONE,
        2.4,
      );
    g.stroke(
      spline([
        [-6, -35],
        [2, -32],
        [11, -34],
      ]),
      BONE_D,
      1.4,
    );
  });
  emblem(F, "emblem", "body", 19, -12, -40, 2.6, { zb: 19, state: LIVE });

  // ───────── Hals aus Wirbeln mit Halsband (Teamzone) ─────────
  F.part("neck", { bone: "neck", z: 22, zb: 22, state: LIVE }, (g) =>
    vertebrae(
      g,
      [
        [11, -50],
        [14, -54],
        [17, -58],
        [20, -61],
        [23, -63],
      ],
      2.8,
      2.4,
      BONE,
    ),
  );
  F.part(
    "collar",
    { bone: "neck", z: 22.5, zb: 22.5, team: true, state: LIVE },
    (g) => {
      // zerrissener Wimpel am Halsband
      g.mat(
        path([
          [14.6, -56],
          [9.4, -47],
          [12.4, -46.4],
          [8.6, -40],
          [14, -43.4],
          [15.4, -39.6],
          [19.4, -53.4],
        ]),
        P.teamShade,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(
        path([
          [12, -59.4],
          [18, -52.6],
          [21.4, -55.6],
          [15, -62.2],
        ]),
        P.team,
        "leather",
        { line: P.teamDeep, lw: 0.4 },
      );
      g.mat(circle(18.4, -53, 1.2), "#c8ccd2", "metal", { lod: 1 });
    },
  );

  // ───────── Langer Schädel mit Hörnern, grün glühenden Augen, schnappendem Kiefer ─────────
  F.part(
    "horns",
    { bone: "crest", z: 29, zb: 33, state: LIVE, variant: [0, 2] },
    (g) => {
      g.mat(
        path([
          [20, -70],
          [12, -80],
          [6, -82, 1],
          [12, -77],
          [17, -68],
        ]),
        BONE_D,
        "bone",
        { hi: 0.5 },
      );
      g.mat(
        path([
          [24, -71],
          [20, -82],
          [16, -86, 1],
          [21, -80],
          [27, -70],
        ]),
        BONE,
        "bone",
        { hi: 0.5 },
      );
    },
  );
  F.part(
    "hornsChipped",
    { bone: "crest", z: 29, zb: 33, state: LIVE, variant: 1 },
    (g) => {
      g.mat(
        path([
          [20, -70],
          [12, -80],
          [6, -82, 1],
          [12, -77],
          [17, -68],
        ]),
        BONE_D,
        "bone",
        { hi: 0.5 },
      );
      g.mat(
        path([
          [24, -71],
          [21.6, -78, 1],
          [19, -79, 1],
          [21, -76],
          [27, -70],
        ]),
        BONE,
        "bone",
        { hi: 0.5 },
      );
    },
  );
  F.part("skull", { bone: "head", z: 30, zb: 30, state: LIVE }, (g) => {
    g.mat(
      path([
        [18, -64],
        [22, -73],
        [32, -72],
        [44, -66],
        [46, -62, 1],
        [36, -62],
        [26, -60],
        [20, -60],
      ]),
      BONE,
      "bone",
      { hi: 0.5 },
    );
    g.fill(ellipse(42.6, -65, 1, 0.7), SOCK);
    for (const x of [32, 36, 40, 44])
      g.fill(
        path([
          [x, -62.4],
          [x + 1, -60.4, 1],
          [x + 2, -62.4],
        ]),
        WHITE,
        { stroke: INK, lw: 0.3 },
      );
  });
  F.part("sockets", { bone: "head", z: 31, view: "front", state: LIVE }, (g) =>
    g.fill(ellipse(29, -67.4, 3.4, 2.6, -10), SOCK),
  );
  F.part(
    "eyes",
    {
      bone: "head",
      z: 31.5,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability", "hurt", "stun"],
      glow: true,
    },
    (g) => {
      g.fill(circle(29.6, -67.4, 1.8), FIRE);
      g.fill(circle(29.8, -67.6, 0.8), "#e8ffe0");
    },
  );
  F.part(
    "eyes.death",
    { bone: "head", z: 31.5, view: "front", state: LIVE, expr: "death" },
    (g) => eyeX(g, 29, -67.4, 1.6, FIRE, 0.8),
  );
  const jaw = (notch) => (g) => {
    g.mat(
      path([
        [22, -60],
        [32, -60],
        [44, -61],
        [42, -57, 1],
        [30, -55],
        [22, -57],
      ]),
      BONE_D,
      "bone",
      { hi: 0.4 },
    );
    for (const x of [32, 36, 40])
      g.fill(
        path([
          [x, -60],
          [x + 1, -62, 1],
          [x + 2, -60],
        ]),
        WHITE,
        { stroke: INK, lw: 0.3 },
      );
    if (notch)
      g.fill(
        path([
          [35, -55.6],
          [36.4, -57.4, 1],
          [38, -55.6],
        ]),
        "#2c3a2c",
      );
  };
  F.part(
    "jawBone",
    { bone: "jaw", z: 29.5, zb: 29.6, state: LIVE, variant: [0, 1] },
    jaw(false),
  );
  F.part(
    "jawNotch",
    { bone: "jaw", z: 29.5, zb: 29.6, state: LIVE, variant: 2 },
    jaw(true),
  );
  wing("wingF", 26, MEMB, 1);

  // ───────── Geisterfeuer-Ball, grüner Rauch, Knochenregen ─────────
  F.part(
    "fireball",
    { bone: "jaw", z: 42, state: "muzzle", glow: true },
    (g) => {
      g.fill(
        blob(
          [
            [46, -62],
            [54, -68],
            [62, -64],
            [62, -56],
            [54, -54],
          ],
          0.8,
        ),
        FIRE,
        { op: 0.8 },
      );
      g.fill(circle(56, -60, 3.4), "#e8ffe0");
    },
  );
  F.part(
    "smoke",
    { bone: "root", z: 50, zb: 50, state: "smoke", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-10, -44, 12],
        [12, -56, 10],
        [-24, -60, 8],
        [26, -40, 8],
      ])
        g.fill(circle(x, y, r), "#5a8a6a", { op: 0.55 });
    },
  );
  F.part("boneRain", { bone: "drop", z: 20, zb: 20, state: "rain" }, (g) => {
    for (const [x, y, a, l] of [
      [-20, -40, 30, 8],
      [-6, -50, -20, 10],
      [10, -44, 70, 7],
      [24, -60, 10, 9],
      [0, -34, -60, 6],
      [-30, -56, 50, 7],
    ]) {
      g.mat(rrect(x - l / 2, y - 0.9, l, 1.8, 0.9).rot(a, x, y), BONE, "bone", {
        hi: 0.5,
      });
      g.mat(
        circle(
          x - (l / 2) * Math.cos((a * Math.PI) / 180),
          y - (l / 2) * Math.sin((a * Math.PI) / 180),
          1.4,
        ),
        BONE,
        "bone",
      );
    }
    g.mat(
      path([
        [24, -66],
        [34, -68],
        [40, -64],
        [30, -62],
      ]),
      BONE,
      "bone",
      { hi: 0.5 },
    );
  });

  F.anim({
    // Flügelschlag, Feuer züngelt durch die Rippen
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 26, lift: 2.4, tail: 10 },
      keys: {
        fire: {
          sy: [
            [0, 1],
            [0.25, 1.12],
            [0.5, 0.94],
            [0.75, 1.1],
            [1, 1],
          ],
        },
      },
      ev: { flap: [0.12, 0.62] },
    },
    // Flug mit Wellen im Schwanz
    walk: {
      prog: "flyer.walk",
      p: { flap: 32, lean: 8, tail: 20 },
      keys: {
        fire: {
          sy: [
            [0, 1],
            [0.5, 1.12],
            [1, 1],
          ],
        },
      },
      ev: { flap: [0.1, 0.43, 0.76] },
    },
    // Kopf zurück, grüner Feuerball
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -22, strike: 12, jawOpen: 30 },
      keys: {
        neck: {
          r: [
            [0, 0],
            [0.45, -12],
            [0.55, 6],
            [1, 0],
          ],
        },
      },
      ev: { release: 0.55 },
    },
    // Knochen klappern
    hit: {
      prog: "flyer.hit",
      keys: {
        jaw: {
          r: [
            [0, 0],
            [0.1, 18],
            [0.2, 0],
            [0.3, 14],
            [0.4, 0],
          ],
        },
        head: {
          x: [
            [0, 0],
            [0.1, -1],
            [0.2, 1],
            [0.3, -1],
            [0.4, 0],
          ],
        },
      },
    },
    // fliegen aus grünem Rauch
    spawn: { prog: "flyer.spawn", keys: { show: { smoke: [[0, 0.55]] } } },
    // zerfallen in der Luft, Knochen regnen
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: {
          whole: [[0, 0.22]],
          rain: [[0.22, 1.01]],
          smoke: [[0.15, 0.5]],
        },
        drop: {
          y: [
            [0.22, 0],
            [1, 46, "in"],
          ],
          r: [
            [0.22, 0],
            [1, 30],
          ],
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
