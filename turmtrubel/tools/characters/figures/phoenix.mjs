// Phönix – stolzer, feuriger Vogel in Gold-Orange mit Flammenkamm und drei Schleppfedern wie Flammenbänder
// Formen: egg = glühendes Ei mit Rissen (pulsiert, schlüpft), reborn = flaumiges Küken mit kleinem Flammenkamm
// (Brief: docs/briefs/phoenix.md)
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

export default function phoenix(F) {
  const P = F.pal;
  const GOLD = P.main;
  const FLAME = P.acc;
  const BEAK = "#f0c040";
  const BREAST = "#ffd870";
  const DEEP = "#e0601e";
  const LEG = "#8a5a2a";
  const BASE = "base";
  const EGG = "egg";
  const CHICK = "reborn";
  const EGG_LIVE = [
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
    body: [0, -40],
    head: [16, -56],
    crest: [14, -66],
    jaw: [26, -56],
    wingB: [-4, -50],
    wingF: [0, -48],
    tail: [-12, -36],
    legB: [-4, -30],
    legF: [4, -30],
  });

  // Flammenzunge: Basis b, Spitze t, Breite w
  const tongue = (b, t, w) => {
    const [dx, dy] = [t[0] - b[0], t[1] - b[1]];
    const L = Math.hypot(dx, dy);
    const [nx, ny] = [-dy / L, dx / L];
    return path([
      [b[0] + nx * w, b[1] + ny * w],
      [b[0] + dx * 0.55 + nx * w * 0.7, b[1] + dy * 0.55 + ny * w * 0.7],
      [t[0], t[1], 1],
      [b[0] + dx * 0.6 - nx * w * 0.2, b[1] + dy * 0.6 - ny * w * 0.2],
      [b[0] + dx * 0.4 - nx * w, b[1] + dy * 0.4 - ny * w],
      [b[0] - nx * w, b[1] - ny * w],
    ]);
  };

  // ═════════ Grundform: Phönix ═════════
  // ───────── Drei Schleppfedern als Flammenbänder (Signature) ─────────
  const plumes = [
    [
      [-12, -38],
      [-30, -34],
      [-46, -40],
      [-62, -34],
      [-72, -38],
    ],
    [
      [-12, -36],
      [-28, -28],
      [-44, -24],
      [-58, -16],
      [-70, -18],
    ],
    [
      [-12, -34],
      [-24, -20],
      [-36, -10],
      [-48, -4],
      [-58, 0],
    ],
  ];
  F.part(
    "plumes",
    { bone: "tail", z: 3, zb: 40, sig: true, form: BASE },
    (g) => {
      plumes.forEach((pts, i) => {
        g.stroke(spline(pts), i === 1 ? GOLD : DEEP, 3.4);
        g.stroke(spline(pts.slice(1)), BREAST, 1.2, { lod: 1 });
        const e = pts[pts.length - 1];
        const p0 = pts[pts.length - 2];
        g.mat(tongue(p0, [e[0] - 6, e[1] - 2], 3.4), FLAME, "flat");
      });
    },
  );
  F.part(
    "plumeGlow",
    { bone: "tail", z: 3.5, zb: 40.5, glow: true, form: BASE },
    (g) => {
      for (const pts of plumes) {
        const e = pts[pts.length - 1];
        g.fill(circle(e[0] - 3, e[1] - 1, 3), "#ffd060", { op: 0.6 });
      }
    },
  );

  // ───────── Weite Flügel mit Federreihen und Flammenspitzen ─────────
  const wing = (name, z, s, dark) => {
    F.part(name, { bone: name, z, zb: z, form: BASE }, (g) => {
      const X = (x) => x * s;
      const m = path([
        [-2, -50, 1],
        [X(-14), -66],
        [X(-30), -78],
        [X(-48), -84, 1],
        [X(-44), -76],
        [X(-56), -76, 1],
        [X(-48), -68],
        [X(-58), -64, 1],
        [X(-46), -60],
        [X(-52), -52, 1],
        [X(-38), -52],
        [X(-40), -44, 1],
        [X(-26), -46],
        [X(-20), -38, 1],
        [X(-10), -44],
      ]);
      g.mat(m, dark ? DEEP : GOLD, "fur", { hi: 0.4 });
      g.clipTo(m, (h) => {
        h.mat(
          path([
            [0, -52],
            [X(-16), -66],
            [X(-32), -72],
            [X(-30), -62],
            [X(-14), -54],
          ]),
          BREAST,
          "fur",
        );
        h.lod(1, (k) =>
          lines(
            k,
            [
              [
                [X(-20), -62],
                [X(-34), -66],
              ],
              [
                [X(-26), -56],
                [X(-40), -58],
              ],
              [
                [X(-30), -50],
                [X(-42), -50],
              ],
            ],
            DEEP,
            0.7,
            1,
          ),
        );
      });
      for (const [x, y] of [
        [-48, -84],
        [-56, -76],
        [-58, -64],
        [-52, -52],
        [-40, -44],
      ])
        g.mat(tongue([X(x + 4), y + 1], [X(x - 3), y - 1], 1.8), FLAME, "flat");
    });
  };
  wing("wingB", 2, 0.9, true);

  // ───────── Beine mit Fußring (Teamzone) ─────────
  for (const [name, x, z] of [
    ["legB", -4, 5],
    ["legF", 4, 7],
  ]) {
    F.part(name, { bone: name, z, form: BASE }, (g) => {
      g.stroke(
        polyline([
          [x, -30],
          [x + 2, -20],
          [x + 1, -14],
        ]),
        LEG,
        1.6,
      );
      for (const [dx, dy] of [
        [4, 0],
        [1, 2],
        [-2, 1],
      ])
        g.stroke(
          spline([
            [x + 1, -14],
            [x + 1 + dx * 0.6, -13 + dy * 0.5],
            [x + 1 + dx, -12 + dy],
          ]),
          LEG,
          1,
        );
    });
  }
  F.part(
    "footRing",
    { bone: "legF", z: 7.5, zb: 7.5, team: true, form: BASE },
    (g) =>
      g.mat(rrect(4.4, -22, 4, 3, 0.8), P.team, "metal", {
        line: P.teamDeep,
        lw: 0.4,
      }),
  );

  // ───────── Körper mit Brustgefieder ─────────
  F.part("body", { bone: "body", z: 18, zb: 18, form: BASE }, (g) => {
    const b = blob(
      [
        [-14, -40],
        [-6, -50],
        [8, -54],
        [18, -50],
        [18, -38],
        [8, -30],
        [-8, -32],
      ],
      0.8,
    );
    g.mat(b, GOLD, "fur", { hi: 0.4 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(10, -40, 9, 12), BREAST, "fur");
      h.lod(1, (k) => {
        for (const [x, y] of [
          [6, -46],
          [12, -44],
          [6, -38],
          [12, -36],
          [8, -32],
        ])
          k.stroke(
            spline([
              [x - 2.4, y - 1],
              [x, y + 1.2],
              [x + 2.4, y - 1],
            ]),
            "#f0a030",
            0.7,
          );
      });
    });
  });
  emblem(F, "emblem", "body", 19, -6, -40, 2, { zb: 19, form: BASE });
  // ───────── Kopf: gebogener Schnabel, stolzer Blick, Flammenbrauen ─────────
  F.part("head", { bone: "head", z: 30, zb: 30, form: BASE }, (g) => {
    g.mat(
      blob(
        [
          [8, -56],
          [10, -64],
          [18, -68],
          [25, -64],
          [26, -56],
          [20, -50],
          [12, -50],
        ],
        0.8,
      ),
      GOLD,
      "fur",
      { hi: 0.45 },
    );
    g.mat(
      path([
        [24, -62],
        [32, -61],
        [36, -56, 1],
        [32, -57.4],
        [25, -56.6],
      ]),
      BEAK,
      "bone",
      { hi: 0.7 },
    );
    g.mat(
      path([
        [25, -56.6],
        [31, -57],
        [28, -54.4, 1],
      ]),
      "#d8a020",
      "bone",
      { hi: 0.4 },
    );
  });
  F.part(
    "face.idle",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
      form: BASE,
    },
    (g) => {
      eye(g, 20.4, -60.4, {
        r: 2.2,
        iris: "#7a1a3a",
        lid: 0.35,
        lidColor: GOLD,
        look: [0.8, 0],
      });
    },
  );
  F.part(
    "brow",
    { bone: "head", z: 31.5, view: "front", form: BASE, glow: true },
    (g) => g.fill(tongue([17, -63], [26, -65.6], 1.2), FLAME),
  );
  F.part(
    "face.hurt",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["hurt", "stun"],
      form: [BASE, CHICK],
    },
    (g) => eyeClosed(g, 20.4, -60.4, 2, { up: true, lw: 0.9 }),
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death", form: [BASE, CHICK] },
    (g) => eyeX(g, 20.4, -60.4, 1.6, INK, 0.9),
  );
  // Flammenkamm
  F.part("crest", { bone: "crest", z: 29, zb: 34, form: BASE }, (g) => {
    for (const [b, t, w] of [
      [[12, -66], [2, -80], 3],
      [[16, -67], [10, -84], 3.2],
      [[20, -66], [20, -80], 2.6],
    ])
      g.mat(tongue(b, t, w), FLAME, "flat");
  });
  F.part(
    "crestGlow",
    { bone: "crest", z: 29.5, zb: 34.5, glow: true, form: BASE },
    (g) => {
      for (const [b, t, w] of [
        [[12, -66], [4, -76], 1.4],
        [[16, -67], [11, -79], 1.6],
        [[20, -66], [20, -76], 1.2],
      ])
        g.fill(tongue(b, t, w), "#ffd060");
    },
  );
  wing("wingF", 26, 1, false);

  // ═════════ Form „egg“: glühendes Ei mit Rissen ═════════
  F.part(
    "egg",
    { bone: "root", z: 18, zb: 18, form: EGG, state: EGG_LIVE, sig: true },
    (g) =>
      g.group({ t: [1.25, 0, 0, 1.25, 0, 0] }, (g) => {
        const e = blob(
          [
            [0, -30],
            [9, -26],
            [12, -14],
            [8, -2],
            [0, 0],
            [-8, -2],
            [-12, -14],
            [-9, -26],
          ],
          0.9,
        );
        g.mat(e, DEEP, "stone", { hi: 0.5 });
        g.clipTo(e, (h) => {
          h.mat(ellipse(-2, -20, 7, 8), GOLD, "stone");
          h.mat(
            path([
              [-14, -10],
              [14, -12],
              [14, -8],
              [-14, -6],
            ]),
            P.team,
            "cloth",
            { line: P.teamDeep, lw: 0.4 },
          );
        });
      }),
  );
  F.part(
    "eggCracks",
    { bone: "root", z: 19, zb: 19, form: EGG, state: EGG_LIVE, glow: true },
    (g) =>
      g.group({ t: [1.25, 0, 0, 1.25, 0, 0] }, (g) => {
        g.stroke(
          polyline([
            [-4, -28],
            [-1, -22],
            [-5, -18],
            [-1, -14],
          ]),
          "#ffe080",
          1.1,
        );
        g.stroke(
          polyline([
            [6, -24],
            [4, -19],
            [8, -16],
          ]),
          "#ffe080",
          0.9,
        );
        g.fill(ellipse(0, -16, 8, 10), FLAME, { op: 0.18 });
      }),
  );
  emblem(F, "emblemEgg", "root", 19.5, 6.2, -7.6, 2, {
    zb: 19.5,
    form: EGG,
    state: EGG_LIVE,
  });
  F.part(
    "eggHalves",
    { bone: "root", z: 18, zb: 18, form: EGG, state: "hatch" },
    (g) =>
      g.group({ t: [1.25, 0, 0, 1.25, 0, 0] }, (g) => {
        g.mat(
          path([
            [-14, 0],
            [-12, -10],
            [-8, -12, 1],
            [-5, -8],
            [-2, -12, 1],
            [1, -8],
            [4, -12, 1],
            [7, -8],
            [10, -12, 1],
            [13, -6],
            [12, 0],
          ]),
          DEEP,
          "stone",
          { hi: 0.4 },
        );
        g.mat(
          path([
            [-6, -28],
            [6, -28],
            [10, -22, 1],
            [6, -20, 1],
            [3, -24],
            [0, -20, 1],
            [-3, -24],
            [-7, -20, 1],
            [-10, -24],
          ]).rot(-30, 0, -24),
          DEEP,
          "stone",
          { hi: 0.4 },
        );
      }),
  );

  // ═════════ Form „reborn“: flaumiges Küken ═════════
  F.part("chickTail", { bone: "tail", z: 3, zb: 40, form: CHICK }, (g) => {
    for (const [b, t] of [
      [
        [-8, -34],
        [-22, -38],
      ],
      [
        [-8, -32],
        [-20, -28],
      ],
      [
        [-8, -30],
        [-16, -20],
      ],
    ])
      g.mat(tongue(b, t, 2.4), FLAME, "flat");
  });
  F.part("chickWingB", { bone: "wingB", z: 2, zb: 2, form: CHICK }, (g) =>
    g.mat(
      blob(
        [
          [-2, -44],
          [-12, -52],
          [-18, -48],
          [-14, -40],
          [-6, -38],
        ],
        0.8,
      ),
      DEEP,
      "fur",
      { hi: 0.3 },
    ),
  );
  for (const [name, x, z] of [
    ["legB", -3, 5],
    ["legF", 3, 7],
  ]) {
    F.part(name + ".chick", { bone: name, z, form: CHICK }, (g) => {
      g.stroke(
        polyline([
          [x, -26],
          [x + 1, -20],
        ]),
        LEG,
        1.4,
      );
      for (const dx of [3, 0.6, -1.6])
        g.stroke(
          polyline([
            [x + 1, -20],
            [x + 1 + dx, -18.4],
          ]),
          LEG,
          0.9,
        );
    });
  }
  F.part(
    "chickRing",
    { bone: "legF", z: 7.5, zb: 7.5, team: true, form: CHICK },
    (g) =>
      g.mat(rrect(2.6, -24.6, 3.4, 2.6, 0.8), P.team, "metal", {
        line: P.teamDeep,
        lw: 0.4,
      }),
  );
  F.part("chickBody", { bone: "body", z: 18, zb: 18, form: CHICK }, (g) => {
    const b = circle(2, -36, 11);
    g.mat(b, GOLD, "fur", { hi: 0.5 });
    g.clipTo(b, (h) => h.mat(ellipse(8, -32, 7, 8), BREAST, "fur"));
    // Flaum
    g.lod(1, (h) => {
      for (const [x, y, a] of [
        [-8, -40, -40],
        [-6, -46, -10],
        [-9, -32, -70],
      ])
        h.mat(
          tongue([x + 2, y], [x - 2, y - 2], 1.2).rot(a, x, y),
          GOLD,
          "fur",
        );
    });
  });
  emblem(F, "emblemChick", "body", 19, -4, -34, 1.6, { zb: 19, form: CHICK });
  F.part("chickHead", { bone: "head", z: 30, zb: 30, form: CHICK }, (g) => {
    g.mat(circle(16, -54, 9), GOLD, "fur", { hi: 0.5 });
    g.mat(
      path([
        [23, -56],
        [29, -54],
        [23, -52],
      ]),
      BEAK,
      "bone",
      { hi: 0.6 },
    );
  });
  F.part(
    "chickFace",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
      form: CHICK,
    },
    (g) => {
      eye(g, 19.4, -56.6, {
        r: 2.8,
        iris: "#7a1a3a",
        irisR: 0.7,
        look: [0.5, 0],
        lid: 0,
      });
    },
  );
  F.part(
    "chickCrest",
    { bone: "crest", z: 29, zb: 34, form: CHICK, glow: true },
    (g) => {
      g.fill(tongue([13, -62], [10, -70], 2), FLAME);
      g.fill(tongue([16, -62.6], [17, -71], 1.8), "#ffd060");
    },
  );
  F.part("chickWingF", { bone: "wingF", z: 26, zb: 26, form: CHICK }, (g) =>
    g.mat(
      blob(
        [
          [0, -42],
          [-10, -48],
          [-15, -42],
          [-10, -34],
          [-2, -36],
        ],
        0.8,
      ),
      GOLD,
      "fur",
      { hi: 0.4 },
    ),
  );

  // ───────── Federn stieben, Flammen beim Erscheinen, Explosion ─────────
  F.part(
    "feathers",
    { bone: "root", z: 50, zb: 50, state: "feathers", form: [BASE, CHICK] },
    (g) => {
      for (const [x, y, a] of [
        [-20, -60, 30],
        [24, -70, -40],
        [-26, -40, 80],
        [30, -44, 10],
      ])
        g.mat(tongue([x, y], [x + 6, y - 2], 1.6).rot(a, x, y), GOLD, "fur");
    },
  );
  F.part(
    "rise",
    {
      bone: "root",
      z: 51,
      zb: 51,
      state: "rise",
      glow: true,
      form: [BASE, CHICK],
    },
    (g) => {
      for (const [b, t, w] of [
        [[-14, 0], [-18, -40], 7],
        [[0, 0], [2, -56], 9],
        [[14, 0], [18, -38], 7],
      ])
        g.fill(tongue(b, t, w), FLAME, { op: 0.8 });
    },
  );
  F.part(
    "blast",
    {
      bone: "root",
      z: 52,
      zb: 52,
      state: "blast",
      glow: true,
      form: [BASE, CHICK],
    },
    (g) => {
      g.fill(star(0, -40, 42, 24, 10, -90, 6), "#ff7a2a", { op: 0.8 });
      g.fill(star(0, -40, 30, 18, 10, -72, 4), "#ffc040", { op: 0.8 });
      g.fill(circle(0, -40, 16), "#fff0b0", { op: 0.9 });
    },
  );

  F.anim({
    // Federn lodern, Kopfnicken
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 24, lift: 2.6, tail: 12 },
      keys: {
        head: {
          r: [
            [0, 0],
            [0.2, 8],
            [0.35, 0],
            [0.7, 0],
            [0.85, 8],
            [1, 0],
          ],
        },
        crest: {
          sy: [
            [0, 1],
            [0.5, 1.12],
            [1, 1],
          ],
        },
      },
    },
    // gleitender Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 20, lean: 6, tail: 16, flaps: 2 },
      ev: { flap: [0.15, 0.65] },
    },
    // Krallenhieb im Sturz
    attack: {
      prog: "flyer.idle",
      hit: 0.55,
      p: { flaps: 2, flap: 30 },
      keys: {
        expr: [[0, 1, "attack"]],
        root: {
          y: [
            [0, 0],
            [0.4, -10, "out"],
            [0.55, 8, "in"],
            [0.8, 2],
            [1, 0],
          ],
          x: [
            [0, 0],
            [0.4, -4],
            [0.55, 6],
            [1, 0],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.4, -12],
            [0.55, 20],
            [1, 0],
          ],
        },
        legF: {
          r: [
            [0, 0],
            [0.4, 40],
            [0.55, -70],
            [0.75, -40],
            [1, 0],
          ],
        },
        legB: {
          r: [
            [0, 0],
            [0.4, 30],
            [0.55, -50],
            [1, 0],
          ],
        },
      },
      ev: { strike: 0.55 },
    },
    // Federn stieben
    hit: { prog: "flyer.hit", keys: { show: { feathers: [[0, 0.7]] } } },
    // steigt aus Flammen
    spawn: { prog: "flyer.spawn", keys: { show: { rise: [[0, 0.55]] } } },
    // explodiert in Flammen (Ei: schlüpft – die Schale springt auf)
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: {
          blast: [[0.05, 0.55]],
          whole: [[0, 0.3]],
          hatch: [[0.3, 1.01]],
        },
        body: {
          sx: [
            [0, 1],
            [0.15, 1.2],
            [0.3, 0.2],
          ],
          sy: [
            [0, 1],
            [0.15, 1.2],
            [0.3, 0.2],
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
