# Charakter-Neubau – Abschlussbericht

Stand: 12.10.2026. Alle Figuren des Spiels sind neu gebaut: als Vektor-Modelle mit Skelett, Material-Schattierung und eigener Animation. Vom alten Figuren-Baukasten (`drawUnit` mit `look`-Bausteinen) ist nichts übrig. Spiellogik, Kartenwerte, Hitboxen, Protokoll, Server-Simulation und Deckregeln sind unverändert.

| Dokument | Inhalt |
|---|---|
| [CHAR_AUDIT.md](CHAR_AUDIT.md) | Ausgangslage und Roster (Phase 1) |
| [CHAR_SYSTEM.md](CHAR_SYSTEM.md) | Stil, Familien, Farb- und Teamregeln, Schnittstellen, Laufzeit, Prüfschwellen |
| [DISTINCT_MATRIX.md](DISTINCT_MATRIX.md) | Unterscheidbarkeits-Matrix aller Figuren |
| [briefs/](briefs/) | ein Design-Brief pro Figur |
| [contact_sheet.png](contact_sheet.png) | alle Figuren in allen Zuständen |
| [char_check.md](char_check.md) | Ergebnis von `npm run check:characters` (Rohdaten: `char_check.json`) |
| [char_check/runde0.md](char_check/runde0.md), [runde1.md](char_check/runde1.md) | Prüfergebnisse vor den Iterationsrunden |

## 1. Umfang

| | Anzahl |
|---|---|
| Figuren (eigene Modelle) | **130** |
| davon Truppen und Token ohne Helden | 107, darunter 8 Champions |
| davon Helden | 16, jeder mit eigener Silhouette gegenüber der Basisfigur (einer davon ist ein Spawner-Gebäude) |
| davon Spawner-Gebäude | 6 (Grabstein und Grabstein als Held, Barbarenhütte, Koboldhütte, Koboldkäfig, Koboldbohrer) |
| davon Turmfiguren | 2 (König, Turmwache) |
| Spieltypen, die auf eine Figur zeigen | 136 (Formen eingerechnet) |
| Figuren mit Evo-Teilen | 35 |
| Formen | 8 in 7 Figuren (Kanonenkarre, Dunkler Prinz als Held zu Fuß, Goblin Demolisher, Wächter ohne Schild, Holzfäller-Geist, Lockvogel, Phönix-Ei und wiedergeborener Phönix) |
| Figuren mit Varianten (Schwärme) | 16, mit 2–4 Varianten |
| Silhouetten-Familien | 18 |
| Animationszustände, alle Figuren | 1112 |
| Teile in den SVG-Quellen | 3617 |
| Quellcode der Figuren (`tools/characters/figures/`) | rund 30 000 Zeilen |
| gebaute SVG-Quellen und Manifest | 5,0 MB |

Gebäude ohne Einheiten (Kanone, Tesla, Inferno-Turm, Bombenturm, Mörser, X-Bogen, Elixiersammler, Helden-Geschütz) bleiben beim Gebäude-Baukasten. Sie sind keine Figuren.

## 2. Contact Sheet

![Contact Sheet](contact_sheet.png)

Jede Kachel zeigt:
- das Heldenbild (vergrößert, Team Blau),
- Team Rot, Rückansicht, Angriff im Trefferbild und Evo bzw. eine Variante,
- den 40-px-Test (Blau, Rot, Silhouette),
- unten **alle Zustände in Spielgröße** (26 px pro Feld).

Das Bild wird als deckendes RGB-PNG mit 6 Bit pro Kanal gespeichert (`tools/characters/png.mjs`): sichtbar gleich, 7,8 statt 16,6 MB. Eine 256-Farben-Palette hätte nur 3 MB gebraucht, verschob aber Hauttöne und Teamfarben sichtbar.

## 3. Prüfskript `npm run check:characters`

`tools/characters/check.mjs` führt acht Prüfungen aus. Die Schwellen stehen in `CHECK` (`tools/characters/system.mjs`), beschrieben in CHAR_SYSTEM.md §10.

| Prüfung | Ergebnis (Endstand) |
|---|---|
| 1. Contact Sheet | erzeugt, 130 Figuren |
| 2. Silhouette (IoU aller 8385 Paare) | **0 Fehler**, 283 Hinweise (IoU 0,70–0,80) |
| 3. Farbe (CIEDE2000) | **0 Fehler**, 11 Hinweise (Akzentfarbe im Ruhebild kaum sichtbar) |
| 4. 40-px-Test | **0 Fehler**, 6 Hinweise (Signature unter 4 % der Fläche) |
| 5. Team (Blau/Rot, Graustufen, Fehlsichtigkeit) | **0 Fehler** |
| 6. Animation (8760 Bilder, 81 575 Posen) | **0 Fehler**, 34 Hinweise (Einstieg aus der Ruhepose) |
| 7. Performance | **2 Fehler**: Zielwerte in dieser Umgebung nicht erreicht (Abschnitt 5) |
| 8. Eigenständigkeits-Review | 9 Figuren als „generisch?“ markiert (Abschnitt 4.6) |

Ein Lauf dauert ohne Performance etwa zwei Minuten, mit Performance und Vergleich gegen einen alten Stand (`--before <Ordner>`) etwa 15 Minuten.

## 4. Unterscheidbarkeit

### 4.1 Silhouetten

Gemessen wird das Ruhebild jeder Figur: Team Blau, Vorderansicht, 50 px pro Feld, Fußpunkte deckungsgleich. Daraus ergibt sich der IoU aller Paare.

- **Mittelwert 0,42.**
- Verteilung: 0,0–0,1: 109 · 0,1–0,2: 637 · 0,2–0,3: 1259 · 0,3–0,4: 1810 · 0,4–0,5: 1829 · 0,5–0,6: 1455 · 0,6–0,7: 990 · 0,7–0,8: 285 · ab 0,8: 11. Die 11 Paare ab 0,8 sind alle verwandt (Held ↔ Basis, Golem ↔ Golemit …).
- **Schwelle:** Fehler ab 0,80 für unverwandte Paare. Verwandte Paare dürfen ähnlich sein, aber nicht deckungsgleich (Fehler ab 0,97).

Ähnlichste unverwandte Paare im Endstand:

| Paar | IoU | höhennormiert |
|---|---|---|
| Barbaren ↔ Ritter (Held) | 0,80 | 0,80 |
| Eisgolem (Held) ↔ Ritter (Held) | 0,80 | 0,81 |
| Bowler ↔ Koboldriese | 0,80 | 0,74 |
| Barbaren ↔ Eisgolem (Held) | 0,79 | 0,77 |
| Magieschütze ↔ Geisterkaiserin (zu Fuß) | 0,79 | 0,82 |
| Goblin Demolisher ↔ Jäger | 0,79 | 0,78 |

Alle sechs Paare liegen im Farbschema weit auseinander (Abstand 21–58, Schwelle 8) und haben verschiedene Signatures, z. B. Wolfskopf-Kapuze ↔ Löwenmähnen-Kragen mit Heldenumhang oder Eiskrone ↔ Löwenmähnen-Kragen.

Verwandte Paare: Am nächsten liegen Ballon ↔ Ballon als Held (0,96), Musketierin ↔ Held (0,95) und Walküre ↔ Held (0,95). Vor Runde 1 waren Magieschütze ↔ Held (1,00) und Ballon ↔ Held (0,99) deckungsgleich.

### 4.2 Farben

- **Geplante Farben:** 0 Verstöße gegen die Farbregeln (Team-Abstände, Familie, alle Paare) und 0 gegen die Matrix-Regeln.
- Engste unverwandte Farbschemata: Ballon ↔ Mönch 8,4, Kobolde ↔ Skelettfass 9,2, Riese ↔ Koboldbohrer 9,3 (Schwelle 8).
- **Gerendert:** Gemessen wird der Anteil der Eigenfarbfläche (ohne Kontur und Teamzonen), der höchstens ΔE2000 10 von der Materialrampe der Hauptfarbe entfernt liegt.
  - Median 62 %, Minimum 15,3 % (Holzfäller), Schwelle 15 %.
  - Akzentfarbe: Median 9,1 %.
  - 11 Figuren zeigen ihre Akzentfarbe im Ruhebild kaum, sie steckt in Effekten und Angriffsposen (Hinweis, siehe Grenzen).

### 4.3 40-px-Test

Jede Figur wird 40 px hoch auf Arena-Gras gerendert, einmal mit und einmal ohne ihre Signature-Teile (`data-sig`).

- Die sichtbar veränderte Fläche liegt im Median bei **22 %** der Figur, das Minimum bei 26 px.
- Unter 4 % liegen nur Signatures, die absichtlich klein sind: der winzige Melonenhut des Bowlers, die Uhrwerk-Bombe im Brustkorb des Riesenskeletts, der Wolfsschädel über dem Tor der Barbarenhütte, die Kolbenfaust der Goblin Machine und die Astgabel-Schleuder der Rabaukin.
- Bogen aller Figuren: [char_check/small40.png](char_check/small40.png).

### 4.4 Teams

- **Teamfläche** (Pixel, in denen sich Blau und Rot unterscheiden): 3–23 %, Median 7 %. Grenze 25 %.
- **Teamsymbol:** im Ruhebild mindestens 11 px groß (Spielgröße bei doppelter Pixeldichte). In Graustufen unterscheiden sich Kreis und Dreieck auf mindestens 8 px.
- **Graustufen:** Blau `#3d8bff` und Rot `#ff4d57` sind fast gleich hell. In Graustufen trägt deshalb nur die Form die Information (Symbol und Bodenring), so wie in CHAR_SYSTEM.md §6 vorgesehen.
- **Farbenblind-Modus:** Das Teamsymbol wächst jetzt tatsächlich um den Faktor 1,5 (gemessen mindestens 1,63-fach). Vor Runde 1 stand das nur im Konzept, die Laufzeit setzte es nicht um.
- **Fehlsichtigkeit** (Machado 2009, Schweregrad 1): Unterscheidbar bleiben mindestens 89 % der Teamfläche (Protanopie), 94 % (Deuteranopie) und 89 % (Tritanopie).
- Bogen: [char_check/team.png](char_check/team.png). Er zeigt je Figur Blau, Rot, beide in Graustufen, beide unter Deuteranopie und Rot mit Farbenblind-Modus.

### 4.5 Animationen

- **Gebacken wie im Spiel:** 8760 Bilder aller Zustände (Basis, Evo, Formen). Kein Bild ist am Rand abgeschnitten.
- **Unstetigkeiten:** 81 575 fein abgetastete Posen (64 je Zustand) ohne Rastern.
  - Ein Teil, das zwischen zwei Schritten weit wandert, wird per Halbierung eingegrenzt. So trennt das Skript echte Sprünge von schnellen, aber stetigen Schlägen.
  - Endstand: kein Sprung.
- **Füße:** Bodenfiguren stehen in Ruhe am Fußpunkt, sinken in keinem Zustand ein und berühren in Ruhe und beim Laufen den Boden.
- **Hinweise (34):**
  - 32 Zustände beginnen weit weg von der Ruhepose. Das betrifft vor allem Betäubt-Posen mit hängender Waffe und den Bowler als Held, dessen Ruhepose den Felsen über dem Kopf stemmt.
  - 2 Figuren stehen nicht mittig über dem Fußpunkt: die Bogenschützen-Königin (weit ausgestellter Bogen) und der Rammbock (Fahrzeug).
  - Zustandswechsel werden ohne Überblendung geschnitten, so wie im Konzept vorgesehen.

### 4.6 Eigenständigkeits-Review

`docs/char_check.md` Abschnitt 8 enthält **einen Satz pro Figur** (Signature, übertriebenes Merkmal, Haltung) mit dem nächsten unverwandten Nachbarn nach Silhouette und nach Farbschema.

„generisch?“ markiert eine Figur nur, wenn zwei Bedingungen zusammenkommen:
- Ihre Silhouette liegt nah an einer anderen Figur (IoU ≥ 0,70).
- Zusätzlich sind die Farben ähnlich (Schema < 15) oder die Signature ist bei 40 px schwach.

Die gleiche Familie allein zählt nicht, Familien teilen ihre Grundform absichtlich. In Runde 0 und 1 zählte sie noch mit. Dadurch waren 57 bzw. 51 Figuren markiert, fast alle nur wegen ihrer Familie.

Endstand – 9 Markierungen, mit Bewertung:

| Figur | Signal | Bewertung |
|---|---|---|
| Bowler, Bowler (Held) | kleine Signature (Melonenhut bzw. Kegelkrone), Silhouette nah an Koboldriese bzw. Elektroriese | eigenständig: Moos-Buckel mit Zacken und Runenkugel prägen die Silhouette |
| Riesenskelett | kleine Signature (Bombe im Brustkorb) | eigenständig: Knochenkörper mit abgespreizten Armen, eigene Farbe |
| Goblin Machine | kleine Signature (Kolbenfaust) | eigenständig: Pilot unter Glaskuppel, Wimpel |
| Barbarenhütte | kleine Signature (Wolfsschädel über dem Tor) | Bauwerk-Familie; unterscheidet sich durch das tief heruntergezogene Grassodendach und die Langhausform |
| Rabaukin | kleine Signature (Astgabel-Schleuder) | Winzig-Familie; erkennbar an den hochfliegenden Zöpfen und eigenen Farben |
| Eismagier ↔ Goblinstein | Silhouette 0,75 und Schema 11,4 | grenzwertig: beide hell gekleidet; Eismagier mit Schneekugel-Stab und Eiszapfen-Bart, Goblinstein mit Schweißerbrille und Fernsteuerkasten. Kandidat für die nächste Runde |
| Skelett-Fallschirmjäger ↔ Turmwache | Silhouette 0,77 und Schema 10,9 | grenzwertig, aber im Spiel getrennt: Die Turmwache steht nur auf dem Turm. Kandidat für die nächste Runde |

## 5. Iterationsrunden

| Prüfung | Runde 0 (Fehler) | nach Runde 1 | nach Runde 2 (Endstand) |
|---|---|---|---|
| Silhouette | 22 | 5 | **0** |
| Farbe | 5 | 5 | **0** |
| 40 px | 4 | 0 | **0** |
| Team | 153 | 3 | **0** |
| Animation | 88 | 0 | **0** |
| Performance | – | – | 2 (Umgebung, siehe 6) |

Hinweise zu Runde 0: Gemessen mit der ersten Fassung des Prüfskripts. Die Regel „verwandt, aber deckungsgleich“ und das Animationsfeld `ground: false` kamen erst in Runde 1 dazu.

### Runde 1

**Laufzeit:**
- Teamsymbol im Farbenblind-Modus tatsächlich 1,5-fach.
- Teamsymbol in jeder Detailstufe sichtbar. Vorher fehlte es kleinen Figuren in Spielgröße ganz.
- Landung beim Erscheinen stetig (83 Sprünge in allen Zweibeinern und Vierbeinern).
- Schleifen nahtlos (Barbarenhütte, Skelettkönig, Megaritter).

**Teamsymbol** sichtbar platziert oder vergrößert: Magieschütze, Widderreiterin, Mönch, Drei Musketierinnen, Tunnelgräber, Barbaren, Kobolde, Feuer-, Heilungs- und Elektrogeist, Skelettdrachen, Geisterkaiserin (Luft).

**Teamzonen** vergrößert:
- Phönix (Fußring mit Bändern), Skelettdrachen (Halsband mit Wimpel), Elektrogeist (Steckerkappe)
- Golem, Golemit, Goblinstein, Infernodrache
- Lakaien, Megalakai, Minion Giant
- Königsgeist, Königsschweinchen (Königsmäntelchen), Verdächtiger Busch, Geisterkaiserin

**Signature-Teile markiert:** Dunkler Prinz (Waran), Flugmaschine (Flügel), Ofen (Ofenklappe), Scharfrichter (Sichelaxt).

**Helden** mit eigener Silhouette: Magieschütze (Sternmantel), Ballon (Fallschirmbündel), Riese (weit ausschwingender Steppdecken-Umhang).

**Silhouetten der Familie Massig:**
- Megaritter: Kugelfäuste und Schulterdornen
- Bowler: Troll-Buckel und große Kugel
- Runenriese: Stele über dem Kopf
- Elektroriese: Spulentürme
- Riesenskelett: abgespreizte Arme
- Goblinstein-Monster: Akku

**Weitere Silhouetten:** Fluch-Schwein (Hexenhut), Koboldkäfig (Schloss, Ring), Boss Bandit (Beutesack), Ronin (breitere Hutkrempe).

### Runde 2

**Hauptfarbe sichtbar gemacht:**
- Holzfäller: lange Hemdsärmel, Arbeitshose im Schattenton, Knieflicken, helleres Karo
- Little Prince: Pluderhose und längerer Samtrock
- Prinz: Rossharnisch im Froschgrün
- Musketierin und Held: lange Schöße
- Blasrohrkobold: größerer Lendenschurz

**Teamzonen:** Boss Bandit, Fluch-Schwein (Hutband mit Bandende), Megaritter (Helmbänder), Golemit (zweites Armband). Teamsymbol größer bei Blasrohrkobold und Lavawelpe.

**Silhouetten:**
- Goblinstein-Monster: Akku tiefer, seitliche Halsbolzen, Riesenhand bis zum Boden
- Bowler: Kugel auf Bauchhöhe
- Koboldkäfig: schlanker, hoher Vogelkäfig
- Golemit: breites Kapitell
- Megaritter: abgespreizte Arme
- Riese als Held: hohe Ährenkrone

**Laufzeit-Performance** (Abschnitt 6): Bau-Budget nach Bildrate mit Guthaben, Detailstufe 1 erst ab 60 px, zwischengespeicherte Tiefen-Pfade, Notbild aus dem nächstgelegenen Bild desselben Zustands, Schlüsselbilder zuerst.

**Sonstiges:** `look.image` aus skin.json ersetzt wieder Figur und Kartenbild. Beim Umbau der Integration war das verloren gegangen.

## 6. Performance vorher/nachher

**Messaufbau:**
- Chromium 141 ohne GPU (Software-Rasterung) in derselben Umgebung.
- „vorher“ ist der Stand vor dem Neubau (Commit `948cf20`, alter Figuren-Baukasten), „nachher“ der Endstand.
- Beide Stände spielen dieselbe aufgezeichnete Szene ab; Protokoll und Server sind unverändert.

**Szene des Prüfskripts** (`tools/characters/check-perf.mjs`): 60 Einheiten aus 60 verschiedenen Figuren in drei Wellen, dazu 12 Zauber, 14 s, automatische Qualität an.

| Stand | Profil | FPS | p95 | Long Tasks | automatische Qualität am Ende |
|---|---|---|---|---|---|
| vorher | Desktop 1440×900, CPU 1× | 43 | 33 ms | 1 | Effekte 0,4 |
| nachher | Desktop 1440×900, CPU 1× | 42 | 33 ms | 11 | Effekte 0,4, Figuren Mittel |
| vorher | Handy 390×844, DPR 2, CPU 4× | 13 | 117 ms | 489 | Auflösung 1, Effekte 0,4 |
| nachher | Handy 390×844, DPR 2, CPU 4× | 14 | 100 ms | 430 | Auflösung 1, Effekte 0,4, Figuren Niedrig |
| nachher | Lasttest CPU 8× | 6 | – | – | 20 Absenkungen, Figuren Niedrig |

**Extremszene** (`tools/bench/run.mjs`, bis 222 Entitäten, Schwärme, viele Zauber, Turmfall):

| Stand | Desktop CPU 1× | Handy CPU 4× | Zeichenaufrufe/Frame (Desktop) | Heap Desktop |
|---|---|---|---|---|
| vorher | 44 FPS | 14 FPS | 889 | 16,1 MB |
| nachher | 40 FPS | 14 FPS | 862 | 71,1 MB |

**Bewertung:**
- **Zielwerte nicht erreicht:** Desktop 60 FPS und Handy gedrosselt 30 FPS schafft hier keiner der beiden Stände. Die Grenze setzt die Software-Rasterung: Auch der alte Stand braucht rund 16 ms pro Frame allein für Rastern und Zusammensetzen im Browser. Auf echter Hardware mit GPU war das nicht messbar.
- **Gleichstand mit dem alten Stand:** Der Neubau erreicht im Rahmen der Messschwankung (±3 FPS zwischen Läufen) dieselben Werte, im Handy-Profil der Prüfszene sogar etwas mehr.
- **Automatische Qualität:** Sie senkt unter Last zuerst Auflösung und Effektmenge, dann die Figuren-Stufe (Hoch → Mittel → Niedrig) und hebt sie bei flüssigem Lauf wieder an. Das Prüfskript prüft das im Lasttest.
- **Speicher:** Der Heap ist höher (Atlasseiten, Vektorquellen von 130 Figuren). Das Atlas-Budget ist auf 12/24/48 MB je Stufe begrenzt.

**Verlauf der Optimierung in Runde 2** (Prüfszene, Desktop, ohne automatische Qualität):

| Schritt | FPS | Figuren-JS pro Frame |
|---|---|---|
| Stand nach Runde 1 | 33 | 10,3 ms |
| Bau-Budget nach Bildrate, Detailstufe 1 ab 60 px | 38 | 6,7 ms |
| Tiefen-Pfade zwischengespeichert, Glanz nur ab 5 × 5 px | 38 | 6,4 ms |
| Guthaben-Budget, Schlüsselbilder zuerst, nächstes Bild desselben Zustands als Notbild | 40–42 | 3,3–4,2 ms |

Weitere Messungen:
- Ein Bild zu backen kostet in Spielgröße 1,2 ms (Detailstufe 0) bis 2,6 ms (Stufe 1). Gezeichnet wird danach mit einem `drawImage` pro Einheit.
- Aus dem Pilot: Atlasseiten von 2048² kosteten in der Extremszene 30–60 ms pro Frame, weil der Browser bei jedem Schreiben die ganze Seite neu hochlädt. Deshalb sind die Seiten 512² groß.

## 7. Bekannte Grenzen

- **Performance-Ziele** (60/30 FPS) sind nur ohne GPU gemessen und dort nicht erreicht, siehe Abschnitt 6.
- **Viele neue Figuren auf einmal:** Tauchen sehr viele verschiedene Figuren gleichzeitig zum ersten Mal auf (Prüfszene: 60 in 3 s), zeigen sie für einige Sekunden weniger Animationsbilder. Die Laufzeit nimmt das nächstgelegene schon gebackene Bild, bis alle gebacken sind. In normalen Matches backt das Spiel die Figuren des eigenen Decks (Ruhe, Laufen, Erscheinen) im Ladebildschirm vor; die Figuren des Gegners entstehen beim ersten Auftauchen.
- **Akzentfarben:** Bei 11 Figuren ist sie im Ruhebild kaum sichtbar, sondern erscheint in Effekten, Angriffs- oder Fähigkeitsposen: Ballon (Held), Bomber, Fluch-Schwein, Dunkler Prinz (Held), Elektroriese, Elektrogeist, Flugmaschine, Nachthexe, Runenriese, Mauerbrecher-Läufer, Hexe. Die geplanten Farbregeln erfüllen sie trotzdem.
- **Teamsymbol in Spielgröße:** Bei einfacher Pixeldichte ist es nur wenige Pixel groß. Die Teamzugehörigkeit tragen dort vor allem Bodenring (Kreis/Zacken) und Teamzonen. Im Farbenblind-Modus ist das Symbol 1,5-fach.
- **Ähnliche Silhouetten:** 283 Paare liegen zwischen IoU 0,70 und 0,80, meist innerhalb einer Familie. Zwei Paare sind in der Review als grenzwertig markiert (4.6).
- **Zustandswechsel ohne Überblendung:** Hinweise beim Einstieg aus der Ruhe, vor allem beim Bowler als Held (Stemm-Pose).
- **Messbasis Runde 0:** Die Zahlen stammen aus der ersten Fassung des Prüfskripts (siehe 5).
- **Korrektur zu Commit `59349ff`:** Dessen Nachricht nennt 20 Figuren, deren Manifest-Box leer war. Richtig sind **15**: Elektrogeist, Elixierklecks, Elixiergolemit, Feuergeist, Golemit, Heilungsgeist, Eisgolem, Eisgolem (Held), Lavahund, Lavawelpe, Skelettfass, Skelettdrachen, Schneemann, Seelensoldat, Verdächtiger Busch. Ursache war `F.box`, das zustandsgebundene Teile übersprang.

## 8. Neue Figur hinzufügen

1. **Brief und Matrix:**
   - In `tools/characters/figures.mjs` eine Zeile in `FIGURES` anlegen: `id` = Spieltyp, Familie, Höhe, Haupt- und Akzentfarbe, Signature-Kategorie und -Text, Teamzonen, Proportionen, übertriebenes Merkmal, Stimmung, Idle, Angriff; bei Helden `base`.
   - `node tools/characters/gen-docs.mjs` schreibt Brief (`docs/briefs/<id>.md`), Matrix und `system.json` und prüft alle Farb- und Matrix-Regeln.
   - Bei Verstößen Farben oder Signature ändern, bis „keine Regelverstöße“ erscheint.
2. **SVG-Teile:** In `tools/characters/figures/<id>.mjs` eine Funktion `export default function (F)` schreiben.
   - Skelett mit `F.rig(vorlage, drehpunkte)`.
   - Teile mit `F.part(name, { bone, z, zb, … }, (g) => …)`. Die Flags sind in CHAR_SYSTEM.md §9.2 beschrieben: `team`, `sig`, `glow`, `outline: false`, `state`, `lod`, `view`, `evo`, `form`, `variant`.
   - Teamsymbol mit `emblem(F, …)` aus `kit.mjs`.
   - Animationen mit `F.anim({ … })`: Programme aus `anim.js` plus eigene Keyframes, optional `rest` und `ground: false`.
   - Geometrie aus `geo.mjs`, Materialien über `g.mat(form, farbe, material)`.
   - Anker ist die Fußmitte (0, 0), 1 Feld = 50 mu, die Figur schaut nach rechts.
3. **Manifest:**
   - `node tools/characters/build.mjs <id>` erzeugt `client/assets/characters/<id>/<id>.svg` und den Manifest-Eintrag (Box, LP-Balken, Trefferpunkt, Zustände, Evo, Formen).
   - Spieltypen mit anderem Namen (Formen) kommen in `FORM_LOOKS` bzw. `roster.mjs → FORMS`, Spawner-Gebäude in `SPAWNER_BUILDINGS`.
   - Zum Ansehen: `node tools/characters/lab.mjs <id> --states idle,walk,attack --frames 6 --out /tmp/x.png` und `node tools/characters/contact.mjs <id> --out /tmp/cs.png`.
4. **Prüfskript:**
   - `node tools/characters/check.mjs --ids <id>,<ähnliche Figuren> --skip perf` für den schnellen Blick.
   - Danach `npm run check:characters` für alle Paare und das Contact Sheet.
   - `npm test` prüft, dass jeder Spieltyp eine Figur mit gültiger Box hat (`test/characters.test.js`).
