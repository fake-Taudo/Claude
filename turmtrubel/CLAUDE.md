# Turmtrubel – Arbeitsregeln

## Update-Fenster bei jeder Änderung

Jede Änderung am Spiel (neue Funktion, sichtbare Verbesserung, Regel- oder Balance-Änderung, Fehlerbehebung, die Spieler bemerken) bekommt einen **neuen Eintrag ganz oben** in `client/js/updates.js`. Er erscheint beim nächsten Öffnen des Spiels im Fenster „Neu in Turmtrubel“ – auch bei Spielern, die „Nicht mehr anzeigen bis zum nächsten Update“ gewählt hatten.

- `id`: eindeutig und höher als alle bisherigen – Datum + laufende Nummer, z. B. `2026-10-12.2`.
- `version`: Anzeige-Version hochzählen (`1.4` → `1.5`), `date` als `TT.MM.JJJJ`, `title` als kurze Überschrift.
- `items`: die neuen Funktionen aus Spielersicht, kurz und auf Deutsch. Je Punkt `{ icon, title, text }`; `icon` ist ein Name aus `client/js/ui/icons.js` (`ICON_NAMES`).
- Nur beschreiben, was im Code tatsächlich vorhanden ist; keine internen Werkzeuge, Tests oder Dokumentation.
- Danach `node --test test/updates.test.js` ausführen.

Mehrere Änderungen in einem Arbeitsauftrag ergeben einen gemeinsamen Eintrag. Kommt im selben Auftrag später noch etwas dazu, den eigenen Eintrag ergänzen statt einen zweiten anzulegen.
