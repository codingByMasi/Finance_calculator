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
// Choices are stored as {ads, analytics, ts}. Nothing advertising- or analytics-related loads before the visitor opts in,
// and a Global Privacy Control signal counts as an opt-out of both. Choices expire after 12 months.
interface Consent { ads: boolean; analytics: boolean; ts: number }
const CONSENT_KEY = 'fch_consent_v2';
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const gpcOn = (navigator as any).globalPrivacyControl === true;

function readConsent(): Consent | null {
  try {
    const raw = store.get(CONSENT_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Consent;
      if (typeof c.ts === 'number' && Date.now() - c.ts < CONSENT_MAX_AGE_MS) return { ads: !!c.ads, analytics: !!c.analytics, ts: c.ts };
      return null;
    }
    const old = store.get('fch_consent'); // choice saved by an earlier version of the banner
    if (old === 'granted' || old === 'denied') return { ads: old === 'granted', analytics: old === 'granted', ts: 0 };
  } catch { /* ignore */ }
  return null;
}

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
function loadAnalytics(adsGranted: boolean): void {
  if (gaLoaded || !GA_ID) return;
  gaLoaded = true;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { w.dataLayer.push(arguments); };
  // Google Consent Mode v2: everything starts denied, then is updated to match the visitor's choices
  w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  w.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: adsGranted ? 'granted' : 'denied', ad_user_data: adsGranted ? 'granted' : 'denied', ad_personalization: adsGranted ? 'granted' : 'denied' });
  const s = document.createElement('script');
  s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  w.gtag('js', new Date()); w.gtag('config', GA_ID, { anonymize_ip: true, page_location: location.origin + location.pathname });
}
function removeAnalyticsCookies(): void {
  const host = location.hostname.split('.');
  const domains = ['', location.hostname, ...host.map((_, i) => '.' + host.slice(i).join('.')).filter((d) => d.split('.').length > 2)];
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga/.test(n)).forEach((n) => {
    domains.forEach((d) => { document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? '; domain=' + d : ''}`; });
  });
}

const banner = document.getElementById('consent');
const adsBox = document.getElementById('consent-ads') as HTMLInputElement | null;
const anBox = document.getElementById('consent-analytics') as HTMLInputElement | null;
const details = document.getElementById('consent-details');
const manage = document.getElementById('consent-manage');
const gpcNote = document.getElementById('gpc-note');

function applyConsent(c: Consent | null): void {
  const eff = c && !gpcOn ? c : { ads: false, analytics: false, ts: c?.ts ?? 0 };
  document.documentElement.dataset.consent = c ? (eff.ads || eff.analytics ? 'granted' : 'denied') : 'unset';
  if (eff.ads) loadAds();
  if (eff.analytics) loadAnalytics(eff.ads);
}
function showDetails(open: boolean): void {
  if (details) details.hidden = !open;
  manage?.setAttribute('aria-expanded', String(open));
}
function syncBoxes(c: Consent | null): void {
  if (adsBox) adsBox.checked = !!c?.ads && !gpcOn;
  if (anBox) anBox.checked = !!c?.analytics && !gpcOn;
  if (gpcNote) gpcNote.hidden = !gpcOn;
}
function decide(ads: boolean, analytics: boolean): void {
  const before = readConsent();
  const next: Consent = { ads: ads && !gpcOn, analytics: analytics && !gpcOn, ts: Date.now() };
  store.set(CONSENT_KEY, JSON.stringify(next));
  if (banner) banner.hidden = true;
  const withdrew = !!before && ((before.ads && !next.ads) || (before.analytics && !next.analytics));
  if (withdrew) {
    removeAnalyticsCookies();
    location.reload(); // drop scripts that were already running
    return;
  }
  applyConsent(next);
}

const current = readConsent();
syncBoxes(current);
if (banner && !current) banner.hidden = false;
applyConsent(current);

document.getElementById('consent-accept')?.addEventListener('click', () => decide(true, true));
document.getElementById('consent-reject')?.addEventListener('click', () => decide(false, false));
document.getElementById('consent-save')?.addEventListener('click', () => decide(!!adsBox?.checked, !!anBox?.checked));
manage?.addEventListener('click', () => showDetails(details ? details.hidden === true : true));
document.querySelectorAll<HTMLElement>('[data-open-consent]').forEach((b) => b.addEventListener('click', () => {
  if (!banner) return;
  syncBoxes(readConsent());
  banner.hidden = false;
  showDetails(true);
  (document.getElementById('consent-title') as HTMLElement | null)?.focus();
}));
document.addEventListener('keydown', (e) => {
  // Escape closes the panel without changing anything (a choice already made stays; no choice means ads stay off)
  if (e.key === 'Escape' && banner && !banner.hidden && readConsent()) banner.hidden = true;
});
