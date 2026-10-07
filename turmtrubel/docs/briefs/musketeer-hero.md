# Musketierin (Held) (`musketeer-hero`)

> Held · Fernkampf · 4 Elixier · Herkunft: Krone · Familie: Schlank · Größe L (2,05 Felder)
> Held von [`musketeer`](musketeer.md)

## Konzept

Die Musketierin als Heldin ist eine tüchtige Ingenieurin in waldgrünem Reitrock mit einem Werkzeuggürtel samt Kurbel und Bauplan-Rolle. Mit ihrer Fähigkeit wirft sie einen Bausatz nach vorn, der zu einem Geschützturm aufklappt.

## Eigenständigkeit

Der Werkzeuggürtel mit Bauplan-Rolle und Kurbel ist ihr Rang-Merkmal; Gabel, Muskete und Kavaliershut zeigen die Basis-Musketierin. Waldgrün statt Ocker-Oliv trennt sie farblich. Helden-Schützinnen anderer Spiele tragen Orden; diese trägt Werkzeug.

## Silhouette, Proportionen, Größe

- **Familie:** Schlank (schmales Hochrechteck, lange Diagonale durch Waffe oder Werkzeug)
- **Silhouette:** Wie die Musketierin, dazu ein breiter Gürtel mit Werkzeugen und eine Rolle quer über den Rücken.
- **Proportionsformel:** Kopf 0,31 · Beine 0,36 · Arme 0,90 · Hände 0,40 · Waffe/Signature 1,00 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Federhut mit Orden
- **Größenklasse:** L, 2,05 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#3f8a63` | Waldgrün (Reitrock) |
| Akzent | `#f2d58a` | Messinggold (Werkzeug, Orden) |
| Schatten | `#34695d` · Tiefe `#2c5158` | Hauptfarbe unten rechts, Falten (Akzent: `#ae9c77`) |
| Licht · Glanz | `#80ae8a` · `#cde1d6` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#2a4644` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Hutfeder, Schärpe; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Bauplan | `#f0e6d0` | Materialfarbe |
| Musketenholz | `#7a4a2a` | Materialfarbe |

## Signature-Element

**Werkzeuggürtel mit Kurbel und Bauplan-Rolle** (Werkzeug oder Gerät). Ein Werkzeuggürtel mit Kurbel, Schraubenschlüssel und einer Bauplan-Rolle.

## Details

- **Kleidung und Rüstung:** Federhut mit Orden, Reitrock, Werkzeuggürtel, Stiefel
- **Materialien:** Wolle, Messing, Pergament, Leder
- **Muster und Nähte:** Bauplan-Linien, Spitze
- **Schnallen, Nieten und Gravuren:** Gürtelschnalle in Zahnradform
- **Abnutzung:** Ölflecken
- **Accessoires:** Hutfeder und Schärpe (Teamzonen)

## Gesicht und Ausdruck

Das Gesicht der Musketierin, konzentriert, mit Bleistift hinter dem Ohr. Persönlichkeit: tüchtig, plant voraus.

## Waffe / Werkzeug

Muskete mit Gabel; der Turm-Bausatz für die Fähigkeit.

## Animationen

**Idle**

- Bauplan-Pose: entrollt den Plan und zeigt nach vorn

**Laufen**

- ruhiger Schritt, Werkzeuge klappern

**Angriff**

- Gabel aufstellen, Schuss

**Treffer**

- hält den Hut fest

**Erscheinen**

- landet, rollt den Plan aus

**Tod**

- sinkt nieder, der Plan flattert davon

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Treuer Geschützturm: Sie wirft den Bausatz in hohem Bogen (Pose mit Wurfarm); Event `char.ability.musketeer-hero` am Aufschlag. Rang-Merkmal: Werkzeuggürtel mit Bauplan.
