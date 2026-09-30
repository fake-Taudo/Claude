// Einstellungen, gruppiert: Audio · Grafik & Anzeige · Spiel · Konto (B-17). Änderungen wirken sofort.
import { h, ico, modal } from './dom.js';
import { applyBodyFlags } from './tokens.js';

function toggle(on, label, onChange) {
  const b = h('button', { class: `toggle${on ? ' on' : ''}`, role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label });
  b.addEventListener('click', () => {
    const v = !b.classList.contains('on');
    b.classList.toggle('on', v);
    b.setAttribute('aria-checked', v ? 'true' : 'false');
    onChange(v);
  });
  return b;
}

function seg(options, value, label, onChange) {
  const root = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': label });
  for (const [k, text] of options) {
    const b = h('button', { class: k === value ? 'on' : '', role: 'radio', 'aria-checked': k === value ? 'true' : 'false' }, text);
    b.addEventListener('click', () => {
      for (const x of root.children) {
        x.classList.remove('on');
        x.setAttribute('aria-checked', 'false');
      }
      b.classList.add('on');
      b.setAttribute('aria-checked', 'true');
      onChange(k);
    });
    root.append(b);
  }
  return root;
}

function slider(value, label, onChange) {
  const i = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(value), 'aria-label': label });
  const out = h('output', { 'aria-hidden': 'true' });
  const show = () => {
    const pct = Math.round(Number(i.value) * 100);
    out.textContent = `${pct} %`;
    i.style.setProperty('--fill', `${pct}%`);
    i.setAttribute('aria-valuetext', `${pct} Prozent`);
  };
  show();
  i.addEventListener('input', () => {
    show();
    onChange(Number(i.value));
  });
  return h('span', { class: 'slider' }, i, out);
}

/** Zeile: Label (+ Beschreibung) links, Steuerelement rechts – oder darunter (wide). */
function row(label, control, { desc, wide } = {}) {
  return h('div', { class: `set-row${wide ? ' wide' : ''}` }, h('div', { class: 'set-label' }, h('span', {}, label), desc ? h('small', {}, desc) : null), control);
}

const QUALITY_DESC = {
  low: 'Keine Partikel-Extras, keine Unschärfe – spart Akku auf älteren Geräten.',
  medium: 'Standard-Animationen ohne Unschärfe-Effekte.',
  high: 'Alle Effekte inklusive Konfetti und weichem Hintergrund.',
};
const ORIENT_DESC = {
  auto: 'Wählt automatisch die größte Arena – am Desktop und Handy quer meist gedreht.',
  portrait: 'Arena immer hochkant (Hand unten bzw. Karten rechts).',
  rotated: 'Arena immer quer mit Kartenpanel rechts.',
};

export function openSettings(app, { allowRename = true } = {}) {
  const s = app.settings;
  const save = () => {
    app.store.save();
    applyBodyFlags(s);
    app.audio.apply();
    app.game?.settingsChanged();
  };
  const qDesc = h('small', {}, QUALITY_DESC[s.quality]);
  const oDesc = h('small', {}, ORIENT_DESC[s.orientation]);
  const inMatch = !!(app.game && !app.game.ended);
  const group = (title, ...rows) => h('section', { class: 'set-group' }, h('h3', {}, title), ...rows);
  const withDesc = (label, control, descEl) => h('div', { class: 'set-row wide' }, h('div', { class: 'set-label' }, h('span', {}, label), descEl), control);
  const body = h(
    'div',
    { class: 'settings' },
    group(
      'Audio',
      row('🎵 Musik', toggle(s.music, 'Musik', (v) => ((s.music = v), save()))),
      row('Musik-Lautstärke', slider(s.musicVol, 'Musik-Lautstärke', (v) => ((s.musicVol = v), save()))),
      row(
        '🔊 Soundeffekte',
        toggle(s.sfx, 'Soundeffekte', (v) => {
          s.sfx = v;
          save();
          if (v) app.audio.sfx('click');
        }),
      ),
      row('Effekt-Lautstärke', slider(s.sfxVol, 'Effekt-Lautstärke', (v) => ((s.sfxVol = v), save()))),
    ),
    group(
      'Grafik & Anzeige',
      withDesc(
        '✨ Grafikqualität',
        seg([['low', 'Niedrig'], ['medium', 'Mittel'], ['high', 'Hoch']], s.quality, 'Grafikqualität', (v) => {
          s.quality = v;
          qDesc.textContent = QUALITY_DESC[v];
          save();
        }),
        qDesc,
      ),
      withDesc(
        '📱 Arena-Ausrichtung',
        seg([['auto', 'Auto'], ['portrait', 'Hochkant'], ['rotated', 'Quer']], s.orientation, 'Arena-Ausrichtung', (v) => {
          s.orientation = v;
          oDesc.textContent = ORIENT_DESC[v];
          save();
        }),
        oDesc,
      ),
      row('Schadenszahlen', toggle(s.dmgNumbers, 'Schadenszahlen', (v) => ((s.dmgNumbers = v), save()))),
      row('Ping anzeigen', toggle(s.showPing, 'Ping anzeigen', (v) => ((s.showPing = v), save()))),
    ),
    group(
      'Spiel',
      row('Gegner-Emotes stummschalten', toggle(s.muteEmotes, 'Gegner-Emotes stummschalten', (v) => ((s.muteEmotes = v), save()))),
      row('📳 Vibration', toggle(s.haptics, 'Vibration', (v) => ((s.haptics = v), save())), { desc: 'Kurzes Feedback beim Ausspielen, bei Fehlern und Kronen (falls vom Gerät unterstützt).' }),
    ),
    group(
      'Konto',
      h(
        'div',
        { class: 'row wrap set-actions' },
        allowRename ? h('button', { class: 'btn btn-small btn-secondary', onclick: () => (m.close(), app.openRename()) }, ico('✎'), 'Namen ändern') : null,
        h('button', { class: 'btn btn-small btn-danger', id: 'settings-leave', onclick: () => (m.close(), app.confirmLeave()) }, ico('🚪'), 'Raum verlassen'),
      ),
      h('p', { class: 'hint small set-hint' }, inMatch ? 'Achtung: Im laufenden Kampf zählt Verlassen als Aufgabe.' : app.inRoom() ? 'Du bist gerade in einem Raum.' : 'Hilft auch, wenn du in einem alten Raum festhängst.'),
    ),
  );
  const m = modal('Einstellungen', body);
  return m;
}
