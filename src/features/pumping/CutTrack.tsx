import { type KeyboardEvent, type PointerEvent, useRef } from 'react';
import { type Cuts, decompose, moveCut, SEGMENTS } from '../../logic/pumping';

const HANDLE_NAMES = ['u | v', 'v | x', 'x | y', 'y | z'];

/**
 * The string with four draggable cut handles. Each handle is an ARIA slider:
 * arrow keys move it one gap, Home/End jump to its limits; dragging snaps to gaps.
 */
export function CutTrack({ s, cuts, onChange }: { s: string; cuts: Cuts; onChange: (next: Cuts) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<0 | 1 | 2 | 3 | null>(null);
  const d = decompose(s, cuts);
  const parts = [d.u, d.v, d.x, d.y, d.z];
  const n = s.length;

  const segmentOf = (idx: number) => {
    const [c1, c2, c3, c4] = cuts;
    if (idx < c1) return 'u';
    if (idx < c2) return 'v';
    if (idx < c3) return 'x';
    if (idx < c4) return 'y';
    return 'z';
  };

  const gapFromPointer = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return Math.round(((clientX - rect.left) / rect.width) * n);
  };

  const onPointerDown = (index: 0 | 1 | 2 | 3) => (e: PointerEvent<HTMLButtonElement>) => {
    dragging.current = index;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (dragging.current === null || !trackRef.current) return;
    const gap = gapFromPointer(e.clientX);
    const next = moveCut(s, cuts, dragging.current, gap);
    if (next.some((c, k) => c !== cuts[k])) onChange(next);
  };
  const onPointerUp = () => {
    dragging.current = null;
  };

  const onKeyDown = (index: 0 | 1 | 2 | 3) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const pos = cuts[index];
    let to: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') to = pos - 1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') to = pos + 1;
    if (e.key === 'Home') to = 0;
    if (e.key === 'End') to = n;
    if (to === null) return;
    e.preventDefault();
    onChange(moveCut(s, cuts, index, to));
  };

  return (
    <div className="cut-track-scroll">
      <div className="cut-track" style={{ ['--n' as string]: Math.max(n, 1) }}>
        <div className="cut-track__tiles" ref={trackRef} aria-hidden="true">
          {[...s].map((ch, idx) => (
            <span key={idx} className={`tile tile--${ch} seg-${segmentOf(idx)}`}>
              <span className="tile__ch">{ch}</span>
              <span className="tile__seg">{segmentOf(idx)}</span>
            </span>
          ))}
        </div>
        <div className="cut-track__rail">
          {cuts.map((c, k) => {
            const index = k as 0 | 1 | 2 | 3;
            const left = index === 0 ? 0 : cuts[index - 1];
            const right = index === 3 ? n : cuts[index + 1];
            return (
              <button
                key={k}
                type="button"
                role="slider"
                className={`cut-handle cut-handle--${k}`}
                style={{ left: `${(c / Math.max(n, 1)) * 100}%` }}
                aria-label={`Cut ${k + 1}, between ${HANDLE_NAMES[k]}`}
                aria-valuemin={left}
                aria-valuemax={right}
                aria-valuenow={c}
                aria-valuetext={`after symbol ${c} of ${n}: ${SEGMENTS[k]} = ${parts[k] || 'ε'}, ${SEGMENTS[k + 1]} = ${parts[k + 1] || 'ε'}`}
                onKeyDown={onKeyDown(index)}
                onPointerDown={onPointerDown(index)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <span className="cut-handle__label">{HANDLE_NAMES[k]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
