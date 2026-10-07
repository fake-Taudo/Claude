# Vorher / Nachher

Alle Bilder stammen aus `tools/ui-shots.mjs`. **Vorher** = Stand `1f05370` (vor der Überarbeitung), mit demselben Werkzeug und denselben Zuständen aufgenommen. Diese Vorher-Bilder zeigten noch die früher erfundenen Karten und wurden entfernt; sie liegen in der Git-Historie (Commit a2c4935 und früher, Ordner `docs/ui-referenz/vorher-gleiche-zustaende/`). **Nachher** = aktueller Stand (`docs/ui-nachher/auswahl/`). Die vollständigen PNG-Sätze (8 Viewports × 25 Zustände) erzeugt `node tools/ui-shots.mjs` lokal nach `docs/ui-nachher/`. Die frühere Auswahl unter `docs/ui-referenz/vorher/` wurde aus demselben Grund entfernt (Git-Historie).

## Automatische Prüfungen (alle 8 Viewports, 25 Zustände je Viewport)

| Prüfung | Vorher | Nachher |
| --- | --- | --- |
| `arena-under-hud` (HUD überdeckt Arena) | 24–36 je Viewport | **0** |
| `touch-target` (< 44 px) | 117–129 je Viewport | **0** |
| `offscreen` / `hud-offscreen` / `h-scroll` | 4 (360×640) | **0** |
| `toast-over-arena` (oberhalb des untersten Fünftels) | 1 je Viewport¹ | **0** |
| `truncated` ohne Zugang zum Volltext | 0 | **0** (gekürzte Namen haben immer `title`) |
| Konsolenfehler/-warnungen | 0 | **0** |

¹ Vorher mit einer strengeren Regel gemessen (jede Überlappung). Der alte Toast saß allerdings oben über den Gegnertürmen.

**Performance** (`node tools/ui-shots.mjs --perf`, Bot-Kampf 10 s): Ohne Drosselung laufen alle Viewports mit stabilen **60 fps und 0 Long Tasks**. Mit CPU-Drosselung 4× sind es in dieser Sandbox ohne GPU (Software-Rasterung) 18–23 fps, beim alten Stand 19–26 fps. Laut Profil braucht JavaScript pro Frame nur 4–5 ms (gedrosselt), das HUD davon 1,3–1,8 ms. Den Rest kostet die Software-Rasterung. Die Messung auf einem echten Mittelklasse-Handy steht noch aus (siehe `docs/ui-entscheidungen.md`).

## Befunde

| ID | Befund | Status | Vorher | Nachher |
| --- | --- | --- | --- | --- |
| B-01 | Arena am Desktop zu klein/abgeschnitten | **behoben**. Die Arena ist gedreht und maximal skaliert (Desktop 23,9 → 30,8 px pro Feld), und kein HUD liegt mehr darüber. | desk-14 | [desk-14](ui-nachher/auswahl/desk-1280x800-14-kampf.jpg), [1920](ui-nachher/auswahl/desk-1920x1080-14-kampf.jpg) |
| B-02 | Top-Bar unlesbar, Kronen mehrdeutig | **behoben**. Getrennte Kronengruppen in Teamfarbe, Timer-Pill, Gegnername mit Ellipsis und Volltext per Tippen/Tooltip. | 360-14 | [360-14](ui-nachher/auswahl/phone-360x640-14-kampf.jpg), [780-14](ui-nachher/auswahl/phone-780x1688-14-kampf.jpg) |
| B-03 | Toast/Banner über Türmen | **behoben**. Der Toast erscheint über der Hand bzw. im Panel, Banner am oberen Arenarand. Hochkant liegt der Toast bewusst am unteren Arenarand (§9.7). | desk-15 | [desk-15](ui-nachher/auswahl/desk-1280x800-15-toast-elixier.jpg) |
| B-04 | Lobby-Countdown überdeckt Inhalte | **behoben**. Die Ziffer ersetzt das „VS“, die Bedienelemente sind ausgegraut. | desk-08 | [desk-08](ui-nachher/auswahl/desk-1280x800-08-lobby-countdown.jpg) |
| B-05 | Einheiten/Zahlen am Desktop winzig | **behoben**. Folgt aus B-01, dazu Turm-LP-Pill ≥ 16 px, Zahlen ≥ 12 px und Einheitenbalken ≥ 28 px. | desk-14 | [desk-14](ui-nachher/auswahl/desk-1280x800-14-kampf.jpg) |
| B-06 | Elixierleiste: Rot unklar | **behoben**. Ursache war `elixirFlash` (0,6 s rote Füllung). Jetzt gibt es nur einen 250-ms-Flash mit Wackeln, einen Kostenmarker mit Schraffur und die Zahl außerhalb der Leiste. | 360-14 | [360-19](ui-nachher/auswahl/phone-360x640-19-letzte-10s.jpg) |
| B-07 | Hand-Leiste am Desktop leer, Karten klein | **behoben**. 2×2-Raster im Panel (Karten bis 150 px), dazu Zustände für bezahlbar, nicht bezahlbar, gewählt und Zyklus. | desk-14 | [desk-14](ui-nachher/auswahl/desk-1280x800-14-kampf.jpg), [tab-q](ui-nachher/auswahl/tab-1024x768-14-kampf.jpg) |
| B-08 | Pause-Menü ohne Abdunklung | **behoben**. Modal mit Backdrop, „Das Spiel läuft weiter“, abgesetztes Aufgeben mit Bestätigung, kontrastreiche Tastenkappen. | desk-17 | [desk-17](ui-nachher/auswahl/desk-1280x800-17-pause.jpg) |
| B-09 | Emote-Knopf/-Blase über Turm-LP | **behoben**. Der Knopf sitzt im Panel oder Seitenstreifen, die Auswahl ist ein 3×2-Raster mit Abklingring, die Blase erscheint neben dem Turm. | 844-16 | [844-16](ui-nachher/auswahl/phone-844x390-16-emote-auswahl.jpg) |
| B-10 | Deck-Bauer Handy: Naht, viel Scrollen | **behoben**. Kopf über die volle Breite, kompaktes Sticky-Deck, Sammlung sofort sichtbar. | 360-06 | [360-06](ui-nachher/auswahl/phone-360x640-06-deck-sammlung.jpg) |
| B-11 | Hauptmenü ohne Hero, Online-Chip verloren | **behoben**. Hero-CTA, gleich hohe Panels, Online-Status in der Kopfzeile. | desk-02 | [desk-02](ui-nachher/auswahl/desk-1280x800-02-menu.jpg) |
| B-12 | Ladescreen leer | **behoben**. Burgturm-Vorschau, Emblem, echter Fortschritt, wechselnde Tipps (ohne Gegner-Deck). | desk-09 | [desk-09](ui-nachher/auswahl/desk-1280x800-09-laden.jpg) |
| B-13 | Namen hart abgeschnitten | **behoben**. Kartennamen zweizeilig mit weichen Trennstellen, sonst Ellipsis **mit** `title`, Gegnername per Tippen. | desk-05 | [desk-05](ui-nachher/auswahl/desk-1280x800-05-deck-bauer.jpg) |
| B-14 | Ping nacktes Label | **behoben**. Netz-Icon, Ampelfarben (60/120 ms), Hinweis „Verbindung instabil …“. | 360-14 | [desk-14](ui-nachher/auswahl/desk-1280x800-14-kampf.jpg) |
| B-15 | Ergebnis statisch | **behoben**. Gestaffelte Kronen, hochzählende Stats, Konfetti nur bei Sieg (ab „Mittel“, ohne reduzierte Bewegung), Rematch-Status. | desk-23 | [desk-23](ui-nachher/auswahl/desk-1280x800-23-ergebnis-sieg.jpg) |
| B-16 | Kartendetail rein textlich | **behoben**. Stat-Icons, relative Balken, Evo-Box mit Status, Bottom-Sheet am Handy. | 360-07 | [360-07](ui-nachher/auswahl/phone-360x640-07-kartendetail.jpg), [desk-07](ui-nachher/auswahl/desk-1280x800-07-kartendetail.jpg) |
| B-17 | Einstellungen flach, Controls uneinheitlich | **behoben**. Gruppiert, 44-px-Ziele, Beschreibungen, %-Werte. | 360-03 | [360-03](ui-nachher/auswahl/phone-360x640-03-einstellungen.jpg) |
| B-18 | Zahlen springen | **behoben**. Tabellarische Ziffern im Canvas (`tnum()`) und im DOM (`tabular-nums`). | – | [360-19](ui-nachher/auswahl/phone-360x640-19-letzte-10s.jpg) |

Weitere Nachher-Bilder: [Handy quer groß](ui-nachher/auswahl/phone-1688x780-14-kampf.jpg), [Tablet hochkant](ui-nachher/auswahl/tab-768x1024-14-kampf.jpg), [Beitreten mit Fehler](ui-nachher/auswahl/phone-360x640-04-beitreten-fehler.jpg).
