/**
 * A generic pushdown-automaton engine with explicit transitions.
 *
 * Stack convention: index 0 is the TOP. So ['X','X','Z₀'] is written "XXZ₀",
 * leftmost symbol on top.
 *
 * A transition (q, a, A) → (q', γ) reads `a` (or nothing, for ε), pops `A`, and pushes γ
 * (γ is also written top-first, so pushing "XXZ₀" after popping Z₀ leaves XX on top of Z₀).
 */

export const EPSILON = 'ε';

export interface Transition {
  id: string;
  from: string;
  /** Input symbol consumed, or null for an ε-move. */
  read: string | null;
  pop: string;
  to: string;
  /** Replacement for the popped symbol, top-first. Empty array = plain pop. */
  push: readonly string[];
  /** Why this rule exists, in words. */
  purpose: string;
}

export interface PDA {
  name: string;
  states: readonly string[];
  inputAlphabet: readonly string[];
  stackAlphabet: readonly string[];
  start: string;
  bottom: string;
  accepting: readonly string[];
  transitions: readonly Transition[];
}

export interface Configuration {
  state: string;
  /** Index of the next unread input symbol. */
  pos: number;
  /** Top of stack is index 0. */
  stack: readonly string[];
}

export type HaltCode =
  | 'accepted'
  | 'no-transition'
  | 'symbol-not-in-alphabet'
  | 'input-remaining-in-final'
  | 'step-limit';

export interface Snapshot {
  index: number;
  config: Configuration;
  /** The transition that produced this configuration (null for the initial one). */
  via: Transition | null;
}

export interface Trace {
  input: string;
  snapshots: Snapshot[];
  accepted: boolean;
  halt: HaltCode;
  /** The configuration in which the machine stopped, and what it was looking at. */
  haltedAt: { state: string; pos: number; symbol: string | null; top: string | null };
}

export function initialConfiguration(pda: PDA): Configuration {
  return { state: pda.start, pos: 0, stack: [pda.bottom] };
}

export function formatStack(stack: readonly string[]): string {
  return stack.length === 0 ? EPSILON : stack.join('');
}

export function formatTransition(t: Transition): string {
  return `δ(${t.from}, ${t.read ?? EPSILON}, ${t.pop}) = (${t.to}, ${t.push.length ? t.push.join('') : EPSILON})`;
}

/** All transitions enabled in a configuration. */
export function enabledTransitions(pda: PDA, input: string, c: Configuration): Transition[] {
  const top = c.stack[0];
  if (top === undefined) return [];
  const next = c.pos < input.length ? input[c.pos] : null;
  return pda.transitions.filter((t) => t.from === c.state && t.pop === top && (t.read === null || t.read === next));
}

export function apply(t: Transition, c: Configuration): Configuration {
  return {
    state: t.to,
    pos: t.read === null ? c.pos : c.pos + 1,
    stack: [...t.push, ...c.stack.slice(1)],
  };
}

export type StepResult =
  | { kind: 'move'; transition: Transition; next: Configuration }
  | { kind: 'halt' };

/** One move of a deterministic PDA. Throws if more than one move is enabled. */
export function step(pda: PDA, input: string, c: Configuration): StepResult {
  const enabled = enabledTransitions(pda, input, c);
  if (enabled.length > 1) {
    throw new Error(`${pda.name} is not deterministic in ${c.state}: ${enabled.map((t) => t.id).join(', ')} all apply.`);
  }
  if (enabled.length === 0) return { kind: 'halt' };
  return { kind: 'move', transition: enabled[0], next: apply(enabled[0], c) };
}

/**
 * Runs the machine to completion, recording every configuration.
 * Acceptance: by final state, with the whole input consumed.
 * The recorded trace is what the simulator replays — rewinding is just indexing into it.
 */
export function run(pda: PDA, input: string, maxSteps = 4 * input.length + 16): Trace {
  let config = initialConfiguration(pda);
  const snapshots: Snapshot[] = [{ index: 0, config, via: null }];

  const badIndex = [...input].findIndex((ch) => !pda.inputAlphabet.includes(ch));

  for (let n = 0; n < maxSteps; n++) {
    const r = step(pda, input, config);
    if (r.kind === 'halt') break;
    config = r.next;
    snapshots.push({ index: snapshots.length, config, via: r.transition });
  }

  const consumed = config.pos === input.length;
  const final = pda.accepting.includes(config.state);
  let halt: HaltCode;
  if (enabledTransitions(pda, input, config).length > 0) halt = 'step-limit';
  else if (consumed && final) halt = 'accepted';
  else if (badIndex !== -1 && config.pos === badIndex) halt = 'symbol-not-in-alphabet';
  else if (final && !consumed) halt = 'input-remaining-in-final';
  else halt = 'no-transition';

  return {
    input,
    snapshots,
    accepted: halt === 'accepted',
    halt,
    haltedAt: {
      state: config.state,
      pos: config.pos,
      symbol: config.pos < input.length ? input[config.pos] : null,
      top: config.stack[0] ?? null,
    },
  };
}
