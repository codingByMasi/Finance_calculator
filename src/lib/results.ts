import type { Result } from './tools/types';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Result markup (without chart). Shared by build-time render and the browser. */
export function resultHtml(r: Result): string {
  if (r.error) return `<div class="result-top"><p class="result-error" role="alert">${esc(r.error)}</p></div>`;
  return `<div class="result-top"><span>${esc(r.headline.label)}</span><strong>${esc(r.headline.value)}</strong></div>
<dl class="result-breakdown">${r.rows.map((row) => `<div class="${row.strong ? 'strong' : ''}"><dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd></div>`).join('')}</dl>
${(r.notes ?? []).map((n) => `<p class="result-note">${esc(n)}</p>`).join('')}`;
}
