import { describe, expect, it } from 'vitest';
import { checkAnB2n } from './languages';
import { boundedDFA, firstFailure, runDFA } from './dfa';

describe('bounded DFA for the comparison chamber', () => {
  it('is exactly right for n ≤ K and has 3K + 2 states', () => {
    const K = 4;
    const dfa = boundedDFA(K);
    expect(dfa.stateCount).toBe(14);
    for (let n = 1; n <= K; n++) {
      expect(runDFA(dfa, 'a'.repeat(n) + 'b'.repeat(2 * n)).accepted).toBe(true);
      expect(runDFA(dfa, 'a'.repeat(n) + 'b'.repeat(2 * n - 1)).accepted).toBe(false);
      expect(runDFA(dfa, 'a'.repeat(n) + 'b'.repeat(2 * n + 1)).accepted).toBe(false);
    }
  });

  it('fails on the first string longer than its capacity', () => {
    for (let K = 1; K <= 6; K++) {
      const s = firstFailure(K);
      expect(checkAnB2n(s).member).toBe(true);
      expect(runDFA(boundedDFA(K), s).accepted).toBe(false);
    }
  });

  it('records one state per symbol read', () => {
    const r = runDFA(boundedDFA(2), 'aabbbb');
    expect(r.states).toEqual(['start', 'A1', 'A2', 'R3', 'R2', 'R1', 'R0']);
  });

  it('rejects an invalid capacity', () => expect(() => boundedDFA(0)).toThrow());
});
