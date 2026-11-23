import { useEffect, useReducer, useRef, useState } from 'preact/hooks';
import { controller, game, ui } from '../game/app';
import type { GameState } from '../core/state';
import type { BusEvents } from '../store/store';
import type { UiStore } from '../store/ui';

function useForceUpdate(): () => void {
  const [, force] = useReducer((x: number) => x + 1, 0);
  return force as () => void;
}

/**
 * Subscribes to an observable store. Changes that happen between the first render and
 * the (deferred) subscription are caught by comparing the version afterwards.
 */
function useObservable(store: { version: number; subscribe(fn: () => void): () => void }): void {
  const force = useForceUpdate();
  const seen = useRef(store.version);
  seen.current = store.version;
  useEffect(() => {
    const unsub = store.subscribe(force);
    if (store.version !== seen.current) force();
    return unsub;
  }, []);
}

/** Re-renders whenever the game state changes. */
export function useGame(): GameState {
  useObservable(game);
  return game.state;
}

/** Re-renders whenever the UI state changes. */
export function useUi(): UiStore {
  useObservable(ui);
  return ui;
}

export function useController() {
  const force = useForceUpdate();
  useEffect(() => controller.onChange(force), []);
  return controller;
}

/** Current time, refreshed every `intervalMs` (for countdowns). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => game.now());
  useEffect(() => {
    const id = setInterval(() => setNow(game.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useBus<K extends keyof BusEvents>(type: K, handler: (payload: BusEvents[K]) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => game.bus.on(type, (p) => ref.current(p)), [type]);
}
