import { useState, useEffect } from 'react';

/**
 * Returns true if the viewport matches the given media query.
 * Mobile-first: use (min-width: 768px) for desktop detection.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mql.addEventListener('change', handler);
    setMatches(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience hook: true when viewport >= 768px
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
