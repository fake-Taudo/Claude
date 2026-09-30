import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPlacementValid, placementRects, toView, fromView } from '../shared/arena.js';

const towers = [
  { x: 9, y: 29, half: 2 },
  { x: 3.5, y: 25.5, half: 1.5 },
  { x: 14.5, y: 25.5, half: 1.5 },
  { x: 9, y: 3, half: 2 },
  { x: 3.5, y: 6.5, half: 1.5 },
  { x: 14.5, y: 6.5, half: 1.5 },
];
const P = (o) => isPlacementValid({ obstacles: towers, enemyPrincessDown: [false, false], ...o });

test('Truppen: nur auf der eigenen Hälfte', () => {
  assert.equal(P({ side: 0, x: 9, y: 20, kind: 'troop' }), true);
  assert.equal(P({ side: 0, x: 9, y: 12, kind: 'troop' }), false);
  assert.equal(P({ side: 1, x: 9, y: 12, kind: 'troop' }), true);
  assert.equal(P({ side: 1, x: 9, y: 20, kind: 'troop' }), false);
});

test('Nicht im Fluss, nicht in Türmen, nicht außerhalb', () => {
  assert.equal(P({ side: 0, x: 3.5, y: 16, kind: 'troop' }), false);
  assert.equal(P({ side: 0, x: 3.5, y: 25.5, kind: 'troop' }), false);
  assert.equal(P({ side: 0, x: -1, y: 20, kind: 'troop' }), false);
  assert.equal(P({ side: 0, x: NaN, y: 20, kind: 'troop' }), false);
});

test('Zauber dürfen überall hin', () => {
  assert.equal(P({ side: 0, x: 9, y: 3, kind: 'spell' }), true);
  assert.equal(P({ side: 1, x: 9, y: 30, kind: 'spell' }), true);
  assert.equal(P({ side: 0, x: 40, y: 3, kind: 'spell' }), false);
});

test('Gebäude: ganz auf der eigenen Seite, keine Überlappung', () => {
  assert.equal(P({ side: 0, x: 9, y: 22, kind: 'building', half: 1 }), true);
  assert.equal(P({ side: 0, x: 9, y: 17.5, kind: 'building', half: 1 }), false, 'ragt in den Fluss');
  assert.equal(P({ side: 0, x: 5, y: 25.5, kind: 'building', half: 1 }), false, 'überlappt Wachturm');
});

test('Taschen öffnen sich nur in der Lane des zerstörten Wachturms', () => {
  assert.equal(P({ side: 0, x: 4, y: 12, kind: 'troop', enemyPrincessDown: [true, false] }), true);
  assert.equal(P({ side: 0, x: 14, y: 12, kind: 'troop', enemyPrincessDown: [true, false] }), false);
  assert.equal(P({ side: 0, x: 4, y: 5, kind: 'troop', enemyPrincessDown: [true, false] }), false, 'nur bis zur Taschengrenze');
  assert.equal(P({ side: 0, x: 4, y: 12, kind: 'building', half: 1, enemyPrincessDown: [true, true] }), false, 'keine Gebäude in der Tasche');
  assert.equal(placementRects(0, [true, true]).length, 3);
});

test('„Überall“-Truppen (Tunnelgräber) dürfen auf die Gegnerseite, aber nicht in den Fluss', () => {
  assert.equal(P({ side: 0, x: 9, y: 9, kind: 'troop', anywhere: true }), true);
  assert.equal(P({ side: 0, x: 9, y: 16, kind: 'troop', anywhere: true }), false);
  assert.equal(P({ side: 0, x: 3.5, y: 16, kind: 'troop', anywhere: true }), true, 'Brücke ist ok');
});

test('Ansicht von Spieler 1 ist um 180° gedreht', () => {
  assert.deepEqual(toView(1, 3, 5), { x: 15, y: 27 });
  assert.deepEqual(fromView(1, 15, 27), { x: 3, y: 5 });
  assert.deepEqual(toView(0, 3, 5), { x: 3, y: 5 });
});
