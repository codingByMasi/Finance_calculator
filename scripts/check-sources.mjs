#!/usr/bin/env node
// Watches the official sources listed in src/config/data-sources.json. It never edits tax figures.
//   node scripts/check-sources.mjs                 check and print a report
//   node scripts/check-sources.mjs --write-status  also update src/data/source-status.json (last-checked dates)
//   node scripts/check-sources.mjs --seed-missing  record a baseline for sources that have none yet
//   node scripts/check-sources.mjs --accept        mark the current content as reviewed (after you updated the configs)
//   --report <file>                                write the markdown report; --attention-file <file> is written only when review is needed
import { readFileSync, writeFileSync } from 'node:fs';
import { evaluateSource, needsAttention, buildReport } from './lib/monitor.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
// File locations can be overridden with env vars (used by the integration test and for dry runs).
const fileUrl = (env, rel) => (process.env[env] ? new URL(`file://${process.env[env]}`) : new URL(rel, import.meta.url));
const SOURCES_URL = fileUrl('SOURCES_FILE', '../src/config/data-sources.json');
const BASE_URL = fileUrl('BASELINE_FILE', '../data/source-baseline.json');
const STATUS_URL = fileUrl('STATUS_FILE', '../src/data/source-status.json');
const SOURCES = JSON.parse(readFileSync(SOURCES_URL, 'utf8')).sources;
const baseline = JSON.parse(readFileSync(BASE_URL, 'utf8'));
const status = JSON.parse(readFileSync(STATUS_URL, 'utf8'));
const today = new Date().toISOString().slice(0, 10);

async function fetchSource(s) {
  try {
    const res = await fetch(s.url, { redirect: 'follow', signal: AbortSignal.timeout(45_000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; FinCalculatorSourceMonitor/1.0; +https://github.com)', accept: s.kind === 'pdf' ? 'application/pdf,*/*' : 'text/html,*/*' } });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, body: s.kind === 'pdf' ? new Uint8Array(await res.arrayBuffer()) : await res.text() };
  } catch (e) {
    return { ok: false, error: String(e?.cause?.code || e?.message || e) };
  }
}

const results = [];
for (const s of SOURCES) {
  const r = evaluateSource(s, await fetchSource(s), baseline.sources[s.id]?.hash, status.sources[s.id]);
  results.push(r);
  console.log(`${r.state.padEnd(19)} ${s.id}${r.missing?.length ? ' missing: ' + r.missing.join(', ') : ''}${r.error ? ' ' + r.error : ''}`);
}

if (flag('--seed-missing') || flag('--accept')) {
  for (const r of results) {
    if (!r.hash) continue;
    if (flag('--accept') || !baseline.sources[r.id]) { baseline.sources[r.id] = { hash: r.hash, reviewed: today }; if (r.state === 'new' || r.state === 'changed') r.state = 'ok'; }
  }
  writeFileSync(BASE_URL, JSON.stringify(baseline, null, 2) + '\n');
  console.log('baseline updated');
}
if (flag('--write-status')) {
  status.lastChecked = today;
  for (const r of results) status.sources[r.id] = { title: r.title, url: r.url, state: r.state, lastChecked: today, consecutiveFailures: r.consecutiveFailures };
  writeFileSync(STATUS_URL, JSON.stringify(status, null, 2) + '\n');
  console.log('status updated');
}
const report = buildReport(results, today);
if (val('--report')) writeFileSync(val('--report'), report + '\n');
const attention = results.some((r) => needsAttention(r));
if (attention && val('--attention-file')) writeFileSync(val('--attention-file'), report + '\n');
console.log('\n' + report);
