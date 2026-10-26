# Claude-Code-Prompt: Staubmond (2D-Mondputz-Spiel)

Oct 26, 2026 · @Paul Matuszek

## So benutzt du diesen Prompt

Kopiere alles ab der Überschrift „1. Rolle, Ziel und Arbeitsweise“ bis zum Ende in Claude Code, oder exportiere das Dokument als Markdown und lege es als `SPEC.md` in einen leeren Projektordner. Dann reicht in Claude Code: „Lies SPEC.md und setze das Spiel Phase für Phase um.“

- Der Arbeitstitel ist **Staubmond**. Name, Behörde, Roboter und Texte sind bewusst eigene Erfindungen, damit du nichts vom Original übernimmst außer der Spielidee und Mechanik.
- Das Spiel übernimmt Kern-Loop und Game Design von Moon Sweepers, behebt aber die Hauptkritikpunkte aus den Reviews (Progressions-Plateau, Bau-Frust, Roboter-Reichweite, Speicherstände).
- Koop ist als letzte, optionale Phase beschrieben. Streich Abschnitt 13, wenn du nur Singleplayer willst.
- Alle Zahlenwerte sind Startwerte für das Balancing. Claude Code soll sie zentral in einer Konfiguration halten, damit du sie später gezielt anpassen kannst.

## 1. Rolle, Ziel und Arbeitsweise

Du bist ein erfahrener Game Developer und Game Designer für performante HTML5-Canvas-Spiele. Baue das 2D-Browser-Spiel **„Staubmond“**: eine entspannte, humorvolle Reinigungs- und Automatisierungs-Simulation auf einer riesigen Mondkarte. Der Spieler startet als frisch eingestellter Mond-Reinigungsmitarbeiter mit einer einzigen Zahnbürste und baut sich Schritt für Schritt eine automatisierte Mondputz-Firma auf.

Das Spiel muss auf **Desktop (Maus + Tastatur), Smartphone und iPad flüssig spielbar** sein, mit eigener Touch-Steuerung für Handy und iPad. Die gesamte Oberfläche und alle Texte sind auf **Deutsch**.

**Arbeitsweise:**

- Stelle mir keine Rückfragen. Triff alle offenen Entscheidungen selbst nach bestem Game-Design- und Technik-Urteil und dokumentiere sie kurz in einem Kommentarblock am Anfang des Codes.
- Arbeite die Phasen aus Abschnitt 14 der Reihe nach ab. Jede Phase muss für sich lauffähig und spielbar sein, bevor du die nächste beginnst.
- Lege einen kurzen Plan an, bevor du Code schreibst. Prüfe am Ende jeder Phase die Abnahmekriterien selbst, inklusive Test in der mobilen Geräte-Emulation (Handy hoch/quer, iPad hoch/quer).
- Alle Balancing-Zahlen (Preise, Kapazitäten, Geschwindigkeiten, Radien) stehen zentral in einem `CONFIG`-Objekt, nicht verstreut im Code.

**Originalitäts-Regel:** Das Spiel ist von einem bestehenden Steam-Spiel inspiriert (Mond mit Zahnbürste putzen, Koop-Reinigungsfirma). Übernimm nur Spielidee, Kern-Loop und Mechaniken. Verwende keine Namen, Logos, Grafiken, Texte, Charaktere oder Markenzeichen des Originals. Alle Namen in diesem Dokument (Staubmond, ALOP, K.E.H.R.-Bots usw.) sind eigene Erfindungen.

## 2. Technische Rahmenbedingungen

Das Spiel ist **eine einzige `index.html`** mit eingebettetem CSS und JavaScript, die ohne Build-Schritt direkt im Browser läuft (lokal per Doppelklick und gehostet).

- **Rendering:** HTML5 Canvas 2D. Kein Framework, keine Game-Engine. Externe Bibliotheken nur, wenn unvermeidbar, und dann nur von cdnjs oder jsdelivr (z. B. PeerJS für den optionalen Koop).
- **Keine externen Assets:** Alle Grafiken werden prozedural per Canvas-Pfaden gezeichnet, alle Sounds per Web Audio API synthetisiert. Keine Bild- oder Audiodateien.
- **Perspektive:** 2D-Top-Down mit frei folgender Kamera und stufenlosem Zoom.
- **Spiel-Loop:** Feste Logik-Rate von 60 Hz mit Accumulator, Rendering über `requestAnimationFrame` mit Interpolation. Bei Tab-Wechsel (`visibilitychange`) pausieren und speichern.
- **Zielbrowser:** aktuelle Versionen von Chrome, Edge, Firefox, Safari (macOS und iOS/iPadOS) und Samsung Internet.

**Code-Struktur innerhalb der Datei** (klar getrennte, kommentierte Module, z. B. als Objekte oder Klassen):

1. `CONFIG` – alle Balancing-Werte
2. `World` – Mondkarte, Chunks, Staubdaten, Regionen, Sektoren
3. `Player` und `Vehicles` – Bewegung, Werkzeuge, Kapazität
4. `Economy` – Geld, Preise, Upgrades, Lizenzen, Forschung
5. `Buildings` und `Logistics` – Gebäude, Förderbänder, Verarbeitung, Roboter
6. `Progression` – Sektoren, Meilensteine, Aufträge, Events
7. `Input` – Tastatur, Maus, Touch, gemeinsame Aktions-Schicht
8. `Renderer` und `Camera` – Chunk-Cache, Partikel, Licht
9. `UI` – HUD, Menüs, Karte, Tutorial
10. `Audio` – Synth-Sounds und generative Musik
11. `Save` – IndexedDB, Backups, Migration
12. `Net` – optionaler Koop

Alle Spielaktionen laufen über eine zentrale Aktions-Schicht (z. B. `actions.clean`, `actions.interact`), damit Tastatur, Touch und später Netzwerk dieselbe Logik auslösen.

## 3. Spielkonzept und Kern-Loop

Das fiktive **„Amt für Lunare Oberflächenpflege“ (ALOP)** hat beschlossen, den Mond zu putzen. Das Budget reichte für genau eine Zahnbürste. Der Spieler wird auf den Mond geschickt, sammelt Mondstaub, verkauft ihn und investiert in bessere Ausrüstung, bis ganze Roboterflotten und Förderband-Netze den Mond für ihn reinigen. Der Ton ist trocken-satirisch: Behördenmemos, absurde Formulare, übertrieben feierliche Beförderungen.

**Der Kern-Loop** (muss in den ersten 60 Sekunden verstanden werden):

1. **Putzen:** Über staubigen Boden laufen und die Putz-Aktion halten. Der Boden unter dem Werkzeug wird sichtbar sauber, der Staub landet im Behälter.
2. **Abliefern:** Ist der Behälter voll, zum Depot laufen bzw. fahren und abladen.
3. **Verkaufen:** Am Depot eine Lieferkapsel zur Erde schießen. Das bringt Geld (Mondtaler, Symbol „₥“).
4. **Investieren:** Bessere Werkzeuge, größere Behälter, Fahrzeuge, Gebäude.
5. **Skalieren:** Förderbänder, Verarbeitung und Roboter übernehmen das Putzen, der Spieler wird vom Arbeiter zum Firmenchef.

**Design-Säulen:**

- **Sichtbarer Fortschritt:** Der Kontrast zwischen staubigem und sauberem Boden ist die wichtigste Belohnung. Jede gereinigte Fläche bleibt dauerhaft sauber und ist auf der Karte sichtbar.
- **Absurder Maßstab:** Eine riesige Fläche gegen ein winziges Werkzeug. Der Witz lebt davon, dass das Verhältnis im Spielverlauf kippt.
- **Entspannt, aber mit Zielen:** Kein Zeitdruck, kein Scheitern. Trotzdem gibt es immer ein nächstes, erreichbares Ziel in 2 bis 10 Minuten (siehe Abschnitt 7).
- **Automatisierung, die sich lohnt:** Jede Automatisierungsstufe muss den Ertrag spürbar vervielfachen, nicht nur leicht erhöhen.

**Bewusste Verbesserungen gegenüber dem Vorbild** (aus dessen Steam-Kritik abgeleitet):

- Die Progression flacht nach der ersten Stunde nicht ab: abschließbare Sektoren, Meilensteine, Forschung und exponentiell skalierende Automatisierung.
- Gebäude lassen sich **verschieben, drehen und zu 100 % erstattet abreißen**.
- Roboter arbeiten auch, wenn der Spieler weit weg ist (Funkreichweite über Antennen, siehe Abschnitt 6).
- Förderbänder verlieren niemals Ware.
- Robuste Speicherstände mit automatischen Backups.
- Kamera-Komfortoptionen (kein Wackeln, einstellbarer Zoom).

## 4. Die riesige Mondmap

Die Karte ist **6.144 × 6.144 Zellen groß (rund 37,7 Millionen Zellen)** und wird deterministisch aus einem festen Seed prozedural erzeugt. Zu Fuß dauert eine Durchquerung mit Startgeschwindigkeit rund 17 Minuten, das Gefühl von „unendlich viel Mond“ ist gewollt.

### Aufbau und Datenstruktur

| Ebene | Größe | Anzahl | Zweck |
| --- | --- | --- | --- |
| Zelle | 1 Zelle = 16 px bei Zoom 1 | 37,7 Mio. | kleinste Staubeinheit, Wert 0–255 |
| Chunk | 64 × 64 Zellen | 96 × 96 = 9.216 | Speicher-, Render- und Speichereinheit |
| Sektor | 4 × 4 Chunks = 256 × 256 Zellen | 24 × 24 = 576 | abschließbares Spielziel mit Fortschritt in % |
| Region | viele Sektoren | 7 | Biome mit eigenem Staub, Look und Freischaltung |

- **Lazy Materialisierung:** Unberührte Chunks werden nicht gespeichert, ihr Staub wird beim Rendern aus Noise und Seed berechnet. Erst wenn eine Zelle verändert wird, bekommt der Chunk ein eigenes `Uint8Array(4096)`. Nur diese „berührten“ Chunks werden gespeichert.
- **Zusammenfassungen:** Jeder Chunk führt Summe des Reststaubs und Anzahl sauberer Zellen mit. Sektor-, Regions- und Gesamtfortschritt werden daraus inkrementell berechnet, nie durch Neu-Zählen aller Zellen.
- **Sauber-Schwelle:** Eine Zelle gilt bei Staubwert ≤ 8 als sauber. Ein Sektor gilt ab 98 % sauberen Zellen als abgeschlossen (die letzten Ecken sollen nicht nerven).
- **Ost-West-Umlauf:** Die Karte wraps horizontal, wer nach Osten läuft, kommt im Westen wieder an („der Mond ist rund“). Oben und unten liegen die Polregionen als Kartenrand. Kamera, Kollision, Distanzen, Roboter-Wegfindung und Minimap müssen den Umlauf korrekt behandeln.

### Regionen

| Region | Lage | Staubart (Wert pro kg) | Besonderheit | Freischaltung |
| --- | --- | --- | --- | --- |
| Ebene der Geduld | Kartenmitte, Startgebiet | Mondstaub (1 ₥) | flach, wenig Hindernisse, Hauptdepot | ab Start |
| Mare Mopp | angrenzende dunkle Ebenen | Regolith (1,5 ₥) | dichter Staub, große freie Flächen für Fahrzeuge | Lizenz 1 |
| Kraterhügel | Hochland zwischen den Maria | Mondstaub + Geröll (1,2 ₥) | viele Krater, Felsbrocken, Fahrzeuge langsamer | Lizenz 2 |
| Rillental | lange Schluchten quer über die Karte | Regolith (1,8 ₥) | Schluchten nur über gebaute Brücken passierbar | Lizenz 3 |
| Glitzerfelder | verstreute Inseln im Hochland | Glitzerstaub (6 ₥) | funkelnde Partikel, sehr dichter Staub | Lizenz 4 |
| Polare Schatten | oberer und unterer Kartenrand | Eisstaub (2,5 ₥) | dauerhaft dunkel, Lampen nötig, rutschiger Boden | Lizenz 5 |
| Rückseite | gegenüberliegende Kartenhälfte | alle Arten, 1,5-facher Wert | Signal schwach, Antennen-Ketten nötig, Großer Teppichkrater als Endziel | Lizenz 6 |

### Weltgenerierung

- Mehrere Noise-Ebenen (Simplex oder Value Noise mit Oktaven) für Höhenrelief, Staubdichte und Regionsgrenzen. Regionsgrenzen sind organisch, nicht rechteckig.
- **Krater** in drei Größen (klein 6–20 Zellen, mittel 40–120, riesig 300–700) mit Kraterrand als Hindernis für Fahrzeuge (zu Fuß langsam begehbar) und dichterem Staub im Inneren.
- **Felsbrocken** als feste Hindernisse, **Schluchten** im Rillental als unpassierbare Linien mit Brückenbauplätzen.
- **Fundstücke:** 150 versteckte Objekte liegen unter dichtem Staub und erscheinen erst beim Freiputzen (z. B. verlorener Kugelschreiber, Behörden-Stempel, alter Funkknopf, Thermoskanne). Sie geben Geld, Forschungspunkte und einen kurzen, witzigen Sammeltext und werden in einem Album gesammelt.
- Der Startpunkt mit Depot liegt garantiert auf einer flachen, gut putzbaren Fläche.

## 5. Ökonomie, Werkzeuge, Upgrades und Fahrzeuge

Die Ökonomie wächst exponentiell: Der Spieler beginnt bei etwa 30 ₥ pro Minute und soll nach 5 bis 8 Stunden Automatisierung im Millionenbereich pro Minute landen. Geldbeträge werden mit deutschen Kürzeln angezeigt (1,2 Tsd., 3,4 Mio., 5,6 Mrd., 7,8 Bio.).

### Staub und Verkauf

- Eine voll verstaubte Zelle (Wert 255) enthält 0,5 kg Staub, der Kilo-Ertrag ist proportional zum entfernten Staubwert.
- **Hauptdepot:** Staub abladen, er wird in Lieferkapseln verpackt. Alle 200 kg (später per Upgrade weniger Wartezeit) startet automatisch eine Kapsel mit kurzer Startanimation, das Geld wird beim Start gutgeschrieben.
- **Erdnachfrage:** Alle 20 Spielminuten wechselt eine Staubart mit +50 % Bonuspreis. Anzeige im HUD und am Depot. Das schafft kleine Entscheidungen, wo man gerade putzt.
- Weitere Depots (Außenposten) können später gebaut werden, damit lange Wege nicht frustrieren.

### Werkzeuge (Hand)

Die Putz-Aktion entfernt Staub in einem Kreis um das Werkzeug. Beim Putzen läuft der Spieler mit 70 % Geschwindigkeit.

| Werkzeug | Preis | Radius (Zellen) | Leistung (kg/s, ca.) | Freischaltung |
| --- | --- | --- | --- | --- |
| Zahnbürste | Start | 0,6 | 0,5 | ab Start |
| Handbürste | 50 ₥ | 1,0 | 1 | ab Start |
| Besen | 250 ₥ | 1,6 | 2,5 | ab Start |
| Schrubbmopp | 1.200 ₥ | 2,2 | 6 | Lizenz 1 |
| Saug-Rucksack | 5.000 ₥ | 3,0 | 15 | Lizenz 2 |
| Industrie-Sauglanze | 25.000 ₥ | 4,0 | 40 | Lizenz 3 |
| Plasma-Fegestrahl | 150.000 ₥ | 6,0 | 120 | Lizenz 5 |

Jedes Werkzeug hat eine eigene Optik, einen eigenen Putz-Sound und eigene Partikel. Die Zahnbürste darf bewusst lächerlich klein und mühsam wirken.

### Dauerhafte Upgrades (Upgrade-Terminal am Depot)

Jede Linie hat 15 Stufen, Kosten steigen pro Stufe um Faktor 1,65. Die Preise der ersten Stufe stehen in Klammern.

- **Behälter** (40 ₥): Start 10 kg, +40 % pro Stufe
- **Laufschuhe** (60 ₥): Start 6 Zellen/s, +8 % pro Stufe
- **Saugkraft** (100 ₥): +15 % Leistung aller Werkzeuge und Fahrzeuge pro Stufe
- **Verhandlungsgeschick** (300 ₥): +6 % Verkaufspreis pro Stufe
- **Kapsel-Logistik** (500 ₥): Kapseln starten schneller, Fernabladen an Robotern
- **Magnetstiefel** (2.000 ₥, Lizenz 2): Kraterhänge und Eisboden bremsen weniger

### Fahrzeuge (Fahrzeug-Terminal am Depot)

Fahrzeuge putzen automatisch die Fläche unter ihrer Bürstenbreite, solange die Putz-Aktion aktiv ist. Ein- und Aussteigen per Interaktions-Taste. Gekaufte Fahrzeuge parken am Depot oder in einer Garage und lassen sich auf der Karte herbeirufen (Kosten: kleine Gebühr, 10 Sekunden Lieferzeit).

| Fahrzeug | Preis | Tempo (Zellen/s) | Bürstenbreite | Kapazität | Besonderheit |
| --- | --- | --- | --- | --- | --- |
| Schubkarre | 400 ₥ | Lauftempo −20 % | – | 80 kg | zusätzlicher Behälter zu Fuß |
| Kehrwagen | 1.000 ₥ | 14 | 3 Zellen | 500 kg | erstes echtes Fahrzeug |
| Rover-Kehrmaschine | 8.000 ₥ | 18 | 5 Zellen | 2.000 kg | Allround |
| Kehr-Crawler | 60.000 ₥ | 10 | 9 Zellen | 10.000 kg | überfährt Geröll und kleine Kraterränder |
| Schwebekehrer | 400.000 ₥ | 26 | 7 Zellen | 6.000 kg | überquert Schluchten, ignoriert Hänge |

Jedes Fahrzeug hat 5 eigene Upgrade-Stufen (Tempo, Breite, Kapazität). Fahrzeuge haben Trägheit und leichtes Driften (niedrige Mondschwerkraft), bleiben aber gut steuerbar, auch per Touch.

## 6. Gebäude, Verarbeitung und Automatisierung

Automatisierung ist der Kern des Mid- und Late-Games und muss sich **spürbar vervielfachend** anfühlen. Jede neue Stufe (Fahrzeug → Roboter → Förderband-Netz → Verarbeitung → Roboterflotte) soll den Ertrag pro Minute mindestens verdreifachen.

### Bauregeln

- Gebäude dürfen **nur auf sauberem Boden** stehen. Das verknüpft Putzen und Bauen sinnvoll: Wer bauen will, muss erst eine Fläche freiputzen.
- Raster-Snapping auf Zellen, Vorschau als halbtransparenter „Geist“ (grün = gültig, rot = ungültig mit kurzem Grund, z. B. „Boden zu staubig“).
- Jedes Gebäude lässt sich **drehen, verschieben und abreißen (100 % Erstattung)**. Rückgängig-Funktion für die letzten 20 Bauaktionen.
- Förderbänder werden per Ziehen als Pfad gezeichnet (Maus und Finger), Kurven entstehen automatisch.

### Gebäude

| Gebäude | Preis | Größe (Zellen) | Funktion | Freischaltung |
| --- | --- | --- | --- | --- |
| Sammeltrichter | 300 ₥ | 2 × 2 | Spieler, Fahrzeuge und Roboter laden hier ab, Ausgang auf Förderband | Lizenz 1 |
| Förderband Stufe 1/2/3 | 5/40/300 ₥ pro Zelle | 1 × 1 | transportiert 10/30/90 kg/s | Lizenz 1/3/5 |
| Verteiler / Zusammenführer | 150 ₥ | 1 × 1 | teilt bzw. bündelt Bänder | Lizenz 1 |
| Silo | 2.000 ₥ | 3 × 3 | Puffer mit 20 t, zeigt Füllstand | Lizenz 2 |
| Verdichter | 4.000 ₥ | 3 × 3 | 2 kg Staub → 1 kg Mondsand (Wert 3,5 ₥/kg) | Lizenz 2 |
| Ziegelpresse | 18.000 ₥ | 3 × 3 | 2 kg Mondsand → 1 kg Mondziegel (9 ₥/kg) | Lizenz 3 |
| Glasofen | 90.000 ₥ | 4 × 4 | 1 kg Glitzerstaub + 2 kg Sand → 1 kg Mondglas (45 ₥/kg) | Lizenz 4 |
| Kapselrampe | 6.000 ₥ | 3 × 3 | verkauft alles, was per Band ankommt | Lizenz 1 |
| Außenposten-Depot | 10.000 ₥ | 4 × 4 | zweites Depot mit Upgrade- und Fahrzeug-Terminal | Lizenz 2 |
| Antenne | 1.500 ₥ | 1 × 1 | Funknetz mit 300 Zellen Radius, Ketten möglich | Lizenz 1 |
| Roboter-Hangar | 5.000 ₥ | 3 × 3 | Heimat und Abladepunkt für bis zu 6 Roboter | Lizenz 1 |
| Brücke | 3.000 ₥ | bis 12 lang | überquert Schluchten im Rillental | Lizenz 3 |
| Lampenmast | 800 ₥ | 1 × 1 | leuchtet 40 Zellen Radius aus | Lizenz 5 |
| Teleport-Plattform | 25.000 ₥ | 3 × 3 | Schnellreise zwischen allen Plattformen | Lizenz 3 |
| Garage | 2.500 ₥ | 4 × 3 | parkt Fahrzeuge, Abriss löscht niemals Fahrzeuge | Lizenz 1 |

### Förderband-Simulation

- Ware fließt als diskrete Pakete (z. B. 10 kg) in Warteschlangen pro Bandsegment. **Kein Paket darf jemals verloren gehen:** Ist ein Band voll, staut es sich zurück (Rückstau), Maschinen pausieren sichtbar.
- Maschinen zeigen Eingang, Ausgang, Füllstand und Status-Icons (arbeitet, wartet auf Material, Ausgang blockiert).
- Pakete werden nur im sichtbaren Bereich einzeln gezeichnet, außerhalb nur logisch simuliert.

### Roboter: die K.E.H.R.-Bots

(„Kleine Emsige Haushalts-Reinigungs-Bots“ – im Spiel mit einem ernst gemeinten Behördenmemo eingeführt.)

| Modell | Preis | Tempo | Putzradius | Kapazität | Besonderheit |
| --- | --- | --- | --- | --- | --- |
| K.E.H.R. Mk1 | 2.500 ₥ | 4 Zellen/s | 1,2 | 30 kg | Lizenz 1 |
| K.E.H.R. Mk2 | 20.000 ₥ | 6 Zellen/s | 2,0 | 150 kg | Lizenz 2 |
| K.E.H.R. Mk3 | 150.000 ₥ | 8 Zellen/s | 3,5 | 800 kg | Lizenz 4, fährt über kleine Kraterränder |
| Schwarm-Drohne | 1 Mio. ₥ | 14 Zellen/s | 2,5 | 400 kg | Lizenz 6, fliegt über alle Hindernisse |

- **Zuweisung:** Auf der Karte einen Sektor (oder ein gezogenes Rechteck) antippen und Roboter zuweisen. Roboter putzen in ordentlichen Bahnen (Rasenmäher-Muster), überspringen saubere Zellen und fahren voll zum nächsten Sammeltrichter, Hangar oder Depot.
- **Funknetz statt Spielernähe:** Roboter arbeiten überall, wo Antennen-Abdeckung besteht, egal wo der Spieler ist. Außerhalb des Netzes bleiben sie mit Warnsymbol stehen.
- **Ferne Simulation:** Roboter außerhalb des Bildschirms laufen in einem vereinfachten Modus (Bahn-Fortschritt mit Durchschnittstempo, keine Kollision, gebündelte Zellen-Updates), putzen aber echte Zellen, damit die Karte den Fortschritt zeigt.
- **Offline-Fortschritt:** Beim Laden wird die Abwesenheitszeit (max. 8 Stunden, 50 % Effizienz) nachsimuliert und als Fenster „Während du weg warst“ zusammengefasst (Geld, gereinigte Fläche, abgeschlossene Sektoren). Die Berechnung läuft in Häppchen über mehrere Frames mit Fortschrittsbalken, damit nichts einfriert.
- Roboter bekommen eigene Upgrades im Hangar (Tempo, Radius, Kapazität). Einen Akku gibt es bewusst nicht, damit nichts nervt.

## 7. Progression: Ziele, die nie ausgehen

Der Spieler hat jederzeit mindestens ein Ziel, das in 2 bis 10 Minuten erreichbar ist, und ein größeres Ziel für die nächste Stunde. Das ist die wichtigste Lehre aus dem Vorbild, dessen Motivation nach 1 bis 2 Stunden einbrach, weil die Fläche endlos und der Fortschritt unsichtbar wurde.

### Pacing-Ziele (für Balancing und Tests)

| Spielzeit | Erwarteter Stand |
| --- | --- |
| 1 Min. | Kern-Loop verstanden, erste Kapsel gestartet |
| 5 Min. | Handbürste und Besen gekauft |
| 15 Min. | Kehrwagen gekauft, erster Sektor abgeschlossen |
| 30 Min. | Lizenz 1, erster Roboter, erstes Förderband |
| 1 Std. | Mare Mopp erschlossen, 3–5 Roboter, Verdichter läuft |
| 3 Std. | Lizenz 3–4, Ziegelpresse, Teleport-Netz, 20+ Roboter |
| 6–10 Std. | Rückseite erreicht, Schwarm-Drohnen, Mondglas-Produktion |
| 15+ Std. | Großer Teppichkrater gereinigt, Ende und Endlos-Modus |

### Sektoren

- Jeder der 576 Sektoren zeigt auf Karte und HUD seinen Fortschritt in %. Ab 98 % gilt er als abgeschlossen.
- Belohnung: Geldbonus (skaliert mit Region), 1 Forschungspunkt, dauerhaft +0,5 % auf alle Einnahmen, ein ALOP-Stempel „SEKTOR GEREINIGT“ mit Funkel-Animation über die ganze Sektorfläche.
- Die Karte färbt abgeschlossene Sektoren deutlich ein, damit der Gesamtfortschritt als wachsendes Muster sichtbar wird.

### Lizenzen (Freischaltung der Regionen und Technik)

| Lizenz | Kosten | Bedingung | Schaltet frei |
| --- | --- | --- | --- |
| 1 – Reinigungsfachkraft | 2.000 ₥ | 2 Sektoren | Mare Mopp, Roboter Mk1, Förderbänder, Antennen |
| 2 – Staubbeauftragter | 25.000 ₥ | 8 Sektoren | Kraterhügel, Verdichter, Silo, Mk2, Außenposten |
| 3 – Oberkehrrat | 250.000 ₥ | 25 Sektoren | Rillental, Brücken, Ziegelpresse, Teleport |
| 4 – Mondhausmeister | 2,5 Mio. ₥ | 60 Sektoren | Glitzerfelder, Glasofen, Mk3 |
| 5 – Direktor für lunare Sauberkeit | 30 Mio. ₥ | 120 Sektoren | Polare Schatten, Lampen, Plasma-Fegestrahl |
| 6 – Mondputz-Minister | 400 Mio. ₥ | 220 Sektoren | Rückseite, Schwarm-Drohnen, Endziel |

Jede Beförderung wird mit einer kurzen, übertrieben feierlichen Urkunden-Sequenz gefeiert (überspringbar).

### Forschung

Forschungspunkte (FP) kommen aus Sektoren, Fundstücken und Aufträgen. Der Forschungsbaum hat drei Zweige mit je etwa 12 Knoten, kettenartig freigeschaltet:

- **Werkzeugtechnik:** z. B. „Borstenverdichtung“ (+25 % Radius), „Doppelstrich“ (Putzen trifft Zellen doppelt), „Turbofegen“ (Sprint beim Putzen).
- **Logistik:** z. B. „Doppelschicht“ (Roboter +50 % Tempo), „Selbstentleerung“ (Roboter laden per Funk ab, ab Mk2), „Kapsel-Bündelung“ (+20 % Verkaufspreis per Rampe).
- **Verwaltung:** z. B. „Bürokratie-Abkürzung“ (Lizenzen −20 %), „Nachtschicht-Zulage“ (Offline-Effizienz 50 → 80 %), „Großeinkauf“ (Gebäude −15 %).

Jeder Zweig endet mit einem starken Abschlussknoten mit Multiplikator (z. B. ×2 auf alle Roboter).

### Aufträge (ALOP-Memos)

Immer 3 aktive Aufträge in Form von kurzen, witzigen Behördenmemos. Beispiele: „Sektor F-12 bis 80 % reinigen“, „2 t Regolith liefern“, „3 Antennen errichten“, „Ein Fundstück im Mare Mopp sichern“. Belohnung: Geld und FP. Erledigte Aufträge werden sofort durch neue ersetzt, ein Auftrag pro Stunde kann kostenlos getauscht werden.

### Events und Tageszyklus

- **Mondtag und -nacht:** Ein Zyklus dauert 24 Spielminuten. Nachts wird es dunkel, Spieler und Fahrzeuge haben Scheinwerfer, Lampenmasten leuchten. Die Nacht ist Stimmung, keine Strafe.
- **Meteoritenschauer:** Hinterlässt Haufen aus wertvollem Meteorstaub (3-facher Wert) als Bonus, auch auf sauberem Boden. Bereits abgeschlossene Sektoren werden dadurch nie wieder unter 98 % gesetzt.
- **Sonnenwind:** 3 Minuten +100 % Roboter-Tempo, angekündigt per Funkspruch.
- **ALOP-Inspektion:** Ein Inspektor-Rover besucht einen Sektor, ist dieser binnen 5 Minuten zu 95 % sauber, gibt es einen großen Bonus.

### Ende und Endlos-Modus

Ist der Große Teppichkrater auf der Rückseite gereinigt, folgt eine Abschluss-Sequenz (die Erde bemerkt einen auffällig glänzenden Mond, das ALOP verleiht einen Orden). Danach geht das Spiel unbegrenzt weiter. Zusätzlich gibt es die Option **„Neue Mondmission“**: neuer Seed, alles beginnt von vorn, aber mit einem dauerhaften Erfahrungsbonus (+25 % Einnahmen pro abgeschlossener Mission).

## 8. Steuerung: Desktop, Handy und iPad

Es gibt drei Steuerungsprofile, die automatisch erkannt werden und in den Einstellungen manuell umschaltbar sind. Die Erkennung läuft über Fähigkeiten, nicht über den User-Agent: `matchMedia('(pointer: coarse)')`, `navigator.maxTouchPoints` und die kürzere Bildschirmseite (unter 600 CSS-px = Handy, darüber = Tablet). Achtung: iPadOS meldet sich als Mac, daher ist `maxTouchPoints > 1` entscheidend. Wird am Tablet eine Tastatur oder Maus benutzt, schaltet das Spiel nahtlos auf Desktop-Hinweise um.

### Desktop (Maus und Tastatur)

| Aktion | Taste |
| --- | --- |
| Bewegen / Fahren | WASD oder Pfeiltasten |
| Putzen (halten) | Leertaste oder linke Maustaste |
| Interagieren (Depot, Terminal, Fahrzeug ein/aus) | E |
| Baumodus | B |
| Gebäude drehen / verschieben / abreißen | R / M / X |
| Rückgängig | Strg + Z |
| Karte | M (außerhalb des Baumodus) oder Tab |
| Forschung / Aufträge / Album | F / J / K |
| Zoom | Mausrad, + / − |
| Pause und Menü | Esc |

Die Maus zeigt im Baumodus die Platzierung, sonst die Blickrichtung des Werkzeugs. Alle Tasten sind in den Einstellungen neu belegbar.

### Handy (Touch, hoch und quer)

- **Linke Hälfte:** schwebender virtueller Joystick, der dort erscheint, wo der Daumen aufsetzt. Analog: leichtes Schieben = langsam, voll = volles Tempo.
- **Rechte Seite:** großer runder **Putz-Button** (halten, mindestens 80 × 80 px) und darüber ein kontextabhängiger **Aktions-Button**, der nur erscheint, wenn etwas in Reichweite ist (Symbol + Wort: „Abladen“, „Einsteigen“, „Terminal“).
- **Auto-Putzen-Schalter:** Option, dass immer geputzt wird, solange man sich bewegt, damit Einhand-Spiel möglich ist.
- **Obere Leiste:** kompakte Icons für Karte, Bauen, Forschung, Aufträge, Menü.
- **Kamera:** Zwei-Finger-Pinch zum Zoomen. Im Hochformat wird automatisch etwas weiter herausgezoomt.
- **Baumodus:** Geist-Gebäude folgt dem Finger, darunter eine Leiste mit Bestätigen, Drehen, Abbrechen. Förderbänder werden mit einem Finger als Pfad gezogen, mit zwei Fingern wird die Kamera verschoben.
- **Linkshänder-Modus:** spiegelt Joystick und Buttons.

### iPad (Touch, größerer Bildschirm)

- Grundsteuerung wie am Handy, aber Joystick und Buttons größer (Joystick-Radius ca. 70 px) und weiter nach innen gesetzt, damit man das Tablet bequem mit beiden Händen hält.
- Mehr sichtbare Welt (Standard-Zoom weiter draußen) und **Seitenpanels statt Vollbild-Menüs**: Baumenü, Forschung und Aufträge öffnen als Panel am Rand, das Spiel bleibt daneben sichtbar und läuft weiter.
- Minimap dauerhaft groß sichtbar, Antippen öffnet die Vollkarte.
- Im Baumodus kann man direkt in der Welt tippen und ziehen (auch mit Apple Pencil), zwei Finger verschieben die Kamera.
- Mit angeschlossener Tastatur gelten zusätzlich alle Desktop-Tasten.

### Technische Touch-Anforderungen

- Pointer Events mit Multi-Touch-Tracking pro `pointerId`, `touch-action: none` auf dem Canvas, kein Scrollen, kein Doppeltipp-Zoom, kein Gummiband-Effekt unter iOS.
- `viewport-fit=cover` und Abstände per `env(safe-area-inset-*)` für Notch, Dynamic Island und Home-Indikator.
- Größenänderungen und Drehung des Geräts werden sofort und flüssig übernommen (`resize` und `orientationchange`), ohne Neuladen.
- Vollbild-Button (Fullscreen API, wo verfügbar; auf dem iPhone Hinweis „Zum Home-Bildschirm hinzufügen“ für Vollbild per Web-App-Manifest-Metatags).
- Einstellbar: Joystick-Größe, Joystick fest oder schwebend, Button-Transparenz, Vibration (wo vom Gerät unterstützt).

## 9. UI, HUD, Menüs und Karte

Das HUD ist schlank und lässt die Mondfläche im Mittelpunkt. Alle UI-Elemente sind als HTML-Overlay über dem Canvas umgesetzt (gut für Text, Touch und Barrierefreiheit), nur Welt-Elemente werden im Canvas gezeichnet.

### HUD

- **Oben links:** Geld mit kurzem Hochzähl-Effekt und „+₥“-Popups, darunter Einnahmen pro Minute.
- **Oben Mitte:** aktueller Sektor (z. B. „F-12 · Mare Mopp“) mit Fortschrittsring in %, kurz einblendend beim Sektorwechsel.
- **Oben rechts:** Minimap (rund, mit Spielerpfeil, Depots, Robotern, Sektorrastern; am iPad größer).
- **Unten Mitte:** Behälter-Füllstand als Balken in kg mit Warnfarbe ab 90 %, daneben aktuelles Werkzeug bzw. Fahrzeug.
- **Rand:** dezenter **Mondglanz-Index** (gesamter Fortschritt des Mondes, 4 Nachkommastellen, damit auch am Anfang Bewegung sichtbar ist).
- Pfeil-Hinweis am Bildschirmrand zum nächsten Depot, wenn der Behälter voll ist.

### Menüs

- **Hauptmenü:** Weiterspielen, Neues Spiel (3 Speicherplätze), Einstellungen, Statistik. Animierter Mondhintergrund mit Erde.
- **Upgrade-, Fahrzeug- und Bau-Terminal:** Karten-Layout mit Icon, Name, aktueller und nächster Wert, Preis. Nicht leistbare Einträge zeigen, wie viel noch fehlt. Gesperrte Einträge zeigen die nötige Lizenz.
- **Forschungsbaum:** drei Zweige nebeneinander (am Handy per Wischen umschaltbar), Knoten mit Verbindungslinien, Status gesperrt / verfügbar / erforscht.
- **Aufträge, Album (Fundstücke), Statistik** (Spielzeit, gereinigte Fläche, verkaufte Tonnen, Roboterleistung).
- **Einstellungen:** Grafikqualität (Automatisch / Niedrig / Mittel / Hoch), Kamera-Wackeln aus, Partikelmenge, Lautstärke Musik/Effekte, Steuerungsprofil, Touch-Optionen, Speicher exportieren/importieren, FPS-Anzeige.

### Vollkarte

Die Vollkarte ist ein zentrales Werkzeug, weil die Welt so groß ist.

- Zeigt die ganze Mondfläche als Staub-Heatmap (1 Pixel pro Chunk, aus den Chunk-Zusammenfassungen erzeugt), Regionsgrenzen, Sektorraster mit Beschriftung (A–X, 1–24) und Fortschritt.
- Zoom und Verschieben per Mausrad/Ziehen bzw. Pinch, inklusive Ost-West-Umlauf.
- Ebenen ein-/ausschaltbar: Funknetz-Abdeckung, Roboter und deren Zuweisungen, Gebäude, Fundstück-Hinweise (nur bereits entdeckte), Aufträge.
- **Wegpunkte** setzen (erscheinen als Pfeil im HUD), **Roboter zuweisen** per Antippen eines Sektors, **Teleport** zu jeder gebauten Teleport-Plattform.

### Onboarding

Ein kurzes, interaktives Tutorial in Form von ALOP-Memos: Bewegen → Putzen → Abladen → Kapsel starten → erstes Upgrade kaufen. Die Hinweise passen sich dem Steuerungsprofil an („Halte den Putz-Button“ vs. „Halte die Leertaste“). Komplett überspringbar.

## 10. Grafikstil, Game Feel und Audio

Der Stil ist **flaches Vektordesign**: klare geometrische Formen, kräftige Farbflächen, saubere Outlines, keine Pixel-Art. Alles wird prozedural im Canvas gezeichnet.

### Farb- und Formsprache

- **Staubiger Boden:** warmes, mattes Graubraun mit feiner Noise-Körnung, je dichter der Staub, desto dunkler und körniger. Jede Staubart hat einen eigenen Farbton (Regolith dunkel-anthrazit, Eisstaub bläulich-weiß, Glitzerstaub mit funkelnden Punkten).
- **Sauberer Boden:** helles, kühles Silbergrau mit dezentem Glanz und feinen Mikrostrukturen. Der Kontrast zum Staub muss sofort ins Auge springen, das ist die zentrale Belohnung des Spiels.
- Zwischenstufen (halb geputzt) werden sanft interpoliert, keine harten Treppenstufen.
- Krater mit weichem Schatten am Rand, Felsbrocken als facettierte Polygone, Schluchten als tiefe, dunkle Spalten.
- Spieler als kleiner Astronaut mit orangefarbenem Anzug und großem Helmvisier, Fahrzeuge und Gebäude in ALOP-Farben (Orange, Weiß, Petrol) mit Behörden-Logo (eigenes Design).

### Game Feel

- **Fußspuren** im Staub, die beim Laufen entstehen, und **Reifenspuren** von Fahrzeugen (beides verschwindet beim Putzen).
- Staubpartikel fliegen bei niedriger Schwerkraft langsam und weit, bevor sie zum Werkzeug gesaugt werden.
- Kleine Funkel-Effekte, wenn eine Zelle sauber wird, eine große Funkel-Welle über den ganzen Sektor bei Abschluss.
- Geld-Popups, Kapselstart mit Rauchsäule und Kamerazoom-Puls (abschaltbar), satte Bestätigungs-Animationen beim Kauf.
- Leichtes, hüpfendes Laufen des Astronauten (Mondgravitation), Fahrzeuge mit Trägheit.
- Kamera folgt weich (Lerp), schaut leicht in Bewegungsrichtung voraus. Kein Kamera-Wackeln, wenn in den Einstellungen deaktiviert.

### Licht und Tageszyklus

- Nachts wird eine Dunkelheits-Ebene über die Welt gelegt (auf einem niedrig aufgelösten Offscreen-Canvas), aus der Scheinwerfer, Lampenmasten und Gebäudelichter mit weichen radialen Verläufen „herausgeschnitten“ werden.
- Die Polaren Schatten bleiben auch tagsüber dunkel.

### Audio (komplett mit Web Audio API synthetisiert)

- **Putzgeräusche** pro Werkzeug: gefiltertes Rauschen, rhythmisch an die Bewegung gekoppelt (Zahnbürste hell und kratzig, Sauger als tiefes Brummen).
- Fahrzeugmotoren mit tempoabhängiger Tonhöhe, Förderband-Rattern (leise, nur in der Nähe), Roboter-Piepsen.
- Kassen-„Kling“ beim Verkauf, tiefes Grollen mit aufsteigendem Sweep beim Kapselstart, UI-Klicks.
- **Generative Ambient-Musik:** ruhige Flächen und vereinzelte pentatonische Töne mit künstlichem Hall, Stimmung wechselt mit Tag/Nacht und Region.
- Funksprüche des ALOP als Text-Einblendung mit kurzem Funk-Piepsen, keine Sprachausgabe.
- Audio wird erst nach der ersten Nutzereingabe gestartet (iOS-Anforderung), Lautstärken separat regelbar.

## 11. Performance-Vorgaben

Ziel sind **stabile 60 FPS** auf einem iPhone 12, einem Mittelklasse-Android (z. B. Galaxy A54) und einem iPad der 9. Generation, auch mit 50 Robotern und großem Förderband-Netz. Auf älteren Geräten mindestens 30 FPS. Speicherverbrauch unter 300 MB.

### Welt-Rendering

- Jeder Chunk hat eine **gecachte Textur** (Offscreen-Canvas). Basis: 1 Pixel pro Zelle (64 × 64), aus dem Staubwert über eine Farb-Lookup-Tabelle gefärbt und mit Glättung hochskaliert. Bei hoher Qualität zusätzlich eine feinere Detailtextur (z. B. 4 px pro Zelle) für die Körnung.
- Zellen-Änderungen schreiben direkt in das `ImageData` des Chunks und markieren ihn als „dirty“. Pro Frame wird nur ein begrenztes Budget an Chunks aktualisiert (z. B. 6), und zwar nur der geänderte Teilbereich.
- Gezeichnet werden ausschließlich sichtbare Chunks plus ein kleiner Rand. Ein LRU-Cache begrenzt die Anzahl gecachter Texturen (ca. 120 am Handy, 300 am Desktop).
- **LOD beim Herauszoomen:** Ab einer bestimmten Zoomstufe werden statt Chunk-Texturen vorberechnete Übersichtsbilder pro Sektor genutzt.
- Körnung und Glanz als vorgenerierte, kachelbare Muster, nicht pro Frame neu berechnet.

### Auflösung und Framerate

- `devicePixelRatio` begrenzen: maximal 2 am Desktop, maximal 1,5 am Handy.
- **Dynamische Auflösung:** Liegt die durchschnittliche Frame-Zeit 2 Sekunden lang über 18 ms, sinkt die Render-Skalierung in Schritten von 0,1 bis minimal 0,6. Bei stabiler Leistung steigt sie wieder. Grafikstufe „Automatisch“ nutzt das.

### Simulation

- Keine Objekt-Allokationen im Haupt-Loop, Typed Arrays für Zellen, Object Pools für Partikel und Förderband-Pakete.
- Räumliches Hashing für Kollisionen und Nachbarschaftsabfragen.
- Ferne Roboter und Förderbänder laufen mit reduzierter Tick-Rate (10 Hz) im vereinfachten Modus.
- Partikel-Obergrenze: 300 am Handy, 1.000 am Desktop, abhängig von der Partikel-Einstellung.
- Fortschrittszahlen (Sektor, Region, Mondglanz-Index) werden inkrementell gepflegt, nie durch Durchzählen aller Zellen.

### UI

- DOM-Updates des HUD höchstens 10-mal pro Sekunde, nur bei geänderten Werten, keine Layout-Neuberechnung im Spiel-Loop.
- Menüs öffnen ohne Ruckler, Listen mit vielen Einträgen werden virtualisiert.

### Messen

Ein Debug-Overlay (Taste F3 bzw. Fünffach-Tipp auf das Geld) zeigt FPS, Frame-Zeit, Render-Skalierung, Anzahl gecachter Chunks, Roboter, Pakete und Partikel.

## 12. Speichern und Backups

Spielstände dürfen niemals verloren gehen oder beschädigt werden, auch nicht bei Hunderten veränderten Chunks.

- **Speicherort:** IndexedDB für Spielstände (localStorage ist mit rund 5 MB zu klein), localStorage nur für Einstellungen. Fallback auf localStorage mit Warnhinweis, falls IndexedDB nicht verfügbar ist (z. B. manche private Modi).
- **Struktur:** Ein kleiner Kern-Datensatz (Geld, Upgrades, Lizenzen, Forschung, Gebäude, Roboter, Fahrzeuge, Statistik, Zeitstempel, Versionsnummer) plus **nur die berührten Chunks** als eigene Einträge. Chunk-Daten komprimiert (Lauflängen-Kodierung, zusätzlich `CompressionStream('gzip')`, wo verfügbar).
- **Inkrementell:** Gespeichert werden nur seit dem letzten Speichern geänderte Chunks. Ein Speichervorgang darf keinen spürbaren Ruckler erzeugen (Arbeit über mehrere Frames verteilen).
- **Wann:** Autosave alle 30 Sekunden, bei `visibilitychange` (App wechseln, Bildschirm aus), vor dem Schließen und nach wichtigen Ereignissen (Kauf einer Lizenz, Sektor abgeschlossen).
- **3 Speicherplätze** mit Vorschau (Spielzeit, Mondglanz-Index, Lizenzstufe, Datum).
- **Automatische Backups:** 5 rotierende Kern-Backups pro Platz. Beim Laden wird jeder Datensatz validiert (Prüfsumme, Pflichtfelder). Ist er beschädigt, wird automatisch das jüngste gültige Backup geladen und ein Hinweis gezeigt.
- **Versionierung:** Jeder Spielstand trägt eine Schema-Version, ältere Stände werden per Migrationsfunktion hochgestuft.
- **Export/Import:** Spielstand als Datei herunterladen und wieder einlesen (auch zum Übertragen zwischen Geräten).
- Der Welt-Seed wird im Spielstand gespeichert (Standard-Seed für die erste Mission), damit unberührte Chunks immer identisch neu erzeugt werden.

## 13. Optional: Koop per Einladungscode

Diese Phase kommt erst, wenn das Singleplayer-Spiel vollständig und stabil ist. Das Vorbild lebt stark vom Gruppenspiel, deshalb soll die Architektur von Anfang an darauf vorbereitet sein (zentrale Aktions-Schicht, deterministische Welt, serialisierbarer Zustand).

- **Technik:** WebRTC-Peer-to-Peer über PeerJS (per CDN), der Host ist autoritativ. Kein eigener Server nötig. Der Host erzeugt einen 6-stelligen Einladungscode, Mitspieler treten per Code bei.
- **Spielerzahl:** bis zu 8 Spieler.
- **Geteilte Wirtschaft:** Geld, Upgrades, Lizenzen und Forschung gelten für die ganze Crew. **Jeder Kauf wirkt für alle**, keine Upgrades pro Spieler. Das war der meistkritisierte Fehler des Vorbilds.
- **Synchronisation:** Beitretende Spieler laden nur Seed, Kern-Datensatz und die berührten Chunks vom Host. Danach überträgt der Host Zellen-Änderungen gebündelt pro Chunk (z. B. alle 100 ms) sowie Positionen von Spielern, Fahrzeugen und sichtbaren Robotern. Clients senden nur Eingaben bzw. Aktionen.
- **Spieler** sind farbig unterscheidbar, mit Namensschild über dem Helm, und erscheinen auf Minimap und Vollkarte.
- **Host-Werkzeuge:** Spieler entfernen und sperren. Alle müssen dieselbe Spielversion haben, sonst klare Fehlermeldung.
- **Robustheit:** Verbindungsabbrüche führen nie zu Datenverlust, der Spielstand liegt beim Host. Scheitert die Verbindung, kann der Spieler jederzeit allein weiterspielen.
- **Kommunikation:** Schnell-Emotes (Winken, „Hierher!“, „Gute Arbeit“) als Rad bzw. Buttons, kein freier Text-Chat nötig.
- **Spaßfaktor:** Ein Crew-Bonus von +5 % Einnahmen pro zusätzlichem Spieler belohnt das Zusammenspielen.

## 14. Umsetzungsphasen und Abnahmekriterien

Arbeite die Phasen in dieser Reihenfolge ab. Nach jeder Phase ist das Spiel lauffähig, und du prüfst die Kriterien selbst, bevor du weitermachst.

1. **Fundament und Kern-Loop**
   - Spiel-Loop, Kamera mit Zoom, zentrale Aktions-Schicht, Tastatur- und Touch-Eingabe (Joystick + Putz-Button).
   - Riesige Welt mit Chunks, Lazy-Materialisierung, Noise-Generierung, Kratern, Ost-West-Umlauf, Chunk-Textur-Cache.
   - Putzen mit Zahnbürste, Behälter, Hauptdepot, Kapselstart, Geld.
   - Abnahme: Kern-Loop in unter 60 Sekunden verständlich; einmal komplett um den Mond laufen ohne Ruckler oder Sprünge; 60 FPS in der Handy-Emulation; geputzte Fläche ist dauerhaft sichtbar.
2. **Plattformen, HUD und Speichern**
   - Vollständige Steuerungsprofile Desktop, Handy (hoch und quer) und iPad inklusive Safe Areas, Drehen und Linkshänder-Modus.
   - HUD, Minimap, Hauptmenü, Einstellungen, Tutorial.
   - IndexedDB-Speicherung mit Backups, 3 Plätzen, Export/Import.
   - Abnahme: Alle Buttons am Handy mit dem Daumen gut erreichbar; kein ungewolltes Scrollen oder Zoomen auf iOS; Neuladen stellt den exakten Zustand wieder her.
3. **Werkzeuge, Fahrzeuge, Sektoren**
   - Alle Werkzeuge, Upgrade-Linien, Fahrzeuge mit Upgrades, Sektor-System mit Belohnungen, Lizenz 1 und 2, Regionen Ebene der Geduld, Mare Mopp, Kraterhügel, Erdnachfrage.
   - Abnahme: Die ersten 30 Minuten entsprechen der Pacing-Tabelle; Fahrzeuge fühlen sich per Touch genauso gut an wie per Tastatur.
4. **Bauen und Automatisierung**
   - Baumodus mit Drehen, Verschieben, 100-%-Abriss, Rückgängig; Förderbänder per Ziehen; Sammeltrichter, Verteiler, Silo, Verdichter, Kapselrampe, Antennen, Hangar, Garage, Außenposten.
   - K.E.H.R.-Bots Mk1 und Mk2 mit Sektor-Zuweisung, Funknetz, ferner Simulation und Offline-Fortschritt.
   - Abnahme: Kein Förderband-Paket geht je verloren; 50 Roboter und 500 Bandzellen laufen mit 60 FPS am iPad; Roboter putzen weiter, während der Spieler am anderen Ende der Karte ist.
5. **Volle Progression und Welt**
   - Lizenzen 3 bis 6, alle Regionen inklusive Rillental (Brücken), Glitzerfelder, Polare Schatten, Rückseite; Ziegelpresse, Glasofen, Mk3, Schwarm-Drohne, Teleport, Lampen.
   - Forschungsbaum, Aufträge, Fundstücke mit Album, Events, Tag-Nacht-Zyklus, vollständige Vollkarte mit Ebenen, Wegpunkten und Zuweisung.
   - Abnahme: Zu jedem Zeitpunkt ist ein Ziel unter 10 Minuten sichtbar; Spielzeit-Simulation (beschleunigter Debug-Modus) bestätigt die Pacing-Tabelle bis zur Rückseite.
6. **Polish**
   - Synth-Audio und generative Musik, alle Partikel und Funkel-Effekte, Fuß- und Reifenspuren, Licht, Beförderungs-Sequenzen, Abschluss-Sequenz, „Neue Mondmission“.
   - Balancing-Durchgang anhand der Pacing-Tabelle, dynamische Auflösung, Debug-Overlay.
   - Abnahme: Alle Punkte der Abschlussliste unten erfüllt.
7. **Optional: Koop** gemäß Abschnitt 13.
   - Abnahme: Zwei Browser-Fenster auf verschiedenen Geräten spielen zusammen, ein Kauf wirkt sofort für beide, ein Verbindungsabbruch verliert keine Daten.

### Abschlussliste

- [ ] Läuft als einzelne `index.html` ohne Build-Schritt und ohne externe Assets
- [ ] 60 FPS auf Desktop, Handy und iPad im normalen Spiel, mindestens 30 FPS auf älteren Geräten
- [ ] Eigene, durchdachte Touch-Steuerung für Handy und iPad, Desktop mit frei belegbaren Tasten
- [ ] Karte mit 6.144 × 6.144 Zellen, Ost-West-Umlauf, 7 Regionen, 576 Sektoren
- [ ] Kern-Loop Putzen → Abliefern → Verkaufen → Investieren → Automatisieren vollständig
- [ ] Gebäude drehbar, verschiebbar, voll erstattet abreißbar; Förderbänder verlustfrei
- [ ] Roboter arbeiten im Funknetz unabhängig von der Spielerposition; Offline-Fortschritt funktioniert
- [ ] Progression ohne Plateau: Sektoren, Lizenzen, Forschung, Aufträge, Events, Ende und Endlos-Modus
- [ ] Speicherstände mit Backups, Validierung, Migration und Export
- [ ] Komplett deutsche Oberfläche, keine Namen, Grafiken oder Texte des Vorbilds
- [ ] Alle Balancing-Werte zentral im `CONFIG`-Objekt
