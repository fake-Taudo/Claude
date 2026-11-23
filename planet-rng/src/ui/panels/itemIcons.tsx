import { ITEM_BY_ID, POTION_BY_ID } from '../../config';
import { css } from '../common';
import { Icon } from '../icons';

/** Potion bottle tinted in the potion color with its symbol. */
export function PotionIcon({ id, size = 44 }: { id: string; size?: number }) {
  const p = POTION_BY_ID[id];
  if (!p) return null;
  return (
    <span class="potion-ico" style={css({ '--c': p.color, width: `${size}px`, height: `${size}px` })}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color={p.color} stop-opacity=".95" />
            <stop offset="1" stop-color={p.color} stop-opacity=".55" />
          </linearGradient>
        </defs>
        <path d="M19 6h10M20.5 6v9.5a13 13 0 1 0 7 0V6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.85)" stroke-width="2.4" stroke-linejoin="round" />
        <path d="M11.6 30a12.4 12.4 0 0 0 24.8 0Z" fill={`url(#pg-${id})`} />
        <circle cx="18" cy="31" r="2" fill="#fff" opacity=".7" />
        <circle cx="27" cy="35" r="1.4" fill="#fff" opacity=".5" />
      </svg>
      <span class="potion-ico__sym">
        <Icon name={p.icon} size={Math.round(size * 0.32)} stroke={2.4} />
      </span>
    </span>
  );
}

/** Item tile in the item color. */
export function ItemIcon({ id, size = 44 }: { id: string; size?: number }) {
  const it = ITEM_BY_ID[id];
  if (!it) return null;
  return (
    <span class="item-ico" style={css({ '--c': it.color, width: `${size}px`, height: `${size}px` })}>
      <Icon name={it.icon} size={Math.round(size * 0.58)} />
    </span>
  );
}
