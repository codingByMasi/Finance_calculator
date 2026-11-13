/**
 * Indian small-savings parameters used by the PPF calculator.
 * The PPF rate is reset by the Government every quarter. Keep `lastUpdated` and the changelog in step when it changes.
 */
export const savingsIndia = {
  lastUpdated: '2026-11-13',
  ppf: {
    /** Annual rate in percent, as reported for the October to December 2026 quarter. */
    ratePercent: 7.1,
    rateQuarterLabel: 'October to December 2026',
    minYearlyDeposit: 500,
    maxYearlyDeposit: 150_000,
    lockInYears: 15,
  },
  verified: false,
  verificationNote:
    'The 7.1% PPF rate and the deposit limits are taken from press coverage of the quarterly announcement. The Ministry of Finance notification itself was not opened.',
  // TODO(verify): confirm the PPF rate and the Rs 500 / Rs 1,50,000 deposit limits against the Ministry of Finance / National Savings Institute notice before launch.
  sourceUrls: ['https://www.businesstoday.in/personal-finance/story/small-savings-scheme-interest-rates-unchanged-for-q3-fy27-check-ppf-scss-ssy-rates-558892-2026-09-30'],
};
