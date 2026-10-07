# Koboldbohrer (`goblin-drill`)

> Gebäude-Spawner · Gebäude, Spawner · 4 Elixier · Herkunft: Kobolde · Familie: Bauwerk · Größe XL (2,60 Felder)

## Konzept

Der Koboldbohrer ist ein Bohrturm aus Kupfer mit einer Riesenschraube, die sich überall durch den Boden gräbt. Ein Kobold-Fahrer sitzt oben, und aus einer Luke hüpfen ständig Kobolde.

## Eigenständigkeit

Riesenschraube plus Bohrturm mit Fahrersitz ist eine einmalige Bauwerk-Form; die Erdbrocken beim Auftauchen sind sein Effekt. Bohrer anderer Spiele sind graue Maschinen; dieser ist ein kupferner Turm mit Fahrer.

## Silhouette, Proportionen, Größe

- **Familie:** Bauwerk (Haus, Turm oder Grabmal mit Öffnung)
- **Silhouette:** Spitzer Kegel (Schraube) mit Kupferturm darüber, Fahrer oben, Luke an der Seite.
- **Übertriebenes Merkmal:** Riesenschraube
- **Größenklasse:** XL, 2,60 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#a05a36` | Kupfer-Rost (Turm) |
| Akzent | `#e0b040` | Goldgelb (Schraube, Lampen) |
| Schatten | `#76493e` · Tiefe `#573c45` | Hauptfarbe unten rechts, Falten (Akzent: `#a28345`) |
| Licht · Glanz | `#c08e6c` · `#e6d4cb` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#513232` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Turmfahne, Fahrerhelm; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Schraube (Stahl) | `#a8b0ba` | Materialfarbe |
| Erde | `#6b4a32` | Materialfarbe |

## Signature-Element

**Bohrturm mit Schraubenspitze und Kobold-Fahrer** (Bauwerk-Merkmal). Riesige Schraubenspitze mit Gewindegängen und ein Kobold-Fahrer mit Helm.

## Details

- **Kleidung und Rüstung:** Bohrturm mit Kabine, Kurbel, Lampen
- **Materialien:** Kupfer, Stahl, Glas
- **Muster und Nähte:** Gewinde, Nieten
- **Schnallen, Nieten und Gravuren:** Lukenriegel
- **Abnutzung:** Erdreste, Kratzer
- **Accessoires:** Turmfahne und Fahrerhelm (Teamzonen)

## Gesicht und Ausdruck

Der Fahrer hat eine Brille und schreit vor Freude. Persönlichkeit: rattert und ruckelt.

## Waffe / Werkzeug

Keine; Kobolde kommen heraus.

## Animationen

**Idle**

- Schraube dreht, Erdbrocken fliegen

**Laufen**

- keine Fortbewegung

**Angriff**

- `char.spawnUnit`: Luke springt auf, ein Kobold hüpft heraus

**Treffer**

- Rattert, Funken

**Erscheinen**

- bohrt sich mit Erdfontäne aus dem Boden

**Tod**

- Schraube bricht, der Turm kippt

## Besonderheiten

- **Evolution:** Wander-Evo: Eine Doppelschraube mit leuchtenden Gewindegängen, der Fahrer bekommt eine Grubenlampe und eine Karte. Erdfunken bilden die Partikelhülle; beim Abtauchen und Auftauchen gibt es eigene Wirbel.
