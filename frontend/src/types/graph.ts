// ── Canvas rendering and graph interaction types ──

import type { HierarchyPointNode } from 'd3-hierarchy';

/** Color definition for a taxonomy rank. */
export interface RankColorDef {
  node: string;
  glow: string;
}

/** D3 zoom transform. */
export interface Transform {
  x: number;
  y: number;
  k: number;
}

/** Canvas dimensions. */
export interface CanvasSize {
  width: number;
  height: number;
}

/** A filter/sort badge displayed on vtuber nodes. */
export interface FilterBadge {
  label?: string;
  color?: string;
  bg: string;
  isPlatform?: boolean;
  platform?: string;
  isCountry?: boolean;
  countryCode?: string;
}

/** Badge config for a single value in a filter dimension. */
export interface FilterBadgeConfig {
  label: string;
  color: string;
  bg: string;
  isPlatform?: boolean;
  platform?: string;
}

/** Live stream info from /live-status endpoint. */
export interface LiveStreamInfo {
  user_id: string;
  provider: string;
  stream_title?: string;
  stream_url?: string;
  started_at?: string;
  is_primary?: boolean;
}

/**
 * Extended data attached to each D3 hierarchy node during layout.
 * These fields are added by useTreeLayout.
 */
export interface LayoutNodeData {
  name: string;
  nameZh: string;
  rank: string;
  pathKey: string;
  count: number;
  // Layout metadata (prefixed with _ by useTreeLayout)
  _rank?: string;
  _vtuber?: boolean;
  _name?: string;
  _nameZh?: string;
  _displayName?: string;
  _visualTier?: string;
  _labelLines?: string[];
  _labelHalfW?: number;
  _labelBottomH?: number;
  _hasHiddenChildren?: boolean;
  _count?: number;
  _inGrid?: boolean;
  _inBreedGrid?: boolean;
  _pathKey?: string;
  _avatarUrl?: string | null;
  _userId?: string;
  _countryFlags?: string[];
  _platforms?: string[];
  _isLivePrimary?: boolean;
  _isCurrentUser?: boolean;
  _entry?: import('./tree').TreeEntry;
  _gridParentPathKey?: string;
  _gridIndex?: number;
  _gridCols?: number;
  _gridRows?: number;
  _gridCount?: number;
  _hiddenCount?: number;
  _hiddenVtuberCount?: number;
  _budgetGroupKey?: string | null;
  _collapsedNodePaths?: string[];
  _collapsedNodeData?: Array<{
    pathKey: string;
    name: string;
    nameZh: string;
    rank: string;
    count: number;
  }>;
  _nodeWidth?: number;
  _nodeHeight?: number;
  _budgetBadgeBounds?: { x: number; y: number; w: number; h: number };
  _gridBarY?: number;
  _breedGridRow?: number;
  _extLeft?: number;
  _extRight?: number;
  // D3 hierarchy fields (optional since they're added by d3)
  children?: LayoutNode[];
  parent?: LayoutNode | null;
}

export type LayoutNode = HierarchyPointNode<LayoutNodeData>;
