// Vorgefertigte Startdecks (Platz 1+2 = Evo, Platz 3 = Champion/Held), damit man sofort spielen kann.
// Angelehnt an bekannte Archetypen des Originals.
export const STARTER_DECKS = Object.freeze([
  { name: 'Schweine-Zyklus', slots: ['skeletons', 'ice-spirit', 'musketeer-hero', 'hog-rider', 'cannon', 'ice-golem', 'fireball', 'the-log'] },
  { name: 'Golem-Druck', slots: ['baby-dragon', 'lumberjack', 'night-witch', 'golem', 'mega-minion', 'tornado', 'lightning', 'barbarian-barrel'] },
  { name: 'Fass-Köder', slots: ['goblin-barrel', 'knight', 'princess', 'goblin-gang', 'inferno-tower', 'rocket', 'the-log', 'ice-spirit'] },
  { name: 'X-Bogen', slots: ['tesla', 'archers', 'archer-queen', 'x-bow', 'knight', 'ice-spirit', 'fireball', 'the-log'] },
  { name: 'P.E.K.K.A.-Brücke', slots: ['pekka', 'battle-ram', 'golden-knight', 'bandit', 'electro-wizard', 'magic-archer', 'poison', 'zap'] },
]);

// Startdecks für den Modus „Chaos“: nur Karten aus data/chaos.json → cardPool (eigene Deckplätze, eigenes aktives Deck).
export const CHAOS_STARTER_DECKS = Object.freeze([
  { name: 'Chaos-Riese', slots: ['giant', 'musketeer', 'golden-knight', 'mini-pekka', 'bats', 'arrows', 'zap', 'fireball'] },
  { name: 'Chaos-Schweine', slots: ['hog-rider', 'valkyrie', 'bowler-hero', 'ice-spirit', 'tesla', 'musketeer', 'the-log', 'fireball'] },
  { name: 'Chaos-Golem', slots: ['golem', 'baby-dragon', 'electro-wizard', 'mega-minion', 'barbarians', 'inferno-dragon', 'poison', 'zap'] },
]);
