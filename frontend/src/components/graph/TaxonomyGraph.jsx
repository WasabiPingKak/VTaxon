import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import { computeHighlightPaths, collectPathsToDepth, collectAllPaths, findNode } from '../../lib/treeUtils';
import GraphCanvas from './GraphCanvas';
import { drawGraph, createStarField } from './renderers';
import useTreeLayout from '../../hooks/useTreeLayout';
import useGraphInteraction from '../../hooks/useGraphInteraction';
import useImagePreloader from '../../hooks/useImagePreloader';
import VtuberDetailPanel from '../VtuberDetailPanel';
import FloatingToolbar from './FloatingToolbar';

export default function TaxonomyGraph({ currentUser }) {
  const canvasRef = useRef(null);
  const starFieldRef = useRef(null);
  const initialFitDone = useRef(false);

  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSet, setExpandedSet] = useState(new Set());
  const [selectedVtuber, setSelectedVtuber] = useState(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    api.getTaxonomyTree()
      .then(data => {
        if (cancelled) return;
        const e = data.entries || [];
        setEntries(e);

        // Default expand to ORDER depth (~4 levels)
        const defaultExpanded = collectPathsToDepth(e, 4);

        // Also expand current user's paths
        if (currentUser) {
          const userPaths = computeHighlightPaths(e, currentUser.id);
          for (const p of userPaths) defaultExpanded.add(p);
        }

        setExpandedSet(defaultExpanded);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser]);

  // d3 layout
  const { nodes, edges, bounds, rootData } = useTreeLayout(
    entries, expandedSet, currentUser?.id,
  );

  // Interaction
  const { hoveredNode, handleHover, handleClick: hitTestClick } = useGraphInteraction(nodes);

  // Image preloader
  const imageCacheRef = useImagePreloader(entries);

  // Star field (generate once)
  useEffect(() => {
    starFieldRef.current = createStarField(2000, 2000);
  }, []);

  // Fit view on first layout
  useEffect(() => {
    if (initialFitDone.current || !bounds || nodes.length === 0) return;
    initialFitDone.current = true;

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    // Compute a scale that fits the whole tree
    // We'll use a moderate default scale
    setTimeout(() => {
      canvasRef.current?.fitView(centerX, centerY, 0.5);

      // If logged in, pan to user's node after a beat
      if (currentUser && entries) {
        const userEntry = entries.find(e => e.user_id === currentUser.id);
        if (userEntry) {
          const userPathKey = `${userEntry.taxon_path}|__vtuber__${userEntry.user_id}`;
          const userNode = nodes.find(n => n.data._pathKey === userPathKey);
          if (userNode) {
            setTimeout(() => {
              canvasRef.current?.panTo(userNode.x, userNode.y, 0.8);
            }, 800);
          }
        }
      }
    }, 100);
  }, [bounds, nodes, currentUser, entries]);

  // Toggle expand/collapse
  const handleToggle = useCallback((pathKey) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        // Collapse — also collapse all descendants
        for (const key of prev) {
          if (key.startsWith(pathKey + '|') || key === pathKey) {
            next.delete(key);
          }
        }
      } else {
        next.add(pathKey);
        // Auto-drill through single-child empty nodes
        if (rootData) {
          let node = findNode(rootData, pathKey);
          while (node && node.vtubers.length === 0 && node.children.size === 1) {
            const child = [...node.children.values()][0];
            next.add(child.pathKey);
            node = child;
          }
        }
      }
      return next;
    });
  }, [rootData]);

  // Expand all / collapse all
  const handleExpandAll = useCallback(() => {
    if (entries) setExpandedSet(collectAllPaths(entries));
  }, [entries]);

  const handleCollapseAll = useCallback(() => {
    setExpandedSet(new Set());
  }, []);

  // Canvas click handler
  const onCanvasClick = useCallback((worldX, worldY) => {
    const hit = hitTestClick(worldX, worldY);
    if (!hit) return;

    if (hit.data._vtuber) {
      setSelectedVtuber(hit.data._entry);
    } else if (hit.data._pathKey) {
      handleToggle(hit.data._pathKey);
    }
  }, [hitTestClick, handleToggle]);

  // Render callback
  const renderState = useMemo(() => ({
    hoveredNode,
    imageCache: imageCacheRef.current,
    starField: starFieldRef.current,
  }), [hoveredNode, imageCacheRef]);

  const onRender = useCallback((ctx, transform, canvasSize) => {
    drawGraph(ctx, nodes, edges, transform, canvasSize, renderState);
  }, [nodes, edges, renderState]);

  // Trigger re-render when hover changes + update cursor
  useEffect(() => {
    canvasRef.current?.requestRender();
    const canvas = canvasRef.current?.getCanvas();
    if (canvas) {
      canvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
    }
  }, [hoveredNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSelectedVtuber(null);
      } else if (e.key === 'Home') {
        const cx = bounds ? (bounds.minX + bounds.maxX) / 2 : 0;
        const cy = bounds ? (bounds.minY + bounds.maxY) / 2 : 0;
        canvasRef.current?.fitView(cx, cy, 0.5);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bounds]);

  // Loading state
  if (loading) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '1.1em',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <div style={{ marginTop: 16 }}>正在載入分類樹…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#f87171', fontSize: '1.1em',
      }}>
        載入失敗：{error}
      </div>
    );
  }

  const nodeCount = nodes.length;
  const entryCount = entries?.length || 0;

  return (
    <>
      <div style={{ position: 'absolute', inset: 0 }}>
        <GraphCanvas
          ref={canvasRef}
          onRender={onRender}
          onHover={handleHover}
          onClick={onCanvasClick}
        />
      </div>

      <FloatingToolbar
        canvasRef={canvasRef}
        nodeCount={nodeCount}
        entryCount={entryCount}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />

      {selectedVtuber && (
        <VtuberDetailPanel
          entry={selectedVtuber}
          onClose={() => setSelectedVtuber(null)}
        />
      )}
    </>
  );
}

const spinnerStyle = {
  width: 32, height: 32,
  border: '3px solid rgba(255,255,255,0.15)',
  borderTopColor: '#38bdf8',
  borderRadius: '50%',
  animation: 'vtaxonSpin 0.8s linear infinite',
  margin: '0 auto',
};
