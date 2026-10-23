import { GAME } from '../../config';
import { CUTSCENE } from '../../config/cutscenes';
import { formatOddsShort } from '../../core/format';
import { createInitialState } from '../../core/state';
import { game, storagePersistent, ui } from '../../game/app';
import { randomSeed } from '../../store/persistence';
import type { VfxQuality } from '../../store/settings';
import { Btn, Panel, Slider, Toggle } from '../common';
import { useGame } from '../hooks';
import { Icon } from '../icons';
import { sfx } from '../sound';

const QUALITY: { id: VfxQuality; label: string }[] = [
  { id: 'low', label: 'Niedrig' },
  { id: 'medium', label: 'Mittel' },
  { id: 'high', label: 'Hoch' },
];

const KEYS: [string, string][] = [
  ['Leertaste', 'Rollen'],
  ['A', 'Auto Roll an/aus'],
  ['Q', 'Quick Roll an/aus'],
  ['I', 'Inventar'],
  ['C', 'Sammlung (Index)'],
  ['S', 'Shop'],
  ['F', 'Aura-Schmiede'],
  ['P', 'Tränke-Werkstatt'],
  ['E', 'Aktive Effekte'],
  ['R', 'Rebirth'],
  ['U', 'Quests'],
  ['O', 'Einstellungen'],
  ['Esc', 'Schließen'],
];

export function SettingsPanel() {
  useGame();
  const s = game.settings;
  const set = (patch: Partial<typeof s>) => game.setSettings(patch);
  const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

  return (
    <Panel id="settings" title="Einstellungen" icon="gear" color="#8a95c9">
      <section class="settings-group">
        <h3>Anzeige</h3>
        <Toggle checked={s.showReveal} onChange={(v) => set({ showReveal: v })} label="Gerollte Auren anzeigen" hint="Banner mit Name, Stufe und Chance nach jedem Roll" testid="set-reveal" />
        <Toggle checked={s.cutscenes} onChange={(v) => set({ cutscenes: v })} label="Cutscenes abspielen" hint="Für Auren ab 1 in 10.000" testid="set-cutscenes" />
        <Toggle
          checked={s.cutsceneSkip}
          onChange={(v) => set({ cutsceneSkip: v })}
          label="Cutscenes überspringen erlauben"
          hint="„Überspringen“ nach 2 s oder lange drücken. Filme ab 1 in 100 Mio. sind immer überspringbar."
          testid="set-skip"
        />
        <label class="setting-row">
          <span class="toggle-row__text">
            <span>Cutscenes überspringen bis</span>
            <small>Seltenere Auren zeigen ihre Cutscene weiterhin</small>
          </span>
          <select
            class="setting-select"
            value={String(s.cutsceneSkipBelow)}
            data-testid="set-skip-below"
            onChange={(e) => {
              sfx('toggle');
              set({ cutsceneSkipBelow: Number((e.target as HTMLSelectElement).value) });
            }}
          >
            {CUTSCENE.skipBelowOptions.map((v) => (
              <option key={v} value={String(v)}>
                {v === 0 ? 'Keine' : `unter ${formatOddsShort(v)}`}
              </option>
            ))}
          </select>
        </label>
        <Toggle checked={s.reduceFlashes} onChange={(v) => set({ reduceFlashes: v })} label="Lichtblitze reduzieren" hint="Weiche Blenden statt Blitzen, Inversion und harter Weißblende" testid="set-flashes" />
        <Toggle checked={s.feed} onChange={(v) => set({ feed: v })} label="Globaler Feed" hint="Simulierte Meldungen anderer Spieler plus deine eigenen Drops" />
        <div class="setting-row">
          <span>VFX-Qualität</span>
          <div class="segmented" role="radiogroup" aria-label="VFX-Qualität">
            {QUALITY.map((q) => (
              <button
                key={q.id}
                type="button"
                role="radio"
                aria-checked={s.vfxQuality === q.id}
                class={`segmented__opt${s.vfxQuality === q.id ? ' is-active' : ''}`}
                data-testid={`quality-${q.id}`}
                onClick={() => {
                  sfx('toggle');
                  set({ vfxQuality: q.id });
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <Toggle checked={s.reducedEffects} onChange={(v) => set({ reducedEffects: v })} label="Effekte reduzieren" hint="Kein Wackeln, kein Flackern, sanftere Blitze" />
        {canFullscreen && (
          <div class="setting-row">
            <span>Vollbild</span>
            <Btn
              size="sm"
              variant="ghost"
              icon="fullscreen"
              onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
                else document.documentElement.requestFullscreen().catch(() => undefined);
              }}
            >
              Umschalten
            </Btn>
          </div>
        )}
      </section>

      <section class="settings-group">
        <h3>Audio</h3>
        <Toggle checked={s.muted} onChange={(v) => set({ muted: v })} label="Stumm" />
        <Slider label="Gesamt" value={s.masterVolume} onChange={(v) => set({ masterVolume: v })} disabled={s.muted} />
        <Slider label="Effekte" value={s.sfxVolume} onChange={(v) => set({ sfxVolume: v })} disabled={s.muted} />
        <Slider label="Musik" value={s.musicVolume} onChange={(v) => set({ musicVolume: v })} disabled={s.muted} />
        <Slider label="Cutscenes" value={s.cutsceneVolume} onChange={(v) => set({ cutsceneVolume: v })} disabled={s.muted} />
      </section>

      <section class="settings-group">
        <h3>Steuerung</h3>
        <Toggle checked={s.vibration} onChange={(v) => set({ vibration: v })} label="Vibration" hint="Bei seltenen Drops (nur Mobilgeräte)" />
        <details class="keys">
          <summary>
            <Icon name="keyboard" size={18} /> Tastaturkürzel
          </summary>
          <dl class="kv">
            {KEYS.map(([k, v]) => (
              <>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </>
            ))}
          </dl>
        </details>
        <div class="setting-row">
          <span>Tutorial</span>
          <Btn
            size="sm"
            variant="ghost"
            icon="tutorial"
            onClick={() => {
              game.state.tutorial = { done: false, step: 0 };
              game.touch();
              ui.close();
            }}
          >
            Erneut starten
          </Btn>
        </div>
      </section>

      <section class="settings-group">
        <h3>Spielstand</h3>
        {!storagePersistent && <p class="warn-line">Der Browser erlaubt keinen dauerhaften Speicher (z. B. privater Modus). Nutze Export, um deinen Fortschritt zu sichern.</p>}
        <div class="btn-row">
          <Btn size="sm" variant="ghost" icon="download" onClick={() => ui.openModal({ kind: 'export' })} data-testid="export">
            Exportieren
          </Btn>
          <Btn size="sm" variant="ghost" icon="upload" onClick={() => ui.openModal({ kind: 'import' })} data-testid="import">
            Importieren
          </Btn>
          <Btn
            size="sm"
            variant="danger"
            icon="trash"
            data-testid="wipe"
            onClick={() =>
              ui.confirm({
                title: 'Spielstand löschen?',
                body: 'Alle Auren, Gold Coins, Items, Rebirths und Erfolge werden unwiderruflich gelöscht. Einstellungen bleiben erhalten.',
                confirm: 'Endgültig löschen',
                danger: true,
                onConfirm: () => {
                  game.wipe(createInitialState(randomSeed(), game.now()));
                  ui.close();
                  game.toast({ text: 'Spielstand gelöscht. Viel Glück beim Neustart!', kind: 'info' });
                },
              })
            }
          >
            Löschen
          </Btn>
        </div>
      </section>
      <p class="about">
        {GAME.title} · Version {GAME.version} · Einzelspieler, offline. Der globale Feed ist simuliert.
      </p>
    </Panel>
  );
}
