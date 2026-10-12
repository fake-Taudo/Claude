// Update-Fenster „Neu in Turmtrubel“: Aufbau des Update-Verlaufs (client/js/updates.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UPDATES, LATEST_UPDATE } from '../client/js/updates.js';
import { hasIcon } from '../client/js/ui/icons.js';

test('Update-Verlauf: mindestens ein Eintrag, neuester zuerst', () => {
  assert.ok(UPDATES.length > 0);
  assert.equal(LATEST_UPDATE, UPDATES[0]);
});

test('Update-IDs sind eindeutig und absteigend sortiert', () => {
  const ids = UPDATES.map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte Update-ID');
  for (const id of ids) assert.match(id, /^\d{4}-\d{2}-\d{2}\.\d+$/, `ID-Format: ${id}`);
  // ID-Vergleich numerisch nach Datum und laufender Nummer (2026-10-12.10 > 2026-10-12.9)
  const key = (id) => {
    const [d, n] = id.split('.');
    return [Number(d.replaceAll('-', '')), Number(n)];
  };
  for (let i = 1; i < ids.length; i++) {
    const [a, b] = [key(ids[i - 1]), key(ids[i])];
    assert.ok(a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]), `${ids[i - 1]} muss neuer sein als ${ids[i]}`);
  }
});

test('Jeder Eintrag hat Version, Datum, Titel und gültige Funktionen', () => {
  for (const u of UPDATES) {
    for (const k of ['version', 'date', 'title']) assert.ok(typeof u[k] === 'string' && u[k].trim(), `${u.id}: ${k} fehlt`);
    assert.match(u.date, /^\d{2}\.\d{2}\.\d{4}$/, `${u.id}: Datum TT.MM.JJJJ`);
    assert.ok(Array.isArray(u.items) && u.items.length > 0, `${u.id}: keine Funktionen`);
    for (const it of u.items) {
      assert.ok(hasIcon(it.icon), `${u.id}: unbekanntes Icon „${it.icon}“`);
      assert.ok(it.title?.trim() && it.text?.trim(), `${u.id}: Titel/Text fehlt`);
    }
  }
});
