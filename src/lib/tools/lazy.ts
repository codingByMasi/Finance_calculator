import type { ToolDef } from './types';
/** Lazy map for the browser: each calculator's code is its own small chunk. */
export const lazyDefs = import.meta.glob<{ def: ToolDef }>('./defs/*.ts');
export type { ToolDef };
