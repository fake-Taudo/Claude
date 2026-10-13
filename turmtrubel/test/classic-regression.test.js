// Regression: Der klassische 1v1-Modus verhält sich Tick für Tick wie in der Aufzeichnung.
// test/fixtures/classic-replay.json stammte aus der Version vor dem Modus-Umbau (der Umbau blieb bitgenau gleich) und
// wurde nach dem Fehler-Audit (Version 1.7) neu geschrieben – dessen Simulations-Fehlerbehebungen ändern das
// Verhalten absichtlich (docs/BUG_AUDIT.md). Jede weitere unbeabsichtigte Änderung fällt hier auf.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadClassic, record, replay, FIXTURE } from '../tools/modes/classic-replay.mjs';

const games = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')).games;
const { db, rules } = loadClassic();

test('Klassisch: gespeicherte Eingaben ergeben Tick für Tick dieselben Snapshots wie in der Aufzeichnung', () => {
  for (const rec of games) {
    const r = replay(db, rules, rec);
    assert.deepEqual(r.errors, [], `Kampf ${rec.g}: Eingaben abgelehnt`);
    assert.equal(r.ticks, rec.ticks, `Kampf ${rec.g}: Länge`);
    assert.deepEqual(r.checkpoints, rec.checkpoints, `Kampf ${rec.g}: Zwischenstände`);
    assert.equal(r.digest, rec.digest, `Kampf ${rec.g}: Prüfsumme über alle Ticks`);
    assert.deepEqual(r.result, rec.result, `Kampf ${rec.g}: Ergebnis`);
  }
});

test('Klassisch: der Trainingsbot (Standardstufe) trifft dieselben Entscheidungen wie in der Aufzeichnung', () => {
  for (const rec of games.slice(0, 6)) {
    const r = record(db, rules, rec.g);
    assert.deepEqual(r.inputs, rec.inputs, `Kampf ${rec.g}: Eingaben des Bots`);
    assert.equal(r.digest, rec.digest, `Kampf ${rec.g}: Prüfsumme`);
  }
});
