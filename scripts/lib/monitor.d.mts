export interface Source { id: string; title: string; url: string; kind: 'html' | 'pdf'; config: string; expect: string[]; noisy?: boolean }
export interface Fetched { ok: boolean; status?: number; body?: string | Uint8Array; error?: string }
export interface Result { id: string; title: string; url: string; config: string; noisy: boolean; state: 'ok' | 'changed' | 'expectation-failed' | 'unreachable' | 'new'; hash?: string; missing?: string[]; httpStatus: number | null; error?: string; consecutiveFailures: number }
export function htmlToText(html: string): string;
export function sha256(input: string | Uint8Array): string;
export function missingExpectations(text: string, expect?: string[]): string[];
export function evaluateSource(source: Source, fetched: Fetched, baselineHash: string | undefined, previous?: { consecutiveFailures?: number }): Result;
export function needsAttention(result: Result, opts?: { unreachableAfter?: number }): boolean;
export function buildReport(results: Result[], now: string): string;
