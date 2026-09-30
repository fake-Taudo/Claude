// Karten als DOM-Elemente + Detailansicht mit allen Werten.
import { TARGET_LABELS, TYPE_LABELS, CLASS_LABELS } from '/shared/cards.js';
import { h, modal } from './dom.js';
import { cardArtURL } from './art.js';

// Weiche Trennstellen für lange zusammengesetzte Namen (nur Anzeige, Kartendaten bleiben unverändert)
const PARTS = ['Zwillings', 'Brumm', 'Knochen', 'Schleuder', 'Flatter', 'Flammen', 'Pulver', 'Funken', 'Armbrust', 'Schnetzel', 'Wirbel', 'Schild', 'Borsten', 'Stein', 'Kräuter', 'Bomben', 'Frost', 'Tunnel', 'Weit', 'Donner', 'Wichtel', 'Elixier', 'Glut', 'Belagerungs', 'Kometen', 'Gewitter', 'Kriegs', 'Ketten', 'Klingen', 'Spiegel', 'Wurzel', 'Schatten', 'Sturm', 'Nebel', 'Flug'];
export function softHyphens(name) {
  return name.replace(/[A-Za-zÄÖÜäöüß]{9,}/g, (w) => {
    let out = w;
    for (const p of PARTS) {
      if (out.startsWith(p) && out.length - p.length >= 3) {
        out = p + '\u00AD' + out.slice(p.length).replace(/^(schild)/, 'schild\u00AD');
        break;
      }
    }
    return out;
  });
}

export function cardEl(db, id, opts = {}) {
  const card = db.card(id);
  if (!card) return h('div', { class: 'card empty' }, opts.emptyLabel || '');
  const evo = !!opts.evo && !!card.evo;
  const cls = ['card', `r-${card.rarity}`];
  if (card.class !== 'normal') cls.push(`c-${card.class}`);
  if (evo) cls.push('evo');
  if (opts.mini) cls.push('mini');
  if (opts.inDeck) cls.push('in-deck');
  const el = h(
    'div',
    { class: cls.join(' '), tabindex: opts.onClick ? '0' : null, role: opts.onClick ? 'button' : null, title: card.name, 'aria-label': `${card.name}, ${card.elixir} Elixier`, dataset: { id } },
    h('img', { src: cardArtURL(db, id, evo), alt: '', draggable: 'false' }),
    h('div', { class: 'cost' }, card.elixir),
    opts.hideName ? null : h('div', { class: `name${(evo ? card.evo.name || card.name : card.name).length > 15 ? ' long' : ''}` }, softHyphens(evo ? card.evo.name || card.name : card.name)),
    evo ? h('div', { class: 'badge' }, 'EVO') : card.class === 'champion' ? h('div', { class: 'badge champion' }, '★') : card.class === 'hero' ? h('div', { class: 'badge hero' }, 'HELD') : card.evo && opts.showEvoHint ? h('div', { class: 'badge' }, 'evo') : null,
  );
  if (opts.onClick) {
    el.addEventListener('click', () => opts.onClick(id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        opts.onClick(id);
      }
    });
  }
  return el;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100).replace('.', ',');
}

function speedLabel(v) {
  if (v <= 0) return '–';
  if (v < 0.9) return `langsam (${fmt(v)})`;
  if (v < 1.25) return `mittel (${fmt(v)})`;
  if (v < 1.75) return `schnell (${fmt(v)})`;
  return `sehr schnell (${fmt(v)})`;
}

/** Zeilen: [Label, Text, { i: Icon, k: Schlüssel, n: Zahl für relativen Balken }] */
export function statsRows(db, card, evo = false) {
  const rows = [];
  const add = (label, text, i, k, n) => rows.push([label, text, { i, k, n }]);
  if (card.type === 'spell') {
    const s = db.spell(card, evo);
    if (s.damage) add(s.pulse ? `Schaden pro ${fmt(s.pulse)} s` : 'Schaden', fmt(s.damage), '⚔', 'dmg', s.damage);
    if (s.towerDamage != null && s.damage) add('Schaden an Kronentürmen', `${Math.round(s.towerDamage * 100)} %`, '🏰');
    if (s.radius) add('Radius', fmt(s.radius), '◎', 'radius', s.radius);
    if (s.duration) add('Dauer', `${fmt(s.duration)} s`, '⌛', 'duration', s.duration);
    if (s.stun) add('Betäubung', `${fmt(s.stun)} s`, '⚡');
    if (s.slow) add('Verlangsamung', `${Math.round(s.slow.amount * 100)} %${s.slow.duration ? ` (${fmt(s.slow.duration)} s)` : ''}`, '❄');
    if (s.heal) add(`Heilung pro ${fmt(s.pulse || 1)} s`, fmt(s.heal), '✚');
    if (s.rage) add('Tempo-Bonus', `+${Math.round((s.rage.mult - 1) * 100)} %`, '💢');
    if (s.knockback) add('Rückstoß', fmt(s.knockback), '💨');
    if (s.chain) add('Ketten-Ziele', s.chain.count, '⛓');
    if (s.strikes) add('Blitze', s.strikes, '⚡');
    if (s.roll) add('Rollweite', `${fmt(s.roll.length)} Felder`, '➜');
    if (s.spawn) add('Beschwört', `${s.spawn.count}× ${db.unit(s.spawn.unit).name}`, '👥');
    if (s.graveyard) add('Beschwört', `${s.graveyard.count}× ${db.unit(s.graveyard.unit).name}`, '👥');
    if (s.delay) add('Flugzeit', `${fmt(s.delay)} s`, '✈');
    return rows;
  }
  const u = db.unit(db.unitRefOf(card), evo);
  const count = card.count || 1;
  add('Leben', fmt(u.hp) + (count > 1 ? ` (×${count})` : ''), '❤', 'hp', u.hp);
  if (u.traits.ramp) add('Schaden', u.traits.ramp.stages.map(fmt).join(' → '), '⚔', 'dmg', u.traits.ramp.stages.at(-1));
  else if (u.damage) add(u.splash ? 'Flächenschaden' : 'Schaden', fmt(u.damage), u.splash ? '💥' : '⚔', 'dmg', u.damage);
  if (u.damage || u.traits.ramp) {
    const dps = Math.round((u.traits.ramp ? u.traits.ramp.stages.at(-1) : u.damage) / u.hitSpeed);
    add('Angriffstempo', `${fmt(u.hitSpeed)} s`, '⏱');
    add('DPS', fmt(dps), '🔥', 'dps', dps);
    add('Reichweite', u.range < 1.3 && !u.isBuilding ? `Nahkampf (${fmt(u.range)})` : fmt(u.range), '🎯', 'range', u.range);
    if (u.minRange) add('Mindestreichweite', fmt(u.minRange), '↔');
    add('Ziele', TARGET_LABELS[u.targets] || u.targets, '⌖');
  }
  if (!u.isBuilding) add('Tempo', speedLabel(u.speed), '👟', 'speed', u.speed);
  if (u.flying) add('Bewegung', 'fliegt', '🪽');
  if (u.lifetime) add('Lebensdauer', `${fmt(u.lifetime)} s`, '⌛', 'lifetime', u.lifetime);
  if (u.splash) add('Flächenradius', fmt(u.splash), '◎');
  if (u.towerDamage < 1) add('Schaden an Kronentürmen', `${Math.round(u.towerDamage * 100)} %`, '🏰');
  const t = u.traits;
  if (t.charge) add('Ansturm', `×${fmt(t.charge.damageMult)} Schaden nach ${fmt(t.charge.distance)} Feldern`, '🐎');
  if (t.spawner) add('Beschwört', `${t.spawner.count}× ${db.unit(t.spawner.unit).name} alle ${fmt(t.spawner.interval)} s`, '👥');
  if (t.deathSpawn) add('Beim Tod', `${t.deathSpawn.count}× ${db.unit(t.deathSpawn.unit).name}`, '☠');
  if (t.deathDamage) add('Todesschaden', fmt(t.deathDamage.damage), '💣');
  if (t.elixirGen) add('Elixier', `+${t.elixirGen.amount} alle ${fmt(t.elixirGen.interval)} s`, '💧');
  if (t.healAura) add('Heilaura', `${fmt(t.healAura.amount)}/s (Radius ${fmt(t.healAura.radius)})`, '✚');
  if (t.multiTarget) add('Ziele gleichzeitig', t.multiTarget, '✳');
  if (t.riverJump) add('Besonderheit', 'springt über den Fluss', '⭐');
  if (t.deployAnywhere) add('Besonderheit', 'überall platzierbar', '⭐');
  add('Aufstellzeit', `${fmt(u.deployTime)} s`, '⏬');
  return rows;
}

// Maximum je Kartentyp und Wert (für relative Mini-Balken), einmal pro Datenbank berechnet
const maxCache = new WeakMap();
function statMax(db, type, key) {
  let m = maxCache.get(db);
  if (!m) {
    m = {};
    for (const c of db.cards) {
      for (const evo of c.evo ? [false, true] : [false]) {
        let rows = [];
        try {
          rows = statsRows(db, c, evo);
        } catch {
          continue;
        }
        for (const [, , meta] of rows) {
          if (meta?.n == null) continue;
          const k = `${c.type}|${meta.k}`;
          m[k] = Math.max(m[k] || 0, meta.n);
        }
      }
    }
    maxCache.set(db, m);
  }
  return m[`${type}|${key}`] || 0;
}

/** Detail-Modal (am Handy Bottom-Sheet). actions: [{ label, cls, onClick, disabled, reason }]; evoState: 'active' | 'inactive' | null */
export function openCardDetail(app, id, { evo = false, evoState = null, actions = [] } = {}) {
  const db = app.db;
  const card = db.card(id);
  if (!card) return null;
  const kindLabel = card.class !== 'normal' ? CLASS_LABELS[card.class] : TYPE_LABELS[card.type];
  const rarity = db.rarities[card.rarity]?.name || card.rarity;
  const table = h(
    'table',
    { class: 'stats-table' },
    h(
      'tbody',
      {},
      statsRows(db, card, evo).map(([k, v, meta]) => {
        const max = meta?.n != null ? statMax(db, card.type, meta.k) : 0;
        const rel = max > 0 ? Math.max(0.04, Math.min(1, meta.n / max)) : null;
        return h(
          'tr',
          {},
          h('th', { scope: 'row' }, h('span', { class: 'stat-ico', 'aria-hidden': 'true' }, meta?.i || '•'), k),
          h('td', {}, h('span', { class: 'stat-val' }, v), rel != null ? h('span', { class: 'stat-bar', 'aria-hidden': 'true', title: `${Math.round(rel * 100)} % des Höchstwerts` }, h('i', { style: { '--k': rel } })) : null),
        );
      }),
    ),
  );
  const body = h(
    'div',
    {},
    h(
      'div',
      { class: 'card-detail' },
      cardEl(db, id, { evo }),
      h(
        'div',
        {},
        h(
          'div',
          { class: 'detail-tags' },
          h('span', { class: `tag r-${card.rarity}` }, rarity),
          h('span', { class: `tag ${card.class !== 'normal' ? card.class : ''}` }, kindLabel),
          h('span', { class: 'tag' }, `${card.elixir} Elixier`),
          card.evo ? h('span', { class: 'tag evo' }, 'Evo verfügbar') : null,
        ),
        h('p', { class: 'detail-desc' }, card.description),
      ),
    ),
    table,
    card.evo
      ? h(
          'div',
          { class: `box evo${evoState ? ' ' + evoState : ''}` },
          h(
            'div',
            { class: 'evo-head' },
            h('h4', {}, card.evo.name || 'Evo'),
            evoState ? h('span', { class: `evo-state ${evoState}` }, evoState === 'active' ? '✓ Aktiv im Evo-Platz' : 'Inaktiv – nur in Platz 1 oder 2') : null,
          ),
          h('p', {}, card.evo.description),
          h(
            'div',
            { class: 'evo-cycle' },
            h(
              'span',
              { class: 'pips', 'aria-hidden': 'true' },
              Array.from({ length: card.evo.cycles }, () => h('i', { class: 'pip' })),
              h('span', { class: 'arrow' }, '→'),
              h('b', { class: 'pip evo' }, 'EVO'),
            ),
            h('span', {}, `Nach ${card.evo.cycles}× Ausspielen ist die nächste Karte entwickelt.`),
          ),
        )
      : null,
    card.ability
      ? h(
          'div',
          { class: 'box ability' },
          h('h4', {}, `${card.class === 'champion' ? 'Champion-Fähigkeit' : 'Helden-Fähigkeit'}: ${card.ability.name}`),
          h('p', {}, card.ability.description),
          h('p', { class: 'hint small', style: { marginTop: '4px' } }, card.class === 'champion' ? `Kosten: ${card.ability.cost} Elixier · Abklingzeit: ${card.ability.cooldown} s · Nur 1 Champion pro Deck.` : 'Einmal pro Einsatz, kostenlos · Nur 1 Held pro Deck.'),
        )
      : null,
    actions.length
      ? h(
          'div',
          { class: 'detail-actions' },
          h('div', { class: 'row wrap' }, actions.map((a) => h('button', { class: `btn ${a.cls || 'btn-success'}`, disabled: !!a.disabled, onclick: () => (a.onClick(), m.close()) }, a.label))),
          [...new Set(actions.filter((a) => a.disabled && a.reason).map((a) => a.reason))].map((r) => h('p', { class: 'action-reason' }, r)),
        )
      : null,
  );
  const m = modal(evo && card.evo ? card.evo.name : card.name, body);
  return m;
}
