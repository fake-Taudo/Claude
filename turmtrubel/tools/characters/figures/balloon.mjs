// Ballon – Zwiebelkuppel-Heißluftballon aus Pflaumen-Flicken mit Messingpropeller; im Korb kichert ein Gnom mit
// Riesen-Hörrohr und wuchtet schwere Flossenbomben über den Korbrand (Brief: docs/briefs/balloon.md)
// o.hero: lachsfarbene Hülle, Fallschirm-Ausleger und ein Skelett-Kadett mit Fliegerbrille, der abspringt (balloon-hero).
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
  stitches,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export default function balloon(F, o = {}) {
  const H = !!o.hero;
  const P = F.pal;
  const CLOTH = P.main;
  const ACC = P.acc;
  const WICKER = "#a8763e";
  const GNOME = "#e8b894";
  const BOMB = "#2a2830";
  const BRASS = "#c8a046";
  const CLOTH_D = H ? "#c86a42" : "#5a2a4e";
  const CLOTH_L = H ? "#f8b088" : "#9a5a88";
  const ROPE = "#a8865a";
  const BONE = "#ece4d0";

  F.rig(
    "hover",
    {
      body: [0, -40],
      head: [4, -32],
      hat: [0, -120],
      armB: [-2, -28],
      handB: [-4, -22],
      armF: [9, -28],
      handF: [14, -24],
      prop: [-18, -18],
      trail: [10, -20],
      cadet: [-8, -30],
      chute: [-8, -30],
    },
    { cadet: "body", chute: "cadet" },
  );

  const envelope = path([
    [-8, -50],
    [-20, -60],
    [-30, -78],
    [-30, -96],
    [-22, -110],
    [-10, -118],
    [0, -128, 1],
    [10, -118],
    [22, -110],
    [30, -96],
    [30, -78],
    [20, -60],
    [8, -50],
  ]);

  // ───────── Messingpropeller hinten am Korb ─────────
  F.part("propShaft", { bone: "body", z: 3, zb: 40 }, (g) =>
    g.mat(rrect(-20, -19.4, 8, 2.8, 0.8), "#5a5f6b", "metal", { hi: 0.6 }),
  );
  F.part("propeller", { bone: "prop", z: 3.5, zb: 40.5 }, (g) => {
    g.mat(ellipse(-20, -26, 1.8, 7), BRASS, "gold", { hi: 0.8 });
    g.mat(ellipse(-20, -11, 1.8, 7), BRASS, "gold", { hi: 0.8 });
    g.mat(circle(-20, -18, 1.8), "#8a6a2a", "gold");
  });

  // ───────── Zwiebelkuppel-Hülle aus Flicken (Signature), Wimpelkette (Teamzone) ─────────
  F.part("envelope", { bone: "body", z: 18, zb: 18, sig: true }, (g) => {
    g.mat(envelope, CLOTH, "cloth", { hi: 0.5 });
    g.clipTo(envelope, (h) => {
      for (const [x, y, w, hh, c] of [
        [-26, -100, 14, 16, CLOTH_D],
        [8, -88, 16, 14, CLOTH_L],
        [-14, -74, 12, 12, CLOTH_L],
        [12, -112, 10, 10, CLOTH_D],
      ]) {
        h.mat(rrect(x, y, w, hh, 1), c, "cloth", { line: false });
        h.lod(1, (k) =>
          stitches(
            k,
            [
              [x, y],
              [x + w, y],
              [x + w, y + hh],
              [x, y + hh],
              [x, y],
            ],
            "#3a1a30",
            { step: 2.2, len: 1 },
          ),
        );
      }
      h.lod(1, (k) => {
        for (const pts of [
          [
            [0, -128],
            [-14, -100],
            [-14, -70],
            [-6, -50],
          ],
          [
            [0, -128],
            [14, -100],
            [14, -70],
            [6, -50],
          ],
          [
            [0, -128],
            [0, -50],
          ],
        ])
          k.stroke(spline(pts), CLOTH_D, 0.7);
      });
    });
    g.mat(
      path([
        [-8, -52],
        [8, -52],
        [6, -46],
        [-6, -46],
      ]),
      "#3a2a2a",
      "leather",
      { hi: 0.3 },
    );
  });
  F.part("onionTip", { bone: "hat", z: 18.5, zb: 18.5 }, (g) => {
    g.mat(
      path([
        [-2, -127],
        [0, -134, 1],
        [2, -127],
      ]),
      BRASS,
      "gold",
      { hi: 0.8 },
    );
    g.mat(circle(0, -135, 1.4), BRASS, "gold", { hi: 0.9 });
  });
  F.part("pennants", { bone: "body", z: 19, zb: 19, team: true }, (g) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = -28 + i * 7;
      pts.push([x, -90 + Math.abs(x) * 0.1 + Math.sin((i / 8) * Math.PI) * 6]);
    }
    g.stroke(spline(pts), "#3a2a2a", 0.6);
    for (let i = 0; i < 8; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      g.mat(
        path([
          [x0, y0],
          [x1, y1],
          [(x0 + x1) / 2, (y0 + y1) / 2 + 6, 1],
        ]),
        i % 2 ? P.team : P.teamShade,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
    }
  });
  emblem(F, "emblem", "body", 19.5, -14, -106, 3, { zb: 19.5 });
  F.part("ropes", { bone: "body", z: 17, zb: 17 }, (g) => {
    for (const [a, b] of [
      [
        [-8, -50],
        [-13, -26],
      ],
      [
        [8, -50],
        [13, -26],
      ],
      [
        [-20, -60],
        [-14, -27],
      ],
      [
        [20, -60],
        [14, -27],
      ],
    ])
      g.stroke(polyline([a, b]), ROPE, 0.7);
  });

  // ───────── Korb: Rückwand, Insassen, Vorderwand mit Korbrand (Teamzone) ─────────
  F.part("basketBack", { bone: "body", z: 19.6, zb: 24 }, (g) =>
    g.mat(
      path([
        [-14, -28],
        [14, -28],
        [12, -6, 1],
        [-12, -6, 1],
      ]),
      "#7a5228",
      "wood",
      { hi: 0.2 },
    ),
  );
  // Gnom mit Fliegermütze, langer Nase und Riesen-Hörrohr
  F.part("gnome", { bone: "head", z: 20, zb: 22 }, (g) => {
    g.mat(rrect(-2, -30, 11, 8, 3), "#5a6a8a", "cloth", { hi: 0.3 });
    g.mat(circle(5, -34, 6.4), GNOME, "skin", { hi: 0.3 });
    g.mat(
      path([
        [9, -35],
        [17, -32, 1],
        [10, -31],
      ]),
      "#e09a7a",
      "skin",
      { hi: 0.4 },
    );
  });
  F.part(
    "gnomeFace",
    {
      bone: "head",
      z: 20.5,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      eye(g, 8, -36, {
        r: 1.4,
        iris: "#3a2a22",
        lid: 0.35,
        lidColor: GNOME,
        look: [0.6, 0],
      });
      g.stroke(
        spline([
          [6.6, -30.6],
          [9, -29.8],
          [11, -31],
        ]),
        INK,
        0.7,
      );
      g.fill(rrect(7.6, -30.6, 2, 0.8, 0.2), WHITE, { lod: 1 });
    },
  );
  F.part(
    "gnomeHurt",
    { bone: "head", z: 20.5, view: "front", expr: ["hurt", "stun"] },
    (g) => eyeClosed(g, 8, -36, 1.4, { up: true, lw: 0.7 }),
  );
  F.part(
    "gnomeDead",
    { bone: "head", z: 20.5, view: "front", expr: "death" },
    (g) => eyeX(g, 8, -36, 1.2, INK, 0.7),
  );
  F.part("cap", { bone: "head", z: 20.8, zb: 22.2 }, (g) => {
    g.mat(
      path([
        [-1.4, -35],
        [0, -40],
        [6, -42],
        [11, -39],
        [11, -37],
        [4, -37.4],
        [-1, -32],
      ]),
      "#6b4a2a",
      "leather",
      { hi: 0.4 },
    );
    g.mat(circle(5, -38.6, 1.8), "#9ad8f0", "glass", { line: BRASS, lw: 0.5 });
    // Hörrohr am Ohr
    g.mat(
      path([
        [1, -34],
        [-6, -40],
        [-10, -46, 1],
        [-12, -42],
        [-7, -38],
        [0, -32],
      ]),
      BRASS,
      "gold",
      { hi: 0.8 },
    );
    g.mat(ellipse(-11, -44.4, 2.4, 3.4, 30), "#8a6a2a", "gold");
  });
  if (H) {
    // Skelett-Kadett mit Fliegerbrille (Signature des Helden)
    F.part("cadet", { bone: "cadet", z: 19.8, zb: 21.8, sig: true }, (g) => {
      g.mat(rrect(-12, -30, 8, 7, 2.4), "#4a5a3a", "cloth", { hi: 0.3 });
      g.mat(circle(-8, -34.6, 5), BONE, "bone", { hi: 0.5 });
      g.fill(ellipse(-5.6, -35, 1.4, 1.6), "#2a2622");
      g.fill(rrect(-7, -31.6, 4, 1, 0.3), "#2a2622", { lod: 1 });
      g.mat(rrect(-12, -38.6, 9, 2, 0.8), "#6b4a2a", "leather");
      g.mat(circle(-6, -37.6, 1.8), "#9ad8f0", "glass", {
        line: BRASS,
        lw: 0.5,
      });
      // Salut-Hand
      g.mat(circle(-3, -39, 1.6), BONE, "bone");
    });
    F.part("chutePack", { bone: "cadet", z: 19.7, zb: 21.7 }, (g) =>
      g.mat(rrect(-15, -32, 4, 8, 1.2), "#c8a878", "cloth", { hi: 0.3 }),
    );
    F.part("chute", { bone: "chute", z: 50, zb: 50, state: "chute" }, (g) => {
      g.mat(
        path([
          [-26, -62, 1],
          [-22, -74],
          [-8, -80],
          [6, -74],
          [10, -62, 1],
          [4, -64],
          [-8, -62],
          [-20, -64],
        ]),
        "#f0ece0",
        "cloth",
        { hi: 0.5 },
      );
      g.mat(
        path([
          [-14, -78],
          [-8, -80],
          [-2, -78],
          [-4, -63],
          [-12, -63],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      );
      for (const x of [-24, -8, 8])
        g.stroke(
          polyline([
            [x, -63],
            [-8, -40],
          ]),
          "#8a8070",
          0.4,
        );
    });
    // Fallschirm-Ausleger am Korb
    F.part("boom", { bone: "body", z: 23.6, zb: 18.6 }, (g) => {
      g.stroke(
        polyline([
          [-14, -24],
          [-26, -30],
          [-28, -28],
        ]),
        "#6a4a2a",
        1.4,
      );
      g.stroke(
        polyline([
          [-14, -12],
          [-26, -30],
        ]),
        ROPE,
        0.6,
      );
    });
  }
  F.part("basketFront", { bone: "body", z: 23, zb: 19.8 }, (g) => {
    const b = path([
      [-15, -26],
      [15, -26],
      [12.6, -6, 1],
      [-12.6, -6, 1],
    ]);
    g.mat(b, WICKER, "wood", { hi: 0.4 });
    g.clipTo(b, (h) =>
      h.lod(1, (k) => {
        for (let y = -22; y < -6; y += 3.2)
          k.stroke(
            polyline([
              [-16, y],
              [16, y],
            ]),
            "#7a5228",
            0.6,
          );
        for (let x = -12; x < 14; x += 4)
          k.stroke(
            polyline([
              [x, -26],
              [x * 0.9, -6],
            ]),
            "#7a5228",
            0.5,
          );
      }),
    );
  });
  F.part("rim", { bone: "body", z: 23.5, zb: 23.5, team: true }, (g) =>
    g.mat(rrect(-16, -28, 32, 3.4, 1.4), P.team, "leather", {
      line: P.teamDeep,
      lw: 0.5,
    }),
  );

  // ───────── Arm des Gnoms mit Flossenbombe ─────────
  const bomb = (g, x, y) => {
    g.mat(circle(x, y, 5.4), BOMB, "metal", { hi: 0.8 });
    g.mat(
      path([
        [x - 2, y - 5],
        [x, y - 10],
        [x + 2, y - 5],
      ]),
      "#4a4d58",
      "metal",
    );
    g.mat(
      path([
        [x - 4, y - 7],
        [x - 1, y - 6],
        [x - 2, y - 9.6, 1],
      ]),
      "#4a4d58",
      "metal",
    );
    g.mat(
      path([
        [x + 4, y - 7],
        [x + 1, y - 6],
        [x + 2, y - 9.6, 1],
      ]),
      "#4a4d58",
      "metal",
    );
  };
  F.part("heldBomb", { bone: "handF", z: 24.5, zb: 18, state: "heave" }, (g) =>
    bomb(g, 18, -30),
  );
  F.part("armF", { bone: "armF", z: 24, zb: 18.5 }, (g) => {
    g.mat(limb(9, -28, 14, -25, 1.8, 1.6), "#5a6a8a", "cloth");
    g.mat(circle(14.6, -24.6, 1.8), GNOME, "skin");
  });
  F.part("dropBomb", { bone: "trail", z: 16, zb: 16, state: "drop" }, (g) =>
    bomb(g, 10, -10),
  );
  F.part(
    "hiss",
    { bone: "body", z: 50, state: "hiss", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-30, -92, 4],
        [-36, -98, 3],
        [-40, -90, 2.6],
      ])
        g.fill(circle(x, y, r), "#e8e4f0", { op: 0.7 });
    },
  );

  F.anim({
    // Ballon schaukelt, Propeller dreht, Pilot lauscht (Held: der Kadett klettert auf den Korbrand)
    idle: {
      prog: "hover.idle",
      p: { float: 3, sway: 3, hat: 3 },
      keys: {
        prop: {
          sy: [
            [0, 1],
            [0.125, 0.15],
            [0.25, 1],
            [0.375, 0.15],
            [0.5, 1],
            [0.625, 0.15],
            [0.75, 1],
            [0.875, 0.15],
            [1, 1],
          ],
        },
        head: {
          r: [
            [0, 0],
            [0.3, -10],
            [0.6, -10],
            [0.8, 0],
          ],
        },
        ...(H
          ? {
              cadet: {
                y: [
                  [0, 0],
                  [0.4, -6],
                  [0.7, -6],
                  [1, 0],
                ],
                x: [
                  [0, 0],
                  [0.4, -3],
                  [0.7, -3],
                  [1, 0],
                ],
              },
            }
          : {}),
      },
    },
    // gleitet
    walk: {
      prog: "hover.idle",
      p: { float: 2, sway: 2, hat: 2 },
      keys: {
        body: {
          r: [
            [0, 4],
            [1, 4],
          ],
        },
        prop: {
          sy: [
            [0, 1],
            [0.125, 0.15],
            [0.25, 1],
            [0.375, 0.15],
            [0.5, 1],
            [0.625, 0.15],
            [0.75, 1],
            [0.875, 0.15],
            [1, 1],
          ],
        },
      },
    },
    // Gnom wuchtet eine Bombe über den Korbrand, Ballon hüpft nach oben
    attack: {
      prog: "hover.idle",
      hit: 0.6,
      p: { float: 1, sway: 1 },
      keys: {
        expr: [[0, 1, "attack"]],
        armF: {
          r: [
            [0, 0],
            [0.3, -110, "out"],
            [0.5, -60],
            [0.6, 20, "in"],
            [0.8, 0],
          ],
        },
        trail: {
          y: [
            [0, 0],
            [0.6, 0],
            [1, 40, "in"],
          ],
        },
        root: {
          y: [
            [0, 0],
            [0.6, 0],
            [0.72, -7, "out"],
            [1, 0],
          ],
        },
        show: { heave: [[0.15, 0.6]], drop: [[0.6, 1.01]] },
      },
      ev: { release: 0.6 },
    },
    // Hülle bebt
    hit: {
      prog: "generic.hit",
      keys: {
        body: {
          sx: [
            [0, 1],
            [0.1, 1.04],
            [0.2, 0.97],
            [0.3, 1.03],
            [0.5, 1],
          ],
          sy: [
            [0, 1],
            [0.1, 0.96],
            [0.2, 1.03],
            [0.3, 0.98],
            [0.5, 1],
          ],
        },
      },
    },
    // schwebt herab
    spawn: {
      prog: "still",
      keys: {
        root: {
          y: [
            [0, -30],
            [0.7, 0, "out"],
          ],
        },
        alpha: [
          [0, 0],
          [0.3, 1],
        ],
      },
    },
    // Hülle zischt, er trudelt, die Bombe fällt (Todesschaden)
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        body: {
          r: [
            [0, 0],
            [0.7, 40],
          ],
        },
        root: {
          y: [
            [0, 0],
            [1, 40, "in"],
          ],
        },
        trail: {
          y: [
            [0, 0],
            [0.2, 0],
            [0.7, 46, "in"],
          ],
        },
        show: { hiss: [[0, 0.6]], drop: [[0.2, 1.01]] },
        alpha: [
          [0, 1],
          [0.7, 1],
          [1, 0],
        ],
      },
    },
    ...(H
      ? {
          // Sargkadetten: der Kadett springt mit Fallschirm ab
          ability: {
            prog: "hover.idle",
            hit: 0.5,
            p: { float: 1 },
            keys: {
              expr: [[0, 1, "ability"]],
              cadet: {
                y: [
                  [0, 0],
                  [0.3, -8],
                  [0.5, -8],
                  [1, 34, "in"],
                ],
                x: [
                  [0, 0],
                  [0.3, -4],
                  [0.5, -10],
                  [1, -26],
                ],
                r: [
                  [0, 0],
                  [0.5, -20],
                  [1, 0],
                ],
              },
              show: { chute: [[0.55, 1.01]] },
            },
            ev: { ability: 0.5 },
          },
        }
      : {}),
  });
}
