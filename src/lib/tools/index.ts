import type { ToolDef } from './types';

/** Eager map: used at build time (server render of the default results and worked example). */
const eager = import.meta.glob<{ def: ToolDef }>('./defs/*.ts', { eager: true });
export function getToolDef(slug: string): ToolDef {
  const m = eager[`./defs/${slug}.ts`];
  if (!m) throw new Error(`No tool definition for ${slug}`);
  return m.def;
}
