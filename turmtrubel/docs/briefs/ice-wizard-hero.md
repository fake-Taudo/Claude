# Eismagier (Held) (`ice-wizard-hero`)

> Held · Fernkampf, Flächenschaden · 3 Elixier · Herkunft: Zirkel · Familie: Dreieckig · Größe M (2,00 Felder)
> Held von [`ice-wizard`](ice-wizard.md)

## Konzept

Der Eismagier als Held ist ein großväterlicher Zauberer mit einem kleinen Schneemann-Gehilfen auf der Schulter. In seiner Schneekugel tanzt ein Schneemann. Mit seiner Fähigkeit beschwört er einen großen Schneemann, der Gegner einfriert.

## Eigenständigkeit

Der Schneemann-Gehilfe auf der Schulter ist sein Rang-Merkmal; Eiszapfenbart und Schneekugel-Stab zeigen den Basis-Eismagier. Ein reineres Weiß mit Eistürkis trennt ihn farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Dreieckig (breiter Saum unten (Robe, Kleid, Mantel), schmaler Kopf oben)
- **Silhouette:** Wie der Eismagier, mit einer kleinen runden Figur auf der Schulter.
- **Proportionsformel:** Kopf 0,31 · Beine 0,00 · Arme 0,80 · Hände 0,45 · Waffe/Signature 0,85 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Schneekugel-Stab mit Schneemann darin
- **Größenklasse:** M, 2,00 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#eaf6ff` | Schneeweiß |
| Akzent | `#5fd0c8` | Eistürkis |
| Schatten | `#a8b3c7` · Tiefe `#77809d` | Hauptfarbe unten rechts, Falten (Akzent: `#4a99a2`) |
| Licht · Glanz | `#f1f5f1` · `#fafdff` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#6e7183` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schal, Mantelsaum; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Rübe | `#ff8a3a` | Materialfarbe |

## Signature-Element

**kleiner Schneemann-Gehilfe auf der Schulter** (Tier oder Wesen, das mitkommt). Ein kleiner Schneemann-Gehilfe sitzt auf seiner Schulter.

## Details

- **Kleidung und Rüstung:** Pelzmantel, Pelzmütze, Schal
- **Materialien:** Pelz, Schnee, Glas
- **Muster und Nähte:** Schneeflocken
- **Schnallen, Nieten und Gravuren:** Eiszapfen-Knöpfe
- **Abnutzung:** Raureif
- **Accessoires:** Schal und Mantelsaum (Teamzonen)

## Gesicht und Ausdruck

Großväterliches Lachen, rosige Wangen. Persönlichkeit: großväterlich, lacht.

## Waffe / Werkzeug

Birkenstab mit einer größeren Schneekugel, in der ein winziger Schneemann tanzt; Eiszapfen hängen am Kugelsockel.

## Animationen

**Idle**

- Frostkerl-Pose: formt einen Schneeball

**Laufen**

- gemächlich

**Angriff**

- Eissplitter-Fächer

**Treffer**

- der Gehilfe wackelt

**Erscheinen**

- landet mit Frostschlag

**Tod**

- friert ein, der Gehilfe rollt davon

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Frostkerl: wirft den Schneeball nach vorn, der zum Schneemann wird (Pose); Event `char.ability.ice-wizard-hero`. Rang-Merkmal: Schneemann-Gehilfe.
