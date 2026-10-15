import { type ComponentType, useEffect, useRef } from 'react';
import { CaseLogProvider } from './caseLog';
import { href, type Route, ROUTE_LABELS, ROUTES, useHashRoute } from './router';
import { Briefing } from '../pages/Briefing';
import { PumpingLab } from '../pages/PumpingLab';
import { StackProtocol } from '../pages/StackProtocol';
import { Chamber } from '../pages/Chamber';
import { Manual } from '../pages/Manual';
import { Certificate } from '../pages/Certificate';
import './app.css';

const PAGES: Partial<Record<Route, ComponentType>> = {
  briefing: Briefing,
  pumping: PumpingLab,
  stack: StackProtocol,
  chamber: Chamber,
  manual: Manual,
  certificate: Certificate,
};

export function App() {
  const route = useHashRoute();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('main h1');
    heading?.focus({ preventScroll: true });
  }, [route]);

  // In-page anchors (href="#section") scroll without touching the route hash.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]');
      const target = a?.getAttribute('href');
      if (!a || !target || target.startsWith('#/') || target === '#') return;
      const el = document.getElementById(target.slice(1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ block: 'start' });
      const focusable = el.matches('h1, h2, h3') ? el : el.querySelector<HTMLElement>('h2, h3');
      if (focusable) {
        if (!focusable.hasAttribute('tabindex')) focusable.setAttribute('tabindex', '-1');
        focusable.focus({ preventScroll: true });
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const Page = PAGES[route] ?? Briefing;
  const available = ROUTES.filter((r) => PAGES[r]);

  return (
    <CaseLogProvider>
      <a className="skip-link" href="#main" onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        Skip to content
      </a>
      <header className="masthead no-print">
        <a className="wordmark" href={href('briefing')} aria-label="Paradox Lab — briefing">
          <span className="wordmark__box">P</span>
          <span className="wordmark__text">
            Paradox<em>Lab</em>
          </span>
        </a>
        <nav className="tabs" aria-label="Case files">
          <ul>
            {available.map((r) => (
              <li key={r}>
                <a href={href(r)} className="tab" aria-current={r === route ? 'page' : undefined}>
                  <span className="tab__code">{ROUTE_LABELS[r].code}</span>
                  <span className="tab__title">{ROUTE_LABELS[r].title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} key={route} className="route">
        <Page />
      </main>
      <footer className="colophon no-print">
        <span>PARADOX LAB · every verdict on these pages is computed in your browser, not looked up.</span>
        <span>
          Formal languages & automata · <a href="https://github.com/Tejo0507/paradox-lab">source</a>
        </span>
      </footer>
    </CaseLogProvider>
  );
}
