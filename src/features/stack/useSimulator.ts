import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Trace } from '../../logic/pda';
import { runStackProtocol } from '../../logic/stackProtocol';

export const MAX_INPUT = 32;

export interface Simulator {
  input: string;
  trace: Trace;
  index: number;
  playing: boolean;
  delay: number;
  atStart: boolean;
  atEnd: boolean;
  setInput: (s: string) => void;
  setDelay: (ms: number) => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  toEnd: () => void;
  jumpTo: (k: number) => void;
  togglePlay: () => void;
}

/**
 * Playback over a recorded trace. The trace is produced by the PDA engine once per input;
 * moving backwards or forwards just selects a configuration from it, so a rewind always
 * restores the exact state, head position and stack the machine had.
 */
export function useSimulator(initial: string): Simulator {
  const [input, setInputRaw] = useState(initial);
  const trace = useMemo(() => runStackProtocol(input), [input]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(700);
  const last = trace.snapshots.length - 1;

  const setInput = useCallback((s: string) => {
    setInputRaw(s.slice(0, MAX_INPUT));
    setIndex(0);
    setPlaying(false);
  }, []);

  const stepForward = useCallback(() => setIndex((k) => Math.min(k + 1, last)), [last]);
  const stepBack = useCallback(() => {
    setPlaying(false);
    setIndex((k) => Math.max(k - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const toEnd = useCallback(() => {
    setPlaying(false);
    setIndex(last);
  }, [last]);
  const jumpTo = useCallback(
    (k: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(last, k)));
    },
    [last],
  );
  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= last) setIndex(0); // replay from the start when already finished
      return !p;
    });
  }, [index, last]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIndex((k) => Math.min(k + 1, last)), delay);
    return () => window.clearTimeout(t);
  }, [playing, index, last, delay]);

  return {
    input,
    trace,
    index: Math.min(index, last),
    playing,
    delay,
    atStart: index === 0,
    atEnd: index >= last,
    setInput,
    setDelay,
    stepForward,
    stepBack,
    reset,
    toEnd,
    jumpTo,
    togglePlay,
  };
}
