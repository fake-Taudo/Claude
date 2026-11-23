# Claude-Code-Prompt: Roboter-Automatisierung nachrüsten

Nov 23, 2026 · @Paul Matuszek

## So benutzt du diesen Prompt

Lege das Dokument als `ROBOTER_SPEC.md` neben die `index.html` und schreibe in Claude Code: „Lies ROBOTER\_SPEC.md und setze sie um, beginne mit der Bestandsaufnahme.“

- Ich weiß nicht, was in deiner Version genau fehlt. Vielleicht gibt es schon einen Hangar, aber keine Roboter, die arbeiten, oder die Forschungsknoten für Roboter sind da, wirken aber nicht. Deshalb beginnt der Prompt mit einer **Bestandsaufnahme**: Claude Code stellt zuerst fest, was vorhanden ist, und baut nur das nach, was fehlt.
- Alle Werte der ersten Spielbeschreibung (Preise, Tempo, Kapazitäten der Roboter) sind nur Vorschläge. Hat dein Spiel schon eigene Werte, gelten die.
- Der Rest des Spiels bleibt unberührt. Neue Werte für Roboter dürfen nur für die neue Funktion dazukommen.
- Der Prompt berücksichtigt die Erkenntnisse aus der Logikprüfung (zum Beispiel muss die ferne Simulation genauso viel leisten wie die sichtbare) und die Vorgaben aus der VFX/UI-Überarbeitung, falls du sie schon umgesetzt hast.

## 1. Rolle, Ziel und Grenzen

Du bist ein Senior-Gameplay-Engineer für HTML5-Canvas-Spiele mit Schwerpunkt Simulation und Automatisierung. Im fertigen Browser-Spiel **„Staubmond“** (eine `index.html`, Mondputz-Simulation, deutsche Oberfläche) fehlt die **Roboter-Automatisierung**. Das Spiel soll vom Handarbeiter-Spiel zum Firmenspiel werden: Der Spieler kauft Roboter, weist ihnen Sektoren zu, und sie putzen, liefern ab und verdienen Geld, auch wenn der Spieler weit weg ist.

**Ziel:** Vollständige, spielbare, gut balancierte Roboter-Automatisierung, die sich nahtlos in das vorhandene Spiel einfügt, sich wie die nächste Stufe nach Fahrzeugen anfühlt und den Ertrag pro Minute spürbar vervielfacht.

### Harte Grenzen

- Alles bleibt in **einer `index.html`** ohne externe Dateien. Bestehende Technik (Canvas, Chunks, Aktions-Schicht, Event-Bus, `CONFIG`, `THEME`, Qualitätsstufen) wird weiterverwendet, nicht ersetzt.
- **Bestehende Spielwerte und Regeln bleiben unverändert:** Preise, Radien, Leistungen, Kapazitäten, Kostenfaktoren, Lizenzen, Forschungskosten und Wirkungen bestehender Knoten (außer den Roboter-Knoten, die jetzt erst wirken sollen), Sektor- und Fortschrittsberechnung, Weltgenerierung, Erdnachfrage, Aufträge. Neue Roboter-Werte kommen in einen **eigenen Block `CONFIG.robots`**.
- **Speicherformat:** Alte Spielstände müssen weiter laden. Neue Felder bekommen Standardwerte, die Schema-Version steigt mit einer Migration. Ein Spielstand ohne Roboter lädt und spielt sich exakt wie vorher.
- Die Putzlogik des Spielers (Radius, Leistung, Staubmenge pro Zelle, Verkauf) darf nicht verändert werden. Roboter nutzen **dieselbe Funktion zum Entfernen von Staub** wie der Spieler, damit Massenerhaltung, Sektorfortschritt und Statistik automatisch stimmen.
- Keine Rückfragen. Triff Entscheidungen selbst und halte sie im Kommentarblock am Dateianfang fest.
- Originalität: Namen und Texte sind eigene Erfindungen (Roboter heißen **K.E.H.R.-Bots**, die Firma ist das fiktive **ALOP**). Keine Namen, Grafiken oder Texte aus fremden Spielen.

### Vorgehen

1. **Bestandsaufnahme (zuerst, ohne Code zu ändern):** Durchsuche die `index.html` nach allem, was mit Robotern, Hangar, Antennen, Funknetz, Sammeltrichter, Zuweisung, Drohnen, „KEHR“, „Robo“, Förderbändern und den Forschungsknoten (z. B. „Robo-Kalibrierung“, „Doppelschicht“, „Größere Robo-Tanks“, „Selbstentleerung“) zu tun hat. Schreibe `audit/ROBOTER_BESTAND.md` mit einer Tabelle: Teil, vorhanden / teilweise / fehlt, Fundstelle. Typische Muster: Einkaufsmenüs ohne Funktion, Forschungsknoten ohne Wirkung, Gebäude ohne Verhalten, Anzeigen ohne Daten.
2. **Plan:** Lege fest, welche Teile neu gebaut, welche vervollständigt und welche nur verbunden werden. Dokumentiere die Schnittstellen zu bestehenden Systemen (Geld, Lizenzen, Forschung, Karte, Sektoren, Speichern, Aktions-Schicht).
3. **Umsetzung** in den Phasen aus Abschnitt 6, nach jeder Phase lauffähig und getestet.
4. **Abschluss:** Bericht `audit/ROBOTER_BERICHT.md` mit dem, was gebaut wurde, welche Werte du gewählt hast, was bewusst nicht enthalten ist und was du prüfen konntest.

## 2. Funktionsumfang

Wenn dein Spiel für einen Punkt schon Werte hat (Preis, Tempo, Radius, Kapazität), nimm diese. Die folgenden Zahlen sind Vorschläge aus der ursprünglichen Spielbeschreibung.

### Roboter-Modelle (K.E.H.R.-Bots: Kleine Emsige Haushalts-Reinigungs-Bots)

| Modell | Preis | Tempo (Zellen/s) | Putzradius (Zellen) | Kapazität | Freischaltung | Besonderheit |
| --- | --- | --- | --- | --- | --- | --- |
| K.E.H.R. Mk1 | 2.500 ₥ | 4 | 1,2 | 30 kg | Lizenz 1 | fährt, kommt nicht über Hindernisse |
| K.E.H.R. Mk2 | 20.000 ₥ | 6 | 2,0 | 150 kg | Lizenz 2 | wie Mk1, mehr Leistung |
| K.E.H.R. Mk3 | 150.000 ₥ | 8 | 3,5 | 800 kg | Lizenz 4 | fährt über kleine Kraterränder |
| Schwarm-Drohne | 1 Mio. ₥ | 14 | 2,5 | 400 kg | Lizenz 6 | fliegt über alle Hindernisse, auch Schluchten |

Jedes Modell hat im Hangar eigene Upgrade-Stufen für Tempo, Radius und Kapazität (Stufen und Kostenfaktor wie bei den bestehenden Upgrades).

### Hangar

- Gebäude (Vorschlag: 5.000 ₥, 3 × 3 Zellen, Lizenz 1). Beherbergt bis zu **6 Roboter**. Der Spieler kann mehrere Hangars bauen, und jeder ist Heimat, Ladepunkt und Abgabepunkt.
- Kauf eines Roboters: im Hangar-Panel, der Roboter erscheint mit kurzer Animation am Hangar. Ist kein Platz frei, bleibt der Kauf-Button deaktiviert mit klarer Begründung.
- Abriss eines Hangars mit Robotern: Die Roboter werden dem nächsten Hangar mit freiem Platz zugewiesen, sonst bleiben sie als „obdachlos“ stehen und die Abriss-Bestätigung weist darauf hin. Roboter gehen nie verloren, und es wird kein Geld erzeugt.

### Sammeltrichter (falls noch nicht vorhanden)

- Gebäude (Vorschlag: 300 ₥, 2 × 2, Lizenz 1): Roboter, Fahrzeuge und der Spieler liefern hier ab. Der Ausgang geht auf ein Förderband oder direkt in ein Depot oder eine Kapselrampe. Ist das Förderband-System schon vorhanden, nutze es. Fehlt es, baue den **einfachsten sinnvollen Ersatz**: Sammeltrichter als Zwischenlager mit definierter Abgabe an das nächste Depot (kein Band-System neu erfinden, falls es nicht verlangt war).

### Antennen und Funknetz

- Antenne (Vorschlag: 1.500 ₥, 1 × 1, Lizenz 1, Reichweite 300 Zellen). Antennen können sich zu **Ketten** verbinden: Eine Antenne zählt zum Netz, wenn sie im Radius des Hangars, des Depots oder einer anderen Netz-Antenne liegt.
- Das Funknetz ist die Menge aller Zellen im Radius einer Netz-Antenne (oder eines Hangars und Depots, die als schwache Antenne mit Radius 60 Zellen zählen, damit der Start ohne Antenne möglich bleibt).
- **Roboter arbeiten nur innerhalb des Funknetzes.** Außerhalb bleiben sie mit Warnsymbol stehen. Werden Antennen gebaut oder abgerissen, wird das Netz neu berechnet (nur bei Änderung, nicht jedes Frame).
- **Das ersetzt die Bedingung „Spieler in der Nähe“ vollständig:** Roboter arbeiten, egal wo der Spieler ist, solange das Netz reicht.
- Netz-Darstellung im Baumodus als weiche, gestrichelte Fläche.

### Zuweisung

- Der Spieler weist Robotern **Arbeitsgebiete** zu: einen ganzen Sektor (Antippen auf Karte oder Minimap) oder ein gezogenes Rechteck (innerhalb eines Sektors oder über mehrere). Mehrere Roboter können dasselbe Gebiet bekommen. Das Spiel teilt es in Bahnen auf (siehe Abschnitt 4), damit sie sich nicht in die Quere kommen.
- Zuweisung „Automatisch“: Der Roboter wählt selbst den nächstgelegenen Sektor mit Staub im Funknetz, der noch nicht abgeschlossen ist.
- Zuweisung kann jederzeit geändert werden. Der Roboter beendet dabei zuerst sein Abliefern (oder bricht ab, wenn es den Spieler nicht behindert), niemals geht Fracht verloren.
- Ein Sektor oder Gebiet ohne verbleibenden Staub wird automatisch „fertig“, und die Roboter nehmen dann ihr Folgegebiet (falls gesetzt) oder gehen zum Hangar (Standard).

### Forschung und Lizenzen

- Lizenzen schalten Modelle frei (wie in der Tabelle). Gesperrte Modelle sind sichtbar mit der nötigen Lizenz.
- Die Forschungsknoten für Roboter müssen **tatsächlich wirken**, genau wie beschrieben (im Spiel zu sehen sind z. B. Robo-Kalibrierung, Doppelschicht, Größere Robo-Tanks, Selbstentleerung). Lies jede Beschreibung im Code und setze die Wirkung exakt so um. Ist eine Beschreibung unklar, wähle die engste Lesart und notiere sie im Bericht. **Selbstentleerung** (ab Mk2): Der Roboter liefert per Funk ab, ohne zum Ziel zu fahren, sobald er voll ist. Die Menge geht direkt an das Depot (oder den Trichter) mit der kürzesten Funkverbindung. Auf Gleichheit des Ertrags mit dem Fahrbetrieb achten, aber ohne Fahrzeit.

## 3. Verhalten der Roboter

Jeder Roboter ist ein Zustandsautomat. Die Zustände und Übergänge sind verbindlich, damit Verhalten und Fehlerfälle vorhersehbar sind.

| Zustand | Was der Roboter tut | Nächster Zustand |
| --- | --- | --- |
| `idle` (im Hangar) | wartet, lädt auf | `toWork`, sobald ein Gebiet zugewiesen und im Funknetz ist |
| `toWork` | fährt zum nächsten ungeputzten Punkt des Gebiets | `cleaning`, bei Ankunft |
| `cleaning` | fährt in Bahnen (Rasenmäher-Muster) und entfernt Staub im Radius, überspringt saubere Zellen | `toDeliver`, wenn voll (≥ 95 %) |
|  |  | `toWork`, wenn die Bahn an einer sauberen Stelle endet und im Gebiet noch Staub ist |
|  |  | `done`, wenn das Gebiet fertig ist |
| `toDeliver` | fährt zum nächsten erreichbaren Abgabepunkt (Trichter, Hangar, Depot) | `unloading`, bei Ankunft |
| `unloading` | gibt die Fracht ab (dauert proportional zur Menge, mindestens 0,5 s) | `toWork`, sobald leer und das Gebiet nicht fertig |
|  |  | `blockedFull`, wenn das Ziel voll ist (Warnsymbol), erneut versuchen nach 2 s |
| `done` | fährt zu seinem Folgegebiet oder zum Hangar | `toWork` oder `idle` |
| `noSignal` | steht still mit Warnsymbol, außerhalb des Funknetzes | zurück in den vorigen Zustand, sobald Netz vorhanden ist |
| `stuck` | ist festgesetzt (z. B. blockiertes Gelände) | versucht 3 Umwege, dann zurück zum Hangar mit Warnsymbol „Gefangen“, niemals Endlosschleife |
| `noTarget` | kein erreichbarer Abgabepunkt | Warnsymbol „Kein Ziel“, wartet am aktuellen Ort |

- **Abliefern:** Die Fracht eines Roboters wird exakt in das Ziel gebucht. Nichts geht verloren, nichts wird doppelt gebucht. Bei vollem Ziel bleibt der Überschuss am Roboter, und der Roboter wartet (`blockedFull`).
- **Wegfindung:** Einfach und robust: gerade Linie zum Ziel, an Hindernissen mit Randverfolgung oder einem leichten Raster-Pfad auf Chunk-Ebene. Mk3 ignoriert kleine Kraterränder, Drohnen alle Hindernisse. Kein Roboter darf in einer Schleife hängenbleiben (Abbruchbedingung nach Zeit oder Versuchen).
- **Kollision zwischen Robotern:** Keine harte Kollision. Roboter dürfen sich überlappen, aber nicht dieselbe Bahn putzen (siehe Bahn-Aufteilung).
- **Arbeitsende:** Roboter, denen nichts zugewiesen ist, bleiben im Hangar. Ist das Gebiet fertig und es gibt kein Folgegebiet, fahren sie nach Hause.

## 4. Simulation, Leistung und Speichern

### Putzleistung

- Roboter entfernen Staub mit **derselben Funktion wie der Spieler** (z. B. `removeDust(cell, kg)`), damit Fortschritt, Sektorabschluss, Statistik, Fundstücke, Aufträge und Massenerhaltung automatisch stimmen. Schreibe keine zweite Variante.
- Jedes Modell hat eine Leistung in kg/s (`CONFIG.robots.models[x].kgPerSec`). Vorschlag: wie bei den Handwerkzeugen steigt die Leistung etwa mit dem Quadrat des Radius. Orientiere dich an der Werkzeugtabelle des Spiels (z. B. Radius 1,0 → 1 kg/s, Radius 1,6 → 2,5 kg/s) und multipliziere mit einem Roboter-Faktor `robotEfficiency` (Vorschlag 0,8). Feinabstimmung nach Abschnitt 6.
- Während `cleaning` fährt der Roboter mit `tempo × workSpeedFactor` (Vorschlag 0,6) und putzt alle Zellen im Radius. Die Leistung ist durch die kg/s des Modells begrenzt (nicht durch die Menge an Zellen).
- Die Fracht wird **pro Staubart** getrennt geführt (wie beim Spieler), damit der Verkaufswert beim Abliefern stimmt.
- Forschungs- und Upgrade-Effekte gelten auch für bereits gekaufte Roboter sofort.

### Bahn-Aufteilung (kein Gedränge)

- Ein Arbeitsgebiet wird entlang seiner längeren Achse in **Bahnen** der Breite `2 × Radius × 0,9` geteilt. Ein Roboter beansprucht die nächste freie Bahn und arbeitet sie in einer Richtung ab, dann die nächste (Rasenmäher-Muster).
- Ein Anspruch („Claim“) hat eine Roboter-ID und einen Zeitstempel. Wird der Roboter abgezogen, entfernt oder bleibt er mehr als 60 Sekunden ohne Fortschritt, wird der Anspruch freigegeben. Teilweise geputzte Bahnen werden an der ersten staubigen Zelle fortgesetzt.
- Sind alle Bahnen beansprucht, helfen zusätzliche Roboter beim nächsten sinnvollen Abschnitt oder gehen nach Hause. Keine zwei Roboter putzen dieselbe Bahn gleichzeitig.

### Zwei Simulationsmodi, ein Ergebnis

- **Detail-Modus** für Roboter im sichtbaren Bereich plus einen Rand von 1,5 Bildschirmen: eigene Position, glatte Bewegung, Wegfindung, Animation, Effekte.
- **Ferner Modus** für alle anderen: vereinfachte Bahn (Fortschritt entlang der Bahn mit Durchschnittstempo, Fahrzeit zum Abgabepunkt als `2 × Entfernung / Tempo` plus Abladezeit). Aktualisierung mit 10 Hz in Bündeln (z. B. alle 0,5 s pro Roboter). Er entfernt **echte Zellen** mit derselben Funktion, damit die Karte den Fortschritt zeigt.
- **Gleichwertigkeit (Pflicht):** Ein Roboter liefert pro Spielminute in beiden Modi dieselbe Menge Staub am Abgabepunkt ab, Toleranz 5 %. Das ist ein Test (siehe Abschnitt 6). Ein ferner Roboter darf nie besser oder schlechter sein als ein sichtbarer.
- **Moduswechsel:** Beim Wechsel wird der Roboter auf seine berechnete Position in der Bahn gesetzt (ohne Sprung in Fracht, Zustand oder Bahn). Fracht und Ansprüche bleiben exakt erhalten.
- Roboter außerhalb des Bildschirms erzeugen keine Partikel und keine Animationen, nur den Spielstand.

### Offline-Fortschritt

- Wird das Spiel geladen, simuliert es die Abwesenheitszeit mit dem **fernen Modus** (maximal 8 Stunden, 50 % Effizienz, oder die Werte, die dein Spiel schon dafür hat) und zeigt am Ende das Fenster „Während du weg warst“: Geld, gereinigte Fläche, abgeschlossene Sektoren, Anzahl gestarteter Kapseln.
- Die Berechnung läuft in Häppchen über mehrere Frames mit Fortschrittsbalken. Offline-Zeit wird nie doppelt gezählt (einmal live, einmal offline), auch nicht bei Tab-Wechsel oder mehrfachem Laden. Uhr-Sprünge (rückwärts oder weit vorwärts) werden abgefangen.
- Offline arbeiten nur Roboter im Funknetz und mit Ziel. Alle Pausen (Ziel voll, kein Netz) wirken wie im Spiel.

### Leistung

- Ziel: 100 Roboter (davon 20 im Detail-Modus) kosten höchstens **2 ms pro Frame** auf dem iPad (9. Generation). Dazu räumliche Zuordnung (Gitter) für Abgabepunkte, vorab berechnete Bahnen, keine Wegfindung pro Frame, gepoolte Objekte.
- Das Funknetz (Menge der abgedeckten Zellen) wird nur bei Änderung neu berechnet und in einem Bitraster pro Chunk gehalten, nicht pro Frame durchsucht.
- Keine Erzeugung von Objekten im Spiel-Loop. Keine Neuzählungen aller Zellen.

### Speichern und Migration

- Im Spielstand: Hangars (ID, Position, Roboterliste), Roboter (ID, Modell, Upgrade-Stufen, Hangar, Zustand, Position, Fracht pro Staubart, Gebiet, Bahn, Ziel), Gebiete mit Bahn-Ansprüchen, Antennen (als normale Gebäude). **Das Funknetz selbst wird nie gespeichert**, es wird beim Laden aus den Antennen neu berechnet.
- Schema-Version erhöhen, Migration für ältere Spielstände (Standard: keine Roboter, keine Hangars). Falls es schon halbfertige Roboter-Felder gibt, nutze und erweitere sie.
- Fracht der Roboter zählt in die **Massenerhaltung**: Entfernter Staub = im Behälter + in Robotern + abgeladen + gepuffert + verkauft. Beim Speichern und Laden geht nichts verloren.

### Schnittstellen für Effekte (falls die VFX-Überarbeitung schon umgesetzt ist)

- Nutze den vorhandenen Event-Bus nur lesend: `robotCleaned`, `robotDelivered`, `robotStatus`, `robotBought`, `hangarBuilt`. Die Spiellogik hängt nie von Effekten ab.

## 5. Bedienung und Optik

Gestalte alles im vorhandenen Stil (flaches Vektordesign, ALOP-Orange und Petrol, `THEME`-Tokens, falls vorhanden). Touch-Ziele mindestens 44 × 44 pt, keine Tastatur-Hinweise im Touch-Profil, Safe Areas beachten.

### Hangar-Panel (öffnet beim Antippen eines Hangars, als Seitenpanel am iPad, Bottom-Sheet am Handy)

- Kopfzeile mit Hangar-Name, Belegung (z. B. „4 / 6 Roboter“) und aktuellem Kontostand.
- **Kaufkarten** für jedes Modell mit kleiner Illustration (Draufsicht), Werten als Vergleich (Tempo, Radius, Kapazität), Preis, Zustand: kaufbar, zu teuer (mit Fortschrittsbalken und „Es fehlen X ₥“), gesperrt (mit nötiger Lizenz), kein Platz.
- **Roboterliste:** Pro Roboter eine Zeile mit Nummer, Modell, Zustand (Icon plus Text), Gebiet, Füllstand-Balken und Schnellaktionen: Gebiet zuweisen, Heimschicken, Upgrades.
- Upgrade-Bereich für Tempo, Radius, Kapazität als Segmentleiste, Wirkung gilt für alle Roboter des Modells.
- Sammelaktionen: „Alle zuweisen“, „Alle heimschicken“.

### Zuweisen auf der Karte

- In der Vollkarte (und in der Minimap, wo sinnvoll) gibt es einen Modus „Roboter zuweisen“: Antippen eines Sektors weist die gewählten Roboter zu, Ziehen eines Rechtecks weist ein freies Gebiet zu. Vorschau der Fläche in Petrol, unerreichbare oder gesperrte Gebiete in Rot mit Grund.
- Die Karte zeigt zugewiesene Gebiete mit einem Roboter-Symbol und der Anzahl, Funknetz-Abdeckung als zuschaltbare Ebene und Roboter als kleine Punkte (Farbe nach Zustand).
- Zuweisung per Tastatur am Desktop: Roboter wählen, Gebiet anklicken.

### Status auf einen Blick

- Jeder Roboter zeigt ein kleines Symbol über sich, nur wenn es etwas zu sagen gibt: Arbeiten (grün, ruhiger Puls), voll oder wartet auf Ziel (gelb), kein Funknetz (rot, blinkend, mit Funk-Symbol), gefangen (rot, mit Ausrufezeichen).
- Wichtige Zustände nie nur über Farbe: immer auch Icon oder kurzer Text.
- Im HUD eine kleine Roboter-Karte: Anzahl arbeitender Roboter gegen Gesamt („5 / 8“), mit Warnpunkt, falls welche stehen. Antippen öffnet die Roboterliste.
- Toasts nur für Wichtiges (Roboter gefangen, Funknetz verloren), zusammengefasst, nicht für jede Lieferung.

### Optik der Roboter und Gebäude

- Kleine, freundliche Draufsicht-Roboter mit leuchtendem „Auge“, rotierender Bürste, Statuslicht und weichem Schatten. Mk1 klein und rund, Mk2 größer mit Tank, Mk3 breit mit Raupen, Drohne mit rotierenden Propellern und höherem Schatten.
- Roboter hinterlassen sichtbare, ordentliche Putzbahnen. Beim Abladen kurzer Staubstrom in den Trichter.
- Hangar mit Dach und Lichtern, Antenne mit sanft pulsierenden Funkringen (alle 3 Sekunden).
- Alle Effekte bleiben in den Qualitätsstufen des Spiels: Auf niedrigen Stufen weniger Partikel, keine Funkringe, vereinfachte Schatten.

### Einführung (Tutorial-Memo)

- Wird Lizenz 1 freigeschaltet, erscheint einmalig ein ALOP-Memo „Automatisierung genehmigt“ mit drei kurzen Schritten: Hangar bauen, Roboter kaufen, Gebiet zuweisen. Die Schritte erscheinen auch als Ziel im Ziele-Panel, mit Haken beim Erledigen. Überspringbar.

## 6. Balancing-Ziele, Tests und Umsetzungsphasen

### Balancing-Ziele (nur für die neuen Roboter-Werte)

Stelle die neuen Werte in `CONFIG.robots` so ein, dass folgende Ziele erreicht werden. Prüfe sie mit einer Simulation (ein einfacher Bot spielt, kauft und weist zu) und halte das Ergebnis im Bericht fest.

| Ziel | Vorgabe |
| --- | --- |
| Amortisation Mk1 | zahlt sich bei Dauerbetrieb nach 12–20 Spielminuten aus |
| Amortisation Mk2 | 15–25 Minuten |
| Amortisation Mk3 | 20–30 Minuten |
| Stufen-Sprung | ein Mk2 bringt etwa das 3- bis 4-Fache eines Mk1, ein Mk3 etwa das 3- bis 4-Fache eines Mk2 |
| Erster Roboter | typischerweise 20–35 Minuten nach Spielbeginn bezahlbar (siehe Pacing-Tabelle des Spiels) |
| Mensch gegen Roboter | ab dem dritten Roboter läuft die Firma spürbar schneller als der Spieler allein, der Spieler putzt aber weiter sinnvoll mit (Roboter ersetzen ihn nicht, sie ergänzen ihn) |
| Rollenwechsel | wer viele Roboter hat, verbringt die Zeit mit Bauen, Zuweisen und Erweitern, nicht mit Dauer-Halten des Putzen-Buttons |

Werden die Ziele mit den Vorschlagswerten aus Abschnitt 2 verfehlt, passe **nur** die Roboter-Werte an (Leistung, Preise, Effizienz-Faktor) und dokumentiere die Änderung. Fasse keine Werte außerhalb von `CONFIG.robots` an.

### Tests (alle automatisiert, deterministisch mit festem Seed)

1. **Gleichwertigkeit:** Ein Roboter im Detail-Modus und einer im fernen Modus liefern über 10 Spielminuten dieselbe Menge ab (5 % Toleranz).
2. **Massenerhaltung:** Entfernter Staub = Behälter + Roboterfracht + abgeladen + gepuffert + verkauft, nach jedem Schritt, auch mit 100 Robotern und beim Speichern und Laden mitten im Betrieb.
3. **Keine Doppelarbeit:** Bei 10 Robotern auf einem Sektor entfernt kein Roboter dieselbe Zelle zweimal (Summe der entfernten Menge entspricht der abgegebenen Menge).
4. **Zustandsautomat:** Zufallsänderungen (Ziel abreißen, Antenne abreißen, Gebiet ändern, Hangar abreißen, Roboter verkaufen oder umweisen) führen nie zu Endlosschleifen, Absturz, verlorener Fracht oder „hängenden“ Ansprüchen.
5. **Funknetz:** Neuberechnung nur bei Änderung. Antenne bauen → Roboter laufen weiter. Antenne in der Kette abreißen → hinterliegende Roboter stoppen mit Warnung und laufen weiter, wenn das Netz wieder da ist.
6. **Offline:** Ein Spielstand mit Robotern, 3 Stunden später geladen, bringt die erwarteten Gewinne (nur Roboter im Netz), nur einmal. Doppeltes Laden, Uhr zurückgestellt, Uhr vorgestellt: kein doppelter oder negativer Gewinn.
7. **Speichern und Laden:** Rundlauf mit mehreren Hangars, Robotern verschiedener Modelle, Upgrades, Ladungen, Ansprüchen. Alter Spielstand ohne Roboter lädt und spielt unverändert.
8. **Forschung:** Jeder Roboter-Knoten verändert genau die beschriebene Größe, wirkt auch auf schon gekaufte Roboter und nur einmal.
9. **Abriss und Kauf:** Hangar mit Robotern abreißen (kein Verlust), Roboter in vollen Hangar kaufen (verhindert), Kauf mit genau passendem Betrag, doppelter Kaufklick (nur eine Abbuchung).
10. **Leistung:** 100 Roboter und zusätzlich Vollausbau: Robotersimulation höchstens 2 ms pro Frame am iPad (gemessen oder per Drosselung emuliert), Frame-Rate stabil.
11. **Bestehende Tests:** Alle bereits vorhandenen Tests und Invarianten bleiben grün, und ein 60-Sekunden-Testlauf ohne Roboter ergibt dieselben Werte wie vor deinen Änderungen.

### Umsetzungsphasen

Arbeite der Reihe nach. Nach jeder Phase ist das Spiel lauffähig, und du hast die Tests der Phase bestanden.

1. **Bestandsaufnahme, Daten und Migration:** `audit/ROBOTER_BESTAND.md`, `CONFIG.robots`, Datenstrukturen, Schema-Version und Migration. Noch kein sichtbares Verhalten.
2. **Hangar, Roboter (Detail-Modus) und Abliefern:** Hangar, Kauf, Zustandsautomat, Wegfindung, Bahn-Aufteilung, Zuweisung per einfacher Auswahl (Sektor-Liste), Abgabe in Trichter und Depot, Massenerhaltung.
3. **Funknetz, ferne Simulation und Offline:** Antennen und Ketten, Netz-Raster, ferner Modus, Moduswechsel, Offline-Fenster. Tests 1, 5 und 6.
4. **Forschung, Lizenzen, Upgrades:** alle Roboter-Knoten, Modelle 2 und 3 und Drohne, Hangar-Upgrades, Selbstentleerung.
5. **Bedienung:** Hangar-Panel mit Kaufkarten und Roboterliste, Zuweisung auf der Karte (Sektor und Rechteck), HUD-Karte, Status-Symbole, Tutorial-Memo, Touch und Tastatur.
6. **Optik und Feinschliff:** Roboter-Sprites und Animationen, Putzbahnen, Staubstrom, Funkringe, Qualitätsstufen, Balancing-Durchlauf gegen die Ziele, Leistungsmessung.

### Abnahmekriterien

- [ ] Bestandsaufnahme liegt vor, jeder fehlende Teil ist nachgerüstet oder begründet ausgelassen
- [ ] Spieler kann Hangar bauen, Roboter kaufen, Gebiete zuweisen, und die Roboter arbeiten sichtbar und im Hintergrund, auch wenn der Spieler weit weg ist
- [ ] Roboter arbeiten ausschließlich im Funknetz, Warnungen sind klar
- [ ] Ferne und sichtbare Roboter leisten dasselbe (5 % Toleranz)
- [ ] Offline-Fortschritt funktioniert einmalig und korrekt
- [ ] Alle Roboter-Forschungsknoten wirken wie beschrieben
- [ ] Massenerhaltung und alle bestehenden Invarianten bleiben gültig
- [ ] Alte Spielstände laden unverändert, neue laden fehlerfrei nach Speichern
- [ ] Balancing-Ziele erreicht oder Abweichung begründet
- [ ] Roboter-Simulation höchstens 2 ms pro Frame bei 100 Robotern
- [ ] Bedienung am iPad, Handy und Desktop vollständig, Touch-Ziele mindestens 44 pt
- [ ] Bestehende Werte außerhalb von `CONFIG.robots` unverändert
- [ ] Bericht `audit/ROBOTER_BERICHT.md` mit gebauten Teilen, gewählten Werten, Auslassungen und einer Liste „Vorschläge mit Bezug zu bestehender Logik“ (nicht umgesetzt)
