/**
 * Main graph drawing entry point + node dispatch.
 */
import type { LayoutNode } from '../../../types/graph';
import type { DrawGraphState, DrawTransform, DrawCanvasSize, LayoutEdge, Viewport } from './types';
import { BG_COLOR, BG_CENTER } from '../colors';
import { isInViewport } from './utils';
import { drawEdge, drawGridConnectors, drawBreedGridConnectors } from './edges';
import { drawTaxonomyNode } from './node-taxonomy';
import { drawSpeciesNode } from './node-species';
import { drawVtuberNode, drawDotVtuberNode } from './node-vtuber';
import { drawBreedNode } from './node-breed';

// ── Node dispatch ──
function drawNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;

  // Split group nodes are invisible branch points — only edges pass through
  if (d._isSplitGroup) return;

  if (d._vtuber && d._visualTier === 'dot') {
    drawDotVtuberNode(ctx, node, scale, state);
  } else if (d._vtuber) {
    drawVtuberNode(ctx, node, scale, state);
  } else if (d._rank === 'BREED') {
    drawBreedNode(ctx, node, scale, state);
  } else if (d._rank === 'SPECIES' || d._rank === 'SUBSPECIES' || d._rank === 'FORM' || d._rank === 'F_SPECIES') {
    drawSpeciesNode(ctx, node, scale, state);
  } else {
    drawTaxonomyNode(ctx, node, scale, state);
  }
}

// ── Main draw ──
export function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  transform: DrawTransform,
  canvasSize: DrawCanvasSize,
  state: DrawGraphState,
): void {
  const { scale } = transform;
  const dpr = window.devicePixelRatio || 1;
  const w = canvasSize.width / dpr;
  const h = canvasSize.height / dpr;

  // Clear + background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  // Center radial gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
  grad.addColorStop(0, BG_CENTER);
  grad.addColorStop(1, BG_COLOR);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Draw star field
  if (state.starField) {
    ctx.drawImage(state.starField, 0, 0, w, h);
  }

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(scale, scale);

  // Compute viewport in world coordinates
  const vp: Viewport = {
    x: -transform.x / scale,
    y: -transform.y / scale,
    w: w / scale,
    h: h / scale,
  };
  const margin = 150;

  const pm = state.positionMap;

  // ── Edges (skip grid children — they use drawGridConnectors / drawBreedGridConnectors) ──
  for (const edge of edges) {
    if (edge.target.data._inGrid) continue;
    if (edge.target.data._inBreedGrid) continue;

    // Use animated positions if available
    const sp = pm?.get(edge.source.data._pathKey!);
    const tp = pm?.get(edge.target.data._pathKey!);
    const origSx = edge.source.x, origSy = edge.source.y;
    const origTx = edge.target.x, origTy = edge.target.y;
    if (sp) { edge.source.x = sp.x; edge.source.y = sp.y; }
    if (tp) { edge.target.x = tp.x; edge.target.y = tp.y; }

    const sx = edge.source.x, sy = edge.source.y;
    const tx = edge.target.x, ty = edge.target.y;
    if (!isInViewport(sx, sy, vp, margin) && !isInViewport(tx, ty, vp, margin)) {
      if (sp) { edge.source.x = origSx; edge.source.y = origSy; }
      if (tp) { edge.target.x = origTx; edge.target.y = origTy; }
      continue;
    }
    drawEdge(ctx, edge, scale, state);
    if (sp) { edge.source.x = origSx; edge.source.y = origSy; }
    if (tp) { edge.target.x = origTx; edge.target.y = origTy; }
  }

  // ── Grid connectors (stem + bar + columns) ──
  drawGridConnectors(ctx, nodes, scale, pm, vp, margin, state);

  // ── Breed grid connectors (per-row bars for multi-row breed arrangement) ──
  drawBreedGridConnectors(ctx, nodes, scale, pm, vp, margin, state);

  // ── Nodes ──
  for (const node of nodes) {
    const ap = pm?.get(node.data._pathKey!);
    const origX = node.x, origY = node.y;
    if (ap) { node.x = ap.x; node.y = ap.y; }
    if (!isInViewport(node.x, node.y, vp, margin)) {
      if (ap) { node.x = origX; node.y = origY; }
      continue;
    }
    drawNode(ctx, node, scale, state);
    if (ap) { node.x = origX; node.y = origY; }
  }

  ctx.restore();
}
