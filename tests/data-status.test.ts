import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { dataUpdated, dataForTool, fmtDate, sourceStatuses } from '../src/lib/data-status';
import { taxIndia } from '../src/config/tax-india';
import { taxUS } from '../src/config/tax-us';
import { gstIndia } from '../src/config/gst-india';
import registry from '../src/config/data-sources.json';
import { tools } from '../src/config/tools';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe('data dates come from the configs', () => {
  it('every config has an ISO lastUpdated', () => {
    for (const d of [taxIndia.lastUpdated, taxUS.lastUpdated, gstIndia.lastUpdated]) expect(d).toMatch(ISO);
  });
  it('overall date is the latest of the configs', () => {
    expect(dataUpdated.any).toBe([taxIndia.lastUpdated, taxUS.lastUpdated, gstIndia.lastUpdated].sort().at(-1));
  });
  it('tax tools map to their own config date; others use the overall date', () => {
    expect(dataForTool('income-tax-calculator-india').updated).toBe(taxIndia.lastUpdated);
    expect(dataForTool('paycheck-calculator').updated).toBe(taxUS.lastUpdated);
    expect(dataForTool('gst-calculator').updated).toBe(gstIndia.lastUpdated);
    expect(dataForTool('emi-calculator').updated).toBe(dataUpdated.any);
  });
  it('every tool resolves a date', () => {
    for (const t of tools) expect(dataForTool(t.slug).updated).toMatch(ISO);
  });
  it('formats dates and handles "never checked"', () => {
    expect(fmtDate('2026-11-13')).toBe('November 13, 2026');
    expect(fmtDate(null)).toBe('not yet checked');
  });
});

describe('source registry', () => {
  it('has unique ids and https URLs, and a config file that exists', () => {
    const ids = registry.sources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of registry.sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(['html', 'pdf']).toContain(s.kind);
      expect(() => readFileSync(s.config, 'utf8')).not.toThrow();
    }
  });
  it('monitors every official sourceUrl listed in the tax configs (secondary news sites excluded)', () => {
    const monitored = new Set(registry.sources.map((s) => s.url));
    const official = [...taxIndia.sourceUrls, ...taxUS.sourceUrls, ...gstIndia.sourceUrls].filter((u) => !/cbic\.gov\.in\/$/.test(u) && !/incometax\.gov\.in\/?$/.test(u));
    for (const u of official) expect(monitored.has(u), u).toBe(true);
  });
  it('status file lists a state for every source', () => {
    expect(sourceStatuses).toHaveLength(registry.sources.length);
  });
});

describe('no hardcoded dates in components, layouts or pages', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  it('contains no ISO date literals', () => {
    for (const f of ['src/components', 'src/layouts', 'src/pages'].flatMap(walk)) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/);
    }
  });
});
