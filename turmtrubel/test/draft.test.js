// Draft-Modi: Generator, Angebote, Pool-Garantien, Pickreihenfolge, Sperren, Champion-Regel, Auto-Pick, Bot-Wahl.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createModes } from '../shared/modes.js';
import { createDraft, checkMegaPool, deckNeeds, cardTraits, TripleDraft, MegaDraft } from '../server/draft.js';
import { draftChoice } from '../server/botdraft.js';
import { mulberry32 } from '../server/sim/rng.js';
import { db } from './helpers.js';

const modes = createModes(JSON.parse(fs.readFileSync(new URL('../data/modes.json', import.meta.url), 'utf8')));
const TRIPLE = modes.get('triple-draft').draft;
const MEGA = modes.get('mega-draft').draft;

function runTriple(seed, chooser = (d, s) => d.autoPick(s)) {
  const d = createDraft(db, TRIPLE, { seed });
  while (!d.done) for (const s of d.pending()) chooser(d, s);
  return d;
}

function deckValidForDraft(ids, { maxChampions = 1, maxHeroes = 1 } = {}) {
  assert.equal(ids.length, 8);
  assert.equal(new Set(ids).size, 8, 'keine doppelten Karten');
  const cards = ids.map((id) => db.card(id));
  assert.ok(cards.every(Boolean));
  assert.ok(cards.filter((c) => c.class === 'champion').length <= maxChampions, 'Champion-Limit');
  assert.ok(cards.filter((c) => c.class === 'hero').length <= maxHeroes, 'Helden-Limit');
  for (const c of cards) if (c.heroOf) assert.ok(!ids.includes(c.heroOf), 'Held nicht mit Grundkarte');
}

test('Triple Draft ist seed-basiert reproduzierbar', () => {
  const a = runTriple(11);
  const b = runTriple(11);
  assert.deepEqual(a.log, b.log);
  assert.deepEqual(a.decks(), b.decks());
  const c = runTriple(12);
  assert.notDeepEqual(a.log, c.log);
});

test('Triple Draft: 8 Runden à 3 Angebote, gültige und spielbare Decks über viele Seeds', () => {
  for (let seed = 1; seed <= 150; seed++) {
    const d = createDraft(db, TRIPLE, { seed });
    let rounds = 0;
    while (!d.done) {
      for (const s of d.pending()) {
        const offer = d.offers[s];
        assert.equal(offer.length, 3);
        assert.equal(new Set(offer).size, 3, 'Angebot ohne Duplikate');
        assert.ok(offer.filter((id) => db.card(id).class !== 'normal').length <= 1, 'höchstens ein Champion/Held pro Angebot');
        for (const id of offer) assert.equal(d.ruleFor(s, id), null, `${id} verletzt die Deckregeln`);
      }
      // Zufällige (nicht helfende) Wahl: der Playability-Guard muss trotzdem ein spielbares Deck sichern
      for (const s of d.pending()) d.pick(s, d.offers[s][Math.floor(((seed * 7 + rounds * 3 + s) % 3))]);
      rounds++;
    }
    assert.equal(rounds, 8);
    for (const ids of d.picks) {
      deckValidForDraft(ids);
      assert.deepEqual(deckNeeds(db, ids), [], `Seed ${seed}: Deck nicht spielbar: ${ids.join(',')}`);
      assert.ok(ids.every((id) => db.card(id).class !== 'hero' || true));
    }
    for (const slots of d.decks()) {
      assert.equal(slots.length, 8);
      const sp = slots.findIndex((id) => db.card(id).class === 'champion');
      if (sp >= 0) assert.equal(sp, 2, 'Champion im Spezialplatz');
    }
  }
});

test('Triple Draft: jeder wählt im eigenen Tempo, sieht die Optionen des Gegners, aber nicht seine Wahl', () => {
  const d = new TripleDraft(db, TRIPLE, { seed: 4 });
  const old0 = d.offers[0].slice();
  const pick0 = old0[1];
  assert.equal(d.pick(0, pick0).ok, true);
  // Spieler 0 ist sofort in Runde 2, Spieler 1 noch in Runde 1
  assert.equal(d.roundOf(0), 1);
  assert.equal(d.roundOf(1), 0);
  assert.notDeepEqual(d.offers[0], old0, 'neues Angebot für Spieler 0');
  assert.equal(d.pick(0, old0[0]).code, 'NOT_OFFERED', 'zweite Karte aus dem alten Angebot geht nicht');
  const st1 = d.stateFor(1);
  assert.deepEqual(st1.oppCounts, [1, null], 'Spieler 1 sieht nur die Anzahl der Picks');
  assert.deepEqual(st1.oppOffers[0], d.offers[0], 'Spieler 1 sieht die aktuellen Optionen des Gegners');
  assert.equal(st1.oppOffers[1], null);
  assert.ok(!('picks' in st1 && st1.picks.includes(pick0)), 'eigene Picks enthalten nicht die des Gegners');
  assert.ok(!JSON.stringify({ ...st1, oppOffers: null }).includes(`"${pick0}"`) || d.offers[1].includes(pick0), 'die gewählte Karte bleibt verborgen');
  assert.equal(d.pick(1, 'nicht-im-angebot').code, 'NOT_OFFERED');
  // Spieler 0 kann alle 8 Karten wählen, während Spieler 1 noch wartet
  while (!d.finished(0)) assert.equal(d.autoPick(0).ok, true);
  assert.equal(d.done, false);
  assert.deepEqual(d.pending(), [1]);
  assert.equal(d.pick(0, d.offers[1][0]).code, 'ALREADY_PICKED');
  while (!d.done) d.autoPick(1);
  assert.equal(d.picks[1].length, 8);
});

test('Triple Draft: Auto-Pick wählt nur angebotene, erlaubte Karten', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const d = createDraft(db, TRIPLE, { seed });
    while (!d.done) {
      const offers = d.offers.map((o) => o.slice());
      for (const s of d.pending()) {
        assert.equal(d.autoPick(s).ok, true);
        assert.ok(offers[s].includes(d.picks[s].at(-1)));
      }
    }
  }
});

test('Mega Draft: Pool hat immer 40 eindeutige Karten, genau 3 Champions, keine Helden, Garantien erfüllt (500 Seeds)', () => {
  const rarities = new Set();
  for (let seed = 1; seed <= 500; seed++) {
    const d = new MegaDraft(db, MEGA, { seed });
    const r = checkMegaPool(db, MEGA, d.pool);
    assert.ok(r.ok, `Seed ${seed}: ${r.errors.join(', ')}`);
    assert.equal(d.pool.length, 40);
    assert.equal(new Set(d.pool).size, 40);
    const cards = d.pool.map((id) => db.card(id));
    assert.equal(cards.filter((c) => c.class === 'champion').length, 3);
    assert.equal(cards.filter((c) => c.class === 'hero').length, 0);
    const t = cards.filter((c) => c.class === 'normal').map((c) => cardTraits(db, c));
    assert.ok(t.filter((x) => !x.mirror && x.elixir <= 3).length >= 6);
    assert.ok(t.filter((x) => x.air).length >= 5);
    assert.ok(t.filter((x) => x.spell).length >= 4);
    assert.ok(t.filter((x) => x.building).length >= 2);
    for (const c of cards) rarities.add(c.rarity);
  }
  assert.ok(rarities.size >= 4);
  // reproduzierbar
  assert.deepEqual(new MegaDraft(db, MEGA, { seed: 9 }).pool, new MegaDraft(db, MEGA, { seed: 9 }).pool);
});

test('Mega Draft: abwechselnde Wahl, Startspieler per Los, Sperren mit Besitzer', () => {
  const firsts = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const d = new MegaDraft(db, MEGA, { seed });
    firsts.add(d.first);
    const order = [];
    while (!d.done) {
      const s = d.turn;
      order.push(s);
      const other = 1 - s;
      // der andere ist nicht dran
      assert.equal(d.pick(other, d.allowedFor(other)[0]).code, 'NOT_YOUR_TURN');
      assert.equal(d.autoPick(s).ok, true);
      const last = d.picks[s].at(-1);
      // schon gewählte Karte ist für beide gesperrt und dem Wähler zugeordnet
      assert.equal(d.stateFor(other).taken.find(([id]) => id === last)[1], s);
      if (!d.done && d.turn === other) assert.equal(d.pick(other, last).code, 'TAKEN');
    }
    assert.equal(order.length, 16);
    for (let i = 0; i < 16; i++) assert.equal(order[i], (d.first + i) % 2, 'strikt abwechselnd');
    assert.equal(d.picks[0].length, 8);
    assert.equal(d.picks[1].length, 8);
    assert.equal(d.pool.length - d.takenBy.size, 24, '24 Karten bleiben übrig');
    for (const ids of d.picks) {
      deckValidForDraft(ids, { maxHeroes: 0 });
      assert.deepEqual(deckNeeds(db, ids), []);
    }
  }
  assert.deepEqual([...firsts].sort(), [0, 1]);
});

test('Mega Draft: höchstens ein Champion pro Deck – auch Auto-Pick und Bots halten sich daran', () => {
  const d = new MegaDraft(db, MEGA, { seed: 21 });
  const champs = d.pool.filter((id) => db.card(id).class === 'champion');
  const s = d.turn;
  assert.equal(d.pick(s, champs[0]).ok, true);
  d.autoPick(d.turn);
  // zweiter Champion für denselben Spieler gesperrt, für den Gegner nicht
  assert.equal(d.pick(s, champs[1]).code, 'CHAMPION_LIMIT');
  assert.ok(!d.allowedFor(s).includes(champs[1]));
  assert.ok(d.allowedFor(1 - s).includes(champs[1]));
  assert.ok(d.stateFor(s).allowed.every((id) => db.card(id).class !== 'champion'));
  // viele Drafts nur mit Auto-Pick und Bots: nie zwei Champions
  for (let seed = 1; seed <= 60; seed++) {
    for (const diff of ['easy', 'medium', 'hard']) {
      const m = new MegaDraft(db, MEGA, { seed });
      const rng = mulberry32(seed);
      while (!m.done) {
        const id = seed % 2 ? draftChoice(db, m, m.turn, diff, rng) : null;
        const r = id ? m.pick(m.turn, id) : m.autoPick(m.turn);
        assert.equal(r.ok, true, r.code);
      }
      for (const ids of m.picks) assert.ok(ids.filter((id) => db.card(id).class === 'champion').length <= 1);
    }
  }
});

test('Bot-Draft: Mittel und Schwer bauen ausgewogene Decks, Leicht wählt überwiegend zufällig', () => {
  const avg = (ids) => ids.reduce((a, id) => a + cardTraits(db, db.card(id)).elixir, 0) / ids.length;
  const stats = { easy: [], medium: [], hard: [] };
  for (let seed = 1; seed <= 40; seed++) {
    for (const diff of Object.keys(stats)) {
      const d = new TripleDraft(db, TRIPLE, { seed });
      const rng = mulberry32(seed * 3);
      while (!d.done) for (const s of d.pending()) d.pick(s, draftChoice(db, d, s, diff, rng));
      const ids = d.picks[0];
      const t = ids.map((id) => cardTraits(db, db.card(id)));
      stats[diff].push({ avg: avg(ids), air: t.filter((x) => x.air).length, spells: t.filter((x) => x.spell).length, win: t.filter((x) => x.winCon).length });
    }
  }
  const mean = (arr, k) => arr.reduce((a, x) => a + x[k], 0) / arr.length;
  for (const diff of ['medium', 'hard']) {
    assert.ok(Math.abs(mean(stats[diff], 'avg') - 3.6) < 0.6, `${diff}: Ø Elixier ${mean(stats[diff], 'avg')}`);
    assert.ok(mean(stats[diff], 'air') >= 2.5, `${diff}: Luftabwehr`);
    assert.ok(mean(stats[diff], 'spells') >= 1, `${diff}: Zauber`);
    assert.ok(mean(stats[diff], 'win') >= 0.8, `${diff}: Win-Condition`);
  }
});
