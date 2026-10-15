import { useMemo, useState } from 'react';
import { href } from '../app/router';
import { Stamp } from '../components/Evidence';
import { M } from '../components/M';
import { Reveal } from '../components/Reveal';
import { boundedDFA, firstFailure, runDFA } from '../logic/dfa';
import { findCollision } from '../logic/grammar';
import { checkAnB2n, compress } from '../logic/languages';
import { runStackProtocol } from '../logic/stackProtocol';
import './chamber.css';

const MAX = 40;

function Verdict({ ok }: { ok: boolean }) {
  return <Stamp tone={ok ? 'accept' : 'reject'}>{ok ? 'accept' : 'reject'}</Stamp>;
}

export function Chamber() {
  const [K, setK] = useState(3);
  const [input, setInputRaw] = useState('aabbbb');
  const setInput = (s: string) => setInputRaw(s.slice(0, MAX));

  const dfa = useMemo(() => boundedDFA(K), [K]);
  const dfaRun = runDFA(dfa, input);
  const pdaRun = runStackProtocol(input);
  const truth = checkAnB2n(input);
  const maxHeight = Math.max(...pdaRun.snapshots.map((s) => s.config.stack.length));
  const dfaWrong = dfaRun.accepted !== truth.member;
  const pdaWrong = pdaRun.accepted !== truth.member;

  const collision = useMemo(() => findCollision((k) => runDFA(dfa, 'a'.repeat(k)).finalState, dfa.stateCount), [dfa]);

  return (
    <div className="page chamber">
      <header className="case-head">
        <div>
          <p className="eyebrow">Room 03 · memory models</p>
          <h1 tabIndex={-1}>Comparison Chamber</h1>
          <p className="case-head__claim">What a machine can verify depends on what it can remember.</p>
        </div>
      </header>

      <section className="lab-section" aria-labelledby="models-title">
        <div className="section-title">
          <span className="section-title__code">M</span>
          <h2 id="models-title">Three memory models</h2>
        </div>
        <div className="models">
          <article className="model">
            <h3>Finite automaton</h3>
            <p className="model__mem">Memory: its current state, one of finitely many. Nothing else.</p>
            <div className="memviz memviz--fa" aria-hidden="true">
              {['q0', 'q1', 'q2', '…', 'qk'].map((q) => (
                <span key={q}>{q}</span>
              ))}
            </div>
            <dl>
              <dt>Decides</dt>
              <dd>
                <M>a*b*</M>, “even number of a’s”, any finite language: the <em>regular</em> languages.
              </dd>
              <dt>Cannot decide</dt>
              <dd>
                <M>a^nb^n</M>, <M>{'a^nb^{2n}'}</M>: it would need a distinct state for every possible count.
              </dd>
            </dl>
          </article>
          <article className="model model--pda">
            <h3>Pushdown automaton</h3>
            <p className="model__mem">Memory: finite states plus one unbounded stack, read only at the top.</p>
            <div className="memviz memviz--pda" aria-hidden="true">
              <span>X</span>
              <span>X</span>
              <span>X</span>
              <span className="is-bottom">
                Z<sub>0</sub>
              </span>
            </div>
            <dl>
              <dt>Decides</dt>
              <dd>
                Exactly the <em>context-free</em> languages: <M>a^nb^n</M>, <M>{'a^nb^{2n}'}</M>, balanced brackets, palindromes. Some of these, like even-length
                palindromes, need nondeterminism. Deterministic PDAs are strictly weaker.
              </dd>
              <dt>Cannot decide</dt>
              <dd>
                <M>a^nb^nc^n</M> (proved in{' '}
                <a href={href('pumping')}>Case 01</a>
                ), and <span className="math">{'{ ww }'}</span>.
              </dd>
            </dl>
          </article>
          <article className="model">
            <h3>Two stacks, or a tape</h3>
            <p className="model__mem">Memory: two stacks, which together can simulate a Turing machine’s tape.</p>
            <div className="memviz memviz--two" aria-hidden="true">
              <div>
                <span>X</span>
                <span>X</span>
                <span className="is-bottom">
                  Z<sub>0</sub>
                </span>
              </div>
              <div>
                <span>Y</span>
                <span>Y</span>
                <span className="is-bottom">
                  Z<sub>0</sub>
                </span>
              </div>
            </div>
            <dl>
              <dt>Decides</dt>
              <dd>
                <M>a^nb^nc^n</M> easily. A linear-bounded automaton is already enough, since the language is context-sensitive.
              </dd>
              <dt>Note</dt>
              <dd>Adding a second stack doesn’t just add counting power: it reaches full Turing-machine power.</dd>
            </dl>
          </article>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="duel-title">
        <div className="section-title">
          <span className="section-title__code">D</span>
          <h2 id="duel-title">Duel: finite memory against a stack</h2>
          <p>
            Both machines judge the same tape for <M>{'a^nb^{2n}'}</M>. The DFA is a real automaton with {dfa.stateCount} states, built to be exactly right for every n ≤ {K}.
          </p>
        </div>
        <div className="duel-controls">
          <div className="field">
            <label htmlFor="duel-input">Tape</label>
            <input id="duel-input" className="input" value={input} maxLength={MAX} spellCheck={false} autoComplete="off" onChange={(e) => setInput(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="duel-k">
              DFA capacity K = {K} ({dfa.stateCount} states)
            </label>
            <input id="duel-k" type="range" min={1} max={8} value={K} onChange={(e) => setK(Number(e.target.value))} />
          </div>
          <button type="button" className="btn btn--marker" onClick={() => setInput(firstFailure(K))}>
            Find a string the DFA gets wrong
          </button>
        </div>

        <div className="duel">
          <div className={`duel__side${dfaWrong ? ' is-wrong' : ''}`}>
            <h3>DFA, capacity {K}</h3>
            <Verdict ok={dfaRun.accepted} />
            <p className="mono duel__path" aria-label="States visited">
              {dfaRun.states.join(' → ')}
            </p>
            <p>
              Memory used: <strong>1 state</strong> out of {dfa.stateCount}, whatever the input length.
            </p>
            {dfaWrong && (
              <p className="duel__flag">
                Wrong. {truth.member ? 'This string is in L, ' : 'This string is not in L, '}
                {dfaRun.finalState === 'dead' && input.startsWith('a'.repeat(K + 1)) ? `but after ${K + 1} a’s the DFA has no state left to count with.` : 'but the DFA cannot tell.'}
              </p>
            )}
          </div>
          <div className="duel__side duel__side--truth">
            <h3>Definition</h3>
            <Stamp tone={truth.member ? 'accept' : 'reject'}>{truth.member ? 'in L' : 'not in L'}</Stamp>
            <p>{truth.reason}</p>
          </div>
          <div className={`duel__side${pdaWrong ? ' is-wrong' : ''}`}>
            <h3>PDA: Stack Protocol</h3>
            <Verdict ok={pdaRun.accepted} />
            <p className="mono duel__path">{compress(input)}</p>
            <p>
              Memory used: stack height up to <strong>{maxHeight}</strong>. It grows with the input, so no count is ever out of reach.
            </p>
            <a className="hint-text" href={href('stack')}>
              Step through it in Case 02 →
            </a>
          </div>
        </div>
      </section>

      <section className="lab-section" aria-labelledby="pigeon-title">
        <div className="section-title">
          <span className="section-title__code">P</span>
          <h2 id="pigeon-title">Why every DFA loses, not just this one</h2>
          <p>Raising K only postpones the failure. The argument below works for any DFA at all.</p>
        </div>
        {collision && (
          <p className="collision">
            For the DFA above: after <M>{`a^${collision[0]}`}</M> and after <M>{`a^${collision[1]}`}</M> it is in the same state (
            <span className="mono">{runDFA(dfa, 'a'.repeat(collision[0])).finalState}</span>). So it must give <M>{`a^${collision[0]}b^{${2 * collision[0]}}`}</M> (in L) and{' '}
            <M>{`a^${collision[1]}b^{${2 * collision[0]}}`}</M> (not in L) the same verdict, which means it is wrong about one of them.
          </p>
        )}
        <Reveal hint={<p>A DFA with k states reads a⁰, a¹, …, aᵏ. That is k + 1 prefixes. How many different states can they end in?</p>} revealLabel="Show the pigeonhole argument">
          <ol className="proof-list">
            <li>Suppose some DFA with k states decides L = {'{ aⁿb²ⁿ | n ≥ 1 }'}.</li>
            <li>
              The k + 1 prefixes a<sup>0</sup>, …, a<sup>k</sup> can’t all end in different states, so some a<sup>i</sup> and a<sup>j</sup> with i &lt; j end in the same state.
            </li>
            <li>
              From that state, reading b<sup>2j</sup> leads to one fixed state, so a<sup>i</sup>b<sup>2j</sup> and a<sup>j</sup>b<sup>2j</sup> get the same verdict.
            </li>
            <li>
              But a<sup>j</sup>b<sup>2j</sup> ∈ L (j ≥ 1) and a<sup>i</sup>b<sup>2j</sup> ∉ L (2j ≠ 2i). Contradiction, so no DFA decides L, and L is not regular.
            </li>
          </ol>
          <p className="hint-text">
            The demo above uses suffix b<sup>2i</sup> instead of b<sup>2j</sup>. Either works whenever i ≥ 1.
          </p>
        </Reveal>
      </section>

      <section className="lab-section" aria-labelledby="three-title">
        <div className="section-title">
          <span className="section-title__code">?</span>
          <h2 id="three-title">And one stack against three counts?</h2>
        </div>
        <div className="note note--blue">
          <p>
            Intuition: to check <M>a^nb^nc^n</M> a PDA can match the b’s against the a’s, but that empties the stack, leaving nothing to check the c’s against. That
            intuition is <em>not</em> a proof, because a cleverer PDA might store information some other way. The proof is the pumping-lemma argument in{' '}
            <a href={href('pumping')}>Case 01</a>, which rules out every PDA at once.
          </p>
        </div>
      </section>
    </div>
  );
}
