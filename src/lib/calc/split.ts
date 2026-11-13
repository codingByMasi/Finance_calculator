/** Bill splitting, tipping and currency conversion. Pure functions. */

export interface SplitInput { bill: number; tipPercent: number; people: number; roundUp: boolean }
export interface SplitResult {
  tip: number; total: number; perPerson: number;
  /** what each person pays after rounding up to a whole unit (equal to perPerson when roundUp is false) */
  perPersonPaid: number; collected: number; extraFromRounding: number; people: number;
}
/**
 * Tip = bill × tip%. Total = bill + tip. Per person = total ÷ people (at least 1).
 * With roundUp, each person's share is rounded up to the next whole unit, so the group collects slightly more than the total.
 */
export function splitBill(i: SplitInput): SplitResult {
  const bill = Math.max(0, i.bill), people = Math.max(1, Math.round(i.people));
  const tip = (bill * Math.max(0, i.tipPercent)) / 100;
  const total = bill + tip;
  const per = total / people;
  const paid = i.roundUp ? Math.ceil(per - 1e-9) : per;
  return { tip, total, perPerson: per, perPersonPaid: paid, collected: paid * people, extraFromRounding: paid * people - total, people };
}

export interface FxTable { base: string; date: string; rates: Record<string, number> }
/** amount in `from` → `to`, through the table's base currency: amount × rate[to] ÷ rate[from]. Returns NaN for an unknown code. */
export function convert(amount: number, from: string, to: string, t: FxTable): number {
  const a = t.rates[from], b = t.rates[to];
  if (!(a > 0) || !(b > 0)) return NaN;
  return (Math.max(0, amount) * b) / a;
}
/** Units of `to` per one unit of `from`. */
export const rateBetween = (from: string, to: string, t: FxTable): number => convert(1, from, to, t);
/** Whole days between an ISO date and `now` (never negative). */
export function ageInDays(isoDate: string, now: Date): number {
  const d = Date.parse(isoDate + 'T00:00:00Z');
  if (!Number.isFinite(d)) return Infinity;
  return Math.max(0, Math.floor((now.getTime() - d) / 86_400_000));
}
