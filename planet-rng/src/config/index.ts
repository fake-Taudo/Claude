import { AURAS } from './auras';
import { CUTSCENE_BY_AURA } from './cutscenes';
import { BIOMES } from './biomes';
import { ACHIEVEMENTS, QUEST_CHAINS, QUEST_TEMPLATES } from './meta';
import { POTIONS, RECIPES } from './potions';
import { REBIRTHS } from './rebirth';
import { ITEMS, SHOP } from './shop';
import { TIERS, TIER_BY_ID } from './tiers';
import type { AuraDef, BiomeDef, ItemDef, PotionDef, RecipeDef, ShopTierDef, TierDef } from './types';

export * from './types';
export { AURAS, BIOMES, ACHIEVEMENTS, QUEST_CHAINS, QUEST_TEMPLATES, POTIONS, RECIPES, REBIRTHS, ITEMS, SHOP, TIERS, TIER_BY_ID };
export { GAME } from './game';
export { DAILY_QUEST_COUNT } from './meta';
export { NPC_NAMES } from './feed';

function byId<T extends { id: string }>(list: T[]): Record<string, T> {
  return Object.fromEntries(list.map((x) => [x.id, x]));
}

// Every aura from 1 in 10.000 gets its cutscene definition attached.
for (const a of AURAS) {
  const def = CUTSCENE_BY_AURA[a.id];
  if (def) a.cutscene = a.cutsceneTier ? { ...def, tier: a.cutsceneTier } : def;
}

export const AURA_BY_ID: Record<string, AuraDef> = byId(AURAS);
export const POTION_BY_ID: Record<string, PotionDef> = byId(POTIONS);
export const ITEM_BY_ID: Record<string, ItemDef> = byId(ITEMS);
export const RECIPE_BY_ID: Record<string, RecipeDef> = byId(RECIPES);
export const BIOME_BY_ID: Record<string, BiomeDef> = byId(BIOMES.biomes);
export const SHOP_TIER_BY_ID: Record<string, ShopTierDef> = byId(SHOP.tiers);

export function tierOf(aura: AuraDef): TierDef {
  return TIER_BY_ID[aura.tier];
}

/** All auras sorted from most common to rarest (nominal odds). */
export const AURAS_BY_RARITY: AuraDef[] = [...AURAS].sort((a, b) => {
  if (a.fallback) return -1;
  if (b.fallback) return 1;
  return a.odds - b.odds;
});
