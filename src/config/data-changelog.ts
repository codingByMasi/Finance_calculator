/**
 * Data changelog: one entry for every change to the tax/rate configs. The test suite checks that each config's
 * `lastUpdated` date has a matching entry here, so the two cannot drift apart. Newest first.
 */
export type DataArea = 'india-tax' | 'us-tax' | 'gst' | 'savings-india' | 'hra-india' | 'retirement-us';
export interface ChangelogEntry { date: string; area: DataArea; summary: string; sources: string[] }

export const dataChangelog: ChangelogEntry[] = [
  {
    date: '2026-11-13', area: 'retirement-us',
    summary: 'Added the 2026 401(k) limits ($24,500; catch-up $8,000 from age 50 and $11,250 at ages 60 to 63) from the IRS news release.',
    sources: ['https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500'],
  },
  {
    date: '2026-11-13', area: 'savings-india',
    summary: 'Added the PPF rate (7.1%, reported for October to December 2026) and deposit limits. Taken from press coverage; not yet confirmed against the Ministry of Finance notice.',
    sources: ['https://www.businesstoday.in/personal-finance/story/small-savings-scheme-interest-rates-unchanged-for-q3-fy27-check-ppf-scss-ssy-rates-558892-2026-09-30'],
  },
  {
    date: '2026-11-13', area: 'hra-india',
    summary: 'Added HRA exemption limits and the eight-city metro list reported for 1 April 2026. Taken from press coverage; the rule text has not been read.',
    sources: ['https://www.moneylife.in/article/new-income-tax-rules-from-1st-april-hra-exemption-extended-to-8-cities-fewer-forms-but-landlord-disclosure-now-mandatory/79998.html'],
  },
  {
    date: '2026-11-13', area: 'india-tax',
    summary: 'The income tax calculator now states the year it is confirmed for: FY 2025-26 (assessment year 2026-27). FY 2026-27 is shown as not yet confirmed.',
    sources: ['https://www.incometaxindia.gov.in/w/tax-rates'],
  },
  {
    date: '2026-11-13', area: 'india-tax',
    summary: 'Checked new and old regime slabs, 87A rebate, standard deduction, 80C limit, surcharge bands and cess against the Income Tax Department tables (AY 2026-27). FY 2026-27 carry-over rests on Budget 2026-27 coverage; the Finance Act 2026 text has not been read yet.',
    sources: ['https://www.incometaxindia.gov.in/w/tax-rates', 'https://www.incometaxindia.gov.in/w/threshold-limits-under-income-tax-act'],
  },
  {
    date: '2026-11-13', area: 'us-tax',
    summary: 'Confirmed 2026 federal brackets (single, married, head of household) and standard deductions from IRS Rev. Proc. 2025-32, and FICA figures from IRS and SSA. Replaced approximate state rates with 2026 state bracket schedules for 50 states and DC (secondary source).',
    sources: ['https://www.irs.gov/pub/irs-drop/rp-25-32.pdf', 'https://www.ssa.gov/cola/factsheets/2026.html', 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/'],
  },
  {
    date: '2026-11-13', area: 'gst',
    summary: 'GST dropdown changed to the post-22 September 2025 structure: Nil, 5%, 18% and 40%. The old 12% and 28% slabs were removed.',
    sources: ['https://www.pib.gov.in/PressReleasePage.aspx?PRID=2163555&reg=48&lang=2'],
  },
];

export const areaLabels: Record<DataArea, string> = { 'india-tax': 'India income tax', 'us-tax': 'US federal and state tax', gst: 'India GST rates', 'savings-india': 'India PPF rate and limits', 'hra-india': 'India HRA rules', 'retirement-us': 'US 401(k) limits' };

/** Published corrections to calculator results or content. Add an entry here when an error is fixed. Newest first. */
export interface Correction { date: string; page: string; what: string; fixed: string }
export const corrections: Correction[] = [];
