import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

const ROUTES: [string, RegExp][] = [
  ['#/', /Paradox/],
  ['#/pumping', /The Pumping Paradox/],
  ['#/stack', /Stack Protocol/],
  ['#/chamber', /Comparison Chamber/],
  ['#/manual', /Field Manual/],
  ['#/certificate', /Proof Certificate/],
];

describe('App routing', () => {
  it.each(ROUTES)('%s renders its page', (hash, title) => {
    window.location.hash = hash;
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Case files' })).toBeInTheDocument();
  });

  it('switches pages on hash change and ignores in-page anchors', () => {
    window.location.hash = '#/manual';
    render(<App />);
    act(() => {
      window.location.hash = '#m-forge';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { level: 1, name: /Field Manual/ })).toBeInTheDocument();
    act(() => {
      window.location.hash = '#/chamber';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { level: 1, name: /Comparison Chamber/ })).toBeInTheDocument();
  });

  it('marks the current tab', () => {
    window.location.hash = '#/stack';
    render(<App />);
    expect(screen.getByRole('link', { name: /02 Stack Protocol/ })).toHaveAttribute('aria-current', 'page');
  });
});
