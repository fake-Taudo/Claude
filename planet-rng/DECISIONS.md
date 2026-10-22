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
