import { sip, lumpsum, sipByYear } from '../../calc/invest';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'mode', label: 'Investment type', type: 'select', default: 'sip',
      options: [{ value: 'sip', label: 'SIP (monthly investment)' }, { value: 'lump', label: 'Lumpsum (one-time)' }] },
    { id: 'monthly', label: 'Monthly investment', type: 'number', default: 10000, min: 0, max: 1e10, step: 500, prefix: 'cur', slider: true, sliderMax: 200000, showIf: { field: 'mode', in: ['sip'] } },
    { id: 'lump', label: 'Lumpsum amount', type: 'number', default: 500000, min: 0, max: 1e12, step: 5000, prefix: 'cur', slider: true, sliderMax: 10000000, showIf: { field: 'mode', in: ['lump'] } },
    { id: 'rate', label: 'Expected return (per year)', type: 'number', default: 12, min: 0, max: 50, step: 0.1, suffix: '%', slider: true, sliderMax: 30 },
    { id: 'years', label: 'Investment period', type: 'number', default: 10, min: 0, max: 60, step: 1, suffix: 'years', slider: true },
  ],
  compute(v) {
    const mode = str(v, 'mode'), rate = num(v, 'rate'), years = num(v, 'years');
    const m = (x: number, d = 0) => money(x, 'INR', d);
    const steps: string[] = [];
    let fv: number, invested: number, gain: number;
    const xs: number[] = [], inv: number[] = [], val: number[] = [];
    if (mode === 'sip') {
      const P = num(v, 'monthly');
      const s = sip(P, rate, years);
      ({ futureValue: fv, invested, gain } = s);
      if (s.months === 0) steps.push('Investment period is 0, so nothing is invested and nothing grows.');
      else if (rate === 0) steps.push(`Return is 0%, so future value = P × n = ${m(P)} × ${s.months} = ${m(fv)}.`);
      else {
        const g = Math.pow(1 + s.monthlyRate, s.months);
        steps.push(`Monthly rate r = ${rate}% ÷ 12 ÷ 100 = ${+s.monthlyRate.toFixed(6)}.`);
        steps.push(`Number of instalments n = ${years} years × 12 = ${s.months}.`);
        steps.push(`(1 + r)^n = ${g.toFixed(4)}.`);
        steps.push(`Growth factor = ((1 + r)^n − 1) ÷ r = (${g.toFixed(4)} − 1) ÷ ${+s.monthlyRate.toFixed(6)} = ${((g - 1) / s.monthlyRate).toFixed(4)}.`);
        steps.push(`Future value = P × growth factor × (1 + r) = ${m(P)} × ${((g - 1) / s.monthlyRate).toFixed(4)} × ${(1 + s.monthlyRate).toFixed(6)} = ${m(fv)}.`);
      }
      steps.push(`Amount invested = P × n = ${m(P)} × ${s.months} = ${m(invested)}.`);
      steps.push(`Estimated gain = ${m(fv)} − ${m(invested)} = ${m(gain)}.`);
      for (const r of sipByYear(P, rate, years)) { xs.push(r.year); inv.push(r.invested); val.push(r.value); }
    } else {
      const P = num(v, 'lump');
      const l = lumpsum(P, rate, years);
      ({ futureValue: fv, invested, gain } = l);
      steps.push(`Annual rate r = ${rate}% ÷ 100 = ${rate / 100}.`);
      steps.push(`Growth factor = (1 + r)^t = (1 + ${rate / 100})^${years} = ${Math.pow(1 + rate / 100, years).toFixed(4)}.`);
      steps.push(`Future value = P × growth factor = ${m(P)} × ${Math.pow(1 + rate / 100, years).toFixed(4)} = ${m(fv)}.`);
      steps.push(`Estimated gain = ${m(fv)} − ${m(invested)} = ${m(gain)}.`);
      for (let y = 1; y <= Math.ceil(years); y++) { xs.push(y); inv.push(P); val.push(lumpsum(P, rate, Math.min(y, years)).futureValue); }
    }
    return {
      headline: { label: 'Estimated future value', value: m(fv) },
      rows: [
        { label: 'Amount invested', value: m(invested) },
        { label: 'Estimated gain', value: m(gain) },
        { label: 'Wealth multiple', value: invested ? `${(fv / invested).toFixed(2)}×` : '—' },
        { label: 'Gain as share of value', value: fv ? pct((gain / fv) * 100, 1) : '0%' },
      ],
      steps,
      chart: xs.length > 1 ? { kind: 'line', title: 'Growth by year', currency: 'INR', xs, xLabel: 'Year', series: [{ name: 'Invested', values: inv }, { name: 'Value', values: val }] } : undefined,
      notes: ['Market returns are not guaranteed. This is a projection, not a forecast.'],
    };
  },
};
