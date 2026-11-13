import { refinance, refinanceCumulative, amortizationSchedule } from '../../calc/loan';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'balance', label: 'Current loan balance', type: 'number', default: 300000, min: 0, max: 1e10, step: 1000, prefix: 'cur', slider: true, sliderMax: 1500000 },
    { id: 'curRate', label: 'Current interest rate', type: 'number', default: 7, min: 0, max: 30, step: 0.05, suffix: '%', slider: true, sliderMax: 12 },
    { id: 'remYears', label: 'Years left on current loan', type: 'number', default: 25, min: 0, max: 40, step: 0.5, suffix: 'years', slider: true },
    { id: 'newRate', label: 'New interest rate', type: 'number', default: 5.75, min: 0, max: 30, step: 0.05, suffix: '%', slider: true, sliderMax: 12 },
    { id: 'newYears', label: 'New loan term', type: 'number', default: 25, min: 0, max: 40, step: 0.5, suffix: 'years', slider: true },
    { id: 'costs', label: 'Closing costs', type: 'number', default: 6000, min: 0, max: 1e8, step: 100, prefix: 'cur' },
    { id: 'roll', label: 'Closing costs are', type: 'select', default: 'upfront', options: [{ value: 'upfront', label: 'Paid up front' }, { value: 'rolled', label: 'Added to the new loan' }] },
  ],
  compute(v) {
    const r = refinance({ balance: num(v, 'balance'), currentRatePercent: num(v, 'curRate'), remainingMonths: Math.round(num(v, 'remYears') * 12), newRatePercent: num(v, 'newRate'), newMonths: Math.round(num(v, 'newYears') * 12), closingCosts: num(v, 'costs'), rollCostsIntoLoan: str(v, 'roll') === 'rolled' });
    const m = (x: number, d = 0) => money(x, 'USD', d);
    const steps = [
      `Current payment (principal and interest only) on ${m(num(v, 'balance'))} at ${pct(num(v, 'curRate'))} over ${r.currentMonths} months = ${m(r.currentPayment, 2)}.`,
      `New loan: ${m(r.newPrincipal)} at ${pct(num(v, 'newRate'))} over ${r.newMonths} months = ${m(r.newPayment, 2)} a month${str(v, 'roll') === 'rolled' ? ' (closing costs added to the loan)' : ''}.`,
      `Monthly difference = ${m(r.currentPayment, 2)} − ${m(r.newPayment, 2)} = ${m(r.monthlySavings, 2)}.`,
      r.breakEvenMonths === null
        ? (r.upfrontCosts > 0 ? 'The new payment is not lower, so the upfront costs are not recovered through monthly savings.' : 'There are no upfront costs to recover, so there is no break-even point.')
        : `Months to recover ${m(r.upfrontCosts)} of upfront costs = ${m(r.upfrontCosts)} ÷ ${m(r.monthlySavings, 2)} = ${r.breakEvenMonths}.`,
      `Total of remaining payments: current ${m(r.currentTotal)} versus new ${m(r.newTotal)} (including any upfront costs). Difference: ${m(r.lifetimeSavings)}.`,
    ];
    const cum = refinanceCumulative(r);
    return {
      headline: { label: 'Monthly payment difference', value: m(r.monthlySavings) },
      rows: [
        { label: 'Current payment', value: m(r.currentPayment) },
        { label: 'New payment', value: m(r.newPayment) },
        { label: 'Months to recover upfront costs', value: r.breakEvenMonths === null ? 'not applicable' : `${r.breakEvenMonths} months`, strong: true },
        { label: 'Total paid, new minus current', value: m(-r.lifetimeSavings) },
      ],
      steps,
      chart: cum.length > 2 ? { kind: 'line', title: 'Cumulative cash paid', currency: 'USD', xs: cum.slice(1).map((c) => c.year), xLabel: 'Year', series: [{ name: 'Keep current loan', values: cum.slice(1).map((c) => c.current) }, { name: 'Refinance', values: cum.slice(1).map((c) => c.refinanced) }] } : undefined,
      notes: ['A positive "total paid, new minus current" means the refinanced loan costs more overall. Taxes, insurance, escrow and any change in lender fees are not included.'],
      schedule: { currency: 'USD', rows: amortizationSchedule(r.newPrincipal, num(v, 'newRate'), r.newMonths), filename: 'refinance-new-loan-schedule' },
    };
  },
};
