import { useEffect, useState } from 'preact/hooks';
import { AURAS, BIOME_BY_ID, ITEMS, ITEM_BY_ID, POTIONS, POTION_BY_ID, TIER_BY_ID, type AuraDef } from '../../config';
import { drinkPotion, equipAura, equipItem, markSeen, sellPriceMilli, toggleLock, useItem } from '../../core/engine';
import { formatDuration, formatGold, formatInt, formatOdds, formatPercent, formatShare } from '../../core/format';
import { displayOdds } from '../../core/odds';
import { game, ui } from '../../game/app';
import { AuraOrb, Btn, css, Empty, Panel, Progress, TierTag } from '../common';
import { useGame, useUi } from '../hooks';
import { Icon } from '../icons';
import { sfx } from '../sound';
import { ItemIcon, PotionIcon } from './itemIcons';

type SortKey = 'rarityDesc' | 'rarityAsc' | 'name' | 'count';

const SORT_LABEL: Record<SortKey, string> = {
  rarityDesc: 'Seltenste zuerst',
  rarityAsc: 'Häufigste zuerst',
  name: 'Name',
  count: 'Anzahl',
};

function sortAuras(list: AuraDef[], key: SortKey, count: (a: AuraDef) => number): AuraDef[] {
  const sorted = [...list];
  if (key === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  else if (key === 'count') sorted.sort((a, b) => count(b) - count(a) || displayOdds(b) - displayOdds(a));
  else sorted.sort((a, b) => (key === 'rarityDesc' ? displayOdds(b) - displayOdds(a) : displayOdds(a) - displayOdds(b)));
  return sorted;
}

export function InventoryPanel() {
  const state = useGame();
  const u = useUi();
  const tab = u.tab.inventory ?? 'auras';
  const unseen = AURAS.filter((a) => state.discovered[a.id] && !state.discovered[a.id].seen).length;
  const potionCount = Object.values(state.potions).reduce((s, n) => s + n, 0);
  const itemCount = Object.values(state.items).reduce((s, n) => s + n, 0);
  const auraCount = Object.values(state.auras).reduce((s, n) => s + n, 0);

  return (
    <Panel
      id="inventory"
      title={tab === 'index' ? 'Sammlung' : 'Inventar'}
      icon={tab === 'index' ? 'book' : 'bag'}
      color={tab === 'index' ? '#4a8dff' : '#8f6bff'}
      subtitle={`${formatInt(auraCount)} Auren · ${potionCount} Tränke · ${itemCount} Items`}
      tab={tab}
      tabs={[
        { id: 'auras', label: 'Inventar' },
        { id: 'index', label: 'Sammlung', badge: unseen || null },
        { id: 'potions', label: 'Tränke', badge: potionCount || null },
        { id: 'items', label: 'Items', badge: itemCount || null },
      ]}
    >
      {tab === 'auras' && <AurasTab />}
      {tab === 'index' && <IndexTab />}
      {tab === 'potions' && <PotionsTab />}
      {tab === 'items' && <ItemsTab />}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Owned auras
// ---------------------------------------------------------------------------

function AurasTab() {
  const state = useGame();
  const [sort, setSort] = useState<SortKey>('rarityDesc');
  const owned = sortAuras(
    AURAS.filter((a) => (state.auras[a.id] ?? 0) > 0),
    sort,
    (a) => state.auras[a.id] ?? 0,
  );

  return (
    <>
      <div class="toolbar">
        <label class="select">
          <Icon name="chart" size={16} />
          <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)} aria-label="Sortierung">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <span class="toolbar__spacer" />
        <Btn size="sm" variant="gold" icon="coin" onClick={() => ui.openModal({ kind: 'bulkSell' })} disabled={owned.length === 0} data-testid="bulk-sell">
          Massenverkauf
        </Btn>
      </div>
      <p class="hint-line">Tippen zum Ausrüsten, nochmal tippen legt ab. Der Stern sperrt eine Aura gegen Verkauf und Verbrauch.</p>
      {owned.length === 0 ? (
        <Empty icon="bag">Noch keine Auren. Tippe auf ROLL!</Empty>
      ) : (
        <div class="card-grid">
          {owned.map((a) => (
            <AuraCard key={a.id} aura={a} />
          ))}
        </div>
      )}
    </>
  );
}

function AuraCard({ aura }: { aura: AuraDef }) {
  const state = game.state;
  const count = state.auras[aura.id] ?? 0;
  const equipped = state.equippedAura === aura.id;
  const locked = !!state.locked[aura.id];
  const tier = TIER_BY_ID[aura.tier];
  return (
    <div
      class={`card aura-card${equipped ? ' is-equipped' : ''}`}
      style={css({ '--c': tier.color, '--g': aura.colors.glow })}
      role="button"
      tabIndex={0}
      data-testid={`aura-card-${aura.id}`}
      onClick={() => {
        sfx('equip');
        game.apply((s) => equipAura(s, aura.id));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') game.apply((s) => equipAura(s, aura.id));
      }}
    >
      <button
        type="button"
        class={`star-btn${locked ? ' is-on' : ''}`}
        title={locked ? 'Favorit (gesperrt) – antippen zum Entsperren' : 'Als Favorit sperren'}
        aria-pressed={locked}
        data-testid={`lock-${aura.id}`}
        onClick={(e) => {
          e.stopPropagation();
          sfx('toggle');
          game.apply((s) => toggleLock(s, aura.id));
        }}
      >
        <Icon name={locked ? 'starFill' : 'star'} size={18} />
      </button>
      <span class="count-badge">×{formatInt(count)}</span>
      <AuraOrb aura={aura} size={52} />
      <div class="card__name">{aura.name}</div>
      <TierTag tierId={aura.tier} small />
      <div class="card__odds">{formatOdds(displayOdds(aura))}</div>
      {equipped && <div class="equip-ribbon">AUSGERÜSTET</div>}
      <div class="card__actions">
        <button
          type="button"
          class="mini-btn"
          disabled={locked}
          data-testid={`sell-${aura.id}`}
          onClick={(e) => {
            e.stopPropagation();
            sfx('click');
            ui.openModal({ kind: 'sell', aura: aura.id });
          }}
        >
          {locked ? <Icon name="lock" size={14} /> : <span class="coin-ico" />}
          {locked ? 'Gesperrt' : formatGold(sellPriceMilli(state, aura.id))}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collection / index
// ---------------------------------------------------------------------------

type IndexFilter = 'all' | 'found' | 'missing' | 'new';

function IndexTab() {
  const state = useGame();
  const [filter, setFilter] = useState<IndexFilter>('all');
  const [sort, setSort] = useState<SortKey>('rarityAsc');
  const found = AURAS.filter((a) => state.discovered[a.id]).length;

  // Leaving the collection clears the "NEU" markers that were visible.
  useEffect(() => {
    const visible = AURAS.filter((a) => state.discovered[a.id] && !state.discovered[a.id].seen).map((a) => a.id);
    return () => {
      if (visible.length) {
        markSeen(game.state, visible);
        game.touch();
      }
    };
  }, []);

  let list = AURAS.filter((a) => {
    const d = state.discovered[a.id];
    if (filter === 'found') return !!d;
    if (filter === 'missing') return !d;
    if (filter === 'new') return d && !d.seen;
    return true;
  });
  list = sortAuras(list, sort, (a) => state.discovered[a.id]?.total ?? 0);

  return (
    <>
      <div class="index-progress">
        <div class="index-progress__text">
          <b>
            {found} / {AURAS.length}
          </b>{' '}
          entdeckt <span class="muted">({formatShare(found / AURAS.length)})</span>
        </div>
        <Progress value={found} max={AURAS.length} color="#4a8dff" />
      </div>
      <div class="toolbar">
        <div class="chips">
          {(
            [
              ['all', 'Alle'],
              ['found', 'Entdeckt'],
              ['missing', 'Fehlend'],
              ['new', 'Neu'],
            ] as [IndexFilter, string][]
          ).map(([k, label]) => (
            <button type="button" key={k} class={`chip${filter === k ? ' is-active' : ''}`} onClick={() => setFilter(k)}>
              {label}
            </button>
          ))}
        </div>
        <span class="toolbar__spacer" />
        <label class="select">
          <select value={sort} onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)} aria-label="Sortierung">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {list.length === 0 ? (
        <Empty icon="book">Keine Auren in dieser Ansicht.</Empty>
      ) : (
        <div class="card-grid card-grid--index">
          {list.map((a) => (
            <IndexCard key={a.id} aura={a} />
          ))}
        </div>
      )}
    </>
  );
}

function IndexCard({ aura }: { aura: AuraDef }) {
  const d = game.state.discovered[aura.id];
  const tier = TIER_BY_ID[aura.tier];
  const biome = aura.biome ? BIOME_BY_ID[aura.biome] : null;
  return (
    <div
      class={`card index-card${d ? '' : ' is-unknown'}`}
      style={css({ '--c': tier.color, '--g': aura.colors.glow })}
      role="button"
      tabIndex={0}
      data-testid={`index-card-${aura.id}`}
      onClick={() => {
        sfx('click');
        if (d) {
          markSeen(game.state, [aura.id]);
          game.touch();
        }
        ui.showAura(aura.id);
      }}
    >
      {d && !d.seen && <span class="badge-new badge-new--corner">NEU</span>}
      <AuraOrb aura={aura} size={46} unknown={!d} />
      <div class="card__name">{d ? aura.name : '???'}</div>
      <TierTag tierId={aura.tier} small />
      <div class="card__odds">{formatOdds(displayOdds(aura))}</div>
      {biome && (
        <div class="card__biome" title={`Nur während ${biome.name}`}>
          <Icon name={biome.icon} size={12} /> {biome.name}
        </div>
      )}
      {d && <div class="card__found">{formatInt(d.total)}× gefunden</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Potion stash
// ---------------------------------------------------------------------------

function PotionsTab() {
  const state = useGame();
  const owned = POTIONS.filter((p) => (state.potions[p.id] ?? 0) > 0);
  return (
    <>
      <p class="hint-line">Gebraute Tränke landen hier. Trinken wendet den Effekt an, mehrere Tränke stapeln sich.</p>
      {owned.length === 0 ? (
        <Empty icon="flask">
          Kein Trank im Vorrat.{' '}
          <button type="button" class="link" onClick={() => ui.open('potions')}>
            Zur Tränke-Werkstatt
          </button>
        </Empty>
      ) : (
        <div class="list">
          {owned.map((p) => (
            <div class="list-row" key={p.id} style={css({ '--c': p.color })} data-testid={`stash-${p.id}`}>
              <PotionIcon id={p.id} size={46} />
              <div class="list-row__main">
                <div class="list-row__title">
                  {p.name} <span class="count-pill">×{state.potions[p.id]}</span>
                </div>
                <div class="list-row__desc">{p.description}</div>
                <div class="list-row__meta">{stackNote(p.id)}</div>
              </div>
              <div class="list-row__actions">
                <Btn
                  size="sm"
                  variant="success"
                  data-testid={`drink-${p.id}`}
                  onClick={() => {
                    sfx('drink');
                    game.apply((s, ctx) => drinkPotion(s, p.id, 1, ctx.now), 'now');
                  }}
                >
                  Trinken
                </Btn>
                {(state.potions[p.id] ?? 0) >= 5 && (
                  <Btn size="sm" variant="ghost" onClick={() => game.apply((s, ctx) => drinkPotion(s, p.id, 5, ctx.now), 'now')}>
                    ×5
                  </Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function stackNote(potionId: string): string {
  const e = POTION_BY_ID[potionId].effect;
  if (e.rolls) return `Stapelt: +${e.rolls} ${e.rolls === 1 ? 'Roll' : 'Rolls'} pro Trank`;
  if (e.durationSec) return `Stapelt: +${formatDuration(e.durationSec * 1000)} pro Trank`;
  return '';
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

function ItemsTab() {
  const state = useGame();
  const owned = ITEMS.filter((i) => (state.items[i.id] ?? 0) > 0);
  const equipped = state.equippedItem ? ITEM_BY_ID[state.equippedItem] : null;
  return (
    <>
      <div class="equip-slot" data-testid="equip-slot">
        <span class="equip-slot__label">Ausrüstung</span>
        {equipped ? (
          <>
            <ItemIcon id={equipped.id} size={36} />
            <b>{equipped.name}</b>
            <span class="muted">{equipped.equip?.luckAdd ? `${formatPercent(equipped.equip.luckAdd)} Glück` : ''}{equipped.equip?.speedAdd ? ` · ${formatPercent(equipped.equip.speedAdd)} Tempo` : ''}</span>
          </>
        ) : (
          <span class="muted">Leer – kaufe Ausrüstung im Shop.</span>
        )}
      </div>
      {owned.length === 0 ? (
        <Empty icon="shop">
          Noch keine Items.{' '}
          <button type="button" class="link" onClick={() => ui.open('shop')}>
            Zum Shop
          </button>
        </Empty>
      ) : (
        <div class="list">
          {owned.map((it) => {
            const isEq = state.equippedItem === it.id;
            return (
              <div class={`list-row${isEq ? ' is-equipped' : ''}`} key={it.id} style={css({ '--c': it.color })} data-testid={`item-${it.id}`}>
                <ItemIcon id={it.id} size={46} />
                <div class="list-row__main">
                  <div class="list-row__title">
                    {it.name} {it.kind === 'consumable' && <span class="count-pill">×{state.items[it.id]}</span>}
                  </div>
                  <div class="list-row__desc">{it.description}</div>
                  {it.kind === 'consumable' && <div class="list-row__meta">Stapelt: Dauer addiert sich</div>}
                </div>
                <div class="list-row__actions">
                  {it.kind === 'consumable' ? (
                    <Btn
                      size="sm"
                      variant="success"
                      data-testid={`use-${it.id}`}
                      onClick={() => {
                        sfx('drink');
                        game.apply((s, ctx) => useItem(s, it.id, ctx.now), 'now');
                      }}
                    >
                      Benutzen
                    </Btn>
                  ) : (
                    <Btn
                      size="sm"
                      variant={isEq ? 'ghost' : 'primary'}
                      data-testid={`equip-${it.id}`}
                      onClick={() => {
                        sfx('equip');
                        game.apply((s) => equipItem(s, it.id), 'now');
                      }}
                    >
                      {isEq ? 'Ablegen' : 'Ausrüsten'}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
