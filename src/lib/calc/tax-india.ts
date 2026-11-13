import { taxIndia, type Slab, type TaxIndiaConfig } from '../../config/tax-india';

export type Regime = 'new' | 'old';
export interface IndiaTaxInput {
  grossAnnual: number;
  regime: Regime;
  deduction80C?: number; // old regime only
  otherDeductions?: number; // 80D, NPS 80CCD(1B), home-loan interest etc. (old regime only)
  hraExemption?: number; // old regime only
}
export interface SlabLine { from: number; to: number; rate: number; taxable: number; tax: number }
export interface IndiaTaxResult {
  regime: Regime;
  gross: number;
  standardDeduction: number;
  otherDeductions: number;
  taxableIncome: number;
  slabTax: number;
  slabLines: SlabLine[];
  rebate: number;
  surchargeRate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  netAnnual: number;
  netMonthly: number;
  effectiveRate: number; // % of gross
}

export function slabTax(income: number, slabs: Slab[]): { total: number; lines: SlabLine[] } {
  let prev = 0, total = 0;
  const lines: SlabLine[] = [];
  const inc = Math.max(0, income);
  for (const s of slabs) {
    if (inc > prev) {
      const taxable = Math.min(inc, s.upTo) - prev;
      const tax = taxable * s.rate;
      total += tax;
      lines.push({ from: prev, to: s.upTo, rate: s.rate, taxable, tax });
    }
    prev = s.upTo;
    if (inc <= s.upTo) break;
  }
  return { total, lines };
}

export function computeIndiaTax(input: IndiaTaxInput, cfg: TaxIndiaConfig = taxIndia): IndiaTaxResult {
  const gross = Math.max(0, input.grossAnnual);
  const r = input.regime === 'new' ? cfg.newRegime : cfg.oldRegime;
  const std = Math.min(gross, r.standardDeduction);
  let other = 0;
  if (input.regime === 'old') {
    const c80 = Math.min(Math.max(0, input.deduction80C ?? 0), cfg.oldRegime.deduction80CLimit);
    other = c80 + Math.max(0, input.otherDeductions ?? 0) + Math.max(0, input.hraExemption ?? 0);
  }
  const taxable = Math.max(0, gross - std - other);
  const { total: base, lines } = slabTax(taxable, r.slabs);

  let afterRebate = base;
  if (taxable <= r.rebate.maxTaxableIncome) afterRebate = Math.max(0, base - r.rebate.maxRebate);
  else if (r.rebate.marginalRelief) afterRebate = Math.min(base, taxable - r.rebate.maxTaxableIncome);
  const rebate = base - afterRebate;

  let surchargeRate = 0;
  for (const b of r.surcharge) if (taxable > b.above) surchargeRate = b.rate;
  const surcharge = afterRebate * surchargeRate;
  const cess = (afterRebate + surcharge) * cfg.cess;
  const totalTax = afterRebate + surcharge + cess;
  const net = gross - totalTax;
  return {
    regime: input.regime, gross, standardDeduction: std, otherDeductions: other, taxableIncome: taxable,
    slabTax: base, slabLines: lines, rebate, surchargeRate, surcharge, cess, totalTax,
    netAnnual: net, netMonthly: net / 12, effectiveRate: gross === 0 ? 0 : (totalTax / gross) * 100,
  };
}
