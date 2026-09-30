// Regressionstest für cards.json: Jede Karte (inkl. Evo und Fähigkeit) muss spielbar sein, ohne dass die Simulation abstürzt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, newMatch, runSeconds, spawn, forceHand } from './helpers.js';

const posFor = (c) => (c.type === 'spell' ? [9, 12] : c.type === 'building' ? [9, 22] : [9.5, 20.5]);

for (const c of db.cards) {
  test(`Karte spielbar: ${c.name}`, () => {
    const m = newMatch();
    for (let i = 0; i < 4; i++) spawn(m, i % 2 ? 'knappe' : 'flattermotten', 1, 8 + i, 12);
    forceHand(m, 0, 0, c.id, 10);
    const r = m.play(0, 0, c.id, ...posFor(c));
    assert.ok(r.ok, JSON.stringify(r));
    runSeconds(m, 1.2);
    if (c.ability) {
      spawn(m, 'knappe', 1, 9.5, 18.5);
      assert.ok(m.useAbility(0).ok, 'Fähigkeit auslösbar');
    }
    runSeconds(m, 15);
    for (const e of m.entities) assert.ok(Number.isFinite(e.x + e.y + e.hp));
    if (c.evo) {
      const m2 = newMatch();
      m2.players[0].evoCharge[c.id] = c.evo.cycles;
      m2.players[0].evoCards.add(c.id);
      forceHand(m2, 0, 0, c.id, 10);
      const r2 = m2.play(0, 0, c.id, ...posFor(c));
      assert.ok(r2.ok && r2.evo, 'Evo-Version spielbar');
      spawn(m2, 'knappe', 1, 9, 17.5);
      runSeconds(m2, 15);
    }
  });
}
