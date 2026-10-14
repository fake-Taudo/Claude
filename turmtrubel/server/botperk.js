// Perk-Wahl der Bots im Modus „Chaos“ (zwei Angebote je Runde).
//   Leicht  – wählt zufällig.
//   Mittel  – bevorzugt statBoost und spawnChange (sicherer, sofort spürbarer Wert) und die aktuell wichtigste Rolle
//             des eigenen Decks (Win-Condition vor Tank vor dem Rest), dann die höhere Seltenheit.
//   Schwer  – bewertet Seltenheit, Mechanik-Kategorie (je Stufe), die balanceNote (Stichwörter für Stärke bzw.
//             Einschränkungen) und die Lage im Kampf: Rückstand bei den Türmen → Angriffskarten, gegnerische
//             Flieger auf dem Feld → Karten mit Luftabwehr, viele gegnerische Einheiten → Flächenschaden,
//             Karte gerade auf der Hand → wirkt früher.
import { cardTraits } from './draft.js';

const TIER_VALUE = { common: 1, rare: 2, epic: 3 };
const STRONG = /(stark|deutlich|enorm|riesig|gewaltig|doppelt|dreifach|verdoppelt|verdreifacht|spektakul|wow)/gi;
const LIMITED = /(konterbar|aber |nur |schwächer|langsamer|nachteil|kein |keine |weniger )/gi;

/** Bewertung der balanceNote: Stichwörter für Stärke zählen positiv, Einschränkungen leicht negativ. */
export function noteScore(note) {
  const s = String(note || '');
  return Math.min(3, (s.match(STRONG) || []).length) * 0.5 - Math.min(4, (s.match(LIMITED) || []).length) * 0.25;
}

/** Wie wichtig ist eine Karte gerade für das eigene Deck (Mittel)? */
function roleWeight(t) {
  if (t.winCon) return 3;
  if (t.tank) return 2;
  if (t.special) return 1.6;
  if (t.splash || t.air) return 1.2;
  return 0.6 + t.elixir * 0.15;
}

/** Lage im Kampf aus Sicht des Spielers `seat` (nur sichtbare Informationen). */
function situation(match, seat) {
  const team = match.teamOf[seat];
  const towerHp = [0, 0];
  for (const t of match.towers) if (!t.dead) towerHp[t.owner] += t.hp / t.maxHp;
  let air = 0;
  let foes = 0;
  for (const e of match.entities) {
    if (e.dead || e.owner === team || e.kind !== 'unit' || match.isHidden?.(e)) continue;
    foes++;
    if (e.flying) air++;
  }
  return { behind: towerHp[team] + 0.25 < towerHp[1 - team], ahead: towerHp[team] > towerHp[1 - team] + 0.25, air, foes };
}

export function perkScore(chaos, match, seat, perk, difficulty) {
  const card = match.db.card(perk.cardId);
  const t = cardTraits(match.db, card);
  let s = TIER_VALUE[perk.rarityTier] * 10;
  if (difficulty === 'medium') {
    if (perk.mechanicType === 'statBoost' || perk.mechanicType === 'spawnChange') s += 4;
    return s + roleWeight(t);
  }
  // Schwer
  const epic = perk.rarityTier === 'epic';
  s += epic ? (perk.mechanicType === 'newAbility' || perk.mechanicType === 'behaviorChange' ? 3 : 2) : perk.mechanicType === 'statBoost' || perk.mechanicType === 'spawnChange' ? 2.5 : 1.5;
  s += noteScore(perk.balanceNote);
  const sit = situation(match, seat);
  if (sit.behind && (t.winCon || t.tank)) s += 2.5;
  if (sit.ahead && (t.building || t.air || t.splash)) s += 1;
  if (sit.air >= 2 && t.air) s += 1.5;
  if (sit.foes >= 6 && t.splash) s += 1.5;
  const p = match.players[seat];
  if (p.hand.includes(card.id) || p.queue[0] === card.id) s += 0.8;
  s += roleWeight(t) * 0.5;
  return s;
}

/** Perk aus dem Angebot wählen (Perk-ID). */
export function choosePerk(chaos, match, seat, options, difficulty, rng) {
  if (!options || !options.length) return null;
  if (difficulty === 'easy') return options[Math.floor(rng() * options.length)];
  let best = null;
  let bestS = -Infinity;
  for (const id of options) {
    const perk = chaos.perk(id);
    if (!perk) continue;
    const s = perkScore(chaos, match, seat, perk, difficulty) + rng() * 0.01;
    if (s > bestS) {
      bestS = s;
      best = id;
    }
  }
  return best || options[0];
}
