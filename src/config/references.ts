import { taxIndia } from './tax-india';
import { taxUS } from './tax-us';
import { gstIndia } from './gst-india';
import sources from './data-sources.json';
import { money, pct } from '../lib/format';

export interface Reference { label: string; url: string; kind: 'official' | 'secondary' | 'method' }

const titleFor = (url: string): string => sources.sources.find((s) => s.url === url)?.title ?? new URL(url).hostname;
const kindFor = (url: string): Reference['kind'] => (/taxfoundation\.org/.test(url) ? 'secondary' : 'official');
const refs = (urls: string[]): Reference[] => urls.map((url) => ({ label: titleFor(url), url, kind: kindFor(url) }));

/** Sources for each calculator page, drawn from the data configs (never retyped here). */
export function toolReferences(slug: string): Reference[] {
  switch (slug) {
    case 'income-tax-calculator-india': return refs(taxIndia.sourceUrls);
    case 'paycheck-calculator': return refs(taxUS.sourceUrls);
    case 'gst-calculator': return refs(gstIndia.sourceUrls);
    case 'mortgage-calculator': return refs(['https://consumerfinance.gov/about-us/blog/your-mortgage-calculator-may-be-setting-you-surprise']);
    case 'compound-interest-calculator': return refs(['https://www.consumerfinance.gov/ask-cfpb/what-is-compound-interest-en-1683/']);
    default: return [];
  }
}

export interface FigureSource { figure: string; value: string; url: string; label: string }
const [inRates, inThresholds] = taxIndia.sourceUrls;
const [usRevProc, usRelease, usTc751, usSsa, usStates] = taxUS.sourceUrls;
const inr = (n: number) => money(n, 'INR');
const usd = (n: number) => money(n, 'USD');
const f = (figure: string, value: string, url: string): FigureSource => ({ figure, value, url, label: titleFor(url) });

/** "Figure -> value -> where it comes from" rows. Values are read from the config files, so they cannot drift. */
export function figureSources(slug: string): FigureSource[] {
  if (slug === 'income-tax-calculator-india') {
    const n = taxIndia.newRegime, o = taxIndia.oldRegime;
    return [
      f('New-regime slabs', `${n.slabs.length} slabs, 0% to ${pct(n.slabs.at(-1)!.rate * 100, 0)}`, inRates),
      f('Old-regime slabs', `${o.slabs.length} slabs, 0% to ${pct(o.slabs.at(-1)!.rate * 100, 0)}`, inRates),
      f('87A rebate, new regime', `up to ${inr(n.rebate.maxRebate)} if taxable income ≤ ${inr(n.rebate.maxTaxableIncome)}`, inThresholds),
      f('87A rebate, old regime', `up to ${inr(o.rebate.maxRebate)} if taxable income ≤ ${inr(o.rebate.maxTaxableIncome)}`, inThresholds),
      f('Standard deduction', `${inr(n.standardDeduction)} new / ${inr(o.standardDeduction)} old`, inThresholds),
      f('Section 80C limit', inr(o.deduction80CLimit), inThresholds),
      f('Surcharge bands', `${n.surcharge.length} bands new regime (max ${pct(Math.max(...n.surcharge.map((b) => b.rate)) * 100, 0)}), ${o.surcharge.length} old`, inRates),
      f('Health and education cess', pct(taxIndia.cess * 100, 0), inRates),
    ];
  }
  if (slug === 'paycheck-calculator') {
    const fi = taxUS.fica;
    return [
      f('Federal brackets (single, married, head of household)', `${taxUS.brackets.single.length} rates, 10% to 37%`, usRevProc),
      f('Standard deduction', `${usd(taxUS.standardDeduction.single)} single / ${usd(taxUS.standardDeduction.married)} married / ${usd(taxUS.standardDeduction.head)} head of household`, usRelease),
      f('Social Security', `${pct(fi.socialSecurityRate * 100)} up to ${usd(fi.socialSecurityWageBase)}`, usSsa),
      f('Medicare', `${pct(fi.medicareRate * 100)} (+${pct(fi.additionalMedicareRate * 100)} over ${usd(fi.additionalMedicareThreshold)})`, usTc751),
      f('State schedules', 'brackets, standard deduction and exemption/credit for 50 states and DC (secondary source)', usStates),
    ];
  }
  if (slug === 'gst-calculator') return [f('GST slabs', gstIndia.rates.map((r) => `${r}%`).join(', '), gstIndia.sourceUrls[0])];
  return [];
}
