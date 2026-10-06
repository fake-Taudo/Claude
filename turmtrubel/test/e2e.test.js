// Ende-zu-Ende: zwei automatische Test-Clients spielen über WebSocket komplette Kämpfe gegeneinander
// (Server im Zeitraffer, Regeln unverändert). Geprüft wird, dass jeder Kampf regulär endet und
// zusammen jede Mechanik-Gruppe, ein Champion, ein Held und eine Evolution zum Einsatz kamen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenarios } from '../tools/e2e/run.mjs';

test('Zwei Test-Clients spielen komplette Kämpfe (alle Mechanik-Gruppen, Champion, Held, Evo)', { timeout: 240000 }, async () => {
  const r = await runScenarios({ timeScale: 8 });
  for (const m of r.results) {
    assert.ok(['king', 'time', 'suddenDeath', 'draw'].includes(m.result.reason), `${m.name}: ${m.result.reason}`);
    assert.equal(m.result.reason, m.resultB.reason, 'beide Seiten sehen dasselbe Ergebnis');
    for (const s of m.sides) assert.ok(Object.keys(s.played).length >= 5, `${m.name}/${s.name} hat zu wenig gespielt`);
  }
  const missing = r.groups.filter((g) => !g.hit.length).map((g) => g.group);
  assert.deepEqual(missing, [], 'nicht abgedeckte Mechanik-Gruppen');
  assert.ok(r.champion.length >= 1, 'Champion-Fähigkeit eingesetzt');
  assert.ok(r.hero.length >= 1, 'Helden-Fähigkeit eingesetzt');
  assert.ok(r.evo.size >= 1, 'Evolution gespielt');
});
