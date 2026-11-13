import { lazyDefs, type ToolDef } from '../lib/tools/lazy';
import { validate, type Values } from '../lib/tools/types';
import { resultHtml, estimateLabel } from '../lib/results';
import { scheduleHtml, scheduleCsv } from '../lib/schedule';
import { buildShareQuery, parseShareQuery, resultText } from '../lib/tools/share';

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
  const scheduleBox = root.querySelector<HTMLElement>('[data-schedule]');
  const statusEl = root.querySelector<HTMLElement>('[data-share-status]');
  let lastResult: ReturnType<ToolDef['compute']> | null = null;
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
      if (scheduleBox) scheduleBox.innerHTML = '';
      lastResult = null;
        return;
    }
    const r = def.compute(v);
    lastResult = r;
    if (scheduleBox) {
      const wasOpen = scheduleBox.querySelector('details')?.open ?? false;
      scheduleBox.innerHTML = scheduleHtml(r.schedule);
      if (wasOpen) scheduleBox.querySelector('details')?.setAttribute('open', '');
    }
    out.innerHTML = resultHtml(r);
    const mv = root.querySelector('[data-mobile-value]'); if (mv) mv.textContent = r.headline.value;
    const ml = root.querySelector('[data-mobile-result] small'); if (ml) ml.textContent = estimateLabel(r.headline.label);
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

  // ---- shareable link: the link is built only when the visitor presses "Copy link". Inputs are never put in the address
  // bar automatically, so analytics or ad scripts cannot read them from the page URL.
  function say(msg: string) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    window.setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 3000);
  }
  async function copy(text: string, ok: string) {
    try { await navigator.clipboard.writeText(text); say(ok); return; } catch { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let done = false;
    try { done = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
    say(done ? ok : 'Copy is not available in this browser.');
  }
  const pageUrl = () => location.origin + location.pathname + (buildShareQuery(def.fields, read()) ? '?' + buildShareQuery(def.fields, read()) : '');
  root.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-share], [data-download-csv]');
    if (!t) return;
    if (t.matches('[data-download-csv]')) {
      const sch = lastResult?.schedule ?? def.compute(read()).schedule;
      if (!sch) return;
      const blob = new Blob([scheduleCsv(sch)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${sch.filename}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    const kind = t.dataset.share;
    if (kind === 'print') { window.print(); return; }
    if (kind === 'link') { void copy(pageUrl(), 'Link copied.'); return; }
    if (kind === 'text') {
      const v = read();
      if (validate(def.fields, v)) { say('Fix the highlighted input first.'); return; }
      void copy(resultText(document.querySelector('h1')?.textContent ?? 'Calculator', pageUrl(), def.fields, v, def.compute(v)), 'Results copied.');
    }
  });

  // Inputs from a shared link
  {
    const fromUrl = parseShareQuery(def.fields, location.search);
    for (const [k, val] of Object.entries(fromUrl)) {
      const n = el(k); if (n) n.value = String(val);
      const sl = slider(k); if (sl) { sl.value = String(val); progress(sl); }
    }
    // Remove the inputs from the address bar straight away so third-party scripts never see them
    if (location.search) { try { history.replaceState(null, '', location.pathname + location.hash); } catch { /* ignore */ } }
  }
  // First paint is server-rendered from defaults; only re-run to attach state (e.g. restored form values).
  const initial = read();
  applyVisibility(initial);
  if (def.fields.some((f) => initial[f.id] !== f.default)) run();
}
