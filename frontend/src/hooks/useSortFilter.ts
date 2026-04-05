import { useState, useMemo, useCallback } from 'react';
import type { TreeEntry, TreeFilters, TreeFacets, ActiveTree, SortKey, SortOrder } from '../types';
import { filterEntries, computeFacets, emptyFilters, countActiveFilters } from '../lib/treeFilters';
import { collectAllPaths, collectAllFictionalPaths } from '../lib/treeUtils';
import {
  applyLiveDedup,
  computeLiveCount,
  buildSortConfigs,
  getDailyHash,
  type SortConfig,
} from '../lib/graphLogic';

export interface UseSortFilterOptions {
  entries: TreeEntry[] | null;
  fictionalEntries: TreeEntry[] | null;
  liveUserIds: Set<string>;
  livePrimaries: Map<string, { real?: string; fictional?: string }>;
  activeTree: ActiveTree;
  /** Called after filter change to expand matching paths & flash nodes. */
  onFiltersApplied?: (realPaths: Set<string>, fictPaths: Set<string>, filteredReal: TreeEntry[], filteredFict: TreeEntry[]) => void;
  /** Called after live filter toggle to expand live paths. */
  onLiveFilterExpand?: (realPaths: Set<string>, fictPaths: Set<string>) => void;
  scheduleCameraFit: (fitAll?: boolean, scopeTree?: ActiveTree | null) => void;
}

export interface UseSortFilterReturn {
  // Derived entries
  filteredEntries: TreeEntry[];
  filteredFictionalEntries: TreeEntry[];
  finalEntries: TreeEntry[];
  finalFictionalEntries: TreeEntry[];
  facets: TreeFacets;
  liveCount: number;
  realSortConfig: SortConfig;
  fictSortConfig: SortConfig;
  // State
  sortKey: SortKey;
  sortOrder: SortOrder;
  shuffleSeed: number | null;
  filters: TreeFilters;
  filterPanelOpen: boolean;
  liveFilterActive: boolean;
  toolbarExpanded: boolean;
  showDescription: boolean;
  activeFilterCount: number;
  totalBadgeCount: number;
  // Setters
  setFilterPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setToolbarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDescription: React.Dispatch<React.SetStateAction<boolean>>;
  // Handlers
  handleSortChange: (key: SortKey, order: SortOrder) => void;
  handleShuffle: () => void;
  handleFiltersChange: (newFilters: TreeFilters) => void;
  handleLiveFilterToggle: () => void;
}

export default function useSortFilter({
  entries,
  fictionalEntries,
  liveUserIds,
  livePrimaries,
  activeTree,
  onFiltersApplied,
  onLiveFilterExpand,
  scheduleCameraFit,
}: UseSortFilterOptions): UseSortFilterReturn {
  const [sortKey, setSortKey] = useState<SortKey>('active_first');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [filters, setFilters] = useState<TreeFilters>(() => emptyFilters());
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [liveFilterActive, setLiveFilterActive] = useState(false);
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [showDescription, setShowDescription] = useState(true);

  // Filtered entries
  const filteredEntries = useMemo(() =>
    filterEntries(entries, filters), [entries, filters]);
  const filteredFictionalEntries = useMemo(() =>
    filterEntries(fictionalEntries, filters), [fictionalEntries, filters]);

  // Live dedup
  const finalEntries = useMemo(() =>
    liveFilterActive ? applyLiveDedup(filteredEntries, liveUserIds, livePrimaries, 'real') : filteredEntries,
    [filteredEntries, liveFilterActive, liveUserIds, livePrimaries]);

  const finalFictionalEntries = useMemo(() =>
    liveFilterActive ? applyLiveDedup(filteredFictionalEntries, liveUserIds, livePrimaries, 'fictional') : filteredFictionalEntries,
    [filteredFictionalEntries, liveFilterActive, liveUserIds, livePrimaries]);

  // Live count
  const liveCount = useMemo(() =>
    computeLiveCount(entries, fictionalEntries, liveUserIds),
    [entries, fictionalEntries, liveUserIds]);

  // Facets
  const facets = useMemo(() => {
    const all = [...(entries || []), ...(fictionalEntries || [])];
    return computeFacets(all);
  }, [entries, fictionalEntries]);

  // Sort configs
  const { realSortConfig, fictSortConfig } = useMemo(() =>
    buildSortConfigs(sortKey, sortOrder, shuffleSeed, liveUserIds, activeTree),
    [sortKey, sortOrder, shuffleSeed, liveUserIds, activeTree]);

  // Badge counts
  const activeFilterCount = countActiveFilters(filters);
  const hasSortBadge = (sortKey === 'debut_date' || sortKey === 'created_at' || sortKey === 'active_first') ? 2 : 0;
  const totalBadgeCount = activeFilterCount + hasSortBadge;

  // Handlers
  const handleSortChange = useCallback((key: SortKey, order: SortOrder) => {
    setSortKey(key);
    setSortOrder(order);
    setShuffleSeed(null);
  }, []);

  const handleShuffle = useCallback(() => {
    setShuffleSeed(s => s != null ? null : getDailyHash());
  }, []);

  const handleFiltersChange = useCallback((newFilters: TreeFilters) => {
    setFilters(newFilters);

    const fr = filterEntries(entries, newFilters);
    const ff = filterEntries(fictionalEntries, newFilters);
    const hasAny = countActiveFilters(newFilters) > 0;

    if (hasAny) {
      const realPaths = fr && fr.length > 0 ? collectAllPaths(fr) : new Set<string>();
      const fictPaths = ff && ff.length > 0 ? collectAllFictionalPaths(ff) : new Set<string>();
      onFiltersApplied?.(realPaths, fictPaths, fr, ff);
    } else {
      onFiltersApplied?.(new Set(), new Set(), fr, ff);
    }

    scheduleCameraFit(true, null);
  }, [entries, fictionalEntries, scheduleCameraFit, onFiltersApplied]);

  const handleLiveFilterToggle = useCallback(() => {
    setLiveFilterActive(prev => {
      const next = !prev;
      if (next) {
        const liveReal = (filteredEntries || []).filter(e => liveUserIds.has(e.user_id));
        const liveFict = (filteredFictionalEntries || []).filter(e => liveUserIds.has(e.user_id));
        const realPaths = liveReal.length > 0 ? collectAllPaths(liveReal) : new Set<string>();
        const fictPaths = liveFict.length > 0 ? collectAllFictionalPaths(liveFict) : new Set<string>();
        onLiveFilterExpand?.(realPaths, fictPaths);
        scheduleCameraFit(true, null);
      }
      return next;
    });
  }, [filteredEntries, filteredFictionalEntries, liveUserIds, scheduleCameraFit, onLiveFilterExpand]);

  return {
    filteredEntries,
    filteredFictionalEntries,
    finalEntries,
    finalFictionalEntries,
    facets,
    liveCount,
    realSortConfig,
    fictSortConfig,
    sortKey,
    sortOrder,
    shuffleSeed,
    filters,
    filterPanelOpen,
    liveFilterActive,
    toolbarExpanded,
    showDescription,
    activeFilterCount,
    totalBadgeCount,
    setFilterPanelOpen,
    setToolbarExpanded,
    setShowDescription,
    handleSortChange,
    handleShuffle,
    handleFiltersChange,
    handleLiveFilterToggle,
  };
}
