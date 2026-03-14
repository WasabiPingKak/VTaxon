import { useState, useCallback, useRef } from 'react';
import { taxonomyNodeRadius } from '../components/graph/renderers.js';

/**
 * Manages hover and click interactions for graph nodes.
 * Performs hit-testing against node positions and shapes.
 */
export default function useGraphInteraction(nodes, maxCount) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredBadgeNode, setHoveredBadgeNode] = useState(null);
  const lastHitRef = useRef(null);
  const lastBadgeRef = useRef(false);

  const hitTest = useCallback((worldX, worldY) => {
    if (!nodes || nodes.length === 0) return { node: null, isBadge: false };

    // First pass: check budget badge hit areas (they sit below the node)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const bb = nodes[i].data._budgetBadgeBounds;
      if (bb && worldX >= bb.x && worldX <= bb.x + bb.w && worldY >= bb.y && worldY <= bb.y + bb.h) {
        return { node: nodes[i], isBadge: true };
      }
    }

    // Second pass: normal node hit-test in reverse so top-drawn nodes are hit first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const d = node.data;
      const dx = worldX - node.x;
      const dy = worldY - node.y;

      if (d._vtuber && d._visualTier === 'dot') {
        // Dot-tier vtuber — small circle r=10
        if (dx * dx + dy * dy <= 10 * 10) return { node, isBadge: false };
      } else if (d._vtuber) {
        // Hexagon — approximate with circle r=24
        if (dx * dx + dy * dy <= 24 * 24) return { node, isBadge: false };
      } else if (d._rank === 'BREED') {
        // Rounded rect — AABB test
        const bHalfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 34;
        const bHalfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 16;
        if (Math.abs(dx) <= bHalfW && Math.abs(dy) <= bHalfH) return { node, isBadge: false };
      } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES' || d._rank === 'FORM' || d._rank === 'F_SPECIES') {
        // Rounded rect 70×26 — AABB
        const halfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 39;
        const halfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 17;
        if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) return { node, isBadge: false };
      } else {
        // Circle — area-proportional radius
        const count = d._count || 0;
        const r = taxonomyNodeRadius(count, maxCount) + 4;
        if (dx * dx + dy * dy <= r * r) return { node, isBadge: false };
      }
    }
    return { node: null, isBadge: false };
  }, [nodes, maxCount]);

  const handleHover = useCallback((worldX, worldY) => {
    const { node: hit, isBadge } = hitTest(worldX, worldY);
    if (hit !== lastHitRef.current || isBadge !== lastBadgeRef.current) {
      lastHitRef.current = hit;
      lastBadgeRef.current = isBadge;
      // When hovering on badge, don't set hoveredNode (so parent node doesn't glow)
      setHoveredNode(isBadge ? null : hit);
      setHoveredBadgeNode(isBadge ? hit : null);
    }
  }, [hitTest]);

  const handleClick = useCallback((worldX, worldY) => {
    return hitTest(worldX, worldY).node;
  }, [hitTest]);

  return { hoveredNode, hoveredBadgeNode, handleHover, handleClick };
}
