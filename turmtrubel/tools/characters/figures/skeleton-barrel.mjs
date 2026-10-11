// Skelettfass – kicherndes Holzfass mit Propellerkappe, aus den Spundlöchern gucken Knochen und Schädelaugen
// Evo: Doppelfass – zweites, kleineres Fass hängt darunter, Eisenbeschläge, Doppelpropeller, grüne Leuchtspalten;
// unter 75 % Leben fällt das untere Fass ab (Form „single“ über hpForm) (Brief: docs/briefs/skeleton-barrel.md)
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

export default function skeletonBarrel(F) {
  const P = F.pal;
  const WOOD = P.main;
  const BONE = P.acc;
  const HOOP = "#5a5f6b";
  const BRASS = "#c8a046";
  const WOOD_D = "#4a3428";
  const GREEN = "#6dff9a";
  const ALL = "*";
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

  F.rig("hover", {
    body: [0, -46],
    head: [0, -46],
    hat: [0, -74],
    armB: [-14, -46],
    handB: [-18, -40],
    armF: [14, -46],
    handF: [18, -40],
    prop: [12, -76],
    trail: [0, -22],
  });
  F.meta.hpForm = { below: 0.75, form: "single", evo: true };

  const staves = (g, x0, x1, y0, y1) => {
    for (let x = x0 + 6; x < x1; x += 7)
      g.stroke(
        polyline([
          [x, y0],
          [x + (x < 0 ? -1 : 1), (y0 + y1) / 2],
          [x, y1],
        ]),
        WOOD_D,
        0.8,
      );
  };
  const barrel = (g, cx, cy, s) => {
    const X = (x) => cx + x * s;
    const Y = (y) => cy + y * s;
    const b = path([
      [X(-17), Y(-24)],
      [X(17), Y(-24)],
      [X(22), Y(0)],
      [X(17), Y(24)],
      [X(-17), Y(24)],
      [X(-22), Y(0)],
    ]);
    g.mat(b, WOOD, "wood", { hi: 0.45 });
    g.clipTo(b, (h) => {
      h.lod(1, (k) => staves(k, X(-22), X(22), Y(-24), Y(24)));
      for (const y of [-18, 18])
        h.mat(rrect(X(-24), Y(y) - 2 * s, 48 * s, 4 * s, 0), HOOP, "metal", {
          hi: 0.6,
        });
    });
    return b;
  };

  // ───────── Evo: unteres Fass am Seil (fällt in der Form „single“ ab) ─────────
  F.part(
    "rope",
    { bone: "trail", z: 10, zb: 10, evo: "evo", form: "base", state: LIVE },
    (g) => {
      for (const x of [-6, 6])
        g.stroke(
          polyline([
            [x, -24],
            [x * 0.6, -12],
          ]),
          "#a8865a",
          0.9,
        );
    },
  );
  F.part(
    "lowerBarrel",
    { bone: "trail", z: 11, zb: 11, evo: "evo", form: "base", state: LIVE },
    (g) => {
      barrel(g, 0, -2, 0.5);
      g.fill(circle(2, -2, 1.6), "#1e1a16");
      g.fill(circle(2.4, -2.4, 0.7), BONE);
    },
  );
  F.part(
    "lowerGlow",
    {
      bone: "trail",
      z: 11.5,
      zb: 11.5,
      evo: "evo",
      form: "base",
      state: LIVE,
      glow: true,
    },
    (g) => {
      for (const x of [-4, 3])
        g.stroke(
          polyline([
            [x, -10],
            [x, 6],
          ]),
          GREEN,
          0.8,
        );
    },
  );

  // ───────── Fass mit Reifen, Fassband (Teamzone), Knochen und Schädelaugen in den Spundlöchern ─────────
  F.part(
    "barrel",
    { bone: "body", z: 18, zb: 18, sig: false, form: ALL, state: LIVE },
    (g) => {
      barrel(g, 0, -46, 1);
      // Löcher im Fass
      g.lod(1, (h) => {
        h.fill(ellipse(-14, -30, 2.4, 1.6), "#1e1a16");
        h.fill(ellipse(14, -60, 2, 1.4), "#1e1a16");
      });
    },
  );
  F.part(
    "band",
    { bone: "body", z: 19, zb: 19, team: true, form: ALL, state: LIVE },
    (g) => {
      g.clipTo(
        path([
          [-17, -70],
          [17, -70],
          [22, -46],
          [17, -22],
          [-17, -22],
          [-22, -46],
        ]),
        (h) =>
          h.mat(rrect(-24, -42, 48, 5, 0), P.team, "cloth", {
            line: P.teamDeep,
            lw: 0.5,
          }),
      );
    },
  );
  F.part(
    "fittings",
    { bone: "body", z: 19.5, zb: 19.5, evo: "evo", form: ALL, state: LIVE },
    (g) => {
      for (const [x, y] of [
        [-17, -68],
        [13, -68],
        [-17, -28],
        [13, -28],
      ])
        g.mat(rrect(x, y, 4.4, 4.4, 0.6), "#3a3d44", "metal", { hi: 0.7 });
      rivets(
        g,
        [
          [-15, -66],
          [15, -66],
          [-15, -26],
          [15, -26],
        ],
        0.6,
        "#c8ccd2",
      );
    },
  );
  F.part(
    "slits",
    {
      bone: "body",
      z: 19.6,
      zb: 19.6,
      evo: "evo",
      form: ALL,
      state: LIVE,
      glow: true,
    },
    (g) => {
      for (const x of [-12, -1, 10])
        g.stroke(
          polyline([
            [x, -60],
            [x + (x < 0 ? -0.6 : 0.6), -48],
          ]),
          GREEN,
          1,
        );
    },
  );
  emblem(F, "emblem", "body", 20, -10, -54, 2, {
    zb: 20,
    form: ALL,
    state: LIVE,
  });
  F.part(
    "bungs",
    { bone: "head", z: 30, view: "front", form: ALL, state: LIVE },
    (g) => {
      for (const x of [2, 12])
        g.mat(circle(x, -52, 3.4), "#3a2a1e", "wood", { hi: 0.3 });
    },
  );
  F.part(
    "eyes.idle",
    {
      bone: "head",
      z: 31,
      view: "front",
      form: ALL,
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      for (const x of [2, 12]) {
        g.fill(circle(x, -52, 2.6), BONE);
        g.fill(circle(x + 0.6, -52, 1.1), "#1e1a16");
      }
      // Kichern aus dem unteren Spundloch
      g.mat(ellipse(7, -45, 3, 1.6), "#3a2a1e", "wood");
      g.fill(rrect(5, -46, 4, 1, 0.3), BONE);
    },
  );
  F.part(
    "eyes.hurt",
    {
      bone: "head",
      z: 31,
      view: "front",
      form: ALL,
      state: LIVE,
      expr: ["hurt", "stun", "death"],
    },
    (g) => {
      for (const x of [2, 12])
        g.stroke(
          polyline([
            [x - 2, -52],
            [x + 2, -52],
          ]),
          BONE,
          1.2,
        );
    },
  );
  F.part(
    "bones",
    { bone: "body", z: 21, zb: 21, form: ALL, state: LIVE },
    (g) => {
      const bone = (x0, y0, x1, y1) => {
        g.mat(limb(x0, y0, x1, y1, 1.2, 1.2), BONE, "bone", { hi: 0.5 });
        for (const [x, y] of [[x1, y1]]) {
          g.mat(circle(x - 1, y - 0.6, 1.6), BONE, "bone");
          g.mat(circle(x + 0.8, y + 1, 1.6), BONE, "bone");
        }
      };
      bone(-14, -30, -24, -26);
      bone(14, -60, 22, -66);
    },
  );

  // ───────── Propellerkappe mit drei Blättern (Signature), Fähnchen (Teamzone); Evo: Doppelpropeller ─────────
  F.part(
    "cap",
    { bone: "body", z: 32, zb: 32, form: ALL, state: LIVE },
    (g) => {
      g.mat(
        path([
          [-16, -70, 1],
          [16, -70, 1],
          [12, -76],
          [0, -79],
          [-12, -76],
        ]),
        BRASS,
        "gold",
        { hi: 0.7 },
      );
      g.mat(rrect(-1.2, -86, 2.4, 9, 0.6), HOOP, "metal", { hi: 0.6 });
      g.lod(1, (h) =>
        h.stroke(
          polyline([
            [-14, -71],
            [-8, -62],
          ]),
          "#5a4030",
          0.8,
        ),
      );
    },
  );
  F.part(
    "propeller",
    { bone: "hat", z: 33, zb: 33, sig: true, form: ALL, state: LIVE },
    (g) => {
      // drei Blätter in Aufsicht, perspektivisch gestaucht
      for (const a of [90, 210, 330]) {
        const r = (a * Math.PI) / 180;
        const [bx, by] = [Math.cos(r) * 6.5, Math.sin(r) * 1.8];
        g.mat(
          ellipse(bx, -86 + by, 6.6, 1.6, (Math.atan2(by, bx) * 180) / Math.PI),
          BRASS,
          "gold",
          { hi: 0.8 },
        );
      }
      g.mat(circle(0, -86, 1.6), HOOP, "metal", { hi: 0.8 });
    },
  );
  F.part(
    "propeller2",
    { bone: "hat", z: 33.5, zb: 33.5, evo: "evo", form: ALL, state: LIVE },
    (g) => {
      g.mat(rrect(-0.8, -92, 1.6, 6, 0.4), HOOP, "metal");
      g.mat(ellipse(0, -92, 9, 1.4), "#d8b85a", "gold", { hi: 0.8 });
    },
  );
  F.part(
    "flag",
    { bone: "prop", z: 31, zb: 34, team: true, form: ALL, state: LIVE },
    (g) => {
      g.stroke(
        polyline([
          [12, -72],
          [16, -92],
        ]),
        "#6a4a2a",
        1,
      );
      g.mat(
        path([
          [16, -92],
          [28, -90],
          [22, -87],
          [27, -84],
          [15, -84],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.5 },
      );
    },
  );

  // ───────── Platzen: Explosion, Dauben, herabfallende Skelette ─────────
  F.part(
    "burst",
    {
      bone: "root",
      z: 52,
      zb: 52,
      state: ["muzzle", "burst"],
      glow: true,
      form: ALL,
    },
    (g) => {
      g.fill(star(0, -40, 36, 18, 9, -90, 5), "#ffd27a", { op: 0.8 });
      g.fill(circle(0, -40, 14), "#fff4c8", { op: 0.9 });
    },
  );
  F.part(
    "debris",
    { bone: "root", z: 51, zb: 51, state: "burst", form: ALL },
    (g) => {
      for (const [x, y, a] of [
        [-26, -50, -30],
        [24, -56, 40],
        [-18, -20, 70],
        [20, -18, -60],
        [0, -70, 10],
      ])
        g.mat(rrect(x - 2, y - 7, 4, 14, 1).rot(a, x, y), WOOD, "wood", {
          hi: 0.4,
        });
      for (const [x, y] of [
        [-8, -30],
        [10, -36],
        [-2, -14],
      ]) {
        g.mat(circle(x, y, 3.2), BONE, "bone", { hi: 0.5 });
        g.fill(circle(x + 1, y - 0.6, 0.9), "#1e1a16");
      }
    },
  );

  F.anim({
    // Propeller dreht, Fass schaukelt
    idle: {
      prog: "hover.idle",
      p: { float: 3, sway: 5, hat: 0 },
      keys: {
        hat: {
          sx: [
            [0, 1],
            [0.125, 0.2],
            [0.25, 1],
            [0.375, 0.2],
            [0.5, 1],
            [0.625, 0.2],
            [0.75, 1],
            [0.875, 0.2],
            [1, 1],
          ],
        },
        trail: {
          r: [
            [0, -6],
            [0.5, 6],
            [1, -6],
          ],
        },
      },
    },
    // ratternder Flug
    walk: {
      prog: "hover.idle",
      p: { float: 2, sway: 3, hat: 0 },
      keys: {
        body: {
          r: [
            [0, 4],
            [0.1, 6],
            [0.2, 4],
            [0.3, 6],
            [0.4, 4],
            [0.5, 6],
            [0.6, 4],
            [0.7, 6],
            [0.8, 4],
            [0.9, 6],
            [1, 4],
          ],
        },
        hat: {
          sx: [
            [0, 1],
            [0.1, 0.2],
            [0.2, 1],
            [0.3, 0.2],
            [0.4, 1],
            [0.5, 0.2],
            [0.6, 1],
            [0.7, 0.2],
            [0.8, 1],
            [0.9, 0.2],
            [1, 1],
          ],
        },
        trail: {
          r: [
            [0, -10],
            [0.5, 10],
            [1, -10],
          ],
        },
      },
    },
    // Sturz auf das Gebäude, Fass platzt
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        root: {
          y: [
            [0, 0],
            [0.4, -8, "out"],
            [0.55, 24, "in"],
          ],
          r: [
            [0, 0],
            [0.55, 20],
          ],
        },
        show: { muzzle: [[0.55, 1.01]] },
      },
      ev: { strike: 0.55 },
    },
    // Dauben knarren
    hit: {
      prog: "generic.hit",
      keys: {
        body: {
          sx: [
            [0, 1],
            [0.15, 1.08],
            [0.4, 0.96],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.15, 0.92],
            [0.4, 1.04],
            [1, 1],
          ],
        },
      },
    },
    // propellert hoch
    spawn: {
      prog: "still",
      keys: {
        root: {
          y: [
            [0, 24],
            [0.6, -3, "out"],
            [0.8, 0],
          ],
        },
        hat: {
          sx: [
            [0, 1],
            [0.1, 0.2],
            [0.2, 1],
            [0.3, 0.2],
            [0.4, 1],
            [0.5, 0.2],
            [0.6, 1],
          ],
        },
      },
    },
    // Fass platzt, Skelette fallen heraus
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        show: { whole: [[0, 0.15]], burst: [[0.1, 0.7]] },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
  });
}
