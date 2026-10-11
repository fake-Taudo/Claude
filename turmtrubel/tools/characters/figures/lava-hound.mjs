// Lavahund – hechelnder, gutmütiger fliegender Riesenhund aus Basalt mit rauchendem Vulkankrater auf dem Rücken;
// Lava-Adern leuchten zwischen den Basaltplatten (Brief: docs/briefs/lava-hound.md)
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
import { eyeClosed, eyeX, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function lavaHound(F) {
  const P = F.pal;
  const BASALT = P.main;
  const LAVA = P.acc;
  const EMBER = "#ffd27a";
  const SMOKE = "#5a5058";
  const BASALT_L = "#5a4a50";
  const BASALT_D = "#2a2226";
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
      body: [0, -60],
      head: [30, -66],
      crest: [26, -82],
      jaw: [42, -60],
      wingB: [-12, -82],
      wingF: [-6, -80],
      tail: [-32, -58],
      legB: [-12, -36],
      legF: [14, -36],
      earB: [22, -80],
      earF: [32, -82],
      crater: [-6, -86],
    },
    { earB: "head", earF: "head", crater: "body" },
  );

  // Basaltplatten mit glühenden Fugen
  const plates = (h, cells) => {
    for (const pts of cells)
      h.mat(poly(pts, 2), BASALT_L, "stone", { hi: 0.3, line: false });
  };

  // ───────── Flügelstummel ─────────
  const wing = (name, z, col, s) =>
    F.part(name, { bone: name, z, zb: z, state: LIVE }, (g) => {
      const X = (x) => x * s;
      g.mat(
        path([
          [-8, -82, 1],
          [X(-20), -96],
          [X(-34), -102, 1],
          [X(-32), -92],
          [X(-40), -88, 1],
          [X(-30), -84],
          [X(-34), -76, 1],
          [X(-20), -78],
        ]),
        col,
        "leather",
        { hi: 0.2 },
      );
      g.stroke(
        polyline([
          [-8, -82],
          [X(-34), -102],
        ]),
        BASALT_D,
        1.6,
      );
    });
  wing("wingB", 2, BASALT_D, 0.9);
  F.part("tail", { bone: "tail", z: 3, zb: 40, state: LIVE }, (g) => {
    g.mat(
      path([
        [-30, -62],
        [-42, -66],
        [-50, -74, 1],
        [-44, -64],
        [-30, -54],
      ]),
      BASALT,
      "stone",
      { hi: 0.3 },
    );
    g.fill(circle(-49, -73, 1.6), LAVA);
  });
  for (const [name, x, z, col] of [
    ["legB", -12, 5, BASALT_D],
    ["legF", 14, 7, BASALT],
  ]) {
    F.part(name, { bone: name, z, state: LIVE }, (g) => {
      g.mat(limb(x, -38, x + 2, -24, 5, 4.4), col, "stone");
      g.mat(ellipse(x + 4, -22, 7, 4), col, "stone", { hi: 0.4 });
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [x + 3, -24],
              [x + 3, -19],
            ],
            [
              [x + 6.4, -24],
              [x + 6.4, -19],
            ],
          ],
          BASALT_D,
          0.6,
          1,
        ),
      );
    });
  }

  // ───────── Rundlicher Basaltkörper mit Lava-Adern ─────────
  F.part("body", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob(
      [
        [-34, -58],
        [-28, -80],
        [-6, -90],
        [18, -86],
        [32, -72],
        [32, -48],
        [16, -34],
        [-12, -34],
        [-30, -42],
      ],
      0.8,
    );
    g.mat(b, BASALT, "stone", { hi: 0.3 });
    g.clipTo(b, (h) => {
      plates(h, [
        [
          [-30, -72],
          [-16, -82],
          [-8, -70],
          [-20, -62],
        ],
        [
          [-6, -84],
          [10, -84],
          [8, -70],
          [-4, -70],
        ],
        [
          [12, -80],
          [26, -72],
          [20, -62],
          [10, -66],
        ],
        [
          [-28, -56],
          [-16, -58],
          [-12, -44],
          [-26, -42],
        ],
        [
          [-10, -64],
          [6, -64],
          [4, -50],
          [-8, -50],
        ],
        [
          [8, -58],
          [24, -58],
          [20, -42],
          [6, -44],
        ],
      ]);
      h.mat(ellipse(8, -38, 18, 6), BASALT_L, "stone", { line: false });
    });
  });
  F.part(
    "veins",
    { bone: "body", z: 18.5, zb: 18.5, state: LIVE, glow: true },
    (g) => {
      for (const pts of [
        [
          [-24, -60],
          [-16, -66],
          [-8, -66],
          [-4, -76],
        ],
        [
          [8, -68],
          [10, -60],
          [6, -48],
        ],
        [
          [-12, -48],
          [-4, -54],
          [6, -54],
          [20, -60],
        ],
        [
          [-16, -82],
          [-8, -76],
        ],
      ])
        g.stroke(polyline(pts), LAVA, 1.1);
    },
  );
  emblem(F, "emblem", "body", 19, -18, -50, 2.6, { zb: 19, state: LIVE });

  // ───────── Rauchender Vulkankrater auf dem Rücken (Signature) ─────────
  F.part(
    "crater",
    { bone: "crater", z: 27, zb: 30, sig: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [-20, -84],
          [-12, -100],
          [-2, -100],
          [6, -84],
        ]),
        BASALT_L,
        "stone",
        { hi: 0.4 },
      );
      g.mat(ellipse(-7, -100, 6, 2), BASALT_D, "stone");
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [-14, -90],
              [-12, -96],
            ],
            [
              [0, -88],
              [-2, -96],
            ],
          ],
          BASALT_D,
          0.7,
          1,
        ),
      );
    },
  );
  F.part(
    "craterGlow",
    { bone: "crater", z: 27.5, zb: 30.5, state: LIVE, glow: true },
    (g) => {
      g.fill(ellipse(-7, -100, 4.6, 1.4), LAVA);
      g.stroke(
        polyline([
          [-11, -96],
          [-9, -92],
          [-10, -88],
        ]),
        LAVA,
        0.9,
      );
    },
  );
  F.part(
    "smoke",
    {
      bone: "crater",
      z: 26.5,
      zb: 29,
      state: ["idle", "walk", "smoke"],
      outline: false,
    },
    (g) => {
      for (const [x, y, r] of [
        [-6, -106, 5],
        [-10, -114, 6],
        [-4, -122, 5],
      ])
        g.fill(circle(x, y, r), SMOKE, { op: 0.7 });
    },
  );

  // ───────── Hundekopf: Hängeohren, glühende Augen, Lavazunge; Halsband (Teamzone) ─────────
  F.part("earB", { bone: "earB", z: 29, zb: 33, state: LIVE }, (g) =>
    g.mat(
      path([
        [18, -80],
        [10, -78],
        [6, -64],
        [10, -58, 1],
        [16, -66],
        [22, -76],
      ]),
      BASALT_D,
      "stone",
      { hi: 0.3 },
    ),
  );
  F.part("head", { bone: "head", z: 30, zb: 30, state: LIVE }, (g) => {
    const h0 = blob(
      [
        [18, -70],
        [22, -82],
        [34, -86],
        [46, -80],
        [52, -70],
        [50, -58],
        [38, -54],
        [24, -58],
      ],
      0.8,
    );
    g.mat(h0, BASALT, "stone", { hi: 0.35 });
    g.clipTo(h0, (h) =>
      h.mat(ellipse(46, -62, 9, 6), BASALT_L, "stone", { line: false }),
    );
    g.mat(ellipse(53, -66, 3.4, 2.6), BASALT_D, "stone", { hi: 0.6 });
  });
  F.part(
    "eyes",
    {
      bone: "head",
      z: 31,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
      glow: true,
    },
    (g) => {
      for (const [x, r] of [
        [42, 2.6],
        [33, 2.3],
      ]) {
        g.fill(ellipse(x, -72, r, r * 0.9), LAVA);
        g.fill(circle(x + 0.6, -72.4, r * 0.4), "#fff4c8");
      }
    },
  );
  F.part(
    "brows",
    { bone: "head", z: 31.5, view: "front", state: LIVE },
    (g) => {
      g.stroke(
        spline([
          [38.6, -76],
          [42, -77],
          [45, -75.6],
        ]),
        BASALT_D,
        1.2,
      );
      g.stroke(
        spline([
          [30, -75.6],
          [33, -76.4],
          [36, -75.4],
        ]),
        BASALT_D,
        1.1,
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 42, -72, 2.4, { up: true, lw: 1, color: LAVA });
      eyeClosed(g, 33, -72, 2.2, { up: true, lw: 0.9, color: LAVA });
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 42, -72, 2, LAVA, 1);
      eyeX(g, 33, -72, 1.8, LAVA, 0.9);
    },
  );
  F.part("jawPart", { bone: "jaw", z: 29.5, zb: 29.6, state: LIVE }, (g) => {
    g.mat(
      path([
        [30, -58],
        [42, -58],
        [52, -60],
        [50, -54, 1],
        [40, -50],
        [30, -52],
      ]),
      BASALT_L,
      "stone",
      { hi: 0.3 },
    );
  });
  F.part(
    "tongue",
    { bone: "jaw", z: 29.8, zb: 29.8, state: LIVE, glow: true },
    (g) => {
      g.fill(
        path([
          [42, -56],
          [48, -56],
          [49, -46],
          [46, -42, 1],
          [43, -46],
        ]),
        LAVA,
      );
      g.stroke(
        polyline([
          [45.4, -54],
          [45.6, -46],
        ]),
        "#c8401a",
        0.6,
      );
    },
  );
  F.part("earF", { bone: "earF", z: 32, zb: 32, state: LIVE }, (g) => {
    g.mat(
      path([
        [28, -82],
        [22, -80],
        [20, -64],
        [24, -56, 1],
        [30, -64],
        [34, -78],
      ]),
      BASALT_L,
      "stone",
      { hi: 0.35 },
    );
    g.lod(1, (h) =>
      h.stroke(
        polyline([
          [26, -76],
          [24, -62],
        ]),
        LAVA,
        0.6,
      ),
    );
  });
  F.part(
    "collar",
    { bone: "body", z: 33, zb: 33, team: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [18, -76],
          [24, -76],
          [30, -54],
          [24, -52],
        ]),
        P.team,
        "leather",
        { line: P.teamDeep, lw: 0.5 },
      );
      g.mat(circle(27, -54, 2), "#f0d060", "gold", { hi: 0.8 });
    },
  );
  wing("wingF", 26, BASALT_L, 1);

  // ───────── Lavaspucke, Krusten, Platzen in Welpen ─────────
  F.part("spit", { bone: "jaw", z: 42, state: "muzzle", glow: true }, (g) => {
    g.fill(
      blob(
        [
          [54, -60],
          [64, -66],
          [72, -60],
          [68, -52],
          [58, -52],
        ],
        0.7,
      ),
      LAVA,
      { op: 0.9 },
    );
    g.fill(circle(64, -59, 3), EMBER);
  });
  F.part("chips", { bone: "root", z: 50, zb: 50, state: "chips" }, (g) => {
    for (const [x, y, r] of [
      [-38, -70, 3],
      [36, -90, 2.4],
      [-30, -36, 2.6],
      [40, -40, 2],
    ])
      g.mat(
        poly(
          [
            [x - r, y],
            [x, y - r],
            [x + r, y - r * 0.3],
            [x + r * 0.4, y + r],
          ],
          0.4,
        ),
        BASALT_L,
        "stone",
        { hi: 0.4 },
      );
  });
  F.part(
    "fallSmoke",
    { bone: "root", z: 51, zb: 51, state: "fallSmoke", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-30, -90, 12],
        [10, -100, 14],
        [30, -80, 10],
      ])
        g.fill(circle(x, y, r), SMOKE, { op: 0.6 });
    },
  );
  F.part(
    "burst",
    { bone: "root", z: 52, zb: 52, state: "burst", glow: true },
    (g) => {
      g.fill(star(0, -60, 50, 26, 10, -90, 6), LAVA, { op: 0.8 });
      g.fill(circle(0, -60, 18), EMBER, { op: 0.9 });
    },
  );
  F.part("rubble", { bone: "root", z: 51, zb: 51, state: "burst" }, (g) => {
    for (const [x, y, r] of [
      [-40, -50, 6],
      [36, -70, 5],
      [-20, -92, 5],
      [24, -30, 6],
      [-6, -26, 4],
      [44, -46, 4],
    ])
      g.mat(
        poly(
          [
            [x - r, y],
            [x - r * 0.3, y - r],
            [x + r, y - r * 0.5],
            [x + r * 0.7, y + r * 0.8],
            [x - r * 0.5, y + r * 0.9],
          ],
          r * 0.2,
        ),
        BASALT_L,
        "stone",
        { hi: 0.4 },
      );
  });

  F.anim({
    // Krater raucht, Zunge hängt heraus, Hecheln
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 22, lift: 3, tail: 14 },
      keys: {
        jaw: {
          r: [
            [0, 6],
            [0.25, 14],
            [0.5, 6],
            [0.75, 14],
            [1, 6],
          ],
        },
        body: {
          sy: [
            [0, 1],
            [0.25, 1.03],
            [0.5, 1],
            [0.75, 1.03],
            [1, 1],
          ],
        },
      },
    },
    // schwebt mit Ohrenschlackern
    walk: {
      prog: "flyer.walk",
      p: { flap: 26, lean: 6, tail: 18 },
      keys: {
        earF: {
          r: [
            [0, -10],
            [0.5, 14],
            [1, -10],
          ],
        },
        earB: {
          r: [
            [0, -14],
            [0.5, 10],
            [1, -14],
          ],
        },
        jaw: {
          r: [
            [0, 10],
            [1, 10],
          ],
        },
      },
      ev: { flap: [0.15, 0.65] },
    },
    // Lavaspucke
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -16, strike: 10, jawOpen: 26 },
      ev: { release: 0.55 },
    },
    // Krusten bröckeln
    hit: { prog: "flyer.hit", keys: { show: { chips: [[0, 0.7]] } } },
    // fällt mit Rauch ein und fängt sich
    spawn: {
      prog: "flyer.spawn",
      keys: {
        root: {
          y: [
            [0, -30],
            [0.4, 6, "in"],
            [0.6, -2],
            [0.75, 0],
          ],
        },
        show: { fallSmoke: [[0, 0.6]] },
      },
    },
    // zerplatzt in sechs Welpen und Basaltbrocken
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.2]], burst: [[0.15, 0.8]] },
        body: {
          sx: [
            [0, 1],
            [0.18, 1.12],
          ],
          sy: [
            [0, 1],
            [0.18, 1.12],
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
