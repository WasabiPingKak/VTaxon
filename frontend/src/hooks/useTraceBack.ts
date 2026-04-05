import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { TreeEntry, ActiveTree } from '../types';
import {
  computeHighlightPaths,
  computeFictionalHighlightPaths,
  computeCloseVtubers,
  computeCloseFictionalVtubers,
  computeCloseVtubersByRank,
  computeCloseFictionalVtubersByRank,
  computeCloseEdgePaths,
  computeCloseFictionalEdgePaths,
  collectCloseVtuberPaths,
  collectCloseFictionalVtuberPaths,
} from '../lib/treeUtils';
import {
  computeMaxTraceBack,
  computeTraceBackLevels,
  computeDepthLabels,
  type TraceBackLevel,
} from '../lib/graphLogic';

const FLASH_DURATION = 2800;
const MAX_FLASH_ENTRIES = 500;

export interface UseTraceBackOptions {
  activeFocusedEntries: TreeEntry[];
  activeFocusedIsFictional: boolean;
  entries: TreeEntry[] | null;
  fictionalEntries: TreeEntry[] | null;
  focusedUserId: string | null;
  setExpandedSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  scheduleCameraFit: (fitAll?: boolean, scopeTree?: ActiveTree | null) => void;
}

export interface UseTraceBackReturn {
  traceBack: number;
  setTraceBack: React.Dispatch<React.SetStateAction<number>>;
  maxTraceBack: number;
  traceBackLevels: TraceBackLevel[];
  depthLabels: Record<number, string> | null;
  closeVtuberIds: Map<string, Set<string>>;
  closeByRank: ReturnType<typeof computeCloseVtubersByRank> | null;
  closeEdgePaths: Set<string>;
  handleTraceBackChange: (value: number) => void;
  flashMapRef: React.MutableRefObject<Map<string, number>>;
  edgeFlashStartRef: React.MutableRefObject<number | null>;
  flashTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  hasActiveFlash: boolean;
  /** Trigger a flash + camera fit for filter results. */
  triggerFilterFlash: (filteredReal: TreeEntry[], filteredFict: TreeEntry[]) => void;
}

export default function useTraceBack({
  activeFocusedEntries,
  activeFocusedIsFictional,
  entries,
  fictionalEntries,
  focusedUserId,
  setExpandedSet,
  scheduleCameraFit,
}: UseTraceBackOptions): UseTraceBackReturn {
  const [traceBack, setTraceBack] = useState(2);
  const [traceBackTick, setTraceBackTick] = useState(0);
  const prevTickRef = useRef(0);
  const flashMapRef = useRef<Map<string, number>>(new Map());
  const edgeFlashStartRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashTick, setFlashTick] = useState(0);

  // Max trace back
  const maxTraceBack = useMemo(() =>
    computeMaxTraceBack(activeFocusedEntries, activeFocusedIsFictional),
    [activeFocusedEntries, activeFocusedIsFictional]);

  // Clamp traceBack to max
  useEffect(() => {
    if (traceBack > maxTraceBack) setTraceBack(maxTraceBack);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxTraceBack]);

  // Trace back levels
  const traceBackLevels = useMemo(() =>
    computeTraceBackLevels(activeFocusedEntries, maxTraceBack, activeFocusedIsFictional),
    [activeFocusedEntries, maxTraceBack, activeFocusedIsFictional]);

  // Depth labels
  const depthLabels = useMemo(() =>
    computeDepthLabels(activeFocusedEntries, activeFocusedIsFictional),
    [activeFocusedEntries, activeFocusedIsFictional]);

  // Close vtuber IDs
  const closeVtuberIds = useMemo(() => {
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubers(activeFocusedEntries, fictionalEntries || [], traceBack);
    }
    return computeCloseVtubers(activeFocusedEntries, entries || [], traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  // Close by rank
  const closeByRank = useMemo(() => {
    if (!focusedUserId) return null;
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubersByRank(activeFocusedEntries, fictionalEntries || [], traceBack);
    }
    return computeCloseVtubersByRank(activeFocusedEntries, entries || [], traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, focusedUserId, traceBack, activeFocusedIsFictional]);

  // Close edge paths
  const closeEdgePaths = useMemo(() => {
    if (!focusedUserId) return new Set<string>();
    const closeIdSet = new Set(closeVtuberIds.keys());
    if (activeFocusedIsFictional)
      return computeCloseFictionalEdgePaths(activeFocusedEntries, fictionalEntries || [], closeIdSet, traceBack);
    return computeCloseEdgePaths(activeFocusedEntries, entries || [], closeIdSet, traceBack);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  const handleTraceBackChange = useCallback((value: number) => {
    setTraceBack(value);
    setTraceBackTick(t => t + 1);
  }, []);

  // Trace back change effect
  useEffect(() => {
    if (prevTickRef.current === traceBackTick) return;
    prevTickRef.current = traceBackTick;
    if (traceBackTick === 0) return;

    if (!focusedUserId) return;

    setExpandedSet(prev => {
      const next = new Set(prev);
      let changed = false;

      if (activeFocusedIsFictional && fictionalEntries) {
        const userPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
        for (const p of userPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
        if (closeVtuberIds.size > 0) {
          const closePaths = collectCloseFictionalVtuberPaths(new Set(closeVtuberIds.keys()), fictionalEntries);
          for (const p of closePaths) {
            if (!next.has(p)) { next.add(p); changed = true; }
          }
        }
      } else if (entries) {
        const userPaths = computeHighlightPaths(entries, focusedUserId);
        for (const p of userPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
        if (closeVtuberIds.size > 0) {
          const closePaths = collectCloseVtuberPaths(new Set(closeVtuberIds.keys()), entries);
          for (const p of closePaths) {
            if (!next.has(p)) { next.add(p); changed = true; }
          }
        }
      }
      return changed ? next : prev;
    });

    flashMapRef.current.clear();
    setFlashTick(t => t + 1);

    scheduleCameraFit();

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    const capturedCloseIds = closeVtuberIds;
    flashTimerRef.current = setTimeout(() => {
      const now = performance.now();
      flashMapRef.current.clear();
      edgeFlashStartRef.current = now;
      for (const [userId, paths] of capturedCloseIds) {
        for (const path of paths) {
          flashMapRef.current.set(userId + '\0' + path, now);
        }
      }
      setFlashTick(t => t + 1);
    }, 1100);
  }, [traceBackTick, closeVtuberIds, focusedUserId, entries, fictionalEntries, activeFocusedIsFictional, scheduleCameraFit, setExpandedSet]);

  // Has active flash
  const hasActiveFlash = useMemo(() => {
    const now = performance.now();
    for (const [key, start] of flashMapRef.current) {
      if (now - start > FLASH_DURATION) flashMapRef.current.delete(key);
    }
    if (flashMapRef.current.size > MAX_FLASH_ENTRIES) {
      const iter = flashMapRef.current.keys();
      const excess = flashMapRef.current.size - MAX_FLASH_ENTRIES;
      for (let i = 0; i < excess; i++) {
        const k = iter.next().value;
        if (k !== undefined) flashMapRef.current.delete(k);
      }
    }
    return flashMapRef.current.size > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- flashTick triggers re-computation
  }, [flashTick]);

  // Trigger filter flash (called by parent when filters change)
  const triggerFilterFlash = useCallback((filteredReal: TreeEntry[], filteredFict: TreeEntry[]) => {
    flashMapRef.current.clear();
    setFlashTick(t => t + 1);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    const hasAny = filteredReal.length > 0 || filteredFict.length > 0;
    if (hasAny) {
      flashTimerRef.current = setTimeout(() => {
        const now = performance.now();
        flashMapRef.current.clear();
        for (const e of filteredReal) {
          const path = e.taxon_path;
          if (path) flashMapRef.current.set(e.user_id + '\0' + path, now);
        }
        for (const e of filteredFict) {
          const path = e.fictional_path;
          if (path) flashMapRef.current.set(e.user_id + '\0' + path, now);
        }
        setFlashTick(t => t + 1);
      }, 1100);
    }
  }, []);

  return {
    traceBack,
    setTraceBack,
    maxTraceBack,
    traceBackLevels,
    depthLabels,
    closeVtuberIds,
    closeByRank,
    closeEdgePaths,
    handleTraceBackChange,
    flashMapRef,
    edgeFlashStartRef,
    flashTimerRef,
    hasActiveFlash,
    triggerFilterFlash,
  };
}
