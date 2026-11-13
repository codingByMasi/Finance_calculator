import { splitBill } from '../../calc/split';
import { money, pct } from '../../format';
import { currencyField, cur, num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'select',
  fields: [
    currencyField,
    { id: 'bill', label: 'Bill before tip', type: 'number', default: 120, min: 0, max: 1e9, step: 1, prefix: 'cur', slider: true, sliderMax: 1000 },
    { id: 'tip', label: 'Tip', type: 'number', default: 18, min: 0, max: 100, step: 0.5, suffix: '%', slider: true, sliderMax: 40, hint: 'Customs differ by country and venue. Enter the percentage you intend to leave.' },
    { id: 'people', label: 'Number of people', type: 'number', default: 4, min: 1, max: 1000, step: 1, slider: true, sliderMax: 20 },
    { id: 'round', label: 'Rounding', type: 'select', default: 'exact', options: [{ value: 'exact', label: 'Exact share' }, { value: 'up', label: 'Round each share up to a whole unit' }] },
  ],
  compute(v) {
    const c = cur(v, 'select');
    const m = (x: number, d = 2) => money(x, c, d);
    const r = splitBill({ bill: num(v, 'bill'), tipPercent: num(v, 'tip'), people: num(v, 'people'), roundUp: str(v, 'round') === 'up' });
    const steps = [
      `Tip = bill × tip % = ${m(num(v, 'bill'))} × ${pct(num(v, 'tip'))} = ${m(r.tip)}.`,
      `Total = bill + tip = ${m(num(v, 'bill'))} + ${m(r.tip)} = ${m(r.total)}.`,
      `Per person = total ÷ ${r.people} = ${m(r.perPerson)}.`,
    ];
    if (str(v, 'round') === 'up') steps.push(`Rounded up to a whole unit, each person pays ${m(r.perPersonPaid, 0)}, so the group pays ${m(r.collected)}: ${m(r.extraFromRounding)} more than the total.`);
    return {
      headline: { label: 'Amount per person', value: m(r.perPersonPaid) },
      rows: [
        { label: 'Tip', value: m(r.tip) },
        { label: 'Total including tip', value: m(r.total), strong: true },
        { label: 'People', value: String(r.people) },
        ...(str(v, 'round') === 'up' ? [{ label: 'Extra from rounding', value: m(r.extraFromRounding) }] : []),
      ],
      steps,
      chart: { kind: 'donut', title: 'Where the total goes', currency: c, segments: [{ label: 'Bill', value: num(v, 'bill') }, { label: 'Tip', value: r.tip }] },
    };
  },
};
