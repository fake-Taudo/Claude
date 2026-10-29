# Claude-Code-Prompt: Staubmond Ladebildschirm

Oct 29, 2026 · @Paul Matuszek

## So benutzt du diesen Prompt

Lege das Dokument als `LADEBILDSCHIRM_SPEC.md` neben die `index.html` und schreibe in Claude Code: „Lies LADEBILDSCHIRM\_SPEC.md und setze sie um.“ Der Prompt passt zu den anderen beiden (Spiel-Nachbau und VFX/UI-Überarbeitung): Kernlogik tabu, gleiche Farb- und Bewegungs-Tokens. Du kannst ihn vor oder nach der VFX-Überarbeitung einsetzen.

## 1. Rolle und Grenzen

Du bist ein Senior Technical Artist und Frontend-Entwickler für HTML5-Spiele. Baue für das fertige Browser-Spiel **„Staubmond“** (eine `index.html`, Mondputz-Simulation, deutsche Oberfläche) einen **aufwendigen, filmischen Ladebildschirm**. Er erscheint beim Öffnen der Seite und führt ins Hauptmenü.

**Harte Grenzen:**

- Spiellogik, `CONFIG`, Balancing, Wirtschaft, Weltgenerierung und Speicherformat bleiben unverändert. Ein bestehender Spielstand muss danach genauso laden wie vorher.
- Du änderst nur die Start-Reihenfolge so weit, dass der Ladebildschirm echten Fortschritt melden kann. Bestehende Initialisierungsschritte werden nicht umgebaut, nur in benannte Stufen gegliedert und mit einer Meldung versehen.
- Alles bleibt in **einer einzigen `index.html`**, ohne externe Dateien, Bilder oder Schriften. Grafiken sind HTML, CSS, Inline-SVG oder prozedural per Canvas. Sounds werden per Web Audio synthetisiert.
- Keine Rückfragen. Entscheide selbst und halte die Entscheidungen kurz im Kommentarblock am Dateianfang fest.
- Nutze, falls vorhanden, dieselben Tokens wie die UI-Überarbeitung (`THEME`, `THEME.motion`). Gibt es sie noch nicht, lege sie an: Farben `void #0B0E14`, `alop.orange #FF7A2F`, `alop.petrol #1F8F8C`, `money #FFC24A`, `clean.base #C7D1DC`, `dust.base #8A775E`, Text `#F4F6FA` / `#AEB8C7`.

## 2. Das Konzept: „Der Mond hat einen Termin“

Ein ruhiger, filmischer Moment im Stil des Spiels (flaches Vektordesign mit Licht): Der Spieler sieht eine **große Mondkugel** im Dunkeln, darüber geht langsam die **Erde** auf. Auf dem Mond steht ein winziger Astronaut mit Zahnbürste. Je weiter das Laden fortschreitet, desto mehr vom Mond ist **sichtbar sauber geputzt**. Der Ladebalken ist der **Mondglanz-Index** (Zahl in %, mit vier Nachkommastellen wie im Spiel), und er entspricht dem echten Fortschritt.

Am Ende startet eine **Kapsel** vom Mond, die Kamera zieht weich zurück, ein Schriftzug „Bereit“ leuchtet auf, und nach einem Tippen geht es ins Hauptmenü.

## 3. Ablauf in Phasen

1. **Sofort-Phase (0–100 ms):** Ein minimaler Ladebildschirm in reinem HTML und CSS steht ganz oben in der Datei und wird gezeichnet, bevor das große Skript geparst ist. Inhalt: dunkler Hintergrund, Mondscheibe, Logo „STAUBMOND“, dünner Balken. Kein JavaScript nötig, damit auf langsamen Geräten nie ein weißer Bildschirm erscheint.
2. **Aufbau (100–600 ms):** Das Skript übernimmt und ersetzt die einfache Szene fließend durch die volle Canvas-Szene (Überblendung, kein Sprung).
3. **Laden (echter Fortschritt):** Siehe Abschnitt 5.
4. **Fertig-Phase:** Balken bei 100 %, Putz-Finale, Kapselstart, Schriftzug „Bereit“, pulsierender Hinweis „Zum Starten tippen“.
5. **Übergang:** Nach dem Tippen faden Mond und Logo zur Hauptmenü-Szene (Mond mit Erde). Die Bewegung läuft nahtlos weiter, kein harter Schnitt.

## 4. Die Szene im Detail

**Himmel:** Drei Sternschichten mit Parallax (langsam, mittel, schnell, je 40 / 25 / 12 Sterne), leichtes Funkeln. Alle 8–12 Sekunden eine Sternschnuppe (sehr dezent). Dunkler Verlauf von `#0B0E14` nach `#141B2B`.

**Mond:** Große, leicht angeschnittene Kugel am unteren Bildrand (Radius etwa 70 % der Bildbreite), Sonnenlicht von oben links (315°), Krater mit weichem Schatten, Terminator-Schatten unten rechts, feine Körnung. Anfangs ist die Oberfläche warm-braun (Staub), geputzte Bereiche sind kühl-hell und glänzen.

**Erde:** Geht in den ersten 3 Sekunden langsam links oben auf (Position wandert 40 px nach oben, Helligkeit steigt). Blau-weiße Kugel mit weichem Halo, ganz leichte Wolkenbewegung (drehende Streifen als Sprite).

**Astronaut:** Winzig (etwa 3 % der Bildhöhe), oranger Anzug, Visier mit Lichtreflex, hüpft in niedriger Schwerkraft über den Mondhorizont und putzt mit einer übertrieben großen Zahnbürste in Zickzack-Bögen. Hinter ihm bleibt ein **heller Putzstreifen**, der den Staub entfernt. Staubpartikel (weiche runde Sprites, keine eckigen Pixel) wirbeln auf und fliegen kurz nach außen.

**Putz-Fortschritt:** Die geputzte Fläche wächst mit dem echten Ladefortschritt. Technik: Die Mondscheibe hat zwei Ebenen (Staub oben, sauberer Fels unten), und der Astronaut „radiert“ die obere Ebene über eine Maske auf einem kleinen Offscreen-Canvas weg. Rückwärts passiert nie etwas, der Fortschritt darf nur wachsen.

**Glanz:** Frisch geputzte Stellen blitzen kurz auf (kleine vierstrahlige Glanzsterne, höchstens 5 gleichzeitig). Ein weicher Lichtstreifen läuft alle 5 Sekunden über die saubere Fläche.

**Kapselfinale:** Bei 100 % fährt eine Kapsel aus einer Luke, Zündblitz (additiv, nicht bildschirmfüllend), Flammenkegel, Rauchring am Boden, Aufstieg mit Rauchspur nach oben. Die Kamera zieht dabei 8 % zurück. Dauer etwa 2,2 Sekunden.

## 5. Echter Ladefortschritt

Der Balken darf nicht lügen. Gliedere das Starten in benannte Stufen und melde nach jeder Stufe den Fortschritt:

| Stufe | Beispiel-Inhalt | Gewicht |
| --- | --- | --- |
| 1 | Seite und Skripte bereit | 5 % |
| 2 | Tabellen und Konfiguration aufbauen | 10 % |
| 3 | Sprite-Atlas und Texturen vorrendern | 25 % |
| 4 | Rauschtabellen und Weltgenerator vorbereiten | 25 % |
| 5 | Spielstand aus IndexedDB laden und prüfen | 20 % |
| 6 | Startbereich der Welt erzeugen, Oberfläche aufbauen | 15 % |

Passe die Stufen an die tatsächliche Start-Reihenfolge im Code an.

- Lange Stufen laufen **in Häppchen** (je höchstens 8 ms Arbeit, danach `requestAnimationFrame` oder `scheduler.yield`/`setTimeout`), damit die Animation flüssig bleibt. Innerhalb einer Stufe wird anteilig gemeldet.
- Angezeigter Wert = sanft nachlaufender Wert (höchstens +25 % pro Sekunde, nie zurück, nie über dem echten Wert).
- **Mindestanzeigedauer:** 1,8 Sekunden, damit der Bildschirm nicht aufblitzt. Ist alles schon nach unter 600 ms fertig (zweiter Besuch, schnelles Gerät), läuft eine **Kurzversion**: Mond springt schon halb geputzt ins Bild, Finale dauert 1,2 Sekunden.
- **Kein künstliches Warten** darüber hinaus. Ist das Spiel fertig, geht es los.

## 6. Texte: ALOP-Behördenmemos

Der Statustext unter dem Balken wechselt alle 2,2 Sekunden (zusätzlich bei jedem Stufenwechsel), mit kurzer Überblendung (180 ms). Die Texte sind eigene, trocken-satirische Behördenmeldungen. Beispiele (ergänze auf mindestens 24, alle auf Deutsch, ohne Namen oder Zitate aus anderen Spielen):

- „Amt für Lunare Oberflächenpflege: Ihr Antrag auf einen Besen wurde abgelehnt. Zahnbürste genehmigt.“
- „Staubsorten werden sortiert, nach Gefühl.“
- „Der Mond wird vermessen. Ergebnis: groß.“
- „Formular 27-B (Vorläufiges Putzen) wird in dreifacher Ausfertigung abgeheftet.“
- „Die Erde wird gebeten, kurz zu winken.“
- „Beförderung zum Reinigungsfachkraft-Anwärter ist in Prüfung.“
- „Schwerkraft wird auf ein Sechstel gestellt, bitte nicht widersprechen.“
- „Kaffeemaschine im Depot wurde noch nicht geliefert.“

Darunter in kleinerer, gedimmter Schrift ein **Spieltipp** (alle 6 Sekunden wechselnd). Verwende nur Tipps zu Funktionen, die es im Spiel tatsächlich gibt (prüfe das im Code). Beispiele: „Gebäude lassen sich nur auf sauberem Boden bauen.“, „Roboter arbeiten, solange eine Antenne sie abdeckt.“

## 7. Layout und Geräte

- **iPad (hoch und quer), Handy (hoch und quer), Desktop.** Die Szene skaliert mit einer festen „Bühne“ (Seitenverhältnis frei, Mond füllt immer den unteren Bildrand, Logo und Balken bleiben im sicheren Bereich).
- Logo „STAUBMOND“ oben mittig (große, fette Schrift mit leichtem Staub-Look, ein Hauch von Orange), darunter die Zeile „Amt für Lunare Oberflächenpflege“.
- Balken unten mittig, 6 px hoch, abgerundet, Füllung mit Verlauf von `dust.base` nach `clean.light` nach `alop.petrol`, daneben die Prozentzahl in Tabellenziffern. Am Handy hoch etwas kompakter.
- `viewport-fit=cover` und Abstände mit `env(safe-area-inset-*)`. Nichts liegt unter der Notch oder dem Home-Indikator.
- Größenänderung und Drehung werden live übernommen (`resize`, `orientationchange`), ohne Neuladen und ohne Sprung.
- `100dvh` statt `100vh`, damit Browserleisten am iPad und Handy nichts abschneiden.

## 8. Ton

- **Ton startet erst nach dem ersten Tippen**, weil iOS vorher keinen Ton erlaubt. Deshalb steht am Ende „Zum Starten tippen“. Falls der Ton schon freigeschaltet ist (zweiter Besuch), darf der Ladebildschirm sofort leise Ambient-Klänge spielen.
- Synthetisiert per Web Audio: leises Raumrauschen, ein sanfter Ton pro Ladestufe, Putz-Rhythmus (gefiltertes Rauschen), beim Finale ein Zündgrollen mit Aufwärtssweep, Kassen-Klang bei „Bereit“.
- Lautstärken folgen den gespeicherten Einstellungen, falls vorhanden. Stummschalten per Tippen auf ein kleines Lautsprecher-Symbol unten rechts.

## 9. Barrierefreiheit und Komfort

- **Bewegung reduzieren** (`prefers-reduced-motion` oder App-Einstellung): keine Sternschnuppen, keine Kamerabewegung, Astronaut und Kapsel erscheinen als ruhige Standbilder mit weicher Überblendung, der Balken füllt sich weiter.
- Nie mehr als 3 helle Blitze pro Sekunde, keine bildschirmfüllenden weißen Flächen.
- Der Fortschritt ist für Screenreader zugänglich (`role="progressbar"`, `aria-valuenow`, `aria-live="polite"` für die Statusmeldung, Wechsel höchstens alle 4 Sekunden).
- Textkontrast mindestens 4,5:1. „Zum Starten tippen“ ist ein echter Button mit Tastatur-Fokus (Enter und Leertaste starten ebenfalls).
- Ein kleiner Link „Effekte vereinfachen“ unten links schaltet bei Bedarf auf die einfache Variante und merkt sich das.

## 10. Fehlerfälle

- **Skriptfehler beim Start:** Der HTML/CSS-Ladebildschirm bleibt stehen und zeigt eine freundliche Meldung („Beim Start ist etwas schiefgegangen“) mit Button „Neu laden“ und einem aufklappbaren technischen Detailtext.
- **IndexedDB nicht verfügbar oder Spielstand beschädigt:** Der Ladebildschirm zeigt einen gelben Hinweis („Spielstand konnte nicht geladen werden, letztes Backup wird versucht“) und fährt dann fort, genau wie die bestehende Speicherlogik es vorsieht. Du änderst diese Logik nicht, nur die Anzeige.
- **Langsames Gerät:** Dauert eine Stufe länger als 6 Sekunden, erscheint dezent „Das dauert heute etwas länger, danke für die Geduld.“ Der Balken bleibt in Bewegung (langsames Schimmern), springt aber nie rückwärts.
- **`noscript`:** Ein sichtbarer Hinweis, dass JavaScript benötigt wird.

## 11. Performance

- Der Ladebildschirm darf das Laden nicht ausbremsen: höchstens 3 ms pro Frame für Szene und Partikel, höchstens 300 Partikel (Handy 120).
- Alle Sprites (Astronaut, Kapsel, Glanzsterne, Staubwölkchen, Sterne) einmal vorrendern, danach nur `drawImage`. Kein `ctx.filter`, kein `shadowBlur` im Loop, keine Objekterzeugung pro Frame.
- Die Mondscheibe und die Putzmaske liegen auf Offscreen-Canvases in halber Auflösung, hochskaliert mit Glättung.
- Pausiere die Animation bei `visibilitychange`, nutze `devicePixelRatio` höchstens bis 2 (Handy 1,5).
- Nach dem Übergang wird der gesamte Ladebildschirm samt Canvas und Event-Listenern **vollständig entfernt** (kein Speicherleck, kein Hintergrundlauf).

## 12. Abnahmekriterien

- [ ] Erste Bildschirmausgabe unter 100 ms ohne weiße Fläche, auch bei gedrosselter Verbindung
- [ ] Balken entspricht dem echten Fortschritt, geht nie rückwärts, springt nie
- [ ] Animation bleibt während des gesamten Ladens bei 60 FPS (iPad, iPhone 12, Desktop)
- [ ] Mindestanzeigedauer 1,8 s, Kurzversion bei sehr schnellem Laden
- [ ] Ton erst nach dem ersten Tippen, Stummschalter funktioniert
- [ ] Alle drei Gerätegruppen, hoch und quer, ohne abgeschnittene Elemente und mit korrekten Safe Areas
- [ ] „Bewegung reduzieren“ und Tastaturbedienung funktionieren
- [ ] Fehlerfälle zeigen verständliche Meldungen, nichts bleibt hängen
- [ ] Nach dem Übergang ist der Ladebildschirm komplett entfernt
- [ ] Spielstand von vorher lädt unverändert, `CONFIG` ist byte-identisch, Spiellogik unberührt
- [ ] Am Ende deiner Antwort: Liste „Vorschläge mit Logik-Bezug“, falls dir etwas auffällt, das Logik berühren würde (nicht umsetzen)
