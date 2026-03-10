import { useRef, useState, useEffect } from 'react';

const ANIM_DURATION = 300; // ms

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates node positions when the node array changes.
 * Returns { positionMap, isAnimating } where positionMap is
 * Map<pathKey, {x,y}> of interpolated positions during animation.
 */
export default function useNodeAnimation(nodes) {
  const prevPosRef = useRef(new Map());
  const animRef = useRef(null);
  const [positionMap, setPositionMap] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const prev = prevPosRef.current;
    const targets = new Map();
    const starts = new Map();
    let hasMotion = false;

    for (const node of nodes) {
      const key = node.data._pathKey;
      if (!key) continue;
      targets.set(key, { x: node.x, y: node.y });

      if (prev.has(key)) {
        const p = prev.get(key);
        if (Math.abs(p.x - node.x) > 0.5 || Math.abs(p.y - node.y) > 0.5) {
          starts.set(key, { x: p.x, y: p.y });
          hasMotion = true;
        }
      } else {
        // New node — try to start from parent position
        const parts = key.split('|');
        let parentKey = null;
        if (parts.length > 1) {
          // Remove last segment to get parent key
          if (parts[parts.length - 1].startsWith('__vtuber__') || parts[parts.length - 1].startsWith('__breed__')) {
            parentKey = parts.slice(0, -1).join('|');
          } else {
            parentKey = parts.slice(0, -1).join('|');
          }
        }
        if (parentKey && prev.has(parentKey)) {
          starts.set(key, { ...prev.get(parentKey) });
          hasMotion = true;
        }
      }
    }

    // Update previous positions for next time (only keep current nodes, discarding stale entries)
    prevPosRef.current = targets;

    if (!hasMotion) {
      setPositionMap(null);
      setIsAnimating(false);
      return;
    }

    // Cancel any running animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const startTime = performance.now();
    setIsAnimating(true);

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / ANIM_DURATION, 1);
      const eased = easeOutCubic(t);

      const map = new Map();
      for (const [key, target] of targets) {
        if (starts.has(key)) {
          const s = starts.get(key);
          map.set(key, {
            x: s.x + (target.x - s.x) * eased,
            y: s.y + (target.y - s.y) * eased,
          });
        }
        // Nodes without animation use their real position (no entry in map)
      }

      setPositionMap(map);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
        setPositionMap(null);
        setIsAnimating(false);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [nodes]);

  return { positionMap, isAnimating };
}
