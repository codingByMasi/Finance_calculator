export type Currency = 'INR' | 'USD';

const fmtCache = new Map<string, Intl.NumberFormat>();
function nf(locale: string, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = locale + JSON.stringify(opts);
  let f = fmtCache.get(key);
  if (!f) { f = new Intl.NumberFormat(locale, opts); fmtCache.set(key, f); }
  return f;
}

/** ₹ with lakh/crore grouping (en-IN) or $ with thousands grouping (en-US). Whole units by default. */
export function money(value: number, currency: Currency, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const symbol = currency === 'INR' ? '₹' : '$';
  const abs = nf(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(value));
  return (value < 0 ? '-' : '') + symbol + abs;
}

export function num(value: number, currency: Currency, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  return nf(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function pct(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  return nf('en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimals }).format(value) + '%';
}

/** Compact lakh/crore or K/M/B label, for chart axes. */
export function compact(value: number, currency: Currency): string {
  const sym = currency === 'INR' ? '₹' : '$';
  const v = Math.abs(value);
  const s = value < 0 ? '-' : '';
  if (currency === 'INR') {
    if (v >= 1e7) return `${s}${sym}${+(v / 1e7).toFixed(2)}Cr`;
    if (v >= 1e5) return `${s}${sym}${+(v / 1e5).toFixed(2)}L`;
    if (v >= 1e3) return `${s}${sym}${+(v / 1e3).toFixed(1)}K`;
  } else {
    if (v >= 1e9) return `${s}${sym}${+(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${s}${sym}${+(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${s}${sym}${+(v / 1e3).toFixed(1)}K`;
  }
  return `${s}${sym}${Math.round(v)}`;
}
