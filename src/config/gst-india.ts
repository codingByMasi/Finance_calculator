/**
 * GST rate slabs offered in the GST calculator.
 * VERIFIED 2026-11-13 against the PIB release on the 56th GST Council meeting (recommendations effective
 * 22 September 2025): two main slabs, 5% (merit) and 18% (standard), a 40% de-merit rate for a few goods, plus Nil.
 * The old 12% and 28% slabs were removed. Tobacco and pan-masala items keep older rates (with cess) until a
 * transition date set by the Council.
 * TODO(verify): special rates (such as 3% on gold and 0.25% on rough diamonds) were not in the sources read, so they
 * are not offered in the dropdown. Add them here after checking the CBIC rate notifications.
 */
export const gstIndia = {
  lastUpdated: '2026-11-13',
  sourceUrls: [
    'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2163555&reg=48&lang=2',
    'https://www.cbic.gov.in/',
  ],
  verified: true,
  verificationNote: 'Slabs confirmed against the PIB release on the 56th GST Council meeting. Special rates for gold and diamonds are not included.',
  defaultRate: 18,
  rates: [0, 5, 18, 40],
};
