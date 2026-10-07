// Walküre als Heldin – Sturmflügelhelm mit großen goldenen Schwingen, Windbänder an Helm und Radaxt
// (Brief: docs/briefs/valkyrie-hero.md). Gleiche Figur wie die Walküre (valkyrie.mjs), mit Rang-Merkmalen.
import valkyrie from './valkyrie.mjs';

export default function valkyrieHero(F) {
  valkyrie(F, { hero: true });
}
