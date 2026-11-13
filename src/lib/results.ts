import type { Result } from './tools/types';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Shown under every result, on screen, in copied text and in print. */
export const ESTIMATE_NOTE = 'Estimate only. Actual amounts may differ.';

/**
 * Headline labels always read as estimates: "Monthly EMI" becomes "Estimated monthly EMI".
 * Labels that already start with "Estimated" or "Approx" are left alone. The first letter is lower-cased only when the
 * second letter is lower case, so acronyms such as "EMI" or "GST" keep their capitals.
 */
export function estimateLabel(label: string): string {
  const t = label.trim();
  if (!t) return t;
  if (/^(estimated|estimate|approx)/i.test(t)) return t;
  const lowered = /^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
  return `Estimated ${lowered}`;
}

/** Result markup (without chart). Shared by build-time render and the browser. */
export function resultHtml(r: Result): string {
  if (r.error) return `<div class="result-top"><p class="result-error" role="alert">${esc(r.error)}</p></div>`;
  return `<div class="result-top"><span>${esc(estimateLabel(r.headline.label))}</span><strong>${esc(r.headline.value)}</strong></div>
<dl class="result-breakdown">${r.rows.map((row) => `<div class="${row.strong ? 'strong' : ''}"><dt>${esc(row.label)}</dt><dd>${esc(row.value)}</dd></div>`).join('')}</dl>
${(r.notes ?? []).map((n) => `<p class="result-note">${esc(n)}</p>`).join('')}<p class="estimate-note">${esc(ESTIMATE_NOTE)}</p>`;
}
