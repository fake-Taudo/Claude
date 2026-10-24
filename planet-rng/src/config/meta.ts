import type { AchievementDef, QuestChainDef, QuestTemplate } from './types';

// Achievements are granted automatically when the condition is met; the reward is
// paid out immediately. luckAdd rewards form the permanent "Erfolge" luck category.
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'rolls_100', name: 'Erste Schritte', description: 'Rolle 100-mal', icon: 'dice', condition: { type: 'stat', stat: 'rolls', value: 100 }, reward: { gold: 0.5, potions: { luck: 1 } } },
  { id: 'rolls_1k', name: 'Roll-Lehrling', description: 'Rolle 1.000-mal', icon: 'dice', condition: { type: 'stat', stat: 'rolls', value: 1000 }, reward: { gold: 3, potions: { luck: 3 } } },
  { id: 'rolls_10k', name: 'Roll-Veteran', description: 'Rolle 10.000-mal', icon: 'dice', condition: { type: 'stat', stat: 'rolls', value: 10000 }, reward: { gold: 20, potions: { sun: 1 } } },
  { id: 'rolls_100k', name: 'Roll-Meister', description: 'Rolle 100.000-mal', icon: 'dice', condition: { type: 'stat', stat: 'rolls', value: 100000 }, reward: { gold: 100, luckAdd: 0.05 } },
  { id: 'rolls_1m', name: 'Roll-Legende', description: 'Rolle 1.000.000-mal', icon: 'dice', condition: { type: 'stat', stat: 'rolls', value: 1000000 }, reward: { gold: 500, luckAdd: 0.1 } },

  { id: 'disc_10', name: 'Sammler I', description: 'Entdecke 10 verschiedene Auren', icon: 'book', condition: { type: 'stat', stat: 'discovered', value: 10 }, reward: { luckAdd: 0.01 } },
  { id: 'disc_20', name: 'Sammler II', description: 'Entdecke 20 verschiedene Auren', icon: 'book', condition: { type: 'stat', stat: 'discovered', value: 20 }, reward: { luckAdd: 0.02 } },
  { id: 'disc_30', name: 'Sammler III', description: 'Entdecke 30 verschiedene Auren', icon: 'book', condition: { type: 'stat', stat: 'discovered', value: 30 }, reward: { luckAdd: 0.03 } },
  { id: 'disc_40', name: 'Sammler IV', description: 'Entdecke 40 verschiedene Auren', icon: 'book', condition: { type: 'stat', stat: 'discovered', value: 40 }, reward: { luckAdd: 0.04 } },

  { id: 'tier_epic', name: 'Episch!', description: 'Finde eine Aura der Stufe Episch oder seltener', icon: 'star', condition: { type: 'tier', tier: 'epic' }, reward: { gold: 0.5 } },
  { id: 'tier_legendary', name: 'Eine Legende', description: 'Finde eine Aura der Stufe Legendär oder seltener', icon: 'star', condition: { type: 'tier', tier: 'legendary' }, reward: { gold: 2, potions: { luck: 2 } } },
  { id: 'tier_mythic', name: 'Mythos', description: 'Finde eine Aura der Stufe Mythisch oder seltener', icon: 'star', condition: { type: 'tier', tier: 'mythic' }, reward: { gold: 5, potions: { sun: 1 } } },
  { id: 'tier_divine', name: 'Göttlicher Funke', description: 'Finde eine Aura der Stufe Göttlich oder seltener', icon: 'star', condition: { type: 'tier', tier: 'divine' }, reward: { gold: 15, potions: { eclipse: 1 } } },
  { id: 'tier_transcendent', name: 'Jenseits der Grenzen', description: 'Finde eine Aura der Stufe Transzendent oder seltener', icon: 'star', condition: { type: 'tier', tier: 'transcendent' }, reward: { gold: 50, luckAdd: 0.03 } },
  { id: 'tier_galactic', name: 'Galaktisch', description: 'Finde eine Aura der Stufe Galaktisch oder seltener', icon: 'star', condition: { type: 'tier', tier: 'galactic' }, reward: { gold: 100, luckAdd: 0.03 } },
  { id: 'tier_universal', name: 'Universell', description: 'Finde eine Aura der Stufe Universell oder seltener', icon: 'star', condition: { type: 'tier', tier: 'universal' }, reward: { gold: 200, luckAdd: 0.05 } },
  { id: 'tier_omniversal', name: 'Allumfassend', description: 'Finde eine Aura der Stufe Omniversal oder seltener', icon: 'star', condition: { type: 'tier', tier: 'omniversal' }, reward: { gold: 1000, luckAdd: 0.1 } },

  { id: 'gold_10', name: 'Erste Münzen', description: 'Verdiene insgesamt 10 Gold Coins', icon: 'coin', condition: { type: 'stat', stat: 'goldEarned', value: 10 }, reward: { potions: { speed: 2 } } },
  { id: 'gold_100', name: 'Goldgräber', description: 'Verdiene insgesamt 100 Gold Coins', icon: 'coin', condition: { type: 'stat', stat: 'goldEarned', value: 100 }, reward: { potions: { sun: 1 } } },
  { id: 'gold_1000', name: 'Goldschatz', description: 'Verdiene insgesamt 1.000 Gold Coins', icon: 'coin', condition: { type: 'stat', stat: 'goldEarned', value: 1000 }, reward: { potions: { eclipse: 1 }, luckAdd: 0.02 } },

  { id: 'brew_1', name: 'Erster Sud', description: 'Braue deinen ersten Trank', icon: 'flask', condition: { type: 'stat', stat: 'brewed', value: 1 }, reward: { gold: 0.3 } },
  { id: 'brew_25', name: 'Alchemist', description: 'Braue 25 Tränke', icon: 'flask', condition: { type: 'stat', stat: 'brewed', value: 25 }, reward: { gold: 5, potions: { sun: 1 } } },
  { id: 'craft_1', name: 'Schmiedefeuer', description: 'Schmiede deine erste Aura', icon: 'anvil', condition: { type: 'stat', stat: 'crafted', value: 1 }, reward: { gold: 0.3 } },
  { id: 'craft_25', name: 'Meisterschmied', description: 'Schmiede 25 Auren', icon: 'anvil', condition: { type: 'stat', stat: 'crafted', value: 25 }, reward: { gold: 5 } },
  { id: 'buy_1', name: 'Kundschaft', description: 'Kaufe ein Item im Shop', icon: 'shop', condition: { type: 'stat', stat: 'purchases', value: 1 }, reward: { gold: 1 } },
  { id: 'buy_20', name: 'Stammkunde', description: 'Kaufe 20 Items im Shop', icon: 'shop', condition: { type: 'stat', stat: 'purchases', value: 20 }, reward: { gold: 15 } },
  { id: 'rebirth_1', name: 'Erwacht', description: 'Führe deinen ersten Rebirth durch', icon: 'rebirth', condition: { type: 'stat', stat: 'rebirths', value: 1 }, reward: { potions: { sun: 2 } } },
  { id: 'rebirth_3', name: 'Sternwerdung', description: 'Erreiche Rebirth 3', icon: 'rebirth', condition: { type: 'stat', stat: 'rebirths', value: 3 }, reward: { potions: { divine: 1 }, luckAdd: 0.05 } },
  { id: 'cutscene_1', name: 'Großes Kino', description: 'Erlebe deine erste Cutscene', icon: 'film', condition: { type: 'stat', stat: 'cutscenes', value: 1 }, reward: { gold: 5 } },
  { id: 'biomes_all', name: 'Wetterkundig', description: 'Erlebe alle 8 Biome', icon: 'globe', condition: { type: 'stat', stat: 'biomesSeen', value: 8 }, reward: { gold: 10, luckAdd: 0.02 } },
  { id: 'lucky_100', name: 'Glückspilz', description: 'Erlebe 100 Glücks-Rolls (jeder 10. Roll)', icon: 'clover', condition: { type: 'stat', stat: 'luckyRolls', value: 100 }, reward: { potions: { luck: 3 } } },
  { id: 'play_60', name: 'Eine Stunde im All', description: 'Spiele 60 Minuten', icon: 'clock', condition: { type: 'stat', stat: 'playMinutes', value: 60 }, reward: { gold: 2 } },
  { id: 'play_600', name: 'Raumfahrer', description: 'Spiele 10 Stunden', icon: 'clock', condition: { type: 'stat', stat: 'playMinutes', value: 600 }, reward: { gold: 25, potions: { sun: 2 } } },
];

// Daily quests: every local day three templates are drawn (deterministic per save seed).
export const DAILY_QUEST_COUNT = 3;

export const QUEST_TEMPLATES: QuestTemplate[] = [
  { id: 'roll_300', text: 'Rolle {n}-mal', type: 'roll', target: 300, reward: { gold: 1, potions: { luck: 1 } } },
  { id: 'roll_800', text: 'Rolle {n}-mal', type: 'roll', target: 800, reward: { gold: 2.5, potions: { speed: 2 } } },
  { id: 'rare_5', text: 'Finde {n} Auren der Stufe {tier} oder höher', type: 'rollTier', tier: 'rare', target: 5, reward: { gold: 1, potions: { luck: 1 } } },
  { id: 'epic_3', text: 'Finde {n} Auren der Stufe {tier} oder höher', type: 'rollTier', tier: 'epic', target: 3, reward: { gold: 2, potions: { luck: 2 } } },
  { id: 'legendary_1', text: 'Finde {n} Aura der Stufe {tier} oder höher', type: 'rollTier', tier: 'legendary', target: 1, reward: { gold: 3, potions: { sun: 1 } } },
  { id: 'brew_2', text: 'Braue {n} Tränke', type: 'brew', target: 2, reward: { gold: 1.5 } },
  { id: 'drink_3', text: 'Trinke {n} Tränke', type: 'drink', target: 3, reward: { gold: 1.5 } },
  { id: 'craft_2', text: 'Schmiede {n} Auren', type: 'craft', target: 2, reward: { gold: 1.5, potions: { luck: 1 } } },
  { id: 'sell_3', text: 'Verkaufe Auren für {n} Gold Coins', type: 'sellGold', target: 3, reward: { gold: 1.5 } },
  { id: 'buy_1', text: 'Kaufe {n} Item im Shop', type: 'buy', target: 1, reward: { gold: 3 } },
  { id: 'biome_150', text: 'Rolle {n}-mal während eines Bioms', type: 'biomeRolls', target: 150, reward: { gold: 2, potions: { luck: 2 } } },
  { id: 'lucky_25', text: 'Erlebe {n} Glücks-Rolls', type: 'luckyRolls', target: 25, reward: { gold: 1.5, potions: { speed: 1 } } },
];

// Repeatable quest chains: each completion raises the level and the target.
export const QUEST_CHAINS: QuestChainDef[] = [
  { id: 'chain_rolls', name: 'Roll-Marathon', text: 'Rolle {n}-mal', type: 'roll', base: 1000, growth: 1.6, gold: 3, goldGrowth: 1.4, potions: { luck: 2 } },
  { id: 'chain_legend', name: 'Schatzsucher', text: 'Finde {n} Auren der Stufe {tier} oder höher', type: 'rollTier', tier: 'legendary', base: 2, growth: 1.5, gold: 4, goldGrowth: 1.4, potions: { sun: 1 } },
  { id: 'chain_brew', name: 'Alchemie', text: 'Braue {n} Tränke', type: 'brew', base: 3, growth: 1.5, gold: 2, goldGrowth: 1.35 },
  { id: 'chain_trade', name: 'Handelsroute', text: 'Verkaufe Auren für {n} Gold Coins', type: 'sellGold', base: 5, growth: 1.7, gold: 3, goldGrowth: 1.5 },
];
