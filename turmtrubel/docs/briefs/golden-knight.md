# Goldener Ritter (`golden-knight`)

> Champion · Nahkampf · 4 Elixier · Herkunft: Krone · Familie: Schlank · Größe L (2,20 Felder)

## Konzept

Der Goldene Ritter ist ein eitler Sonnenritter in polierter Goldrüstung mit einem Strahlenkranz als Helmzier. Er ficht mit einem schlanken Rapier und springt mit seiner Fähigkeit wie ein Lichtstrahl von Gegner zu Gegner. Er posiert mehr, als er müsste, und strahlt dabei buchstäblich.

## Eigenständigkeit

Der Strahlenkranz hinter dem Kopf ist eine Sonnenscheibe aus spitzen Goldstrahlen; keine andere Figur hat ihn. Der Ritter trägt den Zinnenschild, Megaritter einen Glockenhelm. Goldene Ritter tragen sonst meist schwere Langschwerter; dieser ist schlank, ficht elegant mit dem Rapier und trägt einen cremefarbenen Umhang mit Sonnensaum.

## Silhouette, Proportionen, Größe

- **Familie:** Schlank (schmales Hochrechteck, lange Diagonale durch Waffe oder Werkzeug)
- **Silhouette:** Schlank und gerade mit leichtem Hohlkreuz; hinter dem Kopf ein Kreis aus Strahlen, das Rapier eine feine lange Linie, der Umhang fällt in Falten.
- **Proportionsformel:** Kopf 0,30 · Beine 0,38 · Arme 0,90 · Hände 0,40 · Waffe/Signature 0,75 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Strahlenkranz wie eine Sonne hinter dem Kopf
- **Größenklasse:** L, 2,20 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#f2c14e` | Polier-Gold (Rüstung) |
| Akzent | `#fff6e0` | Creme (Umhang, Rapierkorb) |
| Schatten | `#ae8f4f` · Tiefe `#7b694f` | Hauptfarbe unten rechts, Falten (Akzent: `#b7b3b2`) |
| Licht · Glanz | `#f6d27c` · `#fcefd1` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#725c3c` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Umhang, Brustemblem; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Haar | `#f3df90` | Materialfarbe |
| Stahl (Klinge) | `#dfe6ee` | Materialfarbe |

## Signature-Element

**Strahlenkranz-Helmzier** (Helm, Hut, Krone, Kapuze). Zwölf goldene Strahlen an einem Reif hinter dem Helm, abwechselnd lang und kurz; bei der Fähigkeit glühen sie hell.

## Details

- **Kleidung und Rüstung:** offener Helm mit Strahlenkranz, Goldbrustpanzer mit Sonnengravur, Schulterflügel, Kettenrock, Stiefel mit Goldkappen
- **Materialien:** poliertes Gold, Seide, Stahl
- **Muster und Nähte:** Sonnengravur, Strahlen-Ornament am Umhangsaum
- **Schnallen, Nieten und Gravuren:** Sonnenbrosche am Umhang, Goldnieten
- **Abnutzung:** keine (er poliert ständig)
- **Accessoires:** Umhang und Brustemblem (Teamzonen), Polierlappen am Gürtel

## Gesicht und Ausdruck

Markantes Kinn mit Grübchen, strahlend weißes Lächeln, wellige Strähne in der Stirn; die Augen halb geschlossen wie bei einem Selbstbewunderer. Im Angriff ist er hochkonzentriert. Persönlichkeit: eitel und strahlend, posiert.

## Waffe / Werkzeug

Schlankes Rapier mit kugeligem Korbgefäß in Sonnenform und langer feiner Klinge.

## Animationen

**Idle**

- poliert die Klinge mit dem Lappen
- pustet sich eine Strähne aus dem Gesicht
- Strahlen funkeln nacheinander

**Laufen**

- stolzer Schritt mit geradem Rücken, Umhang schwingt

**Angriff**

- Fechtstellung (Anticipation), schneller Ausfall mit Stich
- Rückzug in die Grundstellung, Klinge zittert nach

**Treffer**

- empörter Ruck, Strähne fällt ins Gesicht

**Erscheinen**

- landet in Pose, Strahlen blitzen auf

**Tod**

- fällt theatralisch auf ein Knie und dann um
- Strahlen erlöschen einzeln

## Besonderheiten

- **Fähigkeit (Champion):** Schnellsprung: Er duckt sich in Fechtstellung (Pose), die Strahlen glühen, dann wird er zu einem goldenen Lichtschemen, der von Ziel zu Ziel springt. Event `char.ability.golden-knight` liefert Lichtstrahlen-Nachbilder.
- **Aura und Effekt-Hooks:** Goldene Bodenaura mit rotierenden Strahlen; `char.windup` blitzt an der Rapierspitze.
