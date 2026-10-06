// Gemeinsames Nachrichtenprotokoll für Server und Client.
// Alle Nachrichten sind JSON-Objekte mit einem Feld "type".

export const PROTOCOL_VERSION = 1;

// Client → Server
export const C2S = Object.freeze({
  HELLO: 'hello',         // { name, token? }
  CREATE: 'create',       // { deck }
  JOIN: 'join',           // { code, deck }
  TRAINING: 'training',   // { deck }
  LEAVE: 'leave',         // {}
  DECK: 'deck',           // { deck }
  READY: 'ready',         // { ready }
  LOADED: 'loaded',       // {}
  PLAY: 'play',           // { slot, card, x, y, seq }
  ABILITY: 'ability',     // { seq }
  EMOTE: 'emote',         // { id }
  REMATCH: 'rematch',     // { want }
  SURRENDER: 'surrender', // {}
  PING: 'ping',           // { t }
  NAME: 'name',           // { name }
});

// Server → Client
export const S2C = Object.freeze({
  WELCOME: 'welcome',       // { token, name, resumed, dataVersion }
  ERROR: 'error',           // { code, message }
  LOBBY: 'lobby',           // Lobby-Zustand
  COUNTDOWN: 'countdown',   // { n }
  MATCH_INIT: 'matchInit',  // statische Match-Daten → Ladebildschirm
  MATCH_START: 'matchStart',
  SNAP: 's',                // Snapshot pro Tick
  REJECT: 'reject',         // { seq, code, message }
  MATCH_END: 'matchEnd',    // { winner, reason, crowns, ... }
  REMATCH: 'rematchState',  // { want: [bool,bool], available }
  PONG: 'pong',             // { t, st }
  CLOSED: 'roomClosed',     // { reason, message }
  NOTICE: 'notice',         // { message }
  PRESENCE: 'presence',     // { side, connected, graceLeft }
});

// Bit-Flags für Entitäten im Snapshot
export const EF = Object.freeze({
  DEPLOY: 1,
  ATTACK: 2,
  STUN: 4,
  SLOW: 8,
  RAGE: 16,
  EVO: 32,
  CLOAK: 64,
  REFLECT: 128,
  CHARGE: 256,
  ACTIVE: 512,
  DASH: 1024,
  JUMP: 2048,
  BUFF: 4096,
  UNDER: 8192, // unter der Erde (Tunnelgräber, Großer Gräber, versenkte Tesla)
  CURSE: 16384, // verflucht (Hexenmutter, Goblin Curse)
  FREEZE: 32768, // eingefroren (Frost, Eisgeist)
  ROOT: 65536, // festgehalten (Ranken, Netz, Käfig)
  ENCHANT: 131072, // verzaubert (Rune Giant)
  GHOST: 262144, // Geist/Schatten (nicht anvisierbar)
  CLONE: 524288, // Klon (1 Leben)
  FLY: 1048576, // fliegt gerade (z. B. Held Magier, Evo-Königsschweinchen)
});

// Aufbau eines Entitäts-Eintrags im Snapshot (Array statt Objekt → kleinere Pakete)
export const ENT = Object.freeze({
  ID: 0, TYPE: 1, OWNER: 2, X: 3, Y: 4, HP: 5, MAXHP: 6, FLAGS: 7, SHIELD: 8, TARGET: 9, FACING: 10, AUX: 11,
});

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;
export const NAME_MAX = 16;

export const ERRORS = Object.freeze({
  INVALID_CODE: 'Ungültiger Code: Er besteht aus genau 6 Buchstaben oder Zahlen.',
  ROOM_NOT_FOUND: 'Zu diesem Code gibt es keinen Raum. Bitte prüfe die Eingabe.',
  ROOM_FULL: 'Dieser Raum ist bereits voll.',
  ROOM_EXPIRED: 'Dieser Code ist abgelaufen (Codes gelten 10 Minuten).',
  ROOM_BUSY: 'In diesem Raum läuft bereits ein Kampf.',
  ALREADY_IN_ROOM: 'Du bist noch in einem Raum. Verlasse ihn über ⚙ Einstellungen → „Raum verlassen“.',
  NOT_IN_ROOM: 'Du bist in keinem Raum.',
  INVALID_DECK: 'Dein Deck ist ungültig.',
  INVALID_NAME: 'Bitte gib einen Namen mit 2–16 Zeichen ein.',
  NO_SESSION: 'Bitte zuerst anmelden.',
  RATE_LIMIT: 'Zu viele Nachrichten – bitte langsamer.',
  BAD_MESSAGE: 'Ungültige Nachricht.',
});

export const REJECTS = Object.freeze({
  NOT_RUNNING: 'Der Kampf läuft gerade nicht.',
  BAD_SLOT: 'Ungültiger Kartenplatz.',
  NOT_IN_HAND: 'Diese Karte ist nicht auf deiner Hand.',
  NOT_READY: 'Die Karte ist noch nicht bereit.',
  ELIXIR: 'Nicht genug Elixier.',
  PLACEMENT: 'Hier kannst du das nicht platzieren.',
  NO_ABILITY: 'Keine Fähigkeit verfügbar.',
  COOLDOWN: 'Die Fähigkeit lädt noch.',
  USED: 'Die Fähigkeit wurde bereits eingesetzt.',
  DEPLOYING: 'Die Einheit landet noch.',
  EMOTE_COOLDOWN: 'Emote noch nicht bereit.',
  LIMIT: 'Zu viele Einheiten auf dem Feld.',
  MIRROR_EMPTY: 'Der Spiegel braucht eine zuvor gespielte Karte.',
});

// Sechs Emotes – die Gesichter werden im Client prozedural gezeichnet.
export const EMOTES = Object.freeze([
  { id: 'hallo', text: 'Hallo!', face: 'wave' },
  { id: 'gg', text: 'Gut gespielt!', face: 'thumbs' },
  { id: 'lach', text: 'Hihihi!', face: 'laugh' },
  { id: 'wut', text: 'Grrr!', face: 'angry' },
  { id: 'wow', text: 'Wow!', face: 'wow' },
  { id: 'heul', text: 'Buhuu…', face: 'cry' },
]);

export const END_REASONS = Object.freeze({
  king: 'Burgturm zerstört',
  time: 'Zeit abgelaufen',
  suddenDeath: 'Sudden Death',
  tiebreak: 'Entscheidung nach Turm-Lebenspunkten',
  draw: 'Unentschieden',
  forfeit: 'Aufgabe',
  disconnect: 'Verbindung getrennt',
});

export function normalizeCode(input) {
  return String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
}

export function isValidCodeFormat(code) {
  return new RegExp(`^[A-Z0-9]{${CODE_LENGTH}}$`).test(code);
}

export function sanitizeName(input) {
  const s = String(input ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
  return s.length >= 2 ? s : null;
}
