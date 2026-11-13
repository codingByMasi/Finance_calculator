export type GstMode = 'add' | 'remove';
export interface GstResult { base: number; gst: number; total: number; cgst: number; sgst: number }

/** add: total = base × (1 + rate). remove: base = total / (1 + rate). */
export function gst(amount: number, ratePercent: number, mode: GstMode): GstResult {
  const a = Math.max(0, amount);
  const f = 1 + ratePercent / 100;
  const base = mode === 'add' ? a : a / f;
  const total = mode === 'add' ? a * f : a;
  const g = total - base;
  return { base, gst: g, total, cgst: g / 2, sgst: g / 2 };
}

export interface SalesTaxResult { pretax: number; tax: number; total: number }
export function salesTax(amount: number, ratePercent: number, mode: GstMode): SalesTaxResult {
  const r = gst(amount, ratePercent, mode);
  return { pretax: r.base, tax: r.gst, total: r.total };
}

export interface DiscountResult { original: number; savings: number; afterDiscount: number; extraSavings: number; finalPrice: number; totalSavings: number; effectivePercent: number }
/** Discount, then an optional extra discount stacked on the reduced price (not added to the first). */
export function discount(price: number, discountPercent: number, extraPercent = 0): DiscountResult {
  const p = Math.max(0, price);
  const d = Math.min(100, Math.max(0, discountPercent));
  const e = Math.min(100, Math.max(0, extraPercent));
  const savings = p * d / 100;
  const after = p - savings;
  const extra = after * e / 100;
  const final = after - extra;
  return { original: p, savings, afterDiscount: after, extraSavings: extra, finalPrice: final, totalSavings: p - final, effectivePercent: p === 0 ? 0 : ((p - final) / p) * 100 };
}

export interface HourlyResult { annual: number; monthly: number; biweekly: number; weekly: number; daily: number; hoursPerYear: number; paidWeeks: number }
export function hourlyToSalary(hourly: number, hoursPerWeek: number, weeksPerYear: number, unpaidWeeksOff = 0): HourlyResult {
  const paidWeeks = Math.max(0, weeksPerYear - Math.max(0, unpaidWeeksOff));
  const hpw = Math.max(0, hoursPerWeek);
  const h = Math.max(0, hourly);
  const annual = h * hpw * paidWeeks;
  return {
    annual, monthly: annual / 12, biweekly: annual / 26, weekly: h * hpw,
    daily: h * (hpw / 5), hoursPerYear: hpw * paidWeeks, paidWeeks,
  };
}
