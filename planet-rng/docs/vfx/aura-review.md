# Aura-VFX: Prüfliste je Aura

Erzeugt mit `npm run vfx:review` aus den Specs in `src/config/vfx/specs/` (und, falls
vorhanden, den Messwerten aus `docs/vfx/perf.json`, erzeugt mit `scripts/dev/perf.mjs`).
Nicht von Hand bearbeiten.

Prüfspalten (✓ erfüllt, ✗ verletzt, – für die Stufe nicht verlangt), in dieser Reihenfolge:
Hero mit eigenem Motiv · Boden (ab V1) · Gegenlicht-Rauch (ab V2) · vertikales Element (ab V2) ·
Akzent alle 5–9 s (ab V2) · Partikelbudget · Schichtbudget.

Partikel: dauerhaft + zusätzlich beim Akzent / Budget der Stufe (mit Akzent bis 135 %). Schichten: stehende
Schichten (ohne reine Akzent-Schichten) / Budget + 2 Stützschichten. Kosten: ms pro Bild auf Hoch / Niedrig im Headless-Chromium
mit Software-Rasterung (390×844, DPR 2 bei Hoch); relativ vergleichen, echte Geräte sind schneller.
Equip: ms für Anlegen und erstes Bild mit kaltem Textur-Cache (nach einem Wurf vorgebacken).

## V0 – Gewöhnlich

Ausdehnung 1,2 D, bis 20 Partikel, 3 Schichten, Intro 0,5 s, Dimmung 2 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Staub | Staubwolke (`dust-cloud`) | Bodendunst | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s (Windstoß) | – | 20+6 / 20 | 5 / 3+2 | 22,4 / 6,6 | 13 | ✓ – – – – ✓ ✓ |
| Moos | Leuchtsporen (`glow-spores`) | Moos-Kringel | 4,0°/s, Atmen 0,18 Hz | alle 7–9 s | – | 18+6 / 20 | 3 / 3+2 | 20,1 / 5,7 | 24 | ✓ – – – – ✓ ✓ |

## V1 – Ungewöhnlich

Ausdehnung 1,6 D, bis 40 Partikel, 4 Schichten, Intro 0,5 s, Dimmung 6 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Flut | Wellenband (`tide-band`) | Wellenringe | 5,0°/s, Atmen 0,20 Hz | alle 6–9 s | – | 22+12 / 40 | 4 / 4+2 | 33,1 / 9,4 | 17 | ✓ ✓ – – – ✓ ✓ |
| Asche | Glutsäule (`ember-column`) | Glutriss-Ring | 4,0°/s, Atmen 0,20 Hz | alle 6–9 s | – | 26+14 / 40 | 5 / 4+2 | 34,3 / 9,9 | 46 | ✓ ✓ – – – ✓ ✓ |
| Sternschnuppe | Sternschnuppen (`shooting-stars`) | Sternstaub-Teich | 4,0°/s, Atmen 0,20 Hz | alle 6–9 s | – | 14+0 / 40 | 3 / 4+2 | 31,1 / 7,7 | 14 | ✓ ✓ – – – ✓ ✓ |
| Nebelschleier | Schleier (`mist-veil`) | Nebelsee | 4,0°/s, Atmen 0,15 Hz | alle 7–9 s | – | 0+0 / 40 | 4 / 4+2 | 34,7 / 8,8 | 103 | ✓ ✓ – – – ✓ ✓ |

## V2 – Selten

Ausdehnung 2,2 D, bis 80 Partikel, 6 Schichten, Intro 1,2 s, Dimmung 14 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Frost | Eiskristalle (`orbit-crystals`) | Eissigil | 6,0°/s, Atmen 0,20 Hz | alle 6–8 s (Frostwelle) | Frostschein | 24+18 / 80 | 7 / 6+2 | 38,3 / 11,3 | 47 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Raureif | Frostkrone (`frost-crown`) | Gefrorener Boden | 4,0°/s, Atmen 0,16 Hz | alle 6–9 s | Kältelicht | 30+16 / 80 | 5 / 6+2 | 37,3 / 9,8 | 45 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Sonnenwind | Bugstoßwelle (`bow-shock`) | Windspur | 5,0°/s, Atmen 0,22 Hz | alle 5–8 s | Polarlicht Nord | 0+0 / 80 | 6 / 6+2 | 34,0 / 9,4 | 56 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Sturm | Gewitterwolke (`storm-cloud`) | Funkenring | 5,0°/s, Atmen 0,20 Hz | alle 6–9 s (Einschlagswelle) | Blitzeinschlag | 40+0 / 80 | 4 / 6+2 | 37,7 / 9,1 | 28 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |

## V3 – Episch

Ausdehnung 3,0 D, bis 140 Partikel, 8 Schichten, Intro 1,2 s, Dimmung 24 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Sonnenkern | Sonne (`small-sun`) | Lichtfeld | 4,0°/s, Atmen 0,20 Hz | alle 6–8 s (Flare-Welle) | Hitzesäule | 70+24 / 140 | 6 / 8+2 | 52,9 / 14,4 | 58 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Nebula | Gasnebel (`gas-nebula`) | Sternenstaub-Teppich | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s (Supernova-Funkeln) | Gassäule | 80+0 / 140 | 8 / 8+2 | 45,2 / 13,1 | 157 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Prisma | Prisma (`light-prism`) | Regenbogen-Kaustik | 4,0°/s, Atmen 0,20 Hz | alle 6–8 s | Prisma | 66+20 / 140 | 5 / 8+2 | 42,8 / 11,2 | 71 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Komet | Komet (`great-comet`) | Eisring | 5,0°/s, Atmen 0,20 Hz | alle 6–9 s | Eisstaub | 64+16 / 140 | 6 / 8+2 | 42,9 / 13,0 | 20 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Irrlicht | Irrlichter (`will-o-wisps`) | Leuchtende Wellen | 3,0°/s, Atmen 0,18 Hz | alle 7–9 s | Nebelsäule | 30+0 / 140 | 6 / 8+2 | 46,0 / 11,7 | 30 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |

## V4 – Legendär, Mythisch

Ausdehnung 3,8 D, bis 220 Partikel, 10 Schichten, Intro 2,0 s, Dimmung 36 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Eklipse ⟨Schattenwandler⟩ | Schwarze Sonne (`black-sun`) | Schattenscheibe | 2,0°/s, Atmen 0,15 Hz | alle 7–9 s | Polarstrahlen | 60+20 / 220 | 7 / 10+2 | 53,6 / 17,1 | 83 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Saturnring ⟨Ringträger⟩ | Ringsystem (`banded-rings`) | Ringschatten | 4,0°/s, Atmen 0,15 Hz | alle 6–9 s | Sonnenschacht | 60+0 / 220 | 7 / 10+2 | 46,5 / 13,4 | 92 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Finsternis ⟨Schattenmond⟩ | Schattenmond (`shadow-crescent`) | Blutkreis | 3,0°/s, Atmen 0,16 Hz | alle 6–9 s | Blutschein | 50+20 / 220 | 7 / 10+2 | 53,0 / 17,6 | 82 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Pulsar ⟨Leuchtfeuer⟩ | Leuchtturm-Strahlen (`lighthouse-beams`) | Sternenstaub | 4,0°/s, Atmen 0,20 Hz | alle 6 s (Sternblitzen) | Leuchtturm-Strahlen | 60+26 / 220 | 9 / 10+2 | 44,8 / 12,6 | 69 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Meteorit ⟨Einschlag⟩ | Meteor (`impact-meteor`) | Glutkrater | 4,0°/s, Atmen 0,20 Hz | alle 7,5–8,5 s (Einschlagswelle) | Glutsäule | 40+50 / 220 | 9 / 10+2 | 43,3 / 14,0 | 39 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Gezeitenmond ⟨Gezeitenhüter⟩ | Wasserhülle (`tidal-shell`) | Gezeitenringe | 4,0°/s, Atmen 0,15 Hz | alle 7–9 s | Gezeitentropfen | 64+20 / 220 | 7 / 10+2 | 49,6 / 13,9 | 23 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Diamantherz ⟨Unzerbrechlich⟩ | Herz-Diamant (`heart-diamond`) | Kristallring | 5,0°/s, Atmen 0,20 Hz | alle 6–8 s | Brechungssäule | 74+30 / 220 | 7 / 10+2 | 49,2 / 18,5 | 63 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Sternbild ⟨Sterndeuter⟩ | Tierkreis-Scheibe (`zodiac-wheel`) | Sternkarte | 3,0°/s, Atmen 0,16 Hz | alle 7–9 s | Himmelsachse | 60+0 / 220 | 6 / 10+2 | 59,0 / 13,5 | 33 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Polarlicht ⟨Nordlicht⟩ | Polarlicht-Vorhänge (`aurora-curtains`) | Eisspiegel | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s | Polarlicht-Vorhänge | 90+20 / 220 | 6 / 10+2 | 52,2 / 14,5 | 30 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Urlicht ⟨Der Erleuchtete⟩ | Heiligenschein-Mandala (`halo-mandala`) | Boden-Mandala | 5,0°/s, Atmen 0,18 Hz | alle 6–8 s (Akzent-Welle) | Lichtsäule | 64+16 / 220 | 12 / 10+2 | 72,6 / 21,5 | 109 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Sternenfeuer ⟨Sternenglut⟩ | Feuerring (`fire-hoop`) | Glutkreis | 4,0°/s, Atmen 0,20 Hz | alle 6–8 s (Flammenwelle) | Hitzesäule | 100+30 / 220 | 6 / 10+2 | 48,7 / 13,3 | 34 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Phönix ⟨Wiedergeboren⟩ | Feuervogel (`firebird`) | Aschekreis | 4,0°/s, Atmen 0,20 Hz | alle 7–9 s | Feuervogel | 80+30 / 220 | 6 / 10+2 | 52,7 / 11,8 | 28 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Koronaauswurf ⟨Sonnenzorn⟩ | Plasma-Bogen (`plasma-loop`) | Magnetwellen | 4,0°/s, Atmen 0,20 Hz | alle 6–8 s (Auswurfwelle) | Plasma-Bogen | 60+30 / 220 | 5 / 10+2 | 47,6 / 15,9 | 22 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |

## V5 – Göttlich, Transzendent, Galaktisch

Ausdehnung 4,8 D, bis 320 Partikel, 12 Schichten, Intro 2,0 s, Dimmung 48 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Singularität ⟨Der Unausweichliche⟩ | Schwarzes Loch (`oblique-black-hole`) | Spiral-Sog | 5,0°/s, Atmen 0,15 Hz | alle 6–8 s (Implosion) | Gravitationsfaden | 170+30 / 320 | 8 / 12+2 | 70,1 / 15,5 | 161 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Akkretion ⟨Verschlinger⟩ | Gezeitenstrom (`tidal-disruption`) | Glutscheibe | 5,0°/s, Atmen 0,18 Hz | alle 6–8 s (Gezeitenblitz) | Gezeitenstrom, Jetspur | 140+30 / 320 | 7 / 12+2 | 52,2 / 15,4 | 110 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Blutmond ⟨Blutmond⟩ | Blutmond (`blood-full-moon`) | Blutlache | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s | Blutregen | 150+30 / 320 | 8 / 12+2 | 63,1 / 17,5 | 47 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Seraph ⟨Himmelswächter⟩ | Sechs Flügel (`six-wings`) | Sonnenrad | 4,0°/s, Atmen 0,15 Hz | alle 7–9 s (Segenswelle) | Himmelsstrahl | 110+40 / 320 | 7 / 12+2 | 65,4 / 19,3 | 72 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Zeitriss ⟨Zeitbrecher⟩ | Zeitriss (`space-rift`) | Zeitsiegel | 4,0°/s, Atmen 0,20 Hz | alle 6–8 s (Zeitbruch) | Zeitriss | 120+30 / 320 | 6 / 12+2 | 58,1 / 15,3 | 29 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Ewigkeit ⟨Ewig⟩ | Lemniskate (`infinity-light`) | Sechseck-Siegel | 4,0°/s, Atmen 0,15 Hz | alle 7–9 s | Zeitachse | 140+40 / 320 | 8 / 12+2 | 55,5 / 19,5 | 96 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Chronosphäre ⟨Herr der Zeit⟩ | Zifferblatt-Portal (`clock-portal`) | Zahnradsiegel | 3,0°/s, Atmen 0,16 Hz | alle 7–9 s (Glockenschlag) | Säule links | 100+20 / 320 | 7 / 12+2 | 56,0 / 14,9 | 63 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Ereignishorizont ⟨Jenseits⟩ | Gargantua (`lensed-horizon`) | Schwerkraft-Mulde | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s (Gravitationswelle) | Polarstrom | 160+0 / 320 | 6 / 12+2 | 51,5 / 14,2 | 110 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Quasar ⟨Strahlender Kern⟩ | Doppeljet (`twin-jets`) | Ringkorona | 5,0°/s, Atmen 0,20 Hz | alle 6–8 s | Doppeljet | 100+30 / 320 | 8 / 12+2 | 47,4 / 14,5 | 85 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Supernova ⟨Sternentod⟩ | Sternenhülle (`remnant-shell`) | Stoßfront | 3,0°/s, Atmen 0,20 Hz | alle 7,5–8,5 s (Druckwelle) | Neutronenjets | 90+60 / 320 | 6 / 12+2 | 57,6 / 14,9 | 127 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Andromeda ⟨Galaxienwanderer⟩ | Spiralgalaxie (`spiral-galaxy`) | Sternenhalo | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s | Galaktischer Jet | 80+30 / 320 | 7 / 12+2 | 61,4 / 15,6 | 267 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Magnetar ⟨Feldherr⟩ | Feldlinien (`dipole-field`) | Feldring | 5,0°/s, Atmen 0,20 Hz | alle 5–7 s (Sternbeben) | Feldlinien | 140+0 / 320 | 5 / 12+2 | 57,1 / 15,4 | 29 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |

## V6 – Universell, Uranfänglich, Entropisch, Paradox, Omniversal, Absolut, Unendlich

Ausdehnung 6,0 D, bis 450 Partikel, 14 Schichten, Intro 2,4 s, Dimmung 60 %.

| Aura | Hero (Motiv) | Boden | Bewegung | Akzent | Vertikal | Partikel | Schichten | Kosten Hoch/Niedrig (ms) | Equip (ms) | Prüfung |
|---|---|---|---|---|---|---|---|---|---|---|
| Multiversum ⟨Weltenspringer⟩ | Blasenuniversen (`bubble-universes`) | Dreiweltensiegel | 4,0°/s, Atmen 0,16 Hz | alle 6–8 s (Weltensprung) | Weltenachse | 260+80 / 450 | 9 / 14+2 | 63,5 / 16,9 | 165 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Kosmisches Netz ⟨Weber des Alls⟩ | Filamentnetz (`cosmic-web`) | Knotengitter | 4,0°/s, Atmen 0,18 Hz | alle 6–8 s (Impulswelle) | Hauptfilament | 260+60 / 450 | 8 / 14+2 | 68,3 / 17,5 | 75 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Urknall ⟨Der Anfang⟩ | Urknall (`big-bang`) | Glutkrater | 3,0°/s, Atmen 0,20 Hz | alle 7–9 s (Urknallwelle) | Urstrahl | 300+120 / 450 | 9 / 14+2 | 61,5 / 13,9 | 117 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Ursuppe ⟨Lebensfunke⟩ | Urzelle (`primordial-cell`) | Urtümpel | 3,0°/s, Atmen 0,20 Hz | alle 6–8 s (Lebensfunke) | Urzelle | 280+80 / 450 | 9 / 14+2 | 67,3 / 19,5 | 69 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Entropie ⟨Der Zerfall⟩ | Zerfallsgitter (`decaying-lattice`) | Bruchsiegel | 2,0°/s, Atmen 0,12 Hz | alle 7–9 s (Zerfallswelle) | Zerfallsregen | 280+90 / 450 | 9 / 14+2 | 66,8 / 15,8 | 73 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Wärmetod ⟨Das letzte Licht⟩ | Letzte Glut (`dying-ember`) | Raureif | 1,5°/s, Atmen 0,10 Hz | alle 8–9 s (Letzter Seufzer) | Kalter Schnee | 260+60 / 450 | 9 / 14+2 | 67,8 / 14,8 | 97 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Paradoxon ⟨Widerspruch⟩ | Spiegelringe (`mirror-rings`) | Spiegelsiegel | 4,0°/s, Atmen 0,18 Hz | alle 6–8 s (Umkehr) | Spiegelachse | 300+100 / 450 | 10 / 14+2 | 63,6 / 17,6 | 90 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Möbius ⟨Ohne Ende, ohne Seite⟩ | Möbiusband (`mobius-band`) | Einseitensiegel | 4,0°/s, Atmen 0,18 Hz | alle 6–8 s (Umstülpung) | Endlosstrom | 260+90 / 450 | 8 / 14+2 | 64,3 / 17,9 | 100 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Omniversum ⟨Allumfassend⟩ | Spektralmandala (`spectral-mandala`) | Regenbogenboden | 3,0°/s, Atmen 0,16 Hz | alle 7–9 s (Allwelle) | Spektralsäule | 300+100 / 450 | 10 / 14+2 | 69,5 / 19,4 | 170 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Schöpfung ⟨Schöpfer⟩ | Kosmischer Lotus (`cosmic-lotus`) | Lotusteich | 3,0°/s, Atmen 0,18 Hz | alle 7–9 s (Vollblüte) | Lichtsamen | 300+100 / 450 | 9 / 14+2 | 71,1 / 20,2 | 97 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Nullpunkt ⟨Null⟩ | Die Null (`zero-void`) | Nullgitter | 1,5°/s, Atmen 0,12 Hz | alle 8–9 s (Nullwelle) | Nulllinie | 150+60 / 450 | 8 / 14+2 | 51,1 / 14,1 | 40 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Archetyp ⟨Urform⟩ | Urformen (`platonic-solids`) | Konstruktionssiegel | 3,0°/s, Atmen 0,16 Hz | alle 6–8 s (Formwandel) | Urachse | 280+80 / 450 | 9 / 14+2 | 67,1 / 18,8 | 86 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Äon ⟨Zeitlos⟩ | Ouroboros (`ouroboros`) | Äonenspirale | 3,0°/s, Atmen 0,15 Hz | alle 7–9 s (Zeitwelle) | Zeitstrom | 310+80 / 450 | 9 / 14+2 | 70,8 / 18,8 | 89 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |
| Weltenkern ⟨Herz aller Welten⟩ | Weltenherz (`world-heart`) | Weltenrad | 3,0°/s, Atmen 0,20 Hz | alle 6–8 s (Herzschlag) | Herzstrahl | 290+150 / 450 | 9 / 14+2 | 85,7 / 23,4 | 171 | ✓ ✓ ✓ ✓ ✓ ✓ ✓ |

Alle 54 Auren erfüllen die Prüfliste.
