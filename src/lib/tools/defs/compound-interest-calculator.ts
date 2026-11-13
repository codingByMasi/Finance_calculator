import { compoundInterest } from '../../calc/invest';
import { money } from '../../format';
import { currencyField, cur, num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'select',
  fields: [
    currencyField,
    { id: 'principal', label: 'Starting amount', type: 'number', default: 10000, min: 0, max: 1e13, step: 500, prefix: 'cur', slider: true, sliderMax: 1000000 },
    { id: 'rate', label: 'Annual interest rate', type: 'number', default: 6, min: 0, max: 100, step: 0.05, suffix: '%', slider: true, sliderMax: 20 },
    { id: 'years', label: 'Time', type: 'number', default: 15, min: 0, max: 100, step: 0.5, suffix: 'years', slider: true, sliderMax: 50 },
    { id: 'freq', label: 'Compounding', type: 'select', default: '12',
      options: [{ value: '1', label: 'Yearly' }, { value: '2', label: 'Half-yearly' }, { value: '4', label: 'Quarterly' }, { value: '12', label: 'Monthly' }, { value: '365', label: 'Daily' }] },
  ],
  compute(v) {
    const c = cur(v, 'select');
    const m = (x: number, d = 0) => money(x, c, d);
    const P = num(v, 'principal'), rate = num(v, 'rate'), t = num(v, 'years'), f = Number(v.freq);
    const r = compoundInterest(P, rate, t, f);
    const xs: number[] = [], bal: number[] = [], prin: number[] = [];
    for (let y = 1; y <= Math.ceil(t); y++) { xs.push(y); bal.push(compoundInterest(P, rate, Math.min(y, t), f).amount); prin.push(P); }
    const factor = Math.pow(1 + r.periodicRate, r.periods);
    return {
      headline: { label: 'Final amount', value: m(r.amount) },
      rows: [
        { label: 'Starting amount', value: m(P) },
        { label: 'Interest earned', value: m(r.interest), strong: true },
        { label: 'Total compounding periods', value: `${+r.periods.toFixed(2)}` },
        { label: 'Growth multiple', value: P ? `${(r.amount / P).toFixed(2)}×` : '—' },
      ],
      steps: [
        `Rate per period = r ÷ m = ${rate}% ÷ ${f} = ${+(r.periodicRate * 100).toFixed(5)}% (= ${+r.periodicRate.toFixed(8)}).`,
        `Number of periods = m × t = ${f} × ${t} = ${+r.periods.toFixed(2)}.`,
        `Growth factor = (1 + r/m)^(m×t) = (1 + ${+r.periodicRate.toFixed(8)})^${+r.periods.toFixed(2)} = ${Number.isFinite(factor) ? factor.toFixed(6) : '∞'}.`,
        `A = P × growth factor = ${m(P)} × ${Number.isFinite(factor) ? factor.toFixed(6) : '∞'} = ${m(r.amount, 2)}.`,
        `Interest earned = A − P = ${m(r.amount, 2)} − ${m(P)} = ${m(r.interest, 2)}.`,
      ],
      chart: xs.length > 1 ? { kind: 'line', title: 'Balance by year', currency: c, xs, xLabel: 'Year', series: [{ name: 'Starting amount', values: prin }, { name: 'Balance', values: bal }] } : undefined,
    };
  },
};
