# Skelett-Fallschirmjäger (`skeletrooper`)

> Beschwörung · Nahkampf · Herkunft: Gruft · Familie: Winzig · Größe S (1,45 Felder)

## Konzept

Der Skelett-Fallschirmjäger ist ein tollkühner Kadett mit Fliegerbrille, Schal und Fallschirm-Packsack. Er springt aus dem Helden-Ballon auf Bodentruppen, landet mit dem Speer voran und kämpft weiter.

## Eigenständigkeit

Fallschirm-Packsack mit Reißleine und Fliegerbrille sind einmalig. Fallschirmspringer anderer Spiele sind Soldaten; dieser ist ein olivgrün eingekleidetes Skelett.

## Silhouette, Proportionen, Größe

- **Familie:** Winzig (kleiner Körper mit großem Kopf (Kopf mindestens 40 % der Höhe))
- **Silhouette:** Winzig mit Packsack auf dem Rücken und Speer, Brille auf dem Schädel.
- **Proportionsformel:** Kopf 0,44 · Beine 0,22 · Arme 0,80 · Hände 0,42 · Waffe/Signature 0,55 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Fliegerbrille über leeren Augenhöhlen
- **Größenklasse:** S, 1,45 Felder hoch, Außenkontur „dünn“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#6b7a3a` | Oliv (Overall, Packsack) |
| Akzent | `#e9dfc5` | Knochenweiß |
| Schatten | `#525e41` · Tiefe `#3f4a46` | Hauptfarbe unten rechts, Falten (Akzent: `#a8a3a0`) |
| Licht · Glanz | `#9da36f` · `#d9dccc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#3c3f34` innen | Stufe 1 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Fliegerschal, Packsack-Streifen; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Brille (Messing) | `#c8a046` | Materialfarbe |
| Fallschirm | `#f0e6d0` | Materialfarbe |

## Signature-Element

**Fallschirm-Packsack mit Reißleine** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Fallschirm-Packsack mit Reißleine; beim Sprung öffnet sich der Schirm.

## Details

- **Kleidung und Rüstung:** Overall, Fliegerbrille, Schal
- **Materialien:** Segeltuch, Leder, Knochen
- **Muster und Nähte:** Packsack-Nähte
- **Schnallen, Nieten und Gravuren:** Gurte mit Schnellverschluss
- **Abnutzung:** gerissene Leine
- **Accessoires:** Fliegerschal und Packsack-Streifen (Teamzonen)

## Gesicht und Ausdruck

Schädel mit Fliegerbrille und tollkühnem Grinsen. Persönlichkeit: tollkühn, salutiert.

## Waffe / Werkzeug

Kurzer Landungsspeer mit Knochenspitze und gerolltem Wimpel am Schaft.

## Animationen

**Idle**

- zieht an den Gurten

**Laufen**

- zackiger Schritt

**Angriff**

- Speerstöße

**Treffer**

- Brille rutscht

**Erscheinen**

- schwebt am Schirm herab, landet mit Speer voran (`char.land`)

**Tod**

- Schirm deckt ihn zu
