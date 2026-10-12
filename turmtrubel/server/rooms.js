// Räume, Einladungscodes, Lobby (auch mit Teams), Draft-Phase, Countdown, Reconnect, Rematch und Bot-Übernahme.
// Unabhängig vom Transport: Nachrichten gehen über session.send(obj).
//
// Ablauf eines Raums:
//   lobby → countdown → [draft → reveal] → loading → playing → ended → (Rematch) countdown …
// Plätze („Sitze“): so viele wie der Modus Spieler hat. Sitz = Spielerindex der Simulation, das Team
// ergibt sich aus teamLayout() (klassisch: Sitz 0 blau, Sitz 1 rot; 2v2: Sitze 0–1 blau, 2–3 rot).
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { S2C, ERRORS, CODE_ALPHABET, CODE_LENGTH, END_REASONS, PING_COOLDOWN, normalizeCode, isValidCodeFormat, sanitizeName } from '../shared/protocol.js';
import { validateDeck, averageElixir, randomDeck } from '../shared/cards.js';
import { ARENA_W, ARENA_H } from '../shared/arena.js';
import { createModes, resolveRules, teamLayout, modeSummary, DIFFICULTIES, DIFFICULTY_LABELS } from '../shared/modes.js';
import { Match } from './sim/match.js';
import { Bot } from './bot.js';
import { createDraft } from './draft.js';
import { draftChoice } from './botdraft.js';
import { mulberry32 } from './sim/rng.js';

let fileModes = null;
/** modes.json von der Platte (Standard, wenn der Aufrufer keine Modi übergibt – z. B. in Tests). */
export function defaultModes() {
  if (!fileModes) fileModes = createModes(JSON.parse(fs.readFileSync(new URL('../data/modes.json', import.meta.url), 'utf8')));
  return fileModes;
}

export class Session {
  constructor(name, send) {
    this.token = randomUUID();
    this.name = name;
    this.sendFn = send;
    this.connected = !!send;
    this.room = null;
    this.side = -1; // Sitz im Raum
    this.isBot = false;
    this.graceTimer = null;
    this.lastSeen = Date.now();
  }
  send(msg) {
    if (this.connected && this.sendFn) this.sendFn(msg);
  }
}

export class RoomManager {
  constructor({ db, rules, modes = null, now = () => Date.now(), random = Math.random, timers = {} }) {
    this.db = db;
    this.rules = rules;
    this.modes = modes || defaultModes();
    this.now = now;
    this.random = random;
    this.setTimeout = timers.setTimeout || setTimeout;
    this.clearTimeout = timers.clearTimeout || clearTimeout;
    this.sessions = new Map();
    this.rooms = new Map();
    this.expired = new Map(); // code → Zeitpunkt (für klare Fehlermeldung)
    this.gone = new Map(); // Token → Meldung für Spieler, deren Platz ein Bot übernommen hat
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

  /** Meldung für einen Token, dessen Platz nach Ablauf der Frist ein Bot übernommen hat (einmalig). */
  goneMessage(token) {
    const m = typeof token === 'string' ? this.gone.get(token) : null;
    if (m) this.gone.delete(token);
    return m || null;
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

  /** Modus nachschlagen – nur IDs aus modes.json, alle Werte setzt der Server. */
  modeFor(id) {
    if (id === undefined || id === null || id === '') return { mode: this.modes.get(this.modes.defaultId) };
    const mode = typeof id === 'string' ? this.modes.get(id) : null;
    return mode ? { mode } : { error: { ok: false, code: 'UNKNOWN_MODE', message: ERRORS.UNKNOWN_MODE } };
  }

  /** Deck für einen Modus prüfen (Draft-Modi brauchen kein gespeichertes Deck). */
  deckFor(mode, deck) {
    if (mode.deckSource === 'draft') return { deck: null };
    const bad = this.checkDeck(deck);
    return bad ? { error: bad } : { deck: deck.slice() };
  }

  createRoom(s, deck, modeId) {
    if (s.room) return { ok: false, code: 'ALREADY_IN_ROOM', message: ERRORS.ALREADY_IN_ROOM };
    const { mode, error } = this.modeFor(modeId);
    if (error) return error;
    const d = this.deckFor(mode, deck);
    if (d.error) return d.error;
    const room = new Room(this, this.generateCode(), false, mode);
    this.rooms.set(room.code, room);
    room.host = s;
    room.addPlayer(s, d.deck);
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
    if (room.full()) return { ok: false, code: 'ROOM_FULL', message: ERRORS.ROOM_FULL };
    if (room.state !== 'lobby') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    const d = this.deckFor(room.mode, deck);
    if (d.error) return d.error;
    room.addPlayer(s, d.deck);
    return { ok: true, room };
  }

  createTraining(s, deck, modeId, difficulty) {
    if (s.room) return { ok: false, code: 'ALREADY_IN_ROOM', message: ERRORS.ALREADY_IN_ROOM };
    const { mode, error } = this.modeFor(modeId);
    if (error) return error;
    if (!mode.botsAllowed) return { ok: false, code: 'NO_BOTS', message: ERRORS.NO_BOTS };
    const diff = difficulty == null ? 'medium' : difficulty;
    if (!DIFFICULTIES.includes(diff)) return { ok: false, code: 'BAD_DIFFICULTY', message: ERRORS.BAD_DIFFICULTY };
    const d = this.deckFor(mode, deck);
    if (d.error) return d.error;
    const room = new Room(this, 'T' + this.generateCode().slice(1), true, mode);
    room.difficulty = diff;
    this.rooms.set(room.code, room);
    room.host = s;
    room.addPlayer(s, d.deck);
    const bot = new Session(`Bot ${DIFFICULTY_LABELS[diff]}`, null);
    bot.isBot = true;
    bot.connected = true;
    bot.difficulty = diff;
    room.addPlayer(bot, mode.deckSource === 'draft' ? null : randomDeck(this.db, this.random));
    room.ready = room.players.map(() => true);
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
    room.players = room.players.map(() => null);
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
      const waiting = room.state === 'lobby' && !room.full();
      if (waiting && now >= room.expiresAt) {
        this.expired.set(room.code, now);
        this.closeRoom(room, 'expired', ERRORS.ROOM_EXPIRED);
      }
    }
    for (const [code, t] of this.expired) if (now - t > 3600_000) this.expired.delete(code);
    if (this.gone.size > 500) this.gone.clear();
  }
}

/** Reihenfolge, in der neue Spieler Plätze bekommen (Teams abwechselnd auffüllen). */
function seatOrder(n) {
  const half = n / 2;
  const out = [];
  for (let i = 0; i < half; i++) out.push(i, half + i);
  return out;
}

export class Room {
  constructor(mgr, code, training, mode = mgr.modes.get(mgr.modes.defaultId)) {
    this.mgr = mgr;
    this.code = code;
    this.training = training;
    this.mode = mode;
    this.size = mode.players;
    this.teamOf = teamLayout(this.size);
    this.rules = resolveRules(mgr.rules, mode);
    this.createdAt = mgr.now();
    this.expiresAt = this.createdAt + (mgr.lobbyRules.codeTtlSeconds ?? 600) * 1000;
    const n = () => new Array(this.size).fill(null);
    const f = () => new Array(this.size).fill(false);
    this.players = n();
    this.decks = n();
    this.ready = f();
    this.loaded = f();
    this.rematch = f();
    this.host = null;
    this.difficulty = 'medium';
    this.state = 'lobby';
    this.match = null;
    this.bots = new Map(); // Sitz → Bot (im Kampf)
    this.takenOver = new Set(); // Sitze, die ein Bot nach Abbruch übernommen hat
    this.timers = new Set();
    this.lastResult = null;
    this.matchNo = 0;
    this.departing = null;
    this.draft = null;
    this.draftDecks = null;
    this.draftTimer = null;
    this.botPickTimers = new Map();
    this.deadlineAt = 0;
    this.pingAt = new Map();
  }

  get db() {
    return this.mgr.db;
  }

  get bot() {
    // Kompatibilität: der (erste) Trainingsbot
    return this.bots.values().next().value || null;
  }

  later(ms, fn) {
    const h = this.mgr.setTimeout(() => {
      this.timers.delete(h);
      fn();
    }, ms);
    this.timers.add(h);
    return h;
  }

  cancel(h) {
    if (!h) return;
    this.mgr.clearTimeout(h);
    this.timers.delete(h);
  }

  clearTimers() {
    for (const h of this.timers) this.mgr.clearTimeout(h);
    this.timers.clear();
    this.draftTimer = null;
    this.botPickTimers.clear();
  }

  full() {
    return this.players.every(Boolean);
  }

  teamOfSeat(seat) {
    return this.teamOf[seat];
  }

  addPlayer(s, deck) {
    const seat = seatOrder(this.size).find((i) => !this.players[i]);
    this.players[seat] = s;
    this.decks[seat] = deck ? deck.slice() : null;
    this.ready[seat] = false;
    s.room = this;
    s.side = seat;
    this.broadcastLobby();
  }

  /** Gegner im 1 gegen 1 (bzw. erster Spieler des anderen Teams). */
  opponent(s) {
    const team = this.teamOf[s.side];
    return this.players.find((p, i) => p && this.teamOf[i] !== team) || null;
  }

  deckOk(seat) {
    return this.mode.deckSource === 'draft' || validateDeck(this.db, this.decks[seat]).ok;
  }

  lobbyState(seat) {
    return {
      type: S2C.LOBBY,
      code: this.code,
      state: this.state,
      you: seat,
      training: this.training,
      expiresIn: Math.max(0, Math.round((this.expiresAt - this.mgr.now()) / 1000)),
      mode: modeSummary(this.mode),
      host: this.host ? this.host.side : 0,
      teams: this.teamOf,
      difficulty: this.training ? this.difficulty : null,
      players: this.players.map((p, i) =>
        p
          ? {
              name: p.name,
              ready: this.ready[i],
              deckOk: this.deckOk(i),
              avg: this.decks[i] ? averageElixir(this.db, this.decks[i]) : 0,
              connected: p.connected,
              bot: p.isBot,
              team: this.teamOf[i],
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
    if (this.mode.deckSource === 'draft') return { ok: true }; // Draft-Modi: Deck entsteht im Draft
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
    if (ready && !this.deckOk(s.side)) return { ok: false, code: 'INVALID_DECK', message: ERRORS.INVALID_DECK };
    this.ready[s.side] = !!ready;
    if (!ready && this.state === 'countdown') this.cancelCountdown();
    if (this.state === 'lobby' && this.full() && this.ready.every(Boolean)) this.startCountdown();
    else this.broadcastLobby();
    return { ok: true };
  }

  // ─────────────── Team-Lobby: Plätze ───────────────

  lobbyOnly() {
    return this.state === 'lobby' ? null : { ok: false, code: 'NOT_IN_LOBBY', message: ERRORS.NOT_IN_LOBBY };
  }

  validSeat(seat) {
    return Number.isInteger(seat) && seat >= 0 && seat < this.size;
  }

  placeAt(s, seat) {
    const from = s.side;
    this.players[seat] = s;
    this.decks[seat] = this.decks[from];
    this.players[from] = null;
    this.decks[from] = null;
    this.ready[from] = false;
    this.ready[seat] = false;
    s.side = seat;
  }

  /** Spieler wählt einen freien Platz (auch im anderen Team). */
  chooseSeat(s, seat) {
    const bad = this.lobbyOnly();
    if (bad) return bad;
    if (!this.validSeat(seat)) return { ok: false, code: 'BAD_SEAT', message: ERRORS.BAD_SEAT };
    if (seat === s.side) return { ok: true };
    if (this.players[seat]) return { ok: false, code: 'SEAT_TAKEN', message: ERRORS.SEAT_TAKEN };
    this.placeAt(s, seat);
    this.broadcastLobby();
    return { ok: true };
  }

  /** Gastgeber verschiebt einen Spieler auf einen freien Platz oder tauscht zwei Spieler. */
  movePlayer(s, from, to) {
    if (s !== this.host) return { ok: false, code: 'NOT_HOST', message: ERRORS.NOT_HOST };
    const bad = this.lobbyOnly();
    if (bad) return bad;
    if (!this.validSeat(from) || !this.validSeat(to) || !this.players[from]) return { ok: false, code: 'BAD_SEAT', message: ERRORS.BAD_SEAT };
    if (from === to) return { ok: true };
    const a = this.players[from];
    const b = this.players[to];
    const da = this.decks[from];
    const db = this.decks[to];
    this.players[to] = a;
    this.decks[to] = da;
    this.players[from] = b;
    this.decks[from] = db;
    a.side = to;
    if (b) b.side = from;
    this.ready[from] = false;
    this.ready[to] = false;
    this.broadcastLobby();
    return { ok: true };
  }

  /** Gastgeber entfernt einen Spieler aus der Lobby. */
  kick(s, seat) {
    if (s !== this.host) return { ok: false, code: 'NOT_HOST', message: ERRORS.NOT_HOST };
    if (this.state !== 'lobby' && this.state !== 'ended') return { ok: false, code: 'NOT_IN_LOBBY', message: ERRORS.NOT_IN_LOBBY };
    if (!this.validSeat(seat) || !this.players[seat] || seat === s.side) return { ok: false, code: 'BAD_SEAT', message: ERRORS.BAD_SEAT };
    const p = this.players[seat];
    this.players[seat] = null;
    this.decks[seat] = null;
    this.ready = this.ready.map(() => false);
    p.room = null;
    p.side = -1;
    p.send({ type: S2C.CLOSED, reason: 'kicked', message: ERRORS.KICKED });
    if (this.state === 'ended') {
      this.rematch = this.rematch.map(() => false);
      this.broadcast({ type: S2C.REMATCH, want: this.rematch.slice(), available: false });
    }
    this.broadcast({ type: S2C.NOTICE, message: `${p.name} wurde aus dem Raum entfernt.` });
    this.broadcastLobby();
    return { ok: true };
  }

  // ─────────────── Countdown ───────────────

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
        if (n === 0) {
          if (this.mode.deckSource === 'draft') this.startDraft();
          else this.startLoading();
        }
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

  // ─────────────── Draft ───────────────

  startDraft() {
    this.clearTimers();
    this.state = 'draft';
    this.draftDecks = null;
    const seed = Math.floor(this.mgr.random() * 2 ** 31);
    this.draft = createDraft(this.db, this.mode.draft, { seats: this.size, seed });
    this.draftRng = mulberry32(seed ^ 0x2b2b);
    this.armDraft();
  }

  pickSeconds() {
    return this.mode.draft.pickSeconds ?? 15;
  }

  /** Neue Wahl-Runde/neuer Zug: Frist setzen, Bots einplanen, Zustand an alle. */
  armDraft() {
    this.cancel(this.draftTimer);
    for (const h of this.botPickTimers.values()) this.cancel(h);
    this.botPickTimers.clear();
    this.deadlineAt = this.mgr.now() + this.pickSeconds() * 1000;
    this.draftTimer = this.later(this.pickSeconds() * 1000, () => this.draftTimeout());
    for (const seat of this.draft.pending()) this.scheduleBotPick(seat);
    this.broadcastDraft();
  }

  scheduleBotPick(seat) {
    const p = this.players[seat];
    if (!p || !p.isBot) return;
    // menschlich wirkende Bedenkzeit: 1–6 s (höchstens bis kurz vor Ablauf der Frist)
    const ms = Math.min(this.pickSeconds() * 1000 - 300, 1000 + Math.floor(this.draftRng() * 5000));
    const h = this.later(Math.max(200, ms), () => {
      this.botPickTimers.delete(seat);
      if (this.state !== 'draft' || !this.draft.pending().includes(seat)) return;
      const id = draftChoice(this.db, this.draft, seat, p.difficulty || this.difficulty, this.draftRng);
      const r = id ? this.draft.pick(seat, id) : this.draft.autoPick(seat);
      if (!r.ok) this.draft.autoPick(seat);
      this.afterPick();
    });
    this.botPickTimers.set(seat, h);
  }

  draftStateFor(seat) {
    return {
      type: S2C.DRAFT,
      you: seat,
      mode: this.mode.id,
      names: this.players.map((p) => (p ? p.name : '—')),
      bots: this.players.map((p) => !!p?.isBot),
      pickSeconds: this.pickSeconds(),
      timeLeft: Math.max(0, (this.deadlineAt - this.mgr.now()) / 1000),
      ...this.draft.stateFor(seat),
    };
  }

  broadcastDraft() {
    this.players.forEach((p, i) => p && !p.isBot && p.send(this.draftStateFor(i)));
  }

  draftPick(s, card) {
    if (this.state !== 'draft' || !this.draft) return { ok: false, code: 'NOT_DRAFTING', message: 'Gerade läuft kein Draft.' };
    const r = this.draft.pick(s.side, card);
    if (!r.ok) {
      s.send(this.draftStateFor(s.side));
      return r;
    }
    this.afterPick();
    return { ok: true };
  }

  draftTimeout() {
    this.draftTimer = null;
    if (this.state !== 'draft') return;
    // Frist abgelaufen: für alle, die noch wählen müssen, zufällig (aber regelkonform) wählen
    for (const seat of this.draft.pending()) this.draft.autoPick(seat);
    this.afterPick();
  }

  afterPick() {
    if (this.draft.done) return this.finishDraft();
    // Triple: Runde läuft weiter, bis alle gewählt haben (Frist bleibt); Mega: neuer Zug
    const pending = this.draft.pending();
    const roundOver = this.draft.kind === 'mega' || pending.length === this.size;
    if (roundOver) this.armDraft();
    else this.broadcastDraft();
  }

  finishDraft() {
    this.cancel(this.draftTimer);
    this.draftTimer = null;
    this.draftDecks = this.draft.decks();
    this.state = 'reveal';
    this.broadcastDraft();
    const secs = this.mode.draft.revealSeconds ?? 5;
    this.broadcast({ type: S2C.DRAFT_REVEAL, decks: this.draftDecks, names: this.players.map((p) => (p ? p.name : '—')), teams: this.teamOf, seconds: secs });
    const cd = Math.min(secs, this.mgr.lobbyRules.countdownSeconds ?? 3);
    for (let n = cd; n >= 0; n--) {
      this.later((secs - n) * 1000, () => {
        if (this.state !== 'reveal') return;
        this.broadcast({ type: S2C.COUNTDOWN, n });
        if (n === 0) this.startLoading();
      });
    }
  }

  /** Draft abbrechen (Spieler hat verlassen): zurück in die Lobby. */
  abortDraft(name) {
    this.clearTimers();
    this.draft = null;
    this.draftDecks = null;
    this.state = 'lobby';
    this.ready = this.ready.map(() => false);
    this.broadcast({ type: S2C.COUNTDOWN, n: -1 });
    this.broadcast({ type: S2C.NOTICE, message: `Draft abgebrochen: ${name} hat den Raum verlassen.` });
    this.broadcastLobby();
  }

  // ─────────────── Kampf ───────────────

  matchDecks() {
    return this.mode.deckSource === 'draft' ? this.draftDecks : this.decks;
  }

  matchInitFor(seat) {
    const R = this.rules;
    return {
      type: S2C.MATCH_INIT,
      side: this.teamOf[seat],
      me: seat,
      teams: this.teamOf,
      names: this.players.map((p) => (p ? p.name : '—')),
      bots: this.players.map((p) => !!p?.isBot),
      types: this.db.typeList,
      deck: this.matchDecks()[seat],
      training: this.training,
      matchNo: this.matchNo,
      mode: modeSummary(this.mode),
      rules: {
        tickRate: R.tickRate,
        regularSeconds: R.regularSeconds,
        overtimeSeconds: R.overtimeSeconds,
        doubleElixirLastSeconds: R.doubleElixirLastSeconds,
        elixir: R.elixir,
        suddenDeath: R.suddenDeath,
        emoteCooldown: R.emoteCooldown,
        towers: {
          king: { size: R.towers.king.size },
          princess: { size: R.towers.princess.size },
        },
      },
    };
  }

  makeBot(seat, seed, difficulty) {
    return new Bot(this.match, seat, seed, { difficulty, minGap: this.mode.bot?.minGap?.[difficulty] });
  }

  startLoading() {
    this.clearTimers();
    this.state = 'loading';
    this.matchNo++;
    this.loaded = this.players.map(() => false);
    this.rematch = this.players.map(() => false);
    this.lastResult = null;
    this.takenOver.clear();
    const seed = Math.floor(this.mgr.random() * 2 ** 31);
    this.match = new Match({ db: this.db, rules: this.rules, decks: this.matchDecks(), seed });
    this.bots = new Map();
    this.players.forEach((p, i) => {
      if (!p) return;
      if (p.isBot) {
        this.loaded[i] = true;
        this.bots.set(i, this.makeBot(i, seed ^ 0x5a5a, p.difficulty || this.difficulty));
      } else p.send(this.matchInitFor(i));
    });
    const timeout = (this.mgr.lobbyRules.loadTimeoutSeconds ?? 8) * 1000;
    this.later(timeout, () => this.startMatch());
  }

  onLoaded(s) {
    if (this.state !== 'loading') return;
    this.loaded[s.side] = true;
    if (this.loaded.every(Boolean)) this.startMatch();
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
    for (const b of this.bots.values()) b.update();
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

  rematchPossible() {
    return this.full() && this.departing == null && this.takenOver.size === 0;
  }

  resultFor(seat) {
    const r = this.lastResult;
    return {
      type: S2C.MATCH_END,
      you: this.teamOf[seat],
      me: seat,
      teams: this.teamOf,
      winner: r.winner,
      reason: r.reason,
      reasonText: END_REASONS[r.reason] || r.reason,
      crowns: r.crowns,
      names: this.players.map((p) => (p ? p.name : '—')),
      bots: this.players.map((p) => !!p?.isBot),
      towerHp: r.towerHp,
      stats: r.stats,
      time: r.time,
      rematch: this.rematch.slice(),
      rematchAvailable: this.rematchPossible(),
      training: this.training,
      mode: modeSummary(this.mode),
      decks: this.mode.deckSource === 'draft' ? this.draftDecks : null,
    };
  }

  requestRematch(s, want) {
    if (this.state !== 'ended') return { ok: false, code: 'ROOM_BUSY', message: ERRORS.ROOM_BUSY };
    this.rematch[s.side] = !!want;
    const available = this.rematchPossible();
    this.broadcast({ type: S2C.REMATCH, want: this.rematch.slice(), available });
    if (available && this.rematch.every(Boolean)) {
      this.ready = this.players.map(() => true);
      this.startCountdown();
    }
    return { ok: true };
  }

  surrender(s) {
    if (this.state !== 'playing' && this.state !== 'loading') return;
    // Team-Modi: Aufgeben = Kampf verlassen, ein Bot spielt für das Team weiter
    if (this.canTakeOver(s)) {
      this.leave(s, 'leave');
      s.send({ type: S2C.CLOSED, reason: 'left' });
      return;
    }
    this.match.forfeit(this.teamOf[s.side], 'forfeit');
    if (this.state === 'loading') {
      this.match.started = true;
      this.state = 'playing';
    }
    this.sendSnapshots();
    this.finishMatch();
  }

  /** Übernimmt ein Bot den Platz, wenn dieser Spieler den laufenden Kampf verlässt? (nur Team-Modi) */
  canTakeOver(s) {
    if (!(this.size > 2 && this.mode.twoVsTwo?.botTakeover)) return false;
    if (this.state !== 'playing' && this.state !== 'loading') return false;
    // nur, solange noch mindestens ein anderer Mensch im Raum ist
    return this.players.some((p) => p && p !== s && !p.isBot);
  }

  takeOver(s, reason) {
    const seat = s.side;
    const bot = new Session(`Bot für ${s.name}`, null);
    bot.isBot = true;
    bot.connected = true;
    bot.difficulty = 'medium';
    bot.room = this;
    bot.side = seat;
    this.players[seat] = bot;
    this.takenOver.add(seat);
    this.loaded[seat] = true;
    if (this.match) this.bots.set(seat, this.makeBot(seat, (this.matchNo * 7919 + seat) | 0, 'medium'));
    s.room = null;
    s.side = -1;
    if (reason === 'disconnect') this.mgr.gone.set(s.token, ERRORS.TAKEN_OVER);
    this.broadcast({ type: S2C.TAKEOVER, seat, name: s.name, bot: bot.name });
    this.broadcast({ type: S2C.NOTICE, message: `${s.name} ist weg – ein Bot spielt für das Team weiter.` });
    if (this.state === 'loading' && this.loaded.every(Boolean)) this.startMatch();
  }

  leave(s, reason = 'leave') {
    const seat = s.side;
    if (seat < 0 || this.players[seat] !== s) return;
    if (this.training) {
      this.mgr.closeRoom(this);
      return;
    }
    if (this.canTakeOver(s)) {
      this.takeOver(s, reason);
      return;
    }
    if (this.state === 'playing' || this.state === 'loading') {
      this.match.forfeit(this.teamOf[seat], reason === 'disconnect' ? 'disconnect' : 'forfeit');
      this.state = 'playing';
      this.match.started = true;
      this.sendSnapshots();
      this.departing = seat; // Ergebnis meldet: kein Rematch möglich
      this.finishMatch();
      this.departing = null;
    }
    const wasDraft = this.state === 'draft' || this.state === 'reveal';
    this.players[seat] = null;
    this.decks[seat] = null;
    this.ready = this.players.map(() => false);
    s.room = null;
    s.side = -1;
    const others = this.players.filter((p) => p && !p.isBot);
    if (!others.length) {
      this.mgr.closeRoom(this);
      return;
    }
    if (wasDraft) {
      if (s === this.host) this.mgr.closeRoom(this, 'hostLeft', `Draft abgebrochen: Der Gastgeber ${s.name} hat den Raum verlassen.`);
      else this.abortDraft(s.name);
      return;
    }
    if (this.state === 'lobby' || this.state === 'countdown') {
      if (s === this.host) {
        this.mgr.closeRoom(this, 'hostLeft', 'Der Gastgeber hat den Raum verlassen.');
        return;
      }
      this.clearTimers();
      this.state = 'lobby';
      this.broadcast({ type: S2C.COUNTDOWN, n: -1 });
      this.broadcast({ type: S2C.NOTICE, message: `${s.name} hat den Raum verlassen.` });
      this.broadcastLobby();
    } else if (this.state === 'ended') {
      this.rematch = this.players.map(() => false);
      this.broadcast({ type: S2C.REMATCH, want: this.rematch.slice(), available: false });
      this.broadcast({ type: S2C.NOTICE, message: `${s.name} hat den Raum verlassen.` });
    }
  }

  onDisconnect(s, graceMs) {
    const msg = { type: S2C.PRESENCE, side: s.side, team: this.teamOf[s.side], name: s.name, connected: false, graceLeft: Math.round(graceMs / 1000) };
    for (const p of this.players) if (p && p !== s) p.send(msg);
    this.broadcastLobby();
  }

  onReconnect(s) {
    const msg = { type: S2C.PRESENCE, side: s.side, team: this.teamOf[s.side], name: s.name, connected: true, graceLeft: 0 };
    for (const p of this.players) if (p && p !== s) p.send(msg);
    this.sendState(s);
  }

  /** Zeichen für den Teamkollegen (nur Team-Modi, mit Abklingzeit). */
  mapPing(s, x, y) {
    if (this.state !== 'playing' || this.size <= 2) return { ok: false, code: 'NOT_RUNNING', message: 'Der Kampf läuft gerade nicht.' };
    x = Number(x);
    y = Number(y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > ARENA_W || y > ARENA_H) return { ok: false, code: 'BAD_MESSAGE', message: ERRORS.BAD_MESSAGE };
    const cd = (this.mode.twoVsTwo?.pingCooldown ?? PING_COOLDOWN) * 1000;
    const now = this.mgr.now();
    if (now - (this.pingAt.get(s.side) ?? -Infinity) < cd) return { ok: false, code: 'EMOTE_COOLDOWN', message: 'Zeichen noch nicht bereit.' };
    this.pingAt.set(s.side, now);
    const team = this.teamOf[s.side];
    const msg = { type: S2C.TEAM_PING, seat: s.side, name: s.name, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    this.players.forEach((p, i) => p && this.teamOf[i] === team && p.send(msg));
    return { ok: true };
  }

  /** Vollständigen Zustand an einen (wieder) verbundenen Spieler senden. */
  sendState(s) {
    const seat = s.side;
    switch (this.state) {
      case 'lobby':
      case 'countdown':
        this.broadcastLobby();
        break;
      case 'draft':
        s.send(this.draftStateFor(seat));
        break;
      case 'reveal':
        s.send(this.draftStateFor(seat));
        s.send({ type: S2C.DRAFT_REVEAL, decks: this.draftDecks, names: this.players.map((p) => (p ? p.name : '—')), teams: this.teamOf, seconds: 2 });
        break;
      case 'loading':
        s.send(this.matchInitFor(seat));
        break;
      case 'playing':
        s.send({ ...this.matchInitFor(seat), resume: true });
        s.send({ type: S2C.MATCH_START, resume: true });
        break;
      case 'ended':
        if (this.lastResult) s.send(this.resultFor(seat));
        break;
    }
  }
}
