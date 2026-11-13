import type { Currency } from '../format';
import type { ScheduleRow } from '../calc/loan';

export type Values = Record<string, number | string>;

export interface FieldOption { value: string; label: string; /** other field values to set when picked */ set?: Record<string, number | string> }
export interface FieldDef {
  id: string;
  label: string;
  type: 'number' | 'select';
  default: number | string;
  min?: number;
  max?: number;
  step?: number | 'any';
  /** show a keyboard-friendly range slider that mirrors the number input */
  slider?: boolean;
  sliderMax?: number;
  /** 'cur' = currency symbol of the tool; any other string is shown literally */
  prefix?: string;
  suffix?: string;
  options?: FieldOption[];
  hint?: string;
  /** only show when another field has one of these values */
  showIf?: { field: string; in: string[] };
}

export interface Row { label: string; value: string; strong?: boolean }
export type ChartSpec =
  | { kind: 'line'; title: string; currency: Currency; xs: number[]; xLabel: string; series: { name: string; values: number[] }[] }
  | { kind: 'donut'; title: string; currency: Currency; segments: { label: string; value: number }[] };

export interface ScheduleSpec { currency: Currency; rows: ScheduleRow[]; filename: string }

export interface Result {
  error?: string;
  headline: { label: string; value: string };
  rows: Row[];
  steps: string[];
  chart?: ChartSpec;
  notes?: string[];
  /** month-by-month payment table (loan tools); rendered as an expandable table with a CSV download */
  schedule?: ScheduleSpec;
}

export interface ToolDef {
  /** fixed currency for the tool, or 'select' when the tool has a `currency` field */
  currency: Currency | 'select';
  fields: FieldDef[];
  compute: (v: Values) => Result;
}

export const num = (v: Values, id: string): number => Number(v[id]);
export const str = (v: Values, id: string): string => String(v[id]);
export const cur = (v: Values, fixed: Currency | 'select'): Currency => (fixed === 'select' ? (v.currency === 'INR' ? 'INR' : 'USD') : fixed);

export const currencyField: FieldDef = {
  id: 'currency', label: 'Currency', type: 'select', default: 'USD',
  options: [{ value: 'USD', label: 'US dollar ($)' }, { value: 'INR', label: 'Indian rupee (₹)' }],
};

export interface ValidationError { id: string; message: string }
/** Validate numeric fields. Returns the first problem or null. */
export function validate(fields: FieldDef[], v: Values): ValidationError | null {
  for (const f of fields) {
    if (f.type !== 'number') continue;
    if (f.showIf && !f.showIf.in.includes(String(v[f.showIf.field]))) continue;
    const x = v[f.id];
    if (x === '' || x === undefined || !Number.isFinite(Number(x))) return { id: f.id, message: `Enter a number for "${f.label}".` };
    const n = Number(x);
    if (f.min !== undefined && n < f.min) return { id: f.id, message: `"${f.label}" must be at least ${f.min}.` };
    if (f.max !== undefined && n > f.max) return { id: f.id, message: `"${f.label}" must be at most ${f.max}.` };
  }
  return null;
}

export function defaults(fields: FieldDef[]): Values {
  return Object.fromEntries(fields.map((f) => [f.id, f.default]));
}
