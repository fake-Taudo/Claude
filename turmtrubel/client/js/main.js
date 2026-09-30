// Einstiegspunkt: lädt Daten, verbindet zum Server und steuert alle Screens.
import { createDb, validateDeck, averageElixir, cycleCost, EVO_SLOTS } from '/shared/cards.js';
import { C2S, S2C, ERRORS, normalizeCode, isValidCodeFormat, sanitizeName } from '/shared/protocol.js';
import { Net } from './net.js';
import { AudioSys } from './audio.js';
import { Store } from './store.js';
import { $, h, ico, showScreen, currentScreen, toast, modal, confirmDialog, fmtTime } from './ui/dom.js';
import { cardEl } from './ui/cardview.js';
import { prerenderAll, cardArt, cardArtGray } from './ui/art.js';
import { drawTower } from './game/sprites.js';
import { DeckBuilder } from './ui/deckbuilder.js';
import { openSettings } from './ui/settings.js';
import { applyBodyFlags, reducedMotion } from './ui/tokens.js';
import { Game } from './game/game.js';

const TIPS = [
  'Tipp: Ziehe Karten direkt aufs Feld – oder tippe erst die Karte, dann das Feld.',
  'Tipp: Fällt ein gegnerischer Wachturm, darfst du auch in seiner Lane platzieren.',
  'Tipp: In der letzten Minute fließt das Elixier doppelt so schnell.',
  'Tipp: Evo-Karten entwickeln sich, wenn du sie oft genug ausgespielt hast.',
  'Tipp: Champions haben eine aktive Fähigkeit – sie kostet Elixier und lädt nach.',
  'Tipp: Helden haben eine starke Spezialfähigkeit, die du einmal pro Einsatz zünden kannst.',
  'Tipp: Gebäude lenken Gebäudejäger wie den Steinkoloss ab.',
  'Tipp: Mit den Tasten 1–4 wählst du Karten, mit der Leertaste zündest du Fähigkeiten.',
  'Tipp: Wählst du eine Karte, zeigt die Elixierleiste mit einer Kerbe, was sie kostet.',
  'Tipp: Zauber wie Glutball treffen auch Kronentürme – aber mit weniger Schaden.',
  'Tipp: Schwärme sind stark gegen große Einzelkämpfer, aber anfällig für Flächenschaden.',
  'Tipp: Tippst du auf den gekürzten Gegnernamen, siehst du ihn in voller Länge.',
  'Tipp: Zerstörst du einen Wachturm, bekommst du eine Krone – drei Kronen beenden den Kampf sofort.',
  'Tipp: Der Burgturm schläft, bis er Schaden nimmt oder ein Wachturm fällt.',
  'Tipp: Gegner-Emotes kannst du im Menü (≡) stummschalten.',
];

class App {
  constructor() {
    this.room = null;
    this.game = null;
    this.result = null;
    this.joinModal = null;
    this.expiryTimer = null;
    this.netStarted = false;
    this.serverInRoom = false; // was der Server zuletzt gemeldet hat
    this.leaving = false; // Raum wird gerade verlassen → späte Raum-Nachrichten ignorieren
    this.pendingLeave = false; // Verlassen nachholen, sobald die Verbindung wieder steht
  }

  /** Ist man (laut Client oder Server) noch in einem Raum? */
  inRoom() {
    return !!(this.room || this.game || this.result || this.serverInRoom);
  }

  toast(msg, kind, ms) {
    toast(msg, kind, ms);
  }

  /** Kurzes haptisches Feedback (10–20 ms), nur wenn unterstützt und in den Einstellungen erlaubt. */
  haptic(pattern = 12) {
    if (!this.settings?.haptics || typeof navigator.vibrate !== 'function') return;
    try {
      navigator.vibrate(pattern);
    } catch {
      /* z. B. ohne Nutzergeste blockiert */
    }
  }

  // ───────────── Start ─────────────
  async boot() {
    const bar = $('#boot-bar');
    const txt = $('#boot-text');
    try {
      const [cards, rules] = await Promise.all([fetch('/data/cards.json').then((r) => r.json()), fetch('/data/rules.json').then((r) => r.json())]);
      this.db = createDb(cards);
      this.rules = rules;
    } catch (e) {
      txt.textContent = 'Die Spieldaten konnten nicht geladen werden. Läuft der Server?';
      console.error(e);
      return;
    }
    bar.style.transform = 'scaleX(0.15)';
    this.store = new Store(this.db);
    this.settings = this.store.settings;
    applyBodyFlags(this.settings);
    this.audio = new AudioSys(this.settings);
    txt.textContent = 'Male Karten…';
    try {
      await Promise.race([document.fonts?.load('20px "Lilita One"'), new Promise((r) => setTimeout(r, 1500))]);
    } catch {}
    await prerenderAll(this.db, (p) => (bar.style.transform = `scaleX(${0.15 + p * 0.85})`));
    this.net = new Net();
    this.bindNet();
    this.deckBuilder = new DeckBuilder(this);
    this.bindUI();
    const code = new URLSearchParams(location.search).get('code');
    if (code) this.pendingJoin = normalizeCode(code);
    if (!this.store.name) {
      showScreen('s-name');
      $('#name-input').focus();
    } else {
      this.startNet();
      this.goMenu();
    }
  }

  startNet() {
    if (this.netStarted) return;
    this.netStarted = true;
    this.net.connect(this.store.name);
  }

  // ───────────── UI-Verdrahtung ─────────────
  bindUI() {
    const unlock = () => {
      this.audio.unlock();
      if (!this.audio.wanted) this.audio.music(currentScreen() === 's-game' ? 'battle' : 'menu');
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    document.addEventListener('click', (e) => {
      if (e.target.closest?.('.btn, .icon-btn, .chip, .deck-tab, .fchip, .toggle, .seg button, .deck-name-btn')) this.audio.sfx('click', 0.6);
    });

    const ni = $('#name-input');
    const updName = () => {
      const has = ni.value.trim().length > 0;
      $('#name-count').textContent = `${ni.value.length}/16`;
      $('#name-go').setAttribute('aria-disabled', has ? 'false' : 'true');
      if (has) $('#name-error').textContent = '';
    };
    ni.addEventListener('input', updName);
    updName();
    $('#name-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const n = sanitizeName(ni.value);
      if (!n) {
        $('#name-error').textContent = ni.value.trim() ? ERRORS.INVALID_NAME : 'Bitte gib zuerst einen Namen ein.';
        this.audio.sfx('error');
        ni.focus();
        return;
      }
      this.store.name = n;
      this.store.save();
      this.startNet();
      this.goMenu();
    });

    $('#menu-rename').addEventListener('click', () => this.openRename());
    $('#menu-settings').addEventListener('click', () => openSettings(this));
    $('#btn-deckbuilder').addEventListener('click', () => this.deckBuilder.open(this.store.active));
    $('#menu-deck-select').addEventListener('change', (e) => {
      this.store.active = Number(e.target.value);
      this.store.save();
      this.renderMenuDeck();
    });
    $('#menu-room-leave').addEventListener('click', () => {
      this.leaveRoom();
      toast('Du hast den Raum verlassen.', 'ok');
    });
    $('#btn-create').addEventListener('click', () => this.createRoom());
    $('#btn-join').addEventListener('click', () => this.openJoin());
    $('#btn-training').addEventListener('click', () => this.startTraining());

    $('#lobby-copy').addEventListener('click', () => this.copyCode(false));
    $('#lobby-share').addEventListener('click', () => this.copyCode(true));
    $('#lobby-leave').addEventListener('click', () => this.leaveRoom());
    $('#lobby-ready').addEventListener('click', () => {
      if (!this.room) return;
      const me = this.room.players[this.room.you];
      this.net.send(C2S.READY, { ready: !me?.ready });
    });
    $('#lobby-deck-select').addEventListener('change', (e) => {
      const i = Number(e.target.value);
      if (!this.store.deckValid(i)) {
        toast('Dieses Deck ist unvollständig.', 'warn');
        e.target.value = String(this.store.active);
        return;
      }
      this.store.active = i;
      this.store.save();
      this.net.send(C2S.DECK, { deck: this.store.activeDeck().slots });
    });

    $('#res-rematch').addEventListener('click', () => {
      this.net.send(C2S.REMATCH, { want: true });
      $('#res-rematch').disabled = true;
      $('#res-rematch').textContent = 'Warte auf Gegner…';
    });
    $('#res-menu').addEventListener('click', () => this.leaveRoom());

    $('#game-menu-btn').addEventListener('click', () => this.openPause());
  }

  /** Pausen-Menü als Modal (B-08). Der Kampf läuft weiter – das wird klar gesagt. */
  openPause() {
    if (this.pauseModal || !this.game) return;
    const s = this.settings;
    const save = () => {
      this.store.save();
      this.audio.apply();
    };
    const toggleBtn = (id, get, set, onTxt, offTxt, onIco, offIco) => {
      const b = h('button', { class: 'btn btn-secondary', id });
      const upd = () => {
        b.replaceChildren(ico(get() ? onIco : offIco), get() ? onTxt : offTxt);
        b.setAttribute('aria-pressed', get() ? 'true' : 'false');
      };
      b.addEventListener('click', () => {
        set(!get());
        save();
        upd();
      });
      upd();
      return b;
    };
    const training = !!this.game.training;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const key = (k) => h('kbd', { class: 'key' }, k);
    const body = h(
      'div',
      { class: 'pause' },
      h('p', { class: 'pause-note' }, ico('⏵'), training ? 'Das Training läuft im Hintergrund weiter.' : 'Das Spiel läuft weiter – dein Gegner kann weiterspielen.'),
      h('button', { class: 'btn btn-primary btn-big btn-block', id: 'gm-resume', onclick: () => m.close() }, ico('▶'), 'Weiter'),
      h(
        'div',
        { class: 'pause-grid' },
        toggleBtn('gm-sound', () => s.sfx, (v) => (s.sfx = v), 'Ton an', 'Ton aus', '🔊', '🔇'),
        toggleBtn('gm-music', () => s.music, (v) => (s.music = v), 'Musik an', 'Musik aus', '🎵', '🔈'),
        toggleBtn('gm-emotes', () => !s.muteEmotes, (v) => (s.muteEmotes = !v), 'Gegner-Emotes an', 'Gegner-Emotes stumm', '💬', '🙊'),
        h('button', { class: 'btn btn-accent', id: 'gm-settings', onclick: () => (m.close(), openSettings(this, { allowRename: false })) }, ico('⚙'), 'Einstellungen'),
      ),
      h(
        'button',
        {
          class: 'btn btn-danger btn-block pause-surrender',
          id: 'gm-surrender',
          onclick: async () => {
            m.close();
            if (await confirmDialog('Wirklich aufgeben?', 'Der Gegner gewinnt sofort mit 3 Kronen.', 'Aufgeben', true)) this.net.send(C2S.SURRENDER);
          },
        },
        ico('🏳'),
        'Aufgeben',
      ),
      fine
        ? h(
            'ul',
            { class: 'keys', 'aria-label': 'Tastenkürzel' },
            h('li', {}, key('1'), '–', key('4'), ' Karte wählen'),
            h('li', {}, key('Leertaste'), ' Fähigkeit'),
            h('li', {}, key('E'), ' Emotes'),
            h('li', {}, key('Esc'), ' Auswahl abbrechen'),
          )
        : null,
    );
    const m = modal('Menü', body, { onClose: () => (this.pauseModal = null) });
    this.pauseModal = m;
  }

  // ───────────── Netzwerk ─────────────
  bindNet() {
    const n = this.net;
    n.on('status', (st) => {
      const banner = $('#conn-banner');
      const cs = $('#conn-state');
      if (st.state === 'online') {
        banner.hidden = true;
        clearInterval(this.bannerTimer);
        cs.textContent = 'online';
        cs.className = 'conn-state online';
        if (st.wasLost && !st.resumed && (this.room || this.game)) {
          toast('Verbindung wiederhergestellt, aber die Sitzung war abgelaufen.', 'warn', 4000);
          this.resetRoomState();
          this.goMenu();
        } else if (st.wasLost) toast('Verbindung wiederhergestellt!', 'ok');
        if (this.pendingJoin && currentScreen() === 's-menu') {
          const code = this.pendingJoin;
          this.pendingJoin = null;
          this.openJoin(code);
        }
      } else if (st.state === 'reconnecting') {
        cs.textContent = 'offline';
        cs.className = 'conn-state offline';
        banner.hidden = false;
        clearInterval(this.bannerTimer);
        const upd = () => (banner.textContent = `Verbindung verloren – verbinde neu … (${Math.ceil(this.net.graceLeft() / 1000)} s)`);
        upd();
        this.bannerTimer = setInterval(upd, 500);
      } else if (st.state === 'lost') {
        clearInterval(this.bannerTimer);
        banner.hidden = false;
        banner.textContent = 'Verbindung verloren. Neuer Verbindungsversuch …';
        if (this.room || this.game) {
          this.resetRoomState();
          this.goMenu();
        }
      }
    });
    n.on('ping', (rtt) => {
      if (this.game) this.game.ping = rtt;
    });
    n.on(S2C.ERROR, (m) => {
      if (m.code === 'ALREADY_IN_ROOM') {
        // Statt Verweis auf die Einstellungen: Banner mit direktem „Raum verlassen“
        this.serverInRoom = true;
        this.closeJoin();
        this.updateRoomBanner();
        toast('Du bist noch in einem Raum – verlasse ihn zuerst.', 'warn', 2600);
        this.audio.sfx('error');
        return;
      }
      if (this.joinModal) {
        this.joinModal.markError?.(m.message);
        return;
      }
      toast(m.message, 'error', 3500);
    });
    n.on(S2C.NOTICE, (m) => toast(m.message, 'info', 3000));
    n.on(S2C.WELCOME, (m) => {
      this.serverInRoom = !!m.inRoom;
      if (this.pendingLeave) {
        this.pendingLeave = false;
        if (m.inRoom) n.send(C2S.LEAVE);
        else this.leaving = false;
      } else this.leaving = false;
      this.updateRoomBanner();
    });
    // Raum-Nachrichten, die nach „Raum verlassen“ noch eintreffen, verwerfen
    const roomMsg = (fn) => (m) => {
      if (this.leaving) return;
      this.serverInRoom = true;
      fn(m);
    };
    n.on(S2C.LOBBY, roomMsg((m) => this.onLobby(m)));
    n.on(S2C.COUNTDOWN, roomMsg((m) => this.onCountdown(m)));
    n.on(S2C.MATCH_INIT, roomMsg((m) => this.onMatchInit(m)));
    n.on(S2C.MATCH_START, roomMsg((m) => this.onMatchStart(m)));
    n.on(S2C.SNAP, (m) => this.game?.onSnapshot(m));
    n.on(S2C.REJECT, (m) => this.game?.onReject(m));
    n.on(S2C.MATCH_END, roomMsg((m) => this.onMatchEnd(m)));
    n.on(S2C.REMATCH, roomMsg((m) => this.onRematchState(m)));
    n.on(S2C.PRESENCE, (m) => {
      if (this.game && !this.game.ended) {
        this.game.oppDisconnected = !m.connected;
        toast(m.connected ? 'Dein Gegner ist wieder verbunden.' : `Gegner getrennt – wartet bis zu ${m.graceLeft} s auf Rückkehr …`, m.connected ? 'ok' : 'warn', 3500);
      }
    });
    n.on(S2C.CLOSED, (m) => {
      const wasIn = !!this.room || !!this.game;
      this.serverInRoom = false;
      this.leaving = false;
      this.resetRoomState();
      this.updateRoomBanner();
      if (m.reason !== 'left') {
        if (m.message) toast(m.message, 'warn', 4000);
        if (wasIn || currentScreen() !== 's-menu') this.goMenu();
      }
    });
  }

  resetRoomState() {
    this.room = null;
    clearInterval(this.expiryTimer);
    clearInterval(this.tipTimer);
    this.resetCountdown();
    this.pauseModal?.close();
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
  }

  // ───────────── Menü ─────────────
  goMenu() {
    this.closeJoin();
    $('#menu-name').textContent = this.store.name;
    $('#menu-rename').title = `${this.store.name} – Namen ändern`;
    this.renderMenuDeck();
    showScreen('s-menu');
    this.audio.music('menu');
    const cs = $('#conn-state');
    if (this.net?.welcomed) {
      cs.textContent = 'online';
      cs.className = 'conn-state online';
    }
    this.updateRoomBanner();
    if (this.pendingJoin && this.net?.welcomed) {
      const code = this.pendingJoin;
      this.pendingJoin = null;
      this.openJoin(code);
    }
  }

  /** „Du bist noch in einem Raum“ als Banner im Hauptmenü (statt Umweg über die Einstellungen). */
  updateRoomBanner() {
    const show = currentScreen() === 's-menu' && this.serverInRoom && !this.room && !this.game && !this.leaving;
    $('#menu-room-banner').hidden = !show;
  }

  fillDeckSelect(sel) {
    sel.replaceChildren(...this.store.decks.map((d, i) => h('option', { value: String(i) }, `${d.name}${validateDeck(this.db, d.slots).ok ? '' : ' (unvollständig)'}`)));
    sel.value = String(this.store.active);
  }

  renderMenuDeck() {
    this.fillDeckSelect($('#menu-deck-select'));
    const d = this.store.activeDeck();
    $('#menu-deck').replaceChildren(
      ...d.slots.map((id, i) => {
        const card = id && this.db.card(id);
        return card ? cardEl(this.db, id, { evo: EVO_SLOTS.includes(i) && !!card.evo, mini: true }) : h('div', { class: 'card empty mini' }, '—');
      }),
    );
    const ok = validateDeck(this.db, d.slots).ok;
    $('#menu-deck-meta').replaceChildren(
      h('div', { class: 'meta' }, h('b', {}, averageElixir(this.db, d.slots).toFixed(1).replace('.', ',')), h('span', {}, 'Ø Elixier')),
      h('div', { class: 'meta' }, h('b', {}, cycleCost(this.db, d.slots)), h('span', {}, '4er-Zyklus')),
      h('div', { class: `meta ${ok ? 'ok' : 'bad'}` }, h('b', {}, ok ? '✔' : '!'), h('span', {}, ok ? 'spielbereit' : 'Deck unvollständig')),
    );
  }

  requireReady() {
    if (!this.net.welcomed) {
      toast('Keine Verbindung zum Server.', 'error');
      return false;
    }
    if (!this.store.deckValid()) {
      toast('Dein aktives Deck ist unvollständig – bau es im Deck-Bauer fertig.', 'warn', 3500);
      return false;
    }
    return true;
  }

  createRoom() {
    if (!this.requireReady()) return;
    this.net.send(C2S.CREATE, { deck: this.store.activeDeck().slots });
  }

  startTraining() {
    if (!this.requireReady()) return;
    this.net.send(C2S.TRAINING, { deck: this.store.activeDeck().slots });
  }

  /** Beitreten: 6 Felder mit Auto-Weiter, Einfügen aus der Zwischenablage und klarem Fehlerzustand. */
  openJoin(prefill = '') {
    this.closeJoin();
    const boxes = Array.from({ length: 6 }, (_, i) =>
      h('input', { class: 'code-cell', maxlength: '1', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': `Zeichen ${i + 1} von 6`, 'data-code-input': '' }),
    );
    const wrap = h('div', { class: 'code-cells', role: 'group', 'aria-label': 'Einladungscode' }, boxes);
    const err = h('p', { class: 'error', role: 'alert' });
    const value = () => boxes.map((b) => b.value).join('');
    const markError = (msg) => {
      err.textContent = msg;
      wrap.classList.remove('bad');
      void wrap.offsetWidth;
      wrap.classList.add('bad');
      this.audio.sfx('error');
    };
    const setValue = (str, from = 0) => {
      const clean = String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
      for (let i = from, j = 0; i < 6 && j < clean.length; i++, j++) boxes[i].value = clean[j];
      const next = boxes.find((b) => !b.value) || boxes[5];
      next.focus();
    };
    const submit = () => {
      const code = normalizeCode(value());
      if (!isValidCodeFormat(code)) return markError(ERRORS.INVALID_CODE);
      if (!this.requireReady()) return;
      err.textContent = '';
      this.net.send(C2S.JOIN, { code, deck: this.store.activeDeck().slots });
    };
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => {
        const v = b.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        wrap.classList.remove('bad');
        err.textContent = '';
        if (v.length > 1) return setValue(v, i);
        b.value = v;
        if (v && i < 5) boxes[i + 1].focus();
      });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !b.value && i > 0) {
          e.preventDefault();
          boxes[i - 1].value = '';
          boxes[i - 1].focus();
        } else if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
        else if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
        else if (e.key === 'Enter') submit();
      });
      b.addEventListener('paste', (e) => {
        e.preventDefault();
        setValue(e.clipboardData?.getData('text') || '', i);
        if (value().length === 6) submit();
      });
      b.addEventListener('focus', () => b.select());
    });
    const body = h(
      'div',
      { class: 'join' },
      h('p', { class: 'join-lead' }, 'Gib den 6-stelligen Code deines Freundes ein:'),
      wrap,
      err,
      h('div', { class: 'row' }, h('button', { class: 'btn btn-success btn-big', onclick: submit }, 'Beitreten')),
      h('p', { class: 'hint small', style: { textAlign: 'center' } }, 'Tipp: Einfügen funktioniert direkt im ersten Feld.'),
    );
    this.joinModal = modal('Kampf beitreten', body, { onClose: () => (this.joinModal = null) });
    this.joinModal.markError = markError;
    if (prefill) {
      setValue(prefill);
      if (isValidCodeFormat(normalizeCode(prefill))) setTimeout(submit, 50);
    }
  }

  closeJoin() {
    if (this.joinModal) {
      const m = this.joinModal;
      this.joinModal = null;
      m.close();
    }
  }

  openRename() {
    const input = h('input', { class: 'text-input', maxlength: '16', value: this.store.name, 'aria-label': 'Spielername' });
    const err = h('p', { class: 'error' });
    const save = () => {
      const n = sanitizeName(input.value);
      if (!n) {
        err.textContent = ERRORS.INVALID_NAME;
        return;
      }
      this.store.name = n;
      this.store.save();
      this.net.send(C2S.NAME, { name: n });
      this.net.name = n;
      $('#menu-name').textContent = n;
      $('#menu-rename').title = `${n} – Namen ändern`;
      m.close();
    };
    input.addEventListener('keydown', (e) => e.key === 'Enter' && save());
    const m = modal('Namen ändern', h('div', {}, input, err, h('div', { class: 'row' }, h('button', { class: 'btn btn-success', onclick: save }, 'Speichern'))));
  }

  leaveRoom() {
    this.leaving = true;
    this.serverInRoom = false;
    this.result = null;
    if (!this.net.send(C2S.LEAVE)) this.pendingLeave = true;
    this.resetRoomState();
    this.goMenu();
    this.updateRoomBanner();
  }

  /** „Raum verlassen“ aus den Einstellungen – mit Rückfrage. */
  async confirmLeave() {
    const inMatch = !!(this.game && !this.game.ended);
    const known = this.inRoom();
    const text = inMatch
      ? 'Der laufende Kampf wird als Aufgabe gewertet – dein Gegner erhält 3 Kronen.'
      : known
        ? 'Du verlässt den aktuellen Raum und kehrst ins Hauptmenü zurück.'
        : 'Du bist laut Anzeige in keinem Raum. Falls du trotzdem irgendwo festhängst, wirst du jetzt daraus entfernt.';
    if (!(await confirmDialog('Raum verlassen?', text, 'Verlassen', true))) return;
    this.leaveRoom();
    toast('Du hast den Raum verlassen.', 'ok');
  }

  // ───────────── Lobby ─────────────
  onLobby(m) {
    this.closeJoin();
    this.room = m;
    if (m.state !== 'lobby' && m.state !== 'countdown') return;
    if (currentScreen() !== 's-lobby') {
      showScreen('s-lobby');
      this.audio.music('menu');
    }
    $('#lobby-title').textContent = m.training ? 'Training gegen Bot' : 'Freundschaftskampf';
    $('#lobby-codebox').hidden = !!m.training;
    $('#lobby-code').textContent = m.code;
    this.fillDeckSelect($('#lobby-deck-select'));
    const render = (el, p, side) => {
      el.className = `player-card ${side === 0 ? 'blue' : 'red'}${p ? '' : ' empty'}`;
      if (!p) {
        el.replaceChildren(h('span', { class: 'pname waiting-dots' }, 'Warte auf Gegner'), h('span', { class: 'pinfo' }, 'Teile den Code!'));
        return;
      }
      el.replaceChildren(
        h('span', { class: 'pname' }, p.name + (side === m.you ? ' (du)' : '')),
        h('span', { class: 'pinfo' }, p.deckOk ? `Deck bereit ✔ · Ø ${String(p.avg).replace('.', ',')} Elixier` : 'Deck unvollständig ✖'),
        h('span', { class: `pready${p.ready ? ' ok' : ''}` }, !p.connected ? 'getrennt …' : p.ready ? 'BEREIT' : 'wählt noch …'),
      );
    };
    render($('#lobby-p0'), m.players[0], 0);
    render($('#lobby-p1'), m.players[1], 1);
    const me = m.players[m.you];
    const btn = $('#lobby-ready');
    const counting = m.state === 'countdown';
    btn.textContent = counting ? 'Abbrechen' : me?.ready ? 'Nicht bereit' : 'Bereit!';
    btn.className = `btn btn-big ${me?.ready && !counting ? 'btn-ghost' : counting ? 'btn-secondary' : 'btn-success'}`;
    $('#lobby-deck-select').disabled = counting;
    $('#lobby-copy').disabled = counting;
    $('#lobby-share').disabled = counting;
    $('.lobby-panel').classList.toggle('is-counting', counting);
    const opp = m.players[1 - m.you];
    $('#lobby-note').textContent = counting ? 'Gleich geht’s los …' : !opp ? '' : me?.ready && !opp.ready ? `Warte, bis ${opp.name} bereit ist …` : !me?.ready && opp.ready ? `${opp.name} ist bereit – du auch?` : '';
    if (!counting) this.resetCountdown();
    clearInterval(this.expiryTimer);
    const full = m.players[0] && m.players[1];
    const end = Date.now() + m.expiresIn * 1000;
    const upd = () => {
      const left = Math.max(0, (end - Date.now()) / 1000);
      $('#lobby-expiry').textContent = full ? 'Beide Spieler sind da – drückt auf „Bereit!“' : left > 0 ? `Code gültig noch ${fmtTime(left)}` : 'Code abgelaufen';
    };
    upd();
    this.expiryTimer = setInterval(upd, 1000);
  }

  /** Countdown ersetzt das „VS“ zwischen den Spielerkarten – verdeckt nichts (B-04). */
  onCountdown(m) {
    if (m.n < 0) return this.resetCountdown();
    const vs = $('#lobby-vs');
    vs.classList.add('counting');
    $('.lobby-panel')?.classList.add('is-counting');
    vs.replaceChildren(h('span', { class: 'count-num' }, m.n > 0 ? String(m.n) : 'Los!'));
    this.audio.sfx(m.n > 0 ? 'count' : 'go');
  }

  resetCountdown() {
    const vs = $('#lobby-vs');
    if (!vs) return;
    vs.classList.remove('counting');
    vs.replaceChildren(h('span', {}, 'VS'));
    $('.lobby-panel')?.classList.remove('is-counting');
  }

  copyCode(share) {
    const code = this.room?.code;
    if (!code) return;
    const link = `${location.origin}/?code=${code}`;
    if (share && navigator.share) {
      navigator.share({ title: 'Turmtrubel', text: `Komm zu meinem Freundschaftskampf! Code: ${code}`, url: link }).catch(() => {});
      return;
    }
    const text = share ? link : code;
    const btn = $(share ? '#lobby-share' : '#lobby-copy');
    const done = () => {
      const old = btn.textContent;
      btn.textContent = 'Kopiert! ✓';
      clearTimeout(this.copyTimer);
      this.copyTimer = setTimeout(() => (btn.textContent = old === 'Kopiert! ✓' ? (share ? 'Link teilen' : 'Code kopieren') : old), 1600);
      toast(share ? 'Link kopiert!' : `Code ${code} kopiert!`, 'ok');
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => toast(text, 'info', 5000));
    else toast(text, 'info', 5000);
  }

  // ───────────── Kampf ─────────────
  onMatchInit(m) {
    this.closeJoin();
    clearInterval(this.expiryTimer);
    if (this.game && this.game.matchNo === m.matchNo && m.resume) return;
    if (this.game) this.game.destroy();
    this.result = null;
    this.game = new Game(this, m);
    this.game.ping = this.net.rtt;
    if (m.resume) return;
    showScreen('s-loading');
    $('#load-me').textContent = m.names[m.side];
    $('#load-opp').textContent = m.names[1 - m.side];
    this.drawVsTowers();
    this.startTips();
    this.loadMatch(this.game, m);
  }

  /** Echter Ladefortschritt: Schrift, Kartenbilder (auch Graustufen) und Arena-Hintergrund vorbereiten. */
  async loadMatch(game, m) {
    const t0 = performance.now();
    const bar = $('#load-bar');
    const prog = $('#load-progress');
    const status = $('#load-status');
    const ids = (m.deck || []).filter(Boolean);
    const jobs = [['Schrift', () => document.fonts?.ready]];
    for (const id of ids) {
      jobs.push(['Karten', () => cardArt(this.db, id, false)]);
      jobs.push(['Karten', () => cardArtGray(this.db, id, false)]);
      if (this.db.card(id)?.evo) jobs.push(['Karten', () => (cardArt(this.db, id, true), cardArtGray(this.db, id, true))]);
    }
    jobs.push(['Arena', () => game.prepare()]);
    for (let i = 0; i < jobs.length; i++) {
      if (this.game !== game) return;
      status.textContent = `Lade ${jobs[i][0]} …`;
      await jobs[i][1]();
      const k = (i + 1) / jobs.length;
      bar.style.transform = `scaleX(${k})`;
      prog.setAttribute('aria-valuenow', String(Math.round(k * 100)));
      if (i % 3 === 2) await new Promise((r) => requestAnimationFrame(r));
    }
    if (this.game !== game) return;
    status.textContent = m.training ? 'Bereit!' : 'Bereit! Warte auf deinen Gegner …';
    // Die VS-Einblendung darf ausspielen (≈ 1,2 s), danach melden wir „geladen“
    const wait = Math.max(0, 1200 - (performance.now() - t0));
    setTimeout(() => this.game === game && this.net.send(C2S.LOADED), reducedMotion() ? 0 : wait);
  }

  /** Burgturm-Vorschau in Teamfarbe für den VS-Screen (kein Gegner-Deck, §4 Fairness). */
  drawVsTowers() {
    for (const [id, team] of [['#load-tower-me', 'blue'], ['#load-tower-opp', 'red']]) {
      const cv = $(id);
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      drawTower(c, { x: cv.width / 2, y: cv.height * 0.64, U: 46, king: true, team, t: 0, quality: 2 });
    }
  }

  startTips() {
    const el = $('#load-tip');
    let i = Math.floor(Math.random() * TIPS.length);
    el.textContent = TIPS[i];
    el.classList.remove('fade');
    clearInterval(this.tipTimer);
    this.tipTimer = setInterval(() => {
      if (currentScreen() !== 's-loading') return clearInterval(this.tipTimer);
      el.classList.add('fade');
      setTimeout(() => {
        i = (i + 1) % TIPS.length;
        el.textContent = TIPS[i];
        el.classList.remove('fade');
      }, 220);
    }, 3200);
  }

  onMatchStart() {
    if (!this.game) return;
    clearInterval(this.tipTimer);
    this.resetCountdown();
    showScreen('s-game');
    this.game.start();
    this.audio.music('battle');
    const hint = $('#rotate-hint');
    if (window.innerWidth < 600 && window.innerHeight > window.innerWidth) {
      hint.hidden = false;
      setTimeout(() => (hint.hidden = true), 4500);
    }
  }

  onMatchEnd(m) {
    this.result = m;
    const win = m.winner === m.you;
    const draw = m.winner == null;
    this.audio.music(null);
    setTimeout(() => this.audio.sfx(draw ? 'draw' : win ? 'win' : 'lose'), 300);
    this.haptic(win ? [15, 60, 15] : 20);
    if (this.game && currentScreen() === 's-game') {
      this.game.onEnd(m);
      const g = this.game;
      setTimeout(() => {
        if (this.game === g && this.result === m) this.showResult(m);
      }, 2600);
    } else this.showResult(m);
  }

  showResult(m) {
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
    const you = m.you;
    const opp = 1 - you;
    const win = m.winner === you;
    const draw = m.winner == null;
    const title = $('#res-title');
    title.textContent = draw ? 'Unentschieden' : win ? 'Sieg!' : 'Niederlage';
    title.className = `result-title${draw ? ' draw' : win ? '' : ' lose'}`;
    $('#res-reason').textContent = m.reasonText + (m.training ? ' · Training' : '');
    $('#res-sub').textContent = draw ? 'Gleichstand – Zeit für eine Revanche?' : win ? 'Stark gespielt!' : 'Knapp daneben – beim nächsten Mal klappt’s!';
    $('#s-result').dataset.outcome = draw ? 'draw' : win ? 'win' : 'lose';
    $('#res-me').textContent = m.names[you] + ' (du)';
    $('#res-opp').textContent = m.names[opp];
    const crownSvg = (on, delay) => {
      const el = h('span', { class: on ? 'on' : '', style: { animationDelay: `${delay}s` } });
      el.innerHTML = `<svg viewBox="0 0 46 40"><path d="M4 34V12l10 9 9-16 9 16 10-9v22z" fill="${on ? '#ffd84d' : '#3a3358'}" stroke="#1c1830" stroke-width="3.5" stroke-linejoin="round"/>${on ? '<rect x="8" y="27" width="30" height="4" fill="rgba(255,255,255,.5)"/>' : ''}</svg>`;
      return el;
    };
    let d = 0.5;
    const crowns = (n, root) => {
      root.replaceChildren();
      for (let i = 0; i < 3; i++) {
        root.append(crownSvg(i < n, i < n ? d : 0));
        if (i < n) {
          const delay = d;
          setTimeout(() => this.audio.sfx('crown', 0.7), delay * 1000);
          d += 0.25;
        }
      }
    };
    crowns(m.crowns[opp], $('#res-crowns-opp'));
    crowns(m.crowns[you], $('#res-crowns-me'));
    document.querySelector('.res-side.red').classList.toggle('winner', m.winner === opp);
    document.querySelector('.res-side.blue').classList.toggle('winner', m.winner === you);
    const st = m.stats?.[you] || {};
    const stat = (v, label) => h('div', { class: 'res-stat' }, h('b', { class: 'num', dataset: { to: String(Math.round(v ?? 0)) } }, reducedMotion() ? Math.round(v ?? 0) : 0), label);
    $('#res-stats').replaceChildren(stat(st.played, 'Karten gespielt'), stat(st.spent, 'Elixier ausgegeben'), stat(st.towerDamage, 'Turmschaden'));
    if (!reducedMotion()) this.countUp($('#res-stats'), 600, d * 1000 + 200);
    const btn = $('#res-rematch');
    btn.disabled = !m.rematchAvailable;
    btn.textContent = '↻ Rematch';
    $('#res-rematch-status').textContent = m.rematchAvailable ? (m.training ? 'Der Bot ist jederzeit bereit.' : 'Beide müssen zustimmen.') : 'Dein Gegner hat den Raum verlassen.';
    showScreen('s-result');
    // Konfetti nur bei Sieg, ab Qualität „Mittel“ und ohne reduzierte Bewegung
    if (win && this.settings.quality !== 'low' && !reducedMotion()) this.confetti();
  }

  /** Zahlen von 0 hochzählen (tabellarische Ziffern, 600 ms). */
  countUp(root, ms, delay = 0) {
    const els = [...root.querySelectorAll('[data-to]')];
    const t0 = performance.now() + delay;
    const tick = () => {
      const k = Math.min(1, Math.max(0, (performance.now() - t0) / ms));
      const e = 1 - Math.pow(1 - k, 3);
      for (const el of els) el.textContent = String(Math.round(Number(el.dataset.to) * e));
      if (k < 1 && currentScreen() === 's-result') requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  onRematchState(m) {
    // Kommt vor dem Ergebnis-Screen an (z. B. Gegner verlässt den Kampf) → fürs Anzeigen merken
    if (this.result && !m.available) this.result.rematchAvailable = false;
    if (currentScreen() !== 's-result' || !this.result) return;
    const you = this.result.you;
    const btn = $('#res-rematch');
    const status = $('#res-rematch-status');
    if (!m.available) {
      btn.disabled = true;
      status.textContent = 'Dein Gegner hat den Raum verlassen.';
      return;
    }
    if (m.want[you] && m.want[1 - you]) status.textContent = 'Rematch! Es geht gleich los …';
    else if (m.want[1 - you]) {
      status.textContent = '🔥 Dein Gegner möchte ein Rematch!';
      this.audio.sfx('emote');
    } else if (m.want[you]) status.textContent = 'Warte auf Zustimmung deines Gegners …';
  }

  confetti() {
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const W = (cv.width = cv.clientWidth);
    const H = (cv.height = cv.clientHeight);
    const colors = ['#ff4d57', '#3d8bff', '#ffd84d', '#5ad16a', '#c25bd6', '#ffffff'];
    const parts = Array.from({ length: 160 }, () => ({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.6,
      vx: (Math.random() - 0.5) * 2,
      vy: 2 + Math.random() * 3,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: 6 + Math.random() * 8,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    const tick = () => {
      if (currentScreen() !== 's-result' || performance.now() - t0 > 6000) {
        ctx.clearRect(0, 0, W, H);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      requestAnimationFrame(tick);
    };
    tick();
  }
}

const app = new App();
window.turmtrubel = app;
app.boot();
