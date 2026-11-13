import { emi, amortizationByYear, amortizationSchedule } from '../../calc/loan';
import { money, pct, num as fmtNum } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'type', label: 'Loan type', type: 'select', default: 'home',
      options: [
        { value: 'home', label: 'Home loan', set: { amount: 5000000, rate: 8.5, years: 20 } },
        { value: 'car', label: 'Car loan', set: { amount: 800000, rate: 9.5, years: 5 } },
        { value: 'personal', label: 'Personal loan', set: { amount: 300000, rate: 12, years: 3 } },
      ], hint: 'Picking a type fills typical example values. Edit them to match your offer.' },
    { id: 'amount', label: 'Loan amount', type: 'number', default: 5000000, min: 0, max: 1e12, step: 10000, prefix: 'cur', slider: true, sliderMax: 20000000 },
    { id: 'rate', label: 'Interest rate (per year)', type: 'number', default: 8.5, min: 0, max: 50, step: 0.05, suffix: '%', slider: true, sliderMax: 24 },
    { id: 'years', label: 'Loan tenure', type: 'number', default: 20, min: 0, max: 40, step: 0.5, suffix: 'years', slider: true },
  ],
  compute(v) {
    const P = num(v, 'amount'), annual = num(v, 'rate'), years = num(v, 'years');
    const e = emi(P, annual, Math.round(years * 12));
    const m = (x: number, d = 0) => money(x, 'INR', d);
    const steps: string[] = [];
    if (e.months === 0) {
      steps.push(`Tenure is 0 months, so the full principal ${m(P)} is due at once and no interest accrues.`);
    } else if (annual === 0) {
      steps.push(`Interest rate is 0%, so EMI = P ÷ n = ${m(P)} ÷ ${e.months} = ${m(e.emi, 2)}.`);
    } else {
      const g = Math.pow(1 + e.monthlyRate, e.months);
      steps.push(`Monthly rate r = ${pct(annual)} ÷ 12 ÷ 100 = ${+e.monthlyRate.toFixed(6)}.`);
      steps.push(`Number of months n = ${years} years × 12 = ${e.months}.`);
      steps.push(`(1 + r)^n = (1 + ${+e.monthlyRate.toFixed(6)})^${e.months} = ${g.toFixed(4)}.`);
      steps.push(`Numerator = P × r × (1 + r)^n = ${m(P)} × ${+e.monthlyRate.toFixed(6)} × ${g.toFixed(4)} = ${m(P * e.monthlyRate * g, 2)}.`);
      steps.push(`Denominator = (1 + r)^n − 1 = ${g.toFixed(4)} − 1 = ${(g - 1).toFixed(4)}.`);
      steps.push(`EMI = ${m(P * e.monthlyRate * g, 2)} ÷ ${(g - 1).toFixed(4)} = ${m(e.emi, 2)} per month.`);
    }
    steps.push(`Total payment = EMI × n = ${m(e.emi, 2)} × ${e.months} = ${m(e.totalPayment)}.`);
    steps.push(`Total interest = total payment − principal = ${m(e.totalPayment)} − ${m(P)} = ${m(e.totalInterest)}.`);
    const rows = amortizationByYear(P, annual, e.months);
    return {
      headline: { label: 'Monthly EMI', value: m(e.emi) },
      rows: [
        { label: 'Principal amount', value: m(P) },
        { label: 'Total interest', value: m(e.totalInterest) },
        { label: 'Total payment', value: m(e.totalPayment), strong: true },
        { label: 'Interest as share of total', value: e.totalPayment ? pct((e.totalInterest / e.totalPayment) * 100, 1) : '0%' },
      ],
      steps,
      chart: rows.length > 1 ? { kind: 'line', title: 'Outstanding balance by year', currency: 'INR', xs: rows.map((r) => r.year), xLabel: 'Year', series: [{ name: 'Balance', values: rows.map((r) => r.balance) }] }
        : { kind: 'donut', title: 'Principal vs interest', currency: 'INR', segments: [{ label: 'Principal', value: P }, { label: 'Interest', value: e.totalInterest }] },
      notes: [`Over ${fmtNum(e.months, 'INR')} monthly payments.`],
      schedule: { currency: 'INR', rows: amortizationSchedule(P, annual, e.months), filename: 'emi-schedule' },
    };
  },
};
