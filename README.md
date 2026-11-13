# FinCalculator

Static finance-calculator site for India and the US (Astro + TypeScript + Tailwind CSS). No backend, no database: every calculation runs in the browser. The site name is kept in one constant (`SITE_NAME` in `src/config/site.ts`).

## Run locally

```bash
npm install
npm test            # Vitest unit tests for src/lib/calc
npm run dev         # http://localhost:4321
npm run build       # static output in dist/
npm run preview     # serve the production build
```

Requires Node 20+ (developed on Node 22).

## What to fill in before launch

| What | Where |
| --- | --- |
| Domain | Set `PUBLIC_SITE_URL` (e.g. `https://yourdomain.com`) at build time. Used for canonical URLs, Open Graph, JSON-LD, sitemap and robots. |
| Contact email | `CONTACT_EMAIL` in `src/config/site.ts` (used on `/contact/` and `/privacy-policy/`; search for `PLACEHOLDER`). |
| Brand name | `SITE_NAME` / `SITE_TAGLINE` in `src/config/site.ts`. |
| AdSense | `PUBLIC_ADSENSE_CLIENT` (`ca-pub-...`), optional `PUBLIC_ADSENSE_SLOT_HEADER/RESULT/SIDEBAR`, and replace `public/ads.txt`. |
| Analytics | Optional `PUBLIC_GA_ID` (GA4). Loaded only after cookie consent. |
| Tax figures | Verify every `TODO(verify)` in `src/config/tax-india.ts`, `tax-us.ts`, `gst-india.ts`, `savings-india.ts` (PPF) and `hra-india.ts`, then set `verified: true`, update `lastUpdated` and add a data changelog entry. Until then each page shows "Not yet confirmed" next to those figures. |
| Legal details | Replace every `[bracketed]` value in `OPERATOR` (`src/config/site.ts`), then have a lawyer review the legal pages and set `LEGAL_TEMPLATE_NOTICE = false`. Read `docs/legal-review.md` first. |
| Google consent for EEA/UK traffic | The built-in banner is not a Google-certified CMP. Enable Google's "Privacy & messaging" in AdSense or another certified CMP before serving ads there. See `docs/legal-review.md` row 24. |
| Social image | No OG image is included; add one and an `og:image` tag in `src/layouts/BaseLayout.astro`. |

See `.env.example` for all variables.

## Verification status of tax figures (checked 2026-11-13)

| Area | Status | Source |
| --- | --- | --- |
| US federal brackets (single, married, head of household), standard deductions | Confirmed, official | IRS Rev. Proc. 2025-32 |
| US Social Security, Medicare, additional Medicare | Confirmed, official | irs.gov Topic 751 |
| US state schedules (50 states + DC) | Transcribed from a secondary compilation, not checked per state | Tax Foundation, State Individual Income Tax Rates and Brackets for 2026 |
| India slabs, rebate, standard deduction, 80C, surcharge, cess | Confirmed, official, for **FY 2025-26 (AY 2026-27)**. The calculator states that year. | incometaxindia.gov.in |
| India FY 2026-27 | Press coverage reports no change; Finance Act 2026 text not read. Shown on the page as "Not yet confirmed". | news coverage |
| US 401(k) limits for 2026 | Confirmed, official | IRS news release |
| India PPF rate and deposit limits | Secondary source only, labelled "Not yet confirmed" on the page | press coverage |
| India HRA metro-city list (8 cities) | Secondary source only, labelled "Not yet confirmed" on the page | press coverage |
| India GST slabs (Nil, 5%, 18%, 40%) | Confirmed, official | PIB, 56th GST Council release |

Still open: read the Finance Act 2026 First Schedule once, spot-check state schedules against state revenue departments, and add special GST rates (gold, diamonds) if wanted. Each config file lists these as `TODO(verify)`.

## Keeping tax data current

Tax figures stay in `src/config/tax-india.ts`, `tax-us.ts` and `gst-india.ts`; they are updated by a person, never scraped into the site.

- `src/config/data-sources.json` lists the official pages the site depends on, with a few figures each page must still contain.
- `.github/workflows/check-sources.yml` runs weekly (and on demand) and calls `scripts/check-sources.mjs`. It hashes each page's visible text and compares it with the last human-reviewed hash in `data/source-baseline.json`. If a page changed, a known figure disappeared, or a source has been unreachable for 3 runs in a row, it opens (or comments on) a GitHub issue labelled `data-review`. It also commits `src/data/source-status.json` (last-checked dates only), which redeploys the site.
- When the issue arrives: read the source, edit the config, bump its `lastUpdated`, run `npm run sources:accept` (marks the current page content as reviewed), run `npm test`, and open a PR.
- Run it yourself with `npm run sources:check`.

Limits, stated plainly: none of these sources offers a machine-readable (JSON/XML) feed of rates, so the check is page-level change detection, not data extraction. Pages with navigation or date noise can trigger false alarms, and some government sites block automated requests; those show as unreachable and are reported rather than hidden. The first scheduled run seeds the baseline from whatever the pages say that day, so make sure the configs are correct before it runs.

The "last updated" dates on tool pages, the Assumptions box, the footer, the home page badge and the sitemap are read from the configs' `lastUpdated` fields and the status file (`src/lib/data-status.ts`); no date is hardcoded in components.

## Credibility features

- **Sources on every tool page:** `src/config/references.ts` builds the "Where the figures come from" table from the tax configs, so values and links cannot drift.
- **/methodology/**, **/corrections/** and **/changelog/**: generated from the tools registry, `src/lib/accuracy.ts` and `src/config/data-changelog.ts`. When you change a config's `lastUpdated`, add a changelog entry with the same date (a test enforces this). Add corrections to the `corrections` array.
- **Accuracy tests** (`tests/accuracy.test.ts`) compare results with published CFPB, SSA and CBDT examples. Add a case to `accuracyCases` whenever you find another published worked example; the Methodology page shows it automatically.
- **Author and reviewer:** fill `editorial.author` / `editorial.reviewer` in `src/config/editorial.ts` with real, checkable details. Until then the About and Methodology pages show a marked placeholder and the structured data names no person.

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git, pick the repo.
3. Build settings: framework preset **Astro**, build command `npm run build`, output directory `dist`, Node version 20 or newer (set `NODE_VERSION=22` if needed).
4. Add environment variables (at least `PUBLIC_SITE_URL`; the AdSense and GA variables when ready) for Production.
5. Deploy, then add your custom domain under Custom domains. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

CLI alternative: `npm run build && npx wrangler pages deploy dist`.

## Checks that run

- `npm test` runs the unit tests, including `tests/compliance.test.ts`: a copy lint (guarantees, advice, endorsement and promise phrases, rules in `scripts/lib/copy-rules.mjs`), a check that every result is labelled as an estimate, and a check that every config containing `TODO(verify)` is registered with a visible on-page label.
- `npm run verify` runs the tests, builds, then `scripts/check-built.mjs`, which checks the built HTML (estimate note, not-advice banner, privacy choices link, legal pages present, copy rules, meta description length) and reports how many owner placeholders remain.

## Features added later

- Calculators: FD, RD, PPF, HRA, 401(k), retirement, auto loan, mortgage refinance. All are registry-driven like the first twelve.
- "Copy link", "Copy results" and "Print" on every calculator. Links carry inputs in the query string only when the visitor asks for the link; a page opened from one strips them from the address bar immediately.
- Month-by-month payment table with CSV download on the EMI, mortgage, auto loan and refinance calculators.
- Everyday tools (`/everyday/`): tip and bill split; currency converter; expense tracker (browser-only, localStorage in try/catch, CSV export); tax and filing deadline calendar with `.ics` downloads.
- Exchange rates: `src/data/fx-rates.json` is a dated snapshot of the European Central Bank reference rates, refreshed each weekday by `.github/workflows/update-fx.yml` (`scripts/update-fx.mjs`). The script refuses data that fails `scripts/lib/fx.mjs` validation (wrong base, missing or non-positive rate, a move above 25% in one update, an older or future date), so a bad response leaves the previous snapshot and its visible date in place. The page warns when the snapshot is more than 7 days old. Visitors' browsers never call a rate service. Run the workflow once manually after the first deploy; the committed snapshot was copied from the live API on 2026-11-13.
- Deadline calendar: `src/config/deadlines.ts` lists only dates read on an official page. India dates and the US 2026-return deadline are under `pending` (shown as "not included") until they are confirmed on incometax.gov.in, incometaxindia.gov.in or irs.gov.
- `/guides/`: explainers written as general information (`src/config/guides.ts`), with figures drawn from the same configs.
- Legal pages: Privacy, Cookie, Terms, Disclaimer, Advertising disclosure, Copyright/DMCA, Accessibility, plus granular consent, "Do Not Sell or Share" and Global Privacy Control handling.

## How it is organised

- `src/config/tools.ts`: the single tools registry (title, slug, country, category, description, copy, FAQ, related tools). It drives the nav, home/country/category pages, sitemap, JSON-LD and related-tools blocks. Add a tool by adding an entry here and a matching `src/lib/tools/defs/<slug>.ts`.
- `src/lib/calc/`: pure calculation functions (tested in `tests/`).
- `src/lib/tools/defs/`: per-calculator input definitions and result/worked-example builders. The worked example on each page is generated from the same code the calculator uses.
- `src/config/tax-*.ts`: all tax slabs, rates and thresholds, each with `lastUpdated` and source URLs. Nothing tax-related is hardcoded in components.
- `src/layouts/CalculatorLayout.astro`: breadcrumb, H1, tool area, How it works (formula, worked example), Assumptions box with last-updated date, FAQ, related tools.
- `src/scripts/`: small client scripts (calculator logic, theme, country preference, consent). Each calculator's code is its own lazy chunk; charts are inline SVG loaded on demand.

## Ads and consent

`AdSlot` renders nothing unless `PUBLIC_ADSENSE_CLIENT` is set. When it is set, slots reserve fixed heights (header 100px, result 280px, sidebar 600px) to avoid layout shift. The AdSense and analytics scripts are injected only after the visitor accepts the cookie banner; the choice (advertising and analytics separately, with a timestamp that expires after 12 months) is stored in `localStorage` (`fch_consent_v2`) inside try/catch. A Global Privacy Control signal keeps both off. Footer links reopen the choices.

## Notes

- Country, theme and consent are stored in `localStorage` with try/catch fallbacks.
- Figures marked `TODO(verify)` are not confirmed against official sources. See each config file header for what was and was not verified.
