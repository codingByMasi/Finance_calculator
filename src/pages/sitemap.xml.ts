import type { APIRoute } from 'astro';
import { SITE_URL, CATEGORIES, CONTENT_LAST_UPDATED } from '../config/site';
import { tools } from '../config/tools';

const staticPaths = ['/', '/in/', '/us/', '/about/', '/contact/', '/privacy-policy/', '/terms/', '/disclaimer/'];

export const GET: APIRoute = () => {
  const urls = [...staticPaths, ...CATEGORIES.map((c) => `/${c.slug}/`), ...tools.map((t) => `/${t.slug}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${CONTENT_LAST_UPDATED}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
