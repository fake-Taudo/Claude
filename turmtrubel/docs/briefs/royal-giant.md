# Königsriese (`royal-giant`)

> Truppe · Gebäudejäger, Tank, Fernkampf · 6 Elixier · Herkunft: Riesen · Familie: Massig · Größe XL (2,70 Felder)

## Konzept

Der Königsriese ist ein strenger Leibgardist von riesiger Gestalt mit hoher Bärenfellmütze und einer Schulterkanone mit Löwenmaul-Mündung. Er beschießt Gebäude aus großer Entfernung. Bei jedem Schuss geht er vor Rückstoß in die Knie.

## Eigenständigkeit

Die hohe schwarze Bärenfellmütze macht ihn zur höchsten Kopfform unter den Riesen; die Löwenmaul-Kanone gibt es nur bei ihm. Andere Kanonen im Spiel: Hechtkopf der Kanonenkarre, Kondensator-Schüssel von Funki. Königsriesen anderer Spiele tragen Blau; dieser trägt eine dunkle Olivuniform mit Gold.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig mit sehr hoher Mütze; die Kanone liegt waagerecht auf der Schulter und ragt weit nach vorn.
- **Proportionsformel:** Kopf 0,24 · Beine 0,22 · Arme 1,00 · Hände 0,65 · Waffe/Signature 0,50 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Schulterkanone mit Löwenmaul-Mündung
- **Größenklasse:** XL, 2,70 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#4d4b23` | Dunkeloliv (Uniformrock) |
| Akzent | `#d4b04a` | Gold (Knöpfe, Litzen, Löwenmaul) |
| Schatten | `#3e3f31` · Tiefe `#32353c` | Hauptfarbe unten rechts, Falten (Akzent: `#99834c`) |
| Licht · Glanz | `#8a8460` · `#d1d0c6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#302c2b` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Schärpe, Mützenkordel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Bärenfell | `#25222a` | Materialfarbe |
| Haut | `#e2a078` | Materialfarbe |
| Kanonenbronze | `#b8863a` | Materialfarbe |

## Signature-Element

**hohe Bärenfellmütze der Leibgarde** (Helm, Hut, Krone, Kapuze). Eine hohe Bärenfellmütze mit Kinnkette und einer Kordel in Teamfarbe.

## Details

- **Kleidung und Rüstung:** Uniformrock mit zwei Knopfreihen, Schulterklappen, weiße Hose, Stiefel
- **Materialien:** Wolle, Bärenfell, Gold, Bronze
- **Muster und Nähte:** Goldlitzen, Fellstriche
- **Schnallen, Nieten und Gravuren:** Messingknöpfe, Kanonenriemen mit Löwenschnalle
- **Abnutzung:** Pulverruß am Ärmel
- **Accessoires:** Schärpe und Mützenkordel (Teamzonen), Ladestock am Rücken

## Gesicht und Ausdruck

Breites Gesicht mit gewaltigem gezwirbeltem Schnurrbart, strengem Blick unter der Mützenkante und zusammengepressten Lippen. Beim Schuss pustet er die Backen auf. Persönlichkeit: streng und stolz, Schnurrbart zuckt.

## Waffe / Werkzeug

Schulterkanone aus Bronze mit Löwenmaul-Mündung, Lafettenriemen und Zündloch.

## Animationen

**Idle**

- salutiert kurz, putzt einen Knopf
- Schnurrbart zuckt

**Laufen**

- Paradeschritt mit `char.step`

**Angriff**

- Zielen, Lunte (Anticipation), Schuss mit Rückstoß bis in die Knie (Squash)
- Rauch aus dem Löwenmaul

**Treffer**

- Mütze wackelt, er blinzelt

**Erscheinen**

- landet in Habachtstellung

**Tod**

- fällt steif wie ein Brett um, die Mütze rollt

## Besonderheiten

- **Evolution:** Rückstoß-Evo: Ein zweites Rohr (Doppelkanone) und ein Kürass mit Löwenrelief kommen hinzu, die Mütze bekommt ein Gold-Emblem. Bei jedem Schuss breitet sich ein goldener Stoßring aus, Pulverfunken bilden die Partikelhülle.
