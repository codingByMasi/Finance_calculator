import { recurringDeposit } from '../../calc/india-savings';
import { money, pct } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'monthly', label: 'Monthly deposit', type: 'number', default: 10000, min: 0, max: 1e10, step: 500, prefix: 'cur', slider: true, sliderMax: 100000 },
    { id: 'rate', label: 'Interest rate (per year)', type: 'number', default: 6.5, min: 0, max: 20, step: 0.05, suffix: '%', slider: true },
    { id: 'months', label: 'Tenure', type: 'number', default: 60, min: 0, max: 240, step: 1, suffix: 'months', slider: true },
  ],
  compute(v) {
    const D = num(v, 'monthly'), rate = num(v, 'rate'), N = Math.round(num(v, 'months'));
    const r = recurringDeposit(D, rate, N);
    const m = (x: number, d = 0) => money(x, 'INR', d);
    const q = Math.pow(1 + rate / 400, 1 / 3);
    const steps = [
      `Deposits: ${m(D)} a month for ${N} months = ${m(r.deposited)} in total.`,
      `Quarterly rate = ${pct(rate)} ÷ 4 = ${+(rate / 4).toFixed(4)}%. The equivalent monthly growth factor q = (1 + ${+(rate / 400).toFixed(6)})^(1/3) = ${q.toFixed(6)}.`,
      `Each deposit grows for the months it stays in. Maturity = D × q × (q^N − 1) ÷ (q − 1) = ${m(r.maturity)}.`,
      `Interest earned = maturity − total deposits = ${m(r.maturity)} − ${m(r.deposited)} = ${m(r.interest)}.`,
    ];
    const xs: number[] = [], bal: number[] = [], dep: number[] = [];
    for (let y = 1; y <= Math.ceil(N / 12); y++) { const mm = Math.min(y * 12, N); xs.push(y); bal.push(recurringDeposit(D, rate, mm).maturity); dep.push(D * mm); }
    return {
      headline: { label: 'Estimated maturity amount', value: m(r.maturity) },
      rows: [
        { label: 'Total deposited', value: m(r.deposited) },
        { label: 'Interest earned', value: m(r.interest), strong: true },
        { label: 'Tenure', value: `${N} months (${+(N / 12).toFixed(2)} years)` },
      ],
      steps,
      chart: xs.length > 1
        ? { kind: 'line', title: 'Value and deposits by year', currency: 'INR', xs, xLabel: 'Year', series: [{ name: 'Value', values: bal }, { name: 'Deposited', values: dep }] }
        : { kind: 'donut', title: 'Deposits vs interest', currency: 'INR', segments: [{ label: 'Deposited', value: r.deposited }, { label: 'Interest', value: r.interest }] },
      notes: ['Before tax. Banks may deduct TDS on the interest.'],
    };
  },
};
