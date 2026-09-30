// Ende-zu-Ende über echte WebSockets: Raum erstellen, beitreten, Kampf, Karte spielen, Anti-Cheat, Reconnect.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { startServer } from '../server/index.js';
import { STARTER_DECKS } from '../shared/decks.js';
import { db } from './helpers.js';

let srv;
before(async () => {
  srv = await startServer({ port: 0, host: '127.0.0.1', quiet: true });
});
after(async () => {
  await srv.close();
});

function client() {
  const ws = new WebSocket(`ws://127.0.0.1:${srv.port}/ws`);
  const msgs = [];
  const waiters = [];
  ws.on('message', (d) => {
    const m = JSON.parse(d);
    msgs.push(m);
    for (const w of [...waiters]) {
      if (w.pred(m)) {
        waiters.splice(waiters.indexOf(w), 1);
        clearTimeout(w.timer);
        w.res(m);
      }
    }
  });
  const wait = (pred, ms = 6000, fromNow = false) =>
    new Promise((res, rej) => {
      if (!fromNow) {
        const f = msgs.find(pred);
        if (f) return res(f);
      }
      const w = { pred, res };
      w.timer = setTimeout(() => rej(new Error('Timeout beim Warten')), ms);
      waiters.push(w);
    });
  const send = (o) => ws.send(JSON.stringify(o));
  return new Promise((r) => ws.on('open', () => r({ ws, msgs, wait, send })));
}

test('HTTP liefert Client, Daten und blockiert Pfad-Traversal', async () => {
  const base = `http://127.0.0.1:${srv.port}`;
  const html = await fetch(base + '/').then((r) => r.text());
  assert.match(html, /Turmtrubel/);
  const cards = await fetch(base + '/data/cards.json').then((r) => r.json());
  assert.equal(cards.cards.length, db.cards.length);
  const shared = await fetch(base + '/shared/arena.js');
  assert.equal(shared.status, 200);
  const bad = await fetch(base + '/../server/index.js');
  assert.notEqual(bad.status, 200);
  const bad2 = await fetch(base + '/shared/..%2f..%2fpackage.json');
  assert.notEqual(bad2.status, 200);
});

test('Kompletter Ablauf über WebSocket', async () => {
  const a = await client();
  const b = await client();
  a.send({ type: 'hello', name: 'Alice' });
  b.send({ type: 'hello', name: 'Bob' });
  await a.wait((m) => m.type === 'welcome');
  const wb = await b.wait((m) => m.type === 'welcome');

  a.send({ type: 'create', deck: STARTER_DECKS[0].slots });
  const lobby = await a.wait((m) => m.type === 'lobby');
  b.send({ type: 'join', code: '123', deck: STARTER_DECKS[1].slots });
  assert.match((await b.wait((m) => m.type === 'error')).message, /6 Buchstaben/);
  b.send({ type: 'join', code: lobby.code, deck: STARTER_DECKS[1].slots });
  await a.wait((m) => m.type === 'lobby' && m.players[1] && m.players[1].name === 'Bob');

  a.send({ type: 'ready', ready: true });
  b.send({ type: 'ready', ready: true });
  await a.wait((m) => m.type === 'countdown' && m.n === 0, 6000);
  await a.wait((m) => m.type === 'matchInit');
  await b.wait((m) => m.type === 'matchInit');
  a.send({ type: 'loaded' });
  b.send({ type: 'loaded' });
  await a.wait((m) => m.type === 'matchStart');
  const s0 = await a.wait((m) => m.type === 's');

  // Anti-Cheat: gegnerische Hälfte, fremde Karte, zu teuer
  const troopSlot = s0.me.h.findIndex((id) => db.card(id).type === 'troop' && db.card(id).elixir <= 5);
  a.send({ type: 'play', slot: troopSlot, card: s0.me.h[troopSlot], x: 9, y: 8, seq: 1 });
  assert.equal((await a.wait((m) => m.type === 'reject' && m.seq === 1)).code, 'PLACEMENT');
  a.send({ type: 'play', slot: 0, card: 'kometenschlag', x: 9, y: 8, seq: 2 });
  assert.equal((await a.wait((m) => m.type === 'reject' && m.seq === 2)).code, 'NOT_IN_HAND');

  // Gültiger Zug
  a.send({ type: 'play', slot: troopSlot, card: s0.me.h[troopSlot], x: 9.5, y: 22.5, seq: 3 });
  const played = await a.wait((m) => m.type === 's' && m.ev.some((e) => e[0] === 'pl' && e[1] === 0), 3000, true);
  assert.ok(played.me.el < 5.5);
  const seenByB = await b.wait((m) => m.type === 's' && m.e.length > 6, 3000);
  assert.ok(seenByB.e.some((e) => e[2] === 0 && e[1] > 1), 'Gegner sieht die neue Einheit');

  // Emote & Ping
  a.send({ type: 'emote', id: 2 });
  await b.wait((m) => m.type === 's' && m.ev.some((e) => e[0] === 'em' && e[2] === 2), 3000, true);
  a.send({ type: 'ping', t: 123 });
  assert.equal((await a.wait((m) => m.type === 'pong')).t, 123);

  // Reconnect von Bob
  b.ws.close();
  await a.wait((m) => m.type === 'presence' && m.connected === false);
  const b2 = await client();
  b2.send({ type: 'hello', token: wb.token });
  assert.equal((await b2.wait((m) => m.type === 'welcome')).resumed, true);
  await b2.wait((m) => m.type === 'matchStart');
  await b2.wait((m) => m.type === 's');

  // Aufgabe → Ergebnis → Rematch
  a.send({ type: 'surrender' });
  const end = await b2.wait((m) => m.type === 'matchEnd');
  assert.equal(end.winner, 1);
  assert.equal(end.crowns[1], 3);
  b2.send({ type: 'rematch', want: true });
  a.send({ type: 'rematch', want: true });
  await a.wait((m) => m.type === 'matchInit' && m.matchNo === 2, 6000);
  a.ws.close();
  b2.ws.close();
});

test('Nachrichten ohne Anmeldung werden abgewiesen, Müll wird ignoriert', async () => {
  const c = await client();
  c.ws.send('kein json');
  c.send({ foo: 1 });
  c.send({ type: 'create', deck: [] });
  assert.equal((await c.wait((m) => m.type === 'error')).code, 'NO_SESSION');
  c.ws.close();
});
