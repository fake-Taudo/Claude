// Simulated global feed (clearly labelled): invented players' rare drops plus your own.

import { useEffect, useRef, useState } from 'preact/hooks';
import { AURAS, AURA_BY_ID, GAME, NPC_NAMES, TIER_BY_ID, type AuraDef } from '../config';
import { formatOdds } from '../core/format';
import { displayOdds } from '../core/odds';
import { game } from '../game/app';
import { css } from './common';
import { useBus, useGame } from './hooks';

interface FeedMsg {
  id: number;
  who: string;
  aura: AuraDef;
  own: boolean;
}

const POOL = AURAS.filter((a) => a.odds >= GAME.feed.npcMinOdds && !a.fallback);

/** Weighted toward the less rare auras so very rare names stay special. */
function npcAura(): AuraDef {
  let total = 0;
  const w = POOL.map((a) => {
    const x = Math.pow(a.odds, -0.55);
    total += x;
    return x;
  });
  let r = Math.random() * total;
  for (let i = 0; i < POOL.length; i++) {
    r -= w[i];
    if (r <= 0) return POOL[i];
  }
  return POOL[0];
}

let seq = 0;

export function Feed() {
  useGame();
  const [msgs, setMsgs] = useState<FeedMsg[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabled = game.settings.feed;

  const push = (m: Omit<FeedMsg, 'id'>) => {
    const msg = { ...m, id: ++seq };
    setMsgs((list) => [...list, msg].slice(-2));
    setTimeout(() => setMsgs((list) => list.filter((x) => x.id !== msg.id)), GAME.feed.visibleMs);
  };

  useEffect(() => {
    if (!enabled) {
      setMsgs([]);
      return;
    }
    const schedule = () => {
      const [a, b] = GAME.feed.intervalSec;
      timer.current = setTimeout(() => {
        if (!document.hidden) push({ who: NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)], aura: npcAura(), own: false });
        schedule();
      }, (a + Math.random() * (b - a)) * 1000);
    };
    schedule();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled]);

  useBus('reveal', (e) => {
    if (!game.settings.feed) return;
    const aura = AURA_BY_ID[e.aura];
    if (TIER_BY_ID[aura.tier].rank >= GAME.feed.ownMinRank) push({ who: 'Du', aura, own: true });
  });

  if (!enabled || !msgs.length) return null;
  return (
    <div class="feed" aria-live="polite" data-testid="feed">
      {msgs.map((m) => {
        const tier = TIER_BY_ID[m.aura.tier];
        return (
          <div key={m.id} class={`feed__msg${m.own ? ' is-own' : ''}`} style={css({ '--c': tier.color })}>
            <span class="feed__tag">SIMULIERT</span>
            <span class="feed__who">{m.who}</span> {m.own ? 'hast' : 'hat'} <b>{m.aura.name}</b> gefunden <span class="feed__odds">{formatOdds(displayOdds(m.aura))}</span>
          </div>
        );
      })}
    </div>
  );
}
