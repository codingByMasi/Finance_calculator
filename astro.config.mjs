import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Set PUBLIC_SITE_URL at build time (e.g. https://yourdomain.com). Used for canonical URLs and the sitemap.
const site = process.env.PUBLIC_SITE_URL || 'https://example.com';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
