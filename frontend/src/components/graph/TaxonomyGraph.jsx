import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode, autoExpandPaths, computeCloseVtubers, collectCloseVtuberPaths, computeCloseVtubersByRank, collectFictionalPathsToDepth, computeFictionalHighlightPaths, collectAllFictionalPaths, computeCloseFictionalVtubers, computeCloseFictionalVtubersByRank, collectCloseFictionalVtuberPaths, computeCloseEdgePaths, computeCloseFictionalEdgePaths, buildBreedPaths, entryToVtuberPathKey } from '../../lib/treeUtils';
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

const TaxonomyGraph = forwardRef(function TaxonomyGraph({ currentUser }, ref) {
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
  const [selectedVtuber, setSelectedVtuber] = useState(null);

  // Focus Vtuber state
  const [focusedUserId, setFocusedUserId] = useState(null);
  const [focusedEntryKey, setFocusedEntryKey] = useState(null);

  // Trace back range (0 = same species, 1 = same genus, 2 = same family, 3 = same order max)
  const [traceBack, setTraceBack] = useState(2);

  // Active tree selector ('real' | 'fictional')
  const [activeTree, setActiveTree] = useState('real');

  // Sort state
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('asc');
  const [shuffleSeed, setShuffleSeed] = useState(null);   // incrementing counter, not timestamp

  // Filter state
  const [filters, setFilters] = useState(() => emptyFilters());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const isMobile = useIsMobile();

  // Precompute which taxon_paths have breed entries (for __breed__unspecified logic)
  const breedPaths = useMemo(() => buildBreedPaths(entries || []), [entries]);

  // Camera insets: [padding, leftInset, rightInset, bottomInset, topInset]
  // Desktop: left toolbar ~200px wide; Mobile: mini bar ~50px, HUD at bottom ~60px
  const cameraInsetsRef = useRef([80, 220, 100, 80, 100]);
  useEffect(() => {
    cameraInsetsRef.current = isMobile
      ? [40, 56, 16, 70, 56]
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

  // Initial load
  useEffect(() => {
    let cancelled = false;
    fetchTreeData()
      .then(({ entries: e, fictionalEntries: fe }) => {
        if (cancelled) return;

        // Default expand: real depth=4, fictional depth=2
        const defaultExpanded = collectPathsToDepth(e, 4);
        if (fe.length > 0) {
          const fictExpanded = collectFictionalPathsToDepth(fe, 2);
          for (const p of fictExpanded) defaultExpanded.add(p);
        }

        // Also expand current user's paths (both trees)
        if (currentUser) {
          const userPaths = computeHighlightPaths(e, currentUser.id, buildBreedPaths(e));
          for (const p of userPaths) defaultExpanded.add(p);
          if (fe.length > 0) {
            const fictUserPaths = computeFictionalHighlightPaths(fe, currentUser.id);
            for (const p of fictUserPaths) defaultExpanded.add(p);
          }
        }

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
  }, [currentUser?.id, fetchTreeData]);

  // Auto-focus logged-in user
  useEffect(() => {
    if (currentUser && !focusedUserId) setFocusedUserId(currentUser.id);
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
      const userPaths = computeHighlightPaths(entries || [], locateId, breedPaths);
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
      const pathKey = entryToVtuberPathKey(entry, breedPaths);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 400);
  }, [locateId, entries, fictionalEntries, breedPaths, setSearchParams, scheduleCamera]);

  // Focused entries for this user (raw: real + fictional, then sorted by X position)
  const rawFocusedEntries = useMemo(() => {
    if (!focusedUserId) return [];
    const real = entries ? entries.filter(e => e.user_id === focusedUserId) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === focusedUserId) : [];
    return [...real, ...fict];
  }, [focusedUserId, entries, fictionalEntries]);

  // Real-only focused entries (for traceBack computation — only applies to real species)
  const realFocusedEntries = useMemo(() => {
    return rawFocusedEntries.filter(e => e.taxon_path);
  }, [rawFocusedEntries]);

  // ── Filtering ──
  const filteredEntries = useMemo(() =>
    filterEntries(entries, filters), [entries, filters]);
  const filteredFictionalEntries = useMemo(() =>
    filterEntries(fictionalEntries, filters), [fictionalEntries, filters]);

  // Facets from raw (unfiltered) entries — combined and deduplicated
  const facets = useMemo(() => {
    const all = [...(entries || []), ...(fictionalEntries || [])];
    return computeFacets(all);
  }, [entries, fictionalEntries]);

  // ── Sort config per tree (shuffle only affects activeTree) ──
  const baseSortConfig = useMemo(() => (
    { key: sortKey, order: sortOrder, shuffleSeed: null }
  ), [sortKey, sortOrder]);

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
    setShuffleSeed(s => (s ?? 0) + 1);
    // Pan so the root sits near the top (~1/5 of viewport height)
    scheduleCamera(() => {
      const prefix = activeTree === 'fictional' ? '__F__' : '';
      const rootNode = nodesRef.current.find(
        n => n.depth === 0 && (n.data._pathKey || '') === prefix,
      );
      if (!rootNode) return;
      const [, l, r, , t] = cameraInsetsRef.current;
      // Inflate bottomInset so panTo's "center" lands at ~20% from top
      // cy = t + (h - t - bFake) / 2 = t + 0.2*(h - t)  →  bFake = 0.6*(h - t)
      const vh = window.innerHeight;
      const fakeBottom = 0.6 * (vh - t);
      canvasRef.current?.panTo(rootNode.x, rootNode.y, undefined, l, r, fakeBottom, t);
    }, 80);
  }, [activeTree, scheduleCamera]);


  // d3 layout (before traceBack computations so focusedEntries can sort by X)
  const activeFilterCount = countActiveFilters(filters);
  // Sort badge text is wider than filter badges (e.g. "1年2個月"), count as 2 units
  const hasSortBadge = (sortKey === 'debut_date' || sortKey === 'created_at') ? 2 : 0;
  const totalBadgeCount = activeFilterCount + hasSortBadge;
  const { nodes, edges, bounds, rootData, fictionalRootData, maxCount } = useTreeLayout(
    filteredEntries, filteredFictionalEntries, expandedSet, currentUser?.id, realSortConfig, fictSortConfig, totalBadgeCount,
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
      (xMap.get(entryToVtuberPathKey(a, breedPaths)) ?? 0) - (xMap.get(entryToVtuberPathKey(b, breedPaths)) ?? 0)
    );
  }, [rawFocusedEntries, nodes, focusedUserId, breedPaths]);

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
  }, [maxTraceBack]);

  // Trace back levels for UI
  const traceBackLevels = useMemo(() => {
    if (!activeFocusedEntries.length) return [];

    if (activeFocusedIsFictional) {
      const segs = (activeFocusedEntries[0].fictional_path || '').split('|').length;
      // 3-segment (has sub_origin): 同來源(value=2) → 同子來源(value=1) → 同種(value=0)
      // 2-segment (no sub_origin):  同來源(value=1) → 同種(value=0)
      const levels = [];
      if (segs === 3) {
        levels.push({ label: '同來源', value: 2, available: 2 <= maxTraceBack });
        levels.push({ label: '同子來源', value: 1, available: 1 <= maxTraceBack });
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
      if (segs === 3) return { 3: '同種', 2: '同子來源', 1: '同來源' };
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
    return computeCloseEdgePaths(activeFocusedEntries, entries, closeVtuberIds, traceBack, breedPaths);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional, breedPaths]);

  // ── TraceBack change: auto-expand + flash ALL close nodes + camera fit ──
  const [traceBackTick, setTraceBackTick] = useState(0);
  const prevTickRef = useRef(0);
  const flashMapRef = useRef(new Map());
  const edgeFlashStartRef = useRef(null);
  const [flashTick, setFlashTick] = useState(0);
  const FLASH_DURATION = 2800;

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
        const activePathKey = activeEntry ? entryToVtuberPathKey(activeEntry, breedPaths) : null;

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
          const activePathKey = entryToVtuberPathKey(activeEntry, breedPaths);
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
    if (hasAny) {
      const capturedReal = fr || [];
      const capturedFict = ff || [];
      setTimeout(() => {
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
        const userPaths = computeHighlightPaths(entries, focusedUserId, breedPaths);
        for (const p of userPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
        if (closeVtuberIds.size > 0) {
          const closePaths = collectCloseVtuberPaths(closeVtuberIds, entries, breedPaths);
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
    const capturedCloseIds = closeVtuberIds;
    setTimeout(() => {
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
    return flashMapRef.current.size > 0;
  }, [flashTick]);

  // Node animation
  const { positionMap, isAnimating } = useNodeAnimation(nodes);

  // Interaction
  const { hoveredNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes, maxCount);

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

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setTimeout(() => {
      canvasRef.current?.fitView(centerX, centerY, 0.5);

      // If logged in, pan to user's node after a beat
      if (currentUser) {
        const userEntry = entries?.find(e => e.user_id === currentUser.id)
          || fictionalEntries?.find(e => e.user_id === currentUser.id);
        if (userEntry) {
          const userPathKey = entryToVtuberPathKey(userEntry, breedPaths);
          const userNode = nodes.find(n => n.data._pathKey === userPathKey);
          if (userNode) {
            setTimeout(() => {
              panToWithInsets(userNode.x, userNode.y, 0.8);
            }, 800);
          }
        }
      }
    }, 100);
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
        const isFictional = pathKey.startsWith('__F__');
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

    if (hit.data._vtuber) {
      setSelectedVtuber(hit.data._entry);
      // If clicking own species node, sync HUD to that species
      if (hit.data._userId === focusedUserId) {
        setFocusedEntryKey(entryToKey(hit.data._entry));
      }
    } else if (hit.data._pathKey != null) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle, focusedUserId]);

  // Focus navigation — set entry key so index is derived stably
  const entryToKey = (e) => {
    if (!e) return null;
    if (e.fictional_path) return 'F\0' + (e.fictional_path || '') + '\0' + (e.fictional_species_id || '');
    return (e.taxon_path || '') + '\0' + (e.breed_id || '');
  };

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

  const handleClearFocus = useCallback(() => {
    setFocusedUserId(null);
    setFocusedEntryKey(null);
  }, []);

  // Build a vtuber pathKey from an entry (real or fictional)
  const entryToPathKey = useCallback((entry) => {
    return entryToVtuberPathKey(entry, breedPaths);
  }, [breedPaths]);

  // Locate: ensure paths expanded, then pan back to focused user's node
  const handleLocateFocused = useCallback(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Ensure focused user's paths are expanded
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId, breedPaths);
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
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntries, focusedSpeciesIdx, entries, fictionalEntries, focusedUserId, entryToPathKey, scheduleCamera]);

  const handleSetFocus = useCallback((entry) => {
    const userId = entry.user_id;
    setFocusedUserId(userId);
    setFocusedEntryKey(entryToKey(entry));

    // Ensure paths are expanded so the node exists in the layout
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], userId, breedPaths);
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
  }, [entries, fictionalEntries, entryToPathKey, scheduleCamera]);

  // All entries for the selected vtuber (for trait tabs in detail panel, both real + fictional)
  const selectedVtuberEntries = useMemo(() => {
    if (!selectedVtuber) return [];
    const real = entries ? entries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    const fict = fictionalEntries ? fictionalEntries.filter(e => e.user_id === selectedVtuber.user_id) : [];
    return [...real, ...fict];
  }, [selectedVtuber?.user_id, entries, fictionalEntries]);

  // Switch entry from detail panel trait tabs — update panel + focus + camera
  const handleSwitchEntry = useCallback((newEntry) => {
    setSelectedVtuber(newEntry);
    setFocusedUserId(newEntry.user_id);
    setFocusedEntryKey(entryToKey(newEntry));

    // Ensure paths are expanded so the node exists in the layout
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], newEntry.user_id, breedPaths);
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
      const entry = focusedEntries[0];
      if (!entry) return;
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  }, [refocusTick, entryToPathKey, scheduleCamera]);

  // Pan to focused species when user explicitly changes selection
  useEffect(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Ensure the path is expanded
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId, breedPaths);
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
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        panToWithInsets(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntryKey, focusedUserId, entryToPathKey, scheduleCamera]);

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
  }), [hoveredNode, imageCacheRef, focusedUserId, closeVtuberIds, closeEdgePaths, positionMap, flashTick, maxCount, activeFiltersForRender, sortKey]);

  const onRender = useCallback((ctx, transform, canvasSize) => {
    drawGraph(ctx, nodes, edges, transform, canvasSize, renderState);
  }, [nodes, edges, renderState]);

  // Continuous animation loop (focus pulse + node animation)
  const needsAnimLoop = !!focusedUserId || isAnimating || hasActiveFlash;
  useEffect(() => {
    if (!needsAnimLoop) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      canvasRef.current?.requestRender();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [needsAnimLoop]);

  // Trigger re-render when hover changes + update cursor
  useEffect(() => {
    canvasRef.current?.requestRender();
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    }
  }, [hoveredNode]);

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
  const filteredCount = (filteredEntries?.length || 0) + (filteredFictionalEntries?.length || 0);

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

      <div style={{ position: 'absolute', left: isMobile ? 8 : 16, top: isMobile ? 52 : 60, display: 'flex',
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

      {focusedUserId && focusedEntries.length > 0 && !(isMobile && toolbarExpanded) && (
        <FocusHUD
          focusedEntries={focusedEntries}
          speciesIndex={focusedSpeciesIdx}
          onPrev={handleFocusPrev}
          onNext={handleFocusNext}
          onLocate={handleLocateFocused}
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
