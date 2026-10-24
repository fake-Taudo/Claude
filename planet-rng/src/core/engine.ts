// All game actions as pure state transitions (no DOM). Each action mutates the given
// state and returns a list of events that the store forwards to UI, VFX and audio.

import {
  AURA_BY_ID,
  AURAS,
  GAME,
  ITEM_BY_ID,
  ITEMS,
  POTIONS,
  POTION_BY_ID,
  RECIPE_BY_ID,
  REBIRTHS,
  TIER_BY_ID,
  tierOf,
  type Ingredient,
  type TierId,
} from '../config';
import { activeBiome } from './biomes';
import { computeGoldMult, computeLuck, isBuffActive, isNextRollLucky } from './modifiers';
import { getRollTable, rollAura } from './odds';
import { checkAchievements, chainReward, chainTarget, CHAIN_BY_ID, ensureDailyQuests, grantReward, QUEST_BY_ID, trackQuests, type ProgressSignal } from './progress';
import type { Rng } from './rng';
import { currentOffers, rotationIndex } from './shop';
import { toMilli, type GameState, type PendingRoll } from './state';

export type GoldReason = 'sell' | 'reward' | 'buy' | 'bonus' | 'rebirth';

export type GameEvent =
  | { type: 'error'; message: string }
  | { type: 'rollStarted'; pending: PendingRoll }
  | { type: 'rollCompleted'; aura: string; isNew: boolean; lucky: boolean; luck: number; biome: string | null }
  | { type: 'goldChanged'; delta: number; reason: GoldReason }
  | { type: 'auraDiscovered'; aura: string }
  | { type: 'equipChanged'; aura: string | null }
  | { type: 'itemEquipChanged'; item: string | null }
  | { type: 'sold'; aura: string | null; count: number; gold: number }
  | { type: 'brewed'; potion: string; count: number }
  | { type: 'drunk'; potion: string; count: number }
  | { type: 'crafted'; recipe: string; aura: string; count: number }
  | { type: 'bought'; item: string }
  | { type: 'itemUsed'; item: string }
  | { type: 'buffExpired'; buff: string }
  | { type: 'shopRestocked'; rotation: number }
  | { type: 'biomeChanged'; biome: string | null; prev: string | null }
  | { type: 'rebirth'; level: number }
  | { type: 'achievement'; id: string }
  | { type: 'questReady'; id: string }
  | { type: 'questClaimed'; id: string }
  | { type: 'dailyRefreshed' };

export interface Ctx {
  now: number;
  rng: Rng;
}

const err = (message: string): GameEvent[] => [{ type: 'error', message }];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function auraCount(state: GameState, id: string): number {
  return state.auras[id] ?? 0;
}

/** Copies that may be sold or consumed (locked auras are protected). */
export function usableCount(state: GameState, id: string): number {
  return state.locked[id] ? 0 : auraCount(state, id);
}

function addGold(state: GameState, milli: number, reason: GoldReason, events: GameEvent[]): void {
  if (milli <= 0) return;
  state.gold += milli;
  if (reason !== 'buy') state.stats.goldEarned += milli;
  events.push({ type: 'goldChanged', delta: milli, reason });
}

function removeAuras(state: GameState, id: string, n: number, events: GameEvent[]): void {
  const left = Math.max(0, auraCount(state, id) - n);
  if (left === 0) delete state.auras[id];
  else state.auras[id] = left;
  if (left === 0 && state.equippedAura === id) {
    state.equippedAura = null;
    events.push({ type: 'equipChanged', aura: null });
  }
}

function addAura(state: GameState, id: string, n: number, now: number, events: GameEvent[]): boolean {
  state.auras[id] = auraCount(state, id) + n;
  const entry = state.discovered[id];
  if (entry) {
    entry.total += n;
    return false;
  }
  state.discovered[id] = { first: now, total: n, seen: false };
  events.push({ type: 'auraDiscovered', aura: id });
  return true;
}

function track(state: GameState, now: number, signals: ProgressSignal[], events: GameEvent[]): void {
  ensureDailyQuests(state, now);
  for (const s of signals) events.push(...trackQuests(state, s));
  events.push(...checkAchievements(state, now));
}

export function maxCraftable(state: GameState, ingredients: Ingredient[]): number {
  let max = Infinity;
  for (const ing of ingredients) max = Math.min(max, Math.floor(usableCount(state, ing.aura) / ing.count));
  return Number.isFinite(max) ? max : 0;
}

/** Milli gold received for selling one copy. */
export function sellPriceMilli(state: GameState, auraId: string): number {
  const aura = AURA_BY_ID[auraId];
  if (!aura) return 0;
  return Math.round(toMilli(aura.sell) * computeGoldMult(state).total);
}

// ---------------------------------------------------------------------------
// Rolling
// ---------------------------------------------------------------------------

/** Draws the result and consumes roll charges. The aura is granted by completeRoll. */
export function beginRoll(state: GameState, ctx: Ctx, auto: boolean): GameEvent[] {
  if (state.pendingRoll) return err('Es läuft bereits ein Roll.');
  const lucky = isNextRollLucky(state);
  const biome = activeBiome(ctx.now)?.id ?? null;
  const luck = computeLuck(state, ctx.now, { lucky, biome });
  const aura = rollAura(getRollTable(biome), luck.total, ctx.rng);

  // Roll-charge potions are only consumed when they actually provided the luck.
  if (luck.potionBuffId) {
    const buff = state.buffs.find((b) => b.id === luck.potionBuffId);
    if (buff && buff.rolls !== undefined) {
      buff.rolls -= 1;
      if (buff.rolls <= 0) state.buffs = state.buffs.filter((b) => b !== buff);
    }
  }

  state.rollCounter += 1;
  state.rng = ctx.rng.getState();
  const pending: PendingRoll = { aura: aura.id, lucky, luck: luck.total, biome, startedAt: ctx.now, auto };
  state.pendingRoll = pending;
  return [{ type: 'rollStarted', pending }];
}

/** Grants the pending aura (after the roll animation / cutscene). */
export function completeRoll(state: GameState, ctx: Ctx): GameEvent[] {
  const p = state.pendingRoll;
  if (!p) return [];
  state.pendingRoll = null;
  const aura = AURA_BY_ID[p.aura];
  if (!aura) return [];
  const events: GameEvent[] = [];
  const isNew = addAura(state, aura.id, 1, ctx.now, events);
  const tier = tierOf(aura);
  const s = state.stats;
  s.rolls += 1;
  state.rollsSinceRebirth += 1;
  if (p.lucky) s.luckyRolls += 1;
  s.tierCounts[aura.tier] = (s.tierCounts[aura.tier] ?? 0) + 1;
  if (!s.bestAura || (AURA_BY_ID[s.bestAura]?.odds ?? 0) < aura.odds) s.bestAura = aura.id;
  s.bestLuck = Math.max(s.bestLuck, p.luck);

  if (state.equippedAura === null && state.rollsSinceRebirth === 1) {
    state.equippedAura = aura.id;
    events.push({ type: 'equipChanged', aura: aura.id });
  }

  const item = state.equippedItem ? ITEM_BY_ID[state.equippedItem] : undefined;
  const bonus = item?.equip?.goldOnAura;
  if (bonus && bonus.aura === aura.id) {
    addGold(state, Math.round(toMilli(bonus.gold) * computeGoldMult(state).total), 'bonus', events);
  }

  state.history.unshift({ aura: aura.id, at: ctx.now, lucky: p.lucky });
  if (state.history.length > GAME.reveal.historyLength) state.history.length = GAME.reveal.historyLength;

  const signals: ProgressSignal[] = [
    { type: 'roll', amount: 1 },
    { type: 'rollTier', amount: 1, rank: tier.rank },
  ];
  if (p.biome) signals.push({ type: 'biomeRolls', amount: 1 });
  if (p.lucky) signals.push({ type: 'luckyRolls', amount: 1 });
  events.unshift({ type: 'rollCompleted', aura: aura.id, isNew, lucky: p.lucky, luck: p.luck, biome: p.biome });
  track(state, ctx.now, signals, events);
  return events;
}

export function markCutsceneSeen(state: GameState, now: number): GameEvent[] {
  state.stats.cutscenes += 1;
  const events: GameEvent[] = [];
  track(state, now, [], events);
  return events;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export function equipAura(state: GameState, id: string | null): GameEvent[] {
  if (id === null || state.equippedAura === id) {
    if (state.equippedAura === null) return [];
    state.equippedAura = null;
    return [{ type: 'equipChanged', aura: null }];
  }
  if (auraCount(state, id) <= 0) return err('Diese Aura besitzt du nicht.');
  state.equippedAura = id;
  return [{ type: 'equipChanged', aura: id }];
}

export function toggleLock(state: GameState, id: string): GameEvent[] {
  if (state.locked[id]) delete state.locked[id];
  else state.locked[id] = true;
  return [];
}

export function sellAura(state: GameState, id: string, qty: number, now: number): GameEvent[] {
  if (!AURA_BY_ID[id]) return err('Unbekannte Aura.');
  if (state.locked[id]) return err('Gesperrte Auren können nicht verkauft werden.');
  const n = Math.min(Math.floor(qty), auraCount(state, id));
  if (n <= 0) return err('Nichts zu verkaufen.');
  const events: GameEvent[] = [];
  const gold = sellPriceMilli(state, id) * n;
  removeAuras(state, id, n, events);
  addGold(state, gold, 'sell', events);
  state.stats.sold += n;
  events.unshift({ type: 'sold', aura: id, count: n, gold });
  track(state, now, [{ type: 'sellGold', amount: gold / 1000 }], events);
  return events;
}

export interface BulkSellPlan {
  lines: { aura: string; count: number; gold: number }[];
  count: number;
  gold: number;
}

/** What "sell all of tier X" would sell. Locked auras are skipped, the equipped aura keeps one copy. */
export function planBulkSell(state: GameState, tier: TierId, keepOne: boolean): BulkSellPlan {
  const lines: BulkSellPlan['lines'] = [];
  for (const [id, have] of Object.entries(state.auras)) {
    const aura = AURA_BY_ID[id];
    if (!aura || aura.tier !== tier || state.locked[id]) continue;
    const keep = keepOne || state.equippedAura === id ? 1 : 0;
    const count = Math.max(0, have - keep);
    if (count > 0) lines.push({ aura: id, count, gold: sellPriceMilli(state, id) * count });
  }
  return { lines, count: lines.reduce((s, l) => s + l.count, 0), gold: lines.reduce((s, l) => s + l.gold, 0) };
}

export function sellBulk(state: GameState, tier: TierId, keepOne: boolean, now: number): GameEvent[] {
  const plan = planBulkSell(state, tier, keepOne);
  if (plan.count === 0) return err('Nichts zu verkaufen.');
  const events: GameEvent[] = [];
  for (const line of plan.lines) removeAuras(state, line.aura, line.count, events);
  addGold(state, plan.gold, 'sell', events);
  state.stats.sold += plan.count;
  events.unshift({ type: 'sold', aura: null, count: plan.count, gold: plan.gold });
  track(state, now, [{ type: 'sellGold', amount: plan.gold / 1000 }], events);
  return events;
}

export function markSeen(state: GameState, ids: string[]): void {
  for (const id of ids) {
    const d = state.discovered[id];
    if (d) d.seen = true;
  }
}

// ---------------------------------------------------------------------------
// Potions and forge
// ---------------------------------------------------------------------------

export function brewPotion(state: GameState, potionId: string, qty: number, now: number): GameEvent[] {
  const def = POTION_BY_ID[potionId];
  if (!def) return err('Unbekannter Trank.');
  const n = Math.floor(qty);
  if (n <= 0) return err('Ungültige Menge.');
  if (maxCraftable(state, def.ingredients) < n) return err('Nicht genug Zutaten (gesperrte Auren zählen nicht).');
  const events: GameEvent[] = [];
  for (const ing of def.ingredients) removeAuras(state, ing.aura, ing.count * n, events);
  state.potions[potionId] = (state.potions[potionId] ?? 0) + n;
  state.stats.brewed += n;
  events.unshift({ type: 'brewed', potion: potionId, count: n });
  track(state, now, [{ type: 'brew', amount: n }], events);
  return events;
}

export function drinkPotion(state: GameState, potionId: string, qty: number, now: number): GameEvent[] {
  const def = POTION_BY_ID[potionId];
  if (!def) return err('Unbekannter Trank.');
  const n = Math.min(Math.floor(qty), state.potions[potionId] ?? 0);
  if (n <= 0) return err('Diesen Trank hast du nicht im Vorrat.');
  const id = `potion:${potionId}`;
  let buff = state.buffs.find((b) => b.id === id);
  if (buff && !isBuffActive(buff, now)) {
    state.buffs = state.buffs.filter((b) => b !== buff);
    buff = undefined;
  }
  if (!buff) {
    buff = { id, source: 'potion', ref: potionId };
    state.buffs.push(buff);
  }
  if (def.effect.durationSec) buff.endsAt = Math.max(now, buff.endsAt ?? now) + def.effect.durationSec * 1000 * n;
  if (def.effect.rolls) buff.rolls = (buff.rolls ?? 0) + def.effect.rolls * n;
  state.potions[potionId] -= n;
  if (state.potions[potionId] <= 0) delete state.potions[potionId];
  state.stats.drunk += n;
  const events: GameEvent[] = [{ type: 'drunk', potion: potionId, count: n }];
  track(state, now, [{ type: 'drink', amount: n }], events);
  return events;
}

export function craftRecipe(state: GameState, recipeId: string, qty: number, now: number): GameEvent[] {
  const def = RECIPE_BY_ID[recipeId];
  if (!def || !AURA_BY_ID[def.result]) return err('Unbekanntes Rezept.');
  const n = Math.floor(qty);
  if (n <= 0) return err('Ungültige Menge.');
  if (maxCraftable(state, def.ingredients) < n) return err('Nicht genug Zutaten (gesperrte Auren zählen nicht).');
  const events: GameEvent[] = [];
  for (const ing of def.ingredients) removeAuras(state, ing.aura, ing.count * n, events);
  addAura(state, def.result, def.count * n, now, events);
  state.stats.crafted += n;
  events.unshift({ type: 'crafted', recipe: recipeId, aura: def.result, count: def.count * n });
  track(state, now, [{ type: 'craft', amount: n }], events);
  return events;
}

// ---------------------------------------------------------------------------
// Shop and items
// ---------------------------------------------------------------------------

export function syncShopRotation(state: GameState, now: number): GameEvent[] {
  const rotation = rotationIndex(now);
  if (state.shop.rotation === rotation) return [];
  const first = state.shop.rotation < 0;
  state.shop.rotation = rotation;
  state.shop.bought = {};
  return first ? [] : [{ type: 'shopRestocked', rotation }];
}

export function buyItem(state: GameState, itemId: string, now: number): GameEvent[] {
  const def = ITEM_BY_ID[itemId];
  if (!def) return err('Unbekanntes Item.');
  const events = syncShopRotation(state, now);
  const offer = currentOffers(state, now).find((o) => o.item === itemId);
  if (!offer) return err('Dieses Item wird gerade nicht angeboten.');
  if (def.oneTime && (state.items[itemId] ?? 0) > 0) return err('Bereits im Besitz.');
  if (offer.remaining <= 0) return err('Ausverkauft.');
  const price = toMilli(def.price);
  if (state.gold < price) return err('Zu wenig Gold Coins.');
  state.gold -= price;
  state.stats.goldSpent += price;
  state.shop.bought[itemId] = (state.shop.bought[itemId] ?? 0) + 1;
  if (def.kind === 'bundle' && def.grants) {
    state.potions[def.grants.potion] = (state.potions[def.grants.potion] ?? 0) + def.grants.count;
  } else {
    state.items[itemId] = (state.items[itemId] ?? 0) + 1;
  }
  state.stats.purchases += 1;
  events.push({ type: 'goldChanged', delta: -price, reason: 'buy' }, { type: 'bought', item: itemId });
  track(state, now, [{ type: 'buy', amount: 1 }], events);
  return events;
}

export function useItem(state: GameState, itemId: string, now: number): GameEvent[] {
  const def = ITEM_BY_ID[itemId];
  if (!def || def.kind !== 'consumable' || !def.use) return err('Dieses Item kann nicht benutzt werden.');
  if ((state.items[itemId] ?? 0) <= 0) return err('Dieses Item hast du nicht.');
  const id = `item:${itemId}`;
  let buff = state.buffs.find((b) => b.id === id);
  if (buff && !isBuffActive(buff, now)) {
    state.buffs = state.buffs.filter((b) => b !== buff);
    buff = undefined;
  }
  if (!buff) {
    buff = { id, source: 'item', ref: itemId };
    state.buffs.push(buff);
  }
  buff.endsAt = Math.max(now, buff.endsAt ?? now) + def.use.durationSec * 1000;
  state.items[itemId] -= 1;
  if (state.items[itemId] <= 0) delete state.items[itemId];
  return [{ type: 'itemUsed', item: itemId }];
}

export function equipItem(state: GameState, itemId: string | null): GameEvent[] {
  if (itemId === null || state.equippedItem === itemId) {
    if (state.equippedItem === null) return [];
    state.equippedItem = null;
    return [{ type: 'itemEquipChanged', item: null }];
  }
  const def = ITEM_BY_ID[itemId];
  if (!def || def.kind !== 'equipment') return err('Dieses Item kann nicht ausgerüstet werden.');
  if ((state.items[itemId] ?? 0) <= 0) return err('Dieses Item hast du nicht.');
  state.equippedItem = itemId;
  return [{ type: 'itemEquipChanged', item: itemId }];
}

// ---------------------------------------------------------------------------
// Rebirth
// ---------------------------------------------------------------------------

export interface RebirthCheck {
  level: number | null;
  gold: { have: number; need: number };
  auras: { aura: string; have: number; need: number }[];
  ready: boolean;
}

export function checkRebirth(state: GameState): RebirthCheck {
  const next = REBIRTHS.find((r) => r.level === state.rebirth + 1);
  if (!next) return { level: null, gold: { have: state.gold, need: 0 }, auras: [], ready: false };
  const gold = { have: state.gold, need: toMilli(next.gold) };
  const auras = next.auras.map((a) => ({ aura: a.aura, have: auraCount(state, a.aura), need: a.count }));
  const ready = gold.have >= gold.need && auras.every((a) => a.have >= a.need);
  return { level: next.level, gold, auras, ready };
}

export function performRebirth(state: GameState, now: number): GameEvent[] {
  const check = checkRebirth(state);
  if (check.level === null) return err('Du hast bereits die höchste Rebirth-Stufe erreicht.');
  if (!check.ready) return err('Die Anforderungen sind noch nicht erfüllt.');
  state.rebirth = check.level;
  state.gold = 0;
  state.auras = {};
  state.equippedAura = null;
  state.rollsSinceRebirth = 0;
  state.pendingRoll = null;
  state.stats.rebirths += 1;
  const events: GameEvent[] = [
    { type: 'rebirth', level: check.level },
    { type: 'equipChanged', aura: null },
  ];
  track(state, now, [], events);
  return events;
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export function claimQuest(state: GameState, id: string, now: number): GameEvent[] {
  ensureDailyQuests(state, now);
  const daily = state.quests.daily.find((q) => q.id === id);
  if (daily) {
    const def = QUEST_BY_ID[id];
    if (!def || daily.claimed || daily.progress < def.target) return err('Dieser Auftrag ist noch nicht erfüllt.');
    daily.claimed = true;
    grantReward(state, def.reward);
    const events: GameEvent[] = [{ type: 'questClaimed', id }];
    if (def.reward.gold) events.push({ type: 'goldChanged', delta: toMilli(def.reward.gold), reason: 'reward' });
    track(state, now, [], events);
    return events;
  }
  const chain = CHAIN_BY_ID[id];
  if (chain) {
    const c = (state.quests.chains[id] ??= { level: 0, progress: 0 });
    if (c.progress < chainTarget(chain, c.level)) return err('Dieser Auftrag ist noch nicht erfüllt.');
    const reward = chainReward(chain, c.level);
    grantReward(state, reward);
    c.level += 1;
    c.progress = 0;
    const events: GameEvent[] = [{ type: 'questClaimed', id }];
    if (reward.gold) events.push({ type: 'goldChanged', delta: toMilli(reward.gold), reason: 'reward' });
    track(state, now, [], events);
    return events;
  }
  return err('Unbekannter Auftrag.');
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/**
 * Advances time based systems: expires buffs, rotates the shop, refreshes daily quests,
 * tracks biomes and play time. `activeMs` is play time to add (0 while hidden).
 */
export function tick(state: GameState, now: number, prevBiome: string | null, activeMs: number): GameEvent[] {
  const events: GameEvent[] = [];
  const expired = state.buffs.filter((b) => !isBuffActive(b, now));
  if (expired.length) {
    state.buffs = state.buffs.filter((b) => isBuffActive(b, now));
    for (const b of expired) events.push({ type: 'buffExpired', buff: b.id });
  }
  if (state.equippedItem && (state.items[state.equippedItem] ?? 0) <= 0) {
    state.equippedItem = null;
    events.push({ type: 'itemEquipChanged', item: null });
  }
  events.push(...syncShopRotation(state, now));
  if (ensureDailyQuests(state, now)) events.push({ type: 'dailyRefreshed' });
  const biome = activeBiome(now)?.id ?? null;
  if (biome !== prevBiome) {
    events.push({ type: 'biomeChanged', biome, prev: prevBiome });
    if (biome && !state.stats.biomesSeen.includes(biome)) state.stats.biomesSeen.push(biome);
  }
  if (activeMs > 0) state.stats.playMs += activeMs;
  state.lastActiveAt = now;
  events.push(...checkAchievements(state, now));
  return events;
}

export function tierRank(id: TierId): number {
  return TIER_BY_ID[id].rank;
}

// ---------------------------------------------------------------------------
// Admin (cheat menu, opened with a code)
// ---------------------------------------------------------------------------

/** Gives `n` copies of each aura (all auras when `ids` is omitted). */
export function adminGiveAuras(state: GameState, n: number, now: number, ids: string[] = AURAS.map((a) => a.id)): GameEvent[] {
  const events: GameEvent[] = [];
  const count = Math.max(1, Math.floor(n));
  for (const id of ids) if (AURA_BY_ID[id]) addAura(state, id, count, now, events);
  track(state, now, [], events);
  return events;
}

/** Removes every copy of an aura (locked ones too). */
export function adminRemoveAura(state: GameState, id: string): GameEvent[] {
  const events: GameEvent[] = [];
  removeAuras(state, id, auraCount(state, id), events);
  return events;
}

/** Adds (or with `set`, sets) Gold Coins. Amounts in whole coins, capped at 1 trillion. */
export function adminGold(state: GameState, gold: number, set = false): GameEvent[] {
  const milli = Math.round(Math.max(0, Math.min(1e12, gold)) * 1000);
  const before = state.gold;
  state.gold = set ? milli : Math.min(1e15, state.gold + milli);
  return [{ type: 'goldChanged', delta: state.gold - before, reason: 'bonus' }];
}

/** Adds `n` of each potion (or only `ids`). */
export function adminGivePotions(state: GameState, n: number, ids: string[] = POTIONS.map((p) => p.id)): GameEvent[] {
  for (const id of ids) if (POTION_BY_ID[id]) state.potions[id] = (state.potions[id] ?? 0) + Math.max(1, Math.floor(n));
  return [];
}

/** Adds `n` of each item (or only `ids`). */
export function adminGiveItems(state: GameState, n: number, ids: string[] = ITEMS.map((i) => i.id)): GameEvent[] {
  for (const id of ids) if (ITEM_BY_ID[id]) state.items[id] = (state.items[id] ?? 0) + Math.max(1, Math.floor(n));
  return [];
}

/** Sets the rebirth level directly (nothing is consumed or reset). */
export function adminSetRebirth(state: GameState, level: number): GameEvent[] {
  const max = REBIRTHS.length;
  state.rebirth = Math.max(0, Math.min(max, Math.floor(level)));
  return [{ type: 'rebirth', level: state.rebirth }];
}

/** Ends every running potion and item effect. */
export function adminClearBuffs(state: GameState): GameEvent[] {
  const events: GameEvent[] = state.buffs.map((b) => ({ type: 'buffExpired', buff: b.id }) as GameEvent);
  state.buffs = [];
  return events;
}
