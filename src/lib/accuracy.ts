import { compoundInterest } from './calc/invest';
import { computeIndiaTax } from './calc/tax-india';
import { computePaycheck } from './calc/tax-us';
import { mortgage } from './calc/loan';
import { taxIndia } from '../config/tax-india';

/**
 * Accuracy checks: results from this site's own calculation code compared with figures published by official
 * bodies (or, where stated, a reproduction of an official document). tests/accuracy.test.ts runs every case,
 * and the Methodology page prints them. Add a case whenever you find another published worked example.
 */
export interface AccuracyCase {
  id: string;
  tool: string;
  title: string;
  source: { label: string; url: string; kind: 'official' | 'reproduction' };
  published: number;
  unit: 'usd' | 'inr' | 'pct';
  tolerance: number;
  ours: () => number;
  note?: string;
}

const CFPB_MORTGAGE = { label: 'CFPB: Your mortgage calculator may be setting you up for a surprise', url: 'https://consumerfinance.gov/about-us/blog/your-mortgage-calculator-may-be-setting-you-surprise', kind: 'official' as const };
const CFPB_COMPOUND = { label: 'CFPB: What is compound interest?', url: 'https://www.consumerfinance.gov/ask-cfpb/what-is-compound-interest-en-1683/', kind: 'official' as const };
const SSA = { label: 'SSA: 2026 Social Security fact sheet', url: 'https://www.ssa.gov/cola/factsheets/2026.html', kind: 'official' as const };
const BUDGET25 = { label: 'CBDT FAQ on Budget 2025 income-tax changes (copy published by StaffNews; original not located)', url: 'https://www.staffnews.in/?p=160111', kind: 'reproduction' as const };

/** Tax under the new regime before cess for a given TAXABLE income (published tables are stated on taxable income). */
const newRegimeTaxBeforeCess = (taxable: number) => {
  const r = computeIndiaTax({ grossAnnual: taxable + taxIndia.newRegime.standardDeduction, regime: 'new' });
  return r.slabTax - r.rebate + r.surcharge;
};
const budgetRow = (lakh: number, published: number): AccuracyCase => ({
  id: `in-budget25-${lakh}l`, tool: 'income-tax-calculator-india', title: `New-regime tax on taxable income of ₹${lakh} lakh (before cess)`,
  source: BUDGET25, published, unit: 'inr', tolerance: 0.5, ours: () => newRegimeTaxBeforeCess(lakh * 100000),
  note: 'The published table excludes cess and applies to taxable income.',
});

export const accuracyCases: AccuracyCase[] = [
  { id: 'cfpb-mortgage-4', tool: 'mortgage-calculator', title: '$200,000, 30-year fixed at 4%: monthly principal and interest', source: CFPB_MORTGAGE, published: 955, unit: 'usd', tolerance: 0.5, ours: () => mortgage({ homePrice: 200000, downPayment: 0, annualRatePercent: 4, years: 30 }).principalAndInterest, note: 'CFPB rounds to whole dollars.' },
  { id: 'cfpb-mortgage-5', tool: 'mortgage-calculator', title: '$200,000, 30-year fixed at 5%: monthly principal and interest', source: CFPB_MORTGAGE, published: 1074, unit: 'usd', tolerance: 0.5, ours: () => mortgage({ homePrice: 200000, downPayment: 0, annualRatePercent: 5, years: 30 }).principalAndInterest, note: 'CFPB rounds to whole dollars.' },
  { id: 'cfpb-compound-y1', tool: 'compound-interest-calculator', title: '$1,000 at 5% compounded yearly: balance after year 1', source: CFPB_COMPOUND, published: 1050, unit: 'usd', tolerance: 0.005, ours: () => compoundInterest(1000, 5, 1, 1).amount },
  { id: 'cfpb-compound-y2', tool: 'compound-interest-calculator', title: '$1,000 at 5% compounded yearly: balance after year 2', source: CFPB_COMPOUND, published: 1102.5, unit: 'usd', tolerance: 0.005, ours: () => compoundInterest(1000, 5, 2, 1).amount },
  { id: 'ssa-employee-rate', tool: 'paycheck-calculator', title: 'Employee Social Security + Medicare (FICA) on $100,000 at the published 7.65% rate', source: SSA, published: 7650, unit: 'usd', tolerance: 0.005, ours: () => computePaycheck({ grossAnnual: 100000, payPeriodsPerYear: 12, filing: 'single', stateCode: 'TX' }).fica },
  { id: 'ssa-wage-base', tool: 'paycheck-calculator', title: 'Social Security tax stops at the $184,500 taxable maximum (6.2% × $184,500)', source: SSA, published: 11439, unit: 'usd', tolerance: 0.005, ours: () => computePaycheck({ grossAnnual: 250000, payPeriodsPerYear: 12, filing: 'single', stateCode: 'TX' }).socialSecurity, note: 'SSA states the rate and the maximum; the dollar figure is their rate times their maximum.' },
  { id: 'in-budget25-12.75', tool: 'income-tax-calculator-india', title: 'Salaried income of ₹12.75 lakh pays no income tax in the new regime', source: BUDGET25, published: 0, unit: 'inr', tolerance: 0.5, ours: () => computeIndiaTax({ grossAnnual: 1275000, regime: 'new' }).totalTax },
  budgetRow(12, 0), budgetRow(16, 120000), budgetRow(18, 160000), budgetRow(20, 200000), budgetRow(24, 300000), budgetRow(25, 330000), budgetRow(50, 1080000),
];

export const runAccuracyCase = (c: AccuracyCase) => {
  const ours = c.ours();
  return { ours, pass: Math.abs(ours - c.published) <= c.tolerance };
};
