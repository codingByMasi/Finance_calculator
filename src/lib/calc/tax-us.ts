import { taxUS, stateTaxes, type Bracket, type FilingStatus, type StateTax } from '../../config/tax-us';

export type { FilingStatus };
export interface BracketLine { from: number; to: number; rate: number; taxable: number; tax: number }

export function bracketTax(income: number, brackets: Bracket[]): { total: number; lines: BracketLine[] } {
  let prev = 0, total = 0;
  const lines: BracketLine[] = [];
  const inc = Math.max(0, income);
  for (const b of brackets) {
    if (inc > prev) {
      const taxable = Math.min(inc, b.upTo) - prev;
      const tax = taxable * b.rate;
      total += tax;
      lines.push({ from: prev, to: b.upTo, rate: b.rate, taxable, tax });
    }
    prev = b.upTo;
    if (inc <= b.upTo) break;
  }
  return { total, lines };
}

export interface StateTaxResult { taxable: number; deduction: number; credits: number; taxBeforeCredits: number; tax: number }

/** State income tax on wages from the schedule in the config. HoH uses the single schedule. */
export function computeStateTax(st: StateTax, filing: FilingStatus, wagesAfterPreTax: number): StateTaxResult {
  if (st.kind === 'none') return { taxable: 0, deduction: 0, credits: 0, taxBeforeCredits: 0, tax: 0 };
  const col = filing === 'married' ? 'married' : 'single';
  const std = st.standardDeduction[col];
  const pe = st.exemption[col];
  const deduction = (st.stdAsCredit ? 0 : std) + (st.exemption.type === 'deduction' ? pe : 0);
  const credits = (st.stdAsCredit ? std : 0) + (st.exemption.type === 'credit' ? pe : 0);
  const taxable = Math.max(0, wagesAfterPreTax - deduction);
  const before = bracketTax(taxable, st.brackets[col]).total;
  return { taxable, deduction, credits, taxBeforeCredits: before, tax: Math.max(0, before - credits) };
}

export interface PaycheckInput {
  grossAnnual: number;
  payPeriodsPerYear: number;
  filing: FilingStatus;
  stateCode: string;
  preTaxAnnual?: number; // 401(k), HSA, etc.: reduces income tax, not FICA
}
export interface PaycheckResult {
  gross: number;
  preTax: number;
  standardDeduction: number;
  federalTaxable: number;
  federalLines: BracketLine[];
  federal: number;
  socialSecurity: number;
  medicare: number;
  additionalMedicare: number;
  fica: number;
  stateName: string;
  stateRate: number; // effective state rate on gross wages
  stateDetail: StateTaxResult;
  stateNote?: string;
  state: number;
  totalTax: number;
  netAnnual: number;
  netPerPeriod: number;
  grossPerPeriod: number;
  periods: number;
  effectiveRate: number;
}

export function computePaycheck(i: PaycheckInput): PaycheckResult {
  const gross = Math.max(0, i.grossAnnual);
  const periods = Math.max(1, Math.round(i.payPeriodsPerYear));
  const preTax = Math.min(gross, Math.max(0, i.preTaxAnnual ?? 0));
  const std = taxUS.standardDeduction[i.filing];
  const fedTaxable = Math.max(0, gross - preTax - std);
  const { total: federal, lines } = bracketTax(fedTaxable, taxUS.brackets[i.filing]);
  const f = taxUS.fica;
  const socialSecurity = Math.min(gross, f.socialSecurityWageBase) * f.socialSecurityRate;
  const medicare = gross * f.medicareRate;
  const additionalMedicare = Math.max(0, gross - f.additionalMedicareThreshold) * f.additionalMedicareRate;
  const st = stateTaxes.find((s) => s.code === i.stateCode) ?? stateTaxes[0];
  const stateDetail = computeStateTax(st, i.filing, Math.max(0, gross - preTax));
  const state = stateDetail.tax;
  const fica = socialSecurity + medicare + additionalMedicare;
  const totalTax = federal + fica + state;
  const net = gross - preTax - totalTax;
  return {
    gross, preTax, standardDeduction: std, federalTaxable: fedTaxable, federalLines: lines, federal,
    socialSecurity, medicare, additionalMedicare, fica,
    stateName: st.name, stateRate: gross === 0 ? 0 : state / gross, stateDetail, stateNote: st.note, state,
    totalTax, netAnnual: net, netPerPeriod: net / periods, grossPerPeriod: gross / periods, periods,
    effectiveRate: gross === 0 ? 0 : (totalTax / gross) * 100,
  };
}
