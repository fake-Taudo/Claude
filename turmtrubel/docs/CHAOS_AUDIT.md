# Audit: Modus „Chaos“ (Modifikator-Kampf mit Perks)

Stand vor dem Umbau: Commit `2c2c09e` (Version 1.7). Auftrag: `docs/SPEC_CHAOS.md`.
Ziel des Audits: festhalten, worauf der Chaos-Modus aufsetzt, wo Perks pro Match und Spieler eingreifen können, ohne `cards.json` oder die bestehenden Modi zu verändern, und wie sich eine Auswahlpause sauber in den festen Tick einbauen lässt.

---

## 1. Mode-Framework (vorhanden)

Seit Version 1.5 gibt es ein Mode-Framework. Chaos wird ein weiterer Eintrag darin, kein Sonderweg.

| Baustein | Datei | Was er heute tut |
|---|---|---|
| Modus-Daten | `data/modes.json` | Liste der Modi (`classic`, `infinite-elixir`, `triple-draft`, `mega-draft`, `2v2`) mit `players`, `teams`, `deckSource` (`saved`/`draft`), `botsAllowed`, `multiplayerOnly`, optional `elixir`, `match`, `limits`, `draft`, `bot`, `evos`, Regel-Hinweisen `rules[]` |
| Prüfung und Auflösung | `shared/modes.js` | `validateModes()` prüft das JSON beim Serverstart. `resolveRules(rules, mode)` wendet die Modifikatoren nacheinander auf eine **Kopie** von `rules.json` an (Elixier-Faktor `elixir.rate`, Phasen an/aus, Start-Elixier, Spielzeiten, Evos an/aus, Eingabe-Limit, Teams). Klassisch liefert dasselbe Objekt zurück → klassischer Kampf bleibt bitgenau. |
| Raum und Lobby | `server/rooms.js` `Room` | Der Modus wird beim Erstellen per **ID** gewählt (`create { deck, mode }`, `training { deck, mode, difficulty }`); der Einladungscode gilt für den Raum, der Beitretende übernimmt den Modus des Raums. Ablauf: `lobby → countdown → [draft → reveal] → loading → playing → ended → Rematch`. |
| Deckquelle | `RoomManager.deckFor()` | `saved` = gespeichertes Deck des Spielers (Prüfung `validateDeck`), `draft` = Deck entsteht im Draft. |
| Draft-Phase | `server/draft.js`, `Room.startDraft/armDraft/draftPick/draftTimeout` | Serverseitige Angebote mit Seed, Frist über Wanduhr-Timer des Raums (`room.later`), Bot-Wahl mit menschlicher Bedenkzeit, Auto-Wahl bei Ablauf, Zustand pro Spieler (`draftStateFor`) – auch für Reconnect. |
| Bots | `server/bot.js`, `server/botdraft.js` | Bot läuft serverseitig im Raum vor jedem `match.step()`, spielt über `match.play()` mit denselben Prüfungen wie ein Mensch. Stufen `easy`/`medium`/`hard`. Draft-Wahl je Stufe in `botdraft.js`. |
| Client-Menü | `client/js/ui/modes.js` | Kachel je Modus (Icon, Name, Kurztext, Spielerzahl), Knöpfe „Mit Freunden“ / „Gegen Bot“, Regel-Info (`showModeRules`, einmalig pro Modus, danach abschaltbar). |
| Client-Draft | `client/js/ui/draft.js` | Draft-Bildschirm (Triple/Mega) im Arena-Look. Vorlage für das Perk-Overlay (Angebotskarten, Countdown, Antippen). |

**Folgerung für Chaos:** Neuer Eintrag `chaos` in `modes.json` mit `deckSource: "saved"`, `elixir.multiplier: 1.5` (Phasen bleiben an und multiplizieren sich, das kann `elixirMultiplier()` schon) und einem Verweis auf `data/chaos.json`. Neu sind nur: Kartenpool-Filter für Decks, fester Kartenlevel, Turm-Multiplikator, Auswahlrunden im Kampf und Perks.

Hinweis zur Champion-/Helden-Regel: Turmtrubel erlaubt heute **einen** Spezialplatz pro Deck (Champion **oder** Held, `SPECIAL_SLOT` in `shared/cards.js`). Das ist strenger als „max. 1 Champion und max. 1 Held“ aus dem Auftrag und bleibt im Chaos-Modus unverändert.

## 2. Vollständige Kartenliste

140 Karten in `data/cards.json` (+ 29 Token wie Skelett, Kobold, Golemit). Die Tabelle ist mit `node tools/chaos/card-list.mjs` direkt aus der Kartendatenbank erzeugt (Level 11 = Turnierstandard, wie im Spiel). `cards.json` hat **kein** Rollen-Feld; die Spalte „Rolle“ ist abgeleitet:

- Champion/Held nach `class`, Zauber/Gebäude nach `type` (Gebäude mit Spawner oder Elixier = „erzeugt“, sonst „Abwehr“)
- Truppen: Ziel nur Gebäude → Belagerer; Kamikaze → Geist; ≥ 3 Einheiten → Schwarm; fliegt → Flieger; Leben × Anzahl ≥ 2500 → Tank; Reichweite ≥ 3 → Fernkämpfer; sonst Nahkämpfer

Einheiten: Leben/Schaden in Punkten, Angriff = Sekunden zwischen zwei Angriffen, Reichweite in Feldern, Tempo in Feldern pro Sekunde (0,75 langsam · 1 mittel · 1,5 schnell · 2 sehr schnell). Bei Zaubern steht der Radius in der Spalte Reichweite, Zusatzwerte (Dauer, Betäubung …) unter Besonderheiten.

| Name | ID | Typ | Rolle | Elixier | Seltenheit | Leben | Schaden | Angriff (s) | Reichweite | Tempo | Anzahl | Ziele | Besonderheiten |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Elitebarbaren | elite-barbarians | Truppe | Tank | 6 | Gewöhnlich | 1341 | 384 | 1.40 | 1.20 | 1.50 | 2 | Boden | Evo |
| Riesenskelett | giant-skeleton | Truppe | Tank | 6 | Episch | 3361 | 276 | 1.30 | 0.80 | 1 | 1 | Boden | Todesschaden |
| Megaritter | mega-knight | Truppe | Tank | 7 | Legendär | 3993 | 268 | 1.70 | 1.20 | 1 | 1 | Boden | Fläche 1.30, Landestoß, Sprung, Evo |
| P.E.K.K.A. | pekka | Truppe | Tank | 7 | Episch | 3760 | 842 | 1.80 | 1.20 | 0.75 | 1 | Boden | Evo |
| Berserker | berserker | Truppe | Nahkämpfer | 2 | Gewöhnlich | 896 | 102 | 0.60 | 0.80 | 1.50 | 1 | Boden |  |
| Banditin | bandit | Truppe | Nahkämpfer | 3 | Legendär | 906 | 194 | 1 | 0.75 | 1.50 | 1 | Boden | Sprint |
| Fischer | fisherman | Truppe | Nahkämpfer | 3 | Legendär | 870 | 194 | 1.30 | 1.20 | 1 | 1 | Boden | Haken |
| Königsgeist | royal-ghost | Truppe | Nahkämpfer | 3 | Legendär | 1210 | 261 | 1.80 | 1.20 | 1.50 | 1 | Boden | Fläche 1, Tarnung, Evo |
| Ritter | knight | Truppe | Nahkämpfer | 3 | Gewöhnlich | 1766 | 202 | 1.20 | 1.20 | 1 | 1 | Boden | Evo |
| Tunnelgräber | miner | Truppe | Nahkämpfer | 3 | Legendär | 1210 | 194 | 1.30 | 1.20 | 1.50 | 1 | Boden | Turmschaden ×0.25, überall platzierbar, gräbt sich ein |
| Dunkler Prinz | dark-prince | Truppe | Nahkämpfer | 4 | Episch | 1200 | 266 | 1.40 | 1.20 | 1 | 1 | Boden | Fläche 1.10, Schild, Ansturm, Flusssprung |
| Holzfäller | lumberjack | Truppe | Nahkämpfer | 4 | Legendär | 1282 | 256 | 0.80 | 0.70 | 2 | 1 | Boden | Zauber beim Tod, Evo |
| Kampfheilerin | battle-healer | Truppe | Nahkämpfer | 4 | Selten | 1920 | 268 | 2 | 1.60 | 1 | 1 | Boden | Heilung beim Landen, Heilt beim Angriff |
| Mini-P.E.K.K.A. | mini-pekka | Truppe | Nahkämpfer | 4 | Selten | 1390 | 755 | 1.60 | 0.80 | 1.50 | 1 | Boden |  |
| Nachthexe | night-witch | Truppe | Nahkämpfer | 4 | Legendär | 906 | 314 | 1.30 | 1.60 | 1 | 1 | Boden | Spawner, Spawn beim Tod |
| Walküre | valkyrie | Truppe | Nahkämpfer | 4 | Selten | 1907 | 266 | 1.50 | 1.20 | 1 | 1 | Boden | Fläche 2, Evo |
| Goblin Machine | goblin-machine | Truppe | Nahkämpfer | 5 | Legendär | 2265 | 232 | 1.20 | 1.20 | 1 | 1 | Boden | Zweitangriff |
| Prinz | prince | Truppe | Nahkämpfer | 5 | Episch | 1920 | 391 | 1.40 | 1.60 | 1 | 1 | Boden | Ansturm, Flusssprung |
| Ronin | ronin | Truppe | Nahkämpfer | 5 | Legendär | 1779 | 371 | 1.30 | 1.20 | 1.50 | 1 | Boden | Parade |
| Eisgeist | ice-spirit | Truppe | Geist | 1 | Gewöhnlich | 215 | 110 | 1 | 2.50 | 2 | 1 | Boden & Luft | Fläche 1.50, Kamikaze, Treffer-Effekt, Evo |
| Elektrogeist | electro-spirit | Truppe | Geist | 1 | Gewöhnlich | 215 | 99 | 1 | 2.50 | 2 | 1 | Boden & Luft | Kamikaze, Treffer-Effekt |
| Feuergeist | fire-spirit | Truppe | Geist | 1 | Gewöhnlich | 215 | 215 | 1 | 2.50 | 2 | 1 | Boden & Luft | Fläche 2.30, Kamikaze |
| Heilungsgeist | heal-spirit | Truppe | Geist | 1 | Selten | 215 | 110 | 1 | 2.50 | 2 | 1 | Boden & Luft | Fläche 1.50, Kamikaze, Zauber beim Tod |
| Bomber | bomber | Truppe | Fernkämpfer | 2 | Gewöhnlich | 304 | 212 | 1.80 | 4.50 | 1 | 1 | Boden | Fläche 1.50, Geschoss, Evo |
| Blasrohrkobold | dart-goblin | Truppe | Fernkämpfer | 3 | Selten | 261 | 156 | 0.80 | 6.50 | 2 | 1 | Boden & Luft | Geschoss, Evo |
| Bogenschützen | archers | Truppe | Fernkämpfer | 3 | Gewöhnlich | 304 | 112 | 0.90 | 5 | 1 | 2 | Boden & Luft | Geschoss, Evo |
| Eismagier | ice-wizard | Truppe | Fernkämpfer | 3 | Legendär | 688 | 89 | 1.70 | 5.50 | 1 | 1 | Boden & Luft | Fläche 1.50, Geschoss, Treffer-Effekt, Landestoß |
| Feuerwerkerin | firecracker | Truppe | Fernkämpfer | 3 | Gewöhnlich | 304 | 64 | 3 | 6 | 1.50 | 1 | Boden & Luft | Geschoss, Splitter, Rückstoß, Evo |
| Prinzessin | princess | Truppe | Fernkämpfer | 3 | Legendär | 261 | 168 | 3 | 9 | 1 | 1 | Boden & Luft | Fläche 2, Geschoss, Evo |
| Elektromagier | electro-wizard | Truppe | Fernkämpfer | 4 | Legendär | 714 | 115 | 1.80 | 5 | 1.50 | 1 | Boden & Luft | Geschoss, Mehrfachziel, Treffer-Effekt, Landestoß |
| Goblin Demolisher | goblin-demolisher | Truppe | Fernkämpfer | 4 | Selten | 1300 | 186 | 1.20 | 5 | 1 | 1 | Boden | Fläche 1.50, Geschoss, Verwandlung |
| Hexenmutter | mother-witch | Truppe | Fernkämpfer | 4 | Legendär | 529 | 133 | 1 | 5.50 | 1 | 1 | Boden & Luft | Geschoss, Treffer-Effekt |
| Jäger | hunter | Truppe | Fernkämpfer | 4 | Episch | 885 | 84 | 2.20 | 4 | 1 | 1 | Boden & Luft | Geschoss, Streuschuss, Evo |
| Magieschütze | magic-archer | Truppe | Fernkämpfer | 4 | Legendär | 529 | 133 | 1.10 | 7 | 1 | 1 | Boden & Luft | Geschoss, Durchschlag |
| Musketierin | musketeer | Truppe | Fernkämpfer | 4 | Selten | 721 | 217 | 1 | 6 | 1 | 1 | Boden & Luft | Geschoss, Evo |
| Ofen | furnace | Truppe | Fernkämpfer | 4 | Selten | 727 | 179 | 1.70 | 6 | 1 | 1 | Boden & Luft | Geschoss, Spawner, Evo |
| Bowler | bowler | Truppe | Fernkämpfer | 5 | Episch | 2081 | 289 | 2.50 | 4 | 0.75 | 1 | Boden | Geschoss, Durchschlag |
| Hexe | witch | Truppe | Fernkämpfer | 5 | Episch | 839 | 135 | 1.10 | 5.50 | 1 | 1 | Boden & Luft | Fläche 1.50, Geschoss, Spawner, Evo |
| Kanonenkarre | cannon-cart | Truppe | Fernkämpfer | 5 | Episch | 1809 | 212 | 0.90 | 5.50 | 1 | 1 | Boden | Geschoss, Verwandlung |
| Magier | wizard | Truppe | Fernkämpfer | 5 | Selten | 832 | 304 | 1.40 | 5.50 | 1 | 1 | Boden & Luft | Fläche 1.50, Geschoss, Evo |
| Scharfrichter | executioner | Truppe | Fernkämpfer | 5 | Episch | 1280 | 168 | 2.40 | 4.50 | 1 | 1 | Boden & Luft | Geschoss, Durchschlag, Evo |
| Funki | sparky | Truppe | Fernkämpfer | 6 | Legendär | 1451 | 1331 | 4 | 5 | 0.75 | 1 | Boden | Fläche 1.80, Geschoss, Aufladen |
| Skelette | skeletons | Truppe | Schwarm | 1 | Gewöhnlich | 81 | 81 | 1.10 | 0.50 | 1.50 | 3 | Boden | Evo |
| Fledermäuse | bats | Truppe | Schwarm | 2 | Gewöhnlich | 81 | 81 | 1.30 | 1.20 | 2 | 5 | Boden & Luft | fliegt, Evo |
| Kobolde | goblins | Truppe | Schwarm | 2 | Gewöhnlich | 202 | 125 | 1.10 | 0.50 | 2 | 4 | Boden |  |
| Speerkobolde | spear-goblins | Truppe | Schwarm | 2 | Gewöhnlich | 133 | 81 | 1.60 | 5 | 2 | 3 | Boden & Luft | Geschoss |
| Koboldgang | goblin-gang | Truppe | Schwarm | 3 | Gewöhnlich | 202 | 125 | 1.10 | 0.50 | 2 | 6 (3× Kobolde, 3× Speerkobolde) | Boden |  |
| Lakaien | minions | Truppe | Schwarm | 3 | Gewöhnlich | 230 | 107 | 1.20 | 2.50 | 1.50 | 3 | Boden & Luft | fliegt, Geschoss |
| Skelettarmee | skeleton-army | Truppe | Schwarm | 3 | Episch | 81 | 81 | 1.10 | 0.50 | 1.50 | 15 | Boden | Evo |
| Wächter | guards | Truppe | Schwarm | 3 | Episch | 81 | 117 | 1 | 1.60 | 1.50 | 3 | Boden | Schild |
| Zappys | zappies | Truppe | Schwarm | 4 | Selten | 529 | 117 | 2.30 | 4.50 | 1 | 3 | Boden & Luft | Geschoss, Treffer-Effekt |
| Barbaren | barbarians | Truppe | Schwarm | 5 | Gewöhnlich | 716 | 192 | 1.40 | 0.70 | 1 | 5 | Boden | Evo |
| Lakaienhorde | minion-horde | Truppe | Schwarm | 5 | Gewöhnlich | 230 | 107 | 1.20 | 2.50 | 1.50 | 6 | Boden & Luft | fliegt, Geschoss, Evo |
| Rabauken | rascals | Truppe | Schwarm | 5 | Gewöhnlich | 1868 | 217 | 1.50 | 0.80 | 1 | 3 (1× Rabauke, 2× Rabaukin) | Boden |  |
| Königsrekruten | royal-recruits | Truppe | Schwarm | 7 | Gewöhnlich | 547 | 133 | 1.30 | 1.60 | 1 | 6 | Boden | Schild, Evo |
| Drei Musketierinnen | three-musketeers | Truppe | Schwarm | 9 | Selten | 883 | 204 | 1.30 | 6 | 1 | 3 | Boden & Luft | Geschoss, Nahkampf |
| Megalakai | mega-minion | Truppe | Flieger | 3 | Selten | 837 | 312 | 1.50 | 1.60 | 1 | 1 | Boden & Luft | fliegt, Geschoss |
| Drachenbaby | baby-dragon | Truppe | Flieger | 4 | Episch | 1152 | 168 | 1.50 | 3.50 | 1.50 | 1 | Boden & Luft | fliegt, Fläche 1.50, Geschoss, Evo |
| Flugmaschine | flying-machine | Truppe | Flieger | 4 | Selten | 614 | 171 | 1.10 | 6 | 1.50 | 1 | Boden & Luft | fliegt, Geschoss |
| Infernodrache | inferno-dragon | Truppe | Flieger | 4 | Legendär | 1295 | 35 | 0.40 | 3.50 | 1 | 1 | Boden & Luft | fliegt, Geschoss, Strahl steigt, Evo |
| Phönix | phoenix | Truppe | Flieger | 4 | Legendär | 1052 | 217 | 1 | 1.60 | 1 | 1 | Boden & Luft | fliegt, Todesschaden, Spawn beim Tod |
| Skelettdrachen | skeleton-dragons | Truppe | Flieger | 4 | Gewöhnlich | 560 | 161 | 2 | 3.50 | 1.50 | 2 | Boden & Luft | fliegt, Fläche 1.50, Geschoss |
| Elektrodrache | electro-dragon | Truppe | Flieger | 5 | Episch | 1049 | 192 | 2.30 | 3.50 | 1 | 1 | Boden & Luft | fliegt, Geschoss, Treffer-Effekt, Evo |
| Spirit Empress | spirit-empress | Truppe | Flieger | 6 | Legendär | 1121 | 320 | 1.40 | 5 | 1 | 1 | Boden & Luft | fliegt, Geschoss, Formen je Elixier |
| Eisgolem | ice-golem | Truppe | Belagerer | 2 | Selten | 1228 | 84 | 2.50 | 0.75 | 0.75 | 1 | Gebäude | Todesschaden |
| Mauerbrecher | wall-breakers | Truppe | Belagerer | 2 | Episch | 330 | 391 | 1 | 0.50 | 2 | 2 | Gebäude | Fläche 1.50, Kamikaze, Evo |
| Suspicious Bush | suspicious-bush | Truppe | Belagerer | 2 | Selten | 90 | 0 | 1 | 1.60 | 1 | 1 | Gebäude | Kamikaze, Tarnung, Spawn beim Tod |
| Elixiergolem | elixir-golem | Truppe | Belagerer | 3 | Selten | 1569 | 253 | 1.10 | 0.80 | 0.75 | 1 | Gebäude | Spawn beim Tod, Elixier beim Tod |
| Skelettfass | skeleton-barrel | Truppe | Belagerer | 3 | Gewöhnlich | 532 | 0 | 1 | 0.35 | 1.50 | 1 | Gebäude | fliegt, Kamikaze, Todesschaden, Spawn beim Tod, Evo |
| Minion Giant | minion-giant | Truppe | Belagerer | 4 | Selten | 1817 | 150 | 1.50 | 4 | 1 | 1 | Gebäude | fliegt, Geschoss |
| Rammbock | battle-ram | Truppe | Belagerer | 4 | Selten | 967 | 286 | 1 | 0.50 | 1 | 1 | Gebäude | Kamikaze, Ansturm, Spawn beim Tod, Evo |
| Rune Giant | rune-giant | Truppe | Belagerer | 4 | Episch | 2816 | 120 | 1.50 | 1.20 | 1 | 1 | Gebäude | Verzauberung |
| Schweinereiter | hog-rider | Truppe | Belagerer | 4 | Selten | 1697 | 317 | 1.60 | 0.80 | 2 | 1 | Gebäude | Flusssprung |
| Ballon | balloon | Truppe | Belagerer | 5 | Episch | 1679 | 640 | 2 | 0.10 | 1 | 1 | Gebäude | fliegt, Todesschaden |
| Königsschweinchen | royal-hogs | Truppe | Belagerer | 5 | Selten | 837 | 74 | 1.20 | 0.70 | 2 | 4 | Gebäude | Flusssprung, Evo |
| Riese | giant | Truppe | Belagerer | 5 | Selten | 3968 | 253 | 1.50 | 1.20 | 0.75 | 1 | Gebäude |  |
| Widderreiterin | ram-rider | Truppe | Belagerer | 5 | Legendär | 1766 | 250 | 1.70 | 0.80 | 1 | 1 | Gebäude | Ansturm, Flusssprung, Zweitangriff |
| Koboldriese | goblin-giant | Truppe | Belagerer | 6 | Episch | 3022 | 176 | 1.50 | 1.20 | 1 | 1 | Gebäude | Zweitangriff, Spawn beim Tod, Evo |
| Königsriese | royal-giant | Truppe | Belagerer | 6 | Gewöhnlich | 3164 | 307 | 1.80 | 5 | 0.75 | 1 | Gebäude | Geschoss, Evo |
| Elektroriese | electro-giant | Truppe | Belagerer | 7 | Episch | 3952 | 184 | 1.80 | 1.20 | 0.75 | 1 | Gebäude | Gegenschlag |
| Lavahund | lava-hound | Truppe | Belagerer | 7 | Legendär | 3581 | 53 | 1.30 | 3.50 | 0.75 | 1 | Gebäude | fliegt, Geschoss, Spawn beim Tod |
| Golem | golem | Truppe | Belagerer | 8 | Episch | 5120 | 312 | 2.50 | 0.75 | 0.75 | 1 | Gebäude | Todesschaden, Spawn beim Tod |
| Kanone | cannon | Gebäude | Gebäude (Abwehr) | 3 | Gewöhnlich | 824 | 202 | 1 | 5.50 | – | 1 | Boden | Geschoss, Lebensdauer 30 s, Evo |
| Bombenturm | bomb-tower | Gebäude | Gebäude (Abwehr) | 4 | Selten | 1356 | 222 | 1.80 | 6 | – | 1 | Boden | Fläche 1.50, Geschoss, Lebensdauer 30 s, Todesschaden |
| Koboldkäfig | goblin-cage | Gebäude | Gebäude (Abwehr) | 4 | Selten | 780 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 20 s, Spawn beim Tod, Evo |
| Minenwerfer | mortar | Gebäude | Gebäude (Abwehr) | 4 | Gewöhnlich | 1369 | 266 | 4.70 | 11.50 | – | 1 | Boden | Fläche 2, Geschoss, Lebensdauer 30 s, Evo |
| Tesla | tesla | Gebäude | Gebäude (Abwehr) | 4 | Gewöhnlich | 1152 | 220 | 1.10 | 5.50 | – | 1 | Boden & Luft | Geschoss, Lebensdauer 25 s, versteckt, Evo |
| Infernoturm | inferno-tower | Gebäude | Gebäude (Abwehr) | 5 | Selten | 1748 | 43 | 0.40 | 6 | – | 1 | Boden & Luft | Geschoss, Lebensdauer 30 s, Strahl steigt |
| X-Bogen | x-bow | Gebäude | Gebäude (Abwehr) | 6 | Episch | 1600 | 58 | 0.40 | 11.50 | – | 1 | Boden | Geschoss, Lebensdauer 30 s |
| Grabstein | tombstone | Gebäude | Gebäude (erzeugt) | 3 | Selten | 529 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 30 s, Spawner, Spawn beim Tod |
| Koboldbohrer | goblin-drill | Gebäude | Gebäude (erzeugt) | 4 | Episch | 1313 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 10 s, überall platzierbar, Landestoß, Spawner, Spawn beim Tod, Evo |
| Koboldhütte | goblin-hut | Gebäude | Gebäude (erzeugt) | 4 | Selten | 1228 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 30 s, Spawner, Spawn beim Tod |
| Barbarenhütte | barbarian-hut | Gebäude | Gebäude (erzeugt) | 6 | Selten | 1164 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 30 s, Spawner, Spawn beim Tod |
| Elixiersammler | elixir-collector | Gebäude | Gebäude (erzeugt) | 6 | Selten | 1070 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 93 s, Elixier-Erzeuger, Elixier beim Tod (selbst) |
| Spiegel | mirror | Zauber | Zauber | ? | Episch | – | – | – | – | – | – | – | mirror |
| Barbarenfass | barbarian-barrel | Zauber | Zauber | 2 | Episch | – | 230 | – | – | – | – | Boden | roll, towerDamage 0.50, knockback 0.60, ownSide, spawnAtEnd |
| Goblin Curse | goblin-curse | Zauber | Zauber | 2 | Episch | – | 35 | – | Radius 3 | – | – | Boden & Luft | duration 6, pulse 1, towerDamage 0.29, slow, curse |
| Kampfholz | the-log | Zauber | Zauber | 2 | Legendär | – | 266 | – | – | – | – | Boden | roll, towerDamage 0.15, knockback 1.20, ownSide |
| Knall | zap | Zauber | Zauber | 2 | Gewöhnlich | – | 192 | – | Radius 2.50 | – | – | Boden & Luft | towerDamage 0.30, stun 0.50, Evo |
| Schneeball | giant-snowball | Zauber | Zauber | 2 | Gewöhnlich | – | 179 | – | Radius 2.50 | – | – | Boden & Luft | towerDamage 0.30, knockback 1, slow, Evo |
| Wut | rage | Zauber | Zauber | 2 | Episch | – | 179 | – | Radius 3 | – | – | Boden & Luft | duration 4.50, towerDamage 0.30, rage, delay 0.50 |
| Erdbeben | earthquake | Zauber | Zauber | 3 | Selten | – | 84 | – | Radius 3.50 | – | – | Boden | duration 3, pulse 1, towerDamage 0.63, buildingDamage 287, slow |
| Klonzauber | clone | Zauber | Zauber | 3 | Episch | – | – | – | Radius 3 | – | – | own | clone |
| Koboldfass | goblin-barrel | Zauber | Zauber | 3 | Episch | – | – | – | Radius 1.50 | – | – | – | spawn, Evo |
| Königliche Luftpost | royal-delivery | Zauber | Zauber | 3 | Gewöhnlich | – | 384 | – | Radius 3 | – | – | Boden & Luft | delay 3, towerDamage 0, ownSide, spawn |
| Pfeile | arrows | Zauber | Zauber | 3 | Gewöhnlich | – | 122 | – | Radius 3.50 | – | – | Boden & Luft | towerDamage 0.25, waves 3, waveInterval 0.25 |
| Tornado | tornado | Zauber | Zauber | 3 | Episch | – | 42 | – | Radius 5.50 | – | – | Boden & Luft | duration 1.05, pulse 0.55, towerDamage 0.34, pull |
| Vines | vines | Zauber | Zauber | 3 | Episch | – | 153 | – | Radius 2.50 | – | – | Boden & Luft | delay 0.90, vines, towerDamage 0.26 |
| Feuerball | fireball | Zauber | Zauber | 4 | Selten | – | 688 | – | Radius 2.50 | – | – | Boden & Luft | towerDamage 0.23, knockback 1 |
| Frost | freeze | Zauber | Zauber | 4 | Episch | – | 115 | – | Radius 3 | – | – | Boden & Luft | towerDamage 0.30, stun 3.50, freeze |
| Gift | poison | Zauber | Zauber | 4 | Episch | – | 92 | – | Radius 3.50 | – | – | Boden & Luft | duration 8, pulse 1, towerDamage 0.24, slow |
| Friedhof | graveyard | Zauber | Zauber | 5 | Legendär | – | – | – | Radius 4 | – | – | – | duration 9, graveyard |
| Void | void | Zauber | Zauber | 5 | Episch | – | – | – | Radius 2.50 | – | – | Boden & Luft | duration 3, pulse 1, voidTiers |
| Blitz | lightning | Zauber | Zauber | 6 | Episch | – | 1057 | – | Radius 3.50 | – | – | Boden & Luft | towerDamage 0.27, strikes 3, stun 0.50 |
| Rakete | rocket | Zauber | Zauber | 6 | Selten | – | 1484 | – | Radius 2 | – | – | Boden & Luft | towerDamage 0.25, knockback 1 |
| Little Prince | little-prince | Truppe (Champion) | Champion | 3 | Champion | 698 | 104 | 1.20 | 5.50 | 1 | 1 | Boden & Luft | Geschoss, Angriff steigt, Fähigkeit „Königliche Rettung“ |
| Goldener Ritter | golden-knight | Truppe (Champion) | Champion | 4 | Champion | 1799 | 161 | 0.90 | 1.20 | 1 | 1 | Boden | Fähigkeit „Schnellsprung“ |
| Großer Gräber | mighty-miner | Truppe (Champion) | Champion | 4 | Champion | 2250 | 43 | 0.40 | 1.60 | 1 | 1 | Boden | Geschoss, Strahl steigt, Fähigkeit „Explosive Flucht“ |
| Skelettkönig | skeleton-king | Truppe (Champion) | Champion | 4 | Champion | 2298 | 204 | 1.60 | 1.20 | 1 | 1 | Boden | Fläche 1.30, Seelen, Fähigkeit „Seelenruf“ |
| Bogenschützen-Königin | archer-queen | Truppe (Champion) | Champion | 5 | Champion | 1000 | 232 | 1.20 | 5 | 1 | 1 | Boden & Luft | Geschoss, Fähigkeit „Tarnumhang“ |
| Goblinstein | goblinstein | Truppe (Champion) | Champion | 5 | Champion | 721 | 135 | 1.80 | 5.50 | 1 | 2 (1× Goblinstein, 1× Monster) | Boden & Luft | Geschoss, Treffer-Effekt, Fähigkeit „Blitzverbindung“ |
| Mönch | monk | Truppe (Champion) | Champion | 5 | Champion | 2214 | 140 | 0.80 | 1.20 | 1 | 1 | Boden | Kombo, Fähigkeit „Nachdenklicher Schutz“ |
| Boss Bandit | boss-bandit | Truppe (Champion) | Champion | 6 | Champion | 2624 | 244 | 1.10 | 0.80 | 1.50 | 1 | Boden | Sprint, Fähigkeit „Fluchtgranate“ |
| Barbarenfass (Held) | barbarian-barrel-hero | Zauber (Held) | Held | 2 | Episch | – | 230 | – | – | – | – | Boden | roll, towerDamage 0.50, knockback 0.60, ownSide, spawnAtEnd |
| Berserker (Held) | berserker-hero | Truppe (Held) | Held | 2 | Gewöhnlich | 896 | 102 | 0.60 | 0.80 | 1.50 | 1 | Boden | Fähigkeit „Wilde Wut“ |
| Eisgolem (Held) | ice-golem-hero | Truppe (Held) | Held | 2 | Selten | 1228 | 84 | 2.50 | 1.20 | 0.75 | 1 | Gebäude | Todesschaden, Fähigkeit „Schneesturm“ |
| Kobolde (Held) | goblins-hero | Truppe (Held) | Held | 2 | Gewöhnlich | 202 | 125 | 1.10 | 0.50 | 2 | 4 | Boden | Fähigkeit „Bannerbrigade“ |
| Eismagier (Held) | ice-wizard-hero | Truppe (Held) | Held | 3 | Legendär | 688 | 89 | 1.70 | 5.50 | 1 | 1 | Boden & Luft | Fläche 1.50, Geschoss, Treffer-Effekt, Landestoß, Fähigkeit „Frostkerl“ |
| Grabstein (Held) | tombstone-hero | Gebäude (Held) | Held | 3 | Selten | 529 | 0 | 1 | 0.60 | – | 1 | Boden | Lebensdauer 30 s, Spawner, Spawn beim Tod, Fähigkeit „Königliche Wiederkehr“ |
| Megalakai (Held) | mega-minion-hero | Truppe (Held) | Held | 3 | Selten | 837 | 312 | 1.50 | 1.60 | 1 | 1 | Boden & Luft | fliegt, Geschoss, Fähigkeit „Verwundender Sprung“ |
| Ritter (Held) | knight-hero | Truppe (Held) | Held | 3 | Gewöhnlich | 1766 | 202 | 1.20 | 1.20 | 1 | 1 | Boden | Fähigkeit „Triumphaler Spott“ |
| Dunkler Prinz (Held) | dark-prince-hero | Truppe (Held) | Held | 4 | Episch | 1200 | 266 | 1.40 | 1.20 | 1 | 1 | Boden | Fläche 1.10, Schild, Ansturm, Flusssprung, Fähigkeit „Zerstörerischer Absprung“ |
| Magieschütze (Held) | magic-archer-hero | Truppe (Held) | Held | 4 | Legendär | 529 | 133 | 1.10 | 7 | 1 | 1 | Boden & Luft | Geschoss, Durchschlag, Fähigkeit „Dreifachgefahr“ |
| Mini-P.E.K.K.A. (Held) | mini-pekka-hero | Truppe (Held) | Held | 4 | Selten | 1433 | 755 | 1.60 | 0.80 | 1.50 | 1 | Boden | Fähigkeit „Pfannkuchen-Power“ |
| Musketierin (Held) | musketeer-hero | Truppe (Held) | Held | 4 | Selten | 721 | 217 | 1 | 6 | 1 | 1 | Boden & Luft | Geschoss, Fähigkeit „Treuer Geschützturm“ |
| Walküre (Held) | valkyrie-hero | Truppe (Held) | Held | 4 | Selten | 1907 | 266 | 1.50 | 1.20 | 1 | 1 | Boden | Fläche 2, Fähigkeit „Wilder Wirbelwind“ |
| Ballon (Held) | balloon-hero | Truppe (Held) | Held | 5 | Episch | 1679 | 640 | 2 | 0.10 | 1 | 1 | Gebäude | fliegt, Todesschaden, Fähigkeit „Sargkadetten“ |
| Bowler (Held) | bowler-hero | Truppe (Held) | Held | 5 | Episch | 2081 | 289 | 2.50 | 4 | 0.75 | 1 | Boden | Geschoss, Durchschlag, Fähigkeit „Steinwurf“ |
| Magier (Held) | wizard-hero | Truppe (Held) | Held | 5 | Selten | 832 | 304 | 1.40 | 5.50 | 1 | 1 | Boden & Luft | Fläche 1.50, Geschoss, Fähigkeit „Feuriger Flug“ |
| Riese (Held) | giant-hero | Truppe (Held) | Held | 5 | Selten | 3968 | 253 | 1.50 | 1.20 | 0.75 | 1 | Gebäude | Fähigkeit „Heldenwurf“ |

## 3. Server-Simulation

### Aufbau

- **Fester Tick:** `rules.tickRate = 20` (50 ms). `server/index.js` ruft `mgr.tick()` mit Drift-Ausgleich auf (max. 4 Nachhol-Ticks), `RoomManager.tick()` → `Room.tick()` nur für Räume im Zustand `playing`: zuerst alle Bots (`bot.update()`), dann `match.step()`, dann Snapshots an alle Menschen.
- **Zeit ist Tick-Zeit:** `match.time = tick × dt`. Spielzeit, Elixier, Abklingzeiten, Handkarten-Bereitschaft, Fähigkeiten, Eingabe-Limit und Bot-Entscheidungen hängen ausschließlich an `match.time`. Wird `step()` nicht aufgerufen, steht alles still – das ist die Grundlage für die Auswahlpause.
- **`server/sim/match.js`** (Kern: Aufbau, Tick, Eingaben, Snapshots) plus Mixins `combat.js` (Zielwahl, Angriff, Geschosse, Schaden, Status), `motion.js` (Bewegung, Wegfindung, Kollision), `spells.js` (Zauberzonen), `traits.js` (Eigenschaften, Spawner, Tod), `abilities.js` (Champion-/Heldenfähigkeiten).
- **Zustand pro Einheit:** ein Objekt aus `addEntity()` mit `def` (aufgelöste Kartenwerte), `owner` (Team), `pl` (Spieler), `cardId`, Leben/Schild, Kampf-, Status-, Bewegungs- und Fähigkeitsfeldern sowie `buffs[]` (zeitlich begrenzte Multiplikatoren wie `attackSpeed`, `speedMult`, `damageTaken`).
- **Event-System für VFX:** `match.events` sammelt pro Tick kurze Arrays (`['pl', …]` Karte gespielt, `['d', …]` Tod, `['bl', …]` Flächeneffekt, `['ab', …]` Fähigkeit, `['el', …]` Elixier usw.), die mit dem Snapshot verschickt und im Client von `game.js`/VFX-System in Effekte übersetzt werden. Ein neues Ereignis (z. B. `['pk', …]` Perk gewählt) fügt sich ohne Protokollbruch ein.

### Wo Kartenwerte zur Laufzeit herkommen

1. `createDb(raw, { level })` (`shared/cards.js`) baut einmal pro Server die Datenbank, skaliert Leben/Schaden auf den Level (`levelFactor`: ±10 % pro Level) und lässt die Rohdaten unverändert; `cards.json` wird zur Laufzeit nie verändert.
2. `db.unit(ref, evo, levelBonus)` löst eine Einheit in flache Werte auf (`resolveUnit`: Standardwerte + Karte + Evo) und **cacht** das Ergebnis. Alle Einheiten derselben Karte teilen sich dieses `def`-Objekt.
3. `Match.spawnCard()` holt `def` aus `db.unit(…)` und gibt es an `addEntity()`. Folge-Einheiten (Spawner, Todes-Spawns, Zauber-Spawns) holen ihre Token-Werte ebenfalls über `db.unit(token)`.
4. Zauber lesen `card.spell` direkt (`db.spell(card, evo)`), `castSpell()` legt daraus Zonen an.

**Perks pro Match und Spieler – ohne `cards.json` zu berühren:** Weil `def` ein gecachtes, geteiltes Objekt ist, darf ein Perk es nie verändern. Stattdessen bekommt jedes Match eine **Perk-Tabelle `perks[pl][cardId]`** und einen eigenen Cache. An genau drei Stellen wird statt des geteilten Objekts eine **Matchkopie** verwendet:

| Stelle | Heute | Mit Perk |
|---|---|---|
| `spawnCard()` → `db.unit(ref, evo, levelBonus)` | geteiltes `def` | `perkedUnit(pl, card, ref, …)` = `structuredClone(def)` + Perk-Parameter, gecacht pro Spieler/Karte/Perk-Stand |
| Folge-Einheiten der Karte (`deathSpawn`, `spawner`, `spawn` von Zaubern) | `db.unit(token)` | gleiche Funktion, wenn der Perk die Folge-Einheit betrifft (z. B. „Kobolde der Hütte mit Schild“) |
| `castSpell()` → `db.spell(card, evo)` | geteilte Zauberwerte | Kopie + Perk-Parameter |

Fast alle Perk-Ideen lassen sich als **Zusammenführen von Werten** ausdrücken, weil die Simulation bereits 71 wiederverwendbare Eigenschaften (`traits`) kennt (siehe Abschnitt 7). Beispiel: „Riese hinterlässt beim Tod eine Explosion“ = `traits.deathDamage` aus dem Ballon in die Matchkopie des Riesen schreiben. Der vorhandene Code in `traits.js` führt sie dann aus, ohne neuen Einzelcode pro Karte.

Der **feste Kartenlevel** (`fixedLevel`) braucht keine neue Logik: Für einen abweichenden Level erzeugt der Server eine zweite Datenbank `createDb(raw, { level })` (einmal pro Level, gecacht). Die Typ-Indizes bleiben gleich, weil die Kartenliste dieselbe ist. Bei Level 11 (Standard) wird die vorhandene Datenbank verwendet.

### Eingaben und Prüfungen

`match.play(pl, slot, cardId, x, y)` prüft: Kampf läuft, Platz gültig, Karte auf der Hand, Karte bereit, Elixier, Platzierung, Einheiten-Limit, Eingabe-Limit. `useAbility` und `emote` analog. Für Chaos kommt hinzu: **keine Eingaben während der Pause** (neuer Ablehnungscode) und **Pool-Prüfung beim Deck** (Lobby, nicht im Kampf – eine Karte außerhalb des Pools kann nie auf die Hand kommen).

## 4. Türme, Elixier, Zeit – wo die Werte stehen

| Wert | Ort | Heute | Chaos |
|---|---|---|---|
| Turm-Leben | `rules.json` → `towers.princess.hp` 3000, `towers.king.hp` 4800 | `Match.createTowers()` liest `rules.towers[…].hp` | `resolveRules` multipliziert mit `towerHpMultiplier` (2 → 6000 / 9600). Snapshot trägt `maxHp` je Entität → Lebensleisten skalieren automatisch. |
| Turm-Schaden/Reichweite | `rules.json` `towers.*` | unverändert | unverändert |
| Kartenlevel | `rules.json` `cardLevel` 11 | `createDb(level)` | `fixedLevel` aus `chaos.json` |
| Start-Elixier / Maximum | `rules.json` `elixir.start` 5, `elixir.max` 10 | – | unverändert |
| Elixier-Regeneration | `elixir.regenSeconds` 2,8 | `updateElixir()`: `elixirMultiplier() / regenSeconds` pro Sekunde | `elixirMultiplier()` = `rate × Phase` – mit `rate = 1.5` ergibt sich 1,5 / 3 / 4,5. Das ist **bereits so implementiert** (Unendlich-Elixier nutzt `rate` mit `phases: false`). |
| Doppel-/Dreifach-Elixier | `doubleElixirLastSeconds` 60, `doubleMultiplier` 2, `overtimeMultiplier` 3 | Phase aus `match.time` | unverändert, multipliziert sich mit 1,5 |
| Spielzeit / Verlängerung | `regularSeconds` 180, `overtimeSeconds` 120, `suddenDeath: firstCrown` | `updateClock()`, `checkEnd()`, `finishByScore()` | unverändert |
| Snapshot-Zeit | `t` (Sim-Zeit), `tl` (Restzeit), `ph`, `em` | Client interpoliert und zählt `tl` lokal weiter | während der Pause eingefroren (siehe 6) |

## 5. Netzwerkprotokoll (Version 2)

Vollständig dokumentiert in `docs/PROTOCOL.md`, definiert in `shared/protocol.js`.

- **Client → Server:** `hello`, `create`, `join`, `training`, `leave`, `deck`, `ready`, `loaded`, `play`, `ability`, `emote`, `rematch`, `surrender`, `ping`, `name`, `seat`, `move`, `kick`, `draftPick`, `mapPing`.
- **Server → Client:** `welcome`, `error`, `lobby`, `countdown`, `matchInit`, `matchStart`, `s` (Snapshot), `reject`, `matchEnd`, `rematchState`, `pong`, `roomClosed`, `notice`, `presence`, `draft`, `draftReveal`, `teamPing`, `takeover`.
- **Snapshot `s`:** gemeinsamer Teil pro Tick (`k` Tick, `t` Zeit, `tl` Restzeit, `ph` Phase, `em` Elixier-Faktor, `cr` Kronen, `e` Entitäten als Arrays `[id, typ, owner, x, y, hp, maxHp, flags, shield, target, facing, aux(, pl)]`, `p` Geschosse, `z` Zonen, `ev` Ereignisse) plus `me` pro Spieler (Elixier, Hand, Kosten, nächste Karte, Bereitschaft, Evo-Ladung, Fähigkeit, Emote-Abklingzeit, Champion, letzte Karte). Erweiterungen werden nur in Modi angehängt, die sie brauchen – der klassische Snapshot bleibt Byte für Byte gleich (abgesichert durch `test/classic-regression.test.js`).
- **Reconnect:** Sitzung per Token (`hello { token }`). Getrennte Spieler haben `rules.lobby.reconnectSeconds` = 30 s (Wanduhr); in der Zeit läuft der Kampf weiter, danach Aufgabe (1 gegen 1) bzw. Bot-Übernahme (2 gegen 2). Beim Wiederverbinden schickt `Room.sendState()` je nach Raumzustand Lobby, Draft-Zustand, `matchInit` + `matchStart { resume }` oder das Ergebnis.
- **Pausier-Mechanismen:** **keine.** Es gibt heute keinen Zustand, in dem ein laufender Kampf angehalten wird. Der Ladebildschirm und der Draft laufen vor dem Kampf. Der Client hat keinen Pausen-Begriff: Er erkennt ausbleibende Snapshots nach 700 ms als „Verbindung instabil“ und zählt die Uhr lokal weiter.

## 6. Notwendige Änderungen und Risiken

### Änderungen pro Datei

| Datei | Änderung |
|---|---|
| `data/chaos.json` (neu) | `cardPool`, `fixedLevel`, `towerHpMultiplier`, `elixirRateMultiplier`, `rounds`, `firstRoundSeconds`, `roundIntervalSeconds`, `pickTimeSeconds`, `rarityByRound`, `evos`, Bot-Verzögerung |
| `data/chaos_perks.json` (neu) | 3 Perks je Pool-Karte mit den Feldern aus Auftrag 3.5 |
| `data/modes.json` | Eintrag `chaos` (Kachel, Regeln, `elixir.multiplier`, Verweis `chaos: true`) |
| `shared/modes.js` | Validierung `chaos`, `resolveRules`: Turm-Multiplikator, Level, Chaos-Einstellungen in die effektiven Regeln |
| `shared/chaos.js` (neu) | Laden und Prüfen von `chaos.json`/`chaos_perks.json` (Server und Client), Pool-Prüfung für Decks, Perk-Anwendung auf Matchkopien (rein funktional, testbar) |
| `server/sim/match.js` | Perk-Tabelle, `perkedUnit`/`perkedSpell`, `paused`-Zustand, Ablehnung von Eingaben während der Pause, Snapshot-Zusatz (Perk-Abzeichen, Pausenzeit) nur im Chaos-Modus |
| `server/sim/traits.js`, `combat.js`, `spells.js` | wenige allgemeine Hooks, die es noch nicht gibt (z. B. „bei Tod Zauber X der Karte auslösen“ für Zauber-Perks, „jeder n-te Angriff“), jeweils als Baustein, nicht pro Karte |
| `server/chaos.js` (neu) | Auswahlrunden: Zeitplan, Angebote würfeln (Seltenheit je Runde), Frist, Auto-Wahl, Überspringen, Bot-Wahl |
| `server/rooms.js` | Chaos-Raum: Runde starten (Simulation anhalten), Wahl entgegennehmen, Runde beenden; Deck-Prüfung gegen den Pool; `sendState()` stellt eine laufende Auswahlrunde wieder her; Ergebnis mit gewählten Perks |
| `server/index.js` | neue Nachricht `perkPick` weiterleiten; Daten-Endpunkte `/data/chaos.json`, `/data/chaos_perks.json` |
| `server/bot.js`, `server/botdraft.js` | Bot-Deck aus dem Pool, Perk-Wahl je Stufe |
| `shared/protocol.js`, `docs/PROTOCOL.md` | neue Nachrichten (nur Erweiterung, Version bleibt kompatibel): C2S `perkPick { perk }`, S2C `perkRound` (Start, eigene Optionen, Frist, Rundennummer), `perkResult` (Wahl beider Spieler, sichtbarer Effekt), Ablehnungscodes `PAUSED`, `PERK_NOT_OFFERED`, `NOT_IN_POOL` |
| `client/js/ui/modes.js`, `main.js` | Kachel „Chaos“, Info-Screen beim ersten Mal, Chaos-Deck (eigener Deckplatz, nur Pool-Karten) |
| `client/js/ui/deckbuilder.js` | Filter „nur Pool“ (sonst identische Bedienung) |
| `client/js/game/game.js`, `hud.js`, `renderer.js` | Pausen-Zustand (Uhr und Interpolation einfrieren, kein „Verbindung instabil“), Perk-Overlay, Abzeichen an Handkarten und Einheiten, Glow bei epischen Perks, Turm-Kennzeichnung „×2“, Anzeige „Spielzeit“ vs. „Auswahlpause“ |
| `client/js/ui/` (neu `perks.js`) | Overlay mit zwei Optionen, Countdown-Ring, Bestätigungs-Animation; Perk-Details |
| `client/js/updates.js` | Update-Eintrag |
| `test/` | Chaos-Tests (Auftrag Phase 7) |

### Risiken und wie sie abgefangen werden

1. **Pause im festen Tick.** Die Pause wird im **Raum** umgesetzt, nicht in der Simulation: Solange eine Auswahlrunde läuft, ruft `Room.tick()` weder Bots noch `match.step()` auf. Weil Spielzeit, Elixier, Abklingzeiten und Handkarten-Bereitschaft nur an `match.time` (= Tick-Zähler) hängen, können sie nicht verfälscht werden – es vergeht schlicht keine Sim-Zeit. Die Auswahlfrist läuft dagegen auf der **Wanduhr** des Raums (wie im Draft, `room.later`). Die Gesamtdauer der Pausen wird separat gezählt (`pauseSeconds`) und angezeigt. Ein Test vergleicht Elixier und Uhr vor und nach einer Pause.
2. **Rundenauslöser exakt im Tick.** Die Runde startet, wenn `match.time` den Zeitpunkt erreicht – geprüft **nach** `step()`, damit der Tick vollständig abgeschlossen ist (Tote verarbeitet, Ereignisse verschickt). Ist der Kampf im selben Tick zu Ende, entfällt die Runde.
3. **Client friert nicht von selbst ein.** Heute zählt der Client die Uhr lokal weiter und meldet ausbleibende Snapshots als Verbindungsproblem. Lösung: Der Server schickt beim Start der Pause eine Nachricht und während der Pause weiter (seltene) Snapshots mit Pausenmarke; der Client hält Interpolation, Uhr und Partikel an und unterdrückt die Verbindungswarnung.
4. **Geteilte `def`-Objekte.** Ein Perk, der versehentlich das gecachte `def` verändert, würde alle Einheiten aller Spieler und sogar spätere Matches treffen. Abhilfe: Perks arbeiten ausschließlich auf `structuredClone`-Kopien; ein Test spielt ein Chaos-Match und vergleicht danach `db.unit(…)` und `cards.json` mit dem Ausgangszustand.
5. **Klassische Regression.** Chaos darf den klassischen Kampf nicht verändern. Alle neuen Pfade hängen an `rules.chaos`; ohne ihn bleibt jeder Codepfad identisch. `test/classic-regression.test.js` (Tick-genaue Prüfsummen) muss unverändert grün bleiben.
6. **Reconnect während einer Pause.** Der Raum hält Angebot, Rundennummer und Frist (`deadlineAt`) pro Spieler. `sendState()` schickt im Zustand „Pause“ zusätzlich die laufende Runde mit exakter Restzeit. Läuft die Frist für einen getrennten Spieler ab, wählt der Server zufällig – der Gegner wartet nie länger als `pickTimeSeconds`.
7. **Perk-Stärke und Last.** Spawn-Perks erhöhen die Einheitenzahl; `maxEntities` (260) und die vorhandenen Grenzen (z. B. `endless.max`, Spawner-Intervalle) bleiben aktiv. Jeder Perk bekommt feste Obergrenzen in seinen Parametern; keine Kettenreaktion ohne Begrenzung.
8. **Rundenzeitplan vs. Spielzeit.** Mit den Standardwerten aus dem Auftrag (erste Runde nach 45 s, gleicher Abstand, 5 Runden) liegen die Runden bei 0:45, 1:30, 2:15, **3:00** und **3:45**. Die reguläre Spielzeit endet nach 3:00 – Runde 4 fiele also genau auf das Ende und gäbe es (wie Runde 5) nur in der Verlängerung. Das widerspricht „nur die letzte Runde hängt an der Verlängerung“. Lösungsvorschlag, im Interview zur Entscheidung gestellt: Abstand 36 s → 0:36, 1:12, 1:48, 2:24 in der regulären Zeit und Runde 5 genau zu Beginn der Verlängerung (3:00).
9. **Evolutionen.** Evo-Werte und Perk-Werte überlagern sich (z. B. Evo-Ritter mit Rüstung + Rüstungs-Perk). Vorschlag: Evos im Chaos-Modus aus (wie in den Draft-Modi) – der Perk ist das Upgrade. Wird im Interview entschieden.
10. **Spiegel und Klon.** Kopiert der Spiegel eine Karte mit Perk, oder klont der Klonzauber eine Einheit mit Perk? Regel: Der Spiegel übernimmt den Perk der kopierten Karte (er spielt die Karte „noch einmal“), der Klon kopiert die Einheit samt Matchkopie (1 Leben). Beide Karten sind nicht im vorgeschlagenen Pool, die Regel gilt trotzdem.

## 7. Perk-Bausteine (Grundlage für die Vorschläge im Interview)

Damit jeder Interview-Vorschlag umsetzbar ist, stehen die Bausteine vorab fest. Alles in Klammern existiert bereits in der Simulation und wird nur per Perk auf die Matchkopie gelegt.

| Kategorie | Baustein | Parameter (Beispiele) | vorhanden in |
|---|---|---|---|
| `statBoost` | Multiplikator/Zuschlag auf Einheitenwerte | `hp`, `damage`, `hitSpeed` (kleiner = schneller), `range`, `speed`, `sight`, `splash`, `deployTime`, `shield`, `towerDamage` | `def`-Felder |
| `statBoost` | Zauberwerte | `radius`, `damage`, `duration`, `stun`, `slow.amount`, `knockback`, `towerDamage` | `card.spell` |
| `behaviorChange` | Zielwahl | `targets`: `buildings` → `ground`/`both`, `ground` → `both` | `canTarget`, `acquireTarget` |
| `behaviorChange` | Bewegung | `riverJump`, `flying` (fliegt), `charge` (Ansturm), `dash` (Sprint), `leap` (Sprung), `deployAnywhere` | `motion.js` |
| `behaviorChange` | Schussart | `pierce` (Durchschlag), `spread` (Streuschuss), `multiTarget`, `bounce`, `splash` an/aus | `combat.js` |
| `newAbility` | `onSpawn` | `deployBlast` (Landestoß mit Schaden/Betäubung/Verlangsamung), `deployHeal` | `traits.onDeployed` |
| `newAbility` | `onAttack` / `onHit` | `onHit.stun`, `onHit.slow`, `onHit.chain` (Kettenblitz), `rageOnHit`, `selfHealOnHit`, `slowShot` (jeder n-te Schuss), `combo` (jeder n-te Schlag), `killHeal`, `poisonDart` | `combat.applyOnHit` |
| `newAbility` | `onDeath` | `deathDamage` (Explosion), `deathSpawn` (Einheiten), `deathSpell` (Zone: Heilung, Frost, Gift …), `deathElixir`, `shadowOnDeath` | `traits.processDeaths` |
| `newAbility` | `onPeriodicTick` | `aura` (Verbündete schneller / Gegner langsamer), `spawner` (alle n Sekunden Einheiten), `surfacePulse`, `heal`-Puls | `traits.updateTraits` |
| `newAbility` | Schutz | `shield`, `armor` (weniger Schaden, z. B. solange nicht angreifend), `parry`, `stealth`/`veil` (kurz unsichtbar) | `combat.damage` |
| `spawnChange` | Anzahl/Art bei Platzierung | `count` (+n Einheiten), zusätzliche Gruppe (`groups`), Formation | `spawnCard`, `groupsOf` |
| `spawnChange` | Anzahl/Art bei Tod oder Spawner | `deathSpawn.count/unit`, `spawner.count/interval/unit`, `spawn.count` bei Zaubern, `spawnAtEnd` | `traits`, `spells` |
| `visualOnly` | nur Darstellung | Farbe, Partikelspur | Client |

Neu (als allgemeiner Baustein, nicht pro Karte) kommen voraussichtlich nur hinzu: Zauber-Nachwirkung (`afterZone`: nach dem Einschlag bleibt eine Zone mit Gift/Frost/Heilung/Wut liegen), „Zauber hinterlässt Einheiten“ (`impactSpawn` für Zauber) und Fähigkeits-Parameter für Champions/Helden (Abklingzeit, Dauer, Stärke der vorhandenen Fähigkeit).

## 8. Zusammenfassung

- Das Mode-Framework, die Draft-Logik (Angebot → Wahl → Frist → Auto-Wahl → Reconnect) und die Bots sind vorhanden. Chaos baut darauf auf: neuer Modus-Eintrag, neue Datei `chaos.json`, Perk-Runden als eigener Raum-Zustand während des Kampfs.
- Turm-Multiplikator, fester Level und Elixier-Faktor 1,5 mit weiterlaufenden Doppel-/Dreifach-Phasen sind mit sehr wenig Code machbar (`resolveRules`, zweite Kartendatenbank, `elixir.rate`).
- Perks verändern nie `cards.json` und nie die geteilten Einheitenwerte, sondern Matchkopien pro Spieler und Karte. Die Simulation bringt 71 wiederverwendbare Eigenschaften mit, die sich per Perk einschalten oder verstärken lassen.
- Die Pause hält den Tick im Raum an; da alle Spielwerte an der Tick-Zeit hängen, verfälscht sie weder Uhr noch Elixier. Neu ist ein Pausen-Begriff im Client.
- Zwei Punkte brauchen eine Entscheidung: der Rundenzeitplan (Standardwerte kollidieren mit dem Ende der regulären Spielzeit) und Evolutionen im Chaos-Modus.
