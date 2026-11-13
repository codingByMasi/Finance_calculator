import { taxIndia } from '../config/tax-india';
import { taxUS } from '../config/tax-us';
import { gstIndia } from '../config/gst-india';
import { savingsIndia } from '../config/savings-india';
import { hraIndia } from '../config/hra-india';
import { retirementUS } from '../config/retirement-us';
import { deadlines } from '../config/deadlines';
import fx from '../data/fx-rates.json';
import sourcesJson from '../config/data-sources.json';
import statusJson from '../data/source-status.json';

/** All dates shown on the site about data freshness come from here (config lastUpdated fields + the monitor's status file). */
const latest = (dates: string[]): string => [...dates].sort().at(-1)!;

export const dataUpdated = {
  india: taxIndia.lastUpdated,
  us: taxUS.lastUpdated,
  gst: gstIndia.lastUpdated,
  savings: savingsIndia.lastUpdated,
  hra: hraIndia.lastUpdated,
  retirement: retirementUS.lastUpdated,
  /** most recent change to any tax/rate data */
  any: latest([taxIndia.lastUpdated, taxUS.lastUpdated, gstIndia.lastUpdated, savingsIndia.lastUpdated, hraIndia.lastUpdated, retirementUS.lastUpdated]),
};

/** Date the monitor last ran (null before the first run). Written by scripts/check-sources.mjs. */
export const sourcesLastChecked: string | null = statusJson.lastChecked;

export type SourceStatus = { id: string; title: string; url: string; config: string; state: string; lastChecked: string | null };
export const sourceStatuses: SourceStatus[] = sourcesJson.sources.map((s) => {
  const st = (statusJson.sources as Record<string, { state: string; lastChecked: string }>)[s.id];
  return { id: s.id, title: s.title, url: s.url, config: s.config, state: st?.state ?? 'not yet checked', lastChecked: st?.lastChecked ?? null };
});

/** Per-tool: which data set (if any) the calculator depends on. */
export function dataForTool(slug: string): { updated: string; label: string } {
  if (slug === 'income-tax-calculator-india') return { updated: dataUpdated.india, label: `India tax data, FY ${taxIndia.financialYear}` };
  if (slug === 'paycheck-calculator') return { updated: dataUpdated.us, label: `US tax data, tax year ${taxUS.taxYear}` };
  if (slug === 'gst-calculator') return { updated: dataUpdated.gst, label: 'GST rate list' };
  if (slug === 'currency-converter') return { updated: fx.date, label: 'exchange-rate snapshot' };
  if (slug === 'tax-deadline-calendar') return { updated: deadlines.lastUpdated, label: 'deadline dates' };
  if (slug === 'ppf-calculator') return { updated: dataUpdated.savings, label: 'PPF rate and deposit limits' };
  if (slug === 'hra-calculator') return { updated: dataUpdated.hra, label: 'HRA exemption rules' };
  if (slug === '401k-calculator') return { updated: dataUpdated.retirement, label: `${retirementUS.planYear} 401(k) limits` };
  return { updated: dataUpdated.any, label: 'site data' };
}

export function fmtDate(d: string | null): string {
  if (!d) return 'not yet checked';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export interface DataStatusItem { label: string; status: 'confirmed' | 'unverified' | 'not-modelled' | 'indicative'; note: string }
export const fxSnapshot = { date: fx.date, source: fx.source };
export interface ToolDataStatus { year: string; items: DataStatusItem[] }

/**
 * Which year a calculator's figures belong to, and which of them are confirmed from a primary source.
 * Tools that use no rate tables (loan, interest and discount maths) return null. Every config marked `verified: false`
 * must appear here as an "unverified" item, which the page shows next to the calculator (tests enforce this).
 */
export function toolDataStatus(slug: string): ToolDataStatus | null {
  switch (slug) {
    case 'income-tax-calculator-india':
      return { year: `FY ${taxIndia.financialYear} (assessment year ${taxIndia.assessmentYear})`, items: [
        { label: `FY ${taxIndia.financialYear} slabs, rebate, standard deduction, surcharge, cess`, status: 'confirmed', note: 'Matched to Income Tax Department tables.' },
        { label: `FY ${taxIndia.laterYear.financialYear}`, status: 'unverified', note: taxIndia.laterYear.note },
      ] };
    case 'paycheck-calculator':
      return { year: `Tax year ${taxUS.taxYear}`, items: [
        { label: 'Federal brackets, standard deduction, Social Security and Medicare', status: 'confirmed', note: 'Matched to IRS and Social Security Administration publications.' },
        { label: 'State income tax schedules', status: 'unverified', note: taxUS.verificationNote.split('. ').slice(1).join('. ') || 'State schedules come from a secondary source and have not been checked against each state revenue department.' },
      ] };
    case 'gst-calculator':
      return { year: 'GST rates in force since 22 September 2025', items: [
        { label: 'Standard slabs: 0%, 5%, 18%, 40%', status: 'confirmed', note: 'Matched to the Press Information Bureau release on the 56th GST Council meeting.' },
        { label: 'Special rates (for example gold and rough diamonds)', status: 'not-modelled', note: 'Not included. Check the notified rate for your goods.' },
      ] };
    case 'ppf-calculator':
      return { year: `Rate as reported for ${savingsIndia.ppf.rateQuarterLabel}`, items: [
        { label: 'PPF interest rate and deposit limits', status: savingsIndia.verified ? 'confirmed' : 'unverified', note: savingsIndia.verificationNote },
      ] };
    case 'hra-calculator':
      return { year: 'Old tax regime rules', items: [
        { label: 'Exemption limits and metro-city list', status: hraIndia.verified ? 'confirmed' : 'unverified', note: hraIndia.verificationNote },
      ] };
    case '401k-calculator':
      return { year: `${retirementUS.planYear} plan year`, items: [
        { label: 'Contribution and catch-up limits', status: retirementUS.verified ? 'confirmed' : 'unverified', note: retirementUS.verificationNote },
      ] };
    case 'currency-converter':
      return { year: `Rates dated ${fmtDate(fx.date)}`, items: [
        { label: 'Exchange rates', status: 'indicative', note: `${fx.source}, copied by an automated job. Reference rates only; banks and card networks use their own rates and fees.` },
      ] };
    case 'tax-deadline-calendar':
      return { year: 'Dates for 2026 returns and payments', items: [
        { label: 'US dates listed', status: 'confirmed', note: 'Read on irs.gov pages linked in each row.' },
        { label: 'India dates and the US 2026-return deadline', status: 'not-modelled', note: 'Not included because they were not confirmed on an official page.' },
      ] };
    default: return null;
  }
}

/** Configs that carry unconfirmed figures; the test suite checks each has a visible label via toolDataStatus. */
export const dataConfigs = [
  { file: 'src/config/tax-india.ts', verified: taxIndia.verified, tools: ['income-tax-calculator-india'] },
  { file: 'src/config/tax-us.ts', verified: taxUS.verified, tools: ['paycheck-calculator'] },
  { file: 'src/config/gst-india.ts', verified: gstIndia.verified, tools: ['gst-calculator'] },
  { file: 'src/config/savings-india.ts', verified: savingsIndia.verified, tools: ['ppf-calculator'] },
  { file: 'src/config/hra-india.ts', verified: hraIndia.verified, tools: ['hra-calculator'] },
  { file: 'src/config/retirement-us.ts', verified: retirementUS.verified, tools: ['401k-calculator'] },
  { file: 'src/config/deadlines.ts', verified: deadlines.verified, tools: ['tax-deadline-calendar'] },
];
