# Magieschütze (Held) (`magic-archer-hero`)

> Held · Fernkampf · 4 Elixier · Herkunft: Zirkel · Familie: Schlank · Größe L (2,10 Felder)
> Held von [`magic-archer`](magic-archer.md)

## Konzept

Der Magieschütze als Held trägt einen Sternbild-Mantel, auf dem sich drei leuchtende Pfeilsterne bewegen. Mit seiner Fähigkeit springt er zurück, lässt einen Lockvogel aus Sternenstaub stehen und schießt drei weite Pfeile.

## Eigenständigkeit

Der Sternbild-Mantel mit beweglichen Pfeilsternen ist sein Rang-Merkmal; Fernrohr-Bogen und Astrolabium-Hut zeigen den Basis-Magieschützen. Helleres Sternenviolett trennt ihn farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Schlank (schmales Hochrechteck, lange Diagonale durch Waffe oder Werkzeug)
- **Silhouette:** Wie der Magieschütze, dazu ein langer, weiter Mantel mit Sternmuster.
- **Proportionsformel:** Kopf 0,30 · Beine 0,38 · Arme 0,95 · Hände 0,40 · Waffe/Signature 0,90 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Sternbilder, die sich auf dem Mantel bewegen
- **Größenklasse:** L, 2,10 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#6a52b8` | Sternenviolett |
| Akzent | `#fff0a8` | Sternlicht |
| Schatten | `#514397` · Tiefe `#3f387e` | Hauptfarbe unten rechts, Falten (Akzent: `#b7af8c`) |
| Licht · Glanz | `#9d89c2` · `#d8d2ed` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#3b2f66` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Hutband, Umhangfutter; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Messing | `#c8a046` | Materialfarbe |

## Signature-Element

**Sternbild-Mantel mit drei leuchtenden Pfeilsternen** (Umhang, Mantel, Kragen). Ein Mantel mit drei leuchtenden Pfeil-Sternbildern.

## Details

- **Kleidung und Rüstung:** Sternbild-Mantel, Astrolabium-Hut
- **Materialien:** Samt, Messing, Licht
- **Muster und Nähte:** Sternbilder
- **Schnallen, Nieten und Gravuren:** Sternschließe
- **Abnutzung:** keine
- **Accessoires:** Hutband und Umhangfutter (Teamzonen)

## Gesicht und Ausdruck

Gerissen-verspielter Blick, ein Mundwinkel hoch. Persönlichkeit: gerissen und verspielt.

## Waffe / Werkzeug

Fernrohr-Bogen mit drei Sternensehnen, mit denen er beim Dreifachschuss drei Lichtpfeile auffächert.

## Animationen

**Idle**

- Dreifach-Pose: fächert drei Pfeile auf

**Laufen**

- schlendernd

**Angriff**

- Lichtpfeil

**Treffer**

- Sterne flackern

**Erscheinen**

- landet in Sternenstaub

**Tod**

- löst sich in Sternbilder auf

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Dreifachgefahr: Rückwärtssprung (Pose), dann drei Pfeile; Event `char.ability.magic-archer-hero` mit Sternenspur. Rang-Merkmal: Sternbild-Mantel.
- **Form „decoy“:** Lockvogel: halb durchsichtiger Doppelgänger aus Sternenstaub in Mintschimmer, der still steht und funkelt.
