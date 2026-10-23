# Entscheidungen

Kurz festgehalten, wo die Vorgabe offen war. Alle Zahlen stehen in `src/config/` und lassen sich ändern.

## Projekt und Technik

- **Ort:** Das Spiel liegt im Ordner `planet-rng/` dieses Repos. Das fertige Spiel ist
  `planet-rng/planet-rng.html` (wird beim Build erzeugt und mit eingecheckt), Doppelklick genügt.
- **Stack:** Vite 7 + TypeScript 5.9 + Preact 10 (3 KB, reaktives Rendern aus dem Zustand) +
  `vite-plugin-singlefile`. Tests mit Vitest, Smoke-Test mit Playwright (vorinstalliertes Chromium).
  Bewusst stabile, ältere Hauptversionen statt der allerneuesten.
- **Schrift:** Fredoka (SIL OFL) als woff2 eingebettet (nur 500/600/700, lateinisch, ca. 48 KB) für den
  runden Roblox-Look. Fließtext nutzt die Systemschrift.
- **Gold intern als ganze Tausendstel** (`1 Gold = 1000`), damit Bruchteilpreise nie Rundungsfehler
  aufsummieren oder negativ werden.

## Roll-Modell und Glück

- **Modell:** Die Auren werden von der seltensten zur häufigsten geprüft. Aura *i* gelingt mit
  `min(1, Luck · c_i)`, wobei `c_i = (1/Odds_i) / R_i` und `R_i` die bei Luck 1 noch „übrige“
  Wahrscheinlichkeit ist. Ergebnis: Bei Luck 1 hat jede Aura **exakt** 1/Odds, Staub (Fallback) erhält
  den exakten Rest, die Summe ist exakt 100 %. Für seltene Auren ist `R_i ≈ 1`, also bedeutet
  „+50 % Glück“ wirklich das 1,5-Fache. Das ist eine kleine Verfeinerung des empfohlenen
  `min(1, Luck/Odds)`: identisch für seltene Auren, aber die angezeigten „1 in X“ stimmen auch für
  häufige Auren exakt.
- **Staub** zeigt deshalb „1 in 2,6“ statt „1 in 2,5“ (Rest nach allen anderen Auren).
- **Neue Auren:** 20 neue Auren im normalen Pool, alle ab „1 in 200“, damit die Prototyp-Chancen der
  häufigen Auren unverändert bleiben. Neue Auren in niedrigen Stufen gibt es nur in Biomen
  (16 biom-exklusive Auren, 2 pro Biom). Gesamt: 54 Auren.
- **Zwei neue Stufen** über Omniversal: *Absolut* (ab 1 in 250 Mio.) und *Unendlich* (ab 1 in 1 Mrd.).
  Seltenste Aura: Weltenkern, 1 in 3 Mrd.
- **Stapelregel:** Kategorien multiplizieren sich: Trank (nur der stärkste zählt) × Amulette (addieren
  sich) × Ausrüstung × Erfolge (addieren sich) × Rebirth × Biom × Glücks-Roll (jeder 10. Roll 2x).
- **Ladungs-Tränke** (Glückstrank, Eclipse, Göttlich) verbrauchen eine Ladung nur, wenn sie in diesem
  Roll tatsächlich das stärkste Glück geliefert haben. Ein Glückstrank geht also nicht verloren,
  während ein Sonnen-Trank wirkt.
- Der Zufallsgenerator (sfc32) liefert 53-Bit-Zahlen, damit auch „1 in 3 Mrd.“ exakt gewürfelt wird.

## Rollen

- **Quick Roll** zeigt das Ergebnis sofort, ohne Lade-Animation, ohne Spannungsverlängerung und mit
  kompaktem Reveal. Der Zyklus bleibt gleich lang wie normal (`GAME.roll.quickFactor = 1`), damit die
  Roll-Geschwindigkeit das Maß für den Durchsatz bleibt. Normaler Modus verlängert seltene Ergebnisse
  um eine Spannungsphase (pro Stufe in `tiers.ts`), Quick Roll nicht.
- Das Ergebnis wird beim Start eines Rolls gezogen (die Animation kann es andeuten) und erst beim
  Reveal gutgeschrieben. Wird die Seite mitten im Roll geschlossen, wird der Roll beim Laden abgeschlossen.
- Nach einem Rebirth wird die erste neu gerollte Aura wieder automatisch ausgerüstet.

## Zeit und Offline

- Buffs, Shop-Rotation und Biome laufen über absolute Zeitstempel und laufen also auch weiter, wenn
  das Spiel geschlossen ist.
- **AFK/Offline:** War Auto Roll aktiv, werden verpasste Rolls nachgeholt: im Hintergrund-Tab mit
  100 %, bei geschlossenem Spiel mit 50 % Effizienz, maximal 8 Stunden. Die Simulation nutzt die echten
  Regeln (Buffs laufen auf der simulierten Uhr ab, Biome wechseln). Danach erscheint eine
  Zusammenfassung. Ohne Auto Roll gibt es keinen Offline-Fortschritt.
- Biome folgen einem festen Welt-Seed (für alle Spieler und nach jedem Reload gleich).
- Die Shop-Rotation ist eine Funktion aus Spielstand-Seed und Rotationsnummer: Neu laden würfelt
  das Angebot nicht neu.

## Wirtschaft und Rebirth (Details und Simulation in BALANCING.md)

- Verkaufspreis ≈ `0,0062 · Odds^0,6`, gerundet: Staub 0,01, Urlicht 1, Omniversum 400,
  Weltenkern 3.000. Etwa 80 Gold pro Stunde Auto Roll am Anfang, große Drops sind Jackpots.
- Shop-Preise des Prototyps bleiben (15/15/100/1.000). Zusätzliche Items, damit die Rotation
  abwechslungsreich ist: Sonnenphiole (40, ein fertiger Sonnen-Trank), Chrono-Sanduhr (60,
  +30 % Tempo für 5 Min.), Kometen-Kompass (400, Ausrüstung +30 % Glück / +20 % Tempo). Weitere
  Shop-Stufen: Ungewöhnlich, Selten, Legendär.
- Rebirth-Anforderungen neu: R1 = 400 Gold + 5 Eklipse + 2 Urlicht, R2 = 4.000 Gold +
  3 Singularität + 1 Ewigkeit, R3 = 30.000 Gold + 3 Ewigkeit + 1 Quasar. Multiplikatoren,
  Stufenzahl und Reset-Regeln wie im Prototyp. Simuliert: Rebirth 1 nach 2,5–4,5 h,
  Rebirth 3 nach 32–69 h Auto Roll (je nach Spielweise), also über viele Tage verteilt.
- Der Rebirth-Gold-Bonus wirkt auf Verkäufe und den Gauntlet-Bonus, nicht auf feste Belohnungen
  aus Quests und Erfolgen.
- Erfolge zahlen Belohnungen sofort aus (Gold, Tränke, teils dauerhaft +1–10 % Glück).
  Stufen-Erfolge zählen auch, wenn man direkt eine seltenere Stufe findet.

## Inventar

- **Favorit = gesperrt:** Ein Stern schützt alle Exemplare einer Aura vor Verkauf und Verbrauch.
- Massenverkauf nach Stufe überspringt gesperrte Auren und behält immer ein Exemplar der
  ausgerüsteten Aura. Option „je 1 behalten“ ist standardmäßig an.

## Speicherstand

- Einstellungen werden getrennt gespeichert und bleiben beim Löschen des Spielstands erhalten.
- Backup-Slot alle 2 Minuten. Beschädigter Hauptstand → Backup laden, Originaltext wird unter
  einem eigenen Schlüssel aufbewahrt. Unbekannte IDs (nach Konfigurationsänderungen) werden beim Laden
  verworfen, Zahlen auf gültige Bereiche begrenzt.
- Export-Code: `PRNG1.<Base64>.<Prüfsumme>`.

## Audio

- `Plop` wurde auf 0,17 s gekürzt: Die ersten 70 ms der Datei waren Stille, die das Geräusch hörbar
  verzögert hat. Der Nutzinhalt bleibt vollständig, mit 50 ms Fade-out. Als WAV eingebettet (exakt,
  ohne MP3-Encoder-Verzögerung).
- `Deep Boom 3` unverändert, startet exakt mit der Cutscene.
- Ambient-Musik ist ein prozeduraler Akkord-Loop (Tonart und Helligkeit je Biom), während
  Cutscenes wird sie ausgeblendet. Abschalten über Musik-Lautstärke 0 oder „Stumm“.
- Längere Cutscenes seltener Stufen dauern länger als die 12,7 s von Deep Boom: ein prozeduraler
  Drone mit Riser trägt die Klimax-Phase.

## Darstellung

- **Avatar:** ein stilisierter Planet (passend zum Namen). Er wächst und verwandelt sich mit
  jedem Rebirth: Felsplanet → Ozeanwelt mit Ring → Gaia mit Mond → Gasriese mit zwei Monden.
  Die Atmosphäre nimmt die Farbe der ausgerüsteten Aura an.
- Aura-VFX: siehe Abschnitt „Aura-VFX (Neuentwurf)“ weiter unten.
- Reveal-Dauer skaliert mit der Stufe (1,7 s bei Gewöhnlich, 2,6 s bei Legendär, bis 6,5 s
  bei Unendlich) statt pauschal 2,6 s. Ab Mythisch gibt es einen Vollbild-Reveal.
- Während eines Rolls laufen Aura-Namen wie bei einem Spielautomaten durch (Sol's-RNG-Stil).
  Unentdeckte Auren erscheinen dabei als „???“, damit nichts vorweggenommen wird. Vor einer
  Cutscene wird der Name nicht gezeigt.
- Icons sind eigene SVG-Vektoren statt Emojis (einheitlich auf allen Geräten).

## Meta

- Erfolge werden automatisch vergeben, tägliche Aufträge (3 pro Tag, Wechsel um Mitternacht
  Ortszeit) und Daueraufträge (Stufen mit steigendem Ziel) holt man per Knopf ab.
- Der globale Feed ist erkennbar simuliert („SIMULIERT“-Label) und zeigt erfundene Spieler ab
  „1 in 1.000“ sowie eigene Drops ab Legendär. Abschaltbar.
- Das Tutorial blockiert nichts (Spotlight ohne Klicksperre), ist jederzeit überspringbar und
  lässt sich in den Einstellungen neu starten.
- Test-Hook: Mit `?debug` in der URL stellt das Spiel `window.__prng` bereit (für Playwright).
  Ohne den Parameter gibt es keinen globalen Zugriff.

## Aura-VFX (Neuentwurf)

**Bestandsaufnahme vor dem Umbau – was bleibt, was ersetzt wird**

- Bleibt: Bühne (Sternenhimmel, Biom-Wetter), Roll-Effekte, Cutscenes, der Planet als Avatar
  mit Rebirth-Wachstum, Titelzeile und Menüs.
- Bleibt: Canvas 2D als Zeichenfläche, Referenz-Koordinaten (Planetenradius = 60 Einheiten),
  Aufteilung hinter/vor dem Avatar, Pause bei verstecktem Tab, Qualitätsstufen und „Effekte
  reduzieren“ in den Einstellungen.
- Bleibt: Namen, Beinamen, Chancen und Farben aus `config/auras.ts`.
- Ersetzt: der alte Aura-Renderer (`aura.ts`, `particles.ts`, `rings.ts`, `specials.ts`) durch
  die Schicht-Engine in `src/render/vfx/`.
- Ersetzt: der `vfx`-Block jeder Aura (Ringe + Emitter + Spezialeffekte) durch eine eigene,
  deklarative Spec pro Aura in `src/config/vfx/specs/` (alle Zahlen dort, in D, °/s, s).
- Ersetzt: die Hintergrund-„Stimmung“ durch eine Bühnen-Dimmung je VFX-Stufe (V0 kaum, V6 stark)
  mit Entsättigung, Tönung und Vignette.
- Ersetzt: die Atmosphären-Tönung des Planeten durch echte Beleuchtung: Randlicht aus Richtung
  der Lichtquelle, Farbstich, Aufhellen beim Akzent, weiche Schatten von Orbit-Objekten.
- Ersetzt: die Zeit pro Aura durch eine durchlaufende Uhr (siehe unten).

**Entscheidungen**

- **Renderer: Canvas 2D statt WebGL2.** Hintergrund, Planet, Aura und Roll-Effekte teilen sich
  eine Zeichenfläche, es gibt keinen Kontextverlust-Pfad, und Playwright ohne GPU rendert exakt
  das, was Spieler sehen. Das Budget (bis 450 Partikel und 14 Schichten bei V6) liegt gut im
  Rahmen von `drawImage`. Statt Shadern gibt es vorgebackene Texturen: FBM-Rauschen mit
  Domain-Warping für Nebel und Rauch, Spiralen für Wirbel, Strahlenkränze, weiche Lichtbänder,
  Lichtsäulen mit fließendem Rauschen. Bloom entsteht beim Backen durch Downsample-Blur.
- **Boden („Orbit-Ebene“):** eine schwebende Ebene 0,62 D unter der Planetenmitte, als Ellipse
  (Stauchung 0,34). Der Planet sitzt in seinem Sigil, die hintere Hälfte verdeckt er selbst.
- **Einheit D** (Avatar-Durchmesser) für alle Größen. Die Tabelle der VFX-Stufen V0–V6
  (Ausdehnung, Partikel, Schichten, Intro-Dauer, Dimmung, Vignette, Kamera) steht in
  `src/config/vfx/tiers.ts`. Seltenheit → Stufe: Gewöhnlich V0, Ungewöhnlich V1, Selten V2,
  Episch V3, Legendär/Mythisch V4, Göttlich bis Galaktisch V5, ab Universell V6.
- **Zeitbasis:** Wanduhr (Sekunden seit 1.1.2026). Rotationen, Atmen und der Akzent-Zeitplan
  hängen nur an dieser Uhr. Rolls, Auto Roll, Menüs und sogar ein Neuladen setzen nichts zurück.
  Akzente kommen deterministisch alle 5–9 s (Periode ± Zufall aus einer Hash-Funktion).
- **Intro:** Sigil zeichnet sich mit einem Licht-Stift, Säule schießt hoch, Bodenwelle läuft
  nach außen, Hero skaliert 0,6 → 1,05 → 1, Partikel setzen ein. Dauer V0–V1 0,5 s,
  V2–V3 1,2 s, V4 2 s, V6 2,4 s. Ab V5 ein weicher weißer Flash am Ende.
- **Wechsel:** alte Aura 0,4 s ausblenden und auf 90 % schrumpfen, neue baut sich auf.
- **Kamera:** V5 zoomt 6 %, V6 10 % heraus (1,2 s Ease-out), danach ruhig. Bei „Effekte
  reduzieren“ keine Kamerabewegung, keine Flashes, Rotation und Atmen auf 25 %.
- **Qualität:** Niedrig 30 %, Mittel 60 %, Hoch 100 % der Partikel; einzelne Schichten nur ab
  Mittel/Hoch. Die automatische Anpassung dünnt nur die Effekte aus (Partikel, optionale
  Schichten, Bloom), nie die Auflösung, und regelt nach 12 s flüssiger Darstellung wieder hoch,
  höchstens bis zur gewählten Stufe (siehe „Schärfe“ unten).
- **Pixeldichte:** Hoch 3 (native Auflösung heutiger Handys), Mittel 2, Niedrig 1,5; auf
  Touch-Geräten bei V5/V6 höchstens 2,5. Zuerst waren es 2 / 1,5 / 1 (bei V5/V6 auf Handys 1,5),
  wie in der Vorgabe; das sah auf Handys mit DPR 3 verwaschen aus (siehe „Schärfe“ unten).
- **Titelzeile** bleibt unverändert. Ab V3 liegt im Canvas ein weicher dunkler Verlauf dahinter.
- **Aura-Labor:** `?lab=1` (zusammen mit `?debug` für Skripte). Zeigt eine Aura auf der Bühne,
  ohne den Speicherstand zu ändern; `window.__lab` erlaubt deterministische Aufnahmen mit
  angehaltener Uhr.
- **Test angepasst:** Die Prüfung „höchstens 3 Ringe“ im Roll-Modell-Test las den alten
  `vfx`-Block. Sie ist nach `tests/vfx.test.ts` umgezogen (höchstens 3 Lichtbänder pro Aura)
  und wird dort durch die Checkliste je Aura ergänzt.
- **Referenz-Aura Urlicht (V4):** Heiligenschein-Mandala aus weichen Lichtbändern und goldenen
  Lichtblättern, Lichtsäule über die ganze Bühnenhöhe, Boden-Mandala, aufsteigende Lichtfedern,
  dunkler Gegenlicht-Rauch. Akzent alle 6–8 s: Strahlen-Sweep, Mandala hellt auf, Bodenwelle,
  Mond leuchtet kurz auf.
- **V5 (Göttlich bis Galaktisch):** Heroes, die über die Bühnenränder reichen (Schwarzes Loch
  mit Linseneffekt, Gezeitenstrom, Blutmond, sechs Flügel, Zeitriss, Lemniskate,
  Zifferblatt-Portal, Gargantua, Doppeljet, Supernova-Hülle, Spiralgalaxie, Feldlinien).
  Sieben V5-Specs setzen `size` auf 5,6–6,2 D, weil ihr Hero schmal oder seitlich versetzt ist
  und bei 4,8 D zu klein wirkte.
- **V6 (ab Universell) – neuer Himmel:** Jede V6-Aura hat eine Schicht „Himmel“ im Slot
  `screenBack`. Sie liegt hinter allem, aber nach der Bühnen-Dimmung, und färbt den ganzen
  Hintergrund um (Nebel in den Aura-Farben; bei Paradoxon links Orange, rechts Cyan).
  Nullpunkt hat keinen Himmel, dort wird die Bühne vollständig entsättigt.
- **V6-Heroes:** Blasenuniversen (Multiversum), 3D-Filamentnetz (Kosmisches Netz), Kollaps
  und Urknall aus dem Planeten heraus (Urknall), Urzelle mit DNA-Helix (Ursuppe),
  zerfallendes Kristallgitter (Entropie), letzte Glut neben dem Planeten (Wärmetod),
  verschränkte Spiegelringe (Paradoxon), Möbiusband mit zwei Farbseiten (Möbius),
  Spektral-Mandala (Omniversum), kosmischer Lotus (Schöpfung), die Null um eine schwarze Leere
  (Nullpunkt), verschachtelte platonische Körper (Archetyp), Ouroboros (Äon), Weltenherz mit
  kreisenden Welten (Weltenkern). Omniversum braucht keine eigene Hero-Klasse: sein Hero ist ein
  Sigil, dessen Elemente je eine Spektralfarbe (`p0`–`p4`) tragen.
- **Titel bleibt frei:** Heroes, die sonst auf dem Titel lägen, sitzen tiefer oder seitlich
  (Urknall-Kern im Planeten statt darüber, Wärmetod-Glut links neben dem Planeten, Null und
  Urzelle leicht abgesenkt).
- **Nullpunkt-Akzent:** Das Innere der Null kehrt sich um (Ellipse mit Differenz-Mischung,
  wächst aus der Leere und zieht sich zurück). Zuerst war eine Vollbild-Umkehr geplant; die
  lief beim Überblenden durch ein flaches Grau, überdeckte den Titel und war als
  Vollbild-Helligkeitssprung zu hart. Bei „Effekte reduzieren“ entfällt die Umkehr.
- **Akzent-Vielfalt:** Wenn der Hero den Akzent schon selbst trägt (Universen tauschen die
  Plätze, Impulswelle durchs Netz, Körper verwandeln sich), gibt es nur eine Bodenwelle statt
  eines Bildschirmrings, damit nicht jede V6-Aura gleich aufleuchtet.
- **Schockwellen-Breite wirkt jetzt:** Die Ringtextur der Schockwelle hatte eine feste Dicke,
  der Spec-Wert `width` wurde ignoriert. Die Schärfe ergibt sich jetzt aus Endradius und
  Breite (12–48, gerundet für den Textur-Cache, 512 px ab Schärfe 24). Das betrifft alle Stufen:
  Akzent-Ringe sind schmaler und klarer.
- **Anlegen ohne Ruckler:** Das Backen der Texturen beim Anlegen kostete bis zu 350 ms. Dagegen
  helfen drei Dinge: billigere Texturen (Schockwellen-Ringe als radialer Verlauf statt Pixel
  für Pixel, Strahlenkränze einmal weiß gebacken und per GPU eingefärbt, die zweite Nebelebene
  in kleinerer Auflösung), geteilte Rauschgitter (8 Varianten je Oktaven-Satz statt eines Gitters
  pro Textur) und Vorbacken: Bei einem Wurf ab V3 baut der Renderer die Schichten der Aura
  während der Roll-Animation einzeln auf (höchstens 8 ms pro Bild), damit sind die Texturen im
  Cache, wenn der Spieler sie anlegt. Ein Bild mit einer großen Nebel-Schicht kann dabei 50–65 ms
  dauern; das liegt in der Lade-Animation, nicht im Intro der Aura.
- **Pixeldichte folgt der Qualität:** Ein Wechsel der VFX-Qualität setzt jetzt die DPR-Grenze neu
  (vorher blieb sie auf dem Wert vom Start).
- **Meteorit wartet sichtbar:** Zwischen zwei Einschlägen hängt der nächste Meteor als kleiner
  brennender Punkt hoch am Himmel und kommt langsam näher; der Krater glimmt weiter. Vorher war die
  Aura zwischen den Einschlägen fast leer.
- **Entropie ist meist intakt:** Das Gitter zerfällt beim Akzent in 2,2 s, hängt 0,6 s zerfallen
  und setzt sich in 2,4 s wieder zusammen. Vorher dauerte das Zusammensetzen bis kurz vor den
  nächsten Akzent, das Gitter war fast nie ganz.
- **Prüfbilder:** Kontaktbogen und Silhouetten zeigen den Ruhezustand (das Labor sucht mit
  `idle` einen Zeitpunkt ohne laufenden oder bevorstehenden Akzent). Die Silhouetten sind
  Graustufen mit erhöhtem Kontrast; jede Aura muss an ihrer Form erkennbar sein.
- **Schärfe (Rückmeldung: „pixelig“, „VFX-Qualität ohne Funktion“):** Nachgestellt auf einem
  emulierten Handy (DPR 3). Ursachen: (1) Der Erststart wählte bei 4 gemeldeten Kernen „Niedrig“,
  also DPR 1 – jedes Pixel dreifach gestreckt. (2) Die automatische Anpassung senkte nach
  Mittel/Hoch innerhalb von 4–8 s wieder auf Niedrig und damit auf DPR 1, regelte nie hoch und
  reagierte auch auf Browser, die zum Stromsparen auf 30 FPS begrenzen. Die Einstellung wirkte
  dadurch wie ohne Funktion. (3) Hoch war auf DPR 2 begrenzt, Sigille und Lichtbänder wurden fest
  mit 512 px gebacken. Lösung, ohne die Designs zu ändern:
  - Die Auflösung folgt nur der Einstellung (Niedrig 1,5, Mittel 2, Hoch bis 3).
  - Die automatische Anpassung (`src/render/quality.ts`, Unit-Tests in `tests/quality.test.ts`)
    dünnt nur Effekte aus. Als langsam gilt: viel JS-Zeit, oder lange Bilder zusammen mit viel
    JS-Zeit oder unregelmäßigen Abständen. Gleichmäßig lange Bilder (30-FPS-Begrenzung) zählen
    nicht. Nach 12 s flüssiger Darstellung geht sie wieder eine Stufe hoch.
  - Sigille, Lichtbänder und Schockwellen-Ringe werden in der Auflösung gebacken, in der sie auf
    dem Bildschirm erscheinen (Schritte von 256 px, höchstens 1536 px). Die Linienbreiten skalieren
    mit, das Aussehen bleibt gleich. Sigille laufen jetzt durch den gemeinsamen Textur-Cache mit
    Megapixel-Budget (vorher eigener Cache mit 24 Einträgen ohne Größenlimit); der Cache räumt
    jetzt auch unter 32 Einträgen auf, sobald das Budget überschritten ist.
  - Erststart: Niedrig nur bei höchstens 2 gemeldeten Kernen, Mittel bei 3–4, sonst Hoch.
  - Die Vorschau in der Sammlung backt dieselben Texturen wie die Bühne (gleiche Größe), damit
    das Anlegen danach weiter ohne Ruckler bleibt.

## Cutscenes erneut ansehen

- Jede entdeckte Aura mit Cutscene hat in der Detailansicht der Sammlung den Knopf „Cutscene
  abspielen“. Ein erneutes Ansehen vergibt und zählt nichts (keine Aura, kein Wurf, kein Fund).
- Es läuft auch, wenn „Cutscenes abspielen“ in den Einstellungen aus ist (der Spieler fordert es
  ausdrücklich an), und lässt sich immer per Tippen überspringen, auch wenn „Überspringen
  erlauben“ aus ist.
- Läuft gerade ein Wurf (z. B. Auto Roll), startet die Cutscene direkt nach diesem Wurf;
  Auto Roll geht danach weiter.

## Cutscenes: Stern im Vordergrund (Rückmeldung)

- Die Ringe um den Stern sind entfernt: reine Kreislinien, die Regenbogenringe (Omniversum,
  Schöpfung, Weltenkern) und die Ränder gefüllter Kreise (Akkretion, Magnetar, Paradoxon und die
  klassische Vorlage), die zu einem weichen Leuchten ohne Rand geworden sind. Massive Scheiben,
  die selbst das Motiv sind (Urknall- und Supernova-Kern, das schwarze Loch des
  Ereignishorizonts), bleiben.
- Sterne sind 1,4-mal so groß und werden immer zuletzt gezeichnet, liegen also vor allen anderen
  Teilen des Symbols.
- Drehung halbiert: 110°/s → 260°/s statt 220°/s → 520°/s (etwa 5,5 statt 11 Umdrehungen).
  Die Aura-Effekte selbst brauchten dafür keine Änderung.

## Cutscene-System (Neuaufbau)

### Bestandsaufnahme (Phase 1): was bleibt, was ersetzt wird

1. **Auslöser bleibt:** `GAME.cutscene.minOdds` (1 in 10.000), Roll-Button gesperrt
   (`phase === 'cutscene'`), Auto Roll wartet auf `cycleDone`, „Cutscene abspielen“ aus der Sammlung.
2. **Ersetzt:** `render/cutscene.ts` (ein fester Ablauf Schwarz → Symbol → Klimax-Enum → Weiß) wird
   zur Timeline-Engine `render/cutscene/` mit Bausteinen; die Klimax-Varianten entfallen.
3. **Übernommen als Kernmotiv „Kreis-Stern“:** die 22 Symbol-Ebenen (glow, star, wings, clock, …)
   wandern unverändert als `circleStar`-Ebenen in die Cutscene-Daten; Wachstum linear,
   Drehbeschleunigung mit derselben Formel (`cutsceneAngle`).
4. **Spiellogik:** bisher wurde die Aura erst *nach* der Cutscene gutgeschrieben (`completeRoll`
   im `then`). Neu: gutschreiben, zählen und sofort speichern *vor* dem Start; die Cutscene ist
   reine Darstellung. Die Spielereignisse (Toasts, Anlegen) werden bis zur Enthüllung gehalten.
5. **Zeitbasis:** bisher `requestAnimationFrame`-Deltas, neu `AudioContext.currentTime`
   (geglättet; ohne entsperrtes Audio `performance.now()`).
6. **Audio bleibt:** Deep Boom startet mit der Cutscene, Musik wird gedämpft (`setDuck`). Ersetzt:
   der pauschale Drone/Riser für lange Cutscenes durch Hinweise (Cues) je Definition
   (Jingle, Wind, Motivklang, Stille, Impact, Musik mit Beats).
7. **Reveal-Übergabe bleibt:** das Ereignis `reveal` mit `afterCutscene` (kein Doppelblitz),
   danach blendet das Overlay weich aus. Neu: Übergabe zu `duration`, Ausklang aus einem
   Standbild des letzten Bildes (kein Sprung).
8. **Überspringen:** bisher Tippen irgendwo (wenn erlaubt). Neu: Schaltfläche nach 2 s oder
   langes Drücken; beim erneuten Ansehen aus der Sammlung überspringt weiterhin ein Tippen.
9. **Tab-Wechsel:** bisher Pause. Neu: Pause, nach mehr als 2 s im Hintergrund springt die
   Cutscene beim Zurückkommen zur Enthüllung.
10. **Einstellungen bleiben:** „Cutscenes abspielen“, „Überspringen erlauben“. Neu: „Cutscenes
    bis Seltenheit … überspringen“, „Lichtblitze reduzieren“, Cutscene-Lautstärke.
11. **Entfällt:** `cutsceneExtraMs` der Stufen und die Klimax-/Hintergrund-Enums der Auren; die
    Aura-Konfiguration verweist nur noch auf ihre Cutscene-Definition.

### Engine (Phase 1)

- **Kreis-Stern-Tempo:** Der Auftrag nennt 220 → 520°/s (etwa 11 Umdrehungen). Das ist der Stand
  vor der letzten Rückmeldung; dort wurde die Drehung ausdrücklich halbiert. Es bleibt bei
  110 → 260°/s (etwa 5,5 Umdrehungen), die Werte stehen weiter in `GAME.cutscene` und werden vom
  T1-Template gelesen.
- **Zeiten:** `duration` ist die Übergabe an den Reveal (Überspringen landet dort),
  `reveal.at` der Beginn der Enthüllung (z. B. Weißblende), `signature.at` der Bruch. Danach
  blendet das Overlay ein Standbild des letzten Bildes aus (Weißblende 0,7 s, Randglühen 0,6 s,
  Schnitt 0,15 s), darunter erscheint schon der Reveal.
- **Bausteine sind Funktionen der Zeit:** jeder Baustein zeichnet aus Fortschritt und Parametern,
  Partikel werden geschlossen berechnet statt simuliert. Darum kann das Labor an jede Stelle
  springen und rückwärts scrubben. Nur Frame-Snapshots (Shatter, SplitSlash, TimeFreeze) hängen
  von einem früheren Bild ab; beim Springen wird dieses Bild zuerst gezeichnet.
- **Zeitbasis:** `AudioContext.currentTime` minus Ausgabelatenz, damit Bild und Ton zusammen
  sind; eine `performance.now()`-Uhr wird weich nachgezogen (Sprünge über 0,2 s werden
  übernommen). Ohne entsperrtes Audio läuft die Cutscene stumm auf `performance.now()`; wird
  Audio mitten in der Cutscene entsperrt, setzen Klangbetten mit passendem Versatz ein.
- **Tab-Wechsel:** Die Cutscene pausiert (Audio wird ohnehin angehalten). War der Tab länger als
  2 s weg, springt sie beim Zurückkommen zur Enthüllung (mit dem kurzen Aura-Blitz des
  Überspringens): eine halb gesehene Spannungskurve wieder aufzunehmen wirkt schlechter als
  direkt die Belohnung zu zeigen. Der Spielstand ist davon nicht betroffen.
- **Spielereignisse während der Cutscene:** werden gesammelt und bei der Enthüllung ausgegeben
  (`GameStore.apply(…, emit = false)` + `dispatch`). Gespeichert ist schon vorher.
- **Stufen-Zuordnung:** `cutsceneTier` an der Aura überschreibt die Stufe nach Chance; die
  Stufe steuert Nachhall-Stärke und ob Überspringen immer erlaubt ist (T3).
- **Überspringen erlaubt:** wenn „Überspringen erlauben“ an ist, bei T3 immer (lange Filme),
  beim erneuten Ansehen aus der Sammlung immer (dort genügt Tippen). Sonst Schaltfläche nach
  2 s, langes Drücken (0,6 s) oder Esc.

### T1 (Phase 2)

- Deep Boom ist ein Einschlag am Anfang, der über rund 10 s ausklingt. Das Ende jeder T1-Cutscene
  trägt deshalb ein eigener Aufbau (Sog, Chor, Riser, Ticken, Herzschlag), dann 0,35–0,55 s Stille
  und ein Impact auf dem Bruch; die Weißblende folgt danach wie bisher bei 13 s.
- Jede T1-Aura hat ein eigenes Motiv oder ihr Prototyp-Symbol (Kreis-Stern), eigene Partikel, ein
  eigenes Pulssymbol und einen eigenen kleinen Bruch (Kollaps, Sog, Verfinsterung, Lichtsäule,
  Zeitriss, Stillstand mit Spektrum-Blüte, Mitternacht, Horizont, Jet-Flare, Kernbruch,
  Galaxienkollision, Magnetsturm). Kreis-Stern behalten Akkretion, Seraph, Zeitriss, Supernova
  und Magnetar; Singularität, Blutmond, Ewigkeit, Chronosphäre, Ereignishorizont, Quasar und
  Andromeda haben eigene Kernmotive (schwarzes Loch, Mond, Lemniskate, Uhr, Jets, Galaxie).
- Blutmond und Ereignishorizont enden mit Randglühen statt Weißblende, Quasar mit einer
  längeren Weißsättigung.
- Einige Bausteine aus späteren Phasen (Strahlen, Ticker, SplitSlash, TimeFreeze, Zähler, Linse)
  sind schon jetzt gebaut, weil die T1-Brüche sie brauchen.

### T2 (Phase 3)

- Rund 20 s: Entzug mit Jingle, prozeduralem Drone (eigener Grundton je Aura) und Wind,
  Texttafel 1 (rätselhaft), Kernmotiv mit Rampe, 0,4–0,5 s Stille, Bruch mit Impact, Texttafel 2
  (Gegenstück), Weißblende bzw. Randglühen. Texte haben je drei zufällige Varianten.
- Brüche: Multiversum – die drei Kugel-Universen verschmelzen (Lichtbrücken, Schockwelle);
  Kosmisches Netz – das Netz wird zu einem Faden gespannt, der reißt; Urknall – Kollaps,
  Stille, das ganze Bild zerspringt nach außen, Glut-Schockwelle; Ursuppe – die Zellen
  verschmelzen, ein Blitz schlägt den Lebensfunken ein; Entropie – Kollaps-Welle, danach setzt
  sich das Gitter in Stille wieder zusammen; Wärmetod – die letzte Glut, gehaltene Stille, dann
  blüht sie warm auf; Paradoxon – senkrechter Schnitt, beide Hälften tauschen Farbe und Zeit
  (Partikel laufen rückwärts); Möbius – das ganze Bild stülpt sich zur anderen Seite um.
- Rampen: schnellere Szenenschnitte (Multiversum), Impulse und ein Zähler „Verbindungen“
  (Netz), Countdown mit immer schnellerem Herzschlag (Urknall), Zellteilung und Zähler (Ursuppe),
  „Ordnung 100 % → 0 %“ mit Knistern (Entropie), „Temperatur 5.778 K → 3 K“ (Wärmetod),
  beschleunigter Wahr/Falsch-Wechsel mit Inversion (Paradoxon), schnellere Läufer (Möbius).
- Farbtausch beim Schnitt (Paradoxon): nicht als Inversion (das würde den dunklen Hintergrund
  für Sekunden weiß machen), sondern als Drehung des Farbtons um 180° bei gleicher Helligkeit.
- Inversion im Beat nur auf jedem zweiten Schlag; der Unit-Test prüft das Flash-Limit über alle
  Definitionen. Ein weiterer Test stellt sicher, dass sich keine zwei Cutscenes nur in der Farbe
  unterscheiden (Vergleich der Tracks ohne Farbwerte).

### T3 (Phase 4)

- Jede Aura ab 1 in 100 Mio. hat ein eigenes Drehbuch von 28–36 s mit prozeduraler Musik
  (Tempo, Tonart, Stimmung und Drop je Film) und Beat-Markern, auf denen Texte, Schnitte,
  Inversionen und Herzschläge sitzen. Kein Template, keine geliehenen Brüche:
  - **Omniversum:** Reprise – Miniaturen der anderen Motive in Kinobalken, erst jeden zweiten,
    dann jeden Schlag; Spektral-Mandala, „Universen 1 → 100.000.000“, alles fällt in einen
    Punkt, 0,6 s Stille, spektrale Schockwelle.
  - **Schöpfung:** ein Lichtpunkt, eine graue Welt entsteht Schnitt für Schnitt („Farben 1 →
    16.777.216“), dann flutet die Farbe von der Mitte aus die Welt; Sonnenaufgang.
  - **Nullpunkt:** beginnt wie Singularität (Täuschung über `extends`), Schnitt auf Weiß,
    eine schwarze Null, Schwarz-Weiß im Beat, „Rest 1.000.000 → 0“, Schwarz, Stille, ein
    Lichtstrich öffnet das Bild.
  - **Archetyp:** Formen bekommen im Beat immer mehr Ecken (3 → 64, also ein Kreis) und rasten
    mit einem Strahlenkranz zur Urform ein, die zum goldenen Kristall wird.
  - **Äon:** Zeitringe drehen sich durch die Zeitalter immer schneller („Jahre 0 → 13,8 Mrd.“),
    dann läuft alles rückwärts durch dieselben Zeitalter bis zum Ursprung.
  - **Weltenkern:** Reise nach innen (All, Orbit, Wolken, Mantel, Kern) in Kinobalken,
    „Tiefe 0 → 6.371 km“, ein Herz schlägt mit der Musik und öffnet sich wie eine Blüte,
    vier Herzschläge.
- Helle Vollbild-Szenen (Himmel, Kern) sind bewusst gedämpft, damit Text und Motiv lesbar
  bleiben und kein Vollbild minutenlang blendet. Schwarze Schrift auf Weiß ohne Leuchtschatten.
- Ein Schnitt auf eine helle Szene zählt im Flash-Validator als Blitz (auch der erste Schnitt
  eines Szenen-Tracks, wenn er mitten in der Cutscene beginnt).

### Nachhall, Übergabe, Einstellungen (Phase 5)

- **GlobalEcho** startet mit der Übergabe an den Reveal, auch nach dem Überspringen und beim
  erneuten Ansehen: CSS-Filter auf der Spielbühne (Graustufen, Farbtausch oder Tönung in der
  Aurafarbe, 0,5/0,75/1 s je Stufe, weich zurück), Donner (ab T2) oder ein leiser Einschlag,
  Schockwellen-Ringe (1/2/3 je Stufe) auf einer eigenen Ebene zwischen Bühne und HUD; T3 dazu
  ein senkrechter Lichtstrahl und aufsteigende Partikel für etwa 3 s. Mit „Lichtblitze
  reduzieren“ ist der Filter halb so stark und blendet langsamer ein.
- **Banner und Feed:** der bestehende Vollbild-Reveal ist das Banner (Stufe, Name, „1 in X“,
  Beiname), der simulierte Feed bekommt den eigenen Fund wie bisher über das Reveal-Ereignis.
  Beim erneuten Ansehen gibt es weder Banner noch Feed-Eintrag (es wurde nichts gerollt).
- **Übergabe „kommt aus Cutscene“:** `afterCutscene` unterdrückt wie bisher den Bildschirmblitz
  des Reveals; das Overlay blendet sein letztes Bild aus, während darunter Reveal und Aura-Intro
  starten. Die gehaltenen Spielereignisse (Erfolge, Anlegen) erscheinen genau dann.
- **Einstellungen:** „Cutscenes überspringen bis …“ (Keine, unter 1 in 100.000 / 1 Mio. /
  10 Mio. / 100 Mio.; die Aura bekommt dann den normalen Reveal), „Lichtblitze reduzieren“
  (weiche Blenden statt Blitzen, Tönung statt Inversion, gedämpfte Weißblende, kein
  Kamerawackeln mit „Effekte reduzieren“), Lautstärke „Cutscenes“ (wirkt sofort, auch während
  einer laufenden Cutscene). Alles wird mit den Einstellungen gespeichert.
- **prefers-reduced-motion:** setzt bei neuen Einstellungen „Effekte reduzieren“ und
  „Lichtblitze reduzieren“; ältere gespeicherte Einstellungen ohne den neuen Schalter übernehmen
  ihn ebenfalls aus dem System. Ohne Kamerabewegung läuft die Cutscene, wenn das System
  weniger Bewegung wünscht.
- **Hinweis vor der ersten Cutscene:** „Enthält Lichtblitze. In den Einstellungen reduzierbar.“
  steht während der schwarzen Eröffnung (blockiert nichts) und wird danach nicht mehr gezeigt.
