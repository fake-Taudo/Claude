import { AURA_BY_ID, REBIRTHS, TIER_BY_ID } from '../../config';
import { PLANETS } from '../../config/planet';
import { checkRebirth, performRebirth } from '../../core/engine';
import { formatGold, formatInt, formatMult } from '../../core/format';
import { game, ui } from '../../game/app';
import { AuraOrb, Btn, css, Panel, Progress } from '../common';
import { useGame } from '../hooks';
import { Icon } from '../icons';

export function RebirthPanel() {
  const state = useGame();
  const check = checkRebirth(state);
  const current = REBIRTHS.find((r) => r.level === state.rebirth);
  const next = check.level ? REBIRTHS.find((r) => r.level === check.level)! : null;

  const doRebirth = () =>
    ui.confirm({
      title: `Rebirth ${next!.level} durchführen?`,
      body: 'Alle Auren und alle Gold Coins werden zurückgesetzt. Erhalten bleiben Tränke, Items, Ausrüstung, Sammlung, Erfolge und Statistik. Das lässt sich nicht rückgängig machen.',
      confirm: 'Rebirth!',
      danger: true,
      onConfirm: () => {
        const ev = game.apply((s, ctx) => performRebirth(s, ctx.now), 'now');
        if (!ev.some((e) => e.type === 'error')) {
          ui.close();
          game.bus.emit('rebirthFx', { level: next!.level });
        }
      },
    });

  return (
    <Panel id="rebirth" title="Rebirth" icon="rebirth" color="#ff5ab4" subtitle={`Stufe ${state.rebirth} von ${REBIRTHS.length} · Planet: ${PLANETS[Math.min(state.rebirth, PLANETS.length - 1)].name}`}>
      <div class="rebirth-steps">
        {[0, ...REBIRTHS.map((r) => r.level)].map((lvl) => (
          <div key={lvl} class={`rebirth-step${lvl <= state.rebirth ? ' is-done' : ''}${lvl === check.level ? ' is-next' : ''}`}>
            <span class="rebirth-step__dot">{lvl <= state.rebirth ? <Icon name="check" size={14} /> : lvl}</span>
            <span class="rebirth-step__name">{lvl === 0 ? 'Start' : REBIRTHS[lvl - 1].name}</span>
          </div>
        ))}
      </div>

      <div class="bonus-compare">
        <div class="bonus-box">
          <div class="bonus-box__title">Aktive Boni</div>
          <div class="bonus-line"><Icon name="clover" size={16} /> Glück <b>{formatMult(current?.luck ?? 1)}</b></div>
          <div class="bonus-line"><Icon name="bolt" size={16} /> Tempo <b>{formatMult(current?.speed ?? 1)}</b></div>
          <div class="bonus-line"><Icon name="coin" size={16} /> Gold <b>{formatMult(current?.goldMult ?? 1)}</b></div>
        </div>
        {next && (
          <>
            <Icon name="chevron" size={22} class="bonus-arrow" />
            <div class="bonus-box bonus-box--next">
              <div class="bonus-box__title">Nach Rebirth {next.level}</div>
              <div class="bonus-line"><Icon name="clover" size={16} /> Glück <b>{formatMult(next.luck)}</b></div>
              <div class="bonus-line"><Icon name="bolt" size={16} /> Tempo <b>{formatMult(next.speed)}</b></div>
              <div class="bonus-line"><Icon name="coin" size={16} /> Gold <b>{formatMult(next.goldMult)}</b></div>
            </div>
          </>
        )}
      </div>
      <p class="hint-line">Die Boni ersetzen die der vorherigen Stufe (sie addieren sich nicht). Dein Planet wächst mit jedem Rebirth.</p>

      {next ? (
        <>
          <h3 class="section-title">Anforderungen für Rebirth {next.level}</h3>
          <div class="req-list" data-testid="rebirth-reqs">
            <div class="req">
              <span class="coin-ico req__ico" />
              <div class="req__main">
                <div class="req__label">
                  Gold Coins <span class="muted">{formatGold(check.gold.have)} / {formatGold(check.gold.need)}</span>
                </div>
                <Progress value={check.gold.have} max={check.gold.need} color="#ffcf4a" />
              </div>
              {check.gold.have >= check.gold.need && <Icon name="check" size={20} class="req__ok" />}
            </div>
            {check.auras.map((a) => {
              const aura = AURA_BY_ID[a.aura];
              const known = !!state.discovered[a.aura];
              return (
                <div key={a.aura} class="req">
                  <AuraOrb aura={aura} size={26} unknown={!known} />
                  <div class="req__main">
                    <div class="req__label" style={css({ '--c': TIER_BY_ID[aura.tier].color })}>
                      <span class="aura-name">{known ? aura.name : '???'}</span>{' '}
                      <span class="muted">
                        {formatInt(a.have)} / {a.need}
                      </span>
                    </div>
                    <Progress value={a.have} max={a.need} color={TIER_BY_ID[aura.tier].color} />
                  </div>
                  {a.have >= a.need && <Icon name="check" size={20} class="req__ok" />}
                </div>
              );
            })}
          </div>
          <div class="warn-box">
            <Icon name="info" size={20} />
            <div>
              <b>Achtung:</b> Ein Rebirth setzt <b>alle Auren</b> und <b>alle Gold Coins</b> zurück und verbraucht die Anforderungen. Tränke, Items, Ausrüstung, Sammlung, Erfolge und Statistik bleiben erhalten.
              {Object.keys(state.locked).length > 0 && ' Auch gesperrte Auren werden zurückgesetzt.'}
            </div>
          </div>
          <div class="rebirth-cta">
            <Btn variant="danger" size="lg" icon="rebirth" disabled={!check.ready} onClick={doRebirth} data-testid="rebirth-go">
              {check.ready ? `Rebirth ${next.level} durchführen` : 'Anforderungen noch nicht erfüllt'}
            </Btn>
          </div>
        </>
      ) : (
        <div class="max-box">
          <Icon name="starburst" size={36} />
          <p>
            Du hast die höchste Rebirth-Stufe erreicht. Dein Planet ist ein <b>{PLANETS[PLANETS.length - 1].name}</b>.
          </p>
        </div>
      )}
    </Panel>
  );
}
