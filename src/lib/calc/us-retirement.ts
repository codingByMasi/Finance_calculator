/** 401(k) and general retirement-planning maths (US). All pure functions; limits are passed in from the config. */

export interface K401Limits { deferral: number; catchUp50: number; catchUp6063: number }
export interface K401Input {
  age: number; retireAge: number; balance: number; salary: number;
  employeePercent: number; matchPercent: number; matchCapPercent: number;
  salaryGrowthPercent: number; returnPercent: number; limits: K401Limits;
}
export interface K401Year { age: number; employee: number; employer: number; balance: number }
export interface K401Result {
  rows: K401Year[]; years: number; finalBalance: number; totalEmployee: number; totalEmployer: number; growth: number;
  firstYearEmployee: number; firstYearEmployer: number; yearsCapped: number;
}
/** Annual employee limit for someone who is `age` during the year. */
export function k401Limit(age: number, l: K401Limits): number {
  return l.deferral + (age >= 60 && age <= 63 ? l.catchUp6063 : age >= 50 ? l.catchUp50 : 0);
}
/**
 * Year by year from `age` up to (not including) `retireAge`. Employee contribution = salary × percent, capped at the limit.
 * Employer match = match% × min(employee contribution, matchCap% × salary). Contributions are made monthly and grow at return/12.
 * The limits are held at today's amounts (they are normally raised over time), and salary grows at the given rate.
 */
export function k401(i: K401Input): K401Result {
  const years = Math.max(0, Math.round(i.retireAge) - Math.round(i.age));
  const r = Math.max(0, i.returnPercent) / 1200;
  let bal = Math.max(0, i.balance), totalEmp = 0, totalEr = 0, capped = 0;
  const rows: K401Year[] = [];
  let firstEmp = 0, firstEr = 0;
  for (let k = 0; k < years; k++) {
    const age = Math.round(i.age) + k;
    const salary = Math.max(0, i.salary) * Math.pow(1 + i.salaryGrowthPercent / 100, k);
    const wanted = (salary * Math.max(0, i.employeePercent)) / 100;
    const limit = k401Limit(age, i.limits);
    const emp = Math.min(wanted, limit);
    if (wanted > limit) capped++;
    const er = (Math.max(0, i.matchPercent) / 100) * Math.min(emp, (salary * Math.max(0, i.matchCapPercent)) / 100);
    for (let m = 0; m < 12; m++) bal = bal * (1 + r) + (emp + er) / 12;
    totalEmp += emp; totalEr += er;
    if (k === 0) { firstEmp = emp; firstEr = er; }
    rows.push({ age: age + 1, employee: emp, employer: er, balance: bal });
  }
  const start = Math.max(0, i.balance);
  return { rows, years, finalBalance: bal, totalEmployee: totalEmp, totalEmployer: totalEr, growth: bal - start - totalEmp - totalEr, firstYearEmployee: firstEmp, firstYearEmployer: firstEr, yearsCapped: capped };
}

export interface RetirementInput {
  age: number; retireAge: number; planAge: number;
  savings: number; monthlyContribution: number;
  preReturnPercent: number; postReturnPercent: number; inflationPercent: number;
  incomeToday: number; // desired monthly income in today's dollars
  socialSecurityToday: number; // expected monthly benefit in today's dollars
}
export interface RetirementResult {
  yearsToRetire: number; retirementYears: number;
  balanceAtRetirement: number;
  annualGapAtRetirement: number; // first-year withdrawal after other income, in dollars of that year
  nestEggNeeded: number; shortfall: number; // shortfall > 0 means projected savings fall short
  extraMonthlyNeeded: number;
  lastsToAge: number | null; // null = lasts through the plan age
  path: { age: number; balance: number }[];
}
/**
 * Accumulation: monthly compounding at pre-return/12, contributions at month end (flat in nominal dollars).
 * Need: first-year withdrawal = (income − other income) × 12 × (1 + inflation)^years-to-retire, raised by inflation each year,
 * taken at the start of each year while the rest earns the post-retirement return.
 * Nest egg needed = sum of those withdrawals discounted at the post-retirement return, ρ = (1 + inflation)/(1 + return):
 * gap × (1 − ρ^T) ÷ (1 − ρ), or gap × T when ρ = 1.
 */
export function retirementPlan(i: RetirementInput): RetirementResult {
  const n = Math.max(0, Math.round(i.retireAge) - Math.round(i.age)) ;
  const T = Math.max(0, Math.round(i.planAge) - Math.round(i.retireAge));
  const r = Math.max(0, i.preReturnPercent) / 1200;
  const months = n * 12;
  const S = Math.max(0, i.savings), C = Math.max(0, i.monthlyContribution);
  const growth = Math.pow(1 + r, months);
  const balance = S * growth + (r === 0 ? C * months : (C * (growth - 1)) / r);

  const f = i.inflationPercent / 100, p = Math.max(-0.99, i.postReturnPercent / 100);
  const gap = Math.max(0, i.incomeToday - i.socialSecurityToday) * 12 * Math.pow(1 + f, n);
  const rho = (1 + f) / (1 + p);
  const need = T === 0 ? 0 : Math.abs(rho - 1) < 1e-12 ? gap * T : (gap * (1 - Math.pow(rho, T))) / (1 - rho);
  const shortfall = need - balance;
  const extra = shortfall <= 0 ? 0 : months === 0 ? shortfall : r === 0 ? shortfall / months : (shortfall * r) / (growth - 1);

  let lastsTo: number | null = null;
  let b = balance;
  const path = [{ age: Math.round(i.retireAge), balance }];
  for (let k = 0; k < T; k++) {
    const w = gap * Math.pow(1 + f, k);
    if (b < w) { lastsTo = Math.round(i.retireAge) + k + (w > 0 ? b / w : 0); b = 0; path.push({ age: Math.round(i.retireAge) + k + 1, balance: 0 }); break; }
    b = (b - w) * (1 + p);
    path.push({ age: Math.round(i.retireAge) + k + 1, balance: b });
  }
  return { yearsToRetire: n, retirementYears: T, balanceAtRetirement: balance, annualGapAtRetirement: gap, nestEggNeeded: need, shortfall, extraMonthlyNeeded: extra, lastsToAge: lastsTo, path };
}
