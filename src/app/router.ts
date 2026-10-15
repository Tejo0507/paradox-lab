import { useEffect, useState } from 'react';

export const ROUTES = ['briefing', 'pumping', 'stack', 'chamber', 'manual', 'certificate'] as const;
export type Route = (typeof ROUTES)[number];

export const ROUTE_LABELS: Record<Route, { code: string; title: string }> = {
  briefing: { code: '00', title: 'Briefing' },
  pumping: { code: '01', title: 'Pumping Paradox' },
  stack: { code: '02', title: 'Stack Protocol' },
  chamber: { code: '03', title: 'Comparison Chamber' },
  manual: { code: '04', title: 'Field Manual' },
  certificate: { code: '05', title: 'Certificate' },
};

/** Route hashes look like "#/stack". Plain in-page anchors ("#m-forge") return null and leave the route alone. */
export function parseHash(hash: string): Route | null {
  if (hash === '' || hash === '#' || hash === '#/') return 'briefing';
  if (!hash.startsWith('#/')) return null;
  const name = hash.slice(2).split(/[/?]/)[0];
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'briefing';
}

export function href(route: Route): string {
  return route === 'briefing' ? '#/' : `#/${route}`;
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash) ?? 'briefing');
  useEffect(() => {
    const onChange = () => {
      const next = parseHash(window.location.hash);
      if (next) setRoute(next);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
