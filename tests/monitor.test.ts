import { describe, it, expect } from 'vitest';
import { htmlToText, sha256, missingExpectations, evaluateSource, needsAttention, buildReport } from '../scripts/lib/monitor.mjs';

const src = { id: 't', title: 'Test page', url: 'https://example.gov/t', kind: 'html' as const, config: 'src/config/tax-x.ts', expect: ['4,00,000', '60,000'] };
const page = (body: string) => ({ ok: true, status: 200, body: `<html><head><script>var a=1</script><style>p{}</style></head><body>${body}</body></html>` });

describe('htmlToText', () => {
  it('strips scripts, styles, tags and comments, decodes entities, collapses whitespace', () => {
    expect(htmlToText('<p>Rebate&nbsp;&amp;  cess</p><!-- hi --><script>x()</script>\n<b>60,000</b>')).toBe('Rebate & cess 60,000');
  });
  it('is stable across markup-only changes', () => {
    expect(sha256(htmlToText('<div><p>Up to 4,00,000</p></div>'))).toBe(sha256(htmlToText('<section>  <span>Up to 4,00,000</span> </section>')));
  });
});

describe('missingExpectations', () => {
  it('reports figures that disappeared (case and whitespace insensitive)', () => {
    expect(missingExpectations('Nil up to 4,00,000 and  Rebate', ['4,00,000', 'rebate', '75,000'])).toEqual(['75,000']);
  });
  it('empty expectations pass', () => expect(missingExpectations('x', [])).toEqual([]));
});

describe('evaluateSource', () => {
  const body = '<p>Nil up to 4,00,000. Rebate 60,000.</p>';
  const hash = sha256(htmlToText(body));
  it('new when there is no baseline', () => expect(evaluateSource(src, page(body), undefined).state).toBe('new'));
  it('ok when content matches the reviewed baseline', () => expect(evaluateSource(src, page(body), hash).state).toBe('ok'));
  it('changed when content differs but expectations hold', () => {
    const r = evaluateSource(src, page(body + ' New note.'), hash);
    expect(r.state).toBe('changed');
    expect(needsAttention(r)).toBe(true);
  });
  it('expectation-failed when a known figure disappears', () => {
    const r = evaluateSource(src, page('<p>Nil up to 4,00,000. Rebate 70,000.</p>'), hash);
    expect(r.state).toBe('expectation-failed');
    expect(r.missing).toEqual(['60,000']);
    expect(needsAttention(r)).toBe(true);
  });
  it('noisy sources do not need attention on a hash change alone', () => {
    const r = evaluateSource({ ...src, noisy: true }, page(body + ' ad'), hash);
    expect(r.state).toBe('changed');
    expect(needsAttention(r)).toBe(false);
  });
  it('unreachable only needs attention after repeated failures and counts consecutive failures', () => {
    const r1 = evaluateSource(src, { ok: false, status: 403 }, hash, {});
    expect(r1.state).toBe('unreachable');
    expect(needsAttention(r1)).toBe(false);
    const r3 = evaluateSource(src, { ok: false, error: 'timeout' }, hash, { consecutiveFailures: 2 });
    expect(r3.consecutiveFailures).toBe(3);
    expect(needsAttention(r3)).toBe(true);
  });
  it('pdf sources hash the raw bytes and skip text expectations', () => {
    const pdf = { ...src, kind: 'pdf' as const, expect: ['anything'] };
    const a = evaluateSource(pdf, { ok: true, status: 200, body: new Uint8Array([1, 2, 3]) }, undefined);
    const b = evaluateSource(pdf, { ok: true, status: 200, body: new Uint8Array([1, 2, 4]) }, a.hash);
    expect(a.state).toBe('new');
    expect(b.state).toBe('changed');
  });
});

describe('buildReport', () => {
  it('says nothing needs review when all is well', () => {
    expect(buildReport([evaluateSource(src, page('<p>4,00,000 60,000</p>'), sha256('4,00,000 60,000'))], '2026-01-01')).toContain('No source needs review');
  });
  it('lists sources that need review and states nothing was applied automatically', () => {
    const r = evaluateSource(src, page('<p>nothing</p>'), 'x');
    const text = buildReport([r], '2026-01-01');
    expect(text).toContain('Nothing was applied automatically');
    expect(text).toContain('src/config/tax-x.ts');
    expect(text).toContain('`4,00,000`');
  });
});
