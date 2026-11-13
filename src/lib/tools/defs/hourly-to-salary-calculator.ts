import { hourlyToSalary } from '../../calc/shopping';
import { money } from '../../format';
import { num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'rate', label: 'Hourly rate', type: 'number', default: 28, min: 0, max: 1e7, step: 0.25, prefix: 'cur', slider: true, sliderMax: 200 },
    { id: 'hours', label: 'Hours per week', type: 'number', default: 40, min: 0, max: 168, step: 0.5, suffix: 'hours', slider: true },
    { id: 'weeks', label: 'Weeks worked per year', type: 'number', default: 52, min: 0, max: 52, step: 1, suffix: 'weeks' },
    { id: 'unpaid', label: 'Unpaid weeks off', type: 'number', default: 0, min: 0, max: 52, step: 1, suffix: 'weeks', hint: 'Leave at 0 if your vacation and holidays are paid.' },
  ],
  compute(v) {
    const rate = num(v, 'rate'), h = num(v, 'hours'), w = num(v, 'weeks'), u = num(v, 'unpaid');
    const r = hourlyToSalary(rate, h, w, u);
    const m = (x: number, d = 0) => money(x, 'USD', d);
    return {
      headline: { label: 'Annual salary', value: m(r.annual) },
      rows: [
        { label: 'Monthly', value: m(r.monthly) },
        { label: 'Every two weeks', value: m(r.biweekly) },
        { label: 'Weekly', value: m(r.weekly) },
        { label: 'Daily (5-day week)', value: m(r.daily, 2) },
        { label: 'Hours worked per year', value: `${r.hoursPerYear}` },
      ],
      steps: [
        `Paid weeks = weeks worked − unpaid weeks off = ${w} − ${u} = ${r.paidWeeks}.`,
        `Hours per year = hours per week × paid weeks = ${h} × ${r.paidWeeks} = ${r.hoursPerYear}.`,
        `Annual salary = hourly rate × hours per year = ${m(rate, 2)} × ${r.hoursPerYear} = ${m(r.annual)}.`,
        `Monthly = annual ÷ 12 = ${m(r.annual)} ÷ 12 = ${m(r.monthly, 2)}.`,
        `Every two weeks = annual ÷ 26 = ${m(r.annual)} ÷ 26 = ${m(r.biweekly, 2)}.`,
        `Weekly = hourly rate × hours per week = ${m(rate, 2)} × ${h} = ${m(r.weekly, 2)}; daily = weekly ÷ 5 = ${m(r.daily, 2)}.`,
      ],
      notes: ['Gross (before tax) pay. Use the paycheck calculator for take-home pay.'],
    };
  },
};
