/**
 * Membership checkers for the two languages under investigation.
 * Each returns a verdict plus the *specific* condition that was violated, so the
 * interface can explain a rejection instead of just reporting it.
 */

export type Counts = Record<'a' | 'b' | 'c', number>;

export type Violation =
  | { kind: 'alphabet'; symbol: string; index: number }
  | { kind: 'order'; index: number; found: string; after: string }
  | { kind: 'counts'; counts: Counts }
  | { kind: 'empty' };

export interface Verdict {
  member: boolean;
  counts: Counts;
  violation: Violation | null;
  /** One plain-language sentence explaining the verdict. */
  reason: string;
}

export function countSymbols(s: string): Counts {
  const counts: Counts = { a: 0, b: 0, c: 0 };
  for (const ch of s) {
    if (ch === 'a' || ch === 'b' || ch === 'c') counts[ch] += 1;
  }
  return counts;
}

/** Finds the first position where the string leaves the pattern a*b*c* (restricted to `alphabet`). */
function checkShape(s: string, alphabet: readonly string[]): Violation | null {
  let rank = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const r = alphabet.indexOf(ch);
    if (r === -1) return { kind: 'alphabet', symbol: ch, index: i };
    if (r < rank) return { kind: 'order', index: i, found: ch, after: alphabet[rank] };
    rank = r;
  }
  return null;
}

function describeShape(v: Violation, pattern: string): string {
  if (v.kind === 'alphabet') {
    const shown = v.symbol === ' ' ? 'a space' : `“${v.symbol}”`;
    return `Position ${v.index + 1} holds ${shown}, which is not in the alphabet.`;
  }
  if (v.kind === 'order') {
    return `Position ${v.index + 1} has an “${v.found}” after a “${v.after}”, so the string does not have the shape ${pattern}.`;
  }
  return '';
}

/** L₁ = { aⁿbⁿcⁿ | n ≥ 0 }. The empty string is a member (n = 0). */
export function checkAnBnCn(s: string): Verdict {
  const counts = countSymbols(s);
  const shape = checkShape(s, ['a', 'b', 'c']);
  if (shape) return { member: false, counts, violation: shape, reason: describeShape(shape, 'a*b*c*') };
  if (counts.a === counts.b && counts.b === counts.c) {
    const n = counts.a;
    return {
      member: true,
      counts,
      violation: null,
      reason: n === 0 ? 'The empty string is a⁰b⁰c⁰, so it belongs (n = 0).' : `Shape a*b*c* with ${n} of each symbol: this is a${sup(n)}b${sup(n)}c${sup(n)}.`,
    };
  }
  return {
    member: false,
    counts,
    violation: { kind: 'counts', counts },
    reason: `The order is fine, but the counts differ (a=${counts.a}, b=${counts.b}, c=${counts.c}); membership needs all three equal.`,
  };
}

/** L₂ = { aⁿb²ⁿ | n ≥ 1 }. */
export function checkAnB2n(s: string): Verdict {
  const counts = countSymbols(s);
  if (s.length === 0) {
    return { member: false, counts, violation: { kind: 'empty' }, reason: 'The empty string is rejected: the language requires n ≥ 1, so at least one a.' };
  }
  const shape = checkShape(s, ['a', 'b']);
  if (shape) return { member: false, counts, violation: shape, reason: describeShape(shape, 'a*b*') };
  if (counts.a === 0) {
    return { member: false, counts, violation: { kind: 'counts', counts }, reason: 'There are no a symbols, but n ≥ 1 requires at least one.' };
  }
  if (counts.b === 2 * counts.a) {
    return { member: true, counts, violation: null, reason: `${counts.a} a's followed by exactly ${counts.b} = 2·${counts.a} b's: this is a${sup(counts.a)}b${sup(counts.b)}.` };
  }
  const diff = counts.b - 2 * counts.a;
  return {
    member: false,
    counts,
    violation: { kind: 'counts', counts },
    reason: `${counts.a} a's need exactly ${2 * counts.a} b's, but there are ${counts.b} (${diff > 0 ? `${diff} too many` : `${-diff} too few`}).`,
  };
}

const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

/** Renders a non-negative integer as Unicode superscript digits. */
export function sup(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPTS[Number(d)] ?? d)
    .join('');
}

/** Compact exponent notation, e.g. "aaabbc" → "a³b²c". */
export function compress(s: string): string {
  if (s.length === 0) return 'ε';
  let out = '';
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    const run = j - i;
    out += s[i] + (run > 1 ? sup(run) : '');
    i = j;
  }
  return out;
}

export function makeAnBnCn(n: number): string {
  return 'a'.repeat(n) + 'b'.repeat(n) + 'c'.repeat(n);
}
