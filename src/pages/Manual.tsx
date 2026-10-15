import { useState } from 'react';
import { href } from '../app/router';
import { plainTiles, Stamp, StringTiles } from '../components/Evidence';
import { M } from '../components/M';
import { deriveAnB2n } from '../logic/grammar';
import { checkAnB2n, checkAnBnCn, conditionsFor, type LanguageId } from '../logic/languages';
import { runStackProtocol } from '../logic/stackProtocol';
import './manual.css';

const MAX = 40;

function Forge() {
  const [lang, setLang] = useState<LanguageId>('anb2n');
  const [s, setRaw] = useState('aabbb');
  const set = (v: string) => setRaw(v.slice(0, MAX));
  const verdict = lang === 'anbncn' ? checkAnBnCn(s) : checkAnB2n(s);
  const conds = conditionsFor(lang, s);
  const flag = verdict.violation && (verdict.violation.kind === 'alphabet' || verdict.violation.kind === 'order') ? verdict.violation.index : undefined;
  const machine = lang === 'anb2n' ? runStackProtocol(s) : null;
  const symbols = lang === 'anbncn' ? ['a', 'b', 'c'] : ['a', 'b'];

  return (
    <div className="forge sheet">
      <span className="sheet__tag">Counterexample forge</span>
      <fieldset className="forge__lang">
        <legend className="label">Language</legend>
        <label>
          <input type="radio" name="forge-lang" checked={lang === 'anb2n'} onChange={() => setLang('anb2n')} />
          <M>{'{ a^nb^{2n} | n ≥ 1 }'}</M>
        </label>
        <label>
          <input type="radio" name="forge-lang" checked={lang === 'anbncn'} onChange={() => setLang('anbncn')} />
          <M>{'{ a^nb^nc^n | n ≥ 0 }'}</M>
        </label>
      </fieldset>
      <div className="field">
        <label htmlFor="forge-input">Suspect string</label>
        <input id="forge-input" className="input" value={s} maxLength={MAX} spellCheck={false} autoComplete="off" onChange={(e) => set(e.target.value)} />
      </div>
      <div className="chip-row" role="group" aria-label="Mutate the string">
        {symbols.map((ch) => (
          <button key={`p${ch}`} type="button" className="btn btn--small" onClick={() => set(ch + s)} aria-label={`Prepend ${ch}`}>
            {ch}+
          </button>
        ))}
        {symbols.map((ch) => (
          <button key={`a${ch}`} type="button" className="btn btn--small" onClick={() => set(s + ch)} aria-label={`Append ${ch}`}>
            +{ch}
          </button>
        ))}
        <button type="button" className="btn btn--small" onClick={() => set(s.slice(1))} disabled={!s} aria-label="Delete first symbol">
          drop first
        </button>
        <button type="button" className="btn btn--small" onClick={() => set(s.slice(0, -1))} disabled={!s} aria-label="Delete last symbol">
          drop last
        </button>
        <button
          type="button"
          className="btn btn--small"
          disabled={s.length < 2}
          onClick={() => {
            const k = Math.floor(s.length / 2);
            set(s.slice(0, k - 1) + s[k] + s[k - 1] + s.slice(k + 1));
          }}
        >
          swap middle pair
        </button>
      </div>
      <StringTiles label="Suspect string" tiles={plainTiles(s, flag)} />
      <ul className="forge__conds" aria-label="Membership conditions">
        {conds.map((c) => (
          <li key={c.label} className={c.ok === null ? 'is-na' : c.ok ? 'is-ok' : 'is-bad'}>
            <span className="forge__mark" aria-hidden="true">
              {c.ok === null ? '–' : c.ok ? '✓' : '✗'}
            </span>
            <span>
              <strong>{c.label}</strong>
              <span className="visually-hidden">{c.ok === null ? ' not judged' : c.ok ? ' satisfied' : ' violated'}</span> {c.detail}
            </span>
          </li>
        ))}
      </ul>
      <div className="forge__verdict" role="status">
        <Stamp tone={verdict.member ? 'accept' : 'reject'}>{verdict.member ? 'member' : 'not a member'}</Stamp>
        <p>{verdict.reason}</p>
      </div>
      {machine && (
        <p className="hint-text">
          Cross-check: the Stack Protocol PDA {machine.accepted ? 'accepts' : 'rejects'} this tape {machine.accepted === verdict.member ? '(agrees).' : '(DISAGREES).'}{' '}
          <a href={href('stack')}>Watch it run →</a>
        </p>
      )}
    </div>
  );
}

function Derivation() {
  const [n, setN] = useState(3);
  const steps = deriveAnB2n(n);
  return (
    <div className="derivation">
      <div className="field">
        <label htmlFor="deriv-n">Derive with n = {n}</label>
        <input id="deriv-n" type="range" min={1} max={6} value={n} onChange={(e) => setN(Number(e.target.value))} />
      </div>
      <ol className="derivation__steps" aria-label={`Derivation of a${n} b${2 * n}`}>
        {steps.map((st, k) => (
          <li key={k}>
            <span className="mono">
              {k > 0 && '⇒ '}
              {st.form}
            </span>
            {st.rule && <span className="derivation__rule">{st.rule}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Manual() {
  return (
    <div className="page manual">
      <header className="case-head">
        <div>
          <p className="eyebrow">Room 04 · field manual</p>
          <h1 tabIndex={-1}>Field Manual</h1>
          <p className="case-head__claim">Short definitions. Each one links to a working demonstration.</p>
        </div>
      </header>

      <div className="manual__layout">
        <nav className="manual__toc" aria-label="Manual contents">
          <ol>
            <li>
              <a href="#m-lang">Languages &amp; membership</a>
            </li>
            <li>
              <a href="#m-cfl">Context-free languages</a>
            </li>
            <li>
              <a href="#m-lemma">The CF pumping lemma</a>
            </li>
            <li>
              <a href="#m-pda">Pushdown automata</a>
            </li>
            <li>
              <a href="#m-ops">Stack operations</a>
            </li>
            <li>
              <a href="#m-accept">Acceptance &amp; rejection</a>
            </li>
            <li>
              <a href="#m-fa">FA vs PDA</a>
            </li>
            <li>
              <a href="#m-forge">Counterexample forge</a>
            </li>
          </ol>
        </nav>

        <div className="manual__body">
          <article id="m-lang" className="entry">
            <h2>Formal languages &amp; membership</h2>
            <p>
              An <strong>alphabet</strong> Σ is a finite set of symbols. A <strong>string</strong> is a finite sequence of them, and ε is the empty string. A{' '}
              <strong>language</strong> is any set of strings over Σ. <em>Membership</em> asks one yes/no question: is this string in the set?
            </p>
            <p>
              Example: <M>{'{ a^nb^nc^n | n ≥ 0 }'}</M> contains ε, abc, aabbcc, … and nothing else. The string aabbc is out (counts differ), and so is acb (wrong order).
            </p>
            <a className="entry__try" href="#m-forge">
              Try it: forge a counterexample ↓
            </a>
          </article>

          <article id="m-cfl" className="entry">
            <h2>Context-free languages</h2>
            <p>
              A language is <strong>context-free</strong> if a context-free grammar generates it, i.e. rules of the form A → γ that rewrite one variable regardless of its
              surroundings. Equivalently, some (possibly nondeterministic) pushdown automaton accepts it.
            </p>
            <p>
              Grammar for <M>{'a^nb^{2n}'}</M>, n ≥ 1: <span className="math">S → aSbb | abb</span>. Each step wraps one a and two b’s around the middle.
            </p>
            <Derivation />
          </article>

          <article id="m-lemma" className="entry">
            <h2>The context-free pumping lemma</h2>
            <p>
              If L is context-free, there is a p ≥ 1 such that every s ∈ L with |s| ≥ p splits as s = uvxyz with |vxy| ≤ p, |vy| &gt; 0, and{' '}
              <span className="math">
                uv<sup>i</sup>xy<sup>i</sup>z
              </span>{' '}
              ∈ L for all i ≥ 0. (The idea: a long string has a parse tree with a repeated variable on some path, and the part between the repeats can be repeated or cut out.)
            </p>
            <div className="note">
              <p>
                <strong>It only works one way.</strong> The lemma is a <em>necessary</em> condition. Failing it proves a language is not context-free. Passing it proves
                nothing, because some non-context-free languages satisfy it. It is not an algorithm for deciding context-freeness.
              </p>
            </div>
            <p>
              Don’t confuse it with the <em>regular</em> pumping lemma, which splits into three parts xyz and pumps one piece. The context-free version pumps two pieces, v and
              y, at once.
            </p>
            <a className="entry__try" href={href('pumping')}>
              Try it: Case 01, the Pumping Paradox →
            </a>
          </article>

          <article id="m-pda" className="entry">
            <h2>Pushdown automata</h2>
            <p>
              A PDA is a 7-tuple (Q, Σ, Γ, δ, q<sub>0</sub>, Z<sub>0</sub>, F): states, input alphabet, stack alphabet, transition function, start state, bottom-of-stack
              marker and accepting states. It is a finite automaton that also owns a stack it can only touch at the top.
            </p>
            <p>
              A <strong>configuration</strong> is (state, remaining input, stack). Running the machine means moving from configuration to configuration.
            </p>
            <a className="entry__try" href={href('stack')}>
              Try it: Case 02, Stack Protocol →
            </a>
          </article>

          <article id="m-ops" className="entry">
            <h2>Stack operations &amp; transition rules</h2>
            <p>
              A rule <span className="math">δ(q, a, A) = (q′, γ)</span> reads: in state q, reading a (or nothing, if a = ε), with A on top, pop A, push the string γ, and move to
              q′. With the leftmost symbol written as the top:
            </p>
            <table className="ledger ops">
              <caption className="visually-hidden">Stack operations expressed as rules</caption>
              <thead>
                <tr>
                  <th scope="col">Effect</th>
                  <th scope="col">γ</th>
                  <th scope="col">Before → after</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pop</td>
                  <td className="mono">ε</td>
                  <td className="mono">XXZ₀ → XZ₀</td>
                </tr>
                <tr>
                  <td>Leave unchanged</td>
                  <td className="mono">A</td>
                  <td className="mono">XZ₀ → XZ₀</td>
                </tr>
                <tr>
                  <td>Push one</td>
                  <td className="mono">XA</td>
                  <td className="mono">XZ₀ → XXZ₀</td>
                </tr>
                <tr>
                  <td>Push two</td>
                  <td className="mono">XXA</td>
                  <td className="mono">XZ₀ → XXXZ₀</td>
                </tr>
              </tbody>
            </table>
          </article>

          <article id="m-accept" className="entry">
            <h2>Acceptance &amp; rejection</h2>
            <p>
              Two standard conventions: <strong>by final state</strong> (all input read and the machine in a state of F) or <strong>by empty stack</strong> (all input read
              and the stack empty). For nondeterministic PDAs both accept the same class of languages.
            </p>
            <p>
              Stack Protocol accepts by final state: it must end in q3 with the tape consumed. It <strong>rejects</strong> when it gets stuck (no rule matches the state,
              symbol and top) or ends anywhere else. A nondeterministic PDA rejects only if <em>no</em> branch of its computation accepts.
            </p>
          </article>

          <article id="m-fa" className="entry">
            <h2>Finite automaton vs pushdown automaton</h2>
            <p>
              A finite automaton’s only memory is which of its finitely many states it is in, so it can’t count without bound. A PDA adds a stack, which is enough to match one
              quantity against another, like a’s against b’s. Every regular language is context-free, but not the other way round.
            </p>
            <a className="entry__try" href={href('chamber')}>
              Try it: run them head-to-head in the Comparison Chamber →
            </a>
          </article>

          <article id="m-forge" className="entry">
            <h2>Counterexample forge</h2>
            <p>Build or mutate a string and see every membership condition checked separately, with the one that breaks named.</p>
            <Forge />
          </article>
        </div>
      </div>
    </div>
  );
}
