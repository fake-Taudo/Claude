// Modus-Framework (modes.json → effektive Regeln) und Unendlich-Elixier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createModes, validateModes, resolveRules, teamLayout, isClassic } from '../shared/modes.js';
import { Match } from '../server/sim/match.js';
import { db, rules, DECK } from './helpers.js';

const json = JSON.parse(fs.readFileSync(new URL('../data/modes.json', import.meta.url), 'utf8'));
const modes = createModes(json);
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

function matchIn(modeId, overrides = {}) {
  const mode = modes.get(modeId);
  const R = resolveRules({ ...rules(), ...overrides }, mode);
  const m = new Match({ db, rules: R, decks: Array.from({ length: mode.players }, () => DECK), seed: 5 });
  m.started = true;
  return m;
}

test('modes.json ist gültig und enthält die sechs Modi', () => {
  assert.deepEqual(validateModes(json), []);
  assert.deepEqual(modes.list.map((m) => m.id), ['classic', 'infinite-elixir', 'triple-draft', 'mega-draft', '2v2', 'chaos']);
  assert.equal(modes.defaultId, 'classic');
  assert.equal(modes.get('2v2').multiplayerOnly, true);
  assert.equal(modes.get('2v2').botsAllowed, false);
  for (const id of ['classic', 'infinite-elixir', 'triple-draft', 'mega-draft']) assert.equal(modes.get(id).botsAllowed, true);
});

test('Ungültige Modus-Definitionen werden erkannt', () => {
  const bad = structuredClone(json);
  bad.modes[1].elixir.multiplier = -1;
  bad.modes[4].botsAllowed = true;
  bad.modes.push({ ...bad.modes[0] });
  const errs = validateModes(bad);
  assert.ok(errs.some((e) => e.includes('multiplier')));
  assert.ok(errs.some((e) => e.includes('Bots')));
  assert.ok(errs.some((e) => e.includes('doppelte')));
});

test('Klassisch: Regeln bleiben dasselbe Objekt (keine Modifikatoren)', () => {
  const R = rules();
  assert.ok(isClassic(modes.get('classic')));
  assert.equal(resolveRules(R, modes.get('classic')), R);
  assert.deepEqual(teamLayout(2), [0, 1]);
  assert.deepEqual(teamLayout(4), [0, 0, 1, 1]);
});

test('Modifikatoren sind komponierbar (Elixier-Faktor unabhängig vom Draft)', () => {
  const custom = { ...modes.get('triple-draft'), id: 'draft-x7', elixir: { multiplier: 7, phases: false } };
  const R = resolveRules(rules(), custom);
  assert.equal(R.elixir.rate, 7);
  assert.equal(R.elixir.phases, false);
  assert.equal(R.evo.enabled, false);
  // Draft-Modus ohne Elixier-Modifikator behält die klassische Regeneration
  const T = resolveRules(rules(), modes.get('triple-draft'));
  assert.equal(T.elixir.rate, undefined);
  assert.notEqual(T.elixir.phases, false);
});

test('Unendlich-Elixier: Start 10, Maximum 10, Regeneration ×7 in festen Tick-Schritten', () => {
  const m = matchIn('infinite-elixir');
  assert.equal(m.players[0].elixir, 10);
  assert.equal(m.elixirMultiplier(), 7);
  m.players[0].elixir = 0;
  // 2,8 s / 7 = 0,4 s pro Elixier → nach 2 s genau 5 Elixier (100 Ticks à 0,05 Elixier·7/2,8)
  for (let i = 0; i < 40; i++) m.step();
  close(m.players[0].elixir, 5, 1e-9);
  for (let i = 0; i < 100; i++) m.step();
  assert.equal(m.players[0].elixir, 10, 'Maximum bleibt 10');
});

test('Unendlich-Elixier: keine Doppel-/Dreifach-Phasen, auch nicht in der Verlängerung', () => {
  const m = matchIn('infinite-elixir');
  m.tick = Math.round((m.rules.regularSeconds - 10) / m.dt);
  m.step();
  assert.equal(m.elixirMultiplier(), 7);
  m.phase = 'overtime';
  assert.equal(m.elixirMultiplier(), 7);
  assert.equal(m.snapshot(0).em, 7);
});

test('Unendlich-Elixier: Server prüft Elixier weiter autoritativ', () => {
  const m = matchIn('infinite-elixir');
  const p = m.players[0];
  p.elixir = 2.99;
  p.hand[0] = 'giant';
  p.handReady[0] = 0;
  const r = m.play(0, 0, 'giant', 9, 26);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'ELIXIR');
});

test('Unendlich-Elixier: Eingabe-Limit pro Spieler, Kartenzyklus bleibt aktiv', () => {
  const m = matchIn('infinite-elixir');
  const p = m.players[0];
  const results = [];
  for (let k = 0; k < 8; k++) {
    p.elixir = 10;
    p.handReady.fill(0);
    const slot = 0;
    const card = p.hand[slot];
    const before = p.queue.length;
    const r = m.play(0, slot, card, 3 + k * 1.5, 21);
    results.push(r.ok ? 'ok' : r.code);
    if (r.ok) assert.equal(p.queue.length, before, 'gespielte Karte geht ans Ende der Warteschlange');
  }
  const ok = results.filter((x) => x === 'ok').length;
  assert.equal(ok, m.rules.limits.burst, `Burst ${m.rules.limits.burst}: ${results.join(',')}`);
  assert.ok(results.includes('TOO_FAST'));
  // nach einer Sekunde sind wieder Platzierungen erlaubt
  for (let i = 0; i < 20; i++) m.step();
  p.elixir = 10;
  p.handReady.fill(0);
  assert.equal(m.play(0, 0, p.hand[0], 9, 21).ok, true);
});

test('Schalter elixirInfinite: Elixier wird nie verbraucht', () => {
  const mode = { ...modes.get('infinite-elixir'), elixir: { multiplier: 7, phases: false, start: 10, infinite: true }, limits: null };
  const R = resolveRules(rules(), mode);
  const m = new Match({ db, rules: R, decks: [DECK, DECK], seed: 2 });
  m.started = true;
  const p = m.players[0];
  p.handReady.fill(0);
  assert.equal(m.play(0, 0, p.hand[0], 9, 21).ok, true);
  assert.equal(p.elixir, 10);
});

test('Spielzeit, Verlängerung und Sudden Death sind pro Modus konfigurierbar', () => {
  const mode = { ...modes.get('infinite-elixir'), match: { regularSeconds: 60, overtimeSeconds: 0, suddenDeath: 'firstHit' } };
  const R = resolveRules(rules(), mode);
  assert.equal(R.regularSeconds, 60);
  assert.equal(R.overtimeSeconds, 0);
  assert.equal(R.suddenDeath, 'firstHit');
  assert.ok(R.doubleElixirLastSeconds <= 60);
  const m = new Match({ db, rules: R, decks: [DECK, DECK], seed: 2 });
  m.started = true;
  for (let i = 0; i < 61 * 20 && !m.result; i++) m.step();
  assert.ok(m.result, 'endet nach 60 s ohne Verlängerung');
});

test('Draft-Modi spielen ohne Evolutionen', () => {
  const m = matchIn('triple-draft');
  assert.equal(m.players[0].evoCards.size, 0, 'Evo-Plätze werden ignoriert');
  const c = matchIn('classic');
  assert.ok(c.players[0].evoCards.size > 0 || !DECK.slice(0, 2).some((id) => db.card(id).evo));
});
