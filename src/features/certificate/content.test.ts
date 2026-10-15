import { describe, expect, it } from 'vitest';
import { buildCertificate, certificateText, toUnicode } from './content';

const EMPTY_LOG = { attacks: 0, attacksRefuted: 0, straddleAttacks: 0, auditsRun: [], proofStepsRevealed: 0, pdaRuns: [] };

describe('proof certificate', () => {
  it('converts notation to Unicode', () => {
    expect(toUnicode('a^nb^{2n}')).toBe('aⁿb²ⁿ');
    expect(toUnicode('Z_0')).toBe('Z₀');
    expect(toUnicode('X^{2n−m}Z_0')).toBe('X²ⁿ⁻ᵐZ₀');
    expect(toUnicode('a^{xyz}')).toBe('a^(xyz)');
  });

  it('states the five-part lemma and both proof cases', () => {
    const text = certificateText(buildCertificate(EMPTY_LOG), 'today');
    expect(text).toContain('s = uvxyz');
    expect(text).toContain('|vxy| ≤ p');
    expect(text).toContain('|vy| > 0');
    expect(text).toContain('uvⁱxyⁱz ∈ L for every i ≥ 0');
    expect(text).toContain('s = aᵖbᵖcᵖ');
    expect(text).toMatch(/Case A \(a boundary is straddled\)/);
    expect(text).toMatch(/Case B \(uniform parts\)/);
    expect(text).toContain('length at least p + 2 > p');
  });

  it('includes the simulator-generated aabbbb trace', () => {
    const text = certificateText(buildCertificate(EMPTY_LOG), 'today');
    for (const row of ['XXZ₀', 'XXXXZ₀', 'XXXZ₀', 'XZ₀']) expect(text).toContain(row);
    expect(text).toContain('ACCEPTED');
  });

  it('reports the investigation record', () => {
    const log = { ...EMPTY_LOG, attacks: 4, attacksRefuted: 3, auditsRun: [{ p: 3, n: 3, total: 120, survivors: 0 }], pdaRuns: ['aabbbb', ''] };
    const text = certificateText(buildCertificate(log), 'today');
    expect(text).toContain('Defenses submitted in Proof Attack: 4 (3 legal splits refuted');
    expect(text).toContain('p = 3 on a³b³c³ (120 legal splits, 0 survivors)');
    expect(text).toContain('aabbbb, ε');
  });
});
