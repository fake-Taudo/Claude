# Monster (`goblinstein-monster`)

> Beschwörung · Gebäudejäger, Nahkampf · Herkunft: Kobolde · Familie: Massig · Größe XL (2,75 Felder)

## Konzept

Das Monster ist Goblinsteins sanfter, genähter Riesenkobold aus Flicken mit ungleich großen Armen. Auf dem Rücken trägt es einen Akku, von dem Kabel zu Kupferklemmen am Hals laufen. Es stapft zu Gebäuden und brummt Wiegenlieder.

## Eigenständigkeit

Der Rücken-Akku mit Kabeln zu Halsklemmen und der Flickenkörper mit sichtbaren Nähten sind einmalig. Andere Riesen tragen Kleidung. Monster anderer Werke haben Schrauben im Hals; dieses hat einen Akku auf dem Rücken und Klemmen.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig und schief: ein Arm größer als der andere, kleiner Kopf, Akku-Kasten hinten.
- **Proportionsformel:** Kopf 0,20 · Beine 0,24 · Arme 1,10 · Hände 0,70 · Waffe/Signature 0,20 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Flickenkörper mit ungleich großen Armen
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#7a8f74` | Grünlich-Grau (Flickenhaut) |
| Akzent | `#c47a3a` | Kupfer (Klemmen, Kabel) |
| Schatten | `#5c6d68` · Tiefe `#465360` | Hauptfarbe unten rechts, Falten (Akzent: `#8f5e41`) |
| Licht · Glanz | `#a7b195` · `#dce2db` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#42484b` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Hosenbund, Armbinde; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Akku | `#3a3d44` | Materialfarbe |
| Nähte | `#2a2a30` | Materialfarbe |
| Hose | `#3a3a4a` | Materialfarbe |

## Signature-Element

**Rücken-Akku mit Kabeln zu Kupferklemmen am Hals** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Akku mit Kurbel auf dem Rücken, zwei Kabel zu Kupferklemmen am Hals.

## Details

- **Kleidung und Rüstung:** zerrissene Hose, Hosenträger aus Kabeln
- **Materialien:** Flickenhaut, Kupfer, Gummi
- **Muster und Nähte:** Kreuznähte, Flickenränder
- **Schnallen, Nieten und Gravuren:** Klemmen, Nieten am Akku
- **Abnutzung:** Brandflecken an den Klemmen
- **Accessoires:** Hosenbund und Armbinde (Teamzonen)

## Gesicht und Ausdruck

Kleines Gesicht mit sanften, ungleichen Augen, einer Naht über der Stirn und einem schüchternen Lächeln. Persönlichkeit: sanftes Monster, brummt Wiegenlieder.

## Waffe / Werkzeug

Zwei ungleich große Fäuste: links eine Flickenfaust mit Kreuznähten, rechts eine riesige Pranke mit Kupferring.

## Animationen

**Idle**

- Funken an den Klemmen, wiegt den Kopf

**Laufen**

- schwankender Gang mit `char.step`

**Angriff**

- beide Arme hoch (Anticipation), schwerfälliger Doppelschlag

**Treffer**

- zuckt, Funken

**Erscheinen**

- erwacht: Funken, er öffnet die Augen

**Tod**

- Akku geht aus, er sackt zusammen
