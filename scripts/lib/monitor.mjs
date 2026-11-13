// Pure helpers for the source monitor (unit-tested in tests/monitor.test.ts). No network access in here.
import { createHash } from 'node:crypto';

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&rsquo;': "'", '&ldquo;': '"', '&rdquo;': '"', '&#8377;': '₹' };

/** Reduce an HTML page to its visible text, normalised so cosmetic markup changes do not change the hash. */
export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#a-z0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

/** Strings from `expect` that no longer appear in the text (case-insensitive, whitespace-normalised). */
export function missingExpectations(text, expect = []) {
  const hay = text.toLowerCase().replace(/\s+/g, ' ');
  return expect.filter((e) => !hay.includes(String(e).toLowerCase().replace(/\s+/g, ' ')));
}

/**
 * Compare one fetch result with the reviewed baseline.
 * fetched: { ok, status, body (string|Buffer), error }
 * Returns { id, state, ... } where state is one of:
 *  ok | changed | expectation-failed | unreachable | new (no baseline yet)
 */
export function evaluateSource(source, fetched, baselineHash, previous = {}) {
  const base = { id: source.id, title: source.title, url: source.url, config: source.config, noisy: !!source.noisy };
  if (!fetched.ok) {
    return { ...base, state: 'unreachable', httpStatus: fetched.status ?? null, error: fetched.error ?? `HTTP ${fetched.status}`, consecutiveFailures: (previous.consecutiveFailures ?? 0) + 1 };
  }
  const text = source.kind === 'pdf' ? null : htmlToText(fetched.body);
  const hash = source.kind === 'pdf' ? sha256(fetched.body) : sha256(text);
  const missing = text === null ? [] : missingExpectations(text, source.expect);
  let state = 'ok';
  if (missing.length) state = 'expectation-failed';
  else if (!baselineHash) state = 'new';
  else if (hash !== baselineHash) state = 'changed';
  return { ...base, state, hash, missing, httpStatus: fetched.status, consecutiveFailures: 0 };
}

/** Which results need a human? Noisy sources never do on a hash change alone. Unreachable only after repeated failures. */
export function needsAttention(result, { unreachableAfter = 3 } = {}) {
  if (result.state === 'expectation-failed') return true;
  if (result.state === 'changed') return !result.noisy;
  if (result.state === 'unreachable') return result.consecutiveFailures >= unreachableAfter;
  return false;
}

export function buildReport(results, now) {
  const attention = results.filter((r) => needsAttention(r));
  const lines = [];
  lines.push(`Source check run on ${now}.`, '');
  if (!attention.length) lines.push('No source needs review.', '');
  else {
    lines.push('These official sources need a human review. Nothing was applied automatically.', '');
    for (const r of attention) {
      lines.push(`### ${r.title}`, `- URL: ${r.url}`, `- Config to update: \`${r.config}\``);
      if (r.state === 'expectation-failed') lines.push(`- Expected text no longer found: ${r.missing.map((m) => `\`${m}\``).join(', ')}`);
      if (r.state === 'changed') lines.push('- Page content changed since the last accepted review.');
      if (r.state === 'unreachable') lines.push(`- Unreachable for ${r.consecutiveFailures} consecutive runs (${r.error}). The site may block automated requests; check it by hand.`);
      lines.push('');
    }
    lines.push('After checking the figures: edit the config file, bump its `lastUpdated`, run `npm run sources:accept`, run the tests and open a PR.', '');
  }
  const other = results.filter((r) => !attention.includes(r));
  if (other.length) {
    lines.push('Other sources:');
    for (const r of other) lines.push(`- ${r.title}: ${r.state}${r.noisy && r.state === 'changed' ? ' (informational, noisy page)' : ''}${r.state === 'unreachable' ? ` (${r.error})` : ''}`);
  }
  return lines.join('\n');
}
