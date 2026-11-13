import type { Tool } from './tools';
import { savingsIndia } from './savings-india';
import { retirementUS } from './retirement-us';
import { money } from '../lib/format';

const ppf = savingsIndia.ppf;
const usd = (n: number) => money(n, 'USD');
const inr = (n: number) => money(n, 'INR');

/** Calculators added after the first twelve. Same shape as the entries in tools.ts. Wording is descriptive, never advisory. */
export const extraTools: Tool[] = [
  {
    slug: 'fd-calculator', title: 'FD Calculator: Estimate Fixed Deposit Maturity', shortTitle: 'FD Calculator', country: 'in', category: 'investing',
    description: 'Estimate the maturity amount and interest on a fixed deposit in India for different rates, tenures and compounding frequencies.',
    about: [
      'A fixed deposit (FD) pays a stated rate of interest on a lump sum held for a chosen period. How often the interest is added to the balance, called the compounding frequency, changes the maturity amount: interest that is added more often earns interest of its own sooner.',
      'Enter the deposit, the yearly rate and the tenure, then pick how the interest is treated. The result shows an estimated maturity amount, the interest earned and the effective yearly yield, which is the rate you would need on a once-a-year basis to end up with the same amount. The chart plots the deposit value year by year.',
      'Banks differ in how they compound and in how they handle partial years, so the figures here are approximations. Your deposit receipt or the bank\'s own schedule shows the exact terms. Interest on FDs is generally taxable and banks may deduct tax at source; this calculator shows amounts before tax.',
    ],
    formula: 'Compounded: Maturity = P × (1 + r/m)^(m × t)\nSimple interest: Maturity = P × (1 + r × t)\nP = deposit, r = yearly rate as a decimal, m = compounding periods per year, t = years.\nEffective yield = (1 + r/m)^m − 1.',
    assumptions: ['The rate stays fixed for the whole tenure.', 'Interest is compounded at the frequency you choose; many banks use quarterly.', 'Amounts are before tax and ignore penalties for early withdrawal.'],
    faq: [
      { q: 'How is FD maturity calculated?', a: 'With compounding, maturity = P × (1 + r/m)^(m × t). The worked example on this page shows each step using the default values.' },
      { q: 'What does compounding frequency change?', a: 'Interest added more often starts earning interest sooner, so the maturity amount is slightly higher for the same stated rate.' },
      { q: 'What is the effective yield?', a: 'It is the yearly growth rate that matches the result of compounding at the stated rate. It is a little higher than the stated rate when interest compounds more than once a year.' },
      { q: 'Is the interest taxable?', a: 'Interest on fixed deposits is generally treated as income and may be taxed, and banks may deduct tax at source. This calculator does not deduct any tax.' },
      { q: 'Will my bank show exactly the same figure?', a: 'It may differ slightly because of rounding, day-count conventions and how partial periods are treated. The bank\'s schedule is the reference for your deposit.' },
    ],
    related: ['rd-calculator', 'ppf-calculator', 'compound-interest-calculator'],
  },
  {
    slug: 'rd-calculator', title: 'RD Calculator: Estimate Recurring Deposit Maturity', shortTitle: 'RD Calculator', country: 'in', category: 'investing',
    description: 'Estimate the maturity value of a monthly recurring deposit in India, with total deposits, interest earned and a year-by-year chart.',
    about: [
      'A recurring deposit (RD) lets you set aside a fixed amount every month for a chosen number of months. Each instalment earns interest from the month it is deposited, so earlier instalments grow for longer than later ones.',
      'Banks in India commonly compound RD interest quarterly. This calculator follows that convention: it converts the quarterly rate into an equivalent monthly growth factor and adds up what each deposit grows to by maturity. You enter the monthly deposit, the yearly rate and the tenure in months.',
      'The result is an estimate. Banks may handle the day a deposit is made, late instalments and rounding differently, and interest is generally taxable. Treat the number as an approximation and check the bank\'s own schedule for the exact figure.',
    ],
    formula: 'q = (1 + r/4)^(1/3), where r is the yearly rate as a decimal\nMaturity = D × q × (q^N − 1) ÷ (q − 1)\nD = monthly deposit, N = number of months. With r = 0, Maturity = D × N.',
    assumptions: ['One deposit at the start of each month, none missed.', 'Quarterly compounding and a fixed rate for the whole tenure.', 'Amounts are before tax.'],
    faq: [
      { q: 'How is RD maturity calculated?', a: 'Each monthly deposit is grown at the equivalent monthly rate for the months it stays in, and the results are added. The worked example shows the quarterly-to-monthly step.' },
      { q: 'Why is quarterly compounding used?', a: 'It is a common convention for RDs in India. Your bank\'s terms are the reference if they differ.' },
      { q: 'What happens if I miss an instalment?', a: 'Banks usually charge a small penalty and the maturity amount changes. This calculator assumes every instalment is paid on time.' },
      { q: 'What if the rate is 0%?', a: 'Maturity is simply the monthly deposit multiplied by the number of months.' },
      { q: 'Is the interest taxed?', a: 'Interest on recurring deposits is generally taxable and tax may be deducted at source. This calculator shows amounts before tax.' },
    ],
    related: ['fd-calculator', 'sip-calculator', 'savings-goal-calculator'],
  },
  {
    slug: 'ppf-calculator', title: 'PPF Calculator: Estimate Public Provident Fund Maturity', shortTitle: 'PPF Calculator', country: 'in', category: 'investing',
    description: 'Estimate the maturity value of a Public Provident Fund account in India from yearly deposits, rate and years, with a year-by-year balance chart.',
    about: [
      'The Public Provident Fund (PPF) is a long-term government-backed savings scheme in India with a 15-year term, a minimum and maximum yearly deposit, and an interest rate that the Government sets every quarter. Interest is worked out monthly and added to the account once a year.',
      `This calculator assumes the rate you enter stays the same for the whole period and compares two deposit patterns: the whole year's amount deposited early in the year, or twelve equal monthly deposits. The rate is pre-filled with ${ppf.ratePercent}%, the figure reported for ${ppf.rateQuarterLabel}. Because the rate can change, enter the current rate to get a more relevant estimate.`,
      `The yearly deposit is limited to between ${inr(ppf.minYearlyDeposit)} and ${inr(ppf.maxYearlyDeposit)}. The result shows the estimated maturity value, the total deposited and the interest. Tax treatment of PPF depends on the tax regime and current rules, so no tax is included here.`,
    ],
    formula: 'Each year: Interest = (balance + deposit) × r   (whole-year deposit)\nor Interest = Σ over 12 months of (running balance × r/12)   (monthly deposits)\nClosing balance = opening balance + deposit + interest.\nr = yearly rate as a decimal.',
    assumptions: ['The interest rate is constant; in practice it is reset every quarter.', `Yearly deposit between ${inr(ppf.minYearlyDeposit)} and ${inr(ppf.maxYearlyDeposit)}.`, 'Whole-year deposits are assumed to be made before the 5th of April; monthly deposits before the 5th of each month.', 'No tax is deducted and no withdrawals or loans are modelled.'],
    faq: [
      { q: 'How is PPF interest calculated?', a: 'Interest accrues monthly on the lowest balance between the 5th and the end of the month and is credited at the end of the financial year. The calculator approximates this with the two deposit patterns above.' },
      { q: 'What rate does the calculator use?', a: `It starts from ${ppf.ratePercent}%, the rate reported for ${ppf.rateQuarterLabel}. The rate changes from time to time, so you can overwrite it.` },
      { q: 'Why does the deposit pattern matter?', a: 'A deposit made early in the year earns interest for more months than one made late, so the same yearly amount can lead to a slightly different maturity value.' },
      { q: 'What are the deposit limits?', a: `The calculator accepts ${inr(ppf.minYearlyDeposit)} to ${inr(ppf.maxYearlyDeposit)} a year, the limits in the configuration behind this page. Check the current scheme rules for any change.` },
      { q: 'Can the account run longer than 15 years?', a: 'The scheme allows extensions in blocks of five years. Increase the number of years to see an estimate for a longer period.' },
    ],
    related: ['fd-calculator', 'rd-calculator', 'sip-calculator'],
  },
  {
    slug: 'hra-calculator', title: 'HRA Exemption Calculator (India)', shortTitle: 'HRA Calculator', country: 'in', category: 'tax-salary',
    description: 'Estimate the House Rent Allowance exemption under the old tax regime in India from basic salary, HRA received, rent paid and city.',
    about: [
      'House Rent Allowance (HRA) is a part of salary paid to help with rent. Under the old tax regime, part of it can be exempt from tax. The exempt amount is the smallest of three figures: the HRA you actually receive, the rent you pay minus 10% of basic salary, and a share of basic salary that depends on the city.',
      `This calculator applies those three limits to monthly figures and then shows the result per year. The share of basic salary is ${hraShare(0.5)}% for the cities treated as metro and ${hraShare(0.4)}% elsewhere. The list of metro cities changed recently, so the page states which cities it uses.`,
      'It shows only the HRA exemption and does not work out your tax. Exemption rules can depend on documents such as rent receipts and landlord details, and HRA exemption is generally not available under the new tax regime. Confirm the current rules and your own position with a qualified professional.',
    ],
    formula: 'Exemption per month = the least of:\n  1. HRA received\n  2. Rent paid − 10% of (basic salary + dearness allowance)\n  3. 50% (metro) or 40% (other) of (basic salary + dearness allowance)\nIf a figure is negative, it is taken as zero. Taxable HRA = HRA received − exemption.',
    assumptions: ['Old tax regime rules; HRA exemption is generally not available under the new regime.', 'Figures are monthly and the same all year.', 'Basic salary includes dearness allowance where it forms part of retirement benefits.', 'Rent receipts and other documents required for a claim are not checked.'],
    faq: [
      { q: 'How is the HRA exemption calculated?', a: 'It is the least of the HRA received, the rent paid minus 10% of basic salary, and 50% or 40% of basic salary. The worked example lists all three.' },
      { q: 'Which cities count as metro?', a: 'This page treats Mumbai, Delhi, Kolkata, Chennai, Bengaluru, Hyderabad, Pune and Ahmedabad as metro cities, based on reports of the Income-tax Rules, 2026. See the sources table for the status of that figure.' },
      { q: 'Does it work under the new tax regime?', a: 'HRA exemption is generally available only under the old regime, so this calculator is relevant only where that regime applies.' },
      { q: 'What if I pay no rent?', a: 'Then the second limit is zero and the exemption is zero.' },
      { q: 'Does this calculate my income tax?', a: 'No. It shows only the HRA exemption. For tax under each regime see the income tax calculator.' },
    ],
    related: ['income-tax-calculator-india', 'emi-calculator', 'savings-goal-calculator'],
  },
  {
    slug: '401k-calculator', title: '401(k) Calculator: Estimate Your Projected Balance', shortTitle: '401(k) Calculator', country: 'us', category: 'investing',
    description: 'Estimate a 401(k) balance from your contributions, employer match, salary growth and an assumed return, using current IRS contribution limits.',
    about: [
      'A 401(k) is a workplace retirement plan in the United States. You choose a share of your pay to contribute, an employer may add a match, and the balance is invested until you stop contributing. The IRS sets a yearly limit on how much an employee can contribute, with higher limits for people aged 50 and over.',
      `This calculator projects a balance from your current balance, salary, contribution percentage, employer match and an assumed yearly return. It caps your contribution at the ${retirementUS.planYear} limit of ${usd(retirementUS.deferralLimit)}, adds the catch-up amounts from age 50 (${usd(retirementUS.catchUp50)}) and ages 60 to 63 (${usd(retirementUS.catchUp6063)}), and holds those limits fixed for later years.`,
      'The return you enter is an assumption, not a forecast, and actual returns vary and can be negative. The projection is before tax and before inflation, so the future dollars it shows will buy less than today\'s dollars. Plan features such as vesting schedules, Roth treatment and higher-income rules are not modelled.',
    ],
    formula: 'Each year: employee = min(salary × contribution %, annual limit)\nemployer = match rate × min(employee, match cap % × salary)\nEach month: balance = balance × (1 + return/12) + (employee + employer)/12\nSalary grows at the growth rate each year.',
    assumptions: [`Limits for ${retirementUS.planYear} are used for every year; the IRS normally changes them over time.`, 'Contributions are made evenly through the year and the return is the same every year.', 'No taxes, fees, vesting schedules or inflation are modelled.', 'Employer match is a percentage of your contribution up to a percentage of salary.'],
    faq: [
      { q: 'What is the 401(k) contribution limit?', a: `For ${retirementUS.planYear} the IRS employee limit is ${usd(retirementUS.deferralLimit)}, with ${usd(retirementUS.catchUp50)} more for age 50 and over and ${usd(retirementUS.catchUp6063)} for ages 60 to 63, according to the IRS news release linked in the sources table.` },
      { q: 'How does the employer match work here?', a: 'The match is a percentage of your contribution, up to a share of your salary. Plans differ, so check your plan documents.' },
      { q: 'Does the result include inflation?', a: 'No. The balance is in future dollars. Dollars in the future will buy less than dollars today.' },
      { q: 'Can I use a return of 0%?', a: 'Yes. The balance is then your starting balance plus all contributions.' },
      { q: 'Is the projection a prediction?', a: 'No. It applies the assumptions you enter. Real returns, salary and contribution limits will differ.' },
    ],
    related: ['retirement-calculator', 'compound-interest-calculator', 'paycheck-calculator'],
  },
  {
    slug: 'retirement-calculator', title: 'Retirement Calculator: Estimate Savings vs. Income Needed', shortTitle: 'Retirement Calculator', country: 'us', category: 'investing',
    description: 'Estimate whether projected retirement savings could cover a chosen monthly income, using assumed returns and inflation. US dollars.',
    about: [
      'This calculator compares two things: how large your savings could grow by the time you retire, and how large a balance would be needed to pay a chosen monthly income from then until a chosen age. The difference is shown as a gap or as an amount above the target.',
      'You enter your ages, current savings, monthly contribution, the income you would like in today\'s dollars and any other income you expect, such as Social Security. The tool raises the income target by inflation up to retirement, then raises each year\'s withdrawal by inflation during retirement while the remaining balance earns the return you assume.',
      'Every input is an assumption. Returns, inflation, lifespan, taxes and benefit amounts are uncertain, so the result is an illustration of how the numbers interact, not a forecast. Other income, such as Social Security, is entered by you; this tool does not estimate benefits.',
    ],
    formula: 'Balance at retirement = S × (1 + r)^n + C × ((1 + r)^n − 1) ÷ r   (monthly r, n months)\nFirst-year withdrawal = (income − other income) × 12 × (1 + inflation)^years\nSavings needed = withdrawal × (1 − ρ^T) ÷ (1 − ρ), ρ = (1 + inflation) ÷ (1 + return in retirement), T = years in retirement.',
    assumptions: ['Constant returns and inflation every year.', 'Monthly contributions stay the same in dollars.', 'Withdrawals are taken at the start of each year and rise with inflation.', 'No taxes, fees or changes in spending are modelled.'],
    faq: [
      { q: 'What does "savings needed" mean here?', a: 'It is the balance at retirement that would pay the inflation-adjusted income gap until the plan age, given the return you assume.' },
      { q: 'Why enter income in today\'s dollars?', a: 'It lets you think in familiar amounts. The tool then adjusts it for the inflation you assume.' },
      { q: 'What is the extra monthly saving?', a: 'It is the additional monthly amount that, with the assumed pre-retirement return, would close the gap between projected and needed savings.' },
      { q: 'What does "money lasts until" show?', a: 'It simulates withdrawals year by year and reports the approximate age at which the balance would run out, or that it lasts to the plan age.' },
      { q: 'Does it include Social Security?', a: 'Only as a monthly amount you enter yourself. It does not estimate benefits.' },
    ],
    related: ['401k-calculator', 'savings-goal-calculator', 'compound-interest-calculator'],
  },
  {
    slug: 'auto-loan-calculator', title: 'Auto Loan Calculator: Estimate Your Car Payment', shortTitle: 'Auto Loan Calculator', country: 'us', category: 'loans',
    description: 'Estimate a monthly car loan payment, total interest and total cost from price, down payment, trade-in, sales tax, fees, rate and term.',
    about: [
      'An auto loan spreads the cost of a vehicle over a fixed number of monthly payments. The payment depends on the amount you borrow, the interest rate (APR) and the length of the loan. A longer term usually lowers the monthly payment but increases the total interest paid.',
      'Enter the vehicle price, your down payment and any trade-in, then the sales tax rate and the fees you expect. The tool works out the amount financed, the monthly payment, the total interest and the total cost including what you pay up front. The month-by-month table below the result can be downloaded as a CSV file.',
      'Sales tax rules differ by state, including whether a trade-in reduces the taxable amount, so the tool lets you choose. Insurance, add-ons and changes in rate are not included, and the actual figures will come from your lender\'s loan documents.',
    ],
    formula: 'Sales tax = tax rate × taxable price\nAmount financed = price + tax + fees − down payment − trade-in\nPayment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)\nr = APR ÷ 12, n = number of months.',
    assumptions: ['Fixed APR for the whole term.', 'Sales tax and fees are included in the amount financed.', 'No insurance, add-on products or prepayments.', 'Trade-in value is applied as a credit toward the price.'],
    faq: [
      { q: 'How is the car payment calculated?', a: 'The payment is the standard loan formula applied to the amount financed, the monthly rate and the number of months. The worked example shows each step.' },
      { q: 'Does a longer term change the cost?', a: 'A longer term usually lowers each payment and raises the total interest, because the balance stays outstanding for longer.' },
      { q: 'How is sales tax treated?', a: 'You enter the rate and choose whether it applies to the full price or to the price after the trade-in. Rules vary by state.' },
      { q: 'Are fees included?', a: 'Fees you enter are added to the amount financed. Insurance and add-on products are not included.' },
      { q: 'Will my lender quote the same payment?', a: 'It may differ slightly because of rounding, fees and how the first payment date is set. The loan documents are the reference.' },
    ],
    related: ['loan-comparison-calculator', 'mortgage-calculator', 'mortgage-refinance-calculator'],
  },
  {
    slug: 'mortgage-refinance-calculator', title: 'Mortgage Refinance Calculator: Compare Payments and Costs', shortTitle: 'Refinance Calculator', country: 'us', category: 'loans',
    description: 'Compare your current mortgage with a new loan: estimated monthly payment change, months to recover closing costs and total paid.',
    about: [
      'Refinancing replaces an existing loan with a new one, usually at a different rate or term. It can change the monthly payment and the total amount paid over time, and it normally comes with closing costs. This calculator puts the two options side by side.',
      'It takes the balance, rate and remaining term of the current loan and the rate, term and closing costs of the new one. The result shows the estimated payment on each loan, the monthly difference, how many months of that difference it would take to cover the upfront costs, and the total paid under each option. The new loan\'s month-by-month table can be downloaded as a CSV file.',
      'A lower payment does not always mean a lower total cost: a longer new term can reduce the payment and still cost more overall, and the tool shows both measures. Payments shown are principal and interest only; taxes, insurance and escrow are not included, and the current payment is re-derived from the balance, rate and term you enter, so it may differ from your statement.',
    ],
    formula: 'Payment = P × r × (1 + r)^n ÷ ((1 + r)^n − 1) for each loan (r = rate ÷ 12)\nMonthly difference = current payment − new payment\nMonths to recover costs = upfront costs ÷ monthly difference (rounded up)\nTotal paid, new = new payment × months + upfront costs',
    assumptions: ['Fixed rates on both loans.', 'Principal and interest only; no taxes, insurance or escrow.', 'Closing costs are paid up front or added to the new loan, as you choose.', 'The current payment is calculated from the balance, rate and remaining term, not read from a statement.'],
    faq: [
      { q: 'What are closing costs?', a: 'Fees charged to complete a new loan, such as lender, appraisal and title charges. Enter the total you have been quoted.' },
      { q: 'What does "months to recover upfront costs" mean?', a: 'It is the upfront costs divided by the monthly payment difference. It is shown only when the new payment is lower and there are costs to pay up front.' },
      { q: 'Why can total paid go up when the payment goes down?', a: 'Extending the term spreads the balance over more months, which can lower each payment and increase the total interest.' },
      { q: 'What changes if costs are added to the new loan?', a: 'The new balance is higher by the closing costs, there is no upfront payment and so no recovery period is shown.' },
      { q: 'Does this include taxes and insurance?', a: 'No. Only principal and interest are compared.' },
    ],
    related: ['mortgage-calculator', 'auto-loan-calculator', 'loan-comparison-calculator'],
  },
  {
    slug: 'tip-split-calculator', title: 'Tip and Bill Split Calculator', shortTitle: 'Tip & Bill Split', country: 'both', category: 'everyday',
    description: 'Estimate the tip, the total and each person\'s share of a bill, with an option to round every share up to a whole unit.',
    about: [
      'Splitting a bill takes three steps: work out the tip, add it to the bill, and divide the total by the number of people. This calculator does all three and shows each step.',
      'Enter the bill before tip, the tip percentage you intend to leave and the number of people. Tipping customs differ between countries, venues and services, and in some places a service charge is already included, so the percentage is yours to enter. Nothing is pre-selected as a rule.',
      'If you choose to round each share up to a whole unit, the group pays slightly more than the total; the calculator shows how much extra that is. All shares are assumed equal, so it does not handle people who ordered different amounts.',
    ],
    formula: 'Tip = bill × tip % ÷ 100\nTotal = bill + tip\nShare per person = total ÷ number of people\nRounded share = share rounded up to the next whole unit.',
    assumptions: ['Everyone pays an equal share.', 'The tip is a percentage of the bill before tip.', 'Any service charge or tax already on the bill is treated as part of the bill.'],
    faq: [
      { q: 'How is the tip calculated?', a: 'Tip = bill × tip percentage ÷ 100. The worked example shows the steps using the default values.' },
      { q: 'Is the tip calculated on the bill with tax?', a: 'It is calculated on whatever amount you enter as the bill. Enter the pre-tax or post-tax amount, depending on how you want to tip.' },
      { q: 'Why does rounding up add money?', a: 'Each person\'s share is rounded up, so the shares add up to a little more than the total. The calculator shows the difference.' },
      { q: 'Can it split unevenly?', a: 'No. It divides the total equally.' },
      { q: 'Does it work in rupees?', a: 'Yes, choose Indian rupee in the currency field.' },
    ],
    related: ['discount-calculator', 'sales-tax-calculator', 'gst-calculator'],
  },
  {
    slug: 'currency-converter', title: 'Currency Converter (Approximate Reference Rates)', shortTitle: 'Currency Converter', country: 'both', category: 'everyday',
    description: 'Convert between USD, INR, EUR, GBP and other major currencies using dated reference rates. Approximate, not a bank or card rate.',
    about: [
      'This converter multiplies an amount by the ratio of two exchange rates taken from the same dated table. The table holds the European Central Bank\'s euro foreign exchange reference rates, copied by an automated job each weekday and committed with its date, so the date on the page is the date of the rates.',
      'These are reference rates, not rates you can trade at. Banks, card networks and money-transfer services add a margin or fees and use their own rates, so the amount you actually receive will usually differ. The converter makes no request to any rate service from your browser; it uses the snapshot published with the page.',
      'If the snapshot is more than a week old the page says so. Currencies the European Central Bank does not publish a rate for, such as the UAE dirham, are not available.',
    ],
    formula: 'Rates are quoted per 1 euro.\nConverted amount = amount × rate(to) ÷ rate(from)',
    assumptions: ['Rates are daily reference rates, not the rate on a particular transaction.', 'No fees, margins or taxes are included.', 'The date shown on the page is the date of the rates.'],
    faq: [
      { q: 'Where do the rates come from?', a: 'From the European Central Bank\'s euro reference rates, fetched through the free Frankfurter service by an automated job and saved with their date.' },
      { q: 'Will my bank give me the same rate?', a: 'Usually not. Providers add a margin or fees and may use rates from a different time of day.' },
      { q: 'How often are the rates updated?', a: 'The job runs each weekday. If it fails, the previous snapshot stays and its date stays visible.' },
      { q: 'Why is a currency missing?', a: 'Only currencies in the reference table are included. Others cannot be converted without making up a rate.' },
      { q: 'Does the page contact a rate service when I use it?', a: 'No. The rates are part of the page, so using the converter sends nothing to a third party.' },
    ],
    related: ['compound-interest-calculator', 'discount-calculator', 'loan-comparison-calculator'],
  },
  {
    slug: 'expense-tracker', kind: 'app', title: 'Expense Tracker (Stays in Your Browser)', shortTitle: 'Expense Tracker', country: 'both', category: 'everyday',
    description: 'Record daily expenses by category, see monthly totals and a category chart, and export to CSV. Entries stay in your browser.',
    about: [
      'The expense tracker keeps a simple list of what you spend. Add an entry with a date, an amount, a category and an optional note, then pick a month to see the total, a breakdown by category and a chart.',
      'Everything is stored in your browser\'s local storage on this device. There are no accounts, nothing is sent to a server, and clearing your browser data removes the entries. Because the data lives only on this device, use the CSV export if you want a copy or want to move to another device.',
      'The totals add up exactly what you enter. They are not budgets, forecasts or advice, and amounts are stored in cents or paise to avoid rounding errors. If your browser blocks storage, the tracker still works for the current visit and tells you the entries will not be saved.',
    ],
    formula: 'Monthly total = sum of the entries dated in that month\nCategory total = sum of the entries in that category and month\nAmounts are stored as whole cents or paise.',
    assumptions: ['One currency per list, chosen at the top.', 'Entries are stored only in this browser on this device.', 'Totals are sums of what you enter and are not checked against any bank record.'],
    faq: [
      { q: 'Where is my data stored?', a: 'In your browser\'s local storage on this device. It is not uploaded anywhere.' },
      { q: 'What happens if I clear my browser data?', a: 'The entries are deleted. Export a CSV first if you want to keep them.' },
      { q: 'Can I use it on two devices?', a: 'Each device keeps its own list. Export a CSV from one and keep it as a record; there is no sync.' },
      { q: 'Is there a limit?', a: 'Up to 5,000 entries and 120 characters per note.' },
      { q: 'Can I change the categories?', a: 'The category list is fixed. Use the note field for detail.' },
    ],
    related: ['savings-goal-calculator', 'tip-split-calculator', 'hourly-to-salary-calculator'],
  },
  {
    slug: 'tax-deadline-calendar', kind: 'app', title: 'Tax and Filing Deadline Calendar (India and US)', shortTitle: 'Deadline Calendar', country: 'both', category: 'everyday',
    description: 'Tax and filing dates that have been confirmed on official pages, with links to each source and calendar (.ics) downloads. Dates can change.',
    about: [
      'This calendar lists tax and filing dates that were read on an official government page, each with a link to that page. You can add a single date or all upcoming dates to your own calendar app as an .ics file.',
      'It deliberately lists fewer dates than many sites: a date appears only if it was confirmed on an official source. Dates that could not be confirmed, which at the moment includes the Indian income tax and GST dates, are shown separately as not included instead of being guessed.',
      'Authorities can extend or change deadlines, and deadlines that fall on a weekend or holiday may move. Always confirm a date on the linked page before relying on it. The calendar does not know your circumstances and is not tax advice.',
    ],
    formula: 'No calculation. Each row is a date taken from the source linked on that row.',
    assumptions: ['Dates are as published on the linked page when it was read; later changes may not be shown.', 'The listed dates are general; whether a date applies to you depends on your situation.', 'Dates not confirmed on an official page are not listed.'],
    faq: [
      { q: 'Where do the dates come from?', a: 'Each row links to the official page it was read from, such as an IRS form or page.' },
      { q: 'Why are there no India dates?', a: 'They could not be confirmed on an official page when this was built, so they are listed as not included instead of guessed.' },
      { q: 'What is in the .ics file?', a: 'All-day events with the title, a short note, the source link and an optional reminder, for any calendar app that reads .ics files.' },
      { q: 'Are the dates final?', a: 'No. Authorities can change them, and they can move if they fall on a weekend or holiday. Check the source link.' },
      { q: 'Does it tell me which dates apply to me?', a: 'No. It lists general dates and who they usually concern.' },
    ],
    related: ['paycheck-calculator', 'income-tax-calculator-india', 'hra-calculator'],
  },
];

function hraShare(n: number): number { return Math.round(n * 100); }
