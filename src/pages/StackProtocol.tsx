import { useEffect, useMemo, useRef } from 'react';
import { useCaseLog } from '../app/caseLog';
import { href } from '../app/router';
import { Stamp } from '../components/Evidence';
import { M, StackText, StackWord } from '../components/M';
import { Reveal } from '../components/Reveal';
import { Tape, StackView, TransitionLog, TransitionTable } from '../features/stack/MachineParts';
import { StateDiagram } from '../features/stack/StateDiagram';
import { MAX_INPUT, useSimulator } from '../features/stack/useSimulator';
import { checkAnB2n, compress } from '../logic/languages';
import { explainHalt, runStackProtocol, STATE_ROLES, stackAfterEachSymbol } from '../logic/stackProtocol';
import '../features/stack/stack.css';

const PRESETS = ['aabbbb', 'abb', 'aaabbbbbb', 'ab', 'aabbb', 'aabbbbb', 'ba', ''];
const CASEBOOK = ['aabbbb', 'aaabbbbbb', 'ab', 'aabbb', 'aabbbbb', 'ba', '', 'abab', 'aaa', 'abba', 'aab#b'];

export function StackProtocol() {
  const sim = useSimulator('aabbbb');
  const { record } = useCaseLog();
  const consoleRef = useRef<HTMLElement>(null);
  const { trace, index } = sim;
  const snap = trace.snapshots[index];
  const prev = index > 0 ? trace.snapshots[index - 1] : null;
  const nextVia = index < trace.snapshots.length - 1 ? trace.snapshots[index + 1].via : null;
  const halted = sim.atEnd ? (trace.accepted ? 'accepted' : 'rejected') : null;
  const haltNote = sim.atEnd ? explainHalt(trace) : null;
  const diagnosis = checkAnB2n(trace.input);
  const evolution = useMemo(() => stackAfterEachSymbol(trace), [trace]);
  const currentRow = evolution.findIndex((r) => r.processed === (snap.config.pos === 0 ? 'Start' : trace.input.slice(0, snap.config.pos)));
  const foreign = [...trace.input].findIndex((ch) => ch !== 'a' && ch !== 'b');
  const change = prev ? (snap.config.stack.length > prev.config.stack.length ? 'push' : snap.config.stack.length < prev.config.stack.length ? 'pop' : 'same') : null;

  useEffect(() => {
    if (!sim.atEnd) return;
    record((log) => ({ ...log, pdaRuns: [trace.input, ...log.pdaRuns.filter((s) => s !== trace.input)].slice(0, 10) }));
  }, [sim.atEnd, trace.input, record]);

  // Keyboard: ← → step, space play/pause, Home/End. Ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [role="slider"]')) return;
      if (!consoleRef.current?.contains(el) && el !== document.body) return;
      if (e.key === 'ArrowRight') sim.stepForward();
      else if (e.key === 'ArrowLeft') sim.stepBack();
      else if (e.key === ' ' && el.tagName !== 'BUTTON') sim.togglePlay();
      else if (e.key === 'Home') sim.reset();
      else if (e.key === 'End') sim.toEnd();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim]);

  return (
    <div className="page stack-page">
      <header className="case-head">
        <div>
          <p className="eyebrow">Case 02 · pushdown automata</p>
          <h1 tabIndex={-1}>Stack Protocol</h1>
          <p className="case-head__claim">
            Machine M accepts exactly <M>{'L = { a^nb^{2n} | n ≥ 1 }'}</M>
          </p>
        </div>
        <p className="case-head__aside">
          Protocol: every <M>a</M> deposits two markers <span className="math">X</span>. Every <M>b</M> withdraws one. The books must balance exactly when the tape ends.
        </p>
      </header>

      <section className="console" ref={consoleRef} aria-labelledby="console-title">
        <h2 id="console-title" className="visually-hidden">
          Simulator
        </h2>
        <div className="console__input">
          <div className="field">
            <label htmlFor="pda-input">Input tape (max {MAX_INPUT} symbols)</label>
            <input
              id="pda-input"
              className="input"
              value={sim.input}
              maxLength={MAX_INPUT}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => sim.setInput(e.target.value)}
              aria-describedby="pda-input-note"
            />
            <p id="pda-input-note" className="hint-text">
              {foreign !== -1
                ? `Position ${foreign + 1} holds “${trace.input[foreign]}”, which is outside Σ = {a, b}. The machine will get stuck there.`
                : trace.input.length === 0
                  ? 'Empty tape. Run it to see why ε is rejected.'
                  : `${trace.input.length} symbols: ${compress(trace.input)}.`}
            </p>
          </div>
          <div className="field">
            <span className="label" id="pda-presets">
              Load evidence
            </span>
            <div className="chip-row" role="group" aria-labelledby="pda-presets">
              {PRESETS.map((p) => (
                <button key={p || 'eps'} type="button" className="btn btn--small" aria-pressed={sim.input === p} onClick={() => sim.setInput(p)}>
                  {p || 'ε (empty)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="console__machine">
          <div className="console__main">
            <Tape input={trace.input} pos={snap.config.pos} />
            <div className="diagram-wrap">
              <StateDiagram current={snap.config.state} lastTransition={snap.via?.id ?? null} halted={halted} />
            </div>
            <div className="controls" role="group" aria-label="Playback controls">
              <button type="button" className="btn btn--small" onClick={sim.reset} disabled={sim.atStart}>
                ⏮ Reset
              </button>
              <button type="button" className="btn btn--small" onClick={sim.stepBack} disabled={sim.atStart}>
                ◀ Back
              </button>
              <button type="button" className="btn btn--small btn--marker controls__play" onClick={sim.togglePlay}>
                {sim.playing ? '❚❚ Pause' : sim.atEnd ? '↻ Replay' : '▶ Play'}
              </button>
              <button type="button" className="btn btn--small btn--ink" onClick={sim.stepForward} disabled={sim.atEnd}>
                Step ▶
              </button>
              <button type="button" className="btn btn--small" onClick={sim.toEnd} disabled={sim.atEnd}>
                End ⏭
              </button>
              <label className="controls__speed">
                <span className="label">Speed</span>
                <input type="range" min={150} max={1500} step={50} value={1650 - sim.delay} onChange={(e) => sim.setDelay(1650 - Number(e.target.value))} aria-valuetext={`${sim.delay} ms per step`} />
              </label>
            </div>
            <p className="hint-text controls__keys">
              Keys: <kbd>←</kbd> <kbd>→</kbd> step · <kbd>Space</kbd> play/pause · <kbd>Home</kbd> <kbd>End</kbd>
            </p>
          </div>
          <StackView stack={snap.config.stack} change={change} />
        </div>

        <div className={`status${halted ? ` status--${halted}` : ''}`} role="status" aria-live="polite">
          <div className="status__head">
            <span className="label">
              Step {index} / {trace.snapshots.length - 1} · state {snap.config.state}
            </span>
            {halted ? <Stamp tone={halted === 'accepted' ? 'accept' : 'reject'}>{halted}</Stamp> : <Stamp tone="pending">running</Stamp>}
          </div>
          <p>
            <strong>{STATE_ROLES[snap.config.state]}</strong>{' '}
            {halted ? (
              <StackText text={haltNote!} />
            ) : nextVia ? (
              <>
                Next: <span className="mono">{nextVia.id}</span>, because the state is {snap.config.state},{' '}
                {nextVia.read ? `the head reads “${nextVia.read}”` : 'no input is needed'} and the top is <StackWord word={nextVia.pop} />.
              </>
            ) : null}
          </p>
          {halted && (
            <p className="hint-text">
              Language check, independent of the machine: {diagnosis.reason} {diagnosis.member === trace.accepted ? 'Machine and definition agree.' : 'Machine and definition DISAGREE.'}
            </p>
          )}
        </div>

        <div className="console__records">
          <div>
            <h3 className="console__h">Transition log</h3>
            <p className="hint-text">Select any entry to rewind to that exact configuration.</p>
            <TransitionLog trace={trace} index={index} onJump={sim.jumpTo} haltNote={sim.atEnd && !trace.accepted ? `Halt: ${haltNote}` : null} />
          </div>
          <div>
            <h3 className="console__h">
              Transition function <span className="math">δ</span>
            </h3>
            <TransitionTable used={snap.via?.id ?? null} next={nextVia?.id ?? null} />
            <h3 className="console__h">Stack after each symbol</h3>
            <div className="table-scroll">
              <table className="ledger evo-table">
                <caption className="visually-hidden">Stack contents after each input symbol is consumed, top on the left</caption>
                <thead>
                  <tr>
                    <th scope="col">Input processed</th>
                    <th scope="col">Stack (top = left)</th>
                  </tr>
                </thead>
                <tbody>
                  {evolution.map((r, k) => (
                    <tr key={k} className={k === currentRow ? 'is-current' : ''}>
                      <td className="mono">{r.processed}</td>
                      <td className="mono">
                        <StackWord word={r.stack} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint-text">Built from the simulator’s own trace, so it changes with the tape.</p>
          </div>
        </div>
      </section>

      <section className="lab-block" aria-labelledby="spec-title">
        <div className="section-title">
          <span className="section-title__code">S</span>
          <h2 id="spec-title">Specification</h2>
          <p>
            M = (Q, Σ, Γ, δ, q<sub>0</sub>, Z<sub>0</sub>, F), a deterministic PDA that accepts by final state once the whole input has been read.
          </p>
        </div>
        <dl className="spec">
          <div>
            <dt>Q</dt>
            <dd className="math">{'{ q0, q1, q2, q3 }'}</dd>
          </div>
          <div>
            <dt>Σ</dt>
            <dd className="math">{'{ a, b }'}</dd>
          </div>
          <div>
            <dt>Γ</dt>
            <dd>
              <StackWord word="{ X, Z₀ }" />
            </dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd className="math">q0</dd>
          </div>
          <div>
            <dt>Bottom</dt>
            <dd>
              <StackWord word="Z₀" />
            </dd>
          </div>
          <div>
            <dt>F</dt>
            <dd className="math">{'{ q3 }'}</dd>
          </div>
        </dl>
        <div className="note note--blue">
          <p>
            <strong>Stack convention.</strong> Stacks are written with the <em>leftmost symbol on top</em>: <StackWord word="XXZ₀" /> means two X’s sitting on Z
            <sub>0</sub>. A rule δ(q, a, A) = (q′, γ) pops A and pushes the word γ, so γ’s leftmost symbol becomes the new top. Rule t2 pops one X and pushes XXX: net +2.
          </p>
        </div>
        <Reveal hint={<p>What does the stack height tell you after reading aⁿ? And when can t5 fire?</p>} revealLabel="Why M is correct">
          <ol className="proof-list">
            <li>
              <strong>Shape.</strong> The only route to q3 is q0 →<sub>a</sub> q1 (→<sub>a</sub> q1)* →<sub>b</sub> q2 (→<sub>b</sub> q2)* →<sub>ε</sub> q3. No rule reads a in q2 or
              anything in q3, so every accepted string has the form a<sup>n</sup>b<sup>m</sup> with n, m ≥ 1.
            </li>
            <li>
              <strong>Counting.</strong> After reading a<sup>n</sup>, the stack is X<sup>2n</sup>Z<sub>0</sub> (t1 gives 2, each t2 adds a net 2). Each b pops exactly one X,
              and b can only be read while X is on top.
            </li>
            <li>
              <strong>Balance.</strong> t5 needs Z<sub>0</sub> on top, i.e. exactly 2n b’s read. If m &lt; 2n the input runs out with X on top and nothing fires. If m &gt; 2n,
              the (2n+1)-th b finds Z<sub>0</sub>, t5 moves to q3, and q3 cannot read the remaining b’s.
            </li>
            <li>
              <strong>Conclusion.</strong> M halts in q3 with all input consumed iff the input is a<sup>n</sup>b<sup>2n</sup> with n ≥ 1. The empty string fails at once: q0 has no
              ε-move. The simulator was also checked against the definition on all 2,047 strings over {'{a, b}'} of length ≤ 10.
            </li>
          </ol>
        </Reveal>
      </section>

      <section className="lab-block" aria-labelledby="casebook-title">
        <div className="section-title">
          <span className="section-title__code">R</span>
          <h2 id="casebook-title">Casebook: why strings are rejected</h2>
          <p>Every verdict below comes from running the machine just now. Load one into the simulator to watch where it gets stuck.</p>
        </div>
        <ul className="casebook">
          {CASEBOOK.map((s) => {
            const t = runStackProtocol(s);
            return (
              <li key={s || 'eps'} className="casebook__item">
                <div className="casebook__top">
                  <span className="mono casebook__word">{s || 'ε'}</span>
                  <Stamp tone={t.accepted ? 'accept' : 'reject'}>{t.accepted ? 'accepted' : 'rejected'}</Stamp>
                </div>
                <p>
                  <StackText text={explainHalt(t)} />
                </p>
                {s === 'aaabbbbbb' && <p className="hint-text">Sometimes filed as a rejection, but it is a³b⁶: n = 3 and 2n = 6, so it belongs to L.</p>}
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => {
                    sim.setInput(s);
                    consoleRef.current?.scrollIntoView({ block: 'start' });
                  }}
                >
                  Load into simulator
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="case-foot">
        <p>One stack can count one quantity against another. Can it count three? The Comparison Chamber puts memory models side by side.</p>
        <a className="btn btn--ink" href={href('chamber')}>
          Enter the chamber
        </a>
      </footer>
    </div>
  );
}
