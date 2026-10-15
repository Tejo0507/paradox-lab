import { type ReactNode, useId, useState } from 'react';

/**
 * Guided discovery: an optional nudge first, then the full reasoning.
 * Nothing is forced — "Reveal" is always available without opening the hint.
 */
export function Reveal({
  hint,
  children,
  revealLabel = 'Reveal reasoning',
  onReveal,
  defaultOpen = false,
}: {
  hint?: ReactNode;
  children: ReactNode;
  revealLabel?: string;
  onReveal?: () => void;
  defaultOpen?: boolean;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="reveal">
      <div className="chip-row">
        {hint && !open && (
          <button type="button" className="btn btn--small" aria-expanded={hintOpen} aria-controls={`${id}-hint`} onClick={() => setHintOpen((v) => !v)}>
            {hintOpen ? 'Hide hint' : 'Hint'}
          </button>
        )}
        <button
          type="button"
          className="btn btn--small btn--ink"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => {
            setOpen((v) => !v);
            if (!open) onReveal?.();
          }}
        >
          {open ? 'Hide' : revealLabel}
        </button>
      </div>
      {hint && hintOpen && !open && (
        <div id={`${id}-hint`} className="reveal__hint">
          {hint}
        </div>
      )}
      {open && (
        <div id={`${id}-body`} className="reveal__body">
          {children}
        </div>
      )}
    </div>
  );
}
