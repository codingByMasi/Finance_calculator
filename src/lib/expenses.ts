/** Expense tracker logic. Amounts are stored as whole minor units (cents or paise) so sums have no floating-point drift. */
export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Shopping', 'Entertainment', 'Education', 'Other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type BookCurrency = 'INR' | 'USD';

export interface Expense { id: string; date: string; minor: number; category: ExpenseCategory; note: string }
export interface ExpenseBook { v: 1; currency: BookCurrency; expenses: Expense[] }
export const STORAGE_KEY = 'fch_expenses_v1';
export const MAX_NOTE = 120;
export const MAX_AMOUNT = 1_000_000_000;
export const MAX_ENTRIES = 5000;

export const emptyBook = (currency: BookCurrency = 'USD'): ExpenseBook => ({ v: 1, currency, expenses: [] });
export const toMinor = (amount: number): number => Math.round(amount * 100);

/** True for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
const isCategory = (c: unknown): c is ExpenseCategory => (EXPENSE_CATEGORIES as readonly string[]).includes(c as string);

/** Read what was stored. Anything malformed is dropped rather than trusted. Never throws. */
export function parseBook(raw: string | null | undefined): ExpenseBook {
  if (!raw) return emptyBook();
  try {
    const o = JSON.parse(raw) as Partial<ExpenseBook>;
    const currency: BookCurrency = o.currency === 'INR' ? 'INR' : 'USD';
    const list = Array.isArray(o.expenses) ? o.expenses : [];
    const seen = new Set<string>();
    const expenses: Expense[] = [];
    for (const e of list) {
      if (!e || typeof e !== 'object') continue;
      const x = e as Expense;
      if (typeof x.id !== 'string' || seen.has(x.id) || !isIsoDate(x.date) || !Number.isInteger(x.minor) || x.minor <= 0 || x.minor > MAX_AMOUNT * 100 || !isCategory(x.category)) continue;
      seen.add(x.id);
      expenses.push({ id: x.id, date: x.date, minor: x.minor, category: x.category, note: typeof x.note === 'string' ? x.note.slice(0, MAX_NOTE) : '' });
      if (expenses.length >= MAX_ENTRIES) break;
    }
    return { v: 1, currency, expenses };
  } catch { return emptyBook(); }
}

export interface NewExpense { date: string; amount: number; category: string; note: string }
export type AddResult = { ok: true; book: ExpenseBook } | { ok: false; error: string };
export function addExpense(book: ExpenseBook, input: NewExpense, id: string): AddResult {
  if (!isIsoDate(input.date)) return { ok: false, error: 'Enter a valid date.' };
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { ok: false, error: 'Enter an amount greater than zero.' };
  if (input.amount > MAX_AMOUNT) return { ok: false, error: 'That amount is too large.' };
  if (!isCategory(input.category)) return { ok: false, error: 'Choose a category.' };
  if (book.expenses.length >= MAX_ENTRIES) return { ok: false, error: `You can keep up to ${MAX_ENTRIES} entries. Export and clear older ones first.` };
  const minor = toMinor(input.amount);
  if (minor <= 0) return { ok: false, error: 'Enter an amount of at least 0.01.' };
  const e: Expense = { id, date: input.date, minor, category: input.category, note: input.note.trim().slice(0, MAX_NOTE) };
  return { ok: true, book: { ...book, expenses: [...book.expenses, e] } };
}
export const removeExpense = (book: ExpenseBook, id: string): ExpenseBook => ({ ...book, expenses: book.expenses.filter((e) => e.id !== id) });

export const monthKey = (date: string): string => date.slice(0, 7);
/** Months that have entries, newest first. */
export const monthsPresent = (book: ExpenseBook): string[] => [...new Set(book.expenses.map((e) => monthKey(e.date)))].sort().reverse();

export interface MonthSummary { total: number; count: number; byCategory: { category: ExpenseCategory; minor: number }[]; entries: Expense[] }
/** Totals for one month (YYYY-MM). Categories with no spending are left out; the rest are sorted largest first. */
export function monthSummary(book: ExpenseBook, key: string): MonthSummary {
  const entries = book.expenses.filter((e) => monthKey(e.date) === key).sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : b.date.localeCompare(a.date)));
  const by = new Map<ExpenseCategory, number>();
  for (const e of entries) by.set(e.category, (by.get(e.category) ?? 0) + e.minor);
  return {
    total: entries.reduce((s, e) => s + e.minor, 0), count: entries.length, entries,
    byCategory: [...by.entries()].map(([category, minor]) => ({ category, minor })).sort((a, b) => b.minor - a.minor || a.category.localeCompare(b.category)),
  };
}

export function fmtMinor(minor: number, currency: BookCurrency): string {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minor / 100);
}

/** Prefix cells a spreadsheet could read as a formula, then quote the cell if needed. */
export function csvCell(s: string): string {
  const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
export function expensesCsv(book: ExpenseBook, key?: string): string {
  const list = (key ? book.expenses.filter((e) => monthKey(e.date) === key) : [...book.expenses]).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return ['Date,Category,Amount,Currency,Note', ...list.map((e) => [e.date, e.category, (e.minor / 100).toFixed(2), book.currency, csvCell(e.note)].join(','))].join('\n') + '\n';
}
