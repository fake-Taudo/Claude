// Karten als DOM-Elemente + Detailansicht mit allen Werten.
import { TARGET_LABELS, TYPE_LABELS, CLASS_LABELS, costLabel } from '/shared/cards.js';
import { h, modal } from './dom.js';
import { cardArtURL } from './art.js';

// Weiche Trennstellen für lange zusammengesetzte Namen (nur Anzeige, Kartendaten bleiben unverändert)
const PARTS = ['Barbaren', 'Blasrohr', 'Bogen', 'Bomben', 'Drachen', 'Elektro', 'Elite', 'Elixier', 'Feuerwerk', 'Feuer', 'Fleder', 'Flug', 'Heilungs', 'Hexen', 'Holz', 'Inferno', 'Kampf', 'Kanonen', 'Klon', 'Kobold', 'Königs', 'Lakaien', 'Magie', 'Mauer', 'Mega', 'Minen', 'Musketier', 'Prinz', 'Riesen', 'Scharf', 'Schnee', 'Schweine', 'Skelett', 'Speer', 'Tunnel', 'Widder'];
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
    { class: cls.join(' '), tabindex: opts.onClick ? '0' : null, role: opts.onClick ? 'button' : null, title: card.name, 'aria-label': `${card.name}, ${costLabel(card)} Elixier`, dataset: { id } },
    h('img', { src: cardArtURL(db, id, evo), alt: '', draggable: 'false' }),
    h('div', { class: 'cost' }, costLabel(card)),
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
  const pct = (v) => `${Math.round(v * 100)} %`;
  const name = (ref) => db.unit(ref).name;
  if (card.type === 'spell') {
    const s = db.spell(card, evo);
    if (s.mirror) add('Wirkung', 'Wiederholt deine zuletzt gespielte Karte eine Stufe stärker', '🪞');
    if (s.damage) add(s.pulse ? `Schaden pro ${fmt(s.pulse)} s` : s.waves > 1 ? `Schaden pro Welle (${s.waves}×)` : 'Schaden', fmt(s.damage), '⚔', 'dmg', s.damage);
    if (s.towerDamage != null && s.damage) add('Schaden an Kronentürmen', pct(s.towerDamage), '🏰');
    if (s.buildingDamage) add('Schaden an Gebäuden', fmt(s.buildingDamage), '🏚');
    if (s.voidTiers) add('Schaden (1 / 2–4 / 5+ Ziele)', s.voidTiers.map((t) => fmt(t[1])).join(' / '), '⚔');
    if (s.radius) add('Radius', fmt(s.radius), '◎', 'radius', s.radius);
    if (s.duration) add('Dauer', `${fmt(s.duration)} s`, '⌛', 'duration', s.duration);
    if (s.stun) add(s.freeze ? 'Einfrieren' : 'Betäubung', `${fmt(s.stun)} s`, s.freeze ? '❄' : '⚡');
    if (s.slow) add('Verlangsamung', `${pct(s.slow.amount)}${s.slow.duration ? ` (${fmt(s.slow.duration)} s)` : ''}`, '❄');
    if (s.heal) add(`Heilung pro ${fmt(s.pulse || 1)} s`, fmt(s.heal), '✚');
    if (s.rage) add('Tempo-Bonus', `+${Math.round((s.rage.mult - 1) * 100)} %`, '💢');
    if (s.pull) add('Sog', `${fmt(s.pull.speed)} Felder/s`, '🌀');
    if (s.curse) add('Fluch', 'Besiegte Gegner werden zu Schweinen für dich', '🐷');
    if (s.clone) add('Wirkung', 'Klont deine Truppen (Klone haben 1 Leben)', '👥');
    if (s.knockback) add('Rückstoß', fmt(s.knockback), '💨');
    if (s.strikes) add('Blitze', s.strikes, '⚡');
    if (s.vines) add('Ranken', `${s.vines.count} Ziele, ${fmt(s.vines.duration)} s`, '🌿');
    if (s.roll) add('Rollweite', `${fmt(s.roll.length)} Felder`, '➜');
    if (s.ownSide) add('Platzierung', 'nur auf deiner Seite', '⬇');
    if (s.spawn) add('Beschwört', `${s.spawn.count}× ${name(s.spawn.unit)}`, '👥');
    if (s.spawnAtEnd) add('Am Ende', `${s.spawnAtEnd.count}× ${name(s.spawnAtEnd.unit)}`, '👥');
    if (s.graveyard) add('Beschwört', `${s.graveyard.count}× ${name(s.graveyard.unit)}`, '👥');
    if (s.delay) add('Verzögerung', `${fmt(s.delay)} s`, '⏳');
    return rows;
  }
  // Geisterkaiserin: Werte der aktuell gewählten (Luft-)Form, die zweite Form als Hinweis
  const u = db.unit(card.forms ? card.forms[0].unit : card.id, evo);
  const count = card.forms ? 1 : db.groupsOf(card, evo).reduce((sum, g) => sum + (g.count || 1), 0);
  add('Leben', fmt(u.hp) + (count > 1 ? ` (×${count})` : ''), '❤', 'hp', u.hp);
  const t = u.traits;
  if (t.shield) add('Schild', fmt(t.shield), '🛡');
  if (t.ramp) add('Schaden', t.ramp.stages.map(fmt).join(' → '), '⚔', 'dmg', t.ramp.stages.at(-1));
  else if (u.damage) add(u.splash ? 'Flächenschaden' : 'Schaden', fmt(u.damage), u.splash ? '💥' : '⚔', 'dmg', u.damage);
  if (u.damage || t.ramp) {
    const dps = Math.round((t.ramp ? t.ramp.stages.at(-1) : u.damage) / u.hitSpeed);
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
  if (u.towerDamage < 1) add('Schaden an Kronentürmen', pct(u.towerDamage), '🏰');
  if (card.forms) add('Form', `ab ${card.forms[0].minElixir} Elixier fliegend, sonst zu Fuß für ${card.forms.at(-1).elixir}`, '🔀');
  if (t.charge) add('Ansturm', `${fmt(t.charge.damage)} Schaden nach ${fmt(t.charge.distance)} Feldern`, '🐎');
  if (t.dash) add('Sprint', `${fmt(t.dash.damage)} Schaden (${fmt(t.dash.min)}–${fmt(t.dash.max)} Felder)`, '💨');
  if (t.leap) add('Sprungangriff', `${fmt(t.leap.damage)} Schaden`, '🦘');
  if (t.hook) add('Haken', `zieht Ziele aus ${fmt(t.hook.max)} Feldern heran`, '🪝');
  if (t.kamikaze) add('Besonderheit', 'opfert sich beim Angriff', '💥');
  if (t.multiTarget) add('Ziele gleichzeitig', t.multiTarget, '✳');
  if (t.onHit?.stun) add('Betäubt', `${fmt(t.onHit.stun)} s`, '⚡');
  if (t.onHit?.freeze) add('Friert ein', `${fmt(t.onHit.freeze)} s`, '❄');
  if (t.onHit?.slow) add('Verlangsamt', `${pct(t.onHit.slow.amount)} (${fmt(t.onHit.slow.duration)} s)`, '❄');
  if (t.onHit?.chain) add('Kette', `${t.onHit.chain.count} Ziele`, '⛓');
  if (t.pierce) add('Durchschlag', `${fmt(t.pierce.length)} Felder`, '➶');
  if (t.secondary) add('Zweitangriff', t.secondary.damage ? fmt(t.secondary.damage) : 'ja', '✦');
  if (t.spawner) add('Beschwört', `${t.spawner.count}× ${name(t.spawner.unit)} alle ${fmt(t.spawner.interval)} s`, '👥');
  if (t.deathSpawn) add('Beim Tod', `${t.deathSpawn.count}× ${name(t.deathSpawn.unit)}`, '☠');
  if (t.deathDamage) add('Todesschaden', fmt(t.deathDamage.damage), '💣');
  if (t.deathElixir) add('Beim Tod', `Gegner erhält ${fmt(t.deathElixir)} Elixier`, '💧');
  if (t.elixirGen) add('Elixier', `+${t.elixirGen.amount} alle ${fmt(t.elixirGen.interval)} s`, '💧');
  if (t.deployBlast?.damage) add('Landeschaden', fmt(t.deployBlast.damage), '💥');
  if (t.stealth) add('Besonderheit', 'unsichtbar, bis er angreift', '👻');
  if (t.hidden) add('Besonderheit', 'versteckt sich unter der Erde', '⛏');
  if (t.riverJump) add('Besonderheit', 'springt über den Fluss', '⭐');
  if (t.deployAnywhere) add('Besonderheit', 'überall platzierbar', '⭐');
  add('Aufstellzeit', `${fmt(u.deployTime)} s`, '⏬');
  return rows;
}

/** Hinweiszeile unter der Fähigkeit: Kosten, Einsätze, Deck-Regel. */
function abilityHint(db, card) {
  const ab = card.ability;
  const uses = ab.uses > 1 ? `${ab.uses}× pro Einsatz, Abklingzeit ${fmt(ab.cooldown || 0)} s` : 'einmal pro Einsatz';
  const cost = ab.cost ? `${ab.cost} Elixier` : 'kostenlos';
  if (card.class === 'champion') return `Kosten: ${cost} · ${uses} · Nur 1 Champion oder Held pro Deck.`;
  const base = card.heroOf ? db.card(card.heroOf)?.name : null;
  return `Kosten: ${cost} · ${uses} · Nur 1 Champion oder Held pro Deck${base ? `, nicht zusammen mit ${base}` : ''}.`;
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
          h('span', { class: 'tag' }, card.elixirRule === 'mirror' ? 'Elixier: letzte Karte + 1' : `${card.elixir} Elixier`),
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
          h('p', { class: 'hint small', style: { marginTop: '4px' } }, abilityHint(db, card)),
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
