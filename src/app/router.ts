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

export function parseHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'briefing';
}

export function href(route: Route): string {
  return route === 'briefing' ? '#/' : `#/${route}`;
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
