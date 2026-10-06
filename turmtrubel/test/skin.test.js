// skin.json: Namens-/Grafik-Mapping „original“ (Standard) und „custom“ (eigene Inhalte, leere Felder = Original)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDb } from '../shared/cards.js';
import { loadData } from '../server/index.js';
import { rawCards } from './helpers.js';

const skin = JSON.parse(fs.readFileSync(new URL('../data/skin.json', import.meta.url), 'utf8'));

test('skin.json: Standard ist „original“, „custom“ kennt jede Karte', () => {
  assert.equal(skin.active, 'original');
  assert.ok(skin.skins.original && skin.skins.custom);
  for (const c of rawCards.cards) assert.ok(skin.skins.custom.cards[c.id], 'custom fehlt: ' + c.id);
});

test('Skin „original“ lässt Namen und Werte unverändert', () => {
  const db = createDb(rawCards, { skin, skinName: 'original' });
  for (const c of rawCards.cards) assert.equal(db.card(c.id).name, c.name);
});

test('Skin „custom“: leere Felder fallen aufs Original zurück, gefüllte ersetzen Name/Look, Werte bleiben', () => {
  const s = structuredClone(skin);
  s.skins.custom.cards.knight = { name: 'Mein Ritter', description: 'Eigener Text', look: { cloth: '#123456' }, evo: { name: 'Mein Evo-Ritter', description: '' } };
  s.skins.custom.cards.fireball = { name: 'Feuerkugel', look: { image: '/img/skin/feuerkugel.png' } };
  const db = createDb(rawCards, { skin: s, skinName: 'custom' });
  const base = createDb(rawCards);
  assert.equal(db.card('knight').name, 'Mein Ritter');
  assert.equal(db.card('knight').description, 'Eigener Text');
  assert.equal(db.card('knight').evo.name, 'Mein Evo-Ritter');
  assert.equal(db.card('knight').evo.description, base.card('knight').evo.description);
  assert.equal(db.unit('knight').look.cloth, '#123456');
  assert.equal(db.unit('knight').look.body, base.unit('knight').look.body, 'restlicher Look bleibt');
  assert.equal(db.unit('knight').hp, base.unit('knight').hp, 'Werte unverändert');
  assert.equal(db.card('fireball').look.image, '/img/skin/feuerkugel.png');
  assert.equal(db.card('archers').name, base.card('archers').name, 'leerer Eintrag = Original');
});

test('Server: SKIN=custom wählt den Skin, ohne Variable gilt rules.json/skin.json', () => {
  const before = loadData();
  assert.equal(before.rules.skin, undefined);
  process.env.SKIN = 'custom';
  try {
    const d = loadData();
    assert.equal(d.rules.skin, 'custom');
    assert.equal(d.db.skin, 'custom');
    assert.notEqual(d.version, before.version, 'Datenversion ändert sich mit dem Skin');
  } finally {
    delete process.env.SKIN;
  }
});
