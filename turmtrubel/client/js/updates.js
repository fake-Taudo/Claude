// Update-Verlauf für das „Neu in Turmtrubel“-Fenster (ui/updates.js). Neueste Version zuerst.
//
// Bei JEDER Änderung am Spiel einen neuen Eintrag oben anlegen (siehe CLAUDE.md):
//   id      eindeutig und aufsteigend (Datum + laufende Nummer), z. B. '2026-10-12.2'
//   version Anzeige-Version, title kurze Überschrift, date Anzeige-Datum
//   items   neue Funktionen: { icon (Name aus ui/icons.js), title, text }
// Ein neuer Eintrag zeigt das Fenster wieder an – auch bei Spielern, die „bis zum nächsten Update“ gewählt hatten.

export const UPDATES = [
  {
    id: '2026-10-15.1',
    version: '1.9',
    date: '15.10.2026',
    title: 'Chaos: Startrunde',
    items: [
      { icon: 'sparkles', title: 'Perk zum Kampfbeginn', text: 'Im Chaos-Modus gibt es jetzt eine zusätzliche Auswahlrunde direkt zu Beginn des Kampfs – nur mit gewöhnlichen Perks. Die Runden bei 0:36, 1:12, 1:48, 2:24 und in der Verlängerung bei 3:00 bleiben wie bisher.' },
    ],
  },
  {
    id: '2026-10-14.1',
    version: '1.8',
    date: '14.10.2026',
    title: 'Neuer Modus: Chaos',
    items: [
      { icon: 'sparkles', title: 'Chaos-Modus', text: 'Ein 1 gegen 1 mit 40 ausgewählten Karten – mit Freunden per Code oder gegen den Bot auf allen drei Stufen. Alle Türme haben doppelt so viele Lebenspunkte, Elixier lädt 1,5× so schnell, alle Karten auf Level 11, keine Evolutionen.' },
      { icon: 'hourglass', title: 'Perk-Pausen', text: 'Bei 0:36, 1:12, 1:48 und 2:24 Spielzeit hält der Kampf für beide an: Du hast 6 Sekunden, um einen von zwei Perks für eine deiner Karten zu wählen – sonst wählt der Zufall. In der Verlängerung gibt es bei 3:00 eine fünfte Runde mit epischen Perks. Die Pausen zählen nicht zur Spielzeit.' },
      { icon: 'star', title: '120 Perks', text: 'Jede der 40 Karten hat einen gewöhnlichen, seltenen und epischen Perk – von schnellerem Laufen bis zum fliegenden Riesen oder einem Megaritter, der Truppen aus der Arena schleudert. Elixierkosten bleiben immer gleich, jede Karte bekommt höchstens einen Perk.' },
      { icon: 'cards', title: 'Chaos-Deck', text: 'Eigene Chaos-Decks mit drei Plätzen, nur aus Pool-Karten (Knopf „Chaos-Deck“ auf der Kachel). Im Kartendetail siehst du die drei Perks jeder Karte, der Regel-Hinweis zeigt Rundenplan und Kartenpool.' },
      { icon: 'shield', title: 'Abzeichen im Kampf', text: 'Karten und Einheiten mit Perk tragen ein Abzeichen in der Seltenheitsfarbe (Grau, Bronze, Lila), epische leuchten. Antippen des Abzeichens zeigt die Beschreibung, alle Perks beider Spieler stehen im Kampfmenü. Die Türme zeigen „×2“.' },
      { icon: 'crown', title: 'Ergebnis mit Perks', text: 'Nach dem Kampf siehst du „Deine gewählten Perks“ mit Runde und Seltenheit sowie die Zeit aller Auswahlpausen.' },
    ],
  },
  {
    id: '2026-10-13.3',
    version: '1.7',
    date: '13.10.2026',
    title: 'Großer Fehler-Check',
    items: [
      { icon: 'ghost', title: 'Suspicious Bush und Skelettfass', text: 'Der Busch platzt jetzt sofort am Gebäude auf und lässt die zwei Busch-Kobolde frei – vorher erst, nachdem er Schaden bekommen hatte und zerstört war. Auch das Skelettfass platzt am Ziel, statt über dem Turm zu schweben.' },
      { icon: 'swords', title: 'Dunkler Prinz trifft wieder', text: 'Sein Rundumschlag trifft jetzt immer sein Ziel – auch, wenn er am Rand seiner Reichweite steht. Gilt auch für den Helden.' },
      { icon: 'mirror', title: 'Spiegel und Champions', text: 'Der Spiegel kopiert keinen Champion mehr. So stehen nie zwei Champions gleichzeitig auf dem Feld.' },
      { icon: 'boot', title: 'Bessere Wege', text: 'Große Truppen wie Riese, Golem oder P.E.K.K.A. bleiben nicht mehr zwischen Gebäuden und Türmen hängen und nehmen die Brückenmitte. Gegner, die sich auf der Brücke begegnen, weichen sich aus.' },
      { icon: 'shield', title: 'Keine Truppen in Türmen', text: 'Truppen landen nicht mehr in Türmen oder Gebäuden – weder aus dem Koboldfass noch durch Rückstoß oder beim Rücksprung von Magieschützen-Held und Boss-Banditin.' },
      { icon: 'bolt', title: 'Seltener Absturz behoben', text: 'Ein Sprint der Banditin genau auf ihr Ziel konnte im 2 gegen 2 alle Einheiten vom Feld verschwinden lassen. Außerdem heilen sich Klone nicht mehr über 1 Lebenspunkt hinaus.' },
      { icon: 'phone', title: 'Kleine Bildschirme', text: 'Im Deck-Bauer ist der Deckname jetzt immer lesbar, die Platz-Schilder überlappen nicht mehr und Kartennamen werden sauber umbrochen. Der Dreh-Hinweis zu Kampfbeginn verdeckt nicht mehr deine Karten.' },
      { icon: 'cards', title: 'Kartendetails', text: 'Champions zeigen in den Details nicht mehr zweimal „Champion“, sondern Seltenheit und Kartentyp.' },
    ],
  },
  {
    id: '2026-10-13.2',
    version: '1.6.1',
    date: '13.10.2026',
    title: 'Triple Draft: ruhige Karten',
    items: [
      { icon: 'check', title: 'Kein Springen mehr', text: 'Im Triple Draft wechselten die Karten bei jeder neuen Runde oder jedem Pick des Gegners zwischen groß und klein. Jetzt behalten sie ihre Größe und passen immer vollständig auf den Bildschirm – auch auf dem iPhone im Browser.' },
    ],
  },
  {
    id: '2026-10-13.1',
    version: '1.6',
    date: '13.10.2026',
    title: 'Neues Draft-Design',
    items: [
      { icon: 'castle', title: 'Draft in der Arena', text: 'Triple und Mega Draft sehen jetzt aus wie ein Kampf: Arena im Hintergrund, oben die rote Leiste deines Gegners, unten deine blaue Leiste mit Ø-Elixier und großer Countdown-Balken.' },
      { icon: 'stopwatch', title: 'Triple Draft im eigenen Tempo', text: 'Du wählst so schnell, wie du willst – nach jeder Wahl kommt sofort das nächste Angebot. Für alle 8 Karten hast du zusammen 2 Minuten („Kampf beginnt in …“). Bist du gegen einen Bot schon fertig, wählt er zügig zu Ende.' },
      { icon: 'search', title: 'Optionen des Gegners', text: 'Im Triple Draft siehst du die drei Karten, zwischen denen dein Gegner gerade wählt. Was er nimmt, bleibt verdeckt: In seiner Leiste erscheint nur ein „?“.' },
      { icon: 'cards', title: 'Alle 40 Karten auf einen Blick', text: 'Im Mega Draft passt der ganze Pool ohne Scrollen auf den Bildschirm – im Hoch- und Querformat. Vergebene Karten bekommen ein Häkchen, Filter und Suche stecken im Lupen-Knopf.' },
      { icon: 'crown', title: 'Neue Draft-Karten', text: 'Elixier-Tropfen mittig am Kartenrand, sechseckige Rahmen für legendäre Karten und Champions. Antippen zeigt „Wählen“ und „Info“ direkt unter der Karte.' },
      { icon: 'flag', title: 'Großer Reveal', text: 'Nach dem Draft deckt die Leiste deines Gegners seine acht Karten eine nach der anderen auf.' },
    ],
  },
  {
    id: '2026-10-12.2',
    version: '1.5',
    date: '12.10.2026',
    title: 'Vier neue Spielmodi',
    items: [
      { icon: 'menu', title: 'Spielmodi im Hauptmenü', text: 'Neuer Bereich mit Kacheln für jeden Modus: mit Freunden per Code oder gegen einen Bot. Beim ersten Mal erklärt ein kurzes Fenster die Regeln.' },
      { icon: 'group', title: '2 gegen 2', text: 'Zu viert in zwei Teams: gemeinsame Türme, eigenes Deck und Elixier für jeden. Team-Lobby mit Platzwahl, Teamkollegen-Anzeige im Kampf und Zeichen per Tippen und Halten.' },
      { icon: 'cards', title: 'Triple Draft', text: 'Acht Runden lang bekommst du drei zufällige Karten und nimmst eine – daraus entsteht dein Deck für den Kampf.' },
      { icon: 'crown', title: 'Mega Draft', text: 'Ein gemeinsamer Pool aus 40 Karten mit drei Champions. Ihr wählt abwechselnd – was der andere nimmt, ist weg.' },
      { icon: 'drop', title: 'Unendlich-Elixier', text: 'Elixier lädt sich siebenmal so schnell auf, du startest mit vollen 10. Karte um Karte!' },
      { icon: 'target', title: 'Bots in drei Stufen', text: 'Leicht, Mittel oder Schwer – in allen Modi außer 2 gegen 2. Der schwere Bot kontert gezielt und baut Angriffe auf.' },
      { icon: 'star', title: 'Draft-Decks behalten', text: 'Nach einem Draft siehst du beide Decks im Ergebnis und kannst deins in einem Deck-Platz speichern.' },
      { icon: 'check', title: 'Kleine Handys', text: 'Auf dem Ergebnis-Bildschirm passen „Rematch“ und „Zurück zum Menü“ jetzt auch auf sehr schmale Displays.' },
    ],
  },
  {
    id: '2026-10-12.1',
    version: '1.4',
    date: '12.10.2026',
    title: 'Alle Figuren neu gezeichnet',
    items: [
      { icon: 'sparkles', title: '130 neue Figuren', text: 'Jede Truppe, jedes Token, die Hütten, Grabsteine, Käfig und Bohrer sowie König und Turmwache sind komplett neu gezeichnet – jede mit eigener Silhouette, eigenen Farben und einem Erkennungsmerkmal.' },
      { icon: 'play', title: 'Eigene Animationen', text: 'Ruhe, Laufen, Angriff, Treffer, Erscheinen und Tod – dazu Fähigkeiten, Ansturm, Betäubung und Schlaf. Jede Figur bewegt sich auf ihre Art.' },
      { icon: 'crown', title: 'Helden und Champions', text: '16 Helden unterscheiden sich schon an der Silhouette von ihrer Grundfigur, die 8 Champions haben eigene Fähigkeits-Posen.' },
      { icon: 'star', title: 'Evolutionen und Formen', text: '35 Evos mit eigener Rüstung und Leuchten. Formen wie Phönix-Ei, aufgebaute Kanone, Holzfäller-Geist oder Lockvogel wechseln direkt im Kampf.' },
      { icon: 'cards', title: 'Neue Kartenbilder', text: 'Die Kartenbilder im Deck-Bauer und in der Hand zeigen jetzt die neuen Figuren.' },
      { icon: 'shield', title: 'Teams besser erkennbar', text: 'Jede Figur trägt Teamfarben an festen Stellen und ein Teamsymbol: Kreis für dich, Dreieck für den Gegner. Im Farbenblind-Modus wird das Symbol größer.' },
      { icon: 'gear', title: 'Automatische Qualität', text: 'Ruckelt es, senkt das Spiel nach Auflösung und Effekten jetzt auch die Figurenqualität – und hebt sie wieder an, sobald es flüssig läuft.' },
      { icon: 'flag', title: 'Dieses Fenster', text: 'Nach jedem Update zeigt dir Turmtrubel hier, was neu ist. Mit dem Glitzer-Knopf im Hauptmenü kannst du es jederzeit wieder öffnen.' },
    ],
  },
  {
    id: '2026-10-07.1',
    version: '1.3',
    date: '07.10.2026',
    title: 'Großes Grafik-Update',
    items: [
      { icon: 'burst', title: 'Neue Effekte', text: 'Zauber, Treffer, Explosionen und Turmfall mit neuer Effekt-Engine; Bildschirmwackeln einstellbar.' },
      { icon: 'castle', title: 'Neue Türme und Arena', text: 'Türme, Lebensanzeigen, Arena und Zonen im neuen Vektor-Look, mit Wolkenschatten und glitzerndem Fluss auf Qualität Hoch.' },
      { icon: 'cards', title: 'Deck-Bauer mit Drag-and-Drop', text: 'Karten in und zwischen Deck-Plätzen ziehen; Kartendetail mit Reitern für Werte, Evo und Fähigkeit.' },
      { icon: 'chat', title: 'Emotes und Banner', text: 'Neue Emote-Leiste im Kampf und Phasen-Banner wie „Doppeltes Elixier“.' },
      { icon: 'heart', title: 'Barrierefreiheit', text: 'Einstellungen für weniger Effekte, Bildschirmwackeln und einen Farbenblind-Modus.' },
    ],
  },
  {
    id: '2026-10-06.1',
    version: '1.2',
    date: '06.10.2026',
    title: 'Echte Karten',
    items: [
      { icon: 'cards', title: 'Alle echten Karten', text: 'Kartenwerte aus dem Clash-Royale-Wiki auf Turnierstandard, mit Champions, Helden und Evolutionen.' },
      { icon: 'bolt', title: 'Neue Mechaniken', text: 'Ansturm, Sprünge, Schilde, Spawner, Todeseffekte und viele Zauber-Bausteine.' },
      { icon: 'refresh', title: 'Decks automatisch angepasst', text: 'Gespeicherte Decks mit alten Karten werden auf Startdecks zurückgesetzt.' },
    ],
  },
  {
    id: '2026-09-30.2',
    version: '1.1',
    date: '30.09.2026',
    title: 'Neue Oberfläche',
    items: [
      { icon: 'target', title: 'Übersichtlicher Kampf', text: 'Das Kampf-HUD verdeckt die Arena nicht mehr.' },
      { icon: 'menu', title: 'Menüs und Deck-Bauer', text: 'Überarbeitete Menüs, Deck-Bauer und Kartendetail; Knopf „Raum verlassen“ in den Einstellungen.' },
    ],
  },
  {
    id: '2026-09-30.1',
    version: '1.0',
    date: '30.09.2026',
    title: 'Turmtrubel ist da',
    items: [
      { icon: 'swords', title: '1-gegen-1 im Browser', text: 'Echtzeit-Kartenkampf gegen Freunde – ein 6-stelliger Code genügt.' },
      { icon: 'target', title: 'Training gegen Bot', text: 'Sofort loslegen, ohne zweiten Spieler.' },
      { icon: 'cards', title: 'Deck-Bauer', text: 'Fünf Deck-Plätze, die im Browser gespeichert bleiben.' },
    ],
  },
];

export const LATEST_UPDATE = UPDATES[0];
