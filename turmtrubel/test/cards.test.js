import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDeck, randomDeck, averageElixir, cycleCost, evoCardsOf, createDb, SPECIAL_SLOT } from '../shared/cards.js';
import { STARTER_DECKS } from '../shared/decks.js';
import { db, rawCards } from './helpers.js';

test('Kartendatenbank: 123 echte Karten + 17 Helden, 8 Champions, 42 Evos', () => {
  const cards = db.cards;
  assert.equal(cards.length, 140);
  assert.equal(cards.filter((c) => c.class !== 'hero').length, 123);
  assert.equal(cards.filter((c) => c.class === 'champion').length, 8);
  assert.equal(cards.filter((c) => c.class === 'hero').length, 17);
  assert.equal(cards.filter((c) => c.evo).length, 42);
  for (const t of ['troop', 'spell', 'building']) assert.ok(cards.some((c) => c.type === t), t);
  assert.equal(db.level, 11, 'Turnierstandard');
});

test('Jede Karte stammt aus der Wiki-Quelle', () => {
  for (const c of rawCards.cards) assert.ok(typeof c.src === 'string' && c.src.length > 1, c.id + ' ohne Quelle');
});

test('Kartenlevel ist konfigurierbar (×1,1 pro Stufe)', () => {
  const l13 = createDb(rawCards, { level: 13 });
  const k11 = db.unit('knight');
  const k13 = l13.unit('knight');
  assert.ok(Math.abs(k13.hp / k11.hp - 1.21) < 0.01, `${k13.hp} vs ${k11.hp}`);
  assert.equal(k13.speed, k11.speed, 'Tempo bleibt gleich');
  assert.ok(l13.spell(l13.card('fireball')).damage > db.spell(db.card('fireball')).damage);
});

test('Kartendatenbank: gültige Werte und eindeutige IDs', () => {
  const ids = new Set();
  for (const c of rawCards.cards) {
    assert.ok(!ids.has(c.id), 'doppelte ID ' + c.id);
    ids.add(c.id);
    assert.ok(Number.isInteger(c.elixir) && c.elixir >= 1 && c.elixir <= 9, c.id + ' Elixier');
    assert.ok(['common', 'rare', 'epic', 'legendary', 'champion'].includes(c.rarity), c.id + ' Seltenheit');
    assert.ok(c.name && c.description, c.id + ' Name/Beschreibung');
    if (c.type === 'spell') assert.ok(c.spell, c.id + ' spell');
    else {
      const u = db.unit(db.unitRefOf(c));
      assert.ok(u.hp > 0, c.id + ' hp');
      assert.ok(['ground', 'air', 'both', 'buildings'].includes(u.targets), c.id + ' targets');
      if (c.evo && !c.evo.spell) assert.ok(db.unit(c.id, true).evo, c.id + ' evo');
    }
    if (c.class === 'champion') assert.ok(c.ability.cost > 0 && c.rarity === 'champion', c.id + ' Fähigkeit');
    if (c.class === 'hero') {
      assert.ok(c.ability && c.ability.name, c.id + ' Heldenfähigkeit');
      assert.ok(rawCards.cards.some((b) => b.id === c.heroOf), c.id + ' Basiskarte');
    }
    if (c.evo) assert.ok(c.evo.cycles >= 1 && c.evo.description, c.id + ' evo-Daten');
  }
  for (const k of Object.keys(rawCards.tokens)) assert.ok(!ids.has(k), 'Token-ID kollidiert: ' + k);
});

test('Kartendatenbank: alle Verweise auf Einheiten sind auflösbar', () => {
  const refs = [];
  const collect = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      if ((k === 'unit' || k === 'build' || k === 'into') && typeof v === 'string') refs.push(v);
      else collect(v);
    }
  };
  collect(rawCards);
  assert.ok(refs.length > 10);
  for (const r of refs) assert.doesNotThrow(() => db.unit(r), r);
});

test('Deck-Validierung', () => {
  const ok = STARTER_DECKS[0].slots;
  assert.equal(validateDeck(db, ok).ok, true);
  assert.equal(validateDeck(db, ok.slice(0, 7)).ok, false);
  assert.equal(validateDeck(db, [...ok.slice(0, 7), ok[0]]).ok, false, 'Duplikat');
  assert.equal(validateDeck(db, [...ok.slice(0, 7), 'gibtsnicht']).ok, false, 'unbekannt');
  const champOutside = ok.slice();
  [champOutside[SPECIAL_SLOT], champOutside[5]] = [champOutside[5], champOutside[SPECIAL_SLOT]];
  assert.equal(validateDeck(db, champOutside).ok, false, 'Champion außerhalb des Spezialplatzes');
  const two = ok.slice();
  two[5] = 'archer-queen';
  assert.equal(validateDeck(db, two).ok, false, 'Held + Champion');
  const withBase = ok.slice();
  withBase[SPECIAL_SLOT] = 'knight-hero';
  withBase[5] = 'knight';
  assert.equal(validateDeck(db, withBase).ok, false, 'Held und Basiskarte zusammen');
  assert.equal(validateDeck(db, null).ok, false);
});

test('Alle Startdecks sind gültig', () => {
  for (const d of STARTER_DECKS) assert.equal(validateDeck(db, d.slots).ok, true, d.name + ': ' + validateDeck(db, d.slots).errors.join(','));
});

test('Zufallsdeck ist immer gültig', () => {
  for (let i = 0; i < 300; i++) {
    const d = randomDeck(db);
    const v = validateDeck(db, d);
    assert.ok(v.ok, v.errors.join(', '));
    assert.equal(new Set(d).size, 8);
  }
});

test('Durchschnittskosten, Zyklus und Evo-Plätze', () => {
  const d = STARTER_DECKS[0].slots;
  const avg = d.map((id) => db.card(id).elixir).reduce((a, b) => a + b) / 8;
  assert.equal(averageElixir(db, d), Math.round(avg * 10) / 10);
  const cheapest = d.map((id) => db.card(id).elixir).sort((a, b) => a - b);
  assert.equal(cycleCost(db, d), cheapest[0] + cheapest[1] + cheapest[2] + cheapest[3]);
  assert.deepEqual(evoCardsOf(db, d), d.slice(0, 2).filter((id) => db.card(id).evo));
  const withMirror = [...d.slice(0, 7), 'mirror'];
  assert.equal(averageElixir(db, withMirror), Math.round((d.slice(0, 7).reduce((s, id) => s + db.card(id).elixir, 0) / 7) * 10) / 10, 'Spiegel zählt nicht mit');
});
