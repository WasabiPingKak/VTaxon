import { useEffect, useRef } from 'react';

const CONCURRENCY = 6;

/**
 * Preloads avatar images from entries for Canvas drawImage().
 * Returns a ref to Map<url, HTMLImageElement>.
 * Limits concurrent requests to avoid overwhelming mobile connections.
 */
export default function useImagePreloader(entries) {
  const cacheRef = useRef(new Map());

  useEffect(() => {
    if (!entries) return;
    const cache = cacheRef.current;
    let active = 0;
    const queue = [];

    function loadNext() {
      while (active < CONCURRENCY && queue.length > 0) {
        const url = queue.shift();
        active++;
        const img = new Image();
        img.onload = img.onerror = () => { active--; loadNext(); };
        img.src = url;
        cache.set(url, img);
      }
    }

    for (const entry of entries) {
      const url = entry.avatar_url;
      if (!url || cache.has(url)) continue;
      queue.push(url);
    }

    loadNext();
  }, [entries]);

  return cacheRef;
}
