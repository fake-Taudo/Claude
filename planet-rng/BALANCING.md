# Balancing – Planet RNG

Erzeugt mit `npm run balance`. Alle Werte stammen aus der echten Spiellogik (`src/core`) und der Konfiguration (`src/config`).

## Zusammenfassung

Ziele aus der Vorgabe: Rebirth 1 nach einigen Stunden aktivem Spiel, Rebirth 3 nach vielen Tagen. Gold ist kostbar: gewöhnliche Auren bringen Bruchteile einer Münze, seltene Drops sind Jackpots.

| Profil | Rebirth 1 | Rebirth 2 | Rebirth 3 |
|---|---:|---:|---:|
| Aktiv (braut ständig) | 2,5 h | 11,6 h | 32,3 h |
| Gelegentlich (braut nie) | 4,5 h | 22,0 h | 69,3 h |

Angaben sind Stunden ununterbrochenes Auto Roll (Median). Ein Mensch verteilt das auf Tage: bei 2–3 Stunden am Tag liegt Rebirth 3 je nach Spielweise bei etwa 1–3 Wochen. Offline-Fortschritt (50 % Effizienz, max. 8 h) verkürzt das zusätzlich.

**Was wurde gegenüber dem Prototyp geändert?**

- Luck-Modell: `min(1, Luck · c_i)` von selten nach häufig statt `chance^(1/Luck)`. Die Verteilung summiert sich exakt auf 100 % (siehe Abschnitt 1).
- Verkaufspreise ≈ `0,0062 · Odds^0,6` (Staub 0,01 bis Weltenkern 3.000). Etwa 80 Gold pro Stunde am Anfang, über 700 Gold pro Stunde nach Rebirth 3 mit Gauntlet.
- Rebirth-Anforderungen: R1 = 400 Gold + 5× Eklipse + 2× Urlicht; R2 = 4.000 Gold + 3× Singularität + 1× Ewigkeit; R3 = 30.000 Gold + 3× Ewigkeit + 1× Quasar. Der Prototyp verlangte 20 Ewigkeit (1 in 100.000) für Rebirth 1, das wären Millionen Rolls gewesen.
- Shop-Preise des Prototyps (15/15/100/1.000) bleiben. Neu: Sonnenphiole (40), Chrono-Sanduhr (60), Kometen-Kompass (400) als Zwischenstufe vor dem Gauntlet.
- Tränke: Rezepte und Wirkungen unverändert. Wer aktiv braut, hält Glücks- und Geschwindigkeitstrank praktisch dauerhaft aktiv (die Zutaten fallen beim Rollen schneller an, als sie verbraucht werden). Das ist der Bonus für aktives Spielen.

## 1. Verteilung und erwartete Rolls

Exakt berechnet (Basis-Pool, ohne Biom). „Rolls bis …“ = erwartete Anzahl Rolls bis zur ersten Aura **dieser Stufe oder seltener**.

| Stufe | Luck 1x | Luck 1,5x | Luck 2x | Luck 3x | Luck 10x | Luck 100x | Luck 500x |
|---|---:|---:|---:|---:|---:|---:|---:|
| Gewöhnlich | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Ungewöhnlich | 3 | 2 | 2 | 1 | 1 | 1 | 1 |
| Selten | 8 | 6 | 4 | 3 | 1 | 1 | 1 |
| Episch | 26 | 17 | 13 | 9 | 3 | 1 | 1 |
| Legendär | 146 | 98 | 73 | 49 | 15 | 2 | 1 |
| Mythisch | 1.237 | 825 | 619 | 413 | 124 | 13 | 3 |
| Göttlich | 7.066 | 4.711 | 3.533 | 2.356 | 707 | 71 | 15 |
| Transzendent | 38.509 | 25.673 | 19.255 | 12.836 | 3.851 | 385 | 77 |
| Galaktisch | 107.510 | 71.673 | 53.755 | 35.837 | 10.751 | 1.075 | 215 |
| Universell | 487.448 | 324.966 | 243.724 | 162.483 | 48.745 | 4.875 | 975 |
| Uranfänglich | 1.330.672 | 887.115 | 665.336 | 443.558 | 133.068 | 13.307 | 2.662 |
| Entropisch | 3.976.143 | 2.650.762 | 1.988.072 | 1.325.381 | 397.615 | 39.762 | 7.953 |
| Paradox | 11.787.819 | 7.858.546 | 5.893.910 | 3.929.273 | 1.178.782 | 117.879 | 23.576 |
| Omniversal | 50.420.168 | 33.613.445 | 25.210.084 | 16.806.723 | 5.042.017 | 504.202 | 100.841 |
| Absolut | 206.896.552 | 137.931.035 | 103.448.276 | 68.965.517 | 20.689.655 | 2.068.966 | 413.793 |
| Unendlich | 1.000.000.000 | 666.666.667 | 500.000.000 | 333.333.333 | 100.000.000 | 10.000.000 | 2.000.000 |

Monte Carlo, 5.000.000 Rolls bei Luck 1x (2.9 s). Summe der exakten Wahrscheinlichkeiten: 100.0000000000 %

| Stufe | exakt | simuliert | Abweichung (σ) |
|---|---:|---:|---:|
| Gewöhnlich | 64,1 % | 64,1 % | 1.17 |
| Ungewöhnlich | 24 % | 24 % | -1.01 |
| Selten | 8 % | 8 % | -1.00 |
| Episch | 3,2 % | 3,2 % | 0.72 |
| Legendär | 0,6 % | 0,6 % | -0.12 |
| Mythisch | 0,1 % | 0,1 % | -0.11 |
| Göttlich | 0 % | 0 % | 2.55 |
| Transzendent | 0 % | 0 % | 0.51 |
| Galaktisch | 0 % | 0 % | -0.21 |
| Universell | 0 % | 0 % | -0.59 |

Monte Carlo, 5.000.000 Rolls bei Luck 3x (5.4 s). Summe der exakten Wahrscheinlichkeiten: 100.0000000000 %

| Stufe | exakt | simuliert | Abweichung (σ) |
|---|---:|---:|---:|
| Gewöhnlich | 20,2 % | 20,2 % | 1.67 |
| Ungewöhnlich | 47,3 % | 47,2 % | -1.83 |
| Selten | 21,2 % | 21,3 % | 1.61 |
| Episch | 9,3 % | 9,3 % | -1.40 |
| Legendär | 1,8 % | 1,8 % | -0.38 |
| Mythisch | 0,2 % | 0,2 % | 1.42 |
| Göttlich | 0 % | 0 % | -0.60 |
| Transzendent | 0 % | 0 % | -0.89 |
| Galaktisch | 0 % | 0 % | -0.55 |
| Universell | 0 % | 0 % | -1.47 |
| Uranfänglich | 0 % | 0 % | 0.91 |

## 2. Gold pro Stunde (alles verkaufen, Auto Roll)

Biome sind 27,7 % der Zeit aktiv; zeitlich gemittelt ergibt das 1,13x Glück und 1,01x Tempo. Der Glücks-Roll (jeder 10.) wirkt im Mittel wie 1,1x.

| Situation | Glück | Rolls/h | Gold/Roll | Gold/h |
|---|---:|---:|---:|---:|
| Start (kein Bonus) | 1,24x | 3.226 | 0,0246 | 79 |
| Rebirth 1 | 1,55x | 4.193 | 0,0415 | 174 |
| Rebirth 1 + Kometen-Kompass | 2,02x | 5.032 | 0,0479 | 241 |
| Rebirth 2 + Quantum-Gauntlet | 3,04x | 8.185 | 0,0700 | 573 |
| Rebirth 3 + Quantum-Gauntlet | 3,26x | 9.032 | 0,0830 | 750 |

Zeit bis zu Shop-Zielen allein aus Verkäufen (Start, ohne Ausgaben):

| Item | Preis | Zeit |
|---|---:|---:|
| Geschwindigkeits-Amulett | 15 | 11 Min. |
| Glücks-Amulett | 15 | 11 Min. |
| Sonnenphiole | 40 | 30 Min. |
| Chrono-Sanduhr | 60 | 45 Min. |
| Verlorenes Amulett | 100 | 1 Std. 15 Min. |
| Kometen-Kompass | 400 | 5 Std. 2 Min. |
| Quantum-Gauntlet | 1000 | 12 Std. 35 Min. |

Der Quantum-Gauntlet erscheint mit 3 % pro Rotation, also im Mittel alle 2 Std. 46 Min..

## 3. Spieler-Simulation

Läufe mit der echten Spiellogik (eigener Seed pro Lauf), Auto Roll ohne Pause. Biome, Glücks-Rolls, Shop-Rotation, Erfolge und Belohnungen laufen wie im Spiel. Beide Profile verkaufen alles Überzählige (Rebirth-Zutaten bleiben), kaufen Ausrüstung sobald bezahlbar und machen Rebirth sobald möglich.

- **Aktiv:** schaut jede Minute vorbei, braut und trinkt Sonnen-, Glücks- und Geschwindigkeitstränke, sobald möglich, kauft Amulette von Gold über der Rebirth-Rücklage.
- **Gelegentlich:** schaut alle 15 Minuten vorbei, braut nie (trinkt nur geschenkte Tränke), kauft nur Ausrüstung.

### Profil: Aktiv (14 Läufe, max. 160 h)

Rechenzeit: 48.4 s, 4.801.672 Rolls insgesamt.

| Ziel | Median | 10 % | 90 % | erreicht |
|---|---:|---:|---:|---:|
| Rebirth 1 (Stunden Auto Roll, kumuliert) | 2,5 | 1,7 | 3,1 | 14/14 |
| Rebirth 2 (Stunden Auto Roll, kumuliert) | 11,6 | 10,4 | 12,0 | 14/14 |
| Rebirth 3 (Stunden Auto Roll, kumuliert) | 32,3 | 31,4 | 36,8 | 14/14 |
| Erster Kauf: Kometen-Kompass | 4,9 h | 3,8 h | 6,2 h | 13/14 |
| Erster Kauf: Quantum-Gauntlet | 9,4 h | 6,7 h | 19,2 h | 14/14 |

Engpass-Analyse: Stunden seit dem vorherigen Rebirth, bis jede Anforderung erstmals erfüllt war (Median), und mittleres Glück pro Abschnitt.

| Rebirth | Anforderung | Median h | mittleres Glück |
|---|---|---:|---:|
| 1 | 400 Gold | 2,5 | 2,89x |
| 1 | 5× Eklipse | 0,2 |  |
| 1 | 2× Urlicht | 0,6 |  |
| 2 | 4.000 Gold | 8,7 | 7,61x |
| 2 | 3× Singularität | 1,1 |  |
| 2 | 1× Ewigkeit | 1,9 |  |
| 3 | 30.000 Gold | 21,2 | 11,69x |
| 3 | 3× Ewigkeit | 2,4 |  |
| 3 | 1× Quasar | 0,9 |  |

Median Gold verdient bis Ende: 35.831 · getrunkene Tränke: 4.450 · seltenste Aura (häufigster Wert): Ursuppe

### Profil: Gelegentlich (14 Läufe, max. 260 h)

Rechenzeit: 71.2 s, 6.896.301 Rolls insgesamt.

| Ziel | Median | 10 % | 90 % | erreicht |
|---|---:|---:|---:|---:|
| Rebirth 1 (Stunden Auto Roll, kumuliert) | 4,5 | 4,0 | 4,8 | 14/14 |
| Rebirth 2 (Stunden Auto Roll, kumuliert) | 22,0 | 20,0 | 23,5 | 14/14 |
| Rebirth 3 (Stunden Auto Roll, kumuliert) | 69,3 | 66,0 | 76,0 | 14/14 |
| Erster Kauf: Kometen-Kompass | 8,0 h | 7,0 h | 9,8 h | 12/14 |
| Erster Kauf: Quantum-Gauntlet | 19,3 h | 11,8 h | 35,8 h | 14/14 |

Engpass-Analyse: Stunden seit dem vorherigen Rebirth, bis jede Anforderung erstmals erfüllt war (Median), und mittleres Glück pro Abschnitt.

| Rebirth | Anforderung | Median h | mittleres Glück |
|---|---|---:|---:|
| 1 | 400 Gold | 4,5 | 1,43x |
| 1 | 5× Eklipse | 0,5 |  |
| 1 | 2× Urlicht | 1,5 |  |
| 2 | 4.000 Gold | 17,5 | 2,48x |
| 2 | 3× Singularität | 7,0 |  |
| 2 | 1× Ewigkeit | 11,5 |  |
| 3 | 30.000 Gold | 46,5 | 3,78x |
| 3 | 3× Ewigkeit | 11,5 |  |
| 3 | 1× Quasar | 7,3 |  |

Median Gold verdient bis Ende: 35.956 · getrunkene Tränke: 10 · seltenste Aura (häufigster Wert): Ursuppe

## 4. Wirkung der Tränke

Materialkosten = erwartete Rolls, um alle Zutaten parallel zu sammeln (bei Luck 1). „Zusatz-Glück“ = Rolls im Effekt × (Multiplikator − 1). Für die Einmal-Tränke: Chance, mit diesem einen Roll mindestens die genannte Stufe zu erhalten.

| Trank | Materialkosten (Rolls) | Effekt | Rolls im Effekt (Auto) | Zusatz-Glück | Mythisch+ im Effekt (erwartet) |
|---|---:|---|---:|---:|---:|
| Glückstrank | 33 | 1,5x Glück, 50 Rolls | 50 | 25 | 0,061 |
| Geschwindigkeitstrank | 20 | 1,5x Tempo, 30 s | 40 | 0 | 0,032 |
| Eclipse-Potion | 1.786 | 100x Glück, 1 Rolls | 1 | 99 | 0,078 |
| Sonnen-Trank | 1.667 | 3x Glück, 1,5x Tempo, 180 s | 240 | 480 | 0,582 |
| Göttlicher Trank | 100.000 | 500x Glück, 1 Rolls | 1 | 499 | 0,348 |

| Einmal-Trank | Legendär+ | Mythisch+ | Göttlich+ | Transzendent+ |
|---|---:|---:|---:|---:|
| Eclipse-Potion (100x) | 53,1 % | 7,8 % | 1,4 % | 0,3 % |
| Göttlicher Trank (500x) | 100 % | 34,8 % | 6,9 % | 1,3 % |

