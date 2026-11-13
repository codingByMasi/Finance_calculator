import { describe, it, expect } from 'vitest';
import { computeIndiaTax, slabTax } from '../src/lib/calc/tax-india';
import { computePaycheck, computeStateTax, bracketTax } from '../src/lib/calc/tax-us';
import { taxIndia } from '../src/config/tax-india';
import { taxUS, stateTaxes } from '../src/config/tax-us';

describe('india tax (uses config)', () => {
  it('config carries lastUpdated and a source URL', () => {
    expect(taxIndia.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(taxIndia.sourceUrls[0]).toMatch(/^https:\/\//);
    expect(taxUS.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(taxUS.sourceUrls[0]).toMatch(/^https:\/\//);
  });
  it('slabTax sums slab by slab', () => {
    // 0-4L nil, 4-8L 5% = 20000, 8-10L 10% = 20000
    expect(slabTax(1_000_000, taxIndia.newRegime.slabs).total).toBeCloseTo(40_000, 6);
  });
  it('new regime: ₹12L salary is tax-free via 87A (taxable 11.25L)', () => {
    const r = computeIndiaTax({ grossAnnual: 1_200_000, regime: 'new' });
    expect(r.taxableIncome).toBe(1_200_000 - taxIndia.newRegime.standardDeduction);
    expect(r.totalTax).toBe(0);
  });
  it('new regime: marginal relief just above the rebate limit', () => {
    // taxable = 12,10,000 → tax limited to 10,000 (+4% cess)
    const r = computeIndiaTax({ grossAnnual: 1_210_000 + taxIndia.newRegime.standardDeduction, regime: 'new' });
    expect(r.taxableIncome).toBe(1_210_000);
    expect(r.totalTax).toBeCloseTo(10_000 * 1.04, 6);
  });
  it('new regime: ₹25L gross', () => {
    const r = computeIndiaTax({ grossAnnual: 2_500_000, regime: 'new' });
    const taxable = 2_500_000 - taxIndia.newRegime.standardDeduction; // 24,25,000
    expect(r.taxableIncome).toBe(taxable);
    // 20k + 40k + 60k + 80k + 100k = 300k up to 24L, plus 30% of 25,000 = 7,500
    expect(r.slabTax).toBeCloseTo(307_500, 6);
    expect(r.cess).toBeCloseTo(307_500 * 0.04, 6);
  });
  it('old regime applies deductions and 80C cap', () => {
    const r = computeIndiaTax({ grossAnnual: 1_000_000, regime: 'old', deduction80C: 500_000, otherDeductions: 25_000, hraExemption: 0 });
    expect(r.otherDeductions).toBe(taxIndia.oldRegime.deduction80CLimit + 25_000);
    expect(r.taxableIncome).toBe(1_000_000 - taxIndia.oldRegime.standardDeduction - r.otherDeductions);
  });
  it('old regime rebate wipes tax up to 5L taxable', () => {
    const r = computeIndiaTax({ grossAnnual: 550_000, regime: 'old' });
    expect(r.taxableIncome).toBe(500_000);
    expect(r.totalTax).toBe(0);
  });
  it('zero income', () => {
    const r = computeIndiaTax({ grossAnnual: 0, regime: 'new' });
    expect(r.totalTax).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });
  it('very large income applies surcharge and stays finite', () => {
    const r = computeIndiaTax({ grossAnnual: 1e10, regime: 'old' });
    expect(r.surchargeRate).toBe(0.37);
    expect(Number.isFinite(r.netAnnual)).toBe(true);
    const n = computeIndiaTax({ grossAnnual: 1e10, regime: 'new' });
    expect(n.surchargeRate).toBe(0.25);
  });
});

describe('us state schedules (uses config)', () => {
  const st = (c: string) => stateTaxes.find((s) => s.code === c)!;
  it('covers 50 states plus DC with unique codes', () => {
    expect(stateTaxes).toHaveLength(51);
    expect(new Set(stateTaxes.map((s) => s.code)).size).toBe(51);
  });
  it('no-wage-tax states are zero', () => {
    for (const c of ['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']) {
      expect(st(c).kind).toBe('none');
      expect(computeStateTax(st(c), 'single', 500_000).tax).toBe(0);
    }
  });
  it('California single, 100k: brackets, standard deduction and exemption credit', () => {
    // taxable 94,460: 110.79 + 303.70 + 607.52 + 965.40 + 1214.56 + 2021.448 = 5223.418; less 153 credit
    const r = computeStateTax(st('CA'), 'single', 100_000);
    expect(r.taxable).toBe(94_460);
    expect(r.tax).toBeCloseTo(5223.418 - 153, 2);
  });
  it('flat state with threshold (Idaho) taxes only above the threshold', () => {
    const r = computeStateTax(st('ID'), 'single', 50_000);
    expect(r.taxable).toBe(50_000 - 16_100);
    expect(r.tax).toBeCloseTo((33_900 - 4_811) * 0.053, 6);
  });
  it('flat state (Colorado) single vs married standard deduction', () => {
    expect(computeStateTax(st('CO'), 'single', 100_000).tax).toBeCloseTo((100_000 - 16_100) * 0.044, 6);
    expect(computeStateTax(st('CO'), 'married', 100_000).tax).toBeCloseTo((100_000 - 32_200) * 0.044, 6);
  });
  it('Utah standard deduction is a credit', () => {
    const r = computeStateTax(st('UT'), 'single', 60_000);
    expect(r.tax).toBeCloseTo(60_000 * 0.045 - 966, 6);
  });
  it('low income never gives negative tax; huge income stays finite', () => {
    expect(computeStateTax(st('NY'), 'single', 1_000).tax).toBe(0);
    expect(Number.isFinite(computeStateTax(st('NY'), 'single', 1e12).tax)).toBe(true);
  });
  it('every graduated schedule is ascending with rates in (0, 15%)', () => {
    for (const s of stateTaxes) for (const col of ['single', 'married'] as const) {
      const b = s.brackets[col];
      for (let i = 1; i < b.length; i++) expect(b[i].upTo).toBeGreaterThan(b[i - 1].upTo);
      for (const x of b) expect(x.rate).toBeLessThan(0.15);
    }
  });
});

describe('us paycheck (uses config)', () => {
  it('bracketTax: single 60,000 taxable', () => {
    // 10% x 12400 + 12% x 38000 + 22% x 9600
    expect(bracketTax(60_000, taxUS.brackets.single).total).toBeCloseTo(1240 + 4560 + 2112, 6);
  });
  it('no-income-tax state: federal + FICA only', () => {
    const r = computePaycheck({ grossAnnual: 80_000, payPeriodsPerYear: 26, filing: 'single', stateCode: 'TX' });
    expect(r.state).toBe(0);
    expect(r.socialSecurity).toBeCloseTo(80_000 * 0.062, 6);
    expect(r.medicare).toBeCloseTo(80_000 * 0.0145, 6);
    expect(r.netAnnual).toBeCloseTo(80_000 - r.federal - r.fica, 6);
    expect(r.netPerPeriod).toBeCloseTo(r.netAnnual / 26, 8);
  });
  it('social security stops at the wage base; additional Medicare kicks in', () => {
    const r = computePaycheck({ grossAnnual: 300_000, payPeriodsPerYear: 12, filing: 'single', stateCode: 'FL' });
    expect(r.socialSecurity).toBeCloseTo(taxUS.fica.socialSecurityWageBase * 0.062, 6);
    expect(r.additionalMedicare).toBeCloseTo(100_000 * 0.009, 6);
  });
  it('pre-tax contributions reduce federal and state tax but not FICA', () => {
    const a = computePaycheck({ grossAnnual: 90_000, payPeriodsPerYear: 24, filing: 'single', stateCode: 'NY' });
    const b = computePaycheck({ grossAnnual: 90_000, payPeriodsPerYear: 24, filing: 'single', stateCode: 'NY', preTaxAnnual: 10_000 });
    expect(b.federal).toBeLessThan(a.federal);
    expect(b.state).toBeLessThan(a.state);
    expect(b.fica).toBe(a.fica);
  });
  it('income below the standard deduction pays no federal tax', () => {
    expect(computePaycheck({ grossAnnual: 10_000, payPeriodsPerYear: 12, filing: 'married', stateCode: 'TX' }).federal).toBe(0);
  });
  it('zero income and unknown state fall back safely', () => {
    const r = computePaycheck({ grossAnnual: 0, payPeriodsPerYear: 12, filing: 'single', stateCode: 'ZZ' });
    expect(r.netAnnual).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });
  it('very large income stays finite', () => {
    const r = computePaycheck({ grossAnnual: 1e10, payPeriodsPerYear: 12, filing: 'head', stateCode: 'CA' });
    expect(Number.isFinite(r.netAnnual)).toBe(true);
    expect(r.federalLines.at(-1)?.rate).toBe(0.37);
  });
});
