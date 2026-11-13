import { computePaycheck, type FilingStatus } from '../../calc/tax-us';
import { taxUS, stateTaxes } from '../../../config/tax-us';
import { money, pct } from '../../format';
import { num, str, type ToolDef } from '../types';

const m = (x: number, d = 0) => money(x, 'USD', d);

export const def: ToolDef = {
  currency: 'USD',
  fields: [
    { id: 'gross', label: 'Annual gross salary', type: 'number', default: 85000, min: 0, max: 1e10, step: 1000, prefix: 'cur', slider: true, sliderMax: 400000 },
    { id: 'freq', label: 'Pay frequency', type: 'select', default: '26',
      options: [{ value: '52', label: 'Weekly (52)' }, { value: '26', label: 'Every two weeks (26)' }, { value: '24', label: 'Twice a month (24)' }, { value: '12', label: 'Monthly (12)' }] },
    { id: 'filing', label: 'Filing status', type: 'select', default: 'single',
      options: [{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married filing jointly' }, { value: 'head', label: 'Head of household' }] },
    { id: 'state', label: 'State', type: 'select', default: 'TX', options: stateTaxes.map((s) => ({ value: s.code, label: s.name })) },
    { id: 'pretax', label: 'Pre-tax contributions per year (401(k), HSA)', type: 'number', default: 6000, min: 0, max: 1e9, step: 500, prefix: 'cur' },
  ],
  compute(v) {
    const filing = str(v, 'filing') as FilingStatus;
    const r = computePaycheck({ grossAnnual: num(v, 'gross'), payPeriodsPerYear: Number(str(v, 'freq')), filing, stateCode: str(v, 'state'), preTaxAnnual: num(v, 'pretax') });
    const steps: string[] = [
      `Federal taxable income = gross ${m(r.gross)} − pre-tax contributions ${m(r.preTax)} − standard deduction ${m(r.standardDeduction)} = ${m(r.federalTaxable)}.`,
    ];
    for (const l of r.federalLines) steps.push(`  ${pct(l.rate * 100)} bracket: ${m(l.taxable)} × ${pct(l.rate * 100)} = ${m(l.tax)}.`);
    steps.push(`Federal income tax = ${m(r.federal)}.`);
    steps.push(`Social Security = min(gross, ${m(taxUS.fica.socialSecurityWageBase)}) × ${pct(taxUS.fica.socialSecurityRate * 100)} = ${m(r.socialSecurity)}.`);
    steps.push(`Medicare = gross × ${pct(taxUS.fica.medicareRate * 100)} = ${m(r.medicare)}${r.additionalMedicare ? `, plus additional Medicare ${m(r.additionalMedicare)}` : ''}.`);
    const sd = r.stateDetail;
    steps.push(sd.taxable === 0 && sd.tax === 0
      ? `${r.stateName} income tax = ${m(0)}${sd.deduction === 0 && sd.taxBeforeCredits === 0 ? ' (no state tax on wages, or income below the state threshold)' : ''}.`
      : `${r.stateName} income tax: taxable = ${m(r.gross - r.preTax)} − state deductions ${m(sd.deduction)} = ${m(sd.taxable)}; tax from the state schedule = ${m(sd.taxBeforeCredits)}${sd.credits ? `; less credits ${m(sd.credits)}` : ''} = ${m(r.state)} (${pct(r.stateRate * 100, 2)} of gross).`);
    steps.push(`Net pay = gross − pre-tax − federal − FICA − state = ${m(r.gross)} − ${m(r.preTax)} − ${m(r.federal)} − ${m(r.fica)} − ${m(r.state)} = ${m(r.netAnnual)} a year, or ${m(r.netPerPeriod, 2)} per paycheck (${r.periods} pay periods).`);
    return {
      headline: { label: 'Take-home per paycheck', value: m(r.netPerPeriod, 2) },
      rows: [
        { label: 'Gross per paycheck', value: m(r.grossPerPeriod, 2) },
        { label: 'Federal income tax (year)', value: m(r.federal) },
        { label: 'Social Security + Medicare (year)', value: m(r.fica) },
        { label: `${r.stateName} income tax (year)`, value: m(r.state) },
        { label: 'Take-home per year', value: m(r.netAnnual), strong: true },
        { label: 'Take-home per month', value: m(r.netAnnual / 12) },
        { label: 'Effective tax rate', value: pct(r.effectiveRate, 1) },
      ],
      steps,
      chart: r.gross > 0 ? { kind: 'donut', title: 'Where your pay goes', currency: 'USD', segments: [
        { label: 'Take-home', value: r.netAnnual }, { label: 'Federal tax', value: r.federal }, { label: 'FICA', value: r.fica },
        { label: 'State tax', value: r.state }, { label: 'Pre-tax savings', value: r.preTax }] } : undefined,
      notes: [...(r.stateNote ? [r.stateNote] : []), 'Local taxes and state payroll programs (SDI, FLI) are not included.', `Federal figures are for tax year ${taxUS.taxYear} (IRS). State schedules are from a secondary source and are not yet confirmed.`],
    };
  },
};
