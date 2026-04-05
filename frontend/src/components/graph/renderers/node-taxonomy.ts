import type { LayoutNode } from '../../../types/graph';
import type { DrawGraphState } from './types';
import { RANK_COLORS, RANK_LABELS, LABEL_COLOR, LABEL_DIM } from '../colors';
import { LOD_DOTS_ONLY } from './constants';
import { taxonomyNodeRadius, fontStr, scaledFontSize } from './utils';
import { drawBudgetBadge } from './node-species';

// ── Taxonomy node (circle) ──
export function drawTaxonomyNode(ctx: CanvasRenderingContext2D, node: LayoutNode, scale: number, state: DrawGraphState): void {
  const d = node.data;
  const rc = RANK_COLORS[d._rank ?? ''] || RANK_COLORS.ROOT;
  const count = d._count || 0;
  const r = taxonomyNodeRadius(count, state.maxCount || 0);
  const hovered = state.hoveredNode === node;

  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
  ctx.fillStyle = rc.node;

  if (scale > LOD_DOTS_ONLY) {
    ctx.shadowBlur = hovered ? 22 : 10;
    ctx.shadowColor = rc.glow;
  }
  ctx.fill();
  ctx.shadowBlur = 0;

  if (scale > LOD_DOTS_ONLY) {
    // Name label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = fontStr(12, scale, 'bold');
    const fs = scaledFontSize(12, scale);
    const nameY = node.y + r + fs * 0.3;
    ctx.fillText(d._nameZh || d._name || '', node.x, nameY);

    // Rank label + count
    const rankLabel = RANK_LABELS[d._rank ?? ''] || '';
    let bottomY = nameY + fs;
    if (rankLabel) {
      ctx.font = fontStr(10, scale);
      ctx.fillStyle = LABEL_DIM;
      const rankY = nameY + fs + 2;
      ctx.fillText(`${rankLabel} · ${count}`, node.x, rankY);
      bottomY = rankY + scaledFontSize(10, scale);
    }

    // Budget badge
    drawBudgetBadge(ctx, node, scale, bottomY, state);
  }
}
