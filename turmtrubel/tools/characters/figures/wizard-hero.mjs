// Magier als Held – großspuriger Feuermagier in fuchsiafarbener Robe mit Flammenumhang, der sich zu Feuerflügeln öffnet
// (Brief: docs/briefs/wizard-hero.md). Gleiche Figur wie der Magier (wizard.mjs), mit Rang-Merkmalen.
import wizard from './wizard.mjs';

export default function wizardHero(F) {
  wizard(F, { hero: true });
}
