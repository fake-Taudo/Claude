// Musketierin als Heldin – Ingenieurin in waldgrünem Reitrock mit Werkzeuggürtel und Bauplan-Rolle
// (Brief: docs/briefs/musketeer-hero.md). Gleiche Figur wie die Musketierin (musketeer.mjs), mit Rang-Merkmalen.
import musketeer from './musketeer.mjs';

export default function musketeerHero(F) {
  musketeer(F, { hero: true });
}
