import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, computeFictionalHighlightPaths, findNode, autoExpandPathsUnfiltered, subtreeHasNormalUser, entryToVtuberPathKey } from '../../lib/treeUtils';
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
import { countActiveFilters, emptyFilters } from '../../lib/treeFilters';
import useIsMobile from '../../hooks/useIsMobile';
import useLiveStatus from '../../hooks/useLiveStatus';
import useSortFilter from '../../hooks/useSortFilter';
import useTreeExpansion from '../../hooks/useTreeExpansion';
import useFocusManager from '../../hooks/useFocusManager';
import useTraceBack from '../../hooks/useTraceBack';
import { entryToKey } from '../../lib/graphLogic';
import type { TreeEntry, ActiveTree } from '../../types';

interface TaxonomyGraphProps {
  currentUser: { id: string } | null;
  authLoading: boolean;
}

export interface TaxonomyGraphHandle {
  refetch: () => Promise<{ entries: TreeEntry[]; fictionalEntries: TreeEntry[] }>;
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

  // Active tree selector
  const [activeTree, setActiveTree] = useState<ActiveTree>('real');

  const isMobile = useIsMobile();
  const { liveUserIds, livePrimaries } = useLiveStatus();

  // Camera insets: [padding, leftInset, rightInset, bottomInset, topInset]
  const cameraInsetsRef = useRef<[number, number, number, number, number]>([80, 220, 100, 80, 100]);
  useEffect(() => {
    cameraInsetsRef.current = isMobile
      ? [40, 16, 16, 72, 60]
      : [80, 220, 100, 80, 100];
  }, [isMobile]);

  // Helper: panTo with current insets
  const panToWithInsets = useCallback((x: number, y: number, scale?: number) => {
    const [, l, r, b, t] = cameraInsetsRef.current;
    canvasRef.current?.panTo(x, y, scale ?? null, l, r, b, t);
  }, []);

  // Centralized camera scheduling
  const scheduleCamera = useCallback((fn: () => void, delay: number) => {
    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    cameraTimerRef.current = setTimeout(() => {
      cameraTimerRef.current = null;
      fn();
    }, delay);
  }, []);

  // Fetch tree data
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

  useImperativeHandle(ref, () => ({
    refetch: () => fetchTreeData({ refresh: true }),
  }), [fetchTreeData]);

  // ── Tree Expansion ──
  // rootData/fictionalRootData/scheduleCameraFit are not available yet at this point but are accessed
  // via refs inside the hook callbacks, so passing null/noop is safe for initialization.
  const { expandedSet, setExpandedSet, expandedBudgetGroups, setExpandedBudgetGroups,
    handleToggle, handleExpandAll, handleCollapseAll, handleExpandBothTrees, expandBudgetGroupsForUser,
    rootDataRef: treeExpRootDataRef, fictionalRootDataRef: treeExpFictRootDataRef,
    scheduleCameraFitRef: treeExpCameraFitRef } = useTreeExpansion({
    rootData: null,
    fictionalRootData: null,
    entries,
    fictionalEntries,
    activeTree,
    nodesRef,
    canvasRef: canvasRef as React.RefObject<{ fitBounds: (...args: number[]) => void } | null>,
    cameraInsetsRef,
    scheduleCamera,
    scheduleCameraFit: () => {},
    panToWithInsets,
  });

  // ── Sort & Filter ──
  // Forward-declared scheduleCameraFit placeholder - will be set after focus/traceback hooks
  const scheduleCameraFitRef = useRef<(fitAll?: boolean, scopeTree?: ActiveTree | null) => void>(() => {});

  const sortFilter = useSortFilter({
    entries,
    fictionalEntries,
    liveUserIds,
    livePrimaries,
    activeTree,
    onFiltersApplied: useCallback((realPaths: Set<string>, fictPaths: Set<string>, filteredReal: TreeEntry[], filteredFict: TreeEntry[]) => {
      if (realPaths.size > 0 || fictPaths.size > 0) {
        setExpandedSet(new Set([...realPaths, ...fictPaths]));
      }
      // Flash is triggered via triggerFilterFlash
      traceBackRef.current?.triggerFilterFlash(filteredReal, filteredFict);
    }, [setExpandedSet]),
    onLiveFilterExpand: useCallback((realPaths: Set<string>, fictPaths: Set<string>) => {
      setExpandedSet(new Set([...realPaths, ...fictPaths]));
    }, [setExpandedSet]),
    scheduleCameraFit: useCallback((fitAll?: boolean, scopeTree?: ActiveTree | null) => {
      scheduleCameraFitRef.current(fitAll, scopeTree);
    }, []),
  });

  const { finalEntries, finalFictionalEntries, filteredEntries, filteredFictionalEntries,
    facets, liveCount, realSortConfig, fictSortConfig, sortKey, sortOrder, shuffleSeed,
    filters, filterPanelOpen, liveFilterActive, toolbarExpanded, showDescription,
    totalBadgeCount, setFilterPanelOpen, setToolbarExpanded, setShowDescription,
    handleSortChange, handleShuffle, handleFiltersChange, handleLiveFilterToggle } = sortFilter;

  // ── D3 Layout ──
  const { nodes, edges, bounds, rootData, fictionalRootData, maxCount } = useTreeLayout(
    finalEntries, finalFictionalEntries, expandedSet, currentUser?.id ?? null, realSortConfig, fictSortConfig, totalBadgeCount, expandedBudgetGroups,
  );
  nodesRef.current = nodes;

  // Update tree expansion refs with real layout data
  treeExpRootDataRef.current = rootData;
  treeExpFictRootDataRef.current = fictionalRootData;

  // ── Focus Manager ──
  const focusManager = useFocusManager({
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
  });

  const { focusedUserId, setFocusedUserId, setFocusedEntryKey,
    selectedVtuber, setSelectedVtuber, focusedEntries, focusedEntriesRef,
    focusedSpeciesIdx, activeFocusedEntries, activeFocusedIsFictional,
    selectedVtuberEntries, handleFocusPrev, handleFocusNext, handleJumpToSpecies,
    handleLocateFocused, handleSetFocus, handleSwitchEntry,
    entryToPathKeyRef } = focusManager;

  // ── scheduleCameraFit (depends on focus + close vtubers) ──
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

      if (!fitAll && focusedUserId && traceBackState.closeVtuberIds.size > 0) {
        const activeEntry = activeFocusedEntries[0];
        const activePathKey = activeEntry ? entryToVtuberPathKey(activeEntry) : null;
        const edgePaths = traceBackState.closeEdgePaths;
        for (const n of currentNodes) {
          if (!inScope(n)) continue;
          const pk = n.data._pathKey || '';
          const isVtuberMatch = n.data._vtuber && (
            (activePathKey && pk === activePathKey) ||
            traceBackState.closeVtuberIds.get(n.data._userId ?? '')?.has(n.data._entry?.fictional_path || n.data._entry?.taxon_path || '')
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
  }, [focusedUserId, activeFocusedEntries, scheduleCamera]);

  // Update refs so hook callbacks use the real implementation
  scheduleCameraFitRef.current = scheduleCameraFit;
  treeExpCameraFitRef.current = scheduleCameraFit;

  // ── Trace Back ──
  const traceBackRef = useRef<ReturnType<typeof useTraceBack> | null>(null);
  const traceBackState = useTraceBack({
    activeFocusedEntries,
    activeFocusedIsFictional,
    entries,
    fictionalEntries,
    focusedUserId,
    setExpandedSet,
    scheduleCameraFit,
  });
  traceBackRef.current = traceBackState;

  const { traceBack, traceBackLevels, depthLabels, closeVtuberIds, closeByRank, closeEdgePaths,
    handleTraceBackChange, flashMapRef, edgeFlashStartRef, flashTimerRef, hasActiveFlash } = traceBackState;

  // Auto-sync activeTree with focused entry
  useEffect(() => {
    if (activeFocusedEntries.length === 0) return;
    setActiveTree(activeFocusedIsFictional ? 'fictional' : 'real');
  }, [activeFocusedIsFictional, activeFocusedEntries.length]);

  // Cleanup timers on unmount
  useEffect(() => {
    const flashTimer = flashTimerRef;
    return () => {
      if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [flashTimerRef]);

  // Live filter auto-expand when liveUserIds changes
  useEffect(() => {
    if (!liveFilterActive || !liveUserIds || liveUserIds.size === 0) return;
    const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
    const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
    const realPaths = liveReal.length > 0
      ? (() => { const s = new Set<string>(); for (const e of liveReal) if (e.taxon_path) for (const p of e.taxon_path.split('|').map((_, i, a) => a.slice(0, i + 1).join('|'))) s.add(p); return s; })()
      : new Set<string>();
    const fictPaths = liveFict.length > 0
      ? (() => { const s = new Set<string>(); for (const e of liveFict) if (e.fictional_path) { const parts = e.fictional_path.split('|'); for (let i = 0; i < parts.length; i++) s.add('__F__|' + parts.slice(0, i + 1).join('|')); } return s; })()
      : new Set<string>();
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
  }, [liveFilterActive, liveUserIds, filteredEntries, filteredFictionalEntries, setExpandedSet]);

  // ── Initial load ──
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
  }, [authLoading, currentUser?.id, fetchTreeData, setExpandedSet]);

  // ── URL Locate ──
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [locateId, entries, fictionalEntries, setSearchParams, scheduleCamera]);

  // ── Shuffle camera (pan to root) ──
  const handleShuffleWithCamera = useCallback(() => {
    handleShuffle();
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
  }, [activeTree, scheduleCamera, handleShuffle]);

  // ── Node animation ──
  const { positionMap, isAnimating } = useNodeAnimation(nodes);

  // ── Interaction ──
  const { hoveredNode, hoveredBadgeNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes, maxCount);

  // ── Image preloader ──
  const allEntriesForImages = useMemo(() =>
    [...(entries || []), ...(fictionalEntries || [])], [entries, fictionalEntries]);
  const imageCacheRef = useImagePreloader(allEntriesForImages);

  // ── Star field ──
  useEffect(() => {
    starFieldRef.current = createStarField(2000, 2000);
  }, []);

  // ── Fit view on first layout ──
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

  // ── Fit handlers ──
  const handleFitReal = useCallback(() => {
    const realNodes = nodesRef.current?.filter(n => !(n.data._pathKey || '').startsWith('__F__'));
    if (!realNodes?.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of realNodes) {
      if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x; if (n.y > maxY) maxY = n.y;
    }
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
  }, []);

  const handleFitFictional = useCallback(() => {
    const fictNodes = nodesRef.current?.filter(n => (n.data._pathKey || '').startsWith('__F__'));
    if (!fictNodes?.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of fictNodes) {
      if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x; if (n.y > maxY) maxY = n.y;
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
      if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x; if (n.y > maxY) maxY = n.y;
    }
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current);
  }, []);

  // ── Canvas click ──
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
  }, [hitTestClick, handleToggle, focusedUserId, expandedBudgetGroups, setExpandedBudgetGroups, setExpandedSet,
    setSelectedVtuber, setFocusedEntryKey, rootData, fictionalRootData]);

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

  // ── Render state ──
  const activeFiltersForRender = useMemo(() => {
    if (!filters) return null;
    for (const key of Object.keys(filters) as Array<keyof typeof filters>) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- flashTick intentionally triggers
  }), [hoveredNode, hoveredBadgeNode, imageCacheRef, focusedUserId, closeVtuberIds, closeEdgePaths,
    positionMap, hasActiveFlash, maxCount, activeFiltersForRender, sortKey, liveUserIds]);

  const onRender = useCallback((ctx: CanvasRenderingContext2D, transform: { x: number; y: number; scale: number }, canvasSize: { width: number; height: number }) => {
    drawGraph(ctx, nodes, edges, transform, canvasSize, renderState);
  }, [nodes, edges, renderState]);

  // ── Animation loop ──
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

  // Cursor update on hover
  useEffect(() => {
    canvasRef.current?.requestRender();
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.style.cursor = (hoveredNode || hoveredBadgeNode) ? 'pointer' : 'grab';
    }
  }, [hoveredNode, hoveredBadgeNode]);

  // ── Keyboard shortcuts ──
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
  }, [focusedUserId, focusedEntries.length, handleFocusPrev, handleFocusNext, handleFitAll, setSelectedVtuber]);

  // ── Render ──
  if (loading) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)', fontSize: '1.1em',
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
          onShuffle={handleShuffleWithCamera}
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
