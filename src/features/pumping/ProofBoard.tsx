import { type ReactNode, useState } from 'react';
import { M } from '../../components/M';
import { Reveal } from '../../components/Reveal';

export interface ProofStep {
  title: string;
  hint: ReactNode;
  body: ReactNode;
  action?: { label: string; run: () => void };
}

export function buildProofSteps(actions: { loadProofString: () => void; loadStraddle: () => void; loadUniform: () => void; goAttack: () => void }): ProofStep[] {
  return [
    {
      title: 'Assume the claim, aiming for a contradiction',
      hint: 'To show a language is NOT context-free, what could we assume and then try to break?',
      body: (
        <p>
          Suppose <M>{'L = { a^nb^nc^n | n ≥ 0 }'}</M> is context-free. Everything that follows is a consequence of this assumption. If a consequence turns out to be false, the
          assumption was false.
        </p>
      ),
    },
    {
      title: 'The lemma hands us a pumping length p',
      hint: 'The lemma starts with “there exists p ≥ 1…”. Who picks p, us or the lemma?',
      body: (
        <>
          <p>
            <strong>Context-free pumping lemma.</strong> If L is context-free, there is an integer p ≥ 1 such that every s ∈ L with |s| ≥ p can be written as{' '}
            <span className="math">s = uvxyz</span> where
          </p>
          <ol className="conditions">
            <li>
              <span className="math">|vxy| ≤ p</span>
            </li>
            <li>
              <span className="math">|vy| &gt; 0</span>
            </li>
            <li>
              <span className="math">
                uv<sup>i</sup>xy<sup>i</sup>z ∈ L
              </span>{' '}
              for every i ≥ 0
            </li>
          </ol>
          <p>We don’t get to choose p. It is some fixed number we know nothing about, so the argument has to work for every p.</p>
        </>
      ),
    },
    {
      title: 'Choose the evidence: s = aᵖbᵖcᵖ',
      hint: 'We need a member of L with length at least p, and we want each block too long for a short window to cover.',
      body: (
        <p>
          Take <M>s = a^pb^pc^p</M>. It belongs to L (n = p) and |s| = 3p ≥ p, so the lemma must apply to it. Each block is p symbols long, which is what the next steps rely on.
        </p>
      ),
      action: { label: 'Load s = aᵖbᵖcᵖ into the workbench', run: actions.loadProofString },
    },
    {
      title: 'Face every decomposition, not one',
      hint: 'The lemma promises that SOME split works. Which split will it be? Can we pick it?',
      body: (
        <p>
          The lemma guarantees that some split <span className="math">s = uvxyz</span> satisfying (1)–(3) exists, but it doesn’t say which one. So we must show that{' '}
          <em>every</em> split satisfying (1) and (2) fails (3). Checking one convenient split proves nothing.
        </p>
      ),
      action: { label: 'Try to find a surviving split yourself', run: actions.goAttack },
    },
    {
      title: 'Use the constraints on v and y',
      hint: 'In aᵖbᵖcᵖ, how far is the last a from the first c? Compare that distance with p.',
      body: (
        <>
          <p>
            The last a is at position p and the first c is at position 2p + 1. Any substring containing both has length at least (2p + 1) − p + 1 = p + 2 &gt; p. Since{' '}
            <span className="math">|vxy| ≤ p</span>, <strong>vxy contains no a or no c</strong>, so pumping never changes at least one of #a, #c.
          </p>
          <p>
            Since <span className="math">|vy| &gt; 0</span>, pumping does change the length. Note that v or y may still cross the a|b or b|c boundary. We do not assume each
            part lies inside one block.
          </p>
        </>
      ),
    },
    {
      title: 'Pump: compare uv⁰xy⁰z and uv²xy²z',
      hint: 'Split into two cases: does v or y contain two different symbols, or does each contain only one?',
      body: (
        <>
          <p>
            <strong>Case A, a straddle.</strong> v or y contains two different symbols, e.g. v = a<sup>j</sup>b<sup>k</sup> with j, k ≥ 1. Then{' '}
            <span className="math">
              uv<sup>2</sup>xy<sup>2</sup>z
            </span>{' '}
            contains …a<sup>j</sup>b<sup>k</sup>a<sup>j</sup>b<sup>k</sup>…, so a b comes before an a (or a c before a b). It does not even have the shape a*b*c*.
          </p>
          <p>
            <strong>Case B, uniform.</strong> v and y each consist of a single repeated symbol (or are empty). By step 5, at least one symbol σ ∈ {'{'}a, c{'}'} occurs in
            neither v nor y, so #σ = p in every pumped string. But |vy| &gt; 0, so in{' '}
            <span className="math">
              uv<sup>2</sup>xy<sup>2</sup>z
            </span>{' '}
            some other symbol occurs more than p times.
          </p>
          <p className="hint-text">
            Alternative: i = 0 handles both cases at once. Deleting v and y keeps the shape a*b*c*, leaves #σ = p, and lowers some other count below p.
          </p>
        </>
      ),
      action: { label: 'Show a straddling split', run: actions.loadStraddle },
    },
    {
      title: 'The pumped string cannot stay in L',
      hint: 'Which of the two membership conditions (order, equal counts) fails in each case?',
      body: (
        <p>
          In Case A, <span className="math">uv²xy²z</span> fails the order condition. In Case B, it fails the equal-counts condition. Either way{' '}
          <span className="math">uv²xy²z ∉ L</span>, which contradicts condition (3) for i = 2. Because the two cases cover every split allowed by (1) and (2), no split
          satisfies (3).
        </p>
      ),
      action: { label: 'Show a uniform split', run: actions.loadUniform },
    },
    {
      title: 'Contradiction. L is not context-free',
      hint: 'Which assumption produced the impossible conclusion?',
      body: (
        <p>
          The lemma promised a split of s satisfying (1)–(3), and we showed none exists, for an arbitrary p. So the assumption in step 1 is false:{' '}
          <strong>
            <M>{'{ a^nb^nc^n | n ≥ 0 }'}</M> is not context-free.
          </strong>{' '}
          ∎
        </p>
      ),
    },
  ];
}

export function ProofBoard({ steps, onReveal }: { steps: ProofStep[]; onReveal: (index: number) => void }) {
  const [expandAll, setExpandAll] = useState(false);
  return (
    <div className="proof-board">
      <div className="chip-row proof-board__tools">
        <button type="button" className="btn btn--small" aria-pressed={expandAll} onClick={() => {
          setExpandAll((v) => !v);
          if (!expandAll) steps.forEach((_, k) => onReveal(k));
        }}>
          {expandAll ? 'Collapse all steps' : 'I know this, show every step'}
        </button>
      </div>
      <ol className="proof-steps">
        {steps.map((step, k) => (
          <li key={k} className="proof-step">
            <span className="proof-step__no" aria-hidden="true">
              {String(k + 1).padStart(2, '0')}
            </span>
            <div className="proof-step__body">
              <h3>{step.title}</h3>
              <Reveal key={`${k}-${expandAll}`} hint={<p>{step.hint}</p>} defaultOpen={expandAll} onReveal={() => onReveal(k)}>
                {step.body}
                {step.action && (
                  <button type="button" className="btn btn--small btn--marker" onClick={step.action.run}>
                    {step.action.label}
                  </button>
                )}
              </Reveal>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
