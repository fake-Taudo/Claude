import type { TierDef, TierId } from './types';

// Rarity tiers in ascending order. Colors are used consistently across all views.
// staging controls how loud a drop of this tier is presented.
export const TIERS: TierDef[] = [
  {
    id: 'common', name: 'Gewöhnlich', color: '#a3a9b8', color2: '#6b7180', rank: 0,
    staging: { level: 1, suspenseMs: 0, flash: 0, shake: 0, burst: 10, shockwaves: 0, bannerMs: 1700, cutsceneExtraMs: 0 },
  },
  {
    id: 'uncommon', name: 'Ungewöhnlich', color: '#5fd068', color2: '#2f8f4a', rank: 1,
    staging: { level: 1, suspenseMs: 0, flash: 0, shake: 0, burst: 14, shockwaves: 0, bannerMs: 1900, cutsceneExtraMs: 0 },
  },
  {
    id: 'rare', name: 'Selten', color: '#4aa3ff', color2: '#2a5bd9', rank: 2,
    staging: { level: 1, suspenseMs: 80, flash: 0.12, shake: 0, burst: 20, shockwaves: 1, bannerMs: 2100, cutsceneExtraMs: 0 },
  },
  {
    id: 'epic', name: 'Episch', color: '#b45cff', color2: '#6a2fd9', rank: 3,
    staging: { level: 2, suspenseMs: 260, flash: 0.3, shake: 0.12, burst: 30, shockwaves: 1, bannerMs: 2400, cutsceneExtraMs: 0 },
  },
  {
    id: 'legendary', name: 'Legendär', color: '#ffb340', color2: '#ff6a1a', rank: 4,
    staging: { level: 2, suspenseMs: 520, flash: 0.5, shake: 0.35, burst: 46, shockwaves: 2, bannerMs: 2600, cutsceneExtraMs: 0, vibrate: [40] },
  },
  {
    id: 'mythic', name: 'Mythisch', color: '#ff7ad9', color2: '#ffffff', rank: 5,
    staging: { level: 3, suspenseMs: 900, flash: 0.8, shake: 0.6, burst: 70, shockwaves: 3, bannerMs: 3600, cutsceneExtraMs: 0, vibrate: [60, 40, 90] },
  },
  {
    id: 'divine', name: 'Göttlich', color: '#c9a7ff', color2: '#fff6cf', rank: 6,
    staging: { level: 4, suspenseMs: 1100, flash: 1, shake: 0.75, burst: 90, shockwaves: 4, bannerMs: 4200, cutsceneExtraMs: 0, vibrate: [80, 50, 120] },
  },
  {
    id: 'transcendent', name: 'Transzendent', color: '#fff2b8', color2: '#ffd76a', rank: 7,
    staging: { level: 4, suspenseMs: 1100, flash: 1, shake: 0.8, burst: 100, shockwaves: 4, bannerMs: 4400, cutsceneExtraMs: 700, vibrate: [80, 50, 140] },
  },
  {
    id: 'galactic', name: 'Galaktisch', color: '#8ecfff', color2: '#3a6bff', rank: 8,
    staging: { level: 4, suspenseMs: 1200, flash: 1, shake: 0.85, burst: 110, shockwaves: 5, bannerMs: 4600, cutsceneExtraMs: 1200, vibrate: [90, 50, 160] },
  },
  {
    id: 'universal', name: 'Universell', color: '#d9b3ff', color2: '#4ac9ff', rank: 9,
    staging: { level: 4, suspenseMs: 1200, flash: 1, shake: 0.9, burst: 120, shockwaves: 5, bannerMs: 4800, cutsceneExtraMs: 1700, vibrate: [100, 50, 180] },
  },
  {
    id: 'primordial', name: 'Uranfänglich', color: '#ffb347', color2: '#ff4500', rank: 10,
    staging: { level: 4, suspenseMs: 1300, flash: 1, shake: 0.95, burst: 130, shockwaves: 6, bannerMs: 5000, cutsceneExtraMs: 2200, vibrate: [100, 60, 200] },
  },
  {
    id: 'entropic', name: 'Entropisch', color: '#9aa3b8', color2: '#4a5060', rank: 11,
    staging: { level: 4, suspenseMs: 1300, flash: 0.9, shake: 0.9, burst: 130, shockwaves: 6, bannerMs: 5000, cutsceneExtraMs: 2700, vibrate: [120, 60, 200] },
  },
  {
    id: 'paradox', name: 'Paradox', color: '#ff8f6f', color2: '#4ac9ff', rank: 12,
    staging: { level: 4, suspenseMs: 1400, flash: 1, shake: 1, burst: 140, shockwaves: 7, bannerMs: 5200, cutsceneExtraMs: 3200, vibrate: [120, 60, 220] },
  },
  {
    id: 'omniversal', name: 'Omniversal', color: '#ffffff', color2: '#ff7ad9', rank: 13,
    staging: { level: 4, suspenseMs: 1500, flash: 1, shake: 1, burst: 160, shockwaves: 10, bannerMs: 5600, cutsceneExtraMs: 4200, vibrate: [150, 60, 250] },
  },
  {
    id: 'absolute', name: 'Absolut', color: '#f2f2f2', color2: '#1a1a1a', rank: 14,
    staging: { level: 4, suspenseMs: 1600, flash: 1, shake: 1, burst: 170, shockwaves: 10, bannerMs: 6000, cutsceneExtraMs: 5200, vibrate: [150, 60, 300] },
  },
  {
    id: 'infinite', name: 'Unendlich', color: '#a0f0ff', color2: '#ffd76a', rank: 15,
    staging: { level: 4, suspenseMs: 1800, flash: 1, shake: 1, burst: 200, shockwaves: 12, bannerMs: 6500, cutsceneExtraMs: 7000, vibrate: [200, 80, 400] },
  },
];

export const TIER_BY_ID: Record<TierId, TierDef> = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<TierId, TierDef>;
