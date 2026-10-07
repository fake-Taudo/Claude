// Magieschütze als Held – Sternbild-Mantel mit drei leuchtenden Pfeilsternen, Drei-Sehnen-Bogen, Lockvogel-Form
// (Brief: docs/briefs/magic-archer-hero.md). Gleiche Figur wie der Magieschütze (magic-archer.mjs), mit Rang-Merkmalen.
import magicArcher from './magic-archer.mjs';

export default function magicArcherHero(F) {
  magicArcher(F, { hero: true });
}
