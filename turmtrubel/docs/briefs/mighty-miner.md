# Großer Gräber (`mighty-miner`)

> Champion · Nahkampf · 4 Elixier · Herkunft: Gesindel · Familie: Breit · Größe L (2,35 Felder)

## Konzept

Der Große Gräber ist ein polternder, zufriedener Zwergen-Bohrmeister mit einem Bohrer statt rechtem Arm und einem Bauhelm mit greller Stirnlampe. Sein Schaden steigt, je länger er bohrt. Er kann sich auf die andere Seite durchgraben und eine Bombe zurücklassen.

## Eigenständigkeit

Der Bohrer-Arm ist einmalig. Der Tunnelgräber ist ein Maulwurf. Gräber-Champions anderer Spiele tragen Spitzhacken; dieser hat einen Bohrarm.

## Silhouette, Proportionen, Größe

- **Familie:** Breit (Quadrat bis Trapez, breite Schultern, breiter Stand)
- **Silhouette:** Breit und stämmig, großer Bohrer rechts, Helm mit Lampe.
- **Proportionsformel:** Kopf 0,28 · Beine 0,22 · Arme 1,00 · Hände 0,65 · Waffe/Signature 0,50 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Bauhelm mit greller Stirnlampe
- **Größenklasse:** L, 2,35 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#e0a030` | Ocker (Overall) |
| Akzent | `#6f7682` | Stahl (Bohrer) |
| Schatten | `#a2783a` · Tiefe `#735b42` | Hauptfarbe unten rechts, Falten (Akzent: `#555c72`) |
| Licht · Glanz | `#ebbc68` · `#f7e6c9` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#6a4e30` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Helmband, Gürtel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Bart | `#6b4f36` | Materialfarbe |
| Helm | `#f0c020` | Materialfarbe |
| Lampe | `#fff6c8` | Materialfarbe |

## Signature-Element

**Bohrer statt rechtem Arm** (Werkzeug oder Gerät). Ein Bohrer statt des rechten Arms, der sich mit steigender Drehzahl dreht.

## Details

- **Kleidung und Rüstung:** Bauhelm, Overall, Lederschürze, Stiefel
- **Materialien:** Stahl, Leder, Leinen
- **Muster und Nähte:** Spiralrillen am Bohrer
- **Schnallen, Nieten und Gravuren:** Gurtschnallen
- **Abnutzung:** Staub, Ölflecken
- **Accessoires:** Helmband und Gürtel (Teamzonen), Sprengstoffkiste

## Gesicht und Ausdruck

Breiter Bart, Knollennase, zufriedenes Grinsen. Persönlichkeit: polternd und zufrieden.

## Waffe / Werkzeug

Bohrarm mit Spiralbohrer, Kolbengehäuse und Drehzahlanzeige, die mit steigendem Schaden ausschlägt.

## Animationen

**Idle**

- lässt den Bohrer kurz aufheulen

**Laufen**

- polternder Gang

**Angriff**

- Bohrer setzt an und bohrt mit steigender Drehzahl

**Treffer**

- Helm wackelt

**Erscheinen**

- landet mit Staub

**Tod**

- Bohrer stoppt, er kippt um

## Besonderheiten

- **Fähigkeit (Champion):** Explosive Flucht: Er bohrt sich ein (Pose: Bohrer nach unten). Event `char.ability.mighty-miner` erzeugt eine Erdfontäne, eine Bombe bleibt zurück.
- **Aura und Effekt-Hooks:** Ockerfarbene Bodenaura mit Gesteinssplittern.
