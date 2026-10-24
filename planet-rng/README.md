# Planet RNG

Ein Idle-/Gacha-Spiel im Stil der Roblox-RNG-Spiele (Hauptreferenz: Sol's RNG): Auren rollen,
seltenen Drops hinterherjagen, Tränke brauen, handeln, Rebirths machen und große Funde mit
Cutscenes feiern.

**Spielen:** `planet-rng.html` herunterladen und per Doppelklick öffnen. Die Datei ist komplett
selbstenthalten (Code, Schrift, Sounds), läuft offline auf Handy, Tablet und PC und speichert
den Fortschritt im Browser.

## Steuerung

| Taste | Aktion |
|---|---|
| Leertaste | Rollen (gedrückt halten rollt weiter) |
| A / Q | Auto Roll / Quick Roll an/aus |
| I / C | Inventar / Sammlung (Index) |
| S / F / P | Shop / Aura-Schmiede / Tränke-Werkstatt |
| E / R / U | Aktive Effekte / Rebirth / Quests |
| O | Einstellungen |
| Esc | Schließen |

## Entwicklung

Voraussetzung: Node 20+.

```bash
npm install
npm run dev        # Entwicklungsserver mit Hot Reload
npm run build      # Typecheck + Build -> planet-rng.html (und dist/planet-rng.html)
npm test           # Unit-Tests (Vitest)
npm run e2e        # Playwright-Smoke-Tests gegen dist/planet-rng.html (vorher bauen)
npm run balance    # Balancing-Simulation, schreibt BALANCING.md
npm run vfx:review # Prüfliste aller Aura-Effekte, schreibt docs/vfx/aura-review.md
```

### Aufbau

```
src/config/   Alle Inhalte und Zahlen: Auren (auras.ts), Stufen (tiers.ts), Tränke und Rezepte
              (potions.ts), Shop (shop.ts), Rebirth (rebirth.ts), Biome (biomes.ts),
              Erfolge und Quests (meta.ts), Planet (planet.ts), Timings (game.ts)
src/config/vfx/  Aura-Effekte: eine Spec pro Aura (specs/v0-v2.ts … v6.ts), VFX-Stufen V0–V6
              mit Budgets (tiers.ts), Spec-Format mit Einheiten (types.ts)
src/render/vfx/  Schicht-Engine der Aura-Effekte: Instanzen, Slots, Licht (core.ts), Schichttypen
              (layers.ts, particles.ts), gebackene Texturen (tex.ts, sigil.ts), Heroes je Aura
              (heroes/), Bühnenbehandlung und Kamera (renderer.ts)
src/core/     Reine Spiellogik ohne DOM: Zufall, Roll-Modell, Modifikatoren, Aktionen,
              Shop-Rotation, Biome, Quests, Offline-Nachholen, Speicherformat, Formatierung
src/store/    Zustand, Event-Bus, Persistenz, Einstellungen, UI-Zustand
src/game/     Roll-Ablauf (manuell/Auto/Quick, Cutscene-Sperre), Zeit- und Seiten-Lebenszyklus
src/render/   Canvas: Hintergrund und Biome, Planet, Aura-VFX, Roll-Effekte, Cutscenes
src/audio/    Web Audio: Samples, prozedurale Effekte, Ambient-Musik
src/ui/       Preact-Oberfläche (rendert reaktiv aus dem Zustand)
tests/        Unit-Tests      e2e/  Playwright      scripts/  Balancing + Entwickler-Helfer
```

### Zahlen anpassen

Alle Werte stehen in `src/config/`. Beispiele:

- Chance einer Aura: `odds` in `auras.ts` („1 in X“). Die Normierung auf 100 % passiert
  automatisch (Staub erhält den Rest).
- Verkaufspreis: `sell` in `auras.ts`. Shop-Preise und Erscheinungschancen: `shop.ts`.
- Trank-Rezepte und Wirkungen: `potions.ts`. Schmiede-Rezepte: `RECIPES` in derselben Datei.
- Rebirth-Kosten und Multiplikatoren: `rebirth.ts`.
- Roll-Dauer, Auto-Faktor, Glücks-Roll: `game.ts`.
- Cutscenes: eine Definition je Aura in `src/config/cutscenes/` (`t1.ts`, `t2.ts`, `t3.ts`).
  Jede Zeile ist ein Track: Startzeit `t`, Dauer `dur`, Baustein und Parameter (Zeiten in s,
  Größen in u = 1 % der kurzen Bildschirmseite). „Puls schneller“ ist z. B. `interval` der
  `DoublePulse`-Zeile, „Schwarzphase 1 s kürzer“ `motifAt` in `T1_TIMES` (`template.ts`).
  Stufen-Schwellen, Skip-Zeiten und Flash-Limit: `constants.ts`; Kreis-Stern-Tempo und
  -Größe weiterhin in `GAME.cutscene`.

- Aura-Optik: die Spec der Aura in `src/config/vfx/specs/` (Größen in D = Planetendurchmesser,
  Drehungen in °/s, Zeiten in s). Budgets je Stufe in `src/config/vfx/tiers.ts`. Eine neue Aura
  braucht nur eine Spec; ein eigenes Hero-Motiv kommt nach `src/render/vfx/heroes/`.

Nach einer Änderung `npm test` und `npm run balance` laufen lassen (bei Aura-Optik zusätzlich
das Aura-Labor und `npm run vfx:review`).

### Entwickler-Helfer

`scripts/dev/` enthält Playwright-Skripte für Screenshots und Prüfungen (immer aus diesem
Ordner heraus und nach `npm run build` starten), z. B.:

- `node scripts/dev/gallery.mjs <ordner>`: jede Aura auf der Bühne fotografieren
- `node scripts/dev/cutscene-sheet.mjs docs/cutscenes`: Kontaktbögen aller Cutscenes
  (0/10/25/50/75/90/100 %) und der Vergleichsbogen; `npx tsx scripts/cutscene-review.ts`
  schreibt die Checkliste `docs/cutscenes/cutscene-review.md`
- `node scripts/dev/cutscene-check.mjs <aus.json>`: deckt jede Cutscene das Spiel vollständig
  ab, und was kostet ein Bild je Qualität; `cutscene-profile.mjs <id> <zeiten>`: Kosten je Track
- `node scripts/dev/cutscene-soak.mjs 18`: viele Cutscenes hintereinander (Speicher, Canvas)
- `node scripts/dev/echo-shot.mjs <ordner>`: Nachhall auf der Bühne nach T1/T2/T3
- `node scripts/dev/panels.mjs <ordner> 844 390 land`: alle Menüs in einer Bildschirmgröße
- `node scripts/dev/soak.mjs 5`: Dauerlauf mit Auto Roll und wechselnden Auren (Speicher,
  Bildrate, Textur-Cache, Fehler)
- `node scripts/dev/lab-shot.mjs <ordner> urlicht,seraph [390x844] [high] [accent|intro:1.2]`:
  deterministische Bilder aus dem Aura-Labor (`CLOCK=…` für einen anderen Zeitpunkt)
- `node scripts/dev/contact-sheet.mjs <bild.png>`: Kontaktbogen aller Auren
  (`HTML=…` für einen anderen Build, z. B. den alten Stand aus Git)
- `node scripts/dev/perf.mjs <aus.json>`: Kosten je Aura und Qualität und Equip-Zeit
  (`docs/vfx/perf.json` wird von `npm run vfx:review` in die Prüfliste übernommen)
- `node scripts/dev/layer-cost.mjs urlicht`: Kosten je Schicht einer Aura
- `node scripts/dev/reduced.mjs <ordner>`: Intro und Akzent mit und ohne „Effekte reduzieren“
- `node scripts/dev/quality-check.mjs prisma <ordner>`: VFX-Qualität auf einem emulierten Handy
  (DPR 3): Auflösung, wirksame Effektstufe und Bildzeiten je Einstellung

**Aura-Labor:** `planet-rng.html?lab=1` öffnet ein Labor-Panel: Aura wählen, VFX-Stufe und
Qualität umschalten, Intro wiederholen, Akzent auslösen, Schichten einzeln an/aus, Hintergrund
hell/dunkel, FPS und Partikelzahl. Der Speicherstand bleibt dabei unverändert.

**Cutscene-Labor:** `planet-rng.html?cutscene=<id>` (z. B. `?cutscene=omniversum`): Cutscene
wählen und abspielen, Zeitleiste mit Scrubber und Markern (Beats blau, Blitze rot, Bruch gelb,
Enthüllung weiß), Tempo 0,25× bis 2×, Tracks einzeln an/aus, Qualität, Hintergrund
dunkel/hell/Spiel, Ton (bei 1×), FPS, Partikel und Blitze pro Sekunde. Nur über die URL
erreichbar; der Speicherstand bleibt unverändert.

## Dokumente

- [DECISIONS.md](DECISIONS.md): alle Entscheidungen, wo die Vorgabe offen war
- [BALANCING.md](BALANCING.md): Verteilung, Gold pro Stunde, Spieler-Simulation, Tränke
- [ABSCHLUSSBERICHT.md](ABSCHLUSSBERICHT.md): was gebaut ist und was offen bleibt
- [PLAN.md](PLAN.md): Architektur und Phasen
- [docs/vfx/aura-review.md](docs/vfx/aura-review.md): Prüfliste der Aura-Effekte je Aura
- [docs/cutscenes/cutscene-review.md](docs/cutscenes/cutscene-review.md): Checkliste und
  Kontaktbögen aller Cutscenes
