import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockedByRiver, RIVER_Y0 } from '../shared/arena.js';
import { Match } from '../server/sim/match.js';
import { Bot } from '../server/bot.js';
import { randomDeck } from '../shared/cards.js';
import { mulberry32 } from '../server/sim/rng.js';
import { db, rules, newMatch, runSeconds, runUntil, spawn, forceHand, tower, DECK } from './helpers.js';

test('Fester Tick: 20 Ticks pro Sekunde', () => {
  const m = newMatch();
  assert.equal(m.rules.tickRate, 20);
  assert.equal(m.dt, 0.05);
  for (let i = 0; i < 20; i++) m.step();
  assert.equal(m.tick, 20);
  assert.ok(Math.abs(m.time - 1) < 1e-9);
});

test('Simulation ist deterministisch (gleicher Seed + gleiche Eingaben)', () => {
  const play = () => {
    const rng = mulberry32(7);
    const decks = [randomDeck(db, rng), randomDeck(db, rng)];
    const m = new Match({ db, rules: rules(), decks, seed: 99 });
    m.started = true;
    const bots = [new Bot(m, 0, 1), new Bot(m, 1, 2)];
    for (let i = 0; i < 20 * 60; i++) {
      bots[0].update();
      bots[1].update();
      m.step();
      m.flushEvents();
    }
    return JSON.stringify(m.snapshotCommon().e);
  };
  assert.equal(play(), play());
});

test('Snapshot enthält Entitäten, Hand und Elixier', () => {
  const m = newMatch();
  m.step();
  const s = m.snapshot(0);
  assert.equal(s.type, 's');
  assert.equal(s.e.length, 6); // 6 Kronentürme
  assert.equal(s.e[0].length, 12);
  assert.equal(s.me.h.length, 4);
  assert.ok(typeof s.me.n === 'string');
  assert.ok(s.me.el >= 5);
});

test('Bodentruppen überqueren den Fluss nur über Brücken', () => {
  const m = newMatch();
  const u = spawn(m, 'knappe', 0, 9, 20);
  let crossed = false;
  for (let i = 0; i < 20 * 25 && !u.dead; i++) {
    m.step();
    assert.ok(!blockedByRiver(u.x, u.y), `Einheit im Fluss bei ${u.x.toFixed(2)},${u.y.toFixed(2)}`);
    if (u.y < RIVER_Y0) crossed = true;
  }
  assert.ok(crossed, 'Einheit hat den Fluss überquert');
});

test('Einheiten laufen zum nächsten Turm und greifen ihn an', () => {
  const m = newMatch();
  const giant = spawn(m, 'steinkoloss', 0, 3.5, 19);
  const target = tower(m, 1, 'princess', 0);
  const hp0 = target.hp;
  runUntil(m, () => target.hp < hp0, 40);
  assert.ok(target.hp < hp0, 'Wachturm hat Schaden genommen');
  assert.equal(giant.targetId, target.id);
});

test('Nach dem Tod des Ziels sucht eine Truppe ein neues Ziel und läuft weiter', () => {
  const m = newMatch();
  const knight = spawn(m, 'knappe', 0, 3.5, 18);
  const skel = spawn(m, 'knochenwichte', 1, 3.5, 16.2);
  runUntil(m, () => skel.dead && !m.entities.includes(skel), 5);
  assert.ok(skel.dead, 'Skelett besiegt');
  const y0 = knight.y;
  runSeconds(m, 2);
  assert.ok(knight.targetId !== 0, 'hat wieder ein Ziel');
  assert.ok(knight.y < y0 - 1, 'läuft weiter Richtung Gegnerturm');
  const pr = tower(m, 1, 'princess', 0);
  runUntil(m, () => pr.hp < pr.maxHp, 20);
  assert.ok(pr.hp < pr.maxHp, 'greift danach den Wachturm an');
});

test('Türme wechseln nach einem Kill auf das nächste Ziel', () => {
  const m = newMatch();
  const t = tower(m, 0, 'princess', 0);
  const a = spawn(m, 'knochenwichte', 1, 3.5, 19.5);
  a.def = { ...a.def, speed: 0 };
  runUntil(m, () => a.dead, 5);
  assert.ok(a.dead);
  runSeconds(m, 0.2);
  const b = spawn(m, 'knappe', 1, 4.5, 20);
  b.def = { ...b.def, speed: 0 };
  runSeconds(m, 3);
  assert.equal(t.targetId, b.id);
  assert.ok(b.hp < b.maxHp, 'zweites Ziel wird beschossen');
});

test('Einheit, deren Zielturm fällt, zieht zum nächsten Turm weiter', () => {
  const m = newMatch();
  const giant = spawn(m, 'steinkoloss', 0, 3.5, 11);
  const pr = tower(m, 1, 'princess', 0);
  runUntil(m, () => giant.targetId === pr.id && giant.locked, 10);
  m.damage(pr, 1e7, null, 0);
  runSeconds(m, 0.5);
  const king = tower(m, 1, 'king');
  assert.equal(giant.targetId, king.id);
  runUntil(m, () => king.hp < king.maxHp, 25);
  assert.ok(king.hp < king.maxHp);
});

test('Gebäudejäger ignorieren Truppen', () => {
  const m = newMatch();
  const giant = spawn(m, 'steinkoloss', 0, 3.5, 18);
  const knight = spawn(m, 'knappe', 1, 3.5, 16.5);
  runSeconds(m, 2);
  assert.notEqual(giant.targetId, knight.id);
  const t = m.byId.get(giant.targetId);
  assert.ok(t && t.kind !== 'unit');
});

test('Wachturm beschießt Gegner in Reichweite', () => {
  const m = newMatch();
  const enemy = spawn(m, 'steinkoloss', 1, 3.5, 20);
  enemy.def = { ...enemy.def, speed: 0 };
  runSeconds(m, 3);
  assert.ok(enemy.hp < enemy.maxHp, 'Einheit wurde getroffen');
});

test('Burgturm schläft, bis er getroffen wird', () => {
  const m = newMatch();
  const king = tower(m, 1, 'king');
  assert.equal(king.active, false);
  m.damage(king, 50, null, 0);
  assert.equal(king.active, true);
});

test('Burgturm erwacht, wenn ein Wachturm fällt', () => {
  const m = newMatch();
  const king = tower(m, 1, 'king');
  const pr = tower(m, 1, 'princess', 1);
  pr.hp = 1;
  m.damage(pr, 100, null, 0);
  m.step();
  assert.equal(king.active, true);
  assert.deepEqual(m.crowns, [1, 0]);
});

test('Platzierung: nur eigene Hälfte, Zauber überall', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'knappe');
  assert.equal(m.play(0, 0, 'knappe', 9, 10).code, 'PLACEMENT');
  assert.equal(m.play(0, 0, 'knappe', 9, 16).code, 'PLACEMENT'); // Fluss
  assert.equal(m.play(0, 0, 'knappe', 3.5, 25.5).code, 'PLACEMENT'); // im Turm
  assert.equal(m.play(0, 0, 'knappe', 9, 22).ok, true);
  forceHand(m, 0, 1, 'glutball');
  assert.equal(m.play(0, 1, 'glutball', 9, 5).ok, true);
});

test('Gefallener Wachturm öffnet die Tasche in seiner Lane', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'knappe');
  assert.equal(m.play(0, 0, 'knappe', 3.5, 12).code, 'PLACEMENT');
  const pr = tower(m, 1, 'princess', 0);
  m.damage(pr, 1e6, null, 0);
  m.step();
  assert.equal(m.play(0, 0, 'knappe', 3.5, 12).ok, true);
  forceHand(m, 0, 0, 'knappe');
  assert.equal(m.play(0, 0, 'knappe', 14.5, 12).code, 'PLACEMENT', 'andere Lane bleibt gesperrt');
});

test('Handrotation wie im Original', () => {
  const m = newMatch();
  const p = m.players[0];
  p.elixir = 10;
  const slot = p.hand.findIndex((id) => db.card(id).class === 'normal');
  const played = p.hand[slot];
  const next = p.queue[0];
  const card = db.card(played);
  const pos = card.type === 'spell' ? [9, 10] : [9, 22];
  assert.ok(m.play(0, slot, played, ...pos).ok);
  assert.equal(p.hand[slot], next, 'nächste Karte rückt nach');
  assert.equal(p.queue.at(-1), played, 'gespielte Karte geht ans Ende');
  assert.equal(p.hand.length + p.queue.length, 8);
  assert.equal(m.play(0, slot, p.hand[slot], ...pos).code, 'NOT_READY', 'kurze Ankunftsverzögerung');
});

test('Falsche Karte / falscher Platz wird abgelehnt (Anti-Cheat)', () => {
  const m = newMatch();
  assert.equal(m.play(0, 7, 'knappe', 9, 22).code, 'BAD_SLOT');
  assert.equal(m.play(0, 0, 'nicht-da', 9, 22).code, 'NOT_IN_HAND');
  assert.equal(m.play(0, 0, m.players[0].hand[1] === m.players[0].hand[0] ? 'x' : m.players[0].hand[1], 9, 22).code, 'NOT_IN_HAND');
  m.started = false;
  assert.equal(m.play(0, 0, m.players[0].hand[0], 9, 22).code, 'NOT_RUNNING');
});

test('Champion kehrt erst nach seinem Tod in den Zyklus zurück', () => {
  const m = newMatch();
  const p = m.players[0];
  p.queue = p.queue.filter((id) => id !== 'mirell');
  p.hand = p.hand.map((id) => (id === 'mirell' ? 'knappe' : id));
  forceHand(m, 0, 0, 'mirell');
  assert.ok(m.play(0, 0, 'mirell', 9, 22).ok);
  assert.equal(p.championOut, 'mirell');
  assert.ok(!p.queue.includes('mirell'));
  const champ = m.entities.find((e) => e.def.cardId === 'mirell');
  champ.hp = 0;
  champ.dead = true;
  m.step();
  assert.equal(p.championOut, null);
  assert.equal(p.queue.at(-1), 'mirell');
});

test('Champion-Fähigkeit kostet Elixier und hat Abklingzeit', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'mirell');
  assert.ok(m.play(0, 0, 'mirell', 9, 20).ok);
  runSeconds(m, 1.1);
  spawn(m, 'knappe', 1, 9, 18);
  m.players[0].elixir = 1;
  assert.equal(m.useAbility(0).code, 'ELIXIR');
  m.players[0].elixir = 5;
  assert.equal(m.useAbility(0).ok, true);
  assert.equal(m.players[0].elixir, 3);
  assert.equal(m.useAbility(0).code, 'COOLDOWN');
  runSeconds(m, 12.1);
  m.players[0].elixir = 5;
  assert.equal(m.useAbility(0).ok, true);
});

test('Helden-Fähigkeit ist einmalig', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'torvin');
  assert.ok(m.play(0, 0, 'torvin', 9, 20).ok);
  runSeconds(m, 1.1);
  const enemy = spawn(m, 'knappe', 1, 9, 18.5);
  assert.equal(m.useAbility(0).ok, true);
  assert.ok(enemy.hp < enemy.maxHp);
  assert.equal(m.useAbility(0).code, 'NO_ABILITY');
});

test('Evo: nach genug Zyklen wird die Karte entwickelt ausgespielt', () => {
  const m = newMatch();
  const cycles = db.card('knappe').evo.cycles;
  for (let i = 0; i < cycles; i++) {
    forceHand(m, 0, 0, 'knappe');
    const r = m.play(0, 0, 'knappe', 9, 22);
    assert.ok(r.ok && !r.evo);
  }
  forceHand(m, 0, 0, 'knappe');
  const r = m.play(0, 0, 'knappe', 9, 23);
  assert.ok(r.ok && r.evo);
  const evoUnit = m.entities.filter((e) => e.def.cardId === 'knappe').at(-1);
  assert.equal(evoUnit.evo, true);
  assert.ok(evoUnit.def.traits.movingArmor > 0);
});

test('Zauber: Flächenschaden und reduzierter Turmschaden', () => {
  const m = newMatch();
  const a = spawn(m, 'knappe', 1, 9, 10);
  const pr = tower(m, 1, 'princess', 0);
  forceHand(m, 0, 0, 'glutball');
  assert.ok(m.play(0, 0, 'glutball', 9, 10).ok);
  runSeconds(m, 1.2);
  assert.equal(a.maxHp - a.hp, db.card('glutball').spell.damage);
  forceHand(m, 0, 0, 'glutball');
  assert.ok(m.play(0, 0, 'glutball', pr.x, pr.y).ok);
  runSeconds(m, 1.2);
  assert.equal(Math.round(pr.maxHp - pr.hp), Math.round(650 * 0.3));
});

test('Eishauch betäubt, Kettenblitz springt, Heilregen heilt', () => {
  const m = newMatch();
  const e1 = spawn(m, 'steinkoloss', 1, 9, 9);
  const e2 = spawn(m, 'knappe', 1, 11, 9);
  forceHand(m, 0, 0, 'eishauch');
  assert.ok(m.play(0, 0, 'eishauch', 10, 9).ok);
  m.step();
  assert.ok(e1.stunT > 3 && e2.stunT > 3);
  const h1 = e1.hp;
  const h2 = e2.hp;
  forceHand(m, 0, 0, 'kettenblitz');
  assert.ok(m.play(0, 0, 'kettenblitz', 9, 9).ok);
  m.step();
  assert.ok(e1.hp < h1 && e2.hp < h2, 'beide Ziele getroffen');
  const mine = spawn(m, 'knappe', 0, 9, 24);
  mine.hp = 500;
  forceHand(m, 0, 0, 'heilregen');
  assert.ok(m.play(0, 0, 'heilregen', 9, 24).ok);
  runSeconds(m, 3);
  assert.ok(mine.hp > 1000);
});

test('Todes-Effekte: Felsgigant zerfällt in Felsbrocken', () => {
  const m = newMatch();
  const g = spawn(m, 'felsgigant', 0, 9, 22);
  g.hp = 0;
  g.dead = true;
  m.step();
  assert.equal(m.entities.filter((e) => e.def.key === 'felsbrocken').length, 2);
});

test('Gebäude verfallen über ihre Lebensdauer', () => {
  const m = newMatch();
  forceHand(m, 0, 0, 'barrikade');
  assert.ok(m.play(0, 0, 'barrikade', 9, 22).ok);
  const b = m.entities.find((e) => e.def.key === 'barrikade');
  runSeconds(m, 27);
  assert.ok(b.dead || !m.entities.includes(b));
});

test('Bot gegen Bot: 20 Kämpfe laufen fehlerfrei bis zum Ende', () => {
  const reasons = new Set();
  for (let g = 0; g < 20; g++) {
    const rng = mulberry32(1000 + g);
    const m = new Match({ db, rules: rules(), decks: [randomDeck(db, rng), randomDeck(db, rng)], seed: g });
    m.started = true;
    const bots = [new Bot(m, 0, g * 2 + 1), new Bot(m, 1, g * 2 + 2)];
    const idle = new Map();
    while (!m.result && m.tick < 20 * 320) {
      bots[0].update();
      bots[1].update();
      m.step();
      m.snapshot(0);
      m.flushEvents();
      for (const e of m.entities) {
        assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.hp));
        // Keine Einheit darf ohne gültiges Ziel "einfrieren"
        const active = e.kind === 'unit' && !e.dead && e.deployT <= 0 && e.stunT <= 0 && !e.dash;
        const lost = !e.targetId || !m.byId.has(e.targetId);
        const n = active && lost ? (idle.get(e.id) || 0) + 1 : 0;
        idle.set(e.id, n);
        assert.ok(n <= 2, `${e.def.key} (#${e.id}) steht ohne Ziel herum`);
      }
    }
    assert.ok(m.result, 'Kampf endet spätestens nach der Verlängerung');
    reasons.add(m.result.reason);
  }
  assert.ok(reasons.size >= 2, 'unterschiedliche Ausgänge: ' + [...reasons].join(','));
});

test('Startdeck-Standard ist gültig', () => {
  assert.equal(DECK.length, 8);
});
