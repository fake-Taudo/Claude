// Grabkönigin – eisige Herrscherin, deren Körper ein aufrecht stehender, bemalter Sarkophag ist; Knochenarme mit
// Schlangenzepter (Brief: docs/briefs/tomb-queen.md)
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
import { lines, emblem, INK, WHITE } from "../kit.mjs";

export default function tombQueen(F) {
  const P = F.pal;
  const PAINT = P.main;
  const GOLD = P.acc;
  const BONE = "#e8dcc0";
  const DARK = "#0e1418";
  const GLOW = "#9ff0ff";

  F.rig(
    "robe",
    {
      hip: [0, -12],
      skirt: [0, -12],
      torso: [0, -16],
      head: [4, -110],
      hat: [4, -130],
      armB: [-24, -96],
      handB: [-30, -60],
      armF: [28, -96],
      handF: [38, -62],
      prop: [38, -62],
      cape: [0, -120],
      buddy: [0, -60],
      lid: [26, -56],
    },
    { lid: "torso" },
  );

  // ───────── Knochenfüße unter dem Sarkophag ─────────
  F.part("feet", { bone: "skirt", z: 4 }, (g) => {
    for (const x of [-8, 10]) {
      g.mat(limb(x, -12, x + 1, -4, 2.4, 2.2), BONE, "bone");
      g.mat(
        path([
          [x - 3, -4],
          [x + 3, -4.6],
          [x + 9, -1, 1],
          [x + 9, 0, 1],
          [x - 3.6, 0, 1],
        ]),
        BONE,
        "bone",
        { hi: 0.4 },
      );
    }
  });
  // ───────── Hinterer Knochenarm ─────────
  F.part("armB", { bone: "armB", z: 6, zb: 42 }, (g) => {
    g.mat(limb(-24, -96, -26, -78, 3, 2.6), BONE, "bone");
    g.mat(limb(-26, -78, -30, -62, 2.6, 2.4), BONE, "bone");
    g.mat(circle(-26, -78, 3.4), BONE, "bone");
  });
  F.part("handB", { bone: "handB", z: 7, zb: 43 }, (g) => {
    for (const dx of [-3, 0, 3])
      g.mat(limb(-30 + dx * 0.5, -62, -30 + dx, -54, 1.2, 1), BONE, "bone");
  });

  // ───────── Sarkophag (Signature): Kasten, Goldbänder, Schlangen- und Sternmotive ─────────
  const box = path([
    [-22, -100, 1],
    [26, -100, 1],
    [30, -60],
    [22, -12, 1],
    [-18, -12, 1],
    [-26, -60],
  ]);
  F.part("sarcophagus", { bone: "torso", z: 10, zb: 10, sig: true }, (g) => {
    g.mat(
      path([
        [-26, -104, 1],
        [30, -104, 1],
        [34, -60],
        [26, -8, 1],
        [-22, -8, 1],
        [-30, -60],
      ]),
      "#1e4a4a",
      "wood",
    );
  });
  F.part(
    "lid",
    {
      bone: "lid",
      z: 12,
      zb: 12,
      state: [
        "idle",
        "walk",
        "hit",
        "spawn",
        "stun",
        "sleep",
        "charge",
        "ability",
      ],
    },
    (g) => {
      g.mat(box, PAINT, "wood", { hi: 0.5 });
      g.clipTo(box, (h) => {
        for (const y of [-84, -40]) h.fill(rrect(-30, y, 64, 5, 0), GOLD);
        // Schlange und Sterne
        h.lod(1, (k) => {
          k.stroke(
            spline([
              [-14, -76],
              [-6, -70],
              [-12, -62],
              [-4, -54],
              [-10, -46],
            ]),
            "#e8c868",
            1.4,
          );
          for (const [x, y] of [
            [10, -74],
            [16, -64],
            [8, -56],
            [14, -30],
            [-6, -26],
          ])
            k.fill(
              poly(
                [
                  [x, y - 2.4],
                  [x + 0.8, y - 0.8],
                  [x + 2.4, y],
                  [x + 0.8, y + 0.8],
                  [x, y + 2.4],
                  [x - 0.8, y + 0.8],
                  [x - 2.4, y],
                  [x - 0.8, y - 0.8],
                ],
                0.1,
              ),
              "#e8c868",
            );
          // abgeplatzte Farbe
          k.fill(ellipse(18, -20, 4, 2.4), "#8a6a4a", { op: 0.7 });
        });
      });
    },
  );
  F.part(
    "lidOpen",
    { bone: "torso", z: 12, zb: 12, state: ["attack", "death"] },
    (g) => {
      g.fill(box, DARK);
      for (const x of [-4, 10]) g.fill(ellipse(x, -80, 2.6, 1.6), GLOW);
      // aufgeklappter Deckel seitlich
      g.mat(
        path([
          [26, -100, 1],
          [44, -96],
          [48, -58],
          [40, -14, 1],
          [22, -12, 1],
          [30, -60],
        ]),
        PAINT,
        "wood",
        { hi: 0.4 },
      );
      g.stroke(
        polyline([
          [28, -84],
          [46, -80],
        ]),
        GOLD,
        2,
      );
    },
  );
  F.part(
    "peekEyes",
    { bone: "torso", z: 11, glow: true, state: "peek" },
    (g) => {
      for (const x of [-4, 10]) g.fill(ellipse(x, -80, 2.2, 1.2), GLOW);
    },
  );
  F.part("band", { bone: "torso", z: 12.5, zb: 12.5, team: true }, (g) =>
    g.mat(
      path([
        [-28, -64],
        [32, -64],
        [32, -56],
        [-28, -56],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep },
    ),
  );

  // ───────── Kopfende mit bemalter Gesichtsmaske, Schleier (Teamzone) ─────────
  F.part("veil", { bone: "hat", z: 13, zb: 30, team: true }, (g) => {
    g.mat(
      path([
        [-24, -118],
        [-14, -134],
        [8, -140],
        [28, -132],
        [34, -116],
        [36, -96],
        [24, -104],
        [-16, -104],
        [-28, -96],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, hi: 0.4 },
    );
  });
  F.part("mask", { bone: "head", z: 14, zb: 14 }, (g) => {
    g.mat(
      blob(
        [
          [-14, -104],
          [-12, -122],
          [4, -130],
          [20, -122],
          [22, -104],
          [14, -96],
          [-6, -96],
        ],
        0.7,
      ),
      GOLD,
      "gold",
      { hi: 0.9 },
    );
    g.mat(
      blob(
        [
          [-8, -106],
          [-6, -120],
          [4, -124],
          [14, -120],
          [16, -106],
          [10, -100],
          [-2, -100],
        ],
        0.7,
      ),
      "#e8c8a0",
      "skin",
    );
    // lange gemalte Augen
    for (const [x, d] of [
      [0, -1],
      [11, 1],
    ]) {
      g.fill(
        path([
          [x - 4, -112],
          [x, -114.6],
          [x + 4, -112],
          [x + 4 + d * 3, -111],
          [x, -110],
        ]),
        "#1a2a3a",
      );
      g.fill(circle(x, -112.4, 1), "#4ac0c8");
    }
    g.fill(
      path([
        [2, -104],
        [9, -104],
        [5.5, -102],
      ]),
      "#a83a4a",
    );
    g.stroke(
      polyline([
        [-2, -100],
        [12, -100],
      ]),
      "#1a2a3a",
      0.6,
      { lod: 1 },
    );
  });
  F.part("collarBeads", { bone: "torso", z: 14.5, zb: 14.5 }, (g) => {
    for (let i = 0; i < 9; i++) {
      const x = -18 + i * 5;
      g.mat(
        ellipse(x, -96 + Math.abs(i - 4) * 0.8, 2.4, 3),
        i % 2 ? "#4ac0c8" : GOLD,
        "gem",
      );
    }
  });

  // ───────── Vorderer Knochenarm mit Schlangenzepter ─────────
  F.part("scepter", { bone: "prop", z: 38, zb: 4 }, (g) => {
    g.mat(
      path([
        [36, -50, 1],
        [39, -50, 1],
        [44, -116, 1],
        [41, -116, 1],
      ]),
      GOLD,
      "gold",
      { hi: 0.8 },
    );
    g.mat(
      blob(
        [
          [38, -118],
          [44, -126],
          [52, -124],
          [54, -118],
          [46, -114],
        ],
        0.6,
      ),
      "#2a8a6a",
      "gem",
      { hi: 0.6 },
    );
    g.fill(circle(49, -121, 1), "#ffe08a");
    g.stroke(
      polyline([
        [54, -118],
        [58, -116],
        [56, -114],
      ]),
      "#c83a4a",
      0.7,
    );
  });
  F.part("armF", { bone: "armF", z: 29, zb: 6 }, (g) => {
    g.mat(limb(28, -96, 33, -78, 3, 2.6), BONE, "bone");
    g.mat(limb(33, -78, 38, -64, 2.6, 2.4), BONE, "bone");
    g.mat(circle(33, -78, 3.4), BONE, "bone");
  });
  F.part("handF", { bone: "handF", z: 41, zb: 7 }, (g) => {
    g.mat(ellipse(38, -62, 4.4, 3.4), BONE, "bone");
    for (const dx of [-3, 0, 3])
      g.mat(limb(38 + dx, -60, 39 + dx, -56, 1.2, 1), BONE, "bone");
  });
  emblem(F, "emblem", "torso", 13, 2, -24, 3, { zb: 13 });

  F.anim({
    // der Deckel öffnet sich einen Spalt, Augen leuchten
    idle: {
      prog: "still",
      keys: {
        root: {
          y: [
            [0, 0],
            [0.5, -1],
            [1, 0],
          ],
        },
        lid: {
          x: [
            [0, 0],
            [0.5, 0],
            [0.6, 2],
            [0.8, 2],
            [0.9, 0],
          ],
        },
        show: { peek: [[0.6, 0.8]] },
      },
    },
    // ruckelnder Schritt auf Knochenfüßen
    walk: {
      prog: "still",
      keys: {
        root: {
          r: [
            [0, -4],
            [0.25, 0],
            [0.5, 4],
            [0.75, 0],
            [1, -4],
          ],
          y: [
            [0, 0],
            [0.25, -3],
            [0.5, 0],
            [0.75, -3],
            [1, 0],
          ],
        },
      },
      ev: { step: [0.25, 0.75] },
    },
    // Zepter hoch, Schlag, der Deckel klappt auf
    attack: {
      prog: "atk.swing",
      hit: 0.55,
      p: { wind: -150, strike: -40, lean: 4, lunge: 6 },
      ev: { strike: 0.55 },
    },
    // Farbe splittert
    hit: { prog: "generic.hit" },
    // steigt aus der Erde
    spawn: {
      prog: "still",
      keys: {
        root: {
          sy: [
            [0, 0.1],
            [0.8, 1, "out"],
          ],
        },
        alpha: [
          [0, 0],
          [0.4, 1],
        ],
      },
    },
    // Sarkophag kippt um, der Deckel fällt ab
    death: {
      prog: "still",
      keys: {
        root: {
          r: [
            [0, 0],
            [0.45, -88, "in"],
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
