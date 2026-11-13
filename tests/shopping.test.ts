import { describe, it, expect } from 'vitest';
import { gst, salesTax, discount, hourlyToSalary } from '../src/lib/calc/shopping';

describe('gst', () => {
  it('adds GST', () => {
    const r = gst(1000, 18, 'add');
    expect(r.gst).toBeCloseTo(180, 8);
    expect(r.total).toBeCloseTo(1180, 8);
    expect(r.cgst).toBeCloseTo(90, 8);
  });
  it('removes GST', () => {
    const r = gst(1180, 18, 'remove');
    expect(r.base).toBeCloseTo(1000, 8);
    expect(r.gst).toBeCloseTo(180, 8);
  });
  it('zero rate and zero amount', () => {
    expect(gst(500, 0, 'add').total).toBe(500);
    expect(gst(0, 18, 'remove').gst).toBe(0);
  });
  it('very large amounts', () => {
    expect(Number.isFinite(gst(1e18, 28, 'remove').base)).toBe(true);
  });
});

describe('salesTax', () => {
  it('adds and removes tax', () => {
    expect(salesTax(100, 8.25, 'add').total).toBeCloseTo(108.25, 8);
    expect(salesTax(108.25, 8.25, 'remove').pretax).toBeCloseTo(100, 8);
  });
  it('zero rate', () => expect(salesTax(50, 0, 'add').tax).toBe(0));
});

describe('discount', () => {
  it('single discount', () => {
    const d = discount(200, 25);
    expect(d.finalPrice).toBe(150);
    expect(d.totalSavings).toBe(50);
  });
  it('stacks extra discount on the reduced price', () => {
    const d = discount(100, 20, 10);
    expect(d.finalPrice).toBeCloseTo(72, 8);
    expect(d.effectivePercent).toBeCloseTo(28, 8);
  });
  it('clamps to 0-100% and handles zero price', () => {
    expect(discount(100, 150).finalPrice).toBe(0);
    expect(discount(0, 20).effectivePercent).toBe(0);
    expect(discount(100, 0).finalPrice).toBe(100);
  });
});

describe('hourlyToSalary', () => {
  it('40h x 52w', () => {
    const r = hourlyToSalary(25, 40, 52);
    expect(r.annual).toBe(52_000);
    expect(r.monthly).toBeCloseTo(4333.33, 2);
    expect(r.weekly).toBe(1000);
  });
  it('unpaid weeks reduce pay', () => {
    expect(hourlyToSalary(20, 40, 52, 2).annual).toBe(40_000);
  });
  it('zero hours and zero rate', () => {
    expect(hourlyToSalary(20, 0, 52).annual).toBe(0);
    expect(hourlyToSalary(0, 40, 52).annual).toBe(0);
  });
  it('very large values', () => {
    expect(Number.isFinite(hourlyToSalary(1e12, 168, 52).annual)).toBe(true);
  });
});
