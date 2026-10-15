import { useState } from 'react';
import { useCaseLog } from '../../app/caseLog';
import { Stamp } from '../../components/Evidence';
import { M } from '../../components/M';
import { compress } from '../../logic/languages';
import { type AttackReport, type AuditResult, auditString, type Cuts, enumerateValidCuts, evaluateAttack } from '../../logic/pumping';
import type { WorkbenchState } from './useWorkbench';

const TESTED = [0, 1, 2, 3, 4];

interface Attempt {
  id: number;
  p: number;
  report: AttackReport;
}

function splitText(r: AttackReport) {
  const { u, v, x, y, z } = r.decomposition;
  return [u, v, x, y, z].map((part) => (part ? compress(part) : 'ε')).join(' · ');
}

/**
 * Proof Attack: the user defends the claim by proposing splits.
 * Each attempt is judged against the lemma's real rules, never by pattern matching.
 */
export function AttackMode({ lab }: { lab: WorkbenchState }) {
  const { record } = useCaseLog();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [audit, setAudit] = useState<AuditResult | null>(null);

  const submit = (cuts: Cuts) => {
    const report = evaluateAttack(lab.s, cuts, lab.p, TESTED);
    setAttempts((prev) => [{ id: Date.now() + prev.length, p: lab.p, report }, ...prev].slice(0, 12));
    record((log) => ({
      ...log,
      attacks: log.attacks + 1,
      attacksRefuted: log.attacksRefuted + (report.constraints.valid && !report.survived ? 1 : 0),
      straddleAttacks: log.straddleAttacks + (report.constraints.valid && report.classification.kind === 'straddle' ? 1 : 0),
    }));
  };

  const randomLegal = () => {
    const all = enumerateValidCuts(lab.s, lab.p);
    const pick = all[Math.floor(Math.random() * all.length)];
    lab.setCuts(pick);
    submit(pick);
  };

  const runAudit = () => {
    const result = auditString(lab.s, lab.p, TESTED);
    setAudit(result);
    record((log) => ({ ...log, auditsRun: [...log.auditsRun.filter((a) => a.p !== lab.p || a.n !== lab.n), { p: lab.p, n: lab.n, total: result.total, survivors: result.survivors.length }].sort((a, b) => a.p - b.p) }));
  };

  const latest = attempts[0];
  const refuted = attempts.filter((a) => a.report.constraints.valid && !a.report.survived).length;

  return (
    <div className="attack stack-md">
      <div className="attack__brief">
        <p>
          <strong>You are defending the claim.</strong> If L were context-free, then for s = <M>{`a^${lab.p}b^${lab.p}c^${lab.p}`}</M> some legal split would keep{' '}
          <span className="math">
            uv<sup>i</sup>xy<sup>i</sup>z
          </span>{' '}
          inside L for <em>every</em> i. Set a split in the workbench above and submit it. Each one is tested at i = {TESTED.join(', ')}.
        </p>
        {!lab.nLocked && <p className="note">The workbench is using n = {lab.n} instead of n = p. The defense has to work on the proof’s string, so switch back to aᵖbᵖcᵖ for a fair trial.</p>}
        <div className="chip-row">
          <button type="button" className="btn btn--marker" onClick={() => submit(lab.cuts)}>
            Submit current split
          </button>
          <button type="button" className="btn" onClick={randomLegal}>
            Random legal split
          </button>
          <button type="button" className="btn btn--ink" onClick={runAudit}>
            Audit every split for p = {lab.p}
          </button>
        </div>
      </div>

      {latest && (
        <div className="sheet attack__result" aria-live="polite">
          <span className="sheet__tag">Ruling #{attempts.length}</span>
          <div className="attack__ruling">
            <Stamp tone={!latest.report.constraints.valid ? 'warn' : latest.report.survived ? 'accept' : 'reject'}>
              {!latest.report.constraints.valid ? 'illegal split' : latest.report.survived ? 'survived tests' : 'defense refuted'}
            </Stamp>
            <p className="mono">{splitText(latest.report)}</p>
          </div>
          <ul className="attack__reasons">
            {latest.report.explanation.map((line, k) => (
              <li key={k}>{line}</li>
            ))}
          </ul>
          {latest.report.constraints.valid && (
            <div className="table-scroll">
              <table className="ledger">
                <caption className="visually-hidden">Pumped strings for each tested exponent</caption>
                <thead>
                  <tr>
                    <th scope="col">i</th>
                    <th scope="col">
                      uv<sup>i</sup>xy<sup>i</sup>z
                    </th>
                    <th scope="col">#a #b #c</th>
                    <th scope="col">In L?</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.report.outcomes.map((o) => (
                    <tr key={o.i} className={o.verdict.member ? '' : 'row--bad'}>
                      <td className="mono">{o.i}</td>
                      <td className="mono">{compress(o.result)}</td>
                      <td className="mono">
                        {o.counts.a} {o.counts.b} {o.counts.c}
                      </td>
                      <td>{o.verdict.member ? 'yes' : o.verdict.violation?.kind === 'order' ? 'no: order' : 'no: counts'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {refuted >= 3 && (
        <div className="note note--blue">
          <p>
            <strong>{refuted} legal defenses refuted.</strong> That pattern is evidence, not proof: you could have missed the one that works. What rules it out is the argument
            in steps 5–7. A window of length ≤ p can’t reach both a’s and c’s, so either the order breaks (straddle) or one count is frozen at p while another moves (uniform).
          </p>
        </div>
      )}

      {audit && (
        <div className="sheet sheet--flat audit" aria-live="polite">
          <h3>Exhaustive audit, p = {audit.p}</h3>
          <dl className="audit__grid">
            <div>
              <dt>Legal splits of {compress(audit.s)}</dt>
              <dd>{audit.total}</dd>
            </div>
            <div>
              <dt>Straddle case</dt>
              <dd>{audit.straddle}</dd>
            </div>
            <div>
              <dt>Uniform case</dt>
              <dd>{audit.uniform}</dd>
            </div>
            <div>
              <dt>Refuted by i = 0</dt>
              <dd>{audit.killedByZero}</dd>
            </div>
            <div>
              <dt>Refuted by i = 2</dt>
              <dd>{audit.killedByTwo}</dd>
            </div>
            <div>
              <dt>Survivors</dt>
              <dd className={audit.survivors.length ? 'is-bad' : 'is-good'}>{audit.survivors.length}</dd>
            </div>
            <div>
              <dt>Most symbols in one vxy</dt>
              <dd>{audit.maxWindowSymbols}</dd>
            </div>
          </dl>
          <p className="note">
            This audit checks a single value, p = {audit.p}, by brute force. It is an illustration, not the proof. The lemma’s p could be any number, and no finite search covers
            them all. The general argument in steps 5–7 explains why the results above, especially <strong>at most 2 symbols in any vxy</strong>, hold for every p.
          </p>
          {audit.survivors.length > 0 && (
            <p className="note">
              Survivors exist for this string because it is not aᵖbᵖcᵖ with n ≥ p. That doesn’t affect the proof, which only needs one string with no surviving split.
            </p>
          )}
        </div>
      )}

      {attempts.length > 1 && (
        <details className="attack__history">
          <summary>Earlier rulings ({attempts.length - 1})</summary>
          <ol reversed>
            {attempts.slice(1).map((a) => (
              <li key={a.id} className="mono">
                p={a.p}: {splitText(a.report)}: {!a.report.constraints.valid ? 'illegal' : a.report.survived ? 'survived' : `refuted at i=${a.report.witnesses.join(',')}`}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
