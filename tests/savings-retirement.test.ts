import { describe, it, expect } from 'vitest';
import { fixedDeposit, fdByYear, recurringDeposit, ppf, hraExemption } from '../src/lib/calc/india-savings';
import { k401, k401Limit, retirementPlan } from '../src/lib/calc/us-retirement';
import { amortizationSchedule, autoLoan, refinance, refinanceCumulative, emi } from '../src/lib/calc/loan';

describe('fixed deposit', () => {
  it('quarterly compounding: ₹1,00,000 at 7% for 5 years', () => {
    // 100000 × (1 + 0.07/4)^20
    expect(fixedDeposit(100000, 7, 5, 'quarterly').maturity).toBeCloseTo(100000 * Math.pow(1.0175, 20), 6);
  });
  it('simple interest pays rate × years', () => {
    const r = fixedDeposit(100000, 7, 5, 'simple');
    expect(r.interest).toBeCloseTo(35000, 6);
    expect(r.effectiveYieldPercent).toBeCloseTo(7, 9);
  });
  it('effective yield exceeds the nominal rate when compounding', () => {
    expect(fixedDeposit(1000, 8, 1, 'quarterly').effectiveYieldPercent).toBeCloseTo(8.2432, 3);
  });
  it('zero rate, zero tenure, negative input', () => {
    expect(fixedDeposit(5000, 0, 3, 'monthly').maturity).toBe(5000);
    expect(fixedDeposit(5000, 7, 0, 'monthly').maturity).toBe(5000);
    expect(fixedDeposit(-5000, 7, 3, 'monthly').maturity).toBe(0);
  });
  it('fractional tenure is supported and chart ends at maturity', () => {
    const rows = fdByYear(100000, 7, 2.5, 'quarterly');
    expect(rows.at(-1)!.year).toBe(2.5);
    expect(rows.at(-1)!.value).toBeCloseTo(fixedDeposit(100000, 7, 2.5, 'quarterly').maturity, 6);
  });
});

describe('recurring deposit', () => {
  it('matches a month-by-month brute force with quarterly compounding', () => {
    const D = 5000, rate = 6.5, N = 36;
    let v = 0;
    const q = Math.pow(1 + rate / 400, 1 / 3);
    for (let k = 1; k <= N; k++) v += D * Math.pow(q, N - k + 1);
    expect(recurringDeposit(D, rate, N).maturity).toBeCloseTo(v, 6);
  });
  it('matches the standard bank formula R[(1+i)^n − 1] / (1 − (1+i)^(−1/3))', () => {
    const D = 1000, i = 0.07 / 4, n = 8; // 24 months
    const bank = (D * (Math.pow(1 + i, n) - 1)) / (1 - Math.pow(1 + i, -1 / 3));
    expect(recurringDeposit(D, 7, 24).maturity).toBeCloseTo(bank, 6);
  });
  it('zero rate and zero months', () => {
    expect(recurringDeposit(1000, 0, 12).maturity).toBe(12000);
    expect(recurringDeposit(1000, 7, 0).maturity).toBe(0);
  });
});

describe('PPF', () => {
  it('April deposits: closed form for 15 years at 7.1%', () => {
    const r = 0.071, d = 150000;
    let bal = 0; for (let y = 0; y < 15; y++) bal = (bal + d) * (1 + r);
    const res = ppf(d, 7.1, 15, 'april');
    expect(res.maturity).toBeCloseTo(bal, 4);
    expect(res.totalDeposited).toBe(2_250_000);
    expect(res.rows).toHaveLength(15);
  });
  it('monthly deposits earn less than a single April deposit', () => {
    expect(ppf(150000, 7.1, 15, 'monthly').maturity).toBeLessThan(ppf(150000, 7.1, 15, 'april').maturity);
  });
  it('first-year monthly interest = rate/12 × sum of running balances', () => {
    const d = 12000, r = 0.07;
    let expected = 0; for (let m = 1; m <= 12; m++) expected += ((1000 * m) * r) / 12;
    expect(ppf(d, 7, 1, 'monthly').rows[0].interest).toBeCloseTo(expected, 8);
  });
  it('zero rate returns the deposits; zero years is empty', () => {
    expect(ppf(1000, 0, 15, 'april').maturity).toBe(15000);
    expect(ppf(1000, 7, 0, 'april').rows).toEqual([]);
  });
});

describe('HRA exemption', () => {
  it('takes the least of the three limits (metro)', () => {
    const r = hraExemption({ basicMonthly: 50000, hraMonthly: 25000, rentMonthly: 20000, metro: true });
    // HRA 25000, rent − 10% basic = 15000, 50% basic = 25000 → 15000
    expect(r.exemptMonthly).toBe(15000);
    expect(r.binding).toBe('rent');
    expect(r.taxableAnnual).toBe(120000);
  });
  it('non-metro uses 40%', () => {
    const r = hraExemption({ basicMonthly: 50000, hraMonthly: 30000, rentMonthly: 40000, metro: false });
    // 30000, 35000, 20000 → 20000
    expect(r.exemptMonthly).toBe(20000);
    expect(r.binding).toBe('share');
  });
  it('no rent means no exemption; never negative', () => {
    const r = hraExemption({ basicMonthly: 50000, hraMonthly: 20000, rentMonthly: 4000, metro: true });
    expect(r.exemptMonthly).toBe(0);
    expect(r.taxableMonthly).toBe(20000);
  });
  it('HRA received can be the binding limit', () => {
    expect(hraExemption({ basicMonthly: 100000, hraMonthly: 10000, rentMonthly: 60000, metro: true }).binding).toBe('hra');
  });
});

const limits = { deferral: 24500, catchUp50: 8000, catchUp6063: 11250 };
describe('401(k)', () => {
  it('limit by age', () => {
    expect(k401Limit(40, limits)).toBe(24500);
    expect(k401Limit(50, limits)).toBe(32500);
    expect(k401Limit(60, limits)).toBe(35750);
    expect(k401Limit(63, limits)).toBe(35750);
    expect(k401Limit(64, limits)).toBe(32500);
  });
  const base = { age: 30, retireAge: 31, balance: 0, salary: 120000, employeePercent: 10, matchPercent: 50, matchCapPercent: 6, salaryGrowthPercent: 0, returnPercent: 0, limits };
  it('employer match = rate × min(employee, cap% × salary)', () => {
    const r = k401(base);
    expect(r.firstYearEmployee).toBe(12000);
    expect(r.firstYearEmployer).toBe(0.5 * 7200);
    expect(r.finalBalance).toBeCloseTo(12000 + 3600, 6);
  });
  it('caps the employee contribution at the limit and counts the capped years', () => {
    const r = k401({ ...base, salary: 400000, employeePercent: 20 });
    expect(r.firstYearEmployee).toBe(24500);
    expect(r.yearsCapped).toBe(1);
  });
  it('compounds monthly: lump balance only', () => {
    const r = k401({ ...base, salary: 0, balance: 10000, returnPercent: 6 });
    expect(r.finalBalance).toBeCloseTo(10000 * Math.pow(1 + 0.06 / 12, 12), 6);
  });
  it('retire age at or before current age returns the starting balance', () => {
    const r = k401({ ...base, retireAge: 30, balance: 500 });
    expect(r.years).toBe(0);
    expect(r.finalBalance).toBe(500);
  });
});

describe('retirement plan', () => {
  const inp = { age: 35, retireAge: 65, planAge: 95, savings: 100000, monthlyContribution: 1000, preReturnPercent: 6, postReturnPercent: 4, inflationPercent: 2.5, incomeToday: 5000, socialSecurityToday: 2000 };
  it('balance at retirement equals the annuity formula', () => {
    const r = 0.06 / 12, n = 360;
    const expected = 100000 * Math.pow(1 + r, n) + 1000 * ((Math.pow(1 + r, n) - 1) / r);
    expect(retirementPlan(inp).balanceAtRetirement).toBeCloseTo(expected, 4);
  });
  it('nest egg needed funds exactly the plan when simulated', () => {
    const p = retirementPlan(inp);
    let b = p.nestEggNeeded;
    for (let k = 0; k < p.retirementYears; k++) b = (b - p.annualGapAtRetirement * Math.pow(1.025, k)) * 1.04;
    expect(b).toBeCloseTo(0, 3);
  });
  it('adding the extra monthly amount closes the shortfall', () => {
    const p = retirementPlan({ ...inp, monthlyContribution: 100 });
    expect(p.shortfall).toBeGreaterThan(0);
    const fixed = retirementPlan({ ...inp, monthlyContribution: 100 + p.extraMonthlyNeeded });
    expect(fixed.shortfall).toBeCloseTo(0, 2);
  });
  it('reports when money runs out', () => {
    const p = retirementPlan({ ...inp, savings: 0, monthlyContribution: 0 });
    expect(p.lastsToAge).toBe(65);
    const q = retirementPlan({ ...inp, savings: 50000, monthlyContribution: 100 });
    expect(q.lastsToAge).not.toBeNull();
    expect(q.lastsToAge!).toBeGreaterThan(65);
    expect(q.lastsToAge!).toBeLessThan(95);
  });
  it('no gap when other income covers the target; plan age at retirement age', () => {
    expect(retirementPlan({ ...inp, socialSecurityToday: 6000 }).nestEggNeeded).toBe(0);
    expect(retirementPlan({ ...inp, planAge: 65 }).nestEggNeeded).toBe(0);
  });
  it('zero return rates still work', () => {
    const p = retirementPlan({ ...inp, preReturnPercent: 0, postReturnPercent: 0, inflationPercent: 0 });
    expect(p.balanceAtRetirement).toBe(100000 + 1000 * 360);
    expect(p.nestEggNeeded).toBeCloseTo(3000 * 12 * 30, 6);
  });
});

describe('amortization schedule', () => {
  it('ends at zero, interest + principal = payments, and agrees with emi()', () => {
    const rows = amortizationSchedule(500000, 8.5, 120);
    expect(rows).toHaveLength(120);
    expect(rows.at(-1)!.balance).toBe(0);
    const e = emi(500000, 8.5, 120);
    expect(rows[0].payment).toBeCloseTo(e.emi, 6);
    expect(rows.reduce((a, r) => a + r.principal, 0)).toBeCloseTo(500000, 4);
    expect(rows.reduce((a, r) => a + r.interest, 0)).toBeCloseTo(e.totalInterest, 4);
    expect(rows[0].interest).toBeCloseTo(500000 * 0.085 / 12, 6);
  });
  it('zero rate and zero months', () => {
    const rows = amortizationSchedule(1200, 0, 12);
    expect(rows.every((r) => r.interest === 0 && Math.abs(r.principal - 100) < 1e-9)).toBe(true);
    expect(amortizationSchedule(1200, 5, 0)).toEqual([]);
  });
});

describe('auto loan', () => {
  const base = { price: 30000, downPayment: 3000, tradeIn: 5000, salesTaxPercent: 7, fees: 500, tradeInReducesTax: true, annualRatePercent: 6, months: 60 };
  it('amount financed with the trade-in reducing tax', () => {
    const r = autoLoan(base);
    expect(r.salesTax).toBeCloseTo(1750, 6); // 7% × 25,000
    expect(r.amountFinanced).toBeCloseTo(30000 + 1750 + 500 - 3000 - 5000, 6);
  });
  it('tax on the full price when the trade-in does not reduce it', () => {
    expect(autoLoan({ ...base, tradeInReducesTax: false }).salesTax).toBeCloseTo(2100, 6);
  });
  it('down payment above the price finances nothing', () => {
    const r = autoLoan({ ...base, downPayment: 99999 });
    expect(r.amountFinanced).toBe(0);
    expect(r.payment).toBe(0);
  });
  it('total cost adds the money paid up front', () => {
    const r = autoLoan(base);
    expect(r.totalCost).toBeCloseTo(r.totalOfPayments + 8000, 6);
  });
});

describe('refinance', () => {
  const base = { balance: 300000, currentRatePercent: 7, remainingMonths: 300, newRatePercent: 5.5, newMonths: 300, closingCosts: 6000, rollCostsIntoLoan: false };
  it('break-even = upfront costs ÷ monthly savings, rounded up', () => {
    const r = refinance(base);
    expect(r.monthlySavings).toBeGreaterThan(0);
    expect(r.breakEvenMonths).toBe(Math.ceil(6000 / r.monthlySavings));
  });
  it('lifetime savings = remaining payments − new payments − upfront costs', () => {
    const r = refinance(base);
    expect(r.lifetimeSavings).toBeCloseTo(r.currentPayment * 300 - r.newPayment * 300 - 6000, 4);
  });
  it('rolling costs in raises the new principal and removes the break-even', () => {
    const r = refinance({ ...base, rollCostsIntoLoan: true });
    expect(r.newPrincipal).toBe(306000);
    expect(r.upfrontCosts).toBe(0);
    expect(r.breakEvenMonths).toBeNull();
  });
  it('a higher new rate gives no break-even and negative savings', () => {
    const r = refinance({ ...base, newRatePercent: 8 });
    expect(r.breakEvenMonths).toBeNull();
    expect(r.lifetimeSavings).toBeLessThan(0);
  });
  it('a longer new term can cut the payment but cost more overall', () => {
    const r = refinance({ ...base, remainingMonths: 180, newMonths: 360, newRatePercent: 6.5, closingCosts: 0 });
    expect(r.monthlySavings).toBeGreaterThan(0);
    expect(r.lifetimeSavings).toBeLessThan(0);
  });
  it('cumulative table starts at the upfront cost and ends at the totals', () => {
    const r = refinance(base);
    const rows = refinanceCumulative(r);
    expect(rows[0]).toEqual({ year: 0, current: 0, refinanced: 6000 });
    expect(rows.at(-1)!.current).toBeCloseTo(r.currentTotal, 4);
    expect(rows.at(-1)!.refinanced).toBeCloseTo(r.newTotal, 4);
  });
});
