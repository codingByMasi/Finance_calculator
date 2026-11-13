import { discount } from '../../calc/shopping';
import { money, pct } from '../../format';
import { currencyField, cur, num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'select',
  fields: [
    currencyField,
    { id: 'price', label: 'Original price', type: 'number', default: 120, min: 0, max: 1e13, step: 'any', prefix: 'cur' },
    { id: 'off', label: 'Discount', type: 'number', default: 30, min: 0, max: 100, step: 0.5, suffix: '%', slider: true },
    { id: 'extra', label: 'Extra discount on the sale price (optional)', type: 'number', default: 10, min: 0, max: 100, step: 0.5, suffix: '%', hint: 'A coupon applied after the first discount.' },
  ],
  compute(v) {
    const c = cur(v, 'select');
    const m = (x: number) => money(x, c, 2);
    const p = num(v, 'price'), off = num(v, 'off'), ex = num(v, 'extra');
    const r = discount(p, off, ex);
    return {
      headline: { label: 'You pay', value: m(r.finalPrice) },
      rows: [
        { label: 'Original price', value: m(r.original) },
        { label: `First discount (${off}%)`, value: `−${m(r.savings)}` },
        { label: 'Sale price', value: m(r.afterDiscount) },
        { label: `Extra discount (${ex}%)`, value: `−${m(r.extraSavings)}` },
        { label: 'Total you save', value: m(r.totalSavings), strong: true },
        { label: 'Effective discount', value: pct(r.effectivePercent, 2) },
      ],
      steps: [
        `First discount = price × % ÷ 100 = ${m(p)} × ${off} ÷ 100 = ${m(r.savings)}.`,
        `Sale price = ${m(p)} − ${m(r.savings)} = ${m(r.afterDiscount)}.`,
        `Extra discount (applied to the sale price) = ${m(r.afterDiscount)} × ${ex} ÷ 100 = ${m(r.extraSavings)}.`,
        `Final price = ${m(r.afterDiscount)} − ${m(r.extraSavings)} = ${m(r.finalPrice)}.`,
        `Effective discount = (${m(p)} − ${m(r.finalPrice)}) ÷ ${m(p)} × 100 = ${pct(r.effectivePercent, 2)}.`,
      ],
      chart: p > 0 ? { kind: 'donut', title: 'What you pay vs save', currency: c, segments: [{ label: 'You pay', value: r.finalPrice }, { label: 'You save', value: r.totalSavings }] } : undefined,
    };
  },
};
