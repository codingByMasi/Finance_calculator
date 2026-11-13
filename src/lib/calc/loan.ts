/** Loan maths: EMI = P × r × (1+r)^n / ((1+r)^n − 1), r = monthly rate, n = months. */

export interface EmiResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  monthlyRate: number;
  months: number;
}

/**
 * Edge cases (documented, tested):
 *  - rate 0  → EMI = P / n (no interest)
 *  - months <= 0 → the whole principal is due at once: EMI = P, interest 0
 */
export function emi(principal: number, annualRatePercent: number, months: number): EmiResult {
  const P = Math.max(0, principal);
  const n = Math.round(months);
  if (n <= 0) return { emi: P, totalPayment: P, totalInterest: 0, monthlyRate: annualRatePercent / 1200, months: 0 };
  const r = annualRatePercent / 12 / 100;
  let payment: number;
  if (r === 0) payment = P / n;
  else {
    const g = Math.pow(1 + r, n);
    payment = Number.isFinite(g) ? (P * r * g) / (g - 1) : P * r; // g overflow: payment → P×r
  }
  const total = payment * n;
  return { emi: payment, totalPayment: total, totalInterest: total - P, monthlyRate: r, months: n };
}

export interface YearRow { year: number; interest: number; principal: number; balance: number }

/** Year-by-year amortisation: interest and principal paid per year, closing balance. */
export function amortizationByYear(principal: number, annualRatePercent: number, months: number): YearRow[] {
  const { emi: pay, monthlyRate: r, months: n } = emi(principal, annualRatePercent, months);
  const rows: YearRow[] = [];
  let balance = Math.max(0, principal);
  let yi = 0, yp = 0;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const princ = Math.min(balance, pay - interest);
    balance = Math.max(0, balance - princ);
    yi += interest; yp += princ;
    if (m % 12 === 0 || m === n) {
      rows.push({ year: Math.ceil(m / 12), interest: yi, principal: yp, balance: balance < 0.005 ? 0 : balance });
      yi = 0; yp = 0;
    }
  }
  return rows;
}

export interface MortgageInput {
  homePrice: number;
  downPayment: number; // amount
  annualRatePercent: number;
  years: number;
  propertyTaxAnnual?: number;
  insuranceAnnual?: number;
  hoaMonthly?: number;
}
export interface MortgageResult {
  loanAmount: number;
  principalAndInterest: number;
  propertyTaxMonthly: number;
  insuranceMonthly: number;
  hoaMonthly: number;
  totalMonthly: number;
  totalInterest: number;
  totalPaid: number;
}

export function mortgage(i: MortgageInput): MortgageResult {
  const loan = Math.max(0, i.homePrice - Math.max(0, i.downPayment));
  const e = emi(loan, i.annualRatePercent, Math.round(i.years * 12));
  const tax = Math.max(0, i.propertyTaxAnnual ?? 0) / 12;
  const ins = Math.max(0, i.insuranceAnnual ?? 0) / 12;
  const hoa = Math.max(0, i.hoaMonthly ?? 0);
  return {
    loanAmount: loan,
    principalAndInterest: e.emi,
    propertyTaxMonthly: tax,
    insuranceMonthly: ins,
    hoaMonthly: hoa,
    totalMonthly: e.emi + tax + ins + hoa,
    totalInterest: e.totalInterest,
    totalPaid: e.totalPayment,
  };
}

export interface LoanCompareResult {
  a: EmiResult; b: EmiResult;
  monthlyDiff: number; // b - a
  interestDiff: number; // b - a
  totalDiff: number; // b - a
  cheaper: 'a' | 'b' | 'same';
}
export function compareLoans(a: { amount: number; rate: number; months: number }, b: { amount: number; rate: number; months: number }): LoanCompareResult {
  const ra = emi(a.amount, a.rate, a.months);
  const rb = emi(b.amount, b.rate, b.months);
  const totalDiff = rb.totalPayment - ra.totalPayment;
  return {
    a: ra, b: rb,
    monthlyDiff: rb.emi - ra.emi,
    interestDiff: rb.totalInterest - ra.totalInterest,
    totalDiff,
    cheaper: Math.abs(totalDiff) < 0.005 ? 'same' : totalDiff > 0 ? 'a' : 'b',
  };
}
