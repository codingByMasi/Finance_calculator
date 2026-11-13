/**
 * India income tax configuration for the "Salary after tax" calculator.
 * No tax figure should live in components; edit this file only.
 *
 * VERIFICATION STATUS (checked 2026-11-13):
 *  - Confirmed on the Income Tax Department page (see sourceUrls[0]) for AY 2026-27 (FY 2025-26):
 *    new-regime slabs, old-regime slabs, 87A rebate (60,000 up to 12L new; 12,500 up to 5L old), 4% cess.
 *  - TODO(verify): that the same slabs/rebate apply unchanged to FY 2026-27 (AY 2027-28). Confirm against
 *    the Finance Act 2026 / Income Tax Act 2025 notifications before relying on this for the current year.
 *  - TODO(verify): standard deduction (75,000 new / 50,000 old) was NOT shown on the official page fetched;
 *    values come from secondary sources and Budget 2024/2025 reporting.
 *  - TODO(verify): surcharge thresholds and rates, and the 80C cap, taken from secondary sources.
 *  - Marginal relief on the 87A rebate (new regime) is applied in code; surcharge marginal relief is NOT modelled.
 */
export interface Slab { upTo: number; rate: number } // upTo: Infinity for the last slab

export const taxIndia = {
  financialYear: '2026-27',
  lastUpdated: '2026-11-13',
  sourceUrls: [
    'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
    'https://www.incometax.gov.in/',
  ],
  verified: false, // flip to true once every TODO above is confirmed
  todo: [
    'Confirm FY 2026-27 slabs and 87A rebate against the latest Finance Act / Income Tax Act 2025 notification.',
    'Confirm standard deduction values (75,000 new regime, 50,000 old regime).',
    'Confirm surcharge bands and 80C limit.',
  ],
  cess: 0.04,
  newRegime: {
    standardDeduction: 75000, // TODO(verify)
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.3 },
    ] as Slab[],
    rebate: { maxTaxableIncome: 1200000, maxRebate: 60000, marginalRelief: true },
    // Surcharge on tax by taxable-income band (rate capped at 25% in the new regime). TODO(verify)
    surcharge: [
      { above: 5000000, rate: 0.1 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 },
    ],
  },
  oldRegime: {
    standardDeduction: 50000, // TODO(verify)
    deduction80CLimit: 150000, // TODO(verify)
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ] as Slab[],
    rebate: { maxTaxableIncome: 500000, maxRebate: 12500, marginalRelief: false },
    surcharge: [
      { above: 5000000, rate: 0.1 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 },
      { above: 50000000, rate: 0.37 },
    ],
  },
};
export type TaxIndiaConfig = typeof taxIndia;
