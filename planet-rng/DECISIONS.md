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
  Mittel/Hoch. Die automatische Anpassung senkt die Stufe, wenn die Bildrate drei Sekunden lang
  unter ~45 FPS liegt, und regelt nie selbst hoch (erst wieder nach einer Änderung in den
  Einstellungen).
- **Pixeldichte:** Hoch 2, Mittel 1,5, Niedrig 1; auf Touch-Geräten bei V5/V6 höchstens 1,5.
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
