// Versioned save format with migrations, defensive sanitising and a text export codec.

import { ACHIEVEMENTS, AURA_BY_ID, BIOME_BY_ID, GAME, ITEM_BY_ID, POTION_BY_ID, REBIRTHS, TIERS } from '../config';
import { CHAIN_BY_ID, QUEST_BY_ID } from './progress';
import type { RngState } from './rng';
import { createInitialState, createStats, SAVE_VERSION, type Buff, type GameState } from './state';

type Raw = Record<string, unknown>;

/** Migrations from version n to n+1. Add an entry whenever SAVE_VERSION is raised. */
export const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  // Version 0 never shipped (the prototype had no save). Kept as the template for
  // future migrations and exercised by the tests.
  0: (raw) => ({ ...raw, version: 1 }),
};

export class SaveError extends Error {}

export function migrate(raw: Raw, migrations = MIGRATIONS, target = SAVE_VERSION): Raw {
  let data = raw;
  let version = typeof data.version === 'number' ? data.version : 0;
  if (version > target) throw new SaveError(`Spielstand stammt aus einer neueren Version (${version}).`);
  while (version < target) {
    const step = migrations[version];
    if (!step) throw new SaveError(`Keine Migration von Version ${version}.`);
    data = step(data);
    version += 1;
    data.version = version;
  }
  return data;
}

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const nonNeg = (v: unknown, fallback = 0): number => Math.max(0, num(v, fallback));
const nonNegInt = (v: unknown, fallback = 0): number => Math.floor(nonNeg(v, fallback));
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const bool = (v: unknown, fallback = false): boolean => (typeof v === 'boolean' ? v : fallback);

function countMap(v: unknown, valid: (id: string) => boolean): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObj(v)) return out;
  for (const [k, n] of Object.entries(v)) {
    const c = nonNegInt(n);
    if (c > 0 && valid(k)) out[k] = c;
  }
  return out;
}

/** Builds a fully valid state from untrusted data. Unknown ids are dropped, numbers clamped. */
export function sanitize(raw: Raw, now: number): GameState {
  const seed = nonNegInt(raw.seed, Math.floor(Math.random() * 2 ** 32)) >>> 0;
  const s = createInitialState(seed, now);
  if (Array.isArray(raw.rng) && raw.rng.length === 4 && raw.rng.every((x) => typeof x === 'number')) {
    s.rng = (raw.rng as number[]).map((x) => x >>> 0) as RngState;
  }
  s.createdAt = num(raw.createdAt, now);
  s.lastActiveAt = Math.min(num(raw.lastActiveAt, now), now);
  s.gold = nonNegInt(raw.gold);
  s.rollCounter = nonNegInt(raw.rollCounter);
  s.rollsSinceRebirth = nonNegInt(raw.rollsSinceRebirth);
  s.auras = countMap(raw.auras, (id) => !!AURA_BY_ID[id]);
  s.potions = countMap(raw.potions, (id) => !!POTION_BY_ID[id]);
  s.items = countMap(raw.items, (id) => !!ITEM_BY_ID[id]);

  if (isObj(raw.discovered)) {
    for (const [id, d] of Object.entries(raw.discovered)) {
      if (!AURA_BY_ID[id] || !isObj(d)) continue;
      s.discovered[id] = { first: num(d.first, now), total: Math.max(1, nonNegInt(d.total, 1)), seen: bool(d.seen, true) };
    }
  }
  if (isObj(raw.locked)) {
    for (const [id, v] of Object.entries(raw.locked)) if (AURA_BY_ID[id] && v === true) s.locked[id] = true;
  }
  const eqA = str(raw.equippedAura);
  s.equippedAura = eqA && s.auras[eqA] ? eqA : null;
  const eqI = str(raw.equippedItem);
  s.equippedItem = eqI && s.items[eqI] && ITEM_BY_ID[eqI].kind === 'equipment' ? eqI : null;

  if (Array.isArray(raw.buffs)) {
    const seen = new Set<string>();
    for (const b of raw.buffs) {
      if (!isObj(b)) continue;
      const source = b.source === 'potion' || b.source === 'item' ? b.source : null;
      const ref = str(b.ref);
      if (!source || !ref) continue;
      if (source === 'potion' ? !POTION_BY_ID[ref] : !ITEM_BY_ID[ref]) continue;
      const id = `${source}:${ref}`;
      if (seen.has(id)) continue;
      const buff: Buff = { id, source, ref };
      if (typeof b.endsAt === 'number' && Number.isFinite(b.endsAt)) buff.endsAt = b.endsAt;
      if (typeof b.rolls === 'number') buff.rolls = nonNegInt(b.rolls);
      if (buff.endsAt === undefined && !buff.rolls) continue;
      seen.add(id);
      s.buffs.push(buff);
    }
  }

  s.rebirth = Math.min(nonNegInt(raw.rebirth), REBIRTHS.length);

  if (isObj(raw.shop)) {
    s.shop.rotation = Math.floor(num(raw.shop.rotation, -1));
    s.shop.bought = countMap(raw.shop.bought, (id) => !!ITEM_BY_ID[id]);
    s.shop.seen = Math.floor(num(raw.shop.seen, -1));
  }

  if (isObj(raw.quests)) {
    s.quests.day = str(raw.quests.day) ?? '';
    if (Array.isArray(raw.quests.daily)) {
      for (const q of raw.quests.daily) {
        if (!isObj(q)) continue;
        const id = str(q.id);
        if (!id || !QUEST_BY_ID[id]) continue;
        s.quests.daily.push({ id, progress: Math.min(nonNeg(q.progress), QUEST_BY_ID[id].target), claimed: bool(q.claimed) });
      }
    }
    if (isObj(raw.quests.chains)) {
      for (const [id, c] of Object.entries(raw.quests.chains)) {
        if (!CHAIN_BY_ID[id] || !isObj(c)) continue;
        s.quests.chains[id] = { level: nonNegInt(c.level), progress: nonNeg(c.progress) };
      }
    }
  }

  if (isObj(raw.achievements)) {
    const valid = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const [id, at] of Object.entries(raw.achievements)) if (valid.has(id) && typeof at === 'number') s.achievements[id] = at;
  }

  const st = createStats();
  if (isObj(raw.stats)) {
    const r = raw.stats;
    for (const key of ['rolls', 'luckyRolls', 'goldEarned', 'goldSpent', 'sold', 'brewed', 'drunk', 'crafted', 'purchases', 'rebirths', 'cutscenes', 'playMs', 'offlineRolls'] as const) {
      st[key] = nonNegInt(r[key]);
    }
    st.bestLuck = Math.max(1, num(r.bestLuck, 1));
    const best = str(r.bestAura);
    st.bestAura = best && AURA_BY_ID[best] ? best : null;
    if (Array.isArray(r.biomesSeen)) st.biomesSeen = [...new Set(r.biomesSeen.filter((b): b is string => typeof b === 'string' && !!BIOME_BY_ID[b]))];
    if (isObj(r.tierCounts)) for (const t of TIERS) st.tierCounts[t.id] = nonNegInt(r.tierCounts[t.id]);
  }
  s.stats = st;

  if (Array.isArray(raw.history)) {
    for (const h of raw.history.slice(0, GAME.reveal.historyLength)) {
      if (isObj(h) && typeof h.aura === 'string' && AURA_BY_ID[h.aura]) s.history.push({ aura: h.aura, at: num(h.at, now), lucky: bool(h.lucky) });
    }
  }

  if (isObj(raw.pendingRoll) && typeof raw.pendingRoll.aura === 'string' && AURA_BY_ID[raw.pendingRoll.aura]) {
    const p = raw.pendingRoll;
    s.pendingRoll = {
      aura: p.aura as string,
      lucky: bool(p.lucky),
      luck: Math.max(1, num(p.luck, 1)),
      biome: str(p.biome) && BIOME_BY_ID[p.biome as string] ? (p.biome as string) : null,
      startedAt: num(p.startedAt, now),
      auto: bool(p.auto),
    };
  }
  s.auto = bool(raw.auto);
  if (isObj(raw.tutorial)) s.tutorial = { done: bool(raw.tutorial.done), step: nonNegInt(raw.tutorial.step) };
  s.version = SAVE_VERSION;
  return s;
}

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string, now: number): GameState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new SaveError('Spielstand ist kein gültiges JSON.');
  }
  if (!isObj(raw)) throw new SaveError('Spielstand hat ein ungültiges Format.');
  return sanitize(migrate(raw), now);
}

// ---------------------------------------------------------------------------
// Export / import codec: PRNG1.<base64 json>.<fnv1a checksum>
// ---------------------------------------------------------------------------

export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeExport(state: GameState): string {
  const json = serialize(state);
  return `${GAME.save.exportPrefix}.${toBase64(json)}.${fnv1a(json)}`;
}

export function decodeExport(code: string, now: number): GameState {
  const parts = code.trim().replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== GAME.save.exportPrefix) throw new SaveError('Das ist kein Planet-RNG-Spielstand-Code.');
  let json: string;
  try {
    json = fromBase64(parts[1]);
  } catch {
    throw new SaveError('Der Code ist beschädigt (Base64).');
  }
  if (fnv1a(json) !== parts[2]) throw new SaveError('Der Code ist beschädigt (Prüfsumme stimmt nicht).');
  return deserialize(json, now);
}
