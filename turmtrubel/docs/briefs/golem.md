# Golem (`golem`)

> Truppe · Gebäudejäger, Tank, Nahkampf · 8 Elixier · Herkunft: Elementar · Familie: Massig · Größe XXL (3,30 Felder)

## Konzept

Der Golem ist ein uralter, träger Riese aus rosa Granit mit einem leuchtenden türkisen Schlussstein im Brustkorb. Auf seiner Schulter wächst ein Bäumchen mit einem Vogelnest. Er stapft zu Gebäuden, und stirbt er, zerfällt er in zwei Golemiten.

## Eigenständigkeit

Das Bäumchen mit Vogel auf der Schulter ist ein lebendes Detail, das kein anderer Riese hat; der rosa Granit ist eine einmalige Steinfarbe. Felsgolems anderer Spiele sind grau mit Moos; dieser ist rosa mit Baum und Vogel.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Riesiger Berg mit flachem kleinem Kopf, riesigen Felsfäusten und einem Baum, der über eine Schulter ragt.
- **Proportionsformel:** Kopf 0,18 · Beine 0,24 · Arme 1,10 · Hände 0,80 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Felsfäuste so groß wie der Rumpf
- **Größenklasse:** XXL, 3,30 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#c4938a` | Rosengranit |
| Akzent | `#3fe0c5` | Türkis (Schlussstein, Adern) |
| Schatten | `#8f6f77` · Tiefe `#66556a` | Hauptfarbe unten rechts, Falten (Akzent: `#34a4a0`) |
| Licht · Glanz | `#d8b4a4` · `#f0e3e1` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#5f4954` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Tuch am Bäumchen, Armband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Baumgrün | `#5a8a3a` | Materialfarbe |
| Rinde | `#6b4a32` | Materialfarbe |
| Vogel | `#f0c040` | Materialfarbe |

## Signature-Element

**Bäumchen mit Vogelnest auf der Schulter** (Tier oder Wesen, das mitkommt). Ein kleiner Baum mit Vogelnest auf der linken Schulter; der Vogel hüpft herum.

## Details

- **Kleidung und Rüstung:** Steinplatten, Granitbrocken
- **Materialien:** Granit, Moos, Holz
- **Muster und Nähte:** Granitsprenkel, Risse mit Türkisglühen
- **Schnallen, Nieten und Gravuren:** keine
- **Abnutzung:** abgesplitterte Kanten
- **Accessoires:** Tuch am Bäumchen und Armband (Teamzonen)

## Gesicht und Ausdruck

Zwei türkis glühende Augenschlitze unter einer schweren Steinstirn, ein dünner Mundriss, der brummt. Persönlichkeit: uralt und träge, brummt.

## Waffe / Werkzeug

Zwei Felsfäuste so groß wie der Rumpf, mit türkis glühenden Rissen an den Knöcheln.

## Animationen

**Idle**

- ein Vogel hüpft im Bäumchen, der Golem brummt

**Laufen**

- langsamer Stampfgang mit `char.step` (XXL-Beben), Blätter rieseln

**Angriff**

- beide Fäuste hoch (Anticipation, Stretch), Doppelhieb (Squash)

**Treffer**

- Steinstaub rieselt

**Erscheinen**

- landet mit Beben, der Vogel flattert auf

**Tod**

- bricht auseinander, zwei Golemiten rollen heraus, der Baum fällt
