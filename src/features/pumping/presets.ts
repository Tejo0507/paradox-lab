import { type Cuts } from '../../logic/pumping';

export interface DecompositionPreset {
  id: string;
  label: string;
  /** Builds cuts for s = aⁿbⁿcⁿ; clamped to the string so it is always well-formed. */
  build: (n: number) => [number, number, number, number];
}

/** Hand-picked suspects that cover each case of the proof, including boundary-straddling ones. */
export const DECOMPOSITION_PRESETS: DecompositionPreset[] = [
  { id: 'aa', label: 'v, y inside the a’s', build: () => [0, 1, 1, 2] },
  { id: 'ab', label: 'v in a’s, y in b’s', build: (n) => [n - 1, n, n, n + 1] },
  { id: 'v-straddle', label: 'v straddles a|b', build: (n) => [n - 1, n + 1, n + 1, n + 1] },
  { id: 'y-straddle', label: 'y straddles b|c', build: (n) => [2 * n - 2, 2 * n - 1, 2 * n - 1, 2 * n + 1] },
  { id: 'cc', label: 'v, y inside the c’s', build: (n) => [2 * n, 2 * n + 1, 2 * n + 1, 2 * n + 2] },
  { id: 'greedy', label: 'v=aⁿ x=bⁿ y=cⁿ (illegal)', build: (n) => [0, n, 2 * n, 3 * n] },
];

export function presetCuts(preset: DecompositionPreset, n: number): Cuts {
  const len = 3 * n;
  const raw = preset.build(n).map((c) => Math.max(0, Math.min(len, c)));
  for (let k = 1; k < 4; k++) raw[k] = Math.max(raw[k], raw[k - 1]);
  return raw as unknown as Cuts;
}
