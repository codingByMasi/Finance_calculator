import { emi, refinance } from '../lib/calc/loan';
import { money, pct } from '../lib/format';
import { taxIndia } from './tax-india';
import { savingsIndia } from './savings-india';
import { retirementUS } from './retirement-us';

export interface GuideSection { heading: string; paragraphs: string[] }
export interface Guide {
  slug: string; title: string; description: string;
  published: string; updated: string;
  intro: string;
  sections: GuideSection[];
  /** calculator slugs to link at the end */
  tools: string[];
  /** external references (official where possible) */
  references: { label: string; url: string }[];
}

const inr = (n: number, d = 0) => money(n, 'INR', d);
const usd = (n: number, d = 0) => money(n, 'USD', d);

const e = emi(1_000_000, 9, 120);
const slabs = taxIndia.newRegime.slabs;
const rf = refinance({ balance: 300_000, currentRatePercent: 7, remainingMonths: 300, newRatePercent: 5.75, newMonths: 300, closingCosts: 6000, rollCostsIntoLoan: false });
const ppf = savingsIndia.ppf;
const L = retirementUS;

/**
 * Educational explainers. They describe how things work and point to calculators; they never tell a reader what to do.
 * Every figure comes from the same config files or calculation functions the calculators use, so the guides cannot drift.
 */
export const guides: Guide[] = [
  {
    slug: 'how-emi-is-calculated',
    title: 'How an EMI is calculated, step by step',
    description: 'What an equated monthly instalment is, the formula behind it, a worked example and how rate and tenure change the numbers.',
    published: '2026-11-13', updated: '2026-11-13',
    intro: 'An EMI looks like a single number on a loan offer, but it comes from a short formula. Knowing how it works makes it easier to read a loan quote and to see why small changes in rate or tenure matter.',
    sections: [
      { heading: 'What an EMI contains', paragraphs: [
        'An equated monthly instalment (EMI) is a fixed payment made every month until a loan is cleared. Each payment has two parts: interest on the balance still owed, and a repayment of part of the original amount, called the principal.',
        'Interest is charged on the outstanding balance, so it is highest in the first month and falls as the balance falls. Because the total payment stays the same, the principal share rises over time. In the early years most of an EMI is interest; near the end most of it is principal.' ] },
      { heading: 'The formula', paragraphs: [
        'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (the yearly rate divided by 12 and by 100) and n is the number of monthly payments.',
        `As an illustration, a loan of ${inr(1_000_000)} at 9% a year for 10 years has r = 0.0075 and n = 120. The formula gives an EMI of about ${inr(e.emi)}. Over 120 payments that adds up to about ${inr(e.totalPayment)}, of which about ${inr(e.totalInterest)} is interest. These figures are an example of the arithmetic, not a quote.` ] },
      { heading: 'Reducing balance and flat rate', paragraphs: [
        'Most bank loans quote a reducing-balance rate, where interest is charged on what is still owed. Some lenders quote a flat rate, where interest is charged on the original amount for the whole term. A flat rate and a reducing-balance rate with the same number are not equivalent: the flat rate corresponds to a considerably higher reducing-balance rate. The EMI formula above assumes a reducing-balance rate.' ] },
      { heading: 'What changes the EMI', paragraphs: [
        'Three inputs drive the result. A larger amount raises the EMI in proportion. A higher rate raises it, and the effect grows with the length of the loan. A longer tenure lowers the EMI but means interest is charged for more months, so the total interest is higher.',
        'The EMI calculator shows these effects together with a balance chart, and the loan comparison calculator lines up two sets of inputs. A lender may add processing fees, insurance or other charges that this arithmetic leaves out, and the final EMI on a sanction letter is the figure that applies.' ] },
    ],
    tools: ['emi-calculator', 'loan-comparison-calculator', 'auto-loan-calculator'],
    references: [],
  },
  {
    slug: 'fd-rd-ppf-how-they-differ',
    title: 'FD, RD and PPF: how they differ',
    description: 'A neutral comparison of how fixed deposits, recurring deposits and the Public Provident Fund work in India: deposits, interest and lock-ins.',
    published: '2026-11-13', updated: '2026-11-13',
    intro: 'Fixed deposits, recurring deposits and the Public Provident Fund are common savings products in India. They share the idea of a stated interest rate but differ in how money goes in, how interest is added and how long it stays.',
    sections: [
      { heading: 'Fixed deposit (FD)', paragraphs: [
        'An FD takes a lump sum for a chosen period and pays interest at a rate fixed when the deposit is made. Interest is often compounded quarterly, so the maturity amount is a little higher than simple interest at the same rate. Interest earned is generally taxable, and banks may deduct tax at source.' ] },
      { heading: 'Recurring deposit (RD)', paragraphs: [
        'An RD collects a fixed amount every month for a chosen number of months. Each instalment earns interest from the month it goes in, so early instalments earn for longer than later ones. It uses the same kind of fixed-rate arrangement as an FD, but the money arrives in instalments instead of one lump sum. Tax treatment of the interest is similar to an FD.' ] },
      { heading: 'Public Provident Fund (PPF)', paragraphs: [
        `PPF is a government-backed scheme with a ${ppf.lockInYears}-year term, yearly deposits between ${inr(ppf.minYearlyDeposit)} and ${inr(ppf.maxYearlyDeposit)}, and an interest rate that the Government resets every quarter. Interest is worked out monthly and credited once a year. A rate of ${pct(ppf.ratePercent)} has been reported for ${ppf.rateQuarterLabel}; this figure comes from press coverage and is marked as not yet confirmed on the PPF calculator page.`,
        'The tax treatment of PPF contributions and interest has depended on the tax regime and the rules in force, and rules change, so the current provisions are best read from official sources.' ] },
      { heading: 'Side by side', paragraphs: [
        'FD: one lump sum, a rate fixed at the start, interest usually compounded each quarter. RD: monthly instalments, a rate fixed at the start, interest compounded quarterly by many banks. PPF: yearly deposits within limits, a variable rate reset each quarter, a long fixed term.',
        'The FD, RD and PPF calculators on this site turn these descriptions into estimated figures for numbers you enter. The SIP calculator covers market-linked investing, which behaves differently: its returns are not stated in advance and can be negative.' ] },
    ],
    tools: ['fd-calculator', 'rd-calculator', 'ppf-calculator', 'sip-calculator'],
    references: [{ label: 'Press report on the October to December 2026 small-savings rates (secondary source)', url: savingsIndia.sourceUrls[0] }],
  },
  {
    slug: 'old-and-new-tax-regime-india-explained',
    title: 'Old and new income tax regimes in India: what differs',
    description: 'A factual outline of how the old and new personal tax regimes in India differ in slabs, deductions and rebate, with figures for FY 2025-26.',
    published: '2026-11-13', updated: '2026-11-13',
    intro: `India has two personal income tax regimes. This guide describes what each one allows. It does not say which regime produces less tax for any person, because that depends on income and on the deductions claimed. The figures below are for FY ${taxIndia.financialYear} (assessment year ${taxIndia.assessmentYear}), as shown on the Income Tax Department website.`,
    sections: [
      { heading: 'The new regime', paragraphs: [
        `The new regime has a higher tax-free threshold and lower slab rates, and it allows few deductions. Its slabs are in steps of ${inr(slabs[0].upTo)}: ${slabs.map((s, i) => (Number.isFinite(s.upTo) ? `up to ${inr(s.upTo)} at ${pct(s.rate * 100, 0)}` : `above ${inr(slabs[i - 1].upTo)} at ${pct(s.rate * 100, 0)}`)).join(', ')}. A standard deduction of ${inr(taxIndia.newRegime.standardDeduction)} for salaried taxpayers is allowed, and a section 87A rebate of up to ${inr(taxIndia.newRegime.rebate.maxRebate)} applies where taxable income is up to ${inr(taxIndia.newRegime.rebate.maxTaxableIncome)}.` ] },
      { heading: 'The old regime', paragraphs: [
        `The old regime has lower thresholds and more bands, and it allows a wider set of deductions and exemptions. Examples include section 80C (up to ${inr(taxIndia.oldRegime.deduction80CLimit)}), certain insurance and home-loan items, and house rent allowance. The standard deduction is ${inr(taxIndia.oldRegime.standardDeduction)}, and the section 87A rebate is up to ${inr(taxIndia.oldRegime.rebate.maxRebate)} for taxable income up to ${inr(taxIndia.oldRegime.rebate.maxTaxableIncome)}.` ] },
      { heading: 'Why the comparison varies', paragraphs: [
        'In many cases the higher threshold of the new regime and lower slab rates produce less tax when few deductions are claimed, and the old-regime figure falls as more deductions are claimed. Where the two cross over depends on the numbers, so it varies from person to person.',
        'The salary-after-tax calculator computes both regimes for the numbers you enter and shows the difference in estimated yearly tax. The HRA calculator estimates one common old-regime exemption.' ] },
      { heading: 'What this site does not cover', paragraphs: [
        `Surcharge marginal relief, employer-specific allowances, capital gains, and rules for specific categories of taxpayers are not modelled. Figures for FY ${taxIndia.laterYear.financialYear} are not yet confirmed from the Finance Act text, so the calculator does not present them as confirmed. A qualified tax professional or the Income Tax Department can confirm how the rules apply in a particular case.` ] },
    ],
    tools: ['income-tax-calculator-india', 'hra-calculator', 'ppf-calculator'],
    references: taxIndia.sourceUrls.slice(0, 2).map((u, i) => ({ label: i === 0 ? 'Income Tax Department: tax rates' : 'Income Tax Department: threshold limits', url: u })),
  },
  {
    slug: '401k-contribution-limits-explained',
    title: '401(k) contribution limits and employer match, explained',
    description: `How the ${L.planYear} 401(k) limits, catch-up contributions and employer matching work, with the IRS figures.`,
    published: '2026-11-13', updated: '2026-11-13',
    intro: 'A 401(k) is a workplace retirement plan in the United States. This guide describes how the contribution limits and an employer match work. It is general information, and a plan\'s own documents set the details that apply to a particular employee.',
    sections: [
      { heading: `The ${L.planYear} limits`, paragraphs: [
        `According to the IRS, the employee contribution limit for ${L.planYear} is ${usd(L.deferralLimit)}. People aged 50 and over can contribute an additional ${usd(L.catchUp50)}. For ages 60 to 63 the catch-up amount is ${usd(L.catchUp6063)} instead. The IRA limit is ${usd(L.iraLimit)}. The IRS adjusts these figures from time to time.` ] },
      { heading: 'How an employer match works', paragraphs: [
        'A match is a percentage of what the employee contributes, up to a share of salary. For example, a plan might add 50 cents for every dollar contributed, up to 6% of pay. On a salary of $85,000 that structure would add up to $2,550 a year (50% of 6% of $85,000). Plans differ, and some match only after a waiting period or on a vesting schedule.' ] },
      { heading: 'Why long periods matter in a projection', paragraphs: [
        'A projected balance depends on four things: how much goes in, how long it stays, the return assumed and the match. Because returns compound, the same contribution produces a larger figure over a longer period. Projections use an assumed return, which is not a forecast, and actual returns vary and can be negative.' ] },
      { heading: 'What the calculators leave out', paragraphs: [
        'The 401(k) calculator on this site does not model taxes, fees, vesting, Roth or traditional treatment, or future changes in the limits. The retirement calculator compares a projected balance with the savings a chosen income would require, using assumptions you enter.' ] },
    ],
    tools: ['401k-calculator', 'retirement-calculator', 'compound-interest-calculator'],
    references: [{ label: 'IRS: 401(k) limit increases for 2026', url: L.sourceUrls[0] }],
  },
  {
    slug: 'mortgage-refinance-break-even-explained',
    title: 'Mortgage refinancing: how the break-even point works',
    description: 'How to read a refinance comparison: payment difference, closing costs, break-even months and why total cost can rise when the payment falls.',
    published: '2026-11-13', updated: '2026-11-13',
    intro: 'Refinancing replaces one loan with another. This guide explains the measures a refinance comparison reports and how they relate, using one worked example. It does not suggest that refinancing suits any particular borrower.',
    sections: [
      { heading: 'Two different questions', paragraphs: [
        'A refinance comparison answers two questions that can have different answers. The first is whether the monthly payment changes. The second is whether the total paid over the remaining life of the loans changes. A longer new term can lower the monthly payment and still raise the total cost, because interest is charged for more months.' ] },
      { heading: 'A worked example', paragraphs: [
        `Take a balance of ${usd(300_000)} at 7% with 25 years left. Principal-and-interest payments are about ${usd(rf.currentPayment, 2)} a month. A new 25-year loan at 5.75% would be about ${usd(rf.newPayment, 2)} a month, a difference of about ${usd(rf.monthlySavings, 2)}. With ${usd(6000)} of closing costs paid up front, covering those costs from the monthly difference takes about ${rf.breakEvenMonths} months, which is the break-even point. These numbers illustrate the arithmetic and are not a quote.` ] },
      { heading: 'Closing costs: up front or added to the loan', paragraphs: [
        'Closing costs can be paid at closing or added to the new balance. Adding them removes the upfront payment but increases the balance and the interest charged on it, and it makes a break-even in months less meaningful, since nothing is paid up front.' ] },
      { heading: 'What is left out', paragraphs: [
        'Taxes, insurance and escrow are not part of the comparison. Neither are rate changes before closing, prepayment penalties on the old loan or how long a homeowner expects to keep the property. A loan estimate from a lender sets out the actual terms and costs.' ] },
    ],
    tools: ['mortgage-refinance-calculator', 'mortgage-calculator', 'loan-comparison-calculator'],
    references: [],
  },
];

export const guideBySlug = (slug: string): Guide | undefined => guides.find((g) => g.slug === slug);
