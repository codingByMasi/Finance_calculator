/**
 * Copy rules for a finance site: phrases that read as advice, guarantees, endorsements or unverifiable claims.
 * Used by tests/compliance.test.ts (source copy) and scripts/check-built.mjs (built HTML).
 * Each rule has an id, a pattern and the reason it is risky. To allow an exception, rewrite the sentence instead.
 */
/** A phrase is fine when the same sentence negates it, e.g. "not affiliated with" or "does not promise error-free". */
const NEGATED = /\b(?:no|not|never|without|nor|neither|n't|cannot|can't|isn't|aren't|doesn't|don't)\b[^.]{0,80}/i;

export const copyRules = [
  { id: 'guarantee', re: /\bguarantee(?:d|s)?\b/i, unless: NEGATED, why: 'promises an outcome' },
  { id: 'accuracy-claim', unless: NEGATED, re: /\b(most accurate|100% accurate|perfectly accurate|exact results?|precise(?:ly)? (?:result|figure)s?|error[- ]free)\b/i, why: 'unverifiable accuracy claim' },
  { id: 'official-claim', unless: NEGATED, re: /\b(official (?:calculator|tool|partner|app)|government[- ]approved|govt[- ]approved|endorsed by|approved by|certified by|authori[sz]ed by|affiliated with|in partnership with|on behalf of the (?:irs|income tax))\b/i, why: 'implies endorsement or affiliation' },
  { id: 'best-claim', unless: NEGATED, re: /\b(the best|best-in-class|number one|#1|top-rated|world[- ]class|unbeatable)\b/i, why: 'unverifiable superlative' },
  { id: 'advice-you-should', re: /\byou (?:should|must|ought to|need to) (?:invest|choose|pick|buy|sell|switch|opt|claim|use the|take|borrow|refinance|save|put|contribute|max|start|stop|avoid|prefer|go for|select)\b/i, why: 'reads as personal advice' },
  { id: 'advice-we', re: /\b(we (?:recommend|advise|suggest|urge)|our recommendation|is recommended|are recommended|highly recommended)\b/i, why: 'reads as a recommendation' },
  { id: 'advice-best-for-you', re: /\b(better for you|best for you|right for you|ideal for you|right choice|best choice|smart choice|wise choice|good idea to|better option|best option|best way to)\b/i, why: 'reads as personal advice' },
  { id: 'advice-imperative', re: /^\s*(?:invest|buy|sell|consider (?:investing|switching|buying|refinancing|moving)|prefer|opt for|go for)\b/i, why: 'imperative investment or product advice' },
  { id: 'savings-promise', re: /\b(will save you|save you (?:money|tax|taxes|thousands|lakhs)|you(?:'ll| will) (?:save|earn|get|receive|make|pay less)|reduce your tax|lower your tax bill|avoid (?:paying )?(?:income )?tax|tax[- ]free returns?|beat the (?:tax|market)|maximi[sz]e your (?:returns?|refund|tax savings?|savings))\b/i, why: 'promises a saving or return' },
  { id: 'returns-promise', re: /\b(risk[- ]free|safe investment|assured returns?|fixed returns? guaranteed|get rich|double your money|sure[- ]shot|can't lose|cannot lose|no risk)\b/i, why: 'promises returns or removes risk' },
  { id: 'tax-saving-tip', re: /\b(tax[- ]saving (?:tips?|hacks?|strategy|strategies)|tax planning advice|save tax|tax hacks?|loopholes?)\b/i, why: 'tax advice' },
  { id: 'choose-extreme', re: /\b(?:should I|you should|you can) choose the (?:shortest|longest|lowest|highest|cheapest)\b|^\s*choose the (?:shortest|longest|lowest|highest|cheapest)\b/i, why: 'reads as advice' },
];

/** Returns [{ id, why, match }] for every rule the text breaks. */
export function lintText(text) {
  const out = [];
  for (const line of String(text).split(/\n|(?<=[.!?])\s+/)) {
    for (const r of copyRules) {
      const m = line.match(r.re);
      if (m && !(r.unless && r.unless.test(line))) out.push({ id: r.id, why: r.why, match: m[0], line: line.trim().slice(0, 160) });
    }
  }
  return out;
}
