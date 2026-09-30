# UI-Entscheidungen

Laufendes Protokoll der UI-Überarbeitung: Entscheidungen mit Begründung, Vorschläge ohne bestehende Spiellogik, offene Punkte und fehlende Assets.

## Phase 1 – Fundament

| Thema | Entscheidung | Begründung |
| --- | --- | --- |
| Token-Werte | Die Namen aus dem Masterprompt (§7) sind übernommen. Bei den Farben gelten die **bestehenden Code-Werte**, wo sie abweichen: Team-Blau `#3d8bff` statt `#4387e2`, Team-Rot `#ff4d57` statt `#d94452`, Elixier `#d13cf0` statt `#db60e9`, Indigo-600/800 = bisherige Verlaufsenden. | Die Sprites, Türme und Karten sind auf diese Werte abgestimmt. Eine Umfärbung würde die Sprite-Identität verändern, ohne Lesbarkeit zu gewinnen. |
| Alte Variablennamen | `--ink`, `--blue`, `--panel` usw. bleiben als Aliase auf die Tokens bestehen. | Das erlaubt eine schrittweise Umstellung ohne Bruch. |
| Canvas-Brücke | `client/js/ui/tokens.js` liest die Custom Properties einmal beim Laden. `sprites.js` (Teamfarben) und `hud.js` (Schrift) beziehen ihre Werte daraus. | Es gibt eine Quelle der Wahrheit für DOM und Canvas. Pro Frame wird nichts gelesen, das kostet also keine Performance. |
| Button-Rollen | `btn-primary / secondary / success / accent / danger / ghost` ersetzen die Farbnamen. Die Kontur kommt über `-webkit-text-stroke` + `paint-order` statt über 5 `text-shadow`s. | Rollen statt Farben (§7), bessere Performance. |
| Größen | Standard-Button 48 px, CTA 58 px, klein 44 px. Chips, Filterchips, Deck-Tabs, Toggle und Segment haben ein 44-px-Ziel. | §8.5: Mindest-Touchziel 44 px. Filterchips liegen bewusst bei 44 statt 40 px, damit die automatische Prüfung ohne Ausnahmen auskommt. |
| z-Ebenen | `--z-toast` (55) liegt **über** `--z-modal` (50), abweichend von §7. | Meldungen wie „Keine Verbindung“ können erscheinen, während ein Modal offen ist, z. B. „Beitreten“. Unter dem Backdrop wären sie unsichtbar. |
| Toast | Es ist genau ein Toast sichtbar, ein neuer ersetzt den alten. Standarddauer 1,4 s, Ein- und Ausblenden je 140 ms. Die gleiche Meldung erneut wird nicht neu aufgebaut, sondern „angestupst“, und ihre Zeit verlängert sich. Längere Texte (Verbindung, Raum) behalten die längere Dauer, die der Aufrufer angibt. | §9.7. Wiederholtes Tippen auf eine zu teure Karte soll nicht flackern. |
| Modal | Backdrop `rgb(10 6 30 / .6)`, auf „Hoch“ zusätzlich 3 px Blur. Fokus-Falle (Tab bleibt im Modal), Esc schließt nur das oberste Modal, der Fokus springt beim Schließen zurück. `#app` ist währenddessen `inert`. Auf dem Handy hochkant (≤ 600 px Breite) wird das Modal zum Bottom-Sheet mit Griff, Wischen nach unten schließt. | §7 und §9.4. |
| Fortschrittsbalken | Laufen über `transform: scaleX` statt `width`. | §10: nur Transform und Opacity animieren. |
| Screenshot-Werkzeug | `tools/ui-shots.mjs` entstand schon in Phase 1 statt in Phase 5 und dient als Regressionstest für jede Phase. Playwright ist **keine** Projektabhängigkeit. Das Skript sucht es lokal oder global. | So bleibt `npm install` für Spieler und Render schlank. |
| Simulierte Zustände | „Letzte 10 s“, „zerstörter Turm“ und „Sieg“ werden im Screenshot-Werkzeug **nur clientseitig** vorgetäuscht (Restzeit überschrieben, Turm aus dem Snapshot gefiltert, Ergebnis gespiegelt). | Der Server bleibt unangetastet. Echte 3 Minuten pro Viewport wären zu langsam. |
