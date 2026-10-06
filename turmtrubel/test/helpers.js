// Gemeinsame Test-Hilfen
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../shared/cards.js';
import { Match } from '../server/sim/match.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const rawCards = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cards.json'), 'utf8'));
export const baseRules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rules.json'), 'utf8'));
export const db = createDb(rawCards);

export const DECK = ['knight', 'archers', 'golden-knight', 'giant', 'electro-wizard', 'minions', 'fireball', 'zap'];

export function rules(overrides = {}) {
  return { ...structuredClone(baseRules), ...overrides };
}

/** Gestartetes Match mit festen Decks und Seed. */
export function newMatch({ decks = [DECK, DECK], seed = 42, rulesOverride = {} } = {}) {
  const m = new Match({ db, rules: rules(rulesOverride), decks, seed });
  m.started = true;
  return m;
}

export function runSeconds(m, seconds) {
  const n = Math.round(seconds / m.dt);
  for (let i = 0; i < n && !m.result; i++) m.step();
}

export function runUntil(m, pred, maxSeconds = 60) {
  const n = Math.round(maxSeconds / m.dt);
  for (let i = 0; i < n; i++) {
    if (pred()) return true;
    m.step();
  }
  return pred();
}

export function tower(m, side, key, lane = -1) {
  return m.towers.find((t) => t.owner === side && t.towerKey === key && (key === 'king' || t.lane === lane));
}

/** Einheit direkt (ohne Karte/Elixier) aufs Feld setzen. */
export function spawn(m, ref, side, x, y, opts = {}) {
  return m.addEntity(db.unit(ref, !!opts.evo), side, x, y, { deployTime: 0, evo: !!opts.evo, ...opts });
}

/** Karte in einen Handplatz legen und sofort spielbar machen. */
export function forceHand(m, side, slot, cardId, elixir = 10) {
  const p = m.players[side];
  p.hand[slot] = cardId;
  p.handReady[slot] = 0;
  p.elixir = elixir;
}
