// Admin menu (opened with the code in GAME.admin.code): give auras, Gold Coins, potions and
// items, set the rebirth level, force the next roll, choose the weather, play cutscenes.
// Everything is saved like normal progress.

import { useState } from 'preact/hooks';
import { AURAS_BY_RARITY, AURA_BY_ID, BIOMES, ITEMS, POTIONS, REBIRTHS, TIERS, type TierId } from '../../config';
import { biomeOverride, setBiomeOverride } from '../../core/biomes';
import { adminClearBuffs, adminGiveAuras, adminGiveItems, adminGivePotions, adminGold, adminRemoveAura, adminSetRebirth, type GameEvent } from '../../core/engine';
import { formatGold, formatInt, formatOddsShort } from '../../core/format';
import type { GameState } from '../../core/state';
import { controller, game, ui } from '../../game/app';
import { AuraOrb, Btn, Panel, Stepper, TierTag } from '../common';
import { useGame } from '../hooks';
import { sfx } from '../sound';

/** Runs an admin action, saves right away and confirms it with a toast. */
function act(fn: (s: GameState, now: number) => GameEvent[], toast?: string): void {
  game.apply((s, ctx) => fn(s, ctx.now), 'now');
  if (toast) game.toast({ text: toast, kind: 'success', icon: 'check' });
}

function AurasTab() {
  const state = useGame();
  const [n, setN] = useState(1);
  const [tier, setTier] = useState<TierId | 'all'>('all');
  const list = AURAS_BY_RARITY.filter((a) => tier === 'all' || a.tier === tier);
  return (
    <>
      <section class="settings-group">
        <h3>Auren geben</h3>
        <div class="setting-row">
          <span>Anzahl je Aura</span>
          <Stepper value={n} min={1} max={9999} onChange={setN} />
        </div>
        <div class="btn-row">
          <Btn size="sm" variant="gold" icon="sparkles" data-testid="admin-all-auras" onClick={() => act((s, now) => adminGiveAuras(s, n, now), `Alle ${AURAS_BY_RARITY.length} Auren je ${formatInt(n)}× erhalten`)}>
            Alle Auren geben
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => act((s, now) => adminGiveAuras(s, n, now, list.map((a) => a.id)), `${list.length} Auren je ${formatInt(n)}× erhalten`)} disabled={tier === 'all'}>
            Nur diese Stufe
          </Btn>
        </div>
        <div class="setting-row">
          <span>Stufe</span>
          <select class="setting-select" value={tier} onChange={(e) => setTier((e.target as HTMLSelectElement).value as TierId | 'all')}>
            <option value="all">Alle Stufen</option>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </section>
      <div class="admin-list">
        {list.map((a) => (
          <div class="admin-row" key={a.id}>
            <AuraOrb aura={a} size={34} />
            <div class="admin-row__text">
              <b>{a.name}</b>
              <small>
                <TierTag tierId={a.tier} small /> {formatOddsShort(a.odds)} · {formatInt(state.auras[a.id] ?? 0)}×
              </small>
            </div>
            <Btn size="sm" variant="ghost" icon="plus" title={`${n}× geben`} onClick={() => act((s, now) => adminGiveAuras(s, n, now, [a.id]))}>
              {formatInt(n)}
            </Btn>
            <Btn size="sm" variant="plain" icon="trash" title="Alle entfernen" disabled={!state.auras[a.id]} onClick={() => act((s) => adminRemoveAura(s, a.id))} />
          </div>
        ))}
      </div>
    </>
  );
}

function ResourcesTab() {
  const state = useGame();
  const [gold, setGold] = useState('1000000');
  const [n, setN] = useState(10);
  const amount = Math.max(0, Math.min(1e12, Number(gold.replace(/\./g, '').replace(',', '.')) || 0));
  return (
    <>
      <section class="settings-group">
        <h3>Gold Coins</h3>
        <p class="admin-note">Aktuell: {formatGold(state.gold)}</p>
        <div class="setting-row">
          <span>Betrag</span>
          <input class="admin-input" inputMode="numeric" value={gold} onInput={(e) => setGold((e.target as HTMLInputElement).value)} data-testid="admin-gold-input" aria-label="Betrag" />
        </div>
        <div class="btn-row">
          <Btn size="sm" variant="gold" icon="coin" data-testid="admin-gold-add" onClick={() => act((s) => adminGold(s, amount), `+${formatInt(amount)} Gold Coins`)}>
            Hinzufügen
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => act((s) => adminGold(s, amount, true), `Gold Coins auf ${formatInt(amount)} gesetzt`)}>
            Genau setzen
          </Btn>
        </div>
        <div class="btn-row">
          {[1_000, 1_000_000, 1_000_000_000].map((v) => (
            <Btn key={v} size="sm" variant="ghost" onClick={() => act((s) => adminGold(s, v), `+${formatInt(v)} Gold Coins`)}>
              +{formatInt(v)}
            </Btn>
          ))}
        </div>
      </section>
      <section class="settings-group">
        <h3>Tränke und Items</h3>
        <div class="setting-row">
          <span>Anzahl</span>
          <Stepper value={n} min={1} max={9999} onChange={setN} />
        </div>
        <div class="btn-row">
          <Btn size="sm" variant="primary" icon="potion" onClick={() => act((s) => adminGivePotions(s, n), `Alle Tränke je ${n}×`)}>
            Alle Tränke
          </Btn>
          <Btn size="sm" variant="primary" icon="amulet" onClick={() => act((s) => adminGiveItems(s, n), `Alle Items je ${n}×`)}>
            Alle Items
          </Btn>
        </div>
        {POTIONS.map((p) => (
          <div class="setting-row" key={p.id}>
            <span>
              {p.name} <small class="admin-note">({state.potions[p.id] ?? 0})</small>
            </span>
            <Btn size="sm" variant="ghost" icon="plus" onClick={() => act((s) => adminGivePotions(s, n, [p.id]))}>
              {n}
            </Btn>
          </div>
        ))}
        {ITEMS.map((it) => (
          <div class="setting-row" key={it.id}>
            <span>
              {it.name} <small class="admin-note">({state.items[it.id] ?? 0})</small>
            </span>
            <Btn size="sm" variant="ghost" icon="plus" onClick={() => act((s) => adminGiveItems(s, n, [it.id]))}>
              {n}
            </Btn>
          </div>
        ))}
        <div class="btn-row">
          <Btn size="sm" variant="ghost" icon="trash" onClick={() => act((s) => adminClearBuffs(s), 'Alle laufenden Effekte beendet')}>
            Laufende Effekte beenden
          </Btn>
        </div>
      </section>
    </>
  );
}

function GameTab() {
  const state = useGame();
  const [next, setNext] = useState(AURAS_BY_RARITY[AURAS_BY_RARITY.length - 1].id);
  const [cut, setCut] = useState('omniversum');
  const [, force] = useState(0);
  const weather = biomeOverride();
  const withCutscene = AURAS_BY_RARITY.filter((a) => a.cutscene);
  return (
    <>
      <section class="settings-group">
        <h3>Nächster Roll</h3>
        <div class="setting-row">
          <select class="setting-select admin-wide" value={next} onChange={(e) => setNext((e.target as HTMLSelectElement).value)} data-testid="admin-next-aura" aria-label="Aura">
            {AURAS_BY_RARITY.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatOddsShort(a.odds)})
              </option>
            ))}
          </select>
        </div>
        <p class="admin-note">{controller.forceNext ? `Festgelegt: ${AURA_BY_ID[controller.forceNext]?.name}` : 'Der nächste Roll ist zufällig.'}</p>
        <div class="btn-row">
          <Btn
            size="sm"
            variant="gold"
            icon="dice"
            data-testid="admin-force"
            onClick={() => {
              controller.forceNext = next;
              force((x) => x + 1);
              game.toast({ text: `Nächster Roll: ${AURA_BY_ID[next].name}`, kind: 'success', icon: 'dice' });
            }}
          >
            Festlegen
          </Btn>
          <Btn
            size="sm"
            variant="primary"
            onClick={() => {
              controller.forceNext = next;
              ui.close();
              controller.roll(false);
            }}
          >
            Sofort rollen
          </Btn>
          {controller.forceNext && (
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => {
                controller.forceNext = null;
                force((x) => x + 1);
              }}
            >
              Aufheben
            </Btn>
          )}
        </div>
      </section>
      <section class="settings-group">
        <h3>Cutscene ansehen</h3>
        <div class="setting-row">
          <select class="setting-select admin-wide" value={cut} onChange={(e) => setCut((e.target as HTMLSelectElement).value)} aria-label="Cutscene">
            {withCutscene.map((a) => (
              <option key={a.id} value={a.id}>
                T{a.cutscene!.tier} · {a.name}
              </option>
            ))}
          </select>
          <Btn
            size="sm"
            variant="primary"
            icon="film"
            onClick={() => {
              ui.close();
              controller.replayCutscene(cut);
            }}
          >
            Abspielen
          </Btn>
        </div>
      </section>
      <section class="settings-group">
        <h3>Rebirth-Stufe</h3>
        <div class="segmented" role="radiogroup" aria-label="Rebirth-Stufe">
          {[0, ...REBIRTHS.map((r) => r.level)].map((lvl) => (
            <button
              key={lvl}
              type="button"
              role="radio"
              aria-checked={state.rebirth === lvl}
              class={`segmented__opt${state.rebirth === lvl ? ' is-active' : ''}`}
              onClick={() => {
                sfx('toggle');
                act((s) => adminSetRebirth(s, lvl));
              }}
            >
              {lvl === 0 ? 'Keine' : REBIRTHS.find((r) => r.level === lvl)!.name}
            </button>
          ))}
        </div>
      </section>
      <section class="settings-group">
        <h3>Wetter (Biom)</h3>
        <div class="setting-row">
          <select
            class="setting-select admin-wide"
            value={weather === undefined ? 'auto' : (weather ?? 'clear')}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setBiomeOverride(v === 'auto' ? undefined : v === 'clear' ? null : v);
              force((x) => x + 1);
            }}
            aria-label="Wetter"
          >
            <option value="auto">Automatisch (nach Uhrzeit)</option>
            <option value="clear">Klarer Himmel</option>
            {BIOMES.biomes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <p class="admin-note">Gilt bis zum Neuladen der Seite. Biom-Auren lassen sich nur im passenden Wetter rollen.</p>
      </section>
      <section class="settings-group">
        <h3>Admin-Menü</h3>
        <div class="btn-row">
          <Btn
            size="sm"
            variant="danger"
            icon="lock"
            onClick={() => {
              game.setSettings({ adminUnlocked: false });
              ui.close();
              game.toast({ text: 'Admin-Menü gesperrt. Mit dem Code wieder öffnen.', kind: 'info' });
            }}
          >
            Wieder sperren
          </Btn>
        </div>
      </section>
    </>
  );
}

export function AdminPanel() {
  useGame();
  const tab = ui.tab.admin ?? 'auras';
  return (
    <Panel
      id="admin"
      title="Admin-Menü"
      icon="gear"
      color="#ff5a7a"
      subtitle="Änderungen werden sofort gespeichert"
      tab={tab}
      tabs={[
        { id: 'auras', label: 'Auren' },
        { id: 'resources', label: 'Gold & Items' },
        { id: 'game', label: 'Spiel' },
      ]}
    >
      {tab === 'auras' && <AurasTab />}
      {tab === 'resources' && <ResourcesTab />}
      {tab === 'game' && <GameTab />}
    </Panel>
  );
}

/** True if the text is the admin code (case and spaces ignored). */
export function isAdminCode(text: string, code: string): boolean {
  return text.replace(/\s+/g, '').toUpperCase() === code.toUpperCase();
}
