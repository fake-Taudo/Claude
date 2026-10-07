# Magier (Held) (`wizard-hero`)

> Held · Fernkampf, Flächenschaden · 5 Elixier · Herkunft: Zirkel · Familie: Dreieckig · Größe L (2,05 Felder)
> Held von [`wizard`](wizard.md)

## Konzept

Der Magier als Held ist ein großspuriger Feuermagier in fuchsiafarbener Robe, dessen Flammenumhang sich zu Flügeln öffnet. Mit seiner Fähigkeit fliegt er kurz und erzeugt Feuerwirbel, die Gegner anziehen.

## Eigenständigkeit

Der Flammenumhang, der zu Flügeln aufgeht, ist sein Rang-Merkmal; das fliegende Zauberbuch und die Ballonärmel zeigen den Basis-Magier. Fuchsia statt Weinrot trennt ihn farblich. Fliegende Helden-Magier anderer Spiele reiten Besen; dieser fliegt mit seinem Umhang.

## Silhouette, Proportionen, Größe

- **Familie:** Dreieckig (breiter Saum unten (Robe, Kleid, Mantel), schmaler Kopf oben)
- **Silhouette:** Wie der Magier (Dreieck, Buch), dazu ein breiter Umhang mit Flammenrand, im Flug als Flügel ausgebreitet.
- **Proportionsformel:** Kopf 0,30 · Beine 0,00 · Arme 0,85 · Hände 0,45 · Waffe/Signature 0,35 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Feuerflügel im Flug
- **Größenklasse:** L, 2,05 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#b4307a` | Fuchsia (Robe) |
| Akzent | `#ff8a3a` | Flammenorange (Umhang) |
| Schatten | `#842c6d` · Tiefe `#5f2962` | Hauptfarbe unten rechts, Falten (Akzent: `#b76941`) |
| Licht · Glanz | `#ce7299` · `#ecc9dc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#59224e` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Gürtelschärpe, Hutband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Buch | `#5a3a28` | Materialfarbe |
| Bart | `#d8d0c4` | Materialfarbe |

## Signature-Element

**Flammenumhang, der sich zu Flügeln öffnet** (Umhang, Mantel, Kragen). Ein Umhang mit Flammenrand, der sich zu zwei Feuerflügeln öffnet.

## Details

- **Kleidung und Rüstung:** Robe, Flammenumhang, Hut mit Flamme
- **Materialien:** Samt, Feuer
- **Muster und Nähte:** Flammenstickerei
- **Schnallen, Nieten und Gravuren:** Flammenbrosche
- **Abnutzung:** angesengter Saum
- **Accessoires:** Gürtelschärpe und Hutband (Teamzonen)

## Gesicht und Ausdruck

Das Magiergesicht, großspurig mit hochgerecktem Bart. Persönlichkeit: großspurig, hebt ab.

## Waffe / Werkzeug

Feuerspuckendes Buch.

## Animationen

**Idle**

- Flug-Pose: Umhang bauscht sich, die Füße heben leicht ab

**Laufen**

- wehender Schritt

**Angriff**

- Taktstock hoch, das Buch spuckt

**Treffer**

- Umhang flackert

**Erscheinen**

- landet mit Flammenring

**Tod**

- Umhang erlischt, er sinkt zusammen

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Feuriger Flug: Umhang zu Flügeln, Füße hoch (Flug-Zustand über `FLY`); Event `char.ability.wizard-hero` erzeugt Flammenflügel. Rang-Merkmal: Flammenumhang.
