# Logikprüfung Staubmond – Bericht

Geprüfte Fassung: `index_audit_original.html` (= `index.html` vor Phase B, Commit 4aad8fa). Vorgabe: `LOGIK_AUDIT_SPEC.md`. Alle Zeilenangaben beziehen sich auf diese Fassung. Testergebnisse liegen als JSON in `audit/results/`.

## 1. Zusammenfassung

**Funde:** 1 Kritisch · 7 Hoch · 9 Mittel · 13 Niedrig · dazu Abweichungen und Hinweise (Abschnitte 5–7). **Phase B:** F-01 bis F-04 behoben (je mit Regressionstest, `audit/AENDERUNGEN.md`); F-05 bis F-08 brauchen eine Entscheidung.

**Die fünf wichtigsten Probleme**
1. **F-01 (Kritisch):** „Neues Spiel“ auf einem belegten Platz übernimmt nach dem nächsten Laden die geputzte Welt des alten Spiels; Fundstücke dort sind für immer verloren, Statistik und Sektoren stimmen nicht.
2. **F-02 (Hoch):** Putzt man in einem Chunk, während der Autosave ihn gerade komprimiert, geht diese Änderung beim nächsten Laden verloren (Zellen wieder staubig, Statistik sagt „sauber“).
3. **F-03 (Hoch):** Ein Speicherauftrag während eines laufenden Speicherns (Schließen des Tabs, Hauptmenü) wird verworfen; Laden während eines laufenden Speicherns liest einen halb geschriebenen Stand.
4. **F-04 und F-05 (Hoch):** Erstattungen zählen als Einnahmen, und Bau-/Kaufzähler zählen Abrisse nicht herunter → Aufträge („Haushaltsziel“, „Funkausbau“, „Personalaufstockung“, „Kurze Wege“, „Förderband-Offensive“) lassen sich durch Bauen + Abreißen ohne Gegenleistung erfüllen, inklusive Forschungspunkten.
5. **F-06 bis F-08 (Hoch):** Kern und Chunks werden nicht gemeinsam gespeichert. Abbruch mitten im Speichern, ein zweiter Tab oder das Laden eines Backups führen zu einem Stand, in dem Statistik und Welt nicht zusammenpassen.

**Gesamteindruck:** Die Spiellogik selbst ist solide. Massen- und Geldbilanz stimmen über 5 × 20 Spielstunden und 2.000 bzw. 50.000 Fuzzing-Aktionen, Sektor- und Mondglanz-Zählung stimmen mit einer vollständigen Neuzählung überein, Preise in Anzeige und Verkauf sind identisch, alle 36 Forschungsknoten wirken wie beschrieben, Nah- und Fernsimulation der Roboter weichen nur 1–2 % ab. Die Schwächen liegen fast ausschließlich beim **Speichern** (Nebenläufigkeit, Atomarität, Plätze) und bei **Erstattungen** (Aufträge, Rückgängig).

**Nicht geprüft:** echte Touch-Hardware und reale Mobilgeräte (nur Headless-Chromium mit Emulation), Koop mit zwei echten Geräten über das Internet, IndexedDB-Quota-Grenzen echter Browser, Safari-spezifisches Verhalten beim Schließen von Tabs.

## 2. Prüfumfang

| Abschnitt | Umfang | Belege |
|---|---|---|
| 2.1 Code-Review, Systemkarte | vollständig (alle Logikmodule gelesen; Darstellung nur, wo sie Logik liest) | `audit/SYSTEMKARTE.md` |
| 2.2 Harness | vollständig | `audit/test-api.js`, `audit/lib.js`, `audit/run.js` |
| 2.3 Invarianten | vollständig, nach jedem Testschritt (Neuzählung alle 25 Fuzz-Aktionen, an Kontrollpunkten und in gezielten Tests) | `T.check` in `test-api.js` |
| 2.4 Zeitraffer | 5 Seeds × 20 Std. mit Kontrollpunkten 10 Min./1 Std./5 Std./20 Std. | `t_sim_long.json` |
| 2.5 Fuzzing/Grenzwerte | 2 × 1.000 (Standard) und 5 × 10.000 Aktionen (Langlauf), Grenzwerte in t_core/t_misc | `t_fuzz*.json` |
| 3.1 Welt | vollständig | W-01…W-06, B-05…B-07 |
| 3.2 Putzen | vollständig | C-01…C-09 |
| 3.3 Depot/Kapsel/Verkauf | vollständig | D-01…D-12 |
| 3.4 Ökonomie | vollständig | E-01…E-13 |
| 3.5 Werkzeuge/Fahrzeuge | vollständig | V-01…V-06, C-06, C-09, B-14, B-15 |
| 3.6 Bauen | vollständig | B-01…B-19 |
| 3.7 Bänder/Verarbeitung | vollständig | P-01…P-09 |
| 3.8 Roboter/Offline | vollständig | R-01…R-14 |
| 3.9 Progression | vollständig | G-01…G-17 |
| 3.10 Speichern | vollständig bis auf echte Quota | S-01…S-13 |
| 3.11 Eingabe/Menüs | teilweise: Logik vollständig, echte Touch-Geräte nicht | I-01…I-05 |
| 3.12 Koop | teilweise: Host-Logik mit eingespeisten Nachrichten, keine echten Verbindungen | K-01…K-03 |
| 4.1–4.6 Querschnitt | vollständig; Leistung nur Logik (Headless, ohne GPU) | N-, Z-, X-, L-Prüfungen |

## 3. Testergebnisse

**Invarianten**

| Invariante | Ergebnis |
|---|---|
| Massenerhaltung (entfernt = Behälter + Depots + Kapseln + Bänder + Maschinen + Roboter + Fahrzeuge + verkauft + erstattet + Verarbeitungsverlust) | eingehalten, außer wenige Gramm bei vollem Behälter (F-11) |
| Geldbilanz (Konto = Start + Verkäufe + Gutschriften − Ausgaben) | eingehalten in allen Läufen |
| Nicht-negativ, kein NaN/Infinity | eingehalten; Ausnahme −5·10⁻⁷ ₥ (F-24), Infinity nur über manipulierten Spielstand (F-27) |
| Obergrenzen | Fahrzeug-/Karrenbehälter um bis zu 0,16 kg über Kapazität (F-22); Trichter/Hangar können durch Abladen des Spielers über ihren Puffer gefüllt werden (F-23) |
| Fortschritt nur vorwärts | eingehalten |
| Konsistente Summen (Neuzählung aller Zellen, Sektoren, Mondglanz, stats.cells) | eingehalten im Spiel; verletzt nur nach den Speicherfunden F-01, F-02, F-03, F-06, F-07, F-08 |
| Ein Ort pro Objekt (Belegung, Pakete, keine Pool-Doppelung) | eingehalten; Gebäude auf Spielfigur möglich (F-09) |
| Veraltete Verweise | verletzt nach Rückgängig (F-10) |
| Speichern/Laden-Rundlauf | identisch, außer Maschinen-Fortschritt (F-12) und Spielerposition mit Schubkarre (F-14) |

**Zeitraffer-Läufe** (Bot: putzt, lädt ab, startet Kapseln, kauft Werkzeuge/Upgrades/Fahrzeuge/Lizenzen/Forschung, baut Hangars und Antennen, setzt Roboter ein; baut keine Bänder und Maschinen)

| Seed | 10 Min. | 1 Std. | 5 Std. | 20 Std. | Invarianten |
|---|---|---|---|---|---|
| 101 | 1.519 ₥, L0 | 22.660 ₥, 1 Sektor | 5,8 Mio. ₥, L2, 11 Sektoren, 12 Roboter | 6,7 Mio. ₥, L2, 13 Sektoren, Glanz 6,47 % | ok (nur F-22) |
| 102 | 4.504 ₥ | 58.346 ₥ | 414 Tsd. ₥, L1, 5 Sektoren | 3,9 Mio. ₥, L2, 17 Sektoren | ok (nur F-22) |
| 103 | 583 ₥ | 24.568 ₥ | 147 Tsd. ₥, L1, 6 Sektoren | 866 Tsd. ₥, L2, 23 Sektoren | ok (nur F-22); 1 Bot-Stillstand |
| 104 | 676 ₥ | 39.022 ₥ | 1,4 Mio. ₥, L1 | 2,3 Mio. ₥, L2, 17 Sektoren | ok (nur F-22) |
| 105 | 1.627 ₥ | 35.468 ₥ | 220 Tsd. ₥, L1 | 516 Tsd. ₥, L2, 15 Sektoren | ok (nur F-22) |

Heap über 20 Std. konstant 14–17 MB; Basis-Cache bleibt unter 900 Einträgen (Grenze greift), Spuren-Chunks wachsen mit der besuchten Fläche (bis 409 Chunks, je höchstens 400 Spuren, nicht gespeichert) – begrenzt durch die Kartengröße, kein Leck. Meilensteine siehe Abschnitt 6.

**Fuzzing:** Standardlauf 2 Seeds × 1.000 Aktionen, Langlauf 5 Seeds × 10.000 Aktionen, gleichmäßig über 29 Aktionsarten (Ticks, Laufen, Abladen, Kapsel, Ein-/Aussteigen, alle Käufe, Bauen aller 14 Gebäudetypen, Abriss, Verschieben, Drehen, Bänder mit Kurven, Bandabriss, Rückgängig, Roboter kaufen/verkaufen/zuweisen/zurückrufen/aufrüsten, Forschung, Fahrzeug rufen/aufrüsten, Auftragstausch, Meteor, Geld, Speichern/Laden-Rundlauf). Ergebnis im Abschnitt „Fuzzing-Funde“ unten.

| Lauf | Aktionen | Rechenzeit | Spielzeit | neue Verletzungsarten |
|---|---|---|---|---|
| Standard (2 Seeds) | 2 × 1.000 | ≈ 100 s | je ≈ 3 Min. | 3 (alle bekannt: F-14, F-11) |
| Langlauf Seed 1000 | 10.000 | 1.842 s | 27,7 Min. | 7 |
| Langlauf Seed 8919 | 10.000 | 66 s | 25,0 Min. | 0 |
| Langlauf Seed 16838 | 10.000 | 991 s | 29,5 Min. | 1 |
| Langlauf Seed 24757 | 10.000 | 114 s | 28,7 Min. | 1 |
| Langlauf Seed 32676 | 10.000 | 106 s | 26,2 Min. | 1 |

Insgesamt 52.000 Aktionen, je Aktionsart 1.600–1.800 im Langlauf, darunter 1.694 Speichern/Laden-Rundläufe. Keine Abstürze, keine Ausnahmen, keine Verletzung von Geldbilanz, Nicht-negativ, Paketerhaltung oder Belegung.

## 4. Funde

Format: Beschreibung · Fundstelle · Reproduktion (Testdatei, Prüf-ID; ausführen mit `node audit/run.js <modul>`) · Auswirkung · Vorschlag und Risiko · Status.

### Kritisch

**F-01 · Kritisch · Speichern (3.10)**
- Beschreibung: „Neu“ auf einem belegten Speicherplatz startet ein neues Spiel, ohne die Chunk-Datensätze des alten Spiels zu löschen. Richtig wäre, den Platz vollständig zu leeren wie beim Löschen.
- Fundstelle: `UI` Platzwahl „Neu“ (Zeile 8964) → `Game.newGame` (10161); `Save.saveNow` schreibt nur Chunks des neuen Spiels (9479); `Save.loadSlot` lädt alle Chunks mit Präfix `s<slot>:` (9518).
- Reproduktion: `t_save.js` S-02. Erwartet: neues Spiel mit unberührter Welt. Tatsächlich: 467 Zellen des alten Spiels sind sauber, das Fundstück dort ist sauber, aber nie gefunden (für immer verloren), `stats.cells 0 ≠ Neuzählung 467`, Mondglanz falsch.
- Auswirkung: Wer einen Platz überschreibt, bekommt nach dem ersten Neuladen eine teilweise geputzte Welt mit verlorenen Fundstücken und falschen Sektorzahlen (gleicher Seed, also passt die alte Welt genau).
- Vorschlag: In `Game.newGame` vor dem Anlegen `await Save.deleteSlot(slot)` aufrufen. Risiko gering (dasselbe tut `newMission` schon).
- Status: **behoben** in Phase B (Test RB-01; Details `audit/AENDERUNGEN.md`)

### Hoch

**F-02 · Hoch · Speichern (3.10, 4.3)**
- Beschreibung: `Save.saveNow` nimmt einen Chunk erst nach dem asynchronen Komprimieren aus `World.dirtySave`. Änderungen in diesem Zeitfenster werden nicht gespeichert und nicht mehr als „geändert“ markiert. Richtig: Markierung beim Erstellen des Schnappschusses entfernen.
- Fundstelle: `Save.saveNow`, Zeile 9482 (`await this.encodeChunk(ch)` vor `World.dirtySave.delete(ci)`).
- Reproduktion: `t_save.js` S-03 (Komprimierung künstlich verzögert, währenddessen Putzen im selben Chunk). Erwartet: Chunk bleibt „geändert“. Tatsächlich: `dirtySave false`, nach dem Laden 36 Zellen wieder staubig.
- Auswirkung: Wenn ein Autosave (alle 30 s) einen Chunk erwischt, in dem gerade geputzt wird, und der Chunk danach nicht mehr berührt wird (häufig bei Robotern), fehlen diese Zellen nach dem Neuladen. Staub ist doppelt erntbar, Sektorzählung passt nicht mehr zur Welt.
- Vorschlag: `World.dirtySave.delete(ci)` vor `encodeChunk` ziehen (der Schnappschuss `rle(dust)` passiert synchron vor dem ersten `await`). Eine Zeile, Risiko gering.
- Status: **behoben** in Phase B (Test RB-02)

**F-03 · Hoch · Speichern (3.10, 4.3)**
- Beschreibung: Läuft bereits ein Speichervorgang, kehrt `saveNow` sofort zurück (`if (this.saving) return`), der Auftrag wird nicht nachgeholt. `Game.loadGame` liest außerdem, auch wenn noch geschrieben wird. Richtig: Auftrag nachholen; Laden wartet auf laufendes Speichern.
- Fundstelle: `Save.saveNow` Zeile 9470; `Game.loadGame` 10169; Aufrufer `pagehide`/`visibilitychange`/`Game.toMenu`.
- Reproduktion: `t_save.js` S-03b (gespeichert 35 ₥ statt 777.777 ₥). Fuzzing (Probelauf ohne Warten auf laufende Speicherungen): Neuzählungsfehler „Sektor 300 sauber 4581 ≠ 4356“ (minimal 10 Aktionen); `t_regress.js` RB-03: Laden während eines Speicherns → „Chunk 4849 sauber 464 ≠ 211“.
- Auswirkung: Schließt man den Tab oder geht ins Hauptmenü, während ein Autosave läuft, gehen die Änderungen seit dessen Beginn verloren. „Weiterspielen“ direkt danach kann einen Stand mit neuem Kern und teils alten Chunks laden.
- Vorschlag: In `saveNow` bei laufendem Speichern ein Nachhol-Flag setzen und nach Abschluss erneut speichern; in `loadGame` vor dem Lesen auf `!Save.saving` warten. Risiko gering.
- Status: **behoben** in Phase B (Test RB-03; Laden und Löschen warten zusätzlich auf laufendes Speichern)

**F-04 · Hoch · Ökonomie/Aufträge (3.4, 3.9, 4.4)**
- Beschreibung: Erstattungen (Abriss, Rückgängig, Bandabriss, Roboterverkauf) laufen über `Economy.grant` und erhöhen `stats.moneyEarned` und das Einnahmen-Fenster. Richtig: Erstattungen sind keine Einnahmen (die Geld-Animation im HUD schließt sie bereits aus, Zeile 7547).
- Fundstelle: `Economy.grant` 2826; Aufrufer mit Grund `refund` 3302, 3347, 3358, 3379, 3398, 6743.
- Reproduktion: `t_core.js` E-11 (Antenne bauen + abreißen: „Verdient“ +1.500 ₥, Einnahmen/Min. 0 → 1.500); `t_progress.js` G-09.
- Auswirkung: Aufträge „Haushaltsziel“ lassen sich durch Bauen und Abreißen eines teuren Gebäudes sofort erfüllen (Geld + 1–2 FP je Auftrag). Außerdem blähen Erstattungen die Einnahmen/Min. auf, aus der neue Auftragsbelohnungen und Inspektionsprämien berechnet werden.
- Vorschlag: In `Economy.grant` für den Grund `refund` weder `moneyEarned` noch `track` erhöhen. Risiko gering; Wirkung nur auf Statistik, Auftragsgrößen und HUD-Rate.
- Status: **behoben** in Phase B (Test RB-04)

**F-05 · Hoch · Aufträge (3.9, 4.4)**
- Beschreibung: `G.stats.builtBy` (Grundlage der Aufträge „Funkausbau“, „Kurze Wege“, „Förderband-Offensive“, „Personalaufstockung“) zählt nur Bauten/Käufe und nie Abrisse/Verkäufe; alles wird zu 100 % erstattet.
- Fundstelle: Bus `built`/`beltsBuilt` (10147, 10149), `Shop.robot` (9610); keine Gegenbuchung in `Buildings.remove`, `unregisterRefund`, `removeBelt`, `Robots.sell`.
- Reproduktion: `t_progress.js` G-09: 3 Aufträge erledigt, +3 FP, netto +300 ₥, ohne dass am Ende etwas gebaut ist.
- Auswirkung: Forschungspunkte und Auftragsgeld ohne Gegenleistung, beliebig wiederholbar.
- Vorschlag: Zähler bei Abriss/Verkauf zurückzählen. Nicht eindeutig: Dann ist „Personalaufstockung“ bei vollem Stellenplan unerfüllbar (heute nur durch Verkaufen + Neukaufen). Braucht eine Design-Entscheidung (siehe Abschnitt 8).
- Status: Entscheidung nötig

**F-06 · Hoch · Speichern, Atomarität (3.10)**
- Beschreibung: Kern (mit Chunk-Statistik) und Chunks werden in getrennten Transaktionen geschrieben; beim Laden wird die Statistik ungeprüft übernommen. Bricht das Speichern nach dem Kern ab, passen Statistik und Welt nicht zusammen.
- Fundstelle: `Save.saveNow` 9477–9485; `Game.startWorld` 10185–10192.
- Reproduktion: `t_save.js` S-04: „Chunk 4849 sauber 580 ≠ 335, stats.cells 501 ≠ Neuzählung 256“.
- Auswirkung: Nach einem Absturz oder Schließen mitten im Speichern sind Zellen wieder staubig, gelten aber als sauber (doppelt erntbar, Sektorfortschritt falsch). Auf Mobilgeräten wahrscheinlicher, weil `pagehide` das asynchrone Schreiben nicht abwartet.
- Vorschlag: Kern mit Speicherzähler versehen und Chunks mit demselben Zähler; beim Laden nicht passende Chunks neu zählen. Größerer Eingriff → Entscheidung nötig.
- Status: Entscheidung nötig

**F-07 · Hoch · Zwei Tabs (3.10)**
- Beschreibung: Kein Schutz gegen zwei Fenster mit demselben Platz; beide überschreiben Kern und Chunks gegenseitig.
- Fundstelle: `Save` allgemein (keine Sperre).
- Reproduktion: `t_save.js` S-11: Geld von Tab A, Fläche von Tab B sauber, `stats.cells 498 ≠ Neuzählung 754`.
- Auswirkung: Fortschritt eines Tabs geht verloren, Welt und Statistik passen nicht zusammen.
- Vorschlag: Web Locks API (`navigator.locks`) oder BroadcastChannel-Hinweis „Spiel ist in einem anderen Fenster geöffnet“. UI-Entscheidung nötig.
- Status: Entscheidung nötig

**F-08 · Hoch · Backups (3.10)**
- Beschreibung: Backups enthalten nur den Kern, die Chunks gibt es pro Platz nur einmal. Wird ein Backup geladen, sind Geld/Statistik alt, die Welt neu.
- Fundstelle: `Save.saveNow` 9476; `Save.bestCore` 9504.
- Reproduktion: `t_save.js` S-07: „Chunk 4849 sauber 271 ≠ 452, stats.cells 192 ≠ Neuzählung 373“.
- Auswirkung: Nach einem beschädigten Hauptdatensatz ist der wiederhergestellte Stand in sich inkonsistent (Fundstücke in schon sauberen Zellen nie mehr findbar, Sektoren evtl. nie abschließbar wie erwartet).
- Vorschlag: Chunk-Statistik beim Laden aus den Chunk-Daten neu zählen (kostet Ladezeit) oder Chunks versionieren. Entscheidung nötig.
- Status: Entscheidung nötig

### Mittel

**F-09 · Mittel · Bauen (3.6)** – Gebäude lassen sich auf der Spielfigur (und auf Fahrzeugen/Robotern) platzieren; die Figur steckt danach fest (0,000 Zellen Bewegung in 4 s). Fundstelle `Buildings.validate` 3232. Repro `t_build.js` B-04. Auswirkung: Ausweg nur über Abriss/Teleport. Vorschlag: In `validate` die Zelle der Spielfigur (und Fahrzeuge) ausschließen; geringes Risiko. Status offen.

**F-10 · Mittel · Rückgängig (3.6)** – „Rückgängig“ eines Baus entfernt einen Hangar mit Robotern bzw. eine Garage mit Fahrzeug, obwohl der normale Abriss das verbietet bzw. Fahrzeuge umsetzt; danach verweisen Roboter/Fahrzeuge auf nicht existierende Gebäude, Roboter ohne weiteren Hangar stehen still. Fundstelle `Buildings.doUndo`/`unregisterRefund` 3331, 3355. Repro `t_build.js` B-12, B-14. Vorschlag: dieselben Prüfungen wie `Buildings.remove`. Status offen.

**F-11 · Mittel · Putzen (3.2)** – `World.stroke` liefert durch Rundung je Zelle und den Rest ≤ 8 mehr als das Budget; `Player.takeCol` schreibt ohne Schubkarre nur den freien Platz gut, der Rest verschwindet (Staub von der Karte entfernt, nirgends gutgeschrieben). Fundstelle 2667–2670, 2947–2949. Repro `t_core.js` C-04 (7 g in 36 Versuchen), Fuzzing minimal 3 Aktionen (Meteor, Sauglanze, Ticks: 1,96 g). Auswirkung: wenige Gramm pro Füllung. Vorschlag: Überschuss dem Behälter gutschreiben (minimal über Kapazität) oder Zellen anteilig zurückschreiben. Status offen.

**F-12 · Mittel · Verarbeitung (3.7, 3.10)** – Der angefangene Durchlauf von Verdichter/Ziegelpresse (`b.prog`, bis knapp 2 kg bereits verbrauchter Eingang) wird weder gespeichert noch beim Abriss erstattet. Fundstelle `Buildings.save` 3197, `remove` 3297, `updateMachine` 3574. Repro `t_build.js` P-07, B-10/B-11. Vorschlag: `prog` speichern (neues optionales Feld, alte Stände laden mit 0) und beim Abriss als Eingangsware erstatten. Status offen (Speicherformat-Erweiterung).

**F-13 · Mittel · Förderbänder (3.7)** – Gemessener Durchsatz liegt unter der Beschreibung: Stufe I 8,75 statt 10 kg/s, II 25 statt 30, III 50 statt 90, I mit Bandschmierung 10,6 statt 12, III mit Turbobändern 75 statt 216 kg/s. Ursache: Pakete wechseln erst bei p ≥ 1 auf die nächste Zelle und beginnen dort bei 0 (Überschuss verfällt); ein neues Paket braucht mehrere Ticks bis zum Mindestabstand. Fundstelle `Buildings.update` 3483–3497, `beltCanAccept` 3415. Repro `t_build.js` P-04. Bildraten- und zeitrafferunabhängig. Status: Entscheidung nötig (Korrektur ändert das Balancing).

**F-14 · Mittel · Fahrzeuge (3.5, 3.10)** – Mit Schubkarre gespeichert, springt die Figur nach dem Laden 1,1 Zellen auf die Position der Karre (kann in einem Hindernis landen). Fundstelle `Player.init` 2934–2935. Repro `t_misc.js` V-06, Fuzzing minimal 3 Aktionen. Vorschlag: nur bei Fahrzeugen außer `cart` die Position übernehmen. Status offen.

**F-15 · Mittel · Import (4.5)** – Ein importierter Spielstand mit gültiger Prüfsumme, aber `null` an Pflichtstellen (z. B. `orders`, `robots`), lässt das Laden mit Ausnahme abbrechen; Zahlen als Text werden übernommen (`licence: "3"` → Stringverkettung bei `licence + 1`). Fundstelle `Save.validate`/`migrate` 9490–9502. Repro `t_save.js` S-10. Keine Prototype-Pollution, kein XSS gefunden. Vorschlag: Typprüfung der Kernfelder in `validate`. Status offen.

**F-16 · Mittel · Anzeige (3.4)** – „Es fehlen X ₥“ rundet ab statt auf: bei 98,99 von 99 ₥ steht „Es fehlen 0 ₥“, bei 16,7 von 250 ₥ „233 ₥“ statt 234. Fundstelle `Shop.miss` 9568, `Economy.canBuyLicence` 2857, `Build.setGhost` 7274, `Buildings.place` 3280 (alle über `U.big`). Repro `t_core.js` E-04, E-06. Vorschlag: `Math.ceil` vor der Formatierung. Status offen.

**F-17 · Mittel · Koop (3.12)** – Der Host übernimmt Positionen der Mitspieler ohne Plausibilitätsprüfung (Sprung von 2.000 Zellen, Werte „abc“ → NaN). Ein manipulierter Client kann an jedem Depot abladen oder überall putzen. Wirtschaft bleibt host-autoritativ (keine Käufe ohne Geld). Fundstelle `Net.hostData` 9796–9815. Repro `t_misc.js` K-01/K-02. Status: Entscheidung nötig (Höchsttempo-Prüfung).

### Niedrig

| ID | Bereich | Fund | Fundstelle | Repro | Status |
|---|---|---|---|---|---|
| F-18 | 3.6 | Abriss erstattet den aktuellen statt des bezahlten Preises (nach „Großeinkauf“ 1.700 statt 2.000 ₥); Rückgängig dagegen den bezahlten. Kein Gewinn möglich | `Buildings.remove` 3300 | B-08, B-09 | offen |
| F-19 | 3.8 | Roboterverkauf erstattet Ladung pauschal mit 1 ₥/kg statt mit dem Warenwert wie Gebäudeabriss | `Robots.sell` 6743 | Code | offen |
| F-20 | 3.8 | Offline-Erlös wird als Gutschrift statt als Verkauf gebucht: „Verkauft“, Lieferaufträge und Staubart-Statistik zählen ihn nicht | `Game.offline` 10222–10224 | R-10 | offen |
| F-21 | 3.8 | `Shop.assign` prüft keine Regionssperre; Roboter fahren in gesperrte Sektoren, putzen dort nichts und melden nach 3 Runden „gereinigt“ | `Shop.assign` 9632 | Code (R-05 ohne passenden Sektor) | offen |
| F-22 | 3.5 | Fahrzeug-, Karren- und Roboterbehälter werden um bis zu 0,16 kg überfüllt (Budget-Überschreitung von `World.stroke`) | 3088–3089, 2949, 6866 | C-05, Simulation | offen |
| F-23 | 3.3 | Der Spieler kann Trichter/Hangar über ihren Puffer (2.000/1.500 kg) hinaus befüllen; nur Roboter prüfen `dropAccepts` | `Player.unloadTo` 2994 | B-20 | offen |
| F-24 | 4.1 | `Economy.spend` erlaubt 10⁻⁶ ₥ Unterdeckung → Konto −5·10⁻⁷ | 2831 | E-05 | offen |
| F-25 | 4.1 | Zahlenformat: −0,5 → „-1“, NaN/Infinity roh, ab 10¹⁸ „1.000 Brd.“; `U.kg` rundet 9,96 auf „10,0 kg“ | `U.big` 2012, `U.kg` 2021 | N-01, N-02 | offen |
| F-26 | 4.2 | Bei < 7,5 Bildern/s verwirft `Game.loop` Spielzeit (4 Bilder/s → 5,33 s statt 10 s) | 10261–10262 | Z-02 | offen |
| F-27 | 3.10 | Manipulierter Spielstand mit `money: 1e999` lädt als Infinity; Lizenz 99 wird übernommen | `Save.validate` 9490 | S-06 | offen |
| F-28 | 4.1 | Logik nutzt `Math.random` (Nachfrage, Events, Aufträge, Roboterposition), das auch Musik/Klänge verbrauchen; `World.rnd` wird nicht zurückgesetzt/gespeichert → Spielverläufe nicht reproduzierbar | 2848, 6738, 7053–7130; 2596 | D-11, Z-01b | offen |
| F-29 | 3.9 | „Steuervorteil“ (a9) verbilligt auch Fahrzeuge, Fahrzeug- und Roboter-Upgrades – mehr als beschrieben | `Economy.fx('upgradePrice')` | G-06 | offen |
| F-30 | 3.8 | Tab im Hintergrund: Zeit wird weder live noch offline gutgeschrieben (nur ein Neuladen zählt sie) | `visibilitychange` 10123 | R-14 | offen |

### Fuzzing-Funde

Jede neue Verletzungsart wurde durch Wiederabspielen auf eine minimale Folge reduziert (`t_fuzz_long.json`, Feld `minimal`). Keine neue Fehlerart: Alle Funde sind schon oben beschrieben oder gehen auf gewolltes Verhalten bzw. Rundung zurück.

| Fuzz-Fund | Minimale Folge | Zuordnung |
|---|---|---|
| Rundlauf: Spielerposition springt (Seed 1000, 16838) | 3 Aktionen: Schubkarre kaufen, schieben, Rundlauf | F-14 |
| Staubbilanz −0,7 g bzw. −2 g (Seed 1000, Standard 8919) | 3 Aktionen: Meteor, Sauglanze, Ticks | F-11 |
| Roboter verweist auf fehlenden Hangar (Seed 1000) | 8 Aktionen: Hangar, Roboter, Rückgängig | F-10 |
| Fahrzeug verweist auf fehlende Garage (Seed 32676) | 9 Aktionen: Garage, Fahrzeug einparken, Rückgängig | F-10 |
| Rundlauf: Mondglanz weicht um 10⁻⁹ ab (Seed 1000, 16838) | > 2.000 Aktionen | Hinweis: `World.glanzSum` wird inkrementell aufsummiert, beim Laden neu berechnet; Gleitkomma-Rest ohne Wirkung |
| Rundlauf: Roboterzustand „toDrop“ → „work“ (Seed 1000, 24757) | 120–180 Aktionen | Hinweis: gewollt – `Robots.fromSave` setzt Abliefer-Zustände zurück, die Ladung bleibt erhalten, der Roboter entscheidet neu |

## 5. Abweichungen von der Spielbeschreibung

| Thema | Beschreibung | Code | Einschätzung |
|---|---|---|---|
| Karte, Chunks, Sektoren | 6.144², 64², 4×4 | identisch | – |
| Abschluss / Sauber | 98 % / ≤ 8 | identisch; Rest 1–8 wird beim Putzen auf 0 gesetzt und als kg verbucht (C-03) | plausibel |
| Upgrade-Kosten | ×1,65 je Stufe | identisch, 15 Stufen (E-01) | – |
| Kapsel | ab 200 kg | 200 kg automatisch, manuell ab 0,5 kg (D-05) | gewollt (Tutorial) |
| Gewicht | 0,5 kg bei 255 | identisch (C-07), Rückseite ×1,5 Masse | – |
| Kehrwagen | erste Beschreibung | Tempo 15, Breite 7, 600 kg; „Bürstenbreiten verbreitert“ laut Kopfkommentar | gewollt |
| Bänder | 10/30/90 kg/s | real 8,75/25/50 kg/s (F-13) | ungewollt |
| Abriss | 100 % Erstattung | aktueller Preis (F-18) | vermutlich ungewollt |
| Offline | 8 Std., 50 % | identisch; effektiv ≈ 45 % (Offline-Schritte erzielen 91 % der Live-Leistung, R-10b) | plausibel |
| Fundstücke | 150 | identisch, alle putzbar erreichbar (G-08) | – |
| Auftragstausch | 1 pro Stunde | 1 je volle Spielstunde, mit a7 zwei (G-12) | – |
| Erdnachfrage | 20 Min., +50 % | identisch, Timer auf Spielzeit (D-10) | – |
| Meteorstaub | Wert | 3 × beste freigeschaltete Rohstaubart | plausibel |
| Sonnenwind | doppeltes Tempo | nur Tempo ×2, über Leistung = Radius × Tempo auch doppelte Leistung (G-16) | gewollt |

## 6. Balancing-Beobachtungen (nicht geändert)

- **Meilensteine des Bots gegen Pacing-Tabelle** (Median der 5 Seeds): erste Kapsel 0,5 Min. (Ziel 1), Handbürste + Besen 2,5 Min. (5), Kehrwagen 7 Min. (15, Spannweite 3–30), erster Sektor 95 Min. (25), Lizenz 1 + Roboter 2 Std. 1 Min. (30 Min.), Lizenz 2 nach 6,7 Std., Lizenz 3 und 20+ Roboter in 20 Std. nicht erreicht (Ziel 3 Std.). Der Bot ist bewusst einfach (bleibt an Kraterrändern hängen: 2.300–8.000 Ausweichmanöver, baut keine Bänder/Maschinen); trotzdem liegt der erste Sektor deutlich hinter dem Plan, weil ein Sektor rund 60.000 putzbare Zellen hat und erst bei 98 % zählt.
- **Stillstand nach Lizenz 2:** Ab etwa 10 Std. stagnieren alle Bot-Läufe bei 12 Robotern (Stellenplan Lizenz 2), weil der Bot Antennen nur auf festen Ringen setzt. Mit Antennenketten zu neuen Sektoren läuft es weiter (geprüft in B-18/R-08) – kein Spielfehler.
- **Geldstau:** In vier von fünf Läufen sammelt sich ab Lizenz 2 viel Geld (0,5–6,7 Mio. ₥), das mangels freigeschalteter Käufe liegen bleibt; Lizenz 3 hängt allein an 25 Sektoren.
- **Forschung Werkzeugzweig** multipliziert sich auf ×6,6 Putzleistung (t1 × t6 × t10 × t12) – sehr stark gegenüber Upgrade „Saugkraft“ (+15 % je Stufe).
- **Roboterverkauf ohne Verlust** (100 % Erstattung des aktuellen Preises): Zuweisungs- und Ausbauentscheidungen sind risikolos.
- **Offline-Effizienz:** effektiv rund 45 % statt 50 % (R-10b).
- **Fernmodus der Roboter** liegt 1–2 % unter dem Nahmodus (R-01) – innerhalb der Toleranz, aber Roboter außerhalb des Bildschirms sind minimal schwächer.

## 7. Im Video auffällig (Aufnahme 26.10.)

| Beobachtung | Ergebnis |
|---|---|
| Kapsel-Tabelle „Einnahmen-Multiplikator ×1,00“, Mondstaub 1,50 ₥/kg bei +50 % Nachfrage | **widerlegt**: Preisliste enthält den Nachfragebonus, der Multiplikator nicht; beim Verkauf wird er genau einmal angewendet (D-08). |
| „+3 ₥“ nach 2,2 kg (rechnerisch 3,3) | **bestätigt als Anzeige**: 3,3 ₥ werden voll gutgeschrieben, die Anzeige rundet ab (D-03, D-04); kein Verlust, keine Drift über 100.000 Verkäufe (D-09). |
| Depot „Kapsel 0/200 kg“, „gepuffert 0,0 kg“ trotz Geld, „Kapseln gestartet 6“ | **widerlegt**: Kleine Mengen bleiben in der Kapsel, bis manuell gestartet wird (ab 0,5 kg) oder 200 kg erreicht sind; danach zeigt das Depot 0/200. Geld kommt beim Start; der Zähler zählt echte Starts (Depot und Rampen) (D-03, D-05, D-06). |
| Erdnachfrage-Countdown 15:55 → 10:27 | **bestätigt korrekt**: läuft auf Spielzeit, auch bei offenem Terminal, und nach dem Laden nahtlos weiter (D-10). |
| „Es fehlen 233 ₥“ (Besen, Konto 17), „383 ₥“ (Schubkarre) | **korrekt bei ganzzahligem Konto**; bei Nachkommastellen 1 ₥ zu wenig, bis „Es fehlen 0 ₥“ (F-16). |
| Einnahmen/Min. springt 30/20/23/25 | **erklärt**: 60-s-Fenster mit einzelnen Kapselverkäufen; direkt nach Spielstart hochgerechnet (E-09). Zusätzlich zählen Erstattungen mit (F-04). |
| HUD-Ziel „Laufschuhe 1 (noch 46 ₥)“ | **korrekt**: gleiche Preisfunktion wie der Kauf (E-12). |
| Sektor 1,3 %, Mondglanz 0,0022 % | **korrekt**: stimmen mit vollständiger Neuzählung überein (G-03). |
| „Lizenz 1: 0/2 Sektoren · 2,0 T…“ | **korrekt**: beide Bedingungen werden kombiniert geprüft, Geld erst beim Kauf abgezogen, Freischaltungen genau einmal (E-13, G-04). „2,0 T…“ ist der abgeschnittene Text „2,0 Tsd. ₥“. |
| Lieferauftrag „60 kg Mondstaub“ fast voll nach 2,2 kg | **nicht reproduzierbar**: Der Balken misst verkaufte kg seit Auftragsbeginn (0 % nach Abladen, 3,7 % nach Kapselstart, G-10). Möglich wäre, dass im Video ein anderes Ziel-Kärtchen zu sehen war. |
| Auftrag „Sektor M-13 … 50 %“ gegen HUD-Sektorsymbol | **gleiche Quelle**, unterschiedliche Bedeutung: Ziel-Kärtchen zeigt den Anteil am Auftragsziel (1,3 % ÷ 50 % = 2,5 %) (G-11). |

## 8. Entscheidung nötig

1. **F-05 Aufträge über Bauen/Abreißen:** Bau-/Kaufzähler bei Abriss/Verkauf zurückzählen? Dann sollte „Personalaufstockung“ nur angeboten werden, wenn der Stellenplan Platz hat.
2. **F-06/F-08 Kern und Chunks konsistent halten:** Speicherzähler je Kern/Chunk mit Neuzählung beim Laden, oder Chunk-Statistik beim Laden immer neu zählen (längere Ladezeit bei großen Ständen).
3. **F-07 Zweites Fenster:** sperren (Web Locks) oder nur warnen?
4. **F-13 Banddurchsatz:** Simulation an den Nennwert anpassen (wirkt aufs Balancing) oder Beschreibung/Anzeige auf die echten Werte ändern?
5. **F-12 Maschinen-Fortschritt speichern:** Speicherformat um ein optionales Feld erweitern?
6. **F-17 Koop-Plausibilität:** Höchsttempo/Reichweite der Mitspieler auf dem Host prüfen?
7. **F-18 Abriss-Erstattung:** bezahlten Preis erstatten (wie Rückgängig) oder Beschreibung „100 %“ anpassen?
8. **F-30 Hintergrund-Tab:** Hintergrundzeit als Offline-Zeit gutschreiben oder bewusst pausieren?
9. Balancing (Abschnitt 6): Sektorgröße/Schwelle gegen Pacing-Ziel „erster Sektor nach 25 Min.“, Geldstau ab Lizenz 2.

## 9. Anhang

- Systemkarte: `audit/SYSTEMKARTE.md`
- Harness: `audit/test-api.js` (Test-Interface, nur in der Testkopie), `audit/lib.js`, `audit/run.js`; Testkopie wird bei jedem Lauf als `audit/index_audit_instrumented.html` erzeugt; Referenz unverändert: `index_audit_original.html`.
- Testmodule: `audit/tests/t_world.js` (3.1), `t_core.js` (3.2–3.4), `t_build.js` (3.6–3.7), `t_robots.js` (3.8), `t_progress.js` (3.9), `t_save.js` (3.10, 4.5), `t_misc.js` (3.5, 3.11, 3.12, 4.1–4.3, 4.6), `t_fuzz.js` (2.5), `t_sim.js` (2.4).
- Alle Tests inklusive Regressionstests (Standard, ≈ 2–4 Min.): `node audit/run.js`
- Phase-B-Regressionstests allein: `node audit/run.js t_regress`
- Langlauf (5 × 10.000 Fuzz-Aktionen, 5 × 20 Spielstunden): `LONG=1 SUFFIX=_long node audit/run.js t_fuzz t_sim`
- Einzelmodul: `node audit/run.js t_save`
- Determinismus: Math.random wird je Seite mit festem Seed ersetzt, `World.rnd` je Test zurückgesetzt; die Hauptschleife ist eingefroren, Logikticks laufen nur über `__test.ticks`.
