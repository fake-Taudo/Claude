# Rune Giant (`rune-giant`)

> Truppe · Gebäudejäger, Tank, Nahkampf · 4 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,70 Felder)

## Konzept

Der Runenriese ist ein feierlicher Steinmetz-Riese mit leuchtenden Runentätowierungen, der eine riesige Steintafel als Schild und Waffe trägt. Er stapft zu Gebäuden und verzaubert die nächsten Verbündeten, indem er eine Rune in die Tafel meißelt.

## Eigenständigkeit

Die Runentafel ist ein Steinrechteck mit Runen und gibt ihm eine Schild-ähnliche, aber eckige Silhouette. Andere Riesen tragen Mütze, Kanone oder Spulen. Runenriesen anderer Spiele haben magische Stäbe; dieser trägt eine Tafel und einen Meißel.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig, kahler Kopf mit Bart; vor dem Körper die hohe rechteckige Tafel, in der anderen Hand ein Hammer-Meißel.
- **Proportionsformel:** Kopf 0,22 · Beine 0,24 · Arme 1,05 · Hände 0,60 · Waffe/Signature 0,55 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** leuchtende Runen-Tätowierungen
- **Größenklasse:** XL, 2,70 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#9a9890` | Granitgrau (Haut, Tafel) |
| Akzent | `#7af0ff` | Runen-Cyan (Glühen) |
| Schatten | `#72737c` · Tiefe `#54576c` | Hauptfarbe unten rechts, Falten (Akzent: `#5cafc7`) |
| Licht · Glanz | `#bcb7a8` · `#e5e4e2` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4e4b56` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Lendentuch, Armreif; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Bart | `#c8c2b8` | Materialfarbe |
| Lendentuch | `#6b5a48` | Materialfarbe |
| Meißel | `#8a6a4a` | Materialfarbe |

## Signature-Element

**Runentafel als Schild und Waffe** (Werkzeug oder Gerät). Eine Steintafel mit drei Runenzeilen, die einzeln aufleuchten, wenn er verzaubert.

## Details

- **Kleidung und Rüstung:** Lendentuch, Lederschürze, Armreifen, Fußwickel
- **Materialien:** Granit, Leder, Bronze
- **Muster und Nähte:** Runentätowierungen auf Armen und Brust, Meißelspuren
- **Schnallen, Nieten und Gravuren:** Bronzearmreifen mit Runen
- **Abnutzung:** abgesplitterte Tafelecke
- **Accessoires:** Lendentuch und Armreif (Teamzonen), Steinstaub-Beutel

## Gesicht und Ausdruck

Langer Bart, buschige Brauen, halb geschlossene weise Augen, murmelnder Mund. Beim Verzaubern leuchten die Augen cyan. Persönlichkeit: feierlich und weise, murmelt.

## Waffe / Werkzeug

Runentafel (Schild und Schlagwaffe) und ein kurzer Hammer-Meißel.

## Animationen

**Idle**

- meißelt eine Rune, Steinstaub fällt

**Laufen**

- würdevoller Schritt mit `char.step`, Tafel vor dem Körper

**Angriff**

- Tafel hoch (Anticipation), Tafelstoß nach unten
- beim Verzaubern leuchtet eine Rune auf

**Treffer**

- Tafel vibriert, Staub rieselt

**Erscheinen**

- stellt die Tafel mit dumpfem Schlag ab

**Tod**

- Tafel zerbricht in drei Stücke, er sinkt zusammen
