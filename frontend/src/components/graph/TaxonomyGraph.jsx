import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode, autoExpandPaths, autoExpandPathsUnfiltered, subtreeHasNormalUser, computeCloseVtubers, collectCloseVtuberPaths, computeCloseVtubersByRank, computeFictionalHighlightPaths, collectAllFictionalPaths, computeCloseFictionalVtubers, computeCloseFictionalVtubersByRank, collectCloseFictionalVtuberPaths, computeCloseEdgePaths, computeCloseFictionalEdgePaths, entryToVtuberPathKey } from '../../lib/treeUtils';
import GraphCanvas from './GraphCanvas';
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

function getDailyHash() {
  const dateStr = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (const c of dateStr) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

const TaxonomyGraph = forwardRef(function TaxonomyGraph({ currentUser, authLoading }, ref) {
  const canvasRef = useRef(null);
  const starFieldRef = useRef(null);
  const initialFitDone = useRef(false);
  const nodesRef = useRef([]);
  const cameraTimerRef = useRef(null);

  const [entries, setEntries] = useState(null);
  const [fictionalEntries, setFictionalEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [expandedBudgetGroups, setExpandedBudgetGroups] = useState(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState(null);

  // Focus Vtuber state
  const [focusedUserId, setFocusedUserId] = useState(null);
  const [focusedEntryKey, setFocusedEntryKey] = useState(null);

  // Trace back range (0 = same species, 1 = same genus, 2 = same family, 3 = same order max)
  const [traceBack, setTraceBack] = useState(2);

  // Active tree selector ('real' | 'fictional')
  const [activeTree, setActiveTree] = useState('real');

  // Sort state
  const [sortKey, setSortKey] = useState('active_first');
  const [sortOrder, setSortOrder] = useState('desc');
  const [shuffleSeed, setShuffleSeed] = useState(null);   // incrementing counter, not timestamp

  // Filter state
  const [filters, setFilters] = useState(() => emptyFilters());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const isMobile = useIsMobile();
  const { liveUserIds, livePrimaries } = useLiveStatus();

  // Camera insets: [padding, leftInset, rightInset, bottomInset, topInset]
  // Desktop: left toolbar ~200px wide; Mobile: top horizontal bar, bottom HUD drawer
  const cameraInsetsRef = useRef([80, 220, 100, 80, 100]);
  useEffect(() => {
    cameraInsetsRef.current = isMobile
      ? [40, 16, 16, 72, 60]
      : [80, 220, 100, 80, 100];
  }, [isMobile]);

  // Helper: panTo with current insets (skips padding, uses inset indices 1-4)
  const panToWithInsets = useCallback((x, y, scale) => {
    const [, l, r, b, t] = cameraInsetsRef.current;
    canvasRef.current?.panTo(x, y, scale, l, r, b, t);
  }, []);

  // Fetch tree data (real + fictional in parallel).
  // When refresh=true, bypasses backend cache to get fresh data.
  const fetchTreeData = useCallback(async ({ refresh = false } = {}) => {
    const qs = refresh ? '?refresh=1' : '';
    const [realData, fictData] = await Promise.all([
      api.getTaxonomyTree(qs).catch(() => ({ entries: [] })),
      api.getFictionalTree(qs).catch(() => ({ entries: [] })),
    ]);
    const e = realData.entries || [];
    const fe = fictData.entries || [];
    setEntries(e);
    setFictionalEntries(fe);
    return { entries: e, fictionalEntries: fe };
  }, []);

  // Expose refetch to parent — only updates entries, does NOT reset expandedSet
  useImperativeHandle(ref, () => ({
    refetch: () => fetchTreeData({ refresh: true }),
  }), [fetchTreeData]);

  // Initial load — wait for auth to resolve before fetching so we know
  // whether to expand the user's paths or use guest defaults (avoids
  // double-fetch and camera re-positioning race condition)
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    fetchTreeData()
      .then(({ entries: e, fictionalEntries: fe }) => {
        if (cancelled) return;

        // Default expand: logged-in users only expand own paths; guests expand to Phylum (depth=2)
        const defaultExpanded = currentUser
          ? new Set()
          : collectPathsToDepth(e, 2);
        // Fictional tree: no default expansion (only show origin-level orange nodes)

        // Also expand current user's paths (both trees)
        if (currentUser) {
          const userPaths = computeHighlightPaths(e, currentUser.id);
          for (const p of userPaths) defaultExpanded.add(p);
          if (fe.length > 0) {
            const fictUserPaths = computeFictionalHighlightPaths(fe, currentUser.id);
            for (const p of fictUserPaths) defaultExpanded.add(p);
          }
        }

        // autoExpandPaths (called via handleToggle) handles single-child chains on demand
        setExpandedSet(defaultExpanded);
      })
      .catch(err => {
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

  // Centralized camera scheduling — cancels any pending camera move before scheduling a new one
  const scheduleCamera = useCallback((fn, delay) => {
    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    cameraTimerRef.current = setTimeout(() => {
      cameraTimerRef.current = null;
      fn();
    }, delay);
  }, []);

  // Handle ?locate=userId from toast / directory page
  const [searchParams, setSearchParams] = useSearchParams();
  const locateId = searchParams.get('locate');

  useEffect(() => {
    if (!locateId) return;
    if (!entries || !fictionalEntries) return;

    // Clear URL parameter (won't re-trigger because locateId becomes null)
    setSearchParams({}, { replace: true });

    // Find the first entry for this user
    const entry = entries.find(e => e.user_id === locateId)
      || (fictionalEntries || []).find(e => e.user_id === locateId);
    if (!entry) return;

    // Focus the user (replicates handleSetFocus logic)
    setFocusedUserId(locateId);
    setFocusedEntryKey(
      entry.fictional_path
        ? 'F\0' + (entry.fictional_path || '') + '\0' + (entry.fictional_species_id || '')
        : (entry.taxon_path || '') + '\0' + (entry.breed_id || '')
    );

    // Expand paths
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], locateId);
      for (const p of userPaths) next.add(p);
      const fictPaths = computeFictionalHighlightPaths(fictionalEntries || [], locateId);
      for (const p of fictPaths) next.add(p);
      return next;
    });

    // Switch active tree if entry is fictional
    if (entry.fictional_path) {
      setActiveTree('fictional');
    }

    // Pan to node after layout settles
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

  // ── Live filter (layered on top of regular filters) ──
  // When live filter is active, dedup: each user appears at most once per tree,
  // at their chosen "live primary" trait node. Fallback: first (earliest) entry.
  const finalEntries = useMemo(() => {
    if (!liveFilterActive) return filteredEntries;
    const liveEntries = filteredEntries.filter(e => liveUserIds.has(e.user_id));
    // Dedup per user: keep only the primary trait entry
    const seen = new Set();
    // First pass: collect entries matching user's primary trait
    const primary = [];
    const fallback = [];
    for (const e of liveEntries) {
      const p = livePrimaries.get(e.user_id);
      if (p?.real && e.trait_id === p.real) {
        if (!seen.has(e.user_id)) {
          seen.add(e.user_id);
          primary.push(e);
        }
      } else {
        fallback.push(e);
      }
    }
    // Second pass: for users without a matched primary, keep first entry
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
    const seen = new Set();
    const primary = [];
    const fallback = [];
    for (const e of liveEntries) {
      const p = livePrimaries.get(e.user_id);
      if (p?.fictional && e.trait_id === p.fictional) {
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

  // Live count from raw entries (not affected by other filters)
  const liveCount = useMemo(() => {
    if (!entries || !liveUserIds || liveUserIds.size === 0) return 0;
    const seen = new Set();
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

  // Facets from raw (unfiltered) entries — combined and deduplicated
  const facets = useMemo(() => {
    const all = [...(entries || []), ...(fictionalEntries || [])];
    return computeFacets(all);
  }, [entries, fictionalEntries]);

  // ── Sort config per tree (shuffle only affects activeTree) ──
  const baseSortConfig = useMemo(() => (
    { key: sortKey, order: sortOrder, shuffleSeed: null, liveUserIds }
  ), [sortKey, sortOrder, liveUserIds]);

  const shuffleSortConfig = useMemo(() => (
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
  const handleSortChange = useCallback((key, order) => {
    setSortKey(key);
    setSortOrder(order);
    setShuffleSeed(null); // clear shuffle when selecting a sort
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffleSeed(s => s != null ? null : getDailyHash());
    // Pan so the root sits near the top (~1/5 of viewport height)
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


  // d3 layout (before traceBack computations so focusedEntries can sort by X)
  const activeFilterCount = countActiveFilters(filters);
  // Sort badge text is wider than filter badges (e.g. "1年2個月"), count as 2 units
  const hasSortBadge = (sortKey === 'debut_date' || sortKey === 'created_at' || sortKey === 'active_first') ? 2 : 0;
  const totalBadgeCount = activeFilterCount + hasSortBadge;
  const { nodes, edges, bounds, rootData, fictionalRootData, maxCount } = useTreeLayout(
    finalEntries, finalFictionalEntries, expandedSet, currentUser?.id, realSortConfig, fictSortConfig, totalBadgeCount, expandedBudgetGroups,
  );
  nodesRef.current = nodes;

  // Focused entries sorted by tree X position
  const focusedEntries = useMemo(() => {
    if (rawFocusedEntries.length <= 1 || !nodes?.length) return rawFocusedEntries;
    const xMap = new Map();
    for (const n of nodes) {
      if (n.data._vtuber && n.data._userId === focusedUserId)
        xMap.set(n.data._pathKey, n.x);
    }
    if (xMap.size === 0) return rawFocusedEntries;
    return [...rawFocusedEntries].sort((a, b) =>
      (xMap.get(entryToVtuberPathKey(a)) ?? 0) - (xMap.get(entryToVtuberPathKey(b)) ?? 0)
    );
  }, [rawFocusedEntries, nodes, focusedUserId]);

  // Keep a ref to latest focusedEntries so delayed callbacks avoid stale closures
  const focusedEntriesRef = useRef(focusedEntries);
  focusedEntriesRef.current = focusedEntries;

  // Derive index from stable entry key — survives focusedEntries re-sorting
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

  // Active focused entry — the single species currently shown in HUD
  const activeFocusedEntries = useMemo(() => {
    const entry = focusedEntries[focusedSpeciesIdx] || focusedEntries[0];
    return entry ? [entry] : [];
  }, [focusedEntries, focusedSpeciesIdx]);

  // Whether active focused entry is fictional (no traceBack for fictional)
  const activeFocusedIsFictional = activeFocusedEntries.length > 0 && !!activeFocusedEntries[0].fictional_path;

  // Auto-sync activeTree when focused entry's tree changes
  useEffect(() => {
    if (activeFocusedEntries.length === 0) return;
    setActiveTree(activeFocusedIsFictional ? 'fictional' : 'real');
  }, [activeFocusedIsFictional, activeFocusedEntries.length]);

  // Max trace back based on active entry's path depth
  const maxTraceBack = useMemo(() => {
    if (!activeFocusedEntries.length) return 0;
    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      return Math.max(0, segs - 1 - 0); // F_ORIGIN_IDX = 0
    }
    const segs = (activeFocusedEntries[0].taxon_path || '').split('|').length;
    return Math.max(0, segs - 1 - 2); // CLASS_IDX = 2
  }, [activeFocusedEntries, activeFocusedIsFictional]);

  // Auto-clamp when maxTraceBack changes
  useEffect(() => {
    if (traceBack > maxTraceBack) setTraceBack(maxTraceBack);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only clamp when maxTraceBack changes, not when traceBack changes
  }, [maxTraceBack]);

  // Trace back levels for UI
  const traceBackLevels = useMemo(() => {
    if (!activeFocusedEntries.length) return [];

    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      // 4-segment (origin|sub_origin|type|name): 同來源(3) → 同體系(2) → 同類型(1) → 同種(0)
      // 3-segment (origin|sub_origin|name):      同來源(2) → 同體系(1) → 同種(0)
      // 2-segment (origin|name):                 同來源(1) → 同種(0)
      const levels = [];
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

  // Depth labels for FloatingToolbar (maps depth → label)
  const depthLabels = useMemo(() => {
    if (!activeFocusedEntries.length) return null;
    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      if (segs >= 4) return { 4: '同種', 3: '同類型', 2: '同體系', 1: '同來源' };
      if (segs === 3) return { 3: '同種', 2: '同體系', 1: '同來源' };
      return { 2: '同種', 1: '同來源' };
    }
    return { 8: '同亞種', 7: '同種', 6: '同屬', 5: '同科', 4: '同目', 3: '同綱', 2: '同門', 1: '同界' };
  }, [activeFocusedEntries, activeFocusedIsFictional]);

  // Close (related) vtuber IDs — scoped to active entry only
  const closeVtuberIds = useMemo(() => {
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubers(activeFocusedEntries, fictionalEntries, traceBack);
    }
    return computeCloseVtubers(activeFocusedEntries, entries, traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  // Close vtubers by rank stats — scoped to active entry only
  const closeByRank = useMemo(() => {
    if (!focusedUserId) return null;
    if (activeFocusedIsFictional) {
      return computeCloseFictionalVtubersByRank(activeFocusedEntries, fictionalEntries, traceBack);
    }
    return computeCloseVtubersByRank(activeFocusedEntries, entries, traceBack);
  }, [activeFocusedEntries, entries, fictionalEntries, focusedUserId, traceBack, activeFocusedIsFictional]);

  // Close edge paths for highlight rendering
  const closeEdgePaths = useMemo(() => {
    if (!focusedUserId) return new Set();
    if (activeFocusedIsFictional)
      return computeCloseFictionalEdgePaths(activeFocusedEntries, fictionalEntries, closeVtuberIds, traceBack);
    return computeCloseEdgePaths(activeFocusedEntries, entries, closeVtuberIds, traceBack);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

  // ── TraceBack change: auto-expand + flash ALL close nodes + camera fit ──
  const [traceBackTick, setTraceBackTick] = useState(0);
  const prevTickRef = useRef(0);
  const flashMapRef = useRef(new Map());
  const edgeFlashStartRef = useRef(null);
  const flashTimerRef = useRef(null);
  const [flashTick, setFlashTick] = useState(0);
  const FLASH_DURATION = 2800;
  const MAX_FLASH_ENTRIES = 500;

  // Cleanup all pending timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(cameraTimerRef.current);
      clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Wrapper: always increments tick so re-clicking the same level triggers effects
  const handleTraceBackChange = useCallback((value) => {
    setTraceBack(value);
    setTraceBackTick(t => t + 1);
  }, []);

  // Shared: schedule camera fit after layout updates (300ms delay).
  // fitAll=true → fit to entire tree; false → try focused+close first, fallback to all.
  // scopeTree: 'real' | 'fictional' | null — filter nodes for bounds calculation.
  const scheduleCameraFit = useCallback((fitAll = false, scopeTree = null) => {
    scheduleCamera(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let count = 0;

      // Scope filter helper
      const inScope = (n) => {
        if (!scopeTree) return true;
        const isFict = n.data._pathKey.startsWith('__F__');
        return scopeTree === 'fictional' ? isFict : !isFict;
      };

      // Try active focused entry + close vtuber nodes + shared ancestor edges (unless fitAll)
      if (!fitAll && focusedUserId && closeVtuberIds.size > 0) {
        // Build pathKey for the ACTIVE focused entry only (not all user species)
        const activeEntry = activeFocusedEntries[0];
        const activePathKey = activeEntry ? entryToVtuberPathKey(activeEntry) : null;

        const edgePaths = closeEdgePaths;
        for (const n of currentNodes) {
          if (!inScope(n)) continue;
          const pk = n.data._pathKey;
          // Include: focused vtuber, close vtubers, AND shared ancestor nodes on edge paths
          const isVtuberMatch = n.data._vtuber && (
            (activePathKey && pk === activePathKey) ||
            closeVtuberIds.get(n.data._userId)?.has(n.data._entry?.fictional_path || n.data._entry?.taxon_path)
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

      // No close vtubers but focused — panTo focused node instead of fitting whole tree
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

      // fitAll or fallback: all visible nodes (scoped)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable (empty deps useCallback)
  }, [focusedUserId, closeVtuberIds, closeEdgePaths, activeFocusedEntries, scheduleCamera]);

  // When filters change, auto-expand all paths that contain matching entries + fit camera + flash
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);

    const fr = filterEntries(entries, newFilters);
    const ff = filterEntries(fictionalEntries, newFilters);
    const hasAny = countActiveFilters(newFilters) > 0;

    if (hasAny) {
      const realPaths = fr && fr.length > 0 ? collectAllPaths(fr) : new Set();
      const fictPaths = ff && ff.length > 0 ? collectAllFictionalPaths(ff) : new Set();
      setExpandedSet(new Set([...realPaths, ...fictPaths]));
    }

    // Clear previous flash
    flashMapRef.current.clear();
    setFlashTick(t => t + 1);

    scheduleCameraFit(true, null);

    // Flash filtered nodes after camera settles (nodes only, no edge flash)
    clearTimeout(flashTimerRef.current);
    if (hasAny) {
      const capturedReal = fr || [];
      const capturedFict = ff || [];
      flashTimerRef.current = setTimeout(() => {
        const now = performance.now();
        flashMapRef.current.clear();
        // Do NOT set edgeFlashStartRef — edges should not flash for filters
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
        // Expand paths for all live entries so their nodes are visible
        const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
        const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
        const realPaths = liveReal.length > 0 ? collectAllPaths(liveReal) : new Set();
        const fictPaths = liveFict.length > 0 ? collectAllFictionalPaths(liveFict) : new Set();
        setExpandedSet(new Set([...realPaths, ...fictPaths]));
        scheduleCameraFit(true, null);
      }
      return next;
    });
  }, [filteredEntries, filteredFictionalEntries, liveUserIds, scheduleCameraFit]);

  // When live filter is active and liveUserIds changes (new streamer goes live),
  // expand paths for newly-live entries so their leaf nodes are visible
  useEffect(() => {
    if (!liveFilterActive || !liveUserIds || liveUserIds.size === 0) return;
    const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
    const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
    const realPaths = liveReal.length > 0 ? collectAllPaths(liveReal) : new Set();
    const fictPaths = liveFict.length > 0 ? collectAllFictionalPaths(liveFict) : new Set();
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
    if (traceBackTick === 0) return; // skip initial render

    if (!focusedUserId) return;

    // Expand focused user's own paths + close vtuber paths
    setExpandedSet(prev => {
      const next = new Set(prev);
      let changed = false;

      if (activeFocusedIsFictional && fictionalEntries) {
        const userPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
        for (const p of userPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
        if (closeVtuberIds.size > 0) {
          const closePaths = collectCloseFictionalVtuberPaths(closeVtuberIds, fictionalEntries);
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
          const closePaths = collectCloseVtuberPaths(closeVtuberIds, entries);
          for (const p of closePaths) {
            if (!next.has(p)) { next.add(p); changed = true; }
          }
        }
      }
      return changed ? next : prev;
    });

    // Clear previous flash immediately
    flashMapRef.current.clear();
    setFlashTick(t => t + 1);

    // Camera fit first (300ms layout wait + 800ms d3 transition)
    scheduleCameraFit();

    // Flash AFTER camera settles
    clearTimeout(flashTimerRef.current);
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
    // Hard cap: evict oldest entries if map grows too large
    if (flashMapRef.current.size > MAX_FLASH_ENTRIES) {
      const iter = flashMapRef.current.keys();
      const excess = flashMapRef.current.size - MAX_FLASH_ENTRIES;
      for (let i = 0; i < excess; i++) {
        flashMapRef.current.delete(iter.next().value);
      }
    }
    return flashMapRef.current.size > 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- flashTick is intentionally used to trigger re-computation on tick
  }, [flashTick]);

  // Node animation
  const { positionMap, isAnimating } = useNodeAnimation(nodes);

  // Interaction
  const { hoveredNode, hoveredBadgeNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes, maxCount);

  // Image preloader (all entries from both trees)
  const allEntriesForImages = useMemo(() =>
    [...(entries || []), ...(fictionalEntries || [])], [entries, fictionalEntries]);
  const imageCacheRef = useImagePreloader(allEntriesForImages);

  // Star field (generate once)
  useEffect(() => {
    starFieldRef.current = createStarField(2000, 2000);
  }, []);

  // Fit view on first layout
  useEffect(() => {
    if (initialFitDone.current || !bounds || nodes.length === 0) return;
    initialFitDone.current = true;

    setTimeout(() => {
      if (currentUser) {
        // Logged-in: go directly to user's node (tree only expands user's paths)
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
          // User has no entries — fit the whole visible tree
          canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
        }
      } else {
        // Guest: fit the whole tree with adaptive scale
        canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable (empty deps useCallback)
  }, [bounds, nodes, currentUser, entries, fictionalEntries]);

  // Toggle expand/collapse
  const toggleActionRef = useRef(null);
  const handleToggle = useCallback((pathKey) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        toggleActionRef.current = 'collapse';
        // Collapse — also collapse all descendants
        for (const key of prev) {
          if (key.startsWith(pathKey + '|') || key === pathKey) {
            next.delete(key);
          }
        }
        // Reset budget groups under this node
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
        // Auto-expand: recursively expand children when ≤ 5 at each level
        const treeRoot = pathKey.startsWith('__F__') ? fictionalRootData : rootData;
        if (treeRoot) {
          autoExpandPaths(findNode(treeRoot, pathKey), next);
        }
      }
      return next;
    });

    // Camera follow after layout settles
    scheduleCamera(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      if (toggleActionRef.current === 'expand') {
        // Fit bounds to include the clicked node + all expanded descendants
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let count = 0;
        for (const n of currentNodes) {
          const pk = n.data._pathKey;
          // Match the node itself + all descendants
          const isMatch = pathKey === ''
            ? !pk.startsWith('__F__')                          // root '' → all real nodes
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
        // Collapse — pan to the node
        const targetNode = currentNodes.find(n => n.data._pathKey === pathKey);
        if (targetNode) {
          panToWithInsets(targetNode.x, targetNode.y);
        }
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable (empty deps useCallback)
  }, [rootData, fictionalRootData, scheduleCamera]);

  // Expand all / collapse all — scoped to activeTree
  const handleExpandAll = useCallback((treeKey) => {
    const target = treeKey || activeTree;
    const treePaths = target === 'real'
      ? (entries ? collectAllPaths(entries) : new Set())
      : (fictionalEntries ? collectAllFictionalPaths(fictionalEntries) : new Set());
    setExpandedSet(prev => {
      const next = new Set(prev);
      for (const p of treePaths) next.add(p);
      return next;
    });
    scheduleCameraFit(true, target);
  }, [entries, fictionalEntries, activeTree, scheduleCameraFit]);

  const handleCollapseAll = useCallback((treeKey) => {
    const target = treeKey || activeTree;
    setExpandedSet(prev => {
      const next = new Set();
      for (const p of prev) {
        if (target === 'real') {
          if (p.startsWith('__F__')) next.add(p);
        } else {
          if (!p.startsWith('__F__')) next.add(p);
        }
      }
      return next;
    });
    scheduleCameraFit(true, target);
  }, [activeTree, scheduleCameraFit]);

  // Expand both trees completely
  const handleExpandBothTrees = useCallback(() => {
    const all = entries ? collectAllPaths(entries) : new Set();
    if (fictionalEntries) {
      for (const p of collectAllFictionalPaths(fictionalEntries)) all.add(p);
    }
    setExpandedSet(all);
    scheduleCameraFit(true); // fit all, no scope
  }, [entries, fictionalEntries, scheduleCameraFit]);

  // Fit to real tree only
  const handleFitReal = useCallback(() => {
    const realNodes = nodesRef.current?.filter(n => !n.data._pathKey.startsWith('__F__'));
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

  // Fit to fictional tree only
  const handleFitFictional = useCallback(() => {
    const fictNodes = nodesRef.current?.filter(n => n.data._pathKey.startsWith('__F__'));
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

  // Select tree: set activeTree + camera fit
  const handleSelectTree = useCallback((tree) => {
    setActiveTree(tree);
    if (tree === 'real') handleFitReal();
    else handleFitFictional();
  }, [handleFitReal, handleFitFictional]);

  // Fit to all nodes (both trees)
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
  const onCanvasClick = useCallback((worldX, worldY) => {
    const hit = hitTestClick(worldX, worldY);
    if (!hit) return;

    // Sync tree indicator to the clicked node's tree
    setActiveTree(hit.data._pathKey?.startsWith('__F__') ? 'fictional' : 'real');

    // Check if click landed on a budget badge ("+N 位")
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
        // When expanding, auto-expand collapsed hidden-only branches
        if (!wasExpanded) {
          const pathKey = hit.data._pathKey;
          const treeRoot = pathKey?.startsWith('__F__') ? fictionalRootData : rootData;
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
      setSelectedVtuber(hit.data._entry);
      // If clicking own species node, sync HUD to that species
      if (hit.data._userId === focusedUserId) {
        setFocusedEntryKey(entryToKey(hit.data._entry));
      }
    } else if (hit.data._pathKey != null) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle, focusedUserId, expandedBudgetGroups, rootData, fictionalRootData]);

  // Focus navigation — set entry key so index is derived stably
  const entryToKey = (e) => {
    if (!e) return null;
    if (e.fictional_path) return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '');
    return (e.taxon_path || '') + '\0' + (e.breed_id || '');
  };

  // Expand budget groups for a user so their hidden nodes become visible.
  // Also expands ancestor budget groups along the path so collapsed branches are revealed.
  const expandBudgetGroupsForUser = useCallback((userId) => {
    const allUserEntries = [...(entries || []), ...(fictionalEntries || [])].filter(e => e.user_id === userId);
    // Only expand if user actually has hidden-tier entries
    const hasHidden = allUserEntries.some(e => !e.is_live_primary && (e.trait_count || 0) >= 6);
    if (!hasHidden) return;

    setExpandedBudgetGroups(prev => {
      const next = new Set(prev);
      for (const ue of allUserEntries) {
        if (ue.is_live_primary) continue;
        const isFictional = !!ue.fictional_path;
        const parts = ue.taxon_path ? ue.taxon_path.split('|') : (ue.fictional_path ? ue.fictional_path.split('|') : []);
        if (parts.length > 0) {
          // Expand budget group at the leaf node (where vtuber sits)
          const parentPathKey = isFictional
            ? `__F__|${ue.fictional_path}`
            : parts.join('|');
          const breedKey = ue.breed_id ? `${parentPathKey}|__breed__${ue.breed_id}` : parentPathKey;
          next.add(`${breedKey}|__budget_group__`);
          // Also expand budget groups at every ancestor so collapsed branches are revealed
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

  const handleJumpToSpecies = useCallback((index) => {
    const entry = focusedEntries[index];
    if (entry) setFocusedEntryKey(entryToKey(entry));
  }, [focusedEntries]);

  // Build a vtuber pathKey from an entry (real or fictional)
  const entryToPathKey = useCallback((entry) => {
    return entryToVtuberPathKey(entry);
  }, []);

  const entryToPathKeyRef = useRef(entryToPathKey);
  entryToPathKeyRef.current = entryToPathKey;

  // Locate: ensure paths expanded, then pan back to focused user's node
  const handleLocateFocused = useCallback(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Ensure focused user's paths are expanded + auto-expand siblings
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      // Auto-expand sibling nodes along the path (≤5 rule)
      if (rootData) {
        const sizeBefore = next.size;
        for (const p of userPaths) {
          const node = findNode(rootData, p);
          if (node) autoExpandPaths(node, next);
        }
        if (next.size !== sizeBefore) changed = true;
      }
      let fictPaths;
      if (fictionalEntries) {
        fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
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

    // Auto-expand budget groups containing the focused user
    expandBudgetGroupsForUser(focusedUserId);

    // Delay to let layout update with expanded paths, then pan
    scheduleCamera(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets/expandBudgetGroupsForUser are stable or intentionally omitted to avoid cascade rebuilds
  }, [focusedEntries, focusedSpeciesIdx, entries, fictionalEntries, focusedUserId, entryToPathKey, scheduleCamera, rootData, fictionalRootData]);

  const handleSetFocus = useCallback((entry) => {
    const userId = entry.user_id;
    setFocusedUserId(userId);
    setFocusedEntryKey(entryToKey(entry));

    // Expand budget groups so hidden nodes become visible
    expandBudgetGroupsForUser(userId);

    // Ensure paths are expanded so the node exists in the layout
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

    // Pan camera to the entry's node after layout update
    scheduleCamera(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets/expandBudgetGroupsForUser are stable or intentionally omitted
  }, [entries, fictionalEntries, entryToPathKey, scheduleCamera]);

  // All entries for the selected vtuber (for trait tabs in detail panel, both real + fictional)
  const selectedVtuberEntries = useMemo(() => {
    if (!selectedVtuber) return [];
    const real = entries ? entries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    return [...real, ...fict];
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on user_id, not the full object
  }, [selectedVtuber?.user_id, entries, fictionalEntries]);

  // Switch entry from detail panel trait tabs — update panel + focus + camera
  const handleSwitchEntry = useCallback((newEntry) => {
    setSelectedVtuber(newEntry);
    setFocusedUserId(newEntry.user_id);
    setFocusedEntryKey(entryToKey(newEntry));

    // Expand budget groups so hidden nodes become visible
    expandBudgetGroupsForUser(newEntry.user_id);

    // Ensure paths are expanded so the node exists in the layout
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

    // Pan camera to the new entry's node after layout update
    scheduleCamera(() => {
      const pathKey = entryToPathKey(newEntry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets/expandBudgetGroupsForUser are stable or intentionally omitted
  }, [entries, fictionalEntries, entryToPathKey, scheduleCamera]);

  // Listen for Navbar "refocus self" event
  const [refocusTick, setRefocusTick] = useState(0);
  useEffect(() => {
    if (!currentUser) return;
    const handler = () => {
      setFocusedUserId(currentUser.id);
      setFocusedEntryKey(null);
      setRefocusTick(t => t + 1);
    };
    window.addEventListener('vtaxon:refocus-self', handler);
    return () => window.removeEventListener('vtaxon:refocus-self', handler);
  }, [currentUser]);

  // Pan to first species when refocus-self fires
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable; uses refs for latest state
  }, [refocusTick, scheduleCamera]);

  // Pan to focused species when user explicitly changes selection
  useEffect(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Expand budget groups so hidden nodes become visible
    if (focusedUserId) expandBudgetGroupsForUser(focusedUserId);

    // Ensure the path is expanded
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    // Delay to let layout update with expanded paths, then pan
    scheduleCamera(() => {
      const latestEntry = focusedEntriesRef.current[focusedSpeciesIdx] || focusedEntriesRef.current[0];
      if (!latestEntry) return;
      const pathKey = entryToPathKeyRef.current(latestEntry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- uses refs for entries/focusedEntries; panToWithInsets/expandBudgetGroupsForUser intentionally omitted
  }, [focusedEntryKey, focusedUserId, focusedSpeciesIdx, scheduleCamera]);

  // Render state
  // Only pass activeFilters when there are active selections
  const activeFiltersForRender = useMemo(() => {
    if (!filters) return null;
    for (const key of Object.keys(filters)) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- flashTick intentionally included to trigger re-memo when flash state changes
  }), [hoveredNode, hoveredBadgeNode, imageCacheRef, focusedUserId, closeVtuberIds, closeEdgePaths, positionMap, flashTick, maxCount, activeFiltersForRender, sortKey, liveUserIds]);

  const onRender = useCallback((ctx, transform, canvasSize) => {
    drawGraph(ctx, nodes, edges, transform, canvasSize, renderState);
  }, [nodes, edges, renderState]);

  // Animation loop — 60fps for time-critical animations, 15fps for steady-state effects
  const needsFastLoop = isAnimating || hasActiveFlash; // time-limited, needs 60fps
  const needsSlowLoop = !!focusedUserId || liveUserIds.size > 0; // steady-state pulse, 15fps suffices
  const SLOW_INTERVAL = 66; // ~15fps

  useEffect(() => {
    if (!needsFastLoop && !needsSlowLoop) return;

    let running = true;

    if (needsFastLoop) {
      // 60fps RAF loop for smooth animations
      const tick = () => {
        if (!running) return;
        canvasRef.current?.requestRender();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else {
      // ~15fps interval for focus pulse / live indicators
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
    const handler = (e) => {
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

      {/* 用途說明（右上角，滿足 Google OAuth 審核） */}
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
          traceBackLevels={focusedUserId ? traceBackLevels : null}
          onTraceBackChange={focusedUserId ? handleTraceBackChange : null}
          depthLabels={depthLabels}
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
          />
        )}
      </div>

      {/* Mobile: FilterPanel as animated bottom sheet (always mounted) */}
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

const spinnerStyle = {
  width: 32, height: 32,
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#38bdf8',
  borderRadius: '50%',
  animation: 'vtaxonSpin 0.8s linear infinite',
  margin: '0 auto',
};
