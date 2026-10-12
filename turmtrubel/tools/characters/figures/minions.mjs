// Lakaien – freche, zappelige Flieger aus dem Lakaien-Labor mit einzelnem Stirnhorn und Pik-Schwanz, spucken glühende Kugeln
// Varianten: 0 = Horn gebogen, 1 = Horn gerade, 2 = Zahnlücke. Evo: zweites Horn, Knochen-Armschienen (Brief: docs/briefs/minions.md)
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
import {
  eyeClosed,
  eyeX,
  eyeSpiral,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export default function minions(F) {
  const P = F.pal;
  const SKIN = P.main;
  const GLOW = P.acc;
  const WING = "#5a3a9a";
  const BELLY = "#a890e0";
  const SKIN_D = "#5e44a0";
  const HORN = "#f0e2c8";
  const BONE = "#e8dcc8";

  F.rig(
    "flyer",
    {
      body: [0, -22],
      head: [4, -34],
      crest: [8, -50],
      jaw: [9, -38],
      wingB: [-4, -32],
      wingF: [-1, -31],
      tail: [-5, -16],
      legB: [-3, -12],
      legF: [3, -12],
      armB: [-3, -29],
      armF: [6, -29],
    },
    { armB: "body", armF: "body" },
  );

  // ───────── Fledermausflügel mit Kerben ─────────
  const wing = (name, z, col, s) => {
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const X = (x) => x * s;
      const sh = [-2, -32];
      const wr = [X(-14), -46];
      const m = path([
        [...sh, 1],
        [X(-8), -42],
        [...wr, 1],
        [X(-24), -50],
        [X(-32), -48, 1],
        [X(-27), -42],
        [X(-30), -36, 1],
        [X(-23), -34],
        [X(-25), -27, 1],
        [X(-17), -28],
        [X(-15), -22, 1],
        [X(-8), -27],
      ]);
      g.mat(m, col, "leather", { hi: 0.2 });
      for (const t of [
        [X(-32), -48],
        [X(-30), -36],
        [X(-25), -27],
      ])
        g.stroke(polyline([wr, t]), SKIN_D, 1);
      g.stroke(polyline([sh, wr]), SKIN_D, 1.4);
      g.lod(1, (h) =>
        h.fill(
          path([
            [X(-21), -34.6],
            [X(-22.6), -32],
            [X(-20), -32.4],
          ]),
          "#2a1a4a",
        ),
      );
    });
  };
  wing("wingB", 2, "#46307a", 0.9);
  wing("wingF", 26, WING, 1);

  // ───────── Langer Schwanz mit Pik-Spitze (Signature) ─────────
  F.part("tail", { bone: "tail", z: 3, zb: 40, sig: true }, (g) => {
    g.stroke(
      spline([
        [-5, -16],
        [-12, -12],
        [-16, -6],
        [-22, -4],
      ]),
      SKIN,
      2.2,
    );
    g.mat(
      path([
        [-21, -4],
        [-26, -9, 1],
        [-31, -5],
        [-28, -2],
        [-30, 1, 1],
        [-24, -1.4],
        [-20, -2.4],
      ]),
      SKIN_D,
      "skin",
      { hi: 0.5 },
    );
  });
  // ───────── Füßchen und Arme ─────────
  for (const [name, x, z] of [
    ["legB", -3, 5],
    ["legF", 3, 7],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -12, x + 1, -5, 1.6, 1.3), SKIN_D, "skin");
      g.mat(ellipse(x + 2, -4, 2.6, 1.4), SKIN_D, "skin", { hi: 0.4 });
    });
  }
  F.part("armB", { bone: "armB", z: 8, zb: 36 }, (g) => {
    g.mat(limb(-3, -29, -6, -22, 1.6, 1.4), SKIN_D, "skin");
    g.mat(circle(-6.4, -21, 1.8), SKIN_D, "skin");
  });

  // ───────── Körper mit Bauchstreifen ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = blob(
      [
        [-7, -14],
        [-8, -26],
        [-3, -34],
        [7, -33],
        [9, -24],
        [6, -13],
      ],
      0.8,
    );
    g.mat(b, SKIN, "skin", { hi: 0.4 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(5, -22, 5, 9), BELLY, "skin");
      for (const y of [-27, -23, -19, -15])
        h.stroke(
          polyline([
            [1, y],
            [10, y],
          ]),
          SKIN_D,
          0.6,
          { lod: 1 },
        );
    });
  });
  emblem(F, "emblem", "body", 19, -3, -22, 1.6, { zb: 19 });
  // Halstuch (Teamzone)
  F.part("kerchief", { bone: "body", z: 20, zb: 20, team: true }, (g) => {
    g.mat(
      path([
        [-4, -35],
        [11, -34],
        [9, -29],
        [5, -22, 1],
        [1.4, -28],
        [-4, -30.6],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
  });

  // ───────── Großer Kopf: glühende Augen, Grinsen mit Hauern ─────────
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      blob(
        [
          [-4, -40],
          [-2, -49],
          [6, -53],
          [14, -50],
          [17, -42],
          [14, -35],
          [4, -33],
          [-2, -35],
        ],
        0.8,
      ),
      SKIN,
      "skin",
      { hi: 0.4 },
    );
    // spitze Ohren
    g.mat(
      path([
        [-2, -45],
        [-10, -50, 1],
        [-3, -41],
      ]),
      SKIN_D,
      "skin",
    );
    g.lod(1, (h) => h.fill(ellipse(15, -40, 1.6, 1), "#c88ad8", { op: 0.6 }));
  });
  const eyesGlow = (g, lid) => {
    for (const [x, r] of [
      [12, 2.6],
      [5.4, 2.3],
    ]) {
      g.fill(ellipse(x, -44, r, r * (1 - lid * 0.5)), GLOW, {
        stroke: "#3a1430",
        lw: 0.5,
      });
      g.fill(circle(x + 0.6, -44, r * 0.38), "#fff4c8");
    }
  };
  F.part(
    "face.idle",
    { bone: "head", z: 31, view: "front", expr: ["idle", "sleep"] },
    (g) => eyesGlow(g, 0),
  );
  F.part(
    "face.attack",
    { bone: "head", z: 31, view: "front", expr: ["attack", "ability"] },
    (g) => eyesGlow(g, 0.6),
  );
  F.part(
    "eyeHalo",
    {
      bone: "head",
      z: 31.2,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
      glow: true,
      lod: 1,
    },
    (g) => {
      for (const [x, r] of [
        [12, 4],
        [5.4, 3.6],
      ])
        g.fill(circle(x, -44, r), GLOW, { op: 0.22 });
    },
  );
  F.part(
    "brows",
    {
      bone: "head",
      z: 31.5,
      view: "front",
      expr: ["idle", "attack", "ability"],
    },
    (g) => {
      g.stroke(
        polyline([
          [9.4, -48.4],
          [14.4, -47.4],
        ]),
        SKIN_D,
        1.2,
      );
      g.stroke(
        polyline([
          [3, -47.6],
          [7.6, -48.2],
        ]),
        SKIN_D,
        1,
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", expr: ["hurt"] },
    (g) => {
      eyeClosed(g, 12, -44, 2.2, { up: true, lw: 0.9 });
      eyeClosed(g, 5.4, -44, 2, { up: true, lw: 0.8 });
    },
  );
  F.part(
    "face.stun",
    { bone: "head", z: 31, view: "front", expr: ["stun"] },
    (g) => {
      eyeSpiral(g, 12, -44, 2.2, INK, 0.6);
      eyeSpiral(g, 5.4, -44, 2, INK, 0.6);
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => {
      eyeX(g, 12, -44, 1.8, INK, 0.9);
      eyeX(g, 5.4, -44, 1.6, INK, 0.8);
    },
  );
  // Grinsen mit Hauern (Variante 2: Zahnlücke)
  const grin = (gap) => (g) => {
    const m = path([
      [4, -39, 1],
      [16, -40, 1],
      [14, -35.6],
      [7, -35.4],
    ]);
    g.fill(m, "#3a1430", { stroke: INK, lw: 0.6 });
    g.clipTo(m, (h) => {
      h.fill(rrect(4, -40.4, 12, 1.6, 0.3), WHITE);
      if (gap) h.fill(rrect(9.4, -40.4, 1.6, 1.8, 0), "#3a1430");
    });
    for (const x of [6, 14])
      g.fill(
        path([
          [x - 1, -36],
          [x, -39.6, 1],
          [x + 1, -36],
        ]),
        WHITE,
        { stroke: INK, lw: 0.4 },
      );
  };
  F.part(
    "grin",
    { bone: "jaw", z: 32, view: "front", variant: [0, 1] },
    grin(false),
  );
  F.part(
    "grinGap",
    { bone: "jaw", z: 32, view: "front", variant: 2 },
    grin(true),
  );
  F.part("headBack", { bone: "head", z: 33, view: "back" }, (g) =>
    g.mat(
      blob(
        [
          [-4, -40],
          [-2, -49],
          [6, -53],
          [14, -50],
          [16, -40],
          [4, -34],
        ],
        0.8,
      ),
      SKIN,
      "skin",
    ),
  );

  // ───────── Stirnhorn (Signature): gebogen bzw. gerade; Evo: zweites, kleineres Horn ─────────
  F.part(
    "horn",
    { bone: "crest", z: 34, zb: 34, sig: true, variant: [0, 2] },
    (g) => {
      g.mat(
        path([
          [6, -50],
          [7, -56],
          [11, -61],
          [16, -63, 1],
          [13, -58],
          [11.6, -53],
          [11, -49.4],
        ]),
        HORN,
        "bone",
        { hi: 0.6 },
      );
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [7.6, -53],
              [11.4, -52.4],
            ],
            [
              [8.6, -56.4],
              [11.6, -55.6],
            ],
          ],
          "#c8b898",
          0.5,
          1,
        ),
      );
    },
  );
  F.part(
    "hornStraight",
    { bone: "crest", z: 34, zb: 34, sig: true, variant: 1 },
    (g) => {
      g.mat(
        path([
          [6, -50],
          [10, -64, 1],
          [11, -49.4],
        ]),
        HORN,
        "bone",
        { hi: 0.6 },
      );
      g.lod(1, (h) =>
        lines(
          h,
          [
            [
              [7, -53],
              [10.6, -53],
            ],
            [
              [7.8, -57],
              [10.4, -57],
            ],
          ],
          "#c8b898",
          0.5,
          1,
        ),
      );
    },
  );
  F.part("horn2", { bone: "crest", z: 33.5, zb: 33.5, evo: "evo" }, (g) =>
    g.mat(
      path([
        [0, -50],
        [-1, -57, 1],
        [4, -51],
      ]),
      HORN,
      "bone",
      { hi: 0.6 },
    ),
  );

  // ───────── Vorderer Arm (zeigt auf Ziele), Evo: Knochen-Armschiene ─────────
  F.part("armF", { bone: "armF", z: 28, zb: 6 }, (g) => {
    g.mat(limb(6, -29, 12, -23, 1.7, 1.5), SKIN, "skin");
    g.mat(circle(12.6, -22.4, 2), SKIN, "skin", { hi: 0.4 });
    g.mat(
      path([
        [13.6, -23.6],
        [16.6, -24.4, 1],
        [14, -22],
      ]),
      SKIN,
      "skin",
    );
  });
  F.part("bracer", { bone: "armF", z: 28.5, zb: 6.5, evo: "evo" }, (g) => {
    g.mat(rrect(7.6, -28.6, 4.4, 4, 1).rot(40, 9.8, -26.6), BONE, "bone", {
      hi: 0.6,
    });
    g.lod(1, (h) =>
      h.stroke(
        polyline([
          [8.6, -28],
          [10.8, -25.4],
        ]),
        "#a89878",
        0.5,
      ),
    );
  });

  // ───────── Spuckkugel, Rauchwölkchen ─────────
  F.part("spit", { bone: "jaw", z: 40, state: "muzzle", glow: true }, (g) => {
    g.fill(circle(22, -38, 6), GLOW, { op: 0.55 });
    g.fill(circle(22, -38, 3.2), "#fff4c8");
  });
  F.part("puff", { bone: "root", z: 50, zb: 50, state: "puff" }, (g) => {
    for (const [x, y, r] of [
      [-10, -24, 7],
      [8, -30, 8],
      [0, -44, 6],
      [-14, -40, 5],
    ])
      g.fill(circle(x, y, r), "#c8c0d8", { op: 0.7 });
  });

  F.anim({
    // flattern, zeigen auf Ziele
    idle: {
      prog: "flyer.idle",
      p: { flaps: 3, flap: 30, lift: 2, tail: 14 },
      keys: {
        armF: {
          r: [
            [0, 0],
            [0.35, -80],
            [0.7, -80],
            [0.9, 0],
          ],
        },
      },
    },
    // wellenförmiger Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 36, lean: 10, tail: 18 },
      keys: {
        root: {
          y: [
            [0, 0],
            [0.25, -3],
            [0.5, 0],
            [0.75, 3],
            [1, 0],
          ],
        },
      },
    },
    // Kopf zurück, spucken eine glühende Kugel
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -24, strike: 12, jawOpen: 18 },
      ev: { release: 0.55 },
    },
    // überschlagen sich
    hit: {
      prog: "flyer.hit",
      keys: {
        body: {
          r: [
            [0, 0],
            [0.6, -360],
            [1, -360],
          ],
        },
      },
    },
    // flattern aus einem Rauchwölkchen
    spawn: { prog: "flyer.spawn", keys: { show: { puff: [[0, 0.6]] } } },
    // trudeln ab und verpuffen
    death: {
      prog: "flyer.death",
      keys: {
        body: {
          r: [
            [0, 0],
            [0.7, 200],
          ],
        },
        show: { puff: [[0.6, 1.01]] },
      },
    },
  });
}
