// Testdecks für die Ende-zu-Ende-Kämpfe: zusammen decken sie jede Mechanik-Gruppe ab,
// dazu je Kampf einen Champion bzw. Helden und zwei Evo-Karten (Plätze 1–2).
export const SCENARIOS = [
  {
    name: 'Kampf A',
    decks: [
      ['knight', 'archers', 'archer-queen', 'prince', 'fire-spirit', 'tombstone', 'fireball', 'the-log'],
      ['skeletons', 'bats', 'knight-hero', 'hog-rider', 'inferno-tower', 'electro-dragon', 'poison', 'goblin-barrel'],
    ],
  },
  {
    name: 'Kampf B',
    decks: [
      ['valkyrie', 'wizard', 'golden-knight', 'mega-knight', 'bandit', 'miner', 'zap', 'mirror'],
      ['tesla', 'bomber', 'giant-hero', 'golem', 'bowler', 'royal-ghost', 'tornado', 'elixir-collector'],
    ],
  },
  {
    name: 'Kampf C',
    decks: [
      ['goblin-drill', 'mortar', 'monk', 'fisherman', 'battle-ram', 'clone', 'graveyard', 'rage'],
      ['firecracker', 'goblin-cage', 'musketeer-hero', 'elixir-golem', 'electro-wizard', 'barbarian-barrel', 'void', 'goblin-curse'],
    ],
  },
];

// Mechanik-Gruppe → Karten, von denen mindestens eine in einem Kampf gespielt worden sein muss
export const GROUPS = {
  'Nahkampf/Fernkampf': ['knight', 'archers', 'valkyrie', 'wizard'],
  Ansturm: ['prince', 'battle-ram'],
  Kamikaze: ['fire-spirit', 'battle-ram'],
  'Spawner-Gebäude': ['tombstone', 'goblin-cage'],
  'Todes-Effekte': ['golem', 'elixir-golem', 'battle-ram'],
  'Rampe (Inferno)': ['inferno-tower'],
  'Kette/Betäubung': ['electro-dragon', 'electro-wizard', 'zap'],
  Durchschlag: ['bowler'],
  'Sprint/Sprung/Haken': ['bandit', 'mega-knight', 'fisherman'],
  'Unter der Erde': ['miner', 'goblin-drill'],
  'Tarnung/Versteckt': ['royal-ghost', 'tesla'],
  Flusssprung: ['hog-rider'],
  'Zauber: Schaden': ['fireball', 'poison', 'void'],
  'Zauber: Kontrolle': ['zap', 'tornado', 'goblin-curse'],
  'Zauber: Rollen': ['the-log', 'barbarian-barrel'],
  'Zauber: Beschwörung': ['goblin-barrel', 'graveyard'],
  'Zauber: Spezial': ['mirror', 'clone', 'rage'],
  Elixier: ['elixir-collector', 'elixir-golem'],
  Fernkampf: ['mortar', 'firecracker'],
};

export const CHAMPIONS = ['archer-queen', 'golden-knight', 'monk'];
export const HEROES = ['knight-hero', 'giant-hero', 'musketeer-hero'];
