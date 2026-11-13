import { hraExemption } from '../../calc/india-savings';
import { hraIndia } from '../../../config/hra-india';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

const limbText = { hra: 'the HRA you actually receive', rent: 'rent paid minus 10% of basic salary', share: 'the share of basic salary' } as const;

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'basic', label: 'Basic salary + dearness allowance (per month)', type: 'number', default: 50000, min: 0, max: 1e9, step: 500, prefix: 'cur', slider: true, sliderMax: 300000 },
    { id: 'hra', label: 'HRA received (per month)', type: 'number', default: 20000, min: 0, max: 1e9, step: 500, prefix: 'cur', slider: true, sliderMax: 150000 },
    { id: 'rent', label: 'Rent paid (per month)', type: 'number', default: 18000, min: 0, max: 1e9, step: 500, prefix: 'cur', slider: true, sliderMax: 150000 },
    { id: 'city', label: 'City of residence', type: 'select', default: 'metro',
      options: [{ value: 'metro', label: `Metro city (${hraIndia.metroCities.join(', ')})` }, { value: 'other', label: 'Any other city or town' }],
      hint: 'The list of metro cities has changed recently. Check the current rules for your city.' },
  ],
  compute(v) {
    const metro = str(v, 'city') === 'metro';
    const r = hraExemption({ basicMonthly: num(v, 'basic'), hraMonthly: num(v, 'hra'), rentMonthly: num(v, 'rent'), metro });
    const m = (x: number) => money(x, 'INR');
    const steps = [
      `Limit 1: HRA received = ${m(r.limits.hraReceived)} a month.`,
      `Limit 2: rent paid − ${pct(hraIndia.rentExcessShare * 100)} of basic = ${m(num(v, 'rent'))} − ${m(hraIndia.rentExcessShare * num(v, 'basic'))} = ${m(r.limits.rentMinusTenPercent)} (not below zero).`,
      `Limit 3: ${pct(r.sharePercent, 0)} of basic (${metro ? 'metro' : 'other city'}) = ${m(r.limits.share)}.`,
      `The exemption is the smallest of the three: ${m(r.exemptMonthly)} a month, set by ${limbText[r.binding]}.`,
      `Taxable HRA = ${m(r.limits.hraReceived)} − ${m(r.exemptMonthly)} = ${m(r.taxableMonthly)} a month.`,
    ];
    return {
      headline: { label: 'Estimated HRA exemption per year', value: m(r.exemptAnnual) },
      rows: [
        { label: 'Exempt per month', value: m(r.exemptMonthly) },
        { label: 'Taxable HRA per year', value: m(r.taxableAnnual), strong: true },
        { label: 'Limit that applies', value: limbText[r.binding] },
      ],
      steps,
      chart: { kind: 'donut', title: 'HRA received per year', currency: 'INR', segments: [{ label: 'Exempt', value: r.exemptAnnual }, { label: 'Taxable', value: r.taxableAnnual }] },
      notes: ['HRA exemption is generally available only under the old tax regime. Rent receipts and landlord details may be needed.'],
    };
  },
};
