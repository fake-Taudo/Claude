# Koboldhütte (`goblin-hut`)

> Gebäude-Spawner · Gebäude, Spawner · 4 Elixier · Herkunft: Kobolde · Familie: Bauwerk · Größe XL (2,80 Felder)

## Konzept

Die Koboldhütte ist eine schiefe Flickwerk-Hütte aus Brettern und Tüchern mit einem krummen Kürbis-Schornstein. Aus dem Türvorhang springen Speerkobolde, sobald Gegner nahe sind.

## Eigenständigkeit

Der Kürbis als Schornstein und die Flickwerk-Wände sind einmalig; die Barbarenhütte ist ein Soden-Langhaus. Koboldhütten anderer Spiele sind Holzhütten mit Speeren; diese ist ein Flickwerk mit Kürbis.

## Silhouette, Proportionen, Größe

- **Familie:** Bauwerk (Haus, Turm oder Grabmal mit Öffnung)
- **Silhouette:** Schiefes Haus mit hängendem Dach, oben ein runder Kürbis mit Rauchloch, vorn ein Vorhang.
- **Übertriebenes Merkmal:** krummer Kürbisschornstein
- **Größenklasse:** XL, 2,80 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#a8865a` | Lehmbraun (Bretter) |
| Akzent | `#e07a2a` | Kürbisorange |
| Schatten | `#7c6757` · Tiefe `#5a4f54` | Hauptfarbe unten rechts, Falten (Akzent: `#a25e36`) |
| Licht · Glanz | `#c6ab84` · `#e8e0d4` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#544441` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Türvorhang, Dachfahne; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Tücher | `#c8b07a` | Materialfarbe |
| Stroh | `#d8c070` | Materialfarbe |

## Signature-Element

**schiefe Flickwerk-Hütte mit Kürbis-Schornstein** (Bauwerk-Merkmal). Ein ausgehöhlter Kürbis als Schornstein, aus dessen Gesicht Rauch quillt.

## Details

- **Kleidung und Rüstung:** Bretterwände, Stoffflicken, Strohdach
- **Materialien:** Holz, Stoff, Kürbis, Stroh
- **Muster und Nähte:** Flickennähte, Bretterfugen
- **Schnallen, Nieten und Gravuren:** Nägel, Schnüre
- **Abnutzung:** Löcher im Dach
- **Accessoires:** Türvorhang und Dachfahne (Teamzonen), Speere an der Wand

## Gesicht und Ausdruck

Kein Gesicht; der Kürbis hat ein geschnitztes Grinsen. Persönlichkeit: knarzend, Kobolde gucken heraus.

## Waffe / Werkzeug

Keine; Speerkobolde kommen heraus.

## Animationen

**Idle**

- Schornstein raucht, Vorhang wackelt

**Laufen**

- keine Fortbewegung

**Angriff**

- `char.spawnUnit`: Vorhang fliegt auf, ein Speerkobold springt heraus

**Treffer**

- Bretter klappern

**Erscheinen**

- Hütte fällt zusammengeklappt herunter und richtet sich auf

**Tod**

- Hütte bricht zusammen, der Kürbis rollt
