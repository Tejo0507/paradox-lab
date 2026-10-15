import { useCallback, useMemo, useState } from 'react';
import { makeAnBnCn } from '../../logic/languages';
import { type Cuts, defaultCuts, isWellFormedCuts } from '../../logic/pumping';

export const MAX_P = 8;

export interface WorkbenchState {
  p: number;
  n: number;
  /** When true, the string is the proof's choice s = aᵖbᵖcᵖ. */
  nLocked: boolean;
  s: string;
  cuts: Cuts;
  i: number;
  setP: (p: number) => void;
  setN: (n: number) => void;
  setNLocked: (locked: boolean) => void;
  setCuts: (c: Cuts) => void;
  setI: (i: number) => void;
}

/** Single source of truth for the decomposition workbench; shared with the proof board and attack mode. */
export function useWorkbench(initialP = 4): WorkbenchState {
  const [p, setPRaw] = useState(initialP);
  const [nFree, setNFree] = useState(initialP);
  const [nLocked, setNLockedRaw] = useState(true);
  const n = nLocked ? p : nFree;
  const s = useMemo(() => makeAnBnCn(n), [n]);
  const [cutsRaw, setCutsRaw] = useState<Cuts>(() => defaultCuts(makeAnBnCn(initialP), initialP));
  const [i, setIRaw] = useState(2);

  // Cuts are re-derived whenever the string changes length so they can never be out of range.
  const cuts: Cuts = isWellFormedCuts(s, cutsRaw) ? cutsRaw : defaultCuts(s, p);

  const setP = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(MAX_P, Math.round(next)));
      setPRaw(clamped);
      const nextN = nLocked ? clamped : nFree;
      setCutsRaw(defaultCuts(makeAnBnCn(nextN), clamped));
    },
    [nLocked, nFree],
  );
  const setN = useCallback(
    (next: number) => {
      const clamped = Math.max(1, Math.min(MAX_P, Math.round(next)));
      setNFree(clamped);
      setCutsRaw(defaultCuts(makeAnBnCn(clamped), p));
    },
    [p],
  );
  const setNLocked = useCallback(
    (locked: boolean) => {
      setNLockedRaw(locked);
      if (!locked) setNFree(p);
    },
    [p],
  );
  const setI = useCallback((next: number) => setIRaw(Math.max(0, Math.min(6, Math.round(next)))), []);

  return { p, n, nLocked, s, cuts, i, setP, setN, setNLocked, setCuts: setCutsRaw, setI };
}
