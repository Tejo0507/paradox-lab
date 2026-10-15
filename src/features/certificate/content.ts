/**
 * The certificate as structured data in the lab's notation markup (^ superscript, _ subscript),
 * rendered as HTML on the page and as Unicode plain text for copying/downloading.
 */
import type { CaseLog } from '../../app/caseLog';
import { formatTransition } from '../../logic/pda';
import { runStackProtocol, STACK_PROTOCOL, stackAfterEachSymbol } from '../../logic/stackProtocol';

export interface Block {
  kind: 'p' | 'ol' | 'ul' | 'table' | 'qed';
  label?: string;
  text?: string;
  items?: string[];
  rows?: string[][];
}

export interface CertSection {
  id: string;
  heading: string;
  blocks: Block[];
}

export function buildCertificate(log: CaseLog): CertSection[] {
  const trace = runStackProtocol('aabbbb');
  const evolution = stackAfterEachSymbol(trace);

  const record: string[] = [
    `Proof steps reviewed: ${log.proofStepsRevealed} of 8.`,
    `Defenses submitted in Proof Attack: ${log.attacks} (${log.attacksRefuted} legal splits refuted, ${log.straddleAttacks} of them boundary-straddling).`,
    log.auditsRun.length
      ? `Exhaustive audits run: ${log.auditsRun.map((a) => `p = ${a.p} on a^{${a.n}}b^{${a.n}}c^{${a.n}} (${a.total} legal splits, ${a.survivors} survivor${a.survivors === 1 ? '' : 's'})`).join('; ')}.`
      : 'Exhaustive audits run: none yet.',
    log.pdaRuns.length ? `Tapes run to completion on the PDA: ${log.pdaRuns.map((s) => s || 'ε').join(', ')}.` : 'Tapes run to completion on the PDA: none yet.',
  ];

  return [
    {
      id: 'thm1',
      heading: 'Theorem 1 · {a^nb^nc^n} is not context-free',
      blocks: [
        { kind: 'p', label: 'Theorem.', text: 'The language L = { a^nb^nc^n | n ≥ 0 } over Σ = {a, b, c} is not context-free.' },
        {
          kind: 'p',
          label: 'Lemma used (context-free pumping lemma).',
          text: 'If L is context-free, there is an integer p ≥ 1 such that every s ∈ L with |s| ≥ p can be written s = uvxyz where (1) |vxy| ≤ p, (2) |vy| > 0, and (3) uv^ixy^iz ∈ L for every i ≥ 0.',
        },
        {
          kind: 'p',
          label: 'Proof.',
          text: 'Suppose, for contradiction, that L is context-free, and let p be the pumping length given by the lemma. Let s = a^pb^pc^p. Then s ∈ L and |s| = 3p ≥ p, so s = uvxyz for some u, v, x, y, z satisfying (1)–(3). Fix any such decomposition. We show that uv^2xy^2z ∉ L.',
        },
        {
          kind: 'p',
          label: 'Claim.',
          text: 'vxy does not contain both an a and a c. Indeed, the last a of s is at position p and the first c at position 2p + 1, so any substring containing both has length at least p + 2 > p, contradicting (1). Note that v or y may still cross the a|b or b|c boundary; this is handled in Case A.',
        },
        {
          kind: 'p',
          label: 'Case A (a boundary is straddled).',
          text: 'v or y contains two distinct symbols. By the Claim it cannot contain all three, so it is of the form a^jb^k or b^jc^k with j, k ≥ 1. In uv^2xy^2z this part occurs twice in a row, producing the factor ba or cb. The string is therefore not of the form a*b*c*, so uv^2xy^2z ∉ L.',
        },
        {
          kind: 'p',
          label: 'Case B (uniform parts).',
          text: 'v and y each consist of a single repeated symbol (or are empty). By the Claim some σ ∈ {a, c} occurs in neither v nor y, so uv^2xy^2z still contains exactly p copies of σ. Since |vy| > 0, some symbol τ ≠ σ occurs in vy, and uv^2xy^2z contains p + #_τ(vy) > p copies of τ. The counts are unequal, so uv^2xy^2z ∉ L.',
        },
        {
          kind: 'p',
          label: 'Conclusion.',
          text: 'Cases A and B cover every decomposition satisfying (1) and (2), and each violates (3) at i = 2. This contradicts the lemma, so L is not context-free.',
        },
        { kind: 'qed' },
        {
          kind: 'p',
          label: 'Remark.',
          text: 'i = 0 also works for every decomposition: deleting v and y from a string of the form a*b*c* keeps that form, leaves #σ = p, and lowers some other count below p. A single refuted decomposition illustrates the argument but proves nothing on its own. The proof needs the case analysis, which covers all decompositions and every p.',
        },
      ],
    },
    {
      id: 'thm2',
      heading: 'Theorem 2 · a PDA for {a^nb^{2n} | n ≥ 1}',
      blocks: [
        {
          kind: 'p',
          label: 'Machine.',
          text: 'M = (Q, Σ, Γ, δ, q_0, Z_0, F) with Q = {q_0, q_1, q_2, q_3}, Σ = {a, b}, Γ = {X, Z_0}, start state q_0, bottom marker Z_0, F = {q_3}. M accepts by final state after consuming all input. Stacks are written top-first (leftmost symbol on top).',
        },
        { kind: 'ol', items: STACK_PROTOCOL.transitions.map((t) => `${t.id}: ${formatTransition(t).replace(/Z₀/g, 'Z_0').replace(/q(\d)/g, 'q_$1')}  (${t.purpose.replace(/Z₀/g, 'Z_0')})`) },
        {
          kind: 'p',
          label: 'Invariant.',
          text: 'From the start configuration, after reading a^k (k ≥ 1) M is in q_1 with stack X^{2k}Z_0. After reading a^nb^m with 1 ≤ m ≤ 2n it is in q_2 with stack X^{2n−m}Z_0. Both follow by induction on the number of moves, since t1 and t2 add a net two X per a and t3 and t4 remove one X per b.',
        },
        {
          kind: 'p',
          label: 'Proof of correctness.',
          text: 'Only t5 enters q_3, and only with Z_0 on top in q_2, so M reaches q_3 exactly after reading a^nb^{2n} for some n ≥ 1. q_3 has no outgoing moves, so M accepts iff the input ends there. Every other input either gets stuck (wrong first symbol, an a after a b, input ending with X on the stack) or reaches q_3 with input left over (more than 2n b’s). The empty input is rejected because q_0 has no ε-move. Hence L(M) = { a^nb^{2n} | n ≥ 1 }.',
        },
        { kind: 'qed' },
        {
          kind: 'table',
          label: 'Execution on aabbbb, produced by the simulator (top = left):',
          rows: [['Input processed', 'Stack'], ...evolution.map((r) => [r.processed, r.stack.replace(/Z₀/g, 'Z_0')]), ['(ε-move t5)', `${trace.snapshots.at(-1)!.config.stack.join('').replace(/Z₀/g, 'Z_0')}, state q_3: ACCEPTED`]],
        },
      ],
    },
    {
      id: 'record',
      heading: 'Investigation record',
      blocks: [
        { kind: 'ul', items: record },
        {
          kind: 'p',
          text: 'The record documents experiments run in this browser. The theorems above stand on their proofs alone. Finite experiments illustrate them but cannot replace them.',
        },
      ],
    },
  ];
}

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', n: 'ⁿ', i: 'ⁱ', p: 'ᵖ', j: 'ʲ', k: 'ᵏ', m: 'ᵐ', '−': '⁻', '+': '⁺', '*': '*' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', τ: 'τ' };

/** Converts notation markup to Unicode for plain text. Unknown characters are kept in ^(…) form. */
export function toUnicode(src: string): string {
  return src.replace(/([\^_])(\{([^}]*)\}|(.))/g, (_m, op: string, _g, group: string | undefined, single: string | undefined) => {
    const body = group ?? single ?? '';
    const map = op === '^' ? SUP : SUB;
    const chars = [...body];
    if (chars.every((c) => map[c])) return chars.map((c) => map[c]).join('');
    return op === '^' ? `^(${body})` : `_(${body})`;
  });
}

export function certificateText(sections: CertSection[], issued: string): string {
  const lines: string[] = ['PARADOX LAB · PROOF CERTIFICATE', `Issued ${issued}`, ''];
  for (const s of sections) {
    lines.push(toUnicode(s.heading).toUpperCase(), '='.repeat(Math.min(72, s.heading.length)), '');
    for (const b of s.blocks) {
      if (b.kind === 'p') lines.push(`${b.label ? b.label + ' ' : ''}${toUnicode(b.text ?? '')}`, '');
      if (b.kind === 'qed') lines.push('∎', '');
      if (b.kind === 'ol') b.items!.forEach((it, k) => lines.push(`  ${k + 1}. ${toUnicode(it)}`));
      if (b.kind === 'ul') b.items!.forEach((it) => lines.push(`  - ${toUnicode(it)}`));
      if (b.kind === 'table') {
        if (b.label) lines.push(b.label);
        b.rows!.forEach((r) => lines.push(`  ${toUnicode(r[0]).padEnd(16)} ${toUnicode(r[1])}`));
      }
      if (b.kind === 'ol' || b.kind === 'ul' || b.kind === 'table') lines.push('');
    }
  }
  return lines.join('\n');
}
