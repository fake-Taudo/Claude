// Lokale Speicherung (localStorage): Name, Einstellungen, Deck-Slots.
import { validateDeck } from '/shared/cards.js';
import { STARTER_DECKS } from '/shared/decks.js';

const KEY = 'turmtrubel.v1';
export const DECK_SLOTS = 5;

export const DEFAULT_SETTINGS = Object.freeze({
  music: true,
  sfx: true,
  musicVol: 0.5,
  sfxVol: 0.8,
  quality: 'high',
  orientation: 'auto',
  dmgNumbers: true,
  showPing: true,
  // Neu (UI-Überarbeitung) – nur mit Default ergänzt, bestehende Keys unverändert
  muteEmotes: false,
  haptics: true,
});


export class Store {
  constructor(db) {
    this.db = db;
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch {
      data = {};
    }
    this.name = typeof data.name === 'string' ? data.name : '';
    this.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
    this.decks = [];
    this.resetDecks = 0;
    for (let i = 0; i < DECK_SLOTS; i++) {
      const saved = data.decks?.[i];
      const starter = STARTER_DECKS[i % STARTER_DECKS.length];
      const valid = Array.isArray(saved?.slots) && saved.slots.length === 8;
      // Decks mit Karten, die es nicht (mehr) gibt (z. B. die früheren erfundenen Karten), komplett auf das Startdeck zurücksetzen
      const stale = valid && saved.slots.some((id) => id && !db.card(id));
      if (stale) this.resetDecks++;
      const slots = valid && !stale ? saved.slots.slice() : starter.slots.slice();
      const name = !stale && typeof saved?.name === 'string' ? saved.name.slice(0, 20) : starter.name;
      this.decks.push({ name, slots });
    }
    this.active = Number.isInteger(data.active) && data.active >= 0 && data.active < DECK_SLOTS ? data.active : 0;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ name: this.name, settings: this.settings, decks: this.decks, active: this.active }));
    } catch {
      /* Speicher voll oder gesperrt – ignorieren */
    }
  }

  activeDeck() {
    return this.decks[this.active];
  }

  deckValid(i = this.active) {
    return validateDeck(this.db, this.decks[i].slots).ok;
  }
}
