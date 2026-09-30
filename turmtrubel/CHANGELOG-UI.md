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

## Phase 3 – Menüs und Ablauf

- **Startbildschirm:** Das Namensfeld zeigt einen Zeichenzähler und eine klare Meldung, wenn es leer ist. Das Logo springt einmal herein, statt endlos zu wippen.
- **Hauptmenü (B-11):** Es gibt einen großen Haupt-Knopf „Kampf erstellen“, der Online-Status steht in der Kopfzeile, und beide Panels sind gleich hoch. Das aktive Deck zeigt Ø Elixier, 4er-Zyklus und „spielbereit“ bzw. „Deck unvollständig“ als Kacheln.
- **Noch in einem Raum?** Statt des Hinweises auf die Einstellungen erscheint ein Banner mit direktem Knopf „Raum verlassen“.
- **Beitreten:** Der Code wird in sechs einzelne Felder eingegeben. Sie springen automatisch weiter und nehmen eingefügte Codes an. Falsche Codes werden rot markiert.
- **Lobby (B-04):** Der Countdown ersetzt das „VS“ und verdeckt nichts mehr. „Code kopieren“ bestätigt mit „Kopiert! ✓“, und ein Hinweis zeigt, auf wen gewartet wird.
- **Ladebildschirm (B-12):** Beide Seiten zeigen einen Burgturm in Teamfarbe und ein Emblem. Der Balken zeigt echten Ladefortschritt, die Tipps wechseln alle paar Sekunden.
- **Menü im Kampf (B-08):** Es öffnet sich als richtiger Dialog mit abgedunkeltem Hintergrund und dem klaren Hinweis „Das Spiel läuft weiter“. Die Knöpfe sind sinnvoll gewichtet, „Aufgeben“ ist abgesetzt und wird nachgefragt. Am Desktop gibt es gut lesbare Tastenkappen. Gegner-Emotes lassen sich hier stummschalten.
- **Einstellungen (B-17):** Sie sind in Audio, Grafik & Anzeige, Spiel und Konto gruppiert, jede Auswahl hat eine kurze Erklärung. Neu ist der Schalter „Vibration“.
- **Ergebnis (B-15):** Kronen erscheinen nacheinander, die Zahlen zählen hoch. Konfetti gibt es nur bei einem Sieg, eine Niederlage wirkt ruhiger und hat einen freundlichen Satz.

## Phase 4 – Deck-Bauer und Kartendetail

- **Keine Naht mehr im Kopf (B-10):** Die Kopfzeile des Deck-Bauers reicht über die ganze Breite und bleibt beim Scrollen oben.
- **Handy hochkant:** Dein Deck bleibt kompakt oben sichtbar (8 Karten, Kennzahlen in einer Zeile), darunter scrollt die Sammlung, die sofort sichtbar ist.
- **Tauschen:** Eine angetippte Deckkarte leuchtet blau, und ein Hinweis erklärt den nächsten Schritt. Evo-Plätze und der Champion/Held-Platz sind farbig markiert.
- **Kartennamen (B-13):** Namen stehen in bis zu zwei Zeilen und werden an sinnvollen Stellen getrennt. Karten im Deck tragen das Abzeichen „✔ Im Deck“.
- **Filter:** Der Knopf „Filter (n)“ zeigt, wie viele Filter aktiv sind. Mit „Zurücksetzen“ ist alles wieder frei, und bei null Treffern gibt es einen freundlichen Hinweis.
- **Deckname:** Ein Tipp auf den Namen öffnet das Umbenennen.
- **Kartendetail (B-16):** Die Werte haben Symbole und kleine Balken, die den Wert im Vergleich zu allen Karten zeigen. Die Evo-Fähigkeit steht in einer eigenen Box, die anzeigt, ob sie aktiv ist und nach wie vielen Einsätzen sie auslöst. Ist das Deck voll, sind „Ins Deck“ und „In Evo-Platz“ gesperrt und nennen den Grund. Am Handy öffnet sich das Detail als Blatt von unten.

## Phase 5 – Feinschliff

- **Vibration:** Ausspielen, Fehlversuche, zerstörte Türme und das Kampfende geben ein kurzes Vibrationssignal, falls dein Gerät das kann (abschaltbar).
- **Weniger Bewegung:** Mit der Systemeinstellung „Bewegung reduzieren“ wackelt nichts mehr, es gibt kein Konfetti und keine Parallaxe. Effekte werden durch sanfte Überblendungen ersetzt.
- **Grafikqualität wirkt spürbar:** „Niedrig“ verzichtet auf weiche Schatten, Schimmer und Konfetti. Nur „Hoch“ nutzt den weichgezeichneten Hintergrund hinter Dialogen.
- **Flüssiger:** Beschriftungen und Elixier-Tropfen im Kampf werden zwischengespeichert statt jedes Bild neu gezeichnet.
- **Aufgeräumt:** Ungenutzte Styles wurden entfernt. Die README beschreibt die neuen Layouts und das Screenshot-Werkzeug.
- **Prüfbar:** `node tools/ui-shots.mjs` prüft alle 8 Bildschirmgrößen automatisch. Aktuell gibt es 0 Überdeckungen, 0 zu kleine Tippziele und 0 abgeschnittene Elemente. `--perf` misst die Bildrate.
