# Ballon (Held) (`balloon-hero`)

> Held · Flieger, Gebäudejäger, Nahkampf · 5 Elixier · Herkunft: Gesindel · Familie: Schwebend · Größe XL (2,75 Felder)
> Held von [`balloon`](balloon.md)

## Konzept

Der Ballon als Held ist ein lachsfarbener Zwiebelkuppel-Ballon mit einem Fallschirm-Ausleger am Korb. Neben dem Gnom-Piloten sitzt ein Skelett-Kadett, der mit Fallschirm auf Bodentruppen abspringt.

## Eigenständigkeit

Der Skelett-Kadett im Korb ist sein Rang-Merkmal; Zwiebelkuppel und Gnom zeigen den Basis-Ballon. Lachs statt Pflaume trennt ihn farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Schwebend (Tropfen ohne Füße, unten Schweif, Korb oder Fass)
- **Silhouette:** Wie der Ballon, dazu ein Ausleger und ein zweiter Kopf im Korb.
- **Proportionsformel:** Kopf 0,12 · Beine 0,00 · Arme 0,55 · Hände 0,40 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Fallschirm-Ausleger am Korb
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#f08a5a` | Lachs (Hülle) |
| Akzent | `#2f4f6f` | Nachtblau-Grau (Nähte) |
| Schatten | `#ac6957` · Tiefe `#7a5154` | Hauptfarbe unten rechts, Falten (Akzent: `#294165`) |
| Licht · Glanz | `#f5ae84` · `#fbe1d4` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#714641` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Wimpelkette, Korbrand; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Korb | `#a8763e` | Materialfarbe |

## Signature-Element

**Skelett-Kadett mit Fallschirm im Korb** (Tier oder Wesen, das mitkommt). Ein Skelett-Kadett mit Fallschirm sitzt im Korb.

## Details

- **Kleidung und Rüstung:** Gnom mit Fliegermütze, Kadett mit Brille
- **Materialien:** Stoff, Weide, Knochen
- **Muster und Nähte:** Flicken
- **Schnallen, Nieten und Gravuren:** Ausleger-Seile
- **Abnutzung:** Flicken
- **Accessoires:** Wimpelkette und Korbrand (Teamzonen)

## Gesicht und Ausdruck

Gnom kichernd, Kadett salutierend. Persönlichkeit: Pilot und Kadett salutieren.

## Waffe / Werkzeug

Eisenbomben mit Flossen und der Skelett-Kadett, der als lebendes Geschoss abspringt.

## Animationen

**Idle**

- Absprung-Pose: der Kadett klettert auf den Korbrand

**Laufen**

- gleitet

**Angriff**

- Bombenabwurf

**Treffer**

- Hülle bebt

**Erscheinen**

- schwebt herab

**Tod**

- trudelt, Todesbombe

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Sargkadetten: Kadett springt mit Schirm (Pose am Korbrand); Event `char.ability.balloon-hero`. Rang-Merkmal: Skelett-Kadett mit Fallschirm.
