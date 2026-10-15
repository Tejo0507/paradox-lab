import { StackSymbol, StackText, StackWord } from '../../components/M';
import { formatTransition, type Snapshot, type Trace } from '../../logic/pda';
import { STACK_PROTOCOL } from '../../logic/stackProtocol';

/** The input tape with the read head. */
export function Tape({ input, pos }: { input: string; pos: number }) {
  const cells = [...input];
  return (
    <div className="tape-wrap">
      <ol className="tape" aria-label={`Input tape. ${pos} of ${cells.length} symbols read.${pos < cells.length ? ` Head on “${cells[pos]}”, position ${pos + 1}.` : ' Head past the end.'}`}>
        {cells.map((ch, i) => (
          <li
            key={i}
            className={`tape__cell${i < pos ? ' is-read' : ''}${i === pos ? ' is-head' : ''}${ch !== 'a' && ch !== 'b' ? ' is-foreign' : ''}`}
            aria-current={i === pos ? 'true' : undefined}
          >
            <span>{ch === ' ' ? '␣' : ch}</span>
            <small>{i + 1}</small>
          </li>
        ))}
        <li className={`tape__cell tape__end${pos >= cells.length ? ' is-head' : ''}`} aria-label="end of input">
          <span>⊣</span>
          <small>end</small>
        </li>
      </ol>
    </div>
  );
}

/** The stack, drawn top-up. The text form uses leftmost = top, matching the case file. */
export function StackView({ stack, change }: { stack: readonly string[]; change: 'push' | 'pop' | 'same' | null }) {
  return (
    <figure className="stack-view">
      <figcaption>
        <span className="label">Stack</span>
        <span className="stack-view__word">
          <StackWord word={stack.join('')} />
        </span>
        <span className="hint-text">height {stack.length}</span>
      </figcaption>
      <ol className={`stack-col${change ? ` did-${change}` : ''}`} aria-label={`Stack from top to bottom: ${stack.join(', ')}`}>
        {stack.map((sym, i) => (
          <li key={stack.length - i} className={`stack-cell${sym === 'X' ? ' is-x' : ' is-bottom'}${i === 0 ? ' is-top' : ''}`}>
            <StackSymbol symbol={sym} />
            {i === 0 && <span className="stack-cell__tag">top</span>}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** δ as a table; the rule just used and the rule about to fire are marked. */
export function TransitionTable({ used, next }: { used: string | null; next: string | null }) {
  return (
    <div className="table-scroll">
      <table className="ledger delta-table">
        <caption className="visually-hidden">Transition function of the Stack Protocol automaton</caption>
        <thead>
          <tr>
            <th scope="col">Rule</th>
            <th scope="col">
              <span className="math">δ(state, read, pop) = (state, push)</span>
            </th>
            <th scope="col">Purpose</th>
          </tr>
        </thead>
        <tbody>
          {STACK_PROTOCOL.transitions.map((t) => (
            <tr key={t.id} className={`${t.id === used ? 'is-used' : ''}${t.id === next ? ' is-next' : ''}`}>
              <th scope="row" className="mono">
                {t.id}
                {t.id === used && <span className="row-flag">just fired</span>}
                {t.id === next && t.id !== used && <span className="row-flag row-flag--next">next</span>}
              </th>
              <td className="mono">
                <StackWord word={formatTransition(t)} />
              </td>
              <td>{t.purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function describeMove(trace: Trace, snap: Snapshot, prev: Snapshot) {
  const t = snap.via!;
  const read = t.read ? `read “${t.read}”` : 'read nothing (ε-move)';
  return `${read}, popped ${t.pop}, pushed ${t.push.length ? t.push.join('') : 'nothing'}: ${prev.config.stack.join('')} → ${snap.config.stack.join('')}${
    t.read ? ` · head ${prev.config.pos + 1}→${snap.config.pos === trace.input.length ? 'end' : snap.config.pos + 1}` : ''
  }`;
}

/** Every move so far; any entry can be clicked to rewind the machine to that exact configuration. */
export function TransitionLog({ trace, index, onJump, haltNote }: { trace: Trace; index: number; onJump: (k: number) => void; haltNote: string | null }) {
  return (
    <ol className="t-log" aria-label="Transition log">
      {trace.snapshots.slice(0, index + 1).map((snap, k) => (
        <li key={k} className={k === index ? 'is-current' : ''}>
          <button type="button" onClick={() => onJump(k)} aria-current={k === index ? 'step' : undefined} aria-label={`Rewind to step ${k}`}>
            <span className="t-log__no">{String(k).padStart(2, '0')}</span>
            <span className="t-log__body">
              {snap.via ? (
                <>
                  <strong>
                    {snap.via.id} · <StackWord word={formatTransition(snap.via)} />
                  </strong>
                  <span>
                    <StackText text={describeMove(trace, snap, trace.snapshots[k - 1])} />
                  </span>
                </>
              ) : (
                <>
                  <strong>Start in q0</strong>
                  <span>
                    Stack holds only the bottom marker <StackText text="Z₀" />. Head on position 1.
                  </span>
                </>
              )}
            </span>
          </button>
        </li>
      ))}
      {haltNote && <li className="t-log__halt">{haltNote}</li>}
    </ol>
  );
}
