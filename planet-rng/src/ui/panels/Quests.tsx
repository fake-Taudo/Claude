import { ACHIEVEMENTS, AURAS, AURA_BY_ID, BIOMES, POTION_BY_ID, QUEST_CHAINS, TIERS, TIER_BY_ID, type Reward } from '../../config';
import { claimQuest } from '../../core/engine';
import { formatDuration, formatGold, formatInt, formatMult, formatOdds, formatPercent, formatShare } from '../../core/format';
import { displayOdds } from '../../core/odds';
import { achievementProgress, chainReward, chainTarget, nextDayStart, QUEST_BY_ID, questText } from '../../core/progress';
import { game } from '../../game/app';
import { AuraOrb, Btn, css, Panel, Progress } from '../common';
import { useGame, useNow, useUi } from '../hooks';
import { Icon } from '../icons';
import { claimableCount } from './questsUtil';

function RewardLine({ r }: { r: Reward }) {
  const parts: string[] = [];
  if (r.gold) parts.push(`${formatGold(r.gold * 1000)} Gold`);
  for (const [id, n] of Object.entries(r.potions ?? {})) parts.push(`${n}× ${POTION_BY_ID[id]?.name ?? id}`);
  if (r.luckAdd) parts.push(`${formatPercent(r.luckAdd)} Glück dauerhaft`);
  return (
    <span class="reward">
      <Icon name="trophy" size={13} /> {parts.join(' · ') || '–'}
    </span>
  );
}

export function QuestsPanel() {
  const state = useGame();
  const u = useUi();
  const tab = u.tab.quests ?? 'quests';
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length;
  return (
    <Panel
      id="quests"
      title={tab === 'stats' ? 'Statistik' : tab === 'achievements' ? 'Erfolge' : 'Aufträge'}
      icon={tab === 'stats' ? 'chart' : tab === 'achievements' ? 'trophy' : 'scroll'}
      color="#f5c22a"
      tab={tab}
      tabs={[
        { id: 'quests', label: 'Aufträge', badge: claimableCount(state) || null },
        { id: 'achievements', label: `Erfolge ${unlocked}/${ACHIEVEMENTS.length}` },
        { id: 'stats', label: 'Statistik' },
      ]}
    >
      {tab === 'quests' && <QuestsTab />}
      {tab === 'achievements' && <AchievementsTab />}
      {tab === 'stats' && <StatsTab />}
    </Panel>
  );
}

function QuestsTab() {
  const state = useGame();
  const now = useNow(1000);
  const claim = (id: string) => (e: MouseEvent) => {
    const ev = game.apply((s, ctx) => claimQuest(s, id, ctx.now), 'now');
    if (!ev.some((x) => x.type === 'error')) game.bus.emit('fx', { kind: 'coins', x: e.clientX, y: e.clientY, amount: 14 });
  };
  return (
    <>
      <div class="quest-head">
        <h3 class="section-title">Tägliche Aufträge</h3>
        <span class="muted">
          <Icon name="clock" size={14} /> neu in {formatDuration(nextDayStart(now) - now)}
        </span>
      </div>
      <div class="list">
        {state.quests.daily.map((q) => {
          const def = QUEST_BY_ID[q.id];
          if (!def) return null;
          const done = q.progress >= def.target;
          return (
            <div key={q.id} class={`list-row quest-row${q.claimed ? ' is-claimed' : done ? ' is-done' : ''}`} style={css({ '--c': '#f5c22a' })} data-testid={`quest-${q.id}`}>
              <div class="list-row__main">
                <div class="list-row__title">{questText(def.text, def.target, def.tier)}</div>
                <Progress value={q.progress} max={def.target} color={done ? '#4ce38a' : '#f5c22a'} label={`${formatInt(Math.floor(q.progress))} / ${formatInt(def.target)}`} />
                <RewardLine r={def.reward} />
              </div>
              <div class="list-row__actions">
                {q.claimed ? (
                  <span class="claimed">
                    <Icon name="check" size={18} /> Abgeholt
                  </span>
                ) : (
                  <Btn size="sm" variant="gold" disabled={!done} onClick={claim(q.id)} data-testid={`claim-${q.id}`}>
                    Abholen
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <h3 class="section-title">Daueraufträge</h3>
      <div class="list">
        {QUEST_CHAINS.map((c) => {
          const p = state.quests.chains[c.id] ?? { level: 0, progress: 0 };
          const target = chainTarget(c, p.level);
          const done = p.progress >= target;
          return (
            <div key={c.id} class={`list-row quest-row${done ? ' is-done' : ''}`} style={css({ '--c': '#f5c22a' })} data-testid={`chain-${c.id}`}>
              <div class="list-row__main">
                <div class="list-row__title">
                  {c.name} <span class="count-pill">Stufe {p.level + 1}</span>
                </div>
                <div class="list-row__desc">{questText(c.text, target, c.tier)}</div>
                <Progress value={p.progress} max={target} color={done ? '#4ce38a' : '#f5c22a'} label={`${formatInt(Math.floor(p.progress))} / ${formatInt(target)}`} />
                <RewardLine r={chainReward(c, p.level)} />
              </div>
              <div class="list-row__actions">
                <Btn size="sm" variant="gold" disabled={!done} onClick={claim(c.id)}>
                  Abholen
                </Btn>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AchievementsTab() {
  const state = useGame();
  const list = [...ACHIEVEMENTS].sort((a, b) => Number(!!state.achievements[b.id]) - Number(!!state.achievements[a.id]));
  return (
    <div class="ach-grid">
      {list.map((a) => {
        const done = !!state.achievements[a.id];
        const { value, target } = achievementProgress(state, a);
        return (
          <div key={a.id} class={`ach${done ? ' is-done' : ''}`} data-testid={`ach-${a.id}`}>
            <span class="ach__icon">
              <Icon name={done ? 'trophy' : a.icon} size={22} />
            </span>
            <div class="ach__main">
              <div class="ach__name">{a.name}</div>
              <div class="ach__desc">{a.description}</div>
              {!done && target > 1 && <Progress value={value} max={target} color="#f5c22a" label={`${formatInt(Math.floor(value))} / ${formatInt(target)}`} />}
              <RewardLine r={a.reward} />
            </div>
            {done && <Icon name="check" size={20} class="ach__check" />}
          </div>
        );
      })}
    </div>
  );
}

function StatsTab() {
  const state = useGame();
  const s = state.stats;
  const found = AURAS.filter((a) => state.discovered[a.id]).length;
  const best = s.bestAura ? AURA_BY_ID[s.bestAura] : null;
  const rows: [string, preact.ComponentChildren][] = [
    ['Rolls gesamt', formatInt(s.rolls)],
    ['Rolls seit dem letzten Rebirth', formatInt(state.rollsSinceRebirth)],
    ['davon offline / im Hintergrund', formatInt(s.offlineRolls)],
    ['Glücks-Rolls', formatInt(s.luckyRolls)],
    ['Höchstes Glück bei einem Roll', formatMult(s.bestLuck)],
    ['Spielzeit', formatDuration(s.playMs)],
    ['Gold verdient', `${formatGold(s.goldEarned)} Gold`],
    ['Gold ausgegeben', `${formatGold(s.goldSpent)} Gold`],
    ['Auren verkauft', formatInt(s.sold)],
    ['Tränke gebraut / getrunken', `${formatInt(s.brewed)} / ${formatInt(s.drunk)}`],
    ['Auren geschmiedet', formatInt(s.crafted)],
    ['Shop-Käufe', formatInt(s.purchases)],
    ['Rebirths', formatInt(s.rebirths)],
    ['Cutscenes erlebt', formatInt(s.cutscenes)],
    ['Sammlung', `${found} / ${AURAS.length} (${formatShare(found / AURAS.length)})`],
    ['Biome erlebt', `${s.biomesSeen.length} / ${BIOMES.biomes.length}`],
  ];
  return (
    <>
      {best && (
        <div class="best-aura" style={css({ '--c': TIER_BY_ID[best.tier].color })}>
          <AuraOrb aura={best} size={56} />
          <div>
            <div class="muted">Seltenste Aura</div>
            <div class="best-aura__name">{best.name}</div>
            <div class="muted">
              {TIER_BY_ID[best.tier].name} · {formatOdds(displayOdds(best))}
            </div>
          </div>
        </div>
      )}
      <dl class="kv kv--stats">
        {rows.map(([k, v]) => (
          <>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </>
        ))}
      </dl>
      <h3 class="section-title">Funde nach Stufe</h3>
      <div class="tier-counts">
        {TIERS.filter((t) => (s.tierCounts[t.id] ?? 0) > 0).map((t) => (
          <div key={t.id} class="tier-count" style={css({ '--c': t.color })}>
            <span>{t.name}</span>
            <b>{formatInt(s.tierCounts[t.id] ?? 0)}</b>
          </div>
        ))}
      </div>
    </>
  );
}
