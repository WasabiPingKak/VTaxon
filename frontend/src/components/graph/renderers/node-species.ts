import type { LayoutNode } from '../../../types/graph';
import type { DrawGraphState } from './types';
import { RANK_COLORS, RANK_LABELS, LABEL_COLOR, LABEL_DIM } from '../colors';
import { LOD_DOTS_ONLY, SPECIES_MAX_RECT_W } from './constants';
import {
  collapsedRectWeight, hexToRgba, fontStr, scaledFontSize,
  drawWrappedText, roundedRect,
} from './utils';
import { stripAuthor } from '../../../lib/treeUtils';

// ── Budget badge: "+N 位" shown below node labels when hidden vtubers exist ──
export function drawBudgetBadge(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, bottomY: number, state: DrawGraphState): void {
  const d = node.data;
  d._budgetBadgeBounds = undefined; // reset each frame
  if (!d._hiddenVtuberCount || d._hiddenVtuberCount <= 0) return;
  if (scale <= LOD_DOTS_ONLY) return;

  const text = `+${d._hiddenVtuberCount} 位`;
  const fs = scaledFontSize(9, scale);
  ctx.font = fontStr(9, scale);
  const textW = ctx.measureText(text).width;
  const padX = 5 / Math.max(scale, 0.55);
  const padY = 2 / Math.max(scale, 0.55);
  const w = textW + padX * 2;
  const h = fs + padY * 2;
  const r = h / 2;
  const x = node.x - w / 2;
  const y = bottomY + fs * 0.3;

  // Store bounds for hit-testing (world coordinates, unscaled)
  d._budgetBadgeBounds = { x, y, w, h };

  // Check if the badge itself is hovered (independent from parent node hover)
  const isHovered = state.hoveredBadgeNode === node;

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);

  if (isHovered) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(56,189,248,0.5)';
    ctx.fillStyle = 'rgba(56,189,248,0.15)';
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = isHovered ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = isHovered ? 1 : 0.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isHovered ? '#38bdf8' : LABEL_DIM;
  ctx.fillText(text, node.x, y + h / 2);
}

// ── Species node (rounded rect) ──
export function drawSpeciesNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;
  const rc = RANK_COLORS[d._rank ?? ''] || RANK_COLORS.SPECIES;
  const hovered = state.hoveredNode === node;
  const lines = d._labelLines || [d._nameZh || d._name || ''];
  const fs = scaledFontSize(12, scale);
  const lineHeight = fs * 1.25;

  // Collapsed weight boost: scale rect size when hiding many children
  const cw = d._hasHiddenChildren ? collapsedRectWeight(d._count, state.maxCount) : 0;

  // Dynamic size: width from widest line (capped), height from line count
  ctx.font = fontStr(12, scale, 'bold');
  const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
  const baseW = Math.min(Math.max(70, widestLine + 24), SPECIES_MAX_RECT_W);
  const textBlockH = fs + (lines.length - 1) * lineHeight;
  const baseH = Math.max(26, textBlockH + 12);
  const w = baseW + cw * 100;  // up to +100px wider
  const h = baseH + cw * 40;   // up to +40px taller
  d._nodeWidth = w;
  d._nodeHeight = h;
  const r = 6 + cw * 4;        // rounder corners when bigger
  const x = node.x - w / 2, y = node.y - h / 2;

  // Filled contour bands (outermost first, so inner layers paint over)
  if (cw > 0) {
    const layers = Math.round(1 + cw * 3);  // 1~4 layers
    for (let i = layers; i >= 1; i--) {
      const off = i * 6;  // 6px per layer
      const alpha = (0.12 - i * 0.02) * cw;  // outermost ~0.04, inner ~0.10
      if (alpha <= 0) continue;
      ctx.beginPath();
      roundedRect(ctx, x - off, y - off, w + off * 2, h + off * 2, r + off * 0.6);
      ctx.fillStyle = hexToRgba(rc.node, alpha);
      ctx.fill();
    }
  }

  ctx.beginPath();
  roundedRect(ctx, x, y, w, h, r);
  // Deep rank-tinted fill (方案 E)
  ctx.fillStyle = cw > 0 ? hexToRgba(rc.node, 0.15 + cw * 0.15) : '#1a2433';

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 22 : (6 + cw * 14);  // up to 20
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = hexToRgba(rc.node, 0.3 + cw * 0.4);  // up to 0.7
  ctx.lineWidth = 1 + cw * 2;                             // up to 3
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
    ctx.font = fontStr(12, scale, 'bold');
    const textStartY = node.y - textBlockH / 2;
    drawWrappedText(ctx, lines, node.x, textStartY, lineHeight);

    // Latin name below rect — show full name
    ctx.fillStyle = LABEL_DIM;
    ctx.font = fontStr(10, scale, '', 'italic');
    const latinFs = scaledFontSize(10, scale);
    const latinY = node.y + h / 2 + latinFs * 0.8;
    ctx.fillText(stripAuthor(d._name) || '', node.x, latinY);

    // Rank label + count below Latin name (enhanced when collapsed with weight)
    const count = d._count || 0;
    const rankLabel = RANK_LABELS[d._rank ?? ''] || '';
    let bottomY = latinY + latinFs;
    if (rankLabel) {
      const countFsPx = cw > 0 ? 10 + cw * 5 : 10;  // up to 15px
      ctx.font = fontStr(countFsPx, scale, cw > 0 ? 'bold' : '');
      ctx.fillStyle = cw > 0 ? rc.node : LABEL_DIM;
      const rankY = latinY + latinFs + 2;
      ctx.fillText(`${rankLabel} · ${count}`, node.x, rankY);
      bottomY = rankY + scaledFontSize(countFsPx, scale);
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}
