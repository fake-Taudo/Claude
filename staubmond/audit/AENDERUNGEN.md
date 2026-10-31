# Phase B – Änderungen

Behoben wurden nur die eindeutigen Funde der Schweregrade Kritisch und Hoch. Jede Änderung ist klein und betrifft genau einen Fund. Für jede gibt es einen Regressionstest in `audit/tests/t_regress.js`: Er war vor der Änderung rot und ist danach grün.

Was gleich geblieben ist:
- **`CONFIG`:** byte-identisch (RB-05).
- **Speicherformat:** unverändert, kein neues Feld.
- **Alte Spielstände:** Stände aus Phase 2 (Commit 30fe96a) und aus `index_audit_original.html` laden mit identischen Werten (S-12).
- **Logik:** Der 60-s-Logiklauf mit festem Seed liefert gegenüber dem Original identische Werte (RB-06). Die geänderten Größen kommen darin nicht vor.

Insgesamt geändert: 20 Zeilen hinzugefügt, 6 entfernt, alles in `index.html`.

## F-01 (Kritisch) – „Neu“ auf belegtem Platz übernimmt alte Chunks

- **Stelle:** `Game.newGame`
- **Vorher:** Das neue Spiel wurde gespeichert, ohne den Platz zu leeren. Die Chunk-Datensätze des alten Spiels blieben in IndexedDB liegen und wurden beim nächsten Laden übernommen.
- **Nachher:** Vor dem Anlegen läuft `await Save.deleteSlot(slot)`. Ein Fehler beim Leeren bricht das neue Spiel nicht ab, er wird nur protokolliert.
- **Test RB-01:**
  - vorher: Fundstückzelle sauber, `stats.cells 0 ≠ Neuzählung 467`
  - nachher: Zelle wieder staubig, Neuzählung stimmt

## F-02 (Hoch) – Chunk-Änderung während des Autosaves geht verloren

- **Stelle:** `Save.saveOnce`, Chunk-Schleife
- **Vorher:** `World.dirtySave.delete(ci)` stand nach `await this.encodeChunk(ch)`. Änderungen während des Komprimierens wurden weder gespeichert noch erneut markiert.
- **Nachher:** Die Markierung wird vor dem `await` entfernt. Der Schnappschuss `rle(dust)` entsteht synchron, jede spätere Änderung markiert den Chunk wieder.
- **Test RB-02:**
  - vorher: Chunk nicht mehr markiert, nach dem Laden 36 Zellen wieder staubig
  - nachher: markiert, 0 Abweichungen

## F-03 (Hoch) – Speicheraufträge während eines laufenden Speicherns

- **Stelle:** `Save.saveNow`, neu `Save.idle`, `Save.deleteSlot`, `Game.loadGame`
- **Vorher:**
  - `if (this.saving) return` hat Aufträge verworfen, etwa bei `pagehide`, beim Hauptmenü oder beim Tab-Wechsel während eines Autosaves.
  - Laden und Löschen liefen parallel zu einem laufenden Schreibvorgang.
- **Nachher:**
  - Ein zweiter Auftrag wird gemerkt (ein voller Auftrag hat Vorrang) und direkt nach dem laufenden Speichern nachgeholt. Der Aufrufer bekommt das Promise bis zum Ende zurück.
  - Die bisherige Speicherroutine heißt jetzt `saveOnce`, ihr Inhalt ist unverändert bis auf F-02.
  - `Game.loadGame` und `Save.deleteSlot` warten auf `Save.idle()`. Sonst schreibt ein laufendes Speichern nach dem Löschen noch Chunks, oder das Laden liest einen halben Stand.
- **Test RB-03:**
  - vorher: gespeichertes Geld 35 statt 777.777; Laden während des Speicherns ergibt „Chunk 4849 sauber 464 ≠ 211“
  - nachher: 777.777, Neuzählung stimmt

## F-04 (Hoch) – Erstattungen zählen als Einnahmen

- **Stelle:** `Economy.grant`, außerdem der Aufruf in `Buildings.doUndo` beim gescheiterten Rückgängig eines Abrisses (der Grund `'refund'` war dort nicht angegeben)
- **Vorher:** Jede Gutschrift erhöhte `stats.moneyEarned` und das Einnahmen-Fenster. Dadurch ließen sich Aufträge „Haushaltsziel“ durch Bauen und Abreißen erfüllen, und Erstattungen blähten Einnahmen/Min. auf, aus denen Auftrags- und Inspektionsprämien berechnet werden.
- **Nachher:** Gutschriften mit dem Grund `refund` verändern nur das Konto. Die HUD-Geldanimation hat Erstattungen schon vorher so behandelt.
- **Test RB-04:**
  - vorher: „Verdient“ 0 → 7.510 ₥, Einnahmen/Min. 0 → 7.510, Auftrag erledigt
  - nachher: 0 → 0, kein Auftrag erledigt
- **Rest:** Der Teil über die Bauzähler (F-05) bleibt bewusst offen, siehe Bericht Abschnitt 8.

## Gesamtlauf nach Phase B

- **Laufzeit:** `node audit/run.js` braucht 135 s.
- **Regressionstests:** alle 6 grün.
- **Speichermodul:** S-02, S-03 und S-03b sind jetzt OK.
- **Ökonomie:** E-11 ist OK.
- **Auftrags-Exploit G-09:** Statt 3 Aufträgen werden noch 2 erfüllt, über die Bauzähler (F-05, Entscheidung nötig).
- **Unverändert offen:** die übrigen Funde (Mittel, Niedrig, „Entscheidung nötig“), wie im Bericht beschrieben.
- **Weitere Prüfungen:** Ladebildschirm und Klick-Regression auf der echten Seite laufen ohne Fehler.
