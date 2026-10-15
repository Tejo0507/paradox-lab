import { useState } from 'react';
import { CountBars, plainTiles, Stamp, StringTiles } from '../../components/Evidence';
import { M } from '../../components/M';
import { checkAnBnCn, compress, makeAnBnCn } from '../../logic/languages';

const PRESETS = ['abc', 'aabbcc', 'aaabbbccc', 'aaaabbbbcccc'];
export const MAX_FORGE_LENGTH = 36;

/** Exhibit A: inspect members of L and forge non-members. */
export function EvidenceBench() {
  const [s, setS] = useState('aabbcc');
  const verdict = checkAnBnCn(s);
  const v = verdict.violation;
  const flag = v && (v.kind === 'alphabet' || v.kind === 'order') ? v.index : undefined;
  const n = verdict.member ? verdict.counts.a : null;

  const set = (next: string) => setS(next.slice(0, MAX_FORGE_LENGTH));

  return (
    <div className="bench-grid">
      <div className="stack-md">
        <div className="field">
          <span className="label" id="exhibit-presets">
            Members on file
          </span>
          <div className="chip-row" role="group" aria-labelledby="exhibit-presets">
            {PRESETS.map((p) => (
              <button key={p} type="button" className="btn btn--small" aria-pressed={s === p} onClick={() => set(p)}>
                {compress(p)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="exhibit-n">
            Build <M>a^nb^nc^n</M> with n = {n ?? '–'}
          </label>
          <input id="exhibit-n" type="range" min={0} max={8} value={n ?? 0} onChange={(e) => set(makeAnBnCn(Number(e.target.value)))} aria-valuetext={`n = ${n ?? 0}`} />
        </div>
        <div className="field">
          <label htmlFor="exhibit-input">Forge your own string (any symbols, max {MAX_FORGE_LENGTH})</label>
          <input
            id="exhibit-input"
            className="input"
            value={s}
            spellCheck={false}
            autoComplete="off"
            maxLength={MAX_FORGE_LENGTH}
            onChange={(e) => set(e.target.value)}
            aria-describedby="exhibit-verdict"
          />
          <div className="chip-row" role="group" aria-label="Edit the string">
            {['a', 'b', 'c'].map((ch) => (
              <button key={ch} type="button" className="btn btn--small" onClick={() => set(s + ch)} aria-label={`Append ${ch}`}>
                +{ch}
              </button>
            ))}
            <button type="button" className="btn btn--small" onClick={() => set(s.slice(0, -1))} disabled={!s} aria-label="Delete last symbol">
              ⌫ last
            </button>
            <button type="button" className="btn btn--small" onClick={() => set([...s].reverse().join(''))} disabled={s.length < 2}>
              Reverse
            </button>
            <button type="button" className="btn btn--small" onClick={() => set('')} disabled={!s}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="sheet sheet--flat stack-md" aria-labelledby="exhibit-verdict-title">
        <h3 id="exhibit-verdict-title" className="visually-hidden">
          Exhibit analysis
        </h3>
        <StringTiles label="Exhibit string" tiles={plainTiles(s, flag)} />
        <CountBars counts={verdict.counts} />
        <div className="verdict-line" id="exhibit-verdict">
          <Stamp tone={verdict.member ? 'accept' : 'reject'} live>
            {verdict.member ? 'member of L' : 'not in L'}
          </Stamp>
          <p>{verdict.reason}</p>
        </div>
        {verdict.member && n !== null && n > 0 && (
          <p className="hint-text">
            Length {3 * n}. In the proof, the opponent picks a pumping length p and we answer with exactly this shape at n = p, because then each block is at least p long.
          </p>
        )}
      </div>
    </div>
  );
}
