import { k401 } from '../../calc/us-retirement';
import { retirementUS as L } from '../../../config/retirement-us';
import { money, pct } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'age', label: 'Current age', type: 'number', default: 35, min: 16, max: 90, step: 1, suffix: 'years', slider: true },
    { id: 'retireAge', label: 'Age when you stop contributing', type: 'number', default: 65, min: 17, max: 100, step: 1, suffix: 'years', slider: true },
    { id: 'balance', label: 'Current 401(k) balance', type: 'number', default: 50000, min: 0, max: 1e10, step: 1000, prefix: 'cur', slider: true, sliderMax: 1000000 },
    { id: 'salary', label: 'Annual salary', type: 'number', default: 85000, min: 0, max: 1e9, step: 1000, prefix: 'cur', slider: true, sliderMax: 500000 },
    { id: 'employeePct', label: 'Your contribution (% of salary)', type: 'number', default: 8, min: 0, max: 100, step: 0.5, suffix: '%', slider: true, sliderMax: 40 },
    { id: 'matchPct', label: 'Employer match rate', type: 'number', default: 50, min: 0, max: 200, step: 5, suffix: '% of your contribution', hint: 'For example, 50% means the employer adds 50 cents per dollar you contribute.' },
    { id: 'matchCap', label: 'Match applies up to', type: 'number', default: 6, min: 0, max: 100, step: 0.5, suffix: '% of salary' },
    { id: 'growth', label: 'Expected yearly salary growth', type: 'number', default: 3, min: 0, max: 20, step: 0.1, suffix: '%' },
    { id: 'ret', label: 'Assumed yearly investment return', type: 'number', default: 6, min: 0, max: 20, step: 0.1, suffix: '%', slider: true, sliderMax: 15, hint: 'An assumption you choose, not a prediction. Real returns vary and can be negative.' },
  ],
  compute(v) {
    const age = num(v, 'age'), ra = num(v, 'retireAge');
    if (ra <= age) return { error: 'The age you stop contributing must be higher than your current age.', headline: { label: '', value: '' }, rows: [], steps: [] };
    const r = k401({ age, retireAge: ra, balance: num(v, 'balance'), salary: num(v, 'salary'), employeePercent: num(v, 'employeePct'), matchPercent: num(v, 'matchPct'), matchCapPercent: num(v, 'matchCap'), salaryGrowthPercent: num(v, 'growth'), returnPercent: num(v, 'ret'), limits: { deferral: L.deferralLimit, catchUp50: L.catchUp50, catchUp6063: L.catchUp6063 } });
    const m = (x: number) => money(x, 'USD');
    const steps = [
      `Year 1 contribution: ${pct(num(v, 'employeePct'))} of ${m(num(v, 'salary'))} = ${m(num(v, 'salary') * num(v, 'employeePct') / 100)}, limited to the ${L.planYear} cap of ${m(L.deferralLimit)} (plus catch-up from age 50). You contribute ${m(r.firstYearEmployee)}.`,
      `Employer match: ${pct(num(v, 'matchPct'), 0)} of your contribution, up to ${pct(num(v, 'matchCap'))} of salary = ${m(r.firstYearEmployer)} in year 1.`,
      `Each month the balance grows by ${pct(num(v, 'ret'))} ÷ 12 and that month's contributions are added. Salary rises ${pct(num(v, 'growth'))} a year.`,
      `After ${r.years} years the projected balance is ${m(r.finalBalance)}: ${m(r.totalEmployee)} from you, ${m(r.totalEmployer)} from the employer and ${m(r.growth)} of growth, plus the starting balance of ${m(num(v, 'balance'))}.`,
    ];
    const notes = [`Limits used: ${m(L.deferralLimit)} (${L.planYear}), +${m(L.catchUp50)} from age 50, +${m(L.catchUp6063)} at ages 60 to 63. They are held at these amounts for every future year.`];
    if (r.yearsCapped > 0) notes.push(`Your contribution was limited by the annual cap in ${r.yearsCapped} of ${r.years} years.`);
    return {
      headline: { label: 'Balance at the end', value: m(r.finalBalance) },
      rows: [
        { label: 'Your contributions', value: m(r.totalEmployee) },
        { label: 'Employer contributions', value: m(r.totalEmployer) },
        { label: 'Investment growth', value: m(r.growth), strong: true },
        { label: 'Years of contributions', value: String(r.years) },
      ],
      steps, notes,
      chart: { kind: 'line', title: 'Projected balance by age', currency: 'USD', xs: r.rows.map((x) => x.age), xLabel: 'Age', series: [{ name: 'Balance', values: r.rows.map((x) => x.balance) }] },
    };
  },
};
