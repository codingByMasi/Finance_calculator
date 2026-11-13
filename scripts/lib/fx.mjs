/** Validation for the daily exchange-rate snapshot. The update job refuses to write data that fails these checks. */
export const FX_CURRENCIES = ['EUR', 'USD', 'INR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD', 'CHF', 'CNY'];
export const FX_BASE = 'EUR';
export const FX_URL = `https://api.frankfurter.dev/v1/latest?base=${FX_BASE}&symbols=${FX_CURRENCIES.filter((c) => c !== FX_BASE).join(',')}`;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Turn the API response into the stored shape. */
export function toSnapshot(api) {
  return {
    base: api.base,
    date: api.date,
    source: 'Frankfurter (European Central Bank euro foreign exchange reference rates)',
    sourceUrl: `https://api.frankfurter.dev/v1/latest?base=${FX_BASE}`,
    rates: { [FX_BASE]: 1, ...Object.fromEntries(FX_CURRENCIES.filter((c) => c !== FX_BASE).map((c) => [c, api.rates?.[c]])) },
  };
}

/**
 * Returns a list of problems (empty = fine). `prev` is the snapshot already in the repo, `today` an ISO date.
 * A single rate moving more than `maxMove` (25%) in one update is treated as a data error, not a market move.
 */
export function validateFx(next, prev, today, maxMove = 0.25) {
  const errs = [];
  if (!next || typeof next !== 'object') return ['not an object'];
  if (next.base !== FX_BASE) errs.push(`base must be ${FX_BASE}`);
  if (!ISO.test(String(next.date))) errs.push('date is not YYYY-MM-DD');
  else {
    if (today && next.date > today) errs.push('date is in the future');
    if (prev && ISO.test(String(prev.date)) && next.date < prev.date) errs.push('date is older than the stored snapshot');
  }
  for (const c of FX_CURRENCIES) {
    const v = next.rates?.[c];
    if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) { errs.push(`rate for ${c} is missing or not a positive number`); continue; }
    const p = prev?.rates?.[c];
    if (c !== FX_BASE && typeof p === 'number' && p > 0 && Math.abs(v / p - 1) > maxMove) errs.push(`rate for ${c} moved ${(100 * (v / p - 1)).toFixed(1)}% in one update`);
  }
  if (next.rates?.[FX_BASE] !== 1) errs.push('EUR rate must be exactly 1');
  return errs;
}
