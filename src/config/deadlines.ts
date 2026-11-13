/**
 * Tax and filing dates shown on the deadline calendar. Only dates that were read on an official page are listed in
 * `events`. Anything not confirmed is in `pending` and is shown as "not included", never as a date.
 *
 * TODO(verify): the India dates below could not be read on an official page from the build environment (the Income Tax
 * Department pages were unreachable or do not state them). Add them to `events` once confirmed on incometax.gov.in or
 * incometaxindia.gov.in (e-Filing calendar), with the exact page URL.
 */
export interface DeadlineEvent {
  id: string; country: 'in' | 'us'; date: string; title: string; who: string; note: string;
  source: { label: string; url: string };
}
export interface PendingDeadline { country: 'in' | 'us'; title: string; reason: string }

export const deadlines = {
  lastUpdated: '2026-11-13',
  /** true: every date that is shown was read on an official page. Unconfirmed dates are not shown at all (see `pending`). */
  verified: true,
  verificationNote: 'US dates were read on irs.gov (Form 1040-ES for 2026 and the "When to file" page). India dates and the US return deadline for tax year 2026 are not included because they were not confirmed on an official page.',
  events: [
    { id: 'us-est-2026-1', country: 'us', date: '2026-04-15', title: 'US estimated tax: 1st payment for 2026', who: 'Individuals who pay estimated tax', note: 'Payment due date listed on IRS Form 1040-ES for 2026.', source: { label: 'IRS Form 1040-ES (2026)', url: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf' } },
    { id: 'us-est-2026-2', country: 'us', date: '2026-06-15', title: 'US estimated tax: 2nd payment for 2026', who: 'Individuals who pay estimated tax', note: 'Payment due date listed on IRS Form 1040-ES for 2026.', source: { label: 'IRS Form 1040-ES (2026)', url: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf' } },
    { id: 'us-est-2026-3', country: 'us', date: '2026-09-15', title: 'US estimated tax: 3rd payment for 2026', who: 'Individuals who pay estimated tax', note: 'Payment due date listed on IRS Form 1040-ES for 2026.', source: { label: 'IRS Form 1040-ES (2026)', url: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf' } },
    { id: 'us-est-2026-4', country: 'us', date: '2027-01-15', title: 'US estimated tax: 4th payment for 2026', who: 'Individuals who pay estimated tax', note: 'Listed with a footnote on Form 1040-ES; read the form for the exception that applies.', source: { label: 'IRS Form 1040-ES (2026)', url: 'https://www.irs.gov/pub/irs-pdf/f1040es.pdf' } },
    { id: 'us-return-2025', country: 'us', date: '2026-04-15', title: 'US federal individual return for tax year 2025', who: 'Calendar-year filers', note: 'The IRS page says "File on: April 15, 2026". It also describes a 6-month extension to file (Form 4868), which does not extend the time to pay.', source: { label: 'IRS: When to file', url: 'https://www.irs.gov/filing/individuals/when-to-file' } },
  ] as DeadlineEvent[],
  pending: [
    { country: 'in', title: 'Income tax return due date for individuals (ITR)', reason: 'Not confirmed on an official page yet.' },
    { country: 'in', title: 'Advance tax instalment dates', reason: 'Not confirmed on an official page yet.' },
    { country: 'in', title: 'GST return due dates', reason: 'Not confirmed on an official page yet.' },
    { country: 'us', title: 'Federal individual return for tax year 2026 (filed in 2027)', reason: 'The IRS page read did not state the 2027 date.' },
  ] as PendingDeadline[],
};

/** Official hosts the calendar may cite. */
export const officialHosts = ['irs.gov', 'incometax.gov.in', 'incometaxindia.gov.in', 'cbic.gov.in', 'gst.gov.in'];
