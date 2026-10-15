import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** Session record of what the investigator has done; feeds the certificate. */
export interface CaseLog {
  attacks: number;
  attacksRefuted: number;
  straddleAttacks: number;
  auditsRun: { p: number; n: number; total: number; survivors: number }[];
  proofStepsRevealed: number;
  pdaRuns: string[];
}

const EMPTY: CaseLog = { attacks: 0, attacksRefuted: 0, straddleAttacks: 0, auditsRun: [], proofStepsRevealed: 0, pdaRuns: [] };
const KEY = 'paradox-lab:case-log:v2';

function load(): CaseLog {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<CaseLog>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

interface CaseLogApi {
  log: CaseLog;
  record: (update: (prev: CaseLog) => CaseLog) => void;
  reset: () => void;
}

const Ctx = createContext<CaseLogApi | null>(null);

export function CaseLogProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<CaseLog>(load);
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(log));
    } catch {
      /* storage unavailable: the log simply lasts for this visit */
    }
  }, [log]);
  const record = useCallback((update: (prev: CaseLog) => CaseLog) => setLog(update), []);
  const reset = useCallback(() => setLog(EMPTY), []);
  const api = useMemo(() => ({ log, record, reset }), [log, record, reset]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCaseLog(): CaseLogApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCaseLog must be used inside CaseLogProvider');
  return ctx;
}
