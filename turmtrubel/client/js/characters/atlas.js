// Texture-Atlas pro Qualitätsstufe: Seiten (Canvas) mit Regal-Packer, Speicherbudget und seitenweisem LRU.

function makeCanvas(w, h) {
  if (typeof document === 'undefined' && typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
export { makeCanvas };

export class Atlas {
  /**
   * @param {{size: number, budgetMB: number, onEvict?: (page) => void}} o
   */
  constructor(o) {
    this.size = o.size;
    this.budget = o.budgetMB * 1024 * 1024;
    this.onEvict = o.onEvict || (() => {});
    this.pages = [];
    this.bytes = 0;
    this.serial = 0;
  }
  /** Platz für w×h suchen; null, wenn zu groß für eine Seite. */
  alloc(w, h, now) {
    const S = this.size;
    if (w > S || h > S) return null;
    const gw = w + 1;
    const gh = h + 1;
    for (let i = this.pages.length - 1; i >= Math.max(0, this.pages.length - 2); i--) {
      const r = this.place(this.pages[i], gw, gh);
      if (r) {
        this.pages[i].used = now;
        return r;
      }
    }
    const page = { id: ++this.serial, canvas: makeCanvas(S, S), shelves: [], y: 0, used: now, frames: 0 };
    page.ctx = page.canvas.getContext('2d');
    this.pages.push(page);
    this.bytes += S * S * 4;
    this.evict(page);
    return this.place(page, gw, gh);
  }
  place(page, w, h) {
    const S = this.size;
    for (const sh of page.shelves) {
      if (h <= sh.h && h >= sh.h * 0.6 && sh.x + w <= S) {
        const r = { page, x: sh.x, y: sh.y, w: w - 1, h: h - 1 };
        sh.x += w;
        page.frames++;
        return r;
      }
    }
    if (page.y + h <= S) {
      const sh = { y: page.y, h, x: w };
      page.shelves.push(sh);
      page.y += h;
      page.frames++;
      return { page, x: 0, y: sh.y, w: w - 1, h: h - 1 };
    }
    return null;
  }
  /** Älteste Seiten freigeben, bis das Budget wieder passt (die gerade neue Seite bleibt). */
  evict(keep) {
    while (this.bytes > this.budget && this.pages.length > 1) {
      let oldest = null;
      for (const p of this.pages) if (p !== keep && (!oldest || p.used < oldest.used)) oldest = p;
      if (!oldest) break;
      this.pages.splice(this.pages.indexOf(oldest), 1);
      this.bytes -= this.size * this.size * 4;
      this.onEvict(oldest);
      oldest.canvas.width = oldest.canvas.height = 1;
    }
  }
  clear() {
    for (const p of this.pages) this.onEvict(p);
    this.pages = [];
    this.bytes = 0;
  }
}
