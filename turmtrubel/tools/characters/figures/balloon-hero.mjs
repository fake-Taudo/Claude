// Ballon als Held – lachsfarbene Zwiebelkuppel mit Fallschirm-Ausleger; neben dem Gnom sitzt ein Skelett-Kadett, der
// mit Fallschirm auf Bodentruppen abspringt (Brief: docs/briefs/balloon-hero.md)
import balloon from "./balloon.mjs";

export default function balloonHero(F) {
  balloon(F, { hero: true });
}
