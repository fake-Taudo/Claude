// Königsschweinchen – stolze, quiekende Ferkel in Rosé-Creme mit Minikrone zwischen den Ohren, Königsmäntelchen und
// Schleife am Ringelschwanz
// Varianten: 0 = Fleck am Ohr, 1 = Krone schief, 2 = Doppelkinn. Evo: Federflügel mit Goldrand und Fliegerbrille
// (Brief: docs/briefs/royal-hogs.md)
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
  eyeSpiral,
  brow,
  lines,
  emblem,
  INK,
  WHITE,
} from "../kit.mjs";

export const PIGLET_PIVOTS = {
  body: [0, -20],
  head: [12, -26],
  jaw: [24, -19],
  ear: [14, -36],
  tail: [-15, -24],
  legBf: [-9, -12],
  legFf: [8, -12],
  legBn: [-6, -11],
  legFn: [11, -11],
};

/** Ferkelkörper auf den Vierbeiner-Knochen (Beine, Rumpf, Kopf, Rüssel, Ohren, Ringelschwanz). o: skin, snout, hoof, dark */
export function piglet(F, o) {
  const SKIN = o.skin;
  const DARK = o.dark;
  const SNOUT = o.snout;
  const HOOF = o.hoof;

  // ───────── Kurze Beinchen mit Hufen ─────────
  const leg = (name, x, z, col) =>
    F.part(name, { bone: name, z }, (g) => {
      g.mat(limb(x, -10.6, x + 0.6, -3, 3.4, 2.8), col, "skin");
      g.mat(
        path([
          [x - 2.6, -3.4],
          [x + 3.4, -3.4],
          [x + 3.6, 0, 1],
          [x - 2.8, 0, 1],
        ]),
        HOOF,
        "bone",
        { hi: 0.5 },
      );
      g.stroke(
        polyline([
          [x + 0.4, -3],
          [x + 0.4, 0],
        ]),
        "#2a2420",
        0.5,
        { lod: 1 },
      );
    });
  leg("legBf", -9, 4, DARK);
  leg("legFf", 8, 5, DARK);

  // ───────── Ringelschwanz ─────────
  F.part("tail", { bone: "tail", z: 6, zb: 40 }, (g) => {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * 0.2 + i * 0.5;
      const r = 3.4 - i * 0.12;
      pts.push([-19 + Math.cos(a) * r, -26 + Math.sin(a) * r]);
    }
    g.stroke(spline([[-15, -24], [-17, -25], ...pts]), SKIN, 1.8);
  });

  // ───────── Rundlicher Rumpf ─────────
  F.part("body", { bone: "body", z: 18, zb: 18 }, (g) => {
    const b = ellipse(0, -20, 16, 12);
    g.mat(b, SKIN, "skin", { hi: 0.45 });
    g.clipTo(b, (h) =>
      h.mat(ellipse(4, -10, 12, 4), DARK, "skin", { line: false }),
    );
  });
  leg("legBn", -6, 20, SKIN);
  leg("legFn", 11, 21, SKIN);

  // ───────── Kopf mit großer Schnauze ─────────
  F.part("earB", { bone: "ear", z: 28, zb: 34 }, (g) =>
    g.mat(
      path([
        [8, -34],
        [6, -42, 1],
        [12, -36],
      ]),
      DARK,
      "skin",
      { hi: 0.3 },
    ),
  );
  F.part("head", { bone: "head", z: 30, zb: 30 }, (g) => {
    g.mat(
      blob(
        [
          [4, -26],
          [6, -34],
          [14, -38],
          [22, -35],
          [26, -28],
          [24, -20],
          [16, -16],
          [8, -18],
        ],
        0.8,
      ),
      SKIN,
      "skin",
      { hi: 0.4 },
    );
  });
  F.part("snout", { bone: "jaw", z: 32, zb: 32 }, (g) => {
    g.mat(ellipse(27, -25, 4.4, 5, 10), SNOUT, "skin", { hi: 0.5 });
    for (const y of [-27, -23.4])
      g.fill(ellipse(28.6, y, 1, 1.4, 10), "#8a4a4a");
  });
  F.part("earF", { bone: "ear", z: 33, zb: 33 }, (g) => {
    g.mat(
      path([
        [13, -36],
        [16, -46, 1],
        [20, -36],
      ]),
      SKIN,
      "skin",
      { hi: 0.4 },
    );
    g.mat(
      path([
        [14.6, -37],
        [16.2, -43],
        [18.4, -37],
      ]),
      SNOUT,
      "skin",
      { line: false },
    );
  });
}

export default function royalHogs(F) {
  const P = F.pal;
  const SKIN = P.main;
  const GOLD = P.acc;
  const SNOUT = "#e8a090";
  const HOOF = "#5a4a40";
  const DARK = "#d8a890";

  F.rig("quadruped", PIGLET_PIVOTS);
  piglet(F, { skin: SKIN, dark: DARK, snout: SNOUT, hoof: HOOF });

  // Schleife am Ringelschwanz (Teamzone)
  F.part("tailBow", { bone: "tail", z: 6.5, zb: 40.5, team: true }, (g) => {
    g.mat(
      path([
        [-16, -25],
        [-20, -30, 1],
        [-17, -25.6, 1],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
    g.mat(
      path([
        [-16, -25],
        [-12, -30, 1],
        [-15, -25.6, 1],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.4 },
    );
    g.mat(circle(-16, -25, 1.1), P.teamShade, "cloth", {
      line: P.teamDeep,
      lw: 0.3,
    });
  });
  // Königsmäntelchen mit Hermelinsaum (zweite Teamzone), weht hinten über den Rücken hinaus
  F.part("cape", { bone: "body", z: 18.6, zb: 18.6, team: true }, (g) => {
    g.mat(
      path([
        [-4, -33],
        [6, -31.4],
        [4.4, -22, 1],
        [-6, -17.4],
        [-19, -18.4, 1],
        [-22, -25],
        [-15, -29.6, 1],
      ]),
      P.team,
      "cloth",
      { line: P.teamDeep, lw: 0.5, hi: 0.4 },
    );
    g.mat(
      path([
        [5, -23.6],
        [-6, -18.6],
        [-19.4, -19.6],
        [-20.4, -16.6],
        [-6, -15.2],
        [5.8, -20.6],
      ]),
      "#fff8f0",
      "fur",
      { line: "#c8bca8", lw: 0.3 },
    );
    g.lod(1, (h) => {
      for (const [x, y] of [
        [-15, -17.6],
        [-8, -16.6],
        [-1, -18.2],
      ])
        h.fill(rrect(x - 0.4, y - 0.8, 0.8, 1.6, 0.3), INK);
    });
  });
  emblem(F, "emblem", "body", 19, -6, -25, 2, { zb: 19 });
  // Evo: kleine Federflügel mit Goldrand
  F.part("wings", { bone: "body", z: 19.5, zb: 19.5, evo: "evo" }, (g) => {
    const w = path([
      [-2, -30],
      [-10, -40],
      [-18, -42, 1],
      [-16, -38],
      [-20, -36, 1],
      [-14, -34],
      [-16, -30, 1],
      [-8, -30],
    ]);
    g.mat(w, "#fff8f0", "cloth", { hi: 0.5, line: GOLD, lw: 0.8 });
    g.lod(1, (h) =>
      lines(
        h,
        [
          [
            [-6, -32],
            [-14, -38],
          ],
          [
            [-6, -31],
            [-14, -33],
          ],
        ],
        "#e0d0b0",
        0.5,
        1,
      ),
    );
  });

  // ───────── Gesicht: stolze Augen, Doppelkinn (Variante 2), Fleck am Ohr (Variante 0) ─────────
  F.part(
    "face.idle",
    {
      bone: "head",
      z: 31,
      view: "front",
      expr: ["idle", "sleep", "attack", "ability"],
    },
    (g) => {
      eye(g, 20, -30, {
        r: 2.2,
        iris: "#3a2a22",
        lid: 0.4,
        lidColor: SKIN,
        look: [0.6, 0],
      });
      eye(g, 13.6, -30.2, {
        r: 2,
        iris: "#3a2a22",
        lid: 0.4,
        lidColor: SKIN,
        look: [0.6, 0],
      });
      brow(
        g,
        [
          [17.6, -33.6],
          [20, -34.4],
          [22.6, -33.4],
        ],
        0.7,
        "#b8806a",
      );
      g.stroke(
        spline([
          [18, -20],
          [21, -19],
          [24, -20.4],
        ]),
        INK,
        0.8,
      );
    },
  );
  F.part(
    "face.hurt",
    { bone: "head", z: 31, view: "front", expr: ["hurt", "stun"] },
    (g) => {
      eyeClosed(g, 20, -30, 2, { up: true, lw: 0.9 });
      eyeClosed(g, 13.6, -30.2, 1.8, { up: true, lw: 0.8 });
      g.fill(ellipse(21, -19.6, 2, 2.2), "#5a2028", { stroke: INK, lw: 0.4 });
    },
  );
  F.part(
    "face.death",
    { bone: "head", z: 31, view: "front", expr: "death" },
    (g) => {
      eyeX(g, 20, -30, 1.6, INK, 0.9);
      eyeX(g, 13.6, -30.2, 1.4, INK, 0.8);
    },
  );
  F.part("chin", { bone: "head", z: 30.5, zb: 30.5, variant: 2 }, (g) =>
    g.mat(
      path([
        [10, -18],
        [17, -15],
        [24, -18],
        [21, -13, 1],
        [13, -13, 1],
      ]),
      SKIN,
      "skin",
      { hi: 0.3 },
    ),
  );
  F.part(
    "earSpot",
    { bone: "ear", z: 33.5, zb: 33.5, variant: 0, lod: 1 },
    (g) => g.fill(ellipse(17.4, -41, 1.6, 2.2, 20), "#c88a74"),
  );
  // Evo: Fliegerbrille unter der Krone
  F.part("goggles", { bone: "head", z: 34, zb: 34, evo: "evo" }, (g) => {
    g.mat(
      path([
        [6, -35],
        [24, -36],
        [24, -34],
        [6, -33],
      ]),
      "#6b4a2a",
      "leather",
    );
    g.mat(circle(12, -35, 2.4), "#9ad8f0", "glass", { line: GOLD, lw: 0.6 });
    g.mat(circle(18, -35.4, 2.4), "#9ad8f0", "glass", { line: GOLD, lw: 0.6 });
  });

  // ───────── Minikrone mit drei Zacken (Signature), Variante 1: schief ─────────
  const crown = (g) => {
    g.mat(
      path([
        [9, -37],
        [8.6, -44, 1],
        [11.4, -40],
        [14, -46, 1],
        [16.6, -40],
        [19.4, -44, 1],
        [19, -37],
      ]),
      GOLD,
      "gold",
      { hi: 0.9 },
    );
    g.mat(rrect(8.4, -38.4, 11, 2.2, 0.6), "#c89a2a", "gold", { hi: 0.6 });
    g.mat(circle(14, -44, 0.9), "#e0306f", "gem", { lod: 1 });
  };
  F.part(
    "crown",
    { bone: "head", z: 34.5, zb: 34.5, sig: true, variant: [0, 2] },
    crown,
  );
  F.part(
    "crownTilt",
    { bone: "head", z: 34.5, zb: 34.5, sig: true, variant: 1 },
    (g) => g.group({ t: [0.94, -0.34, 0.34, 0.94, 14.4, 2.4] }, crown),
  );

  F.anim({
    // schnüffeln, Ohren wackeln
    idle: {
      prog: "quad.idle",
      p: { nod: 4 },
      keys: {
        jaw: {
          r: [
            [0, 0],
            [0.1, -6],
            [0.2, 2],
            [0.3, -6],
            [0.4, 0],
          ],
        },
        ear: {
          r: [
            [0, 0],
            [0.6, 0],
            [0.65, -14],
            [0.7, 6],
            [0.75, -10],
            [0.8, 0],
          ],
        },
      },
    },
    // trippeln mit wackelndem Hinterteil
    walk: {
      prog: "quad.walk",
      p: { stride: 28, bob: 2.4, rock: 7, nod: 5, gallop: false },
      ev: { step: [0.25, 0.75] },
    },
    // Kopfstoß mit Kronenspitze
    attack: {
      prog: "quad.idle",
      hit: 0.55,
      keys: {
        expr: [[0, 1, "attack"]],
        head: {
          r: [
            [0, 0],
            [0.45, 14, "out"],
            [0.55, -22, "in"],
            [0.8, 0],
          ],
        },
        root: {
          x: [
            [0, 0],
            [0.45, -4],
            [0.55, 6],
            [1, 0],
          ],
        },
      },
      ev: { strike: 0.55 },
    },
    // quieken
    hit: {
      prog: "quad.hit",
      keys: {
        jaw: {
          r: [
            [0, 0],
            [0.2, 10],
            [1, 0],
          ],
        },
      },
    },
    // plumpsen herab
    spawn: {
      prog: "quad.idle",
      keys: {
        root: {
          y: [
            [0, -20],
            [0.45, 0, "in"],
            [0.55, 0],
          ],
          sy: [
            [0, 1],
            [0.45, 1],
            [0.55, 0.82],
            [0.7, 1.06],
            [0.85, 1],
          ],
        },
      },
    },
    // fallen auf den Rücken
    death: {
      prog: "still",
      keys: {
        expr: [[0, 1, "death"]],
        root: {
          r: [
            [0, 0],
            [0.4, -170, "in"],
          ],
          y: [
            [0, 0],
            [0.2, -10],
            [0.4, -34],
          ],
        },
        legFn: {
          r: [
            [0.4, 0],
            [0.5, -20],
            [0.6, 10],
            [0.7, -16],
            [0.8, 0],
          ],
        },
        legBn: {
          r: [
            [0.4, 0],
            [0.5, 20],
            [0.6, -10],
            [0.7, 14],
            [0.8, 0],
          ],
        },
        alpha: [
          [0, 1],
          [0.75, 1],
          [1, 0],
        ],
      },
    },
  });
}
