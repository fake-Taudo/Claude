# Eisgolem (Held) (`ice-golem-hero`)

> Held · Gebäudejäger, Nahkampf · 2 Elixier · Herkunft: Elementar · Familie: Kugelig · Größe L (2,05 Felder)
> Held von [`ice-golem`](ice-golem.md)

## Konzept

Der Eisgolem als Held trägt eine Eiskrone mit Schneeflocken-Zacken und eine Frostschärpe, und um seinen Bauch kreist ein kleiner Schneesturm. Mit seiner Fähigkeit stößt er dreimal Eis in die Runde.

## Eigenständigkeit

Die Eiskrone und der kreisende Schneewirbel sind sein Rang-Merkmal; der eingefrorene Fisch und der Schal zeigen den Basis-Eisgolem. Die hellere Eisfarbe und das Gold der Krone trennen ihn farblich. Eis-Helden anderer Spiele sind Kristallriesen; dieser trägt eine Krone über einem Fisch.

## Silhouette, Proportionen, Größe

- **Familie:** Kugelig (Kreis mit Stummelbeinen)
- **Silhouette:** Wie der Eisgolem (Kugel mit Fisch), oben eine zackige Krone, um den Bauch ein Wirbelring.
- **Proportionsformel:** Kopf 0,28 · Beine 0,18 · Arme 0,80 · Hände 0,55 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Schneesturm-Wirbel um den Bauch
- **Größenklasse:** L, 2,05 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#c8f0ff` | Gletscherweiß |
| Akzent | `#ffcf6b` | Kronengold |
| Schatten | `#91afc7` · Tiefe `#687e9d` | Hauptfarbe unten rechts, Falten (Akzent: `#b79862`) |
| Licht · Glanz | `#dbf1f1` · `#f1fbff` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#616e83` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Frostschärpe, Strickschal; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Fisch | `#ff9a62` | Materialfarbe |

## Signature-Element

**Eiskrone mit Schneeflocken-Zacken** (Helm, Hut, Krone, Kapuze). Eine Krone aus Eiszacken in Schneeflockenform mit Goldrand.

## Details

- **Kleidung und Rüstung:** Eiskrone, Frostschärpe, Strickschal
- **Materialien:** Eis, Gold, Wolle
- **Muster und Nähte:** Schneeflocken
- **Schnallen, Nieten und Gravuren:** keine
- **Abnutzung:** Schmelztropfen
- **Accessoires:** Frostschärpe und Strickschal (Teamzonen)

## Gesicht und Ausdruck

Majestätisch-verschlafen, gähnt mit hochgezogenen Brauen. Persönlichkeit: majestätisch-verschlafen.

## Waffe / Werkzeug

Kopfstoß und Eisstöße.

## Animationen

**Idle**

- Schneesturm-Pose: Arme hoch, der Wirbel kreist

**Laufen**

- Watschelgang, der Wirbel folgt

**Angriff**

- Kopfstoß

**Treffer**

- Eis splittert

**Erscheinen**

- landet mit Schneewirbel

**Tod**

- zerspringt, die Krone bleibt liegen

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Schneesturm: drei Stampfer mit Armen hoch; Event `char.ability.ice-golem-hero` pro Stoß. Rang-Merkmal: Eiskrone.
