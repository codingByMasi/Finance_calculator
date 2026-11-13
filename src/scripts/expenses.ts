import { addExpense, emptyBook, expensesCsv, fmtMinor, monthKey, monthSummary, monthsPresent, parseBook, removeExpense, STORAGE_KEY, type BookCurrency, type ExpenseBook } from '../lib/expenses';
import { chartHtml } from '../lib/chart';

const root = document.querySelector<HTMLElement>('[data-expense-app]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const form = $<HTMLFormElement>('[data-exp-form]');
  const dateEl = $<HTMLInputElement>('#exp-date'), amountEl = $<HTMLInputElement>('#exp-amount'), catEl = $<HTMLSelectElement>('#exp-category'), noteEl = $<HTMLInputElement>('#exp-note');
  const curEl = $<HTMLSelectElement>('#exp-currency'), monthEl = $<HTMLSelectElement>('#exp-month'), errEl = $('#exp-error');
  const summaryEl = $('[data-exp-summary]'), chartEl = $('[data-exp-chart]'), rowsEl = $('[data-exp-rows]'), statusEl = $('[data-exp-status]'), warnEl = $('[data-exp-storage]');
  let storageOk = true;
  let clearArmed = 0;

  const read = (): string | null => { try { return localStorage.getItem(STORAGE_KEY); } catch { storageOk = false; return null; } };
  const write = (b: ExpenseBook) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch { storageOk = false; } warnEl.hidden = storageOk; };
  let book = parseBook(read());
  warnEl.hidden = storageOk;

  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const say = (m: string) => { statusEl.textContent = m; window.setTimeout(() => { if (statusEl.textContent === m) statusEl.textContent = ''; }, 3500); };
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  dateEl.value = today();
  curEl.value = book.currency;
  let month = monthKey(today());

  function renderMonths() {
    const keys = [...new Set([monthKey(today()), ...monthsPresent(book)])].sort().reverse();
    if (!keys.includes(month)) month = keys[0];
    monthEl.replaceChildren(...keys.map((k) => {
      const o = document.createElement('option'); o.value = k;
      const [y, m] = k.split('-').map(Number);
      o.textContent = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
      o.selected = k === month; return o;
    }));
  }

  function render() {
    renderMonths();
    const s = monthSummary(book, month);
    const c: BookCurrency = book.currency;
    summaryEl.replaceChildren();
    const top = document.createElement('div'); top.className = 'result-top';
    const l = document.createElement('span'); l.textContent = 'Total spent this month';
    const v = document.createElement('strong'); v.textContent = fmtMinor(s.total, c);
    top.append(l, v);
    const dl = document.createElement('dl'); dl.className = 'result-breakdown';
    const addRow = (k: string, val: string, strong = false) => { const d = document.createElement('div'); if (strong) d.className = 'strong'; const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = val; d.append(dt, dd); dl.append(d); };
    addRow('Entries', String(s.count));
    s.byCategory.forEach((x, i) => addRow(x.category, `${fmtMinor(x.minor, c)} (${s.total ? ((x.minor / s.total) * 100).toFixed(1) : '0'}%)`, i === 0));
    summaryEl.append(top, dl);
    chartEl.innerHTML = s.total ? chartHtml({ kind: 'donut', title: 'Spending by category', currency: c, segments: s.byCategory.map((x) => ({ label: x.category, value: x.minor / 100 })) }) : '';
    rowsEl.replaceChildren(...s.entries.map((e) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = e.date;
      const cat = document.createElement('td'); cat.textContent = e.category;
      const note = document.createElement('td'); note.textContent = e.note; note.style.whiteSpace = 'normal';
      const amt = document.createElement('td'); amt.textContent = fmtMinor(e.minor, c);
      const act = document.createElement('td');
      const del = document.createElement('button'); del.type = 'button'; del.className = 'text-button'; del.textContent = 'Delete';
      del.setAttribute('aria-label', `Delete ${e.category} ${fmtMinor(e.minor, c)} on ${e.date}`);
      del.addEventListener('click', () => { book = removeExpense(book, e.id); write(book); render(); say('Entry deleted.'); });
      act.append(del); tr.append(th, cat, note, amt, act); return tr;
    }));
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const r = addExpense(book, { date: dateEl.value, amount: amountEl.valueAsNumber, category: catEl.value, note: noteEl.value }, newId());
    if (!r.ok) { errEl.textContent = r.error; amountEl.setAttribute('aria-invalid', 'true'); return; }
    errEl.textContent = ''; amountEl.removeAttribute('aria-invalid');
    book = r.book; write(book);
    month = monthKey(dateEl.value);
    amountEl.value = ''; noteEl.value = '';
    render(); say('Expense added.'); amountEl.focus();
  });
  curEl.addEventListener('change', () => { book = { ...book, currency: curEl.value === 'INR' ? 'INR' : 'USD' }; write(book); render(); });
  monthEl.addEventListener('change', () => { month = monthEl.value; render(); });

  const download = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  root.querySelectorAll<HTMLElement>('[data-exp-export]').forEach((b) => b.addEventListener('click', () => {
    const all = b.dataset.expExport === 'all';
    if (!book.expenses.length) { say('There is nothing to export yet.'); return; }
    download(all ? 'expenses.csv' : `expenses-${month}.csv`, expensesCsv(book, all ? undefined : month));
  }));
  const clearBtn = $<HTMLButtonElement>('[data-exp-clear]');
  clearBtn.addEventListener('click', () => {
    if (!book.expenses.length) { say('There is nothing to delete.'); return; }
    if (!clearArmed) {
      clearBtn.textContent = 'Press again to delete everything';
      say('This deletes every entry in this browser. Press the button again within 5 seconds to confirm.');
      clearArmed = window.setTimeout(() => { clearArmed = 0; clearBtn.textContent = 'Delete all entries'; }, 5000);
      return;
    }
    window.clearTimeout(clearArmed); clearArmed = 0; clearBtn.textContent = 'Delete all entries';
    book = emptyBook(book.currency); write(book); render(); say('All entries deleted.');
  });
  render();
}
