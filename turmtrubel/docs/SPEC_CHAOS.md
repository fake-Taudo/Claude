# MASTER-PROMPT: Neuer Modus "Chaos" (Modifikator-Kampf) für Turm Trubel

## 0. Rolle, Ziel, Rahmen
Du bist Lead Gameplay Designer und Gameplay Engineer für "Turm Trubel" (Echtzeit-Strategie-Kartenspiel im Browser, Node.js-Server mit WebSocket, HTML5-Canvas-Frontend, Einladungscode-Lobby, autoritative Server-Simulation mit festem Tick, Kartendaten in cards.json, modes.json aus einer früheren Erweiterung, alle Karten freigeschaltet). Deine Aufgabe ist eine Erweiterung um einen neuen Modus namens **"Chaos"**, spielbar im Multiplayer (per Einladungscode) und im Einzelspieler gegen Bots.

**Grundidee des Modus:** Ein normales 1v1-Match auf einem eingeschränkten Kartenpool, bei dem während des Kampfes mehrmals kurz pausiert wird und jeder Spieler aus 2 zufälligen Verstärkungen ("Perks") eine für eine seiner Karten wählt. Jede Karte im Pool hat drei mögliche Perk-Stufen (Gewöhnlich, Selten, Episch), die ihr Verhalten deutlich verändern, aber die Elixierkosten unverändert lassen. Gewählte Perks gelten für den Rest des Matches.

**Ausdrücklich NICHT Teil dieser Aufgabe:**
- Keine Bann- oder Abstimmungs-Mechanik für Karten.
- Kein Kopieren von Namen, Werten oder Effekten aus einem bestehenden kommerziellen Spiel. Alle Perks sind eigene Erfindungen für "Turm Trubel".
- Perks gibt es nur für die Karten im Chaos-Kartenpool, nicht für alle Karten des Spiels.

**Besonderheit dieses Auftrags:** Die Perks denkst du dir nicht allein aus. Du führst mich in Phase 3 als Interview Karte für Karte durch die Perk-Auswahl: Du machst Vorschläge, ich entscheide.

Unveränderlich: Der bestehende klassische Modus, alle anderen bereits vorhandenen Modi, Kartenwerte außerhalb des Chaos-Modus, bestehende Tests, das bestehende Netzwerkprotokoll (nur erweitern, nicht brechen). Neue Screens nutzen das vorhandene Designsystem und VFX-System. Eigene Grafiken, keine fremden Assets.

## 1. Phase 1: Audit (zuerst, vor jeder Änderung)
Erstelle `docs/CHAOS_AUDIT.md`:
1. Wie ist das bestehende Mode-Framework aufgebaut (modes.json, Draft-Phasen-Logik, Lobby-Erweiterung für Modi)? Falls es noch kein Mode-Framework gibt: kurz dokumentieren, wie Match-Start, Lobby und Einladungscode aktuell funktionieren, und ein einfaches Framework als Teil dieser Aufgabe mitbauen.
2. Vollständige Liste aller Karten aus cards.json (Name, ID, Typ, Rolle, Elixirkosten, Seltenheit, alle relevanten Werte: Leben, Schaden, Angriffsgeschwindigkeit, Reichweite, Laufgeschwindigkeit, Spawn-Anzahl, Zieltyp, Besonderheiten). Diese Liste ist die Grundlage für Phase 3.
3. Wie ist die Server-Simulation aufgebaut (Tick-System, Zustandsverwaltung pro Einheit, Fähigkeiten-Hooks, Event-System für VFX)? Wie leicht lassen sich Kartenwerte und -verhalten zur Laufzeit pro Match verändern, ohne die globale cards.json zu berühren?
4. Wie funktionieren Türme, Lebenspunkte, Elixier-Regeneration, Match-Timer, Verlängerung aktuell genau, und wo sind diese Werte definiert?
5. Netzwerkprotokoll: vorhandene Nachrichtentypen, Snapshot-Struktur, Reconnect-Logik, Pausier-Mechanismen.
6. Liste der notwendigen Änderungen pro Datei und Risiken (insbesondere: Wie wird eine serverseitige "Spielpause mit Auswahlfenster" sauber in den festen Tick eingebaut, ohne Zeitmessung und Elixierzähler zu verfälschen?).
Zeige mir eine kurze Zusammenfassung, dann starte direkt mit Phase 3 (Interview), damit die Perk-Auswahl nicht auf die technische Umsetzung warten muss.

## 2. Phase 2: Match-Rahmen des Chaos-Modus
- **Kartenpool:** Teilmenge aller Karten in `chaos.json` im Feld `cardPool` (festgelegt in Phase 3.1, 30 bis 40 Karten). Nur Karten aus diesem Pool sind im Chaos-Modus wählbar (Deckbau und Bots). Champions und Helden dürfen im Pool enthalten sein (maximal 1 Champion und maximal 1 Held pro Deck bleibt Pflicht).
- **Einheitliches Kartenlevel:** Alle Karten laufen im Chaos-Modus auf einem festen, konfigurierbaren Level (Feld `fixedLevel`), unabhängig vom sonstigen Fortschritt.
- **Turm-Multiplikator:** Lebenspunkte aller Türme (Prinzessin und König) werden mit einem konfigurierbaren Faktor multipliziert (Standard `towerHpMultiplier: 2`).
- **Elixier-Multiplikator:** Elixier-Regeneration läuft mit einem konfigurierbaren Faktor schneller (Standard `elixirRateMultiplier: 1.5`, also 50 % schneller). Bestehende Doppel-/Dreifach-Elixier-Phasen bleiben zusätzlich aktiv und multiplizieren sich mit diesem Faktor.
- **Match-Dauer:** Reguläre Matchdauer und Verlängerung wie im klassischen Modus. Die Serverzeit für Auswahlpausen läuft on top und wird separat angezeigt ("Spielzeit" vs. "Auswahlpause"). Die Pause läuft für beide Spieler synchron, die Spielzeit steht währenddessen still.

## 2b. Perk-Auswahl während des Matches
- **Auswahlrunden:** Konfigurierbare Anzahl pro Match (Feld `rounds`, Standard 5). Die erste Runde kommt nach einer konfigurierbaren Verzögerung ab Matchstart (Standard 45 Sekunden), danach im selben Intervall. Die letzte Runde gibt es nur, wenn die Verlängerung erreicht wird, sonst entfällt sie ersatzlos.
- **Ablauf einer Auswahlrunde:**
  1. Der Server pausiert die Simulation für beide Spieler synchron (keine Platzierungen möglich, laufende Animationen frieren sichtbar ein).
  2. Für jeden Spieler separat wählt der Server zufällig eine Karte aus dem aktuellen Deck des Spielers, die in diesem Match noch keinen Perk hat, und bietet dafür zwei zufällige, unterschiedliche Perk-Optionen an (Seltenheits-Staffelung siehe unten). Hat ein Spieler keine perk-freie Karte mehr, überspringt der Server die Runde für ihn, ohne den Gegner zu verzögern.
  3. Jeder Spieler sieht nur seine eigenen zwei Optionen.
  4. Auswahlzeit: konfigurierbar (Feld `pickTimeSeconds`, Standard 6 Sekunden). Bei Ablauf entscheidet der Server zufällig zwischen den zwei angebotenen Optionen.
  5. Der gewählte Perk gilt sofort und für den Rest des Matches für genau diese Karte dieses Spielers (nicht für den Gegner, auch wenn er dieselbe Karte hat).
  6. Die Simulation läuft weiter, sobald beide gewählt haben oder ihre Zeit abgelaufen ist.
- **Seltenheits-Staffelung** (serverseitig gewürfelt, in chaos.json konfigurierbar, jede Option unabhängig gewürfelt):
  - Runde 1: 90 % Gewöhnlich, 10 % Selten, 0 % Episch.
  - Runde 2: 20 % Gewöhnlich, 80 % Selten, 0 % Episch.
  - Runde 3: 0 % Gewöhnlich, 50 % Selten, 50 % Episch.
  - Runde 4: 0 % Gewöhnlich, 20 % Selten, 80 % Episch.
  - Runde 5 (nur Verlängerung): 100 % Episch.
- **Reconnect während einer Auswahlrunde:** Verbleibende Zeit und angebotene Optionen werden exakt wiederhergestellt. Bei dauerhaftem Abbruch gelten die bestehenden Abbruch-Regeln.
- **UI der Auswahlrunde:** Knappes Overlay mit beiden Optionen groß nebeneinander (Karte, Perk-Name, Beschreibung), Countdown-Ring, Antippen zum Wählen, kurze Bestätigungs-Animation. Die Arena bleibt leicht sichtbar. Im Kampf bekommt jede Karte mit aktivem Perk ein kleines Abzeichen (Seltenheitsfarbe: Gewöhnlich Grau, Selten Bronze, Episch Lila), antippbar für die volle Beschreibung.

## 3. Phase 3: Perk-Design als Interview (Karte für Karte, ich entscheide)

Dies ist der wichtigste interaktive Teil. Du machst mir zu jeder Karte im Pool konkrete Vorschläge, und ich wähle aus. Nutze dafür das Fragewerkzeug (AskUserQuestion), damit ich per Antippen antworten kann.

### 3.1 Kartenpool festlegen
1. Schlage anhand der Kartenliste aus Phase 1 einen Pool von 30 bis 40 Karten vor, mit guter Mischung der Rollen (Tanks, Nahkämpfer, Fernkämpfer, Schwärme, Flieger, Belagerer, Zauber, Gebäude, Champion/Held falls vorhanden). Zeige ihn gruppiert nach Rolle.
2. Frage mich per Fragewerkzeug: Pool übernehmen, einzelne Karten tauschen (ich nenne sie), größer oder kleiner machen.
3. Nach meiner Freigabe schreibst du den Pool in `chaos.json`.

### 3.2 Das Interview: eine Runde pro Karte
Für JEDE Karte im Pool genau EINE Frage-Runde (insgesamt also etwa 30 bis 40 Runden). Jede Runde ist ein Aufruf des Fragewerkzeugs mit **drei Fragen**: eine für den gewöhnlichen, eine für den seltenen, eine für den epischen Perk dieser Karte. Jede der drei Fragen hat **genau drei Optionen** (drei verschiedene Perk-Vorschläge). Ich habe zusätzlich immer die Möglichkeit, eine eigene Idee einzutippen.

Format jeder Runde:
- **Kopf der Frage:** Kartenname, Rolle, Elixier und die wichtigsten Werte der Karte in einer Zeile, dazu Fortschritt (z. B. "Karte 7/36"), danach die Stufe ("Gewöhnlicher Perk?" / "Seltener Perk?" / "Epischer Perk?").
- **Jede Option:** Kurzer Perk-Name als Titel (1 bis 5 Wörter), in der Beschreibung ein Satz, der konkret sagt, was sich ändert, mit der wichtigsten Kernzahl und der Mechanik-Kategorie in Klammern (z. B. "(statBoost) +30 % Reichweite").
- **Empfehlung:** Die Option, die du am besten findest, steht zuerst und trägt den Zusatz "(Empfohlen)".
- **Reihenfolge der Karten:** Nach Rolle oder Elixierkosten gruppiert, damit thematisch zusammenhängende Karten hintereinander kommen.

Regeln für deine Vorschläge:
- Die drei Optionen einer Stufe unterscheiden sich echt voneinander (andere Wirkung oder andere Mechanik-Kategorie), keine drei Varianten derselben Zahlenänderung.
- Gewöhnlich: spürbar, aber moderat. Selten: deutlich stärker oder taktisch neu. Episch: stark verändernd mit hohem Wow-Effekt, aber spielbar und nicht automatisch unfair spielentscheidend.
- Die Perks passen zur Rolle der Karte (Tank eher Zähigkeit, Reichweite oder Stoßwelle; Fernkämpfer eher mehr Schüsse, Reichweite oder Spezialmunition; Schwarm eher mehr oder stärkere Einheiten; Zauber eher Zusatzeffekt oder Nachwirkung; Gebäude eher veränderte Spawn-Logik oder Angriffsverhalten).
- Elixierkosten bleiben bei jedem Perk unverändert.
- Jeder Vorschlag muss mit den Bausteinen aus Phase 4 technisch umsetzbar sein. Keine Endlosschleifen, kein Server-Überlastungsrisiko, keine unblockbare Garantie-Sieg-Mechanik.
- Champions und Helden: Perks beziehen sich auf ihre aktive Fähigkeit oder ihre Statur, nicht auf eine zweite komplett neue Fähigkeit obendrauf.
- Alle Vorschläge sind eigenständige Erfindungen für "Turm Trubel", keine Übernahme aus anderen Spielen.
- Sorge für Vielfalt im ganzen Pool: Dieselbe Grundidee (z. B. "mehr Reichweite") soll nicht bei vielen Karten wiederkehren.

### 3.3 Nach jeder Antwort (Speichern und Fortschritt)
1. Formuliere die gewählten Perks vollständig aus (Felder siehe 3.5) und speichere sie sofort in `chaos_perks.json`.
2. Aktualisiere `docs/CHAOS_PERK_PROGRESS.md` (Karte erledigt, gewählte Perk-Namen je Stufe, offene Karten).
3. Frage nichts doppelt. Bei Abbruch oder Neustart liest du den Fortschritt und machst bei der nächsten offenen Karte weiter.

### 3.4 Sonderfälle
- **Eigene Idee** (Freitext von mir): Übernimm sie. Bei echten Unklarheiten stelle höchstens eine Rückfrage, dann formuliere sie vollständig aus.
- **Abkürzung:** Sage ich "Rest automatisch" (oder sinngemäß), wählst du für alle noch offenen Karten jeweils die empfohlene Option und markierst diese Karten im Bericht als "automatisch gewählt".
- **Ich bin nicht erreichbar** (unbeaufsichtigte Sitzung): Nimm für die offene Karte die empfohlene Option, markiere sie als "automatisch gewählt" und mache weiter.
- **Technisch unmöglich:** Stellt sich nachträglich heraus, dass ein gewählter Perk mit den vorhandenen Bausteinen nicht sauber umsetzbar ist, erkläre kurz warum und schlage mir zwei Ersatzvarianten zur Auswahl vor.

### 3.5 Felder pro Perk (nach der Auswahl vollständig auszufüllen)
- `cardId`: Referenz auf die Karte.
- `rarityTier`: `common` | `rare` | `epic`.
- `name`: Perk-Name (eigene Wortschöpfung).
- `description`: Ein Satz, der exakt beschreibt, was sich ändert.
- `mechanicType`: `statBoost` | `behaviorChange` | `newAbility` | `spawnChange` | `visualOnly`.
- `effectParameters`: Vollständige, konkrete Parameter für die Umsetzung (z. B. `{"damageMultiplier": 1.3}` oder `{"extraProjectiles": 2, "spreadDegrees": 15}` oder `{"onDeathEffect": "spawnSkeletons", "count": 3}`). Keine vagen Angaben, immer konkrete Werte oder Regeln.
- `elixirCostUnchanged`: immer `true`.
- `balanceNote`: Ein Satz, der erklärt, warum der Perk zur Seltenheitsstufe passt.

### 3.6 Abschluss des Interviews
1. Erzeuge `docs/CHAOS_PERKS_OVERVIEW.md`: pro Karte alle drei gewählten Perks (Name, Beschreibung, Kernzahlen) übersichtlich.
2. Zeige mir die Gesamtübersicht kurz und frage in einer letzten Runde, ob ich freigebe oder einzelne Karten noch einmal neu durchgehen will.
3. Erst nach meiner Freigabe beginnt Phase 4.

## 4. Phase 4: Technische Umsetzung der Perks
- Baue ein generisches Perk-Anwendungssystem in der Simulation: Beim Zuweisen eines Perks an eine Karteninstanz eines Spielers werden die `effectParameters` auf eine Matchkopie der Basiswerte angewendet, ohne die globale cards.json zu verändern.
- Die Mechanik-Kategorien werden als wiederverwendbare Bausteine implementiert, nicht als Einzelcode pro Karte:
  - `statBoost`: generische Multiplikatoren und Additionen auf vorhandene Felder (Schaden, Leben, Reichweite, Angriffsgeschwindigkeit, Laufgeschwindigkeit).
  - `behaviorChange`: austauschbare Zielwahl- oder Bewegungsmodule (z. B. "nur Gebäude" wird zu "alles", "nur Boden" wird zu "auch Luft").
  - `newAbility`: Hook-System für Zusatzeffekte bei `onSpawn`, `onAttack`, `onHit`, `onDeath`, `onPeriodicTick`, das bestehende Effekt-Bausteine (Flächenschaden, Statuseffekt, Zusatz-Spawn) wiederverwendet.
  - `spawnChange`: veränderte Anzahl, Art oder Formation gespawnter Einheiten bei Platzierung oder Tod.
- Der Server validiert bei jeder Perk-Wahl, dass die Option tatsächlich angeboten wurde, und sendet den neuen Kartenzustand an beide Clients. Der Gegner sieht, dass ein Perk gewählt wurde und welcher sichtbare Effekt dazugehört, nicht zwingend die internen Zahlen.
- VFX-Hooks: Jede Perk-Anwendung löst eine kurze, unterscheidbare visuelle Kennzeichnung aus, damit man auch ohne Tooltip erkennt, dass eine Karte verändert ist.

## 5. Phase 5: UI, HUD und Grafik
- Menü: Modus-Kachel "Chaos" im bestehenden Modi-Menü (Icon, Name, kurze Erklärung), Info-Screen beim ersten Mal pro Spieler (Pool, Perks, Ablauf), danach abschaltbar.
- Deckbau für Chaos: Nur Karten aus `cardPool`, sonst identische Bedienung (Filter, Suche, Champion-/Helden-Regel, Elixier-Durchschnitt).
- Match-HUD: Perk-Auswahl-Overlay (Phase 2b), Perk-Abzeichen auf Handkarten und platzierten Einheiten mit aktivem Perk (Seltenheitsfarbe), dezenter Glow an Einheiten mit epischem Perk.
- Turm-Anzeige: Deutliche Kennzeichnung der erhöhten Lebenspunkte (z. B. verlängerte Lebensleiste oder "x2"-Symbol).
- Ergebnisbildschirm: Zusammenfassung "Deine gewählten Perks" mit Name und Seltenheit je Karte.
- Alle neuen Screens im bestehenden Design- und VFX-System, mobil und Desktop (Hoch- und Querformat), Touch-Zielgröße mindestens 44 px.

## 6. Phase 6: Bots (Einzelspieler)
- Bots sind im Chaos-Modus auf allen vorhandenen Schwierigkeitsstufen spielbar.
- Bot-Deckbau: ausschließlich aus `cardPool`, nach vorhandener Bot-Deckbau-Logik bzw. ausgewogener Elixier-Kurve und Rollenmischung.
- Bot-Perk-Wahl: Leicht wählt zufällig. Mittel bevorzugt `statBoost` und `spawnChange` mit klar positivem Wert für die aktuell wichtigste Rolle. Schwer bewertet zusätzlich Mechanik-Kategorie und `balanceNote` und wählt situativ passende Perks. Menschlich wirkende Wahl-Verzögerung (1 bis 4 Sekunden innerhalb des Zeitlimits).

## 7. Phase 7: Tests und Qualitätskontrolle
1. **Regression:** Alle bisherigen Tests bleiben grün, klassischer Modus und andere Modi unverändert.
2. **Unit-Tests:** Perk-Zuweisung verändert nur die Matchkopie, nie cards.json. Jeder Baustein (`statBoost`, `behaviorChange`, `newAbility`, `spawnChange`) mit mindestens einem echten Perk aus chaos_perks.json. Seltenheits-Staffelung über viele simulierte Runden entspricht den Prozentsätzen. Turm- und Elixier-Multiplikatoren. Synchrones Pausieren und Fortsetzen. Auto-Wahl bei Zeitüberschreitung. Überspringen einer Runde ohne perk-freie Karte.
3. **Datentest:** Für jede Karte im Pool existieren alle drei Perk-Stufen mit allen Pflichtfeldern, kein Perk verändert die Elixierkosten.
4. **Integrationstest:** Zwei Test-Clients spielen ein komplettes Chaos-Match inklusive Verlängerung und letzter Runde, inklusive Reconnect mitten in einer Auswahlpause, ohne Desync und Serverfehler.
5. **Bot-Test:** Jede Schwierigkeitsstufe spielt ein vollständiges Chaos-Match inklusive Perk-Wahl, ohne Hänger.
6. **Sicherheitstest:** Ein manipulierter Client versucht, einen nicht angebotenen Perk zu wählen, eine Karte außerhalb des Pools zu platzieren oder die Pause zu umgehen. Der Server weist das ab.
7. **Balance-Stichprobe:** Bot-gegen-Bot-Serie (z. B. 20 Matches) protokolliert, ob eine Karte oder ein Perk auffällig oft zum Sieg führt (nur Beobachtung im Bericht, kein hartes Abnahmekriterium).
8. Automatische Screenshots der neuen Screens (Modus-Kachel, Chaos-Deckbau, Perk-Auswahl bei allen drei Seltenheiten, HUD mit Perk-Abzeichen, Ergebnisbildschirm) in Hoch- und Querformat und Desktop unter `docs/screens/`.

## 8. Vorgehen
Reihenfolge: Phase 1 Audit, **Phase 3 Interview mit mir (Karte für Karte, Zwischenstopp mit meiner Beteiligung)**, Phase 2 Match-Rahmen und Auswahlrunden-Logik (Server zuerst), Phase 4 Perk-Umsetzung, Phase 5 UI, Phase 6 Bots, Phase 7 Tests. Lege vor der Implementierung die Schnittstellen fest (chaos.json-Schema, chaos_perks.json-Schema, neue Protokoll-Nachrichten für Pause, Perk-Angebot, Perk-Wahl), damit mehrere Teile parallel entstehen können. Nach jedem Schritt muss das Spiel lauffähig und getestet sein.

## 9. Abnahmekriterien (Checkliste)
- [ ] Chaos-Modus im Multiplayer per Einladungscode spielbar.
- [ ] Chaos-Modus im Einzelspieler gegen Bots auf allen Schwierigkeitsstufen spielbar.
- [ ] Kartenpool (30 bis 40 Karten, von mir freigegeben), festes Kartenlevel, Turm- und Elixier-Multiplikator funktionieren wie konfiguriert.
- [ ] Für jede Karte im Pool existieren alle drei Perk-Stufen vollständig in chaos_perks.json, jeweils von mir im Interview ausgewählt (oder als "automatisch gewählt" markiert, falls ich das so entschieden habe).
- [ ] Auswahlrunden pausieren synchron, zeigen pro Spieler zwei individuelle Optionen, respektieren Zeitlimit und Seltenheits-Staffelung, inklusive Auto-Wahl bei Zeitüberschreitung.
- [ ] Keine Bann-Mechanik vorhanden.
- [ ] Perks wirken nur für die eigene Karteninstanz des wählenden Spielers, bestehen bis Matchende, verändern nie die Elixierkosten.
- [ ] Alle Eingaben serverseitig validiert.
- [ ] Alle Tests grün, bestehende Modi unverändert.

## 10. Abschlussbericht
`docs/CHAOS_REPORT.md`: Finaler Kartenpool, vollständige Perk-Liste (Verweis auf chaos_perks.json und die Übersicht), welche Karten automatisch gewählt wurden, geänderte und neue Dateien, Protokoll-Änderungen, Testergebnisse inklusive Balance-Stichprobe, Performance, bekannte Einschränkungen, Anleitung zum Hinzufügen einer weiteren Karte zum Pool samt ihrer drei Perks.
