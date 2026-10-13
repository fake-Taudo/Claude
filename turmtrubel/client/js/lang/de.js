// Texte für Spielmodi, Draft, 2 gegen 2 und Bots (Deutsch). Namen, Beschreibungen und Regeln der Modi selbst
// stehen in data/modes.json. Platzhalter: {name}, {n}, {max} … werden mit t() ersetzt.

export const DE = Object.freeze({
  // Menü „Modi“
  modesTitle: 'Spielmodi',
  modesSub: 'Wähle einen Modus – mit Freunden per Code oder gegen einen Bot.',
  withFriends: 'Mit Freunden',
  vsBot: 'Gegen Bot',
  onlyMultiplayer: 'Nur Multiplayer',
  onlyMultiplayerTip: 'Diesen Modus gibt es nur mit Freunden (Multiplayer).',
  players: '{n} Spieler',
  botStrength: 'Bot-Stärke',
  difficulty: { easy: 'Leicht', medium: 'Mittel', hard: 'Schwer' },
  difficultyHint: { easy: 'Reagiert langsam, gut zum Üben.', medium: 'Der bekannte Trainingsbot.', hard: 'Kontert gezielt und baut Angriffe auf.' },
  classicBadge: 'Standard',
  draftDeckNote: 'Dein Deck entsteht im Draft – gespeicherte Decks bleiben unverändert.',

  // Regel-Info
  rulesTitle: 'So funktioniert „{name}“',
  rulesHide: 'Beim nächsten Mal nicht mehr anzeigen',
  rulesGo: 'Verstanden',
  rulesButton: 'Regeln',

  // Lobby
  modeLabel: 'Modus',
  teamBlue: 'Team Blau',
  teamRed: 'Team Rot',
  freeSeat: 'Freier Platz',
  takeSeat: 'Hierher wechseln',
  host: 'Gastgeber',
  moveTeam: 'Ins andere Team',
  kick: 'Entfernen',
  kickConfirm: '{name} aus dem Raum entfernen?',
  waitingFor: 'Es fehlen noch: {list}',
  seatsFree: { 1: 'Noch 1 Platz frei – teile den Code!', n: 'Noch {n} Plätze frei – teile den Code!' },
  notReady: 'Noch nicht bereit: {list}',
  allReady4: 'Alle vier sind da – drückt auf „Bereit!“',
  you: 'du',
  bot: 'Bot',

  // Draft
  draftTitle: { triple: 'Triple Draft', mega: 'Mega Draft' },
  roundOf: 'Runde {n}/{max}',
  picksOf: 'Gewählt {n}/{max}',
  yourTurn: 'Du bist dran!',
  oppTurn: '{name} wählt …',
  pickOne: 'Wähle 1 von 3 Karten',
  waitOpp: 'Warte auf {name} …',
  pick: 'Wählen',
  pickConfirm: 'Diese Karte nehmen',
  autoPicked: 'Zeit abgelaufen – zufällig gewählt: {card}',
  takenByYou: 'Deine Wahl',
  takenByOpp: 'von {name}',
  championLocked: 'Du hast bereits einen Champion',
  notYourTurn: 'Warte, bis du dran bist.',
  firstPick: '{name} beginnt (per Los).',
  firstPickYou: 'Du beginnst (per Los).',
  deckBar: 'Dein Deck',
  oppPicks: 'Picks von {name}',
  avgElixir: 'Ø {v} Elixier',
  filterAll: 'Alle',
  filterTypes: { troop: 'Truppen', spell: 'Zauber', building: 'Gebäude', champion: 'Champions' },
  searchCards: 'Karte suchen…',
  noMatch: 'Keine Karte passt zum Filter.',
  holdForDetail: 'Tippen und halten für Details',
  chooseYourCard: 'Wähle deine Karte',
  chooseACard: 'Wähle eine Karte',
  oppOptions: 'Optionen des Gegners:',
  oppDone: '{name} hat alle Karten gewählt.',
  youDone: 'Fertig! Warte auf {name} …',
  battleIn: 'Kampf beginnt in:',
  timeLeftLabel: 'Zeit übrig:',
  avgCost: 'Durchschn. Elixierkosten: {v}',
  pickedOf: '{n}/{max} gewählt',
  info: 'Info',
  filter: 'Filter',
  filterActive: 'Filter aktiv',
  hiddenCard: 'Verdeckte Karte',
  revealTitle: 'Die Decks stehen!',
  revealSub: 'Gleich geht’s los …',
  draftLeft: 'Draft abgebrochen.',

  // Kampf (Modi)
  infiniteBanner: 'Unendlich-Elixier!',
  infiniteSub: 'Elixier lädt 7× so schnell',
  teamBanner: '2 gegen 2!',
  teamSub: 'Mit {name} im Team',
  mate: 'Kollege',
  ally: 'Verbündeter',
  pingSent: 'Zeichen gesendet',
  pingFrom: '{name}: Hierher!',
  pingCooldown: 'Zeichen noch nicht bereit.',
  pingHint: 'Tippe und halte auf die Arena, um deinem Kollegen ein Zeichen zu geben.',
  takeover: '{name} ist weg – ein Bot spielt für das Team weiter.',
  leaveTeam: 'Kampf verlassen',
  leaveTeamText: 'Ein Bot übernimmt deinen Platz, damit dein Team nicht verliert. Du kannst danach nicht zurück.',
  presenceGone: '{name} ist getrennt – wartet bis zu {s} s …',
  presenceBack: '{name} ist wieder da.',

  // Ergebnis
  teamWin: 'Teamsieg!',
  teamLose: 'Niederlage fürs Team',
  rematchAll: 'Alle vier müssen zustimmen.',
  rematchWaitAll: 'Warte auf die anderen ({n}/{max}) …',
  rematchNoTakeover: 'Rematch nicht möglich – ein Platz wurde von einem Bot übernommen.',
  draftDecks: 'Die Draft-Decks',
  saveDeck: 'Deck speichern',
  saveDeckTitle: 'Draft-Deck speichern',
  saveDeckText: 'In welchen Deck-Platz soll das Deck? Der bisherige Inhalt wird ersetzt.',
  saveDeckDone: 'Gespeichert in „{name}“.',
  savedName: 'Draft {date}',
  saveDeckInvalid: 'Hinweis: Im normalen Spiel gelten die Deck-Regeln (1 Champion oder Held, Evo-Plätze).',

  // Protokoll
  outdated: 'Turmtrubel wurde aktualisiert.',
  reload: 'Seite neu laden',
});

/** Text mit Platzhaltern füllen: t('roundOf', { n: 3, max: 8 }). Verschachtelte Schlüssel: t('difficulty.easy'). */
export function t(key, vars = {}) {
  let s = key.split('.').reduce((o, k) => (o == null ? o : o[k]), DE);
  if (s == null) return key;
  if (typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}
