# Wächter (`guards`)

> Truppe · Nahkampf, Schwarm · 3 Elixier · Herkunft: Gruft · Familie: Winzig · Größe S (1,40 Felder)

## Konzept

Die Wächter sind drei steife, pflichtbewusste Skelett-Wachen mit Schilden aus Sargdeckeln und Speeren. Erst muss der Deckel brechen, dann sie selbst. Sie salutieren gern.

## Eigenständigkeit

Sargdeckel mit Kreuz-Beschlag als Schild ist einmalig (der Ritter hat einen Zinnenschild, die Rekruten Rundschilde). Skelettwächter anderer Spiele tragen Rundschilde; diese verstecken sich hinter Sargdeckeln.

## Silhouette, Proportionen, Größe

- **Familie:** Winzig (kleiner Körper mit großem Kopf (Kopf mindestens 40 % der Höhe))
- **Silhouette:** Kleines Skelett hinter einem hohen, sechseckigen Sargdeckel; der Speer ragt darüber hinaus.
- **Proportionsformel:** Kopf 0,42 · Beine 0,22 · Arme 0,80 · Hände 0,42 · Waffe/Signature 0,85 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Sargdeckel länger als der Wächter
- **Größenklasse:** S, 1,40 Felder hoch, Außenkontur „dünn“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#8a7a78` | Verwittertes Grau (Sargholz) |
| Akzent | `#efe6d0` | Knochenweiß |
| Schatten | `#675e6b` · Tiefe `#4d4a62` | Hauptfarbe unten rechts, Falten (Akzent: `#aca8a7`) |
| Licht · Glanz | `#b2a398` · `#e1dcdc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#483f4d` innen | Stufe 1 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Sargdeckel-Emblem, Helmfeder; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Eisenbeschlag | `#5a5f6b` | Materialfarbe |
| Helm | `#7a828e` | Materialfarbe |

## Signature-Element

**Sargdeckel-Schild** (Schild oder schildartiges Bauteil). Ein sechseckiger Sargdeckel mit Eisenbeschlägen als Schild.

## Details

- **Kleidung und Rüstung:** rostige Helme, Knochen
- **Materialien:** Holz, Eisen, Knochen
- **Muster und Nähte:** Holzmaserung, Nagelreihen
- **Schnallen, Nieten und Gravuren:** Sargdeckel-Beschläge
- **Abnutzung:** Rostflecken
- **Accessoires:** Sargdeckel-Emblem und Helmfeder (Teamzonen)

## Gesicht und Ausdruck

Schädel mit grünlichen Augenpunkten unter dem Helmrand und strammem Kiefer. Persönlichkeit: steif und pflichtbewusst, salutieren.

## Waffe / Werkzeug

Speer mit Knochenspitze.

## Animationen

**Idle**

- stehen stramm, ein Knochen wackelt

**Laufen**

- marschieren im Gleichschritt

**Angriff**

- Speerstoß hinter dem Deckel hervor

**Treffer**

- Deckel ächzt; bei Schildbruch zerbricht er in Bretter

**Erscheinen**

- landen mit Deckel voran

**Tod**

- Knochen fallen hinter den Deckel

## Besonderheiten

- **Schwarm-Varianten:** Helmfeder, Rostfleck, Kerbe im Schild; Farbton ±6°, Größe ±5 %
- **Schildbruch:** Teile mit `data-state="shield"` entfallen, sobald der Schild-Wert 0 ist; zurück bleibt ein Holzsplitter am Arm.
