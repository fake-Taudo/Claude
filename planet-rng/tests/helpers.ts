import { ACHIEVEMENTS } from '../src/config';
import { Rng } from '../src/core/rng';
import { createInitialState, type GameState } from '../src/core/state';

/** A fixed timestamp inside a clear-sky window is not guaranteed, tests pick their own. */
export const T0 = Date.UTC(2026, 0, 5, 12, 0, 0);

export function fresh(seed = 42, now = T0): { state: GameState; rng: Rng } {
  const state = createInitialState(seed, now);
  return { state, rng: new Rng(seed) };
}

/** Marks every achievement as unlocked so their rewards do not interfere with a test. */
export function withoutAchievements(state: GameState): GameState {
  state.achievements = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, 1]));
  return state;
}
