import type { PotionDef, RecipeDef } from './types';

// Potions: brewed in the workshop (consumes auras), stored in the potion slot,
// drunk any time. Drinking more of the same potion stacks duration / charges.
export const POTIONS: PotionDef[] = [
  {
    id: 'luck', name: 'Glückstrank', icon: 'clover', color: '#8fd46c',
    description: '+50 % Glück für die nächsten 50 Rolls',
    ingredients: [{ aura: 'flut', count: 5 }, { aura: 'frost', count: 1 }],
    effect: { luck: 1.5, rolls: 50 },
  },
  {
    id: 'speed', name: 'Geschwindigkeitstrank', icon: 'bolt', color: '#b39dff',
    description: '+50 % Roll-Geschwindigkeit für 30 Sekunden',
    ingredients: [{ aura: 'frost', count: 1 }, { aura: 'asche', count: 1 }],
    effect: { speed: 1.5, durationSec: 30 },
  },
  {
    id: 'eclipse', name: 'Eclipse-Potion', icon: 'moon', color: '#c9a7ff',
    description: 'Der nächste Roll hat 100x Glück',
    ingredients: [{ aura: 'eklipse', count: 5 }, { aura: 'nebula', count: 15 }, { aura: 'sturm', count: 30 }, { aura: 'asche', count: 60 }],
    effect: { luck: 100, rolls: 1 },
  },
  {
    id: 'sun', name: 'Sonnen-Trank', icon: 'sun', color: '#ffe08a',
    description: '+200 % Glück (3x) und 1,5x Roll-Geschwindigkeit für 180 Sekunden',
    ingredients: [{ aura: 'sonnenkern', count: 20 }, { aura: 'nebula', count: 15 }, { aura: 'sturm', count: 30 }],
    effect: { luck: 3, speed: 1.5, durationSec: 180 },
  },
  {
    id: 'divine', name: 'Göttlicher Trank', icon: 'starburst', color: '#fff2b8',
    description: 'Der nächste Roll hat 500x Glück',
    ingredients: [{ aura: 'ewigkeit', count: 1 }, { aura: 'singularitaet', count: 5 }, { aura: 'urlicht', count: 10 }],
    effect: { luck: 500, rolls: 1 },
  },
];

// Aura forge: turns several auras into another aura. Results go straight to the
// inventory and never count as a roll. Any number of recipes is supported.
export const RECIPES: RecipeDef[] = [
  { id: 'craft_sturm', result: 'sturm', count: 1, ingredients: [{ aura: 'flut', count: 1 }, { aura: 'moos', count: 4 }, { aura: 'staub', count: 12 }] },
  { id: 'craft_nebula', result: 'nebula', count: 1, ingredients: [{ aura: 'frost', count: 5 }, { aura: 'sturm', count: 2 }, { aura: 'flut', count: 15 }] },
];
