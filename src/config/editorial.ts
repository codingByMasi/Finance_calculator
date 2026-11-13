import { SITE_NAME, SITE_URL, CONTACT_EMAIL } from './site';

/**
 * Who publishes, writes and reviews the site. Nothing here is invented.
 * TODO(owner): to show a named author or reviewer (this helps trust and search quality), replace `null` with
 *   { name: 'Full Name', jobTitle: 'Role', credentials: 'Real, checkable credentials', url: 'https://link-to-profile' }
 * Only add credentials that are true and that a reader could verify. Until then the site shows a clearly marked
 * placeholder on the About page and publishes NO author or reviewer in its structured data.
 */
export interface Person { name: string; jobTitle?: string; credentials?: string; url?: string }
export const editorial: { publisher: { name: string; url: string; email: string }; author: Person | null; reviewer: Person | null } = {
  publisher: { name: SITE_NAME, url: SITE_URL, email: CONTACT_EMAIL },
  author: null,
  reviewer: null,
};

export const personJsonLd = (p: Person) => ({
  '@type': 'Person', name: p.name, ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}), ...(p.url ? { url: p.url } : {}),
  ...(p.credentials ? { description: p.credentials } : {}),
});
export const organizationJsonLd = () => ({
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: editorial.publisher.name, url: `${SITE_URL}/`,
  ...(editorial.author ? { founder: personJsonLd(editorial.author) } : {}),
});
