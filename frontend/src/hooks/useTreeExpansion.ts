import { useState, useCallback, useRef } from 'react';
import type { TreeEntry, ActiveTree } from '../types';
import type { TaxonomyTreeNode } from '../types/tree';
import { findNode, autoExpandPaths, collectAllPaths, collectAllFictionalPaths } from '../lib/treeUtils';
import type useTreeLayout from './useTreeLayout';

type LayoutNode = ReturnType<typeof useTreeLayout>['nodes'][number];

export interface UseTreeExpansionOptions {
  rootData: TaxonomyTreeNode | null;
  fictionalRootData: TaxonomyTreeNode | null;
  entries: TreeEntry[] | null;
  fictionalEntries: TreeEntry[] | null;
  activeTree: ActiveTree;
  nodesRef: React.MutableRefObject<LayoutNode[]>;
  canvasRef: React.RefObject<{ fitBounds: (minX: number, minY: number, maxX: number, maxY: number, ...insets: number[]) => void; } | null>;
  cameraInsetsRef: React.RefObject<[number, number, number, number, number]>;
  scheduleCamera: (fn: () => void, delay: number) => void;
  scheduleCameraFit: (fitAll?: boolean, scopeTree?: ActiveTree | null) => void;
  panToWithInsets: (x: number, y: number, scale?: number) => void;
}

export interface UseTreeExpansionReturn {
  expandedSet: Set<string>;
  setExpandedSet: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandedBudgetGroups: Set<string>;
  setExpandedBudgetGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleActionRef: React.MutableRefObject<'expand' | 'collapse' | null>;
  handleToggle: (pathKey: string) => void;
  handleExpandAll: (treeKey?: string) => void;
  handleCollapseAll: (treeKey?: string) => void;
  handleExpandBothTrees: () => void;
  expandBudgetGroupsForUser: (userId: string) => void;
  /** Ref for rootData — update from parent after layout is computed. */
  rootDataRef: React.MutableRefObject<TaxonomyTreeNode | null>;
  /** Ref for fictionalRootData — update from parent after layout is computed. */
  fictionalRootDataRef: React.MutableRefObject<TaxonomyTreeNode | null>;
  /** Ref for scheduleCameraFit — update from parent after it's defined. */
  scheduleCameraFitRef: React.MutableRefObject<(fitAll?: boolean, scopeTree?: ActiveTree | null) => void>;
}

export default function useTreeExpansion({
  rootData,
  fictionalRootData,
  entries,
  fictionalEntries,
  activeTree,
  nodesRef,
  canvasRef,
  cameraInsetsRef,
  scheduleCamera,
  scheduleCameraFit,
  panToWithInsets,
}: UseTreeExpansionOptions): UseTreeExpansionReturn {
  const [expandedSet, setExpandedSet] = useState<Set<string>>(new Set());
  const [expandedBudgetGroups, setExpandedBudgetGroups] = useState<Set<string>>(new Set());
  const toggleActionRef = useRef<'expand' | 'collapse' | null>(null);

  // Use refs for values that change after hook initialization (rootData comes from layout which runs after this hook)
  const rootDataRef = useRef(rootData);
  rootDataRef.current = rootData;
  const fictionalRootDataRef = useRef(fictionalRootData);
  fictionalRootDataRef.current = fictionalRootData;
  const scheduleCameraFitRef = useRef(scheduleCameraFit);
  scheduleCameraFitRef.current = scheduleCameraFit;

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
        const treeRoot = pathKey.startsWith('__F__') ? fictionalRootDataRef.current : rootDataRef.current;
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
          canvasRef.current?.fitBounds(minX, minY, maxX, maxY, ...cameraInsetsRef.current!);
        }
      } else {
        const targetNode = currentNodes.find(n => n.data._pathKey === pathKey);
        if (targetNode) {
          panToWithInsets(targetNode.x, targetNode.y);
        }
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- uses refs for rootData/fictionalRootData, panToWithInsets is stable
  }, [scheduleCamera]);

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
    scheduleCameraFitRef.current(true, target as ActiveTree);
  }, [entries, fictionalEntries, activeTree]);

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
    scheduleCameraFitRef.current(true, target as ActiveTree);
  }, [activeTree]);

  const handleExpandBothTrees = useCallback(() => {
    const all = entries ? collectAllPaths(entries) : new Set<string>();
    if (fictionalEntries) {
      for (const p of collectAllFictionalPaths(fictionalEntries)) all.add(p);
    }
    setExpandedSet(all);
    scheduleCameraFitRef.current(true);
  }, [entries, fictionalEntries]);

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

  return {
    expandedSet,
    setExpandedSet,
    expandedBudgetGroups,
    setExpandedBudgetGroups,
    toggleActionRef,
    handleToggle,
    handleExpandAll,
    handleCollapseAll,
    handleExpandBothTrees,
    expandBudgetGroupsForUser,
    rootDataRef,
    fictionalRootDataRef,
    scheduleCameraFitRef,
  };
}
