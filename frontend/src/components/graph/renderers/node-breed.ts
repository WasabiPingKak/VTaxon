import type { LayoutNode } from '../../../types/graph';
import type { DrawGraphState } from './types';
import { RANK_COLORS, LABEL_COLOR, LABEL_DIM } from '../colors';
import { LOD_DOTS_ONLY, BREED_MAX_RECT_W } from './constants';
import {
  collapsedRectWeight, hexToRgba, fontStr, scaledFontSize,
  drawWrappedText, roundedRect,
} from './utils';
import { drawBudgetBadge } from './node-species';

// ── Breed node (rounded rect, like species) ──
export function drawBreedNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;
  const rc = RANK_COLORS.BREED;
  const hovered = state.hoveredNode === node;
  const lines = d._labelLines || [d._nameZh || d._name || ''];
  const fs = scaledFontSize(11, scale);
  const lineHeight = fs * 1.25;

  // Collapsed weight boost
  const cw = d._hasHiddenChildren ? collapsedRectWeight(d._count, state.maxCount) : 0;

  // Dynamic size: width from widest line (capped), height from line count
  ctx.font = fontStr(11, scale, 'bold');
  const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
  const baseW = Math.min(Math.max(60, widestLine + 20), BREED_MAX_RECT_W);
  const textBlockH = fs + (lines.length - 1) * lineHeight;
  const baseH = Math.max(24, textBlockH + 10);
  const w = baseW + cw * 80;   // up to +80px wider
  const h = baseH + cw * 34;   // up to +34px taller
  d._nodeWidth = w;
  d._nodeHeight = h;
  const r = 5 + cw * 3;
  const x = node.x - w / 2, y = node.y - h / 2;

  // Filled contour bands (outermost first)
  if (cw > 0) {
    const layers = Math.round(1 + cw * 3);
    for (let i = layers; i >= 1; i--) {
      const off = i * 6;
      const alpha = (0.12 - i * 0.02) * cw;
      if (alpha <= 0) continue;
      ctx.beginPath();
      roundedRect(ctx, x - off, y - off, w + off * 2, h + off * 2, r + off * 0.6);
      ctx.fillStyle = hexToRgba(rc.node, alpha);
      ctx.fill();
    }
  }

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);
  ctx.fillStyle = cw > 0 ? hexToRgba(rc.node, 0.15 + cw * 0.15) : '#1a2433';

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 22 : (6 + cw * 14);
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = hexToRgba(rc.node, 0.3 + cw * 0.4);
  ctx.lineWidth = 1 + cw * 2;
  ctx.stroke();

  // Collapsed indicator
  if (d._hasHiddenChildren) {
    const plusSz = scaledFontSize(8, scale);
    ctx.beginPath();
    ctx.arc(node.x + w / 2 + 6, node.y - h / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = `${plusSz}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', node.x + w / 2 + 6, node.y - h / 2 + 4);
  }

  if (scale > LOD_DOTS_ONLY) {
    // Multi-line main label inside rect
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = fontStr(11, scale, 'bold');
    const textStartY = node.y - textBlockH / 2;
    drawWrappedText(ctx, lines, node.x, textStartY, lineHeight);

    // Count badge below rect (enhanced when collapsed with weight)
    const count = d._count || 0;
    let bottomY = y + h;
    if (count > 0) {
      const countFsPx = cw > 0 ? 9 + cw * 5 : 9;  // up to 14px
      const countFs = scaledFontSize(countFsPx, scale);
      ctx.font = fontStr(countFsPx, scale, cw > 0 ? 'bold' : '');
      ctx.fillStyle = cw > 0 ? rc.node : LABEL_DIM;
      ctx.textBaseline = 'top';
      const countY = y + h + countFs * 0.3;
      ctx.fillText(`${count}`, node.x, countY);
      bottomY = countY + countFs;
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}
