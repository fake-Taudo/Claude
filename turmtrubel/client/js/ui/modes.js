// Hauptmenü-Bereich „Spielmodi“: Kacheln mit Icon, Name, Kurzbeschreibung und Spielerzahl,
// je „Mit Freunden (Code)“ und „Gegen Bot“, dazu die Bot-Stärke. Außerdem der Regel-Hinweis pro Modus.
import { h, modal } from './dom.js';
import { icon, hasIcon } from './icons.js';
import { seg } from './settings.js';
import { t } from '../lang/de.js';
import { chaosInfo } from './perks.js';

const ico = (name) => (hasIcon(name) ? icon(name) : icon('swords'));

/** Kachel-Raster und Bot-Stärke im Menü aufbauen. */
export function renderModes(app) {
  const grid = document.getElementById('mode-grid');
  const diffRoot = document.getElementById('mode-difficulty');
  if (!grid || !app.modes) return;
  const s = app.settings;
  diffRoot.replaceChildren(
    h('span', { class: 'mode-diff-label' }, ico('target'), t('botStrength')),
    seg(['easy', 'medium', 'hard'].map((k) => [k, t(`difficulty.${k}`)]), s.botDifficulty || 'medium', t('botStrength'), (v) => {
      s.botDifficulty = v;
      app.store.save();
      diffHint.textContent = t(`difficultyHint.${v}`);
    }),
  );
  const diffHint = h('span', { class: 'hint small mode-diff-hint' }, t(`difficultyHint.${s.botDifficulty || 'medium'}`));
  diffRoot.append(diffHint);
  grid.replaceChildren(
    ...app.modes.list.map((m, i) => {
      const classic = m.id === app.modes.defaultId;
      const botBtn = h(
        'button',
        {
          class: 'btn btn-small btn-success mode-bot',
          disabled: !m.botsAllowed,
          title: m.botsAllowed ? `${m.name} ${t('vsBot')}` : t('onlyMultiplayerTip'),
          'aria-describedby': m.botsAllowed ? null : `mode-mp-${m.id}`,
          onclick: () => app.startTraining(m.id),
        },
        ico('target'),
        t('vsBot'),
      );
      return h(
        'article',
        { class: `mode-tile${classic ? ' classic' : ''}`, dataset: { mode: m.id }, style: { '--i': i } },
        h(
          'div',
          { class: 'mode-head' },
          h('span', { class: 'mode-ico', 'aria-hidden': 'true' }, ico(m.icon)),
          h(
            'div',
            { class: 'mode-titles' },
            h('h3', { class: 'mode-name' }, m.name, classic ? h('span', { class: 'mode-badge' }, t('classicBadge')) : null),
            h('span', { class: 'mode-players' }, ico('group'), t('players', { n: m.players }), m.deckSource === 'draft' ? [' · ', ico('cards'), 'Draft'] : null),
          ),
          h('button', { class: 'icon-btn mode-info', title: t('rulesButton'), 'aria-label': `${t('rulesButton')}: ${m.name}`, onclick: () => showModeRules(app, m, { force: true }) }, ico('search')),
        ),
        h('p', { class: 'mode-desc' }, m.short),
        h(
          'div',
          { class: 'mode-actions' },
          h('button', { class: 'btn btn-small btn-primary mode-friends', title: `${m.name} ${t('withFriends')}`, onclick: () => app.createRoom(m.id) }, ico('key'), t('withFriends')),
          botBtn,
        ),
        m.botsAllowed ? null : h('span', { class: 'mode-mp', id: `mode-mp-${m.id}` }, ico('group'), t('onlyMultiplayer')),
        m.chaos ? chaosDeckRow(app) : null,
      );
    }),
  );
}

/** Chaos-Kachel: eigenes Deck (nur Pool-Karten) mit Status und Knopf zum Chaos-Deckbau. */
function chaosDeckRow(app) {
  const st = app.store;
  const d = st.activeChaosDeck();
  const ok = st.chaosDeckValid();
  return h(
    'div',
    { class: 'mode-chaos-deck' },
    h('span', { class: `mode-chaos-status${ok ? ' ok' : ' bad'}` }, ico(ok ? 'check' : 'cross'), ok ? d.name : 'Chaos-Deck unvollständig'),
    h('button', { class: 'btn btn-small btn-accent mode-chaos-btn', title: 'Chaos-Deck bauen (nur Karten aus dem Chaos-Pool)', onclick: () => app.deckBuilder.open(null, 'chaos') }, ico('cards'), 'Chaos-Deck'),
  );
}

/**
 * Regel-Hinweis vor dem ersten Spiel eines Modus (später abschaltbar). Klassisch braucht keinen Hinweis.
 * Gibt ein Promise zurück, das nach dem Schließen auflöst.
 */
export function showModeRules(app, mode, { force = false } = {}) {
  const s = app.settings;
  if (!mode) return Promise.resolve();
  if (!force && (mode.id === app.modes?.defaultId || s.hideModeInfo?.[mode.id])) return Promise.resolve();
  return new Promise((resolve) => {
    const box = h('input', { type: 'checkbox', id: 'mode-info-hide', checked: !!s.hideModeInfo?.[mode.id] });
    const body = h(
      'div',
      { class: 'mode-rules' },
      h('div', { class: 'mode-rules-hero' }, h('span', { class: 'mode-ico big', 'aria-hidden': 'true' }, ico(mode.icon)), h('p', {}, mode.description)),
      h(
        'ul',
        { class: 'mode-rule-list' },
        (mode.rules || []).map((r, i) => h('li', { style: { '--i': i } }, h('span', { class: 'rule-num' }, String(i + 1)), h('span', {}, r))),
      ),
      mode.chaos ? chaosInfo(app) : null,
      mode.id === app.modes?.defaultId ? null : h('label', { class: 'mode-rules-hide' }, box, h('span', {}, t('rulesHide'))),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-success btn-big', onclick: () => m.close() }, t('rulesGo'))),
    );
    const m = modal(t('rulesTitle', { name: mode.name }), body, {
      onClose: () => {
        if (mode.id !== app.modes?.defaultId) {
          s.hideModeInfo = { ...(s.hideModeInfo || {}), [mode.id]: !!box.checked };
          app.store.save();
        }
        resolve();
      },
    });
    m.el.classList.add('mode-rules-modal');
    if (mode.chaos) m.el.classList.add('wide');
  });
}

/** Modus-Abzeichen (Icon + Name) für Lobby, Ladebildschirm und Ergebnis. */
export function modeBadge(mode) {
  if (!mode) return null;
  return h('span', { class: 'mode-pill' }, ico(mode.icon), mode.name);
}
