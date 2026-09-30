// Einstellungen: Ton, Musik, Grafikqualität, Arena-Ausrichtung, Anzeigen.
import { h, modal } from './dom.js';

function toggle(on, onChange) {
  const b = h('button', { class: `toggle${on ? ' on' : ''}`, role: 'switch', 'aria-checked': on ? 'true' : 'false' });
  b.addEventListener('click', () => {
    const v = !b.classList.contains('on');
    b.classList.toggle('on', v);
    b.setAttribute('aria-checked', v ? 'true' : 'false');
    onChange(v);
  });
  return b;
}

function seg(options, value, onChange) {
  const root = h('div', { class: 'seg', role: 'radiogroup' });
  for (const [k, label] of options) {
    const b = h('button', { class: k === value ? 'on' : '', role: 'radio', 'aria-checked': k === value ? 'true' : 'false' }, label);
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

function slider(value, onChange) {
  const i = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(value), 'aria-label': 'Lautstärke' });
  i.addEventListener('input', () => onChange(Number(i.value)));
  return i;
}

export function openSettings(app, { allowRename = true } = {}) {
  const s = app.settings;
  const save = () => {
    app.store.save();
    app.audio.apply();
    app.game?.settingsChanged();
  };
  const body = h(
    'div',
    {},
    h(
      'div',
      { class: 'settings-grid' },
      h('span', {}, '🎵 Musik'),
      toggle(s.music, (v) => {
        s.music = v;
        save();
      }),
      h('span', {}, 'Musik-Lautstärke'),
      slider(s.musicVol, (v) => {
        s.musicVol = v;
        save();
      }),
      h('span', {}, '🔊 Soundeffekte'),
      toggle(s.sfx, (v) => {
        s.sfx = v;
        save();
        if (v) app.audio.sfx('click');
      }),
      h('span', {}, 'Effekt-Lautstärke'),
      slider(s.sfxVol, (v) => {
        s.sfxVol = v;
        save();
      }),
      h('span', {}, '✨ Grafikqualität'),
      seg([['low', 'Niedrig'], ['medium', 'Mittel'], ['high', 'Hoch']], s.quality, (v) => {
        s.quality = v;
        save();
      }),
      h('span', {}, '📱 Arena-Ausrichtung'),
      seg([['auto', 'Auto'], ['portrait', 'Hochkant'], ['rotated', 'Quer']], s.orientation, (v) => {
        s.orientation = v;
        save();
      }),
      h('span', {}, 'Schadenszahlen'),
      toggle(s.dmgNumbers, (v) => {
        s.dmgNumbers = v;
        save();
      }),
      h('span', {}, 'Ping anzeigen'),
      toggle(s.showPing, (v) => {
        s.showPing = v;
        save();
      }),
    ),
    h('p', { class: 'hint small', style: { marginTop: '12px' } }, '„Auto“ nutzt auf Handys im Querformat eine gedrehte Arena, damit alles gut lesbar bleibt. „Niedrig“ spart Akku auf älteren Geräten.'),
    allowRename ? h('div', { class: 'row' }, h('button', { class: 'btn btn-small btn-blue', onclick: () => (m.close(), app.openRename()) }, '✎ Namen ändern')) : null,
  );
  const m = modal('Einstellungen', body);
  return m;
}
