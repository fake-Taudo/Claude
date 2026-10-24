import { describe, expect, it } from 'vitest';
import { AURAS, BIOMES, ITEMS, POTIONS, REBIRTHS } from '../src/config';
import { activeBiome, setBiomeOverride } from '../src/core/biomes';
import { adminClearBuffs, adminGiveAuras, adminGiveItems, adminGivePotions, adminGold, adminRemoveAura, adminSetRebirth } from '../src/core/engine';
import { isAdminCode } from '../src/ui/panels/Admin';
import { T0, fresh } from './helpers';

// Admin menu actions (src/core/engine.ts, section Admin).

describe('admin menu', () => {
  it('opens only with the code (case and spaces ignored)', () => {
    expect(isAdminCode(' sternen staub ', 'STERNENSTAUB')).toBe(true);
    expect(isAdminCode('sternenstau', 'STERNENSTAUB')).toBe(false);
  });

  it('gives every aura, discovers them and counts them', () => {
    const { state } = fresh();
    const events = adminGiveAuras(state, 3, T0);
    for (const a of AURAS) {
      expect(state.auras[a.id], a.id).toBe(3);
      expect(state.discovered[a.id]?.total, a.id).toBe(3);
    }
    expect(events.filter((e) => e.type === 'auraDiscovered')).toHaveLength(AURAS.length);
    adminGiveAuras(state, 2, T0, ['staub']);
    expect(state.auras.staub).toBe(5);
    adminRemoveAura(state, 'staub');
    expect(state.auras.staub).toBeUndefined();
  });

  it('adds and sets Gold Coins (milli gold, capped)', () => {
    const { state } = fresh();
    adminGold(state, 1_000_000);
    adminGold(state, 500);
    expect(state.gold).toBe(1_000_500_000);
    adminGold(state, 42, true);
    expect(state.gold).toBe(42_000);
    adminGold(state, 1e20, true);
    expect(state.gold).toBe(1e15);
  });

  it('gives potions and items, sets the rebirth level, clears effects', () => {
    const { state } = fresh();
    adminGivePotions(state, 5);
    adminGiveItems(state, 2);
    for (const p of POTIONS) expect(state.potions[p.id]).toBe(5);
    for (const i of ITEMS) expect(state.items[i.id]).toBe(2);
    adminSetRebirth(state, 99);
    expect(state.rebirth).toBe(REBIRTHS.length);
    state.buffs.push({ id: 'potion:luck', source: 'potion', ref: 'luck', endsAt: T0 + 1e6 });
    adminClearBuffs(state);
    expect(state.buffs).toHaveLength(0);
  });

  it('can force the weather and give it back to the clock', () => {
    const natural = activeBiome(T0)?.id ?? null;
    const id = BIOMES.biomes[0].id;
    setBiomeOverride(id);
    expect(activeBiome(T0)?.id).toBe(id);
    setBiomeOverride(null);
    expect(activeBiome(T0)).toBeNull();
    setBiomeOverride(undefined);
    expect(activeBiome(T0)?.id ?? null).toBe(natural);
  });
});
