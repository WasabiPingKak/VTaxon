import { useEffect, useRef } from 'react';

const CONCURRENCY = 6;
const MAX_CACHED_IMAGES = 500;

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

    // Evict oldest entries if cache is too large
    if (cache.size > MAX_CACHED_IMAGES) {
      const excess = cache.size - MAX_CACHED_IMAGES + 50; // evict 50 extra to avoid frequent eviction
      const iter = cache.keys();
      for (let i = 0; i < excess; i++) {
        const key = iter.next().value;
        cache.delete(key);
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
