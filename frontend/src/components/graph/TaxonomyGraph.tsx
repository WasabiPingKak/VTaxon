import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import DescriptionPanel from './DescriptionPanel';
import NoResultsOverlay from './NoResultsOverlay';
import useIsMobile from '../../hooks/useIsMobile';
import useLiveStatus from '../../hooks/useLiveStatus';
import useSortFilter from '../../hooks/useSortFilter';
import useTreeExpansion from '../../hooks/useTreeExpansion';
import useFocusManager from '../../hooks/useFocusManager';
import useTraceBack from '../../hooks/useTraceBack';
import useCameraControl from '../../hooks/useCameraControl';
import useSideEffects from '../../hooks/useSideEffects';
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
  const nodesRef = useRef<ReturnType<typeof useTreeLayout>['nodes']>([]);

  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [fictionalEntries, setFictionalEntries] = useState<TreeEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active tree selector
  const [activeTree, setActiveTree] = useState<ActiveTree>('real');

  const isMobile = useIsMobile();
  const { liveUserIds, livePrimaries } = useLiveStatus();

  // ── Camera Control ──
  const {
    cameraInsetsRef, initialFitDone, panToWithInsets, scheduleCamera, scheduleCameraFit,
    handleFitAll, handleShuffleWithCamera, handleSelectTree: cameraSelectTree,
    focusedUserIdRef: camFocusedUserIdRef,
    activeFocusedEntriesRef: camActiveFocusedEntriesRef,
    closeVtuberIdsRef: camCloseVtuberIdsRef,
    closeEdgePathsRef: camCloseEdgePathsRef,
  } = useCameraControl({ isMobile, canvasRef, nodesRef });

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
    scheduleCameraFit,
    panToWithInsets,
  });

  // ── Sort & Filter ──
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
    scheduleCameraFit,
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

  // Sync camera control refs with focus/traceback state
  camFocusedUserIdRef.current = focusedUserId;
  camActiveFocusedEntriesRef.current = activeFocusedEntries;
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

  // Sync camera control refs with traceback state
  camCloseVtuberIdsRef.current = closeVtuberIds;
  camCloseEdgePathsRef.current = closeEdgePaths;

  // Auto-sync activeTree with focused entry
  useEffect(() => {
    if (activeFocusedEntries.length === 0) return;
    setActiveTree(activeFocusedIsFictional ? 'fictional' : 'real');
  }, [activeFocusedIsFictional, activeFocusedEntries.length]);

  // Cleanup flash timer on unmount (camera timer cleanup is in useCameraControl)
  useEffect(() => {
    const ft = flashTimerRef;
    return () => { if (ft.current) clearTimeout(ft.current); };
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

  // ── URL Locate + Refocus Self + Keyboard Shortcuts ──
  const [searchParams, setSearchParams] = useSearchParams();
  useSideEffects({
    searchParams, setSearchParams,
    entries, fictionalEntries,
    setFocusedUserId, setFocusedEntryKey, setExpandedSet, setActiveTree,
    nodesRef, scheduleCamera, panToWithInsets,
    currentUser,
    focusedEntriesRef, entryToPathKeyRef,
    focusedUserId, focusedEntries,
    handleFocusPrev, handleFocusNext, handleFitAll,
    setSelectedVtuber,
  });

  const onShuffleWithCamera = useCallback(() => {
    handleShuffleWithCamera(handleShuffle, activeTree);
  }, [activeTree, handleShuffle, handleShuffleWithCamera]);

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
            return;
          }
        }
      }
      canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- panToWithInsets is stable
  }, [bounds, nodes, currentUser, entries, fictionalEntries]);

  const onSelectTree = useCallback((tree: ActiveTree) => {
    cameraSelectTree(tree, setActiveTree);
  }, [cameraSelectTree]);

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

      {!isMobile && showDescription && (
        <DescriptionPanel onClose={() => setShowDescription(false)} />
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
          onSelectTree={onSelectTree}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onShuffle={onShuffleWithCamera}
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
        <NoResultsOverlay onClearFilters={() => handleFiltersChange(emptyFilters())} />
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
