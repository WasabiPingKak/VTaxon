import { useState, useCallback, useRef } from 'react';

/**
 * Manages hover and click interactions for graph nodes.
 * Performs hit-testing against node positions and shapes.
 */
export default function useGraphInteraction(nodes) {
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
        // Diamond 14px — AABB test
        if (Math.abs(dx) + Math.abs(dy) <= 18) return node;
      } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES') {
        // Rounded rect 70×26 — AABB
        if (Math.abs(dx) <= 39 && Math.abs(dy) <= 17) return node;
      } else {
        // Circle — radius scales with count
        const count = d._count || 0;
        const r = Math.min(5 + Math.sqrt(count) * 2.5, 14) + 4;
        if (dx * dx + dy * dy <= r * r) return node;
      }
    }
    return null;
  }, [nodes]);

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
