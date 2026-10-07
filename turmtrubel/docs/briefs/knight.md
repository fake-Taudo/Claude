# Ritter (`knight`)

> Truppe · Nahkampf · 3 Elixier · Herkunft: Krone · Familie: Breit · Größe M (1,85 Felder)

## Konzept

Der Ritter ist ein sturer, pflichtbewusster Schildträger aus der Burgwache, der jeden Angriff mit seinem Zinnenschild abfängt und dann kurz und trocken zurückschlägt. Er ist günstig, robust und immer zuerst da. Er wirkt wie ein kleiner, wandelnder Burgturm.

## Eigenständigkeit

Kein anderer Ritter im Spiel trägt einen Schild in Form eines Burgturms mit Zinnen und Schießscharte. Golden Knight trägt Sonnenkranz und Rapier, Megaritter einen Glockenhelm, Guardienne eine Tür. Gängige Fantasy-Ritter setzen auf Topfhelm, Kreuzschild und Schnurrbart; dieser hat einen Nasalhelm mit Wimpel, ein Pflaster quer über der Nase und den Turm-Schild, der fast seine ganze Front verdeckt.

## Silhouette, Proportionen, Größe

- **Familie:** Breit (Quadrat bis Trapez, breite Schultern, breiter Stand)
- **Silhouette:** Breites Trapez: Rechts ragt der hohe Zinnenschild über die Schulter hinaus, links steht die kurze Breitklinge schräg nach oben. Die Beine sind kurz und der Stand breit, oben sitzt der Nasalhelm mit kleinem Wimpel.
- **Proportionsformel:** Kopf 0,36 · Beine 0,22 · Arme 0,85 · Hände 0,50 · Waffe/Signature 0,75 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Zinnenschild fast so hoch wie er selbst
- **Größenklasse:** M, 1,85 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#8f99a8` | Zinn (Helm, Schulterplatten, Beinschienen) |
| Akzent | `#9a5b2a` | Sattelleder (Gürtel, Riemen, Stiefel) |
| Schatten | `#6b748c` · Tiefe `#4f5777` | Hauptfarbe unten rechts, Falten (Akzent: `#724936`) |
| Licht · Glanz | `#b5b8b8` · `#e2e4e8` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4a4c60` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schildfeld, Helmwimpel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Wams (Leinen) | `#d9cdb4` | Materialfarbe |
| Schildstein | `#b9b2a4` | Materialfarbe |

## Signature-Element

**Zinnenschild in Burgturm-Form** (Schild oder schildartiges Bauteil). Der Schild ist ein Mauerstück mit drei Zinnen, schwarzer Schießscharte und eingesetztem Teamfeld; in der Mitte sitzt das Teamsymbol.

## Details

- **Kleidung und Rüstung:** Nasalhelm mit Kinnriemen, gepolstertes Leinenwams unter einem Zinn-Brustpanzer mit zwei Plattenreihen, Schulterplatten, Beinschienen, kurze Stulpenstiefel
- **Materialien:** Zinn mit Hammerschlag-Glanz, Leinen, Sattelleder, gemauerter Stein am Schild
- **Muster und Nähte:** Steinfugen auf dem Schild, Steppnähte am Wams, Doppelnaht am Gürtel
- **Schnallen, Nieten und Gravuren:** große quadratische Gürtelschnalle, Nieten an den Schulterplatten, eingeritzter Turm auf dem Helm-Nasal
- **Abnutzung:** Kerben in den Zinnen, abgeschlagene Ecke am Schild, Kratzer am Brustpanzer
- **Accessoires:** Helmwimpel (Teamzone), Pflaster auf der Nase, kleiner Schlüsselbund am Gürtel

## Gesicht und Ausdruck

Kantiges Gesicht mit breitem Kinn, buschigen geraden Brauen, kleinen entschlossenen Augen und schmalem Mund; das Pflaster sitzt quer über der Nase. Im Angriff zieht er die Brauen zusammen und beißt die Zähne aufeinander, getroffen kneift er ein Auge zu. Persönlichkeit: stur und pflichtbewusst, Pflaster quer über der Nase.

## Waffe / Werkzeug

Kurze, breite Klinge mit dreieckiger Spitze und quaderförmigem Knauf, eher Schlachtermesser als Langschwert; die Parierstange ist ein schlichter Eisenbalken.

## Animationen

**Idle**

- Schild ruht auf dem Boden, er atmet tief
- alle paar Sekunden zwei Klopfer mit dem Knauf an den Schild
- späht über die Zinnen, der Wimpel schwingt nach

**Laufen**

- schwerer, gleichmäßiger Marsch
- Schild bleibt vorn, wippt mit jedem Schritt
- Wimpel und Gürtelenden schwingen nach

**Angriff**

- Anticipation: Schild hoch, Klinge nach hinten
- Schildstoß nach vorn, gleich danach kurzer Hieb von oben hinter dem Schild hervor
- Follow-through: Klinge federt nach, Schild zurück vor den Körper

**Treffer**

- Schild ruckt zurück, Körper staucht sich zusammen
- ein Auge zugekniffen

**Erscheinen**

- fällt mit dem Schild voran und landet mit Squash
- stellt den Schild mit einem dumpfen Ruck auf

**Tod**

- kippt nach hinten, der Schild fällt flach auf ihn
- Helm rollt zur Seite, dann löst er sich in Staub auf

## Besonderheiten

- **Evolution:** Steinwacht-Evo: Der Schild wird zu einem höheren Turm mit leuchtenden Fenstern, dazu kommen Steinplatten auf Schultern und Brust mit hellblauen Leuchtfugen. Die Fugen glühen stärker, solange er nicht angreift (60 % weniger Schaden), und ein Staubschleier dient als Partikelhülle.
