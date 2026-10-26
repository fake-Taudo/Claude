# Master-Prompt: Staubmond VFX- und UI-Überarbeitung

Oct 26, 2026 · @Paul Matuszek

## So benutzt du diesen Prompt

Kopiere alles ab „1. Rolle, Ziel und harte Grenzen“ in Claude Code, im selben Projektordner wie das fertige Spiel. Alternativ exportierst du das Dokument als Markdown, legst es als `VFX_UI_SPEC.md` neben die `index.html` und schreibst: „Lies VFX\_UI\_SPEC.md und setze sie Phase für Phase um.“

- Grundlage ist deine Bildschirmaufnahme vom 26.10. (iPad, Hochformat, Safari, 23 Sekunden). Claude Code kann das Video nicht sehen, deshalb stehen alle Beobachtungen mit Zeitstempel im Prompt.
- Der Prompt verbietet ausdrücklich jede Änderung an Spiellogik, Balancing, Ökonomie und Speicherformat. Es geht nur um Effekte, Optik, UI und Bedienung.
- Nicht im Video zu sehen waren: Fahrzeuge in Bewegung, Roboter, Förderbänder, Nacht, Vollkarte, Handy und Desktop. Für diese Bereiche gibt der Prompt Vorgaben aus dem bestehenden Design ab, ohne eigene Beobachtung.
- Tipp: Mach vor dem Start eine Kopie der aktuellen `index.html` (z. B. `index_v1.html`), damit du vergleichen und zurückspringen kannst.

## 1. Rolle, Ziel und harte Grenzen

Du bist ein Senior Technical Artist und Game-UI-Designer für HTML5-Canvas-Spiele. Du überarbeitest das fertige Browser-Spiel **„Staubmond“** (eine `index.html`, 2D-Top-Down, Mondputz-Simulation). Ziel: Das Spiel soll sich anfühlen wie ein poliertes Premium-Indie-Spiel. Jede Putzbewegung, jeder Verkauf und jedes Menü soll befriedigend, lesbar und hochwertig wirken. Momentan wirkt es wie ein funktionaler Prototyp.

**Dein Auftrag umfasst ausschließlich:** visuelle Effekte (VFX), Welt-Rendering, Animationen, HUD, Menüs, Game UI, Touch-Bedienung und UX-Feinschliff.

### Was du NICHT verändern darfst

Die Kernlogik ist abgenommen und bleibt exakt wie sie ist. Konkret:

- Keine Änderung an Werten im `CONFIG`-Objekt (Preise, Radien, Leistung, Kapazitäten, Geschwindigkeiten, Kosten-Faktoren, Pacing).
- Keine Änderung an Ökonomie, Upgrades, Lizenzen, Forschung, Aufträgen, Events, Sektor- und Fortschrittsberechnung, Roboter-KI, Förderband-Simulation, Weltgenerierung (Seed, Noise, Karte) oder Kollision.
- Keine neuen Spielmechaniken, keine neuen Items, keine neuen Währungen, keine veränderten Spielregeln.
- Speicherformat bleibt kompatibel: Ein bestehender Spielstand muss nach dem Update unverändert laden. Nur neue, rein optische Einstellungen (z. B. Effektstärke) dürfen in den Einstellungen-Speicher dazukommen.
- Die Spielerbewegung, die Steuerungsbelegung und die Reaktionszeit der Eingaben bleiben gleich (die *Optik* der Bedienelemente darfst du ändern).

### Wie du die Grenze einhältst

1. Lies zuerst den gesamten Code und erstelle eine kurze Karte: welche Module Logik sind (unantastbar) und welche Rendering/UI sind (dein Arbeitsbereich).
2. Effekte hängen sich **nur lesend** an die Logik: über einen Event-Bus (z. B. `fx.emit('cleaned', {x, y, kg, dustType})`, `'deposit'`, `'capsuleLaunch'`, `'purchase'`, `'sectorComplete'`, `'licenseUp'`, `'researchDone'`, `'orderDone'`). Füge in der Logik höchstens einzeilige `emit`-Aufrufe ein, die nichts zurückgeben und nichts verändern.
3. Effekte dürfen nie Spielzustände schreiben, nie Zufallszahlen aus dem Logik-Zufallsgenerator ziehen (eigener RNG für VFX) und nie die Logik-Tickrate beeinflussen.
4. Wenn eine UI-Verbesserung nur mit einer Logikänderung möglich wäre: nicht umsetzen, sondern in einer Liste „Vorschläge mit Logik-Bezug“ am Ende deiner Antwort notieren.
5. Prüfe am Ende jeder Phase: `CONFIG` ist byte-identisch zum Ausgangsstand, und die Logik-Prüfung aus Abschnitt 14 ist bestanden.

### Arbeitsweise

- Keine Rückfragen. Triff Gestaltungsentscheidungen selbst und dokumentiere sie kurz im Kommentarblock am Dateianfang.
- Arbeite die Phasen aus Abschnitt 14 der Reihe nach ab. Nach jeder Phase ist das Spiel lauffähig.
- Alle neuen optischen Werte (Farben, Timings, Partikelzahlen) stehen zentral in neuen Objekten `THEME` und `FX_CONFIG`, getrennt von `CONFIG`.
- Teste jede Phase in der Geräte-Emulation: iPad hoch und quer, iPhone hoch und quer, Desktop 1440 × 900.

## 2. Befund aus dem Video: schonungslose Kritik

Das Spiel funktioniert, aber es belohnt optisch fast nichts. Die drei größten Probleme: **Putzen fühlt sich nicht an wie Putzen** (keine Bürste, keine Spur, nur verschwommene Kante und braune Pixel-Quadrate), **der saubere Boden ist eine leere, graue Fläche ohne Glanz**, die die zentrale Belohnung verschenkt, und **Abladen und Kapselstart sind ein weißer Wischfleck statt eines Moments**. Die UI ist ordentlich strukturiert, aber kontrastarm, überladen und zeigt am iPad Tastatur-Kürzel.

Aufnahme: iPad, Hochformat, Safari mit sichtbarer Browserleiste, 23 Sekunden. Zeitstempel in Sekunden ab Videobeginn.

### Welt und VFX

| Zeit | Bereich | Beobachtung | Warum es schlecht ist | Schwere |
| --- | --- | --- | --- | --- |
| 0–23 s | Sauberer Boden | Flaches, kühles Grau mit kaum sichtbarem Rauschen. Keine Krater, Steine, Reflexe, Struktur. | Die wichtigste Belohnung des Spiels sieht aus wie ein leeres Blatt Papier. Nichts glänzt, nichts wirkt „frisch geputzt“. | Kritisch |
| 0–23 s | Staub | Gleichmäßig beige-braune, weichgezeichnete Fläche. Kein Relief, keine Körnung, keine Dichteunterschiede, keine Fußspuren. | Wirkt wie eine unscharfe Textur-Ebene statt wie Staub, der auf Mondboden liegt. Kein Gefühl von Dicke oder Material. | Kritisch |
| 2–6 s | Putzkante | Die Grenze sauber/staubig ist ein breiter, matschiger Weichzeichner-Übergang (sichtbar hochskalierte 1-px-pro-Zelle-Textur). | Man sieht nicht, wo man geputzt hat. Der „Aha, sauber!“-Moment fehlt komplett. Sieht technisch billig aus. | Kritisch |
| 2–6 s | Putz-Partikel | Kleine braune, eckige Pixel-Quadrate streuen ungeordnet um die Figur, ohne Bewegung zum Werkzeug. | Pixel-Quadrate brechen den flachen Vektorstil. Sie wirken wie Render-Fehler, nicht wie aufgewirbelter Staub. Kein Sog, keine Physik. | Hoch |
| 2–6 s | Werkzeug | Die Handbürste ist ein brauner Klotz neben der Figur. Keine Wischbewegung, keine Borsten. | Die Kernhandlung „Putzen“ ist nicht sichtbar. Man hält einen Knopf und Pixel fliegen. | Hoch |
| 0–23 s | Spielfigur | Etwa 45 px großer oranger Kreis mit blauem Visier. Kein Laufzyklus, kein Hüpfen, kein Schatten. Drehungen springen. | Die Figur hat keine Persönlichkeit und ist auf dem hellen Boden schwer zu erfassen. | Hoch |
| 0–23 s | Funkeln | Winzige weiße „+“-Kreuze liegen zufällig und statisch auf dem sauberen Boden. | Lesen sich wie Bildfehler oder tote Pixel, nicht wie Glanz. Sie hängen nicht mit dem Putzen zusammen. | Mittel |
| 8,5–9,5 s | Abladen | Ein weißer, weicher Kreis-Fleck wächst über dem Depot und deckt es fast vollständig zu. | Sieht aus wie ein überbelichteter Wischfehler. Kein Staubstrom, kein Einsaugen, kein Klick. | Hoch |
| 9–10 s | Kapselstart | Eine winzige Kapsel steigt mit dünner weißer Rauchsäule auf und ist nach etwa 1 s weg. | Der Verkauf ist der Zahltag des Spiels und fühlt sich an wie nichts. Keine Zündung, kein Schütteln, kein Flug zur Erde. | Hoch |
| 8,5–9 s | Popups | „+2,2 kg“ und „+3 ₥“ erscheinen klein, übereinander und über dem Depot-Label. | Unleserlich, überlagert sich gegenseitig, die Geldzahl fliegt nicht zum Kontostand. | Mittel |
| 0–23 s | Depot | Graue Box mit Banner und Startfeld, harter, versetzter Schatten ohne Weichheit. | Wirkt wie ein UI-Element auf der Karte statt wie ein Gebäude auf dem Mond. Keine Lichter, keine Bewegung. | Mittel |
| 0–23 s | Atmosphäre | Keine Vignette, kein Licht, keine Tiefe, keine Hintergrund-Bewegung, fester Zoom. | Die Szene ist flach und steril, obwohl sie auf dem Mond spielt. | Mittel |

### HUD und Bedienung

| Zeit | Bereich | Beobachtung | Warum es schlecht ist | Schwere |
| --- | --- | --- | --- | --- |
| 0–23 s | Bildschirmfläche | Safari-Tableiste und URL-Leiste fressen etwa 16 % der Höhe. Kein Vollbild-Hinweis. | Weniger Spielfläche, wirkt wie eine Webseite statt wie ein Spiel. | Hoch |
| 0–23 s | Tastatur-Hinweise | Am iPad stehen unter den Icon-Buttons und im Ziele-Panel Tasten wie „M“, „B“, „J“, „K“, „Esc“. | Touch-Spieler haben keine Tastatur. Verwirrend und unordentlich. | Hoch |
| 0–23 s | Icon-Leiste rechts | Fünf kleine Icon-Buttons plus Menü, etwa 33 pt groß, ohne Beschriftung. | Unter der 44-pt-Mindestgröße für Touch. Bedeutung nur durch Ausprobieren erkennbar. | Hoch |
| 0–23 s | Ziele-Panel | Abgeschnittener Text („Lizenz 1: 0/2 Sektoren · 2,0 T…“), Emoji-Klemmbretter als Icons, winzige Fortschrittsbalken. | Emoji passt nicht zum Vektorstil, Abschneiden versteckt das Ziel, die Balken sagen nichts über den Wert. | Mittel |
| 3–7 s | Weltlabel vs. HUD | Das Depot-Label „Hauptdepot · Kapsel 0/200 kg“ und das Depot selbst schieben sich unter die Sektor-Anzeige oben. | Welt-Labels und HUD kollidieren, Text überlagert sich. | Mittel |
| 0–23 s | Sektor-Anzeige | Grauer, halbtransparenter Chip, Fortschrittsring kaum sichtbar, „1,3 %“ in hellgrau. | Der Sektor-Fortschritt ist ein Hauptziel, wird aber am schwächsten dargestellt. | Mittel |
| 0–23 s | Minimap | Großer Kreis mit grob gepixelten Treppenstufen, Farben passen nicht zur Welt, Spieler-Symbol sieht aus wie ein Mauszeiger. | Grob und unfertig. Der Mauszeiger verwirrt am Touch-Gerät. | Mittel |
| 3–5 s | Joystick | Der Joystick-Knopf ragt sichtbar über den Außenring hinaus. Grau auf grau, kaum Kontrast. | Wirkt ungenau. Auf hellem Boden fast unsichtbar. | Mittel |
| 7,5 s | Kontext-Buttons | „Abladen“ (orange) und „Terminal“ (petrol) stapeln sich über „Putzen“. Gute Idee, aber gleiche Form, keine Einblendanimation. | Erscheinen hart. Die Priorität (Abladen ist jetzt das Wichtigste) wird nicht betont. | Niedrig |
| 0–23 s | Kapsel-Anzeige | Nach dem Abladen bleibt „Kapsel 0/200 kg“ stehen, trotzdem kommt Geld. | Der Spieler versteht nicht, was mit seinem Staub passiert ist (nur Darstellung klären, Logik nicht ändern). | Mittel |

### Menüs

| Zeit | Bereich | Beobachtung | Warum es schlecht ist | Schwere |
| --- | --- | --- | --- | --- |
| 10,5–16 s | Terminal-Tabs | Die Tab-Leiste ist rechts abgeschnitten („Kap“), scrollt horizontal ohne Hinweis. | Ein Tab ist versteckt. Kein Signal, dass man wischen kann. | Hoch |
| 10,5–12 s | Kaufkarten | Alle Werkzeuge haben dasselbe Hammer-Icon. Kauf-Buttons sind dunkelorange auf dunkel und kaum lesbar. | Kein visueller Unterschied zwischen Zahnbürste und Besen. Die wichtigste Handlung (Kaufen) ist am schwächsten. | Hoch |
| 12–15 s | Fahrzeug-Karten | Gleiches generisches Icon für Schubkarre, Kehrwagen, Rover. Keine Vorschau. | Fahrzeuge sind große Meilensteine, werden aber wie Tabellenzeilen präsentiert. | Mittel |
| 15–17 s | Kapsel-Tab | Reine Tabelle mit Preisen. Nur der „Kapsel jetzt starten“-Button hat Gewicht. | Trocken, keine Grafik, keine Visualisierung der Erdnachfrage. | Niedrig |
| 19,5 s | Forschung | Gesperrte Knoten sind fast unsichtbar (grau auf dunkelgrau). Keine Verbindungslinien. Dritter Zweig nicht sichtbar. | Liest sich wie eine Liste, nicht wie ein Baum. Man sieht nicht, wohin ein Pfad führt. | Hoch |
| 22,5 s | Aufträge | Cremefarbene Memo-Karten, thematisch stark. Aber winzige, hellgraue Schrift, Kopfzeile kaum lesbar. | Gute Idee mit schwacher Ausführung. Kontrast deutlich unter WCAG AA. | Mittel |
| 10,5–23 s | Panel-Verhalten | Panel erscheint rechts, die Welt dahinter wird nicht abgedunkelt. Verkleinerte Spielwelt bleibt unruhig sichtbar. | Kein Fokus. Das Panel konkurriert mit dem Spiel. | Niedrig |

### Was gut ist und bleiben soll

- Die Grundstruktur des HUD (Geld oben links, Minimap oben rechts, Behälter unten mittig, Putzen-Button rechts unten).
- Kontext-Buttons, die nur erscheinen, wenn sie gebraucht werden.
- Die ALOP-Memo-Optik der Aufträge als eigener, papierartiger Stil.
- Das Terminal als Seitenpanel am iPad, während das Spiel weiterläuft.
- Orange als Akzentfarbe für Aktionen und Geld, „Es fehlen X ₥“ in Gelb.

## 3. Art Direction: „Flat Vector mit Licht“

Bleib beim flachen Vektorstil (klare Formen, kräftige Farbflächen, saubere Outlines), aber gib ihm **Licht, Tiefe und Material**. Leitbild: ein Diorama aus mattem Karton, beleuchtet von einer harten Mondsonne, mit leuchtenden Akzenten. Keine Pixel-Art, keine eckigen Pixel-Partikel mehr.

### Drei Grundregeln

1. **Staub ist matt und warm, sauber ist kühl und glänzt.** Jede gereinigte Fläche muss sofort als „besser“ erkannt werden, auch aus dem Augenwinkel.
2. **Eine Lichtquelle für alles.** Die Sonne steht fest oben links (Lichtrichtung 315°). Alle Schatten fallen nach unten rechts, alle Kanten werden oben links aufgehellt. Dazu ein schwacher, bläulicher Erdschein als Randlicht von unten rechts.
3. **Leuchten heißt wichtig.** Nur Interaktives, Belohnungen und Maschinen leuchten. Der Rest bleibt matt. So lenkt Licht den Blick.

### Farb-Tokens (in `THEME`)

| Token | Hex | Verwendung |
| --- | --- | --- |
| `void` | #0B0E14 | Weltall, Panel-Hintergründe, tiefste Schatten |
| `clean.base` | #C7D1DC | sauberer Boden, Grundton |
| `clean.light` | #EAF1F8 | Glanzflecken, Lichtkanten |
| `clean.shade` | #97A4B4 | Mikrostruktur, Kraterinnenseiten |
| `dust.base` | #8A775E | Mondstaub, Grundton |
| `dust.light` | #A99579 | Staub-Kuppen, Lichtseite |
| `dust.dark` | #5C4F3E | Staub-Täler, Schattenseite |
| `regolith` | #4B4D55 | Regolith, dunkle Ebenen |
| `ice` | #CFE4F4 | Eisstaub, mit leichtem Blaustich |
| `glitter` | #C9AE6E / #FFE9A8 | Glitzerstaub und seine Funken |
| `alop.orange` | #FF7A2F | Akzent, Aktionen, Spieleranzug |
| `alop.orangeDeep` | #D9560F | gedrückte Zustände, Schatten auf Orange |
| `alop.petrol` | #1F8F8C | sekundäre Aktionen, Maschinen |
| `money` | #FFC24A | Geld, Gewinne, Kassen-Effekte |
| `success` | #5BE39A | erledigt, freigeschaltet |
| `warn` | #FFB020 | Behälter fast voll, Engpässe |
| `danger` | #FF5470 | blockiert, ungültig |
| `ui.surface` | #121722 bei 88 % Deckkraft | Panels und HUD-Karten |
| `ui.border` | Weiß bei 8 % | Panel-Kanten |
| `ui.text` / `ui.textDim` | #F4F6FA / #AEB8C7 | Text, beide mit mindestens 4,5:1 Kontrast auf `ui.surface` |

Alle bisherigen fest einprogrammierten Farben im Rendering und in der UI werden durch diese Tokens ersetzt.

### Render-Ebenen (Reihenfolge von hinten nach vorn)

1. Felsuntergrund (sichtbar, wo sauber geputzt wurde)
2. Staubschicht mit Höhen-Shading
3. Boden-Decals: Fußspuren, Reifenspuren, Putzstriche, Kratzer
4. weiche Objektschatten
5. Gebäude, Fahrzeuge, Roboter, Förderbänder
6. Partikel unterhalb der Figuren (aufgewirbelter Staub)
7. Spielfigur und Mitspieler
8. additive Partikel und Leuchteffekte (Funken, Glanz, Zündflammen)
9. Licht- und Dunkelheits-Ebene (Tag/Nacht)
10. Bildschirm-Effekte: Vignette, Farbkorrektur, Kamera-Impulse
11. Welt-Labels und schwebende Zahlen
12. HUD und Menüs (DOM)

### Typografie

- Weiter mit der System-Schrift (keine externen Assets), aber mit klarer Hierarchie: Zahlen in Fett 800 mit `font-variant-numeric: tabular-nums`, damit hochzählende Werte nicht springen.
- Kleine Abschnitts-Labels in Großbuchstaben, 11 px, Laufweite +0,08 em, `ui.textDim`.
- Mindestgröße für Fließtext im HUD: 13 px am Handy, 14 px am iPad und Desktop. Nichts kleiner als 11 px.

## 4. Welt-Rendering: Staub, sauberer Boden, Putzkante

Die Staubdaten (Wert 0–255 pro Zelle) bleiben exakt gleich. Neu ist nur, **wie** sie gezeichnet werden. Ziel: Staub hat sichtbares Volumen, sauberer Boden ist ein detailreicher, glänzender Felsuntergrund, und die Grenze dazwischen ist knackig und befriedigend.

### Staub als Höhenfeld

- Interpretiere den Staubwert jeder Zelle optisch als Höhe. Berechne beim Erzeugen der Chunk-Textur den Gradienten zu den Nachbarzellen und beleuchte ihn mit der Sonne (315°): Hangseiten zur Sonne bekommen `dust.light`, abgewandte Seiten `dust.dark`.
- Dadurch entstehen weiche Staub-Dünen in dichten Bereichen und ein **erhöhter Staubwall entlang jeder Putzkante**, oben links hell, unten rechts mit kurzem Schatten auf den sauberen Boden. Das ist der wichtigste Einzeleffekt dieser Phase.
- Lege eine feine, kachelbare Körnung (vorab generiert, 256 × 256 px) mit `multiply` über den Staub, damit er nach Material aussieht statt nach Weichzeichner.
- Dichterer Staub ist dunkler und körniger, dünner Staub lässt den Felsuntergrund leicht durchschimmern.

### Knackige, organische Putzkante

- Ersetze die bilinear hochskalierte 1-px-pro-Zelle-Textur. Erzeuge Chunk-Texturen mit **4 px pro Zelle** (Qualität Hoch), 3 px (Mittel) oder 2 px (Niedrig).
- Pro Pixel: Staubwert bilinear aus den Zellen sampeln, mit einem festen, kleinen Rauschmuster leicht verzerren (±0,35 Zellen), dann über eine steile `smoothstep`-Kurve zwischen „sauber“ und „staubig“ mischen. Ergebnis: eine scharfe, aber leicht zerfranste Kante wie echter Staub, ohne Treppenstufen.
- Das Rauschmuster hängt nur von Welt-Koordinaten ab (eigene Hash-Funktion, nicht der Logik-RNG), damit die Kante beim Neu-Rendern stabil bleibt.
- Aktualisiere bei Änderungen weiter nur den betroffenen Teilbereich des Chunks (Dirty-Rect), nicht den ganzen Chunk.

### Sauberer Boden: Felsuntergrund mit Glanz

- Zeige unter dem Staub einen detailreichen Mondfels: eine vorab generierte, kachelbare Textur (512 × 512 px) mit Mikrokratern, feinen Rissen, kleinen Kieseln und leichten Helligkeitsflecken. Pro Chunk wird sie versetzt und gespiegelt, damit kein Kachelmuster auffällt.
- Vorhandene Krater, Felsbrocken und Schluchten der Weltgenerierung bekommen Licht: Kraterrand oben links hell, Kraterinneres mit weichem Schatten unten rechts, Felsbrocken als facettierte Polygone mit 3 Helligkeitsstufen und Kontaktschatten. (Nur Darstellung, Positionen und Kollision bleiben.)
- **Glanzband:** Ein breiter, weicher, diagonaler Lichtstreifen wandert alle 6–8 Sekunden langsam über den sichtbaren sauberen Boden (Mischmodus `soft-light`, maskiert auf saubere Fläche). Das lässt geputzte Flächen „lebendig glänzen“.
- **Frisch-geputzt-Schimmer:** Zellen, die gerade sauber geworden sind, leuchten 1,5 Sekunden lang leicht heller und kühler und klingen dann ab. Dafür ein rein optischer Puffer (z. B. `Float32Array` nur für sichtbare Chunks), der nie gespeichert wird.

### Glanzpunkte statt „+“-Kreuzen

- Entferne die statischen weißen „+“-Kreuze komplett.
- Neu: vierstrahlige Glanzsterne mit weichem Halo (vorgerendertes Sprite), die nur auf sauberem Boden erscheinen, 500–800 ms aufblitzen und wieder verschwinden. Bevorzugt dort, wo gerade geputzt wurde. Dichte: höchstens 6 gleichzeitig auf dem Bildschirm.

### Staubarten und Regionen

- Jede Staubart bekommt eigene Farbe, Körnung und Glanzverhalten: Regolith dunkel und grob, Geröllstaub mit sichtbaren Steinchen, Eisstaub bläulich mit kaltem Funkeln, Glitzerstaub mit animierten, goldenen Funken (nur im sichtbaren Bereich), Rillen-Regolith mit leicht gestreifter Struktur.
- Regionsübergänge werden weich gemischt, keine harten Kanten.

### Spuren und Decals

- Fußspuren der Spielfigur und Reifenspuren der Fahrzeuge werden in eine Decal-Ebene pro Chunk gestempelt, aber **nur auf Staub sichtbar** (maskiert). Beim Putzen verschwinden sie mit.
- Beim Putzen bleiben auf dem frischen Boden kurz hellere **Wischstreifen** in Bewegungsrichtung sichtbar (0,8 s Ausblenden).
- Decals sind rein optisch und werden nicht gespeichert. Pro Chunk höchstens 400 Abdrücke, älteste werden zuerst entfernt.

### Atmosphäre

- Dezente Vignette (Rand 18 % dunkler), auf Handy etwas schwächer.
- Schwebende Staubpartikel in der Luft mit leichter Parallaxe zur Kamera (sehr sparsam, 20–40 Stück).
- Leichte Farbkorrektur: Staubflächen minimal wärmer, saubere Flächen minimal kühler, damit der Kontrast auch farblich lesbar ist.
- Kamera-Zoom und -Folgen gleiten weich (nur Darstellung). Beim Herauszoomen nimmt der Detailgrad ab (keine Decals, keine Glanzsterne).

## 5. Putz-VFX: das wichtigste Feedback im Spiel

Putzen ist die Handlung, die der Spieler tausendfach macht. Sie muss sich nach den ersten zwei Sekunden „saftig“ anfühlen: sichtbares Werkzeug, sichtbare Bewegung, Staub, der weggesaugt wird, und Boden, der aufleuchtet. Alle Effekte reagieren nur auf das, was die Logik ohnehin tut (Event `cleaned` mit Position, entfernter Menge und Staubart).

### Ablauf eines Putz-Moments

1. **Werkzeug bewegt sich:** Sobald Putzen aktiv ist, wischt das Werkzeug sichtbar hin und her (Bogen von ±25°, etwa 7 Wischer pro Sekunde, leicht unregelmäßig).
2. **Staub löst sich:** An der Vorderkante des Werkzeugs, genau wo Staub entfernt wurde, entstehen weiche, runde Staubwölkchen in der Farbe der Staubart.
3. **Staub wird eingesaugt:** Die Wölkchen fliegen erst kurz nach außen (niedrige Schwerkraft, langsames Ausrollen), dann auf einer gekrümmten Bahn zum Behälter auf dem Rücken der Figur. Dort werden sie kleiner und verschwinden.
4. **Boden leuchtet auf:** Die frisch saubere Fläche zeigt Wischstreifen und den Frisch-geputzt-Schimmer (Abschnitt 4). Kippt eine Zelle unter die Sauber-Schwelle, blitzt an dieser Stelle gelegentlich ein kleiner Glanzstern auf.
5. **Behälter reagiert:** Bei jedem vollen Kilogramm pulsiert der Rückentank der Figur kurz und die Behälteranzeige im HUD tickt sichtbar nach oben.

### Partikel-Regeln

- **Keine eckigen Pixel-Quadrate mehr.** Nur weiche, runde Sprites (vorgerenderte radiale Verläufe in 3 Größen) und Rauchwölkchen mit unregelmäßigem Rand.
- Menge proportional zur entfernten Staubmenge pro Frame, aber gedeckelt (z. B. höchstens 12 neue Partikel pro Frame am iPad).
- Partikel haben Lebensdauer 0,4–0,9 s, Größe 3–9 px, verlieren Deckkraft und Größe am Ende, leichte zufällige Drehung.
- Große Staubdichte erzeugt mehr und dunklere Partikel, dünner Staub nur feinen, hellen Hauch. So sieht man auch an den Partikeln, wie viel man wegputzt.

### Eigene Optik pro Werkzeug

| Werkzeug | Aussehen | Bewegung | Besondere Effekte |
| --- | --- | --- | --- |
| Zahnbürste | winzig, weiß-türkiser Griff, weiße Borsten | schnelles, hektisches Schrubben | feiner Staubhauch, ab und zu ein winziger Schaumtropfen (Gag) |
| Handbürste | Holzrücken, dunkle Borsten | kurze Wischer | kleine Staubfahne seitlich |
| Besen | langer Stiel, breiter Borstenfächer | weite Bögen | Staubwelle schiebt sich vor dem Besen her |
| Schrubbmopp | runder Moppkopf mit Fransen | kreisende Bewegung | nasser Glanz-Schimmer auf dem Boden, der langsam trocknet |
| Saug-Rucksack | Schlauch vom Rücken zur Düse | Düse pendelt | Staub strömt als sichtbarer Strudel in die Düse, Schlauch vibriert |
| Industrie-Sauglanze | lange Lanze mit breiter Düse | ruhiges Pendeln | starker Sog-Kegel mit Strömungslinien, Tank brummt sichtbar |
| Plasma-Fegestrahl | futuristisches Gerät mit Leuchtspule | Strahl fächert hin und her | blau-weißer, additiver Strahl, Staub verdampft zu Funken, kurze Hitzeflimmer-Kante |

### Behälter voll

- Der Rücken-Tank der Figur blinkt in `warn`, kleine Sprechblase „Voll!“ über der Figur für 1,5 s.
- Das Werkzeug wischt weiter, aber es entstehen keine Saug-Partikel mehr, stattdessen rieselt Staub sichtbar vom vollen Tank herunter. So versteht der Spieler sofort, warum nichts mehr passiert.
- Am Bildschirmrand erscheint ein Pfeil zum nächsten Depot mit Entfernung.

### Intensität

- Nach etwa 2 Sekunden ununterbrochenem Putzen steigt die optische Intensität leicht (mehr Glanz auf dem Boden, etwas mehr Partikel), nach dem Loslassen klingt sie ab. Rein optisch, ohne Einfluss auf Werte.
- Kein Kamera-Wackeln beim normalen Putzen.

## 6. Spielfigur, Fahrzeuge, Roboter, Gebäude

Alle Objekte bekommen dieselbe Lichtlogik (Sonne oben links), weiche Kontaktschatten statt harter, versetzter Rechtecke und eine dunkle 2-px-Outline (`#1A1F29` bei 70 %), damit sie auf hellem, sauberem Boden klar lesbar sind. **Hitboxen, Kollision und Bewegungswerte bleiben unverändert**, auch wenn ein Sprite optisch größer wird.

### Spielfigur (Astronaut)

- Optisch etwa 1,3-mal so groß wie jetzt (Hitbox gleich). Draufsicht: runder Helm mit großem, spiegelndem Visier (Farbverlauf von Petrol zu Weiß mit wanderndem Lichtreflex), oranger Anzug, zwei Arme, die das Werkzeug halten, Rücken-Tank.
- **Der Rücken-Tank hat ein Sichtfenster**, in dem man den Füllstand des Behälters in Staubfarbe sieht. Das ist eine zweite, diegetische Füllstandsanzeige direkt am Spieler.
- **Laufen mit Mondschwerkraft:** sanftes Hüpfen (2 Hz), leichtes Strecken beim Absprung und Stauchen bei der Landung, Schatten-Ellipse wird kleiner, wenn die Figur oben ist. Bei jeder Landung auf Staub ein kleines Staubwölkchen und ein Fußabdruck.
- Drehungen gleiten weich zur neuen Richtung (etwa 120 ms), keine Sprünge. Die Logik-Richtung bleibt unverändert, nur die Darstellung interpoliert.
- Leerlauf: Figur atmet leicht, schaut nach 4 Sekunden Stillstand kurz nach links und rechts.
- Kauf eines Werkzeugs: kurzes Aufblitzen und Wechsel-Animation des Werkzeugs in der Hand.

### Fahrzeuge

- Draufsicht mit sichtbaren Rädern oder Ketten, die sich passend zum Tempo drehen, leichtes Federn der Karosserie und Neigen in Kurven.
- **Rotierende Bürstenwalzen** an der Front mit Staubfontaine nach vorne-seitlich, Bremsspuren und Drift-Streifen im Staub, Reifenspuren als Decals.
- Scheinwerfer als weiche Lichtkegel (nachts kräftig, tags kaum sichtbar), Rücklichter, ein Rundumlicht in ALOP-Orange auf größeren Fahrzeugen.
- Schwebekehrer: Schwebe-Glow unter dem Fahrzeug, Hitzeflimmern, Schatten weiter versetzt (höher).
- Ein- und Aussteigen: Figur springt mit kurzem Bogen ins Fahrzeug, Tür-Klappen-Animation, Fahrzeug federt einmal ein.
- Herbeirufen: Fahrzeug landet mit kleinem Lieferfallschirm oder Landeschub und Staubring.

### K.E.H.R.-Bots und Drohnen

- Kleine, freundliche Roboter mit einem leuchtenden „Auge“, das blinzelt, Antenne mit Statuslicht und rotierender Putzbürste unten.
- Statusfarben, sofort lesbar: arbeitet = `success` mit ruhigem Puls, wartet/voll = `warn`, außerhalb des Funknetzes = `danger` mit Blinken und Funk-Störsymbol.
- Roboter hinterlassen sichtbare, ordentliche Putzbahnen und verteilen beim Abladen einen kleinen Staubstrom in den Trichter.
- Schwarm-Drohnen: Rotor-Unschärfe als halbtransparente Kreise, Schatten am Boden versetzt, leichtes Schweben.
- Ferne Roboter außerhalb des Bildschirms erzeugen keine Partikel.

### Gebäude und Förderbänder

- Gebäude mit Dachfläche, Lichtkante oben links, weichem Schatten, ALOP-Beschriftung, kleinen blinkenden Statuslichtern und angedeuteten Maschinenteilen.
- Maschinen (Verdichter, Ziegelpresse, Glasofen) mit sichtbarer Arbeit: Kolben, die sich bewegen, Dampf- oder Hitzewölkchen, Leuchtfenster, dessen Farbe das Produkt zeigt. Status-Icons als runde Badges über dem Gebäude (arbeitet, wartet, blockiert).
- **Förderbänder:** laufende Bandstruktur (scrollende Rillen), Pakete als kleine, gefüllte Kisten oder Säcke in Produktfarbe, die beim Fahren leicht wippen. Bei Rückstau stehen sie sichtbar still und das Band leuchtet am Engpass in `warn`.
- Antennen: alle 3 Sekunden ein Funkwellen-Ring. Beim Bauen wird die Funkabdeckung als weiche Fläche mit gestricheltem Rand angezeigt.
- **Bau-Vorschau:** Hologramm-Stil (halbtransparent, Scanlinien, leichtes Flimmern). Gültig = petrolfarbener Umriss, ungültig = `danger` mit kurzem Wackeln und dem Grund als Label.
- **Platzieren:** Gebäude fällt mit kleiner Federung ein, Staubring am Boden, kurzes Einrasten-Leuchten.
- **Abreißen:** Gebäude zerfällt in Teile und Partikel, die Erstattung fliegt als Münzen zum Kontostand.
- **Verschieben/Drehen:** Gebäude hebt sich mit Schatten an, dreht sich mit kurzer Animation (150 ms).

## 7. Abladen und Kapselstart als Spektakel

Abladen und Verkaufen sind der Zahltag des Spiels. Im Video ist beides ein weißer Fleck von einer Sekunde (8,5–10 s). Neu werden daraus zwei kurze, klar lesbare Momente. **Die Logik bucht weiterhin sofort und genau wie bisher.** Die Effekte laufen hinterher, blockieren keine Eingabe und ändern kein Timing.

### Erst verstehen, dann zeigen

Lies im Code nach, was beim Abladen tatsächlich passiert (Staub geht in die Kapsel, wird gepuffert oder sofort verkauft). Die Darstellung muss diesen echten Ablauf zeigen. Im Video bleibt „Kapsel 0/200 kg“ stehen, obwohl Geld kommt. Das ist für den Spieler unverständlich. Löse das rein optisch, z. B. mit einer kurzen Anzeige „2,2 kg → verkauft · +3 ₥“ oder einer sichtbar steigenden und wieder fallenden Füllanzeige, je nachdem, was die Logik wirklich tut.

### Abladen (ca. 0,6–1,2 s, je nach Menge)

1. Der Trichter des Depots öffnet sich mit kurzer Klappen-Animation und leuchtet petrol auf.
2. Vom Rücken-Tank der Figur fließt ein **Staubstrom** als gebogenes Partikelband in den Trichter, das Tank-Sichtfenster leert sich gleichzeitig.
3. Am Depot steigt ein runder Füllring (statt des Textlabels) sichtbar an, mit einem kurzen „Klick“-Puls pro 10 kg.
4. Popup „+2,2 kg“ steigt aus dem Trichter auf (ein Popup, nicht überlagert).
5. Der weiße Wolken-Fleck aus der aktuellen Version entfällt komplett.

### Kapselstart (ca. 2,5 s, überspringt nichts in der Logik)

1. **Vorbereitung (0–0,6 s):** Das Startfeld leuchtet auf, die gelb gestrichelte Markierung beginnt zu rotieren, zwei Warnlichter blinken, Kapsel fährt aus der Luke hoch.
2. **Zündung (0,6–1,0 s):** Kurzer, heller Zündblitz (additiv, nicht bildschirmfüllend), Flammenkegel unter der Kapsel, ein **Rauch- und Staubring breitet sich am Boden aus** und schiebt sichtbar Staubpartikel nach außen. Optionaler Kamera-Impuls von 4 px für 200 ms (abschaltbar).
3. **Aufstieg (1,0–2,0 s):** Die Kapsel steigt mit Beschleunigung, wird dabei erst größer (sie kommt der Kamera näher) und zieht eine Rauchspur mit Flammen-Glut. Dann wird sie kleiner und fliegt Richtung oberer Bildschirmrand.
4. **Auszahlung (2,0–2,5 s):** Am Bildschirmrand ein kleiner Lichtpunkt, von dort fliegen Münzen in einem Bogen zum Kontostand. Der Kontostand zählt hoch und leuchtet golden.
5. Rauchreste bleiben noch 3 Sekunden am Boden und verwehen.

### Viele Starts hintereinander

Im späteren Spiel starten Kapseln häufig (Kapselrampen, Roboter). Damit es nicht nervt und Leistung frisst:

- Startet mehr als eine Kapsel innerhalb von 3 Sekunden, nutze eine Kurzversion (0,8 s, kein Kamera-Impuls, halbe Partikelzahl).
- Kapselstarts außerhalb des Bildschirms erzeugen nur das Münz-Feedback am HUD, keine Welt-Effekte.
- Auszahlungen innerhalb von 300 ms werden zu einem Popup zusammengefasst.

## 8. Belohnungs-VFX: jedes Ereignis bekommt ein Gewicht

Nicht jeder Erfolg braucht ein Feuerwerk. Teile Ereignisse in drei Stufen ein, damit große Momente groß bleiben.

| Stufe | Ereignisse | Dauer | Maßnahmen |
| --- | --- | --- | --- |
| Klein | Geld durch Verkauf, Kilogramm abgeladen, Auftrag-Fortschritt | 0,3–0,6 s | Popup, Zähler-Animation, kleiner Puls |
| Mittel | Kauf, Werkzeug ausgerüstet, Auftrag erledigt, Forschung abgeschlossen, Fundstück, Fahrzeug gekauft | 0,8–1,5 s | Stempel- oder Aufleucht-Animation, Funken, Toast |
| Groß | Sektor abgeschlossen, Lizenz-Beförderung, Endziel erreicht | 1,5–4 s | Welt-Effekt über große Fläche, Banner oder Sequenz, überspringbar |

### Geld

- Der Kontostand zählt in 400 ms hoch (ease-out), statt zu springen. Bei großen Beträgen kurzes goldenes Aufleuchten der Geld-Karte.
- Schwebende „+₥“-Zahlen fliegen in einem Bogen von der Quelle in der Welt zum Kontostand und verschmelzen dort. Größe und Farbe nach Betrag: klein weiß, mittel gold, groß gold mit Funken.
- Popups innerhalb von 300 ms an derselben Stelle werden zusammengefasst. Nie mehr als 4 Popups gleichzeitig sichtbar.
- **Wichtig:** Die angezeigte Zahl darf optisch hinterherlaufen. Kauf-Buttons, „Es fehlen X ₥“ und alle Prüfungen nutzen immer den echten Logik-Wert.
- Sobald ein neues Upgrade bezahlbar wird, bekommt der zugehörige Button (Terminal, Forschung) einen kleinen, pulsierenden Punkt. Keine Popups dafür.

### Kauf

- Die Kaufkarte bekommt einen ALOP-Stempel „GENEHMIGT“, der mit kurzer Stauchung aufschlägt, plus ein paar orange-goldene Funken.
- Das gekaufte Item fliegt als Icon zum passenden Ort im HUD (Werkzeug zur Werkzeug-Anzeige, Fahrzeug zum Fahrzeug-Slot).
- Upgrade-Stufen: Das nächste Segment der Stufen-Anzeige füllt sich mit Licht-Wisch-Effekt.

### Sektor abgeschlossen (groß)

1. Eine Lichtwelle breitet sich vom Spieler kreisförmig über den ganzen sichtbaren Teil des Sektors aus, der saubere Boden glänzt dabei hell auf (1,2 s).
2. Die Sektorgrenze leuchtet kurz als dünne, petrolfarbene Linie.
3. In der Bildschirmmitte schlägt ein großer ALOP-Stempel „SEKTOR GEREINIGT“ mit Sektorname auf, mit Staubwolke beim Aufprall.
4. Darunter die Belohnung als kurze Zeile, die Zahlen fliegen ins HUD.
5. Der Sektor-Chip oben schließt seinen Ring mit Leuchtringen. Auf Minimap und Karte färbt sich das Feld mit einer kleinen Kipp-Animation um.

### Lizenz-Beförderung (groß, Sequenz)

- Die Welt dunkelt auf 40 % ab. Eine Urkunde mit ALOP-Siegel rollt sich auf, der neue Titel wird in großen Buchstaben eingeblendet, ein Siegel-Stempel schlägt auf, goldene Partikel rieseln.
- Darunter erscheinen nacheinander (Abstand 150 ms) die freigeschalteten Dinge als Icons: Region, Gebäude, Roboter.
- Etwa 3,5 Sekunden, mit einem Tippen überspringbar. Das Spiel läuft im Hintergrund weiter.

### Weitere Ereignisse

- **Forschung abgeschlossen:** Der Knoten leuchtet auf, ein Energiepuls läuft entlang der Verbindungslinien zu den neu verfügbaren Knoten, die dann aufleuchten.
- **Auftrag erledigt:** Das Memo bekommt den Stempel „ERLEDIGT“, fliegt leicht gedreht aus dem Bild, das neue Memo rutscht von unten nach.
- **Fundstück freigelegt:** Lichtstrahl schießt aus dem Boden, das Objekt steigt drehend auf, Glanzstern, Toast mit dem witzigen Text, das Objekt fliegt dann ins Album-Icon.
- **Meteoritenschauer:** Leuchtende Streifen kreuzen den Bildschirm, Einschläge mit kurzem Aufblitzen, Ring aus aufgewirbeltem Staub, und die Meteorstaub-Haufen glühen leicht nach, damit man sie findet.
- **Sonnenwind:** Warmes, wellenförmiges Schimmern am Bildschirmrand, Roboter ziehen leuchtende Spuren, Funkspruch-Toast mit Countdown-Ring.
- **ALOP-Inspektion:** Inspektor-Rover mit blinkendem Rundumlicht, der Zielsektor wird gestrichelt umrandet, ein Countdown-Ring zeigt die verbleibende Zeit.
- **Tag und Nacht:** Weicher Übergang mit Dämmerungsfarbe (warmes Orange, dann tiefes Blau), Scheinwerfer und Gebäudelichter gehen sichtbar an. Saubere Flächen reflektieren nachts das Licht der Lampen stärker als Staub.

## 9. VFX-Technik, Qualitätsstufen und Performance

Alle Effekte zusammen dürfen am iPad (9. Generation) und an einem iPhone 12 höchstens **4 ms pro Frame** kosten. Das Spiel muss weiter mit stabilen 60 FPS laufen. Wenn ein Effekt das Budget sprengt, wird er auf niedrigeren Stufen vereinfacht, nicht die Framerate geopfert.

### Partikelsystem

- Ein zentrales System mit festen Speicherblöcken (Struct-of-Arrays mit `Float32Array` für Position, Geschwindigkeit, Lebenszeit, Größe, Drehung, Farbindex). Keine Objekt-Erzeugung pro Partikel im Spiel-Loop.
- Emitter werden deklarativ in `FX_CONFIG` beschrieben (Rate, Lebenszeit, Größe, Farbe, Schwerkraft, Ziel-Anziehung, Mischmodus).
- Alle Partikel-Formen (weiche Kreise, Rauch, Glanzsterne, Funken, Münzen) werden beim Start einmal in einen **Sprite-Atlas** auf einem Offscreen-Canvas vorgerendert und dann per `drawImage` gezeichnet. Kein `arc()` und kein Farbverlauf pro Partikel pro Frame.
- Additive Effekte (`globalCompositeOperation = 'lighter'`) werden gesammelt in einem Durchgang gezeichnet, nicht abwechselnd mit normalen.
- Leuchten und „Bloom“ entstehen nur durch vorab weichgezeichnete Halo-Sprites. **Kein `ctx.filter`** (in Safari unzuverlässig und langsam), kein `shadowBlur` im Spiel-Loop.
- Partikel außerhalb des sichtbaren Bereichs werden weder erzeugt noch simuliert.
- Eigener Zufallsgenerator nur für Effekte, getrennt von der Logik.

### Qualitätsstufen

| Einstellung | Niedrig | Mittel | Hoch | Ultra (nur Desktop) |
| --- | --- | --- | --- | --- |
| Max. Partikel | 150 | 400 | 1.000 | 2.000 |
| Chunk-Textur | 2 px/Zelle | 3 px/Zelle | 4 px/Zelle | 4 px/Zelle |
| Höhen-Shading Staub | einfach | voll | voll | voll |
| Glanzband und Schimmer | aus | an | an | an |
| Decals (Spuren) | aus | Fußspuren | alle | alle |
| Weiche Schatten | einfache Ellipse | weich | weich | weich |
| Luftstaub und Vignette | aus | an | an | an |

- „Automatisch“ (Standard) startet auf Mittel am Handy, Hoch am iPad und Desktop, und regelt anhand der gemessenen Frame-Zeit nach (bestehende dynamische Auflösung bleibt aktiv, wird aber erst nach der Effekt-Stufe gesenkt).
- Rein optische Zwischenspeicher (Frisch-geputzt-Schimmer, Decals, Partikel) werden nie gespeichert und beim Laden leer begonnen.

### Komfort und Barrierefreiheit

- Neue Einstellungen: **Effektstärke** (0–100 %), **Kamera-Impulse** an/aus, **Lichtblitze** an/aus, **Bewegung reduzieren**. Die Systemeinstellung `prefers-reduced-motion` wird als Standard übernommen.
- Bei „Bewegung reduzieren“: keine Kamera-Impulse, keine großen Lichtwellen, Sequenzen werden zu kurzen Einblendungen, Partikel halbiert.
- Nie mehr als 3 helle Lichtblitze pro Sekunde, keine bildschirmfüllenden weißen Blitze.
- Wichtige Zustände nie nur über Farbe: zusätzlich Icon oder Text (z. B. Roboter-Status, Bau ungültig).

### Debug

- Das Debug-Overlay zeigt zusätzlich: Effekt-Zeit pro Frame in ms, aktive Partikel, aktuelle Effekt-Stufe, Anzahl Decals.
- Ein Effekt-Testmenü (nur im Debug-Modus) löst jeden großen Effekt auf Knopfdruck aus (Sektor, Lizenz, Kapsel, Meteoritenschauer), ohne Spielwerte zu verändern.

## 10. HUD neu gedacht

Das HUD zeigt dieselben Informationen wie jetzt, aber mit klarer Rangfolge: **1. Behälter und Putzen, 2. Geld, 3. nächstes Ziel, 4. Sektor, 5. Navigation.** Alles andere gehört in Menüs. Die Grundanordnung aus dem Video bleibt, wird aber aufgeräumt.

### Einheitliche HUD-Karten

- Alle Karten: `ui.surface` mit 88 % Deckkraft, 1 px `ui.border`, Radius 14 px, weicher Schatten nach unten (keine harten Kanten), Innenabstand 10–12 px.
- Ein durchgängiges Icon-Set als Inline-SVG (24-px-Raster, 2 px Strichstärke, runde Enden). **Keine Emojis** mehr (die Klemmbretter im Ziele-Panel fliegen raus). Jedes Werkzeug und jedes Fahrzeug hat ein eigenes Icon, nicht mehr überall derselbe Hammer.
- Welt-Labels (z. B. über dem Depot) bekommen eine Kollisionsprüfung mit den HUD-Bereichen. Liegt ein Label unter einer HUD-Karte, wird es ausgeblendet oder an den Rand der freien Fläche verschoben (Problem bei 3–7 s im Video).

### Die einzelnen Elemente

| Element | Jetzt (Video) | Neu |
| --- | --- | --- |
| Geld | „13 ₥“, darunter Rate und Erdnachfrage in einer Karte | Große Zahl (28 px, Fett 800, Tabellenziffern) mit goldenem ₥-Icon. Darunter „+30 ₥/Min.“ mit kleiner Mini-Kurve der letzten 5 Minuten. Erdnachfrage als eigener Chip mit Farbfleck der Staubart und kleinem Countdown-Ring statt „15:54“ als Text. |
| Ziele | 5 Zeilen, abgeschnittener Text, winzige Balken, Emojis | Standardmäßig **eine** Karte „Nächstes Ziel“ mit Icon, vollständigem Text (darf umbrechen), Balken mit Zahlen („4 / 50 ₥“). Antippen klappt die weiteren Ziele aus. Antippen eines Ziels öffnet das passende Menü oder setzt einen Wegpunkt (vorhandene Funktion). |
| Sektor | grauer Chip, Ring kaum sichtbar | Deutlicher Fortschrittsring (40 px) mit Prozentzahl in der Mitte, Markierungen bei 25, 50, 75 und 98 %. Der Ring färbt sich von Staubfarbe zu Petrol, je weiter der Sektor ist. Beim Sektorwechsel kurze Einblendung des Namens. |
| Minimap | grobe Treppenstufen, Mauszeiger als Spieler | Weich gerendert aus den Chunk-Zusammenfassungen, gleiche Farben wie die Welt (Staub warm, sauber kühl hell). Spieler als oranger Pfeil mit Sichtkegel. Depots, Fahrzeuge, Roboter als kleine Icons. Außenring mit Himmelsrichtungs-Strichen. iPad 168 px, Handy 112 px. |
| Behälter | dünner Balken mit Werkzeugname | Größere Karte unten mittig: Werkzeug-Icon, Name, Balken mit Staub-„Füllung“ in Staubfarbe und leichter Welle, „2,2 / 20 kg“. Ab 90 % pulsiert der Rand in `warn`, bei voll Text „Voll – zum Depot“. |
| Mondglanz-Index | kleine Pille unten links | Kleines Mond-Icon, das sich mit dem Fortschritt füllt, plus Zahl. Antippen öffnet die Statistik. Liegt nicht mehr unter dem Joystick. |
| Richtungsanzeiger | nicht vorhanden | Pfeil am Bildschirmrand zum Depot (bei vollem Behälter), zu Wegpunkten und zu Fundstück-Hinweisen, mit Entfernung. |
| Toasts | nicht sichtbar | Einheitliche Meldungen oben mittig, höchstens 2 gleichzeitig, gleiche Meldungen werden zusammengefasst („×3“). |

### Anordnung nach Gerät

| Bereich | iPad hoch | iPad quer und Desktop | Handy hoch | Handy quer |
| --- | --- | --- | --- | --- |
| Oben links | Geld, darunter nächstes Ziel | Geld, darunter nächstes Ziel | Geld und Ziel in einer kompakten Karte | Geld und Ziel kompakt |
| Oben Mitte | Sektor-Ring | Sektor-Ring | Sektor-Ring klein | Sektor-Ring klein |
| Oben rechts | Minimap, darunter Icon-Leiste | Minimap, daneben Icon-Leiste | Minimap klein, Icon-Leiste als Reihe darunter | Minimap klein |
| Unten Mitte | Behälter-Karte | Behälter-Karte | Behälter-Karte schmal | Behälter-Karte schmal |
| Unten links | Joystick-Zone | Joystick-Zone (nur Touch) | Joystick-Zone | Joystick-Zone |
| Unten rechts | Putzen, darüber Kontext-Buttons | Putzen und Kontext-Buttons | Putzen, darüber Kontext-Buttons | Putzen, Kontext-Buttons, Icon-Leiste vertikal |

Im Hochformat am Handy wird der freie Bildbereich in der Mitte bewusst groß gehalten: HUD-Karten dürfen zusammen höchstens 30 % der Fläche belegen.

## 11. Menüs und Panels

Inhalte, Preise und Kaufregeln der Menüs bleiben gleich. Neu sind Präsentation, Lesbarkeit und Gefühl. Leitsatz: **Das, was der Spieler jetzt tun kann, ist das Hellste auf dem Panel.**

### Panels allgemein

- Einfahren von rechts in 260 ms mit leichtem Nachfedern, die Welt dahinter dunkelt auf 60 % ab (einfache Farbschicht, kein Weichzeichner). Das Spiel läuft weiter wie bisher.
- Schließen per X (mindestens 44 × 44 pt), Tippen auf die abgedunkelte Welt, Wischen nach rechts oder Esc.
- Kopfzeile: großes Icon, Titel, Untertitel, rechts der aktuelle Kontostand (damit man beim Kaufen nicht nach links schauen muss).
- Breite: iPad hoch 58 %, iPad quer 440 px, Desktop 460 px, Handy als Bottom-Sheet mit 88 % Höhe und Griff zum Herunterziehen.

### Tabs (Terminal)

- Im Video ist der letzte Tab abgeschnitten („Kap“). Neu: Tabs mit Icon und kurzem Text, die immer vollständig passen. Reicht der Platz nicht, werden nur Icons gezeigt und der aktive Tab zusätzlich beschriftet.
- Aktiver Tab mit gleitendem Unterstrich (180 ms). Wischen nach links/rechts im Panel wechselt den Tab.
- Tabs mit neu bezahlbaren Einträgen bekommen einen kleinen Punkt.

### Kaufkarten

- Jede Karte hat eine **eigene Illustration** (kleines Vektorbild des Werkzeugs oder Fahrzeugs in Draufsicht, gleiche Optik wie in der Welt), keine generischen Icons.
- Werte als Vergleich: „Radius 1,0 → 1,6 Zellen“, Verbesserungen in `success` mit kleinem Pfeil. Bei Fahrzeugen kurze Balken für Tempo, Breite und Kapazität.
- Eindeutige Zustände:
  - **Kaufbar:** voller orangefarbener Button, weiße Schrift, sanfter Glanz-Wisch alle 4 s.
  - **Zu teuer:** neutraler Button mit Preis, darunter ein Fortschrittsbalken „17 von 250 ₥“ und „Es fehlen 233 ₥“ in Gelb (bleibt, war gut).
  - **Gesperrt:** Illustration entsättigt, Schloss-Icon, „Benötigt Lizenz 1“ als Chip, aber gut lesbar (mindestens 4,5:1 Kontrast).
  - **Im Besitz / Ausgerüstet:** Haken-Badge, Rahmen in Petrol, Button „Ausrüsten“ bzw. Label „Ausgerüstet“.
- Buttons mindestens 44 pt hoch, gedrückt 96 % Größe und dunkleres Orange.
- Upgrade-Linien zeigen ihre Stufen als Segmentleiste (z. B. 15 kleine Segmente), die aktuelle Stufe leuchtet.

### Kapsel-Tab

- Oben eine große Grafik der Kapsel mit Füllstand und Status („startbereit“ leuchtet grün).
- Die Preisliste als horizontale Balken in Staubfarbe pro Staubart statt reiner Tabelle. Die Staubart mit Erdnachfrage-Bonus ist hervorgehoben (Glow, Bonus-Chip, Countdown).
- „Kapsel jetzt starten“ bleibt der große orangefarbene Button.

### Lizenz-Tab

- Eine Karriereleiter mit allen 6 Lizenzen als Stufen, die aktuelle hervorgehoben, die nächste mit ihren Bedingungen als Fortschrittsbalken (Geld und Sektoren), weitere ausgegraut, aber lesbar.

### Forschung

- Ein **echter Baum**: drei Spalten (Werkzeugtechnik, Logistik, Verwaltung) mit SVG-Verbindungslinien zwischen den Knoten. Im Video fehlt der dritte Zweig und es gibt keine Linien.
- Knoten-Zustände: erforscht (gefüllt in Petrol, leuchtende Linie zum nächsten), verfügbar (oranger Rand, langsamer Puls, Kosten-Chip „1 FP“), gesperrt (gedimmt, aber mindestens 3:1 Kontrast, Schloss).
- Der Abschlussknoten jedes Zweigs ist größer und hat einen besonderen Rahmen.
- Antippen eines Knotens zeigt eine Detailkarte mit Wirkung und Button „Erforschen“ (gleiche Logik wie bisher).
- iPad: alle drei Zweige nebeneinander (Panel dafür breiter, 72 %). Handy: ein Zweig pro Ansicht mit Zweig-Tabs, Wischen wechselt.
- FP-Kontostand groß in der Kopfzeile.

### Aufträge (ALOP-Memos)

- Der Papier-Stil bleibt, wird aber lesbar: Schrift 15 px in dunkler Tinte (#2B2A26) auf Creme (#F3ECDD), Kopfzeile mit ALOP-Briefkopf, leicht schräge Stempel, Aktenlochung am Rand.
- Fortschrittsbalken dicker (8 px) mit Zahlen. Buttons „Tauschen“ und „Wegpunkt setzen“ als Stempel-Buttons, 44 pt hoch.
- Memos leicht unterschiedlich gedreht (±1°) wie ein echter Papierstapel.

### Vollkarte

- Weiches Rendering mit Welt-Farben, Sektorraster mit Beschriftung nur ab bestimmter Zoomstufe, abgeschlossene Sektoren mit dezentem Glanzmuster.
- Ebenen als Chips oben (Funknetz, Roboter, Gebäude, Fundstücke, Aufträge) mit Icon und Ein/Aus-Zustand.
- Wegpunkte fallen als Nadel mit kleinem Aufprall ein, Teleport-Plattformen leuchten und zeigen beim Antippen eine Vorschau-Karte.
- Kleine Legende unten.

### Hauptmenü und Einstellungen

- Hauptmenü: animierter Mond mit Parallax-Sternen und aufgehender Erde, Logo „Staubmond“ mit Staub, der beim Öffnen von den Buchstaben weggeweht wird. Speicherplätze als Karten mit kleiner Minimap-Vorschau des Spielstands.
- Einstellungen in Gruppen (Grafik, Effekte, Steuerung, Ton, Speicher), jede Grafik- und Effekt-Option mit kurzer Live-Vorschau.

## 12. Touch-UX für iPad und Handy, Hinweise am Desktop

Die Steuerung reagiert gleich wie bisher (gleiche Aktionen, gleiche Belegung, gleiche Ansprechzeit). Verändert werden Aussehen, Größe, Platzierung und Rückmeldung der Bedienelemente.

### Vollbild statt Browser-Leisten

- Im Video belegen die Safari-Leisten rund 16 % der Höhe. Biete beim ersten Start am Touch-Gerät eine kleine, einmalige Karte an: „Für Vollbild zum Home-Bildschirm hinzufügen“ mit kurzer Anleitung (Teilen-Symbol → Zum Home-Bildschirm), abweisbar.
- Ergänze die nötigen Meta-Tags und ein eingebettetes Web-App-Manifest (als Data-URL) für den Start im Vollbild: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` = `black-translucent`, `display: fullscreen`, eigenes App-Icon als prozedural erzeugtes Bild.
- Wo die Fullscreen-API verfügbar ist (auch `webkitRequestFullscreen`), zusätzlich ein Vollbild-Button im Menü.

### Tastatur-Hinweise nur, wenn es eine Tastatur gibt

- Im Touch-Profil werden **alle Tasten-Kürzel ausgeblendet** (im Video sichtbar: „M“, „B“, „J“, „K“, „Esc“ unter den Icons und im Ziele-Panel).
- Sobald eine echte Tastatureingabe erkannt wird (z. B. iPad mit Magic Keyboard), erscheinen die Kürzel dezent. Am Desktop zeigen Tooltips beim Überfahren Name und Taste.

### Joystick

- Der Knopf bleibt **immer innerhalb des Rings** (im Video ragt er bei 3–5 s hinaus). Größe und Totzone bleiben wie bisher.
- Ring dunkel halbtransparent mit hellem 2-px-Rand, damit er auf hellem, sauberem Boden sichtbar ist. Knopf hell mit Schatten. Ein kleiner Bogen am Ring zeigt die aktuelle Richtung.
- Erscheint mit 120 ms Einblendung dort, wo der Daumen aufsetzt, und blendet 300 ms nach dem Loslassen aus. Im Ruhezustand ein sehr dezenter Hinweis-Kreis in der Joystick-Zone (nur in den ersten Minuten).

### Putzen-Button und Kontext-Buttons

- Putzen: 96 pt am iPad, 84 pt am Handy. Eigenes Icon passend zum ausgerüsteten Werkzeug. Gedrückt: 92 % Größe, Farbe wechselt zu Orange (bleibt, war gut), zusätzlich ein rotierender, gestrichelter Außenring und kleine Staubpartikel, die um den Button kreisen.
- Bei vollem Behälter wird der Putzen-Button gedimmt mit kleinem „Voll“-Badge.
- Kontext-Buttons (Abladen, Terminal, Einsteigen) springen mit Feder-Animation (Skalierung 0,6 → 1,06 → 1, 240 ms) ein und gleiten beim Verschwinden weg. Der wichtigste Kontext-Button (z. B. Abladen bei vollem Behälter) ist größer und hat einen pulsierenden Ring.
- Jeder Kontext-Button hat Icon und Text, Mindesthöhe 48 pt, Abstand untereinander mindestens 10 pt.

### Icon-Leiste

- Die fünf Icons plus Menü (im Video etwa 33 pt) werden auf mindestens **48 × 48 pt** vergrößert, mit kurzer Beschriftung unter jedem Icon (Karte, Bauen, Forschung, Aufträge, Album) in 11 px.
- Badges (z. B. „3“ an der Forschung) bleiben, werden aber größer und bekommen einen kleinen Einblende-Sprung, wenn sich die Zahl ändert.

### Allgemeine Touch-Regeln

- Alle tippbaren Elemente mindestens 44 × 44 pt, Abstände mindestens 8 pt.
- Jede Berührung bekommt sofortige Rückmeldung (unter 50 ms): Skalierung oder Aufhellen.
- Haptik, wo das Gerät sie unterstützt (`navigator.vibrate`, z. B. Android): kurze Impulse bei Kauf, Abladen und Sektor-Abschluss, abschaltbar. Nicht beim Dauer-Putzen.
- Safe Areas (`env(safe-area-inset-*)`) für alle Ecken-Elemente, Linkshänder-Modus spiegelt auch die neuen Elemente.

### Desktop

- Hover-Zustände für alle Buttons und Karten (leichtes Anheben, hellerer Rand), Cursor-Wechsel über Interaktivem.
- Im Baumodus ein eigener Cursor (Fadenkreuz in Petrol).
- Sichtbarer Fokus-Rahmen für Tastatur-Navigation in Menüs (Tab, Enter, Esc).

## 13. UI-Motion-System

Alle UI-Animationen nutzen dieselben Dauern und Kurven aus `THEME.motion`, damit sich das Spiel wie aus einem Guss anfühlt. Animiert werden nur `transform` und `opacity` (keine Layout-Eigenschaften), damit nichts ruckelt.

| Token | Dauer | Kurve | Einsatz |
| --- | --- | --- | --- |
| `instant` | 80 ms | linear | Druck-Feedback auf Buttons |
| `fast` | 140 ms | `cubic-bezier(.2,.8,.2,1)` | Hover, Tab-Unterstrich, kleine Einblendungen |
| `base` | 240 ms | `cubic-bezier(.2,.8,.2,1)` | Panels, Karten, Toasts |
| `spring` | 260 ms | Überschwinger auf 1,06, dann 1,0 | Kontext-Buttons, Badges, Stempel |
| `slow` | 420 ms | `cubic-bezier(.16,1,.3,1)` | Zähler, Fortschrittsbalken, Ringe |
| `celebrate` | 800–1.500 ms | eigene Sequenz | Sektor, Lizenz, große Effekte |

### Regeln

- Listen und Kartenstapel erscheinen gestaffelt (30 ms Abstand pro Eintrag, höchstens 8 gestaffelt, der Rest sofort).
- Fortschrittsbalken und Ringe füllen sich immer animiert, nie springend. Bei großen Sprüngen bleibt eine kurze, hellere „Gewinn-Spur“ am Balken stehen und läuft dann nach.
- Button-Zustände einheitlich: normal, Hover (nur Desktop), gedrückt, deaktiviert, Fokus. Deaktiviert heißt gedimmt, aber weiter lesbar.
- Zahlen, die sich ändern, bekommen einen kurzen Farbblitz (grün bei Zuwachs, rot bei Abzug durch Kauf) für 300 ms.
- HUD-Updates bleiben bei höchstens 10 DOM-Aktualisierungen pro Sekunde. Flüssige Zähler laufen über `requestAnimationFrame` auf einem einzelnen Text-Knoten.
- Bei „Bewegung reduzieren“ werden alle Dauern auf höchstens 120 ms gekürzt und Feder-Effekte entfernt.

## 14. Umsetzungsphasen und Abnahmekriterien

Arbeite die Phasen der Reihe nach ab. Nach jeder Phase prüfst du zuerst die **Logik-Prüfung** und erst dann die Phasen-Kriterien.

**Logik-Prüfung (nach jeder Phase):** `CONFIG` ist unverändert, ein Spielstand von vor dem Update lädt fehlerfrei mit identischen Werten, und ein 60-Sekunden-Testlauf (gleicher Spielstand, gleiche Route, gleiches Werkzeug) ergibt in alter und neuer Version praktisch dieselbe Staubmenge pro Sekunde, dieselben Verkaufserlöse und dieselbe Einnahmerate. Bau dir dafür bei Bedarf einen kleinen automatischen Testlauf im Debug-Modus.

1. **Fundament**
   - `THEME`, `FX_CONFIG`, Event-Bus mit `emit`-Punkten, Partikelsystem mit Sprite-Atlas, Qualitätsstufen, neue Effekt-Einstellungen, Icon-Set als Inline-SVG.
   - Abnahme: Alle alten Farben laufen über Tokens. Effekt-Zeit im Debug-Overlay sichtbar. Noch keine sichtbare Veränderung nötig.
2. **Welt-Rendering**
   - Staub als Höhenfeld, knackige Putzkante mit Staubwall, Felsuntergrund, Glanzband, Frisch-geputzt-Schimmer, Glanzsterne statt „+“, Staubarten, Spuren, Vignette.
   - Abnahme: Auf einem Standbild erkennt man sofort, wo geputzt wurde. Die Putzkante zeigt keine Treppenstufen und keine Weichzeichner-Unschärfe. 60 FPS am iPad beim Laufen über frisch geputzte und staubige Flächen.
3. **Putzen und Spielfigur**
   - Werkzeug-Optik und -Animation für alle 7 Werkzeuge, runde Saug-Partikel, Behälter-voll-Zustand, neue Spielfigur mit Tank-Sichtfenster, Laufen mit Hüpfen, weiche Drehung.
   - Abnahme: Eine Testperson versteht ohne Erklärung, dass die Figur putzt und der Staub im Tank landet. Keine eckigen Partikel mehr im Spiel.
4. **Abladen, Kapsel, Belohnungen**
   - Staubstrom ins Depot, Füllring, Kapselstart-Sequenz mit Kurzversion, Geld-Zähler und Flug-Münzen, Kauf-Stempel, Sektor-Abschluss, Lizenz-Sequenz, Forschung, Aufträge, Fundstücke.
   - Abnahme: Der Kapselstart ist klar als Zahltag erkennbar. Popups überlagern sich nicht. Große Sequenzen sind mit einem Tippen überspringbar. Die Anzeige rund um die Kapsel erklärt, was mit dem Staub passiert ist.
5. **Fahrzeuge, Roboter, Gebäude, Events, Nacht**
   - Alle Abschnitt-6-Vorgaben plus Meteoritenschauer, Sonnenwind, Inspektion, Tag/Nacht-Übergang.
   - Abnahme: 50 Roboter und 500 Bandzellen laufen mit 60 FPS am iPad auf Stufe Hoch. Roboter-Status ist ohne Antippen lesbar.
6. **HUD und Touch-UX**
   - Neue HUD-Karten, Ziele-Karte, Sektor-Ring, Minimap, Behälter-Karte, Richtungsanzeiger, Toasts, Label-Kollision, Joystick, Putzen- und Kontext-Buttons, Icon-Leiste, Vollbild-Hinweis, Tasten-Hinweise nur mit Tastatur.
   - Abnahme: Alle tippbaren Elemente mindestens 44 pt. Kein abgeschnittener Text im HUD. Keine Tasten-Kürzel im Touch-Profil. HUD belegt am Handy hoch höchstens 30 % der Fläche.
7. **Menüs**
   - Panels, Tabs, Kaufkarten mit Illustrationen, Kapsel- und Lizenz-Tab, Forschungsbaum, Memos, Vollkarte, Hauptmenü, Einstellungen.
   - Abnahme: Kein Tab abgeschnitten. Alle Texte erfüllen WCAG-AA-Kontrast (4,5:1, gesperrte Knoten mindestens 3:1). Der Forschungsbaum zeigt Verbindungslinien und alle drei Zweige.
8. **Feinschliff und Leistung**
   - Motion-Tokens überall anwenden, „Bewegung reduzieren“ testen, Effekt-Testmenü, Leistungsdurchgang auf allen Stufen.
   - Abnahme: Effekte kosten am iPad höchstens 4 ms pro Frame, stabile 60 FPS auf iPad, iPhone 12 und Desktop.

### Abschlussliste

- [ ] Kernlogik, `CONFIG`, Balancing und Speicherformat unverändert, alte Spielstände laden
- [ ] Staub hat Volumen, sauberer Boden glänzt, Putzkante ist scharf und befriedigend
- [ ] Keine eckigen Pixel-Partikel, keine statischen „+“-Kreuze, kein weißer Abladen-Fleck mehr
- [ ] Jedes Werkzeug, Fahrzeug und Gebäude hat eigene Optik und Animation
- [ ] Abladen und Kapselstart sind sichtbare, verständliche Momente
- [ ] Belohnungen sind nach Klein, Mittel und Groß gestuft
- [ ] HUD aufgeräumt, einheitliches Icon-Set, keine Emojis, kein abgeschnittener Text
- [ ] Touch: 44-pt-Ziele, Joystick sauber, keine Tasten-Hinweise ohne Tastatur, Vollbild-Hinweis
- [ ] Menüs mit klaren Zuständen, lesbarem Kontrast und echtem Forschungsbaum
- [ ] Qualitätsstufen, Effektstärke, „Bewegung reduzieren“ und 60 FPS auf allen Zielgeräten
- [ ] Liste „Vorschläge mit Logik-Bezug“ am Ende deiner Antwort, falls dir Verbesserungen eingefallen sind, die Logik berühren würden
