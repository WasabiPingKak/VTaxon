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
    let cancelled = false;
    const queue = [];

    function loadNext() {
      while (!cancelled && active < CONCURRENCY && queue.length > 0) {
        const url = queue.shift();
        active++;
        const img = new Image();
        img.onload = img.onerror = () => {
          active--;
          if (!cancelled) loadNext();
        };
        img.src = url;
        cache.set(url, img);
      }
    }

    const urls = new Set();
    for (const entry of entries) {
      if (entry.avatar_url) urls.add(entry.avatar_url);
    }

    // Evict entries no longer in current dataset first, then oldest if still over limit
    if (cache.size > MAX_CACHED_IMAGES) {
      for (const key of cache.keys()) {
        if (!urls.has(key)) cache.delete(key);
      }
      // If still over, evict oldest
      if (cache.size > MAX_CACHED_IMAGES) {
        const excess = cache.size - MAX_CACHED_IMAGES + 50;
        const iter = cache.keys();
        for (let i = 0; i < excess; i++) {
          cache.delete(iter.next().value);
        }
      }
    }

    for (const url of urls) {
      if (cache.has(url)) continue;
      queue.push(url);
    }

    loadNext();

    return () => { cancelled = true; };
  }, [entries]);

  return cacheRef;
}
