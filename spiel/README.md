# ARKANUM – Der letzte Funke

Ein 2D-Open-World-Action-Adventure im Pixel-Art-Stil, vollständig in **einer einzigen
HTML-Datei**: [`arkanum.html`](arkanum.html).

Datei per Doppelklick im Browser öffnen – fertig. Kein Build, kein Server, keine
externen Abhängigkeiten, keine Netzwerkzugriffe. Grafik, Welt, Musik und Soundeffekte
werden zur Laufzeit prozedural erzeugt.

---

## Die Welt

512 × 512 Kacheln (8192 × 8192 Pixel) nahtlos begehbar, aufgeteilt in dreizehn Zonen
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

## Technisches

* Interne Auflösung 480 × 270, ganzzahlig hochskaliert, `image-rendering: pixelated`.
* Eigener 5×7-Bitmap-Zeichensatz, zur Laufzeit gerastert und eingefärbt.
* Kachel-Atlas, Deko- und Figurengrafik werden beim Start prozedural gezeichnet.
* Ton und adaptive Musik über die Web Audio API – Oszillatoren, Rauschen und ein
  kleiner Faltungshall, kein einziges Audio-Asset.
* Weltgenerierung in unter einer Sekunde, 60 fps auch mit vielen Gegnern.
