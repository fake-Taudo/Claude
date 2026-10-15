# Bericht: Modus „Chaos“ (Modifikator-Kampf)

Neuer 1v1-Modus mit eigenem Kartenpool (40 Karten), festem Kartenlevel und doppelten Türmen. Elixier lädt 1,5-mal so schnell. Sechs Auswahlrunden (eine Startrunde zu Kampfbeginn plus fünf weitere) pausieren den Kampf, in jeder bekommt man einen Perk für eine Karte des eigenen Decks. Der Modus läuft im Multiplayer per Einladungscode und im Einzelspieler gegen Bots in allen drei Stufen.

Klassisch und die übrigen Modi sind unverändert. Die Regressions-Aufzeichnung (12 Kämpfe, Prüfsumme über jeden Snapshot) bleibt Tick für Tick gleich. Alle 410 Tests sind grün.

Weitere Dokumente:

- Auftrag: [SPEC_CHAOS.md](SPEC_CHAOS.md)
- Audit (Phase 1): [CHAOS_AUDIT.md](CHAOS_AUDIT.md)
- Interview-Fortschritt: [CHAOS_PERK_PROGRESS.md](CHAOS_PERK_PROGRESS.md)
- Alle 120 Perks mit Werten: [CHAOS_PERKS_OVERVIEW.md](CHAOS_PERKS_OVERVIEW.md)
- Protokoll: [PROTOCOL.md](PROTOCOL.md), Abschnitt „Modus Chaos“
- Balance-Stichprobe: [chaos_balance.json](chaos_balance.json)
- Screenshots: [screens/](screens/) (`chaos-*.jpg`, Prüfergebnis in `chaos-checks.json`)

---

## 1. Einstellungen (`data/chaos.json`)

Alle Werte sind Daten. Eine Änderung wirkt nach einem Server-Neustart, ohne Code-Änderung.

| Feld | Wert | Bedeutung |
|---|---|---|
| `cardPool` | 40 Karten | nur diese Karten sind im Chaos-Deckbau und für Bots erlaubt |
| `fixedLevel` | 11 | alle Karten auf festem Level, unabhängig vom sonstigen Fortschritt |
| `towerHpMultiplier` | 2 | Prinzessinnen- und Königsturm doppelte Leben |
| `elixirRateMultiplier` | 1,5 | gilt zusätzlich zu Doppel- und Dreifach-Elixier (×3 bzw. ×4,5) |
| `evos` | `false` | keine Evolutionen (Interview: der Perk ist das Upgrade) |
| `rounds` | 6 | Auswahlrunden je Kampf, Startrunde mitgezählt |
| `openingRound` | `true` | zusätzliche Startrunde direkt zu Kampfbeginn (0:00), nur gewöhnliche Perks (nachträglich gewünscht am 15.10.2026) |
| `firstRoundSeconds` / `roundIntervalSeconds` | 36 / 36 | nach der Startrunde Runden bei 0:36, 1:12, 1:48, 2:24 Spielzeit; Interview-Entscheidung statt der 45 s aus dem Auftrag |
| `lastRoundOvertimeOnly` | `true` | die letzte Runde (3:00) gibt es nur in der Verlängerung |
| `pickTimeSeconds` | 6 | Auswahlzeit; danach wählt der Server zufällig |
| `offersPerRound` / `offerMode` | 2 / `twoCards` | zwei verschiedene perk-freie Karten, Seltenheit je Option unabhängig gewürfelt (Interview 14.10.2026) |
| `rarityByRound` | 100/0/0 (Startrunde) · 90/10/0 · 20/80/0 · 0/50/50 · 0/20/80 · 0/0/100 | Gewöhnlich/Selten/Episch in % je Runde |
| `bot.pickDelaySeconds` | 1–4 | menschlich wirkende Bedenkzeit der Bots |

Ist nur noch eine Karte perk-frei, bekommt sie zwei verschiedene Stufen zur Wahl. Ist keine mehr frei, wird die Runde für diesen Spieler übersprungen und der Gegner wartet nicht. Haben beide keine freie Karte mehr, entfällt die Pause ganz.

## 2. Finaler Kartenpool und Perks

Der Pool hat 40 Karten mit durchschnittlich 4,0 Elixier, freigegeben im Interview am 13.10.2026: der Vorschlag von 36 Karten, dazu Golem, Elektromagier, Lakaien, Tesla und Goblin Demolisher, ohne Kanone. Aufgeteilt nach Kartenart:

- 29 normale Truppen
- 1 Champion (Goldener Ritter)
- 1 Held (Bowler)
- 3 Gebäude
- 6 Zauber

Die vollständigen Perks mit allen Feldern stehen in [`data/chaos_perks.json`](../data/chaos_perks.json) (Freigabe 14.10.2026). Lesbar mit Werten aufbereitet sind sie in [CHAOS_PERKS_OVERVIEW.md](CHAOS_PERKS_OVERVIEW.md).

**Automatisch gewählte Karten: keine.** Alle 120 Perks hast du im Interview ausgewählt:

- **94** als eigene Idee (`selection: "custom"`)
- **26** als einer meiner Vorschläge (`selection: "interview"`, in der Tabelle mit ¹ markiert)
- **0** automatisch gewählt (`auto`)

Verteilung nach Mechanik-Kategorie:

| Kategorie | Perks |
|---|---|
| `statBoost` | 37 |
| `behaviorChange` | 26 |
| `newAbility` | 22 |
| `spawnChange` | 35 |

| # | Karte | Elixier | Gewöhnlich | Selten | Episch |
|---|---|---|---|---|---|
| 1 | Riese | 5 | Sturmlauf | Turmschüttler ¹ | Bruchlandung |
| 2 | P.E.K.K.A. | 7 | Raketenstiefel | Schwungschlag ¹ | Tiefenläuferin |
| 3 | Megaritter | 7 | Heavy Hitter | Springer Bube | Himmelfahrt |
| 4 | Golem | 8 | Bergkoloss | Golemit-Kaskade | Doppelgolem |
| 5 | Ritter | 3 | Bollwerk | Donnerklinge | Beförderung |
| 6 | Banditin | 3 | Weitsprint | Letzter Sprint | Schattenbande |
| 7 | Walküre | 4 | Riesenschwung | Sogwirbel ¹ | Wirbelsturm |
| 8 | Mini-P.E.K.K.A. | 4 | Luftpost-Lieferung | Zwillinge ¹ | Super-Mini-P.E.K.K.A. |
| 9 | Prinz | 5 | Sturmlanze | Turnierreiter | Unaufhaltsam |
| 10 | Bomber | 2 | Panzerweste | Springbombe ¹ | Megabombe |
| 11 | Bogenschützen | 3 | Fernsicht | Magieschützen-Pfeile | Schützenkompanie ¹ |
| 12 | Musketierin | 4 | Schnellfeuer | Kanonenkugel | Nachschub |
| 13 | Elektromagier | 4 | Dreifachblitz ¹ | Dauerblitz | Blitzherr |
| 14 | Goblin Demolisher | 4 | Weitwerfer | Zündkette ¹ | Dauerfeuerwerk |
| 15 | Magier | 5 | Großbrand | Feuerballwerfer | Magier-Trio |
| 16 | Hexe | 5 | Doppelritual | Wächterkreis | Evo-Beschwörung |
| 17 | Fledermäuse | 2 | Blutdurst ¹ | Teilung ¹ | Explosionsbisse |
| 18 | Lakaien | 3 | Vierter Lakai ¹ | Schockbiss | Megastaffel |
| 19 | Koboldgang | 3 | Großfamilie | Giftspeere | Riesenbande |
| 20 | Skelettarmee | 3 | Knochenschilde ¹ | Schattenrückkehr | Knochenlotterie |
| 21 | Barbaren | 5 | Sechster Barbar ¹ | Stahlhaut | Elitetrupp |
| 22 | Eisgeist | 1 | Frosttrio | Schneesturm | Gletscherkoloss |
| 23 | Megalakai | 3 | Bollwerkflügel | Flammenatem | Fernbomber |
| 24 | Drachenbaby | 4 | Turbodrache | Feuerspucker | Drachenei |
| 25 | Infernodrache | 4 | Langer Strahl | Gespaltener Strahl ¹ | Höllenfeuer-Evo |
| 26 | Schweinereiter | 4 | Wildgalopp | Bohrhammer | Ferkelflut |
| 27 | Rammbock | 4 | Volle Besatzung | Elitebesatzung ¹ | Doppelramme ¹ |
| 28 | Ballon | 5 | Bombenhagel | Bombenspur | Luftschiff |
| 29 | Königsriese | 6 | Weitschuss ¹ | Kolossrüstung | Wandelndes Geschütz |
| 30 | Tesla | 4 | Viererspule | Zermürbungsstrom | Dr. Frankens Erbe |
| 31 | Koboldhütte | 4 | Speer-Doppelpack ¹ | Koboldpartyhütte | Demolisher-Werkstatt |
| 32 | Infernoturm | 5 | Turbo-Glut | Dreifachstrahl ¹ | Weißglut |
| 33 | Knall | 2 | Schwächungsknall | Blitznachschlag | Knall-Kette |
| 34 | Kampfholz | 2 | Weitroller | Doppelstamm ¹ | Holzfäller-Überraschung |
| 35 | Pfeile | 3 | Vierte Welle ¹ | Feuerregen | Königin des Hagels |
| 36 | Koboldfass | 3 | Schnellwurf ¹ | Bombenfass | Riesenfass ¹ |
| 37 | Feuerball | 4 | Glutboden | Tornado-Feuerball-Kombo | Riesenfeuerball |
| 38 | Gift | 4 | Lähmgift | Dreifachgift | Würgegift |
| 39 | Goldener Ritter | 4 | Gratis-Sprung ¹ | Klingenwirbel | Goldene Endloskette |
| 40 | Bowler (Held) | 5 | Günstiger Wurf ¹ | Felsenbrecher ¹ | Sprengfels |

Eine Datenänderung gab es nach der Freigabe: Beim Perk „Unaufhaltsam“ (Prinz, Episch) umfasst die Immunität jetzt auch Festhalten (`root`). Die Beschreibung („…Einfrieren, Festhalten, Rückstoß…“) ist angepasst, weil sonst ein Festhalte-Effekt die versprochene Unaufhaltsamkeit gebrochen hätte.

## 3. Umsetzung nach Phasen

### Phase 2: Match-Rahmen und Auswahlrunden (Server)

- **`shared/modes.js`:** `resolveRules(rules, mode, { chaos })` setzt Elixier-Rate ×1,5, Turm-Leben ×2, festes Level und Evos aus. Ohne Chaos-Daten wirft es einen Fehler. Klassisch bekommt weiterhin dasselbe Regelobjekt zurück.
- **`shared/chaos.js`:** Prüfung beider Dateien, Rundenplan, Würfeln der Seltenheit, Angebote. Wird von Server, Client, Tests und Werkzeugen gemeinsam genutzt.
- **`server/chaos.js`:** `PerkRounds` führt Runden, Angebote, Wahl, Auto-Wahl und Überspringen. Jede Wahl wird geprüft: nur eine der eigenen zwei Optionen, nur einmal, nur während einer Runde.
- **`server/rooms.js`:**
  - **Pause:** Läuft eine Auswahlrunde, rechnet der Raum keine Ticks. Spielzeit, Elixier, Handkarten, Fähigkeiten und Bots stehen still. Eingaben werden mit `PAUSED` abgewiesen.
  - **Frist:** Die Auswahlfrist läuft auf der Wanduhr. Die Pausenzeit wird getrennt gezählt (`pauseTotal`).
  - **Wiederherstellung:** Wer neu verbindet, bekommt dieselben Optionen mit exakter Restzeit.
  - **Kartenpool:** Der Pool wird bei `create`, `join`, `training` und `deck` geprüft (`NOT_IN_POOL`).
- **Clients senden nur IDs.** Jeder Wert (Optionen, Seltenheit, Restzeit, Perk-Wirkung) kommt vom Server.

### Phase 4: Perk-System (Simulation)

- **`server/sim/perks.js`:** generisches Perk-System als Mixin der Simulation.
  - Beim Zuweisen entsteht eine **Matchkopie** der Kartendaten des wählenden Spielers. Die Kopie hat ihr eigenes `def` mit `def.px` (Laufzeit-Merkmale). Die gemeinsame Kartendatenbank und `cards.json` bleiben unberührt (per Test geprüft). Die Elixierkosten werden nie angefasst.
  - **`statBoost`:** generische Operationen `mult`, `add` und `set` auf Feldern von Einheit, Angriff, Zauber und Gebäude, dazu `unitScale` und `visualScale`.
  - **`behaviorChange`:** Zielwahl und Bewegung als Module, zum Beispiel „nur Türme“, Bewegungsangriff, Schubsen, Sprung, Bevorzugung von Türmen, Platzieren überall.
  - **`newAbility`:** Hooks `onSpawn`, `onAttack`, `onHit`, `onDamage`, `onKill`, `onDeath` und `periodic`. Sie nutzen die vorhandenen Bausteine (Flächenschaden, Statuseffekte, Zonen, Spawns, Zauber).
  - **`spawnChange`:** Anzahl, Art und Formation beim Ausspielen und beim Tod, zufällige Gruppen, Ersatz-Einheiten und erzwungene Evo-Gestalt.
- **Hooks in den bestehenden Modulen** (`match.js`, `combat.js`, `motion.js`, `spells.js`, `traits.js`, `abilities.js`) sind an `px` bzw. `perkOn` gebunden. Ohne Perk läuft exakt der bisherige Code. Das belegt die klassische Regressions-Aufzeichnung.
- Ein echter Fehler wurde beim Testen gefunden und behoben: Beim Sprengfels (Bowler, Episch) wanderte der Explosionsmittelpunkt mit dem Rückstoß mit. Er wird jetzt vor der Schleife festgehalten.

### Phase 5: UI, HUD und Grafik

- **Modus-Kachel „Chaos“** mit eigenem Chaos-Deck (3 Plätze, Status und Knopf zum Chaos-Deckbau). Beim ersten Start erscheint eine Info (Ablauf, Seltenheiten, Pool, Perks je Karte), danach ist sie abschaltbar.
- **Chaos-Deckbau:** nur Pool-Karten, sonst dieselbe Bedienung (Filter, Suche, Champion-/Held-Platz, Elixier-Schnitt). Ohne Evo-Plätze, dafür mit dem Reiter „Perks“ in der Kartenansicht. Drei Startdecks in `shared/decks.js`.
- **Auswahl-Overlay:**
  - zwei große Optionen nebeneinander (Karte, Seltenheits-Abzeichen, Name, Beschreibung, Kategorie);
  - Countdown-Ring und Bestätigungs-Animation;
  - Anzeige der Gegner-Wahl als „fertig“, ohne Inhalt;
  - im Querformat kompakt als Raster.
- **Abzeichen** in Seltenheitsfarbe: Grau (Gewöhnlich), Bronze (Selten), Lila (Episch).
  - Sie erscheinen auf Handkarten und auf Einheiten im Feld.
  - Ein Antippen der Handkarte zeigt die volle Beschreibung, die Trefferfläche ist mindestens 44 px.
  - Einheiten mit epischem Perk haben einen dezenten Glow.
  - Wird ein Perk zugewiesen, erscheint eine kurze Markierung.
- **Türme** zeigen „×2“ an der Lebensleiste. Der Timer trennt „Spielzeit“ und „Auswahlpause“. Während der Pause steht eine Tafel „Perk-Auswahl“ über der Arena, und die Animationen frieren sichtbar ein.
- **Im Pause-Menü** listet der Knopf „Perks im Kampf“ alle Perks beider Seiten auf.
- **Ergebnis:** „Deine gewählten Perks“ mit Name, Seltenheit und Karte, außerdem die Pausenzeit.
- **Update-Eintrag** `2026-10-14.1` (Version 1.8, „Neuer Modus: Chaos“) in `client/js/updates.js`.

### Phase 6: Bots

- **Bot-Deck:** Zufallsdeck nur aus dem Pool (`randomDeck(db, rng, { pool })`), mit der vorhandenen Bot-Deck-Logik (Rollenmischung: Champion-/Held-Platz, 1–2 Zauber, mindestens drei Karten gegen Luft, eine Win-Condition).
- **Perk-Wahl** in `server/botperk.js`:

  | Stufe | Wahl |
  |---|---|
  | Leicht | zufällig |
  | Mittel | höhere Seltenheit, dazu ein Bonus für `statBoost` und `spawnChange` und für die Rolle der Karte |
  | Schwer | wie Mittel, dazu Mechanik-Kategorie, Schlüsselwörter aus `balanceNote` und Lage (Turmrückstand, gegnerische Lufteinheiten, Zahl der Gegner im Feld, Karte gerade auf der Hand) |

- **Bedenkzeit:** 1–4 s innerhalb der 6 s.

## 4. Neue und geänderte Dateien

**Neu**

| Datei | Inhalt |
|---|---|
| `data/chaos.json` | Einstellungen und Kartenpool |
| `data/chaos_perks.json` | 120 Perks (3 je Karte) |
| `shared/chaos.js` | Prüfung, Rundenplan, Seltenheit, Angebote, Zusammenfassung |
| `server/chaos.js` | `loadChaos`, `PerkRounds` |
| `server/botperk.js` | Perk-Wahl der Bots |
| `server/sim/perks.js` | Perk-System der Simulation (alle Bausteine und Hooks) |
| `client/js/ui/perks.js` | Abzeichen, Perk-Listen, Info, Auswahl-Overlay |
| `test/chaos-rounds.test.js` | Daten, Regeln, Runden, Pause, Sicherheit, Bots |
| `test/chaos-perks.test.js` | Grundsätze, Bausteine, alle 120 Perks einzeln |
| `test/chaos-e2e.test.js` | zwei echte Clients über WebSocket |
| `tools/chaos/card-list.mjs`, `tools/chaos/perks.mjs` | Werkzeuge für Interview und Übersicht |
| `tools/chaos/balance.mjs` | Balance-Stichprobe |
| `tools/chaos/screens.mjs` | Screenshots mit Layout-Prüfung |
| `docs/SPEC_CHAOS.md`, `docs/CHAOS_AUDIT.md`, `docs/CHAOS_PERK_PROGRESS.md`, `docs/CHAOS_PERKS_OVERVIEW.md`, `docs/CHAOS_REPORT.md`, `docs/chaos_balance.json` | Dokumentation |
| `docs/screens/chaos-*.jpg` (42), `docs/screens/chaos-checks.json` | Screenshots |

**Geändert**

| Bereich | Dateien |
|---|---|
| Daten | `data/modes.json` (Modus `chaos`) |
| Gemeinsam | `shared/modes.js`, `shared/cards.js` (`randomDeck` mit Pool, `db.atLevel`), `shared/decks.js` (Chaos-Startdecks), `shared/protocol.js` |
| Server | `server/index.js`, `server/rooms.js` |
| Simulation (Hooks) | `server/sim/match.js`, `combat.js`, `motion.js`, `spells.js`, `traits.js`, `abilities.js` |
| Client | `client/index.html`, `client/css/style.css`, `client/js/main.js`, `store.js`, `updates.js`, `ui/modes.js`, `ui/deckbuilder.js`, `ui/cardview.js`, `game/game.js`, `game/hud.js`, `game/renderer.js` |
| Tests und Werkzeuge | `test/modes.test.js`, `test/bots.test.js` (Chaos in den Modus-Listen), `tools/modes/bot-eval.mjs` (Chaos mit Auswahlrunden) |
| Doku | `docs/PROTOCOL.md` |

## 5. Protokoll-Änderungen

Die Protokollversion bleibt 2. Alle neuen Felder gibt es nur in Chaos-Räumen. Klassische Nachrichten und Snapshots bleiben Byte für Byte gleich. Die Details stehen in [PROTOCOL.md](PROTOCOL.md).

- **Client → Server:**
  - `perkPick { perk }`;
  - `join` hat zusätzlich `chaosDeck`, weil der Client den Modus vor dem Beitritt nicht kennt.
- **Server → Client:**
  - `perkRound`: eigene Optionen, Restzeit, Seltenheiten der Runde, Status beider Seiten;
  - `perkResult`: Wahl je Platz, Auto-Wahl, alle bisherigen Perks.
- **`matchInit.chaos`** enthält Faktoren, Rundenplan, Auswahlzeit, bisherige Perks und Pausenzeit. **`matchEnd`** enthält zusätzlich `perks` und `pauseTotal`.
- **Snapshot:**
  - `pt` (Pausenzeit gesamt);
  - `pz` (Runde und Restzeit, nur während einer Pause);
  - `pe` (Einheiten mit Perk: ID, Stufe, Größe).
- **Ereignisse:**
  - `pk`: Perk zugewiesen;
  - `pv`: sichtbare Perk-Wirkung (`launch`, `share`, `laststand`, `flame`, `zap`, `shove`, `spawn`);
  - neue Flächen- und Zonen-Effektnamen.
- **Neue Fehlercodes:** `PAUSED`, `NOT_IN_POOL`, `NO_ROUND`, `PERK_NOT_OFFERED`, `ALREADY_PICKED`.
- **Daten-Endpunkte:** Der Server liefert `/data/chaos.json` und `/data/chaos_perks.json` aus. Beide fließen in `dataVersion` ein.

## 6. Testergebnisse

`node --test`: **410 Tests, 410 grün**, 0 übersprungen, Laufzeit etwa 190 s. Davon sind 66 Chaos-Tests:

| Datei | Tests | Was geprüft wird |
|---|---|---|
| `test/chaos-rounds.test.js` | 15 | Daten (40 Karten, 3 Stufen, Pflichtfelder, keine Kostenänderung); Regeln (Türme ×2, Elixier ×1,5 mal Doppel/Dreifach, Level, keine Evos, Klassisch unverändert); Seltenheits-Staffelung über viele Runden gegen chaos.json; Angebote; Rundenplan inklusive Startrunde (nur gewöhnlich) und letzter Runde nur in der Verlängerung; synchrone Pause (Spielzeit, Elixier, Hand stehen, Eingaben abgewiesen); Auto-Wahl; Überspringen ohne Wartezeit für den Gegner; Reconnect in der Pause (gleiche Optionen, exakte Restzeit); Training mit Pool-Deck; manipulierter Client; Aufgabe in der Pause; Matchkopie statt cards.json; jede Bot-Stufe spielt ein ganzes Chaos-Match; Perk-Wahl je Bot-Stufe |
| `test/chaos-perks.test.js` | 49 | Grundsätze (Matchkopie statt cards.json, Perk nur für die Karte des wählenden Spielers und nicht für dieselbe Karte des Gegners, Elixierkosten gleich, Markierung im Snapshot); je ein Test pro Baustein `statBoost`, `behaviorChange`, `newAbility`, `spawnChange` mit echten Perks aus chaos_perks.json; je Karte ein Test, der alle drei Perks in der Simulation nachweist (40 Tests); ein Test, dass alle 120 Perks eine eigene Prüfung haben |
| `test/chaos-e2e.test.js` | 2 | Zwei echte Clients über WebSocket spielen ein komplettes Match mit Startrunde, Verlängerung und letzter Runde (6 Perks je Spieler). Ein Client trennt mitten in einer Auswahlpause und verbindet neu. Es gibt keinen Desync (gemeinsamer Zustand je Tick bei beiden Clients gleich, Spielzeit steht in der Pause still) und keinen Serverfehler. Zweiter Test: manipulierte Clients mit Deck außerhalb des Pools, Perk ohne Runde, Platzieren außerhalb des Decks |

**Sicherheit:** Der Server weist ab:

- einen nicht angebotenen Perk (`PERK_NOT_OFFERED`);
- einen Perk außerhalb einer Runde (`NO_ROUND`);
- eine zweite Wahl (`ALREADY_PICKED`);
- Karten außerhalb des Pools (`NOT_IN_POOL`);
- Platzieren und Fähigkeiten während der Pause (`PAUSED`).

### Balance-Stichprobe

Gemessen am 14.10.2026, also noch ohne die Startrunde (5 Runden).

`node tools/chaos/balance.mjs --games=20 --out=docs/chaos_balance.json`: 20 Kämpfe Bot gegen Bot (Mittel gegen Mittel), Zufallsdecks aus dem Pool, Auswahlrunden wie im Raum, Laufzeit 5,7 s.

- **Siege:** Blau 8, Rot 12, Unentschieden 0. Ein Kampf dauert im Schnitt 197 s Spielzeit.
- **Enden:**
  - Königsturm 1;
  - Sudden Death 9;
  - Zeit 10.

  Die doppelten Türme verlängern die Kämpfe also deutlich. 10 von 20 Kämpfen erreichen die Verlängerung und damit die letzte Runde.
- **Perks:** 8,8 je Kampf (176), davon 33 Gewöhnlich, 53 Selten, 90 Episch. Die späten Runden sind fast nur episch.
- **Auffällige Karten** (mindestens 4 Kämpfe, Siegquote ≥ 75 % oder ≤ 25 %):
  - Megaritter 4/4 (100 %)
  - Koboldfass 7/9 (78 %)
  - Mini-P.E.K.K.A. 1/4 (25 %)
  - Riese 1/4 (25 %)
  - Tesla 0/4 (0 %)
- **Auffällige Perks** (mindestens 3 Kämpfe):

  | Perk (Karte) | Siege | Quote |
  |---|---|---|
  | Volle Besatzung (Rammbock) | 3/3 | 100 % |
  | Knall-Kette (Knall) | 4/5 | 80 % |
  | Tiefenläuferin (P.E.K.K.A.) | 4/5 | 80 % |
  | Doppelgolem (Golem) | 3/4 | 75 % |
  | Goldene Endloskette (Goldener Ritter) | 3/4 | 75 % |
  | Wandelndes Geschütz (Königsriese) | 1/4 | 25 % |
  | Klingenwirbel (Goldener Ritter) | 1/4 | 25 % |
  | Evo-Beschwörung (Hexe) | 1/4 | 25 % |
  | Gratis-Sprung (Goldener Ritter) | 1/4 | 25 % |
  | Beförderung (Ritter) | 0/4 | 0 % |

**Einordnung:** Bei 3–9 Kämpfen je Karte ist das nur ein Hinweis, keine Aussage. Beobachten würde ich Koboldfass (das häufigste Siegerdeck), Knall-Kette und Tiefenläuferin, weil sie öfter vorkamen, und bei den schwachen Karten Tesla. Eine Balance-Änderung habe ich nicht vorgenommen; die Werte hast du im Interview freigegeben.

### Bot-Stufen im Chaos-Modus

Gemessen mit `node tools/modes/bot-eval.mjs --mode=chaos,classic --games=40`, also 80 Kämpfe je Paarung, Seiten getauscht, Unentschieden zählen halb:

| Paarung | Chaos | Klassisch (Vergleich) |
|---|---|---|
| Schwer gegen Mittel | 60,0 % | 57,5 % |
| Mittel gegen Leicht | 86,3 % | 73,8 % |
| Schwer gegen Leicht | 88,8 % | 87,5 % |

Die Reihenfolge der Stufen stimmt auch im Chaos-Modus. Bei kleinen Stichproben streut die Paarung Schwer gegen Mittel stark: Mit 24 Kämpfen kamen einmal 41,7 % heraus.

### Performance

Gemessen über 8 Kämpfe Schwer gegen Schwer je Modus. Gemessen wurde nur die Simulation (`step` und Snapshot-Aufbau) auf dem Server:

| Modus | Ø ms je Tick | p99 ms | Max ms | max. Entitäten | Ticks |
|---|---|---|---|---|---|
| Klassisch | 0,069 | 0,49 | 6,8 | 28 | 24 728 |
| Chaos | 0,083 | 0,54 | 3,3 | 56 | 32 600 |

Chaos verdoppelt durch Zusatz-Spawns die Höchstzahl der Entitäten, kostet je Tick aber nur etwa 20 % mehr. Ein Tick (50 ms Budget bei 20 Hz) bleibt weit unter 1 ms. Die Maximalwerte sind einzelne Ausreißer. Während einer Pause rechnet der Server keine Ticks und schickt nur zwei Snapshots pro Sekunde.

### Screenshots

`node tools/chaos/screens.mjs` erstellt Screenshots in drei Formaten: Hochformat 390×844, Querformat 844×390 und Desktop 1440×900. Je Format sind es 14 Zustände, insgesamt 42 JPEGs:

1. Modus-Kachel
2. Info
3. Info mit Pool
4. Chaos-Deckbau
5. Deckbau mit Perk-Reiter
6. Auswahl Runde 1
7. Wahl bestätigt
8. Auswahl Gewöhnlich
9. Auswahl Selten
10. Auswahl Episch
11. Kampf mit Perks
12. Abzeichen-Info
13. Perk-Liste
14. Ergebnis

Die automatische Prüfung (`chaos-checks.json`) meldet in allen drei Formaten 0 Probleme: kein waagerechtes Scrollen, nichts außerhalb des Bildschirms, keine Touch-Ziele unter 44 px, keine Konsolenfehler.

## 7. Abnahme-Checkliste (Auftrag §9)

- [x] Chaos-Modus im Multiplayer per Einladungscode spielbar (End-to-End-Test mit zwei Clients).
- [x] Chaos-Modus im Einzelspieler gegen Bots auf allen Schwierigkeitsstufen spielbar (Bot-Test je Stufe, Training mit Pool-Deck).
- [x] Kartenpool mit 40 Karten, von dir freigegeben. Festes Level 11, Türme ×2 und Elixier ×1,5 funktionieren wie konfiguriert (Regel-Test).
- [x] Für jede Pool-Karte existieren alle drei Perk-Stufen vollständig in chaos_perks.json, alle im Interview ausgewählt (keine automatisch).
- [x] Auswahlrunden:
  - pausieren synchron;
  - zeigen pro Spieler zwei individuelle Optionen;
  - halten das Zeitlimit von 6 s ein;
  - folgen der Seltenheits-Staffelung aus chaos.json;
  - wählen nach Ablauf automatisch.
- [x] Keine Bann-Mechanik vorhanden.
- [x] Perks:
  - wirken nur für die eigene Karteninstanz des wählenden Spielers;
  - bestehen bis Matchende;
  - verändern nie die Elixierkosten (Daten- und Simulationstest).
- [x] Alle Eingaben serverseitig validiert (Sicherheitstests).
- [x] Alle Tests grün (410/410), bestehende Modi unverändert (klassische Regressions-Aufzeichnung, Modus-Tests).

## 8. Bekannte Einschränkungen

- **Perks wirken auf künftige Ausspielungen.** Ein gewählter Perk gilt ab sofort für jede weitere Ausspielung der Karte. Einheiten, die zum Zeitpunkt der Wahl schon im Feld stehen, behalten ihre Werte. Das ist bewusst so, damit Werte nicht mitten im Kampf umspringen.
- **Seltenheits-Screenshots sind Vorschauen.** Die Bilder „Auswahl Gewöhnlich/Selten/Episch“ entstehen per eingespielter Vorschau im Client, weil die echte Seltenheit serverseitig zufällig ist. „Auswahl Runde 1“ und „Wahl bestätigt“ zeigen echte Runden.
- **Ferkelflut (Schweinereiter, Episch):** Die Ferkel nutzen die Figur der Königsschweinchen in normaler Größe. Kleiner ist nur ihr Kollisionsradius.
- **Kanonenkugel (Musketierin, Selten):** „Doppelt so groß“ ist nur eine Grafikangabe, und die Kugel wird derzeit in normaler Größe gezeichnet. Tempo und Rückstoß wirken wie beschrieben.
- **Champion und Held:** Die bestehende Deckregel des Spiels gilt auch im Chaos-Modus, also ein Champion **oder** ein Held auf dem Champion/Held-Platz. Der Auftrag erlaubt je einen von beiden. Goldener Ritter und Bowler können daher nicht zusammen in einem Deck stehen.
- **Bots** spielen Perk-Karten mit ihrer normalen Platzierungslogik. Sonderfälle wie „P.E.K.K.A. überall platzierbar“ nutzen sie nicht gezielt aus.
- **`pe` im Snapshot** wird jeden Tick für alle Einheiten mit Perk mitgeschickt, auch wenn es unverändert ist. Bei den gemessenen Größen ist das unkritisch, wäre aber eine einfache Optimierung.
- **Balance-Stichprobe:** 20 Kämpfe sind wenig. Für belastbare Aussagen sollte man `tools/chaos/balance.mjs --games=200` laufen lassen (etwa 1 Minute).

## 9. Anleitung: weitere Karte in den Pool aufnehmen

1. **Pool erweitern:** Die Karten-ID in `data/chaos.json` → `cardPool` eintragen. Erlaubt sind 30 bis 40 Karten. Mehr als 40 lehnt `validateChaos` ab; die Grenze steht in `shared/chaos.js`.
2. **Drei Perks anlegen** in `data/chaos_perks.json` → `perks`, je einer für `common`, `rare` und `epic`.
   - **Pflichtfelder:** `id` (`<karte>.<stufe>`), `cardId`, `rarityTier`, `name`, `description`, `mechanicType` (`statBoost` | `behaviorChange` | `newAbility` | `spawnChange`), `effectParameters`, `elixirCostUnchanged: true`, `balanceNote`, `selection`.
   - **Bausteine:** In `effectParameters` nur vorhandene Bausteine verwenden, zum Beispiel `mult`, `add`, `set`, `unitMult`, `unitScale`, `traits`, `groups`, `deathSpawn`, `spell`, `hook`. Beispiele für jede Art stehen in [CHAOS_PERKS_OVERVIEW.md](CHAOS_PERKS_OVERVIEW.md).
   - **Kosten:** Kostenfelder (`elixir`, `cost`) sind verboten; die Datenprüfung lehnt sie ab.
   - **Neue Mechanik:** Sie braucht einen Hook in `server/sim/perks.js`, der an `px` gebunden ist, damit Karten ohne Perk unverändert bleiben. Bei Bedarf kommt eine Darstellung in `client/js/game/game.js` (`pv`-Ereignis) dazu.
3. **Prüfen und Übersicht neu schreiben:** `node tools/chaos/perks.mjs progress` prüft alle Pflichtfelder, `node tools/chaos/perks.mjs overview` schreibt [CHAOS_PERKS_OVERVIEW.md](CHAOS_PERKS_OVERVIEW.md) neu.
4. **Test ergänzen:** In `test/chaos-perks.test.js` einen Eintrag in `CHECKS` für die neue Karte anlegen, der alle drei Perks in der Simulation nachweist. Der Datentest in `test/chaos-rounds.test.js` erwartet die Poolgröße; die Zahl dort anpassen.
5. **Texte anpassen:** Ändert sich die Poolgröße, die Regelzeile in `data/modes.json` (Modus `chaos`) anpassen. Bei einer für Spieler sichtbaren Änderung einen neuen Eintrag oben in `client/js/updates.js` anlegen (siehe CLAUDE.md).
6. **Testen:** `node --test` ausführen. Optional `node tools/chaos/balance.mjs` und `node tools/chaos/screens.mjs` für Balance und Screenshots.

Bot-Deckbau, Deckbau-Filter, Angebote und Pool-Prüfung lesen den Pool aus den Daten. Dafür ist keine Code-Änderung nötig.
