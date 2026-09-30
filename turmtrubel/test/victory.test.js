import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, runSeconds, tower } from './helpers.js';

const destroy = (m, t, by) => {
  m.damage(t, 1e7, null, by);
  m.step();
};

test('Burgturm zerstört → sofortiger Sieg mit 3 Kronen', () => {
  const m = newMatch();
  destroy(m, tower(m, 1, 'king'), 0);
  assert.ok(m.result);
  assert.equal(m.result.winner, 0);
  assert.equal(m.result.reason, 'king');
  assert.deepEqual(m.result.crowns, [3, 0]);
  assert.ok(m.time < 1);
});

test('Wachturm = 1 Krone, zwei Wachtürme = 2 Kronen, Kampf läuft weiter', () => {
  const m = newMatch();
  destroy(m, tower(m, 0, 'princess', 0), 1);
  assert.deepEqual(m.crowns, [0, 1]);
  destroy(m, tower(m, 0, 'princess', 1), 1);
  assert.deepEqual(m.crowns, [0, 2]);
  assert.equal(m.result, null);
});

test('Nach 3 Minuten gewinnt, wer mehr Kronen hat', () => {
  const m = newMatch();
  destroy(m, tower(m, 1, 'princess', 1), 0);
  runSeconds(m, 185);
  assert.ok(m.result);
  assert.equal(m.result.winner, 0);
  assert.equal(m.result.reason, 'time');
  assert.equal(m.phase, 'regular');
});

test('Gleichstand nach 3 Minuten → Verlängerung, erster Turm entscheidet (Sudden Death)', () => {
  const m = newMatch();
  runSeconds(m, 181);
  assert.equal(m.result, null);
  assert.equal(m.phase, 'overtime');
  runSeconds(m, 30);
  assert.equal(m.result, null);
  destroy(m, tower(m, 0, 'princess', 0), 1);
  assert.ok(m.result);
  assert.equal(m.result.winner, 1);
  assert.equal(m.result.reason, 'suddenDeath');
});

test('Ende der Verlängerung: Turm mit den wenigsten Lebenspunkten verliert', () => {
  const m = newMatch();
  m.damage(tower(m, 0, 'princess', 1), 250, null, 1);
  m.damage(tower(m, 1, 'princess', 0), 100, null, 0);
  runSeconds(m, 301);
  assert.ok(m.result);
  assert.equal(m.result.reason, 'tiebreak');
  assert.equal(m.result.winner, 1, 'Spieler 0 hat den schwächsten Turm');
});

test('Ohne Unterschied: Unentschieden', () => {
  const m = newMatch();
  runSeconds(m, 301);
  assert.ok(m.result);
  assert.equal(m.result.winner, null);
  assert.equal(m.result.reason, 'draw');
  assert.equal(Math.round(m.time), 300);
});

test('Regelvariante "firstHit": erster Turmtreffer in der Verlängerung gewinnt', () => {
  const m = newMatch({ rulesOverride: { suddenDeath: 'firstHit' } });
  runSeconds(m, 181);
  assert.equal(m.phase, 'overtime');
  m.damage(tower(m, 1, 'princess', 1), 1, null, 0);
  assert.ok(m.result);
  assert.equal(m.result.winner, 0);
});

test('Aufgabe: Gegner gewinnt mit 3 Kronen', () => {
  const m = newMatch();
  m.forfeit(0);
  assert.equal(m.result.winner, 1);
  assert.equal(m.result.reason, 'forfeit');
  assert.equal(m.result.crowns[1], 3);
});

test('Nach Kampfende werden keine Eingaben mehr angenommen', () => {
  const m = newMatch();
  m.forfeit(1);
  const p = m.players[0];
  assert.equal(m.play(0, 0, p.hand[0], 9, 22).code, 'NOT_RUNNING');
  const t = m.tick;
  m.step();
  assert.equal(m.tick, t, 'Simulation steht');
});
