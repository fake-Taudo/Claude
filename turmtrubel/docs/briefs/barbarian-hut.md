# Barbarenhütte (`barbarian-hut`)

> Gebäude-Spawner · Gebäude, Spawner · 6 Elixier · Herkunft: Nordvolk · Familie: Bauwerk · Größe XL (2,90 Felder)

## Konzept

Die Barbarenhütte ist ein gedrungenes Langhaus mit tief heruntergezogenem Grassodendach und einem Wolfsschädel über dem Tor. Aus dem Dachloch steigt Rauch, drinnen wird gelärmt. Alle paar Sekunden fliegt das Tor auf und Barbaren stürmen heraus.

## Eigenständigkeit

Ein grün bewachsenes Sodendach über dunklen Teerbalken mit Wolfsschädel ist bei keinem anderen Bauwerk zu finden; die Koboldhütte ist eine Flickwerk-Hütte, der Grabstein ein Stein. Barbarenhütten anderer Spiele sind Holzhütten mit Strohdach; diese ist ein Soden-Langhaus.

## Silhouette, Proportionen, Größe

- **Familie:** Bauwerk (Haus, Turm oder Grabmal mit Öffnung)
- **Silhouette:** Flacher, breiter Hügel aus Grassoden mit Dachloch, vorn ein tiefes Tor mit Wolfsschädel, an der Seite Holzstapel und eine Fahnenstange.
- **Übertriebenes Merkmal:** tief heruntergezogenes Grassodendach
- **Größenklasse:** XL, 2,90 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#5a7a34` | Grassoden-Grün (Dach) |
| Akzent | `#3a3330` | Teerschwarz (Balken) |
| Schatten | `#465e3d` · Tiefe `#384a44` | Hauptfarbe unten rechts, Falten (Akzent: `#312e3a`) |
| Licht · Glanz | `#92a36b` · `#d4dcca` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#353f32` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Torbehang, Dachfahne; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Wolfsschädel | `#e6dcc8` | Materialfarbe |
| Steinsockel | `#8a8478` | Materialfarbe |
| Torbehang | `#857565` | Materialfarbe |

## Signature-Element

**Langhaus mit Wolfsschädel über dem Tor** (Bauwerk-Merkmal). Ein Wolfsschädel mit Unterkiefer hängt über dem Tor, darunter ein Behang aus Fell.

## Details

- **Kleidung und Rüstung:** Sodendach mit Grasbüscheln, Teerbalken, Steinsockel
- **Materialien:** Grassoden, geteertes Holz, Stein, Knochen, Fell
- **Muster und Nähte:** Grasbüschel, Balkenfugen, Steinfugen
- **Schnallen, Nieten und Gravuren:** Eisenbeschläge am Tor
- **Abnutzung:** eingestürzte Sodenecke bei geringer Gesundheit, Rissspuren im Stein
- **Accessoires:** Torbehang und Dachfahne (Teamzonen), Holzstapel, Schild am Tor

## Gesicht und Ausdruck

Kein Gesicht; der Wolfsschädel wirkt als Gesicht, seine Augenhöhlen glimmen, wenn Barbaren kommen. Persönlichkeit: rauchend und lärmend.

## Waffe / Werkzeug

Keine Waffe; das Tor ist der Ausgang der Barbaren.

## Animationen

**Idle**

- Rauch steigt aus dem Dachloch
- Torbehang weht, die Fahne flattert

**Laufen**

- keine Fortbewegung

**Angriff**

- `char.spawnUnit`: Tor fliegt auf, Staub, Barbaren rennen heraus

**Treffer**

- Grasbüschel wackeln, Staub rieselt

**Erscheinen**

- wächst aus dem Boden: erst Sockel, dann Balken, dann das Dach plumpst drauf

**Tod**

- Dach sackt ein, Balken stürzen, Wolfsschädel rollt
