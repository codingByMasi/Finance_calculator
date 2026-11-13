/**
 * US tax configuration for the paycheck calculator.
 * No tax figure should live in components; edit this file only.
 *
 * VERIFICATION STATUS (checked 2026-11-13):
 *  - Confirmed on irs.gov (IRS newsroom release for tax year 2026 / Rev. Proc. 2025-32): standard deduction
 *    and the single and married-filing-jointly brackets.
 *  - Confirmed on irs.gov/taxtopics/tc751: Social Security 6.2% up to a 184,500 wage base, Medicare 1.45%,
 *    additional Medicare 0.9% over 200,000 of wages.
 *  - TODO(verify): head-of-household brackets were not on the fetched page; values below are from memory of
 *    Rev. Proc. 2025-32 and must be checked.
 *  - TODO(verify): every non-zero state rate below is an APPROXIMATE effective flat rate for a typical wage
 *    earner, not an official schedule. Progressive states (CA, NY, NJ, ...) need real bracket tables from the
 *    state revenue department before this is treated as accurate. Local/city taxes, state disability and
 *    SDI/FLI payroll taxes are not modelled.
 *  - Federal tax assumes standard deduction, no credits, wages only, and the 'Additional Medicare' surtax on
 *    wages above 200,000 for every filing status (the employer-withholding rule).
 */
export type FilingStatus = 'single' | 'married' | 'head';
export interface Bracket { upTo: number; rate: number }

export const taxUS = {
  taxYear: 2026,
  lastUpdated: '2026-11-13',
  sourceUrls: [
    'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
    'https://www.irs.gov/taxtopics/tc751',
    'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets',
  ],
  verified: false,
  todo: [
    'Verify head-of-household brackets against Rev. Proc. 2025-32.',
    'Replace approximate state effective rates with official state tables (esp. progressive states).',
  ],
  standardDeduction: { single: 16100, married: 32200, head: 24150 } as Record<FilingStatus, number>,
  brackets: {
    single: [
      { upTo: 12400, rate: 0.1 }, { upTo: 50400, rate: 0.12 }, { upTo: 105700, rate: 0.22 },
      { upTo: 201775, rate: 0.24 }, { upTo: 256225, rate: 0.32 }, { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    married: [
      { upTo: 24800, rate: 0.1 }, { upTo: 100800, rate: 0.12 }, { upTo: 211400, rate: 0.22 },
      { upTo: 403550, rate: 0.24 }, { upTo: 512450, rate: 0.32 }, { upTo: 768700, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    // TODO(verify): head-of-household thresholds not confirmed on an official page.
    head: [
      { upTo: 17700, rate: 0.1 }, { upTo: 67450, rate: 0.12 }, { upTo: 105700, rate: 0.22 },
      { upTo: 201750, rate: 0.24 }, { upTo: 256200, rate: 0.32 }, { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  } as Record<FilingStatus, Bracket[]>,
  fica: {
    socialSecurityRate: 0.062,
    socialSecurityWageBase: 184500,
    medicareRate: 0.0145,
    additionalMedicareRate: 0.009,
    additionalMedicareThreshold: 200000,
  },
};

export interface StateTax { code: string; name: string; rate: number; verified: boolean }
const z = (code: string, name: string): StateTax => ({ code, name, rate: 0, verified: true }); // no wage income tax
const a = (code: string, name: string, rate: number): StateTax => ({ code, name, rate: rate / 100, verified: false }); // TODO(verify)

export const stateTaxes: StateTax[] = [
  a('AL', 'Alabama', 5.0), z('AK', 'Alaska'), a('AZ', 'Arizona', 2.5), a('AR', 'Arkansas', 3.9),
  a('CA', 'California', 6.0), a('CO', 'Colorado', 4.4), a('CT', 'Connecticut', 5.0), a('DE', 'Delaware', 5.2),
  a('DC', 'District of Columbia', 6.5), z('FL', 'Florida'), a('GA', 'Georgia', 5.19), a('HI', 'Hawaii', 6.5),
  a('ID', 'Idaho', 5.3), a('IL', 'Illinois', 4.95), a('IN', 'Indiana', 3.0), a('IA', 'Iowa', 3.8),
  a('KS', 'Kansas', 5.0), a('KY', 'Kentucky', 4.0), a('LA', 'Louisiana', 3.0), a('ME', 'Maine', 6.0),
  a('MD', 'Maryland', 4.8), a('MA', 'Massachusetts', 5.0), a('MI', 'Michigan', 4.25), a('MN', 'Minnesota', 6.0),
  a('MS', 'Mississippi', 4.0), a('MO', 'Missouri', 4.5), a('MT', 'Montana', 5.0), a('NE', 'Nebraska', 4.5),
  z('NV', 'Nevada'), z('NH', 'New Hampshire'), a('NJ', 'New Jersey', 4.5), a('NM', 'New Mexico', 4.5),
  a('NY', 'New York', 5.5), a('NC', 'North Carolina', 3.99), a('ND', 'North Dakota', 1.5), a('OH', 'Ohio', 3.0),
  a('OK', 'Oklahoma', 4.0), a('OR', 'Oregon', 7.5), a('PA', 'Pennsylvania', 3.07), a('RI', 'Rhode Island', 4.5),
  a('SC', 'South Carolina', 5.0), z('SD', 'South Dakota'), z('TN', 'Tennessee'), z('TX', 'Texas'),
  a('UT', 'Utah', 4.5), a('VT', 'Vermont', 5.5), a('VA', 'Virginia', 5.0), z('WA', 'Washington'),
  a('WV', 'West Virginia', 4.0), a('WI', 'Wisconsin', 5.0), z('WY', 'Wyoming'),
];
