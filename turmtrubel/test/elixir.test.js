import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, runSeconds, forceHand, tower } from './helpers.js';

const close = (a, b, eps = 0.03) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

test('Elixier startet bei 5', () => {
  const m = newMatch();
  assert.equal(m.players[0].elixir, 5);
  assert.equal(m.players[1].elixir, 5);
});

test('Regeneration: 1 Elixier pro 2,8 s', () => {
  const m = newMatch();
  runSeconds(m, 2.8);
  close(m.players[0].elixir, 6);
  runSeconds(m, 2.8 * 2);
  close(m.players[0].elixir, 8);
});

test('Elixier ist bei 10 gedeckelt', () => {
  const m = newMatch();
  runSeconds(m, 30);
  assert.equal(m.players[0].elixir, 10);
  assert.equal(m.players[1].elixir, 10);
});

test('Letzte Minute: doppelte Regeneration', () => {
  const m = newMatch();
  runSeconds(m, 119);
  assert.equal(m.elixirMultiplier(), 1);
  runSeconds(m, 2);
  assert.equal(m.elixirMultiplier(), 2);
  m.players[0].elixir = 0;
  runSeconds(m, 2.8);
  close(m.players[0].elixir, 2);
});

test('Verlängerung: dreifache Regeneration', () => {
  const m = newMatch();
  runSeconds(m, 181);
  assert.equal(m.phase, 'overtime');
  assert.equal(m.elixirMultiplier(), 3);
  m.players[1].elixir = 0;
  runSeconds(m, 2.8);
  close(m.players[1].elixir, 3);
});

test('Ausspielen kostet Elixier, zu wenig Elixier wird abgelehnt', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'pekka', 4);
  const r1 = m.play(0, 0, 'pekka', 9, 24);
  assert.equal(r1.ok, false);
  assert.equal(r1.code, 'ELIXIR');
  m.players[0].elixir = 9;
  const r2 = m.play(0, 0, 'pekka', 9, 24);
  assert.equal(r2.ok, true);
  close(m.players[0].elixir, 2, 1e-9);
});

test('Elixiersammler erzeugt Elixier für seinen Besitzer', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'elixir-collector', 10);
  assert.ok(m.play(0, 0, 'elixir-collector', 9, 22).ok);
  runSeconds(m, 1); // Aufbau
  m.players[0].elixir = 0;
  m.players[1].elixir = 0;
  runSeconds(m, 13.5);
  // 13,5 s Regeneration ≈ 4,8 + 1 vom Sammler (alle 13 s)
  assert.ok(m.players[0].elixir > m.players[1].elixir + 0.9, `${m.players[0].elixir} vs ${m.players[1].elixir}`);
  assert.ok(tower(m, 0, 'king'));
});
