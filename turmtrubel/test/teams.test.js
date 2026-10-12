// 2 gegen 2 in der Simulation: N Spieler in 2 Teams, gemeinsame Türme, Kronen pro Team, kein Eigenbeschuss,
// Heilung/Wut für Verbündete, Spieler-Zuordnung von Folge-Einheiten, Elixier und Champions pro Spieler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../server/sim/match.js';
import { Bot } from '../server/bot.js';
import { resolveRules } from '../shared/modes.js';
import { randomDeck } from '../shared/cards.js';
import { defaultModes } from '../server/rooms.js';
import { mulberry32 } from '../server/sim/rng.js';
import { db, rules, DECK, spawn, runSeconds, tower } from './helpers.js';

const MODE = defaultModes().get('2v2');

function teamMatch(decks = [DECK, DECK, DECK, DECK], seed = 3) {
  const m = new Match({ db, rules: resolveRules(rules(), MODE), decks, seed });
  m.started = true;
  return m;
}

function give(m, pl, card, elixir = 10) {
  const p = m.players[pl];
  p.hand[0] = card;
  p.handReady[0] = 0;
  p.elixir = elixir;
}

test('4 Spieler, 2 Teams: eigene Hand, eigenes Elixier, gemeinsame Türme (1 Burgturm + 2 Wachtürme pro Team)', () => {
  const m = teamMatch();
  assert.equal(m.players.length, 4);
  assert.deepEqual(m.players.map((p) => p.team), [0, 0, 1, 1]);
  assert.equal(m.towers.length, 6);
  for (const team of [0, 1]) {
    assert.equal(m.towers.filter((t) => t.owner === team && t.towerKey === 'king').length, 1);
    assert.equal(m.towers.filter((t) => t.owner === team && t.towerKey === 'princess').length, 2);
  }
  m.players[0].elixir = 0;
  runSeconds(m, 2.8);
  assert.ok(Math.abs(m.players[0].elixir - 1) < 1e-6);
  assert.ok(Math.abs(m.players[1].elixir - 6) < 1e-6, 'Teamkollege hat eigenes Elixier');
  // beide Teamkollegen platzieren auf derselben Hälfte, in beiden Lanes
  give(m, 0, 'knight');
  give(m, 1, 'knight');
  assert.equal(m.play(0, 0, 'knight', 4, 22).ok, true);
  assert.equal(m.play(1, 0, 'knight', 14, 22).ok, true);
  give(m, 2, 'knight');
  assert.equal(m.play(2, 0, 'knight', 4, 22).ok, false, 'Gegner nicht auf der fremden Hälfte');
  assert.equal(m.play(2, 0, 'knight', 4, 10).ok, true);
  // Snapshot enthält den Spieler je Entität, Teamkollegen-Info nur fürs eigene Team
  const snap = m.snapshot(0);
  const knights = snap.e.filter((e) => e[1] === m.db.typeIndex.get('knight'));
  assert.deepEqual(knights.map((e) => [e[2], e[12]]).sort(), [[0, 0], [0, 1], [1, 2]]);
  assert.deepEqual(snap.me.tm.map((t) => t[0]), [1]);
  assert.equal(snap.me.tm[0][2], 'knight');
});

test('Gemeinsamer Burgturm erwacht für das ganze Team, wenn ein Wachturm fällt', () => {
  const m = teamMatch();
  const king = tower(m, 0, 'king');
  assert.equal(king.active, false);
  const p = tower(m, 0, 'princess', 0);
  m.damage(p, 1e6, null, 1);
  m.step();
  assert.equal(king.active, true);
  assert.equal(m.crowns[1], 1, 'Krone für das gegnerische Team');
});

test('Kronen pro Team, Burgturm-Zerstörung beendet das Spiel für das ganze Team', () => {
  const m = teamMatch();
  m.damage(tower(m, 1, 'king'), 1e6, null, 0);
  m.step();
  assert.equal(m.result.winner, 0);
  assert.deepEqual(m.result.crowns, [3, 0]);
  assert.equal(m.result.stats.length, 4, 'Statistik pro Spieler');
});

test('Kein Eigenbeschuss: Feuerball trifft Gegner, nicht den Teamkollegen', () => {
  const m = teamMatch();
  const ally = spawn(m, 'knight', 0, 9, 14, { pl: 1 });
  const foe = spawn(m, 'knight', 1, 9.5, 14, { pl: 2 });
  ally.stunT = foe.stunT = 10; // nur der Zauber soll treffen
  const hpA = ally.hp;
  const hpF = foe.hp;
  give(m, 0, 'fireball');
  assert.equal(m.play(0, 0, 'fireball', 9.2, 14).ok, true);
  runSeconds(m, 3);
  assert.equal(ally.hp, hpA, 'Teamkollege unverletzt');
  assert.ok(foe.hp < hpF, 'Gegner getroffen');
});

test('Kein Eigenbeschuss im Nahkampf: Einheiten greifen Verbündete nicht an', () => {
  const m = teamMatch();
  const a = spawn(m, 'knight', 0, 9, 20, { pl: 0 });
  const b = spawn(m, 'knight', 0, 9, 20.6, { pl: 1 });
  runSeconds(m, 3);
  assert.equal(a.hp, a.maxHp);
  assert.equal(b.hp, b.maxHp);
});

test('Wut wirkt auch auf Einheiten des Teamkollegen', () => {
  const m = teamMatch();
  const mate = spawn(m, 'knight', 0, 9, 22, { pl: 1 });
  const foe = spawn(m, 'knight', 1, 9.8, 22, { pl: 3 });
  give(m, 0, 'rage');
  assert.equal(m.play(0, 0, 'rage', 9, 22).ok, true);
  runSeconds(m, 1);
  assert.ok(mate.rageT > 0, 'Teamkollege bekommt Wut');
  assert.ok(!(foe.rageT > 0), 'Gegner nicht');
});

test('Heilung wirkt auch auf Einheiten des Teamkollegen', () => {
  const m = teamMatch();
  const mate = spawn(m, 'knight', 0, 9, 21, { pl: 1 });
  const foe = spawn(m, 'knight', 1, 9, 19.5, { pl: 2 });
  mate.stunT = foe.stunT = 10;
  mate.hp = mate.maxHp * 0.3;
  const before = mate.hp;
  give(m, 0, 'heal-spirit');
  assert.equal(m.play(0, 0, 'heal-spirit', 9, 23).ok, true);
  runSeconds(m, 3);
  assert.ok(mate.hp > before, `geheilt: ${before} → ${mate.hp}`);
});

test('Folge-Einheiten gehören dem erzeugenden Spieler (Spawner, Todes-Spawns)', () => {
  const m = teamMatch();
  give(m, 1, 'tombstone');
  assert.equal(m.play(1, 0, 'tombstone', 14, 22).ok, true);
  runSeconds(m, 6);
  const skels = m.entities.filter((e) => e.def.key !== 'tombstone' && e.kind === 'unit' && e.owner === 0);
  assert.ok(skels.length > 0, 'Grabstein erzeugt Skelette');
  assert.ok(skels.every((e) => e.pl === 1), 'Skelette gehören Spieler 1');
  const g = spawn(m, 'golem', 1, 9, 10, { pl: 3 });
  m.damage(g, 1e6, null, 0);
  m.step();
  const golemites = m.entities.filter((e) => !e.dead && e.owner === 1 && e.def.key !== 'golem' && e.kind === 'unit');
  assert.ok(golemites.length >= 2);
  assert.ok(golemites.every((e) => e.pl === 3), 'Golemiten gehören Spieler 3');
});

test('Elixier-Effekte pro Spieler: Sammler füllt nur den Besitzer, Elixiergolem gibt beiden Gegnern Elixier', () => {
  const m = teamMatch();
  give(m, 1, 'elixir-collector');
  assert.equal(m.play(1, 0, 'elixir-collector', 9, 24).ok, true);
  for (const p of m.players) p.elixir = 0;
  m.rules.elixir.regenSeconds = 1e9;
  runSeconds(m, 15);
  assert.ok(m.players[1].elixir >= 1, 'Sammler-Besitzer bekommt Elixier');
  assert.ok(m.players[0].elixir < 0.1, 'Teamkollege nicht');
  for (const p of m.players) p.elixir = 0;
  const g = spawn(m, 'elixir-golem', 0, 9, 22, { pl: 0 });
  m.damage(g, 1e6, null, 1);
  m.step();
  assert.ok(m.players[2].elixir > 0 && m.players[3].elixir > 0, 'beide Gegner bekommen Elixier');
  assert.ok(m.players[0].elixir < 0.1 && m.players[1].elixir < 0.1);
});

test('Champion und Fähigkeit pro Spieler: Teamkollegen dürfen denselben Champion spielen', () => {
  const m = teamMatch();
  give(m, 0, 'golden-knight');
  give(m, 1, 'golden-knight');
  assert.equal(m.play(0, 0, 'golden-knight', 4, 22).ok, true);
  assert.equal(m.play(1, 0, 'golden-knight', 14, 22).ok, true);
  assert.equal(m.players[0].championOut, 'golden-knight');
  assert.equal(m.players[1].championOut, 'golden-knight');
  runSeconds(m, 2);
  const e0 = m.abilityEntity(0);
  const e1 = m.abilityEntity(1);
  assert.ok(e0 && e1 && e0 !== e1);
  assert.equal(e0.pl, 0);
  assert.equal(e1.pl, 1);
  m.damage(e0, 1e6, null, 1);
  m.step();
  assert.equal(m.players[0].championOut, null, 'Champion von Spieler 0 kehrt zurück');
  assert.equal(m.players[1].championOut, 'golden-knight', 'der des Kollegen bleibt draußen');
});

test('Aufgabe gilt fürs Team, Gewinner ist das andere Team', () => {
  const m = teamMatch();
  m.forfeit(1, 'disconnect');
  assert.equal(m.result.winner, 0);
  assert.deepEqual(m.result.crowns, [3, 0]);
});

test('2 gegen 2 mit vier Bots läuft fehlerfrei bis zum Ende', () => {
  for (let g = 0; g < 4; g++) {
    const rng = mulberry32(400 + g);
    const m = teamMatch([0, 1, 2, 3].map(() => randomDeck(db, rng)), g);
    const bots = [0, 1, 2, 3].map((i) => new Bot(m, i, g * 4 + i));
    while (!m.result && m.tick < 20 * 320) {
      for (const b of bots) b.update();
      m.step();
      const snap = m.snapshot(2);
      assert.ok(snap.e.every((e) => e.length === 13 && e[12] >= 0 && e[12] < 4 && m.teamOf[e[12]] === e[2]), 'Spieler passt zum Team');
      m.flushEvents();
    }
    assert.ok(m.result);
    assert.ok(m.result.stats.every((s) => s.played > 0), 'alle vier Spieler haben gespielt');
  }
});
