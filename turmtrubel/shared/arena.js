// Arena-Geometrie und Platzierungsregeln (Server und Client nutzen dieselbe Logik).
//
// Koordinaten in Feldern ("Tiles"). Kanonische Ansicht:
//   Spieler 0 (blau) unten  → y von 17 bis 32
//   Spieler 1 (rot)  oben   → y von 0 bis 15
//   Fluss dazwischen        → 15 < y < 17, passierbar nur über zwei Brücken.
// Der Client von Spieler 1 dreht die Darstellung um 180°, damit jeder unten spielt.

export const ARENA_W = 18;
export const ARENA_H = 32;
export const RIVER_Y0 = 15;
export const RIVER_Y1 = 17;
export const MID_X = ARENA_W / 2;
export const MID_Y = ARENA_H / 2;

export const BRIDGES = Object.freeze([
  Object.freeze({ x0: 2, x1: 5, cx: 3.5 }),
  Object.freeze({ x0: 13, x1: 16, cx: 14.5 }),
]);

// lane: 0 = links (x < 9), 1 = rechts, -1 = Mitte (Burgturm)
export const TOWER_SLOTS = Object.freeze([
  Object.freeze({ side: 0, key: 'king', x: 9, y: 29, lane: -1 }),
  Object.freeze({ side: 0, key: 'princess', x: 3.5, y: 25.5, lane: 0 }),
  Object.freeze({ side: 0, key: 'princess', x: 14.5, y: 25.5, lane: 1 }),
  Object.freeze({ side: 1, key: 'king', x: 9, y: 3, lane: -1 }),
  Object.freeze({ side: 1, key: 'princess', x: 3.5, y: 6.5, lane: 0 }),
  Object.freeze({ side: 1, key: 'princess', x: 14.5, y: 6.5, lane: 1 }),
]);

// Eigene Spielhälfte (Mittelpunkt der Einheit muss darin liegen)
const OWN_ZONE = [
  { x0: 0.5, x1: 17.5, y0: 17.5, y1: 31.5 },
  { x0: 0.5, x1: 17.5, y0: 0.5, y1: 14.5 },
];

// "Taschen" auf der gegnerischen Seite, sobald der dortige Wachturm fällt.
// Index: [side][lane]
const POCKETS = [
  [{ x0: 0.5, x1: 9, y0: 9.5, y1: 14.5 }, { x0: 9, x1: 17.5, y0: 9.5, y1: 14.5 }],
  [{ x0: 0.5, x1: 9, y0: 17.5, y1: 22.5 }, { x0: 9, x1: 17.5, y0: 17.5, y1: 22.5 }],
];

export function forwardDir(side) {
  return side === 0 ? -1 : 1;
}

export function inRiver(y) {
  return y > RIVER_Y0 && y < RIVER_Y1;
}

export function onBridge(x) {
  for (const b of BRIDGES) if (x >= b.x0 && x <= b.x1) return true;
  return false;
}

export function blockedByRiver(x, y) {
  return inRiver(y) && !onBridge(x);
}

/** Auf welcher Hälfte liegt y? (0 = unten, 1 = oben, -1 = Fluss/Brücke) */
export function halfOf(y) {
  if (y >= RIVER_Y1) return 0;
  if (y <= RIVER_Y0) return 1;
  return -1;
}

export function laneOf(x) {
  return x < MID_X ? 0 : 1;
}

export function inRect(r, x, y) {
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
}

export function inArena(x, y, margin = 0) {
  return x >= margin && x <= ARENA_W - margin && y >= margin && y <= ARENA_H - margin;
}

/**
 * Liefert die Rechtecke, in denen `side` Truppen/Gebäude platzieren darf.
 * enemyPrincessDown: [links zerstört?, rechts zerstört?] – Wachtürme des Gegners.
 */
export function placementRects(side, enemyPrincessDown = [false, false], kind = 'troop') {
  const rects = [OWN_ZONE[side]];
  if (kind === 'troop') {
    for (let lane = 0; lane < 2; lane++) if (enemyPrincessDown[lane]) rects.push(POCKETS[side][lane]);
  }
  return rects;
}

function overlapsObstacle(x, y, half, obstacles, pad) {
  for (const o of obstacles) {
    const h = o.half + half + pad;
    if (Math.abs(x - o.x) < h && Math.abs(y - o.y) < h) return true;
  }
  return false;
}

/**
 * Zentrale Platzierungsprüfung.
 * @param {object} p
 * @param {0|1} p.side
 * @param {number} p.x
 * @param {number} p.y
 * @param {'troop'|'building'|'spell'} p.kind
 * @param {boolean} [p.anywhere]  – Truppe darf überall hin (z. B. Tunnelgräber)
 * @param {number} [p.half]       – halbe Kantenlänge bei Gebäuden
 * @param {{x:number,y:number,half:number}[]} [p.obstacles] – lebende Türme/Gebäude
 * @param {boolean[]} [p.enemyPrincessDown]
 */
export function isPlacementValid(p) {
  const { side, x, y, kind } = p;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (side !== 0 && side !== 1) return false;
  if (kind === 'spell') return inArena(x, y);
  const obstacles = p.obstacles || [];
  if (kind === 'building') {
    const half = p.half || 1;
    if (!inRect(OWN_ZONE[side], x, y)) return false;
    // Gebäude dürfen nicht in den Fluss ragen und müssen ganz in der Arena liegen
    if (!inArena(x, y, half)) return false;
    if (side === 0 && y - half < RIVER_Y1) return false;
    if (side === 1 && y + half > RIVER_Y0) return false;
    return !overlapsObstacle(x, y, half, obstacles, 0);
  }
  // Truppen
  if (!inArena(x, y, 0.5)) return false;
  if (overlapsObstacle(x, y, 0, obstacles, 0.1)) return false;
  if (p.anywhere) return !blockedByRiver(x, y);
  for (const r of placementRects(side, p.enemyPrincessDown, 'troop')) if (inRect(r, x, y)) return true;
  return false;
}

/** Kanonische Koordinaten ↔ Sicht eines Spielers (Spieler 1 sieht die Arena um 180° gedreht). */
export function toView(side, x, y) {
  return side === 1 ? { x: ARENA_W - x, y: ARENA_H - y } : { x, y };
}
export const fromView = toView;
