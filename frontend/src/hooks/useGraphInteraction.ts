import { useState, useCallback, useRef, useMemo } from 'react';
import { taxonomyNodeRadius } from '../components/graph/renderers.js';
import type { LayoutNode } from '../types/graph';

/**
 * Spatial hash grid for O(1) hit testing.
 * Divides world space into cells and indexes nodes by cell.
 */
const CELL_SIZE = 80; // world pixels per cell

function cellKey(cx: number, cy: number): number {
  return cx * 100003 + cy; // fast numeric key (avoids string concat)
}

function buildSpatialIndex(nodes: LayoutNode[]): Map<number, number[]> {
  const grid = new Map<number, number[]>();

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const cx = Math.floor(node.x / CELL_SIZE);
    const cy = Math.floor(node.y / CELL_SIZE);
    const key = cellKey(cx, cy);

    let bucket = grid.get(key);
    if (!bucket) { bucket = []; grid.set(key, bucket); }
    bucket.push(i);
  }

  return grid;
}

interface HitResult {
  node: LayoutNode | null;
  isBadge: boolean;
}

interface UseGraphInteractionReturn {
  hoveredNode: LayoutNode | null;
  hoveredBadgeNode: LayoutNode | null;
  handleHover: (worldX: number, worldY: number) => void;
  handleClick: (worldX: number, worldY: number) => LayoutNode | null;
}

/**
 * Manages hover and click interactions for graph nodes.
 * Uses spatial hash for fast hit-testing instead of O(n) linear scan.
 */
export default function useGraphInteraction(nodes: LayoutNode[] | null, maxCount: number): UseGraphInteractionReturn {
  const [hoveredNode, setHoveredNode] = useState<LayoutNode | null>(null);
  const [hoveredBadgeNode, setHoveredBadgeNode] = useState<LayoutNode | null>(null);
  const lastHitRef = useRef<LayoutNode | null>(null);
  const lastBadgeRef = useRef<boolean>(false);

  // Build spatial index when nodes change
  const spatialIndex = useMemo(() => {
    if (!nodes || nodes.length === 0) return null;
    return buildSpatialIndex(nodes);
  }, [nodes]);

  const hitTest = useCallback((worldX: number, worldY: number): HitResult => {
    if (!nodes || nodes.length === 0 || !spatialIndex) return { node: null, isBadge: false };

    const cx = Math.floor(worldX / CELL_SIZE);
    const cy = Math.floor(worldY / CELL_SIZE);

    // Collect unique candidate indices from 3×3 neighborhood
    // (a node may appear in multiple cells via different grid squares)
    const seen = new Set<number>();
    const candidates: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = spatialIndex.get(cellKey(cx + dx, cy + dy));
        if (!bucket) continue;
        for (let j = 0; j < bucket.length; j++) {
          const idx = bucket[j];
          if (!seen.has(idx)) {
            seen.add(idx);
            candidates.push(idx);
          }
        }
      }
    }

    // First pass: check budget badge hit areas (set at render time, not index time)
    for (let j = candidates.length - 1; j >= 0; j--) {
      const bb = nodes[candidates[j]].data._budgetBadgeBounds;
      if (bb && worldX >= bb.x && worldX <= bb.x + bb.w && worldY >= bb.y && worldY <= bb.y + bb.h) {
        return { node: nodes[candidates[j]], isBadge: true };
      }
    }

    // Second pass: normal node hit-test
    // Track highest-index hit for correct z-ordering (higher index = drawn on top)
    let bestHit: LayoutNode | null = null;
    let bestIdx = -1;

    for (let j = 0; j < candidates.length; j++) {
      const idx = candidates[j];
      if (idx < bestIdx) continue; // skip lower z-order

      const node = nodes[idx];
      const d = node.data;
      const ndx = worldX - node.x;
      const ndy = worldY - node.y;

      let hit = false;
      if (d._isSplitGroup) {
        continue; // invisible branch points are not interactive
      } else if (d._vtuber && d._visualTier === 'dot') {
        hit = ndx * ndx + ndy * ndy <= 100; // r=10
      } else if (d._vtuber) {
        hit = ndx * ndx + ndy * ndy <= 576; // r=24
      } else if (d._rank === 'BREED') {
        const bHalfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 34;
        const bHalfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 16;
        hit = Math.abs(ndx) <= bHalfW && Math.abs(ndy) <= bHalfH;
      } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES' || d._rank === 'FORM' || d._rank === 'F_SPECIES') {
        const halfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 39;
        const halfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 17;
        hit = Math.abs(ndx) <= halfW && Math.abs(ndy) <= halfH;
      } else {
        const count = d._count || 0;
        const r = taxonomyNodeRadius(count, maxCount) + 4;
        hit = ndx * ndx + ndy * ndy <= r * r;
      }

      if (hit) {
        bestHit = node;
        bestIdx = idx;
      }
    }

    return { node: bestHit, isBadge: false };
  }, [nodes, maxCount, spatialIndex]);

  const handleHover = useCallback((worldX: number, worldY: number) => {
    const { node: hit, isBadge } = hitTest(worldX, worldY);
    if (hit !== lastHitRef.current || isBadge !== lastBadgeRef.current) {
      lastHitRef.current = hit;
      lastBadgeRef.current = isBadge;
      // When hovering on badge, don't set hoveredNode (so parent node doesn't glow)
      setHoveredNode(isBadge ? null : hit);
      setHoveredBadgeNode(isBadge ? hit : null);
    }
  }, [hitTest]);

  const handleClick = useCallback((worldX: number, worldY: number): LayoutNode | null => {
    return hitTest(worldX, worldY).node;
  }, [hitTest]);

  return { hoveredNode, hoveredBadgeNode, handleHover, handleClick };
}
