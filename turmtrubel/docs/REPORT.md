# Bericht: Visuelles Upgrade (Vektor-Look, VFX, Game-UI)

Stand: 7. Oktober 2026 · Branch `claude/1v1-card-game-browser-l8fwez` · Commits `3ac0793` bis zum Commit dieses Berichts.

Grundlagen: [`AUDIT.md`](AUDIT.md) (Ausgangslage), [`COMPARISON.md`](COMPARISON.md) (Referenz-Vergleich), [`STYLE_GUIDE.md`](STYLE_GUIDE.md) (Designsystem und Schnittstellen), [`vfx-katalog/`](vfx-katalog/) (alle Effekte als Kontaktbögen), [`before_after/`](before_after/) (Vorher/Nachher-Bilder und Messwerte).

## Kurzfassung

- **Spiellogik unangetastet.** `server/`, `shared/protocol.js`, `shared/arena.js`, `data/cards.json` und `data/rules.json` sind seit Beginn des Upgrades unverändert. Einzige Änderung in `shared/`: `applySkin` reicht zwei neue, rein optische Skin-Felder durch (`archetype`, `fx`). Alle Effekte werden clientseitig aus den bestehenden Ereignissen abgeleitet, es gibt keine neuen Protokoll-Ereignisse.
- **Ein Vektor-Look für alles:** Licht von oben links, Glanz, dunkle Außenkontur, Rim-Light, weicher Schatten, als zentrales Licht-Modell im Zeichen-Primitiv. Figuren, Gebäude, Türme, HUD, Icons und DOM-Screens folgen denselben Tokens.
- **VFX-Engine** mit Objekt-Pool, Prioritäten, additivem Blending, Spuren, Shockwaves, Decals, Glows, Blitzen, Schadenszahlen, Hit-Stop und Wackeln mit Regler. 99 JSON-Presets in drei Zeitstufen (Vorlauf, Kern, Nachhall).
- **Game-UI:** Kartenhand mit Seltenheitsrahmen und Elixier-Fortschritt, Flüssigkeits-Elixierleiste, Timer-Box, Kronen-Plaketten, neue Türme mit Schadenstufen, Lebensbalken mit weißem Nachzieher, Emote-Leiste, Phasen-Banner. Dazu DOM-Screens in Nachtblau mit mehrstufigen 3D-Knöpfen, eigenem SVG-Icon-Set, Drag-and-Drop im Deck-Bauer, Kartendetail mit Reitern und Ergebnis mit Kronen-Kissen.
- **Performance:** Trotz deutlich mehr Details läuft die Extremszene schneller als vorher (Zahlen in Abschnitt 4). Das liegt an Sprite-Cache, statischer Hintergrund-Ebene, Partikel-Pool und dynamischer Qualität. Die Zielwerte für Mittelklasse-Handys (60 FPS, mindestens 30 FPS) sind in dieser Testumgebung **nicht nachweisbar**, weil sie keine GPU hat (siehe Einschränkungen).
- **Tests:** 276 Unit- und Integrationstests grün (neu: VFX, Manifest, Skin-Erweiterung). Dazu ein neuer Browser-Mehrspielertest: zwei echte Clients spielen ganze Kämpfe inklusive Verlängerung, ohne Konsolenfehler und ohne Desync.

## 1. Umbauten pro Phase

### Phase 1: Audit (`docs/AUDIT.md`)

- Dateibaum, Render-Schichten, Inventar aller Zeichenroutinen (23 Körper, 20 Waffen, 19 Hüte, 12 Gebäude) und vorhandene Effekte.
- Performance-Basis mit eigenem Werkzeug (`tools/bench/`): deterministische Extremszene mit bis zu 222 Entitäten, CPU-Drosselung, Long Tasks, Zeichenaufrufe.
- 75 Vorher-Screenshots in drei Formaten und 38 Szenenbilder (`docs/before_after/before/`), neun benannte visuelle Schwächen, Risiken und Gegenmaßnahmen.

### Phase 2: Vergleich (`docs/COMPARISON.md`, `docs/STYLE_GUIDE.md`)

- Referenz-Screenshots nur als Orientierung für Layout, Proportionen, Hierarchie, Farblogik und Timing. Es wurden keine Assets übernommen, alles ist neu als Vektor gezeichnet.
- Für Elixierleiste, Emote-Auswahl, Lobby, Einstellungen und das vollständige Hauptmenü gab es keine Referenz. Das ist dort so vermerkt; gestaltet wurde nach dem Style Guide, nicht aus dem Gedächtnis.
- Bewusste Abweichung: Schatten fallen nach unten rechts (Licht von oben links laut Vorgabe), in der Referenz nach unten links.

### Phase 3: Designsystem

- **Tokens** (`client/js/design/tokens.js`, CSS `:root`): Team-, Gold-, Elixier- und Night-Palette, Seltenheiten inklusive Evo, Champion und Held, Effekt-Paletten, Konturen, Radien, Abstände, Z-Ebenen, Licht-Parameter und Qualitätsstufen.
- **Licht-Regel als Code** (`design/light.js`): `LitCtx` umhüllt den Canvas-Kontext und füllt jede Form mit einem Verlauf von oben links nach unten rechts plus Glanz. `finishSprite` ergänzt dicke Außenkontur, Rim-Light unten rechts und ein Gesamtlicht. Weil das im Zeichen-Primitiv `fill()` sitzt, bekommen alle bestehenden Körper, Waffen, Hüte und Gebäude Volumen, ohne einzeln neu geschrieben zu werden.
- **Asset-Pipeline mit Cache** (`design/spritecache.js`): Figuren, Gebäude und Türme werden einmal je Look, Team, Evo, Richtung, Frame, Größe und Qualität gerendert (LRU, 40 MB, höchstens 8 Neubauten bzw. 6 ms pro Frame, `force` im Ladescreen).
- **Archetypen und Animation:** Frames Ruhe, Lauf 1 und 2, Angriff 1 und 2, Betäubt und Schlaf; prozedurales Squash und Stretch beim Kopieren; Rückansicht beim Laufen nach oben (Hochformat), Blickrichtung links und rechts.
- **Asset-Manifest** (`design/manifest.js`) und `skin.json`-Erweiterung (`archetype`, `fx`), abwärtskompatibel.
- **Easing-Bibliothek** (`design/easing.js`), dieselben Kurven als CSS-Variablen.

### Phase 4: VFX

- **Engine** (`client/js/vfx/engine.js`):
  - Objekt-Pool und Prioritäten (Deko wird zuerst verdrängt)
  - drei Ebenen: Boden, normal, additiv
  - Emitter, Spuren, Ringe bzw. Shockwaves, Decals, Glows, Zickzack-Blitze, Flash, Schadenszahlen
  - Wackeln nach Trauma-Modell mit Regler; Hit-Stop als reine Darstellungsverzögerung (Simulation und Eingaben unberührt)
  - optionaler Sound-Hook
- **Texturen** (`vfx/textures.js`): 17 Partikelformen und 7 Decals, prozedural und eingefärbt gecacht.
- **Presets** (`vfx/presets.json`, 99 Stück) in drei Schichten mit Zeitstaffelung, Radius-Skalierung und Teamfarben; beim Start validiert.
- **Katalog:**
  - Ausspielen (Boden, schwer, Luft, Evo)
  - Treffer leicht und schwer
  - Projektil-Spuren und Einschläge
  - alle Zauber
  - Explosionen und Fähigkeiten
  - Tod (Schwärme ab der 7. Figur pro Frame als sparsamer Effekt)
  - Turm-Treffer, -Schadenstufen und -Zerstörung
  - Königs-Erwachen, Elixier
  - Phasen („Kampf!“, Doppel- und Dreifach-Elixier, Verlängerung, Sieg)
  - Ambiente
- Zauberzonen mit Bodenscheibe, Teamring und Runenring.
- Einschläge werden clientseitig erkannt (Projektil-ID verschwindet); es gibt keine neuen Server-Ereignisse.

### Phase 5: UI

- **Arena:** Rand mit Bannern, Gras mit Variation, Fluss mit Steinkante und Wellen, Holzbrücken, Licht-Verlauf und Vignette. Gezeichnet auf eine eigene, statische Hintergrund-Ebene (`#bg-canvas`), die nur bei Größenänderung neu entsteht.
- **Türme:** Steinkörper mit Zinnen, Wappen, Schadenstufen, Trümmern und Königskanone; Figuren mit Schlaf-Pose.
- **Kampf-HUD** (`game/hud.js`, `game/hudart.js`):
  - Kartenhand: Seltenheitsrahmen, Evo-, Champion- und Helden-Marke, Glanzstreifen bei bezahlbaren Karten, Graustufen mit Elixier-Fortschritt von unten, Evo-bereit-Rahmen, Auswahl-Glühen, nächste Karte mit Slide
  - Elixierleiste: 10 Segmente, Flüssigkeit mit Welle, Glanz und Blasen, Pop beim Tropfen, Voll-Glühen, Kosten-Kerbe
  - Timer-Box: rot pulsierend ab 10 s, Multiplikator-Tropfen ×2 bzw. ×3
  - Kronen-Plaketten mit Kronenflug
  - Lebensbalken mit weißem Nachzieher, bei vollem Leben ausgeblendet
  - Emote-Leiste (einzeilig, bei zu wenig Breite 3×2), Phasen-Banner als Band-Schleifen
  - Debug-Overlay auf F3
- **DOM-Screens** in Nachtblau:
  - Panels mit Lichtkante und Mulden, mehrstufige 3D-Knöpfe (Kontur, farbige Lippe, Verlauf, Glanzband) in allen Zuständen inklusive „deaktiviert“ und „lädt“
  - eigenes SVG-Icon-Set (73 Icons) statt Emojis, Reiter, Schalter, Segmente
  - Modal-Pop bzw. Bottom-Sheet, Screen-Übergänge
- **Einzelne Screens:**
  - Hauptmenü mit Arena-Bühne
  - Lobby mit Code-Kacheln, Kopieren-Häkchen und Bereit-Siegel
  - Deck-Bauer mit Drag-and-Drop in und zwischen Plätzen (Einrast-Animation, Zurückfliegen, Entfernen durch Ziehen in die Sammlung)
  - Kartendetail mit Reitern Werte, Evo und Fähigkeit sowie Evo-Vorschau
  - Einstellungen
  - Ergebnis mit Bändern, Kronen-Kissen und gestaffeltem Kronen-Einsprung, Rematch-Status

### Phase 6: Juice

- Zentrale Easing-Kurven in JS und CSS.
- Pop-, Einrast- und Überschwing-Animationen: Karten, Slots, Kronen, Code-Kacheln, Häkchen, Banner, Emote-Knöpfe.
- Hit-Stop bei schweren Treffern, Wackeln mit Abklingen, Flash.
- Sound-Hooks in Presets (Typ `sound`, läuft mit der Zeitstaffelung, z. B. Geröll im Nachhall des Turm-Einsturzes).

### Phase 7: Performance und Barrierefreiheit

- **Performance:**
  - Sprite-Cache; statische Hintergrund-Ebene; Wackeln per CSS-Transform statt Neuzeichnen
  - Text-Sprites; Partikel-Pool mit Budget je Qualität
  - Lebensbalken nur bei Schaden, Abzeichen nur für größere Einheiten
  - Vorrendern von Türmen, VFX-Texturen und den Figuren des eigenen Decks im Ladescreen
- **Dynamische Qualität:** Bei anhaltend langsamen Frames sinken Renderauflösung (DPR 2 → 1,5 → 1,25 → 1) und Effektmenge (bis 40 %); bei flüssigem Lauf steigen sie wieder, mit Hysterese.
- **Einstellungen:** Grafikqualität, automatische Qualität, Effekte reduzieren, Bildschirmwackeln (Regler), Farbenblind-Modus (Gegner-Abzeichen als Schild, gestreifte Gegner-Lebensbalken), Schadenszahlen.
- **`prefers-reduced-motion`:** kein Wackeln, kein Hit-Stop, gedämpfter Flash, keine CSS-Animationen, kein Ambiente.
- **Touch-Ziele** mindestens 44 px; geprüft von `tools/ui-shots.mjs` in jedem Zustand und Format.

### Phase 8: Tests

- **Unit-Tests:** VFX (Presets gültig und vollständig, Zeitstaffelung, Pooling, Lebensdauer, Partikelgrenzen und Prioritäten, Radius-Skalierung, Hit-Stop, reduzierte Bewegung, Effekte reduzieren, Sound-Hook), Manifest und Skin-Erweiterung.
- **E2E-Test:** In `test/e2e.test.js` fehlte das reguläre Kampfende `tiebreak` (Entscheidung nach Turm-LP nach der Verlängerung). Deshalb schlug der Test je nach Timing sporadisch fehl; der Grund ist ergänzt.
- **Neu:** `tools/e2e/browser-match.mjs` (zwei echte Browser-Clients, siehe Abschnitt 4).
- **Selbstprüfung:** mehrere Runden über Screenshots und den VFX-Katalog (`tools/vfx-gallery.mjs`), unter anderem zu Radius-Skalierung, Additiv-Überstrahlung auf hellem Gras, Decal-Stärke, Königsturm-Proportionen und Schwarm-Abzeichen.

## 2. Dateistruktur (neu bzw. wesentlich geändert)

```
client/
  index.html                 #bg-canvas, SVG-Icons statt Emojis, Arena-Bühne im Menü
  css/style.css              Nachtblau-Theme, 3D-Knöpfe, Reiter, Drag-and-Drop, Ergebnis, Bühne
  js/design/
    tokens.js                Farben, Licht-Parameter, Qualitätsstufen (Canvas)
    easing.js                Easing-Bibliothek
    light.js                 Licht-Modell (LitCtx, finishSprite, softGlow, softShadow)
    spritecache.js           LRU-Sprite-Cache mit Bau-Budget pro Frame
    manifest.js              Asset-Manifest
  js/vfx/
    engine.js                VFX-Engine (Pool, Ebenen, Shake, Hit-Stop, Sound-Hook)
    textures.js              Partikel- und Decal-Texturen
    presets.json             99 Effekt-Presets
    presets.js               Laden und Validieren der Presets
  js/game/
    sprites.js               Figuren, Gebäude, Türme im Licht-Modell, Frames, Rückansicht, Katalog
    renderer.js              Arena, Schatten, Zonen, Balken, Abzeichen, Wolken
    hud.js / hudart.js       Kampf-HUD und seine gecachten Grafiken (Panels, Karten, Banner …)
    game.js                  Ereignisse → Effekte, Phasen, Ambiente, dynamische Qualität, F3
  js/ui/
    icons.js                 SVG-Icon-Set (Sprite)
    deckbuilder.js           Drag-and-Drop
    cardview.js              Kartendetail mit Reitern
    settings.js              neue Einstellungen
  js/game/particles.js       entfernt (ersetzt durch vfx/)
shared/cards.js              applySkin: archetype, fx (rein optisch)
data/skin.json               Beschreibung der neuen Felder
tools/
  bench/run.mjs, replay.mjs  Extremszene und Messung (inklusive „nur Kampf“)
  bench/profile.mjs          CPU-Profil nach Selbstzeit
  bench/ablate.mjs           Abschalt-Varianten zur Kostenanalyse
  vfx-gallery.mjs            VFX-Kontaktbögen
  ui-shots.mjs               Screenshot-Tour mit Layout-Prüfungen und --perf
  e2e/browser-match.mjs      zwei Browser-Clients, Desync- und Konsolenprüfung
test/vfx.test.js, test/manifest.test.js, test/skin.test.js (erweitert), test/e2e.test.js (korrigiert)
docs/AUDIT.md, COMPARISON.md, STYLE_GUIDE.md, REPORT.md, vfx-katalog/, before_after/
```

## 3. Vorher und nachher

Alle Bilder liegen paarweise mit identischen Dateinamen in [`before_after/before/`](before_after/before/) und [`before_after/after/`](before_after/after/): 25 Zustände in drei Formaten (Handy hochkant 390×844, Handy quer 844×390, Desktop 1440×900). Die Extremszene liegt in `…/szene/` (19 Marken, Desktop und Handy hochkant). Nebeneinandergestellte Vergleichsbögen der wichtigsten Zustände stehen in [`before_after/vergleich/`](before_after/vergleich/).

| Bereich | Vorher (Auszug aus dem Audit) | Nachher |
|---|---|---|
| Arena | grelles Schachbrett, flacher Fluss, braune Rechtecke als Brücken, keine Vignette | Rand mit Bannern, Gras mit Variation, Fluss mit Steinkante, Holzbrücken, Licht-Verlauf, Vignette; Ambiente bei Qualität Hoch |
| Figuren | flach, gleich dicke Kontur, harte Schatten, keine Richtung | Licht-Modell (Verlauf, Glanz, Rim-Light, dicke Außenkontur), weicher Schatten nach unten rechts, Rückansicht, Lauf- und Angriffs-Frames |
| Türme | graue Kästen, nur „!“ beim Erwachen | Zinnen, Wappen, Schadenstufen, Trümmer, Königskanone, Erwach-Effekt mit Glow und Shockwave |
| Zauber | blasser Ring, kleine Funken, Linie als Blitz | dreistufige Effekte mit Decals, additivem Leuchten, Shockwave, Zickzack-Blitzen, Hit-Stop und Wackeln |
| Schwärme | 15 Balken, 15 Ringe, Zahlenwand | Balken nur bei Schaden, keine Abzeichen für kleine Einheiten, gebündelte Effekte |
| Kampf-HUD | flache Karten, einfache Pille als Timer | Seltenheitsrahmen, Elixier-Fortschritt, Flüssigkeitsleiste, Timer-Box, Kronen-Plaketten, Emote-Leiste, Banner |
| DOM-Screens | Creme-Panels, Emojis als Icons | Nachtblau-Panels, mehrstufige 3D-Knöpfe, SVG-Icons, Reiter, Drag-and-Drop, Kronen-Kissen |

Layout-Prüfungen der Screenshot-Tour (`tools/ui-shots.mjs`): Arena unter dem HUD, abgeschnittene Elemente, gekürzte Texte, Touch-Ziele unter 44 px, Toasts über der Arena und Konsolenfehler. Nachher in allen 75 Zuständen jeweils **0** (`before_after/after/checks.json`); vorher gab es unter anderem gekürzte Kartennamen im Menü.

## 4. Performance und Stabilität

**Messumgebung:** Chromium 141 headless über Playwright, **ohne GPU** (Software-Rasterung). Die CPU-Drosselung erfolgt per DevTools-Protokoll; 4× dient als übliche Näherung für ein Mittelklasse-Handy. Gemessen werden rAF-Frame-Zeiten, Long Tasks (> 50 ms) und `performance.memory`. Werkzeuge: `tools/bench/run.mjs` (Extremszene) und `tools/ui-shots.mjs --perf` (normales Match). Rohdaten liegen in `before_after/perf-*.json`.

### 4.1 Extremszene (bis zu 222 Entitäten, alle großen Zauber, Turmzerstörung, Champion, Held; 14 s)

Gesamter Lauf, gleiche Messmethode wie im Audit:

| Profil | | FPS | p95 | schlechtester Frame | Long Tasks (max) | Wiedergabe (Soll 14 s) | Heap | Zeichenaufrufe/Frame |
|---|---|---|---|---|---|---|---|---|
| Desktop 1440×900, CPU 1× | vorher | 27 | 67 ms | 617 ms | 128 (93 ms) | 22,9 s | 23,2 MB | 4422 |
|  | nachher | **39** | 50 ms | 483 ms | 9 (135 ms) | 20 s | 16,5 MB | 841 |
| Handy 390×844, CPU 4× | vorher | 6 | 350 ms | 2633 ms | 487 (466 ms) | 131,4 s | 24,1 MB | – |
|  | nachher | **14** | 167 ms | 2333 ms | 496 (791 ms) | 54,2 s | 40,8 MB | – |
| Handy 844×390, CPU 4× | vorher | 5 | 350 ms | 2483 ms | 494 (508 ms) | 136,7 s | 21,1 MB | – |
|  | nachher | **13** | 167 ms | 2383 ms | 496 (1026 ms) | 55,5 s | 46,6 MB | – |

- Zeichenaufrufe pro Frame (Desktop): **4422 → 841** (−81 %), vor allem durch den Sprite-Cache und die statische Hintergrund-Ebene.
- Die Wiedergabe der 14-s-Szene dauert am gedrosselten Handy **54–56 s statt 131–137 s**. Der Main-Thread staut sich also weit weniger.
- Der höhere Heap (bis 47 MB) ist der Sprite-Cache (Budget 40 MB) und damit beabsichtigt.
- Partikel-Spitze 900: Das ist das Budget der Stufe Hoch (vorher fest 700).

Nur Kampfphase: Für diesen fairen Vergleich wurde auch der Stand vor dem Upgrade mit dem erweiterten Werkzeug nachgemessen (`perf-before-kampfphase.json`). „Vorbereitung“ ist die Arbeit, die im Spiel hinter dem Ladescreen liegt: Hintergrund, Turm-Sprites, VFX-Texturen.

| Profil | | Vorbereitung | schlechtester Frame | p99 | Long Tasks (max) |
|---|---|---|---|---|---|
| Desktop, CPU 1× | vorher | 15 ms | 117 ms | 83 ms | 142 (97 ms) |
|  | nachher | 134 ms | 67 ms | 50 ms | 8 (74 ms) |
| Handy hochkant, CPU 4× | vorher | 58 ms | 467 ms | 400 ms | 493 (469 ms) |
|  | nachher | 784 ms | 333 ms | 267 ms | 495 (330 ms) |
| Handy quer, CPU 4× | vorher | 60 ms | 433 ms | 383 ms | 504 (418 ms) |
|  | nachher | 1018 ms | 333 ms | 267 ms | 495 (599 ms) |

- Die einzelnen Ausreißer-Frames von über 2 s im Gesamtlauf entstehen beim Laden der Spielmodule und der Vorbereitung, vorher wie nachher. Im Kampf selbst sind schlechtester Frame und p99 deutlich besser.
- **Längster Long Task im Querformat:** Er liegt nachher in einem von zwei Läufen über dem alten Wert (599 bzw. 743 ms gegenüber 418 ms).
  - Die spielinterne Aufschlüsselung zeigt keinen Kampf-Frame mit mehr als 162 ms JavaScript.
  - Laut CPU-Profil entfallen 66 % der Zeit auf native Rasterung und Compositing („(program)“), 9 % auf `drawImage` und nur 0,4 % auf die Garbage Collection.
  - Diese Spitzen sind also Software-Rasterung ganzer Bildschirm-Ebenen und schwanken zwischen Läufen stark. Auf Geräten mit GPU-Beschleunigung fallen sie in dieser Form nicht an.

### 4.2 Normales Trainingsmatch (10 s gegen den Bot, eigene Karten werden gespielt)

| Profil | vorher | nachher, automatische Qualität (Standard) | nachher, feste Auflösung |
|---|---|---|---|
| Handy 390×844, CPU 4× | 10 FPS · p95 133 ms · Long Tasks 101 (max 175 ms) | **34 FPS** · p95 50 ms · Long Tasks 13 (max 128 ms) · DPR 1 | **18 FPS** · p95 100 ms · Long Tasks 77 (max 145 ms) · DPR 2 |
| Handy 844×390, CPU 4× | 10 FPS · p95 133 ms · Long Tasks 105 (max 170 ms) | **34 FPS** · p95 50 ms · Long Tasks 19 (max 125 ms) · DPR 1 | **21 FPS** · p95 67 ms · Long Tasks 66 (max 138 ms) · DPR 2 |
| Desktop 1440×900, CPU 4× | 10 FPS · p95 133 ms · Long Tasks 107 (max 172 ms) | **21 FPS** · p95 67 ms · Long Tasks 52 (max 127 ms) · DPR 1 | **21 FPS** · p95 67 ms · Long Tasks 54 (max 105 ms) · DPR 1 |
| Desktop 1440×900, CPU 1× | 53 FPS · p95 33 ms · Long Tasks 0 | **60 FPS** · p95 17 ms · Long Tasks 0 | – |

- **Automatische Qualität:** Die Spalte ist der Standard. Sie senkt am gedrosselten Handy die Renderauflösung auf DPR 1 und erreicht damit gut das Dreifache der früheren Bildrate.
- **Feste Auflösung:** Mit DPR 2 wie vorher sind es knapp doppelt so viele Bilder pro Sekunde wie vor dem Upgrade.
- **JavaScript-Anteil pro Frame:** Er liegt im Mittel bei etwa 7 ms (Zeichnen 5–6 ms, davon HUD rund 2 ms, Figuren rund 1,5 ms; Effekte rund 1 ms). Der Rest ist Rasterung.

### 4.3 Mehrspieler: zwei Browser-Clients, volles Match mit Verlängerung

| Kampf | Decks | Ergebnis (Client A / Client B) | Verlängerung | Server-Ticks verglichen | Desync | Konsolenfehler | ausgespielte Karten | Dauer (Zeitraffer ×3) |
|---|---|---|---|---|---|---|---|---|
| Verlängerung | nur Zauber und Gebäude, Zauber in den Fluss | Unentschieden / Unentschieden (Unentschieden) | ja, 2401 Ticks | 6001 | **0** | **0** | 72 / 70 | 108 s |
| Normal | Startdecks mit Truppen | Niederlage / Sieg! (Burgturm zerstört) | nein | 3534 | **0** | **0** | 46 / 44 | 67 s |

- **Ablauf:** wie ein Mensch über die echte Oberfläche.
  1. Client A (Handy hochkant) erstellt einen Kampf, Client B (Handy quer) tritt mit dem Code bei.
  2. Beide klicken „Bereit!“ und durchlaufen Countdown und Ladescreen.
  3. Beide spielen laufend bezahlbare Karten, bis der Ergebnis-Screen kommt.
- **Desync-Prüfung:** Jeder Client bildet für jeden empfangenen Server-Tick eine Prüfsumme über alle Entitäten (ID, LP, Position) plus Kronen und Phase. Für alle Ticks, die beide gesehen haben, müssen die Summen übereinstimmen.
- **Ergebnis-Prüfung:** Grund identisch, Kronen gespiegelt, Sieg/Niederlage bzw. beidseitig Unentschieden.
- **Aufruf:** `node tools/e2e/browser-match.mjs --scale=3` (optional `--only=verlaengerung`); Rohdaten in `before_after/mp-match.json`.
- **Weitere Tests:** Die bestehenden Server-E2E-Kämpfe (Teil von `npm test`: alle Mechanik-Gruppen, Champion, Held, Evo) und alle 276 Tests sind grün.

## 5. Einschränkungen

- **Keine GPU in der Testumgebung.** Chromium rastert hier in Software. Rund zwei Drittel der Zeit (66 %) entfallen laut CPU-Profil auf „(program)“, also native Rasterung und Compositing, nicht auf das Spiel-JavaScript. Absolute FPS-Werte, besonders mit 4-facher CPU-Drosselung, liegen deshalb weit unter dem, was ein echtes Mittelklasse-Handy mit GPU-Beschleunigung schafft. Die Zielwerte 60 FPS bzw. mindestens 30 FPS konnten hier **weder bestätigt noch widerlegt** werden. Belastbar sind die relativen Verbesserungen und die Zahl der Zeichenaufrufe.
- **Extremszene am gedrosselten Handy-Profil:** Sie bleibt in dieser Umgebung mit 13–14 FPS deutlich unter 30 FPS. Die dynamische Qualität senkt dann Auflösung und Effektmenge, das reicht hier aber nicht für 30 FPS.
- **Einmalige Vorbereitungsarbeit:** Hintergrund, Turm-Sprites, VFX-Texturen und Deck-Figuren werden im Ladescreen gerendert. In der Benchmark-Messung fällt diese Phase als einzelner langer Block an (Abschnitt 4, Spalte „Vorbereitung“). Im echten Ablauf liegt sie hinter der VS-Einblendung.
- **Referenzlücken:** Für Elixierleiste, Emote-Auswahl, Lobby, Einstellungen und das vollständige Hauptmenü gab es kein Referenzbild. Diese Teile folgen dem Style Guide.
- **Emote-Auswahl:** Sie ist als Leiste umgesetzt (eine Zeile über dem Emote-Knopf, bei zu wenig Breite 3×2), nicht als Radialmenü.
- **Animationen:** Sie sind je Archetyp generisch (Ruhe, zwei Lauf- und zwei Angriffs-Frames, Betäubt, Schlaf) mit prozeduralem Squash und Stretch. Es gibt keine eigene Animation pro Karte.
- **Sounds:** Sie bleiben die vorhandenen prozedural erzeugten Klänge. Die Sound-Hooks erlauben das Andocken eigener Klänge, es wurden aber keine neuen Sound-Dateien erstellt.
- **Desync-Prüfung:** Sie vergleicht Prüfsummen über Entitäten (ID, LP, Position) und Kronen pro Server-Tick. Ein Server-Zeitraffer (×3) beschleunigt die Kämpfe; das Protokoll ist dasselbe wie im Echtbetrieb.

## 6. Offene Punkte

- Messung auf echten Geräten (Mittelklasse-Android mit Chrome, älteres iPhone mit Safari) mit `F3`-Overlay und `tools/ui-shots.mjs --perf --url=…`.
- Optional ein Radial-Layout für Emotes als Alternative zur Leiste.
- Eigene Animationen für Sonderfiguren (zum Beispiel Bergarbeiter beim Graben, Ballon beim Abwurf) statt der generischen Archetyp-Frames.
- Eigene Sound-Dateien über den Sound-Hook (`{ "type": "sound", "name": … }`) einbinden.
- Alte Vorher-Bilder unter `docs/ui-referenz/vorher*` zeigen noch die früher erfundenen Karten. Ob sie gelöscht werden sollen, ist offen und wartet auf deine Entscheidung.

## 7. Anleitungen

### 7.1 VFX-Presets anlegen oder ändern

1. In `client/js/vfx/presets.json` einen Eintrag unter einem Ereignisnamen anlegen (Namen siehe `STYLE_GUIDE.md` §11) oder einen bestehenden ändern. Aufbau:
   ```json
   "spell.fire": {
     "scaleWith": "radius", "baseRadius": 2.5,
     "delays": { "core": 0.08, "post": 0.25 },
     "layers": {
       "pre":  [ … ],
       "core": [ { "type": "burst", "count": 30, "shape": "flame", "colors": ["#ffd84d", "team"], "speed": [2, 5], "life": [0.3, 0.6], "size": [0.3, 0.5], "sizeEnd": 0.05, "blend": "add" } ],
       "post": [ { "type": "decal", "shape": "scorch", "life": 3 }, { "type": "sound", "name": "crumble", "vol": 0.5 } ]
     }
   }
   ```
2. Zeitstaffelung einhalten: Vorlauf 80–200 ms, Kern 100–400 ms, Nachhall 300–1000 ms (`delays` in Sekunden; der Test prüft Vorlauf ≤ 200 ms und Nachhall nach dem Kern).
3. Formen (`shape`) und Decals: siehe `client/js/vfx/textures.js` bzw. `manifest().particleShapes` und `manifest().decals`. Farben `"team"`, `"teamLight"`, `"enemy"` werden zur Laufzeit ersetzt.
4. Deko-Partikel mit `"prio": 0` markieren. Sie entfallen bei „Effekte reduzieren“ und werden bei vollem Budget zuerst verdrängt.
5. Prüfen:
   - `node --test test/vfx.test.js` (Validierung)
   - `node tools/vfx-gallery.mjs --only=spell.fire --out=/tmp/vfx` (Kontaktbogen zu fünf Zeitpunkten)
   - im Spiel mit `F3` (Partikelzahl, Budget)
6. Pro Karte ein anderes Preset oder eine andere Farbe: `data/skin.json` → `"fx": { "preset": "…", "tint": "#22cc88" }`.

### 7.2 Designsystem verwenden

- **Farben und Maße:** `client/js/design/tokens.js` (Canvas) bzw. CSS-Variablen in `client/css/style.css` (`--night-*`, `--gold-*`, Knopf-Lippen). Keine Farbwerte direkt in Komponenten schreiben.
- **Figuren und Gebäude zeichnen:** Formen über das `fill()`-Primitiv in `game/sprites.js` füllen. Das Licht-Modell (`LitCtx`) ergänzt Verlauf und Glanz, `finishSprite` die Kontur und das Rim-Light. Ergebnisse immer über `sprites.obtain(key, builder)` cachen; der Schlüssel muss alle sichtbaren Parameter enthalten.
- **HUD-Grafiken:** wiederverwendbare Teile in `game/hudart.js` (`paintPanel`, `paintWell`, `cardSprite`, `ribbon`, `emotePanel` …). Jedes Teil wird je Größe einmal gerendert und danach nur kopiert.
- **DOM-Bausteine:**
  - Knöpfe: `.btn` plus Rolle `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-accent` oder `.btn-ghost`, Größe `.btn-small` oder `.btn-big`. Zustände über `disabled` bzw. `aria-busy="true"`.
  - Flächen: `.panel`, `.well`; Reiter `.tabs` / `.tab`.
  - Icons: `icon('name')` bzw. `ico('name')` aus `ui/icons.js` bzw. `ui/dom.js`; in HTML `<svg class="i"><use href="#i-name"/></svg>`.
  - Ein neues Icon kommt als Eintrag in `ICONS` hinzu (24er-Raster; Helfer `sh` = Form mit Kontur, `ln` = Linie mit Kontur, `hl` = Glanz).
- **Bewegung:** Kurven aus `design/easing.js` (`backOut` für Pop, `outCubic` für Bewegung, `elasticOut` für Belohnung) bzw. `--ease-out` und `--ease-pop` in CSS. Jede Animation muss bei `prefers-reduced-motion` entfallen oder kurz sein.

### 7.3 Qualitätsstufen

| Stufe | Render-DPR max. | Partikel | Decals | Spuren | Glanz | Ambiente |
|---|---|---|---|---|---|---|
| Niedrig | 1 | 220 | 6 | 10 | aus | aus |
| Mittel | 1,5 | 500 | 12 | 24 | an | aus |
| Hoch (Standard) | 2 | 900 | 24 | 40 | an | Wolken, Glitzern, Blätter |

- **Automatische Qualität** (Standard an): Bleibt die geglättete Frame-Zeit über 1,2 s hinweg über 24 ms, sinkt die Renderauflösung eine Stufe (2 → 1,5 → 1,25 → 1) und die Effektmenge um 20 % (bis 40 %). Nach 5 s unter 15 ms geht es schrittweise zurück. Hintergrund und Sprites behalten ihre Auflösung; das spart Neuzeichnungen beim Wechsel.
- **Effekte reduzieren:** halbiert Partikel, lässt Deko weg und schaltet Konfetti, Ambiente und den animierten Menühintergrund ab.
- **Bildschirmwackeln:** Regler 0–100 % (0 = aus).
- **Farbenblind-Modus:** Gegner zusätzlich über Form (Schild-Abzeichen) und Streifen (Lebensbalken) erkennbar.
- **System „reduzierte Bewegung“:** kein Wackeln, kein Hit-Stop, gedämpfter Flash, keine CSS-Animationen.
- **`F3`** zeigt FPS, Frame-Zeit, DPR, Partikel bzw. Budget, Decals, Spuren, Sprite-Cache und die Zeitaufteilung des langsamsten Frames.
