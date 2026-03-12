import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../lib/api';

const POLL_INTERVAL = 60_000; // 60 seconds

/**
 * Hook that polls /api/live-status every 60s.
 * Pauses when the page is not visible (document.visibilityState).
 *
 * Returns:
 *   liveUserIds: Set<string>  — set of user IDs currently live
 *   liveStreams: Map<string, Array<{ provider, stream_title, stream_url, started_at }>>
 */
export default function useLiveStatus() {
  const [liveUserIds, setLiveUserIds] = useState(() => new Set());
  const [liveStreams, setLiveStreams] = useState(() => new Map());
  const intervalRef = useRef(null);
  const visibleRef = useRef(!document.hidden);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getLiveStatus();
      const ids = new Set();
      const streams = new Map();
      for (const s of data.live || []) {
        ids.add(s.user_id);
        const info = { provider: s.provider, stream_title: s.stream_title, stream_url: s.stream_url, started_at: s.started_at };
        const arr = streams.get(s.user_id);
        if (arr) arr.push(info);
        else streams.set(s.user_id, [info]);
      }
      setLiveUserIds(ids);
      setLiveStreams(streams);
    } catch {
      // Silently ignore — live status is non-critical
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Set up polling
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      visibleRef.current = !document.hidden;
      if (visibleRef.current) {
        fetchStatus(); // Immediately refresh when becoming visible
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchStatus]);

  return { liveUserIds, liveStreams };
}
