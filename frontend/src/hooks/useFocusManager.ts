import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { TreeEntry } from '../types';
import type { TaxonomyTreeNode } from '../types/tree';
import { computeHighlightPaths, computeFictionalHighlightPaths, findNode, autoExpandPaths, entryToVtuberPathKey } from '../lib/treeUtils';
import {
  entryToKey,
  computeRawFocusedEntries,
  deriveFocusedSpeciesIdx,
  computeActiveFocusedEntries,
} from '../lib/graphLogic';
import type useTreeLayout from './useTreeLayout';

type LayoutNode = ReturnType<typeof useTreeLayout>['nodes'][number];

export interface UseFocusManagerOptions {
  entries: TreeEntry[] | null;
  fictionalEntries: TreeEntry[] | null;
  nodes: LayoutNode[];
  currentUser: { id: string } | null;
  rootData: TaxonomyTreeNode | null;
  fictionalRootData: TaxonomyTreeNode | null;
  setExpandedSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandBudgetGroupsForUser: (userId: string) => void;
  nodesRef: React.MutableRefObject<LayoutNode[]>;
  scheduleCamera: (fn: () => void, delay: number) => void;
  panToWithInsets: (x: number, y: number, scale?: number) => void;
}

export interface UseFocusManagerReturn {
  focusedUserId: string | null;
  setFocusedUserId: React.Dispatch<React.SetStateAction<string | null>>;
  focusedEntryKey: string | null;
  setFocusedEntryKey: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVtuber: TreeEntry | null;
  setSelectedVtuber: React.Dispatch<React.SetStateAction<TreeEntry | null>>;
  rawFocusedEntries: TreeEntry[];
  focusedEntries: TreeEntry[];
  focusedEntriesRef: React.MutableRefObject<TreeEntry[]>;
  focusedSpeciesIdx: number;
  activeFocusedEntries: TreeEntry[];
  activeFocusedIsFictional: boolean;
  selectedVtuberEntries: TreeEntry[];
  handleFocusPrev: () => void;
  handleFocusNext: () => void;
  handleJumpToSpecies: (index: number) => void;
  handleLocateFocused: () => void;
  handleSetFocus: (entry: TreeEntry) => void;
  handleSwitchEntry: (newEntry: TreeEntry) => void;
  entryToPathKey: (entry: TreeEntry) => string;
  entryToPathKeyRef: React.MutableRefObject<(entry: TreeEntry) => string>;
}

export default function useFocusManager({
  entries,
  fictionalEntries,
  nodes,
  currentUser,
  rootData,
  fictionalRootData,
  setExpandedSet,
  expandBudgetGroupsForUser,
  nodesRef,
  scheduleCamera,
  panToWithInsets,
}: UseFocusManagerOptions): UseFocusManagerReturn {
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [focusedEntryKey, setFocusedEntryKey] = useState<string | null>(null);
  const [selectedVtuber, setSelectedVtuber] = useState<TreeEntry | null>(null);

  // Raw focused entries
  const rawFocusedEntries = useMemo(() =>
    computeRawFocusedEntries(focusedUserId, entries, fictionalEntries),
    [focusedUserId, entries, fictionalEntries]);

  // Sorted by tree X position
  const focusedEntries = useMemo(() => {
    if (rawFocusedEntries.length <= 1 || !nodes?.length) return rawFocusedEntries;
    const xMap = new Map<string, number>();
    for (const n of nodes) {
      if (n.data._vtuber && n.data._userId === focusedUserId && n.data._pathKey)
        xMap.set(n.data._pathKey, n.x);
    }
    if (xMap.size === 0) return rawFocusedEntries;
    return [...rawFocusedEntries].sort((a, b) =>
      (xMap.get(entryToVtuberPathKey(a)) ?? 0) - (xMap.get(entryToVtuberPathKey(b)) ?? 0)
    );
  }, [rawFocusedEntries, nodes, focusedUserId]);

  const focusedEntriesRef = useRef(focusedEntries);
  focusedEntriesRef.current = focusedEntries;

  // Species index
  const focusedSpeciesIdx = useMemo(() =>
    deriveFocusedSpeciesIdx(focusedEntryKey, focusedEntries),
    [focusedEntryKey, focusedEntries]);

  // Active focused entry
  const activeFocusedEntries = useMemo(() =>
    computeActiveFocusedEntries(focusedEntries, focusedSpeciesIdx),
    [focusedEntries, focusedSpeciesIdx]);

  const activeFocusedIsFictional = activeFocusedEntries.length > 0 && !!activeFocusedEntries[0].fictional_path;

  // Selected vtuber entries
  const selectedVtuberEntries = useMemo(() => {
    if (!selectedVtuber) return [];
    const real = entries ? entries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    return [...real, ...fict];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVtuber?.user_id, entries, fictionalEntries]);

  // entryToPathKey helper
  const entryToPathKey = useCallback((entry: TreeEntry): string => {
    return entryToVtuberPathKey(entry);
  }, []);

  const entryToPathKeyRef = useRef(entryToPathKey);
  entryToPathKeyRef.current = entryToPathKey;

  // Navigation handlers
  const handleFocusPrev = useCallback(() => {
    const newIdx = focusedSpeciesIdx <= 0 ? focusedEntries.length - 1 : focusedSpeciesIdx - 1;
    const entry = focusedEntries[newIdx];
    if (entry) setFocusedEntryKey(entryToKey(entry));
  }, [focusedSpeciesIdx, focusedEntries]);

  const handleFocusNext = useCallback(() => {
    const newIdx = focusedSpeciesIdx >= focusedEntries.length - 1 ? 0 : focusedSpeciesIdx + 1;
    const entry = focusedEntries[newIdx];
    if (entry) setFocusedEntryKey(entryToKey(entry));
  }, [focusedSpeciesIdx, focusedEntries]);

  const handleJumpToSpecies = useCallback((index: number) => {
    const entry = focusedEntries[index];
    if (entry) setFocusedEntryKey(entryToKey(entry));
  }, [focusedEntries]);

  // Locate focused
  const handleLocateFocused = useCallback(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId!);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      if (rootData) {
        const sizeBefore = next.size;
        for (const p of userPaths) {
          const node = findNode(rootData, p);
          if (node) autoExpandPaths(node, next);
        }
        if (next.size !== sizeBefore) changed = true;
      }
      let fictPaths: Set<string> | undefined;
      if (fictionalEntries) {
        fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId!);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      if (fictionalRootData && fictPaths) {
        const sizeBefore = next.size;
        for (const p of fictPaths) {
          const node = findNode(fictionalRootData, p);
          if (node) autoExpandPaths(node, next);
        }
        if (next.size !== sizeBefore) changed = true;
      }
      return changed ? next : prev;
    });

    if (focusedUserId) expandBudgetGroupsForUser(focusedUserId);

    scheduleCamera(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedEntries, focusedSpeciesIdx, entries, fictionalEntries, focusedUserId, entryToPathKey, scheduleCamera, rootData, fictionalRootData]);

  // Set focus on a vtuber
  const handleSetFocus = useCallback((entry: TreeEntry) => {
    const userId = entry.user_id;
    setFocusedUserId(userId);
    setFocusedEntryKey(entryToKey(entry));

    expandBudgetGroupsForUser(userId);

    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], userId);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, userId);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    scheduleCamera(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, fictionalEntries, entryToPathKey, scheduleCamera]);

  // Switch entry from detail panel
  const handleSwitchEntry = useCallback((newEntry: TreeEntry) => {
    setSelectedVtuber(newEntry);
    setFocusedUserId(newEntry.user_id);
    setFocusedEntryKey(entryToKey(newEntry));

    expandBudgetGroupsForUser(newEntry.user_id);

    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], newEntry.user_id);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, newEntry.user_id);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    scheduleCamera(() => {
      const pathKey = entryToPathKey(newEntry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, fictionalEntries, entryToPathKey, scheduleCamera]);

  // Auto-focus logged-in user
  useEffect(() => {
    if (currentUser && !focusedUserId) setFocusedUserId(currentUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on currentUser?.id only
  }, [currentUser?.id, focusedUserId]);

  // Pan to focused species when selection changes
  useEffect(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    if (focusedUserId) expandBudgetGroupsForUser(focusedUserId);

    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId!);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId!);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    scheduleCamera(() => {
      const latestEntry = focusedEntriesRef.current[focusedSpeciesIdx] || focusedEntriesRef.current[0];
      if (!latestEntry) return;
      const pathKey = entryToPathKeyRef.current(latestEntry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedEntryKey, focusedUserId, focusedSpeciesIdx, scheduleCamera]);

  return {
    focusedUserId,
    setFocusedUserId,
    focusedEntryKey,
    setFocusedEntryKey,
    selectedVtuber,
    setSelectedVtuber,
    rawFocusedEntries,
    focusedEntries,
    focusedEntriesRef,
    focusedSpeciesIdx,
    activeFocusedEntries,
    activeFocusedIsFictional,
    selectedVtuberEntries,
    handleFocusPrev,
    handleFocusNext,
    handleJumpToSpecies,
    handleLocateFocused,
    handleSetFocus,
    handleSwitchEntry,
    entryToPathKey,
    entryToPathKeyRef,
  };
}
