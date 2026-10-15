import { useMemo, useState } from 'react';
import { href } from '../app/router';
import { CountBars, Stamp, StringTiles } from '../components/Evidence';
import { M, StackSymbol } from '../components/M';
import { checkAnBnCn, compress } from '../logic/languages';
import { decompose, pumpTagged } from '../logic/pumping';
import { formatTransition } from '../logic/pda';
import { runStackProtocol } from '../logic/stackProtocol';
import './briefing.css';

const BENCH = decompose('aaabbbccc', [2, 3, 3, 4]); // v = a (last a), x = ε, y = b (first b)

function PumpBench() {
  const [i, setI] = useState(2);
  const tagged = pumpTagged(BENCH, i);
  const result = tagged.map((t) => t.ch).join('');
  const verdict = checkAnBnCn(result);
  return (
    <section className="sheet bench" aria-labelledby="bench-title">
      <span className="sheet__tag">Bench test · live</span>
      <h2 id="bench-title" className="bench__title">
        Pump <span className="seg-label seg-v">v</span> and <span className="seg-label seg-y">y</span>
      </h2>
      <p className="bench__desc">
        Evidence <M>a^3b^3c^3</M>, split as <span className="math">u·v·x·y·z</span> = <span className="math">aa · a · ε · b · bccc</span>. Choose how many copies
        of <em>v</em> and <em>y</em> to keep.
      </p>
      <div className="chip-row" role="group" aria-label="Pumping exponent i">
        {[0, 1, 2, 3].map((k) => (
          <button key={k} type="button" className="btn btn--small" aria-pressed={i === k} onClick={() => setI(k)}>
            i = {k}
          </button>
        ))}
      </div>
      <StringTiles label={`uv^${i}xy^${i}z`} tiles={tagged.map((t) => ({ ch: t.ch, segment: t.segment, extra: t.copy > 0 }))} showSegments />
      <div className="bench__readout">
        <CountBars counts={verdict.counts} />
        <div className="bench__verdict">
          <Stamp tone={verdict.member ? 'accept' : 'reject'} live>
            {verdict.member ? 'in L' : 'not in L'}
          </Stamp>
          <p className="hint-text">
            <span className="math">{compress(result)}</span> — {verdict.member ? 'counts still balance.' : 'c never moves, so the counts drift apart.'}
          </p>
        </div>
      </div>
    </section>
  );
}

function StackPreview() {
  const trace = useMemo(() => runStackProtocol('aabbbb'), []);
  const [k, setK] = useState(0);
  const snap = trace.snapshots[k];
  const done = k === trace.snapshots.length - 1;
  return (
    <div className="stack-preview" aria-label="Stack Protocol preview">
      <div className="stack-preview__tape" role="img" aria-label={`Input aabbbb, ${snap.config.pos} symbols read`}>
        {[...trace.input].map((ch, idx) => (
          <span key={idx} className={`mini-cell${idx < snap.config.pos ? ' is-read' : ''}${idx === snap.config.pos ? ' is-head' : ''}`}>
            {ch}
          </span>
        ))}
      </div>
      <div className="stack-preview__body">
        <ol className="mini-stack" aria-label={`Stack, top first: ${snap.config.stack.join(' ')}`}>
          {snap.config.stack.map((sym, idx) => (
            <li key={snap.config.stack.length - idx} className={sym === 'X' ? 'is-x' : 'is-bottom'}>
              <StackSymbol symbol={sym} />
            </li>
          ))}
        </ol>
        <div className="stack-preview__log" aria-live="polite">
          <p className="label">State {snap.config.state}</p>
          <p className="mono stack-preview__rule">{snap.via ? formatTransition(snap.via) : 'Start: stack holds only the bottom marker.'}</p>
          {done && <Stamp tone="accept">accepted</Stamp>}
        </div>
      </div>
      <div className="chip-row">
        <button type="button" className="btn btn--small btn--ink" onClick={() => setK((v) => Math.min(v + 1, trace.snapshots.length - 1))} disabled={done}>
          Step
        </button>
        <button type="button" className="btn btn--small" onClick={() => setK(0)} disabled={k === 0}>
          Reset
        </button>
      </div>
    </div>
  );
}

export function Briefing() {
  return (
    <div className="page briefing">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__file">
          <p className="eyebrow">Case file · formal languages division</p>
          <h1 id="hero-title" tabIndex={-1} className="hero__title">
            <span>Paradox</span>
            <span>Lab</span>
          </h1>
          <p className="hero__sub">The Language Crime Scene</p>
          <p className="lead">
            Two claims have been filed. One says a language with three perfectly matched counts is context-free. The other says a single stack can check that every{' '}
            <M>a</M> is paid for with exactly two <M>b</M>’s. Strings are the evidence. Machines do the questioning. You decide what holds up.
          </p>
          <div className="chip-row">
            <a className="btn btn--marker" href={href('pumping')}>
              Investigate case 01
            </a>
            <a className="btn btn--ink" href={href('stack')}>
              Run case 02
            </a>
          </div>
        </div>
        <PumpBench />
      </section>

      <section className="dossiers" aria-labelledby="dossiers-title">
        <h2 id="dossiers-title" className="visually-hidden">
          Open cases
        </h2>
        <article className="dossier dossier--01">
          <header className="dossier__head">
            <span className="dossier__no">01</span>
            <div>
              <p className="eyebrow">Suspect claim</p>
              <h3>The Pumping Paradox</h3>
            </div>
          </header>
          <p className="dossier__claim">
            “<M>{'L = { a^nb^nc^n | n ≥ 0 }'}</M> is context-free.”
          </p>
          <ul className="dossier__list">
            <li>Build and break evidence strings, symbol by symbol.</li>
            <li>Cut a string into u·v·x·y·z yourself and pump it.</li>
            <li>Try to defend the claim in Proof Attack mode. Every attempt is checked against the lemma’s actual rules.</li>
          </ul>
          <div className="dossier__foot">
            <Stamp tone="pending">verdict pending</Stamp>
            <a className="btn btn--marker" href={href('pumping')}>
              Open file
            </a>
          </div>
        </article>

        <article className="dossier dossier--02">
          <header className="dossier__head">
            <span className="dossier__no">02</span>
            <div>
              <p className="eyebrow">Machine under test</p>
              <h3>Stack Protocol</h3>
            </div>
          </header>
          <p className="dossier__claim">
            “One stack decides <M>{'L = { a^nb^{2n} | n ≥ 1 }'}</M>.”
          </p>
          <StackPreview />
          <div className="dossier__foot">
            <span className="hint-text">Full simulator: editable tape, rewind, transition log.</span>
            <a className="btn btn--ink" href={href('stack')}>
              Enter the lab
            </a>
          </div>
        </article>
      </section>

      <section className="roles" aria-labelledby="roles-title">
        <h2 id="roles-title">How this lab works</h2>
        <dl className="roles__list">
          <div>
            <dt>Evidence</dt>
            <dd>Strings. Every one can be edited, cut, pumped or fed to a machine.</dd>
          </div>
          <div>
            <dt>Clues</dt>
            <dd>Properties: symbol counts, order, the constraints |vxy| ≤ p and |vy| &gt; 0.</dd>
          </div>
          <div>
            <dt>Investigators</dt>
            <dd>Machines: a pushdown automaton with a visible stack, and finite automata that run out of memory.</dd>
          </div>
        </dl>
        <ul className="rooms">
          <li>
            <a href={href('chamber')}>
              <span className="rooms__code">03</span> Comparison Chamber <span className="rooms__desc">finite memory against a stack, run side by side</span>
            </a>
          </li>
          <li>
            <a href={href('manual')}>
              <span className="rooms__code">04</span> Field Manual <span className="rooms__desc">short definitions, plus the counterexample forge</span>
            </a>
          </li>
          <li>
            <a href={href('certificate')}>
              <span className="rooms__code">05</span> Certificate <span className="rooms__desc">the full formal proof, ready to print</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
