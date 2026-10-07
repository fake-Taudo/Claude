# Bowler (Held) (`bowler-hero`)

> Held · Fernkampf · 5 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,75 Felder)
> Held von [`bowler`](bowler.md)

## Konzept

Der Bowler als Held ist ein triumphierender Kegelkönig aus weißem Marmor mit einer Krone aus Kegeln. Mit seiner Fähigkeit stellt er sich auf und wirft Felsen wie ein Mörser.

## Eigenständigkeit

Die Kegelkrone ist sein Rang-Merkmal; Hosenträger und Runenkugel zeigen den Basis-Bowler. Marmorweiß statt Moosgrün trennt ihn farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Wie der Bowler, oben eine Krone aus kleinen Kegeln.
- **Proportionsformel:** Kopf 0,25 · Beine 0,25 · Arme 1,08 · Hände 0,65 · Waffe/Signature 0,35 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Kegelkrone
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#e6e2d8` | Marmorweiß |
| Akzent | `#ffcf6b` | Kronengold |
| Schatten | `#a6a5ac` · Tiefe `#75788c` | Hauptfarbe unten rechts, Falten (Akzent: `#b79862`) |
| Licht · Glanz | `#efe8d7` · `#f9f7f5` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#6d6973` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Hosenträger, Kegelband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Kegel | `#f6f2ea` | Materialfarbe |
| Kugel | `#6a7a8a` | Materialfarbe |

## Signature-Element

**Krone aus Kegeln** (Helm, Hut, Krone, Kapuze). Eine Krone aus neun kleinen Kegeln.

## Details

- **Kleidung und Rüstung:** Kegelkrone, Hemd, Hosenträger
- **Materialien:** Marmor, Holz, Wolle
- **Muster und Nähte:** Marmoradern
- **Schnallen, Nieten und Gravuren:** Hosenträgerklemmen
- **Abnutzung:** angeschlagener Kegel
- **Accessoires:** Hosenträger und Kegelband (Teamzonen)

## Gesicht und Ausdruck

Triumphierendes Grinsen mit Hauern. Persönlichkeit: triumphierender Kegelkönig.

## Waffe / Werkzeug

Runenkugel; Felsbrocken im Mörserwurf.

## Animationen

**Idle**

- Mörser-Pose: stemmt einen Felsen über den Kopf

**Laufen**

- schlurfend

**Angriff**

- Kegelwurf

**Treffer**

- Kegel klappern

**Erscheinen**

- landet, Kegel wackeln

**Tod**

- zerbröselt, die Krone fällt

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Steinwurf: breitbeinig, Felsen über dem Kopf, Wurf im hohen Bogen; Event `char.ability.bowler-hero`. Rang-Merkmal: Kegelkrone.
