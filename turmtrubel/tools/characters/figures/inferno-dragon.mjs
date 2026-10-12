// Infernodrache – brütender Schmiededrache mit rußroten Schuppen und einem Brennglas in Messingfassung vor dem Maul
// Evo: Schmelz – Doppellinse (Fernrohr), glühende Schuppenkanten, brennende Flügelränder (Brief: docs/briefs/inferno-dragon.md)
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

export default function infernoDragon(F) {
  const P = F.pal;
  const SCALE = P.main;
  const EMBER = P.acc;
  const LENS = "#e8f4ff";
  const BRASS = "#c8a046";
  const SCALE_D = "#3a1a1a";
  const SCALE_L = "#7a3e36";
  const MEMB = "#6e2e2a";
  const BELLY = "#8a4a3a";

  F.rig(
    "flyer",
    {
      body: [0, -44],
      head: [22, -62],
      crest: [18, -74],
      jaw: [30, -58],
      wingB: [-8, -56],
      wingF: [-4, -54],
      tail: [-18, -38],
      legB: [-8, -32],
      legF: [8, -32],
      lens: [44, -62],
    },
    { lens: "head" },
  );

  // ───────── Breite Flügel (Evo: brennende Ränder) ─────────
  const wing = (name, z, col, s) => {
    const X = (x) => x * s;
    const sh = [-4, -56];
    const wr = [X(-26), -82];
    const edge = [
      [X(-62), -82],
      [X(-58), -68],
      [X(-64), -56],
      [X(-50), -56],
      [X(-50), -42],
      [X(-36), -46],
      [X(-24), -38],
    ];
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const m = path([
        [...sh, 1],
        [X(-14), -74],
        [...wr, 1],
        [X(-46), -90],
        [X(-62), -82, 1],
        ...edge.slice(1).map((p, i) => [...p, i % 2 ? 1 : 0]),
        [X(-12), -46],
      ]);
      g.mat(m, col, "leather", { hi: 0.2 });
      for (const t of [
        [X(-62), -82],
        [X(-64), -56],
        [X(-50), -42],
      ])
        g.stroke(polyline([wr, t]), SCALE_D, 1.8);
      g.stroke(polyline([sh, wr]), SCALE, 3);
      g.lod(1, (h) =>
        h.fill(ellipse(X(-40), -66, 3, 2), "#2a1414", { op: 0.5 }),
      );
    });
    F.part(
      name + "Burn",
      { bone: name, z: z + 0.3, zb: z + 0.3, evo: "evo", glow: true },
      (g) => {
        g.stroke(polyline(edge), EMBER, 2.2);
        for (const [x, y] of edge.filter((_, i) => i % 2 === 0))
          g.fill(
            path([
              [x - 2, y],
              [x, y - 6, 1],
              [x + 2, y],
            ]),
            "#ffd060",
            { op: 0.9 },
          );
      },
    );
  };
  wing("wingB", 2, "#4a2020", 0.9);
  wing("wingF", 26, MEMB, 1);

  F.part("tail", { bone: "tail", z: 3, zb: 40 }, (g) => {
    g.mat(
      path([
        [-12, -48],
        [-26, -44],
        [-38, -36],
        [-48, -34],
        [-56, -36, 1],
        [-48, -29],
        [-36, -28],
        [-24, -34],
        [-12, -36],
      ]),
      SCALE,
      "scale",
      { hi: 0.35 },
    );
    for (const [x, y] of [
      [-24, -45],
      [-34, -40],
      [-44, -36],
    ])
      g.fill(
        path([
          [x - 2, y + 1],
          [x, y - 3, 1],
          [x + 2, y + 0.6],
        ]),
        SCALE_D,
      );
  });
  for (const [name, x, z, col] of [
    ["legB", -8, 5, SCALE_D],
    ["legF", 8, 7, SCALE],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -32, x + 2, -20, 4, 3.4), col, "scale");
      g.mat(
        path([
          [x - 2, -21],
          [x + 7, -21.6],
          [x + 10, -17],
          [x + 6, -16.4, 1],
          [x + 3, -18.4],
          [x, -16.6, 1],
        ]),
        col,
        "scale",
        { hi: 0.4 },
      );
    });
  }

  // ───────── Kräftiger Körper mit glühenden Bauchnähten ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = blob(
      [
        [-20, -42],
        [-12, -56],
        [8, -60],
        [22, -52],
        [22, -36],
        [8, -28],
        [-12, -30],
      ],
      0.8,
    );
    g.mat(b, SCALE, "scale", { hi: 0.35 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(8, -34, 15, 7), BELLY, "scale");
      h.lod(1, (k) => {
        for (const [x, y] of [
          [-10, -48],
          [-4, -52],
          [2, -48],
          [-14, -40],
        ])
          k.stroke(
            spline([
              [x - 2.4, y],
              [x, y - 1.6],
              [x + 2.4, y],
            ]),
            SCALE_D,
            0.6,
          );
      });
    });
  });
  F.part("seams", { bone: "body", z: 18.5, zb: 18.5, glow: true }, (g) => {
    for (const x of [0, 6, 12, 18])
      g.stroke(
        polyline([
          [x, -38],
          [x + 1, -29],
        ]),
        EMBER,
        0.9,
        { op: 0.9 },
      );
  });
  F.part(
    "scaleGlow",
    { bone: "body", z: 18.6, zb: 18.6, evo: "evo", glow: true },
    (g) => {
      for (const [x, y] of [
        [-10, -48],
        [-4, -52],
        [2, -48],
        [-14, -40],
        [10, -54],
      ])
        g.stroke(
          spline([
            [x - 2.4, y],
            [x, y - 1.6],
            [x + 2.4, y],
          ]),
          EMBER,
          0.9,
        );
    },
  );
  emblem(F, "emblem", "body", 19, -8, -40, 2.2, { zb: 19 });

  // ───────── Kopf mit kurzem Hals, rauchenden Nüstern ─────────
  F.part("neck", { bone: "body", z: 22, zb: 22 }, (g) =>
    g.mat(
      path([
        [14, -56],
        [22, -66],
        [30, -64],
        [26, -52],
        [18, -46],
      ]),
      SCALE,
      "scale",
      { hi: 0.35 },
    ),
  );
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      path([
        [16, -64],
        [22, -74],
        [32, -74],
        [42, -68],
        [44, -62, 1],
        [36, -60],
        [26, -56],
        [18, -58],
      ]),
      SCALE,
      "scale",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [18, -72],
        [8, -80, 1],
        [16, -70],
      ]),
      SCALE_D,
      "bone",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [22, -74],
        [16, -84, 1],
        [24, -73],
      ]),
      "#4a2a26",
      "bone",
      { hi: 0.4 },
    );
    g.lod(1, (h) =>
      h.stroke(
        spline([
          [24, -62],
          [32, -63],
          [40, -64],
        ]),
        SCALE_D,
        0.6,
      ),
    );
  });
  F.part("jawPart", { bone: "jaw", z: 29.5, zb: 29.6 }, (g) => {
    g.mat(
      path([
        [22, -58],
        [32, -59],
        [42, -61],
        [40, -56, 1],
        [30, -53],
        [22, -54],
      ]),
      BELLY,
      "scale",
      { hi: 0.3 },
    );
    for (const x of [30, 34, 38])
      g.fill(
        path([
          [x, -59.6],
          [x + 1, -57.6, 1],
          [x + 2, -59.8],
        ]),
        WHITE,
        { stroke: INK, lw: 0.3 },
      );
  });
  F.part(
    "eyes",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
      glow: true,
    },
    (g) => {
      g.fill(
        path([
          [27, -69],
          [34, -70.4],
          [33, -68],
          [28, -67.4],
        ]),
        EMBER,
      );
      g.fill(rrect(30, -69.6, 1.4, 1.8, 0.4), "#fff4c8");
    },
  );
  F.part("brow", { bone: "head", z: 31.2, view: "front" }, (g) =>
    g.stroke(
      polyline([
        [26, -71.4],
        [35, -72.4],
      ]),
      SCALE_D,
      1.4,
    ),
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", expr: ["hurt", "stun"] },
    (g) => eyeClosed(g, 30.6, -68.6, 2.6, { up: true, lw: 1 }),
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => eyeX(g, 30.6, -68.6, 2, INK, 1),
  );
  F.part("nostrils", { bone: "head", z: 31.4, view: "front" }, (g) =>
    g.fill(ellipse(41, -66, 1.2, 0.7), "#1a0a0a"),
  );
  F.part(
    "smoke",
    { bone: "head", z: 33, state: ["idle", "walk", "smoke"], outline: false },
    (g) => {
      for (const [x, y, r] of [
        [44, -70, 2],
        [46, -75, 2.6],
        [43, -80, 2.2],
      ])
        g.fill(circle(x, y, r), "#8a8480", { op: 0.6 });
    },
  );

  // ───────── Brennglas in Messingfassung mit Halfter (Signature; Riemen = Teamzone), Evo: Doppellinse ─────────
  F.part("halter", { bone: "head", z: 32, zb: 32, team: true }, (g) => {
    // Wangenriemen unter dem Auge und Nasenriemen um die Schnauze
    g.mat(
      path([
        [18, -64.6],
        [37, -65.8],
        [37, -61],
        [18, -60],
      ]),
      P.team,
      "leather",
      { line: P.teamDeep, lw: 0.4 },
    );
    g.mat(
      path([
        [35.4, -69.6],
        [38.6, -68.8],
        [38.6, -56.6],
        [35.4, -56],
      ]),
      P.team,
      "leather",
      { line: P.teamDeep, lw: 0.4 },
    );
    // Kehlriemen
    g.mat(
      path([
        [17, -67],
        [21.6, -67.4],
        [21, -50.6],
        [16.4, -51.4],
      ]),
      P.teamShade,
      "leather",
      { line: P.teamDeep, lw: 0.4 },
    );
    g.mat(rrect(22, -64.6, 3.6, 3.6, 0.6), BRASS, "gold", { lod: 1 });
  });
  F.part(
    "lens",
    { bone: "lens", z: 34, zb: 34, sig: true, evo: "base" },
    (g) => {
      g.mat(rrect(41, -64, 6, 3, 0.8), BRASS, "gold", { hi: 0.8 });
      g.mat(circle(50, -62, 7.6), BRASS, "gold", { hi: 0.8 });
      g.mat(circle(50, -62, 6), LENS, "glass", { hi: 0.9 });
      g.fill(ellipse(48, -64.6, 2.4, 1.2, -30), "#ffffff", { op: 0.85 });
      g.lod(1, (h) => {
        h.fill(ellipse(52, -59, 2, 1.2, -20), "#5a5050", { op: 0.35 });
        rivets(
          h,
          [
            [50, -69.4],
            [57.4, -62],
            [50, -54.6],
          ],
          0.6,
          "#f0d890",
        );
      });
    },
  );
  F.part(
    "telescope",
    { bone: "lens", z: 34, zb: 34, sig: true, evo: "evo" },
    (g) => {
      g.mat(rrect(41, -65, 8, 5, 1), BRASS, "gold", { hi: 0.8 });
      g.mat(rrect(47, -67, 8, 10, 1.4), BRASS, "gold", { hi: 0.8 });
      g.mat(circle(58, -62, 7.6), BRASS, "gold", { hi: 0.8 });
      g.mat(circle(58, -62, 6), LENS, "glass", { hi: 0.9 });
      g.mat(circle(51, -62, 4.4), LENS, "glass", {
        hi: 0.9,
        line: BRASS,
        lw: 0.8,
      });
      g.fill(ellipse(56, -64.6, 2.4, 1.2, -30), "#ffffff", { op: 0.85 });
    },
  );
  F.part(
    "lensGlow",
    { bone: "lens", z: 35, state: ["attack", "charge"], glow: true },
    (g) => {
      g.fill(circle(52, -62, 7), EMBER, { op: 0.6 });
      g.fill(circle(52, -62, 3.4), "#fff4c8");
    },
  );
  F.part("beam", { bone: "lens", z: 36, state: "muzzle", glow: true }, (g) => {
    g.fill(
      path([
        [54, -64],
        [96, -66],
        [96, -58],
        [54, -60],
      ]),
      EMBER,
      { op: 0.7 },
    );
    g.fill(
      path([
        [54, -62.6],
        [96, -63],
        [96, -61],
        [54, -61.4],
      ]),
      "#fff4c8",
    );
  });
  F.part("shards", { bone: "root", z: 50, zb: 50, state: "shatter" }, (g) => {
    for (const [x, y, a] of [
      [58, -70, 20],
      [62, -58, -30],
      [52, -50, 50],
      [66, -64, 80],
    ]) {
      const s = poly([
        [x - 2.4, y],
        [x, y - 3.4],
        [x + 2.4, y - 0.6],
      ]).rot(a, x, y);
      g.fill(s, LENS, { op: 0.8 });
      g.stroke(s, "#8ab0c8", 0.5);
    }
  });
  F.part(
    "embers",
    { bone: "root", z: 51, zb: 51, state: "embers", glow: true },
    (g) => {
      for (const [x, y, r] of [
        [-10, -40, 10],
        [14, -52, 12],
        [30, -66, 8],
        [0, -26, 7],
      ])
        g.fill(circle(x, y, r), EMBER, { op: 0.45 });
    },
  );

  F.anim({
    // Rauch aus den Nüstern, die Linse glänzt
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 22, lift: 2.4, tail: 8 },
      keys: {
        lens: {
          r: [
            [0, 0],
            [0.5, 2],
            [1, 0],
          ],
        },
      },
    },
    // schwerer Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 28, lean: 8, tail: 10, lift: 3 },
      ev: { flap: [0.1, 0.43, 0.76] },
    },
    // Linse ausrichten, Strahl; die Linse glüht heller
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -10, strike: 6, jawOpen: 10 },
      keys: {
        lens: {
          r: [
            [0, 0],
            [0.3, -6],
            [0.45, 4],
            [0.55, 0],
          ],
        },
      },
      ev: { release: 0.55 },
    },
    // Linse wackelt
    hit: {
      prog: "flyer.hit",
      keys: {
        lens: {
          r: [
            [0, 0],
            [0.12, 14],
            [0.3, -10],
            [0.5, 6],
            [0.7, 0],
          ],
        },
      },
    },
    // erscheint aus Glut
    spawn: { prog: "flyer.spawn", keys: { show: { embers: [[0, 0.5]] } } },
    // Linse zerspringt, er stürzt
    death: {
      prog: "flyer.death",
      keys: {
        show: { shatter: [[0.1, 0.7]] },
        lens: {
          sx: [
            [0, 1],
            [0.1, 0],
          ],
          sy: [
            [0, 1],
            [0.1, 0],
          ],
        },
      },
    },
  });
}
