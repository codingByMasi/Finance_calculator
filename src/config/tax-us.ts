/**
 * US tax configuration for the paycheck calculator.
 * No tax figure should live in components; edit this file only.
 *
 * VERIFICATION STATUS (checked 2026-11-13):
 *  - OFFICIAL (irs.gov): Rev. Proc. 2025-32 (tax year 2026): standard deductions and the single, married-filing-
 *    jointly and head-of-household brackets; irs.gov/taxtopics/tc751: Social Security 6.2% up to a 184,500 wage
 *    base, Medicare 1.45%, additional Medicare 0.9% over 200,000 of wages.
 *  - SECONDARY: state schedules (brackets, standard deductions, personal exemptions/credits) are transcribed
 *    from the Tax Foundation "State Individual Income Tax Rates and Brackets for 2026" (figures as of 1 Jan 2026).
 *    They were not individually cross-checked against each state revenue department.
 *    TODO(verify): spot-check against state revenue department publications before relying on them.
 *  - NOT MODELLED: local/city income taxes, state payroll programs (SDI, FLI, SUI), phase-outs of state
 *    deductions/exemptions (e.g. AL, CT, UT credit), dependants, state-specific retirement-plan treatment.
 *  - Federal tax assumes standard deduction, no credits, wages only. Head-of-household uses the single-filer
 *    state schedule (most states have no separate HoH schedule; a few do, so treat as approximate).
 */
export type FilingStatus = 'single' | 'married' | 'head';
export interface Bracket { upTo: number; rate: number }

export const taxUS = {
  taxYear: 2026,
  lastUpdated: '2026-11-13',
  sourceUrls: [
    'https://www.irs.gov/pub/irs-drop/rp-25-32.pdf',
    'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill',
    'https://www.irs.gov/taxtopics/tc751',
    'https://www.ssa.gov/cola/factsheets/2026.html',
    'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/',
  ],
  /** true only when every figure is confirmed on an official source */
  verified: false,
  verificationNote: 'Federal figures are confirmed on irs.gov. State schedules come from the Tax Foundation 2026 compilation and have not been checked against each state revenue department.',
  todo: ['Spot-check state schedules against state revenue departments.'],
  standardDeduction: { single: 16100, married: 32200, head: 24150 } as Record<FilingStatus, number>,
  brackets: {
    single: [
      { upTo: 12400, rate: 0.1 }, { upTo: 50400, rate: 0.12 }, { upTo: 105700, rate: 0.22 },
      { upTo: 201775, rate: 0.24 }, { upTo: 256225, rate: 0.32 }, { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    married: [
      { upTo: 24800, rate: 0.1 }, { upTo: 100800, rate: 0.12 }, { upTo: 211400, rate: 0.22 },
      { upTo: 403550, rate: 0.24 }, { upTo: 512450, rate: 0.32 }, { upTo: 768700, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    head: [
      { upTo: 17700, rate: 0.1 }, { upTo: 67450, rate: 0.12 }, { upTo: 105700, rate: 0.22 },
      { upTo: 201750, rate: 0.24 }, { upTo: 256200, rate: 0.32 }, { upTo: 640600, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
  } as Record<FilingStatus, Bracket[]>,
  fica: {
    socialSecurityRate: 0.062,
    socialSecurityWageBase: 184500,
    medicareRate: 0.0145,
    additionalMedicareRate: 0.009,
    additionalMedicareThreshold: 200000,
  },
};

/** "rate:threshold,rate:threshold" where each rate applies to income above its threshold (as printed in the source). */
function parse(spec: string): Bracket[] {
  const rows = spec.split(',').map((r) => r.split(':').map(Number) as [number, number]);
  const out: Bracket[] = [];
  if (rows[0][1] > 0) out.push({ upTo: rows[0][1], rate: 0 });
  rows.forEach(([rate], i) => out.push({ upTo: i + 1 < rows.length ? rows[i + 1][1] : Infinity, rate: rate / 100 }));
  return out;
}

export interface StateTax {
  code: string;
  name: string;
  kind: 'none' | 'flat' | 'graduated';
  brackets: { single: Bracket[]; married: Bracket[] };
  standardDeduction: { single: number; married: number };
  /** personal exemption for the taxpayer: subtracts from income ('deduction') or from tax ('credit') */
  exemption: { single: number; married: number; type: 'deduction' | 'credit' };
  /** standard "deduction" that the state gives as a tax credit instead (Utah) */
  stdAsCredit?: boolean;
  note?: string;
}

type Row = [code: string, name: string, single: string, married: string, std: [number, number], pe: [number, number], peType?: 'credit'];
const R = (code: string, name: string, single: string, married: string | 'same', std: [number, number] = [0, 0], pe: [number, number] = [0, 0], peType?: 'credit'): Row =>
  [code, name, single, married === 'same' ? single : married, std, pe, peType];

const rows: Row[] = [
  R('AL', 'Alabama', '2:0,4:500,5:3000', '2:0,4:1000,5:6000', [3000, 8500], [1500, 3000]),
  R('AK', 'Alaska', '', ''),
  R('AZ', 'Arizona', '2.5:0', 'same', [8350, 16700]),
  R('AR', 'Arkansas', '2:0,3.9:4600', 'same', [2470, 4940], [29, 58], 'credit'),
  R('CA', 'California', '1:0,2:11079,4:26264,6:41452,8:57542,9.3:72724,10.3:371479,11.3:445771,12.3:742953,13.3:1000000', '1:0,2:22158,4:52528,6:82904,8:115084,9.3:145448,10.3:742958,11.3:891542,12.3:1000000,13.3:1485906', [5540, 11080], [153, 306], 'credit'),
  R('CO', 'Colorado', '4.4:0', 'same', [16100, 32200]),
  R('CT', 'Connecticut', '2:0,4.5:10000,5.5:50000,6:100000,6.5:200000,6.9:250000,6.99:500000', '2:0,4.5:20000,5.5:100000,6:200000,6.5:400000,6.9:500000,6.99:1000000', [0, 0], [15000, 24000]),
  R('DE', 'Delaware', '0:0,2.2:2000,3.9:5000,4.8:10000,5.2:20000,5.55:25000,6.6:60000', 'same', [3250, 6500], [110, 220], 'credit'),
  R('DC', 'District of Columbia', '4:0,6:10000,6.5:40000,8.5:60000,9.25:250000,9.75:500000,10.75:1000000', 'same', [16100, 32200]),
  R('FL', 'Florida', '', ''),
  R('GA', 'Georgia', '5.19:0', 'same', [12000, 24000]),
  R('HI', 'Hawaii', '1.4:0,3.2:9600,5.5:14400,6.4:19200,6.8:24000,7.2:36000,7.6:48000,7.9:125000,8.25:175000,9:225000,10:275000,11:325000', '1.4:0,3.2:19200,5.5:28800,6.4:38400,6.8:48000,7.2:72000,7.6:96000,7.9:250000,8.25:350000,9:450000,10:550000,11:650000', [4400, 8800], [1144, 2288]),
  R('ID', 'Idaho', '5.3:4811', '5.3:9622', [16100, 32200]),
  R('IL', 'Illinois', '4.95:0', 'same', [0, 0], [2925, 5850]),
  R('IN', 'Indiana', '2.95:0', 'same', [0, 0], [1000, 2000]),
  R('IA', 'Iowa', '3.8:0', 'same', [16100, 32200], [40, 80], 'credit'),
  R('KS', 'Kansas', '5.2:0,5.58:23000', '5.2:0,5.58:46000', [3605, 8240], [9160, 18320]),
  R('KY', 'Kentucky', '3.5:0', 'same', [3360, 3360]),
  R('LA', 'Louisiana', '3:0', 'same', [12875, 25750]),
  R('ME', 'Maine', '5.8:0,6.75:27399,7.15:64849', '5.8:0,6.75:54849,7.15:129749', [8350, 16700], [5300, 10600]),
  R('MD', 'Maryland', '2:0,3:1000,4:2000,4.75:3000,5:100000,5.25:125000,5.5:150000,5.75:250000,6.25:500000,6.5:1000000', '2:0,3:1000,4:2000,4.75:3000,5:150000,5.25:175000,5.5:225000,5.75:300000,6.25:600000,6.5:1200000', [3350, 6700], [3200, 6400]),
  R('MA', 'Massachusetts', '5:0,9:1083150', 'same', [0, 0], [4400, 8800]),
  R('MI', 'Michigan', '4.25:0', 'same', [0, 0], [5900, 11800]),
  R('MN', 'Minnesota', '5.35:0,6.8:33310,7.85:109430,9.85:203150', '5.35:0,6.8:48700,7.85:193480,9.85:337930', [15300, 30600]),
  R('MS', 'Mississippi', '4:10000', 'same', [2300, 4600], [6000, 12000]),
  R('MO', 'Missouri', '0:0,2:1348,2.5:2696,3:4044,3.5:5392,4:6740,4.5:8088,4.7:9436', 'same', [16100, 32200]),
  R('MT', 'Montana', '4.7:0,5.65:47500', '4.7:0,5.65:95000', [16100, 32200]),
  R('NE', 'Nebraska', '2.46:0,3.51:4130,4.55:24760', '2.46:0,3.51:8250,4.55:49530', [8850, 17700], [176, 352], 'credit'),
  R('NV', 'Nevada', '', ''),
  R('NH', 'New Hampshire', '', ''),
  R('NJ', 'New Jersey', '1.4:0,1.75:20000,3.5:35000,5.53:40000,6.37:75000,8.97:500000,10.75:1000000', '1.4:0,1.75:20000,2.45:50000,3.5:70000,5.53:80000,6.37:150000,8.97:500000,10.75:1000000', [0, 0], [1000, 2000]),
  R('NM', 'New Mexico', '1.5:0,3.2:5500,4.3:16500,4.7:33500,4.9:66500,5.9:210000', '1.5:0,3.2:8000,4.3:25000,4.7:50000,4.9:100000,5.9:315000', [16100, 32200]),
  R('NY', 'New York', '3.9:0,4.4:8500,5.15:11700,5.4:13900,5.9:80650,6.85:215400,9.65:1077550,10.3:5000000,10.9:25000000', '3.9:0,4.4:17150,5.15:23600,5.4:27900,5.9:161550,6.85:323200,9.65:2155350,10.3:5000000,10.9:25000000', [8000, 16050]),
  R('NC', 'North Carolina', '3.99:0', 'same', [12750, 25500]),
  R('ND', 'North Dakota', '0:0,1.95:48475,2.5:244825', '0:0,1.95:80975,2.5:298075', [16100, 32200]),
  R('OH', 'Ohio', '2.75:26050', 'same', [0, 0], [2400, 4800]),
  R('OK', 'Oklahoma', '0:0,2.5:3750,3.5:4900,4.5:7200', '0:0,2.5:7500,3.5:9800,4.5:14400', [6350, 12700], [1000, 2000]),
  R('OR', 'Oregon', '4.75:0,6.75:4550,8.75:11400,9.9:125000', '4.75:0,6.75:9100,8.75:22800,9.9:250000', [2910, 5820], [256, 512], 'credit'),
  R('PA', 'Pennsylvania', '3.07:0', 'same'),
  R('RI', 'Rhode Island', '3.75:0,4.75:82050,5.99:186450', 'same', [11200, 22400], [5250, 10500]),
  R('SC', 'South Carolina', '0:0,3:3640,6:18230', 'same', [8350, 16700]),
  R('SD', 'South Dakota', '', ''),
  R('TN', 'Tennessee', '', ''),
  R('TX', 'Texas', '', ''),
  R('UT', 'Utah', '4.5:0', 'same'),
  R('VT', 'Vermont', '3.35:0,6.6:49400,7.6:119700,8.75:249700', '3.35:0,6.6:82500,7.6:199450,8.75:304000', [7650, 15300], [5300, 10600]),
  R('VA', 'Virginia', '2:0,3:3000,5:5000,5.75:17000', 'same', [8750, 17500], [930, 1860]),
  R('WA', 'Washington', '', ''), // wage income not taxed (capital-gains tax only)
  R('WV', 'West Virginia', '2.22:0,2.96:10000,3.33:25000,4.44:40000,4.82:60000', 'same', [0, 0], [2000, 4000]),
  R('WI', 'Wisconsin', '3.5:0,4.4:15110,5.3:51950,7.65:332720', '3.5:0,4.4:20150,5.3:69260,7.65:443630', [13960, 25840], [700, 1400]),
  R('WY', 'Wyoming', '', ''),
];

const NOTES: Record<string, string> = {
  UT: 'Utah gives a taxpayer credit (966 single / 1,932 joint) instead of a deduction; its income phase-out is not modelled.',
  AL: 'Alabama deductions and exemptions phase down at higher incomes; not modelled.',
  CT: 'Connecticut exemption phase-out and tax recapture are not modelled.',
  SC: 'South Carolina top rate is scheduled to change on 1 July 2026; not modelled.',
  WA: 'Washington taxes capital gains only, not wages.',
  NH: 'New Hampshire does not tax wages.',
  MA: 'Massachusetts 4% surtax on income over about 1.08 million is shown as a 9% rate band.',
};

export const stateTaxes: StateTax[] = rows.map(([code, name, single, married, std, pe, peType]) => {
  const empty = single === '';
  const flat = !empty && !single.includes(',');
  const kind = empty ? 'none' : flat ? 'flat' : 'graduated';
  const utah = code === 'UT';
  return {
    code, name, kind,
    brackets: { single: empty ? [] : parse(single), married: empty ? [] : parse(married) },
    standardDeduction: utah ? { single: 966, married: 1932 } : { single: std[0], married: std[1] },
    exemption: { single: pe[0], married: pe[1], type: peType ?? 'deduction' },
    stdAsCredit: utah || undefined,
    note: NOTES[code],
  };
});
