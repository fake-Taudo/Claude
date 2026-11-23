// Aura lab state (only active with ?lab=1 in the URL). The lab shows an aura on the stage
// without touching the save game.

export const LAB_ENABLED = typeof location !== 'undefined' && /[?&]lab=1/.test(location.search);

type Listener = () => void;

class LabState {
  aura: string | null = null;
  private listeners = new Set<Listener>();

  set(id: string | null): void {
    this.aura = id;
    for (const l of this.listeners) l();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const labState = new LabState();
