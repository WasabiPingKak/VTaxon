import { useEffect, useRef } from 'react';

/**
 * Preloads avatar images from entries for Canvas drawImage().
 * Returns a ref to Map<url, HTMLImageElement>.
 */
export default function useImagePreloader(entries) {
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!entries) return;
    const cache = cacheRef.current;

    for (const entry of entries) {
      const url = entry.avatar_url;
      if (!url || cache.has(url)) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      cache.set(url, img);
    }
  }, [entries]);

  return cacheRef;
}
