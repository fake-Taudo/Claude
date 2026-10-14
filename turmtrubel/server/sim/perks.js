// Chaos-Perks in der Simulation. Ein Perk gehört genau einer Karte eines Spielers und gilt ab der Wahl bis zum
// Ende des Kampfs. Die Wirkung wird nie auf die gemeinsamen Kartenwerte (db) gelegt, sondern auf Matchkopien.
import { PERK_TIER_CODE } from '../../shared/chaos.js';

export const Perks = {
  /** Perk für die Karte eines Spielers festlegen (nur Karten des eigenen Decks, höchstens ein Perk je Karte). */
  assignPerk(pl, perk) {
    const p = this.players[pl];
    if (!perk || !p || !p.deck.includes(perk.cardId) || this.perks[pl][perk.cardId]) return false;
    this.perks[pl][perk.cardId] = perk;
    this.events.push(['pk', pl, this.db.typeIndex.get(perk.cardId) ?? -1, PERK_TIER_CODE[perk.rarityTier] || 0]);
    return true;
  },

  perkOf(pl, cardId) {
    return (cardId && this.perks[pl]?.[cardId]) || null;
  },

  /** Snapshot-Zusatz „pe“: flach [id, Stufe, …] für Einheiten mit Perk (Abzeichen, Glow bei Episch). */
  perkMarks() {
    const out = [];
    for (const e of this.entities) if (!e.removed && e.perkTier) out.push(e.id, e.perkTier);
    return out;
  },
};
