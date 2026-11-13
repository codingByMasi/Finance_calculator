import { salesTax } from '../../calc/shopping';
import { money } from '../../format';
import { num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'mode', label: 'What do you want to do?', type: 'select', default: 'add',
      options: [{ value: 'add', label: 'Add sales tax to a price' }, { value: 'remove', label: 'Find the price before tax' }] },
    { id: 'amount', label: 'Amount', type: 'number', default: 250, min: 0, max: 1e13, step: 'any', prefix: 'cur' },
    { id: 'rate', label: 'Combined sales tax rate', type: 'number', default: 8.25, min: 0, max: 30, step: 0.001, suffix: '%', hint: 'State, county and city rates add up. Look up your exact combined rate on your state revenue department website.' },
  ],
  compute(v) {
    const mode = str(v, 'mode') as 'add' | 'remove', a = num(v, 'amount'), rate = num(v, 'rate');
    const r = salesTax(a, rate, mode);
    const m = (x: number) => money(x, 'USD', 2);
    const steps = mode === 'add'
      ? [`Tax = price × rate ÷ 100 = ${m(a)} × ${rate} ÷ 100 = ${m(r.tax)}.`, `Total = price + tax = ${m(a)} + ${m(r.tax)} = ${m(r.total)}.`]
      : [`Price before tax = total ÷ (1 + rate ÷ 100) = ${m(a)} ÷ ${(1 + rate / 100).toFixed(5)} = ${m(r.pretax)}.`, `Tax = total − price before tax = ${m(a)} − ${m(r.pretax)} = ${m(r.tax)}.`];
    return {
      headline: mode === 'add' ? { label: 'Total with tax', value: m(r.total) } : { label: 'Price before tax', value: m(r.pretax) },
      rows: [
        { label: 'Price before tax', value: m(r.pretax) },
        { label: `Sales tax (${rate}%)`, value: m(r.tax) },
        { label: 'Total', value: m(r.total), strong: true },
      ],
      steps,
      chart: r.total > 0 ? { kind: 'donut', title: 'Price vs tax', currency: 'USD', segments: [{ label: 'Price', value: r.pretax }, { label: 'Sales tax', value: r.tax }] } : undefined,
    };
  },
};
