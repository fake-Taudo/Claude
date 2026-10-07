# Riese (Held) (`giant-hero`)

> Held · Gebäudejäger, Tank, Nahkampf · 5 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,90 Felder)
> Held von [`giant`](giant.md)

## Konzept

Der Riese als Held ist der stolze Erntekönig: eine Krone aus Weizenähren statt der Bommelmütze und ein Steppdecken-Umhang. Er packt die stärkste gegnerische Truppe und schleudert sie quer über die Arena.

## Eigenständigkeit

Die Erntekrone aus Weizenähren und der Steppdecken-Umhang sind sein Rang-Merkmal; Latzhose, Handschuhe und Gesicht zeigen den Basis-Riesen. Er ist goldener und heller als der normale Riese. Heldenriesen anderer Spiele tragen Rüstung; dieser trägt Weizen und Quilt.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Wie der Riese (Berg mit kleinem Kopf, riesigen Handschuhen), oben eine zackige Ährenkrone, hinten ein karierter Quilt-Umhang.
- **Proportionsformel:** Kopf 0,19 · Beine 0,21 · Arme 1,12 · Hände 0,80 · Waffe/Signature 0,20 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Steppdecken-Umhang
- **Größenklasse:** XL, 2,90 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#c08a46` | Erntebraun (Latzhose) |
| Akzent | `#f3d36b` | Weizengold |
| Schatten | `#8c6949` · Tiefe `#65514c` | Hauptfarbe unten rechts, Falten (Akzent: `#af9b62`) |
| Licht · Glanz | `#d5ae77` · `#efe1cf` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#5e4639` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Steppdecken-Umhang, Bommel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Quilt | `#c86a4a` | Materialfarbe |
| Haut | `#e9a97a` | Materialfarbe |

## Signature-Element

**Erntekrone aus Weizenähren** (Helm, Hut, Krone, Kapuze). Eine Krone aus gebundenen Weizenähren.

## Details

- **Kleidung und Rüstung:** Ährenkrone, Latzhose mit Goldflicken, Steppdecken-Umhang, Handschuhe
- **Materialien:** Stroh, Denim, Steppstoff, Leder
- **Muster und Nähte:** Quiltkaros, Ährenbündel
- **Schnallen, Nieten und Gravuren:** Latzknöpfe aus Messing
- **Abnutzung:** Strohhalme im Umhang
- **Accessoires:** Steppdecken-Umhang und Bommel am Krempelband (Teamzonen)

## Gesicht und Ausdruck

Das gutmütige Gesicht des Riesen, jetzt mit stolz gerecktem Kinn und Grashalm. Persönlichkeit: stolzer Erntekönig.

## Waffe / Werkzeug

Fäuste; die Fähigkeit packt ganze Truppen.

## Animationen

**Idle**

- Heldenwurf-Pose: packt in die Luft und holt weit aus

**Laufen**

- Stampfgang mit `char.step`, Umhang schwingt

**Angriff**

- Hammerfaust von oben

**Treffer**

- brummt, Ähren rascheln

**Erscheinen**

- landet schwer, Ähren stieben

**Tod**

- setzt sich und kippt, die Krone fällt

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Heldenwurf: Greifen (Anticipation weit zurück), Wurf mit ganzer Drehung, Follow-through; Event `char.ability.giant-hero` mit Wurf-Staubwirbel. Rang-Merkmal: Erntekrone aus Weizen.
