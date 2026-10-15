import { describe, expect, it } from 'vitest';
import { checkAnB2n, checkAnBnCn, compress, conditionsFor, makeAnBnCn, sup } from './languages';

describe('L₁ = { aⁿbⁿcⁿ | n ≥ 0 }', () => {
  it.each(['abc', 'aabbcc', 'aaabbbccc', 'aaaabbbbcccc'])('accepts %s', (s) => {
    expect(checkAnBnCn(s).member).toBe(true);
  });

  it('accepts the empty string (n = 0)', () => {
    expect(checkAnBnCn('').member).toBe(true);
  });

  it.each([
    ['aabbc', 'counts'],
    ['abbcc', 'counts'],
    ['aaabbbcc', 'counts'],
    ['aabbbccc', 'counts'],
  ])('rejects %s for unequal counts', (s, kind) => {
    const v = checkAnBnCn(s);
    expect(v.member).toBe(false);
    expect(v.violation?.kind).toBe(kind);
  });

  it.each(['acb', 'bac', 'abcabc', 'cba', 'aabcbc'])('rejects %s for wrong order even when counts match', (s) => {
    const v = checkAnBnCn(s);
    expect(v.member).toBe(false);
    expect(v.violation?.kind).toBe('order');
  });

  it('rejects foreign symbols and reports their position', () => {
    const v = checkAnBnCn('abxc');
    expect(v.member).toBe(false);
    expect(v.violation).toEqual({ kind: 'alphabet', symbol: 'x', index: 2 });
  });

  it('builds aⁿbⁿcⁿ', () => {
    expect(makeAnBnCn(3)).toBe('aaabbbccc');
    expect(makeAnBnCn(0)).toBe('');
  });
});

describe('L₂ = { aⁿb²ⁿ | n ≥ 1 }', () => {
  it.each(['abb', 'aabbbb', 'aaabbbbbb'])('accepts %s', (s) => expect(checkAnB2n(s).member).toBe(true));
  it.each(['', 'ab', 'aabbb', 'aabbbbb', 'ba', 'bbaa', 'abab', 'bb', 'a'])('rejects %s', (s) => expect(checkAnB2n(s).member).toBe(false));
  it('explains the empty string with n ≥ 1', () => expect(checkAnB2n('').reason).toMatch(/n ≥ 1/));
});

describe('condition checklist', () => {
  it('agrees with the membership verdict for both languages', () => {
    const samples = ['', 'abc', 'aabbcc', 'acb', 'aabbc', 'ab', 'abb', 'aabbbb', 'ba', 'abxb', 'bb'];
    for (const s of samples) {
      expect(conditionsFor('anbncn', s).every((c) => c.ok === true), s).toBe(checkAnBnCn(s).member);
      expect(conditionsFor('anb2n', s).every((c) => c.ok === true), s).toBe(checkAnB2n(s).member);
    }
  });
  it('pinpoints the violated condition', () => {
    const conds = conditionsFor('anb2n', 'aabbb');
    expect(conds.find((c) => c.ok === false)?.label).toBe('#b = 2·#a');
    expect(conditionsFor('anbncn', 'a?c').find((c) => c.ok === false)?.detail).toMatch(/“\?”/);
    expect(conditionsFor('anbncn', 'a?c')[1].ok).toBeNull();
  });
});

describe('notation helpers', () => {
  it('formats superscripts and run-length exponents', () => {
    expect(sup(12)).toBe('¹²');
    expect(compress('aaabbc')).toBe('a³b²c');
    expect(compress('')).toBe('ε');
  });
});
