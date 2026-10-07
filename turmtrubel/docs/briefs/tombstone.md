# Grabstein (`tombstone`)

> Gebäude-Spawner · Gebäude, Spawner · 3 Elixier · Herkunft: Gruft · Familie: Bauwerk · Größe M (1,90 Felder)

## Konzept

Der Grabstein ist ein schiefer, bemooster Grabstein, aus dessen Erde eine Skeletthand winkt. Davor flackert ein Grablicht. Alle vier Sekunden klettern zwei Skelette heraus.

## Eigenständigkeit

Die winkende Skeletthand vor dem Stein ist ein witziges, einmaliges Detail. Der Grabstein-Held ist ein Mausoleum. Grabsteine anderer Spiele sind einfache Steine; dieser winkt.

## Silhouette, Proportionen, Größe

- **Familie:** Bauwerk (Haus, Turm oder Grabmal mit Öffnung)
- **Silhouette:** Abgerundeter Grabstein, schief, davor eine Hand und eine Laterne.
- **Übertriebenes Merkmal:** schiefer Grabstein mit Moos
- **Größenklasse:** M, 1,90 Felder hoch, Außenkontur „mittel“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#8d8a9a` | Grabsteingrau |
| Akzent | `#7dff8a` | Geistergrün (Grablicht) |
| Schatten | `#696982` · Tiefe `#4e5171` | Hauptfarbe unten rechts, Falten (Akzent: `#5eb977`) |
| Licht · Glanz | `#b4aeae` · `#e1e1e5` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#49465a` innen | Stufe 2 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Grablicht-Schirm, Kranzschleife; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Moos | `#6a8a3a` | Materialfarbe |
| Erde | `#6b4a32` | Materialfarbe |

## Signature-Element

**Grabstein mit winkender Skeletthand** (Bauwerk-Merkmal). Eine Skeletthand ragt aus der Erde und winkt.

## Details

- **Kleidung und Rüstung:** Stein, Erdhügel
- **Materialien:** Stein, Moos, Erde, Knochen
- **Muster und Nähte:** Inschrift, Risse
- **Schnallen, Nieten und Gravuren:** keine
- **Abnutzung:** Moos und Risse
- **Accessoires:** Grablicht-Schirm und Kranzschleife (Teamzonen)

## Gesicht und Ausdruck

Kein Gesicht; die Inschrift ist ein Grinsen aus Rissen. Persönlichkeit: unheimlich-witzig.

## Waffe / Werkzeug

Keine eigene Waffe; die Skeletthand und das Grablicht sind die einzigen beweglichen Teile, die Skelette kommen aus der Erde.

## Animationen

**Idle**

- die Hand winkt, das Grablicht flackert

**Laufen**

- keine Fortbewegung

**Angriff**

- `char.spawnUnit`: Erde bricht auf, Skelette klettern heraus

**Treffer**

- Steinsplitter

**Erscheinen**

- Stein fällt herab und bohrt sich in die Erde

**Tod**

- Stein zerbricht, vier Skelette springen heraus
