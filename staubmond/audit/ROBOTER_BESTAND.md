# Bestandsaufnahme Roboter-Automatisierung

Stand: `index.html` nach der Logikprüfung (Commit 61e221e), vor jeder Änderung für `ROBOTER_SPEC.md`. Zeilenangaben beziehen sich auf diesen Stand.

**Ergebnis:** Die Roboter-Automatisierung ist zum größten Teil vorhanden und funktioniert (Logikprüfung R-01…R-14, G-05). Es fehlen vor allem Teile des Zustandsautomaten (Abladedauer, Ziel voll, kein Ziel, Gefangen), der Hangar-Abriss mit Umzug, die Hangar-Funkreichweite, Freigabe von Bahn-Ansprüchen, die automatische Gebietswahl, eine HUD-Roboterkarte, eine Gesamtliste aller Roboter, das Tutorial-Memo und die Balancing-Abstimmung.

| Teil | Status | Fundstelle | Anmerkung |
|---|---|---|---|
| Modelle Mk1, Mk2, Mk3, Schwarm-Drohne (Preis, Tempo, Radius, Kapazität, Lizenz) | vorhanden | `CONFIG.robots` 1686–1691 | Werte = Vorschlagswerte der Vorgabe; Mk3 `smallRims`, Drohne `fly` |
| Eigener Konfigurationsblock `CONFIG.robots` | teilweise | 1686–1701 | `robots` ist eine Liste der Modelle; weitere Roboterwerte stehen als `robotPowerPerCell`, `robotUpgrades`, `robotTerrain`, `robotFarGroups`, `robotFleet` auf oberster Ebene |
| Leistung (kg/s) | vorhanden, anderes Modell | `Robots.power` 6730 | 2 × Radius × Tempo × 0,5 kg; Roboter sind praktisch flächen-, nicht leistungsbegrenzt |
| Upgrades Tempo/Radius/Kapazität | vorhanden, global | `G.robotUp`, `Robots.upPrice` 6732, Hangar-Tab „Upgrades“ 8674 | 10 Stufen, gelten für alle Modelle (Vorgabe: je Modell) |
| Hangar (5.000 ₥, 3 × 3, Lizenz 1, 6 Plätze, Forschung +4) | vorhanden | `CONFIG.buildings` 1669, `Buildings.hangarSlots` 3644 | Heimat und Abgabepunkt (Puffer 1.500 kg, Ausgang aufs Band) |
| Roboter kaufen im Hangar, Sperrgründe (Lizenz, Hangar voll, Stellenplan, Geld) | vorhanden | `Robots.buy` 6735, `UI.renderHangar` 8641 | Kaufkarten mit Vergleichsbalken, „Es fehlen“, gesperrt mit Lizenz |
| Stellenplan (max. Roboter je Lizenz) | vorhanden | `CONFIG.robotFleet`, `Robots.fleetCap` | |
| Hangar-Abriss mit Robotern | fehlt (blockiert) | `Buildings.remove` 3296 | Abriss wird verweigert; „Rückgängig“ entfernt den Hangar trotzdem, Roboter verweisen dann auf einen fehlenden Hangar (Logikprüfung F-10) |
| Sammeltrichter (300 ₥, 2 × 2, Lizenz 1) mit Bandausgang | vorhanden | 1658, `Buildings.output` 3581 | Förderbänder, Verteiler, Silo, Rampe vorhanden |
| Antennen (1.500 ₥, 1 × 1, Lizenz 1, 300 Zellen) und Ketten | vorhanden | `Buildings.rebuildCoverage` 3612 | Netz nur bei Änderung neu berechnet, Raster 16 × 16 Zellen |
| Depot/Außenposten als Funkknoten | vorhanden | `radioRadius` 3606 | 320 Zellen |
| Hangar als schwache Antenne (60 Zellen) | fehlt | – | |
| Roboter arbeiten nur im Funknetz, Warnsymbol außerhalb | vorhanden | `Robots.step` 6887 | Flag `r.warn`, Funkspruch höchstens alle 30 s |
| Netz-Darstellung im Baumodus | vorhanden | `Build.drawGhost` 7402 | gestrichelte Fläche bei Antenne/Hangar |
| Zuweisung Sektor (Karte) | vorhanden | `UI.mapInfo` 9129 | mit Anzahl und „Roboter abziehen“ |
| Zuweisung Rechteck (Karte) | vorhanden | `UI.mapRectDone` 9119 | |
| Zuweisung aus dem Hangar | teilweise | 8660 | nur „Freie Roboter → Sektor des Spielers“, kein Einzelroboter |
| Zuweisung „Automatisch“ (nächster Sektor mit Staub im Netz) | fehlt | – | vorhanden ist nur die Weiterfahrt nach einem fertigen Sektor (`a.auto`, `Robots.nextSector` 6777) |
| Folgegebiet / Heimfahrt nach Gebietsende | vorhanden | `Robots.finish` 6767 | Sektor: nächster Nachbarsektor; Rechteck: nach Hause |
| Zustandsautomat | teilweise | `Robots.step` 6886 | vorhanden: home/idle, work (zum Abschnitt fahren und putzen), toDrop, radio (Selbstentleerung); fehlt: Abladedauer, „Ziel voll“ mit Wiederholung, „kein Ziel“, „gefangen“ |
| Abliefern exakt, Teilabgabe bei vollem Ziel | teilweise | `Robots.unload` 6880, `dropAccepts` 3471 | Abgabe nur, wenn die ganze Ladung passt; sonst anderes Ziel (Depot nimmt alles). Keine Teilabgabe, kein Warten |
| Wegfindung | vorhanden, anderes Modell | `Robots.moveTo` 6841, `CONFIG.robotTerrain` | gerade Linie; Hindernisse bremsen (Fels ×0,35, Rand ×0,5, Schlucht ×0,22), Mk3 ignoriert kleine Ränder, Drohne alles; Roboter können nicht festsitzen |
| Bahn-Aufteilung (Rasenmäher) | vorhanden | `Robots.claimRow` 6808, `scan` 6821 | Bahnbreite 2 × Radius × 0,86, Zeilen nacheinander vergeben, 3 Durchgänge; keine Freigabe des Anspruchs, wenn ein Roboter abgezogen wird |
| Detail- und Fernmodus | vorhanden | `Robots.update` 6946 | Nah: im Bild + 12 Zellen; fern: 10 Hz in 6 Gruppen; Abweichung 1–2 % (R-01) |
| Moduswechsel ohne Sprung | vorhanden | 6953 | R-02 |
| Offline-Fortschritt (8 h, 50 %/80 %, Häppchen, Fortschritt, Fenster) | vorhanden | `Game.offline` 10206, `UI.offlineSummary` 9046 | Fenster ohne „Kapseln“; Uhr-Sprünge abgefangen (R-11, R-12) |
| Forschung Robo-Kalibrierung, Doppelschicht, Größere Robo-Tanks, Selbstentleerung, Hangar-Erweiterung, Serienfertigung, Flottenkommando | vorhanden, wirken | `CONFIG.research` 1755–1765, `Economy.fx` | geprüft in G-05 |
| Speichern/Laden (Roboter, Zuweisungen, Upgrades), Funknetz nicht gespeichert | vorhanden | `Robots.save` 6719, `Save.coreJSON` | Rundlauf identisch (S-01) |
| Massenerhaltung inkl. Roboterfracht | vorhanden | `World.stroke` (gleiche Funktion wie Spieler) | Invariante in allen Läufen eingehalten |
| Ereignisse | teilweise | Bus | vorhanden: `robotBought`, `assigned`; fehlt: `robotCleaned`, `robotDelivered`, `robotStatus`, `hangarBuilt` |
| Hangar-Panel: Kaufkarten, Roboterliste, Upgrades | vorhanden | 8641–8684 | Liste ohne Füllstand-Balken, ohne Einzel-Zuweisung; kein Abriss-Knopf im Hangar-Panel |
| Gesamtliste aller Roboter | fehlt | – | nur pro Hangar |
| HUD-Roboterkarte („5 / 8“, Warnpunkt) | fehlt | – | |
| Status-Symbole über Robotern | teilweise | `Draw.robotList` 6299 | Symbole für Funk fehlt, wartet, liefert ab, Funk-Entleerung; fehlt: voll/kein Ziel/gefangen |
| Karte: Roboter als Punkte, Gebiete, Funknetz-Ebene | teilweise | `UI.drawMap` 9216 | Punkte nur gelb/rot, Gebiete ohne Anzahl |
| Roboter-Optik (Draufsicht, Auge, Bürste, Statuslicht, Schatten, Drohne mit Propellern) | vorhanden | `Draw.robotList` | Putzbahnen über den Boden-Shader |
| Antennen-Funkringe alle 3 s, Qualitätsstufen | vorhanden | `Draw.building` 6483 | |
| Tutorial-Memo „Automatisierung genehmigt“ mit Zielen | fehlt | – | |
| Balancing (Amortisation) | verfehlt | Messung siehe unten | |

**Messung vor Änderungen** (10 Spielminuten Dauerbetrieb, Sammeltrichter im Gebiet, Grundpreise ohne Verhandlungsgeschick/Nachfrage):

| Modell | Gebiet | kg/min je Roboter | ₥/min | Amortisation | Ziel |
|---|---|---|---|---|---|
| Mk1 | Mare Mopp | 51 | 76 | 33 Min. | 12–20 |
| Mk2 | Kraterhügel | 175 | 209 | 96 Min. | 15–25 |
| Mk3 | Glitzerfelder | 558 | 3.347 | 45 Min. | 20–30 |

## Plan

**Neu bauen:**
- Hangar als schwacher Funkknoten
- Abladedauer, „Ziel voll“, „kein Ziel“, „gefangen“ (Fortschrittswächter)
- Freigabe von Bahn-Ansprüchen
- automatische Gebietswahl
- Ereignisse
- HUD-Karte, Gesamtliste, Tutorial-Memo
- Teilabgabe bei vollem Ziel

**Vervollständigen:**
- `CONFIG.robots` als Block mit `models` und den neuen Werten
- Hangar-Abriss mit Umzug, auch über Rückgängig
- Roboterliste mit Füllstand, Einzel-Zuweisung und Abriss-Knopf
- Statussymbole und Kartenpunkte nach Zustand
- Offline-Fenster mit abgelieferter Menge
- Detail-Modus-Rand 1,5 Bildschirme
- Preise nach der Balancing-Messung

**Nur verbinden:** Forschung, Lizenzen, Stellenplan, Offline-Simulation, Speichern (neues Feld `robotTut` mit Schema 3 und Migration).

**Bewusst nicht geändert (bestehende Regeln):**
- globale Roboter-Upgrades statt Upgrades je Modell
- Hindernisse bremsen statt blockieren
- Leistungsformel

**Schnittstellen:**
- Geld nur über `Economy.spend/grant/sell`
- Staub nur über `World.stroke`
- Lizenzen über `G.licence`/`World.locked`
- Forschung über `Economy.fx`
- Karte über `UI.map*`
- Sektoren über `World.secProgress/secDone`
- Speichern über `Robots.save/fromSave` und `Save.migrate`
- Bedienung über `Shop`-Befehle (Tastatur, Touch und Koop nutzen dieselben)
