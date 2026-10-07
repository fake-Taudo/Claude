# Nachthexe (`night-witch`)

> Truppe · Spawner, Nahkampf · 4 Elixier · Herkunft: Zirkel · Familie: Hochgewachsen · Größe L (2,10 Felder)

## Konzept

Die Nachthexe ist eine träge, spöttische Hexe im mitternachtsfarbenen Mantel. Ihr Hut ist ein kleiner Glockenturm, in dessen Glockenstuhl Fledermäuse schlafen. Läutet die Glocke, fliegen zwei heraus, und mit ihrem Sichelstab schlägt sie selbst zu.

## Eigenständigkeit

Der Glockenturm-Hut mit Glocke und Fledermäusen ist einmalig; die Fledermäuse haben dadurch ein Zuhause. Andere Hexen haben eine Krähe oder einen Kessel. Nachthexen anderer Spiele haben Fledermausflügel; diese hat einen Turm-Hut.

## Silhouette, Proportionen, Größe

- **Familie:** Hochgewachsen (hohes Rechteck, lange Beine oder Robe, hohe Kopfbedeckung)
- **Silhouette:** Hoch mit schmalem Turm-Hut, der eine offene Glockenstube und ein Spitzdach hat; der Sichelstab bildet einen Haken.
- **Proportionsformel:** Kopf 0,24 · Beine 0,42 · Arme 1,00 · Hände 0,40 · Waffe/Signature 0,80 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Hut mit kleinem Glockenstuhl
- **Größenklasse:** L, 2,10 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#2e2448` | Mitternacht (Mantel) |
| Akzent | `#c8d0e0` | Mondsilber (Glocke, Sichel) |
| Schatten | `#29244b` · Tiefe `#24244c` | Hauptfarbe unten rechts, Falten (Akzent: `#9199b2`) |
| Licht · Glanz | `#756a78` · `#c9c6cf` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#231d3a` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Mantelfutter, Glockenseil; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Hutmauer | `#4a4060` | Materialfarbe |
| Glocke | `#c8ccd8` | Materialfarbe |
| Haut | `#d0c8e0` | Materialfarbe |

## Signature-Element

**Glockenturm-Hut, aus dem Fledermäuse fliegen** (Helm, Hut, Krone, Kapuze). Hut als Glockenturm: Mauerwerk, eine Glocke im offenen Stuhl, Fledermäuse hängen kopfüber.

## Details

- **Kleidung und Rüstung:** Turm-Hut, Mantel mit Fledermaus-Zackenkragen, spitze Stiefel
- **Materialien:** Samt, Stein, Silber
- **Muster und Nähte:** Mauerfugen am Hut, Mondsicheln am Saum
- **Schnallen, Nieten und Gravuren:** Sichelbrosche
- **Abnutzung:** Spinnweben am Hut
- **Accessoires:** Mantelfutter und Glockenseil (Teamzonen)

## Gesicht und Ausdruck

Blasses Gesicht mit halb geschlossenen, gelangweilten Augen, dunklen Lippen und spöttischem Mundwinkel. Persönlichkeit: träge und spöttisch, gähnt.

## Waffe / Werkzeug

Sichelstab mit Mondsichel-Klinge.

## Animationen

**Idle**

- die Glocke schwingt, eine Fledermaus guckt heraus
- gähnt

**Laufen**

- schwebender Gang, der Mantel schleift

**Angriff**

- Sichelstab-Hieb mit Drehung

**Treffer**

- Glocke bimmelt, Fledermäuse flattern

**Erscheinen**

- landet, die Glocke läutet einmal

**Tod**

- Glocke läutet ein letztes Mal, eine Fledermaus fliegt heraus, sie verblasst

## Besonderheiten

- **Fledermäuse rufen (`char.spawnUnit`):** Die Glocke schwingt stark, zwei Fledermäuse fliegen aus dem Hut.
