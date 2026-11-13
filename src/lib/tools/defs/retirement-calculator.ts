import { retirementPlan } from '../../calc/us-retirement';
import { money, pct } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'age', label: 'Current age', type: 'number', default: 35, min: 16, max: 90, step: 1, suffix: 'years', slider: true },
    { id: 'retireAge', label: 'Retirement age', type: 'number', default: 65, min: 17, max: 100, step: 1, suffix: 'years', slider: true },
    { id: 'planAge', label: 'Plan to age', type: 'number', default: 95, min: 18, max: 120, step: 1, suffix: 'years', hint: 'How long the money should last.' },
    { id: 'savings', label: 'Current retirement savings', type: 'number', default: 100000, min: 0, max: 1e10, step: 1000, prefix: 'cur', slider: true, sliderMax: 2000000 },
    { id: 'monthly', label: 'Monthly contribution', type: 'number', default: 1000, min: 0, max: 1e7, step: 50, prefix: 'cur', slider: true, sliderMax: 10000 },
    { id: 'income', label: 'Monthly income wanted (in today\'s dollars)', type: 'number', default: 5000, min: 0, max: 1e7, step: 100, prefix: 'cur', slider: true, sliderMax: 20000 },
    { id: 'ss', label: 'Other monthly income, such as Social Security (today\'s dollars)', type: 'number', default: 2000, min: 0, max: 1e7, step: 100, prefix: 'cur', slider: true, sliderMax: 10000, hint: 'Enter an estimate from your own statement. This tool does not estimate benefits.' },
    { id: 'pre', label: 'Assumed return before retirement', type: 'number', default: 6, min: 0, max: 20, step: 0.1, suffix: '%' },
    { id: 'post', label: 'Assumed return during retirement', type: 'number', default: 4, min: 0, max: 20, step: 0.1, suffix: '%' },
    { id: 'infl', label: 'Assumed yearly inflation', type: 'number', default: 2.5, min: 0, max: 15, step: 0.1, suffix: '%' },
  ],
  compute(v) {
    const age = num(v, 'age'), ra = num(v, 'retireAge'), pa = num(v, 'planAge');
    if (ra <= age) return { error: 'Retirement age must be higher than your current age.', headline: { label: '', value: '' }, rows: [], steps: [] };
    if (pa <= ra) return { error: '"Plan to age" must be higher than the retirement age.', headline: { label: '', value: '' }, rows: [], steps: [] };
    const r = retirementPlan({ age, retireAge: ra, planAge: pa, savings: num(v, 'savings'), monthlyContribution: num(v, 'monthly'), preReturnPercent: num(v, 'pre'), postReturnPercent: num(v, 'post'), inflationPercent: num(v, 'infl'), incomeToday: num(v, 'income'), socialSecurityToday: num(v, 'ss') });
    const m = (x: number) => money(x, 'USD');
    const steps = [
      `Years until retirement: ${ra} − ${age} = ${r.yearsToRetire}. Savings grow at ${pct(num(v, 'pre'))} a year, compounded monthly, with ${m(num(v, 'monthly'))} added each month. Projected balance at ${ra}: ${m(r.balanceAtRetirement)}.`,
      `Income gap in today's dollars: ${m(num(v, 'income'))} − ${m(num(v, 'ss'))} = ${m(Math.max(0, num(v, 'income') - num(v, 'ss')))} a month. Raised by ${pct(num(v, 'infl'))} inflation for ${r.yearsToRetire} years, the first-year withdrawal is ${m(r.annualGapAtRetirement)}.`,
      `Withdrawals rise with inflation each year for ${r.retirementYears} years while the balance earns ${pct(num(v, 'post'))}. The savings that would cover them all, valued at retirement, are ${m(r.nestEggNeeded)}.`,
      r.shortfall > 0
        ? `Projected balance is ${m(r.shortfall)} below that amount. Closing the gap by saving more each month would take about ${m(r.extraMonthlyNeeded)} extra, under these assumptions.`
        : `Projected balance is ${m(-r.shortfall)} above that amount under these assumptions.`,
    ];
    return {
      headline: { label: 'Balance at retirement', value: m(r.balanceAtRetirement) },
      rows: [
        { label: 'Savings needed at retirement', value: m(r.nestEggNeeded) },
        { label: r.shortfall > 0 ? 'Gap to that amount' : 'Above that amount', value: m(Math.abs(r.shortfall)), strong: true },
        { label: 'Extra monthly saving to close the gap', value: m(r.extraMonthlyNeeded) },
        { label: 'Money lasts until', value: r.lastsToAge === null ? `at least age ${pa}` : `about age ${r.lastsToAge.toFixed(1)}` },
      ],
      steps,
      notes: ['All inputs are assumptions. Returns, inflation and lifespan are uncertain and taxes are not included.'],
      chart: { kind: 'line', title: 'Projected balance in retirement', currency: 'USD', xs: r.path.map((p) => p.age), xLabel: 'Age', series: [{ name: 'Balance', values: r.path.map((p) => p.balance) }] },
    };
  },
};
