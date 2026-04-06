import { useEffect, useRef, useCallback } from 'react';
import type { GraphCanvasHandle } from '../components/graph/GraphCanvas';
import { entryToVtuberPathKey } from '../lib/treeUtils';
import { computeNodeBounds } from '../lib/graphLogic';
import type { TreeEntry, ActiveTree } from '../types';
import type { LayoutNode } from '../types/graph';

type CameraInsets = [number, number, number, number, number];

interface UseCameraControlParams {
  isMobile: boolean;
  canvasRef: React.RefObject<GraphCanvasHandle | null>;
  nodesRef: React.MutableRefObject<LayoutNode[]>;
}

export default function useCameraControl({
  isMobile,
  canvasRef,
  nodesRef,
}: UseCameraControlParams) {
  // Camera insets: [padding, leftInset, rightInset, bottomInset, topInset]
  const cameraInsetsRef = useRef<CameraInsets>([80, 220, 100, 80, 100]);
  useEffect(() => {
    cameraInsetsRef.current = isMobile
      ? [40, 16, 16, 72, 60]
      : [80, 220, 100, 80, 100];
  }, [isMobile]);

  const cameraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFitDone = useRef(false);

  // Late-bound refs — updated by caller after focus/traceback hooks
  const focusedUserIdRef = useRef<string | null>(null);
  const activeFocusedEntriesRef = useRef<TreeEntry[]>([]);
  const closeVtuberIdsRef = useRef<ReadonlyMap<string, Set<string>>>(new Map());
  const closeEdgePathsRef = useRef<ReadonlySet<string>>(new Set());

  // Helper: panTo with current insets
  const panToWithInsets = useCallback((x: number, y: number, scale?: number) => {
    const [, l, r, b, t] = cameraInsetsRef.current;
    canvasRef.current?.panTo(x, y, scale ?? null, l, r, b, t);
  }, [canvasRef]);

  // Centralized camera scheduling
  const scheduleCamera = useCallback((fn: () => void, delay: number) => {
    if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    cameraTimerRef.current = setTimeout(() => {
      cameraTimerRef.current = null;
      fn();
    }, delay);
  }, []);

  // scheduleCameraFit — reads from refs so it doesn't need re-creation when focus/traceback change
  const scheduleCameraFit = useCallback((fitAll = false, scopeTree: ActiveTree | null = null) => {
    scheduleCamera(() => {
      const currentNodes = nodesRef.current;
      if (!currentNodes?.length) return;

      const fuid = focusedUserIdRef.current;
      const afe = activeFocusedEntriesRef.current;
      const cvIds = closeVtuberIdsRef.current;
      const cePaths = closeEdgePathsRef.current;

      const inScope = (n: LayoutNode): boolean => {
        if (!scopeTree) return true;
        const isFict = (n.data._pathKey || '').startsWith('__F__');
        return scopeTree === 'fictional' ? isFict : !isFict;
      };

      // Try fitting to close vtubers when focused
      let bounds = null;
      if (!fitAll && fuid && cvIds.size > 0) {
        const activeEntry = afe[0];
        const activePathKey = activeEntry ? entryToVtuberPathKey(activeEntry) : null;
        bounds = computeNodeBounds(currentNodes, (n) => {
          if (!inScope(n as LayoutNode)) return false;
          const pk = n.data._pathKey || '';
          const nd = (n as LayoutNode).data;
          const isVtuberMatch = nd._vtuber && (
            (activePathKey && pk === activePathKey) ||
            cvIds.get(nd._userId ?? '')?.has(nd._entry?.fictional_path || nd._entry?.taxon_path || '')
          );
          const isEdgeNode = cePaths.size > 0 && cePaths.has(pk);
          return !!(isVtuberMatch || isEdgeNode);
        });
      }

      // If no close vtubers found, pan to focused user's active entry
      if (!bounds && !fitAll && fuid) {
        const activeEntry = afe[0];
        if (activeEntry) {
          const activePathKey = entryToVtuberPathKey(activeEntry);
          const focusedNode = currentNodes.find(n => n.data._pathKey === activePathKey);
          if (focusedNode) {
            panToWithInsets(focusedNode.x, focusedNode.y);
            return;
          }
        }
      }

      // Fall back to all nodes (optionally scoped to a tree)
      if (!bounds) {
        bounds = computeNodeBounds(currentNodes, scopeTree
          ? (n) => inScope(n as LayoutNode)
          : undefined,
        );
      }

      if (!bounds) return;
      canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
    }, 300);
  }, [scheduleCamera, canvasRef, nodesRef, panToWithInsets]);

  // ── Fit handlers ──
  const handleFitReal = useCallback(() => {
    const bounds = computeNodeBounds(nodesRef.current, n => !(n.data._pathKey || '').startsWith('__F__'));
    if (bounds) canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
  }, [canvasRef, nodesRef]);

  const handleFitFictional = useCallback(() => {
    const bounds = computeNodeBounds(nodesRef.current, n => (n.data._pathKey || '').startsWith('__F__'));
    if (bounds) canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
  }, [canvasRef, nodesRef]);

  const handleFitAll = useCallback(() => {
    const bounds = computeNodeBounds(nodesRef.current);
    if (bounds) canvasRef.current?.fitBounds(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, ...cameraInsetsRef.current);
  }, [canvasRef, nodesRef]);

  // Select tree + fit to it
  const handleSelectTree = useCallback((tree: ActiveTree, setActiveTree: (t: ActiveTree) => void) => {
    setActiveTree(tree);
    if (tree === 'real') handleFitReal();
    else handleFitFictional();
  }, [handleFitReal, handleFitFictional]);

  // Shuffle camera: pan to root of active tree
  const handleShuffleWithCamera = useCallback((handleShuffle: () => void, activeTree: ActiveTree) => {
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
  }, [scheduleCamera, canvasRef, nodesRef]);

  // Timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraTimerRef.current) clearTimeout(cameraTimerRef.current);
    };
  }, []);

  return {
    cameraInsetsRef,
    cameraTimerRef,
    initialFitDone,
    panToWithInsets,
    scheduleCamera,
    scheduleCameraFit,
    handleFitReal,
    handleFitFictional,
    handleFitAll,
    handleSelectTree,
    handleShuffleWithCamera,
    // Late-bound refs for caller to update
    focusedUserIdRef,
    activeFocusedEntriesRef,
    closeVtuberIdsRef,
    closeEdgePathsRef,
  };
}
