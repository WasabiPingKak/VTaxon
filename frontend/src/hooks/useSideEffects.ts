import { useEffect, useState, useCallback } from 'react';
import { computeHighlightPaths, computeFictionalHighlightPaths, entryToVtuberPathKey } from '../lib/treeUtils';
import { resolveLocateEntry } from '../lib/graphLogic';
import type { TreeEntry, ActiveTree } from '../types';
import type { LayoutNode } from '../types/graph';

interface UseSideEffectsParams {
  // URL Locate
  searchParams: URLSearchParams;
  setSearchParams: (params: Record<string, string>, opts?: { replace?: boolean }) => void;
  entries: TreeEntry[] | null;
  fictionalEntries: TreeEntry[] | null;
  setFocusedUserId: (id: string | null) => void;
  setFocusedEntryKey: (key: string | null) => void;
  setExpandedSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveTree: (tree: ActiveTree) => void;
  nodesRef: React.MutableRefObject<LayoutNode[]>;
  scheduleCamera: (fn: () => void, delay: number) => void;
  panToWithInsets: (x: number, y: number, scale?: number) => void;

  // Refocus self
  currentUser: { id: string } | null;
  focusedEntriesRef: React.MutableRefObject<TreeEntry[]>;
  entryToPathKeyRef: React.MutableRefObject<(entry: TreeEntry) => string>;

  // Keyboard shortcuts
  focusedUserId: string | null;
  focusedEntries: TreeEntry[];
  handleFocusPrev: () => void;
  handleFocusNext: () => void;
  handleFitAll: () => void;
  setSelectedVtuber: (entry: TreeEntry | null) => void;
}

export default function useSideEffects({
  searchParams,
  setSearchParams,
  entries,
  fictionalEntries,
  setFocusedUserId,
  setFocusedEntryKey,
  setExpandedSet,
  setActiveTree,
  nodesRef,
  scheduleCamera,
  panToWithInsets,
  currentUser,
  focusedEntriesRef,
  entryToPathKeyRef,
  focusedUserId,
  focusedEntries,
  handleFocusPrev,
  handleFocusNext,
  handleFitAll,
  setSelectedVtuber,
}: UseSideEffectsParams) {
  // ── URL Locate ──
  const locateId = searchParams.get('locate');
  const locateTp = searchParams.get('tp');
  const locateFp = searchParams.get('fp');
  const locateBid = searchParams.get('bid');
  const locateFid = searchParams.get('fid');

  useEffect(() => {
    if (!locateId) return;
    if (!entries || !fictionalEntries) return;

    setSearchParams({}, { replace: true });

    const entry = resolveLocateEntry(entries, fictionalEntries, locateId, locateTp, locateFp, locateBid, locateFid);
    if (!entry) return;

    setFocusedUserId(locateId);
    setFocusedEntryKey(
      entry.fictional_path
        ? 'F\0' + (entry.fictional_path || '') + '\0' + (entry.fictional_species_id || '')
        : (entry.taxon_path || '') + '\0' + (entry.breed_id || '')
    );

    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], locateId);
      for (const p of userPaths) next.add(p);
      const fictPaths = computeFictionalHighlightPaths(fictionalEntries || [], locateId);
      for (const p of fictPaths) next.add(p);
      return next;
    });

    if (entry.fictional_path) {
      setActiveTree('fictional');
    }

    scheduleCamera(() => {
      const pathKey = entryToVtuberPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [locateId, entries, fictionalEntries, setSearchParams, scheduleCamera]);

  // ── Refocus self event ──
  const [refocusTick, setRefocusTick] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const handler = (): void => {
      setFocusedUserId(currentUser.id);
      setFocusedEntryKey(null);
      setRefocusTick(t => t + 1);
    };
    window.addEventListener('vtaxon:refocus-self', handler);
    return () => window.removeEventListener('vtaxon:refocus-self', handler);
  }, [currentUser, setFocusedUserId, setFocusedEntryKey]);

  useEffect(() => {
    if (refocusTick === 0) return;
    scheduleCamera(() => {
      const entry = focusedEntriesRef.current[0];
      if (!entry) return;
      const pathKey = entryToPathKeyRef.current(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refocusTick, scheduleCamera]);

  // ── Keyboard shortcuts ──
  const onKeyDown = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setSelectedVtuber(null);
    } else if (e.key === 'Home') {
      handleFitAll();
    } else if (e.key === 'ArrowLeft' && focusedUserId && focusedEntries.length > 1) {
      handleFocusPrev();
    } else if (e.key === 'ArrowRight' && focusedUserId && focusedEntries.length > 1) {
      handleFocusNext();
    }
  }, [focusedUserId, focusedEntries.length, handleFocusPrev, handleFocusNext, handleFitAll, setSelectedVtuber]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);
}
