/**
 * India income tax configuration for the "Salary after tax" calculator.
 * No tax figure should live in components; edit this file only.
 *
 * VERIFICATION STATUS (checked 2026-11-13):
 *  - OFFICIAL (Income Tax Department): the tax-rates page (AY 2026-27) and the threshold-limits page confirm
 *    new-regime slabs, old-regime slabs, 87A rebate (60,000 up to 12L new regime; 12,500 up to 5L old regime),
 *    standard deduction (75,000 new / 50,000 old), 80C limit (1,50,000), surcharge bands (new regime capped
 *    at 25%) and 4% health and education cess.
 *  - CARRY-OVER TO FY 2026-27: Budget 2026-27 coverage (Outlook Money, LiveLaw, Storyboard18, Business Today)
 *    reports no change to slabs, standard deduction or the 12L rebate, and that the Income-tax Act 2025 applies
 *    from 1 April 2026. The Finance Act 2026 text itself could not be retrieved here.
 *    TODO(verify): read the First Schedule of the Finance Act 2026 once to close this out.
 *  - Marginal relief on the 87A rebate (new regime) is applied in code; surcharge marginal relief is NOT modelled.
 */
export interface Slab { upTo: number; rate: number } // upTo: Infinity for the last slab

export const taxIndia = {
  financialYear: '2026-27',
  lastUpdated: '2026-11-13',
  sourceUrls: [
    'https://www.incometaxindia.gov.in/w/tax-rates',
    'https://www.incometaxindia.gov.in/w/threshold-limits-under-income-tax-act',
    'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
  ],
  /** true only when FY 2026-27 figures are confirmed in the Finance Act text itself */
  verified: false,
  verificationNote: 'Rates, rebate, standard deduction, 80C limit and surcharge are confirmed on the Income Tax Department website (AY 2026-27 tables). Budget 2026-27 coverage says they are unchanged for FY 2026-27; the Finance Act 2026 text itself has not been read.',
  todo: ['Confirm FY 2026-27 rates in the First Schedule of the Finance Act 2026.'],
  cess: 0.04,
  newRegime: {
    standardDeduction: 75000,
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
    standardDeduction: 50000,
    deduction80CLimit: 150000,
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
