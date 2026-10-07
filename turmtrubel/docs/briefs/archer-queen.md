# Bogenschützen-Königin (`archer-queen`)

> Champion · Fernkampf · 5 Elixier · Herkunft: Krone · Familie: Hochgewachsen · Größe L (2,15 Felder)

## Konzept

Die Bogenschützen-Königin ist eine kühle, elegante Herrscherin in Smaragd und Gold mit steifer Spitzenkrause und einer Armbrust in Form einer Mondsichel. Mit ihrer Fähigkeit hüllt sie sich in die Schleppe ihres Umhangs, wird unsichtbar und schießt doppelt so schnell.

## Eigenständigkeit

Die Mondsichel-Armbrust (Bogenarme als Sichel, Schaft wie ein Szepter) und die bis über die Ohren reichende Spitzenkrause gibt es nur bei ihr. Andere Schützinnen haben Fächerköcher, Muskete oder Harfenbogen. Bekannte Bogenköniginnen tragen Langbogen und Tiara mit buntem Haar; diese trägt eine Hochsteckfrisur mit Mondnadel und schießt mit einer Sichel-Armbrust.

## Silhouette, Proportionen, Größe

- **Familie:** Hochgewachsen (hohes Rechteck, lange Beine oder Robe, hohe Kopfbedeckung)
- **Silhouette:** Hoch und schmal; oben die hohe Frisur mit Mondnadel und die Krause wie ein Fächer um den Hals, unten eine lange Schleppe, vorn die Armbrust mit sichelförmigem Bogen.
- **Proportionsformel:** Kopf 0,27 · Beine 0,42 · Arme 0,95 · Hände 0,38 · Waffe/Signature 0,80 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** steife Spitzenkrause bis über die Ohren
- **Größenklasse:** L, 2,15 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#1f6b52` | Smaragd (Kleid, Umhang) |
| Akzent | `#e8b33c` | Gold (Sichel, Krone, Stickerei) |
| Schatten | `#1e5451` · Tiefe `#1e4351` | Hauptfarbe unten rechts, Falten (Akzent: `#a78542`) |
| Licht · Glanz | `#6b997f` · `#c5d9d2` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#1d393e` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schleppe des Umhangs, Kronenjuwel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Spitze | `#f6f0e4` | Materialfarbe |
| Haar | `#3a2236` | Materialfarbe |
| Mondsilber | `#dfe6f2` | Materialfarbe |

## Signature-Element

**Mondsichel-Armbrust** (Waffe mit eigener Form). Die Bogenarme bilden eine Mondsichel aus Gold mit Silberkante; der Schaft endet in einem Kronen-Knauf.

## Details

- **Kleidung und Rüstung:** langes Kleid mit Schleppe, enges Mieder, Spitzenkrause, Halbhandschuhe, Umhang mit Schleppe
- **Materialien:** Samt, Spitze, Gold, Mondsilber
- **Muster und Nähte:** Mondphasen-Stickerei am Saum, Spitzenmuster an der Krause
- **Schnallen, Nieten und Gravuren:** Mondbrosche am Umhang, Goldknöpfe am Mieder
- **Abnutzung:** keine sichtbare, königlich gepflegt
- **Accessoires:** Schleppe des Umhangs und Kronenjuwel (Teamzonen), Mondnadel im Haar

## Gesicht und Ausdruck

Schmales Gesicht mit hohen Wangenknochen, eine hochgezogene Augenbraue, schmale Lippen; der Blick halb gesenkt. Beim Zielen verengen sich die Augen, getroffen öffnet sie empört den Mund. Persönlichkeit: kühl und überlegen, hochgezogene Augenbraue.

## Waffe / Werkzeug

Mondsichel-Armbrust mit Goldbogen, Silberkante, Kurbel am Schaft und Bolzen mit Mond-Federn.

## Animationen

**Idle**

- prüft die Sehne mit spitzen Fingern
- Umhang weht, sie streicht die Krause glatt

**Laufen**

- gemessener Schritt, Schleppe zieht nach

**Angriff**

- Armbrust anlegen (Anticipation), kurzes Zielen mit geneigtem Kopf
- Schuss mit Rückstoß, die Sichel federt

**Treffer**

- Kopf zur Seite, die Krause wackelt

**Erscheinen**

- schwebt mit gebauschter Schleppe herab

**Tod**

- sinkt auf die Knie, die Krone rutscht
- Schleppe deckt sie zu, dann verblasst sie

## Besonderheiten

- **Fähigkeit (Champion):** Tarnumhang: Sie wirft die Schleppe wie einen Mantel über sich (Pose), wird halbdurchsichtig mit leuchtenden Augen und schießt schnell. Event `char.ability.archer-queen` erzeugt einen Schleier aus Mondfunken.
- **Aura und Effekt-Hooks:** Smaragdgrüne Bodenaura mit Mondsicheln; `char.release` lässt Goldfunken an der Sichel aufblitzen.
