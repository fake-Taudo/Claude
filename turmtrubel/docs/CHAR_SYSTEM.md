# Figuren-System: Archetypen, Unterscheidbarkeit und Schnittstellen (Phase 2)

Stand: 7. Oktober 2026 · Grundlage: [`CHAR_AUDIT.md`](CHAR_AUDIT.md) · Ergebnis der Prüfung: [`DISTINCT_MATRIX.md`](DISTINCT_MATRIX.md) · Briefs: [`briefs/`](briefs/)

Dieses Dokument legt fest, **wie jede der 130 Figuren eindeutig wird**, bevor gezeichnet wird, und definiert die **Schnittstellen** zwischen Vektor-Quellen, Build-Skript, Laufzeit und Prüfskript. So können Figuren, Laufzeit und Prüfung unabhängig voneinander entstehen.

## Dateien

| Datei | Inhalt |
|---|---|
| `tools/characters/system.mjs` | Regeln und Konstanten (Familien, Größen, Konturen, Team, Zustände, Events, Qualität, Skelette, Farbregeln) mit Prüffunktionen |
| `tools/characters/figures.mjs` | Zuordnung jeder Figur: Familie, Höhe, Farben, Signature-Element, Teamzonen, Proportionen, Persönlichkeit |
| `tools/characters/roster.mjs` | welche Figuren es gibt (aus `data/cards.json`) |
| `tools/characters/color.mjs` | CIELAB und CIEDE2000 |
| `tools/characters/gen-docs.mjs` | erzeugt `system.json`, die Matrix, die Farbtafel und die Briefs; `--check` prüft nur |
| `client/js/characters/system.json` | **maschinenlesbares System** (erzeugt). Der Master-Prompt nennt `src/characters/system.json`. Das Projekt hat kein `src/`, der Client liegt unter `client/js/`, daher dieser Ort. |
| `client/assets/characters/<id>/` | Vektor-Quellen je Figur (Phase 4) |
| `client/assets/characters/manifest.json` | Asset-Manifest für die Laufzeit (Phase 4, Format unten) |

## 1. Spielwelt und Stilrichtung: „Werkstatt-Märchen“

Turmtrubel spielt in einem Märchenland, in dem jede Figur ihre Ausrüstung aus dem Alltag ihrer Herkunft zusammengebaut hat:
- Bauern kämpfen mit Arbeitshandschuhen.
- Köchinnen tragen Kochtöpfe als Helm.
- Kobolde schleifen Löffel zu Dolchen.
- Tüftler bauen mit Messing, Dampf und Glühbirnen.
- Untote tragen Grabbeigaben, Zauberer Bücher, Gläser und Kerzen.

Daraus entsteht eine eigene, in sich stimmige Bildwelt, die keiner bekannten Spielfigur folgt.

| Herkunft | Materialien und Formen | Beispiele |
|---|---|---|
| **Krone** (Ritter, Schützinnen, Prinzen, Rekruten) | Zinn, Leinen, Spitze, Messing; heraldische Formen, Zinnen, Wimpel | Ritter mit Zinnenschild, Froschprinz-Stechhelm, Musketengabel |
| **Nordvolk** (Barbaren, Walküre, Holzfäller) | Fell, Knochen, Holz, Wolle, Eisen; runde, grobe Formen | Wolfskopf-Kapuze, Rad-Doppelaxt, Holzkraxe |
| **Riesen** | Arbeitskleidung, Stein, Moos; riesige Hände, kleine Köpfe | Bommelmütze, Bärenfellmütze, Runentafel |
| **Werkstatt** (Mechanik) | Messing, Kupfer, Kessel, Nieten, Glas, Dampf, Elektrik | Laternenkopf, Dampfpfeife, Glühbirnen-Kopf |
| **Kobolde** | grüne Haut in Varianten, Schrott, Löffel, Fässer, Kürbisse | Löffeldolch, Blasrohr, Bullaugen-Helm |
| **Zirkel** (Magie) | Bücher, Gläser, Kerzen, Sternenstoff, Kessel | fliegendes Zauberbuch, Schneekugel-Stab, Glockenturm-Hut |
| **Gruft** (Untote) | Knochen, Sargholz, Grabstein, Geisterfeuer in Figurenfarbe | Sargdeckel-Schild, Geweihkrone, Sarkophag-Kleid |
| **Elementar** | Stein, Glas, Eis, Lava, Wachs, Pflanzen | Rosengranit-Golem, Glasbauch, eingefrorener Fisch |
| **Tiere und Drachen** | Schuppen, Federn, Fell; große Köpfe, kleine Flügel | Eierschalen-Mütze, Brennglas, Lindenblatt-Ohren |
| **Gesindel** (Banditen, Fischer, Jäger, Kinder) | Leder, Ölzeug, Pappe, Flicken | Fuchsohr-Kapuze, Riesen-Blinker, Papprüstung |

**Genre-Prinzipien** (aus dem Master-Prompt, für alle verbindlich):
1. Silhouette zuerst.
2. Überzeichnete Proportionen mit einem übertriebenen Merkmal pro Figur.
3. Dicke dunkle Außenkontur nach Größenklasse.
4. Starke Kontraste mit Haupt- und Akzentfarbe.
5. Ausdrucksstarke Gesichter.
6. Animation mit Anticipation, Follow-through, Squash und Stretch.
7. Dreiviertel-Draufsicht.
8. Lesbarkeit vor Detail.
9. Teamfarbe nur in Zonen.

**Originalität:**
- Jedes Design entsteht aus Rolle, Werten, Namen und Spielfunktion der Karte (`cards.json`).
- Es gibt keine Vorlagen aus anderen Spielen.
- Jeder Brief enthält das Feld „Eigenständigkeit“.

## 2. Silhouetten-Familien

Jede Figur gehört zu genau einer Familie. Innerhalb der Familie unterscheidet sie sich durch Kopfform, Waffe oder Werkzeug, Signature-Element und Proportionsformel.

| Familie | Grundform | Lesart der Rolle | Skelett | Figuren |
|---|---|---|---|---|
| Schlank | schmales Hochrechteck, lange Diagonale (Waffe, Werkzeug) | Fernkampf, Präzision | `biped` | 12 |
| Breit | Quadrat bis Trapez, breiter Stand | robuste Nahkämpfer | `biped` | 12 |
| Keil | umgedrehtes Dreieck: sehr breite Schultern, schmale Hüfte | schnelle, harte Nahkämpfer | `biped` | 6 |
| Dreieckig | breiter Saum unten (Robe, Kleid), schmaler Kopf | Zauber, Unterstützung | `robe` | 8 |
| Hochgewachsen | hohes Rechteck, lange Beine oder Robe, hohe Kopfbedeckung | Zauberer, Spezialisten | `biped` | 6 |
| Geduckt | liegendes Oval, Kopf vorn | Sprinter, Gräber, Schleicher | `biped` | 6 |
| Kugelig | Kreis mit Stummelbeinen | Wurf- und Sprengfiguren, Golemiten | `biped` | 7 |
| Massig | Berg: riesiger Oberkörper, kleiner Kopf, Fäuste | Tanks, Riesen | `biped` | 15 |
| Winzig | kleiner Körper, Kopf ≥ 40 % der Höhe | Schwärme, Kinder | `biped` | 11 |
| Schwebend | Tropfen ohne Füße, unten Schweif, Korb oder Fass | Geister, Ballone, Elementare | `hover` | 9 |
| Geflügelt | Flügel als breiteste Form | Flieger | `flyer` | 11 |
| Vierbeinig | liegendes Rechteck auf vier Beinen | Tiere, Rammer | `quadruped` | 3 |
| Reiter | Tierkörper plus aufrechte Figur | Ansturm, Gebäudejäger | `rider` | 5 |
| Mechanisch | Kessel, Kolben, Rohre, Räder | Maschinen, Automaten | `biped` | 8 |
| Fahrzeug | Rechteck auf Rädern mit Mannschaft | Rammen, Geschütze | `vehicle` | 2 |
| Amorph | weicher Blob ohne Skelett | Kleckse, Tarnung | `blob` | 2 |
| Bauwerk | Haus, Turm, Grabmal mit Öffnung | Gebäude-Spawner | `building` | 6 |
| Schlangenartig | langer S-förmiger Leib | Drachen-Reittier | `serpent` | 1 |

**Rollen an der Form ablesbar:**
- Tanks sind *massig*.
- Fernkämpfer sind *schlank* oder *hochgewachsen* und tragen eine lange Waffe.
- Sprinter sind *geduckt*.
- Schwärme sind *winzig*.
- Flieger sind *geflügelt* oder *schwebend*; die Laufzeit zeichnet ihren Bodenschatten mit Höhenabstand.

## 3. Größenklassen, Konturen und Proportionen

Die Größenklasse folgt der **sichtbaren Höhe** in Feldern (Ruhepose, Fuß bis Scheitel; Flieger ohne Schwebehöhe). Kollision und Treffer bleiben beim Radius aus `cards.json`.

| Klasse | Höhe (Felder) | Außenkontur | Innenlinien in den Quellen |
|---|---|---|---|
| XS | 0,90–1,29 | Stufe 1 „dünn“: 1,5 px | 1,5 mu |
| S | 1,30–1,69 | Stufe 1 „dünn“: 1,5 px | 1,5 mu |
| M | 1,70–2,04 | Stufe 2 „mittel“: 1,9 px | 1,8 mu |
| L | 2,05–2,44 | Stufe 2 „mittel“: 1,9 px | 1,8 mu |
| XL | 2,45–2,94 | Stufe 3 „dick“: 2,4 px | 2,2 mu |
| XXL | 2,95–3,60 | Stufe 3 „dick“: 2,4 px | 2,2 mu |

**Kontur:**
- Die Außenkontur hat die Farbe `#1c1830`. Ihre Stärke gilt bei 26 px Feldgröße (normale Spielgröße) und wächst mit √(Feldgröße / 26), begrenzt auf das 0,8- bis 1,8-Fache. So bleiben Konturen in kleinen Ansichten lesbar und wirken in großen nicht dünn.
- Die Laufzeit erzeugt die Außenkontur beim Backen aus der Silhouette. Innenlinien stehen in den Quellen und skalieren mit der Figur.

**Champions und Helden:**
- Champions sind etwa 12 % größer als eine vergleichbare Truppe, Helden etwa 6 % größer als ihre Basisfigur.
- Beide können dadurch eine Klasse höher rutschen. Beispiel: Die Bogenschützen-Königin hat Radius 0,5 (M) und ist sichtbar L.

**Proportionsformel** (pro Figur in `figures.mjs`, in der Matrix als K · B · A · H · W):
- **K** = Kopfhöhe / Gesamthöhe:
  - *winzig* ≥ 0,40
  - *breit* um 0,33
  - *schlank* um 0,30
  - *massig* ≤ 0,26
- **B** = Beinlänge / Gesamthöhe:
  - *hochgewachsen* ≥ 0,38
  - *massig* um 0,22
  - Robe und Schweif 0
- **A** = Armlänge / Rumpfhöhe, **H** = Handbreite / Kopfbreite: große Hände sind gewollt, ≥ 0,5 bei Nahkämpfern.
- **W** = Länge von Waffe, Werkzeug oder Signature / Gesamthöhe: übergroße Waffen ≥ 0,7.
- Zusätzlich hat jede Figur genau ein **übertriebenes Merkmal** (Feld `over`).
- **Regel:** Innerhalb einer Familie und Größenklasse ist die Kombination aus K, B und A einmalig.

## 4. Pflicht-Merkmale pro Figur

| Merkmal | Festgelegt in | Geprüft durch |
|---|---|---|
| Eigene Hauptsilhouette (Körper + Kopf + Waffe/Werkzeug) | Familie und Brief | Silhouetten-IoU aller Paare (Prüfskript, Phase 6) |
| Signature-Element, das nur diese Figur hat | `sig` + Kategorie `cat` | Text eindeutig; Matrix-Regel; Kleingrößen-Test mit markierten Signature-Teilen (`data-sig`) |
| Haupt- und Akzentfarbe mit klarer Distanz | `main`, `acc` | Farbregeln unten (CIEDE2000) |
| Eigene Größenklasse und Proportionsformel | `h`, `prop`, `over` | Matrix-Regel Proportionsformel |
| Eigener Ausdruck (Gesicht, Haltung, Idle) | `mood`, `idle` | Idle-Text eindeutig; Ausdrucks-Varianten in der Quelle |
| Eigene Angriffsanimation | `attack` | Angriffs-Text eindeutig; eigene Programm-Parameter im Manifest |

**Matrix-Regel (Master-Prompt):** Keine zwei Zeilen stimmen in Familie, Farbe und Signature-Element zugleich überein. Konkret heißt das:
- „Gleiche Farbe“ bedeutet ΔE der Hauptfarbe < 10.
- „Gleiches Signature-Element“ bedeutet gleiche Kategorie.

`gen-docs.mjs --check` prüft diese Regel und alle weiteren.

## 5. Farbregeln

**Paletten:**
- Jede Figur hat eine **Hauptfarbe** (größte Eigenfarbfläche) und eine **Akzentfarbe**. Kobolde haben zusätzlich einen Hautton.
- Pro Material entstehen daraus 3–4 Stufen und Verläufe (`materialTones()` in `system.mjs`):

| Stufe | Herleitung | Einsatz |
|---|---|---|
| Licht | 34 % warmes Licht `#fff3d6` | Flächen oben links, Verlaufsbeginn |
| Basis | Grundfarbe | Fläche |
| Schatten | 32 % kühler Schatten `#1d2450` | Flächen unten rechts, Verlaufsende |
| Tiefe | 56 % Schatten | Ambient Occlusion an Falten, Übergängen, unter Gürteln und Kragen |
| Glanz | 74 % Weiß | Spitzlichter an Metall, Haaren, Augen |
| Linie | 60 % Konturfarbe | Innenlinien |
| Rim-Light | `#fff6e0`, halbtransparent | schmaler Saum an der Schattenkante, beim Backen |

**Abstände (CIEDE2000):**

| Regel | Schwelle |
|---|---|
| Hauptfarbe zu Team-Grundton (`#3d8bff`, `#ff4d57`) | ≥ 15 |
| Hauptfarbe zu Team-Schattenton | ≥ 12 |
| Hauptfarbe zu Team-Lichtton | ≥ 8 |
| Akzent zu Team-Grundton | ≥ 10 |
| gleiche Familie | ΔE Haupt ≥ 10, oder ≥ 6 bei Akzent-ΔE ≥ 25 |
| alle Paare: Farbschema √(ΔE_Haupt² + (0,6 · ΔE_Akzent)²) | ≥ 8, und nie Haupt < 6 bei Akzent < 20 |
| verwandte Paare (Held ↔ Basis, Golem → Golemit, Elixierkette, Lavahund → Welpe …) | Farbschema ≥ 6, sie sollen verwandt aussehen |

**Ergebnis:**
- Die erste Farbverteilung verletzte diese Regeln 53-mal; eine strengere Vorfassung der Regeln, die auch vertauschte Haupt- und Akzentfarben verglich, meldete 86 Paare.
- Nach mehreren Runden Umfärben sind es 0, siehe Matrix.
- Am engsten bleiben gewollt verwandte Paare wie Golem und Golemit.

## 6. Teamfarben und Teamsymbol

Blau (eigene Seite) und Rot (Gegner) liegen **nie über der ganzen Figur**.

**Teamzonen:**
- Jede Figur hat 1–2 klar begrenzte Zonen (Umhang, Schärpe, Schal, Helmbusch, Wimpel, Schildfeld, Satteldecke, Schleife). Sie sind in der Matrix und im Brief benannt.
- Zusammen bedecken sie höchstens **25 % der sichtbaren Fläche**. Das Prüfskript zählt die Pixel.

**Platzhalter in den Quellen:** Die Teamzonen nutzen ausschließlich diese Farben, die beim Rastern ersetzt werden:

| Platzhalter | Rolle | Blau | Rot |
|---|---|---|---|
| `#ff00f1` | Grundton | `#3d8bff` | `#ff4d57` |
| `#ff00f2` | Lichtton | `#9cc8ff` | `#ffb0b5` |
| `#ff00f3` | Schattenton | `#1f5fc9` | `#c42233` |
| `#ff00f4` | Tiefe | `#0f3a85` | `#7a1020` |
| `#ff00f5` | Symbol | `#f4f9ff` | `#fff4f4` |

**Formbasiertes Teamsymbol** (Barrierefreiheit):
- **Bodenring** (zeichnet das Figurensystem unter jede Bodenfigur): eigene Seite als **glatter Kreisring**, Gegner als **Ring mit sechs nach außen zeigenden Zacken**.
- **Emblem** auf der Figur (Schildmitte, Schärpenbrosche, Hutband): eigene Seite **Kreis**, Gegner **Dreieck**. In der Quelle als zwei Varianten mit `data-team-only="blue"` bzw. `"red"`.
- **Farbenblind-Modus** (Einstellung `colorblind`): Das Emblem wird 1,5-fach größer gebacken und der Bodenring kräftiger. Die Form trägt die Information, nicht der Farbton.

## 7. Schwärme und Mehrfach-Spawns

- Einzelfiguren eines Schwarms (Barbaren, Kobolde, Skelette, Fledermäuse, Rekruten …) teilen ein Modell.
- Pro Einheit wählt die Laufzeit eine **Variante** aus der Entitäts-ID:
  - Farbton der Hauptfarbe ± 6°
  - Größe ± 5 %
  - ein Varianten-Accessoire aus `variants` (zum Beispiel Zopf oder Dutt, Narbe, Zahnlücke)
- In der Quelle sind die Varianten Teile mit `data-variant="0|1|2…"`.
- Mehr als vier Varianten werden nicht gebacken; sie wiederholen sich.

## 8. Champions, Helden, Evolutionen, Formen

| Art | Regel |
|---|---|
| **Champion** | ca. 12 % größer und prunkvoller (Gold, Ornament, Umhang), **sichtbare Aura** (Bodenaura plus Partikel), eigene **Fähigkeits-Pose** (`ability`) mit Event `char.ability` |
| **Held** | Basisfigur bleibt erkennbar (Gesicht, Waffe, Familie); dazu **Rang-Merkmal** als Signature (Umhang, Krone, Banner, Begleiter), eigene Palette und eigene **Spezial-Pose** im Idle und als `ability` |
| **Evolution** | gleiche Figur mit **anderem Farbschema**, **zusätzlichen Rüstungsteilen** (`data-evo="evo"`), **Leuchtkanten** (Glow-Teile) und **Partikelhülle** (Laufzeit, Event `char.evo`); Teile mit `data-evo="base"` entfallen in der Evo |
| **Form** | Spieltyp, der ein Zustand einer Figur ist (Kanonenkarre aufgebaut, Phönix-Ei, Holzfäller-Geist …): Teile mit `data-form="<name>"` im selben Modell, eigene Animation im Manifest |

## 9. Schnittstellen

### 9.1 Koordinaten

- **Einheiten:**
  - Modell-Einheit **mu**: 1 Feld = **50 mu**.
  - Der Ankerpunkt (0, 0) ist die **Fußmitte** auf dem Boden.
  - Die y-Achse zeigt nach unten (SVG), die Figur steht also bei negativem y.
- **Blickrichtung:**
  - Figuren sind in leichter Draufsicht als **Dreiviertel-Vorderansicht nach rechts** gezeichnet.
  - Die Laufzeit spiegelt sie für links (`face = -1`).
  - Die **Rückansicht** (Bewegung vom Betrachter weg) tauscht Kopf- und Rumpfteile und die Zeichenreihenfolge.
  - Reiter, Fahrzeuge und Vierbeiner sind von Natur aus Halbprofile nach rechts.
- **Flieger:**
  - Die Figur steht in der Quelle auf (0, 0).
  - Die Laufzeit hebt sie um `hover` Felder an und zeichnet den Schatten am Boden.

### 9.2 Vektor-Quellen (SVG-Konvention)

`client/assets/characters/<id>/<id>.svg` – eine Datei pro Figur mit allen Teilen, Ansichten, Ausdrücken, Varianten, Evo- und Form-Teilen.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -110 120 120" data-character="knight" data-mu="50">
  <defs>
    <linearGradient id="knight-g3" gradientUnits="userSpaceOnUse" x1="-20" y1="-80" x2="10" y2="-40">…</linearGradient>
    <clipPath id="knight-c1"><path d="…"/></clipPath>
  </defs>
  <g data-part="legB" data-bone="legB" data-z="10">…</g>
  <g data-part="torso" data-bone="torso" data-z="30" data-zb="34">…</g>
  <g data-part="head" data-bone="head" data-z="50" data-view="front">…</g>
  <g data-part="headBack" data-bone="head" data-z="50" data-view="back">…</g>
  <g data-part="face.angry" data-bone="head" data-z="51" data-expr="attack" data-view="front">…</g>
  <g data-part="shield" data-bone="handB" data-z="60" data-zb="8" data-team="1" data-sig="1">…</g>
  <g data-part="emblem.blue" data-bone="handB" data-z="61" data-team-only="blue" data-lod="1">…</g>
  <g data-part="emblem.red" data-bone="handB" data-z="61" data-team-only="red" data-lod="1">…</g>
  <g data-part="chainmail" data-bone="torso" data-z="31" data-lod="2">…</g>
  <g data-part="evoPlates" data-bone="torso" data-z="32" data-evo="evo">…</g>
</svg>
```

| Attribut | Bedeutung |
|---|---|
| `data-part` | eindeutiger Teilname |
| `data-bone` | Knochen, an dem das Teil hängt. Die Koordinaten des Teils stehen in Modellraum-Ruhepose; der Knochen dreht und verschiebt um seinen Drehpunkt. |
| `data-z` / `data-zb` | Zeichenreihenfolge Vorder- und Rückansicht (fehlt `zb`, gilt `z`) |
| `data-view` | `front`, `back` oder fehlend (beide) |
| `data-expr` | Ausdrucks-Variante: `idle`, `attack`, `hurt`, `stun`, `sleep`, `ability`, `death`. Ohne Angabe ist das Teil immer sichtbar; mit Angabe nur im passenden Zustand. Fehlt für einen Zustand eine Variante, gilt `idle`. |
| `data-evo` | `base` (nur ohne Evo) oder `evo` (nur Evo) |
| `data-form` | gehört zu einer Form (`cannon`, `egg`, `reborn`, `kamikaze`, `ghost`, `decoy`); Teile ohne Angabe gehören zur Grundform |
| `data-variant` | Schwarm-Variante 0, 1, 2 … |
| `data-lod` | 0 (immer, Standard), 1 (ab 46 Gerätepixel Figurhöhe), 2 (ab 110 Gerätepixel, feinste Details) |
| `data-team="1"` | enthält Teamfarben-Platzhalter |
| `data-team-only` | nur für `blue` oder `red` (Teamsymbol) |
| `data-sig="1"` | gehört zum Signature-Element (Kleingrößen-Test) |
| `data-glow="1"` | leuchtet: wird additiv gezeichnet und nicht schattiert |
| `data-outline="0"` | zählt nicht zur Silhouette (Glanz, Rauch, Funken außerhalb des Körpers) |
| `data-state` | nur in diesem Zustand sichtbar (z. B. Mündungsfeuer im Angriff, Geschoss in der Hand bis zum Abschuss) |

**Erlaubte SVG-Teilmenge** (die Laufzeit parst sie einmal zu `Path2D`; kein Bild-Dekodieren, nie pro Frame):
- **Elemente:** `g` (mit `transform`, `opacity`, `clip-path`), `path`, `circle`, `ellipse`, `rect`, `polygon`, `polyline`, `line`
- **Füllungen:** `linearGradient` und `radialGradient` in `userSpaceOnUse` (auch mit `gradientTransform`), `clipPath`
- **Malattribute:** `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `fill-opacity`, `stroke-opacity`, `fill-rule`
- **Nicht erlaubt:** Filter, Text, Bilder und Masken. Weiche Übergänge entstehen über Verläufe mit Alpha.

Die Quellen entstehen aus Design-Code (`tools/characters/figures/*.mjs` mit gemeinsamen Formen-, Material- und Gesichtshelfern). Sie sind aber normale SVG-Dateien. Eine von Hand gezeichnete Datei mit denselben Attributen funktioniert genauso.

### 9.3 Skelette

Die Animationsprogramme sprechen Knochen über diese Namen an. Fehlende Knochen werden übersprungen, zusätzliche Knochen (Umhang, Schweif, Begleiter) bewegt die Figur über eigene Parameter.

| Vorlage | Knochen |
|---|---|
| `biped` | root, hip, torso, head, armB, handB, armF, handF, legB, footB, legF, footF, prop, cape, back, hat, tail |
| `robe` | root, hip, skirt, torso, head, armB, handB, armF, handF, prop, cape, back, hat, buddy |
| `hover` | root, body, head, armB, handB, armF, handF, trail, prop, hat |
| `flyer` | root, body, head, jaw, wingB, wingF, tail, legB, legF, crest |
| `quadruped` | root, body, head, jaw, ear, tail, legFn, legFf, legBn, legBf (vorn/hinten, nah/fern) |
| `rider` | wie `quadruped` plus rHip, rTorso, rHead, rArmB, rHandB, rArmF, rHandF, prop, cape |
| `vehicle` | root, body, wheelB, wheelF, barrel, c1Torso, c1Head, c1ArmF, c1ArmB, c2…, flag |
| `blob` | root, body, eyes, hat, feet |
| `building` | root, base, roof, door, chimney, flag, glow, crew |
| `serpent` | root, seg1 … seg6, head, jaw, rTorso, rHead, rArmF, rHandF, rArmB |

Suffix **B** = hinten (weiter vom Betrachter), **F** = vorn.

### 9.4 Asset-Manifest

`client/assets/characters/manifest.json` (erzeugt vom Build-Skript aus Quellen und `system.mjs`):

```json
{
  "version": 1,
  "muPerTile": 50,
  "system": { "team": {}, "outline": {}, "states": {}, "lod": {}, "quality": {} },
  "types": {
    "knight": { "figure": "knight" },
    "cannon-cart-cannon": { "figure": "cannon-cart", "form": "cannon" }
  },
  "figures": {
    "knight": {
      "file": "knight/knight.svg",
      "hash": "3f2a9c1e",
      "rig": "biped",
      "family": "breit",
      "size": "M",
      "outline": 2,
      "height": 1.85,
      "box": [-42, -98, 90, 102],
      "pad": 26,
      "anchor": [0, 0],
      "hover": 0,
      "bar": 2.05,
      "hit": 0.95,
      "muzzle": null,
      "team": { "zones": ["Schildfeld", "Helmwimpel"], "emblem": "shield" },
      "bones": [["root", null, 0, 0], ["hip", "root", 0, -30], ["torso", "hip", 0, -30]],
      "anim": {
        "idle": { "prog": "biped.idle", "dur": 1.6, "p": { "breathe": 0.03, "fidget": "shieldTap" } },
        "attack": { "prog": "attack.swing", "dur": 0.75, "hit": 0.55, "p": { "windup": 110, "arc": 150 } }
      },
      "events": { "attack.strike": "char.strike" },
      "expr": ["idle", "attack", "hurt", "stun"],
      "views": ["front", "back"],
      "variants": 0,
      "evo": { "aura": "#bfeaff", "particles": ["#bfeaff", "#ffffff"] },
      "forms": {}
    }
  }
}
```

| Feld | Bedeutung |
|---|---|
| `box`, `pad` | Ruhepose-Grenzen in mu [x, y, Breite, Höhe] und Zusatzrand für Animationen; bestimmen die Atlas-Zellgröße |
| `height`, `hover` | sichtbare Höhe und Schwebehöhe in Feldern |
| `bar`, `hit` | Höhe des LP-Balkens und des Trefferpunkts für VFX in Feldern |
| `muzzle` | Geschoss-Austritt in mu (Fernkampf), sonst `null` |
| `bones` | `[Name, Elternknochen, Drehpunkt x, Drehpunkt y]` in mu, Ruhepose |
| `anim.<zustand>` | `prog` = Animationsprogramm, `dur` = Dauer, `p` = Parameter, optional `keys` (eigene Keyframes je Knochen: `{ "<knochen>": { "r": [[t, v], …], "x": …, "y": …, "sx": …, "sy": … } }`) und `ev` (Event-Zeiten) |
| `events` | Animations-Event → VFX-Preset (sonst gilt die Preset-Suche unten) |
| `expr`, `views`, `variants` | vorhandene Ausdrücke, Ansichten, Schwarm-Varianten |
| `evo`, `forms` | Evo-Hülle und Formen |

`skin.json` bleibt gültig und bekommt pro Karte das optionale Feld **`character`** (Figuren-ID aus dem Manifest). Das bisherige `archetype` wird darauf abgebildet.

### 9.5 Animationszustände

| Zustand | Dauer | Schleife | Gebackene Bilder (niedrig/mittel/hoch) | Events (normierte Zeit) | Auslöser im Spiel |
|---|---|---|---|---|---|
| `idle` | 1,6 s | ja | 3 / 6 / 8 | – | sonst |
| `walk` | 0,8 s, skaliert mit Tempo | ja | 4 / 8 / 10 | `char.step`, `char.flap` | Einheit bewegt sich |
| `attack` | aus `hitSpeed`, höchstens 0,9 s | nein | 4 / 8 / 10 | `windup` 0, `strike`/`release` 0,55 | Flag `ATTACK`; Ausholen beginnt vor dem erwarteten Treffer (letztes `a` + `hitSpeed`), der Treffer-Frame liegt auf dem Ereignis `a` |
| `hit` | 0,24 s | nein | 2 / 3 / 3 | – | Ereignis `h` (im Angriff nur Aufblitzen und kleiner Rückstoß) |
| `spawn` | 0,5 s | nein | 3 / 5 / 6 | `land` 0,55 | neue Einheit (`born`) bzw. Flag `DEPLOY` |
| `death` | 0,7 s | nein | 4 / 6 / 8 | `fall` 0,45, `vanish` 1 | Ereignis `d`: der Client zeigt die Figur noch 0,7 s als Leiche |
| `ability` | 0,9 s | nein | 4 / 6 / 8 | `ability` 0,6 | Ereignis `ab` (Champions, Helden) |
| `stun` | 0,9 s | ja | 2 / 4 / 4 | – | Flag `STUN`; `FREEZE` hält die aktuelle Pose an und legt Eis darüber |
| `sleep` | 2,0 s | ja | 2 / 4 / 4 | – | inaktiver König |
| `charge` | 0,5 s | ja | 4 / 6 / 6 | `char.step` | Flags `CHARGE`, `DASH`, `JUMP` |

- **Vorrang:** `death` > `spawn` > `ability` > `hit` > `stun` > `sleep` > `attack` > `charge` > `walk` > `idle`.
- **Übergänge:**
  - Wechsel zwischen Schleifen (`idle` ↔ `walk`) beginnen in der passenden Phase, damit nichts springt.
  - Ein abgebrochenes Ausholen (Ziel tot) läuft über 0,15 s zurück.
- **Fortlaufend beim Kopieren (nicht gebacken):** Wippen, Atmen, Squash beim Landen, Rückstoß und Treffer-Aufhellen werden beim Kopieren angewendet. Die Bewegung bleibt so auch zwischen gebackenen Bildern flüssig.

### 9.6 Event-Namen (Hooks für das VFX-System)

| Event | Wann | Beispiel-Effekt |
|---|---|---|
| `char.step` | Fußaufsatz (XL, XXL, Vierbeiner) | Staubwölkchen, bei XXL leichtes Beben |
| `char.windup` | Beginn des Ausholens | Glanzblitz an der Waffe |
| `char.strike` | Treffer-Bild Nahkampf | Schwungsichel (heute `unit.swing`) |
| `char.release` | Abschuss | Mündungsblitz (heute `unit.muzzle`) |
| `char.land` | Landung nach dem Erscheinen | Staubring |
| `char.fall` | Aufprall beim Tod | Staub, Teile fallen ab |
| `char.vanish` | Ende des Todes | Auflösen in Funken (heute `unit.death`) |
| `char.ability` | Höhepunkt der Fähigkeits-Pose | figurenspezifisch, z. B. `char.ability.archer-queen` |
| `char.flap` | Flügel-Abwärtsschlag | Luftwirbel (nur bei Qualität Hoch) |
| `char.spawnUnit` | Tür oder Klappe öffnet sich | Rauch, Funken |
| `char.evo` | Puls der Evo-Hülle | Funken in Evo-Farbe |

**Preset-Suche:**
1. `<event>.<figur>` (z. B. `char.ability.monk`)
2. `<event>.<familie>` (z. B. `char.step.massig`)
3. `<event>`

Fehlt alles, entsteht kein Effekt. Das Manifest kann pro Figur eigene Zuordnungen setzen (`events`).

### 9.7 Laufzeit-API (`client/js/characters/`)

| Funktion | Zweck |
|---|---|
| `initCharacters()` | lädt das Manifest (beim Start) |
| `loadFigures(ids, { priority })` | lädt SVG-Quellen und parst sie zu `Path2D`. Eigenes Deck und Turmfiguren vor dem Match, Gegnerfiguren beim ersten Auftauchen, der Rest im Leerlauf. |
| `figureForType(typeId, evo)` | Spieltyp → `{ figure, form, evo }` (berücksichtigt `skin.json → character`) |
| `drawCharacter(ctx, o)` | zeichnet eine Figur. Rückgabe: Bildschirmpunkte für LP-Balken, Trefferpunkt und Mündung. |
| `CharacterAnimator` | pro Einheit: leitet Zustand und Zeit aus Flags, Ereignissen und Bewegung ab, feuert Events |
| `bakeTick(budgetMs)` | backt vorgemerkte Bilder innerhalb des Frame-Budgets |
| `characterStats()` | Atlanten, gebackene Bilder, Speicher, Live-Zeichnungen (für Bench und Prüfskript) |

Optionen von `drawCharacter`:

| Gruppe | Felder |
|---|---|
| Figur | `figure`, `form`, `evo` |
| Team | `team` (`blue`/`red`) |
| Position und Maßstab | `x`, `y` (Fußpunkt in px), `scale` (Pixel pro Feld), `dpr` |
| Ausrichtung | `face` (1/-1), `view` (`front`/`back`) |
| Animation | `state`, `time` (Sekunden im Zustand), `t` (Weltzeit), `seed` |
| Darstellung | `variant`, `alpha`, `lift` (Pixel), `flash` (0–1) |
| Qualität und Extras | `quality`, `shadow`, `ring` |

**Ablauf je Frame:**
1. Das gebackene Bild für (Figur, Form, Team, Evo, Ansicht, Zustand, Bildindex, Pixelgröße, Qualität) kommt aus dem Atlas der Qualitätsstufe: **ein `drawImage` pro Einheit**.
2. Fehlt es und ist das Bau-Budget erschöpft, nimmt die Laufzeit das nächstgelegene schon gebackene Bild desselben Zustands, sonst `idle`.
3. Erst wenn auch das fehlt, zeichnet sie die Figur einmal live aus den Vektorteilen. Eine Figur ist also nie unsichtbar.

### 9.8 Qualitäts- und Detailstufen

| Stufe | Bilder pro Zustand | Detailstufe | Auflösung | Atlas | Speicherbudget | Bau-Budget pro Frame |
|---|---|---|---|---|---|---|
| Niedrig | niedrigster Wert (z. B. 4 für Laufen) | bis 1 | 75 % | 1024² | 12 MB | 3 ms |
| Mittel | mittlerer Wert | bis 2 | 100 % | 2048² | 24 MB | 4 ms |
| Hoch | höchster Wert | bis 2 | 100 % | 2048² | 48 MB | 5 ms |

**Auflösung und Wechsel:**
- Gebacken wird für die aktuelle Pixelgröße der Figur (Feldgröße × Höhe × Gerätepixel).
- Nur die automatische Qualität des Spiels wechselt die Stufe.
- Atlanten werden seitenweise nach LRU geleert.

## 10. Prüfung

| Werkzeug | Prüft |
|---|---|
| `node tools/characters/gen-docs.mjs --check` | Roster vollständig, Matrix-Regel, Signature- und Proportions-Eindeutigkeit, alle Farbregeln |
| `npm run check:characters` (Phase 6) | Contact Sheet, Silhouetten-IoU, Farbtest, 40-px-Test mit Signature-Fläche, Team-Test (Blau/Rot, Graustufen, Farbenblind-Simulation, Teamfläche ≤ 25 %), Animationstest (Anker, Ränder, Sprünge), Performance (60 Einheiten plus Zauber), Eigenständigkeits-Review |
