import { deadlines } from '../src/config/deadlines';
import { savingsIndia } from '../src/config/savings-india';
import { hraIndia } from '../src/config/hra-india';
import { retirementUS } from '../src/config/retirement-us';
import { describe, it, expect } from 'vitest';
import { accuracyCases, runAccuracyCase } from '../src/lib/accuracy';
import { emi } from '../src/lib/calc/loan';
import { sip, savingsGoal, compoundInterest } from '../src/lib/calc/invest';
import { dataChangelog } from '../src/config/data-changelog';
import { taxIndia } from '../src/config/tax-india';
import { taxUS } from '../src/config/tax-us';
import { gstIndia } from '../src/config/gst-india';
import { editorial, personJsonLd, organizationJsonLd } from '../src/config/editorial';
import { toolReferences, figureSources } from '../src/config/references';
import { tools } from '../src/config/tools';
import registry from '../src/config/data-sources.json';

describe('results match published official figures', () => {
  for (const c of accuracyCases) {
    it(`${c.title} (${c.source.kind}: ${c.source.label})`, () => {
      const { ours } = runAccuracyCase(c);
      expect(ours).toBeCloseTo(c.published, Math.max(0, Math.round(-Math.log10(c.tolerance * 2))));
      expect(runAccuracyCase(c).pass).toBe(true);
    });
  }
  it('every case cites an https source and covers a real tool', () => {
    for (const c of accuracyCases) {
      expect(c.source.url).toMatch(/^https:\/\//);
      expect(tools.some((t) => t.slug === c.tool)).toBe(true);
    }
  });
  it('official CFPB/SSA cases are monitored so a changed source is noticed', () => {
    const monitored = new Set(registry.sources.map((s) => s.url));
    for (const c of accuracyCases.filter((x) => x.source.kind === 'official')) expect(monitored.has(c.source.url), c.source.url).toBe(true);
  });
});

describe('independent recomputation (month-by-month simulation, not the closed-form formulas)', () => {
  it('EMI amortises a loan to zero', () => {
    for (const [P, rate, n] of [[1_000_000, 9, 240], [250_000, 6.5, 60], [75_000, 18, 24]]) {
      const { emi: pay } = emi(P, rate, n);
      let bal = P;
      for (let m = 0; m < n; m++) bal = bal * (1 + rate / 1200) - pay;
      expect(Math.abs(bal)).toBeLessThan(0.01);
    }
  });
  it('SIP matches adding each instalment at the start of its month', () => {
    for (const [P, rate, years] of [[10_000, 12, 10], [500, 7.5, 3], [25_000, 15, 20]]) {
      let v = 0;
      for (let m = 0; m < years * 12; m++) v = (v + P) * (1 + rate / 1200);
      expect(sip(P, rate, years).futureValue).toBeCloseTo(v, 4);
    }
  });
  it('savings goal deposits actually reach the goal', () => {
    for (const [goal, start, rate, years] of [[50_000, 5_000, 5, 8], [1_000_000, 0, 7, 25]]) {
      const { monthlyNeeded } = savingsGoal(goal, start, rate, years);
      let v = start;
      for (let m = 0; m < years * 12; m++) v = v * (1 + rate / 1200) + monthlyNeeded;
      expect(v).toBeCloseTo(goal, 3);
    }
  });
  it('compound interest equals repeated compounding', () => {
    let v = 10_000;
    for (let i = 0; i < 15 * 12; i++) v *= 1 + 0.06 / 12;
    expect(compoundInterest(10_000, 6, 15, 12).amount).toBeCloseTo(v, 6);
  });
});

describe('data changelog stays in step with the configs', () => {
  it.each([
    ['india-tax', taxIndia.lastUpdated],
    ['us-tax', taxUS.lastUpdated],
    ['gst', gstIndia.lastUpdated],
    ['savings-india', savingsIndia.lastUpdated],
    ['hra-india', hraIndia.lastUpdated],
    ['retirement-us', retirementUS.lastUpdated],
    ['deadlines', deadlines.lastUpdated],
  ])('%s has a changelog entry dated its lastUpdated (%s)', (area, date) => {
    expect(dataChangelog.some((e) => e.area === area && e.date === date)).toBe(true);
  });
  it('is sorted newest first and every entry has an https source', () => {
    const dates = dataChangelog.map((e) => e.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    for (const e of dataChangelog) for (const s of e.sources) expect(s).toMatch(/^https:\/\//);
  });
});

describe('source references on tool pages', () => {
  it('tax tools list their config sources, and figure rows read values from the configs', () => {
    expect(toolReferences('income-tax-calculator-india').map((r) => r.url)).toEqual(taxIndia.sourceUrls);
    expect(toolReferences('paycheck-calculator').map((r) => r.url)).toEqual(taxUS.sourceUrls);
    const rows = figureSources('income-tax-calculator-india');
    expect(rows.find((r) => r.figure === 'Standard deduction')!.value).toContain('75,000');
    for (const slug of ['income-tax-calculator-india', 'paycheck-calculator', 'gst-calculator']) {
      for (const r of figureSources(slug)) expect(r.url).toMatch(/^https:\/\//);
    }
  });
  it('the non-official state source is labelled secondary', () => {
    expect(toolReferences('paycheck-calculator').find((r) => /taxfoundation/.test(r.url))!.kind).toBe('secondary');
  });
});

describe('author and reviewer are never invented', () => {
  it('structured data only includes a person when one is configured', () => {
    expect(editorial.author).toBeNull();
    expect(editorial.reviewer).toBeNull();
    expect(JSON.stringify(organizationJsonLd())).not.toMatch(/founder|PLACEHOLDER/);
  });
  it('personJsonLd only emits fields that were provided', () => {
    expect(personJsonLd({ name: 'A B' })).toEqual({ '@type': 'Person', name: 'A B' });
    expect(personJsonLd({ name: 'A B', jobTitle: 'CPA', url: 'https://x.example' })).toMatchObject({ jobTitle: 'CPA', url: 'https://x.example' });
  });
});
