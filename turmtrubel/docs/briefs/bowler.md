# Bowler (`bowler`)

> Truppe · Fernkampf · 5 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,60 Felder)

## Konzept

Der Bowler ist ein gemütlicher Steintroll mit moosbewachsenem Rücken, Hosenträgern und einem winzigen Melonenhut auf dem riesigen Kopf. Er rollt Runenkugeln wie beim Kegeln durch die Reihen der Gegner. Vor jedem Wurf poliert er die Kugel am Bauch.

## Eigenständigkeit

Der winzige Bowler-Hut auf dem riesigen Moos-Kopf ist ein absurdes, sofort lesbares Detail; kein anderer Riese trägt einen Hut dieser Form. Die Kegelbewegung mit hohem Bein ist sein eigener Angriff. Bowler anderer Spiele sind blaue Riesen mit Felsen; dieser ist ein grüner Steintroll mit Kegelkugel.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig mit gebeugtem, moosigem Buckel; oben ein winziger runder Hut, in der Hand eine Kugel mit drei Löchern.
- **Proportionsformel:** Kopf 0,26 · Beine 0,24 · Arme 1,05 · Hände 0,65 · Waffe/Signature 0,35 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Moos-Rücken eines Steintrolls
- **Größenklasse:** XL, 2,60 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#7f9a6a` | Moosgrün (Haut, Moos) |
| Akzent | `#2e2a33` | Anthrazit (Hut, Hose) |
| Schatten | `#607462` · Tiefe `#48585b` | Hauptfarbe unten rechts, Falten (Akzent: `#29283c`) |
| Licht · Glanz | `#abb88f` · `#dee5d8` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#444c47` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Hosenträger, Hutband; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Runenkugel | `#6a7a8a` | Materialfarbe |
| Hemd | `#e8dfc8` | Materialfarbe |
| Stein-Haut | `#9aa48a` | Materialfarbe |

## Signature-Element

**winziger Melonenhut auf riesigem Kopf** (Helm, Hut, Krone, Kapuze). Ein winziger schwarzer Melonenhut mit Hutband (Teamzone), schief auf dem riesigen Kopf.

## Details

- **Kleidung und Rüstung:** Melonenhut, kurzärmeliges Hemd, Hosenträger, Kniebundhose
- **Materialien:** Stein, Moos, Wolle, Filz
- **Muster und Nähte:** Mooskissen, Steinrisse, Nadelstreifen auf der Hose
- **Schnallen, Nieten und Gravuren:** Hosenträgerklemmen
- **Abnutzung:** Moos wächst aus Rissen
- **Accessoires:** Hosenträger und Hutband (Teamzonen), Polierlappen in der Tasche

## Gesicht und Ausdruck

Breites Gesicht mit Unterbiss, zwei Hauern, kleinen Augen und konzentriert gespitzten Lippen beim Zielen. Getroffen hebt er überrascht die Brauen. Persönlichkeit: gemütlich, konzentriert wie beim Kegeln.

## Waffe / Werkzeug

Runenkugel aus Stein mit drei Grifflöchern und leuchtender Rune.

## Animationen

**Idle**

- poliert die Kugel am Bauch
- rückt den Hut zurecht

**Laufen**

- schlurfender Gang mit `char.step`

**Angriff**

- Anticipation: weit ausholen, tief in die Knie
- Kugel rollen lassen, Follow-through mit hochgehobenem Bein

**Treffer**

- Hut hüpft hoch

**Erscheinen**

- landet, die Kugel rollt kurz nach

**Tod**

- setzt sich schwer hin, der Hut fällt herunter
- zerbröselt in Moos und Steine
