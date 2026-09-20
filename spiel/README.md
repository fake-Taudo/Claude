# ARKANUM – Der letzte Funke

Ein 2D-Open-World-Action-Adventure im **flachen Vektorstil**, vollständig in **einer
einzigen HTML-Datei**: [`arkanum.html`](arkanum.html).

Datei per Doppelklick im Browser öffnen – fertig. Kein Build, kein Server, keine
externen Abhängigkeiten, keine Netzwerkzugriffe. Grafik, Welt, Musik und Soundeffekte
werden zur Laufzeit prozedural erzeugt.

**Bildsprache:** klare geometrische Formen, kräftige Farbflächen, durchgehend saubere
Konturen – keine Texturen, keine Schraffuren, keine Pixelraster. Weiche Verläufe gibt
es nur dort, wo sie Tiefe stiften: Himmel, Lichtscheine von Zaubern, Laternen,
Kristallen und Portalen. Gezeichnet wird alles als Vektorpfade auf Canvas 2D, in der
vollen Auflösung des Bildschirms.

---

## Die Welt

512 × 512 Felder (8192 × 8192 Welteinheiten) nahtlos begehbar, aufgeteilt in dreizehn Zonen
mit eigener Flora, eigenen Gegnern, eigener Farbstimmung und eigener Musik:

Sonnenwiesen · Flüsterwald · Tiefwald · Schattensumpf · Ruinen von Telvar ·
Kristallhöhlen (dunkel, nur Stablicht) · Frostgipfel · Glutwüste · Astralfeld ·
Verdorrte Leere · Azurküste · Das Blaue Meer · Ahornfurt

Dazu 23 benannte Orte – Dörfer, Lager, Schreine, ein Bergkloster, eine Hexenhütte,
Bosskampfplätze und die Zitadelle der Leere –, ein Flusssystem mit Brücken, ein
Wegenetz, 40 versteckte Truhen, Tag-/Nachtwechsel mit dynamischer Beleuchtung sowie
biomabhängige Wetter- und Partikeleffekte.

**Übersichtskarte (`M`):** frei verschieb- und zoombar, mit Nebel des Krieges,
Ortsmarkierungen, Questziel und Schnellreise zwischen berührten Wegsteinen.

## Der Magier

* **8 Zauber** mit je 5 Rängen: Arkanpfeil, Feuerball, Frostnova, Kettenblitz,
  Arkanschild, Phasenschritt, Lebensquell und Sternenfall. Höhere Ränge ändern das
  Verhalten (Mehrfachgeschosse, Zielsuche, Einfrieren, zusätzliche Sprünge,
  Reflexion, Detonation beim Ausweichen …).
* **6 Talente** (Vitalität, Arkane Reserve, Fokus, Präzision, Gewandtheit,
  Schutzgeist) mit je 5 Rängen.
* Fertigkeitspunkte gibt es pro Stufe und aus Quests.

## Inventar

* Sechs Ausrüstungsplätze: **Stab, Kopf, Robe, Stiefel, Amulett, Ring**.
* 13 Magiestäbe mit unterschiedlichen Eigenschaften (Element, Zaubertempo,
  kritische Treffer, Lebensraub, Mana) – der ausgerüstete Stab verändert Aussehen,
  Farbe und Geschosse der Spielfigur.
* Prozedural erzeugte Beute mit fünf Seltenheitsstufen und Präfix-/Suffix-Affixen,
  inklusive Werte­vergleich zur getragenen Ausrüstung.
* 11 Tränke: Heilung, Mana, Schadens-, Tempo-, Rüstungs- und Glücksboosts.
  Anlegen und Benutzen direkt per Klick aus dem Inventar, Heiltrank auf `Q`.
* Händler kaufen und verkaufen.

## Quests

21 Aufträge von 19 Questgebern mit eigenen Dialogen – 10 Hauptquests führen als
zusammenhängende Geschichte durch alle Gebiete, 11 Nebenquests belohnen das
Erkunden. Questbuch mit Zielverfolgung, Markierungen auf Karte und Minikarte.

## Kämpfe

12 Gegnertypen mit unterschiedlichem Verhalten (Nahkampf, Sturmangriff, Distanz,
Blinzeln, Beschwörer, Flieger), Elitegegner, sowie **sechs Bosse**:

Der Waldfürst · Der Knochenkönig · Die Kristallmatriarchin · Der Frostgeborene ·
Das Ascheherz · und als Abschluss **Malakar, Herr der Leere** – ein bewusst harter
Kampf über **vier Phasen** mit rotierenden Strahlen, telegrafierten Einschlägen,
Meteorregen, Schattenklonen und Leerenkristallen, die ihn heilen, solange sie stehen.

## Steuerung

| Taste | Funktion |
| --- | --- |
| `WASD` / Pfeiltasten | Bewegen |
| Maus | Zielen |
| Linke Maustaste / `Leertaste` | Gewählten Zauber wirken |
| `1` – `6` | Zauber der Schnellleiste wählen und wirken |
| Mausrad | Zauber durchblättern |
| `Umschalt` / rechte Maustaste | Phasenschritt (Ausweichen, unverwundbar) |
| `E` | Reden / Benutzen / Öffnen |
| `Q` | Heiltrank |
| `I` | Gepäck und Ausrüstung |
| `K` | Zauber und Talente |
| `J` | Questbuch |
| `M` / `Tab` | Übersichtskarte |
| `F5` / `F9` | Speichern / Laden |
| `Esc` | Menü |

Der Spielstand liegt im `localStorage` des Browsers und wird zusätzlich alle
60 Sekunden automatisch gesichert.

## Auf Handy und Tablet

Geräte ohne Maus schalten von selbst auf Fingersteuerung um – zwei Sticks und
runde Tasten, alle mindestens 46 CSS-Pixel groß:

| Bedienelement | Funktion |
| --- | --- |
| Linker Stick | Laufen (setzt dort auf, wo der Finger landet) |
| Rechter Stick | Zielen und dabei dauerhaft zaubern |
| Hand | Reden / Benutzen / Öffnen |
| Pfeile | Phasenschritt |
| Flasche | Heiltrank |
| Beutel · Blitz · Schriftrolle · Karte | Gepäck, Zauber, Questbuch, Übersichtskarte |
| Balken | Menü (Speichern, Laden, Ton) |
| Rahmen | Vollbild an oder aus |

Dazu: Tippen auf die Zauberleiste wählt einen Zauber, Tippen auf die Minikarte
öffnet die Übersichtskarte, Wischen blättert in Gepäck, Laden und Questbuch,
Ziehen verschiebt die Karte und zwei Finger zoomen sie. Ein Tipp zählt erst
beim Loslassen – so lässt sich wischen, ohne versehentlich etwas anzulegen.
Die Hinweistexte im Spiel wechseln mit dem Eingabegerät.

**Hochformat:** Das Spielfeld sitzt oben im Bild, darunter liegt eine eigene
Steuerfläche – Systemtasten direkt unter dem Bild, Aktionstasten in der Mitte,
die beiden Sticks unten in Daumenhöhe. Nichts verdeckt das Spielgeschehen.
**Querformat:** Die Sticks liegen halbtransparent in den unteren Ecken, die
Systemtasten als kleiner Block am linken Rand.

## Technisches

* **Canvas 2D, rein vektoriell.** Logischer Weltausschnitt 480 × 270 Einheiten; die
  Zeichenfläche selbst läuft in Gerätepixeln (bis 4× Überabtastung), sodass Kanten
  und Schrift immer scharf bleiben. Die Renderauflösung passt sich automatisch an die
  gemessene Bildrate an.
* **Jedes Bildformat.** Das 16:9-Spielfeld wird mit festem Seitenverhältnis in das
  Fenster eingepasst (Letterbox), die Leinwand füllt über `100dvw`/`100dvh` immer die
  sichtbare Fläche – ohne Rollbalken, ohne abgeschnittene Ränder. Die gesamte
  Rechnung steckt in einer Stelle: `resize()` bestimmt aus Fenstergröße,
  `devicePixelRatio` und den Safe-Area-Rändern (`viewport-fit=cover`, Notch,
  Home-Leiste) den Maßstab, die Ränder und im Hochformat die Höhe der Steuerleiste.
  Größenänderung, Gerätedrehung und `visualViewport` lösen dieselbe Rechnung aus.
  Maus- und Fingerpunkte laufen durch eine einzige Umrechnung in Spielkoordinaten.
  Pinch-Zoom, Doppeltipp-Zoom, Überziehen und Textauswahl sind abgeschaltet.
* **Boden ohne Kacheloptik:** ein durchgehender Farbteppich je Biom, darüber
  organische Flächen aus verschmolzenen Kreisen. Die Kontur entsteht, indem die
  Vereinigungsfläche erst gestrichen und dann gefüllt wird – dadurch bleibt nur die
  Außenlinie sichtbar.
* **Objekte und Figuren** werden beim Start als Vektorpfade in Gerätepixel-Auflösung
  gerastert (Bäume, Häuser, Kristalle, Ruinen) bzw. pro Bild neu gezeichnet
  (Magier, NSCs, Gegner, Zauberwirkungen).
* Schrift: serifenlose Systemschrift, direkt auf Canvas gesetzt.
* Lichtscheine und Vignette laufen über zwischengespeicherte Verlaufstexturen.
* Ton und adaptive Musik über die Web Audio API – Oszillatoren, Rauschen und ein
  kleiner Faltungshall, kein einziges Audio-Asset.
* Weltgenerierung in unter einer Sekunde, 60 fps auch mit vielen Gegnern.
