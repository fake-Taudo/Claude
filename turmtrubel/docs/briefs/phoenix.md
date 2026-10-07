# Phönix (`phoenix`)

> Truppe · Flieger, Nahkampf · 4 Elixier · Herkunft: Tiere und Drachen · Familie: Geflügelt · Größe M (1,90 Felder)

## Konzept

Der Phönix ist ein stolzer, feuriger Vogel in Gold-Orange mit einem Flammenkamm und langen Schleppfedern, die wie Flammenbänder flattern. Stirbt er, explodiert er und wird zum Ei; schlüpft es, kehrt er als Küken zurück.

## Eigenständigkeit

Die Flammenband-Schleppfedern und der Flammenkamm sind einmalig; drei Formen (Vogel, Ei, Küken) hat sonst niemand. Feuervögel anderer Spiele sind rot; dieser ist gold mit rosa Spitzen.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Vogel mit weiten Flügeln und drei langen geschwungenen Schwanzbändern.
- **Proportionsformel:** Kopf 0,26 · Beine 0,20 · Arme 0,40 · Hände 0,40 · Waffe/Signature 1,20 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Flammenkamm
- **Größenklasse:** M, 1,90 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#ffb02e` | Feuergold |
| Akzent | `#e0306f` | Rosenrot (Spitzen) |
| Schatten | `#b78339` · Tiefe `#806241` | Hauptfarbe unten rechts, Falten (Akzent: `#a22c65`) |
| Licht · Glanz | `#ffc767` · `#ffeac9` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#77552f` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Fußring; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Schnabel | `#f0c040` | Materialfarbe |

## Signature-Element

**Schleppfedern wie Flammenbänder** (Körpermerkmal (Bauch, Schädel, Ohren, Krater …)). Drei lange Schleppfedern, die wie Flammenbänder wehen.

## Details

- **Kleidung und Rüstung:** keine
- **Materialien:** Federn, Feuer
- **Muster und Nähte:** Federreihen mit Flammenspitzen
- **Schnallen, Nieten und Gravuren:** keine
- **Abnutzung:** keine
- **Accessoires:** Fußring (Teamzone)

## Gesicht und Ausdruck

Stolzer Blick, gebogener Schnabel und Flammenaugenbrauen. Persönlichkeit: stolz und feurig.

## Waffe / Werkzeug

Krallenhieb im Flug.

## Animationen

**Idle**

- Federn lodern, Kopfnicken

**Laufen**

- gleitender Flug mit `char.flap`

**Angriff**

- Krallenhieb im Sturz

**Treffer**

- Federn stieben

**Erscheinen**

- steigt aus Flammen

**Tod**

- explodiert in Flammen und wird zum Ei

## Besonderheiten

- **Form „egg“:** Ei: glühendes Ei mit Rissen, das pulsiert und schlüpft.
- **Form „reborn“:** Küken: flaumiges Küken mit kleinem Flammenkamm, das zum Phönix heranwächst.
