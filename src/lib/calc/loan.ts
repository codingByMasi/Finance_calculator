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

export interface ScheduleRow { n: number; payment: number; interest: number; principal: number; balance: number }
/**
 * Month-by-month amortisation. The last payment is trimmed so the balance ends at exactly zero
 * (the regular EMI is rounded in practice, so the final instalment differs slightly).
 */
export function amortizationSchedule(principal: number, annualRatePercent: number, months: number): ScheduleRow[] {
  const { emi: pay, monthlyRate: r, months: n } = emi(principal, annualRatePercent, months);
  const rows: ScheduleRow[] = [];
  let balance = Math.max(0, principal);
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    let princ = Math.min(balance, pay - interest);
    if (m === n) princ = balance;
    balance = Math.max(0, balance - princ);
    rows.push({ n: m, payment: interest + princ, interest, principal: princ, balance: balance < 0.005 ? 0 : balance });
  }
  return rows;
}

export interface AutoLoanInput {
  price: number; downPayment: number; tradeIn: number; salesTaxPercent: number; fees: number;
  /** true: sales tax is charged only on price minus trade-in (rules differ by state) */
  tradeInReducesTax: boolean;
  annualRatePercent: number; months: number;
}
export interface AutoLoanResult {
  salesTax: number; amountFinanced: number; payment: number; totalInterest: number;
  totalOfPayments: number; totalCost: number; months: number;
}
/** Amount financed = price + sales tax + fees − down payment − trade-in (never below zero). Tax and fees are financed, not paid up front. */
export function autoLoan(i: AutoLoanInput): AutoLoanResult {
  const price = Math.max(0, i.price), trade = Math.max(0, i.tradeIn), down = Math.max(0, i.downPayment);
  const taxBase = Math.max(0, price - (i.tradeInReducesTax ? trade : 0));
  const salesTax = (taxBase * Math.max(0, i.salesTaxPercent)) / 100;
  const financed = Math.max(0, price + salesTax + Math.max(0, i.fees) - down - trade);
  const e = emi(financed, i.annualRatePercent, i.months);
  return { salesTax, amountFinanced: financed, payment: e.emi, totalInterest: e.totalInterest, totalOfPayments: e.totalPayment, totalCost: e.totalPayment + down + trade, months: e.months };
}

export interface RefinanceInput {
  balance: number; currentRatePercent: number; remainingMonths: number;
  newRatePercent: number; newMonths: number; closingCosts: number; rollCostsIntoLoan: boolean;
}
export interface RefinanceResult {
  currentPayment: number; newPayment: number; monthlySavings: number;
  newPrincipal: number; upfrontCosts: number;
  /** months of savings needed to repay the upfront costs; null when there are no upfront costs or no monthly saving */
  breakEvenMonths: number | null;
  currentTotal: number; newTotal: number; /** negative = refinancing costs more over the life of the loans */ lifetimeSavings: number;
  currentMonths: number; newMonths: number;
}
/**
 * Compares the remaining payments on the current loan (re-derived from balance, rate and remaining term, so it ignores any escrow)
 * with a new loan on the same balance (plus closing costs if rolled in). Costs paid up front count towards the new loan's total.
 */
export function refinance(i: RefinanceInput): RefinanceResult {
  const balance = Math.max(0, i.balance), costs = Math.max(0, i.closingCosts);
  const cur = emi(balance, i.currentRatePercent, i.remainingMonths);
  const newPrincipal = balance + (i.rollCostsIntoLoan ? costs : 0);
  const nw = emi(newPrincipal, i.newRatePercent, i.newMonths);
  const upfront = i.rollCostsIntoLoan ? 0 : costs;
  const monthlySavings = cur.emi - nw.emi;
  return {
    currentPayment: cur.emi, newPayment: nw.emi, monthlySavings, newPrincipal, upfrontCosts: upfront,
    breakEvenMonths: upfront > 0 && monthlySavings > 0 ? Math.ceil(upfront / monthlySavings) : null,
    currentTotal: cur.totalPayment, newTotal: nw.totalPayment + upfront, lifetimeSavings: cur.totalPayment - (nw.totalPayment + upfront),
    currentMonths: cur.months, newMonths: nw.months,
  };
}

/** Cumulative cash paid after each whole year for the refinance chart (payments plus any upfront costs). */
export function refinanceCumulative(r: RefinanceResult): { year: number; current: number; refinanced: number }[] {
  const years = Math.ceil(Math.max(r.currentMonths, r.newMonths) / 12);
  const out = [];
  for (let y = 0; y <= years; y++) {
    out.push({ year: y, current: Math.min(y * 12, r.currentMonths) * r.currentPayment, refinanced: r.upfrontCosts + Math.min(y * 12, r.newMonths) * r.newPayment });
  }
  return out;
}
