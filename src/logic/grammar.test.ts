import { describe, expect, it } from 'vitest';
import { boundedDFA, runDFA } from './dfa';
import { deriveAnB2n, findCollision } from './grammar';
import { checkAnB2n } from './languages';

describe('grammar S → aSbb | abb', () => {
  it('derives exactly aⁿb²ⁿ in n steps', () => {
    for (let n = 1; n <= 8; n++) {
      const steps = deriveAnB2n(n);
      const word = steps.at(-1)!.form;
      expect(steps).toHaveLength(n + 1);
      expect(word).toBe('a'.repeat(n) + 'b'.repeat(2 * n));
      expect(checkAnB2n(word).member).toBe(true);
    }
    expect(deriveAnB2n(2).map((s) => s.form)).toEqual(['S', 'aSbb', 'aabbbb']);
  });
  it('rejects n < 1', () => expect(() => deriveAnB2n(0)).toThrow());
});

describe('pigeonhole collision in a bounded DFA', () => {
  it('finds two a-prefixes sharing a state, which forces a wrong verdict', () => {
    const K = 3;
    const dfa = boundedDFA(K);
    const after = (k: number) => runDFA(dfa, 'a'.repeat(k)).finalState;
    const hit = findCollision(after, dfa.stateCount);
    expect(hit).not.toBeNull();
    const [i, j] = hit!;
    expect(i).toBeLessThan(j);
    expect(after(i)).toBe(after(j));
    // Same state after a^i and a^j ⇒ same verdict on a^i b^{2i} and a^j b^{2i}; they differ in L when i ≥ 1.
    const suffix = 'b'.repeat(2 * i);
    expect(runDFA(dfa, 'a'.repeat(i) + suffix).accepted).toBe(runDFA(dfa, 'a'.repeat(j) + suffix).accepted);
    expect(checkAnB2n('a'.repeat(i) + suffix).member).not.toBe(checkAnB2n('a'.repeat(j) + suffix).member);
  });
});
