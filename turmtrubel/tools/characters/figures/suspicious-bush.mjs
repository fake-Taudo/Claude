// Verdächtiger Busch – verdächtig unschuldiger Busch mit zwei Augenpaaren und großen Schuhen, der zum nächsten Gebäude
// schleicht; am Ziel springen zwei Busch-Kobolde heraus (Brief: docs/briefs/suspicious-bush.md)
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
import { eye, eyeX, lines, emblem, INK, WHITE } from "../kit.mjs";

export default function suspiciousBush(F) {
  const P = F.pal;
  const LEAF = P.main;
  const ACC = P.acc;
  const SHOE = "#6b4a32";
  const LEAF_D = "#2a6a28";
  const LEAF_L = "#5aaa4a";
  const WILT = "#a8a040";
  const GOB = "#86b84f";
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

  F.rig("biped", {
    hip: [0, -12],
    torso: [0, -14],
    head: [0, -30],
    hat: [0, -52],
    back: [-10, -30],
    armB: [-14, -26],
    handB: [-18, -20],
    armF: [14, -26],
    handF: [18, -20],
    prop: [18, -20],
    legB: [-6, -12],
    footB: [-7, -3],
    legF: [6, -12],
    footF: [7, -3],
    cape: [0, -40],
  });

  const leaves = (g, pts, col, s = 1) => {
    for (const [x, y, a] of pts)
      g.mat(
        path([
          [x, y + 3.4 * s],
          [x - 3.2 * s, y - 1],
          [x, y - 5.4 * s, 1],
          [x + 3.2 * s, y - 1],
        ]).rot(a, x, y),
        col,
        "fur",
        { hi: 0.35 },
      );
  };

  // ───────── Große Schuhe mit Schnürsenkeln (Teamzone) ─────────
  const leg = (name, foot, x, z, col) => {
    F.part(name, { bone: name, z, state: LIVE }, (g) =>
      g.mat(limb(x, -14, x * 1.1, -6, 2, 1.8), "#4a3a2a", "cloth"),
    );
    F.part(foot, { bone: foot, z: z + 1, state: LIVE }, (g) => {
      const fx = x * 1.1;
      g.mat(
        path([
          [fx - 6, -7],
          [fx + 4, -8],
          [fx + 13, -4],
          [fx + 14, 0, 1],
          [fx - 7, 0, 1],
        ]),
        col,
        "leather",
        { hi: 0.5 },
      );
      g.mat(rrect(fx - 7, -1.6, 21, 1.6, 0.6), "#3a2a1e", "leather");
    });
    F.part(
      foot + ".laces",
      { bone: foot, z: z + 1.5, team: true, state: LIVE },
      (g) => {
        const fx = x * 1.1;
        g.stroke(
          polyline([
            [fx - 1, -7.4],
            [fx + 4, -5.2],
            [fx, -5],
            [fx + 5, -3],
          ]),
          P.team,
          1,
        );
        g.mat(
          path([
            [fx + 2, -7.6],
            [fx - 2, -11, 1],
            [fx + 1, -8],
          ]),
          P.team,
          "cloth",
          { line: P.teamDeep, lw: 0.3 },
        );
      },
    );
  };
  leg("legB", "footB", -6, 6, "#5a3e2a");
  leg("legF", "footF", 6, 8, SHOE);

  // ───────── Rundlicher Busch mit welken Blättern ─────────
  F.part("bush", { bone: "torso", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob(
      [
        [-22, -16],
        [-24, -32],
        [-16, -48],
        [0, -54],
        [16, -48],
        [24, -32],
        [22, -16],
        [10, -10],
        [-10, -10],
      ],
      0.8,
    );
    g.mat(b, LEAF_D, "fur", { hi: 0.2 });
    leaves(
      g,
      [
        [-18, -18, -30],
        [-10, -14, -10],
        [0, -13, 0],
        [10, -14, 10],
        [18, -18, 30],
        [-20, -30, -50],
        [20, -30, 50],
        [-14, -44, -30],
        [14, -44, 30],
        [0, -50, 0],
        [-6, -38, -10],
        [8, -24, 10],
        [-8, -22, -20],
      ],
      LEAF,
      1.3,
    );
    g.lod(1, (h) =>
      leaves(
        h,
        [
          [-2, -28, 0],
          [12, -36, 20],
          [-14, -32, -20],
          [4, -44, 10],
        ],
        LEAF_L,
        1,
      ),
    );
    g.lod(1, (h) =>
      leaves(
        h,
        [
          [16, -22, 40],
          [-16, -40, -40],
        ],
        WILT,
        0.9,
      ),
    );
  });
  emblem(F, "emblem", "torso", 19, -12, -16, 1.8, { zb: 19, state: LIVE });

  // ───────── Zwei Augenpaare (Signature), die abwechselnd blinzeln ─────────
  const pair = (g, pts, r) => {
    for (const [x, y] of pts) {
      g.fill(ellipse(x, y, r * 1.5, r * 1.3), "#16301a");
      eye(g, x, y, {
        r,
        iris: "#3a2a10",
        irisR: 0.6,
        look: [0.6, 0],
        lid: 0.15,
        lidColor: LEAF,
        lash: false,
      });
    }
  };
  const A = [
    [8, -36],
    [14, -35],
  ];
  const B = [
    [-9, -25],
    [-3, -24.6],
  ];
  F.part(
    "eyes",
    {
      bone: "head",
      z: 20,
      view: "front",
      state: LIVE,
      sig: true,
      expr: ["idle", "sleep", "attack", "ability", "hurt", "stun"],
    },
    (g) => {
      pair(g, A, 2.2);
      pair(g, B, 2);
    },
  );
  F.part(
    "eyes.death",
    { bone: "head", z: 20, view: "front", state: LIVE, expr: "death" },
    (g) => {
      for (const [x, y] of [...A, ...B]) eyeX(g, x, y, 1.4, "#16301a", 0.8);
    },
  );
  const lids = (pts, r) => (g) => {
    for (const [x, y] of pts)
      g.mat(ellipse(x, y, r * 1.5, r * 1.3), LEAF, "fur", { hi: 0.2 });
  };
  F.part(
    "lidsA",
    { bone: "head", z: 20.5, view: "front", state: "blinkA" },
    lids(A, 2.2),
  );
  F.part(
    "lidsB",
    { bone: "head", z: 20.5, view: "front", state: "blinkB" },
    lids(B, 2),
  );
  F.part("berry", { bone: "head", z: 21, zb: 21, state: LIVE, lod: 1 }, (g) => {
    for (const [x, y] of [
      [-14, -46],
      [18, -26],
    ])
      g.fill(circle(x, y, 1.6), ACC, { stroke: "#a88a20", lw: 0.4 });
  });

  // ───────── Kobolde hüpfen heraus, Blätter fallen ─────────
  const goblin = (g, x, y, flip) => {
    g.mat(
      blob(
        [
          [x - 6, y + 2],
          [x - 5, y - 6],
          [x, y - 9],
          [x + 6, y - 6],
          [x + 6, y + 2],
        ],
        0.7,
      ),
      GOB,
      "skin",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [x - 5, y - 4],
        [x - 11 * flip, y - 7, 1],
        [x - 5, y - 1],
      ]),
      "#6a9a3e",
      "skin",
    );
    for (const dx of [-1.6, 2.4]) g.fill(circle(x + dx, y - 4, 1.2), INK);
    g.stroke(
      spline([
        [x - 2, y - 0.6],
        [x + 0.6, y + 0.6],
        [x + 3, y - 0.8],
      ]),
      INK,
      0.6,
    );
  };
  F.part(
    "pop",
    { bone: "root", z: 40, zb: 40, state: ["muzzle", "pop"] },
    (g) => {
      goblin(g, -12, -58, 1);
      goblin(g, 14, -62, -1);
    },
  );
  F.part(
    "leafFall",
    { bone: "root", z: 50, zb: 50, state: ["leaves", "pop"] },
    (g) =>
      leaves(
        g,
        [
          [-26, -40, 40],
          [28, -46, -30],
          [-30, -18, 70],
          [30, -16, 10],
        ],
        LEAF,
        1.1,
      ),
  );
  F.part("pile", { bone: "root", z: 16, zb: 16, state: "pile" }, (g) => {
    g.mat(
      blob(
        [
          [-24, 0],
          [-16, -6],
          [0, -8],
          [16, -6],
          [24, 0],
        ],
        0.8,
      ),
      LEAF_D,
      "fur",
    );
    leaves(
      g,
      [
        [-14, -3, -40],
        [-4, -5, 0],
        [8, -4, 20],
        [18, -2, 60],
      ],
      LEAF,
      1,
    );
  });

  F.anim({
    // Augen blinzeln abwechselnd
    idle: {
      p: { breathe: 0.02, bob: 0.4, sway: 1, tilt: 1 },
      keys: { show: { blinkA: [[0.2, 0.28]], blinkB: [[0.62, 0.7]] } },
    },
    // schleicht auf Zehenspitzen
    walk: {
      p: { stride: 16, bob: 2.2, armSwing: 0, lean: 4 },
      keys: {
        torso: {
          r: [
            [0, -4],
            [0.5, 4],
            [1, -4],
          ],
        },
        show: { blinkA: [[0.4, 0.46]] },
      },
    },
    // Busch springt auf, Kobolde hüpfen heraus
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        torso: {
          sy: [
            [0, 1],
            [0.4, 0.86, "out"],
            [0.55, 1.15, "in"],
            [0.8, 1],
          ],
          sx: [
            [0, 1],
            [0.4, 1.1],
            [0.55, 0.92],
            [0.8, 1],
          ],
        },
        root: {
          y: [
            [0, 0],
            [0.45, 0],
            [0.55, -6, "out"],
            [0.7, 0, "in"],
          ],
        },
        show: { muzzle: [[0.55, 1.01]] },
      },
      ev: { strike: 0.55 },
    },
    // Blätter fallen
    hit: {
      p: { knock: 1.2, recoil: 2 },
      keys: { show: { leaves: [[0, 0.7]] } },
    },
    // wächst aus dem Boden
    spawn: {
      prog: "still",
      keys: {
        torso: {
          sx: [
            [0, 0.3],
            [0.5, 1.1, "out"],
            [0.7, 1],
          ],
          sy: [
            [0, 0.1],
            [0.5, 1.12, "out"],
            [0.7, 1],
          ],
        },
      },
    },
    // Busch fällt auseinander, Kobolde springen heraus
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.2]], pile: [[0.2, 1.01]], pop: [[0.2, 0.8]] },
        alpha: [
          [0, 1],
          [0.7, 1],
          [1, 0],
        ],
      },
    },
  });
}
