import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/rooms.js';
import { CODE_ALPHABET } from '../shared/protocol.js';
import { STARTER_DECKS } from '../shared/decks.js';
import { db, rules } from './helpers.js';

class FakeClock {
  constructor() {
    this.now = 1_000_000;
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
  const mgr = new RoomManager({ db, rules: rules(), now: () => clock.now, timers: clock });
  const client = (name) => {
    const inbox = [];
    const send = (msg, raw) => inbox.push(raw ? JSON.parse(msg) : msg);
    const s = mgr.createSession(name, send);
    return { s, inbox, send, last: (type) => inbox.filter((m) => m.type === type).at(-1), all: (type) => inbox.filter((m) => m.type === type) };
  };
  return { clock, mgr, client };
}
const DECK = STARTER_DECKS[0].slots;

test('Raum erstellen liefert 6-stelligen Code aus Buchstaben/Zahlen', () => {
  const { mgr, client } = setup();
  const a = client('Anna');
  const r = mgr.createRoom(a.s, DECK);
  assert.ok(r.ok);
  const code = a.last('lobby').code;
  assert.match(code, /^[A-Z0-9]{6}$/);
  for (const ch of code) assert.ok(CODE_ALPHABET.includes(ch));
  assert.equal(a.last('lobby').players[0].name, 'Anna');
  assert.equal(a.last('lobby').players[1], null);
});

test('Codes sind eindeutig', () => {
  const { mgr, client } = setup();
  const codes = new Set();
  for (let i = 0; i < 200; i++) codes.add(mgr.createRoom(client('P' + i).s, DECK).room.code);
  assert.equal(codes.size, 200);
});

test('Beitreten: ungültig, unbekannt, voll – mit klaren Fehlern', () => {
  const { mgr, client } = setup();
  const a = client('A');
  const code = mgr.createRoom(a.s, DECK).room.code;
  assert.equal(mgr.joinRoom(client('X').s, 'ab!', DECK).code, 'INVALID_CODE');
  assert.equal(mgr.joinRoom(client('X').s, 'ZZZZZZ', DECK).code, 'ROOM_NOT_FOUND');
  const b = client('B');
  assert.ok(mgr.joinRoom(b.s, code.toLowerCase(), DECK).ok, 'Groß-/Kleinschreibung egal');
  assert.equal(b.last('lobby').players[1].name, 'B');
  assert.equal(a.last('lobby').players[1].name, 'B');
  assert.equal(mgr.joinRoom(client('C').s, code, DECK).code, 'ROOM_FULL');
  assert.equal(mgr.joinRoom(client('D').s, code, ['x']).code, 'ROOM_FULL');
});

test('Ungültiges Deck wird abgelehnt', () => {
  const { mgr, client } = setup();
  const r = mgr.createRoom(client('A').s, DECK.slice(0, 5));
  assert.equal(r.ok, false);
  assert.equal(r.code, 'INVALID_DECK');
});

test('Codes verfallen nach 10 Minuten', () => {
  const { mgr, client, clock } = setup();
  const a = client('A');
  const code = mgr.createRoom(a.s, DECK).room.code;
  clock.advance(9 * 60 * 1000);
  assert.ok(mgr.rooms.has(code));
  clock.advance(61 * 1000);
  assert.equal(mgr.joinRoom(client('B').s, code, DECK).code, 'ROOM_EXPIRED');
  mgr.cleanup();
  assert.ok(!mgr.rooms.has(code));
  assert.equal(a.last('roomClosed').reason, 'expired');
  assert.equal(a.s.room, null);
  assert.equal(mgr.joinRoom(client('C').s, code, DECK).code, 'ROOM_EXPIRED', 'auch nach dem Aufräumen');
});

function readyRoom() {
  const env = setup();
  const a = env.client('A');
  const b = env.client('B');
  const code = env.mgr.createRoom(a.s, DECK).room.code;
  env.mgr.joinRoom(b.s, code, STARTER_DECKS[1].slots);
  const room = a.s.room;
  room.setReady(a.s, true);
  room.setReady(b.s, true);
  return { ...env, a, b, room };
}

test('Beide bereit → Countdown 3-2-1 → Laden → Kampf', () => {
  const { a, b, room, clock, mgr } = readyRoom();
  assert.equal(room.state, 'countdown');
  assert.deepEqual(a.all('countdown').map((m) => m.n), [3]);
  clock.advance(3000);
  assert.deepEqual(a.all('countdown').map((m) => m.n), [3, 2, 1, 0]);
  assert.equal(room.state, 'loading');
  const init = a.last('matchInit');
  assert.equal(init.side, 0);
  assert.equal(b.last('matchInit').side, 1);
  assert.deepEqual(init.names, ['A', 'B']);
  room.onLoaded(a.s);
  assert.equal(room.state, 'loading');
  room.onLoaded(b.s);
  assert.equal(room.state, 'playing');
  assert.ok(a.last('matchStart'));
  mgr.tick();
  const snap = a.last('s');
  assert.ok(snap && snap.me && snap.e.length >= 6);
  const snapB = b.last('s');
  assert.ok(snapB && snapB.me, 'jeder bekommt seinen eigenen Teil (Hand/Elixier)');
  assert.deepEqual(snapB.e, snap.e, 'gemeinsamer Weltzustand ist identisch');
});

test('Countdown bricht ab, wenn jemand nicht mehr bereit ist', () => {
  const { a, room, clock } = readyRoom();
  clock.advance(1000);
  room.setReady(a.s, false);
  assert.equal(room.state, 'lobby');
  assert.equal(a.last('countdown').n, -1);
  clock.advance(5000);
  assert.equal(room.state, 'lobby');
});

test('Laden hat ein Timeout', () => {
  const { room, clock, a } = readyRoom();
  clock.advance(3000);
  room.onLoaded(a.s);
  clock.advance(8000);
  assert.equal(room.state, 'playing');
});

test('Reconnect innerhalb von 30 Sekunden', () => {
  const { a, b, room, clock, mgr } = readyRoom();
  clock.advance(3000);
  room.onLoaded(a.s);
  room.onLoaded(b.s);
  mgr.disconnect(b.s);
  assert.equal(a.last('presence').connected, false);
  clock.advance(20_000);
  const inbox2 = [];
  const resumed = mgr.resume(b.s.token, (msg, raw) => inbox2.push(raw ? JSON.parse(msg) : msg));
  assert.equal(resumed, b.s);
  assert.equal(a.last('presence').connected, true);
  assert.ok(inbox2.some((m) => m.type === 'matchInit' && m.resume));
  assert.ok(inbox2.some((m) => m.type === 'matchStart'));
  clock.advance(20_000);
  assert.equal(room.state, 'playing', 'Kampf läuft weiter');
});

test('Keine Rückkehr nach 30 Sekunden → Niederlage durch Verbindungsabbruch', () => {
  const { a, b, room, clock, mgr } = readyRoom();
  clock.advance(3000);
  room.onLoaded(a.s);
  room.onLoaded(b.s);
  mgr.disconnect(b.s);
  clock.advance(30_001);
  const end = a.last('matchEnd');
  assert.ok(end);
  assert.equal(end.winner, 0);
  assert.equal(end.reason, 'disconnect');
  assert.equal(mgr.resume(b.s.token, () => {}), null, 'Sitzung ist abgelaufen');
});

test('Rematch nur, wenn beide zustimmen', () => {
  const { a, b, room, clock } = readyRoom();
  clock.advance(3000);
  room.onLoaded(a.s);
  room.onLoaded(b.s);
  room.surrender(b.s);
  assert.equal(room.state, 'ended');
  assert.equal(a.last('matchEnd').winner, 0);
  room.requestRematch(a.s, true);
  assert.deepEqual(b.last('rematchState').want, [true, false]);
  assert.equal(room.state, 'ended');
  room.requestRematch(b.s, true);
  assert.equal(room.state, 'countdown');
  clock.advance(3000);
  assert.equal(a.last('matchInit').matchNo, 2);
});

test('Verlassen: Gastgeber schließt die Lobby, Gast macht Platz frei', () => {
  const env = setup();
  const a = env.client('A');
  const b = env.client('B');
  const code = env.mgr.createRoom(a.s, DECK).room.code;
  env.mgr.joinRoom(b.s, code, DECK);
  a.s.room.leave(b.s);
  assert.equal(a.last('lobby').players[1], null);
  const c = env.client('C');
  assert.ok(env.mgr.joinRoom(c.s, code, DECK).ok);
  a.s.room.leave(a.s);
  assert.equal(c.last('roomClosed').reason, 'hostLeft');
  assert.ok(!env.mgr.rooms.has(code));
});

test('Training: Bot-Gegner, Kampf startet ohne zweiten Menschen', () => {
  const { mgr, client, clock } = setup();
  const a = client('Solo');
  const r = mgr.createTraining(a.s, DECK);
  assert.ok(r.ok);
  clock.advance(3000);
  r.room.onLoaded(a.s);
  assert.equal(r.room.state, 'playing');
  for (let i = 0; i < 20 * 20; i++) mgr.tick();
  assert.ok(r.room.match.stats[1].played > 0, 'Bot spielt Karten');
});
