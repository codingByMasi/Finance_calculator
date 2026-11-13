/** Central site configuration. Change SITE_NAME here and it updates everywhere. */
export const SITE_NAME = 'FinCalculator';
export const SITE_TAGLINE = 'Free finance calculators for India and the US';
export const SITE_URL: string = (import.meta.env.PUBLIC_SITE_URL || 'https://example.com').replace(/\/$/, '');
// TODO: replace with your real contact email before launch (also used on /contact and /privacy-policy).
export const CONTACT_EMAIL = 'contact@your-domain.example';
/**
 * Operator details used on the legal pages. Values in square brackets are placeholders: replace every one before launch.
 * Set LEGAL_TEMPLATE_NOTICE to false once a qualified lawyer has reviewed the legal pages; until then each legal page
 * carries a visible "template, not yet reviewed" notice.
 */
export const LEGAL_TEMPLATE_NOTICE = true;
export const OPERATOR = {
  name: '[Operator name or company name]',
  address: '[Postal address]',
  country: '[Country where the operator is based]',
  governingLaw: '[Governing law, for example the laws of India or of a US state]',
  courts: '[Courts that will hear disputes, for example the courts at a named city]',
  grievanceOfficer: '[Grievance Officer name]',
  dmcaAgent: '[Designated copyright agent name and postal address]',
};
export const isPlaceholder = (v: string): boolean => v.trim().startsWith('[');
/** Date the legal/info pages were last edited (not tax data; see src/lib/data-status.ts for data dates). */
export const LEGAL_LAST_UPDATED = '2026-11-13';

export const ADSENSE_CLIENT: string = import.meta.env.PUBLIC_ADSENSE_CLIENT || '';
export const GA_ID: string = import.meta.env.PUBLIC_GA_ID || '';

export const CATEGORIES = [
  { slug: 'loans', title: 'Loan calculators', description: 'EMI, mortgage and loan comparison calculators with full payment breakdowns.' },
  { slug: 'investing', title: 'Investing calculators', description: 'SIP, lumpsum, compound interest and savings goal calculators to plan long-term growth.' },
  { slug: 'tax-salary', title: 'Tax and salary calculators', description: 'Income tax, take-home pay, hourly wage and paycheck calculators for India and the US.' },
  { slug: 'shopping', title: 'Shopping calculators', description: 'GST, sales tax and discount calculators for everyday purchases.' },
] as const;
export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
