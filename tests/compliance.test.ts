import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { lintText, copyRules } from '../scripts/lib/copy-rules.mjs';
import { tools as allTools, isCalculator } from '../src/config/tools';
const tools = allTools.filter(isCalculator);
import { getToolDef } from '../src/lib/tools';
import { defaults } from '../src/lib/tools/types';
import { resultHtml, ESTIMATE_NOTE } from '../src/lib/results';
import { toolDataStatus, dataConfigs } from '../src/lib/data-status';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const read = (f: string) => readFileSync(f, 'utf8');
/** visible-ish text of an .astro or .ts file: drop frontmatter-only imports and tags */
const textOf = (f: string) => read(f).replace(/^import .*$/gm, '').replace(/<[^>]+>/g, ' ');

describe('copy lint rules themselves', () => {
  it('flag the phrases they are meant to flag', () => {
    const bad = ['Guaranteed returns', 'This is the most accurate calculator', 'The official calculator of the IRS', 'You should invest in 80C', 'We recommend the new regime', 'This will save you tax', 'Risk-free growth', 'The new regime is better for you', 'Choose the shortest tenure you can afford', 'Endorsed by the Income Tax Department', 'Our official calculator'];
    for (const b of bad) expect(lintText(b).length, b).toBeGreaterThan(0);
  });
  it('allow honest negations', () => {
    for (const ok of ['Results are not guaranteed.', 'There is no guarantee of any return.', 'Estimates only, without any guarantee.', 'It never guarantees a figure.', 'We are not affiliated with or endorsed by any government body.', 'These are not official calculators.', 'We do not promise error-free results.']) expect(lintText(ok), ok).toEqual([]);
  });
  it('has unique ids', () => expect(new Set(copyRules.map((r) => r.id)).size).toBe(copyRules.length));
});

describe('copy lint over the whole site', () => {
  it('tool registry copy (titles, descriptions, about, formula, assumptions, FAQs)', () => {
    const bad: string[] = [];
    for (const t of allTools) {
      const texts = [t.title, t.description, ...t.about, t.formula, ...t.assumptions, ...t.faq.flatMap((f) => [f.q, f.a])];
      for (const x of texts) for (const f of lintText(x)) bad.push(`${t.slug}: [${f.id}] ${f.line}`);
    }
    expect(bad).toEqual([]);
  });
  it('calculator hints, worked steps, notes and result labels (default inputs)', () => {
    const bad: string[] = [];
    for (const t of tools) {
      const def = getToolDef(t.slug);
      const r = def.compute(defaults(def.fields));
      const texts = [...def.fields.map((f) => f.hint ?? ''), ...def.fields.map((f) => f.label), ...r.steps, ...(r.notes ?? []), r.headline.label, ...r.rows.map((x) => x.label)];
      for (const x of texts) for (const f of lintText(x)) bad.push(`${t.slug}: [${f.id}] ${f.line}`);
    }
    expect(bad).toEqual([]);
  });
  it('pages, layouts, components and config copy', () => {
    const files = ['src/pages', 'src/layouts', 'src/components', 'src/config'].flatMap(walk).filter((f) => /\.(astro|ts)$/.test(f) && !/tools-extra|\/tools\.ts$/.test(f));
    const bad: string[] = [];
    for (const f of files) for (const x of lintText(textOf(f))) bad.push(`${f}: [${x.id}] ${x.line}`);
    expect(bad).toEqual([]);
  });
});

describe('every result is labelled as an estimate', () => {
  it.each(tools.map((t) => t.slug))('%s', (slug) => {
    const def = getToolDef(slug);
    const html = resultHtml(def.compute(defaults(def.fields)));
    expect(html).toContain(ESTIMATE_NOTE);
    expect(html).toMatch(/<span>(Estimated|Approx)/);
  });
  it('the calculator markup includes the shared estimate note and the print line', () => {
    const src = read('src/components/CalculatorTool.astro');
    expect(src).toContain('resultHtml');
    expect(src).toContain('estimate only');
  });
});

describe('unconfirmed figures are always labelled on the page', () => {
  const todoFiles = walk('src/config').filter((f) => f.endsWith('.ts') && /TODO\(verify\)/.test(read(f)));
  it('finds the TODO(verify) markers', () => expect(todoFiles.length).toBeGreaterThan(0));
  it.each(todoFiles)('%s is a registered data config with a visible status item', (file) => {
    const entry = dataConfigs.find((c) => file.endsWith(c.file.replace('src/', '')) || c.file === file.replace(/\\/g, '/'));
    expect(entry, `${file} must be listed in dataConfigs (src/lib/data-status.ts)`).toBeDefined();
    for (const slug of entry!.tools) {
      const s = toolDataStatus(slug);
      expect(s, slug).not.toBeNull();
      expect(s!.items.some((i) => i.status === 'unverified' || i.status === 'not-modelled'), `${slug} needs an unverified / not-modelled label`).toBe(true);
    }
  });
  it.each(dataConfigs.filter((c) => !c.verified))('$file is unverified, so its tool shows "not yet confirmed"', (c) => {
    for (const slug of c.tools) expect(toolDataStatus(slug)!.items.some((i) => i.status === 'unverified')).toBe(true);
  });
  it('the calculator page layout renders the status block', () => {
    expect(read('src/layouts/CalculatorLayout.astro')).toContain('<DataStatus slug={tool.slug} />');
  });
  it('tools that use rate tables always say which year they apply to', () => {
    for (const slug of ['income-tax-calculator-india', 'paycheck-calculator', 'gst-calculator', 'ppf-calculator', 'hra-calculator', '401k-calculator']) {
      expect(toolDataStatus(slug)!.year.length, slug).toBeGreaterThan(3);
    }
  });
});
