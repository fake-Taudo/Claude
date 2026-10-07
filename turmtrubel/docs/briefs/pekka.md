# P.E.K.K.A. (`pekka`)

> Truppe · Tank, Nahkampf · 7 Elixier · Herkunft: Werkstatt · Familie: Mechanisch · Größe XL (2,85 Felder)

## Konzept

P.E.K.K.A. ist ein schwer gepanzerter, stummer Kampfautomat aus dunkler Bronze. Statt eines Kopfes hat er eine Glaslaterne, in der eine türkisfarbene Flamme brennt. Er schwingt ein Fallbeil-Schwert, das länger ist als sein Rumpf, und ist unaufhaltsam.

## Eigenständigkeit

Der Laternenkopf mit Flamme ist eine Kopfform, die keine andere Figur hat, und das Fallbeil-Schwert ist trapezförmig wie eine Guillotine. Mini-P.E.K.K.A. ist ein kleiner Kessel mit Dampfpfeife. Kampfroboter anderer Spiele haben Hörnerhelme und leuchtende Augen; dieser hat eine Laterne mit Flamme.

## Silhouette, Proportionen, Größe

- **Familie:** Mechanisch (kantige Maschinenteile: Kessel, Kolben, Rohre, Räder)
- **Silhouette:** Hoch und massiv mit spitzen Schulterplatten; oben die sechseckige Laterne, rechts das breite Fallbeil fast bis zum Boden.
- **Proportionsformel:** Kopf 0,20 · Beine 0,30 · Arme 1,00 · Hände 0,55 · Waffe/Signature 0,90 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Fallbeil-Schwert länger als der Rumpf
- **Größenklasse:** XL, 2,85 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#4a3d36` | Dunkelbronze (Panzer) |
| Akzent | `#58e0c0` | Türkisflamme |
| Schatten | `#3c353e` · Tiefe `#312f45` | Hauptfarbe unten rechts, Falten (Akzent: `#45a49c`) |
| Licht · Glanz | `#887b6c` · `#d0cdcb` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#2e2732` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Brustwappen, Schulterwimpel; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Laternenglas | `#bfe8e0` | Materialfarbe |
| Stahl (Klinge) | `#a8b0ba` | Materialfarbe |
| Gelenke | `#2e2622` | Materialfarbe |

## Signature-Element

**Laternenkopf mit Flamme** (Helm, Hut, Krone, Kapuze). Eine sechseckige Laterne mit Messingdach und Gitter, in der eine türkise Flamme flackert; ihre Form zeigt den Ausdruck.

## Details

- **Kleidung und Rüstung:** Plattenpanzer mit Nietreihen, gestaffelte Schulterplatten, Kniekacheln, Stulpenhandschuhe
- **Materialien:** Bronze, Stahl, Glas, Leder an den Gelenken
- **Muster und Nähte:** Nietreihen, Plattenränder mit Gravur
- **Schnallen, Nieten und Gravuren:** Lederriemen an den Gelenken, Messingklammern
- **Abnutzung:** Grünspan an den Kanten, Kerben im Fallbeil
- **Accessoires:** Brustwappen und Schulterwimpel (Teamzonen)

## Gesicht und Ausdruck

Die Flamme ist das Gesicht: ruhig züngelnd im Idle, hoch auflodernd und spitz im Angriff, flackernd und klein, wenn getroffen. Persönlichkeit: stumm und unaufhaltsam, die Flamme flackert vor Zorn.

## Waffe / Werkzeug

Fallbeil-Schwert: trapezförmige, schräg geschliffene Klinge an einem langen Griff mit Ring.

## Animationen

**Idle**

- Flamme flackert, Kolben zischen leise
- Klinge ruht auf der Schulter

**Laufen**

- schwerer, ruckhafter Schritt mit `char.step`

**Angriff**

- Klinge weit über den Kopf (Anticipation, Stretch), Fallbeil-Hieb mit Funken (Squash)
- Flamme lodert auf

**Treffer**

- Flamme duckt sich, Glas klirrt

**Erscheinen**

- landet, Flamme entzündet sich

**Tod**

- Flamme erlischt, Panzer fällt in Teile auseinander

## Besonderheiten

- **Evolution:** Seelenfresser-Evo: Die Laterne bekommt eine zweite, innere Flamme, Brustpanzer und Klinge leuchtende türkise Fugen, dazu kommen Ketten über den Schultern. Glühende Funken bilden die Partikelhülle; bei jedem Sieg steigt eine Flamme in die Laterne.
