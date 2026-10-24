import { QUEST_CHAINS } from '../../config';
import { chainTarget, QUEST_BY_ID } from '../../core/progress';
import type { GameState } from '../../core/state';

export function claimableCount(state: GameState): number {
  let n = 0;
  for (const q of state.quests.daily) {
    const def = QUEST_BY_ID[q.id];
    if (def && !q.claimed && q.progress >= def.target) n++;
  }
  for (const def of QUEST_CHAINS) {
    const c = state.quests.chains[def.id];
    if (c && c.progress >= chainTarget(def, c.level)) n++;
  }
  return n;
}
