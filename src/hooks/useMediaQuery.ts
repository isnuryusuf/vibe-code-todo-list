import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 900px)';

function getInitialMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Tracks whether the viewport is wide enough for the desktop layout.
 * Safe in tests and SSR where matchMedia may not exist.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(getInitialMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}
