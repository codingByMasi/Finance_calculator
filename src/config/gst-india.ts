/**
 * GST rate slabs offered in the GST calculator.
 * TODO(verify): GST slabs were restructured by the GST Council in 2025 (effective 22 Sep 2025 reporting);
 * confirm the current standard slabs (commonly 5% and 18%, plus 40% for specified goods) and the special
 * rates (0.25%, 3%) on https://www.gst.gov.in / https://www.cbic.gov.in before launch, then edit this list.
 */
export const gstIndia = {
  lastUpdated: '2026-11-13',
  sourceUrls: ['https://www.cbic.gov.in/', 'https://www.gst.gov.in/'],
  verified: false,
  defaultRate: 18,
  rates: [0, 3, 5, 12, 18, 28, 40], // TODO(verify): remove slabs that no longer exist
};
