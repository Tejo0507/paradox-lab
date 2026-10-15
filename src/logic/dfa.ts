/**
 * Finite-memory comparison for the Machine Comparison Chamber.
 *
 * `boundedDFA(K)` is a genuine DFA (3K + 2 states) that decides aⁿb²ⁿ correctly for
 * every n ≤ K — the finite language { aⁿb²ⁿ | 1 ≤ n ≤ K } is regular. It must fail at
 * n = K + 1: it has no state left to remember K + 1 a's. The pigeonhole argument in the
 * chamber explains why *every* DFA, not just this family, fails at some point.
 */

export interface DFARun {
  states: string[];
  accepted: boolean;
  finalState: string;
}

export interface DFA {
  name: string;
  stateCount: number;
  start: string;
  accepting: (state: string) => boolean;
  delta: (state: string, symbol: string) => string;
}

const DEAD = 'dead';

export function boundedDFA(K: number): DFA {
  if (!Number.isInteger(K) || K < 1) throw new RangeError('K must be a positive integer.');
  // States: start, A1..AK (k a's read), R0..R(2K-1) (r b's still required), dead.
  return {
    name: `DFA with capacity ${K}`,
    stateCount: 3 * K + 2,
    start: 'start',
    accepting: (q) => q === 'R0',
    delta: (q, sym) => {
      if (q === DEAD) return DEAD;
      if (q === 'start') return sym === 'a' ? 'A1' : DEAD;
      if (q.startsWith('A')) {
        const k = Number(q.slice(1));
        if (sym === 'a') return k < K ? `A${k + 1}` : DEAD; // out of states: cannot count further
        if (sym === 'b') return `R${2 * k - 1}`;
        return DEAD;
      }
      if (q.startsWith('R')) {
        const r = Number(q.slice(1));
        return sym === 'b' && r > 0 ? `R${r - 1}` : DEAD;
      }
      return DEAD;
    },
  };
}

export function runDFA(dfa: DFA, input: string): DFARun {
  const states = [dfa.start];
  let q = dfa.start;
  for (const ch of input) {
    q = dfa.delta(q, ch);
    states.push(q);
  }
  return { states, accepted: dfa.accepting(q), finalState: q };
}

/** The shortest member of aⁿb²ⁿ that `boundedDFA(K)` wrongly rejects. */
export function firstFailure(K: number): string {
  return 'a'.repeat(K + 1) + 'b'.repeat(2 * (K + 1));
}
