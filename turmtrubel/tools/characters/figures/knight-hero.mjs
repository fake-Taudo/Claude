// Ritter als Held – roségoldene Rüstung, Löwenmähnen-Kragen mit Heldenumhang, Goldkamm, Krone auf dem Zinnenschild
// (Brief: docs/briefs/knight-hero.md). Gleiche Figur wie der Ritter (knight.mjs), mit Rang-Merkmalen.
import knight from './knight.mjs';

export default function knightHero(F) {
  knight(F, { hero: true });
}
