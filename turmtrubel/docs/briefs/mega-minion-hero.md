# Megalakai (Held) (`mega-minion-hero`)

> Held · Flieger, Nahkampf · 3 Elixier · Herkunft: Tiere und Drachen · Familie: Geflügelt · Größe M (1,95 Felder)
> Held von [`mega-minion`](mega-minion.md)

## Konzept

Der Megalakai als Held trägt einen Visierhelm mit Heldenstern und eine Goldgravur auf dem Steinbauch. Er fixiert sein Ziel. Mit seiner Fähigkeit teleportiert er sich zum schwächsten Gegner.

## Eigenständigkeit

Visierhelm mit Heldenstern ist sein Rang-Merkmal; Steinbauch und Wasserspeier-Hörner zeigen den Basis-Megalakai. Helleres Grau-Lila und Gold trennen ihn farblich.

## Silhouette, Proportionen, Größe

- **Familie:** Geflügelt (Flügel als breiteste Form, Körper in der Mitte)
- **Silhouette:** Wie der Megalakai, dazu ein Helm mit Visier und Stern.
- **Proportionsformel:** Kopf 0,31 · Beine 0,18 · Arme 0,85 · Hände 0,60 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Steinbauch mit Goldgravur
- **Größenklasse:** M, 1,95 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#9a93b3` | Lavendelgrau |
| Akzent | `#ffd36b` | Heldengold |
| Schatten | `#726f93` · Tiefe `#54557c` | Hauptfarbe unten rechts, Falten (Akzent: `#b79b62`) |
| Licht · Glanz | `#bcb4bf` · `#e5e3eb` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#4e4964` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Armbinde, Helmbusch; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Stein | `#b0a8c0` | Materialfarbe |

## Signature-Element

**Visierhelm mit Heldenstern** (Helm, Hut, Krone, Kapuze). Ein Visierhelm mit goldenem Heldenstern.

## Details

- **Kleidung und Rüstung:** Visierhelm, Steinbauch mit Gravur
- **Materialien:** Stein, Gold, Stahl
- **Muster und Nähte:** Goldgravur
- **Schnallen, Nieten und Gravuren:** Helmriemen
- **Abnutzung:** Kratzer
- **Accessoires:** Armbinde und Helmbusch (Teamzonen)

## Gesicht und Ausdruck

Hinter dem Visier zwei fixierende Augen. Persönlichkeit: jagend, fixiert sein Ziel.

## Waffe / Werkzeug

Sturzfaust aus Stein mit Goldbändern und Heldenstern; beim Teleport glüht sie weiß.

## Animationen

**Idle**

- Sprung-Pose: duckt sich in der Luft zum Teleport

**Laufen**

- schwerer Flug

**Angriff**

- Sturzfaust

**Treffer**

- Visier klappert

**Erscheinen**

- erscheint in einem Lichtblitz

**Tod**

- stürzt

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Verwundender Sprung: zusammengeduckt, dann Teleport; Event `char.ability.mega-minion-hero` mit Lichtriss. Rang-Merkmal: Visierhelm mit Heldenstern.
