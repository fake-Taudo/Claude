# Little Prince (`little-prince`)

> Champion · Fernkampf · 3 Elixier · Herkunft: Krone · Familie: Winzig · Größe S (1,55 Felder)

## Konzept

Der Little Prince ist ein verwöhnter Kinderprinz in einem petrolfarbenen Samtmantel, dem eine riesige Krone ständig über die Augen rutscht. Er kurbelt an einer Repetier-Armbrust, die immer schneller schießt, je länger er stehen bleibt. Wird es brenzlig, pfeift er seine Leibwächterin Guardienne herbei.

## Eigenständigkeit

Die übergroße, rutschende Krone ist breiter als der ganze Prinz; die Rekruten haben rutschende Helme, aber keine Krone. Die Kurbel-Armbrust mit Trommelmagazin trägt nur er. Kinderprinzen anderer Spiele fahren oft Streitwagen; dieser steht auf einem Schemelchen und kurbelt.

## Silhouette, Proportionen, Größe

- **Familie:** Winzig (kleiner Körper mit großem Kopf (Kopf mindestens 40 % der Höhe))
- **Silhouette:** Winzig mit riesigem Kopf und noch größerer Krone, darunter ein Samtmantel mit Hermelinkragen; die Armbrust mit Trommel steht vor ihm.
- **Proportionsformel:** Kopf 0,46 · Beine 0,22 · Arme 0,75 · Hände 0,42 · Waffe/Signature 0,55 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Krone so breit wie der ganze Prinz
- **Größenklasse:** S, 1,55 Felder hoch, Außenkontur „dünn“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#2f8f8a` | Petrol-Samt (Mantel) |
| Akzent | `#f7f2ea` | Creme (Hermelin, Strümpfe) |
| Schatten | `#296d77` · Tiefe `#25536a` | Hauptfarbe unten rechts, Falten (Akzent: `#b1b0b9`) |
| Licht · Glanz | `#76b1a4` · `#c9e2e1` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#244854` innen | Stufe 1 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Umhang, Kronenkissen; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Krone (Gold) | `#f0c040` | Materialfarbe |
| Haar | `#e6b84a` | Materialfarbe |

## Signature-Element

**viel zu große Krone, die über die Augen rutscht** (Helm, Hut, Krone, Kapuze). Die Krone mit fünf Zacken und Samtkissen ist so groß, dass sie auf seinen Ohren aufliegt und bei jeder Bewegung nach vorn kippt.

## Details

- **Kleidung und Rüstung:** Samtmantel mit Hermelinkragen, Pluderhose, weiße Strümpfe, Schnallenschuhe
- **Materialien:** Samt, Hermelin, Gold, Holz
- **Muster und Nähte:** Hermelinschwänzchen-Punkte
- **Schnallen, Nieten und Gravuren:** große Goldschnallen an den Schuhen
- **Abnutzung:** Krone verbeult vom Herunterfallen
- **Accessoires:** Umhang und Kronenkissen (Teamzonen), Trillerpfeife an einer Kordel

## Gesicht und Ausdruck

Kugelrundes Kindergesicht mit Schmollmund und vorgeschobener Unterlippe, große Augen unter dem Kronenrand. Im Angriff zieht er die Brauen ehrgeizig zusammen. Persönlichkeit: verwöhnt und ungeduldig, stampft.

## Waffe / Werkzeug

Repetier-Armbrust mit Trommelmagazin und Handkurbel; je schneller er kurbelt, desto schneller dreht die Trommel.

## Animationen

**Idle**

- schiebt die Krone hoch, verschränkt die Arme, stampft
- Krone rutscht wieder herunter

**Laufen**

- wichtiger Watschelgang mit erhobener Nase

**Angriff**

- kurbelt (Anticipation), Bolzen fliegt
- mit jedem Schuss kurbelt er hektischer

**Treffer**

- Krone fällt über die Augen

**Erscheinen**

- plumpst herunter, Krone springt hoch und landet schief

**Tod**

- setzt sich hin und weint, Krone rollt davon
- verblasst

## Besonderheiten

- **Fähigkeit (Champion):** Königliche Rettung: Er pfeift mit der Trillerpfeife und zeigt nach vorn (Pose). Event `char.ability.little-prince` erzeugt Pfiff-Ringe, Guardienne stürmt mit ihrer Tür heran.
- **Aura und Effekt-Hooks:** Petrolfarbene Bodenaura mit kleinen Kronen; die Kurbelgeschwindigkeit ist sichtbar am Drehtempo der Trommel.
