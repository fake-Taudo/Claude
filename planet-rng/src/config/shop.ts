import type { ItemDef, ShopConfig } from './types';

// The merchant fully restocks every rotation. Each tier rolls independently whether
// it appears and how many units are in stock.
export const SHOP: ShopConfig = {
  rotationMinutes: 5,
  tiers: [
    { id: 'common', name: 'Gewöhnlich', color: '#a3a9b8', chance: 0.92, minStock: 3, maxStock: 6 },
    { id: 'uncommon', name: 'Ungewöhnlich', color: '#5fd068', chance: 0.6, minStock: 2, maxStock: 3 },
    { id: 'rare', name: 'Selten', color: '#4aa3ff', chance: 0.35, minStock: 1, maxStock: 2 },
    { id: 'epic', name: 'Episch', color: '#b45cff', chance: 0.15, minStock: 1, maxStock: 1 },
    { id: 'legendary', name: 'Legendär', color: '#ffb340', chance: 0.07, minStock: 1, maxStock: 1 },
    { id: 'divine', name: 'Göttlich', color: '#c9a7ff', chance: 0.03, minStock: 1, maxStock: 1 },
  ],
};

export const ITEMS: ItemDef[] = [
  {
    id: 'speed_amulet', name: 'Geschwindigkeits-Amulett', icon: 'amulet', color: '#5cc8ff', shopTier: 'common', price: 15,
    description: '+10 % Roll-Geschwindigkeit für 10 Minuten', kind: 'consumable',
    use: { speedAdd: 0.1, durationSec: 600 },
  },
  {
    id: 'luck_amulet', name: 'Glücks-Amulett', icon: 'amulet', color: '#6dff9e', shopTier: 'common', price: 15,
    description: '+10 % Glück für 10 Minuten', kind: 'consumable',
    use: { luckAdd: 0.1, durationSec: 600 },
  },
  {
    id: 'sun_vial', name: 'Sonnenphiole', icon: 'sun', color: '#ffe08a', shopTier: 'uncommon', price: 40,
    description: 'Enthält einen fertigen Sonnen-Trank für deinen Vorrat', kind: 'bundle',
    grants: { potion: 'sun', count: 1 },
  },
  {
    id: 'hourglass', name: 'Chrono-Sanduhr', icon: 'hourglass', color: '#ffd76a', shopTier: 'rare', price: 60,
    description: '+30 % Roll-Geschwindigkeit für 5 Minuten', kind: 'consumable',
    use: { speedAdd: 0.3, durationSec: 300 },
  },
  {
    id: 'lost_amulet', name: 'Verlorenes Amulett', icon: 'amulet', color: '#b45cff', shopTier: 'epic', price: 100,
    description: '+500 % Glück für 25 Sekunden', kind: 'consumable',
    use: { luckAdd: 5, durationSec: 25 },
  },
  {
    id: 'comet_compass', name: 'Kometen-Kompass', icon: 'compass', color: '#7fd8ff', shopTier: 'legendary', price: 400,
    description: 'Ausgerüstet: +30 % Glück, +20 % Roll-Geschwindigkeit', kind: 'equipment', oneTime: true,
    equip: { luckAdd: 0.3, speedAdd: 0.2 },
  },
  {
    id: 'quantum_gauntlet', name: 'Quantum-Gauntlet', icon: 'gauntlet', color: '#c9a7ff', shopTier: 'divine', price: 1000,
    description: 'Ausgerüstet: +75 % Glück, +75 % Roll-Geschwindigkeit, +0,5 Gold Coins bei jeder gerollten Singularität',
    kind: 'equipment', oneTime: true,
    equip: { luckAdd: 0.75, speedAdd: 0.75, goldOnAura: { aura: 'singularitaet', gold: 0.5 } },
  },
];
