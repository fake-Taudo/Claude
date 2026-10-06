// Sprite-Cache: einmal gerenderte Figuren/Frames als Canvas, LRU mit Speicherbudget (Megapixel → MB),
// begrenzte Anzahl Neuerzeugungen pro Frame (der Rest wird im nächsten Frame gebaut, bis dahin zeichnet der
// Aufrufer direkt). Schlüssel enthalten Größe in Gerätepixeln, damit Zoom/DPR-Wechsel neue Einträge erzeugen.

export class SpriteCache {
  constructor({ budgetMB = 24, buildsPerFrame = 8, frameMs = 6 } = {}) {
    this.map = new Map();
    this.bytes = 0;
    this.budget = budgetMB * 1024 * 1024;
    this.buildsPerFrame = buildsPerFrame;
    this.frameMs = frameMs;
    this.frameStart = 0;
    this.builds = 0;
    this.stats = { hits: 0, misses: 0, built: 0, evicted: 0, deferred: 0 };
  }

  setBudget(mb) {
    this.budget = mb * 1024 * 1024;
    this.evict();
  }

  /** Zu Beginn jedes Frames aufrufen. */
  newFrame() {
    this.builds = 0;
    this.frameStart = typeof performance !== 'undefined' ? performance.now() : 0;
  }

  /** Eintrag holen (und als zuletzt benutzt markieren). */
  get(key) {
    const e = this.map.get(key);
    if (e) {
      this.map.delete(key);
      this.map.set(key, e);
      this.stats.hits++;
    }
    return e;
  }

  /**
   * Eintrag holen oder bauen. builder() → { canvas, ox, oy, ... }.
   * force = true baut auch über dem Frame-Limit (z. B. im Ladescreen).
   * Gibt null zurück, wenn das Limit erreicht ist (Aufrufer zeichnet dann direkt).
   */
  obtain(key, builder, force = false) {
    const e = this.get(key);
    if (e) return e;
    this.stats.misses++;
    // Frame-Limit: höchstens N Neubauten und ein Zeitbudget pro Frame (mindestens einer kommt immer durch)
    if (!force && (this.builds >= this.buildsPerFrame || (this.builds > 0 && performance.now() - this.frameStart > this.frameMs))) {
      this.stats.deferred++;
      return null;
    }
    this.builds++;
    const made = builder();
    if (!made) return null;
    this.set(key, made);
    this.stats.built++;
    return made;
  }

  set(key, e) {
    const old = this.map.get(key);
    if (old) this.bytes -= old.bytes || 0;
    e.bytes = (e.canvas ? e.canvas.width * e.canvas.height * 4 : 0) + (e.white ? e.white.width * e.white.height * 4 : 0);
    this.map.set(key, e);
    this.bytes += e.bytes;
    this.evict();
  }

  /** Zusatz-Speicher eines Eintrags nachtragen (z. B. lazily erzeugte weiße Silhouette). */
  grow(e, extraBytes) {
    e.bytes = (e.bytes || 0) + extraBytes;
    this.bytes += extraBytes;
    this.evict();
  }

  evict() {
    while (this.bytes > this.budget && this.map.size > 1) {
      const k = this.map.keys().next().value;
      const e = this.map.get(k);
      this.map.delete(k);
      this.bytes -= e.bytes || 0;
      this.stats.evicted++;
    }
  }

  clear() {
    this.map.clear();
    this.bytes = 0;
  }

  info() {
    return { entries: this.map.size, mb: Math.round((this.bytes / 1048576) * 10) / 10, ...this.stats };
  }
}

/** Gemeinsamer Cache für Figuren, Gebäude und Türme. */
export const sprites = new SpriteCache({ budgetMB: 40, buildsPerFrame: 8 });
