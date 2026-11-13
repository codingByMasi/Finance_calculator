#!/usr/bin/env node
/**
 * Refreshes src/data/fx-rates.json from the Frankfurter API (European Central Bank reference rates).
 * Run daily by .github/workflows/update-fx.yml. The file is only written if the new data passes validation,
 * so a bad response leaves the previous snapshot (and its visible date) in place.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { FX_URL, toSnapshot, validateFx } from './lib/fx.mjs';

const FILE = process.env.FX_FILE || 'src/data/fx-rates.json';
const prev = existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : null;
const res = await fetch(FX_URL, { headers: { accept: 'application/json', 'user-agent': 'FinCalculatorRateSnapshot/1.0' }, signal: AbortSignal.timeout(30_000) });
if (!res.ok) { console.error(`Rates request failed: HTTP ${res.status}`); process.exit(1); }
const next = toSnapshot(await res.json());
const today = new Date().toISOString().slice(0, 10);
const errs = validateFx(next, prev, today);
if (errs.length) { console.error('Rejected new rates:\n - ' + errs.join('\n - ')); process.exit(1); }
if (prev && prev.date === next.date && JSON.stringify(prev.rates) === JSON.stringify(next.rates)) { console.log(`Rates unchanged (${next.date}).`); process.exit(0); }
writeFileSync(FILE, JSON.stringify(next, null, 2) + '\n');
console.log(`Wrote rates dated ${next.date}.`);
