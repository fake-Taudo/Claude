# UI-Audit (Phase 0)

Stand vor der UI-Überarbeitung, Commit `1f05370`. In dieser Phase wurde kein Code geändert.

## 1. Tech-Stack

| Thema | Befund |
| --- | --- |
| Framework / Build | **Kein Framework, kein Build-Schritt.** Vanilla-JS-ES-Module, die der Node-Server direkt ausliefert (`client/`, `shared/`, Schriften aus `node_modules/@fontsource`). |
| Arena-Rendering | **Ein einziges Canvas 2D** (`#game-canvas`, volle Fenstergröße, DPR je nach Grafikqualität 1 / 1,5 / 2). |
| HUD | **Größtenteils im selben Canvas gezeichnet** (`client/js/game/hud.js`): Top-Bar, Kronen, Timer, Hand, Nächste-Karte, Elixierleiste, Emote- und Fähigkeitsknopf, Banner, Kronenflug. Als DOM darüber liegen nur Menüknopf und Pausenmenü (`#game-menu`), Toasts (`#toasts`), Modals (`#modal-root`) und Verbindungsbanner. |
| Layout / Skalierung | `Hud.layout()` berechnet drei Modi. **portrait**: Top-Bar oben, Hand unten. **side**: hochkant stehende Arena mit Panel rechts (Desktop, Tablet quer). **rotated**: Arena um 90° gedreht mit Panel rechts (Handy quer). Welt ↔ Bildschirm übernimmt `View` in `renderer.js`, inklusive 180°-Drehung für Spieler 2. Das Setting „Arena-Ausrichtung“ (`auto` / `portrait` / `rotated`) zwingt einen Modus. |
| Screens | DOM-`<section class="screen">` in `client/index.html`. `showScreen()` (`ui/dom.js`) schaltet um und setzt `body[data-screen]`. |
| State | `App` (`main.js`): Raum, Spiel, Ergebnis, Netz-Events. `Game` (`game/game.js`) pro Kampf: Snapshot-Puffer, Interpolation, Eingabe, Effekte. `Hud` (Layout, Zeichnen, Hit-Test), `Renderer`, `Particles`. |
| Speicherung | `localStorage['turmtrubel.v1']` = `{ name, settings, decks, active }` (`store.js`), Sitzungstoken in `sessionStorage['turmtrubel.token']`. **Keys bleiben unverändert**; neue Settings kommen nur mit Default dazu. |

## 2. Styling-Landkarte

* **Eine CSS-Datei**: `client/css/style.css` (484 Zeilen, 32 Custom Properties in `:root`, vor allem Farben, Radius, Schriften).
* **Schriften:** *Lilita One* (Anzeige) und *Nunito* 600–900 (Fließtext), lokal über `@font-face`, `font-display: swap`. Umlaute und ß sind im Latin-Subset enthalten.
* **Kontur der Anzeige-Schrift:** uneinheitlich. Überschriften nutzen `-webkit-text-stroke` + `paint-order`, `.btn` dagegen **5 gestapelte `text-shadow`s**.
* **Breakpoints:** `max-width: 860px` (einspaltig), `max-height: 520px` + Querformat (kompakt), `prefers-reduced-motion`.
* **Canvas-HUD:** Die Farben sind **hart im Code verteilt** (hud.js 38, renderer.js 64, game.js 38 Hex-Werte). Teamfarben liegen doppelt vor (`TEAM` in `sprites.js` und `--blue`/`--red` in CSS). Es gibt keine zentralen Abstands-, Radius- oder Bewegungs-Tokens.
* **Ziffern:** Nirgends tabellarisch. Timer, Elixierzahl und Turm-LP springen in der Breite.

## 3. Komponenten-Inventur

| Baustein | Ort | Anmerkung |
| --- | --- | --- |
| Button `.btn` + `btn-yellow/blue/green/red/purple`, `btn-big`, `btn-small` | style.css | Farbnamen statt Rollen; `btn-small` ist ca. 36 px hoch (unter 44 px) |
| `.icon-btn` (44 px), `.chip`, `.fchip` (ca. 30 px), `.deck-tab` | style.css | Filterchips unter 40 px |
| `.toggle`, `.seg`, Slider (`input[type=range]`) | style.css / settings.js | Größen uneinheitlich, Slider-Griff Browser-Standard |
| `.panel`, `.modal` + `.modal-back` | style.css / dom.js | Kein Bottom-Sheet, kein Fokus-Trap |
| `.toast` (bis 4 gestapelt, oben) | dom.js | Im Spiel über den Gegnertürmen (B-03) |
| DOM-Karte `.card` mit CSS-Elixiertropfen `.cost` | cardview.js | Namen einzeilig, hart gekürzt (B-13) |
| Canvas-Handkarte, Canvas-Elixiertropfen | hud.js | **Duplikat** des Tropfens (CSS und Canvas) |
| Krone: Canvas (`drawCrown`) und SVG im Ergebnis | hud.js / main.js | **Duplikat** |
| Banner (Fähigkeit, Doppel-Elixier, Verlängerung, Ergebnis) | hud.js `banner()` | Mitten in der Arena (B-03) |
| Emote-Knopf, Emote-Rad, Sprechblase | hud.js / renderer.js | Knopf auf dem Arenarand, Blase über Turm-LP (B-09) |
| LP-Balken (Turm, Gebäude, Einheit) | renderer.js `drawBar` | Kein Nachlauf, kein Treffer-Flash |
| Platzierungs-Overlay, Vorschau-Geist | renderer.js | Fläche rot getönt, keine Schraffur, kein Übergang |
| Pausenmenü `#game-menu` | index.html | Kein Modal, kein Backdrop (B-08) |

## 4. Screenshot-Pipeline

Im Repository gibt es kein Screenshot-Skript. Die Referenzbilder entstanden mit temporären Playwright-Skripten. Neu entsteht **`tools/ui-shots.mjs`** mit allen Viewports, Zuständen und automatischen Prüfungen.

Die Referenz-Screenshots liegen lokal in `docs/ui-referenz/` (PNGs sind per `.gitignore` ausgenommen, 27 MB). Eine Auswahl liegt als JPEG in `docs/ui-referenz/vorher/`.

> **Wichtig zur Lesart:** `desk-07` … `desk-13` zeigen noch das **alte Desktop-Layout** mit Hand unten. Seit Commit `c7b5319` nutzt der Desktop bereits eine hochkant stehende Arena mit Panel rechts (siehe `dk-036`). B-01 ist damit teilweise erledigt. Top-Bar-, Kronen- und Toast-Probleme bestehen weiter.

## 5. Risiken (UI eng mit Logik verwoben)

1. **Hit-Test hängt am Layout:** `Hud.hit()` und `Hud.inArena()` lesen dieselben Rechtecke (`hud.L`), die auch gezeichnet werden. Jede Layoutänderung muss Zeichnen und Hit-Test **gemeinsam** über `L` ändern.
2. **`View` = Eingabe-Koordinaten:** `placementFor()` und `tryPlay()` rechnen Bildschirm → Welt über `view.toWorld`. Solange `L.arena`, `view.s`, `view.ox` und `view.oy` konsistent bleiben, ist das sicher. Keine Änderung an Platzierungsregeln oder gesendeten Koordinaten.
3. **Elixier-Vorhersage** (`elixirNow()`) und die Handzustände (`pendingSlot`, `me.hr`) sind reine Anzeige. Sie dürfen umgestaltet, aber nicht in ihrer Bedeutung verändert werden.
4. **Nachrichtenfluss** in `main.js` (Raum verlassen, Rematch, Reconnect) wurde gerade stabilisiert. UI-Änderungen fassen nur die Darstellung an.
5. **Settings-Keys** (`music`, `sfx`, `musicVol`, `sfxVol`, `quality`, `orientation`, `dmgNumbers`, `showPing`) bleiben unverändert. Neu dazu kommen nur Keys mit Default (z. B. `haptics`, `muteEmotes`).
6. **Performance:** Das HUD wird ohnehin pro Frame ins Canvas gezeichnet. Neue Effekte bleiben günstig: nur Transformationen und Alpha, gecachte Gradienten, keine `shadowBlur`-Orgien auf Qualität „Niedrig“.

## 6. Geplante Reihenfolge

1. **Fundament:** Design-Tokens in CSS plus JS-Brücke fürs Canvas (`ui/tokens.js` liest die CSS-Variablen). Buttons, Chips, Toggles, Segment, Slider, Modal/Bottom-Sheet und Toast als einheitliche Bausteine, dazu Fokus-Stile.
2. **HUD:** Layout-Engine mit drei Modi ohne jede Überdeckung der Arena. Neue Top-Bar mit getrennten Kronengruppen, Timer-Pill und Ping mit Icon. Hand- und Elixier-Zustände mit Kostenmarker, Toasts über der Hand, Banner am oberen Arenarand, Emote und Fähigkeit im Panel, LP-Nachlauf, Schadenszahlen begrenzt, Drag-Geist über dem Finger.
3. **Menüs:** Hauptmenü mit Hero-CTA, Lobby-Countdown ohne Überdeckung, VS-Ladescreen mit echtem Fortschritt, Pausen-Modal, gruppierte Einstellungen, animiertes Ergebnis.
4. **Deck-Bauer und Kartendetail:** am Handy kompaktes Sticky-Deck, 2-zeilige Namen, Bottom-Sheet mit Stat-Icons und -Balken.
5. **Feinschliff und Verifikation:** Haptik, Reduced Motion, Qualitätsstufen, FPS-Messung, `tools/ui-shots.mjs` mit allen Prüfungen, Dokumentation.

**Abweichung vom Masterprompt:** Die Arbeit läuft auf dem vorgegebenen Branch `claude/1v1-card-game-browser-l8fwez` (von dort deployt Render), nicht auf `ui-overhaul`. Die Commits sind trotzdem thematisch getrennt (`ui: …`).
