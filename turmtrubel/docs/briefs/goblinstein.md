# Goblinstein (`goblinstein`)

> Champion · Fernkampf · 5 Elixier · Herkunft: Kobolde · Familie: Schlank · Größe M (1,95 Felder)

## Konzept

Goblinstein ist ein größenwahnsinniger Kobold-Doktor im weißen Laborkittel mit dicker Schweißerbrille. Er steuert sein Monster mit einem Fernsteuerkasten samt Blitzantenne und schießt selbst Blitze. Er lacht irre.

## Eigenständigkeit

Der Fernsteuerkasten mit Antenne und die Schweißerbrille auf dem weißen Kittel sind einmalig; nur er bildet mit einer zweiten Figur (dem Monster) ein Paar. Verrückte Wissenschaftler anderer Spiele haben wilde Haare und Kolben; dieser hat eine Funkantenne.

## Silhouette, Proportionen, Größe

- **Familie:** Schlank (schmales Hochrechteck, lange Diagonale durch Waffe oder Werkzeug)
- **Silhouette:** Schlank im langen Kittel, Kopf mit großer Brille, die Antenne ragt hoch über den Kopf.
- **Proportionsformel:** Kopf 0,34 · Beine 0,34 · Arme 0,90 · Hände 0,45 · Waffe/Signature 0,55 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Schweißerbrille mit dicken Gläsern
- **Größenklasse:** M, 1,95 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#eef0f2` | Laborweiß (Kittel) |
| Akzent | `#7b4fd1` | Blitzviolett |
| Schatten | `#abafbe` · Tiefe `#797e97` | Hauptfarbe unten rechts, Falten (Akzent: `#5d41a8`) |
| Licht · Glanz | `#f4f1e8` · `#fbfbfc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#706e7e` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Armbinde, Brillenband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Haut | `#8fbf6a` | Materialfarbe |
| Kasten | `#5a5f6b` | Materialfarbe |
| Brillengläser | `#9ff0ff` | Materialfarbe |

## Signature-Element

**Fernsteuerkasten mit Blitzantenne** (Werkzeug oder Gerät). Ein Fernsteuerkasten mit zwei Hebeln, Knöpfen und einer Teleskopantenne, die beim Blitz leuchtet.

## Details

- **Kleidung und Rüstung:** Laborkittel mit Rissen, Gummihandschuhe, Schürze, Stiefel
- **Materialien:** Baumwolle, Gummi, Messing, Glas
- **Muster und Nähte:** Brandlöcher, Kittelfalten
- **Schnallen, Nieten und Gravuren:** Kittelknöpfe, Brillenriemen
- **Abnutzung:** verkohlter Ärmel
- **Accessoires:** Armbinde und Brillenband (Teamzonen), Kugelschreiber in der Tasche

## Gesicht und Ausdruck

Schmales Koboldgesicht mit vergrößerten Augen hinter der Brille, irrem Grinsen und zerzausten Haarbüscheln. Persönlichkeit: größenwahnsinnig, lacht irre.

## Waffe / Werkzeug

Fernsteuerkasten mit Blitzantenne.

## Animationen

**Idle**

- drückt Knöpfe am Kasten, die Antenne funkt

**Laufen**

- eiliger, gebückter Gang

**Angriff**

- reckt die Antenne (Anticipation), Blitz auf das Ziel

**Treffer**

- Brille rutscht

**Erscheinen**

- landet, lacht irre

**Tod**

- Kasten explodiert in seinen Händen, Rauch

## Besonderheiten

- **Fähigkeit (Champion):** Blitzverbindung: Er stemmt den Kasten hoch und dreht beide Hebel (Pose). Event `char.ability.goblinstein` lässt einen Blitzbogen zum Monster springen, der 3,5 s pulsiert.
- **Aura und Effekt-Hooks:** Violette Bodenaura mit Funkwellen; `char.release` erzeugt Funken an der Antenne.
