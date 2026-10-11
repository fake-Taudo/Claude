// Megalakai – grimmiger, schwerer Lakai mit Steinbauch-Panzer (Wasserspeier-Gesicht), Wasserspeier-Hörnern und Sturzfaust
// (Brief: docs/briefs/mega-minion.md)
// o.hero: Visierhelm mit goldenem Heldenstern und Helmbusch, Goldgravur, Faust mit Goldbändern; Fähigkeit Teleport-Sprung.
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
import { eyeClosed, eyeX, lines, rivets, emblem, INK, WHITE } from "../kit.mjs";

export default function megaMinion(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const SKIN = P.main;
  const GLOW = P.acc;
  const STONE = H ? "#b0a8c0" : "#9a96a8";
  const STONE_D = H ? "#7e7690" : "#6e6a80";
  const SKIN_D = H ? "#6e6888" : "#585470";
  const WING = H ? "#5e5878" : "#4e4a66";
  const MOSS = "#6a8a3a";
  const GOLD = "#e8b84a";
  const IRON = "#4a4d58";
  const STEEL = "#9aa2b0";

  F.rig(
    "flyer",
    {
      body: [0, -36],
      head: [7, -58],
      crest: [6, -74],
      jaw: [13, -58],
      wingB: [-12, -56],
      wingF: [-8, -55],
      tail: [-12, -26],
      legB: [-7, -22],
      legF: [7, -22],
      armB: [-14, -52],
      handB: [-19, -32],
      armF: [17, -52],
      handF: [25, -32],
    },
    { armB: "body", handB: "armB", armF: "body", handF: "armF" },
  );

  // ───────── Kleine, schwer arbeitende Flügel ─────────
  const wing = (name, z, col, s) => {
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const X = (x) => x * s;
      const sh = [-8, -56];
      const wr = [X(-20), -70];
      const m = path([
        [...sh, 1],
        [X(-14), -66],
        [...wr, 1],
        [X(-30), -72],
        [X(-36), -68, 1],
        [X(-31), -62],
        [X(-34), -55, 1],
        [X(-26), -55],
        [X(-27), -47, 1],
        [X(-18), -50],
        [X(-14), -46, 1],
      ]);
      g.mat(m, col, "leather", { hi: 0.2 });
      for (const t of [
        [X(-36), -68],
        [X(-34), -55],
        [X(-27), -47],
      ])
        g.stroke(polyline([wr, t]), SKIN_D, 1.2);
      g.stroke(polyline([sh, wr]), SKIN_D, 1.8);
    });
  };
  wing("wingB", 2, "#3e3a56", 0.9);
  wing("wingF", 26, WING, 1);

  F.part("tail", { bone: "tail", z: 3, zb: 40 }, (g) => {
    g.stroke(
      spline([
        [-12, -26],
        [-20, -22],
        [-24, -14],
        [-28, -12],
      ]),
      SKIN,
      3,
    );
    g.mat(
      path([
        [-27, -12],
        [-31, -17, 1],
        [-35, -12],
        [-31, -8, 1],
      ]),
      SKIN_D,
      "skin",
      { hi: 0.4 },
    );
  });
  for (const [name, x, z, col] of [
    ["legB", -7, 5, SKIN_D],
    ["legF", 7, 7, SKIN],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -22, x + 1, -10, 3.4, 2.8), col, "skin");
      g.mat(
        path([
          [x - 3, -11],
          [x + 4, -11.4],
          [x + 7, -7],
          [x + 5, -6.4, 1],
          [x + 3, -8],
          [x + 1, -6, 1],
          [x - 1, -8],
          [x - 3, -6.4, 1],
        ]),
        col,
        "skin",
        { hi: 0.4 },
      );
    });
  }
  // ───────── Hinterer Arm mit Steinfaust ─────────
  F.part("armB", { bone: "armB", z: 8, zb: 38 }, (g) =>
    g.mat(limb(-14, -52, -19, -36, 4, 3.6), SKIN_D, "skin"),
  );
  F.part("handB", { bone: "handB", z: 9, zb: 39 }, (g) =>
    g.mat(
      poly(
        [
          [-25, -37],
          [-13, -37],
          [-12, -26],
          [-18, -23],
          [-25, -27],
        ],
        2.4,
      ),
      STONE_D,
      "stone",
      { hi: 0.4 },
    ),
  );

  // ───────── Schwerer Körper mit Steinbauch-Panzer (Signature: Wasserspeier-Gesicht) ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    g.mat(
      blob(
        [
          [-16, -22],
          [-19, -42],
          [-12, -58],
          [6, -61],
          [19, -54],
          [22, -36],
          [16, -22],
          [0, -18],
        ],
        0.8,
      ),
      SKIN,
      "skin",
      { hi: 0.35 },
    );
  });
  F.part(
    "bellyPlate",
    { bone: "body", z: 19, zb: 19, sig: true, view: "front" },
    (g) => {
      const pl = poly(
        [
          [-6, -54],
          [16, -54],
          [22, -42],
          [18, -24],
          [6, -20],
          [-4, -24],
          [-8, -40],
        ],
        3,
      );
      g.mat(pl, STONE, "stone", { hi: 0.5 });
      g.clipTo(pl, (h) => {
        // Steinfugen mit Moos
        h.stroke(
          polyline([
            [-10, -40],
            [24, -40],
          ]),
          STONE_D,
          1,
        );
        h.stroke(
          polyline([
            [6, -54],
            [6, -40],
          ]),
          STONE_D,
          0.9,
        );
        h.lod(1, (k) => {
          for (const [x, y] of [
            [-2, -40],
            [14, -40.4],
            [6, -47],
          ])
            k.fill(ellipse(x, y, 2, 0.9), MOSS);
          lines(
            k,
            [
              [
                [16, -30],
                [12, -27],
                [14, -24],
              ],
              [
                [-4, -32],
                [-1, -28],
              ],
            ],
            STONE_D,
            0.6,
            1,
          );
        });
        // Wasserspeier-Gesicht
        for (const x of [2, 12]) {
          h.fill(
            path([
              [x - 3, -36],
              [x + 3, -36.6],
              [x + 2, -32.6],
              [x - 2, -32.6],
            ]),
            "#3a3648",
          );
          h.fill(circle(x, -34.4, 0.9), GLOW, { op: 0.8 });
        }
        h.fill(
          path([
            [0, -29],
            [14, -29.4],
            [12, -24],
            [2, -24],
          ]),
          "#3a3648",
        );
        for (const x of [2, 5, 8, 11])
          h.fill(
            poly([
              [x, -29.2],
              [x + 1.4, -26.6],
              [x + 2.8, -29.2],
            ]),
            "#d8d4e0",
          );
      });
      if (H) {
        // Goldgravur: Rankenlinien und Heldenstern
        g.stroke(
          spline([
            [-4, -50],
            [2, -52],
            [8, -50],
            [14, -52],
            [18, -48],
          ]),
          GOLD,
          0.9,
        );
        g.stroke(
          spline([
            [-2, -22.6],
            [6, -21],
            [16, -24],
          ]),
          GOLD,
          0.9,
        );
        g.mat(star(7, -45.4, 3, 1.3, 5), GOLD, "gold", { hi: 0.8 });
      }
    },
  );
  F.part("bellyBack", { bone: "body", z: 19, view: "back" }, (g) =>
    g.mat(
      poly(
        [
          [-14, -54],
          [12, -54],
          [16, -24],
          [-12, -24],
        ],
        3,
      ),
      STONE,
      "stone",
      { hi: 0.4 },
    ),
  );
  emblem(F, "emblem", "body", 20, -12, -38, 2.2, { zb: 20 });

  // ───────── Kopf mit Wasserspeier-Hörnern, grimmig ─────────
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      blob(
        [
          [-2, -62],
          [0, -72],
          [8, -75],
          [17, -71],
          [19, -62],
          [15, -56],
          [4, -55],
        ],
        0.8,
      ),
      SKIN,
      "skin",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [0, -66],
        [-7, -70, 1],
        [0, -62],
      ]),
      SKIN_D,
      "skin",
    );
  });
  if (!H) {
    F.part(
      "face.idle",
      {
        bone: "head",
        z: 31,
        view: "front",
        expr: ["idle", "sleep", "attack", "ability"],
      },
      (g) => {
        for (const [x, r] of [
          [14, 2],
          [7.6, 1.8],
        ]) {
          g.fill(ellipse(x, -66, r, r * 0.8), GLOW, {
            stroke: "#2a2438",
            lw: 0.5,
          });
          g.fill(circle(x + 0.4, -66, r * 0.35), "#fff4c8");
        }
        g.fill(
          path([
            [10, -71],
            [17.4, -68.6],
            [17, -67.4],
            [10.4, -69.4],
          ]),
          SKIN_D,
        );
        g.fill(
          path([
            [5, -69],
            [10, -69.6],
            [9.6, -68.2],
            [5.4, -67.8],
          ]),
          SKIN_D,
        );
      },
    );
  }
  F.part("teeth", { bone: "jaw", z: 32, view: "front" }, (g) => {
    const m = path([
      [8, -61, 1],
      [19, -61.4, 1],
      [18, -57],
      [10, -57],
    ]);
    g.fill(m, "#3a1430", { stroke: INK, lw: 0.6 });
    g.clipTo(m, (h) => {
      h.fill(rrect(8, -61.6, 11, 1.8, 0), WHITE);
      h.fill(rrect(9, -58.4, 9, 1.6, 0), WHITE);
      for (const x of [11, 14, 17])
        h.stroke(
          polyline([
            [x, -61.6],
            [x, -57],
          ]),
          "#9a90a0",
          0.4,
        );
    });
  });
  F.part(
    "face.hurt",
    { bone: "head", z: 31.5, view: "front", expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 14, -66, 1.8, { up: true, lw: 0.9 });
      eyeClosed(g, 7.6, -66, 1.6, { up: true, lw: 0.8 });
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31.5, view: "front", expr: "death" },
    (g) => {
      eyeX(g, 14, -66, 1.6, INK, 0.9);
      eyeX(g, 7.6, -66, 1.4, INK, 0.8);
    },
  );
  const horn = (g, pts, col) => g.mat(path(pts), col, "bone", { hi: 0.6 });
  F.part("horns", { bone: "crest", z: H ? 29 : 33, zb: 33 }, (g) => {
    horn(
      g,
      [
        [1, -72],
        [-4, -80],
        [-12, -84],
        [-18, -82, 1],
        [-11, -80],
        [-6, -76],
        [-3, -70],
      ],
      "#d8d0c0",
    );
    horn(
      g,
      [
        [10, -74],
        [8, -82],
        [3, -88],
        [-2, -89, 1],
        [3, -84],
        [5, -78],
        [6, -73],
      ],
      "#e8e0d0",
    );
  });
  if (H) {
    // Visierhelm mit goldenem Heldenstern (Signature), Helmbusch (Teamzone)
    F.part("helmet", { bone: "head", z: 34, zb: 34, sig: true }, (g) => {
      const hm = path([
        [-3, -61, 1],
        [-2, -72],
        [8, -78],
        [18, -74],
        [21, -64],
        [20, -60, 1],
        [14, -61],
        [4, -60],
      ]);
      g.mat(hm, STEEL, "metal", { hi: 0.9 });
      g.clipTo(hm, (h) => {
        h.fill(rrect(4, -68.6, 20, 4.4, 1), "#1e1c28");
        h.lod(1, (k) =>
          lines(
            k,
            [
              [
                [8, -64],
                [20, -64],
              ],
              [
                [8, -62],
                [20, -62],
              ],
            ],
            "#6a7080",
            0.6,
            1,
          ),
        );
      });
      rivets(
        g,
        [
          [0, -64],
          [2, -70],
        ],
        0.8,
        "#d8dce4",
      );
      g.mat(star(9, -73.6, 3.4, 1.4, 5), GOLD, "gold", { hi: 0.9 });
    });
    F.part(
      "visorEyes",
      {
        bone: "head",
        z: 34.5,
        view: "front",
        expr: ["idle", "sleep", "attack", "ability"],
        glow: true,
      },
      (g) => {
        for (const x of [17, 11])
          g.fill(ellipse(x, -66.4, 1.8, 0.9), "#fff0c0");
      },
    );
    F.part("plume", { bone: "crest", z: 33.6, zb: 33.6, team: true }, (g) => {
      g.mat(
        path([
          [6, -77],
          [2, -86],
          [-6, -92, 1],
          [-14, -90],
          [-8, -86],
          [-14, -84],
          [-4, -80],
          [0, -76],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.5 },
      );
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [2, -82],
              [-6, -88],
            ],
            [
              [0, -79],
              [-8, -84],
            ],
          ],
          P.teamShade,
          0.6,
          1,
        ),
      );
    });
  }

  // ───────── Vorderer Arm mit Armbinde (Teamzone) und Sturzfaust ─────────
  F.part("armF", { bone: "armF", z: 34.6, zb: 6 }, (g) =>
    g.mat(limb(17, -52, 24, -36, 4.6, 4), SKIN, "skin", { hi: 0.35 }),
  );
  F.part("armband", { bone: "armF", z: 34.8, zb: 6.2, team: true }, (g) =>
    g.mat(
      path([
        [14.6, -48],
        [24, -49],
        [24.6, -45],
        [15.4, -44],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.5 },
    ),
  );
  F.part("fist", { bone: "handF", z: 41, zb: 8 }, (g) => {
    g.mat(
      poly(
        [
          [18, -38],
          [32, -38],
          [34, -26],
          [27, -21],
          [18, -25],
        ],
        3,
      ),
      STONE,
      "stone",
      { hi: 0.5 },
    );
    for (const y of [-36.4, -33.6])
      g.mat(rrect(17.4, y, 10, 2, 0.8), H ? GOLD : IRON, H ? "gold" : "metal", {
        hi: 0.8,
      });
    g.lod(1, (h) =>
      lines(
        h,
        [
          [
            [29, -34],
            [33, -33],
          ],
          [
            [28, -29],
            [32.6, -28],
          ],
        ],
        STONE_D,
        0.6,
        1,
      ),
    );
    if (H) g.mat(star(28, -28.6, 2.6, 1.1, 5), GOLD, "gold", { hi: 0.9 });
  });
  if (H) {
    F.part(
      "fistGlow",
      { bone: "handF", z: 42, state: ["ability", "charge"], glow: true },
      (g) => g.fill(circle(26, -30, 10), "#ffffff", { op: 0.6 }),
    );
    F.part(
      "flash",
      { bone: "root", z: 52, zb: 52, state: "flash", glow: true },
      (g) => {
        g.fill(star(0, -40, 40, 8, 4, -90, 2), "#ffffff", { op: 0.9 });
        g.fill(circle(0, -40, 14), "#fff8e0", { op: 0.9 });
      },
    );
  }
  F.part("chips", { bone: "root", z: 50, zb: 50, state: "chips" }, (g) => {
    for (const [x, y, r] of [
      [26, -44, 2],
      [30, -30, 1.6],
      [-22, -40, 1.8],
    ])
      g.mat(
        poly(
          [
            [x - r, y],
            [x, y - r],
            [x + r, y - r * 0.3],
            [x + r * 0.4, y + r],
          ],
          0.3,
        ),
        STONE,
        "stone",
        { hi: 0.5 },
      );
  });

  F.anim({
    // Flügel arbeiten schwer, der Bauch schaukelt (Held: duckt sich in der Luft zum Sprung)
    idle: H
      ? {
          prog: "flyer.idle",
          p: { flaps: 3, flap: 34, lift: 3, tail: 10 },
          keys: {
            body: {
              r: [
                [0, 8],
                [0.5, 12],
                [1, 8],
              ],
            },
            legF: {
              r: [
                [0, -30],
                [1, -30],
              ],
            },
            legB: {
              r: [
                [0, -24],
                [1, -24],
              ],
            },
            armF: {
              r: [
                [0, 20],
                [0.5, 26],
                [1, 20],
              ],
            },
          },
        }
      : {
          prog: "flyer.idle",
          p: { flaps: 3, flap: 36, lift: 3.4, tail: 10, roll: 4 },
          keys: {
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
    // schwerfälliger Flug
    walk: { prog: "flyer.walk", p: { flap: 40, lean: 10, lift: 3 } },
    // Sturzfaust von oben
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
            [0.75, 6],
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
            [0.4, -10],
            [0.55, 18],
            [0.75, 14],
            [1, 0],
          ],
        },
        armF: {
          r: [
            [0, 0],
            [0.4, -150, "out"],
            [0.55, -20, "in"],
            [0.75, -10],
            [1, 0],
          ],
        },
        layer: [
          [0.15, 0.5, "armF", 28.6, 6],
          [0.15, 0.5, "armband", 28.8, 6.2],
          [0.15, 0.5, "fist", 28.9, 8],
        ],
      },
      ev: { strike: 0.55 },
    },
    // Steinsplitter
    hit: { prog: "flyer.hit", keys: { show: { chips: [[0, 0.7]] } } },
    // landet in der Luft mit einem Ruck (Held: erscheint in einem Lichtblitz)
    spawn: H
      ? { prog: "flyer.spawn", keys: { show: { flash: [[0, 0.4]] } } }
      : {
          prog: "flyer.spawn",
          keys: {
            root: {
              y: [
                [0, -12],
                [0.45, 3, "in"],
                [0.6, -1],
                [0.75, 0],
              ],
            },
          },
        },
    // stürzt wie ein Stein
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        root: {
          y: [
            [0, 0],
            [0.6, 50, "in"],
          ],
          r: [
            [0, 0],
            [0.6, 30],
          ],
        },
        wingF: {
          r: [
            [0, 0],
            [0.4, 40],
          ],
        },
        wingB: {
          r: [
            [0, 0],
            [0.4, -30],
          ],
        },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
    ...(H
      ? {
          // Verwundender Sprung: zusammengeduckt, die Faust glüht weiß, dann Teleport im Lichtriss
          ability: {
            prog: "flyer.idle",
            hit: 0.6,
            p: { flaps: 2, flap: 20 },
            keys: {
              expr: [[0, 1, "ability"]],
              body: {
                r: [
                  [0, 0],
                  [0.4, 24],
                ],
                sy: [
                  [0, 1],
                  [0.4, 0.88],
                  [0.58, 0.88],
                  [0.62, 1.1],
                ],
              },
              legF: {
                r: [
                  [0, 0],
                  [0.4, -50],
                ],
              },
              legB: {
                r: [
                  [0, 0],
                  [0.4, -40],
                ],
              },
              armF: {
                r: [
                  [0, 0],
                  [0.4, 40],
                  [0.6, -80],
                ],
              },
              show: { flash: [[0.58, 0.85]] },
              alpha: [
                [0, 1],
                [0.6, 1],
                [0.7, 0],
                [0.85, 0],
                [1, 1],
              ],
            },
            ev: { ability: 0.6 },
          },
        }
      : {}),
  });
}
