import { taxIndia } from '../config/tax-india';
import { taxUS } from '../config/tax-us';
import { gstIndia } from '../config/gst-india';
import sourcesJson from '../config/data-sources.json';
import statusJson from '../data/source-status.json';

/** All dates shown on the site about data freshness come from here (config lastUpdated fields + the monitor's status file). */
const latest = (dates: string[]): string => [...dates].sort().at(-1)!;

export const dataUpdated = {
  india: taxIndia.lastUpdated,
  us: taxUS.lastUpdated,
  gst: gstIndia.lastUpdated,
  /** most recent change to any tax/rate data */
  any: latest([taxIndia.lastUpdated, taxUS.lastUpdated, gstIndia.lastUpdated]),
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
  return { updated: dataUpdated.any, label: 'site data' };
}

export function fmtDate(d: string | null): string {
  if (!d) return 'not yet checked';
  return new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
