import type { RebirthLevelDef } from './types';

// Max three rebirths. Requirements are consumed. Multipliers of the reached level
// replace the previous level (they never stack). A rebirth resets all auras and all
// Gold Coins; potions, items, equipment, collection and statistics are kept.
export const REBIRTHS: RebirthLevelDef[] = [
  {
    level: 1, name: 'Erwachen', gold: 400,
    auras: [{ aura: 'eklipse', count: 5 }, { aura: 'urlicht', count: 2 }],
    luck: 1.25, speed: 1.3, goldMult: 1.5,
  },
  {
    level: 2, name: 'Aufstieg', gold: 4000,
    auras: [{ aura: 'singularitaet', count: 3 }, { aura: 'ewigkeit', count: 1 }],
    luck: 1.4, speed: 1.45, goldMult: 1.75,
  },
  {
    level: 3, name: 'Sternwerdung', gold: 30000,
    auras: [{ aura: 'ewigkeit', count: 3 }, { aura: 'quasar', count: 1 }],
    luck: 1.5, speed: 1.6, goldMult: 2,
  },
];
