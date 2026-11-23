// localStorage persistence with a backup slot and defensive loading.

import { GAME } from '../config';
import { SaveError, deserialize, serialize } from '../core/save';
import { createInitialState, type GameState } from '../core/state';
import { DEFAULT_SETTINGS, deviceDefaults, sanitizeSettings, type Settings } from './settings';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** In-memory fallback when localStorage is unavailable (private mode, file:// quirks). */
class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

export function getStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const ls = window.localStorage;
    const probe = '__planet_rng_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { storage: ls, persistent: true };
  } catch {
    return { storage: new MemoryStorage(), persistent: false };
  }
}

export interface LoadResult {
  state: GameState;
  isNew: boolean;
  /** User facing warning (corrupt save recovered from backup etc.). */
  warning?: string;
}

export class Persistence {
  private lastBackup = 0;

  constructor(private storage: StorageLike) {}

  load(now: number): LoadResult {
    const main = this.storage.getItem(GAME.save.key);
    if (main) {
      try {
        return { state: deserialize(main, now), isNew: false };
      } catch (e) {
        this.storage.setItem(GAME.save.corruptKey, main);
        const backup = this.storage.getItem(GAME.save.backupKey);
        if (backup) {
          try {
            return {
              state: deserialize(backup, now),
              isNew: false,
              warning: `Der Spielstand war beschädigt (${(e as Error).message}). Das letzte Backup wurde geladen.`,
            };
          } catch {
            /* fall through */
          }
        }
        return {
          state: createInitialState(randomSeed(), now),
          isNew: true,
          warning: `Der Spielstand konnte nicht geladen werden (${e instanceof SaveError ? e.message : 'unbekannter Fehler'}). Ein neues Spiel wurde gestartet, der alte Stand ist gesichert.`,
        };
      }
    }
    return { state: createInitialState(randomSeed(), now), isNew: true };
  }

  save(state: GameState, now: number): boolean {
    try {
      const json = serialize(state);
      this.storage.setItem(GAME.save.key, json);
      if (now - this.lastBackup >= GAME.save.backupEveryMs) {
        this.storage.setItem(GAME.save.backupKey, json);
        this.lastBackup = now;
      }
      return true;
    } catch {
      return false;
    }
  }

  wipe(): void {
    for (const key of [GAME.save.key, GAME.save.backupKey, GAME.save.corruptKey]) this.storage.removeItem(key);
  }

  loadSettings(): Settings {
    try {
      const raw = this.storage.getItem(GAME.save.settingsKey);
      if (!raw) return { ...DEFAULT_SETTINGS, ...deviceDefaults() };
      const parsed = JSON.parse(raw);
      const s = sanitizeSettings(parsed);
      // Settings saved before "Lichtblitze reduzieren" existed follow prefers-reduced-motion.
      if (parsed && typeof parsed === 'object' && !('reduceFlashes' in parsed)) s.reduceFlashes = deviceDefaults().reduceFlashes ?? false;
      return s;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(settings: Settings): void {
    try {
      this.storage.setItem(GAME.save.settingsKey, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }
}

export function randomSeed(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0];
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
}
