import { describe, it, expect } from 'vitest';
import { sip, lumpsum, compoundInterest, savingsGoal, sipByYear } from '../src/lib/calc/invest';

describe('sip', () => {
  it('matches the annuity-due formula (₹10k, 12%, 10y)', () => {
    const r = sip(10_000, 12, 10);
    expect(r.futureValue).toBeCloseTo(2_323_390.76, 0);
    expect(r.invested).toBe(1_200_000);
    expect(r.gain).toBeCloseTo(r.futureValue - 1_200_000, 6);
  });
  it('zero rate is simple accumulation', () => {
    expect(sip(5000, 0, 2).futureValue).toBe(120_000);
  });
  it('zero tenure gives zero', () => {
    const r = sip(5000, 12, 0);
    expect(r.futureValue).toBe(0);
    expect(r.invested).toBe(0);
  });
  it('very large values stay finite', () => {
    expect(Number.isFinite(sip(1e12, 12, 50).futureValue)).toBe(true);
  });
  it('year series ends at the final value', () => {
    const rows = sipByYear(1000, 10, 5);
    expect(rows).toHaveLength(5);
    expect(rows[4].value).toBeCloseTo(sip(1000, 10, 5).futureValue, 6);
  });
});

describe('lumpsum', () => {
  it('compounds annually', () => {
    expect(lumpsum(100_000, 10, 2).futureValue).toBeCloseTo(121_000, 6);
  });
  it('zero rate and zero years return the principal', () => {
    expect(lumpsum(100, 0, 10).futureValue).toBe(100);
    expect(lumpsum(100, 10, 0).futureValue).toBe(100);
  });
  it('very large values', () => {
    expect(Number.isFinite(lumpsum(1e15, 12, 40).futureValue)).toBe(true);
  });
});

describe('compoundInterest', () => {
  it('A = P(1 + r/m)^(mt), monthly', () => {
    const r = compoundInterest(10_000, 5, 10, 12);
    expect(r.amount).toBeCloseTo(16_470.09, 1);
    expect(r.interest).toBeCloseTo(6_470.09, 1);
  });
  it('annual compounding', () => {
    expect(compoundInterest(1000, 10, 2, 1).amount).toBeCloseTo(1210, 8);
  });
  it('zero rate and zero years', () => {
    expect(compoundInterest(1000, 0, 5, 12).amount).toBe(1000);
    expect(compoundInterest(1000, 5, 0, 12).amount).toBe(1000);
  });
  it('very large values', () => {
    expect(Number.isFinite(compoundInterest(1e15, 8, 30, 365).amount)).toBe(true);
  });
});

describe('savingsGoal', () => {
  it('computes monthly deposit; deposits grow to the goal', () => {
    const g = savingsGoal(100_000, 0, 6, 10);
    const r = 0.005, n = 120;
    const fv = g.monthlyNeeded * ((Math.pow(1 + r, n) - 1) / r);
    expect(fv).toBeCloseTo(100_000, 4);
  });
  it('zero rate divides evenly', () => {
    expect(savingsGoal(12_000, 0, 0, 1).monthlyNeeded).toBe(1000);
  });
  it('zero tenure needs the whole gap at once', () => {
    expect(savingsGoal(5000, 1000, 5, 0).monthlyNeeded).toBe(4000);
  });
  it('already reached when start grows past goal', () => {
    const g = savingsGoal(1000, 5000, 3, 2);
    expect(g.alreadyReached).toBe(true);
    expect(g.monthlyNeeded).toBe(0);
  });
  it('very large goal stays finite', () => {
    expect(Number.isFinite(savingsGoal(1e15, 0, 7, 30).monthlyNeeded)).toBe(true);
  });
});
