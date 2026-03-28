import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { select, type Selection } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import 'd3-transition'; // side-effect import — adds .transition() to Selection

interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface CanvasSizeRef {
  width: number;
  height: number;
}

type RenderCallback = (
  ctx: CanvasRenderingContext2D,
  transform: CanvasTransform,
  size: CanvasSizeRef,
) => void;

type HoverCallback = (worldX: number, worldY: number, event: MouseEvent) => void;
type ClickCallback = (worldX: number, worldY: number, event: MouseEvent) => void;

interface GraphCanvasProps {
  onRender?: RenderCallback;
  onHover?: HoverCallback;
  onClick?: ClickCallback;
  minZoom?: number;
  maxZoom?: number;
}

export interface GraphCanvasHandle {
  requestRender: () => void;
  getTransform: () => CanvasTransform;
  getCanvas: () => HTMLCanvasElement | null;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: (centerX?: number, centerY?: number, targetScale?: number) => void;
  panTo: (
    worldX: number, worldY: number, scale?: number | null,
    leftInset?: number, rightInset?: number, bottomInset?: number, topInset?: number,
  ) => void;
  fitBounds: (
    bMinX: number, bMinY: number, bMaxX: number, bMaxY: number, padding?: number,
    leftInset?: number, rightInset?: number, bottomInset?: number, topInset?: number,
  ) => void;
}

/**
 * Canvas element with d3-zoom for pan/zoom.
 * Delegates all drawing to the onRender callback.
 */
const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas({
  onRender,
  onHover,
  onClick,
  minZoom = 0.05,
  maxZoom = 4,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformRef = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 });
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef<CanvasSizeRef>({ width: 0, height: 0 });

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
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onRenderRef.current?.(ctx, transformRef.current, sizeRef.current);
    });
  }, []);

  // Convert screen coords to world coords
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
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
      const rect = canvas.parentElement!.getBoundingClientRect();
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
    ro.observe(canvas.parentElement!);
    resize();

    return () => ro.disconnect();
  }, [requestRender]);

  // d3-zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomBehavior = d3zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event) => {
        const t: ZoomTransform = event.transform;
        transformRef.current = { x: t.x, y: t.y, scale: t.k };
        requestRender();
      });

    zoomRef.current = zoomBehavior;
    const sel = select(canvas);
    sel.call(zoomBehavior as unknown as Parameters<typeof sel.call>[0]);

    const preventContext = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventContext);

    return () => {
      sel.on('.zoom', null);
      canvas.removeEventListener('contextmenu', preventContext);
    };
  }, [minZoom, maxZoom, requestRender]);

  // Mouse move → hover
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: MouseEvent) => {
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

    const handler = (e: MouseEvent) => {
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
      const sel = select(canvas);
      sel.interrupt();
      sel.transition().duration(300).call(
        zoomRef.current.scaleBy as unknown as Parameters<ReturnType<typeof sel.transition>['call']>[0], 1.4,
      );
    },

    zoomOut() {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      const sel = select(canvas);
      sel.interrupt();
      sel.transition().duration(300).call(
        zoomRef.current.scaleBy as unknown as Parameters<ReturnType<typeof sel.transition>['call']>[0], 1 / 1.4,
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

      const sel = select(canvas);
      sel.interrupt();
      sel.transition().duration(600).call(
        zoomRef.current.transform as unknown as Parameters<ReturnType<typeof sel.transition>['call']>[0],
        zoomIdentity.translate(tx, ty).scale(targetScale),
      );
    },

    panTo(worldX, worldY, scale, leftInset = 0, rightInset = 0, bottomInset = 0, topInset = 0) {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const w = sizeRef.current.width / dpr;
      const h = sizeRef.current.height / dpr;
      const s = scale || transformRef.current.scale;

      // Center within available area (excluding insets)
      const cx = leftInset + (w - leftInset - rightInset) / 2;
      const cy = topInset + (h - topInset - bottomInset) / 2;
      const tx = cx - worldX * s;
      const ty = cy - worldY * s;

      const sel = select(canvas);
      sel.interrupt();
      sel.transition().duration(600).call(
        zoomRef.current.transform as unknown as Parameters<ReturnType<typeof sel.transition>['call']>[0],
        zoomIdentity.translate(tx, ty).scale(s),
      );
    },

    fitBounds(bMinX, bMinY, bMaxX, bMaxY, padding = 80, leftInset = 0, rightInset = 0, bottomInset = 0, topInset = 0) {
      const canvas = canvasRef.current;
      if (!canvas || !zoomRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const w = sizeRef.current.width / dpr;
      const h = sizeRef.current.height / dpr;

      // Available area excludes insets
      const availW = w - leftInset - rightInset;
      const availH = h - topInset - bottomInset;
      const boundsW = (bMaxX - bMinX) + padding * 2;
      const boundsH = (bMaxY - bMinY) + padding * 2;

      const scaleX = availW / boundsW;
      const scaleY = availH / boundsH;
      let targetScale = Math.min(scaleX, scaleY);
      targetScale = Math.max(targetScale, minZoom);
      targetScale = Math.min(targetScale, 1.5);

      const centerX = (bMinX + bMaxX) / 2;
      const centerY = (bMinY + bMaxY) / 2;

      // Center content within the available area
      const availCenterScreenX = leftInset + availW / 2;
      const availCenterScreenY = topInset + availH / 2;
      const tx = availCenterScreenX - centerX * targetScale;
      const ty = availCenterScreenY - centerY * targetScale;

      const sel = select(canvas);
      sel.interrupt();
      sel.transition().duration(800).call(
        zoomRef.current.transform as unknown as Parameters<ReturnType<typeof sel.transition>['call']>[0],
        zoomIdentity.translate(tx, ty).scale(targetScale),
      );
    },
  }), [requestRender, minZoom]);

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
