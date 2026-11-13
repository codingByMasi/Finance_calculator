# FinCalc Hub

Static finance-calculator site for India and the US (Astro + TypeScript + Tailwind CSS). No backend, no database: every calculation runs in the browser. `FinCalc Hub` is a placeholder name kept in one constant (`SITE_NAME` in `src/config/site.ts`).

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
| Tax figures | Verify every `TODO(verify)` in `src/config/tax-india.ts`, `src/config/tax-us.ts` and `src/config/gst-india.ts`, then set `verified: true` and update `lastUpdated`. |
| Social image | No OG image is included; add one and an `og:image` tag in `src/layouts/BaseLayout.astro`. |

See `.env.example` for all variables.

## Verification status of tax figures (checked 2026-11-13)

| Area | Status | Source |
| --- | --- | --- |
| US federal brackets (single, married, head of household), standard deductions | Confirmed, official | IRS Rev. Proc. 2025-32 |
| US Social Security, Medicare, additional Medicare | Confirmed, official | irs.gov Topic 751 |
| US state schedules (50 states + DC) | Transcribed from a secondary compilation, not checked per state | Tax Foundation, State Individual Income Tax Rates and Brackets for 2026 |
| India slabs, rebate, standard deduction, 80C, surcharge, cess | Confirmed, official (AY 2026-27 tables) | incometaxindia.gov.in |
| India FY 2026-27 carry-over | Budget 2026-27 coverage says unchanged; Finance Act 2026 text not read | news coverage |
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

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git, pick the repo.
3. Build settings: framework preset **Astro**, build command `npm run build`, output directory `dist`, Node version 20 or newer (set `NODE_VERSION=22` if needed).
4. Add environment variables (at least `PUBLIC_SITE_URL`; the AdSense and GA variables when ready) for Production.
5. Deploy, then add your custom domain under Custom domains. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

CLI alternative: `npm run build && npx wrangler pages deploy dist`.

## How it is organised

- `src/config/tools.ts`: the single tools registry (title, slug, country, category, description, copy, FAQ, related tools). It drives the nav, home/country/category pages, sitemap, JSON-LD and related-tools blocks. Add a tool by adding an entry here and a matching `src/lib/tools/defs/<slug>.ts`.
- `src/lib/calc/`: pure calculation functions (tested in `tests/`).
- `src/lib/tools/defs/`: per-calculator input definitions and result/worked-example builders. The worked example on each page is generated from the same code the calculator uses.
- `src/config/tax-*.ts`: all tax slabs, rates and thresholds, each with `lastUpdated` and source URLs. Nothing tax-related is hardcoded in components.
- `src/layouts/CalculatorLayout.astro`: breadcrumb, H1, tool area, How it works (formula, worked example), Assumptions box with last-updated date, FAQ, related tools.
- `src/scripts/`: small client scripts (calculator logic, theme, country preference, consent). Each calculator's code is its own lazy chunk; charts are inline SVG loaded on demand.

## Ads and consent

`AdSlot` renders nothing unless `PUBLIC_ADSENSE_CLIENT` is set. When it is set, slots reserve fixed heights (header 100px, result 280px, sidebar 600px) to avoid layout shift. The AdSense and analytics scripts are injected only after the visitor accepts the cookie banner; the choice is stored in `localStorage` (`fch_consent`) inside try/catch.

## Notes

- Country, theme and consent are stored in `localStorage` with try/catch fallbacks.
- Figures marked `TODO(verify)` are not confirmed against official sources. See each config file header for what was and was not verified.
