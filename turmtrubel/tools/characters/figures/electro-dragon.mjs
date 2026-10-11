// Elektrodrache – nervöser, zuckender Indigo-Drache mit Blitzableiter-Horn samt Kupferspule auf der Nase und statisch
// abstehender Mähne. Evo: Gewitter – zweite Spule am Schwanz, Blitzadern, Gewitterwolken-Mähne (Brief: docs/briefs/electro-dragon.md)
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

export default function electroDragon(F) {
  const P = F.pal;
  const SCALE = P.main;
  const BOLT = P.acc;
  const COPPER = "#c87a3a";
  const BELLY = "#8a8ad0";
  const SCALE_D = "#26267a";
  const MEMB = "#5050b8";
  const ROD = "#c8ccd2";

  F.rig(
    "flyer",
    {
      body: [0, -42],
      neck: [10, -48],
      head: [24, -68],
      crest: [18, -74],
      jaw: [30, -64],
      wingB: [-6, -52],
      wingF: [-2, -50],
      tail: [-14, -36],
      legB: [-6, -32],
      legF: [6, -32],
    },
    { neck: "body", head: "neck", crest: "head", jaw: "head" },
  );

  const zig = (x0, y0, x1, y1, n, amp) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = i === 0 || i === n ? 0 : i % 2 ? amp : -amp;
      pts.push([x0 + (x1 - x0) * t + off * 0.5, y0 + (y1 - y0) * t + off]);
    }
    return polyline(pts);
  };

  // ───────── Lange Flügel mit Blitzzacken, Flügelsaum (Teamzone); Evo: leuchtende Blitzadern ─────────
  const wing = (name, z, col, s) => {
    const X = (x) => x * s;
    const sh = [-2, -52];
    const wr = [X(-22), -76];
    const trailing = [
      [X(-56), -76],
      [X(-50), -64],
      [X(-54), -52],
      [X(-42), -54],
      [X(-40), -42],
      [X(-28), -46],
      [X(-20), -38],
    ];
    F.part(name, { bone: name, z, zb: z }, (g) => {
      const m = path([
        [...sh, 1],
        [X(-12), -68],
        [...wr, 1],
        [X(-40), -82],
        [X(-56), -76, 1],
        ...trailing.slice(1).map((p, i) => [...p, i % 2 ? 1 : 0]),
        [X(-10), -44],
      ]);
      g.mat(m, col, "leather", { hi: 0.25 });
      g.clipTo(m, (h) =>
        h.lod(1, (k) => {
          k.stroke(zig(X(-30), -70, X(-40), -58, 4, 2), BOLT, 0.9, { op: 0.7 });
          k.stroke(zig(X(-20), -62, X(-26), -48, 3, 1.6), BOLT, 0.8, {
            op: 0.6,
          });
        }),
      );
      for (const t of [
        [X(-56), -76],
        [X(-54), -52],
        [X(-40), -42],
      ])
        g.stroke(polyline([wr, t]), SCALE_D, 1.4);
      g.stroke(polyline([sh, wr]), SCALE, 2.4);
    });
    F.part(
      name + "Hem",
      { bone: name, z: z + 0.3, zb: z + 0.3, team: true },
      (g) => {
        const pts = trailing.map(([x, y]) => [x, y]);
        g.stroke(polyline(pts), P.team, 2.2);
        g.lod(1, (h) =>
          h.stroke(
            polyline(pts.map(([x, y]) => [x + 0.6, y - 1.4])),
            P.teamDeep,
            0.6,
          ),
        );
      },
    );
    F.part(
      name + "Veins",
      { bone: name, z: z + 0.4, zb: z + 0.4, evo: "evo", glow: true },
      (g) => {
        g.stroke(zig(X(-24), -74, X(-50), -60, 5, 2.4), BOLT, 1.1);
        g.stroke(zig(X(-20), -66, X(-36), -48, 4, 2), BOLT, 0.9);
      },
    );
  };
  wing("wingB", 2, "#36368e", 0.9);
  wing("wingF", 26, MEMB, 1);

  // ───────── Langer Schwanz (Evo: Spule an der Spitze) ─────────
  F.part("tail", { bone: "tail", z: 3, zb: 40 }, (g) => {
    g.mat(
      path([
        [-10, -44],
        [-24, -40],
        [-36, -32],
        [-46, -30],
        [-54, -32, 1],
        [-46, -27],
        [-34, -26],
        [-22, -32],
        [-10, -34],
      ]),
      SCALE,
      "scale",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [-53, -32],
        [-60, -37, 1],
        [-58, -30],
        [-61, -25, 1],
        [-52, -28],
      ]),
      BOLT,
      "metal",
      { hi: 0.6 },
    );
  });
  F.part("tailCoil", { bone: "tail", z: 3.5, zb: 40.5, evo: "evo" }, (g) => {
    for (let i = 0; i < 4; i++)
      g.mat(ellipse(-44 - i * 2, -29.6, 1, 3), COPPER, "metal", { hi: 0.8 });
  });
  for (const [name, x, z, col] of [
    ["legB", -6, 5, SCALE_D],
    ["legF", 6, 7, SCALE],
  ]) {
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -32, x + 2, -22, 3, 2.4), col, "scale");
      g.mat(
        path([
          [x - 1, -23],
          [x + 6, -23.6],
          [x + 8, -20],
          [x + 5, -19.6, 1],
          [x + 3, -21],
          [x, -19.6, 1],
        ]),
        col,
        "scale",
        { hi: 0.4 },
      );
    });
  }

  // ───────── Schlanker Körper ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = blob(
      [
        [-16, -40],
        [-10, -50],
        [6, -54],
        [16, -48],
        [16, -36],
        [6, -30],
        [-10, -32],
      ],
      0.8,
    );
    g.mat(b, SCALE, "scale", { hi: 0.4 });
    g.clipTo(b, (h) => {
      h.mat(ellipse(6, -34, 12, 5), BELLY, "skin");
      for (const x of [0, 5, 10])
        h.stroke(
          polyline([
            [x, -38],
            [x + 1, -30],
          ]),
          "#6a6ab8",
          0.6,
          { lod: 1 },
        );
    });
  });
  emblem(F, "emblem", "body", 19, -6, -42, 2, { zb: 19 });
  // ───────── Langer Hals ─────────
  F.part("neck", { bone: "neck", z: 22, zb: 22 }, (g) => {
    g.mat(
      path([
        [6, -52],
        [12, -60],
        [18, -68],
        [26, -72],
        [30, -64],
        [22, -60],
        [16, -50],
        [12, -42],
      ]),
      SCALE,
      "scale",
      { hi: 0.4 },
    );
    g.lod(1, (h) => {
      for (const [x, y] of [
        [16, -52],
        [19, -58],
        [23, -63],
      ])
        h.stroke(
          spline([
            [x - 2, y + 1],
            [x + 1, y + 2],
            [x + 3, y],
          ]),
          BELLY,
          0.8,
        );
    });
  });

  // ───────── Statisch abstehende Mähne (Evo: Gewitterwolke) ─────────
  F.part("mane", { bone: "crest", z: 21, zb: 36, evo: "base" }, (g) => {
    const pts = [
      [10, -56],
      [6, -62, 1],
      [13, -62],
      [10, -70, 1],
      [17, -68],
      [16, -78, 1],
      [21, -73],
      [24, -82, 1],
      [26, -74],
      [30, -74],
    ];
    g.mat(path([[8, -52], ...pts, [24, -66], [14, -58]]), BOLT, "hair", {
      hi: 0.5,
    });
  });
  F.part("cloudMane", { bone: "crest", z: 21, zb: 36, evo: "evo" }, (g) => {
    for (const [x, y, r] of [
      [10, -60, 5],
      [14, -68, 6],
      [20, -76, 6],
      [27, -78, 4.6],
    ])
      g.mat(circle(x, y, r), "#5a5e78", "cloth", { hi: 0.4 });
    g.stroke(zig(14, -72, 10, -58, 3, 1.6), BOLT, 1);
  });
  F.part(
    "cloudSpark",
    { bone: "crest", z: 21.5, zb: 36.5, evo: "evo", glow: true },
    (g) => g.stroke(zig(22, -82, 18, -70, 3, 1.4), BOLT, 1.1),
  );

  // ───────── Kopf mit Blitzableiter-Horn und Kupferspule (Signature) ─────────
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      path([
        [18, -70],
        [24, -78],
        [34, -77],
        [46, -71],
        [48, -66, 1],
        [40, -66],
        [30, -63],
        [22, -62],
      ]),
      SCALE,
      "scale",
      { hi: 0.45 },
    );
    g.lod(1, (h) =>
      h.stroke(
        spline([
          [26, -66],
          [34, -67],
          [42, -68],
        ]),
        SCALE_D,
        0.6,
      ),
    );
  });
  F.part("jawPart", { bone: "jaw", z: 29.5, zb: 29.6 }, (g) => {
    g.mat(
      path([
        [24, -63],
        [34, -64],
        [46, -65],
        [44, -61, 1],
        [32, -58],
        [24, -59],
      ]),
      BELLY,
      "scale",
      { hi: 0.3 },
    );
    for (const x of [34, 38, 42])
      g.fill(
        path([
          [x, -64.4],
          [x + 1, -62.4, 1],
          [x + 2, -64.6],
        ]),
        WHITE,
        { stroke: INK, lw: 0.3 },
      );
  });
  F.part(
    "mouthSparks",
    {
      bone: "jaw",
      z: 31.8,
      view: "front",
      glow: true,
      expr: ["idle", "attack", "ability"],
    },
    (g) => {
      g.stroke(zig(33, -65.4, 43, -65.8, 4, 0.8), BOLT, 0.6);
    },
  );
  F.part(
    "face.idle",
    { bone: "head", z: 31, view: "front", expr: ["idle", "sleep"] },
    (g) => {
      eye(g, 33, -72.4, {
        r: 2.4,
        white: BOLT,
        iris: "#1a1a30",
        irisR: 0.38,
        look: [0.7, 0],
        lid: 0.2,
        lidColor: SCALE,
      });
      g.stroke(
        polyline([
          [30, -76],
          [36, -75],
        ]),
        SCALE_D,
        1,
      );
    },
  );
  F.part(
    "face.attack",
    { bone: "head", z: 31, view: "front", expr: ["attack", "ability"] },
    (g) => {
      eye(g, 33, -72.4, {
        r: 2.6,
        white: BOLT,
        iris: "#1a1a30",
        irisR: 0.3,
        look: [0.9, 0],
        lid: 0.1,
        lidColor: SCALE,
      });
      g.stroke(
        polyline([
          [30, -77],
          [36, -74.6],
        ]),
        SCALE_D,
        1.2,
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", expr: ["hurt", "stun"] },
    (g) => eyeClosed(g, 33, -72.4, 2.2, { up: true, lw: 0.9 }),
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => eyeX(g, 33, -72.4, 1.8, INK, 0.9),
  );
  F.part("nostril", { bone: "head", z: 31.2, view: "front", lod: 1 }, (g) =>
    g.fill(ellipse(45, -69, 0.9, 0.6), SCALE_D),
  );
  F.part("rod", { bone: "head", z: 32, zb: 32, sig: true }, (g) => {
    g.mat(
      path([
        [39, -73],
        [43, -94, 1],
        [42, -73.6],
      ]),
      ROD,
      "metal",
      { hi: 0.9 },
    );
    g.mat(circle(43, -94.6, 1.4), ROD, "metal", { hi: 0.9 });
    for (let i = 0; i < 4; i++)
      g.mat(ellipse(40.8 + i * 0.45, -76 - i * 2.2, 2.6, 1), COPPER, "metal", {
        hi: 0.8,
      });
    g.mat(rrect(38.6, -74.6, 5, 2, 0.6), "#5a5f6b", "metal", { lod: 1 });
  });
  F.part(
    "rodCharge",
    { bone: "head", z: 32.5, state: ["charge", "attack", "arc"], glow: true },
    (g) => {
      g.fill(star(43, -95, 5, 1.6, 6), BOLT);
      g.fill(circle(43, -95, 1.6), "#ffffff");
    },
  );
  F.part("tailSpark", { bone: "tail", z: 4, state: "arc", glow: true }, (g) =>
    g.fill(star(-60, -31, 4, 1.4, 6), BOLT),
  );

  // ───────── Kettenblitz, Erscheinen aus dem Blitz, Kurzschluss ─────────
  F.part("bolt", { bone: "jaw", z: 42, state: "muzzle", glow: true }, (g) => {
    g.stroke(zig(46, -65, 76, -60, 6, 3), BOLT, 2.4);
    g.stroke(zig(46, -65, 76, -60, 6, 3), "#ffffff", 0.9);
  });
  F.part(
    "strike",
    { bone: "root", z: 52, zb: 52, state: "strike", glow: true },
    (g) => {
      g.stroke(zig(8, -130, 4, -50, 7, 5), BOLT, 3);
      g.stroke(zig(8, -130, 4, -50, 7, 5), "#ffffff", 1.2);
      g.fill(circle(4, -52, 16), BOLT, { op: 0.4 });
    },
  );
  F.part(
    "shortCircuit",
    { bone: "body", z: 50, state: "short", glow: true },
    (g) => {
      for (const [x, y] of [
        [-4, -50],
        [14, -44],
        [26, -70],
        [-30, -60],
      ])
        g.fill(star(x, y, 4, 1.2, 5), BOLT);
    },
  );

  F.anim({
    // Funken zwischen Horn und Schwanzspitze, Mähne knistert
    idle: {
      prog: "flyer.idle",
      p: { flaps: 2, flap: 26, lift: 2.4, tail: 8 },
      keys: {
        crest: {
          r: [
            [0, 0],
            [0.1, 4],
            [0.15, -3],
            [0.2, 0],
            [0.6, 0],
            [0.65, 5],
            [0.7, -2],
            [0.75, 0],
          ],
        },
        show: {
          arc: [
            [0.1, 0.22],
            [0.6, 0.74],
          ],
        },
      },
    },
    // ruckartiger Flug
    walk: {
      prog: "flyer.walk",
      p: { flap: 34, lean: 8, tail: 12 },
      keys: {
        body: {
          r: [
            [0, 6],
            [0.2, 6],
            [0.25, 12],
            [0.5, 12],
            [0.55, 6],
            [0.8, 6],
            [0.85, 12],
            [1, 6],
          ],
        },
      },
      ev: { flap: [0.1, 0.43, 0.76] },
    },
    // Horn lädt, Kettenblitz aus dem Maul
    attack: {
      prog: "flyer.breath",
      hit: 0.55,
      p: { wind: -18, strike: 10, jawOpen: 22 },
      keys: {
        neck: {
          r: [
            [0, 0],
            [0.45, -10],
            [0.55, 6],
            [1, 0],
          ],
        },
      },
      ev: { release: 0.55 },
    },
    // Mähne zuckt
    hit: {
      prog: "flyer.hit",
      keys: {
        crest: {
          r: [
            [0, 0],
            [0.1, 12],
            [0.2, -10],
            [0.3, 8],
            [0.45, 0],
          ],
        },
      },
    },
    // erscheint aus einem Blitz
    spawn: { prog: "flyer.spawn", keys: { show: { strike: [[0, 0.35]] } } },
    // Kurzschluss, trudelt ab
    death: {
      prog: "flyer.death",
      keys: {
        show: { short: [[0, 0.5]] },
        neck: {
          r: [
            [0, 0],
            [0.5, 30],
          ],
        },
      },
    },
  });
}
