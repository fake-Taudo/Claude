# Skelettkönig (`skeleton-king`)

> Champion · Nahkampf, Flächenschaden · 4 Elixier · Herkunft: Gruft · Familie: Massig · Größe XXL (3,00 Felder)

## Konzept

Der Skelettkönig ist ein majestätischer, hohl lachender König der Toten mit einer Geweihkrone und einer Robe aus nachtgrauem Gruftsamt. Er schlägt mit einer Keule aus einem Grabstein. Er sammelt die Seelen gefallener Truppen und ruft daraus Skelette.

## Eigenständigkeit

Die Geweihkrone aus Hirschstangen und die Grabstein-Keule sind einmalig. Die Grabkönigin trägt einen Sarkophag, General Gerry einen Zweispitz. Skelettkönige anderer Spiele tragen Goldkronen und Purpur; dieser trägt Geweih und Nachtgrau.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig in weiter Robe mit Schulterumhang, oben ein ausladendes Geweih, die Keule ist ein Grabstein an einem Knochengriff.
- **Proportionsformel:** Kopf 0,24 · Beine 0,30 · Arme 1,05 · Hände 0,60 · Waffe/Signature 0,65 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Grabstein-Keule
- **Größenklasse:** XXL, 3,00 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#4b4a62` | Nachtgrau (Robe) |
| Akzent | `#d8ccb0` | Knochenweiß |
| Schatten | `#3c3e5c` · Tiefe `#313558` | Hauptfarbe unten rechts, Falten (Akzent: `#9c9691`) |
| Licht · Glanz | `#888389` · `#d0d0d6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#2f2c44` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Robensaum, Schulterumhang; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Geweih | `#e8dcc0` | Materialfarbe |
| Grabstein | `#8a8a96` | Materialfarbe |
| Seelenlicht | `#9ff0ff` | Materialfarbe |

## Signature-Element

**Geweihkrone** (Helm, Hut, Krone, Kapuze). Eine Krone aus zwei Hirschgeweih-Stangen mit Eisenreif.

## Details

- **Kleidung und Rüstung:** Gruftsamt-Robe mit Fellkragen, Schulterumhang, Knochenpanzer
- **Materialien:** Samt, Knochen, Stein, Eisen
- **Muster und Nähte:** Grabinschrift auf der Keule
- **Schnallen, Nieten und Gravuren:** Eisenreif, Knochenspangen
- **Abnutzung:** Moos am Grabstein
- **Accessoires:** Robensaum und Schulterumhang (Teamzonen), Seelenlichter

## Gesicht und Ausdruck

Großer Schädel mit Kinnbart aus Spinnweben, glühenden Augen und hohl lachendem Kiefer. Persönlichkeit: majestätisch und hohl lachend.

## Waffe / Werkzeug

Keule aus einem gerundeten Grabstein mit Inschrift und Moos, an einen langen Schenkelknochen gebunden.

## Animationen

**Idle**

- stützt sich auf die Keule, Seelenlichter kreisen

**Laufen**

- schwerer Schritt, die Robe schleift

**Angriff**

- Keule über den Kopf (Anticipation), Flächenschlag

**Treffer**

- Geweih wackelt

**Erscheinen**

- steigt aus dem Boden

**Tod**

- zerfällt, die Krone fällt

## Besonderheiten

- **Fähigkeit (Champion):** Seelenruf: Er hebt die Keule und das Geweih leuchtet (Pose). Event `char.ability.skeleton-king` erzeugt einen Seelenwirbel, aus dem Skelette steigen.
- **Aura und Effekt-Hooks:** Knochenweiße Bodenaura mit kreisenden Seelenlichtern, deren Zahl mit den gesammelten Seelen wächst.
