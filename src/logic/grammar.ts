/**
 * A context-free grammar for L₂ = { aⁿb²ⁿ | n ≥ 1 }:
 *   S → aSbb | abb
 * Each use of S → aSbb adds one a on the left and two b's on the right, so the
 * derivation of aⁿb²ⁿ uses that rule n − 1 times and finishes with S → abb.
 */
export const GRAMMAR_RULES = ['S → aSbb', 'S → abb'] as const;

export interface DerivationStep {
  form: string;
  rule: (typeof GRAMMAR_RULES)[number] | null;
}

export function deriveAnB2n(n: number): DerivationStep[] {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be an integer ≥ 1');
  const steps: DerivationStep[] = [{ form: 'S', rule: null }];
  let form = 'S';
  for (let k = 1; k < n; k++) {
    form = form.replace('S', 'aSbb');
    steps.push({ form, rule: GRAMMAR_RULES[0] });
  }
  steps.push({ form: form.replace('S', 'abb'), rule: GRAMMAR_RULES[1] });
  return steps;
}

/** First i < j with a^i and a^j landing in the same DFA state — the pigeonhole collision. */
export function findCollision(statesAfterPrefix: (k: number) => string, limit: number): [number, number] | null {
  const seen = new Map<string, number>();
  for (let k = 0; k <= limit; k++) {
    const q = statesAfterPrefix(k);
    const prior = seen.get(q);
    if (prior !== undefined) return [prior, k];
    seen.set(q, k);
  }
  return null;
}
