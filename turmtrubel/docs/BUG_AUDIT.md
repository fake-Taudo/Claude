# Fehler-Audit (Version 1.7)

Systematische Prüfung des ganzen Spiels auf Fehler: Karten-Einsätze, Karten-Interaktionen, VFX, UI und Game-UI. Ausgangspunkt war eine Meldung: Beim Suspicious Bush kamen die Busch-Kobolde erst, nachdem er Schaden bekommen hatte.

Ergebnis: **15 Fehler gefunden und behoben**, 12 in der Simulation und 3 in der Oberfläche. Jeder Simulationsfehler hat einen Regressionstest. Außerdem gehört eine Fuzz-Prüfung jetzt zur Testsuite.

---

## 1. Vorgehen

| Bereich | Wie geprüft | Umfang |
|---|---|---|
| **Karten-Einsätze** | Skript spielt jede Truppen- und Gebäudekarte, normal und als Evo, gegen stille Türme. Geprüft wird: Anzahl der Einheiten, Bewegung, Turmschaden, Festsitzen und NaN. | 140 Karten, dazu alle Evo-Versionen |
| **Zielwahl** | Jede Karte gegen eine Bodenpuppe und gegen eine Luftpuppe. Trifft sie, was sie laut `targets` treffen soll, und nur das? | alle Truppen und Gebäude |
| **Zauber** | Jeder Zauber auf Boden-, Luft- und Gebäudeziel neben einem Turm. Gemessen wird der Schaden gegen die Kartenwerte (Wellen, Impulse, Turmanteil, Gebäudeschaden, Void-Stufen, Betäubung). | 21 Zauber |
| **Fähigkeiten** | Jede Champion- und Heldenfähigkeit gegen eine Gegnergruppe auslösen. Geprüft werden Wirkung (Unsichtbarkeit, Sprung, Spawns, Schaden), Ereignisse und NaN. | 8 Champions, 17 Helden |
| **Interaktionen** | Gezielte Fälle: Spiegel und Klon auf Champions, Helden und Evos; Zap setzt Inferno zurück; Frost stoppt Türme; Gebäude als Ablenkung; Rückstoß und Tornado am Fluss; Einsatz direkt am Fluss; Golemiten am Ufer; Elixierpumpe; Barbarenfass über den Fluss. | 20 Szenarien |
| **Fuzz** (`tools/audit/fuzz.mjs`) | Bot gegen Bot mit Zufallsdecks, jede zweite Partie mit Evos. Geprüft wird in **jedem Tick**: keine NaN-Werte, nichts außerhalb des Felds, keine Bodentruppe im Fluss oder in einem Turm, keine Überheilung, keine Einheit 8 s lang festsitzend, keine Ausnahme, und jeder Kampf endet. | rund 1 150 Kämpfe mit etwa 3,5 Mio. Ticks in Klassisch, 2 gegen 2, Unendlich-Elixier, Triple und Mega Draft |
| **VFX im Browser** | Echte Trainingskämpfe: 26 Decks decken alle 140 Karten ab (Evo-Plätze, Champions und Helden mit Fähigkeit). Ein Test-Client spielt jede Karte, dazu laufen Konsolenüberwachung und ein Bild alle 2,5 s. | 163 Karten- und Fähigkeitseinsätze, **0 Konsolenfehler** |
| **Kartendetails** | Detailfenster jeder Karte, normal und als Evo, mit allen Reitern. Gesucht wird nach undefined, NaN und null, leeren Werten, Überlauf und doppelten Chips. | 140 Karten im Hoch- und Querformat |
| **UI-Texte** (`tools/audit/ui-text.mjs`) | Alle DOM-Bildschirme: Menü, Neuigkeiten, Einstellungen mit allen Reitern, Regeln aller Modi, Deck-Bauer mit allen Decks, Filter und Leerzustand, Lobby, Beitreten, Kampf, Pause und Ergebnis. Geprüft werden Texte, abgeschnittene Knöpfe, Scrollen und die Konsole. | 390×844, 844×390, 1440×900, 320×568 |
| **Game-UI** (`tools/ui-shots.mjs`) | Kompletter Ablauf mit HUD, Kartenwahl, Ziehen, Toasts, Emotes, Pause, letzten 10 s, zerstörtem Turm, Aufgeben, Sieg und Niederlage, dazu die Lobby. Die Bilder habe ich zusätzlich selbst angesehen. | 8 Viewports × 26 Zustände, 0 automatische Befunde |

---

## 2. Gefundene und behobene Fehler

### Simulation

| # | Fehler | Ursache | Behebung | Test |
|---|---|---|---|---|
| 1 | **Suspicious Bush** (gemeldet): Der Busch blieb unsichtbar am Turm stehen. Die Busch-Kobolde kamen erst, wenn etwas ihn zerstörte. | Angegriffen wurde nur bei `damage > 0`. Kamikaze-Läufer ohne eigenen Schaden haben deshalb nie „gezündet“. | Kamikaze-Einheiten zünden am Ziel auch ohne Schaden; dabei entsteht kein 0-Schaden-Treffer. | `mechanics`: Kamikaze ohne eigenen Schaden |
| 2 | **Skelettfass** schwebte in den Turm und platzte erst, wenn der Turm es abschoss. | wie 1 | wie 1 | wie 1 |
| 3 | **Dunkler Prinz** (und Held) schlug zu, traf aber nichts. | Der Rundumschlag hat Radius 1,1 um ihn selbst, die Reichweite ist aber 1,2. Am Rand der Reichweite lag das Ziel außerhalb des Kreises. | Ein Rundumschlag trifft immer auch das angegriffene Ziel. | Truppen-Audit (Bodenpuppe) |
| 4 | **Spiegel nach einem Champion** brachte einen zweiten Champion aufs Feld. | Der Spiegel kopierte jede letzte Karte. | Champions lassen sich nicht spiegeln. Neuer Ablehnungscode `MIRROR_CHAMPION` mit eigener Meldung; der Spiegel ist dann ausgegraut. | `mechanics`: Spiegel kopiert keinen Champion |
| 5 | **Große Einheiten hingen fest**, zum Beispiel der Riesen-Held 14 s zwischen eigenem Turm und Kanone oder der Golem zwischen Koboldkäfig und Turm. | Die Wegfindung blies Hindernisse für alle Einheiten nur um 0,2 Felder auf und schickte große Einheiten durch Lücken, in die sie nicht passen. | **Vier Raster je Größenklasse** (Radius bis 0,35, 0,55 und 0,75 sowie darüber) mit passendem Abstand. Große Einheiten nehmen die Brückenmitte. | Fuzz |
| 6 | **Eingeklemmte Einheiten** liefen stur gegen ein Gebäude, etwa ein Berserker-Held zwischen eigenem Turm und zwei Teslas. | Lag die Startzelle im Sperrbereich, fand A* keinen Weg. | Die Suche startet in der nächsten freien Zelle. | Fuzz |
| 7 | **Frontale Begegnung auf der Brücke**: Riesen-Held und Elektroriese schoben sich etwa 10 s lang gegenseitig. | Die Trennung schob nur entlang der Verbindungslinie. | Gegner, die sich im Laufen frontal treffen, weichen seitlich aus. | Fuzz |
| 8 | **Banditin-Sprint genau auf dem Ziel** machte die Position zu NaN. Über die Kollision verschwanden danach im 2 gegen 2 **alle** Einheiten vom Feld. | Division durch den Abstand 0 | Die Division ist abgesichert. Zusätzlich setzt ein Sicherheitsnetz ungültige Positionen auf die letzte gültige zurück; es greift im Fuzz nie. | `mechanics`: Sprint genau auf dem Ziel |
| 9 | **Spawns in Türmen und Gebäuden**: Kobolde aus dem Koboldfass klemmten zwischen Turm und Grabstein. | `spawnAround` suchte keinen freien Platz. | Bodentruppen werden am nächsten freien Punkt erzeugt. | Fuzz |
| 10 | **Rückstoß nach der Kollisionsauflösung**, zum Beispiel durch Todesschaden: Die Einheit stand einen Tick lang sichtbar im Turm. | Die Tod-Effekte laufen nach der Kollisionsauflösung. | Wer zurückgestoßen wird, wird sofort aus Türmen, Gebäuden und dem Fluss geschoben. | Fuzz |
| 11 | **Rücksprung von Magieschützen-Held und Flucht der Boss-Banditin** landeten im eigenen Turm und wurden dann herausgeschoben. | Beim Sprungziel wurden Hindernisse nicht geprüft. | Neuer Baustein `landingSpot`: der nächste freie Landeplatz auf der Sprunglinie | Fähigkeiten-Audit |
| 12 | **Klone heilten über 1 Lebenspunkt**: Ein Klon der Evo-Hexe hatte 77/1. | Heilungen mit eigenem Höchstwert galten auch für Klone. | Klone werden höchstens bis zu ihrem Maximum geheilt. | Fuzz |

### Oberfläche

| # | Fehler | Behebung |
|---|---|---|
| 13 | Der **Dreh-Hinweis** „Tipp: Dreh dein Handy ins Querformat“ lag zu Kampfbeginn über Hand und Elixierleiste. | Er erscheint jetzt oben in der Arena. |
| 14 | In den **Kartendetails** stand bei Champions zweimal „Champion“, weil Seltenheit und Klasse gleich heißen. | Ist die Klasse schon die Seltenheit, steht stattdessen der Kartentyp da („Champion · Truppe“). |
| 15 | **Deck-Bauer auf schmalen Bildschirmen**: Der Deckname wurde zu „Gole…“ (390 px), „S.“ (Querformat) oder ganz unsichtbar (320 px). Die Schilder „EVO 2“ und „CHAMP/HELD“ überlappten, Kartennamen brachen mitten im Wort („Nachthe xe“, „Tornad o“). | Eine Container-Abfrage auf die Deck-Spalte gibt dem Namen eine eigene Zeile, und das Schild zeigt dort nur den Stern. `fitCardNames` setzt Namen kleiner, deren längstes Wort samt Trennstrich nicht passt; gemessen wird mit der geladenen Webschrift. In den 39 px kleinen Deckplätzen auf ≤ 360 px gibt es keine Namen, wie im Original. |

---

## 3. Geprüft, ohne Befund

- **Zauberwerte** stimmen genau mit den Kartendaten, zum Beispiel Pfeile 3 × 122 mit 25,4 % Turmanteil, Erdbeben 3 × 287 gegen Gebäude und die Void-Stufen 294 × 3 bei vier Zielen.
- **Zielwahl** aller Truppen und Gebäude. Gemischte Karten treffen über ihre zweite Einheit zu Recht auch anderes: Koboldbande, Koboldriese, Nachthexe, Rüpelbande, Widderreiterin, Koboldhütte und der Koboldmaschinen-Raketenwerfer laut Daten.
- **Alle 25 Champion- und Heldenfähigkeiten** lösen aus und wirken.
- **Interaktionen:**
  - Klon kopiert keine Champions, und Klone von Helden haben keine Fähigkeit.
  - Zap setzt Inferno zurück, Frost stoppt Türme.
  - Gebäude ziehen Gebäudejäger um.
  - Der Spiegel nach einer Evo spielt die normale Karte.
  - Der Tod der Elixierpumpe gibt Elixier.
  - Barbaren aus dem Barbarenfass landen über dem Fluss.
  - Massen-Einsätze direkt am Fluss landen nie im Wasser.
- **VFX:** 0 Konsolenfehler über alle Karten. Inferno-Strahl, X-Bogen, Fähigkeits-Banner, Evo-Effekte, Tod-Animationen und Kampfzahlen werden gezeichnet.
- Die **Game-UI** ist in 8 Viewports ohne Befunde (Arena unter dem HUD, Überlauf, Touch-Ziele, Toasts über der Arena, Konsole).

## 4. Bewusst so belassen

- Der **Königsgeist** schwebt über den Fluss (`hover`), wie im Original.
- **Evo-Fledermäuse** dürfen laut Daten bis 244 Lebenspunkte überheilen. Die Lebensleiste ist auf 100 % begrenzt.
- **Englische Namen** von elf neueren Karten wie „Suspicious Bush“ bleiben: Es gibt keinen deutschen Wiki-Eintrag (`TODO_missing_stats.md`).
- **Staus eigener Einheiten** auf der Brücke in Unendlich-Elixier, wenn sehr viele schwere Truppen gleichzeitig laufen. Gleiche Seite, kein Gegner, sie lösen sich von selbst auf.

## 5. Folgen für Tests und Messwerte

- `npm test`: **344 Tests, alle grün** (vorher 338). Neu sind:
  - 3 Regressionstests in `mechanics`: Kamikaze ohne Schaden, Spiegel und Champion, Sprint auf dem Ziel;
  - `fuzz.test.js` mit 12 Kurz-Kämpfen in Klassisch, 2 gegen 2 und Unendlich-Elixier.
- Die klassische **Regressions-Aufzeichnung** (`test/fixtures/classic-replay.json`) ist neu geschrieben, weil die Fehlerbehebungen das Verhalten absichtlich ändern. Bis Version 1.6 war sie bitgenau unverändert. Ab jetzt fällt wieder jede unbeabsichtigte Änderung auf.
- Die **Bot-Auswertung** (`docs/bot_eval.json`) ist neu gemessen. Schwer > Mittel > Leicht gilt weiter in jedem Modus.

## 6. Werkzeuge zum Wiederholen

```bash
node tools/audit/fuzz.mjs 200 classic        # auch: 2v2, infinite-elixir, triple-draft, mega-draft
node tools/audit/ui-text.mjs                 # Texte/Überlauf/Konsole aller DOM-Bildschirme in 4 Größen
node tools/ui-shots.mjs --jpeg --out=…       # Game-UI-Ablauf in 8 Viewports
node tools/modes/classic-replay.mjs          # klassische Regression vergleichen (--write: neu aufzeichnen)
```
