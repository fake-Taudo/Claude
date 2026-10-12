// Räume mit Spielmodi: Modus-Wahl, Team-Lobby (2 gegen 2), Bot-Übernahme, Draft-Phase mit Reconnect und Auto-Pick,
// Training mit Schwierigkeit, Team-Ping und Missbrauchsversuche.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../server/rooms.js';
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
  let r = 0.37;
  const mgr = new RoomManager({ db, rules: rules(), now: () => clock.now, timers: clock, random: () => (r = (r * 9301 + 0.4927) % 1) });
  const client = (name) => {
    const inbox = [];
    const send = (msg, raw) => inbox.push(raw ? JSON.parse(msg) : msg);
    const s = mgr.createSession(name, send);
    return { s, inbox, send, last: (type) => inbox.filter((m) => m.type === type).at(-1), all: (type) => inbox.filter((m) => m.type === type) };
  };
  return { clock, mgr, client };
}
const DECK = STARTER_DECKS[0].slots;
const DECK2 = STARTER_DECKS[1].slots;

function fourPlayers() {
  const env = setup();
  const [a, b, c, d] = ['Anna', 'Ben', 'Cleo', 'Dan'].map(env.client);
  assert.ok(env.mgr.createRoom(a.s, DECK, '2v2').ok);
  const code = a.last('lobby').code;
  for (const x of [b, c, d]) assert.ok(env.mgr.joinRoom(x.s, code, DECK2).ok);
  return { ...env, a, b, c, d, code, room: a.s.room };
}

function startTeamMatch(env) {
  const { a, b, c, d, clock, room } = env;
  for (const x of [a, b, c, d]) room.setReady(x.s, true);
  assert.equal(room.state, 'countdown');
  clock.advance(3100);
  assert.equal(room.state, 'loading');
  for (const x of [a, b, c, d]) room.onLoaded(x.s);
  assert.equal(room.state, 'playing');
}

test('Modus beim Erstellen: unbekannte Modi und gefälschte Modus-Werte werden abgewiesen', () => {
  const { mgr, client } = setup();
  const a = client('Anna');
  assert.equal(mgr.createRoom(a.s, DECK, 'turbo').code, 'UNKNOWN_MODE');
  assert.equal(mgr.createRoom(a.s, DECK, { id: 'classic', elixir: { multiplier: 99 } }).code, 'UNKNOWN_MODE');
  assert.equal(mgr.createTraining(a.s, DECK, '2v2').code, 'NO_BOTS');
  assert.equal(mgr.createTraining(a.s, DECK, 'classic', 'unmöglich').code, 'BAD_DIFFICULTY');
  assert.ok(mgr.createRoom(a.s, DECK, 'infinite-elixir').ok);
  const lobby = a.last('lobby');
  assert.equal(lobby.mode.id, 'infinite-elixir');
  assert.equal(a.s.room.rules.elixir.rate, 7, 'Werte kommen vom Server, nicht vom Client');
});

test('Beitritt mit Code zeigt den gewählten Modus', () => {
  const { mgr, client } = setup();
  const a = client('Anna');
  const b = client('Ben');
  mgr.createRoom(a.s, null, 'mega-draft');
  assert.ok(mgr.joinRoom(b.s, a.last('lobby').code, null).ok, 'Draft-Modi brauchen kein gespeichertes Deck');
  assert.equal(b.last('lobby').mode.id, 'mega-draft');
  assert.equal(b.last('lobby').mode.draft, 'mega');
  assert.ok(b.last('lobby').mode.rules.length >= 3);
});

test('2v2-Lobby: 4 Plätze in 2 Teams, fünfter Spieler wird abgewiesen', () => {
  const env = fourPlayers();
  const { a, b, c, d, mgr, client, code } = env;
  const l = a.last('lobby');
  assert.equal(l.players.length, 4);
  assert.deepEqual(l.teams, [0, 0, 1, 1]);
  assert.deepEqual([a, b, c, d].map((x) => x.s.side), [0, 2, 1, 3], 'Teams werden abwechselnd aufgefüllt');
  assert.equal(l.host, 0);
  assert.equal(mgr.joinRoom(client('Eve').s, code, DECK).code, 'ROOM_FULL');
});

test('2v2-Lobby: Platz wählen, Team wechseln, Gastgeber verschiebt und entfernt', () => {
  const env = setup();
  const { mgr, client } = env;
  const [a, b, c] = ['Anna', 'Ben', 'Cleo'].map(client);
  mgr.createRoom(a.s, DECK, '2v2');
  const code = a.last('lobby').code;
  mgr.joinRoom(b.s, code, DECK);
  mgr.joinRoom(c.s, code, DECK);
  const room = a.s.room;
  assert.equal(b.s.side, 2);
  // Ben wechselt ins blaue Team auf den freien Platz 3? (3 ist rot) → nimmt Platz 1 (blau)
  assert.equal(room.chooseSeat(b.s, 1).code, 'SEAT_TAKEN', 'Platz 1 hat Cleo');
  assert.ok(room.chooseSeat(b.s, 3).ok);
  assert.equal(b.s.side, 3);
  assert.equal(room.chooseSeat(b.s, 9).code, 'BAD_SEAT');
  // Nur der Gastgeber verschiebt
  assert.equal(room.movePlayer(b.s, 1, 2).code, 'NOT_HOST');
  assert.ok(room.movePlayer(a.s, 1, 2).ok, 'Cleo auf freien Platz 2');
  assert.equal(c.s.side, 2);
  assert.ok(room.movePlayer(a.s, 2, 3).ok, 'Tausch Cleo ↔ Ben');
  assert.equal(c.s.side, 3);
  assert.equal(b.s.side, 2);
  assert.equal(a.last('lobby').players[3].name, 'Cleo');
  // Entfernen
  assert.equal(room.kick(b.s, 0).code, 'NOT_HOST');
  assert.ok(room.kick(a.s, 2).ok);
  assert.equal(b.s.room, null);
  assert.equal(b.last('roomClosed').reason, 'kicked');
  assert.equal(a.last('lobby').players[2], null);
});

test('2v2: Start erst, wenn alle 4 Plätze besetzt und bereit sind; Match-Init nennt Team und Sitz', () => {
  const env = fourPlayers();
  const { a, b, c, d, room, clock } = env;
  for (const x of [a, b, c]) room.setReady(x.s, true);
  assert.equal(room.state, 'lobby');
  room.setReady(d.s, true);
  assert.equal(room.state, 'countdown');
  clock.advance(3100);
  const init = c.last('matchInit');
  assert.equal(init.me, 1);
  assert.equal(init.side, 0, 'Cleo sitzt auf Platz 1 → Team blau');
  assert.deepEqual(init.teams, [0, 0, 1, 1]);
  assert.equal(init.names.length, 4);
  for (const x of [a, b, c, d]) room.onLoaded(x.s);
  room.tick();
  const snap = b.last('s');
  assert.ok(snap.me.tm, 'Teamkollegen-Info');
  assert.equal(snap.me.tm[0][0], 3, 'Bens Kollege ist Platz 3');
});

test('2v2: Verbindungsabbruch → nach 30 s übernimmt ein Bot, Rückkehr danach nicht mehr möglich', () => {
  const env = fourPlayers();
  const { a, b, c, d, mgr, clock, room } = env;
  startTeamMatch(env);
  const token = b.s.token;
  mgr.disconnect(b.s);
  assert.equal(a.last('presence').connected, false);
  assert.equal(a.last('presence').name, 'Ben');
  clock.advance(30_100);
  assert.equal(room.state, 'playing', 'Kampf läuft weiter');
  assert.ok(room.players[2].isBot, 'Bot auf Bens Platz');
  assert.ok(room.bots.has(2));
  assert.equal(a.last('takeover').seat, 2);
  assert.equal(mgr.resume(token, () => {}), null, 'kein Wiedereinstieg');
  assert.match(mgr.goneMessage(token), /Bot/);
  // Bot spielt wirklich: einige Sekunden simulieren
  for (let i = 0; i < 20 * 20; i++) room.tick();
  assert.ok(room.match.stats[2].played > 0, 'Bot spielt Bens Deck');
  // Ergebnis: kein Rematch, weil ein Mensch fehlt
  room.surrender(c.s);
  room.surrender(d.s);
  assert.equal(room.state, 'playing', 'Aufgeben im 2v2 = Bot übernimmt');
  assert.ok(room.players[1].isBot && room.players[3].isBot);
  room.match.forfeit(1, 'forfeit');
  room.tick();
  assert.equal(room.state, 'ended');
  assert.equal(a.last('matchEnd').rematchAvailable, false);
  assert.equal(a.last('matchEnd').names.length, 4);
});

test('2v2: Rematch nur, wenn alle 4 zustimmen – Teams bleiben gleich', () => {
  const env = fourPlayers();
  const { a, b, c, d, room, clock } = env;
  startTeamMatch(env);
  const seats = [a, b, c, d].map((x) => x.s.side);
  room.match.forfeit(0, 'forfeit');
  room.tick();
  assert.equal(room.state, 'ended');
  for (const x of [a, b, c]) room.requestRematch(x.s, true);
  assert.equal(room.state, 'ended');
  assert.deepEqual(a.last('rematchState').want.filter(Boolean).length, 3);
  room.requestRematch(d.s, true);
  assert.equal(room.state, 'countdown');
  clock.advance(3100);
  assert.deepEqual([a, b, c, d].map((x) => x.s.side), seats);
  assert.equal(room.state, 'loading');
});

test('Team-Ping erreicht nur das eigene Team, mit Abklingzeit', () => {
  const env = fourPlayers();
  const { a, b, c, d, room, clock } = env;
  startTeamMatch(env);
  assert.ok(room.mapPing(a.s, 4, 10).ok);
  assert.equal(c.last('teamPing').seat, 0, 'Teamkollege (Platz 1) bekommt das Zeichen');
  assert.equal(b.last('teamPing'), undefined, 'Gegner nicht');
  assert.equal(d.last('teamPing'), undefined);
  assert.equal(room.mapPing(a.s, 4, 10).ok, false, 'Abklingzeit');
  assert.equal(room.mapPing(c.s, -5, 10).ok, false, 'außerhalb der Arena');
  clock.advance(2100);
  assert.ok(room.mapPing(a.s, 5, 11).ok);
});

function draftRoom(modeId) {
  const env = setup();
  const a = env.client('Anna');
  const b = env.client('Ben');
  env.mgr.createRoom(a.s, null, modeId);
  env.mgr.joinRoom(b.s, a.last('lobby').code, null);
  const room = a.s.room;
  room.setReady(a.s, true);
  room.setReady(b.s, true);
  env.clock.advance(3100);
  assert.equal(room.state, 'draft');
  return { ...env, a, b, room };
}

test('Triple Draft im Raum: Angebote, Ablehnung fremder Karten, Auto-Pick nach 15 s, Reveal, Kampf mit Draft-Decks', () => {
  const { a, b, room, clock } = draftRoom('triple-draft');
  const sa = a.last('draft');
  assert.equal(sa.kind, 'triple');
  assert.equal(sa.offer.length, 3);
  assert.equal(sa.rounds, 8);
  assert.ok(sa.timeLeft > 14 && sa.timeLeft <= 15);
  // Manipulation: Karte, die nicht angeboten wurde
  const foreign = db.cards.find((c) => !sa.offer.includes(c.id)).id;
  assert.equal(room.draftPick(a.s, foreign).code, 'NOT_OFFERED');
  assert.ok(room.draftPick(a.s, sa.offer[0]).ok);
  assert.equal(room.draftPick(a.s, sa.offer[1]).code, 'ALREADY_PICKED');
  assert.equal(b.last('draft').others[0], true);
  // Ben wählt nicht → nach Ablauf zufällig
  clock.advance(15_100);
  assert.equal(room.draft.round, 1);
  assert.equal(room.draft.picks[1].length, 1);
  // Rest per Zeitablauf
  for (let r = 1; r < 8; r++) clock.advance(15_100);
  assert.equal(room.state, 'reveal');
  const rev = a.last('draftReveal');
  assert.equal(rev.decks.length, 2);
  assert.equal(rev.decks[0].length, 8);
  assert.ok(rev.decks[0].includes(sa.offer[0]));
  clock.advance(5100);
  assert.equal(room.state, 'loading');
  assert.deepEqual(a.last('matchInit').deck, rev.decks[0]);
  assert.deepEqual(room.match.players[1].deck, rev.decks[1]);
  // gespeicherte Decks bleiben unberührt
  assert.equal(room.decks[0], null);
});

test('Draft: Reconnect stellt Zustand und Restzeit wieder her, Auto-Pick läuft weiter', () => {
  const { a, b, room, mgr, clock } = draftRoom('mega-draft');
  const st = a.last('draft');
  assert.equal(st.kind, 'mega');
  assert.equal(st.pool.length, 40);
  const turn = st.turn;
  const [mover, other] = turn === 0 ? [a, b] : [b, a];
  // falscher Spieler
  assert.equal(room.draftPick(other.s, st.allowed[0]).code, 'NOT_YOUR_TURN');
  mgr.disconnect(mover.s);
  clock.advance(10_000);
  const inbox = [];
  assert.ok(mgr.resume(mover.s.token, (m, raw) => inbox.push(raw ? JSON.parse(m) : m)));
  const back = inbox.find((m) => m.type === 'draft');
  assert.ok(back, 'Draft-Zustand nach Reconnect');
  assert.equal(back.turn, turn);
  assert.ok(back.timeLeft > 14 && back.timeLeft < 16, `Restzeit ${back.timeLeft}`);
  clock.advance(15_100);
  assert.equal(room.draft.picks[turn].length, 1, 'Auto-Pick nach Ablauf der 25 s');
});

test('Draft: Verlassen bricht den Draft ab, der andere bekommt eine klare Meldung', () => {
  const { a, b, room } = draftRoom('triple-draft');
  room.leave(b.s, 'leave');
  assert.equal(room.state, 'lobby');
  assert.match(a.last('notice').message, /Draft abgebrochen/);
  const { a: a2, b: b2, room: r2 } = draftRoom('triple-draft');
  r2.leave(a2.s, 'leave');
  assert.equal(b2.last('roomClosed').reason, 'hostLeft');
});

test('Training in Draft-Modi: der Bot draftet selbst (1–6 s Bedenkzeit), Kampf startet', () => {
  for (const mode of ['triple-draft', 'mega-draft']) {
    for (const diff of ['easy', 'medium', 'hard']) {
      const { mgr, client, clock } = setup();
      const a = client('Anna');
      assert.ok(mgr.createTraining(a.s, null, mode, diff).ok);
      const room = a.s.room;
      assert.equal(room.players[1].name, `Bot ${{ easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' }[diff]}`);
      clock.advance(3100);
      assert.equal(room.state, 'draft');
      // Mensch wählt immer sofort die erste erlaubte Karte
      for (let i = 0; i < 400 && room.state === 'draft'; i++) {
        const st = a.last('draft');
        const mine = st.kind === 'triple' ? !st.chosen && st.offer.length : st.turn === 0;
        if (mine) room.draftPick(a.s, st.kind === 'triple' ? st.offer[0] : st.allowed[0]);
        clock.advance(500);
      }
      assert.equal(room.state, 'reveal', `${mode}/${diff}`);
      assert.ok(room.draft.log.filter(([s, , auto]) => s === 1 && !auto).length >= 7, 'Bot wählt selbst, nicht per Zeitablauf');
      clock.advance(5100);
      room.onLoaded(a.s);
      assert.equal(room.state, 'playing');
      assert.equal(room.bot.difficulty, diff);
    }
  }
});

test('Training Unendlich-Elixier: Bot mit Aktionsbremse, Kampf läuft stabil', () => {
  const { mgr, client, clock } = setup();
  const a = client('Anna');
  assert.ok(mgr.createTraining(a.s, DECK, 'infinite-elixir', 'hard').ok);
  clock.advance(3100);
  const room = a.s.room;
  room.onLoaded(a.s);
  assert.equal(room.bot.minGap, 0.8);
  const times = [];
  const play = room.match.play.bind(room.match);
  room.match.play = (...args) => {
    const r = play(...args);
    if (r.ok && args[0] === 1) times.push(room.match.time);
    return r;
  };
  for (let i = 0; i < 20 * 60; i++) room.tick();
  assert.ok(times.length > 10);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 0.8 - 1e-9, 'Mindestabstand eingehalten');
});
