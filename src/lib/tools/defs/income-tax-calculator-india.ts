import { computeIndiaTax, type IndiaTaxResult } from '../../calc/tax-india';
import { taxIndia } from '../../../config/tax-india';
import { money, pct } from '../../format';
import { num, type ToolDef } from '../types';

const m = (x: number) => money(x, 'INR');

function steps(label: string, r: IndiaTaxResult): string[] {
  const s: string[] = [];
  s.push(`${label}: gross salary ${m(r.gross)} − standard deduction ${m(r.standardDeduction)}${r.regime === 'old' ? ` − other deductions ${m(r.otherDeductions)}` : ''} = taxable income ${m(r.taxableIncome)}.`);
  for (const l of r.slabLines) {
    if (l.rate > 0) s.push(`  Slab ${m(l.from)} to ${Number.isFinite(l.to) ? m(l.to) : 'above'} at ${pct(l.rate * 100)}: ${m(l.taxable)} × ${pct(l.rate * 100)} = ${m(l.tax)}.`);
  }
  s.push(`  Slab tax = ${m(r.slabTax)}. Section 87A rebate (incl. marginal relief where it applies) = −${m(r.rebate)}.`);
  if (r.surcharge > 0) s.push(`  Surcharge at ${pct(r.surchargeRate * 100)} = ${m(r.surcharge)}.`);
  s.push(`  Health and education cess (${pct(taxIndia.cess * 100)}) = ${m(r.cess)}.`);
  s.push(`  Total tax = ${m(r.totalTax)}. Take-home before other deductions = ${m(r.gross)} − ${m(r.totalTax)} = ${m(r.netAnnual)} a year (${m(r.netMonthly)} a month).`);
  return s;
}

export const def: ToolDef = {
  currency: 'INR',
  fields: [
    { id: 'gross', label: 'Annual gross salary', type: 'number', default: 1800000, min: 0, max: 1e11, step: 10000, prefix: 'cur', slider: true, sliderMax: 10000000 },
    { id: 'c80', label: 'Section 80C investments (old regime)', type: 'number', default: 150000, min: 0, max: 1e9, step: 5000, prefix: 'cur', hint: 'EPF, PPF, ELSS, life insurance premium and similar. Capped at the 80C limit set in the tax config.' },
    { id: 'other', label: 'Other deductions: 80D, NPS, home loan interest (old regime)', type: 'number', default: 25000, min: 0, max: 1e9, step: 5000, prefix: 'cur' },
    { id: 'hra', label: 'HRA exemption (old regime)', type: 'number', default: 0, min: 0, max: 1e9, step: 5000, prefix: 'cur', hint: 'Work this out separately from your rent and basic salary, then enter the exempt amount.' },
  ],
  compute(v) {
    const base = { grossAnnual: num(v, 'gross') };
    const n = computeIndiaTax({ ...base, regime: 'new' });
    const o = computeIndiaTax({ ...base, regime: 'old', deduction80C: num(v, 'c80'), otherDeductions: num(v, 'other'), hraExemption: num(v, 'hra') });
    const better = n.totalTax <= o.totalTax ? n : o;
    const saving = Math.abs(n.totalTax - o.totalTax);
    return {
      headline: { label: `Better for you: ${better.regime === 'new' ? 'New' : 'Old'} regime`, value: saving === 0 ? 'Same tax in both' : `Saves ${m(saving)} a year` },
      rows: [
        { label: 'New regime: taxable income', value: m(n.taxableIncome) },
        { label: 'New regime: total tax', value: m(n.totalTax) },
        { label: 'New regime: take-home / month', value: m(n.netMonthly), strong: true },
        { label: 'Old regime: taxable income', value: m(o.taxableIncome) },
        { label: 'Old regime: total tax', value: m(o.totalTax) },
        { label: 'Old regime: take-home / month', value: m(o.netMonthly), strong: true },
        { label: 'Effective tax rate (new / old)', value: `${pct(n.effectiveRate, 1)} / ${pct(o.effectiveRate, 1)}` },
      ],
      steps: [...steps('New regime', n), ...steps('Old regime', o)],
      chart: better.gross > 0 ? { kind: 'donut', title: `Where your salary goes (${better.regime} regime)`, currency: 'INR', segments: [{ label: 'Take-home', value: better.netAnnual }, { label: 'Income tax', value: better.totalTax }] } : undefined,
      notes: [`Uses FY ${taxIndia.financialYear} rules as recorded in the tax config. Excludes employee PF, professional tax and TDS timing.`],
    };
  },
};
