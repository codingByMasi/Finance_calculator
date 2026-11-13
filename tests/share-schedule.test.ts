import { describe, it, expect } from 'vitest';
import { buildShareQuery, parseShareQuery, resultText } from '../src/lib/tools/share';
import { scheduleCsv, scheduleHtml } from '../src/lib/schedule';
import { amortizationSchedule } from '../src/lib/calc/loan';
import { estimateLabel, resultHtml, ESTIMATE_NOTE } from '../src/lib/results';
import { def } from '../src/lib/tools/defs/emi-calculator';
import { defaults } from '../src/lib/tools/types';

const f = def.fields;
describe('share links', () => {
  it('writes only non-default values and reads them back', () => {
    const v = { ...defaults(f), amount: 800000, rate: 9.5, type: 'car' };
    const q = buildShareQuery(f, v);
    expect(q).toContain('amount=800000');
    expect(q).not.toContain('years=');
    expect(parseShareQuery(f, '?' + q)).toEqual({ amount: 800000, rate: 9.5, type: 'car' });
  });
  it('defaults produce an empty query', () => expect(buildShareQuery(f, defaults(f))).toBe(''));
  it('ignores unknown names, junk numbers and unknown select options', () => {
    expect(parseShareQuery(f, '?evil=1&amount=abc&rate=&type=boat&years=10')).toEqual({ years: 10 });
  });
  it('keeps out-of-range numbers so validation can explain them', () => {
    expect(parseShareQuery(f, '?rate=999')).toEqual({ rate: 999 });
  });
  it('never turns markup into values', () => {
    expect(parseShareQuery(f, '?amount=<script>')).toEqual({});
  });
  it('copied text carries the estimate note, inputs and link', () => {
    const v = defaults(f);
    const t = resultText('EMI Calculator', 'https://x.test/emi-calculator/', f, v, def.compute(v));
    expect(t).toContain(ESTIMATE_NOTE);
    expect(t).toContain('- Loan amount: 5000000');
    expect(t).toContain('Estimated monthly EMI');
    expect(t.endsWith('https://x.test/emi-calculator/')).toBe(true);
  });
});

describe('schedule table and CSV', () => {
  const spec = { currency: 'USD' as const, filename: 'x', rows: amortizationSchedule(1200, 12, 12) };
  it('CSV has a header, one row per month and plain numbers', () => {
    const lines = scheduleCsv(spec).trim().split('\n');
    expect(lines[0]).toBe('Month,Payment,Principal,Interest,Remaining balance');
    expect(lines).toHaveLength(13);
    expect(lines[1].split(',')).toHaveLength(5);
    expect(lines.at(-1)!.endsWith(',0.00')).toBe(true);
    expect(scheduleCsv(spec)).not.toContain('$');
  });
  it('HTML table is accessible and empty schedules render nothing', () => {
    const h = scheduleHtml(spec);
    expect(h).toContain('<th scope="col">Month</th>');
    expect(h).toContain('data-download-csv');
    expect(scheduleHtml({ ...spec, rows: [] })).toBe('');
    expect(scheduleHtml(undefined)).toBe('');
  });
});

describe('estimate wording', () => {
  it('prefixes labels and keeps acronyms', () => {
    expect(estimateLabel('Monthly EMI')).toBe('Estimated monthly EMI');
    expect(estimateLabel('EMI')).toBe('Estimated EMI');
    expect(estimateLabel('GST amount')).toBe('Estimated GST amount');
    expect(estimateLabel('Estimated maturity value')).toBe('Estimated maturity value');
    expect(estimateLabel('Approx. take-home')).toBe('Approx. take-home');
  });
  it('every result shows the estimate note', () => {
    expect(resultHtml(def.compute(defaults(f)))).toContain(ESTIMATE_NOTE);
  });
});
