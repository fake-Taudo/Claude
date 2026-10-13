// Ende-zu-Ende über echte WebSockets mit Test-Clients:
//  – 4 Clients spielen 2 gegen 2 (Lobby, Teamwechsel, Kampf, Rematch mit allen vier, Abbruch mit Bot-Übernahme)
//  – 2 Clients spielen Triple Draft und Mega Draft inklusive Reconnect mitten im Draft
//  – 2 Clients spielen Unendlich-Elixier mit Massen-Platzierungen (Server bleibt stabil)
//  – Manipulierte Clients werden abgewiesen
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';
import { TestClient, loadDb } from '../tools/e2e/client.mjs';
import { STARTER_DECKS } from '../shared/decks.js';

const SCALE = 8;
let srv;
let url;
const db = loadDb();
const tickTimes = [];

before(async () => {
  srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true, timeScale: SCALE, rulesOverride: { lobby: { reconnectSeconds: 1.5 } } });
  url = `ws://127.0.0.1:${srv.port}/ws`;
  // Tick-Dauer des Servers messen (Lasttest)
  const tick = srv.mgr.tick.bind(srv.mgr);
  srv.mgr.tick = () => {
    const t0 = performance.now();
    tick();
    tickTimes.push(performance.now() - t0);
  };
});
after(async () => {
  await srv.close();
});

async function client(name, deck = STARTER_DECKS[0].slots, seed = 1) {
  const c = new TestClient({ url, name, deck, db, seed });
  await c.connect();
  c.send({ type: 'hello', name, protocol: 2 });
  c.welcome = await c.wait((m) => m.type === 'welcome');
  return c;
}

const lastLobby = (c) => c.msgs.filter((m) => m.type === 'lobby').at(-1);

test('2 gegen 2: Lobby mit Teamwechsel, kompletter Kampf, Rematch mit allen vier, Abbruch → Bot übernimmt', { timeout: 300000 }, async () => {
  const [a, b, c, d] = await Promise.all(['Anna', 'Ben', 'Cleo', 'Dan'].map((n, i) => client(n, STARTER_DECKS[i].slots, i + 1)));
  try {
    a.send({ type: 'create', deck: a.deck, mode: '2v2' });
    const l0 = await a.wait((m) => m.type === 'lobby' && m.code);
    assert.equal(l0.mode.id, '2v2');
    assert.equal(l0.players.length, 4);
    b.send({ type: 'join', code: l0.code, deck: b.deck });
    c.send({ type: 'join', code: l0.code, deck: c.deck });
    await c.wait((m) => m.type === 'lobby' && m.you >= 0);
    // Cleo sitzt auf Platz 1 (blau) und wechselt ins rote Team auf Platz 3
    assert.equal(lastLobby(c).you, 1);
    c.send({ type: 'seat', seat: 3 });
    await c.wait((m) => m.type === 'lobby' && m.you === 3);
    // Platz klauen: Ben will Annas Platz → abgewiesen
    b.send({ type: 'seat', seat: 0 });
    const stolen = await b.wait((m) => m.type === 'error' && m.code === 'SEAT_TAKEN');
    assert.ok(stolen);
    // Nicht-Gastgeber darf nicht verschieben/entfernen
    b.send({ type: 'move', from: 0, to: 1 });
    await b.wait((m) => m.type === 'error' && m.code === 'NOT_HOST');
    b.send({ type: 'kick', seat: 0 });
    d.send({ type: 'join', code: l0.code, deck: d.deck });
    await d.wait((m) => m.type === 'lobby' && m.you === 1);
    // Fünfter Spieler: Raum voll
    const e = await client('Eve');
    e.send({ type: 'join', code: l0.code, deck: e.deck });
    await e.wait((m) => m.type === 'error' && m.code === 'ROOM_FULL');
    e.close();
    const teams = lastLobby(a).teams;
    assert.deepEqual(teams, [0, 0, 1, 1]);
    for (const x of [a, b, c, d]) x.send({ type: 'ready', ready: true });
    const inits = await Promise.all([a, b, c, d].map((x) => x.wait((m) => m.type === 'matchInit')));
    assert.deepEqual(inits.map((m) => [m.me, m.side]), [[0, 0], [2, 1], [3, 1], [1, 0]]);
    const ends = await Promise.all([a, b, c, d].map((x) => x.wait((m) => m.type === 'matchEnd', 120000)));
    for (const m of ends) {
      assert.equal(m.names.length, 4);
      assert.equal(m.stats.length, 4);
      assert.equal(m.winner, ends[0].winner, 'alle sehen dasselbe Ergebnis');
      assert.equal(m.rematchAvailable, true);
    }
    assert.ok([a, b, c, d].every((x) => x.played.size > 0), 'alle vier haben Karten gespielt');
    // Rematch: drei reichen nicht, alle vier starten neu – Teams bleiben gleich
    for (const x of [a, b, c]) x.send({ type: 'rematch', want: true });
    await a.wait((m) => m.type === 'rematchState' && m.want.filter(Boolean).length === 3);
    d.send({ type: 'rematch', want: true });
    const inits2 = await Promise.all([a, b, c, d].map((x) => x.wait((m) => m.type === 'matchInit' && m.matchNo === 2, 15000)));
    assert.deepEqual(inits2.map((m) => m.me), [0, 2, 3, 1]);
    await a.wait((m) => m.type === 'matchStart' && a.msgs.filter((x) => x.type === 'matchStart').length >= 2, 15000);
    // Dan trennt sich und kommt nicht zurück → Bot übernimmt, Kampf läuft weiter
    const dToken = d.welcome.token;
    d.close();
    const take = await a.wait((m) => m.type === 'takeover', 15000);
    assert.equal(take.seat, 1);
    const end2 = await a.wait((m) => m.type === 'matchEnd' && a.msgs.filter((x) => x.type === 'matchEnd').length >= 2, 120000);
    assert.equal(end2.rematchAvailable, false, 'kein Rematch, wenn ein Bot einen Platz übernommen hat');
    assert.ok(end2.stats[1].played > 0 || end2.time < 10, 'Bot hat für Dan gespielt');
    // Rückkehr nach Ablauf der Frist: kein Wiedereinstieg, klare Meldung
    const d2 = new TestClient({ url, name: 'Dan', deck: d.deck, db });
    await d2.connect();
    d2.send({ type: 'hello', name: 'Dan', token: dToken, protocol: 2 });
    const w = await d2.wait((m) => m.type === 'welcome');
    assert.equal(w.resumed, false);
    const note = await d2.wait((m) => m.type === 'notice' && m.takenOver);
    assert.match(note.message, /Bot/);
    d2.close();
  } finally {
    for (const x of [a, b, c, d]) x.close();
  }
});

async function draftMatch(mode) {
  const a = await client('Anna', null, 11);
  const b = await client('Ben', null, 12);
  try {
    a.send({ type: 'create', mode });
    const l = await a.wait((m) => m.type === 'lobby' && m.code);
    b.send({ type: 'join', code: l.code });
    await a.wait((m) => m.type === 'lobby' && m.players[1]);
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    await b.wait((m) => m.type === 'draft');
    // Reconnect mitten im Draft: Ben trennt sich nach zwei eigenen Picks und kommt mit seinem Token zurück
    await b.wait((m) => m.type === 'draft' && (m.kind === 'triple' ? m.picks.length >= 2 : m.picks[m.you].length >= 2), 20000);
    const token = b.welcome.token;
    b.autoDraft = false;
    b.close();
    await new Promise((r) => setTimeout(r, 400));
    const b2 = new TestClient({ url, name: 'Ben', deck: null, db, seed: 13 });
    await b2.connect();
    b2.send({ type: 'hello', name: 'Ben', token, protocol: 2 });
    const w = await b2.wait((m) => m.type === 'welcome');
    assert.equal(w.resumed, true);
    const st = await b2.wait((m) => m.type === 'draft');
    assert.ok(st.timeLeft > 0 && st.timeLeft <= st.timerSeconds, 'Restzeit wird mitgeschickt');
    const mine = st.kind === 'triple' ? st.picks : st.picks[st.you];
    assert.ok(mine.length >= 2, 'bisherige Picks bleiben erhalten');
    b2.onDraft(st);
    const reveal = await a.wait((m) => m.type === 'draftReveal', 60000);
    assert.equal(reveal.decks.length, 2);
    for (const deck of reveal.decks) {
      assert.equal(deck.length, 8);
      assert.equal(new Set(deck).size, 8);
      assert.ok(deck.filter((id) => db.card(id).class === 'champion').length <= 1);
    }
    const [ia, ib] = await Promise.all([a.wait((m) => m.type === 'matchInit', 15000), b2.wait((m) => m.type === 'matchInit', 15000)]);
    assert.deepEqual(ia.deck, reveal.decks[0]);
    assert.deepEqual(ib.deck, reveal.decks[1]);
    const [ea] = await Promise.all([a.wait((m) => m.type === 'matchEnd', 120000), b2.wait((m) => m.type === 'matchEnd', 120000)]);
    assert.deepEqual(ea.decks, reveal.decks, 'Ergebnis zeigt die Draft-Decks');
    b2.close();
    return { reveal, end: ea };
  } finally {
    a.close();
    b.close();
  }
}

test('Triple Draft mit zwei Clients inklusive Reconnect mitten im Draft', { timeout: 200000 }, async () => {
  const r = await draftMatch('triple-draft');
  assert.ok(r.end.reason);
});

test('Mega Draft mit zwei Clients inklusive Reconnect mitten im Draft', { timeout: 200000 }, async () => {
  const r = await draftMatch('mega-draft');
  for (const deck of r.reveal.decks) assert.ok(deck.every((id) => db.card(id).class !== 'hero'), 'keine Helden im Mega Draft');
});

test('Unendlich-Elixier: Massen-Platzierungen, Server bleibt stabil, Eingabe-Limit greift', { timeout: 200000 }, async () => {
  const a = await client('Anna', STARTER_DECKS[0].slots, 21);
  const b = await client('Ben', STARTER_DECKS[2].slots, 22);
  a.aggressive = true;
  b.aggressive = true;
  try {
    a.send({ type: 'create', deck: a.deck, mode: 'infinite-elixir' });
    const l = await a.wait((m) => m.type === 'lobby' && m.code);
    b.send({ type: 'join', code: l.code, deck: b.deck });
    await a.wait((m) => m.type === 'lobby' && m.players[1]);
    tickTimes.length = 0;
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    const init = await a.wait((m) => m.type === 'matchInit');
    assert.equal(init.rules.elixir.rate, 7);
    const [ea] = await Promise.all([a.wait((m) => m.type === 'matchEnd', 150000), b.wait((m) => m.type === 'matchEnd', 150000)]);
    const plays = ea.stats[0].played + ea.stats[1].played;
    assert.ok(plays > 60, `viele Platzierungen: ${plays}`);
    // Ablehnungen wegen Tempo/Limit statt Abstürzen
    const rejects = { ...Object.fromEntries(a.rejects) };
    for (const [k, v] of b.rejects) rejects[k] = (rejects[k] || 0) + v;
    assert.ok((rejects.TOO_FAST || 0) + (rejects.LIMIT || 0) + (rejects.ELIXIR || 0) + (rejects.NOT_READY || 0) > 0, JSON.stringify(rejects));
    // Platzierungen pro Sekunde (Sim-Zeit) bleiben unter dem Limit
    assert.ok(ea.stats[0].played / ea.time <= 2.5 + 4 / ea.time + 1e-6);
    tickTimes.sort((x, y) => x - y);
    const p99 = tickTimes[Math.floor(tickTimes.length * 0.99)];
    assert.ok(p99 < 50, `Server-Tick p99 ${p99.toFixed(2)} ms (Budget 50 ms bei 20 Ticks/s)`);
    console.log(`# Unendlich-Elixier: ${plays} Platzierungen in ${ea.time} s, Ablehnungen ${JSON.stringify(rejects)}, Tick p50 ${tickTimes[Math.floor(tickTimes.length / 2)].toFixed(2)} ms / p99 ${p99.toFixed(2)} ms`);
  } finally {
    a.close();
    b.close();
  }
});

test('Manipulierte Clients werden abgewiesen (Protokoll, Modus-Werte, Draft, Karten, Elixier)', { timeout: 60000 }, async () => {
  // alte Protokollversion
  const old = new TestClient({ url, name: 'Alt', deck: null, db });
  await old.connect();
  old.send({ type: 'hello', name: 'Alt' });
  const err = await old.wait((m) => m.type === 'error');
  assert.equal(err.code, 'OUTDATED');
  assert.match(err.message, /neu laden/);
  old.close();
  const a = await client('Anna', STARTER_DECKS[0].slots, 31);
  const b = await client('Ben', STARTER_DECKS[1].slots, 32);
  try {
    // Modus-Parameter fälschen
    a.send({ type: 'create', deck: a.deck, mode: { id: 'classic', elixir: { multiplier: 50 } } });
    await a.wait((m) => m.type === 'error' && m.code === 'UNKNOWN_MODE');
    a.send({ type: 'training', deck: a.deck, mode: '2v2' });
    await a.wait((m) => m.type === 'error' && m.code === 'NO_BOTS');
    // Draft: nicht angebotene Karte
    a.autoDraft = false;
    b.autoDraft = false;
    a.send({ type: 'create', mode: 'triple-draft' });
    const l = await a.wait((m) => m.type === 'lobby' && m.code);
    b.send({ type: 'join', code: l.code });
    await a.wait((m) => m.type === 'lobby' && m.players[1]);
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    const st = await a.wait((m) => m.type === 'draft');
    const foreign = db.cards.find((c) => !st.offer.includes(c.id)).id;
    a.send({ type: 'draftPick', card: foreign });
    await a.wait((m) => m.type === 'error' && m.code === 'NOT_OFFERED');
    a.send({ type: 'draftPick', card: { id: st.offer[0] } });
    await a.wait((m) => m.type === 'error' && m.code === 'NOT_OFFERED' && a.msgs.filter((x) => x.code === 'NOT_OFFERED').length >= 2);
    // Doppel-Pick: zweite Karte aus demselben Angebot wird abgelehnt (es gibt schon das nächste Angebot)
    a.send({ type: 'draftPick', card: st.offer[0] });
    a.send({ type: 'draftPick', card: st.offer[1] });
    await a.wait((m) => m.type === 'error' && m.code === 'NOT_OFFERED' && a.msgs.filter((x) => x.code === 'NOT_OFFERED').length >= 3);
    // Restliche Picks automatisch, dann im Kampf: fremde Karte, Elixier-Spoofing
    a.autoDraft = true;
    b.autoDraft = true;
    b.onDraft(b.msgs.filter((m) => m.type === 'draft').at(-1));
    const init = await a.wait((m) => m.type === 'matchInit', 60000);
    await a.wait((m) => m.type === 'matchStart', 15000);
    a.aggressive = false;
    a.nextAct = 1e9; // eigener Bot-Teil still
    const notMine = db.cards.find((c) => !init.deck.includes(c.id)).id;
    a.send({ type: 'play', slot: 0, card: notMine, x: 9, y: 24, seq: 900 });
    const r1 = await a.wait((m) => m.type === 'reject' && m.seq === 900);
    assert.equal(r1.code, 'NOT_IN_HAND');
    a.send({ type: 'play', slot: 0, card: init.deck[0], x: 9, y: 24, seq: 901, elixir: 99, cost: 0 });
    const r2 = await a.wait((m) => (m.type === 'reject' && m.seq === 901) || false, 3000).catch(() => null);
    // Entweder regulär gespielt (Karte war auf der Hand und bezahlbar) oder sauber abgelehnt – Zusatzfelder wirken nie
    if (r2) assert.ok(['NOT_IN_HAND', 'ELIXIR', 'NOT_READY', 'PLACEMENT', 'MIRROR_EMPTY', 'MIRROR_CHAMPION'].includes(r2.code), r2.code);
    a.send({ type: 'surrender' });
    await a.wait((m) => m.type === 'matchEnd', 15000);
  } finally {
    a.close();
    b.close();
  }
});
