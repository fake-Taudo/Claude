// Merchant rotation: offers are a pure function of (save seed, rotation index,
// one-time items owned), so reloading never rerolls the shop.

import { ITEMS, SHOP, SHOP_TIER_BY_ID } from '../config';
import { Rng, hash32 } from './rng';
import type { GameState } from './state';

export interface ShopOffer {
  item: string;
  stock: number;
}

export function rotationMs(): number {
  return SHOP.rotationMinutes * 60 * 1000;
}

export function rotationIndex(now: number): number {
  return Math.floor(now / rotationMs());
}

export function rotationEndsAt(index: number): number {
  return (index + 1) * rotationMs();
}

export function generateOffers(seed: number, rotation: number, owned: (itemId: string) => boolean): ShopOffer[] {
  const rng = new Rng(hash32(seed, rotation, 0x5409));
  const offers: ShopOffer[] = [];
  for (const item of ITEMS) {
    const tier = SHOP_TIER_BY_ID[item.shopTier];
    // Always draw both numbers so ownership does not shift later items.
    const appear = rng.next() < tier.chance;
    const stock = tier.minStock + Math.floor(rng.next() * (tier.maxStock - tier.minStock + 1));
    if (!appear) continue;
    if (item.oneTime && owned(item.id)) continue;
    offers.push({ item: item.id, stock: item.oneTime ? 1 : stock });
  }
  if (offers.length === 0) {
    const fallback = ITEMS.find((i) => i.shopTier === 'common' && !i.oneTime);
    if (fallback) offers.push({ item: fallback.id, stock: SHOP_TIER_BY_ID.common.minStock });
  }
  return offers;
}

export function ownsItem(state: GameState, itemId: string): boolean {
  return (state.items[itemId] ?? 0) > 0;
}

/** Offers of the current rotation with remaining stock (already bought units removed). */
export function currentOffers(state: GameState, now: number): (ShopOffer & { remaining: number })[] {
  const rotation = rotationIndex(now);
  const bought = state.shop.rotation === rotation ? state.shop.bought : {};
  return generateOffers(state.seed, rotation, (id) => ownsItem(state, id) && !bought[id]).map((o) => ({
    ...o,
    remaining: Math.max(0, o.stock - (bought[o.item] ?? 0)),
  }));
}
