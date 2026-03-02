import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';

/**
 * Canvas element with d3-zoom for pan/zoom.
 * Delegates all drawing to the onRender callback.
 */
const GraphCanvas = forwardRef(function GraphCanvas({
  onRender,
  onHover,
  onClick,
  minZoom = 0.05,
  maxZoom = 4,
}, ref) {
  const canvasRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const zoomRef = useRef(null);
  const rafRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  // Use refs for callbacks to avoid stale closures in RAF
  const onRenderRef = useRef(onRender);
  onRenderRef.current = onRender;
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  // Stable requestRender — always uses latest onRender via ref
  const requestRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onRenderRef.current?.(ctx, transformRef.current, sizeRef.current);
    });
  }, []);

  // Convert screen coords to world coords
  const screenToWorld = useCallback((screenX, screenY) => {
    const t = transformRef.current;
    return {
      x: (screenX - t.x) / t.scale,
      y: (screenY - t.y) / t.scale,
    };
  }, []);

  // Re-render when onRender changes (new data / hover state)
  useEffect(() => {
    requestRender();
  }, [onRender, requestRender]);

  // Resize observer — handle DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      sizeRef.current = { width: w * dpr, height: h * dpr };
      requestRender();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();

    return () => ro.disconnect();
  }, [requestRender]);

  // d3-zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomBehavior = d3zoom()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event) => {
        const t = event.transform;
        transformRef.current = { x: t.x, y: t.y, scale: t.k };
        requestRender();
      });

    zoomRef.current = zoomBehavior;
    const sel = select(canvas);
    sel.call(zoomBehavior);

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      sel.on('.zoom', null);
    };
  }, [minZoom, maxZoom, requestRender]);

  // Mouse move → hover
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      onHoverRef.current?.(world.x, world.y, e);
    };

    canvas.addEventListener('mousemove', handler);
    return () => canvas.removeEventListener('mousemove', handler);
  }, [screenToWorld]);

  // Click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      onClickRef.current?.(world.x, world.y, e);
    };

    canvas.addEventListener('click', handler);
    return () => canvas.removeEventListener('click', handler);
  }, [screenToWorld]);

  // Imperative API
  useImperativeHandle(ref, () => ({
    requestRender,

    getTransform: () => transformRef.current,

    getCanvas: () => canvasRef.current,

    zoomIn() {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      select(canvas).transition().duration(300).call(
        zoomRef.current.scaleBy, 1.4,
      );
    },

    zoomOut() {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      select(canvas).transition().duration(300).call(
        zoomRef.current.scaleBy, 1 / 1.4,
      );
    },

    fitView(centerX = 0, centerY = 0, targetScale = 0.6) {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const w = sizeRef.current.width / dpr;
      const h = sizeRef.current.height / dpr;

      const tx = w / 2 - centerX * targetScale;
      const ty = h / 2 - centerY * targetScale;

      select(canvas).transition().duration(600).call(
        zoomRef.current.transform,
        zoomIdentity.translate(tx, ty).scale(targetScale),
      );
    },

    panTo(worldX, worldY, scale) {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const w = sizeRef.current.width / dpr;
      const h = sizeRef.current.height / dpr;
      const s = scale || transformRef.current.scale;

      const tx = w / 2 - worldX * s;
      const ty = h / 2 - worldY * s;

      select(canvas).transition().duration(600).call(
        zoomRef.current.transform,
        zoomIdentity.translate(tx, ty).scale(s),
      );
    },
  }), [requestRender]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'grab',
      }}
    />
  );
});

export default GraphCanvas;
