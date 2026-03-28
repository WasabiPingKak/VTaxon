import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../lib/api';

const POLL_INTERVAL = 60_000; // 60 seconds

interface LiveStreamEntry {
  provider: string;
  stream_title?: string;
  stream_url?: string;
  started_at?: string;
}

interface LivePrimary {
  real?: string;
  fictional?: string;
}

interface UseLiveStatusReturn {
  liveUserIds: Set<string>;
  liveStreams: Map<string, LiveStreamEntry[]>;
  livePrimaries: Map<string, LivePrimary>;
}

/**
 * Hook that polls /api/live-status every 60s.
 * Pauses when the page is not visible (document.visibilityState).
 *
 * Returns:
 *   liveUserIds: Set<string>  — set of user IDs currently live
 *   liveStreams: Map<string, Array<{ provider, stream_title, stream_url, started_at }>>
 */
export default function useLiveStatus(): UseLiveStatusReturn {
  const [liveUserIds, setLiveUserIds] = useState<Set<string>>(() => new Set());
  const [liveStreams, setLiveStreams] = useState<Map<string, LiveStreamEntry[]>>(() => new Map());
  // Map<user_id, { real?: trait_id, fictional?: trait_id }>
  const [livePrimaries, setLivePrimaries] = useState<Map<string, LivePrimary>>(() => new Map());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef<boolean>(!document.hidden);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getLiveStatus();
      const ids = new Set<string>();
      const streams = new Map<string, LiveStreamEntry[]>();
      for (const s of data.live || []) {
        ids.add(s.user_id);
        const info: LiveStreamEntry = { provider: s.provider, stream_title: s.stream_title, stream_url: s.stream_url, started_at: s.started_at };
        const arr = streams.get(s.user_id);
        if (arr) arr.push(info);
        else streams.set(s.user_id, [info]);
      }
      setLiveUserIds(ids);
      setLiveStreams(streams);
      // Parse primaries map
      const pm = new Map<string, LivePrimary>();
      if (data.primaries) {
        for (const [uid, p] of Object.entries(data.primaries)) {
          pm.set(uid, p);
        }
      }
      setLivePrimaries(pm);
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

  return { liveUserIds, liveStreams, livePrimaries };
}
