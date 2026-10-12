// Update-Verlauf für das „Neu in Turmtrubel“-Fenster (ui/updates.js). Neueste Version zuerst.
//
// Bei JEDER Änderung am Spiel einen neuen Eintrag oben anlegen (siehe CLAUDE.md):
//   id      eindeutig und aufsteigend (Datum + laufende Nummer), z. B. '2026-10-12.2'
//   version Anzeige-Version, title kurze Überschrift, date Anzeige-Datum
//   items   neue Funktionen: { icon (Name aus ui/icons.js), title, text }
// Ein neuer Eintrag zeigt das Fenster wieder an – auch bei Spielern, die „bis zum nächsten Update“ gewählt hatten.

export const UPDATES = [
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
