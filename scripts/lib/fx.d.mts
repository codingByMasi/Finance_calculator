export const FX_CURRENCIES: string[];
export const FX_BASE: string;
export const FX_URL: string;
export interface FxSnapshot { base: string; date: string; source: string; sourceUrl: string; rates: Record<string, number> }
export function toSnapshot(api: { base: string; date: string; rates: Record<string, number> }): FxSnapshot;
export function validateFx(next: unknown, prev: { date: string; rates: Record<string, number> } | null | undefined, today?: string, maxMove?: number): string[];
