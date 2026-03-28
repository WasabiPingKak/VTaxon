import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 640px)';

export default function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
