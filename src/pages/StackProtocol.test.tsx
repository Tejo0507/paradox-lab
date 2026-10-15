import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseLogProvider } from '../app/caseLog';
import { StackProtocol } from './StackProtocol';

function renderSim() {
  return render(
    <CaseLogProvider>
      <StackProtocol />
    </CaseLogProvider>,
  );
}

const stackText = () => screen.getByRole('list', { name: /Stack from top to bottom/ }).getAttribute('aria-label');
const step = () => fireEvent.click(screen.getByRole('button', { name: 'Step ▶' }));
const back = () => fireEvent.click(screen.getByRole('button', { name: '◀ Back' }));

beforeEach(() => window.localStorage.clear());

describe('Stack Protocol simulator', () => {
  it('steps aabbbb through the exact stack evolution and accepts', () => {
    renderSim();
    const expected = ['Z₀', 'X, X, Z₀', 'X, X, X, X, Z₀', 'X, X, X, Z₀', 'X, X, Z₀', 'X, Z₀', 'Z₀', 'Z₀'];
    expect(stackText()).toContain(expected[0]);
    for (let k = 1; k < expected.length; k++) {
      step();
      expect(stackText()).toBe(`Stack from top to bottom: ${expected[k]}`);
    }
    const status = screen.getByRole('status');
    expect(within(status).getByText('accepted')).toBeInTheDocument();
    expect(within(status).getByText(/Machine and definition agree/)).toBeInTheDocument();
  });

  it('stepping back restores the earlier tape position, state and stack', () => {
    renderSim();
    step();
    step();
    step(); // after aab: XXXZ₀ in q2
    const tape = () => screen.getByRole('list', { name: /Input tape/ }).getAttribute('aria-label');
    expect(stackText()).toContain('X, X, X, Z₀');
    expect(tape()).toMatch(/3 of 6 symbols read/);
    back();
    expect(stackText()).toContain('X, X, X, X, Z₀');
    expect(tape()).toMatch(/2 of 6 symbols read/);
    expect(within(screen.getByRole('status')).getByText(/· state q1/)).toBeInTheDocument();
    step();
    expect(stackText()).toContain('X, X, X, Z₀');
  });

  it('the transition log rewinds to any recorded configuration', () => {
    renderSim();
    fireEvent.click(screen.getByRole('button', { name: 'End ⏭' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rewind to step 2' }));
    expect(stackText()).toContain('X, X, X, X, Z₀');
    expect(screen.getByText(/Step 2 \/ 7/)).toBeInTheDocument();
  });

  it('autoplay runs to the end and stops', () => {
    vi.useFakeTimers();
    renderSim();
    fireEvent.click(screen.getByRole('button', { name: '▶ Play' }));
    for (let k = 0; k < 10; k++) {
      act(() => {
        vi.advanceTimersByTime(1600);
      });
    }
    expect(screen.getByRole('button', { name: '↻ Replay' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it.each([
    ['ab', /too few b’s/],
    ['aabbbbb', /more than 2n/],
    ['ba', /first symbol is b/],
    ['', /n ≥ 1/],
    ['ab#b', /not in Σ/],
  ])('rejects %s with an explanation', (input, why) => {
    renderSim();
    fireEvent.change(screen.getByRole('textbox', { name: /Input tape/ }), { target: { value: input } });
    fireEvent.click(screen.getByRole('button', { name: 'End ⏭' }));
    const status = screen.getByRole('status');
    expect(within(status).getByText('rejected')).toBeInTheDocument();
    expect(status.textContent).toMatch(why);
  });

  it('clamps very long input instead of breaking', () => {
    renderSim();
    const input = screen.getByRole('textbox', { name: /Input tape/ }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'a'.repeat(100) } });
    expect(input.value).toHaveLength(32);
    fireEvent.click(screen.getByRole('button', { name: 'End ⏭' }));
    expect(screen.getByRole('status').textContent).toMatch(/no b’s/);
  });

  it('keyboard arrows drive the machine when focus is not in a field', () => {
    renderSim();
    fireEvent.keyDown(document.body, { key: 'ArrowRight' });
    expect(stackText()).toContain('X, X, Z₀');
    fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
    expect(stackText()).toBe('Stack from top to bottom: Z₀');
  });
});
