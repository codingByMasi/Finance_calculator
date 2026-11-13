import { autoLoan, amortizationSchedule, amortizationByYear } from '../../calc/loan';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'price', label: 'Vehicle price', type: 'number', default: 32000, min: 0, max: 1e8, step: 500, prefix: 'cur', slider: true, sliderMax: 150000 },
    { id: 'down', label: 'Down payment', type: 'number', default: 3000, min: 0, max: 1e8, step: 250, prefix: 'cur', slider: true, sliderMax: 50000 },
    { id: 'trade', label: 'Trade-in value', type: 'number', default: 0, min: 0, max: 1e8, step: 250, prefix: 'cur' },
    { id: 'taxRate', label: 'Sales tax rate', type: 'number', default: 7, min: 0, max: 20, step: 0.05, suffix: '%', hint: 'Use the rate where you will register the vehicle.' },
    { id: 'taxMode', label: 'Sales tax is charged on', type: 'select', default: 'after', options: [{ value: 'after', label: 'Price minus trade-in' }, { value: 'full', label: 'Full price' }], hint: 'This differs by state. Check your state rule.' },
    { id: 'fees', label: 'Title, registration and dealer fees', type: 'number', default: 800, min: 0, max: 1e6, step: 50, prefix: 'cur' },
    { id: 'rate', label: 'Loan interest rate (APR)', type: 'number', default: 6.9, min: 0, max: 40, step: 0.05, suffix: '%', slider: true, sliderMax: 20 },
    { id: 'term', label: 'Loan term', type: 'select', default: '60', options: ['24', '36', '48', '60', '72', '84'].map((x) => ({ value: x, label: `${x} months` })) },
  ],
  compute(v) {
    const months = Number(str(v, 'term'));
    const r = autoLoan({ price: num(v, 'price'), downPayment: num(v, 'down'), tradeIn: num(v, 'trade'), salesTaxPercent: num(v, 'taxRate'), fees: num(v, 'fees'), tradeInReducesTax: str(v, 'taxMode') === 'after', annualRatePercent: num(v, 'rate'), months });
    const m = (x: number, d = 0) => money(x, 'USD', d);
    const steps = [
      `Sales tax = ${pct(num(v, 'taxRate'))} × ${str(v, 'taxMode') === 'after' ? 'price after trade-in' : 'full price'} = ${m(r.salesTax, 2)}.`,
      `Amount financed = price + tax + fees − down payment − trade-in = ${m(num(v, 'price'))} + ${m(r.salesTax, 2)} + ${m(num(v, 'fees'))} − ${m(num(v, 'down'))} − ${m(num(v, 'trade'))} = ${m(r.amountFinanced, 2)}.`,
      `Monthly payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1) with r = ${pct(num(v, 'rate'))} ÷ 12 and n = ${months}: ${m(r.payment, 2)}.`,
      `Total interest = ${m(r.payment, 2)} × ${months} − ${m(r.amountFinanced, 2)} = ${m(r.totalInterest)}.`,
    ];
    const years = amortizationByYear(r.amountFinanced, num(v, 'rate'), months);
    return {
      headline: { label: 'Estimated monthly payment', value: m(r.payment) },
      rows: [
        { label: 'Amount financed', value: m(r.amountFinanced) },
        { label: 'Sales tax', value: m(r.salesTax) },
        { label: 'Total interest', value: m(r.totalInterest), strong: true },
        { label: 'Total cost incl. down payment and trade-in', value: m(r.totalCost) },
      ],
      steps,
      chart: years.length > 1 ? { kind: 'line', title: 'Loan balance by year', currency: 'USD', xs: years.map((y) => y.year), xLabel: 'Year', series: [{ name: 'Balance', values: years.map((y) => y.balance) }] } : undefined,
      notes: ['Does not include insurance, interest-rate changes or dealer add-ons.'],
      schedule: { currency: 'USD', rows: amortizationSchedule(r.amountFinanced, num(v, 'rate'), months), filename: 'auto-loan-schedule' },
    };
  },
};
