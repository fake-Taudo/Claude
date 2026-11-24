# Bericht Roboter-Automatisierung

Vorgabe: `ROBOTER_SPEC.md`. Bestandsaufnahme vor den Änderungen: `audit/ROBOTER_BESTAND.md`. Alle Änderungen stecken in `index.html`; die Entscheidungen stehen zusätzlich im Kommentarblock am Anfang des Hauptskripts (Abschnitt „Roboter-Automatisierung“).

## Kurzfassung

- Die vorhandene Roboter-Automatisierung ist vervollständigt: vollständiger Zustandsautomat, Hangar-Abriss mit Umzug, Hangar als schwacher Funkknoten, Freigabe von Bahn-Ansprüchen, „Automatisch“-Zuweisung, Ereignisse, Bedienung (Hangar-Einsatz, Gesamtliste, Karten-Zuweisung mit Vorschau, HUD-Karte, Statussymbole, Memo) und ein Balancing-Durchlauf.
- Fern- und Detailmodus liefern jetzt exakt dieselbe Menge (vorher bis zu ±14 %).
- Alle 13 Roboter-Pflichttests sind grün (RT-01 bis RT-12, dazu RT-10b mit gedrosselter CPU). In der übrigen Prüfsammlung hat sich keine Prüfung verschlechtert; zwei bestehende Prüfungen (B-12, Z-03) sind jetzt grün.
- Balancing: Amortisation und Stufen-Sprung liegen für Mk1, Mk2 und Mk3 im Ziel. Verfehlt wird der Zeitpunkt des ersten Roboters, um etwa 1,5 Minuten. Ursache sind Werte außerhalb von `CONFIG.robots` (siehe Vorschläge).

## Was gebaut wurde

| Teil | Umsetzung | Fundstelle in `index.html` |
|---|---|---|
| Eigener Block `CONFIG.robots` | `models` plus neue Werte (Abladen, Wiederholung, Wächter, Hangar-Funk, Detailbereich, Offline-Teilschritte). Ältere Roboterwerte bleiben unverändert an ihrem Platz | `CONFIG.robots` |
| Speicher-Schema 3 | neues Feld `robotTut`; `Save.migrate` ergänzt es für alte Stände. Roboter in Lieferung, beim Abladen oder wartend speichern Ziel und Restzeit mit (optionale Felder `drop`, `timer`) und setzen nach dem Laden genau dort fort. Ältere Stände ohne diese Felder entscheiden wie bisher neu, die Ladung bleibt | `CONFIG.saveSchema`, `Save.migrate`, `Robots.save`, `Robots.fromSave` |
| Zustandsautomat | idle, toWork, cleaning, toDeliver, unloading (0,5 s + Menge / 200 kg/s), blockedFull (Teilabgabe, alle 2 s neu, auch anderes Ziel), done, noSignal, stuck (60 s ohne Fortschritt → Bahn frei; nach 3 Versuchen heim mit Warnung „gefangen“), noTarget, dazu „ohne Hangar“ | `Robots.step`, `Robots.status` |
| Exaktes Abliefern | Fracht wird nur so weit gebucht, wie Platz ist; der Rest bleibt am Roboter | `Robots.unload`, `Robots.room` |
| Funknetz | Hangar ist schwacher Funkknoten (60 Zellen). Roboter verlassen das Netz nicht von selbst: Sie gleiten am Rand entlang, Abschnitte hinter dem Rand werden übersprungen, und Gebiete ohne Ertrag ketten nicht weiter | `Buildings.radioRadius`, `Robots.moveTo`, `Robots.colDirty`, `Robots.finish` |
| Hangar-Abriss | auch über „Rückgängig“: Roboter ziehen in den nächsten Hangar mit Platz, sonst stehen sie „ohne Hangar“, arbeiten weiter und ziehen ein, sobald ein Platz frei wird. Kein Verlust, kein Geld entsteht | `Robots.rehome`, `Buildings.remove`, `Buildings.unregisterRefund` |
| Bahn-Ansprüche | Umweisen, Heimschicken, Verkaufen und der Wächter geben die Bahn frei; der nächste Roboter setzt sie fort | `Robots.release`, `Robots.claimRow` |
| Zuweisung | Sektor, Rechteck, „Automatisch“ (nächster Sektor mit Staub im Netz). Jederzeit änderbar, ohne dass Fracht verloren geht. Fertige oder gesperrte Sektoren und Gebiete ohne Funknetz werden mit Grund abgelehnt | `Shop.assign`, `Shop.assignAuto`, `Robots.areaCheck`, `Robots.autoSector` |
| Fern- und Detailmodus | Detail: Bild plus 1,5 Bildschirme. Fern: jeder 6. Tick rechnet 6 Teilschritte mit derselben Schrittweite → identische Ergebnisse | `Robots.update` |
| Offline | bestehende Regeln (8 h, 50 %/80 %, 1-s-Schritte). Je Roboter wird in Teilschritte mit höchstens 6 Zellen Fahrweg geteilt. Das Fenster nennt die abgelieferte Menge | `Robots.offlineStep`, `Game.offline`, `UI.offlineSummary` |
| Ereignisse | `robotBought` (vorhanden), `robotCleaned`, `robotDelivered`, `robotStatus`, `hangarBuilt` | `Bus.emit` in `Robots`, `Buildings.place` |
| Hangar-Panel „Einsatz“ | Kopf mit Belegung und Kontostand; Zähler „arbeiten / warten / mit Problem“; „Alle zuweisen“, „Automatisch“, „Alle heimschicken“; je Roboter Status mit Symbol und Text, Gebiet, Füllstandsbalken, Zuweisen, Heim, Upgrades, Verkaufen; Upgrade-Segmentbalken; „Hangar abreißen“ mit Rückfrage | `UI.renderHangar`, `UI.robotRow`, `UI.robotActs`, `UI.upSeg`, `UI.demolishHangar` |
| Gesamtliste | alle Roboter nach Hangar gruppiert, „ohne Hangar“ getrennt | `UI.renderRobots`, `UI.open('robots')` |
| Karte | Zuweisungsmodus (Sektor antippen oder Rechteck ziehen), Vorschau in Petrol (möglich, mit Netzanteil) bzw. Rot mit Grund; Gebiete mit Robotersymbol und Anzahl; Punkte nach Zustand, Probleme mit „!“; Legende ergänzt | `UI.assignPick`, `UI.mapAssign`, `UI.drawMap` |
| HUD-Karte | Knopf „arbeiten / gesamt“ mit rotem „!“ bei Problemen; öffnet die Gesamtliste. Die Symbolleiste am Handy passt sich der Breite an | `UI.robotCard` |
| Statussymbole | über jedem Roboter ein eigenes Symbol je Zustand (nie nur Farbe) | `Draw.robotList` |
| Memo „Automatisierung genehmigt“ | ab Lizenz 1 nach der Einarbeitung; drei Schritte mit Häkchen (Hangar bauen, Roboter in Dienst nehmen, Sektor zuweisen), danach als Ziele im HUD; überspringbar | `UI.robotMemo`, `UI.goalList`, `Progression.robotTut` |
| Abriss im Baumodus | Hangar mit Robotern nur nach Rückfrage | `Build.pointerDown` |

## Gewählte Werte (`CONFIG.robots`)

| Modell | Vorschlag (Preis / Tempo / Radius / Tank) | Gewählt | Begründung |
|---|---|---|---|
| Mk1 | 2.500 / 4 / 1,2 / 30 | 2.200 / 4 / 1,2 / **45** | Mk1 war zu 37 % der Zeit auf Lieferfahrt (kleiner Tank); größerer Tank und etwas niedrigerer Preis bringen die Amortisation ins Ziel |
| Mk2 | 20.000 / 6 / 2,0 / 150 | **9.000** / **7** / 2,0 / **250** | Amortisation lag bei 48–58 Minuten |
| Mk3 | 150.000 / 8 / 3,5 / 800 | **450.000** / **12** / **5** / **1.500** | Mk3 brachte nur 2,3× Mk2 (Ziel 3–4×); breiter und schneller (wie ein Kehr-Crawler), dafür teurer, sonst Amortisation in 10–15 Minuten |
| Drohne | 1.000.000 / 14 / 2,5 / 400 | 1.000.000 / 14 / **5,5** / **2.000** | bleibt das stärkste Modell (sonst schwächer als der neue Mk3); kein Ziel vorgegeben |

Weitere neue Werte: `unloadBase` 0,5 s, `unloadKgPerSec` 200, `retry` 2 s, `stall` 60 s, `stallTries` 3, `hangarRadio` 60 Zellen, `nearScreens` 1,5, `offlineMaxMove` 6 Zellen, `strokeStep` 0,25 × Radius, `strokeMaxT` 0,25 s, `strokeMinRadius` 3.

**Gebündelte Putzstriche (Rechenaufwand):** Jeder Roboter zog bisher in jedem Logiktick einen eigenen Strich mit `World.stroke` und tastete dabei den ganzen Bürstenkreis neu ab, obwohl er nur 0,07–0,2 Zellen weitergefahren war. Bei den großen Bürsten (Mk3 Radius 5, Drohne 5,5) sind das 120–145 Zellen je Tick. Unter 4× CPU-Drosselung lag der 95 %-Wert der Robotersimulation damit bei 1,6–2,3 ms, also an der Grenze. Roboter ab Radius 3 sammeln ihre Fahrt jetzt und ziehen einen Strich, sobald sie ¼ ihres Radius gefahren sind (spätestens nach 0,25 s, sofort am Ende eines Abschnitts und vor jeder Fahrt ohne Putzen). `World.stroke` und das Putzen des Spielers sind unverändert. Für kleinere Bürsten bleibt es beim Strich je Tick: Bei Mk1 hätte das Bündeln den Rand der Putzbahn sichtbar weniger sauber gelassen (Ertrag −25 % im Test), und die Ersparnis wäre dort gering. Wirkung: Mk1 und Mk2 liefern exakt dasselbe, Mk3 +0,1 %, Drohne +0,2 bis +5,4 %. Die Putzarbeit je Tick sinkt unter Drosselung von 0,72 auf 0,26 ms, der 95 %-Wert des ganzen Ticks von 1,6–2,3 auf 1,3–1,5 ms.

Einen „Effizienz-Faktor“ oder einen festen kg/s-Wert je Modell gibt es bewusst nicht. Die Leistung bleibt flächenbasiert (Bürstenbreite × Tempo), wie beim Werkzeug des Spielers. Die Messung zeigt: In allen Gebieten begrenzen die Fläche und die Lieferfahrten, nicht die kg/s-Obergrenze. Ein zusätzlicher Faktor hätte nichts bewirkt.

## Balancing

**Methode:** echte Spielsimulation, kein Rechenmodell. Aufbau: Hangar, Außenposten und vier Sammeltrichter im Zielsektor, Funkkette vom Depot. Gemessen wird 10 Spielminuten Dauerbetrieb im Fernmodus. Die Abgabepuffer werden alle 5 s geleert (eine erste Messreihe war sonst bei vollen Puffern gedeckelt). Ertrag = abgelieferte kg × Grundpreis der Staubart × Erlösfaktor beim Freischalten. Den Erlösfaktor (Verhandlungsgeschick, Sektorbonus, Forschung) liefert die Tempo-Simulation des Spiels: Lizenz 1 ×1,31, Lizenz 2 ×1,60, Lizenz 4 ×2,69, Lizenz 6 ×9,18. Gemessen wurde mit einem einzelnen Roboter und mit einer Dreiergruppe (Mk3 und Drohne leeren als Gruppe den Sektor schneller und fahren dann weiter).

| Ziel | Vorher | Nachher | Ergebnis |
|---|---|---|---|
| Amortisation Mk1 (Mare Mopp), 12–20 Min. | 21,3 / 25,1 Min. | 14,8 / 17,9 Min. | erreicht |
| Amortisation Mk2 (Kraterhügel), 15–25 Min. | 58 Min. (Gruppe) | 18,8 / 20,2 Min. | erreicht |
| Amortisation Mk3 (Glitzerfelder), 20–30 Min. | 14,6 / 16,7 Min. | 20,8 / 26,7 Min. | erreicht |
| Stufen-Sprung Mk2 : Mk1 (gleiches Gebiet), 3–4× | 3,5× (209 : 60 kg/min) | 3,4× (274 : 81 kg/min) | erreicht |
| Stufen-Sprung Mk3 : Mk2 (gleiches Gebiet), 3–4× | 2,3× (478 : 209 kg/min) | 3,3× (896 : 274 kg/min) | erreicht |
| Erster Roboter 20–35 Min. | 36,6 Min. (Tempo-Simulation) | 36,5 Min. | knapp verfehlt; Lizenz 1 kommt erst bei 33,4 Min., dazu 5.000 ₥ Hangar. Beides liegt außerhalb von `CONFIG.robots` |
| Mensch gegen Roboter: ab dem 3. Roboter spürbar schneller, Spieler bleibt wichtig | 3 Mk1 ≈ +16–19 % | 3 Mk1 ≈ +20–25 % | erreicht. Spieler bei Lizenz 1: ~1.700–2.100 ₥/min aus Verkäufen (Simulations-Bot, Min. 20–60), Tempo-Simulation 1.832 ₥/min. Mk1: 123–149 ₥/min. Der Stellenplan (6 bei Lizenz 1) begrenzt auf etwa +40–50 %, die Roboter ergänzen den Spieler also |
| Rollenwechsel | – | qualitativ | Ab Lizenz 2–3 liefern Roboter-Gruppen ein Vielfaches eines Einzelroboters (Mk2 ≈ 450 ₥/min, Mk3 ≈ 17.000–22.000 ₥/min); Bauen, Netz und Zuweisen werden zur Hauptarbeit. Mit echten Spielern nicht geprüft |

Gemessene Rohwerte (kg/min je Roboter, nachher): Mare: Mk1 80,7, Mk2 273,7, Mk3 895,6, Drohne 1.194. Natürliche Gebiete, Einzelroboter: Mk1 76,2 (Mare), Mk2 248,8 (Kraterhügel), Mk3 1.343,5 (Glitzerfelder), Drohne 2.189 (Rückseite). Zeitanteile Mk1 vorher: 51 % putzen, 37 % Lieferfahrt; nachher 55 % / 32 %.

## Bewusst nicht enthalten oder beibehalten

- **Upgrades je Modell:** Die Upgrades gelten weiterhin für alle Modelle (bestehende Regel, Spielstände speichern sie global).
- **Wegfindung mit Randverfolgung um Hindernisse:** Hindernisse bremsen weiterhin, statt zu blockieren (bestehende Regel, Roboter können dadurch nicht festsitzen). Neu ist nur die Randverfolgung am Funknetz.
- **Fester kg/s-Wert je Modell und „Effizienz-Faktor“:** siehe oben.
- **Ereignisse liefern das Roboter-Objekt selbst** (wie die übrigen Bus-Ereignisse). Lesen ist vorgesehen, Ändern nicht; erzwungen wird das nicht.
- **Zuweisen an fertige Sektoren** wird jetzt abgelehnt. Vorher wurde es angenommen, und die Roboter zogen sofort weiter. Die Altprüfung R-04 ist entsprechend angepasst.
- **Tastenkürzel für die Roboter-Übersicht:** keines. Das hätte eine neue Tastenbelegung in den gespeicherten Einstellungen erfordert. Der HUD-Knopf ist per Tab erreichbar.

## Was geprüft wurde

Alle Prüfungen laufen automatisch und deterministisch: `node audit/run.js` (Ergebnisse in `audit/results/`).

| Test | Ergebnis |
|---|---|
| RT-01 Gleichwertigkeit Detail/Fern, 10 Min. | Mk1 358,3 / 358,3 kg, Mk2 1.243,9 / 1.243,9 kg, Mk3 5.970,6 / 5.970,6 kg: 0,0 % Abweichung |
| RT-02 Massenerhaltung mit 100 Robotern, Speichern/Laden im Betrieb | Staub- und Geldbilanz, Belegung und Neuzählung stimmen nach jedem der 40 Schritte |
| RT-03 Keine Doppelarbeit, 10 Mk1 auf einem Sektor | entfernt 1.074,89 kg = abgeliefert 895,81 kg + Fracht 179,07 kg; Neuzählung jeder Zelle stimmt |
| RT-04 300 Zufallsänderungen | keine Ausnahme, keine verlorene Fracht, keine veralteten Verweise, keine hängenden Ansprüche |
| RT-05 Funknetz | 0 Neuberechnungen ohne Änderung; Kette trägt; Antenne weg → Warnung und Stillstand; Rückgängig → weiter |
| RT-06 Offline | 3 Std. → +19.070 ₥ (nur Roboter im Netz); zweites Laden rechnet nicht doppelt; Uhr zurück → 0; Uhr 10 Tage vor → auf 8 Std. gedeckelt, nicht negativ |
| RT-07 Speichern/Laden | Rundlauf mit 2 Hangars, Mk1/Mk3/Drohne, Upgrades, Ladungen, freigegebenen Ansprüchen und Robotern mitten in Lieferung und Abladen identisch |
| RT-08 Forschung | jeder Roboter-Knoten wirkt genau einmal auf die beschriebene Größe, auch auf gekaufte Roboter; Selbstentleerung liefert per Funk |
| RT-09 Abriss und Kauf | Umzug ohne Verlust, nur Baupreis zurück; voller Hangar verhindert Kauf; passender Betrag kauft; Doppelklick bucht einmal |
| RT-10 Leistung (ungedrosselt) | 100 Roboter + 1.000 Bandzellen: 0,18–0,26 ms je Logiktick |
| RT-10b Leistung mit 4× CPU-Drosselung (iPad-Emulation), echte Schleife mit Zeichnen | Robotersimulation 0,40–0,49 ms je Tick im Mittel, 95 % ≤ 1,3–1,5 ms (Ziel ≤ 2 ms je Bild bei 1 Tick pro Bild). Vor dem Bündeln der Putzstriche: 95 % ≤ 1,6–2,3 ms |
| RT-11 Alter Spielstand | mit der Fassung vor den Änderungen gespeichert (Schema 2, ohne Roboter), in der neuen geladen: 50 s Weiterspielen identisch mit der alten Fassung |
| RT-12 Bedienung | Memo mit Häkchen, Hangar-Liste, Gesamtliste, HUD-Karte, Kartentipp (gesperrt abgelehnt, gültig angenommen), Rechteck, Abriss nach Rückfrage |
| Test 11 Bestehende Prüfungen | Statusvergleich aller Prüfungen gegen den Stand vor den Roboterarbeiten (Commit 61e221e): keine Verschlechterung. B-12 (Hangar-Rückgängig) und Z-03 (Reihenfolge der Roboter) jetzt grün. RB-06 (60-s-Lauf ohne Roboter) identisch, RB-05 (CONFIG außerhalb `CONFIG.robots`) byte-identisch. Die übrigen FEHLER-Einträge sind die bekannten Altfunde aus `audit/BERICHT.md`, unverändert |
| Langläufe (5 × 10.000 Fuzzing-Aktionen, 5 × 20 Std.) | keine Roboterverletzung; nur bekannte Altfunde, siehe Nachtrag unten |
| RB-07 Bauen am Touch-Gerät (Handy und iPad) | Gebäude per Touch auswählen, Platz antippen, „Bestätigen“ antippen → gebaut; Leiste ganz im Bild (behebt einen Fehler außerhalb der Roboterarbeit, siehe unten) |
| Altprüfung R-10b (Offline gegen Live) | 92 % (vorher 90–91 %; mit den schnelleren Robotern ohne Teilschritte 87 %) |

Zusätzlich von Hand im Browser geprüft (Screenshots Desktop 1280 × 800 und Handy 390 × 844): Memo, Hangar-Einsatz, Gesamtliste, Karten-Zuweisung mit Vorschau, HUD-Knopf mit Warnpunkt, Abriss-Rückfrage, Roboter-Optik mit den neuen Werten. Konsolenfehler: keine.

**Nicht geprüft:**
- echte Bildrate auf einem iPad (Headless-Chromium zeichnet ohne GPU; gemessen ist nur die Robotersimulation unter Drosselung)
- Bedienung mit echtem Touch (Mehrfinger-Gesten auf der Karte)
- Koop-Sitzungen mit Robotern über zwei Geräte (Koop nutzt dieselben Befehle; nicht eigens getestet)
- Spielgefühl mit echten Spielern

## Vorschläge mit Bezug zu bestehender Logik (nicht umgesetzt)

1. **Erster Roboter früher:** Lizenz 1 (33,4 Min. in der Tempo-Simulation) und der Hangarpreis (5.000 ₥) bestimmen den Zeitpunkt. Hangar für 3.000 ₥ oder eine etwas frühere Lizenz 1 würde das Ziel 20–35 Min. erreichen.
2. **Offline-Rechenzeit:** 60 aktive Roboter über 8 Std. brauchen ~11 s auf dem Desktop (bestehende 1-s-Schritte). Auf einem iPad sind 30–40 s Wartezeit zu erwarten. Eine Schätzung aus der zuletzt gemessenen Leistung je Roboter oder größere Schritte für wartende Roboter würden das stark verkürzen.
3. **Offline-Erlös:** Abgerechnet wird über den gleitenden Durchschnittspreis (`G.avgVal`). Aufträge „Lieferauftrag“ und die Statistik „Verkauft“ zählen Offline-Ware nicht (Altfund R-10).
4. **Tab im Hintergrund:** Die Zeit wird weder live noch offline gutgeschrieben (Altfund R-14). Roboter arbeiten dann nicht; erst ein Neuladen zählt die Zeit.
5. **Tempo-Simulation (`Debug.pacing`):** Sie rechnet Roboter mit einer eigenen Formel, die deutlich über der echten Simulation liegt (z. B. Einkommen bei Lizenz 2: 15.000 ₥/min). Für künftiges Balancing sollte sie an die echte Simulation angeglichen werden.
6. **Roboter verkaufen:** Die Ladung wird pauschal mit 1 ₥/kg erstattet, nicht zum Staubwert.
7. **Upgrades je Modell** statt global, falls gewünscht (braucht eine Speicher-Migration).
8. **Wegfindung um Hindernisse** mit Randverfolgung statt Bremsen, falls Roboter sichtbar „um Felsen herum“ fahren sollen.
9. **Tastenkürzel** für die Roboter-Übersicht (neue Belegung in den Einstellungen).
10. **Bekannte Altfunde** aus `audit/BERICHT.md` (z. B. B-04 Bauen auf der eigenen Position, B-11/P-07 Verarbeitungsfortschritt, S-04 bis S-11 Speichern) sind von dieser Arbeit unberührt und weiter offen.

## Geänderte Dateien

- `index.html`: Logik, Bedienung, Werte, Kommentarblock
- `README.md`: Abschnitt „Roboter (K.E.H.R.-Bots)“
- `audit/tests/t_robots2.js`: neu, RT-01 bis RT-12 und RT-10b
- `audit/tests/t_robots.js`, `t_build.js`, `t_fuzz.js`, `t_regress.js`, `audit/test-api.js`, `audit/run.js`: Anpassungen an das neue, dokumentierte Verhalten (R-04, B-12, Modellliste, CONFIG-Vergleich ohne Roboter-Block, Hangar-Verweis 0 = ohne Hangar)
- `audit/ROBOTER_BESTAND.md`, `ROBOTER_SPEC.md`, `audit/results/*`

## Nachtrag: Langläufe

- **20-Stunden-Simulation (5 Seeds):** Massen- und Geldbilanz sowie die Neuzählung stimmen an jedem Kontrollpunkt. Gemeldet werden nur die bekannten Altfunde: Fahrzeugtank um Bruchteile eines Gramms überfüllt (F-11) und Bot-Stillstände. Der Simulations-Bot erreicht Lizenz 1 erst nach 98–135 Minuten (einfacher Bot) und kauft direkt danach Roboter; Roboterverletzungen gibt es keine.
- **Fuzzing (5 × 10.000 Aktionen):** Beim ersten Lauf meldete das Fuzzing zwei Abweichungen beim Speichern und Laden (`robots.0.state: "toDrop" ≠ "work"`). Sie bestanden schon vor dieser Arbeit (Z-F6, Z-F7, Z-F12 im Ausgangsstand). Behoben durch das Mitspeichern von Ziel und Restzeit; RT-07 prüft das jetzt. Im zweiten Lauf (nach der Korrektur) 6 FEHLER statt 8, alle bekannte Altfunde ohne Roboterbezug: Spielerposition nach dem Laden mit Fahrzeug (V-06), Gleitkomma-Rest des Mondglanz-Index (10⁻⁹), Staubbilanz-Rundung (F-11), Fahrzeug verweist auf abgerissene Garage (B-14).

## Nachtrag: Fehler beim Bauen am Touch-Gerät (unabhängig von den Robotern)

Auf Handy und iPad ließ sich kein Gebäude setzen oder verschieben, nur Förderbänder. Die Leiste „Bestätigen / Drehen / Abbrechen“ lag im Container der Touch-Steuerung (`#touch`), den der Baumodus ausblendet. Die Leiste hängt jetzt direkt unter `#ui`, ist am Handy auf die Bildschirmbreite begrenzt, und „Abbrechen“ hat einen festen dunklen Hintergrund. Geprüft auf emuliertem Handy und iPad mit echten Touch-Eingaben für alle 17 Gebäudearten, eine Brücke über eine echte Schlucht und „Verschieben“. Dauerhaft gesichert durch RB-07 in `audit/tests/t_regress.js`.
