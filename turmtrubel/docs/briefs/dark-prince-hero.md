# Dunkler Prinz (Held) (`dark-prince-hero`)

> Held · Nahkampf, Flächenschaden · 4 Elixier · Herkunft: Krone · Familie: Reiter · Größe XL (2,50 Felder)
> Held von [`dark-prince`](dark-prince.md)

## Konzept

Der Dunkle Prinz als Held reitet ein gepanzertes Nashorn und trägt eine Sichelmond-Krone über dem Visier. Mit seiner Fähigkeit springt er ab. Das Nashorn stürmt allein zu Gebäuden, der Prinz kämpft zu Fuß weiter.

## Eigenständigkeit

Die Sichelmond-Krone ist sein Rang-Merkmal; Morgenstern und Sichelschild zeigen den Basis-Prinzen. Das Nashorn statt des Warans macht die Silhouette breiter.

## Silhouette, Proportionen, Größe

- **Familie:** Reiter (Tierkörper plus aufrechte Figur darüber)
- **Silhouette:** Breites Nashorn mit Reiter, oben eine Sichelkrone.
- **Proportionsformel:** Kopf 0,22 · Beine 0,00 · Arme 0,85 · Hände 0,45 · Waffe/Signature 0,60 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** reitet ein gepanzertes Nashorn
- **Größenklasse:** XL, 2,50 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#2f3d33` | Nachtgrün (Rüstung) |
| Akzent | `#c6f07a` | Limette |
| Schatten | `#29353c` · Tiefe `#252f43` | Hauptfarbe unten rechts, Falten (Akzent: `#90af6d`) |
| Licht · Glanz | `#767b6a` · `#c9cdca` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#242731` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schabracke, Schildmitte; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Nashorn | `#8a8f80` | Materialfarbe |

## Signature-Element

**Sichelmond-Krone über dem Visier** (Helm, Hut, Krone, Kapuze). Eine Krone in Sichelmond-Form über dem Visier.

## Details

- **Kleidung und Rüstung:** Visierhelm mit Sichelkrone, Plattenrüstung
- **Materialien:** brünierter Stahl, Silber
- **Muster und Nähte:** Sichelgravuren
- **Schnallen, Nieten und Gravuren:** Sattelgurte
- **Abnutzung:** Kratzer
- **Accessoires:** Schabracke und Schildmitte (Teamzonen)

## Gesicht und Ausdruck

Limettengrüne Augenschlitze, eiskalt. Persönlichkeit: eiskalt und siegesgewiss.

## Waffe / Werkzeug

Morgenstern und Sichelschild.

## Animationen

**Idle**

- Absprung-Pose: steht in den Steigbügeln

**Laufen**

- Nashorn trabt mit `char.step`

**Angriff**

- Morgenstern-Rundumschlag

**Treffer**

- Nashorn schnaubt

**Erscheinen**

- landet schwer

**Tod**

- fällt vom Nashorn

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Zerstörerischer Absprung: Sprung aus dem Sattel mit Landung (Pose); Event `char.ability.dark-prince-hero` mit Landeschaden-Ring. Rang-Merkmal: Sichelmond-Krone.
- **Zu Fuß (nach dem Absprung):** Teile des Nashorns entfallen, der Prinz läuft mit dem Morgenstern.
