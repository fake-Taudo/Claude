// Modus „Chaos“ auf dem Server: Laden der Daten und die Auswahlrunden eines Kampfs.
//
// PerkRounds kennt nur die Simulation (Spielzeit, Decks, Perks) und einen eigenen Zufallsgenerator – keine Uhr,
// keine Nachrichten. Der Raum (server/rooms.js) hält die Simulation an, setzt die Frist auf der Wanduhr, nimmt
// Wahlen entgegen und verschickt die Nachrichten. So lässt sich der Ablauf ohne Netz und Timer testen.
//
// Ablauf einer Runde: due() nach jedem Tick prüfen → start() würfelt die Angebote → pick()/autoPick() je Spieler
// → finish() legt die Perks auf die Matchkopie (match.assignPerk) und gibt den Rundeneintrag zurück.
import fs from 'node:fs';
import { createChaos, makeOffer, roundSchedule } from '../shared/chaos.js';
import { PERK_REJECTS } from '../shared/protocol.js';
import { mulberry32 } from './sim/rng.js';

const fileCache = new Map();
/** chaos.json + chaos_perks.json von der Platte (Standard, wenn der Aufrufer nichts übergibt – z. B. in Tests). */
export function loadChaos(db = null, root = new URL('../data/', import.meta.url)) {
  const key = String(root);
  if (!fileCache.has(key)) {
    const read = (f) => fs.readFileSync(new URL(f, root), 'utf8');
    fileCache.set(key, { chaosText: read('chaos.json'), perksText: read('chaos_perks.json') });
  }
  const { chaosText, perksText } = fileCache.get(key);
  const chaos = createChaos(JSON.parse(chaosText), JSON.parse(perksText), db);
  return Object.assign(chaos, { chaosText, perksText });
}

const fail = (code) => ({ ok: false, code, message: PERK_REJECTS[code] });

export class PerkRounds {
  /**
   * @param {object} chaos – createChaos()
   * @param {object} match – laufende Simulation (Spielzeit, Phase, Decks, assignPerk)
   * @param {object} [o] { seed }
   */
  constructor(chaos, match, { seed = 1 } = {}) {
    this.chaos = chaos;
    this.cfg = chaos.config;
    this.m = match;
    this.rng = mulberry32(seed);
    this.times = roundSchedule(this.cfg);
    this.next = 0;
    this.current = null;
    this.history = [];
  }

  get total() {
    return this.times.length;
  }

  /** Ist (nach einem abgeschlossenen Tick) eine Runde fällig? Rundenindex oder -1. */
  due() {
    const m = this.m;
    if (this.current || m.result || this.next >= this.times.length) return -1;
    if (m.time + 1e-9 < this.times[this.next]) return -1;
    // Die letzte Runde gibt es nur in der Verlängerung (sonst entfällt sie ersatzlos)
    if (this.next === this.times.length - 1 && this.cfg.lastRoundOvertimeOnly && m.phase !== 'overtime') return -1;
    return this.next;
  }

  /**
   * Runde starten: Angebote für jeden Spieler würfeln. Gibt die laufende Runde zurück – oder null, wenn kein
   * Spieler mehr eine perk-freie Karte hat (dann entfällt die Runde ganz, ohne Pause).
   */
  start(index) {
    const m = this.m;
    const offers = m.players.map((p, pl) => makeOffer(this.chaos, p.deck, m.perks[pl], index, this.rng));
    this.next = index + 1;
    if (offers.every((o) => !o)) {
      this.history.push({ index, skipped: true, offers, picks: offers.map(() => null), auto: offers.map(() => false) });
      return null;
    }
    this.current = { index, offers, picks: offers.map(() => null), auto: offers.map(() => false) };
    return this.current;
  }

  /** Spieler, die in der laufenden Runde noch wählen müssen. */
  pending() {
    const c = this.current;
    if (!c) return [];
    return c.offers.map((o, i) => (o && !c.picks[i] ? i : -1)).filter((i) => i >= 0);
  }

  get done() {
    return !!this.current && this.pending().length === 0;
  }

  /** Wahl eines Spielers prüfen und merken (nur einer der zwei angebotenen Perks). */
  pick(seat, perkId) {
    const c = this.current;
    if (!c) return fail('NO_ROUND');
    const offer = c.offers[seat];
    if (!offer) return fail('NO_ROUND');
    if (c.picks[seat]) return fail('ALREADY_PICKED');
    if (typeof perkId !== 'string' || !offer.includes(perkId)) return fail('PERK_NOT_OFFERED');
    c.picks[seat] = perkId;
    return { ok: true };
  }

  /** Zeit abgelaufen: der Server wählt zufällig zwischen den zwei Angeboten. */
  autoPick(seat) {
    const c = this.current;
    if (!c || !c.offers[seat] || c.picks[seat]) return null;
    const offer = c.offers[seat];
    c.picks[seat] = offer[Math.floor(this.rng() * offer.length)];
    c.auto[seat] = true;
    return c.picks[seat];
  }

  /** Runde beenden: fehlende Wahlen zufällig ergänzen, Perks auf die Matchkopie legen. */
  finish() {
    const c = this.current;
    if (!c) return null;
    for (const seat of this.pending()) this.autoPick(seat);
    c.picks.forEach((id, pl) => {
      if (id) this.m.assignPerk(pl, this.chaos.perk(id));
    });
    this.history.push(c);
    this.current = null;
    return c;
  }

  /** Kampf endet mitten in einer Runde (Aufgabe, Abbruch): Runde verwerfen, nichts zuweisen. */
  abort() {
    this.current = null;
  }

  /** Gewählte Perks je Spieler in Rundenfolge: [[{ round, perk, auto }]]. */
  chosen() {
    const out = this.m.players.map(() => []);
    for (const r of this.history) r.picks.forEach((id, pl) => id && out[pl].push({ round: r.index + 1, perk: id, auto: !!r.auto[pl] }));
    return out;
  }
}
