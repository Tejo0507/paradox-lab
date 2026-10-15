import { describe, expect, it } from 'vitest';
import { href, parseHash } from './router';

describe('hash router', () => {
  it('maps route hashes to routes', () => {
    expect(parseHash('')).toBe('briefing');
    expect(parseHash('#/')).toBe('briefing');
    expect(parseHash('#/pumping')).toBe('pumping');
    expect(parseHash('#/stack?x=1')).toBe('stack');
  });
  it('sends unknown routes to the briefing', () => expect(parseHash('#/nowhere')).toBe('briefing'));
  it('ignores in-page anchors so they do not change the page', () => expect(parseHash('#m-forge')).toBeNull());
  it('builds hrefs', () => {
    expect(href('briefing')).toBe('#/');
    expect(href('chamber')).toBe('#/chamber');
  });
});
