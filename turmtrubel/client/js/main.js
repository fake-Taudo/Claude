// Einstiegspunkt: lädt Daten, verbindet zum Server und steuert alle Screens.
import { createDb, validateDeck, averageElixir, cycleCost, EVO_SLOTS } from '/shared/cards.js';
import { C2S, S2C, ERRORS, normalizeCode, isValidCodeFormat, sanitizeName } from '/shared/protocol.js';
import { Net } from './net.js';
import { AudioSys } from './audio.js';
import { Store } from './store.js';
import { $, h, showScreen, currentScreen, toast, modal, confirmDialog, fmtTime } from './ui/dom.js';
import { cardEl } from './ui/cardview.js';
import { prerenderAll } from './ui/art.js';
import { DeckBuilder } from './ui/deckbuilder.js';
import { openSettings } from './ui/settings.js';
import { applyBodyFlags } from './ui/tokens.js';
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
      if (e.target.closest?.('.btn, .icon-btn, .chip, .deck-tab, .fchip')) this.audio.sfx('click', 0.6);
    });

    $('#name-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const n = sanitizeName($('#name-input').value);
      if (!n) {
        $('#name-error').textContent = ERRORS.INVALID_NAME;
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

    const gm = $('#game-menu');
    $('#game-menu-btn').addEventListener('click', () => {
      gm.hidden = !gm.hidden;
      this.updateGameMenu();
    });
    $('#gm-sound').addEventListener('click', () => {
      this.settings.sfx = !this.settings.sfx;
      this.store.save();
      this.audio.apply();
      this.updateGameMenu();
    });
    $('#gm-music').addEventListener('click', () => {
      this.settings.music = !this.settings.music;
      this.store.save();
      this.audio.apply();
      this.updateGameMenu();
    });
    $('#gm-settings').addEventListener('click', () => {
      gm.hidden = true;
      openSettings(this, { allowRename: false });
    });
    $('#gm-surrender').addEventListener('click', async () => {
      gm.hidden = true;
      if (await confirmDialog('Aufgeben?', 'Willst du den Kampf wirklich aufgeben? Dein Gegner erhält 3 Kronen.', 'Aufgeben', true)) this.net.send(C2S.SURRENDER);
    });
  }

  updateGameMenu() {
    $('#gm-sound').textContent = this.settings.sfx ? '🔊 Ton an' : '🔇 Ton aus';
    $('#gm-music').textContent = this.settings.music ? '🎵 Musik an' : '🎵 Musik aus';
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
      if (m.code === 'ALREADY_IN_ROOM') this.serverInRoom = true;
      if (this.joinModal) {
        const err = this.joinModal.el.querySelector('.error');
        if (err) err.textContent = m.message;
        this.audio.sfx('error');
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
      if (m.reason !== 'left') {
        if (m.message) toast(m.message, 'warn', 4000);
        if (wasIn || currentScreen() !== 's-menu') this.goMenu();
      }
    });
  }

  resetRoomState() {
    this.room = null;
    clearInterval(this.expiryTimer);
    $('#countdown').classList.remove('show');
    if (this.game) {
      this.game.destroy();
      this.game = null;
    }
  }

  // ───────────── Menü ─────────────
  goMenu() {
    this.closeJoin();
    $('#menu-name').textContent = this.store.name;
    this.renderMenuDeck();
    showScreen('s-menu');
    this.audio.music('menu');
    const cs = $('#conn-state');
    if (this.net?.welcomed) {
      cs.textContent = 'online';
      cs.className = 'conn-state online';
    }
    if (this.pendingJoin && this.net?.welcomed) {
      const code = this.pendingJoin;
      this.pendingJoin = null;
      this.openJoin(code);
    }
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
      h('span', {}, 'Ø Elixier ', h('b', {}, averageElixir(this.db, d.slots).toFixed(1).replace('.', ','))),
      h('span', {}, '4er-Zyklus ', h('b', {}, cycleCost(this.db, d.slots))),
      ok ? h('span', { class: 'ok' }, '✔ spielbereit') : h('span', { class: 'bad' }, '✖ unvollständig'),
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

  openJoin(prefill = '') {
    this.closeJoin();
    const input = h('input', { class: 'text-input join-code-input', maxlength: '7', placeholder: 'ABC123', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Einladungscode', value: prefill });
    const err = h('p', { class: 'error', role: 'alert' });
    const submit = () => {
      const code = normalizeCode(input.value);
      if (!isValidCodeFormat(code)) {
        err.textContent = ERRORS.INVALID_CODE;
        this.audio.sfx('error');
        return;
      }
      if (!this.requireReady()) return;
      err.textContent = '';
      this.net.send(C2S.JOIN, { code, deck: this.store.activeDeck().slots });
    };
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      err.textContent = '';
    });
    input.addEventListener('keydown', (e) => e.key === 'Enter' && submit());
    const body = h('div', {}, h('p', { style: { fontWeight: 800, marginTop: 0 } }, 'Gib den 6-stelligen Code deines Freundes ein:'), input, err, h('div', { class: 'row' }, h('button', { class: 'btn btn-success btn-big', onclick: submit }, 'Beitreten')));
    this.joinModal = modal('Kampf beitreten', body, { onClose: () => (this.joinModal = null) });
    if (prefill && isValidCodeFormat(prefill)) setTimeout(submit, 50);
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
    btn.textContent = me?.ready ? 'Nicht bereit' : 'Bereit!';
    btn.classList.toggle('is-ready', !!me?.ready);
    $('#lobby-deck-select').disabled = m.state === 'countdown';
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

  onCountdown(m) {
    const el = $('#countdown');
    if (m.n < 0) {
      el.classList.remove('show');
      return;
    }
    el.classList.add('show');
    el.replaceChildren(h('span', {}, m.n > 0 ? String(m.n) : 'Los!'));
    this.audio.sfx(m.n > 0 ? 'count' : 'go');
    if (m.n === 0) setTimeout(() => el.classList.remove('show'), 800);
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
    const done = () => toast(share ? 'Link kopiert!' : `Code ${code} kopiert!`, 'ok');
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
    $('#load-tip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    const bar = $('#load-bar');
    bar.style.transform = 'scaleX(0)';
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 1400);
      bar.style.transform = `scaleX(${k})`;
      if (k < 1) requestAnimationFrame(step);
      else this.net.send(C2S.LOADED);
    };
    requestAnimationFrame(step);
  }

  onMatchStart() {
    if (!this.game) return;
    $('#countdown').classList.remove('show');
    $('#game-menu').hidden = true;
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
          d += 0.35;
        }
      }
    };
    crowns(m.crowns[opp], $('#res-crowns-opp'));
    crowns(m.crowns[you], $('#res-crowns-me'));
    document.querySelector('.res-side.red').classList.toggle('winner', m.winner === opp);
    document.querySelector('.res-side.blue').classList.toggle('winner', m.winner === you);
    const st = m.stats?.[you] || {};
    $('#res-stats').replaceChildren(
      h('div', { class: 'res-stat' }, h('b', {}, st.played ?? 0), 'Karten gespielt'),
      h('div', { class: 'res-stat' }, h('b', {}, st.spent ?? 0), 'Elixier ausgegeben'),
      h('div', { class: 'res-stat' }, h('b', {}, st.towerDamage ?? 0), 'Turmschaden'),
    );
    const btn = $('#res-rematch');
    btn.disabled = !m.rematchAvailable;
    btn.textContent = '↻ Rematch';
    $('#res-rematch-status').textContent = m.rematchAvailable ? (m.training ? 'Der Bot ist jederzeit bereit.' : 'Beide müssen zustimmen.') : 'Dein Gegner hat den Raum verlassen.';
    showScreen('s-result');
    if (win) this.confetti();
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
