import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCaseLog } from '../app/caseLog';
import { href } from '../app/router';
import { Stamp } from '../components/Evidence';
import { M } from '../components/M';
import { AttackMode } from '../features/pumping/AttackMode';
import { EvidenceBench } from '../features/pumping/EvidenceBench';
import { buildProofSteps, ProofBoard } from '../features/pumping/ProofBoard';
import { DECOMPOSITION_PRESETS, presetCuts } from '../features/pumping/presets';
import { useWorkbench } from '../features/pumping/useWorkbench';
import { Workbench } from '../features/pumping/Workbench';
import '../features/pumping/pumping.css';

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'start' });
  el.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
}

export function PumpingLab() {
  const lab = useWorkbench(4);
  const { record } = useCaseLog();
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const loadPreset = useCallback(
    (id: string) => {
      lab.setNLocked(true);
      const preset = DECOMPOSITION_PRESETS.find((p) => p.id === id)!;
      lab.setCuts(presetCuts(preset, lab.p));
      lab.setI(2);
      jumpTo('workbench');
    },
    [lab],
  );

  const steps = useMemo(
    () =>
      buildProofSteps({
        loadProofString: () => {
          lab.setNLocked(true);
          jumpTo('workbench');
        },
        loadStraddle: () => loadPreset('v-straddle'),
        loadUniform: () => loadPreset('ab'),
        goAttack: () => jumpTo('attack'),
      }),
    [lab, loadPreset],
  );

  const onReveal = useCallback((k: number) => {
    setRevealed((prev) => (prev.has(k) ? prev : new Set(prev).add(k)));
  }, []);

  useEffect(() => {
    if (revealed.size === 0) return;
    record((log) => ({ ...log, proofStepsRevealed: Math.max(log.proofStepsRevealed, revealed.size) }));
  }, [revealed.size, record]);

  const complete = revealed.size === steps.length;

  return (
    <div className="page pumping">
      <header className="case-head">
        <div>
          <p className="eyebrow">Case 01 · context-free pumping lemma</p>
          <h1 tabIndex={-1}>The Pumping Paradox</h1>
          <p className="case-head__claim">
            Claim under investigation: <M>{'L = { a^nb^nc^n | n ≥ 0 }'}</M> is context-free.
          </p>
        </div>
        <div className="case-head__verdict">
          {complete ? <Stamp tone="reject">claim refuted</Stamp> : <Stamp tone="pending">{`proof ${revealed.size}/${steps.length}`}</Stamp>}
        </div>
      </header>

      <nav className="jump-row" aria-label="Sections of this case">
        <a href="#exhibit" onClick={(e) => (e.preventDefault(), jumpTo('exhibit'))}>
          A · Evidence
        </a>
        <a href="#proof" onClick={(e) => (e.preventDefault(), jumpTo('proof'))}>
          B · Proof
        </a>
        <a href="#workbench" onClick={(e) => (e.preventDefault(), jumpTo('workbench'))}>
          C · Split & pump
        </a>
        <a href="#attack" onClick={(e) => (e.preventDefault(), jumpTo('attack'))}>
          D · Proof attack
        </a>
        <a href={href('certificate')}>Certificate →</a>
      </nav>

      <section id="exhibit" className="lab-section" aria-labelledby="exhibit-title">
        <div className="section-title">
          <span className="section-title__code">A</span>
          <h2 id="exhibit-title" tabIndex={-1}>
            Exhibit A: the evidence
          </h2>
          <p>A string is in L when it is some a’s, then the same number of b’s, then the same number of c’s. Build one, then break it.</p>
        </div>
        <EvidenceBench />
      </section>

      <div className="desk">
        <section id="proof" className="lab-section" aria-labelledby="proof-title">
          <div className="section-title">
            <span className="section-title__code">B</span>
            <h2 id="proof-title" tabIndex={-1}>
              The proof, step by step
            </h2>
            <p>Each step has an optional hint. Think first, then reveal. Some steps load an example into the workbench.</p>
          </div>
          <ProofBoard steps={steps} onReveal={onReveal} />
        </section>

        <section id="workbench" className="lab-section" aria-labelledby="workbench-title">
          <div className="section-title">
            <span className="section-title__code">C</span>
            <h2 id="workbench-title" tabIndex={-1}>
              Split &amp; pump
            </h2>
            <p>
              Cut s into <span className="math">u·v·x·y·z</span>, check the lemma’s constraints, then pump v and y together.
            </p>
          </div>
          <Workbench lab={lab} />
        </section>
      </div>

      <section id="attack" className="lab-section" aria-labelledby="attack-title">
        <div className="section-title">
          <span className="section-title__code">D</span>
          <h2 id="attack-title" tabIndex={-1}>
            Proof attack: defend the claim
          </h2>
          <p>If any legal split survived every exponent, the proof would collapse. Try to find one.</p>
        </div>
        <AttackMode lab={lab} />
      </section>

      <footer className="case-foot">
        <p>
          When the reasoning holds up, file it. The certificate states the theorem and the complete case analysis in a printable form.
        </p>
        <a className="btn btn--ink" href={href('certificate')}>
          Issue proof certificate
        </a>
      </footer>
    </div>
  );
}
