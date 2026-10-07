# Elektroriese (`electro-giant`)

> Truppe · Gebäudejäger, Tank, Nahkampf · 7 Elixier · Herkunft: Werkstatt · Familie: Massig · Größe XL (2,75 Felder)

## Konzept

Der Elektroriese ist ein grimmiger Elektriker im ziegelorangen Arbeitsoverall mit Schweißervisier. Auf seinen Schultern sitzen zwei Teslaspulen als Polster, und er trägt riesige Gummihandschuhe. Wer ihn aus der Nähe angreift, bekommt einen Gegenschlag mit Betäubung.

## Eigenständigkeit

Die Teslaspulen auf beiden Schultern mit springenden Funken bilden eine zackige Schulterlinie, die kein anderer Riese hat; das hochgeklappte Schweißervisier ist sein Gesicht. Der Riese trägt eine Bommelmütze, der Runenriese eine Tafel. Elektroriesen anderer Spiele tragen blaue Anzüge; dieser trägt einen ziegelorangen Overall mit Kabeltrommel.

## Silhouette, Proportionen, Größe

- **Familie:** Massig (Berg: riesiger Oberkörper, kleiner Kopf, große Fäuste)
- **Silhouette:** Massig mit zwei hohen Spulen über den Schultern, kleiner Kopf mit Visierplatte, riesige Handschuhe.
- **Proportionsformel:** Kopf 0,22 · Beine 0,22 · Arme 1,05 · Hände 0,70 · Waffe/Signature 0,30 (Anteile laut [CHAR_SYSTEM.md](../CHAR_SYSTEM.md#3-größenklassen-konturen-und-proportionen))
- **Übertriebenes Merkmal:** riesige Gummihandschuhe
- **Größenklasse:** XL, 2,75 Felder hoch, Außenkontur „dick“

## Farbpalette

| Rolle | Hex | Hinweis |
|---|---|---|
| Haupt | `#d07f3a` | Ziegelorange (Overall) |
| Akzent | `#5fe3ff` | Blitz-Cyan (Funken, Spulenkappen) |
| Schatten | `#976241` · Tiefe `#6c4c46` | Hauptfarbe unten rechts, Falten (Akzent: `#4aa6c7`) |
| Licht · Glanz | `#e0a66f` · `#f3decc` | Flächen oben links, Spitzlichter |
| Kontur | `#1c1830` außen · `#644134` innen | Stufe 3 |
| Teamzone | Blau `#3d8bff` / Rot `#ff4d57` | Gürtel, Helmstreifen; Bodenring Kreis/Zacken, Emblem Kreis/Dreieck |
| Gummihandschuhe | `#3a3a40` | Materialfarbe |
| Kupferspulen | `#c87a3a` | Materialfarbe |
| Visier | `#5a6070` | Materialfarbe |

## Signature-Element

**Teslaspulen als Schulterpolster** (Schulterstück). Zwei Kupfer-Teslaspulen mit Kugelkappen sitzen als Schulterpolster; zwischen ihnen springen Funken.

## Details

- **Kleidung und Rüstung:** Arbeitsoverall mit Brusttasche, Schweißervisier, Gummihandschuhe, Sicherheitsstiefel
- **Materialien:** Drillich, Gummi, Kupfer, Glas
- **Muster und Nähte:** Warnstreifen am Ärmel, Spulenwicklung
- **Schnallen, Nieten und Gravuren:** Werkzeuggürtel mit Kabeltrommel
- **Abnutzung:** Brandflecken, verkohlte Ärmelenden
- **Accessoires:** Gürtel und Helmstreifen (Teamzonen), Prüfschraubenzieher in der Brusttasche

## Gesicht und Ausdruck

Hinter dem hochgeklappten Visier ein grimmiges Gesicht mit Stoppelbart, gerunzelter Stirn und knurrend gefletschten Zähnen. Beim Gegenschlag fällt das Visier herunter und die Gläser blitzen. Persönlichkeit: grimmig, knurrt durch das Schweißervisier.

## Waffe / Werkzeug

Fäuste in Gummihandschuhen, die beim Schlag elektrisch aufleuchten.

## Animationen

**Idle**

- Funken springen zwischen den Spulen
- reibt die Handschuhe

**Laufen**

- schwerer Stampfgang mit `char.step`, Funken

**Angriff**

- Faust hoch, die Spulen laden (Anticipation), Schlag nach unten mit Entladung

**Treffer**

- Spulen blitzen auf (Gegenschlag)

**Erscheinen**

- landet, Visier klappt mit Funkenregen herunter

**Tod**

- Kurzschluss: Rauch aus den Spulen, er kippt um
