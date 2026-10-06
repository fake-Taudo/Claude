// Abgleich der Kartendaten mit dem Wiki-Snapshot (data/source/wiki-cards.json, Turnierstandard Level 11):
// Elixier, Seltenheit und Typ müssen stimmen; Leben/Schaden dürfen nur abweichen, wenn die Abweichung
// (z. B. eine Balance-Änderung 2026) in TODO_missing_stats.md dokumentiert ist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rawCards } from './helpers.js';

const snap = JSON.parse(fs.readFileSync(new URL('../data/source/wiki-cards.json', import.meta.url), 'utf8'));
const todo = fs.readFileSync(new URL('../TODO_missing_stats.md', import.meta.url), 'utf8');
const documented = new Set([...todo.matchAll(/\(`([a-z0-9-]+)`\)/g)].map((m) => m[1]));
const lead = (s) => Number(String(s).replace(/,/g, '').match(/[\d.]+/)?.[0]);
const regular = rawCards.cards.filter((c) => c.class !== 'hero');

test('Wiki-Snapshot: jede reguläre Karte stammt von einer Wiki-Seite', () => {
  assert.equal(regular.length, snap.regular.length);
  for (const c of regular) assert.ok(snap.pages[c.src], `${c.id}: keine Wiki-Seite „${c.src}“`);
});

test('Wiki-Snapshot: Elixier, Seltenheit und Typ wie im Original', () => {
  for (const c of regular) {
    const ib = snap.pages[c.src].infobox;
    if (c.elixirRule === 'mirror') assert.match(ib.Cost, /previous card/i, c.id);
    else assert.equal(lead(ib.Cost), c.elixir, `${c.id}: Elixier`);
    assert.equal(c.rarity, String(ib.Rarity).toLowerCase(), `${c.id}: Seltenheit`);
    assert.equal(c.type === 'troop' ? 'Troop' : c.type === 'spell' ? 'Spell' : 'Building', ib.Type, `${c.id}: Typ`);
  }
});

test('Wiki-Snapshot: Leben und Schaden (Level 11) – Abweichungen nur dokumentiert', () => {
  let checked = 0;
  const undocumented = [];
  for (const c of regular) {
    if (typeof c.unit !== 'object') continue;
    const t = snap.pages[c.src].tables.find((x) => x.id === 'unit-statistics-table');
    if (!t) continue;
    const col = (name) => {
      const own = t.headers.indexOf(`${c.src} ${name}`);
      return own >= 0 ? own : t.headers.indexOf(name);
    };
    for (const [name, value] of [['Hitpoints', c.unit.hp], ['Damage', c.unit.damage]]) {
      const i = col(name);
      if (i < 0 || !value) continue;
      checked++;
      if (lead(t.rows[0][i]) !== value && !documented.has(c.id)) undocumented.push(`${c.id} ${name}: ${value} statt ${t.rows[0][i]}`);
    }
  }
  assert.ok(checked > 120, `nur ${checked} Werte geprüft`);
  assert.deepEqual(undocumented, []);
});
