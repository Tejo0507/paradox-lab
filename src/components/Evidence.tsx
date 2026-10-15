import type { ReactNode } from 'react';
import type { Counts } from '../logic/languages';
import type { Segment } from '../logic/pumping';
import './evidence.css';

export interface Tile {
  ch: string;
  segment?: Segment;
  /** Marks a pumped copy beyond the original (i ≥ 2). */
  extra?: boolean;
  /** Emphasises a tile (e.g. a violation position). */
  flagged?: boolean;
}

interface StringTilesProps {
  tiles: Tile[];
  label: string;
  /** Show segment letters under each tile. */
  showSegments?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyText?: string;
}

/** A string rendered as a row of evidence tiles. */
export function StringTiles({ tiles, label, showSegments = false, size = 'md', emptyText = 'ε (empty string)' }: StringTilesProps) {
  if (tiles.length === 0) {
    return (
      <div className={`tiles tiles--${size} tiles--empty`} role="img" aria-label={`${label}: empty string`}>
        <span className="tiles__empty">{emptyText}</span>
      </div>
    );
  }
  const text = tiles.map((t) => t.ch).join('');
  return (
    <div className={`tiles tiles--${size}`} role="img" aria-label={`${label}: ${text} (${tiles.length} symbols)`}>
      {tiles.map((t, i) => (
        <span
          key={i}
          className={`tile tile--${t.ch.match(/^[abc]$/) ? t.ch : 'other'}${t.segment ? ` seg-${t.segment}` : ''}${t.extra ? ' tile--extra' : ''}${
            t.flagged ? ' tile--flagged' : ''
          }`}
        >
          <span className="tile__ch">{t.ch === ' ' ? '␣' : t.ch}</span>
          {showSegments && t.segment && <span className="tile__seg">{t.segment}</span>}
        </span>
      ))}
    </div>
  );
}

export function plainTiles(s: string, flagIndex?: number): Tile[] {
  return [...s].map((ch, i) => ({ ch, flagged: i === flagIndex }));
}

/** Horizontal tally bars for a / b / c (or a / b) counts. */
export function CountBars({ counts, symbols = ['a', 'b', 'c'], target }: { counts: Counts; symbols?: ('a' | 'b' | 'c')[]; target?: Partial<Counts> }) {
  const max = Math.max(1, ...symbols.map((s) => counts[s]), ...symbols.map((s) => target?.[s] ?? 0));
  return (
    <dl className="counts">
      {symbols.map((s) => (
        <div key={s} className="counts__row">
          <dt className={`counts__sym tile--${s}`}>#{s}</dt>
          <dd className="counts__bar-wrap">
            <span className={`counts__bar counts__bar--${s}`} style={{ width: `${(counts[s] / max) * 100}%` }} />
            {target?.[s] !== undefined && (
              <span className="counts__target" style={{ left: `${((target[s] as number) / max) * 100}%` }} title={`required: ${target[s]}`} />
            )}
            <span className="counts__num">{counts[s]}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

type StampTone = 'accept' | 'reject' | 'pending' | 'warn';

/** Rubber-stamp verdict. Always carries text, never colour alone. */
export function Stamp({ tone, children, live = false }: { tone: StampTone; children: ReactNode; live?: boolean }) {
  return (
    <span className={`stamp stamp--${tone}`} role={live ? 'status' : undefined}>
      {children}
    </span>
  );
}
