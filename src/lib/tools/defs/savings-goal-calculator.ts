import { savingsGoal } from '../../calc/invest';
import { money } from '../../format';
import { currencyField, cur, num, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'select',
  fields: [
    currencyField,
    { id: 'goal', label: 'Savings goal', type: 'number', default: 50000, min: 0, max: 1e13, step: 1000, prefix: 'cur', slider: true, sliderMax: 1000000 },
    { id: 'start', label: 'Already saved', type: 'number', default: 5000, min: 0, max: 1e13, step: 500, prefix: 'cur' },
    { id: 'rate', label: 'Expected annual return', type: 'number', default: 5, min: 0, max: 50, step: 0.1, suffix: '%', slider: true, sliderMax: 15 },
    { id: 'years', label: 'Time to reach the goal', type: 'number', default: 8, min: 0, max: 60, step: 0.5, suffix: 'years', slider: true, sliderMax: 40 },
  ],
  compute(v) {
    const c = cur(v, 'select');
    const m = (x: number, d = 0) => money(x, c, d);
    const G = num(v, 'goal'), S = num(v, 'start'), rate = num(v, 'rate'), years = num(v, 'years');
    const r = savingsGoal(G, S, rate, years);
    const mr = rate / 1200;
    const steps: string[] = [`Months n = ${years} × 12 = ${r.months}; monthly rate r = ${rate}% ÷ 12 ÷ 100 = ${+mr.toFixed(6)}.`];
    if (r.alreadyReached) steps.push(`Your ${m(S)} already grows to more than ${m(G)} on its own, so no extra monthly saving is needed.`);
    else if (r.months === 0) steps.push(`With no time left you need the full gap: ${m(G)} − ${m(S)} = ${m(r.monthlyNeeded)}.`);
    else {
      const g = Math.pow(1 + mr, r.months);
      steps.push(`Starting balance after growth = ${m(S)} × (1 + r)^n = ${m(S)} × ${g.toFixed(4)} = ${m(S * g, 2)}.`);
      steps.push(`Shortfall = goal − grown balance = ${m(G)} − ${m(S * g, 2)} = ${m(G - S * g, 2)}.`);
      steps.push(rate === 0
        ? `Monthly saving = shortfall ÷ n = ${m(G - S, 2)} ÷ ${r.months} = ${m(r.monthlyNeeded, 2)}.`
        : `Monthly saving = shortfall × r ÷ ((1 + r)^n − 1) = ${m(G - S * g, 2)} × ${+mr.toFixed(6)} ÷ ${(g - 1).toFixed(4)} = ${m(r.monthlyNeeded, 2)}.`);
    }
    steps.push(`Total you contribute = ${m(r.monthlyNeeded, 2)} × ${r.months} = ${m(r.totalContributed)}; interest earned ≈ ${m(r.interestEarned)}.`);
    return {
      headline: { label: 'Save each month', value: m(r.monthlyNeeded) },
      rows: [
        { label: 'Savings goal', value: m(G) },
        { label: 'Already saved', value: m(S) },
        { label: 'Total you contribute', value: m(r.totalContributed) },
        { label: 'Interest earned', value: m(r.interestEarned), strong: true },
      ],
      steps,
      chart: G > 0 ? { kind: 'donut', title: 'How the goal is reached', currency: c, segments: [{ label: 'Already saved', value: S }, { label: 'Your deposits', value: r.totalContributed }, { label: 'Interest', value: Math.max(0, r.interestEarned) }] } : undefined,
      notes: ['Assumes deposits at the end of each month and a steady return.'],
    };
  },
};
