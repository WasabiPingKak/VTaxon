import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode, autoExpandPaths, autoExpandPathsUnfiltered, subtreeHasNormalUser, computeCloseVtubers, collectCloseVtuberPaths, computeCloseVtubersByRank, computeFictionalHighlightPaths, collectAllFictionalPaths, computeCloseFictionalVtubers, computeCloseFictionalVtubersByRank, collectCloseFictionalVtuberPaths, computeCloseEdgePaths, computeCloseFictionalEdgePaths, entryToVtuberPathKey } from '../../lib/treeUtils';
import GraphCanvas from './GraphCanvas';
import type { GraphCanvasHandle } from './GraphCanvas';
import { drawGraph, createStarField } from './renderers';
import useTreeLayout from '../../hooks/useTreeLayout';
import useGraphInteraction from '../../hooks/useGraphInteraction';
import useImagePreloader from '../../hooks/useImagePreloader';
import useNodeAnimation from '../../hooks/useNodeAnimation';
import VtuberDetailPanel from '../VtuberDetailPanel';
import FloatingToolbar from './FloatingToolbar';
import FilterPanel from './FilterPanel';
import FocusHUD from './FocusHUD';
import { filterEntries, computeFacets, countActiveFilters, emptyFilters } from '../../lib/treeFilters';
import useIsMobile from '../../hooks/useIsMobile';
import useLiveStatus from '../../hooks/useLiveStatus';
import type { TreeEntry, TreeFilters, ActiveTree, SortKey, SortOrder } from '../../types';

// ── Local types ──

interface SortConfig {
  key: string;
  order: SortOrder;
  shuffleSeed: number | null;
  liveUserIds?: Set<string>;
}

interface TraceBackLevel {
  label: string;
  value: number;
  available: boolean;
}

interface TaxonomyGraphProps {
  currentUser: { id: string } | null;
  authLoading: boolean;
}

export interface TaxonomyGraphHandle {
  refetch: () => Promise<{ entries: TreeEntry[]; fictionalEntries: TreeEntry[] }>;
}

// ── Helpers ──

function getDailyHash(): number {
  const dateStr = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const c of dateStr) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function entryToKey(e: TreeEntry | null): string | null {
  if (!e) return null;
  if (e.fictional_path) return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '');
  return (e.taxon_path || '') + '\0' + (e.breed_id || '');
}

const TaxonomyGraph = forwardRef<TaxonomyGraphHandle, TaxonomyGraphProps>(function TaxonomyGraph({ currentUser, authLoading }, ref) {
  const canvasRef = useRef<GraphCanvasHandle | null>(null);
  const starFieldRef = useRef<HTMLCanvasElement | null>(null);
  const initialFitDone = useRef(false);
  const nodesRef = useRef<ReturnType<typeof useTreeLayout>['nodes']>([]);
  const cameraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [fictionalEntries, setFictionalEntries] = useState<TreeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [expandedBudgetGroups, setExpandedBudgetGroups] = useState<Set<string>>(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState<TreeEntry | null>(null);

  // Focus Vtuber state
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [focusedEntryKey, setFocusedEntryKey] = useState<string | null>(null);

  // Trace back range (0 = same species, 1 = same genus, 2 = same family, 3 = same order max)
  const [traceBack, setTraceBack] = useState(2);

  // Active tree selector
  const [activeTree, setActiveTree] = useState<ActiveTree>('real');

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('active_first');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);

  // Filter state
  const [filters, setFilters] = useState<TreeFilters>(() => emptyFilters());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const isMobile = useIsMobile();
  const { liveUserIds, livePrimaries } = useLiveStatus();

  // Camera insets: [padding, leftInset, rightInset, bottomInset, topInset]
  const cameraInsetsRef = useRef<[number, number, number, number, number]>([80, 220, 100, 80, 100]);
  useEffect(() => {
    cameraInsetsRef.current = isMobile
      ? [40, 16, 16, 72, 60]
      : [80, 220, 100, 80, 100];
  }, [isMobile]);

  // Helper: panTo with current insets (skips padding, uses inset indices 1-4)
  const panToWithInsets = useCallback((x: number, y: number, scale?: number) => {
    const [, l, r, b, t] = cameraInsetsRef.current;
    canvasRef.current?.panTo(x, y, scale ?? null, l, r, b, t);
  }, []);

  // Fetch tree data (real + fictional in parallel).
  const fetchTreeData = useCallback(async ({ refresh = false } = {}): Promise<{ entries: TreeEntry[]; fictionalEntries: TreeEntry[] }> => {
    const qs = refresh ? '?refresh=1' : '';
    const [realData, fictData] = await Promise.all([
      api.getTaxonomyTree(qs).catch(() => ({ entries: [] as TreeEntry[] })),
      api.getFictionalTree(qs).catch(() => ({ entries: [] as TreeEntry[] })),
    ]);
    const e = realData.entries || [];
    const fe = fictData.entries || [];
    setEntries(e);
    setFictionalEntries(fe);
    return { entries: e, fictionalEntries: fe };
  }, []);

  // Expose refetch to parent
  useImperativeHandle(ref, () => ({
    refetch: () => fetchTreeData({ refresh: true }),
  }), [fetchTreeData]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    fetchTreeData()
      .then(({ entries: e, fictionalEntries: fe }) => {
        if (cancelled) return;

        const defaultExpanded: Set<string> = currentUser
          ? new Set()
          : collectPathsToDepth(e, 2);

        if (currentUser) {
          const userPaths = computeHighlightPaths(e, currentUser.id);
          for (const p of userPaths) defaultExpanded.add(p);
          if (fe.length > 0) {
            const fictUserPaths = computeFictionalHighlightPaths(fe, currentUser.id);
            for (const p of fictUserPaths) defaultExpanded.add(p);
          }
        }

        setExpandedSet(defaultExpanded);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on currentUser?.id only
  }, [authLoading, currentUser?.id, fetchTreeData]);

  // Auto-focus logged-in user
  useEffect(() => {
    if (currentUser && !focusedUserId) setFocusedUserId(currentUser.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on currentUser?.id only
  }, [currentUser?.id, focusedUserId]);

  // Centralized camera scheduling
  const scheduleCamera = useCallback((fn: () => void, delay: number) => {
    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    cameraTimerRef.current = setTimeout(() => {
      cameraTimerRef.current = null;
      fn();
    }, delay);
  }, []);

  // Handle ?locate=userId from toast / directory page
  const [searchParams, setSearchParams] = useSearchParams();
  const locateId = searchParams.get('locate');
  const locateTp = searchParams.get('tp');
  const locateFp = searchParams.get('fp');
  const locateBid = searchParams.get('bid');
  const locateFid = searchParams.get('fid');

  useEffect(() => {
    if (!locateId) return;
    if (!entries || !fictionalEntries) return;

    setSearchParams({}, { replace: true });

    // Try to find the specific entry when path params are provided
    let entry: TreeEntry | undefined;
    if (locateFp) {
      entry = (fictionalEntries || []).find(e =>
        e.user_id === locateId && e.fictional_path === locateFp
        && (locateFid == null || String(e.fictional_species_id) === locateFid)
      );
    } else if (locateTp) {
      entry = entries.find(e =>
        e.user_id === locateId && e.taxon_path === locateTp
        && (locateBid == null || String(e.breed_id ?? '') === locateBid)
      );
    }
    // Fallback: first entry for this user
    if (!entry) {
      entry = entries.find(e => e.user_id === locateId)
        || (fictionalEntries || []).find(e => e.user_id === locateId);
    }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable (empty deps useCallback)
  }, [locateId, entries, fictionalEntries, setSearchParams, scheduleCamera]);

  // Focused entries for this user (raw: real + fictional, then sorted by X position)
  const rawFocusedEntries = useMemo(() => {
    if (!focusedUserId) return [];
    const real = entries ? entries.filter(e => e.user_id === focusedUserId) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === focusedUserId) : [];
    return [...real, ...fict];
  }, [focusedUserId, entries, fictionalEntries]);

  // ── Filtering ──
  const filteredEntries = useMemo(() =>
    filterEntries(entries, filters), [entries, filters]);
  const filteredFictionalEntries = useMemo(() =>
    filterEntries(fictionalEntries, filters), [fictionalEntries, filters]);

  // ── Live filter ──
  const finalEntries = useMemo(() => {
    if (!liveFilterActive) return filteredEntries;
    const liveEntries = filteredEntries.filter(e => liveUserIds.has(e.user_id));
    const seen = new Set<string>();
    const primary: TreeEntry[] = [];
    const fallback: TreeEntry[] = [];
    for (const e of liveEntries) {
      const p = livePrimaries.get(e.user_id);
      if (p?.real && (e as TreeEntry & { trait_id?: string }).trait_id === p.real) {
        if (!seen.has(e.user_id)) {
          seen.add(e.user_id);
          primary.push(e);
        }
      } else {
        fallback.push(e);
      }
    }
    for (const e of fallback) {
      if (!seen.has(e.user_id)) {
        seen.add(e.user_id);
        primary.push(e);
      }
    }
    return primary;
  }, [filteredEntries, liveFilterActive, liveUserIds, livePrimaries]);

  const finalFictionalEntries = useMemo(() => {
    if (!liveFilterActive) return filteredFictionalEntries;
    const liveEntries = filteredFictionalEntries.filter(e => liveUserIds.has(e.user_id));
    const seen = new Set<string>();
    const primary: TreeEntry[] = [];
    const fallback: TreeEntry[] = [];
    for (const e of liveEntries) {
      const p = livePrimaries.get(e.user_id);
      if (p?.fictional && (e as TreeEntry & { trait_id?: string }).trait_id === p.fictional) {
        if (!seen.has(e.user_id)) {
          seen.add(e.user_id);
          primary.push(e);
        }
      } else {
        fallback.push(e);
      }
    }
    for (const e of fallback) {
      if (!seen.has(e.user_id)) {
        seen.add(e.user_id);
        primary.push(e);
      }
    }
    return primary;
  }, [filteredFictionalEntries, liveFilterActive, liveUserIds, livePrimaries]);

  // Live count from raw entries
  const liveCount = useMemo(() => {
    if (!entries || !liveUserIds || liveUserIds.size === 0) return 0;
    const seen = new Set<string>();
    for (const e of entries) {
      if (liveUserIds.has(e.user_id)) seen.add(e.user_id);
    }
    if (fictionalEntries) {
      for (const e of fictionalEntries) {
        if (liveUserIds.has(e.user_id)) seen.add(e.user_id);
      }
    }
    return seen.size;
  }, [entries, fictionalEntries, liveUserIds]);

  // Facets from raw (unfiltered) entries
  const facets = useMemo(() => {
    const all = [...(entries || []), ...(fictionalEntries || [])];
    return computeFacets(all);
  }, [entries, fictionalEntries]);

  // ── Sort config per tree ──
  const baseSortConfig = useMemo((): SortConfig => (
    { key: sortKey, order: sortOrder, shuffleSeed: null, liveUserIds }
  ), [sortKey, sortOrder, liveUserIds]);

  const shuffleSortConfig = useMemo((): SortConfig | null => (
    shuffleSeed != null
      ? { key: 'shuffle', order: sortOrder, shuffleSeed }
      : null
  ), [sortOrder, shuffleSeed]);

  const realSortConfig = useMemo(() => (
    shuffleSortConfig && activeTree === 'real' ? shuffleSortConfig : baseSortConfig
  ), [shuffleSortConfig, baseSortConfig, activeTree]);

  const fictSortConfig = useMemo(() => (
    shuffleSortConfig && activeTree === 'fictional' ? shuffleSortConfig : baseSortConfig
  ), [shuffleSortConfig, baseSortConfig, activeTree]);

  // Sort/filter handlers
  const handleSortChange = useCallback((key: SortKey, order: SortOrder) => {
    setSortKey(key);
    setSortOrder(order);
    setShuffleSeed(null);
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffleSeed(s => s != null ? null : getDailyHash());
    scheduleCamera(() => {
      const prefix = activeTree === 'fictional' ? '__F__' : '';
      const rootNode = nodesRef.current.find(
        n => n.depth === 0 && (n.data._pathKey || '') === prefix,
      );
      if (!rootNode) return;
      const [, l, r, , t] = cameraInsetsRef.current;
      const vh = window.innerHeight;
      const fakeBottom = 0.6 * (vh - t);
      canvasRef.current?.panTo(rootNode.x, rootNode.y, undefined, l, r, fakeBottom, t);
    }, 80);
  }, [activeTree, scheduleCamera]);


  // d3 layout
  const activeFilterCount = countActiveFilters(filters);
  const hasSortBadge = (sortKey === 'debut_date' || sortKey === 'created_at' || sortKey === 'active_first') ? 2 : 0;
  const totalBadgeCount = activeFilterCount + hasSortBadge;
  const { nodes, edges, bounds, rootData, fictionalRootData, maxCount } = useTreeLayout(
    finalEntries, finalFictionalEntries, expandedSet, currentUser?.id ?? null, realSortConfig, fictSortConfig, totalBadgeCount, expandedBudgetGroups,
  );
  nodesRef.current = nodes;

  // Focused entries sorted by tree X position
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

  // Derive index from stable entry key
  const focusedSpeciesIdx = useMemo(() => {
    if (!focusedEntryKey || focusedEntries.length === 0) return 0;
    const idx = focusedEntries.findIndex(e => {
      if (e.fictional_path) {
        return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '') === focusedEntryKey;
      }
      return (e.taxon_path || '') + '\0' + (e.breed_id || '') === focusedEntryKey;
    });
    return idx >= 0 ? idx : 0;
  }, [focusedEntryKey, focusedEntries]);

  // Active focused entry
  const activeFocusedEntries = useMemo(() => {
    const entry = focusedEntries[focusedSpeciesIdx] || focusedEntries[0];
    return entry ? [entry] : [];
  }, [focusedEntries, focusedSpeciesIdx]);

  const activeFocusedIsFictional = activeFocusedEntries.length > 0 && !!activeFocusedEntries[0].fictional_path;

  // Auto-sync activeTree
  useEffect(() => {
    if (activeFocusedEntries.length === 0) return;
    setActiveTree(activeFocusedIsFictional ? 'fictional' : 'real');
  }, [activeFocusedIsFictional, activeFocusedEntries.length]);

  // Max trace back
  const maxTraceBack = useMemo(() => {
    if (!activeFocusedEntries.length) return 0;
    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      return Math.max(0, segs - 1 - 0);
    }
    const segs = (activeFocusedEntries[0].taxon_path || '').split('|').length;
    return Math.max(0, segs - 1 - 2);
  }, [activeFocusedEntries, activeFocusedIsFictional]);

  useEffect(() => {
    if (traceBack > maxTraceBack) setTraceBack(maxTraceBack);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxTraceBack]);

  // Trace back levels for UI
  const traceBackLevels = useMemo((): TraceBackLevel[] => {
    if (!activeFocusedEntries.length) return [];

    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      const levels: TraceBackLevel[] = [];
      if (segs >= 4) {
        levels.push({ label: '同來源', value: 3, available: 3 <= maxTraceBack });
        levels.push({ label: '同體系', value: 2, available: 2 <= maxTraceBack });
        levels.push({ label: '同類型', value: 1, available: 1 <= maxTraceBack });
        levels.push({ label: '同種', value: 0, available: true });
      } else if (segs === 3) {
        levels.push({ label: '同來源', value: 2, available: 2 <= maxTraceBack });
        levels.push({ label: '同體系', value: 1, available: 1 <= maxTraceBack });
        levels.push({ label: '同種', value: 0, available: true });
      } else {
        levels.push({ label: '同來源', value: 1, available: 1 <= maxTraceBack });
        levels.push({ label: '同種', value: 0, available: true });
      }
      return levels;
    }

    const REAL_LEVELS = [
      { label: '同綱', depth: 3 },
      { label: '同目', depth: 4 },
      { label: '同科', depth: 5 },
      { label: '同屬', depth: 6 },
      { label: '同種', depth: 7 },
    ];
    const maxDepth = (activeFocusedEntries[0].taxon_path || '').split('|').length;
    return REAL_LEVELS.map(lv => ({
      label: lv.label,
      value: maxDepth - lv.depth,
      available: (maxDepth - lv.depth) >= 0 && (maxDepth - lv.depth) <= maxTraceBack,
    }));
  }, [activeFocusedEntries, maxTraceBack, activeFocusedIsFictional]);

  // Depth labels for FloatingToolbar
  const depthLabels = useMemo((): Record<number, string> | null => {
    if (!activeFocusedEntries.length) return null;
    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      if (segs >= 4) return { 4: '同種', 3: '同類型', 2: '同體系', 1: '同來源' };
      if (segs === 3) return { 3: '同種', 2: '同體系', 1: '同來源' };
      return { 2: '同種', 1: '同來源' };
    }
    return { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界' };
  }, [activeFocusedEntries, activeFocusedIsFictional]);

  // Close (related) vtuber IDs
  const closeVtuberIds = useMemo(() => {
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubers(activeFocusedEntries, fictionalEntries || [], traceBack);
    }
    return computeCloseVtubers(activeFocusedEntries, entries || [], traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  // Close vtubers by rank stats
  const closeByRank = useMemo(() => {
    if (!focusedUserId) return null;
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubersByRank(activeFocusedEntries, fictionalEntries || [], traceBack);
    }
    return computeCloseVtubersByRank(activeFocusedEntries, entries || [], traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, focusedUserId, traceBack, activeFocusedIsFictional]);

  // Close edge paths for highlight rendering
  const closeEdgePaths = useMemo(() => {
    if (!focusedUserId) return new Set<string>();
    const closeIdSet = new Set(closeVtuberIds.keys());
    if (activeFocusedIsFictional)
      return computeCloseFictionalEdgePaths(activeFocusedEntries, fictionalEntries || [], closeIdSet, traceBack);
    return computeCloseEdgePaths(activeFocusedEntries, entries || [], closeIdSet, traceBack);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  // ── TraceBack change: auto-expand + flash ALL close nodes + camera fit ──
  const [traceBackTick, setTraceBackTick] = useState(0);
  const prevTickRef = useRef(0);
  const flashMapRef = useRef<Map<string, number>>(new Map());
  const edgeFlashStartRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [flashTick, setFlashTick] = useState(0);
  const FLASH_DURATION = 2800;
  const MAX_FLASH_ENTRIES = 500;

  // Cleanup all pending timers on unmount
  useEffect(() => {
    return () => {
      if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleTraceBackChange = useCallback((value: number) => {
    setTraceBack(value);
    setTraceBackTick(t => t + 1);
  }, []);

  // Shared: schedule camera fit after layout updates
  const scheduleCameraFit = useCallback((fitAll = false, scopeTree: ActiveTree | null = null) => {
    scheduleCamera(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let count = 0;

      const inScope = (n: typeof currentNodes[0]): boolean => {
        if (!scopeTree) return true;
        const isFict = (n.data._pathKey || '').startsWith('__F__');
        return scopeTree === 'fictional' ? isFict : !isFict;
      };

      if (!fitAll && focusedUserId && closeVtuberIds.size > 0) {
        const activeEntry = activeFocusedEntries[0];
        const activePathKey = activeEntry ? entryToVtuberPathKey(activeEntry) : null;

        const edgePaths = closeEdgePaths;
        for (const n of currentNodes) {
          if (!inScope(n)) continue;
          const pk = n.data._pathKey || '';
          const isVtuberMatch = n.data._vtuber && (
            (activePathKey && pk === activePathKey) ||
            closeVtuberIds.get(n.data._userId ?? '')?.has(n.data._entry?.fictional_path || n.data._entry?.taxon_path || '')
          );
          const isEdgeNode = edgePaths.size > 0 && edgePaths.has(pk);
          if (!isVtuberMatch && !isEdgeNode) continue;
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
          count++;
        }
      }

      if (count === 0 && !fitAll && focusedUserId) {
        const activeEntry = activeFocusedEntries[0];
        if (activeEntry) {
          const activePathKey = entryToVtuberPathKey(activeEntry);
          const focusedNode = currentNodes.find(n => n.data._pathKey === activePathKey);
          if (focusedNode) {
            panToWithInsets(focusedNode.x, focusedNode.y);
            return;
          }
        }
      }

      if (count === 0) {
        for (const n of currentNodes) {
          if (!inScope(n)) continue;
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
          count++;
        }
      }

      if (count === 0) return;
      canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [focusedUserId, closeVtuberIds, closeEdgePaths, activeFocusedEntries, scheduleCamera]);

  // When filters change
  const handleFiltersChange = useCallback((newFilters: TreeFilters) => {
    setFilters(newFilters);

    const fr = filterEntries(entries, newFilters);
    const ff = filterEntries(fictionalEntries, newFilters);
    const hasAny = countActiveFilters(newFilters) > 0;

    if (hasAny) {
      const realPaths = fr && fr.length > 0 ? collectAllPaths(fr) : new Set<string>();
      const fictPaths = ff && ff.length > 0 ? collectAllFictionalPaths(ff) : new Set<string>();
      setExpandedSet(new Set([...realPaths, ...fictPaths]));
    }

    flashMapRef.current.clear();
    setFlashTick(t => t + 1);

    scheduleCameraFit(true, null);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    if (hasAny) {
      const capturedReal = fr || [];
      const capturedFict = ff || [];
      flashTimerRef.current = setTimeout(() => {
        const now = performance.now();
        flashMapRef.current.clear();
        for (const e of capturedReal) {
          const path = e.taxon_path;
          if (path) flashMapRef.current.set(e.user_id + '\0' + path, now);
        }
        for (const e of capturedFict) {
          const path = e.fictional_path;
          if (path) flashMapRef.current.set(e.user_id + '\0' + path, now);
        }
        setFlashTick(t => t + 1);
      }, 1100);
    }
  }, [entries, fictionalEntries, scheduleCameraFit]);

  const handleLiveFilterToggle = useCallback(() => {
    setLiveFilterActive(prev => {
      const next = !prev;
      if (next) {
        const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
        const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
        const realPaths = liveReal.length > 0 ? collectAllPaths(liveReal) : new Set<string>();
        const fictPaths = liveFict.length > 0 ? collectAllFictionalPaths(liveFict) : new Set<string>();
        setExpandedSet(new Set([...realPaths, ...fictPaths]));
        scheduleCameraFit(true, null);
      }
      return next;
    });
  }, [filteredEntries, filteredFictionalEntries, liveUserIds, scheduleCameraFit]);

  // When live filter is active and liveUserIds changes
  useEffect(() => {
    if (!liveFilterActive || !liveUserIds || liveUserIds.size === 0) return;
    const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
    const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
    const realPaths = liveReal.length > 0 ? collectAllPaths(liveReal) : new Set<string>();
    const fictPaths = liveFict.length > 0 ? collectAllFictionalPaths(liveFict) : new Set<string>();
    setExpandedSet(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const p of realPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      for (const p of fictPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [liveFilterActive, liveUserIds, filteredEntries, filteredFictionalEntries]);

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
  }, [traceBackTick, closeVtuberIds, focusedUserId, entries, fictionalEntries, activeFocusedIsFictional, scheduleCameraFit]);

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

  // Node animation
  const { positionMap, isAnimating } = useNodeAnimation(nodes);

  // Interaction
  const { hoveredNode, hoveredBadgeNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes, maxCount);

  // Image preloader
  const allEntriesForImages = useMemo(() =>
    [...(entries || []), ...(fictionalEntries || [])], [entries, fictionalEntries]);
  const imageCacheRef = useImagePreloader(allEntriesForImages);

  // Star field
  useEffect(() => {
    starFieldRef.current = createStarField(2000, 2000);
  }, []);

  // Fit view on first layout
  useEffect(() => {
    if (initialFitDone.current || !bounds || nodes.length === 0) return;
    initialFitDone.current = true;

    setTimeout(() => {
      if (currentUser) {
        const userEntry = entries?.find(e => e.user_id === currentUser.id)
          || fictionalEntries?.find(e => e.user_id === currentUser.id);
        if (userEntry) {
          const userPathKey = entryToVtuberPathKey(userEntry);
          const userNode = nodes.find(n => n.data._pathKey === userPathKey);
          if (userNode) {
            panToWithInsets(userNode.x, userNode.y, 0.8);
          } else {
            canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
          }
        } else {
          canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
        }
      } else {
        canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [bounds, nodes, currentUser, entries, fictionalEntries]);

  // Toggle expand/collapse
  const toggleActionRef = useRef<'expand' | 'collapse' | null>(null);
  const handleToggle = useCallback((pathKey: string) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        toggleActionRef.current = 'collapse';
        for (const key of prev) {
          if (key.startsWith(pathKey + '|') || key === pathKey) {
            next.delete(key);
          }
        }
        setExpandedBudgetGroups(bgPrev => {
          const bgNext = new Set(bgPrev);
          let changed = false;
          for (const key of bgPrev) {
            if (key.startsWith(pathKey)) {
              bgNext.delete(key);
              changed = true;
            }
          }
          return changed ? bgNext : bgPrev;
        });
      } else {
        toggleActionRef.current = 'expand';
        next.add(pathKey);
        const treeRoot = pathKey.startsWith('__F__') ? fictionalRootData : rootData;
        if (treeRoot) {
          const foundNode = findNode(treeRoot, pathKey);
          if (foundNode) autoExpandPaths(foundNode, next);
        }
      }
      return next;
    });

    scheduleCamera(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      if (toggleActionRef.current === 'expand') {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let count = 0;
        for (const n of currentNodes) {
          const pk = n.data._pathKey || '';
          const isMatch = pathKey === ''
            ? !pk.startsWith('__F__')
            : (pk === pathKey || pk.startsWith(pathKey + '|'));
          if (!isMatch) continue;
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
          count++;
        }
        if (count > 0) {
          canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
        }
      } else {
        const targetNode = currentNodes.find(n => n.data._pathKey === pathKey);
        if (targetNode) {
          panToWithInsets(targetNode.x, targetNode.y);
        }
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [rootData, fictionalRootData, scheduleCamera]);

  // Expand all / collapse all — scoped to activeTree
  const handleExpandAll = useCallback((treeKey?: string) => {
    const target = treeKey || activeTree;
    const treePaths = target === 'real'
      ? (entries ? collectAllPaths(entries) : new Set<string>())
      : (fictionalEntries ? collectAllFictionalPaths(fictionalEntries) : new Set<string>());
    setExpandedSet(prev => {
      const next = new Set(prev);
      for (const p of treePaths) next.add(p);
      return next;
    });
    scheduleCameraFit(true, target as ActiveTree);
  }, [entries, fictionalEntries, activeTree, scheduleCameraFit]);

  const handleCollapseAll = useCallback((treeKey?: string) => {
    const target = treeKey || activeTree;
    setExpandedSet(prev => {
      const next = new Set<string>();
      for (const p of prev) {
        if (target === 'real') {
          if (p.startsWith('__F__')) next.add(p);
        } else {
          if (!p.startsWith('__F__')) next.add(p);
        }
      }
      return next;
    });
    scheduleCameraFit(true, target as ActiveTree);
  }, [activeTree, scheduleCameraFit]);

  const handleExpandBothTrees = useCallback(() => {
    const all = entries ? collectAllPaths(entries) : new Set<string>();
    if (fictionalEntries) {
      for (const p of collectAllFictionalPaths(fictionalEntries)) all.add(p);
    }
    setExpandedSet(all);
    scheduleCameraFit(true);
  }, [entries, fictionalEntries, scheduleCameraFit]);

  const handleFitReal = useCallback(() => {
    const realNodes = nodesRef.current?.filter(n => !(n.data._pathKey || '').startsWith('__F__'));
    if (!realNodes?.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of realNodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
  }, []);

  const handleFitFictional = useCallback(() => {
    const fictNodes = nodesRef.current?.filter(n => (n.data._pathKey || '').startsWith('__F__'));
    if (!fictNodes?.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of fictNodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
  }, []);

  const handleSelectTree = useCallback((tree: ActiveTree) => {
    setActiveTree(tree);
    if (tree === 'real') handleFitReal();
    else handleFitFictional();
  }, [handleFitReal, handleFitFictional]);

  const handleFitAll = useCallback(() => {
    const allN = nodesRef.current;
    if (!allN?.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of allN) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
  }, []);

  // Canvas click handler
  const onCanvasClick = useCallback((worldX: number, worldY: number) => {
    const hit = hitTestClick(worldX, worldY);
    if (!hit) return;

    setActiveTree((hit.data._pathKey || '').startsWith('__F__') ? 'fictional' : 'real');

    const bb = hit.data._budgetBadgeBounds;
    if (bb && worldX >= bb.x && worldX <= bb.x + bb.w && worldY >= bb.y && worldY <= bb.y + bb.h) {
      const groupKey = hit.data._budgetGroupKey;
      if (groupKey) {
        const wasExpanded = expandedBudgetGroups.has(groupKey);
        setExpandedBudgetGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupKey)) next.delete(groupKey);
          else next.add(groupKey);
          return next;
        });
        if (!wasExpanded) {
          const pathKey = hit.data._pathKey || '';
          const treeRoot = pathKey.startsWith('__F__') ? fictionalRootData : rootData;
          const parentNode = treeRoot ? findNode(treeRoot, pathKey) : null;
          if (parentNode) {
            setExpandedSet(prev => {
              const next = new Set(prev);
              for (const child of parentNode.children.values()) {
                if (!subtreeHasNormalUser(child)) {
                  next.add(child.pathKey);
                  autoExpandPathsUnfiltered(child, next);
                }
              }
              return next;
            });
          }
        }
      }
    } else if (hit.data._vtuber) {
      setSelectedVtuber(hit.data._entry ?? null);
      if (hit.data._userId === focusedUserId) {
        setFocusedEntryKey(entryToKey(hit.data._entry ?? null));
      }
    } else if (hit.data._pathKey != null) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle, focusedUserId, expandedBudgetGroups, rootData, fictionalRootData]);

  // Expand budget groups for a user
  const expandBudgetGroupsForUser = useCallback((userId: string) => {
    const allUserEntries = [...(entries || []), ...(fictionalEntries || [])].filter(e => e.user_id === userId);
    const hasHidden = allUserEntries.some(e => !e.is_live_primary && (e.trait_count || 0) >= 6);
    if (!hasHidden) return;

    setExpandedBudgetGroups(prev => {
      const next = new Set(prev);
      for (const ue of allUserEntries) {
        if (ue.is_live_primary) continue;
        const isFictional = !!ue.fictional_path;
        const parts = ue.taxon_path ? ue.taxon_path.split('|') : (ue.fictional_path ? ue.fictional_path.split('|') : []);
        if (parts.length > 0) {
          const parentPathKey = isFictional
            ? `__F__|${ue.fictional_path}`
            : parts.join('|');
          const breedKey = ue.breed_id ? `${parentPathKey}|__breed__${ue.breed_id}` : parentPathKey;
          next.add(`${breedKey}|__budget_group__`);
          for (let i = 1; i < parts.length; i++) {
            const ancestorKey = isFictional
              ? `__F__|${parts.slice(0, i).join('|')}`
              : parts.slice(0, i).join('|');
            next.add(`${ancestorKey}|__budget_group__`);
          }
        }
      }
      return next;
    });
  }, [entries, fictionalEntries]);

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

  const entryToPathKey = useCallback((entry: TreeEntry): string => {
    return entryToVtuberPathKey(entry);
  }, []);

  const entryToPathKeyRef = useRef(entryToPathKey);
  entryToPathKeyRef.current = entryToPathKey;

  // Locate: ensure paths expanded, then pan back
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

  // All entries for the selected vtuber
  const selectedVtuberEntries = useMemo(() => {
    if (!selectedVtuber) return [];
    const real = entries ? entries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    return [...real, ...fict];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVtuber?.user_id, entries, fictionalEntries]);

  // Switch entry from detail panel trait tabs
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

  // Listen for Navbar "refocus self" event
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
  }, [currentUser]);

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

  // Pan to focused species when user explicitly changes selection
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

  // Render state
  const activeFiltersForRender = useMemo(() => {
    if (!filters) return null;
    for (const key of Object.keys(filters) as Array<keyof TreeFilters>) {
      if (filters[key] && filters[key].size > 0) return filters;
    }
    return null;
  }, [filters]);

  const renderState = useMemo(() => ({
    hoveredNode,
    hoveredBadgeNode,
    imageCache: imageCacheRef.current,
    starField: starFieldRef.current,
    focusedUserId,
    closeVtuberIds,
    closeEdgePaths,
    edgeFlashStart: edgeFlashStartRef.current,
    positionMap,
    flashMap: flashMapRef.current,
    maxCount,
    activeFilters: activeFiltersForRender,
    sortKey,
    liveUserIds,
  // eslint-disable-next-line react-hooks/exhaustive-deps -- flashTick intentionally included
  }), [hoveredNode, hoveredBadgeNode, imageCacheRef, focusedUserId, closeVtuberIds, closeEdgePaths, positionMap, flashTick, maxCount, activeFiltersForRender, sortKey, liveUserIds]);

  const onRender = useCallback((ctx: CanvasRenderingContext2D, transform: { x: number; y: number; scale: number }, canvasSize: { width: number; height: number }) => {
    drawGraph(ctx, nodes, edges, transform, canvasSize, renderState);
  }, [nodes, edges, renderState]);

  // Animation loop
  const needsFastLoop = isAnimating || hasActiveFlash;
  const needsSlowLoop = !!focusedUserId || liveUserIds.size > 0;
  const SLOW_INTERVAL = 66;

  useEffect(() => {
    if (!needsFastLoop && !needsSlowLoop) return;

    let running = true;

    if (needsFastLoop) {
      const tick = (): void => {
        if (!running) return;
        canvasRef.current?.requestRender();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else {
      canvasRef.current?.requestRender();
      const id = setInterval(() => {
        if (!running) return;
        canvasRef.current?.requestRender();
      }, SLOW_INTERVAL);
      return () => { running = false; clearInterval(id); };
    }

    return () => { running = false; };
  }, [needsFastLoop, needsSlowLoop]);

  // Trigger re-render when hover changes + update cursor
  useEffect(() => {
    canvasRef.current?.requestRender();
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.style.cursor = (hoveredNode || hoveredBadgeNode) ? 'pointer' : 'grab';
    }
  }, [hoveredNode, hoveredBadgeNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setSelectedVtuber(null);
      } else if (e.key === 'Home') {
        handleFitAll();
      } else if (e.key === 'ArrowLeft' && focusedUserId && focusedEntries.length > 1) {
        handleFocusPrev();
      } else if (e.key === 'ArrowRight' && focusedUserId && focusedEntries.length > 1) {
        handleFocusNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedUserId, focusedEntries.length, handleFocusPrev, handleFocusNext, handleFitAll]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '1.1em',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <div style={{ marginTop: 16 }}>正在載入分類樹…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#f87171', fontSize: '1.1em',
      }}>
        載入失敗：{error}
      </div>
    );
  }

  const totalCount = (entries?.length || 0) + (fictionalEntries?.length || 0);
  const filteredCount = (finalEntries?.length || 0) + (finalFictionalEntries?.length || 0);

  return (
    <>
      <div style={{ position: 'absolute', inset: 0 }}>
        <GraphCanvas
          ref={canvasRef}
          onRender={onRender}
          onHover={handleHover}
          onClick={onCanvasClick}
        />
      </div>

      {/* 用途說明（右上角） */}
      {!isMobile && showDescription && (
        <div style={{
          position: 'absolute', right: 16, top: 60, zIndex: 50,
          background: 'rgba(8,13,21,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '8px 12px',
          maxWidth: 200,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              VTuber 生物分類系統
            </div>
            <button type="button" onClick={() => setShowDescription(false)}
              style={{
                background: 'none', border: 'none', padding: 0, margin: '-2px -4px 0 0',
                color: 'rgba(255,255,255,0.3)', fontSize: 16, lineHeight: 1,
                cursor: 'pointer', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >&times;</button>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.5 }}>
            將 VTuber 角色形象對應到生物分類學體系，以分類樹呈現角色之間的關聯。
          </div>
          <Link to="/about" style={{
            display: 'inline-block', marginTop: 8, padding: '3px 10px',
            fontSize: 10, color: 'rgba(255,255,255,0.5)', textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', transition: 'border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >關於本站</Link>
        </div>
      )}

      <div style={{ position: 'absolute', left: isMobile ? 8 : 16, ...(isMobile ? { right: 8 } : {}), top: isMobile ? 52 : 60, display: 'flex',
        flexDirection: 'row', alignItems: 'flex-start', gap: 8, zIndex: 50, pointerEvents: 'none' }}>
        <FloatingToolbar
          canvasRef={canvasRef}
          filteredCount={filteredCount}
          totalCount={totalCount}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onExpandBothTrees={handleExpandBothTrees}
          closeByRank={closeByRank}
          traceBack={traceBack}
          traceBackLevels={focusedUserId ? traceBackLevels : undefined}
          onTraceBackChange={focusedUserId ? handleTraceBackChange : undefined}
          depthLabels={depthLabels ?? undefined}
          activeTree={activeTree}
          onSelectTree={handleSelectTree}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onShuffle={handleShuffle}
          isShuffled={shuffleSeed != null}
          filters={filters}
          filterPanelOpen={filterPanelOpen}
          onFilterToggle={() => setFilterPanelOpen(p => !p)}
          liveCount={liveCount}
          liveFilterActive={liveFilterActive}
          onLiveFilterToggle={handleLiveFilterToggle}
          isMobile={isMobile}
          expanded={toolbarExpanded}
          onExpandedChange={setToolbarExpanded}
        />
        {filterPanelOpen && !isMobile && (
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            facets={facets}
            onClose={() => setFilterPanelOpen(false)}
            isMobile={false}
          />
        )}
      </div>

      {/* Mobile: FilterPanel as animated bottom sheet */}
      {isMobile && (
        <FilterPanel
          filters={filters}
          onFiltersChange={handleFiltersChange}
          facets={facets}
          onClose={() => setFilterPanelOpen(false)}
          isMobile
          open={filterPanelOpen}
        />
      )}

      {/* Empty filter result overlay */}
      {filteredCount === 0 && countActiveFilters(filters) > 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 40,
        }}>
          <div style={{
            background: 'rgba(8,13,21,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '24px 32px', textAlign: 'center', pointerEvents: 'auto',
            maxWidth: 300,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              沒有符合條件的結果
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
              請嘗試調整篩選條件或清除篩選
            </div>
            <button
              type="button"
              onClick={() => handleFiltersChange(emptyFilters())}
              style={{
                background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: 6, padding: '6px 16px', cursor: 'pointer',
                color: '#38bdf8', fontSize: 12, fontWeight: 500,
              }}
            >
              清除全部篩選
            </button>
          </div>
        </div>
      )}

      {focusedUserId && focusedEntries.length > 0 && (
        <FocusHUD
          focusedEntries={focusedEntries}
          speciesIndex={focusedSpeciesIdx}
          onPrev={handleFocusPrev}
          onNext={handleFocusNext}
          onLocate={handleLocateFocused}
          onJumpToSpecies={handleJumpToSpecies}
          isMobile={isMobile}
        />
      )}

      {selectedVtuber && (
        <VtuberDetailPanel
          entry={selectedVtuber}
          allEntries={selectedVtuberEntries.length > 1 ? selectedVtuberEntries : undefined}
          onClose={() => setSelectedVtuber(null)}
          onFocus={handleSetFocus}
          onSwitchEntry={handleSwitchEntry}
        />
      )}
    </>
  );
});

export default TaxonomyGraph;

const spinnerStyle: React.CSSProperties = {
  width: 32, height: 32,
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#38bdf8',
  borderRadius: '50%',
  animation: 'vtaxonSpin 0.8s linear infinite',
  margin: '0 auto',
};
