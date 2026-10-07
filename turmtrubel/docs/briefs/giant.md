# Riese (`giant`)

> Truppe · Gebäudejäger, Tank, Nahkampf · 5 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,75 Felder)

## Konzept

Der Riese ist ein gutmütiger, schnaufender Bauernriese mit einer gestrickten Bommelmütze, geflickter Latzhose und riesigen Arbeitshandschuhen. Er stapft langsam auf Gebäude zu und haut mit beiden Fäusten darauf. Er ist zäh wie ein alter Baumstumpf.

## Eigenständigkeit

Die Bommelmütze mit riesigem Bommel in Teamfarbe ist auf dem Spielfeld von weitem lesbar; kein anderer Riese trägt eine Strickmütze (Königsriese: Bärenfellmütze, Runenriese: kahler Kopf, Elektroriese: Schweißervisier). Riesen anderer Spiele haben rote Haare und eine braune Weste; dieser trägt Mütze, Latzhose und Arbeitshandschuhe.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Berg aus breiten Schultern mit kleinem Kopf, darauf die hohe Mütze mit Bommel; die Hände sind riesige Handschuhe fast bis zum Boden.
- **Proportionsformel:** Kopf 0,20 · Beine 0,20 · Arme 1,10 · Hände 0,75 · Waffe/Signature 0,20 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** riesige Arbeitshandschuhe
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#9a6b3c` | Erdbraun (Latzhose) |
| Akzent | `#e8c35a` | Senfgelb (Handschuhe, Flicken) |
| Schatten | `#725442` · Tiefe `#544347` | Hauptfarbe unten rechts, Falten (Akzent: `#a79057`) |
| Licht · Glanz | `#bc9970` · `#e5d9cc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4e3935` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Bommel, Latzhosen-Flicken; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Haut | `#e9a97a` | Materialfarbe |
| Strickmütze | `#7a8a6a` | Materialfarbe |
| Hemd | `#efe4cc` | Materialfarbe |

## Signature-Element

**Bommelmütze mit Riesenbommel** (Helm, Hut, Krone, Kapuze). Gestrickte Bommelmütze mit Zopfmuster und einem Bommel so groß wie sein Kopf (Teamzone).

## Details

- **Kleidung und Rüstung:** Bommelmütze, kragenloses Hemd, Latzhose mit Flicken, Arbeitshandschuhe, Gummistiefel
- **Materialien:** Strickwolle, Denim, Leder, Gummi
- **Muster und Nähte:** Zopfmuster an der Mütze, Flicken mit Kreuzstich
- **Schnallen, Nieten und Gravuren:** große Latzknöpfe
- **Abnutzung:** Löcher an den Knien, abgewetzte Handschuhe
- **Accessoires:** Bommel und Latzhosen-Flicken (Teamzonen), Grashalm im Mundwinkel

## Gesicht und Ausdruck

Kleiner Kopf mit Knollennase, gutmütigen Knopfaugen, Bartstoppeln und Grashalm im Mund. Im Angriff zieht er die Brauen zusammen und bläst die Backen auf. Persönlichkeit: gutmütig und schnaufend.

## Waffe / Werkzeug

Seine Fäuste in Arbeitshandschuhen mit verstärkten Knöcheln.

## Animationen

**Idle**

- kratzt sich unter der Mütze
- Bommel wippt nach

**Laufen**

- schwerer, langsamer Stampfgang mit `char.step`, Bommel schwingt

**Angriff**

- Fäuste über dem Kopf gefaltet (Anticipation, Stretch), Hammerschlag nach unten (Squash)

**Treffer**

- brummt, kneift ein Auge zu

**Erscheinen**

- landet schwer mit `char.land`, Mütze hüpft

**Tod**

- setzt sich, kippt dann nach hinten
- der Bommel rollt davon
