export interface CopyRule { id: string; re: RegExp; why: string; unless?: RegExp }
export interface CopyFinding { id: string; why: string; match: string; line: string }
export const copyRules: CopyRule[];
export function lintText(text: string): CopyFinding[];
