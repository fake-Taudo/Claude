// Minimal typed event emitter.

type Handler<T> = (payload: T) => void;

export class Emitter<M extends Record<string, unknown>> {
  private handlers = new Map<keyof M, Set<Handler<never>>>();

  on<K extends keyof M>(type: K, fn: Handler<M[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(fn as Handler<never>);
    return () => set!.delete(fn as Handler<never>);
  }

  emit<K extends keyof M>(type: K, payload: M[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        (fn as Handler<M[K]>)(payload);
      } catch (e) {
        console.error(e);
      }
    }
  }
}

/** Observable value holder with batched change notification for the UI. */
export class Observable {
  version = 0;
  private listeners = new Set<() => void>();
  private scheduled = false;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Coalesces many changes within one task into a single notification. */
  changed(): void {
    this.version++;
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      for (const fn of [...this.listeners]) fn();
    });
  }
}
