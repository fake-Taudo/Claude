# Flugmaschine (`flying-machine`)

> Truppe · Flieger, Fernkampf · 4 Elixier · Herkunft: Werkstatt · Familie: Mechanisch · Größe M (1,70 Felder)

## Konzept

Die Flugmaschine ist ein Ornithopter aus Segeltuch-Schlagflügeln mit Holzrippen und einem kleinen Teekessel-Dampfantrieb. Eine Pilotin mit Fliegerkappe kurbelt, und vorn sitzt eine kleine Bugkanone. Sie ist ein fliegender Geschützturm mit großer Reichweite.

## Eigenständigkeit

Schlagflügel aus Segeltuch (keine Propeller-Tragflächen) und eine kurbelnde Pilotin sind einmalig; die Silhouette ist eine breite Fledermaus-Form aus Stoff. Flieger anderer Spiele sind Holz-Doppeldecker; dieser ist ein Schlagflügler mit Kessel.

## Silhouette, Proportionen, Größe

- **Familie:** Mechanisch (kantige Maschinenteile: Kessel, Kolben, Rohre, Räder)
- **Silhouette:** Sehr breit: zwei geschwungene Segeltuchflügel mit Rippen, in der Mitte ein schmaler Holzrumpf mit Kessel und Pilotin.
- **Proportionsformel:** Kopf 0,20 · Beine 0,00 · Arme 0,60 · Hände 0,40 · Waffe/Signature 1,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Flügelspannweite doppelt so groß wie die Höhe
- **Größenklasse:** M, 1,70 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#e5d3a8` | Segeltuch-Leinen (Flügel) |
| Akzent | `#5b8c5a` | Lindgrün (Rahmen, Kessel) |
| Schatten | `#a59b8c` · Tiefe `#757177` | Hauptfarbe unten rechts, Falten (Akzent: `#476b57`) |
| Licht · Glanz | `#eedeb8` · `#f8f4e8` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#6c6360` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Flügelstreifen, Pilotenschal; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Holzrippen | `#8a5a32` | Materialfarbe |
| Messingkessel | `#c8a046` | Materialfarbe |
| Fliegerkappe | `#5a3a28` | Materialfarbe |

## Signature-Element

**Schlagflügel aus Segeltuch mit Holzrippen** (Flügel als Merkmal). Zwei Schlagflügel aus Segeltuch mit fünf Holzrippen, die wie Fledermausflügel auf- und abschlagen.

## Details

- **Kleidung und Rüstung:** Pilotin mit Lederkappe, Schutzbrille und Schal
- **Materialien:** Leinen, Holz, Messing, Leder
- **Muster und Nähte:** Nähte zwischen den Rippen, Flicken im Tuch
- **Schnallen, Nieten und Gravuren:** Spannschnüre, Messingösen
- **Abnutzung:** Rußfahne vom Kessel
- **Accessoires:** Flügelstreifen und Pilotenschal (Teamzonen)

## Gesicht und Ausdruck

Pilotin mit runden Brillengläsern, Zunge im Mundwinkel, konzentriertem Blick; beim Schuss kneift sie die Augen zu. Persönlichkeit: Pilotin mit Zunge im Mundwinkel.

## Waffe / Werkzeug

Kleine Bugkanone aus Messing auf einem Drehzapfen.

## Animationen

**Idle**

- Flügel schlagen gleichmäßig mit `char.flap`, Kessel dampft
- Pilotin kurbelt

**Laufen**

- schnellerer Flügelschlag, leichtes Neigen nach vorn

**Angriff**

- Kanone zielt (Anticipation), Schuss mit Rückstoß, das Gestell ruckt

**Treffer**

- Tuch reißt kurz auf, die Pilotin duckt sich

**Erscheinen**

- fliegt mit kräftigem Schlag ein

**Tod**

- Flügel klappen zusammen, sie trudelt mit Rauch herab
