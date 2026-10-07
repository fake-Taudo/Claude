# Skelettdrachen (`skeleton-dragons`)

> Truppe · Flieger, Fernkampf, Flächenschaden · 4 Elixier · Herkunft: Gruft · Familie: Geflügelt · Größe M (1,75 Felder)

## Konzept

Die Skelettdrachen sind zwei gierige Knochendrachen mit zerfetzten Flügelhäuten und grünem Geisterfeuer im Brustkorb. Sie spucken grüne Feuerbälle mit Flächenschaden.

## Eigenständigkeit

Das grüne Feuer, das durch die Rippen leuchtet, ist einmalig; andere Drachen haben Schuppen und Haut. Knochendrachen anderer Spiele speien weißes Feuer; diese leuchten grün von innen.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Knochiger Drache mit offenen Rippen, zerfetzten Flügeln und langem Knochenschwanz.
- **Proportionsformel:** Kopf 0,30 · Beine 0,00 · Arme 0,00 · Hände 0,00 · Waffe/Signature 1,20 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Knochenflügel mit zerfetzter Haut
- **Größenklasse:** M, 1,75 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#ded2b5` | Knochenbeige |
| Akzent | `#6dff9a` | Geistergrün |
| Schatten | `#a09a95` · Tiefe `#72717c` | Hauptfarbe unten rechts, Falten (Akzent: `#53b982`) |
| Licht · Glanz | `#e9ddc0` · `#f6f3ec` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#6a6265` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Halsband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Flügelhaut | `#8a8478` | Materialfarbe |

## Signature-Element

**grünes Geisterfeuer im Brustkorb** (Leuchtendes Merkmal). Grünes Geisterfeuer brennt im offenen Brustkorb.

## Details

- **Kleidung und Rüstung:** Knochen, Flügelhautfetzen
- **Materialien:** Knochen, Haut
- **Muster und Nähte:** Wirbelreihen
- **Schnallen, Nieten und Gravuren:** keine
- **Abnutzung:** Risse in den Flügeln
- **Accessoires:** Halsband (Teamzone)

## Gesicht und Ausdruck

Langer Schädel mit Hörnern, grün glühenden Augen und schnappendem Kiefer. Persönlichkeit: gierig, schnappt.

## Waffe / Werkzeug

Grüner Geisterfeuer-Ball aus dem Knochenkiefer, der beim Aufprall in grüne Flammenzungen zerspritzt.

## Animationen

**Idle**

- Flügelschlag mit `char.flap`, Feuer züngelt durch die Rippen

**Laufen**

- Flug mit Wellen im Schwanz

**Angriff**

- Kopf zurück (Anticipation), grüner Feuerball

**Treffer**

- Knochen klappern

**Erscheinen**

- fliegen aus grünem Rauch

**Tod**

- zerfallen in der Luft, Knochen regnen

## Besonderheiten

- **Schwarm-Varianten:** Hornspitze, Kerbe im Kiefer; Farbton ±6°, Größe ±5 %
