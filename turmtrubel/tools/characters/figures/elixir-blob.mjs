// Elixierklecks – quietschfideler Klecks aus rosa Elixier mit winzigem Korkhütchen; hüpft zu Gebäuden und platscht dagegen
// (Brief: docs/briefs/elixir-blob.md)
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
import { eye, eyeClosed, eyeX, emblem, INK, WHITE } from "../kit.mjs";

export default function elixirBlob(F) {
  const P = F.pal;
  const ELIXIR = P.main;
  const CORK = P.acc;
  const SHINE = "#ffe8fa";
  const ELIXIR_D = "#d860b8";
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

  F.rig("blob", { body: [0, 0], eyes: [4, -16], hat: [0, -31], feet: [0, 0] });

  // ───────── Tropfenförmiger Klecks mit Glanzpunkten ─────────
  F.part("body", { bone: "body", z: 18, zb: 18, state: LIVE }, (g) => {
    const b = blob(
      [
        [0, -33],
        [7, -28],
        [15, -16],
        [17, -6],
        [12, 0],
        [0, 1],
        [-12, 0],
        [-17, -6],
        [-15, -16],
        [-7, -28],
      ],
      0.85,
    );
    g.mat(b, ELIXIR, "glass", { hi: 0.8 });
    g.clipTo(b, (h) => {
      h.fill(ellipse(4, -2, 16, 5), ELIXIR_D, { op: 0.5 });
      h.fill(ellipse(-7, -22, 3.4, 5, 25), SHINE, { op: 0.9 });
      h.fill(circle(-10, -14, 1.4), SHINE, { op: 0.8, lod: 1 });
      h.fill(circle(10, -8, 1), SHINE, { op: 0.7, lod: 1 });
    });
  });
  emblem(F, "emblem", "body", 19, -10, -6, 1.8, { zb: 19, state: LIVE });

  // ───────── Riesige glänzende Augen, kleiner Mund ─────────
  F.part(
    "face.idle",
    {
      bone: "eyes",
      z: 20,
      view: "front",
      state: LIVE,
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      eye(g, 9, -18, {
        r: 4,
        iris: "#5a1a4a",
        irisR: 0.72,
        look: [0.4, 0.1],
        lid: 0,
      });
      eye(g, 0.4, -18.2, {
        r: 3.7,
        iris: "#5a1a4a",
        irisR: 0.72,
        look: [0.4, 0.1],
        lid: 0,
      });
      g.fill(ellipse(5.6, -10.6, 1.8, 1.4), "#5a1a4a", {
        stroke: INK,
        lw: 0.4,
      });
    },
  );
  F.part(
    "face.hurt",
    { bone: "eyes", z: 20, view: "front", state: LIVE, expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 9, -18, 3.4, { up: true, lw: 1.1 });
      eyeClosed(g, 0.4, -18.2, 3, { up: true, lw: 1 });
      g.stroke(
        spline([
          [3.6, -10.6],
          [5.6, -11.6],
          [7.6, -10.6],
        ]),
        INK,
        0.8,
      );
    },
  );
  F.part(
    "face.death",
    { bone: "eyes", z: 20, view: "front", state: LIVE, expr: "death" },
    (g) => {
      eyeX(g, 9, -18, 2.6, INK, 1);
      eyeX(g, 0.4, -18.2, 2.4, INK, 0.9);
    },
  );

  // ───────── Winziges Korkhütchen (Signature) mit Hutband (Teamzone) ─────────
  F.part(
    "cork",
    { bone: "hat", z: 30, zb: 30, sig: true, state: LIVE },
    (g) => {
      g.mat(
        path([
          [-5, -31, 1],
          [5, -31, 1],
          [4, -40],
          [-4, -40],
        ]),
        CORK,
        "wood",
        { hi: 0.4 },
      );
      g.mat(ellipse(0, -40, 4, 1.3), "#9a6a40", "wood", { hi: 0.5 });
      g.fill(circle(-1.6, -36, 0.5), "#5a3a1a", { lod: 1 });
      g.fill(circle(1.6, -34, 0.5), "#5a3a1a", { lod: 1 });
    },
  );
  F.part(
    "hatBand",
    { bone: "hat", z: 30.5, zb: 30.5, team: true, state: LIVE },
    (g) =>
      g.mat(
        path([
          [-5, -34],
          [5, -34],
          [4.8, -32],
          [-4.8, -32],
        ]),
        P.team,
        "cloth",
        { line: P.teamDeep, lw: 0.4 },
      ),
  );

  // ───────── Tröpfchen ─────────
  F.part(
    "droplets",
    { bone: "root", z: 50, zb: 50, state: "droplets" },
    (g) => {
      for (const [x, y, r] of [
        [-16, -20, 3],
        [14, -26, 2.6],
        [-8, -32, 2],
        [20, -10, 2.4],
        [-22, -6, 2.2],
        [4, -4, 4],
      ])
        g.mat(
          blob(
            [
              [x, y - r * 1.4],
              [x + r, y],
              [x, y + r],
              [x - r, y],
            ],
            0.9,
          ),
          ELIXIR,
          "glass",
          { hi: 0.8 },
        );
    },
  );
  F.part("drip", { bone: "root", z: 17, zb: 17, state: "drip" }, (g) =>
    g.mat(ellipse(0, -1, 16, 3), ELIXIR_D, "glass", { hi: 0.6 }),
  );

  F.anim({
    // wabbelt
    idle: { prog: "blob.idle", p: { wobble: 0.07 } },
    // hüpft mit Squash und Stretch
    walk: { prog: "blob.walk", p: { hop: 9 } },
    // Platscher nach vorn
    attack: {
      prog: "still",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        body: {
          sx: [
            [0, 1],
            [0.4, 0.82, "out"],
            [0.55, 1.4, "in"],
            [0.7, 0.9],
            [0.85, 1.05],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.4, 1.2, "out"],
            [0.55, 0.62, "in"],
            [0.7, 1.1],
            [0.85, 0.96],
            [1, 1],
          ],
        },
        root: {
          x: [
            [0, 0],
            [0.4, -3],
            [0.55, 8, "in"],
            [1, 0],
          ],
          y: [
            [0, 0],
            [0.35, -10, "out"],
            [0.55, 0, "in"],
          ],
        },
      },
      ev: { strike: 0.55 },
    },
    // zerfließt kurz
    hit: {
      prog: "still",
      keys: {
        expr: [[0, 1, "hurt"]],
        body: {
          sx: [
            [0, 1],
            [0.2, 1.25],
            [0.6, 0.95],
            [1, 1],
          ],
          sy: [
            [0, 1],
            [0.2, 0.72],
            [0.6, 1.05],
            [1, 1],
          ],
        },
      },
    },
    // tropft heraus
    spawn: {
      prog: "still",
      keys: {
        body: {
          sx: [
            [0, 0.5],
            [0.4, 0.7],
            [0.6, 1.15, "out"],
            [0.8, 1],
          ],
          sy: [
            [0, 0.2],
            [0.4, 1.3],
            [0.6, 0.85, "in"],
            [0.8, 1],
          ],
        },
        show: { drip: [[0, 0.4]] },
      },
    },
    // zerplatzt in Tröpfchen
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        body: {
          sx: [
            [0, 1],
            [0.15, 1.4],
          ],
          sy: [
            [0, 1],
            [0.15, 0.5],
          ],
        },
        show: { whole: [[0, 0.2]], droplets: [[0.18, 1.01]] },
        alpha: [
          [0, 1],
          [0.6, 1],
          [1, 0],
        ],
      },
    },
  });
}
