/**
 * The Stack Protocol machine: a deterministic PDA for L = { aⁿb²ⁿ | n ≥ 1 }.
 *
 *   Q = {q0, q1, q2, q3}   Σ = {a, b}   Γ = {X, Z₀}   start q0   bottom Z₀   F = {q3}
 *
 *   t1  δ(q0, a, Z₀) = (q1, XXZ₀)   first a: push two markers
 *   t2  δ(q1, a, X)  = (q1, XXX)    every further a: push two more
 *   t3  δ(q1, b, X)  = (q2, ε)      first b: pop one marker, a's are now closed
 *   t4  δ(q2, b, X)  = (q2, ε)      every further b: pop one marker
 *   t5  δ(q2, ε, Z₀) = (q3, Z₀)     all markers matched: move to accept
 *
 * Correctness sketch. The only path to q3 is q0 →a q1 (a)* →b q2 (b)* →ε q3, so accepted
 * strings have the shape a⁺b⁺. After aⁿ the stack holds 2n markers; each b removes one and
 * b's can only be read while a marker is on top, and t5 fires only on Z₀. So the machine
 * reaches q3 exactly when the number of b's read equals 2n, and accepts iff that happens with
 * the input exhausted (q3 has no outgoing moves). Hence L(M) = { aⁿb²ⁿ | n ≥ 1 }.
 */
import { type PDA, type Trace, run } from './pda';

export const Z0 = 'Z₀';

export const STACK_PROTOCOL: PDA = {
  name: 'Stack Protocol',
  states: ['q0', 'q1', 'q2', 'q3'],
  inputAlphabet: ['a', 'b'],
  stackAlphabet: ['X', Z0],
  start: 'q0',
  bottom: Z0,
  accepting: ['q3'],
  transitions: [
    { id: 't1', from: 'q0', read: 'a', pop: Z0, to: 'q1', push: ['X', 'X', Z0], purpose: 'First a: record it as two X markers on top of Z₀.' },
    { id: 't2', from: 'q1', read: 'a', pop: 'X', to: 'q1', push: ['X', 'X', 'X'], purpose: 'Another a: put back the X we popped, plus two new ones (net +2).' },
    { id: 't3', from: 'q1', read: 'b', pop: 'X', to: 'q2', push: [], purpose: 'First b: cancel one X. From now on no a may appear.' },
    { id: 't4', from: 'q2', read: 'b', pop: 'X', to: 'q2', push: [], purpose: 'Another b: cancel one more X.' },
    { id: 't5', from: 'q2', read: null, pop: Z0, to: 'q3', push: [Z0], purpose: 'Bottom marker exposed: every X has been matched, so move to the accepting state.' },
  ],
};

export const STATE_ROLES: Record<string, string> = {
  q0: 'Start. Expecting the first a.',
  q1: 'Reading a’s. Each one adds two X.',
  q2: 'Reading b’s. Each one removes one X.',
  q3: 'Accepting. Every X has been matched.',
};

export function runStackProtocol(input: string): Trace {
  return run(STACK_PROTOCOL, input);
}

/** Why the machine stopped, from the machine's point of view (state, symbol, stack top). */
export function explainHalt(trace: Trace): string {
  const { state, symbol, top, pos } = trace.haltedAt;
  const remaining = trace.input.slice(pos);
  switch (trace.halt) {
    case 'accepted':
      return 'All input consumed, the stack is back to Z₀ and the machine is in q3: ACCEPTED.';
    case 'symbol-not-in-alphabet':
      return `Symbol “${symbol}” at position ${pos + 1} is not in Σ = {a, b}. No transition can read it, so the machine halts and rejects.`;
    case 'input-remaining-in-final':
      return `The stack returned to Z₀ and the machine reached q3, but “${remaining}” is still unread. q3 has no moves, so the input is never consumed: REJECTED. ${
        remaining.includes('a') ? 'An a after the b’s breaks the aⁿb²ⁿ shape.' : 'There were more than 2n b’s.'
      }`;
    case 'step-limit':
      return 'The step limit was reached before the machine halted.';
    case 'no-transition':
      break;
  }

  if (trace.input.length === 0) {
    return 'Empty input: q0 needs an a to start, and the language requires n ≥ 1. No move applies, so the machine rejects.';
  }
  if (symbol === null) {
    if (state === 'q1') return `Input ended while still reading a’s (state q1). There were no b’s to cancel the ${trace.snapshots.at(-1)!.config.stack.length - 1} X markers: REJECTED.`;
    if (state === 'q2') {
      const left = trace.snapshots.at(-1)!.config.stack.length - 1;
      return `Input ended with ${left} X marker${left === 1 ? '' : 's'} still on the stack: too few b’s (${left} more needed). t5 needs Z₀ on top, so q3 is unreachable: REJECTED.`;
    }
  }
  if (state === 'q0' && symbol === 'b') return 'The very first symbol is b. q0 only moves on a (n ≥ 1, and a’s must come first): REJECTED.';
  if (state === 'q2' && symbol === 'a') return `An a appears after a b (position ${pos + 1}). In q2 there is no rule reading a, because the a’s are closed: REJECTED.`;
  return `No transition is defined for state ${state}, input ${symbol ?? 'end'}, stack top ${top ?? 'empty'}: REJECTED.`;
}

/** Stack after each input-consuming step — the table from the case file. */
export function stackAfterEachSymbol(trace: Trace): { processed: string; stack: string }[] {
  const rows = [{ processed: 'Start', stack: trace.snapshots[0].config.stack.join('') }];
  for (const snap of trace.snapshots.slice(1)) {
    if (snap.via?.read) rows.push({ processed: trace.input.slice(0, snap.config.pos), stack: snap.config.stack.join('') });
  }
  return rows;
}
