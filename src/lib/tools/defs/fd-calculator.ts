import { fixedDeposit, fdByYear, FD_PERIODS, type FdCompounding } from '../../calc/india-savings';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

const label: Record<FdCompounding, string> = { quarterly: 'quarterly', monthly: 'monthly', 'half-yearly': 'half-yearly', yearly: 'yearly', simple: 'simple interest (paid out at maturity)' };

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'amount', label: 'Deposit amount', type: 'number', default: 500000, min: 0, max: 1e12, step: 1000, prefix: 'cur', slider: true, sliderMax: 5000000 },
    { id: 'rate', label: 'Interest rate (per year)', type: 'number', default: 7, min: 0, max: 20, step: 0.05, suffix: '%', slider: true },
    { id: 'years', label: 'Tenure', type: 'number', default: 5, min: 0, max: 40, step: 0.25, suffix: 'years', slider: true },
    { id: 'compounding', label: 'Interest is', type: 'select', default: 'quarterly',
      options: [{ value: 'quarterly', label: 'Compounded quarterly' }, { value: 'monthly', label: 'Compounded monthly' }, { value: 'half-yearly', label: 'Compounded half-yearly' }, { value: 'yearly', label: 'Compounded yearly' }, { value: 'simple', label: 'Simple interest (no compounding)' }],
      hint: 'Many banks compound FD interest quarterly. Check your deposit terms.' },
  ],
  compute(v) {
    const P = num(v, 'amount'), rate = num(v, 'rate'), t = num(v, 'years'), c = str(v, 'compounding') as FdCompounding;
    const r = fixedDeposit(P, rate, t, c);
    const m = (x: number, d = 0) => money(x, 'INR', d);
    const steps: string[] = [];
    if (c === 'simple') {
      steps.push(`Simple interest: maturity = P × (1 + r × t) = ${m(P)} × (1 + ${pct(rate)} × ${t}) = ${m(r.maturity)}.`);
    } else {
      const n = FD_PERIODS[c];
      steps.push(`Compounding ${label[c]}: ${n} time${n > 1 ? 's' : ''} a year, so the rate per period is ${pct(rate)} ÷ ${n} = ${+(rate / n).toFixed(4)}%.`);
      steps.push(`Number of periods = ${n} × ${t} years = ${+(n * t).toFixed(2)}.`);
      steps.push(`Maturity = P × (1 + r/${n})^(${n}×t) = ${m(P)} × (1 + ${+(rate / n / 100).toFixed(6)})^${+(n * t).toFixed(2)} = ${m(r.maturity)}.`);
    }
    steps.push(`Interest earned = maturity − deposit = ${m(r.maturity)} − ${m(P)} = ${m(r.interest)}.`);
    const rows = fdByYear(P, rate, t, c);
    return {
      headline: { label: 'Estimated maturity amount', value: m(r.maturity) },
      rows: [
        { label: 'Deposit', value: m(P) },
        { label: 'Interest earned', value: m(r.interest), strong: true },
        { label: 'Effective yearly yield', value: pct(r.effectiveYieldPercent, 3) },
      ],
      steps,
      chart: rows.length > 2
        ? { kind: 'line', title: 'Deposit value by year', currency: 'INR', xs: rows.slice(1).map((x) => +x.year.toFixed(2)), xLabel: 'Year', series: [{ name: 'Value', values: rows.slice(1).map((x) => x.value) }, { name: 'Deposit', values: rows.slice(1).map(() => P) }] }
        : { kind: 'donut', title: 'Deposit vs interest', currency: 'INR', segments: [{ label: 'Deposit', value: P }, { label: 'Interest', value: r.interest }] },
      notes: ['Before tax. Interest on fixed deposits is generally taxable and banks may deduct TDS.'],
    };
  },
};
