# Kobolde (Held) (`goblins-hero`)

> Held · Nahkampf, Schwarm · 2 Elixier · Herkunft: Kobolde · Familie: Winzig · Größe S (1,40 Felder)
> Held von [`goblins`](goblins.md)

## Konzept

Die Kobolde als Helden sind eine kriegerische Bannerbrigade mit Kriegsbemalung und pflaumenbraunen Lederwesten. Jeder trägt ein Brigade-Banner auf dem Rücken. Fällt der letzte, rammt er das Banner in den Boden und ruft Verstärkung.

## Eigenständigkeit

Das Brigade-Banner auf dem Rücken ist ihr Rang-Merkmal; Löffeldolch und Riesenohren zeigen die Basis-Kobolde. Pflaumenbraun und Kriegsbemalung trennen sie farblich. Helden-Kobolde anderer Spiele tragen Helme; diese tragen Banner.

## Silhouette, Proportionen, Größe

- **Familie:** Winzig (kleiner Körper mit großem Kopf (Kopf mindestens 40 % der Höhe))
- **Silhouette:** Wie die Kobolde, dazu eine Bannerstange doppelt so hoch wie der Kobold.
- **Proportionsformel:** Kopf 0,46 · Beine 0,22 · Arme 0,80 · Hände 0,45 · Waffe/Signature 0,60 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Banner doppelt so hoch wie der Kobold
- **Größenklasse:** S, 1,40 Felder hoch, Außenkontur „dünn“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#533143` | Pflaumenbraun (Weste) |
| Akzent | `#ffd34d` | Goldgelb (Bannerspitze, Ringe) |
| Schatten | `#422d47` · Tiefe `#352a4a` | Hauptfarbe unten rechts, Falten (Akzent: `#b79b4e`) |
| Licht · Glanz | `#8d7375` · `#d2c9ce` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#322238` innen | Stufe 1 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Bannertuch, Halstuch; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Haut | `#7fae4a` | Hautton |
| Haut | `#7fae4a` | Materialfarbe |
| Kriegsbemalung | `#f2efe6` | Materialfarbe |

## Signature-Element

**Brigade-Banner auf dem Rücken** (Banner oder Fahne). Ein Banner an einer Stange mit Löffel als Spitze.

## Details

- **Kleidung und Rüstung:** Lederweste, Kriegsbemalung, Halstuch
- **Materialien:** Leder, Stoff, Zinn
- **Muster und Nähte:** Bemalungsstreifen
- **Schnallen, Nieten und Gravuren:** Bannerhalter
- **Abnutzung:** zerrissenes Banner
- **Accessoires:** Bannertuch und Halstuch (Teamzonen)

## Gesicht und Ausdruck

Kriegerisch-freches Grinsen mit Bemalung. Persönlichkeit: kriegerisch-frech, Kriegsbemalung.

## Waffe / Werkzeug

Löffeldolch; das Banner.

## Animationen

**Idle**

- Banner-Pose: schwenkt das Banner

**Laufen**

- Trippeln, das Banner flattert

**Angriff**

- Löffeldolch-Stich

**Treffer**

- Banner zuckt

**Erscheinen**

- landen mit wehenden Bannern

**Tod**

- fallen, das Banner sinkt

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Bannerbrigade: rammt das Banner in den Boden (Pose); Event `char.ability.goblins-hero`. Rang-Merkmal: Brigade-Banner.
- **Schwarm-Varianten:** wie Kobolde
