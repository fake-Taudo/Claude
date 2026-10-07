# Walküre (Held) (`valkyrie-hero`)

> Held · Nahkampf, Flächenschaden · 4 Elixier · Herkunft: Nordvolk · Familie: Breit · Größe L (2,05 Felder)
> Held von [`valkyrie`](valkyrie.md)

## Konzept

Die Walküre als Heldin trägt einen Sturmflügelhelm mit großen goldenen Schwingen, und an ihrer Radaxt hängen Windbänder. Mit ihrer Fähigkeit wirbelt sie dreieinhalb Sekunden lang wie ein Wirbelwind.

## Eigenständigkeit

Der Sturmflügelhelm mit goldenen Schwingen ist ihr Rang-Merkmal; Radaxt und Zöpfe zeigen die Basis-Walküre. Helleres Sturmgrau trennt sie farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Breit (Quadrat bis Trapez, breite Schultern, breiter Stand)
- **Silhouette:** Wie die Walküre, mit viel größeren Helmflügeln und flatternden Bändern.
- **Proportionsformel:** Kopf 0,31 · Beine 0,28 · Arme 0,90 · Hände 0,50 · Waffe/Signature 0,70 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Windbänder an der Axt
- **Größenklasse:** L, 2,05 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#7a9aa8` | Sturmgrau |
| Akzent | `#f0b24a` | Schwingengold |
| Schatten | `#5c748c` · Tiefe `#465877` | Hauptfarbe unten rechts, Falten (Akzent: `#ac854c`) |
| Licht · Glanz | `#a7b8b8` · `#dce5e8` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#424c60` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Gürtel, Windbänder; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Zöpfe | `#f2e6c4` | Materialfarbe |

## Signature-Element

**Sturmflügelhelm mit goldenen Schwingen** (Helm, Hut, Krone, Kapuze). Ein Helm mit großen goldenen Sturmschwingen.

## Details

- **Kleidung und Rüstung:** Sturmflügelhelm, Schuppenpanzer, Windbänder
- **Materialien:** Gold, Stahl, Seide
- **Muster und Nähte:** Wolkenornament
- **Schnallen, Nieten und Gravuren:** Radschnalle
- **Abnutzung:** keine
- **Accessoires:** Gürtel und Windbänder (Teamzonen)

## Gesicht und Ausdruck

Das Gesicht der Walküre mit Sommersprossen, im Sturm lachend mit offenem Mund und blitzenden Augen. Persönlichkeit: stürmisch.

## Waffe / Werkzeug

Radaxt mit Windbändern.

## Animationen

**Idle**

- Wirbelwind-Pose: Axt über dem Kopf kreisend

**Laufen**

- kraftvoller Schritt

**Angriff**

- Drehschlag

**Treffer**

- Bänder flattern

**Erscheinen**

- landet mit einem Windstoß

**Tod**

- dreht sich aus

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Wilder Wirbelwind: Dauerdrehung (Fähigkeits-Zustand); Event `char.ability.valkyrie-hero` mit Windwirbel. Rang-Merkmal: Sturmflügelhelm.
