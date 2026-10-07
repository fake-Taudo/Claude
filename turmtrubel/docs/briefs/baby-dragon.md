# Drachenbaby (`baby-dragon`)

> Truppe · Flieger, Fernkampf, Flächenschaden · 4 Elixier · Herkunft: Tiere und Drachen · Familie: Geflügelt · Größe M (1,75 Felder)

## Konzept

Das Drachenbaby ist ein verspieltes, neugieriges Drachenkind in Türkis, das noch die obere Hälfte seiner Eierschale wie eine Mütze trägt. Es hat einen Kopf so groß wie den Bauch und Stummelflügel. Es spuckt Feuerbälle und hustet danach Rauch.

## Eigenständigkeit

Die Eierschalen-Mütze mit Zackenrand ist einmalig; das Türkis unterscheidet es von allen anderen Drachen (Elektrodrache Indigo, Infernodrache Rußrot, Phönix Gold). Drachenbabys anderer Spiele sind grün; dieses ist türkis mit Lätzchen.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Rundlicher Körper mit riesigem Kopf, Zackenschale obenauf, zwei kleine Flügel, kurzer Schwanz.
- **Proportionsformel:** Kopf 0,45 · Beine 0,15 · Arme 0,40 · Hände 0,40 · Waffe/Signature 0,60 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Kopf so groß wie der Bauch, Stummelflügel
- **Größenklasse:** M, 1,75 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#35b6a0` | Türkis (Schuppen) |
| Akzent | `#ffe3b0` | Creme (Bauch, Schale) |
| Schatten | `#2d8786` · Tiefe `#286473` | Hauptfarbe unten rechts, Falten (Akzent: `#b7a691`) |
| Licht · Glanz | `#7acbb2` · `#caece6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#26575d` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Lätzchen; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Hörnchen | `#f0e0c0` | Materialfarbe |
| Flügelhaut | `#7fd8c8` | Materialfarbe |

## Signature-Element

**Eierschalen-Mütze** (Helm, Hut, Krone, Kapuze). Die obere Eierschale mit Zackenrand sitzt wie eine Mütze auf dem Kopf.

## Details

- **Kleidung und Rüstung:** Eierschale, Lätzchen
- **Materialien:** Schuppen, Eierschale, Stoff
- **Muster und Nähte:** Bauchschuppen-Ringe, Punkte auf der Schale
- **Schnallen, Nieten und Gravuren:** Lätzchenknoten
- **Abnutzung:** Rußflecken am Lätzchen
- **Accessoires:** Lätzchen (Teamzone)

## Gesicht und Ausdruck

Große, glänzende Kinderaugen, Stupsnase mit Rauchwölkchen und breites Grinsen mit einem Zahn. Persönlichkeit: verspielt und neugierig.

## Waffe / Werkzeug

Feuerball aus dem Maul.

## Animationen

**Idle**

- schielt nach der Eierschale, Schwanz wedelt
- Flügelschlag mit `char.flap`

**Laufen**

- flattert, kippelt im Flug

**Angriff**

- holt Luft (Anticipation: Bauch bläht sich, Squash), spuckt Feuerball (Stretch), hustet Rauch

**Treffer**

- Schale rutscht übers Auge

**Erscheinen**

- schlüpft aus einem Feuerball

**Tod**

- trudelt, die Schale fällt ab

## Besonderheiten

- **Evolution:** Windstoß-Evo: Ein kleines Windrad auf der Eierschale, gefiederte Flügelspitzen und Windbänder am Schwanz. Luftwirbel bilden die Partikelhülle; jeder Angriff erzeugt einen Windstoß-Ring.
