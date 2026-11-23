import { describe, expect, it } from 'vitest';
import { AURA_BY_ID, ITEMS, POTIONS, REBIRTHS } from '../src/config';
import { activeBiome } from '../src/core/biomes';
import {
  beginRoll,
  brewPotion,
  buyItem,
  checkRebirth,
  claimQuest,
  completeRoll,
  craftRecipe,
  drinkPotion,
  equipAura,
  equipItem,
  performRebirth,
  planBulkSell,
  sellAura,
  sellBulk,
  sellPriceMilli,
  tick,
  toggleLock,
  useItem,
} from '../src/core/engine';
import { computeLuck } from '../src/core/modifiers';
import { currentOffers, generateOffers, rotationEndsAt, rotationIndex } from '../src/core/shop';
import { toMilli } from '../src/core/state';
import { T0, fresh, withoutAchievements } from './helpers';

function roll(state: ReturnType<typeof fresh>['state'], rng: ReturnType<typeof fresh>['rng'], now = T0) {
  beginRoll(state, { now, rng }, false);
  return completeRoll(state, { now, rng });
}

describe('rolling', () => {
  it('grants the aura only on completion and auto-equips the very first aura', () => {
    const { state, rng } = fresh();
    beginRoll(state, { now: T0, rng }, false);
    expect(state.pendingRoll).not.toBeNull();
    expect(Object.keys(state.auras)).toHaveLength(0);
    const events = completeRoll(state, { now: T0, rng });
    const done = events.find((e) => e.type === 'rollCompleted')!;
    expect(done.type === 'rollCompleted' && done.isNew).toBe(true);
    const id = Object.keys(state.auras)[0];
    expect(state.equippedAura).toBe(id);
    roll(state, rng);
    expect(state.equippedAura).toBe(id);
  });

  it('refuses a second roll while one is pending', () => {
    const { state, rng } = fresh();
    beginRoll(state, { now: T0, rng }, false);
    const ev = beginRoll(state, { now: T0, rng }, false);
    expect(ev[0].type).toBe('error');
  });

  it('counts rolls and gives every 10th roll double luck', () => {
    const { state, rng } = fresh();
    for (let i = 0; i < 9; i++) roll(state, rng);
    beginRoll(state, { now: T0, rng }, false);
    expect(state.pendingRoll!.lucky).toBe(true);
    const base = computeLuck(state, T0, { lucky: false, biome: activeBiome(T0)?.id ?? null }).total;
    expect(state.pendingRoll!.luck).toBeCloseTo(base * 2, 10);
    completeRoll(state, { now: T0, rng });
    expect(state.stats.rolls).toBe(10);
    expect(state.stats.luckyRolls).toBe(1);
  });

  it('consumes roll charges only of the potion that provided the luck', () => {
    const { state, rng } = fresh();
    state.potions = { luck: 1, divine: 1 };
    drinkPotion(state, 'luck', 1, T0);
    drinkPotion(state, 'divine', 1, T0);
    roll(state, rng);
    expect(state.buffs.find((b) => b.id === 'potion:divine')).toBeUndefined();
    expect(state.buffs.find((b) => b.id === 'potion:luck')!.rolls).toBe(50);
    roll(state, rng);
    expect(state.buffs.find((b) => b.id === 'potion:luck')!.rolls).toBe(49);
  });

  it('is fully deterministic for a seed', () => {
    const run = () => {
      const { state, rng } = fresh(777);
      for (let i = 0; i < 500; i++) roll(state, rng);
      return JSON.stringify(state.auras);
    };
    expect(run()).toBe(run());
  });
});

describe('inventory and selling', () => {
  it('sells with the rebirth gold multiplier and unequips sold-out auras', () => {
    const { state } = fresh();
    state.auras = { urlicht: 2 };
    state.equippedAura = 'urlicht';
    state.rebirth = 1;
    sellAura(state, 'urlicht', 5, T0);
    expect(state.auras.urlicht).toBeUndefined();
    expect(state.equippedAura).toBeNull();
    expect(state.gold).toBe(2 * Math.round(toMilli(AURA_BY_ID.urlicht.sell) * REBIRTHS[0].goldMult));
  });

  it('never sells locked auras and keeps one equipped copy on bulk sale', () => {
    const { state } = fresh();
    state.auras = { staub: 10, moos: 5 };
    toggleLock(state, 'moos');
    state.equippedAura = 'staub';
    expect(sellAura(state, 'moos', 1, T0)[0].type).toBe('error');
    const plan = planBulkSell(state, 'common', false);
    expect(plan.count).toBe(9);
    sellBulk(state, 'common', false, T0);
    expect(state.auras).toEqual({ staub: 1, moos: 5 });
    expect(state.gold).toBe(9 * sellPriceMilli(state, 'staub'));
  });

  it('equipping toggles', () => {
    const { state } = fresh();
    state.auras = { flut: 1 };
    equipAura(state, 'flut');
    expect(state.equippedAura).toBe('flut');
    equipAura(state, 'flut');
    expect(state.equippedAura).toBeNull();
    expect(equipAura(state, 'asche')[0].type).toBe('error');
  });

  it('never lets gold or counts go negative', () => {
    const { state } = fresh();
    expect(sellAura(state, 'staub', -3, T0)[0].type).toBe('error');
    expect(state.gold).toBe(0);
  });
});

describe('potions and forge', () => {
  it('brewing consumes ingredients and puts the potion into the stash', () => {
    const { state } = fresh();
    state.auras = { flut: 11, frost: 2 };
    brewPotion(state, 'luck', 2, T0);
    expect(state.auras).toEqual({ flut: 1 });
    expect(state.potions.luck).toBe(2);
    expect(state.buffs).toHaveLength(0);
    expect(brewPotion(state, 'luck', 1, T0)[0].type).toBe('error');
  });

  it('respects locks and unequips a consumed equipped aura', () => {
    const { state } = fresh();
    state.auras = { frost: 1, asche: 1 };
    state.equippedAura = 'frost';
    toggleLock(state, 'frost');
    expect(brewPotion(state, 'speed', 1, T0)[0].type).toBe('error');
    toggleLock(state, 'frost');
    brewPotion(state, 'speed', 1, T0);
    expect(state.equippedAura).toBeNull();
  });

  it('drinking stacks durations and charges', () => {
    const { state } = fresh();
    state.potions = { sun: 2, luck: 2 };
    drinkPotion(state, 'sun', 1, T0);
    drinkPotion(state, 'sun', 1, T0 + 60_000);
    expect(state.buffs.find((b) => b.id === 'potion:sun')!.endsAt).toBe(T0 + 360_000);
    drinkPotion(state, 'luck', 2, T0);
    expect(state.buffs.find((b) => b.id === 'potion:luck')!.rolls).toBe(100);
    expect(state.potions).toEqual({});
  });

  it('crafting turns auras into another aura and does not count as a roll', () => {
    const { state } = fresh();
    state.auras = { flut: 2, moos: 8, staub: 24 };
    craftRecipe(state, 'craft_sturm', 2, T0);
    expect(state.auras).toEqual({ sturm: 2 });
    expect(state.discovered.sturm).toBeDefined();
    expect(state.stats.rolls).toBe(0);
    expect(state.rollCounter).toBe(0);
  });

  it('every potion recipe references existing auras', () => {
    for (const p of POTIONS) for (const i of p.ingredients) expect(AURA_BY_ID[i.aura], `${p.id}/${i.aura}`).toBeDefined();
  });
});

describe('shop', () => {
  it('rotates every 5 minutes and is deterministic per seed and rotation', () => {
    const r = rotationIndex(T0);
    expect(rotationEndsAt(r) - T0).toBeLessThanOrEqual(5 * 60_000);
    expect(generateOffers(1, r, () => false)).toEqual(generateOffers(1, r, () => false));
    const different = Array.from({ length: 20 }, (_, i) => JSON.stringify(generateOffers(1, r + i, () => false)));
    expect(new Set(different).size).toBeGreaterThan(5);
  });

  it('roughly follows the configured appearance chances', () => {
    let gauntlet = 0;
    let common = 0;
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      const offers = generateOffers(9, i, () => false);
      if (offers.some((o) => o.item === 'quantum_gauntlet')) gauntlet++;
      if (offers.some((o) => o.item === 'luck_amulet')) common++;
    }
    expect(gauntlet / n).toBeCloseTo(0.03, 2);
    expect(common / n).toBeGreaterThan(0.9);
  });

  it('never offers a one-time item that is already owned', () => {
    for (let i = 0; i < 5000; i++) {
      expect(generateOffers(3, i, (id) => id === 'quantum_gauntlet').some((o) => o.item === 'quantum_gauntlet')).toBe(false);
    }
  });

  it('buys, decrements stock and refuses without gold', () => {
    const { state } = fresh(11);
    withoutAchievements(state);
    tick(state, T0, null, 0);
    const offers = currentOffers(state, T0);
    const offer = offers[0];
    const item = ITEMS.find((i) => i.id === offer.item)!;
    expect(buyItem(state, item.id, T0)[0].type).toBe('error');
    state.gold = toMilli(item.price * offer.stock + 5);
    for (let i = 0; i < offer.stock; i++) buyItem(state, item.id, T0);
    expect(currentOffers(state, T0).find((o) => o.item === item.id)!.remaining).toBe(0);
    const ev = buyItem(state, item.id, T0);
    expect(ev.some((e) => e.type === 'error')).toBe(true);
    expect(state.gold).toBe(toMilli(5));
    // Next rotation: purchases reset.
    const next = rotationEndsAt(rotationIndex(T0)) + 1;
    tick(state, next, null, 0);
    expect(state.shop.bought).toEqual({});
  });

  it('consumable items grant timed buffs that stack', () => {
    const { state } = fresh();
    state.items = { luck_amulet: 2 };
    useItem(state, 'luck_amulet', T0);
    useItem(state, 'luck_amulet', T0);
    expect(state.buffs[0].endsAt).toBe(T0 + 1_200_000);
    expect(state.items.luck_amulet).toBeUndefined();
    state.items = { comet_compass: 1 };
    equipItem(state, 'comet_compass');
    expect(state.equippedItem).toBe('comet_compass');
  });
});

describe('rebirth', () => {
  it('requires gold and auras, consumes them and resets auras and gold only', () => {
    const { state } = fresh();
    withoutAchievements(state);
    const r1 = REBIRTHS[0];
    expect(checkRebirth(state).ready).toBe(false);
    expect(performRebirth(state, T0)[0].type).toBe('error');
    state.gold = toMilli(r1.gold) + 5;
    for (const a of r1.auras) state.auras[a.aura] = a.count;
    state.auras.staub = 50;
    state.equippedAura = 'staub';
    state.potions = { sun: 2 };
    state.items = { quantum_gauntlet: 1 };
    state.equippedItem = 'quantum_gauntlet';
    state.discovered.staub = { first: T0, total: 50, seen: true };
    expect(checkRebirth(state).ready).toBe(true);
    performRebirth(state, T0);
    expect(state.rebirth).toBe(1);
    expect(state.gold).toBe(0);
    expect(state.auras).toEqual({});
    expect(state.equippedAura).toBeNull();
    expect(state.potions).toEqual({ sun: 2 });
    expect(state.equippedItem).toBe('quantum_gauntlet');
    expect(state.discovered.staub).toBeDefined();
  });

  it('stops at the last level', () => {
    const { state } = fresh();
    state.rebirth = REBIRTHS.length;
    expect(checkRebirth(state).level).toBeNull();
    expect(performRebirth(state, T0)[0].type).toBe('error');
  });

  it('the first roll after a rebirth equips again', () => {
    const { state, rng } = fresh();
    state.rebirth = 1;
    state.rollsSinceRebirth = 0;
    state.stats.rolls = 100;
    roll(state, rng);
    expect(state.equippedAura).not.toBeNull();
  });
});

describe('quests and achievements', () => {
  it('creates three daily quests and pays out claimed ones', () => {
    const { state, rng } = fresh();
    tick(state, T0, null, 0);
    expect(state.quests.daily).toHaveLength(3);
    const q = state.quests.daily[0];
    expect(claimQuest(state, q.id, T0)[0].type).toBe('error');
    q.progress = 99999;
    const gold = state.gold;
    claimQuest(state, q.id, T0);
    expect(q.claimed).toBe(true);
    expect(state.gold + Object.values(state.potions).length).toBeGreaterThan(gold);
    roll(state, rng);
  });

  it('unlocks achievements with rewards', () => {
    const { state, rng } = fresh();
    for (let i = 0; i < 100; i++) roll(state, rng);
    expect(state.achievements.rolls_100).toBeDefined();
    expect(state.potions.luck).toBeGreaterThanOrEqual(1);
  });
});
