# Megaritter (`mega-knight`)

> Truppe · Tank, Nahkampf, Flächenschaden · 7 Elixier · Herkunft: Krone · Familie: Massig · Größe XL (2,80 Felder)

## Konzept

Der Megaritter ist ein wuchtiger Koloss in schwerer Plattenrüstung mit einem Helm in Form einer Kirchenglocke, der bei jeder Landung dröhnend läutet. Statt Waffen trägt er riesige gusseiserne Kugelfäuste. Er springt auf Gegner und walzt alles platt.

## Eigenständigkeit

Der Glockenhelm mit Klöppel im Inneren ist ein klarer Kopf-Umriss, den niemand sonst hat; die Kugelfäuste ersetzen jede Waffe. Andere schwere Ritter tragen Hörner- oder Spitzhelme mit Keulen; dieser hat eine Glocke als Kopf und Kugeln als Hände.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Breiter Berg mit Glocke obenauf, die Schultern sind riesige Platten, die Fäuste zwei Kugeln fast in Kopfgröße, die Beine kurze dicke Säulen.
- **Proportionsformel:** Kopf 0,24 · Beine 0,20 · Arme 1,00 · Hände 0,80 · Waffe/Signature 0,00 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Kugelfäuste aus Gusseisen
- **Größenklasse:** XL, 2,80 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#5a6372` | Gusseisen-Grau (Rüstung) |
| Akzent | `#b07a3a` | Bronze (Glocke, Beschläge) |
| Schatten | `#464f67` · Tiefe `#38405f` | Hauptfarbe unten rechts, Falten (Akzent: `#815e41`) |
| Licht · Glanz | `#929494` · `#d4d6da` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#35364a` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schulterumhang, Helmband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Glockenklöppel | `#3a3d44` | Materialfarbe |
| Kettenrock | `#7a828e` | Materialfarbe |

## Signature-Element

**Glockenhelm, der beim Landen läutet** (Helm, Hut, Krone, Kapuze). Der Helm ist eine Bronzeglocke mit Sehschlitz und Klöppel; bei der Landung schwingt sie und erzeugt Klangringe.

## Details

- **Kleidung und Rüstung:** Glockenhelm, Brustpanzer wie ein Fass, Schulterplatten mit Nieten, Kettenrock, Plattenstiefel
- **Materialien:** Gusseisen, Bronze, Kettenringe
- **Muster und Nähte:** Nietenreihen, Glockeninschrift als Gravur
- **Schnallen, Nieten und Gravuren:** Gurte mit Doppelschnallen über der Brust
- **Abnutzung:** Rost an den Nieten, Dellen im Brustpanzer
- **Accessoires:** Schulterumhang und Helmband (Teamzonen)

## Gesicht und Ausdruck

Nur zwei glimmende Augen im Sehschlitz der Glocke, deren Form sich mit dem Ausdruck ändert: zufrieden geschwungen, im Angriff schmale Schlitze, getroffen kreisrund. Persönlichkeit: wuchtig und selbstgefällig.

## Waffe / Werkzeug

Zwei gusseiserne Kugelfäuste mit Fingerrillen und Bronzeringen am Handgelenk.

## Animationen

**Idle**

- lässt die Kugelfäuste aneinanderklacken
- Glocke summt leise beim Atmen

**Laufen**

- stampfender Gang mit `char.step`, Boden bebt

**Angriff**

- beide Fäuste hoch (Anticipation, Stretch), Doppelhammer nach unten (Squash)

**Treffer**

- Glocke dröhnt kurz, Körper schwankt

**Erscheinen**

- Landung mit `char.land`: Glocke läutet, Klangring breitet sich aus

**Tod**

- kippt vornüber, die Glocke rollt davon und verklingt

## Besonderheiten

- **Evolution:** Aufwärtshaken-Evo: Die rechte Kugelfaust wird zu einem Bronzefausthammer mit Raketenring, der Helm bekommt eine zweite, kleinere Glocke. Leuchtende Schallwellen dienen als Leuchtkanten, Klangfunken als Partikelhülle.
- **Sprung (`charge`/`JUMP`):** Knie tief, Sprung mit Stretch, Landung mit Glockenläuten.
