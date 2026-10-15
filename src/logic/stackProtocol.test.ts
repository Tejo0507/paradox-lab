import { describe, expect, it } from 'vitest';
import { checkAnB2n } from './languages';
import { enabledTransitions, formatStack, formatTransition, initialConfiguration, run, step } from './pda';
import { explainHalt, runStackProtocol, STACK_PROTOCOL, stackAfterEachSymbol } from './stackProtocol';

describe('Stack Protocol PDA for aⁿb²ⁿ', () => {
  it('accepts aabbbb with the exact stack evolution (top = leftmost)', () => {
    const trace = runStackProtocol('aabbbb');
    expect(trace.accepted).toBe(true);
    expect(stackAfterEachSymbol(trace)).toEqual([
      { processed: 'Start', stack: 'Z₀' },
      { processed: 'a', stack: 'XXZ₀' },
      { processed: 'aa', stack: 'XXXXZ₀' },
      { processed: 'aab', stack: 'XXXZ₀' },
      { processed: 'aabb', stack: 'XXZ₀' },
      { processed: 'aabbb', stack: 'XZ₀' },
      { processed: 'aabbbb', stack: 'Z₀' },
    ]);
    const last = trace.snapshots.at(-1)!;
    expect(last.config).toEqual({ state: 'q3', pos: 6, stack: ['Z₀'] });
    expect(last.via?.id).toBe('t5');
    expect(trace.snapshots.map((s) => s.via?.id ?? '-')).toEqual(['-', 't1', 't2', 't3', 't4', 't4', 't4', 't5']);
  });

  it.each(['abb', 'aabbbb', 'aaabbbbbb', 'a'.repeat(10) + 'b'.repeat(20)])('accepts %s', (s) => {
    expect(runStackProtocol(s).accepted).toBe(true);
  });

  it.each([
    ['ab', 'no-transition', /too few b’s/],
    ['aabbb', 'no-transition', /too few b’s/],
    ['aabbbbb', 'input-remaining-in-final', /more than 2n/],
    ['ba', 'no-transition', /first symbol is b/],
    ['aaabbbbb', 'no-transition', /too few/],
    ['aaabbbbbbb', 'input-remaining-in-final', /more than 2n/],
    ['abba', 'input-remaining-in-final', /a after the b/],
    ['abab', 'no-transition', /a appears after a b/],
    ['aaa', 'no-transition', /no b’s/],
    ['abxb', 'symbol-not-in-alphabet', /not in Σ/],
  ])('rejects %s (%s)', (s, halt, why) => {
    const trace = runStackProtocol(s);
    expect(trace.accepted).toBe(false);
    expect(trace.halt).toBe(halt);
    expect(explainHalt(trace)).toMatch(why);
  });

  it('rejects the empty string because n ≥ 1', () => {
    const trace = runStackProtocol('');
    expect(trace.accepted).toBe(false);
    expect(trace.snapshots).toHaveLength(1);
    expect(explainHalt(trace)).toMatch(/n ≥ 1/);
  });

  it('agrees with the membership checker on every string over {a,b} up to length 10', () => {
    const strings: string[] = [''];
    for (let len = 1; len <= 10; len++) {
      for (let mask = 0; mask < 1 << len; mask++) {
        let s = '';
        for (let k = len - 1; k >= 0; k--) s += mask & (1 << k) ? 'b' : 'a';
        strings.push(s);
      }
    }
    for (const s of strings) expect(runStackProtocol(s).accepted, s).toBe(checkAnB2n(s).member);
  });

  it('is deterministic: at most one transition is ever enabled', () => {
    for (const s of ['aabbbb', 'abab', 'aabbbbb', 'ba']) {
      for (const snap of runStackProtocol(s).snapshots) {
        expect(enabledTransitions(STACK_PROTOCOL, s, snap.config).length).toBeLessThanOrEqual(1);
      }
    }
  });

  it('formats transitions and stacks', () => {
    expect(formatTransition(STACK_PROTOCOL.transitions[0])).toBe('δ(q0, a, Z₀) = (q1, XXZ₀)');
    expect(formatTransition(STACK_PROTOCOL.transitions[4])).toBe('δ(q2, ε, Z₀) = (q3, Z₀)');
    expect(formatStack([])).toBe('ε');
  });

  it('every transition in a trace is legal for the configuration it was applied to', () => {
    const t = runStackProtocol('aaabbbbbb');
    for (let k = 1; k < t.snapshots.length; k++) {
      const prev = t.snapshots[k - 1].config;
      const r = step(STACK_PROTOCOL, t.input, prev);
      expect(r.kind).toBe('move');
      if (r.kind === 'move') {
        expect(r.transition).toBe(t.snapshots[k].via);
        expect(r.next).toEqual(t.snapshots[k].config);
      }
    }
  });

  it('rewinding to an earlier snapshot and replaying reproduces the same configurations', () => {
    const t = runStackProtocol('aabbbb');
    const rewindTo = 3;
    let config = t.snapshots[rewindTo].config;
    expect(config).toEqual({ state: 'q2', pos: 3, stack: ['X', 'X', 'X', 'Z₀'] });
    for (let k = rewindTo + 1; k < t.snapshots.length; k++) {
      const r = step(STACK_PROTOCOL, t.input, config);
      if (r.kind !== 'move') throw new Error('unexpected halt');
      config = r.next;
      expect(config).toEqual(t.snapshots[k].config);
    }
  });

  it('a nondeterministic machine is reported rather than silently resolved', () => {
    const bad = { ...STACK_PROTOCOL, transitions: [...STACK_PROTOCOL.transitions, { ...STACK_PROTOCOL.transitions[0], id: 'dup' }] };
    expect(() => run(bad, 'abb')).toThrow(/not deterministic/);
    expect(initialConfiguration(STACK_PROTOCOL)).toEqual({ state: 'q0', pos: 0, stack: ['Z₀'] });
  });
});
