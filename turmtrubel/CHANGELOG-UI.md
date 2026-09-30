# Änderungen an der Oberfläche

Alle UI-Änderungen der Überarbeitung, in verständlichem Deutsch. Die Befund-IDs (B-01 … B-18) stammen aus dem UI-Masterprompt und sind in `docs/ui-vorher-nachher.md` aufgelöst.

## Phase 1 – Fundament

- **Einheitliche Farben und Maße:** Alle Farben, Abstände, Radien, Ebenen und Animationsdauern stehen jetzt zentral als Design-Tokens im Stylesheet. Das Spielfeld-HUD im Canvas liest dieselben Werte.
- **Buttons nach Rolle:** Die Buttons heißen jetzt nach ihrer Aufgabe (Haupt-Aktion, sekundär, bestätigen, Akzent, gefährlich, dezent) statt nach Farbe. Sie sind mindestens 48 px hoch, drücken sich beim Tippen sichtbar ein, zeigen einen klaren Fokus-Ring bei Tastaturbedienung und sind im deaktivierten Zustand entsättigt.
- **Größere Tippziele:** Filterchips, Deck-Tabs, Schalter und Segment-Auswahl sind jetzt mindestens 44 px groß.
- **Schalter zeigen ✓ / ✕:** Der Zustand ist nicht mehr nur an der Farbe zu erkennen.
- **Lautstärke mit Prozentanzeige:** Die Regler haben einen größeren Griff.
- **Dialoge:** Der Hintergrund ist abgedunkelt, die Tab-Taste bleibt im Dialog, Esc schließt ihn und der Fokus kehrt danach zurück. Auf dem Handy hochkant öffnen sich Dialoge als Blatt von unten, das man nach unten wegwischen kann.
- **Meldungen (Toasts):** Es ist immer nur eine Meldung sichtbar, mit Symbol und klarer Statusfarbe. Eine neue ersetzt die alte, statt dass sie sich stapeln.
- **Aufgeben-Dialog:** Die Knöpfe sind klar gewichtet („Abbrechen“ dezent, „Aufgeben“ rot).
- **Neu:** `tools/ui-shots.mjs` erstellt Screenshots aller Zustände in 8 Bildschirmgrößen und prüft sie automatisch.

## Phase 2 – Kampf-HUD

- **Nichts liegt mehr über dem Spielfeld (B-01, B-09):** Emote- und Fähigkeitsknopf, Menüknopf, Timer, Kronen und Ping sitzen in der Kopfleiste oder im Seitenpanel.
- **Größere Arena am Desktop und am Handy quer (B-01, B-05):** Auf breiten Bildschirmen liegt die Arena jetzt gedreht neben dem Kartenpanel. Einheiten und Zahlen sind am Desktop rund 30 % größer. Wer es lieber hochkant mag, stellt „Arena-Ausrichtung → Hochkant“ ein.
- **Klarer Punktestand (B-02):** Gegner (rot) und du (blau) haben je eine eigene Kronen-Gruppe. Neue Kronen fliegen ein und leuchten kurz auf. Der Gegnername ist auch auf kleinen Handys lesbar, der volle Name erscheint per Tippen.
- **Timer:** Die Zahl ist groß und ändert ihre Breite nicht. In den letzten 10 Sekunden wird sie warm und pulsiert. Doppel-Elixier und Verlängerung sind als Abzeichen am Timer zu sehen.
- **Ping mit Netz-Symbol und Ampelfarbe (B-14):** Bei Aussetzern erscheint der Hinweis „Verbindung instabil …“.
- **Elixierleiste verständlich (B-06):** Die Zahl steht neben der Leiste. Rot blinkt nur noch kurz, wenn das Elixier nicht reicht, und die Leiste wackelt dabei. Eine gewählte Karte zeigt ihre Kosten als Markierung, der fehlende Teil ist schraffiert.
- **Handkarten (B-07):** Zu teure Karten sind leicht entsättigt statt fast schwarz. Sobald das Elixier reicht, läuft ein Glanz über die Karte. Die gewählte Karte hebt sich mit blauem Schein ab, neue Karten gleiten aus „Nächste“ nach. Am Desktop zeigen kleine Tastenkappen die Kürzel.
- **Ziehen und Platzieren:** Das Kartenbild schwebt über dem Finger. Verbotene Flächen sind rot schraffiert, und beim Ziehen dorthin steht „Hier nicht möglich“ am Geist.
- **Meldungen und Ankündigungen (B-03):** „Nicht genug Elixier!“ erscheint direkt über der Hand (bzw. im Panel). Karten- und Phasenansagen erscheinen als kleine, deckende Banner am oberen Rand des Spielfelds.
- **Turm-Lebenspunkte:** Größere Anzeige mit Zahlen, die nicht springen. Verlorene Lebenspunkte laufen sichtbar nach, Treffer blitzen kurz auf.
- **Schadenszahlen:** Sie ploppen kurz auf und steigen nach oben. Mehrere Treffer auf dasselbe Ziel werden zusammengezählt, es sind höchstens 8 gleichzeitig zu sehen.
- **Emotes:** Die Auswahl ist ein großes Raster, die Abklingzeit läuft als Ring um den Knopf. Sprechblasen erscheinen neben dem Turm statt über dessen Lebenspunkten. Neu ist die Einstellung „Gegner-Emotes stummschalten“.
