import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CaseLogProvider } from '../app/caseLog';
import { PumpingLab } from './PumpingLab';

function renderLab() {
  return render(
    <CaseLogProvider>
      <PumpingLab />
    </CaseLogProvider>,
  );
}

beforeEach(() => window.localStorage.clear());

describe('Pumping Paradox page', () => {
  it('forge reports membership and survives malformed input', async () => {
    renderLab();
    const input = screen.getByLabelText(/Forge your own string/i);
    fireEvent.change(input, { target: { value: 'aaabbbccc' } });
    expect(screen.getByText(/this is a³b³c³/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'ab☃c' } });
    expect(screen.getByText(/Position 3 holds “☃”, which is not in the alphabet/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'acb' } });
    expect(screen.getByText(/does not have the shape a\*b\*c\*/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText(/The empty string is a⁰b⁰c⁰/)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'a'.repeat(200) } });
    expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(36);
  });

  it('cut handles are keyboard sliders that keep the split ordered', async () => {
    renderLab();
    const handles = screen.getAllByRole('slider', { name: /^Cut / });
    expect(handles).toHaveLength(4);
    const first = handles[0];
    const before = Number(first.getAttribute('aria-valuenow'));
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(Number(screen.getAllByRole('slider', { name: /^Cut / })[0].getAttribute('aria-valuenow'))).toBe(before - 1);
    // Push the last handle far right with End: it can never pass |s|
    const last = screen.getAllByRole('slider', { name: /^Cut / })[3];
    fireEvent.keyDown(last, { key: 'End' });
    expect(Number(screen.getAllByRole('slider', { name: /^Cut / })[3].getAttribute('aria-valuenow'))).toBe(12);
    // vxy now longer than p = 4: the constraint is reported as violated
    expect(screen.getByText(/violated:/)).toBeInTheDocument();
  });

  it('pumping exponent updates the pumped string and verdict', async () => {
    const user = userEvent.setup();
    renderLab();
    const group = screen.getByRole('group', { name: 'Pumping exponent i' });
    await user.click(within(group).getByRole('button', { name: 'i=1' }));
    expect(screen.getByText(/i = 1 always rebuilds s itself/)).toBeInTheDocument();
    await user.click(within(group).getByRole('button', { name: 'i=0' }));
    expect(screen.getByText(/This split breaks at i = 0/)).toBeInTheDocument();
  });

  it('straddling preset is refuted in attack mode with an order violation', async () => {
    const user = userEvent.setup();
    renderLab();
    await user.click(screen.getByRole('button', { name: 'v straddles a|b' }));
    await user.click(screen.getByRole('button', { name: 'Submit current split' }));
    expect(screen.getByText('defense refuted')).toBeInTheDocument();
    expect(screen.getByText(/v straddles a block boundary/)).toBeInTheDocument();
  });

  it('illegal split is flagged rather than judged', async () => {
    const user = userEvent.setup();
    renderLab();
    await user.click(screen.getByRole('button', { name: /illegal/ }));
    await user.click(screen.getByRole('button', { name: 'Submit current split' }));
    expect(screen.getByText('illegal split')).toBeInTheDocument();
    expect(screen.getByText(/exceeds p = 4/)).toBeInTheDocument();
  });

  it('exhaustive audit finds no survivors and labels itself an illustration', async () => {
    const user = userEvent.setup();
    renderLab();
    await user.click(screen.getByRole('button', { name: /Audit every split for p = 4/ }));
    expect(screen.getByText('Survivors').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByText(/It is an illustration, not the proof/)).toBeInTheDocument();
  });

  it('revealing every proof step marks the claim refuted', async () => {
    const user = userEvent.setup();
    renderLab();
    expect(screen.getByText('proof 0/8')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /show every step/ }));
    expect(screen.getByText('claim refuted')).toBeInTheDocument();
    expect(screen.getByText(/is not context-free\./)).toBeInTheDocument();
  });
});
