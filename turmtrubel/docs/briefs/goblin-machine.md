# Goblin Machine (`goblin-machine`)

> Truppe · Nahkampf · 5 Elixier · Herkunft: Kobolde · Familie: Mechanisch · Größe XL (2,55 Felder)

## Konzept

Die Goblin Machine ist ein stampfender Kampfanzug aus Schrott und Kesselblech, den ein jauchzender Kobold aus einer Glaskanzel steuert. Sie schlägt mit einer Kolbenfaust mit Dampfzylinder zu. Ein Raketenwerfer auf der Schulter feuert unabhängig.

## Eigenständigkeit

Die übergroße Kolbenfaust mit sichtbarem Dampfzylinder und der kleine Pilot in der Kanzel ergeben eine asymmetrische Mech-Silhouette; nur sie hat einen Piloten im Kopf. Andere Maschinen sind Automaten ohne Fahrer. Kampfmaschinen anderer Spiele sind glatte Roboter; diese ist ein genieteter Schrotthaufen.

## Silhouette, Proportionen, Größe

- **Familie:** Mechanisch (kantige Maschinenteile: Kessel, Kolben, Rohre, Räder)
- **Silhouette:** Breiter Kesselrumpf auf Stampfbeinen, rechts eine riesige Faust, links ein kleinerer Greifarm; oben Kanzel und Raketenrohr.
- **Proportionsformel:** Kopf 0,20 · Beine 0,25 · Arme 1,00 · Hände 0,80 · Waffe/Signature 0,40 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Kolbenfaust größer als der Pilot
- **Größenklasse:** XL, 2,55 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#8a5a44` | Rostbraun (Blech) |
| Akzent | `#4fd1c5` | Türkis (Kanzelglas, Dampf) |
| Schatten | `#674948` · Tiefe `#4d3c4b` | Hauptfarbe unten rechts, Falten (Akzent: `#3f9aa0`) |
| Licht · Glanz | `#b28e76` · `#e1d4ce` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#483238` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Raketenwimpel, Pilotenhelm; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Pilot-Haut | `#7fae4a` | Materialfarbe |
| Nieten | `#c8ccd2` | Materialfarbe |
| Raketen | `#e8b030` | Materialfarbe |

## Signature-Element

**Kolbenfaust mit Dampfzylinder** (Werkzeug oder Gerät). Eine Kolbenfaust mit Dampfzylinder; beim Schlag schießt sie zischend nach vorn.

## Details

- **Kleidung und Rüstung:** Pilot mit Lederkappe und Brille in der Glaskanzel
- **Materialien:** Kesselblech, Nieten, Glas, Gummischläuche
- **Muster und Nähte:** Nietreihen, Schweißnähte
- **Schnallen, Nieten und Gravuren:** Klammern, Ventile
- **Abnutzung:** Rostflecken, Beulen
- **Accessoires:** Raketenwimpel und Pilotenhelm (Teamzonen), Auspuffrohr

## Gesicht und Ausdruck

Der Pilot jauchzt mit weit offenem Mund; die Maschine hat zwei Scheinwerfer als Augen. Persönlichkeit: Pilot jauchzt, Maschine stampft.

## Waffe / Werkzeug

Kolbenfaust (Nahkampf) und Schulter-Raketenwerfer (Fernkampf).

## Animationen

**Idle**

- Auspuff pufft, der Pilot kurbelt an Hebeln

**Laufen**

- stampfender Gang mit `char.step`, Rumpf schaukelt

**Angriff**

- Kolben zieht zurück (Anticipation), Faust schnellt vor mit Dampfstoß
- Raketen starten unabhängig

**Treffer**

- Funken, der Pilot duckt sich

**Erscheinen**

- landet mit Dampfwolke

**Tod**

- Maschine fällt auseinander, der Pilot springt mit Schirm heraus
