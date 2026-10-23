// Central game store: owns the state, runs engine actions, emits events, autosaves.

import { GAME } from '../config';
import type { Ctx, GameEvent } from '../core/engine';
import { Rng } from '../core/rng';
import type { GameState } from '../core/state';
import { Emitter, Observable } from './emitter';
import type { Persistence } from './persistence';
import type { Settings } from './settings';

export interface ToastSpec {
  text: string;
  kind?: 'info' | 'success' | 'warn' | 'error';
  color?: string;
  icon?: string;
}

/** Everything other systems (UI, renderer, audio) can listen to. */
export type BusEvents = {
  game: GameEvent;
  /** Every roll start (manual, auto, quick). */
  rollStart: { aura: string; quick: boolean; auto: boolean; suspenseMs: number; duration: number };
  /** A roll animation starts (normal mode). */
  rollAnim: { duration: number; aura: string; lucky: boolean };
  /** A result is revealed to the player. */
  reveal: { aura: string; isNew: boolean; lucky: boolean; luck: number; quick: boolean; afterCutscene: boolean };
  cutscene: { aura: string; phase: 'start' | 'reveal' | 'end' };
  /** Timed moments inside a running cutscene (audio follows the picture). */
  cutsceneCue: { aura: string; cue: 'jingle' | 'pulse' | 'tick' | 'flash' | 'break' | 'skip'; kind?: string };
  toast: ToastSpec;
  settings: Settings;
  /** UI feedback hooks (particles at a screen position). */
  fx: { kind: 'coins' | 'sparkle' | 'brew' | 'craft' | 'buy' | 'error'; x: number; y: number; color?: string; amount?: number };
  rebirthFx: { level: number };
  stateReplaced: void;
};

export class GameStore extends Observable {
  readonly bus = new Emitter<BusEvents>();
  rng: Rng;
  private dirty = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    public state: GameState,
    public settings: Settings,
    private persistence: Persistence,
    private clock: () => number = Date.now,
  ) {
    super();
    this.rng = new Rng(state.rng);
  }

  now(): number {
    return this.clock();
  }

  /**
   * Runs an engine action and dispatches its events. `quiet` skips the UI
   * notification when the action produced no events (periodic ticks).
   */
  apply(action: (state: GameState, ctx: Ctx) => GameEvent[], save: 'none' | 'soon' | 'now' = 'soon', quiet = false): GameEvent[] {
    const events = action(this.state, { now: this.now(), rng: this.rng });
    this.state.rng = this.rng.getState();
    this.dirty = true;
    if (!quiet || events.length) this.changed();
    for (const e of events) this.bus.emit('game', e);
    if (save === 'now') this.saveNow();
    else if (save === 'soon') this.scheduleSave();
    return events;
  }

  /** Notify listeners after a direct mutation (rare, e.g. tutorial flags). */
  touch(save = true): void {
    this.dirty = true;
    this.changed();
    if (save) this.scheduleSave();
  }

  setSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    this.persistence.saveSettings(this.settings);
    this.changed();
    this.bus.emit('settings', this.settings);
  }

  toast(spec: ToastSpec | string): void {
    this.bus.emit('toast', typeof spec === 'string' ? { text: spec } : spec);
  }

  scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => this.saveNow(), 600);
  }

  saveNow(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.state.rng = this.rng.getState();
    if (this.persistence.save(this.state, this.now())) this.dirty = false;
  }

  /** Periodic autosave entry point. */
  autosave(): void {
    if (this.dirty) this.saveNow();
  }

  replaceState(state: GameState): void {
    this.state = state;
    this.rng = new Rng(state.rng);
    this.saveNow();
    this.changed();
    this.bus.emit('stateReplaced', undefined);
  }

  wipe(fresh: GameState): void {
    this.persistence.wipe();
    this.replaceState(fresh);
  }
}

export const AUTOSAVE_MS = GAME.save.autosaveMs;
