import { describe, expect, it } from 'vitest';
import { REBIRTHS } from '../src/config';
import { drinkPotion, equipItem, useItem } from '../src/core/engine';
import { computeGoldMult, computeLuck, computeSpeed, isNextRollLucky, rollDurationMs, rollsUntilLucky } from '../src/core/modifiers';
import { T0, fresh } from './helpers';

describe('luck stacking', () => {
  it('is 1 without any source', () => {
    const { state } = fresh();
    expect(computeLuck(state, T0, { lucky: false, biome: null }).total).toBe(1);
  });

  it('uses only the strongest potion', () => {
    const { state } = fresh();
    state.potions = { luck: 1, sun: 1, divine: 1 };
    drinkPotion(state, 'luck', 1, T0);
    drinkPotion(state, 'sun', 1, T0);
    let r = computeLuck(state, T0, { lucky: false, biome: null });
    expect(r.total).toBe(3);
    expect(r.categories.find((c) => c.category === 'potion')!.parts.filter((p) => p.active)).toHaveLength(1);
    drinkPotion(state, 'divine', 1, T0);
    r = computeLuck(state, T0, { lucky: false, biome: null });
    expect(r.total).toBe(500);
    expect(r.potionBuffId).toBe('potion:divine');
  });

  it('adds amulets within their category and multiplies categories', () => {
    const { state } = fresh();
    state.items = { luck_amulet: 2, lost_amulet: 1, quantum_gauntlet: 1 };
    useItem(state, 'luck_amulet', T0);
    useItem(state, 'lost_amulet', T0);
    equipItem(state, 'quantum_gauntlet');
    state.potions = { sun: 1 };
    drinkPotion(state, 'sun', 1, T0);
    state.rebirth = 1;
    const r = computeLuck(state, T0, { lucky: true, biome: 'meteorschauer' });
    const amulet = 1 + 0.1 + 5;
    const expected = 3 * amulet * 1.75 * REBIRTHS[0].luck * 1.5 * 2;
    expect(r.total).toBeCloseTo(expected, 10);
    expect(r.categories.find((c) => c.category === 'amulet')!.factor).toBeCloseTo(amulet, 10);
  });

  it('ignores expired timed buffs', () => {
    const { state } = fresh();
    state.potions = { sun: 1 };
    drinkPotion(state, 'sun', 1, T0);
    expect(computeLuck(state, T0 + 179_000, { lucky: false, biome: null }).total).toBe(3);
    expect(computeLuck(state, T0 + 180_001, { lucky: false, biome: null }).total).toBe(1);
  });
});

describe('speed and gold', () => {
  it('combines potion, items, rebirth and biome speed', () => {
    const { state } = fresh();
    state.items = { speed_amulet: 1, quantum_gauntlet: 1 };
    useItem(state, 'speed_amulet', T0);
    equipItem(state, 'quantum_gauntlet');
    state.potions = { speed: 1 };
    drinkPotion(state, 'speed', 1, T0);
    state.rebirth = 2;
    const r = computeSpeed(state, T0, 'sonnensturm');
    expect(r.total).toBeCloseTo(1.5 * 1.1 * 1.75 * REBIRTHS[1].speed * 1.2, 10);
  });

  it('uses the rebirth gold multiplier of the current level only', () => {
    const { state } = fresh();
    expect(computeGoldMult(state).total).toBe(1);
    state.rebirth = 3;
    expect(computeGoldMult(state).total).toBe(REBIRTHS[2].goldMult);
  });

  it('auto roll is 25 % slower, speed shortens multiplicatively', () => {
    expect(rollDurationMs(1, false)).toBe(900);
    expect(rollDurationMs(1, true)).toBe(1125);
    expect(rollDurationMs(1.5, false)).toBe(600);
  });
});

describe('lucky cadence', () => {
  it('marks every 10th roll', () => {
    const { state } = fresh();
    state.rollCounter = 8;
    expect(isNextRollLucky(state)).toBe(false);
    expect(rollsUntilLucky(state)).toBe(2);
    state.rollCounter = 9;
    expect(isNextRollLucky(state)).toBe(true);
    expect(rollsUntilLucky(state)).toBe(1);
    state.rollCounter = 10;
    expect(rollsUntilLucky(state)).toBe(10);
  });
});
