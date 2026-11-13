/** Fixed deposit, recurring deposit, PPF and HRA maths (India). All pure functions. */
import { hraIndia } from '../../config/hra-india';

export type FdCompounding = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'simple';
export const FD_PERIODS: Record<Exclude<FdCompounding, 'simple'>, number> = { monthly: 12, quarterly: 4, 'half-yearly': 2, yearly: 1 };

export interface FdResult { principal: number; maturity: number; interest: number; effectiveYieldPercent: number }
/**
 * Maturity = P × (1 + r/m)^(m·t) for compounding m times a year, or P × (1 + r·t) for simple interest.
 * Negative inputs are treated as zero.
 */
export function fixedDeposit(principal: number, annualRatePercent: number, years: number, compounding: FdCompounding): FdResult {
  const P = Math.max(0, principal), t = Math.max(0, years), r = Math.max(0, annualRatePercent) / 100;
  if (compounding === 'simple') {
    const maturity = P * (1 + r * t);
    return { principal: P, maturity, interest: maturity - P, effectiveYieldPercent: r * 100 };
  }
  const m = FD_PERIODS[compounding];
  const maturity = P * Math.pow(1 + r / m, m * t);
  return { principal: P, maturity, interest: maturity - P, effectiveYieldPercent: (Math.pow(1 + r / m, m) - 1) * 100 };
}

/** Value of the deposit at the end of each whole year (and at maturity), for the chart. */
export function fdByYear(principal: number, annualRatePercent: number, years: number, compounding: FdCompounding): { year: number; value: number }[] {
  const t = Math.max(0, years);
  const out: { year: number; value: number }[] = [];
  for (let y = 0; y <= Math.ceil(t); y++) out.push({ year: Math.min(y, t), value: fixedDeposit(principal, annualRatePercent, Math.min(y, t), compounding).maturity });
  return out;
}

export interface RdResult { deposited: number; maturity: number; interest: number; months: number }
/**
 * Recurring deposit with quarterly compounding (the usual bank convention), a deposit at the start of every month.
 * With q = (1 + r/4)^(1/3) the k-th deposit earns for (N − k + 1) months, so
 * maturity = D × q × (q^N − 1) ÷ (q − 1). Rate 0 gives D × N.
 */
export function recurringDeposit(monthlyDeposit: number, annualRatePercent: number, months: number): RdResult {
  const D = Math.max(0, monthlyDeposit), N = Math.max(0, Math.round(months));
  const i = Math.max(0, annualRatePercent) / 400;
  const q = Math.pow(1 + i, 1 / 3);
  const maturity = N === 0 ? 0 : i === 0 ? D * N : (D * q * (Math.pow(q, N) - 1)) / (q - 1);
  return { deposited: D * N, maturity, interest: maturity - D * N, months: N };
}

export type PpfMode = 'april' | 'monthly';
export interface PpfYear { year: number; deposit: number; interest: number; balance: number }
export interface PpfResult { rows: PpfYear[]; totalDeposited: number; totalInterest: number; maturity: number }
/**
 * PPF: interest accrues monthly on the balance (including that month's deposit) and is credited once a year.
 *  - 'april': the whole year's deposit goes in at the start of the year, so interest = (opening balance + deposit) × rate.
 *  - 'monthly': the deposit is spread over twelve equal monthly deposits, each in time to earn that month's interest.
 * The caller enforces the legal minimum and maximum yearly deposit. Negative inputs are treated as zero.
 */
export function ppf(yearlyDeposit: number, annualRatePercent: number, years: number, mode: PpfMode): PpfResult {
  const d = Math.max(0, yearlyDeposit), r = Math.max(0, annualRatePercent) / 100;
  const n = Math.max(0, Math.round(years));
  const rows: PpfYear[] = [];
  let bal = 0;
  for (let y = 1; y <= n; y++) {
    let interest = 0;
    if (mode === 'april') interest = (bal + d) * r;
    else {
      let b = bal;
      for (let m = 0; m < 12; m++) { b += d / 12; interest += (b * r) / 12; }
    }
    bal += d + interest;
    rows.push({ year: y, deposit: d, interest, balance: bal });
  }
  return { rows, totalDeposited: d * n, totalInterest: bal - d * n, maturity: bal };
}

export interface HraInput { basicMonthly: number; hraMonthly: number; rentMonthly: number; metro: boolean }
export type HraLimb = 'hra' | 'rent' | 'share';
export interface HraResult {
  limits: { hraReceived: number; rentMinusTenPercent: number; share: number };
  exemptMonthly: number; taxableMonthly: number; exemptAnnual: number; taxableAnnual: number;
  binding: HraLimb; sharePercent: number;
}
/** Exemption = the least of (HRA received, rent paid − 10% of basic, 50% or 40% of basic), never below zero. Basic includes dearness allowance. */
export function hraExemption(i: HraInput): HraResult {
  const basic = Math.max(0, i.basicMonthly), hra = Math.max(0, i.hraMonthly), rent = Math.max(0, i.rentMonthly);
  const share = i.metro ? hraIndia.metroShare : hraIndia.otherShare;
  const limits = { hraReceived: hra, rentMinusTenPercent: Math.max(0, rent - hraIndia.rentExcessShare * basic), share: share * basic };
  const exempt = Math.min(limits.hraReceived, limits.rentMinusTenPercent, limits.share);
  const binding: HraLimb = exempt === limits.hraReceived ? 'hra' : exempt === limits.rentMinusTenPercent ? 'rent' : 'share';
  return { limits, exemptMonthly: exempt, taxableMonthly: hra - exempt, exemptAnnual: exempt * 12, taxableAnnual: (hra - exempt) * 12, binding, sharePercent: share * 100 };
}
