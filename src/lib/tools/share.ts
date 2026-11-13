import { ESTIMATE_NOTE, estimateLabel } from '../results';
import type { FieldDef, Result, Values } from './types';

/**
 * Shareable links keep the inputs in the query string, e.g. ?amount=800000&rate=9.5. Only values that differ from the
 * defaults are written. Nothing is sent anywhere: the link is built and read in the browser.
 */
export function buildShareQuery(fields: FieldDef[], v: Values): string {
  const p = new URLSearchParams();
  for (const f of fields) {
    const x = v[f.id];
    if (x === undefined || x === '' || String(x) === String(f.default)) continue;
    p.set(f.id, String(x));
  }
  return p.toString();
}

/**
 * Read inputs from a query string. Unknown names, unparseable numbers and select values that are not options are ignored;
 * numbers outside the allowed range are kept so the normal validation message explains the problem to the visitor.
 */
export function parseShareQuery(fields: FieldDef[], search: string): Partial<Values> {
  const p = new URLSearchParams(search);
  const out: Partial<Values> = {};
  for (const f of fields) {
    const raw = p.get(f.id);
    if (raw === null) continue;
    if (f.type === 'select') {
      if (f.options?.some((o) => o.value === raw)) out[f.id] = raw;
    } else if (raw.trim() !== '' && Number.isFinite(Number(raw))) out[f.id] = Number(raw);
  }
  return out;
}

/** Plain-text summary used by the "Copy results" button. */
export function resultText(title: string, url: string, fields: FieldDef[], v: Values, r: Result): string {
  const input = fields
    .filter((f) => !f.showIf || f.showIf.in.includes(String(v[f.showIf.field])))
    .map((f) => {
      const x = v[f.id];
      const shown = f.type === 'select' ? f.options?.find((o) => o.value === String(x))?.label ?? String(x) : `${x}${f.suffix && f.suffix !== '%' ? ' ' + f.suffix : f.suffix === '%' ? '%' : ''}`;
      return `- ${f.label}: ${shown}`;
    });
  return [
    title, ESTIMATE_NOTE, '',
    'Inputs', ...input, '',
    'Results',
    `${estimateLabel(r.headline.label)}: ${r.headline.value}`,
    ...r.rows.map((row) => `- ${row.label}: ${row.value}`),
    '', url,
  ].join('\n');
}
