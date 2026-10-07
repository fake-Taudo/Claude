# Koboldriese (`goblin-giant`)

> Truppe · Gebäudejäger, Tank, Nahkampf · 6 Elixier · Herkunft: Kobolde · Familie: Massig · Größe XL (2,75 Felder)

## Konzept

Der Koboldriese ist ein tumber, gutmütiger Riesenkobold mit Ohrringen groß wie Fassreifen. Auf dem Rücken trägt er ein Fass als Krähennest, in dem zwei Speerkobolde sitzen und unabhängig werfen. Fällt er, springen sie ab.

## Eigenständigkeit

Ein Fass-Krähennest mit zwei Passagieren auf dem Rücken ist eine einzigartige Rücken-Silhouette; die Speerkobolde darin zanken sich. Andere Riesen haben Mütze, Kanone oder Tafel. Riesenkobolde anderer Spiele tragen Rucksäcke; dieser trägt ein Fass mit Fähnchen.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig mit grünem Kopf und riesigen Ohren; das Fass ragt über den Kopf, oben zwei kleine Köpfe mit Speeren.
- **Proportionsformel:** Kopf 0,22 · Beine 0,20 · Arme 1,10 · Hände 0,70 · Waffe/Signature 0,45 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Riesenohren mit Ohrringen wie Fassreifen
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#6f8f3a` | Olivgrün (Haut) |
| Akzent | `#c08a4a` | Fassholz-Braun |
| Schatten | `#556d41` · Tiefe `#415346` | Hauptfarbe unten rechts, Falten (Akzent: `#8c694c`) |
| Licht · Glanz | `#a0b16f` · `#dae2cc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#3d4834` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Krähennest-Fähnchen, Gürtel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Haut | `#6f8f3a` | Hautton |
| Lederhose | `#5a4a3a` | Materialfarbe |
| Fassreifen | `#7a7a80` | Materialfarbe |

## Signature-Element

**Fass-Krähennest mit zwei Speerkobolden** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Fass mit Ausguck-Rand, kleiner Fahnenstange und zwei Speerkobolden darin.

## Details

- **Kleidung und Rüstung:** Lederhose mit Gürtel, Tragegurte, nackter Bauch
- **Materialien:** Fassholz, Leder, Eisen
- **Muster und Nähte:** Fassdauben, Gurtnähte
- **Schnallen, Nieten und Gravuren:** Eisenreifen, Gurtschnallen
- **Abnutzung:** Flicken am Fass
- **Accessoires:** Krähennest-Fähnchen und Gürtel (Teamzonen), Ohrringe wie Fassreifen

## Gesicht und Ausdruck

Großes, freundlich-dummes Gesicht mit schiefem Grinsen, Zahnlücken und hängenden Lidern. Persönlichkeit: tumb und gutmütig, grinst schief.

## Waffe / Werkzeug

Fäuste; oben werfen die Speerkobolde.

## Animationen

**Idle**

- die Speerkobolde zanken sich, er schaut nach oben

**Laufen**

- schwerer Gang mit `char.step`, Fass schaukelt

**Angriff**

- schwerer Schwinger mit der Faust (Anticipation weit hinten)

**Treffer**

- Fass wackelt, die Kobolde klammern sich fest

**Erscheinen**

- landet, die Kobolde ploppen hoch

**Tod**

- fällt vornüber, die Kobolde springen ab

## Besonderheiten

- **Evolution:** Kobold-Sack-Evo: Ein großer Sack voller strampelnder Kobolde hängt am Gürtel, das Fass ist eisenbeschlagen, dazu ein Kriegsbemalungs-Streifen. Unter halbem Leben wirft er Kobolde aus dem Sack, Strohhalme bilden die Partikelhülle.
