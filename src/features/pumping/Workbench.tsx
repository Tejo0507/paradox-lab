import { CountBars, Stamp, StringTiles } from '../../components/Evidence';
import { M } from '../../components/M';
import { compress } from '../../logic/languages';
import { checkConstraints, classify, decompose, pumpTagged, SEGMENTS } from '../../logic/pumping';
import { checkAnBnCn } from '../../logic/languages';
import { CutTrack } from './CutTrack';
import { DECOMPOSITION_PRESETS, presetCuts } from './presets';
import { MAX_P, type WorkbenchState } from './useWorkbench';

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`check ${ok ? 'check--ok' : 'check--bad'}`}>
      <span className="check__mark" aria-hidden="true">
        {ok ? '✓' : '✗'}
      </span>
      <span className="visually-hidden">{ok ? 'satisfied: ' : 'violated: '}</span>
      {children}
    </li>
  );
}

export function Workbench({ lab }: { lab: WorkbenchState }) {
  const { p, n, s, cuts, i } = lab;
  const d = decompose(s, cuts);
  const cons = checkConstraints(d, p);
  const cls = classify(d);
  const tagged = pumpTagged(d, i);
  const result = tagged.map((t) => t.ch).join('');
  const verdict = checkAnBnCn(result);
  const parts = [d.u, d.v, d.x, d.y, d.z];
  const starts = [0, ...cuts];

  let demonstrates: string;
  if (!cons.valid) {
    demonstrates = `Not a legal move. The lemma only promises a split with ${!cons.vyNonEmpty ? '|vy| > 0' : `|vxy| ≤ p`}, so nobody defending the claim may pick this one.`;
  } else if (i === 1) {
    demonstrates = 'i = 1 always rebuilds s itself. Pick i = 0 (delete v and y) or i ≥ 2 (repeat them).';
  } else if (!verdict.member) {
    demonstrates = `This split breaks at i = ${i}. That refutes this split only. The proof has to refute every legal split, and that is what Proof Attack checks.`;
  } else {
    demonstrates = `Still in L at i = ${i}. Try another exponent. A split survives only if every i ≥ 0 stays in L.`;
  }

  return (
    <div className="workbench stack-md">
      <div className="workbench__controls">
        <div className="field">
          <label htmlFor="wb-p">
            Pumping length p = <strong>{p}</strong>
          </label>
          <input id="wb-p" type="range" min={1} max={MAX_P} value={p} onChange={(e) => lab.setP(Number(e.target.value))} />
          <span className="hint-text">Chosen by the lemma, not by us. Try several.</span>
        </div>
        <div className="field">
          <span className="label">Evidence string</span>
          <label className="toggle">
            <input type="checkbox" checked={lab.nLocked} onChange={(e) => lab.setNLocked(e.target.checked)} />
            <span>
              Use the proof’s string <M>s = a^pb^pc^p</M>
            </span>
          </label>
          {!lab.nLocked && (
            <>
              <label htmlFor="wb-n" className="visually-hidden">
                n
              </label>
              <input id="wb-n" type="range" min={1} max={MAX_P} value={n} onChange={(e) => lab.setN(Number(e.target.value))} aria-valuetext={`n = ${n}`} />
              <span className="hint-text">
                s = <M>{`a^${n}b^${n}c^${n}`}</M>. {n < p ? 'With n < p one window can reach all three blocks, which is why the proof uses n = p.' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="field">
        <span className="label" id="wb-presets">
          Load a suspect split
        </span>
        <div className="chip-row" role="group" aria-labelledby="wb-presets">
          {DECOMPOSITION_PRESETS.map((pr) => (
            <button key={pr.id} type="button" className="btn btn--small" onClick={() => lab.setCuts(presetCuts(pr, n))}>
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet sheet--flat">
        <p className="label">
          s = <span className="math">{compress(s)}</span>. Drag the four cut handles, or focus one and use the arrow keys.
        </p>
        <CutTrack s={s} cuts={cuts} onChange={lab.setCuts} />
        <div className="table-scroll">
          <table className="ledger seg-table">
            <caption className="visually-hidden">The five parts of the current split</caption>
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Content</th>
                <th scope="col">Positions</th>
                <th scope="col">Length</th>
                <th scope="col">Pumped?</th>
              </tr>
            </thead>
            <tbody>
              {SEGMENTS.map((seg, k) => (
                <tr key={seg}>
                  <th scope="row">
                    <span className={`seg-label seg-${seg}`}>{seg}</span>
                  </th>
                  <td className="mono">{parts[k] ? compress(parts[k]) : 'ε'}</td>
                  <td className="mono">{parts[k] ? `${starts[k] + 1}–${starts[k] + parts[k].length}` : '—'}</td>
                  <td className="mono">{parts[k].length}</td>
                  <td>{seg === 'v' || seg === 'y' ? `yes, ×${i}` : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="checks" aria-label="Pumping lemma constraints">
          <Check ok={cons.vxyWithinP}>
            |vxy| = {cons.vxyLength} {cons.vxyWithinP ? '≤' : '>'} p = {p}
          </Check>
          <Check ok={cons.vyNonEmpty}>|vy| = {cons.vyLength} {cons.vyNonEmpty ? '> 0' : '= 0'}</Check>
          <Check ok={cons.longEnough}>
            |s| = {s.length} ≥ p (the lemma applies to s)
          </Check>
        </ul>
        <p className="case-label">
          <span className="label">Case</span>{' '}
          {cls.kind === 'straddle' ? (
            <>
              <strong>Straddle.</strong> {cls.vSymbols.length > 1 ? 'v' : 'y'} crosses a block boundary, so repeating it puts symbols out of order.
            </>
          ) : cls.pumpedSymbols.length === 0 ? (
            <>
              <strong>Nothing pumped.</strong> v and y are empty.
            </>
          ) : (
            <>
              <strong>Uniform.</strong> v and y only hold {cls.pumpedSymbols.join(' and ')}.{' '}
              {cls.untouched.length > 0 ? `${cls.untouched.join(' and ')} can never change.` : 'Every symbol is touched, which is only possible when the window is longer than a block.'}
            </>
          )}
        </p>
      </div>

      <div className="sheet pump-result" aria-labelledby="pump-title">
        <span className="sheet__tag">Pump chamber</span>
        <div className="pump-result__head">
          <h3 id="pump-title">
            u v<sup>{i}</sup> x y<sup>{i}</sup> z
          </h3>
          <div className="chip-row" role="group" aria-label="Pumping exponent i">
            {[0, 1, 2, 3, 4].map((k) => (
              <button key={k} type="button" className="btn btn--small" aria-pressed={i === k} onClick={() => lab.setI(k)}>
                i={k}
              </button>
            ))}
          </div>
        </div>
        <StringTiles label="Pumped string" tiles={tagged.map((t) => ({ ch: t.ch, segment: t.segment, extra: t.copy > 0 }))} showSegments size="sm" />
        <p className="mono pump-result__word">
          = {compress(result)} <span className="hint-text">(length {result.length})</span>
        </p>
        <div className="pump-result__grid">
          <CountBars counts={verdict.counts} />
          <div className="verdict-line">
            <Stamp tone={verdict.member ? 'accept' : 'reject'} live>
              {verdict.member ? 'in L' : 'not in L'}
            </Stamp>
            <p>{verdict.reason}</p>
          </div>
        </div>
        <p className="demonstrates">
          <span className="label">What this shows</span> {demonstrates}
        </p>
      </div>
    </div>
  );
}
