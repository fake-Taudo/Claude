# Mönch (`monk`)

> Champion · Nahkampf · 5 Elixier · Herkunft: Zirkel · Familie: Breit · Größe L (2,15 Felder)

## Konzept

Der Mönch ist ein heiterer, unerschütterlicher alter Kämpfer aus einem Bergkloster. Er trägt einen großen Bronzegong auf dem Rücken und eine Gebetskette mit großen Holzperlen. Er kämpft mit Handflächenstößen; jeder dritte Schlag dröhnt wie ein Gong.

## Eigenständigkeit

Der Bronzegong auf dem Rücken ist ein großer Kreis hinter der Figur, den sonst niemand hat; die pflaumenfarbene Kutte ist einmalig. Kämpfende Mönche anderer Spiele sind kahl und orange; dieser trägt Pflaume und hat einen weißen Zopfbart.

## Silhouette, Proportionen, Größe

- **Familie:** Breit (Quadrat bis Trapez, breite Schultern, breiter Stand)
- **Silhouette:** Breit mit großem Kreis (Gong) hinter dem Rücken; die Hände sind riesige Handflächen, die Kutte hat weite Ärmel.
- **Proportionsformel:** Kopf 0,30 · Beine 0,26 · Arme 0,95 · Hände 0,60 · Waffe/Signature 0,55 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** riesige Handflächen
- **Größenklasse:** L, 2,15 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#9a4a7a` | Pflaume (Kutte) |
| Akzent | `#d39a3a` | Bronze (Gong, Perlen) |
| Schatten | `#723e6d` · Tiefe `#543562` | Hauptfarbe unten rechts, Falten (Akzent: `#997441`) |
| Licht · Glanz | `#bc8399` · `#e5d0dc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4e2c4e` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schärpe, Gebetskette-Quaste; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Bart | `#f2efe6` | Materialfarbe |
| Haut | `#e0b08a` | Materialfarbe |
| Holzperlen | `#8a5a32` | Materialfarbe |

## Signature-Element

**Bronzegong auf dem Rücken** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Bronzegong an einem Holzgestell auf dem Rücken; bei der Fähigkeit dreht er ihn vor sich als Spiegelschild.

## Details

- **Kleidung und Rüstung:** Kutte mit weiten Ärmeln, Schärpe, Strohsandalen
- **Materialien:** Leinen, Bronze, Holz
- **Muster und Nähte:** Wolkenmuster am Saum, Gong-Relief
- **Schnallen, Nieten und Gravuren:** Knotenschärpe
- **Abnutzung:** geflickte Ärmel
- **Accessoires:** Schärpe und Gebetskette-Quaste (Teamzonen)

## Gesicht und Ausdruck

Freundliche Lachfalten, geschlossene lächelnde Augen, langer weißer Zopfbart und buschige Brauen. Persönlichkeit: heiter und unerschütterlich.

## Waffe / Werkzeug

Riesige Handflächen; der dritte Schlag dröhnt mit Gong-Echo.

## Animationen

**Idle**

- streicht sich den Bart, die Gebetskette klackert

**Laufen**

- ruhiger, gleitender Schritt

**Angriff**

- Kombo: zwei Handflächenstöße, beim dritten Gongschlag (Anticipation tiefer)

**Treffer**

- lächelt weiter, der Gong summt

**Erscheinen**

- landet in Meditationspose

**Tod**

- setzt sich im Lotussitz und verblasst lächelnd

## Besonderheiten

- **Fähigkeit (Champion):** Nachdenklicher Schutz: Er dreht den Gong vor sich und schlägt ihn an (Pose). Event `char.ability.monk` erzeugt Klangringe; Geschosse prallen am Gong ab.
- **Aura und Effekt-Hooks:** Bronzefarbene Bodenaura mit Wolkenwirbeln; beim dritten Schlag `char.strike` mit Gong-Ring.
