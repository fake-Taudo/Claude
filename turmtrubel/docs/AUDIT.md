# Audit: Ausgangslage für das visuelle Upgrade

Stand: Commit `3ac0793` vom 6. Oktober 2026. Dieses Audit beschreibt den Zustand **vor** dem Upgrade (Vektor-Look, VFX, Game-UI).

- Vorher-Bilder: `docs/before_after/before/` (25 Zustände × 390×844, 844×390, 1440×900)
- Extremszene: `docs/before_after/before/szene/` (19 Marken)
- Messwerte: `docs/before_after/perf-before.json` (Extremszene) und `perf-normal-before.json` (Trainingsmatch)

---

## 1. Dateibaum

Nur der Teil, der für Grafik, UI und Rendering wichtig ist. Spiellogik und Server sind der Vollständigkeit halber aufgeführt, bleiben aber unverändert.

```
turmtrubel/
├── client/                      Browser-Client (ES-Module ohne Build-Schritt, vom Node-Server statisch ausgeliefert)
│   ├── index.html               Alle DOM-Screens: s-boot, s-name, s-menu, s-deck, s-lobby, s-loading (VS),
│   │                            s-game (Canvas + Menü-Knopf), s-result (Konfetti-Canvas, Kronen, Statistik, Rematch);
│   │                            dazu #modal-root, #toasts, #conn-banner, #rotate-hint
│   ├── favicon.svg              einziges Bild-Asset im Repo
│   ├── css/style.css (1016 Z.)  Design-Tokens (:root), Schrift-Einbindung, 3D-Knöpfe, Panels, Chips, Toggles,
│   │                            Slider, Modal/Bottom-Sheet, Toasts, Screens, Responsiv-Regeln, reduzierte Bewegung
│   └── js/
│       ├── main.js (904)        App-Ablauf: Boot → Name → Menü → Beitreten/Lobby → VS → Kampf → Ergebnis; Tipps, Pause
│       ├── net.js (121)         WebSocket-Client (Protokoll aus shared/protocol.js)
│       ├── store.js (65)        localStorage (Name, Decks, Einstellungen)
│       ├── audio.js (284)       synthetische Sounds (WebAudio) und prozedurale Musik (menu, battle, overtime, victory)
│       ├── ui/
│       │   ├── tokens.js (92)   liest CSS-Variablen in das JS-Objekt T; reducedMotion(), safeInsets()
│       │   ├── dom.js (199)     h(), showScreen(), toast(), modal(), confirmDialog()
│       │   ├── art.js (80)      Cache der Kartenbilder (Canvas → Data-URL) für DOM-Karten
│       │   ├── cardview.js (271) DOM-Karte und Kartendetail
│       │   ├── deckbuilder.js (418) Deck-Bauer (8 Slots, Sammlung, Filter, Evo-Slots)
│       │   └── settings.js (138) Einstellungen (Qualität, Ausrichtung, Schadenszahlen, Ping, Emotes stumm, Vibration)
│       └── game/
│           ├── game.js (1257)   Kampf-Controller: Snapshot-Puffer, Interpolation, Ereignisse → Effekte,
│           │                    Eingabe (Ziehen/Tippen), Platzier-Vorschau, Zeichenreihenfolge
│           ├── renderer.js (1303) Arena-Hintergrund, Fluss, Zonen, Entitäten, Status, Balken, Projektile,
│           │                    Strahlen, Emotes, Ausspiel-Marker, Geister
│           ├── sprites.js (2334) prozedurale Figuren: Waffen, Hüte, Körper, Gebäude, Türme, Zauber-Icons,
│           │                    Emote-Gesichter, Kartenbilder, Platzhalter, Skin-Bilder
│           ├── particles.js (338) Partikel, Ringe, Blitze, schwebende Texte, Schadenszahlen
│           ├── hud.js (1216)    Canvas-HUD: Layout-Engine, Hand, Nächste Karte, Elixierleiste, Timer,
│           │                    Kronen, Ping, Emotes, Fähigkeit, Banner, Kronenflug, gezogene Karte
│           └── canvastext.js (132) gecachte Text-Sprites mit Kontur, tabellarische Ziffern, Kürzen
├── server/                      autoritative Simulation (20 Ticks/s), Räume, Bot     ← unverändert
│   ├── index.js, rooms.js, bot.js
│   └── sim/ match.js, combat.js, motion.js, nav.js, spells.js, traits.js, abilities.js, geom.js, rng.js
├── shared/                      cards.js (Kartendatenbank), arena.js (Geometrie), protocol.js, decks.js  ← unverändert
├── data/                        cards.json, rules.json, skin.json (Looks je Karte), source/wiki-cards.json
├── test/                        node:test – Simulation, Karten, Mechaniken, Räume, Integration, E2E, Skin
├── tools/
│   ├── ui-shots.mjs             Screenshot-Tour aller Screens und Zustände inkl. Layout-Prüfungen, --perf
│   ├── bench/replay.mjs         erzeugt die deterministische Extremszene (Snapshot-Folge)
│   ├── bench/run.mjs            spielt die Szene im echten Client ab und misst (FPS, Long Tasks, Zeichenaufrufe)
│   ├── e2e/                     zwei Test-Clients spielen komplette Kämpfe über WebSocket
│   └── cards/                   Generator für data/cards.json (Python)
└── docs/                        Doku, Vorher/Nachher-Bilder
```

Schriften: Lilita One (Display) und Nunito (Text), beide SIL Open Font License, lokal aus `node_modules/@fontsource/*` unter `/fonts/…` ausgeliefert.

---

## 2. Architektur und Render-Schichten

**Datenfluss:**
1. Der Server simuliert mit 20 Ticks/s.
2. Er schickt Snapshots: Entitäten `[id, typ, besitzer, x, y, lp, maxLp, flags, schild, ziel, blick, aux]`, dazu Projektile, Zonen, Ereignisse (`ev`) und den eigenen Zustand (`me`).
3. Der Client puffert die Snapshots und rendert 110 ms in der Vergangenheit (Interpolation).
4. Ereignisse werden genau einmal abgespielt, sobald ihr Snapshot die Renderzeit erreicht.

**DOM:** Menüs, Lobby, Deck-Bauer, Ergebnis, Modals und Toasts sind HTML/CSS. Im Kampf gibt es zusätzlich nur den Menü-Knopf als DOM-Element.

**Canvas `#game-canvas`:**
- ein einziger 2D-Kontext
- DPR je nach Qualitätsstufe begrenzt: hoch 2, mittel 1,5, niedrig 1
- Zeichenreihenfolge pro Frame (`Game.draw`):

| # | Schicht | Quelle | Gecacht? |
|---|---|---|---|
| 1 | Arena-Hintergrund (Gras-Schachbrett, Wege, Turmplätze, Fluss, Brücken, Bäume) | `renderBackground` | ja, Offscreen-Canvas, neu bei Größen- oder DPR-Wechsel |
| 2 | Fluss-Animation (7 Wellenstriche) | `drawRiverAnim` | nein |
| 3 | Platzier-Overlay (ungültige Bereiche schraffiert, 150 ms Ein-/Ausblenden) | `drawPlacementOverlay` | nein |
| 4 | Bodenzonen (Gift, Heilung, Wut …) als gestrichelte Kreise | `drawZonesGround` | nein |
| 5 | Trümmer zerstörter Türme | `drawRubble` | nein |
| 6 | Partikel-Ringe | `fx.drawRings` | nein |
| 7 | Entitäten: Schatten, Teamring, Boden- vor Luftobjekten (nach y sortiert), Status-Symbole, LP-Balken | `drawEntities` → `sprites.drawUnit/drawBuilding/drawTower` | **nein, jede Figur wird jeden Frame aus Pfaden neu gezeichnet** |
| 8 | Strahlen, Projektile, Luftzonen (Gewitter, Kometen …) | `drawBeams`, `drawProjectiles`, `drawZonesAir` | nein |
| 9 | Partikel, Blitze, schwebende Texte, Schadenszahlen | `fx.draw` | nur Texte (Text-Sprite-Cache) |
| 10 | eigene Geister, Vorschau-Geist, gegnerische Ausspiel-Marker, Emotes | `drawGhost`, `drawPlayedMarkers`, `drawEmotes` | Kartenbilder ja |
| 11 | HUD: Panels, Hand, Nächste, Elixier, Timer, Kronen, Ping, Emote-Knopf/-Menü, Fähigkeit, Banner, Kronenflug | `hud.draw` | Texte und Tropfen ja |
| 12 | gezogene Karte | `hud.drawDrag` | Kartenbild ja |

Die Schichten 1–10 liegen unter einem Bildschirm-Wackeln (Zufallsversatz, linearer Abbau `shake -= dt·40`). Das HUD wackelt nicht mit.

---

## 3. Inventar der visuellen Assets und Zeichenroutinen

Es gibt **keine Bitmaps**. Alles ist prozedural mit Canvas-Pfaden gezeichnet; nur der `custom`-Skin aus `skin.json` kann eigene Bilder einbinden.

| Bereich | Inhalt | Technik |
|---|---|---|
| Primitive (`sprites.js`) | `ell`, `circ`, `rrect`, `poly`; `fill()` füllt **einfarbig** und zieht danach die Kontur; `shade()`/`mix()` mit Farb-Cache | flache Farben, eine Konturstärke `max(1.3/U, 0.075)` |
| Waffen | 20: sword, dagger, blades, axe, club, hammer, mace, spear, lance, bow, crossbow, staff, orb, bomb, sling, lantern, wrench, pick, launcher, fists | Pfade, Schwungwinkel aus `atk` |
| Kopfbedeckungen und Frisuren | 19: helmet, hood, wizard, witch, crown, horns, bandana, tiara, hair, plume, spiky, braid, ponytail, miner, monk, bald, cap, mask, circlet | Pfade |
| Körper | 23: humanoid (hum, imp, skel), brute, golem, bot, moth, bug, winged, dragon, balloon, whale, spirit, rider, blob, barrel, cart, ghost, hog, bush, machine, wagon (+ Reittier `mount`) | Pfade; Laufen und Angriff prozedural als Squash/Stretch, Wippen und Schwung |
| Gebäude | 12: cannon, turret, tesla, hut, grave, pump, inferno, mortar, ballista, cage, drill, bombtower | Pfade auf Steinsockel |
| Türme | König und Prinzessin (`drawTower`) | helle Steinquader, Zinnen, Fahnen in Teamfarbe, Figur oben |
| Zauber-Icons | 20: arrows, fireball, zap, log, freeze, poison, comet, storm, barrel, grave, tornado, quake, clone, mirror, snowball, curse, rage, crate, vines, void | Pfade (für Karten und Marker) |
| Kartenbilder | `drawCardArt`: Hintergrund je Typ, Figur, Gruppen, Evo-Glanz | im Kampf gecacht (`ui/art.js`, HUD) |
| Emote-Gesichter | `drawEmoteFace` | Pfade |
| Arena (`renderer.js`) | Schachbrett-Gras, Erdwege, Turmplätze, Fluss-Verlauf, Holzbrücken, Bäume als Kreise | Offscreen-Cache |
| Projektile | Pfeile, Fass, Komet, Schneeball, Kiste, Gewitter, Kanonenkugel, Bögen (`ARC_KINDS`) | Pfade je Frame |
| HUD (`hud.js`) | Kronen, Elixier-Tropfen, Tastenkappen, Schraffur, Karten mit Glanz-Sweep, Elixierleiste mit Verlauf, Schimmer und Segmenten | gemischt, teils gecacht |
| DOM (`style.css`) | Tokens: Farben, Seltenheiten, Radien, Kontur 3 px, Schatten, Glanz, 4er-Raster, Tap 44 px, Easing (`--ease-out`, `--ease-pop`), Dauern | CSS |

**Was fehlt:**
- ein Licht-Modell (kein Verlauf, kein Glanzlicht, kein Rim-Light)
- Rückansichten (Einheiten, die nach oben laufen, zeigen dasselbe Gesicht)
- Schadenstufen an Türmen
- jedes Sprite-Caching für Figuren

---

## 4. Vorhandene VFX

**Partikel-System** (`particles.js`):
- vier Listen: `list`, `rings`, `bolts`, `texts`
- Obergrenze je Qualität: 700, 450 oder 200
- Formen: spark, square, shard, plus, star, bubble, drop, smoke
- jedes Teilchen ist ein neues Objekt; `update()` baut die Arrays jeden Frame mit `filter()` neu → Müll für den GC
- kein Pooling, kein additives Blending, keine Lebensdauer-Kurven (nur lineares Ausblenden in der zweiten Hälfte)
- Schadenszahlen: max. 8, Werte innerhalb von 0,25 s werden zusammengefasst

**Fertige Presets:**

| Preset | Teilchen |
|---|---|
| hit | Funken |
| poof | Rauch |
| explosion | Funken, Rauch |
| frost | Splitter |
| shock | Blitze |
| heal | Plus-Zeichen |
| poison | Blasen |
| debris | Brocken |
| elixir | Tropfen |
| deployDust | Staub |
| confetti | Konfetti |
| sparkle | Sterne |

**Ereignis → Effekt** (Auszug aus `processEvents`, `spellFx`, `blastFx`):

| Ereignis | heute |
|---|---|
| `a` Angriff | Sound; Blitz-Linie bei Blitz-Einheiten |
| `h` Treffer | 6 helle Funken, Figur kurz aufgehellt (`fill` mischt Weiß), Schadenszahl ab 40 |
| `d` Tod | Rauch-Poof (Einheit) bzw. Brocken (Gebäude) |
| `tw` Turm zerstört | Explosion, Brocken, Wackeln 14/22 px, Kronenflug |
| `ka` König erwacht | „!“-Text über dem König |
| `sp` Zauber | Feuerball/Komet: Explosion und Wackeln. Frost: Splitter und Eisblock-Rechtecke. Gift, Heilung, Wut, Fluch, Leere, Ranken, Tornado, Klon: **ein farbiger Ring**. Pfeile: Funkenregen und Ring. Gewitter: nichts Eigenes |
| `bl` Explosionen von Einheiten | Explosion, Ring oder Staub je Art |
| `ch`, `zb`, `st`, `ms` | Blitzketten, Strahlen, Sterne |
| `pl` Ausspielen | Sound, Evo-Sternenregen, gegnerischer Kartenmarker |
| `ot`, Doppel-Elixier, Sieg, Niederlage | Canvas-Banner, Konfetti bei Sieg |

**Zonen:** gestrichelte Kreise in `ZONE_COLORS`, dazu einzelne Partikel (Gift-Blasen, Heil-Plus, Funken).

**Status an Figuren** (`drawStatus`): Betäubung (Sterne), Verlangsamung, Eisblock (halbtransparentes Rechteck), Schild, Wut-Tönung, Fluch, Tarnung und weitere.

---

## 5. Performance-Ausgangswert

**Messmethode:**
- **Extremszene:** `tools/bench/replay.mjs`. Deterministische 14-s-Szene mit bis zu 222 Entitäten, allen großen Zaubern, Turmzerstörung, Champion und Held. Sie wird im echten Client als Snapshot-Folge abgespielt.
- **Werkzeug:** `tools/bench/run.mjs` mit Playwright und Chromium. CPU-Drosselung über CDP; gemessen werden rAF-Frame-Zeiten, Long Tasks und `performance.memory`.
- **Zeichenaufrufe:** fill, stroke, drawImage, fillRect, strokeRect, fillText und strokeText, gezählt in einem eigenen Durchlauf.

**Extremszene:**

| Profil | FPS | p95 | schlechtester Frame | Long Tasks (max) | Heap | Partikel max | Wiedergabe (Soll 14 s) |
|---|---|---|---|---|---|---|---|
| Desktop 1440×900, DPR 1, CPU 1× | **27** | 67 ms | 617 ms | 128 (93 ms) | 23,2 MB | 700 (Limit) | 22,9 s |
| Handy 390×844, DPR 2, CPU 4× | **6** | 350 ms | 2633 ms | 487 (466 ms) | 24,1 MB | 700 | 131,4 s |
| Handy 844×390, DPR 2, CPU 4× | **5** | 350 ms | 2483 ms | 494 (508 ms) | 21,1 MB | 700 | 136,7 s |

Zeichenaufrufe pro Frame (Desktop, Extremszene): **4422**

**Normales Trainingsmatch** (10 s gegen den Bot, `tools/ui-shots.mjs --perf`):

| Profil | FPS | p95 | Long Tasks |
|---|---|---|---|
| alle drei Formate, CPU 4× | 10 | 133 ms | 101–107 |
| Desktop, CPU 1× | 53 | 33 ms | 0 |

**Einordnung:**
- Schon ein normales Match schafft auf einem gedrosselten Gerät (Mittelklasse-Handy) nur 10 FPS. Die Extremszene bricht ganz ein: Der Main-Thread kommt nicht hinterher, die 14 s dauern 131 s.
- Hauptursachen:
  1. jede Figur jeden Frame aus Dutzenden Pfaden mit Kontur
  2. Schatten und Teamringe einzeln
  3. bis zu 700 Partikel als Einzelpfade, jeder Frame mit `filter()`-Neuaufbau
  4. LP-Balken und Status für jede Einheit, auch bei vollem Leben

---

## 6. Visuelle Schwächen

Belegt durch `docs/before_after/before/` und `…/szene/`:

1. **Kein Licht, kein Volumen.** Alle Formen sind flach gefüllt, mit gleich dicker Kontur. Es gibt keinen Verlauf von oben, kein Glanzlicht, kein Rim-Light. Die Bodenschatten sind harte Ellipsen mit 28 % Deckkraft.
2. **Arena wirkt leer und künstlich.** Grelles Schachbrett-Grün ohne Variation; der Fluss ist ein flaches Band mit Strichen; die Brücken sind braune Rechtecke; Bäume sind flache Kreise; es gibt keinen Rand, keine Deko und keine Vignette.
3. **Türme sind graue Kästen.** Keine Wappen, keine Schießscharten, kein Level-Abzeichen, keine Schadenstufen. Ein zerstörter Turm hinterlässt nur einen grauen Rauchfleck und Brocken. Der Königsturm „erwacht“ nur mit einem „!“-Text.
4. **Schwärme sind unlesbar.** 15 Skelette ergeben 15 LP-Balken und 15 Teamringe; dazu kommen Schadenszahlen („92 92 92“). Eine Masse dunkler Striche verdeckt die Figuren (`szene/*-01-aufmarsch`, `*-03-feuerball`).
5. **Zauber sind schwach.**
   - Gift, Heilung, Wut, Fluch, Leere, Tornado und Klon sind fast nur ein blasser Ring und ein gestrichelter Kreis.
   - Der Feuerball-Einschlag ist ein kleiner Funkenball.
   - Frost legt halbtransparente Rechtecke über die Einheiten.
   - Ein Blitz ist eine dünne Linie.
   - Es gibt keine Vorlauf-, Kern- und Nachhall-Staffelung, keine Boden-Decals und kein additives Leuchten.
6. **Treffer haben kein Gewicht.** Das Weiß-Aufhellen ist kaum sichtbar, es gibt keinen Hit-Stop, keine Shockwave und kein Wackeln bei schweren Treffern (nur bei Turm, Feuerball und Komet).
7. **Figuren haben keine Richtung.** Eine eigene Einheit läuft nach oben und zeigt trotzdem das Gesicht. Laufen und Angriff sind nur Squash und Stretch.
8. **Die HUD ist funktional, aber flach.**
   - Die Karten haben Seltenheitsrahmen, aber keinen Innenschatten.
   - Der Zustand „zu wenig Elixier“ ist nur abgedunkelt.
   - Die Elixierleiste hat keine Flüssigkeits- oder Blasenoptik.
   - Der Timer ist eine einfache Pille.
9. **Typografie im Canvas:** Lilita One mit Kontur ist vorhanden, aber ohne Schlagschatten und ohne einheitliche Stufen.

---

## 7. Technische Risiken

| Risiko | Folge | Gegenmaßnahme im Upgrade |
|---|---|---|
| Sprite-Caching bei 23 Körpern × Waffen × Hüten × Team × Evo × Frames × Größe | Speicher und Erzeugungszeit | Cache-Schlüssel aus Look, Team, Evo, Frame, Größe in px (gerundet) und DPR; LRU-Grenze; Frames lazy erzeugen; Animation über wenige Schlüsselbilder plus prozedurale Transformation |
| Hit-Flash und Teamfarben mit gecachten Bitmaps | Weiß-Aufhellen geht nicht mehr per Füllfarbe | weiße Silhouette je Sprite mitcachen (`source-in`) und additiv darüberlegen |
| Pixelwerte fest im Code (Konturen, Offsets, Größen) | Neuer Look erfordert viele Einzeländerungen | zentrale Tokens (`client/js/design/tokens.js`) |
| Partikel-GC und fehlende Prioritäten | Ruckler bei Schwärmen | Objekt-Pool, Ringpuffer, Prioritäten (Lesbarkeit vor Deko), dynamische Qualitätsstufe |
| Neue Effekte brauchen eventuell neue Ereignisse | Protokolländerung | zuerst rein clientseitig ableiten (Projektil verschwindet = Einschlag, LP-Sprung = Treffer, Turm-LP für Schadenstufen); nur wenn nötig zusätzliche, optionale Ereignisse (abwärtskompatibel, alte Clients ignorieren unbekannte Codes) |
| Hit-Stop würde Interpolation und Zeit verzerren | Desync-Gefahr | Hit-Stop nur als Darstellungszeit-Dehnung im Client (Simulation unberührt); bei reduzierter Bewegung aus |
| Screen-Shake, Flash und Konfetti bei `prefers-reduced-motion` | Barrierefreiheit | zentraler Regler (Stärke 0–1), Flash gedimmt |
| Tests prüfen Server und Simulation, nicht das Rendering | Visuelle Fehler fallen nicht auf | Screenshot-Tour mit Layout-Prüfungen (`tools/ui-shots.mjs`), Benchmark (`tools/bench`), neue Unit-Tests für VFX-Pooling und Lebensdauer |
| DOM-Screens und Canvas-HUD teilen Tokens nur teilweise | uneinheitlicher Look | ein Token-Satz, der CSS-Variablen und JS speist |

---

## 8. Schlussfolgerungen für die Umsetzung

1. **Performance zuerst strukturell lösen**, weil der neue Look mehr Details bringt:
   - Sprite-Cache für Einheiten, Gebäude und Türme
   - gebündelte Schatten
   - Partikel-Pool
   - LP-Balken bei vollem Leben ausblenden
   - Prioritäten bei vielen Partikeln
   - dynamische Qualitätsstufe
2. **Licht-Modell zentral im Zeichen-Primitiv `fill()`** einbauen (Verlauf, Glanz, Rim-Light). Damit profitieren alle 23 Körper, 20 Waffen, 19 Hüte und 12 Gebäude, ohne jede Figur neu zu schreiben. Danach gezielt die Silhouetten überzeichnen.
3. **VFX datengetrieben** aufbauen (JSON-Presets mit Vorlauf, Kern und Nachhall). Vorhandene Ereignisse abbilden; neue Ereignisse nur ergänzen, wenn sie fehlen.
4. **HUD und DOM-Screens** mit gemeinsamen Tokens auf das Referenz-Niveau heben (siehe `docs/COMPARISON.md`).
