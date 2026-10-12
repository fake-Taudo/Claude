// Königsgeist – melancholische, leere Ritterrüstung aus Helm und Brustpanzer, über der eine kleine Krone schwebt;
// Geisterschweif statt Beinen, Geistersäbel mit Goldkorb. Evo: Seelen – Krone mit drei Juwelen, leuchtende
// Rüstungskanten, langer Geisterumhang (Brief: docs/briefs/royal-ghost.md)
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
import { lines, rivets, emblem, INK, WHITE } from "../kit.mjs";

export default function royalGhost(F) {
  const P = F.pal;
  const MIST = P.main;
  const GOLD = P.acc;
  const ARMOR = "#b8c8c0";
  const ARMOR_D = "#7a8a86";
  const MIST_D = "#5ab0a0";
  const MIST_L = "#e0fff8";
  const RUST = "#a87a5a";

  F.rig("hover", {
    body: [0, -44],
    head: [4, -64],
    hat: [4, -86],
    armB: [-12, -58],
    handB: [-16, -42],
    armF: [14, -58],
    handF: [22, -44],
    prop: [22, -44],
    trail: [0, -30],
  });

  // ───────── Evo: langer Geisterumhang ─────────
  F.part("ghostCloak", { bone: "body", z: 2, zb: 44, evo: "evo" }, (g) => {
    g.mat(
      path([
        [-10, -60],
        [-20, -56],
        [-30, -40],
        [-36, -20],
        [-30, -12, 1],
        [-24, -18],
        [-20, -8, 1],
        [-14, -20],
        [-6, -40],
      ]),
      "#7ad8c8",
      "glass",
      { hi: 0.4, line: false },
    );
    g.lod(1, (h) =>
      lines(
        h,
        [
          [
            [-14, -54],
            [-24, -30],
          ],
          [
            [-10, -50],
            [-16, -24],
          ],
        ],
        MIST_L,
        0.6,
        1,
      ),
    );
  });
  // ───────── Zerfetzter Umhang (Teamzone) ─────────
  F.part("capeRags", { bone: "body", z: 3, zb: 45, team: true }, (g) => {
    g.mat(
      path([
        [-8, -63],
        [-18, -59],
        [-25, -46],
        [-24, -32, 1],
        [-19, -39],
        [-17, -27, 1],
        [-12, -36],
        [-9, -30, 1],
        [-5, -42],
        [-3, -52],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.5 },
    );
    g.lod(1, (h) => h.fill(circle(-15, -50, 1.4), P.teamDeep));
  });

  // ───────── Geisterschweif statt Beinen ─────────
  F.part("tail", { bone: "trail", z: 4, zb: 40 }, (g) => {
    g.mat(
      path([
        [-12, -36],
        [-10, -22],
        [-14, -12],
        [-6, -14],
        [-4, -4, 1],
        [2, -12],
        [6, -6, 1],
        [8, -16],
        [12, -24],
        [12, -36],
      ]),
      MIST,
      "glass",
      { hi: 0.5, line: false },
    );
    g.lod(1, (h) =>
      lines(
        h,
        [
          [
            [-6, -30],
            [-4, -20],
            [-6, -14],
          ],
          [
            [4, -30],
            [6, -20],
          ],
        ],
        MIST_L,
        0.7,
        1,
      ),
    );
  });
  F.part("armB", { bone: "armB", z: 8, zb: 36 }, (g) => {
    g.mat(limb(-12, -58, -16, -44, 3.4, 3), ARMOR_D, "metal", { hi: 0.5 });
    g.mat(circle(-16.4, -42, 3), MIST_D, "glass");
  });

  // ───────── Brustpanzer mit Riemen, Rostspuren; Evo: leuchtende Kanten ─────────
  F.part("cuirass", { bone: "body", z: 18, zb: 18 }, (g) => {
    const c = path([
      [-14, -64, 1],
      [16, -64, 1],
      [18, -52],
      [14, -36],
      [0, -32],
      [-14, -36],
      [-17, -52],
    ]);
    g.mat(c, ARMOR, "metal", { hi: 0.8 });
    g.clipTo(c, (h) => {
      h.stroke(
        polyline([
          [1, -64],
          [1, -32],
        ]),
        ARMOR_D,
        0.9,
      );
      h.lod(1, (k) => {
        k.fill(ellipse(-8, -40, 3, 1.6), RUST, { op: 0.6 });
        k.fill(ellipse(10, -54, 2, 1.2), RUST, { op: 0.5 });
      });
    });
    g.mat(rrect(-16, -40, 33, 3.4, 1), "#5a4a3a", "leather", { hi: 0.3 });
    g.mat(rrect(-1, -41, 4, 5.4, 0.8), GOLD, "gold", { hi: 0.8 });
    rivets(
      g,
      [
        [-12, -60],
        [14, -60],
      ],
      1,
      "#e0e8e4",
    );
  });
  F.part(
    "cuirassGlow",
    { bone: "body", z: 18.5, zb: 18.5, evo: "evo", glow: true },
    (g) => {
      g.stroke(
        path([
          [-14, -64, 1],
          [16, -64, 1],
          [18, -52],
          [14, -36],
          [0, -32],
          [-14, -36],
          [-17, -52],
        ]),
        MIST_L,
        1,
      );
    },
  );
  // Nebel, der aus dem leeren Halsausschnitt quillt
  F.part("neckMist", { bone: "body", z: 19, zb: 19, outline: false }, (g) => {
    for (const [x, y, r] of [
      [-2, -64, 4],
      [5, -66, 4.4],
      [10, -63, 3],
    ])
      g.fill(circle(x, y, r), MIST_L, { op: 0.7 });
  });
  emblem(F, "emblem", "body", 20, -8, -50, 2, { zb: 20 });

  // ───────── Leerer Helm, Licht aus dem Visier, Seufzer-Wölkchen ─────────
  F.part("helm", { bone: "head", z: 30, zb: 30 }, (g) => {
    const h0 = path([
      [-6, -64, 1],
      [-6, -76],
      [2, -82],
      [12, -80],
      [16, -72],
      [16, -64, 1],
    ]);
    g.mat(h0, ARMOR, "metal", { hi: 0.9 });
    g.clipTo(h0, (h) => {
      h.fill(rrect(4, -75, 14, 3.6, 1), "#1e2a28");
      h.fill(rrect(8, -70, 10, 2.4, 0.8), "#1e2a28");
      h.lod(1, (k) =>
        lines(
          k,
          [
            [
              [0, -80],
              [0, -64],
            ],
          ],
          ARMOR_D,
          0.8,
          1,
        ),
      );
    });
    rivets(
      g,
      [
        [-3, -66],
        [-3, -74],
      ],
      0.9,
      "#e0e8e4",
    );
  });
  F.part(
    "visorLight",
    {
      bone: "head",
      z: 31,
      view: "front",
      glow: true,
      expr: ["idle", "sleep", "attack", "ability", "hurt", "stun"],
    },
    (g) => {
      for (const x of [11, 15]) g.fill(circle(x, -73.2, 1.2), MIST_L);
    },
  );
  F.part(
    "sigh",
    { bone: "head", z: 31.5, state: ["idle", "sigh"], outline: false, lod: 1 },
    (g) => {
      for (const [x, y, r] of [
        [21, -68, 1.6],
        [24, -71, 2],
        [27, -75, 1.4],
      ])
        g.fill(circle(x, y, r), MIST_L, { op: 0.6 });
    },
  );
  F.part("helmBack", { bone: "head", z: 33, view: "back" }, (g) =>
    g.mat(
      path([
        [-6, -64, 1],
        [-6, -76],
        [2, -82],
        [12, -80],
        [16, -72],
        [16, -64, 1],
      ]),
      ARMOR,
      "metal",
      { hi: 0.7 },
    ),
  );

  // ───────── Schwebende Krone (Signature); Evo: drei Juwelen ─────────
  F.part("crown", { bone: "hat", z: 34, zb: 34, sig: true }, (g) => {
    g.mat(
      path([
        [-3, -88],
        [-4, -96, 1],
        [0, -92],
        [4, -98, 1],
        [8, -92],
        [12, -96, 1],
        [11, -88],
      ]),
      GOLD,
      "gold",
      { hi: 0.9 },
    );
    g.mat(rrect(-3.6, -89, 15.2, 2.4, 0.6), "#a8862a", "gold", { hi: 0.6 });
  });
  F.part("crownJewels", { bone: "hat", z: 34.5, zb: 34.5, evo: "evo" }, (g) => {
    for (const [x, c] of [
      [0, "#7affea"],
      [4, "#ff6a9a"],
      [8, "#7affea"],
    ])
      g.mat(circle(x, -91.6, 1.1), c, "gem", { hi: 1 });
  });
  F.part(
    "crownGlow",
    { bone: "hat", z: 34.8, zb: 34.8, glow: true, lod: 1 },
    (g) => g.fill(ellipse(4, -90, 10, 3), GOLD, { op: 0.25 }),
  );

  // ───────── Geistersäbel mit durchscheinender Klinge und Goldkorb ─────────
  F.part("saber", { bone: "prop", z: 27, zb: 4 }, (g) => {
    g.mat(
      path([
        [22, -46],
        [28, -62],
        [36, -76],
        [44, -82, 1],
        [38, -72],
        [30, -58],
        [24, -44],
      ]),
      MIST_L,
      "glass",
      { hi: 0.9 },
    );
    g.mat(
      blob(
        [
          [18, -44],
          [22, -50],
          [27, -47],
          [26, -41],
          [20, -40],
        ],
        0.7,
      ),
      GOLD,
      "gold",
      { hi: 0.8 },
    );
    g.mat(rrect(20.4, -42, 3, 6, 1), "#5a4a3a", "leather");
  });
  F.part("armF", { bone: "armF", z: 29, zb: 6 }, (g) =>
    g.mat(limb(14, -58, 21, -46, 3.6, 3.2), ARMOR, "metal", { hi: 0.6 }),
  );
  F.part("handF", { bone: "handF", z: 41, zb: 7 }, (g) =>
    g.mat(circle(22, -43.6, 3.2), ARMOR_D, "metal", { hi: 0.7 }),
  );
  F.part(
    "wave",
    { bone: "root", z: 52, zb: 52, state: "muzzle", glow: true },
    (g) => {
      g.fill(
        path([
          [20, -80],
          [44, -70],
          [56, -44],
          [50, -20],
          [44, -40],
          [34, -64],
        ]),
        MIST_L,
        { op: 0.6 },
      );
    },
  );

  // ───────── Materialisieren, Zusammenfallen ─────────
  F.part(
    "mist",
    { bone: "root", z: 50, zb: 50, state: "mist", outline: false },
    (g) => {
      for (const [x, y, r] of [
        [-14, -40, 10],
        [10, -56, 12],
        [0, -24, 10],
        [16, -30, 8],
      ])
        g.fill(circle(x, y, r), MIST_L, { op: 0.6 });
    },
  );

  F.anim({
    // Krone kreist, der Schweif wabert
    idle: {
      prog: "hover.idle",
      p: { float: 2.6, sway: 3, trail: 16, hat: 8 },
      keys: {
        hat: {
          x: [
            [0, -2],
            [0.25, 0],
            [0.5, 2],
            [0.75, 0],
            [1, -2],
          ],
          y: [
            [0, 0],
            [0.25, -2],
            [0.5, 0],
            [0.75, -2],
            [1, 0],
          ],
        },
      },
    },
    // schwebt
    walk: {
      prog: "hover.idle",
      p: { float: 2, sway: 5, trail: 22, hat: 6 },
      keys: {
        body: {
          r: [
            [0, 6],
            [1, 6],
          ],
        },
      },
    },
    // Geistersäbel-Schwung mit Flächenwelle
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        armF: {
          r: [
            [0, 0],
            [0.4, -120, "out"],
            [0.55, 30, "in"],
            [0.75, 20],
            [1, 0],
          ],
        },
        prop: {
          r: [
            [0, 0],
            [0.4, -20],
            [0.55, 30],
            [1, 0],
          ],
        },
        body: {
          r: [
            [0, 0],
            [0.4, -10],
            [0.55, 12],
            [1, 0],
          ],
        },
        show: { muzzle: [[0.55, 0.8]] },
        layer: [
          [0.1, 0.5, "saber", 2.5, 4],
          [0.1, 0.5, "armF", 2.6, 6],
          [0.1, 0.5, "handF", 2.7, 7],
        ],
      },
      ev: { strike: 0.55 },
    },
    // Rüstung klappert, er wird kurz sichtbar
    hit: {
      prog: "generic.hit",
      keys: {
        head: {
          y: [
            [0, 0],
            [0.1, -2],
            [0.2, 1],
            [0.3, -1],
            [0.4, 0],
          ],
        },
        hat: {
          y: [
            [0, 0],
            [0.15, -4],
            [0.5, 0],
          ],
        },
      },
    },
    // materialisiert sich
    spawn: {
      prog: "still",
      keys: {
        alpha: [
          [0, 0],
          [0.6, 1],
        ],
        show: { mist: [[0, 0.6]] },
      },
    },
    // Rüstung fällt in sich zusammen, die Krone steigt auf und verschwindet
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        body: {
          y: [
            [0, 0],
            [0.4, 26, "in"],
          ],
          r: [
            [0, 0],
            [0.4, 14],
          ],
        },
        trail: {
          sy: [
            [0, 1],
            [0.3, 0.2],
          ],
        },
        head: {
          y: [
            [0, 0],
            [0.4, 6],
          ],
          r: [
            [0, 0],
            [0.4, -20],
          ],
        },
        hat: {
          y: [
            [0, 0],
            [0.4, -40],
            [1, -70],
          ],
        },
        show: { mist: [[0.1, 0.6]] },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
  });
}
