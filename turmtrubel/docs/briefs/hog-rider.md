# Schweinereiter (`hog-rider`)

> Truppe · Gebäudejäger, Nahkampf · 4 Elixier · Herkunft: Krone · Familie: Reiter · Größe L (2,15 Felder)

## Konzept

Der Schweinereiter ist ein übermütiger Jockey in rautengemusterter Rennseide mit Rennbrille, der auf einem Borstenschwein zu Gebäuden galoppiert. Vor der Schweineschnauze baumelt an einer Angel eine Karotte. Er spielt Polo mit Türmen und jauchzt dabei.

## Eigenständigkeit

Die Karottenangel vor dem Reittier ist ein einmaliges Merkmal. Der Prinz reitet ein Pferd, der dunkle Prinz einen Waran, die Widderreiterin einen Widder. Schweinereiter anderer Spiele sind grobe Krieger mit Hammer; dieser ist ein schmaler Jockey mit Rennbrille und Polo-Schläger.

## Silhouette, Proportionen, Größe

- **Familie:** Reiter (Tierkörper plus aufrechte Figur darüber)
- **Silhouette:** Rundes Schwein im Halbprofil mit kurzen Beinen und großer Schnauze; darüber der kleine, nach vorn gebeugte Jockey. Die Angel ragt als Bogen nach vorn, die Karotte hängt vor der Schnauze.
- **Proportionsformel:** Kopf 0,26 · Beine 0,00 · Arme 0,85 · Hände 0,45 · Waffe/Signature 0,60 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Rennbrille und flatternde Jockeymütze
- **Größenklasse:** L, 2,15 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#b3735a` | Borstenschwein-Braunrosa |
| Akzent | `#ff8c1a` | Karottenorange |
| Schatten | `#835a57` · Tiefe `#5f4754` | Hauptfarbe unten rechts, Falten (Akzent: `#b76b2b`) |
| Licht · Glanz | `#cd9f84` · `#ebdbd4` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#583c41` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Rennseide-Rauten, Satteldecke; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Rennseide (weiß) | `#f4f0e6` | Materialfarbe |
| Sattelleder | `#6b3e22` | Materialfarbe |
| Brille (Messing) | `#c8a046` | Materialfarbe |

## Signature-Element

**Karottenangel vor der Schweineschnauze** (besonderes Reittier). Eine Bambusangel am Sattel, an deren Schnur eine Karotte mit Grün direkt vor der Schnauze baumelt.

## Details

- **Kleidung und Rüstung:** Rennseide mit Rautenmuster, Jockeymütze mit Schirm, Rennbrille, Reithose, Stiefel
- **Materialien:** Seide, Leder, Messing, Bambus, Borsten
- **Muster und Nähte:** Rauten auf der Seide (Teamzone), Borstenstriche am Schwein
- **Schnallen, Nieten und Gravuren:** Sattelgurt, Brillenriemen
- **Abnutzung:** Schlammspritzer an Stiefeln und Schweinebeinen
- **Accessoires:** Rennseide-Rauten und Satteldecke (Teamzonen), Startnummer am Rücken

## Gesicht und Ausdruck

Jockey mit breitem Grinsen und Zahnlücke, die Augen hinter der Rennbrille; das Schwein mit Hängeohren und gierigem Blick auf die Karotte. Beim Sprung reißen beide die Münder auf. Persönlichkeit: übermütig, jauchzt.

## Waffe / Werkzeug

Polo-Schläger mit langem Bambusstiel und zylindrischem Holzkopf.

## Animationen

**Idle**

- Schwein scharrt und schnüffelt nach der Karotte
- Jockey wippt im Sattel

**Laufen**

- Galopp mit Wellen durch den Schweinerücken
- Karotte schaukelt vor der Schnauze

**Angriff**

- Schläger weit nach hinten (Anticipation), seitlicher Polo-Schlag
- Follow-through über den Kopf

**Treffer**

- Schwein quiekt, die Ohren fliegen hoch

**Erscheinen**

- galoppiert aus der Landung an

**Tod**

- Schwein setzt sich auf den Hintern, der Jockey purzelt ab
- die Karotte bleibt kurz liegen und verblasst

## Besonderheiten

- **Flusssprung (`JUMP`):** Schwein streckt alle vier Beine, die Ohren flattern, die Karotte schwingt nach oben.
