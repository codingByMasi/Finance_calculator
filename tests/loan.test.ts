import { describe, it, expect } from 'vitest';
import { emi, amortizationByYear, mortgage, compareLoans } from '../src/lib/calc/loan';

describe('emi', () => {
  it('matches the standard formula (₹10L, 9%, 20y)', () => {
    const r = emi(1_000_000, 9, 240);
    expect(r.emi).toBeCloseTo(8997.26, 1);
    expect(r.totalPayment).toBeCloseTo(r.emi * 240, 6);
    expect(r.totalInterest).toBeCloseTo(r.totalPayment - 1_000_000, 6);
  });
  it('handles zero rate as P/n', () => {
    const r = emi(120_000, 0, 12);
    expect(r.emi).toBe(10_000);
    expect(r.totalInterest).toBe(0);
  });
  it('handles zero tenure: principal due at once', () => {
    const r = emi(50_000, 8, 0);
    expect(r.emi).toBe(50_000);
    expect(r.totalInterest).toBe(0);
    expect(r.months).toBe(0);
  });
  it('handles zero principal', () => {
    expect(emi(0, 8, 60).emi).toBe(0);
  });
  it('handles very large values without NaN', () => {
    const r = emi(1e15, 12, 360);
    expect(Number.isFinite(r.emi)).toBe(true);
    expect(r.emi).toBeGreaterThan(1e13);
  });
  it('handles extreme rate and tenure without overflow to NaN', () => {
    const r = emi(1000, 1_000_000, 12000);
    expect(Number.isNaN(r.emi)).toBe(false);
  });
});

describe('amortizationByYear', () => {
  it('pays the loan down to zero and principal sums to the loan', () => {
    const rows = amortizationByYear(500_000, 10, 60);
    expect(rows).toHaveLength(5);
    expect(rows[rows.length - 1].balance).toBe(0);
    expect(rows.reduce((s, r) => s + r.principal, 0)).toBeCloseTo(500_000, 4);
  });
  it('returns nothing for zero tenure', () => {
    expect(amortizationByYear(1000, 5, 0)).toEqual([]);
  });
  it('works with zero rate', () => {
    const rows = amortizationByYear(12_000, 0, 12);
    expect(rows[0].interest).toBe(0);
    expect(rows[0].balance).toBe(0);
  });
});

describe('mortgage', () => {
  it('computes P&I plus taxes and insurance', () => {
    const m = mortgage({ homePrice: 400_000, downPayment: 80_000, annualRatePercent: 6.5, years: 30, propertyTaxAnnual: 4800, insuranceAnnual: 1200, hoaMonthly: 50 });
    expect(m.loanAmount).toBe(320_000);
    expect(m.principalAndInterest).toBeCloseTo(2022.62, 1);
    expect(m.propertyTaxMonthly).toBe(400);
    expect(m.insuranceMonthly).toBe(100);
    expect(m.totalMonthly).toBeCloseTo(m.principalAndInterest + 550, 6);
  });
  it('zero rate and zero down', () => {
    const m = mortgage({ homePrice: 360_000, downPayment: 0, annualRatePercent: 0, years: 30 });
    expect(m.principalAndInterest).toBe(1000);
    expect(m.totalMonthly).toBe(1000);
  });
  it('down payment larger than price gives zero loan', () => {
    expect(mortgage({ homePrice: 100, downPayment: 500, annualRatePercent: 5, years: 10 }).loanAmount).toBe(0);
  });
  it('very large price stays finite', () => {
    expect(Number.isFinite(mortgage({ homePrice: 1e12, downPayment: 0, annualRatePercent: 7, years: 30 }).totalMonthly)).toBe(true);
  });
});

describe('compareLoans', () => {
  it('identifies the cheaper loan', () => {
    const c = compareLoans({ amount: 100_000, rate: 8, months: 120 }, { amount: 100_000, rate: 7, months: 120 });
    expect(c.cheaper).toBe('b');
    expect(c.totalDiff).toBeLessThan(0);
  });
  it('same loans are equal', () => {
    const l = { amount: 1, rate: 1, months: 12 };
    expect(compareLoans(l, l).cheaper).toBe('same');
  });
  it('handles zero tenure and zero rate', () => {
    const c = compareLoans({ amount: 1000, rate: 0, months: 10 }, { amount: 1000, rate: 5, months: 0 });
    expect(c.a.emi).toBe(100);
    expect(c.b.emi).toBe(1000);
  });
});
