/**
 * The context-free pumping lemma, as executable definitions.
 *
 * Lemma. If L is context-free, there is a p ≥ 1 such that every s ∈ L with |s| ≥ p
 * can be written s = uvxyz with
 *   (1) |vxy| ≤ p,  (2) |vy| > 0,  (3) uvⁱxyⁱz ∈ L for every i ≥ 0.
 *
 * These functions never "decide" context-freeness. They evaluate one decomposition
 * of one string, or exhaustively audit one string for one fixed p. The proof itself
 * is the general argument in `proofCases` / the certificate.
 */
import { checkAnBnCn, type Counts, countSymbols, type Verdict } from './languages';

export type Segment = 'u' | 'v' | 'x' | 'y' | 'z';
export const SEGMENTS: readonly Segment[] = ['u', 'v', 'x', 'y', 'z'];

/** Four cut points 0 ≤ c1 ≤ c2 ≤ c3 ≤ c4 ≤ |s|: u=s[0,c1) v=s[c1,c2) x=s[c2,c3) y=s[c3,c4) z=s[c4,|s|). */
export type Cuts = readonly [number, number, number, number];

export interface Decomposition {
  s: string;
  cuts: Cuts;
  u: string;
  v: string;
  x: string;
  y: string;
  z: string;
}

export function isWellFormedCuts(s: string, cuts: readonly number[]): cuts is Cuts {
  if (cuts.length !== 4) return false;
  let prev = 0;
  for (const c of cuts) {
    if (!Number.isInteger(c) || c < prev || c > s.length) return false;
    prev = c;
  }
  return true;
}

export function decompose(s: string, cuts: Cuts): Decomposition {
  if (!isWellFormedCuts(s, cuts)) {
    throw new RangeError(`Cut points ${JSON.stringify(cuts)} are not ordered within [0, ${s.length}].`);
  }
  const [c1, c2, c3, c4] = cuts;
  return { s, cuts, u: s.slice(0, c1), v: s.slice(c1, c2), x: s.slice(c2, c3), y: s.slice(c3, c4), z: s.slice(c4) };
}

/** Moves one cut point while keeping the four cuts ordered, by clamping the requested position. */
export function moveCut(s: string, cuts: Cuts, index: 0 | 1 | 2 | 3, to: number): Cuts {
  const lo = index === 0 ? 0 : cuts[index - 1];
  const hi = index === 3 ? s.length : cuts[index + 1];
  const next = [...cuts] as [number, number, number, number];
  next[index] = Math.min(hi, Math.max(lo, Math.round(to)));
  return next;
}

export interface ConstraintReport {
  /** The lemma only speaks about strings with |s| ≥ p. */
  longEnough: boolean;
  vxyLength: number;
  vyLength: number;
  vxyWithinP: boolean;
  vyNonEmpty: boolean;
  valid: boolean;
}

export function checkConstraints(d: Decomposition, p: number): ConstraintReport {
  const vxyLength = d.v.length + d.x.length + d.y.length;
  const vyLength = d.v.length + d.y.length;
  const longEnough = d.s.length >= p;
  const vxyWithinP = vxyLength <= p;
  const vyNonEmpty = vyLength > 0;
  return { longEnough, vxyLength, vyLength, vxyWithinP, vyNonEmpty, valid: vxyWithinP && vyNonEmpty };
}

export function pump(d: Decomposition, i: number): string {
  if (!Number.isInteger(i) || i < 0) throw new RangeError('The pumping exponent i must be a non-negative integer.');
  return d.u + d.v.repeat(i) + d.x + d.y.repeat(i) + d.z;
}

export interface PumpedSymbol {
  ch: string;
  segment: Segment;
  /** For v and y: which copy (0-based) this symbol belongs to. */
  copy: number;
}

/** The pumped string, symbol by symbol, tagged with the segment it came from (for colouring). */
export function pumpTagged(d: Decomposition, i: number): PumpedSymbol[] {
  const out: PumpedSymbol[] = [];
  const add = (str: string, segment: Segment, copy: number) => {
    for (const ch of str) out.push({ ch, segment, copy });
  };
  add(d.u, 'u', 0);
  for (let k = 0; k < i; k++) add(d.v, 'v', k);
  add(d.x, 'x', 0);
  for (let k = 0; k < i; k++) add(d.y, 'y', k);
  add(d.z, 'z', 0);
  return out;
}

const distinct = (str: string) => [...new Set(str)].sort();

export type CaseKind = 'straddle' | 'uniform';

export interface Classification {
  kind: CaseKind;
  /** Symbols appearing in v or y (the pumped material). */
  pumpedSymbols: string[];
  /** Symbols of {a,b,c} that pumping never changes. */
  untouched: string[];
  vSymbols: string[];
  ySymbols: string[];
  /** Symbols occurring anywhere in vxy. */
  windowSymbols: string[];
}

/**
 * Case split used in the proof (for s = aᵖbᵖcᵖ):
 *  - straddle: v or y contains two different symbols, i.e. sits across a block boundary.
 *  - uniform:  v and y are each made of a single symbol (or are empty).
 */
export function classify(d: Decomposition): Classification {
  const vSymbols = distinct(d.v);
  const ySymbols = distinct(d.y);
  const pumpedSymbols = distinct(d.v + d.y);
  const untouched = ['a', 'b', 'c'].filter((c) => !pumpedSymbols.includes(c));
  return {
    kind: vSymbols.length > 1 || ySymbols.length > 1 ? 'straddle' : 'uniform',
    pumpedSymbols,
    untouched,
    vSymbols,
    ySymbols,
    windowSymbols: distinct(d.v + d.x + d.y),
  };
}

export interface PumpOutcome {
  i: number;
  result: string;
  counts: Counts;
  verdict: Verdict;
}

export interface AttackReport {
  decomposition: Decomposition;
  constraints: ConstraintReport;
  classification: Classification;
  outcomes: PumpOutcome[];
  /** Exponents i for which uvⁱxyⁱz ∉ L — each one refutes this decomposition. */
  witnesses: number[];
  /** True when the decomposition is valid and every tested i stayed inside L. */
  survived: boolean;
  explanation: string[];
}

export const DEFAULT_TESTED_EXPONENTS = [0, 1, 2, 3] as const;

/**
 * Evaluates a challenger's decomposition against the lemma for L = {aⁿbⁿcⁿ}.
 * The explanation is generated from the computed facts, never from a canned script.
 */
export function evaluateAttack(s: string, cuts: Cuts, p: number, exponents: readonly number[] = DEFAULT_TESTED_EXPONENTS): AttackReport {
  const d = decompose(s, cuts);
  const constraints = checkConstraints(d, p);
  const classification = classify(d);
  const outcomes = exponents.map((i) => {
    const result = pump(d, i);
    return { i, result, counts: countSymbols(result), verdict: checkAnBnCn(result) };
  });
  const witnesses = outcomes.filter((o) => !o.verdict.member).map((o) => o.i);
  const explanation: string[] = [];

  if (!constraints.vyNonEmpty) {
    explanation.push('Disallowed: v and y are both empty, so pumping would change nothing. The lemma requires |vy| > 0.');
  }
  if (!constraints.vxyWithinP) {
    explanation.push(`Disallowed: |vxy| = ${constraints.vxyLength} exceeds p = ${p}. The lemma only promises decompositions with |vxy| ≤ p.`);
  }
  if (!constraints.longEnough) {
    explanation.push(`Note: |s| = ${s.length} < p = ${p}, so the lemma makes no promise about this string at all.`);
  }

  if (constraints.valid) {
    const w = outcomes.find((o) => !o.verdict.member);
    if (w) {
      if (classification.kind === 'straddle') {
        const which = classification.vSymbols.length > 1 ? 'v' : 'y';
        explanation.push(`${which} straddles a block boundary (it contains ${(which === 'v' ? classification.vSymbols : classification.ySymbols).join(' and ')}).`);
      } else if (classification.untouched.length > 0) {
        explanation.push(
          `v and y only contain ${classification.pumpedSymbols.join(', ')}; ${classification.untouched.join(' and ')} ${classification.untouched.length > 1 ? 'are' : 'is'} never pumped.`,
        );
      }
      explanation.push(`At i = ${w.i}: ${w.verdict.reason}`);
      explanation.push('This decomposition does not survive, so it cannot be the one the lemma promises.');
    } else {
      explanation.push(
        `Every tested exponent (${exponents.join(', ')}) kept the string in L. This decomposition survives the tests run here.`,
      );
      if (s.length < 3 * p || !checkAnBnCn(s).member) {
        explanation.push('That does not threaten the proof: the proof only needs one string — s = aᵖbᵖcᵖ — for which no valid decomposition survives.');
      }
    }
  }

  return {
    decomposition: d,
    constraints,
    classification,
    outcomes,
    witnesses,
    survived: constraints.valid && witnesses.length === 0,
    explanation,
  };
}

/** Every cut tuple satisfying |vxy| ≤ p and |vy| > 0 for the given string. */
export function enumerateValidCuts(s: string, p: number): Cuts[] {
  const out: Cuts[] = [];
  const n = s.length;
  for (let c1 = 0; c1 <= n; c1++) {
    for (let c4 = c1; c4 <= Math.min(n, c1 + p); c4++) {
      for (let c2 = c1; c2 <= c4; c2++) {
        for (let c3 = c2; c3 <= c4; c3++) {
          if (c2 - c1 + (c4 - c3) > 0) out.push([c1, c2, c3, c4]);
        }
      }
    }
  }
  return out;
}

export interface AuditResult {
  s: string;
  p: number;
  total: number;
  straddle: number;
  uniform: number;
  /** How many decompositions are refuted by i = 0 and by i = 2 respectively. */
  killedByZero: number;
  killedByTwo: number;
  /** Decompositions that stayed in L for every tested exponent. */
  survivors: Cuts[];
  /** Max number of distinct symbols in any admissible vxy window. */
  maxWindowSymbols: number;
}

/**
 * Exhaustively checks every valid decomposition of one string for one p.
 * This is an illustration for a concrete p — the proof covers all p by argument.
 */
export function auditString(s: string, p: number, exponents: readonly number[] = DEFAULT_TESTED_EXPONENTS): AuditResult {
  const cutsList = enumerateValidCuts(s, p);
  let straddle = 0;
  let uniform = 0;
  let killedByZero = 0;
  let killedByTwo = 0;
  let maxWindowSymbols = 0;
  const survivors: Cuts[] = [];
  for (const cuts of cutsList) {
    const d = decompose(s, cuts);
    const cls = classify(d);
    if (cls.kind === 'straddle') straddle++;
    else uniform++;
    maxWindowSymbols = Math.max(maxWindowSymbols, cls.windowSymbols.length);
    if (!checkAnBnCn(pump(d, 0)).member) killedByZero++;
    if (!checkAnBnCn(pump(d, 2)).member) killedByTwo++;
    if (exponents.every((i) => checkAnBnCn(pump(d, i)).member)) survivors.push(cuts);
  }
  return { s, p, total: cutsList.length, straddle, uniform, killedByZero, killedByTwo, survivors, maxWindowSymbols };
}

/** A sensible starting decomposition for s = aᵖbᵖcᵖ-style strings: v and y inside the a/b region. */
export function defaultCuts(s: string, p: number): Cuts {
  const n = s.length;
  if (n === 0) return [0, 0, 0, 0];
  const start = Math.max(0, Math.min(n - 1, Math.floor(n / 3) - 1));
  // |v| = 1, |x| = 1 if p ≥ 3, |y| = 1 if p ≥ 2, so |vxy| ≤ p always holds.
  const c1 = start;
  const c2 = Math.min(n, c1 + 1);
  const c3 = Math.min(n, c2 + (p >= 3 ? 1 : 0));
  const c4 = Math.min(n, c3 + (p >= 2 ? 1 : 0));
  return [c1, c2, c3, c4];
}
