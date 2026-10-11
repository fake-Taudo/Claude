// Drachenbaby – verspieltes türkises Drachenkind mit der oberen Eierschale als Mütze, riesigem Kopf und Stummelflügeln
// Evo: Windstoß – Windrad auf der Schale, gefiederte Flügelspitzen, Windbänder am Schwanz (Brief: docs/briefs/baby-dragon.md)
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
import { faceSet, eye, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function babyDragon(F) {
  const P = F.pal;
  const SCALE = P.main;
  const BELLY = P.acc;
  const HORN = "#f0e0c0";
  const MEMB = "#7fd8c8";
  const SCALE_D = "#22887a";
  const SHELL = "#fbf6ea";
  const FIRE = "#ff8a2a";

  F.rig(
    "flyer",
    {
      body: [0, -30],
      head: [8, -46],
      crest: [8, -70],
      jaw: [18, -48],
      wingB: [-6, -38],
      wingF: [-3, -37],
      tail: [-10, -22],
      legB: [-5, -16],
      legF: [5, -16],
      armB: [-6, -30],
      armF: [8, -30],
    },
    { armB: "body", armF: "body" },
  );

  // ───────── Stummelflügel (Evo: gefiederte Spitzen) ─────────
  const wing = (name, z, col, s) => {
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const X = (x) => x * s;
      const sh = [-4, -38];
      const wr = [X(-12), -50];
      g.mat(
        path([
          [...sh, 1],
          [X(-8), -47],
          [...wr, 1],
          [X(-20), -52],
          [X(-24), -46, 1],
          [X(-20), -42],
          [X(-22), -36, 1],
          [X(-15), -37],
          [X(-12), -31, 1],
          [X(-7), -35],
        ]),
        col,
        "leather",
        { hi: 0.3 },
      );
      for (const t of [
        [X(-24), -46],
        [X(-22), -36],
      ])
        g.stroke(polyline([wr, t]), SCALE_D, 1);
      g.stroke(polyline([sh, wr]), SCALE, 1.8);
      g.fill(
        path([
          [wr[0] - X(0.6), wr[1]],
          [wr[0] + X(1), wr[1] - 3.4, 1],
          [wr[0] + X(1.6), wr[1] + 0.4],
        ]),
        HORN,
        { stroke: INK, lw: 0.4 },
      );
    });
    F.part(
      name + ".feathers",
      { bone: name, z: z + 0.2, zb: z + 0.2, evo: "evo" },
      (g) => {
        const X = (x) => x * s;
        for (const [x, y, a] of [
          [-25, -46, -20],
          [-23, -36, 10],
          [-13, -30, 40],
        ])
          g.mat(ellipse(X(x), y, 4, 1.6, a), "#e8fff8", "cloth", {
            hi: 0.5,
            line: "#5ab8a8",
            lw: 0.4,
          });
      },
    );
  };
  wing("wingB", 2, "#5ab8a8", 0.9);
  wing("wingF", 26, MEMB, 1);

  // ───────── Kurzer Schwanz mit Zacken (Evo: Windbänder) ─────────
  F.part("tail", { bone: "tail", z: 3, zb: 40 }, (g) => {
    g.mat(
      path([
        [-8, -26],
        [-16, -22],
        [-22, -14],
        [-26, -12, 1],
        [-21, -18, 1],
        [-15, -18],
        [-8, -18],
      ]),
      SCALE,
      "scale",
      { hi: 0.4 },
    );
    for (const [x, y] of [
      [-12, -24],
      [-17, -21],
    ])
      g.fill(
        path([
          [x - 1.4, y + 0.6],
          [x, y - 2.6, 1],
          [x + 1.4, y + 0.4],
        ]),
        HORN,
        { stroke: INK, lw: 0.4 },
      );
  });
  F.part("windRibbons", { bone: "tail", z: 3.5, zb: 40.5, evo: "evo" }, (g) => {
    g.mat(
      path([
        [-22, -15],
        [-30, -20],
        [-36, -16, 1],
        [-30, -17],
        [-22, -13],
      ]),
      "#e8fff8",
      "cloth",
      { line: "#5ab8a8", lw: 0.4 },
    );
    g.mat(
      path([
        [-24, -13],
        [-32, -10],
        [-37, -12, 1],
        [-31, -8],
        [-24, -11],
      ]),
      "#c8f4ec",
      "cloth",
      { line: "#5ab8a8", lw: 0.4 },
    );
  });

  // ───────── Füßchen, Ärmchen ─────────
  for (const [name, x, z, col] of [
    ["legB", -5, 5, SCALE_D],
    ["legF", 5, 7, SCALE],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -16, x + 1, -8, 2.6, 2.2), col, "scale");
      g.mat(ellipse(x + 2.4, -7, 3.4, 1.8), col, "scale", { hi: 0.4 });
      for (const dx of [4.4, 5.8])
        g.fill(
          path([
            [x + dx - 0.6, -7.6],
            [x + dx + 1.2, -6.6, 1],
            [x + dx - 0.2, -6],
          ]),
          HORN,
        );
    });
  }
  F.part("armB", { bone: "armB", z: 8, zb: 36 }, (g) =>
    g.mat(limb(-6, -30, -9, -24, 1.8, 1.6), SCALE_D, "scale"),
  );

  // ───────── Rundlicher Körper mit Bauchschuppen-Ringen ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = ellipse(0, -28, 13, 14);
    g.mat(b, SCALE, "scale", { hi: 0.4 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(6, -26, 8, 12), BELLY, "skin");
      for (const y of [-34, -29, -24, -19])
        h.stroke(
          spline([
            [0, y],
            [7, y + 1.2],
            [14, y],
          ]),
          "#e8c890",
          0.7,
        );
      h.lod(1, (k) => {
        for (const [x, y] of [
          [-8, -34],
          [-10, -24],
          [-4, -20],
        ])
          k.fill(circle(x, y, 1.1), SCALE_D, { op: 0.6 });
      });
    });
  });
  emblem(F, "emblem", "body", 19, -6, -28, 1.8, { zb: 19 });
  F.part("armF", { bone: "armF", z: 20, zb: 6 }, (g) => {
    g.mat(limb(8, -30, 13, -25, 1.9, 1.7), SCALE, "scale");
    g.mat(circle(13.6, -24.4, 2), SCALE, "scale", { hi: 0.4 });
  });

  // ───────── Lätzchen (Teamzone) mit Rußfleck ─────────
  F.part("bib", { bone: "body", z: 29, zb: 29, team: true }, (g) => {
    const b = path([
      [2, -42],
      [22, -42],
      [18, -34],
      [12, -30, 1],
      [6, -34],
    ]);
    g.mat(b, P.team, "cloth", { line: P.teamDeep, lw: 0.5 });
    g.clipTo(b, (h) =>
      h.lod(1, (k) =>
        k.fill(ellipse(15, -35, 2.6, 1.6), "#3a3a3a", { op: 0.35 }),
      ),
    );
    g.mat(
      blob(
        [
          [0, -43],
          [3, -44.6],
          [4, -41.4],
          [1, -40.6],
        ],
        0.6,
      ),
      P.teamShade,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
  });

  // ───────── Riesiger Kopf: Kinderaugen, Stupsnase, Grinsen mit einem Zahn ─────────
  F.part("horns", { bone: "head", z: 29, zb: 33 }, (g) => {
    g.mat(
      path([
        [-4, -62],
        [-12, -66, 1],
        [-4, -58],
      ]),
      HORN,
      "bone",
      { hi: 0.6 },
    );
    g.mat(
      path([
        [0, -63],
        [-6, -69, 1],
        [1, -59],
      ]),
      HORN,
      "bone",
      { hi: 0.6 },
    );
  });
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    const h0 = blob(
      [
        [-6, -54],
        [-4, -64],
        [6, -70],
        [20, -68],
        [27, -60],
        [31, -53],
        [28, -46],
        [18, -42],
        [4, -42],
      ],
      0.8,
    );
    g.mat(h0, SCALE, "scale", { hi: 0.45 });
    g.clipTo(h0, (h) => h.mat(ellipse(22, -45, 9, 3.6), "#5ccab4", "scale"));
    g.fill(ellipse(26, -51, 2.2, 1.4), "#f08a9a", { op: 0.5, lod: 1 });
  });
  faceSet(F, {
    z: 31,
    eyes: [
      [21, -57, 4.2],
      [11.4, -57.4, 3.8],
    ],
    iris: "#1e5a52",
    lidColor: SCALE,
    lid: 0.05,
    look: [0.4, -0.1],
    irisR: 0.66,
    brow: false,
    mouth: [21, -47.4, 9],
    mood: "smile",
    attackMouth: "oh",
    replace: {
      idle: (g, c) => {
        // schielt nach der Eierschale
        eye(g, c.E1[0], c.E1[1], { ...c.EYE, r: 4.2, look: [0.1, -0.8] });
        eye(g, c.E2[0], c.E2[1], { ...c.EYE, r: 3.8, look: [0.4, -0.8] });
        g.stroke(
          spline([
            [16, -47.6],
            [21, -45.4],
            [26.6, -47.8],
          ]),
          INK,
          0.9,
        );
        g.fill(
          path([
            [19.4, -46.2],
            [20.4, -43.8, 1],
            [21.6, -46],
          ]),
          WHITE,
          { stroke: INK, lw: 0.4 },
        );
      },
    },
  });
  F.part("nostrils", { bone: "head", z: 32.5, view: "front" }, (g) => {
    g.fill(ellipse(28.4, -53.4, 0.8, 0.6), SCALE_D);
    g.fill(ellipse(30, -52.4, 0.7, 0.5), SCALE_D, { lod: 1 });
  });
  F.part(
    "nosePuff",
    { bone: "head", z: 33, state: "smoke", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [33, -56, 2.4],
        [36, -60, 3],
        [34, -65, 2.2],
      ])
        g.fill(circle(x, y, r), "#d8d4d0", { op: 0.75 });
    },
  );
  F.part("headBack", { bone: "head", z: 33.2, view: "back" }, (g) =>
    g.mat(
      blob(
        [
          [-6, -54],
          [-4, -64],
          [6, -70],
          [20, -68],
          [28, -56],
          [18, -42],
          [4, -42],
        ],
        0.8,
      ),
      SCALE,
      "scale",
    ),
  );

  // ───────── Eierschalen-Mütze mit Zackenrand und Punkten (Signature), Evo: Windrad ─────────
  F.part("shell", { bone: "crest", z: 34, zb: 34, sig: true }, (g) => {
    const rim = [];
    for (let i = 0; i <= 10; i++)
      rim.push([-6 + i * 3.4, -67 + (i % 2 ? 3.6 : 0), 1]);
    const sh = path([
      [-7, -67, 1],
      [-6, -76],
      [4, -85],
      [16, -86],
      [26, -79],
      [29, -67, 1],
      ...rim.reverse(),
    ]);
    g.mat(sh, SHELL, "stone", { hi: 0.6 });
    g.clipTo(sh, (h) => {
      for (const [x, y, r] of [
        [2, -76, 2.4],
        [12, -80, 2],
        [20, -74, 2.6],
        [8, -70, 1.6],
      ])
        h.fill(ellipse(x, y, r, r * 0.8), SCALE, { op: 0.8 });
      h.lod(1, (k) =>
        lines(
          k,
          [
            [
              [22, -82],
              [20, -78],
              [23, -76],
            ],
          ],
          "#c8bca0",
          0.6,
          1,
        ),
      );
    });
  });
  F.part("pinwheel", { bone: "crest", z: 34.5, zb: 34.5, evo: "evo" }, (g) => {
    g.stroke(
      polyline([
        [12, -86],
        [12, -94],
      ]),
      "#8a6a4a",
      0.9,
    );
    for (let i = 0; i < 4; i++)
      g.mat(
        path([
          [12, -95],
          [16, -98, 1],
          [14, -94],
        ]).rot(i * 90, 12, -95),
        i % 2 ? "#e8fff8" : P.acc,
        "cloth",
        { line: "#5ab8a8", lw: 0.4 },
      );
    g.fill(circle(12, -95, 0.9), "#c8a046");
  });

  // ───────── Feuerball (Angriff, Schlüpfen) ─────────
  F.part(
    "fireball",
    { bone: "jaw", z: 40, state: "muzzle", glow: true },
    (g) => {
      g.fill(circle(38, -50, 7), FIRE, { op: 0.75 });
      g.fill(circle(38, -50, 3.6), "#fff0b0");
    },
  );
  F.part(
    "hatchFire",
    { bone: "root", z: 52, zb: 52, state: "hatch", glow: true },
    (g) => {
      g.fill(circle(4, -44, 26), FIRE, { op: 0.55 });
      g.fill(circle(4, -44, 14), "#fff0b0", { op: 0.8 });
    },
  );

  F.anim({
    // schielt nach der Eierschale, Schwanz wedelt
    idle: {
      prog: "flyer.idle",
      p: { flaps: 3, flap: 32, lift: 2.4, tail: 18 },
      keys: {
        head: {
          r: [
            [0, 0],
            [0.35, -8],
            [0.65, -8],
            [0.85, 0],
          ],
        },
        show: { smoke: [[0.7, 0.95]] },
      },
      ev: { flap: [0.08, 0.41, 0.75] },
    },
    // flattert, kippelt im Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 38, lean: 8, tail: 20 },
      keys: {
        body: {
          r: [
            [0, 4],
            [0.25, 12],
            [0.5, 4],
            [0.75, 12],
            [1, 4],
          ],
        },
      },
      ev: { flap: [0.08, 0.41, 0.75] },
    },
    // holt Luft (Bauch bläht sich), spuckt Feuerball, hustet Rauch
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -20, strike: 12, jawOpen: 26 },
      keys: {
        body: {
          sx: [
            [0, 1],
            [0.45, 1.14, "out"],
            [0.55, 0.92, "in"],
            [0.7, 1],
          ],
          sy: [
            [0, 1],
            [0.45, 0.9, "out"],
            [0.55, 1.1, "in"],
            [0.7, 1],
          ],
        },
        show: { smoke: [[0.7, 0.95]] },
      },
      ev: { release: 0.55 },
    },
    // Schale rutscht übers Auge
    hit: {
      prog: "flyer.hit",
      keys: {
        crest: {
          x: [
            [0, 0],
            [0.15, 3],
            [0.85, 3],
            [1, 0],
          ],
          y: [
            [0, 0],
            [0.15, 5],
            [0.85, 5],
            [1, 0],
          ],
          r: [
            [0, 0],
            [0.15, 12],
            [0.85, 12],
            [1, 0],
          ],
        },
      },
    },
    // schlüpft aus einem Feuerball
    spawn: { prog: "flyer.spawn", keys: { show: { hatch: [[0, 0.45]] } } },
    // trudelt, die Schale fällt ab
    death: {
      prog: "flyer.death",
      keys: {
        crest: {
          y: [
            [0, 0],
            [0.2, -6],
            [0.8, 26, "in"],
          ],
          x: [
            [0, 0],
            [0.8, -10],
          ],
          r: [
            [0, 0],
            [0.8, -120],
          ],
        },
      },
    },
  });
}
