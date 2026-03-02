import { useState, useCallback, useRef } from 'react';
import { taxonomyNodeRadius } from '../components/graph/renderers.js';

/**
 * Manages hover and click interactions for graph nodes.
 * Performs hit-testing against node positions and shapes.
 */
export default function useGraphInteraction(nodes, maxCount) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const lastHitRef = useRef(null);

  const hitTest = useCallback((worldX, worldY) => {
    if (!nodes || nodes.length === 0) return null;

    // Iterate in reverse so top-drawn nodes are hit first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const d = node.data;
      const dx = worldX - node.x;
      const dy = worldY - node.y;

      if (d._vtuber) {
        // Hexagon — approximate with circle r=24
        if (dx * dx + dy * dy <= 24 * 24) return node;
      } else if (d._rank === 'BREED') {
        // Rounded rect — AABB test
        const bHalfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 34;
        const bHalfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 16;
        if (Math.abs(dx) <= bHalfW && Math.abs(dy) <= bHalfH) return node;
      } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES') {
        // Rounded rect 70×26 — AABB
        const halfW = d._nodeWidth ? d._nodeWidth / 2 + 4 : 39;
        const halfH = d._nodeHeight ? d._nodeHeight / 2 + 4 : 17;
        if (Math.abs(dx) <= halfW && Math.abs(dy) <= halfH) return node;
      } else {
        // Circle — area-proportional radius
        const count = d._count || 0;
        const r = taxonomyNodeRadius(count, maxCount) + 4;
        if (dx * dx + dy * dy <= r * r) return node;
      }
    }
    return null;
  }, [nodes, maxCount]);

  const handleHover = useCallback((worldX, worldY) => {
    const hit = hitTest(worldX, worldY);
    if (hit !== lastHitRef.current) {
      lastHitRef.current = hit;
      setHoveredNode(hit);
    }
  }, [hitTest]);

  const handleClick = useCallback((worldX, worldY) => {
    return hitTest(worldX, worldY);
  }, [hitTest]);

  return { hoveredNode, handleHover, handleClick };
}
