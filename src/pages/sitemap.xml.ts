import type { APIRoute } from 'astro';
import { SITE_URL, CATEGORIES, LEGAL_LAST_UPDATED } from '../config/site';
import { tools } from '../config/tools';
import { dataForTool, dataUpdated } from '../lib/data-status';

const staticPaths = ['/', '/in/', '/us/', '/about/', '/methodology/', '/changelog/', '/corrections/', '/contact/', '/privacy-policy/', '/terms/', '/disclaimer/'];

export const GET: APIRoute = () => {
  const entries: [string, string][] = [
    ...staticPaths.map((u): [string, string] => [u, u === '/' || u === '/in/' || u === '/us/' || u === '/methodology/' || u === '/changelog/' ? dataUpdated.any : LEGAL_LAST_UPDATED]),
    ...CATEGORIES.map((c): [string, string] => [`/${c.slug}/`, dataUpdated.any]),
    ...tools.map((t): [string, string] => [`/${t.slug}/`, dataForTool(t.slug).updated]),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(([u, d]) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${d}</lastmod></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
