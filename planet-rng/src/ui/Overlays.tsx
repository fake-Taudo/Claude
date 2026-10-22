import { useEffect, useState } from 'preact/hooks';
import { AURA_BY_ID, BIOME_BY_ID, TIER_BY_ID, TIERS, type TierId } from '../config';
import { auraCount, equipAura, planBulkSell, sellAura, sellBulk, sellPriceMilli, usableCount } from '../core/engine';
import { formatDuration, formatGold, formatInt, formatMult, formatOdds, formatShare } from '../core/format';
import { activeBiome } from '../core/biomes';
import { auraProbability, displayOdds, getRollTable } from '../core/odds';
import { computeLuck, isNextRollLucky } from '../core/modifiers';
import { decodeExport, encodeExport } from '../core/save';
import { game, ui } from '../game/app';
import { AuraOrb, Btn, css, GoldAmount, Stepper, TierTag, Toggle } from './common';
import { useGame, useUi } from './hooks';
import { Icon } from './icons';
import { sfx } from './sound';
import { AuraPreview } from './AuraPreview';

export function Overlays() {
  const u = useUi();
  return (
    <>
      {u.auraDetail && <AuraDetail id={u.auraDetail} />}
      {u.modal?.kind === 'sell' && <SellModal auraId={u.modal.aura} />}
      {u.modal?.kind === 'bulkSell' && <BulkSellModal />}
      {u.modal?.kind === 'export' && <ExportModal />}
      {u.modal?.kind === 'import' && <ImportModal />}
      {u.dialog && <ConfirmDialog />}
      {u.offline && <OfflineModal />}
      <Toasts />
    </>
  );
}

function Modal({ title, children, onClose, testid, wide }: { title: string; children: preact.ComponentChildren; onClose: () => void; testid?: string; wide?: boolean }) {
  return (
    <div class="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`modal${wide ? ' modal--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} data-testid={testid}>
        <div class="modal__head">
          <h3>{title}</h3>
          <button type="button" class="icon-btn icon-btn--sm" aria-label="Schließen" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ConfirmDialog() {
  const d = ui.dialog!;
  return (
    <Modal title={d.title} onClose={() => ui.closeDialog()} testid="confirm-dialog">
      <p class="modal__text">{d.body}</p>
      <div class="modal__actions">
        <Btn variant="ghost" onClick={() => ui.closeDialog()}>
          {d.cancel ?? 'Abbrechen'}
        </Btn>
        <Btn
          variant={d.danger ? 'danger' : 'primary'}
          data-testid="confirm-ok"
          onClick={() => {
            ui.closeDialog();
            d.onConfirm();
          }}
        >
          {d.confirm}
        </Btn>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function SellModal({ auraId }: { auraId: string }) {
  const state = useGame();
  const aura = AURA_BY_ID[auraId];
  const max = usableCount(state, auraId);
  const [qty, setQty] = useState(1);
  useEffect(() => {
    if (qty > max) setQty(Math.max(1, max));
  }, [max]);
  if (!aura) return null;
  const unit = sellPriceMilli(state, auraId);
  const equipped = state.equippedAura === auraId;
  return (
    <Modal title="Aura verkaufen" onClose={() => ui.closeModal()} testid="sell-modal">
      <div class="sell-head" style={css({ '--c': TIER_BY_ID[aura.tier].color })}>
        <AuraOrb aura={aura} size={56} />
        <div>
          <div class="sell-head__name">{aura.name}</div>
          <TierTag tierId={aura.tier} small />
          <div class="muted">
            Im Besitz: {formatInt(auraCount(state, auraId))} · je <GoldAmount milli={unit} size={13} />
          </div>
        </div>
      </div>
      {max <= 0 ? (
        <p class="modal__text">Diese Aura ist gesperrt oder nicht mehr vorhanden.</p>
      ) : (
        <>
          <div class="sell-qty">
            <span>Menge</span>
            <Stepper value={qty} min={1} max={max} onChange={setQty} />
          </div>
          {equipped && qty >= auraCount(state, auraId) && <p class="warn-line">Das ist dein letztes Exemplar – die Aura wird abgelegt.</p>}
          <div class="sell-total">
            Du erhältst <GoldAmount milli={unit * qty} size={18} />
          </div>
          <div class="modal__actions">
            <Btn variant="ghost" onClick={() => ui.closeModal()}>
              Abbrechen
            </Btn>
            <Btn
              variant="gold"
              icon="coin"
              data-testid="sell-confirm"
              onClick={(e) => {
                const events = game.apply((s, ctx) => sellAura(s, auraId, qty, ctx.now), 'now');
                if (!events.some((x) => x.type === 'error')) {
                  game.bus.emit('fx', { kind: 'coins', x: e.clientX, y: e.clientY, amount: Math.min(24, 6 + qty) });
                  ui.closeModal();
                }
              }}
            >
              {qty}× verkaufen
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

function BulkSellModal() {
  const state = useGame();
  const [keepOne, setKeepOne] = useState(true);
  const rows = TIERS.map((t) => ({ tier: t, plan: planBulkSell(state, t.id, keepOne) })).filter((r) => r.plan.count > 0);
  const ask = (tier: TierId) => {
    const plan = planBulkSell(game.state, tier, keepOne);
    ui.confirm({
      title: `Alle ${TIER_BY_ID[tier].name}en verkaufen?`,
      body: `${formatInt(plan.count)} Auren werden für ${formatGold(plan.gold)} Gold Coins verkauft. Gesperrte Auren${keepOne ? ' und je ein Exemplar' : ''} bleiben erhalten.`,
      confirm: 'Verkaufen',
      onConfirm: () => {
        const ev = game.apply((s, ctx) => sellBulk(s, tier, keepOne, ctx.now), 'now');
        if (!ev.some((x) => x.type === 'error')) {
          game.bus.emit('fx', { kind: 'coins', x: window.innerWidth / 2, y: window.innerHeight / 2, amount: 24 });
        }
      },
    });
  };
  return (
    <Modal title="Massenverkauf" onClose={() => ui.closeModal()} testid="bulk-modal">
      <Toggle checked={keepOne} onChange={setKeepOne} label="Je 1 Exemplar behalten" hint="Gesperrte Auren und die ausgerüstete Aura bleiben immer erhalten." />
      {rows.length === 0 ? (
        <p class="modal__text">Nichts zu verkaufen.</p>
      ) : (
        <div class="bulk-list">
          {rows.map(({ tier, plan }) => (
            <button type="button" key={tier.id} class="bulk-row" style={css({ '--c': tier.color })} onClick={() => ask(tier.id)} data-testid={`bulk-${tier.id}`}>
              <span class="bulk-row__tier">Alle {tier.name}en</span>
              <span class="bulk-row__count">{formatInt(plan.count)}×</span>
              <GoldAmount milli={plan.gold} size={14} />
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function AuraDetail({ id }: { id: string }) {
  const state = useGame();
  const aura = AURA_BY_ID[id];
  if (!aura) return null;
  const d = state.discovered[id];
  const tier = TIER_BY_ID[aura.tier];
  const now = game.now();
  const biome = activeBiome(now)?.id ?? null;
  const luck = computeLuck(state, now, { lucky: isNextRollLucky(state), biome }).total;
  const tableBiome = aura.biome ?? biome;
  const p = auraProbability(getRollTable(tableBiome), luck, id);
  const biomeDef = aura.biome ? BIOME_BY_ID[aura.biome] : null;
  return (
    <Modal title={d ? aura.name : 'Unentdeckte Aura'} onClose={() => ui.showAura(null)} testid="aura-detail" wide>
      <div class="aura-detail" style={css({ '--c': tier.color, '--g': aura.colors.glow })}>
        <div class="aura-detail__preview">{d ? <AuraPreview auraId={id} /> : <AuraOrb aura={aura} size={120} unknown />}</div>
        <div class="aura-detail__info">
          <TierTag tierId={aura.tier} />
          {d && aura.title && <div class="aura-detail__title">〈 {aura.title} 〉</div>}
          <p>{d ? aura.description : 'Rolle diese Aura, um sie zu entdecken.'}</p>
          <dl class="kv">
            <dt>Chance</dt>
            <dd>{formatOdds(displayOdds(aura))}</dd>
            <dt>Mit deinem Glück ({formatMult(luck)})</dt>
            <dd>{p > 0 ? formatOdds(1 / p) : biomeDef ? `nur während ${biomeDef.name}` : '–'}</dd>
            {biomeDef && (
              <>
                <dt>Biom</dt>
                <dd>Nur während {biomeDef.name}</dd>
              </>
            )}
            {d && (
              <>
                <dt>Gefunden</dt>
                <dd>{formatInt(d.total)}×</dd>
                <dt>Verkaufswert</dt>
                <dd>
                  <GoldAmount milli={sellPriceMilli(state, id)} size={13} />
                </dd>
              </>
            )}
            {aura.cutscene && (
              <>
                <dt>Cutscene</dt>
                <dd>Ja</dd>
              </>
            )}
          </dl>
          {d && (state.auras[id] ?? 0) > 0 && (
            <Btn
              variant={state.equippedAura === id ? 'ghost' : 'primary'}
              onClick={() => {
                sfx('equip');
                game.apply((s) => equipAura(s, id));
              }}
            >
              {state.equippedAura === id ? 'Ablegen' : 'Ausrüsten'}
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function ExportModal() {
  const [code] = useState(() => encodeExport(game.state));
  const [copied, setCopied] = useState(false);
  return (
    <Modal title="Spielstand exportieren" onClose={() => ui.closeModal()} testid="export-modal">
      <p class="modal__text">Kopiere diesen Code und bewahre ihn auf. Mit „Importieren“ stellst du den Spielstand wieder her.</p>
      <textarea class="code-box" readOnly value={code} onFocus={(e) => (e.target as HTMLTextAreaElement).select()} data-testid="export-code" />
      <div class="modal__actions">
        <Btn
          icon={copied ? 'check' : 'download'}
          onClick={() => {
            navigator.clipboard?.writeText(code).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          {copied ? 'Kopiert' : 'Kopieren'}
        </Btn>
      </div>
    </Modal>
  );
}

function ImportModal() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title="Spielstand importieren" onClose={() => ui.closeModal()} testid="import-modal">
      <p class="modal__text">Füge einen exportierten Code ein. Dein aktueller Spielstand wird ersetzt.</p>
      <textarea class="code-box" value={code} placeholder="PRNG1.…" onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)} data-testid="import-code" />
      {error && <p class="error-line">{error}</p>}
      <div class="modal__actions">
        <Btn variant="ghost" onClick={() => ui.closeModal()}>
          Abbrechen
        </Btn>
        <Btn
          icon="upload"
          disabled={!code.trim()}
          data-testid="import-confirm"
          onClick={() => {
            try {
              const state = decodeExport(code, game.now());
              ui.confirm({
                title: 'Spielstand ersetzen?',
                body: `Der importierte Spielstand hat ${formatInt(state.stats.rolls)} Rolls und ${formatGold(state.gold)} Gold Coins. Dein aktueller Stand geht verloren.`,
                confirm: 'Ersetzen',
                danger: true,
                onConfirm: () => {
                  game.replaceState(state);
                  ui.closeModal();
                  game.toast({ text: 'Spielstand importiert.', kind: 'success' });
                },
              });
              setError(null);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Importieren
        </Btn>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function OfflineModal() {
  const s = ui.offline!;
  const entries = Object.entries(s.auras)
    .sort((a, b) => displayOdds(AURA_BY_ID[b[0]]) - displayOdds(AURA_BY_ID[a[0]]))
    .slice(0, 8);
  const best = s.best ? AURA_BY_ID[s.best] : null;
  const close = () => {
    ui.offline = null;
    ui.changed();
  };
  return (
    <Modal title="Während du weg warst" onClose={close} testid="offline-modal">
      <p class="modal__text">
        Auto Roll lief weiter: <b>{formatInt(s.rolls)} Rolls</b> in {formatDuration(s.to - s.from)} ({formatShare(s.efficiency)} Effizienz).
      </p>
      {best && (
        <div class="offline-best" style={css({ '--c': TIER_BY_ID[best.tier].color })}>
          <AuraOrb aura={best} size={44} />
          <div>
            <div class="muted">Bester Fund</div>
            <b>{best.name}</b> <span class="muted">{formatOdds(displayOdds(best))}</span>
          </div>
        </div>
      )}
      <div class="offline-list">
        {entries.map(([id, n]) => (
          <div key={id} class="offline-list__row">
            <AuraOrb aura={AURA_BY_ID[id]} size={18} />
            <span>{AURA_BY_ID[id].name}</span>
            <b>×{formatInt(n)}</b>
          </div>
        ))}
      </div>
      {s.newAuras.length > 0 && <p class="modal__text">Neu entdeckt: {s.newAuras.map((id) => AURA_BY_ID[id].name).join(', ')}</p>}
      {s.goldBonus > 0 && (
        <p class="modal__text">
          Gold erhalten (Erfolge, Boni): <GoldAmount milli={s.goldBonus} />
        </p>
      )}
      <div class="modal__actions">
        <Btn onClick={close} data-testid="offline-ok">
          Weiter
        </Btn>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function Toasts() {
  const u = useUi();
  const covered = !!(u.panel || u.modal || u.dialog || u.offline || u.auraDetail);
  return (
    <div class={`toasts${covered ? ' toasts--top' : ''}`} aria-live="polite">
      {(covered ? u.toasts.slice(-1) : u.toasts).map((t) => (
        <div key={t.id} class={`toast toast--${t.kind ?? 'info'}`} style={css(t.color ? { '--c': t.color } : {})} onClick={() => ui.dismissToast(t.id)}>
          {t.icon && <Icon name={t.icon} size={18} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
