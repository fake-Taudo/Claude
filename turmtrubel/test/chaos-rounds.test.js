// Modus „Chaos“, Match-Rahmen und Auswahlrunden: Daten, Regeln (Turm-/Elixier-Faktor, Level, keine Evos),
// Seltenheits-Staffelung, Angebote, synchrone Pause, Auto-Wahl, Überspringen, Reconnect in der Pause,
// Pool-Prüfung und Missbrauchsversuche.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RoomManager } from '../server/rooms.js';
import { loadChaos, PerkRounds } from '../server/chaos.js';
import { createModes, resolveRules, isClassic } from '../shared/modes.js';
import { validateChaos, validatePerks, makeOffer, rollTier, otherTier, PERK_TIERS, roundSchedule } from '../shared/chaos.js';
import { Match } from '../server/sim/match.js';
import { STARTER_DECKS } from '../shared/decks.js';
import { db, rules, DECK } from './helpers.js';

const chaos = loadChaos(db);
const modes = createModes(JSON.parse(fs.readFileSync(new URL('../data/modes.json', import.meta.url), 'utf8')));
const MODE = modes.get('chaos');
const cfg = chaos.config;
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

class FakeClock {
  constructor() {
    this.now = 5_000_000;
    this.q = [];
    this.setTimeout = (fn, ms) => {
      const h = { t: this.now + ms, fn };
      this.q.push(h);
      return h;
    };
    this.clearTimeout = (h) => {
      this.q = this.q.filter((x) => x !== h);
    };
  }
  advance(ms) {
    const end = this.now + ms;
    for (;;) {
      this.q.sort((a, b) => a.t - b.t);
      const n = this.q[0];
      if (!n || n.t > end) break;
      this.q.shift();
      this.now = n.t;
      n.fn();
    }
    this.now = end;
  }
}

function setup() {
  const clock = new FakeClock();
  let r = 0.21;
  const mgr = new RoomManager({ db, rules: rules(), chaos, now: () => clock.now, timers: clock, random: () => (r = (r * 9301 + 0.4927) % 1) });
  const client = (name) => {
    const inbox = [];
    const send = (msg, raw) => inbox.push(raw ? JSON.parse(msg) : msg);
    const s = mgr.createSession(name, send);
    return { s, inbox, send, last: (type) => inbox.filter((m) => m.type === type).at(-1), all: (type) => inbox.filter((m) => m.type === type) };
  };
  return { clock, mgr, client };
}

/** Zwei Menschen im Chaos-Raum bis „playing“. */
function chaosRoom(deckA = DECK, deckB = DECK) {
  const env = setup();
  const a = env.client('Anna');
  const b = env.client('Ben');
  assert.ok(env.mgr.createRoom(a.s, deckA, 'chaos').ok);
  assert.ok(env.mgr.joinRoom(b.s, a.last('lobby').code, deckB).ok);
  const room = a.s.room;
  room.setReady(a.s, true);
  room.setReady(b.s, true);
  env.clock.advance(3100);
  room.onLoaded(a.s);
  room.onLoaded(b.s);
  assert.equal(room.state, 'playing');
  return { ...env, a, b, room };
}

/** Raum-Ticks wie die Server-Schleife: je Tick 50 ms Wanduhr. */
function run(env, seconds, stop = () => false) {
  const n = Math.round(seconds * 20);
  for (let i = 0; i < n; i++) {
    if (env.room.state !== 'playing' || stop()) return i;
    env.room.tick();
    env.clock.advance(50);
  }
  return n;
}

test('Chaos-Daten: 40 Karten im Pool, je drei Perk-Stufen mit allen Pflichtfeldern, keine Kostenänderung', () => {
  const raw = JSON.parse(fs.readFileSync(new URL('../data/chaos.json', import.meta.url), 'utf8'));
  const perks = JSON.parse(fs.readFileSync(new URL('../data/chaos_perks.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateChaos(raw, db), []);
  assert.deepEqual(validatePerks(perks, raw, db), []);
  assert.equal(chaos.pool.length, 40);
  assert.equal(chaos.perks.size, 120);
  for (const id of chaos.pool) {
    assert.ok(db.card(id), id);
    for (const t of PERK_TIERS) {
      const p = chaos.perkFor(id, t);
      assert.ok(p, `${id}.${t}`);
      for (const k of ['cardId', 'rarityTier', 'name', 'description', 'mechanicType', 'effectParameters', 'balanceNote']) assert.ok(p[k], `${p.id}: ${k}`);
      assert.equal(p.elixirCostUnchanged, true);
      assert.ok(!/"elixir"/.test(JSON.stringify(p.effectParameters)), `${p.id} ändert keine Kosten`);
    }
  }
  // Prüfungen greifen
  const bad = structuredClone(perks);
  bad.perks[0].elixirCostUnchanged = false;
  bad.perks[1].effectParameters = { set: { elixir: 1 } };
  bad.perks.pop();
  const errs = validatePerks(bad, raw, db);
  assert.ok(errs.some((e) => e.includes('elixirCostUnchanged')));
  assert.ok(errs.some((e) => e.includes('Elixierkosten')));
  assert.ok(errs.some((e) => e.includes('fehlt')));
  assert.ok(validateChaos({ ...raw, cardPool: raw.cardPool.slice(0, 10) }, db).length);
  assert.ok(validateChaos({ ...raw, rarityByRound: raw.rarityByRound.map((w) => ({ ...w, epic: w.epic + 1 })) }, db).length);
});

test('Chaos-Regeln: Türme ×2, Elixier ×1,5 zusätzlich zu Doppel/Dreifach, festes Level, keine Evos; Klassisch unverändert', () => {
  assert.equal(isClassic(MODE), false);
  assert.throws(() => resolveRules(rules(), MODE), /Chaos-Einstellungen/);
  const base = rules();
  const R = resolveRules(base, MODE, { chaos });
  assert.equal(R.towers.princess.hp, base.towers.princess.hp * cfg.towerHpMultiplier);
  assert.equal(R.towers.king.hp, base.towers.king.hp * cfg.towerHpMultiplier);
  assert.equal(R.elixir.rate, cfg.elixirRateMultiplier);
  assert.notEqual(R.elixir.phases, false);
  assert.equal(R.cardLevel, cfg.fixedLevel);
  assert.equal(R.evo.enabled, false);
  assert.ok(R.chaos);
  assert.equal(base.towers.king.hp, 4800, 'Grundregeln bleiben unverändert');
  // Klassisch: dasselbe Objekt
  const C = rules();
  assert.equal(resolveRules(C, modes.get('classic'), { chaos }), C);

  const m = new Match({ db, rules: R, decks: [DECK, DECK], seed: 3 });
  m.started = true;
  for (const t of m.towers) assert.equal(t.maxHp, (t.towerKey === 'king' ? 4800 : 3000) * 2);
  close(m.elixirMultiplier(), 1.5);
  m.players[0].elixir = 0;
  for (let i = 0; i < 20 * 10; i++) m.step();
  close(m.players[0].elixir, Math.min(10, (10 * 1.5) / R.elixir.regenSeconds), 1e-6);
  while (m.time < 125) m.step();
  close(m.elixirMultiplier(), 3, 1e-9);
  m.phase = 'overtime';
  close(m.elixirMultiplier(), 4.5, 1e-9);
  assert.equal(m.players[0].evoCards.size, 0, 'keine Evolutionen');
});

test('Seltenheits-Staffelung: über viele Runden entsprechen die Anteile chaos.json', () => {
  let s = 12345;
  const rng = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  cfg.rarityByRound.forEach((w, round) => {
    const n = 20000;
    const count = { common: 0, rare: 0, epic: 0 };
    for (let i = 0; i < n; i++) count[rollTier(w, rng)]++;
    for (const t of PERK_TIERS) {
      const share = (count[t] / n) * 100;
      assert.ok(Math.abs(share - w[t]) < 1.5, `Runde ${round + 1} ${t}: ${share.toFixed(1)} % statt ${w[t]} %`);
      if (w[t] === 0) assert.equal(count[t], 0, `Runde ${round + 1}: ${t} nie`);
    }
    // ganze Angebote: jede Option unabhängig gewürfelt
    const offers = { common: 0, rare: 0, epic: 0 };
    for (let i = 0; i < 4000; i++) for (const id of makeOffer(chaos, DECK, {}, round, rng)) offers[chaos.perk(id).rarityTier]++;
    for (const t of PERK_TIERS) assert.ok(Math.abs((offers[t] / 8000) * 100 - w[t]) < 2.5, `Angebot Runde ${round + 1} ${t}`);
  });
});

test('Angebote: zwei verschiedene perk-freie Karten; eine freie Karte → zwei Stufen; keine → Runde entfällt', () => {
  let s = 99;
  const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 300; i++) {
    const taken = { knight: chaos.perkFor('knight', 'common'), zap: chaos.perkFor('zap', 'rare') };
    const o = makeOffer(chaos, DECK, taken, i % 5, rng);
    assert.equal(o.length, 2);
    const cards = o.map((id) => chaos.perk(id).cardId);
    assert.notEqual(cards[0], cards[1], 'zwei verschiedene Karten');
    for (const c of cards) assert.ok(DECK.includes(c) && !taken[c], c);
  }
  const allButGiant = Object.fromEntries(DECK.filter((id) => id !== 'giant').map((id) => [id, true]));
  for (let round = 0; round < 5; round++) {
    const o = makeOffer(chaos, DECK, allButGiant, round, rng);
    assert.deepEqual(o.map((id) => chaos.perk(id).cardId), ['giant', 'giant']);
    assert.notEqual(o[0], o[1], 'zwei verschiedene Stufen');
  }
  assert.equal(otherTier('epic', { common: 0, rare: 0, epic: 100 }, rng), 'rare', 'nur Episch → nächstliegende Stufe');
  assert.equal(otherTier('common', { common: 90, rare: 10, epic: 0 }, rng), 'rare');
  const all = Object.fromEntries(DECK.map((id) => [id, true]));
  assert.equal(makeOffer(chaos, DECK, all, 2, rng), null);
});

test('Rundenplan: 0:36, 1:12, 1:48, 2:24; die fünfte Runde nur in der Verlängerung', () => {
  assert.deepEqual(roundSchedule(cfg), [36, 72, 108, 144, 180]);
  const R = resolveRules(rules(), MODE, { chaos });
  const m = new Match({ db, rules: R, decks: [DECK, DECK], seed: 9 });
  m.started = true;
  const pr = new PerkRounds(chaos, m, { seed: 4 });
  const startedAt = [];
  while (!m.result && m.time < 200) {
    m.step();
    const r = pr.due();
    if (r >= 0) {
      startedAt.push([r, m.time, m.phase]);
      pr.start(r);
      pr.finish();
    }
  }
  assert.deepEqual(
    startedAt.slice(0, 4).map((x) => Math.round(x[1] * 100) / 100),
    [36, 72, 108, 144],
  );
  if (m.result && m.result.time <= 180) assert.equal(startedAt.length, 4, 'ohne Verlängerung keine fünfte Runde');
  // erzwungene Verlängerung: fünfte Runde bei 3:00
  const m2 = new Match({ db, rules: R, decks: [DECK, DECK], seed: 9 });
  m2.started = true;
  const pr2 = new PerkRounds(chaos, m2, { seed: 4 });
  pr2.next = 4;
  for (const t of m2.towers) t.hp = t.maxHp = 1e9; // niemand verliert einen Turm → Gleichstand → Verlängerung
  while (m2.time < 179.9) m2.step();
  assert.equal(pr2.due(), -1);
  while (pr2.due() < 0 && m2.time < 181) m2.step();
  assert.equal(m2.phase, 'overtime');
  close(m2.time, 180, 1e-6);
  assert.equal(pr2.due(), 4);
});

test('Auswahlrunde: Pause für beide synchron – Spielzeit, Elixier und Handkarten stehen still, Eingaben werden abgewiesen', () => {
  const env = chaosRoom();
  const { a, b, room, clock } = env;
  const m = room.match;
  run(env, 40, () => !!room.perkRounds.current);
  assert.ok(room.perkRounds.current, 'Runde 1 hat begonnen');
  close(m.time, 36);
  assert.equal(m.paused, true);
  const ra = a.last('perkRound');
  const rb = b.last('perkRound');
  assert.equal(ra.round, 1);
  assert.equal(ra.rounds, 5);
  assert.equal(ra.options.length, 2);
  assert.equal(rb.options.length, 2);
  assert.ok(ra.timeLeft > 5.9 && ra.timeLeft <= 6);
  // jeder sieht nur seine eigenen Optionen
  assert.deepEqual(ra.options.map((o) => o.id), room.perkRounds.current.offers[0]);
  assert.deepEqual(rb.options.map((o) => o.id), room.perkRounds.current.offers[1]);
  const before = { time: m.time, tick: m.tick, el: m.players.map((p) => p.elixir), ready: m.players.map((p) => p.handReady.slice()) };
  const snapsBefore = a.all('s').length;
  run(env, 3);
  assert.equal(m.tick, before.tick, 'keine Simulationsschritte');
  assert.equal(m.time, before.time);
  assert.deepEqual(m.players.map((p) => p.elixir), before.el);
  assert.deepEqual(m.players.map((p) => p.handReady), before.ready);
  const pauseSnaps = a.all('s').slice(snapsBefore);
  assert.ok(pauseSnaps.length >= 5 && pauseSnaps.length <= 7, `≈2 Snapshots/s in der Pause (${pauseSnaps.length})`);
  assert.ok(pauseSnaps.every((s) => s.pz && s.pz[0] === 1 && s.k === before.tick));
  assert.ok(pauseSnaps.at(-1).pz[1] < 3.1, `Restzeit läuft (${pauseSnaps.at(-1).pz[1]})`);
  // Eingaben in der Pause
  const p0 = m.players[0];
  p0.elixir = 10;
  p0.handReady = p0.handReady.map(() => 0);
  assert.equal(m.play(0, 0, p0.hand[0], 9, 25).code, 'PAUSED');
  assert.equal(m.useAbility(0).code, 'PAUSED');
  // Wahl
  assert.equal(room.perkPick(a.s, 'pekka.epic').code, 'PERK_NOT_OFFERED');
  assert.equal(room.perkPick(a.s, { id: ra.options[0].id }).code, 'PERK_NOT_OFFERED');
  assert.ok(room.perkPick(a.s, ra.options[1].id).ok);
  assert.equal(room.perkPick(a.s, ra.options[0].id).code, 'ALREADY_PICKED');
  assert.ok(room.perkRounds.current, 'wartet auf Ben');
  assert.deepEqual(b.last('perkRound').done, [true, false], 'Ben sieht, dass Anna gewählt hat');
  assert.ok(room.perkPick(b.s, rb.options[0].id).ok);
  assert.equal(room.perkRounds.current, null);
  assert.equal(m.paused, false);
  const res = a.last('perkResult');
  assert.equal(res.round, 1);
  assert.deepEqual(res.picks.map((p) => p.id), [ra.options[1].id, rb.options[0].id]);
  assert.deepEqual(res.auto, [false, false]);
  assert.equal(m.perkOf(0, ra.options[1].card).id, ra.options[1].id);
  assert.equal(m.perkOf(1, rb.options[0].card).id, rb.options[0].id);
  assert.ok(res.pauseTotal >= 3 && res.pauseTotal < 3.2, `Pausenzeit ${res.pauseTotal}`);
  // weiter geht's: Spielzeit läuft wieder, Pausenzeit separat im Snapshot
  run(env, 1);
  assert.ok(m.time > 36.9);
  const snap = a.last('s');
  assert.ok(!snap.pz);
  assert.equal(snap.pt, res.pauseTotal);
  void clock;
});

test('Auswahlrunde: Zeit abgelaufen → der Server wählt zufällig eine der zwei Optionen', () => {
  const env = chaosRoom();
  const { a, room } = env;
  run(env, 40, () => !!room.perkRounds.current);
  const offers = room.perkRounds.current.offers.map((o) => o.slice());
  run(env, cfg.pickTimeSeconds + 0.2);
  assert.equal(room.perkRounds.current, null);
  const res = a.last('perkResult');
  assert.deepEqual(res.auto, [true, true]);
  res.picks.forEach((p, i) => assert.ok(offers[i].includes(p.id)));
  close(room.match.time, 36 + 0.2 + 0.05, 0.11);
});

test('Auswahlrunde überspringen: ohne perk-freie Karte wartet der Gegner nicht auf dich', () => {
  const env = chaosRoom();
  const { a, b, room } = env;
  const m = room.match;
  // Anna hat schon auf allen Karten einen Perk
  for (const id of m.players[0].deck) m.perks[0][id] = chaos.perkFor(id, 'common');
  run(env, 40, () => !!room.perkRounds.current);
  assert.ok(room.perkRounds.current);
  assert.equal(room.perkRounds.current.offers[0], null);
  assert.equal(a.last('perkRound').skipped, true);
  assert.equal(a.last('perkRound').options.length, 0);
  assert.equal(b.last('perkRound').options.length, 2);
  assert.ok(room.perkPick(b.s, b.last('perkRound').options[0].id).ok);
  assert.equal(room.perkRounds.current, null, 'Ben allein genügt');
  assert.equal(room.perkPick(a.s, 'knight.rare').code, 'NO_ROUND');
  // beide ohne freie Karte: Runde entfällt ganz, keine Pause
  for (const id of m.players[1].deck) m.perks[1][id] = m.perks[1][id] || chaos.perkFor(id, 'common');
  const t0 = m.time;
  run(env, 37);
  assert.ok(m.time >= t0 + 36.9, 'keine Pause');
  const skipped = a.all('perkResult').find((r) => r.round === 2);
  assert.equal(skipped.skipped, true);
});

test('Reconnect mitten in einer Auswahlpause: gleiche Optionen, exakte Restzeit, danach normal weiter', () => {
  const env = chaosRoom();
  const { a, b, room, mgr, clock } = env;
  run(env, 40, () => !!room.perkRounds.current);
  const mine = a.last('perkRound').options.map((o) => o.id);
  mgr.disconnect(a.s);
  run(env, 2);
  const inbox = [];
  assert.ok(mgr.resume(a.s.token, (msg, raw) => inbox.push(raw ? JSON.parse(msg) : msg)));
  const init = inbox.find((m) => m.type === 'matchInit');
  assert.ok(init.resume && init.chaos, 'matchInit mit Chaos-Teil');
  assert.equal(init.chaos.towerHpMultiplier, 2);
  assert.deepEqual(init.chaos.schedule, [36, 72, 108, 144, 180]);
  const round = inbox.find((m) => m.type === 'perkRound');
  assert.ok(round, 'Auswahlrunde nach Reconnect');
  assert.deepEqual(round.options.map((o) => o.id), mine);
  const exact = (room.perkDeadlineAt - clock.now) / 1000;
  assert.ok(Math.abs(round.timeLeft - exact) <= 0.05 && round.timeLeft < 4.1 && round.timeLeft > 3.8, `Restzeit ${round.timeLeft}`);
  assert.ok(room.perkPick(a.s, mine[0]).ok);
  assert.ok(room.perkPick(b.s, b.last('perkRound').options[1].id).ok);
  assert.equal(room.match.paused, false);
  const after = inbox.find((m) => m.type === 'perkResult');
  assert.equal(after.picks[0].id, mine[0]);
  run(env, 1);
  assert.ok(inbox.filter((m) => m.type === 's').length > 10);
});

test('Training gegen Bot: Bot-Deck nur aus dem Pool, Bot wählt nach 1–4 s, Pool-Prüfung für Decks', () => {
  for (const diff of ['easy', 'medium', 'hard']) {
    const env = setup();
    const a = env.client('Anna');
    assert.ok(env.mgr.createTraining(a.s, DECK, 'chaos', diff).ok);
    const room = a.s.room;
    env.clock.advance(3100);
    room.onLoaded(a.s);
    assert.equal(room.state, 'playing');
    for (const id of room.decks[1]) assert.ok(chaos.inPool(id), `Bot-Karte ${id} im Pool`);
    run({ ...env, room }, 40, () => !!room.perkRounds.current);
    const t0 = env.clock.now;
    const opts = a.last('perkRound').options;
    assert.ok(room.perkPick(a.s, opts[0].id).ok);
    let guard = 0;
    while (room.perkRounds.current && guard++ < 200) {
      room.tick();
      env.clock.advance(50);
    }
    const waited = (env.clock.now - t0) / 1000;
    assert.ok(waited >= 1 && waited <= 4.05, `${diff}: Bot-Bedenkzeit ${waited}`);
    const res = a.last('perkResult');
    assert.equal(res.auto[1], false, `${diff}: Bot wählt selbst`);
  }
  // Decks außerhalb des Pools
  const { mgr, client } = setup();
  const a = client('Anna');
  const outside = STARTER_DECKS.map((d) => d.slots).find((d) => d.some((id) => !chaos.inPool(id)));
  const r = mgr.createRoom(a.s, outside, 'chaos');
  assert.equal(r.code, 'NOT_IN_POOL');
  assert.match(r.message, /Nicht erlaubt/);
  assert.equal(mgr.createTraining(a.s, outside, 'chaos').code, 'NOT_IN_POOL');
  assert.ok(mgr.createRoom(a.s, DECK, 'chaos').ok);
  assert.equal(a.s.room.setDeck(a.s, outside).code, 'NOT_IN_POOL');
  const b = client('Ben');
  assert.equal(mgr.joinRoom(b.s, a.last('lobby').code, outside).code, 'NOT_IN_POOL');
  // klassisch bleibt jedes gültige Deck erlaubt
  const c = client('Cleo');
  assert.ok(mgr.createRoom(c.s, outside, 'classic').ok);
});

test('Manipulierter Client: Pause umgehen, fremde Perks, Karten außerhalb des Pools – alles abgewiesen', () => {
  const env = chaosRoom();
  const { a, b, room } = env;
  const m = room.match;
  // Karte außerhalb des Pools in die Hand schmuggeln: der Server kennt nur das Deck
  m.players[0].elixir = 10;
  assert.equal(m.play(0, 0, 'mega-minion-x', 9, 25).code, 'NOT_IN_HAND');
  assert.equal(m.play(0, 0, 'hog-rider', 9, 25).code, 'NOT_IN_HAND', 'nicht im eigenen Deck');
  run(env, 40, () => !!room.perkRounds.current);
  const theirs = b.last('perkRound').options[0].id;
  const mine = a.last('perkRound').options.map((o) => o.id);
  if (!mine.includes(theirs)) assert.equal(room.perkPick(a.s, theirs).code, 'PERK_NOT_OFFERED', 'Option des Gegners');
  for (const bad of [null, 42, '', 'knight', '__proto__', 'giant.legendary', { perk: mine[0] }]) assert.equal(room.perkPick(a.s, bad).code, 'PERK_NOT_OFFERED');
  // Pause umgehen
  const p0 = m.players[0];
  p0.handReady = p0.handReady.map(() => 0);
  assert.equal(m.play(0, 0, p0.hand[0], 9, 25).code, 'PAUSED');
  assert.ok(room.perkPick(a.s, mine[0]).ok);
  assert.equal(room.perkPick(a.s, mine[1]).code, 'ALREADY_PICKED');
  // Wahl außerhalb einer Runde
  room.perkPick(b.s, b.last('perkRound').options[0].id);
  assert.equal(room.perkPick(a.s, mine[1]).code, 'NO_ROUND');
});

test('Aufgabe mitten in der Auswahlpause: Kampf endet sauber, Ergebnis nennt die gewählten Perks', () => {
  const env = chaosRoom();
  const { a, b, room } = env;
  run(env, 40, () => !!room.perkRounds.current);
  room.perkPick(a.s, a.last('perkRound').options[0].id);
  room.perkPick(b.s, b.last('perkRound').options[0].id);
  run(env, 37, () => !!room.perkRounds.current);
  assert.equal(room.perkRounds.current.index, 1);
  room.surrender(b.s);
  assert.equal(room.state, 'ended');
  assert.equal(room.match.paused, false);
  const end = a.last('matchEnd');
  assert.equal(end.winner, 0);
  assert.equal(end.perks[0].length, 1);
  assert.equal(end.perks[1].length, 1);
  assert.ok(end.perks[0][0].name && end.perks[0][0].tier);
  assert.ok(end.pauseTotal > 0);
});

test('Perks verändern nie die gemeinsamen Kartenwerte und nie die Elixierkosten', () => {
  const before = JSON.stringify(db.cards);
  const unitBefore = JSON.stringify(db.unit('giant'));
  const env = chaosRoom();
  const { a, b, room } = env;
  for (let r = 0; r < 4; r++) {
    run(env, 40, () => !!room.perkRounds.current);
    if (!room.perkRounds.current) break;
    room.perkPick(a.s, a.last('perkRound').options[0].id);
    room.perkPick(b.s, b.last('perkRound').options[1].id);
  }
  assert.equal(JSON.stringify(db.cards), before);
  assert.equal(JSON.stringify(db.unit('giant')), unitBefore);
  const m = room.match;
  for (const id of m.players[0].deck) assert.equal(m.costOf(0, db.card(id)), db.card(id).elixir);
});
