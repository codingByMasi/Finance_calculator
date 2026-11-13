import { ppf, type PpfMode } from '../../calc/india-savings';
import { savingsIndia } from '../../../config/savings-india';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

const P = savingsIndia.ppf;
export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'deposit', label: 'Yearly deposit', type: 'number', default: P.maxYearlyDeposit, min: P.minYearlyDeposit, max: P.maxYearlyDeposit, step: 500, prefix: 'cur', slider: true, hint: `The scheme allows between ${money(P.minYearlyDeposit, 'INR')} and ${money(P.maxYearlyDeposit, 'INR')} a year.` },
    { id: 'rate', label: 'Interest rate (per year)', type: 'number', default: P.ratePercent, min: 0, max: 15, step: 0.05, suffix: '%', hint: `Pre-filled with the rate reported for ${P.rateQuarterLabel}. The government resets it every quarter, so enter the current rate.` },
    { id: 'years', label: 'Number of years', type: 'number', default: P.lockInYears, min: P.lockInYears, max: 50, step: 1, suffix: 'years', slider: true, hint: `The account runs ${P.lockInYears} years and can be extended in blocks of 5.` },
    { id: 'mode', label: 'When you deposit', type: 'select', default: 'april',
      options: [{ value: 'april', label: 'Whole year at once, early in the year' }, { value: 'monthly', label: 'Equal monthly deposits' }],
      hint: 'Interest is worked out monthly on the lowest balance after the 5th, so timing matters.' },
  ],
  compute(v) {
    const d = num(v, 'deposit'), rate = num(v, 'rate'), years = Math.round(num(v, 'years')), mode = str(v, 'mode') as PpfMode;
    const r = ppf(d, rate, years, mode);
    const m = (x: number, d2 = 0) => money(x, 'INR', d2);
    const first = r.rows[0];
    const steps = [
      mode === 'april'
        ? `Year 1: the full ${m(d)} is in the account all year, so interest = ${m(d)} × ${pct(rate)} = ${m(first?.interest ?? 0)}.`
        : `Year 1: ${m(d / 12, 2)} is added each month and each month's balance earns ${pct(rate)} ÷ 12. Interest for the year = ${m(first?.interest ?? 0)}.`,
      `Interest is credited at the end of the year and earns interest from the next year. Closing balance after year 1 = ${m(first?.balance ?? 0)}.`,
      `Repeating for ${years} years gives a maturity value of ${m(r.maturity)}.`,
      `Total deposited = ${m(d)} × ${years} = ${m(r.totalDeposited)}. Interest = ${m(r.totalInterest)}.`,
    ];
    return {
      headline: { label: 'Estimated maturity value', value: m(r.maturity) },
      rows: [
        { label: 'Total deposited', value: m(r.totalDeposited) },
        { label: 'Total interest', value: m(r.totalInterest), strong: true },
        { label: 'Rate assumed', value: `${pct(rate)} for the whole period` },
      ],
      steps,
      chart: r.rows.length > 1
        ? { kind: 'line', title: 'Balance by year', currency: 'INR', xs: r.rows.map((x) => x.year), xLabel: 'Year', series: [{ name: 'Balance', values: r.rows.map((x) => x.balance) }, { name: 'Deposited', values: r.rows.map((x) => x.deposit * x.year) }] }
        : undefined,
      notes: ['The PPF rate changes every quarter, so the real figure will differ from this constant-rate estimate.'],
    };
  },
};
