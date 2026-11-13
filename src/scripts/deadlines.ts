import { buildIcs, type IcsEvent } from '../lib/ics';

interface Ev { id: string; country: 'in' | 'us'; date: string; title: string; who: string; note: string; source: { label: string; url: string } }
const root = document.querySelector<HTMLElement>('[data-deadline-app]');
if (root) {
  const events: Ev[] = JSON.parse(document.getElementById('deadline-data')!.textContent || '[]');
  const countryEl = root.querySelector<HTMLSelectElement>('#dl-country')!, reminderEl = root.querySelector<HTMLSelectElement>('#dl-reminder')!, pastEl = root.querySelector<HTMLInputElement>('#dl-past')!;
  const emptyEl = root.querySelector<HTMLElement>('[data-dl-empty]')!;
  const todayIso = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  const apply = () => {
    let shown = 0;
    root.querySelectorAll<HTMLElement>('[data-dl-row]').forEach((tr) => {
      const past = tr.dataset.date! < todayIso;
      const st = tr.querySelector('[data-dl-status]')!;
      st.textContent = past ? 'Passed' : tr.dataset.date === todayIso ? 'Today' : 'Upcoming';
      const show = (countryEl.value === 'all' || tr.dataset.country === countryEl.value) && (pastEl.checked || !past);
      tr.hidden = !show; if (show) shown++;
    });
    emptyEl.hidden = shown > 0;
  };
  const toIcs = (list: Ev[]) => buildIcs(list.map((e): IcsEvent => ({ id: e.id, date: e.date, title: e.title, url: e.source.url, description: `${e.who}. ${e.note} Source: ${e.source.label} (${e.source.url}). Dates can change; confirm on the official page. Not tax advice.` })),
    { calendarName: 'Tax and filing dates', host: location.hostname || 'localhost', now: new Date(), reminderDaysBefore: Number(reminderEl.value) });
  const save = (name: string, text: string) => {
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  countryEl.addEventListener('change', apply); pastEl.addEventListener('change', apply);
  root.querySelector('[data-dl-all]')!.addEventListener('click', () => {
    const list = events.filter((e) => (countryEl.value === 'all' || e.country === countryEl.value) && e.date >= todayIso);
    if (!list.length) { emptyEl.hidden = false; emptyEl.textContent = 'There are no upcoming dates to add.'; return; }
    save('tax-deadlines.ics', toIcs(list));
  });
  root.querySelectorAll<HTMLElement>('[data-dl-one]').forEach((b) => b.addEventListener('click', () => {
    const e = events.find((x) => x.id === b.dataset.dlOne); if (e) save(`${e.id}.ics`, toIcs([e]));
  }));
  apply();
}
