# Grabstein (Held) (`tombstone-hero`)

> Gebäude-Spawner · Gebäude, Spawner · 3 Elixier · Herkunft: Gruft · Familie: Bauwerk · Größe XL (2,50 Felder)
> Held von [`tombstone`](tombstone.md)

## Konzept

Der Grabstein als Held ist ein kleines Mausoleum mit Säulen und einer Krone über dem Portal. Alle paar Sekunden schlurfen Skelette heraus. Mit seiner Fähigkeit öffnet sich das Tor für die Grabkönigin.

## Eigenständigkeit

Ein Mausoleum mit Säulen und Krone ist das Rang-Merkmal; der normale Grabstein ist ein schiefer Stein mit Hand. Grabbauten anderer Spiele sind Krypten; dieses trägt eine Krone.

## Silhouette, Proportionen, Größe

- **Familie:** Bauwerk (Haus, Turm oder Grabmal mit Öffnung)
- **Silhouette:** Kleiner Tempel mit Dreiecksgiebel, zwei Säulen, Tor und Krone.
- **Übertriebenes Merkmal:** Krone über dem Portal
- **Größenklasse:** XL, 2,50 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#6f7b8a` | Schiefergrau |
| Akzent | `#d9b54a` | Kronengold |
| Schatten | `#555f77` · Tiefe `#414a6a` | Hauptfarbe unten rechts, Falten (Akzent: `#9d874c`) |
| Licht · Glanz | `#a0a4a4` · `#dadde1` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#3d4054` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Torbanner, Kranzschleife; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Moos | `#6a8a3a` | Materialfarbe |
| Tor | `#3a3540` | Materialfarbe |

## Signature-Element

**Mausoleum mit Säulen und Krone über dem Tor** (Bauwerk-Merkmal). Ein Mausoleum mit zwei Säulen und einer Krone über dem Portal.

## Details

- **Kleidung und Rüstung:** Säulen, Giebel, Tor
- **Materialien:** Stein, Gold, Eisen
- **Muster und Nähte:** Inschrift, Säulenkannelur
- **Schnallen, Nieten und Gravuren:** Torbeschläge
- **Abnutzung:** Moos und Risse
- **Accessoires:** Torbanner und Kranzschleife (Teamzonen)

## Gesicht und Ausdruck

Kein Gesicht; im Tor leuchten zwei Augen. Persönlichkeit: feierlich und unheimlich.

## Waffe / Werkzeug

Keine eigene Waffe; das zweiflügelige Eisentor öffnet sich, und Nebel und Skelette quellen heraus.

## Animationen

**Idle**

- Tor knarrt, Licht flackert

**Laufen**

- keine Fortbewegung

**Angriff**

- `char.spawnUnit`: Skelette schlurfen heraus

**Treffer**

- Steinsplitter

**Erscheinen**

- steigt aus dem Boden

**Tod**

- stürzt ein

## Besonderheiten

- **Helden-Pose und Rang-Merkmal:** Königliche Wiederkehr: das Tor öffnet sich weit, Nebel quillt heraus (Pose); Event `char.ability.tombstone-hero`. Rang-Merkmal: Krone über dem Portal.
