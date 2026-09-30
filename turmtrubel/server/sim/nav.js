// Navigationsraster (0,5 Felder pro Zelle) mit A*-Pfadsuche.
// Zellwerte: 0 = frei, -1 = Fluss, >0 = ID des blockierenden Gebäudes/Turms.
import { ARENA_W, ARENA_H, RIVER_Y0, RIVER_Y1, onBridge } from '../../shared/arena.js';

export const CELL = 0.5;
export const GW = Math.round(ARENA_W / CELL);
export const GH = Math.round(ARENA_H / CELL);
const INFLATE = 0.2;
const SQRT2 = Math.SQRT2;
const MAX_ITER = 5000;

export const MODE_GROUND = 0;
export const MODE_JUMP = 1; // darf den Fluss überqueren

export class NavGrid {
  constructor() {
    const n = GW * GH;
    this.cells = new Int32Array(n);
    this.g = new Float64Array(n);
    this.came = new Int32Array(n);
    this.stamp = new Int32Array(n);
    this.closed = new Int32Array(n);
    this.search = 0;
    this.heap = new Int32Array(n * 8);
    this.heapF = new Float64Array(n * 8);
    this.version = 0;
    this.rebuild([]);
  }

  /** @param {{id:number,x:number,y:number,half:number}[]} structures */
  rebuild(structures) {
    const c = this.cells;
    c.fill(0);
    for (let cy = 0; cy < GH; cy++) {
      const y = (cy + 0.5) * CELL;
      if (y <= RIVER_Y0 || y >= RIVER_Y1) continue;
      for (let cx = 0; cx < GW; cx++) {
        const x = (cx + 0.5) * CELL;
        if (!onBridge(x)) c[cy * GW + cx] = -1;
      }
    }
    for (const s of structures) {
      const h = s.half + INFLATE;
      const cx0 = Math.max(0, Math.floor((s.x - h) / CELL));
      const cx1 = Math.min(GW - 1, Math.floor((s.x + h) / CELL));
      const cy0 = Math.max(0, Math.floor((s.y - h) / CELL));
      const cy1 = Math.min(GH - 1, Math.floor((s.y + h) / CELL));
      for (let cy = cy0; cy <= cy1; cy++) {
        const y = (cy + 0.5) * CELL;
        if (Math.abs(y - s.y) >= h) continue;
        for (let cx = cx0; cx <= cx1; cx++) {
          const x = (cx + 0.5) * CELL;
          if (Math.abs(x - s.x) >= h) continue;
          c[cy * GW + cx] = s.id;
        }
      }
    }
    this.version++;
  }

  index(x, y) {
    let cx = Math.floor(x / CELL);
    let cy = Math.floor(y / CELL);
    if (cx < 0) cx = 0;
    else if (cx >= GW) cx = GW - 1;
    if (cy < 0) cy = 0;
    else if (cy >= GH) cy = GH - 1;
    return cy * GW + cx;
  }

  passable(i, mode, allowId) {
    const v = this.cells[i];
    if (v === 0) return true;
    if (v === -1) return mode === MODE_JUMP;
    return v === allowId;
  }

  /** Prüft, ob die Strecke frei ist (Abtastung alle 0,25 Felder). */
  lineClear(x0, y0, x1, y1, mode, allowId) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.hypot(dx, dy);
    const n = Math.ceil(d / 0.25);
    const startCell = this.index(x0, y0);
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const i = this.index(x0 + dx * t, y0 + dy * t);
      if (i === startCell) continue;
      if (!this.passable(i, mode, allowId)) return false;
    }
    return true;
  }

  nearestPassable(i, mode, allowId) {
    const cx0 = i % GW;
    const cy0 = (i / GW) | 0;
    for (let r = 1; r < 12; r++) {
      let best = -1;
      let bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const cx = cx0 + dx;
          const cy = cy0 + dy;
          if (cx < 0 || cy < 0 || cx >= GW || cy >= GH) continue;
          const j = cy * GW + cx;
          if (!this.passable(j, mode, allowId)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = j;
          }
        }
      }
      if (best >= 0) return best;
    }
    return i;
  }

  /** A* von (x0,y0) nach (x1,y1). Gibt geglättete Wegpunkte zurück oder null. */
  findPath(x0, y0, x1, y1, mode, allowId) {
    const start = this.index(x0, y0);
    let goal = this.index(x1, y1);
    if (!this.passable(goal, mode, allowId)) goal = this.nearestPassable(goal, mode, allowId);
    if (start === goal) return [{ x: x1, y: y1 }];

    const s = ++this.search;
    const { g, came, stamp, closed, heap, heapF } = this;
    let size = 0;
    const gx = goal % GW;
    const gy = (goal / GW) | 0;
    const h = (i) => {
      const dx = Math.abs((i % GW) - gx);
      const dy = Math.abs(((i / GW) | 0) - gy);
      return (dx + dy + (SQRT2 - 2) * Math.min(dx, dy));
    };
    const push = (i, f) => {
      let k = size++;
      heap[k] = i;
      heapF[k] = f;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (heapF[p] <= heapF[k]) break;
        [heap[p], heap[k]] = [heap[k], heap[p]];
        [heapF[p], heapF[k]] = [heapF[k], heapF[p]];
        k = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      size--;
      heap[0] = heap[size];
      heapF[0] = heapF[size];
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < size && heapF[l] < heapF[m]) m = l;
        if (r < size && heapF[r] < heapF[m]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        [heapF[m], heapF[k]] = [heapF[k], heapF[m]];
        k = m;
      }
      return top;
    };

    stamp[start] = s;
    g[start] = 0;
    came[start] = -1;
    push(start, h(start));
    let found = false;
    let iter = 0;
    while (size > 0 && iter++ < MAX_ITER && size < heap.length - 8) {
      const cur = pop();
      if (closed[cur] === s) continue;
      closed[cur] = s;
      if (cur === goal) {
        found = true;
        break;
      }
      const cx = cur % GW;
      const cy = (cur / GW) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          const ni = ny * GW + nx;
          if (closed[ni] === s) continue;
          if (!this.passable(ni, mode, allowId)) continue;
          if (dx && dy) {
            // keine Ecken schneiden
            if (!this.passable(cy * GW + nx, mode, allowId) || !this.passable(ny * GW + cx, mode, allowId)) continue;
          }
          const ng = g[cur] + (dx && dy ? SQRT2 : 1);
          if (stamp[ni] !== s || ng < g[ni]) {
            stamp[ni] = s;
            g[ni] = ng;
            came[ni] = cur;
            push(ni, ng + h(ni));
          }
        }
      }
    }
    if (!found) return null;

    const cellsPath = [];
    for (let c = goal; c !== -1; c = came[c]) cellsPath.push(c);
    cellsPath.reverse();
    const pts = cellsPath.map((c) => ({ x: ((c % GW) + 0.5) * CELL, y: (((c / GW) | 0) + 0.5) * CELL }));
    pts[pts.length - 1] = { x: x1, y: y1 };

    // Glätten: zum weitesten direkt erreichbaren Punkt springen
    const out = [];
    let ax = x0;
    let ay = y0;
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !this.lineClear(ax, ay, pts[j].x, pts[j].y, mode, allowId)) j--;
      out.push(pts[j]);
      ax = pts[j].x;
      ay = pts[j].y;
      i = j;
    }
    if (!out.length) out.push(pts[pts.length - 1]);
    return out;
  }
}
