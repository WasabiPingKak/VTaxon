import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode, computeCloseVtubers, collectCloseVtuberPaths, computeCloseVtubersByRank, collectFictionalPathsToDepth, computeFictionalHighlightPaths, collectAllFictionalPaths, computeCloseFictionalVtubers, computeCloseFictionalVtubersByRank, collectCloseFictionalVtuberPaths, computeCloseEdgePaths, computeCloseFictionalEdgePaths } from '../../lib/treeUtils';
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

  // Fetch data (real + fictional in parallel)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getTaxonomyTree().catch(() => ({ entries: [] })),
      api.getFictionalTree().catch(() => ({ entries: [] })),
    ]).then(([realData, fictData]) => {
        if (cancelled) return;
        const e = realData.entries || [];
        const fe = fictData.entries || [];
        setEntries(e);
        setFictionalEntries(fe);

        // Default expand: real depth=4, fictional depth=2
        const defaultExpanded = collectPathsToDepth(e, 4);
        if (fe.length > 0) {
          const fictExpanded = collectFictionalPathsToDepth(fe, 2);
          for (const p of fictExpanded) defaultExpanded.add(p);
        }

        // Also expand current user's paths (both trees)
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

  // d3 layout (before traceBack computations so focusedEntries can sort by X)
  const { nodes, edges, bounds, rootData, fictionalRootData, maxCount } = useTreeLayout(
    entries, fictionalEntries, expandedSet, currentUser?.id,
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
      if (e.fictional_path) {
        return `__F__|${e.fictional_path}|__vtuber__${e.user_id}`;
      }
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
    return computeCloseEdgePaths(activeFocusedEntries, entries, closeVtuberIds, traceBack);
  }, [focusedUserId, closeVtuberIds, activeFocusedEntries, entries, fictionalEntries, traceBack, activeFocusedIsFictional]);

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
    setTimeout(() => {
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
        let activePathKey = null;
        if (activeEntry) {
          if (activeEntry.fictional_path) {
            activePathKey = `__F__|${activeEntry.fictional_path}|__vtuber__${activeEntry.user_id}`;
          } else {
            activePathKey = activeEntry.taxon_path;
            if (activeEntry.breed_id) activePathKey += `|__breed__${activeEntry.breed_id}`;
            activePathKey += `|__vtuber__${activeEntry.user_id}`;
          }
        }

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
          let activePathKey;
          if (activeEntry.fictional_path) {
            activePathKey = `__F__|${activeEntry.fictional_path}|__vtuber__${activeEntry.user_id}`;
          } else {
            activePathKey = activeEntry.taxon_path;
            if (activeEntry.breed_id) activePathKey += `|__breed__${activeEntry.breed_id}`;
            activePathKey += `|__vtuber__${activeEntry.user_id}`;
          }
          const focusedNode = currentNodes.find(n => n.data._pathKey === activePathKey);
          if (focusedNode) {
            canvasRef.current?.panTo(focusedNode.x, focusedNode.y);
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
      canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100, 80, 100);
    }, 300);
  }, [focusedUserId, closeVtuberIds, closeEdgePaths, activeFocusedEntries]);

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
          const userPathKey = userEntry.fictional_path
            ? `__F__|${userEntry.fictional_path}|__vtuber__${userEntry.user_id}`
            : (() => {
                let k = userEntry.taxon_path;
                if (userEntry.breed_id) k += `|__breed__${userEntry.breed_id}`;
                return k + `|__vtuber__${userEntry.user_id}`;
              })();
          const userNode = nodes.find(n => n.data._pathKey === userPathKey);
          if (userNode) {
            setTimeout(() => {
              canvasRef.current?.panTo(userNode.x, userNode.y, 0.8);
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
        // Auto-expand: single-child → always drill; count===1 → drill to bottom
        const treeRoot = pathKey.startsWith('__F__') ? fictionalRootData : rootData;
        if (treeRoot) {
          const autoExpand = (n) => {
            if (!n) return;
            if (n.children.size === 1) {
              const child = [...n.children.values()][0];
              next.add(child.pathKey);
              autoExpand(child);
            } else {
              for (const child of n.children.values()) {
                if (child.count === 1) {
                  next.add(child.pathKey);
                  autoExpand(child);
                }
              }
            }
          };
          autoExpand(findNode(treeRoot, pathKey));
        }
      }
      return next;
    });

    // Camera follow after layout settles
    setTimeout(() => {
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
          canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100, 80, 100);
        }
      } else {
        // Collapse — pan to the node
        const targetNode = currentNodes.find(n => n.data._pathKey === pathKey);
        if (targetNode) {
          canvasRef.current?.panTo(targetNode.x, targetNode.y);
        }
      }
    }, 300);
  }, [rootData, fictionalRootData]);

  // Expand all / collapse all — scoped to activeTree
  const handleExpandAll = useCallback(() => {
    const treePaths = activeTree === 'real'
      ? (entries ? collectAllPaths(entries) : new Set())
      : (fictionalEntries ? collectAllFictionalPaths(fictionalEntries) : new Set());
    setExpandedSet(prev => {
      const next = new Set(prev);
      for (const p of treePaths) next.add(p);
      return next;
    });
    scheduleCameraFit(true, activeTree);
  }, [entries, fictionalEntries, activeTree, scheduleCameraFit]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSet(prev => {
      const next = new Set();
      for (const p of prev) {
        if (activeTree === 'real') {
          // Keep fictional paths only
          if (p.startsWith('__F__')) next.add(p);
        } else {
          // Keep real paths only
          if (!p.startsWith('__F__')) next.add(p);
        }
      }
      return next;
    });
    scheduleCameraFit(true, activeTree);
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
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100, 80, 100);
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
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100, 80, 100);
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
    canvasRef.current?.fitBounds(minX, minY, maxX, maxY, 80, 220, 100, 80, 100);
  }, []);

  // Canvas click handler
  const onCanvasClick = useCallback((worldX, worldY) => {
    const hit = hitTestClick(worldX, worldY);
    if (!hit) return;

    // Sync tree indicator to the clicked node's tree
    setActiveTree(hit.data._pathKey?.startsWith('__F__') ? 'fictional' : 'real');

    if (hit.data._vtuber) {
      setSelectedVtuber(hit.data._entry);
    } else if (hit.data._pathKey != null) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle]);

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
    if (entry.fictional_path) {
      return `__F__|${entry.fictional_path}|__vtuber__${entry.user_id}`;
    }
    let pk = entry.taxon_path;
    if (entry.breed_id) pk += `|__breed__${entry.breed_id}`;
    return pk + `|__vtuber__${entry.user_id}`;
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
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    // Delay to let layout update with expanded paths, then pan
    setTimeout(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntries, focusedSpeciesIdx, entries, fictionalEntries, focusedUserId, entryToPathKey]);

  const handleSetFocus = useCallback((entry) => {
    const userId = entry.user_id;
    setFocusedUserId(userId);
    setFocusedEntryKey(entryToKey(entry));

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
    setTimeout(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  }, [entries, fictionalEntries, entryToPathKey]);

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
    setTimeout(() => {
      const pathKey = entryToPathKey(newEntry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [entries, fictionalEntries, entryToPathKey]);

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
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 200);
  }, [refocusTick, entryToPathKey]);

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
      if (fictionalEntries) {
        const fictPaths = computeFictionalHighlightPaths(fictionalEntries, focusedUserId);
        for (const p of fictPaths) {
          if (!next.has(p)) { next.add(p); changed = true; }
        }
      }
      return changed ? next : prev;
    });

    // Delay to let layout update with expanded paths, then pan
    setTimeout(() => {
      const pathKey = entryToPathKey(entry);
      const targetNode = nodesRef.current.find(n => n.data._pathKey === pathKey);
      if (targetNode) {
        canvasRef.current?.panTo(targetNode.x, targetNode.y, 0.8);
      }
    }, 100);
  }, [focusedEntryKey, focusedUserId, entryToPathKey]);

  // Render state
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
  }), [hoveredNode, imageCacheRef, focusedUserId, closeVtuberIds, closeEdgePaths, positionMap, flashTick, maxCount]);

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

  const nodeCount = nodes.length;
  const entryCount = (entries?.length || 0) + (fictionalEntries?.length || 0);

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
          onExpandBothTrees={handleExpandBothTrees}
          closeByRank={closeByRank}
          traceBack={traceBack}
          traceBackLevels={focusedUserId ? traceBackLevels : null}
          onTraceBackChange={focusedUserId ? handleTraceBackChange : null}
          depthLabels={depthLabels}
          activeTree={activeTree}
          onSelectTree={handleSelectTree}
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
          allEntries={selectedVtuberEntries.length > 1 ? selectedVtuberEntries : undefined}
          onClose={() => setSelectedVtuber(null)}
          onFocus={handleSetFocus}
          onSwitchEntry={handleSwitchEntry}
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
