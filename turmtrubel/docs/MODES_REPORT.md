# Bericht: Neue Spielmodi (2v2, Triple Draft, Mega Draft, Unendlich-Elixier)

Erweiterung eines laufenden Spiels, kein Neubau. Der klassische 1v1-Modus ist **Tick für Tick identisch** geblieben: 12 aufgezeichnete Kämpfe, Prüfsumme über den kompletten Snapshot jedes Ticks. Alle vier Modi sind im Multiplayer per Code spielbar, drei davon auch gegen Bots in drei Stufen. Ausnahme ist 2v2, das es nur im Multiplayer gibt.

Weitere Dokumente:

- Audit: [MODES_AUDIT.md](MODES_AUDIT.md)
- Protokoll: [PROTOCOL.md](PROTOCOL.md)
- Screenshots: [screens/](screens/), jeweils Hochformat 390×844, Querformat 844×390 und Desktop 1440×900
- Messwerte: [modes_perf.json](modes_perf.json), [bot_eval.json](bot_eval.json)

---

## 1. Was wurde umgebaut (nach Phasen)

### Phase 1: Audit

- `docs/MODES_AUDIT.md`: alle Stellen mit „genau 2 Spielern“, Bot, Elixier, Phasen, Decks und Protokoll v1, dazu die Risiken.
- Noch **vor** jeder Änderung habe ich `test/fixtures/classic-replay.json` aufgezeichnet: 12 Bot-Kämpfe mit festen Seeds und 745 Eingaben.

### Phase 2: Modus-Framework

- **`data/modes.json`** beschreibt jeden Modus: id, Name, Beschreibung, Icon, Spieler, Teams, `multiplayerOnly`, `botsAllowed`, `deckSource` (`saved` | `draft`), Elixier-Parameter, Spielzeiten, Evos, Draft-Parameter, 2v2-Parameter, Eingabe-Limit, Bot-Bremse und Regel-Hinweise.
- **`shared/modes.js`**:
  - `validateModes` prüft die Datei.
  - `resolveRules(rules, mode)` wendet **komponierbare Modifikatoren** nacheinander an: Elixier-Faktor, Phasen an/aus, Start-Elixier, „nie verbraucht“, Spielzeiten, Sudden Death, Evos, Eingabe-Limit, Teams. Ein Test baut zum Beispiel einen Draft mit ×7-Elixier allein über die Daten.
  - Für den klassischen Modus kommt **dasselbe Regelobjekt** zurück.
- **Der Server legt den Modus fest:** Clients senden nur eine Modus-ID. Werte oder ganze Modus-Objekte werden abgewiesen (`UNKNOWN_MODE`).
- **Simulation auf N Spieler und 2 Teams verallgemeinert:**
  - `owner` steht für das Team (Freund/Feind, Spielhälfte, Türme, Kronen), das neue Feld `pl` für den Spieler (Elixier, Hand, Champion, Fähigkeit, Statistik).
  - Folge-Einheiten wie Spawner, Todes-Spawns, Zauber-Beschwörungen, Klone, Verwandlungen und Flüche erben den Spieler über einen Wirk-Kontext (`ctxPl`). Der Kontext wird auch an verzögerte Aktionen weitergegeben.
  - Klassisch ist das einfach `teamOf = [0, 1]`.
- **Protokoll Version 2** mit Versionsprüfung. Alte Clients bekommen „Turmtrubel wurde aktualisiert – bitte Seite neu laden.“

### Phase 3: Unendlich-Elixier

- Elixier ×7 durchgehend, ohne Doppel- oder Dreifach-Phase (`phases: false`). Start und Maximum liegen bei 10.
- Feste Tick-Schritte: +0,125 Elixier pro Tick, exakt darstellbar. Der Server prüft Elixier weiter autoritativ.
- Schalter `elixir.infinite` für „nie verbraucht“, standardmäßig aus.
- Eingabe-Limit: Token-Bucket pro Spieler auf Sim-Zeit, 2,5 Platzierungen/s, Burst 4. Es gilt für Menschen und Bots gleichermaßen (`TOO_FAST`). Der Kartenzyklus läuft normal.
- HUD:
  - Banner „Unendlich-Elixier!“ zum Start und „×7“-Abzeichen an Timer und Elixierleiste.
  - Kein falsches „Doppeltes Elixier“-Banner, weil der Grundfaktor aus dem Modus übernommen wird.
  - Die Leiste füllt sich über die Vorhersage aus Faktor und Regenerationszeit ohne Sprünge.
- Performance: siehe Abschnitt 5.

### Phase 4: Triple Draft und Mega Draft

`server/draft.js` (seed-basiert):

- **Triple Draft**
  - 8 Runden, je 3 Angebote, alle wählen gleichzeitig. Die Gegenseite sieht nur „hat gewählt“.
  - 15 s pro Runde, danach Auto-Pick.
  - Höchstens 1 Champion und 1 Held pro Deck, Held nie zusammen mit seiner Grundkarte, keine Duplikate, keine Evolutionen.
  - **Playability-Guard**: Wird es knapp, enthält das Angebot rechtzeitig eine Luftabwehr bzw. einen Zauber oder ein Gebäude.
- **Mega Draft**
  - Pool aus 40 Karten: genau 3 Champions und 37 reguläre Truppen, Zauber und Gebäude, keine Helden.
  - Mindestwerte aus `modes.json`: ≥ 6 Karten mit ≤ 3 Elixier, ≥ 5 gegen Luft, ≥ 4 Zauber, ≥ 2 Gebäude, ≥ 3 Seltenheiten.
  - Der Startspieler wird per Los bestimmt, danach wird abwechselnd gewählt, bis jeder 8 Karten hat (24 bleiben übrig).
  - Gewählte Karten sind gesperrt und dem Wählenden zugeordnet. Champion-Sperre pro Deck. 25 s pro Wahl, danach Auto-Pick nur unter erlaubten Karten.
- Danach folgt ein Reveal beider Decks (5 s, mit Countdown) und der Kampf. Die gespeicherten Decks bleiben unberührt.
- Ein Reconnect während des Drafts stellt Zustand und Restzeit wieder her. Der Auto-Pick läuft serverseitig weiter.
- Verlässt jemand den Draft, wird er mit klarer Meldung abgebrochen.

`client/js/ui/draft.js`:

- **Triple:** große Karten. Tippen wählt aus, Halten zeigt Details, „Wählen“ bestätigt.
- **Mega:** scrollbares Raster mit mindestens 4 Spalten auf dem Handy, Filter nach Typ, Elixier und Seltenheit plus Suche. Die Champions sind oben angepinnt und gold umrandet, gewählte Karten tragen die Farbe und den Namen des Wählenden, gesperrte Champions sind ausgegraut („Du hast bereits einen Champion“).
- Für beide: Timer-Leiste, Fortschritt (Runde 3/8 bzw. Gewählt 3/8), „Du bist dran / … wählt“, eigene Deck-Leiste mit Ø-Elixier. Die gewählte Karte fliegt in die Leiste. Im Mega Draft sind die Picks des Gegners sichtbar.

### Phase 5: 2 gegen 2

- **Spielregeln**
  - Jedes Team teilt sich Burgturm, zwei Wachtürme und eine Hälfte. Der Burgturm erwacht für das ganze Team.
  - Jeder Spieler hat eigenes Deck, eigene Hand, eigenes Elixier mit Phasen und eigenen Champion.
  - Kein Eigenbeschuss, Heilung und Wut wirken auf Verbündete. Kronen zählen pro Team.
- **Lobby**
  - 4 sichtbare Plätze in 2 Teams. Spieler wählen einen freien Platz (`seat`), der Gastgeber verschiebt oder tauscht (`move`) und entfernt Spieler (`kick`).
  - Start erst, wenn alle 4 Plätze besetzt und bereit sind. Die Lobby zeigt, wer fehlt.
  - Rematch nur, wenn alle 4 zustimmen. Die Teams bleiben gleich.
- **Abbruch**
  - Ist ein Spieler nach 30 s nicht zurück, übernimmt ein Bot (`botTakeover`, Stufe Mittel) sein Deck für den Rest des Kampfs.
  - Wer später zurückkommt, sieht „ein Bot hat deinen Platz übernommen“. Ein Rematch ist danach nicht möglich.
  - „Aufgeben“ heißt hier „Kampf verlassen“, dann übernimmt ebenfalls ein Bot.
- **Kampf**
  - Teamkollegen-Anzeige mit Name, Mini-Elixierleiste und zuletzt gespielter Karte: im Querformat im Seitenpanel, im Hochformat in der eigenen Arena-Ecke.
  - Einheiten des Kollegen tragen einen gestrichelten, drehenden Ring.
  - Emotes erscheinen mit Namen, Zeichen per Tippen und Halten (Abklingzeit 2 s, nur fürs eigene Team).
  - Ergebnis mit Teamsieg, Kronen und allen 4 Namen.

### Phase 6: Bots

Den bestehenden Bot habe ich erweitert, nicht ersetzt. **Mittel ist exakt der bisherige Trainingsbot**: Der Regressionstest vergleicht seine Eingaben und die Prüfsummen mit der Aufzeichnung von vorher.

- **Leicht:** reagiert in 1,1–2,5 s, verteidigt spät und nur zu 65 %, spart bis 8–10 Elixier und platziert ungenauer.
- **Schwer:**
  - reagiert in 0,3–0,75 s, fängt Gebäudejäger schon vor der Brücke ab und wählt Konter nach Bedrohung: gegen Luft Luftabwehr, gegen Tanks DPS bzw. Gebäude in der Mitte, gegen Schwärme Flächenschaden;
  - setzt Zauber nur mit Wert ein (≥ 3 Kills oder ≥ 2 mit billigem Zauber, Turm-Finisher) und unterstützt eigene Tanks und überlebende Verteidiger mit Fernkampf (Gegenangriff);
  - greift an, wenn der Gegner sichtbar viel ausgegeben hat, und lässt kein Elixier verfallen.
- **Was die Bots sehen:** Unterirdische oder getarnte Einheiten ignorieren Leicht und Schwer. Mittel behält das alte Verhalten.
- **Bremse bei Unendlich-Elixier:** Mindestabstand zwischen Aktionen von 2,2 / 1,3 / 0,8 s.
- **Draft-Logik** (`server/botdraft.js`):
  - Leicht wählt zu 75 % zufällig.
  - Mittel bewertet Rollen (Luftabwehr, Zauber, Win-Condition, Tank, Fläche) und die Elixier-Kurve (Ziel Ø 3,5).
  - Schwer berücksichtigt zusätzlich Synergien und Konter gegen sichtbare Picks im Mega Draft.
  - Champion nur, wenn er passt, ohne Pflicht zur frühen Wahl. Bedenkzeit 1–6 s.
- Bot-Namen: „Bot Leicht/Mittel/Schwer“, bei einer Übernahme „Bot für Name“.

### Phase 7: Menü und Oberfläche

- **Hauptmenü, Bereich „Spielmodi“:** Kacheln mit Icon, Name, Kurzbeschreibung und Spielerzahl, darunter „Mit Freunden“ und „Gegen Bot“. Bei 2v2 ist „Gegen Bot“ ausgegraut, mit Tooltip und Hinweis „Nur Multiplayer“. Bot-Stärke als Umschalter mit Erklärung. Der klassische Freundschaftskampf oben bleibt der Standard.
- **Regel-Hinweis** beim ersten Mal pro Modus („Beim nächsten Mal nicht mehr anzeigen“) und jederzeit über die Lupe bzw. „Regeln“ in der Lobby.
- **Lobby:** Modus-Abzeichen. Wer mit Code beitritt, sieht den Modus automatisch, als Gast mit Regel-Hinweis. In Draft-Modi steht ein Hinweis statt der Deck-Auswahl.
- **Ergebnis:** Teamsieg mit allen Namen. Bei Drafts sind beide Decks anzusehen (Tippen öffnet Details), und „Deck speichern“ legt das Draft-Deck in einen gewählten Platz.
- Alle neuen Texte stehen zentral in `client/js/lang/de.js`. Modus-Texte kommen aus `modes.json`, Server-Fehlertexte aus `shared/protocol.js`.
- Touch-Ziele sind mindestens 44 px groß (geprüft von `tools/modes/screens.mjs`). Hoch- und Querformat sowie Desktop sind abgedeckt, Bewegungen werden bei `prefers-reduced-motion` reduziert.
- Nebenbei behoben: Auf 360 px schmalen Handys ragten „Rematch“ und „Zurück zum Menü“ 8 px über den Rand.

---

## 2. Neue und geänderte Dateien

**Neu**

| Datei | Inhalt |
|---|---|
| `data/modes.json` | Fünf Modi als Daten |
| `shared/modes.js` | Prüfung, Auflösung in effektive Regeln, Team-Layout |
| `server/draft.js` | Triple/Mega Draft, Pool-Generator, Regeln, Auto-Pick, Deck-Anordnung |
| `server/botdraft.js` | Draft-Entscheidungen der Bots |
| `client/js/ui/modes.js` | Modi-Kacheln, Bot-Stärke, Regel-Hinweis, Modus-Abzeichen |
| `client/js/ui/draft.js` | Draft-Screen und Reveal |
| `client/js/lang/de.js` | Texte der Modi |
| `docs/MODES_AUDIT.md`, `docs/PROTOCOL.md`, `docs/MODES_REPORT.md`, `docs/screens/`, `docs/modes_perf.json`, `docs/bot_eval.json` | Dokumentation und Messwerte |
| `tools/modes/classic-replay.mjs` | Regressions-Aufzeichnung des klassischen Modus |
| `tools/modes/screens.mjs` | Screenshot-Serie der Modi mit UI-Prüfungen |
| `tools/modes/perf-infinite.mjs` | Last- und Performance-Test Unendlich-Elixier |
| `tools/modes/bot-eval.mjs` | Bot-gegen-Bot-Auswertung |
| `test/classic-regression.test.js`, `modes`, `draft`, `teams`, `rooms-modes`, `modes-e2e`, `bots` | Tests (siehe Abschnitt 4) |
| `test/fixtures/classic-replay.json` | Aufzeichnung vor dem Umbau |

**Geändert**

| Datei | Änderung |
|---|---|
| `server/sim/match.js` | N Spieler, Team-Zuordnung, Wirk-Kontext, Elixier-Faktor/Phasen/„nie verbraucht“, Eingabe-Limit, Evos abschaltbar, Snapshot-Erweiterung nur in Team-Modi |
| `server/sim/traits.js`, `abilities.js`, `combat.js`, `spells.js` | Spieler-bezogene Stellen auf `pl` (Elixiersammler, Elixiergolem an alle Gegner, Champion-Rückkehr, Fähigkeit, Statistik, Fluch) |
| `server/rooms.js` | Modus pro Raum, N Plätze, Team-Lobby, Draft-/Reveal-Phase, Bot-Übernahme, Team-Ping, Training mit Modus und Stufe |
| `server/bot.js` | Spieler ≠ Team, Stufen Leicht/Schwer, Sichtbarkeit, Aktionsbremse |
| `server/index.js` | Protokollprüfung, neue Nachrichten, `/data/modes.json`, Test-Option `rulesOverride` |
| `shared/protocol.js` | Version 2, neue Typen, Fehler- und Draft-Codes |
| `shared/cards.js` | `targetsAir` exportiert |
| `client/js/main.js` | Modi laden, Erstellen/Training/Beitritt je Modus, Lobby inkl. Team-Lobby, Draft-Handler, Ergebnis je Modus, Hinweis bei veraltetem Client |
| `client/js/game/game.js`, `hud.js`, `renderer.js` | Team statt Seite, Ereignisse mit Spieler-Index, Verbündeten-Ring, Teamkollegen-Anzeige, Ping, Emotes mit Namen, Modus-Banner |
| `client/index.html`, `client/css/style.css` | Neue Bereiche und Screens im Nachtblau-Stil |
| `client/js/store.js`, `client/js/ui/settings.js`, `client/js/net.js` | Bot-Stärke, ausgeblendete Regel-Hinweise, Protokollversion |
| `client/js/updates.js` | Update-Eintrag 1.5 |
| `tools/e2e/client.mjs`, `test/integration.test.js` | Protokoll v2, Plätze/Teams, Draft, Lasttest-Modus |
| `README.md` | Spielmodi, Steuerung, Tests, Werkzeuge, Einschränkungen |

---

## 3. Protokoll-Änderungen

Die vollständige Beschreibung steht in [PROTOCOL.md](PROTOCOL.md). Kurz:

- `hello.protocol` ist Pflicht. Andere Versionen bekommen `OUTDATED` mit „Bitte Seite neu laden“.
- `create` und `training` tragen `mode` (nur die ID), `training` zusätzlich `difficulty`.
- Neu vom Client: `seat`, `move`, `kick`, `draftPick`, `mapPing`.
- Neu vom Server: `draft`, `draftReveal`, `teamPing`, `takeover`.
- `lobby`, `matchInit`, `matchEnd` und `presence` haben zusätzliche Felder (Modus, Plätze, Teams, Bots, Draft-Decks).
- Snapshot: Nur in Team-Modi bekommt jede Entität das Feld `pl`, und `me.tm` liefert die Daten der Teamkollegen. Der klassische Snapshot bleibt Byte für Byte gleich.

---

## 4. Testergebnisse

`npm test`: **338 Tests, alle grün** (vorher 284). Davon neu:

| Datei | Prüft |
|---|---|
| `classic-regression` | Die 12 aufgezeichneten Kämpfe ergeben Tick für Tick dieselben Snapshot-Prüfsummen, Zwischenstände und Ergebnisse; der Standard-Bot trifft dieselben Entscheidungen |
| `modes` (11) | `modes.json` gültig, Fehlererkennung, klassisch = gleiches Regelobjekt, komponierbare Modifikatoren; ×7: Start 10, nach 40 Ticks exakt +5, Maximum 10; keine Phasen (auch in der Verlängerung); autoritative Elixierprüfung, Eingabe-Limit mit Burst 4, „nie verbraucht“, konfigurierbare Spielzeiten; Draft ohne Evos |
| `draft` (8) | Reproduzierbar per Seed; 150 Triple-Drafts mit absichtlich schlechter Wahl bleiben gültig und spielbar; verdeckte gleichzeitige Wahl; Auto-Pick nur aus dem Angebot; **500 Mega-Pools**: 40 eindeutige Karten, genau 3 Champions, 0 Helden, alle Mindestwerte; strikt abwechselnde Wahl, Startspieler per Los, Sperren mit Besitzer, 24 übrig; Champion-Regel auch für Auto-Pick und alle Bot-Stufen (180 Drafts); Bot-Decks ausgewogen |
| `teams` (12) | 4 Spieler / 2 Teams, gemeinsame Türme, Burgturm fürs Team, Kronen pro Team, kein Eigenbeschuss (Zauber und Nahkampf), Wut und Heilung für Verbündete, Folge-Einheiten gehören dem Spieler, Elixiersammler und -golem pro Spieler, gleicher Champion bei Teamkollegen, Aufgabe pro Team, 4 Bots spielen 2v2 durch |
| `rooms-modes` (13) | Gefälschte Modi und Werte, Beitritt zeigt den Modus, 4-Platz-Lobby, Platzwahl/Verschieben/Entfernen, Start mit 4, Bot-Übernahme nach 30 s ohne Wiedereinstieg, Rematch mit allen 4, Team-Ping, Draft im Raum (fremde Karte, Doppel-Pick, Auto-Pick nach 15 s, Reveal, Kampf mit Draft-Decks), Reconnect mit Restzeit, Abbruch, Training in allen Draft-Modi und Stufen, Bot-Bremse |
| `modes-e2e` (5) | Echte WebSockets: **4 Clients** spielen 2v2 (Teamwechsel, Platz klauen abgewiesen, 5. Spieler abgewiesen, kompletter Kampf, Rematch mit allen 4, Abbruch → Bot übernimmt, Rückkehr abgewiesen); **Triple und Mega Draft** mit Reconnect mitten im Draft bis zum Kampfende; **Unendlich-Elixier** mit Massen-Platzierungen (366 Platzierungen, Server-Tick p50 0,48 ms, p99 1,49 ms); **manipulierte Clients** (alte Version, Modus-Objekt, Bots in 2v2, nicht angebotene Karte, Objekt statt ID, Doppel-Pick, fremde Karte, Elixier-Felder) |
| `bots` (5) | Jede Stufe in jedem Bot-Modus bis zum Ende, 2v2 ohne Bots, Mindestabstand bei ×7, Sichtbarkeit, Stärke-Auswertung |

Dazu ohne Fehler durchgelaufen:

- `tools/ui-shots.mjs`: 8 Viewports × 26 Zustände, Konsole 0, keine Befunde mehr
- `tools/e2e/browser-match.mjs`: zwei Browser, 0 Desync, 0 Konsolenfehler
- `tools/modes/screens.mjs`: 3 Viewports × 15 Zustände, keine Befunde

### Bot-Auswertung

Bot gegen Bot, je 40 Kämpfe pro Paarung. Decks und Seiten werden getauscht, in Draft-Modi draftet jeder Bot selbst. Werte aus `docs/bot_eval.json`:

| Modus | Schwer – Mittel | Mittel – Leicht | Schwer – Leicht |
|---|---|---|---|
| Klassisch | 70 % | 70 % | 80 % |
| Unendlich-Elixier | 62,5 % | 92,5 % | 95 % |
| Triple Draft | 65 % | 70 % | 85 % |
| Mega Draft | 65 % | 85 % | 87,5 % |

Leicht verliert gegen beide anderen Stufen deutlich und ist damit schlagbar; Schwer ist in jedem Modus spürbar stärker.

---

## 5. Performance

### Klassisch, vorher (`ded3934`) gegen nachher, gleiche Maschine

| Messung | vorher | nachher |
|---|---|---|
| Server: Simulation pro Tick (12 Kämpfe, 46 287 Ticks, gleiche Eingaben) | 57 µs | 58 µs (Prüfsummen identisch) |
| Client Extremszene, Desktop 1440×900, CPU 1× (2 Läufe) | 42 / 42 FPS | 41 / 43 FPS |
| Client Extremszene, Handy 390×844, CPU 4× (2 Läufe) | 15 / 17 FPS | 16 / 16 FPS |

Der klassische Modus ist also weder auf dem Server noch im Client langsamer geworden.

### Unendlich-Elixier mit maximaler Einheitenzahl

`tools/modes/perf-infinite.mjs`: Zwei Spieler spielen nur Schwarm-Karten, so schnell es die Server-Regeln erlauben. Für den schlimmsten Fall ist `elixir.infinite` an, damit nur das Eingabe-Limit bremst.

| | Ergebnis |
|---|---|
| Einheiten | **260 / 260** (Limit `maxEntities`) |
| Server-Tick | Ø 3,9 ms · p99 9,4 ms · max 20,3 ms bei einem Budget von 50 ms (20 Ticks/s) |
| Server-Tick mit normalem ×7-Elixier (`--spend`, max. 153 Einheiten) | Ø 1,8 ms · p99 7,0 ms · max 15,2 ms |
| Client Desktop 1440×900, CPU 1× | 45 FPS, p95 33 ms |
| Client Handy hoch/quer, CPU 4× gedrosselt | 19 / 19 FPS, p95 83 ms |

**Ergebnis:** Der Server bleibt stabil, mit großem Abstand zum Budget.

Die Ziele von 60 FPS auf dem Desktop und 30 FPS auf der gedrosselten Mittelklasse-CPU erreicht der Client in **dieser Messumgebung** nicht. Die Umgebung ist ein Container ohne GPU, Chromium rastert dort alles in Software. Das CPU-Profil der Szene zeigt: ≈ 73 % der Zeit entfallen auf das native Rastern (`(program)` 60,5 %, `drawImage` 12,8 %), die Spiel-Logik liegt im einstelligen Prozentbereich.

Unter Last senkt die vorhandene automatische Qualität Effektmenge (`fxLoad` 0,4), Auflösung und Figuren-Stufe (`chars: low`). Die Partikel-Spitze lag bei ≈ 525. Dieselbe Grenze zeigt schon die klassische Extremszene (41–43 FPS Desktop). Eine Messung auf echter Hardware mit GPU steht noch aus.

---

## 6. Bekannte Einschränkungen

- **Zwei Teams fest:** Die Arena hat genau zwei Hälften. „N Spieler“ heißt deshalb N Spieler in 2 Teams; mehr Teams bräuchten eine neue Arena.
- **Drafts nur im 1 gegen 1** (geprüft in `validateModes`).
- **Aufgeben im 2 gegen 2** heißt Kampf verlassen: Ein Bot übernimmt, solange noch ein anderer Mensch im Raum ist. Verlässt auch der letzte Mensch den Kampf, verliert sein Team durch Aufgabe.
- **Bot-Übernahme nutzt Stufe Mittel.** Der übernommene Platz ist für den Rest des Kampfs ein Bot; danach gibt es kein Rematch.
- **Abbruch im Draft:** Der Draft endet, die Lobby kehrt zurück, oder der Raum schließt, wenn der Gastgeber geht. Es gibt keinen „Sieg durch Abbruch“, weil noch kein Kampf läuft.
- **Bot-Sicht:** Mittel bleibt aus Kompatibilitätsgründen beim alten Verhalten und sieht auch unterirdische Einheiten. Leicht und Schwer sehen nur, was ein Spieler sieht.
- **Draft-Decks im normalen Spiel:** Ein gespeichertes Draft-Deck kann gegen die normalen Deck-Regeln verstoßen (Champion **und** Held, Evo-fähige Karten in den Evo-Plätzen). Der Speicher-Dialog weist darauf hin, der Deck-Bauer zeigt die Fehler an.
- **Performance-Ziele** sind nur ohne GPU gemessen, siehe Abschnitt 5.
- **Texte:** Neue Texte stehen zentral in `client/js/lang/de.js`. Ältere Texte des Spiels stehen weiter direkt im Code.

---

## 7. Einen weiteren Modus hinzufügen

Für die meisten Varianten reicht ein neuer Eintrag in `data/modes.json`; Code ist nicht nötig. Beispiel „Blitzkampf“: 90 Sekunden, doppeltes Elixier von Anfang an, keine Verlängerung, gegen Bots spielbar.

```json
{
  "id": "blitz",
  "name": "Blitzkampf",
  "short": "90 Sekunden, doppeltes Elixier",
  "description": "Kurz und schnell: anderthalb Minuten mit doppeltem Elixier, ohne Verlängerung.",
  "icon": "bolt",
  "players": 2,
  "teams": 2,
  "multiplayerOnly": false,
  "botsAllowed": true,
  "deckSource": "saved",
  "elixir": { "multiplier": 2, "phases": false },
  "match": { "regularSeconds": 90, "overtimeSeconds": 0 },
  "rules": ["90 Sekunden Spielzeit, keine Verlängerung.", "Doppeltes Elixier von Anfang an."]
}
```

Bausteine (alle optional, fehlende Werte = klassisch):

| Feld | Wirkung |
|---|---|
| `players` (gerade, 2–8), `teams` (2) | Sitze; die Hälfte gehört je einem Team |
| `deckSource` | `saved` (eigenes Deck) oder `draft` (dann `draft.kind`: `triple` oder `mega` mit den Parametern aus den bestehenden Einträgen) |
| `elixir.multiplier`, `elixir.phases`, `elixir.start`, `elixir.infinite` | Elixier-Faktor, Doppel-/Dreifach-Phasen an/aus, Start, „nie verbraucht“ |
| `match.regularSeconds`, `match.overtimeSeconds`, `match.suddenDeath` | Spielzeit, Verlängerung (`0` = keine), `firstCrown`/`firstHit` |
| `evos` | `false` schaltet Evolutionen ab |
| `limits.playsPerSecond`, `limits.burst` | Eingabe-Limit pro Spieler |
| `bot.minGap.{easy,medium,hard}` | Mindestabstand zwischen Bot-Aktionen |
| `twoVsTwo.botTakeover`, `twoVsTwo.pingCooldown` | Team-Modi: Bot übernimmt bei Abbruch, Abklingzeit des Zeichens |
| `icon` | Name aus `client/js/ui/icons.js` |
| `rules` | Regel-Hinweise für das Info-Fenster |

Danach:

1. Server neu starten. Der Modus erscheint automatisch als Kachel im Menü.
2. `node --test test/modes.test.js` prüft die Datei. Der Test erwartet die Liste der Modi, die Erwartung dort ergänzen.
3. Einen Eintrag im Update-Fenster anlegen (`client/js/updates.js`, siehe `CLAUDE.md`).

Nur völlig neue Mechaniken brauchen Code, etwa eine neue Draft-Art oder mehr als zwei Teams: eine Klasse in `server/draft.js` (gleiche Schnittstelle: `pending`, `pick`, `autoPick`, `stateFor`, `decks`) bzw. eine neue Arena-Geometrie.
