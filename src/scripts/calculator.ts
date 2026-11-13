import { lazyDefs, type ToolDef } from '../lib/tools/lazy';
import { validate, type Values } from '../lib/tools/types';
import { resultHtml } from '../lib/results';

const root = document.querySelector<HTMLElement>('[data-calculator]');
if (root) void init(root);

async function init(root: HTMLElement) {
  const slug = root.dataset.slug!;
  const loader = lazyDefs[`./defs/${slug}.ts`];
  if (!loader) return;
  const { def } = await loader();
  const form = root.querySelector('form')!;
  const out = root.querySelector<HTMLElement>('[data-results]')!;
  const chartBox = root.querySelector<HTMLElement>('[data-chart]')!;
  let chartModule: Promise<typeof import('../lib/chart')> | null = null;
  let raf = 0;

  const el = (id: string) => form.elements.namedItem(id) as HTMLInputElement | HTMLSelectElement | null;
  const slider = (id: string) => form.querySelector<HTMLInputElement>(`input[type=range][data-for="${id}"]`);

  function read(): Values {
    const v: Values = {};
    for (const f of def.fields) {
      const e = el(f.id);
      v[f.id] = !e ? f.default : f.type === 'select' ? e.value : e.value.trim() === '' ? '' : Number(e.value);
    }
    return v;
  }
  function progress(r: HTMLInputElement) {
    const min = Number(r.min), max = Number(r.max);
    r.style.setProperty('--range-progress', `${Math.max(0, Math.min(100, ((Number(r.value) - min) / (max - min || 1)) * 100))}%`);
  }
  function currency(v: Values): string { return def.currency === 'select' ? (v.currency === 'INR' ? '₹' : '$') : def.currency === 'INR' ? '₹' : '$'; }

  function applyVisibility(v: Values) {
    form.querySelectorAll<HTMLElement>('[data-show-field]').forEach((w) => {
      const on = w.dataset.showIn!.split(',').includes(String(v[w.dataset.showField!]));
      w.hidden = !on;
    });
    const sym = currency(v);
    form.querySelectorAll('[data-cur]').forEach((s) => { s.textContent = sym; });
  }

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach((n) => (n.textContent = ''));
    form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field').forEach((n) => n.removeAttribute('aria-invalid-field'));
  }

  function run() {
    const v = read();
    applyVisibility(v);
    clearErrors();
    const err = validate(def.fields, v);
    if (err) {
      const e = el(err.id);
      e?.setAttribute('aria-invalid', 'true');
      const field = e?.closest('.field');
      field?.setAttribute('aria-invalid-field', 'true');
      const msg = field?.querySelector('.field-error');
      if (msg) msg.textContent = err.message;
      out.innerHTML = resultHtml({ error: err.message, headline: { label: '', value: '' }, rows: [], steps: [] });
      chartBox.innerHTML = '';
      return;
    }
    const r = def.compute(v);
    out.innerHTML = resultHtml(r);
    const mv = root.querySelector('[data-mobile-value]'); if (mv) mv.textContent = r.headline.value;
    const ml = root.querySelector('[data-mobile-result] small'); if (ml) ml.textContent = r.headline.label;
    if (r.chart) {
      chartModule ??= import('../lib/chart');
      chartModule.then((m) => { chartBox.innerHTML = m.chartHtml(r.chart); });
    } else chartBox.innerHTML = '';
  }
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.type === 'range') {
      const n = el(t.dataset.for!); if (n) n.value = t.value;
      progress(t);
    } else if (t.type === 'number') {
      const s = slider(t.name); if (s && t.value !== '') { s.value = t.value; progress(s); }
    }
    schedule();
  });
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLSelectElement;
    if (t.tagName === 'SELECT') {
      const f = def.fields.find((x) => x.id === t.name);
      const set = f?.options?.find((o) => o.value === t.value)?.set;
      if (set) for (const [k, val] of Object.entries(set)) {
        const n = el(k); if (n) n.value = String(val);
        const s = slider(k); if (s) { s.value = String(val); progress(s); }
      }
      schedule();
    }
  });
  // First paint is server-rendered from defaults; only re-run to attach state (e.g. restored form values).
  const initial = read();
  applyVisibility(initial);
  if (def.fields.some((f) => initial[f.id] !== f.default)) run();
}
