// German, locale aware number formatting. All numbers shown in the game go through here.

const nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const nf2fixed = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf3 = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 3 });

/** 1234567 -> "1.234.567" */
export function formatInt(n: number): string {
  return nf0.format(Math.round(n));
}

/** Compact large numbers: 12.500 -> "12,5K", 3.400.000 -> "3,4 Mio.", 2e9 -> "2 Mrd." */
export function formatCompact(n: number, threshold = 10_000): string {
  const a = Math.abs(n);
  if (a < threshold) return a < 100 && a % 1 !== 0 ? nf2.format(n) : formatInt(n);
  if (a < 1e6) return `${nf1.format(n / 1e3)}K`;
  if (a < 1e9) return `${nf2.format(n / 1e6)} Mio.`;
  if (a < 1e12) return `${nf2.format(n / 1e9)} Mrd.`;
  return `${nf2.format(n / 1e12)} Bio.`;
}

/** Odds as "1 in X": below 20 with one decimal, from 20 rounded with thousands separator. */
export function formatOdds(odds: number): string {
  if (!Number.isFinite(odds)) return '1 in ∞';
  if (odds < 20) return `1 in ${nf1.format(Math.round(odds * 10) / 10)}`;
  return `1 in ${formatInt(odds)}`;
}

/** Odds compact for tight spaces: "1 in 3 Mrd." */
export function formatOddsShort(odds: number): string {
  if (odds < 1e6) return formatOdds(odds);
  return `1 in ${formatCompact(odds)}`;
}

/** Gold Coins from milli gold. Small amounts keep their decimals, large ones are compact. */
export function formatGold(milli: number): string {
  const g = milli / 1000;
  const a = Math.abs(g);
  if (a === 0) return '0';
  if (a < 1) return nf3.format(g);
  if (a < 100) return nf2.format(g);
  if (a < 10_000) return nf1.format(g);
  return formatCompact(g);
}

/** Gold with fixed two decimals for counters. */
export function formatGoldFixed(milli: number): string {
  const g = milli / 1000;
  if (Math.abs(g) >= 10_000) return formatCompact(g);
  return nf2fixed.format(g);
}

/** Multiplier: 3.2 -> "3,2x", 1.25 -> "1,25x" */
export function formatMult(m: number): string {
  if (m >= 100) return `${formatInt(m)}x`;
  return `${nf2.format(m)}x`;
}

/** Additive bonus: 0.1 -> "+10 %" */
export function formatPercent(add: number): string {
  const p = add * 100;
  return `${p >= 0 ? '+' : ''}${nf1.format(p)} %`;
}

/** 0.4573 -> "45,7 %" */
export function formatShare(p: number): string {
  return `${nf1.format(p * 100)} %`;
}

/** Countdown style: 75s -> "1:15", 3725s -> "1:02:05" */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

/** Human duration: "3 Std. 12 Min.", "45 Sek." */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d} T. ${h} Std.`;
  if (h > 0) return `${h} Std. ${m} Min.`;
  if (m > 0) return `${m} Min.${s && m < 10 ? ` ${s} Sek.` : ''}`;
  return `${s} Sek.`;
}

export function formatNumber(n: number, digits = 2): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(n);
}
