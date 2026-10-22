# Abschlussbericht – Planet RNG (Neuaufbau)

Das Spiel ist komplett neu gebaut. Ergebnis ist eine einzige Datei, `planet-rng.html`
(ca. 700 KB, davon ca. 270 KB Deep Boom und ca. 65 KB Schrift), die per Doppelklick offline läuft.

## Was gebaut ist

**Kern und Glück**
- 54 Auren in 16 Stufen: die 18 Auren des Prototyps mit Namen, Farben, Reihenfolge und Chancen,
  dazu 20 neue im normalen Pool und 16 biom-exklusive. Zwei neue Stufen (Absolut, Unendlich),
  seltenste Aura „Weltenkern“ mit 1 in 3 Mrd.
- Neues Roll-Modell (von selten nach häufig, `min(1, Luck · c)`), exakt auf 100 % normiert.
  +50 % Glück bedeutet wirklich die 1,5-fache Chance. Seedbarer Zufallsgenerator mit 53 Bit.
- Glücks-Roll bei jedem 10. Roll, erste Aura wird automatisch ausgerüstet, gecraftete und
  gekaufte Auren zählen nicht als Roll.
- Stapelregel mit Aufschlüsselung im HUD: Trank (stärkster zählt) × Amulette (addieren) ×
  Ausrüstung × Erfolge × Rebirth × Biom × Glücks-Roll.

**Roll-Erlebnis**
- Großer ROLL-Knopf mit Puls, Auto Roll (+25 % Dauer) und Quick Roll, Rollzähler, Verlauf,
  Hinweis auf den nächsten Glücks-Roll, Tastatursteuerung.
- Lade-Animation (Partikel ziehen zum Planeten, Ladering) mit Spannungsphase für seltene
  Ergebnisse, Namens-Slotmaschine, Reveal in vier Stufen: Banner → Blitz/Shake → Vollbild →
  Cutscene. Vibration bei seltenen Drops.

**Cutscenes (26 Stück, ab 1 in 10.000)**
- Baukasten mit Timeline: 3 s Schwarz, 10 s linear wachsendes Symbol mit Drehung von 220°/s auf
  520°/s (etwa 11 Umdrehungen), Klimax-Phase je Stufe (länger und aufwendiger, je seltener),
  Weißblende, Enthüllung. 22 wiederverwendbare Bausteine; die Stile des Prototyps (Classic,
  Burst, Decay, Duality, Prism) sind nachgebaut, jede neue Aura hat ein eigenes Symbol.
- Deep Boom startet exakt mit der Cutscene, Roll gesperrt, Auto Roll wartet, Überspringen per
  Tipp, wenn erlaubt.

**Aura-Optik**
- Canvas-Partikelsystem mit Objekt-Pool und vorgerenderten Glow-Sprites: 22 Partikelformen,
  26 Bewegungsarten (kreisen, eingesogen, ruckartig geschleudert, zerfallen, umkehren,
  ticken, teleportieren, Galaxie-Arme, Feldlinien, Möbiusband, Lemniskate …), 9 Ringstile
  (maximal 3 Ringe pro Aura), 32 Spezialeffekte (Korona, Kometen, Leuchtturm-Kegel, Flügel,
  Uhr, Netz, Zellen, Polarlicht, Inversion, Stern-Kern …), Hintergrund-Stimmungen.
- Animationen laufen durchgehend weiter und werden durch Rollen nie zurückgesetzt
  (im E2E-Test geprüft), Wechsel der Aura blendet weich über.
- Planet als Avatar, der mit jedem Rebirth wächst und sich verwandelt.
- Acht Biome mit eigener Optik, eigener Musikstimmung, Glücksbonus und exklusiven Auren.

**Wirtschaft, Items, Fortschritt**
- Gold Coins neu kalibriert, Shop mit 5-Minuten-Rotation, Lagerbestand, Countdown und klaren
  Kaufzuständen, 7 Items (inkl. Quantum-Gauntlet und neuem Kometen-Kompass), Ausrüstungs-Slot.
- Tränke-Werkstatt und Tränke-Vorrat getrennt, Stapeln von Dauer und Ladungen, Aura-Schmiede mit
  beliebig vielen Rezepten aus der Konfiguration.
- Aktive-Effekte-Menü mit Live-Timern und Badge, Rebirth-Menü mit Ist/Soll, Warnung und
  Bestätigung.
- 33 Erfolge mit Belohnungen, 3 tägliche Aufträge aus 12 Vorlagen, 4 Dauerauftrag-Ketten,
  Statistik-Seite, Sammlung mit Filter, Sortierung, Neu-Markierung und Live-Vorschau.
- Simulierter globaler Feed (klar gekennzeichnet), Tutorial, Einstellungen (Reveal, Cutscenes,
  Überspringen, Lautstärken, Stumm, VFX-Qualität, Effekte reduzieren, Vibration, Feed,
  Vollbild, Export/Import/Löschen).

**Technik und Qualität**
- Vite + TypeScript + Preact, saubere Trennung: reine Logik (`core`), Zustand mit Events
  (`store`), Ablauf (`game`), Rendering (`render`), Audio, UI. Alle Zahlen in `src/config`.
- Speicherstand mit Version, Migrationen, Bereinigung, Backup-Slot, Autosave, Export-Code.
- Zeitbasiertes über absolute Zeitstempel; AFK-Nachholen (Hintergrund 100 %, geschlossen 50 %,
  max. 8 h) mit Zusammenfassung.
- 66 Unit-Tests (RNG, Roll-Modell, Stapelregeln, Buffs, Crafting, Shop-Rotation, Rebirth,
  Speicherstand, Biome, Offline, Formatierung, Cutscene-Zeitkurve), 3 Playwright-Szenarien auf
  Handy- und Desktop-Viewport (kompletter Spielablauf bis Reload, Export/Import, beschädigter
  Speicherstand).
- Balancing-Skript mit Monte-Carlo (5 Mio. Rolls je Luck-Stufe) und Spieler-Simulation auf der
  echten Engine → `BALANCING.md`.
- Dauerlauf: 4 Minuten Auto Roll mit der aufwendigsten Aura, Speicher stabil (ca. 4,8 MB Heap),
  konstant 60 FPS im Test-Browser, keine Konsolenfehler.

## Wichtigste Entscheidungen (Details in DECISIONS.md)

- Roll-Modell normiert so, dass „1 in X“ bei Luck 1 exakt stimmt; Staub erhält den Rest
  (1 in 2,6 statt 2,5).
- Neue häufige Auren nur in Biomen, damit die Chancen des Prototyps unverändert bleiben.
- Quick Roll überspringt Animation und Spannungsphase, behält aber den Roll-Zyklus
  (umschaltbar über `GAME.roll.quickFactor`).
- Rebirth: R1 = 400 Gold + 5 Eklipse + 2 Urlicht, R2 = 4.000 Gold + 3 Singularität +
  1 Ewigkeit, R3 = 30.000 Gold + 3 Ewigkeit + 1 Quasar. Simuliert: R1 nach 2,5–4,5 h,
  R3 nach 32–69 h Auto Roll.
- Ladungs-Tränke verbrauchen nur dann eine Ladung, wenn sie im Roll tatsächlich gewirkt haben.
- `Plop` ohne die 70 ms Stille am Anfang (sonst hörbar verzögert), Deep Boom unverändert.

## Bekannt / offen

- **Nur in Chromium getestet.** In dieser Umgebung gibt es keinen Safari- oder Firefox-Browser
  und kein echtes Handy. Die verwendeten Funktionen (Canvas 2D, Web Audio, `color-mix`,
  Fullscreen-API mit Fallback) sind breit unterstützt, aber Audio auf iOS und die Bildrate auf
  einem mittleren Handy sollten einmal von Hand geprüft werden. Bei Ruckeln hilft die
  VFX-Qualität „Mittel“ oder „Niedrig“.
- **Balancing ist simuliert, nicht gespielt.** Die Zielzeiten stammen aus zwei Spielerprofilen.
  Echte Spieler werden abweichen; alle Werte sind in `src/config/` anpassbar, `npm run balance`
  zeigt die Auswirkung.
- Wer aktiv braut, kann Glücks- und Geschwindigkeitstrank fast dauerhaft laufen lassen, weil die
  Zutaten schneller anfallen als sie verbraucht werden. Das ist mit den unveränderten Rezepten des
  Prototyps so; falls das zu stark ist, wären höhere Zutatenmengen der einfachste Hebel.
- Es gibt nur zwei Schmiede-Rezepte (wie vorgegeben); das System nimmt beliebig viele auf.
- Gedrückt halten zum Dauer-Rollen gibt es per Leertaste, auf Touch-Geräten nicht (dafür Auto Roll).
- `npm audit` meldet eine Schwachstelle in `tinypool`, einer Abhängigkeit von Vitest. Betrifft nur
  die Entwicklungswerkzeuge, nicht die ausgelieferte Datei.
