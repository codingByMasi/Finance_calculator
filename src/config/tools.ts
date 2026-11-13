import type { CategorySlug } from './site';
import { extraTools } from './tools-extra';

export type Country = 'in' | 'us' | 'both';
export interface Faq { q: string; a: string }
export interface Tool {
  slug: string;
  title: string; // H1 and <title> base
  shortTitle: string; // nav / cards
  country: Country;
  category: CategorySlug;
  description: string; // meta description (<=160 chars) and card text
  about: string[]; // original explanatory copy (paragraphs)
  formula: string; // plain-text formula(s) shown in "How it works"
  assumptions: string[];
  faq: Faq[]; // exactly 5
  related: string[]; // slugs
}

/** Single source of truth: drives nav, category pages, country pages, sitemap, JSON-LD and related-tool blocks. */
const baseTools: Tool[] = [
  {
    slug: 'emi-calculator', title: 'EMI Calculator for Home, Car and Personal Loans', shortTitle: 'EMI Calculator', country: 'in', category: 'loans',
    description: 'Estimate your monthly EMI, total interest and total payment for a home, car or personal loan in India, with a year-by-year balance chart.',
    about: [
      'An EMI, or equated monthly instalment, is the fixed amount you pay your lender every month until a loan is cleared. Each instalment covers two things: the interest charged on the balance still owed, and a slice of the original principal. Early in the loan most of the EMI is interest; towards the end almost all of it is principal.',
      'This calculator takes three inputs, the loan amount, the yearly interest rate and the tenure, and returns the EMI, the total interest you will pay over the life of the loan and the total amount repaid. The chart shows how the outstanding balance falls year by year, which makes it easy to see why a longer tenure lowers the EMI but raises the total interest.',
      'Use the loan-type menu to start from typical example values for a home, car or personal loan, then replace them with the numbers on your sanction letter. Try a few tenures and rates side by side before you commit: a half-point difference in rate on a 20-year home loan can change the total cost by several lakh rupees.',
    ],
    formula: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)\nP = loan amount, r = monthly interest rate (annual rate ÷ 12 ÷ 100), n = number of monthly instalments.',
    assumptions: ['Fixed interest rate for the whole tenure (floating-rate loans change).', 'Instalments are paid monthly, at the end of each month, with no processing fees, insurance or prepayments.', 'Rounding by your lender may differ by a few rupees.'],
    faq: [
      { q: 'How is EMI calculated?', a: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the principal, r the monthly interest rate and n the number of months. The worked example on this page shows each step with real numbers.' },
      { q: 'Does a longer tenure save money?', a: 'It lowers the monthly EMI but increases the total interest, because you owe money for longer. A shorter tenure raises the EMI but lowers the total interest; the loan comparison calculator shows both side by side.' },
      { q: 'What happens if the interest rate is 0%?', a: 'With a zero rate the EMI is simply the loan amount divided by the number of months, and total interest is zero.' },
      { q: 'Does this include processing fees or insurance?', a: 'No. Processing fees, GST on fees and loan insurance are extra costs. Add them separately to judge the true cost of a loan.' },
      { q: 'Can I use it for a floating-rate loan?', a: 'Yes, as an estimate at today\'s rate. If your rate changes, rerun the calculation with the new rate and the remaining tenure.' },
    ],
    related: ['loan-comparison-calculator', 'sip-calculator', 'compound-interest-calculator'],
  },
  {
    slug: 'sip-calculator', title: 'SIP and Lumpsum Returns Calculator', shortTitle: 'SIP & Lumpsum Calculator', country: 'in', category: 'investing',
    description: 'Estimate the future value of a monthly SIP or a one-time lumpsum investment in India, with invested amount, gain and a growth chart.',
    about: [
      'A systematic investment plan, or SIP, invests a fixed amount every month, usually in a mutual fund. Because you buy regularly, you do not need to time the market, and your money starts compounding from the first instalment. A lumpsum investment puts the whole amount to work on day one.',
      'Pick SIP or lumpsum, enter the amount, an expected yearly return and the number of years, and the calculator shows the estimated future value, the amount you put in and the gain. The chart plots invested money against projected value so you can see compounding speed up in later years.',
      'The return you enter is an assumption, not a promise. Equity returns swing from year to year, so it helps to run a cautious case, a middle case and an optimistic case. Doubling the investment period usually matters far more than a small change in the monthly amount, which is why starting early is the main lever.',
    ],
    formula: 'SIP: FV = P × (((1 + r)^n − 1) ÷ r) × (1 + r)\nP = monthly amount, r = monthly return (annual ÷ 12 ÷ 100), n = number of months.\nLumpsum: FV = P × (1 + R)^t, with R the annual return and t in years.',
    assumptions: ['Constant return every year; real markets are volatile.', 'SIP instalments are made at the start of each month.', 'Taxes, exit loads and expense ratios are not deducted.'],
    faq: [
      { q: 'What return should I enter?', a: 'There is no guaranteed figure. Many people test 8%, 10% and 12% a year for equity funds and lower figures for debt funds. Use conservative numbers when planning goals.' },
      { q: 'SIP or lumpsum: which is better?', a: 'If you have a large sum now, a lumpsum has more time to grow in rising markets, but a SIP spreads the entry price over time. The outcome depends on cash flow, timing and risk tolerance, and neither approach is certain to do better.' },
      { q: 'Why is the SIP formula multiplied by (1 + r)?', a: 'It assumes each instalment is invested at the start of the month, so every payment earns one extra month of growth compared with paying at month end.' },
      { q: 'Does the calculator include tax?', a: 'No. Capital gains tax rules change and depend on the asset type and holding period, so subtract the tax that applies to you from the gain shown.' },
      { q: 'What if I set the return to 0%?', a: 'The future value then equals the total amount invested: monthly amount multiplied by the number of months.' },
    ],
    related: ['compound-interest-calculator', 'savings-goal-calculator', 'emi-calculator'],
  },
  {
    slug: 'gst-calculator', title: 'GST Calculator: Add or Remove GST', shortTitle: 'GST Calculator', country: 'in', category: 'shopping',
    description: 'Estimate the GST on a price, or the base price in a GST-inclusive amount, with a CGST and SGST split. Free GST calculator for India.',
    about: [
      'Goods and Services Tax is collected on most sales in India and is charged as a percentage of the pre-tax price. Shopkeepers, freelancers and small businesses often need to go in both directions: add GST to a quote, or work backwards from a bill that already includes it.',
      'Choose Add GST to turn a pre-tax price into a total, or Remove GST to split a GST-inclusive amount into the base price and tax. Select the rate that applies to your item and the calculator shows the GST amount, the CGST and SGST halves for an intra-state sale, and the final price.',
      'Remember that removing GST is not the same as subtracting the percentage. Taking 18% off ₹11,800 would give ₹9,676, but the correct pre-GST price is ₹10,000, because the 18% was added on top of the base. The calculator divides by (1 + rate) to avoid this common mistake.',
    ],
    formula: 'Add GST: total = price × (1 + rate ÷ 100)\nRemove GST: price = total ÷ (1 + rate ÷ 100)\nGST amount = total − price. For intra-state sales CGST = SGST = GST ÷ 2.',
    assumptions: ['Rates offered are the post-September-2025 slabs (Nil, 5%, 18%, 40%); special rates such as gold and some compensation-cess goods are not included. Confirm your item\'s rate on the official GST portal.', 'Cess, TCS and inter-state IGST treatment are not modelled.'],
    faq: [
      { q: 'How do I remove GST from a total?', a: 'Divide the GST-inclusive price by (1 + rate ÷ 100). For ₹1,180 at 18% that gives ₹1,000, so the GST is ₹180.' },
      { q: 'What is the difference between CGST, SGST and IGST?', a: 'For sales within a state the tax is split equally between central (CGST) and state (SGST) governments. For sales between states a single IGST equal to the full rate applies.' },
      { q: 'Which GST rate applies to my product?', a: 'It depends on the HSN or SAC code of the item. Check the current rate schedule on the official GST portal or ask your accountant.' },
      { q: 'Is GST charged on the discounted price?', a: 'Generally GST is levied on the transaction value after trade discounts shown on the invoice. Confirm edge cases with a tax professional.' },
      { q: 'Can I use this for invoices?', a: 'It is a quick estimator. For legal invoices use accounting software that follows current GST rules and rounding.' },
    ],
    related: ['discount-calculator', 'sales-tax-calculator', 'income-tax-calculator-india'],
  },
  {
    slug: 'income-tax-calculator-india', title: 'Salary After Income Tax Calculator (New vs Old Regime)', shortTitle: 'Salary After Tax (India)', country: 'in', category: 'tax-salary',
    description: 'Compare estimated income tax under the new and old regimes in India, with approximate annual and monthly take-home pay after rebate and cess.',
    about: [
      'Indian salaried taxpayers can choose between the new tax regime, with lower slab rates and few deductions, and the old regime, with higher slab rates but deductions such as Section 80C, 80D and HRA. Which one leaves more money in your pocket depends on how much you actually claim.',
      'Enter your annual gross salary and the deductions you expect to claim under the old regime. The calculator works out taxable income under both regimes, applies the slab rates, the Section 87A rebate, any surcharge and the 4% health and education cess, and then tells you which regime gives the lower tax and by how much.',
      'All rates, thresholds and deduction limits come from a configuration file that records its source and last-updated date, so they can be refreshed without touching the calculator. Always check the figures against the Income Tax Department before filing. The tool does not cover capital gains, perquisites, employee PF or advance tax timing.',
    ],
    formula: 'Taxable income = gross salary − standard deduction − (old regime only) 80C + other deductions + HRA exemption\nSlab tax = sum over slabs of (income in slab × slab rate)\nTax after rebate and surcharge × (1 + 4% cess) = total tax\nTake-home = gross − total tax.',
    assumptions: ['Resident individual under 60 with salary income only.', 'Rates and limits are those in src/config/tax-india.ts; some are flagged for verification there.', 'Surcharge marginal relief and employee PF are not modelled.'],
    faq: [
      { q: 'Which regime is better for me?', a: 'The calculator compares both on your numbers. As a rule, the old regime tends to win when your claimable deductions (80C, 80D, HRA, home-loan interest) are large relative to your income.' },
      { q: 'What is the Section 87A rebate?', a: 'A rebate that can bring the tax to nil when taxable income is within the limit set for the regime. Limits are listed in the tax config, and marginal relief applies just above the new-regime limit.' },
      { q: 'What is health and education cess?', a: 'A 4% levy added on top of income tax (plus any surcharge) in both regimes.' },
      { q: 'Does this include standard deduction?', a: 'Yes. A flat standard deduction for salaried people is applied under both regimes, at the amounts in the tax config.' },
      { q: 'How current are the tax figures?', a: 'The page shows the date the config was last updated. Treat the output as an estimate and confirm with the official tax calculator or a professional.' },
    ],
    related: ['gst-calculator', 'sip-calculator', 'emi-calculator'],
  },
  {
    slug: 'mortgage-calculator', title: 'Mortgage Payment Calculator with Taxes and Insurance', shortTitle: 'Mortgage Calculator', country: 'us', category: 'loans',
    description: 'Estimate your monthly US mortgage payment, including principal, interest, property tax, home insurance and HOA, plus total interest paid.',
    about: [
      'Your monthly mortgage payment is more than the loan repayment. Lenders usually collect property tax and homeowners insurance with it, and some neighborhoods add HOA dues. Looking only at principal and interest can make a house look hundreds of dollars a month cheaper than it really is.',
      'Enter the home price, your down payment, the interest rate and the loan term. Optionally add yearly property tax, yearly insurance and monthly HOA dues. The calculator returns the principal-and-interest payment, the full monthly total, the loan amount and the total interest you would pay over the term, with a chart of what each dollar of the payment covers.',
      'Compare a 15-year and a 30-year term to see the trade-off: a shorter loan has a bigger monthly payment but can save tens of thousands in interest. Also try a larger down payment. If you put down less than 20%, your lender will likely require private mortgage insurance, which this estimate does not include.',
    ],
    formula: 'Loan = price − down payment\nP&I = L × r × (1 + r)^n ÷ ((1 + r)^n − 1), r = annual rate ÷ 12 ÷ 100, n = years × 12\nMonthly total = P&I + property tax ÷ 12 + insurance ÷ 12 + HOA.',
    assumptions: ['Fixed-rate loan with monthly payments.', 'PMI, closing costs, points and maintenance are not included.', 'Property tax and insurance stay constant; in reality they change yearly.'],
    faq: [
      { q: 'What is included in the payment shown?', a: 'Principal, interest, property tax, homeowners insurance and any HOA dues you enter. PMI is not included.' },
      { q: 'How much should I put down?', a: 'Twenty percent avoids PMI on most conventional loans, but many buyers put down less. Run both scenarios here to see the monthly difference.' },
      { q: 'How do I find my property tax?', a: 'Look up the home\'s county assessor record or listing. Annual property tax is often between 0.5% and 2.5% of the home price depending on location.' },
      { q: 'Is a 15-year or 30-year mortgage better?', a: 'The 15-year costs more per month but far less interest overall. The 30-year is easier on cash flow. Compare the "total interest" row for each.' },
      { q: 'What if the rate is 0%?', a: 'The principal-and-interest payment becomes the loan divided by the number of months.' },
    ],
    related: ['loan-comparison-calculator', 'paycheck-calculator', 'savings-goal-calculator'],
  },
  {
    slug: 'paycheck-calculator', title: 'Paycheck and Take-Home Pay Calculator by State', shortTitle: 'Paycheck Calculator', country: 'us', category: 'tax-salary',
    description: 'Estimate your approximate US take-home pay after federal income tax, Social Security, Medicare and state tax, by state and pay frequency.',
    about: [
      'Your gross salary and the amount that lands in your bank account can differ by 20 to 35 percent. Federal income tax, Social Security and Medicare (together called FICA) come out of every paycheck, and most states take their own share on top.',
      'Enter your annual salary, how often you are paid, your filing status and your state. If you contribute to a 401(k) or HSA, enter the yearly amount: those contributions lower your income tax but not your FICA tax. The calculator shows what you keep per paycheck, per month and per year, plus a chart of where each dollar goes.',
      'Federal tax uses the standard deduction and the progressive brackets recorded in the site\'s tax configuration, which lists its IRS source and last-updated date. State tax uses each state\'s 2026 bracket schedule with its standard deduction and personal exemption or credit, but not local taxes or payroll programs such as SDI, so use it for planning rather than for filing. States with no wage income tax, such as Texas and Florida, show a zero.',
    ],
    formula: 'Federal taxable = gross − pre-tax contributions − standard deduction; tax = sum of bracket amounts\nSocial Security = 6.2% up to the wage base; Medicare = 1.45% (+0.9% over the threshold)\nNet = gross − pre-tax − federal − FICA − state.',
    assumptions: ['Wage income only, standard deduction, no credits or other withholding.', 'State schedules are from a secondary 2026 compilation (see the config); local taxes, state payroll programs and dependants are excluded.', 'Rates come from src/config/tax-us.ts.'],
    faq: [
      { q: 'Why is my real paycheck different?', a: 'Employers withhold using your W-4, health premiums, local taxes and state disability programs. This tool estimates the tax liability, not the exact withholding.' },
      { q: 'What is FICA?', a: 'The payroll taxes for Social Security (6.2% up to an annual wage base) and Medicare (1.45%, with an extra 0.9% on high earnings).' },
      { q: 'Do 401(k) contributions reduce taxes?', a: 'Traditional 401(k) and HSA contributions reduce federal and most state income tax, but not Social Security and Medicare tax.' },
      { q: 'Which states have no income tax?', a: 'Alaska, Florida, Nevada, New Hampshire (on wages), South Dakota, Tennessee, Texas, Washington and Wyoming do not tax wage income.' },
      { q: 'How accurate is the state tax?', a: 'It applies the state\'s 2026 bracket schedule, standard deduction and personal exemption or credit to your wages. It leaves out local taxes, state payroll programs and dependants, so the result can differ from your actual withholding.' },
    ],
    related: ['hourly-to-salary-calculator', 'mortgage-calculator', 'sales-tax-calculator'],
  },
  {
    slug: 'sales-tax-calculator', title: 'Sales Tax Calculator', shortTitle: 'Sales Tax Calculator', country: 'us', category: 'shopping',
    description: 'Estimate sales tax on a price, or the pre-tax price from a total, with a clear breakdown. Rates vary by location, so enter your local rate.',
    about: [
      'US sales tax is added at the register and varies by state, county and city. The sticker price is rarely what you pay, so it helps to know the real total before you buy, or to back out the tax from a receipt.',
      'Enter the amount and your combined sales tax rate. Choose Add sales tax to get the total, or Find the price before tax to work backwards from a tax-inclusive total. The results show the pre-tax price, the tax amount and the total, with a simple chart of how much of the total is tax.',
      'The rate you need is the sum of every layer that applies where you shop: state, county and any city or district tax. Your state revenue department publishes rate tables. Some items, such as groceries or clothing in certain states, are exempt or taxed at a reduced rate, so check the rule for what you are buying.',
    ],
    formula: 'Tax = price × rate ÷ 100\nTotal = price + tax = price × (1 + rate ÷ 100)\nPrice before tax = total ÷ (1 + rate ÷ 100).',
    assumptions: ['One combined rate applies to the whole amount.', 'Exemptions, tax holidays and use tax are not modelled.'],
    faq: [
      { q: 'How do I find my sales tax rate?', a: 'Search your state revenue department website for a rate lookup, or check a recent receipt from a local store. Add state, county and city rates together.' },
      { q: 'How do I take sales tax out of a total?', a: 'Divide the total by (1 + rate ÷ 100). For $108.25 at 8.25% that gives $100.00.' },
      { q: 'Is sales tax charged on shipping?', a: 'It depends on the state. Some states tax shipping and some only tax it when it is bundled with a taxable sale.' },
      { q: 'Do all states have sales tax?', a: 'No. Delaware, Montana, New Hampshire and Oregon have no statewide sales tax, and Alaska has no state tax but allows local sales taxes in many towns.' },
      { q: 'Can I use it for online purchases?', a: 'Yes, if you know the combined rate for the delivery address. Most large online sellers collect tax automatically.' },
    ],
    related: ['discount-calculator', 'paycheck-calculator', 'gst-calculator'],
  },
  {
    slug: 'hourly-to-salary-calculator', title: 'Hourly to Salary Calculator', shortTitle: 'Hourly to Salary', country: 'us', category: 'tax-salary',
    description: 'Estimate annual, monthly, biweekly, weekly and daily pay from an hourly wage, with adjustable hours per week and unpaid time off.',
    about: [
      'Job offers are often quoted as an hourly wage, while budgets and loan applications use annual or monthly income. Converting between them sounds trivial, but small assumptions about hours and time off change the answer by thousands of dollars.',
      'Enter your hourly rate, the hours you work in a typical week and the weeks you work in a year. If some of your time off is unpaid, enter those weeks separately so they are removed from the total. The calculator shows annual, monthly, biweekly, weekly and daily gross pay and the hours worked in the year.',
      'The standard shortcut is hourly rate × 2,080, which assumes 40 hours for 52 paid weeks. That is a good fit for full-time employees with paid vacation. Contractors and seasonal workers should reduce the weeks to match reality. Remember the result is gross pay; the paycheck calculator estimates what you take home after taxes.',
    ],
    formula: 'Paid weeks = weeks worked − unpaid weeks off\nAnnual = hourly rate × hours per week × paid weeks\nMonthly = annual ÷ 12, biweekly = annual ÷ 26, weekly = rate × hours per week.',
    assumptions: ['Gross pay before taxes and deductions.', 'No overtime premium is applied.', 'Daily pay assumes a five-day week.'],
    faq: [
      { q: 'How do I convert hourly to salary?', a: 'Multiply the hourly rate by hours per week and by weeks per year. At $25 an hour, 40 hours and 52 weeks, that is $52,000.' },
      { q: 'Why 2,080 hours?', a: '40 hours × 52 weeks = 2,080. It is the common basis for full-time annual salary conversion.' },
      { q: 'How do I account for unpaid vacation?', a: 'Enter the unpaid weeks in the "Unpaid weeks off" field so they are subtracted from paid weeks.' },
      { q: 'Does this include overtime?', a: 'No. Add expected overtime separately at your overtime rate, usually 1.5 times the hourly rate.' },
      { q: 'Is this before or after tax?', a: 'Before tax. Use the paycheck calculator to estimate take-home pay.' },
    ],
    related: ['paycheck-calculator', 'savings-goal-calculator', 'mortgage-calculator'],
  },
  {
    slug: 'compound-interest-calculator', title: 'Compound Interest Calculator', shortTitle: 'Compound Interest', country: 'both', category: 'investing',
    description: 'Estimate how a balance could grow with compound interest at yearly, monthly or daily compounding, with a year-by-year growth chart.',
    about: [
      'Compound interest means you earn interest on your interest. Each period the interest is added to the balance, and the next period\'s interest is calculated on the larger amount. Over short periods the effect is small; over decades it becomes the main driver of growth.',
      'Enter a starting amount, a yearly interest rate, the number of years and how often interest compounds. The calculator returns the final amount, the interest earned and the growth multiple, and plots the balance year by year. Switch the currency between US dollars and Indian rupees to see familiar number formatting.',
      'Compounding frequency matters less than most people expect. At 6% for 15 years, monthly compounding ends only slightly ahead of yearly. Rate and time matter far more: adding years is usually the cheapest way to grow the result. The same maths works against you on debt, which is why credit card balances grow so quickly.',
    ],
    formula: 'A = P × (1 + r ÷ m)^(m × t)\nP = starting amount, r = annual rate (as a decimal), m = compounding periods per year, t = years.',
    assumptions: ['Rate stays fixed and no deposits or withdrawals are made.', 'Taxes and inflation are ignored.'],
    faq: [
      { q: 'What is the compound interest formula?', a: 'A = P(1 + r/m)^(mt). The worked example shows every step with real numbers.' },
      { q: 'Does compounding more often help?', a: 'Slightly. Going from yearly to daily at the same rate raises the result a little, but the interest rate and the time invested matter much more.' },
      { q: 'How is compound different from simple interest?', a: 'Simple interest is charged only on the original amount. Compound interest is charged on the original amount plus interest already earned.' },
      { q: 'How can I add regular deposits?', a: 'Use the SIP calculator for monthly investments in rupees or the savings goal calculator to work out the deposit needed for a target.' },
      { q: 'What if the rate is zero?', a: 'The final amount equals the starting amount; no interest is earned.' },
    ],
    related: ['sip-calculator', 'savings-goal-calculator', 'loan-comparison-calculator'],
  },
  {
    slug: 'loan-comparison-calculator', title: 'Loan Comparison Calculator', shortTitle: 'Loan Comparison', country: 'both', category: 'loans',
    description: 'Compare two loans side by side with estimated monthly payment, total interest and total cost. Works in US dollars or Indian rupees.',
    about: [
      'Two loan offers can look similar and cost very different amounts. A lower rate with a longer term may carry a smaller monthly payment but a higher total cost, while a shorter loan costs more each month and saves interest.',
      'Enter the amount, interest rate and term for Loan A and Loan B. The calculator computes the monthly payment, total interest and total paid for each, then tells you which is cheaper overall and by how much. The summary chart compares total interest so the gap is obvious at a glance.',
      'Use it for car loans, personal loans, education loans or when deciding whether to refinance. Check that both offers cover the same amount, and include any fees separately: a loan with a 1% processing fee needs to beat the alternative by more than that. Look at the monthly payment too, since the cheapest loan on paper is only useful if you can afford the instalment.',
    ],
    formula: 'For each loan: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)\nTotal paid = EMI × n; interest = total paid − P\nDifference = total paid (B) − total paid (A).',
    assumptions: ['Fixed rates and equal monthly payments.', 'Fees, insurance and prepayment options are not included.'],
    faq: [
      { q: 'How do I know which loan is cheaper?', a: 'Compare the total paid. The loan with the lower total cost is cheaper overall, though it may have a higher monthly payment.' },
      { q: 'Does the lowest monthly payment mean the cheapest loan?', a: 'Not necessarily. A lower monthly payment often comes from a longer term, which usually means more total interest. The comparison shows both the monthly payment and the total cost.' },
      { q: 'Can I compare loans of different sizes?', a: 'Yes, but the comparison is clearest for equal amounts. Different amounts will naturally differ in total cost.' },
      { q: 'Does it work for refinancing?', a: 'Yes. Enter your current loan\'s remaining balance, rate and remaining term as A, and the new offer as B, then add refinancing fees yourself.' },
      { q: 'Which currency is used?', a: 'Choose US dollars or Indian rupees in the first field. The maths is identical; only the formatting changes.' },
    ],
    related: ['emi-calculator', 'mortgage-calculator', 'compound-interest-calculator'],
  },
  {
    slug: 'discount-calculator', title: 'Discount and Sale Price Calculator', shortTitle: 'Discount Calculator', country: 'both', category: 'shopping',
    description: 'Estimate the sale price, amount saved and effective discount after a percentage off, including an optional extra coupon.',
    about: [
      'Sales are advertised in percentages, but what matters is the price you pay and the money you keep. This calculator turns a percentage discount into a final price, the amount saved and the effective discount for the whole purchase.',
      'Enter the original price and the discount percentage. If a coupon or second offer stacks on top, enter it in the extra discount field. Extra discounts apply to the already reduced price, not the original, so 20% off followed by 10% off is a 28% total discount rather than 30%.',
      'That difference is why headline numbers such as "extra 10% off sale prices" are smaller than they sound. Use the effective discount row to compare offers fairly, for example 30% off against 20% off plus a flat coupon. Switch between dollars and rupees if you shop in either currency. Because the calculator also shows the amount you keep, it is handy for checking whether a bigger percentage on a cheap item really beats a smaller percentage on an expensive one.',
    ],
    formula: 'Savings = price × discount ÷ 100\nSale price = price − savings\nFinal price = sale price × (1 − extra ÷ 100)\nEffective discount = (price − final price) ÷ price × 100.',
    assumptions: ['Extra discount is applied to the reduced price.', 'Sales tax or GST is not included; use the matching tax calculator next.'],
    faq: [
      { q: 'How do I calculate a percentage discount?', a: 'Multiply the price by the percentage and divide by 100 to get the savings, then subtract it from the price.' },
      { q: 'Why is 20% plus 10% off not 30%?', a: 'The second discount applies to the already reduced price, so the total is 28%.' },
      { q: 'How do I work out the original price from a sale price?', a: 'Divide the sale price by (1 − discount ÷ 100). A $75 item that is 25% off was $100.' },
      { q: 'Is tax added after the discount?', a: 'Normally yes: sales tax or GST is calculated on the discounted price. Add it with the sales tax or GST calculator.' },
      { q: 'What if the discount is 0%?', a: 'The final price equals the original price and you save nothing.' },
    ],
    related: ['sales-tax-calculator', 'gst-calculator', 'savings-goal-calculator'],
  },
  {
    slug: 'savings-goal-calculator', title: 'Savings Goal Calculator', shortTitle: 'Savings Goal', country: 'both', category: 'investing',
    description: 'Estimate how much would need to be saved each month to reach a savings goal by a target date, including interest on existing savings.',
    about: [
      'A savings goal is easier to hit when you know the monthly number. This calculator works backwards from a target: how much would have to be put away each month to reach it in a given number of years, taking interest into account?',
      'Enter the goal, what you have already saved, the yearly return you expect and the time you have. The result is the monthly deposit required, along with the total you will contribute and the interest you can expect to earn. The chart splits the goal into your starting savings, your deposits and interest.',
      'Use realistic returns. A savings account and a stock-market fund behave very differently, and a goal needed in three years should not rely on high market returns. If the monthly amount looks too large, extend the time, lower the goal or look for ways to raise your starting balance. If your starting balance alone will grow past the goal, the tool tells you no deposits are needed.',
    ],
    formula: 'n = years × 12, r = annual rate ÷ 12 ÷ 100\nShortfall = goal − start × (1 + r)^n\nMonthly deposit = shortfall × r ÷ ((1 + r)^n − 1)\nWith r = 0: (goal − start) ÷ n.',
    assumptions: ['Deposits are made at the end of each month.', 'A constant return; no taxes, fees or inflation.'],
    faq: [
      { q: 'How is the monthly amount calculated?', a: 'It is the level monthly deposit that, with interest, makes up the difference between the goal and what your current savings will grow to.' },
      { q: 'What return should I use?', a: 'Use the rate of the account or fund you will actually use, and be conservative. For short goals use a low, safe rate.' },
      { q: 'What if I already have enough?', a: 'If your starting balance will reach the goal on its own, the calculator shows a zero monthly deposit.' },
      { q: 'Does inflation matter?', a: 'Yes. A goal in the future will cost more in nominal terms. Raise the target by expected inflation for a more realistic plan.' },
      { q: 'Can I use it for rupees?', a: 'Yes, choose Indian rupee in the currency field. For investing in rupees through mutual funds see the SIP calculator.' },
    ],
    related: ['compound-interest-calculator', 'sip-calculator', 'mortgage-calculator'],
  },
];
export const tools: Tool[] = [...baseTools, ...extraTools];

export const toolBySlug = (slug: string): Tool | undefined => tools.find((t) => t.slug === slug);
export const toolsByCountry = (c: 'in' | 'us') => tools.filter((t) => t.country === c || t.country === 'both');
export const toolsByCategory = (cat: CategorySlug) => tools.filter((t) => t.category === cat);
export const countryLabel = (c: Country) => (c === 'in' ? 'India' : c === 'us' ? 'United States' : 'India and US');

/** Icon name (see components/Icon.astro) per tool and per category. */
export const toolIcons: Record<string, string> = {
  'emi-calculator': 'calc', 'sip-calculator': 'trend', 'gst-calculator': 'percent', 'income-tax-calculator-india': 'wallet',
  'mortgage-calculator': 'home', 'paycheck-calculator': 'wallet', 'sales-tax-calculator': 'percent', 'hourly-to-salary-calculator': 'clock',
  'compound-interest-calculator': 'trend', 'loan-comparison-calculator': 'scale', 'discount-calculator': 'tag', 'savings-goal-calculator': 'target',
  'fd-calculator': 'wallet', 'rd-calculator': 'calc', 'ppf-calculator': 'trend', 'hra-calculator': 'home',
  '401k-calculator': 'trend', 'retirement-calculator': 'target', 'auto-loan-calculator': 'calc', 'mortgage-refinance-calculator': 'scale',
};
export const categoryIcons: Record<string, string> = { loans: 'home', investing: 'trend', 'tax-salary': 'wallet', shopping: 'tag' };
export const popularSlugs = ['emi-calculator', 'sip-calculator', 'income-tax-calculator-india', 'mortgage-calculator', 'paycheck-calculator', 'compound-interest-calculator'];
