import type { LayoutNode } from '../../../types/graph';
import type { AnimatedPosition, DrawGraphState, LayoutEdge, Viewport } from './types';
import { RANK_COLORS } from '../colors';
import { EDGE_ALPHA, EDGE_GLOW_BLUR } from '../colors';
import { LOD_DOTS_ONLY } from './constants';
import { hexToRgba, edgeFlashAlpha, scaledFontSize } from './utils';

// ── Edge rendering ──
export function drawEdge(ctx: CanvasRenderingContext2D, edge: LayoutEdge, scale: number, state: DrawGraphState): void {
  const s = edge.source;
  const t = edge.target;

  // Skip edges TO split group nodes — their children draw from the grandparent instead
  if (t.data._isSplitGroup) return;

  // For edges FROM a split group, draw from the split group's parent (grandparent)
  // so the bezier curves naturally from the taxonomy node to the vtuber
  const effectiveSource = s.data._isSplitGroup && s.parent ? s.parent : s;
  const rc = RANK_COLORS[effectiveSource.data._rank ?? ''] || RANK_COLORS.ROOT;

  const isHighlighted = state.closeEdgePaths?.has(t.data._pathKey!);
  const flashA = isHighlighted ? edgeFlashAlpha(state) : 0;

  ctx.beginPath();
  const midY = (effectiveSource.y + t.y) / 2;
  ctx.moveTo(effectiveSource.x, effectiveSource.y);
  ctx.bezierCurveTo(effectiveSource.x, midY, t.x, midY, t.x, t.y);

  if (flashA > 0) {
    ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
    ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
    ctx.shadowBlur = 10 * flashA;
    ctx.shadowColor = 'rgba(34,197,94,0.7)';
  } else {
    const color = hexToRgba(rc.node, EDGE_ALPHA);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
    if (scale > LOD_DOTS_ONLY) {
      ctx.shadowBlur = EDGE_GLOW_BLUR;
      ctx.shadowColor = rc.glow;
    }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ── Grid connectors: stem + horizontal bar + vertical columns ──
export function drawGridConnectors(
  ctx: CanvasRenderingContext2D,
  nodes: LayoutNode[],
  scale: number,
  pm: Map<string, AnimatedPosition> | null | undefined,
  vp: Viewport,
  margin: number,
  state: DrawGraphState,
): void {
  // Group grid nodes by parent _pathKey
  const groups = new Map<string, { parent: LayoutNode; children: LayoutNode[] }>();
  for (const node of nodes) {
    if (!node.data._inGrid || !node.parent) continue;
    const parentKey = node.parent.data._pathKey!;
    if (!groups.has(parentKey)) groups.set(parentKey, { parent: node.parent, children: [] });
    groups.get(parentKey)!.children.push(node);
  }

  for (const [, group] of groups) {
    // If parent is a split group, draw the stem from its grandparent instead
    const parent = group.parent.data._isSplitGroup && group.parent.parent
      ? group.parent.parent : group.parent;
    const children = group.children;
    if (children.length === 0) continue;

    // Resolve animated positions
    const pp = pm?.get(parent.data._pathKey!);
    const px = pp ? pp.x : parent.x;
    const py = pp ? pp.y : parent.y;
    const barY = children[0].data._gridBarY!;

    // Collect unique column x positions & max y per column
    const colMap = new Map<number, number>(); // colX → maxY
    for (const child of children) {
      const cp = pm?.get(child.data._pathKey!);
      const cx = cp ? cp.x : child.x;
      const cy = cp ? cp.y : child.y;
      const prev = colMap.get(cx);
      if (prev === undefined || cy > prev) colMap.set(cx, cy);
    }

    const colXs = [...colMap.keys()].sort((a, b) => a - b);
    const minColX = colXs[0];
    const maxColX = colXs[colXs.length - 1];

    // Viewport cull: check if the grid connector bounding box overlaps the viewport
    const maxGridY = Math.max(...colMap.values());
    const gridLeft = minColX, gridRight = maxColX;
    const gridTop = Math.min(py, barY), gridBottom = maxGridY;
    const vpLeft = vp.x - margin, vpRight = vp.x + vp.w + margin;
    const vpTop = vp.y - margin, vpBottom = vp.y + vp.h + margin;
    if (gridRight < vpLeft || gridLeft > vpRight || gridBottom < vpTop || gridTop > vpBottom) continue;

    // Check if any child in this group is highlighted (edge flash)
    let groupHighlighted = false;
    if (state.closeEdgePaths) {
      for (const child of children) {
        if (state.closeEdgePaths.has(child.data._pathKey!)) {
          groupHighlighted = true;
          break;
        }
      }
    }
    const flashA = groupHighlighted ? edgeFlashAlpha(state) : 0;

    // Color from parent rank
    const rc = RANK_COLORS[parent.data._rank ?? ''] || RANK_COLORS.ROOT;

    if (flashA > 0) {
      ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
      ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
      ctx.shadowBlur = 10 * flashA;
      ctx.shadowColor = 'rgba(34,197,94,0.7)';
    } else {
      const lineColor = hexToRgba(rc.node, 0.15);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
      ctx.shadowBlur = 0;
    }

    // 1. Stem: parent center → bar midpoint (bezier)
    const barMidPt = (minColX + maxColX) / 2;
    ctx.beginPath();
    const midStemY = (py + barY) / 2;
    ctx.moveTo(px, py);
    ctx.bezierCurveTo(px, midStemY, barMidPt, midStemY, barMidPt, barY);
    ctx.stroke();

    // 2. Horizontal bar: minColX → maxColX at barY
    ctx.beginPath();
    ctx.moveTo(minColX, barY);
    ctx.lineTo(maxColX, barY);
    ctx.stroke();

    // 3. Vertical columns: from barY down to lowest child in that column
    for (const [colX, maxY] of colMap) {
      ctx.beginPath();
      ctx.moveTo(colX, barY);
      ctx.lineTo(colX, maxY);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }
}

// ── Breed grid connectors: per-row horizontal bars for multi-row breed layout ──
export function drawBreedGridConnectors(
  ctx: CanvasRenderingContext2D,
  nodes: LayoutNode[],
  scale: number,
  pm: Map<string, AnimatedPosition> | null | undefined,
  vp: Viewport,
  margin: number,
  state: DrawGraphState,
): void {
  // Group breed-grid nodes by parent
  const groups = new Map<string, { parent: LayoutNode; children: LayoutNode[] }>();
  for (const node of nodes) {
    if (!node.data._inBreedGrid || !node.parent) continue;
    const pk = node.parent.data._pathKey!;
    if (!groups.has(pk)) groups.set(pk, { parent: node.parent, children: [] });
    groups.get(pk)!.children.push(node);
  }

  for (const [, { parent, children }] of groups) {
    if (children.length === 0) continue;

    // Resolve animated positions
    const pp = pm?.get(parent.data._pathKey!);
    const px = pp ? pp.x : parent.x;
    const py = pp ? pp.y : parent.y;

    // Group children by row
    const rowMap = new Map<number, Array<{ x: number; y: number; node: LayoutNode }>>();
    for (const child of children) {
      const row = child.data._breedGridRow || 0;
      const cp = pm?.get(child.data._pathKey!);
      const cx = cp ? cp.x : child.x;
      const cy = cp ? cp.y : child.y;
      if (!rowMap.has(row)) rowMap.set(row, []);
      rowMap.get(row)!.push({ x: cx, y: cy, node: child });
    }

    // Viewport culling
    const allMinY = py;
    let allMinX = Infinity, allMaxX = -Infinity, allMaxY = -Infinity;
    for (const [, rowChildren] of rowMap) {
      for (const c of rowChildren) {
        allMinX = Math.min(allMinX, c.x);
        allMaxX = Math.max(allMaxX, c.x);
        allMaxY = Math.max(allMaxY, c.y);
      }
    }
    if (allMaxX < vp.x - margin || allMinX > vp.x + vp.w + margin ||
        allMaxY < vp.y - margin || allMinY > vp.y + vp.h + margin) continue;

    // Check flash state
    let groupHighlighted = false;
    if (state.closeEdgePaths) {
      for (const child of children) {
        if (state.closeEdgePaths.has(child.data._pathKey!)) {
          groupHighlighted = true;
          break;
        }
      }
    }
    const flashA = groupHighlighted ? edgeFlashAlpha(state) : 0;

    const rc = RANK_COLORS[parent.data._rank ?? ''] || RANK_COLORS.ROOT;
    if (flashA > 0) {
      ctx.strokeStyle = hexToRgba('#22c55e', 0.3 + 0.45 * flashA);
      ctx.lineWidth = (1.2 + 1.8 * flashA) / Math.max(scale, 0.3);
      ctx.shadowBlur = 10 * flashA;
      ctx.shadowColor = 'rgba(34,197,94,0.7)';
    } else {
      ctx.strokeStyle = hexToRgba(rc.node, 0.15);
      ctx.lineWidth = 1.2 / Math.max(scale, 0.3);
      ctx.shadowBlur = 0;
    }

    const sortedRows = [...rowMap.keys()].sort((a, b) => a - b);

    // Estimate breed box half-height from label lines at current scale
    const breedBoxHalfH = (node: LayoutNode): number => {
      const lines = node.data._labelLines || [''];
      const fs = scaledFontSize(11, scale);
      const lh = fs * 1.25;
      const textH = fs + (lines.length - 1) * lh;
      return Math.max(24, textH + 10) / 2;
    };

    // Precompute each row's bar info — barY clears the tallest breed box in the row
    const rowBars = sortedRows.map(rowIdx => {
      const rowChildren = rowMap.get(rowIdx)!;
      const xs = rowChildren.map(c => c.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const maxHalfH = Math.max(...rowChildren.map(c => breedBoxHalfH(c.node)));
      const barY = Math.min(...rowChildren.map(c => c.y)) - maxHalfH - 8;
      return { rowIdx, rowChildren, minX, maxX, barY };
    });

    // Trunk X = left of leftmost breed label edge (avoid overlapping labels)
    let maxLeftLabelW = 0;
    for (const { rowChildren, minX } of rowBars) {
      for (const c of rowChildren) {
        if (c.x === minX) {
          maxLeftLabelW = Math.max(maxLeftLabelW, c.node.data._labelHalfW || 40);
        }
      }
    }
    const globalMinX = Math.min(...rowBars.map(r => r.minX));
    const trunkX = globalMinX - maxLeftLabelW - 15;

    // 1. Bezier stem: parent → trunk top (first row's bar Y)
    if (rowBars.length > 0) {
      const firstBar = rowBars[0];
      ctx.beginPath();
      const midY = (py + firstBar.barY) / 2;
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px, midY, trunkX, midY, trunkX, firstBar.barY);
      ctx.stroke();
    }

    // 2. Vertical trunk connecting all rows' bars
    if (rowBars.length > 1) {
      const lastBar = rowBars[rowBars.length - 1];
      ctx.beginPath();
      ctx.moveTo(trunkX, rowBars[0].barY);
      ctx.lineTo(trunkX, lastBar.barY);
      ctx.stroke();
    }

    // 3. Per-row: horizontal bar from trunk to rightmost breed + vertical drops
    for (const { rowChildren, maxX, barY } of rowBars) {
      ctx.beginPath();
      ctx.moveTo(trunkX, barY);
      ctx.lineTo(maxX, barY);
      ctx.stroke();

      // Vertical drops to each breed
      for (const child of rowChildren) {
        ctx.beginPath();
        ctx.moveTo(child.x, barY);
        ctx.lineTo(child.x, child.y);
        ctx.stroke();
      }
    }

    ctx.shadowBlur = 0;
  }
}
