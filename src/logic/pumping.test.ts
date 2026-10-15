import { describe, expect, it } from 'vitest';
import { checkAnBnCn, makeAnBnCn } from './languages';
import {
  auditString,
  checkConstraints,
  classify,
  decompose,
  defaultCuts,
  enumerateValidCuts,
  evaluateAttack,
  moveCut,
  pump,
  pumpTagged,
} from './pumping';

describe('five-part decomposition s = uvxyz', () => {
  const s = makeAnBnCn(3); // aaabbbccc

  it('splits into exactly five parts that concatenate back to s', () => {
    const d = decompose(s, [2, 3, 4, 5]);
    expect([d.u, d.v, d.x, d.y, d.z]).toEqual(['aa', 'a', 'b', 'b', 'bccc']);
    expect(d.u + d.v + d.x + d.y + d.z).toBe(s);
  });

  it('rejects unordered or out-of-range cuts', () => {
    expect(() => decompose(s, [3, 2, 4, 5])).toThrow(RangeError);
    expect(() => decompose(s, [0, 0, 0, 10])).toThrow(RangeError);
  });

  it('pumps BOTH v and y', () => {
    const d = decompose(s, [2, 3, 4, 5]);
    expect(pump(d, 0)).toBe('aa' + 'b' + 'bccc');
    expect(pump(d, 2)).toBe('aa' + 'aa' + 'b' + 'bb' + 'bccc');
    expect(pump(d, 1)).toBe(s);
    expect(() => pump(d, -1)).toThrow();
  });

  it('tags every pumped symbol with its origin', () => {
    const d = decompose(s, [2, 3, 4, 5]);
    const tagged = pumpTagged(d, 2);
    expect(tagged.map((t) => t.ch).join('')).toBe(pump(d, 2));
    expect(tagged.filter((t) => t.segment === 'v')).toHaveLength(2);
    expect(tagged.filter((t) => t.segment === 'y').map((t) => t.copy)).toEqual([0, 1]);
  });

  it('checks |vxy| ≤ p and |vy| > 0', () => {
    expect(checkConstraints(decompose(s, [2, 3, 4, 5]), 3).valid).toBe(true);
    expect(checkConstraints(decompose(s, [0, 2, 3, 5]), 3)).toMatchObject({ vxyWithinP: false, valid: false });
    expect(checkConstraints(decompose(s, [2, 2, 4, 4]), 3)).toMatchObject({ vyNonEmpty: false, valid: false });
  });

  it('keeps cuts ordered when one is moved past another', () => {
    expect(moveCut(s, [2, 3, 4, 5], 1, 8)).toEqual([2, 4, 4, 5]);
    expect(moveCut(s, [2, 3, 4, 5], 0, -5)).toEqual([0, 3, 4, 5]);
  });

  it('default cuts satisfy the constraints for every p', () => {
    for (let p = 1; p <= 8; p++) {
      const str = makeAnBnCn(p);
      expect(checkConstraints(decompose(str, defaultCuts(str, p)), p).valid).toBe(true);
    }
  });
});

describe('case analysis and boundary-crossing decompositions', () => {
  const p = 4;
  const s = makeAnBnCn(p); // aaaabbbbcccc

  it('classifies a v that straddles the a|b boundary', () => {
    const d = decompose(s, [3, 5, 6, 7]); // v = "ab"
    const c = classify(d);
    expect(d.v).toBe('ab');
    expect(c.kind).toBe('straddle');
    const report = evaluateAttack(s, d.cuts, p);
    expect(report.constraints.valid).toBe(true);
    // i = 2 produces "...abab..." — out of order
    expect(report.outcomes.find((o) => o.i === 2)!.verdict.violation?.kind).toBe('order');
    expect(report.survived).toBe(false);
  });

  it('classifies a y that straddles the b|c boundary', () => {
    const d = decompose(s, [6, 7, 7, 9]); // v = "b", y = "bc"
    expect(d.y).toBe('bc');
    expect(classify(d).kind).toBe('straddle');
    expect(evaluateAttack(s, d.cuts, p).survived).toBe(false);
  });

  it('uniform case: v in a-block, y in b-block leaves c untouched', () => {
    const d = decompose(s, [3, 4, 4, 5]); // v = a, y = b
    const c = classify(d);
    expect(c.kind).toBe('uniform');
    expect(c.untouched).toEqual(['c']);
    const r = evaluateAttack(s, d.cuts, p);
    expect(r.witnesses).toContain(0);
    expect(r.witnesses).toContain(2);
  });

  it('flags invalid decompositions instead of evaluating them as attacks', () => {
    const r = evaluateAttack(s, [0, 4, 8, 12], p); // v = aaaa, x = bbbb, y = cccc: |vxy| = 12 > p
    expect(r.constraints.valid).toBe(false);
    expect(r.survived).toBe(false);
    expect(r.explanation.join(' ')).toMatch(/exceeds p/);
  });
});

describe('exhaustive audit of s = aᵖbᵖcᵖ (illustration for fixed p)', () => {
  for (let p = 1; p <= 7; p++) {
    it(`p = ${p}: every valid decomposition is refuted by i = 0 and by i = 2`, () => {
      const s = makeAnBnCn(p);
      const audit = auditString(s, p);
      expect(audit.total).toBe(enumerateValidCuts(s, p).length);
      expect(audit.total).toBeGreaterThan(0);
      expect(audit.survivors).toEqual([]);
      expect(audit.killedByZero).toBe(audit.total);
      expect(audit.killedByTwo).toBe(audit.total);
      // The key lemma of the proof: no window of length ≤ p touches all three blocks.
      expect(audit.maxWindowSymbols).toBeLessThanOrEqual(2);
      if (p >= 2) expect(audit.straddle).toBeGreaterThan(0);
    });
  }

  it('enumerates only decompositions that respect the constraints', () => {
    const s = makeAnBnCn(3);
    for (const cuts of enumerateValidCuts(s, 3)) {
      expect(checkConstraints(decompose(s, cuts), 3).valid).toBe(true);
    }
  });

  it('a string with n < p can have windows touching all three blocks', () => {
    // Why the proof picks s = aᵖbᵖcᵖ rather than a short string.
    const audit = auditString('abc', 3);
    expect(audit.maxWindowSymbols).toBe(3);
  });

  it('pumping i = 1 always returns the original member string', () => {
    const s = makeAnBnCn(3);
    for (const cuts of enumerateValidCuts(s, 3)) expect(checkAnBnCn(pump(decompose(s, cuts), 1)).member).toBe(true);
  });
});
