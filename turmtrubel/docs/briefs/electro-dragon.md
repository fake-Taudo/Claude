# Elektrodrache (`electro-dragon`)

> Truppe · Flieger, Fernkampf · 5 Elixier · Herkunft: Tiere und Drachen · Familie: Geflügelt · Größe M (2,00 Felder)

## Konzept

Der Elektrodrache ist ein nervöser, zuckender Drache in sattem Indigo mit einem Blitzableiter-Horn samt Kupferspule auf der Nase und einer statisch abstehenden Mähne. Sein Blitz springt auf bis zu drei Ziele über.

## Eigenständigkeit

Das Blitzableiter-Horn mit Spule ist einmalig; die statische Mähne ist sein Übertreibungsmerkmal. Elektrodrachen anderer Spiele sind blau-weiß; dieser ist indigo mit Kupfer.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Schlanker Drache mit langem Hals, Horn mit Spule vorn, zackige Mähne, lange Flügel.
- **Proportionsformel:** Kopf 0,30 · Beine 0,15 · Arme 0,40 · Hände 0,40 · Waffe/Signature 0,90 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** statisch abstehende Mähne
- **Größenklasse:** M, 2,00 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#3a3aa0` | Indigo |
| Akzent | `#ffe14a` | Blitzgelb |
| Schatten | `#313386` · Tiefe `#2a2e73` | Hauptfarbe unten rechts, Falten (Akzent: `#b7a54c`) |
| Licht · Glanz | `#7d79b2` · `#cccce6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#28265d` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Flügelsaum; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Kupferspule | `#c87a3a` | Materialfarbe |
| Bauch | `#8a8ad0` | Materialfarbe |

## Signature-Element

**Blitzableiter-Horn mit Kupferspule** (Körpermerkmal (Bauch, Schädel, Ohren, Krater …)). Ein Blitzableiter-Horn mit Kupferspule auf der Nase.

## Details

- **Kleidung und Rüstung:** keine
- **Materialien:** Schuppen, Kupfer
- **Muster und Nähte:** Blitzzacken auf den Flügeln
- **Schnallen, Nieten und Gravuren:** Spulenklammer
- **Abnutzung:** angesengte Flügelränder
- **Accessoires:** Flügelsaum (Teamzone)

## Gesicht und Ausdruck

Zuckende, gelbe Augen und ein offenes Maul mit Funken zwischen den Zähnen. Persönlichkeit: nervös, zuckt.

## Waffe / Werkzeug

Kettenblitz aus dem Maul.

## Animationen

**Idle**

- Funken zwischen Horn und Schwanzspitze, Mähne knistert

**Laufen**

- ruckartiger Flug mit `char.flap`

**Angriff**

- Horn lädt (Anticipation), Kettenblitz aus dem Maul

**Treffer**

- Mähne zuckt

**Erscheinen**

- erscheint aus einem Blitz

**Tod**

- Kurzschluss, trudelt ab

## Besonderheiten

- **Evolution:** Gewitter-Evo: Eine zweite Spule an der Schwanzspitze, leuchtende Blitzadern auf den Flügeln und eine Gewitterwolken-Mähne. Funkenregen bildet die Partikelhülle.
