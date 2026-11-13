/** US workplace retirement plan limits for the 401(k) calculator. Source: IRS news release for 2026 limits. */
export const retirementUS = {
  lastUpdated: '2026-11-13',
  planYear: 2026,
  /** Employee elective deferral limit. */
  deferralLimit: 24_500,
  /** Catch-up for age 50 and over. */
  catchUp50: 8_000,
  /** Special catch-up for ages 60 to 63 (replaces the 50+ amount). */
  catchUp6063: 11_250,
  iraLimit: 7_500,
  verified: true,
  verificationNote: 'Limits confirmed against the IRS news release for 2026 plan limits. Employer-plan rules (such as higher-income Roth catch-up requirements) are not modelled.',
  sourceUrls: ['https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500'],
};
