# Nashorn (`rhino`)

> Beschwörung · Gebäudejäger, Nahkampf · Herkunft: Tiere und Drachen · Familie: Vierbeinig · Größe M (2,00 Felder)

## Konzept

Das Nashorn ist das sture, schnaubende Reittier des Dunklen Prinzen als Helden. Es hat ein Doppelhorn mit Sichelmond-Schutzplatte und Panzerfalten wie Plattenrüstung. Springt der Prinz ab, stürmt es allein auf Gebäude.

## Eigenständigkeit

Doppelhorn mit Sichelmond-Platte und Satteldecke ist einmalig. Kampfnashörner anderer Spiele sind grau ohne Wappen; dieses trägt das Sichelmond-Wappen des Prinzen.

## Silhouette, Proportionen, Größe

- **Familie:** Vierbeinig (liegendes Rechteck auf vier Beinen)
- **Silhouette:** Breites Vierbeiner-Rechteck mit großem Kopf und zwei Hörnern.
- **Proportionsformel:** Kopf 0,30 · Beine 0,25 · Arme 0,00 · Hände 0,00 · Waffe/Signature 0,50 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Panzerfalten wie Plattenrüstung
- **Größenklasse:** M, 2,00 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#8a8f80` | Graugrün |
| Akzent | `#c9b13f` | Messing (Platte) |
| Schatten | `#676d71` · Tiefe `#4d5365` | Hauptfarbe unten rechts, Falten (Akzent: `#928444`) |
| Licht · Glanz | `#b2b19d` · `#e1e2de` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#484850` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Satteldecke; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Satteldecke | `#ff00f1` | Materialfarbe |

## Signature-Element

**Doppelhorn mit Sichelmond-Schutzplatte** (Körpermerkmal (Bauch, Schädel, Ohren, Krater …)). Ein Doppelhorn mit einer Sichelmond-Schutzplatte aus Messing auf der Stirn.

## Details

- **Kleidung und Rüstung:** Satteldecke, Stirnplatte
- **Materialien:** Haut, Messing
- **Muster und Nähte:** Panzerfalten
- **Schnallen, Nieten und Gravuren:** Gurte
- **Abnutzung:** Kratzer
- **Accessoires:** Satteldecke (Teamzone)

## Gesicht und Ausdruck

Kleine sture Augen, schnaubende Nüstern. Persönlichkeit: stur und schnaubend.

## Waffe / Werkzeug

Doppelhorn mit Sichelmond-Platte aus Messing, mit dem es Gebäude rammt.

## Animationen

**Idle**

- scharrt mit dem Huf

**Laufen**

- schwerer Trab mit `char.step`

**Angriff**

- Kopf senken (Anticipation), Hornstoß

**Treffer**

- schnaubt

**Erscheinen**

- erscheint, wenn der Prinz abspringt

**Tod**

- fällt auf die Seite

## Besonderheiten

- **Ansturm (`charge`):** gesenkter Kopf, Staubfahne.
