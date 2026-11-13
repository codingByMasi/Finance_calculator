/**
 * Investing maths.
 *  SIP future value  = P × (((1+r)^n − 1) / r) × (1+r)      r = monthly rate, n = months (payments at start of month)
 *  Compound interest = P × (1 + r/m)^(m×t)                   r = annual rate, m = compounds/yr, t = years
 */

export interface SipResult { futureValue: number; invested: number; gain: number; monthlyRate: number; months: number }

/** rate 0 → FV = P × n. months <= 0 → zeros. */
export function sip(monthlyInvestment: number, annualRatePercent: number, years: number): SipResult {
  const P = Math.max(0, monthlyInvestment);
  const n = Math.round(Math.max(0, years) * 12);
  const r = annualRatePercent / 12 / 100;
  if (n === 0) return { futureValue: 0, invested: 0, gain: 0, monthlyRate: r, months: 0 };
  const fv = r === 0 ? P * n : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  const invested = P * n;
  return { futureValue: fv, invested, gain: fv - invested, monthlyRate: r, months: n };
}

export interface LumpsumResult { futureValue: number; invested: number; gain: number }
/** Annual compounding: A = P × (1+r)^t. */
export function lumpsum(amount: number, annualRatePercent: number, years: number): LumpsumResult {
  const P = Math.max(0, amount);
  const fv = P * Math.pow(1 + annualRatePercent / 100, Math.max(0, years));
  return { futureValue: fv, invested: P, gain: fv - P };
}

export interface CompoundResult { amount: number; interest: number; principal: number; periods: number; periodicRate: number }
export function compoundInterest(principal: number, annualRatePercent: number, years: number, compoundsPerYear: number): CompoundResult {
  const P = Math.max(0, principal);
  const m = Math.max(1, Math.round(compoundsPerYear));
  const t = Math.max(0, years);
  const r = annualRatePercent / 100;
  const periods = m * t;
  const A = P * Math.pow(1 + r / m, periods);
  return { amount: A, interest: A - P, principal: P, periods, periodicRate: r / m };
}

export interface SavingsGoalResult {
  monthlyNeeded: number;
  totalContributed: number;
  interestEarned: number;
  months: number;
  alreadyReached: boolean;
}
/**
 * Monthly deposit needed to reach `goal` from `startingBalance` in `years`,
 * deposits at the end of each month, monthly compounding at annualRate/12.
 * Needed = (goal − start×(1+r)^n) × r / ((1+r)^n − 1); zero rate → (goal − start)/n.
 */
export function savingsGoal(goal: number, startingBalance: number, annualRatePercent: number, years: number): SavingsGoalResult {
  const n = Math.round(Math.max(0, years) * 12);
  const r = annualRatePercent / 12 / 100;
  const start = Math.max(0, startingBalance);
  const G = Math.max(0, goal);
  if (n === 0) return { monthlyNeeded: Math.max(0, G - start), totalContributed: Math.max(0, G - start), interestEarned: 0, months: 0, alreadyReached: start >= G };
  const growth = r === 0 ? 1 : Math.pow(1 + r, n);
  const startFv = start * growth;
  if (startFv >= G) return { monthlyNeeded: 0, totalContributed: 0, interestEarned: startFv - start, months: n, alreadyReached: true };
  const needed = r === 0 ? (G - start) / n : ((G - startFv) * r) / (growth - 1);
  const contributed = needed * n;
  return { monthlyNeeded: needed, totalContributed: contributed, interestEarned: G - start - contributed, months: n, alreadyReached: false };
}

/** Year-end balances for a monthly SIP (chart data). */
export function sipByYear(monthly: number, annualRatePercent: number, years: number): { year: number; invested: number; value: number }[] {
  const out = [];
  for (let y = 1; y <= Math.ceil(years); y++) {
    const s = sip(monthly, annualRatePercent, Math.min(y, years));
    out.push({ year: y, invested: s.invested, value: s.futureValue });
  }
  return out;
}
