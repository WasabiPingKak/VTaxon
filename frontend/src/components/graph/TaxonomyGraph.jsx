import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode, computeCloseVtubers, collectCloseVtuberPaths, computeCloseVtubersByRank } from '../../lib/treeUtils';
import GraphCanvas from './GraphCanvas';
import { drawGraph, createStarField } from './renderers';
import useTreeLayout from '../../hooks/useTreeLayout';
import useGraphInteraction from '../../hooks/useGraphInteraction';
import useImagePreloader from '../../hooks/useImagePreloader';
import useNodeAnimation from '../../hooks/useNodeAnimation';
import VtuberDetailPanel from '../VtuberDetailPanel';
import FloatingToolbar from './FloatingToolbar';
import FocusHUD from './FocusHUD';

export default function TaxonomyGraph({ currentUser }) {
  const canvasRef = useRef(null);
  const starFieldRef = useRef(null);
  const initialFitDone = useRef(false);
  const nodesRef = useRef([]);

  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState(null);

  // Focus Vtuber state
  const [focusedUserId, setFocusedUserId] = useState(null);
  const [focusedEntryKey, setFocusedEntryKey] = useState(null);

  // Trace back range (0 = same species, 1 = same genus, 2 = same family, 3 = same order max)
  const [traceBack, setTraceBack] = useState(2);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    api.getTaxonomyTree()
      .then(data => {
        if (cancelled) return;
        const e = data.entries || [];
        setEntries(e);

        // Default expand to ORDER depth (~4 levels)
        const defaultExpanded = collectPathsToDepth(e, 4);

        // Also expand current user's paths
        if (currentUser) {
          const userPaths = computeHighlightPaths(e, currentUser.id);
          for (const p of userPaths) defaultExpanded.add(p);
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
  }, [currentUser]);

  // Auto-focus logged-in user
  useEffect(() => {
    if (currentUser && !focusedUserId) setFocusedUserId(currentUser.id);
  }, [currentUser, focusedUserId]);

  // Focused entries for this user (raw, then sorted by X position)
  const rawFocusedEntries = useMemo(() => {
    if (!focusedUserId || !entries) return [];
    return entries.filter(e => e.user_id === focusedUserId);
  }, [focusedUserId, entries]);

  // d3 layout (before traceBack computations so focusedEntries can sort by X)
  const { nodes, edges, bounds, rootData } = useTreeLayout(
    entries, expandedSet, currentUser?.id,
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
    const getKey = (e) => {
      let k = e.taxon_path;
      if (e.breed_id) k += `|__breed__${e.breed_id}`;
      return k + `|__vtuber__${e.user_id}`;
    };
    return [...rawFocusedEntries].sort((a, b) =>
      (xMap.get(getKey(a)) ?? 0) - (xMap.get(getKey(b)) ?? 0)
    );
  }, [rawFocusedEntries, nodes, focusedUserId]);

  // Derive index from stable entry key — survives focusedEntries re-sorting
  const focusedSpeciesIdx = useMemo(() => {
    if (!focusedEntryKey || focusedEntries.length === 0) return 0;
    const idx = focusedEntries.findIndex(e =>
      (e.taxon_path || '') + '\0' + (e.breed_id || '') === focusedEntryKey
    );
    return idx >= 0 ? idx : 0;
  }, [focusedEntryKey, focusedEntries]);

  // Active focused entry — the single species currently shown in HUD
  const activeFocusedEntries = useMemo(() => {
    const entry = focusedEntries[focusedSpeciesIdx] || focusedEntries[0];
    return entry ? [entry] : [];
  }, [focusedEntries, focusedSpeciesIdx]);

  // Max trace back based on active entry's path depth
  const maxTraceBack = useMemo(() => {
    if (!activeFocusedEntries.length) return 0;
    const segs = (activeFocusedEntries[0].taxon_path || '').split('|').length;
    return Math.max(0, segs - 1 - 3); // 3 = ORDER index
  }, [activeFocusedEntries]);

  // Auto-clamp when maxTraceBack changes
  useEffect(() => {
    if (traceBack > maxTraceBack) setTraceBack(maxTraceBack);
  }, [maxTraceBack]);

  // Trace back levels for UI (vertical list: 同目→同科→同屬→同種)
  const traceBackLevels = useMemo(() => {
    const FIXED = [
      { label: '同目', depth: 4 },
      { label: '同科', depth: 5 },
      { label: '同屬', depth: 6 },
      { label: '同種', depth: 7 },
    ];
    if (!activeFocusedEntries.length) return [];
    const maxDepth = (activeFocusedEntries[0].taxon_path || '').split('|').length;
    return FIXED.map(lv => ({
      label: lv.label,
      value: maxDepth - lv.depth,
      available: (maxDepth - lv.depth) >= 0 && (maxDepth - lv.depth) <= maxTraceBack,
    }));
  }, [activeFocusedEntries, maxTraceBack]);

  // Close (related) vtuber IDs — scoped to active entry only
  const closeVtuberIds = useMemo(() => {
    return computeCloseVtubers(activeFocusedEntries, entries, traceBack);
  }, [activeFocusedEntries, entries, traceBack]);

  // Close vtubers by rank stats — scoped to active entry only
  const closeByRank = useMemo(() => {
    if (!focusedUserId) return null;
    return computeCloseVtubersByRank(activeFocusedEntries, entries, traceBack);
  }, [activeFocusedEntries, entries, focusedUserId, traceBack]);

  // ── TraceBack change: auto-expand + flash ALL close nodes + camera fit ──
  const [traceBackTick, setTraceBackTick] = useState(0);
  const prevTickRef = useRef(0);
  const flashMapRef = useRef(new Map());
  const [flashTick, setFlashTick] = useState(0);
  const FLASH_DURATION = 2800;

  // Wrapper: always increments tick so re-clicking the same level triggers effects
  const handleTraceBackChange = useCallback((value) => {
    setTraceBack(value);
    setTraceBackTick(t => t + 1);
  }, []);

  // Shared: schedule camera fit after layout updates (300ms delay).
  // fitAll=true → fit to entire tree; false → try focused+close first, fallback to all.
  const scheduleCameraFit = useCallback((fitAll = false) => {
    setTimeout(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let count = 0;

      // Try active focused entry + close vtuber nodes (unless fitAll)
      if (!fitAll && focusedUserId && closeVtuberIds.size > 0) {
        // Build pathKey for the ACTIVE focused entry only (not all user species)
        const activeEntry = activeFocusedEntries[0];
        let activePathKey = null;
        if (activeEntry) {
          activePathKey = activeEntry.taxon_path;
          if (activeEntry.breed_id) activePathKey += `|__breed__${activeEntry.breed_id}`;
          activePathKey += `|__vtuber__${activeEntry.user_id}`;
        }

        for (const n of currentNodes) {
          if (!n.data._vtuber) continue;
          const uid = n.data._userId;
          const isFocusedActive = activePathKey && n.data._pathKey === activePathKey;
          const isClose = closeVtuberIds.get(uid)?.has(n.data._entry?.taxon_path);
          if (!isFocusedActive && !isClose) continue;
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
          count++;
        }
      }

      // fitAll or fallback: all visible nodes
      if (count === 0) {
        for (const n of currentNodes) {
          if (n.x < minX) minX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
          count++;
        }
      }

      if (count === 0) return;
      canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100);
    }, 300);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries]);

  useEffect(() => {
    if (prevTickRef.current === traceBackTick) return;
    prevTickRef.current = traceBackTick;
    if (traceBackTick === 0) return; // skip initial render

    if (!focusedUserId || !entries) return;

    // Expand focused user's own paths + close vtuber paths
    setExpandedSet(prev => {
      const next = new Set(prev);
      let changed = false;
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
      for (const [userId, paths] of capturedCloseIds) {
        for (const path of paths) {
          flashMapRef.current.set(userId + '\0' + path, now);
        }
      }
      setFlashTick(t => t + 1);
    }, 1100);
  }, [traceBackTick, closeVtuberIds, focusedUserId, entries, scheduleCameraFit]);

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
  const { hoveredNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes);

  // Image preloader
  const imageCacheRef = useImagePreloader(entries);

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
      if (currentUser && entries) {
        const userEntry = entries.find(e => e.user_id === currentUser.id);
        if (userEntry) {
          let userPathKey = userEntry.taxon_path;
          if (userEntry.breed_id) userPathKey += `|__breed__${userEntry.breed_id}`;
          userPathKey += `|__vtuber__${userEntry.user_id}`;
          const userNode = nodes.find(n => n.data._pathKey === userPathKey);
          if (userNode) {
            setTimeout(() => {
              canvasRef.current?.panTo(userNode.x, userNode.y, 0.8);
            }, 800);
          }
        }
      }
    }, 100);
  }, [bounds, nodes, currentUser, entries]);

  // Toggle expand/collapse
  const handleToggle = useCallback((pathKey) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        // Collapse — also collapse all descendants
        for (const key of prev) {
          if (key.startsWith(pathKey + '|') || key === pathKey) {
            next.delete(key);
          }
        }
      } else {
        next.add(pathKey);
        // Auto-drill through single-child empty nodes
        if (rootData) {
          let node = findNode(rootData, pathKey);
          while (node && node.vtubers.length === 0 && node.children.size === 1) {
            const child = [...node.children.values()][0];
            next.add(child.pathKey);
            node = child;
          }
        }
      }
      return next;
    });
  }, [rootData]);

  // Expand all / collapse all
  const handleExpandAll = useCallback(() => {
    if (entries) setExpandedSet(collectAllPaths(entries));
    scheduleCameraFit(true);
  }, [entries, scheduleCameraFit]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSet(new Set());
    scheduleCameraFit(true);
  }, [scheduleCameraFit]);

  // Expand close vtuber paths
  const handleExpandClose = useCallback(() => {
    if (!entries || closeVtuberIds.size === 0) return;
    const closePaths = collectCloseVtuberPaths(closeVtuberIds, entries);
    setExpandedSet(prev => {
      const next = new Set(prev);
      for (const p of closePaths) next.add(p);
      return next;
    });
    scheduleCameraFit();
  }, [entries, closeVtuberIds, scheduleCameraFit]);

  // Canvas click handler
  const onCanvasClick = useCallback((worldX, worldY) => {
    const hit = hitTestClick(worldX, worldY);
    if (!hit) return;

    if (hit.data._vtuber) {
      setSelectedVtuber(hit.data._entry);
    } else if (hit.data._pathKey) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle]);

  // Focus navigation — set entry key so index is derived stably
  const entryToKey = (e) => e ? (e.taxon_path || '') + '\0' + (e.breed_id || '') : null;

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

  // Locate: ensure paths expanded, then pan back to focused user's node
  const handleLocateFocused = useCallback(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Ensure focused user's paths are expanded
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      return changed ? next : prev;
    });

    // Delay to let layout update with expanded paths, then pan
    setTimeout(() => {
      let pathKey = entry.taxon_path;
      if (entry.breed_id) pathKey += `|__breed__${entry.breed_id}`;
      pathKey += `|__vtuber__${entry.user_id}`;
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntries, focusedSpeciesIdx, entries, focusedUserId]);

  const handleSetFocus = useCallback((userId) => {
    setFocusedUserId(userId);
    setFocusedEntryKey(null);
  }, []);

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
    setTimeout(() => {
      const entry = focusedEntries[0];
      if (!entry) return;
      let pathKey = entry.taxon_path;
      if (entry.breed_id) pathKey += `|__breed__${entry.breed_id}`;
      pathKey += `|__vtuber__${entry.user_id}`;
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  }, [refocusTick]);

  // Pan to focused species when user explicitly changes selection
  useEffect(() => {
    const entry = focusedEntries[focusedSpeciesIdx];
    if (!entry) return;

    // Ensure the path is expanded
    setExpandedSet(prev => {
      const next = new Set(prev);
      const userPaths = computeHighlightPaths(entries || [], focusedUserId);
      let changed = false;
      for (const p of userPaths) {
        if (!next.has(p)) { next.add(p); changed = true; }
      }
      return changed ? next : prev;
    });

    // Delay to let layout update with expanded paths, then pan
    setTimeout(() => {
      // Build the correct pathKey including breed segment if present
      let pathKey = entry.taxon_path;
      if (entry.breed_id) pathKey += `|__breed__${entry.breed_id}`;
      pathKey += `|__vtuber__${entry.user_id}`;
      // Use nodesRef for latest nodes after re-render (closure `nodes` may be stale)
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntryKey, focusedUserId]);

  // Render state
  const renderState = useMemo(() => ({
    hoveredNode,
    imageCache: imageCacheRef.current,
    starField: starFieldRef.current,
    focusedUserId,
    closeVtuberIds,
    positionMap,
    flashMap: flashMapRef.current,
  }), [hoveredNode, imageCacheRef, focusedUserId, closeVtuberIds, positionMap, flashTick]);

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
        const cx = bounds ? (bounds.minX + bounds.maxX) / 2 : 0;
        const cy = bounds ? (bounds.minY + bounds.maxY) / 2 : 0;
        canvasRef.current?.fitView(cx, cy, 0.5);
      } else if (e.key === 'ArrowLeft' && focusedUserId && focusedEntries.length > 1) {
        handleFocusPrev();
      } else if (e.key === 'ArrowRight' && focusedUserId && focusedEntries.length > 1) {
        handleFocusNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bounds, focusedUserId, focusedEntries.length, handleFocusPrev, handleFocusNext]);

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

  const nodeCount = nodes.length;
  const entryCount = entries?.length || 0;

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

      <div style={{ position: 'absolute', left: 16, top: 60, display: 'flex',
        flexDirection: 'column', gap: 8, zIndex: 50, pointerEvents: 'none' }}>
        <FloatingToolbar
          canvasRef={canvasRef}
          nodeCount={nodeCount}
          entryCount={entryCount}
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          onExpandClose={focusedUserId && closeVtuberIds.size > 0 ? handleExpandClose : null}
          closeByRank={closeByRank}
          traceBack={traceBack}
          traceBackLevels={focusedUserId ? traceBackLevels : null}
          onTraceBackChange={focusedUserId ? handleTraceBackChange : null}
        />
      </div>

      {focusedUserId && focusedEntries.length > 0 && (
        <FocusHUD
          focusedEntries={focusedEntries}
          speciesIndex={focusedSpeciesIdx}
          onPrev={handleFocusPrev}
          onNext={handleFocusNext}
          onLocate={handleLocateFocused}
        />
      )}

      {selectedVtuber && (
        <VtuberDetailPanel
          entry={selectedVtuber}
          onClose={() => setSelectedVtuber(null)}
          onFocus={handleSetFocus}
        />
      )}
    </>
  );
}

const spinnerStyle = {
  width: 32, height: 32,
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#38bdf8',
  borderRadius: '50%',
  animation: 'vtaxonSpin 0.8s linear infinite',
  margin: '0 auto',
};
