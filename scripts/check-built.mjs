#!/usr/bin/env node
/**
 * Checks the built site in dist/ (run after `npm run build`):
 *  - every calculator page carries the estimate note and an "Estimated" headline label
 *  - every page contains the privacy choices link, and the legal pages exist
 *  - no page text trips the copy rules (guarantees, advice, endorsement claims)
 *  - meta descriptions fit in 160 characters
 * Also reports (does not fail on) how many [bracketed] owner placeholders are still on legal pages.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lintText } from './lib/copy-rules.mjs';

const DIST = process.argv[2] || 'dist';
if (!existsSync(DIST)) { console.error(`No ${DIST}/ folder. Run "npm run build" first.`); process.exit(2); }
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const textOf = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');

const problems = [];
let calculators = 0, placeholders = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const page = f.slice(DIST.length).replace(/index\.html$/, '') || '/';
  const text = textOf(html);
  if (/data-calculator\b/.test(html)) {
    calculators++;
    if (!text.includes('Estimate only. Actual amounts may differ.')) problems.push(`${page}: missing the estimate note`);
    if (!/class="result-top"><span>(Estimated|Approx)/.test(html)) problems.push(`${page}: headline result is not labelled as an estimate`);
    if (!/class="advice-banner"/.test(html)) problems.push(`${page}: missing the not-advice banner`);
  }
  if (!/Do Not Sell or Share My Personal Information/.test(text)) problems.push(`${page}: missing the "Do Not Sell or Share" link`);
  if (!/id="consent"/.test(html)) problems.push(`${page}: missing the cookie choices panel`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (desc && desc[1].replace(/&amp;/g, '&').length > 160) problems.push(`${page}: meta description is ${desc[1].length} characters (max 160)`);
  for (const x of lintText(text)) problems.push(`${page}: [${x.id}] ${x.line}`);
  if (/\/(privacy-policy|cookie-policy|terms|disclaimer|copyright|contact|accessibility|advertising-disclosure)\/$/.test(page)) placeholders += (text.match(/\[[A-Z][^\]]{3,}\]/g) || []).length;
}
for (const need of ['privacy-policy', 'cookie-policy', 'terms', 'disclaimer', 'advertising-disclosure', 'copyright', 'accessibility', 'contact', 'about', 'methodology']) {
  if (!existsSync(join(DIST, need, 'index.html'))) problems.push(`missing page /${need}/`);
}
console.log(`Checked ${htmlFiles.length} pages (${calculators} calculators). Owner placeholders still on legal pages: ${placeholders}.`);
if (problems.length) { console.error('\nProblems:\n' + problems.map((p) => ' - ' + p).join('\n')); process.exit(1); }
console.log('Built-site checks passed.');
