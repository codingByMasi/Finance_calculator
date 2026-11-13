import { describe, it, expect } from 'vitest';
import { splitBill, convert, rateBetween, ageInDays } from '../src/lib/calc/split';
import { parseBook, addExpense, removeExpense, monthSummary, monthsPresent, expensesCsv, csvCell, toMinor, isIsoDate, emptyBook, fmtMinor, MAX_NOTE } from '../src/lib/expenses';
import { buildIcs, foldLine, icsEscape, nextDay } from '../src/lib/ics';
import { deadlines, officialHosts } from '../src/config/deadlines';
import { validateFx, toSnapshot, FX_CURRENCIES } from '../scripts/lib/fx.mjs';
import fx from '../src/data/fx-rates.json';

describe('bill split and tip', () => {
  it('splits tip and total evenly', () => {
    const r = splitBill({ bill: 120, tipPercent: 18, people: 4, roundUp: false });
    expect(r.tip).toBeCloseTo(21.6, 9);
    expect(r.total).toBeCloseTo(141.6, 9);
    expect(r.perPerson).toBeCloseTo(35.4, 9);
  });
  it('rounding up collects slightly more and reports the extra', () => {
    const r = splitBill({ bill: 100, tipPercent: 10, people: 3, roundUp: true });
    expect(r.perPerson).toBeCloseTo(36.6667, 4);
    expect(r.perPersonPaid).toBe(37);
    expect(r.extraFromRounding).toBeCloseTo(111 - 110, 9);
  });
  it('an exact whole share is not bumped up', () => {
    expect(splitBill({ bill: 100, tipPercent: 0, people: 4, roundUp: true }).perPersonPaid).toBe(25);
  });
  it('edge cases: zero people, negative bill, 0% tip', () => {
    expect(splitBill({ bill: 50, tipPercent: 0, people: 0, roundUp: false }).perPerson).toBe(50);
    expect(splitBill({ bill: -5, tipPercent: 10, people: 2, roundUp: false }).total).toBe(0);
  });
});

describe('currency conversion', () => {
  const t = { base: 'EUR', date: '2026-01-01', rates: { EUR: 1, USD: 1.25, INR: 100 } };
  it('converts through the base currency', () => {
    expect(convert(100, 'USD', 'INR', t)).toBeCloseTo(8000, 9);
    expect(convert(100, 'EUR', 'USD', t)).toBeCloseTo(125, 9);
    expect(convert(50, 'USD', 'USD', t)).toBeCloseTo(50, 9);
  });
  it('round trip returns the start', () => {
    expect(convert(convert(321.5, 'USD', 'INR', t), 'INR', 'USD', t)).toBeCloseTo(321.5, 9);
    expect(rateBetween('USD', 'INR', t) * rateBetween('INR', 'USD', t)).toBeCloseTo(1, 12);
  });
  it('unknown codes give NaN, negative amounts give 0', () => {
    expect(convert(1, 'XXX', 'USD', t)).toBeNaN();
    expect(convert(-5, 'USD', 'INR', t)).toBe(0);
  });
  it('ageInDays', () => {
    expect(ageInDays('2026-01-01', new Date('2026-01-08T10:00:00Z'))).toBe(7);
    expect(ageInDays('2026-01-08', new Date('2026-01-01T00:00:00Z'))).toBe(0);
    expect(ageInDays('nope', new Date())).toBe(Infinity);
  });
  it('the shipped snapshot is valid and covers every currency', () => {
    expect(validateFx(fx, null, '2099-01-01')).toEqual([]);
    for (const c of FX_CURRENCIES) expect(fx.rates).toHaveProperty(c);
  });
});

describe('fx validation', () => {
  const good = { base: 'EUR', date: '2026-05-02', rates: Object.fromEntries(FX_CURRENCIES.map((c) => [c, 1])) };
  it('accepts a good snapshot', () => expect(validateFx(good, null, '2026-05-03')).toEqual([]));
  it('rejects wrong base, bad date, future date, older date', () => {
    expect(validateFx({ ...good, base: 'USD' }, null, '2026-05-03')).not.toEqual([]);
    expect(validateFx({ ...good, date: '2026/05/02' }, null, '2026-05-03')).not.toEqual([]);
    expect(validateFx({ ...good, date: '2026-06-01' }, null, '2026-05-03')).toContain('date is in the future');
    expect(validateFx(good, { ...good, date: '2026-05-10' }, '2026-05-20')).toContain('date is older than the stored snapshot');
  });
  it('rejects missing, zero, negative and NaN rates', () => {
    for (const bad of [undefined, 0, -1, NaN, 'x']) expect(validateFx({ ...good, rates: { ...good.rates, INR: bad } }, null, '2026-05-03').length).toBeGreaterThan(0);
  });
  it('rejects a one-day move of more than 25%', () => {
    expect(validateFx({ ...good, rates: { ...good.rates, INR: 1.3 } }, good, '2026-05-03').some((e) => /INR moved/.test(e))).toBe(true);
    expect(validateFx({ ...good, rates: { ...good.rates, INR: 1.1 } }, good, '2026-05-03')).toEqual([]);
  });
  it('toSnapshot keeps only the supported currencies and adds EUR = 1', () => {
    const s = toSnapshot({ base: 'EUR', date: '2026-05-02', rates: { USD: 1.1, INR: 90, GBP: 0.8, JPY: 160, CAD: 1.5, AUD: 1.6, SGD: 1.4, CHF: 0.95, CNY: 7.2, ZZZ: 3 } });
    expect(s.rates.EUR).toBe(1);
    expect(s.rates).not.toHaveProperty('ZZZ');
  });
});

describe('expense tracker', () => {
  const add = (b: ReturnType<typeof emptyBook>, date: string, amount: number, category: string, note = '', id = String(b.expenses.length + 1)) => {
    const r = addExpense(b, { date, amount, category, note }, id);
    if (!r.ok) throw new Error(r.error);
    return r.book;
  };
  it('stores amounts in minor units so sums are exact', () => {
    let b = emptyBook('USD');
    for (let i = 0; i < 10; i++) b = add(b, '2026-03-05', 0.1, 'Food');
    expect(monthSummary(b, '2026-03').total).toBe(100);
    expect(toMinor(19.99)).toBe(1999);
  });
  it('validates input', () => {
    const b = emptyBook();
    expect(addExpense(b, { date: '2026-02-30', amount: 5, category: 'Food', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: 0, category: 'Food', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: -2, category: 'Food', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: NaN, category: 'Food', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: 5, category: 'Gold', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: 0.004, category: 'Food', note: '' }, 'a').ok).toBe(false);
    expect(addExpense(b, { date: '2026-02-03', amount: 1e10, category: 'Food', note: '' }, 'a').ok).toBe(false);
  });
  it('monthly summary groups by category, sorts largest first, and limits to the month', () => {
    let b = emptyBook('INR');
    b = add(b, '2026-03-01', 500, 'Food'); b = add(b, '2026-03-09', 1200, 'Housing'); b = add(b, '2026-03-10', 300, 'Food'); b = add(b, '2026-04-01', 99, 'Other');
    const s = monthSummary(b, '2026-03');
    expect(s.total).toBe(200000);
    expect(s.count).toBe(3);
    expect(s.byCategory.map((x) => x.category)).toEqual(['Housing', 'Food']);
    expect(s.byCategory[1].minor).toBe(80000);
    expect(monthsPresent(b)).toEqual(['2026-04', '2026-03']);
    expect(monthSummary(b, '2025-01')).toMatchObject({ total: 0, count: 0, byCategory: [] });
  });
  it('removes an entry', () => {
    let b = add(emptyBook(), '2026-03-01', 5, 'Food', '', 'x');
    b = removeExpense(b, 'x');
    expect(b.expenses).toEqual([]);
  });
  it('parseBook survives garbage and drops bad entries', () => {
    expect(parseBook(null).expenses).toEqual([]);
    expect(parseBook('not json').expenses).toEqual([]);
    expect(parseBook('{"expenses": 5}').expenses).toEqual([]);
    const raw = JSON.stringify({ v: 1, currency: 'INR', expenses: [
      { id: 'a', date: '2026-03-01', minor: 500, category: 'Food', note: 'ok' },
      { id: 'a', date: '2026-03-01', minor: 500, category: 'Food', note: 'duplicate id' },
      { id: 'b', date: '2026-13-01', minor: 500, category: 'Food', note: '' },
      { id: 'c', date: '2026-03-01', minor: -5, category: 'Food', note: '' },
      { id: 'd', date: '2026-03-01', minor: 5.5, category: 'Food', note: '' },
      { id: 'e', date: '2026-03-01', minor: 500, category: 'Nope', note: '' },
      { id: 'f', date: '2026-03-01', minor: 500, category: 'Food', note: 'x'.repeat(500) },
      null, 7,
    ] });
    const b = parseBook(raw);
    expect(b.currency).toBe('INR');
    expect(b.expenses.map((e) => e.id)).toEqual(['a', 'f']);
    expect(b.expenses[1].note).toHaveLength(MAX_NOTE);
  });
  it('CSV neutralises spreadsheet formulas and quotes commas and quotes', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('plain')).toBe('plain');
    const b = add(emptyBook('USD'), '2026-03-01', 12.5, 'Food', '=cmd|calc');
    const csv = expensesCsv(b);
    expect(csv.split('\n')[0]).toBe('Date,Category,Amount,Currency,Note');
    expect(csv.split('\n')[1]).toBe("2026-03-01,Food,12.50,USD,'=cmd|calc");
  });
  it('date validation and money formatting', () => {
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(fmtMinor(123456, 'USD')).toBe('$1,234.56');
    expect(fmtMinor(123456, 'INR')).toContain('1,234.56');
  });
});

describe('iCalendar output', () => {
  const ev = { id: 'x1', date: '2026-04-15', title: 'Pay tax, part 1; see notes', description: 'Line one\nLine two', url: 'https://www.irs.gov/' };
  const ics = buildIcs([ev], { calendarName: 'Dates', host: 'example.com', now: new Date('2026-11-13T10:20:30.456Z'), reminderDaysBefore: 3 });
  it('has the required structure with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('UID:x1@example.com');
    expect(ics).toContain('DTSTAMP:20261113T102030Z');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260415');
    expect(ics).toContain('DTEND;VALUE=DATE:20260416');
    expect(ics).toContain('TRIGGER:-P3D');
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
  });
  it('escapes commas, semicolons and newlines', () => {
    expect(ics).toContain('SUMMARY:Pay tax\\, part 1\; see notes');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
    expect(icsEscape('a\\b')).toBe('a\\\\b');
  });
  it('folds long lines at 75 octets without splitting characters', () => {
    const long = 'SUMMARY:' + 'é'.repeat(100);
    const folded = foldLine(long);
    for (const l of folded.split('\r\n')) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.split('\r\n').map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(long);
  });
  it('year-end DTEND rolls over correctly and no alarm without a reminder', () => {
    expect(nextDay('2026-12-31')).toBe('2027-01-01');
    expect(nextDay('2028-02-28')).toBe('2028-02-29');
    expect(buildIcs([ev], { calendarName: 'x', host: 'h', now: new Date() })).not.toContain('VALARM');
  });
});

describe('deadline data', () => {
  it('every listed date has a real date, an official https source and a unique id', () => {
    const ids = deadlines.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of deadlines.events) {
      expect(isIsoDate(e.date), e.id).toBe(true);
      const u = new URL(e.source.url);
      expect(u.protocol).toBe('https:');
      expect(officialHosts.some((h) => u.hostname === h || u.hostname.endsWith('.' + h)), `${e.id} must cite an official host`).toBe(true);
    }
  });
  it('India dates are not listed until confirmed, and the gaps are shown as pending', () => {
    expect(deadlines.events.filter((e) => e.country === 'in')).toEqual([]);
    expect(deadlines.pending.some((p) => p.country === 'in')).toBe(true);
  });
});
