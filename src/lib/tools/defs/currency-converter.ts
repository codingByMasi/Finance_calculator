import { convert, rateBetween } from '../../calc/split';
import rates from '../../../data/fx-rates.json';
import { num, str, type ToolDef } from '../types';

const names: Record<string, string> = { USD: 'US dollar', INR: 'Indian rupee', EUR: 'Euro', GBP: 'British pound', JPY: 'Japanese yen', CAD: 'Canadian dollar', AUD: 'Australian dollar', SGD: 'Singapore dollar', CHF: 'Swiss franc', CNY: 'Chinese yuan' };
const options = Object.keys(rates.rates).map((c) => ({ value: c, label: `${c} · ${names[c] ?? c}` }));
const fmt = (x: number, code: string) => `${new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: code === 'JPY' ? 0 : 2, minimumFractionDigits: code === 'JPY' ? 0 : 2 }).format(x)} ${code}`;

export const def: ToolDef = {
  /** amounts are shown with ISO codes, so no single currency symbol applies */
  currency: 'USD',
  fields: [
    { id: 'amount', label: 'Amount', type: 'number', default: 1000, min: 0, max: 1e12, step: 1 },
    { id: 'from', label: 'From', type: 'select', default: 'USD', options },
    { id: 'to', label: 'To', type: 'select', default: 'INR', options },
  ],
  compute(v) {
    const a = num(v, 'amount'), from = str(v, 'from'), to = str(v, 'to');
    const out = convert(a, from, to, rates);
    const r1 = rateBetween(from, to, rates), r2 = rateBetween(to, from, rates);
    const rf = rates.rates as Record<string, number>;
    return {
      headline: { label: 'Converted amount', value: fmt(out, to) },
      rows: [
        { label: `1 ${from}`, value: `${+r1.toPrecision(6)} ${to}` },
        { label: `1 ${to}`, value: `${+r2.toPrecision(6)} ${from}` },
        { label: 'Rates dated', value: rates.date, strong: true },
      ],
      steps: [
        `The rates are quoted per 1 ${rates.base}: ${from} = ${rf[from]}, ${to} = ${rf[to]}.`,
        `Converted amount = amount × rate(${to}) ÷ rate(${from}) = ${a} × ${rf[to]} ÷ ${rf[from]} = ${fmt(out, to)}.`,
      ],
      notes: [`Reference rates from the ${rates.source}, dated ${rates.date}. Indicative only: banks, card networks and money-transfer services use their own rates and add fees.`],
    };
  },
};
