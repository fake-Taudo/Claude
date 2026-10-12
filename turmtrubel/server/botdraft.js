// Draft-Entscheidungen der Bots.
//   Leicht  – überwiegend zufällig.
//   Mittel  – ausgewogene Elixier-Kurve und Rollenmischung (Tank/Win-Condition, Luftabwehr, Zauber, Fläche, Zyklus).
//   Schwer  – zusätzlich Synergien mit eigenen Picks und Konter gegen sichtbare gegnerische Picks (Mega Draft).
// Champion: Mittel/Schwer nehmen ihn, wenn er zum Deck passt – ohne Pflicht, ihn früh zu nehmen.
// Die Champion-Sperre gilt über draft.ruleFor() auch für Bots.
import { cardTraits } from './draft.js';

/** Kandidaten, die der Bot gerade wählen darf. */
function candidates(draft, seat) {
  if (draft.kind === 'triple') return draft.offers[seat].filter((id) => !draft.ruleFor(seat, id));
  return draft.allowedFor(seat);
}

/** Bewertung einer Karte für ein entstehendes Deck (höher = besser). */
export function scoreCard(db, mine, card, { hard = false, opp = [], picksLeft = 8 } = {}) {
  const t = cardTraits(db, card);
  const have = mine.map((id) => cardTraits(db, db.card(id)));
  const count = (p) => have.filter(p).length;
  let s = 1;
  // Rollen, die einem spielbaren Deck fehlen
  if (t.air && count((c) => c.air) < 3) s += 2.2 - count((c) => c.air) * 0.6;
  if (t.spell && count((c) => c.spell) < 2) s += count((c) => c.spell) === 0 ? 2.4 : 1.2;
  if (t.spell && count((c) => c.spell) >= 3) s -= 2;
  if (t.winCon && !count((c) => c.winCon)) s += 2.6;
  if (t.winCon && count((c) => c.winCon) >= 2) s -= 1.5;
  if (t.tank && count((c) => c.tank) >= 2) s -= 1.4;
  if (t.splash && count((c) => c.splash) < 2) s += 0.8;
  if (t.building && !count((c) => c.building) && !count((c) => c.spell)) s += 0.7;
  if (t.building && count((c) => c.building) >= 2) s -= 1.5;
  // Elixier-Kurve: Durchschnitt um 3,5 halten, ein paar günstige Karten für den Zyklus
  const avg = have.length ? have.reduce((a, c) => a + c.elixir, 0) / have.length : 3.5;
  const after = (avg * have.length + t.elixir) / (have.length + 1);
  s -= Math.abs(after - 3.5) * 0.9;
  if (t.elixir <= 2 && count((c) => c.elixir <= 2) < 2) s += 0.8;
  if (t.elixir >= 6 && count((c) => c.elixir >= 6) >= 1) s -= 1.6;
  // Champion: wertvoll, aber nur wenn das Deck dafür noch Platz hat (keine Pflicht für frühe Wahl)
  if (t.cls === 'champion') s += picksLeft <= 4 ? 1.4 : 0.6;
  if (t.cls === 'hero') s += 0.9;
  if (hard) {
    // Synergien: Win-Condition + Unterstützung, Tank + Fernkampf, Zauber gegen Schwärme
    if (t.winCon && count((c) => c.tank)) s += 0.5;
    if (t.air && !t.spell && count((c) => c.tank || c.winCon)) s += 0.5;
    if (t.tank && count((c) => c.air && !c.spell) >= 2) s += 0.6;
    // Konter gegen sichtbare gegnerische Picks
    const ot = opp.map((id) => cardTraits(db, db.card(id)));
    const oFly = ot.filter((c) => c.type === 'troop' && isFlyer(db, c.id)).length;
    const oTank = ot.filter((c) => c.tank || c.winCon).length;
    const oSwarm = ot.filter((c) => (db.card(c.id).count || 1) >= 3).length;
    if (oFly >= 2 && t.air) s += 0.6 * oFly;
    if (oTank >= 2 && (t.building || highDps(db, card))) s += 0.5 * oTank;
    if (oSwarm >= 2 && t.splash) s += 0.5 * oSwarm;
  }
  return s;
}

function isFlyer(db, id) {
  const c = db.card(id);
  if (!c || c.type === 'spell') return false;
  return !!db.unit(db.unitRefOf(c)).flying;
}

function highDps(db, card) {
  if (card.type === 'spell') return false;
  const u = db.unit(db.unitRefOf(card));
  return u.damage / Math.max(0.3, u.hitSpeed || 1) >= 300 || !!u.traits?.ramp;
}

/** Karten-ID, die der Bot wählt (oder null → Auto-Pick). */
export function draftChoice(db, draft, seat, difficulty = 'medium', rng = Math.random) {
  const cands = candidates(draft, seat);
  if (!cands.length) return null;
  const mine = draft.picks[seat];
  if (difficulty === 'easy' && rng() < 0.75) return cands[Math.floor(rng() * cands.length)];
  const hard = difficulty === 'hard';
  const opp = draft.kind === 'mega' ? draft.picks.filter((_, i) => i !== seat).flat() : [];
  const picksLeft = draft.picksLeft(seat);
  let best = null;
  let bestS = -Infinity;
  for (const id of cands) {
    // etwas Rauschen, damit Bots nicht immer gleich draften (Schwer weniger)
    const s = scoreCard(db, mine, db.card(id), { hard, opp, picksLeft }) + (rng() - 0.5) * (hard ? 0.6 : 1.2);
    if (s > bestS) {
      bestS = s;
      best = id;
    }
  }
  return best;
}
