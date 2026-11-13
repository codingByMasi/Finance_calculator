import { compact, money, type Currency } from './format';
import type { ChartSpec } from './tools/types';

// Colours come from CSS variables (--c1..--c5) defined per theme, each >= 3:1 against its background.
const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function legend(items: { label: string; color: string; extra?: string }[]): string {
  return `<ul class="chart-legend">${items.map((i) => `<li><span class="swatch" style="background:${i.color}"></span>${esc(i.label)}${i.extra ? ` <span class="legend-extra">${esc(i.extra)}</span>` : ''}</li>`).join('')}</ul>`;
}

function donut(spec: Extract<ChartSpec, { kind: 'donut' }>): string {
  const segs = spec.segments.filter((s) => s.value > 0 && Number.isFinite(s.value));
  const total = segs.reduce((a, s) => a + s.value, 0);
  if (!total) return '';
  const R = 15.9155; // circumference = 100
  let offset = 25;
  const arcs = segs.map((s, i) => {
    const p = (s.value / total) * 100;
    const el = `<circle cx="21" cy="21" r="${R}" fill="none" style="stroke:${COLORS[i % COLORS.length]}" stroke-width="6" stroke-dasharray="${p} ${100 - p}" stroke-dashoffset="${offset}"/>`;
    offset -= p;
    return el;
  }).join('');
  const label = `${spec.title}: ` + segs.map((s) => `${s.label} ${money(s.value, spec.currency)}`).join(', ');
  const svg = `<svg viewBox="0 0 42 42" class="donut" role="img" aria-label="${esc(label)}"><circle cx="21" cy="21" r="${R}" fill="none" stroke="currentColor" stroke-opacity=".08" stroke-width="6"/>${arcs}</svg>`;
  const leg = legend(segs.map((s, i) => ({ label: s.label, color: COLORS[i % COLORS.length], extra: `${money(s.value, spec.currency)} (${((s.value / total) * 100).toFixed(1)}%)` })));
  return `<div class="chart-donut">${svg}${leg}</div>`;
}

function line(spec: Extract<ChartSpec, { kind: 'line' }>): string {
  const W = 480, H = 220, L = 58, R = 12, T = 12, B = 34;
  const all = spec.series.flatMap((s) => s.values).filter(Number.isFinite);
  const max = Math.max(...all, 1);
  const xs = spec.xs;
  const x = (i: number) => L + (xs.length === 1 ? 0 : (i / (xs.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - v / max) * (H - T - B);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = max * f, yy = y(v);
    return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="currentColor" stroke-opacity=".12"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end" font-size="10" fill="currentColor" fill-opacity=".75">${esc(compact(v, spec.currency))}</text>`;
  }).join('');
  const step = Math.max(1, Math.ceil(xs.length / 8));
  const xl = xs.map((v, i) => (i % step === 0 || i === xs.length - 1) ? `<text x="${x(i)}" y="${H - 14}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".75">${v}</text>` : '').join('');
  const lines = spec.series.map((s, k) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" style="stroke:${COLORS[k % COLORS.length]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
  }).join('');
  const last = spec.series.map((s) => `${s.name} ${money(s.values[s.values.length - 1] ?? 0, spec.currency)}`).join(', ');
  const label = `${spec.title}. Final ${spec.xLabel.toLowerCase()} ${xs[xs.length - 1]}: ${last}`;
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="linechart" role="img" aria-label="${esc(label)}">${grid}${xl}<text x="${(L + W - R) / 2}" y="${H - 1}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity=".75">${esc(spec.xLabel)}</text>${lines}</svg>`;
  const leg = spec.series.length > 1 ? legend(spec.series.map((s, k) => ({ label: s.name, color: COLORS[k % COLORS.length] }))) : '';
  return `<div class="chart-line">${svg}${leg}</div>`;
}

export function chartHtml(spec: ChartSpec | undefined): string {
  if (!spec) return '';
  const body = spec.kind === 'donut' ? donut(spec) : line(spec);
  return body ? `<figure class="chart"><figcaption>${esc(spec.title)}</figcaption>${body}</figure>` : '';
}
export type { Currency };
