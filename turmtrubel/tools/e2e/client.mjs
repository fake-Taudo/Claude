// Automatischer Test-Client: verbindet sich per WebSocket mit dem Server und spielt einen kompletten
// Kampf wie ein Mensch (nur über das normale Protokoll: create/join/ready/loaded/play/ability).
// Er wählt bevorzugt Karten, die er noch nicht gespielt hat, damit möglichst viele Mechaniken drankommen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import { createDb } from '../../shared/cards.js';
import { ARENA_W, ARENA_H } from '../../shared/arena.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadDb() {
  const cards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
  const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
  return createDb(cards, { level: rules.cardLevel });
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Positionen aus Sicht von Spieler 0 (unten); für Spieler 1 wird gespiegelt. */
const SPOTS = {
  troop: [[3.5, 19], [14.5, 19], [9, 21], [6, 24]],
  building: [[9, 22], [7, 21], [11, 21]],
  anywhere: [[3.5, 10], [14.5, 10], [9, 11]],
  ownSpell: [[3.5, 18.5], [14.5, 18.5], [9, 20]],
  enemySpell: [[3.5, 6.5], [14.5, 6.5], [9, 9]],
};

export class TestClient {
  constructor({ url, name, deck, db, seed = 1, log = null }) {
    this.url = url;
    this.name = name;
    this.deck = deck;
    this.db = db;
    this.rand = rng(seed);
    this.log = log;
    this.msgs = [];
    this.waiters = [];
    this.played = new Map(); // Karten-ID → Anzahl
    this.evoPlayed = new Set();
    this.abilities = new Set();
    this.rejects = new Map(); // Code → Anzahl
    this.spotIdx = new Map(); // Karten-ID → nächste Ausweichposition
    this.nextAct = 0;
    this.nextAbility = 0;
    this.seq = 0;
    this.pending = new Map(); // seq → Karte
    this.side = -1;
    this.types = [];
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.on('message', (d) => this.onMessage(JSON.parse(d)));
    return new Promise((res, rej) => {
      this.ws.on('open', res);
      this.ws.on('error', rej);
    });
  }

  send(o) {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(o));
  }

  wait(pred, ms = 10000) {
    const found = this.msgs.find(pred);
    if (found) return Promise.resolve(found);
    return new Promise((res, rej) => {
      const w = { pred, res };
      w.timer = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        rej(new Error(`${this.name}: Zeitüberschreitung beim Warten`));
      }, ms);
      this.waiters.push(w);
    });
  }

  onMessage(m) {
    if (m.type !== 's') this.msgs.push(m);
    for (const w of [...this.waiters]) {
      if (w.pred(m)) {
        this.waiters.splice(this.waiters.indexOf(w), 1);
        clearTimeout(w.timer);
        w.res(m);
      }
    }
    if (m.type === 'matchInit') {
      this.side = m.side;
      this.types = m.types;
      this.send({ type: 'loaded' });
    } else if (m.type === 's') this.onSnapshot(m);
    else if (m.type === 'reject') {
      this.rejects.set(m.code, (this.rejects.get(m.code) || 0) + 1);
      const card = this.pending.get(m.seq);
      if (card && m.code === 'PLACEMENT') this.spotIdx.set(card, (this.spotIdx.get(card) || 0) + 1);
    }
  }

  /** Spiegelt eine Position aus Sicht von Spieler 0 auf die eigene Seite (gleiche Lane, damit sich die Truppen begegnen). */
  mine([x, y]) {
    return this.side === 0 ? [x, y] : [x, ARENA_H - y];
  }

  spotFor(card) {
    const db = this.db;
    let kind;
    if (card.type === 'spell') {
      const s = card.spell;
      if (s.ownSide) kind = 'ownSpell';
      else if (s.clone || (s.rage && !s.spawn) || s.mirror) kind = 'ownSpell';
      else kind = 'enemySpell';
    } else {
      const def = db.unit(db.unitRefOf(card));
      kind = def.traits.deployAnywhere ? 'anywhere' : card.type === 'building' ? 'building' : 'troop';
    }
    const list = SPOTS[kind];
    const i = (this.spotIdx.get(card.id) || 0) % list.length;
    return this.mine(list[i]);
  }

  onSnapshot(s) {
    // Eigene Ausspiel-/Fähigkeits-Ereignisse mitzählen (so, wie der Server sie bestätigt)
    for (const ev of s.ev || []) {
      if (ev[0] === 'pl' && ev[1] === this.side) {
        const id = this.types[ev[2]];
        this.played.set(id, (this.played.get(id) || 0) + 1);
        if (ev[5]) this.evoPlayed.add(id);
      } else if (ev[0] === 'ab' && ev[2] === this.side) {
        this.abilities.add(this.types[ev[4]]);
      }
    }
    const me = s.me;
    if (!me || s.t < this.nextAct) return;
    // Fähigkeit nutzen, sobald möglich
    if (me.ab && me.ab.u > 0 && !me.ab.dep && !(me.ab.cd > 0) && me.el >= me.ab.cost && s.t >= this.nextAbility) {
      this.send({ type: 'ability', seq: ++this.seq });
      this.nextAbility = s.t + 2;
      this.nextAct = s.t + 0.4;
      return;
    }
    // Karte wählen: zuerst noch nie gespielte (notfalls Elixier dafür sparen), sonst zufällig unter den bezahlbaren
    const options = [];
    let waitingForFresh = false;
    for (let i = 0; i < me.h.length; i++) {
      const id = me.h[i];
      const card = this.db.card(id);
      if (!card || me.hr[i] > 0) continue;
      const cost = me.hc?.[i] ?? (card.elixirRule === 'mirror' ? null : card.elixir);
      if (cost == null) continue;
      const fresh = !this.played.has(id);
      if (cost > me.el + 1e-6) {
        if (fresh) waitingForFresh = true;
        continue;
      }
      const eff = card.elixirRule === 'mirror' ? this.db.card(me.lp) : card;
      if (!eff) continue;
      options.push({ i, id, eff, fresh });
    }
    const fresh = options.filter((o) => o.fresh);
    if (!options.length || (!fresh.length && waitingForFresh && me.el < 9.5)) {
      this.nextAct = s.t + 0.3;
      return;
    }
    const pool = fresh.length ? fresh : options;
    const pick = pool[Math.floor(this.rand() * pool.length)];
    const [x, y] = this.spotFor(pick.eff);
    const seq = ++this.seq;
    this.pending.set(seq, pick.eff.id);
    this.send({ type: 'play', slot: pick.i, card: pick.id, x, y, seq });
    this.nextAct = s.t + 0.6 + this.rand() * 1.2;
  }

  summary() {
    return {
      name: this.name,
      played: Object.fromEntries(this.played),
      evo: [...this.evoPlayed],
      abilities: [...this.abilities],
      rejects: Object.fromEntries(this.rejects),
    };
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* egal */
    }
  }
}

/** Zwei Test-Clients spielen einen kompletten Kampf gegeneinander. Ergebnis: matchEnd + Protokoll beider Seiten. */
export async function playMatch({ port, decks, seed = 1, timeoutMs = 120000 }) {
  const db = loadDb();
  const url = `ws://127.0.0.1:${port}/ws`;
  const a = new TestClient({ url, name: 'Testclient A', deck: decks[0], db, seed: seed * 2 + 1 });
  const b = new TestClient({ url, name: 'Testclient B', deck: decks[1], db, seed: seed * 2 + 2 });
  await a.connect();
  await b.connect();
  try {
    a.send({ type: 'hello', name: a.name });
    b.send({ type: 'hello', name: b.name });
    await a.wait((m) => m.type === 'welcome');
    await b.wait((m) => m.type === 'welcome');
    a.send({ type: 'create', deck: a.deck });
    const lobby = await a.wait((m) => m.type === 'lobby' && m.code);
    b.send({ type: 'join', code: lobby.code, deck: b.deck });
    await a.wait((m) => m.type === 'lobby' && m.players?.[1]);
    a.send({ type: 'ready', ready: true });
    b.send({ type: 'ready', ready: true });
    const [endA, endB] = await Promise.all([a.wait((m) => m.type === 'matchEnd', timeoutMs), b.wait((m) => m.type === 'matchEnd', timeoutMs)]);
    return { result: endA, resultB: endB, sides: [a.summary(), b.summary()] };
  } finally {
    a.close();
    b.close();
  }
}
