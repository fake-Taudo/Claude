// Fuzz-Kurzlauf: Bot-Kämpfe mit Zufallsdecks in allen Modi, in jedem Tick gelten die Grundregeln der Simulation
// (keine NaN-Werte, nichts außerhalb, keine Bodentruppe im Fluss oder Turm, nichts sitzt fest, jeder Kampf endet).
// Der ausführliche Lauf: node tools/audit/fuzz.mjs 200 classic (bzw. 2v2, infinite-elixir …).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runFuzz } from '../tools/audit/fuzz.mjs';
import { loadAll } from '../tools/modes/bot-eval.mjs';

const ctx = loadAll();
for (const [mode, n] of [['classic', 6], ['2v2', 3], ['infinite-elixir', 3]]) {
  test(`Fuzz ${mode}: ${n} Bot-Kämpfe ohne Verstöße gegen die Grundregeln`, { timeout: 120000 }, () => {
    const r = runFuzz(n, mode, { ctx, first: 40 });
    const found = [...r.issues].map(([k, v]) => `${k}: ${v.n}× (${v.ex.join(' ; ')})`);
    assert.deepEqual(found, []);
    assert.equal(r.nanFixes, 0, 'NaN-Sicherheitsnetz musste eingreifen');
  });
}
