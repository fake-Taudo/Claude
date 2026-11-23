import { useEffect } from 'preact/hooks';
import { ITEM_BY_ID, POTION_BY_ID, SHOP, SHOP_TIER_BY_ID } from '../../config';
import { buyItem } from '../../core/engine';
import { formatClock, formatGold, formatShare } from '../../core/format';
import { currentOffers, rotationEndsAt, rotationIndex, rotationMs } from '../../core/shop';
import { toMilli } from '../../core/state';
import { game } from '../../game/app';
import { Btn, css, Empty, GoldAmount, Panel, Progress } from '../common';
import { useGame, useNow } from '../hooks';
import { Icon } from '../icons';
import { ItemIcon } from './itemIcons';

export function ShopPanel() {
  const state = useGame();
  const now = useNow(500);
  const rotation = rotationIndex(now);
  const offers = currentOffers(state, now);
  const left = rotationEndsAt(rotation) - now;

  useEffect(() => {
    if (state.shop.seen !== rotation) {
      game.state.shop.seen = rotation;
      game.touch();
    }
  }, [rotation]);

  return (
    <Panel
      id="shop"
      title="Händler"
      icon="shop"
      color="#ffb340"
      subtitle={
        <span class="shop-sub">
          Dein Gold: <GoldAmount milli={state.gold} size={14} />
        </span>
      }
    >
      <div class="restock" data-testid="shop-countdown">
        <Icon name="hourglass" size={18} />
        <span>
          Neues Angebot in <b>{formatClock(left)}</b>
        </span>
        <div class="restock__bar">
          <Progress value={rotationMs() - left} max={rotationMs()} color="#ffb340" />
        </div>
      </div>
      {offers.length === 0 ? (
        <Empty icon="shop">Der Händler hat gerade nichts im Angebot.</Empty>
      ) : (
        <div class="card-grid card-grid--shop">
          {offers.map((o) => {
            const item = ITEM_BY_ID[o.item];
            const tier = SHOP_TIER_BY_ID[item.shopTier];
            const owned = item.oneTime && (state.items[item.id] ?? 0) > 0;
            const price = toMilli(item.price);
            const affordable = state.gold >= price;
            let label = 'Kaufen';
            let disabled = false;
            if (owned) {
              label = 'Im Besitz';
              disabled = true;
            } else if (o.remaining <= 0) {
              label = 'Ausverkauft';
              disabled = true;
            } else if (!affordable) {
              label = 'Zu wenig Gold';
              disabled = true;
            }
            return (
              <div key={item.id} class={`card shop-card${disabled ? ' is-disabled' : ''}`} style={css({ '--c': tier.color, '--g': item.color })} data-testid={`offer-${item.id}`}>
                <span class="shop-card__tier" style={css({ '--c': tier.color })}>
                  {tier.name}
                </span>
                <ItemIcon id={item.id} size={58} />
                <div class="card__name">{item.name}</div>
                <p class="shop-card__desc">{item.description}</p>
                {item.grants && <p class="shop-card__meta">Landet im Tränke-Vorrat ({POTION_BY_ID[item.grants.potion]?.name})</p>}
                {item.oneTime && <p class="shop-card__meta">Einmalig · bleibt dauerhaft</p>}
                <div class="shop-card__stock">{owned ? 'Bereits gekauft' : o.remaining > 0 ? `Lager: ${o.remaining}` : 'Ausverkauft'}</div>
                <Btn
                  variant="gold"
                  size="sm"
                  disabled={disabled}
                  data-testid={`buy-${item.id}`}
                  silent
                  onClick={(e) => {
                    const ev = game.apply((s, ctx) => buyItem(s, item.id, ctx.now), 'now');
                    if (!ev.some((x) => x.type === 'error')) {
                      game.bus.emit('fx', { kind: 'sparkle', x: e.clientX, y: e.clientY, color: item.color, amount: 16 });
                      game.toast({ text: `Gekauft: ${item.name}${item.grants ? ' – im Tränke-Vorrat' : ' – im Inventar unter „Items“'}`, kind: 'success', icon: 'shop', color: item.color });
                    }
                  }}
                >
                  <span class="price">
                    <span class="coin-ico" />
                    {formatGold(price)}
                  </span>
                  {disabled && <span class="price__state">{label}</span>}
                </Btn>
              </div>
            );
          })}
        </div>
      )}
      <details class="shop-legend">
        <summary>
          <Icon name="info" size={16} /> Wie oft erscheint was?
        </summary>
        <p class="hint-line">Alle {SHOP.rotationMinutes} Minuten füllt der Händler komplett neu auf. Jedes Item hat je nach Stufe eine eigene Chance zu erscheinen:</p>
        <div class="legend-grid">
          {SHOP.tiers.map((t) => (
            <div key={t.id} class="legend-row" style={css({ '--c': t.color })}>
              <b>{t.name}</b>
              <span>{formatShare(t.chance)}</span>
              <span class="muted">{t.minStock === t.maxStock ? `${t.minStock} Stück` : `${t.minStock}–${t.maxStock} Stück`}</span>
            </div>
          ))}
        </div>
      </details>
    </Panel>
  );
}
