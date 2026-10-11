// Minion Giant – träger, verfressener Laborriese mit genähten Flügeln, Ohrmarke und grünem Kehlsack, der sich vor dem
// Spucken wie ein Ballon aufbläht (Brief: docs/briefs/minion-giant.md)
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
  eye,
  eyeClosed,
  eyeX,
  stitches,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export default function minionGiant(F) {
  const P = F.pal;
  const SKIN = P.main;
  const SAC = P.acc;
  const SEAM = "#2a2a30";
  const SKIN_L = "#8e3c92";
  const SKIN_D = "#4a1050";
  const WING = "#56205a";
  const SAC_D = "#8acc3a";

  F.rig(
    "flyer",
    {
      body: [0, -50],
      head: [12, -90],
      crest: [4, -108],
      jaw: [22, -86],
      wingB: [-16, -94],
      wingF: [-10, -92],
      tail: [-20, -34],
      legB: [-10, -26],
      legF: [10, -26],
      armB: [-22, -78],
      handB: [-28, -54],
      armF: [18, -74],
      handF: [28, -50],
      sac: [24, -82],
    },
    { armB: "body", handB: "armB", armF: "body", handF: "armF", sac: "head" },
  );

  // ───────── Genähte Flügel mit Flicken ─────────
  const wing = (name, z, col, s) => {
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const X = (x) => x * s;
      const sh = [-10, -94];
      const wr = [X(-30), -116];
      const m = path([
        [...sh, 1],
        [X(-20), -110],
        [...wr, 1],
        [X(-46), -120],
        [X(-58), -114, 1],
        [X(-50), -104],
        [X(-56), -92, 1],
        [X(-44), -92],
        [X(-46), -78, 1],
        [X(-32), -84],
        [X(-24), -74, 1],
        [X(-16), -84],
      ]);
      g.mat(m, col, "leather", { hi: 0.2 });
      g.clipTo(m, (h) => {
        h.mat(rrect(X(-48), -104, X(12), 9, 1), "#6e3072", "leather");
        h.lod(1, (k) => {
          stitches(
            k,
            [
              [X(-48), -104],
              [X(-36), -104],
              [X(-36), -95],
              [X(-48), -95],
              [X(-48), -104],
            ],
            SEAM,
            { step: 2, len: 1 },
          );
          stitches(
            k,
            [
              [X(-24), -110],
              [X(-30), -96],
              [X(-34), -82],
            ],
            SEAM,
            { step: 2.2, len: 1.2 },
          );
        });
      });
      for (const t of [
        [X(-58), -114],
        [X(-56), -92],
        [X(-46), -78],
      ])
        g.stroke(polyline([wr, t]), SKIN_D, 1.6);
      g.stroke(polyline([sh, wr]), SKIN_D, 2.4);
    });
  };
  wing("wingB", 2, "#3e1442", 0.9);
  wing("wingF", 26, WING, 1);

  F.part("tail", { bone: "tail", z: 3, zb: 40 }, (g) => {
    g.stroke(
      spline([
        [-20, -34],
        [-30, -28],
        [-36, -18],
        [-42, -16],
      ]),
      SKIN,
      4,
    );
    g.mat(
      path([
        [-41, -16],
        [-46, -23, 1],
        [-52, -16],
        [-46, -10, 1],
      ]),
      SKIN_D,
      "skin",
      { hi: 0.4 },
    );
  });
  for (const [name, x, z, col] of [
    ["legB", -10, 5, SKIN_D],
    ["legF", 10, 7, SKIN],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -26, x + 1, -12, 5, 4.2), col, "skin");
      g.mat(
        path([
          [x - 4, -13],
          [x + 6, -13.6],
          [x + 10, -8],
          [x + 7, -7, 1],
          [x + 4, -9.4],
          [x + 1, -6.6, 1],
          [x - 2, -9],
          [x - 4.6, -7, 1],
        ]),
        col,
        "skin",
        { hi: 0.4 },
      );
    });
  }
  F.part("armB", { bone: "armB", z: 8, zb: 38 }, (g) => {
    g.mat(limb(-22, -78, -28, -58, 5.4, 4.6), SKIN_D, "skin");
    g.mat(circle(-28.6, -54, 5), SKIN_D, "skin", { hi: 0.4 });
  });

  // ───────── Birnenförmiger Körper mit Bauch, Nahtflicken ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = blob(
      [
        [-26, -24],
        [-33, -54],
        [-24, -84],
        [-6, -96],
        [14, -92],
        [27, -70],
        [29, -42],
        [18, -22],
        [0, -17],
      ],
      0.8,
    );
    g.mat(b, SKIN, "skin", { hi: 0.35 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(14, -46, 15, 24), SKIN_L, "skin");
      h.lod(1, (k) => {
        for (const y of [-62, -52, -42, -32])
          k.stroke(
            spline([
              [2, y],
              [14, y + 1.6],
              [28, y],
            ]),
            SKIN,
            0.7,
          );
        k.mat(rrect(-20, -60, 10, 9, 1.4), "#7a2a7e", "leather");
        stitches(
          k,
          [
            [-20, -60],
            [-10, -60],
            [-10, -51],
            [-20, -51],
            [-20, -60],
          ],
          SEAM,
          { step: 2, len: 1 },
        );
      });
    });
  });
  emblem(F, "emblem", "body", 19, -16, -36, 2.6, { zb: 19 });

  // ───────── Kopf: hängende Lider, Doppelkinn, sabbernder Mund; Ohr mit Ohrmarke (Teamzone) ─────────
  F.part("ear", { bone: "head", z: 29, zb: 31 }, (g) =>
    g.mat(
      path([
        [0, -100],
        [-12, -110, 1],
        [-3, -94],
      ]),
      SKIN_D,
      "skin",
      { hi: 0.3 },
    ),
  );
  F.part("earTag", { bone: "head", z: 29.5, zb: 31.5, team: true }, (g) => {
    g.mat(circle(-5, -101, 1), "#c8ccd2", "metal");
    g.mat(rrect(-8, -100, 6.4, 7, 1.2), P.team, "leather", {
      line: P.teamDeep,
      lw: 0.5,
    });
    g.fill(rrect(-6.8, -97, 4, 1, 0.3), P.teamDeep, { lod: 1 });
  });
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      blob(
        [
          [0, -94],
          [2, -108],
          [14, -115],
          [27, -110],
          [31, -98],
          [28, -88],
          [14, -84],
          [3, -86],
        ],
        0.8,
      ),
      SKIN,
      "skin",
      { hi: 0.35 },
    );
    // Doppelkinn
    g.mat(
      path([
        [8, -86],
        [18, -82],
        [28, -86],
        [24, -80, 1],
        [12, -79, 1],
      ]),
      SKIN_L,
      "skin",
      { hi: 0.3 },
    );
    g.lod(1, (h) =>
      h.stroke(
        spline([
          [10, -82.6],
          [18, -80.6],
          [26, -83],
        ]),
        SKIN_D,
        0.7,
      ),
    );
  });
  F.part(
    "face.idle",
    { bone: "head", z: 31, view: "front", expr: ["idle", "sleep"] },
    (g) => {
      eye(g, 24, -102, {
        r: 3,
        iris: "#c8ff6b",
        lid: 0.6,
        lidColor: SKIN,
        look: [0.4, 0.3],
      });
      eye(g, 15.6, -102.4, {
        r: 2.8,
        iris: "#c8ff6b",
        lid: 0.6,
        lidColor: SKIN,
        look: [0.4, 0.3],
      });
    },
  );
  F.part(
    "face.attack",
    { bone: "head", z: 31, view: "front", expr: ["attack", "ability"] },
    (g) => {
      eye(g, 24, -102, {
        r: 3.2,
        iris: "#c8ff6b",
        lid: 0.3,
        lidColor: SKIN,
        look: [0.8, 0],
      });
      eye(g, 15.6, -102.4, {
        r: 3,
        iris: "#c8ff6b",
        lid: 0.3,
        lidColor: SKIN,
        look: [0.8, 0],
      });
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 24, -102, 2.6, { up: true, lw: 1 });
      eyeClosed(g, 15.6, -102.4, 2.4, { up: true, lw: 0.9 });
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => {
      eyeX(g, 24, -102, 2.2, INK, 1);
      eyeX(g, 15.6, -102.4, 2, INK, 0.9);
    },
  );
  F.part("mouth", { bone: "jaw", z: 32, view: "front" }, (g) => {
    const m = path([
      [16, -92, 1],
      [30, -93, 1],
      [28, -87],
      [19, -87],
    ]);
    g.fill(m, "#3a1430", { stroke: INK, lw: 0.7 });
    g.clipTo(m, (h) => {
      h.fill(ellipse(24, -86.6, 5, 2.4), "#e0656e");
      h.fill(rrect(18, -93, 3, 2, 0.4), WHITE);
      h.fill(rrect(25, -93, 3, 2.2, 0.4), WHITE);
    });
    // Sabber
    g.mat(
      path([
        [27, -88],
        [28, -82, 1],
        [26.4, -84],
        [26, -88],
      ]),
      "#d8ffb0",
      "glass",
      { hi: 0.8, lod: 1 },
    );
  });
  F.part("headBack", { bone: "head", z: 33, view: "back" }, (g) =>
    g.mat(
      blob(
        [
          [0, -94],
          [2, -108],
          [14, -115],
          [27, -110],
          [30, -96],
          [14, -84],
          [3, -86],
        ],
        0.8,
      ),
      SKIN,
      "skin",
    ),
  );

  // ───────── Kehlsack (Signature): bläht sich vor dem Spucken auf ─────────
  F.part("sac", { bone: "sac", z: 36, zb: 29, sig: true }, (g) => {
    const s = ellipse(27, -76, 9.4, 7.6);
    g.mat(s, SAC, "glass", { hi: 0.9 });
    g.clipTo(s, (h) =>
      h.lod(1, (k) =>
        lines(
          k,
          [
            [
              [21, -78],
              [25, -74],
              [24, -70],
            ],
            [
              [30, -80],
              [32, -74],
            ],
          ],
          SAC_D,
          0.6,
          1,
        ),
      ),
    );
    g.fill(ellipse(24, -79, 2.6, 1.4, -30), "#ffffff", { op: 0.6 });
  });

  // ───────── Vorderer Arm mit Armbinde (Teamzone) ─────────
  F.part("armF", { bone: "armF", z: 34.6, zb: 6 }, (g) =>
    g.mat(limb(18, -74, 27, -54, 5.8, 5), SKIN, "skin", { hi: 0.35 }),
  );
  F.part("armband", { bone: "armF", z: 34.8, zb: 6.2, team: true }, (g) =>
    g.mat(
      path([
        [14.6, -68],
        [25.4, -69.4],
        [26.2, -64.6],
        [15.6, -63.4],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.5 },
    ),
  );
  F.part("handF", { bone: "handF", z: 41, zb: 8 }, (g) => {
    g.mat(circle(28, -50, 5.4), SKIN, "skin", { hi: 0.4 });
    for (const [x, y] of [
      [31, -46],
      [28, -45],
      [25, -46],
    ])
      g.fill(
        path([
          [x - 1, y],
          [x, y + 3, 1],
          [x + 1, y],
        ]),
        "#f0e2c8",
        { stroke: INK, lw: 0.4 },
      );
  });

  // ───────── Giftspucke, Zischen, Platzen ─────────
  F.part("spit", { bone: "jaw", z: 42, state: "muzzle", glow: true }, (g) => {
    g.fill(
      blob(
        [
          [34, -96],
          [42, -98],
          [46, -92],
          [42, -86],
          [34, -88],
        ],
        0.7,
      ),
      SAC,
      { op: 0.8 },
    );
    for (const [x, y, r] of [
      [48, -98, 1.6],
      [50, -90, 1.2],
    ])
      g.fill(circle(x, y, r), SAC, { op: 0.8 });
  });
  F.part(
    "hiss",
    { bone: "root", z: 50, zb: 50, state: "hiss", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [34, -80, 4],
        [40, -86, 3.4],
        [44, -78, 3],
      ])
        g.fill(circle(x, y, r), "#e0ffc0", { op: 0.6 });
    },
  );
  F.part(
    "burst",
    { bone: "root", z: 51, zb: 51, state: "burst", glow: true },
    (g) => {
      for (const [x, y, r] of [
        [24, -80, 12],
        [36, -90, 6],
        [14, -70, 6],
        [34, -66, 5],
      ])
        g.fill(circle(x, y, r), SAC, { op: 0.6 });
    },
  );

  F.anim({
    // Kehlsack bläht sich langsam
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 24, lift: 3, tail: 8, roll: 3 },
      keys: {
        sac: {
          sx: [
            [0, 1],
            [0.5, 1.25],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.5, 1.2],
            [1, 1],
          ],
        },
      },
    },
    // schwerfälliger Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 30, lean: 6, lift: 3 },
      keys: {
        sac: {
          sx: [
            [0, 1],
            [0.5, 1.08],
            [1, 1],
          ],
        },
      },
    },
    // Kehlsack bläht sich auf, Giftspucke im Bogen
    attack: {
      prog: "flyer.idle",
      hit: 0.6,
      p: { flaps: 2, flap: 22 },
      keys: {
        expr: [[0, 1, "attack"]],
        sac: {
          sx: [
            [0, 1],
            [0.5, 1.7, "out"],
            [0.6, 0.9, "in"],
            [0.8, 1],
          ],
          sy: [
            [0, 1],
            [0.5, 1.6, "out"],
            [0.6, 0.9, "in"],
            [0.8, 1],
          ],
        },
        head: {
          r: [
            [0, 0],
            [0.5, -14],
            [0.6, 10, "in"],
            [0.8, 6],
            [1, 0],
          ],
        },
        jaw: {
          r: [
            [0, 0],
            [0.55, 0],
            [0.6, 20],
            [0.8, 16],
            [1, 0],
          ],
        },
        show: { muzzle: [[0.6, 0.8]] },
      },
      ev: { release: 0.6 },
    },
    // Kehlsack zischt
    hit: {
      prog: "flyer.hit",
      keys: {
        sac: {
          sx: [
            [0, 1],
            [0.2, 0.8],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.2, 0.8],
            [1, 1],
          ],
        },
        show: { hiss: [[0, 0.7]] },
      },
    },
    // plumpst in die Luft
    spawn: {
      prog: "flyer.spawn",
      keys: {
        root: {
          y: [
            [0, -10],
            [0.4, 4, "in"],
            [0.6, 0],
          ],
        },
      },
    },
    // Kehlsack platzt, er sinkt
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        sac: {
          sx: [
            [0, 1],
            [0.15, 1.6],
            [0.2, 0.4],
          ],
          sy: [
            [0, 1],
            [0.15, 1.6],
            [0.2, 0.4],
          ],
        },
        show: { burst: [[0.18, 0.5]] },
        root: {
          y: [
            [0.2, 0],
            [1, 40, "in"],
          ],
          r: [
            [0.2, 0],
            [1, -20],
          ],
        },
        wingF: {
          r: [
            [0, 0],
            [0.6, 30],
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
