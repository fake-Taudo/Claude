# Infernodrache (`inferno-dragon`)

> Truppe · Flieger, Fernkampf · 4 Elixier · Herkunft: Tiere und Drachen · Familie: Geflügelt · Größe L (2,15 Felder)

## Konzept

Der Infernodrache ist ein brütender, konzentrierter Schmiededrache mit rußroten Schuppen und einem Brennglas in Messingfassung vor dem Maul. Sein Hitzestrahl wird durch die Linse gebündelt und mit jeder Stufe heißer.

## Eigenständigkeit

Das Brennglas vor dem Maul ist ein einmaliges Werkzeug; es erklärt den gebündelten Strahl. Infernodrachen anderer Spiele tragen Helme; dieser trägt eine Linse.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Kräftiger Drache mit kurzem Hals, runde Linse vor der Schnauze, breite Flügel.
- **Proportionsformel:** Kopf 0,28 · Beine 0,15 · Arme 0,40 · Hände 0,40 · Waffe/Signature 0,90 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Brennglas so groß wie der Kopf
- **Größenklasse:** L, 2,15 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#5a2a2a` | Rußrot |
| Akzent | `#ff9d2e` | Glutorange |
| Schatten | `#462836` · Tiefe `#38273f` | Hauptfarbe unten rechts, Falten (Akzent: `#b77639`) |
| Licht · Glanz | `#926e64` · `#d4c8c8` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#351f2e` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Halfterriemen; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Linse | `#e8f4ff` | Materialfarbe |
| Messing | `#c8a046` | Materialfarbe |

## Signature-Element

**Brennglas in Messingfassung vor dem Maul** (Werkzeug oder Gerät). Ein Brennglas in einer Messingfassung, mit Riemen vor dem Maul befestigt.

## Details

- **Kleidung und Rüstung:** Halfter mit Linse
- **Materialien:** Schuppen, Messing, Glas
- **Muster und Nähte:** glühende Bauchnähte
- **Schnallen, Nieten und Gravuren:** Halfterschnallen
- **Abnutzung:** Ruß auf der Linse
- **Accessoires:** Halfterriemen (Teamzone)

## Gesicht und Ausdruck

Schmale glühende Augen und rauchende Nüstern. Persönlichkeit: brütend und konzentriert.

## Waffe / Werkzeug

Hitzestrahl durch das Brennglas.

## Animationen

**Idle**

- Rauch aus den Nüstern, die Linse glänzt

**Laufen**

- schwerer Flug mit `char.flap`

**Angriff**

- Linse ausrichten (Anticipation), Strahl; die Linse glüht heller

**Treffer**

- Linse wackelt

**Erscheinen**

- erscheint aus Glut

**Tod**

- Linse zerspringt, er stürzt

## Besonderheiten

- **Evolution:** Schmelz-Evo: Eine Doppellinse (Fernrohr) und glühende Schuppenkanten kommen hinzu, die Flügelränder brennen. Glutfunken bilden die Partikelhülle; die vierte Stufe färbt den Strahl weiß.
