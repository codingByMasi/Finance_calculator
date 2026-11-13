import { money } from './format';
import type { ScheduleSpec } from './tools/types';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** CSV text for the payment table. Plain numbers with two decimals so spreadsheets read them as numbers. */
export function scheduleCsv(s: ScheduleSpec): string {
  const f = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
  return ['Month,Payment,Principal,Interest,Remaining balance', ...s.rows.map((r) => `${r.n},${f(r.payment)},${f(r.principal)},${f(r.interest)},${f(r.balance)}`)].join('\n') + '\n';
}

/** Expandable month-by-month table with a download button. Empty string when there are no payments. */
export function scheduleHtml(s: ScheduleSpec | undefined): string {
  if (!s || s.rows.length === 0) return '';
  const m = (n: number) => esc(money(n, s.currency, 2));
  const body = s.rows.map((r) => `<tr><th scope="row">${r.n}</th><td>${m(r.payment)}</td><td>${m(r.principal)}</td><td>${m(r.interest)}</td><td>${m(r.balance)}</td></tr>`).join('');
  return `<details class="schedule"><summary>Month-by-month payment table (${s.rows.length} payments)</summary>
<p class="schedule-actions"><button type="button" class="text-button" data-download-csv>Download CSV</button><span class="hint">Estimates only. Your lender's schedule is the reference.</span></p>
<div class="table-scroll" tabindex="0" role="region" aria-label="Payment table"><table class="schedule-table"><thead><tr><th scope="col">Month</th><th scope="col">Payment</th><th scope="col">Principal</th><th scope="col">Interest</th><th scope="col">Balance</th></tr></thead><tbody>${body}</tbody></table></div></details>`;
}
