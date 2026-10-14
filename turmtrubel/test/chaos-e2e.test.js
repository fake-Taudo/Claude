// Modus „Chaos“ Ende-zu-Ende über echte WebSockets:
//  – zwei Test-Clients spielen ein komplettes Chaos-Match inklusive Verlängerung und fünfter (epischer) Runde,
//    ein Client trennt sich mitten in einer Auswahlpause und kommt mit seinem Token zurück
//    (gleiche Optionen, Restzeit) – ohne Desync (gleicher Zustand je Tick bei beiden) und ohne Serverfehler
//  – manipulierte Clients: fremde/falsche Perks, Karten außerhalb des Pools, Eingaben während der Pause
// Die Türme bekommen für den Test sehr viele Lebenspunkte, damit der Kampf sicher in die Verlängerung geht.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { startServer } from '../server/index.js';
import { TestClient, loadDb } from '../tools/e2e/client.mjs';
import { STARTER_DECKS } from '../shared/decks.js';

const SCALE = 20;
const rules = JSON.parse(fs.readFileSync(new URL('../data/rules.json', import.meta.url), 'utf8'));
const chaosCfg = JSON.parse(fs.readFileSync(new URL('../data/chaos.json', import.meta.url), 'utf8'));
const POOL = new Set(chaosCfg.cardPool);
const DECK_A = ['knight', 'archers', 'golden-knight', 'giant', 'electro-wizard', 'minions', 'fireball', 'zap'];
const DECK_B = ['hog-rider', 'valkyrie', 'bowler-hero', 'ice-spirit', 'tesla', 'musketeer', 'the-log', 'poison'];
let srv;
let url;
const db = loadDb();

before(async () => {
  const towers = structuredClone(rules.towers);
  towers.king.hp = 4_000_000;
  towers.princess.hp = 4_000_000;
  srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, timeScale: SCALE, rulesOverride: { towers, lobby: { reconnectSeconds: 20 } } });
  url = `ws://127.0.0.1:${srv.port}/ws`;
});
after(async () => {
  await srv.close();
});

/** Test-Client, der Perks wählt (zufällig, kurz verzögert) und den gemeinsamen Snapshot-Teil je Tick protokolliert. */
class ChaosClient extends TestClient {
  constructor(o) {
    super(o);
    this.ticks = new Map(); // k → Prüfsumme des gemeinsamen Teils
    this.autoPerk = true;
    this.pauseTicks = [];
    this.snaps = 0;
  }
  onMessage(m) {
    super.onMessage(m);
    // je Runde genau eine Wahl (aktualisierte perkRound-Nachrichten nach der Wahl des Gegners nicht doppelt beantworten)
    if (m.type === 'perkRound' && this.autoPerk && !m.picked && m.options.length && this.pickedRound !== m.round) {
      this.pickedRound = m.round;
      const pick = m.options[Math.floor(this.rand() * m.options.length)].id;
      setTimeout(() => this.send({ type: 'perkPick', perk: pick }), 30 + Math.floor(this.rand() * 120));
    }
  }
  onSnapshot(s) {
    this.snaps++;
    const common = JSON.stringify([s.t, s.tl, s.ph, s.em, s.cr, s.e, s.p, s.z, s.pe]);
    const prev = this.ticks.get(s.k);
    if (prev && prev !== common) this.mismatch = (this.mismatch || 0) + 1;
    this.ticks.set(s.k, common);
    if (s.pz) this.pauseTicks.push([s.k, s.pz[0], s.pz[1]]);
    if (s.pz) return; // in der Pause nichts ausspielen
    super.onSnapshot(s);
  }
}

async function client(name, deck, seed) {
  const c = new ChaosClient({ url, name, deck, db, seed });
  await c.connect();
  c.send({ type: 'hello', name, protocol: 2 });
  c.welcome = await c.wait((m) => m.type === 'welcome');
  return c;
}

test('Chaos: zwei Clients spielen ein komplettes Match mit Verlängerung, fünfter Runde und Reconnect in der Pause', { timeout: 240000 }, async () => {
  const a = await client('Anna', DECK_A, 21);
  const b = await client('Ben', DECK_B, 22);
  let a2 = null;
  try {
    a.send({ type: 'create', deck: a.deck, mode: 'chaos' });
    const l = await a.wait((m) => m.type === 'lobby' && m.code);
    assert.equal(l.mode.id, 'chaos');
    assert.equal(l.mode.chaos, true);
    b.send({ type: 'join', code: l.code, deck: STARTER_DECKS[0].slots, chaosDeck: b.deck });
    await a.wait((m) => m.type === 'lobby' && m.players[1]);
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    const [ia, ib] = await Promise.all([a.wait((m) => m.type === 'matchInit'), b.wait((m) => m.type === 'matchInit')]);
    for (const init of [ia, ib]) {
      assert.equal(init.chaos.towerHpMultiplier, 2);
      assert.equal(init.chaos.elixirRateMultiplier, 1.5);
      assert.equal(init.rules.elixir.rate, 1.5);
      assert.deepEqual(init.chaos.schedule, [36, 72, 108, 144, 180]);
    }
    assert.deepEqual(ib.deck, DECK_B, 'Chaos-Deck des Beitretenden');

    // Runde 2: Anna trennt sich mitten in der Pause, Ben versucht in der Pause zu spielen
    a.autoPerk = false;
    const r2 = await a.wait((m) => m.type === 'perkRound' && m.round === 2, 60000);
    const mine = r2.options.map((o) => o.id);
    const token = a.welcome.token;
    a.close();
    const rb = await b.wait((m) => m.type === 'perkRound' && m.round === 2);
    b.send({ type: 'play', slot: 0, card: rb.options[0]?.card || b.deck[0], x: 9, y: 24, seq: 999 });
    const paused = await b.wait((m) => m.type === 'reject' && m.seq === 999);
    assert.equal(paused.code, 'PAUSED');
    await new Promise((r) => setTimeout(r, 1200));
    a2 = new ChaosClient({ url, name: 'Anna', deck: a.deck, db, seed: 23 });
    a2.autoPerk = false;
    await a2.connect();
    a2.send({ type: 'hello', name: 'Anna', token, protocol: 2 });
    const w = await a2.wait((m) => m.type === 'welcome');
    assert.equal(w.resumed, true);
    const back = await a2.wait((m) => m.type === 'perkRound');
    assert.equal(back.round, 2);
    assert.deepEqual(back.options.map((o) => o.id), mine, 'dieselben Optionen');
    assert.ok(back.timeLeft > 2 && back.timeLeft < 5.5, `Restzeit ${back.timeLeft}`);
    // manipuliert: Perk, der nicht angeboten wurde
    const foreign = [...chaosCfg.cardPool].find((id) => !mine.some((p) => p.startsWith(id + '.')));
    a2.send({ type: 'perkPick', perk: `${foreign}.epic` });
    const bad = await a2.wait((m) => m.type === 'error' && m.code === 'PERK_NOT_OFFERED');
    assert.ok(bad);
    a2.send({ type: 'perkPick', perk: mine[1] });
    const res2 = await a2.wait((m) => m.type === 'perkResult' && m.round === 2);
    assert.equal(res2.picks[0].id, mine[1]);
    assert.equal(res2.auto[0], false);
    a2.autoPerk = true;

    const [endA, endB] = await Promise.all([a2.wait((m) => m.type === 'matchEnd', 120000), b.wait((m) => m.type === 'matchEnd', 120000)]);
    // gleiches Ergebnis für beide, Verlängerung erreicht
    assert.equal(endA.winner, endB.winner);
    assert.equal(endA.reason, endB.reason);
    assert.ok(['tiebreak', 'draw', 'time'].includes(endA.reason), endA.reason);
    assert.ok(endA.time >= 299, `bis zum Ende der Verlängerung (${endA.time})`);
    // fünf Runden, die letzte nur episch, Staffelung je Runde
    const results = b.msgs.filter((m) => m.type === 'perkResult');
    assert.deepEqual(results.map((r) => r.round), [1, 2, 3, 4, 5]);
    for (const r of results) {
      const tiers = r.picks.map((p) => p.tier);
      if (r.round <= 2) assert.ok(!tiers.includes('epic'), `Runde ${r.round}: ${tiers}`);
      if (r.round >= 3) assert.ok(!tiers.includes('common'), `Runde ${r.round}: ${tiers}`);
      if (r.round === 5) assert.deepEqual(tiers, ['epic', 'epic']);
    }
    for (const end of [endA, endB]) {
      assert.equal(end.perks[0].length, 5);
      assert.equal(end.perks[1].length, 5);
      assert.ok(end.pauseTotal > 0);
      assert.equal(new Set(end.perks[0].map((p) => p.card)).size, 5, 'je Karte höchstens ein Perk');
    }
    // kein Desync: gleicher gemeinsamer Zustand je Tick bei beiden Clients, Spielzeit steht in der Pause
    let same = 0;
    for (const [k, h] of b.ticks) {
      const other = a2.ticks.get(k) ?? a.ticks.get(k);
      if (other == null) continue;
      assert.equal(other, h, `Tick ${k}`);
      same++;
    }
    assert.ok(same > 1000, `verglichene Ticks: ${same}`);
    assert.ok(!a.mismatch && !a2.mismatch && !b.mismatch, 'gleicher Tick, gleicher Inhalt');
    const pausedTicks = new Map();
    for (const [k, round] of b.pauseTicks) pausedTicks.set(round, (pausedTicks.get(round) || new Set()).add(k));
    for (const [round, ks] of pausedTicks) assert.equal(ks.size, 1, `Runde ${round}: Spielzeit steht still`);
    const errs = [...b.msgs, ...a2.msgs].filter((m) => m.type === 'error' && m.code !== 'PERK_NOT_OFFERED');
    assert.deepEqual(errs, [], 'keine Serverfehler');
  } finally {
    a.close();
    b.close();
    a2?.close();
  }
});

test('Chaos: manipulierte Clients – Decks außerhalb des Pools, Perk ohne Runde, Platzieren außerhalb des Decks', { timeout: 60000 }, async () => {
  const outside = STARTER_DECKS.map((d) => d.slots).find((d) => d.some((id) => !POOL.has(id)));
  const a = await client('Anna', DECK_A, 31);
  const b = await client('Ben', DECK_B, 32);
  try {
    a.send({ type: 'create', deck: outside, mode: 'chaos' });
    const e1 = await a.wait((m) => m.type === 'error' && m.code === 'NOT_IN_POOL');
    assert.match(e1.message, /Chaos-Kartenpool/);
    a.send({ type: 'training', deck: outside, mode: 'chaos' });
    await a.wait((m) => m.type === 'error' && m.code === 'NOT_IN_POOL' && m !== e1);
    a.send({ type: 'create', deck: DECK_A, mode: 'chaos' });
    const l = await a.wait((m) => m.type === 'lobby' && m.code);
    // Beitritt ohne passendes Chaos-Deck
    b.send({ type: 'join', code: l.code, deck: outside, chaosDeck: outside });
    await b.wait((m) => m.type === 'error' && m.code === 'NOT_IN_POOL');
    b.send({ type: 'join', code: l.code, deck: outside, chaosDeck: DECK_B });
    await b.wait((m) => m.type === 'lobby' && m.you === 1);
    // Deck in der Lobby auf Nicht-Pool-Karten wechseln
    b.send({ type: 'deck', deck: outside });
    await b.wait((m) => m.type === 'error' && m.code === 'NOT_IN_POOL');
    // Perk wählen, ohne dass eine Runde läuft
    a.send({ type: 'perkPick', perk: 'giant.epic' });
    await a.wait((m) => m.type === 'error' && m.code === 'NO_ROUND');
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    await a.wait((m) => m.type === 'matchStart');
    a.autoPerk = false;
    // Karte außerhalb des eigenen Decks (und des Pools) spielen
    a.send({ type: 'play', slot: 0, card: 'x-bow', x: 9, y: 24, seq: 501 });
    const r = await a.wait((m) => m.type === 'reject' && m.seq === 501);
    assert.equal(r.code, 'NOT_IN_HAND');
    a.send({ type: 'surrender' });
    const end = await b.wait((m) => m.type === 'matchEnd');
    assert.equal(end.reason, 'forfeit');
  } finally {
    a.close();
    b.close();
  }
});
