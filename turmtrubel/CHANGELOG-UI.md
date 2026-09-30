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
