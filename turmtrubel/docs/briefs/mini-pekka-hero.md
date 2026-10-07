# Mini-P.E.K.K.A. (Held) (`mini-pekka-hero`)

> Held · Nahkampf · 4 Elixier · Herkunft: Werkstatt · Familie: Mechanisch · Größe M (1,80 Felder)
> Held von [`mini-pekka`](mini-pekka.md)

## Konzept

Mini-P.E.K.K.A. als Held ist ein patinagrüner Kessel-Automat mit einem Pfannkuchen-Turm samt Sirupflasche auf dem Rücken. Er füllt durch Treffer drei Pfannkuchen-Leisten. Mit seiner Fähigkeit verschlingt er die Pfannkuchen und wird stärker.

## Eigenständigkeit

Der Pfannkuchen-Turm mit Sirupflasche und Füllleisten ist ein einmaliges Rang-Merkmal; Zyklopenauge, Dampfpfeife und Rohrzange zeigen den Basis-Mini. Patina statt Zinn trennt ihn farblich. Helden-Roboter anderer Spiele bekommen Rüstung; dieser bekommt Frühstück.

## Silhouette, Proportionen, Größe

- **Familie:** Mechanisch (kantige Maschinenteile: Kessel, Kolben, Rohre, Räder)
- **Silhouette:** Wie der Mini (Kessel mit Pfeife), dazu ein hoher Pfannkuchen-Stapel auf dem Rücken.
- **Proportionsformel:** Kopf 0,48 · Beine 0,22 · Arme 0,80 · Hände 0,50 · Waffe/Signature 0,70 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** Pfannkuchen-Stapel mit drei Füllleisten
- **Größenklasse:** M, 1,80 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#6fa08a` | Patinagrün (Kessel) |
| Akzent | `#f0b23a` | Sirupgold |
| Schatten | `#557877` · Tiefe `#415b6a` | Hauptfarbe unten rechts, Falten (Akzent: `#ac8541`) |
| Licht · Glanz | `#a0bca4` · `#dae6e1` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#3d4e54` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Brustplakette, Serviette; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Pfannkuchen | `#e8b060` | Materialfarbe |
| Serviette | `#f4f0e6` | Materialfarbe |

## Signature-Element

**Pfannkuchen-Turm auf dem Rücken mit Sirupflasche** (Rucksack, Köcher, Behälter auf dem Rücken). Ein Turm aus drei Pfannkuchen auf einem Teller, mit Sirupflasche, auf dem Rücken.

## Details

- **Kleidung und Rüstung:** Kessel, Serviette um den Hals, Tellerhalter
- **Materialien:** Kupfer mit Patina, Teig, Glas
- **Muster und Nähte:** Füllleisten am Teller
- **Schnallen, Nieten und Gravuren:** Tellerklammern
- **Abnutzung:** Sirupkleckse
- **Accessoires:** Brustplakette und Serviette (Teamzonen)

## Gesicht und Ausdruck

Zyklopenauge mit verfressen-begeistertem Blick; die Klappe zuckt beim Schnuppern. Persönlichkeit: verfressen und begeistert.

## Waffe / Werkzeug

Riesen-Rohrzange mit Gabel-Gravur am Griff; im Pfannkuchen-Modus dient sie als Pfannenwender.

## Animationen

**Idle**

- Pfannkuchen-Pose: schnuppert am Stapel, die Pfeife trällert

**Laufen**

- Tippelgang, der Stapel wackelt

**Angriff**

- Rohrzangen-Schlag mit Pfiff

**Treffer**

- Stapel wackelt gefährlich

**Erscheinen**

- landet, ein Pfannkuchen hüpft hoch

**Tod**

- kippt um, Pfannkuchen rollen davon

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Pfannkuchen-Power: Er reißt den Deckel auf und schaufelt den Stapel hinein (Pose); Event `char.ability.mini-pekka-hero` erzeugt Dampf und Stern-Funken. Rang-Merkmal: Pfannkuchen-Turm mit Sirup.
