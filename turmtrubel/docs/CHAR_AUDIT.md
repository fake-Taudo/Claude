# Charakter-Audit (Phase 1 des Charakter-Neubaus)

Stand: 7. Oktober 2026 · Grundlage für [`CHAR_SYSTEM.md`](CHAR_SYSTEM.md), [`DISTINCT_MATRIX.md`](DISTINCT_MATRIX.md) und die Design-Briefs in [`briefs/`](briefs/).

## Kurzfassung

- **130 Figuren** sind neu zu erschaffen:
  - 77 Truppen, 8 Champions, 15 Helden
  - 22 Beschwörungen (Token)
  - 6 Gebäude-Spawner
  - 2 Turmfiguren
- **Zusätzlich:**
  - 35 Evolutionen als deutlich veränderte Varianten
  - 6 Formen bestehender Figuren (zum Beispiel aufgebaute Kanonenkarre, Phönix-Ei)
- **Heute zeichnet ein einziger Baukasten alle Figuren:** `client/js/game/sprites.js`, rund 1700 von 2775 Zeilen.
  - 22 Körper-Archetypen, 20 Waffen, 19 Hüte bzw. Frisuren, kombiniert über ein `look`-Objekt aus `cards.json`
  - Dadurch teilen sich viele Figuren Silhouette und Proportionen. 45 Truppen und Token nutzen denselben Menschenkörper `hum`, 10 denselben Kobold `imp`, 11 dasselbe Skelett `skel`.
  - Unterschiede entstehen fast nur über Farben, Hut und Waffe.
- **Animation:** 7 statische Frames pro Figur (Ruhe, Lauf 1 und 2, Angriff 1 und 2, Betäubt, Schlaf) plus prozedurales Squash und Stretch beim Kopieren. Es gibt keine eigenen Animationen für Treffer, Spawn, Tod und Fähigkeit, nur VFX.
- **Kosten:** Die Figuren machen in der Extremszene (222 Entitäten) rund die Hälfte der Frame-Zeit aus. Ohne Figuren steigt die Bildrate am Desktop von 43 auf 57 FPS, am gedrosselten Handy von 12 auf 26 FPS. Der Neubau muss pro Einheit mindestens so sparsam sein: ein gebackener Frame und ein `drawImage`.

## 1. Wie Figuren heute gezeichnet werden

### Dateien und Funktionen

| Ort | Inhalt |
|---|---|
| `client/js/game/sprites.js:105` `fill()` | Zeichen-Primitiv aller Teile; über das Licht-Modell (`design/light.js`, `LitCtx`) mit Verlauf und Glanz |
| `sprites.js:184` `WEAPONS` | 20 Waffen (Schwert, Axt, Bogen, Armbrust, Stab, Hammer, Speer, Gewehr, Bombe …) |
| `sprites.js:387` `HATS` | 19 Hüte und Frisuren (Helm, Krone, Kapuze, Feder, Zopf, Hörnerhelm …) |
| `sprites.js:596` `humanoid()` | ein parametrischer Zweibeiner für `hum`, `imp` und `skel` (Kopf, Rumpf, Arme, Beine, Umhang, Bart, Schild) |
| `sprites.js:1341` `BODIES` | 22 Körper-Archetypen: `hum imp skel brute golem bot moth bug winged dragon balloon whale spirit rider blob barrel cart ghost hog bush machine wagon` |
| `sprites.js:1421` `UNIT_FRAMES`, `:1433` `unitFrameOf()` | 7 Frames, Auswahl nach Zustand (Betäubt, Schlaf, Angriff ≥ 0,6 / < 0,6, Laufen mit Phasenwechsel, Flatterer) |
| `sprites.js:1449` `buildUnitSprite()` | rendert einen Frame einmal in ein Canvas (Licht-Modell, dann `finishSprite`: Außenkontur, Rim-Light) |
| `sprites.js:1482` `blitSprite()` | kopiert den Frame mit Squash und Stretch; Treffer-Aufhellung über eine weiße Silhouette |
| `sprites.js:1503` `evoAura()` | Evo-Schimmer um die Figur |
| `sprites.js:1516` `drawUnit()` | Einstieg: Cache-Schlüssel aus Look, Team, Evo, Richtung (vorn/hinten), Blickseite, Frame, Gerätepixel und Qualität (`design/spritecache.js`, LRU 40 MB) |
| `sprites.js:2206` `KING_LOOK`, `PRINCESS_LOOK` | Turmfiguren, gezeichnet über `drawUnit` innerhalb von `drawTower()` |
| `sprites.js:2697` `drawCardArt()` | Kartenbilder (Hand, Deck-Bauer, Kartendetail) zeichnen die Figur ebenfalls über `drawUnit` |
| `client/js/game/renderer.js:509` `drawEntities()` | Bodenschatten mit Team-Fußring, Champion- und Helden-Glow, Sortierung nach Tiefe, dann `drawOne()` |
| `renderer.js:558` `drawOne()` | Zustände → `drawUnit()`: Laufen, Angriff, Treffer, Betäubt, Spawn-Fall (`spawnK`), Sprungbogen (`lp`/`th`), Unsichtbarkeit (`CLOAK`), Unter-der-Erde-Hügel (`UNDER`) |
| `renderer.js:1288` `drawGhost()` | Platzier-Vorschau zeichnet die Figur halbtransparent |
| `client/js/game/game.js` `prewarmUnits()` | rendert die Frames des eigenen Decks im Ladescreen vor |
| `client/js/ui/art.js` | Kartenbilder als Canvas und Data-URL für DOM-Karten |
| `client/js/main.js` | VS-Ladescreen und Menü-Bühne zeichnen Königstürme mit Figur |

### Daten

Das Aussehen steht als `look` in `data/cards.json` (pro Einheit, Evo und Token):

| Feld | Verwendung |
|---|---|
| `body` | 142 |
| `cloth` | 161 |
| `accent` | 120 |
| `skin` | 74 |
| `weapon` | 72 |
| `hat` | 62 |
| `scale` | 53 |
| `hairColor` | 17 |
| `beard` | 15 |
| `cape` | 11 |
| `shield` | 7 |
| `mount` | 5 |

Über `data/skin.json` lassen sich Name, Beschreibung, `look`, `image`, `archetype` und `fx` pro Karte ersetzen.

### Animationslogik

- **Laufen:** Wechsel zwischen zwei Frames (Phase `t·11`). Flatterer (Fledermaus, Drache, Lakai) wechseln auch im Stand.
- **Angriff:** Das Server-Ereignis `a` setzt `atk = 1`, das in 0,35 s abklingt. Frame 1 bei ≥ 0,6, Frame 2 darunter. Es gibt keine Ausholbewegung vor dem Treffer.
- **Treffer:** Das Ereignis `h` setzt `hurt = 1`, das in 0,16 s abklingt. Die Figur wird nur weiß aufgehellt, es gibt keine Rückstoß-Pose.
- **Spawn:** Die Figur fällt in den ersten 0,28 s von oben herein, danach folgt Squash beim Landen.
- **Tod:** Die Figur verschwindet sofort, es bleibt nur ein VFX (`unit.death`).
- **Fähigkeit:** Champions und Helden haben keine eigene Pose, nur das VFX `ability.activate`.
- **Evo:** Eine geänderte `look`-Farbe plus Schimmer-Aura.
- **Richtung:** Die Rückansicht wird im Hochformat beim Laufen nach oben genutzt, sonst die Vorderansicht. Die Blickseite entsteht durch Spiegeln.

## 2. Vollständige Figurenliste

Erzeugt mit `node tools/characters/roster.mjs --md` aus `data/cards.json`. Die Größe ist der Kollisionsradius in Feldern; die Klassen sind XS ≤ 0,3, S ≤ 0,45, M ≤ 0,55, L ≤ 0,65, XL ≤ 0,8, XXL > 0,8.

**Abgrenzung:**
- Container-Karten zeigen fremde Figuren: Koboldbande (Kobolde und Speerkobolde), Rabauken (Rabauke und Rabaukin), Skelettarmee (Skelette), Lakaienhorde (Lakaien), Spirit Empress (zwei Token). Ihre Evos gelten für die enthaltene Figur.
- Formen gehören zur Figur ihrer Karte und werden dort mitgestaltet: `cannon-cart-cannon`, `goblin-demolisher-kamikaze`, `phoenix-egg`, `phoenix-reborn`, `magic-archer-decoy`, `lumberjack-ghost`.
- Keine Figur ist der `hero-turret` (Geschützturm der Musketierin als Heldin). Er bleibt bei den Gebäuden.
- Gebäude ohne Spawn-Funktion (Kanone, Tesla, Mörser, Inferno-Turm, X-Bogen, Bombenturm, Elixiersammler) sind keine Charaktere und bleiben unverändert. Die sechs Gebäude-Spawner bekommen dagegen den Detail-Anspruch der Figuren.

| # | ID | Name | Art | Rolle | Elixier | Größe (Radius) | Ziel | Anzahl | Evo | Besonderheiten / Herkunft |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `archer-queen` | Bogenschützen-Königin | Champion | Fernkampf | 5 | M (0.5) | Boden + Luft | 1 |  |  |
| 2 | `archers` | Bogenschützen | Truppe | Fernkampf | 3 | S (0.4) | Boden + Luft | 2 | ja |  |
| 3 | `baby-dragon` | Drachenbaby | Truppe | Flieger, Fernkampf, Flächenschaden | 4 | L (0.6) | Boden + Luft | 1 | ja |  |
| 4 | `balloon` | Ballon | Truppe | Flieger, Gebäudejäger, Nahkampf | 5 | L (0.6) | Gebäude | 1 |  | Todesschaden |
| 5 | `bandit` | Banditin | Truppe | Nahkampf | 3 | M (0.5) | Boden | 1 |  | Sprint |
| 6 | `barbarians` | Barbaren | Truppe | Nahkampf, Schwarm | 5 | M (0.5) | Boden | 5 | ja |  |
| 7 | `bats` | Fledermäuse | Truppe | Flieger, Nahkampf, Schwarm | 2 | XS (0.3) | Boden + Luft | 5 | ja |  |
| 8 | `battle-healer` | Kampfheilerin | Truppe | Heiler, Nahkampf | 4 | M (0.5) | Boden | 1 |  | heilt beim Landen, heilt beim Angriff |
| 9 | `battle-ram` | Rammbock | Truppe | Kamikaze, Gebäudejäger | 4 | L (0.6) | Gebäude | 1 | ja | Kamikaze, Ansturm, Spawn beim Tod |
| 10 | `berserker` | Berserker | Truppe | Nahkampf | 2 | M (0.5) | Boden | 1 |  |  |
| 11 | `bomber` | Bomber | Truppe | Fernkampf, Flächenschaden | 2 | S (0.4) | Boden | 1 | ja |  |
| 12 | `boss-bandit` | Boss Bandit | Champion | Nahkampf | 6 | M (0.5) | Boden | 1 |  | Sprint |
| 13 | `bowler` | Bowler | Truppe | Fernkampf | 5 | XL (0.75) | Boden | 1 |  | Durchschlag |
| 14 | `cannon-cart` | Kanonenkarre | Truppe | Fernkampf | 5 | L (0.6) | Boden | 1 |  | Formen: cannon-cart-cannon; verwandelt sich |
| 15 | `dark-prince` | Dunkler Prinz | Truppe | Nahkampf, Flächenschaden | 4 | L (0.6) | Boden | 1 |  | Schild, Ansturm, Flusssprung |
| 16 | `dart-goblin` | Blasrohrkobold | Truppe | Fernkampf | 3 | S (0.4) | Boden + Luft | 1 | ja |  |
| 17 | `electro-dragon` | Elektrodrache | Truppe | Flieger, Fernkampf | 5 | L (0.6) | Boden + Luft | 1 | ja | Treffereffekt |
| 18 | `electro-giant` | Elektroriese | Truppe | Gebäudejäger, Tank, Nahkampf | 7 | XL (0.75) | Gebäude | 1 |  | Rückschlag |
| 19 | `electro-spirit` | Elektrogeist | Truppe | Kamikaze | 1 | XS (0.3) | Boden + Luft | 1 |  | Kamikaze, Treffereffekt |
| 20 | `electro-wizard` | Elektromagier | Truppe | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  | mehrere Ziele, Treffereffekt, Landeschaden |
| 21 | `elite-barbarians` | Elitebarbaren | Truppe | Nahkampf | 6 | M (0.5) | Boden | 2 | ja |  |
| 22 | `elixir-golem` | Elixiergolem | Truppe | Gebäudejäger, Nahkampf | 3 | XL (0.75) | Gebäude | 1 |  | Spawn beim Tod, Elixier beim Tod |
| 23 | `executioner` | Scharfrichter | Truppe | Fernkampf | 5 | L (0.6) | Boden + Luft | 1 | ja | Durchschlag |
| 24 | `fire-spirit` | Feuergeist | Truppe | Kamikaze, Flächenschaden | 1 | XS (0.3) | Boden + Luft | 1 |  | Kamikaze |
| 25 | `firecracker` | Feuerwerkerin | Truppe | Fernkampf | 3 | S (0.4) | Boden + Luft | 1 | ja | Splitter, Rückstoß |
| 26 | `fisherman` | Fischer | Truppe | Nahkampf | 3 | M (0.5) | Boden | 1 |  | Haken |
| 27 | `flying-machine` | Flugmaschine | Truppe | Flieger, Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  |  |
| 28 | `furnace` | Ofen | Truppe | Spawner, Fernkampf | 4 | L (0.6) | Boden + Luft | 1 | ja | erzeugt Einheiten |
| 29 | `giant` | Riese | Truppe | Gebäudejäger, Tank, Nahkampf | 5 | XL (0.75) | Gebäude | 1 |  |  |
| 30 | `giant-skeleton` | Riesenskelett | Truppe | Tank, Nahkampf | 6 | XL (0.75) | Boden | 1 |  | Todesschaden |
| 31 | `goblin-demolisher` | Goblin Demolisher | Truppe | Fernkampf, Flächenschaden | 4 | M (0.5) | Boden | 1 |  | Formen: goblin-demolisher-kamikaze; verwandelt sich |
| 32 | `goblin-giant` | Koboldriese | Truppe | Gebäudejäger, Tank, Nahkampf | 6 | XL (0.75) | Gebäude | 1 | ja | Zweitangriff, Spawn beim Tod |
| 33 | `goblin-machine` | Goblin Machine | Truppe | Nahkampf | 5 | XL (0.75) | Boden | 1 |  | Zweitangriff |
| 34 | `goblins` | Kobolde | Truppe | Nahkampf, Schwarm | 2 | S (0.4) | Boden | 4 |  |  |
| 35 | `goblinstein` | Goblinstein | Champion | Fernkampf | 5 | M (0.5) | Boden + Luft | 1 |  | Treffereffekt |
| 36 | `golden-knight` | Goldener Ritter | Champion | Nahkampf | 4 | M (0.5) | Boden | 1 |  |  |
| 37 | `golem` | Golem | Truppe | Gebäudejäger, Tank, Nahkampf | 8 | XXL (0.9) | Gebäude | 1 |  | Todesschaden, Spawn beim Tod |
| 38 | `guards` | Wächter | Truppe | Nahkampf, Schwarm | 3 | S (0.4) | Boden | 3 |  | Schild |
| 39 | `heal-spirit` | Heilungsgeist | Truppe | Kamikaze, Flächenschaden | 1 | XS (0.3) | Boden + Luft | 1 |  | Kamikaze, Zauber beim Tod |
| 40 | `hog-rider` | Schweinereiter | Truppe | Gebäudejäger, Nahkampf | 4 | L (0.6) | Gebäude | 1 |  | Flusssprung |
| 41 | `hunter` | Jäger | Truppe | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 | ja | Streuschuss |
| 42 | `ice-golem` | Eisgolem | Truppe | Gebäudejäger, Nahkampf | 2 | L (0.6) | Gebäude | 1 |  | Todesschaden |
| 43 | `ice-spirit` | Eisgeist | Truppe | Kamikaze, Flächenschaden | 1 | XS (0.3) | Boden + Luft | 1 | ja | Kamikaze, Treffereffekt |
| 44 | `ice-wizard` | Eismagier | Truppe | Fernkampf, Flächenschaden | 3 | M (0.5) | Boden + Luft | 1 |  | Treffereffekt, Landeschaden |
| 45 | `inferno-dragon` | Infernodrache | Truppe | Flieger, Fernkampf | 4 | L (0.6) | Boden + Luft | 1 | ja | Schaden steigt |
| 46 | `knight` | Ritter | Truppe | Nahkampf | 3 | M (0.5) | Boden | 1 | ja |  |
| 47 | `lava-hound` | Lavahund | Truppe | Flieger, Gebäudejäger, Tank, Fernkampf | 7 | XXL (0.9) | Gebäude | 1 |  | Spawn beim Tod |
| 48 | `little-prince` | Little Prince | Champion | Fernkampf | 3 | S (0.4) | Boden + Luft | 1 |  | Tempo steigt |
| 49 | `lumberjack` | Holzfäller | Truppe | Nahkampf | 4 | M (0.5) | Boden | 1 | ja | Formen: lumberjack-ghost; Zauber beim Tod |
| 50 | `magic-archer` | Magieschütze | Truppe | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  | Durchschlag |
| 51 | `mega-knight` | Megaritter | Truppe | Tank, Nahkampf, Flächenschaden | 7 | XL (0.75) | Boden | 1 | ja | Landeschaden, Sprungangriff |
| 52 | `mega-minion` | Megalakai | Truppe | Flieger, Nahkampf | 3 | M (0.5) | Boden + Luft | 1 |  |  |
| 53 | `mighty-miner` | Großer Gräber | Champion | Nahkampf | 4 | L (0.6) | Boden | 1 |  | Schaden steigt |
| 54 | `miner` | Tunnelgräber | Truppe | Nahkampf | 3 | M (0.5) | Boden | 1 |  | überall, gräbt |
| 55 | `mini-pekka` | Mini-P.E.K.K.A. | Truppe | Nahkampf | 4 | M (0.5) | Boden | 1 |  |  |
| 56 | `minion-giant` | Minion Giant | Truppe | Flieger, Gebäudejäger, Fernkampf | 4 | XL (0.75) | Gebäude | 1 |  |  |
| 57 | `minions` | Lakaien | Truppe | Flieger, Fernkampf, Schwarm | 3 | S (0.4) | Boden + Luft | 3 | ja (über minion-horde) |  |
| 58 | `monk` | Mönch | Champion | Nahkampf | 5 | M (0.5) | Boden | 1 |  | Kombo |
| 59 | `mother-witch` | Hexenmutter | Truppe | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  | Treffereffekt |
| 60 | `musketeer` | Musketierin | Truppe | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 | ja |  |
| 61 | `night-witch` | Nachthexe | Truppe | Spawner, Nahkampf | 4 | M (0.5) | Boden | 1 |  | erzeugt Einheiten, Spawn beim Tod |
| 62 | `pekka` | P.E.K.K.A. | Truppe | Tank, Nahkampf | 7 | XL (0.75) | Boden | 1 | ja |  |
| 63 | `phoenix` | Phönix | Truppe | Flieger, Nahkampf | 4 | M (0.5) | Boden + Luft | 1 |  | Formen: phoenix-reborn, phoenix-egg; Todesschaden, Spawn beim Tod |
| 64 | `prince` | Prinz | Truppe | Nahkampf | 5 | L (0.6) | Boden | 1 |  | Ansturm, Flusssprung |
| 65 | `princess` | Prinzessin | Truppe | Fernkampf, Flächenschaden | 3 | S (0.4) | Boden + Luft | 1 | ja |  |
| 66 | `ram-rider` | Widderreiterin | Truppe | Gebäudejäger, Nahkampf | 5 | L (0.6) | Gebäude | 1 |  | Ansturm, Flusssprung, Zweitangriff |
| 67 | `ronin` | Ronin | Truppe | Nahkampf | 5 | M (0.5) | Boden | 1 |  | Parade |
| 68 | `royal-ghost` | Königsgeist | Truppe | Nahkampf, Flächenschaden | 3 | M (0.5) | Boden | 1 | ja | unsichtbar |
| 69 | `royal-giant` | Königsriese | Truppe | Gebäudejäger, Tank, Fernkampf | 6 | XL (0.75) | Gebäude | 1 | ja |  |
| 70 | `royal-hogs` | Königsschweinchen | Truppe | Gebäudejäger, Nahkampf, Schwarm | 5 | S (0.4) | Gebäude | 4 | ja | Flusssprung |
| 71 | `royal-recruits` | Königsrekruten | Truppe | Nahkampf, Schwarm | 7 | M (0.5) | Boden | 6 | ja | Schild |
| 72 | `rune-giant` | Rune Giant | Truppe | Gebäudejäger, Tank, Nahkampf | 4 | XL (0.75) | Gebäude | 1 |  | verzaubert |
| 73 | `skeleton-barrel` | Skelettfass | Truppe | Flieger, Kamikaze, Gebäudejäger | 3 | L (0.6) | Gebäude | 1 | ja | Kamikaze, Todesschaden, Spawn beim Tod |
| 74 | `skeleton-dragons` | Skelettdrachen | Truppe | Flieger, Fernkampf, Flächenschaden | 4 | M (0.5) | Boden + Luft | 2 |  |  |
| 75 | `skeleton-king` | Skelettkönig | Champion | Nahkampf, Flächenschaden | 4 | XL (0.75) | Boden | 1 |  | Seelen |
| 76 | `skeletons` | Skelette | Truppe | Nahkampf, Schwarm | 1 | XS (0.3) | Boden | 3 | ja |  |
| 77 | `sparky` | Funki | Truppe | Fernkampf, Flächenschaden | 6 | XL (0.75) | Boden | 1 |  | lädt auf |
| 78 | `spear-goblins` | Speerkobolde | Truppe | Fernkampf, Schwarm | 2 | S (0.4) | Boden + Luft | 3 |  |  |
| 79 | `suspicious-bush` | Suspicious Bush | Truppe | Kamikaze, Gebäudejäger | 2 | S (0.4) | Gebäude | 1 |  | Kamikaze, unsichtbar, Spawn beim Tod |
| 80 | `three-musketeers` | Drei Musketierinnen | Truppe | Fernkampf, Schwarm | 9 | M (0.5) | Boden + Luft | 3 |  | Nahkampfwechsel |
| 81 | `valkyrie` | Walküre | Truppe | Nahkampf, Flächenschaden | 4 | M (0.5) | Boden | 1 | ja |  |
| 82 | `wall-breakers` | Mauerbrecher | Truppe | Kamikaze, Gebäudejäger, Flächenschaden | 2 | S (0.4) | Gebäude | 2 | ja | Kamikaze |
| 83 | `witch` | Hexe | Truppe | Spawner, Fernkampf, Flächenschaden | 5 | M (0.5) | Boden + Luft | 1 | ja | erzeugt Einheiten |
| 84 | `wizard` | Magier | Truppe | Fernkampf, Flächenschaden | 5 | M (0.5) | Boden + Luft | 1 | ja |  |
| 85 | `zappies` | Zappys | Truppe | Fernkampf, Schwarm | 4 | S (0.4) | Boden + Luft | 3 |  | Treffereffekt |
| 86 | `knight-hero` | Ritter (Held) | Held | Nahkampf | 3 | M (0.5) | Boden | 1 |  | Held von knight |
| 87 | `giant-hero` | Riese (Held) | Held | Gebäudejäger, Tank, Nahkampf | 5 | XL (0.75) | Gebäude | 1 |  | Held von giant |
| 88 | `mini-pekka-hero` | Mini-P.E.K.K.A. (Held) | Held | Nahkampf | 4 | M (0.5) | Boden | 1 |  | Held von mini-pekka |
| 89 | `musketeer-hero` | Musketierin (Held) | Held | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  | Held von musketeer |
| 90 | `ice-golem-hero` | Eisgolem (Held) | Held | Gebäudejäger, Nahkampf | 2 | L (0.6) | Gebäude | 1 |  | Held von ice-golem; Todesschaden |
| 91 | `wizard-hero` | Magier (Held) | Held | Fernkampf, Flächenschaden | 5 | M (0.5) | Boden + Luft | 1 |  | Held von wizard |
| 92 | `goblins-hero` | Kobolde (Held) | Held | Nahkampf, Schwarm | 2 | S (0.4) | Boden | 4 |  | Held von goblins |
| 93 | `mega-minion-hero` | Megalakai (Held) | Held | Flieger, Nahkampf | 3 | M (0.5) | Boden + Luft | 1 |  | Held von mega-minion |
| 94 | `magic-archer-hero` | Magieschütze (Held) | Held | Fernkampf | 4 | M (0.5) | Boden + Luft | 1 |  | Held von magic-archer; Formen: magic-archer-decoy; Durchschlag |
| 95 | `balloon-hero` | Ballon (Held) | Held | Flieger, Gebäudejäger, Nahkampf | 5 | L (0.6) | Gebäude | 1 |  | Held von balloon; Todesschaden |
| 96 | `bowler-hero` | Bowler (Held) | Held | Fernkampf | 5 | XL (0.75) | Boden | 1 |  | Held von bowler; Durchschlag |
| 97 | `dark-prince-hero` | Dunkler Prinz (Held) | Held | Nahkampf, Flächenschaden | 4 | L (0.6) | Boden | 1 |  | Held von dark-prince; Schild, Ansturm, Flusssprung |
| 98 | `berserker-hero` | Berserker (Held) | Held | Nahkampf | 2 | M (0.5) | Boden | 1 |  | Held von berserker |
| 99 | `valkyrie-hero` | Walküre (Held) | Held | Nahkampf, Flächenschaden | 4 | M (0.5) | Boden | 1 |  | Held von valkyrie |
| 100 | `ice-wizard-hero` | Eismagier (Held) | Held | Fernkampf, Flächenschaden | 3 | M (0.5) | Boden + Luft | 1 |  | Held von ice-wizard; Treffereffekt, Landeschaden |
| 101 | `tombstone` | Grabstein | Gebäude-Spawner | Gebäude, Spawner | 3 | XXL (1) | Boden | 1 |  | erzeugt Einheiten, Spawn beim Tod |
| 102 | `tombstone-hero` | Grabstein (Held) | Gebäude-Spawner | Gebäude, Spawner | 3 | XXL (1) | Boden | 1 |  | Held von tombstone; erzeugt Einheiten, Spawn beim Tod |
| 103 | `goblin-hut` | Koboldhütte | Gebäude-Spawner | Gebäude, Spawner | 4 | XXL (1) | Boden | 1 |  | erzeugt Einheiten, Spawn beim Tod |
| 104 | `barbarian-hut` | Barbarenhütte | Gebäude-Spawner | Gebäude, Spawner | 6 | XXL (1) | Boden | 1 |  | erzeugt Einheiten, Spawn beim Tod |
| 105 | `goblin-cage` | Koboldkäfig | Gebäude-Spawner | Gebäude | 4 | XXL (1) | Boden | 1 | ja | Spawn beim Tod |
| 106 | `goblin-drill` | Koboldbohrer | Gebäude-Spawner | Gebäude, Spawner | 4 | XXL (1) | Boden | 1 | ja | überall, Landeschaden, erzeugt Einheiten, Spawn beim Tod |
| 107 | `elixir-golemite` | Elixiergolemit | Beschwörung | Gebäudejäger, Nahkampf | – | M (0.55) | Gebäude | 1 |  | aus elixir-golem; Spawn beim Tod, Elixier beim Tod |
| 108 | `elixir-blob` | Elixierklecks | Beschwörung | Gebäudejäger, Nahkampf | – | S (0.4) | Gebäude | 1 |  | aus elixir-golemite; Elixier beim Tod |
| 109 | `goblinstein-monster` | Monster | Beschwörung | Gebäudejäger, Nahkampf | – | XL (0.75) | Gebäude | 1 |  | aus goblinstein |
| 110 | `golemite` | Golemit | Beschwörung | Gebäudejäger, Nahkampf | – | L (0.6) | Gebäude | 1 |  | aus golem; Todesschaden |
| 111 | `lava-pup` | Lavawelpe | Beschwörung | Flieger, Nahkampf | – | S (0.35) | Boden + Luft | 1 |  | aus lava-hound |
| 112 | `guardienne` | Guardienne | Beschwörung | Nahkampf | – | M (0.5) | Boden | 1 |  | aus little-prince |
| 113 | `cursed-hog` | Fluch-Schwein | Beschwörung | Gebäudejäger, Nahkampf | – | S (0.45) | Gebäude | 1 |  | aus mother-witch; Flusssprung |
| 114 | `rascal-boy` | Rabauke | Beschwörung | Nahkampf | – | M (0.55) | Boden | 1 |  | aus rascals |
| 115 | `rascal-girl` | Rabaukin | Beschwörung | Fernkampf | – | S (0.4) | Boden + Luft | 1 |  | aus rascals |
| 116 | `souldier` | Seelensoldat | Beschwörung | Nahkampf, Flächenschaden | – | S (0.4) | Boden | 1 |  | aus royal-ghost; unsichtbar |
| 117 | `general-gerry` | General Gerry | Beschwörung | Nahkampf | – | S (0.4) | Boden | 1 |  | aus skeleton-army; Schild, Anführer |
| 118 | `shadow-skeleton` | Schattenskelett | Beschwörung | Nahkampf | – | XS (0.3) | Boden | 1 |  | aus skeleton-army; nicht angreifbar, unverwundbar |
| 119 | `spirit-empress-air` | Spirit Empress (Drache) | Beschwörung | Flieger, Fernkampf | – | XL (0.75) | Boden + Luft | 1 |  | aus spirit-empress |
| 120 | `spirit-empress-ground` | Spirit Empress (zu Fuß) | Beschwörung | Nahkampf | – | M (0.5) | Boden | 1 |  | aus spirit-empress |
| 121 | `bush-goblin` | Busch-Kobold | Beschwörung | Nahkampf | – | S (0.4) | Boden | 1 |  | aus suspicious-bush |
| 122 | `wall-breaker-runner` | Läufer | Beschwörung | Kamikaze, Gebäudejäger, Flächenschaden | – | S (0.35) | Gebäude | 1 |  | aus wall-breakers; Kamikaze |
| 123 | `decoy-goblin` | Lockvogel-Kobold | Beschwörung | Nahkampf | – | S (0.35) | Boden | 1 |  | aus goblin-barrel |
| 124 | `goblin-brawler` | Kobold-Raufbold | Beschwörung | Nahkampf | – | M (0.55) | Boden | 1 |  | aus goblin-cage |
| 125 | `skeletrooper` | Skelett-Fallschirmjäger | Beschwörung | Nahkampf | – | S (0.4) | Boden | 1 |  | aus balloon-hero |
| 126 | `rhino` | Nashorn | Beschwörung | Gebäudejäger, Nahkampf | – | L (0.65) | Gebäude | 1 |  | aus dark-prince-hero; Ansturm |
| 127 | `tomb-queen` | Grabkönigin | Beschwörung | Gebäudejäger, Tank, Nahkampf | – | XL (0.75) | Gebäude | 1 |  | aus tombstone-hero |
| 128 | `snowman` | Schneemann | Beschwörung | Unterstützung | – | L (0.6) | Boden | 1 |  | aus ice-wizard-hero; Landeschaden, Frostaura |
| 129 | `tower-king` | König (Königsturm) | Turmfigur | Turmverteidigung | – | XL (0.75) | Boden + Luft | 1 |  |  |
| 130 | `tower-guard` | Turmwache (Prinzessinnenturm) | Turmfigur | Turmverteidigung | – | M (0.5) | Boden + Luft | 1 |  |  |

## 3. Schnittstellen des Renderings (bleiben kompatibel)

| Schnittstelle | Heute | Für den Neubau |
|---|---|---|
| **Größe** | `U = Feldgröße × (0,42 + Radius × 0,8) × look.scale` (Pixel pro Figuren-Einheit), Kollisionsradius aus den Daten | Darstellungsgröße frei pro Figur (Manifest `height`); Kollision und Treffer bleiben bei `radius` aus `cards.json` |
| **Ankerpunkt** | Fußpunkt = Weltposition (`sx`, `sy`); Flieger zusätzlich 1,1 Felder angehoben | gleich; Manifest `anchor` = Fußpunkt im Sprite, `hover` = Schwebehöhe |
| **Richtungen** | vorn bzw. hinten (Rückansicht hochkant beim Laufen nach oben) × gespiegelt (`fx`) | vorn, hinten, gespiegelt |
| **Zustände** | `walk`, `atk` (0–1), `hurt` (0–1), `mood` (`stun`, `sleep`), `lift`, `squash`, `alpha` | `idle`, `walk`, `attack`, `hit`, `spawn`, `death`, `ability`, `stun`, `sleep` mit normierter Zeit |
| **Teamfarbe** | `team` = `blue` oder `red`; Teile färbt `P.team` (Umhang, Schärpe …) | feste Team-Zonen pro Figur, dazu ein formbasiertes Teamsymbol |
| **Ereignisse** | `dp` (Landung), `a` (Angriff), `a2` (Zweitangriff), `h` (Treffer), `hl` (Heilung), `d` (Tod: Typ, Besitzer, Position, fliegt), `ab` (Fähigkeit), `lp`/`th` (Sprung, Wurf), `ch` (Ansturm) … | unverändert; Animation und VFX werden daraus abgeleitet |
| **Flags** (`EF`) | `DEPLOY`, `ATTACK`, `STUN`, `CHARGE`, `DASH`, `JUMP`, `UNDER`, `CLOAK`, `FREEZE`, `CURSE`, `RAGE`, `EVO`, `SLOW`, `REFLECT` | weiter genutzt, zum Beispiel `CHARGE` für die Ansturm-Pose |
| **Aufrufer** | `renderer.drawOne`, `renderer.drawGhost`, `drawTower` (Turmfiguren), `drawCardArt` (Kartenbilder), `game.prewarmUnits` | eine neue Funktion `drawCharacter()` ersetzt `drawUnit()` an allen Stellen |
| **Overlays** | LP-Balken und Abzeichen über `U × 1,95`, Statussymbole (Sterne, Eis), Bodenschatten im Renderer | Balkenhöhe aus Manifest `height`, Schatten und Team-Bodenring gehören zum Figurensystem |

## 4. Performance-Ausgangswert

Gemessen in Chromium 141 ohne GPU (siehe `REPORT.md` Abschnitt 4 und `before_after/perf-after.json`):

| Messung | Desktop 1440×900, CPU 1× | Handy 390×844, CPU 4× |
|---|---|---|
| Extremszene (bis 222 Entitäten), FPS | 39 | 14 |
| Extremszene ohne Figuren (Ablation `units`), FPS | 57 (mit Figuren 43 im selben Lauf) | 26 (mit Figuren 12) |
| Zeichenaufrufe pro Frame (gesamt) | 841 | – |
| Heap | 16,5 MB | 40,8 MB (Sprite-Cache-Budget 40 MB) |
| normales Match, FPS | 60 | 34 (automatische Qualität) bzw. 18 (feste Auflösung) |

- Pro Figur kostet ein Frame heute einen `drawImage` aus dem Sprite-Cache, dazu Schatten, Balken und Abzeichen.
- Neubauten von Sprites (neue Figur, neue Größe) sind auf 8 pro Frame und 6 ms begrenzt.
- Nach dem ersten Auftauchen ist der Aufwand gering, solange der Cache reicht.

## 5. Konsequenzen für den Neubau

1. **Ein Modell pro Figur statt Baukasten-Kombinationen.**
   - Jede Figur bekommt eigene Teile (Kopf, Rumpf, Arme, Beine, Waffe, Signature-Element) als SVG mit Drehpunkten.
   - Gemeinsam bleiben nur Skelett-Vorlagen (Zweibeiner, Vierbeiner, Flieger, Schwebend, Mechanisch, Gebäude) und Hilfsfunktionen für Material-Schattierung.
2. **Gebackene Frames:**
   - Die Teile werden je Figur, Team und Auflösung einmal gerastert.
   - Animationen werden zu Frames gebacken und in Atlanten gelegt.
   - Im Spiel kostet jede Einheit weiterhin einen `drawImage`.
   - Solange ein Frame noch nicht gebacken ist, wird die Figur direkt aus den Vektorteilen gezeichnet; es bleibt nie eine Lücke.
3. **Synchrone Vektorquelle:**
   - Die SVG-Quellen werden beim Start einmal geladen und im Browser zu `Path2D` geparst.
   - Damit entfällt asynchrones Bild-Dekodieren, wenn eine gegnerische Figur zum ersten Mal erscheint.
4. **Neue Zustände:** Treffer-Reaktion, Spawn-Landung, Tod (als kurzlebige Client-Figur nach dem Ereignis `d`), Fähigkeit und Evo kommen hinzu. Der Angriff bekommt eine Ausholbewegung über `hitSpeed` und den Zeitpunkt des letzten Treffers.
5. **Alle Aufrufer wechseln auf das neue System:** Spielfeld, Platzier-Vorschau, Kartenbilder, Turmfiguren, Ladescreen und Menü. Am Ende sind `BODIES`, `WEAPONS`, `HATS`, `humanoid()` und `drawUnit()` entfernt.
