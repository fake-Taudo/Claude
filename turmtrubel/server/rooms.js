// Räume, Einladungscodes, Lobby, Countdown, Reconnect und Rematch.
// Unabhängig vom Transport: Nachrichten gehen über session.send(obj).
import { randomUUID } from 'node:crypto';
import { S2C, ERRORS, CODE_ALPHABET, CODE_LENGTH, END_REASONS, normalizeCode, isValidCodeFormat, sanitizeName } from '../shared/protocol.js';
import { validateDeck, averageElixir, randomDeck } from '../shared/cards.js';
import { Match } from './sim/match.js';
import { Bot } from './bot.js';

export class Session {
  constructor(name, send) {
    this.token = randomUUID();
    this.name = name;
    this.sendFn = send;
    this.connected = !!send;
    this.room = null;
    this.side = -1;
    this.isBot = false;
    this.graceTimer = null;
    this.lastSeen = Date.now();
  }
  send(msg) {
    if (this.connected && this.sendFn) this.sendFn(msg);
  }
}

export class RoomManager {
  constructor({ db, rules, now = () => Date.now(), random = Math.random, timers = {} }) {
    this.db = db;
    this.rules = rules;
    this.now = now;
    this.random = random;
    this.setTimeout = timers.setTimeout || setTimeout;
    this.clearTimeout = timers.clearTimeout || clearTimeout;
    this.sessions = new Map();
    this.rooms = new Map();
    this.expired = new Map(); // code → Zeitpunkt (für klare Fehlermeldung)
  }

  get lobbyRules() {
    return this.rules.lobby;
  }

  // ─────────────── Sitzungen ───────────────

  createSession(name, send) {
    const s = new Session(name, send);
    this.sessions.set(s.token, s);
    return s;
  }

  /** Wiederaufnahme einer bestehenden Sitzung per Token (Reconnect). */
  resume(token, send) {
    const s = typeof token === 'string' ? this.sessions.get(token) : null;
    if (!s || s.isBot) return null;
    if (s.graceTimer) {
      this.clearTimeout(s.graceTimer);
      s.graceTimer = null;
    }
    s.sendFn = send;
    s.connected = true;
    s.lastSeen = this.now();
    if (s.room) s.room.onReconnect(s);
    return s;
  }

  disconnect(s) {
    if (!s || !s.connected) return;
    s.connected = false;
    s.sendFn = null;
    s.lastSeen = this.now();
    const grace = (this.lobbyRules.reconnectSeconds ?? 30) * 1000;
    if (s.room) s.room.onDisconnect(s, grace);
    s.graceTimer = this.setTimeout(() => {
      s.graceTimer = null;
      if (s.connected) return;
      if (s.room) s.room.leave(s, 'disconnect');
      this.sessions.delete(s.token);
    }, grace);
  }

  rename(s, name) {
    const n = sanitizeName(name);
    if (!n) return { ok: false, code: 'INVALID_NAME', message: ERRORS.INVALID_NAME };
    s.name = n;
    if (s.room) s.room.broadcastLobby();
    return { ok: true };
  }

  // ─────────────── Räume ───────────────

  generateCode() {
    for (let tries = 0; tries < 1000; tries++) {
      let code = '';
      for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[Math.floor(this.random() * CODE_ALPHABET.length)];
      if (!this.rooms.has(code) && !this.expired.has(code)) return code;
    }
    throw new Error('Kein freier Code gefunden');
  }

  checkDeck(deck) {
    const v = validateDeck(this.db, deck);
    return v.ok ? null : { ok: false, code: 'INVALID_DECK', message: ERRORS.INVALID_DECK + ' ' + v.errors.join(' ') };
  }

  createRoom(s, deck) {
    if (s.room) return { ok: false, code: 'ALREADY_IN_ROOM', message: ERRORS.ALREADY_IN_ROOM };
    const bad = this.checkDeck(deck);
    if (bad) return bad;
    const room = new Room(this, this.generateCode(), false);
    this.rooms.set(room.code, room);
    room.addPlayer(s, deck);
    return { ok: true, room };
  }

  joinRoom(s, rawCode, deck) {
    if (s.room) return { ok: false, code: 'ALREADY_IN_ROOM', message: ERRORS.ALREADY_IN_ROOM };
    const code = normalizeCode(rawCode);
    if (!isValidCodeFormat(code)) return { ok: false, code: 'INVALID_CODE', message: ERRORS.INVALID_CODE };
    const room = this.rooms.get(code);
    if (!room) {
      if (this.expired.has(code)) return { ok: false, code: 'ROOM_EXPIRED', message: ERRORS.ROOM_EXPIRED };
      return { ok: false, code: 'ROOM_NOT_FOUND', message: ERRORS.ROOM_NOT_FOUND };
    }
    if (room.training) return { ok: false, code: 'ROOM_NOT_FOUND', message: ERRORS.ROOM_NOT_FOUND };
    if (this.now() >= room.expiresAt) return { ok: false, code: 'ROOM_EXPIRED', message: ERRORS.ROOM_EXPIRED };
    if (room.players[0] && room.players[1]) return { ok: false, code: 'ROOM_FULL', message: ERRORS.ROOM_FULL };
    if (room.state !== 'lobby') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    const bad = this.checkDeck(deck);
    if (bad) return bad;
    room.addPlayer(s, deck);
    return { ok: true, room };
  }

  createTraining(s, deck) {
    if (s.room) return { ok: false, code: 'ALREADY_IN_ROOM', message: ERRORS.ALREADY_IN_ROOM };
    const bad = this.checkDeck(deck);
    if (bad) return bad;
    const room = new Room(this, 'T' + this.generateCode().slice(1), true);
    this.rooms.set(room.code, room);
    room.addPlayer(s, deck);
    const bot = new Session('Trainingsbot', null);
    bot.isBot = true;
    bot.connected = true;
    room.addPlayer(bot, randomDeck(this.db, this.random));
    room.ready = [true, true];
    room.startCountdown();
    return { ok: true, room };
  }

  closeRoom(room, reason, message) {
    room.clearTimers();
    for (const p of room.players) {
      if (!p) continue;
      p.room = null;
      p.side = -1;
      if (reason) p.send({ type: S2C.CLOSED, reason, message });
    }
    room.players = [null, null];
    room.state = 'closed';
    this.rooms.delete(room.code);
  }

  /** Einen Simulationsschritt für alle laufenden Kämpfe. */
  tick() {
    for (const room of this.rooms.values()) if (room.state === 'playing') room.tick();
  }

  /** Abgelaufene Codes schließen, verwaiste Räume aufräumen. */
  cleanup() {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      const humans = room.players.filter((p) => p && !p.isBot);
      if (!humans.length) {
        this.closeRoom(room);
        continue;
      }
      const waitingAlone = room.state === 'lobby' && !(room.players[0] && room.players[1]);
      if (waitingAlone && now >= room.expiresAt) {
        this.expired.set(room.code, now);
        this.closeRoom(room, 'expired', ERRORS.ROOM_EXPIRED);
      }
    }
    for (const [code, t] of this.expired) if (now - t > 3600_000) this.expired.delete(code);
  }
}

export class Room {
  constructor(mgr, code, training) {
    this.mgr = mgr;
    this.code = code;
    this.training = training;
    this.createdAt = mgr.now();
    this.expiresAt = this.createdAt + (mgr.lobbyRules.codeTtlSeconds ?? 600) * 1000;
    this.players = [null, null];
    this.decks = [null, null];
    this.ready = [false, false];
    this.loaded = [false, false];
    this.rematch = [false, false];
    this.state = 'lobby';
    this.match = null;
    this.bot = null;
    this.timers = new Set();
    this.lastResult = null;
    this.matchNo = 0;
    this.departing = null;
  }

  get db() {
    return this.mgr.db;
  }

  later(ms, fn) {
    const h = this.mgr.setTimeout(() => {
      this.timers.delete(h);
      fn();
    }, ms);
    this.timers.add(h);
    return h;
  }

  clearTimers() {
    for (const h of this.timers) this.mgr.clearTimeout(h);
    this.timers.clear();
  }

  addPlayer(s, deck) {
    const side = this.players[0] ? 1 : 0;
    this.players[side] = s;
    this.decks[side] = deck.slice();
    this.ready[side] = false;
    s.room = this;
    s.side = side;
    this.broadcastLobby();
  }

  opponent(s) {
    return this.players[1 - s.side];
  }

  lobbyState(side) {
    return {
      type: S2C.LOBBY,
      code: this.code,
      state: this.state,
      you: side,
      training: this.training,
      expiresIn: Math.max(0, Math.round((this.expiresAt - this.mgr.now()) / 1000)),
      players: this.players.map((p, i) =>
        p
          ? {
              name: p.name,
              ready: this.ready[i],
              deckOk: validateDeck(this.db, this.decks[i]).ok,
              avg: averageElixir(this.db, this.decks[i]),
              connected: p.connected,
              bot: p.isBot,
            }
          : null,
      ),
    };
  }

  broadcastLobby() {
    if (this.state !== 'lobby' && this.state !== 'countdown') return;
    this.players.forEach((p, i) => p && p.send(this.lobbyState(i)));
  }

  broadcast(msg) {
    for (const p of this.players) if (p) p.send(msg);
  }

  setDeck(s, deck) {
    if (this.state !== 'lobby' && this.state !== 'countdown' && this.state !== 'ended') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    const bad = this.mgr.checkDeck(deck);
    if (bad) return bad;
    this.decks[s.side] = deck.slice();
    if (this.state === 'countdown') this.cancelCountdown();
    this.ready[s.side] = false;
    this.broadcastLobby();
    return { ok: true };
  }

  setReady(s, ready) {
    if (this.state !== 'lobby' && this.state !== 'countdown') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    if (ready && !validateDeck(this.db, this.decks[s.side]).ok) return { ok: false, code: 'INVALID_DECK', message: ERRORS.INVALID_DECK };
    this.ready[s.side] = !!ready;
    if (!ready && this.state === 'countdown') this.cancelCountdown();
    if (this.state === 'lobby' && this.players[0] && this.players[1] && this.ready[0] && this.ready[1]) this.startCountdown();
    else this.broadcastLobby();
    return { ok: true };
  }

  startCountdown() {
    this.clearTimers();
    this.state = 'countdown';
    this.broadcastLobby();
    const secs = this.mgr.lobbyRules.countdownSeconds ?? 3;
    for (let i = 0; i <= secs; i++) {
      const n = secs - i;
      const fire = () => {
        if (this.state !== 'countdown') return;
        this.broadcast({ type: S2C.COUNTDOWN, n });
        if (n === 0) this.startLoading();
      };
      if (i === 0) fire();
      else this.later(i * 1000, fire);
    }
  }

  cancelCountdown() {
    this.clearTimers();
    this.state = 'lobby';
    this.broadcast({ type: S2C.COUNTDOWN, n: -1 });
    this.broadcastLobby();
  }

  matchInitFor(side) {
    return {
      type: S2C.MATCH_INIT,
      side,
      names: this.players.map((p) => (p ? p.name : '—')),
      types: this.db.typeList,
      deck: this.decks[side],
      training: this.training,
      matchNo: this.matchNo,
      rules: {
        tickRate: this.mgr.rules.tickRate,
        regularSeconds: this.mgr.rules.regularSeconds,
        overtimeSeconds: this.mgr.rules.overtimeSeconds,
        doubleElixirLastSeconds: this.mgr.rules.doubleElixirLastSeconds,
        elixir: this.mgr.rules.elixir,
        suddenDeath: this.mgr.rules.suddenDeath,
        emoteCooldown: this.mgr.rules.emoteCooldown,
        towers: {
          king: { size: this.mgr.rules.towers.king.size },
          princess: { size: this.mgr.rules.towers.princess.size },
        },
      },
    };
  }

  startLoading() {
    this.clearTimers();
    this.state = 'loading';
    this.matchNo++;
    this.loaded = [false, false];
    this.rematch = [false, false];
    this.lastResult = null;
    const seed = Math.floor(this.mgr.random() * 2 ** 31);
    this.match = new Match({ db: this.db, rules: this.mgr.rules, decks: this.decks, seed });
    this.bot = null;
    this.players.forEach((p, i) => {
      if (!p) return;
      if (p.isBot) {
        this.loaded[i] = true;
        this.bot = new Bot(this.match, i, seed ^ 0x5a5a);
      } else p.send(this.matchInitFor(i));
    });
    const timeout = (this.mgr.lobbyRules.loadTimeoutSeconds ?? 8) * 1000;
    this.later(timeout, () => this.startMatch());
  }

  onLoaded(s) {
    if (this.state !== 'loading') return;
    this.loaded[s.side] = true;
    if (this.loaded[0] && this.loaded[1]) this.startMatch();
  }

  startMatch() {
    if (this.state !== 'loading') return;
    this.clearTimers();
    this.state = 'playing';
    this.match.started = true;
    this.broadcast({ type: S2C.MATCH_START });
    this.sendSnapshots();
  }

  sendSnapshots() {
    const m = this.match;
    const common = JSON.stringify(m.snapshotCommon());
    const body = common.slice(1, -1);
    this.players.forEach((p, i) => {
      if (!p || p.isBot || !p.connected || !p.sendFn) return;
      p.sendFn(`{"type":"s",${body},"me":${JSON.stringify(m.meState(i))}}`, true);
    });
    m.flushEvents();
  }

  tick() {
    const m = this.match;
    if (this.bot) this.bot.update();
    m.step();
    this.sendSnapshots();
    if (m.result) this.finishMatch();
  }

  finishMatch() {
    this.clearTimers();
    this.state = 'ended';
    const r = this.match.result;
    this.lastResult = r;
    this.rematch = this.players.map((p) => !!(p && p.isBot));
    this.players.forEach((p, i) => p && p.send(this.resultFor(i)));
  }

  resultFor(side) {
    const r = this.lastResult;
    return {
      type: S2C.MATCH_END,
      you: side,
      winner: r.winner,
      reason: r.reason,
      reasonText: END_REASONS[r.reason] || r.reason,
      crowns: r.crowns,
      names: this.players.map((p) => (p ? p.name : '—')),
      towerHp: r.towerHp,
      stats: r.stats,
      time: r.time,
      rematch: this.rematch.slice(),
      rematchAvailable: !!(this.players[0] && this.players[1]) && this.departing == null,
      training: this.training,
    };
  }

  requestRematch(s, want) {
    if (this.state !== 'ended') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    this.rematch[s.side] = !!want;
    const available = !!(this.players[0] && this.players[1]);
    this.broadcast({ type: S2C.REMATCH, want: this.rematch.slice(), available });
    if (available && this.rematch[0] && this.rematch[1]) {
      this.ready = [true, true];
      this.startCountdown();
    }
    return { ok: true };
  }

  surrender(s) {
    if (this.state !== 'playing' && this.state !== 'loading') return;
    this.match.forfeit(s.side, 'forfeit');
    if (this.state === 'loading') {
      this.match.started = true;
      this.state = 'playing';
    }
    this.sendSnapshots();
    this.finishMatch();
  }

  leave(s, reason = 'leave') {
    const side = s.side;
    if (side < 0 || this.players[side] !== s) return;
    const other = this.players[1 - side];
    if (this.training) {
      this.mgr.closeRoom(this);
      return;
    }
    if (this.state === 'playing' || this.state === 'loading') {
      this.match.forfeit(side, reason === 'disconnect' ? 'disconnect' : 'forfeit');
      this.state = 'playing';
      this.match.started = true;
      this.sendSnapshots();
      this.departing = side; // Ergebnis meldet: kein Rematch möglich
      this.finishMatch();
      this.departing = null;
    }
    this.players[side] = null;
    this.decks[side] = null;
    this.ready = [false, false];
    s.room = null;
    s.side = -1;
    if (!other) {
      this.mgr.closeRoom(this);
      return;
    }
    if (this.state === 'lobby' || this.state === 'countdown') {
      if (side === 0) {
        this.mgr.closeRoom(this, 'hostLeft', 'Der Gastgeber hat den Raum verlassen.');
        return;
      }
      this.clearTimers();
      this.state = 'lobby';
      other.send({ type: S2C.COUNTDOWN, n: -1 });
      other.send({ type: S2C.NOTICE, message: `${s.name} hat den Raum verlassen.` });
      this.broadcastLobby();
    } else if (this.state === 'ended') {
      this.rematch = [false, false];
      other.send({ type: S2C.REMATCH, want: [false, false], available: false });
      other.send({ type: S2C.NOTICE, message: `${s.name} hat den Raum verlassen.` });
    }
  }

  onDisconnect(s, graceMs) {
    const other = this.opponent(s);
    if (other) other.send({ type: S2C.PRESENCE, side: s.side, connected: false, graceLeft: Math.round(graceMs / 1000) });
    this.broadcastLobby();
  }

  onReconnect(s) {
    const other = this.opponent(s);
    if (other) other.send({ type: S2C.PRESENCE, side: s.side, connected: true, graceLeft: 0 });
    this.sendState(s);
  }

  /** Vollständigen Zustand an einen (wieder) verbundenen Spieler senden. */
  sendState(s) {
    const side = s.side;
    switch (this.state) {
      case 'lobby':
      case 'countdown':
        this.broadcastLobby();
        break;
      case 'loading':
        s.send(this.matchInitFor(side));
        break;
      case 'playing':
        s.send({ ...this.matchInitFor(side), resume: true });
        s.send({ type: S2C.MATCH_START, resume: true });
        break;
      case 'ended':
        if (this.lastResult) s.send(this.resultFor(side));
        break;
    }
  }
}
