# Boss Bandit (`boss-bandit`)

> Champion · Nahkampf · 6 Elixier · Herkunft: Gesindel · Familie: Keil · Größe M (2,00 Felder)

## Konzept

Boss Bandit ist die selbstsichere Anführerin der Fuchsbande in einem altrosa Samtmantel mit riesigem Silberfuchs-Kragen. Über der Schulter trägt sie einen Beutesack, aus dem Münzen fallen. Sie kämpft mit zwei Brecheisen und flieht mit einer Rauchgranate.

## Eigenständigkeit

Beutesack mit fallenden Münzen und Silberfuchs-Kragen sind einmalig; sie ist die Keil-Silhouette mit Sack. Banditen-Bosse anderer Spiele tragen Masken und Klingen; diese trägt Samt und Brecheisen.

## Silhouette, Proportionen, Größe

- **Familie:** Keil (umgedrehtes Dreieck: sehr breite Schultern, schmale Hüfte)
- **Silhouette:** Keil mit riesigem Pelzkragen, Sack über einer Schulter, zwei kurze Eisen in den Händen.
- **Proportionsformel:** Kopf 0,28 · Beine 0,34 · Arme 0,95 · Hände 0,45 · Waffe/Signature 0,50 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** riesiger Silberfuchs-Kragen
- **Größenklasse:** M, 2,00 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#9a6274` | Altrosa (Samtmantel) |
| Akzent | `#f2c14e` | Beutegold |
| Schatten | `#724e68` · Tiefe `#543f60` | Hauptfarbe unten rechts, Falten (Akzent: `#ae8f4f`) |
| Licht · Glanz | `#bc9395` · `#e5d6db` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4e364b` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Mantelfutter, Halstuch; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Silberfuchs | `#e8e8ec` | Materialfarbe |
| Sack | `#b89a6a` | Materialfarbe |
| Brecheisen | `#5a5f6b` | Materialfarbe |

## Signature-Element

**Beutesack über der Schulter, aus dem Münzen fallen** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Beutesack über der Schulter, aus dem Goldmünzen fallen.

## Details

- **Kleidung und Rüstung:** Samtmantel mit Pelzkragen, Weste, Reiterhose, hohe Stiefel, Federhut
- **Materialien:** Samt, Pelz, Leinen, Eisen
- **Muster und Nähte:** Brokat an der Weste
- **Schnallen, Nieten und Gravuren:** Goldschnallen
- **Abnutzung:** Löcher im Sack
- **Accessoires:** Mantelfutter und Halstuch (Teamzonen), Rauchgranaten am Gürtel

## Gesicht und Ausdruck

Selbstsicheres Lächeln, eine hochgezogene Braue, Schönheitsfleck. Persönlichkeit: selbstsicher und arrogant.

## Waffe / Werkzeug

Zwei kurze Brecheisen mit gespaltenen Enden und Lederwicklung, dazu Rauchgranaten am Gürtel.

## Animationen

**Idle**

- wirft eine Münze hoch

**Laufen**

- stolzierender Gang, der Sack klimpert

**Angriff**

- Doppelschlag mit beiden Brecheisen

**Treffer**

- Münzen fallen aus dem Sack

**Erscheinen**

- landet und schultert den Sack

**Tod**

- Sack platzt, Münzen regnen

## Besonderheiten

- **Fähigkeit (Champion):** Fluchtgranate: Sie wirft eine Rauchgranate vor die Füße (Pose). Event `char.ability.boss-bandit` erzeugt eine Rauchwolke, aus der sie zurückspringt.
- **Aura und Effekt-Hooks:** Goldene Bodenaura mit fallenden Münzen; der Sprint zieht Nachbilder.
