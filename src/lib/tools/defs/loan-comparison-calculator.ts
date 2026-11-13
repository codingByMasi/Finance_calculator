import { compareLoans } from '../../calc/loan';
import { money } from '../../format';
import { currencyField, cur, num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'select',
  fields: [
    currencyField,
    { id: 'aAmount', label: 'Loan A: amount', type: 'number', default: 25000, min: 0, max: 1e12, step: 500, prefix: 'cur' },
    { id: 'aRate', label: 'Loan A: interest rate', type: 'number', default: 8.5, min: 0, max: 60, step: 0.05, suffix: '%' },
    { id: 'aYears', label: 'Loan A: term', type: 'number', default: 5, min: 0, max: 50, step: 0.5, suffix: 'years' },
    { id: 'bAmount', label: 'Loan B: amount', type: 'number', default: 25000, min: 0, max: 1e12, step: 500, prefix: 'cur' },
    { id: 'bRate', label: 'Loan B: interest rate', type: 'number', default: 7.25, min: 0, max: 60, step: 0.05, suffix: '%' },
    { id: 'bYears', label: 'Loan B: term', type: 'number', default: 7, min: 0, max: 50, step: 0.5, suffix: 'years' },
  ],
  compute(v) {
    const c = cur(v, 'select');
    const m = (x: number, d = 0) => money(x, c, d);
    const A = { amount: num(v, 'aAmount'), rate: num(v, 'aRate'), months: Math.round(num(v, 'aYears') * 12) };
    const B = { amount: num(v, 'bAmount'), rate: num(v, 'bRate'), months: Math.round(num(v, 'bYears') * 12) };
    const r = compareLoans(A, B);
    const verdict = r.cheaper === 'same' ? 'Both loans cost the same' : `Loan ${r.cheaper.toUpperCase()} costs ${m(Math.abs(r.totalDiff))} less overall`;
    const step = (name: string, l: typeof A, e: typeof r.a) =>
      `Loan ${name}: r = ${l.rate}% ÷ 12 ÷ 100 = ${+e.monthlyRate.toFixed(6)}, n = ${l.months}. EMI = P × r × (1+r)^n ÷ ((1+r)^n − 1) = ${m(e.emi, 2)}. Total paid = ${m(e.emi, 2)} × ${l.months} = ${m(e.totalPayment)}. Interest = ${m(e.totalPayment)} − ${m(l.amount)} = ${m(e.totalInterest)}.`;
    return {
      headline: { label: 'Result', value: verdict },
      rows: [
        { label: 'Loan A: monthly payment', value: m(r.a.emi, 2) },
        { label: 'Loan A: total interest', value: m(r.a.totalInterest) },
        { label: 'Loan A: total paid', value: m(r.a.totalPayment), strong: true },
        { label: 'Loan B: monthly payment', value: m(r.b.emi, 2) },
        { label: 'Loan B: total interest', value: m(r.b.totalInterest) },
        { label: 'Loan B: total paid', value: m(r.b.totalPayment), strong: true },
        { label: 'Monthly difference (B − A)', value: m(r.monthlyDiff, 2) },
      ],
      steps: [step('A', A, r.a), step('B', B, r.b), `Difference in total cost (B − A) = ${m(r.b.totalPayment)} − ${m(r.a.totalPayment)} = ${m(r.totalDiff)}.`],
      chart: { kind: 'donut', title: 'Total interest: A vs B', currency: c, segments: [{ label: 'Loan A interest', value: r.a.totalInterest }, { label: 'Loan B interest', value: r.b.totalInterest }] },
      notes: ['Fees, insurance and prepayment penalties are not included. Compare the APR the lender quotes too.'],
    };
  },
};
