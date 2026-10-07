# Ritter (Held) (`knight-hero`)

> Held · Nahkampf · 3 Elixier · Herkunft: Krone · Familie: Breit · Größe M (1,95 Felder)
> Held von [`knight`](knight.md)

## Konzept

Der Ritter als Held ist derselbe sture Schildträger, jetzt in roségoldener Rüstung mit einem Löwenmähnen-Kragen und langem Heldenumhang. Mit seinem triumphalen Spott zwingt er alle Gegner in der Nähe, ihn anzugreifen. Dabei schützt ihn ein Schild aus Licht.

## Eigenständigkeit

Der Löwenmähnen-Kragen mit Umhang ist das Rang-Merkmal, das kein anderer Ritter trägt; Gesicht, Pflaster und Zinnenschild verraten den Basis-Ritter. Durch Roségold statt Zinn und die goldene Krone auf dem Schild ist er klar vom normalen Ritter zu unterscheiden. Heldenritter anderer Spiele tragen nur Gold; dieser hat Roségold und eine Löwenmähne.

## Silhouette, Proportionen, Größe

- **Familie:** Breit (Quadrat bis Trapez, breite Schultern, breiter Stand)
- **Silhouette:** Wie der Ritter (breites Trapez mit Zinnenschild), zusätzlich ein wallender Umhang hinten und ein zottiger Mähnenkragen, der die Schultern noch breiter macht.
- **Proportionsformel:** Kopf 0,35 · Beine 0,22 · Arme 0,85 · Hände 0,50 · Waffe/Signature 0,75 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Zinnenschild mit goldener Krone
- **Größenklasse:** M, 1,95 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#c8a090` | Roségold (Rüstung) |
| Akzent | `#e0a83a` | Heldengold (Mähne, Schildkrone) |
| Schatten | `#91787c` · Tiefe `#685b6c` | Hauptfarbe unten rechts, Falten (Akzent: `#a27e41`) |
| Licht · Glanz | `#dbbca8` · `#f1e6e2` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#614e56` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Umhang, Schildfeld; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Mähne | `#d8902a` | Materialfarbe |
| Wams | `#f0e6d0` | Materialfarbe |

## Signature-Element

**Löwenmähnen-Kragen mit Heldenumhang** (Umhang, Mantel, Kragen). Ein Kragen aus Löwenmähne aus Goldfäden, an dem ein langer Heldenumhang (Teamzone) hängt.

## Details

- **Kleidung und Rüstung:** Nasalhelm mit Goldkamm, roségoldene Platten, Löwenmähnen-Kragen, Heldenumhang
- **Materialien:** Roségold, Goldfäden, Samt, Stein
- **Muster und Nähte:** Löwenpranken-Gravur, Steinfugen am Schild
- **Schnallen, Nieten und Gravuren:** Löwenkopf-Schließe am Umhang
- **Abnutzung:** polierte Kratzer
- **Accessoires:** Umhang und Schildfeld (Teamzonen), goldene Krone auf dem Zinnenschild

## Gesicht und Ausdruck

Das Gesicht des Ritters mit Pflaster, jetzt mit herausforderndem Grinsen und hochgerecktem Kinn. Persönlichkeit: herausfordernd, ruft zum Kampf.

## Waffe / Werkzeug

Breitklinge mit Löwenknauf und der Zinnenschild mit Goldkrone.

## Animationen

**Idle**

- Spott-Pose: schlägt das Schwert auf den Schild und winkt Gegner heran
- Mähne weht

**Laufen**

- Marsch wie der Ritter, der Umhang schwingt groß

**Angriff**

- Schild vor, Hieb von oben (wie Basis, mit Umhangschwung)

**Treffer**

- grinst trotzig, der Schild leuchtet kurz

**Erscheinen**

- landet mit Umhang-Bausch und Mähnen-Schütteln

**Tod**

- sinkt auf den Schild gestützt nieder, der Umhang deckt ihn zu

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Triumphaler Spott: Schwert hoch, Schild gegen die Brust geschlagen, Brüll-Mund; Event `char.ability.knight-hero` erzeugt einen Spott-Ring und einen goldenen Schildschimmer. Rang-Merkmal: Löwenmähnen-Kragen mit Heldenumhang.
