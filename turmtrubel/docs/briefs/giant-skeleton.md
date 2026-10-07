# Riesenskelett (`giant-skeleton`)

> Truppe · Tank, Nahkampf · 6 Elixier · Herkunft: Gruft · Familie: Massig · Größe XL (2,90 Felder)

## Konzept

Das Riesenskelett ist ein dröhnend lachender Knochenriese mit einer tickenden Uhrwerk-Bombe im Brustkorb. Er schlägt mit riesigen Fingerknochen-Fäusten. Fällt er, rollt die Bombe heraus und explodiert nach drei Sekunden.

## Eigenständigkeit

Die Uhrwerk-Bombe mit Zahnrädern zwischen den Rippen ist einmalig; die vergilbten Knochen und das Halstuch unterscheiden ihn von allen anderen Skeletten. Riesenskelette anderer Spiele tragen die Bombe in der Hand; dieses trägt sie im Brustkorb.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig, großer Schädel, breiter Brustkorb mit runder Bombe innen, riesige Knochenhände.
- **Proportionsformel:** Kopf 0,24 · Beine 0,30 · Arme 1,10 · Hände 0,70 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Riesenfäuste aus Fingerknochen
- **Größenklasse:** XL, 2,90 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#d9c9a0` | Vergilbter Knochen |
| Akzent | `#3d4a3a` | Eisendunkel (Bombe) |
| Schatten | `#9d9486` · Tiefe `#706d73` | Hauptfarbe unten rechts, Falten (Akzent: `#333e41`) |
| Licht · Glanz | `#e6d7b2` · `#f5f1e6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#685f5d` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Halstuch, Armband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Zahnräder (Messing) | `#c8a046` | Materialfarbe |
| Lunte | `#ff7a2a` | Materialfarbe |

## Signature-Element

**Uhrwerk-Bombe im Brustkorb** (Körpermerkmal (Bauch, Schädel, Ohren, Krater …)). Eine runde Eisenbombe mit Uhrwerk-Zifferblatt hängt im Brustkorb und tickt sichtbar.

## Details

- **Kleidung und Rüstung:** zerrissene Hose, Halstuch
- **Materialien:** Knochen, Eisen, Messing
- **Muster und Nähte:** Risse, Zahnräder
- **Schnallen, Nieten und Gravuren:** Gurte um die Bombe
- **Abnutzung:** Moos an den Knochen
- **Accessoires:** Halstuch und Armband (Teamzonen)

## Gesicht und Ausdruck

Großer Schädel mit dröhnend offenem Kiefer, glühenden Augenhöhlen und einem schiefen Zahn. Persönlichkeit: dröhnend lachend.

## Waffe / Werkzeug

Riesige Knochenfäuste.

## Animationen

**Idle**

- Kiefer klappert, die Bombe tickt

**Laufen**

- schwerer Gang mit `char.step`, Knochen klappern

**Angriff**

- Faust weit nach hinten (Anticipation), Rundumschlag

**Treffer**

- Rippen klappern, das Zifferblatt springt

**Erscheinen**

- landet, die Bombe tickt los

**Tod**

- zerfällt, die Bombe rollt heraus (Todesschaden)
