// Eismagier als Held – großväterlicher Zauberer mit Schneemann-Gehilfen auf der Schulter; in seiner Schneekugel tanzt ein Schneemann
// (Brief: docs/briefs/ice-wizard-hero.md). Gleiche Figur wie der Eismagier (ice-wizard.mjs), mit Rang-Merkmalen.
import iceWizard from './ice-wizard.mjs';

export default function iceWizardHero(F) {
  iceWizard(F, { hero: true });
}
