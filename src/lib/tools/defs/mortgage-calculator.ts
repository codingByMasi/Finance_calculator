import { mortgage } from '../../calc/loan';
import { money, pct } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'price', label: 'Home price', type: 'number', default: 400000, min: 0, max: 1e11, step: 5000, prefix: 'cur', slider: true, sliderMax: 2000000 },
    { id: 'down', label: 'Down payment', type: 'number', default: 80000, min: 0, max: 1e11, step: 1000, prefix: 'cur', slider: true, sliderMax: 1000000 },
    { id: 'rate', label: 'Interest rate (per year)', type: 'number', default: 6.5, min: 0, max: 30, step: 0.05, suffix: '%', slider: true, sliderMax: 12 },
    { id: 'years', label: 'Loan term', type: 'number', default: 30, min: 0, max: 50, step: 1, suffix: 'years', slider: true },
    { id: 'tax', label: 'Property tax (per year, optional)', type: 'number', default: 4800, min: 0, max: 1e9, step: 100, prefix: 'cur' },
    { id: 'ins', label: 'Home insurance (per year, optional)', type: 'number', default: 1500, min: 0, max: 1e9, step: 50, prefix: 'cur' },
    { id: 'hoa', label: 'HOA dues (per month, optional)', type: 'number', default: 0, min: 0, max: 1e7, step: 10, prefix: 'cur' },
  ],
  compute(v) {
    const m = (x: number, d = 0) => money(x, 'USD', d);
    const price = num(v, 'price'), down = num(v, 'down'), rate = num(v, 'rate'), years = num(v, 'years');
    const r = mortgage({ homePrice: price, downPayment: down, annualRatePercent: rate, years, propertyTaxAnnual: num(v, 'tax'), insuranceAnnual: num(v, 'ins'), hoaMonthly: num(v, 'hoa') });
    const n = Math.round(years * 12);
    const steps = [`Loan amount = home price − down payment = ${m(price)} − ${m(Math.min(down, price))} = ${m(r.loanAmount)} (${price ? pct((Math.min(down, price) / price) * 100, 1) : '0%'} down).`];
    if (n === 0) steps.push('Term is 0 months, so the whole loan is due at once.');
    else if (rate === 0) steps.push(`Rate is 0%, so principal and interest = loan ÷ n = ${m(r.loanAmount)} ÷ ${n} = ${m(r.principalAndInterest, 2)}.`);
    else {
      const mr = rate / 1200, g = Math.pow(1 + mr, n);
      steps.push(`Monthly rate r = ${rate}% ÷ 12 ÷ 100 = ${+mr.toFixed(6)}; number of payments n = ${years} × 12 = ${n}.`);
      steps.push(`(1 + r)^n = ${g.toFixed(4)}.`);
      steps.push(`Principal and interest = P × r × (1 + r)^n ÷ ((1 + r)^n − 1) = ${m(r.loanAmount)} × ${+mr.toFixed(6)} × ${g.toFixed(4)} ÷ ${(g - 1).toFixed(4)} = ${m(r.principalAndInterest, 2)}.`);
    }
    steps.push(`Property tax per month = ${m(num(v, 'tax'))} ÷ 12 = ${m(r.propertyTaxMonthly, 2)}; insurance per month = ${m(num(v, 'ins'))} ÷ 12 = ${m(r.insuranceMonthly, 2)}; HOA = ${m(r.hoaMonthly, 2)}.`);
    steps.push(`Total monthly payment = ${m(r.principalAndInterest, 2)} + ${m(r.propertyTaxMonthly, 2)} + ${m(r.insuranceMonthly, 2)} + ${m(r.hoaMonthly, 2)} = ${m(r.totalMonthly, 2)}.`);
    steps.push(`Total interest over the loan = P&I × n − loan = ${m(r.principalAndInterest, 2)} × ${n} − ${m(r.loanAmount)} = ${m(r.totalInterest)}.`);
    return {
      headline: { label: 'Total monthly payment', value: m(r.totalMonthly) },
      rows: [
        { label: 'Principal and interest', value: m(r.principalAndInterest, 2) },
        { label: 'Property tax', value: m(r.propertyTaxMonthly, 2) },
        { label: 'Home insurance', value: m(r.insuranceMonthly, 2) },
        { label: 'HOA', value: m(r.hoaMonthly, 2) },
        { label: 'Loan amount', value: m(r.loanAmount) },
        { label: 'Total interest over the term', value: m(r.totalInterest), strong: true },
      ],
      steps,
      chart: r.totalMonthly > 0 ? { kind: 'donut', title: 'Monthly payment breakdown', currency: 'USD', segments: [
        { label: 'Principal & interest', value: r.principalAndInterest }, { label: 'Property tax', value: r.propertyTaxMonthly },
        { label: 'Insurance', value: r.insuranceMonthly }, { label: 'HOA', value: r.hoaMonthly }] } : undefined,
      notes: ['Does not include PMI (usually required below 20% down), closing costs or maintenance.'],
    };
  },
};
