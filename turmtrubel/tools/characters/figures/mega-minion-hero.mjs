// Megalakai als Held – Visierhelm mit goldenem Heldenstern, Goldgravur auf dem Steinbauch; Fähigkeit: Teleport-Sprung
// zum schwächsten Gegner (Brief: docs/briefs/mega-minion-hero.md)
import megaMinion from "./mega-minion.mjs";

export default function megaMinionHero(F) {
  megaMinion(F, { hero: true });
}
