import type { LayoutNode } from '../../../types/graph';
import type { TreeFilters, SortKey } from '../../../types/tree';

/** Position entry from animation system. */
export interface AnimatedPosition {
  x: number;
  y: number;
}

/** Edge between two LayoutNodes. */
export interface LayoutEdge {
  source: LayoutNode;
  target: LayoutNode;
}

/** Transform for the canvas. */
export interface DrawTransform {
  x: number;
  y: number;
  scale: number;
}

/** Canvas size. */
export interface DrawCanvasSize {
  width: number;
  height: number;
}

/** The state/options bag passed to drawGraph and child functions. */
export interface DrawGraphState {
  starField?: HTMLCanvasElement | null;
  positionMap?: Map<string, AnimatedPosition> | null;
  maxCount?: number;
  hoveredNode?: LayoutNode | null;
  hoveredBadgeNode?: LayoutNode | null;
  focusedUserId?: string | null;
  closeVtuberIds?: Map<string, Set<string>> | null;
  closeEdgePaths?: Set<string> | null;
  liveUserIds?: Set<string> | null;
  imageCache?: Map<string, HTMLImageElement> | null;
  flashMap?: Map<string, number> | null;
  edgeFlashStart?: number | null;
  activeFilters?: TreeFilters | null;
  sortKey?: SortKey | string;
}

export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PlatformIconPath {
  d: string;
  fill: string;
}

export interface PlatformIcon {
  paths: PlatformIconPath[];
}
