# Elixiergolem (`elixir-golem`)

> Truppe · Gebäudejäger, Nahkampf · 3 Elixier · Herkunft: Elementar · Familie: Massig · Größe XL (2,55 Felder)

## Konzept

Der Elixiergolem ist ein tumb-fröhlicher Riese aus einem großen Glaskolben voller blubberndem magentafarbenem Elixier mit einem Korken als Kopf. Er läuft zu Gebäuden, zerplatzt in zwei Golemiten und diese in Kleckse. Jeder Teil schenkt dem Gegner Elixier.

## Eigenständigkeit

Ein durchsichtiger Glasbauch mit Flüssigkeit und Blasen sowie der Korkkopf sind einmalig. Elixiergolems anderer Spiele sind pinke Steinwesen; dieser ist ein Glaskolben.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig, großer runder Bauch aus Glas, kleiner Korkkopf, Arme aus Glasröhren mit Messingmanschetten.
- **Proportionsformel:** Kopf 0,18 · Beine 0,20 · Arme 1,00 · Hände 0,60 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Korken als Kopf
- **Größenklasse:** XL, 2,55 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#d13cf0` | Elixier-Magenta |
| Akzent | `#e6f7ff` | Glasweiß |
| Schatten | `#9734bd` · Tiefe `#6c2f96` | Hauptfarbe unten rechts, Falten (Akzent: `#a6b3c7`) |
| Licht · Glanz | `#e17ae7` · `#f3ccfb` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#64267d` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Halsband, Korkensiegel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Kork | `#b8864a` | Materialfarbe |
| Messing | `#c8a046` | Materialfarbe |

## Signature-Element

**Glasbauch voller blubbernder Flüssigkeit** (Körpermerkmal (Bauch, Schädel, Ohren, Krater …)). Ein Glasbauch mit blubbernder Flüssigkeit, Blasen und Spiegelungen.

## Details

- **Kleidung und Rüstung:** Glaskörper, Korken, Messingbänder
- **Materialien:** Glas, Kork, Messing, Elixier
- **Muster und Nähte:** Blasen, Messskala am Bauch
- **Schnallen, Nieten und Gravuren:** Messingmanschetten
- **Abnutzung:** Kratzer im Glas
- **Accessoires:** Halsband und Korkensiegel (Teamzonen)

## Gesicht und Ausdruck

Gesicht auf dem Korken mit großen dummen Augen und blubberndem Mund. Persönlichkeit: tumb-fröhlich, blubbert.

## Waffe / Werkzeug

Glasfäuste mit Elixier.

## Animationen

**Idle**

- Blasen steigen, die Flüssigkeit schwappt

**Laufen**

- schwappender Gang mit `char.step`

**Angriff**

- schwappende Doppelfaust

**Treffer**

- Glas klirrt, Flüssigkeit spritzt

**Erscheinen**

- plumpst, die Flüssigkeit schwappt hoch

**Tod**

- zerplatzt in zwei Golemiten, Elixiertropfen
