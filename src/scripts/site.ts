/** Site-wide client script: theme toggle, country preference, cookie consent, ads + analytics loading. */
const ADSENSE_CLIENT: string = import.meta.env.PUBLIC_ADSENSE_CLIENT || '';
const GA_ID: string = import.meta.env.PUBLIC_GA_ID || '';

const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

// ---- theme
const themeBtn = document.getElementById('theme-toggle');
themeBtn?.addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('dark');
  document.documentElement.classList.toggle('dark', dark);
  themeBtn.setAttribute('aria-pressed', String(dark));
  store.set('fch_theme', dark ? 'dark' : 'light');
});
themeBtn?.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));

// ---- mobile menu
const menuBtn = document.getElementById('menu-toggle');
menuBtn?.addEventListener('click', () => {
  const open = document.getElementById('site-nav')!.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

// ---- country toggle: remember the choice; highlight it on pages with no country of their own
const pageCountry = document.body.dataset.country; // 'in' | 'us' | 'both' | ''
document.querySelectorAll<HTMLAnchorElement>('[data-country-link]').forEach((a) => {
  a.addEventListener('click', () => store.set('fch_country', a.dataset.countryLink!));
});
{
  const pref = store.get('fch_country');
  const active = pageCountry === 'in' || pageCountry === 'us' ? pageCountry : pref;
  document.querySelectorAll<HTMLAnchorElement>('[data-country-link]').forEach((a) => {
    if (a.dataset.countryLink === active) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

// ---- consent, ads, analytics
let adsLoaded = false;
function loadAds(): void {
  if (adsLoaded || !ADSENSE_CLIENT) return;
  adsLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  document.head.appendChild(s);
  document.querySelectorAll('ins.adsbygoogle').forEach(() => {
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch { /* ignore */ }
  });
}
let gaLoaded = false;
function loadAnalytics(): void {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date()); w.gtag('config', GA_ID, { anonymize_ip: true });
}
function applyConsent(choice: string | null): void {
  document.documentElement.dataset.consent = choice || 'unset';
  if (choice === 'granted') { loadAds(); loadAnalytics(); }
}

const banner = document.getElementById('consent');
const choice = store.get('fch_consent');
if (banner && !choice) banner.hidden = false;
applyConsent(choice);
const decide = (v: 'granted' | 'denied') => { store.set('fch_consent', v); if (banner) banner.hidden = true; applyConsent(v); };
document.getElementById('consent-accept')?.addEventListener('click', () => decide('granted'));
document.getElementById('consent-reject')?.addEventListener('click', () => decide('denied'));
document.querySelectorAll('[data-open-consent]').forEach((b) => b.addEventListener('click', () => { if (banner) { banner.hidden = false; (document.getElementById('consent-accept') as HTMLElement | null)?.focus(); } }));
